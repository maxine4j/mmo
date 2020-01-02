import { Frame } from './Frame';


export default class Panel extends Frame {
    protected element: HTMLLabelElement;

    constructor(id: string, parent: Frame) {
        super(id, 'div', parent);
    }
}
