import io from 'socket.io';
import CharacterDef, {
    Skill, expToLevel, ExperienceDrop, SkillDef, skillName,
} from '../../common/definitions/CharacterDef';
import WorldManager from '../managers/WorldManager';
import Unit, { UnitState } from './Unit';
import { TilePoint, Point } from '../../common/Point';
import Map2D from '../../common/Map2D';
import Chunk from './Chunk';
import InventoryManager from './Inventory';
import CharacterEntity from '../entities/Character.entity';
import {
    PacketHeader, InventoryPacket, ChunkListPacket, InventorySwapPacket, ResponsePacket, InventoryUsePacket,
    PointPacket, TargetPacket, LootPacket, InventoryDropPacket, Packet, SkillsPacket, ExpDropPacket, LevelupPacket, BooleanPacket, InteractPacket,
} from '../../common/Packet';
import ChunkDef from '../../common/definitions/ChunkDef';
import IModel from './IModel';
import Client from './Client';
import GroundItem from './GroundItem';
import SkillEntity from '../entities/Skill.entity';
import { CombatStatsDef, CombatStyle } from '../../common/definitions/UnitDef';
import Attack, { calcCombatExp } from './Attack';
import Interactable from './Interactable';
import { metricsEmitter } from '../metrics/metrics';

const metrics = metricsEmitter();

declare interface Player extends Unit {
    // unit
    emit(event: 'updated', self: Player): boolean;
    emit(event: 'tick', self: Player): boolean;
    emit(event: 'damaged', self: Player, dmg: number, attacker: Unit): boolean;
    emit(event: 'death', self: Player, dmg: number, attacker: Unit): boolean;
    emit(event: 'attack', self: Player, attack: Attack, dmg: number): boolean;

    on(event: 'updated', listener: (self: Player) => void): this;
    on(event: 'tick', listener: (self: Player) => void): this;
    on(event: 'damaged', listener: (self: Player, dmg: number, attacker: Unit) => void): this;
    on(event: 'death', listener: (self: Player, dmg: number, attacker: Unit) => void): this;
    on(event: 'attack', listener: (self: Player, attack: Attack, dmg: number) => void): this;

    // player
    emit(event: 'saved', self: Player): boolean;
    emit(event: 'levelup', self: Player, skill: SkillDef): boolean;

    on(event: 'saved', listener: (self: Player) => void): this;
    on(event: 'levelup', listener: (self: Player, skill: SkillDef) => void): this;
}

class Player extends Unit implements IModel {
    public isPlayer = true;
    private socket: io.Socket;
    protected data: CharacterDef;
    private entity: CharacterEntity;
    public bags: InventoryManager;
    public bank: InventoryManager;
    public loadedChunks: Map2D<number, number, Chunk> = new Map2D();
    public visibleGroundItems: Map<string, GroundItem> = new Map();
    private lootTarget: GroundItem;
    private interactTarget: Interactable;
    public get skills(): SkillEntity[] { return this.entity.skills; }
    public lastHarvestTick: number = 0;

    public constructor(world: WorldManager, entity: CharacterEntity, client: Client) {
        super(world, entity.toNet());
        this.entity = entity;

        this.updateCombatStats();

        this.data.autoRetaliate = this.entity.autoRetaliate;
        this.socket = client.socket;
        this.data.model = 'human'; // TODO: get from race
        this.data.running = this.entity.running;
        this.bags = new InventoryManager(this.world, entity.bags);
        this.bank = new InventoryManager(this.world, entity.bank);

        this.on('attack', (self, attack, dmg) => this.onAttack(self, attack, dmg));
        this.on('damaged', (self, dmg, attacker) => this.onDamaged(self, dmg, attacker));

        this.socket.on(PacketHeader.PLAYER_MOVETO, (packet) => this.handleMoveTo(packet));
        this.socket.on(PacketHeader.PLAYER_TARGET, (packet) => this.handleTarget(packet));
        this.socket.on(PacketHeader.PLAYER_LOOT, (packet) => this.handleLoot(packet));
        this.socket.on(PacketHeader.INVENTORY_SWAP, (packet) => this.handleInventorySwap(packet));
        this.socket.on(PacketHeader.INVENTORY_USE, (packet) => this.handleInventoryUse(packet));
        this.socket.on(PacketHeader.INVENTORY_DROP, (packet) => this.handleInventoryDrop(packet));
        this.socket.on(PacketHeader.PLAYER_SET_RUN, (packet) => this.handleSetRun(packet));
        this.socket.on(PacketHeader.PLAYER_INTERACT, (packet) => this.handleInteract(packet));
    }

    public async dispose(): Promise<void> {
        super.dispose();
        await this.save();
        this.currentChunk.players.delete(this.data.id);
    }

    public send(header: PacketHeader, packet: Packet): void {
        this.socket.emit(header, packet);
    }

