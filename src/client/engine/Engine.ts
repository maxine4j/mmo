import Input from './Input';
import Graphics from './graphics/Graphics';
import NetClient from './NetClient';
import SceneManager from './scene/SceneManager';
import GameScene from './scene/GameScene';
import Label from './interface/components/Label';
import UIParent from './interface/components/UIParent';
import AccountDef from '../../common/AccountDef';

export default class Engine {
    private static lastrender: number = 0;
    private static lblFps: Label;
    private static _account: AccountDef;

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
        this.lblFps = new Label('lbl-fps', UIParent.get(), '');

        // prevent default context menu
        const body = document.getElementById('body');
        body.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
        });
    }

    public static get account(): AccountDef {
        return this._account;
    }
    public static set account(account: AccountDef) {
        this._account = account;
    }

    public static start(): void {
        window.requestAnimationFrame(this.loop);
    }

    public static addScene(scene: GameScene): void {
        SceneManager.addScene(scene);
    }

    private static loop(timestamp: number): void { // use Engine instead of this as requestAnimationFrame changes it
        const delta: number = (timestamp - Engine.lastrender) / 1000;

        if (SceneManager.current) {
            SceneManager.current.update(delta);
            Input.afterUpdate();
            Engine.lblFps.text = Graphics.calcFPS(delta).toFixed(2);
            SceneManager.current.draw();
        }

        Engine.lastrender = timestamp;
        window.requestAnimationFrame(Engine.loop);
    }
}
