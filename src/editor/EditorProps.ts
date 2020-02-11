import Scene from '../client/engine/graphics/Scene';
import Doodad from '../client/engine/Doodad';
import Graphics from '../client/engine/graphics/Graphics';
import { WorldPoint } from '../common/Point';
import Input from '../client/engine/Input';
import EditorChunkWorld from './EditorChunkWorld';
import EditorCamera from './EditorCamera';

export default class EditorProps {
    public point: WorldPoint;
    public world: EditorChunkWorld;
    public scene: Scene;
    public camera: EditorCamera;
    private _selectedDoodad: Doodad;
    public onSelectedDoodadChanged: ((doodad: Doodad) => void)[] = [];

    public get selectedDoodad(): Doodad { return this._selectedDoodad; }
    public set selectedDoodad(doodad: Doodad) {
        this._selectedDoodad = doodad;
        if (this.selectedDoodad != null) {
            Graphics.setOutlines([this.selectedDoodad.model.obj]);
        }
        this.onSelectedDoodadChanged.forEach((cb) => cb(this.selectedDoodad));
    }

    public update(delta: number): void {
        const intersects = this.camera.rcast(this.scene, Input.mousePos(), true);
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
