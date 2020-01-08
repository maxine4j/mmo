import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Graphics from './Graphics';
import { Point } from '../Input';
import Scene from './Scene';

export default class Camera extends THREE.PerspectiveCamera {
    private cameraRate = 0.5;
    private controls: OrbitControls;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();

    public constructor(fov?: number, aspect?: number, near?: number, far?: number) {
        super(fov, aspect, near, far);

        window.addEventListener('resize', () => { this.windowResize(); });
        this.windowResize();
    }

    public initOrbitControls() {
        this.controls = new OrbitControls(this, Graphics.renderer.domElement);
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 200;
        // this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.update();
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
}
