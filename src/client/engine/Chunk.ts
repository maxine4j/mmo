import * as THREE from 'three';
import ChunkDef from '../../common/ChunkDef';
import ChunkWorld from './ChunkWorld';
import Doodad from './Doodad';
import TerrainMaterial from './graphics/materials/TerrainMaterial';
import AssetManager from './asset/AssetManager';

export default class Chunk {
    public def: ChunkDef;
    public doodads: Map<string, Doodad> = new Map();
    public world: ChunkWorld;
    public terrain: THREE.Mesh;
    public wireframe: THREE.LineSegments;
    private wireframeVisible: boolean;
    private _isLoaded: boolean;
    public material: TerrainMaterial;
    public get texture(): THREE.Texture { return this.material.texture.diffuse; } // TODO: this is used for minimap

    public constructor(def: ChunkDef, world: ChunkWorld, material: TerrainMaterial) {
        this.def = def;
        this.world = world;
        this.material = material;
        this._isLoaded = false;
        const geometry = this.generateTerrain();
        geometry.computeVertexNormals();

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.name = 'terrain';
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = true;
        this.terrain.userData = {
            chunk: def,
        };
        this.loadDoodads();
        this.positionInWorld();
        this.positionDoodads();
    }

    public get isLoaded(): boolean {
        return this._isLoaded;
    }
    public set isLoaded(val: boolean) {
        if (val && !this._isLoaded) {
            this.load(); // load the chunk if val is true and chunk is not currently loaded
        } else if (!val && this._isLoaded) {
            this.unload(); // unload the chunk if val is false and chunk is currently loaded
        }
        this._isLoaded = val;
    }

    public reloadMaterial(): void {
        AssetManager.loadTerrainTexture(this.def).then((tex) => {
            const oldMat = this.material;
            this.material = new TerrainMaterial(tex);
            this.terrain.material = this.material;
            oldMat.dispose();
        }).catch((err) => console.log(err));
    }

    public static load(def: ChunkDef, world: ChunkWorld): Promise<Chunk> {
        return new Promise((resolve, reject) => {
            AssetManager.loadTerrainTexture(def).then((tex) => {
                resolve(new Chunk(def, world, new TerrainMaterial(tex)));
            }).catch((err) => reject(err));
        });
    }

    private loadDoodads(): void {
        for (const doodadDef of this.def.doodads) {
            Doodad.load(doodadDef, this).then((doodad) => {
                this.doodads.set(doodad.def.uuid, doodad);
            });
        }
    }

    public load(): void {
        this.world.scene.add(this.terrain);
        for (const [_, dd] of this.doodads) {
            dd.load();
        }
        this._isLoaded = true;
    }

    public unload(): void {
        for (const [_, doodad] of this.doodads) {
            doodad.unload();
        }
        this.world.scene.remove(this.terrain);
        this._isLoaded = false;
    }

    public updateWireframe(): void {
        if (this.wireframe) this.terrain.remove(this.wireframe);
        const geo = new THREE.WireframeGeometry(this.terrain.geometry);
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        this.wireframe = new THREE.LineSegments(geo, mat);
        if (this.wireframeVisible) this.terrain.add(this.wireframe);
    }

    public setWireframeVisibility(visible: boolean): void {
        this.wireframeVisible = visible;
        if (this.wireframeVisible) {
            this.updateWireframe();
            this.terrain.add(this.wireframe);
        } else if (this.wireframe) {
            this.terrain.remove(this.wireframe);
        }
    }

    public positionInWorld(): void {
        this.terrain.position.set(this.def.x * this.world.chunkSize, 0, this.def.y * this.world.chunkSize);
    }

    public positionDoodads(): void {
        for (const [_, doodad] of this.doodads) {
            doodad.positionInWorld();
        }
    }

    public get size(): number { return this.world.chunkSize; }

    public stitch(): void {
        this.stitchVerts();
        this.terrain.geometry.computeVertexNormals();
        this.stitchNormals();
    }

