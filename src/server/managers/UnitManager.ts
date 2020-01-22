import PF from 'pathfinding';
import { Point, PointDef } from '../../common/Point';
import WorldManager from './WorldManager';
import UnitDef from '../../common/UnitDef';

export default class UnitManager {
    protected world: WorldManager;
    public data: UnitDef;
    private destionation: PointDef;
    private path: Array<PointDef>;
    public health: number;
    public maxHealth: number;
    public lastWanderTick: number = 0;

    public constructor(world: WorldManager, data: UnitDef) {
        this.world = world;
        this.data = data;
    }

    public get dead(): boolean {
        return this.health <= 0;
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

    public tick(): void {
        this.tickMovement();
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
