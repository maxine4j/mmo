import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import SliderProp from '../../panelprops/SliderProp';
import { ChunkPoint } from '../../../common/Point';

const numLayers = 3;
const strideRGBA = 4;
const colourChannelMax = 255; // max uint8 - 1
const paintRate = 15;

type ImageData3D = { data: Uint8Array, width: number, height: number, depth: number };

export default class PaintTool extends Tool {
    private brush: Brush;
    public depth: number = 0;
    public strength: number = 1;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'paint',
            '- Paint the selected texture onto the terrain.',
            'assets/icons/terrain_paint.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);

        const layerSlider = new SliderProp(this.propsPanel, 'Layer', 0, numLayers - 1, 1, this.depth,
            (val) => {
                this.depth = val;
            });
        this.propsPanel.addProp(layerSlider);
        this.propsPanel.addBreak();
        const strengthSlider = new SliderProp(this.propsPanel, 'Strength', 0, 1, 0.01, this.strength,
            (val) => {
                this.strength = val;
            });
        this.propsPanel.addProp(strengthSlider);
    }

    public onSelected(): void {
        super.onSelected();
        this.brush.show();
    }

    public onUnselected(): void {
        super.onUnselected();
        this.brush.hide();
    }

    private setGreyscale(img: ImageData3D, layer: number, grey: number, x: number, y: number, w: number, h: number): void {
        const depthOffset = img.width * img.height * layer;

        const endx = x + w;
        const endy = y + h;
        for (let yi = y; yi < endy; yi++) {
            for (let xi = x; xi < endx; xi++) {
                const xyOffset = yi * img.width + xi;
                const idx = (depthOffset + xyOffset) * strideRGBA;
                let val = img.data[idx] + paintRate * grey;
                if (val > colourChannelMax) val = colourChannelMax;
                else if (val < 0) val = 0;
                img.data[idx] = val; // TODO: blend texture only needs one channel, remove GBA
            }
        }
    }

    public directDraw(point: ChunkPoint, layer: number, strength: number): void {
        const texture = point.chunk.material.texture.blend;
        const img = <ImageData3D>texture.image;

        const x = (point.x / point.chunk.size) * img.width;
        const y = (point.y / point.chunk.size) * img.height;
        const w = img.width / point.chunk.size; // width and height so we dont skip points
        const h = img.width / point.chunk.size; // when texture and chunk size dont match

        // paint the strength to the primary layer
        this.setGreyscale(img, layer, strength, x, y, w, h);

        // paint the inverse of the strength to the other layers
        for (let i = 0; i < img.depth; i++) {
            if (i !== layer) {
                this.setGreyscale(img, i, -strength, x, y, w, h);
            }
        }

        // flag the texture to be updated
        texture.needsUpdate = true;
    }

    public use(delta: number): void {
        for (const point of this.brush.pointsIn()) {
            const chunkPoint = point.toChunk();
            this.directDraw(chunkPoint, this.depth, this.strength);
        }
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
