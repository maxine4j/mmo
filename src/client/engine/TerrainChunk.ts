import Terrain from './graphics/Terrain';
import Chunk from '../../common/Chunk';
import Point from '../../common/Point';
import Rectangle from '../../common/Rectangle';

export default class TerrainChunk {
    public id: number;
    public terrain: Terrain;
    public x: number;
    public y: number;

    private constructor(id: number, terrain: Terrain, x: number, y: number) {
        this.id = id;
        this.terrain = terrain;
        this.x = x;
        this.y = y;
        this.positionTerrain();
    }

    private positionTerrain() {
        this.terrain.plane.position.set(this.x * this.size, 0, this.y * this.size);
    }

    public static async load(chunk: Chunk): Promise<TerrainChunk> {
        return new Promise((resolve) => {
            console.log('loading chunk!', chunk);

            Terrain.load(`assets/chunks/${chunk.heightmap}`, `assets/chunks/${chunk.texture}`).then((t) => {
                resolve(new TerrainChunk(chunk.id, t, chunk.x, chunk.y));
            });
        });
    }

    public worldOffset(): Point {
        const x = this.x - this.terrain.width / 2;
        const y = this.y - this.terrain.height / 2;
        return new Point(x, y);
    }

    public containsPoint(point: Point): boolean {
        const offset = this.worldOffset();
        const bounds = new Rectangle(offset.x, offset.y, this.size, this.size);
        return bounds.contains(point);
    }

    public chunkToTerrain(chunkX: number, chunkY: number): { x: number, y: number} {
        const x = chunkX + (this.terrain.width / 2);
        const y = chunkY + (this.terrain.height / 2);
        return { x, y };
    }

    public getElevation(chunkX: number, chunkY: number): number {
        const tp = this.chunkToTerrain(chunkX, chunkY);
        return this.terrain.getElevation(tp.x, tp.y);
    }

    public get size(): number {
        return this.terrain.width;
    }
}
