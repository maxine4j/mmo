import Panel from '../client/engine/interface/Panel';
import UIParent from '../client/engine/interface/UIParent';
import Tool from './Tool';
import Input, { MouseButton } from '../client/engine/Input';
import Label from '../client/engine/interface/Label';

export const toolButtonSize = 32;

export const panelBg = 'rgba(0, 0, 0, 0.8)';

export default class ToolPanel extends Panel {
    private tools: Tool[];
    private selected: Tool;
    private infoPanel: Panel;
    private infoLabel: Label;

    public constructor() {
        super('panel-tools', UIParent.get());
        this.tools = [];

        this.width = toolButtonSize * 2 + 5;
        this.height = 300;
        this.element.style.left = '0';
        this.centreVertical();
        // this.element.style.top = '100px';
        this.element.style.backgroundColor = panelBg;

        this.infoPanel = new Panel('panel-tools-info-panel', UIParent.get());
        this.infoPanel.width = 300;
        this.infoPanel.height = 200;
        this.infoPanel.style.left = '0';
        this.infoPanel.style.bottom = '0';
        this.infoPanel.style.backgroundColor = panelBg;

        const lblHeader = new Label('panel-tools-info-panel-header', this.infoPanel, 'Tool Description:');
        lblHeader.style.position = 'initial';
        lblHeader.style.fontSize = '120%';

        this.infoPanel.addBreak();
        this.infoPanel.addBreak();

        this.infoLabel = new Label('panel-tools-info-panel-label', this.infoPanel, '');
        this.infoLabel.style.position = 'initial';
        this.infoLabel.style.whiteSpace = 'pre-wrap';
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
        this.infoLabel.text = this.selected.description;
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
