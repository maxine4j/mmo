import { AmbientLight } from 'three';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/Button';
import SceneManager from '../engine/scene/SceneManager';
import Panel from '../engine/interface/Panel';
import NetClient from '../engine/NetClient';
import Graphics from '../engine/graphics/Graphics';
import Model from '../engine/graphics/Model';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import Sprite from '../engine/graphics/Sprite';
import UIParent from '../engine/interface/UIParent';

export default class WorldScene extends GameScene {
    private panelChars: Panel;
    private selectedModel: Model;
    private background: Sprite;
    private charSpinStartMouse: number = -1;
    private charSpinInitialRot: number = -1;

    public constructor() {
        super('char-select');
    }

    private initGUI() {
        // build back button
        const btnBack = new Button('btn-back', UIParent.get(), 'Back');
        btnBack.style.position = 'fixed';
        btnBack.style.margin = '5px 10px';
        btnBack.style.display = 'block';
        btnBack.style.width = '120px';
        btnBack.style.bottom = '5px';
        btnBack.style.right = '0';
        btnBack.addEventListener('click', () => {
            NetClient.logout();
            SceneManager.changeScene('char-select');
        });
        this.addGUI(btnBack);
    }

    public async init() {
        this.initGUI();

        this.scene = new Scene();
        this.camera = new Camera(75, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.z = 5;

        const light = new AmbientLight(0xffffff, 3);
        light.position.set(0, 0, 1).normalize();
        this.scene.add(light);

        this.selectedModel = await Model.load('assets/models/human/human.glb');
        await this.selectedModel.loadAnims([
            ['run', 'assets/models/human/anims/human_Run_2.glb'],
            ['stand', 'assets/models/human/anims/human_Stand_0.glb'],
            ['walk', 'assets/models/human/anims/human_Walk_1.glb'],
        ]);
        this.selectedModel.animations.get('stand').play();

        this.selectedModel.obj.scale.set(4, 4, 4);
        this.selectedModel.obj.translateY(-2.25);
        this.selectedModel.obj.rotateY(Graphics.toRadians(-90));
        this.scene.add(this.selectedModel.obj);
    }

    public final() {
        super.final();
        this.charSpinStartMouse = -1;
    }

    public update(delta: number) {
        this.selectedModel.update(delta);
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
