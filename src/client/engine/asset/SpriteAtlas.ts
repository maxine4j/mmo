import { EventEmitter } from 'events';
import { AtlasAssetDef } from './AssetDef';
import AtlasSprite from '../interface/components/AtlasSprite';
import { Frame } from '../interface/components/Frame';

declare interface SpriteAtlas {
    emit(event: 'loaded', self: SpriteAtlas): boolean;
    emit(event: 'error', self: SpriteAtlas): boolean;

    on(event: 'loaded', listener: (self: SpriteAtlas) => void): this;
    on(event: 'error', listener: (self: SpriteAtlas) => void): this;
}

class SpriteAtlas extends EventEmitter {
    private _loaded: boolean = false;
    private def: AtlasAssetDef;
    private atlas: HTMLImageElement;

    public get width(): number { return this.atlas.width; }
    public get height(): number { return this.atlas.height; }
    public get src(): string { return this.atlas.src; }
    public get loaded(): boolean { return this._loaded; }

    public constructor(def: AtlasAssetDef) {
        super();
        this.def = def;
        this.atlas = new Image();
        this.atlas.src = this.def.src;
        this.atlas.addEventListener('load', () => {
            this._loaded = true;
            this.emit('loaded', this);
        });
    }

    public getSprite(id: string, parent: Frame): AtlasSprite {
        const spriteDef = this.def.sprites[id];
        if (spriteDef == null) {
            console.log('Sprite not found:', id);
            return new AtlasSprite(parent, this, {
                x: 0, y: 0, w: 0, h: 0,
            });
        }
        return new AtlasSprite(parent, this, spriteDef.src);
    }
}

export default SpriteAtlas;
