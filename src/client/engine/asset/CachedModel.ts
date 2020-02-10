import * as THREE from 'three';
import { EventEmitter } from 'events';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { ModelAssetDef } from './AssetDef';

type CachedModelEvent = 'loaded' | 'loadError' | 'animLoaded' | 'animLoadError';

export class CachedAnimation {
    public id: string;
    public clip: THREE.AnimationClip;

    public constructor(id: string, clip: THREE.AnimationClip) {
        this.id = id;
        this.clip = clip;
    }
}

export default class CachedModel {
    private eventEmitter: EventEmitter = new EventEmitter();
    public def: ModelAssetDef;
    public gltf: GLTF;
    public animations: Map<string, CachedAnimation> = new Map();

    public get loaded(): boolean { return this.gltf != null; }

    public constructor(def: ModelAssetDef) {
        this.def = def;
        this.eventEmitter.setMaxListeners(2048);

        // load the model from file
        const loader = new GLTFLoader();
        loader.load(
            this.def.src,
            (gltf) => {
                this.gltf = gltf;
                this.emit('loaded', this);
            },
            (prog) => {},
            (err) => {
                this.emit('loadError', this, err);
            },
        );
    }

    public on(event: CachedModelEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: CachedModelEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    private emit(event: CachedModelEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public loadAnim(id: string): Promise<CachedAnimation> {
        return new Promise((resolve, reject) => {
            const animSrc = this.def.anims[id];
            if (animSrc == null) {
                reject(new Error(`Animation not found in model definition: ${id}`));
            } else {
                // load the animation from file
                const loader = new GLTFLoader();
                loader.load(
                    animSrc,
                    (gltf) => {
                        const clip = gltf.animations[0];
                        const ca = new CachedAnimation(id, clip);
                        this.animations.set(ca.id, ca);
                        this.emit('animLoaded', ca);
                        resolve(ca);
                    },
                    (prog) => {},
                    (err) => {
                        this.emit('animLoadError', err);
                        reject(err);
                    },
                );
            }
        });
    }

    public cloneObject3D(): THREE.Object3D {
        return <THREE.Object3D>SkeletonUtils.clone(this.gltf.scene);
    }
}
