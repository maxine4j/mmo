import PF from 'pathfinding';
import { EventEmitter } from 'events';
import uuid from 'uuid/v4';
import { Point, PointDef, TilePoint } from '../../common/Point';
import WorldManager from './WorldManager';
import UnitDef from '../../common/UnitDef';
import ChunkManager from './ChunkManager';

export type UnitManagerEvent = 'damaged' | 'death' | 'updated' | 'pathUpdated' | 'wandered' | 'startedAttack' | 'stoppedAttack' | 'ticked';

export enum UnitState {
    IDLE,
    FOLLOWING,
    ATTACKING,
    LOOTING,
}

export default class UnitManager {
    protected eventEmitter: EventEmitter = new EventEmitter();
    protected world: WorldManager;
    public data: UnitDef;
    protected path: PointDef[];
    public lastWanderTick: number = 0;
    public state: UnitState;
    private attackRate: number = 2;
    private lastAttackTick: number = 2;
    private retaliateTarget: UnitManager;
    protected currentChunk: ChunkManager;

    public constructor(world: WorldManager, data: UnitDef) {
        this.world = world;
        this.data = data;
        this.state = UnitState.IDLE;
    }

    public dispose(): void {
        this.currentChunk.units.delete(this.data.id);
        this.eventEmitter.removeAllListeners();
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
        // console.log(`${attacker.data.name} hit ${this.data.name} for ${dmg} damage`);

        this.emit('damaged', this, dmg, attacker);
        if (this.dead) {
            this.emit('death', this, dmg, attacker);
            // TODO: drop tables
            this.world.addGroundItem({
                item: {
                    uuid: uuid(),
                    itemid: 0,
                    icon: 81,
                    name: 'Iron Sword',
                    slot: null,
                },
                position: this.data.position,
            });
            attacker.stopAttacking();
        }
    }

    private inMeleeRange(other: UnitManager): boolean {
        return this.distance(other) < 1.5;
    }

    private calculateMeleeDamage(): number {
        return Math.round(Math.random());
    }

    // used to update the units chunk
    protected addToNewChunk(chunk: ChunkManager): void {
        chunk.units.set(this.data.id, this);
        chunk.allUnits.set(this.data.id, this);
        this.currentChunk = chunk;
    }

    // used to update the units chunk
    protected removeFromOldChunk(): void {
        this.currentChunk.units.delete(this.data.id);
        this.currentChunk.allUnits.delete(this.data.id);
    }

    public updateChunk(): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(this.data.position.x, this.data.position.y, this.world.chunkSize);
        const newChunk = this.world.chunks.get(ccx, ccy);
        if (!this.currentChunk) {
            this.addToNewChunk(newChunk);
        } else if (newChunk.def.id !== this.currentChunk.def.id) { // if we have changed chunk
            this.removeFromOldChunk();
            this.addToNewChunk(newChunk);
        }
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

    private checkRate(rate: number, lastTick: number): boolean {
        return (lastTick + rate) < this.world.tickCounter;
    }

    private tickAttacking(): void {
        if (this.target) {
            // either attack the target or follow to get in range
            if (this.inMeleeRange(this.target) && this.checkRate(this.attackRate, this.lastAttackTick)) {
                this.target.takeHit(this.calculateMeleeDamage(), this);
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
        this.emit('ticked', this);
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

    protected findPath(dest: PointDef): PointDef[] {
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
