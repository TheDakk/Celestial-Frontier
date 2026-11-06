import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ACTIONS_BY_TEMPLATE, actionsFor, buildTimeline, checkBudget, compileBodyCard, compileBodyCardOrFallback, EASES, FAMILY_TEMPLATE_IDS, FAMILY_TEMPLATES, fnv1a, idlePeriodMs,
  isMotionFallback, MASS_CLASS, MEDIUM_RULES, MotionCompileError, PLANT_TEMPLATE_IDS, QUADRUPED_ACTION_IDS, QUADRUPED_ACTIONS, QUADRUPED_TEMPLATE, resolveActionId, resolveTemplate,
  sampleTimeline, TEMPLATE_BY_FAMILY, templateGaits, templateIdForFamily, templateMelees, type BodyCard, type ResolvedAnatomyRecord } from '../apps/game/src/motion/index.js';
import { civetRecord, syntheticGenome, syntheticRecord } from '../tools/motion-proof/fixtures.js';
import { SYNTHETIC_IDS, syntheticGenomeOf, syntheticRecordOf } from '../tools/motion-proof/synthetic.js';

const SEED = 0xA11;
const card = (id: string): BodyCard => compileBodyCard(syntheticRecord(id), syntheticGenome(id));
const refusal = (fn: () => unknown): MotionCompileError => { try { fn(); } catch (e) { if (e instanceof MotionCompileError) return e; throw e; } throw new Error('expected a MotionCompileError'); };
const FAUNA = FAMILY_TEMPLATE_IDS.filter((id) => !PLANT_TEMPLATE_IDS.includes(id));
const KIT_SECTION_4 = ['quadruped', 'hopper', 'biped-bird', 'fish', 'insect', 'arachnid', 'serpent', 'myriapod', 'radial', 'cephalopod', 'flyer-membrane', 'primate', 'plant-woody', 'plant-herb'];
const A11_SCOPE = ['quadruped', ...FAMILY_TEMPLATE_IDS];

