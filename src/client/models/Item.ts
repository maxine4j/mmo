import ItemDef from '../../common/definitions/ItemDef';

export default class Item {
    public data: ItemDef;

    public constructor(def: ItemDef) {
        this.data = def;
    }
}
