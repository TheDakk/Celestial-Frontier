/* A6 part 2 — battle2 wiring. Two kinds of check: (1) the main.ts gate exists and is the ONLY route
 * into battle2/ (source-text checks, because the gate itself is the thing under test; a mutation
 * control proves the checker bites); (2) the adapter's behaviour through fake pixi / asset / ticker
 * objects: flag off → no work; flag on → stage constructed, ticker attached, turns advance on the
 * injected clock, dispose releases everything; no wall clock, no Math.random. */
import { readFileSync } from 'node:fs';
// Lives beside the app (not under tests/): its closure reaches Codex's pixi-backed creature-rig, whose @webgpu/types
// collide with lib.dom in the fully strict root program (apps/game/tsconfig.json _skipLibCheckReason).
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { speciesVisualKey } from '@cf/art/species-identity';
import { FIXTURE_RIG_LABEL, PORTRAIT_RIG_LABEL, type FixturePartCut } from './battle2/index.js';
import { BATTLE2_ASSETS, PLAYER_PLACEHOLDER_LABEL, alphaBox, battle2Enabled, fnv1a32, genomeMass, genomeSeed, genomeTheme, matchRecord, mountBattle2Study, mountBattle2StudyIfEnabled,
  type Battle2AssetSource, type Battle2Image, type Battle2Keyer, type Battle2PixiBindings, type Battle2Raster, type Battle2StudyInput } from './battle2-wiring.js';
import type { ResolvedAnatomyRecord } from './motion/body-card.js';
import { civetRecord } from '../../../tools/motion-proof/fixtures.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };
const mainSource = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
const AUDIT = new URL('../../../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/', import.meta.url);
const auditJson = (name: string): unknown => JSON.parse(readFileSync(new URL(name, AUDIT), 'utf8'));

