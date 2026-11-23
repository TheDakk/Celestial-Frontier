import { describe, expect, it } from 'vitest';
import {
  PORTABLE_V5_MAX_BYTES,
  V5_SNAPSHOT_KEY,
  createMemoryBackend,
  exportSaveV2,
  readF4Authority,
  type StorageBackend,
} from '@cf/persistence';
import { createBus } from '../src/bus';
import type { GameEvents } from '../src/events';
import { PROTECT_NAMESPACE, PROTECT_VERSION } from '../src/protect/backup';
import { backupFileName, checkRestoreText, createBackupText, readLastBackupAt, recordBackup, restoreBackup } from '../src/protect/index';
import { REGISTRY, bootSave, createSaveLoop, replaceExpedition, resetExpedition } from '../src/save/index';
import { pausable } from './save-loop-support';
import { GALAXY_ROUTE, NOW, SOL_ROUTE, bootedPage, dump, seedCurrentSave } from './save-support';

const boot = (backend: StorageBackend) => bootSave({ backend, registry: REGISTRY, wallNow: NOW, freshRoute: SOL_ROUTE });
const BACKED_UP_AT = NOW + 90_000;

/** A booted page with its save loop, and the doors of this system wired as the page wires them. */
async function bootedHarness(backend: StorageBackend = createMemoryBackend(), token = 'document-a') {
  const page = await bootedPage(backend, token);
  let route = page.live.savedView;
  const loop = createSaveLoop({
    runtime: page.runtime, gate: page.gate, bus: createBus<GameEvents>(), clocks: page.clocks, backend,
    live: () => page.live, route: () => route,
  });
  const reloads: number[] = [];
  const settle = (): Promise<void> => loop.flush();
  const reload = (): void => { reloads.push(1); };
  const replace = { runtime: page.runtime, gate: page.gate, settle, reload };
  return {
    ...page, loop, reloads,
    setRoute: (next: Record<string, unknown> | null) => { route = next; },
    record: {
      extensions: () => page.runtime.extensions, wallNow: BACKED_UP_AT,
      store: (writes: Parameters<typeof loop.request>[1]) => loop.request('lifecycle', writes),
    },
    reset: { ...replace, registry: REGISTRY, clocks: page.clocks, solView: SOL_ROUTE },
    deps: { replaceExpedition: (operations: Parameters<typeof replaceExpedition>[1]) => replaceExpedition(replace, operations) },
  };
}

/** A played expedition: a setting changed, the route moved, a minute of play, stored. */
async function playedHarness() {
  const h = await bootedHarness();
  h.live.fsMode = 'fs-xl';
  h.setRoute(GALAXY_ROUTE);
  h.time.advance(60_000);
  if (!await h.loop.request('settings')) throw new Error('the played expedition was not stored');
  return h;
}

const backupOf = (h: { live: Awaited<ReturnType<typeof bootedHarness>>['live']; runtime: Awaited<ReturnType<typeof bootedHarness>>['runtime'] }): string =>
  createBackupText({ state: h.live, extensions: h.runtime.extensions, registry: REGISTRY, wallNow: NOW });

function okCheck(text: string) {
  const check = checkRestoreText(text, REGISTRY, NOW);
  if (check.kind !== 'ok') throw new Error(check.kind);
  return check;
}

