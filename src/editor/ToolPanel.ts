import Panel from '../client/engine/interface/Panel';
import UIParent from '../client/engine/interface/UIParent';
import Tool from './Tool';
import Input, { MouseButton } from '../client/engine/Input';

export const toolButtonSize = 32;

export default class ToolPanel extends Panel {
    private tools: Tool[];
    private selected: Tool;

    public constructor() {
        super('panel-tools', UIParent.get());
        this.tools = [];

        this.width = toolButtonSize * 2 + 5;
        this.height = 600;
        this.element.style.left = '0';
        this.centreVertical();
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    }

    public add(tool: Tool): void {
        this.tools.push(tool);
        if (this.tools.length === 1) {
            this.selectTool(tool);
        }
    }

    public selectTool(selected: Tool): void {
        if (this.selected) {
            this.selected.onUnselected();
        }
        this.selected = selected;
        this.selected.onSelected();
    }

    public update(delta: number): void {
        if (this.selected) {
            this.selected.update(delta);
            if (Input.isMouseDown(MouseButton.LEFT)) {
                this.selected.use(delta);
            }
        }
    }
}
