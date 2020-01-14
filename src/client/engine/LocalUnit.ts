import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import Model from './graphics/Model';
import World from './World';
import Unit from '../../common/Unit';
import Point from '../../common/Point';

export default class LocalUnit {
    public data: Unit;
    public world: World;
    public model: Model;
    public lastTickUpdated: number;
    private animWalk: AnimationAction;
    private animRun: AnimationAction;
    private animStand: AnimationAction;
    private currentPosition: Point;
    private targetPosition: Point;
    private movesThisTick: number;
    private moveTimer: number;

    public constructor(world: World, data: Unit) {
        this.world = world;
        this.data = data;
        this.loadModel();
    }

    public dispose() {
        this.world.scene.remove(this.model.obj);
    }

    private loadModel() {
        Model.loadDef('assets/models/units/human/human.model.json') // TODO: get from data.model
            .then((model) => {
                this.model = model;
                this.model.obj.castShadow = true;
                this.model.obj.receiveShadow = true;

                this.model.getAnim('Walk').then((a) => {
                    this.animWalk = a;
                });
                this.model.getAnim('Run').then((a) => {
                    this.animRun = a;
                });
                this.model.getAnim('Stand').then((a) => {
                    this.animStand = a;
                    this.animStand.play();
                });
                this.world.scene.add(this.model.obj);
            });
    }

    private isMoving(): boolean {
        if (this.movesThisTick > 0) {
            return true;
        }
        return false;
    }

    private updateAnimation() {
        if (this.animsLoaded()) {
            if (this.isMoving()) {
                this.animStand.stop();
                if (this.movesThisTick > 1) { // running
                    this.animWalk.stop();
                    this.animRun.play();
                } else { // walking
                    this.animRun.stop();
                    this.animWalk.play();
                }
            } else {
                this.animRun.stop();
                this.animWalk.stop();
                this.animStand.play();
            }
        }
    }

    public onTick(u: Unit) {
        this.data = u;
        if (!this.currentPosition) this.currentPosition = this.data.position;
        if (this.data.moveQueue) this.movesThisTick = this.data.moveQueue.length;
        if (this.movesThisTick > 0) this.targetPosition = this.data.moveQueue.shift();
        this.moveTimer = 0;

        this.updateModel();
        this.updateAnimation();
    }

    private animsLoaded(): boolean {
        if (this.animWalk && this.animStand && this.animRun) {
            return true;
        }
        return false;
    }

    private updateModel() {
        if (this.model) {
            // set the model pos to the current tile position
            const current = this.world.chunkWorld.tileToWorld(this.currentPosition);
            this.model.obj.position.copy(current);
            if (this.targetPosition) {
                // lerp towards the target
                const target = this.world.chunkWorld.tileToWorld(this.targetPosition);
                this.model.obj.position.lerp(target, Math.min(this.moveTimer, 1));
                // slerp towards the target
                const diff = Point.sub(this.currentPosition, this.targetPosition);
                const angle = Math.atan2(diff.y, -diff.x);
                const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                this.model.obj.quaternion.slerp(targetRot, this.world.tickProgression);
            }
        }
    }

    public getWorldPosition(): THREE.Vector3 {
        const current = this.world.chunkWorld.tileToWorld(this.currentPosition);
        if (this.targetPosition) {
            const target = this.world.chunkWorld.tileToWorld(this.targetPosition);
            return current.lerp(target, Math.min(this.moveTimer, 1));
        }
        return current;
    }

    private updateMovement(delta: number) {
        this.moveTimer += (delta * this.movesThisTick) / this.world.tickRate;
        if (this.moveTimer >= 1 - delta) {
            if (this.targetPosition) {
                this.currentPosition = this.targetPosition; // update the current position
            }
            this.targetPosition = this.data.moveQueue.shift(); // get a new target
            this.moveTimer -= 1; // reset the move timer, keep fractional for smooth lerping
        }
    }

    public update(delta: number) {
        if (this.model) {
            if (this.isMoving()) {
                this.updateMovement(delta);
                this.updateModel();
            }
            this.model.update(delta);
        }
    }
}
