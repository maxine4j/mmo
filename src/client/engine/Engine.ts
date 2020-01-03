import Input from './Input';
import Graphics from './graphics/Graphics';
import NetClient from './NetClient';
import SceneManager from './scene/SceneManager';
import Scene from './scene/Scene';
import Label from './interface/Label';
import UIParent from './interface/UIParent';

export default class Engine {
    private static lastrender: number = 0;
    private static sceneManager: SceneManager;
    private static lblFps: Label;

    public static init() {
        // initialise modules
        Input.init();
        Graphics.init();
        NetClient.init();

        // initialise scene manager
        Engine.sceneManager = new SceneManager();

        // add warning leaving page
        // window.onbeforeunload = () => 'Are you sure you want to quit?';

        this.lblFps = new Label('lbl-fps', UIParent.get(), '');

        // prevent default context menu
        const body = document.getElementById('body');
        body.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
        });
    }

    public static start() {
        window.requestAnimationFrame(Engine.loop);
    }

    public static addScene(scene: Scene) {
        this.sceneManager.addScene(scene);
        if (!this.sceneManager.currentScene) {
            this.sceneManager.currentScene = scene;
        }
    }

    private static loop(timestamp: number) {
        const delta: number = timestamp - Engine.lastrender;

        Engine.sceneManager.currentScene.update(delta);
        Input.afterUpdate();
        Engine.lblFps.text = Graphics.calcFPS(delta).toFixed(2);
        Engine.sceneManager.currentScene.draw();

        Engine.lastrender = timestamp;
        window.requestAnimationFrame(Engine.loop);
    }
}
