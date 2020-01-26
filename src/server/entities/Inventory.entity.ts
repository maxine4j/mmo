import {
    Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany,
} from 'typeorm';
import InventoryDef, { InventoryType } from '../../common/InventoryDef';
import ItemInstanceEntity from './ItemInstance.entity';

@Entity()
export default class InventoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @OneToMany((type) => ItemInstanceEntity, (item) => item.inventory, { eager: true, cascade: true })
    public items: ItemInstanceEntity[];

    @Column()
    public type: InventoryType;

    // converts a db entity to a network def
    public toNet(): InventoryDef {
        return <InventoryDef>{
            id: this.id,
            type: this.type,
            items: this.items.map((inst) => inst.toNet()),
        };
    }
}
