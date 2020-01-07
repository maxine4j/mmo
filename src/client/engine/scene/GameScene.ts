import { Frame } from '../interface/Frame';
import Scene from '../graphics/Scene';
import Camera from '../graphics/Camera';

export default abstract class GameScene {
    public readonly id: string;
    protected gui: Map<string, Frame>;
    protected scene: Scene;
    protected camera: Camera;

    public constructor(id: string) {
        this.id = id;
        this.gui = new Map();
    }

    protected addGUI(frame: Frame) {
        this.gui.set(frame.id, frame);
    }

    public clearGUI() {
        for (const [_, f] of this.gui) {
            f.destroy();
        }
    }

    public abstract async init(): Promise<void>;

    public final() {
        this.scene.clear();
    }

    public abstract update(delta: number): void;

    public abstract draw(): void;
}
