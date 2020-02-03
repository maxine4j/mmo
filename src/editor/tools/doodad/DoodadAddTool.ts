import { Key } from 'ts-key-enum';
import uuid from 'uuid/v4';
import Tool from '../../Tool';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Graphics from '../../../client/engine/graphics/Graphics';
import { Point } from '../../../common/Point';
import DoodadMoveTool from './DoodadMoveTool';
import { DoodadDef } from '../../../common/ChunkDef';
import Doodad from '../../../client/engine/Doodad';

enum DoodadToolMode {
    PLACE,
    POSITION,
    ROTATE,
    ELEVATION,
}

export default class DoodadAddTool extends Tool {
    private mode: DoodadToolMode;
    private mouseStart: Point;
    private intialTheta: number;
    private initialElevation: number;

    private libraryModel: string = 'crates';

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-add',
            '- Place the selected doodad in the world with left click.\n'
            + '- Control + left click to move the placed doodad.\n'
            + '- Alt + left click to rotate the placed doodad (Alt+Shift for snapping).\n'
            + '- Shift + left click to adjust the placed doodad\'s elevation.',
            'assets/icons/doodad_add.png',
            props, panel,
        );
    }

    private usePosition(): void {
        const chunkPoint = this.props.point.toChunk();

        // check if we need to transfer the doodad to another chunk
        const oldChunk = this.props.selectedDoodad.chunk;
        const newChunk = chunkPoint.chunk;
        if (oldChunk.def.id !== newChunk.def.id) {
            DoodadMoveTool.transferDoodad(this.props.selectedDoodad.def.uuid, oldChunk, newChunk);
        }

        this.props.selectedDoodad.def.x = chunkPoint.x;
        this.props.selectedDoodad.def.y = chunkPoint.y;
    }

    private useRotate(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.rotation = Graphics.normaliseRadians(this.intialTheta + mouseDelta.x / 100);
        // snapping
        if (Input.isKeyDown(Key.Shift)) {
            this.props.selectedDoodad.def.rotation = Graphics.snapAngle(this.props.selectedDoodad.def.rotation, 8);
        }
    }

    private useElevation(): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.elevation = this.initialElevation - mouseDelta.y / 100;
    }

    private placeDoodad(): void {
        // make a new doodad and place it at the mouse point
        // select the dooddad
        const chunkPoint = this.props.point.toChunk();
        const chunk = chunkPoint.chunk;

        const def = <DoodadDef>{
            uuid: uuid(),
            elevation: 0,
            rotation: 0,
            scale: 1,
            walkable: false,
            navblocks: [], // TODO: maybe load defaults? have library be more than list of models? navlbock copy tool?
            model: this.libraryModel,
            x: chunkPoint.x,
            y: chunkPoint.y,
        };
        chunk.def.doodads.push(def); // save the doodad to the chunk def so it exports

        Doodad.load(def, chunk).then((doodad) => {
            // add the doodad the the world and position it
            chunk.doodads.set(doodad.def.uuid, doodad);
            doodad.positionInWorld();
            this.props.selectedDoodad = doodad; // select it so we can further edit
        });
    }

    public use(delta: number): void {
        if (this.props.selectedDoodad) {
            switch (this.mode) {
            case DoodadToolMode.POSITION: this.usePosition(); break;
            case DoodadToolMode.ROTATE: this.useRotate(); break;
            case DoodadToolMode.ELEVATION: this.useElevation(); break;
            default: break;
            }
            this.props.selectedDoodad.positionInWorld();
        }
    }

    public update(delta: number): void {
        this.mode = DoodadToolMode.PLACE; // default to place

        // get mode from modifier keys
        if (Input.isKeyDown(Key.Control)) {
            this.mode = DoodadToolMode.POSITION;
        } else if (Input.isKeyDown(Key.Alt)) {
            this.mode = DoodadToolMode.ROTATE;
        } else if (Input.isKeyDown(Key.Shift)) {
            this.mode = DoodadToolMode.ELEVATION;
        }

        // handle select
        if (this.mode === DoodadToolMode.PLACE && Input.wasMousePressed(MouseButton.LEFT)) {
            this.placeDoodad();
        }

        // handle rotation initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.intialTheta = this.props.selectedDoodad.def.rotation;
                this.initialElevation = this.props.selectedDoodad.def.elevation;
            }
        }
    }
}
