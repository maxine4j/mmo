import io from 'socket.io';
import Map2D from '../../common/Map2D';
import {
    PacketHeader, PointPacket, CharacterPacket, TickPacket, ChatMsgPacket, ChunkListPacket, WorldInfoPacket,
} from '../../common/Packet';
import CharacterEntity from '../entities/Character.entity';
import PlayerManager from './PlayerManager';
import _overworldDef from '../data/overworld.json';
import WorldJsonDef from '../data/WorldsJsonDef';
import ChunkManager, { NOT_WALKABLE } from './ChunkManager';
import { Point, PointDef, TilePoint } from '../../common/Point';
import CharacterDef from '../../common/CharacterDef';
import UnitManager from './UnitManager';
import UnitDef from '../../common/UnitDef';
import ChunkDef from '../../common/ChunkDef';
import UnitSpawnsDef from '../data/UnitSpawnsDef';
import SpawnManager from './SpawnManager';

// number of tiles away from the player that a player can see updates for in either direction
const viewDistX = 50;
const viewDistY = 50;

const overworldDef = <WorldJsonDef>_overworldDef;

export interface Navmap {
    offset: Point;
    matrix: number[][];
    start: Point,
    end: Point,
}

export default class WorldManager {
    public players: Map<string, PlayerManager> = new Map();;
    public units: Map<string, UnitManager> = new Map();;
    public spawns: Map<string, SpawnManager> = new Map();;
    public chunks: Map2D<number, number, ChunkManager> = new Map2D();;
    public tickCounter: number = 0;
    public tickRate: number;
    public server: io.Server;
    public chunkViewDist: number = 1;
    private worldDef: WorldJsonDef = overworldDef;
    private unitSpawnDefs: UnitSpawnsDef;

