import { Frame } from './Frame';


export default class ImageFrame extends Frame {
    protected element: HTMLImageElement;

    public constructor(parent: Frame, src: string) {
        super('img', parent);
        this.element.src = src;
        this.element.draggable = false;
    }

    public get src(): string {
        return this.element.src;
    }
    public set src(src: string) {
        this.element.src = src;
    }
}
