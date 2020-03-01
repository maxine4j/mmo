import * as THREE from 'three';
import { Water as Water3 } from 'three/examples/jsm/objects/Water';
import Chunk from '../Chunk';
import { WaterDef } from '../../../common/definitions/ChunkDef';
import { ChunkPoint } from '../../../common/Point';

export default class Water extends Water3 {
    public def: WaterDef;
    public chunk: Chunk;

    public constructor(chunk: Chunk, def: WaterDef, reflections: boolean = true) {
        super(new THREE.PlaneBufferGeometry(def.sizex, def.sizez, 1, 1), {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(def.normals, (tex) => {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
            }),
            alpha: 0.66,
            // sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: def.colour,
            distortionScale: 0.5,
            fog: chunk.world.scene.fog !== undefined,
            // clipBias: reflections ? 0 : -1000,
            clipBias: -1000,
        });

        this.rotateX(-Math.PI / 2);

        this.def = def;
        this.chunk = chunk;

        this.traverse((o) => {
            o.userData = {
                water: this,
            };
        });

        this.positionInWorld();
        chunk.world.scene.add(this);
    }

    public dispose(): void {
        this.chunk.world.scene.remove(this);
    }

    public updateGeometry(): void {
        if (this.geometry) this.geometry.dispose();
        this.geometry = new THREE.PlaneBufferGeometry(this.def.sizex, this.def.sizez, 1, 1);
    }

    public positionInWorld(): void {
        const wp = new ChunkPoint(this.def.x, this.def.y, this.chunk).toWorld();
        wp.y = this.def.elevation;
        this.position.copy(wp);
    }

    public update(delta: number): void {
        // @ts-ignore
        this.material.uniforms.time.value += delta * this.def.flowRate;
    }
}
