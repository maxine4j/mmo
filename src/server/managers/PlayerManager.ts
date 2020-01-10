import io from 'socket.io';
import { AStarFinder } from 'astar-typescript';
import { runInThisContext } from 'vm';
import Character, { Facing } from '../../common/Character';
import Point from '../../common/Point';
import WorldManager from './WorldManager';

export default class PlayerManager {
    public socket: io.Socket;
    private world: WorldManager;
    public character: Character;
    private destionation: Point;
    private path: Array<Point>;
    private lastPos: Point;

    public constructor(world: WorldManager, character: Character, socket: io.Socket) {
        this.world = world;
        this.character = character;
        this.socket = socket;
    }

    public tick() {
        // update the characters movement
        if (this.path && this.path.length > 0) {
            this.lastPos = this.character.position;
            this.character.position = this.path.pop();
            this.updateFacing();
        }
    }

    private updateFacing() {
        const xdir = this.character.position.x - this.lastPos.x;
        const ydir = this.character.position.y - this.lastPos.y;

        // no change, leave on last facing
        if (xdir === 0 && ydir === 0) {
            return;
        }

        // north combos
        if (ydir < 0) {
            if (xdir > 0) {
                this.character.facing = Facing.NORTH_EAST;
                return;
            }
            if (xdir < 0) {
                this.character.facing = Facing.NORTH_WEST;
                return;
            }
            if (xdir === 0) {
                this.character.facing = Facing.NORTH;
                return;
            }
        }

        // south combos
        if (ydir > 0) {
            if (xdir > 0) {
                this.character.facing = Facing.SOUTH_EAST;
                return;
            }
            if (xdir < 0) {
                this.character.facing = Facing.SOUTH_WEST;
                return;
            }
            if (xdir === 0) {
                this.character.facing = Facing.SOUTH;
                return;
            }
        }

        // east and west
        if (ydir === 0) {
            if (xdir > 0) {
                this.character.facing = Facing.EAST;
                return;
            }
            if (xdir < 0) {
                this.character.facing = Facing.WEST;
                return;
            }
        }
    }

    public moveTo(dest: Point) {
        // TODO: this function need to take a smarter navmap and transform it into a local grid
        // that lets the player pathfind
        // then transform the result back to world coords
        this.destionation = dest;
        const navmap = this.world.generateNavmap(this.character.position, this.destionation);
        const astar = new AStarFinder({
            grid: {
                matrix: navmap.matrix,
            },
            diagonalAllowed: true,
            heuristicFunction: 'Manhatten',
            includeEndNode: true,
            includeStartNode: false,
        });

        console.log('Start: ', this.character.position, ' -> ', navmap.start);
        console.log('End  : ', this.destionation, ' -> ', navmap.end);

        // transform the path to world coords
        this.path = astar.findPath(navmap.start, navmap.end)
            .map(([x, y]) => new Point(x + navmap.offset.x, y + navmap.offset.y))
            .reverse(); // reverse so we can use array.pop()
        console.log('Path:', this.path);
    }
}
