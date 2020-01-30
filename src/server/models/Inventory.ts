import { Point } from '../../common/Point';
import InventoryDef from '../../common/InventoryDef';
import ItemEntity from '../entities/Item.entity';
import IModel from './IModel';
import WorldManager from '../managers/WorldManager';
import InventoryEntity from '../entities/Inventory.entity';

export default class InventoryManager implements IModel {
    private entity: InventoryEntity;
    private world: WorldManager;
    private slots: Map<number, ItemEntity> = new Map();

    public constructor(world: WorldManager, entity: InventoryEntity) {
        this.world = world;
        this.entity = entity;
        for (const item of this.entity.items) {
            this.slots.set(item.slot, item);
        }
    }

    public toNet(): InventoryDef {
        return <InventoryDef>{
            id: this.entity.id,
            type: this.entity.type,
            capacity: this.entity.capacity,
            items: Array.from(this.slots).map(([id, item]) => item.toNet()),
        };
    }

    private getFromSlots(): ItemEntity[] {
        return Array.from(this.slots).map(([id, item]) => item);
    }

    public swap(a: number, b: number): void {
        const itemA = this.slots.get(a);
        const itemB = this.slots.get(b);
        if (itemA) {
            itemA.slot = b;
            this.slots.set(itemA.slot, itemA);
        }
        if (itemB) {
            itemB.slot = a;
            this.slots.set(itemB.slot, itemB);
        }
    }

    public useItems(a: number, b: number): string {
        const itemA = this.slots.get(a);
        const itemB = this.slots.get(b);
        if (itemA && itemB) {
            return `Used ${itemA.type.name} with ${itemB.type.name}`;
        }
        return 'Nothing interesting happens';
    }

    public dropItem(s: number, pos: Point): void {
        const item = this.slots.get(s);
        this.world.ground.addItem(item, pos);
        this.slots.delete(s);
    }

    public tryAddItem(newItem: ItemEntity): boolean {
        // check if this inventory is full
        if (this.slots.size >= this.entity.capacity) return false;

        // find the smallest empty slot
        const items = this.getFromSlots();
        items.sort((a, b) => {
            if (a.slot > b.slot) return 1;
            if (a.slot < b.slot) return -1;
            return 0; // should never get here......
        });
        for (let i = 0; i < this.entity.capacity; i++) {
            const existingItem = items[i];
            if (!existingItem || i < existingItem.slot) {
                newItem.slot = i; // found it
                break;
            }
        }
        if (newItem.slot == null) return false; // shouldnt get here

        // add the item to this inventory
        newItem.inventory = this.entity;
        this.slots.set(newItem.slot, newItem);
        return true;
    }

    public async save(): Promise<void> {
        this.entity.items = this.getFromSlots();
        await this.entity.save();
    }
}
