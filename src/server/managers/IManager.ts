import Client from '../models/Client';

export default interface IManager {
    enterWorld(client: Client): void;
    leaveWorld(client: Client): void;
}
