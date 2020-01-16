import * as THREE from 'three';
import Point from '../common/Point';
import ChunkWorld from '../client/engine/ChunkWorld';
import Scene from '../client/engine/graphics/Scene';
import Camera from '../client/engine/graphics/Camera';
import Input from '../client/engine/Input';

export default class WorldPoint {
    public world: THREE.Vector3;
    public tile: Point;
    public chunk: Point;
    public elevation: number;

    public set(coord: THREE.Vector3, world: ChunkWorld) {
        this.world = coord;
        this.tile = world.worldToTile(this.world);
        this.chunk = world.tileToChunk(this.tile);
        this.elevation = world.getElevation(this.tile);
    }

    public update(scene: Scene, camera: Camera, world: ChunkWorld) {
        const intersects = camera.rcast(scene, Input.mousePos());
        let idx = 0;
        while (idx < intersects.length) {
            const int = intersects[idx++];
            if (int.object.name === 'brush') {
                continue;
            }
            this.set(int.point, world);
        }
    }
}
