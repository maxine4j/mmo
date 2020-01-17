import ChunkDef from '../../common/Chunk';
import Point from '../../common/Point';
import Rectangle from '../../common/Rectangle';

const WALKABLE = 0;
const NOT_WALKABLE = 1;
const CHUNK_SIZE = 128; // TODO: increase to 128 after testing

export default class ChunkManager {
    public def: ChunkDef;
    public navmap: Array<Array<number>>;

    public constructor(def: ChunkDef) {
        this.def = def;
        this.generateNavmap();
    }

    private generateNavmap(): void {
        // init all to walkable
        this.navmap = [];
        for (let i = 0; i < CHUNK_SIZE; i++) {
            this.navmap[i] = [];
            for (let j = 0; j < CHUNK_SIZE; j++) {
                this.navmap[i][j] = WALKABLE;
            }
        }
        // make doodads not walkable
        for (const doodad of this.def.doodads) {
            if (!doodad.walkable) {
                // set the doodads hitboxes as not walkable
                for (const nb of doodad.navblocks) {
                    const i = doodad.y + nb.y;
                    const j = doodad.x + nb.x;
                    this.navmap[i][j] = NOT_WALKABLE;
                }
            }
        }
    }

    public static get chunkSize(): number {
        return CHUNK_SIZE;
    }

    public get worldOffset(): Point {
        const x = this.def.x - CHUNK_SIZE / 2;
        const y = this.def.y - CHUNK_SIZE / 2;
        return new Point(x, y);
    }

    public containsPoint(point: Point): boolean {
        const offset = this.worldOffset;
        const bounds = new Rectangle(offset.x, offset.y, CHUNK_SIZE, CHUNK_SIZE);
        return bounds.contains(point);
    }
}
