import uuid from 'uuid/v4';
import { EventEmitter } from 'events';
import { PointDef, Point } from '../../common/Point';
import WorldManager from '../managers/WorldManager';
import { UnitSpawnGroup } from '../data/UnitSpawnsDef';
import Unit, { UnitState } from './Unit';
import LootTable from './LootTable';
import LootTableEntity from '../entities/LootTable.entity';

const maxSpawnRetries = 10;

declare interface Spawner {
    emit(event: 'spawn', self: Spawner, unit: Unit): boolean;

    on(event: 'spawn', listener: (self: Spawner, unit: Unit) => void): this;
}

class Spawner extends EventEmitter {
    private world: WorldManager;
    private data: UnitSpawnGroup;
    private lootTable: LootTable;
    private units: Map<string, Unit> = new Map();
    private lastSpawnTick: number = 0;
    public get center(): Point { return Point.fromDef(this.data.center); }

    public constructor(def: UnitSpawnGroup, world: WorldManager) {
        super();

        this.world = world;
        this.data = def;
        LootTableEntity.findOne({ where: { id: def.lootTable } }).then((table) => {
            this.lootTable = new LootTable(table);
        });
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
        let retries = 0;
        let position;
        let spawnChunk = null;
        while (spawnChunk == null && retries < maxSpawnRetries) {
            position = this.getRandomPoint(this.data.center, this.data.spawnRadius);
            spawnChunk = this.world.chunks.getChunkContaining(Point.fromDef(position));
            retries++;
        }
        if (spawnChunk == null) {
            console.log(`Warning: Unable to spawn unit from spawner "${this.data.id}" after ${retries} retries`);
            return;
        }

        const id = uuid();
        const unit = new Unit(
            this.world,
            {
                uuid: id,
                target: '',
                autoRetaliate: true,
                health: null,
                maxHealth: null,
                name: this.data.unit.name,
                level: null,
                model: this.data.unit.model,
                running: false,
                position,
                combatStyle: this.data.unit.combatStyle,
                interacting: false,
                isPlayer: false,
            },
        );
        unit.setStats(this.data.unit.stats);
        unit.on('death', (self: Unit) => {
            this.units.delete(unit.id);
            for (const drop of this.lootTable.roll()) {
                this.world.ground.addItem(drop, self.position);
            }
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

export default Spawner;
