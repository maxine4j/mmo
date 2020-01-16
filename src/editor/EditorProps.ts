import WorldPoint from './WorldPoint';
import ChunkWorld from '../client/engine/ChunkWorld';
import EditorChunk from './EditorChunk';
import Scene from '../client/engine/graphics/Scene';
import Camera from '../client/engine/graphics/Camera';

export default class EditorProps {
    public point: WorldPoint;
    public world: ChunkWorld;
    public chunk: EditorChunk;
    public scene: Scene;
    public camera: Camera;
}
