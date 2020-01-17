import Panel from '../client/engine/interface/Panel';
import { toolButtonSize, panelBg } from './ToolPanel';
import { Frame } from '../client/engine/interface/Frame';
import PanelProp from './PanelProp';

export default class PropsPanel extends Panel {
    private props: PanelProp[] = [];

    public constructor(id: string, parent: Frame) {
        super(id, parent);
        this.width = 600;
        this.height = toolButtonSize * 2 + 5;
        this.hide();
        this.element.style.top = '0';
        this.centreHorizontal();
        this.element.style.backgroundColor = panelBg;
    }

    public addProp(prop: PanelProp): void {
        this.props.push(prop);
    }
}
