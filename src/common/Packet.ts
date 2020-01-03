export enum PacketHeader {
    AUTH_LOGIN,
    AUTH_LOGIN_RESP,
    CHAR_CREATE,
    CHAR_GET,
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

export interface AuthPacket extends Packet {
    username: string;
    password: string;
}

export interface Response extends Packet {
    success: boolean;
    message: string;
}
