import { Frame } from './Frame';


export default class Panel extends Frame {
    protected element: HTMLDivElement;

    public constructor(parent: Frame) {
        super('div', parent);
    }

    public addBreak(): void {
        const br = document.createElement('br');
        this.element.appendChild(br);
    }
}
