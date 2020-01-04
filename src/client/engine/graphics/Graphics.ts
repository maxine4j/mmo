export default class Graphics {
    private static _canvas: HTMLCanvasElement;
    private static _context: CanvasRenderingContext2D;

    public static init() {
        this._canvas = <HTMLCanvasElement>document.getElementById('canvas');
        this._context = this._canvas.getContext('2d');
        window.addEventListener('resize', () => { this.windowResize(); });
        this.windowResize();
    }

    private static windowResize() {
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    public static get viewportWidth(): number {
        return this._canvas.width;
    }

    public static get viewportHeight(): number {
        return this._canvas.height;
    }

    public static get context(): CanvasRenderingContext2D {
        return this._context;
    }

    public static calcFPS(delta: number): number {
        return 1 / (delta / 1000);
    }
}
