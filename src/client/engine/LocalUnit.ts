import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import { EventEmitter } from 'events';
import Model from './graphics/Model';
import World from './World';
import UnitDef from '../../common/UnitDef';
import { TilePoint, Point } from '../../common/Point';
import AssetManager from './asset/AssetManager';
import AnimationController from './AnimationController';

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

export type LocalUnitEvent = 'loaded' | 'death' | 'disposed';

export default class LocalUnit {
    public data: UnitDef;
    public world: World;
    public model: Model;
    public animController: AnimationController<UnitAnimation>;
    public lastTickUpdated: number;
    private currentPosition: TilePoint;
    private targetPosition: TilePoint;
    protected movesThisTick: number;
    private moveTimer: number;
    private targetAngle: number = null;
    protected eventEmitter: EventEmitter = new EventEmitter();
    private killed: boolean = false;
    public stale: boolean = false;
    protected _isPlayer: boolean = false;
    public get isPlayer(): boolean { return this._isPlayer; }

    public constructor(world: World, data: UnitDef) {
        this.world = world;
        this.data = data;
        this.loadModel();
    }

    public dispose(): void {
        this.model.dispose();
        this.emit('disposed', this);
        this.eventEmitter.removeAllListeners();
    }

    public on(event: LocalUnitEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: LocalUnitEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: LocalUnitEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public get position(): TilePoint { return this.currentPosition; }

    private loadModel(): void {
        if (this.data) {
            AssetManager.getModel(this.data.model)
                .then((model) => {
                    this.model = model;
                    this.model.obj.castShadow = true;
                    this.model.obj.receiveShadow = true;
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

                    this.emit('loaded', this);
                });
        }
    }

    public kill(): void {
        if (!this.killed) {
            this.killed = true;
            this.animController.playOnce(UnitAnimation.DEATH, true);
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

    public onTick(u: UnitDef): void {
        this.data = u;
        if (!this.currentPosition) this.currentPosition = Point.fromDef(this.data.position).toTile(this.world.chunkWorld);
        if (this.data.moveQueue) this.movesThisTick = this.data.moveQueue.length;
        if (this.movesThisTick > 0) this.targetPosition = Point.fromDef(this.data.moveQueue.shift()).toTile(this.world.chunkWorld);

        // ensure we update out local position fully incase we desync
        const dataPos = Point.fromDef(this.data.position).toTile(this.world.chunkWorld);
        if (this.movesThisTick === 0 && !this.currentPosition.eq(dataPos)) {
            this.targetPosition = dataPos;
            this.movesThisTick = 1;
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
        if (this.currentPosition) {
            return this.currentPosition.toWorld();
        }
        return new THREE.Vector3();
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

    private updateTeleport(): void {
        if (this.currentPosition) {
            const dataPos = Point.fromDef(this.data.position).toTile(this.world.chunkWorld);
            if (this.position.dist(dataPos) > 3) {
                this.currentPosition = dataPos;
            }
        }
    }

    public update(delta: number): void {
        if (this.model) {
            this.updateTeleport();
            if (this.isMoving()) {
                this.updateMovement(delta);
                this.updateModel();
            }
            this.updateLookAt();
            this.model.update(delta);
        }
    }
}
