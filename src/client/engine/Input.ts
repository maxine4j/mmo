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
            Input.setState(ev, true);
        });
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            Input.setState(ev, false);
        });
    }

    public static afterUpdate() {
        Input.lastKeyStates = new Map(Input.keyStates);
    }

    private static setState(ev: KeyboardEvent, down: boolean) {
        Input.keyStates.set(<Key>ev.key, down);
        Input.ctrl = ev.ctrlKey;
        Input.shift = ev.shiftKey;
        Input.alt = ev.altKey;
        Input.meta = ev.metaKey;
    }

    public static isKeyDown(key: Key): boolean {
        return Input.keyStates.get(key);
    }

    public static wasKeyDown(key: Key): boolean {
        return Input.lastKeyStates.get(key);
    }

    public static wasKeyPressed(key: Key): boolean { // check if the key was just released this frame
        return Input.wasKeyDown(key) && !Input.isKeyDown(key);
    }

    public static ctrlDown(): boolean {
        return Input.ctrl;
    }

    public static shiftDown(): boolean {
        return Input.shift;
    }

    public static altDown(): boolean {
        return Input.alt;
    }

    public static metaDown(): boolean {
        return Input.meta;
    }
}
