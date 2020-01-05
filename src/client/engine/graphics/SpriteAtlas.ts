import Rect from './Rect';
import Sprite from './Sprite';

export default class SpriteAtlas {
    private atlas: Sprite;
    private _sprites: Map<string, Sprite>

    public constructor(atlas: Sprite, sources: [string, Rect][]) {
        this._sprites = new Map();
        this.atlas = atlas;
        for (const [key, source] of sources) {
            this._sprites.set(key, new Sprite(this.atlas.bitmap, source));
        }
    }

    public get sprites(): Map<string, Sprite> {
        return this._sprites;
    }

    public get(key: string): Sprite {
        return this._sprites.get(key);
    }
}
