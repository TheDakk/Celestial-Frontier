/** Things held up to a budget of bytes; the least recently used is dropped first. */
export interface ByteCache<T> {
  /** The thing under the key, now the most recently used; undefined when it is not held. */
  get(key: string): T | undefined;
  /** Holds the thing, dropping the least recently used until the budget is met. A thing larger than the whole budget is not held. */
  put(key: string, value: T, bytes: number): void;
  bytesHeld(): number;
}

export function createByteCache<T>(budgetBytes: number): ByteCache<T> {
  // A Map lists its keys in the order they were set: the first is the least recently used.
  const held = new Map<string, { value: T; bytes: number }>();
  let total = 0;
  const drop = (key: string): void => {
    total -= held.get(key)?.bytes ?? 0;
    held.delete(key);
  };
  return {
    get(key) {
      const entry = held.get(key);
      if (entry === undefined) return undefined;
      held.delete(key);
      held.set(key, entry);
      return entry.value;
    },
    put(key, value, bytes) {
      drop(key);
      if (bytes > budgetBytes) return;
      held.set(key, { value, bytes });
      total += bytes;
      for (const oldest of held.keys()) {
        if (total <= budgetBytes) break;
        drop(oldest);
      }
    },
    bytesHeld: () => total,
  };
}
