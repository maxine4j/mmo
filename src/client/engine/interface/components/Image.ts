import { Frame } from './Frame';


export default class Image extends Frame {
    protected element: HTMLImageElement;

    public constructor(id: string, parent: Frame, src: string) {
        super(id, 'img', parent);
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
