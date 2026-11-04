import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APPROACH_CAP_MS, RETURN_CAP_MS, buildTurnPlan, sampleTurn, type TurnPlan, type TurnPlanInput } from '../apps/game/src/battle2/choreography.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import { compileBodyCard } from '../apps/game/src/motion/body-card.js';
import { civetRecord } from '../tools/motion-proof/fixtures.js';

const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const ARENA = { groundLineY: 0.78, stands: { left: { x: 1 / 3, y: 0.78 }, right: { x: 2 / 3, y: 0.78 } } };
const card = compileBodyCard(civetRecord());
const input = (over: Partial<TurnPlanInput> = {}, mass = 1): TurnPlanInput => ({
  seed: 593405465, attacker: { side: 'left', mass, card, seed: 1, label: 'Civet' }, target: { side: 'right', mass: 0.85, card: null, seed: 2, label: 'Platypus' },
  delivery: 'melee', theme: 'wild', outcome: 'hit', damage: 12, effect: wild(), arena: ARENA, readyMs: 1000, commandMs: 400, ...over,
});
const maxJointDelta = (a: TurnPlan, ms: number): number => {
  const p = sampleTurn(a, ms), q = sampleTurn(a, ms + 1);
  let d = 0;
  for (const side of ['attacker', 'target'] as const) {
    const pa = p[side].pose, qa = q[side].pose;
    for (const j of new Set([...Object.keys(pa), ...Object.keys(qa)])) d = Math.max(d, Math.abs((pa[j]?.rotation ?? 0) - (qa[j]?.rotation ?? 0)), Math.abs((pa[j]?.dx ?? 0) - (qa[j]?.dx ?? 0)) * 10);
    d = Math.max(d, Math.abs(p[side].displacementX - q[side].displacementX) * 20);
  }
  return d;
};

