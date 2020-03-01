import { Point, TilePoint } from '../../common/Point';
import WorldManager from './WorldManager';
import IManager from './IManager';
import Client from '../models/Client';
import ItemEntity from '../entities/Item.entity';
import GroundItem from '../models/GroundItem';

const itemDespawnTime = 100; // ticks

export default class GroundManager implements IManager {
    private world: WorldManager;
    private items: Map<string, GroundItem> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
        this.world.on('tick', () => this.tick());
    }

    public enterWorld(client: Client): void {}
    public leaveWorld(client: Client): void {}

    public inRange(pos: Point): GroundItem[] {
        const inrange: GroundItem[] = [];
        const bounds = this.world.viewBounds(pos);
        for (const chunk of this.world.chunks.inRange(pos)) {
            for (const [_, gi] of chunk.groundItems) {
                if (bounds.contains(Point.fromDef(gi.position))) {
                    inrange.push(gi);
                }
            }
        }
        return inrange;
    }

    public addItem(item: ItemEntity, pos: Point): void {
        const groundItem = new GroundItem(item, pos, this.world);
        this.items.set(item.uuid, groundItem);
        const [ccx, ccy] = TilePoint.getChunkCoord(pos.x, pos.y, this.world.chunks.chunkSize);
        const chunk = this.world.chunks.getChunk(ccx, ccy);
        chunk.addGroundItem(groundItem);
    }

    public removeItem(id: string): void {
        const groundItem = this.items.get(id);
        const chunk = this.world.chunks.getChunkContaining(groundItem.position);
        chunk.removeGroundItem(id);
        this.items.delete(id);
    }

    public getItem(id: string): GroundItem {
        return this.items.get(id);
    }

    public groundItemExists(gi: GroundItem): boolean {
        return this.items.has(gi.item.uuid);
    }

    private tick(): void {
        for (const [id, item] of this.items) {
            if (item.tickDropped + itemDespawnTime < this.world.currentTick) {
                this.removeItem(id); // remove the item from the ground
                item.item.remove(); // remove the item from the database
            }
        }
    }
}
