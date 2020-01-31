import {
    Entity, BaseEntity, ManyToOne, Column, PrimaryColumn,
} from 'typeorm';
import ItemDef from '../../common/ItemDef';
import ItemTypeEntity from './ItemType.entity';
import InventoryEntity from './Inventory.entity';

// This is an instance of an item that can actually be used in the game

@Entity()
export default class ItemEntity extends BaseEntity {
    @PrimaryColumn()
    public uuid: string;

    @ManyToOne((type) => ItemTypeEntity, { eager: true, onDelete: 'CASCADE' })
    public type: ItemTypeEntity;

    @Column()
    public slot: number;

    @ManyToOne((type) => InventoryEntity, (inventory) => inventory.items)
    public inventory: InventoryEntity;

    // converts a db entity to a network def
    public toNet(): ItemDef {
        const item = <ItemDef>{
            uuid: this.uuid,
            icon: this.type.icon,
            itemid: this.type.id,
            name: this.type.name,
            slot: this.slot,
        };
        return item;
    }
}
