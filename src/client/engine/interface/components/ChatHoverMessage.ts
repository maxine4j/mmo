import * as THREE from 'three';
import Label from './Label';
import Camera from '../../graphics/Camera';
import { Point } from '../../../../common/Point';
import { ChatMsgPacket } from '../../../../common/Packet';
import World from '../../../models/World';
import Unit from '../../../models/Unit';
import UIParent from './UIParent';

const chatHoverHeight = 1.5;

export default class ChatHoverMessage {
    public label: Label;
    public unit: Unit;
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
        this.label = new Label(UIParent.get(), packet.message);
        this.update();
        // destroy label after timeout
        setTimeout(() => {
            this.label.dispose();
            this.destroyed = true;
        }, lifetime);
    }

    private getScreenPos(): Point {
        const wpos = this.unit.getWorldPosition();
        if (wpos) {
            wpos.add(new THREE.Vector3(0, chatHoverHeight, 0));
            return this.camera.worldToScreen(wpos);
        }
        return null;
    }

    private findUnit(): void {
        if (this.world.player.data.uuid === this.packet.authorId) {
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
            if (pos) {
                this.label.show();
                this.label.style.top = `${pos.y}px`;
                this.label.style.left = `${pos.x - this.label.width / 2}px`;
            } else {
                this.label.hide();
            }
        }
        return this.destroyed;
    }
}
