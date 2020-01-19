export interface NavblockDef {
    x: number,
    y: number,
}

export interface DoodadDef {
    uuid: string;
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
    texture: string;
    heightmap: number[];
    doodads: DoodadDef[];
}
