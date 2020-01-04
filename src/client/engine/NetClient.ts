import * as io from 'socket.io-client';
import {
    Packet, PacketHeader, ResponsePacket, AuthLoginPacket, AuthLoginRespPacket,
} from '../../common/Packet';
import Engine from './Engine';

export default class NetClient {
    private static client: SocketIOClient.Socket;
    private static accountRecvCallback: (resp: AuthLoginRespPacket) => void;

    public static init(url: string = 'http://localhost:3000') {
        this.client = io.connect(url);
        this.initEvents();
    }

    private static initEvents() {
        this.client.on(PacketHeader.AUTH_LOGIN, (resp: AuthLoginRespPacket) => {
            Engine.account = resp.account;
            this.accountRecvCallback(resp);
        });
    }

    public static login(username: string, password: string, cb: (resp: AuthLoginRespPacket) => void) {
        NetClient.send(PacketHeader.AUTH_LOGIN, <AuthLoginPacket>{
            username,
            password,
        });
        this.accountRecvCallback = cb;
    }

    public static send(header: PacketHeader, packet: Packet) {
        this.client.emit(header.toString(), packet);
    }
}
