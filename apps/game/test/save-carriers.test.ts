// The product carriers at boot: world identity, loot, engineering and ownership are made from the stored state
// when the save has none, in one checkpoint, and are left byte for byte once they exist.
import { describe, expect, it } from 'vitest';
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER } from '@cf/domain-acquisition';
import { SCENE_ENGINEERING_ADDRESS_RESOLVER } from '@cf/domain-opportunity';
import {
  createMemoryBackend,
  prepareArc4OwnershipLegacyMigration,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readArc3Engineering,
  readArc4Ownership,
  readRevisionedSaveV5WithRecovery,
  readWorldIdentity,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import { settleScoutV1 } from '../src/care';
import { stageStarterCharterEventV1 } from '../src/guidance';
import { CARRIERS, REGISTRY, bootstrapCarriers, startCarriers, watchCarriers } from '../src/save/index';
import { heldNoticeFor } from '../src/screens/notices';
import { bootedHarness } from './save-loop-support';
import { earthId, heldPage } from './care-support';
import { NOW, controlledClock, dump, namedState, seedCurrentSave } from './save-support';

const loadedKinds = (extensions: V5Extensions) => ({
  'world-identity': readWorldIdentity(extensions).kind,
  loot: readArc2Loot(extensions).kind,
  engineering: readArc3Engineering(extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER).kind,
  ownership: readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER).kind,
});
/** Extensions holding only a loot carrier one version ahead of this build's. */
function newerLoot(): V5Extensions {
  const out: Record<string, Record<string, { version: number; json: string }>> = {};
  for (const write of bootstrapCarriers(namedState('Vega'), {}).writes) {
    if (readArc2Loot({ [write.segment]: { [write.namespace]: write.carrier } }).kind !== 'loaded') continue;
    out[write.segment] = { [write.namespace]: { version: write.carrier.version + 1, json: write.carrier.json } };
  }
  return out as V5Extensions;
}
const ALL = (status: string) => Object.fromEntries(CARRIERS.map((name) => [name, status]));
async function stored(backend: StorageBackend) {
  const read = await readRevisionedSaveV5WithRecovery(backend, REGISTRY, NOW);
  if (read.kind !== 'loaded') throw new Error(`stored save was ${read.kind}`);
  return read;
}

