import { Frame } from './Frame';


export default class Panel extends Frame {
    protected element: HTMLDivElement;

    public constructor(id: string, parent: Frame) {
        super(id, 'div', parent);
    }

    public addBreak() {
        const br = document.createElement('br');
        this.element.appendChild(br);
    }
}