describe('buildTurnPlan (kit §5 / §7)', () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([[0.7, 49], [1.0, 70], [1.6, 112]])('mass %s: beats are ordered, hitstop %s ms, approach and return under 0.5 s, impact = effect impactAt', (mass, stop) => {
    const plan = buildTurnPlan(input({ attacker: { side: 'left', mass, card: null, seed: 1, label: 'portrait' } })), b = plan.beats;
    expect(plan.hitstopMs).toBeCloseTo(stop, 9);
    expect(b.readyEnd).toBe(1000); expect(b.commandEnd).toBe(1400);
    expect(b.actionStart - b.commandEnd).toBeCloseTo(Math.min(APPROACH_CAP_MS, 420 * mass), 9);
    expect(b.impactAt - b.actionStart).toBeCloseTo(230 * mass, 9);
    expect(b.impactAt - plan.effect!.startMs).toBeCloseTo(plan.effect!.schedule.impactAt, 9);
    expect(plan.effect!.schedule.impactAt).toBeCloseTo(plan.effect!.schedule.hitstopAt, 9);
    expect(b.hitstopEnd - b.impactAt).toBeCloseTo(stop, 9); expect(b.flashEnd - b.impactAt).toBeCloseTo(2 * 1000 / 60 + 120, 9); expect(b.shakeEnd - b.impactAt).toBe(180); expect(b.numbersEnd - b.impactAt).toBe(510);
    expect(b.reactionStart).toBe(b.hitstopEnd); expect(b.reactionEnd - b.reactionStart).toBeCloseTo(450 * 0.85, 6); // portrait hit clip at target mass
    expect(b.returnEnd - b.actionEnd).toBeCloseTo(Math.min(RETURN_CAP_MS, 380 * mass), 9); expect(b.actionEnd).toBeGreaterThan(b.hitstopEnd);
    expect(b.idleStart).toBeGreaterThanOrEqual(Math.max(b.returnEnd, b.reactionEnd, b.numbersEnd)); expect(b.end).toBe(b.idleStart + 600);
    const order = ['ready', 'command', 'approach', 'action', 'hitstop', 'impact', 'return', 'idle'];
    expect(plan.phases.map((p) => p.phase)).toEqual(order);
    plan.phases.forEach((p, i) => { expect(p.end).toBeGreaterThan(p.start); if (i) expect(p.start).toBe(plan.phases[i - 1]!.end); });
    expect(plan.attacker.rigged).toBe(false); expect(plan.target.rigged).toBe(false); expect(plan.runUp).toBeCloseTo((1 / 3) * 0.55);
  });
  it('a rigged attacker takes its mass from the body card, and the impact frame is the timeline\'s own anticipation+strike boundary', () => {
    const plan = buildTurnPlan(input({}, 9)), tl = (plan.clips.attacker.action as { timeline: { phases: readonly (readonly [string, number])[]; hitstopMs: number; massClass: string } }).timeline;
    expect(plan.attacker.mass).toBe(card.massClass.multiplier); expect(plan.attacker.rigged).toBe(true); expect(tl.massClass).toBe('small');
    expect(plan.beats.impactAt - plan.beats.actionStart).toBeCloseTo(tl.phases[0]![1] + tl.phases[1]![1], 9);
    expect(plan.beats.impactAt - plan.effect!.startMs).toBeCloseTo(plan.effect!.schedule.impactAt, 9); expect(plan.hitstopMs).toBeCloseTo(tl.hitstopMs, 9);
  });
  it('cast delivery impacts at rise+hold+release; dodge has no hitstop and reacts before impact; miss idles', () => {
    const cast = buildTurnPlan(input({ delivery: 'cast', theme: 'fire' }, 1.2));
    expect(cast.beats.impactAt - cast.beats.actionStart).toBeCloseTo(390 * card.massClass.multiplier, 9); expect(cast.effect!.placement.travel[0]!.from).not.toEqual(cast.effect!.placement.travel[0]!.to);
    const melee = buildTurnPlan(input()); expect(melee.effect!.placement.travel[0]!.from).toEqual(melee.effect!.placement.launch.from); // held sweep
    const dodge = buildTurnPlan(input({ outcome: 'dodge' }));
    expect(dodge.hitstopMs).toBe(0); expect(dodge.beats.hitstopEnd).toBe(dodge.beats.impactAt); expect(dodge.beats.reactionStart).toBeCloseTo(dodge.beats.impactAt - 120 * 0.85, 9);
    expect(dodge.phases.map((p) => p.phase)).not.toContain('hitstop'); expect(dodge.number.text).toBe('DODGE');
    const miss = buildTurnPlan(input({ outcome: 'miss' })); expect(miss.clips.target.reaction).toBeNull(); expect(miss.number.text).toBe('MISS');
    const faint = buildTurnPlan(input({ targetFaints: true, critical: true })); expect(faint.targetFaints).toBe(true); expect(faint.number.text).toBe('12!');
    expect((faint.clips.target.reaction as { clip: { actionId: string } }).clip.actionId).toBe('faint'); expect((faint.clips.attacker.after as { timeline: { actionId: string } }).timeline.actionId).toBe('victory');
    expect(() => buildTurnPlan(input({ target: { side: 'left', mass: 1, card: null, seed: 2, label: 'x' } }))).toThrow('different sides');
    expect(buildTurnPlan(input({ effect: null })).beats.impactAt).toBe(buildTurnPlan(input()).beats.impactAt);
  });
  it('the run-up stops at contact when the arena carries the combatants\' half-widths, inside 15 %..55 % of the stand distance', () => {
    const d = 1 / 3, at = (l: number, r: number) => Math.abs(buildTurnPlan(input({ arena: { ...ARENA, halfWidths: { left: l, right: r } } })).runUp);
    expect(at(0.08, 0.08)).toBeCloseTo(d - 0.16 - 0.02, 9); expect(at(0.05, 0.05)).toBeCloseTo(0.55 * d, 9); // contact beyond the cap → cap expect(at(0.01, 0.01)).toBeCloseTo(0.55 * d, 9); expect(at(0.3, 0.3)).toBeCloseTo(0.15 * d, 9);
    expect(buildTurnPlan(input({ attacker: { side: 'right', mass: 1, card: null, seed: 1, label: 'r' }, target: { side: 'left', mass: 1, card: null, seed: 2, label: 'l' }, arena: { ...ARENA, halfWidths: { left: 0.08, right: 0.08 } } })).runUp).toBeCloseTo(-(d - 0.18), 9);
  });
  it('is deterministic and never reads a clock or Math.random (plan and sample)', () => {
    const a = buildTurnPlan(input()), b = buildTurnPlan(input());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const spies = [vi.spyOn(Date, 'now'), vi.spyOn(performance, 'now'), vi.spyOn(Math, 'random')].map((s) => s.mockImplementation(() => { throw new Error('clock read'); }));
    expect(() => Math.random()).toThrow('clock read');
    const plan = buildTurnPlan(input({ outcome: 'dodge' }, 1.6)); for (let ms = 0; ms < plan.beats.end; ms += 50) sampleTurn(plan, ms);
    expect(spies[2]).toHaveBeenCalledTimes(1); expect(spies[0]).not.toHaveBeenCalled(); expect(spies[1]).not.toHaveBeenCalled();
    expect(JSON.stringify(sampleTurn(a, 1777))).toBe(JSON.stringify(sampleTurn(b, 1777)));
  });
});

