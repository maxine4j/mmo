import Chunk from './Chunk';
import ChunkDef from '../../common/ChunkDef';
import Scene from './graphics/Scene';
import Map2D from '../../common/Map2D';

export default class ChunkWorld {
    // public chunks: Map<string, Chunk> = new Map();
    public chunks: Map2D<number, number, Chunk> = new Map2D();
    public scene: Scene;
    public chunkSize: number;
    private wireframeVisibility: boolean;

    public constructor(scene: Scene, chunkSize: number) {
        this.scene = scene;
        this.chunkSize = chunkSize;
    }

    public async loadChunk(def: ChunkDef): Promise<Chunk> {
        return new Promise((resolve) => {
            Chunk.load(def, this).then((c: Chunk) => {
                this.chunks.set(def.x, def.y, c);
                this.scene.add(c.terrain);
                c.positionInWorld();
                c.setWireframeVisibility(this.wireframeVisibility);
                resolve(c);
            });
        });
    }

    public stitchChunks(): void {
        for (const [_x, _y, chunk] of this.chunks) {
            chunk.stitchVerts();
        }
        for (const [_x, _y, chunk] of this.chunks) {
            chunk.terrain.geometry.computeVertexNormals();
        }
        for (const [_x, _y, chunk] of this.chunks) {
            chunk.stitchNormals();
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
}
