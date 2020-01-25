import TextBox from '../../client/engine/interface/components/TextBox';
import Slider from '../../client/engine/interface/components/Slider';
import Label from '../../client/engine/interface/components/Label';
import PanelProp from '../PanelProp';
import PropsPanel from '../PropsPanel';

export default class SliderProp extends PanelProp {
    private textbox: TextBox;
    private slider: Slider;

    public constructor(parent: PropsPanel, label: string, min: number, max: number, step: number, val: number, onChange: (value: number) => void) {
        super(parent);

        const lbl = new Label(parent, label);
        lbl.style.position = 'initial';

        this.textbox = new TextBox(parent, 'number');
        this.textbox.step = step;
        this.textbox.style.position = 'initial';
        this.textbox.text = val.toString();
        this.textbox.width = 60;

        this.slider = new Slider(parent, min, max, val, step);
        this.slider.style.position = 'initial';

        this.textbox.addEventListener('input',
            (self: TextBox, ev: MouseEvent): void => {
                this.slider.value = Number(this.textbox.text);
                onChange(this.slider.value);
            });

        this.slider.addEventListener('input', (self: Slider, ev: MouseEvent) => {
            this.textbox.text = self.value.toString();
            onChange(self.value);
        });
    }

    public get value(): number { return this.slider.value; }
    public set value(value: number) {
        this.slider.value = value;
        this.textbox.text = value.toString();
    }
}
