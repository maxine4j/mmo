import uuid from 'uuid/v4';
import WorldJsonDef from '../server/data/WorldsJsonDef';
import ChunkDef from '../common/ChunkDef';
import ChunkWorld from '../client/engine/ChunkWorld';
import { TilePoint, ChunkPoint } from '../common/Point';
import Scene from '../client/engine/graphics/Scene';
import Chunk from '../client/engine/Chunk';

export default class EditorChunkWorld {
    private def: WorldJsonDef;
    private world: ChunkWorld;

    public constructor(scene: Scene, worldDef: WorldJsonDef) {
        this.world = new ChunkWorld(scene, worldDef.chunkSize);
        this.def = worldDef;
    }

    // expose underlying ChunkWorld props
    public get w(): ChunkWorld { return this.world; }
    public get chunks(): Map<string, Chunk> { return this.world.chunks; }
    public get scene(): Scene { return this.world.scene; }
    public get chunkSize(): number { return this.world.chunkSize; }
    public async loadChunk(def: ChunkDef): Promise<Chunk> { return this.world.loadChunk(def); }
    public setWireframeVisibility(visible: boolean): void { this.world.setWireframeVisibility(visible); }
    public positionDoodads(): void { this.world.positionDoodads(); }
    public stitchChunks(): void { this.world.stitchChunks(); }

    public async createNewChunk(x: number, y: number): Promise<void> {
        const size = this.chunkSize + 1;
        const def = <ChunkDef>{
            id: uuid(),
            x,
            y,
            size: this.chunkSize,
            heightmap: Array.from({ length: size * size }, () => 0),
            doodads: [],
            texture: 'assets/chunks/default.png', // TODO: terrain texture painting
        };
        await this.loadChunk(def);
        this.stitchChunks();
    }

    public deleteChunk(x: number, y: number): void {
        const chunk = this.getChunkAt(x, y);
        chunk.unload();
        this.chunks.delete(chunk.def.id);
        this.stitchChunks();
    }

    public getChunkAt(x: number, y: number): Chunk {
        for (const [_, chunk] of this.chunks) {
            if (chunk.def.x === x && chunk.def.y === y) {
                return chunk;
            }
        }
        return null;
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
        if (elevDelta !== null) {
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
        if (chunkPoint) {
            const idx = chunkPoint.y * (chunkPoint.chunk.world.chunkSize + 1) + chunkPoint.x;
            verts[idx * 3 + 1] = chunkPoint.elevation;
        }
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
