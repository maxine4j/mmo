import * as io from 'socket.io-client';

export default class NetClient {
    private static client: SocketIOClient.Socket;

    public static init(url: string = 'http://localhost:3000') {
        NetClient.client = io.connect(url);
    }
}
