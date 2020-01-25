import { Frame, FrameStrata } from './Frame';
import Label from './Label';
import TextBox from './TextBox';
import Button from './Button';

type DialogButtonCallback = (self: Button, ev: MouseEvent, inputText?: string) => void;

export default class Dialog extends Frame {
    private lbl: Label;

    public constructor(parent: Frame, text: string, showInput?: boolean, buttons?: string[], callbacks?: DialogButtonCallback[]) {
        super('div', parent);
        this.createElement();

        this.lbl = new Label(this, text);
        this.lbl.style.position = 'initial';
        this.lbl.style.margin = 'auto';
        this.lbl.style.fontSize = '120%';
        this.lbl.style.marginTop = '30px';
        this.lbl.style.display = 'block';
        this.lbl.style.height = '75px';
        this.lbl.style.bottom = '0';
        this.lbl.style.textAlign = 'center';

        let inp: TextBox = null;
        if (showInput) {
            inp = new TextBox(this);
        }
        if (buttons) {
            for (let i = 0; i < buttons.length; i++) {
                const btn = new Button(this, buttons[i]);
                if (callbacks) {
                    btn.addEventListener('click', (self: Button, ev: MouseEvent) => {
                        const cb = callbacks[i];
                        if (cb) {
                            if (inp) {
                                cb(self, ev, inp.text);
                            } else {
                                cb(self, ev);
                            }
                        }
                    });
                }
            }
        } else {
            const btn = new Button(this, 'Okay');
            btn.style.position = 'initial';
            btn.style.margin = 'auto';
            btn.style.display = 'block';
            btn.style.bottom = '0';
            btn.addEventListener('click', (self: Button, ev: MouseEvent) => {
                this.hide();
            });
        }
    }

    public show(): void {
        super.show();
        this.element.style.display = 'block';
    }

    public hide(): void {
        super.hide();
        this.element.style.display = 'none';
    }

    public setText(text: string): void {
        this.lbl.text = text;
    }

    protected createElement(): void {
        this.element = document.createElement('div');
        this.element.style.userSelect = 'none';
        this.element.style.position = 'fixed';
        this.element.style.width = '500px';
        this.element.style.height = '150px';
        this.element.style.border = '1px solid white';
        this.element.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
        this.parent.addChild(this);
        this.centreHorizontal();
        this.centreVertical();
        this.strata = FrameStrata.DIALOG;
        this.hide();
    }
}
