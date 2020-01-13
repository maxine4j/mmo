import io from 'socket.io';
import {
    PacketHeader, PointPacket, ChunkPacket, CharacterPacket, TickPacket,
} from '../../common/Packet';
import CharacterEntity from '../entities/Character.entity';
import PlayerManager from './PlayerManager';
import _chunkDefs from '../data/chunks.json';
import ChunksDataDef from '../data/ChunksJsonDef';
import ChunkManager from './ChunkManager';
import Point from '../../common/Point';
import Character from '../../common/Character';
import UnitManager from './UnitManager';
import Unit from '../../common/Unit';

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
    public players: Map<string, PlayerManager> = new Map();;
    public units: Map<string, UnitManager> = new Map();;
    public chunks: Map<number, ChunkManager> = new Map();;
    public tickCounter: number = 0;
    public tickRate: number;
    public server: io.Server;

    public constructor(tickRate: number, server: io.Server) {
        this.tickRate = tickRate;
        this.server = server;

        this.loadChunk(0); // TODO: dynamicaly load chunks as we need them
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private tick() {
        this.players.forEach((player) => {
            player.tick();

            const players: Character[] = this.playersInRange(player.data.position.x, player.data.position.y, player).map((pm) => pm.data);
            const units: Unit[] = this.unitsInRange(player.data.position.x, player.data.position.y).map((um) => um.data);

            player.socket.emit(PacketHeader.WORLD_TICK, <TickPacket>{
                self: player.data,
                units,
                players,
                tick: this.tickCounter,
            });
        });
        this.tickCounter++;
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private loadChunk(id: number) {
        const cm = new ChunkManager(chunkDefs[id]);
        this.chunks.set(id, cm);
    }

    private playersInRange(x: number, y: number, exclude?: PlayerManager): PlayerManager[] {
        const inrange: PlayerManager[] = [];
        for (const [_, p] of this.players) {
            // check if players pos is withing view dist of the target x,y
            if (x + viewDistX > p.data.position.x && x - viewDistX < p.data.position.x
                && y + viewDistY > p.data.position.y && y - viewDistY < p.data.position.y) {
                if (exclude && exclude.socket.id !== p.socket.id) {
                    inrange.push(p);
                }
            }
        }
        return inrange;
    }

    private unitsInRange(x: number, y: number): UnitManager[] {
        const inrange: UnitManager[] = [];
        for (const [_, u] of this.units) {
            // check if units pos is withing view dist of the target x,y
            if (x + viewDistX > u.data.position.x && x - viewDistX < u.data.position.x
                && y + viewDistY > u.data.position.y && y - viewDistY < u.data.position.y) {
                inrange.push(u);
            }
        }
        return inrange;
    }

    public async handlePlayerEnterWorld(session: io.Socket, char: CharacterPacket) {
        // find an entity for this char
        CharacterEntity.findOne({ id: char.id }).then((ce) => {
            const p = new PlayerManager(this, ce.toNet(), session);

            // notify all players in range
            this.playersInRange(p.data.position.x, p.data.position.y).forEach((pir) => {
                pir.socket.emit(PacketHeader.PLAYER_ENTERWORLD, p.data);
            });
            // add the char to the logged in players list
            this.players.set(session.id, p);
            session.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>p.data);
        });
    }

    public handlePlayerLeaveWorld(session: io.Socket) {
        // remove the sessions player from the world if one exists
        const p = this.players.get(session.id);
        if (p) {
            CharacterEntity.fromNet(p.data);
            this.players.delete(session.id);
        }
    }

    public handlePlayerUpdateSelf(session: io.Socket) {
        const { data } = this.players.get(session.id);
        session.emit(PacketHeader.PLAYER_UPDATE_SELF, <CharacterPacket>data);
    }

    public handleChunkLoad(session: io.Socket) {
        const player = this.players.get(session.id);
        for (const [_, chunk] of this.chunks) {
            if (chunk.containsPoint(player.data.position)) {
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
