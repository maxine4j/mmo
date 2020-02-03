import * as THREE from 'three';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/components/Button';
import UIParent from '../engine/interface/components/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import CharacterDef from '../../common/CharacterDef';
import Panel from '../engine/interface/components/Panel';
import Label from '../engine/interface/components/Label';
import NetClient from '../engine/NetClient';
import Graphics from '../engine/graphics/Graphics';
import {
    PacketHeader, CharacterListPacket, CharacterPacket,
} from '../../common/Packet';
import Model from '../engine/graphics/Model';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import Sprite from '../engine/graphics/Sprite';
import Input, { MouseButton } from '../engine/Input';
import Engine from '../engine/Engine';
import AssetManager from '../engine/asset/AssetManager';

export default class CharSelectScene extends GameScene {
    private characters: CharacterDef[];
    private selectedChar: CharacterDef;
    private panelChars: Panel;
    private selectedModel: Model;
    private background: Sprite;
    private charSpinStartMouse: number = -1;
    private charSpinInitialRot: number = -1;

    public constructor() {
        super('char-select');
    }

    public fetchCharacerList(): void {
        NetClient.sendRecv(PacketHeader.CHAR_MYLIST)
            .then((resp: CharacterListPacket) => {
                this.characters = resp.characters;
                this.buildCharList();
                if (this.characters.length > 0) {
                    [this.selectedChar] = this.characters;
                }
            });
    }

    private buildCharList(): void {
        // add characters to the panel
        for (const char of this.characters) {
            const btnChar = new Button(this.panelChars, char.name);
            btnChar.style.position = 'initial';
            btnChar.style.marginTop = '10px';
            btnChar.style.width = '100%';
            btnChar.style.height = '60px';
            btnChar.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            btnChar.addEventListener('click', () => { this.selectedChar = char; });
            // this.addGUI(btnChar);
        }
    }

    private enterWorld(): void {
        NetClient.sendRecv(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket> this.selectedChar)
            .then(() => SceneManager.changeScene('world'));
    }

    private initGUI(): void{
        Engine.addFpsLabel();

        // build enter world button
        const btnEnterWorld = new Button(UIParent.get(), 'Enter World');
        btnEnterWorld.style.bottom = '50px';
        btnEnterWorld.style.width = '200px';
        btnEnterWorld.centreHorizontal();
        btnEnterWorld.addEventListener('click', () => this.enterWorld());
        // this.addGUI(btnEnterWorld);
        // build character list
        this.panelChars = new Panel(UIParent.get());
        this.panelChars.style.display = 'block';
        this.panelChars.style.margin = '10px 10px 60px 10px';
        this.panelChars.style.right = '0';
        this.panelChars.style.top = '0';
        this.panelChars.style.bottom = '0';
        this.panelChars.style.height = 'auto';
        this.panelChars.style.width = '300px';
        this.panelChars.style.backgroundColor = 'rgba(10, 10, 10, 0.6)';
        this.panelChars.style.borderRadius = '5px';
        this.panelChars.style.padding = '10px';
        // this.addGUI(this.panelChars);
        // realm label
        const charListLabel = new Label(this.panelChars, 'Characters');
        charListLabel.style.position = 'initial';
        charListLabel.style.display = 'block';
        charListLabel.style.fontSize = '180%';
        charListLabel.style.textAlign = 'center';
        // this.addGUI(charListLabel);

        // build new character button
        const btnCreateCharacter = new Button(this.panelChars, 'Create Character');
        btnCreateCharacter.style.position = 'fixed';
        btnCreateCharacter.style.display = 'block';
        btnCreateCharacter.style.width = '250px';
        btnCreateCharacter.style.float = 'bottom';
        btnCreateCharacter.style.bottom = '75px';
        btnCreateCharacter.style.right = '40px';
        btnCreateCharacter.addEventListener('click', () => SceneManager.changeScene('char-create'));
        // this.addGUI(btnCreateCharacter);
        // build delete character button
        const btnDeleteChar = new Button(this.panelChars, 'Delete Character');
        btnDeleteChar.style.position = 'fixed';
        btnDeleteChar.style.margin = '5px 10px';
        btnDeleteChar.style.display = 'block';
        btnDeleteChar.style.width = '190px';
        btnDeleteChar.style.float = 'bottom';
        btnDeleteChar.style.bottom = '5px';
        btnDeleteChar.style.right = '130px';
        btnDeleteChar.addEventListener('click', () => {
            console.log('Delete Character NYI');
        });
        // this.addGUI(btnDeleteChar);
        // build back button
        const btnBack = new Button(this.panelChars, 'Back');
        btnBack.style.position = 'fixed';
        btnBack.style.margin = '5px 10px';
        btnBack.style.display = 'block';
        btnBack.style.width = '120px';
        btnBack.style.bottom = '5px';
        btnBack.style.right = '0';
        btnBack.addEventListener('click', () => {
            NetClient.send(PacketHeader.AUTH_LOGOUT);
            SceneManager.changeScene('login');
        });
        // this.addGUI(btnBack);
    }

