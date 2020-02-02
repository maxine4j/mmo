import io from 'socket.io';
import CharacterDef, { Skill, expToLevel, ExperienceDrop } from '../../common/CharacterDef';
import WorldManager from '../managers/WorldManager';
import Unit, { UnitState, UnitManagerEvent } from './Unit';
import { TilePoint, Point } from '../../common/Point';
import Map2D from '../../common/Map2D';
import Chunk from './Chunk';
import InventoryManager from './Inventory';
import CharacterEntity from '../entities/Character.entity';
import {
    PacketHeader, InventoryPacket, ChunkListPacket, InventorySwapPacket, ResponsePacket, InventoryUsePacket,
    PointPacket, TargetPacket, LootPacket, InventoryDropPacket, Packet, SkillsPacket, ExpDropPacket, LevelupPacket, BooleanPacket,
} from '../../common/Packet';
import ChunkDef from '../../common/ChunkDef';
import IModel from './IModel';
import Client from './Client';
import GroundItem from './GroundItem';
import SkillEntity from '../entities/Skill.entity';
import { CombatStatsDef, CombatStyle } from '../../common/UnitDef';
import Attack, { calcCombatExp } from './Attack';

type PlayerManagerEvent = UnitManagerEvent | 'saved' | 'levelup';

export default class Player extends Unit implements IModel {
    private socket: io.Socket;
    protected data: CharacterDef;
    private entity: CharacterEntity;
    public bags: InventoryManager;
    public bank: InventoryManager;
    public loadedChunks: Map2D<number, number, Chunk> = new Map2D();
    public visibleGroundItems: Map<string, GroundItem> = new Map();
    private lootTarget: GroundItem;
    public get skills(): SkillEntity[] { return this.entity.skills; }

    public constructor(world: WorldManager, entity: CharacterEntity, client: Client) {
        super(world, entity.toNet());
        this.entity = entity;

        this.updateCombatStats();

        this.data.autoRetaliate = this.entity.autoRetaliate;
        this.socket = client.socket;
        this.data.model = 'assets/models/units/human/human.model.json'; // TODO: get from race
        this.data.running = this.entity.running;
        this.bags = new InventoryManager(this.world, entity.bags);
        this.bank = new InventoryManager(this.world, entity.bank);

        this.on('attack', this.onAttack.bind(this));
        this.on('damaged', this.onDamaged.bind(this));

        this.socket.on(PacketHeader.PLAYER_MOVETO, this.handleMoveTo.bind(this));
        this.socket.on(PacketHeader.PLAYER_TARGET, this.handleTarget.bind(this));
        this.socket.on(PacketHeader.PLAYER_LOOT, this.handleLoot.bind(this));
        this.socket.on(PacketHeader.INVENTORY_SWAP, this.handleInventorySwap.bind(this));
        this.socket.on(PacketHeader.INVENTORY_USE, this.handleInventoryUse.bind(this));
        this.socket.on(PacketHeader.INVENTORY_DROP, this.handleInventoryDrop.bind(this));
        this.socket.on(PacketHeader.PLAYERL_SET_RUN, this.handleSetRun.bind(this));
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
        return this.data;
    }

    public on(event: PlayerManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: PlayerManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: PlayerManagerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
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
        this.socket.emit(PacketHeader.INVENTORY_DROP, <ResponsePacket>{
            success: true,
            message: '',
        });
    }

    private handleSetRun(packet: BooleanPacket): void {
        this.data.running = packet.value;
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
        if (newLevel > oldLevel) { // level up has occured
            this.updateCombatStats();
            skill.current += 1;
            this.send(PacketHeader.PLAYERL_LEVELUP, <LevelupPacket>skill.toNet());
            this.emit('levelup', skill);
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
                    this.socket.emit(PacketHeader.INVENTORY_FULL, <InventoryPacket> this.bags.toNet());
                }
            }
            this._state = UnitState.IDLE;
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
