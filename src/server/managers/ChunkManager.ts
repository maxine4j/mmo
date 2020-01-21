import ChunkDef from '../../common/ChunkDef';
import { Point, PointDef } from '../../common/Point';
import Rectangle from '../../common/Rectangle';
import WorldManager from './WorldManager';

export const WALKABLE = 0;
export const NOT_WALKABLE = 1;

export default class ChunkManager {
    public world: WorldManager;
    public def: ChunkDef;
    public navmap: number[][];

    public constructor(def: ChunkDef, world: WorldManager) {
        this.def = def;
        this.world = world;
        this.generateNavmap();
    }

    private generateNavmap(): void {
        // init all to walkable
        this.navmap = [];
        for (let i = 0; i < this.world.chunkSize; i++) {
            this.navmap[i] = [];
            for (let j = 0; j < this.world.chunkSize; j++) {
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
                    if (i >= this.world.chunkSize || i < 0) continue; // TODO: this ignores navblocks off the side of the chunk
                    if (j >= this.world.chunkSize || j < 0) continue;
                    this.navmap[i][j] = NOT_WALKABLE;
                }
            }
        }
    }

    public get worldOffset(): Point {
        return new Point(
            (this.def.x * this.world.chunkSize) - this.world.chunkSize / 2,
            (this.def.y * this.world.chunkSize) - this.world.chunkSize / 2,
        );
    }

    public containsPoint(point: PointDef): boolean {
        const offset = this.worldOffset;
        const bounds = new Rectangle(offset.x, offset.y, this.world.chunkSize, this.world.chunkSize);
        return bounds.contains(Point.fromDef(point));
    }
}
