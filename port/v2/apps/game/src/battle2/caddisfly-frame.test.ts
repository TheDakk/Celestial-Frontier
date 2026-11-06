// Phase5 actual-frame diagnostic: reported clipping was not reproduced.
/** Diagnostic: reproduce Caddisfly's four-turn native script and measure every
 * published mesh vertex in the actual arena. No framing repair is assumed. */
import {compileAnatomyAttack} from '../anatomy-attacks.js';
import { describe, expect, it } from 'vitest';
import { composeArena } from './arena.js';
import type { TurnPlanInput } from './choreography.js';
import { loadFitDir } from './parts-rig.fixtures.js';
import { placeCombatants } from './placement.js';
import { BattleStage, HUD, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

const FIT = 'audits/C221_PROGRAM_20261010/phase5/successors01/g2c81-21-caddisfly/fit/';
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; text = ''; scaleSet: [number, number] = [1, 1];
  readonly scale = { set: (x: number, y: number) => { this.scaleSet = [x, y]; } }; readonly anchor = { set: () => {} };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() {} rect() {} fill() {} destroy() {} }
const TEX = { width: 1672, height: 941 }, FRAME = { width: 1024, height: 576 };
/** Native four-turn script: two hits, a dodge, a critical finish. */
const ROWS = [{ side: 'A', an: 'Caddisfly', dn: 'Caddisfly', dmg: 9, crit: false, hpA: 30, hpB: 21 }, { side: 'B', an: 'Caddisfly', dn: 'Caddisfly', dmg: 6, crit: false, hpA: 24, hpB: 21 },
  { an: 'Caddisfly', dn: 'Caddisfly', dodge: true }, { side: 'A', an: 'Caddisfly', dn: 'Caddisfly', dmg: 21, crit: true, hpA: 24, hpB: 0 }] as const;
/** Top limit (frame fraction): below the timing bar and at least 4% of the frame height. */
const TOP_LIMIT = Math.max(0.04, (HUD.barY + HUD.barH) / FRAME.height);
type MeshPart = { x: number; y: number; children: { geometry?: { getBuffer(n: string): { data: Float32Array } } }[] };

describe('aerial framing: the folded-wing Caddisfly stays inside the frame through its whole battle', () => {
  it('measures the actual full-battle mesh envelope at 60 Hz', async () => {
    const [a, b] = await Promise.all([loadFitDir(FIT, undefined, 'observed'), loadFitDir(FIT, undefined, 'observed')]);
    const layout = composeArena({ id: 'earth-temperate', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
    const side = (x: typeof a, label: string) => ({ rig: x.rig, mass: x.card.massClass.multiplier, record: x.record as never, genome: null, label });
    const placed = placeCombatants({ contextId: 'battle2-proof', seed: 593405465, layout, worlds: null, left: side(a, 'Caddisfly'), right: side(b, 'Caddisfly') });
    expect(placed.status).toBe('READY'); if (placed.status !== 'READY') return;

    // the film's own placement (report.json gates.stands / gates.fit): the test measures what was filmed

    const nodes: Node[] = [], mk = () => { const n = new Node(); nodes.push(n); return n; };
    const factory: BattleStageFactory = { container: () => mk(), sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() };
    let now = 0; const stage = new BattleStage({ factory, clock: () => now, layout: placed.layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: a.rig, right: b.rig },
      masses: { left: a.card.massClass.multiplier, right: b.card.massClass.multiplier }, ...(placed.presentationScales ? { presentationScales: placed.presentationScales } : {}) });
    const ctx: TurnOutcomeContext = { A: { side: 'A', name: 'Caddisfly', mass: a.card.massClass.multiplier, card: a.card, theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Caddisfly', mass: b.card.massClass.multiplier, card: b.card, theme: 'stone', seed: 2 },
      arena: { groundLineY: placed.layout.groundLineY, stands: placed.layout.stands, halfWidths:stage.halfWidths() }, attackFor:(side,ordinal)=>{try{const actor=side==='A'?a:b,attack=compileAnatomyAttack(actor.card,'ground',ordinal);return{verb:attack.attack.verb,timeline:attack.timeline,contactMs:attack.contactMs,contactJoint:attack.attack.contactJoint};}catch{return null;}}, seed: 593405465, anchorsForTheme: () => null, readyMs: 600, commandMs: 300 };
    const root = stage.root as unknown as Node, holderOf = (rig: typeof a.rig) => nodes.find((n) => n.children.includes(rig.root as object))!;
    /** Frame-px box of every published mesh vertex of a rig (camera shake + holder + rig root + part transforms). */
    const meshBox = (rig: typeof a.rig) => { const h = holderOf(rig), r = rig.root as unknown as Node; let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity, n = 0;
      for (const p of rig.parts) { const d = p.display as unknown as MeshPart, pos = d.children[0]?.geometry?.getBuffer('aPosition').data; if (!pos) continue;
        for (let i = 0; i < pos.length; i += 2) { const x = root.x + h.x + h.scaleSet[0] * (r.x + d.x + pos[i]!), y = root.y + h.y + h.scaleSet[1] * (r.y + d.y + pos[i + 1]!); n++;
          if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x; } }
      return { top: top / FRAME.height, bottom: bottom / FRAME.height, left: left / FRAME.width, right: right / FRAME.width, n }; };
    const ord = { A: 0, B: 0 }; let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity, samples = 0;
    let offset=0;
    for (const row of ROWS) {
      const s = 'side' in row && row.side === 'B' || 'dodge' in row && row.dodge ? 'B' : 'A', t = turnPlanInputFromTranscriptEvent(row, ctx, ord[s]++); if (t.kind !== 'turn') throw new Error(t.reason);
      now = offset; const plan = stage.play(t.input as TurnPlanInput); // includes the hit reaction and the closing idle to beats.end
      for (let ms = 0; ms <= plan.beats.end + 1; ms += 1000 / 60) { now = offset+ms; stage.tick(); samples++;
        for (const rig of [a.rig, b.rig]) { const m = meshBox(rig); expect(m.n).toBeGreaterThan(100); top = Math.min(top, m.top); bottom = Math.max(bottom, m.bottom); left = Math.min(left, m.left); right = Math.max(right, m.right); } }
      offset+=plan.beats.end;
    }
    expect([a.rig.refusals(), b.rig.refusals()], 'every sample published a fresh pose').toEqual([0, 0]);
    expect(samples).toBeGreaterThan(600);
    // Assert current geometry without overwriting the committed historical diagnostic.
    expect(top).toBeGreaterThanOrEqual(0);
    expect(bottom).toBeLessThanOrEqual(1); expect(left).toBeGreaterThanOrEqual(0); expect(right).toBeLessThanOrEqual(1);


    stage.dispose();
  }, 300_000);
});
