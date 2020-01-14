import * as THREE from 'three';
import Point from '../common/Point';
import ChunkWorld from '../client/engine/ChunkWorld';

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
}
