import * as THREE from 'three';
import { AuthLoginRespPacket } from '../../common/Packet';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/Button';
import UIParent from '../engine/interface/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import Panel from '../engine/interface/Panel';
import Label from '../engine/interface/Label';
import TextBox from '../engine/interface/TextBox';
import NetClient from '../engine/NetClient';
import Dialog from '../engine/interface/Dialog';
import Engine from '../engine/Engine';
import Model from '../engine/graphics/Model';
import backgroundModel from '../assets/models/ui_mainmenu.glb';
import Graphics from '../engine/graphics/Graphics';

export default class LoginScene extends GameScene {
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private background: Model;

    public constructor() {
        super('login');
    }

    public initGUI() {
        const panel = new Panel('panel-login', UIParent.get());
        panel.style.border = '1px solid white';
        panel.style.width = '300px';
        panel.style.height = '200px';
        panel.style.padding = '20px';
        panel.style.backgroundColor = 'rgba(10, 10, 10, 0.5)';
        panel.centreHorizontal();
        panel.centreVertical();
        this.addGUI(panel);

        const lblUsername = new Label('lbl-username', panel, 'Account Name');
        lblUsername.style.position = 'initial';
        lblUsername.style.width = '100%';
        lblUsername.style.color = '#e6cc80';
        lblUsername.style.fontSize = '130%';
        this.addGUI(lblUsername);

        const txtUsername = new TextBox('txt-username', panel);
        txtUsername.style.position = 'initial';
        txtUsername.style.width = '100%';
        txtUsername.style.backgroundColor = 'rgba(10,10,10,0.8)';
        txtUsername.text = 'arwic';
        this.addGUI(txtUsername);

        const lblPassword = new Label('lbl-username', panel, 'Account Password');
        lblPassword.style.position = 'initial';
        lblPassword.style.width = '100%';
        lblPassword.style.color = '#e6cc80';
        lblPassword.style.fontSize = '130%';
        this.addGUI(lblPassword);

        const txtPassword = new TextBox('txt-password', panel, 'password');
        txtPassword.style.position = 'initial';
        txtPassword.style.width = '100%';
        txtPassword.style.backgroundColor = 'rgba(10,10,10,0.8)';
        txtPassword.text = 'asd';
        this.addGUI(txtPassword);

        const dialog = new Dialog('dialog-login-err', UIParent.get(), '', false);
        this.addGUI(dialog);

        const btnLogin = new Button('btn-login', panel, 'Login');
        btnLogin.style.width = '150px';
        btnLogin.centreHorizontal();
        btnLogin.style.marginTop = '30px';
        btnLogin.addEventListener('click', (self: Button, ev: MouseEvent) => {
            NetClient.login(txtUsername.text, txtPassword.text, (resp: AuthLoginRespPacket) => {
                if (resp.success) {
                    Engine.account = resp.account;
                    SceneManager.changeScene('char-select');
                } else {
                    console.log(`Failed to log in: ${resp.message}`);
                    dialog.setText(resp.message);
                    dialog.show();
                }
            });
        });
        this.addGUI(btnLogin);
    }

    public async init() {
        this.initGUI();

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.z = 3;

        const light = new THREE.AmbientLight(0xffffff, 3);
        light.position.set(0, 0, 1).normalize();
        this.scene.add(light);

        this.background = await Model.loadGLTF(backgroundModel);
        this.background.obj.rotateY(-1.6);
        this.scene.add(this.background.obj);
    }

    public final() {

    }

    public update(delta: number) {

    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
