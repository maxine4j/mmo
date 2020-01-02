import Frame from './frame';


export default class CheckBox extends Frame {
    protected element: HTMLInputElement;

    constructor(id: string, parent: Frame) {
        super(id, 'input', parent);
        this.element.type = 'checkbox';
    }

    get checked(): boolean {
        return this.element.checked;
    }
    set checked(checked: boolean) {
        this.element.checked = checked;
    }
}
