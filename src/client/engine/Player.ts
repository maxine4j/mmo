import Character from '../../common/models/Character';
import Model from './graphics/Model';
import NetClient from './NetClient';
import { PacketHeader, CharacterPacket } from '../../common/Packet';
import World from './World';

export default class Player {
    public character: Character;
    public model: Model;

    public constructor(scene: THREE.Scene) {
        NetClient.on(PacketHeader.PLAYER_UPDATE_SELF, (p: CharacterPacket) => this.onPlayerUpdate(p));
        NetClient.send(PacketHeader.PLAYER_UPDATE_SELF);
        Model.loadDef('assets/models/human/human.model.json')
            .then((model) => {
                this.model = model;
                scene.add(this.model.obj);
            });
    }

    private onPlayerUpdate(packet: CharacterPacket) {
        this.character = packet.character;
    }

    public update(delta: number, world: World) {
        if (this.character && this.model) {
            const pos = world.tileToWorld(this.character.posX, this.character.posY);
            this.model.obj.position.set(pos.x, pos.y, pos.z);
        }
    }
}
