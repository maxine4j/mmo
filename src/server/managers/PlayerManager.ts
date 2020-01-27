import io from 'socket.io';
import CharacterDef from '../../common/CharacterDef';
import WorldManager from './WorldManager';
import UnitManager, { UnitState, UnitManagerEvent } from './UnitManager';
import { TilePoint, Point } from '../../common/Point';
import Map2D from '../../common/Map2D';
import ChunkManager from './ChunkManager';
import InventoryManager from './InventoryManager';
import InventoryDef from '../../common/InventoryDef';
import CharacterEntity from '../entities/Character.entity';
import { GroundItemDef } from '../../common/ItemDef';
import { PacketHeader, InventoryPacket } from '../../common/Packet';

type PlayerManagerEvent = UnitManagerEvent | 'saved';

export default class PlayerManager extends UnitManager {
    public socket: io.Socket;
    public data: CharacterDef;
    public bags: InventoryManager;
    public bank: InventoryManager;
    public loadedChunks: Map2D<number, number, ChunkManager> = new Map2D();
    public visibleGroundItems: Map<string, GroundItemDef> = new Map();
    private lootTarget: GroundItemDef;

    public constructor(world: WorldManager, data: CharacterDef, socket: io.Socket, bagsData: InventoryDef, bankData: InventoryDef) {
        super(world, data);
        this.data.maxHealth = 10;
        this.data.health = 10; // TODO: temp
        this.data.autoRetaliate = true;
        this.socket = socket;
        this.data.model = 'assets/models/units/human/human.model.json'; // TODO: get from race
        this.data.running = true;
        this.bags = new InventoryManager(bagsData);
        this.bank = new InventoryManager(bankData);
    }

    public dispose(): void {
        super.dispose();
        this.currentChunk.players.delete(this.data.id);
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

    public async saveToDB(): Promise<void> {
        await this.bags.saveToDB();
        await this.bank.saveToDB();
        await CharacterEntity.createQueryBuilder()
            .update()
            .set({
                level: this.data.level,
                posX: this.data.position.x,
                posY: this.data.position.y,
            })
            .where('id = :id', { id: Number(this.data.id) })
            .execute();
    }

    // used to update the units chunk
    protected addToNewChunk(chunk: ChunkManager): void {
        chunk.players.set(this.data.id, this);
        chunk.allUnits.set(this.data.id, this);
        this.currentChunk = chunk;
    }

    // used to update the units chunk
    protected removeFromOldChunk(): void {
        this.currentChunk.players.delete(this.data.id);
        this.currentChunk.allUnits.delete(this.data.id);
    }

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
        this.state = UnitState.IDLE;
        this.stopAttacking();
        this.emit('updated', this);
    }

    public pickUpItem(gi: GroundItemDef): void {
        this.state = UnitState.LOOTING;
        this.lootTarget = gi;
        this.path = this.findPath(gi.position);
    }

    public pruneLoadedChunks(): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunkSize);
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

    private tickLooting(): void {
        // check if we are on top of the item
        if (this.position.eq(Point.fromDef(this.lootTarget.position))) {
            // check if the item still exists on the ground
            if (this.world.groundItemExists(this.lootTarget)) {
                if (this.bags.tryAddItem(this.lootTarget.item)) {
                    this.world.removeGroundItem(this.lootTarget); // potential race condition, item duplication?
                    this.socket.emit(PacketHeader.INVENTORY_FULL, <InventoryPacket> this.bags.data);
                }
            }
            this.state = UnitState.IDLE;
        }
    }

    public tick(): void {
        // cache last point
        const [ccxLast, ccyLast] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunkSize);
        super.tick();
        // check if the player moved between chunks
        const [ccxCurrent, ccyCurrent] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunkSize);
        if (ccxLast !== ccxCurrent || ccyLast !== ccyCurrent) {
            this.world.sendSurroundingChunks(this); // ask the world to send new chunks
        }

        // TODO: personal loot for X ticks so other players cant steal immediately
        this.visibleGroundItems.clear();
        for (const gi of this.world.groundItemsInRange(this.data.position)) {
            this.visibleGroundItems.set(gi.item.uuid, gi);
        }

        switch (this.state) {
        case UnitState.LOOTING: this.tickLooting(); break;
        default: break;
        }
    }
}
