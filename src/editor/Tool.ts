import Button from '../client/engine/interface/Button';
import ToolPanel, { toolButtonSize } from './ToolPanel';
import Brush from './Brush';

const selectedBg = 'rgba(84, 84, 84,0.8)';
const unselectedBg = 'rgba(255,255,255,0.8)';

export default class Tool {
    private name: string;
    private icon: string;

    private button: Button;
    private panel: ToolPanel;

    private action: (delta: number, brush: Brush) => void;

    public constructor(name: string, icon: string, action: (delta: number, brush: Brush) => void) {
        this.name = name;
        this.icon = icon;
        this.action = action;
    }

    public init(panel: ToolPanel) {
        this.panel = panel;
        this.button = new Button(`tool-btn-${this.name}`, this.panel.panel, '');

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
    }

    public onSelected() {
        this.button.style.backgroundColor = selectedBg;
    }

    public onUnselected() {
        this.button.style.backgroundColor = unselectedBg;
    }

    public use(delta: number, brush: Brush) {
        this.action(delta, brush);
    }
}
