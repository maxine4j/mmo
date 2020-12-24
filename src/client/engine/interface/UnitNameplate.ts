import * as THREE from 'three';
import Label from './components/Label';
import Camera from '../graphics/Camera';
import World from '../World';
import LocalUnit from '../LocalUnit';
import UIParent from './components/UIParent';
import Panel from './components/Panel';
import ProgressBar from './components/ProgressBar';
import './styles/healthbar.css';
import Graphics from '../graphics/Graphics';

const nameplatHeight = 1.5;

export default class UnitNameplate extends Panel {
    public world: World;
    public camera: Camera;
    public unit: LocalUnit;
    public lastTickUpdated: number;

    private label: Label;
    private healthbar: ProgressBar;

    public constructor(world: World, camera: Camera, unit: LocalUnit) {
        super(UIParent.get());
        this.world = world;
        this.camera = camera;
        this.unit = unit;
        this.width = 100;
        this.height = 30;
        this.lastTickUpdated = world.currentTick;
        this.disablePointerEvents();

        this.label = new Label(this, '');
        this.updateLabelText();
        this.label.style.position = 'initial';
        this.label.style.textAlign = 'center';
        this.label.disablePointerEvents();

        this.healthbar = new ProgressBar(this, 0, unit.data.maxHealth, unit.data.health);
        this.healthbar.style.position = 'initial';
        this.healthbar.width = this.width;
        this.healthbar.height = 10;
        this.healthbar.classList.add('hpbar');
        this.healthbar.disablePointerEvents();

        this.update();
    }

    private updateLabelText(): void {
        this.label.text = `${this.unit.data.name} (${this.unit.data.level})`;
    }

    private updateHealthbar(): void {
        this.healthbar.max = this.unit.data.maxHealth;
        this.healthbar.value = this.unit.data.health;
    }

    private updatePosition(): void {
        const wpos = this.unit.model.obj.position.clone();
        wpos.add(new THREE.Vector3(0, nameplatHeight, 0));
        const pos = this.camera.worldToScreen(wpos);
        this.style.bottom = `${Graphics.viewportHeight - pos.y}px`;
        this.style.left = `${pos.x - this.width / 2}px`;
    }

    public update(): void {
        if (this.unit.model) {
            this.visible = true;
            this.updateLabelText();
            this.updateHealthbar();
            this.updatePosition();
        } else {
            this.visible = false;
        }
    }
}
