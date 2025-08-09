/* eslint-disable @typescript-eslint/no-explicit-any */
type Listener = (...args: any[]) => void;

export class BasicEventEmitter {
  listeners: Map<string, Map<Listener, { once: boolean }>>;
  constructor() {
    this.listeners = new Map();
  }

  private _prepareListenersMap(eventName: string) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Map());
  }

  on(eventName: string, listener: Listener) {
    this._prepareListenersMap(eventName);
    this.listeners.get(eventName)!.set(listener, { once: false });

    return () => this.off(eventName, listener);
  }

  once(eventName: string, listener: Listener) {
    this._prepareListenersMap(eventName);
    this.listeners.get(eventName)?.set(listener, { once: true });
  }

  filteredOnce(eventName: string, listener: (...args: any[]) => boolean, timeout = -1, onTimeout?: () => void) {
    const timeoutId = timeout > 0 ? setTimeout(() => {
      this.off(eventName, listener);
      onTimeout?.();
    }, timeout) : null;

    const wrappedListener = (...args: any[]) => {
      if (listener(...args)) {
        if (timeoutId) clearTimeout(timeoutId);
        this.off(eventName, wrappedListener);
      }
    }

    this.on(eventName, wrappedListener);
  }

  off(eventName: string, listener?: Listener) {
    if (!eventName) return this.listeners = new Map();
    if (!listener) return this.listeners?.delete(eventName);
    this.listeners.get(eventName)?.delete(listener)
  }

  emit(eventName: string, ...args: any[]) {
    if (!this.listeners.has(eventName)) return;
    const eventMap = this.listeners.get(eventName)!;
    eventMap.forEach(({ once }, listener) => {
      if (once) eventMap?.delete(listener);
      listener(...args);
    });
  }
}