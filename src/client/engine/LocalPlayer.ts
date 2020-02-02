import * as THREE from 'three';
import NetClient from './NetClient';
import {
    PacketHeader, PointPacket, TargetPacket, LootPacket,
} from '../../common/Packet';
import LocalUnit, { LocalUnitEvent } from './LocalUnit';
import Input, { MouseButton } from './Input';
import { WorldPoint, TilePoint } from '../../common/Point';
import CharacterDef from '../../common/CharacterDef';
import LocalGroundItem from './LocalGroundItem';
import Graphics from './graphics/Graphics';

type LocalPlayerEvent = LocalUnitEvent | 'moveTargetUpdated';

export default class LocalPlayer extends LocalUnit {
    public data: CharacterDef;

    public on(event: LocalPlayerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: LocalPlayerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: LocalPlayerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    private tryPickUp(intersects: THREE.Intersection[]): boolean {
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            for (const int of intersects) {
                if ('groundItem' in int.object.userData) {
                    const clickedItem = <LocalGroundItem>int.object.userData.groundItem;
                    Graphics.setOutlines([clickedItem.model.obj], new THREE.Color(0xFF0000));
                    Input.playClickMark(Input.mousePos(), 'red');
                    NetClient.send(PacketHeader.PLAYER_LOOT, <LootPacket>{ uuid: clickedItem.def.item.uuid });
                    return true;
                }
            }
        }
        return false;
    }

    private tryTarget(intersects: THREE.Intersection[]): boolean {
        // select a target if the mosue is clicked
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            for (const int of intersects) {
                if ('unit' in int.object.userData) {
                    const clickedUnit = <LocalUnit>int.object.userData.unit;
                    // but dont target ourselves
                    if (clickedUnit.data.id !== this.world.player.data.id) {
                        this.world.player.data.target = clickedUnit.data.id;
                        // Graphics.setOutlines([clickedUnit.model.obj], new THREE.Color(0xFF0000));
                        Input.playClickMark(Input.mousePos(), 'red');
                        NetClient.send(PacketHeader.PLAYER_TARGET, <TargetPacket>{ target: this.world.player.data.target });
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public moveTo(pos: TilePoint): void {
        NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: pos.x, y: pos.y });
        this.emit('moveTargetUpdated', this, pos);
    }

    private tryMove(mousePoint: THREE.Vector3): boolean {
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            if (mousePoint) {
                const tilePoint = new WorldPoint(mousePoint, this.world.chunkWorld).toTile();
                this.moveTo(tilePoint);
                Input.playClickMark(Input.mousePos(), 'yellow');
                return true;
            }
        }
        return false;
    }

    public onTick(data: CharacterDef): void {
        super.onTick(data);

        if (this.movesThisTick <= 0) {
            this.emit('moveTargetUpdated', this, null);
        }
    }

    public updateClientPlayer(mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        if (this.data) {
            if (this.tryTarget(intersects)) return;
            if (this.tryPickUp(intersects)) return;
            if (this.tryMove(mousePoint)) return;
        }
    }
}
