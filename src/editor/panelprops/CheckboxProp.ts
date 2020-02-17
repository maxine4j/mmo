import CheckBox from '../../client/engine/interface/components/CheckBox';
import Label from '../../client/engine/interface/components/Label';
import PanelProp from '../PanelProp';
import { Frame } from '../../client/engine/interface/components/Frame';

export default class CheckBoxProp extends PanelProp {
    private checkbox: CheckBox;

    public constructor(parent: Frame, label: string, onChange: (value: boolean) => void, initial?: boolean) {
        super(parent);
        const lbl = new Label(parent, label);
        lbl.style.position = 'initial';

        this.checkbox = new CheckBox(lbl);
        this.checkbox.style.position = 'initial';
        this.checkbox.style.margin = '5px 15px';
        this.checkbox.addEventListener('change', (self: CheckBox) => { onChange(self.checked); });
        if (initial) {
            this.checkbox.click();
        }
    }

    public get checked(): boolean { return this.checkbox.checked; }
    public set checked(checked: boolean) { this.checkbox.checked = checked; }

    public show(): void {
        this.checkbox.show();
    }

    public hide(): void {
        this.checkbox.hide();
    }
}
