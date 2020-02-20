import * as THREE from 'three';
import { TypedEmitter } from '../../common/TypedEmitter';
import Model from '../engine/graphics/Model';
import World from './World';
import UnitDef from '../../common/definitions/UnitDef';
import { TilePoint, Point, PointDef } from '../../common/Point';
import AssetManager from '../engine/asset/AssetManager';
import AnimationController from '../engine/graphics/AnimationController';

const HB_MIN_X = 0.5;
const HB_MIN_Y = 0.5;
const HB_MIN_Z = 0.5;

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

export type UnitEvent = 'loaded' | 'death' | 'disposed';

export default class Unit extends TypedEmitter<UnitEvent> {
    public data: UnitDef;
    protected world: World;
    private model: Model;
    public animController: AnimationController<UnitAnimation>;

    private killed: boolean = false;
    protected _isPlayer: boolean = false;
    public get isPlayer(): boolean { return this._isPlayer; }

    // smooth movement
    private path: PointDef[];
    private currentPosition: TilePoint;
    private targetPosition: TilePoint;
    protected movesThisTick: number;
    private moveQueue: PointDef[];
    private moveTimer: number;
    private targetAngle: number = null;

    public constructor(world: World, data: UnitDef) {
        super();

        this.world = world;
        this.data = data;
        this.currentPosition = Point.fromDef(this.data.position).toTile(this.world.chunkWorld);

        this.loadModel();
    }

    public dispose(): void {
        this.model.dispose();
        this.emit('disposed', this);
        this.removeAllListeners();
    }

    public get position(): TilePoint { return this.currentPosition; }

    private loadModel(): void {
        if (this.data) {
            AssetManager.getModel(this.data.model)
                .then((model) => {
                    this.model = model;
                    this.model.obj.castShadow = true;
                    this.model.obj.receiveShadow = true;
                    this.model.generateHitbox(HB_MIN_X, HB_MIN_Y, HB_MIN_Z);
                    this.model.obj.traverse((o) => {
                        o.userData = {
                            unit: this,
                        };
                    });
                    this.world.scene.add(this.model.obj);

                    this.animController = new AnimationController(this.model);
                    this.animController.load(UnitAnimation.WALK, 'Walk');
                    this.animController.load(UnitAnimation.RUN, 'Run');
                    this.animController.load(UnitAnimation.STAND, 'Stand');
                    this.animController.load(UnitAnimation.PUNCH, 'AttackUnarmed', THREE.LoopOnce);
                    this.animController.load(UnitAnimation.DEATH, 'Death', THREE.LoopOnce);
                    this.animController.load(UnitAnimation.DODGE, 'Dodge', THREE.LoopOnce);
                    this.animController.load(UnitAnimation.PARRY, 'ParryFist1H', THREE.LoopOnce);
                    this.animController.load(UnitAnimation.COMBAT_IDLE, 'ReadyUnarmed');
                    this.animController.load(UnitAnimation.SPELL_DIRECTED, 'ReadySpellDirected');
                    this.animController.load(UnitAnimation.SPELL_OMNI, 'ReadySpellOmni');
                    this.animController.load(UnitAnimation.FLINCH, 'CombatCritical', THREE.LoopOnce);
                    this.animController.load(UnitAnimation.LOOT, 'Loot', THREE.LoopOnce);

                    this.animController.on('finished', this.animControllerFinished.bind(this));

                    this.emit('loaded', this);
                });
        }
    }

    private animControllerFinished(): void {
        this.targetAngle = null;
        if (this.killed) {
            this.emit('death', this);
        }
    }

    public kill(): void {
        if (!this.killed) {
            this.killed = true;
            this.animController.playOnce(UnitAnimation.DEATH, true);
        }
    }

    private isMoving(): boolean {
        return this.targetPosition != null;
    }

    public lookAt(other: Unit): void {
        const diff = this.currentPosition.sub(other.position);
        this.targetAngle = Math.atan2(diff.y, -diff.x);
    }

    private updateAnimation(): void {
        if (this.animController) {
            // always be walking, running, or standing
            if (this.isMoving()) {
                if (this.movesThisTick > 1) { // running
                    this.animController.loopOnly(UnitAnimation.RUN);
                } else { // walking
                    this.animController.loopOnly(UnitAnimation.WALK);
                }
            } else if (this.data.interacting) { // TODO: implement animations for each different interact
                this.animController.loopOnly(UnitAnimation.SPELL_OMNI);
            } else {
                this.animController.loopOnly(UnitAnimation.STAND);
            }
        }
    }

    public updatePath(start: PointDef, path: PointDef[]): void {
        // check if we should teleport
        const dataPos = Point.fromDef(start).toTile(this.world.chunkWorld);
        if (this.position.dist(dataPos) > 5) {
            this.moveQueue = [];
            this.currentPosition = dataPos;
            this.targetPosition = dataPos;
        }
        // update our path
        this.path = path;
    }

    public tick(): void {
        if (this.path && this.path.length > 0) {
            this.moveQueue = [];
            this.moveQueue.push(this.path.pop());
            if (this.data.running && this.path.length > 0) {
                this.moveQueue.push(this.path.pop());
            }
            this.movesThisTick = this.moveQueue.length;
            this.targetPosition = Point.fromDef(this.moveQueue.shift()).toTile(this.world.chunkWorld);
        }

        this.moveTimer = 0;
        this.updateModel();
        this.updateAnimation();
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
            if (this.currentPosition) {
                this.model.obj.position.copy(this.currentPosition.toWorld());
            }
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
        if (this.model) {
            return this.model.obj.position.clone();
        }
        return null;
    }

    private updateMovement(delta: number): void {
        this.moveTimer += (delta * this.movesThisTick) / this.world.tickRate;

        if (this.moveTimer >= 1 - delta) { // we have finished the current move target
            // update the current position
            if (this.targetPosition) this.currentPosition = this.targetPosition;
            // get a new target
            const nextTarget = Point.fromDef(this.moveQueue.shift());
            if (nextTarget) this.targetPosition = nextTarget.toTile(this.world.chunkWorld);
            else this.targetPosition = null;
            // reset the move timer, keep fractional for smooth lerping
            this.moveTimer -= 1;
        }
    }

    public update(delta: number): void {
        if (this.model) {
            this.updateMovement(delta);
            this.updateModel();
            this.updateLookAt();
            this.model.update(delta);
        }
    }
}
