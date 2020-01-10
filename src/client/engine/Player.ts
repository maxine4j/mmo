import * as THREE from 'three';
import { AStarFinder } from 'astar-typescript';
import { AnimationAction } from 'three/src/animation/AnimationAction';
import Character, { Facing } from '../../common/Character';
import Model from './graphics/Model';
import NetClient from './NetClient';
import { PacketHeader, CharacterPacket } from '../../common/Packet';
import World from './World';
import Point from '../../common/Point';
import Graphics from './graphics/Graphics';

const tickRate = 0.6; // TODO: get this from server on first connect

export default class Player {
    public character: Character;
    public world: World;
    public model: Model;
    public pathBoxes: Array<THREE.Mesh>;
    public astart: AStarFinder;
    public posLastTick: Point;
    private tickTimer: number; // TODO: move this to world
    private animWalk: AnimationAction;

    public constructor(world: World) {
        this.world = world;
        this.pathBoxes = [];
        NetClient.on(PacketHeader.PLAYER_UPDATE_SELF, (p: CharacterPacket) => this.onPlayerUpdate(p));
        NetClient.send(PacketHeader.PLAYER_UPDATE_SELF);
        Model.loadDef('assets/models/human/human.model.json')
            .then((model) => {
                this.model = model;
                this.model.obj.castShadow = true;
                this.model.obj.receiveShadow = true;
                this.world.scene.add(this.model.obj);
            });
    }

    private onPlayerUpdate(packet: CharacterPacket) {
        if (!this.character) {
            this.posLastTick = packet.position;
        } else {
            this.posLastTick = this.character.position;
        }
        this.character = packet;
        this.tickTimer = 0; // reset tick timer on new tick, we get an update every tick
    }

    private updateMovement(delta: number, world: World) {
        // set pos to position last tick
        // TODO: maybe sending position next tick might feel better
        const lastPos = world.tileToWorld(this.posLastTick.x, this.posLastTick.y);
        this.model.obj.position.set(lastPos.x, lastPos.y, lastPos.z);
        // lerp to the new position
        const curPos = world.tileToWorld(this.character.position.x, this.character.position.y);
        this.model.obj.position.lerp(curPos, this.tickTimer / tickRate);
        this.tickTimer += delta;
    }

    private updateAnimation(delta: number) {
        if (this.character.position.x !== this.posLastTick.x || this.character.position.y !== this.posLastTick.y) {
            this.model.getAnim('Stand').then((a) => a.stop());
            this.model.getAnim('Walk').then((a) => a.play());
        } else {
            this.model.getAnim('Stand').then((a) => a.play());
            this.model.getAnim('Walk').then((a) => a.stop());
        }
        this.model.update(delta);
    }

    private updateFacing(delta: number) {
        const currRot = this.model.obj.rotation;
        switch (this.character.facing) {
        case Facing.NORTH: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(90), currRot.z); break;
        case Facing.NORTH_EAST: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(45), currRot.z); break;
        case Facing.EAST: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(0), currRot.z); break;
        case Facing.SOUTH_EAST: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(315), currRot.z); break;
        case Facing.SOUTH: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(270), currRot.z); break;
        case Facing.SOUTH_WEST: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(225), currRot.z); break;
        case Facing.WEST: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(180), currRot.z); break;
        case Facing.NORTH_WEST: this.model.obj.rotation.set(currRot.x, Graphics.toRadians(135), currRot.z); break;
        default: break;
        }
    }

    public update(delta: number, world: World) {
        if (this.character && this.model) {
            this.updateMovement(delta, world);
            this.updateAnimation(delta);
            this.updateFacing(delta);
        }
    }
}
