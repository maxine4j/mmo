import { DataTexture2DArray } from 'three/src/textures/DataTexture2DArray';
import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import Chunk from '../../../client/engine/Chunk';
import SliderProp from '../../panelprops/SliderProp';

const blendTextureSize = 256;
const numLayers = 3;

let lastZIndex = 1;

type ImageData3D = { data: Uint8Array, width: number, height: number, depth: number };

class ChunkCanvas {
    public chunk: Chunk;
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public blendTexture: DataTexture2DArray;
    public blendImage: ImageData3D;

    public paintTool: PaintTool;

    public constructor(tool: PaintTool, chunk: Chunk) {
        this.paintTool = tool;
        this.chunk = chunk;
        this.canvas = document.createElement('canvas');

        this.canvas.width = blendTextureSize; // TODO: should get from loaded texture
        this.canvas.height = blendTextureSize;
        this.ctx = this.canvas.getContext('2d');

        this.blendTexture = chunk.material.texture.blend;
        this.blendImage = this.blendTexture.image;

        this.updateCanvas();

        this.canvas.style.width = '128px';
        this.canvas.style.height = '128px';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.right = '0';
        this.canvas.style.zIndex = '0';
        document.body.append(this.canvas);
    }

    public updateCanvas(): void {
        const imgData = this.ctx.createImageData(this.blendImage.width, this.blendImage.height);
        const size = this.blendImage.width * this.blendImage.height;
        const stride = 4; // RGBA stride
        const depthOffset = size * stride * this.paintTool.depth;
        for (let i = 0; i < size * stride; i++) {
            imgData.data[i] = this.blendImage.data[depthOffset + i];
        }
        this.ctx.putImageData(imgData, 0, 0);
    }

    public updateTexture(): void {
        const size = this.blendImage.width * this.blendImage.height;
        const stride = 4; // RGBA stride
        const depthOffset = size * stride * this.paintTool.depth;
        const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < size * stride; i++) {
            this.blendImage.data[depthOffset + i] = imgData.data[i];
        }
        this.blendTexture.needsUpdate = true;
    }

    public drawDot(x: number, y: number, w: number = 1, h: number = 1): void {
        this.ctx.fillStyle = `rgb(${this.paintTool.strength * 255},${this.paintTool.strength * 255},${this.paintTool.strength * 255})`;
        this.ctx.fillRect(x - w / 2, y - h / 2, w, h);
        this.canvas.style.zIndex = `${lastZIndex++}`;
    }
}

export default class PaintTool extends Tool {
    private brush: Brush;
    private canvases: Map<string, ChunkCanvas> = new Map();

    public depth: number;
    public strength: number;

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'paint',
            '- Paint the selected texture onto the terrain.',
            'assets/icons/terrain_paint.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);

        const layerSlider = new SliderProp(this.propsPanel, 'Layer', 0, numLayers - 1, 1, 0,
            (val) => {
                this.depth = val;
                for (const [_, c] of this.canvases) {
                    c.updateCanvas();
                }
            });
        this.propsPanel.addProp(layerSlider);
        const strengthSlider = new SliderProp(this.propsPanel, 'Strength', 0, 1, 0.01, 1,
            (val) => {
                this.strength = val;
                for (const [_, c] of this.canvases) {
                    c.updateCanvas();
                }
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

    public use(delta: number): void {
        // draw a dot on the canvas
        const updatedChunks: Set<ChunkCanvas> = new Set();
        for (const point of this.brush.pointsIn()) {
            // get the current chunk canvas
            const chunkPoint = point.toChunk();
            let chunkCanvas = this.canvases.get(chunkPoint.chunk.def.id);
            if (chunkCanvas == null) { // make a new chunk canvas if we dont already have one for this chunk
                chunkCanvas = new ChunkCanvas(this, chunkPoint.chunk);
                this.canvases.set(chunkPoint.chunk.def.id, chunkCanvas);
            }

            chunkCanvas.drawDot((chunkPoint.x / this.props.world.chunkSize) * blendTextureSize, (chunkPoint.y / this.props.world.chunkSize) * blendTextureSize);
            updatedChunks.add(chunkCanvas);
        }

        for (const updated of updatedChunks) {
            updated.updateTexture();
        }
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