describe('A11 registry', () => {
  it('registers every kit §4 template (A11 nine + B3 four); nothing in §4 falls to the whole-portrait fallback any more; a non-kit name still does', () => {
    for (const id of A11_SCOPE) expect(isMotionFallback(resolveTemplate(id)), id).toBe(false);
    expect(KIT_SECTION_4.filter((id) => !A11_SCOPE.includes(id))).toEqual([]);
    expect([...KIT_SECTION_4].sort()).toEqual([...A11_SCOPE].sort());
    for (const id of ['monotreme', 'plasma']) { const f = resolveTemplate(id); expect(isMotionFallback(f) && f.reason, id).toMatch(new RegExp(id)); }
    expect(isMotionFallback(resolveTemplate('gastropod'))).toBe(false); // Codex specialized roster template (6a58e40e)
  });
  it('keeps every joint inventory closed: limits for every joint, parents declared first, chains and body axis inside the inventory, ≤ 32 bones', () => {
    for (const t of Object.values(FAMILY_TEMPLATES)) {
      expect(Object.keys(t.limitsDeg).sort()).toEqual([...t.joints].sort());
      expect(new Set(t.joints).size).toBe(t.joints.length);
      const seen = new Set(['root']);
      for (const [child, parent] of t.graph) { expect(seen.has(parent), `${t.id}: ${child}←${parent}`).toBe(true); seen.add(child); }
      for (const c of t.secondaryChains) { expect(t.joints).toContain(c.driver); for (const j of c.joints) expect(t.joints, c.id).toContain(j); expect(c.kind).toBeDefined(); }
      for (const j of t.bodyAxis ?? []) expect(t.joints).toContain(j);
      expect(t.graph.length).toBeLessThanOrEqual(32);
    }
    expect(FAMILY_TEMPLATES.hopper.joints).toEqual(QUADRUPED_TEMPLATE.joints); // a hopper record IS a quadruped record
    expect(FAMILY_TEMPLATES.hopper.limitsDeg.hindFarKnee).toEqual({ min: -110, max: 110 });
  });
  it('quadruped data is unchanged (snapshot of the committed template and action JSON)', () => {
    const t = JSON.stringify(QUADRUPED_TEMPLATE), a = JSON.stringify(QUADRUPED_ACTIONS);
    expect([fnv1a(t), t.length]).toEqual(['1b2c6e05', 2928]);
    expect([fnv1a(a), a.length]).toEqual(['477b9ea0', 15155]);
    expect(QUADRUPED_ACTION_IDS).toEqual(['idle', 'alert', 'approach:walk', 'approach:trot', 'approach:gallop', 'approach:hop', 'melee:bite', 'melee:claw', 'melee:gore', 'melee:tail', 'melee:headbutt', 'cast', 'hit', 'dodge', 'faint', 'victory', 'tame', 'feed']);
    // The family registry carries the base library plus Codex's melee:kick row (N6 Civet sentinel exercises it).
    expect(ACTIONS_BY_TEMPLATE.quadruped).toMatchObject(QUADRUPED_ACTIONS);
    expect(Object.keys(ACTIONS_BY_TEMPLATE.quadruped!).sort()).toEqual([...QUADRUPED_ACTION_IDS, 'melee:kick'].sort());
  });
  it('routes the painter families named in the A11 brief', () => {
    const want: Record<string, string> = { bird: 'biped-bird', fish: 'fish', insect: 'insect', arachnid: 'arachnid', snake: 'serpent', serpent: 'serpent', jelly: 'radial', radial: 'radial',
      frog: 'hopper', hopper: 'hopper', tree: 'plant-woody', shrub: 'plant-woody', vine: 'plant-woody', cane: 'plant-woody', fern: 'plant-herb', grass: 'plant-herb', rosette: 'plant-herb', seaweed: 'plant-herb', fungal: 'plant-herb', mammal: 'quadruped', reptile: 'quadruped' };
    // Broad marine/crust/sessile labels are not anatomical inventories (Codex 6a58e40e): they need a resolved body plan, never borrowed bones.
    for (const broad of ['marine', 'crust', 'sessile']) expect(templateIdForFamily(broad), broad).toBeNull();
    for (const [f, t] of Object.entries(want)) expect(templateIdForFamily(f), f).toBe(t);
    expect(templateIdForFamily('Bird')).toBe('biped-bird');
    for (const [f, t] of Object.entries({ ceph: 'cephalopod', cephalopod: 'cephalopod', myriapod: 'myriapod', centipede: 'myriapod', millipede: 'myriapod', bat: 'flyer-membrane', primate: 'primate' })) expect(templateIdForFamily(f), f).toBe(t);
    for (const f of ['plasma', 'monotreme']) expect(templateIdForFamily(f), f).toBeNull();
    expect(templateIdForFamily('gastropod')).toBe('gastropod'); // Codex specialized roster template (6a58e40e)
    for (const t of Object.values(TEMPLATE_BY_FAMILY)) expect(isMotionFallback(resolveTemplate(t))).toBe(false);
  });
});

