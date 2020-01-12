export default class Point {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static eq(lhs: Point, rhs: Point): boolean {
        return lhs.x === rhs.x && lhs.y === rhs.y;
    }

    public static sub(lhs: Point, rhs: Point): Point {
        return new Point(lhs.x - rhs.x, lhs.y - rhs.y);
    }

    public static add(lhs: Point, rhs: Point): Point {
        return new Point(lhs.x + rhs.x, lhs.y + rhs.y);
    }

    public static clone(other: Point) {
        return new Point(other.x, other.y);
    }
}
