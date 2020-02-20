import * as THREE from 'three';
import GameScene from '../client/engine/scene/GameScene';
import Graphics from '../client/engine/graphics/Graphics';
import Scene from '../client/engine/graphics/Scene';
import UIParent from '../client/engine/interface/components/UIParent';
import Label from '../client/engine/interface/components/Label';
import _overworldDef from '../server/data/overworld.json';
import WorldJsonDef from '../server/data/WorldsJsonDef';
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
import ChunkTool from './tools/chunk/ChunkTool';
import ButtonProp from './panelprops/ButtonProp';
import EditorChunkWorld from './EditorChunkWorld';
import Chunk from '../client/models/Chunk';
import SliderProp from './panelprops/SliderProp';
import DoodadAddTool from './tools/doodad/DoodadAddTool';
import _content from '../client/assets/content.json';
import ContentDef from '../client/engine/asset/AssetDef';
import DoodadCloneTool from './tools/doodad/DoodadCloneTool';
import PaintTool, { getBlendMapData } from './tools/terrain/PaintTool';
import WaterTool from './tools/terrain/WaterTool';

export const contentDef = <ContentDef>_content;
export const overworldDef = <WorldJsonDef><any>_overworldDef; // FIXME: remove any when interactables fully implemented

// const cSize = 128;
// export const overworldDef = <WorldJsonDef>{
//     id: 'testmap',
//     chunkSize: cSize,
//     chunks: {
//         0: {
//             id: '0',
//             x: 0,
//             y: 0,
//             texture: 'assets/texturemap.png',
//             heightmap: Array.from({ length: cSize * cSize }, () => 0),
//             texturemap: Array.from({ length: (cSize * cSize) * 2 }, () => 0),
//             doodads: [],
//         },
//     },
// };

/*

TODO:
    - Make wireframe updating perform better

TODO NEW FEATURES:
    - Invisible doodad in library
    - Place lights, maybe as part of doodads
    - Skybox and amibent light for caves
    - Multiple world support, maybe have WorldListJsonDef or something, ability to switch between worlds
    - Interactables like ladders/caves between worlds
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
        const world = <WorldJsonDef>{
            id: overworldDef.id,
            chunkSize: overworldDef.chunkSize,
            chunks: {},
        };
        for (const [_x, _y, chunk] of this.props.world.chunks) {
            world.chunks[chunk.def.id] = chunk.def;
            world.chunks[chunk.def.id].textures = getBlendMapData(chunk); // TODO: this needs to be set up on the chunk def in the paint tool
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

        this.toolPanel.add(new AddTool(this.props, this.toolPanel));
        this.toolPanel.add(new SubTool(this.props, this.toolPanel));
        this.toolPanel.add(new SetTool(this.props, this.toolPanel));
        this.toolPanel.add(new SmoothTool(this.props, this.toolPanel));
        this.toolPanel.add(new PaintTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadSelectTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadAddTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadMoveTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadRotateTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadScaleTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadNavigationTool(this.props, this.toolPanel));
        this.toolPanel.add(new DoodadCloneTool(this.props, this.toolPanel));
        this.toolPanel.add(new ChunkTool(this.props, this.toolPanel));
        this.toolPanel.add(new WaterTool(this.props, this.toolPanel));
    }

    private initWorldProps(): void {
        this.worldPropsPanel = new PropsPanel(UIParent.get());
        this.worldPropsPanel.width = 400;
        this.worldPropsPanel.height = 300;
        this.worldPropsPanel.style.left = 'initial';
        this.worldPropsPanel.style.margin = '0';
        this.worldPropsPanel.style.top = 'initial';
        this.worldPropsPanel.style.right = '0';
        this.worldPropsPanel.style.bottom = '0';
        this.worldPropsPanel.show();

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
            true));
        this.worldPropsPanel.addProp(new SliderProp(this.worldPropsPanel, '', 0, 5, 0.01, this.camera.pointLight.intensity,
            (value) => {
                this.camera.pointLight.intensity = value;
            }));
        this.worldPropsPanel.addBreak();

        this.worldPropsPanel.addProp(new CheckBoxProp(this.worldPropsPanel, 'Hemisphere Light',
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
        let lastOffset = 50;
        const sep = 15;

        this.lblMouseWorld = new Label(UIParent.get(), 'World: { X, Y, Z }');
        this.lblMouseWorld.style.position = 'fixed';
        this.lblMouseWorld.style.top = `${lastOffset}px`; lastOffset += sep;
        this.lblMouseWorld.style.left = '0';

        this.lblMouseTile = new Label(UIParent.get(), 'Tile: { X, Y }');
        this.lblMouseTile.style.position = 'fixed';
        this.lblMouseTile.style.top = `${lastOffset}px`; lastOffset += sep;
        this.lblMouseTile.style.left = '0';

        this.lblMouseChunk = new Label(UIParent.get(), 'Chunk: { X, Y }');
        this.lblMouseChunk.style.position = 'fixed';
        this.lblMouseChunk.style.top = `${lastOffset}px`; lastOffset += sep;
        this.lblMouseChunk.style.left = '0';
    }

    private initGUI(): void {
        this.initCoordsGUI();
    }

    public async init(): Promise<void> {
        this.scene = new Scene();
        this.props = new EditorProps();
        this.props.scene = this.scene;

        this.camera = new EditorCamera(this.props, 60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.props.camera = this.camera;

        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x3d394d, 1);

        this.props.world = new EditorChunkWorld(this.props.scene, overworldDef);
        const chunkLoads: Promise<Chunk>[] = [];
        for (const key in overworldDef.chunks) { chunkLoads.push(this.props.world.loadChunk(overworldDef.chunks[key])); }
        await Promise.all(chunkLoads);

        // await this.props.world.loadChunk(overworldDef.chunks['0']);

        this.props.world.stitchChunks();
        this.props.world.stitchChunks(); // calling this twice on init allows us to have chunks be unordered

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
        this.props.camera.update(delta);
        this.props.update(delta);
        this.toolPanel.update(delta);
        this.updateMouseLabels();
    }

    public draw(): void {
        super.draw();
    }
}
