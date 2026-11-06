import { describe, expect, it, vi } from 'vitest';
import { buildTimeline, compileBodyCard, QUADRUPED_ACTION_IDS, QUADRUPED_ACTIONS, QUADRUPED_TEMPLATE, sampleTimeline } from '../apps/game/src/motion/index.js';
import { ACTION_OVERLAY_SCHEMA, applyActionOverlay, buildActionTimeline, MAX_OVERLAY_POSES, OverlayError, overlayFromAction, validateActionOverlay } from '../apps/game/src/motion/overlay.js';
import { civetRecord, foxRecord } from '../tools/motion-proof/fixtures.js';

const SEED = 3212817920;
const hit = () => overlayFromAction(QUADRUPED_TEMPLATE, QUADRUPED_ACTIONS.hit!);
const edit = (mutate: (o: { schema: string; templateId: string; actionId: string; poses: { t: number; ease?: string; joints: Record<string, number>; root: { dx: number; dy: number } }[]; easing?: string }) => void) => {
  const o = JSON.parse(JSON.stringify(hit())); mutate(o); return o;
};
const refused = (input: unknown, pattern: RegExp) => {
  expect(() => validateActionOverlay(input)).toThrow(OverlayError);
  expect(() => applyActionOverlay(QUADRUPED_ACTIONS, input)).toThrow(pattern);
};

describe('overlay validation (negative controls)', () => {
  it('accepts every shipped action round-tripped through overlayFromAction', () => {
    for (const id of QUADRUPED_ACTION_IDS) expect(() => validateActionOverlay(overlayFromAction(QUADRUPED_TEMPLATE, QUADRUPED_ACTIONS[id]!))).not.toThrow();
  });
  it('refuses a wrong schema, template, action or joint', () => {
    refused(null, /not an object/); refused([], /not an object/);
    refused(edit((o) => { o.schema = 'cf.motion.action-overlay/v0'; }), /schema/);
    refused(edit((o) => { o.templateId = 'no-such-template'; }), /no motion library/);
    refused(edit((o) => { o.actionId = 'melee:sting'; }), /no action "melee:sting"/);
    refused(edit((o) => { o.poses[0]!.joints.wing = 5; }), /joint "wing"/);
    refused(edit((o) => { o.poses[0]!.joints = JSON.parse('{"__proto__": 1}'); }), /joint "__proto__"/); // an own key, not a prototype write
  });
  it('refuses out-of-limit joints and root offsets, and non-finite numbers', () => {
    refused(edit((o) => { o.poses[0]!.joints.jaw = 6; }), /jaw=6° is outside \[-30, 5\]/);
    refused(edit((o) => { o.poses[0]!.joints.jaw = -30.5; }), /outside/);
    refused(edit((o) => { o.poses[0]!.joints.head = Number.NaN; }), /not a finite number/);
    refused(edit((o) => { o.poses[0]!.root.dx = 1.01; }), /exceeds ±1/);
    refused(edit((o) => { o.poses[0]!.root = { dx: 0 } as never; }), /root must be/);
    expect(() => validateActionOverlay(edit((o) => { o.poses[0]!.joints.jaw = 5; o.poses[0]!.joints.head = -35; }))).not.toThrow(); // limits are inclusive
  });
  it('refuses non-monotonic, out-of-range or unterminated t', () => {
    refused(edit((o) => { o.poses[1]!.t = o.poses[0]!.t; }), /must strictly increase/);
    refused(edit((o) => { o.poses[1]!.t = o.poses[0]!.t - 0.01; }), /must strictly increase/);
    refused(edit((o) => { o.poses[0]!.t = 0; }), /not in \(0, 1\]/);
    refused(edit((o) => { o.poses[2]!.t = 1.5; }), /not in \(0, 1\]/);
    refused(edit((o) => { o.poses[2]!.t = 0.9; }), /last pose must sit at t=1/);
  });
  it('refuses an empty or oversized pose list and unknown eases', () => {
    refused(edit((o) => { o.poses = []; }), /1\.\.16/);
    refused(edit((o) => { o.poses = Array.from({ length: MAX_OVERLAY_POSES + 1 }, (_, i) => ({ t: (i + 1) / (MAX_OVERLAY_POSES + 1), joints: {}, root: { dx: 0, dy: 0 } })); }), /1\.\.16/);
    refused(edit((o) => { o.poses[0]!.ease = 'elastic'; }), /ease "elastic"/);
    refused(edit((o) => { o.easing = 'linear'; }), /easing "linear"/);
  });
});

