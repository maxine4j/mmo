import * as THREE from 'three';
import ChunkDef from '../../common/definitions/ChunkDef';
import ChunkWorld from './ChunkWorld';
import Doodad from './Doodad';
import TerrainMaterial, { ImageData3D } from './graphics/materials/TerrainMaterial';
import AssetManager from './asset/AssetManager';
import Water from './graphics/Water';

export default class Chunk {
    public def: ChunkDef;
    public doodads: Map<string, Doodad> = new Map();
    public waters: Map<string, Water> = new Map();
    public world: ChunkWorld;
    public terrain: THREE.Mesh;
    public wireframe: THREE.LineSegments;
    private wireframeVisible: boolean;
    private _isLoaded: boolean;
    public material: TerrainMaterial;
    public get texture(): THREE.Texture { return this.material.texture.diffuse; } // TODO: this is used for minimap
    private minimapCanvas: OffscreenCanvas;
    public get minimap(): OffscreenCanvas { return this.minimapCanvas; }

    public constructor(def: ChunkDef, world: ChunkWorld, material: TerrainMaterial) {
        this.def = def;
        this.world = world;
        this.material = material;
        this._isLoaded = false;
        const geometry = this.generateTerrain();
        geometry.computeVertexNormals();
        this.terrain = new THREE.Mesh(geometry, this.material);
        this.terrain.name = 'terrain';
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = true;
        this.terrain.userData = {
            chunk: this,
        };
        this.loadDoodads();
        this.positionInWorld();
        this.positionDoodads();

        this.loadWater();

        const diffuseImg = <ImageData3D> this.material.texture.diffuse.image;
        this.minimapCanvas = new OffscreenCanvas(diffuseImg.width, diffuseImg.height);
        this.updateMinimapRender();
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

    private loadWater(): void {
        for (const wdef of this.def.waters) {
            this.waters.set(wdef.id, new Water(this, wdef, !this.world.isEditor));
        }
    }

    private getAlphaFromBlend(diffuse: ImageData3D, blend: ImageData3D, layer: number, x: number, y: number): number {
        // scale index
        const bx = Math.floor((blend.width / diffuse.width) * x);
        const by = Math.floor((blend.height / diffuse.height) * y);
        const depthOffset = blend.width * blend.height * 4 * layer;
        const idx = (by * blend.width + bx) * 4;
        return blend.data[depthOffset + idx];
    }

    public updateMinimapRender(): void {
        const diffuseImg = <ImageData3D> this.material.texture.diffuse.image;
        const blendImg = <ImageData3D> this.material.texture.blend.image;
        const strideRGBA = 4;

        const layerCanvas = new OffscreenCanvas(diffuseImg.width, diffuseImg.height);
        const mainCtx = this.minimapCanvas.getContext('2d');
        const layerCtx = layerCanvas.getContext('2d');
        mainCtx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

        // build an image data for each layer, with blend map applied to alpha channel
        for (let layer = 0; layer < this.material.texture.layerIDs.length - 1; layer++) {
            const depthOffset = diffuseImg.width * diffuseImg.height * strideRGBA * layer;
            const data = new ImageData(diffuseImg.width, diffuseImg.height);
            // get layer image with alpha
            for (let yi = 0; yi < diffuseImg.height; yi++) {
                for (let xi = 0; xi < diffuseImg.width; xi++) {
                    const idx = (yi * diffuseImg.width + xi) * strideRGBA;
                    data.data[idx] = diffuseImg.data[depthOffset + idx];
                    data.data[idx + 1] = diffuseImg.data[depthOffset + idx + 1];
                    data.data[idx + 2] = diffuseImg.data[depthOffset + idx + 2];
                    if (layer === 0) data.data[idx + 3] = 255; // always have the first layer at full opacity
                    else data.data[idx + 3] = this.getAlphaFromBlend(diffuseImg, blendImg, layer, xi, yi);
                }
            }
            // draw image to the canvas
            layerCtx.putImageData(data, 0, 0);
            mainCtx.drawImage(layerCanvas, 0, 0);
        }
    }

    public reloadMaterial(): void {
        AssetManager.loadTerrainTexture(this.def).then((tex) => {
            const oldMat = this.material;
            this.material = new TerrainMaterial(tex);
            this.terrain.material = this.material;
            oldMat.dispose();
        }).catch((err) => console.log(err));
    }

    public static async load(def: ChunkDef, world: ChunkWorld): Promise<Chunk> {
        const tex = await AssetManager.loadTerrainTexture(def);
        return new Chunk(def, world, new TerrainMaterial(tex));
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
        } else {
            // no chunk to the west, so set these verts to the same as their next eastern neighbour
            for (let i = 0; i < stride; i++) {
                const chunkIdx = i * stride + (stride - 1);
                const vertEastIdx = i * stride + ((stride - 1) - 1);
                chunkVerts[chunkIdx * 3 + 1] = chunkVerts[vertEastIdx * 3 + 1];
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
        } else {
            // no chunk to the south, so set these verts to the same as their next northern neighbour
            for (let j = 0; j < stride; j++) {
                const chunkIdx = (stride - 1) * stride + j;
                const vertNorthIdx = (stride - 2) * stride + j;
                chunkVerts[chunkIdx * 3 + 1] = chunkVerts[vertNorthIdx * 3 + 1];
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

    public update(delta: number): void {
        for (const [_, w] of this.waters) {
            w.update(delta);
        }
    }
}
