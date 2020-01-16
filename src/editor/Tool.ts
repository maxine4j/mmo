import Button from '../client/engine/interface/Button';
import ToolPanel, { toolButtonSize } from './ToolPanel';
import EditorProps from './EditorProps';
import PropsPanel from './PropsPanel';
import SliderProp from './panelprops/SliderProp';
import Brush from './Brush';

const selectedBg = 'rgba(84, 84, 84,0.8)';
const unselectedBg = 'rgba(255,255,255,0.8)';

export default class Tool {
    private name: string;
    private icon: string;
    protected props: EditorProps;
    protected propsPanel: PropsPanel;

    private button: Button;
    private panel: ToolPanel;

    public constructor(name: string, icon: string, props: EditorProps, panel: ToolPanel) {
        this.name = name;
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

    protected addBrushSizeProp(brush: Brush) {
        const propBrushSize = new SliderProp(this.propsPanel, 'Brush Size:', 1, 30, 1, brush.size + 1, (value) => {
            brush.size = value - 1;
        });
        brush.onSizeChange = (value) => { propBrushSize.value = value + 1; };
    }

    public onSelected() {
        this.button.style.backgroundColor = selectedBg;
        this.propsPanel.show();
    }

    public onUnselected() {
        this.button.style.backgroundColor = unselectedBg;
        this.propsPanel.hide();
    }

    public use(delta: number) {
    }

    public update(delta: number) {
    }
}
