import * as THREE from 'three';
import { AStarFinder } from 'astar-typescript';
import Character from '../../common/Character';
import Model from './graphics/Model';
import NetClient from './NetClient';
import { PacketHeader, CharacterPacket } from '../../common/Packet';
import World from './World';

export default class Player {
    public character: Character;
    public world: World;
    public model: Model;
    public pathBoxes: Array<THREE.Mesh>;
    public astart: AStarFinder;

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
        this.character = packet;
    }

    public updatePath() {
    }

    public update(delta: number, world: World) {
        if (this.character && this.model) {
            const pos = world.tileToWorld(this.character.position.x, this.character.position.y);
            this.model.obj.position.set(pos.x, pos.y, pos.z);
        }
    }
}
