import Frame from './frame';


export default class Label extends Frame {
    protected element: HTMLLabelElement;

    constructor(id: string, parent: Frame, text: string) {
        super(id, 'label', parent);
        this.text = text;
    }

    get text(): string {
        return this.element.textContent;
    }
    set text(text: string) {
        this.element.textContent = text;
    }
}
