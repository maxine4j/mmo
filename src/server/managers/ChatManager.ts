import Client from '../Client';
import { PacketHeader, ChatMsgPacket } from '../../common/Packet';
import WorldManager from './WorldManager';

export default class ChatManager {
    private world: WorldManager;

    public constructor(world: WorldManager) {
        this.world = world;
    }

    public handleConnection(client: Client): void {
        client.socket.on(PacketHeader.CHAT_EVENT, (packet) => {
            this.handleChatMessage(client, packet);
        });
    }

    private parseChatCommand(client: Client, msg: ChatMsgPacket): void {
        const argv = msg.message.split(' ');
        if (argv[0] === '/run') {
            client.player.data.running = (argv[1] === 'true');
        }
    }

    public handleChatMessage(client: Client, msg: ChatMsgPacket): void {
        if (msg.message.startsWith('/')) {
            this.parseChatCommand(client, msg);
        } else {
            const out = <ChatMsgPacket>{
                authorId: client.player.data.id,
                authorName: client.player.data.name,
                timestamp: Date.now(),
                message: msg.message,
            };
            client.socket.emit(PacketHeader.CHAT_EVENT, out);
            for (const player of this.world.players.inRange(client.player.position)) {
                // TODO: better chat processing here
                // channels, commands, etc
                player.socket.emit(PacketHeader.CHAT_EVENT, out);
            }
        }
    }
}
