import Unit from '../models/Unit';
import Spawner from '../models/Spanwer';
import UnitSpawnsDef from '../data/UnitSpawnsDef';
import WorldManager from './WorldManager';
import { Point } from '../../common/Point';
import { PacketHeader, DamagePacket } from '../../common/Packet';
import IManager from './IManager';
import Client from '../models/Client';

const unitSpawnDefs: UnitSpawnsDef = {
    'human-group': {
        id: 'human-group',
        unit: {
            id: 'human',
            maxHealth: 2,
            name: 'Man',
            level: 1,
            model: 'assets/models/units/human/human.model.json',
        },
        center: { x: 0, y: 0 },
        spawnRadius: { x: 5, y: 5 },
        wanderRadius: { x: 10, y: 10 },
        leashRadius: { x: 15, y: 15 },
        wanderRate: 20,
        minAlive: 1,
        maxAlive: 1,
        spawnRate: 10,
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
        this.world.on('tick', this.tick.bind(this));
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
            for (const player of this.world.players.inRange(unit.position)) {
                player.send(PacketHeader.UNIT_DAMAGED, <DamagePacket>{
                    damage: dmg,
                    defender: defender.id,
                    attacker: attacker.id,
                });
            }
        });
        unit.on('death', (dmg: number, attacker: Unit) => {
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
