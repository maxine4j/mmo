import { Frame } from './Frame';


export default class Button extends Frame {
    protected element: HTMLButtonElement;

    public constructor(id: string, parent: Frame, text: string) {
        super(id, 'button', parent);
        this.text = text;
    }

    public get text(): string {
        return this.element.textContent;
    }
    public set text(text: string) {
        this.element.textContent = text;
    }
}
