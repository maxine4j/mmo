import * as THREE from 'three';
import { TilePoint } from '../common/Point';
import Input from '../client/engine/Input';
import EditorProps from './EditorProps';

export default class Brush {
    private mesh: THREE.Mesh;
    private _size: number = 1;
    private props: EditorProps;
    public point: TilePoint;

    public onSizeChange: (size: number) => void;

    public constructor(props: EditorProps) {
        this.props = props;
        const geom = new THREE.SphereGeometry(1, 32, 32);
        const mat = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            opacity: 0.5,
            transparent: true,
        });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.name = 'brush';
    }

    public hide(): void {
        this.props.scene.remove(this.mesh);
    }

    public show(): void {
        this.props.scene.add(this.mesh);
    }

    public get size(): number { return this._size; }
    public set size(size: number) {
        // updates mesh too via scale
        this._size = Math.max(0, size);
        this.mesh.scale.setScalar(Math.max(0.5, this._size));
        // call listener
        if (this.onSizeChange) this.onSizeChange(this._size);
    }

    public pointsIn(): TilePoint[] {
        if (!this.props.point) {
            return [];
        }

        const imin = Math.max(this.props.world.minTileY, this.point.y - this.size);
        const imax = Math.min(imin + (this.size * 2) + 1, this.props.world.maxTileY);
        const jmin = Math.max(this.props.world.minTileX, this.point.x - this.size);
        const jmax = Math.min(jmin + (this.size * 2) + 1, this.props.world.maxTileX);
        const points: TilePoint[] = [];
        for (let i = imin; i < imax; i++) {
            for (let j = jmin; j < jmax; j++) {
                const pij = new TilePoint(j, i, this.props.world.w);
                const dist = this.point.dist(pij);
                if (dist <= this.size) {
                    points.push(pij);
                }
            }
        }
        return points;
    }

    private updatePoint(): void {
        if (this.props.point) {
            this.point = this.props.point.toTile();
            this.mesh.position.copy(this.point.toWorld());
        }
    }

    private updateSize(): void {
        // brush size
        if (Input.wasKeyPressed(']')) {
            this.size++;
        }
        if (Input.wasKeyPressed('[')) {
            this.size--;
        }
    }

    public update(): void {
        this.updateSize();
        this.updatePoint();
    }
}
