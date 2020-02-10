import { EventEmitter } from 'events';
import Panel from './components/Panel';
import { Frame } from './components/Frame';
import World from '../World';
import Slider from './components/Slider';
import { TilePoint, Point } from '../../../common/Point';
import LocalPlayer from '../LocalPlayer';
import MinimapOrb from './MinimapOrb';
import LocalUnit from '../LocalUnit';
import LocalGroundItem from '../LocalGroundItem';
import TerrainMaterial, { ImageData3D } from '../graphics/materials/TerrainMaterial';

type MinimapEvent = 'click';

const minimapBorder = 5;
const minimapSize = 256;

export default class Minimap extends Panel {
    private eventEmitter: EventEmitter = new EventEmitter();
    private world: World;

    private orbPanel: Panel;
    private orbs: MinimapOrb[] = [];

    private units: Map<string, LocalUnit> = new Map();
    private groundItems: Map<string, LocalGroundItem> = new Map();

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private flag: HTMLImageElement;
    private flagPos: TilePoint;

    private dotSize = 4;
    private flagSize = 16;
    private scale: number = 2;

    public constructor(parent: Frame, world: World) {
        super(parent);

        this.world = world;

        this.style.top = '0';
        this.style.right = '0';
        this.width = minimapSize + minimapBorder * 2;
        this.height = minimapSize + minimapBorder * 2;
        this.clickThrough = true;
        this.style.borderRadius = '100%';

        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'initial';
        this.canvas.width = minimapSize;
        this.canvas.height = minimapSize;
        // this.canvas.style.borderRadius = '100%';
        this.canvas.style.border = `${minimapBorder}px solid rgba(255, 255, 255, 0.8)`;
        this.element.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.addEventListener('click', this.canvasClick.bind(this));

        const slider = new Slider(this, 2, 10, this.scale, 0.1);
        slider.style.position = 'initial';
        slider.width = this.width;
        slider.addEventListener('input', () => {
            this.scale = slider.value;
        });

        this.flag = new Image();
        this.flag.src = 'assets/imgs/flag.png';

        this.world.player.on('moveTargetUpdated', (self: LocalPlayer, target: TilePoint) => {
            this.flagPos = target;
        });

        this.orbPanel = new Panel(this);
        this.orbPanel.style.position = 'initital';
    }

