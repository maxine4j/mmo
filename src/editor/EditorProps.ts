import { EventEmitter } from 'events';
import Scene from '../client/engine/graphics/Scene';
import Doodad from '../client/engine/Doodad';
import Graphics from '../client/engine/graphics/Graphics';
import { WorldPoint } from '../common/Point';
import Input from '../client/engine/Input';
import EditorChunkWorld from './EditorChunkWorld';
import EditorCamera from './EditorCamera';

type EditorPropsEvent = 'selectedDoodadChanged';

export default class EditorProps {
    private eventEmitter: EventEmitter = new EventEmitter();
    public point: WorldPoint;
    public world: EditorChunkWorld;
    public scene: Scene;
    public camera: EditorCamera;
    private _selectedDoodad: Doodad;

    public get selectedDoodad(): Doodad { return this._selectedDoodad; }
    public set selectedDoodad(doodad: Doodad) {
        this._selectedDoodad = doodad;
        if (this.selectedDoodad != null) {
            Graphics.setOutlines([this.selectedDoodad.model.obj]);
        }
        this.emit('selectedDoodadChanged', this, this.selectedDoodad);
    }

    public on(event: EditorPropsEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: EditorPropsEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: EditorPropsEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public update(delta: number): void {
        const intersects = this.camera.rcast(this.scene.children, Input.mousePos(), true);
        let idx = 0;
        while (idx < intersects.length) {
            const int = intersects[idx++];
            if (int.object.name === 'terrain') {
                this.point = new WorldPoint(int.point, this.world.w);
                break;
            }
        }
        this.world.update(delta);
    }
}
