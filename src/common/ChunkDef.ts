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

export default interface ChunkDef extends IDefinition {
    id: string;
    x: number;
    y: number;
    texture: string;
    heightmap: number[];
    doodads: DoodadDef[];
}
