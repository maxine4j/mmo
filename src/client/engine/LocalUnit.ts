import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import Model from './graphics/Model';
import World from './World';
import UnitDef from '../../common/UnitDef';
import { TilePoint, Point } from '../../common/Point';

export default class LocalUnit {
    public data: UnitDef;
    public world: World;
    public model: Model;
    public lastTickUpdated: number;
    private animWalk: AnimationAction;
    private animRun: AnimationAction;
    private animStand: AnimationAction;
    private currentPosition: TilePoint;
    private targetPosition: TilePoint;
    private movesThisTick: number;
    private moveTimer: number;

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
        Model.loadDef('assets/models/units/human/human.model.json') // TODO: get from Unit data.model
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

    private updateAnimation(): void {
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

    public onTick(u: UnitDef): void {
        this.data = u;
        if (!this.currentPosition) this.currentPosition = Point.fromDef(this.data.position).toTile(this.world.chunkWorld);
        if (this.data.moveQueue) this.movesThisTick = this.data.moveQueue.length;
        if (this.movesThisTick > 0) this.targetPosition = Point.fromDef(this.data.moveQueue.shift()).toTile(this.world.chunkWorld);
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
            this.model.update(delta);
        }
    }
}
