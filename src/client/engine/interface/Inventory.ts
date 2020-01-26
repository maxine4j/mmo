import { EventEmitter } from 'events';
import Rectangle from '../../../common/Rectangle';
import Panel from './components/Panel';
import UIParent from './components/UIParent';
import LocalItem from '../LocalItem';
import SpriteAtlas from './components/SpriteAtlas';
import SpriteAtlasImage from './components/SpriteAtlasImage';
import InventoryDef from '../../../common/InventoryDef';

const slotSize = 32;
const atlas = new SpriteAtlas('assets/icons/atlas.png');

const slotBg = 'rgba(255,255,255,0.0)';
const slotBgOver = 'rgba(255,255,255,0.2)';
const slotBgSelected = 'rgba(255,255,255,0.4)';

type InventoryEvent = 'swap' | 'use';

export class InventorySlot extends Panel {
    public icon: SpriteAtlasImage;
    private _item: LocalItem;
    public slot: number;
    public inventory: Inventory;

    public constructor(item: LocalItem, slot: number, parent: Inventory, margin: number) {
        super(parent);
        this.inventory = parent;
        this.element.draggable = true;
        this.item = item;
        this.slot = slot;

        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.margin = `${margin}px`;
        this.style.backgroundColor = slotBg;

        this.initDragging();
        this.element.addEventListener('click', (ev: MouseEvent) => {
            this.inventory.selectedSlot = this.slot;
        });
    }

    public get item(): LocalItem { return this._item; }
    public set item(i: LocalItem) { this._item = i; this.updateIcon(); }

    private initDragging(): void {
        this.element.addEventListener('dragstart', (ev: DragEvent) => {
            ev.dataTransfer.setData('text/plain', this.slot.toString());
        });
        this.element.addEventListener('drop', (ev: DragEvent) => {
            const data = ev.dataTransfer.getData('text');
            this.inventory.swapSlots(this.slot, Number(data));
            // @ts-ignore
            ev.target.style.backgroundColor = slotBg;
            ev.dataTransfer.clearData();
            ev.preventDefault();
        });
        this.element.addEventListener('dragenter', (ev: DragEvent) => {
            // @ts-ignore
            ev.target.style.backgroundColor = slotBgOver;
            ev.preventDefault();
        });
        this.element.addEventListener('dragleave', (ev: DragEvent) => {
            // @ts-ignore
            ev.target.style.backgroundColor = slotBg;
            ev.preventDefault();
        });
        this.element.addEventListener('dragover', (ev: DragEvent) => ev.preventDefault());
    }

    private getIconOffset(id: number): [number, number] {
        const stride = 16;
        const x = id % stride;
        const y = Math.floor(id / stride);
        return [x, y];
    }

    public updateIcon(): void {
        if (this.icon) this.icon.dispose();
        let x = 0;
        let y = 0;
        let w = 1;
        let h = 1;
        if (this.item) {
            [x, y] = this.getIconOffset(this.item.data.icon);
            w = 32;
            h = 32;
        }
        this.icon = new SpriteAtlasImage(this, atlas, new Rectangle(x * w, y * h, w, h));
        this.icon.style.position = 'initial';
        this.icon.width = slotSize;
        this.icon.height = slotSize;
    }
}

export default class Inventory extends Panel {
    private readonly slotCount: number = 28;
    private readonly slotsPerRow: number = 4;
    private readonly margin: number = 5;
    private readonly slotSize: number = 32;
    private readonly slotsPerCol: number = this.slotCount / this.slotsPerRow;
    private slots: Map<number, InventorySlot> = new Map();
    private _selectedSlot: InventorySlot = null;
    private eventEmitter: EventEmitter = new EventEmitter();

    public constructor() {
        super(UIParent.get());

        this.width = (this.slotSize + (this.margin * 2)) * this.slotsPerRow;
        this.height = (this.slotSize + (this.margin * 2)) * (this.slotCount / this.slotsPerRow);

        this.style.bottom = '0';
        this.style.right = '0';

        this.style.backgroundColor = 'rgba(0,0,0,0.2)';

        for (let i = 0; i < 28; i++) {
            this.slots.set(i, new InventorySlot(null, i, this, 5));
        }
    }

    public on(event: InventoryEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: InventoryEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    private emit(event: InventoryEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    public get selectedSlot(): number {
        return this._selectedSlot.slot;
    }
    public set selectedSlot(s: number) {
        const slot = this.slots.get(s);
        if (this._selectedSlot) this._selectedSlot.style.backgroundColor = slotBg;
        this._selectedSlot = slot;
        this._selectedSlot.style.backgroundColor = slotBgSelected;
    }

    public loadDef(def: InventoryDef): void {
        for (const idef of def.items) {
            console.log(`Setting ${idef.name} to slot ${idef.slot}`);

            this.setSlot(idef.slot, new LocalItem(idef));
        }
    }

    public swapSlots(a: number, b: number): void {
        const slotA = this.slots.get(a);
        const slotB = this.slots.get(b);
        const itemA = slotA.item;
        const itemB = slotB.item;
        slotA.item = itemB;
        slotB.item = itemA;
        this.emit('swap', slotA, slotB);
    }

    public setSlot(slot: number, item: LocalItem): void {
        const itemSlot = this.slots.get(slot);
        itemSlot.item = item;
    }
}
