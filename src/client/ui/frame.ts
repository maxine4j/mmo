export default abstract class Frame {
    readonly id: string;

    children: Map<string, Frame>;
    styles: string;

    private parent: Frame;
    private visible: boolean;
    protected element: HTMLElement;

    constructor(id: string, tag: string, parent: Frame) {
        this.id = id;
        this.visible = true;
        this.children = new Map();
        if (id === "uiparent") {
            this.element = document.getElementById(this.id);
        } else {
            this.element = document.createElement(tag);
            this.element.style.userSelect = "none";
            this.parent = parent;
            this.parent.addChild(this);
        }
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
        visible ? this.show() : this.hide();
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

    public style(): CSSStyleDeclaration {
        return this.element.style;
    }

    public addEventListener<K extends keyof HTMLElementEventMap>(type: K, listener: (self: Frame, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void {
        this.element.addEventListener(type, (ev: HTMLElementEventMap[K]) => {
            listener(this, ev);
            ev.stopImmediatePropagation();
        }, 
        options);
    }
}