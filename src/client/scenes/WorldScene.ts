import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/components/Button';
import SceneManager from '../engine/scene/SceneManager';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import UIParent from '../engine/interface/components/UIParent';
import World from '../engine/World';
import Input from '../engine/Input';
import Label from '../engine/interface/components/Label';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, ChatMsgPacket, WorldInfoPacket, DamagePacket,
} from '../../common/Packet';
import Chatbox from '../engine/interface/Chatbox';
import ChatHoverMessage from '../engine/interface/components/ChatHoverMessage';
import { WorldPoint } from '../../common/Point';
import LocalUnit, { UnitAnimation } from '../engine/LocalUnit';
import UnitNameplate from '../engine/interface/UnitNameplate';
import HitSplat from '../engine/interface/HitSplat';

export default class WorldScene extends GameScene {
    private world: World;
    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;
    private lblSceneCount: Label;
    private mousePoint: WorldPoint;
    private intersects: THREE.Intersection[] = [];
    private wireframesVisible: boolean = false;
    private chatbox: Chatbox;
    private chatHoverMsgs: ChatHoverMessage[] = [];
    private nameplates: Map<string, UnitNameplate> = new Map();
    private hitsplats: Map<string, HitSplat> = new Map();

    public constructor() {
        super('world');
    }

    private initGUI(): void {
        // build back button
        const btnBack = new Button('btn-back', UIParent.get(), 'Back');
        btnBack.style.position = 'fixed';
        btnBack.style.margin = '5px 10px';
        btnBack.style.display = 'block';
        btnBack.style.width = '120px';
        btnBack.style.bottom = '5px';
        btnBack.style.right = '0';
        btnBack.addEventListener('click', () => {
            NetClient.send(PacketHeader.PLAYER_LEAVEWORLD);
            SceneManager.changeScene('char-select');
        });
        this.addGUI(btnBack);

        this.lblMouseWorld = new Label('lbl-mouse-world', UIParent.get(), 'World: { X, Y, Z }');
        this.lblMouseWorld.style.position = 'fixed';
        this.lblMouseWorld.style.top = '15px';
        this.lblMouseWorld.style.left = '0';
        this.addGUI(this.lblMouseWorld);

        this.lblMouseTile = new Label('lbl-mouse-tile', UIParent.get(), 'Tile: { X, Y }');
        this.lblMouseTile.style.position = 'fixed';
        this.lblMouseTile.style.top = '30px';
        this.lblMouseTile.style.left = '0';
        this.addGUI(this.lblMouseTile);

        this.lblMouseChunk = new Label('lbl-mouse-chunk', UIParent.get(), 'Chunk: { X, Y }');
        this.lblMouseChunk.style.position = 'fixed';
        this.lblMouseChunk.style.top = '45px';
        this.lblMouseChunk.style.left = '0';
        this.addGUI(this.lblMouseChunk);

        this.lblSceneCount = new Label('lbl-scene-count', UIParent.get(), 'Scene Count: ?');
        this.lblSceneCount.style.position = 'fixed';
        this.lblSceneCount.style.top = '60px';
        this.lblSceneCount.style.left = '0';
        this.addGUI(this.lblSceneCount);

        this.chatbox = new Chatbox('chatbox-main', UIParent.get(), 400, 200);
        this.chatbox.style.left = '0';
        this.chatbox.style.bottom = '0';
        this.chatbox.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.chatbox.onMessageSend = (message: string) => {
            NetClient.send(PacketHeader.CHAT_EVENT, <ChatMsgPacket>{ message });
        };
        NetClient.on(PacketHeader.CHAT_EVENT, (p: ChatMsgPacket) => {
            this.chatbox.addChatMessage(p);
            this.chatHoverMsgs.push(new ChatHoverMessage(this.world, this.camera, p));
        });
        this.addGUI(this.chatbox);
    }

    private initNameplates(): void {
        this.world.on('unit_added', (unit: LocalUnit) => {
            this.nameplates.set(unit.data.id, new UnitNameplate(this.world, this.camera, unit));
        });
        this.world.on('unit_removed', (unit: LocalUnit) => {
            this.nameplates.get(unit.data.id).dispose();
            this.nameplates.delete(unit.data.id);
        });
    }

