import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Graphics from './Graphics';
import Point from '../../../common/Point';
import Scene from './Scene';
import LocalUnit from '../LocalUnit';
import LocalWorld from '../LocalWorld';
import Input, { MouseButton } from '../Input';

export default class Camera extends THREE.PerspectiveCamera {
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private target: THREE.Vector3 = new THREE.Vector3();
    private maxPolar: number = Graphics.toRadians(75);
    private minPolar: number = Graphics.toRadians(0);
    private maxZoom: number = 20;
    private minZoom: number = 5;
    private rotateDelta: Point;
    private polar: number = 0;
    private azimuth: number = 0;
    private lastMouse: Point;

    public constructor(fov?: number, aspect?: number, near?: number, far?: number) {
        super(fov, aspect, near, far);

        window.addEventListener('resize', () => { this.windowResize(); });
        this.windowResize();
    }

    private windowResize() {
        this.aspect = Graphics.viewportWidth / Graphics.viewportHeight;
        this.updateProjectionMatrix();
    }

    public get lookingAt(): THREE.Vector3 {
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    }

    public rcast(scene: Scene, p: Point): THREE.Intersection[] {
        const dx = (p.x / Graphics.viewportWidth) * 2 - 1;
        const dy = -(p.y / Graphics.viewportHeight) * 2 + 1;
        this.raycaster.setFromCamera({ x: dx, y: dy }, this);
        return this.raycaster.intersectObjects(scene.children);
    }

    private clamp(n: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, n));
    }

    public update(delta: number, world: LocalWorld) {
        // set the target to the players position
        if (world.player && world.player.data) {
            this.target = world.player.getWorldPosition();
        }

        // make a quaterion from camera up to world up and its inverse
        const localToWorld = new THREE.Quaternion().setFromUnitVectors(this.up, new THREE.Vector3(0, 1, 0));
        const worldToLocal = localToWorld.clone().inverse();

        // get offset from camera pos to the target pos
        const offset = new THREE.Vector3().copy(this.position).sub(this.target);
        offset.applyQuaternion(localToWorld); // rotate offset to y axis is up space

        // angle from z axis around y axis
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = this.polar;
        spherical.theta = this.azimuth;
        spherical.makeSafe();
        spherical.radius = 10;
        spherical.radius = Math.max(this.minZoom, Math.min(this.maxZoom, spherical.radius)); // limit radius

        offset.setFromSpherical(spherical);
        offset.applyQuaternion(worldToLocal); // rotate back to camera up is up space

        // position = target + offset
        this.position.copy(this.target).add(offset);

        // look at the target
        this.lookAt(this.target);

        // update rotate delta
        if (Input.isMouseDown(MouseButton.MIDDLE)) {
            this.rotateDelta = Point.sub(Input.mousePos(), this.lastMouse);
            this.polar += 2 * Math.PI * -(this.rotateDelta.y / Graphics.viewportHeight);
            this.polar = this.clamp(this.polar, this.minPolar, this.maxPolar);
            this.azimuth += 2 * Math.PI * -(this.rotateDelta.x / Graphics.viewportWidth);
        }
        this.lastMouse = Input.mousePos();
    }
}
