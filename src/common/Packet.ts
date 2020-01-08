import { json } from 'express';
import Account from './models/Account';
import Character from './models/Character';

export enum PacketHeader {
    AUTH_LOGIN = 'AUTH_LOGIN',
    AUTH_LOGOUT = 'AUTH_LOGOUT',
    CHAR_MYLIST = 'CHAR_MYLIST',
    CHAR_CREATE = 'CHAR_CREATE',
    CHAR_GET = 'CHAR_GET',
    PLAYER_ENTERWORLD = 'PLAYER_ENTERWORLD',
    PLAYER_LEAVEWORLD = 'PLAYER_LEAVEWORLD',
    PLAYER_MOVETO = 'PLAYER_MOVETO',
    UNIT_UPDATE = '',
    CHAT_EVENT = '',
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

export interface AccountPacket extends Packet, ResponsePacket {
    account: Account;
}

export interface CharactersPacket extends Packet, ResponsePacket {
    characters: Character[];
}

export interface CharacterPacket extends Packet {
    character: Character,
}
