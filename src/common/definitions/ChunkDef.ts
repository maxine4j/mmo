import IDefinition from './IDefinition';
import InteractableDef from './InteractableDef';

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
    interact: InteractableDef,
}

export interface WaterDef extends IDefinition {
    id: string;
    normals: string,
    colour: number,
    x: number;
    y: number;
    elevation: number;
    rotation: number;
    sizex: number;
    sizez: number;
    flowRate: number;
}

export interface ChunkTexture extends IDefinition {
    id: string;
    blend: string;
}

export default interface ChunkDef extends IDefinition {
    id: string;
    x: number;
    y: number;
    heightmap: number[];
    textures: ChunkTexture[];
    doodads: DoodadDef[];
    waters: WaterDef[];
}
