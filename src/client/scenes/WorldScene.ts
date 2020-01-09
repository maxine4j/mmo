import * as THREE from 'three';
import { Key } from 'ts-key-enum';
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
import Input from '../engine/Input';
import Label from '../engine/interface/Label';

export default class WorldScene extends GameScene {
    private world: World;
    private lblMouseOverTile: Label;
    private mousePoint: THREE.Vector3;

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

        this.lblMouseOverTile = new Label('lbl-mouse-over-tile', UIParent.get(), 'Tile: { X, Y }');
        this.lblMouseOverTile.style.position = 'fixed';
        this.lblMouseOverTile.style.top = '10px';
        this.lblMouseOverTile.style.left = '0';
        this.addGUI(this.lblMouseOverTile);
    }

    public async init() {
        this.initGUI();

        this.scene = new Scene();
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(400, 200, 0);
        this.camera.initOrbitControls();

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        // const size = 150;
        // const divisions = 150;
        // const gridHelper = new THREE.GridHelper(size, divisions);
        // this.scene.add(gridHelper);

        this.world = new World(this.scene);
        await Promise.all([
            this.world.loadChunk(0),
        ]);
    }

    public final() {
        super.final();
    }

    public update(delta: number) {
        const intersects = this.camera.rcast(this.scene, Input.mousePos());
        if (intersects.length > 0) {
            this.mousePoint = intersects[0].point;
            const tileCoord = this.world.worldToTile(this.mousePoint);
            this.lblMouseOverTile.text = `Tile: { ${tileCoord.x}, ${tileCoord.y} } elevation: ${this.world.getElevation(tileCoord.x, tileCoord.y)}`;
        } else {
            this.lblMouseOverTile.text = 'Tile: { ?, ? }';
        }

        if (Input.wasKeyPressed('1')) {
            this.world.terrainWireframes(true);
        }

        if (Input.wasKeyPressed('2')) {
            this.world.terrainWireframes(false);
        }

        this.world.update(delta, this.mousePoint);
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
