import * as THREE from 'three';

export default class Sprite extends THREE.Sprite {
    public static async load(src: string): Promise<Sprite> {
        return new Promise((resolve) => {
            const loader = new THREE.TextureLoader();
            loader.load(src, (map) => {
                const mat = new THREE.SpriteMaterial({ map, color: 0xffffff });
                resolve(new THREE.Sprite(mat));
            });
        });
    }
}
