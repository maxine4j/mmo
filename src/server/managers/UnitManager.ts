import PF from 'pathfinding';
import { Point, PointDef } from '../../common/Point';
import WorldManager from './WorldManager';
import UnitDef, { UnitAnimState } from '../../common/UnitDef';

export default class UnitManager {
    protected world: WorldManager;
    public data: UnitDef;
    private destionation: PointDef;
    private path: Array<PointDef>;
    public lastWanderTick: number = 0;

    public constructor(world: WorldManager, data: UnitDef) {
        this.world = world;
        this.data = data;
    }

    public get dead(): boolean {
        return this.data.health <= 0;
    }

    private tickMovement(): void {
        // update the units movement
        this.data.moveQueue = [];
        if (this.path && this.path.length > 0) {
            let nextPos = this.path.pop();
            this.data.moveQueue.push(nextPos);
            if (this.data.running && this.path.length > 0) { // this should be if instead of while for normal movement
                nextPos = this.path.pop();
                this.data.moveQueue.push(nextPos);
            }
            this.data.position = nextPos;
        }
    }

    public get position(): Point { return Point.fromDef(this.data.position); }

    public get target(): UnitManager {
        return this.world.units.get(this.data.target);
    }

    private takeHit(dmg: number, attacker: UnitManager): void {
        // mitigate dmg here, could also reflect to attacker
        this.data.health -= dmg;
        this.data.state = UnitAnimState.DEFEND;
        this.data.target = attacker.data.id;
        if (this.dead) {
            console.log(`Unit ${this.data.name} died to ${attacker.data.name}`);
            // should send 0 hp unit to the client to play death animation or something
            this.data.state = UnitAnimState.DYING;
            this.world.units.delete(this.data.id);
        }
    }

    private calculateMeleeDamage(): number {
        return Math.round(Math.random());
    }

    private attackUnit(target: UnitManager): void {
        const dist = this.position.dist(target.position);
        const minRange = 0.9;
        const maxRange = 1.5;
        if (dist <= maxRange && dist >= minRange) {
            this.data.state = UnitAnimState.ATTACK_MELEE;
            target.takeHit(this.calculateMeleeDamage(), this);
        }
    }

    public tick(): void {
        this.tickMovement();
        const target = this.target;
        if (this.data.name === 'Arwic') { console.log(`ticked a unit ${this.data.name} which has target ${target}`); }

        if (target) {
            this.followUnit(target);
            this.attackUnit(target);
        }
    }

    private followUnit(target: UnitManager): void {
        // get the target
        this.moveTo(target.data.position);
        this.path.pop(); // remove the target location so we stop 1 tile away
        console.log(`${this.data.name} is following ${target.data.name}`);
    }

    public moveTo(dest: PointDef): void {
        this.destionation = dest;
        const navmap = this.world.generateNavmap(this.data.position, this.destionation);
        const grid = new PF.Grid(navmap.matrix);

        const finder = new PF.AStarFinder({
            // @ts-ignore
            allowDiagonal: true,
            dontCrossCorners: true,
            heuristic: PF.Heuristic.chebyshev,
        });

        // transform the path to world coords
        this.path = finder.findPath(navmap.start.x, navmap.start.y, navmap.end.x, navmap.end.y, grid)
            .map(([x, y]: number[]) => new Point(x + navmap.offset.x, y + navmap.offset.y))
            .reverse(); // reverse so we can use array.pop()
        this.path.pop(); // remove the players current position
    }
}
