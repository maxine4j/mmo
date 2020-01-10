import Account from './Account';
import Character from './Character';
import Point from './Point';
import Chunk from './Chunk';

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

export interface CharactersPacket extends Packet, ResponsePacket {
    characters: Character[];
}

export interface CharacterPacket extends Packet, Character { }

export interface PointPacket extends Packet, Point { }

export interface ChunkPacket extends Packet, Chunk { }
