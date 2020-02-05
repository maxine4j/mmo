import * as THREE from 'three';
import { text } from 'express';
import Tool from '../../Tool';
import Brush from '../../Brush';
import EditorProps from '../../EditorProps';
import ToolPanel from '../../ToolPanel';
import { Point, ChunkPoint } from '../../../common/Point';
import Input, { MouseButton } from '../../../client/engine/Input';
import Chunk from '../../../client/engine/Chunk';

export default class PaintTool extends Tool {
    private brush: Brush;

    private lastPos: ChunkPoint;
    private lastChunk: Chunk;

    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');

    public constructor(props: EditorProps, panel: ToolPanel) {
        super(
            'paint',
            '- Paint the selected texture onto the terrain.',
            'assets/icons/terrain_paint.png',
            props, panel,
        );
        this.brush = new Brush(this.props);
        this.addBrushSizeProp(this.brush);

        this.canvas.width = 128;
        this.canvas.height = 128;

        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.right = '0';
        this.canvas.style.zIndex = '999999';
        document.body.append(this.canvas);
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
        // get the current chunk
        const chunk = this.brush.point.toChunk().chunk;

        // get 2 points to draw a line between
        const nextPos = this.brush.point.toChunk();
        if (this.lastPos == null || chunk !== this.lastChunk) {
            // if we change chunk then start from a point on the new chunk
            this.lastPos = nextPos;
        }

        // draw the current chunks texture to the canvas
        const tex = (<THREE.MeshLambertMaterial>chunk.terrain.material).map;
        this.ctx.drawImage(tex.image, 0, 0, 128, 128);

        // draw the line on the canvas
        this.ctx.beginPath();
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = 'red';
        this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
        this.ctx.lineTo(nextPos.x, nextPos.y);
        this.ctx.stroke();

        // update last chunk and last pos
        this.lastPos = nextPos;
        this.lastChunk = chunk;

        // tell the terrain material to update
        tex.image.src = this.canvas.toDataURL();
        tex.needsUpdate = true;


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

        // if we mouse up we will need a new last pos
        if (!Input.isMouseDown(MouseButton.LEFT)) {
            this.lastPos = null;
        }
    }
}
