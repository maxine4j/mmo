class Map2DIterator<K1, K2, V> implements Iterator<[K1, K2, V]> {
    private data: Map<K1, Map<K2, V>>;
    private outerIter: IterableIterator<[K1, Map<K2, V>]>;
    private outerCurrent: IteratorResult<[K1, Map<K2, V>]>;
    private innerIter: IterableIterator<[K2, V]>;

    public constructor(data: Map<K1, Map<K2, V>>) {
        this.data = data;
        this.outerIter = this.data.entries();
        this.outerCurrent = this.outerIter.next();
        this.innerIter = this.outerCurrent.value[1].entries();
    }

    public next(): IteratorResult<[K1, K2, V]> {
        let innerCurrent = this.innerIter.next();
        while (innerCurrent.done) {
            this.outerCurrent = this.outerIter.next(); // move to the next outer
            if (this.outerCurrent.done) { // if we are done with the outer iter we are done with the entire map2d
                return { done: true, value: undefined };
            }
            this.innerIter = this.outerCurrent.value[1].entries(); // get the next inner iter
            innerCurrent = this.innerIter.next(); // get the next inner value
        }
        return {
            done: false,
            value: [
                this.outerCurrent.value[0], // K1
                innerCurrent.value[0], // K2
                innerCurrent.value[1], // V
            ],
        };
    }
}

export default class Map2D<K1, K2, V> implements Iterable<[K1, K2, V]> {
    private data: Map<K1, Map<K2, V>> = new Map();
    private _size: number = 0;

    public get size(): number { return this._size; }

    public get(x: K1, y: K2): V {
        const row = this.data.get(x);
        if (row) {
            return row.get(y);
        }
        return null;
    }

    public set(x: K1, y: K2, v: V): void {
        let row: Map<K2, V> = this.data.get(x);
        if (!row) {
            row = new Map();
            this.data.set(x, row);
        }
        row.set(y, v);
        this._size++;
    }

    public delete(x: K1, y: K2): boolean {
        const row: Map<K2, V> = this.data.get(x);
        if (row) {
            const success = row.delete(y);
            this._size--;
            if (row.size <= 0) {
                this.data.delete(x);
            }
            return success;
        }
        return false;
    }

    public contains(x: K1, y: K2): boolean {
        return this.get(x, y) != null;
    }

    public clear(): void {
        for (const [_, row] of this.data) {
            row.clear();
        }
        this.data.clear();
    }

    public [Symbol.iterator](): Iterator<[K1, K2, V]> {
        return new Map2DIterator(this.data);
    }
}
