import Stats from 'stats.js';
import Input from './Input';
import Graphics from './graphics/Graphics';
import NetClient from './NetClient';
import SceneManager from './scene/SceneManager';
import GameScene from './scene/GameScene';
import UIParent from './interface/components/UIParent';

export default class Engine {
    private static lastrender: number = 0;
    private static stats: Stats;

    public static init(enableNetworking: boolean = true): void {
        // initialise modules
        Graphics.init();
        Input.init(Graphics.renderer.domElement);
        if (enableNetworking) {
            NetClient.init();
        }
        SceneManager.init();

        // add warning leaving page
        // window.onbeforeunload = () => 'Are you sure you want to quit?';

        UIParent.get().clear();

        // prevent default context menu
        const body = document.getElementById('body');
        body.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
        });

        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+ custom
        document.body.appendChild(this.stats.dom);
    }

    public static start(): void {
        window.requestAnimationFrame(this.loop);
    }

    public static addScene(scene: GameScene): void {
        SceneManager.addScene(scene);
    }

    public static addFpsLabel(): void {
        // UIParent.get().addChild(this.lblFps);
    }

    private static loop(timestamp: number): void {
        Engine.stats.begin();

        const delta: number = (timestamp - Engine.lastrender) / 1000;
        if (SceneManager.current) {
            SceneManager.current.update(delta);
            Input.afterUpdate();
            // Engine.lblFps.text = Graphics.calcFPS(delta).toFixed(2);
            SceneManager.current.draw();
        }
        Engine.lastrender = timestamp;

        Engine.stats.end();
        window.requestAnimationFrame(Engine.loop);
    }
}
