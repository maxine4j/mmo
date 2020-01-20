import ChunkDef from '../../common/ChunkDef';

export interface ChunkJsonDef {
    [key: string]: ChunkDef;
}

export default interface WorldJsonDef {
    id: string;
    chunkSize: number;
    chunks: ChunkJsonDef;
}
