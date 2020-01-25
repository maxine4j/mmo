import { Frame } from './Frame';

export default class ProgressBar extends Frame {
    protected element: HTMLProgressElement;
    private _max: number;
    private _min: number;
    private _value: number;

    public constructor(parent: Frame, min: number = 0, max: number = 1, val: number = 0) {
        super('progress', parent);
        this.element.max = 1;

        this._min = min;
        this._max = max;
        this._value = val;
        this.updateBar();
    }

    private updateBar(): void {
        // adjust max and val so that min is always 0
        const dmax = this.max + this.min;
        const dval = this.value + this.min;
        // set element value between 0 and 1
        if (dmax !== 0) {
            this.element.value = dval / dmax;
        }
    }

    public get min(): number { return this._min; }
    public set min(min: number) {
        this._min = min;
        this.updateBar();
    }

    public get max(): number { return this._max; }
    public set max(max: number) {
        this._max = max;
        this.updateBar();
    }

    public get value(): number { return this._value; }
    public set value(val: number) {
        this._value = val;
        this.updateBar();
    }


    public get text(): string {
        return this.element.textContent;
    }
    public set text(text: string) {
        this.element.textContent = text;
    }
}
