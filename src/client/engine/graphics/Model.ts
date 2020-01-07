import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';

export default class Model {
    private _obj: THREE.Object3D;
    public mixer: THREE.AnimationMixer;
    public animations: Map<string, AnimationAction>;

    public constructor(obj: THREE.Object3D) {
        this._obj = obj;
        this.mixer = new THREE.AnimationMixer(this.obj);
        this.animations = new Map();
        this.initObj();
    }

    private initObj() {
        this._obj.receiveShadow = true;
        this._obj.castShadow = true;
    }

    public async loadAnimGLTF(name: string, src: string): Promise<AnimationAction> {
        return new Promise((resolve) => {
            const loader = new GLTFLoader();
            loader.load(src, (gltf) => {
                const action = this.mixer.clipAction(gltf.animations[0]);
                this.animations.set(name, action);
                resolve(action);
            });
        });
    }

    public async loadAnimFBX(name: string, src: string): Promise<AnimationAction> {
        return new Promise((resolve) => {
            const loader = new FBXLoader();
            loader.load(src, (obj) => {
                // @ts-ignore
                const action = this.mixer.clipAction(obj.animations[0]);
                this.animations.set(name, action);
                resolve(action);
            });
        });
    }

    public static async loadGLTF(src: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(src, (gltf) => {
                resolve(new Model(gltf.scene));
            });
        });
    }

    public static async loadFBX(src: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const loader = new FBXLoader();
            loader.load(src, (obj) => {
                resolve(new Model(obj));
            });
        });
    }

    public get obj(): THREE.Object3D {
        return this._obj;
    }

    // public playAnim(name: string) {
    //     const clip = THREE.AnimationClip.findByName(this.gltf.animations, name);
    //     const action = this.mixer.clipAction(clip);
    //     action.play();
    // }

    public update(delta: number) {
        this.mixer.update(delta);
    }
}
