import { Frame } from './Frame';


export default class RadioButton extends Frame {
    protected element: HTMLInputElement;

    constructor(id: string, parent: Frame, value: string, group: string) {
        super(id, 'input', parent);
        this.element.type = 'radio';
        this.element.name = group;
        this.element.value = value;
    }

    get checked(): boolean {
        return this.element.checked;
    }
    set chekced(checked: boolean) {
        this.element.checked = checked;
    }

    get group(): string {
        return this.element.name;
    }
    set group(group: string) {
        this.element.name = group;
    }

    get value(): string {
        return this.element.value;
    }
    set value(value: string) {
        this.element.value = value;
    }

    public static getCheckedInGroup(group: string): string {
        const radbtn = (<HTMLInputElement>document.querySelector(`input[type="radio"][name=${group}]:checked`));
        if (radbtn === null) return '';
        return radbtn.value;
    }
}
