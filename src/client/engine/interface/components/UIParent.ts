import { Frame } from './Frame';


export default class UIParent extends Frame {
    private static instance: UIParent;

    private constructor() {
        super('div', null);
    }

    protected createElement(): void {
        this.element = document.getElementById('uiparent');
        this.element.style.pointerEvents = 'none';
    }

    public static get(): UIParent {
        if (UIParent.instance === undefined) {
            UIParent.instance = new UIParent();
        }
        return UIParent.instance;
    }
}
