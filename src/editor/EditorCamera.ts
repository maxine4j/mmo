import * as THREE from 'three';
import Graphics from '../client/engine/graphics/Graphics';
import Point from '../common/Point';
import Camera from '../client/engine/graphics/Camera';
import Input, { MouseButton } from '../client/engine/Input';

export default class EditorCamera extends Camera {
    public constructor(fov?: number, aspect?: number, near?: number, far?: number) {
        super(fov, aspect, near, far);

        this.maxZoom = 200;
        this.minZoom = 5;
    }


    public update() {
        const lastMouse = this.lastMouse;
        super.update(); // this updates last mouse

        // update panning
        if (Input.isMouseDown(MouseButton.RIGHT)) {
            const panDelta = Point.sub(Input.mousePos(), lastMouse);

            const offset = new THREE.Vector3()
                .copy(this.position)
                .sub(this.target)
                .length();
            const targetDist = offset * Math.tan((this.fov / 2) * (Math.PI / 180.0));
            const dist = (2 * targetDist) / Graphics.viewportHeight;

            const panLeft = new THREE.Vector3();
            panLeft.setFromMatrixColumn(this.matrix, 0);
            panLeft.multiplyScalar(-panDelta.x * dist);
            this.target.add(panLeft);

            const panUp = new THREE.Vector3();
            panUp.setFromMatrixColumn(this.matrix, 0);
            panUp.crossVectors(this.up, panUp);
            panUp.multiplyScalar(panDelta.y * dist);
            this.target.add(panUp);
        }
    }
}
