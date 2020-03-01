import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import { EventEmitter } from 'events';
import Model from './Model';

declare interface AnimationController<T> {
    emit(event: 'finished', self: AnimationController<T>, loop: T): boolean;

    on(event: 'finished', listener: (self: AnimationController<T>, loop: T) => void): this;
}

class AnimationController<T> extends EventEmitter {
    private model: Model;
    private animations: Map<T, AnimationAction> = new Map();
    private currentLoop: T;
    private overrideAnim: T;

    public constructor(model: Model) {
        super();
        this.model = model;
        this.model.mixer.addEventListener('finished', (ev) => this.onMixerFinished(ev));
    }

    private onMixerFinished(ev: THREE.Event): void {
        this.overrideAnim = null;
        this.play(this.currentLoop);
        this.emit('finished', this, this.currentLoop);
    }

    public playOnce(anim: T, clamp: boolean = false): void {
        const a = this.animations.get(anim);
        if (a) {
            a.clampWhenFinished = clamp;
            a.weight = 1;
            a.reset();
            this.model.mixer.stopAllAction();
            this.overrideAnim = anim;
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
        for (const [id, anim] of this.animations) {
            if (id !== this.overrideAnim) anim.stop();
        }
    }

    public stopAllExcept(execpt: T): void {
        for (const [id, anim] of this.animations) {
            if (id !== execpt && id !== this.overrideAnim) anim.stop();
        }
    }
}

export default AnimationController;
