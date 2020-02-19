import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import CachedModel, { CachedAnimation } from '../asset/CachedModel';

enum ModelPart {
    HANDS_UARMS_BELT_FACE = 0,
    LARMS = 1,
    LLEGS = 2,
    EARS = 3,
    ULEGS = 4,
    FEET = 5,
    TORSO = 6,
    EYEBROWS = 7,
    HAIR = 8,
    BEARD = 9,
    EARRINGS = 10,
}

function _modelPart(model: Model, part: ModelPart): THREE.Object3D {
    const rootNode = model.obj.children[0];
    const meshes = rootNode.children[1];
    return meshes.children[part];
}

export default class Model {
    private cache: CachedModel;
    private animations: Map<string, AnimationAction> = new Map();
    public obj: THREE.Object3D;
    public mixer: THREE.AnimationMixer;

    private animLoadedListender: (anim: CachedAnimation) => void = (anim: CachedAnimation) => {
        this.addAnim(anim);
    };

    public constructor(cache: CachedModel) {
        this.cache = cache;

        // set up mesh from cache
        this.obj = this.cache.cloneObject3D();
        this.obj.receiveShadow = true;
        this.obj.castShadow = true;
        this.obj.traverse((o) => { // make fbx converted models look normal
            if (o.type === 'SkinnedMesh') {
                // @ts-ignore
                o.material.metalness = 0;
            }
        });

        // set up animations from cache
        this.mixer = new THREE.AnimationMixer(this.obj);
        for (const [_, anim] of this.cache.animations) {
            this.addAnim(anim);
        }
        // ensure we get new animations as they are laoded
        this.cache.on('animLoaded', this.animLoadedListender);
    }

    public dispose(): void {
        this.cache.off('animLoaded', this.animLoadedListender);
        if (this.obj.parent) {
            this.obj.parent.remove(this.obj);
        }
    }

    public generateHitbox(minX: number, minY: number, minZ: number): void {
        const aabb = new THREE.Box3().setFromObject(this.obj);
        const box = new THREE.Mesh(
            new THREE.BoxBufferGeometry(
                Math.max(minX, aabb.max.x - aabb.min.x),
                Math.max(minY, aabb.max.y - aabb.min.y),
                Math.max(minZ, aabb.max.z - aabb.min.z),
            ),
            new THREE.MeshBasicMaterial({
                wireframe: true,
                color: new THREE.Color(0xFFFFFF),
                visible: false,
            }),
        );
        box.translateY((aabb.max.y - aabb.min.y) / 2);
        this.obj.add(box);
    }

    private addAnim(anim: CachedAnimation): void {
        this.animations.set(anim.id, this.mixer.clipAction(anim.clip));
    }

    public getAnim(id: string): Promise<AnimationAction> {
        return new Promise((resolve, reject) => {
            const existing = this.animations.get(id);
            if (existing) {
                resolve(existing);
            } else {
                this.cache.loadAnim(id)
                    .then((anim) => resolve(this.animations.get(id)))
                    .catch((err) => reject(err));
            }
        });
    }

    public playActionNow(action: AnimationAction): void {
        this.mixer.stopAllAction();
        action.reset();
        action.play();
    }

    public playAnim(name: string): void {
        this.mixer.stopAllAction();
        this.getAnim(name).then((a) => {
            a.play();
        });
    }

    public update(delta: number): void {
        this.mixer.update(delta);
    }
}
