import Account from './Account';
import Character from './Character';
import { PointDef } from './Point';
import ChunkDef from './ChunkDef';
import Unit from './Unit';

export enum PacketHeader {
    AUTH_LOGIN = 'AUTH_LOGIN',
    AUTH_LOGOUT = 'AUTH_LOGOUT',
    CHAR_MYLIST = 'CHAR_MYLIST',
    CHAR_CREATE = 'CHAR_CREATE',
    CHAR_GET = 'CHAR_GET',
    PLAYER_ENTERWORLD = 'PLAYER_ENTERWORLD',
    PLAYER_LEAVEWORLD = 'PLAYER_LEAVEWORLD',
    PLAYER_MOVETO = 'PLAYER_MOVETO',
    PLAYER_UPDATE_SELF = 'PLAYER_UPDATE_SELF',
    PLAYER_UPDATE = 'PLAYER_UPDATE',
    UNIT_UPDATE = 'UNIT_UPDATE',
    CHAT_EVENT = 'CHAT_EVENT',
    CHUNK_LOAD = 'CHUNK_LOAD',
    WORLD_TICK = 'WORLD_TICK',
}

export enum Channel {
    AUTH,
    CHARACTER,
    WORLD,
    PLAYER
}

export interface Packet { }

export interface ResponsePacket extends Packet {
    success: boolean;
    message: string;
}

export interface AuthLoginPacket extends Packet {
    username: string;
    password: string;
}

export interface AccountPacket extends Packet, ResponsePacket, Account { }

export interface CharacterPacket extends Packet, Character { }
export interface CharacterListPacket extends Packet, ResponsePacket {
    characters: Character[];
}

export interface UnitPacket extends Packet, Unit { }

export interface TickPacket extends Packet {
    self: Character;
    units: Unit[];
    players: Character[];
    tick: number;
}

export interface PointPacket extends Packet, PointDef { }

export interface ChunkPacket extends Packet, ChunkDef { }

export interface ChatMsgPacket extends Packet {
    authorId: number,
    authorName: string,
    timestamp: number,
    message: string
}
