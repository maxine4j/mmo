import uuid from 'uuid/v4';
import { defaultBlendSize } from '../client/engine/asset/AssetManager';
import WorldJsonDef from '../server/data/WorldsJsonDef';
import ChunkDef from '../common/definitions/ChunkDef';
import ChunkWorld from '../client/managers/ChunkManager';
import { TilePoint, ChunkPoint } from '../common/Point';
import Scene from '../client/engine/graphics/Scene';
import Chunk from '../client/models/Chunk';
import Map2D from '../common/Map2D';
import { generateTexture } from './tools/terrain/PaintTool';

export default class EditorChunkWorld {
    private def: WorldJsonDef;
    private world: ChunkWorld;

    public constructor(scene: Scene, worldDef: WorldJsonDef) {
        this.world = new ChunkWorld(scene, worldDef.chunkSize, 3, true);
        this.def = worldDef;
    }

    // expose underlying ChunkWorld props
    public get w(): ChunkWorld { return this.world; }
    public get chunks(): Map2D<number, number, Chunk> { return this.world.chunks; }
    public get scene(): Scene { return this.world.scene; }
    public get chunkSize(): number { return this.world.chunkSize; }
    public loadChunk(def: ChunkDef): Promise<Chunk> { return this.world.loadChunk(def); }
    public setWireframeVisibility(visible: boolean): void { this.world.setWireframeVisibility(visible); }
    public positionDoodads(): void { this.world.positionDoodads(); }
    public stitchChunks(): void { this.world.stitchChunks(); }
    public update(delta: number): void { this.world.update(delta); }

    public async createNewChunk(x: number, y: number): Promise<void> {
        const size = this.chunkSize + 1;
        const def = <ChunkDef>{
            id: uuid(),
            x,
            y,
            size: this.chunkSize,
            heightmap: Array.from({ length: size * size }, () => 0),
            doodads: [],
            textures: [
                {
                    id: 'dirt',
                    blend: generateTexture(defaultBlendSize, defaultBlendSize, 'white'),
                },
            ],
            waters: [],
        };
        await this.loadChunk(def);
        this.stitchChunks();
    }

    public deleteChunk(x: number, y: number): void {
        this.chunks.get(x, y).unload();
        this.chunks.delete(x, y);
        this.stitchChunks();
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
            const chunkPoint = point.toChunk();
            if (chunkPoint !== null) {
                sum += chunkPoint.singlePointElevation;
                count++;
            }
        }

        const newElev = (sum / count) || 0;
        const pChunk = p.toChunk();
        if (pChunk) {
            const elevDelta = (newElev - pChunk.singlePointElevation) * strength;
            if (elevDelta !== null) {
                pChunk.singlePointElevation += elevDelta;
            }
        }
    }

    public updateDoodads(): void {
        for (const [_x, _y, chunk] of this.world.chunks) {
            chunk.positionDoodads();
        }
    }

    public updateWireframe(): void {
        for (const [_x, _y, chunk] of this.world.chunks) {
            chunk.updateWireframe();
        }
    }

    public updateMeshAtPoint(chunkPoint: ChunkPoint): void {
        // update terrain mesh
        // @ts-ignore
        const verts = chunkPoint.chunk.terrain.geometry.attributes.position.array;
        if (chunkPoint) {
            const idx = chunkPoint.y * (chunkPoint.chunk.world.chunkSize + 1) + chunkPoint.x;
            verts[idx * 3 + 1] = chunkPoint.singlePointElevation;
        }
        // @ts-ignore
        chunkPoint.chunk.terrain.geometry.attributes.position.needsUpdate = true;
    }

    public get minTileX(): number { // FIXME: change for map2d
        // find the min x value of all chunks
        let min = Number.MAX_VALUE;
        for (const [_x, _y, chunk] of this.world.chunks) {
            if (chunk.def.x < min) {
                min = chunk.def.x;
            }
        }
        // return this value converted to tile coords
        return (min * this.world.chunkSize) - (this.world.chunkSize / 2);
    }

    public get maxTileX(): number { // FIXME: change for map2d
        // find the max x value of all chunks
        let max = -Number.MAX_VALUE;
        for (const [_x, _y, chunk] of this.world.chunks) {
            if (chunk.def.x > max) {
                max = chunk.def.x;
            }
        }
        // return this value converted to tile coords
        return (max * this.world.chunkSize) + (this.world.chunkSize / 2);
    }

    public get minTileY(): number { // FIXME: change for map2d
        // find the min y value of all chunks
        let min = Number.MAX_VALUE;
        for (const [_x, _y, chunk] of this.world.chunks) {
            if (chunk.def.y < min) {
                min = chunk.def.y;
            }
        }
        // return this value converted to tile coords
        return (min * this.world.chunkSize) - (this.world.chunkSize / 2);
    }

    public get maxTileY(): number { // FIXME: change for map2d
        // find the max y value of all chunks
        let max = -Number.MAX_VALUE;
        for (const [_x, _y, chunk] of this.world.chunks) {
            if (chunk.def.y > max) {
                max = chunk.def.y;
            }
        }
        // return this value converted to tile coords
        return (max * this.world.chunkSize) + (this.world.chunkSize / 2);
    }
}
