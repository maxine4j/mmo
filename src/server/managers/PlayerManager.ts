import Unit from '../models/Unit';
import Player from '../models/Player';
import Client from '../models/Client';
import {
    PacketHeader, TickPacket, Packet,
} from '../../common/Packet';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';

export default class PlayerManager {
    private world: WorldManager;
    private players: Map<string, Player> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        this.world.on('tick', this.tick.bind(this));
        this.world.on('enterworld', this.handleEnterWorld.bind(this));
        this.world.on('leaveworld', this.handleLeaveWorld.bind(this));
    }

    private handleEnterWorld(world: WorldManager, client: Client): void {
        this.addPlayer(client.player);
    }

    private handleLeaveWorld(world: WorldManager, client: Client): void {
        if (client.player) {
            this.removePlayer(client.player);
        }
    }

    public getPlayer(id: string): Player {
        return this.players.get(id);
    }

    private addPlayer(player: Player): void {
        this.players.set(player.id, player);
        player.on('death', (self: Player, dmg: number, attacker: Unit) => {
            self.respawn();
            this.removePlayer(self);
        });
    }

    private async removePlayer(player: Player): Promise<void> {
        await player.dispose();
        this.players.delete(player.id); // WAS: socket.id
    }

    public emitInRange(point: Point, header: PacketHeader, packet: Packet): void {
        for (const player of this.inRange(point)) {
            player.send(header, packet);
        }
    }

    public inRange(pos: Point, exclude?: Player): Player[] {
        const inrange: Player[] = [];
        const bounds = this.world.viewBounds(pos);
        for (const chunk of this.world.chunks.inRange(pos)) {
            for (const [_, p] of chunk.players) {
                if (exclude && exclude.id === p.id) continue;
                if (bounds.contains(Point.fromDef(p.position))) {
                    inrange.push(p);
                }
            }
        }
        return inrange;
    }

    private tick(): void {
        for (const [_, player] of this.players) {
            player.tick(); // tick the player
            player.send(PacketHeader.WORLD_TICK, <TickPacket>{
                self: player.toNet(),
                tick: this.world.currentTick,
            });
        }
    }
}
