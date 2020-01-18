import Button from '../client/engine/interface/Button';
import ToolPanel, { toolButtonSize } from './ToolPanel';
import EditorProps from './EditorProps';
import PropsPanel from './PropsPanel';
import SliderProp from './panelprops/SliderProp';
import Brush from './Brush';
import Input, { MouseButton } from '../client/engine/Input';

const selectedBg = 'rgba(84, 84, 84,0.8)';
const unselectedBg = 'rgba(255,255,255,0.8)';

export default class Tool {
    private name: string;
    private _description: string;
    private icon: string;
    protected props: EditorProps;
    protected propsPanel: PropsPanel;

    private button: Button;
    private panel: ToolPanel;

    public constructor(name: string, description: string, icon: string, props: EditorProps, panel: ToolPanel) {
        this.name = name;
        this._description = description;
        this.icon = icon;
        this.props = props;
        this.panel = panel;
        this.button = new Button(`tool-btn-${this.name}`, this.panel, '');

        this.button.width = toolButtonSize;
        this.button.height = toolButtonSize;
        this.button.style.position = 'initial';
        this.button.style.background = 'initial';
        this.button.style.backgroundColor = unselectedBg;
        this.button.style.backgroundImage = `url('${this.icon}')`;
        this.button.style.backgroundSize = '100%';
        this.button.addEventListener('click', () => {
            this.panel.selectTool(this);
        });

        this.propsPanel = new PropsPanel(`tool-props-${this.name}`, this.panel);
    }

    public get description(): string { return this._description; }

    protected addBrushSizeProp(brush: Brush): void {
        const propBrushSize = new SliderProp(this.propsPanel, 'Brush Size:', 1, 30, 1, brush.size + 1, (value) => {
            brush.size = value - 1;
        });
        brush.onSizeChange = (value) => { propBrushSize.value = value + 1; };
    }

    public onSelected(): void {
        this.button.style.backgroundColor = selectedBg;
        this.propsPanel.show();
    }

    public onUnselected(): void {
        this.button.style.backgroundColor = unselectedBg;
        this.propsPanel.hide();
    }

    public use(delta: number): void {
    }

    public update(delta: number): void {
        if (Input.wasMousePressed(MouseButton.LEFT)) {
            this.props.world.updateWireframe();
        }
    }
}
