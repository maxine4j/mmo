import ItemEntity from '../entities/Item.entity';
import { Point } from '../../common/Point';
import IModel from './IModel';
import { GroundItemDef } from '../../common/ItemDef';
import WorldManager from '../managers/WorldManager';

export default class GroundItem implements IModel {
    public item: ItemEntity;
    public position: Point;
    public get uuid(): string { return this.item.uuid; }
    private _tickDropped: number;
    public get tickDropped(): number { return this._tickDropped; }

    public constructor(item: ItemEntity, pos: Point, world: WorldManager) {
        this.item = item;
        this.position = pos;
        this.item.slot = null;
        this._tickDropped = world.currentTick;
    }

    public toNet(): GroundItemDef {
        return <GroundItemDef>{
            item: this.item.toNet(),
            position: this.position.toNet(),
        };
    }
}
