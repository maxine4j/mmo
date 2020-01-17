import WorldPoint from './WorldPoint';
import ChunkWorld from '../client/engine/ChunkWorld';
import EditorChunk from './EditorChunk';
import Scene from '../client/engine/graphics/Scene';
import Camera from '../client/engine/graphics/Camera';
import Doodad from '../client/engine/Doodad';
import Graphics from '../client/engine/graphics/Graphics';

export default class EditorProps {
    public point: WorldPoint;
    public world: ChunkWorld;
    public chunk: EditorChunk;
    public scene: Scene;
    public camera: Camera;
    private _selectedDoodad: Doodad;
    public onSelectedDoodadChanged: ((doodad: Doodad) => void)[] = [];

    public constructor(camera: Camera, scene: Scene) {
        this.camera = camera;
        this.scene = scene;
        this.point = new WorldPoint();
    }

    public get selectedDoodad(): Doodad { return this._selectedDoodad; }
    public set selectedDoodad(doodad: Doodad) {
        this._selectedDoodad = doodad;
        Graphics.setOutlines([this.selectedDoodad.model.obj]);
        this.onSelectedDoodadChanged.forEach((cb) => cb(this.selectedDoodad));
    }
}