describe('the product carriers of a save', () => {
  it('there are four: world identity, loot, engineering, ownership', () => {
    expect(CARRIERS).toEqual(['world-identity', 'loot', 'engineering', 'ownership']);
  });

  it('a state with no carrier gains all four, each readable from the extensions returned', () => {
    const boot = bootstrapCarriers(namedState('Vega'), {});
    expect(boot.status).toEqual(ALL('created'));
    expect(boot.refused).toEqual([]);
    expect(boot.newer).toBe(false);
    expect(boot.writes.length).toBeGreaterThanOrEqual(4);
    expect(loadedKinds({})).toEqual(ALL('absent'));
    expect(loadedKinds(boot.extensions)).toEqual(ALL('loaded'));
  });

  it('carriers that exist are left as they are: a second pass writes nothing', () => {
    const first = bootstrapCarriers(namedState('Vega'), {});
    const second = bootstrapCarriers(namedState('Vega'), first.extensions);
    expect(second.status).toEqual(ALL('loaded'));
    expect(second.writes).toEqual([]);
    expect(second.extensions).toEqual(first.extensions);
  });

  it('only the missing carrier is made when the others exist', () => {
    const full = bootstrapCarriers(namedState('Vega'), {});
    const alone = prepareArc4OwnershipLegacyMigration({ extensions: {}, legacy: namedState('Vega'), resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
    if (alone.kind !== 'prepared') throw new Error(`ownership alone was ${alone.kind}`);
    const ownership = full.writes.filter((write) => alone.writes.some((o) => o.segment === write.segment && o.namespace === write.namespace));
    expect(ownership.length).toBe(alone.writes.length);
    const without: Record<string, Record<string, unknown>> = structuredClone(full.extensions) as never;
    for (const write of ownership) delete without[write.segment]![write.namespace];
    const boot = bootstrapCarriers(namedState('Vega'), without as V5Extensions);
    expect(boot.status).toEqual({ ...ALL('loaded'), ownership: 'created' });
    expect(boot.writes).toEqual(ownership);
    expect(boot.extensions).toEqual(full.extensions);
  });

  it('the loot carrier is made from the stored state: gear worn in the save is worn in the carrier', () => {
    const state = namedState('Vega');
    state.items = [['stabil', 1]];
    state.equip = { module: 'stabil' };
    const boot = bootstrapCarriers(state, {});
    const loadout = readArc2EngineeringLoadout(boot.extensions);
    expect(loadout.kind === 'loaded' && [loadout.capabilities.landingSuccessBonus, loadout.capabilities.waveOffDamageReduction]).toEqual([15, 3]);
    const bare = readArc2EngineeringLoadout(bootstrapCarriers(namedState('Vega'), {}).extensions);
    expect(bare.kind === 'loaded' && bare.capabilities.landingSuccessBonus).toBe(0);
  });

  /** Extensions holding only a loot carrier, as made for a new game, with its version or its text changed. */
  const lootCarrier = (change: (carrier: { version: number; json: string }) => { version: number; json: string }): V5Extensions => {
    const out: Record<string, Record<string, { version: number; json: string }>> = {};
    for (const write of bootstrapCarriers(namedState('Vega'), {}).writes) {
      if (readArc2Loot({ [write.segment]: { [write.namespace]: write.carrier } }).kind !== 'loaded') continue;
      out[write.segment] = { [write.namespace]: change(write.carrier) };
    }
    expect(Object.keys(out).length).toBe(1);
    return out as V5Extensions;
  };
  const NEWER = lootCarrier((carrier) => ({ version: carrier.version + 1, json: carrier.json }));
  const DAMAGED = lootCarrier((carrier) => ({ version: carrier.version, json: '{}' }));

  it('a carrier written by a newer build: nothing is written at all, and no status says created', () => {
    const boot = bootstrapCarriers(namedState('Vega'), NEWER);
    expect(boot.newer).toBe(true);
    expect(boot.status).toEqual({ ...ALL('waiting'), loot: 'refused' });
    expect(boot.refused).toEqual([{ carrier: 'loot', reason: 'target-future' }]);
    expect(boot.writes).toEqual([]);
    expect(boot.extensions).toEqual(NEWER);
  });

  it('a damaged carrier is refused alone: it is left as it is and the other three are made', () => {
    const boot = bootstrapCarriers(namedState('Vega'), DAMAGED);
    expect(boot.newer).toBe(false);
    expect(boot.status).toEqual({ ...ALL('created'), loot: 'refused' });
    expect(boot.refused).toEqual([{ carrier: 'loot', reason: 'target-corrupt' }]);
    expect(loadedKinds(boot.extensions)).toEqual({ ...ALL('loaded'), loot: 'corrupt' });
    expect(boot.writes.length).toBeGreaterThanOrEqual(3);
    for (const write of boot.writes) expect(readArc2Loot({ [write.segment]: { [write.namespace]: write.carrier } }).kind).toBe('absent');
  });

  it('a carrier that cannot be made from the state (a world mined, known by its seed alone) is refused alone', () => {
    const state = namedState('Vega');
    state.mineX = [[134, 2]];
    const boot = bootstrapCarriers(state, {});
    expect(boot.status).toEqual({ ...ALL('created'), engineering: 'refused' });
    expect(boot.refused).toEqual([{ carrier: 'engineering', reason: 'legacy-refused' }]);
    expect(loadedKinds(boot.extensions)).toEqual({ ...ALL('loaded'), engineering: 'absent' });
    // Every status that says created has its rows in the writes.
    const written: Record<string, Record<string, unknown>> = {};
    for (const write of boot.writes) (written[write.segment] ??= {})[write.namespace] = write.carrier;
    expect(loadedKinds(written as V5Extensions)).toEqual({ ...ALL('loaded'), engineering: 'absent' });
  });
});

describe('a carrier that is refused at boot', () => {
  const heardRefusals = (h: Awaited<ReturnType<typeof bootedHarness>>) => {
    const refusals: unknown[] = [];
    h.bus.on('save:carrier-refused', (event) => { refusals.push(event); });
    return refusals;
  };

  it('the other three are stored, the refusal is said once on the bus, and the page stays writable', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega', {}, (state) => { state.mineX = [[134, 2]]; });
    const h = await bootedHarness(backend);
    const refusals = heardRefusals(h);
    const watch = watchCarriers({ runtime: h.runtime, loop: h.loop, bus: h.bus });
    expect(watch.state()).toBeNull();
    await watch.ensure();
    expect(watch.state()).toMatchObject({ kind: 'created', boot: { status: { ...ALL('created'), engineering: 'refused' } } });
    expect(watch.ready('ownership')).toBe(true);
    expect(watch.ready('engineering')).toBe(false);
    expect(refusals).toEqual([{ carrier: 'engineering', reason: 'legacy-refused' }]);
    expect(loadedKinds((await stored(backend)).extensions)).toEqual({ ...ALL('loaded'), engineering: 'absent' });
    expect(h.loop.mayWrite()).toBe(true);
    expect(h.held).toEqual([]);
    await watch.ensure();
    expect(refusals.length).toBe(1);
    await h.runtime.release();

    // The next boot stores nothing, and says the same refusal again: it is never silent.
    const again = await bootedHarness(backend, 'document-b');
    const refusedAgain = heardRefusals(again);
    const revision = again.runtime.revision;
    const next = watchCarriers({ runtime: again.runtime, loop: again.loop, bus: again.bus });
    await next.ensure();
    expect(next.state()).toMatchObject({ kind: 'refused', boot: { status: { ...ALL('loaded'), engineering: 'refused' } } });
    expect(again.runtime.revision).toBe(revision);
    expect(refusedAgain).toEqual([{ carrier: 'engineering', reason: 'legacy-refused' }]);
  });

  it('a carrier written by a newer build holds the whole page: nothing is stored, and the notice says a newer build', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega', newerLoot());
    const h = await bootedHarness(backend);
    const refusals = heardRefusals(h);
    const before = (await stored(backend));
    const watch = watchCarriers({ runtime: h.runtime, loop: h.loop, bus: h.bus });
    await watch.ensure();
    expect(watch.state()).toMatchObject({ kind: 'held', boot: { newer: true, status: { ...ALL('waiting'), loot: 'refused' } } });
    expect(watch.ready('ownership')).toBe(false);
    expect(refusals).toEqual([{ carrier: 'loot', reason: 'target-future' }]);
    expect(h.gate.hold).toBe('protected-payload');
    expect(h.gate.detail).toContain('newer build');
    expect(heldNoticeFor('current', h.gate.hold, h.gate.detail)).toBe('newer');
    expect(h.held.length).toBe(1);
    expect(h.loop.mayWrite()).toBe(false);
    expect(h.runtime.diagnostics().leaseOwned).toBe(false);
    const after = await stored(backend);
    expect([after.revision, after.state, after.extensions]).toEqual([before.revision, before.state, before.extensions]);
    await expect(h.loop.request('settings')).resolves.toBe(false);
    await expect(h.loop.settle('test.add', async () => ({ kind: 'rejected' as const }))).resolves.toEqual({ kind: 'refused', reason: 'held' });
  });
});

