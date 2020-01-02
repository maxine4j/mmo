export default abstract class Frame {
    readonly id: string;
    private _children: Map<string, Frame>;
    private _visible: boolean;
    private tag: string;
    protected _parent: Frame;
    protected element: HTMLElement;

    constructor(id: string, tag: string, parent: Frame, createElement: boolean = true) {
        this.id = id;
        this.tag = tag;
        this._visible = true;
        this._children = new Map();
        this._parent = parent;
        if (createElement) {
            this.createElement();
        }
    }

    protected createElement() {
        this.element = document.createElement(this.tag);
        this.element.style.userSelect = 'none';
        this.parent.addChild(this);
    }

    public show() {
        this._visible = true;
        this.element.style.visibility = 'visible';
    }

    public hide() {
        this._visible = false;
        this.element.style.visibility = 'hidden';
    }

    set visible(visible: boolean) {
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    }
    get visible(): boolean {
        return this._visible;
    }

    get children(): Map<string, Frame> {
        return this._children;
    }

    get parent(): Frame {
        return this._parent;
    }
    set parent(parent: Frame) {
        this.parent.children.delete(this.id);
        this._parent = parent;
        this.parent.element.appendChild(this.parent.element);
    }

    public addChild(child: Frame, appendDom: boolean = true) {
        this.children.set(child.id, child);
        if (appendDom) {
            this.element.appendChild(child.element);
        }
    }

    get style(): CSSStyleDeclaration {
        return this.element.style;
    }

    public addEventListener<K extends keyof HTMLElementEventMap>(type: K,
        listener: (self: Frame, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions): void {
        this.element.addEventListener(type, (ev: HTMLElementEventMap[K]) => {
            listener(this, ev);
            ev.stopImmediatePropagation();
        },
        options);
    }
}
