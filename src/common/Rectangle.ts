import Point from './Point';

export default class Rectangle {
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

    public contains(point: Point): boolean {
        return point.x > this.x && point.x < (this.x + this.w)
        && point.y > this.y && point.y < (this.y + this.h);
    }
}
