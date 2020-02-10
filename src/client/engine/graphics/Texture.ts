import * as THREE from 'three';
import { DataTexture2DArray } from 'three/src/textures/DataTexture2DArray';
import ChunkDef from '../../../common/ChunkDef';
import AssetManager from '../asset/AssetManager';

const strideRBGA = 4;
export const defaultBlendSize = 1024;

export type ImageData3D = { data: Uint8Array, width: number, height: number, depth: number };

export class Texture3D extends DataTexture2DArray {
    public srcs: string[];
}

export interface TerrainTextureDef {
    id: string;
    diffuse: HTMLImageElement;
    depth: HTMLImageElement;
}

export interface TerrainTexture {
    id: string;
    count: number;
    layerIDs: string[];
    diffuse: Texture3D;
    depth: Texture3D;
    blend: Texture3D;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src; // this supports data uri too
    });
}

function load3Dtexture(imgs: HTMLImageElement[]): Texture3D {
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

    const texture = new Texture3D(data, width, height, depth);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.format = THREE.RGBAFormat; // these might be defaults?
    texture.type = THREE.UnsignedByteType;

    return texture;
}

export async function loadTerrainTexture(def: ChunkDef): Promise<TerrainTexture> {
    // change group by to type from layer
    const blendImgPromises: Promise<HTMLImageElement>[] = [];
    const texturePromises: Promise<TerrainTextureDef>[] = [];
    for (const texDef of def.textures) {
        texturePromises.push(AssetManager.getTerrain(texDef.id));
        blendImgPromises.push(loadImage(texDef.blend));
    }
    const textures = await Promise.all(texturePromises);
    const blendImgs = await Promise.all(blendImgPromises);

    const diffuseImgs: HTMLImageElement[] = [];
    const depthImgs: HTMLImageElement[] = [];
    const layerIDs: string[] = [];
    for (const texDef of textures) {
        diffuseImgs.push(texDef.diffuse);
        depthImgs.push(texDef.depth);
        layerIDs.push(texDef.id);
    }


    // load the textures
    const [diffuse, depth, blend] = await Promise.all([
        load3Dtexture(diffuseImgs),
        load3Dtexture(depthImgs),
        load3Dtexture(blendImgs),
    ]);

    // diffuse.srcs = diffuseSrcs;
    // depth.srcs = depthSrcs;

    return <TerrainTexture>{
        count: def.textures.length,
        layerIDs,
        diffuse,
        depth,
        blend,
    };
}
