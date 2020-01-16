import * as THREE from 'three';
import { Key } from 'ts-key-enum';
import TextBox from '../client/engine/interface/TextBox';
import GameScene from '../client/engine/scene/GameScene';
import Button from '../client/engine/interface/Button';
import Graphics from '../client/engine/graphics/Graphics';
import Scene from '../client/engine/graphics/Scene';
import UIParent from '../client/engine/interface/UIParent';
import Input from '../client/engine/Input';
import Label from '../client/engine/interface/Label';
import Brush from './Brush';
import WorldPoint from './WorldPoint';
import EditorChunk from './EditorChunk';
import ChunkWorld from '../client/engine/ChunkWorld';
import _chunkDefs from '../server/data/chunks.json';
import ChunksDataDef from '../server/data/ChunksJsonDef';
import Panel from '../client/engine/interface/Panel';
import Slider from '../client/engine/interface/Slider';
import EditorCamera from './EditorCamera';
import CheckBox from '../client/engine/interface/CheckBox';
import ToolPanel from './ToolPanel';
import Tool from './Tool';

const chunkDefs = <ChunksDataDef>_chunkDefs;

/*

Doodad editing
    Position
    Rotate
    Create Hitboxes
Texture painting

*/

export default class EditorScene extends GameScene {
    private point: WorldPoint;
    protected camera: EditorCamera;
    private currentChunk: EditorChunk;
    private chunkWorld: ChunkWorld;

    private brush: Brush;
    private toolPanel: ToolPanel;

    private lblMouseTile: Label;
    private lblMouseWorld: Label;
    private lblMouseChunk: Label;

    private panelProps: Panel;
    private txtBrushSize: TextBox;
    private sliderBrushSize: Slider;
    private txtHeight: TextBox;
    private sliderHeight: Slider;
    private brushHeight: number = 0;


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

