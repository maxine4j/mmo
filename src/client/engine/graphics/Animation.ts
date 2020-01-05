import Rect from './Rect';
import Sprite from './Sprite';
import SpriteAtlas from './SpriteAtlas';

interface FrameSourceDef {
    x: number,
    y: number,
    width: number,
    height: number,
}

interface FrameDef {
    source: FrameSourceDef;
    duration: number;
}

interface AnimationDef {
    frames: FrameDef[];
}

interface Frame {
    sprite: Sprite;
    duration: number;
}

export default class Animation {
    private atlas: SpriteAtlas;
    private frames: Frame[];
    private elapsed: number = 0;
    private currentFrameIdx: number = 0;
    public speed: number = 1;

    public constructor(def: AnimationDef, atlas: Sprite) {
        // build ources with keys 0 through frames.length from def sources
        const sources: [string, Rect][] = [];
        for (let i = 0; i < def.frames.length; i++) {
            const src = def.frames[i].source;
            sources.push([i.toString(), new Rect(src.x, src.y, src.width, src.height)]);
        }

        // make a new atlas with the sources
        this.atlas = new SpriteAtlas(atlas, sources);

        // build frames array from atlas
        this.frames = [];
        for (let i = 0; i < def.frames.length; i++) {
            this.frames.push({ duration: def.frames[i].duration, sprite: this.atlas.get(i.toString()) });
        }
    }

    private get current(): Frame {
        if (this.frames) {
            return this.frames[this.currentFrameIdx];
        }
        return null;
    }

    private advance() {
        this.currentFrameIdx++;
        if (this.currentFrameIdx >= this.frames.length * this.speed) {
            // reset back to frame 0
            this.currentFrameIdx = 0;
        }
    }

    public update(delta: number) {
        // update the elapsed time since last frame
        this.elapsed += delta;

        if (this.current && this.elapsed > this.current.duration) {
            // advance the frame
            this.elapsed -= this.current.duration; // should this reset to 0?
            this.advance();
        }
    }

    public draw(dest: Rect, source?: Rect) {
        if (this.current) {
            this.current.sprite.draw(dest, source);
        }
    }
}
