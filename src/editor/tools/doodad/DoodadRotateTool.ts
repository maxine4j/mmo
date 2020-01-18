import { Key } from 'ts-key-enum';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import Graphics from '../../../client/engine/graphics/Graphics';
import { Point } from '../../../common/Point';
import CheckBoxProp from '../../panelprops/CheckboxProp';
import BaseDoodadTool from './BaseDoodadTool';
import SliderProp from '../../panelprops/SliderProp';

export default class DoodadRotateTool extends BaseDoodadTool {
    private mouseStart: Point;
    private intialTheta: number;
    private snappingProp: CheckBoxProp;
    private snapOverride: boolean;
    private _snapping: boolean = false;
    private snapCount: number = 8;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-rotate',
            '- Left click to rotate the selected doodad.\n'
            + '- Control + left click to select a doodad.',
            'assets/icons/doodad_rotate.png',
            props, panel,
        );

        this.snappingProp = new CheckBoxProp(this.propsPanel, 'Snapping:',
            (value) => {
                this.snapping = value;
                this.snapOverride = value;
            });
        this.propsPanel.addProp(this.snappingProp);

        const snapCountProp = new SliderProp(this.propsPanel, 'Snap Count:', 4, 16, 1, 8,
            (val) => {
                this.snapCount = val;
            });
        this.propsPanel.addProp(snapCountProp);
    }

    private get snapping(): boolean { return this._snapping; }
    private set snapping(val: boolean) {
        this._snapping = val;
        this.snappingProp.checked = this._snapping;
    }

    public doodadUse(delta: number): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.rotation = Graphics.normaliseRadians(this.intialTheta + mouseDelta.x / 100);
        if (this.snapping) {
            this.props.selectedDoodad.def.rotation = Graphics.snapAngle(this.props.selectedDoodad.def.rotation, this.snapCount);
        }
    }

    public update(delta: number): void {
        super.update(delta);

        // handle rotation initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.intialTheta = this.props.selectedDoodad.def.rotation;
            }
        }

        // update snapping
        if (Input.isKeyDown(Key.Shift)) {
            this.snapping = true;
        } else {
            this.snapping = false || this.snapOverride;
        }
    }
}
