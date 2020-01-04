import Scene from './Scene';

export default class SceneManager {
    private static scenes: Map<string, Scene>;
    private static _current: Scene;

    public static init() {
        this.scenes = new Map();
    }

    public static get current(): Scene {
        return this._current;
    }
    public static set current(scene: Scene) {
        if (this.current !== undefined) {
            this.current.final();
            this.current.clearGUI();
        }
        this._current = scene;
        this.current.init();
    }

    public static addScene(scene: Scene) {
        this.scenes.set(scene.id, scene);
        if (!this.current) {
            this.current = scene;
        }
    }

    public static getScene(key: string): Scene {
        return this.scenes.get(key);
    }

    public static changeScene(key: string) {
        this.current = this.getScene(key);
    }
}
