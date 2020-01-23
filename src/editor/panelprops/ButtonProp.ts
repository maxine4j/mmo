import Button from '../../client/engine/interface/components/Button';
import PanelProp from '../PanelProp';
import PropsPanel from '../PropsPanel';

export default class ButtonProp extends PanelProp {
    private button: Button;

    public constructor(parent: PropsPanel, text: string, onClick: (self: Button, ev: MouseEvent) => void) {
        super(parent);
        this.button = new Button(this.nextId(), parent, text);
        this.button.style.position = 'initial';
        this.button.style.margin = '5px 15px';
        this.button.style.fontSize = 'initial';
        this.button.style.background = 'rgba(255,255,255,0.8)';
        this.button.style.color = 'rgba(0,0,0,1)';
        this.button.style.width = '87%';
        this.button.addEventListener('click', (self: Button, ev: MouseEvent) => { onClick(self, ev); });
    }

    public get text(): string { return this.button.text; }
    public set text(text: string) { this.button.text = text; }

    public click(): void {
        this.button.click();
    }
}
