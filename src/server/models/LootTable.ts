import uuid from 'uuid/v4';
import LootTableEntity from '../entities/LootTable.entity';
import ItemEntity from '../entities/Item.entity';
import LootTableEntryEntity from '../entities/LootTableEntry.entity';
import ItemTypeEntity from '../entities/ItemType.entity';

export default class LootTable {
    private entity: LootTableEntity;

    public constructor(entity: LootTableEntity) {
        this.entity = entity;
    }

    private randRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private rng(chance: number): boolean {
        return Math.random() < chance;
    }

    private createItem(type: ItemTypeEntity): ItemEntity {
        return ItemEntity.create({
            uuid: uuid(),
            inventory: null,
            slot: null,
            type,
        });
    }

    private rollEntry(entry: LootTableEntryEntity): ItemEntity[] {
        // calculate total weight of the table entry
        let totalWeight = 0;
        for (const item of entry.items) {
            totalWeight += item.weight;
        }

        // calculate the number of items to create
        const itemCount = this.randRange(entry.minCount, entry.maxCount);

        // create 'itemCount' items from this entry
        const items: ItemEntity[] = [];
        while (items.length < itemCount) {
            // get a random item from the entry
            let roll = this.randRange(0, totalWeight);
            for (const item of entry.items) {
                if (roll < item.weight) {
                    items.push(this.createItem(item.itemType));
                    break;
                } else {
                    roll -= item.weight;
                }
            }
        }

        return items;
    }

    public roll(): ItemEntity[] {
        let allItems: ItemEntity[] = [];

        for (const entry of this.entity.entries) {
            if (this.rng(entry.chance)) { // check if this entry has been hit
                const items = this.rollEntry(entry);
                allItems = allItems.concat(items);
            }
        }
        return allItems;
    }
}