describe('the product carriers start at boot', () => {
  it('a new game stores its four carriers in one checkpoint: one revision step', async () => {
    const h = await bootedHarness();
    const revision = h.runtime.revision;
    expect(loadedKinds((await stored(h.backend)).extensions)).toEqual(ALL('absent'));
    const started = await startCarriers({ runtime: h.runtime, loop: h.loop });
    expect(started).toMatchObject({ kind: 'created', boot: { status: ALL('created') } });
    expect(h.runtime.revision).toBe(revision + 1);
    expect(h.committed).toEqual([revision + 1]);
    expect(loadedKinds((await stored(h.backend)).extensions)).toEqual(ALL('loaded'));
    expect(loadedKinds(h.runtime.extensions)).toEqual(ALL('loaded'));
    expect(await h.backend.keys('receipts')).toEqual([]);
  });

  it('a save from milestone 3 with no ownership carrier gains one at boot and reloads equal', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    const first = await bootedHarness(backend);
    const before = await stored(backend);
    expect(loadedKinds(before.extensions).ownership).toBe('absent');
    expect((await startCarriers({ runtime: first.runtime, loop: first.loop })).kind).toBe('created');
    await first.runtime.release();
    const after = await stored(backend);
    expect(loadedKinds(after.extensions)).toEqual(ALL('loaded'));
    expect(after.state).toEqual(before.state);

    // The next boot finds them, writes nothing, and reads the same state and the same carriers.
    const second = await bootedHarness(backend, 'document-b');
    const rows = await dump(backend);
    const revision = second.runtime.revision;
    await expect(startCarriers({ runtime: second.runtime, loop: second.loop })).resolves.toMatchObject({ kind: 'ready', boot: { status: ALL('loaded') } });
    expect(second.runtime.revision).toBe(revision);
    expect(await dump(backend)).toEqual(rows);
    expect(second.live).toEqual(after.state);
    expect(second.booted.extensions).toEqual(after.extensions);
  });

  it('a page that gains the save after its boot stores the carriers then, once', async () => {
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega');
    const time = controlledClock(1_000);
    const first = await bootedHarness(backend, 'document-a', time);
    const second = await bootedHarness(backend, 'document-b', time);
    const watch = watchCarriers({ runtime: second.runtime, loop: second.loop, bus: second.bus });
    expect(second.loop.mayWrite()).toBe(false);
    await watch.ensure();
    expect(loadedKinds((await stored(backend)).extensions)).toEqual(ALL('absent'));

    await first.runtime.release();
    await second.loop.beat(); // the save is free: this page takes it, and hears that it may write
    await second.loop.flush();
    expect(second.loop.mayWrite()).toBe(true);
    expect(loadedKinds((await stored(backend)).extensions)).toEqual(ALL('loaded'));
    const revision = second.runtime.revision;
    second.bus.emit('save:authority', { writable: true });
    await watch.ensure();
    await second.loop.flush();
    expect(second.runtime.revision).toBe(revision);
  });

  it('a page that may not write stores no carrier', async () => {
    const h = await bootedHarness();
    h.gate.holdTransient('storage failed');
    const rows = await dump(h.backend);
    await expect(startCarriers({ runtime: h.runtime, loop: h.loop })).resolves.toEqual({ kind: 'not-stored', boot: null });
    expect(await dump(h.backend)).toEqual(rows);
  });

  it('a product action can be settled on the carriers once they are stored', async () => {
    const h = await bootedHarness();
    await startCarriers({ runtime: h.runtime, loop: h.loop });
    const outcome = await h.loop.settle('test.add', (runtime, durable) => runtime.commitAction({
      state: durable, operation: 'test.add', receiptKind: 'test-add', codecNow: NOW,
      derive: ({ draft, extensions }) => {
        expect(loadedKinds(extensions)).toEqual(ALL('loaded'));
        draft.essence += 1;
        return { state: draft, witness: 'add' };
      },
    }));
    expect(outcome.kind).toBe('committed');
    expect(loadedKinds((await stored(h.backend)).extensions)).toEqual(ALL('loaded'));
  });
});

