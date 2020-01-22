import UnitDef from './UnitDef';

export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export default interface CharacterDef extends UnitDef {
    charID: number;
    race: Race;
}
