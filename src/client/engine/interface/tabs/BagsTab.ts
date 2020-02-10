import { EventEmitter } from 'events';
import Panel from '../components/Panel';
import LocalItem from '../../LocalItem';
import AtlasSprite from '../components/AtlasSprite';
import InventoryDef from '../../../../common/InventoryDef';
import Input from '../../Input';
import { Point } from '../../../../common/Point';
import TabContainer from '../TabContainer';
import BaseTab, { setUpTabPanel } from '../BaseTab';
import AssetManager from '../../asset/AssetManager';

const slotSize = 32;
const slotCount = 28;
const slotsPerRow = 4;
const margin = 5;
const itemIconAtlas = AssetManager.getAtlas('items');


const slotBg = 'rgba(255,255,255,0.0)';
const slotBgOver = 'rgba(255,255,255,0.2)';
const slotBgSelected = 'rgba(255,255,255,0.4)';

type InventoryEvent = 'swap' | 'use' | 'drop';

export class InventorySlot extends Panel {
    public icon: AtlasSprite;
    private _item: LocalItem;
    public slot: number;
    public inventory: BagsTab;

    public constructor(item: LocalItem, slot: number, parent: BagsTab) {
        super(parent);
        this.inventory = parent;
        this.element.draggable = true;
        this.item = item;
        this.slot = slot;

        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.margin = `${margin}px`;
        this.style.backgroundColor = slotBg;
        this.width = slotSize;
        this.height = slotSize;

        this.initDragging();
        this.element.addEventListener('click', (ev: MouseEvent) => {
            if (this.item) {
                this.inventory.useItem(this);
            }
        });
        this.element.addEventListener('contextmenu', (ev: MouseEvent) => {
            Input.openContextMenu(
                new Point(ev.clientX, ev.clientY),
                [
                    {
                        text: `Use ${this.item.data.name}`,
                        listener: () => {
                            this.inventory.useItem(this);
                        },
                    },
                    {
                        text: `Drop ${this.item.data.name}`,
                        listener: () => {
                            if (this.item) {
                                this.inventory.dropItem(this);
                            }
                        },
                    },
                    {
                        text: 'Cancel',
                        listener: () => {},
                    },
                ],
            );
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

    public updateIcon(): void {
        if (this.icon) this.icon.dispose();
        if (this.item) {
            this.icon = itemIconAtlas.getSprite(this.item.data.icon, this);
            this.icon.style.position = 'initial';
            this.icon.width = slotSize;
            this.icon.height = slotSize;
        }
    }
}

export default class BagsTab extends BaseTab {
    public get name(): string { return 'Inventory'; }
    private slots: Map<number, InventorySlot> = new Map();
    private selectedSlot: InventorySlot = null;
    private eventEmitter: EventEmitter = new EventEmitter();

    public constructor(parent: TabContainer) {
        super(parent);
        setUpTabPanel(this);

        this.width = slotsPerRow * (slotSize + 2 * margin);
        this.height = parent.height;

        for (let i = 0; i < slotCount; i++) {
            this.slots.set(i, new InventorySlot(null, i, this));
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

    public loadDef(def: InventoryDef): void {
        for (const idef of def.items) {
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

    public useItem(slot: InventorySlot): void {
        if (this.selectedSlot) { // send the use event we already have a selected item
            this.selectedSlot.style.backgroundColor = slotBg;
            this.emit('use', this.selectedSlot, slot);
            this.selectedSlot = null;
        } else { // else we select this as our first item
            this.selectedSlot = slot;
            this.selectedSlot.style.backgroundColor = slotBgSelected;
        }
    }

    public dropItem(slot: InventorySlot): void {
        this.emit('drop', slot);
    }
}
