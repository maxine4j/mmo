import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

export default class Model {
    private _gltf: GLTF;
    private _fbx: THREE.Group;
    private mixer: THREE.AnimationMixer;

    public constructor(obj: GLTF | THREE.Group) {
        if (obj instanceof THREE.Group) {
            this._fbx = obj;
            this.mixer = new THREE.AnimationMixer(this.obj);
        } else {
            this._gltf = obj;
            this.mixer = new THREE.AnimationMixer(this.obj);
        }
    }

    public static async load(src: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(src, (gltf) => {
                resolve(new Model(gltf));
            });
        });
    }

    public static async loadFbx(src: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const loader = new FBXLoader();
            loader.load(src, (obj) => {
                resolve(new Model(obj));
            });
        });
    }

    public get gltf(): GLTF {
        return this._gltf;
    }

    public get obj(): THREE.Object3D {
        return this._gltf.scene;
    }

    public playAnim(name: string) {
        const clip = THREE.AnimationClip.findByName(this.gltf.animations, name);
        const action = this.mixer.clipAction(clip);
        action.play();
    }

    public update(delta: number) {
        this.mixer.update(delta);
    }
}
