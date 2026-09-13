/// <reference types="vite/client" />
/** @module worldlife-wiring [app] — the flag-gated adapter that mounts the A5 world-life layer over
 * the live landfall vista (WORK_ORDER: one adapter file per module, one guarded call in main.ts).
 * Nothing here runs unless `?worldlife=1` is in the URL: main.ts only `import()`s this file inside
 * that gate, so the ordinary vista path is untouched.
 *
 * The world-life card is read from the SAME compiled system card the kit runtime produces for the
 * landfall painter: `buildCanonicalLandfallConditioningV1(request, roster)` → `compileEarthArtKitV4(
 * sourceSnapshot, ART_KIT)` → `.systemCard` (the `  Light:` / `  Atmosphere:` lines the spec parses).
 * That compiler admits only the accepted Sol/Earth card today, so other landfalls fail closed with the
 * compiler's own reason and mount nothing. The seed is derived from the card text (no clock).
 *
 * Lifecycle: the study polls the vista sprite accessor on the injected ticker. When a live sprite is
 * present it binds an adapter over it (container inserted right above the sprite, sized to the
 * sprite's on-screen bounds), rebinds when main.ts replaces the sprite (crossfade successor), and
 * disposes the adapter when the sprite is destroyed or leaves the stage ("disposes with the vista").
 * Phones (`tier: 'phone'`) compile at the reduced streak cap; reduced motion is re-read every tick.
 * Batch 3 (B8): resident idle life. When the study is given the world's roster rows and a portrait source, the
 * fauna rows are planned into one to three residents (tier-bounded, seeded from the card) standing in a depth
 * band around the ground line, each a whole-portrait rig breathing its idle clip with an occasional alert, drawn
 * in the same container as the weather so they bind, resize and dispose with the vista.
 * Not yet done here: foliage sway (no foliage nodes exist on a flat vista sprite) and non-Earth cards
 * (waiting on the kit compiler admitting them). */
import kit from '../../../../../ART_KIT.md?raw';
import { buildCanonicalLandfallConditioningV1, compileEarthArtKitV4 } from './landfall-conditioning.js';
import { compileWorldLife, WorldLifePixiAdapter, WorldLifeRefusal, planResidents, ResidentIdleLayer, type ResidentCandidate, type ResidentNodeLike, type ResidentPlanV1, type ResidentStatus, type WorldLifeContainerLike, type WorldLifeGraphicsLike, type WorldLifeSpecV1, type WorldLifeTierV1 } from './worldlife/index.js';
import type { RigSpriteLike } from './battle2/fixture-rig.js';
import type { SpeciesArtLoader } from './species-art-loader.js';
import { loaderPortrait, type PortraitImage, type PortraitProvider } from './species-portrait.js';

export const WORLDLIFE_FLAG = 'worldlife' as const;
export function worldLifeEnabled(search: string): boolean { return new URLSearchParams(search).get(WORLDLIFE_FLAG) === '1'; }

