import * as THREE from 'three';
import Label from './components/Label';
import Camera from '../graphics/Camera';
import World from '../../models/World';
import Unit from '../../models/Unit';
import UIParent from './components/UIParent';
import Panel from './components/Panel';

const splatHeight = 0.75;

export default class HitSplat extends Panel {
    public world: World;
    public camera: Camera;
    public unit: Unit;

    private label: Label;

    public constructor(world: World, camera: Camera, unit: Unit, dmg: number) {
        super(UIParent.get());
        this.world = world;
        this.camera = camera;
        this.unit = unit;
        this.width = 32;
        this.height = 32;
        this.style.backgroundSize = '100%';
        if (dmg <= 0) {
            this.style.backgroundImage = 'url("assets/imgs/splats/blue.png")';
        } else {
            this.style.backgroundImage = 'url("assets/imgs/splats/red.png")';
        }

        this.disablePointerEvents();

        this.label = new Label(this, dmg.toString());
        this.label.style.position = 'initial';
        this.label.style.position = 'initial';
        this.label.style.textAlign = 'center';
        this.label.style.color = 'white';
        this.label.style.margin = '10px';
        this.label.style.lineHeight = '170%';
        this.label.disablePointerEvents();

        this.update();
    }

    private updatePosition(wpos: THREE.Vector3): void {
        wpos.add(new THREE.Vector3(0, splatHeight, 0));
        const pos = this.camera.worldToScreen(wpos);
        this.style.top = `${pos.y - this.height / 2}px`;
        this.style.left = `${pos.x - this.width / 2}px`;
    }

    public update(): void {
        const wpos = this.unit.getWorldPosition();
        if (wpos) {
            this.show();
            this.updatePosition(wpos);
        } else {
            this.hide();
        }
    }
}
