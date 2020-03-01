import Panel from '../../client/engine/interface/components/Panel';
import PanelProp from '../PanelProp';
import { Frame } from '../../client/engine/interface/components/Frame';
import Input from '../../client/engine/Input';
import { Point } from '../../common/Point';

export interface BookCover {
    name: string;
    icon: HTMLImageElement;
}

const unselectedBorder = '5px solid rgba(0,0,0,0)';
const selectedBorder = '5px solid #8fffad';

class Book<T> extends Panel {
    public item: T;
    private conver: BookCover;
    private get icon(): HTMLImageElement { return this.conver.icon; }
    private get name(): string { return this.conver.name; }

    public constructor(parent: Shelf<T>, item: T, cover: BookCover) {
        super(parent);

        this.item = item;
        this.conver = cover;

        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.borderRadius = '5px';

        this.element.appendChild(cover.icon);

        this.icon.width = 64;
        this.icon.height = 64;
        this.icon.draggable = false;
        this.icon.style.borderRadius = '5px';
        this.icon.style.border = unselectedBorder;

        this.addEventListener('mouseenter', (self: Book<T>, ev: MouseEvent) => {
            Input.openTooltip(new Point(ev.clientX, ev.clientY), [this.name]);
        });
        this.addEventListener('mousemove', (self: Book<T>, ev: MouseEvent) => {
            Input.positionTooltip(new Point(ev.clientX, ev.clientY));
        });
        this.addEventListener('mouseleave', (self: Book<T>, ev: MouseEvent) => {
            Input.closeTooltip();
        });
    }

    public select(): void {
        this.icon.style.border = selectedBorder;
    }

    public unselect(): void {
        this.icon.style.border = unselectedBorder;
    }
}

declare interface Shelf<T> {
    emit(event: 'select', self: Shelf<T>, selected: Book<T>): boolean;

    on(event: 'select', listener: (self: Shelf<T>, selected: Book<T>) => void): this;
}

class Shelf<T> extends Panel {
    private books: Book<T>[] = [];
    private selected: Book<T>;

    public constructor(parent: Frame, bookDefs: { item: T, cover: BookCover }[]) {
        super(parent);

        this.style.overflowY = 'scroll';

        for (const def of bookDefs) {
            const book = new Book<T>(this, def.item, def.cover);
            book.addEventListener('click', () => {
                if (this.selected) this.selected.unselect();
                this.selected = book;
                this.selected.select();
                this.emit('select', this, this.selected);
            });
            this.books.push(book);
        }
    }
}

export default class LibraryProp<T> extends PanelProp {
    public constructor(parent: Frame, bookDefs: { item: T, cover: BookCover }[], onSelect: (value: T) => void) {
        super(parent);

        const shelf = new Shelf(parent, bookDefs);
        shelf.style.top = '0';
        shelf.style.right = '0';
        shelf.style.backgroundColor = 'rgba(0,0,0,0.8)';
        shelf.width = 315;
        shelf.height = 450;
        shelf.on('select', (self: Shelf<T>, book: Book<T>) => onSelect(book.item));
    }
}
