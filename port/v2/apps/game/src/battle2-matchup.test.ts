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
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { MATCHUP_NAMES, matchupEnabled, matchupGenome, matchupTranscript, matchupWorld, mountBattle2Matchup, parseMatchup, swimsOnly } from './battle2-matchup.js';
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
