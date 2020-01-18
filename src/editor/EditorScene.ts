import * as THREE from 'three';
import GameScene from '../client/engine/scene/GameScene';
import Graphics from '../client/engine/graphics/Graphics';
import Scene from '../client/engine/graphics/Scene';
import UIParent from '../client/engine/interface/UIParent';
import Label from '../client/engine/interface/Label';
import EditorChunk from './EditorChunk';
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
import ButtonProp from './panelprops/ButtonProp';
import EditorChunkWorld from './EditorChunkWorld';

const chunkDefs = <ChunksDataDef>_chunkDefs;

/*

Doodad add from library
Doodad info panel, edit props
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

    private downloadWorld(): void {
        const world = <ChunksDataDef>{};
        for (const [id, chunk] of this.props.world.world.chunks) {
            world[id] = chunk.def;
        }
        const data = JSON.stringify(world);
        const file = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = 'Chunks.json';
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
        this.worldPropsPanel.height = 300;
        this.worldPropsPanel.style.left = 'initial';
        this.worldPropsPanel.style.margin = '0';
        this.worldPropsPanel.style.top = 'initial';
        this.worldPropsPanel.style.right = '0';
        this.worldPropsPanel.style.bottom = '0';
        this.worldPropsPanel.show();
        this.addGUI(this.worldPropsPanel);

        this.worldPropsPanel.addProp(new CheckBoxProp(this.worldPropsPanel, 'Terrain Wireframe',
            (value) => {
                this.props.world.world.setWireframeVisibility(value);
            }));

        this.worldPropsPanel.addProp(new ButtonProp(this.worldPropsPanel, 'Download World',
            () => {
                this.downloadWorld();
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

        this.props.world = new EditorChunkWorld(this.props.scene);
        const defNorth = EditorChunk.newChunkDef(1, 0, -1, chunkDefs[0].size);
        const defNorthEast = EditorChunk.newChunkDef(2, 1, -1, chunkDefs[0].size);
        const defNorthWest = EditorChunk.newChunkDef(3, -1, -1, chunkDefs[0].size);
        const defSouth = EditorChunk.newChunkDef(4, 0, 1, chunkDefs[0].size);
        const defSouthEast = EditorChunk.newChunkDef(5, 1, 1, chunkDefs[0].size);
        const defSouthWest = EditorChunk.newChunkDef(6, -1, 1, chunkDefs[0].size);
        const defEast = EditorChunk.newChunkDef(7, 1, 0, chunkDefs[0].size);
        const defWest = EditorChunk.newChunkDef(8, -1, 0, chunkDefs[0].size);
        await Promise.all([
            this.props.world.world.loadChunk(chunkDefs[0]),
            this.props.world.world.loadChunk(defNorth),
            this.props.world.world.loadChunk(defSouth),
            this.props.world.world.loadChunk(defEast),
            this.props.world.world.loadChunk(defWest),
            this.props.world.world.loadChunk(defNorthEast),
            this.props.world.world.loadChunk(defNorthWest),
            this.props.world.world.loadChunk(defSouthEast),
            this.props.world.world.loadChunk(defSouthWest),
        ]);

        this.initTools();
        this.initWorldProps();
        this.initGUI();

        super.init();
    }

    public final(): void {
        super.final();
    }

    private updateMouseLabels(): void {
        if (this.props.point) {
            const tileCoord = this.props.point.toTile();
            const chunkCoord = tileCoord.toChunk();
            this.lblMouseWorld.text = `World: { ${this.props.point.x.toFixed(2)}, ${this.props.point.y.toFixed(2)}, ${this.props.point.z.toFixed(2)} }`;
            if (tileCoord) this.lblMouseTile.text = `Tile: { ${tileCoord.x}, ${tileCoord.y} } elevation: ${(tileCoord.elevation || 0).toFixed(2)}`;
            if (chunkCoord) this.lblMouseChunk.text = `Chunk: { ${chunkCoord.x}, ${chunkCoord.y} } elevation: ${(chunkCoord.elevation || 0).toFixed(2)}`;
        } else {
            this.lblMouseWorld.text = 'World: { ?, ?, ? }';
            this.lblMouseTile.text = 'Tile: { ?, ? } elevation: ?';
            this.lblMouseChunk.text = 'Chunk: { ?, ? } elevation: ?';
        }
    }

    public update(delta: number): void {
        this.props.camera.update();
        this.props.update(delta);
        this.toolPanel.update(delta);
        this.updateMouseLabels();
    }

    public draw(): void {
        super.draw();
    }
}