/** The gate contract: the flag test and the dynamic import share one line; battle2 is never imported statically. */
function gateViolations(source: string, flag: string, module: string, dir: string): string[] {
  const out: string[] = [];
  const lines = source.split('\n');
  const gated = lines.filter((l) => l.includes(`get('${flag}') === '1'`) && l.includes(`import('./${module}.js')`));
  if (gated.length !== 1) out.push(`expected exactly one gated import line, found ${gated.length}`);
  for (const l of lines) if (l.includes(`import('./${module}.js')`) && !l.includes(`get('${flag}') === '1'`)) out.push(`ungated dynamic import: ${l.trim().slice(0, 80)}`);
  for (const l of lines) if (/^\s*import\b/.test(l) && (l.includes(`'./${module}.js'`) || l.includes(`'./${dir}/`))) out.push(`static import: ${l.trim().slice(0, 80)}`);
  for (const l of lines) if (/\bfrom '\.\/(battle2|worldlife|effects|motion|soundkit)\//.test(l)) out.push(`static import of a study module: ${l.trim().slice(0, 80)}`);
  return out;
}

describe('main.ts battle2 gate (source text)', () => {
  it('imports battle2-wiring only behind ?battle2=1 and never statically', () => {
    expect(gateViolations(mainSource, 'battle2', 'battle2-wiring', 'battle2')).toEqual([]);
  });
  it('mutation controls: a static import, an ungated dynamic import, or a missing gate all fail the check', () => {
    expect(gateViolations(`${mainSource}\nimport { BattleStage } from './battle2/stage.js';\n`, 'battle2', 'battle2-wiring', 'battle2')).not.toEqual([]);
    expect(gateViolations(`${mainSource}\nvoid import('./battle2-wiring.js');\n`, 'battle2', 'battle2-wiring', 'battle2')).not.toEqual([]);
    expect(gateViolations(mainSource.replace("get('battle2') === '1'", "get('battle2') !== null"), 'battle2', 'battle2-wiring', 'battle2')).not.toEqual([]);
  });
  it('neither wiring module reads a wall clock or Math.random outside comments (the clock is injected by main.ts)', () => {
    for (const file of ['battle2-wiring.ts', 'worldlife-wiring.ts']) {
      const code = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8').split('\n').filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join('\n');
      expect(code, file).not.toMatch(/Math\.random|Date\.now|performance\.now/);
    }
  });
  it('battle2Enabled reads exactly the flag the gate reads', () => {
    expect(battle2Enabled('?battle2=1')).toBe(true); expect(battle2Enabled('?battle2=1&worldlife=1')).toBe(true);
    expect(battle2Enabled('')).toBe(false); expect(battle2Enabled('?battle2=0')).toBe(false); expect(battle2Enabled('?battle2')).toBe(false);
  });
});

/* ---------- fakes ---------- */
class Node { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; destroyed = false; text = ''; children: object[] = []; ops = 0;
  readonly scale = { set: (_x: number, _y: number) => {} }; readonly anchor = { set: (_x: number, _y: number) => {} };
  addChild(c: object) { this.children.push(c); } addChildAt(c: object, i: number) { this.children.splice(i, 0, c); } removeChild(c: object) { this.children = this.children.filter((x) => x !== c); }
  clear() { this.ops++; } rect() { this.ops++; } fill() { this.ops++; } moveTo() {} lineTo() {} circle() {} stroke() {}
  addParticle(...p: object[]) { this.children.push(...p); } removeParticle(...p: object[]) { this.children = this.children.filter((x) => !p.includes(x)); } destroy() { this.destroyed = true; } }
class FakeApp { static made: FakeApp[] = []; initOptions: Record<string, unknown> | null = null; renders = 0; destroyed = false; readonly canvas: HTMLCanvasElement; readonly stage = new Node();
  readonly renderer = { render: () => { this.renders++; } };
  constructor(doc: Document) { this.canvas = doc.createElement('canvas'); FakeApp.made.push(this); }
  async init(o: Record<string, unknown>) { this.initOptions = o; } destroy() { this.destroyed = true; } }
function fakePixi(doc: Document) {
  const counts = { container: 0, sprite: 0, text: 0, graphics: 0, particle: 0, particleContainer: 0, texture: 0 };
  const pixi: Battle2PixiBindings = {
    Application: class { constructor() { return new FakeApp(doc); } } as unknown as Battle2PixiBindings['Application'],
    Container: class extends Node { constructor() { super(); counts.container++; } },
    Sprite: class extends Node { constructor(_t: unknown) { super(); counts.sprite++; } },
    Text: class extends Node { constructor(o: { text: string }) { super(); this.text = o.text; counts.text++; } },
    Graphics: class extends Node { constructor() { super(); counts.graphics++; } },
    Texture: { from: (source: unknown) => { counts.texture++; const s = source as { width?: number; height?: number }; return { width: s.width ?? 8, height: s.height ?? 8 }; } },
    Particle: class { x = 0; y = 0; scaleX = 1; scaleY = 1; anchorX = 0; anchorY = 0; rotation = 0; alpha = 1; constructor(_t: unknown) { counts.particle++; } },
    ParticleContainer: class extends Node { constructor(_o: unknown) { super(); counts.particleContainer++; } },
  };
  return { pixi, counts };
}
const image = (width: number, height: number, alphaRect: [number, number, number, number] | null, tag = ''): Battle2Image => ({ width, height, source: { width, height, tag }, pixels: () => {
  const px = new Uint8ClampedArray(width * height * 4);
  if (alphaRect) { const [x0, y0, w, h] = alphaRect; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * width + x) * 4; px[i] = 200; px[i + 1] = 150; px[i + 2] = 100; px[i + 3] = 255; } }
  return px; } });
