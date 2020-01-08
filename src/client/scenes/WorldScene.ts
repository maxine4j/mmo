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
import Player from '../engine/Player';
import World from '../engine/World';

export default class WorldScene extends GameScene {
    private player: Player;
    private world: World;

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
        NetClient.sendRecv(PacketHeader.PLAYER_UPDATE_SELF)
            .then((p: CharacterPacket) => {
                this.player = new Player(p.character);
            });
    }

    public async init() {
        this.initGUI();
        this.initPlayer();

        this.scene = new Scene();
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(400, 200, 0);
        this.camera.initOrbitControls();

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        const size = 100;
        const divisions = 100;
        const gridHelper = new THREE.GridHelper(size, divisions);
        this.scene.add(gridHelper);

        this.world = new World(this.scene);
        await Promise.all([
            this.world.loadChunk(0),
            this.world.loadChunk(1),
            this.world.loadChunk(2),
            this.world.loadChunk(3),
        ]);
    }

    public final() {
        super.final();
    }

    public update(delta: number) {
        // const intersects = this.camera.rcast(this.scene, Input.mousePos());
        // if (intersects.length > 0) {
        //     const ints = intersects[0];
        //     console.log(ints.point);
        // }
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
