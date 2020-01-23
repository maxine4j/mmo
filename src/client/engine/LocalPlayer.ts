import NetClient from './NetClient';
import { PacketHeader, PointPacket } from '../../common/Packet';
import LocalUnit from './LocalUnit';
import Input, { MouseButton } from './Input';
import { WorldPoint } from '../../common/Point';
import CharacterDef from '../../common/CharacterDef';

export default class LocalPlayer extends LocalUnit {
    public data: CharacterDef;

    private tryTarget(intersects: THREE.Intersection[]): boolean {
        // select a target if the mosue is clicked
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            for (const int of intersects) {
                if ('unit' in int.object.userData) {
                    const clickedUnit = <LocalUnit>int.object.userData.unit;
                    // but dont target ourselves
                    if (clickedUnit.data.id !== this.world.player.data.id) {
                        this.world.player.data.target = clickedUnit.data.id;
                        Input.playClickMark(Input.mousePos(), 'red');
                    }
                    return true;
                }
            }
        }
        return false;
    }

    private tryMove(mousePoint: THREE.Vector3): boolean {
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            if (mousePoint) {
                const tilePoint = new WorldPoint(mousePoint, this.world.chunkWorld).toTile();
                NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: tilePoint.x, y: tilePoint.y });
                Input.playClickMark(Input.mousePos(), 'yellow');
                return true;
            }
        }
        return false;
    }

    public updateClientPlayer(mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        if (this.data) {
            if (this.tryTarget(intersects)) return;
            if (this.tryMove(mousePoint)) return;
        }
    }
}