export type LandfallCardResult = Readonly<{ ok: true; card: string; seed: number }> | Readonly<{ ok: false; reason: string }>;
export function fnv1a32(text: string): number { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
/** The accessor: the compiled system card of the current landfall, exactly as the kit runtime compiles it. */
export function currentLandfallSystemCard(request: unknown, roster: unknown, kitText: string = kit): LandfallCardResult {
  const compiled = buildCanonicalLandfallConditioningV1(request, roster);
  if (!compiled.ok) return { ok: false, reason: `landfall conditioning refused: ${compiled.reason}` };
  try {
    const card = compileEarthArtKitV4(compiled.recipe.sourceSnapshot, kitText).systemCard;
    if (typeof card !== 'string' || !card) return { ok: false, reason: 'kit compiler produced no system card' };
    return { ok: true, card, seed: fnv1a32(card) };
  } catch (error) { return { ok: false, reason: `kit compiler refused: ${error instanceof Error ? error.message : String(error)}` }; }
}

/* ---------- structural inputs (pixi.js is never imported here; main.ts passes its classes) ---------- */
export interface VistaSpriteLike { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly destroyed: boolean; readonly parent: object | null; }
export interface VistaStageLike { readonly children: readonly object[]; addChildAt(child: object, index: number): unknown; }
export interface WorldLifeNode extends WorldLifeContainerLike { readonly parent?: object | null; }
export interface WorldLifeTickerLike { add(fn: () => void): unknown; remove(fn: () => void): unknown; }
export interface WorldLifeStudyInput {
  readonly request: unknown; readonly roster: unknown;
  readonly stage: VistaStageLike;
  /** main.ts's current vista sprite (null while the vista is loading or after it was released). */
  readonly vistaSprite: () => VistaSpriteLike | null;
  readonly ticker: WorldLifeTickerLike;
  /** Injected playback clock in ms (main.ts passes performance.now); compilation never reads it. */
  readonly clock: () => number;
  readonly reducedMotion: () => boolean;
  readonly tier: WorldLifeTierV1;
  readonly pixi: { Container: new () => WorldLifeNode; Graphics: new () => WorldLifeGraphicsLike };
  /** Test seam: a card to use instead of the compiled one. */
  readonly card?: LandfallCardResult;
  /** B8 residents: the roster rows (fauna rows become candidates), a portrait source and the sprite bindings. Absent = weather only. */
  readonly residents?: Readonly<{
    rows: readonly Readonly<Record<string, unknown>>[];
    artLoader?: SpeciesArtLoader | null;
    portrait?: PortraitProvider;
    /* pixi's Sprite constructor is wider than the rig's structural sprite; `never` accepts any constructor parameter list. */
    pixi: { Sprite: new (texture: never) => RigSpriteLike; Texture: { from(source: unknown): unknown } };
  }> | null;
  readonly win?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}
export interface WorldLifeStudyStatus { readonly phase: 'idle' | 'bound' | 'failed' | 'disposed'; readonly reason: string | null; readonly ticks: number; readonly binds: number; readonly spec: WorldLifeSpecV1 | null; readonly reduced: boolean | null; readonly residents: Readonly<{ plan: ResidentPlanV1 | null; status: ResidentStatus | null }>; }
export interface WorldLifeStudyHandle { status(): WorldLifeStudyStatus; readonly container: () => WorldLifeNode | null; dispose(reason?: string): void; }

let current: WorldLifeStudyHandle | null = null;
/** The guarded entry: returns null and does no work unless the flag is present. */
export function mountWorldLifeStudyIfEnabled(search: string, input: WorldLifeStudyInput): WorldLifeStudyHandle | null { return worldLifeEnabled(search) ? mountWorldLifeStudy(input) : null; }

export function mountWorldLifeStudy(input: WorldLifeStudyInput): WorldLifeStudyHandle {
  current?.dispose('replaced by a newer world-life study'); current = null;
  const win = input.win ?? window;
  let phase: WorldLifeStudyStatus['phase'] = 'idle', reason: string | null = null, ticks = 0, binds = 0, spec: WorldLifeSpecV1 | null = null;
  let adapter: WorldLifePixiAdapter | null = null, residents: ResidentIdleLayer | null = null, bound: VistaSpriteLike | null = null, size: readonly [number, number] = [0, 0], disposed = false, ticking = false;
  let residentPlan: ResidentPlanV1 | null = null, residentSize: readonly [number, number] = [0, 0];
  const status = (): WorldLifeStudyStatus => Object.freeze({ phase, reason, ticks, binds, spec, reduced: adapter?.reducedMotion ?? null, residents: Object.freeze({ plan: residentPlan, status: residents?.status() ?? null }) });
  const failed = (why: string): WorldLifeStudyHandle => { phase = 'failed'; reason = why; const h: WorldLifeStudyHandle = { status, container: () => null, dispose() { phase = 'disposed'; if (current === h) current = null; } }; current = h; return h; };
  const cardResult = input.card ?? currentLandfallSystemCard(input.request, input.roster);
  if (!cardResult.ok) return failed(cardResult.reason);
  try { spec = compileWorldLife(cardResult.card, cardResult.seed, 'landfall', { tier: input.tier }); }
  catch (error) { return failed(error instanceof WorldLifeRefusal ? `world life refused: ${error.message}` : `world life compile failed: ${error instanceof Error ? error.message : String(error)}`); }
  const compiledSpec = spec;
  const residentInput = input.residents ?? null;
  if (residentInput) {
    const candidates: ResidentCandidate[] = residentInput.rows.filter((row) => row && typeof row === 'object' && row.kingdom === 'fauna').map((row, i) => ({ genome: row, label: typeof row.name === 'string' ? row.name : typeof row.seed === 'number' ? `fauna ${row.seed}` : `fauna #${i}` }));
    residentPlan = planResidents(candidates, cardResult.seed, input.tier, compiledSpec.frame.groundLine);
  }
  const unbind = (): void => { if (residents) { try { residents.dispose(); } catch { /* total teardown continues */ } } residents = null; if (adapter) { try { adapter.dispose(); } catch { /* total teardown continues */ } } adapter = null; bound = null; size = [0, 0]; if (phase === 'bound') phase = 'idle'; };
  const place = (sprite: VistaSpriteLike, node: WorldLifeContainerLike): void => { node.x = sprite.x - sprite.width / 2; node.y = sprite.y - sprite.height / 2; };
  const bind = (sprite: VistaSpriteLike): void => {
    unbind();
    const w = Math.max(1, sprite.width), h = Math.max(1, sprite.height);
    const a = new WorldLifePixiAdapter({ spec: compiledSpec, factory: { container: () => new input.pixi.Container(), graphics: () => new input.pixi.Graphics() }, clock: input.clock, width: w, height: h, reducedMotion: input.reducedMotion() });
    const index = input.stage.children.indexOf(sprite);
    input.stage.addChildAt(a.container, index < 0 ? input.stage.children.length : index + 1);
    place(sprite, a.container); adapter = a; bound = sprite; size = [w, h]; binds++; phase = 'bound';
    if (residentInput && residentPlan && residentPlan.residents.length) {
      const portrait = residentInput.portrait ?? loaderPortrait(residentInput.artLoader ?? null);
      const layer = new ResidentIdleLayer({ plan: residentPlan, clock: input.clock, width: w, height: h, reducedMotion: input.reducedMotion(), portrait,
        factory: { container: () => new input.pixi.Container() as unknown as ResidentNodeLike, portraitSprite: (image: PortraitImage) => new residentInput.pixi.Sprite(residentInput.pixi.Texture.from(image.source) as never) } });
      // Residents sit between the vista and the weather (rain falls in front of them): their own stage child right above the sprite.
      const at = input.stage.children.indexOf(sprite); input.stage.addChildAt(layer.container, at < 0 ? input.stage.children.length - 1 : at + 1);
      place(sprite, layer.container as unknown as WorldLifeContainerLike); residents = layer;
    }
  };
  const tick = (): void => {
    if (disposed) return;
    ticks++;
    const sprite = input.vistaSprite();
    if (!sprite || sprite.destroyed || sprite.parent === null) { if (adapter) unbind(); return; }
    if (sprite !== bound || !adapter) bind(sprite);
    const a = adapter!, w = Math.max(1, sprite.width), h = Math.max(1, sprite.height);
    if (w !== size[0] || h !== size[1]) { a.resize(w, h); size = [w, h]; }
    place(sprite, a.container); if (residents) place(sprite, residents.container as unknown as WorldLifeContainerLike);
    const reduced = input.reducedMotion(); if (reduced !== a.reducedMotion) a.setReducedMotion(reduced);
    a.update();
    if (residents) { if (w !== residentSize[0] || h !== residentSize[1]) { residents.resize(w, h); residentSize = [w, h]; } if (reduced !== residents.reducedMotion) residents.setReducedMotion(reduced); residents.update(); }
  };
  const startTicking = (): void => { if (!ticking) { ticking = true; input.ticker.add(tick); } };
  const stopTicking = (): void => { if (ticking) { ticking = false; input.ticker.remove(tick); } };
  const onPageHide = (event: Event): void => { stopTicking(); if (!(event as PageTransitionEvent).persisted) dispose('pagehide'); };
  const onPageShow = (event: Event): void => { if ((event as PageTransitionEvent).persisted) startTicking(); };
  win.addEventListener('pagehide', onPageHide); win.addEventListener('pageshow', onPageShow);
  const dispose = (why = 'disposed'): void => {
    if (disposed) return; disposed = true; stopTicking();
    win.removeEventListener('pagehide', onPageHide); win.removeEventListener('pageshow', onPageShow);
    unbind(); phase = 'disposed'; reason = why; if (current === handle) current = null;
  };
  const handle: WorldLifeStudyHandle = { status, container: () => adapter?.container as WorldLifeNode | null ?? null, dispose };
  current = handle; startTicking(); tick();
  return handle;
}
