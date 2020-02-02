import Panel from './components/Panel';
import { Frame } from './components/Frame';
import World from '../World';
import Slider from './components/Slider';

export default class Minimap extends Panel {
    private world: World;

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private scale: number = 1;

    public constructor(parent: Frame, world: World) {
        super(parent);

        this.world = world;

        this.style.top = '0';
        this.style.right = '0';
        this.style.backgroundColor = 'rgba(0,0,0,1)';
        this.width = 100;
        this.height = 100;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.element.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.addEventListener('click', this.canvasClick.bind(this));

        const slider = new Slider(this, 1, 10, this.scale, 0.1);
        slider.style.position = 'initial';
        slider.width = this.width;
        slider.addEventListener('input', () => {
            this.scale = slider.value;
        });
    }

    private canvasClick(ev: MouseEvent): void {
        const dx = ev.offsetX;
        const dy = ev.offsetY;
        console.log('Got a minimap click at', dx, dy);
    }

    public update(): void {
        if (this.world.player && this.world.player.position) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clear the canvas

            for (const [ccx, ccy, chunk] of this.world.chunkWorld.chunks) {
                // calculate chunk position
                const dw = this.world.chunkWorld.chunkSize * this.scale;
                const dh = this.world.chunkWorld.chunkSize * this.scale;
                const x = (dw * ccx) + (dw / 2);
                const y = (dh * ccy) + (dh / 2);
                const px = (this.world.player.position.x * this.scale) + dw - this.canvas.width / 2;
                const py = (this.world.player.position.y * this.scale) + dh - this.canvas.height / 2;

                this.ctx.drawImage(chunk.texture.image, x - px, y - py, dw, dh);
            }

            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(this.canvas.width / 2 - 2, this.canvas.height / 2 - 2, 4, 4); // draw player dot
        }
    }
}
