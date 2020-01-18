import NetClient from './NetClient';
import { PacketHeader, PointPacket } from '../../common/Packet';
import LocalUnit from './LocalUnit';
import Input, { MouseButton } from './Input';
import { WorldPoint } from '../../common/Point';

export default class Player extends LocalUnit {
    public updatePlayer(mousePoint: THREE.Vector3): void {
        // move the player
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            if (mousePoint) {
                const tilePoint = new WorldPoint(mousePoint, this.world.chunkWorld).toTile();
                NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: tilePoint.x, y: tilePoint.y });
                Input.playClickMark(Input.mousePos(), 'yellow');
            }
        }
    }
}
