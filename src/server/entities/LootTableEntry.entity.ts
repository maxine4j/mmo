/* eslint-disable no-use-before-define */
import {
    Entity, BaseEntity, ManyToOne, Column, PrimaryColumn, OneToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import LootTableEntity from './LootTable.entity';
import LootTableItemEntity from './LootTableItem.entity';

// A loot table entry is a single roll on a loot table
// It has a list of items of which it will produce some
@Entity()
export default class LootTableEntryEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @ManyToOne((type) => LootTableEntity, (table) => table.entries, { onDelete: 'CASCADE' })
    public table: LootTableEntity;

    @OneToMany((type) => LootTableItemEntity, (item) => item.entry, { eager: true, cascade: true })
    @JoinColumn()
    public items: LootTableItemEntity[]; // the items that this entry can produce between 'minCount' and 'maxCount' of

    @Column()
    public chance: number; // chance that this entry will produce any items

    @Column()
    public minCount: number; // minimum number of items this entry will produce

    @Column()
    public maxCount: number; // maximum number of items this entry will produce
}
