import Frame from "./frame";


export default class TextBox extends Frame {

    protected element: HTMLInputElement;

    constructor(id: string, parent: Frame, text: string) {
        super(id, "input", parent);
        this.element.type = "checkbox";
        this.setText(text);
    }
    
    public getText(): string {
        return (<HTMLInputElement>this.element).value;
    }

    public setText(text: string) {
        (<HTMLInputElement>this.element).value = text;
    }
}