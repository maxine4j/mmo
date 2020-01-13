import NetClient from './NetClient';
import { PacketHeader, CharacterPacket, PointPacket } from '../../common/Packet';
import World from './LocalWorld';
import Point from '../../common/Point';
import LocalUnit from './LocalUnit';
import Character from '../../common/Character';
import Input, { MouseButton } from './Input';

export default class Player extends LocalUnit {
    public updatePlayer(mousePoint: THREE.Vector3) {
        // move the player
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            if (mousePoint) {
                const tile = this.world.worldToTile(mousePoint);
                NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: tile.x, y: tile.y });
            }
        }
    }
}
