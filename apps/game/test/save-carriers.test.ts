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
import { CARRIERS, REGISTRY, bootstrapCarriers, startCarriers, watchCarriers } from '../src/save/index';
import { bootedHarness } from './save-loop-support';
import { NOW, controlledClock, dump, namedState, seedCurrentSave } from './save-support';

const loadedKinds = (extensions: V5Extensions) => ({
  'world-identity': readWorldIdentity(extensions).kind,
  loot: readArc2Loot(extensions).kind,
  engineering: readArc3Engineering(extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER).kind,
  ownership: readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER).kind,
});
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
    expect(boot.refused).toBeNull();
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

  it('a carrier written by a newer build is refused by name, and then no carrier is written at all', () => {
    const made = bootstrapCarriers(namedState('Vega'), {});
    const newer: Record<string, Record<string, { version: number; json: string }>> = {};
    for (const write of made.writes) {
      if (readArc2Loot({ [write.segment]: { [write.namespace]: write.carrier } }).kind !== 'loaded') continue;
      newer[write.segment] = { [write.namespace]: { version: write.carrier.version + 1, json: write.carrier.json } };
    }
    expect(Object.keys(newer).length).toBe(1);
    const boot = bootstrapCarriers(namedState('Vega'), newer as V5Extensions);
    expect(boot.status.loot).toBe('refused');
    expect(boot.refused).toMatchObject({ carrier: 'loot', reason: 'target-future' });
    expect(boot.writes).toEqual([]);
    expect(boot.extensions).toEqual(newer);
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
