import { Frame } from '../interface/components/Frame';
import Scene from '../graphics/Scene';
import Camera from '../graphics/Camera';
import Graphics from '../graphics/Graphics';

export default abstract class GameScene {
    public readonly id: string;
    protected gui: Map<string, Frame>;
    protected scene: Scene;
    protected camera: Camera;

    public constructor(id: string) {
        this.id = id;
        this.gui = new Map();
    }

    protected addGUI(frame: Frame): void {
        this.gui.set(frame.id, frame);
    }

    public clearGUI(): void {
        for (const [_, f] of this.gui) {
            f.dispose();
        }
    }

    // eslint-disable-next-line require-await
    public async init(): Promise<void> {
        Graphics.initScene(this.scene, this.camera);
    }

    public final(): void {
        if (this.scene) {
            this.scene.clear();
        }
        Graphics.clear();
    }

    public abstract update(delta: number): void;

    public draw(): void {
        Graphics.render();
    }
}
