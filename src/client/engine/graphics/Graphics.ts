import * as THREE from 'three';

export default class Graphics {
    private static renderer: THREE.WebGLRenderer;

    public static init() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        // this.renderer.setClearColor(0xccccff);

        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => { this.windowResize(); });
        this.windowResize();
    }

    private static windowResize() {
        this.renderer.setSize(Graphics.viewportWidth, Graphics.viewportHeight);
    }

    public static get viewportWidth(): number {
        return window.innerWidth;
    }

    public static get viewportHeight(): number {
        return window.innerHeight;
    }

    public static calcFPS(delta: number): number {
        return 1 / delta;
    }

    public static render(scene: THREE.Scene, camera: THREE.Camera) {
        this.renderer.render(scene, camera);
    }
}
