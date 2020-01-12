import * as THREE from 'three';
import Terrain from './graphics/Terrain';
import Chunk, { Doodad } from '../../common/Chunk';
import Point from '../../common/Point';
import Rectangle from '../../common/Rectangle';
import Model from './graphics/Model';
import LocalWorld from './LocalWorld';

class TerrainDoodad {
    public def: Doodad;
    public model: Model;

    public constructor(def: Doodad, model: Model, chunk: TerrainChunk) {
        this.def = def;
        this.model = model;

        // scale the doodad model
        this.model.obj.scale.set(this.def.scale, this.def.scale, this.def.scale);

        // rotate the doodad model
        this.model.obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.def.rotation);

        // position the doodad model
        const chunkPos = chunk.terrainToChunk(this.def.x, this.def.y);
        const tilePos = chunk.world.chunkToTile(chunk, chunkPos.x, chunkPos.y);
        const worldPos = chunk.world.tileToWorld(tilePos.x, tilePos.y);
        this.model.obj.position.copy(worldPos);

        // add the doodad model to the scene
        chunk.world.scene.add(this.model.obj);
    }
}

export default class TerrainChunk {
    public def: Chunk;
    public world: LocalWorld;
    public terrain: Terrain;
    public doodads: TerrainDoodad[] = [];
    public x: number;
    public y: number;

    private constructor(def: Chunk, terrain: Terrain, x: number, y: number, world: LocalWorld) {
        this.def = def;
        this.terrain = terrain;
        this.x = x;
        this.y = y;
        this.world = world;
        this.positionTerrain();
        this.loadDoodads();
    }

    private loadDoodads() {
        // load all the doodads
        for (const dd of this.def.doodads) {
            Model.loadDef(`assets/models/${dd.model}`).then((m) => {
                this.doodads.push(new TerrainDoodad(dd, m, this));
            });
        }
    }

    private positionTerrain() {
        this.terrain.plane.position.set(this.x * this.size, 0, this.y * this.size);
    }

    public static async load(chunk: Chunk, world: LocalWorld): Promise<TerrainChunk> {
        return new Promise((resolve) => {
            // load the terrain heightmap
            Terrain.load(`assets/chunks/${chunk.heightmap}`, `assets/chunks/${chunk.texture}`).then((t) => {
                const tc = new TerrainChunk(chunk, t, chunk.x, chunk.y, world);
                world.scene.add(tc.terrain.plane);
                resolve(tc);
            });
        });
    }

    public worldOffset(): Point {
        const x = this.x - this.terrain.width / 2;
        const y = this.y - this.terrain.height / 2;
        return new Point(x, y);
    }

    public containsPoint(point: Point): boolean {
        const offset = this.worldOffset();
        const bounds = new Rectangle(offset.x, offset.y, this.size, this.size);
        return bounds.contains(point);
    }

    public chunkToTerrain(chunkX: number, chunkY: number): Point {
        const x = chunkX + (this.terrain.width / 2);
        const y = chunkY + (this.terrain.height / 2);
        return new Point(x, y);
    }

    public terrainToChunk(terrainX: number, terrainY: number): Point {
        const x = terrainX - (this.terrain.width / 2);
        const y = terrainY - (this.terrain.height / 2);
        return new Point(x, y);
    }

    public getElevation(chunkX: number, chunkY: number): number {
        const tp = this.chunkToTerrain(chunkX, chunkY);
        return this.terrain.getElevation(tp.x, tp.y);
    }

    public get size(): number {
        return this.terrain.width;
    }
}
