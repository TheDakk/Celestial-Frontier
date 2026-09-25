/* D16 parity — the Fabricator's 📌 pinned recipe and its chip (v1.8.9 `data-pin` / `_pinChip`, save `pin`; INVENTORY row #69).
 *
 * Outcome, not code path: the real EngineeringPanelController (constructed by the exact shipped Main lines, which wire the pin
 * port) renders the 📌 from the real read model; the press runs the exact shipped `toggleRecipePin`/`refreshRecipePinChip`,
 * whose `persistView` is the real checkpoint write (the live save through the F4 runtime's commit). The test then reads the
 * committed save back (twice), reboots a fresh document from it, and checks the pin, the chip text, READY, the chip's tap and
 * the unpin. Negative controls mutate the executed Main source. */
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { projectRecipePinChipV1, sanitizeRecipePinV1 } from '../apps/game/src/recipe-pin.js';
import {
  ENGINEERING_SECTIONS, MAIN_SOURCE, boot, durableState, fixtureExtensions, fixtureSave, marsSurface, mount, reboot, section, until,
} from '../test-support/d16-engineering-harness.js';

beforeAll(() => installCaptureHooks());

const pinOf = (body: HTMLElement, id: string) => body.querySelector<HTMLButtonElement>(`[data-recipe-id="${id}"] button[data-recipe-pin="${id}"]`);
const chip = (doc: Document) => doc.getElementById('pinchip') as HTMLButtonElement | null;

async function pinScenario(sections = ENGINEERING_SECTIONS()) {
  const nav = marsSurface();
  const save = fixtureSave(1); // one iron: the Iron Plate needs four
  const booted = await boot(save, fixtureExtensions(save, nav));
  const view = mount({ save, booted, nav, sections });
  const pin = pinOf(view.body, 'plate');
  expect(pin, 'the real model renders a 📌 on the Iron Plate row').not.toBeNull();
  expect(pin!.getAttribute('aria-pressed')).toBe('false');
  pin!.click();
  const persist = view.env.persistView as { mock: { calls: unknown[] } };
  await until(() => persist.mock.calls.length > 0);
  await new Promise((r) => setTimeout(r, 0));
  return { nav, save, booted, view };
}

describe('D16 pin recipe — the real 📌, the durable pin, the chip, reboot', () => {
  it('pins, saves `pin`, shows the chip with what is missing, survives two reads and a reboot, turns READY, opens the Shipyard, and unpins', async () => {
    const { nav, booted, view } = await pinScenario();
    expect(pinOf(view.body, 'plate')!.getAttribute('aria-pressed')).toBe('true');
    const doc = view.dom.window.document;
    expect(chip(doc)?.hidden).toBe(false);
    expect(chip(doc)?.textContent).toBe('📌 Iron Plate — need 3× Iron');
    expect((await durableState(booted.backend)).pinnedRecipe).toBe('plate');
    expect((await durableState(booted.backend)).pinnedRecipe).toBe('plate');

    // reboot from the durable save with enough iron: the pin is restored and the chip reads READY
    const next = await reboot(booted);
    expect(next.state.pinnedRecipe).toBe('plate');
    next.state.cargo = [['Fe', 4]];
    const view2 = mount({ save: next.state, booted: next.booted, nav });
    expect(pinOf(view2.body, 'plate')!.getAttribute('aria-pressed')).toBe('true');
    view2.main.refreshPin();
    const doc2 = view2.dom.window.document;
    expect(chip(doc2)?.textContent).toBe('📌 Iron Plate — READY to forge ✦');
    expect(chip(doc2)?.classList.contains('ready')).toBe(true);
    chip(doc2)!.click();
    expect(view2.env.openPanel).toHaveBeenCalledWith('shipyard');

    // one pin at a time (v1): pressing it again unpins, the chip hides, and the durable pin is gone
    pinOf(view2.body, 'plate')!.click();
    await until(() => (view2.env.persistView as { mock: { calls: unknown[] } }).mock.calls.length > 0);
    await new Promise((r) => setTimeout(r, 0));
    expect(chip(doc2)?.hidden).toBe(true);
    expect(pinOf(view2.body, 'plate')!.getAttribute('aria-pressed')).toBe('false');
    expect((await durableState(next.booted.backend)).pinnedRecipe).toBeNull();
    view.dom.window.close(); view2.dom.window.close();
  });

  it('pinning another recipe replaces the pin (one at a time)', async () => {
    const { save, view } = await pinScenario();
    pinOf(view.body, 'wire')!.click();
    expect(save.pinnedRecipe).toBe('wire');
    expect(pinOf(view.body, 'plate')!.getAttribute('aria-pressed')).toBe('false');
    expect(pinOf(view.body, 'wire')!.getAttribute('aria-pressed')).toBe('true');
    view.dom.window.close();
  });

  it('the chip tracks materials from any source: updateChips refreshes it (negative-controlled)', () => {
    const chips = section('function updateChips(): void {', '\nfunction hudText(): void {');
    expect(chips).toContain('refreshRecipePinChip();');
    expect(chips.replace('refreshRecipePinChip();', '')).not.toContain('refreshRecipePinChip');
  });

  it('projection: unknown pins are dropped on load, a built permanent system hides the chip, more than three needs are elided', () => {
    expect(sanitizeRecipePinV1('not-a-recipe')).toBeNull();
    expect(sanitizeRecipePinV1(7)).toBeNull();
    expect(projectRecipePinChipV1(null, { cargo: [], items: [], stardust: 0, signatureIds: [] })).toBeNull();
    expect(projectRecipePinChipV1('jumpdrive', { cargo: [], items: [['jumpdrive', 1]], stardust: 0, signatureIds: [] })).toBeNull();
    const drive = projectRecipePinChipV1('jumpdrive', { cargo: [], items: [], stardust: 0, signatureIds: [] })!;
    expect(drive.ready).toBe(false);
    expect(drive.missing.length).toBeGreaterThan(0);
    if (drive.missing.length > 3) expect(drive.text.endsWith(' …')).toBe(true);
  });

  it('negative control: a toggle that never persists leaves no durable pin (the read-back catches it)', async () => {
    const mutated = ENGINEERING_SECTIONS().replace('  refreshRecipePinChip();\n  void persistView();', '  refreshRecipePinChip();');
    expect(mutated).not.toBe(ENGINEERING_SECTIONS());
    const nav = marsSurface();
    const save = fixtureSave(1);
    const booted = await boot(save, fixtureExtensions(save, nav));
    const view = mount({ save, booted, nav, sections: mutated });
    pinOf(view.body, 'plate')!.click();
    await new Promise((r) => setTimeout(r, 20));
    expect((await durableState(booted.backend)).pinnedRecipe).toBeNull();
    view.dom.window.close();
  });

  it('negative control: a chip fed a null pin never appears', async () => {
    const mutated = ENGINEERING_SECTIONS().replace('projectRecipePinChipV1(save.pinnedRecipe, {', 'projectRecipePinChipV1(null, {');
    expect(mutated).not.toBe(ENGINEERING_SECTIONS());
    const { view } = await pinScenario(mutated);
    expect(chip(view.dom.window.document)).toBeNull();
    view.dom.window.close();
  });

  it('the controller wires the pin port from the live save (source anchor)', () => {
    expect(MAIN_SOURCE).toContain('recipePin: { pinned: () => save.pinnedRecipe, toggle: toggleRecipePin },');
  });
});
