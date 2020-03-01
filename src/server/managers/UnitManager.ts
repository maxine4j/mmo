import Unit from '../models/Unit';
import Spawner from '../models/Spanwer';
import UnitSpawnsDef from '../data/UnitSpawnsDef';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';
import {
    PacketHeader, DamagePacket, IDPacket, UnitPacket,
} from '../../common/Packet';
import Client from '../models/Client';
import { CombatStyle } from '../../common/definitions/UnitDef';

const noBonuses = {
    equipment: {
        attack: {
            crush: 0,
            magic: 0,
            ranged: 0,
            slash: 0,
            stab: 0,
        },
        defense: {
            crush: 0,
            magic: 0,
            ranged: 0,
            slash: 0,
            stab: 0,
        },
        other: {
            magicDamage: 0,
            meleeStr: 0,
            prayer: 0,
            rangedStr: 0,
        },
    },
    potion: {
        attack: 0,
        strength: 0,
        defense: 0,
        ranged: 0,
        magic: 0,
    },
    prayer: {
        attack: 1,
        strength: 1,
        defense: 1,
        ranged: 1,
        magic: 1,
    },
};

const unitSpawnDefs: UnitSpawnsDef = {
    'skeleton-group': {
        id: 'skeleton-group',
        unit: {
            id: 'skeleton',
            name: 'Skeleton',
            model: 'skeleton',
            combatStyle: CombatStyle.MELEE_AGGRESSIVE,
            stats: {
                attack: 1,
                strength: 1,
                defense: 1,
                hitpoints: 3,
                magic: 1,
                ranged: 1,
                prayer: 1,
                bonuses: noBonuses,
            },
        },
        center: { x: -60, y: -60 },
        spawnRadius: { x: 15, y: 15 },
        wanderRadius: { x: 20, y: 20 },
        leashRadius: { x: 30, y: 30 },
        wanderRate: 40,
        minAlive: 0,
        maxAlive: 5,
        spawnRate: 10,
        lootTable: 0,
    },
    'chicken-group': {
        id: 'chicken-group',
        unit: {
            id: 'chicken',
            name: 'Chicken',
            model: 'chicken',
            combatStyle: CombatStyle.MELEE_AGGRESSIVE,
            stats: {
                attack: 1,
                strength: 1,
                defense: 1,
                hitpoints: 3,
                magic: 1,
                ranged: 1,
                prayer: 1,
                bonuses: noBonuses,
            },
        },
        center: { x: 0, y: 0 },
        spawnRadius: { x: 25, y: 25 },
        wanderRadius: { x: 30, y: 30 },
        leashRadius: { x: 35, y: 35 },
        wanderRate: 20,
        minAlive: 5,
        maxAlive: 15,
        spawnRate: 10,
        lootTable: 0,
    },
};

const buildUnitUpdate = (unit: Unit): UnitPacket => <UnitPacket>{
    unit: unit.toNet(),
    start: unit.position.toNet(),
    path: unit.path,
};

export default class UnitManager {
    private world: WorldManager;
    private units: Map<string, Unit> = new Map();
    private spawners: Map<string, Spawner> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        for (const id in unitSpawnDefs) {
            const spawner = new Spawner(unitSpawnDefs[id], this.world);
            this.spawners.set(id, spawner);
            spawner.on('spawn', (s: Spawner, u: Unit) => {
                this.addUnit(u);
            });
        }
        this.world.on('tick', this.tick.bind(this));
        this.world.on('enterworld', this.handleEnterWorld.bind(this));
        this.world.on('leaveworld', this.handleLeaveWorld.bind(this));
    }

    private handleEnterWorld(world: WorldManager, client: Client): void {
        // tell client to add all nearby units
        setTimeout(() => { // FIXME: players do not recv existing stationary units on joining world without timeout...
            for (const unit of this.inRange(client.player.position)) {
                if (unit.isPlayer) console.log('ENTER_WORLD unit is a player!!! sending to', client.player.name, 'the units', unit.name);
                client.socket.emit(PacketHeader.UNIT_UPDATED, buildUnitUpdate(unit));
            }
        }, 1000);


        this.addUnit(client.player);
    }

    private handleLeaveWorld(world: WorldManager, client: Client): void {
        if (client.player) { // only do this if the client was logged in
            this.world.players.emitInRange(
                client.player.position,
                PacketHeader.UNIT_REMOVED,
                <IDPacket>{
                    uuid: client.player.id,
                },
            );
        }
    }

    public getUnit(id: string): Unit {
        const unit = this.units.get(id);
        if (unit) return unit;
        return this.world.players.getPlayer(id);
    }

    public inRange(pos: Point): Unit[] {
        const inrange: Unit[] = [];
        const bounds = this.world.viewBounds(pos);
        for (const chunk of this.world.chunks.inRange(pos)) {
            for (const [_, u] of chunk.units) {
                if (bounds.contains(u.position)) {
                    inrange.push(u);
                }
            }
        }
        return inrange;
    }

    public addUnit(unit: Unit): void {
        this.units.set(unit.id, unit);
        unit.on('updated', (self: Unit) => {
            this.world.players.emitInRange(
                self.position,
                PacketHeader.UNIT_UPDATED,
                buildUnitUpdate(self),
            );
        });
        unit.on('damaged', (self: Unit, dmg: number, attacker: Unit) => {
            this.world.players.emitInRange(
                self.position,
                PacketHeader.UNIT_DAMAGED,
                <DamagePacket>{
                    damage: dmg,
                    defender: self.id,
                    attacker: attacker.id,
                },
            );
        });
        unit.on('death', (self: Unit, dmg: number, attacker: Unit) => {
            this.world.players.emitInRange(
                self.position,
                PacketHeader.UNIT_DIED,
                <IDPacket>{
                    uuid: self.id,
                },
            );
            this.removeUnit(unit);
        });

        this.world.players.emitInRange(
            unit.position,
            PacketHeader.UNIT_ADDED,
            buildUnitUpdate(unit),
        );
    }

    private removeUnit(unit: Unit): void {
        unit.dispose();
        this.units.delete(unit.id);
    }

    private tick(): void {
        for (const [_, sm] of this.spawners) {
            sm.tick();
        }
    }
}
