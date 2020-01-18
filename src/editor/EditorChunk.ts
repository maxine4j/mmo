import { Point } from '../common/Point';
import Chunk from '../client/engine/Chunk';
import Rectangle from '../common/Rectangle';
import ChunkDef from '../common/Chunk';

export default class EditorChunk {
    public chunk: Chunk;
    private bounds: Rectangle;

    public constructor(chunk: Chunk) {
        this.chunk = chunk;
        this.bounds = new Rectangle(0, 0, this.chunk.size, this.chunk.size);
    }

    public static newChunkDef(id: number, x: number, y: number, size: number): ChunkDef {
        return <ChunkDef>{
            id,
            x,
            y,
            size,
            heightmap: Array.from({ length: size * size }, () => 0),
            doodads: [],
            texture: `assets/chunks/${id}.png`,
        };
    }

    public getHeight(p: Point): number {
        return this.chunk.def.heightmap[p.y * this.chunk.def.size + p.x];
    }

    public setHeight(p: Point, h: number): void {
        this.chunk.def.heightmap[p.y * this.chunk.def.size + p.x] = h;
    }

    public incHeight(p: Point, amt: number): void {
        const curh = this.getHeight(p);
        this.setHeight(p, curh + amt);
    }

    public smooth(p: Point, strength: number = 1): void {
        // get all neighbouring points
        const points: Point[] = [];
        points.push(new Point(p.x, p.y - 1)); // N
        points.push(new Point(p.x, p.y + 1)); // S
        points.push(new Point(p.x + 1, p.y)); // E
        points.push(new Point(p.x - 1, p.y)); // W

        // calculate average height
        let sum = 0;
        let count = 0;
        points.forEach((point) => {
            if (this.bounds.contains(point)) {
                sum += this.getHeight(point);
                count++;
            }
        });

        const newHeight = sum / count;
        const curHeight = this.getHeight(p);
        const heightDelta = (newHeight - curHeight) * strength;

        this.setHeight(p, curHeight + heightDelta);
    }

    public updateDoodads(): void {
        for (const doodad of this.chunk.doodads) {
            doodad.positionInWorld();
        }
    }

    public updateMesh(): void {
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
