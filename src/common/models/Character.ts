import Buildable from '../Buildable';

export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export default class Character extends Buildable {
    public name: string;
    public level: number;
    public race: Race;
}
