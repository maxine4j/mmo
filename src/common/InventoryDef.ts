import ItemDef from './ItemDef';

export enum InventoryType {
    BAGS,
    BANK,
}

export default interface InventoryDef {
    id: number;
    type: InventoryType;
    items: ItemDef[];
    capacity: number;
}
