import Int from './Integer';

export default class Rect {
    public _x: Int;
    public _y: Int;
    public _width: Int;
    public _height: Int;

    public constructor(x: number, y: number, width: number = 0, height: number = 0) {
        this._x = new Int(x);
        this._y = new Int(y);
        this._width = new Int(width);
        this._height = new Int(height);
    }

    public get x(): number { return this._x.i; }
    public set x(val: number) { this._x.i = val; }

    public get y(): number { return this._y.i; }
    public set y(val: number) { this._y.i = val; }

    public get width(): number { return this._width.i; }
    public set width(val: number) { this._width.i = val; }

    public get height(): number { return this._height.i; }
    public set height(val: number) { this._height.i = val; }
}
