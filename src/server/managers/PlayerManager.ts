import io from 'socket.io';
import CharacterDef from '../../common/CharacterDef';
import WorldManager from './WorldManager';
import UnitManager, { UnitState } from './UnitManager';
import { TilePoint } from '../../common/Point';
import Map2D from '../../common/Map2D';
import ChunkManager from './ChunkManager';
import InventoryManager from './InventoryManager';
import InventoryDef from '../../common/InventoryDef';
import CharacterEntity from '../entities/Character.entity';

export default class PlayerManager extends UnitManager {
    public socket: io.Socket;
    public data: CharacterDef;
    public bags: InventoryManager;
    public bank: InventoryManager;
    public loadedChunks: Map2D<number, number, ChunkManager> = new Map2D();

    public constructor(world: WorldManager, data: CharacterDef, socket: io.Socket, bagsData: InventoryDef, bankData: InventoryDef) {
        super(world, data);
        this.data.maxHealth = 10;
        this.data.health = 10; // TODO: temp
        this.data.autoRetaliate = true;
        this.socket = socket;
        this.data.model = 'assets/models/units/human/human.model.json'; // TODO: get from race
        this.bags = new InventoryManager(bagsData);
        this.bank = new InventoryManager(bankData);
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

    public tick(): void {
        // cache last point
        const [ccxLast, ccyLast] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunkSize);
        super.tick();
        // check if the player moved between chunks
        const [ccxCurrent, ccyCurrent] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunkSize);
        if (ccxLast !== ccxCurrent || ccyLast !== ccyCurrent) {
            this.world.sendSurroundingChunks(this); // ask the world to send new chunks
        }
    }
}
