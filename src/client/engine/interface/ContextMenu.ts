import { Frame, FrameStrata } from './Frame';


class ContextMenuOption extends Frame {
    key: string;
    value: string;
    protected element: HTMLButtonElement;

    constructor(key: string, value: string, parent: ContextMenu) {
        super(parent.id + key, 'button', parent, false);
        this.key = key;
        this.value = value;
        this.createElement();
        this.strata = FrameStrata.TOOLTIP;
    }

    protected createElement() {
        this.element = document.createElement('button');
        this.element.textContent = this.value;
        this.element.value = this.key;
        this.element.classList.add('context-menu-option');
        this.parent.addChild(this);
        this.style.width = '100%';
    }
}

export default class ContextMenu extends Frame {
    protected element: HTMLSpanElement;

    constructor(id: string, parent: Frame) {
        super(id, 'div', parent);
        this.visible = false;
        this.width = 120;
        this.element.classList.add('context-menu');
        this.element.addEventListener('mouseleave', (ev: MouseEvent) => { this.close(); });
    }

    public open(x: number, y: number) {
        this.style.position = 'fixed';
        this.style.left = `${x - this.width / 2}px`;
        this.style.top = `${y}px`;
        this.style.zIndex = (<number> this.strata).toString();
        this.show();
    }

    public close() {
        this.hide();
    }

    public addOption(text: string, listener: () => void) {
        const opt = new ContextMenuOption(text, text, this);
        opt.addEventListener('click', (self: ContextMenuOption, ev: MouseEvent) => {
            listener();
            this.close();
        });
    }
}
