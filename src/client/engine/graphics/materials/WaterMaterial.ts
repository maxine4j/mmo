import * as THREE from 'three';
import waterVertex from './shaders/water.v.glsl';
import waterFrag from './shaders/water.f.glsl';
import { WaterDef } from '../../../../common/ChunkDef';

export type ImageData3D = { data: Uint8Array, width: number, height: number, depth: number };

export default class WaterMaterial extends THREE.ShaderMaterial {
    public texture: THREE.Texture;
    private time: number = 0;

    public get tiling(): THREE.Vector2 { return this.uniforms.u_tiling.value; }
    public set tiling(t: THREE.Vector2) { this.uniforms.u_tiling.value = t; }
    public get flowRate(): THREE.Vector2 { return this.uniforms.u_flowRate.value; }
    public set flowRate(rate: THREE.Vector2) { this.uniforms.u_flowRate.value = rate; }
    public get amplitude(): number { return this.uniforms.u_amplitude.value; }
    public set amplitude(amp: number) { this.uniforms.u_amplitude.value = amp; }
    public get wavelength(): number { return this.uniforms.u_wavelength.value; }
    public set wavelength(amp: number) { this.uniforms.u_wavelength.value = amp; }

    public constructor(texture: THREE.Texture) {
        super({
            lights: true,
            fog: true,

            uniforms: {
                u_tiling: { value: new THREE.Vector2(8, 8) },
                u_diffuseMap: { value: texture },
                u_time: { value: 0 },
                u_amplitude: { value: 1 },
                u_wavelength: { value: 2 },
                u_flowRate: { value: new THREE.Vector2(0.05, 0.01) },

                emissive: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
                opacity: { value: 1.0 },

                // required for 'lights: true'
                ambientLightColor: { value: null },
                lightProbe: { value: null },
                directionalLights: { value: null },
                spotLights: { value: null },
                rectAreaLights: { value: null },
                pointLights: { value: null },
                hemisphereLights: { value: null },
                directionalShadowMap: { value: null },
                directionalShadowMatrix: { value: null },
                spotShadowMap: { value: null },
                spotShadowMatrix: { value: null },
                pointShadowMap: { value: null },
                pointShadowMatrix: { value: null },

                // required for 'fog: true'
                fogColor: { value: new THREE.Color() },
                fogNear: { value: null },
                fogFar: { value: null },
                fogDensity: { value: null },
            },
            vertexShader: waterVertex,
            fragmentShader: waterFrag,
        });

        this.texture = texture;
    }

    public dispose(): void {
        super.dispose();
        this.texture.dispose();
    }

    public update(delta: number): void {
        this.time += delta;
        this.uniforms.u_time.value = this.time;
    }

    public setupFromDef(def: WaterDef): void {
        this.flowRate.x = def.flowx;
        this.flowRate.y = def.flowz;
        this.amplitude = def.amplitude;
        this.wavelength = def.wavelength;
    }
}
