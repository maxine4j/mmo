import * as io from 'socket.io-client';
import { Packet, PacketHeader, ResponsePacket } from '../../common/Packet';

export default class NetClient {
    private static client: SocketIOClient.Socket;

    public static init(url: string = 'http://localhost:3000') {
        this.client = io.connect(url);

        this.client.on(PacketHeader.AUTH_LOGIN, (resp: ResponsePacket) => {
            console.log('Got a resp', resp);
        });
    }

    public static send(header: PacketHeader, packet: Packet) {
        this.client.emit(header.toString(), packet);
    }
}
