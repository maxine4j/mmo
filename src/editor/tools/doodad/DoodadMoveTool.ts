import { Key } from 'ts-key-enum';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import BaseDoodadTool from './BaseDoodadTool';
import Point from '../../../common/Point';
import Input, { MouseButton } from '../../../client/engine/Input';

export default class DoodadMoveTool extends BaseDoodadTool {
    private mouseStart: Point;
    private initialElevation: number;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'doodad-move',
            '- Left click to move the selected doodad.\n'
            + '- Control + left click to select a doodad.',
            'assets/icons/doodad_move.png',
            props, panel,
        );
    }

    public doodadUse(delta: number): void {
        if (Input.isKeyDown(Key.Shift)) {
            const mouseDelta = Point.sub(Input.mousePos(), this.mouseStart);
            this.props.selectedDoodad.def.elevation = this.initialElevation - mouseDelta.y / 100;
        } else {
            this.props.selectedDoodad.def.x = this.props.point.chunk.x;
            this.props.selectedDoodad.def.y = this.props.point.chunk.y;
        }
    }

    public update(delta: number): void {
        super.update(delta);

        // handle height initialisation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.mouseStart = Input.mousePos();
            if (this.props.selectedDoodad) {
                this.initialElevation = this.props.selectedDoodad.def.elevation;
            }
        }
    }
}
