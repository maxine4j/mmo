import uuid from 'uuid/v4';
import { PointDef } from '../../common/Point';
import WorldManager from './WorldManager';
import { UnitSpawnGroup } from '../data/UnitSpawnsDef';
import UnitManager from './UnitManager';

export default class SpawnManager {
    private world: WorldManager;
    public data: UnitSpawnGroup;
    private units: Map<string, UnitManager> = new Map();
    private lastSpawnTick: number = 0;

    public constructor(def: UnitSpawnGroup, world: WorldManager) {
        this.world = world;
        this.data = def;
    }

    private getRandomPoint(center: PointDef, radius: PointDef): PointDef {
        const dx = Math.floor((Math.random() * radius.x * 2) - radius.x);
        const dy = Math.floor((Math.random() * radius.y * 2) - radius.y);
        return {
            x: center.x + dx,
            y: center.y + dy,
        };
    }

    private spawnUnit(): void {
        const id = uuid();
        const unit = new UnitManager(this.world, {
            id,
            animation: 'stand',
            health: this.data.unit.maxHealth,
            maxHealth: this.data.unit.maxHealth,
            name: this.data.unit.name,
            level: this.data.unit.level,
            model: this.data.unit.model,
            running: false,
            position: this.getRandomPoint(this.data.center, this.data.spawnRadius),
            moveQueue: [],
        });
        // save the new unit to the world and also keep track of it here
        this.units.set(unit.data.id, unit);
        this.world.units.set(unit.data.id, unit);
        this.lastSpawnTick = this.world.tickCounter; // update the last spawn tick
    }

    private checkRate(rate: number, lastTick: number): boolean {
        return (lastTick + rate) < this.world.tickCounter;
    }

    private tickSpawns(): void {
        if (this.units.size < this.data.minAlive) {
            // spawn a unit every tick when under the min alive limit
            this.spawnUnit();
        } else if (this.checkRate(this.data.spawnRate, this.lastSpawnTick) && this.units.size < this.data.maxAlive) {
            // spawn a unit if we are below the max alive limit and can spawn this tick
            this.spawnUnit();
        }
    }

    private wanderUnit(unit: UnitManager): void {
        const target = this.getRandomPoint(this.data.center, this.data.wanderRadius);
        unit.moveTo(target);
        unit.lastWanderTick = this.world.tickCounter;
    }

    private tickWander(unit: UnitManager): void {
        if (this.checkRate(this.data.wanderRate, unit.lastWanderTick)) {
            this.wanderUnit(unit);
        }
    }

    private tickUnits(): void {
        for (const [id, unit] of this.units) {
            if (unit.dead) {
                // remove the unit from the world
                // TODO: should drop items here?
                this.world.units.delete(id);
                this.units.delete(id);
            }
            unit.tick();
            this.tickWander(unit);
        }
    }

    public tick(): void {
        // tick this managers units
        this.tickUnits();
        // spawn units if required
        this.tickSpawns();
    }
}
