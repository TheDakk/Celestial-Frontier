/* Painted-theme registry (data-driven routing, effects/painted-themes.json). Outcomes: the shipped manifest registers Wild
 * exactly as the game loaded it before (same anchors, same three phase-image paths, same turn plan); every other theme is
 * procedural with an explicit reason; a delivered theme drops in with ONE manifest row (no code), and each kind of broken
 * row falls back to procedural naming its refusal. The theme keys are the combat domain's own ABILITY_THEMES (not invented)
 * and the material accents are the game's theme hexes. The turn adapter stages each attack with the ATTACKER's theme. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ABILITY_THEMES } from '@cf/domain-combatcore';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import { EFFECT_THEMES, EffectThemeLibrary, NO_PAINTED_ROW_REASON, PAINTED_EFFECT_LABEL, PROCEDURAL_EFFECT_LABEL, THEME_EMITTERS, THEME_MATERIALS, isProceduralSequence, type EffectTheme } from '../apps/game/src/effects/theme-library.js';
import { loadPaintedThemeAnchors, loadPaintedThemeTextures, paintedAssetPath, parsePaintedThemeManifest, PAINTED_THEME_MANIFEST_SCHEMA } from '../apps/game/src/effects/painted-theme-registry.js';
import { buildTurnPlan } from '../apps/game/src/battle2/choreography.js';
import { turnPlanInputFromTranscriptEvent, type TurnOutcomeContext } from '../apps/game/src/battle2/stage.js';

const AUDITS = new URL('../../../audits/', import.meta.url);
const readJson = (rel: string): Record<string, unknown> => JSON.parse(readFileSync(new URL(rel, AUDITS), 'utf8')) as Record<string, unknown>;
const SHIPPED = JSON.parse(readFileSync(new URL('../apps/game/src/effects/painted-themes.json', import.meta.url), 'utf8')) as Record<string, unknown>;
const wildV42 = (): Record<string, unknown> => readJson('ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json');
const wildParsed = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(wildV42()); if (!p.ok) throw new Error(p.reason); return p.anchors; };
/** A v4.3 delivery for another theme: the accepted Wild v4.3 anchors retargeted (1024 square, three phases). */
const v43As = (theme: string): Record<string, unknown> => ({ ...readJson('WILD_V43_PROOF_20260913/wild-anchors.json'), theme, sequenceId: `${theme}-delivery-test-v1` });
const manifest = (rows: unknown[]): Record<string, unknown> => ({ schema: PAINTED_THEME_MANIFEST_SCHEMA, rows });
const WILD_ROW = { theme: 'wild', anchors: 'wild-anchors.json', contract: 'v4.2-grandfathered', required: true };
const tex = (w = 1024, h = 1024, path = '') => ({ width: w, height: h, path });
/** Fake asset source rooted at the arena proof directory: json/texture by path, with a call log. */
function source(json: Record<string, unknown>, textures: (p: string) => { width: number; height: number; path: string } | Error = (p) => (p.startsWith('keyed/') ? tex(1254, 1254, p) : tex(1024, 1024, p))) {
  const calls: string[] = [];
  return { calls, json: async (p: string) => { calls.push(p); if (!(p in json)) throw new Error(`404 ${p}`); return json[p]; },
    texture: async (p: string) => { calls.push(p); const t = textures(p); if (t instanceof Error) throw t; return t; } };
}
async function route(rowsJson: unknown[], files: Record<string, unknown>, textures?: Parameters<typeof source>[1]) {
  const rows = parsePaintedThemeManifest(manifest(rowsJson)), src = source(files, textures);
  const loaded = await loadPaintedThemeTextures(await loadPaintedThemeAnchors(rows, src.json), src.texture);
  return { loaded, calls: src.calls, lib: new EffectThemeLibrary(loaded.painted, loaded.fallbackReasons) };
}

