import Frame from "./frame";

export default class Button extends Frame {
    classes: string;

    constructor(id: string, parent: Frame) {
        super(id, "button", parent);
    }
    draw: (s: string) => void;

}