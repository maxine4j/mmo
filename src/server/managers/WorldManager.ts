import io from 'socket.io';
import { EventEmitter } from 'events';
import { PacketHeader, WorldInfoPacket } from '../../common/Packet';
import ChatManager from './ChatManager';
import ChunksManager from './ChunksManager';
import GroundManager from './GroundManager';
import PlayerManager from './PlayerManager';
import UnitManager from './UnitManager';
import Client from '../Client';
import { Point } from '../../common/Point';
import Rectangle from '../../common/Rectangle';

type WorldEvent = 'tick';

export default class WorldManager {
    private eventEmitter: EventEmitter = new EventEmitter();
    public tickCounter: number = 0;
    public tickRate: number;
    private server: io.Server;
    public chunkViewDist: number = 1;
    public tileViewDist: number = 50;

    public chat: ChatManager;
    public chunks: ChunksManager;
    public groundItems: GroundManager;
    public players: PlayerManager;
    public units: UnitManager;

    public constructor(tickRate: number, server: io.Server) {
        this.tickRate = tickRate;
        this.server = server;

        this.chat = new ChatManager(this);
        this.chunks = new ChunksManager(this);
        this.groundItems = new GroundManager(this);
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

    public emit(event: WorldEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public handleConnection(socket: io.Socket): void {
        const client = new Client(socket);
        this.chunks.handleClient(client);
        this.players.handleClient(client);
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

    public handleWorldInfo(session: io.Socket): void {
        session.emit(PacketHeader.WORLD_INFO, <WorldInfoPacket>{
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
