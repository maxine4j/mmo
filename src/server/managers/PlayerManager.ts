import io from 'socket.io';
import CharacterDef from '../../common/CharacterDef';
import WorldManager from './WorldManager';
import UnitManager from './UnitManager';

export default class PlayerManager extends UnitManager {
    public socket: io.Socket;
    public data: CharacterDef;

    public constructor(world: WorldManager, data: CharacterDef, socket: io.Socket) {
        super(world, data);
        this.socket = socket;
    }
}
