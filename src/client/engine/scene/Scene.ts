import { Frame } from '../interface/Frame';

export default abstract class Scene {
    public readonly id: string;
    protected gui: Map<string, Frame>;

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

    public abstract init(): void;

    public abstract final(): void;

    public abstract update(delta: number): void;

    public abstract draw(): void;
}
