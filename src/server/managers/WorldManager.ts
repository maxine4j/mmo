import io from 'socket.io';
import {
    PacketHeader, PointPacket, ChunkPacket, CharacterPacket,
} from '../../common/Packet';
import CharacterEntity from '../entities/Character.entity';
import PlayerManager from './PlayerManager';
import _chunkDefs from '../data/chunks.json';
import ChunksDataDef from '../data/ChunksJsonDef';
import ChunkManager from './ChunkManager';
import Point from '../../common/Point';

// number of tiles away from the player that a player can see updates for in either direction
const viewDistX = 50;
const viewDistY = 50;

const chunkDefs = <ChunksDataDef>_chunkDefs;

export interface Navmap {
    offset: Point;
    matrix: number[][];
    start: Point,
    end: Point,
}

export default class WorldManager {
    public players: Map<string, PlayerManager>;
    public tickRate: number;
    public chunks: Map<number, ChunkManager>;

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

        this.sendPlayerPositions();
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private sendPlayerPositions() {
        // only update self for now
        this.players.forEach((player) => {
            player.socket.emit(PacketHeader.PLAYER_UPDATE_SELF, <CharacterPacket>player.character);
        });
    }

    private loadChunk(id: number) {
        const cm = new ChunkManager(chunkDefs[id]);
        this.chunks.set(id, cm);
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
        const player = this.players.get(session.id);
        for (const [_, chunk] of this.chunks) {
            if (chunk.containsPoint(player.character.position)) {
                session.emit(PacketHeader.CHUNK_LOAD, <ChunkPacket> chunk.def);
                break;
            }
        }
    }

    public handleMoveTo(session: io.Socket, packet: PointPacket) {
        const player = this.players.get(session.id);
        player.moveTo(packet);
    }

    public generateNavmap(start: Point, end: Point): Navmap {
        const chunk = this.chunks.get(0);
        const offset = chunk.worldOffset;
        const relstart = new Point(start.x - offset.x, start.y - offset.y);
        const relend = new Point(end.x - offset.x, end.y - offset.y);
        return <Navmap>{
            matrix: chunk.navmap,
            offset,
            start: relstart,
            end: relend,
        };

        // let minX = Number.MAX_VALUE;
        // let maxX = Number.MIN_VALUE;
        // let minY = Number.MAX_VALUE;
        // let maxY = Number.MIN_VALUE;
        // const navChunks: Set<ChunkManager> = new Set();

        // // find the chunks these points belong to
        // for (const [_, chunk] of this.chunks) {
        //     for (const point of points) {
        //         if (chunk.containsPoint(point)) {
        //             navChunks.add(chunk);
        //             // and find the min and max world offsets
        //             const offset = chunk.worldOffset;
        //             if (offset.x > maxX) maxX = offset.x;
        //             else if (offset.x < minX) minX = offset.x;
        //             if (offset.y > maxY) maxY = offset.y;
        //             else if (offset.y < minY) minY = offset.y;
        //             break;
        //         }
        //     }
        // }

        // // sort the chunks by x then y
        // const navChunksArr = Array.from(navChunks);
        // navChunksArr.sort((a, b) => {
        //     const ao = a.worldOffset;
        //     const bo = a.worldOffset;
        //     // sort by x first
        //     if (ao.x > bo.x) return 1;
        //     if (ao.x < bo.x) return -1;
        //     if (ao.x === bo.x) { // then by y
        //         if (ao.y > bo.y) return 1;
        //         if (ao.y < bo.y) return -1;
        //     }
        //     return 0;
        // });

        // const xrange = maxX - minX;
        // const yrange = maxY - minY;
        // const finalNav: number[][] = [];
        // // build a combined number[][] from the chunks
        // for (let i = 0; i < yrange; i++) {
        //     if (!finalNav[i]) finalNav[i] = [];

        //     for (let j = 0; j < xrange; j++) {
        //         const finalPoint = new Point(j, i);

        //         // find the chunk this offset belongs to
        //         for (const chunk of navChunksArr) {
        //             const offset = chunk.worldOffset;
        //             if (offset.eq(finalPoint)) {
        //                 j += offset.x; // skip past this chunks points
        //             }
        //         }
        //     }
        // }
    }
}