    public async init(): Promise<void> {
        this.initGUI();

        this.scene = new Scene();

        // TODO: lights in world/chunk def
        const light = new THREE.HemisphereLight(0xffffff, 0x3d394d, 1.5);
        light.position.set(0, 50, 0);
        this.scene.add(light);

        const info = <WorldInfoPacket> await NetClient.sendRecv(PacketHeader.WORLD_INFO);
        this.world = new World(this.scene, info);

        const viewDist = info.chunkViewDist * info.chunkSize;
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, viewDist);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);
        this.scene.fog = new THREE.Fog(Graphics.clearColor, viewDist - 20, viewDist);

        this.initNameplates();

        NetClient.on(PacketHeader.UNIT_DAMAGE, (packet: DamagePacket) => {
            const defender = this.world.getUnit(packet.defender);
            const attacker = this.world.getUnit(packet.attacker);
            defender.animPlayOnce(UnitAnimation.FLINCH);
            attacker.animPlayOnce(UnitAnimation.PUNCH);
            attacker.lookAt(defender);
            defender.lookAt(attacker);
            const splat = new HitSplat(this.world, this.camera, defender, packet.damage);
            this.hitsplats.set(splat.id, splat);
            setTimeout(() => {
                this.hitsplats.delete(splat.id);
                splat.dispose();
            }, this.world.tickRate * 1000);
        });

        super.init();
    }

    public final(): void {
        super.final();
    }

    private updateMousePoint(): void {
        const intersects = this.camera.rcast(this.scene, Input.mousePos(), true);
        if (intersects.length > 0) {
            this.mousePoint = new WorldPoint(intersects[0].point, this.world.chunkWorld);
            this.intersects = intersects;
        } else {
            this.mousePoint = null;
            this.intersects = [];
        }
    }

    private updateTopLeftLabels(): void {
        if (this.mousePoint) {
            const tileCoord = this.mousePoint.toTile();
            const chunkCoord = tileCoord.toChunk();
            this.lblMouseWorld.text = `World: { ${this.mousePoint.x.toFixed(2)}, ${this.mousePoint.y.toFixed(2)}, ${this.mousePoint.z.toFixed(2)} }`;
            if (tileCoord) this.lblMouseTile.text = `Tile: { ${tileCoord.x}, ${tileCoord.y} } elevation: ${(tileCoord.elevation || 0).toFixed(2)}`;
            if (chunkCoord) this.lblMouseChunk.text = `Chunk: { ${chunkCoord.x}, ${chunkCoord.y} } elevation: ${(chunkCoord.elevation || 0).toFixed(2)}`;
        } else {
            this.lblMouseWorld.text = 'World: { ?, ?, ? }';
            this.lblMouseTile.text = 'Tile: { ?, ? } elevation: ?';
            this.lblMouseChunk.text = 'Chunk: { ?, ? } elevation: ?';
        }
        this.lblSceneCount.text = `Scene Count: ${this.scene.children.length}`;
    }

    private updateWireframesToggle(): void {
        if (Input.wasKeyPressed(Key.Insert)) {
            this.wireframesVisible = !this.wireframesVisible;
            this.world.chunkWorld.setWireframeVisibility(this.wireframesVisible);
        }
        if (Input.wasKeyPressed(Key.Enter)) {
            this.chatbox.focus();
        }
    }

    private updateChatHoverMsgs(): void {
        this.chatHoverMsgs = this.chatHoverMsgs.filter((msg: ChatHoverMessage) => !msg.update());
    }

    private updateNameplates(): void {
        for (const [_, np] of this.nameplates) {
            np.update();
        }
    }

    private updateHitSplats(): void {
        for (const [_, splat] of this.hitsplats) {
            splat.update();
        }
    }

    public update(delta: number): void {
        this.updateMousePoint();
        this.updateTopLeftLabels();
        this.updateWireframesToggle();
        this.updateChatHoverMsgs();
        this.updateNameplates();
        this.updateHitSplats();

        if (this.world.player.data) {
            this.camera.setTarget(this.world.player.getWorldPosition());
        }
        this.camera.update();
        this.world.update(delta, this.mousePoint, this.intersects);
    }

    public draw(): void {
        super.draw();
    }
}
