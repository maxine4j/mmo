import * as THREE from 'three';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/components/Button';
import UIParent from '../engine/interface/components/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import CharacterDef, { Race } from '../../common/definitions/CharacterDef';
import Panel from '../engine/interface/components/Panel';
import Label from '../engine/interface/components/Label';
import NetClient from '../engine/NetClient';
import { PacketHeader, CharacterPacket, ResponsePacket } from '../../common/Packet';
import TextBox from '../engine/interface/components/TextBox';
import Dialog from '../engine/interface/components/Dialog';
import Camera from '../engine/graphics/Camera';
import Scene from '../engine/graphics/Scene';
import Graphics from '../engine/graphics/Graphics';
import Engine from '../engine/Engine';

export default class CharCreateScene extends GameScene {
    private txtName: TextBox;
    private dialog: Dialog;

    public constructor() {
        super('char-create');
    }

    private characterCharacter(): void {
        const name = this.txtName.text;
        if (name.length >= 2 && name.length <= 12) {
            const character = <CharacterDef>{
                name: this.txtName.text,
                race: Race.HUMAN,
            };
            NetClient.sendRecv(PacketHeader.CHAR_CREATE, <CharacterPacket>character)
                .then((p: ResponsePacket) => {
                    if (p.success) {
                        SceneManager.changeScene('char-select');
                    } else {
                        this.dialog.text = p.message;
                        this.dialog.show();
                    }
                });
        }
    }

    private initGUI(): void {
        Engine.addFpsLabel();

        // build dialog
        this.dialog = new Dialog(UIParent.get(), '', false);

        // build bottom middle panel
        const panelMid = new Panel(UIParent.get());
        panelMid.style.width = '600px';
        panelMid.style.bottom = '10px';
        panelMid.centreHorizontal();
        // build create button
        const btnCreate = new Button(panelMid, 'Create');
        btnCreate.style.position = 'initial';
        btnCreate.style.display = 'float';
        btnCreate.style.float = 'right';
        btnCreate.style.width = '150px';
        btnCreate.addEventListener('click', () => {
            this.characterCharacter();
        });
        // build name label
        const lblName = new Label(panelMid, 'Name');
        lblName.style.height = '30px';
        lblName.style.bottom = '80px';
        lblName.style.textShadow = '2px 2px 4px #000000';
        lblName.style.fontSize = '140%';
        lblName.centreHorizontal();
        // build name textbox
        this.txtName = new TextBox(panelMid);
        this.txtName.style.width = '200px';
        this.txtName.style.height = '30px';
        this.txtName.style.bottom = '50px';
        this.txtName.centreHorizontal();
        // build back button
        const btnBack = new Button(panelMid, 'Back');
        btnBack.style.position = 'initial';
        btnBack.style.display = 'float';
        btnBack.style.float = 'left';
        btnBack.style.width = '150px';
        btnBack.addEventListener('click', () => {
            SceneManager.changeScene('char-select');
        });
    }

    // eslint-disable-next-line require-await
    public async init(): Promise<void> {
        this.scene = new Scene();
        this.camera = new Camera(45, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 1000);
        this.camera.position.z = 10;

        const light = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(light);

        this.initGUI();
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
