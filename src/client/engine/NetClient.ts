import * as io from 'socket.io-client';
import {
    Packet, PacketHeader, ResponsePacket, AuthLoginPacket, AccountPacket,
} from '../../common/Packet';
import Engine from './Engine';
import SceneManager from './scene/SceneManager';

export default class NetClient {
    private static _client: SocketIOClient.Socket;
    private static accountRecvCallback: (resp: AccountPacket) => void;

    public static init(url: string = 'http://localhost:3000'): void {
        this._client = io.connect(url);
        this.initEvents();
    }

    private static initEvents(): void {
        this.client.on('disconnect', () => {
            this.accountRecvCallback = null;
            Engine.account = null;
            SceneManager.changeScene('login');
        });
        this.client.on(PacketHeader.AUTH_LOGIN, (resp: AccountPacket) => {
            Engine.account = resp;
            this.accountRecvCallback(resp);
        });
    }

    public static login(username: string, password: string, cb: (resp: AccountPacket) => void): void {
        NetClient.send(PacketHeader.AUTH_LOGIN, <AuthLoginPacket>{
            username,
            password,
        });
        this.accountRecvCallback = cb;
    }

    public static logout(): void {
        this.accountRecvCallback = null;
        Engine.account = null;
        this.send(PacketHeader.AUTH_LOGOUT, null);
    }

    public static send(header: PacketHeader, packet?: Packet): void {
        this.client.emit(header.toString(), packet);
    }

    // sends a packet with given header and calls cb once when server responds with the same header
    // same as onNext; send
    public static sendRecv(header: PacketHeader, packet?: Packet): Promise<Packet> {
        const prom = this.onNext(header);
        this.send(header, packet);
        return prom;
    }

    public static get client(): SocketIOClient.Socket {
        return this._client;
    }

    public static on(header: PacketHeader, cb: (p: Packet) => void): void {
        this.client.on(header, cb);
    }

    public static onNext(header: PacketHeader): Promise<Packet> {
        return new Promise((resolve) => {
            const fn = (p: ResponsePacket): void => {
                this.client.off(header, fn);
                resolve(p);
            };
            this.client.on(header, fn);
        });
    }
}
