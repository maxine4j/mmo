import { Point } from './Point';

export interface RectangleDef {
    x: number;
    y: number;
    w: number;
    h: number;
}

export default class Rectangle implements RectangleDef {
    public x: number;
    public y: number;
    public w: number;
    public h: number;

    public constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    public static fromDef(def: RectangleDef): Rectangle {
        return new Rectangle(def.x, def.y, def.w, def.h);
    }

    public contains(point: Point): boolean {
        return point.x >= this.x && point.x < (this.x + this.w)
        && point.y >= this.y && point.y < (this.y + this.h);
    }
}
