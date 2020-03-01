import { AmbientLight } from 'three';
import { Key } from 'ts-key-enum';
import {
    PacketHeader, AuthLoginPacket, ResponsePacket,
} from '../../common/Packet';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/components/Button';
import UIParent from '../engine/interface/components/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import Panel from '../engine/interface/components/Panel';
import Label from '../engine/interface/components/Label';
import TextBox from '../engine/interface/components/TextBox';
import NetClient from '../engine/NetClient';
import Dialog from '../engine/interface/components/Dialog';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Model from '../engine/graphics/Model';
import Scene from '../engine/graphics/Scene';
import AssetManager from '../engine/asset/AssetManager';

export default class SignupScene extends GameScene {
    private background: Model;
    private txtUsername: TextBox;
    private txtPassword: TextBox;
    private txtPasswordConfirm: TextBox;
    private dialog: Dialog;

    public constructor() {
        super('signup');
    }

    private signup(): void {
        if (this.txtPassword.text === this.txtPasswordConfirm.text) {
            NetClient.sendRecv(PacketHeader.AUTH_SIGNUP, <AuthLoginPacket>{
                username: this.txtUsername.text,
                password: this.txtPassword.text,
            }).then((resp: ResponsePacket) => {
                if (resp.success) {
                    const successDialog = new Dialog(
                        UIParent.get(), 'Account successfully created', false,
                        ['Return to Login'],
                        [() => SceneManager.changeScene('login')],
                    );
                    successDialog.show();
                } else {
                    this.dialog.text = resp.message;
                    this.dialog.show();
                }
            });
        } else {
            this.dialog.text = 'Passwords do not match';
            this.dialog.show();
        }
    }

    public initGUI(): void {
        const panel = new Panel(UIParent.get());
        panel.style.border = '1px solid white';
        panel.style.width = '300px';
        panel.style.height = '300px';
        panel.style.padding = '20px';
        panel.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
        panel.centreHorizontal();
        panel.centreVertical();

        const lblUsername = new Label(panel, 'Email');
        lblUsername.style.position = 'initial';
        lblUsername.style.width = '100%';
        lblUsername.style.color = '#e6cc80';
        lblUsername.style.fontSize = '130%';

        this.txtUsername = new TextBox(panel);
        this.txtUsername.style.position = 'initial';
        this.txtUsername.style.width = '100%';
        this.txtUsername.style.backgroundColor = 'rgba(10,10,10,0.8)';
        this.txtUsername.text = '';

        const lblPassword = new Label(panel, 'Password');
        lblPassword.style.position = 'initial';
        lblPassword.style.width = '100%';
        lblPassword.style.color = '#e6cc80';
        lblPassword.style.fontSize = '130%';

        this.txtPassword = new TextBox(panel, 'password');
        this.txtPassword.style.position = 'initial';
        this.txtPassword.style.width = '100%';
        this.txtPassword.style.backgroundColor = 'rgba(10,10,10,0.8)';
        this.txtPassword.text = '';

        const lblPasswordConfirm = new Label(panel, 'Confirm Password');
        lblPasswordConfirm.style.position = 'initial';
        lblPasswordConfirm.style.width = '100%';
        lblPasswordConfirm.style.color = '#e6cc80';
        lblPasswordConfirm.style.fontSize = '130%';

        this.txtPasswordConfirm = new TextBox(panel, 'password');
        this.txtPasswordConfirm.style.position = 'initial';
        this.txtPasswordConfirm.style.width = '100%';
        this.txtPasswordConfirm.style.backgroundColor = 'rgba(10,10,10,0.8)';
        this.txtPasswordConfirm.text = '';
        this.txtPasswordConfirm.addEventListener('keypress', (self: TextBox, ev: KeyboardEvent) => {
            if (ev.key === Key.Enter) this.signup();
        });

        this.dialog = new Dialog(UIParent.get(), '', false);

        const btnBack = new Button(panel, 'Back');
        btnBack.style.position = 'initial';
        btnBack.style.width = '145px';
        btnBack.style.marginTop = '110px';
        btnBack.style.marginRight = '10px';
        btnBack.addEventListener('click', () => SceneManager.changeScene('login'));

        const btnSignup = new Button(panel, 'Sign up');
        btnSignup.style.position = 'initial';
        btnSignup.style.width = '145px';
        btnSignup.style.marginTop = '110px';
        btnSignup.addEventListener('click', () => this.signup());
    }

    public async init(): Promise<void> {
        this.initGUI();

        this.scene = new Scene();
        this.camera = new Camera(45, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 2000);

        const light = new AmbientLight(0xffffff, 3);
        light.position.set(0, 0, 1).normalize();
        this.scene.add(light);

        // this.background = await Model.loadDef('assets/models/ui/mainmenu/mainmenu.model.json');
        // this.scene.add(this.background.obj);

        this.background = await AssetManager.getModel('mainmenu');
        this.scene.add(this.background.obj);

        this.camera.position.set(5.095108853409366, -1.049448850028543, -2.400366781879153);
        this.camera.rotation.set(2.2974621772131085, 1.1874227779871385, -2.335010669610211);

        super.init();
    }

    public final(): void {
        super.final();
    }

    public update(delta: number): void {

    }

    public draw(): void {
        super.draw();
    }
}
