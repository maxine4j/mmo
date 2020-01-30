import io from 'socket.io';
import Player from './Player';
import { PacketHeader, AuthLoginPacket, CharacterPacket } from '../../common/Packet';
import {
    handleAuthLogout, handleAuthLogin, handleMyList, handleCreate,
} from '../managers/AccountManager';
import WorldManager from '../managers/WorldManager';
import CharacterEntity from '../entities/Character.entity';

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

        // authentication
        this.socket.on(PacketHeader.AUTH_LOGIN, this.handleAuthLogin.bind(this));
        this.socket.on(PacketHeader.AUTH_LOGOUT, this.handleAuthLogout.bind(this));
        this.socket.on('disconnect', this.handleAuthLogout.bind(this));
    }

    private registerAuthenticated(): void {
        this.socket.on(PacketHeader.CHAR_MYLIST, this.handleCharMyList.bind(this));
        this.socket.on(PacketHeader.CHAR_CREATE, this.handleCharCreate.bind(this));
        this.socket.on(PacketHeader.PLAYER_ENTERWORLD, this.handlePlayerEnterWorld.bind(this));
        this.socket.on(PacketHeader.PLAYER_LEAVEWORLD, this.handlePlayerLeaveWorld.bind(this));
    }

    private async handleAuthLogin(packet: AuthLoginPacket): Promise<void> {
        const resp = await handleAuthLogin(this.socket, packet);
        if (resp.success) this.registerAuthenticated();
        this.socket.emit(PacketHeader.AUTH_LOGIN, resp);
    }

    private async handleAuthLogout(): Promise<void> {
        this.socket.removeAllListeners();
        await handleAuthLogout(this.socket);
    }

    private handlePlayerEnterWorld(packet: CharacterPacket): void {
        console.log('player enter world');

        // find an entity for this char
        CharacterEntity.findOne({ where: { id: Number(packet.id) } }).then((ce) => {
            this.player = new Player(this.world, ce, this);
            this.world.enterWorld(this);
        });
    }

    private handlePlayerLeaveWorld(): void {
        console.log('player leave world');
        this.socket.removeAllListeners();
        this.registerAuthenticated(); // we are still authenticated
        this.world.leaveWorld(this);
    }

    private async handleCharMyList(): Promise<void> {
        const resp = await handleMyList(this.socket);
        this.socket.emit(PacketHeader.CHAR_MYLIST, resp);
    }

    private async handleCharCreate(packet: CharacterPacket): Promise<void> {
        const resp = await handleCreate(this.id, packet);
        this.socket.emit(PacketHeader.CHAR_CREATE, resp);
    }
}
