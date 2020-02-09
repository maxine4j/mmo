import * as THREE from 'three';
import { DataTexture2DArray } from 'three/src/textures/DataTexture2DArray';
import ChunkDef from '../../../common/ChunkDef';

const strideRBGA = 4;
export const defaultBlendSize = 1024;

export type ImageData3D = { data: Uint8Array, width: number, height: number, depth: number };

export class Texture3D extends DataTexture2DArray {
    public srcs: string[];
}

export interface TerrainTexture {
    count: number;
    diffuse: Texture3D;
    depth: Texture3D;
    blend: Texture3D;
}

async function load3Dtexture(srcs: string[]): Promise<Texture3D> {
    // load all the images as <img> tags
    const promises: Promise<HTMLImageElement>[] = [];
    for (const src of srcs) {
        promises.push(new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src; // this supports data uri too
        }));
    }
    const imgs = await Promise.all(promises);

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
    const diffuseSrcs: string[] = [];
    const depthSrcs: string[] = [];
    const blendData: string[] = [];
    for (const texDef of def.textures) {
        diffuseSrcs.push(texDef.diffuse);
        depthSrcs.push(texDef.depth);
        blendData.push(texDef.blend);
    }

    // load the textures
    const [diffuse, depth, blend] = await Promise.all([
        load3Dtexture(diffuseSrcs),
        load3Dtexture(depthSrcs),
        load3Dtexture(blendData),
    ]);

    diffuse.srcs = diffuseSrcs;
    depth.srcs = depthSrcs;

    return <TerrainTexture>{
        count: diffuseSrcs.length,
        diffuse,
        depth,
        blend,
    };
}
