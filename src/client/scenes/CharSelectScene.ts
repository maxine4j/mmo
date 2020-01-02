import Scene from '../engine/scene/Scene';
import { Frame } from '../engine/interface/Frame';
import Button from '../engine/interface/Button';
import UIParent from '../engine/interface/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import Character from '../../common/Character';
import Panel from '../engine/interface/Panel';

export default class CharSelectScene extends Scene {
    private characters: Character[];
    private _selectedChar: Character;

    constructor(manager: SceneManager) {
        super('char-select', manager);
    }

    fetchCharacerList() {
        this.characters = [];
        this.characters.push(new Character('Arwic', 120));
        this.characters.push(new Character('Arwicdruid', 120));
        this.characters.push(new Character('Arwicdk', 120));
        this.characters.push(new Character('Arwicmage', 120));
        this.characters.push(new Character('Arwiclock', 120));
    }

    get selectedChar(): Character {
        return this._selectedChar;
    }
    set selectedChar(char: Character) {
        this._selectedChar = this.selectedChar;
    }

    initGUI() {
        // build enter world button
        const btnEnterWorld = new Button('btn-enter-world', UIParent.get(), 'Enter World');
        btnEnterWorld.style.bottom = '0';
        btnEnterWorld.centreHorizontal();
        btnEnterWorld.addEventListener('click', (self: Button, ev: MouseEvent) => {
            console.log('Entering world...');
        });
        this.addGUI(btnEnterWorld);
        // build character list
        const panelCharacters = new Panel('panel-characters', UIParent.get());
        let lastBottom = 0;
        for (const char of this.characters) {
            const btnChar = new Button(`btn-char-${char.name}`, panelCharacters, char.name);
            lastBottom += btnChar.height;
            btnChar.style.top = `${lastBottom}px`;
            btnChar.style.width = '200px';
            this.addGUI(btnChar);
        }
        panelCharacters.style.right = '0px';
        panelCharacters.style.top = '0px';
        panelCharacters.style.height = '100%';
        panelCharacters.style.width = '200px';
        panelCharacters.style.backgroundColor = 'rgba(255,0,0,0.3)';
        panelCharacters.style.borderRadius = '5px';
        this.addGUI(panelCharacters);
        // build new character button
        const btnCreateCharacter = new Button('btn-create-character', panelCharacters, 'Create Character');
        btnEnterWorld.centreHorizontal();
        btnEnterWorld.style.bottom = '0px';
        btnEnterWorld.addEventListener('click', (self: Button, ev: MouseEvent) => {
            console.log('Entering world...');
        });
        this.addGUI(btnCreateCharacter);
    }

    init() {
        this.fetchCharacerList();
        this.initGUI();
    }

    final() {
        this.clearGUI();
    }

    update(delta: number) {
        // console.log(`updated! ${delta}`);
    }

    draw() {

    }
}
