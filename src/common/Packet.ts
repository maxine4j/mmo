import CharacterDef, { SkillDef, ExperienceDrop } from './definitions/CharacterDef';
import { PointDef } from './Point';
import ChunkDef from './definitions/ChunkDef';
import UnitDef from './definitions/UnitDef';
import ItemDef from './definitions/ItemDef';
import InventoryDef, { InventoryType } from './definitions/InventoryDef';

export enum PacketHeader {
    AUTH_SIGNUP = 'AUTH_SIGNUP',
    AUTH_LOGIN = 'AUTH_LOGIN',
    AUTH_LOGOUT = 'AUTH_LOGOUT',

    CHAR_MYLIST = 'CHAR_MYLIST',
    CHAR_CREATE = 'CHAR_CREATE',

    PLAYER_ENTERWORLD = 'PLAYER_ENTERWORLD',
    PLAYER_LEAVEWORLD = 'PLAYER_LEAVEWORLD',
    PLAYER_MOVETO = 'PLAYER_MOVETO',
    PLAYER_TARGET = 'PLAYER_TARGET',
    PLAYER_LOOT = 'PLAYER_LOOT',
    PLAYER_SKILLS = 'PLAYER_SKILLS',
    PLAYER_EXP_DROP = 'PLAYER_EXP_DROP',
    PLAYER_LEVELUP = 'PLAYER_LEVELUP',
    PLAYER_SET_RUN = 'PLAYER_SET_RUN',
    PLAYER_INTERACT = 'PLAYER_INTERACT',

    INVENTORY_SWAP = 'INVENTORY_SWAP',
    INVENTORY_USE = 'INVENTORY_USE',
    INVENTORY_UPDATE = 'INVENTORY_UPDATE',
    INVENTORY_DROP = 'INVENTORY_DROP',

    UNIT_DAMAGED = 'UNIT_DAMAGED',
    UNIT_ADDED = 'UNIT_ADDED',
    UNIT_PATHED = 'UNIT_PATHED',
    UNIT_UPDATED = 'UNIT_UPDATED',
    UNIT_DIED = 'UNIT_DIED',

    UNIT_REQUEST = 'UNIT_REQUEST',

    CHAT_EVENT = 'CHAT_EVENT',

    CHUNK_REQUEST = 'CHUNK_REQUEST',
    CHUNK_DATA = 'CHUNK_DATA',
    CHUNK_LOAD = 'CHUNK_LOAD',

    WORLD_INFO = 'WORLD_INFO',
    WORLD_TICK = 'WORLD_TICK',
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

export interface WorldInfoPacket extends Packet {
    self: CharacterDef;
    tickRate: number;
    chunkSize: number;
    chunkViewDist: number;
}

export interface CharacterPacket extends Packet, CharacterDef { }
export interface CharacterListPacket extends Packet, ResponsePacket {
    characters: CharacterDef[];
}

export interface UnitPacket extends Packet, UnitDef { }

export interface UnitAddPacket extends Packet {
    unit: UnitDef;
    start: PointDef;
    path: PointDef[];
}

export interface PathPacket extends Packet {
    uuid: string;
    start: PointDef;
    path: PointDef[];
}

export interface TickPacket extends Packet {
    self: CharacterDef;
    tick: number;
}

export interface PointPacket extends Packet, PointDef { }

export interface ChunkPacket extends Packet, ChunkDef { }
export interface ChunkListPacket extends Packet {
    center: PointDef;
    chunks: ChunkDef[];
}

export interface ChatMsgPacket extends Packet {
    authorId: string;
    authorName: string;
    timestamp: number;
    message: string;
}

export interface TargetPacket extends Packet {
    target: string;
}

export interface DamagePacket extends Packet {
    attacker: string;
    defender: string;
    damage: number; // could add type here for poision etc
}

export interface IDPacket extends Packet {
    uuid: string;
}

export interface InventorySwapPacket extends Packet {
    slotA: number;
    slotB: number;
}

export interface InventoryUsePacket extends Packet {
    slotA: number;
    slotB: number;
}

export interface InventoryDropPacket extends Packet {
    slot: number;
}

export interface InventoryPacket extends Packet, InventoryDef { }

export interface InteractPacket extends Packet {
    uuid: string;
    ccx: number,
    ccy: number,
}

export interface SkillsPacket extends Packet {
    skills: SkillDef[];
}

export interface ExpDropPacket extends Packet, ExperienceDrop { }

export interface LevelupPacket extends Packet, SkillDef { }

export interface BooleanPacket extends Packet {
    value: boolean;
}
