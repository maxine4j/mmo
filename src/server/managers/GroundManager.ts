import { EventEmitter } from 'events';
import { GroundItemDef } from '../../common/ItemDef';
import { Point, TilePoint } from '../../common/Point';
import WorldManager from './WorldManager';

type GroundItemsManagerEvent = 'itemAdded' | 'itemRemoved';

export default class GroundManager {
    private eventEmitter: EventEmitter = new EventEmitter();
    private world: WorldManager;
    private groundItems: Map<string, GroundItemDef> = new Map();

    public constructor(world: WorldManager) {
        this.world = world;
    }

    public on(event: GroundItemsManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: GroundItemsManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    public once(event: GroundItemsManagerEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.once(event, listener);
    }

    public emit(event: GroundItemsManagerEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public inRange(pos: Point): GroundItemDef[] {
        const inrange: GroundItemDef[] = [];
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

    public addGroundItem(gi: GroundItemDef): void {
        this.groundItems.set(gi.item.uuid, gi);
        const [ccx, ccy] = TilePoint.getChunkCoord(gi.position.x, gi.position.y, this.world.chunks.chunkSize);
        const chunk = this.world.chunks.getChunk(ccx, ccy);
        chunk.groundItems.set(gi.item.uuid, gi);
        this.groundItems.set(gi.item.uuid, gi);
        this.emit('itemAdded', gi);
    }

    public removeGroundItem(gi: GroundItemDef): void {
        const [ccx, ccy] = TilePoint.getChunkCoord(gi.position.x, gi.position.y, this.world.chunks.chunkSize);
        const chunk = this.world.chunks.getChunk(ccx, ccy);
        chunk.groundItems.delete(gi.item.uuid);
        this.groundItems.delete(gi.item.uuid);
        this.emit('itemRemoved', gi);
    }

    public getItem(id: string): GroundItemDef {
        return this.groundItems.get(id);
    }

    public groundItemExists(gi: GroundItemDef): boolean {
        return this.groundItems.has(gi.item.uuid);
    }
}
