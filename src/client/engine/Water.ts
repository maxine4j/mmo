import * as THREE from 'three';
import WaterMaterial from './graphics/materials/WaterMaterial';
import { WaterDef } from '../../common/ChunkDef';
import AssetManager from './asset/AssetManager';
import Chunk from './Chunk';
import { ChunkPoint } from '../../common/Point';

export default class Water {
    public def: WaterDef;
    public chunk: Chunk;
    public material: WaterMaterial;
    public mesh: THREE.Mesh;

    public constructor(def: WaterDef, chunk: Chunk) {
        this.def = def;
        this.chunk = chunk;
        AssetManager.loadTexture(def.material)
            .then((tex) => {
                this.material = new WaterMaterial(tex);
                this.material.setupFromDef(def);
                this.rebuild();
            })
            .catch((err) => console.log(err));
    }

    public rebuild(): void {
        if (this.mesh) this.chunk.world.scene.remove(this.mesh);

        const geometry = this.generateGeom();
        geometry.computeVertexNormals();
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.name = 'water';
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.userData = {
            water: this,
        };
        this.positionInWorld();
        this.chunk.world.scene.add(this.mesh);
    }

    public update(delta: number): void {
        if (this.material) {
            this.material.update(delta);
        }
    }

    public positionInWorld(): void {
        this.mesh.rotation.set(0, this.def.rotation, 0);

        const worldPoint = new ChunkPoint(this.def.x, this.def.y, this.chunk).toWorld();
        worldPoint.add(new THREE.Vector3(0, this.def.elevation, 0));
        this.mesh.position.copy(worldPoint);
    }

    private generateGeom(): THREE.BufferGeometry {
        // buffers
        const indices: Array<number> = [];
        const vertices: Array<number> = [];
        const uvs: Array<number> = [];

        const tileSize = 0.25;
        const dimZ = this.def.sizez / tileSize;
        const dimX = this.def.sizex / tileSize;

        console.log(dimZ, dimX);

        for (let iz = 0; iz < dimZ; iz++) {
            const z = (iz) - (this.def.sizez / 2);
            for (let ix = 0; ix < dimX; ix++) {
                const x = (ix) - (this.def.sizex / 2);
                const y = 0;
                vertices.push(x, y, z);
                uvs.push(ix / dimX);
                uvs.push(1 - (iz / dimZ));
            }
        }

        // indices
        for (let iz = 0; iz < this.def.sizez - 1; iz++) {
            for (let ix = 0; ix < dimX - 1; ix++) {
                const a = ix + dimX * iz;
                const b = ix + dimX * (iz + 1);
                const c = (ix + 1) + dimX * (iz + 1);
                const d = (ix + 1) + dimX * iz;

                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setIndex(indices);
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        return geom;
    }
}
