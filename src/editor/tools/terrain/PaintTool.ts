import * as THREE from 'three';
import { text } from 'express';
import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import { Point, ChunkPoint } from '../../../common/Point';
import Input, { MouseButton } from '../../../client/engine/Input';
import Chunk from '../../../client/engine/Chunk';

const chunkTextureSize = 2048;

class ChunkCanvas {
    public chunk: Chunk;
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;

    public texture: THREE.Texture;

    public constructor(chunk: Chunk) {
        this.chunk = chunk;
        this.canvas = document.createElement('canvas');
        this.canvas.width = chunkTextureSize;
        this.canvas.height = chunkTextureSize;
        this.ctx = this.canvas.getContext('2d');
        this.texture = (<THREE.MeshLambertMaterial[]>chunk.terrain.material)[1].alphaMap;
        this.ctx.drawImage(this.texture.image, 0, 0, chunkTextureSize, chunkTextureSize);
        this.texture.image.src = this.canvas.toDataURL();
        this.texture.needsUpdate = true;

        this.canvas.style.width = '128px';
        this.canvas.style.height = '128px';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.right = '0';
        this.canvas.style.zIndex = '99999';
        document.body.append(this.canvas);
    }

    public updateTexture(): void {
        this.texture.image.src = this.canvas.toDataURL();
        this.texture.needsUpdate = true;
    }

    public drawDot(x: number, y: number, w: number = 20, h: number = 20): void {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(x - w / 2, y - h / 2, w, h);
    }
}

export default class PaintTool extends Tool {
    private brush: Brush;
    private canvases: Map<string, ChunkCanvas> = new Map();

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'paint',
            '- Paint the selected texture onto the terrain.',
            'assets/icons/terrain_paint.png',
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
        // draw a dot on the canvas
        const updatedChunks: Set<ChunkCanvas> = new Set();
        for (const point of this.brush.pointsIn()) {
            // get the current chunk canvas
            const chunkPoint = point.toChunk();
            let chunkCanvas = this.canvases.get(chunkPoint.chunk.def.id);
            if (chunkCanvas == null) { // make a new chunk canvas if we dont already have one for this chunk
                chunkCanvas = new ChunkCanvas(chunkPoint.chunk);
                this.canvases.set(chunkPoint.chunk.def.id, chunkCanvas);
            }

            chunkCanvas.drawDot((chunkPoint.x / this.props.world.chunkSize) * chunkTextureSize, (chunkPoint.y / this.props.world.chunkSize) * chunkTextureSize);
            updatedChunks.add(chunkCanvas);
        }

        for (const updated of updatedChunks) {
            updated.updateTexture();
        }


        // for (const point of this.brush.pointsIn()) {
        //     const cp = point.toChunk();

        //     const diff = cp.sub(centre);
        //     diff.x /= cp.chunk.size;
        //     diff.y /= cp.chunk.size;

        //     const idx = (cp.y * (cp.chunk.size + 1)) + cp.x;
        //     const uvBuffer = <THREE.BufferAttribute>(<THREE.BufferGeometry>cp.chunk.terrain.geometry).attributes.uv;

        //     // calc new uv
        //     const uv = this.textSrc.add(diff.toNaive());

        //     uvBuffer.setXY(idx, uv.x, uv.y);
        //     uvBuffer.needsUpdate = true;
        // }
    }

    public update(delta: number): void {
        super.update(delta);
        this.brush.update();
    }
}