    public toNet(): CharacterDef {
        this.data.interacting = this.state === UnitState.INTERACTING;
        return this.data;
    }

    private handleMoveTo(packet: PointPacket): void {
        this.data.target = '';
        this.moveTo(packet);
    }

    private handleTarget(packet: TargetPacket): void {
        const tar = this.world.units.getUnit(packet.target);
        if (tar) {
            this.attackUnit(tar);
        }
    }

    private handleLoot(packet: LootPacket): void {
        const gi = this.world.ground.getItem(packet.uuid);
        if (gi) {
            this.pickUpItem(gi);
        }
    }

    private handleInventorySwap(packet: InventorySwapPacket): void {
        this.bags.swap(packet.slotA, packet.slotB);
        this.socket.emit(PacketHeader.INVENTORY_SWAP, <ResponsePacket>{
            success: true,
            message: '',
        });
    }

    private handleInventoryUse(packet: InventoryUsePacket): void {
        const message = this.bags.useItems(packet.slotA, packet.slotB);
        this.socket.emit(PacketHeader.INVENTORY_USE, <ResponsePacket>{
            success: true,
            message,
        });
    }

    private handleInventoryDrop(packet: InventoryDropPacket): void {
        this.bags.dropItem(packet.slot, this.position);
        metrics.itemDropped();
        this.socket.emit(PacketHeader.INVENTORY_DROP, <ResponsePacket>{
            success: true,
            message: '',
        });
    }

    private handleSetRun(packet: BooleanPacket): void {
        this.data.running = packet.value;
    }

    private handleInteract(packet: InteractPacket): void {
        const chunk = this.world.chunks.getChunk(packet.ccx, packet.ccy);

        this.interactTarget = chunk.interactables.get(packet.uuid);
        if (this.interactTarget) {
            this._state = UnitState.INTERACTING;
            console.log('Pathing to interact at:', this.interactTarget.position);
            this.path = this.findPath(this.interactTarget.position);
        }
    }

    protected addToNewChunk(chunk: Chunk): void {
        chunk.players.set(this.data.id, this);
        chunk.allUnits.set(this.data.id, this);
        this.currentChunk = chunk;
    }

    protected removeFromOldChunk(): void {
        this.currentChunk.players.delete(this.data.id);
        this.currentChunk.allUnits.delete(this.data.id);
    }

