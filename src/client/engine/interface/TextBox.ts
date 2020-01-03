import { Frame } from './Frame';


export default class TextBox extends Frame {
    protected element: HTMLInputElement;

    public constructor(id: string, parent: Frame, type: string = 'text') {
        super(id, 'input', parent);
        this.element.type = type;
    }

    public get text(): string {
        return this.element.value;
    }
    public set text(text: string) {
        this.element.value = text;
    }

    public get placeholder(): string {
        return this.element.placeholder;
    }
    public set placeholder(text: string) {
        this.element.placeholder = text;
    }
}
