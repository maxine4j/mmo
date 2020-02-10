import * as THREE from 'three';
import { TerrainTexture } from '../../asset/AssetManager';
import terrainVertex from './shaders/terrain.v.glsl';
import terrainFrag from './shaders/terrain.f.glsl';

export default class TerrainMaterial extends THREE.ShaderMaterial {
    public texture: TerrainTexture;

    public constructor(texture: TerrainTexture) {
        super({
            lights: true,
            fog: true,

            uniforms: {
                u_tiling: { value: new THREE.Vector2(8, 8) }, // how many times to repeat texture over mesh
                u_mapCount: { value: texture.count }, // number of maps to blend
                u_diffuseMaps: { value: texture.diffuse },
                u_depthMaps: { value: texture.depth },
                u_blendMaps: { value: texture.blend },

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
            vertexShader: terrainVertex,
            fragmentShader: terrainFrag,
        });

        this.texture = texture;
    }

    public dispose(): void {
        super.dispose();
        this.texture.diffuse.dispose();
        this.texture.depth.dispose();
        this.texture.blend.dispose();
    }
}
