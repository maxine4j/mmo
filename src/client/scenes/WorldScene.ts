import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/Button';
import SceneManager from '../engine/scene/SceneManager';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import UIParent from '../engine/interface/UIParent';
import World from '../engine/World';
import Input from '../engine/Input';
import Label from '../engine/interface/Label';
import NetClient from '../engine/NetClient';
import { PacketHeader, ChatMsgPacket } from '../../common/Packet';
import Chatbox from '../engine/interface/Chatbox';
import ChatHoverMessage from '../engine/interface/ChatHoverMessage';

export default class WorldScene extends GameScene {
    private world: World;
    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;
    private mousePoint: THREE.Vector3;
    private wireframesVisible: boolean = false;
    private chatbox: Chatbox;
    private chatHoverMsgs: ChatHoverMessage[] = [];

    public constructor() {
        super('world');
    }

    private initGUI() {
        // build back button
        const btnBack = new Button('btn-back', UIParent.get(), 'Back');
        btnBack.style.position = 'fixed';
        btnBack.style.margin = '5px 10px';
        btnBack.style.display = 'block';
        btnBack.style.width = '120px';
        btnBack.style.bottom = '5px';
        btnBack.style.right = '0';
        btnBack.addEventListener('click', () => {
            console.log('sending leave world');

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

    public async init() {
        this.initGUI();

        this.scene = new Scene();
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);

        const light = new THREE.AmbientLight(0xffffff, 2);
        light.position.set(0, 1, 0).normalize();
        this.scene.add(light);

        this.world = new World(this.scene);
    }

    public final() {
        super.final();
    }

    private updateMousePoint() {
        const intersects = this.camera.rcast(this.scene, Input.mousePos());
        if (intersects.length > 0) {
            this.mousePoint = intersects[0].point;
        } else {
            this.mousePoint = null;
        }
    }

    private updateMouseLabels() {
        if (this.mousePoint) {
            const tileCoord = this.world.chunkWorld.worldToTile(this.mousePoint);
            const chunkCoord = this.world.chunkWorld.tileToChunk(tileCoord);
            this.lblMouseWorld.text = `World: { ${this.mousePoint.x.toFixed(2)}, ${this.mousePoint.y.toFixed(2)}, ${this.mousePoint.z.toFixed(2)} }`;
            this.lblMouseTile.text = `Tile: { ${tileCoord.x}, ${tileCoord.y} } elevation: ${(this.world.chunkWorld.getElevation(tileCoord) || 0).toFixed(2)}`;
            this.lblMouseChunk.text = `Chunk: { ${chunkCoord.x}, ${chunkCoord.y} }`;
        } else {
            this.lblMouseWorld.text = 'World: { ?, ?, ? }';
            this.lblMouseTile.text = 'Tile: { ?, ? }';
            this.lblMouseChunk.text = 'Chunk: { ?, ? }';
        }
    }

    private updateWireframesToggle() {
        if (Input.wasKeyPressed('1')) {
            this.wireframesVisible = !this.wireframesVisible;
            this.world.chunkWorld.setWireframeVisibility(this.wireframesVisible);
        }
        if (Input.wasKeyPressed(Key.Enter)) {
            this.chatbox.focus();
        }
    }

    private updateChatHoverMsgs() {
        this.chatHoverMsgs = this.chatHoverMsgs.filter((msg: ChatHoverMessage) => !msg.update());
    }

    public update(delta: number) {
        this.updateMousePoint();
        this.updateMouseLabels();
        this.updateWireframesToggle();
        this.updateChatHoverMsgs();

        this.camera.update(delta, this.world);
        this.world.update(delta, this.mousePoint);
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
