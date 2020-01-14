import * as THREE from 'three';
import Chunk from './Chunk';
import ChunkDef from '../../common/Chunk';
import Point from '../../common/Point';
import Scene from './graphics/Scene';

export default class ChunkWorld {
    private chunks: Map<number, Chunk> = new Map();
    public scene: Scene;
    private wireframeVisibility: boolean;

    public constructor(scene: Scene) {
        this.scene = scene;
    }

    public async loadChunk(def: ChunkDef): Promise<Chunk> {
        return new Promise((resolve) => {
            Chunk.load(def, this).then((c: Chunk) => {
                this.chunks.set(def.id, c);
                this.scene.add(c.terrain);
                c.setWireframeVisibility(this.wireframeVisibility);
                resolve(c);
            });
        });
    }

    public getChunk(id: number): Chunk {
        return this.chunks.get(id);
    }

    public getElevation(tile: Point): number {
        for (const [_, chunk] of this.chunks) {
            const p = new Point(
                tile.x - (chunk.def.x * chunk.size) + chunk.size / 2,
                tile.y - (chunk.def.y * chunk.size) + chunk.size / 2,
            );
            if (chunk.containsPoint(p)) {
                return chunk.getElevation(p);
            }
        }
        return null;
    }

    public tileToChunk(tile: Point): Point {
        for (const [_, chunk] of this.chunks) {
            const p = new Point(
                tile.x - (chunk.def.x * chunk.size) + chunk.size / 2,
                tile.y - (chunk.def.y * chunk.size) + chunk.size / 2,
            );
            if (chunk.containsPoint(p)) {
                return p;
            }
        }
        return null;
    }

    public chunkToTile(chunk: Chunk, chunkPos: Point): Point {
        return new Point(
            chunkPos.x - ((chunk.def.x * chunk.size) + chunk.size / 2),
            chunkPos.y - ((chunk.def.y * chunk.size) + chunk.size / 2),
        );
    }

    public setWireframeVisibility(visible: boolean) {
        this.wireframeVisibility = visible;
        for (const [_, chunk] of this.chunks) {
            chunk.setWireframeVisibility(this.wireframeVisibility);
        }
    }

    public worldToTile(coord: THREE.Vector3): Point {
        return new Point(Math.floor(coord.x + 0.5), Math.floor(coord.z + 0.5));
    }

    public tileToWorld(tile: Point): THREE.Vector3 {
        const elevation = this.getElevation(tile);
        return new THREE.Vector3(tile.x, elevation, tile.y);
    }
}
