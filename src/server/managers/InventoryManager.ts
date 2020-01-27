import InventoryDef from '../../common/InventoryDef';
import ItemDef from '../../common/ItemDef';
import ItemInstanceEntity from '../entities/ItemInstance.entity';

export default class InventoryManager {
    public data: InventoryDef;

    public constructor(def: InventoryDef) {
        this.data = def;
    }

    private getFromSlot(slot: number): ItemDef {
        return this.data.items.find((i) => i.slot === slot);
    }

    public swap(a: number, b: number): void {
        const itemA = this.getFromSlot(a);
        const itemB = this.getFromSlot(b);
        if (itemA) itemA.slot = b;
        if (itemB) itemB.slot = a;
    }

    public tryAddItem(newItem: ItemDef): boolean {
        // check if this inventory is full
        if (this.data.items.length >= this.data.capacity) {
            return false;
        }
        console.log('sorting the array');

        // sort the items array
        this.data.items.sort((a, b) => {
            if (a.slot > b.slot) return 1;
            if (a.slot < b.slot) return -1;
            return 0; // should never get here......
        });
        console.log('finding first empty slot');

        // find the smallest empty slot
        for (let i = 0; i < this.data.capacity; i++) {
            const existingItem = this.data.items[i];
            if (!existingItem || i < existingItem.slot) {
                console.log('Set slot to ', i);
                newItem.slot = i;
                break;
            }
        }
        // add the item to this inventory
        this.data.items.push(newItem);
        return true;
    }

    public async saveToDB(): Promise<void> {
        const updates: Promise<any>[] = [];
        // insert new items
        for (const item of this.data.items) {
            updates.push(
                ItemInstanceEntity.createQueryBuilder()
                    .insert()
                    .values({
                        uuid: item.uuid,
                        def: {
                            id: item.itemid,
                        },
                        slot: item.slot,
                        inventory: this.data,
                    })
                    .onConflict('("UUID") DO NOTHING')
                    .execute(),
            );
        }
        // update item instance slots
        for (const item of this.data.items) {
            updates.push(
                ItemInstanceEntity.createQueryBuilder()
                    .update()
                    .set({
                        slot: item.slot,
                    })
                    .where('uuid = :uuid', { uuid: item.uuid })
                    .execute(),
            );
        }
        await Promise.all(updates);
    }
}
