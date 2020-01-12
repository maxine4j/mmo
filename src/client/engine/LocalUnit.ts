import * as THREE from 'three';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import Model from './graphics/Model';
import World from './LocalWorld';
import Unit from '../../common/Unit';
import Point from '../../common/Point';

export default class LocalUnit {
    public data: Unit;
    public world: World;
    public model: Model;
    public lastTickUpdated: number;
    private animWalk: AnimationAction;
    private animStand: AnimationAction;

    public constructor(world: World) {
        this.world = world;
        this.loadModel();
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
                this.model.getAnim('Stand').then((a) => {
                    this.animStand = a;
                    this.animStand.play();
                });
                this.world.scene.add(this.model.obj);
            });
    }

    public onTick(u: Unit) {
        this.data = u;
        this.updatePosition();

        if (this.isMoving()) {
            if (this.animsLoaded()) {
                this.animStand.stop();
                this.animWalk.play();
            }
        } else if (this.animsLoaded()) {
            this.animWalk.stop();
            this.animStand.play();
        }
    }

    private isMoving(): boolean {
        if (this.data && this.data.position && this.data.lastPosition) {
            return !Point.eq(this.data.position, this.data.lastPosition);
        }
        return false;
    }

    private animsLoaded(): boolean {
        if (this.animWalk && this.animStand) {
            return true;
        }
        return false;
    }

    private updatePosition() {
        if (this.model) {
            const pos = this.world.tileToWorld(this.data.lastPosition.x, this.data.lastPosition.y);
            this.model.obj.position.set(pos.x, pos.y, pos.z);
        }
    }

    public getWorldPosition(): THREE.Vector3 {
        const nextPos = this.world.tileToWorld(this.data.position.x, this.data.position.y);
        const pos = this.world.tileToWorld(this.data.lastPosition.x, this.data.lastPosition.y);
        return pos.lerp(nextPos, this.world.tickProgression);
    }

    private updateMovement() {
        // set to the old postion
        this.updatePosition();
        // lerp to the new position
        const nextPos = this.world.tileToWorld(this.data.position.x, this.data.position.y);
        this.model.obj.position.lerp(nextPos, this.world.tickProgression);
        // slerp to new rotation
        const dy = this.data.lastPosition.y - this.data.position.y;
        const dx = -(this.data.lastPosition.x - this.data.position.x);
        const angle = Math.atan2(dy, dx);
        const targetRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        this.model.obj.quaternion.slerp(targetRot, this.world.tickProgression);
    }

    public update(delta: number) {
        if (this.model) {
            if (this.isMoving()) {
                this.updateMovement();
            }
            this.model.update(delta);
        }
    }
}
