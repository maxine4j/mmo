export default class Point {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public eq(other: Point): boolean {
        return this.x === other.x && this.y === other.y;
    }
}