    public async init(): Promise<void> {
        this.initGUI();
        this.fetchCharacerList();

        this.scene = new Scene();
        this.camera = new Camera(45, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.z = 10;

        const light = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(light);

        // this.background = await Model.load('assets/models/ui/charselect/charselect.glb');
        // await this.background.loadAnim('stand', 'assets/models/ui/charselect/anims/charselect_Stand_0.glb');
        // this.background.animations.get('stand').play();
        // this.background.obj.position.set(0.05134603696449329, -0.26914933500212745, 5.413116343522639);
        // this.background.obj.rotation.set(-3.141592653589793, 1.0315274535897696, -3.141592653589793);
        // this.scene.add(this.background.obj);

        this.background = await Sprite.load('assets/imgs/char-select.jpg');
        this.background.scale.set(16 * 2.5, 9 * 2.5, 1);
        this.background.position.z -= 5;
        this.background.position.x += 2.5;
        this.background.position.y += 0.5;
        this.scene.add(this.background);

        this.selectedModel = await AssetManager.getModel('human');
        this.selectedModel.getAnim('Stand').then((a) => a.play());

        this.selectedModel.obj.scale.set(4, 4, 4);
        this.selectedModel.obj.translateY(-2.25);
        this.selectedModel.obj.rotateY(Graphics.toRadians(-90));
        this.scene.add(this.selectedModel.obj);

        super.init();
    }

    public final(): void {
        super.final();
        this.charSpinStartMouse = -1;
    }

    private updateCharRotation(delta: number): void {
        // start rotation
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            this.charSpinStartMouse = Input.mousePos().x;
            this.charSpinInitialRot = this.selectedModel.obj.rotation.y;
        }
        // end rotation
        if (Input.wasMousePressed(MouseButton.LEFT)) {
            this.charSpinStartMouse = -1;
        }
        if (this.charSpinStartMouse !== -1) {
            const { x, z } = this.selectedModel.obj.rotation;
            const dy = (Input.mousePos().x - this.charSpinStartMouse) * 0.01;
            this.selectedModel.obj.rotation.set(x, this.charSpinInitialRot + dy, z);
        }
    }

    public update(delta: number): void {
        this.selectedModel.update(delta);
        this.updateCharRotation(delta);
        if (Input.wasKeyPressed('1')) {
            this.selectedModel.getAnim('Stand').then((a) => a.stop());
            this.selectedModel.getAnim('EmoteReadStart').then((a) => {
                a.clampWhenFinished = true;
                a.loop = THREE.LoopOnce;
                a.play();
            });
        }
        if (Input.wasKeyPressed('2')) {
            this.selectedModel.getAnim('Stand').then((a) => a.stop());
            this.selectedModel.getAnim('EmoteReadStart').then((a) => a.stop());
            this.selectedModel.getAnim('EmoteReadLoop').then((a) => {
                a.play();
            });
        }
    }

    public draw(): void {
        super.draw();
    }
}
