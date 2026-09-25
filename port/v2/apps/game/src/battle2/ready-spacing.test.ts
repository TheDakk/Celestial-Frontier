/** READY spacing + full travel (C15 2026-09-25). Codex's finding on five painted fixtures (Sturgeon facing-04, Cougar, River Otter,
 * Brown Bear, Reef Shark): wide painted bodies OVERLAPPED at their stands before anyone moved, and the run-up fell to its 0.15 floor
 * (±0.018 of the frame for the Sturgeon). Outcomes asserted on the real Sturgeon rig through the one placement pipeline and the real
 * stage: the two painted boxes at rest keep READY_GAP between them and stay inside the frame, and the attacker's run-up carries its box
 * all the way to CONTACT_GAP from the target's box. Controls: the old composition reproduces the reported overlap, and the pure rule
 * leaves an already-spaced pair byte-identical. */
import { describe, expect, it } from 'vitest';
import { composeArena } from './arena.js';
import { CONTACT_GAP, RUN_UP_MIN_FRACTION } from './choreography.js';
import { lakeArenaWorld } from './habitat-arena.js';
import { loadFitDir } from './parts-rig.fixtures.js';
import { EDGE_MARGIN, placeCombatants, READY_GAP, readySpacing } from './placement.js';
import { BattleStage, standCentreShift, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

const STURGEON = 'audits/ART_BATTLE_FOCUS_20260925/sturgeon-facing-04/fit-02/';
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; text = ''; readonly scale = { set: () => {} }; readonly anchor = { set: () => {} };
  addChild() {} removeChild() {} clear() {} rect() {} fill() {} destroy() {} }
const factory: BattleStageFactory = { container: () => new Node(), sprite: (): StageSpriteLike => new Node(), text: (t): StageTextLike => { const n = new Node(); n.text = t; return n; }, graphics: (): StageGraphicsLike => new Node() };
const TEX = { width: 1672, height: 941 }, FRAME = { width: 1024, height: 576 };

