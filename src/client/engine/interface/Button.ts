import { Frame } from './Frame';


export default class Button extends Frame {
    protected element: HTMLButtonElement;

    constructor(id: string, parent: Frame, text: string) {
        super(id, 'button', parent);
        this.text = text;
    }

    get text(): string {
        return this.element.textContent;
    }
    set text(text: string) {
        this.element.textContent = text;
    }
}
