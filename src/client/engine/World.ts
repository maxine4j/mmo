import * as THREE from 'three';
import Scene from './graphics/Scene';
import LocalPlayer from './LocalPlayer';
import NetClient from './NetClient';
import {
    PacketHeader, TickPacket, ChunkListPacket, WorldInfoPacket,
} from '../../common/Packet';
import LocalUnit from './LocalUnit';
import UnitDef from '../../common/UnitDef';
import ChunkWorld from './ChunkWorld';
import Chunk from './Chunk';

export default class World {
    public scene: Scene;
    public chunkWorld: ChunkWorld;
    public units: Map<number, LocalUnit> = new Map();
    public players: Map<number, LocalPlayer> = new Map();
    private _player: LocalPlayer;
    private _tickTimer: number;
    private _tickRate: number;
    private currentTick: number;

    public constructor(scene: Scene, info: WorldInfoPacket) {
        this.scene = scene;
        this._player = new LocalPlayer(this, null);
        this._tickRate = info.tickRate;
        this.chunkWorld = new ChunkWorld(this.scene, info.chunkSize);
        NetClient.on(PacketHeader.WORLD_TICK, (p: TickPacket) => {
            this.onTick(p);
        });
        NetClient.on(PacketHeader.CHUNK_LOAD, (p: ChunkListPacket) => {
            const chunkLoads: Promise<Chunk>[] = [];
            for (const def of p.chunks) {
                chunkLoads.push(this.chunkWorld.loadChunk(def));
            }
            Promise.all(chunkLoads).then(() => {
                this.chunkWorld.stitchChunks();
            });
        });
        NetClient.send(PacketHeader.CHUNK_LOAD);
    }

    public get player(): LocalPlayer { return this._player; }
    public get tickTimer(): number { return this._tickTimer; }
    public get tickRate(): number { return this._tickRate; }
    public get tickProgression(): number { return this._tickTimer / this._tickRate; }

    private tickUnits(tick: number, units: UnitDef[], localUnits: Map<number, LocalUnit>): void {
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

    private removeStaleUnits(units: Map<number, LocalUnit>): void {
        for (const [id, u] of units) {
            if (u.lastTickUpdated !== this.currentTick) {
                u.dispose();
                units.delete(id);
            }
        }
    }

    public onTick(packet: TickPacket): void {
        this._tickTimer = 0; // reset tick timer
        this.currentTick = packet.tick; // update the current tick

        this.player.onTick(packet.self);
        this.tickUnits(packet.tick, packet.units, this.units);
        this.tickUnits(packet.tick, packet.players, this.players);
        this.removeStaleUnits(this.units);
        this.removeStaleUnits(this.players);
    }

    private updateUnits(delta: number): void {
        for (const [_, u] of this.units) {
            u.update(delta);
        }
    }

    private updatePlayers(delta: number): void {
        for (const [_, p] of this.players) {
            p.update(delta);
        }
    }

    public update(delta: number, mousePoint: THREE.Vector3): void {
        this.player.update(delta);
        this.player.updatePlayer(mousePoint);
        this.updateUnits(delta);
        this.updatePlayers(delta);

        // increment tick timer
        this._tickTimer += delta;
    }
}
