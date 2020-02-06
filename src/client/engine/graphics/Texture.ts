import * as THREE from 'three';

export interface Texture3D {
    diffuse: THREE.Texture;
    depth: THREE.Texture;
    // normal: THREE.Texture;
    // ao: THREE.Texture;
    // roughness: THREE.Texture;
}

export function loadTexture(src: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(
            src,
            (texture) => {
                resolve(texture);
            },
            (prog) => {},
            (err) => reject(err),
        );
    });
}

export function loadTexture3D(src: string): Promise<Texture3D> {
    return new Promise((resolve, reject) => {
        Promise.all([
            loadTexture(`${src}/diffuse.jpg`),
            loadTexture(`${src}/depth.png`),
        ]).then((texs) => {
            resolve(<Texture3D>{
                diffuse: texs[0],
                depth: texs[1],
            });
        });
    });
}
