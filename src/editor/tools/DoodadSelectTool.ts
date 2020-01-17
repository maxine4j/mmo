import Tool from '../Tool';
import EditorProps from '../EditorProps';
import ToolPanel from '../ToolPanel';
import Input, { MouseButton } from '../../client/engine/Input';
import Doodad from '../../client/engine/Doodad';
import Graphics from '../../client/engine/graphics/Graphics';

export default class DoodadSelectTool extends Tool {
    private _selected: Doodad;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super('doodad', 'assets/icons/doodad_select.png', props, panel);
    }

    public onSelected(): void {
        super.onSelected();
    }

    public onUnselected(): void {
        super.onUnselected();
    }

    private get selected(): Doodad { return this._selected; }
    private set selected(doodad: Doodad) {
        this._selected = doodad;
        Graphics.setOutlines([this.selected.model.obj]);
    }

    public use(delta: number): void {
        // if (this.selected) {
        //     this.selected.def.x = this.props.point.chunk.x;
        //     this.selected.def.y = this.props.point.chunk.y;
        //     console.log('Set selected to:', this.props.point.tile);

        //     this.props.chunk.updateDoodads();
        // }
    }

    public update(delta: number): void {
        if (Input.wasMousePressed(MouseButton.LEFT)) {
            const intersects = this.props.camera.rcast(this.props.scene, Input.mousePos(), true);
            for (const ints of intersects) {
                if (ints.object.userData.doodad) {
                    this.selected = ints.object.userData.doodad;
                    break;
                }
            }
        }
    }
}
