import Graphics from './Graphics';

export default class Sprite {
    private src: string;
    private bitmap: ImageBitmap;

    public constructor(src: string, sx?: number, sy?: number, sw?: number, sh?: number) {
        this.src = src;
        const img = new Image();
        img.src = this.src;
        img.onload = () => {
            if (sh) {
                createImageBitmap(img, sx, sy, sw, sh).then((val: ImageBitmap) => {
                    this.bitmap = val;
                });
            } else {
                createImageBitmap(img).then((val: ImageBitmap) => {
                    this.bitmap = val;
                });
            }
        };
    }

    public draw(dx: number, dy: number, dw?: number, dh?: number, sx?: number, sy?: number, sw?: number, sh?: number) {
        if (this.bitmap) {
            // TODO: how does this effect performance
            if (dh === undefined) { // draw with just dest coords
                Graphics.context.drawImage(this.bitmap,
                    Math.floor(dx), Math.floor(dy));
            } else if (sx === undefined) { // draw with dest width and height
                Graphics.context.drawImage(this.bitmap,
                    Math.floor(dx), Math.floor(dy),
                    Math.floor(dw), Math.floor(dh));
            } else { // draw with source
                Graphics.context.drawImage(this.bitmap,
                    Math.floor(dx), Math.floor(dy),
                    Math.floor(dw), Math.floor(dh),
                    Math.floor(sx), Math.floor(sy),
                    Math.floor(sw), Math.floor(sh));
            }
        }
    }
}
