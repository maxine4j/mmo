import '../styles/default';
import uuid from 'uuid/v4';
import { EventEmitter } from 'events';

export enum FrameStrata {
    WORLD = 0,
    BACKGROUND = 10,
    LOW = 20,
    MEDIUM = 30,
    HIGH = 40,
    DIALOG = 50,
    FULLSCREEN = 60,
    FULLSCREEN_DIALOG = 70,
    TOOLTIP = 80,
}

export abstract class Frame extends EventEmitter {
    public readonly id: string;
    private _children: Map<string, Frame>;
    protected _visible: boolean;
    private tag: string;
    public clickThrough: boolean;
    protected _parent: Frame;
    protected element: HTMLElement;
    private _strata: FrameStrata;

    public constructor(tag: string, parent: Frame, createElement: boolean = true) {
        super();
        this.id = uuid();
        this.tag = tag;
        this.clickThrough = false;
        this._visible = true;
        this._children = new Map();
        this._parent = parent;
        if (createElement) {
            this.createElement();
            this.strata = FrameStrata.BACKGROUND;
        }
    }

    public dispose(): void {
        if (this.element != null) {
            this.element.remove();
        }
    }

    public clear(): void {
        for (const [_, child] of this.children) {
            child.dispose();
        }
    }

    protected createElement(): void {
        this.element = document.createElement(this.tag);
        this.element.id = this.id;
        this.element.style.userSelect = 'none';
        this.element.style.position = 'fixed';
        this.element.style.pointerEvents = 'initial';
        this.parent.addChild(this);
    }

    public blur(): void {
        this.element.blur();
    }

    public focus(): void {
        this.element.focus();
    }

    public show(): void {
        this._visible = true;
        this.element.style.visibility = 'visible';
        for (const [_, child] of this.children) {
            child.show();
        }
    }

    public hide(): void {
        this._visible = false;
        this.element.style.visibility = 'hidden';
        for (const [_, child] of this.children) {
            child.hide();
        }
    }

    public set visible(visible: boolean) {
        if (visible) {
            this.show();
        } else {
            this.hide();
        }
    }
    public get visible(): boolean {
        return this._visible;
    }

    public get children(): Map<string, Frame> {
        return this._children;
    }

    public get parent(): Frame {
        return this._parent;
    }
    public set parent(parent: Frame) {
        this.parent.children.delete(this.id);
        this._parent = parent;
        this.parent.element.appendChild(this.parent.element);
    }

    public get strata(): FrameStrata {
        return this._strata;
    }
    public set strata(strata: FrameStrata) {
        this._strata = strata;
        this.element.style.zIndex = (<number>strata).toString();
    }

    public addChild(child: Frame, appendDom: boolean = true): void {
        this.children.set(child.id, child);
        if (appendDom) {
            this.element.appendChild(child.element);
        }
    }

    public click(): void {
        this.element.click();
    }

    public get style(): CSSStyleDeclaration {
        return this.element.style;
    }

    public get width(): number {
        return this.element.offsetWidth;
    }
    public set width(w: number) {
        this.style.width = `${w}px`;
    }

    public get height(): number {
        return this.element.offsetHeight;
    }
    public set height(h: number) {
        this.style.height = `${h}px`;
    }

    public centreHorizontal(): void {
        this.element.style.left = '50%';
        this.element.style.marginLeft = `${-0.5 * this.width}px`;
    }

    public centreVertical(): void {
        this.element.style.top = '50%';
        this.element.style.marginTop = `${-0.5 * this.height}px`;
    }

    public disablePointerEvents(): void {
        this.element.style.pointerEvents = 'none';
    }

    public addEventListener<K extends keyof HTMLElementEventMap>(type: K,
        listener: (self: Frame, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions): void {
        this.element.addEventListener(type, (ev: HTMLElementEventMap[K]) => {
            listener(this, ev);
            if (!this.clickThrough) ev.stopImmediatePropagation();
        },
        options);
    }

    public get classList(): DOMTokenList { return this.element.classList; }
}
