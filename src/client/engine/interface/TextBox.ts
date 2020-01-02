import { Frame } from './Frame';


export default class TextBox extends Frame {
    protected element: HTMLInputElement;

    constructor(id: string, parent: Frame) {
        super(id, 'input', parent);
        this.element.type = 'text';
    }

    get text(): string {
        return this.element.value;
    }
    set text(text: string) {
        this.element.value = text;
    }

    get placeholder(): string {
        return this.element.placeholder;
    }
    set placeholder(text: string) {
        this.element.placeholder = text;
    }
}
