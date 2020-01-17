import PF from 'pathfinding';
import Point from '../../common/Point';
import WorldManager from './WorldManager';
import Entity from '../../common/Unit';

export default class UnitManager {
    private world: WorldManager;
    public data: Entity;
    private destionation: Point;
    private path: Array<Point>;

    public constructor(world: WorldManager, data: Entity) {
        this.world = world;
        this.data = data;
    }

    private tickMovement(): void {
        // update the units movement
        this.data.running = true;
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

    public tick(): void {
        this.tickMovement();
    }

    public moveTo(dest: Point): void {
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
