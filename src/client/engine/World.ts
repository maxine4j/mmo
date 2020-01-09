import * as THREE from 'three';
import Chunk from './Chunk';
import Scene from './graphics/Scene';
import Player from './Player';
import Input, { MouseButton } from './Input';

export default class World {
    private scene: Scene;
    public chunks: Map<number, Chunk> = new Map();
    private player: Player;

    public constructor(scene: Scene) {
        this.scene = scene;
        this.player = new Player(this.scene);
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

    public update(delta: number, mousePos: THREE.Vector3) {
        this.player.update(delta, this);

        // move the player
        if (Input.isMouseDown(MouseButton.RIGHT)) {
            const tile = this.worldToTile(mousePos);
            this.player.character.posX = tile.x;
            this.player.character.posY = tile.y;
        }
    }

    public worldToTile(coord: THREE.Vector3): { x: number, y: number } {
        return { x: Math.round(coord.x), y: Math.round(coord.z) };
    }

    public tileToWorld(tileX: number, tileY: number): THREE.Vector3 {
        const elevation = this.getElevation(tileX, tileY);
        return new THREE.Vector3(tileX, elevation, tileY);
    }

    public getElevation(tileX: number, tileY: number): number {
        for (const [_, chunk] of this.chunks) {
            // transform tile coords to chunk coords
            const chunkX = tileX - (chunk.size * chunk.x);
            const chunkY = tileY - (chunk.size * chunk.y);

            if (chunkX > -75 && chunkX < 75
                && chunkY > -75 && chunkY < 75) {
                return chunk.getElevation(chunkX, chunkY);
            }
        }
        return null;
    }

    public terrainWireframes(visible: boolean) {
        for (const [_, chunk] of this.chunks) {
            if (visible) {
                chunk.terrain.showWireframe();
            } else {
                chunk.terrain.hideWireFrame();
            }
        }
    }
}
