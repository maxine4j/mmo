import PF from 'pathfinding';
import { EventEmitter } from 'events';
import { Point, PointDef, TilePoint } from '../../common/Point';
import WorldManager from '../managers/WorldManager';
import UnitDef, { CombatStatsDef, CombatStyle } from '../../common/UnitDef';
import Chunk from './Chunk';
import IModel from './IModel';
import Attack from './Attack';

export type UnitManagerEvent = 'damaged' | 'death' | 'attack' | 'updated' | 'wandered' | 'startedAttack' | 'stoppedAttack' | 'tick';

export enum UnitState {
    IDLE,
    FOLLOWING,
    ATTACKING,
    LOOTING,
}

export default class Unit implements IModel {
    protected eventEmitter: EventEmitter = new EventEmitter();
    protected world: WorldManager;
    protected data: UnitDef;
    protected stats: CombatStatsDef;
    protected path: PointDef[];
    protected _state: UnitState;
    protected currentChunk: Chunk;
    private attackRate: number = 2;
    private lastAttackTick: number = 0;
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
    public get combatStyle(): CombatStyle { return this.data.combatStyle; }

    public lastWanderTick: number = 0;

    public constructor(world: WorldManager, data: UnitDef) {
        this.world = world;
        this.data = data;
        this._state = UnitState.IDLE;
        this.updateChunk();
    }

    public dispose(): void {
        this.currentChunk.units.delete(this.data.id);
        this.eventEmitter.removeAllListeners();
    }

    public toNet(): UnitDef {
        return this.data;
    }

    public setStats(stats: CombatStatsDef): void {
        this.stats = stats;
        this.calcCombatLevel();

        if (this.data.health == null) { // only set health if the value is null
            this.data.health = this.stats.hitpoints;
        }
        this.data.maxHealth = this.stats.hitpoints;
    }

    private calcCombatLevel(): void {
        const base = 0.25 * (this.stats.defense + this.stats.hitpoints + Math.floor(this.stats.prayer / 2));
        const melee = 0.325 * (this.stats.attack + this.stats.defense);
        const range = 0.325 * Math.floor(3 * (this.stats.ranged / 2));
        const mage = 0.325 * Math.floor(3 * (this.stats.magic / 2));
        this.data.level = Math.floor(base + Math.max(melee, range, mage));
    }

    public on(event: UnitManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: UnitManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    protected emit(event: UnitManagerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    private distance(other: Unit): number {
        return this.position.dist(other.position);
    }

    private inMeleeRange(other: Unit): boolean {
        return this.distance(other) < 1.5;
    }

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
        this.data.moveQueue = [];
    }

    public takeHit(dmg: number, attacker: Unit): void {
        // mitigate dmg here, could also reflect to attacker
        this.data.health -= dmg;
        if (this.data.autoRetaliate) {
            this.retaliate(attacker);
        }

        this.emit('damaged', this, dmg, attacker);
        if (this.dead) {
            this.emit('death', this, dmg, attacker);
            attacker.stopAttacking();
        }
    }

    protected followUnit(target: Unit): void {
        this._state = UnitState.FOLLOWING;
        this.target = target;
    }

    public moveTo(dest: PointDef): void {
        this._state = UnitState.IDLE;
        this.path = this.findPath(dest);
    }

    public teleport(pos: Point): void {
        this.data.position = { x: pos.x, y: pos.y };
        this.path = [];
        this._state = UnitState.IDLE;
        this.updateChunk();
    }

    protected findPath(dest: PointDef): PointDef[] {
        const navmap = this.world.chunks.generateNavmap(this.data.position, {
            x: Math.round(dest.x),
            y: Math.floor(dest.y),
        });
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
        } else if (newChunk && newChunk.id !== this.currentChunk.id) { // if we have changed chunk
            this.removeFromOldChunk();
            this.addToNewChunk(newChunk);
        }
    }

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
                const attack = new Attack(this, this.stats, this.target, this.target.stats);
                const dmgDone = attack.perform();
                this.emit('attack', this, attack, dmgDone);
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
}
