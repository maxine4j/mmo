import PropsPanel from './PropsPanel';

export default class PanelProp {
    public parent: PropsPanel;

    public constructor(parent: PropsPanel) {
        this.parent = parent;
    }

    public nextId(): string {
        return `${this.parent.id}-${this.parent.children.size}`;
    }
}
