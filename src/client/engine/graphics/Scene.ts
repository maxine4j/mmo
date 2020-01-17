import * as THREE from 'three';

export default class Scene extends THREE.Scene {
    public clear(): void {
        while (this.children.length > 0) {
            const child = this.children[0];
            // should probably dispose of resources here?
            this.remove(child);
        }
    }
}
