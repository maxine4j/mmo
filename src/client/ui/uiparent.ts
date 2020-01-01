import Frame from './frame';

export default class UIParent extends Frame {

    private static self: UIParent;

    private constructor() {
        super("uiparent", "div", null);
    }

    public static get(): UIParent {

        if (this.self === undefined) {
            this.self = new UIParent();
        }
        return this.self;
    }
}