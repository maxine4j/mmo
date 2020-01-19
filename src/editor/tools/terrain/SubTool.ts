import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Chunk from '../../../client/engine/Chunk';

export default class SubTool extends Tool {
    private brush: Brush;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'sub',
            '- Decrease height of terrain in the brush with left click.',
            'assets/icons/terrain_sub.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);
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
                cp.elevation -= 1 * delta;
                this.props.world.updateMeshAtPoint(cp);
                uniqueChunks.add(cp.chunk);
            }
        }
        for (const chunk of uniqueChunks) chunk.updateTerrain();
        this.props.world.updateDoodads();
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
