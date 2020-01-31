import Panel from './components/Panel';

export const baseTabBg = 'rgba(0,0,0,0.4)';

export function setUpTabPanel(panel: Panel): void {
    panel.style.position = 'initial';
    panel.style.backgroundColor = baseTabBg;
    panel.style.margin = 'auto';
    panel.style.marginRight = '0';
    panel.style.borderRadius = '2px';
}

export default class BaseTab extends Panel {
    public show(): void {
        this._visible = true;
        this.element.style.display = 'block';
        this.element.style.visibility = 'visible';
        for (const [_, child] of this.children) {
            child.show();
        }
    }

    public hide(): void {
        this._visible = false;
        this.element.style.display = 'none';
        this.element.style.visibility = 'hidden';
        for (const [_, child] of this.children) {
            child.hide();
        }
    }
}
