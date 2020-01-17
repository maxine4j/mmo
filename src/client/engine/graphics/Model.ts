import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';

interface AnimsDict {
    [index: string]: string
}

interface ModelDef {
    main: string;
    animDir: string;
    anims: AnimsDict;
}

export default class Model {
    public mixer: THREE.AnimationMixer;
    private lazyAnims: Map<string, string> = new Map();
    private animations: Map<string, AnimationAction> = new Map();
    public gltf: GLTF;

    public constructor(gltf: GLTF) {
        this.gltf = gltf;
        this.mixer = new THREE.AnimationMixer(this.obj);
        this.initObj();
    }

    private initObj(): void {
        this.obj.receiveShadow = true;
        this.obj.castShadow = true;
    }

    public lazyLoadAnims(nameSrc: [string, string][]): void {
        nameSrc.forEach((ns) => this.lazyLoadAnim(ns[0], ns[1]));
    }

    public async loadAnims(nameSrc: [string, string][]): Promise<AnimationAction[]> {
        return Promise.all(nameSrc.map((ns) => this.loadAnim(ns[0], ns[1])));
    }

    public lazyLoadAnim(name: string, src: string): void {
        this.lazyAnims.set(name, src);
    }

    public async loadAnim(name: string, src: string): Promise<AnimationAction> {
        return new Promise((resolve) => {
            const loader = new GLTFLoader();
            loader.load(src, (gltf) => {
                const action = this.mixer.clipAction(gltf.animations[0]);
                this.animations.set(name, action);
                resolve(action);
            });
        });
    }

    public static async load(src: string): Promise<Model> {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(src, (gltf) => {
                const model = new Model(gltf);
                model.gltf = gltf;
                resolve(model);
            });
        });
    }

    public static async loadDef(src: string, lazy: boolean = true): Promise<Model> {
        return new Promise((resolve, reject) => {
            fetch(src).then((resp) => { // fetch the json def file
                resp.json().then((data: ModelDef) => { // parse it
                    // get absolute main model path
                    const rootDirParts = src.split('.')[0].split('/');
                    rootDirParts.pop();
                    const rootDir = rootDirParts.join('/');
                    const modelSrc = `${rootDir}/${data.main}`;
                    // get absolute anim paths
                    const animSrcs: [string, string][] = [];
                    for (const animName in data.anims) {
                        const animSrc = `${rootDir}/${data.animDir}/${data.anims[animName]}`;
                        animSrcs.push([animName, animSrc]);
                    }

                    // load the main model
                    const loader = new GLTFLoader();
                    loader.load(modelSrc, (gltf) => {
                        const model = new Model(gltf);
                        // load all anims
                        if (lazy) {
                            model.lazyLoadAnims(animSrcs);
                            resolve(model);
                        } else {
                            model.loadAnims(animSrcs).then(() => resolve(model));
                        }
                    });
                });
            });
        });
    }

    public get obj(): THREE.Object3D {
        return this.gltf.scene;
    }

    public update(delta: number): void {
        this.mixer.update(delta);
    }

    public getAnim(name: string): Promise<AnimationAction> {
        return new Promise((resolve) => {
            const anim = this.animations.get(name);
            if (anim) {
                resolve(anim);
            } else {
                const animSrc = this.lazyAnims.get(name);
                this.loadAnim(name, animSrc).then((a) => resolve(a));
            }
        });
    }
}
