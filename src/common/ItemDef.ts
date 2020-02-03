import { PointDef } from './Point';
import IDefinition from './IDefinition';

export default interface ItemDef extends IDefinition {
    uuid: string;
    itemid: number;
    name: string;
    icon: string;
    slot: number;
}

export interface GroundItemDef extends IDefinition {
    item: ItemDef;
    position: PointDef;
}
