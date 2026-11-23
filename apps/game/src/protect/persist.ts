/* Asking the browser to keep the saved data. A browser may clear a site's storage when the device runs
   short of space unless the site has asked for it to be kept and been granted that. */
import type { Bus } from '../bus';
import type { GameEvents, PersistState } from '../events';

/** The part of `navigator.storage` this uses. A browser may lack the object or either call. */
export interface StorageManagerLike {
  persist?(): Promise<boolean>;
  persisted?(): Promise<boolean>;
}

async function answer(call: (() => Promise<boolean>) | undefined): Promise<PersistState> {
  if (call === undefined) return 'unsupported';
  try {
    return await call() ? 'kept' : 'not-kept';
  } catch {
    return 'unknown';
  }
}

/** Whether the data is kept now, without asking. Never throws. */
export function readPersistState(storage: StorageManagerLike | undefined): Promise<PersistState> {
  return answer(typeof storage?.persisted === 'function' ? () => storage.persisted!() : undefined);
}

/** Asks the browser to keep the data. Never throws. */
export function askToKeepData(storage: StorageManagerLike | undefined): Promise<PersistState> {
  return answer(typeof storage?.persist === 'function' ? () => storage.persist!() : undefined);
}

export function createPersistAsker(deps: { storage: StorageManagerLike | undefined; bus: Bus<GameEvents> }): {
  /** Call on every player gesture: the first one asks, once per page life. */
  onFirstGesture(): void;
  askAgain(): Promise<PersistState>;
} {
  let asked = false;
  const askAgain = async (): Promise<PersistState> => {
    const state = await askToKeepData(deps.storage);
    deps.bus.emit('protect:persist', { state });
    return state;
  };
  return {
    onFirstGesture() {
      if (asked) return;
      asked = true;
      void askAgain();
    },
    askAgain,
  };
}
