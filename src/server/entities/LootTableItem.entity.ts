/* eslint-disable no-use-before-define */
import {
    Entity, BaseEntity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column,
} from 'typeorm';
import ItemTypeEntity from './ItemType.entity';
import LootTableEntryEntity from './LootTableEntry.entity';

@Entity()
export default class LootTableItemEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => LootTableEntryEntity, (entry) => entry.items, { onDelete: 'CASCADE' })
    public entry: LootTableEntryEntity;

    @ManyToOne((type) => ItemTypeEntity, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn()
    public itemType: ItemTypeEntity; // the type of item to produce

    @Column()
    public weight: number; // chance that this item will be produced
}