    public stitchNormals(): void {
        const westChunk: Chunk = this.world.chunks.get(this.def.x + 1, this.def.y);
        const southChunk: Chunk = this.world.chunks.get(this.def.x, this.def.y + 1);

        const stride = this.world.chunkSize + 1;
        // @ts-ignore
        const chunkNormals = this.terrain.geometry.attributes.normal.array;
        if (westChunk) {
            // @ts-ignore
            const westNormals = westChunk.terrain.geometry.attributes.normal.array;
            // set the west edge of chunk to the east edge of westChunk
            for (let i = 0; i < stride; i++) {
                const chunkIdx = i * stride + (stride - 1);
                const westIdx = i * stride + 0;
                for (let nidx = 0; nidx < 3; nidx++) {
                    chunkNormals[chunkIdx * 3 + nidx] = westNormals[westIdx * 3 + nidx];
                }
            }
        }
        if (southChunk) {
            // @ts-ignore
            const southNormals = southChunk.terrain.geometry.attributes.normal.array;
            // set the south edge of chunk to the north edge of southChunk
            for (let j = 0; j < stride; j++) {
                const chunkIdx = (stride - 1) * stride + j;
                const westIdx = 0 * stride + j;
                for (let nidx = 0; nidx < 3; nidx++) {
                    chunkNormals[chunkIdx * 3 + nidx] = southNormals[westIdx * 3 + nidx];
                }
            }
        }
        // @ts-ignore
        this.terrain.geometry.attributes.normal.needsUpdate = true;
    }

    public stitchVerts(): void {
        const westChunk: Chunk = this.world.chunks.get(this.def.x + 1, this.def.y);
        const southChunk: Chunk = this.world.chunks.get(this.def.x, this.def.y + 1);

        const stride = this.world.chunkSize + 1;
        // @ts-ignore
        const chunkVerts = this.terrain.geometry.attributes.position.array;
        if (westChunk) {
            // @ts-ignore
            const westVerts = westChunk.terrain.geometry.attributes.position.array;
            // set the west edge of chunk to the east edge of westChunk
            for (let i = 0; i < stride; i++) {
                const chunkIdx = i * stride + (stride - 1);
                const westIdx = i * stride + 0;
                chunkVerts[chunkIdx * 3 + 1] = westVerts[westIdx * 3 + 1];
            }
        }
        if (southChunk) {
            // @ts-ignore
            const southVerts = southChunk.terrain.geometry.attributes.position.array;
            // set the south edge of chunk to the north edge of southChunk
            for (let j = 0; j < stride; j++) {
                const chunkIdx = (stride - 1) * stride + j;
                const westIdx = 0 * stride + j;
                chunkVerts[chunkIdx * 3 + 1] = southVerts[westIdx * 3 + 1];
            }
        }
        // @ts-ignore
        this.terrain.geometry.attributes.position.needsUpdate = true;
    }

    private generateTerrain(): THREE.BufferGeometry {
        // buffers
        const indices: Array<number> = [];
        const vertices: Array<number> = [];
        const uvs: Array<number> = [];

        const tileWidth = 1;
        const tileHeight = 1;

        const size = this.world.chunkSize + 1;

        // generate vertices and uvs
        for (let iz = 0; iz < size; iz++) {
            const z = iz * tileHeight - (size / 2);
            for (let ix = 0; ix < size; ix++) {
                const x = ix * tileWidth - (size / 2);
                const y = this.def.heightmap[iz * size + ix] || 0;
                vertices.push(x, y, z);
                // const uvidx = (iz * size + ix) * 2;
                // const u = this.def.texturemap[uvidx];
                // const v = this.def.texturemap[uvidx + 1];
                // uvs.push(u, v);
                uvs.push(ix / size);
                uvs.push(1 - (iz / size));
            }
        }

        // indices
        for (let iz = 0; iz < size - 1; iz++) {
            for (let ix = 0; ix < size - 1; ix++) {
                const a = ix + size * iz;
                const b = ix + size * (iz + 1);
                const c = (ix + 1) + size * (iz + 1);
                const d = (ix + 1) + size * iz;

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
