import Panel from './components/Panel';
import { Frame } from './components/Frame';
import World from '../World';
import { TilePoint } from '../../../common/Point';

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
        this.width = this.world.chunkWorld.chunkSize * 2;
        this.height = this.world.chunkWorld.chunkSize * 2;

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.element.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    public update(): void {
        if (this.world.player && this.world.player.position) {
            this.ctx.clearRect(0, 0, 200, 200); // clear the canvas
            const chunkSize = this.world.chunkWorld.chunkSize; // size of the chunks to render on the minimap
            const playerPos = this.world.player.position; // the players positon to centre the minimap on

            for (const [ccx, ccy, chunk] of this.world.chunkWorld.chunks) {
                // TODO: only works with 2x scale
                const x = (((chunkSize * ccx) + (chunkSize / 2) - playerPos.x) * this.scale) - ((chunkSize / 2) * this.scale);
                const y = (((chunkSize * ccy) + (chunkSize / 2) - playerPos.y) * this.scale) - ((chunkSize / 2) * this.scale);

                this.ctx.drawImage(chunk.texture.image, x, y, chunkSize * this.scale, chunkSize * this.scale);
            }

            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(this.canvas.width / 2 - 2, this.canvas.height / 2 - 2, 4, 4); // draw player dot
        }
    }
}
