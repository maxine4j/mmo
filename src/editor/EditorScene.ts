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
import Chunk from '../client/engine/Chunk';
import SliderProp from './panelprops/SliderProp';

const chunkDefs = <ChunksDataDef>_chunkDefs;

/*

TODO:
    - Make chunk/tile coords sqaures on terrain so we can join them up properly
    - Make wireframe updating perform better

TODO NEW FEATURES:
    - Doodad add from library
    - Doodad info panel, edit props
    - Texture painting

*/

export default class EditorScene extends GameScene {
    protected camera: EditorCamera;
    private props: EditorProps;

    private hemisphereLight: THREE.HemisphereLight;

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
        for (const [id, chunk] of this.props.world.chunks) {
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
        this.worldPropsPanel.width = 400;
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
                this.props.world.setWireframeVisibility(value);
            }));
        this.worldPropsPanel.addBreak();

        this.worldPropsPanel.addProp(new CheckBoxProp(this.worldPropsPanel, 'Cursor Light',
            (value) => {
                if (value) this.scene.add(this.camera.pointLight);
                else this.scene.remove(this.camera.pointLight);
            },
            false));
        this.worldPropsPanel.addProp(new SliderProp(this.worldPropsPanel, '', 0, 5, 0.01, this.camera.pointLight.intensity,
            (value) => {
                this.camera.pointLight.intensity = value;
            }));
        this.worldPropsPanel.addBreak();

        this.worldPropsPanel.addProp(new CheckBoxProp(this.worldPropsPanel, 'Ambient Light',
            (value) => {
                if (value) this.scene.add(this.hemisphereLight);
                else this.scene.remove(this.hemisphereLight);
            },
            true));
        this.worldPropsPanel.addProp(new SliderProp(this.worldPropsPanel, '', 0, 3, 0.01, this.hemisphereLight.intensity,
            (value) => {
                this.hemisphereLight.intensity = value;
            }));
        this.worldPropsPanel.addBreak();

        this.worldPropsPanel.addProp(new ButtonProp(this.worldPropsPanel, 'Download World',
            () => {
                this.downloadWorld();
            }));
        this.worldPropsPanel.addBreak();
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
        this.props = new EditorProps();
        this.props.scene = this.scene;

        this.camera = new EditorCamera(this.props, 60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);
        this.props.camera = this.camera;

        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x3d394d, 1.5);

        this.props.world = new EditorChunkWorld(this.props.scene);
        const chunkLoads: Promise<Chunk>[] = [];
        for (const key in chunkDefs) { chunkLoads.push(this.props.world.loadChunk(chunkDefs[key])); }
        await Promise.all(chunkLoads);

        this.props.world.stitchAllChunks();

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
