import { Frame } from './Frame';


export default class UIParent extends Frame {
    private static instance: UIParent;

    private constructor() {
        super('uiparent', 'div', null);
    }

    protected createElement() {
        this.element = document.getElementById(this.id);
        this.element.style.pointerEvents = 'none';
    }

    public static get(): UIParent {
        if (UIParent.instance === undefined) {
            UIParent.instance = new UIParent();
        }
        return UIParent.instance;
    }
}
