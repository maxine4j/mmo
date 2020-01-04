import { Key } from 'ts-key-enum';

export default class Input {
    private static lastKeyStates: Map<Key, boolean> = new Map();
    private static keyStates: Map<Key, boolean> = new Map();
    private static ctrl: boolean = false;
    private static shift: boolean = false;
    private static alt: boolean = false;
    private static meta: boolean = false;

    public static init() {
        window.addEventListener('keydown', (ev: KeyboardEvent) => {
            this.setState(ev, true);
        });
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            this.setState(ev, false);
        });
    }

    public static afterUpdate() {
        this.lastKeyStates = new Map(this.keyStates);
    }

    private static setState(ev: KeyboardEvent, down: boolean) {
        this.keyStates.set(<Key>ev.key, down);
        this.ctrl = ev.ctrlKey;
        this.shift = ev.shiftKey;
        this.alt = ev.altKey;
        this.meta = ev.metaKey;
    }

    public static isKeyDown(key: Key): boolean {
        return this.keyStates.get(key);
    }

    public static wasKeyDown(key: Key): boolean {
        return this.lastKeyStates.get(key);
    }

    public static wasKeyPressed(key: Key): boolean { // check if the key was just released this frame
        return this.wasKeyDown(key) && !this.isKeyDown(key);
    }

    public static ctrlDown(): boolean {
        return this.ctrl;
    }

    public static shiftDown(): boolean {
        return this.shift;
    }

    public static altDown(): boolean {
        return this.alt;
    }

    public static metaDown(): boolean {
        return this.meta;
    }
}
