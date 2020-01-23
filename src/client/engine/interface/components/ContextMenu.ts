import { Frame, FrameStrata } from './Frame';
import { Point } from '../../../../common/Point';


class ContextMenuOption extends Frame {
    public key: string;
    public value: string;
    protected element: HTMLButtonElement;

    public constructor(key: string, value: string, parent: ContextMenu) {
        super(parent.id + key, 'button', parent, false);
        this.key = key;
        this.value = value;
        this.createElement();
        this.strata = FrameStrata.TOOLTIP;
    }

    protected createElement(): void {
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

    public constructor(id: string, parent: Frame) {
        super(id, 'div', parent);
        this.visible = false;
        this.width = 120;
        this.element.classList.add('context-menu');
        this.element.addEventListener('mouseleave', (ev: MouseEvent) => { this.close(); });

        const header = document.createElement('p');
        header.textContent = 'Choose Option';
        header.classList.add('context-menu-header');
        this.element.appendChild(header);
    }

    public open(point: Point): void {
        this.style.position = 'fixed';
        this.style.left = `${point.x - this.width / 2}px`;
        this.style.top = `${point.y - 10}px`;
        this.style.zIndex = (<number> this.strata).toString();
        this.show();
    }

    public close(): void {
        this.hide();
    }

    public addOption(text: string, listener: () => void): void {
        const opt = new ContextMenuOption(text, text, this);
        opt.addEventListener('click', (self: ContextMenuOption, ev: MouseEvent) => {
            listener();
            this.close();
        });
    }
}
