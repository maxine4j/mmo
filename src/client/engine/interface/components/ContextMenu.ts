import { Frame, FrameStrata } from './Frame';
import { Point } from '../../../../common/Point';
import Graphics from '../../graphics/Graphics';

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

class ContextMenuOption extends Frame {
    public key: string;
    public value: string;
    protected element: HTMLButtonElement;

    public constructor(key: string, value: string, parent: ContextMenu) {
        super('button', parent, false);
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
        this.element.style.width = 'initial';
        this.element.style.display = 'block';
        this.parent.addChild(this);
        this.style.width = '100%';
    }
}

export interface ContextOptionDef {
    text: string;
    listener: () => void;
}

export default class ContextMenu extends Frame {
    protected element: HTMLSpanElement;

    public constructor(parent: Frame) {
        super('div', parent);
        this.visible = false;
        this.element.classList.add('context-menu');
        this.element.addEventListener('mouseleave', (ev: MouseEvent) => { this.close(); });

        const header = document.createElement('p');
        header.textContent = 'Choose Option';
        header.classList.add('context-menu-header');
        this.element.appendChild(header);
    }

    public open(point: Point): void {
        this.style.position = 'fixed';

        const left = clamp(point.x - this.width / 2, 0, Graphics.viewportWidth - this.width);
        const top = clamp(point.y - 10, 0, Graphics.viewportHeight - this.height);

        this.style.left = `${left}px`;
        this.style.top = `${top}px`;
        this.style.zIndex = (<number> this.strata).toString();

        this.show();
    }

    public close(): void {
        this.hide();
    }

    public addOption(def: ContextOptionDef): void {
        const opt = new ContextMenuOption(def.text, def.text, this);
        opt.addEventListener('click', (self: ContextMenuOption, ev: MouseEvent) => {
            def.listener();
            this.close();
        });
    }
}