describe('an ownership carrier stored by the first version of the format', () => {
  /** A save past training holding one beast, its ownership carrier marked version 1 in every part. */
  async function olderSave() {
    const state = namedState('Vega');
    state.tutDone = true;
    state.codex = [heldPage(11)];
    const made = prepareArc4OwnershipLegacyMigration({ extensions: {}, legacy: state, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
    if (made.kind !== 'prepared') throw new Error(`ownership was ${made.kind}`);
    const older: Record<string, Record<string, { version: number; json: string }>> = {};
    for (const { segment, namespace, carrier } of made.writes) {
      expect(carrier.version).toBe(2);
      (older[segment] ??= {})[namespace] = { version: 1, json: carrier.json.replace('"version":2', '"version":1') };
    }
    const backend = createMemoryBackend();
    await seedCurrentSave(backend, 'Vega', older as V5Extensions, (seeded) => { seeded.tutDone = true; seeded.codex = [heldPage(11)]; });
    return backend;
  }
  const versions = (extensions: V5Extensions): number[] => [...new Set(Object.values(extensions).flatMap((names) =>
    Object.entries(names ?? {}).filter(([name]) => name.startsWith('arc4.ownership.')).map(([, carrier]) => carrier.version)))];

  it('boots as stored, and the next action on it stores the carrier at version 2', async () => {
    const backend = await olderSave();
    const h = await bootedHarness(backend);
    await expect(startCarriers({ runtime: h.runtime, loop: h.loop })).resolves.toMatchObject({ boot: { status: { ownership: 'loaded' }, refused: [] } });
    // Reading it does not rewrite it.
    expect(versions((await stored(backend)).extensions)).toEqual([1]);

    const named = await settleScoutV1({ door: h.loop, charters: stageStarterCharterEventV1 }, { speciesId: earthId(11), codecNow: NOW });
    expect(named).toMatchObject({ kind: 'committed', facts: { scoutAfter: earthId(11) } });
    const after = await stored(backend);
    expect(versions(after.extensions)).toEqual([2]);
    expect(after.state.scoutId).toBe(earthId(11));
    expect(loadedKinds(after.extensions).ownership).toBe('loaded');
  });
});