    private initCoordsGUI() {
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

    private initTools() {
        this.toolPanel = new ToolPanel();
        this.addGUI(this.toolPanel.panel);

        this.toolPanel.add(new Tool('height-add', 'assets/icons/terrain_add.png',
            (delta, brush) => {
                brush.pointsIn(this.currentChunk.chunk.def).forEach((p) => {
                    this.currentChunk.incHeight(p, 1 * delta);
                });
                this.currentChunk.updateMesh();
                this.currentChunk.updateDoodads();
            }));

        this.toolPanel.add(new Tool('height-sub', 'assets/icons/terrain_sub.png',
            (delta, brush) => {
                brush.pointsIn(this.currentChunk.chunk.def).forEach((p) => {
                    this.currentChunk.incHeight(p, -1 * delta);
                });
                this.currentChunk.updateMesh();
                this.currentChunk.updateDoodads();
            }));

        this.toolPanel.add(new Tool('height-set', 'assets/icons/terrain_set.png',
            (delta, brush) => {
                brush.pointsIn(this.currentChunk.chunk.def).forEach((p) => {
                    this.currentChunk.setHeight(p, this.brushHeight);
                });
                this.currentChunk.updateMesh();
                this.currentChunk.updateDoodads();
            }));

        this.toolPanel.add(new Tool('height-smooth', 'assets/icons/terrain_smooth.png',
            (delta, brush) => {
                brush.pointsIn(this.currentChunk.chunk.def).forEach((p) => {
                    this.currentChunk.smooth(p, 1); // TODO: add strength slider
                });
                this.currentChunk.updateMesh();
                this.currentChunk.updateDoodads();
            }));
    }

    private addCheckboxProp(id: string, panel: Panel, label: string, onChange: (self: CheckBox, ev: MouseEvent) => void): CheckBox {
        const lbl = new Label(`${id}-lbl`, panel, label);
        lbl.style.position = 'initial';
        this.addGUI(lbl);

        const cb = new CheckBox(`${id}-cb`, lbl);
        cb.style.position = 'initial';
        cb.style.margin = '5px 15px';
        cb.addEventListener('change', onChange);
        this.addGUI(cb);

        return cb;
    }

    private addSliderProp(id: string, panel: Panel, label: string, min: number, max: number, step: number, val: number, onChange: (value: number) => void): [TextBox, Slider] {
        const lbl = new Label(`${id}-lbl`, panel, label);
        lbl.style.position = 'initial';

        const tb = new TextBox(`${id}-tb`, panel, 'number');
        this.addGUI(tb);
        tb.step = step;
        tb.style.position = 'initial';
        tb.text = this.brushHeight.toString();
        tb.width = 60;

        const slider = new Slider(`${id}-slider`, panel, min, max, val, step);
        this.addGUI(slider);
        slider.style.position = 'initial';
        slider.width = panel.width - 10;

        const tbUpdate = (self: TextBox, ev: MouseEvent) => {
            slider.value = Number(tb.text);
            onChange(slider.value);
        };

        tb.addEventListener('input', tbUpdate);
        tb.addEventListener('change', tbUpdate);

        slider.addEventListener('input', (self: Slider, ev: MouseEvent) => {
            tb.text = self.value.toString();
            onChange(self.value);
        });

        return [tb, slider];
    }

    private initPropsGUI() {
        const panelWidth = 200;
        const panelHeight = 600;

        this.panelProps = new Panel('panel-props', UIParent.get());
        this.panelProps.width = panelWidth;
        this.panelProps.height = panelHeight;
        this.panelProps.style.right = '0';
        this.panelProps.style.bottom = '0';
        this.panelProps.centreVertical();
        this.panelProps.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.panelProps.style.padding = '5px';
        this.addGUI(this.panelProps);

        this.addCheckboxProp('terrain-wireframes', this.panelProps, 'Terrain Wireframe',
            (cb) => {
                this.chunkWorld.setWireframeVisibility(cb.checked);
            });
        this.panelProps.addBreak();
        this.panelProps.addBreak();


        const [txtBrushSize, sliderBrushSize] = this.addSliderProp('brush-size', this.panelProps, 'Brush Size', 1, 20, 1, 0,
            (value: number) => {
                this.brush.size = value;
            });
        this.txtBrushSize = txtBrushSize;
        this.sliderBrushSize = sliderBrushSize;
        this.brush.onSizeChange = (size) => {
            this.sliderBrushSize.value = size;
            this.txtBrushSize.text = size.toString();
        };
        this.panelProps.addBreak();
        this.panelProps.addBreak();

        const [txtHeight, sliderHeight] = this.addSliderProp('height', this.panelProps, 'Height', -5, 10, 0.01, 0,
            (value: number) => {
                this.brushHeight = value;
            });
        this.txtHeight = txtHeight;
        this.sliderHeight = sliderHeight;
        this.panelProps.addBreak();
        this.panelProps.addBreak();
    }

    private initGUI() {
        this.initCoordsGUI();
        this.initPropsGUI();

        const btnDownload = new Button('btn-download', UIParent.get(), 'Download');
        btnDownload.style.right = '0';
        btnDownload.addEventListener('click', this.downloadChunk.bind(this));
    }

    private setBrushHeight(height: number) {
        this.brushHeight = height;
        this.sliderHeight.value = height;
        this.txtHeight.text = height.toString();
    }

    public async init() {
        this.point = new WorldPoint();

        this.scene = new Scene();
        this.camera = new EditorCamera(60, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 0);
        this.camera.lookAt(0, 0, 0);

        const light = new THREE.AmbientLight(0xffffff, 2);
        light.position.set(0, 1, 0).normalize();
        this.scene.add(light);

        this.chunkWorld = new ChunkWorld(this.scene);
        const def = chunkDefs[0];
        this.currentChunk = new EditorChunk(await this.chunkWorld.loadChunk(def));

        this.brush = new Brush(this.scene);

        this.initTools();
        this.initGUI();
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

    private updateHeightBrush(delta: number) {
        // height picker
        if (Input.isKeyDown(Key.Alt)) {
            const elev = this.chunkWorld.getElevation(this.point.tile);
            if (elev) {
                this.setBrushHeight(elev);
            }
        }

        this.toolPanel.update(delta, this.brush);
    }

    public update(delta: number) {
        this.camera.update();
        this.point.update(this.scene, this.camera, this.chunkWorld);
        this.updateMouseLabels();
        this.updateHeightBrush(delta);
        this.brush.update(this.point, this.chunkWorld);
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
