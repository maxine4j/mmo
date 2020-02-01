import GameScene from './GameScene';
import UIParent from '../interface/components/UIParent';

export default class SceneManager {
    private static scenes: Map<string, GameScene>;
    private static _current: GameScene;

    public static init(): void {
        this.scenes = new Map();
    }

    public static get current(): GameScene {
        return this._current;
    }
    public static set current(scene: GameScene) {
        if (this.current !== undefined) {
            this.current.final();
            UIParent.get().clear();
        }

        scene.init().then(() => {
            this._current = scene;
        });
    }

    public static addScene(scene: GameScene): void {
        this.scenes.set(scene.id, scene);
        if (this.scenes.size === 1) {
            this.current = scene;
        }
    }

    public static getScene(key: string): GameScene {
        return this.scenes.get(key);
    }

    public static changeScene(key: string): void {
        this.current = this.getScene(key);
    }
}
