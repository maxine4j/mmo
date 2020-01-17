import { Key } from 'ts-key-enum';
import Tool from '../../Tool';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Graphics from '../../../client/engine/graphics/Graphics';
import Point from '../../../common/Point';

enum DoodadToolMode {
    SELECT,
    POSITION,
    ROTATE,
    ELEVATION,
}

export default class DoodadSelectTool extends Tool {
    private mode: DoodadToolMode;
    private mouseStart: Point;
    private intialTheta: number;
    private initialElevation: number;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-select',
            '- Select doodads with left click.\n'
            + '- Control + left click to move the selected doodad.\n'
            + '- Alt + left click to rotate the selected doodad (Alt+Shift for snapping).\n'
            + '- Shift + left click to adjust the selected doodad\'s elevation.',
            'assets/icons/doodad_select.png',
            props, panel,
        );
    }

    private usePosition(): void {
        this.props.selectedDoodad.def.x = this.props.point.chunk.x;
        this.props.selectedDoodad.def.y = this.props.point.chunk.y;
    }

    private useRotate(): void {
        const mouseDelta = Point.sub(Input.mousePos(), this.mouseStart);
        this.props.selectedDoodad.def.rotation = Graphics.normaliseRadians(this.intialTheta + mouseDelta.x / 100);
        // snapping
        if (Input.isKeyDown(Key.Shift)) {
            this.props.selectedDoodad.def.rotation = Graphics.snapAngle(this.props.selectedDoodad.def.rotation, 8);
        }
    }

    private useElevation(): void {
        const mouseDelta = Point.sub(Input.mousePos(), this.mouseStart);
        this.props.selectedDoodad.def.elevation = this.initialElevation - mouseDelta.y / 100;
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
        this.mode = DoodadToolMode.SELECT; // default to select

        // get mode from modifier keys
        if (Input.isKeyDown(Key.Control)) {
            this.mode = DoodadToolMode.POSITION;
        } else if (Input.isKeyDown(Key.Alt)) {
            this.mode = DoodadToolMode.ROTATE;
        } else if (Input.isKeyDown(Key.Shift)) {
            this.mode = DoodadToolMode.ELEVATION;
        }

        // handle select
        if (this.mode === DoodadToolMode.SELECT && Input.wasMousePressed(MouseButton.LEFT)) {
            const intersects = this.props.camera.rcast(this.props.scene, Input.mousePos(), true);
            for (const ints of intersects) {
                if (ints.object.userData.doodad) {
                    this.props.selectedDoodad = ints.object.userData.doodad;
                    break;
                }
            }
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
