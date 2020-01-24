import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import Model from './graphics/Model';
import World from './World';
import UnitDef from '../../common/UnitDef';
import { TilePoint, Point } from '../../common/Point';

export enum UnitAnimation {
    WALK,
    RUN,
    STAND,
    COMBAT_IDLE,
    PUNCH,
    FLINCH,
    DEATH,
    DODGE,
    PARRY,
    LOOT,
    SPELL_DIRECTED,
    SPELL_OMNI,
}

export default class LocalUnit {
    public data: UnitDef;
    public world: World;
    public model: Model;
    public lastTickUpdated: number;
    private currentLoop: UnitAnimation;
    private animations: Map<UnitAnimation, AnimationAction> = new Map();
    private currentPosition: TilePoint;
    private targetPosition: TilePoint;
    private movesThisTick: number;
    private moveTimer: number;
    private targetAngle: number = null;

    public constructor(world: World, data: UnitDef) {
        this.world = world;
        this.data = data;
        this.loadModel();
    }

    public dispose(): void {
        this.world.scene.remove(this.model.obj);
    }

    public get position(): TilePoint { return this.currentPosition; }

    private loadModel(): void {
        if (this.data) {
            Model.loadDef(this.data.model)
                .then((model) => {
                    this.model = model;
                    this.model.obj.castShadow = true;
                    this.model.obj.receiveShadow = true;
                    this.model.obj.traverse((o) => {
                        o.userData = {
                            unit: this,
                        };
                    });

                    this.model.mixer.addEventListener('finished', this.onMixerFinished.bind(this));

                    this.model.getAnim('Walk').then((a) => {
                        a.loop = THREE.LoopRepeat;
                        this.animations.set(UnitAnimation.WALK, a);
                    });
                    this.model.getAnim('Run').then((a) => {
                        a.loop = THREE.LoopRepeat;
                        this.animations.set(UnitAnimation.RUN, a);
                    });
                    this.model.getAnim('Stand').then((a) => {
                        a.loop = THREE.LoopRepeat;
                        this.animations.set(UnitAnimation.STAND, a);
                        a.play();
                    });
                    this.model.getAnim('AttackUnarmed').then((a) => {
                        a.loop = THREE.LoopOnce;
                        this.animations.set(UnitAnimation.PUNCH, a);
                    });
                    this.model.getAnim('Death').then((a) => {
                        a.loop = THREE.LoopOnce;
                        this.animations.set(UnitAnimation.DEATH, a);
                    });
                    this.model.getAnim('Dodge').then((a) => {
                        a.loop = THREE.LoopOnce;
                        this.animations.set(UnitAnimation.DODGE, a);
                    });
                    this.model.getAnim('ParryFist1H').then((a) => {
                        a.loop = THREE.LoopOnce;
                        this.animations.set(UnitAnimation.PARRY, a);
                    });
                    this.model.getAnim('ReadyUnarmed').then((a) => {
                        a.loop = THREE.LoopRepeat;
                        this.animations.set(UnitAnimation.COMBAT_IDLE, a);
                    });
                    this.model.getAnim('ReadySpellDirected').then((a) => {
                        a.loop = THREE.LoopRepeat;
                        this.animations.set(UnitAnimation.SPELL_DIRECTED, a);
                    });
                    this.model.getAnim('ReadySpellOmni').then((a) => {
                        a.loop = THREE.LoopRepeat;
                        this.animations.set(UnitAnimation.SPELL_OMNI, a);
                    });
                    this.model.getAnim('CombatCritical').then((a) => {
                        a.loop = THREE.LoopOnce;
                        this.animations.set(UnitAnimation.FLINCH, a);
                    });
                    this.model.getAnim('Loot').then((a) => {
                        a.loop = THREE.LoopOnce;
                        this.animations.set(UnitAnimation.LOOT, a);
                    });
                    this.world.scene.add(this.model.obj);
                });
        }
    }

    private isMoving(): boolean {
        if (this.movesThisTick > 0) {
            return true;
        }
        return false;
    }

    public lookAt(other: LocalUnit): void {
        const diff = this.currentPosition.sub(other.position);
        this.targetAngle = Math.atan2(diff.y, -diff.x);
        // const angle = Math.atan2(diff.y, -diff.x);
        // this.model.obj.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle));
    }

