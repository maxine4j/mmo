import { Point } from '../../common/Point';
import Client from '../models/Client';
import { PacketHeader, ChatMsgPacket } from '../../common/Packet';
import WorldManager from './WorldManager';
import IManager from './IManager';
import { metricsEmitter } from '../metrics/metrics';

const metrics = metricsEmitter();

export default class ChatManager implements IManager {
    private world: WorldManager;

    public constructor(world: WorldManager) {
        this.world = world;
    }

    public enterWorld(client: Client): void {
        client.socket.on(PacketHeader.CHAT_EVENT, (packet) => {
            this.handleChatMessage(client, packet);
        });
    }

    public leaveWorld(client: Client): void {
    }

    private parseChatCommand(client: Client, msg: ChatMsgPacket): void {
        const argv = msg.message.split(' ');
        switch (argv[0]) {
        case '/run': {
            client.player.running = (argv[1] === 'true');
            break;
        }
        case '/tp': {
            if (argv.length >= 3) {
                const x = Number(argv[1]);
                const y = Number(argv[2]);
                client.player.teleport(new Point(x, y));
            } else if (argv.length === 1) {
                client.player.teleport(new Point(0, 0));
            }
            break;
        }
        default: break;
        }
    }

    public handleChatMessage(client: Client, msg: ChatMsgPacket): void {
        if (msg.message.startsWith('/')) {
            metrics.chatMessage('command');
            this.parseChatCommand(client, msg);
        } else {
            metrics.chatMessage('message');
            const out = <ChatMsgPacket>{
                authorId: client.player.id,
                authorName: client.player.name,
                timestamp: Date.now(),
                message: msg.message,
            };
            client.emitSocket(PacketHeader.CHAT_EVENT, out);
            for (const player of this.world.players.inRange(client.player.position)) {
                // TODO: better chat processing here
                // channels, commands, etc
                player.send(PacketHeader.CHAT_EVENT, out);
            }
        }
    }
}
