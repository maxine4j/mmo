import Scene from './Scene';

export default class SceneManager {
    private scenes: Map<string, Scene>;
    private _currentScene: Scene;

    public constructor() {
        this.scenes = new Map();
    }

    public get currentScene(): Scene {
        return this._currentScene;
    }
    public set currentScene(scene: Scene) {
        if (this.currentScene !== undefined) {
            this.currentScene.final();
            this.currentScene.clearGUI();
        }
        this._currentScene = scene;
        this.currentScene.init();
    }

    public addScene(scene: Scene) {
        scene.manager = this;
        this.scenes.set(scene.id, scene);
    }

    public getScene(key: string): Scene {
        return this.scenes.get(key);
    }

    public changeScene(key: string) {
        this.currentScene = this.getScene(key);
    }
}
