import { Frame } from './Frame';


export default class CheckBox extends Frame {
    protected element: HTMLInputElement;

    public constructor(id: string, parent: Frame) {
        super(id, 'input', parent);
        this.element.type = 'checkbox';
    }

    public get checked(): boolean {
        return this.element.checked;
    }
    public set checked(checked: boolean) {
        this.element.checked = checked;
    }
}