describe('backup and restore', () => {
  it('a backup of a played expedition restores on an empty device to the same state, extensions and active-play total', async () => {
    const a = await playedHarness();
    const text = backupOf(a);
    const b = await bootedHarness();
    expect(await restoreBackup(b.deps, okCheck(text))).toBe('restored');
    expect(b.reloads).toHaveLength(1);

    const restored = await boot(b.backend);
    expect(restored.kind).toBe('current');
    expect(createBackupText({ state: restored.state, extensions: restored.extensions, registry: REGISTRY, wallNow: NOW })).toBe(text);
    const original = await boot(a.backend);
    expect(restored.state).toEqual(original.state);
    expect(restored.state).toMatchObject({ fsMode: 'fs-xl', savedView: GALAXY_ROUTE });
    expect(restored.extensions).toEqual(original.extensions);
    expect(restored.restoredAuthority?.activePlayMs).toBe(60_000);
    expect(readF4Authority(original.extensions)).toMatchObject({ kind: 'loaded', authority: { activePlayMs: 60_000 } });
  });

  it('a backup file that gained white space around it on the way still restores', async () => {
    const text = backupOf(await playedHarness());
    expect(checkRestoreText(`\n${text}\r\n`, REGISTRY, NOW).kind).toBe('ok');
  });

  it('a file from a newer version is refused and the store is unchanged', async () => {
    const a = await playedHarness();
    const before = await dump(a.backend);
    const newer = JSON.stringify({ ...JSON.parse(backupOf(a)) as object, version: 2 });
    expect(checkRestoreText(newer, REGISTRY, NOW)).toEqual({ kind: 'future-version' });
    expect(await dump(a.backend)).toEqual(before);
  });

  it('a damaged file is refused and the store is unchanged', async () => {
    const a = await playedHarness();
    const before = await dump(a.backend);
    const text = backupOf(a);
    const extraField = JSON.stringify({ ...JSON.parse(text) as object, note: 'edited' });
    for (const damaged of [text.slice(0, -40), text.replace('"legacyV4":"{', '"legacyV4":"{ '), extraField, `${text}{}`, '', 'not a save', '[]', 'null']) {
      expect(checkRestoreText(damaged, REGISTRY, NOW), damaged.slice(0, 40)).toEqual({ kind: 'corrupt' });
    }
    expect(await dump(a.backend)).toEqual(before);
  });

  it('a save string from the old game is refused', async () => {
    const a = await playedHarness();
    const old = exportSaveV2(a.live, NOW);
    expect(JSON.parse(old)).toMatchObject({ v: 4 });
    expect(checkRestoreText(old, REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
  });

  it('a file over the size limit is refused as too large, counted in bytes', () => {
    expect(checkRestoreText('x'.repeat(PORTABLE_V5_MAX_BYTES + 1), REGISTRY, NOW)).toEqual({ kind: 'too-large' });
    expect(checkRestoreText('é'.repeat(PORTABLE_V5_MAX_BYTES / 2 + 1), REGISTRY, NOW)).toEqual({ kind: 'too-large' });
    expect(checkRestoreText('x'.repeat(PORTABLE_V5_MAX_BYTES), REGISTRY, NOW)).toEqual({ kind: 'corrupt' });
  });

  it('the last-backup time is null on a new expedition, set by a backup, kept across a reboot, and null after a reset', async () => {
    const h = await bootedHarness();
    expect(readLastBackupAt(h.booted.extensions)).toBeNull();
    expect(readLastBackupAt(h.runtime.extensions)).toBeNull();

    expect(await recordBackup(h.record)).toBe(true);
    expect(readLastBackupAt(h.runtime.extensions)).toBe(BACKED_UP_AT);
    expect(readLastBackupAt((await boot(h.backend)).extensions)).toBe(BACKED_UP_AT);

    expect(await recordBackup({ ...h.record, wallNow: BACKED_UP_AT + 5 })).toBe(true);
    expect(readLastBackupAt((await boot(h.backend)).extensions)).toBe(BACKED_UP_AT + 5);

    expect(await resetExpedition(h.reset)).toBe('reset');
    expect(readLastBackupAt((await boot(h.backend)).extensions)).toBeNull();
  });

  it('storing the backup time changes nothing else in the save, and it is stored in the settings segment', async () => {
    const h = await playedHarness();
    const before = await boot(h.backend);
    h.live.essence = 5_000; // not stored by anything but its own transaction
    expect(await recordBackup(h.record)).toBe(true);
    const after = await boot(h.backend);
    expect(after.state).toEqual(before.state);
    expect(after.revision).toBe(before.revision + 1);
    expect(after.extensions.settings).toEqual({
      [PROTECT_NAMESPACE]: { version: PROTECT_VERSION, json: JSON.stringify({ lastBackupAt: BACKED_UP_AT }) },
    });
    expect({ ...after.extensions, settings: undefined }).toEqual({ ...before.extensions, settings: undefined });
  });

  it('a backup time asked to be stored while a checkpoint is being stored waits for it; both are stored', async () => {
    const h = await bootedHarness();
    h.live.sndOn = false;
    const storing = h.loop.request('settings');
    expect(await recordBackup(h.record)).toBe(true);
    expect(await storing).toBe(true);
    const after = await boot(h.backend);
    expect(after.state.sndOn).toBe(false);
    expect(readLastBackupAt(after.extensions)).toBe(BACKED_UP_AT);
    expect(await h.loop.request('settings')).toBe(true); // the page still writes
  });

  it('a checkpoint asked for while the backup time is being stored waits its turn; both are stored and no reload is asked', async () => {
    const store = pausable();
    const h = await bootedHarness(store.backend);
    const inFlight = store.pauseNext();
    const recording = recordBackup(h.record);
    await inFlight;
    h.live.sndOn = false;
    const storing = h.loop.request('settings');
    store.release();
    expect([await recording, await storing, h.loop.status]).toEqual([true, true, 'idle']);
    const after = await boot(h.backend);
    expect(after.state.sndOn).toBe(false);
    expect(readLastBackupAt(after.extensions)).toBe(BACKED_UP_AT);
    expect(h.runtime.diagnostics()).toMatchObject({ leaseOwned: true, staleBlocked: false });
  });

  it('a last-backup record this build cannot read shows as never and is left as it is', async () => {
    const backend = createMemoryBackend();
    const newer = { settings: { [PROTECT_NAMESPACE]: { version: PROTECT_VERSION + 1, json: '{"lastBackupAt":5}' } } };
    await seedCurrentSave(backend, 'Vega', newer);
    const h = await bootedHarness(backend);
    expect(readLastBackupAt(h.runtime.extensions)).toBeNull();
    const before = await dump(backend);
    expect(await recordBackup(h.record)).toBe(false);
    expect(await dump(backend)).toEqual(before);
    for (const json of ['{}', '{"lastBackupAt":"1"}', '{"lastBackupAt":-1}', '{"lastBackupAt":1.5}']) {
      expect(readLastBackupAt({ settings: { [PROTECT_NAMESPACE]: { version: PROTECT_VERSION, json } } }), json).toBeNull();
    }
  });

  it('under a hold a restore is refused and the bytes are unchanged; a backup stores no time', async () => {
    // An expedition whose stored row is damaged: it loads read-only from the recovery snapshot.
    const a = await playedHarness();
    const text = backupOf(a);
    expect(await restoreBackup(a.deps, okCheck(text))).toBe('restored');
    await a.backend.apply([{ store: 'player', key: 'v5:player', value: '{broken' }]);
    const h = await bootedHarness(a.backend, 'document-b');
    expect(h.booted.kind).toBe('recovered-protected');
    expect(h.gate.hold).toBe('protected-payload');
    const before = await dump(h.backend);

    // It can still be backed up, and the file is the whole expedition.
    const rescued = createBackupText({ state: h.booted.state, extensions: h.booted.extensions, registry: REGISTRY, wallNow: NOW });
    expect(rescued).toBe(text);
    expect(JSON.parse((await h.backend.get('journal', V5_SNAPSHOT_KEY))!)).toMatchObject({ raw: text });
    expect(await recordBackup(h.record)).toBe(false);
    expect(await dump(h.backend)).toEqual(before);

    expect(await restoreBackup(h.deps, okCheck(text))).toBe('refused');
    expect(await dump(h.backend)).toEqual(before);
    expect(h.reloads).toEqual([]);
  });

  it('a page that holds the lease but came under a hold stores no backup time and restores nothing', async () => {
    const h = await playedHarness();
    const text = backupOf(h);
    h.gate.protect('the stored expedition did not prove writable');
    const before = await dump(h.backend);
    expect(h.runtime.diagnostics().leaseOwned).toBe(true);
    expect(await recordBackup(h.record)).toBe(false);
    expect(await restoreBackup(h.deps, okCheck(text))).toBe('refused');
    expect(await dump(h.backend)).toEqual(before);
    expect(h.reloads).toEqual([]);
  });

  it('the backup file is named for the local date and time of the backup', () => {
    expect(backupFileName(new Date(2026, 10, 22, 9, 5, 30).getTime())).toBe('celestial-frontier-backup-20261122-0905.cfsave');
    expect(backupFileName(new Date(2027, 0, 3, 23, 59).getTime())).toBe('celestial-frontier-backup-20270103-2359.cfsave');
  });
});
