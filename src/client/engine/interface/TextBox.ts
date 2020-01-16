import { Frame } from './Frame';


export default class TextBox extends Frame {
    protected element: HTMLInputElement;

    public constructor(id: string, parent: Frame, type: string = 'text') {
        super(id, 'input', parent);
        this.element.type = type;
    }

    public get text(): string { return this.element.value; }
    public set text(text: string) { this.element.value = text; }

    public get step(): number { return Number(this.element.step); }
    public set step(step: number) { this.element.step = step.toString(); }

    public get type(): string { return this.element.type; }
    public set type(type: string) { this.element.type = type; }

    public get placeholder(): string { return this.element.placeholder; }
    public set placeholder(text: string) { this.element.placeholder = text; }
}
