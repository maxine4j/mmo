import * as THREE from 'three';
import Graphics from './Graphics';
import { Point } from '../../../common/Point';
import Scene from './Scene';
import Input, { MouseButton } from '../Input';

export default class Camera extends THREE.PerspectiveCamera {
    protected raycaster: THREE.Raycaster = new THREE.Raycaster();
    protected currentPos: THREE.Vector3 = new THREE.Vector3();
    protected target: THREE.Vector3 = new THREE.Vector3();
    protected maxPolar: number = Graphics.toRadians(75);
    protected minPolar: number = Graphics.toRadians(0);
    protected maxZoom: number = 20;
    protected minZoom: number = 5;
    protected zoomLevel: number = 10;
    protected zoomRate: number = 1;
    protected rotateDelta: Point;
    protected polar: number = 0;
    protected azimuth: number = 0;
    protected followSpeed: number = 4;
    protected lastMouse: Point;
    protected rotateRate: number = 2;

    public constructor(fov?: number, aspect?: number, near?: number, far?: number) {
        super(fov, aspect, near, far);

        window.addEventListener('resize', () => { this.onWindowResize(); });
        Graphics.renderer.domElement.addEventListener('wheel', (ev: WheelEvent) => { this.onScroll(ev); });
        this.onWindowResize();
    }

    private onWindowResize(): void {
        this.aspect = Graphics.viewportWidth / Graphics.viewportHeight;
        this.updateProjectionMatrix();
    }

    private onScroll(ev: WheelEvent): void {
        const scrollDir = Math.sign(ev.deltaY);
        this.zoomLevel += scrollDir * this.zoomRate;
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel));
    }

    public get lookingAt(): THREE.Vector3 {
        return new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    }

    public rcast(scene: Scene, p: Point, recursive: boolean = false): THREE.Intersection[] {
        const dx = (p.x / Graphics.viewportWidth) * 2 - 1;
        const dy = -(p.y / Graphics.viewportHeight) * 2 + 1;
        this.raycaster.setFromCamera({ x: dx, y: dy }, this);
        return this.raycaster.intersectObjects(scene.children, recursive);
    }

    protected clamp(n: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, n));
    }

    public worldToScreen(world: THREE.Vector3): Point {
        this.updateMatrixWorld();
        const v = world.clone().project(this);
        return new Point(
            (0.5 + v.x / 2) * Graphics.viewportWidth,
            (0.5 - v.y / 2) * Graphics.viewportHeight,
        );
    }

    public setTarget(target: THREE.Vector3): void {
        this.target = target;
    }

    public setPosition(pos: THREE.Vector3): void {
        this.currentPos = pos;
        this.target = pos;
    }

    private updateKeys(delta: number): void {
        if (Input.isKeyDown('w')) {
            this.polar -= this.rotateRate * delta;
            this.polar = this.clamp(this.polar, this.minPolar, this.maxPolar);
        } else if (Input.isKeyDown('s')) {
            this.polar += this.rotateRate * delta;
            this.polar = this.clamp(this.polar, this.minPolar, this.maxPolar);
        }

        if (Input.isKeyDown('a')) {
            this.azimuth -= this.rotateRate * delta;
        } else if (Input.isKeyDown('d')) {
            this.azimuth += this.rotateRate * delta;
        }
    }

    public update(delta: number): void {
        // lerp current position towards the target
        this.currentPos.lerp(this.target, this.followSpeed * delta);

        // make a quaterion from camera up to world up and its inverse
        const localToWorld = new THREE.Quaternion().setFromUnitVectors(this.up, new THREE.Vector3(0, 1, 0));
        const worldToLocal = localToWorld.clone().inverse();

        // get offset from camera pos to the target pos
        const offset = new THREE.Vector3().copy(this.position).sub(this.currentPos);
        offset.applyQuaternion(localToWorld); // rotate offset to y axis is up space

        // angle from z axis around y axis
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = this.polar;
        spherical.theta = this.azimuth;
        spherical.makeSafe();
        spherical.radius = this.zoomLevel;

        offset.setFromSpherical(spherical);
        offset.applyQuaternion(worldToLocal); // rotate back to camera up is up space

        // position = target + offset
        this.position.copy(this.currentPos).add(offset);

        // look at the target
        this.lookAt(this.currentPos);

        // update rotate delta
        if (Input.isMouseDown(MouseButton.MIDDLE)) {
            this.rotateDelta = Input.mousePos().sub(this.lastMouse);
            this.polar += 2 * Math.PI * -(this.rotateDelta.y / Graphics.viewportHeight);
            this.polar = this.clamp(this.polar, this.minPolar, this.maxPolar);
            this.azimuth += 2 * Math.PI * -(this.rotateDelta.x / Graphics.viewportWidth);
        }

        this.updateKeys(delta);

        this.lastMouse = Input.mousePos();
    }
}
