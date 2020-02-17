import { Frame } from '../client/engine/interface/components/Frame';

export default class PanelProp {
    public parent: Frame;

    public constructor(parent: Frame) {
        this.parent = parent;
    }
}