describe('applyActionOverlay', () => {
  it('is pure: returns a new table, leaves the input table and the shipped actions untouched', () => {
    const before = JSON.stringify(QUADRUPED_ACTIONS);
    const r = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { o.poses[0]!.joints.head = -30; }));
    expect(JSON.stringify(QUADRUPED_ACTIONS)).toBe(before);
    expect(r.table).not.toBe(QUADRUPED_ACTIONS); expect(r.table.idle).toBe(QUADRUPED_ACTIONS.idle); expect(r.table.hit).toBe(r.action);
    expect(r.action.poses[0]!.joints.head).toBe(-30); expect(QUADRUPED_ACTIONS.hit!.poses[0]!.joints.head).toBe(-20);
    expect(Object.isFrozen(r.action) && Object.isFrozen(r.action.poses[0]!.joints)).toBe(true);
    expect(r.action.family).toBe('hit'); expect(r.action.loop).toBe(false);
  });
  it('hashes deterministically, independent of joint key order; a one-degree change moves the hash', () => {
    const a = applyActionOverlay(QUADRUPED_ACTIONS, hit()), b = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { o.poses[0]!.joints = Object.fromEntries(Object.entries(o.poses[0]!.joints).reverse()); }));
    expect(a.hash).toBe(b.hash); expect(a.overlayHash).toBe(b.overlayHash); expect(a.hash).toMatch(/^[0-9a-f]{8}$/);
    const c = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { o.poses[0]!.joints.head = -21; }));
    expect(c.hash).not.toBe(a.hash); expect(c.overlayHash).not.toBe(a.overlayHash);
  });
  it('resolves easing: pose ease, then overlay easing, then the base pose at that index, then ease-out', () => {
    const base = QUADRUPED_ACTIONS.hit!;
    const r1 = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { delete o.poses[0]!.ease; }));
    expect(r1.action.poses[0]!.ease).toBe(base.poses[0]!.ease);
    const r2 = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { delete o.poses[0]!.ease; o.easing = 'sine-in-out'; }));
    expect(r2.action.poses[0]!.ease).toBe('sine-in-out'); expect(r2.action.poses[1]!.ease).toBe(base.poses[1]!.ease);
    const r3 = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { o.poses = [{ t: 0.5, joints: {}, root: { dx: 0, dy: 0 } }, { t: 0.7, joints: {}, root: { dx: 0, dy: 0 } }, { t: 0.8, joints: {}, root: { dx: 0, dy: 0 } }, { t: 1, joints: {}, root: { dx: 0, dy: 0 } }]; }));
    expect(r3.action.poses[3]!.ease).toBe('ease-out');
    expect(r3.overlay.schema).toBe(ACTION_OVERLAY_SCHEMA);
  });
  it('never reads the clock or Math.random', () => {
    const now = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock'); });
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('random'); });
    try { applyActionOverlay(QUADRUPED_ACTIONS, hit()); buildActionTimeline(compileBodyCard(civetRecord()), QUADRUPED_ACTIONS.hit!, SEED); }
    finally { now.mockRestore(); rnd.mockRestore(); }
  });
});

describe('buildActionTimeline (preview equals runtime)', () => {
  it('matches buildTimeline hash-for-hash on every shipped action for two bodies', () => {
    for (const record of [civetRecord(), foxRecord()]) {
      const card = compileBodyCard(record);
      for (const id of QUADRUPED_ACTION_IDS) {
        const runtime = buildTimeline(card, id, SEED), preview = buildActionTimeline(card, QUADRUPED_ACTIONS[id]!, SEED);
        expect(preview.hash).toBe(runtime.hash); expect(JSON.stringify(preview)).toBe(JSON.stringify(runtime));
      }
    }
  });
  it('an applied overlay changes the sampled pose exactly where it was edited', () => {
    const card = compileBodyCard(civetRecord());
    const r = applyActionOverlay(QUADRUPED_ACTIONS, edit((o) => { o.poses[0]!.joints.head = -30; }));
    const tl = buildActionTimeline(card, r.action, SEED), base = buildTimeline(card, 'hit', SEED);
    const at = tl.tracks.head![1]!.ms;
    expect(sampleTimeline(tl, at).joints.head! * 180 / Math.PI).toBeCloseTo(-30, 9);
    expect(sampleTimeline(base, at).joints.head! * 180 / Math.PI).toBeCloseTo(-20, 9);
    expect(sampleTimeline(tl, at).joints.spine).toBe(sampleTimeline(base, at).joints.spine);
    expect(tl.hash).not.toBe(base.hash); expect(tl.clamped).toEqual([]);
  });
});
