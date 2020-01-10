import io from 'socket.io';
import {
    PacketHeader, PointPacket, ChunkPacket, CharacterPacket,
} from '../../common/Packet';
import CharacterEntity from '../entities/Character.entity';
import PlayerManager from './PlayerManager';
import _chunkDefs from '../data/chunks.json';
import ChunksDataDef from '../data/ChunksJsonDef';
import ChunkManager from './ChunkManager';

// number of tiles away from the player that a player can see updates for in either direction
const viewDistX = 50;
const viewDistY = 50;

const chunkDefs = <ChunksDataDef>_chunkDefs;

class NavMap {
    // TODO: smart navmap made up from dumb chunk nav maps
    // we will use this to make a small number[][] for A* path finding
    // this will also reduce search space
}

export default class WorldManager {
    private players: Map<string, PlayerManager>;
    private tickRate: number;
    private chunks: Map<number, ChunkManager>;
    public navmap: Array<Array<number>>;

    public constructor(tickRate: number) {
        this.tickRate = tickRate;
        this.players = new Map();
        this.chunks = new Map();
        this.loadChunk(0); // TODO: dynamicaly load chunks as we need them
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private tick() {
        this.players.forEach((player) => {
            player.tick();
        });

        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private loadChunk(id: number) {
        const cm = new ChunkManager(chunkDefs[id]);
        this.chunks.set(id, cm);
        // TODO: add the new chunk to the world nav mesh
        // for now we just use chunk 0
        this.navmap = this.chunks.get(0).navmap;
    }

    private playersInRange(x: number, y: number): PlayerManager[] {
        const inrange: PlayerManager[] = [];
        for (const [_, p] of this.players.entries()) {
            // check if the other players pos is withing view dist of the target x,y
            if (x + viewDistX > p.character.position.x && x - viewDistX < p.character.position.x
                && y + viewDistY > p.character.position.y && y - viewDistY < p.character.position.y) {
                inrange.push(p);
            }
        }
        return inrange;
    }

    public async handlePlayerEnterWorld(session: io.Socket, char: CharacterPacket) {
        // find an entity for this char
        CharacterEntity.findOne({ id: char.id }).then((ce) => {
            const p = new PlayerManager(this, ce.toNet(), session);

            // notify all players in range
            this.playersInRange(p.character.position.x, p.character.position.y).forEach((pir) => {
                pir.socket.emit(PacketHeader.PLAYER_ENTERWORLD, p.character);
            });
            // add the char to the logged in players list
            this.players.set(session.id, p);
            session.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>p.character);
        });
    }

    public handlePlayerLeaveWorld(session: io.Socket) {
        // remove the sessions player from the world if one exists
        const p = this.players.get(session.id);
        if (p) {
            CharacterEntity.fromNet(p.character);
            this.players.delete(session.id);
        }
    }

    public handlePlayerUpdateSelf(session: io.Socket) {
        const { character } = this.players.get(session.id);
        session.emit(PacketHeader.PLAYER_UPDATE_SELF, <CharacterPacket>character);
    }

    public handleChunkLoad(session: io.Socket) {
        // TOOD: determine which chunks the player needs
        session.emit(PacketHeader.CHUNK_LOAD, <ChunkPacket> this.chunks.get(0).def);
    }

    public handleMoveTo(session: io.Socket, packet: PointPacket) {
        const player = this.players.get(session.id);
        player.moveTo(packet);
    }
}
