import { Key } from 'ts-key-enum';
import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Input from '../../../client/engine/Input';
import SliderProp from '../../panelprops/SliderProp';

export default class SetTool extends Tool {
    private brush: Brush;
    private _height: number = 0;
    private heightSlider: SliderProp;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'set',
            '- Set height of height in the brush to a constant value.\n'
            + '- Change this value with the property panel or hold alt to pick the height of the tile under the cursor.',
            'assets/icons/terrain_set.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);
        this.heightSlider = new SliderProp(this.propsPanel, 'Height: ', -5, 15, 0.01, this.height,
            (value) => {
                this.height = value;
            });
        this.propsPanel.addProp(this.heightSlider);
    }

    private get height(): number { return this._height; }
    private set height(height: number) {
        this._height = height;
        this.heightSlider.value = height;
    }

    public onSelected(): void {
        super.onSelected();
        this.brush.show();
    }

    public onUnselected(): void {
        super.onUnselected();
        this.brush.hide();
    }

    public use(delta: number): void {
        this.brush.pointsIn(this.props.chunk.chunk.def).forEach((p) => {
            this.props.chunk.setHeight(p, this.height);
        });
        this.props.chunk.updateMesh();
        this.props.chunk.updateDoodads();
    }

    public update(delta: number): void {
        this.brush.update();
        if (Input.isKeyDown(Key.Alt)) {
            this.height = this.props.world.getElevation(this.props.point.tile);
        }
    }
}
