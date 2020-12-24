import io from 'socket.io';
import Player from './Player';
import { PacketHeader, AuthLoginPacket, CharacterPacket } from '../../common/Packet';
import {
    handleLogout, handleLogin, handleSignup, handleMyList, handleCreate,
} from '../Authentication';
import WorldManager from '../managers/WorldManager';
import CharacterEntity from '../entities/Character.entity';
import { metricsEmitter } from '../metrics/metrics';

const metrics = metricsEmitter();

/*
Client connects to socketio
    Client authenticates
        Client can fetchchar list, create char, delete char
            Client enters world with a valid character
                Client can now play the game
*/

export default class Client {
    private world: WorldManager;
    public socket: io.Socket;
    public player: Player;
    public get id(): string { return this.socket.id; }

    public constructor(socket: io.Socket, world: WorldManager) {
        this.socket = socket;
        this.world = world;
        this.registerBase();
    }

    public emitSocket(header: PacketHeader, ...args: any[]): boolean {
        metrics.packetSent('single', header);
        return this.socket.emit(header, ...args);
    }

    private registerPacketListener(header: PacketHeader | 'disconnect', listener: (...args: any[]) => void): void {
        metrics.packetReceived(header);
        this.socket.on(header, listener);
    }

    private registerBase(): void {
        this.registerPacketListener(PacketHeader.AUTH_SIGNUP, (packet) => this.handleAuthSignup(packet));
        this.registerPacketListener(PacketHeader.AUTH_LOGIN, (packet) => this.handleAuthLogin(packet));
        this.registerPacketListener(PacketHeader.AUTH_LOGOUT, () => this.handleAuthLogout());
        this.registerPacketListener('disconnect', () => this.handleAuthLogout());
    }

    private registerAuthenticated(): void {
        this.registerPacketListener(PacketHeader.CHAR_MYLIST, () => this.handleCharMyList());
        this.registerPacketListener(PacketHeader.CHAR_CREATE, (packet) => this.handleCharCreate(packet));
        this.registerPacketListener(PacketHeader.PLAYER_ENTERWORLD, (packet) => this.handlePlayerEnterWorld(packet));
        this.registerPacketListener(PacketHeader.PLAYER_LEAVEWORLD, () => this.handlePlayerLeaveWorld());
    }

    private async handleAuthSignup(packet: AuthLoginPacket): Promise<void> {
        const resp = await handleSignup(this.socket, packet);
        this.emitSocket(PacketHeader.AUTH_SIGNUP, resp);
    }

    private async handleAuthLogin(packet: AuthLoginPacket): Promise<void> {
        const resp = await handleLogin(this.socket, packet);
        if (resp.success) this.registerAuthenticated();
        this.emitSocket(PacketHeader.AUTH_LOGIN, resp);
    }

    private async handleAuthLogout(): Promise<void> {
        this.socket.removeAllListeners();
        this.registerBase();
        this.world.leaveWorld(this);
        await handleLogout(this.socket);
    }

    private handlePlayerEnterWorld(packet: CharacterPacket): void {
        if (packet) {
            CharacterEntity.findOneSorted({ id: Number(packet.id) }).then((ce) => {
                this.player = new Player(this.world, ce, this);
                this.world.enterWorld(this);
            });
        }
    }

    private handlePlayerLeaveWorld(): void {
        this.socket.removeAllListeners();
        this.registerAuthenticated(); // we are still authenticated
        this.registerBase();
        this.world.leaveWorld(this);
    }

    private async handleCharMyList(): Promise<void> {
        const resp = await handleMyList(this.socket);
        this.emitSocket(PacketHeader.CHAR_MYLIST, resp);
    }

    private async handleCharCreate(packet: CharacterPacket): Promise<void> {
        const resp = await handleCreate(this.id, packet);
        this.emitSocket(PacketHeader.CHAR_CREATE, resp);
    }
}
