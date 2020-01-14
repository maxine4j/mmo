import Point from '../common/Point';
import Chunk from '../client/engine/Chunk';

export default class EditorChunk {
    public chunk: Chunk;

    public constructor(chunk: Chunk) {
        this.chunk = chunk;
    }

    public getHeight(p: Point): number {
        return this.chunk.def.heightmap[p.y * this.chunk.def.size + p.x];
    }

    public setHeight(p: Point, h: number) {
        this.chunk.def.heightmap[p.y * this.chunk.def.size + p.x] = h;
    }

    public incHeight(p: Point, amt: number) {
        const curh = this.getHeight(p);
        console.log('inc height:', curh, ' -> ', curh + amt);

        this.setHeight(p, curh + amt);
    }

    public updateMesh() {
        // @ts-ignore
        const verts = this.chunk.terrain.geometry.attributes.position.array;
        const stride = 3;
        for (let i = 0; i < this.chunk.def.size; i++) {
            for (let j = 0; j < this.chunk.def.size; j++) {
                const idx = i * this.chunk.def.size + j;
                verts[idx * stride + 1] = this.chunk.def.heightmap[idx];
            }
        }
        // @ts-ignore
        this.chunk.terrain.geometry.attributes.position.needsUpdate = true;
        this.chunk.updateWireframe();
    }
}