describe('ready spacing and full travel', () => {
  it('the pure rule: overlapping wide boxes spread to a READY_GAP inside the frame; a narrow frame scales the non-guardian; a spaced pair is untouched', () => {
    const wide = readySpacing(1 / 3, 2 / 3, 0.21, 0.21);
    expect(wide.centres.right - wide.centres.left - 0.42).toBeGreaterThanOrEqual(READY_GAP - 1e-12);
    expect(wide.centres.left - 0.21).toBeGreaterThanOrEqual(EDGE_MARGIN - 1e-12); expect(wide.centres.right + 0.21).toBeLessThanOrEqual(1 - EDGE_MARGIN + 1e-12);
    expect(wide.fit).toEqual({ left: 1, right: 1 });
    const huge = readySpacing(1 / 3, 2 / 3, 0.3, 0.3); expect(huge.fit.left).toBeLessThan(1); expect(huge.fit.left).toBe(huge.fit.right);
    expect(huge.centres.right - huge.centres.left - 0.3 * huge.fit.left - 0.3 * huge.fit.right).toBeGreaterThanOrEqual(READY_GAP - 1e-12);
    const guard = readySpacing(0.3, 0.82, 0.3, 0.2, { left: true, right: false }); expect(guard.fit.left).toBe(1); expect(guard.fit.right).toBeLessThan(1);
    // control: an already-spaced pair keeps its stands exactly (every ordinary matchup is unchanged)
    expect(readySpacing(1 / 3, 2 / 3, 0.1, 0.1)).toEqual({ centres: { left: 1 / 3, right: 2 / 3 }, fit: { left: 1, right: 1 } });
  });

  it('OUTCOME on the real Sturgeon (facing-04 fit-02) vs itself on a lake: a positive ready gap between the painted boxes, and the run-up reaches contact', async () => {
    const [a, b] = await Promise.all([loadFitDir(STURGEON), loadFitDir(STURGEON)]);
    const layout = composeArena({ id: 'lake', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
    const side = (x: typeof a, label: string) => ({ rig: x.rig, mass: x.card.massClass.multiplier, record: x.record as never, genome: null, label });
    const placed = placeCombatants({ contextId: 'sturgeon-gap', seed: 7, layout, worlds: { home: lakeArenaWorld(layout.groundLineY), visitor: lakeArenaWorld(layout.groundLineY) }, left: side(a, 'Sturgeon A'), right: side(b, 'Sturgeon B') });
    expect(placed.status).toBe('READY'); if (placed.status !== 'READY') return;
    const scales = placed.presentationScales ?? { left: 0, right: 0 }; expect(scales.left).toBeGreaterThan(0);
    const box = (rig: typeof a.rig, k: number, standX: number, facing: 1 | -1) => { const c = standX - standCentreShift(rig, k, FRAME.width, facing), hw = (rig.bounds.width * rig.cutout.width * k) / (2 * FRAME.width); return { l: c - hw, r: c + hw, c, hw }; };
    const L = box(a.rig, scales.left, placed.layout.stands.left.x, 1), R = box(b.rig, scales.right, placed.layout.stands.right.x, -1);
    expect(R.l - L.r, 'painted gap at rest').toBeGreaterThanOrEqual(READY_GAP - 1e-9);
    expect(L.l).toBeGreaterThanOrEqual(EDGE_MARGIN - 1e-9); expect(R.r).toBeLessThanOrEqual(1 - EDGE_MARGIN + 1e-9);
    // control: the OLD composition (box centres on the 1/3–2/3 stands) had no ready gap at these scales (it overlapped outright before the
    // motion-envelope band fit made the swimmer a little smaller — Codex's reported roots .439/.561 geometry)
    expect((2 / 3 - R.hw) - (1 / 3 + L.hw), 'old composition lacked the ready gap').toBeLessThan(READY_GAP);
    // the real stage: the attacker travels box to box, ending CONTACT_GAP short of the target (not the 0.15 floor)
    let now = 0; const stage = new BattleStage({ factory, clock: () => now, layout: placed.layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: a.rig, right: b.rig }, masses: { left: a.card.massClass.multiplier, right: b.card.massClass.multiplier }, presentationScales: scales, ...(placed.water ? { water: placed.water } : {}) });
    const ctx: TurnOutcomeContext = { A: { side: 'A', name: 'Sturgeon A', mass: a.card.massClass.multiplier, card: a.card, theme: 'tide', seed: 1 }, B: { side: 'B', name: 'Sturgeon B', mass: b.card.massClass.multiplier, card: b.card, theme: 'tide', seed: 2 },
      arena: { groundLineY: placed.layout.groundLineY, stands: placed.layout.stands }, seed: 3, anchorsForTheme: () => null, readyMs: 800, commandMs: 300 };
    const t = turnPlanInputFromTranscriptEvent({ side: 'A', an: 'Sturgeon A', dn: 'Sturgeon B', dmg: 5, crit: false, hpA: 30, hpB: 20 }, ctx, 0); if (t.kind !== 'turn') throw new Error(t.reason);
    const plan = stage.play(t.input), standDistance = placed.layout.stands.right.x - placed.layout.stands.left.x;
    expect(plan.runUp).toBeCloseTo(R.l - L.r - CONTACT_GAP, 9);
    expect(plan.runUp).toBeGreaterThan(4 * 0.01829139072847683); // Codex's measured run-up on this fixture (sturgeon-facing-04 README): ±0.0183
    expect(plan.runUp).toBeGreaterThan(RUN_UP_MIN_FRACTION * standDistance); // the travel is the box gap, not the floor
    stage.dispose();
  }, 120_000);
});

describe('the layered-reach cache (complete-input key)', () => {
  it('the same fit reuses one measurement; an individual whose timing differs gets its own key', async () => {
    const { layeredReachKey } = await import('./parts-rig.js');
    const CIVET = 'audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/';
    const a = await loadFitDir(CIVET), b = await loadFitDir(CIVET);
    expect(layeredReachKey(a.record, null, a.card)).toBe(layeredReachKey(b.record, null, b.card));
    expect(a.rig.stanceReach).toBe(b.rig.stanceReach); expect(a.rig.stanceReach).toBeGreaterThan(0);
    // control: the same archetype with a heavier mass class times its timelines differently → a different key (never a stale reuse)
    const heavy = { ...a.card, massClass: { ...a.card.massClass, multiplier: a.card.massClass.multiplier * 1.6 } } as typeof a.card;
    expect(layeredReachKey(a.record, null, heavy)).not.toBe(layeredReachKey(a.record, null, a.card));
    expect(layeredReachKey(a.record, { recordRecipeHash: a.record.recipeHash, parts: [1] }, a.card)).not.toBe(layeredReachKey(a.record, null, a.card)); // observed ≠ rest
  }, 120_000);
});

describe('band containment in motion (C25)', () => {
  it('a swimmer on a lake keeps its motion envelope (rest box + the rise its rig measured across the stage clips) inside the water band; control: the rest box alone would breach', async () => {
    const { rig, record, card } = await loadFitDir(STURGEON);
    expect(rig.tallestHeight! - rig.bounds.height, 'the rig measured a real rise (the faint tail lift)').toBeGreaterThan(0);
    const layout = composeArena({ id: 'lake', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
    const side = { rig, mass: card.massClass.multiplier, record: record as never, genome: null, label: 'Sturgeon' };
    const placed = placeCombatants({ contextId: 'band', seed: 7, layout, worlds: { home: lakeArenaWorld(layout.groundLineY), visitor: lakeArenaWorld(layout.groundLineY) }, left: side, right: { ...side, label: 'Sturgeon B' } });
    expect(placed.status).toBe('READY'); if (placed.status !== 'READY') return;
    const k = (placed.presentationScales ?? { left: 1 }).left, band = placed.habitat.stands.left.band, H = FRAME.height;
    const restTop = placed.layout.stands.left.y - (rig.extent!.up! * rig.cutout.height * k) / H, rise = ((rig.tallestHeight! - rig.bounds.height) * rig.cutout.height * k) / H;
    const bottom = restTop + (rig.bounds.height * rig.cutout.height * k) / H;
    expect(restTop - rise, 'the highest pose stays under the surface').toBeGreaterThanOrEqual(band.minY - 1e-9);
    expect(bottom).toBeLessThanOrEqual(band.maxY + 1e-9);
    // control: centring the REST box alone in the band (the old rule) leaves no room for the rise
    const restH = (rig.bounds.height * rig.cutout.height * k) / H, oldTop = (band.minY + band.maxY) / 2 - restH / 2;
    expect(oldTop - rise, 'the rest-box rule breaches with this rise').toBeLessThan(band.minY);
  }, 120_000);
});