describe('A11 synthetic fixtures and body cards', () => {
  afterEach(() => vi.restoreAllMocks());
  it('fixture JSON on disk equals the generator (neither can drift alone) and is labelled synthetic', () => {
    expect([...SYNTHETIC_IDS]).toEqual([...FAMILY_TEMPLATE_IDS]);
    for (const id of SYNTHETIC_IDS) {
      expect(JSON.stringify(syntheticRecord(id))).toBe(JSON.stringify(syntheticRecordOf(id)));
      expect(JSON.stringify(syntheticGenome(id))).toBe(JSON.stringify(syntheticGenomeOf(id)));
      expect(syntheticRecord(id).identity.ownerId).toMatch(/^synthetic/); expect(syntheticRecord(id).geometry.cutoutAssetHash).toMatch(/synthetic/);
    }
  });
  it('compiles every template inside its envelope, within budget, with the family-specific gait and weapons, reading materials record-first', () => {
    const want: Record<string, [gait: string, weapons: string[], material: string, parts: number]> = {
      hopper: ['hop', ['bite', 'claw'], 'slick', 30], 'biped-bird': ['flight', ['peck', 'claw'], 'feathered', 18], fish: ['swim', ['bite'], 'scaled', 12], insect: ['crawl', ['bite'], 'chitinous', 20],
      serpent: ['slither', ['bite', 'constrict'], 'scaled', 12], arachnid: ['scuttle', ['sting', 'bite'], 'chitinous', 21], radial: ['drift', ['sting'], 'translucent', 20], 'plant-woody': ['none', [], 'warty', 10], 'plant-herb': ['none', [], 'slick', 16],
      myriapod: ['crawl', ['bite', 'sting'], 'chitinous', 28], cephalopod: ['jet', ['constrict', 'bite'], 'slick', 31], 'flyer-membrane': ['flight', ['bite', 'claw'], 'furred', 21], primate: ['walk', ['claw', 'bite'], 'furred', 21],
    };
    for (const id of FAMILY_TEMPLATE_IDS) {
      const c = card(id), [gait, weapons, material, parts] = want[id]!;
      expect(c.template.id).toBe(id); expect(c.bounds.inside, id).toBe(true); expect(c.parts).toHaveLength(parts); expect(c.parts.length + 1).toBe(FAMILY_TEMPLATES[id].joints.length);
      expect(c.locomotion.templateGait, id).toBe(gait); expect(c.weapons, id).toEqual(weapons); expect(c.materials.body).toBe(material); expect(c.materials.fronds).toBe(material);
      expect(checkBudget(c).ok, id).toBe(true); expect(c.bodyLength).toBeGreaterThan(0.03);
      expect(c.secondaryParts.map((s) => s.kind)).toEqual(FAMILY_TEMPLATES[id].secondaryChains.map((s) => s.kind));
      expect(JSON.stringify(c)).toBe(JSON.stringify(compileBodyCard(structuredClone(syntheticRecord(id)), syntheticGenome(id))));
    }
    expect(card('fish').realm).toBe('aquatic'); expect(card('biped-bird').realm).toBe('aerial'); expect(card('hopper').realm).toBe('amphibious');
    expect(card('cephalopod').realm).toBe('aquatic'); expect(card('flyer-membrane').realm).toBe('aerial'); expect(card('primate').parts.filter((p) => p.group === 'arms')).toHaveLength(6); expect(card('cephalopod').parts.filter((p) => p.group === 'fins')).toHaveLength(2);
  });
  it('routes by family when the record omits template, refuses a family/template disagreement and an unroutable family', () => {
    const { template: _t, ...noTemplate } = syntheticRecord('fish');
    expect(compileBodyCard(noTemplate as unknown as ResolvedAnatomyRecord, syntheticGenome('fish')).template.id).toBe('fish');
    const e = refusal(() => compileBodyCard({ ...syntheticRecord('fish'), family: 'bird' }));
    expect(e.reason).toBe('family-mismatch'); expect(e.message).toMatch(/"bird" routes to biped-bird/);
    const u = refusal(() => compileBodyCard({ ...syntheticRecord('fish'), family: 'plasma' }));
    expect(u.reason).toBe('unsupported-template'); expect(u.fallback).toMatchObject({ kind: 'whole-portrait', templateId: 'plasma' });
    expect(compileBodyCardOrFallback({ ...syntheticRecord('fish'), family: 'plasma' })).toMatchObject({ kind: 'whole-portrait' });
    expect(refusal(() => compileBodyCard({ ...syntheticRecord('fish'), family: 'gastropod' })).reason).toBe('family-mismatch'); // gastropod is a known specialized template
  });
  it('refuses a landmark set that does not match the joint inventory, by name, in both directions', () => {
    const missing = refusal(() => { const r = syntheticRecord('insect'); const { legMidNearFoot: _x, ...landmarks } = r.landmarks; return compileBodyCard({ ...r, landmarks }); });
    expect(missing.reason).toBe('missing-landmarks'); expect(missing.message).toMatch(/legMidNearFoot.*insect inventory: 21 joints/);
    const extra = refusal(() => { const r = syntheticRecord('serpent'); return compileBodyCard({ ...r, landmarks: { ...r.landmarks, seg10: [0.01, 0.7], tailFan: [0.5, 0.5] } }); });
    expect(extra.reason).toBe('joint-inventory'); expect(extra.message).toMatch(/\[seg10, tailFan\] are not in the serpent joint inventory/);
  });
  it('negative control per template: a wrong-family record relabelled with this template is refused', () => {
    for (let i = 0; i < FAMILY_TEMPLATE_IDS.length; i++) {
      const id = FAMILY_TEMPLATE_IDS[i]!, other = FAMILY_TEMPLATE_IDS[(i + 1) % FAMILY_TEMPLATE_IDS.length]!;
      const r: ResolvedAnatomyRecord = { ...syntheticRecord(other), kind: id, template: { id, version: 1 }, family: syntheticRecord(id).family as string };
      const e = refusal(() => compileBodyCard(r, syntheticGenome(id)));
      expect(['missing-landmarks', 'joint-inventory'], `${id} accepted ${other} landmarks`).toContain(e.reason);
    }
    // The quadruped record relabelled as a hopper is the one legal cross-family case (shared inventory); its kind must still agree.
    const asHopper = compileBodyCard({ ...civetRecord(), kind: 'hopper', template: { id: 'hopper', version: 1 } });
    expect(asHopper.template.id).toBe('hopper'); expect(asHopper.locomotion.templateGait).toBe('hop');
    expect(refusal(() => compileBodyCard({ ...civetRecord(), template: { id: 'hopper', version: 1 } })).reason).toBe('unsupported-template');
  });
});

