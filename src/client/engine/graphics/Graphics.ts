export default class Graphics {
    private static _canvas: HTMLCanvasElement;
    private static _context: CanvasRenderingContext2D;

    public static init() {
        Graphics._canvas = <HTMLCanvasElement>document.getElementById('canvas');
        Graphics._context = Graphics._canvas.getContext('2d');
        window.addEventListener('resize', () => { Graphics.windowResize(); });
        Graphics.windowResize();
    }

    private static windowResize() {
        Graphics._canvas.width = window.innerWidth;
        Graphics._canvas.height = window.innerHeight;
        Graphics.context.fillStyle = 'black';
        Graphics.context.fillRect(0, 0, Graphics.viewportWidth, Graphics.viewportHeight);
    }

    public static get viewportWidth(): number {
        return Graphics._canvas.width;
    }

    public static get viewportHeight(): number {
        return Graphics._canvas.height;
    }

    public static get context(): CanvasRenderingContext2D {
        return Graphics._context;
    }

    public static calcFPS(delta: number): number {
        return 1 / (delta / 1000);
    }
}
