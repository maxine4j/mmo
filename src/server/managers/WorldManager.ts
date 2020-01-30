import io from 'socket.io';
import { EventEmitter } from 'events';
import {
    PacketHeader, WorldInfoPacket, CharacterPacket, InventoryPacket,
} from '../../common/Packet';
import ChatManager from './ChatManager';
import ChunksManager from './ChunkManager';
import GroundManager from './GroundManager';
import PlayerManager from './PlayerManager';
import UnitManager from './UnitManager';
import Client from '../models/Client';
import { Point } from '../../common/Point';
import Rectangle from '../../common/Rectangle';
import IManager from './IManager';

type WorldEvent = 'tick';

export default class WorldManager implements IManager {
    private eventEmitter: EventEmitter = new EventEmitter();
    private tickCounter: number = 0;
    private tickRate: number;
    private server: io.Server;
    private _chunkViewDist: number = 1;
    private _tileViewDist: number = 50;

    public chat: ChatManager;
    public chunks: ChunksManager;
    public ground: GroundManager;
    public players: PlayerManager;
    public units: UnitManager;

    public get currentTick(): number { return this.tickCounter; }
    public get chunkViewDist(): number { return this._chunkViewDist; }
    public get tileViewDist(): number { return this._tileViewDist; }

    public constructor(tickRate: number, server: io.Server) {
        this.tickRate = tickRate;
        this.server = server;

        this.chat = new ChatManager(this);
        this.chunks = new ChunksManager(this);
        this.ground = new GroundManager(this);
        this.players = new PlayerManager(this);
        this.units = new UnitManager(this);

        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    public on(event: WorldEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: WorldEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    public once(event: WorldEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.once(event, listener);
    }

    private emit(event: WorldEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public enterWorld(client: Client): void {
        this.chunks.enterWorld(client);
        this.players.enterWorld(client);
        this.chat.enterWorld(client);

        client.socket.on(PacketHeader.WORLD_INFO, () => {
            this.handleWorldInfo(client);
        });

        client.socket.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>client.player.toNet());
        client.socket.emit(PacketHeader.INVENTORY_FULL, <InventoryPacket>client.player.bags.toNet());
    }

    public leaveWorld(client: Client): void {
        this.chunks.leaveWorld(client);
        this.players.leaveWorld(client);
        this.chat.leaveWorld(client);
    }

    public onNextTick(action: () => void): void {
        // TODO: find better way
        setTimeout(() => {
            action();
        }, this.tickRate * 1000);
    }

    private tick(): void {
        this.tickCounter++;
        this.emit('tick', this, this.tickCounter);
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private handleWorldInfo(client: Client): void {
        client.socket.emit(PacketHeader.WORLD_INFO, <WorldInfoPacket>{
            tickRate: this.tickRate,
            chunkSize: this.chunks.chunkSize,
            chunkViewDist: this.chunkViewDist,
        });
    }

    public viewBounds(pos: Point): Rectangle {
        return new Rectangle(
            pos.x - this.tileViewDist,
            pos.y - this.tileViewDist,
            this.tileViewDist * 2,
            this.tileViewDist * 2,
        );
    }
}
