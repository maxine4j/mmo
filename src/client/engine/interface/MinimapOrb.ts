import { EventEmitter } from 'events';
import Panel from './components/Panel';
import ImageFrame from './components/ImageFrame';
import Minimap from './Minimap';
import Label from './components/Label';

type MinimapOrbEvent = 'click';

const bgColNormal = 'rgba(0,0,0,0.2)';
const bgColOver = 'rgba(0,0,0,0.4)';

export default class MinimapOrb extends Panel {
    private eventEmitter: EventEmitter = new EventEmitter();
    private img: ImageFrame;
    private minimap: Minimap;
    private _active: boolean;
    private _value: number;
    private lblValue: Label;
    public get active(): boolean { return this._active; }
    public get value(): number { return this._value; }
    public set value(val: number) {
        this._value = val;
        this.lblValue.text = this._value.toString();
    }

    public constructor(minimap: Minimap, active: boolean, value: number, imgSrc: string, activatable: boolean = true) {
        super(minimap);
        this.minimap = minimap;
        this._active = active;
        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.backgroundColor = bgColNormal;
        this.width = 70;
        this.style.borderRadius = '5px';
        this.style.margin = '2px';

        this.img = new ImageFrame(this, imgSrc);
        this.img.style.position = 'initial';
        this.img.style.borderRadius = '100%';
        this.img.style.border = '5px solid';
        this.img.width = 32;
        this.img.width = 32;
        if (activatable) {
            this.addEventListener('click', () => {
                this._active = !this.active;
                this.updateBorder();
                this.emit('click', this, this.active);
            });
            this.addEventListener('mouseenter', () => { this.style.backgroundColor = bgColOver; });
            this.addEventListener('mouseleave', () => { this.style.backgroundColor = bgColNormal; });
        }
        this.updateBorder();

        this.lblValue = new Label(this, 'V');
        this.lblValue.style.position = 'initial';
        this.value = value;
    }

    private updateBorder(): void {
        if (this.active) {
            this.img.style.borderColor = 'rgba(255,255,0,1)';
        } else {
            this.img.style.borderColor = 'rgba(0,0,0,0)';
        }
    }

    public on(event: MinimapOrbEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: MinimapOrbEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    private emit(event: MinimapOrbEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }
}
