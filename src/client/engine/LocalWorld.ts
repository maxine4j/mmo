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
import Camera from './graphics/Camera';

export default class LocalWorld {
    public scene: Scene;
    public chunks: Map<number, TerrainChunk> = new Map();
    public units: Map<number, LocalUnit> = new Map();
    public players: Map<number, LocalPlayer> = new Map();
    private _player: LocalPlayer;
    private _tickTimer: number;
    private _tickRate: number;
    private currentTick: number;
    private camera: Camera;

    public constructor(scene: Scene) {
        this.scene = scene;
        this._player = new LocalPlayer(this);
        this._tickRate = 0.6; // TODO: get from server
        NetClient.on(PacketHeader.WORLD_TICK, (p: TickPacket) => { this.onTick(p); });
        NetClient.on(PacketHeader.CHUNK_LOAD, (p: ChunkPacket) => { this.loadChunk(p); });
        NetClient.send(PacketHeader.CHUNK_LOAD);
    }

    public async loadChunk(chunk: Chunk): Promise<TerrainChunk> {
        return new Promise((resolve) => {
            TerrainChunk.load(chunk, this).then((tc: TerrainChunk) => {
                this.chunks.set(chunk.id, tc);
                resolve(tc);
            });
        });
    }

    public attatchCamera(camera: Camera) {
        this.camera = camera;
    }

    public get player(): LocalPlayer { return this._player; }
    public get tickTimer(): number { return this._tickTimer; }
    public get tickRate(): number { return this._tickRate; }
    public get tickProgression(): number { return this._tickTimer / this._tickRate; }

    private tickUnits(tick: number, units: Unit[], localUnits: Map<number, LocalUnit>) {
        for (const u of units) {
            let loc = localUnits.get(u.id);
            if (!loc) {
                loc = new LocalUnit(this, u);
                localUnits.set(u.id, loc);
            }
            loc.onTick(u);
            loc.lastTickUpdated = tick;
        }
    }

    private removeStaleUnits(units: Map<number, LocalUnit>) {
        for (const [id, u] of units) {
            if (u.lastTickUpdated !== this.currentTick) {
                u.dispose();
                units.delete(id);
            }
        }
    }

    public onTick(packet: TickPacket) {
        this._tickTimer = 0; // reset tick timer
        this.currentTick = packet.tick; // update the current tick

        this.tickUnits(packet.tick, packet.units, this.units);
        this.tickUnits(packet.tick, packet.players, this.players);
        this.removeStaleUnits(this.units);
        this.removeStaleUnits(this.players);
    }

    private updateUnits(delta: number) {
        for (const [_, u] of this.units) {
            u.update(delta);
        }
    }

    private updatePlayers(delta: number) {
        for (const [_, p] of this.players) {
            p.update(delta);
        }
    }

    public update(delta: number, mousePoint: THREE.Vector3) {
        this.player.update(delta);
        this.player.updatePlayer(mousePoint);
        this.updateUnits(delta);
        this.updatePlayers(delta);

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

    public chunkToTile(chunk: TerrainChunk, chunkX: number, chunkY: number): Point {
        const x = chunkX + (chunk.x * chunk.size);
        const y = chunkY + (chunk.y * chunk.size);
        return new Point(x, y);
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
