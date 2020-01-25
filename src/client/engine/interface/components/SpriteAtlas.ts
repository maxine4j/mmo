export default class SpriteAtlas {
    private atlas: HTMLImageElement;

    public get width(): number { return this.atlas.width; }
    public get height(): number { return this.atlas.height; }
    public get src(): string { return this.atlas.src; }

    public constructor(src: string) {
        this.atlas = new Image();
        this.atlas.src = src;
    }
}
