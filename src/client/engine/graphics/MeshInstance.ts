import * as THREE from 'three';

export default class MeshInstance {
    private index: number;
    private mesh: THREE.InstancedMesh;
    private transform: THREE.Object3D;

    public constructor(mesh: THREE.InstancedMesh, idx: number) {
        this.mesh = mesh;
        this.index = idx;
        this.transform = new THREE.Object3D();
    }

    public update(): void {
        this.mesh.setMatrixAt(this.index, this.transform.matrix);
    }

    public get position(): THREE.Vector3 { return this.transform.position; }
    public get quaternion(): THREE.Quaternion { return this.transform.quaternion; }
    public get rotation(): THREE.Euler { return this.transform.rotation; }
    public get scale(): THREE.Vector3 { return this.transform.scale; }
    public get up(): THREE.Vector3 { return this.transform.up; }
    public get userData(): { [key: string]: any; } { return this.transform.userData; }

    public applyMatrix(matrix: THREE.Matrix4): void { this.transform.applyMatrix(matrix); this.update(); }
    public applyQuaternion(quaternion: THREE.Quaternion): void { this.transform.applyQuaternion(quaternion); this.update(); }
    public getWorldDirection(target: THREE.Vector3): THREE.Vector3 { return this.transform.getWorldDirection(target); }
    public getWorldPosition(target: THREE.Vector3): THREE.Vector3 { return this.transform.getWorldPosition(target); }
    public getWorldQuaternion(target: THREE.Quaternion): THREE.Quaternion { return this.transform.getWorldQuaternion(target); }
    public getWorldScale(target: THREE.Vector3): THREE.Vector3 { return this.transform.getWorldScale(target); }
    public localToWorld(vector: THREE.Vector3): THREE.Vector3 { return this.transform.localToWorld(vector); }
    public lookAt(vector: number | THREE.Vector3, y?: number, z?: number): void { this.transform.lookAt(vector, y, z); this.update(); }
    public raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): void { this.transform.raycast(raycaster, intersects); }
    public rotateOnAxis(axis: THREE.Vector3, angle: number): MeshInstance { this.transform.rotateOnAxis(axis, angle); this.update(); return this; }
    public rotateOnWorldAxis(axis: THREE.Vector3, angle: number): MeshInstance { this.transform.rotateOnWorldAxis(axis, angle); this.update(); return this; }
    public rotateX(angle: number): MeshInstance { this.transform.rotateX(angle); this.update(); return this; }
    public rotateY(angle: number): MeshInstance { this.transform.rotateY(angle); this.update(); return this; }
    public rotateZ(angle: number): MeshInstance { this.transform.rotateZ(angle); this.update(); return this; }
    public setRotationFromAxisAngle(axis: THREE.Vector3, angle: number): void { this.transform.setRotationFromAxisAngle(axis, angle); this.update(); }
    public setRotationFromEuler(euler: THREE.Euler): void { this.transform.setRotationFromEuler(euler); this.update(); }
    public setRotationFromMatrix(m: THREE.Matrix4): void { this.transform.setRotationFromMatrix(m); this.update(); }
    public setRotationFromQuaternion(q: THREE.Quaternion): void { this.transform.setRotationFromQuaternion(q); this.update(); }
    public translateOnAxis(axis: THREE.Vector3, distance: number): MeshInstance { this.transform.translateOnAxis(axis, distance); this.update(); return this; }
    public translateX(distance: number): MeshInstance { this.transform.translateX(distance); this.update(); return this; }
    public translateY(distance: number): MeshInstance { this.transform.translateY(distance); this.update(); return this; }
    public translateZ(distance: number): MeshInstance { this.transform.translateZ(distance); this.update(); return this; }
    public updateMatrix(): void { this.transform.updateMatrix(); this.update(); }
    public updateMatrixWorld(): void { this.transform.updateMatrixWorld(); this.update(); }
}
