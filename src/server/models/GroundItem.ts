import ItemEntity from '../entities/Item.entity';
import { Point } from '../../common/Point';
import IModel from './IModel';
import { GroundItemDef } from '../../common/ItemDef';

export default class GroundItem implements IModel {
    public item: ItemEntity;
    public position: Point;
    public get uuid(): string { return this.item.uuid; }

    public constructor(item: ItemEntity, pos: Point) {
        this.item = item;
        this.position = pos;
        this.item.slot = null;
    }

    public toNet(): GroundItemDef {
        return <GroundItemDef>{
            item: this.item.toNet(),
            position: this.position.toNet(),
        };
    }
}
