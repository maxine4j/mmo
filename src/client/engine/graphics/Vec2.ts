export default class Vec2 {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public static zero(): Vec2 {
        return new Vec2(0, 0);
    }

    public static up(): Vec2 {
        return new Vec2(0, -1);
    }

    public static down(): Vec2 {
        return new Vec2(0, 1);
    }

    public static left(): Vec2 {
        return new Vec2(-1, 0);
    }

    public static right(): Vec2 {
        return new Vec2(1, 0);
    }

    public copy(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    public equals(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public toString(): string {
        return `(${this.x},${this.y}`;
    }

    public add(other: Vec2) {
        this.x += other.x;
        this.y += other.y;
    }

    public sub(other: Vec2) {
        this.x -= other.x;
        this.y -= other.y;
    }

    public mulS(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
    }

    public mulV(vec: Vec2) {
        this.x *= vec.x;
        this.y *= vec.y;
    }

    public divS(scalar: number) {
        this.x /= scalar;
        this.y /= scalar;
    }

    public divV(vec: Vec2) {
        this.x /= vec.x;
        this.y /= vec.y;
    }

    public dot(other: Vec2): number {
        return (this.x * other.x) + (this.y * other.y);
    }

    public magnitude(): number {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    public angle(other: Vec2): number {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }

    public lerp(other: Vec2, n: number): Vec2 {
        const x = this.x + n * (other.x - this.x);
        const y = this.y + n * (other.y - this.y);
        return new Vec2(x, y);
    }

    public rotate(origin: Vec2, theta: number): Vec2 {
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const v = this.copy();
        v.sub(origin); // translate to origin
        v.x = (v.x * cosTheta) - (v.y * sinTheta);
        v.y = (v.x * sinTheta) + (v.y * cosTheta);
        v.add(origin); // translate back
        return v;
    }
}