    public constructor(tickRate: number, server: io.Server) {
        this.tickRate = tickRate;
        this.server = server;

        this.createUnitSpawnDefs(); // TODO: temp, should load from world def
        this.loadAllChunks(); // TODO: dynamicaly load chunks as we need them
        this.loadAllUnitSpawns();
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    public get chunkSize(): number { return this.worldDef.chunkSize; }

    private tickSpawns(): void {
        // tick all spawn managers
        // tick all unit managers
        for (const [_, sm] of this.spawns) {
            sm.tick();
        }
    }

    private tickPlayers(): void {
        for (const [_, player] of this.players) {
            player.tick(); // tick the playermanager
            // send players and units in range
            const players: CharacterDef[] = this.playersInRange(player.data.position, player).map((pm) => pm.data);
            const units: UnitDef[] = this.unitsInRange(player.data.position.x, player.data.position.y).map((um) => um.data);
            player.socket.emit(PacketHeader.WORLD_TICK, <TickPacket>{
                self: player.data,
                units,
                players,
                tick: this.tickCounter,
            });
        }
    }

    private tick(): void {
        this.tickPlayers();
        this.tickSpawns();
        this.tickCounter++;
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    private createUnitSpawnDefs(): void {
        this.unitSpawnDefs = {
            'chicken-group': {
                id: 'chicken-group',
                unit: {
                    id: 'chicken',
                    maxHealth: 3,
                    name: 'Chicken',
                    level: 1,
                    model: 'assets/models/units/chicken/chicken.model.json',
                },
                center: { x: 0, y: 0 },
                spawnRadius: { x: 5, y: 5 },
                wanderRadius: { x: 10, y: 10 },
                leashRadius: { x: 15, y: 15 },
                wanderRate: 20,
                minAlive: 1,
                maxAlive: 5,
                spawnRate: 10,
            },
        };
    }

    private loadAllUnitSpawns(): void {
        for (const id in this.unitSpawnDefs) {
            this.loadUnitSpawn(id);
        }
    }

    private loadUnitSpawn(id: string): void {
        const sm = new SpawnManager(this.unitSpawnDefs[id], this);
        this.spawns.set(id, sm);
    }

    private loadAllChunks(): void {
        for (const id in this.worldDef.chunks) {
            this.loadChunk(id);
        }
    }

    private loadChunk(id: string): void {
        const cm = new ChunkManager(this.worldDef.chunks[id], this);
        this.chunks.set(cm.def.x, cm.def.y, cm);
    }

    private playersInRange(pos: PointDef, exclude?: PlayerManager): PlayerManager[] {
        const inrange: PlayerManager[] = [];
        for (const [_, p] of this.players) {
            // check if players pos is withing view dist of the target x,y
            if (pos.x + viewDistX > p.data.position.x && pos.x - viewDistX < p.data.position.x
                && pos.y + viewDistY > p.data.position.y && pos.y - viewDistY < p.data.position.y) {
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

    public handleWorldInfo(session: io.Socket): void {
        session.emit(PacketHeader.WORLD_INFO, <WorldInfoPacket>{
            tickRate: this.tickRate,
            chunkSize: this.chunkSize,
            chunkViewDist: this.chunkViewDist,
        });
    }

    public handlePlayerEnterWorld(session: io.Socket, char: CharacterPacket): void {
        // find an entity for this char
        CharacterEntity.findOne({ id: char.charID }).then((ce) => {
            const p = new PlayerManager(this, ce.toNet(), session);

            // notify all players in range
            this.playersInRange(p.data.position).forEach((pir) => {
                pir.socket.emit(PacketHeader.PLAYER_ENTERWORLD, p.data);
            });
            // add the char to the logged in players list
            this.players.set(session.id, p);
            session.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>p.data);
        });
    }

    public handlePlayerLeaveWorld(session: io.Socket): void {
        // remove the sessions player from the world if one exists
        const p = this.players.get(session.id);
        if (p) {
            CharacterEntity.fromNet(p.data);
            this.players.delete(session.id);
        }
    }

    public handlePlayerUpdateSelf(session: io.Socket): void {
        const { data } = this.players.get(session.id);
        session.emit(PacketHeader.PLAYER_UPDATE_SELF, <CharacterPacket>data);
    }

    public handleChatMessage(session: io.Socket, msg: ChatMsgPacket): void {
        const self = this.players.get(session.id);
        const out = <ChatMsgPacket>{
            authorId: self.data.charID,
            authorName: self.data.name,
            timestamp: Date.now(),
            message: msg.message,
        };
        self.socket.emit(PacketHeader.CHAT_EVENT, out);
        this.playersInRange(self.data.position, self).forEach((pm) => {
            // TODO: better chat processing here
            // channels, commands, etc
            pm.socket.emit(PacketHeader.CHAT_EVENT, out);
        });
    }

    private getNeighbours(def: ChunkDef): ChunkManager[] {
        const neighbours: ChunkManager[] = [];
        const minX = def.x - 1;
        const maxX = def.x + 1;
        const minY = def.y - 1;
        const maxY = def.y + 1;
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const chunk = this.chunks.get(x, y);
                if (chunk) {
                    neighbours.push(chunk);
                }
            }
        }
        return neighbours;
    }

    public handleChunkLoad(session: io.Socket): void {
        const player = this.players.get(session.id);
        this.sendSurroundingChunks(player);
    }

    public sendSurroundingChunks(player: PlayerManager): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(player.data.position.x, player.data.position.y, this.chunkSize);
        const chunk = this.chunks.get(ccx, ccy);
        const chunks: ChunkDef[] = [];
        for (const nbc of this.getNeighbours(chunk.def)) {
            // only send the player chunks they do not have loaded
            if (!player.loadedChunks.contains(nbc.def.x, nbc.def.y)) {
                chunks.push(nbc.def);
                player.loadedChunks.set(nbc.def.x, nbc.def.y, nbc); // mark as loaded
            }
        }
        player.pruneLoadedChunks(); // prune the chunks the player will unload
        player.socket.emit(PacketHeader.CHUNK_LOAD, <ChunkListPacket>{
            center: player.data.position,
            chunks,
        });
    }

    public handleMoveTo(session: io.Socket, packet: PointPacket): void {
        const player = this.players.get(session.id);
        player.moveTo(packet);
    }

    private tileToChunk(tilePoint: Point): [Point, ChunkManager] {
        const [ccx, ccy] = TilePoint.getChunkCoord(tilePoint.x, tilePoint.y, this.chunkSize);
        const chunk = this.chunks.get(ccx, ccy);
        const point = new Point(
            tilePoint.x - (ccx * this.chunkSize) + this.chunkSize / 2,
            tilePoint.y - (ccy * this.chunkSize) + this.chunkSize / 2,
        );
        if (!chunk) return [point, null];
        return [point, chunk];
    }

    public generateNavmap(startDef: PointDef, endDef: PointDef): Navmap {
        // generate a navmap that is chunkSize * chunkSize around the start point
        const start = Point.fromDef(startDef);
        const end = Point.fromDef(endDef);

        const navmapSizeX = this.chunkSize;
        const navmapSizeY = this.chunkSize;

        // initialise a navmap array
        const navmap: number[][] = [];
        for (let i = 0; i < navmapSizeY; i++) {
            navmap[i] = [];
            for (let j = 0; j < navmapSizeX; j++) {
                navmap[i][j] = 0; // 0 -> walkable
            }
        }

        const minY = start.y - navmapSizeY / 2;
        const maxY = start.y + navmapSizeY / 2;
        const minX = start.x - navmapSizeX / 2;
        const maxX = start.x + navmapSizeX / 2;

        // calculate all 4 corners of the nav map
        const [topLeft, topLeftChunk] = this.tileToChunk(new Point(minX, minY));
        const [_topRight, topRightChunk] = this.tileToChunk(new Point(maxX, minY));
        const [_botLeft, botLeftChunk] = this.tileToChunk(new Point(minX, maxY));
        const [_botRight, botRightChunk] = this.tileToChunk(new Point(maxX, maxY));

        // ensure end point is within the nav map
        // if it isnt, then make it the nearest point
        if (end.x > maxX) {
            end.x = maxX - 1;
        } else if (end.x < minX) {
            end.x = minX + 1;
        }
        if (end.y > maxY) {
            end.y = maxY - 1;
        } else if (end.y < minY) {
            end.y = minY + 1;
        }

        let chunkI = 0;
        let chunkJ = 0;
        for (let i = 0; i < navmapSizeY; i++) {
            chunkI = topLeft.y + i; // calculate chunk i
            let chunk = topLeftChunk; // start from top left
            let iOverflowed = false;
            if (chunkI >= navmapSizeY) { // we have overflowed on the y axis
                chunk = botLeftChunk; // we are now in the bottom chunks, and left as we are at the start of a new row
                chunkI -= navmapSizeY; // we overflowed so adjust chunkI
                iOverflowed = true;
            }

            for (let j = 0; j < navmapSizeX; j++) {
                chunkJ = topLeft.x + j; // calculate chunk j

                if (chunkJ >= navmapSizeX) { // we have overflowed on hte x/j axis
                    if (iOverflowed) chunk = botRightChunk; // we have overflowed from bottom left to bottom right
                    else chunk = topRightChunk; // we have overflowed from top left to top right
                    chunkJ -= navmapSizeX; // we overflowed so adjust chunkJ
                }

                if (chunk) { // get the nav map from the appropriate chunk
                    navmap[i][j] = chunk.navmap[chunkI][chunkJ];
                } else { // if the chunk doesnt exist then the tile is not walkable
                    navmap[i][j] = NOT_WALKABLE;
                }
            }
        }

        const offset = new Point(minX, minY);
        const relstart = start.sub(offset);
        const relend = end.sub(offset);

        return <Navmap>{
            matrix: navmap,
            offset,
            start: relstart,
            end: relend,
        };
    }
}
