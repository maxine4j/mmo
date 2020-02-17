import { Point } from '../../common/Point';
import { DoodadDef } from '../../common/ChunkDef';
import Chunk from './Chunk';

export default class Interactable {
    private chunk: Chunk;
    public data: DoodadDef;
    public position: Point;

    public constructor(def: DoodadDef, chunk: Chunk) {
        this.data = def;
        this.chunk = chunk;

        const offset = this.chunk.worldOffset;
        this.position = new Point(offset.x + this.data.x, offset.y + this.data.y);
    }
}
