/* D16 parity — the Fabricator's ×5 (v1.8.9 `data-craft5`, INVENTORY row #68) — UI OUTCOME test.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. The exact shipped Main sections run here, type-stripped, with an
 * injected env: the real EngineeringPanelController construction, refreshEngineeringPanelState (the real read-model
 * projection from the durable carrier), engineeringOutcomeConverges, runEngineeringPanelAction, commitArc3EngineeringAction,
 * fabricateFixedEngineeringRecipe and fabricateEngineeringBatch. The test presses the ×5 button the real controller rendered
 * in JSDOM from the REAL model, then reads the committed v5 save back from a real memory backend (twice) and reboots a fresh
 * F4 runtime from it.
 *
 * Stubbed externals: the heartbeat (settled), toast/chips/other panels, the convergence reload scheduler, the Arc 9
 * progression refresh queue and the Inventory panel controller (its own owner). */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createMemoryBackend, readArc2Loot, readSaveV5 } from '@cf/persistence';
import { fabricationBatchOffered } from '../apps/game/src/engineering-panel.js';
import { engineeringCommittedCopy, runFabricationBatchV1 } from '../apps/game/src/fabrication-batch.js';
import {
  ENGINEERING_SECTIONS as SECTIONS, NOW, REGISTRY, boot, fixtureExtensions, fixtureSave, marsSurface, mount,
} from '../test-support/d16-engineering-harness.js';

beforeAll(() => installCaptureHooks());

async function settle(env: Record<string, unknown>): Promise<void> {
  const toast = env.toast as ReturnType<typeof vi.fn>, calls = toast.mock.calls.length;
  for (let i = 0; i < 2000 && toast.mock.calls.length === calls; i++) await new Promise((r) => setTimeout(r, 0));
  if (toast.mock.calls.length === calls) throw new Error('the engineering runner never settled');
}

async function durablePlates(backend: ReturnType<typeof createMemoryBackend>): Promise<{ plates: number; iron: number; crafts: number; receipts: number }> {
  const loaded = await readSaveV5(backend, REGISTRY, NOW);
  if (loaded.kind !== 'loaded') throw new Error(loaded.kind);
  const loot = readArc2Loot(loaded.extensions);
  if (loot.kind !== 'loaded' || loot.state.kind !== 'inventory') throw new Error('arc2 carrier');
  const plates = loot.state.stackableCounts.find((row) => row.baseId === 'plate')?.count ?? 0;
  const iron = (loaded.state.cargo.find(([id]) => id === 'Fe')?.[1] ?? 0) as number;
  return { plates, iron, crafts: loaded.state.stats.crafts ?? 0, receipts: (await backend.keys('receipts')).length };
}

const batchButton = (body: HTMLElement) => body.querySelector<HTMLButtonElement>('[data-recipe-id="plate"] [data-engineering-action="fabricate"][data-action-repeat="5"]');

