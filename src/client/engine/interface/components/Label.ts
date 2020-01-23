import { Frame } from './Frame';


export default class Label extends Frame {
    protected element: HTMLLabelElement;

    public constructor(id: string, parent: Frame, text: string) {
        super(id, 'label', parent);
        this.text = text;
    }

    public get text(): string {
        return this.element.textContent;
    }
    public set text(text: string) {
        this.element.textContent = text;
    }
}
