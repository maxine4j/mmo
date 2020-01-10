export interface Doodad {
    model: string,
    x: number;
    y: number;
    walkable: boolean,
}

export default interface Chunk {
    id: number,
    heightmap: string,
    texture: string,
    x: number;
    y: number;
    doodads: Array<Doodad>;
}
