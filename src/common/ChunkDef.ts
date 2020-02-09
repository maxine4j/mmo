import IDefinition from './IDefinition';

export interface NavblockDef extends IDefinition {
    x: number,
    y: number,
}

export interface DoodadDef extends IDefinition {
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

export interface ChunkTexture extends IDefinition {
    id: string;
    diffuse: string;
    depth: string;
    blend: string;
}

export default interface ChunkDef extends IDefinition {
    id: string;
    x: number;
    y: number;
    heightmap: number[];
    textures: ChunkTexture[];
    doodads: DoodadDef[];
}
