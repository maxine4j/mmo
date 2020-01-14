import * as THREE from 'three';
import ChunkDef, { DoodadDef } from '../../common/Chunk';
import Point from '../../common/Point';
import Model from './graphics/Model';
import Rectangle from '../../common/Rectangle';
import ChunkWorld from './ChunkWorld';

class Doodad {
    public def: DoodadDef;
    public model: Model;

    public constructor(def: DoodadDef, model: Model, chunk: Chunk) {
        this.def = def;
        this.model = model;

        // scale the doodad model
        this.model.obj.scale.set(this.def.scale, this.def.scale, this.def.scale);

        // rotate the doodad model
        this.model.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.def.rotation);

        // position the doodad model
        const tilePos = chunk.world.chunkToTile(chunk, new Point(this.def.x, this.def.y));
        const worldPos = chunk.world.tileToWorld(tilePos);
        this.model.obj.position.copy(worldPos);

        // add the doodad model to the scene
        chunk.world.scene.add(this.model.obj);
    }

    public static async load(def: DoodadDef, chunk: Chunk): Promise<Doodad> {
        return new Promise((resolve) => {
            Model.loadDef(`assets/models/${def.model}`).then((model) => {
                resolve(new Doodad(def, model, chunk));
            });
        });
    }
}

export default class Chunk {
    public def: ChunkDef;
    public doodads: Doodad[] = [];
    public world: ChunkWorld;
    public terrain: THREE.Mesh;
    private wireframe: THREE.LineSegments;
    private wireframeVisibility: boolean;

    public constructor(def: ChunkDef, world: ChunkWorld, texture?: THREE.Texture) {
        this.def = def;
        this.world = world;
        const geometry = this.generatePlane();
        let material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff });
        if (texture) {
            material = new THREE.MeshLambertMaterial({ map: texture });
        }
        this.terrain = new THREE.Mesh(geometry, material);
        this.loadDoodads();
    }

    public static async load(def: ChunkDef, world: ChunkWorld): Promise<Chunk> {
        console.log('im here now');

        return new Promise((resolve) => {
            console.log('made a texture loader to load', def.texture);
            const loader = new THREE.TextureLoader();
            loader.load(def.texture, (texture) => { // load the texture
                resolve(new Chunk(def, world, texture));
            });
        });
    }

    private loadDoodads() {
        for (const doodadDef of this.def.doodads) {
            Doodad.load(doodadDef, this).then((doodad) => {
                this.doodads.push(doodad);
            });
        }
    }

    public updateWireframe() {
        if (this.wireframe) this.terrain.remove(this.wireframe);
        const geo = new THREE.WireframeGeometry(this.terrain.geometry);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        this.wireframe = new THREE.LineSegments(geo, mat);
    }

    public setWireframeVisibility(visible: boolean) {
        this.wireframeVisibility = visible;
        if (this.wireframeVisibility) {
            this.updateWireframe();
            this.terrain.add(this.wireframe);
        } else if (this.wireframe) {
            this.terrain.remove(this.wireframe);
        }
    }

    public positionInWorld() {
        this.terrain.position.set(this.def.x * this.def.size, 0, this.def.y * this.def.size);
    }

    public worldOffset(): Point {
        return new Point(
            this.def.x - this.size / 2,
            this.def.y - this.size / 2,
        );
    }

    public containsPoint(point: Point): boolean {
        const offset = this.worldOffset();
        const bounds = new Rectangle(offset.x + this.size / 2, offset.y + this.size / 2, this.size, this.size);
        return bounds.contains(point);
    }

    public getElevation(chunk: Point): number {
        return this.def.heightmap[chunk.y * this.def.size + chunk.x];
    }

    public get size(): number { return this.def.size; }

    private generatePlane(): THREE.BufferGeometry {
        // buffers
        const indices: Array<number> = [];
        const vertices: Array<number> = [];
        const normals: Array<number> = [];
        const uvs: Array<number> = [];

        const tileWidth = 1;
        const tileHeight = 1;

        // generate vertices, normals and uvs
        for (let iz = 0; iz < this.def.size; iz++) {
            const z = iz * tileHeight - (this.def.size / 2);
            for (let ix = 0; ix < this.def.size; ix++) {
                const x = ix * tileWidth - (this.def.size / 2);
                const y = this.def.heightmap[iz * this.def.size + ix];
                vertices.push(x, y, z); // TODO: apply heightmap
                uvs.push(ix / this.def.size);
                uvs.push(1 - (iz / this.def.size));
            }
        }

        // indices
        for (let iz = 0; iz < this.def.size - 1; iz++) {
            for (let ix = 0; ix < this.def.size - 1; ix++) {
                const a = ix + this.def.size * iz;
                const b = ix + this.def.size * (iz + 1);
                const c = (ix + 1) + this.def.size * (iz + 1);
                const d = (ix + 1) + this.def.size * iz;

                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setIndex(indices);
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        return geom;
    }
}
