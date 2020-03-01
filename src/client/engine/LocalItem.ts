import ItemDef from '../../common/definitions/ItemDef';

export default class LocalItem {
    public data: ItemDef;

    public constructor(def: ItemDef) {
        this.data = def;
    }
}
