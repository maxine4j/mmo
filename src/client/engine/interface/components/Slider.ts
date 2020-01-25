import { Frame } from './Frame';


export default class Slider extends Frame {
    protected element: HTMLInputElement;

    public constructor(parent: Frame, min: number, max: number, val: number, step: number = 1) {
        super('input', parent);
        this.element.type = 'range';
        this.element.min = min.toString();
        this.element.max = max.toString();
        this.element.value = val.toString();
        this.element.step = step.toString();
    }

    public get max(): number { return Number(this.element.max); }
    public set max(max: number) { this.element.max = max.toString(); }

    public get min(): number { return Number(this.element.min); }
    public set min(min: number) { this.element.min = min.toString(); }

    public get value(): number { return Number(this.element.value); }
    public set value(val: number) { this.element.value = val.toString(); }

    public get step(): number { return Number(this.element.step); }
    public set step(step: number) { this.element.step = step.toString(); }
}
