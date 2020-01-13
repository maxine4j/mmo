import { AStarFinder } from 'astar-typescript';
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

    private tickMovement() {
        // update the units movement
        this.data.running = false;
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

    public tick() {
        this.tickMovement();
    }

    public moveTo(dest: Point) {
        this.destionation = dest;
        const navmap = this.world.generateNavmap(this.data.position, this.destionation);
        const astar = new AStarFinder({
            grid: {
                matrix: navmap.matrix,
            },
            diagonalAllowed: true,
            heuristicFunction: 'Octile',
            includeEndNode: true,
            includeStartNode: false,
        });

        // transform the path to world coords
        this.path = astar.findPath(navmap.start, navmap.end)
            .map(([x, y]) => new Point(x + navmap.offset.x, y + navmap.offset.y))
            .reverse(); // reverse so we can use array.pop()
        console.log('made a new path', this.path);
    }
}
