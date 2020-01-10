import io from 'socket.io';
import {
    PacketHeader, AuthLoginPacket, CharacterPacket, PointPacket,
} from '../common/Packet';
import {
    handleAuthLogin, handleAuthLogout, handleMyList, handleCreate,
} from './managers/AccountManager';
import WorldManager from './managers/WorldManager';

const tickRate = 0.6;

export default class NetServer {
    private static server: io.Server;
    private static world: WorldManager;

    public static init(port: number = 3000) {
        console.log('setting up netserver');

        this.world = new WorldManager(tickRate);

        this.server = io().listen(port);
        this.server.on('connection', this.onConnection);
    }

    private static onConnection(socket: io.Socket) {
        // client authentication
        console.log(`Client connected: ${socket.id}`);
        socket.on('disconnect', async () => {
            await handleAuthLogout(socket);
        });
        socket.on(PacketHeader.AUTH_LOGIN, async (packet: AuthLoginPacket) => {
            socket.emit(PacketHeader.AUTH_LOGIN, await handleAuthLogin(socket, packet));
        });
        socket.on(PacketHeader.AUTH_LOGOUT, async () => {
            NetServer.world.handlePlayerLeaveWorld(socket);
            await handleAuthLogout(socket);
        });

        // character select
        socket.on(PacketHeader.CHAR_MYLIST, async () => {
            socket.emit(PacketHeader.CHAR_MYLIST, await handleMyList(socket));
        });
        socket.on(PacketHeader.CHAR_CREATE, async (packet: CharacterPacket) => {
            socket.emit(PacketHeader.CHAR_CREATE, await handleCreate(socket.id, packet));
        });

        // player
        socket.on(PacketHeader.PLAYER_ENTERWORLD, async (packet: CharacterPacket) => {
            NetServer.world.handlePlayerEnterWorld(socket, packet);
        });
        socket.on(PacketHeader.PLAYER_UPDATE_SELF, async () => {
            NetServer.world.handlePlayerUpdateSelf(socket);
        });
        socket.on(PacketHeader.CHUNK_LOAD, async () => {
            NetServer.world.handleChunkLoad(socket);
        });
        socket.on(PacketHeader.PLAYER_MOVETO, async (packet: PointPacket) => {
            NetServer.world.handleMoveTo(socket, packet);
        });
    }
}
