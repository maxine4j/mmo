import Chunk from './Chunk';
import ChunkDef from '../../common/ChunkDef';
import Scene from './graphics/Scene';

export default class ChunkWorld {
    public chunks: Map<number, Chunk> = new Map();
    public scene: Scene;
    private wireframeVisibility: boolean;
    private _chunkSize: number = 128;

    public constructor(scene: Scene) {
        this.scene = scene;
    }

    public get chunkSize(): number { return this._chunkSize; }

    public async loadChunk(def: ChunkDef): Promise<Chunk> {
        return new Promise((resolve) => {
            Chunk.load(def, this).then((c: Chunk) => {
                this.chunks.set(def.id, c);
                this.scene.add(c.terrain);
                c.positionInWorld();
                c.setWireframeVisibility(this.wireframeVisibility);
                resolve(c);
            });
        });
    }

    public stitchChunks(): void {
        for (const [_, chunk] of this.chunks) {
            chunk.stitchVerts();
        }
        for (const [_, chunk] of this.chunks) {
            chunk.terrain.geometry.computeVertexNormals();
        }
        for (const [_, chunk] of this.chunks) {
            chunk.stitchNormals();
        }
    }

    public setWireframeVisibility(visible: boolean): void {
        this.wireframeVisibility = visible;
        for (const [_, chunk] of this.chunks) {
            chunk.setWireframeVisibility(this.wireframeVisibility);
        }
    }

    public positionDoodads(): void {
        for (const [_, chunk] of this.chunks) {
            chunk.positionDoodads();
        }
    }
}
