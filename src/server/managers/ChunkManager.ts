import WorldJsonDef from '../data/WorldsJsonDef';
import Map2D from '../../common/Map2D';
import Chunk from '../models/Chunk';
import Client from '../models/Client';
import { PacketHeader, ChunkListPacket } from '../../common/Packet';
import _overworldDef from '../data/overworld.json';
import { PointDef, TilePoint, Point } from '../../common/Point';
import WorldManager from './WorldManager';
import ChunkDef from '../../common/definitions/ChunkDef';
import IManager from './IManager';
import { metricsEmitter } from '../metrics/metrics';

const metrics = metricsEmitter();

const overworldDef = <WorldJsonDef><any>_overworldDef; // FIXME: remove any when interactables fully implemented

export const WALKABLE = 0;
export const NOT_WALKABLE = 1;

export interface Navmap {
    offset: Point;
    matrix: number[][];
    start: Point,
    end: Point,
}

export default class ChunkManager implements IManager {
    private world: WorldManager;
    private chunks: Map2D<number, number, Chunk> = new Map2D();
    private worldDef: WorldJsonDef = overworldDef;
    public get chunkSize(): number { return this.worldDef.chunkSize; }

    public constructor(world: WorldManager) {
        this.world = world;
        for (const id in this.worldDef.chunks) {
            this.loadChunk(id);
        }
    }

    public enterWorld(client: Client): void {
        client.socket.on(PacketHeader.CHUNK_LOAD, (packet) => {
            this.handleChunkLoad(client);
        });
    }

    public leaveWorld(client: Client): void {
    }

    public inRange(pos: PointDef): Set<Chunk> {
        // get extreme points based on viewDist
        const minViewX = pos.x - this.world.tileViewDist;
        const maxViewX = pos.x + this.world.tileViewDist;
        const minViewY = pos.y - this.world.tileViewDist;
        const maxViewY = pos.y + this.world.tileViewDist;
        // get the chunk coords of these extreme points
        const [tlX, tlY] = TilePoint.getChunkCoord(minViewX, minViewY, this.chunkSize);
        const [trX, trY] = TilePoint.getChunkCoord(maxViewX, minViewY, this.chunkSize);
        const [blX, blY] = TilePoint.getChunkCoord(minViewX, maxViewY, this.chunkSize);
        const [brX, brY] = TilePoint.getChunkCoord(maxViewX, maxViewY, this.chunkSize);
        // save the chunks to a set so we only get unique chunks
        const chunks: Set<Chunk> = new Set();
        const tl = this.chunks.get(tlX, tlY);
        if (tl) chunks.add(tl);
        const tr = this.chunks.get(trX, trY);
        if (tr) chunks.add(tr);
        const bl = this.chunks.get(blX, blY);
        if (bl) chunks.add(bl);
        const br = this.chunks.get(brX, brY);
        if (br) chunks.add(br);

        return chunks;
    }

    public getChunk(x: number, y: number): Chunk {
        return this.chunks.get(x, y);
    }

    public getChunkContaining(pos: Point): Chunk {
        const [ccx, ccy] = TilePoint.getChunkCoord(pos.x, pos.y, this.world.chunks.chunkSize);
        return this.world.chunks.getChunk(ccx, ccy);
    }

    public getNeighbours(chunk: Chunk): Chunk[] {
        const neighbours: Chunk[] = [];
        const minX = chunk.x - 1;
        const maxX = chunk.x + 1;
        const minY = chunk.y - 1;
        const maxY = chunk.y + 1;
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const nbc = this.getChunk(x, y);
                if (nbc) {
                    neighbours.push(nbc);
                }
            }
        }
        return neighbours;
    }

    private loadChunk(id: string): void {
        metrics.chunkLoad();
        const cm = new Chunk(this.worldDef.chunks[id], this.chunkSize, this.world);
        this.chunks.set(cm.x, cm.y, cm);
    }

    private handleChunkLoad(client: Client): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(client.player.position.x, client.player.position.y, this.chunkSize);
        const chunk = this.chunks.get(ccx, ccy);
        const chunks: ChunkDef[] = [];
        for (const nbc of this.getNeighbours(chunk)) {
            // only send the player chunks they do not have loaded
            if (!client.player.loadedChunks.contains(nbc.x, nbc.y)) {
                chunks.push(nbc.toNet());
                client.player.loadedChunks.set(nbc.x, nbc.y, nbc); // mark as loaded
            }
        }
        client.player.pruneLoadedChunks(); // prune the chunks the player will unload
        client.socket.emit(PacketHeader.CHUNK_LOAD, <ChunkListPacket>{
            center: client.player.position.toNet(),
            chunks,
        });
    }

    private tileToChunk(tilePoint: Point): [Point, Chunk] {
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
