import Panel from '../client/engine/interface/Panel';
import UIParent from '../client/engine/interface/UIParent';
import Tool from './Tool';
import Brush from './Brush';
import Input, { MouseButton } from '../client/engine/Input';

export const toolButtonSize = 32;

export default class ToolPanel {
    private tools: Tool[];
    private selected: Tool;

    public panel: Panel;

    public constructor() {
        this.tools = [];

        this.panel = new Panel('panel-tools', UIParent.get());
        this.panel.width = toolButtonSize * 2 + 5;
        this.panel.height = 600;
        this.panel.style.left = '0';
        this.panel.centreVertical();
        this.panel.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    }

    public add(tool: Tool) {
        tool.init(this);
        this.tools.push(tool);
        if (this.tools.length === 1) {
            this.selectTool(tool);
        }
    }

    public selectTool(selected: Tool) {
        if (this.selected) {
            this.selected.onUnselected();
        }
        this.selected = selected;
        this.selected.onSelected();
    }

    public update(delta: number, brush: Brush) {
        if (this.selectTool) {
            if (Input.isMouseDown(MouseButton.LEFT)) {
                this.selected.use(delta, brush);
            }
        }
    }
}
