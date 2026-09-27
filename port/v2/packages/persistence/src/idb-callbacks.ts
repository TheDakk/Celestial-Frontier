/** A database owns four capture listeners for its entire connection lifetime.
 * Requests and transactions hold only WeakMap state: completing an operation
 * allocates no native listener wrappers awaiting a later garbage collection.
 * Open requests have no database parent yet and own temporary listeners. */
type Kind = 'success' | 'error' | 'complete' | 'abort' | 'blocked' | 'upgradeneeded';
type Callbacks = Readonly<Partial<Record<Kind, () => void>>>;
const callbacks = new WeakMap<EventTarget, Callbacks>();
const databases = new WeakSet<IDBDatabase>();
function dispatch(event: Event): void {
  const target = event.target;
  if (!target) return;
  callbacks.get(target)?.[event.type as Kind]?.();
  // Request errors also reach the transaction in native IDB propagation.
  // Preserve that outcome after the request handler (which may abort it).
  if (event.type === 'error' && 'transaction' in target) {
    const tx = (target as IDBRequest).transaction;
    if (tx) callbacks.get(tx)?.error?.();
  }
}
export function ownIdbCallbacks(target: IDBRequest | IDBTransaction, handlers: Callbacks): () => void {
  callbacks.set(target, handlers);
  const db = 'db' in target ? target.db : target.transaction?.db;
  if (db) {
    if (!databases.has(db)) {
      for (const kind of ['success', 'error', 'complete', 'abort']) db.addEventListener(kind, dispatch, true);
      databases.add(db);
    }
    return () => { callbacks.delete(target); };
  }
  const kinds = Object.keys(handlers) as Kind[];
  for (const kind of kinds) target.addEventListener(kind, dispatch);
  return () => {
    for (const kind of kinds) target.removeEventListener(kind, dispatch);
    callbacks.delete(target);
  };
}
