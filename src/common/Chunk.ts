export interface Hitbox {
    x: number,
    y: number,
    w: number,
    h: number,
}

export interface DoodadDef {
    model: string,
    x: number;
    y: number;
    elevation: number;
    hitboxes: Hitbox[];
    scale: number,
    rotation: number,
    walkable: boolean,
}

export default interface ChunkDef {
    id: number;
    x: number;
    y: number;
    size: number;
    texture: string;
    heightmap: number[];
    doodads: Array<DoodadDef>;
}
