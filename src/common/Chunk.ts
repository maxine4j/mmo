export interface Hitbox {
    x: number,
    y: number,
    w: number,
    h: number,
}

export interface Doodad {
    model: string,
    x: number;
    y: number;
    hitboxes: Hitbox[];
    scale: number,
    rotation: number,
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
