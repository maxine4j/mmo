import { json } from 'express';

export enum PacketHeader {
    AUTH_LOGIN = 'AUTH_LOGIN',
    AUTH_LOGIN_RESP = 'AUTH_LOGIN_RESP',
    CHAR_CREATE = 'CHAR_CREATE',
    CHAR_GET = 'CHAR_GET',
}

export enum Channel {
    AUTH,
    CHARACTER,
    WORLD,
    PLAYER
}

export interface Packet {
    header: PacketHeader;
}

export interface AuthLoginPacket extends Packet {
    username: string;
    password: string;
}

export interface ResponsePacket extends Packet {
    success: boolean;
    message: string;
    data: string;
}
