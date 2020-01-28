import io from 'socket.io';
import { EventEmitter } from 'events';
import Player from './models/Player';

type ClientEvent = 'enterworld' | 'leaveworld' | 'move' | 'death';

export default class Client {
    private eventEmitter: EventEmitter;
    public socket: io.Socket;
    public player: Player;

    public get id(): string { return this.socket.id; }

    public constructor(socket: io.Socket) {
        this.socket = socket;
    }

    public on(event: ClientEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: ClientEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    public once(event: ClientEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.once(event, listener);
    }

    public emit(event: ClientEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }
}
