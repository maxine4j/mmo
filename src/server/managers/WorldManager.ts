import io from 'socket.io';
import Map2D from '../../common/Map2D';
import {
    PacketHeader, PointPacket, CharacterPacket, TickPacket, ChatMsgPacket, ChunkListPacket, WorldInfoPacket, TargetPacket, DamagePacket, InventorySwapPacket, ResponsePacket, InventoryPacket,
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
import { GroundItemDef } from '../../common/ItemDef';
import Rectangle from '../../common/Rectangle';

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
    private players: Map<string, PlayerManager> = new Map(); // key is socket.id, players only
    private units: Map<string, UnitManager> = new Map(); // key is data.id, units only
    private allUnits: Map<string, UnitManager> = new Map(); // key is data.id, both units and players
    private spawns: Map<string, SpawnManager> = new Map();
    public chunks: Map2D<number, number, ChunkManager> = new Map2D();
    public tickCounter: number = 0;
    public tickRate: number;
    private server: io.Server;
    public chunkViewDist: number = 1;
    private worldDef: WorldJsonDef = overworldDef;
    private unitSpawnDefs: UnitSpawnsDef;
    private groundItems: Map<string, GroundItemDef> = new Map();

    public constructor(tickRate: number, server: io.Server) {
        this.tickRate = tickRate;
        this.server = server;

        this.createUnitSpawnDefs(); // TODO: temp, should load from world def
        this.loadAllChunks(); // TODO: dynamicaly load chunks as we need them
        this.loadAllUnitSpawns();
        setTimeout(this.tick.bind(this), this.tickRate * 1000);
    }

    public get chunkSize(): number { return this.worldDef.chunkSize; }

    public getUnit(id: string): UnitManager {
        return this.allUnits.get(id);
    }

    public addPlayer(player: PlayerManager, session: io.Socket): void {
        this.players.set(session.id, player);
        this.allUnits.set(player.data.id, player);
        player.updateChunk();
        player.on('damaged', (defender: UnitManager, dmg: number, attacker: UnitManager) => {
            for (const p of this.playersInRange(player.position)) {
                p.socket.emit(PacketHeader.UNIT_DAMAGED, <DamagePacket>{
                    damage: dmg,
                    defender: defender.data.id,
                    attacker: attacker.data.id,
                });
            }
        });
        player.on('death', () => {
            player.respawn();
        });
    }

    public onNextTick(action: () => void): void {
        // TODO: find better way
        setTimeout(() => {
            action();
        }, this.tickRate * 1000);
    }

    public removeUnit(unit: UnitManager): void {
        unit.dispose();
        this.units.delete(unit.data.id);
    }

    public addUnit(unit: UnitManager): void {
        this.units.set(unit.data.id, unit);
        this.allUnits.set(unit.data.id, unit);
        unit.updateChunk();
        unit.on('damaged', (defender: UnitManager, dmg: number, attacker: UnitManager) => {
            for (const player of this.playersInRange(unit.position)) {
                player.socket.emit(PacketHeader.UNIT_DAMAGED, <DamagePacket>{
                    damage: dmg,
                    defender: defender.data.id,
                    attacker: attacker.data.id,
                });
            }
        });
        unit.on('death', (dmg: number, attacker: UnitManager) => {
            this.onNextTick(() => {
                this.removeUnit(unit);
            });
        });
    }

    public addGroundItem(gi: GroundItemDef): void {
        this.groundItems.set(gi.item.uuid, gi);
        const [ccx, ccy] = TilePoint.getChunkCoord(gi.position.x, gi.position.y, this.chunkSize);
        const chunk = this.chunks.get(ccx, ccy);
        chunk.groundItems.set(gi.item.uuid, gi);
        console.log(`Added a ground item ${gi.item.name} at pos ${gi.position.x}, ${gi.position.y}`);
    }

    private tickSpawns(): void {
        for (const [_, sm] of this.spawns) {
            sm.tick();
        }
    }

    private tickPlayers(): void {
        for (const [_, player] of this.players) {
            player.tick(); // tick the playermanager
            // send players and units in range
            const players: CharacterDef[] = this.playersInRange(player.data.position, player).map((pm) => pm.data);
            const units: UnitDef[] = this.unitsInRange(player.data.position).map((um) => um.data);
            const groundItems: GroundItemDef[] = Array.from(player.visibleGroundItems).map(([id, gi]) => gi);
            player.socket.emit(PacketHeader.WORLD_TICK, <TickPacket>{
                self: player.data,
                units,
                players,
                groundItems,
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
            'skeleton-group': {
                id: 'skeleton-group',
                unit: {
                    id: 'skeleton',
                    maxHealth: 5,
                    name: 'Skeleton',
                    level: 1,
                    model: 'assets/models/units/skeleton/skeleton.model.json',
                },
                center: { x: -60, y: -60 },
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

    private getChunksInViewDist(pos: PointDef): Set<ChunkManager> {
        // get extreme points based on viewDist
        const minViewX = pos.x - viewDistX;
        const maxViewX = pos.x + viewDistX;
        const minViewY = pos.y - viewDistY;
        const maxViewY = pos.y + viewDistY;
        // get the chunk coords of these extreme points
        const [tlX, tlY] = TilePoint.getChunkCoord(minViewX, minViewY, this.chunkSize);
        const [trX, trY] = TilePoint.getChunkCoord(maxViewX, minViewY, this.chunkSize);
        const [blX, blY] = TilePoint.getChunkCoord(minViewX, maxViewY, this.chunkSize);
        const [brX, brY] = TilePoint.getChunkCoord(maxViewX, maxViewY, this.chunkSize);
        // save the chunks to a set so we only get unique chunks
        const chunks: Set<ChunkManager> = new Set();
        chunks.add(this.chunks.get(tlX, tlY));
        chunks.add(this.chunks.get(trX, trY));
        chunks.add(this.chunks.get(blX, blY));
        chunks.add(this.chunks.get(brX, brY));
        return chunks;
    }

    private playersInRange(pos: PointDef, exclude?: PlayerManager): PlayerManager[] {
        const inrange: PlayerManager[] = [];
        for (const chunk of this.getChunksInViewDist(pos)) {
            for (const [_, p] of chunk.players) {
                // check if players pos is withing view dist of the target x,y
                if (new Rectangle(p.position.x - viewDistX, p.position.y - viewDistY, viewDistX * 2, viewDistY * 2).contains(Point.fromDef(p.position))) {
                    if (exclude && exclude.socket.id === p.socket.id) {
                        continue;
                    }
                    inrange.push(p);
                }
            }
        }
        return inrange;
    }

    private unitsInRange(pos: PointDef): UnitManager[] {
        const inrange: UnitManager[] = [];
        for (const chunk of this.getChunksInViewDist(pos)) {
            for (const [_, u] of chunk.units) {
                // check if units pos is withing view dist of the target x,y
                if (new Rectangle(u.position.x - viewDistX, u.position.y - viewDistY, viewDistX * 2, viewDistY * 2).contains(Point.fromDef(u.position))) {
                    inrange.push(u);
                }
            }
        }
        return inrange;
    }

    public groundItemsInRange(pos: PointDef): GroundItemDef[] {
        const inrange: GroundItemDef[] = [];
        for (const chunk of this.getChunksInViewDist(pos)) {
            for (const [_, gi] of chunk.groundItems) {
                // check if units pos is withing view dist of the target x,y
                if (new Rectangle(gi.position.x - viewDistX, gi.position.y - viewDistY, viewDistX * 2, viewDistY * 2).contains(Point.fromDef(gi.position))) {
                    inrange.push(gi);
                }
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
        if (char) {
            // find an entity for this char
            CharacterEntity.findOne({
                where: {
                    id: Number(char.id),
                },
            }).then((ce) => {
                const bagData = ce.bags.toNet();
                const bankData = ce.bank.toNet();
                const p = new PlayerManager(this, ce.toNet(), session, bagData, bankData);

                // notify all players in range
                this.playersInRange(p.data.position).forEach((pir) => {
                    pir.socket.emit(PacketHeader.PLAYER_ENTERWORLD, p.data);
                });
                // add the char to the logged in players list
                this.addPlayer(p, session);
                session.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>p.data);
                session.emit(PacketHeader.INVENTORY_FULL, <InventoryPacket>p.bags.data);
            });
        }
    }

    public async handlePlayerLeaveWorld(session: io.Socket): Promise<void> {
        // remove the sessions player from the world if one exists
        const p = this.players.get(session.id);
        if (p) {
            await p.saveToDB();
            this.players.delete(session.id);
        }
    }

    public handleInventorySwap(session: io.Socket, packet: InventorySwapPacket): ResponsePacket {
        const player = this.players.get(session.id);
        player.bags.swap(packet.slotA, packet.slotB);
        return <ResponsePacket>{
            success: true,
            message: '',
        };
    }

    private parseChatCommand(session: io.Socket, msg: ChatMsgPacket): void {
        const argv = msg.message.split(' ');
        if (argv[0] === '/run') {
            this.players.get(session.id).data.running = (argv[1] === 'true');
        }
    }

    public handleChatMessage(session: io.Socket, msg: ChatMsgPacket): void {
        if (msg.message.startsWith('/')) {
            this.parseChatCommand(session, msg);
        } else {
            const self = this.players.get(session.id);
            const out = <ChatMsgPacket>{
                authorId: self.data.id,
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
        player.data.target = '';
        player.moveTo(packet);
    }

    public handlePlayerTarget(session: io.Socket, packet: TargetPacket): void {
        const player = this.players.get(session.id);
        const tar = this.getUnit(packet.target);
        if (tar) {
            player.attackUnit(tar);
        }
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
