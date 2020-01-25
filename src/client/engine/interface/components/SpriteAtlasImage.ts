import { Frame } from './Frame';
import SpriteAtlas from './SpriteAtlas';
import Rectangle from '../../../../common/Rectangle';

export default class SpriteAtlasImage extends Frame {
    protected element: HTMLDivElement;
    private atlas: SpriteAtlas;
    private src: Rectangle;
    private _width: number;
    private _height: number;

    public constructor(parent: Frame, atlas: SpriteAtlas, src: Rectangle) {
        super('div', parent);
        this.atlas = atlas;
        this.src = src;

        this._width = src.w;
        this.style.width = `${src.w}px`;
        this._height = src.h;
        this.style.height = `${src.h}px`;
        this.style.backgroundImage = `url('${atlas.src}')`;
        this.updateSizePos();
    }

    private updateSizePos(): void {
        this.style.backgroundPosition = `-${this.src.x * (this._width / this.src.w)}px -${this.src.y * (this._height / this.src.h)}px`;
        this.style.backgroundSize = `${(this._width / this.src.w) * this.atlas.width}px ${(this._height / this.src.h) * this.atlas.height}px`;
    }

    public set width(w: number) {
        this._width = w;
        this.style.width = `${w}px`;
        this.updateSizePos();
    }

    public set height(h: number) {
        this._height = h;
        this.style.height = `${h}px`;
        this.updateSizePos();
    }
}
