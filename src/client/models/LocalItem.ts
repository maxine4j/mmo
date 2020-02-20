import ItemDef from '../../common/ItemDef';

export default class LocalItem {
    public data: ItemDef;

    public constructor(def: ItemDef) {
        this.data = def;
    }
}
