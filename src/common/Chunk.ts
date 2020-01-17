export interface NavblockDef {
    x: number,
    y: number,
}

export interface DoodadDef {
    model: string,
    x: number;
    y: number;
    elevation: number;
    navblocks: NavblockDef[];
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
