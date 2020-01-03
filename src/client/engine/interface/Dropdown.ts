import { Frame } from './Frame';


class DropdownOption extends Frame {
    public key: string;
    public value: string;
    protected element: HTMLOptionElement;

    public constructor(key: string, value: string, parent: Dropdown) {
        super(parent.id + key, 'option', parent, false);
        this.key = key;
        this.value = value;
        this.createElement();
    }

    protected createElement() {
        this.element = document.createElement('option');
        this.element.textContent = this.value;
        this.element.value = this.key;
    }
}

export default class Dropdown extends Frame {
    protected element: HTMLInputElement;

    public constructor(id: string, parent: Frame) {
        super(id, 'select', parent);
    }

    public get selected(): string {
        return this.element.value;
    }
    public set selected(key: string) {
        this.element.value = key;
    }

    public addOption(key: string, value: string) {
        const opt = new DropdownOption(key, value, this);
        this.addChild(opt);
    }
}
