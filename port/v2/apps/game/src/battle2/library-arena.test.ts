/** The painted LIBRARY in the arena (2026-09-24, Nick: "I really want to get this going"): every archetype that ships a
 * card also FIGHTS — its real paint-skin rig, loaded exactly as the study loads it, plays seeded turns on the real stage
 * at 30 Hz as ATTACKER (with its own compiled anatomy attack in its own medium) and as TARGET: zero rig refusals, no
 * exception reaches tick. The list is the card registry (one source), so a new archetype is tested the day it ships. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack } from '../anatomy-attacks.js';
import { resolvePhysicalHabitat } from '../battle-habitat.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { CARD_ARCHETYPES } from '../morph/card-archetypes.js';
import { COMBATANT_WIDTH_FRACTION_MAX, composeArena } from './arena.js';
import { BAND_FILL, defaultArenaWorld, selectHabitatArena } from './habitat-arena.js';
import type { ArenaWorld } from '../battle-habitat.js';
import type { TurnAttack, TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { REPO_ROOT, loadFitDir } from './parts-rig.fixtures.js';
import { BattleStage, WATER_BANDS, combatantPresentation, standCentreShift, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; text = ''; readonly scale = { set: () => {} }; readonly anchor = { set: () => {} };
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() {} rect() {} fill() {} destroy() { this.destroyed = true; } }
const factory: BattleStageFactory = { container: () => new Node(), sprite: (): StageSpriteLike => new Node(), text: (t): StageTextLike => { const n = new Node(); n.text = t; return n; }, graphics: (): StageGraphicsLike => new Node() };
const rigFactory = { container: (): RigContainerLike => new Node(), portraitSprite: (): RigSpriteLike => new Node() };
const portraitRig = (): BattleRigV1 => createPortraitRig({ templateId: 'portrait', recipeHash: 'thumb:platypus', cutout: { width: 132, height: 132 }, alphaBox: { x: 20, y: 30, width: 90, height: 96 }, factory: rigFactory });
const FRAME = { width: 1024, height: 576 }, TEX: EffectTextureLike = { width: 1672, height: 941 };
const layout = composeArena({ id: 'library', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);
const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
const ctx = (me: 'A' | 'B', name: string, mass: number, card: TurnOutcomeContext['A']['card'], attackFor: TurnOutcomeContext['attackFor'] | undefined, seed: number): TurnOutcomeContext => {
  const mine = { side: me, name, mass, card, theme: 'wild', seed: 1 } as const, other = { side: me === 'A' ? 'B' : 'A', name: 'Platypus', mass: 0.85, card: null, theme: 'tide', seed: 2 } as const;
  return { A: (me === 'A' ? mine : other) as TurnOutcomeContext['A'], B: (me === 'B' ? mine : other) as TurnOutcomeContext['B'], arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed, anchorsForTheme: (t) => (t === 'wild' ? wild() : null), readyMs: 800, commandMs: 300, ...(attackFor ? { attackFor } : {}) };
};
const turn = (c: TurnOutcomeContext, row: Record<string, unknown>, i: number): TurnPlanInput => { const t = turnPlanInputFromTranscriptEvent(row, c, i); if (t.kind !== 'turn') throw new Error(t.reason); return t.input; };
const fitDirOf = (shippedDir: string): string => (JSON.parse(readFileSync(new URL(shippedDir + 'SOURCE.json', REPO_ROOT), 'utf8')) as { fitDir: string }).fitDir;

interface Row { earthName: string; template: string; medium: string; attack: string; ticks: number; refusals: number; last: string | null; error: string | null }
describe('the painted library in the arena', () => {
  it('every archetype with a card fights: as ATTACKER with its own anatomy attack and as TARGET, zero rig refusals at 30 Hz', async () => {
    const rows: Row[] = [];
    for (const a of CARD_ARCHETYPES) {
      const row: Row = { earthName: a.earthName, template: '', medium: '', attack: '', ticks: 0, refusals: 0, last: null, error: null }; rows.push(row);
      try {
        const { rig, record, card } = await loadFitDir(fitDirOf(a.dir)); row.template = card.template.id;
        const medium = resolvePhysicalHabitat(record as never).preferred; row.medium = medium;
        let attackError: string | null = null;
        const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; try { const r = compileAnatomyAttack(card, medium, ordinal); row.attack = `${r.attack.verb} (${r.attack.contactJoint})`; return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; } catch (e) { attackError = e instanceof Error ? e.message : String(e); return null; } };
        const mass = card.massClass.multiplier;
        // as ATTACKER: attacks, is hit, its target dodges, wins, faints
        let now = 0; let stage = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: mass, right: 0.85 } });
        const asA = [{ side: 'A', an: a.earthName, dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, { side: 'B', an: 'Platypus', dn: a.earthName, dmg: 4, crit: true, hpA: 26, hpB: 20 }, { an: a.earthName, dn: 'Platypus', dodge: true }, { side: 'A', an: a.earthName, dn: 'Platypus', dmg: 20, crit: true, hpA: 26, hpB: 0 }, { side: 'B', an: 'Platypus', dn: a.earthName, dmg: 30, crit: false, hpA: 0, hpB: 0 }];
        for (const [i, r] of asA.entries()) { const plan = stage.play(turn(ctx('A', a.earthName, mass, card, attackFor, (0xA11 + i * 7919) >>> 0), r, i)); for (let ms = 0; ms <= plan.beats.end; ms += 1000 / 30) { now = ms; if (!stage.tick()) throw new Error('no frame'); row.ticks++; } }
        stage.dispose();
        if (attackError) row.attack = 'REFUSED: ' + attackError;
        row.refusals += rig.refusals(); row.last = rig.lastRefusal();
        // as TARGET — a FRESH rig: disposing a stage disposes its rigs (a reused rig is an instrument bug, found on the first run)
        const target = (await loadFitDir(fitDirOf(a.dir))).rig;
        now = 0; stage = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: portraitRig(), right: target }, masses: { left: 0.85, right: mass } });
        const asB = [{ side: 'A', an: 'Platypus', dn: a.earthName, dmg: 7, crit: false, hpA: 30, hpB: 20 }, { an: a.earthName, dn: 'Platypus', dodge: true }, { side: 'A', an: 'Platypus', dn: a.earthName, dmg: 20, crit: false, hpA: 30, hpB: 0 }];
        for (const [i, r] of asB.entries()) { const plan = stage.play(turn(ctx('B', a.earthName, mass, card, undefined, (0xB22 + i * 7919) >>> 0), r, i)); for (let ms = 0; ms <= plan.beats.end; ms += 1000 / 30) { now = ms; if (!stage.tick()) throw new Error('no frame'); row.ticks++; } }
        stage.dispose();
        row.refusals += target.refusals(); row.last = target.lastRefusal() ?? row.last;
      } catch (e) { row.error = e instanceof Error ? e.message.slice(0, 300) : String(e); }
    }
    const report = rows.map((r) => `${r.earthName.padEnd(16)} ${r.template.padEnd(15)} ${r.medium.padEnd(6)} ticks ${String(r.ticks).padStart(4)} refusals ${r.refusals}  attack: ${r.attack || '-'}${r.error ? '  ERROR: ' + r.error : ''}${r.refusals ? '  last: ' + (r.last ?? '').slice(0, 160) : ''}`).join('\n');
    console.log('\n' + report);
    expect(rows.length).toBe(CARD_ARCHETYPES.length);
    for (const r of rows) { expect(r.error, `${r.earthName}\n${report}`).toBeNull(); expect(r.refusals, `${r.earthName}\n${report}`).toBe(0); expect(r.ticks, r.earthName).toBeGreaterThan(300); expect(r.attack.startsWith('REFUSED') ? r.attack : 'ok', r.earthName).toBe('ok'); }
  }, 900_000);
  it('every archetype is SIZED to its place: no body wider than its arena share; a flyer fits the air band; a swimmer is refused on the dry arena and fits the water band on a lake world — whole painted box inside, scaled never clipped', async () => {
    const lake: ArenaWorld = { ...defaultArenaWorld(layout.groundLineY), key: 'lake', liquid: 'water', surfaceWater: true, cardHash: 'lake-1' };
    const report: string[] = []; let flyers = 0, swimmers = 0;
    for (const a of CARD_ARCHETYPES) {
      const { rig, record, card } = await loadFitDir(fitDirOf(a.dir)), p = combatantPresentation(rig, card.massClass.multiplier, FRAME);
      const widthFraction = (p.scale * rig.bounds.width * rig.cutout.width) / FRAME.width;
      expect(widthFraction, a.earthName + ' width').toBeLessThanOrEqual(COMBATANT_WIDTH_FRACTION_MAX + 1e-9);
      const vs = (worlds: { home: ArenaWorld; visitor: ArenaWorld } | null) => selectHabitatArena({ contextId: 'lib', seed: 7, round: 0, kind: 'wild', worlds, groundLineY: layout.groundLineY, fitToBand: true,
        left: { record: record as never, genome: null, label: a.earthName, painted: p }, right: { record: null, genome: null, label: 'Portrait', painted: { height: 0.4, footBelowCentre: 0.05 } } });
      const medium = resolvePhysicalHabitat(record as never).preferred, dry = vs(null);
      if (medium === 'water' && !resolvePhysicalHabitat(record as never).allowed.includes('ground')) {
        expect(dry.status, a.earthName + ' on the dry arena').toBe('UNSUPPORTED'); swimmers++;
        const wet = vs({ home: lake, visitor: lake }); expect(wet.status, a.earthName + ' on a lake').toBe('READY'); if (wet.status !== 'READY') continue;
        const st = wet.stands.left, h = p.height * st.fit, centre = st.y - p.footBelowCentre * st.fit;
        expect(st.medium).toBe('water'); expect(centre - h / 2).toBeGreaterThanOrEqual(st.band.minY - 1e-9); expect(centre + h / 2).toBeLessThanOrEqual(st.band.maxY + 1e-9); expect(h).toBeLessThanOrEqual((st.band.maxY - st.band.minY) * BAND_FILL + 1e-9);
        report.push(`${a.earthName}: water fit ${st.fit.toFixed(2)}`); continue;
      }
      expect(dry.status, a.earthName + ' on the dry arena').toBe('READY'); if (dry.status !== 'READY') continue;
      const st = dry.stands.left;
      if (st.medium === 'air') { flyers++; const h = p.height * st.fit, centre = st.y - p.footBelowCentre * st.fit; expect(centre - h / 2).toBeGreaterThanOrEqual(st.band.minY - 1e-9); expect(centre + h / 2).toBeLessThanOrEqual(st.band.maxY + 1e-9); }
      report.push(`${a.earthName}: ${st.medium} fit ${st.fit.toFixed(2)} width ${widthFraction.toFixed(2)}${p.capped ? ' (capped)' : ''}`);
    }
    console.log('\n' + report.join('\n'));
    expect(flyers).toBeGreaterThanOrEqual(2); expect(swimmers).toBeGreaterThanOrEqual(3); // Eagle + Fruit Bat; Salmon, Starfish, Octopus — the branches are exercised
  }, 300_000);
  it('the WET arena: water behind the swimmer and above the mid plate, the dry foreground hidden, moving with the mid plate, destroyed on dispose — and without it the stage is exactly as before', async () => {
    const salmonDir = CARD_ARCHETYPES.find((a) => a.earthName === 'Salmon')!.dir;
    const build = async (water: boolean) => { const { rig, card } = await loadFitDir(fitDirOf(salmonDir)); const nodes: Node[] = []; const mk = () => { const n = new Node(); nodes.push(n); return n; };
      const f: BattleStageFactory = { container: mk, sprite: (): StageSpriteLike => mk(), text: (t): StageTextLike => { const n = mk(); n.text = t; return n; }, graphics: (): StageGraphicsLike => mk() };
      let now = 0; const stage = new BattleStage({ factory: f, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: card.massClass.multiplier, right: 0.85 }, ...(water ? { water: { surfaceY: 0.52 } } : {}) });
      return { stage, nodes, rig, card, setNow: (ms: number) => { now = ms; } }; };
    const dry = await build(false), wet = await build(true);
    const kids = (st: BattleStage) => (st.root as unknown as Node).children as Node[];
    expect(kids(wet.stage).length).toBe(kids(dry.stage).length + 1); // exactly one extra layer
    const order = kids(wet.stage), water = order[2]!; // far, mid, WATER, …
    const wi = 2; expect(kids(dry.stage)[2]).not.toBe(water);
    const holderIndex = order.findIndex((n) => n.children.includes(wet.rig.root as object)); expect(holderIndex).toBeGreaterThan(wi); // behind the swimmer
    const nearWet = order.at(-5) as Node, nearDry = kids(dry.stage).at(-5) as Node; // near plate: before flash, bar, cursor, number
    expect(nearWet.visible).toBe(false); expect(nearDry.visible).toBe(true);
    // drawn as WATER_BANDS depth bands + the surface line, three frames wide
    expect(water).toBeDefined();
    // it moves with the mid plate during a run-up
    const plan = wet.stage.play(turn(ctx('A', 'Salmon', wet.card.massClass.multiplier, wet.card, undefined, 7), { side: 'A', an: 'Salmon', dn: 'Platypus', dmg: 5, crit: false, hpA: 30, hpB: 25 }, 0));
    let moved = false; for (let ms = 0; ms <= plan.beats.end; ms += 1000 / 30) { wet.setNow(ms); wet.stage.tick(); const mid = order[1]!, w2 = order[2]!; if (w2.x !== 0) moved = true; expect(w2.x).toBeCloseTo(mid.x - (layout.plates.find((p) => p.id === 'mid')!.x), 9); }
    expect(moved).toBe(true);
    wet.stage.dispose(); expect(order[2]!.destroyed).toBe(true);
    expect(WATER_BANDS.length).toBeGreaterThanOrEqual(8);
    dry.stage.dispose();
    expect(() => new BattleStage({ factory, clock: () => 0, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: portraitRig(), right: portraitRig() }, masses: { left: 1, right: 1 }, water: { surfaceY: 1.2 } })).toThrow(/surfaceY/);
  }, 300_000);
  it('every archetype stands INSIDE the frame on BOTH sides: its painted box is centred on its stand, not hung off its foot (the picker filmed a right-hand Python whose tail left the frame) — the uncentred control reproduces that exit', async () => {
    const EDGE = 0.01, out: string[] = [], uncentredExits: string[] = [];
    for (const a of CARD_ARCHETYPES) {
      const { rig, card } = await loadFitDir(fitDirOf(a.dir)), p = combatantPresentation(rig, card.massClass.multiplier, FRAME);
      expect(rig.extent, a.earthName + ' extent').toBeDefined();
      for (const [side, facing] of [['left', 1], ['right', -1]] as const) {
        const box = (shift: number) => { const x = layout.stands[side].x + shift, px = (u: number) => (u * rig.cutout.width * p.scale) / FRAME.width;
          // the stage mirrors the right side (holder scale.x = facing·k): source [foot − L, foot + R] lands on [x − L, x + R] facing +1, [x − R, x + L] facing −1
          const L = px(rig.extent!.left), R = px(rig.extent!.right);
          return facing === 1 ? { x0: x - L, x1: x + R } : { x0: x - R, x1: x + L }; };
        const centred = box(standCentreShift(rig, p.scale, FRAME.width, facing)), raw = box(0);
        if (centred.x0 < EDGE || centred.x1 > 1 - EDGE) out.push(`${a.earthName} ${side}: ${centred.x0.toFixed(3)}–${centred.x1.toFixed(3)}`);
        expect((centred.x0 + centred.x1) / 2, `${a.earthName} ${side} centred`).toBeCloseTo(layout.stands[side].x, 9);
        if (raw.x0 < 0 || raw.x1 > 1) uncentredExits.push(`${a.earthName} ${side}`);
      }
    }
    expect(out).toEqual([]);
    expect(uncentredExits).toContain('Python right'); // the reported geometry, reproduced by the uncentred placement
  }, 300_000);
});
