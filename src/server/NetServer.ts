import io from 'socket.io';
import * as http from 'http';
import {
    ResponsePacket, PacketHeader, AuthLoginPacket,
} from '../common/Packet';
import { handleAuthLogin, handleAuthLogout } from './routes/Auth';

export default class NetServer {
    private static server: io.Server;

    public static init(port: number = 3000) {
        console.log('setting up netserver');

        this.server = io().listen(port);
        this.server.on('connection', this.onConnection);
    }

    private static onConnection(socket: io.Socket) {
        console.log(`Client connected: ${socket.id}`);
        socket.on('disconnect', async () => {
            await handleAuthLogout(socket.id);
        });
        socket.on(PacketHeader.AUTH_LOGIN, async (packet: AuthLoginPacket) => {
            socket.emit(PacketHeader.AUTH_LOGIN, await handleAuthLogin(socket.id, packet));
        });
        socket.on(PacketHeader.AUTH_LOGOUT, async () => {
            await handleAuthLogout(socket.id);
        });
    }
}
