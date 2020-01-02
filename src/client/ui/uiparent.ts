import Frame from './frame';

export default class UIParent extends Frame {
    private static self: UIParent;

    private constructor() {
        super('uiparent', 'div', null);
    }

    protected createElement() {
        this.element = document.getElementById(this.id);
    }

    public static get(): UIParent {
        if (this.self === undefined) {
            this.self = new UIParent();
        }
        return this.self;
    }
}
