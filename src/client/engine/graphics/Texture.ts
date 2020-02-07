import * as THREE from 'three';
import { DataTexture2DArray } from 'three/src/textures/DataTexture2DArray';

export interface Texture3D {
    count: number;
    diffuse: DataTexture2DArray;
    depth: DataTexture2DArray;
    // normal: DataTexture2DArray;
    // ao: DataTexture2DArray;
    // roughness: DataTexture2DArray;
}

// export function loadTexture(src: string): Promise<THREE.Texture> {
//     return new Promise((resolve, reject) => {
//         const loader = new THREE.TextureLoader();
//         loader.load(
//             src,
//             (texture) => {
//                 resolve(texture);
//             },
//             (prog) => {},
//             (err) => reject(err),
//         );
//     });
// }

async function load3Dtexture(srcs: string[], ext: string): Promise<DataTexture2DArray> {
    // load all the images as <img> tags
    const promises: Promise<HTMLImageElement>[] = [];
    for (const src of srcs) {
        promises.push(new Promise((resolve, reject) => {
            const img = document.createElement('img');
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src + ext;
            console.log(`loading: ${img.src}`);
        }));
    }


    const imgs = await Promise.all(promises);

    // size of the 3d texture
    const width = imgs[0].width;
    const height = imgs[0].height;
    const size = width * height;
    const depth = imgs.length;
    const stride = 4; // RGBA stride

    console.log(`Images are ${width}x${height} and have a depth of ${depth}`);


    // create buffer to hold all pixel data
    const data: Uint8Array = new Uint8Array(size * depth * stride);
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
        offset += size * stride;
        console.log('Offset is now', offset, 'We expect', width * height * stride);
    }

    // const texture = new THREE.DataTexture3D(data, width, height, depth);
    const texture: DataTexture2DArray = new DataTexture2DArray(data, width, height, depth);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.format = THREE.RGBAFormat; // these might be defaults?
    texture.type = THREE.UnsignedByteType;

    return texture;
}

const exts = [
    '/diffuse.jpg',
    '/depth.png',
];

export async function loadTerrainTextures(srcs: string[]): Promise<Texture3D> {
    const promises: Promise<THREE.DataTexture3D>[] = [];
    for (const ext of exts) {
        console.log('STATING A LOAD FOR:', srcs, ext);
        promises.push(load3Dtexture(srcs, ext));
    }
    const textures = await Promise.all(promises);

    console.log('got some textures!', textures);


    return <Texture3D>{
        count: srcs.length,
        diffuse: textures[0], // TODO: this indexing isnt good
        depth: textures[1],
    };
}
