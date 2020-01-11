import NetClient from './NetClient';
import { PacketHeader, CharacterPacket, PointPacket } from '../../common/Packet';
import World from './LocalWorld';
import Point from '../../common/Point';
import LocalUnit from './LocalUnit';
import Character from '../../common/Character';
import Input, { MouseButton } from './Input';

export default class Player extends LocalUnit {
    public posLastTick: Point;

    public constructor(world: World) {
        super(world);
        NetClient.on(PacketHeader.PLAYER_UPDATE_SELF, (p: CharacterPacket) => { this.onPlayerUpdate(p); });
    }

    private onPlayerUpdate(c: Character) {
        this.onTick(c);
    }

    public updatePlayer(mousePoint: THREE.Vector3) {
        // move the player
        if (Input.wasMousePressed(MouseButton.RIGHT)) {
            const tile = this.world.worldToTile(mousePoint);
            if (tile) {
                NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: tile.x, y: tile.y });
            }
        }
    }
}