describe('sampleTurn', () => {
  const plan = buildTurnPlan(input());
  it('timing bar eases out on its last 10 % and the cursor blinks only in the command window', () => {
    expect(sampleTurn(plan, 0).timingBar).toBe(0); expect(sampleTurn(plan, 450).timingBar).toBe(0.45); expect(sampleTurn(plan, 900).timingBar).toBeCloseTo(0.9);
    expect(sampleTurn(plan, 950).timingBar).toBeGreaterThan(0.95); expect(sampleTurn(plan, 1000).timingBar).toBe(1); expect(sampleTurn(plan, 3000).timingBar).toBe(1);
    expect(sampleTurn(plan, 999).cursor.visible).toBe(false); expect(sampleTurn(plan, 1100).cursor).toEqual({ visible: true, on: true, side: 'right' }); expect(sampleTurn(plan, 1300).cursor.on).toBe(false);
    expect(sampleTurn(plan, 1399).phase).toBe('command'); expect(sampleTurn(plan, 1400).phase).toBe('approach'); expect(sampleTurn(plan, plan.beats.end).phase).toBe('done');
  });
  it('runs up, freezes both through hitstop, presents flash/shake/number, then returns and idles', () => {
    const b = plan.beats;
    expect(sampleTurn(plan, b.commandEnd).attacker.displacementX).toBe(0); expect(sampleTurn(plan, b.actionStart).attacker.displacementX).toBeCloseTo(plan.runUp); expect(sampleTurn(plan, b.returnEnd).attacker.displacementX).toBeCloseTo(0);
    expect(sampleTurn(plan, b.actionStart + 100).runUpX).toBeCloseTo(plan.runUp); expect(sampleTurn(plan, b.actionStart).target.displacementX).toBe(0);
    const atImpact = sampleTurn(plan, b.impactAt), inStop = sampleTurn(plan, b.impactAt + plan.hitstopMs / 2);
    expect(inStop.attacker.pose).toEqual(atImpact.attacker.pose); expect(inStop.target.pose).toEqual(atImpact.target.pose); // both frozen
    expect(sampleTurn(plan, b.hitstopEnd + 40).target.pose.root!.dx).toBeLessThan(atImpact.target.pose.root!.dx! - 0.01); // target recoils after hitstop
    expect(atImpact.camera.flash).toBe(1); expect(sampleTurn(plan, b.impactAt + 30).camera.flash).toBe(1); expect(sampleTurn(plan, b.impactAt + 33.4 + 60).camera.flash).toBeCloseTo(0.5, 1); expect(sampleTurn(plan, b.flashEnd).camera.flash).toBe(0);
    expect(Math.hypot(atImpact.camera.shake.x, atImpact.camera.shake.y)).toBeLessThanOrEqual(6); expect(sampleTurn(plan, b.impactAt + 20).camera.shake.x).not.toBe(0); expect(sampleTurn(plan, b.shakeEnd).camera.shake).toEqual({ x: 0, y: 0 });
    expect(sampleTurn(plan, b.impactAt - 1).numbers).toHaveLength(0);
    const n0 = atImpact.numbers[0]!, n45 = sampleTurn(plan, b.impactAt + 45).numbers[0]!, n90 = sampleTurn(plan, b.impactAt + 90).numbers[0]!, n400 = sampleTurn(plan, b.impactAt + 400).numbers[0]!;
    expect(n0).toMatchObject({ text: '12', x: 2 / 3, alpha: 1 }); expect(n0.scale).toBeCloseTo(0, 9); expect(n45.scale).toBeGreaterThan(0.5); expect(n90.scale).toBeCloseTo(1); expect(n90.y).toBeLessThan(n0.y); expect(n400.alpha).toBeLessThan(0.2); expect(sampleTurn(plan, b.numbersEnd).numbers).toHaveLength(0);
    expect(sampleTurn(plan, b.impactAt + 45).numbers[0]!.scale).toBeGreaterThan(0); // back-out overshoot territory later
    expect(sampleTurn(plan, b.impactAt).effect!.phase).toBe('impact'); expect(sampleTurn(plan, b.actionStart).effect!.phase).toBe('launch'); expect(sampleTurn(plan, b.actionStart - 1).effect!.phase).toBe('before');
    const ts = plan.effect!.schedule.travelStart, travel = sampleTurn(plan, b.actionStart + ts + 1).effect!.tracks.find((t) => t.phase === 'travel')!, later = sampleTurn(plan, b.actionStart + ts + 40).effect!.tracks.find((t) => t.phase === 'travel')!;
    expect(travel.visible).toBe(true); expect(travel.transform.alpha).toBeLessThan(0.1); expect(later.transform.alpha).toBeGreaterThan(travel.transform.alpha); // melee reveal by alpha
    expect(travel.transform.x).toBeCloseTo(1 / 3 + plan.runUp); expect(later.transform.x).toBeCloseTo(travel.transform.x); // sweep held, not slid
    expect(sampleTurn(plan, b.end - 1).phase).toBe('idle'); expect(sampleTurn(plan, b.end - 1).attacker.pose.root).toBeDefined();
  });
  it('is continuous across every phase boundary (1 ms steps, both combatants); a plan with a cut clip fails the same check', () => {
    const LIMIT = 0.15; // rad per ms: above A1's fastest secondary lash (~0.11 on a furred tail); a real cut is a 10°+ jump
    for (const p of [plan, buildTurnPlan(input({ outcome: 'dodge', targetFaints: true }, 0.7)), buildTurnPlan(input({ targetFaints: true, delivery: 'cast', theme: 'frost' }, 1.6))]) {
      for (const e of [...Object.values(p.beats), ...p.phases.map((x) => x.start)]) for (const ms of [e - 2, e - 1, e, e + 1]) expect(maxJointDelta(p, ms), `${p.delivery}/${p.outcome} @${ms}`).toBeLessThan(LIMIT);
      let worst = 0; for (let ms = 0; ms < p.beats.end; ms += 1) worst = Math.max(worst, maxJointDelta(p, ms)); expect(worst).toBeLessThan(LIMIT);
    }
    const reaction = plan.clips.target.reaction as { source: 'portrait'; clip: { dx: readonly { value: number }[] } };
    const cut = { ...reaction, clip: { ...reaction.clip, dx: reaction.clip.dx.map((k) => ({ ...k, value: k.value + 0.5 })) } } as unknown as typeof plan.clips.target.reaction; // a clip that does not start at rest
    const broken: TurnPlan = { ...plan, clips: { ...plan.clips, target: { ...plan.clips.target, reaction: cut } } };
    expect(maxJointDelta(broken, plan.beats.reactionStart - 1)).toBeGreaterThan(2 * LIMIT);
  });
  it('reduced motion returns the ready-state pose, no shake, no flash, no effect; the number is shown static', () => {
    const rm = buildTurnPlan(input({ reducedMotion: true })), ready = sampleTurn(rm, 0);
    for (const ms of [0, rm.beats.actionStart + 10, rm.beats.impactAt, rm.beats.impactAt + 20, rm.beats.end - 1]) {
      const s = sampleTurn(rm, ms);
      expect(s.attacker.pose).toEqual(ready.attacker.pose); expect(s.target.pose).toEqual(ready.target.pose); expect(s.attacker.displacementX).toBe(0); expect(s.runUpX).toBe(0);
      expect(s.camera).toEqual({ shake: { x: 0, y: 0 }, flash: 0 }); expect(s.effect).toBeNull();
    }
    expect(sampleTurn(rm, rm.beats.impactAt + 100).numbers[0]).toMatchObject({ text: '12', visible: true, scale: 1, alpha: 1 }); expect(sampleTurn(rm, 10).numbers[0]!.visible).toBe(false);
    expect(sampleTurn(rm, 500).timingBar).toBe(0.5); expect(sampleTurn(rm, rm.beats.end).phase).toBe('done');
    expect(sampleTurn(plan, plan.beats.impactAt).camera.flash).toBe(1); // the control: full motion does flash
  });
});
