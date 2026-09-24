/** The matchup picker (battle2-matchup.ts) — outcomes: every pair the picker offers is PLAYABLE under Auto (never a habitat
 * refusal), the scripted bout stages, the archetype's own genome renders the painting itself, the picker mounts, replays and
 * closes the study, and main.ts loads it only behind the study gate. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, loadFitDir } from './battle2/parts-rig.fixtures.js';
import { combatantPresentation, turnPlanInputFromTranscriptEvent, type TurnOutcomeContext } from './battle2/stage.js';
import { composeArena } from './battle2/arena.js';
import { lakeArenaWorld, selectHabitatArena } from './battle2/habitat-arena.js';
import { placeCombatants } from './battle2/placement.js';
import { BattleStage, type BattleStageFactory, type StageGraphicsLike, type StageSpriteLike, type StageTextLike } from './battle2/stage.js';
import { compileAnatomyAttack } from './anatomy-attacks.js';
import { resolvePhysicalHabitat } from './battle-habitat.js';
import type { TurnAttack } from './battle2/choreography.js';
import { parseEffectSequenceAnchors } from './effects/anchors.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { MATCHUP_NAMES, matchupDuel, matchupEnabled, matchupGenome, matchupTranscript, matchupWorld, mountBattle2Matchup, parseMatchup, swimsOnly } from './battle2-matchup.js';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { speciesVisualKey } from '@cf/art/species-identity';
import { CombatChronicleController } from './combat-chronicle.js';
import type { Battle2AssetSource, Battle2StudyHandle, Battle2StudyInput, Battle2Status } from './battle2-wiring.js';
import { archetypeGenomeV1, morphParamsV1 } from './morph/morph-params.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };
const SERVED = new URL('port/v2/apps/game/public/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/', REPO_ROOT);
const diskAssets: Battle2AssetSource = { json: async (p) => JSON.parse(readFileSync(new URL(p, SERVED), 'utf8')), image: async () => { throw new Error('no images in this test'); } };
const recordOf = (name: string) => { const fit = BATTLE2_PARTS_FITS.find((f) => f.earthName === name)!; return JSON.parse(readFileSync(new URL(fit.dir + 'record.json', SERVED), 'utf8')) as { recipeHash: string; genome?: Record<string, unknown>; identity?: { speciesVisualKey?: string } }; };
const FRAME = { width: 1024, height: 576 }, TEX = { width: 1672, height: 941 };
const layout = composeArena({ id: 'matchup', groundLineNormalized: 0.78, plates: { far: TEX, mid: TEX, near: TEX } }, FRAME);

describe('matchup picker — parsing and choices', () => {
  it('opens only under ?battle2=1 AND vs; parses names case-insensitively, falls back with a note, reads world and seed', () => {
    expect(matchupEnabled('?battle2=1&vs=Python,Eagle')).toBe(true); expect(matchupEnabled('?battle2=1')).toBe(false); expect(matchupEnabled('?vs=Python,Eagle')).toBe(false); expect(matchupEnabled('?battle2=0&vs=a,b')).toBe(false);
    const a = parseMatchup('?battle2=1&vs=python,EAGLE&world=lake&seed=7'); expect([a.left, a.right, a.world, a.seed]).toEqual(['Python', 'Eagle', 'lake', 7]); expect(a.notes).toEqual([]);
    const b = parseMatchup('?battle2=1&vs=Dragon,Salmon&seed=x'); expect(b.left).toBe(MATCHUP_NAMES[0]); expect(b.right).toBe('Salmon'); expect(b.world).toBe('auto'); expect(b.seed).toBeNull(); expect(b.notes.join(' ')).toMatch(/unknown creature "Dragon".*seed "x"/);
    const c = parseMatchup('?battle2=1&vs='); expect(c.left).not.toBe(c.right); expect(MATCHUP_NAMES).toContain(c.left);
    expect(MATCHUP_NAMES.length).toBe(BATTLE2_PARTS_FITS.length); expect(MATCHUP_NAMES.length).toBeGreaterThanOrEqual(17);
  });
  it('Auto takes the lake only when a side can ONLY swim', () => {
    for (const n of ['Salmon', 'Octopus', 'Starfish']) expect(swimsOnly(n), n).toBe(true);
    for (const n of ['Python', 'Eagle', 'Crab', 'Civet', 'Fruit Bat']) expect(swimsOnly(n), n).toBe(false);
    expect(matchupWorld({ left: 'Python', right: 'Eagle', world: 'auto' })).toBe('land'); expect(matchupWorld({ left: 'Eagle', right: 'Salmon', world: 'auto' })).toBe('lake');
    expect(matchupWorld({ left: 'Salmon', right: 'Octopus', world: 'land' })).toBe('land'); // an explicit choice is honoured (the study then shows the refusal)
  });
  it('the scripted bout stages every row; the own genome renders the painting itself; a seed makes two different individuals', () => {
    const ctx: TurnOutcomeContext = { A: { side: 'A', name: 'Python', mass: 1, card: null, theme: 'wild', seed: 1 }, B: { side: 'B', name: 'Eagle', mass: 1, card: null, theme: 'stone', seed: 2 }, arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: 5, anchorsForTheme: () => null, readyMs: 600, commandMs: 300 };
    const rows = matchupTranscript('Python', 'Eagle');
    for (const [i, r] of rows.entries()) { const t = turnPlanInputFromTranscriptEvent(r, ctx, i); expect(t.kind, JSON.stringify(r)).toBe('turn'); } expect(rows.length).toBe(5);
    for (const name of MATCHUP_NAMES) { const rec = recordOf(name), own = matchupGenome(rec, name, null, 'left');
      expect(own._earthName).toBe(name); expect(morphParamsV1(own as never, rec.recipeHash, archetypeGenomeV1(rec as never)).identity, name).toBe(true); }
    const rec = recordOf('Civet'), l = matchupGenome(rec, 'Civet', 3, 'left'), r = matchupGenome(rec, 'Civet', 3, 'right');
    expect(morphParamsV1(l as never, rec.recipeHash, archetypeGenomeV1(rec as never)).identity).toBe(false); expect(l).not.toEqual(r); expect(matchupGenome(rec, 'Civet', 3, 'left')).toEqual(l);
  });
});

describe('matchup picker — every offered pair is playable', () => {
  it('under Auto, all 17 × 17 pairs resolve to a READY habitat (never a refusal) with the real rigs sized by the app rule', async () => {
    const painted = new Map<string, { height: number; footBelowCentre: number }>(), recs = new Map<string, unknown>();
    for (const a of CARD_ARCHETYPES) { recs.set(a.earthName, recordOf(a.earthName));
      const dir = (JSON.parse(readFileSync(new URL(a.dir + 'SOURCE.json', REPO_ROOT), 'utf8')) as { fitDir: string }).fitDir;
      const { rig, card } = await loadFitDir(dir); const p = combatantPresentation(rig, card.massClass.multiplier, FRAME); painted.set(a.earthName, { height: p.height, footBelowCentre: p.footBelowCentre }); }
    expect(CARD_ARCHETYPES.map((a) => a.earthName)).toEqual([...MATCHUP_NAMES]);
    const refused: string[] = []; let lakes = 0, pairs = 0;
    for (const L of MATCHUP_NAMES) for (const R of MATCHUP_NAMES) { pairs++;
      const world = matchupWorld({ left: L, right: R, world: 'auto' }); if (world === 'lake') lakes++;
      const worlds = world === 'lake' ? { home: lakeArenaWorld(layout.groundLineY), visitor: lakeArenaWorld(layout.groundLineY) } : null;
      const r = selectHabitatArena({ contextId: `m:${L}:${R}`, seed: 7, round: 0, kind: 'wild', worlds, groundLineY: layout.groundLineY, fitToBand: true,
        left: { record: recs.get(L) as never, genome: null, label: L, painted: painted.get(L)! }, right: { record: recs.get(R) as never, genome: null, label: R, painted: painted.get(R)! } });
      if (r.status !== 'READY') refused.push(`${L} vs ${R} (${world}): ${r.reason}`); }
    expect(refused).toEqual([]); expect(pairs).toBe(MATCHUP_NAMES.length ** 2); expect(lakes).toBeGreaterThan(0); expect(lakes).toBeLessThan(pairs);
  }, 300_000);
});


describe('matchup picker — every offered pair STAGES', () => {
  const WILD = (() => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', REPO_ROOT), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; })();
  it('all 17 × 17 pairs go through the ONE placement pipeline and build real turn plans both ways (attack, counter-attack, dodge) on a real stage — no refusal, no throw (the browser run found Tree Frog vs Salmon refused: a swimmer\'s foot anchor below the frame)', async () => {
    class N { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; text = ''; readonly scale = { set: () => {} }; readonly anchor = { set: () => {} }; children: object[] = []; addChild(c: object) { this.children.push(c); } removeChild() {} clear() {} rect() {} fill() {} destroy() {} }
    const factory: BattleStageFactory = { container: () => new N(), sprite: (): StageSpriteLike => new N(), text: (t): StageTextLike => { const n = new N(); n.text = t; return n; }, graphics: (): StageGraphicsLike => new N() };
    const loaded = new Map<string, Awaited<ReturnType<typeof loadFitDir>>>();
    for (const a of CARD_ARCHETYPES) loaded.set(a.earthName, await loadFitDir((JSON.parse(readFileSync(new URL(a.dir + 'SOURCE.json', REPO_ROOT), 'utf8')) as { fitDir: string }).fitDir));
    const failures: string[] = []; let plans = 0;
    for (const L of MATCHUP_NAMES) for (const R of MATCHUP_NAMES) {
      const l = loaded.get(L)!, r = loaded.get(R)!, world = matchupWorld({ left: L, right: R, world: 'auto' });
      const worlds = world === 'lake' ? { home: lakeArenaWorld(layout.groundLineY), visitor: lakeArenaWorld(layout.groundLineY) } : null;
      try {
        const placed = placeCombatants({ contextId: `pairs:${L}:${R}`, seed: 7, layout, worlds, left: { rig: l.rig, mass: l.card.massClass.multiplier, record: l.record as never, genome: null, label: L }, right: { rig: r.rig, mass: r.card.massClass.multiplier, record: r.record as never, genome: null, label: R } });
        if (placed.status !== 'READY') { failures.push(`${L} vs ${R}: ${placed.habitat.reason}`); continue; }
        const stage = new BattleStage({ factory, clock: () => 0, layout: placed.layout, plates: { far: TEX, mid: TEX, near: TEX }, rigs: { left: l.rig, right: r.rig }, masses: { left: l.card.massClass.multiplier, right: r.card.massClass.multiplier }, ...(placed.presentationScales ? { presentationScales: placed.presentationScales } : {}), ...(placed.water ? { water: placed.water } : {}) });
        const medium = { A: placed.habitat.stands.left.medium, B: placed.habitat.stands.right.medium } as const, cards = { A: l.card, B: r.card };
        const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => { try { const c = compileAnatomyAttack(cards[side], medium[side], ordinal); return { verb: c.attack.verb, timeline: c.timeline, contactMs: c.contactMs, contactJoint: c.attack.contactJoint }; } catch { return null; } };
        const ctx: TurnOutcomeContext = { A: { side: 'A', name: L, mass: l.card.massClass.multiplier, card: l.card, theme: 'wild', seed: 1 }, B: { side: 'B', name: R, mass: r.card.massClass.multiplier, card: r.card, theme: 'wild', seed: 2 }, arena: { groundLineY: layout.groundLineY, stands: placed.layout.stands }, seed: 5, anchorsForTheme: (t) => (t === 'wild' ? WILD : null), readyMs: 600, commandMs: 300, attackFor }; // the REAL effect anchors: effect placement is where a bad stand point is refused
        const rows = [{ side: 'A', an: L, dn: R, dmg: 9, crit: false, hpA: 30, hpB: 21 }, { side: 'B', an: R, dn: L, dmg: 6, crit: false, hpA: 24, hpB: 21 }, { an: L, dn: R, dodge: true }];
        for (const [i, row] of rows.entries()) { const t = turnPlanInputFromTranscriptEvent(row, ctx, i); if (t.kind !== 'turn') throw new Error(t.reason); const plan = stage.play(t.input); plans++; if (!row.dodge && !plan.effect) throw new Error('no effect was placed — the check would be vacuous'); }
      } catch (e) { failures.push(`${L} vs ${R} (${world}): ${e instanceof Error ? e.message : String(e)}`); }
    }
    expect(failures).toEqual([]); expect(plans).toBe(MATCHUP_NAMES.length ** 2 * 3);
  }, 900_000);
});

describe('matchup picker — DOM', () => {
  it('mounts the chosen pair, replays a new choice (disposing the old study), and Close tears everything down', async () => {
    const dom = new JSDOM('<!doctype html><body></body>'), doc = dom.window.document;
    const mounted: Battle2StudyInput[] = [], disposed: string[] = [];
    const fakeStudy = (input: Battle2StudyInput): Battle2StudyHandle => { mounted.push(input); const st = { phase: 'playing', reason: null, label: null, turns: 5, turnIndex: 0, skipped: [], rigs: { left: 'parts', right: 'parts' }, ticks: 0, effects: { left: null, right: null }, arena: input.worldPreset === 'lake' ? 'lake' : 'earth-temperate-default', attacks: { left: 'strike (jaw)', right: 'claw (legNearFoot)' } } as unknown as Battle2Status;
      return { ready: Promise.resolve(st), status: () => st, dispose: (why?: string) => { disposed.push(`${input.chronicle.championName}:${why}`); } }; };
    const ticker = { add() {}, remove() {} };
    const h = mountBattle2Matchup({ doc, search: '?battle2=1&vs=Python,Eagle', assets: diskAssets, mountStudy: fakeStudy, ticker, clock: () => 0, reducedMotion: false, deviceTier: 'high', pixi: {} as never, artLoader: null });
    await new Promise((r) => setTimeout(r, 20));
    expect(doc.querySelector('[data-battle2-matchup]')).not.toBeNull(); expect(mounted.length).toBe(1);
    const first = mounted[0]!; expect(first.chronicle).toEqual({ championName: 'Python', defenderName: 'Eagle' }); expect(first.worldPreset).toBeUndefined();
    expect((first.settlement.champion.genome as Record<string, unknown>)._earthName).toBe('Python'); expect(first.settlement.encounter.defender.battleGenome._earthName).toBe('Eagle'); expect(first.settlement.transcript.log.length).toBe(5);
    expect(doc.querySelector('output')!.textContent).toMatch(/playing · earth-temperate-default · attacks: strike/);
    const st = await h.play({ left: 'Salmon', right: 'Octopus', seed: 4 }); expect(st.phase).toBe('playing');
    expect(mounted.length).toBe(2); expect(mounted[1]!.worldPreset).toBe('lake'); expect(mounted[1]!.generation).toBe(mounted[0]!.generation + 1); expect(disposed).toContain('Python:matchup replaced');
    expect((doc.querySelectorAll('select')[0] as HTMLSelectElement).value).toBe('Salmon'); expect((doc.querySelector('input') as HTMLInputElement).value).toBe('4');
    // the controls drive it too: pick Eagle vs Beetle and press Play
    const sels = doc.querySelectorAll('select'); (sels[0] as HTMLSelectElement).value = 'Eagle'; (sels[1] as HTMLSelectElement).value = 'Beetle'; (doc.querySelector('input') as HTMLInputElement).value = '';
    (doc.querySelectorAll('button')[0] as HTMLButtonElement).click(); await new Promise((r) => setTimeout(r, 20));
    expect(mounted.length).toBe(3); expect(mounted[2]!.chronicle.championName).toBe('Eagle'); expect(mounted[2]!.settlement.battleId).toMatch(/:own$/);
    (doc.querySelectorAll('button')[1] as HTMLButtonElement).click();
    expect(doc.querySelector('[data-battle2-matchup]')).toBeNull(); expect(disposed.at(-1)).toBe('Eagle:matchup closed');
    await expect(h.play()).rejects.toThrow(/closed/);
  });
});

describe('matchup picker — the status line follows the study', () => {
  it('reads "finished" (or the failure) when the study ends, not "playing" forever', async () => {
    const dom = new JSDOM('<!doctype html><body></body>'), doc = dom.window.document; let phase = 'playing'; let section: HTMLElement | null = null;
    const fakeStudy = (input: Battle2StudyInput): Battle2StudyHandle => { section = doc.createElement('section'); section.dataset.battle2Status = 'playing'; input.mount.append(section);
      const st = () => ({ phase, reason: phase === 'failed' ? 'stage tick failed: x' : null, label: null, turns: 3, turnIndex: 0, skipped: [], rigs: { left: 'parts', right: 'parts' }, ticks: 0, effects: { left: null, right: null }, arena: 'earth', attacks: { left: null, right: null }, refusals: { left: 0, right: 0 }, audio: 'none' }) as unknown as Battle2Status;
      return { ready: Promise.resolve(st()), status: st, dispose: () => {} }; };
    const h = mountBattle2Matchup({ doc, search: '?battle2=1&vs=Civet,Crab', assets: diskAssets, mountStudy: fakeStudy, ticker: { add() {}, remove() {} }, clock: () => 0, reducedMotion: false, deviceTier: 'high', pixi: {} as never, artLoader: null });
    await new Promise((r) => setTimeout(r, 20));
    const out = doc.querySelector('output')!; expect(out.textContent).toMatch(/^playing/);
    phase = 'finished'; section!.dataset.battle2Status = 'finished'; await new Promise((r) => setTimeout(r, 0));
    expect(out.textContent).toMatch(/^finished · earth/);
    phase = 'failed'; section!.dataset.battle2Status = 'failed'; await new Promise((r) => setTimeout(r, 0));
    expect(out.textContent).toBe('could not stage: stage tick failed: x');
    h.dispose();
  });
});

describe('matchup picker — the REAL duel (Nick 2026-09-24: the stage paces the Chronicle, shown in the picker)', () => {
  it('?duel=1 turns it on; absent it is off', () => {
    expect(parseMatchup('?battle2=1&vs=Civet,Python&duel=1').duel).toBe(true); expect(parseMatchup('?battle2=1&vs=Civet,Python').duel).toBe(false);
  });
  it('every archetype fights a REAL planned duel as champion and as defender; both genomes keep the painting\'s visual key (so the stage stages the painted archetype); deterministic', () => {
    installCaptureHooks();
    const names = MATCHUP_NAMES, keyOf = (n: string) => (recordOf(n) as { identity: { speciesVisualKey: string } }).identity.speciesVisualKey;
    for (const [i, a] of names.entries()) {
      const b = names[(i + 5) % names.length]!;
      const d = matchupDuel(recordOf(a), recordOf(b), { left: a, right: b, seed: null });
      expect(d.settlement.status, `${a} vs ${b}`).toBe('planned');
      const champ = d.settlement.champion as { genome?: Record<string, unknown> };
      expect(speciesVisualKey(champ.genome as never), `${a} as champion`).toBe(keyOf(a));
      expect(speciesVisualKey(d.settlement.encounter.defender.battleGenome as never), `${b} as defender`).toBe(keyOf(b));
      expect(d.chronicle.steps.length, `${a} vs ${b}`).toBeGreaterThan(0);
      expect(d.settlement.transcript.log.length).toBeGreaterThan(0);
    }
    const x = matchupDuel(recordOf('Civet'), recordOf('Python'), { left: 'Civet', right: 'Python', seed: 7 }), y = matchupDuel(recordOf('Civet'), recordOf('Python'), { left: 'Civet', right: 'Python', seed: 7 });
    expect(x.settlement.transcriptFingerprint).toBe(y.settlement.transcriptFingerprint);
    // control: another seed is another duel
    expect(matchupDuel(recordOf('Civet'), recordOf('Python'), { left: 'Civet', right: 'Python', seed: 8 }).settlement.transcriptFingerprint).not.toBe(x.settlement.transcriptFingerprint);
  });
  it('the picker in duel mode starts the Combat Chronicle under the stage, sets a pacer BEFORE start and hands the same gate to the study (the game\'s order); reduced motion hands none', async () => {
    installCaptureHooks();
    for (const reduced of [false, true]) {
      const dom = new JSDOM('<!doctype html><body></body>'), doc = dom.window.document, mounted: Battle2StudyInput[] = [];
      const order: string[] = [], setPacer = CombatChronicleController.prototype.setPacer, start = CombatChronicleController.prototype.start;
      CombatChronicleController.prototype.setPacer = function (this: CombatChronicleController, p) { order.push(p ? 'pacer' : 'no pacer'); return setPacer.call(this, p); };
      CombatChronicleController.prototype.start = function (this: CombatChronicleController, c, q) { order.push('start'); return start.call(this, c, q); };
      try {
        const fakeStudy = (input: Battle2StudyInput): Battle2StudyHandle => { order.push('study'); mounted.push(input); const st = { phase: 'playing', reason: null, label: null, turns: 3, turnIndex: 0, skipped: [], rigs: { left: 'parts', right: 'parts' }, ticks: 0, effects: { left: null, right: null }, arena: null, attacks: { left: null, right: null }, refusals: { left: 0, right: 0 }, audio: 'none' } as unknown as Battle2Status;
          return { ready: Promise.resolve(st), status: () => st, dispose: () => {} }; };
        const h = mountBattle2Matchup({ doc, search: '?battle2=1&vs=Civet,Python&duel=1', assets: diskAssets, mountStudy: fakeStudy, ticker: { add() {}, remove() {} }, clock: () => 0, reducedMotion: reduced, deviceTier: 'high', pixi: {} as never, artLoader: null });
        await new Promise((r) => setTimeout(r, 30));
        expect(order).toEqual([reduced ? 'no pacer' : 'pacer', 'start', 'study']);
        const input = mounted[0]!; expect(Boolean(input.pacer)).toBe(!reduced);
        expect(input.mount.querySelector('[data-combat-chronicle-log]')).not.toBeNull(); // the study mounts over the Chronicle's own mount
        expect(input.generation).toBe(Number(input.mount.dataset.combatChronicleGeneration));
        expect((input.settlement as unknown as { status: string }).status).toBe('planned'); expect(input.chronicle.championName).toBe('Civet');
        expect(doc.querySelector('output')!.textContent).toMatch(/^real duel · Civet vs /);
        h.dispose(); expect(doc.querySelector('[data-battle2-matchup]')).toBeNull();
      } finally { CombatChronicleController.prototype.setPacer = setPacer; CombatChronicleController.prototype.start = start; }
    }
  });
});

describe('main.ts matchup gate (source text)', () => {
  const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
  const violations = (source: string): string[] => { const lines = source.split('\n'), out: string[] = [];
    const gated = lines.filter((l) => l.includes("get('battle2') === '1'") && l.includes("import('./battle2-matchup.js')")); if (gated.length !== 1) out.push(`expected one gated import line, found ${gated.length}`);
    for (const l of lines) if (l.includes("import('./battle2-matchup.js')") && !l.includes("get('battle2') === '1'")) out.push('ungated dynamic import');
    for (const l of lines) if (/^\s*import\b/.test(l) && l.includes("'./battle2-matchup.js'")) out.push('static import');
    return out; };
  it('loads battle2-matchup only behind the study flag, dynamically; mutation controls fail', () => {
    expect(violations(main)).toEqual([]);
    expect(violations(`${main}\nimport { mountBattle2Matchup } from './battle2-matchup.js';\n`)).not.toEqual([]);
    expect(violations(`${main}\nvoid import('./battle2-matchup.js');\n`)).not.toEqual([]);
    expect(violations(main.replace(/get\('battle2'\) === '1' && new URLSearchParams\(location.search\).get\('vs'\)/, "get('vs')"))).not.toEqual([]);
  });
  it('the picker reads no clock and no Math.random', () => {
    const code = readFileSync(new URL('./battle2-matchup.ts', import.meta.url), 'utf8').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
    expect(code).not.toMatch(/Math\.random|Date\.now|performance\.now|new Date\(/);
  });
});
