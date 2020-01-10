import io from 'socket.io';
import { AStarFinder } from 'astar-typescript';
import Character from '../../common/Character';
import Point from '../../common/Point';
import WorldManager from './WorldManager';

export default class PlayerManager {
    public socket: io.Socket;
    private world: WorldManager;
    public character: Character;
    private destionation: Point;
    private path: Array<Point>;

    public constructor(world: WorldManager, character: Character, socket: io.Socket) {
        this.world = world;
        this.character = character;
        this.socket = socket;
    }

    public tick() {
        // update the characters movement
        if (this.character.position !== this.destionation && this.path && this.path.length > 0) {
            this.character.position = this.path.pop();
        }
    }

    public moveTo(dest: Point) {
        // TODO: this function need to take a smarter navmap and transform it into a local grid
        // that lets the player pathfind
        // then transform the result back to world coords
        this.destionation = dest;
        const astar = new AStarFinder({
            grid: {
                matrix: this.world.navmap,
            },
            diagonalAllowed: true,
            heuristicFunction: 'Manhatten',
            includeEndNode: true,
            includeStartNode: false,
        });
        console.log(`Attemping to path from ${this.character.position.x},${this.character.position.y} to ${this.destionation.x},${this.destionation.y}`);

        this.path = astar.findPath(this.character.position, this.destionation).map(([x, y]) => ({ x, y }));
    }
}
