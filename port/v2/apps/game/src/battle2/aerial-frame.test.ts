/** Aerial framing (C171 re-check, 2026-10-02). The Bat (C190 spread-wing reference, `spread-bat-contours/fit01`) was held
 * because its native film was read as placing it "mostly off the top of the frame". This test plays the SAME placement and
 * script on the real stage and measures the PUBLISHED paint-skin meshes (every vertex of every part, not landmarks or the rest
 * alpha box) at 60 Hz through all four turns: the whole posed envelope stays inside the 1024×576 frame and below the timing
 * bar (`HUD`) plus a 4% top margin at every sample. Control: the pre-containment rule (the foot point at the air band's
 * centre, the whole body not fitted) puts the same measured envelope above the frame's top edge, so the check can fail. */
import { describe, expect, it } from 'vitest';
import { composeArena } from './arena.js';
import type { TurnPlanInput } from './choreography.js';
import { loadFitDir } from './parts-rig.fixtures.js';
import { placeCombatants } from './placement.js';
import { BattleStage, HUD, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

const BAT = 'audits/C168_MEMBRANE_REFERENCES_20261002/spread-bat-contours/fit01/';
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; text = ''; scaleSet: [number, number] = [1, 1];
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: () => {} };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() {} rect() {} fill() {} destroy() {} }
const TEX = { width: 1672, height: 941 }, FRAME = { width: 1024, height: 576 };
/** The film's script (audits/BAT_C190_20261002/bat-script.json): two hits, a dodge, a critical finish. */
const ROWS = [{ side: 'A', an: 'Bat', dn: 'Bat', dmg: 9, crit: false, hpA: 30, hpB: 21 }, { side: 'B', an: 'Bat', dn: 'Bat', dmg: 6, crit: false, hpA: 24, hpB: 21 },
  { an: 'Bat', dn: 'Bat', dodge: true }, { side: 'A', an: 'Bat', dn: 'Bat', dmg: 21, crit: true, hpA: 24, hpB: 0 }] as const;
/** Top limit (frame fraction): below the timing bar and at least 4% of the frame height. */
const TOP_LIMIT = Math.max(0.04, (HUD.barY + HUD.barH) / FRAME.height);
type MeshPart = { x: number; y: number; children: { geometry?: { getBuffer(n: string): { data: Float32Array } } }[] };

describe('aerial framing: the spread-wing Bat stays inside the frame through its whole battle', () => {
  it('OUTCOME on the real Bat fit (observed supports, default arena, the film script): every published vertex inside the frame and below the HUD at every 60 Hz sample; control: the unfitted band-centre stand exits the top', async () => {
    const [a, b] = await Promise.all([loadFitDir(BAT, undefined, 'observed'), loadFitDir(BAT, undefined, 'observed')]);
    const layout = composeArena({ id: 'earth-temperate', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
    const side = (x: typeof a, label: string) => ({ rig: x.rig, mass: x.card.massClass.multiplier, record: x.record as never, genome: null, label });
    const placed = placeCombatants({ contextId: 'battle2-proof', seed: 593405465, layout, worlds: null, left: side(a, 'Bat'), right: side(b, 'Bat') });
    expect(placed.status).toBe('READY'); if (placed.status !== 'READY') return;
    expect([placed.habitat.stands.left.medium, placed.habitat.stands.right.medium]).toEqual(['air', 'air']);
    // the film's own placement (report.json gates.stands / gates.fit): the test measures what was filmed
    expect(placed.layout.stands.left.y).toBeCloseTo(0.41061609813878214, 12); expect(placed.habitat.stands.left.fit).toBeCloseTo(0.696376384272633, 12);
    const nodes: Node[] = [], mk = () => { const n = new Node(); nodes.push(n); return n; };
    const factory: BattleStageFactory = { container: () => mk(), sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() };
    let now = 0; const stage = new BattleStage({ factory, clock: () => now, layout: placed.layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: a.rig, right: b.rig },
      masses: { left: a.card.massClass.multiplier, right: b.card.massClass.multiplier }, ...(placed.presentationScales ? { presentationScales: placed.presentationScales } : {}) });
    const ctx: TurnOutcomeContext = { A: { side: 'A', name: 'Bat', mass: a.card.massClass.multiplier, card: a.card, theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Bat', mass: b.card.massClass.multiplier, card: b.card, theme: 'stone', seed: 2 },
      arena: { groundLineY: placed.layout.groundLineY, stands: placed.layout.stands }, seed: 593405465, anchorsForTheme: () => null, readyMs: 600, commandMs: 300 };
    const root = stage.root as unknown as Node, holderOf = (rig: typeof a.rig) => nodes.find((n) => n.children.includes(rig.root as object))!;
    /** Frame-px box of every published mesh vertex of a rig (camera shake + holder + rig root + part transforms). */
    const meshBox = (rig: typeof a.rig) => { const h = holderOf(rig), r = rig.root as unknown as Node; let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity, n = 0;
      for (const p of rig.parts) { const d = p.display as unknown as MeshPart, pos = d.children[0]?.geometry?.getBuffer('aPosition').data; if (!pos) continue;
        for (let i = 0; i < pos.length; i += 2) { const x = root.x + h.x + h.scaleSet[0] * (r.x + d.x + pos[i]!), y = root.y + h.y + h.scaleSet[1] * (r.y + d.y + pos[i + 1]!); n++;
          if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x; } }
      return { top: top / FRAME.height, bottom: bottom / FRAME.height, left: left / FRAME.width, right: right / FRAME.width, n }; };
    const ord = { A: 0, B: 0 }; let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity, samples = 0;
    for (const row of ROWS) {
      const s = 'side' in row && row.side === 'B' ? 'B' : 'A', t = turnPlanInputFromTranscriptEvent(row, ctx, ord[s]++); if (t.kind !== 'turn') throw new Error(t.reason);
      now = 0; const plan = stage.play(t.input as TurnPlanInput); // includes the hit reaction and the closing idle to beats.end
      for (let ms = 0; ms <= plan.beats.end + 1; ms += 1000 / 60) { now = ms; stage.tick(); samples++;
        for (const rig of [a.rig, b.rig]) { const m = meshBox(rig); expect(m.n).toBeGreaterThan(100); top = Math.min(top, m.top); bottom = Math.max(bottom, m.bottom); left = Math.min(left, m.left); right = Math.max(right, m.right); } }
    }
    expect([a.rig.refusals(), b.rig.refusals()], 'every sample published a fresh pose').toEqual([0, 0]);
    expect(samples).toBeGreaterThan(600);
    console.log(JSON.stringify({ batEnvelope: { top, bottom, left, right }, topLimit: TOP_LIMIT, samples }));
    expect(top, 'highest wing vertex stays below the timing bar and a 4% margin').toBeGreaterThanOrEqual(TOP_LIMIT);
    expect(bottom).toBeLessThanOrEqual(1); expect(left).toBeGreaterThanOrEqual(0); expect(right).toBeLessThanOrEqual(1);
    // CONTROL: the unfitted rule — the foot point at the air band's centre (vertical placement is linear in stand y) — exits the top
    const band = placed.habitat.stands.left.band, raise = placed.layout.stands.left.y - (band.minY + band.maxY) / 2;
    expect(raise).toBeGreaterThan(0);
    expect(top - raise, 'the band-centre foot rule puts the wings above the frame').toBeLessThan(0);
    stage.dispose();
  }, 300_000);
});
