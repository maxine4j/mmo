import Chunk from '../models/Chunk';
import ChunkDef from '../../common/ChunkDef';
import Scene from '../engine/graphics/Scene';
import Map2D from '../../common/Map2D';
import { TilePoint } from '../../common/Point';

export default class ChunkWorld {
    public isEditor: boolean;
    public chunks: Map2D<number, number, Chunk> = new Map2D();
    public scene: Scene;
    public chunkSize: number;
    public chunkViewDist: number;
    private wireframeVisibility: boolean;

    public constructor(scene: Scene, chunkSize: number, chunkViewDist: number, isEditor: boolean = false) {
        this.scene = scene;
        this.chunkSize = chunkSize;
        this.chunkViewDist = chunkViewDist;
        this.isEditor = isEditor;
    }

    public loadChunk(def: ChunkDef): Promise<Chunk> {
        return new Promise((resolve, reject) => {
            const existing = this.chunks.get(def.x, def.y);
            if (existing) {
                existing.load();
                resolve(existing);
            } else {
                Chunk.load(def, this)
                    .then((c: Chunk) => {
                        this.chunks.set(def.x, def.y, c); // save chunk to the worlds map2d
                        c.setWireframeVisibility(this.wireframeVisibility);
                        c.load();
                        resolve(c);
                    })
                    .catch((err) => reject(err));
            }
        });
    }

    public pruneChunks(center: TilePoint): void {
        if (center) {
            const chunk = center.toChunk().chunk;
            const minX = chunk.def.x - this.chunkViewDist;
            const maxX = chunk.def.x + this.chunkViewDist;
            const minY = chunk.def.y - this.chunkViewDist;
            const maxY = chunk.def.y + this.chunkViewDist;
            for (const [x, y, c] of this.chunks) {
                if (x < minX || x > maxX || y < minY || y > maxY) {
                    c.unload();
                }
            }
        }
    }

    public stitchChunks(): void {
        for (const [_x, _y, chunk] of this.chunks) {
            if (chunk.isLoaded) {
                chunk.stitchVerts();
            }
        }
        for (const [_x, _y, chunk] of this.chunks) {
            if (chunk.isLoaded) {
                chunk.terrain.geometry.computeVertexNormals();
            }
        }
        for (const [_x, _y, chunk] of this.chunks) {
            if (chunk.isLoaded) {
                chunk.stitchNormals();
            }
        }
    }

    public setWireframeVisibility(visible: boolean): void {
        this.wireframeVisibility = visible;
        for (const [_x, _y, chunk] of this.chunks) {
            chunk.setWireframeVisibility(this.wireframeVisibility);
        }
    }

    public positionDoodads(): void {
        for (const [_x, _y, chunk] of this.chunks) {
            chunk.positionDoodads();
        }
    }

    public update(delta: number): void {
        for (const [_x, _y, chunk] of this.chunks) {
            chunk.update(delta);
        }
    }
}
