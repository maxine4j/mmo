import * as THREE from 'three';
import GameScene from '../client/engine/scene/GameScene';
import Button from '../client/engine/interface/Button';
import Graphics from '../client/engine/graphics/Graphics';
import Scene from '../client/engine/graphics/Scene';
import UIParent from '../client/engine/interface/UIParent';
import Label from '../client/engine/interface/Label';
import EditorChunk from './EditorChunk';
import ChunkWorld from '../client/engine/ChunkWorld';
import _chunkDefs from '../server/data/chunks.json';
import ChunksDataDef from '../server/data/ChunksJsonDef';
import EditorCamera from './EditorCamera';
import ToolPanel from './ToolPanel';
import AddTool from './tools/terrain/AddTool';
import SubTool from './tools/terrain/SubTool';
import SetTool from './tools/terrain/SetTool';
import SmoothTool from './tools/terrain/SmoothTool';
import EditorProps from './EditorProps';
import PropsPanel from './PropsPanel';
import CheckBoxProp from './panelprops/CheckboxProp';
import DoodadSelectTool from './tools/doodad/DoodadSelectTool';
import DoodadMoveTool from './tools/doodad/DoodadMoveTool';
import DoodadRotateTool from './tools/doodad/DoodadRotateTool';
import DoodadScaleTool from './tools/doodad/DoodadScaleTool';
import DoodadNavigationTool from './tools/doodad/DoodadNavigationTool';

const chunkDefs = <ChunksDataDef>_chunkDefs;

/*

Doodad add from library
Texture painting

*/

export default class EditorScene extends GameScene {
    private props: EditorProps;

    private toolPanel: ToolPanel;
    private worldPropsPanel: PropsPanel;

    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;


    public constructor() {
        super('editor');
    }

    private downloadChunk(): void {
        const data = JSON.stringify(this.props.chunk.chunk.def);
        const file = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = 'Chunk.json';
        a.click();
    }

    private initTools(): void {
        this.toolPanel = new ToolPanel();
        this.addGUI(this.toolPanel);

        this.toolPanel.add(new AddTool(this.props, this.toolPanel));
        this.toolPanel.add(new SubTool(this.props, this.toolPanel));
        this.toolPanel.add(new SetTool(this.props, this.toolPanel));
        this.toolPanel.add(new SmoothTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadSelectTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadMoveTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadRotateTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadScaleTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadNavigationTool(this.props, this.toolPanel));
    }

    private initWorldProps(): void {
        this.worldPropsPanel = new PropsPanel('panel-props', UIParent.get());
        this.worldPropsPanel.width = 200;
        this.worldPropsPanel.height = 600;
        this.worldPropsPanel.style.top = 'initial';
        this.worldPropsPanel.style.right = '0';
        this.worldPropsPanel.style.bottom = '0';
        this.worldPropsPanel.style.left = 'initial';
        this.worldPropsPanel.style.marginLeft = 'initial';

        this.worldPropsPanel.centreVertical();
        this.worldPropsPanel.show();
        this.addGUI(this.worldPropsPanel);

        this.worldPropsPanel.addProp(new CheckBoxProp(this.worldPropsPanel, 'Terrain Wireframe',
            (value) => {
                this.props.world.setWireframeVisibility(value);
            }));
    }

    private initCoordsGUI(): void {
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

    private initGUI(): void {
        this.initCoordsGUI();

        const btnDownload = new Button('btn-download', UIParent.get(), 'Download');
        btnDownload.style.right = '0';
        btnDownload.addEventListener('click', this.downloadChunk.bind(this));
    }

    public async init(): Promise<void> {
        this.scene = new Scene();

        this.camera = new EditorCamera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);

        this.props = new EditorProps(this.camera, this.scene);

        const light = new THREE.AmbientLight(0xffffff, 2);
        light.position.set(0, 1, 0).normalize();
        this.props.scene.add(light);

        this.props.world = new ChunkWorld(this.props.scene);
        const def = chunkDefs[0];
        this.props.chunk = new EditorChunk(await this.props.world.loadChunk(def));

        this.initTools();
        this.initWorldProps();
        this.initGUI();

        super.init();
    }

    public final(): void {
        super.final();
    }

    private updateMouseLabels(): void {
        if (this.props.point.world) {
            this.lblMouseWorld.text = `World: { ${this.props.point.world.x.toFixed(2)}, ${this.props.point.world.y.toFixed(2)}, ${this.props.point.world.z.toFixed(2)} }`;
        } else { this.lblMouseWorld.text = 'World: { ?, ?, ? }'; }
        if (this.props.point.tile) {
            this.lblMouseTile.text = `Tile: { ${this.props.point.tile.x}, ${this.props.point.tile.y} } elevation: ${(this.props.point.elevation || 0).toFixed(2)}`;
        } else { this.lblMouseTile.text = 'Tile: { ?, ? }'; }
        if (this.props.point.chunk) {
            this.lblMouseChunk.text = `Chunk: { ${this.props.point.chunk.x}, ${this.props.point.chunk.y} }`;
        } else { this.lblMouseChunk.text = 'Chunk: { ?, ? }'; }
    }

    public update(delta: number): void {
        this.props.camera.update();
        this.props.point.update(this.props.scene, this.props.camera, this.props.world);
        this.toolPanel.update(delta);
        this.updateMouseLabels();
    }

    public draw(): void {
        super.draw();
    }
}
