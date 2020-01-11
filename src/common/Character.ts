import Unit from './Unit';

export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export default interface Character extends Unit {
    race: Race;
}
