import * as THREE from 'three';
import { Texture3D } from '../Texture';
import terrainVertex from './shaders/terrain.v.glsl';
import terrainFrag from './shaders/terrain.f.glsl';

export default class TerrainMaterial extends THREE.ShaderMaterial {
    public texture: Texture3D;

    public constructor(texture: Texture3D) {
        super({
            uniforms: {
                u_tiling: { value: new THREE.Vector2(8, 8) }, // how many times to repeat texture over mesh
                u_mapCount: { value: texture.count }, // number of maps to blend
                u_diffuseMaps: { value: texture.diffuse },
                u_depthMaps: { value: texture.depth },
                u_blendMaps: { value: texture.blend },
            },
            vertexShader: terrainVertex,
            fragmentShader: terrainFrag,

        });

        this.texture = texture;
    }
}
