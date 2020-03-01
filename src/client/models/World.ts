import * as THREE from 'three';
import { EventEmitter } from 'events';
import Scene from '../engine/graphics/Scene';
import LocalPlayer from './Player';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, TickPacket, ChunkListPacket, WorldInfoPacket,
} from '../../common/Packet';
import ChunkWorld from '../managers/ChunkManager';
import Chunk from './Chunk';
import { TilePoint, WorldPoint } from '../../common/Point';
import { GroundItemDef } from '../../common/definitions/ItemDef';
import GroundItem from './GroundItem';
import UnitManager from '../managers/UnitManager';

declare interface World {
    emit(event: 'tick', self: World, tick: number): boolean;
    emit(event: 'groundItemAdded', self: World, item: GroundItem): boolean;
    emit(event: 'groundItemRemoved', self: World, item: GroundItem): boolean;

    on(event: 'tick', listener: (self: World, tick: number) => void): this;
    on(event: 'groundItemAdded', listener: (self: World, item: GroundItem) => void): this;
    on(event: 'groundItemRemoved', listener: (self: World, item: GroundItem) => void): this;
}

class World extends EventEmitter {
    public scene: Scene;
    public chunkWorld: ChunkWorld;
    public readonly players: Map<string, LocalPlayer> = new Map();
    public readonly units: UnitManager = new UnitManager(this);
    public readonly groundItems: Map<string, GroundItem> = new Map();
    private _player: LocalPlayer;
    private _tickTimer: number;
    private _tickRate: number;
    private _currentTick: number;
    private chunkViewDist: number;
    public get player(): LocalPlayer { return this._player; }
    public get tickTimer(): number { return this._tickTimer; }
    public get tickRate(): number { return this._tickRate; }
    public get tickProgression(): number { return this._tickTimer / this._tickRate; }
    public get currentTick(): number { return this._currentTick; }


    public constructor(scene: Scene, info: WorldInfoPacket) {
        super();

        this.scene = scene;
        this._tickRate = info.tickRate;
        this.chunkViewDist = info.chunkViewDist;
        this.chunkWorld = new ChunkWorld(this.scene, info.chunkSize, info.chunkViewDist);
        this._player = new LocalPlayer(this, info.self);
        this.units.addUnit(this._player);

        NetClient.on(PacketHeader.WORLD_TICK, this.tick.bind(this));
        NetClient.on(PacketHeader.CHUNK_LOAD, (p: ChunkListPacket) => {
            const chunkLoads: Promise<Chunk>[] = [];
            for (const def of p.chunks) {
                chunkLoads.push(this.chunkWorld.loadChunk(def));
            }
            Promise.all(chunkLoads).then(() => {
                this.chunkWorld.pruneChunks(new TilePoint(p.center.x, p.center.y, this.chunkWorld));
                this.chunkWorld.stitchChunks();
                this.chunkWorld.stitchChunks(); // this ensures south east corners are stitched
            });
        });
        NetClient.send(PacketHeader.CHUNK_LOAD);
    }

    private tickGroundItems(tick: number, giDefs: GroundItemDef[]): void {
        for (const def of giDefs) {
            let gi = this.groundItems.get(def.item.uuid);
            if (!gi) {
                gi = new GroundItem(this, def);
                this.groundItems.set(def.item.uuid, gi);
                this.emit('groundItemAdded', this, gi);
            }
            gi.lastTickUpdated = tick;
        }
    }

    private removeStaleGroundItems(): void {
        for (const [id, gi] of this.groundItems) {
            if (gi.lastTickUpdated !== this._currentTick) {
                gi.dispose();
                this.groundItems.delete(id);
                this.emit('groundItemRemoved', this, gi);
            }
        }
    }

    private tick(packet: TickPacket): void {
        this._tickTimer = 0; // reset tick timer
        this._currentTick = packet.tick; // update the current tick

        this.player.data = packet.self;

        this.emit('tick', this, packet.tick);
    }

    public update(delta: number, mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        this.chunkWorld.update(delta);
        this.player.updateClientPlayer(mousePoint, intersects);
        this.units.update(delta);

        // increment tick timer
        this._tickTimer += delta;
    }
}

export default World;