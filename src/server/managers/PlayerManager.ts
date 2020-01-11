import io from 'socket.io';
import Character from '../../common/Character';
import WorldManager from './WorldManager';
import UnitManager from './UnitManager';

export default class PlayerManager extends UnitManager {
    public socket: io.Socket;
    public data: Character;

    public constructor(world: WorldManager, data: Character, socket: io.Socket) {
        super(world, data);
        this.socket = socket;
    }
}