describe('A11 action libraries', () => {
  afterEach(() => vi.restoreAllMocks());
  it('offers the §4 verb set with the family gaits and weapons named in the brief; plants get sway/disturb/harvest/grow', () => {
    // body/tail rows are Codex's anatomy-attack rows (anatomy-attacks.ts) merged into the family libraries; kick on the bird is its N6 row.
    const want: Record<string, [gaits: string[], melees: string[]]> = { hopper: [['hop'], ['kick', 'bite']], 'biped-bird': [['walk', 'flight'], ['peck', 'claw', 'kick']], fish: [['swim'], ['bite', 'body', 'tail']], insect: [['crawl', 'flight'], ['mandible', 'body']],
      serpent: [['slither'], ['strike', 'constrict']], arachnid: [['scuttle'], ['sting', 'bite', 'body']], radial: [['drift', 'pulse'], ['sting-arms', 'body']],
      myriapod: [['crawl'], ['mandible', 'sting', 'body']], cephalopod: [['jet', 'crawl'], ['lash', 'bite']], 'flyer-membrane': [['flight', 'crawl'], ['bite', 'claw']], primate: [['walk', 'climb'], ['punch', 'bite']] };
    for (const id of FAUNA) {
      expect(templateGaits(id), id).toEqual(want[id]![0]); expect(templateMelees(id), id).toEqual(want[id]![1]);
      for (const v of ['idle', 'alert', 'cast', 'hit', 'dodge', 'faint', 'victory', 'tame', 'feed']) expect(actionsFor(id)![v], `${id}/${v}`).toBeDefined();
      expect(actionsFor(id)!.idle!.loop).toBe(true);
    }
    for (const id of PLANT_TEMPLATE_IDS) { expect(Object.keys(actionsFor(id)!)).toEqual(['sway', 'disturb', 'harvest', 'grow']); expect(actionsFor(id)!.sway!.loop).toBe(true); }
    expect(actionsFor('plasma')).toBeUndefined();
    expect(Object.keys(actionsFor('gastropod') ?? {})).toContain('idle'); // Codex specialized roster template ships its own library (6a58e40e)
  });
  it('every key pose of every action names only inventory joints, uses frozen eases, sits inside the joint limits at its extremes, and is deterministic', () => {
    for (const id of FAMILY_TEMPLATE_IDS) {
      const c = card(id), t = FAMILY_TEMPLATES[id];
      for (const [actionId, action] of Object.entries(actionsFor(id)!)) {
        let prevT = 0;
        for (const pose of action.poses) {
          expect(EASES).toContain(pose.ease); expect(pose.t).toBeGreaterThan(prevT - 1e-12); expect(pose.t).toBeLessThanOrEqual(1); prevT = pose.t;
          for (const [j, deg] of Object.entries(pose.joints)) {
            expect(t.joints, `${id}/${actionId}: unknown joint "${j}"`).toContain(j);
            const lim = t.limitsDeg[j]!; expect(deg, `${id}/${actionId}/${j}`).toBeGreaterThanOrEqual(lim.min); expect(deg, `${id}/${actionId}/${j}`).toBeLessThanOrEqual(lim.max);
          }
        }
        const tl = buildTimeline(c, actionId, SEED), again = buildTimeline(compileBodyCard(syntheticRecord(id), syntheticGenome(id)), actionId, SEED);
        expect(tl.clamped, `${id}/${actionId}`).toEqual([]); expect(JSON.stringify(tl)).toBe(JSON.stringify(again)); expect(tl.hash).toBe(again.hash);
        expect(Object.keys(tl.tracks)).toHaveLength(t.joints.length);
        expect(tl.bodyMs).toBeCloseTo(tl.phases.reduce((s, [, ms]) => s + ms, 0), 9);
        const mid = sampleTimeline(tl, tl.bodyMs * 0.5); for (const v of Object.values(mid.joints)) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
  it('never reads the clock while compiling or building a family template (negative control: the spies throw)', () => {
    const d = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('clock'); }); vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('clock'); });
    expect(() => Date.now()).toThrow('clock');
    for (const id of FAMILY_TEMPLATE_IDS) expect(() => sampleTimeline(buildTimeline(card(id), Object.keys(actionsFor(id)!)[0]!, SEED), 123.4)).not.toThrow();
    expect(d).toHaveBeenCalledTimes(1);
  });
  it('resolves approach and melee per family (aliases: insect bite→mandible, serpent bite→strike, radial sting→sting-arms, hopper claw→kick)', () => {
    const want: Record<string, [string, string]> = { hopper: ['approach:hop', 'melee:bite'], 'biped-bird': ['approach:flight', 'melee:peck'], fish: ['approach:swim', 'melee:bite'], insect: ['approach:crawl', 'melee:mandible'],
      serpent: ['approach:slither', 'melee:strike'], arachnid: ['approach:scuttle', 'melee:sting'], radial: ['approach:drift', 'melee:sting-arms'],
      myriapod: ['approach:crawl', 'melee:mandible'], cephalopod: ['approach:jet', 'melee:lash'], 'flyer-membrane': ['approach:flight', 'melee:bite'], primate: ['approach:walk', 'melee:punch'] };
    for (const id of FAUNA) { expect(resolveActionId(card(id), 'approach').id, id).toBe(want[id]![0]); expect(resolveActionId(card(id), 'melee').id, id).toBe(want[id]![1]); }
    const kicker: BodyCard = { ...card('hopper'), weapons: ['claw'] }; expect(resolveActionId(kicker, 'melee')).toEqual({ id: 'melee:kick', note: null });
    const unarmed: BodyCard = { ...card('fish'), weapons: ['gore'] }; expect(() => resolveActionId(unarmed, 'melee')).toThrow(/no admitted fish melee for weapons \[gore\]/); // no silent bite substitution (Codex 6a58e40e)
    expect(buildTimeline(card('serpent'), 'melee', SEED).hitstopMs).toBe(70);
    expect(() => buildTimeline(card('plant-herb'), 'melee', SEED)).toThrow(/no admitted plant-herb melee/);
  });
  it('strong readable poses: hopper kick fires the hind chain −105/+95, bird peck drives the neck +35/+30 at 0.30 BL, serpent strike opens the jaw 42 at 0.48 BL, arachnid sting curls the abdomen 62/68', () => {
    const deg = (tl: ReturnType<typeof buildTimeline>, j: string, i: number): number => tl.tracks[j]![i]!.value * 180 / Math.PI;
    const kick = buildTimeline({ ...card('hopper'), weapons: ['claw'] }, 'melee', SEED); expect(deg(kick, 'hindNearKnee', 3)).toBeCloseTo(-105); expect(deg(kick, 'hindNearAnkle', 3)).toBeCloseTo(95);
    const peck = buildTimeline(card('biped-bird'), 'melee', SEED); expect(deg(peck, 'neck0', 3)).toBeCloseTo(35); expect(deg(peck, 'neck1', 3)).toBeCloseTo(30); expect(peck.root.dx[3]!.value).toBe(0.30);
    const strike = buildTimeline(card('serpent'), 'melee', SEED); expect(deg(strike, 'jaw', 3)).toBeCloseTo(-42); expect(strike.root.dx[3]!.value).toBe(0.48);
    const sting = buildTimeline(card('arachnid'), 'melee', SEED); expect(deg(sting, 'abdomen', 3)).toBeCloseTo(62); expect(deg(sting, 'sting', 3)).toBeCloseTo(68);
    const hop = buildTimeline(card('hopper'), 'approach', SEED); expect(hop.root.dy[2]!.value).toBe(-0.18); expect(deg(hop, 'hindFarKnee', 2)).toBeCloseTo(-70);
    const flight = buildTimeline(card('biped-bird'), 'approach', SEED); expect(deg(flight, 'wingFarRoot', 1)).toBeCloseTo(65); expect(deg(flight, 'wingFarRoot', 3)).toBeCloseTo(-45);
    // B3 strong poses: cephalopod lash whips the front pair −80 at the tip, bat bite opens the jaw 35, primate punch drives the near shoulder −75 at 0.36 BL, myriapod forcipules open 38.
    const lash = buildTimeline(card('cephalopod'), 'melee', SEED); expect(deg(lash, 'arm3Seg2', 3)).toBeCloseTo(-80); expect(deg(lash, 'arm4Seg1', 3)).toBeCloseTo(60);
    const batBite = buildTimeline(card('flyer-membrane'), 'melee', SEED); expect(deg(batBite, 'jaw', 3)).toBeCloseTo(-35); expect(deg(batBite, 'neck', 3)).toBeCloseTo(30);
    const punch = buildTimeline(card('primate'), 'melee', SEED); expect(deg(punch, 'armNearShoulder', 3)).toBeCloseTo(-75); expect(punch.root.dx[3]!.value).toBe(0.36);
    const forcipule = buildTimeline(card('myriapod'), 'melee', SEED); expect(deg(forcipule, 'mandible', 3)).toBeCloseTo(-38);
    const batFlight = buildTimeline(card('flyer-membrane'), 'approach', SEED); expect(deg(batFlight, 'wingFarRoot', 1)).toBeCloseTo(70); expect(deg(batFlight, 'wingFarRoot', 3)).toBeCloseTo(-50);
  });
  it('idle (and plant sway) periods are seeded, non-integer and differ across two seeds for every template; mass scaling stays inside 0.6x..2.0x', () => {
    for (const id of FAMILY_TEMPLATE_IDS) {
      const loopId = PLANT_TEMPLATE_IDS.includes(id) ? 'sway' : 'idle';
      const a = buildTimeline(card(id), loopId, SEED), b = buildTimeline(card(id), loopId, SEED + 1);
      expect(a.loop).toBe(true); expect(Number.isInteger(a.bodyMs), id).toBe(false); expect(Number.isInteger(b.bodyMs)).toBe(false); expect(a.bodyMs).not.toBe(b.bodyMs);
      expect(a.bodyMs).toBeCloseTo(idlePeriodMs(SEED, 1), 9);
      const medium = card(id);
      for (const [name, k] of Object.entries(MASS_CLASS)) {
        const c: BodyCard = { ...medium, massClass: { name: name as keyof typeof MASS_CLASS, multiplier: k } };
        const tl = buildTimeline(c, 'hit' in actionsFor(id)! ? 'hit' : 'disturb', SEED), base = buildTimeline(medium, 'hit' in actionsFor(id)! ? 'hit' : 'disturb', SEED);
        const ratio = tl.bodyMs / base.bodyMs; expect(ratio).toBeGreaterThanOrEqual(0.6 - 1e-9); expect(ratio).toBeLessThanOrEqual(2.0 + 1e-9); expect(ratio).toBeCloseTo(Math.min(2, Math.max(0.6, k)), 9);
      }
    }
  });
});

