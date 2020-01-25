import io from 'socket.io';
import CharacterDef from '../../common/CharacterDef';
import WorldManager from './WorldManager';
import UnitManager from './UnitManager';
import { TilePoint } from '../../common/Point';
import Map2D from '../../common/Map2D';
import ChunkManager from './ChunkManager';

export default class PlayerManager extends UnitManager {
    public socket: io.Socket;
    public data: CharacterDef;
    public loadedChunks: Map2D<number, number, ChunkManager> = new Map2D();

    public constructor(world: WorldManager, data: CharacterDef, socket: io.Socket) {
        super(world, data);
        this.data.maxHealth = 10;
        this.data.health = 10; // TODO: temp
        this.data.autoRetaliate = true;
        this.socket = socket;
        this.data.model = 'assets/models/units/human/human.model.json'; // TODO: get from race
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