    public pruneLoadedChunks(): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunks.chunkSize);
        const minX = ccx - this.world.chunkViewDist;
        const maxX = ccx + this.world.chunkViewDist;
        const minY = ccy - this.world.chunkViewDist;
        const maxY = ccy + this.world.chunkViewDist;
        for (const [x, y, _c] of this.loadedChunks) {
            if (x < minX || x > maxX || y < minY || y > maxY) {
                this.loadedChunks.delete(x, y);
            }
        }
    }

    public sendBagData(): void {
        this.socket.emit(PacketHeader.INVENTORY_FULL, <InventoryPacket> this.bags.toNet());
    }

    public sendSurroundingChunks(): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunks.chunkSize);
        const chunk = this.world.chunks.getChunk(ccx, ccy);
        const chunks: ChunkDef[] = [];
        for (const nbc of this.world.chunks.getNeighbours(chunk)) {
            // only send the player chunks they do not have loaded
            if (!this.loadedChunks.contains(nbc.x, nbc.y)) {
                chunks.push(nbc.toNet());
                this.loadedChunks.set(nbc.x, nbc.y, nbc); // mark as loaded
            }
        }
        this.pruneLoadedChunks(); // prune the chunks the player will unload
        this.socket.emit(PacketHeader.CHUNK_LOAD, <ChunkListPacket>{
            center: this.data.position,
            chunks,
        });
    }

    public respawn(): void {
        // could get new spawn points here, maybe unlock them
        // different per instance/map
        // graveyards?
        // drop inventory?
        this.teleport(new Point(0, 0));
        this.data.health = this.data.maxHealth;
        this.data.moveQueue = [];
        this.data.target = '';
        this._state = UnitState.IDLE;
        this.stopAttacking();
        this.updateCombatStats();
        this.emit('updated', this);
    }

    private onDamaged(self: Player, dmg: number, attacker: Unit): void {
        this.skills[Skill.HITPOINTS].current = this.data.health; // update hitpoints skill with current health
        // send the updated skill to the client
        this.send(PacketHeader.PLAYER_SKILLS, <SkillsPacket>{
            skills: [
                this.skills[Skill.HITPOINTS].toNet(),
            ],
        });
    }

    private onAttack(self: Player, attack: Attack, dmgDone: number): void {
        const drops = calcCombatExp(dmgDone, attack.attacker.combatStyle);
        for (const drop of drops) {
            this.awardExp(drop);
        }
    }

    public awardExp(drop: ExperienceDrop): void {
        const skill = this.entity.skills[drop.skill];
        const oldLevel = expToLevel(skill.experience);
        skill.experience += drop.amount * this.world.expModifier;
        const newLevel = expToLevel(skill.experience);
        metrics.playerExpGained(skillName(drop.skill), drop.amount);

        if (newLevel > oldLevel) { // level up has occured
            this.updateCombatStats();
            skill.current += 1;
            metrics.playerLevelup(skillName(drop.skill));
            this.send(PacketHeader.PLAYER_LEVELUP, <LevelupPacket>skill.toNet());
            this.emit('levelup', this, skill.toNet());
        }
        // update the clients skills tab
        this.send(PacketHeader.PLAYER_SKILLS, <SkillsPacket>{
            skills: [skill.toNet()],
        });
        // show an exp drop on the client
        this.send(PacketHeader.PLAYER_EXP_DROP, <ExpDropPacket>drop);
    }

    private updateCombatStats(): void {
        this.data.combatStyle = CombatStyle.MELEE_AGGRESSIVE; // TODO: get from entity

        this.setStats(<CombatStatsDef>{
            attack: expToLevel(this.entity.skills[Skill.ATTACK].experience),
            strength: expToLevel(this.entity.skills[Skill.STRENGTH].experience),
            defense: expToLevel(this.entity.skills[Skill.DEFENSE].experience),
            hitpoints: expToLevel(this.entity.skills[Skill.HITPOINTS].experience),
            magic: expToLevel(this.entity.skills[Skill.MAGIC].experience),
            ranged: expToLevel(this.entity.skills[Skill.RANGED].experience),
            prayer: expToLevel(this.entity.skills[Skill.PRAYER].experience),
            bonuses: {
                equipment: { // TODO: get this from equipment when implemented
                    attack: {
                        crush: 0,
                        magic: 0,
                        ranged: 0,
                        slash: 0,
                        stab: 0,
                    },
                    defense: {
                        crush: 0,
                        magic: 0,
                        ranged: 0,
                        slash: 0,
                        stab: 0,
                    },
                    other: {
                        magicDamage: 0,
                        meleeStr: 0,
                        prayer: 0,
                        rangedStr: 0,
                    },
                },
                potion: { // TODO: calc from active potions when implemented
                    attack: 0,
                    strength: 0,
                    defense: 0,
                    ranged: 0,
                    magic: 0,
                },
                prayer: { // TODO: calc from active prayers when active
                    attack: 1,
                    strength: 1,
                    defense: 1,
                    ranged: 1,
                    magic: 1,
                },
            },
        });

        this.skills[Skill.HITPOINTS].current = this.data.health; // update hitpoints skill with current health
    }

    public pickUpItem(gi: GroundItem): void {
        this._state = UnitState.LOOTING;
        this.lootTarget = gi;
        this.path = this.findPath(gi.position);
    }

    public teleport(pos: Point): void {
        super.teleport(pos);
        this.sendSurroundingChunks();
    }

    private tickLooting(): void {
        // check if we are on top of the item
        if (this.position.eq(Point.fromDef(this.lootTarget.position))) {
            // check if the item still exists on the ground
            if (this.world.ground.groundItemExists(this.lootTarget)) {
                if (this.bags.tryAddItem(this.lootTarget.item)) {
                    this.world.ground.removeItem(this.lootTarget.uuid);
                    metrics.itemPickedUp();
                    this.sendBagData();
                }
            }
            this._state = UnitState.IDLE;
        }
    }

    private tickInteracting(): void {
        if (this.position.dist(this.interactTarget.position) < 2) {
            console.log('Ticking interact');
            this.interactTarget.tickAction(this);
        }
    }

    public tick(): void {
        // cache last point
        const [ccxLast, ccyLast] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunks.chunkSize);
        super.tick();
        // check if the player moved between chunks
        const [ccxCurrent, ccyCurrent] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunks.chunkSize);
        if (ccxLast !== ccxCurrent || ccyLast !== ccyCurrent) {
            this.sendSurroundingChunks(); // ask the world to send new chunks
        }

        // TODO: personal loot for X ticks so other players cant steal immediately
        this.visibleGroundItems.clear();
        for (const gi of this.world.ground.inRange(this.position)) {
            this.visibleGroundItems.set(gi.item.uuid, gi);
        }

        switch (this.state) {
        case UnitState.LOOTING: this.tickLooting(); break;
        case UnitState.INTERACTING: this.tickInteracting(); break;
        default: break;
        }
    }

    private async save(): Promise<void> {
        await this.bags.save();
        await this.bank.save();
        this.entity.level = this.data.level;
        this.entity.posX = this.data.position.x;
        this.entity.posY = this.data.position.y;
        this.entity.running = this.data.running;
        this.entity.autoRetaliate = this.data.autoRetaliate;
        await this.entity.save();
    }
}

export default Player;
