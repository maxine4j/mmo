import Rectangle from '../../../common/Rectangle';
import Panel from './components/Panel';
import UIParent from './components/UIParent';
import Item from '../LocalItem';
import ItemDef from '../../../common/ItemDef';
import SpriteAtlas from './components/SpriteAtlas';
import SpriteAtlasImage from './components/SpriteAtlasImage';

const slotSize = 32;
const atlas = new SpriteAtlas('assets/icons/atlas.png');

class InventorySlot extends Panel {
    public icon: SpriteAtlasImage;
    public item: Item;
    public slot: number;

    public constructor(item: Item, slot: number, parent: Inventory, margin: number) {
        super(parent);
        this.item = item;
        this.slot = slot;

        this.icon = new SpriteAtlasImage(this, atlas, new Rectangle(5 * 32, 5 * 32, 32, 32));
        this.icon.style.position = 'initial';
        this.icon.width = 64;
        this.icon.height = 64;

        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.margin = `${margin}px`;
    }
}

export default class Inventory extends Panel {
    private readonly slotCount: number = 28;
    private readonly slotsPerRow: number = 4;
    private readonly margin: number = 5;
    private readonly slotSize: number = 32;
    private slotsPerCol: number = this.slotCount / this.slotsPerRow;
    private slots: Map<number, InventorySlot> = new Map();

    public constructor() {
        super(UIParent.get());

        this.width = (this.slotSize + (this.margin * 2)) * this.slotsPerRow;
        this.height = (this.slotSize + (this.margin * 2)) * (this.slotCount / this.slotsPerRow);

        this.style.bottom = '0';
        this.style.right = '0';

        this.style.backgroundColor = 'rgba(0,0,0,0.2)';

        for (let i = 0; i < 28; i++) {
            this.setSlot(i, new Item(<ItemDef>{
                id: 0,
                icon: 'assets/icons/atlas.png',
            }));
        }
    }

    public setSlot(slot: number, item: Item): void {
        const old = this.slots.get(slot);
        if (old) old.dispose();
        this.slots.set(slot, new InventorySlot(item, slot, this, this.margin));
    }
}
