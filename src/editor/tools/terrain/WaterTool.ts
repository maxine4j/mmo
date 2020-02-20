import { Key } from 'ts-key-enum';
import uuid from 'uuid/v4';
import Tool from '../../Tool';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Graphics from '../../../client/engine/graphics/Graphics';
import { Point } from '../../../common/Point';
import Water from '../../../client/engine/graphics/Water';
import Chunk from '../../../client/models/Chunk';
import { WaterDef } from '../../../common/ChunkDef';
import SliderProp from '../../panelprops/SliderProp';

enum WaterToolMode {
    SELECT,
    POSITION,
    ROTATE,
    ELEVATION,
}

export default class WaterTool extends Tool {
    private mouseStart: Point;
    private intialTheta: number;
    private initialElevation: number;
    private _selected: Water;
    private mode: WaterToolMode;
    private get selected(): Water { return this._selected; }
    private set selected(w: Water) {
        this._selected = w;
        if (w) {
            Graphics.setOutlines([w]);
        }
        this.updateProps();
    }
    private propSizeX: SliderProp;
    private propSizeZ: SliderProp;
    private propElevation: SliderProp;
    private propFlowrate: SliderProp;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'water',
            '- Select water with left click.\n'
            + '- Control + left click to move the selected water.\n'
            + '- Alt + left click to rotate the selected water (Alt+Shift for snapping).\n'
            + '- Shift + left click to adjust the selected water\'s elevation.',
            'assets/icons/water.png',
            props, panel,
        );

        this.propSizeX = new SliderProp(this.propsPanel, 'Size X:', 1, props.world.chunkSize, 1, 10,
            (val) => {
                if (this.selected) {
                    this.selected.def.sizex = val;
                    this.selected.updateGeometry();
                }
            });
        this.propsPanel.addProp(this.propSizeX);
        this.propSizeZ = new SliderProp(this.propsPanel, 'Size Z:', 1, props.world.chunkSize, 1, 10,
            (val) => {
                if (this.selected) {
                    this.selected.def.sizez = val;
                    this.selected.updateGeometry();
                }
            });
        this.propsPanel.addProp(this.propSizeZ);
        this.propsPanel.addBreak();

        this.propElevation = new SliderProp(this.propsPanel, 'Elevation:', -10, 50, 0.01, 0,
            (val) => {
                if (this.selected) {
                    this.selected.def.elevation = val;
                    this.selected.positionInWorld();
                }
            });
        this.propsPanel.addProp(this.propElevation);
        this.propFlowrate = new SliderProp(this.propsPanel, 'Flow Rate:', -10, 10, 0.01, 1,
            (val) => {
                if (this.selected) {
                    this.selected.def.flowRate = val;
                }
            });
        this.propsPanel.addProp(this.propFlowrate);
        this.propsPanel.addBreak();

        this.updateProps();
    }

    private updateProps(): void {
        if (this.selected) {
            this.propSizeX.show();
            this.propSizeX.value = this.selected.def.sizex;
            this.propSizeZ.show();
            this.propSizeZ.value = this.selected.def.sizez;
            this.propElevation.show();
            this.propElevation.value = this.selected.def.elevation;
            this.propFlowrate.show();
            this.propFlowrate.value = this.selected.def.flowRate;
        } else {
            this.propSizeX.hide();
            this.propSizeZ.hide();
            this.propElevation.hide();
            this.propFlowrate.hide();
        }
    }

    private createWater(): void {
        const point = this.props.point.toChunk();

        const def = <WaterDef>{
            id: uuid(),
            elevation: point.elevation,
            colour: 0x37a0b0,
            normals: 'assets/terrain/water/normal.jpg',
            rotation: 0,
            sizex: 50,
            sizez: 50,
            x: point.x,
            y: point.y,
            flowRate: 1,
        };
        point.chunk.def.waters.push(def);
        const water = new Water(point.chunk, def, false);
        point.chunk.waters.set(water.def.id, water);
    }

    private transferWater(id: string, oldChunk: Chunk, newChunk: Chunk): void {
        for (let i = 0; i < oldChunk.def.waters.length; i++) {
            const def = oldChunk.def.waters[i];
            if (def.id === id) { // find the def index
                const w = oldChunk.waters.get(id);
                // save the water to the new chunk
                newChunk.waters.set(id, w);
                newChunk.def.waters.push(w.def);
                w.chunk = newChunk;
                // remove the def from its old chunk
                oldChunk.def.waters.splice(i, 1);
                if (w) {
                    oldChunk.waters.delete(id);
                }
                break;
            }
        }
    }

    private deleteSelected(): void {
        if (this.selected != null) {
            const chunk = this.selected.chunk;
            // remove the water def from the chunk def so it exports
            chunk.def.waters = chunk.def.waters.filter((w) => w.id !== this.selected.def.id);
            // remove the water from the scene
            this.selected.dispose();
            chunk.waters.delete(this.selected.def.id);
            this.selected = null;
        }
    }

    private usePosition(): void {
        const chunkPoint = this.props.point.toChunk();

        // check if we need to transfer the water to another chunk
        const oldChunk = this.selected.chunk;
        const newChunk = chunkPoint.chunk;
        if (oldChunk.def.id !== newChunk.def.id) {
            this.transferWater(this.selected.def.id, oldChunk, newChunk);
        }

        this.selected.def.x = chunkPoint.x;
        this.selected.def.y = chunkPoint.y;
    }

    private useRotate(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.selected.def.rotation = Graphics.normaliseRadians(this.intialTheta + mouseDelta.x / 100);
        // snapping
        if (Input.isKeyDown(Key.Shift)) {
            this.selected.def.rotation = Graphics.snapAngle(this.selected.def.rotation, 8);
        }
    }

    private useElevation(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.selected.def.elevation = this.initialElevation - mouseDelta.y / 100;
    }

    public use(delta: number): void {
        if (this.selected) {
            switch (this.mode) {
            case WaterToolMode.POSITION: this.usePosition(); break;
            case WaterToolMode.ROTATE: this.useRotate(); break;
            case WaterToolMode.ELEVATION: this.useElevation(); break;
            default: break;
            }
            this.selected.positionInWorld();
        }
    }

    public update(delta: number): void {
        this.mode = WaterToolMode.SELECT; // default to select

        // get mode from modifier keys
        if (Input.isKeyDown(Key.Control)) {
            this.mode = WaterToolMode.POSITION;
        } else if (Input.isKeyDown(Key.Alt)) {
            this.mode = WaterToolMode.ROTATE;
        } else if (Input.isKeyDown(Key.Shift)) {
            this.mode = WaterToolMode.ELEVATION;
        }

        // handle select
        if (this.mode === WaterToolMode.SELECT && Input.wasMousePressed(MouseButton.LEFT)) {
            const intersects = this.props.camera.rcast(this.props.scene.children, Input.mousePos());
            for (const ints of intersects) {
                if (ints.object.userData.water) {
                    console.log('selecting water');

                    this.selected = ints.object.userData.water;
                    break;
                }
            }
        }

        // handle rotation initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.selected) {
                this.intialTheta = this.selected.def.rotation;
                this.initialElevation = this.selected.def.elevation;
            }
        }

        if (Input.wasKeyPressed(Key.Delete)) {
            this.deleteSelected();
        }

        if (Input.wasKeyPressed(Key.Insert)) {
            this.createWater();
        }
    }
}
