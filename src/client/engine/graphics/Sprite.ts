import Graphics from './Graphics';
import Rect from './Rect';

export default class Sprite {
    private src: string;
    public bitmap: ImageBitmap;

    public constructor(src?: ImageBitmap, source?: Rect) {
        // create a sprite from an existing ImageBitmap
        if (source) {
            // create the bitmap with a source
            createImageBitmap(src, source.x, source.y, source.width, source.height).then((val: ImageBitmap) => {
                this.bitmap = val;
            });
        }
        if (src) {
            // create the bitmap from the entire image
            this.bitmap = src;
        }
    }

    public static fromUrl(src: string, source?: Rect): Promise<Sprite> {
        return new Promise((resolve, reject) => {
            // create a sprite from a url
            const img = new Image();
            img.src = src;
            img.onload = () => {
                if (source) {
                    // create the bitmap with a source
                    createImageBitmap(img, source.x, source.y, source.width, source.height).then((val: ImageBitmap) => {
                        resolve(new Sprite(val));
                    });
                } else {
                    // create the bitmap from the entire image
                    createImageBitmap(img).then((val: ImageBitmap) => {
                        resolve(new Sprite(val));
                    });
                }
            };
        });
    }

    public draw(dest: Rect, source?: Rect) {
        if (this.bitmap) {
            if (source) {
                Graphics.context.drawImage(this.bitmap,
                    dest.x, dest.y, dest.width, dest.height,
                    source.x, source.y, source.width, source.height);
            } else {
                Graphics.context.drawImage(this.bitmap,
                    dest.x, dest.y, dest.width, dest.height);
            }
        }
    }
}
