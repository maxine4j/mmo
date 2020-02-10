import * as THREE from 'three';
import { DataTexture2DArray } from 'three/src/textures/DataTexture2DArray';
import ContentDef from './AssetDef';
import Model from '../graphics/Model';
import CachedModel from './CachedModel';
import _content from '../../assets/content.json';
import SpriteAtlas from './SpriteAtlas';
import ChunkDef from '../../../common/ChunkDef';

export const contentDef = <ContentDef>_content;

const strideRBGA = 4;
export const defaultBlendSize = 1024;

export interface TerrainTexture {
    id: string;
    count: number;
    layerIDs: string[];
    diffuse: DataTexture2DArray;
    depth: DataTexture2DArray;
    blend: DataTexture2DArray;
}

function load3Dtexture(imgs: HTMLImageElement[]): DataTexture2DArray {
    // size of the 3d texture
    const width = imgs.length > 0 ? imgs[0].width : defaultBlendSize;
    const height = imgs.length > 0 ? imgs[0].height : defaultBlendSize;
    const size = width * height;
    const depth = imgs.length;

    // create buffer to hold all pixel data
    const data: Uint8Array = new Uint8Array(size * depth * strideRBGA);
    let offset = 0;

    // create a canvas to extract pixel data with
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (const img of imgs) {
        // clear, draw, read, append to buffer
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        data.set(ctx.getImageData(0, 0, width, height).data, offset);
        offset += size * strideRBGA;
    }

    const texture = new DataTexture2DArray(data, width, height, depth);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.format = THREE.RGBAFormat; // these might be defaults?
    texture.type = THREE.UnsignedByteType;

    return texture;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}


export default class AssetManager {
    private static modelCache: Map<string, CachedModel> = new Map();
    private static atlasCache: Map<string, SpriteAtlas> = new Map();

    public static getModel(id: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const existing = this.modelCache.get(id);
            if (existing) {
                if (existing.loaded) {
                    // model is in cache and it is loaded
                    resolve(new Model(existing));
                } else {
                    // model is in cache but still being loaded
                    existing.on('loaded', () => resolve(new Model(existing)));
                    existing.on('loadError', (err) => reject(new Error(`Failed to load model data: ${id}`)));
                }
            } else {
                // model is not in cache, so load it and resolve when it is loaded
                const def = contentDef.content.models[id];
                if (def) {
                    // start a new cached model loading and save to the cache
                    const cm = new CachedModel(def);
                    this.modelCache.set(id, cm);
                    // return the model once it has loaded
                    cm.on('loaded', () => resolve(new Model(cm)));
                    cm.on('loadError', (err) => reject(new Error(`Failed to load model data: ${id}`)));
                } else {
                    reject(new Error(`Model not found in content definition: ${id}`));
                }
            }
        });
    }

    public static getAtlas(id: string): SpriteAtlas {
        const existing = this.atlasCache.get(id);
        if (existing) {
            return existing;
        }
        const def = contentDef.content.atlases[id];
        if (def) {
            const atlas = new SpriteAtlas(def);
            this.atlasCache.set(def.id, atlas);
            return atlas;
        }
        throw new Error(`Atlas not found in content definition: ${id}`);
    }

    public static async loadTerrainTexture(def: ChunkDef): Promise<TerrainTexture> {
        // load all the images
        const diffuseImgPromises: Promise<HTMLImageElement>[] = [];
        const depthImgPromises: Promise<HTMLImageElement>[] = [];
        const blendImgPromises: Promise<HTMLImageElement>[] = [];
        const layerIDs: string[] = [];
        for (const tdef of def.textures) {
            const cdef = contentDef.content.terrain[tdef.id];
            diffuseImgPromises.push(loadImage(cdef.diffuse));
            depthImgPromises.push(loadImage(cdef.depth));
            blendImgPromises.push(loadImage(tdef.blend));
            layerIDs.push(tdef.id);
        }
        const diffuseImgs = await Promise.all(diffuseImgPromises);
        const depthImgs = await Promise.all(depthImgPromises);
        const blendImgs = await Promise.all(blendImgPromises);

        // convert the images into 3d textures
        const [diffuse, depth, blend] = await Promise.all([
            load3Dtexture(diffuseImgs),
            load3Dtexture(depthImgs),
            load3Dtexture(blendImgs),
        ]);

        return <TerrainTexture>{
            count: def.textures.length,
            layerIDs,
            diffuse,
            depth,
            blend,
        };
    }
}
