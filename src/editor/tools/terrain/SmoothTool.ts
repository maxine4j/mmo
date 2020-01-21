import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import SliderProp from '../../panelprops/SliderProp';
import Chunk from '../../../client/engine/Chunk';

export default class SmoothTool extends Tool {
    private brush: Brush;
    private strength: number = 0.5;
    private strengthSlider: SliderProp;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'smooth',
            '- Smooths terrain in the brush.\n'
            + '- Change strength in the property panel to adjust the strength of smoothing.',
            'assets/icons/terrain_smooth.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);
        this.strengthSlider = new SliderProp(this.propsPanel, 'Strength: ', 0, 1, 0.01, this.strength,
            (value) => {
                this.strength = value;
            });
        this.propsPanel.addProp(this.strengthSlider);
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
        const uniqueChunks: Set<Chunk> = new Set();
        for (const tp of this.brush.pointsIn()) {
            const cp = tp.toChunk();
            if (cp) {
                this.props.world.smooth(tp, this.strength);
                this.props.world.updateMeshAtPoint(cp);
                uniqueChunks.add(cp.chunk);
            }
        }
        for (const chunk of uniqueChunks) {
            chunk.stitch();
            chunk.positionDoodads();
        }
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
