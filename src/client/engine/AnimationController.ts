import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import Model from './graphics/Model';

export default class AnimationController<T> {
    private model: Model;
    private animations: Map<T, AnimationAction> = new Map();
    private currentLoop: T;

    public constructor(model: Model) {
        this.model = model;
        this.model.mixer.addEventListener('finished', this.onMixerFinished.bind(this));
    }

    private onMixerFinished(ev: THREE.Event): void {
        this.play(this.currentLoop);
        // this.targetAngle = null;
        // if (this.killed) { // only mark as stale after death animation has played
        //     this.stale = true;
        // }
    }

    public playOnce(anim: T, clamp: boolean = false): void {
        const a = this.animations.get(anim);
        if (a) {
            a.clampWhenFinished = clamp;
            a.weight = 1;
            a.reset();
            this.model.mixer.stopAllAction();
            a.play();
        }
    }

    public load(id: T, contentID: string, loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat): void {
        this.model.getAnim(contentID).then((a) => {
            a.loop = loop;
            this.animations.set(id, a);
        }).catch(() => {});
    }

    public stop(anim: T): void {
        const a = this.animations.get(anim);
        if (a != null) a.stop();
    }

    public play(anim: T): void {
        const a = this.animations.get(anim);
        if (a != null) a.play();
    }

    public playOnly(anim: T): void {
        this.stopAllExcept(anim);
        this.play(anim);
    }

    public loop(anim: T): void {
        const a = this.animations.get(anim);
        if (a != null) {
            a.play();
            this.currentLoop = anim;
        }
    }

    public loopOnly(anim: T): void {
        this.stopAllExcept(anim);
        this.loop(anim);
    }

    public stopAll(): void {
        for (const [_, anim] of this.animations) {
            anim.stop();
        }
    }

    public stopAllExcept(execpt: T): void {
        for (const [id, anim] of this.animations) {
            if (id !== execpt) anim.stop();
        }
    }
}
