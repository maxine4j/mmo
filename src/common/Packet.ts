import { json } from 'express';
import Account from './models/Account';

export enum PacketHeader {
    AUTH_LOGIN = 'AUTH_LOGIN',
    AUTH_LOGOUT = 'AUTH_LOGOUT',
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
}

export interface AuthLoginRespPacket extends Packet, ResponsePacket {
    account: Account;
}
