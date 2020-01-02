import { Frame, FrameStrata } from './Frame';


class ContextMenuOption extends Frame {
    key: string;
    value: string;
    protected element: HTMLButtonElement;

    constructor(key: string, value: string, parent: ContextMenu) {
        super(parent.id + key, 'button', parent, false);
        this.key = key;
        this.value = value;
        this.strata = FrameStrata.TOOLTIP;
        this.createElement();
    }

    protected createElement() {
        this.element = document.createElement('button');
        this.element.textContent = this.value;
        this.element.value = this.key;
    }
}

export default class ContextMenu extends Frame {
    protected element: HTMLSpanElement;

    constructor(id: string, parent: Frame) {
        super(id, 'div', parent);
        this.hide();
    }

    public open(x: number, y: number) {
        this.style.position = 'fixed';
        this.style.top = y.toString();
        this.style.left = x.toString();
        this.style.zIndex = (<number>this.strata).toString();
        this.show();
    }

    public close() {
        this.hide();
    }

    public addOption() {

    }
}
