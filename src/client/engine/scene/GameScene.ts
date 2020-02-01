import Scene from '../graphics/Scene';
import Camera from '../graphics/Camera';
import Graphics from '../graphics/Graphics';

export default abstract class GameScene {
    public readonly id: string;
    protected scene: Scene;
    protected camera: Camera;

    public constructor(id: string) {
        this.id = id;
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
