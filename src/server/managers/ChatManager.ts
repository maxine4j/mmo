import Client from '../models/Client';
import { PacketHeader, ChatMsgPacket } from '../../common/Packet';
import WorldManager from './WorldManager';
import IManager from './IManager';

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
        if (argv[0] === '/run') {
            client.player.running = (argv[1] === 'true');
        }
    }

    public handleChatMessage(client: Client, msg: ChatMsgPacket): void {
        if (msg.message.startsWith('/')) {
            this.parseChatCommand(client, msg);
        } else {
            const out = <ChatMsgPacket>{
                authorId: client.player.id,
                authorName: client.player.name,
                timestamp: Date.now(),
                message: msg.message,
            };
            client.socket.emit(PacketHeader.CHAT_EVENT, out);
            for (const player of this.world.players.inRange(client.player.position)) {
                // TODO: better chat processing here
                // channels, commands, etc
                player.send(PacketHeader.CHAT_EVENT, out);
            }
        }
    }
}
