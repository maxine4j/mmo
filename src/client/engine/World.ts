import * as THREE from 'three';
import Chunk from './Chunk';
import Scene from './graphics/Scene';

export default class World {
    private scene: Scene;
    public chunks: Map<number, Chunk> = new Map();

    public constructor(scene: Scene) {
        this.scene = scene;
    }

    public async loadChunk(id: number): Promise<Chunk> {
        return new Promise((resolve) => {
            Chunk.load(id).then((chunk) => {
                this.chunks.set(id, chunk);
                this.scene.add(chunk.terrain.plane);
                resolve(chunk);
            });
        });
    }

    public tileCoord(coord: THREE.Vector3): { x: number, y: number } {
        return { x: coord.x, y: coord.z };
    }
}
