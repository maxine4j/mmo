import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Key } from 'ts-key-enum';
import GameScene from '../client/engine/scene/GameScene';
import Button from '../client/engine/interface/Button';
import Graphics from '../client/engine/graphics/Graphics';
import Camera from '../client/engine/graphics/Camera';
import Scene from '../client/engine/graphics/Scene';
import UIParent from '../client/engine/interface/UIParent';
import Input from '../client/engine/Input';
import Label from '../client/engine/interface/Label';
import Brush from './Brush';
import WorldPoint from './WorldPoint';
import EditorChunk from './EditorChunk';
import ChunkWorld from '../client/engine/ChunkWorld';
import ChunkDef from '../common/Chunk';
import _chunkDefs from '../server/data/chunks.json';
import ChunksDataDef from '../server/data/ChunksJsonDef';

const chunkDefs = <ChunksDataDef>_chunkDefs;

export default class EditorScene extends GameScene {
    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;
    private point: WorldPoint;
    private cameraControls: OrbitControls;
    private currentChunk: EditorChunk;
    private brush: Brush;
    private chunkWorld: ChunkWorld;

    public constructor() {
        super('editor');
    }

    private downloadChunk() {
        const data = JSON.stringify(this.currentChunk.chunk.def);
        const file = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = 'Chunk.json';
        a.click();
    }

    private initGUI() {
        const btnDownload = new Button('btn-download', UIParent.get(), 'Download');
        btnDownload.style.right = '0';
        btnDownload.addEventListener('click', this.downloadChunk.bind(this));

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
    }

    private async loadChunkDef(url: string): Promise<ChunkDef> {
        return new Promise((resolve) => {
            fetch(url)
                .then((resp) => resp.json())
                .then((def: ChunkDef) => {
                    resolve(def);
                });
        });
    }

    public async init() {
        this.initGUI();
        this.point = new WorldPoint();

        this.scene = new Scene();
        this.camera = new Camera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);
        this.cameraControls = new OrbitControls(this.camera, Graphics.renderer.domElement);

        const light = new THREE.AmbientLight(0xffffff, 2);
        light.position.set(0, 1, 0).normalize();
        this.scene.add(light);

        this.chunkWorld = new ChunkWorld(this.scene);
        this.chunkWorld.setWireframeVisibility(true);
        // const def = await this.loadChunkDef('assets/chunks/editorchunk.json');
        const def = chunkDefs[0];
        this.currentChunk = new EditorChunk(await this.chunkWorld.loadChunk(def));

        this.brush = new Brush(this.scene);
    }

    public final() {
        super.final();
    }

    private updateMouseLabels() {
        if (this.point.world) {
            this.lblMouseWorld.text = `World: { ${this.point.world.x.toFixed(2)}, ${this.point.world.y.toFixed(2)}, ${this.point.world.z.toFixed(2)} }`;
        } else { this.lblMouseWorld.text = 'World: { ?, ?, ? }'; }
        if (this.point.tile) {
            this.lblMouseTile.text = `Tile: { ${this.point.tile.x}, ${this.point.tile.y} } elevation: ${(this.point.elevation || 0).toFixed(2)}`;
        } else { this.lblMouseTile.text = 'Tile: { ?, ? }'; }
        if (this.point.chunk) {
            this.lblMouseChunk.text = `Chunk: { ${this.point.chunk.x}, ${this.point.chunk.y} }`;
        } else { this.lblMouseChunk.text = 'Chunk: { ?, ? }'; }
    }

    private updateMousePoint() {
        const intersects = this.camera.rcast(this.scene, Input.mousePos());
        let idx = 0;
        while (idx < intersects.length) {
            const int = intersects[idx++];
            if (int.object.name === 'brush') {
                continue;
            }
            this.point.set(int.point, this.chunkWorld);
        }
    }

    private updateHeightBrush(delta: number) {
        if (Input.isKeyDown(Key.Insert)) {
            this.brush.pointsIn(this.currentChunk.chunk.def).forEach((p) => {
                this.currentChunk.incHeight(p, 1 * delta);
            });
            this.currentChunk.updateMesh();
            this.currentChunk.updateDoodads();
        }
    }

    public update(delta: number) {
        this.cameraControls.update();
        this.updateMousePoint();
        this.updateMouseLabels();
        this.updateHeightBrush(delta);
        this.brush.update(delta, this.point, this.chunkWorld);
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
