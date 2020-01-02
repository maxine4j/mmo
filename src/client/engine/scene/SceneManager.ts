import Scene from './Scene';

export default class SceneManager {
    private scenes: Map<string, Scene>;
    private _currentScene: Scene;

    constructor() {
        this.scenes = new Map();
    }

    get currentScene(): Scene {
        return this._currentScene;
    }
    set currentScene(scene: Scene) {
        if (this.currentScene !== undefined) this.currentScene.final();
        this._currentScene = scene;
        this.currentScene.init();
    }

    addScene(scene: Scene) {
        this.scenes.set(scene.id, scene);
    }

    getScene(key: string): Scene {
        return this.scenes.get(key);
    }
}
