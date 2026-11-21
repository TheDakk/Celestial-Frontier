import { expect } from 'vitest';
import {
  F3_REVISION_KEY,
  classifyV4Save,
  initializeFreshV5,
  type ContentRegistry,
  type StorageBackend,
  type V5WritableState,
} from '@cf/persistence';

/** Start `backend` as a v2 save of `save` (a v4 save string, or a writable state) through
 * initializeFreshV5, then set its revision row to '0'. A fresh v2 store starts at revision '1';
 * these tests were written against a store made by the v4-to-v5 migration, which started at
 * '0', and count their revisions from there. Nothing in the package treats '0' specially. */
export async function seedV5Store(
  backend: StorageBackend,
  save: string | V5WritableState,
  registry: ContentRegistry,
  now: number,
): Promise<void> {
  let writable: V5WritableState;
  if (typeof save === 'string') {
    const classified = classifyV4Save(save, registry, now);
    if (classified.kind !== 'supported') throw new Error(`seed save was ${classified.kind}`);
    writable = { state: classified.state, extensions: {} };
  } else {
    writable = save;
  }
  expect((await initializeFreshV5(backend, writable, registry, now)).kind).toBe('initialized');
  await backend.apply([{ store: 'meta', key: F3_REVISION_KEY, value: '0' }]);
}
