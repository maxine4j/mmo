import PF from 'pathfinding';
import { EventEmitter } from 'events';
import { Point, PointDef } from '../../common/Point';
import WorldManager from './WorldManager';
import UnitDef from '../../common/UnitDef';

type UnitManagerEvent = 'damage' | 'death' | 'move' | 'wandered';

export enum UnitState {
    IDLE,
    FOLLOWING,
    ATTACKING,
}

export default class UnitManager {
    private eventEmitter: EventEmitter = new EventEmitter();
    protected world: WorldManager;
    public data: UnitDef;
    private path: Array<PointDef>;
    public lastWanderTick: number = 0;
    public state: UnitState;
    private attackRate: number = 2;
    private lastAttackTick: number = 2;
    private retaliateTarget: UnitManager;

    public constructor(world: WorldManager, data: UnitDef) {
        this.world = world;
        this.data = data;
        this.state = UnitState.IDLE;
    }

    public dispose(): void {
        this.eventEmitter.removeAllListeners();
    }
    public on(event: UnitManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }
    public off(event: UnitManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }
    private emit(event: UnitManagerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public setDead(): void { this.data.health = -1; }
    public get dead(): boolean { return this.data.health <= 0; }
    public get position(): Point { return Point.fromDef(this.data.position); }
    public get target(): UnitManager {
        return this.world.getUnit(this.data.target);
    }
    public set target(unit: UnitManager) { this.data.target = unit.data.id; }

    public stopAttacking(): void {
        this.data.target = '';
        this.state = UnitState.IDLE;
    }

    private retaliate(target: UnitManager): void {
        this.retaliateTarget = target;
        this.state = UnitState.ATTACKING;
    }

    private takeHit(dmg: number, attacker: UnitManager): void {
        // mitigate dmg here, could also reflect to attacker
        this.data.health -= dmg;
        if (this.data.autoRetaliate) {
            this.retaliate(attacker);
        }
        console.log(`${attacker.data.name} hit ${this.data.name} for ${dmg} damage`);

        this.emit('damage', dmg, attacker);
        if (this.dead) {
            this.emit('death', dmg, attacker);
            attacker.stopAttacking();
        }
    }

    private inMeleeRange(other: UnitManager): boolean {
        return this.distance(other) < 1.5;
    }

    private calculateMeleeDamage(): number {
        return Math.round(Math.random());
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
        }
    }

    private tickFollowing(): void {
        // keep following the target unit
        if (this.inMeleeRange(this.target)) {
            this.path = this.findPath(this.target.data.position);
            this.path.shift();
        }
    }

    private checkRate(rate: number, lastTick: number): boolean {
        return (lastTick + rate) < this.world.tickCounter;
    }

    private tickAttacking(): void {
        if (this.target) {
            // this.data.tickAction = UnitTickAction.COMABT_IDLE;
            // either attack the target or follow to get in range
            if (this.inMeleeRange(this.target) && this.checkRate(this.attackRate, this.lastAttackTick)) {
                this.target.takeHit(this.calculateMeleeDamage(), this);
                // this.data.tickAction = UnitTickAction.MELEE;
                this.lastAttackTick = this.world.tickCounter;
            } else {
                this.path = this.findPath(this.target.data.position);
                this.path.shift();
            }
        } else if (this.retaliateTarget) { // this delays retaliation by 1 tick so we get nice turn based combat
            this.attackUnit(this.retaliateTarget);
            this.retaliateTarget = null;
        } else {
            this.state = UnitState.IDLE;
        }
    }

    public tick(): void {
        this.tickPath();
        switch (this.state) {
        case UnitState.ATTACKING: {
            this.tickAttacking();
            break;
        }
        case UnitState.FOLLOWING: {
            this.tickFollowing();
            break;
        }
        case UnitState.IDLE: {
            break;
        }
        default: break;
        }
    }

    public distance(other: UnitManager): number {
        return this.position.dist(other.position);
    }

    public attackUnit(target: UnitManager): void {
        this.state = UnitState.ATTACKING;
        this.target = target;
    }

    public followUnit(target: UnitManager): void {
        this.state = UnitState.FOLLOWING;
        this.target = target;
    }

    public moveTo(dest: PointDef): void {
        this.state = UnitState.IDLE;
        this.path = this.findPath(dest);
    }

    private findPath(dest: PointDef): PointDef[] {
        const navmap = this.world.generateNavmap(this.data.position, dest);
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
}
