import * as THREE from 'three';
import Label from './components/Label';
import Camera from '../graphics/Camera';
import { Point } from '../../../common/Point';
import World from '../World';
import LocalUnit from '../LocalUnit';
import UIParent from './components/UIParent';
import Panel from './components/Panel';

const chatHoverHeight = 1.5;

export default class UnitNameplate {
    public world: World;
    public camera: Camera;
    public unit: LocalUnit;

    private panel: Panel;

    public constructor(world: World, camera: Camera, unit: LocalUnit) {
        this.world = world;
        this.camera = camera;
        this.unit = unit;
        // create label at unit pos
        this.panel = new Panel(`nameplate-${unit.data.id}`, UIParent.get());
        this.update();
    }

    private getScreenPos(): Point {
        const wpos = this.unit.model.obj.position.clone();
        wpos.add(new THREE.Vector3(0, chatHoverHeight, 0));
        return this.camera.worldToScreen(wpos);
    }

    public update(): void {
        const pos = this.getScreenPos();
        this.panel.style.top = `${pos.y}px`;
        this.panel.style.left = `${pos.x - this.panel.width / 2}px`;
    }
}
