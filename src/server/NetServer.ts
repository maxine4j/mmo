import io from 'socket.io';
import {
    PacketHeader, AuthLoginPacket, CharacterPacket,
} from '../common/Packet';
import { handleAuthLogin, handleAuthLogout } from './routes/AuthRoute';
import { handleMyList, handleCreate } from './routes/CharRoute';
import World from './World';

export default class NetServer {
    private static server: io.Server;
    private static world: World;

    public static init(port: number = 3000) {
        console.log('setting up netserver');

        this.server = io().listen(port);
        this.server.on('connection', this.onConnection);
    }

    private static onConnection(socket: io.Socket) {
        // client authentication
        console.log(`Client connected: ${socket.id}`);
        socket.on('disconnect', async () => {
            await handleAuthLogout(socket.id);
        });
        socket.on(PacketHeader.AUTH_LOGIN, async (packet: AuthLoginPacket) => {
            socket.emit(PacketHeader.AUTH_LOGIN, await handleAuthLogin(socket.id, packet));
        });
        socket.on(PacketHeader.AUTH_LOGOUT, async () => {
            this.world.leaveWorld(socket.id);
            await handleAuthLogout(socket.id);
        });

        // character select
        socket.on(PacketHeader.CHAR_MYLIST, async () => {
            socket.emit(PacketHeader.CHAR_MYLIST, await handleMyList(socket.id));
        });
        socket.on(PacketHeader.CHAR_CREATE, async (packet: CharacterPacket) => {
            socket.emit(PacketHeader.CHAR_CREATE, await handleCreate(socket.id, packet));
        });

        // player login
        socket.on(PacketHeader.PLAYER_ENTERWORLD, async (packet: CharacterPacket) => {
            const character = await this.world.enterWorld(socket, packet.character);
            socket.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>{ character });
        });
    }
}
