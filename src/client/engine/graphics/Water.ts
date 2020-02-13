import * as THREE from 'three';
import { Water as Water3 } from 'three/examples/jsm/objects/Water';
import Chunk from '../Chunk';
import { WaterDef } from '../../../common/ChunkDef';
import { ChunkPoint } from '../../../common/Point';

export default class Water extends Water3 {
    public def: WaterDef;
    public chunk: Chunk;

    public constructor(chunk: Chunk, def: WaterDef) {
        const geom = new THREE.PlaneBufferGeometry(def.sizex, def.sizez, 1);
        geom.rotateX(-Math.PI / 2);

        super(geom, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(def.normals, (tex) => {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
            }),
            alpha: 1.0,
            // sunDirection: light.position.clone().normalize(),
            sunColor: 0xffffff,
            waterColor: def.colour,
            distortionScale: 3.7,
            fog: chunk.world.scene.fog !== undefined,
        });

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
        this.geometry = new THREE.PlaneBufferGeometry(this.def.sizex, this.def.sizez);
        this.geometry.rotateX(-Math.PI / 2);
    }

    public positionInWorld(): void {
        const wp = new ChunkPoint(this.def.x, this.def.y, this.chunk).toWorld();
        wp.y = this.def.elevation;
        this.position.copy(wp);
    }

    public update(delta: number): void {
        // @ts-ignore
        this.material.uniforms.time.value += delta;
    }
}
