import { EventEmitter } from 'events';

export function applyMixins(derivedCtor: any, baseCtors: any[]): void {
    baseCtors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
        });
    });
}

export class TypedEmitter<T extends string> {
    private eventEmitter: EventEmitter;

    public constructor() {
        this.eventEmitter = new EventEmitter();
    }

    public on(event: T, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: T, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    public once(event: T, listener: (...args: any[]) => void): void {
        this.eventEmitter.once(event, listener);
    }

    protected emit(event: T, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    protected removeAllListeners(): void {
        this.eventEmitter.removeAllListeners();
    }
}
