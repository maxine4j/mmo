import { Frame } from './Frame';


export default class RadioButton extends Frame {
    protected element: HTMLInputElement;

    public constructor(parent: Frame, value: string, group: string) {
        super('input', parent);
        this.element.type = 'radio';
        this.element.name = group;
        this.element.value = value;
    }

    public get checked(): boolean {
        return this.element.checked;
    }
    public set chekced(checked: boolean) {
        this.element.checked = checked;
    }

    public get group(): string {
        return this.element.name;
    }
    public set group(group: string) {
        this.element.name = group;
    }

    public get value(): string {
        return this.element.value;
    }
    public set value(value: string) {
        this.element.value = value;
    }

    public static getCheckedInGroup(group: string): string {
        const radbtn = (<HTMLInputElement>document.querySelector(`input[type="radio"][name=${group}]:checked`));
        if (radbtn === null) return '';
        return radbtn.value;
    }
}
