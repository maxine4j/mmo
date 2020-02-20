import Unit from '../models/Unit';
import Player from '../models/Player';
import Client from '../models/Client';
import {
    PacketHeader, DamagePacket, TickPacket, Packet, UnitMovedPacket, UnitPacket,
} from '../../common/Packet';
import WorldManager from './WorldManager';
import { Point, PointDef } from '../../common/Point';
import IManager from './IManager';

export default class PlayerManager implements IManager {
    private world: WorldManager;
    private players: Map<string, Player> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        this.world.on('tick', this.tick.bind(this));
    }

    public enterWorld(client: Client): void {
        this.addPlayer(client.player);
    }

    public leaveWorld(client: Client): void {
        if (client.player) {
            this.removePlayer(client.player);
        }
    }

    public getPlayer(id: string): Player {
        return this.players.get(id);
    }

    private addPlayer(player: Player): void {
        this.players.set(player.id, player); // WAS: socket.id
        player.on('moved', (self: Player, start: PointDef, path: PointDef[]) => {
            this.world.players.emitInRange(
                self.position,
                PacketHeader.UNIT_MOVED,
                <UnitMovedPacket>{
                    uuid: self.id,
                    start,
                    path,
                },
            );
        });
        player.on('damaged', (defender: Unit, dmg: number, attacker: Unit) => {
            for (const p of this.inRange(player.position)) {
                p.send(PacketHeader.UNIT_DAMAGED, <DamagePacket>{
                    damage: dmg,
                    defender: defender.id,
                    attacker: attacker.id,
                });
            }
        });
        player.on('death', () => {
            player.respawn();
        });

        this.emitInRange(player.position, PacketHeader.UNIT_ADDED, <UnitPacket>player.toNet());
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
