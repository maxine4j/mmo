import { EventEmitter } from 'events';
import { AtlasAssetDef } from './AssetDef';
import AtlasSprite from '../interface/components/AtlasSprite';
import { Frame } from '../interface/components/Frame';

type SpriteAtlasEvent = 'loaded' | 'error';

export default class SpriteAtlas {
    private eventEmitter: EventEmitter = new EventEmitter();
    private _loaded: boolean = false;
    private def: AtlasAssetDef;
    private atlas: HTMLImageElement;

    public get width(): number { return this.atlas.width; }
    public get height(): number { return this.atlas.height; }
    public get src(): string { return this.atlas.src; }
    public get loaded(): boolean { return this._loaded; }

    public constructor(def: AtlasAssetDef) {
        this.def = def;
        this.atlas = new Image();
        this.atlas.src = this.def.src;
        this.atlas.addEventListener('load', () => {
            this._loaded = true;
            this.emit('loaded', this);
        });
    }

    public on(event: SpriteAtlasEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: SpriteAtlasEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    private emit(event: SpriteAtlasEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public getSprite(id: string, parent: Frame): AtlasSprite {
        const spriteDef = this.def.sprites[id];
        if (spriteDef == null) {
            return new AtlasSprite(parent, this, {
                x: 0, y: 0, w: 0, h: 0,
            });
        }
        return new AtlasSprite(parent, this, spriteDef.src);
    }
}
