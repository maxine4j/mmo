import Terrain from './graphics/Terrain';

interface ChunkDefPositon {
    x: number;
    y: number;
}

interface ChunkDef {
    heightmap: string,
    texture: string,
    positon: ChunkDefPositon;
}

const chunkWidth = 10;

export default class Chunk {
    public id: number;
    public terrain: Terrain;
    public x: number;
    public y: number;

    private constructor(id: number, terrain: Terrain, x: number, y: number) {
        this.id = id;
        this.terrain = terrain;
        this.x = x;
        this.y = y;
        this.positionTerrain();
    }

    private positionTerrain() {
        this.terrain.plane.position.set(this.x * chunkWidth, 0, this.y * chunkWidth);
    }

    public static async load(id: number): Promise<Chunk> {
        return new Promise((resolve) => {
            fetch(`assets/chunks/${id}.chunk.json`)
                .then((resp) => resp.json())
                .then((cd: ChunkDef) => {
                    Terrain.load(`assets/chunks/${cd.heightmap}`, `assets/chunks/${cd.texture}`).then((t) => {
                        resolve(new Chunk(id, t, cd.positon.x, cd.positon.y));
                    });
                });
        });
    }
}
