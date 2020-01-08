import io from 'socket.io';
import Character from '../common/models/Character';
import { CharacterPacket, PacketHeader } from '../common/Packet';
import CharacterEntity from './models/Character.entity';

interface Player {
    char: Character;
    socket: io.Socket;
}

// number of tiles away from the player that a player can see updates for in either direction
const viewDistX = 50;
const viewDistY = 50;


export default class World {
    public players: Map<string, Player>;

    public constructor() {
        this.players = new Map();
    }

    private playersInRange(x: number, y: number): Player[] {
        const inr: Player[] = [];
        for (const [_, p] of this.players.entries()) {
            // check if the other players pos is withing view dist of the target x,y
            if (x + viewDistX > p.char.posX && x - viewDistX < p.char.posX
                && y + viewDistY > p.char.posY && y - viewDistY < p.char.posY) {
                inr.push(p);
            }
        }
        return inr;
    }

    public async enterWorld(session: io.Socket, char: Character): Promise<Character> {
        return new Promise((resolve) => {
            // find an entity for this char
            CharacterEntity.findOne({ id: char.id }).then((ce) => {
                const p = <Player>{
                    char: ce.toNet(),
                    socket: session,
                };
                // notify all players in range
                this.playersInRange(p.char.posX, p.char.posY).forEach((pir) => {
                    pir.socket.emit(PacketHeader.PLAYER_ENTERWORLD, p.char);
                });
                // add the char to the logged in players list
                this.players.set(session.id, p);
                // return the char
                resolve(p.char);
            });
        });
    }

    public leaveWorld(sessionid: string) {
        // remove the sessions player from the world if one exists
        const p = this.players.get(sessionid);
        if (p) {
            CharacterEntity.fromNet(p.char);
            this.players.delete(sessionid);
        }
    }

    public getSessionPlayer(sessionid: string) {
        return this.players.get(sessionid);
    }
}
