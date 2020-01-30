import PF from 'pathfinding';
import { EventEmitter } from 'events';
import uuid from 'uuid/v4';
import { Point, PointDef, TilePoint } from '../../common/Point';
import WorldManager from '../managers/WorldManager';
import UnitDef from '../../common/UnitDef';
import Chunk from './Chunk';
import IModel from './IModel';
import ItemEntity from '../entities/Item.entity';
import ItemTypeEntity from '../entities/ItemType.entity';

export type UnitManagerEvent = 'damaged' | 'death' | 'updated' | 'wandered' | 'startedAttack' | 'stoppedAttack' | 'tick';

export enum UnitState {
    IDLE,
    FOLLOWING,
    ATTACKING,
    LOOTING,
}

let tempUnitDrop: ItemTypeEntity;

export default class Unit implements IModel {
    protected eventEmitter: EventEmitter = new EventEmitter();
    protected world: WorldManager;
    protected data: UnitDef;
    protected path: PointDef[];
    protected _state: UnitState;
    protected currentChunk: Chunk;
    private attackRate: number = 2;
    private lastAttackTick: number = 2;
    private retaliateTarget: Unit;
    public get id(): string { return this.data.id; }
    public get dead(): boolean { return this.data.health <= 0; }
    public get running(): boolean { return this.data.running; }
    public set running(r: boolean) { this.data.running = r; }
    public get position(): Point { return Point.fromDef(this.data.position); }
    public get target(): Unit { return this.world.units.getUnit(this.data.target); }
    public set target(unit: Unit) { this.data.target = unit.data.id; }
    public get state(): UnitState { return this._state; }
    public get name(): string { return this.data.name; }
    public get health(): number { return this.data.health; }
    public set health(hp: number) { this.data.health = hp; }
    public get maxHealth(): number { return this.data.maxHealth; }

    public lastWanderTick: number = 0;

    public constructor(world: WorldManager, data: UnitDef) {
        this.world = world;
        this.data = data;
        this._state = UnitState.IDLE;
        this.updateChunk();

        if (!tempUnitDrop) { // TEMP: load potential drop item types on start up
            ItemTypeEntity.findOne({ where: { id: 0 } }).then((i) => { tempUnitDrop = i; });
        }
    }

    public dispose(): void {
        this.currentChunk.units.delete(this.data.id);
        this.eventEmitter.removeAllListeners();
    }

    public toNet(): UnitDef {
        return this.data;
    }

    // #region Event Emitter
    public on(event: UnitManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: UnitManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: UnitManagerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }
    // #endregion

    // #region Range
    private distance(other: Unit): number {
        return this.position.dist(other.position);
    }

    private inMeleeRange(other: Unit): boolean {
        return this.distance(other) < 1.5;
    }
    // #endregion

    // #region Combat
    protected attackUnit(target: Unit): void {
        this._state = UnitState.ATTACKING;
        this.target = target;
    }

    public stopAttacking(): void {
        this.data.target = '';
        this._state = UnitState.IDLE;
    }

    private retaliate(target: Unit): void {
        this.retaliateTarget = target;
        this._state = UnitState.ATTACKING;
    }

    private takeHit(dmg: number, attacker: Unit): void {
        // mitigate dmg here, could also reflect to attacker
        this.data.health -= dmg;
        if (this.data.autoRetaliate) {
            this.retaliate(attacker);
        }

        this.emit('damaged', this, dmg, attacker);
        if (this.dead) {
            this.emit('death', this, dmg, attacker);
            const drop = ItemEntity.create({
                uuid: uuid(),
                inventory: null,
                slot: null,
                type: tempUnitDrop, // TODO: drop tables
            });
            this.world.ground.addItem(drop, this.position);
            attacker.stopAttacking();
        }
    }

    private calculateMeleeDamage(): number {
        return Math.round(Math.random());
    }
    // #endregion

    // #region Movement
    protected followUnit(target: Unit): void {
        this._state = UnitState.FOLLOWING;
        this.target = target;
    }

    public moveTo(dest: PointDef): void {
        this._state = UnitState.IDLE;
        this.path = this.findPath(dest);
    }

    protected findPath(dest: PointDef): PointDef[] {
        const navmap = this.world.chunks.generateNavmap(this.data.position, dest);
        const grid = new PF.Grid(navmap.matrix);

        const finder = new PF.AStarFinder({
            // @ts-ignore
            allowDiagonal: true,
            dontCrossCorners: true,
            heuristic: PF.Heuristic.chebyshev,
        });

        // transform the path to world coords
        const path = finder.findPath(navmap.start.x, navmap.start.y, navmap.end.x, navmap.end.y, grid)
            .map(([x, y]: number[]) => new Point(x + navmap.offset.x, y + navmap.offset.y))
            .reverse(); // reverse so we can use array.pop()
        path.pop(); // remove the players current position
        return path;
    }
    // #endregion

    // #region Chunk world
    protected addToNewChunk(chunk: Chunk): void {
        chunk.units.set(this.data.id, this);
        chunk.allUnits.set(this.data.id, this);
        this.currentChunk = chunk;
    }

    protected removeFromOldChunk(): void {
        this.currentChunk.units.delete(this.data.id);
        this.currentChunk.allUnits.delete(this.data.id);
    }

    private updateChunk(): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunks.chunkSize);
        const newChunk = this.world.chunks.getChunk(ccx, ccy);
        if (!this.currentChunk) {
            this.addToNewChunk(newChunk);
        } else if (newChunk.id !== this.currentChunk.id) { // if we have changed chunk
            this.removeFromOldChunk();
            this.addToNewChunk(newChunk);
        }
    }
    // #endregion

    // #region Tick
    private checkRate(rate: number, lastTick: number): boolean {
        return (lastTick + rate) < this.world.currentTick;
    }

    private tickPath(): void {
        this.data.moveQueue = [];
        if (this.path && this.path.length > 0) {
            let nextPos = this.path.pop();
            this.data.moveQueue.push(nextPos);
            if (this.data.running && this.path.length > 0) {
                nextPos = this.path.pop();
                this.data.moveQueue.push(nextPos);
            }
            this.data.position = nextPos;
            this.emit('updated', this);
            this.updateChunk();
        }
    }

    private tickFollowing(): void {
        // keep following the target unit
        if (this.inMeleeRange(this.target)) {
            this.path = this.findPath(this.target.data.position);
            this.path.shift();
        }
    }

    private tickAttacking(): void {
        if (this.target) {
            // either attack the target or follow to get in range
            if (this.inMeleeRange(this.target) && this.checkRate(this.attackRate, this.lastAttackTick)) {
                this.target.takeHit(this.calculateMeleeDamage(), this);
                this.lastAttackTick = this.world.currentTick;
            } else {
                this.path = this.findPath(this.target.data.position);
                this.path.shift();
            }
        } else if (this.retaliateTarget) { // this delays retaliation by 1 tick so we get nice turn based combat
            this.attackUnit(this.retaliateTarget);
            this.retaliateTarget = null;
        } else {
            this._state = UnitState.IDLE;
        }
    }

    public tick(): void {
        this.tickPath();
        switch (this.state) {
        case UnitState.ATTACKING: this.tickAttacking(); break;
        case UnitState.FOLLOWING: this.tickFollowing(); break;
        case UnitState.IDLE: break;
        default: break;
        }
        this.emit('tick', this);
    }
    // #endregion
}
