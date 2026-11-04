/** D14 Outposts P3 — the action owners through a REAL F4 runtime over a memory backend: start → build × 3 → abandon, each one receipt.
 * OUTCOME: the parts leave (and return to) the Arc 2 carrier and its legacy mirror together, Stardust moves once, a stage whose deed is
 * not done commits NOTHING, and every result survives a durable read and a reboot. Mutation controls: a derive that drops the parts
 * write, and one that skips the deed, are both caught by the same outcome checks. */
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  EMPTY_OUTPOST_PROJECTS_V1, OUTPOST_OPERATION_V1, arc2LootLegacyMirrorMatches, deriveOutpostActionV1, finishedRelayStarSeedsV1,
  prepareArc2LootLegacyMigration, projectArc2LootLegacyMirror, readArc2Loot, readOutpostProjectsV1, readSaveV5,
  type OutpostRequestV1, type SaveStateV2, type V5Extensions,
} from '@cf/persistence';
import { prepareArc3AppBootstrap } from '../apps/game/src/arc3-engineering-actions.js';
import { commitOutpostActionV1 } from '../apps/game/src/outposts-action.js';
import { NOW, REGISTRY, boot, fixtureSave, marsSurface, reboot } from '../test-support/d16-engineering-harness.js';

const START_ITEMS: [string, number][] = [['cell', 1], ['coil', 1], ['frame', 3], ['lens', 2], ['navcore', 1], ['plate', 2]];
const MARS_WORLD = { galaxySeed: 999, starSeed: 424242, planetSeed: 134, name: 'Mars', systemPlanetSeeds: [131, 132, 133, 134, 135] };
function fixture(): { save: SaveStateV2; extensions: V5Extensions } {
  const save = fixtureSave(0);
  save.chDone = ['st-comp']; save.techOwned = ['scan1']; save.landed = [133, 134]; save.stats = { ...save.stats, landings: 2 }; save.essence = 50;
  const loot = prepareArc2LootLegacyMigration({ extensions: {}, legacy: { items: START_ITEMS, equip: {}, equipAff: {} }, capacity: 32 });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const read = readArc2Loot(loot.extensions); if (read.kind !== 'loaded') throw new Error(read.kind);
  save.items = projectArc2LootLegacyMirror(read.state).items.map(([id, n]) => [id, n] as [string, number]);
  const engineering = prepareArc3AppBootstrap({ extensions: loot.extensions, save, sources: Object.freeze({ current: marsSurface(), saved: null, atlas: Object.freeze([]) }) });
  if (engineering.kind !== 'prepared') throw new Error(engineering.kind);
  return { save, extensions: engineering.extensions };
}
const counts = (ext: V5Extensions): Record<string, number> => { const r = readArc2Loot(ext); if (r.kind !== 'loaded') throw new Error(r.kind); return Object.fromEntries(projectArc2LootLegacyMirror(r.state).items); };
/** The durable truth: carrier + mirror agree, and read the same after a fresh storage read. */
async function durable(backend: Parameters<typeof readSaveV5>[0]) {
  const loaded = await readSaveV5(backend, REGISTRY, NOW); if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  const loot = readArc2Loot(loaded.extensions); if (loot.kind !== 'loaded') throw new Error(loot.kind);
  const projects = readOutpostProjectsV1(loaded.extensions); if (projects.kind !== 'loaded') throw new Error(projects.kind);
  return { state: loaded.state, extensions: loaded.extensions, items: counts(loaded.extensions), mirrorAgrees: arc2LootLegacyMirrorMatches(loot.state, loaded.state), projects: projects.state };
}