describe('A11 secondary motion by chain kind and medium (kit §6)', () => {
  it('feathered wings flutter, fins lag 50 ms with aquatic damping, antennae quiver rigidly, fronds lag per segment, the bell wobbles; quadruped tracks carry no kind', () => {
    const wing = buildTimeline(card('biped-bird'), 'hit', SEED).secondary.find((s) => s.partId === 'wingFar')!;
    expect(wing).toMatchObject({ kind: 'wing', flutterMs: 60, lagMs: 60, rigid: false }); expect(wing.damping).toBeCloseTo(0.5);
    const fins = buildTimeline(card('fish'), 'hit', SEED).secondary;
    expect(fins.map((s) => [s.kind, s.lagMs, s.overshoot])).toEqual([['fin', 50, 0.1], ['fin', 50, 0.1], ['fin', 50, 0.1], ['fin', 50, 0.1]]); expect(fins[0]!.damping).toBeCloseTo(0.8 * 0.75);
    const antenna = buildTimeline(card('insect'), 'alert', SEED).secondary.find((s) => s.partId === 'antennaFar')!;
    expect(antenna).toMatchObject({ kind: 'antenna', quiverMs: 40, rigid: true, lagMs: 0, flutterMs: 0 });
    const fronds = buildTimeline(card('plant-herb'), 'sway', SEED).secondary.filter((s) => s.partId === 'stem0');
    expect(fronds.map((s) => [s.kind, s.lagMs])).toEqual([['frond', 50], ['frond', 100], ['frond', 150], ['frond', 200]]);
    const bell = buildTimeline(card('radial'), 'hit', SEED).secondary.find((s) => s.partId === 'bell')!;
    expect(bell).toMatchObject({ kind: 'bell', wobbleMs: 120 }); expect(bell.damping).toBeCloseTo(0.35 * 0.75);
    expect(MEDIUM_RULES.aquatic).toEqual({ damping: 0.75, bobMs: 0, drift: true }); expect(MEDIUM_RULES.aerial.bobMs).toBe(1400);
    const membrane = buildTimeline(card('flyer-membrane'), 'hit', SEED).secondary.filter((s) => s.partId === 'wingFar');
    expect(membrane.map((s) => [s.kind, s.lagMs, s.flutterMs])).toEqual([['membrane', 40, 0], ['membrane', 80, 0], ['membrane', 120, 0], ['membrane', 160, 0]]); // furred: no feather flutter
    const tentacle = buildTimeline(card('cephalopod'), 'hit', SEED).secondary.filter((s) => s.partId === 'arm0');
    expect(tentacle.map((s) => [s.kind, s.lagMs])).toEqual([['tentacle', 70], ['tentacle', 140], ['tentacle', 210]]); expect(tentacle[0]!.overshoot).toBeCloseTo(0.2); expect(tentacle[0]!.damping).toBeCloseTo(0.6 * 0.75);
    const civet = buildTimeline(compileBodyCard(civetRecord()), 'hit', SEED);
    expect(civet.secondary.every((s) => !('kind' in s) && !('flutterMs' in s))).toBe(true);
    expect(civet.secondary.filter((s) => s.partId === 'tail').map((s) => s.lagMs)).toEqual([80, 160, 240, 320]);
  });
});

describe('A11 pose sheet renders any template', () => {
  it('writes a labelled SVG for a plant and a fauna template from the synthetic fixtures', () => {
    const out = mkdtempSync(path.join(tmpdir(), 'a11-sheet-'));
    for (const [id, rows] of [['plant-herb', ['sway', 'disturb']], ['fish', ['idle', 'approach:swim', 'melee:bite', 'hit']]] as const) {
      execFileSync(process.execPath, ['tools/motion-proof/pose-sheet.mjs', `tools/motion-proof/fixtures/${id}.synthetic.landmarks.json`, out, `--genome=tools/motion-proof/fixtures/${id}.synthetic.genome.json`, `--name=${id}`], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
      const svg = readFileSync(path.join(out, `${id}.pose-sheet.svg`), 'utf8');
      expect(svg).toMatch(/SYNTHETIC FIXTURE RECORD/);
      for (const r of rows) expect(svg, `${id}/${r}`).toContain(`${r} — body`);
      expect((svg.match(/<line /g) ?? []).length).toBeGreaterThan(FAMILY_TEMPLATES[id].graph.length * 5);
    }
  });
});
