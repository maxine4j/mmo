import * as THREE from 'three';
import { EventEmitter } from 'events';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { ModelAssetDef } from './AssetDef';

export class CachedAnimation {
    public id: string;
    public clip: THREE.AnimationClip;

    public constructor(id: string, clip: THREE.AnimationClip) {
        this.id = id;
        this.clip = clip;
    }
}

declare interface CachedModel {
    emit(event: 'loaded', self: CachedModel): boolean;
    emit(event: 'loadError', self: CachedModel, error: ErrorEvent): boolean;
    emit(event: 'animLoaded', self: CachedModel, anim: CachedAnimation): boolean;
    emit(event: 'animLoadError', self: CachedModel, error: ErrorEvent): boolean;

    on(event: 'loaded', listener: (self: CachedModel) => void): this;
    on(event: 'loadError', listener: (self: CachedModel, error: ErrorEvent) => void): this;
    on(event: 'animLoaded', listener: (self: CachedModel, anim: CachedAnimation) => void): this;
    on(event: 'animLoadError', listener: (self: CachedModel, error: ErrorEvent) => void): this;
}

class CachedModel extends EventEmitter {
    public def: ModelAssetDef;
    public gltf: GLTF;
    public animations: Map<string, CachedAnimation> = new Map();

    public get loaded(): boolean { return this.gltf != null; }

    public constructor(def: ModelAssetDef) {
        super();
        this.def = def;
        this.setMaxListeners(2048);

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
                        this.emit('animLoaded', this, ca);
                        resolve(ca);
                    },
                    (prog) => {},
                    (err) => {
                        this.emit('animLoadError', this, err);
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

export default CachedModel;
