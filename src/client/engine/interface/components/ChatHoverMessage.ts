import * as THREE from 'three';
import Label from './Label';
import Camera from '../../graphics/Camera';
import { Point } from '../../../../common/Point';
import { ChatMsgPacket } from '../../../../common/Packet';
import World from '../../World';
import LocalUnit from '../../LocalUnit';
import UIParent from './UIParent';

const chatHoverHeight = 1.5;

export default class ChatHoverMessage {
    public label: Label;
    public unit: LocalUnit;
    public packet: ChatMsgPacket;
    public world: World;
    public camera: Camera;
    public destroyed: boolean = false;

    public constructor(world: World, camera: Camera, packet: ChatMsgPacket, lifetime: number = 4000) {
        this.world = world;
        this.packet = packet;
        this.camera = camera;
        // create label at unit pos
        this.findUnit();
        this.label = new Label(`lbl-msg-${packet.authorId}${packet.timestamp}`, UIParent.get(), packet.message);
        this.update();
        // destroy label after timeout
        setTimeout(() => {
            this.label.dispose();
            this.destroyed = true;
        }, lifetime);
    }

    private getScreenPos(): Point {
        const wpos = this.unit.model.obj.position.clone();
        wpos.add(new THREE.Vector3(0, chatHoverHeight, 0));
        return this.camera.worldToScreen(wpos);
    }

    private findUnit(): void {
        if (this.world.player.data.charID === this.packet.authorId) {
            this.unit = this.world.player;
        } else {
            for (const [id, unit] of this.world.players) {
                if (id === this.packet.authorId) {
                    this.unit = unit;
                    break;
                }
            }
        }
    }

    public update(): boolean {
        if (!this.destroyed) {
            const pos = this.getScreenPos();
            this.label.style.top = `${pos.y}px`;
            this.label.style.left = `${pos.x - this.label.width / 2}px`;
        }
        return this.destroyed;
    }
}