const raster: Battle2Raster = (rgba, width, height) => ({ width, height, source: { width, height, tag: 'raster' }, pixels: () => rgba });
const MASTER = { w: 120, h: 120 };
/** Synthetic keyer: every pixel of the master's painted band is opaque, so the fixture cut has parts. */
const keyer: Battle2Keyer = (rgba, w, h) => { const alpha = new Uint8Array(w * h); for (let y = 30; y < 100; y++) for (let x = 5; x < 115; x++) alpha[y * w + x] = 255; return { alpha, rgba, bounds: { x: 5, y: 30, width: 110, height: 70 } }; };
function fakeAssets() {
  const calls: string[] = [];
  const assets: Battle2AssetSource = {
    json: async (path) => { calls.push(path); if (path === BATTLE2_ASSETS.recipe) return auditJson('arena-recipe.json'); if (path === BATTLE2_ASSETS.anchors) return auditJson('wild-anchors.json'); if (path === BATTLE2_ASSETS.civetRecord) return civetRecord(); throw new Error(`unexpected json ${path}`); },
    image: async (path) => { calls.push(path); if (path === BATTLE2_ASSETS.civetMaster) return image(MASTER.w, MASTER.h, [5, 30, 110, 70], path); return image(1672, 941, null, path); },
  };
  return { assets, calls };
}
const fakeTicker = () => { const fns = new Set<() => void>(); return { fns, add: (fn: () => void) => { fns.add(fn); }, remove: (fn: () => void) => { fns.delete(fn); }, step: () => { for (const fn of [...fns]) fn(); } }; };
/** Rebuilds the genome the Civet record was keyed from, from its own visual key (the key is a stable JSON encoding). */
function genomeFromVisualKey(key: string): Record<string, unknown> {
  const decode = (node: unknown): unknown => { const [kind, v] = node as [string, unknown]; if (kind === 'number') return Number(v); if (kind === 'null') return null; if (kind === 'array') return (v as unknown[]).map(decode); if (kind === 'object') return Object.fromEntries((v as [string, unknown][]).map(([k, n]) => [k, decode(n)])); return v; };
  return decode(JSON.parse(key)) as Record<string, unknown>;
}
const LOG = [
  { side: 'A', an: 'Civet', dn: 'Platypus', dmg: 12, crit: false, hpA: 30, hpB: 18 },
  { tick: true, bA: 0, bB: 1, rA: 0, rB: 0, hpA: 30, hpB: 17 },
  { side: 'B', an: 'Platypus', dn: 'Civet', dmg: 7, crit: true, hpA: 23, hpB: 17 },
];
function harness(over: Partial<Battle2StudyInput> = {}) {
  const dom = new JSDOM('<body><div id="panel"><div id="mount" data-combat-chronicle-generation="7"><ol data-combat-chronicle-log></ol></div></div></body>');
  const doc = dom.window.document, mount = doc.getElementById('mount')!;
  const { pixi, counts } = fakePixi(doc), { assets, calls } = fakeAssets(), ticker = fakeTicker();
  let now = 0; const clock = () => now;
  const listeners = new Map<string, Set<EventListener>>();
  const win = { addEventListener: (t: string, fn: EventListener) => { (listeners.get(t) ?? listeners.set(t, new Set()).get(t)!).add(fn); }, removeEventListener: (t: string, fn: EventListener) => { listeners.get(t)?.delete(fn); }, MutationObserver: dom.window.MutationObserver } as unknown as NonNullable<Battle2StudyInput['win']>;
  const genome = genomeFromVisualKey(civetRecord().identity.speciesVisualKey);
  const input: Battle2StudyInput = {
    mount, generation: 7, ticker, clock, reducedMotion: false, deviceTier: 'medium', pixi, artLoader: null, assets, keyer, raster, records: [civetRecord()], win,
    settlement: { battleId: 'battle-1', champion: { kind: 'owned-fauna', name: 'Civet', genome }, encounter: { defender: { battleGenome: { seed: 424242, size: 2, kingdom: 'fauna' } } }, transcript: { log: LOG } },
    chronicle: { championName: 'Civet', defenderName: 'Platypus' },
    portrait: async () => image(132, 132, [20, 30, 90, 96], 'thumb'),
    ...over,
  };
  return { dom, doc, mount, pixi, counts, assets, calls, ticker, clock, setNow: (ms: number) => { now = ms; }, listeners, input, genome };
}
const fire = (h: ReturnType<typeof harness>, type: string, persisted: boolean) => { for (const fn of h.listeners.get(type) ?? []) fn({ type, persisted } as unknown as Event); };