describe('painted-theme manifest and theme keys', () => {
  it('the theme keys are the combat domain\'s ABILITY_THEMES and each accent is the game\'s own theme hex (no hex changed)', () => {
    const domain = ABILITY_THEMES as unknown as Record<string, { col: string }>;
    expect([...EFFECT_THEMES].sort()).toEqual(Object.keys(domain).sort());
    for (const t of EFFECT_THEMES) expect(`#${THEME_MATERIALS[t].accent.toString(16).padStart(6, '0')}`).toBe(domain[t]!.col);
  });
  it('the shipped manifest registers the grandfathered Wild row plus exactly the ten C132 v4.3 deliveries (Claude full-size review 2026-10-02)', () => {
    const rows = parsePaintedThemeManifest(SHIPPED);
    expect(rows[0]).toEqual(WILD_ROW);
    expect(rows.slice(1).map((r) => r.theme)).toEqual(['fire', 'frost', 'storm', 'tide', 'stone', 'venom', 'void', 'sand', 'chem', 'psionic']);
    for (const r of rows.slice(1)) expect(r).toMatchObject({ contract: 'v4.3', required: false, anchors: expect.stringMatching(/^\.\.\/C132_EFFECTS_20261001\//) });
  });
  it('refuses a malformed manifest by name (it is committed data: a refusal is a test failure, never a silent fallback)', () => {
    const bad = (rows: unknown[], over: Record<string, unknown> = {}) => () => parsePaintedThemeManifest({ ...manifest(rows), ...over });
    expect(bad([], { schema: 'cf.painted-theme-manifest/v0' })).toThrow(/schema must be/);
    expect(bad([], { rows: {} })).toThrow(/rows must be an array/);
    expect(bad([{ ...WILD_ROW, theme: 'lava' }])).toThrow(/"lava" is not a kit theme/);
    expect(bad([WILD_ROW, WILD_ROW])).toThrow(/"wild" already has a row/);
    for (const p of ['/abs/fire.json', './fire.json', 'fire.png', 'a/./b.json', 'a b.json', '']) expect(bad([{ theme: 'fire', anchors: p, contract: 'v4.3' }])).toThrow(/anchors: expected a relative path/);
    expect(bad([{ theme: 'fire', anchors: 'fire.json', contract: 'v4.2-grandfathered' }])).toThrow(/only wild is grandfathered/);
    expect(bad([{ theme: 'fire', anchors: 'fire.json', contract: 'v5' }])).toThrow(/contract: expected one of/);
    expect(bad([{ theme: 'fire', anchors: 'fire.json', contract: 'v4.3', required: 'yes' }])).toThrow(/required: expected a boolean/);
    expect(parsePaintedThemeManifest(manifest([{ theme: 'fire', anchors: '../X/fire-anchors.json', contract: 'v4.3' }]))).toEqual([{ theme: 'fire', anchors: '../X/fire-anchors.json', contract: 'v4.3', required: false }]);
  });
  it('resolves phase images against the anchors JSON\'s own directory (Wild at the root keeps its exact paths)', () => {
    expect(paintedAssetPath('wild-anchors.json', 'keyed/wild-launch.png')).toBe('keyed/wild-launch.png');
    expect(paintedAssetPath('../THEME_FIRE/fire-anchors.json', 'keyed/fire-launch.png')).toBe('../THEME_FIRE/keyed/fire-launch.png');
    expect(paintedAssetPath('../A/b/c.json', '../d.png')).toBe('../A/d.png');
    expect(paintedAssetPath('a/b.json', '../../c.png')).toBe('../c.png');
  });
});

describe('painted-theme registry outcomes', () => {
  it('Wild is UNCHANGED: the same anchors, the same three phase-image requests, the same library entry and turn plan as the pre-registry load', async () => {
    const { loaded, calls, lib } = await route([WILD_ROW], { 'wild-anchors.json': wildV42() });
    expect(calls).toEqual(['wild-anchors.json', 'keyed/wild-launch.png', 'keyed/wild-travel.png', 'keyed/wild-impact.png']);
    expect(loaded.painted).toEqual([wildParsed()]);
    expect(loaded.textures.get('wild-maw-proof-v1')!.map((t) => (t as { path: string }).path)).toEqual(['keyed/wild-launch.png', 'keyed/wild-travel.png', 'keyed/wild-impact.png']);
    const before = new EffectThemeLibrary([wildParsed()]);
    for (const t of EFFECT_THEMES) {
      const a = lib.resolve(t), b = before.resolve(t);
      expect(a.anchors).toEqual(b.anchors); expect(a.painted).toEqual(b.painted); expect(a.label).toBe(b.label); expect(a.emitters).toBe(b.emitters); expect(a.material).toBe(b.material);
    }
    const base = { seed: 7, attacker: { side: 'left' as const, mass: 1, card: null, seed: 1, label: 'a' }, target: { side: 'right' as const, mass: 1, card: null, seed: 2, label: 'b' }, outcome: 'hit' as const, damage: 5, delivery: 'melee' as const, theme: 'wild',
      arena: { groundLineY: 0.78, stands: { left: { x: 1 / 3, y: 0.78 }, right: { x: 2 / 3, y: 0.78 } } }, readyMs: 500, commandMs: 300 };
    expect(JSON.stringify(buildTurnPlan({ ...base, effect: lib.anchorsFor('wild') }))).toBe(JSON.stringify(buildTurnPlan({ ...base, effect: before.anchorsFor('wild') })));
  });
  it('every unregistered theme is procedural with the explicit no-row reason; painted themes carry no reason', async () => {
    const { loaded, lib } = await route([WILD_ROW], { 'wild-anchors.json': wildV42() });
    expect([...loaded.fallbackReasons.keys()].sort()).toEqual(EFFECT_THEMES.filter((t) => t !== 'wild').sort());
    for (const t of EFFECT_THEMES) {
      const e = lib.resolve(t);
      if (t === 'wild') { expect(e.label).toBe(PAINTED_EFFECT_LABEL); expect(e.reason).toBeNull(); }
      else { expect(e.label).toBe(PROCEDURAL_EFFECT_LABEL); expect(e.reason).toBe(NO_PAINTED_ROW_REASON); expect(isProceduralSequence(e.anchors)).toBe(true); }
    }
    expect(new EffectThemeLibrary().resolve('fire').reason).toBe(NO_PAINTED_ROW_REASON);
  });
  it('a delivered theme drops in with ONE manifest row: painted, its own phase images, distinct from Wild', async () => {
    const fireRow = { theme: 'fire', anchors: '../THEME_FIRE/fire-anchors.json', contract: 'v4.3' };
    const { loaded, calls, lib } = await route([WILD_ROW, fireRow], { 'wild-anchors.json': wildV42(), '../THEME_FIRE/fire-anchors.json': v43As('fire') });
    expect(calls).toEqual(expect.arrayContaining(['../THEME_FIRE/registered/wild-launch.png', '../THEME_FIRE/second-pass/registered/wild-travel.png', '../THEME_FIRE/targeted-pass/registered/wild-impact.png']));
    const fire = lib.resolve('fire'); expect(fire.label).toBe(PAINTED_EFFECT_LABEL); expect(fire.reason).toBeNull(); expect(fire.anchors.sequenceId).toBe('fire-delivery-test-v1');
    expect(fire.emitters).toBe(THEME_EMITTERS.fire); expect(lib.tintFor('fire')).toBe(THEME_MATERIALS.fire.tint);
    expect(lib.resolve('wild').anchors.sequenceId).toBe('wild-maw-proof-v1'); expect(loaded.fallbackReasons.has('fire')).toBe(false); expect(loaded.fallbackReasons.size).toBe(9);
  });
  it('each broken row falls back to procedural naming its refusal; the other themes are untouched', async () => {
    const files = { 'wild-anchors.json': wildV42() };
    const reasonFor = async (row: Record<string, unknown>, extra: Record<string, unknown>, textures?: Parameters<typeof source>[1]): Promise<string> => {
      const { lib } = await route([WILD_ROW, { contract: 'v4.3', ...row }], { ...files, ...extra }, textures);
      const t = row.theme as EffectTheme; expect(lib.resolve(t).label).toBe(PROCEDURAL_EFFECT_LABEL); expect(lib.resolve('wild').label).toBe(PAINTED_EFFECT_LABEL);
      return lib.resolve(t).reason!;
    };
    const fourPhase = (() => { const a = v43As('tide') as { phaseOrder: string[]; phases: Record<string, unknown>[] }; a.phaseOrder = ['launch', 'travel', 'travel', 'impact']; a.phases = [a.phases[0]!, a.phases[1]!, { ...a.phases[1]!, image: 'x.png', keyedImage: 'x.png' }, a.phases[2]!]; return a; })();
    const big = (() => { const a = v43As('sand') as { canvasSize: unknown }; a.canvasSize = { width: 1254, height: 1254 }; return a; })();
    expect(await reasonFor({ theme: 'fire', anchors: 'fire.json' }, {})).toMatch(/^anchors fire\.json unavailable \(404 fire\.json\)$/);
    expect(await reasonFor({ theme: 'frost', anchors: 'frost.json' }, { 'frost.json': { ...v43As('frost'), originAnchor: [2, 0] } })).toMatch(/^anchors frost\.json refused: originAnchor/);
    expect(await reasonFor({ theme: 'storm', anchors: 'storm.json' }, { 'storm.json': v43As('venom') })).toBe('anchors storm.json are for theme "venom", not "storm"');
    expect(await reasonFor({ theme: 'void', anchors: 'void.json' }, { 'void.json': { ...v43As('void'), sequenceId: 'procedural-void-v1' } })).toMatch(/procedural record/);
    expect(await reasonFor({ theme: 'tide', anchors: 'tide.json' }, { 'tide.json': fourPhase })).toMatch(/exactly 3 phases .*got 4/);
    expect(await reasonFor({ theme: 'sand', anchors: 'sand.json' }, { 'sand.json': big })).toMatch(/canvas 1254x1254, a v4\.3 delivery is 1024 square/);
    expect(await reasonFor({ theme: 'chem', anchors: 'chem.json' }, { 'chem.json': { ...v43As('chem'), sequenceId: 'wild-maw-proof-v1' } })).toMatch(/sequenceId wild-maw-proof-v1 is already registered/);
    expect(await reasonFor({ theme: 'stone', anchors: 'S/stone.json' }, { 'S/stone.json': v43As('stone') }, (p) => (p.startsWith('S/') ? new Error('decode failed') : tex(1254, 1254)))).toMatch(/^phase image S\/registered\/wild-launch\.png unavailable \(decode failed\)$/);
    expect(await reasonFor({ theme: 'psionic', anchors: 'P/psionic.json' }, { 'P/psionic.json': v43As('psionic') }, (p) => (p.startsWith('P/') ? tex(1254, 1254) : tex(1254, 1254)))).toMatch(/is 1254x1254, its anchors say 1024x1024/);
  });
  it('the REQUIRED Wild row still fails the study exactly as before (fetch error as is; parser refusal as "battle2 anchors refused: …")', async () => {
    await expect(route([WILD_ROW], {})).rejects.toThrow(/^404 wild-anchors\.json$/);
    await expect(route([WILD_ROW], { 'wild-anchors.json': { ...wildV42(), schema: 'x' } })).rejects.toThrow('battle2 anchors refused: schema: expected cf.effect-sequence-anchors/v1');
    await expect(route([WILD_ROW], { 'wild-anchors.json': wildV42() }, () => new Error('image 404'))).rejects.toThrow('image 404');
  });
  it('the library refuses a fallback reason for a painted theme, a non-kit theme or an empty reason', () => {
    expect(() => new EffectThemeLibrary([wildParsed()], [['wild', 'x']])).toThrow(/is painted and cannot also carry/);
    expect(() => new EffectThemeLibrary([], [['lava' as EffectTheme, 'x']])).toThrow(/not a kit theme/);
    expect(() => new EffectThemeLibrary([], [['fire', '']])).toThrow(/non-empty/);
  });
});

describe('the stage stages each attack with the ATTACKER\'s ability theme', () => {
  it('two combatants of different themes play different effects, each from its own row (painted fire vs painted wild vs procedural storm)', async () => {
    const { lib } = await route([WILD_ROW, { theme: 'fire', anchors: 'F/fire.json', contract: 'v4.3' }], { 'wild-anchors.json': wildV42(), 'F/fire.json': v43As('fire') });
    const ctxFor = (a: string, b: string): TurnOutcomeContext => ({
      A: { side: 'A', name: 'Ember', mass: 1, card: null, theme: a, seed: 1 }, B: { side: 'B', name: 'Gale', mass: 1, card: null, theme: b, seed: 2 },
      arena: { groundLineY: 0.78, stands: { left: { x: 1 / 3, y: 0.78 }, right: { x: 2 / 3, y: 0.78 } } }, seed: 9, anchorsForTheme: (t) => lib.anchorsFor(t), readyMs: 900, commandMs: 400 });
    const play = (ctx: TurnOutcomeContext, side: 'A' | 'B') => { const r = turnPlanInputFromTranscriptEvent({ side, an: side === 'A' ? 'Ember' : 'Gale', dn: side === 'A' ? 'Gale' : 'Ember', dmg: 4, hpA: 9, hpB: 9 }, ctx); if (r.kind !== 'turn') throw new Error(r.reason); return r.input; };
    const fireVsStorm = ctxFor('fire', 'storm');
    const a = play(fireVsStorm, 'A'), b = play(fireVsStorm, 'B');
    expect(a.theme).toBe('fire'); expect(a.effect!.sequenceId).toBe('fire-delivery-test-v1'); expect(a.delivery).toBe('cast');
    expect(b.theme).toBe('storm'); expect(isProceduralSequence(b.effect!)).toBe(true); expect(b.effect!.theme).toBe('storm');
    const wildVsFire = ctxFor('wild', 'fire');
    expect(play(wildVsFire, 'A').effect!.sequenceId).toBe('wild-maw-proof-v1'); expect(play(wildVsFire, 'A').delivery).toBe('melee');
    expect(play(wildVsFire, 'B').effect!.sequenceId).toBe('fire-delivery-test-v1');
    // a dodge row stages the dodging row's ATTACKER theme too
    const d = turnPlanInputFromTranscriptEvent({ dodge: true, an: 'Gale', dn: 'Ember' }, fireVsStorm); expect(d.kind === 'turn' && d.input.theme).toBe('storm');
  });
});
