import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';
// @ts-ignore
import { WEBGL } from 'three/examples/jsm/WebGL.js';
import Scene from './Scene';
import Camera from './Camera';

const TwoPI = Math.PI * 2;

export default class Graphics {
    public static renderer: THREE.WebGLRenderer;
    private static composer: EffectComposer;
    private static renderPass: RenderPass;
    private static outlinePass: OutlinePass;
    private static _clearColor: number = 0xccccff;

    public static init(): void {
        if (WEBGL.isWebGL2Available() === false) {
            console.log('WebGL2 is not supported in this browser');
            document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
        }

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', { alpha: false });
        this.renderer = new THREE.WebGLRenderer({ canvas, context });
        // this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(this.clearColor);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => { this.windowResize(); });
        this.windowResize();
    }

    public static initScene(scene: Scene, camera: Camera): void {
        this.composer = new EffectComposer(this.renderer);

        this.renderPass = new RenderPass(scene, camera);
        this.composer.addPass(this.renderPass);

        this.outlinePass = new OutlinePass(new THREE.Vector2(this.viewportWidth, this.viewportHeight), scene, camera);
        this.composer.addPass(this.outlinePass);

        // for three.js inspector support
        // @ts-ignore
        window.scene = scene;
        window.THREE = THREE;
    }

    public static addPass(pass: Pass): void {
        this.composer.addPass(pass);
    }

    public static setOutlines(objs: THREE.Object3D[], color: THREE.Color = new THREE.Color(0xFFFFFF), thickness: number = 1, strength: number = 3): void {
        this.outlinePass.visibleEdgeColor = color;
        this.outlinePass.edgeThickness = thickness;
        this.outlinePass.edgeStrength = strength;
        this.outlinePass.selectedObjects = objs;
    }

    private static windowResize(): void {
        this.renderer.setSize(Graphics.viewportWidth, Graphics.viewportHeight);
        if (this.composer) {
            this.composer.setSize(Graphics.viewportWidth, Graphics.viewportHeight);
        }
    }

    public static get clearColor(): number { return this._clearColor; }

    public static get viewportWidth(): number {
        return window.innerWidth;
    }

    public static get viewportHeight(): number {
        return window.innerHeight;
    }

    public static calcFPS(delta: number): number {
        return 1 / delta;
    }

    public static render(): void {
        this.composer.render();
    }

    public static clear(): void {
        this.renderer.clear();
    }

    public static toDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    public static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    public static normaliseRadians(theta: number): number {
        // ensure rad is between 0 and 2Pi
        let normTheta = theta;
        while (normTheta > TwoPI) {
            normTheta -= TwoPI;
        }
        while (normTheta < 0) {
            normTheta += TwoPI;
        }
        return normTheta;
    }

    public static snapAngle(theta: number, steps: number): number {
        const snapStep = (Math.PI * 2) / steps;
        let closestTheta = 0;
        let minDiff = Number.MAX_VALUE;
        for (let i = 0; i < steps; i++) {
            const snappedTheta = i * snapStep;
            const snappedDiff = Math.abs(theta - snappedTheta);
            if (snappedDiff < minDiff) {
                minDiff = snappedDiff;
                closestTheta = snappedTheta;
            }
        }
        return closestTheta;
    }
}
