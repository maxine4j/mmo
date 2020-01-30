import * as io from 'socket.io-client';
import { Packet, PacketHeader } from '../../common/Packet';
import SceneManager from './scene/SceneManager';

export default class NetClient {
    private static _client: SocketIOClient.Socket;

    public static init(url: string = 'http://localhost:3000'): void {
        this._client = io.connect(url);
        this.initEvents();
    }

    private static initEvents(): void {
        this.client.on('disconnect', () => {
            SceneManager.changeScene('login');
        });
    }

    public static send(header: PacketHeader, packet?: Packet): void {
        this.client.emit(header.toString(), packet);
    }

    // sends a packet with given header and calls cb once when server responds with the same header
    // same as onNext; send
    public static sendRecv(header: PacketHeader, packet?: Packet): Promise<Packet> {
        const prom = this.once(header);
        this.send(header, packet);
        return prom;
    }

    public static get client(): SocketIOClient.Socket {
        return this._client;
    }

    public static on(header: PacketHeader, cb: (p: Packet) => void): void {
        this.client.off(header); // remove old listeners so we dont duplicate
        this.client.on(header, cb);
    }

    public static once(header: PacketHeader): Promise<Packet> {
        return new Promise<Packet>((resolve) => {
            this.client.once(header, (packet: Packet) => {
                resolve(packet);
            });
        });
    }
}
