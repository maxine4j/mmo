import Unit from '../models/Unit';
import Player from '../models/Player';
import Client from '../models/Client';
import {
    PacketHeader, DamagePacket, TickPacket,
} from '../../common/Packet';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';
import CharacterDef from '../../common/definitions/CharacterDef';
import UnitDef from '../../common/definitions/UnitDef';
import { GroundItemDef } from '../../common/definitions/ItemDef';
import IManager from './IManager';

export default class PlayerManager implements IManager {
    private world: WorldManager;
    private players: Map<string, Player> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        this.world.on('tick', () => this.tick());
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
    }

    private async removePlayer(player: Player): Promise<void> {
        await player.dispose();
        this.players.delete(player.id); // WAS: socket.id
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
            // send players, units, and ground items in range
            const players: CharacterDef[] = this.inRange(player.position, player).map((p) => p.toNet());
            const units: UnitDef[] = this.world.units.inRange(player.position).map((u) => u.toNet());
            // const groundItems: GroundItemDef[] = Array.from(player.visibleGroundItems).map(([id, gi]) => gi.toNet());
            const groundItems: GroundItemDef[] = this.world.ground.inRange(player.position).map((gi) => gi.toNet());
            player.send(PacketHeader.WORLD_TICK, <TickPacket>{
                self: player.toNet(),
                units,
                players,
                groundItems,
                tick: this.world.currentTick,
            });
        }
    }
}
