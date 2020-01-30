import ItemDef from './ItemDef';
import IDefinition from './IDefinition';

export enum InventoryType {
    BAGS,
    BANK,
}

export default interface InventoryDef extends IDefinition {
    id: number;
    type: InventoryType;
    items: ItemDef[];
    capacity: number;
}
