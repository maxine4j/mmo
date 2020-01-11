export default class Point {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static eq(p0: Point, p1: Point): boolean {
        return p0.x === p1.x && p0.y === p1.y;
    }
}
