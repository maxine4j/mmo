import * as THREE from 'three';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/Button';
import SceneManager from '../engine/scene/SceneManager';
import NetClient from '../engine/NetClient';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import UIParent from '../engine/interface/UIParent';
import { PacketHeader, CharacterPacket } from '../../common/Packet';

export default class WorldScene extends GameScene {
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
        btnBack.addEventListener('click', () => SceneManager.changeScene('char-select'));
        this.addGUI(btnBack);
    }

    private async initPlayer() {
        NetClient.sendRecv(PacketHeader.PLAYER_UPDATE_SELF).then((p: CharacterPacket) => {});
    }

    public async init() {
        this.initGUI();
        this.initPlayer();

        this.scene = new Scene();
        this.camera = new Camera(75, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.y += 10;
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        const light = new THREE.AmbientLight(0xffffff, 3);
        light.position.set(0, 0, 1).normalize();
        this.scene.add(light);

        const size = 10;
        const divisions = 10;
        const gridHelper = new THREE.GridHelper(size, divisions);
        this.scene.add(gridHelper);
    }

    public final() {
        super.final();
    }

    public update(delta: number) {
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
