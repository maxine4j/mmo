export default class Int {
    private _val: number;

    public constructor(val: number) {
        this._val = Math.floor(val);
    }

    public get i(): number {
        return this._val;
    }
    public set i(val: number) {
        this._val = Math.floor(val);
    }
}
