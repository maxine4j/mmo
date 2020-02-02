import * as THREE from 'three';

export default class Sprite extends THREE.Sprite {
    public static load(src: string): Promise<Sprite> {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            try {
                loader.load(src, (map) => {
                    const mat = new THREE.SpriteMaterial({ map, color: 0xffffff });
                    resolve(new THREE.Sprite(mat));
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}
