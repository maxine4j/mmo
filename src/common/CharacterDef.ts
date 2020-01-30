import UnitDef from './UnitDef';
import IDefinition from './IDefinition';

export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export default interface CharacterDef extends UnitDef, IDefinition {
    race: Race;
}
