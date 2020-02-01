import { Point } from '../../../../common/Point';
import Panel from './Panel';
import { Frame, FrameStrata } from './Frame';
import Label from './Label';
import Graphics from '../../graphics/Graphics';

export default class Tooltip extends Panel {
    protected element: HTMLDivElement;
    private lines: Label[] = [];

    public constructor(parent: Frame) {
        super(parent);

        this.style.padding = '5px';

        this.strata = FrameStrata.TOOLTIP;
        this.style.backgroundColor = 'rgba(0,0,0,0.8)';
        this.hide();
    }

    public position(point: Point): void {
        this.style.position = 'fixed';
        this.style.right = `${Graphics.viewportWidth - point.x + 5}px`;
        this.style.bottom = `${Graphics.viewportHeight - point.y + 5}px`;
    }

    public open(point: Point): void {
        this.position(point);
        this.style.zIndex = (<number> this.strata).toString();
        this.show();
    }

    public addLine(text: string): void {
        const lbl = new Label(this, text);
        lbl.style.position = 'initial';
        lbl.style.display = 'block';
        this.lines.push(lbl);
    }

    public addBreak(): void {
        const br = document.createElement('br');
        this.element.appendChild(br);
    }
}
