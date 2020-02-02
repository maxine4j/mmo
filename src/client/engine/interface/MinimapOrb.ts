import { EventEmitter } from 'events';
import Panel from './components/Panel';
import ImageFrame from './components/ImageFrame';
import Minimap from './Minimap';

type MinimapOrbEvent = 'click';

export default class MinimapOrb extends Panel {
    private eventEmitter: EventEmitter = new EventEmitter();
    private img: ImageFrame;
    private minimap: Minimap;
    private _active: boolean;
    public get active(): boolean { return this._active; }

    public constructor(minimap: Minimap, active: boolean, imgSrc: string) {
        super(minimap);
        this.minimap = minimap;
        this._active = active;
        this.img = new ImageFrame(this, imgSrc);
        this.img.style.borderRadius = '100%';
        this.img.style.border = '5px solid';
        this.addEventListener('click', () => {
            this._active = !this.active;
            this.updateBorder();
            this.emit('click', this, this.active);
        });
        this.updateBorder();
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
