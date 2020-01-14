import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import Input from '../client/engine/Input';
import Scene from '../client/engine/graphics/Scene';
import WorldPoint from './WorldPoint';
import Point from '../common/Point';
import ChunkDef from '../common/Chunk';
import ChunkWorld from '../client/engine/ChunkWorld';

export default class Brush {
    private mesh: THREE.Mesh;
    private _size: number = 1;
    private point: WorldPoint;

    public constructor(scene: Scene) {
        const geom = new THREE.SphereGeometry(1, 32, 32);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            opacity: 0.5,
            transparent: true,
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.name = 'brush';
        scene.add(this.mesh);
    }

    public get size(): number { return this._size; }
    public set size(size: number) {
        // updates mesh too via scale
        this._size = Math.max(0, size);
        this.mesh.scale.setScalar(Math.max(0.5, this._size));
    }

    public pointsIn(def: ChunkDef): Point[] {
        const imin = Math.max(0, this.point.chunk.y - this.size);
        const imax = Math.min(imin + (this.size * 2) + 1, def.size);
        const jmin = Math.max(0, this.point.chunk.x - this.size);
        const jmax = Math.min(jmin + (this.size * 2) + 1, def.size);
        const points: Point[] = [];
        for (let i = imin; i < imax; i++) {
            for (let j = jmin; j < jmax; j++) {
                const pij = new Point(j, i);
                const dist = Point.dist(this.point.chunk, pij);
                if (dist - 0.75 <= this.size) {
                    points.push(pij);
                }
            }
        }
        return points;
    }

    private updatePoint(wp: WorldPoint, world: ChunkWorld) {
        if (wp.tile) {
            this.point = wp;
            const p = world.tileToWorld(wp.tile);
            this.mesh.position.copy(p);
        }
    }

    private updateSize() {
        if (Input.wasKeyPressed(Key.PageUp)) {
            this.size += 1;
        }
        if (Input.wasKeyPressed(Key.PageDown)) {
            this.size -= 1;
        }
    }

    public update(delta: number, wp: WorldPoint, world: ChunkWorld) {
        this.updatePoint(wp, world);
        this.updateSize();
    }
}
