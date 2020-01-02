import { Frame } from './Frame';


class DropdownOption extends Frame {
    key: string;
    value: string;
    protected element: HTMLOptionElement;

    constructor(key: string, value: string, parent: Dropdown) {
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

    constructor(id: string, parent: Frame) {
        super(id, 'select', parent);
    }

    get selected(): string {
        return this.element.value;
    }
    set selected(key: string) {
        this.element.value = key;
    }

    public addOption(key: string, value: string) {
        const opt = new DropdownOption(key, value, this);
        this.addChild(opt);
    }
}
