/** The painted LIBRARY in the arena (2026-09-24, Nick: "I really want to get this going"): every archetype that ships a
 * card also FIGHTS — its real paint-skin rig, loaded exactly as the study loads it, plays seeded turns on the real stage
 * at 30 Hz as ATTACKER (with its own compiled anatomy attack in its own medium) and as TARGET: zero rig refusals, no
 * exception reaches tick. The list is the card registry (one source), so a new archetype is tested the day it ships. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAnatomyAttack, type WeaponDeclaration } from '../anatomy-attacks.js';
import { resolvePhysicalHabitat } from '../battle-habitat.js';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../effects/anchors.js';
import type { EffectTextureLike } from '../effects/pixi-adapter.js';
import { CARD_ARCHETYPES } from '../morph/card-archetypes.js';
import { BATTLE2_PARTS_FITS } from '../battle2-archetypes.js';
import { COMBATANT_WIDTH_FRACTION_MAX, composeArena } from './arena.js';
import { BAND_FILL, defaultArenaWorld, selectHabitatArena } from './habitat-arena.js';
import type { ArenaWorld } from '../battle-habitat.js';
import { NUMBER_RISE, NUMBER_TOP_MIN, type TurnAttack, type TurnPlanInput } from './choreography.js';
import { createPortraitRig } from './fallback.js';
import type { BattleRigV1, RigContainerLike, RigSpriteLike } from './fixture-rig.js';
import { REPO_ROOT, loadFitDir } from './parts-rig.fixtures.js';
import { BattleStage, SHORE_FADE, WATER_BANDS, combatantPresentation, standCentreShift, turnPlanInputFromTranscriptEvent, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext } from './stage.js';

class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; text = ''; readonly scale = { set: () => {} }; readonly anchor = { set: () => {} }; rects: [number, number, number, number][] = []; fills: number[] = [];
  children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); } clear() { this.rects = []; this.fills = []; } rect(x: number, y: number, w: number, h: number) { this.rects.push([x, y, w, h]); } fill(st: { color: number }) { this.fills.push(st.color); } destroy() { this.destroyed = true; } }
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
/** The fit's hash-bound painter weapon declaration, read from the same generated list the study reads (C15: the Jellyfish's sting). */
const declarationOf = (earthName: string): WeaponDeclaration | undefined => { const d = BATTLE2_PARTS_FITS.find((f) => f.earthName === earthName)?.weaponDeclaration; return d ? JSON.parse(readFileSync(new URL('audits/' + d.slice('../'.length), REPO_ROOT), 'utf8')) as WeaponDeclaration : undefined; };
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
        const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; try { const r = compileAnatomyAttack(card, medium, ordinal, undefined, declarationOf(a.earthName)); row.attack = `${r.attack.verb} (${r.attack.contactJoint})`; return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; } catch (e) { attackError = e instanceof Error ? e.message : String(e); return null; } };
        const mass = card.massClass.multiplier;
        // control: a DECLARED weapon is what admits the attack — the same card without its declaration has no admitted move
        if (declarationOf(a.earthName)) expect(() => compileAnatomyAttack(card, medium, 0), `${a.earthName} without its declaration`).toThrow(/no admitted move|conditional|not declared/);
        // as ATTACKER: attacks, is hit, its target dodges, wins, faints
        let now = 0; let stage = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: mass, right: 0.85 } });
        const asA = [{ side: 'A', an: a.earthName, dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, { side: 'B', an: 'Platypus', dn: a.earthName, dmg: 4, crit: true, hpA: 26, hpB: 20 }, { an: a.earthName, dn: 'Platypus', dodge: true }, { side: 'A', an: a.earthName, dn: 'Platypus', dmg: 20, crit: true, hpA: 26, hpB: 0 }, { side: 'B', an: 'Platypus', dn: a.earthName, dmg: 30, crit: false, hpA: 0, hpB: 0 }];
        for (const [i, r] of asA.entries()) { now = 0; const plan = stage.play(turn(ctx('A', a.earthName, mass, card, attackFor, (0xA11 + i * 7919) >>> 0), r, i)); for (let ms = 0; ms < plan.beats.end; ms += 1000 / 30) { now = ms; if (!stage.tick()) throw new Error('no frame'); row.ticks++; } now = plan.beats.end; if (!stage.tick()?.done) throw new Error('turn never reached its end'); row.ticks++; }
        stage.dispose();
        if (attackError) row.attack = 'REFUSED: ' + attackError;
        row.refusals += rig.refusals(); row.last = rig.lastRefusal();
        // as TARGET — a FRESH rig: disposing a stage disposes its rigs (a reused rig is an instrument bug, found on the first run)
        const target = (await loadFitDir(fitDirOf(a.dir))).rig;
        now = 0; stage = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: portraitRig(), right: target }, masses: { left: 0.85, right: mass } });
        const asB = [{ side: 'A', an: 'Platypus', dn: a.earthName, dmg: 7, crit: false, hpA: 30, hpB: 20 }, { an: a.earthName, dn: 'Platypus', dodge: true }, { side: 'A', an: 'Platypus', dn: a.earthName, dmg: 20, crit: false, hpA: 30, hpB: 0 }];
        for (const [i, r] of asB.entries()) { now = 0; const plan = stage.play(turn(ctx('B', a.earthName, mass, card, undefined, (0xB22 + i * 7919) >>> 0), r, i)); for (let ms = 0; ms < plan.beats.end; ms += 1000 / 30) { now = ms; if (!stage.tick()) throw new Error('no frame'); row.ticks++; } now = plan.beats.end; if (!stage.tick()?.done) throw new Error('turn never reached its end'); row.ticks++; }
        stage.dispose();
        row.refusals += target.refusals(); row.last = target.lastRefusal() ?? row.last;
      } catch (e) { row.error = e instanceof Error ? e.message.slice(0, 300) : String(e); }
    }
    const report = rows.map((r) => `${r.earthName.padEnd(16)} ${r.template.padEnd(15)} ${r.medium.padEnd(6)} ticks ${String(r.ticks).padStart(4)} refusals ${r.refusals}  attack: ${r.attack || '-'}${r.error ? '  ERROR: ' + r.error : ''}${r.refusals ? '  last: ' + (r.last ?? '').slice(0, 160) : ''}`).join('\n');
    console.log('\n' + report);
    expect(rows.length).toBe(CARD_ARCHETYPES.length);
    for (const r of rows) { expect(r.error, `${r.earthName}\n${report}`).toBeNull(); expect(r.refusals, `${r.earthName}\n${report}`).toBe(0); expect(r.ticks, r.earthName).toBeGreaterThan(300); expect(r.attack, `${r.earthName}: an anatomy attack must be compiled and staged`).toMatch(/^\S+ \(\S+\)$/); }
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
  it('SCALE SWEEP: every archetype attacks through a full bout at 0.85×, 1× and 1.15× its default presentation scale (the stage cadence follows the scale, so a latent skin fold can hide at one size) — refusals reported per archetype and scale', async () => {
    const found: string[] = [], lines: string[] = [];
    for (const a of CARD_ARCHETYPES) for (const k of [0.85, 1, 1.15]) {
      const { rig, card } = await loadFitDir(fitDirOf(a.dir)), mass = card.massClass.multiplier, medium = resolvePhysicalHabitat((await loadFitDir(fitDirOf(a.dir))).record as never).preferred;
      const base = combatantPresentation(rig, mass, FRAME, layout.stands.left.y).scale;
      const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { if (side !== 'A') return null; try { const r = compileAnatomyAttack(card, medium, ordinal); return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; } catch { return null; } };
      let now = 0; const stage = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: rig, right: portraitRig() }, masses: { left: mass, right: 0.85 }, presentationScales: { left: base * k, right: combatantPresentation(portraitRig(), 0.85, FRAME, layout.stands.right.y).scale } });
      const bout = [{ side: 'A', an: a.earthName, dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, { side: 'B', an: 'Platypus', dn: a.earthName, dmg: 4, crit: true, hpA: 26, hpB: 20 }, { an: a.earthName, dn: 'Platypus', dodge: true }, { side: 'A', an: a.earthName, dn: 'Platypus', dmg: 20, crit: true, hpA: 26, hpB: 0 }];
      for (const [i, r] of bout.entries()) { now = 0; const plan = stage.play(turn(ctx('A', a.earthName, mass, card, attackFor, (0xC33 + i * 7919) >>> 0), r, i)); for (let ms = 0; ms < plan.beats.end; ms += 1000 / 30) { now = ms; stage.tick(); } now = plan.beats.end; if (!stage.tick()?.done) throw new Error('turn never reached its end'); }
      const n = rig.refusals(); if (n) found.push(`${a.earthName} ×${k}: ${n} (${(rig.lastRefusal() ?? '').slice(0, 90)})`); lines.push(`${a.earthName} ×${k}: ${n}`); stage.dispose();
    }
    console.log('\nSWEEP\n' + found.join('\n'));
    expect(found).toEqual([]);
    expect(lines.length).toBe(CARD_ARCHETYPES.length * 3); // every archetype at every scale was run
  }, 900_000);
  it('WET arena DRAWING: a full lake from surfaceY to the floor, three frames wide in the depth bands; a swimmer facing a GROUND fighter gets its own half and the ground fighter keeps its floor (review 2026-09-24: the land fighter stood underwater)', async () => {
    const H = FRAME.height, w = FRAME.width, surfaceY = 0.52;
    const mk = async (water: { surfaceY: number; side?: 'left' | 'right' }) => { const salmon = await loadFitDir(fitDirOf(CARD_ARCHETYPES.find((a) => a.earthName === 'Salmon')!.dir)); const nodes: Node[] = [];
      const f: BattleStageFactory = { container: () => { const n = new Node(); nodes.push(n); return n; }, sprite: (): StageSpriteLike => { const n = new Node(); nodes.push(n); return n; }, text: (t): StageTextLike => { const n = new Node(); n.text = t; nodes.push(n); return n; }, graphics: (): StageGraphicsLike => { const n = new Node(); nodes.push(n); return n; } };
      const stage = new BattleStage({ factory: f, clock: () => 0, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: salmon.rig, right: portraitRig() }, masses: { left: salmon.card.massClass.multiplier, right: 0.85 }, water });
      const kids = (stage.root as unknown as Node).children as Node[]; return { stage, water: kids[2]!, near: kids.find((n, i) => i > 2 && n.fills.length === 0 && n.rects.length === 0 && n !== kids[2] && kids.indexOf(n) === kids.length - 5)!, kids }; };
    const full = await mk({ surfaceY });
    expect(full.water.rects.length).toBe(WATER_BANDS.length + 1); expect(full.water.fills.slice(0, WATER_BANDS.length)).toEqual(WATER_BANDS.map((b) => b.color));
    expect(full.water.rects[0]![1]).toBeCloseTo(surfaceY * H, 9); const last = full.water.rects[WATER_BANDS.length - 1]!; expect(last[1] + last[3]).toBeGreaterThanOrEqual(H);
    for (const r of full.water.rects.slice(0, WATER_BANDS.length)) { expect(r[0]).toBe(-w); expect(r[2]).toBe(3 * w); }
    expect(full.kids.at(-5)!.visible).toBe(false); // the dry foreground hides under a full lake
    const half = await mk({ surfaceY, side: 'left' });
    for (const r of half.water.rects.slice(0, WATER_BANDS.length + 1)) { expect(r[0]).toBe(-w); expect(r[0] + r[2]).toBeCloseTo(0.5 * w, 9); } // the swimmer's half only
    const shore = half.water.rects.slice(WATER_BANDS.length + 1); expect(shore.length).toBeGreaterThan(0); expect(Math.max(...shore.map((r) => r[0] + r[2]))).toBeLessThanOrEqual((0.5 + SHORE_FADE) * w + 1); // a soft shore, short of the ground fighter
    expect(half.kids.at(-5)!.visible).toBe(true); // the ground fighter's foreground stays
    const groundFootX = layout.stands.right.x * w; expect(half.water.rects.every((r) => groundFootX < r[0] || groundFootX > r[0] + r[2])).toBe(true);
    full.stage.dispose(); half.stage.dispose();
  }, 300_000);
  it('a FLYER target takes the hit at its body and its cursor stays on screen; a grounded target is exactly as before (review 2026-09-24: the bat\'s burst landed on the ground, the eagle\'s cursor at y −26 px)', async () => {
    const bat = await loadFitDir(fitDirOf(CARD_ARCHETYPES.find((a) => a.earthName === 'Fruit Bat')!.dir)), frog = await loadFitDir(fitDirOf(CARD_ARCHETYPES.find((a) => a.earthName === 'Tree Frog')!.dir));
    const airY = 0.4555, airLayout = { ...layout, stands: { left: layout.stands.left, right: { x: layout.stands.right.x, y: airY } } };
    const nodes: Node[] = []; const f: BattleStageFactory = { container: () => { const n = new Node(); nodes.push(n); return n; }, sprite: (): StageSpriteLike => new Node(), text: (t): StageTextLike => { const n = new Node(); n.text = t; return n; }, graphics: (): StageGraphicsLike => { const n = new Node(); nodes.push(n); return n; } };
    let now = 0; const stage = new BattleStage({ factory: f, clock: () => now, layout: airLayout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: frog.rig, right: bat.rig }, masses: { left: frog.card.massClass.multiplier, right: bat.card.massClass.multiplier } });
    const c: TurnOutcomeContext = { ...ctx('A', 'Tree Frog', frog.card.massClass.multiplier, frog.card, undefined, 9), arena: { groundLineY: layout.groundLineY, stands: airLayout.stands } };
    const plan = stage.play(turn(c, { side: 'A', an: 'Tree Frog', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, 0)), body = stage.bodies().right;
    expect(plan.effect).not.toBeNull(); const contactY = plan.effect!.placement.impact.from.y; expect(plan.effect!.placement.groundLineY).toBeCloseTo(contactY, 9); // the impact is placed on the target's body line
    expect(contactY).toBeGreaterThanOrEqual(body.topY); expect(contactY).toBeLessThanOrEqual(2 * body.centreY - body.topY); // inside the bat's painted box
    expect(plan.number.y).toBeLessThan(body.topY); expect(plan.number.y).toBeGreaterThan(0);
    let cursorOk = true, cursorSeen = false; for (let ms = 0; ms < plan.beats.end; ms += 1000 / 30) { now = ms; stage.tick(); const cur = nodes.find((n) => n.fills.includes(0xffd166)); if (cur && cur.visible && cur.rects.length) { cursorSeen = true; const y = cur.rects.at(-1)![1]!; if (y < 0 || y > FRAME.height) cursorOk = false; } }
    expect(cursorSeen).toBe(true); expect(cursorOk).toBe(true);
    stage.dispose();
    // control: a GROUNDED target keeps the ground-line contact and number exactly
    now = 0; const g = new BattleStage({ factory, clock: () => now, layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: (await loadFitDir(fitDirOf(CARD_ARCHETYPES.find((a) => a.earthName === 'Tree Frog')!.dir))).rig, right: portraitRig() }, masses: { left: 1, right: 0.85 } });
    const gp = g.play(turn(ctx('A', 'Tree Frog', frog.card.massClass.multiplier, frog.card, undefined, 9), { side: 'A', an: 'Tree Frog', dn: 'Platypus', dmg: 7, crit: false, hpA: 30, hpB: 20 }, 0));
    expect(gp.number.y).toBeCloseTo(layout.groundLineY - 0.30, 9); g.dispose();
  }, 300_000);
  it('a HIGH flyer\'s damage number stays inside the frame through its whole pop and rise (C15 2026-09-25: the Dragonfly\'s "9" was clipped above the viewport)', async () => {
    const bat = await loadFitDir(fitDirOf(CARD_ARCHETYPES.find((a) => a.earthName === 'Fruit Bat')!.dir)), frog = await loadFitDir(fitDirOf(CARD_ARCHETYPES.find((a) => a.earthName === 'Tree Frog')!.dir));
    const highLayout = { ...layout, stands: { left: layout.stands.left, right: { x: layout.stands.right.x, y: 0.12 } } };
    const texts: Node[] = []; const f: BattleStageFactory = { container: () => new Node(), sprite: (): StageSpriteLike => new Node(), text: (t): StageTextLike => { const n = new Node(); n.text = t; texts.push(n); return n; }, graphics: (): StageGraphicsLike => new Node() };
    let now = 0; const stage = new BattleStage({ factory: f, clock: () => now, layout: highLayout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: frog.rig, right: bat.rig }, masses: { left: frog.card.massClass.multiplier, right: bat.card.massClass.multiplier } });
    const c: TurnOutcomeContext = { ...ctx('A', 'Tree Frog', frog.card.massClass.multiplier, frog.card, undefined, 9), arena: { groundLineY: layout.groundLineY, stands: highLayout.stands } };
    const plan = stage.play(turn(c, { side: 'A', an: 'Tree Frog', dn: 'Platypus', dmg: 9, crit: false, hpA: 30, hpB: 20 }, 0)), body = stage.bodies().right;
    // control: this geometry reproduces the finding — the old start (max(0.04, top − 0.04)) minus the full rise leaves the frame's safe band
    expect(Math.max(0.04, body.topY - 0.04) - NUMBER_RISE).toBeLessThan(NUMBER_TOP_MIN);
    let seen = 0, minY = Infinity; for (let ms = 0; ms < plan.beats.end; ms += 1000 / 60) { now = ms; stage.tick(); for (const n of texts) if (n.visible && /\d/.test(n.text)) { seen++; minY = Math.min(minY, n.y); } }
    expect(seen).toBeGreaterThan(5); expect(minY).toBeGreaterThanOrEqual(NUMBER_TOP_MIN * FRAME.height - 1e-6);
    stage.dispose();
  }, 300_000);
  it('BAND CONTAINMENT from the real alpha box: on a lake world every archetype that swims or flies has its WHOLE painted box inside its band — the box taken from the rig\'s measured extent, not from the placement formula (review 2026-09-24: the Vent Crab sat 21 px below the water band floor)', async () => {
    const lake: ArenaWorld = { ...defaultArenaWorld(layout.groundLineY), key: 'lake', liquid: 'water', surfaceWater: true, cardHash: 'lake-1' }, H = FRAME.height, out: string[] = []; let checked = 0, centredWouldFail = 0;
    for (const a of CARD_ARCHETYPES) {
      const { rig, record, card } = await loadFitDir(fitDirOf(a.dir)), p = combatantPresentation(rig, card.massClass.multiplier, FRAME, layout.stands.left.y);
      const r = selectHabitatArena({ contextId: 'band', seed: 7, round: 0, kind: 'wild', worlds: { home: lake, visitor: lake }, groundLineY: layout.groundLineY, fitToBand: true, left: { record: record as never, genome: null, label: a.earthName, painted: p }, right: { record: null, genome: null, label: 'Portrait', painted: { height: 0.4, footBelowCentre: 0.05 } } });
      if (r.status !== 'READY' || r.stands.left.medium === 'ground') continue;
      const st = r.stands.left, k = p.scale * st.fit, top = st.y - (rig.extent!.up! * rig.cutout.height * k) / H, bottom = top + (rig.bounds.height * rig.cutout.height * k) / H; checked++;
      if (top < st.band.minY - 1e-9 || bottom > st.band.maxY + 1e-9) out.push(`${a.earthName} ${st.medium}: box ${top.toFixed(3)}–${bottom.toFixed(3)} band ${st.band.minY}–${st.band.maxY}`);
      // the old centred assumption, for the record: which boxes it would have pushed out
      const oldCentre = st.y - ((rig.foot.y - 0.5) * rig.cutout.height * k) / H, oldTop = oldCentre - (rig.bounds.height * rig.cutout.height * k) / (2 * H);
      if (Math.abs(oldTop - top) * H > 2 && (top + (oldTop - top) < st.band.minY || bottom + (oldTop - top) > st.band.maxY)) centredWouldFail++;
    }
    expect(out).toEqual([]); expect(checked).toBeGreaterThanOrEqual(8); // every swimmer and flyer (crabs swim on the lake)
    console.log(JSON.stringify({ bandChecked: checked, oldAssumptionWouldBreach: centredWouldFail }));
    expect(centredWouldFail).toBeGreaterThan(0); // the negative control: the old centred-box assumption DOES breach bands with these fits
  }, 300_000);
});
