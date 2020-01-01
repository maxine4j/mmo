
export default abstract class Frame {
    readonly id: string;

    children: Map<string, Frame>;
    styles: string;

    private parent: Frame;
    private visible: boolean;
    private element: HTMLElement;

    constructor(id: string, tag: string, parent: Frame) {
        this.id = id;
        this.visible = true;
        this.element = document.createElement(tag);
        this.parent = parent;
        parent.addChild(this);
        this.element.textContent = "THIS IS A FRAME";
    }
    
    public show() {
        this.visible = true;
        this.element.style.visibility = "visible";
    }

    public hide() {
        this.visible = false;
        this.element.style.visibility = "hidden";
    }

    public setVisible(visible: boolean) {
        this.visible = visible;
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public getParent(): Frame {
        return this.parent;
    }

    public setParent(parent: Frame) {
        this.parent.children.delete(this.id);
        this.parent = parent;
        parent.element.appendChild(this.parent.element);
    }

    public addChild(child: Frame) {
        this.children.set(child.id, child);
        this.element.appendChild(child.element);
    }
}