import Tool from '../Tool';
import Brush from '../Brush';
import EditorProps from '../EditorProps';
import ToolPanel from '../ToolPanel';

export default class AddTool extends Tool {
    private brush: Brush;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super('add', 'assets/icons/terrain_add.png', props, panel);
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);
    }

    public onSelected() {
        super.onSelected();
        this.brush.show();
    }

    public onUnselected() {
        super.onUnselected();
        this.brush.hide();
    }

    public use(delta: number) {
        this.brush.pointsIn(this.props.chunk.chunk.def).forEach((p) => {
            this.props.chunk.incHeight(p, 1 * delta);
        });
        this.props.chunk.updateMesh();
        this.props.chunk.updateDoodads();
    }

    public update(delta: number) {
        this.brush.update();
    }
}
