export type Listener<P> = (payload: P) => void;

export interface Bus<E extends object> {
  /** Returns the function that removes this listener. */
  on<K extends keyof E>(type: K, listener: Listener<E[K]>): () => void;
  /** Calls every listener of the type, in subscription order, before returning. An emit made by a listener
   *  is delivered after the current one finishes. Every listener runs even when one throws; the first error
   *  is then thrown to the outermost caller. */
  emit<K extends keyof E>(type: K, payload: E[K]): void;
}

interface Entry {
  readonly call: (payload: unknown) => void;
  live: boolean;
}

export function createBus<E extends object>(): Bus<E> {
  const entries = new Map<keyof E, Entry[]>();
  const pending: Array<{ type: keyof E; payload: unknown }> = [];
  let delivering = false;

  return {
    on(type, listener) {
      const entry: Entry = { call: listener as (payload: unknown) => void, live: true };
      entries.set(type, [...(entries.get(type) ?? []), entry]);
      return () => {
        if (!entry.live) return;
        entry.live = false;
        entries.set(type, (entries.get(type) ?? []).filter((e) => e !== entry));
      };
    },
    emit(type, payload) {
      pending.push({ type, payload });
      if (delivering) return;
      delivering = true;
      const errors: unknown[] = [];
      try {
        for (let next = pending.shift(); next !== undefined; next = pending.shift()) {
          // The list is replaced, never changed in place, so this is the list as it stood when delivery began.
          for (const entry of entries.get(next.type) ?? []) {
            if (!entry.live) continue;
            try {
              entry.call(next.payload);
            } catch (error) {
              errors.push(error);
            }
          }
        }
      } finally {
        delivering = false;
      }
      if (errors.length > 0) throw errors[0];
    },
  };
}
