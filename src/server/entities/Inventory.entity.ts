import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import InventoryDef, { InventoryType } from '../../common/InventoryDef';
import ItemEntity from './Item.entity';

@Entity()
export default class InventoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @OneToMany((type) => ItemEntity, (item) => item.inventory, { eager: true, cascade: true })
    public items: ItemEntity[];

    @Column()
    public type: InventoryType;

    @Column()
    public capacity: number;

    // converts a db entity to a network def
    public toNet(): InventoryDef {
        return <InventoryDef>{
            id: this.id,
            type: this.type,
            capacity: this.capacity,
            items: this.items.map((inst) => inst.toNet()),
        };
    }
}
