import Unit from '../models/Unit';
import Player from '../models/Player';
import Client from '../Client';
import {
    PacketHeader, CharacterPacket, PointPacket, TargetPacket, LootPacket, InventoryPacket,
    DamagePacket, InventorySwapPacket, ResponsePacket, TickPacket, InventoryUsePacket,
} from '../../common/Packet';
import CharacterEntity from '../entities/Character.entity';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';
import CharacterDef from '../../common/CharacterDef';
import UnitDef from '../../common/UnitDef';
import { GroundItemDef } from '../../common/ItemDef';

export default class PlayerManager {
    private world: WorldManager;
    private players: Map<string, Player> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        this.world.on('tick', this.tick.bind(this));
    }

    /**
     * Sets up a new client
     * @param client
     */
    public handleClient(client: Client): void {
        client.socket.on(PacketHeader.PLAYER_ENTERWORLD, (packet) => {
            this.handlePlayerEnterWorld(client, packet);
        });
        client.socket.on(PacketHeader.PLAYER_LEAVEWORLD, () => {
            this.handlePlayerLeaveWorld(client);
        });
        client.socket.on('disconnect', () => {
            this.handlePlayerLeaveWorld(client);
        });
        client.socket.on(PacketHeader.AUTH_LOGOUT, () => {
            this.handlePlayerLeaveWorld(client);
        });


        // player
        client.socket.on(PacketHeader.PLAYER_MOVETO, (packet: PointPacket) => {
            this.handleMoveTo(client, packet);
        });
        client.socket.on(PacketHeader.PLAYER_TARGET, (packet: TargetPacket) => {
            this.handlePlayerTarget(client, packet);
        });
        client.socket.on(PacketHeader.PLAYER_LOOT, (packet: LootPacket) => {
            this.handlePlayerLoot(client, packet);
        });

        // inventory
        client.socket.on(PacketHeader.INVENTORY_SWAP, (packet: InventorySwapPacket) => {
            client.socket.emit(PacketHeader.INVENTORY_SWAP, this.handleInventorySwap(client, packet));
        });
        client.socket.on(PacketHeader.INVENTORY_USE, (packet: InventoryUsePacket) => {
            client.socket.emit(PacketHeader.INVENTORY_USE, this.handleInventoryUse(client, packet));
        });
    }

    /**
     * Ticks the player manager
     */
    private tick(): void {
        for (const [_, player] of this.players) {
            player.tick(); // tick the player
            // send players, units, and ground items in range
            const players: CharacterDef[] = this.inRange(player.position).map((pm) => pm.data);
            const units: UnitDef[] = this.world.units.inRange(player.position).map((um) => um.data);
            const groundItems: GroundItemDef[] = Array.from(player.visibleGroundItems).map(([id, gi]) => gi);
            player.socket.emit(PacketHeader.WORLD_TICK, <TickPacket>{
                self: player.data,
                units,
                players,
                groundItems,
                tick: this.world.tickCounter,
            });
        }
    }

    private handlePlayerEnterWorld(client: Client, packet: CharacterPacket): void {
        if (packet) {
            // find an entity for this char
            CharacterEntity.findOne({
                where: {
                    id: Number(packet.id),
                },
            }).then((ce) => {
                const bagData = ce.bags.toNet();
                const bankData = ce.bank.toNet();
                client.player = new Player(this.world, ce.toNet(), client.socket, bagData, bankData);
                this.addPlayer(client.player);

                // // notify all players in range
                // for (const player of this.inRange(client.player.position)) {
                //     player.socket.emit(PacketHeader.PLAYER_ENTERWORLD, client.player.data);
                // }
                // add the char to the logged in players list
                client.socket.emit(PacketHeader.PLAYER_ENTERWORLD, <CharacterPacket>client.player.data);
                client.socket.emit(PacketHeader.INVENTORY_FULL, <InventoryPacket>client.player.bags.data);
            });
        }
    }

    private handleMoveTo(client: Client, packet: PointPacket): void {
        client.player.data.target = '';
        client.player.moveTo(packet);
    }

    private handlePlayerTarget(client: Client, packet: TargetPacket): void {
        const tar = this.world.units.getUnit(packet.target);
        if (tar) {
            client.player.attackUnit(tar);
        }
    }

    private handlePlayerLoot(client: Client, packet: LootPacket): void {
        const gi = this.world.groundItems.getItem(packet.uuid);
        if (gi) {
            client.player.pickUpItem(gi);
        }
    }

    private handlePlayerLeaveWorld(client: Client): void {
        // remove the sessions player from the world if one exists
        const player = this.players.get(client.id);
        if (player) {
            this.removePlayer(player);
        }
    }

    public addPlayer(player: Player): void {
        this.players.set(player.socket.id, player);
        player.updateChunk();
        player.on('damaged', (defender: Unit, dmg: number, attacker: Unit) => {
            for (const p of this.inRange(player.position)) {
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

    private async removePlayer(player: Player): Promise<void> {
        await player.save();
        this.players.delete(player.socket.id);
    }

    /**
     * Returns a list of players that are in range of the given tile point
     * @param pos Tile point
     */
    public inRange(pos: Point): Player[] {
        const inrange: Player[] = [];
        const bounds = this.world.viewBounds(pos);
        for (const chunk of this.world.chunks.inRange(pos)) {
            for (const [_, p] of chunk.players) {
                if (bounds.contains(Point.fromDef(p.position))) {
                    inrange.push(p);
                }
            }
        }
        return inrange;
    }


    public handleInventorySwap(client: Client, packet: InventorySwapPacket): ResponsePacket {
        client.player.bags.swap(packet.slotA, packet.slotB);
        return <ResponsePacket>{
            success: true,
            message: '',
        };
    }

    public handleInventoryUse(client: Client, packet: InventoryUsePacket): ResponsePacket {
        const message = client.player.bags.useItems(packet.slotA, packet.slotB);
        return <ResponsePacket>{
            success: true,
            message,
        };
    }
}
