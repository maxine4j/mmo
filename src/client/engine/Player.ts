import Character from '../../common/models/Character';
import Model from './graphics/Model';
import NetClient from './NetClient';
import { PacketHeader, CharacterPacket } from '../../common/Packet';

export default class Player {
    private character: Character
    private model: Model;

    public constructor(char: Character) {
        this.character = char;
        NetClient.on(PacketHeader.PLAYER_UPDATE_SELF, this.onPlayerUpdate);
    }

    private onPlayerUpdate(packet: CharacterPacket) {
        this.character = packet.character;
    }

    public updateCharData() {
    }
}