    private onMixerFinished(ev: THREE.Event): void {
        this.animations.get(this.currentLoop).play(); // restart the looped anim after a play once
        this.targetAngle = null;
    }

    public animPlayOnce(anim: UnitAnimation): void {
        const a = this.animations.get(anim);
        a.clampWhenFinished = false;
        a.weight = 1;
        a.reset();
        this.model.mixer.stopAllAction();
        a.play();
    }

    private updateAnimation(): void {
        if (this.animsLoaded()) {
            // always be walking, running, or standing
            if (this.isMoving()) {
                this.animations.get(UnitAnimation.STAND).stop();
                if (this.movesThisTick > 1) { // running
                    this.animations.get(UnitAnimation.RUN).play();
                    this.animations.get(UnitAnimation.WALK).stop();
                    this.currentLoop = UnitAnimation.RUN;
                } else { // walking
                    this.animations.get(UnitAnimation.WALK).play();
                    this.animations.get(UnitAnimation.RUN).stop();
                    this.currentLoop = UnitAnimation.WALK;
                }
            } else {
                this.animations.get(UnitAnimation.STAND).play();
                this.animations.get(UnitAnimation.WALK).stop();
                this.animations.get(UnitAnimation.RUN).stop();
                this.currentLoop = UnitAnimation.STAND;
            }
        }
    }

    public onTick(u: UnitDef): void {
        if (!this.data) {
            this.data = u;
            this.loadModel();
        }
        this.data = u;
        if (!this.currentPosition) this.currentPosition = Point.fromDef(this.data.position).toTile(this.world.chunkWorld);
        if (this.data.moveQueue) this.movesThisTick = this.data.moveQueue.length;
        if (this.movesThisTick > 0) this.targetPosition = Point.fromDef(this.data.moveQueue.shift()).toTile(this.world.chunkWorld);
        this.moveTimer = 0;
        this.updateModel();
        this.updateAnimation();
    }

    private animsLoaded(): boolean {
        // TODO: not sufficient anymore
        if (this.animations.get(UnitAnimation.WALK) && this.animations.get(UnitAnimation.STAND) && this.animations.get(UnitAnimation.RUN)) {
            return true;
        }
        return false;
    }

    private updateLookAt(): void {
        if (this.targetAngle !== null && !this.isMoving()) {
            const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.targetAngle);
            this.model.obj.quaternion.slerp(targetRot, this.world.tickProgression);
        }
    }

    private updateModel(): void {
        if (this.model) {
            // set the model pos to the current tile position
            this.model.obj.position.copy(this.currentPosition.toWorld());
            if (this.targetPosition) {
                // lerp towards the target
                this.model.obj.position.lerp(this.targetPosition.toWorld(), Math.min(this.moveTimer, 1));
                // slerp towards the target
                const diff = this.currentPosition.sub(this.targetPosition);
                const angle = Math.atan2(diff.y, -diff.x);
                const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                this.model.obj.quaternion.slerp(targetRot, this.world.tickProgression);
            }
        }
    }

    public getWorldPosition(): THREE.Vector3 {
        if (this.targetPosition) {
            return this.currentPosition.toWorld().lerp(this.targetPosition.toWorld(), Math.min(this.moveTimer, 1));
        }
        return this.currentPosition.toWorld();
    }

    private updateMovement(delta: number): void {
        this.moveTimer += (delta * this.movesThisTick) / this.world.tickRate;
        if (this.moveTimer >= 1 - delta) {
            if (this.targetPosition) {
                this.currentPosition = this.targetPosition; // update the current position
            }
            const nextTarget = Point.fromDef(this.data.moveQueue.shift());
            if (nextTarget) {
                this.targetPosition = nextTarget.toTile(this.world.chunkWorld); // get a new target
            } else {
                this.targetPosition = null;
            }
            this.moveTimer -= 1; // reset the move timer, keep fractional for smooth lerping
        }
    }

    public update(delta: number): void {
        if (this.model) {
            if (this.isMoving()) {
                this.updateMovement(delta);
                this.updateModel();
            }
            this.updateLookAt();
            this.model.update(delta);
        }
    }
}
