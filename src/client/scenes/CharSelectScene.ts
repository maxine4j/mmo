import * as THREE from 'three';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/Button';
import UIParent from '../engine/interface/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import Character from '../../common/models/Character';
import Panel from '../engine/interface/Panel';
import Label from '../engine/interface/Label';
import NetClient from '../engine/NetClient';
import Graphics from '../engine/graphics/Graphics';
import { PacketHeader, CharactersRespPacket } from '../../common/Packet';
import Model from '../engine/graphics/Model';
import HumanModel from '../engine/graphics/HumanModel';
import duck from '../assets/models/Duck.gltf';
import duckBin from '../assets/models/Duck0.bin';
import duckPng from '../assets/models/DuckCM.png';
import jadModel from '../assets/models/jad.glb';
import humanModelFbx from '../assets/models/human.fbx';
import manModel from '../assets/models/man/man.glb';
import guitarModel from '../assets/models/man/guitar.glb';
import walkingModel from '../assets/models/man/walking.glb';
import ybotRunModel from '../assets/models/ybot/run.glb';
import ybotModel from '../assets/models/ybot/ybot.glb';
import charSelectBgModel from '../assets/models/ui_characterselect.glb';

export default class CharSelectScene extends GameScene {
    private characters: Character[];
    private _selectedChar: Character;
    private panelChars: Panel;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private selectedModel: Model;
    private runModel: Model;
    private background: Model;

    public constructor() {
        super('char-select');
    }

    public fetchCharacerList() {
        NetClient.onNext(PacketHeader.CHAR_MYLIST, (resp: CharactersRespPacket) => {
            this.characters = resp.characters;
            this.buildCharList();
        });
        NetClient.send(PacketHeader.CHAR_MYLIST);
    }

    public get selectedChar(): Character {
        return this._selectedChar;
    }
    public set selectedChar(char: Character) {
        this._selectedChar = this.selectedChar;
    }

    private buildCharList() {
        // add characters to the panel
        for (const char of this.characters) {
            const btnChar = new Button(`btn-char-${char.name}`, this.panelChars, char.name);
            btnChar.style.position = 'initial';
            btnChar.style.marginTop = '10px';
            btnChar.style.width = '100%';
            btnChar.style.height = '60px';
            btnChar.style.backgroundColor = 'rgba(0, 0, 0, 0)';
            this.addGUI(btnChar);
        }
    }

    private initGUI() {
        // build enter world button
        const btnEnterWorld = new Button('btn-enter-world', UIParent.get(), 'Enter World');
        btnEnterWorld.style.bottom = '50px';
        btnEnterWorld.style.width = '200px';
        btnEnterWorld.centreHorizontal();
        btnEnterWorld.addEventListener('click', () => {
            console.log('Entering world...');
        });
        this.addGUI(btnEnterWorld);
        // build character list
        this.panelChars = new Panel('panel-characters', UIParent.get());
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
        this.addGUI(this.panelChars);
        // realm label
        const charListLabel = new Label('lbl-characters', this.panelChars, 'Characters');
        charListLabel.style.position = 'initial';
        charListLabel.style.display = 'block';
        charListLabel.style.fontSize = '180%';
        charListLabel.style.textAlign = 'center';
        this.addGUI(charListLabel);

        // build new character button
        const btnCreateCharacter = new Button('btn-create-character', this.panelChars, 'Create Character');
        btnCreateCharacter.style.position = 'fixed';
        btnCreateCharacter.style.display = 'block';
        btnCreateCharacter.style.width = '250px';
        btnCreateCharacter.style.float = 'bottom';
        btnCreateCharacter.style.bottom = '75px';
        btnCreateCharacter.style.right = '40px';
        btnCreateCharacter.addEventListener('click', () => {
            SceneManager.changeScene('char-create');
        });
        this.addGUI(btnCreateCharacter);
        // build delete character button
        const btnDeleteChar = new Button('btn-delete-character', this.panelChars, 'Delete Character');
        btnDeleteChar.style.position = 'fixed';
        btnDeleteChar.style.margin = '5px 10px';
        btnDeleteChar.style.display = 'block';
        btnDeleteChar.style.width = '185px';
        btnDeleteChar.style.float = 'bottom';
        btnDeleteChar.style.bottom = '5px';
        btnDeleteChar.style.right = '130px';
        btnDeleteChar.addEventListener('click', () => {
            console.log('Delete character...');
        });
        this.addGUI(btnDeleteChar);
        // build back button
        const btnBack = new Button('btn-back', this.panelChars, 'Back');
        btnBack.style.position = 'fixed';
        btnBack.style.margin = '5px 10px';
        btnBack.style.display = 'block';
        btnBack.style.width = '120px';
        btnBack.style.bottom = '5px';
        btnBack.style.right = '0';
        btnBack.addEventListener('click', () => {
            NetClient.logout();
            SceneManager.changeScene('login');
        });
        this.addGUI(btnBack);
    }

    public async init() {
        this.initGUI();
        this.fetchCharacerList();

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.z = 5;

        const light = new THREE.AmbientLight(0xffffff, 3);
        light.position.set(0, 0, 1).normalize();
        this.scene.add(light);

        this.background = await Model.load(charSelectBgModel);
        this.background.obj.rotateY(-1.5);
        this.background.obj.rotateZ(0.2);
        this.background.obj.translateY(-2.5);
        this.background.obj.scale.addScalar(5);
        this.scene.add(this.background.obj);

        // run animation from seperate files!!!
        this.selectedModel = await Model.load(ybotModel);
        this.runModel = await Model.load(ybotRunModel);
        const action = this.selectedModel.mixer.clipAction(this.runModel.gltf.animations[0]);
        action.play();

        this.selectedModel.obj.scale.set(0.02, 0.02, 0.02);
        this.selectedModel.obj.translateY(-2.25);
        // this.selectedModel.playAnim('mixamo.com');
        // this.selectedModel.playAnim('legs.001Action');
        this.scene.add(this.selectedModel.obj);
    }

    public final() {

    }

    public update(delta: number) {
        // this.selectedModel.obj.rotation.y += 1 * delta;
        this.selectedModel.update(delta);
    }

    public draw() {
        Graphics.render(this.scene, this.camera);
    }
}