    public on(event: MinimapEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: MinimapEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    private emit(event: MinimapEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public trackUnit(unit: LocalUnit): void {
        this.units.set(unit.data.id, unit);
    }

    public untrackUnit(id: string): void {
        this.units.delete(id);
    }

    public trackGrounItem(gi: LocalGroundItem): void {
        this.groundItems.set(gi.def.item.uuid, gi);
    }

    public untrackGroundItem(gi: LocalGroundItem): void {
        this.groundItems.delete(gi.def.item.uuid);
    }

    public addOrb(orb: MinimapOrb): void {
        this.orbPanel.addChild(orb);
        this.orbs.push(orb);
    }

    private canvasClick(ev: MouseEvent): void {
        // get mouse click as ratio of canvas width and height
        const dx = ev.offsetX / this.canvas.width;
        const dy = ev.offsetY / this.canvas.height;
        // get number of tiles that fit on the minimap canvas with the current scale
        const tileW = this.canvas.width / this.scale;
        const tileH = this.canvas.height / this.scale;
        // get the top left tile
        const topLeftTileX = this.world.player.position.x - tileW / 2;
        const topLeftTileY = this.world.player.position.y - tileH / 2;
        // use the mouse click ratio to find the tile that was clicked
        const tx = topLeftTileX + tileW * dx;
        const ty = topLeftTileY + tileH * dy;

        this.emit('click', this, new TilePoint(tx, ty, this.world.chunkWorld));
    }

    private tileToMinimap(pos: TilePoint): Point {
        return new Point(
            ((pos.x - this.world.player.position.x) * this.scale) + this.world.chunkWorld.chunkSize,
            ((pos.y - this.world.player.position.y) * this.scale) + this.world.chunkWorld.chunkSize,
        );
    }

    private drawDot(pos: Point, colour: string, size: number = this.dotSize): void {
        this.ctx.fillStyle = colour;
        this.ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);
    }

    private xcanvas = document.createElement('canvas');
    private xctx = this.xcanvas.getContext('2d');

    private xxcanvas = document.createElement('canvas');
    private xxctx = this.xxcanvas.getContext('2d');

    private getAlphaFromBlend(diffuse: ImageData3D, blend: ImageData3D, layer: number, x: number, y: number): number {
        // scale index
        const bx = Math.floor((blend.width / diffuse.width) * x);
        const by = Math.floor((blend.height / diffuse.height) * y);
        const depthOffset = blend.width * blend.height * 4 * layer;
        const idx = (by * blend.width + bx) * 4;
        return blend.data[depthOffset + idx];
    }

    private blendTerrain(mat: TerrainMaterial, dw: number, dh: number): CanvasImageSource {
        const diffuseImg = <ImageData3D>mat.texture.diffuse.image;
        const blendImg = <ImageData3D>mat.texture.blend.image;
        const strideRGBA = 4;

        this.xcanvas.width = diffuseImg.width;
        this.xcanvas.height = diffuseImg.height;
        this.xxcanvas.width = diffuseImg.width;
        this.xxcanvas.height = diffuseImg.height;
        this.xctx.clearRect(0, 0, this.xcanvas.width, this.xcanvas.height);
        this.xxctx.clearRect(0, 0, this.xcanvas.width, this.xcanvas.height);

        // build an image data for each layer, with blend map applied to alpha channel
        for (let layer = 0; layer < mat.texture.layerIDs.length - 1; layer++) {
            const depthOffset = diffuseImg.width * diffuseImg.height * strideRGBA * layer;
            const data = new ImageData(diffuseImg.width, diffuseImg.height);
            // get layer image with alpha
            for (let yi = 0; yi < diffuseImg.height; yi++) {
                for (let xi = 0; xi < diffuseImg.width; xi++) {
                    const idx = (yi * diffuseImg.width + xi) * strideRGBA;
                    data.data[idx] = diffuseImg.data[depthOffset + idx];
                    data.data[idx + 1] = diffuseImg.data[depthOffset + idx + 1];
                    data.data[idx + 2] = diffuseImg.data[depthOffset + idx + 2];
                    if (layer === 0) data.data[idx + 3] = 255;
                    else data.data[idx + 3] = this.getAlphaFromBlend(diffuseImg, blendImg, layer, xi, yi);
                }
            }
            // draw image to the canvas
            this.xxctx.putImageData(data, 0, 0);
            this.xctx.drawImage(this.xxcanvas, 0, 0);
        }

        // draw each layer to a canvas

        // send canvas to main draw functioasn

        return this.xcanvas;
    }

    public draw(): void {
        if (this.world.player && this.world.player.position) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clear the canvas

            const dw = this.world.chunkWorld.chunkSize * this.scale;
            const dh = this.world.chunkWorld.chunkSize * this.scale;
            const px = (this.world.player.position.x * this.scale) + dw - this.canvas.width / 2;
            const py = (this.world.player.position.y * this.scale) + dh - this.canvas.height / 2;

            for (const [ccx, ccy, chunk] of this.world.chunkWorld.chunks) {
                if (chunk) {
                    // calculate chunk position
                    const x = (dw * ccx) + (dw / 2);
                    const y = (dh * ccy) + (dh / 2);
                    // TODO: need a function that will paint texture to canvas2d using blend map as alpha
                    this.ctx.drawImage(this.blendTerrain(chunk.material, dw, dh), x - px, y - py, dw, dh);
                }
            }

            // draw unit dots
            this.ctx.fillStyle = 'yellow';
            for (const [_, unit] of this.units) {
                const upos = this.tileToMinimap(unit.position);
                this.drawDot(upos, unit.isPlayer ? 'white' : 'yellow');
            }

            // draw ground item dots
            for (const [_, gi] of this.groundItems) {
                const gipos = this.tileToMinimap(gi.position);
                this.drawDot(gipos, 'red');
            }

            // draw player dot
            this.drawDot(new Point(this.canvas.width / 2, this.canvas.width / 2), 'white', 6);

            // draw flag
            if (this.flagPos) {
                const fpos = this.tileToMinimap(this.flagPos);
                this.ctx.drawImage(this.flag, fpos.x - this.flagSize / 2, fpos.y - this.flagSize, this.flagSize, this.flagSize);
            }
        }
    }
}
