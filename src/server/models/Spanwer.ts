import uuid from 'uuid/v4';
import { EventEmitter } from 'events';
import { PointDef, Point } from '../../common/Point';
import WorldManager from '../managers/WorldManager';
import { UnitSpawnGroup } from '../data/UnitSpawnsDef';
import Unit, { UnitState } from './Unit';

type SpawnerEvent = 'spawn';

export default class Spawner {
    private eventEmitter: EventEmitter = new EventEmitter();
    private world: WorldManager;
    private data: UnitSpawnGroup;
    private units: Map<string, Unit> = new Map();
    private lastSpawnTick: number = 0;
    public get center(): Point { return Point.fromDef(this.data.center); }

    public constructor(def: UnitSpawnGroup, world: WorldManager) {
        this.world = world;
        this.data = def;
    }

    public on(event: SpawnerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: SpawnerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: SpawnerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    private getRandomPoint(center: PointDef, radius: PointDef): PointDef {
        const dx = Math.floor((Math.random() * radius.x * 2) - radius.x);
        const dy = Math.floor((Math.random() * radius.y * 2) - radius.y);
        return {
            x: center.x + dx,
            y: center.y + dy,
        };
    }

    private checkRate(rate: number, lastTick: number): boolean {
        return (lastTick + rate) < this.world.currentTick;
    }

    private spawnUnit(): void {
        const id = uuid();
        const unit = new Unit(this.world, {
            id,
            target: '',
            autoRetaliate: true,
            health: this.data.unit.maxHealth,
            maxHealth: this.data.unit.maxHealth,
            name: this.data.unit.name,
            level: this.data.unit.level,
            model: this.data.unit.model,
            running: false,
            position: this.getRandomPoint(this.data.center, this.data.spawnRadius),
            moveQueue: [],
        });
        unit.on('death', () => {
            this.units.delete(unit.id);
        });
        // save the new unit to the world and also keep track of it here
        this.units.set(unit.id, unit);
        this.lastSpawnTick = this.world.currentTick; // update the last spawn tick
        this.emit('spawn', this, unit);
    }

    private wanderUnit(unit: Unit): void {
        if (unit.state === UnitState.IDLE) {
            unit.moveTo(this.getRandomPoint(this.data.center, this.data.wanderRadius));
            unit.lastWanderTick = this.world.currentTick;
        }
    }

    private tickWander(unit: Unit): void {
        if (this.checkRate(this.data.wanderRate, unit.lastWanderTick)) {
            this.wanderUnit(unit);
        }
    }

    private tickLeash(unit: Unit): void {
        const diff = unit.position.sub(this.center);
        if (Math.abs(diff.x) > this.data.leashRadius.x || Math.abs(diff.y) > this.data.leashRadius.y) {
            unit.stopAttacking();
            unit.lastWanderTick = 0;
            this.wanderUnit(unit);
            unit.health = unit.maxHealth;
        }
    }

    private tickUnits(): void {
        for (const [_, unit] of this.units) {
            unit.tick();
            this.tickWander(unit);
            this.tickLeash(unit);
        }
    }

    public tick(): void {
        // tick this managers units
        this.tickUnits();
        if (this.units.size < this.data.minAlive) {
            this.spawnUnit(); // spawn a unit every tick when under the min alive limit
        } else if (this.checkRate(this.data.spawnRate, this.lastSpawnTick) && this.units.size < this.data.maxAlive) {
            this.spawnUnit(); // spawn a unit if we are below the max alive limit and can spawn this tick
        }
    }
}
