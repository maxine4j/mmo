import * as THREE from 'three';
import { Texture3D } from '../Texture';
import terrainVertex from './shaders/terrain.v.glsl';
import terrainFrag from './shaders/terrain.f.glsl';

export default class TerrainMaterial extends THREE.ShaderMaterial {
    public textures: Texture3D[];

    public constructor(textures: Texture3D[]) {
        super({
            uniforms: {
                u_diffuse0: { value: textures[0].diffuse },
                u_depth0: { value: textures[0].depth },
                u_diffuse1: { value: textures[1].diffuse },
                u_depth1: { value: textures[1].depth },
            },
            vertexShader: terrainVertex,
            fragmentShader: terrainFrag,
        });

        this.textures = textures;
    }
}
