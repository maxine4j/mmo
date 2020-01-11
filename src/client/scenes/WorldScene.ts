import * as THREE from 'three';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/Button';
import SceneManager from '../engine/scene/SceneManager';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import UIParent from '../engine/interface/UIParent';
import LocalWorld from '../engine/LocalWorld';
import Input from '../engine/Input';
import Label from '../engine/interface/Label';
import NetClient from '../engine/NetClient';
import { PacketHeader } from '../../common/Packet';

export default class WorldScene extends GameScene {
    private world: LocalWorld;
    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;
    private lblMouseTerrain: Label;
    private lblTileToWorld: Label;
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

        this.lblMouseTerrain = new Label('lbl-mouse-terrain', UIParent.get(), 'Terrain: { X, Y }');
        this.lblMouseTerrain.style.position = 'fixed';
        this.lblMouseTerrain.style.top = '60px';
        this.lblMouseTerrain.style.left = '0';
        this.addGUI(this.lblMouseTerrain);

        this.lblTileToWorld = new Label('lbl-tile-to-world', UIParent.get(), 'Tile To World: { X, Y, Z }');
        this.lblTileToWorld.style.position = 'fixed';
        this.lblTileToWorld.style.top = '75px';
        this.lblTileToWorld.style.left = '0';
        this.addGUI(this.lblTileToWorld);
    }

    public async init() {
        this.initGUI();

        this.scene = new Scene();
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 0);
        this.camera.initOrbitControls();

        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(0, 1, 0).normalize();
        this.scene.add(light);

        this.world = new LocalWorld(this.scene);
    }

    public final() {
        super.final();
    }

    public update(delta: number) {
        const intersects = this.camera.rcast(this.scene, Input.mousePos());
        if (intersects.length > 0) {
            this.mousePoint = intersects[0].point;
            const tileCoord = this.world.worldToTile(this.mousePoint);
            const chunkCoord = this.world.tileToChunk(tileCoord.x, tileCoord.y);
            const terrainCoord = this.world.chunks.get(0).chunkToTerrain(chunkCoord.x, chunkCoord.y);
            const tileToWorld = this.world.tileToWorld(tileCoord.x, tileCoord.y);
            this.lblMouseWorld.text = `World: { ${this.mousePoint.x.toFixed(2)}, ${this.mousePoint.y.toFixed(2)}, ${this.mousePoint.z.toFixed(2)} }`;
            this.lblMouseTile.text = `Tile: { ${tileCoord.x}, ${tileCoord.y} } elevation: ${(this.world.getElevation(tileCoord.x, tileCoord.y) || 0).toFixed(2)}`;
            this.lblMouseChunk.text = `Chunk: { ${chunkCoord.x}, ${chunkCoord.y} }`;
            this.lblMouseTerrain.text = `Terrain: { ${terrainCoord.x}, ${terrainCoord.y} }`;
            this.lblTileToWorld.text = `Tile To World: { ${tileToWorld.x.toFixed(2)}, ${tileToWorld.y.toFixed(2)}, ${tileToWorld.z.toFixed(2)} }`;
        } else {
            this.lblMouseWorld.text = 'World: { ?, ?, ? }';
            this.lblMouseTile.text = 'Tile: { ?, ? }';
            this.lblMouseChunk.text = 'Chunk: { ?, ? }';
            this.lblMouseTerrain.text = 'Terrain: { ?, ? }';
            this.lblTileToWorld.text = 'Tile To World: { ?, ?, ? }';
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
