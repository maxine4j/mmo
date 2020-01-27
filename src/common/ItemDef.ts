import { PointDef } from './Point';

export default interface ItemDef {
    uuid: string;
    itemid: number;
    name: string;
    icon: number;
    slot: number;
}

export interface GroundItemDef {
    item: ItemDef;
    position: PointDef;
}
