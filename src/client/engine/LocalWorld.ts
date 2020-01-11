import * as THREE from 'three';
import TerrainChunk from './TerrainChunk';
import Scene from './graphics/Scene';
import LocalPlayer from './LocalPlayer';
import NetClient from './NetClient';
import {
    PacketHeader, ChunkPacket, TickPacket,
} from '../../common/Packet';
import Point from '../../common/Point';
import Chunk from '../../common/Chunk';
import LocalUnit from './LocalUnit';
import Unit from '../../common/Unit';

export default class LocalWorld {
    public scene: Scene;
    public chunks: Map<number, TerrainChunk> = new Map();
    public units: Map<number, LocalUnit> = new Map();
    public players: Map<number, LocalPlayer> = new Map();
    private player: LocalPlayer;
    private _tickTimer: number;
    private _tickRate: number;
    private currentTick: number;

    public constructor(scene: Scene) {
        this.scene = scene;
        this.player = new LocalPlayer(this);
        this._tickRate = 0.6; // TODO: get from server
        NetClient.on(PacketHeader.WORLD_TICK, (p: TickPacket) => { this.onTick(p); });
        NetClient.on(PacketHeader.CHUNK_LOAD, (p: ChunkPacket) => { this.loadChunk(p); });
        NetClient.send(PacketHeader.CHUNK_LOAD);
    }

    public async loadChunk(chunk: Chunk): Promise<TerrainChunk> {
        return new Promise((resolve) => {
            TerrainChunk.load(chunk).then((tc) => {
                this.chunks.set(chunk.id, tc);
                this.scene.add(tc.terrain.plane);
                resolve(tc);
            });
        });
    }

    public get tickTimer(): number { return this._tickTimer; }
    public get tickRate(): number { return this._tickRate; }
    public get tickProgression(): number { return this._tickTimer / this._tickRate; }

    private tickUnits(tick: number, units: Unit[]) {
        for (const u of units) {
            const loc = this.units.get(u.id);
            loc.onTick(u);
            loc.lastTickUpdated = tick;
        }
    }

    private removeStaleUnits(units: Map<number, LocalUnit>) {
        for (const [id, entity] of this.units) {
            if (entity.lastTickUpdated !== this.currentTick) {
                this.units.delete(id);
            }
        }
    }

    public onTick(packet: TickPacket) {
        this._tickTimer = 0; // reset tick timer
        this.currentTick = packet.tick; // update the current tick

        this.tickUnits(packet.tick, packet.units);
        this.tickUnits(packet.tick, packet.players);
        this.removeStaleUnits(this.units);
        this.removeStaleUnits(this.players);
    }

    public update(delta: number, mousePoint: THREE.Vector3) {
        this.player.update(delta);
        this.player.updatePlayer(mousePoint);

        // increment tick timer
        this._tickTimer += delta;
    }

    public worldToTile(coord: THREE.Vector3): Point {
        return new Point(Math.floor(coord.x + 0.5), Math.floor(coord.z + 0.5));
    }

    public tileToWorld(tileX: number, tileY: number): THREE.Vector3 {
        const wx = tileX;
        const wz = tileY;

        const elevation = this.getElevation(tileX, tileY);
        return new THREE.Vector3(wx, elevation, wz);
    }

    public getElevation(tileX: number, tileY: number): number {
        for (const [_, chunk] of this.chunks) {
            const chunkX = tileX - (chunk.size * chunk.x);
            const chunkY = tileY - (chunk.size * chunk.y);
            if (chunk.containsPoint(new Point(chunkX, chunkY))) {
                return chunk.getElevation(chunkX, chunkY);
            }
        }
        return null;
    }

    public tileToChunk(tileX: number, tileY: number): Point {
        for (const [_, chunk] of this.chunks) {
            const chunkX = tileX - (chunk.x * chunk.size);
            const chunkY = tileY - (chunk.y * chunk.size);
            const chunkBound = chunk.size / 2;
            // check if the calculated point is within this chunk
            if (chunkX >= -chunkBound && chunkX <= chunkBound
                && chunkY >= -chunkBound && chunkY <= chunkBound) {
                return new Point(chunkX, chunkY);
            }
        }
        return new Point(NaN, NaN);
    }

    public terrainWireframes(visible: boolean) {
        for (const [_, chunk] of this.chunks) {
            if (visible) {
                chunk.terrain.showWireframe();
            } else {
                chunk.terrain.hideWireFrame();
            }
        }
    }
}
