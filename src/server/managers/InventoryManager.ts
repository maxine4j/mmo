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

    public async saveToDB(): Promise<void> {
        // update item instance slots
        const updates: Promise<any>[] = [];
        for (const item of this.data.items) {
            updates.push(
                ItemInstanceEntity.createQueryBuilder()
                    .update()
                    .set({
                        slot: item.slot,
                    })
                    .where('id = :id', { id: item.id })
                    .execute(),
            );
        }
        await Promise.all(updates);
    }
}
