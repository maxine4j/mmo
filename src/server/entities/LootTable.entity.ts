/* eslint-disable no-use-before-define */
import {
    Entity, BaseEntity, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import LootTableEntry from './LootTableEntry.entity';

// A loot table should be be called when an item drop is required
@Entity()
export default class LootTableEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    // This is a list of entries in the loot table. Each entry will be rolled on independently when this loot table is used
    @OneToMany((type) => LootTableEntry, (entry) => entry.table, { eager: true, cascade: true })
    public entries: LootTableEntry[];
}
