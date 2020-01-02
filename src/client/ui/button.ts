import Frame from './frame';


export default class Button extends Frame {
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
