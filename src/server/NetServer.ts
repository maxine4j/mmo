import io from 'socket.io';
import * as http from 'http';

export default class NetServer {
    private static server: io.Server;

    public static init(port: number = 3000) {
        console.log('setting up netserver');

        NetServer.server = io().listen(port);
        NetServer.server.on('connection', (socket: io.Socket) => {
            console.log('got a connection from', socket.client.id);
            socket.on('message', (message: any) => {
                console.log(message);
            });
        });
    }
}
