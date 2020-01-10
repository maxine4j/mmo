import * as THREE from 'three';
import TerrainChunk from './TerrainChunk';
import Scene from './graphics/Scene';
import Player from './Player';
import Input, { MouseButton } from './Input';
import NetClient from './NetClient';
import { PacketHeader, PointPacket, ChunkPacket } from '../../common/Packet';
import Point from '../../common/Point';
import Chunk from '../../common/Chunk';

export default class World {
    public scene: Scene;
    public chunks: Map<number, TerrainChunk> = new Map();
    private player: Player;

    public constructor(scene: Scene) {
        this.scene = scene;
        this.player = new Player(this);
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

    public update(delta: number, mousePos: THREE.Vector3) {
        this.player.update(delta, this);

        // move the player
        if (Input.wasMousePressed(MouseButton.RIGHT)) {
            const tile = this.worldToTile(mousePos);
            if (tile) {
                NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: tile.x, y: tile.y });
            }
        }
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
            // transform tile coords to chunk coords
            const chunkX = tileX - (chunk.size * chunk.x);
            const chunkY = tileY - (chunk.size * chunk.y);

            if (chunkX > -75 && chunkX < 75
                && chunkY > -75 && chunkY < 75) {
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
