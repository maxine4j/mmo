import UnitDef from './UnitDef';
import ItemDef from './ItemDef';

export enum Race {
    HUMAN,
    DWARF,
    GNOME,
    NIGHTELF,
    ORC,
    UNDEAD,
}

export default interface CharacterDef extends UnitDef {
    race: Race;

    inventory: ItemDef[];
}
