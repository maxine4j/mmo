import {
    Entity, BaseEntity, ManyToOne, Column, PrimaryColumn,
} from 'typeorm';
import ItemDef from '../../common/ItemDef';
import ItemEntity from './Item.entity';
import InventoryEntity from './Inventory.entity';

// This is an instance of an item that can actually be used in the game

@Entity()
export default class ItemInstanceEntity extends BaseEntity {
    @PrimaryColumn()
    public uuid: string;

    @ManyToOne((type) => ItemEntity, { eager: true, onDelete: 'CASCADE' })
    public def: ItemEntity;

    @Column()
    public slot: number;

    @ManyToOne((type) => InventoryEntity, (inventory) => inventory.items)
    public inventory: InventoryEntity;

    // converts a db entity to a network def
    public toNet(): ItemDef {
        const item = <ItemDef>{
            uuid: this.uuid,
            icon: this.def.icon,
            itemid: this.def.id,
            name: this.def.name,
            slot: this.slot,
        };
        return item;
    }

    // converts a network def to a db entity
    public static fromNet(def: ItemDef): Promise<ItemInstanceEntity> {
        return new Promise((resolve) => {
            this.findOne({ uuid: def.uuid }).then((item) => {
                item.slot = def.slot;
                item.save();
                resolve(item);
            });
        });
    }
}
