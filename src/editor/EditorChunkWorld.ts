import ChunkDef from '../common/Chunk';
import ChunkWorld from '../client/engine/ChunkWorld';
import { TilePoint, ChunkPoint } from '../common/Point';
import Scene from '../client/engine/graphics/Scene';

export default class EditorChunkWorld {
    public world: ChunkWorld;
    private lastId = 0;

    public constructor(scene: Scene) {
        this.world = new ChunkWorld(scene);
        // set up last id for adding new chunks
        for (const [id, _] of this.world.chunks) {
            if (this.lastId <= id) {
                this.lastId = id + 1;
            }
        }
    }

    public addNewChunk(x: number, y: number, size: number): ChunkDef {
        return <ChunkDef>{
            id: this.lastId++,
            x,
            y,
            size,
            heightmap: Array.from({ length: size * size }, () => 0),
            doodads: [],
            texture: 'assets/chunks/default.png', // TODO: terrain texture painting
        };
    }

    public smooth(p: TilePoint, strength: number = 1): void {
        // get all neighbouring points
        const points: TilePoint[] = [];
        points.push(new TilePoint(p.x, p.y - 1, p.world)); // N
        points.push(new TilePoint(p.x, p.y + 1, p.world)); // S
        points.push(new TilePoint(p.x + 1, p.y, p.world)); // E
        points.push(new TilePoint(p.x - 1, p.y, p.world)); // W

        // calculate average height
        let sum = 0;
        let count = 0;
        for (const point of points) {
            const elev = point.elevation;
            if (elev !== null) { // elev is null if the point doesnt exist in a chunk
                sum += elev;
                count++;
            }
        }

        const newElev = (sum / count) || 0;
        const elevDelta = (newElev - p.elevation) * strength;
        if (elevDelta !== 0) {
            p.elevation += elevDelta;
        }
    }

    public updateDoodads(): void {
        for (const [_, chunk] of this.world.chunks) {
            chunk.positionDoodads();
        }
    }

    public updateWireframe(): void {
        for (const [_, chunk] of this.world.chunks) {
            chunk.updateWireframe();
        }
    }

    public updateMeshAtPoint(chunkPoint: ChunkPoint): void {
        // update terrain mesh
        // @ts-ignore
        const verts = chunkPoint.chunk.terrain.geometry.attributes.position.array;
        const idx = chunkPoint.y * this.world.chunkSize + chunkPoint.x;
        verts[idx * 3 + 1] = chunkPoint.chunk.def.heightmap[idx];
        // @ts-ignore
        chunkPoint.chunk.terrain.geometry.attributes.position.needsUpdate = true;
    }

    // public updateMesh(): void {
    //     const stride = 3;
    //     for (const [_, chunk] of this.world.chunks) {
    //         // @ts-ignore
    //         const verts = chunk.terrain.geometry.attributes.position.array;
    //         for (let i = 0; i < chunk.def.size; i++) {
    //             for (let j = 0; j < chunk.def.size; j++) {
    //                 const idx = i * chunk.def.size + j;
    //                 verts[idx * stride + 1] = chunk.def.heightmap[idx];
    //             }
    //         }
    //         // @ts-ignore
    //         chunk.terrain.geometry.attributes.position.needsUpdate = true;
    //         chunk.updateWireframe();
    //     }
    // }

    public get minTileX(): number {
        // find the min x value of all chunks
        let min = Number.MAX_VALUE;
        for (const [_, chunk] of this.world.chunks) {
            if (chunk.def.x < min) {
                min = chunk.def.x;
            }
        }
        // return this value converted to tile coords
        return (min * this.world.chunkSize) - (this.world.chunkSize / 2);
    }

    public get maxTileX(): number {
        // find the max x value of all chunks
        let max = -Number.MAX_VALUE;
        for (const [_, chunk] of this.world.chunks) {
            if (chunk.def.x > max) {
                max = chunk.def.x;
            }
        }
        // return this value converted to tile coords
        return (max * this.world.chunkSize) + (this.world.chunkSize / 2);
    }

    public get minTileY(): number {
        // find the min y value of all chunks
        let min = Number.MAX_VALUE;
        for (const [_, chunk] of this.world.chunks) {
            if (chunk.def.y < min) {
                min = chunk.def.y;
            }
        }
        // return this value converted to tile coords
        return (min * this.world.chunkSize) - (this.world.chunkSize / 2);
    }

    public get maxTileY(): number {
        // find the max y value of all chunks
        let max = -Number.MAX_VALUE;
        for (const [_, chunk] of this.world.chunks) {
            if (chunk.def.y > max) {
                max = chunk.def.y;
            }
        }
        // return this value converted to tile coords
        return (max * this.world.chunkSize) + (this.world.chunkSize / 2);
    }
}