describe('D16 craft ×5 — the real button, durable receipts, reboot', () => {
  it('offers ×5 only for stackable parts/components (v1: part/comp), never gear or a permanent system', () => {
    expect(fabricationBatchOffered({ category: 'part', outputKind: 'stackable' })).toBe(true);
    expect(fabricationBatchOffered({ category: 'comp', outputKind: 'stackable' })).toBe(true);
    expect(fabricationBatchOffered({ category: 'gear', outputKind: 'gear-instance' })).toBe(false);
    expect(fabricationBatchOffered({ category: 'sys', outputKind: 'permanent-system' })).toBe(false);
  });

  it('one press crafts five plates as five receipts, survives two reads and a reboot, and a second press stops at the shortage', async () => {
    const nav = marsSurface();
    const save = fixtureSave(4 * 7); // seven plates' worth of iron
    const booted = await boot(save, fixtureExtensions(save, nav));
    const before = await durablePlates(booted.backend);
    const view = mount({ save, booted, nav });
    const x5 = batchButton(view.body);
    expect(x5, 'the real model must render ×5 for the Iron Plate').not.toBeNull();
    expect(x5!.disabled).toBe(false);
    x5!.click();
    await settle(view.env);
    const after = await durablePlates(booted.backend);
    expect(after.plates - before.plates).toBe(5);
    expect(before.iron - after.iron).toBe(20);
    expect(after.receipts - before.receipts).toBe(5);
    expect(await durablePlates(booted.backend)).toEqual(after); // a second read is identical
    expect(view.toast).toHaveBeenLastCalledWith('Engineering committed', 'Fabricated ×5. Each one is its own durable record.', true);

    // reboot a fresh runtime from the durable save: the panel reads the committed carrier and still offers ×5 (8 iron left)
    await booted.runtime.release(); // the first document closes
    const reloaded = await readSaveV5(booted.backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(reloaded.kind);
    const rebooted = await boot(reloaded.state, reloaded.extensions, booted.backend, false);
    const view2 = mount({ save: reloaded.state, booted: rebooted, nav });
    const again = batchButton(view2.body);
    expect(again?.disabled).toBe(false);
    again!.click();
    await settle(view2.env);
    const final = await durablePlates(booted.backend);
    expect(final.plates - after.plates).toBe(2); // v1: `while(n5<5 && _canCraft(it5))` — stops when the iron runs out
    expect(final.iron).toBe(0);
    expect(view2.toast).toHaveBeenLastCalledWith('Engineering committed', 'Fabricated ×2. Each one is its own durable record.', true);
    // the model now refuses: no iron, so the ×5 press is disabled
    expect(batchButton(view2.body)?.disabled).toBe(true);
    view.dom.window.close(); view2.dom.window.close();
  });

  it('the single Fabricate press still crafts exactly one (the ×5 did not change the ordinary path)', async () => {
    const nav = marsSurface();
    const save = fixtureSave(40);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const view = mount({ save, booted, nav });
    view.body.querySelector<HTMLButtonElement>('[data-recipe-id="plate"] [data-engineering-action="fabricate"]:not([data-action-repeat])')!.click();
    await settle(view.env);
    expect((await durablePlates(booted.backend)).plates).toBe(1);
    view.dom.window.close();
  });

  it('negative control: a batch helper that ignores repeat crafts one, and the durable read-back catches it', async () => {
    const nav = marsSurface();
    const save = fixtureSave(40);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const mutated = SECTIONS().replace('    repeat,\n    fabricate: () => fabricateFixedEngineeringRecipe(baseId),', '    repeat: 1,\n    fabricate: () => fabricateFixedEngineeringRecipe(baseId),');
    expect(mutated).not.toBe(SECTIONS());
    const view = mount({ save, booted, nav, sections: mutated });
    batchButton(view.body)!.click();
    await settle(view.env);
    expect((await durablePlates(booted.backend)).plates).toBe(1); // ≠ 5: the outcome assertion above would fail
    view.dom.window.close();
  });

  it('negative control: without the ×5 branch in the runner the press is an ordinary single craft', async () => {
    const nav = marsSurface();
    const save = fixtureSave(40);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const needle = 'await (request.repeat === undefined ? fabricateFixedEngineeringRecipe(request.id) : fabricateEngineeringBatch(request.id, request.repeat))';
    expect(SECTIONS().split(needle)).toHaveLength(2);
    const view = mount({ save, booted, nav, sections: SECTIONS().replace(needle, 'await fabricateFixedEngineeringRecipe(request.id)') });
    batchButton(view.body)!.click();
    await settle(view.env);
    expect((await durablePlates(booted.backend)).plates).toBe(1);
    view.dom.window.close();
  });
});

describe('runFabricationBatchV1 — stop rules', () => {
  const ok = (n: number) => ({ kind: 'committed' as const, detail: `revision:${n}` });
  it('stops at the first refusal and reports the last commit; a converging outcome is returned as-is; a lone refusal stays a refusal', async () => {
    let n = 0;
    const two = await runFabricationBatchV1({ repeat: 5, fabricate: async () => (++n <= 2 ? ok(n) : { kind: 'refused' as const, detail: 'short' }), converges: () => false, released: () => false });
    expect(two).toMatchObject({ committed: 2, outcome: { kind: 'committed', detail: 'fabricated-batch:2' } });
    expect(n).toBe(3);
    n = 0;
    const stale = await runFabricationBatchV1({ repeat: 5, fabricate: async () => (++n <= 1 ? ok(n) : { kind: 'refused' as const, detail: 'stale' }), converges: (o) => o.detail === 'stale', released: () => false });
    expect(stale.outcome).toMatchObject({ kind: 'refused', detail: 'stale' });
    const none = await runFabricationBatchV1({ repeat: 5, fabricate: async () => ({ kind: 'refused' as const, detail: 'short' }), converges: () => false, released: () => false });
    expect(none).toMatchObject({ committed: 0, outcome: { kind: 'refused', detail: 'short' } });
    n = 0;
    const released = await runFabricationBatchV1({ repeat: 5, fabricate: async () => ok(++n), converges: () => false, released: () => n >= 2 });
    expect(released.committed).toBe(2);
    expect(engineeringCommittedCopy('revision:3')).toBe('The durable expedition record now reflects this action.');
  });
});
