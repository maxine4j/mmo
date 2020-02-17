import TextBox from '../../client/engine/interface/components/TextBox';
import Label from '../../client/engine/interface/components/Label';
import PanelProp from '../PanelProp';
import { Frame } from '../../client/engine/interface/components/Frame';

export default class TextboxProp extends PanelProp {
    private textbox: TextBox;

    public constructor(parent: Frame, label: string, val: string, onChange: (value: string) => void) {
        super(parent);

        const lbl = new Label(parent, label);
        lbl.style.position = 'initial';

        this.textbox = new TextBox(parent);
        this.textbox.style.position = 'initial';
        this.textbox.text = val;
        this.textbox.width = parent.width;

        this.textbox.addEventListener('input',
            (self: TextBox, ev: MouseEvent): void => {
                onChange(self.text);
            });
    }

    public get text(): string { return this.textbox.text; }
    public set text(txt: string) {
        this.textbox.text = txt;
    }

    public show(): void {
        this.textbox.show();
    }

    public hide(): void {
        this.textbox.hide();
    }
}
