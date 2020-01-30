import io from 'socket.io';
import CharacterDef from '../../common/CharacterDef';
import WorldManager from '../managers/WorldManager';
import Unit, { UnitState, UnitManagerEvent } from './Unit';
import { TilePoint, Point } from '../../common/Point';
import Map2D from '../../common/Map2D';
import Chunk from './Chunk';
import InventoryManager from './Inventory';
import CharacterEntity from '../entities/Character.entity';
import {
    PacketHeader, InventoryPacket, ChunkListPacket, InventorySwapPacket, ResponsePacket, InventoryUsePacket, PointPacket, TargetPacket, LootPacket, InventoryDropPacket, Packet,
} from '../../common/Packet';
import ChunkDef from '../../common/ChunkDef';
import IModel from './IModel';
import Client from './Client';
import GroundItem from './GroundItem';

type PlayerManagerEvent = UnitManagerEvent | 'saved';

export default class Player extends Unit implements IModel {
    private socket: io.Socket;
    protected data: CharacterDef;
    private entity: CharacterEntity;
    public bags: InventoryManager;
    public bank: InventoryManager;
    public loadedChunks: Map2D<number, number, Chunk> = new Map2D();
    public visibleGroundItems: Map<string, GroundItem> = new Map();
    private lootTarget: GroundItem;

    public constructor(world: WorldManager, entity: CharacterEntity, client: Client) {
        super(world, entity.toNet());
        this.entity = entity;
        this.data.maxHealth = 10;
        this.data.health = 10; // TODO: temp
        this.data.autoRetaliate = true;
        this.socket = client.socket;
        this.data.model = 'assets/models/units/human/human.model.json'; // TODO: get from race
        this.data.running = true;
        this.bags = new InventoryManager(this.world, entity.bags);
        this.bank = new InventoryManager(this.world, entity.bank);

        this.socket.on(PacketHeader.PLAYER_MOVETO, this.handleMoveTo.bind(this));
        this.socket.on(PacketHeader.PLAYER_TARGET, this.handleTarget.bind(this));
        this.socket.on(PacketHeader.PLAYER_LOOT, this.handleLoot.bind(this));
        this.socket.on(PacketHeader.INVENTORY_SWAP, this.handleInventorySwap.bind(this));
        this.socket.on(PacketHeader.INVENTORY_USE, this.handleInventoryUse.bind(this));
        this.socket.on(PacketHeader.INVENTORY_DROP, this.handleInventoryDrop.bind(this));
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

    // #region Event Emitter
    public on(event: PlayerManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: PlayerManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: PlayerManagerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }
    // #endregion

    // #region Handlers
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
            message: 'Item dropped',
        });
    }
    // #endregion

    // #region Chunk World
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
    // #endregion

    // #region Actions
    public respawn(): void {
        // could get new spawn points here, maybe unlock them
        // different per instance/map
        // graveyards?
        // drop inventory?
        // TODO: need teleport functionality instead of lerping
        this.data.position = { x: 0, y: 0 };
        this.data.health = this.data.maxHealth;
        this.data.moveQueue = [];
        this.data.target = '';
        this._state = UnitState.IDLE;
        this.stopAttacking();
        this.emit('updated', this);
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
    // #endregion

    // #region Tick
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
    // #endregion

    // #region Database
    private async save(): Promise<void> {
        await this.bags.save();
        await this.bank.save();
        this.entity.level = this.data.level;
        this.entity.posX = this.data.position.x;
        this.entity.posY = this.data.position.y;
        await this.entity.save();
    }
    // #endregion
}
