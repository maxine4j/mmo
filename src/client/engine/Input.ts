import { Key } from 'ts-key-enum';
import { Point } from '../../common/Point';
import ContextMenu, { ContextOptionDef } from './interface/components/ContextMenu';
import UIParent from './interface/components/UIParent';
import Tooltip from './interface/components/Tooltip';

export enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2,
}

export default class Input {
    private static keyStates: Map<string, boolean> = new Map();
    private static lastKeyStates: Map<string, boolean> = new Map();
    private static mouseButtonStates: Map<MouseButton, boolean> = new Map();
    private static lastMouseButtonStates: Map<MouseButton, boolean> = new Map();
    private static mousePosition: Point;
    private static clickMarker: HTMLImageElement;
    private static clickMarkerDim: number = 16;
    private static contextMenu: ContextMenu;
    private static tooltip: Tooltip;

    public static init(canvas: HTMLCanvasElement): void {
        this.mousePosition = new Point(0, 0);

        window.addEventListener('keydown', (ev: KeyboardEvent) => {
            this.setKeyState(ev, true);
        });
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            this.setKeyState(ev, false);
        });
        canvas.addEventListener('mousedown', (ev: MouseEvent) => {
            this.setMouseState(ev, true);
            ev.preventDefault();
        });
        canvas.addEventListener('mouseup', (ev: MouseEvent) => {
            this.setMouseState(ev, false);
        });
        canvas.addEventListener('mousemove', (ev: MouseEvent) => {
            this.mousePosition.x = ev.clientX;
            this.mousePosition.y = ev.clientY;
        });

        this.clickMarker = document.createElement('img');
        document.body.appendChild(this.clickMarker);
        this.clickMarker.src = 'assets/imgs/click.gif';
        this.clickMarker.style.position = 'fixed';
        this.clickMarker.style.display = 'none';
        this.clickMarker.style.pointerEvents = 'none';

        this.contextMenu = new ContextMenu(UIParent.get());
        this.tooltip = new Tooltip(UIParent.get());
    }

    public static openContextMenu(pos: Point, options: ContextOptionDef[]): void {
        this.contextMenu.clear();
        for (const opt of options) {
            this.contextMenu.addOption(opt);
        }
        this.contextMenu.parent.addChild(this.contextMenu);
        this.contextMenu.open(pos);
    }

    public static openTooltip(pos: Point, lines: string[]): void {
        this.tooltip.clear();
        for (const line of lines) {
            this.tooltip.addLine(line);
        }
        this.contextMenu.parent.addChild(this.tooltip);
        this.tooltip.open(pos);
    }

    public static positionTooltip(pos: Point): void {
        this.tooltip.position(pos);
    }

    public static closeTooltip(): void {
        this.tooltip.hide();
    }

    public static playClickMark(p: Point, color: string): void {
        this.clickMarker.style.left = `${p.x - this.clickMarkerDim / 2}px`;
        this.clickMarker.style.top = `${p.y - this.clickMarkerDim / 2}px`;
        this.clickMarker.style.width = `${this.clickMarkerDim}px`;
        this.clickMarker.style.height = `${this.clickMarkerDim}px`;
        this.clickMarker.style.color = 'red';
        this.clickMarker.style.display = 'initial';
        this.clickMarker.style.filter = `opacity(.5) drop-shadow(0 0 0 ${color})`;
        this.clickMarker.style.webkitFilter = `opacity(.5) drop-shadow(0 0 0 ${color})`;
        this.clickMarker.style.zIndex = '9999';
        // eslint-disable-next-line no-self-assign
        this.clickMarker.src = this.clickMarker.src;
    }

    public static afterUpdate(): void {
        this.lastKeyStates = new Map(this.keyStates);
        this.lastMouseButtonStates = new Map(this.mouseButtonStates);
    }

    private static setKeyState(ev: KeyboardEvent, down: boolean): void {
        this.keyStates.set(<Key>ev.key, down);
    }

    private static setMouseState(ev: MouseEvent, down: boolean): void {
        this.mouseButtonStates.set(ev.button, down);
    }

    public static isKeyDown(key: Key | string): boolean {
        return this.keyStates.get(key);
    }

    public static wasKeyDown(key: Key | string): boolean {
        return this.lastKeyStates.get(key);
    }

    public static wasKeyPressed(key: Key | string): boolean { // check if the key was just released this frame
        return this.wasKeyDown(key) && !this.isKeyDown(key);
    }

    public static isMouseDown(btn: MouseButton): boolean {
        return this.mouseButtonStates.get(btn);
    }

    public static wasMouseDown(btn: MouseButton): boolean {
        return this.lastMouseButtonStates.get(btn);
    }

    public static wasMousePressed(btn: MouseButton): boolean { // check if the button was just released this frame
        return this.wasMouseDown(btn) && !this.isMouseDown(btn);
    }

    public static mouseStartDown(btn: MouseButton): boolean {
        return !this.wasMouseDown(btn) && this.isMouseDown(btn);
    }

    public static mousePos(): Point {
        return this.mousePosition.clone();
    }
}
