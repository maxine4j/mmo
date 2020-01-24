import * as THREE from 'three';
import Label from './components/Label';
import Camera from '../graphics/Camera';
import World from '../World';
import LocalUnit from '../LocalUnit';
import UIParent from './components/UIParent';
import Panel from './components/Panel';

const splatHeight = 1;
const splatDuration = 1000;

export default class HitSplat extends Panel {
    public world: World;
    public camera: Camera;
    public unit: LocalUnit;

    private label: Label;

    public constructor(world: World, camera: Camera, unit: LocalUnit, dmg: number) {
        super(`hitsplat-${unit.data.id}`, UIParent.get());
        this.world = world;
        this.camera = camera;
        this.unit = unit;
        this.width = 32;
        this.height = 32;
        this.disablePointerEvents();

        this.label = new Label(`${this.id}-lbl`, this, dmg.toString());
        this.label.style.position = 'initial';
        this.label.style.textAlign = 'center';
        this.label.style.color = 'red';
        this.label.disablePointerEvents();

        this.update();

        setTimeout(() => {
            this.dispose();
        }, splatDuration);
    }

    private updatePosition(): void {
        const wpos = this.unit.model.obj.position.clone();
        wpos.add(new THREE.Vector3(0, splatHeight, 0));
        const pos = this.camera.worldToScreen(wpos);
        this.style.top = `${pos.y - this.height / 2}px`;
        this.style.left = `${pos.x - this.width / 2}px`;
    }

    public update(): void {
        if (this.unit.model) {
            this.visible = true;
            this.updatePosition();
        } else {
            this.visible = false;
        }
    }
}
