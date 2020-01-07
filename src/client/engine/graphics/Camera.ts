import { PerspectiveCamera, Vector3 } from 'three';
import { Key } from 'ts-key-enum';
import Graphics from './Graphics';
import Input from '../Input';

export default class Camera extends PerspectiveCamera {
    private cameraRate = 0.5;

    public constructor(fov?: number, aspect?: number, near?: number, far?: number) {
        super(fov, aspect, near, far);

        window.addEventListener('resize', () => { this.windowResize(); });
        this.windowResize();
    }

    private windowResize() {
        this.aspect = Graphics.viewportWidth / Graphics.viewportHeight;
        this.updateProjectionMatrix();
    }

    public get lookingAt(): Vector3 {
        return new Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    }

    public updateDebugMove(delta: number) {
        if (Input.isKeyDown(Key.ArrowLeft)) {
            this.translateX(delta * -this.cameraRate);
        }
        if (Input.isKeyDown(Key.ArrowRight)) {
            this.translateX(delta * this.cameraRate);
        }
        if (Input.isKeyDown(Key.ArrowUp)) {
            this.translateZ(delta * -this.cameraRate);
        }
        if (Input.isKeyDown(Key.ArrowDown)) {
            this.translateZ(delta * this.cameraRate);
        }

        if (Input.isKeyDown('w')) {
            this.rotateOnAxis(new Vector3(1, 0, 0), delta * this.cameraRate);
        }
        if (Input.isKeyDown('s')) {
            this.rotateOnAxis(new Vector3(1, 0, 0), delta * -this.cameraRate);
        }
        if (Input.isKeyDown('a')) {
            this.rotateOnAxis(new Vector3(0, 1, 0), delta * this.cameraRate);
        }
        if (Input.isKeyDown('d')) {
            this.rotateOnAxis(new Vector3(0, 1, 0), delta * -this.cameraRate);
        }

        if (Input.isKeyDown('q')) {
            this.translateY(delta * this.cameraRate);
        }
        if (Input.isKeyDown('e')) {
            this.translateY(delta * -this.cameraRate);
        }

        console.log(this.position, this.rotation);
    }
}
