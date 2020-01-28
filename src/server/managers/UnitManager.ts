import Unit from '../models/Unit';
import SpawnManager from './SpawnManager';
import UnitSpawnsDef from '../data/UnitSpawnsDef';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';
import { PacketHeader, DamagePacket } from '../../common/Packet';

type UnitManagerEvent = 'damaged';

const unitSpawnDefs: UnitSpawnsDef = {
    'skeleton-group': {
        id: 'skeleton-group',
        unit: {
            id: 'skeleton',
            maxHealth: 2,
            name: 'Skeleton',
            level: 1,
            model: 'assets/models/units/skeleton/skeleton.model.json',
        },
        center: { x: -60, y: -60 },
        spawnRadius: { x: 5, y: 5 },
        wanderRadius: { x: 10, y: 10 },
        leashRadius: { x: 15, y: 15 },
        wanderRate: 20,
        minAlive: 1,
        maxAlive: 5,
        spawnRate: 10,
    },
};


export default class UnitManager {
    private world: WorldManager;
    private units: Map<string, Unit> = new Map();
    private spawns: Map<string, SpawnManager> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        for (const id in unitSpawnDefs) {
            this.loadUnitSpawn(id);
        }
    }

    public getUnit(id: string): Unit {
        return this.units.get(id);
    }

    private loadUnitSpawn(id: string): void {
        const sm = new SpawnManager(unitSpawnDefs[id], this.world);
        this.spawns.set(id, sm);
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

    private tickSpawns(): void {
        for (const [_, sm] of this.spawns) {
            sm.tick();
        }
    }

    private removeUnit(unit: Unit): void {
        unit.dispose();
        this.units.delete(unit.data.id);
    }

    public addUnit(unit: Unit): void {
        this.units.set(unit.data.id, unit);
        unit.updateChunk();
        unit.on('damaged', (defender: Unit, dmg: number, attacker: Unit) => {
            for (const player of this.world.players.inRange(unit.position)) {
                player.socket.emit(PacketHeader.UNIT_DAMAGED, <DamagePacket>{
                    damage: dmg,
                    defender: defender.data.id,
                    attacker: attacker.data.id,
                });
            }
        });
        unit.on('death', (dmg: number, attacker: Unit) => {
            this.world.onNextTick(() => {
                this.removeUnit(unit);
            });
        });
    }
}
