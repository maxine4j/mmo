import io from 'socket.io';
import {
    PacketHeader, AuthLoginPacket, CharacterPacket,
} from '../common/Packet';
import {
    handleAuthLogin, handleAuthLogout, handleMyList, handleCreate,
} from './managers/AccountManager';
import WorldManager from './managers/WorldManager';

const tickRate = 0.6;

export default class NetServer {
    private static server: io.Server;
    private static world: WorldManager;

    public static init(port: number = 3000): void {
        this.server = io().listen(port);
        this.world = new WorldManager(tickRate, this.server);
        this.server.on('connection', this.onConnection);
    }

    private static onConnection(socket: io.Socket): void {
        NetServer.world.handleConnection(socket);

        // client authentication
        console.log(`Client connected: ${socket.id}`);
        socket.on('disconnect', async () => {
            await handleAuthLogout(socket);
        });
        socket.on(PacketHeader.AUTH_LOGIN, async (packet: AuthLoginPacket) => {
            socket.emit(PacketHeader.AUTH_LOGIN, await handleAuthLogin(socket, packet));
        });
        socket.on(PacketHeader.AUTH_LOGOUT, async () => {
            await handleAuthLogout(socket);
        });

        // character select
        socket.on(PacketHeader.CHAR_MYLIST, async () => {
            socket.emit(PacketHeader.CHAR_MYLIST, await handleMyList(socket));
        });
        socket.on(PacketHeader.CHAR_CREATE, async (packet: CharacterPacket) => {
            socket.emit(PacketHeader.CHAR_CREATE, await handleCreate(socket.id, packet));
        });

        // world info
        socket.on(PacketHeader.WORLD_INFO, () => {
            socket.emit(PacketHeader.WORLD_INFO, NetServer.world.handleWorldInfo(socket));
        });
    }
}
