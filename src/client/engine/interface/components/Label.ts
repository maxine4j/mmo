import { Frame } from './Frame';


export default class Label extends Frame {
    protected element: HTMLLabelElement;

    public constructor(parent: Frame, text: string) {
        super('label', parent);
        this.text = text;
        this.style.fontFamily = 'Arial';
    }

    public get text(): string {
        return this.element.textContent;
    }
    public set text(text: string) {
        this.element.textContent = text;
    }
}
