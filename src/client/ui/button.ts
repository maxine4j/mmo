import Frame from "./frame";


export default class Button extends Frame {
    private text: string;

    constructor(id: string, parent: Frame, text: string) {
        super(id, "button", parent);
        this.setText(text);
    }
    
    public getText(): string {
        return this.text;
    }

    public setText(text: string) {
        this.text = text;
        this.element.textContent = this.text;
    }
}