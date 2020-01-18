import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input, { MouseButton } from '../../../client/engine/Input';
import { Point } from '../../../common/Point';
import BaseDoodadTool from './BaseDoodadTool';

export default class DoodadScaleTool extends BaseDoodadTool {
    private mouseStart: Point;
    private initialScale: number;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-scale',
            '- Left click to scale the selected doodad.\n'
            + '- Control + left click to select a doodad.',
            'assets/icons/doodad_scale.png',
            props, panel,
        );
    }

    public doodadUse(delta: number): void {
        const mouseDelta = Input.mousePos().sub(this.mouseStart);
        this.props.selectedDoodad.def.scale = this.initialScale - mouseDelta.y / 100;
        if (this.props.selectedDoodad.def.scale < 0.0001) {
            this.props.selectedDoodad.def.scale = 0.0001;
        }
    }

    public update(delta: number): void {
        super.update(delta);

        // handle scale initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.initialScale = this.props.selectedDoodad.def.scale;
            }
        }
    }
}
