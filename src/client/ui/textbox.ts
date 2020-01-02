import Frame from "./frame";


export default class TextBox extends Frame {

    protected element: HTMLInputElement;

    constructor(id: string, parent: Frame) {
        super(id, "input", parent);
    }
    
    public getText(): string {
        return this.element.value;
    }

    public setText(text: string) {
        this.element.value = text;
    }

    public setPlaceholder(text: string) {
        this.element.placeholder = text;
    }
}