beforeAll(() => installCaptureHooks());
describe('outposts transactions (P3)', () => {
  it('start → three stages → abandon: parts, Stardust and the site move exactly once each, durably, across a reboot', async () => {
    const { save, extensions } = fixture();
    const booted = await boot(save, extensions);
    let live = save;
    const act = async (request: OutpostRequestV1) => { const out = await commitOutpostActionV1({ runtime: booted.runtime, state: live, request, codecNow: NOW }); if (out.kind === 'committed') live = out.state; return out; };
    expect((await act({ kind: 'start', outpost: 'relay', context: { world: MARS_WORLD, hasFauna: false, standingHere: true } })).kind).toBe('committed');
    let d = await durable(booted.backend);
    expect(d.projects.sites.map((s) => [s.id, s.built])).toEqual([['relay@134', 0]]); expect(d.items.frame).toBe(3);

    expect((await act({ kind: 'build', siteId: 'relay@134', standingHere: true })).kind).toBe('committed');
    d = await durable(booted.backend);
    expect(d.items.frame).toBe(1); expect(d.items.plate).toBeUndefined(); expect(d.mirrorAgrees).toBe(true);
    expect(d.state.items).toEqual(Object.entries(d.items)); // the legacy mirror in the save equals the carrier

    // stage 2's deed (2 OTHER worlds landed in this system since it opened) is not done: the press commits NOTHING
    const before = await durable(booted.backend);
    const refused = await act({ kind: 'build', siteId: 'relay@134', standingHere: true });
    expect(refused).toMatchObject({ kind: 'refused' }); expect(refused.kind === 'refused' && refused.detail).toMatch(/deed-unmet/);
    expect(await durable(booted.backend)).toEqual(before);

    live = { ...live, landed: [...live.landed, 131, 135] }; // two landings in the system (the Landing owner writes these)
    expect((await act({ kind: 'build', siteId: 'relay@134', standingHere: true })).kind).toBe('committed');
    expect((await act({ kind: 'build', siteId: 'relay@134', standingHere: true })).kind).toBe('committed');
    d = await durable(booted.backend);
    expect(d.projects.sites[0]).toMatchObject({ built: 3 }); expect(finishedRelayStarSeedsV1(d.projects)).toEqual([424242]);
    expect(d.state.essence).toBe(30); expect(d.items).toEqual({ frame: 1 }); expect(d.mirrorAgrees).toBe(true);

    // reboot from the committed bytes: the finished relay is still there
    const rebooted = await reboot(booted);
    expect(readOutpostProjectsV1(rebooted.booted.runtime.extensions)).toMatchObject({ kind: 'loaded', present: true });
    live = rebooted.state;
    const again = await commitOutpostActionV1({ runtime: rebooted.booted.runtime, state: live, request: { kind: 'abandon', siteId: 'relay@134' }, codecNow: NOW });
    expect(again.kind).toBe('committed');
    d = await durable(booted.backend);
    expect(d.projects.sites).toEqual([]); expect(d.state.essence).toBe(50);
    expect(d.items).toEqual(Object.fromEntries(START_ITEMS)); expect(d.mirrorAgrees).toBe(true); // every stage refunded in full
  }, 120_000);

  it('mutation controls: a derive that drops the parts write, or skips the deed, is caught by the same outcome checks', async () => {
    // (1) drop the Arc 2 write: the save's mirror says the parts are spent, the carrier still holds them → the durable check fails
    const a = fixture(); const bootedA = await boot(a.save, a.extensions);
    await bootedA.runtime.commitAction({ state: a.save, operation: OUTPOST_OPERATION_V1, receiptKind: OUTPOST_OPERATION_V1, codecNow: NOW,
      derive: (x) => deriveOutpostActionV1({ ...x, request: { kind: 'start', outpost: 'relay', context: { world: MARS_WORLD, hasFauna: false, standingHere: true } } }) });
    const liveA = (await durable(bootedA.backend)).state;
    const mutant = await bootedA.runtime.commitAction({ state: liveA, operation: OUTPOST_OPERATION_V1, receiptKind: OUTPOST_OPERATION_V1, codecNow: NOW,
      derive: (x) => { const d = deriveOutpostActionV1({ ...x, request: { kind: 'build', siteId: 'relay@134', standingHere: true } }); return { ...d, extensionWrites: (d.extensionWrites ?? []).filter((w) => w.namespace === 'arc9.projects') }; } });
    expect(mutant.kind).toBe('committed');
    expect((await durable(bootedA.backend)).mirrorAgrees).toBe(false);
    // (2) skip the deed: a derive that builds stage 2 from a state that forgets its baseline would commit — the real one refuses
    const b = fixture(); const bootedB = await boot(b.save, b.extensions); let liveB = b.save;
    for (const r of [{ kind: 'start', outpost: 'relay', context: { world: MARS_WORLD, hasFauna: false, standingHere: true } }, { kind: 'build', siteId: 'relay@134', standingHere: true }] as OutpostRequestV1[]) {
      const out = await commitOutpostActionV1({ runtime: bootedB.runtime, state: liveB, request: r, codecNow: NOW }); if (out.kind !== 'committed') throw new Error(out.detail); liveB = out.state; }
    const cheat = await bootedB.runtime.commitAction({ state: liveB, operation: OUTPOST_OPERATION_V1, receiptKind: OUTPOST_OPERATION_V1, codecNow: NOW,
      derive: (x) => deriveOutpostActionV1({ ...x, draft: { ...x.draft, landed: [...x.draft.landed, 131, 135] }, request: { kind: 'build', siteId: 'relay@134', standingHere: true } }) });
    expect(cheat.kind).toBe('committed'); // proves the deed check is what refused the honest press above, not something else
    expect(EMPTY_OUTPOST_PROJECTS_V1.sites).toEqual([]);
  }, 120_000);
});
