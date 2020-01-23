import CheckBox from '../../client/engine/interface/components/CheckBox';
import Label from '../../client/engine/interface/components/Label';
import PanelProp from '../PanelProp';
import PropsPanel from '../PropsPanel';

export default class CheckBoxProp extends PanelProp {
    private checkbox: CheckBox;

    public constructor(parent: PropsPanel, label: string, onChange: (value: boolean) => void, initial?: boolean) {
        super(parent);
        const lbl = new Label(this.nextId(), parent, label);
        lbl.style.position = 'initial';

        this.checkbox = new CheckBox(this.nextId(), lbl);
        this.checkbox.style.position = 'initial';
        this.checkbox.style.margin = '5px 15px';
        this.checkbox.addEventListener('change', (self: CheckBox) => { onChange(self.checked); });
        if (initial) {
            this.checkbox.click();
        }
    }

    public get checked(): boolean { return this.checkbox.checked; }
    public set checked(checked: boolean) { this.checkbox.checked = checked; }
}
