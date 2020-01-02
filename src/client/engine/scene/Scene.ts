import SceneManager from './SceneManager';
import { Frame } from '../interface/Frame';

export default abstract class Scene {
    readonly id: string;
    readonly manager: SceneManager;
    protected gui: Map<string, Frame>;

    constructor(id: string, manager: SceneManager) {
        this.id = id;
        this.gui = new Map();
        this.manager = manager;
        this.manager.addScene(this);
    }

    protected addGUI(frame: Frame) {
        this.gui.set(frame.id, frame);
    }

    protected clearGUI() {
        for (const [_, f] of this.gui) {
            f.destroy();
        }
    }

    abstract init(): void;

    abstract final(): void;

    abstract update(delta: number): void;

    abstract draw(): void;
}
