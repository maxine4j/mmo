import Unit from '../models/Unit';
import Spawner from '../models/Spanwer';
import UnitSpawnsDef from '../data/UnitSpawnsDef';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';
import { PacketHeader, DamagePacket } from '../../common/Packet';
import IManager from './IManager';
import Client from '../models/Client';
import { CombatStyle } from '../../common/definitions/UnitDef';
import { metricsEmitter } from '../metrics/metrics';

const metrics = metricsEmitter();

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
        minAlive: 20,
        maxAlive: 20,
        spawnRate: 10,
        lootTable: 0,
    },
};

export default class UnitManager implements IManager {
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
        this.world.on('tick', () => this.tick());
    }

    public enterWorld(client: Client): void {}
    public leaveWorld(client: Client): void {}

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

    private addUnit(unit: Unit): void {
        this.units.set(unit.id, unit);
        unit.on('damaged', (defender: Unit, dmg: number, attacker: Unit) => {
            metrics.damageDealt(attacker.isPlayer ? 'player' : 'monster', defender.isPlayer ? 'player' : 'monster', dmg);
            for (const player of this.world.players.inRange(unit.position)) {
                player.send(PacketHeader.UNIT_DAMAGED, <DamagePacket>{
                    damage: dmg,
                    defender: defender.id,
                    attacker: attacker.id,
                });
            }
        });
        unit.on('death', (self: Unit, dmg: number, attacker: Unit) => {
            metrics.unitDied('monster');
            this.world.onNextTick(() => {
                this.removeUnit(unit);
            });
        });
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