describe('battle2 wiring (fake pixi, assets, ticker, clock)', () => {
  afterEach(() => { vi.restoreAllMocks(); FakeApp.made = []; });

  it('flag off: mountBattle2StudyIfEnabled does no work at all', () => {
    const h = harness();
    expect(mountBattle2StudyIfEnabled('', h.input)).toBeNull(); expect(mountBattle2StudyIfEnabled('?battle2=0', h.input)).toBeNull();
    expect(h.counts).toEqual({ container: 0, sprite: 0, text: 0, graphics: 0, particle: 0, particleContainer: 0, texture: 0 });
    expect(h.calls).toEqual([]); expect(h.ticker.fns.size).toBe(0); expect(h.mount.querySelector('[data-battle2-stage]')).toBeNull(); expect(FakeApp.made).toHaveLength(0);
  });

  it('flag on: builds the stage (Civet fixture rig + portrait fallback), attaches the ticker, advances turns on the injected clock, disposes totally', async () => {
    const h = harness();
    const handle = mountBattle2StudyIfEnabled('?battle2=1', h.input)!;
    expect(handle).not.toBeNull(); expect(handle.status().phase).toBe('loading');
    const section = h.mount.querySelector<HTMLElement>('[data-battle2-stage]')!;
    expect(section).not.toBeNull(); expect(section.getAttribute('aria-hidden')).toBe('true'); expect(section.dataset.battle2Generation).toBe('7');
    const ready = await handle.ready;
    expect(ready.reason).toBeNull(); expect(ready.phase).toBe('playing');
    expect(ready.rigs).toEqual({ left: FIXTURE_RIG_LABEL, right: PORTRAIT_RIG_LABEL });
    expect(ready.label).toContain(FIXTURE_RIG_LABEL); expect(section.dataset.battle2Label).toBe(ready.label);
    expect(ready.turns).toBe(2); expect(ready.skipped).toEqual([expect.stringContaining('parts rig needs raw asset bytes; fixture fallback'), expect.stringContaining('tick')]); // E1: a byte-less asset source cannot build a parts rig; the fixture path is labelled expect(ready.turnIndex).toBe(0);
    // B2: each combatant plays its own ability theme (combat domain abilityTheme); Wild is painted, every other theme is the labelled procedural emitter.
    const themeRe = /^(fire|frost|storm|tide|stone|venom|void|sand|chem|psionic|wild): (painted sequence|procedural emitter effect \(labelled;)/;
    expect(ready.effects.left).toMatch(themeRe); expect(ready.effects.right).toMatch(themeRe);
    expect(ready.effects.left).toBe(`${genomeTheme(h.genome)}: ${genomeTheme(h.genome) === 'wild' ? 'painted sequence' : 'procedural emitter effect (labelled; no painted sequence for this theme yet)'}`);
    // Assets resolved by their audit paths, the Civet master keyed, the three Wild phase images fetched.
    expect(h.calls).toEqual(expect.arrayContaining([BATTLE2_ASSETS.recipe, BATTLE2_ASSETS.anchors, BATTLE2_ASSETS.far, BATTLE2_ASSETS.mid, BATTLE2_ASSETS.near, BATTLE2_ASSETS.civetMaster, 'keyed/wild-launch.png', 'keyed/wild-travel.png', 'keyed/wild-impact.png']));
    // The renderer: one Application, initialised at the 1024×576 frame, its canvas inside the study section, driven by the injected ticker.
    expect(FakeApp.made).toHaveLength(1); const app = FakeApp.made[0]!;
    expect(app.initOptions).toMatchObject({ width: 1024, height: 576, autoStart: false }); expect(section.contains(app.canvas)).toBe(true);
    expect(app.stage.children).toHaveLength(1); expect(h.ticker.fns.size).toBe(1); expect(app.renders).toBe(1);
    expect(h.counts.particleContainer).toBeGreaterThanOrEqual(1); expect(h.counts.sprite).toBeGreaterThan(19); // 19 fixture parts + portrait + plates + effect phases
    // Turns advance only through the injected clock: turn 2 starts when turn 1 is done, then the study finishes and releases the ticker.
    // (performance.now is spied only across the synchronous ticks and read back before any expect: the vitest runner
    //  itself reads performance.now around awaits and inside expect, so the count is taken first.)
    const perfNow = vi.spyOn(performance, 'now'), dateNow = vi.spyOn(Date, 'now'), random = vi.spyOn(Math, 'random');
    h.setNow(10); h.ticker.step(); const s1 = handle.status(), r1 = app.renders;
    h.setNow(20_000); h.ticker.step(); const s2 = handle.status();
    h.setNow(60_000); h.ticker.step(); const s3 = handle.status(), tickerAfter = h.ticker.fns.size, clockCalls = perfNow.mock.calls.length + dateNow.mock.calls.length + random.mock.calls.length;
    perfNow.mockRestore(); dateNow.mockRestore(); random.mockRestore();
    expect(s1.turnIndex).toBe(0); expect(r1).toBe(2);
    expect(s2.turnIndex).toBe(1); expect(s2.phase).toBe('playing');
    expect(s3.phase).toBe('finished'); expect(tickerAfter).toBe(0); expect(section.dataset.battle2Status).toBe('finished');
    expect(clockCalls).toBe(0);
    // Dispose releases the renderer, the section and the listeners.
    handle.dispose('test');
    expect(app.destroyed).toBe(true); expect(h.mount.querySelector('[data-battle2-stage]')).toBeNull(); expect(handle.status()).toMatchObject({ phase: 'disposed', reason: 'test' });
    expect([...(h.listeners.get('pagehide') ?? [])]).toHaveLength(0);
    handle.dispose(); // idempotent
  });

  it('a player champion gets the labelled placeholder; a genome matched by _earthName also takes the fixture rig; themes follow the combat domain', async () => {
    const h = harness({ settlement: { battleId: 'battle-2', champion: { kind: 'player', name: 'Explorer' }, encounter: { defender: { battleGenome: { _earthName: 'Civet', seed: 9, size: 1, loco: 3 } } }, transcript: { log: [{ side: 'A', an: 'Explorer', dn: 'Civet', dmg: 3, hpA: 10, hpB: 5 }, { side: 'B', an: 'Civet', dn: 'Explorer', dmg: 2, hpA: 8, hpB: 5 }] } }, chronicle: { championName: 'Explorer', defenderName: 'Civet' } });
    const handle = mountBattle2Study(h.input); const s = await handle.ready;
    expect(s.phase).toBe('playing'); expect(s.rigs).toEqual({ left: PLAYER_PLACEHOLDER_LABEL, right: FIXTURE_RIG_LABEL });
    expect(genomeTheme(null)).toBe('wild'); expect(genomeTheme({ loco: 3 })).toBe('storm'); expect(genomeTheme({ loco: 4 })).toBe('tide'); expect(genomeTheme({ loco: 1 })).toBe('stone');
    expect(s.effects).toEqual({ left: 'wild: painted sequence', right: 'storm: procedural emitter effect (labelled; no painted sequence for this theme yet)' });
    // The storm turn (B) plays with no phase sprite: only the particle container joins the effect layer, and the far plate is never used as a phase texture.
    const spritesBefore = h.counts.sprite; h.setNow(20_000); h.ticker.step(); expect(handle.status().turnIndex).toBe(1); expect(h.counts.sprite).toBe(spritesBefore);
    handle.dispose();
  });

  it('reduced motion builds without an effects host; a transcript with no stageable row fails closed with a reason', async () => {
    const h = harness({ reducedMotion: true });
    const handle = mountBattle2Study(h.input); expect((await handle.ready).phase).toBe('playing'); expect(h.counts.particleContainer).toBe(0); handle.dispose();
    const empty = harness({ settlement: { ...h.input.settlement, transcript: { log: [{ tick: true }, { stun: true }] } } });
    const failed = mountBattle2Study(empty.input); const st = await failed.ready;
    expect(st.phase).toBe('failed'); expect(st.reason).toContain('no stageable turn'); expect(empty.ticker.fns.size).toBe(0); expect(FakeApp.made).toHaveLength(1); failed.dispose();
  });

  it('dispose during loading, pagehide, mount replacement and a superseding study all tear down', async () => {
    const a = harness(); const early = mountBattle2Study(a.input); early.dispose('early');
    const s = await early.ready; expect(s.phase).toBe('disposed'); expect(a.ticker.fns.size).toBe(0); expect(a.mount.querySelector('[data-battle2-stage]')).toBeNull();
    expect(FakeApp.made.every((app) => app.destroyed || app.initOptions === null)).toBe(true);
    const b = harness(); const bfc = mountBattle2Study(b.input); await bfc.ready; expect(b.ticker.fns.size).toBe(1);
    fire(b, 'pagehide', true); expect(b.ticker.fns.size).toBe(0); expect(bfc.status().phase).toBe('playing');
    fire(b, 'pageshow', true); expect(b.ticker.fns.size).toBe(1);
    fire(b, 'pagehide', false); expect(bfc.status()).toMatchObject({ phase: 'disposed', reason: 'pagehide' }); expect(b.ticker.fns.size).toBe(0);
    const c = harness(); const gen = mountBattle2Study(c.input); await gen.ready;
    c.mount.dataset.combatChronicleGeneration = '8'; await new Promise((r) => setTimeout(r, 0));
    expect(gen.status()).toMatchObject({ phase: 'disposed', reason: 'chronicle generation replaced' });
    const d = harness(); const first = mountBattle2Study(d.input); await first.ready; const second = mountBattle2Study(harness().input); await second.ready;
    expect(first.status().phase).toBe('disposed'); expect(second.status().phase).toBe('playing'); second.dispose();
    const e = harness(); const gone = mountBattle2Study(e.input); await gone.ready; e.mount.remove(); e.ticker.step();
    expect(gone.status()).toMatchObject({ phase: 'disposed', reason: 'mount left the document' });
  });

  it('pure helpers: record matching by visual key or Earth name, genome mass/seed, alpha box, fnv', () => {
    const rec = civetRecord(), genome = genomeFromVisualKey(rec.identity.speciesVisualKey);
    expect(speciesVisualKey(genome)).toBe(rec.identity.speciesVisualKey);
    expect(matchRecord([rec], genome)).toBe(rec); expect(matchRecord([rec], { _earthName: 'Civet' })).toBe(rec);
    expect(matchRecord([rec], { seed: 1, size: 2 })).toBeNull(); expect(matchRecord([rec], null)).toBeNull();
    const other: ResolvedAnatomyRecord = { ...rec, identity: { ...rec.identity, speciesVisualKey: 'x', earthName: 'Red Fox' } };
    expect(matchRecord([other, rec], genome)).toBe(rec);
    expect(genomeMass({ size: 0 })).toBe(0.7); expect(genomeMass({ size: 5 })).toBe(1.6); expect(genomeMass({ size: 7 })).toBe(0.85); expect(genomeMass(null)).toBe(1);
    expect(genomeSeed({ seed: 3212817920 }, 'x')).toBe(3212817920); expect(genomeSeed(null, 'battle-1:left:Civet')).toBe(fnv1a32('battle-1:left:Civet')); expect(fnv1a32('a')).toBe(fnv1a32('a')); expect(fnv1a32('a')).not.toBe(fnv1a32('b'));
    expect(alphaBox(image(10, 10, [2, 3, 4, 5]).pixels(), 10, 10)).toEqual({ x: 2, y: 3, width: 4, height: 5 }); expect(alphaBox(image(4, 4, null).pixels(), 4, 4)).toEqual({ x: 0, y: 0, width: 4, height: 4 });
  });

  it('assets are a dev-only fetch: a build that inlined arena-recipe.json fails closed with a named reason', async () => {
    const { devAssetSource } = await import('./battle2-wiring.js');
    expect(() => devAssetSource('data:application/json;base64,e30=', 'http://localhost/')).toThrow(/dev-only fetch/);
    const src = devAssetSource('/@fs/repo/audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json', 'http://localhost:5173/');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(src.json(BATTLE2_ASSETS.civetRecord)).rejects.toThrow(/HTTP 404/);
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5173/@fs/repo/audits/CIVET_2D_PROOF_20260912/civet.landmarks.json');
  });
});

// Keeps the part type referenced so a rename in fixture-rig surfaces here as a type error.
const _partTypeGuard: FixturePartCut | null = null; void _partTypeGuard;
