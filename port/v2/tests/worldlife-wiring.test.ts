/* A6 part 2 — world-life wiring. (1) main.ts gate contract in source text (with mutation controls);
 * (2) the compiled-system-card accessor on the real accepted Earth landfall; (3) the adapter's
 * behaviour through fake pixi / stage / sprite / ticker objects: flag off → no work; flag on → adapter
 * bound over the vista sprite, rebinding on replacement, disposing with the vista, phone density,
 * reduced motion, total dispose; no wall clock, no Math.random. */
import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { systemFor } from '@cf/domain-worldgen';
import { resolveCF1WorldAddress, systemScene } from '@cf/scene';
import { buildBiomeVistaRenderRequestV1 } from '../apps/game/src/biome-vista-surface.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';
import { compileWorldLife, WORLD_LIFE_STREAK_CAP, type WorldLifeContainerLike, type WorldLifeGraphicsLike, type WorldLifeNodeLike } from '../apps/game/src/worldlife/index.js';
import { currentLandfallSystemCard, fnv1a32, mountWorldLifeStudy, mountWorldLifeStudyIfEnabled, worldLifeEnabled,
  type LandfallCardResult, type VistaSpriteLike, type WorldLifeStudyInput } from '../apps/game/src/worldlife-wiring.js';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const ARENA_CARD = (JSON.parse(readFileSync(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json', import.meta.url), 'utf8')) as { systemCard: string }).systemCard;

function gateViolations(source: string): string[] {
  const out: string[] = [], lines = source.split('\n');
  const gated = lines.filter((l) => l.includes("get('worldlife') === '1'") && l.includes("import('./worldlife-wiring.js')"));
  if (gated.length !== 1) out.push(`expected exactly one gated import line, found ${gated.length}`);
  for (const l of lines) if (l.includes("import('./worldlife-wiring.js')") && !l.includes("get('worldlife') === '1'")) out.push(`ungated dynamic import: ${l.trim().slice(0, 80)}`);
  for (const l of lines) if (/^\s*import\b/.test(l) && (l.includes("'./worldlife-wiring.js'") || l.includes("'./worldlife/"))) out.push(`static import: ${l.trim().slice(0, 80)}`);
  return out;
}

describe('main.ts worldlife gate (source text)', () => {
  it('imports worldlife-wiring only behind ?worldlife=1 and never statically', () => { expect(gateViolations(mainSource)).toEqual([]); });
  it('mutation controls bite', () => {
    expect(gateViolations(`${mainSource}\nimport { compileWorldLife } from './worldlife/spec.js';\n`)).not.toEqual([]);
    expect(gateViolations(`${mainSource}\nvoid import('./worldlife-wiring.js');\n`)).not.toEqual([]);
    expect(gateViolations(mainSource.replace("get('worldlife') === '1'", "get('worldlife') !== null"))).not.toEqual([]);
  });
  it('the gate passes the vista sprite accessor, the injected clock and the phone tier', () => {
    const line = mainSource.split('\n').find((l) => l.includes("import('./worldlife-wiring.js')"))!;
    expect(line).toContain('vistaSprite: () => surfaceVistaSprite'); expect(line).toContain('clock: () => performance.now()'); expect(line).toContain("tier: TOUCH_DPR ? 'phone' : 'desktop'"); expect(line).toContain('reducedMotion: () => !motionOK()');
    expect(worldLifeEnabled('?worldlife=1')).toBe(true); expect(worldLifeEnabled('?worldlife=0')).toBe(false); expect(worldLifeEnabled('')).toBe(false);
  });
});

/* The accepted Earth landfall (Sol 424242 / Earth 133), built exactly as local-ai-game.test.ts builds it. */
function canonicalEarth() {
  const star = { seed: 424242, x: 560, y: 170 }, address = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star, planet: { seed: 133 } });
  const planet = systemScene(star.seed).planets.find((row) => row.seed === 133); if (!address.ok || !planet) throw new Error('fixture');
  const built = canonicalWorldRoster(address.address, 0); if (!built.ok) throw new Error('fixture');
  return { roster: built.roster, request: buildBiomeVistaRenderRequestV1(planet, star.seed, built.roster.worldKey, systemFor(star.seed) as Record<string, unknown>, built.roster) };
}

describe('currentLandfallSystemCard (the kit compiler\'s card)', () => {
  beforeAll(() => installCaptureHooks());
  it('compiles the accepted Earth landfall to a card the world-life spec parses, deterministically', () => {
    const { request, roster } = canonicalEarth();
    const a = currentLandfallSystemCard(request, roster), b = currentLandfallSystemCard(request, roster);
    expect(a.ok).toBe(true); if (!a.ok) return;
    expect(a.card).toMatch(/^SYSTEM CARD - Sol \/ Earth/); expect(a.card).toMatch(/^ {2}Light: /m); expect(a.card).toMatch(/^ {2}Atmosphere: /m);
    expect(a).toEqual(b); expect(a.seed).toBe(fnv1a32(a.card));
    const spec = compileWorldLife(a.card, a.seed, 'landfall');
    expect(spec.surface).toBe('landfall'); expect(spec.card.biome).toBe('temperate');
  });
  it('fails closed with the compiler\'s reason for a refused roster or a retired kit', () => {
    const { request, roster } = canonicalEarth();
    const bad = currentLandfallSystemCard(request, { ...roster, worldKey: 'nope' });
    expect(bad.ok).toBe(false); if (!bad.ok) expect(bad.reason).toMatch(/refused/);
    const retired = currentLandfallSystemCard(request, roster, '# Some other kit\n');
    expect(retired.ok).toBe(false); if (!retired.ok) expect(retired.reason).toMatch(/kit compiler refused: Art Kit v4 required/);
  });
});

/* ---------- fakes ---------- */
class FakeNode implements WorldLifeNodeLike { x = 0; y = 0; alpha = 1; rotation = 0; visible = true; destroyed = false; parent: object | null = null; destroy(): void { this.destroyed = true; } }
class FakeGraphics extends FakeNode implements WorldLifeGraphicsLike { ops = 0; clear() { this.ops++; } moveTo() {} lineTo() {} circle() {} stroke() {} fill() {} }
class FakeContainer extends FakeNode implements WorldLifeContainerLike { children: WorldLifeNodeLike[] = []; addChild(c: WorldLifeNodeLike) { this.children.push(c); } removeChild(c: WorldLifeNodeLike) { this.children = this.children.filter((x) => x !== c); } }
class FakeStage { children: object[] = []; addChildAt(c: object, i: number) { this.children.splice(i, 0, c); (c as FakeNode).parent = this; } add(c: object) { this.children.push(c); (c as FakeNode).parent = this; } remove(c: object) { this.children = this.children.filter((x) => x !== c); (c as FakeNode).parent = null; } }
class FakeSprite implements VistaSpriteLike { destroyed = false; parent: object | null = null; constructor(public x: number, public y: number, public width: number, public height: number) {} }
const fakeTicker = () => { const fns = new Set<() => void>(); return { fns, add: (fn: () => void) => { fns.add(fn); }, remove: (fn: () => void) => { fns.delete(fn); }, step: () => { for (const fn of [...fns]) fn(); } }; };
const CARD: LandfallCardResult = { ok: true, card: ARENA_CARD, seed: 593405465 };
function harness(over: Partial<WorldLifeStudyInput> = {}) {
  const stage = new FakeStage(), ticker = fakeTicker(), counts = { container: 0, graphics: 0 };
  let sprite: FakeSprite | null = null, now = 0, reduced = false;
  const listeners = new Map<string, Set<EventListener>>();
  const win = { addEventListener: (t: string, fn: EventListener) => { (listeners.get(t) ?? listeners.set(t, new Set()).get(t)!).add(fn); }, removeEventListener: (t: string, fn: EventListener) => { listeners.get(t)?.delete(fn); } } as unknown as NonNullable<WorldLifeStudyInput['win']>;
  const input: WorldLifeStudyInput = {
    request: null, roster: null, stage, vistaSprite: () => sprite, ticker, clock: () => now, reducedMotion: () => reduced, tier: 'desktop', card: CARD, win,
    pixi: { Container: class extends FakeContainer { constructor() { super(); counts.container++; } }, Graphics: class extends FakeGraphics { constructor() { super(); counts.graphics++; } } },
    ...over,
  };
  return { stage, ticker, counts, input, listeners, setSprite: (s: FakeSprite | null) => { sprite = s; }, setNow: (ms: number) => { now = ms; }, setReduced: (r: boolean) => { reduced = r; } };
}

describe('world-life wiring (fake pixi, stage, sprite, ticker, clock)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('flag off: no work at all', () => {
    const h = harness();
    expect(mountWorldLifeStudyIfEnabled('', h.input)).toBeNull(); expect(mountWorldLifeStudyIfEnabled('?worldlife=0', h.input)).toBeNull();
    expect(h.counts).toEqual({ container: 0, graphics: 0 }); expect(h.ticker.fns.size).toBe(0); expect(h.stage.children).toEqual([]);
  });

  it('flag on: waits for the vista sprite, binds over it, rebinds on replacement, disposes with the vista, then totally', () => {
    const h = harness();
    const handle = mountWorldLifeStudyIfEnabled('?worldlife=1', h.input)!;
    expect(handle).not.toBeNull(); expect(h.ticker.fns.size).toBe(1);
    expect(handle.status()).toMatchObject({ phase: 'idle', binds: 0, ticks: 1 }); expect(handle.container()).toBeNull(); expect(h.counts.container).toBe(0);
    expect(handle.status().spec?.card.biome).toBe('temperate'); expect(handle.status().spec?.precipitation?.kind).toBe('rain');
    // The vista appears: the adapter container sits immediately above the sprite, sized and placed to its centre-anchored bounds.
    const sprite = new FakeSprite(500, 300, 800, 400); h.stage.add(new FakeNode()); h.stage.add(sprite); h.stage.add(new FakeNode()); h.setSprite(sprite);
    h.ticker.step();
    const c1 = handle.container() as FakeContainer | null; expect(c1).not.toBeNull();
    expect(handle.status()).toMatchObject({ phase: 'bound', binds: 1, reduced: false });
    expect(h.stage.children.indexOf(c1!)).toBe(h.stage.children.indexOf(sprite) + 1); expect([c1!.x, c1!.y]).toEqual([100, 100]);
    expect(c1!.children.length).toBeGreaterThan(0);
    // The sprite moves and resizes: the container follows.
    sprite.x = 640; sprite.y = 360; sprite.width = 1280; sprite.height = 640; h.setNow(500); h.ticker.step();
    expect([c1!.x, c1!.y]).toEqual([0, 40]); expect(handle.container()).toBe(c1);
    // Reduced motion is re-read every tick.
    h.setReduced(true); h.ticker.step(); expect(handle.status().reduced).toBe(true); h.setReduced(false); h.ticker.step(); expect(handle.status().reduced).toBe(false);
    // main.ts swaps the sprite (crossfade successor): the old adapter is disposed and a new one bound over the successor.
    const successor = new FakeSprite(500, 300, 800, 400); h.stage.add(successor); h.setSprite(successor); h.ticker.step();
    const c2 = handle.container() as FakeContainer; expect(c2).not.toBe(c1); expect(c1!.destroyed).toBe(true); expect(handle.status().binds).toBe(2);
    expect(h.stage.children.indexOf(c2)).toBe(h.stage.children.indexOf(successor) + 1);
    // The vista is released (sprite destroyed): the adapter disposes with it and the study idles.
    successor.destroyed = true; h.stage.remove(successor); h.ticker.step();
    expect(c2.destroyed).toBe(true); expect(handle.container()).toBeNull(); expect(handle.status().phase).toBe('idle');
    // A sprite with no parent is not live either.
    const orphan = new FakeSprite(1, 1, 2, 2); h.setSprite(orphan); h.ticker.step(); expect(handle.status().binds).toBe(2);
    // Total dispose releases the ticker and the listeners.
    handle.dispose('test'); expect(h.ticker.fns.size).toBe(0); expect(handle.status()).toMatchObject({ phase: 'disposed', reason: 'test' }); expect([...(h.listeners.get('pagehide') ?? [])]).toHaveLength(0);
    handle.dispose();
  });

  it('binds at the phone streak cap on phones and at the desktop cap otherwise; the spec is deterministic', () => {
    const desktop = mountWorldLifeStudy(harness({ tier: 'desktop' }).input), phone = mountWorldLifeStudy(harness({ tier: 'phone' }).input);
    const d = desktop.status().spec!, p = phone.status().spec!;
    expect(desktop.status().phase).toBe('disposed'); // superseded by the phone study (one study at a time)
    expect(p.precipitation!.count).toBeLessThanOrEqual(WORLD_LIFE_STREAK_CAP.phone); expect(d.precipitation!.count).toBeGreaterThan(p.precipitation!.count);
    expect(JSON.stringify(mountWorldLifeStudy(harness({ tier: 'phone' }).input).status().spec)).toBe(JSON.stringify(p));
    phone.dispose();
  });

  it('no wall clock and no Math.random across binding and ticking; the injected clock alone advances the layer', () => {
    const h = harness(); const handle = mountWorldLifeStudy(h.input);
    const sprite = new FakeSprite(500, 300, 800, 400); h.stage.add(sprite); h.setSprite(sprite);
    const perfNow = vi.spyOn(performance, 'now'), dateNow = vi.spyOn(Date, 'now'), random = vi.spyOn(Math, 'random');
    h.ticker.step(); const g0 = (handle.container() as FakeContainer).children.map((n) => (n as FakeGraphics).ops ?? 0);
    h.setNow(1000); h.ticker.step(); const g1 = (handle.container() as FakeContainer).children.map((n) => (n as FakeGraphics).ops ?? 0);
    const calls = perfNow.mock.calls.length + dateNow.mock.calls.length + random.mock.calls.length;
    perfNow.mockRestore(); dateNow.mockRestore(); random.mockRestore();
    expect(calls).toBe(0); expect(g1.some((v, i) => v > (g0[i] ?? 0))).toBe(true);
    handle.dispose();
  });

  it('a refused card fails closed: no ticker, no nodes, a named reason; pagehide disposes a live study', () => {
    const h = harness({ card: { ok: false, reason: 'kit compiler refused: Unsupported star/planet card' } });
    const failed = mountWorldLifeStudy(h.input);
    expect(failed.status()).toMatchObject({ phase: 'failed', reason: expect.stringContaining('Unsupported star/planet card') }); expect(h.ticker.fns.size).toBe(0); expect(h.counts.container).toBe(0);
    const unknown = mountWorldLifeStudy(harness({ card: { ok: true, card: ARENA_CARD.replace('weather rain', 'weather plasma'), seed: 1 } }).input);
    expect(unknown.status()).toMatchObject({ phase: 'failed', reason: expect.stringContaining('weather-unknown') });
    const live = harness(); const handle = mountWorldLifeStudy(live.input); expect(live.ticker.fns.size).toBe(1);
    for (const fn of live.listeners.get('pagehide') ?? []) fn({ type: 'pagehide', persisted: true } as unknown as Event);
    expect(live.ticker.fns.size).toBe(0); expect(handle.status().phase).not.toBe('disposed');
    for (const fn of live.listeners.get('pageshow') ?? []) fn({ type: 'pageshow', persisted: true } as unknown as Event);
    expect(live.ticker.fns.size).toBe(1);
    for (const fn of live.listeners.get('pagehide') ?? []) fn({ type: 'pagehide', persisted: false } as unknown as Event);
    expect(handle.status()).toMatchObject({ phase: 'disposed', reason: 'pagehide' }); expect(live.ticker.fns.size).toBe(0);
  });
});
