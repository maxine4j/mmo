import { Frame } from './Frame';
import Label from './Label';
import TextBox from './TextBox';
import Button from './Button';

type DialogButtonCallback = (self: Button, ev: MouseEvent) => void;

export default class Dialog extends Frame {
    public constructor(id: string, parent: Frame, text: string, showInput?: boolean, buttons?: string[], callbacks?: DialogButtonCallback[]) {
        super(id, 'div', parent);
        this.createElement();
        this.visible = false;

        const lblText = new Label(`${id}-label`, this, text);
        if (showInput) {
            const inp = new TextBox(`${id}-textbox`, this);
        }
        if (buttons) {
            for (let i = 0; i < buttons.length; i++) {
                const btn = new Button(`${id}-button-${i}`, this, buttons[i]);
                btn.addEventListener('click', (self: Button, ev: MouseEvent) => {
                    callbacks[i](self, ev);
                });
            }
        } else {
            const btn = new Button(`${id}-button`, this, 'Okay');
            btn.addEventListener('click', (self: Button, ev: MouseEvent) => {
                this.hide();
            });
        }
    }

    protected createElement() {
        this.element = document.createElement('div');
        this.element.style.userSelect = 'none';
        this.element.style.position = 'fixed';
        this.element.style.width = '400px';
        this.element.style.height = '300px';
        this.element.classList.add('dialog');
        this.parent.addChild(this);
    }
}
