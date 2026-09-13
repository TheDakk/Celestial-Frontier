/// <reference types="vite/client" />
/** @module battle2-wiring [app] — the flag-gated adapter that binds the A3 battle stage v2 to the
 * live game (WORK_ORDER: one adapter file per module, one guarded call in main.ts). Nothing here runs
 * unless `?battle2=1` is in the URL: main.ts only `import()`s this file inside that gate, so the
 * default Chronicle battle path (`combat-battle-scene.ts`) is untouched.
 *
 * What it does: builds the structural `BattleStageFactory` from the pixi.js classes main.ts already
 * holds (Container / Sprite / Text / Graphics, plus Particle / ParticleContainer through
 * `createPixiEffectHost`), the world-life factory of CONTRACTS §3, resolves the accepted arena plates
 * and the Wild anchors by their audit paths, builds a `BattleRigV1` per combatant (`createFixtureRig`
 * from a landmark record + keyed alpha when the record exists, `createPortraitRig` otherwise), and
 * feeds the settled transcript log through `turnPlanInputFromTranscriptEvent` → `stage.play` →
 * `stage.tick` on the injected ticker with the injected clock (main.ts passes `performance.now`).
 *
 * Assets are a DEV-ONLY FETCH: the audit directory is located from a `?url` import of the 3 KB
 * `arena-recipe.json` (Vite dev serves it at `/@fs/<repo>/audits/…`, so its siblings are fetchable);
 * a production build inlines that JSON as a data: URL and the study reports "assets unavailable"
 * instead of shipping 15 MB of proof plates. The keyer is Codex's `kit-contact-math.mjs`, loaded at
 * runtime from the kit runtime route (`/__local_ai/`) exactly as the landfall painter loads its
 * workers. Everything pixi/DOM/asset-shaped is injectable so the tests drive the module with fakes.
 *
 * The stage never changes HP or rewards; the Chronicle log stays the accessible owner of the outcome.
 * Batch 2: each combatant stages its own ability theme (Wild painted, the other ten as the labelled
 * procedural emitter in the theme's material colour) and the turn cues ride the beats when an `audio`
 * runtime port is supplied (main.ts passes none yet: the shared runtime is private to the tame-greeting
 * owner, so the study reports `audio: none`). Not yet done here: synchronising turns to the Chronicle
 * cue cadence (the study plays the transcript through at its own pace), arena selection beyond the one
 * accepted temperate arena, and the C2 parts rig (fixture rig until it lands). */
import arenaRecipeUrl from '../../../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json?url';
import { speciesVisualKey } from '@cf/art/species-identity';
import { BattleStage, composeArena, createFixtureRig, createPortraitRig, cutFixtureParts, turnPlanInputFromTranscriptEvent,
  type BattleRigV1, type BattleStageFactory, type FixturePartCut, type RigContainerLike, type RigSpriteLike,
  type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnOutcomeContext, type TurnPlanInput } from './battle2/index.js';
import { abilityTheme } from '@cf/domain-combatcore';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from './effects/anchors.js';
import { EffectThemeLibrary, isEffectTheme, isProceduralImage } from './effects/theme-library.js';
import { PARTICLE_DISC_SIZE, particleDiscRgba } from './effects/particle-texture.js';
import { createPixiEffectHost, type EffectParticleLike, type EffectSpriteLike, type EffectTextureLike } from './effects/pixi-adapter.js';
import { compileBodyCard, MotionCompileError, type BodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from './motion/body-card.js';
import { createTurnCueSink, type TurnAudioRuntime, type TurnCueSink } from './soundkit/turn-audio.js';
import { MASS_BY_SIZE_INDEX, MASS_CLASS } from './motion/timing.js';
import type { SpeciesArtLoader } from './species-art-loader.js';
import { compileWorldLife, WorldLifePixiAdapter, type WorldLifeGraphicsLike } from './worldlife/index.js';

export const BATTLE2_FLAG = 'battle2' as const;
export const BATTLE2_FRAME = Object.freeze({ width: 1024, height: 576 });
/** Audit paths (relative to the arena proof directory) of the accepted plates, anchors and the one landmark record. */
export const BATTLE2_ASSETS = Object.freeze({
  recipe: 'arena-recipe.json', anchors: 'wild-anchors.json',
  far: 'arena-far.png', mid: 'keyed/arena-mid.png', near: 'keyed/arena-near.png',
  civetRecord: '../CIVET_2D_PROOF_20260912/civet.landmarks.json', civetMaster: '../ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',
});
export const BATTLE2_KEYER_URL = '/__local_ai/kit-contact-math.mjs' as const;
export const PLAYER_PLACEHOLDER_LABEL = 'player champion placeholder (nameplate; no creature art)' as const;

/** The gate main.ts tests in source text; kept here so the wiring and its test agree on the spelling. */
export function battle2Enabled(search: string): boolean { return new URLSearchParams(search).get(BATTLE2_FLAG) === '1'; }

/* ---------- structural inputs (pixi.js is never imported here; main.ts passes its classes) ---------- */
export interface Battle2Image { readonly width: number; readonly height: number; readonly source: unknown; pixels(): Uint8ClampedArray; }
export interface Battle2AssetSource { json(path: string): Promise<unknown>; image(path: string): Promise<Battle2Image>; }
export interface Battle2Keyed { readonly alpha: Uint8Array; readonly rgba: Uint8ClampedArray; readonly bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }; }
export type Battle2Keyer = (rgba: Uint8ClampedArray, width: number, height: number) => Battle2Keyed;
/** Builds a texture source (a canvas in the browser) from RGBA bytes; the per-part sprites and the dot particle use it. */
export type Battle2Raster = (rgba: Uint8ClampedArray, width: number, height: number) => Battle2Image;
/** One structural Container: satisfies the stage, rig and world-life container contracts at once. */
export interface Battle2NodeLike { x: number; y: number; rotation: number; alpha: number; visible: boolean; readonly scale: { set(x: number, y: number): unknown }; addChild(child: object): unknown; removeChild(child: object): unknown; addChildAt(child: object, index: number): unknown; destroy(): void; }
export interface Battle2SpriteLike extends StageSpriteLike, RigSpriteLike, EffectSpriteLike {}
export interface Battle2AppLike { init(options: Record<string, unknown>): Promise<unknown>; readonly canvas: HTMLCanvasElement; readonly stage: Battle2NodeLike; readonly renderer: { render(container: object): unknown }; destroy(rendererOptions?: unknown, options?: unknown): unknown; }
export interface Battle2PixiBindings {
  Application: new () => Battle2AppLike;
  Container: new () => Battle2NodeLike;
  Sprite: new (texture: EffectTextureLike) => Battle2SpriteLike;
  Text: new (options: { text: string; style: Record<string, unknown>; anchor: number }) => StageTextLike;
  Graphics: new () => StageGraphicsLike & WorldLifeGraphicsLike;
  Texture: { from(source: unknown): EffectTextureLike };
  /* pixi's Particle / ParticleContainer signatures are wider than the effect host's structural ones (IParticle carries
     color/texture); the constructor parameters are left open here and the host binding is cast once, below. */
  Particle: new (...args: any[]) => EffectParticleLike;
  ParticleContainer: new (...args: any[]) => { addParticle(...particles: any[]): unknown; removeParticle(...particles: any[]): unknown };
}
export interface Battle2TickerLike { add(fn: () => void): unknown; remove(fn: () => void): unknown; }
export interface Battle2Champion { readonly kind: string; readonly name: string; readonly genome?: Readonly<Record<string, unknown>>; }
export interface Battle2SettlementLike {
  readonly battleId: string;
  readonly champion: Battle2Champion;
  readonly encounter: { readonly defender: { readonly battleGenome: Readonly<Record<string, unknown>> } };
  readonly transcript: { readonly log: readonly Readonly<Record<string, unknown>>[] };
}
export interface Battle2StudyInput {
  readonly mount: HTMLElement;
  readonly settlement: Battle2SettlementLike;
  readonly chronicle: { readonly championName: string; readonly defenderName: string };
  readonly generation: number;
  readonly ticker: Battle2TickerLike;
  /** Injected playback clock in ms (main.ts passes performance.now); never read inside compilation. */
  readonly clock: () => number;
  readonly reducedMotion: boolean;
  readonly deviceTier: 'low' | 'medium' | 'high';
  readonly pixi: Battle2PixiBindings;
  readonly artLoader: SpeciesArtLoader | null;
  readonly assets?: Battle2AssetSource;
  /** Keyed alpha for a master (default: Codex's kit-contact-math keyAndDespill from the kit runtime route). */
  readonly keyer?: Battle2Keyer;
  readonly raster?: Battle2Raster;
  readonly records?: readonly ResolvedAnatomyRecord[];
  /** Portrait art for combatants without a landmark record (default: the species art loader's 132 px thumb). */
  readonly portrait?: (genome: Readonly<Record<string, unknown>>) => Promise<Battle2Image>;
  readonly win?: Pick<Window, 'addEventListener' | 'removeEventListener'> & { readonly MutationObserver?: typeof MutationObserver };
  /** Audio runtime port for the turn cues (B1). Absent = the study stages silently and reports `audio: none`; main.ts holds no shared runtime handle yet. */
  readonly audio?: TurnAudioRuntime | null;
}
export type Battle2Phase = 'loading' | 'playing' | 'finished' | 'failed' | 'disposed';
export interface Battle2Status {
  readonly phase: Battle2Phase; readonly reason: string | null; readonly label: string | null;
  readonly turns: number; readonly turnIndex: number; readonly skipped: readonly string[];
  readonly rigs: Readonly<{ left: string | null; right: string | null }>; readonly ticks: number;
  /** Per-combatant ability theme and how its effect plays (painted sequence or the labelled procedural emitter). */
  readonly effects: Readonly<{ left: string | null; right: string | null }>;
  /** Turn audio: 'none' without a runtime port, else the cue log so far (cueId → result). */
  readonly audio: string;
}
export interface Battle2StudyHandle { readonly ready: Promise<Battle2Status>; status(): Battle2Status; dispose(reason?: string): void; }

/* ---------- pure helpers ---------- */
export function fnv1a32(text: string): number { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }
export function genomeSeed(genome: Readonly<Record<string, unknown>> | null | undefined, fallbackText: string): number {
  const s = genome?.seed; return typeof s === 'number' && Number.isFinite(s) ? s >>> 0 : fnv1a32(fallbackText);
}
/** The combatant's one ability theme (combat domain, `abilityTheme(genome)`); the player placeholder has no creature genome and keeps the melee default. */
export function genomeTheme(genome: Readonly<Record<string, unknown>> | null | undefined): string {
  if (!genome) return 'wild';
  try { const t = abilityTheme(genome as Record<string, unknown>); return isEffectTheme(t) ? t : 'wild'; } catch { return 'wild'; }
}
export function genomeMass(genome: Readonly<Record<string, unknown>> | null | undefined): number {
  const size = genome?.size; if (typeof size !== 'number' || !Number.isFinite(size)) return MASS_CLASS.medium;
  const n = MASS_BY_SIZE_INDEX.length, name = MASS_BY_SIZE_INDEX[(((size | 0) % n) + n) % n] ?? 'medium'; return MASS_CLASS[name];
}
/** A record matches a combatant when its visual key equals the genome's, or its named Earth species equals the genome's `_earthName`. */
export function matchRecord(records: readonly ResolvedAnatomyRecord[], genome: Readonly<Record<string, unknown>> | null | undefined): ResolvedAnatomyRecord | null {
  if (!genome) return null;
  let key: string | null = null; try { key = speciesVisualKey(genome as Record<string, unknown>); } catch { key = null; }
  const earth = typeof genome._earthName === 'string' ? genome._earthName : null;
  return records.find((r) => (key !== null && r.identity.speciesVisualKey === key) || (earth !== null && r.identity.earthName === earth)) ?? null;
}
export function alphaBox(rgba: Uint8ClampedArray, width: number, height: number): { x: number; y: number; width: number; height: number } {
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if ((rgba[(y * width + x) * 4 + 3] ?? 0) > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? { x: 0, y: 0, width, height } : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/* ---------- browser defaults (all replaceable) ---------- */
function browserRaster(): Battle2Raster {
  return (rgba, width, height) => {
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, width); canvas.height = Math.max(1, height);
    const image = canvas.getContext('2d')!.createImageData(canvas.width, canvas.height); image.data.set(rgba.subarray(0, image.data.length)); canvas.getContext('2d')!.putImageData(image, 0, 0);
    return { width: canvas.width, height: canvas.height, source: canvas, pixels: () => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data };
  };
}
/** Dev-only fetch relative to the `?url` location of arena-recipe.json (see the module note). */
export function devAssetSource(recipeUrl: string = arenaRecipeUrl, base: string = location.href): Battle2AssetSource {
  if (/^data:/.test(recipeUrl)) throw new Error('battle2 assets unavailable: this build inlined arena-recipe.json; the proof plates are a dev-only fetch');
  const dir = new URL('.', new URL(recipeUrl, base));
  const get = async (path: string): Promise<Response> => { const r = await fetch(new URL(path, dir).href); if (!r.ok) throw new Error(`battle2 asset ${path}: HTTP ${r.status}`); return r; };
  return {
    json: async (path) => (await get(path)).json(),
    image: async (path) => {
      const bitmap = await createImageBitmap(await (await get(path)).blob());
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0); bitmap.close();
      return { width: canvas.width, height: canvas.height, source: canvas, pixels: () => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data };
    },
  };
}
async function runtimeKeyer(): Promise<Battle2Keyer> {
  const url: string = BATTLE2_KEYER_URL;
  const mod = (await import(/* @vite-ignore */ url)) as { keyAndDespill?: (rgba: Uint8ClampedArray, w: number, h: number) => Battle2Keyed };
  if (typeof mod.keyAndDespill !== 'function') throw new Error('battle2 keyer unavailable: kit-contact-math.mjs exports no keyAndDespill');
  return (rgba, w, h) => mod.keyAndDespill!(rgba, w, h);
}
function loaderPortrait(loader: SpeciesArtLoader | null): (genome: Readonly<Record<string, unknown>>) => Promise<Battle2Image> {
  return async (genome) => {
    if (!loader) throw new Error('battle2 portrait unavailable: no species art loader');
    const lease = loader.leaseThumb(genome as Record<string, unknown>);
    try {
      const asset = lease.current ?? await new Promise<{ url: string }>((resolve, reject) => {
        const off = lease.subscribe((thumb, error) => { if (thumb) { off(); resolve(thumb); } else if (error) { off(); reject(error instanceof Error ? error : new Error(String(error))); } });
      });
      const image = new Image(); image.decoding = 'async'; image.src = asset.url; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d')!.drawImage(image, 0, 0);
      return { width: canvas.width, height: canvas.height, source: canvas, pixels: () => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data };
    } finally { lease.release(); }
  };
}
function placeholderImage(raster: Battle2Raster, width = 132, height = 132): Battle2Image {
  // A deterministic flat tile (no text rendering, no clock): the player champion has no creature art.
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const i = (y * width + x) * 4, inside = x > 20 && x < width - 20 && y > 30 && y < height - 6; rgba[i] = 0xe6; rgba[i + 1] = 0xd2; rgba[i + 2] = 0x9a; rgba[i + 3] = inside ? 255 : 0; }
  return raster(rgba, width, height);
}

/* ---------- the study ---------- */
let current: Battle2StudyHandle | null = null;
/** The guarded entry: returns null and does no work unless the flag is present. */
export function mountBattle2StudyIfEnabled(search: string, input: Battle2StudyInput): Battle2StudyHandle | null { return battle2Enabled(search) ? mountBattle2Study(input) : null; }

export function mountBattle2Study(input: Battle2StudyInput): Battle2StudyHandle {
  current?.dispose('replaced by a newer battle2 study'); current = null;
  const pixi = input.pixi, win = input.win ?? window, raster = input.raster ?? browserRaster();
  const section = input.mount.ownerDocument.createElement('section');
  section.dataset.battle2Stage = 'true'; section.dataset.battle2Generation = String(input.generation); section.dataset.battle2Status = 'loading';
  section.setAttribute('aria-hidden', 'true'); section.style.cssText = 'display:block;width:100%;aspect-ratio:16/9;overflow:hidden;background:#141d22';
  input.mount.prepend(section);
  let phase: Battle2Phase = 'loading', reason: string | null = null, label: string | null = null, ticks = 0, turnIndex = -1;
  const skipped: string[] = []; let turns: TurnPlanInput[] = []; const rigLabels = { left: null as string | null, right: null as string | null }, effectLabels = { left: null as string | null, right: null as string | null };
  let app: Battle2AppLike | null = null, stage: BattleStage | null = null, ticking = false, disposed = false, cueSink: TurnCueSink | null = null;
  const audioSummary = (): string => (cueSink ? `${cueSink.log.length} cues: ${cueSink.log.map((e) => `${e.cueId}=${e.result}`).join(', ')}` : 'none');
  const status = (): Battle2Status => Object.freeze({ phase, reason, label, turns: turns.length, turnIndex, skipped: Object.freeze([...skipped]), rigs: Object.freeze({ ...rigLabels }), ticks, effects: Object.freeze({ ...effectLabels }), audio: audioSummary() });
  const setPhase = (next: Battle2Phase, why: string | null = null): void => { phase = next; reason = why; section.dataset.battle2Status = next; if (why) section.dataset.battle2Reason = why; };
  const tick = (): void => {
    if (disposed || !stage || !app) return;
    if (!input.mount.isConnected || section.parentElement !== input.mount) { dispose('mount left the document'); return; }
    ticks++;
    if (turnIndex < 0) { turnIndex = 0; stage.play(turns[0]!); }
    const frame = stage.tick();
    if (frame?.done) {
      if (turnIndex + 1 < turns.length) { turnIndex++; stage.play(turns[turnIndex]!); }
      else if (phase === 'playing') { setPhase('finished'); stopTicking(); }
    }
    app.renderer.render(app.stage);
  };
  const startTicking = (): void => { if (!ticking) { ticking = true; input.ticker.add(tick); } };
  const stopTicking = (): void => { if (ticking) { ticking = false; input.ticker.remove(tick); } };
  const onPageHide = (event: Event): void => { stopTicking(); if (!(event as PageTransitionEvent).persisted) dispose('pagehide'); };
  const onPageShow = (event: Event): void => { if ((event as PageTransitionEvent).persisted && phase === 'playing') startTicking(); };
  win.addEventListener('pagehide', onPageHide); win.addEventListener('pageshow', onPageShow);
  const Observer = win.MutationObserver ?? (typeof MutationObserver === 'function' ? MutationObserver : null);
  const observer = Observer ? new Observer(() => { if (input.mount.dataset.combatChronicleGeneration !== undefined && input.mount.dataset.combatChronicleGeneration !== String(input.generation)) dispose('chronicle generation replaced'); }) : null;
  observer?.observe(input.mount, { attributes: true, attributeFilter: ['data-combat-chronicle-generation'] });
  const dispose = (why = 'disposed'): void => {
    if (disposed) return; disposed = true; stopTicking();
    win.removeEventListener('pagehide', onPageHide); win.removeEventListener('pageshow', onPageShow); observer?.disconnect();
    try { stage?.dispose(); } catch { /* total teardown continues */ }
    try { app?.destroy(true, { children: true }); } catch { /* the second renderer is gone either way */ }
    stage = null; app = null; section.remove(); setPhase('disposed', why); if (current === handle) current = null;
  };
  const build = async (): Promise<Battle2Status> => {
    const assets = input.assets ?? devAssetSource();
    const keyer: Battle2Keyer = input.keyer ?? await runtimeKeyer();
    const [recipeRaw, anchorsRaw, far, mid, near] = await Promise.all([assets.json(BATTLE2_ASSETS.recipe), assets.json(BATTLE2_ASSETS.anchors), assets.image(BATTLE2_ASSETS.far), assets.image(BATTLE2_ASSETS.mid), assets.image(BATTLE2_ASSETS.near)]);
    const recipe = recipeRaw as { groundLineNormalized: number; seed: number; systemCard: string; battleContext?: { worldKey?: string } };
    if (typeof recipe.groundLineNormalized !== 'number' || typeof recipe.seed !== 'number' || typeof recipe.systemCard !== 'string') throw new Error('battle2 arena recipe lacks groundLineNormalized/seed/systemCard');
    const parsed = parseEffectSequenceAnchors(anchorsRaw); if (!parsed.ok) throw new Error(`battle2 anchors refused: ${parsed.reason}`);
    const anchors: EffectSequenceAnchors = parsed.anchors;
    // One painted sequence (Wild) today; every other theme plays the labelled procedural emitter with its §4K material colour.
    const themes = new EffectThemeLibrary([anchors]);
    const records = input.records ?? [await assets.json(BATTLE2_ASSETS.civetRecord) as ResolvedAnatomyRecord];
    if (disposed) throw new Error('disposed while loading');
    const texture = (img: Battle2Image): EffectTextureLike => pixi.Texture.from(img.source);
    const layout = composeArena({ id: recipe.battleContext?.worldKey ?? 'arena', groundLineNormalized: recipe.groundLineNormalized, plates: { far, mid, near } }, BATTLE2_FRAME);
    const rigContainer = (): RigContainerLike => new pixi.Container();
    const buildRig = async (side: 'left' | 'right', name: string, genome: Readonly<Record<string, unknown>> | null): Promise<{ rig: BattleRigV1; card: BodyCard | null; mass: number; seed: number }> => {
      const seed = genomeSeed(genome, `${input.settlement.battleId}:${side}:${name}`);
      const record = matchRecord(records, genome);
      if (record) {
        try {
          const card = compileBodyCard(record, (genome ?? undefined) as MotionGenomeFields | undefined);
          const masterPath = record.identity.earthName === 'Civet' ? BATTLE2_ASSETS.civetMaster : null;
          if (!masterPath) throw new MotionCompileError('missing-record', `no keyed master path is registered for ${record.identity.earthName ?? record.identity.speciesVisualKey.slice(0, 24)}`);
          const master = await assets.image(masterPath), keyed = keyer(master.pixels(), master.width, master.height);
          const cut = cutFixtureParts(keyed.alpha, master.width, master.height, record);
          const partSprite = (part: FixturePartCut): RigSpriteLike => {
            const w = Math.max(1, part.box.width), h = Math.max(1, part.box.height), rgba = new Uint8ClampedArray(w * h * 4);
            for (let y = 0; y < part.box.height; y++) for (let x = 0; x < part.box.width; x++) { if (!part.mask[y * part.box.width + x]) continue; const s = ((part.box.y + y) * master.width + part.box.x + x) * 4, d = (y * w + x) * 4; rgba[d] = keyed.rgba[s]!; rgba[d + 1] = keyed.rgba[s + 1]!; rgba[d + 2] = keyed.rgba[s + 2]!; rgba[d + 3] = keyed.rgba[s + 3]!; }
            return new pixi.Sprite(texture(raster(rgba, w, h)));
          };
          return { rig: createFixtureRig({ record, cut, factory: { container: rigContainer, partSprite } }), card, mass: card.massClass.multiplier, seed };
        } catch (error) { skipped.push(`${name}: record found but not rigged (${error instanceof Error ? error.message : String(error)}); portrait fallback`); }
      }
      const image = genome ? await (input.portrait ?? loaderPortrait(input.artLoader))(genome) : placeholderImage(raster);
      const box = alphaBox(image.pixels(), image.width, image.height);
      const rig = createPortraitRig({ templateId: genome ? 'portrait' : 'player', recipeHash: `${genome ? 'thumb' : 'player'}:${fnv1a32(name)}`, cutout: { width: image.width, height: image.height }, alphaBox: box,
        factory: { container: rigContainer, portraitSprite: () => new pixi.Sprite(texture(image)) } });
      const labelled: BattleRigV1 = genome ? rig : { ...rig, label: PLAYER_PLACEHOLDER_LABEL };
      return { rig: labelled, card: null, mass: genomeMass(genome), seed };
    };
    const champion = input.settlement.champion, championGenome = champion.kind === 'owned-fauna' && champion.genome ? champion.genome : null;
    const left = await buildRig('left', input.chronicle.championName, championGenome);
    const right = await buildRig('right', input.chronicle.defenderName, input.settlement.encounter.defender.battleGenome);
    if (disposed) { left.rig.dispose(); right.rig.dispose(); throw new Error('disposed while rigging'); }
    rigLabels.left = left.rig.label; rigLabels.right = right.rig.label;
    const phaseTextures = new Map<string, Promise<EffectTextureLike>>();
    for (const p of anchors.phases) phaseTextures.set(p.keyedImage, assets.image(p.keyedImage).then(texture));
    const resolvedPhaseTextures = new Map<string, EffectTextureLike>();
    for (const [k, v] of phaseTextures) resolvedPhaseTextures.set(k, await v);
    const dot = particleDiscRgba(PARTICLE_DISC_SIZE);
    const worldLife = new WorldLifePixiAdapter({ spec: compileWorldLife(recipe.systemCard, recipe.seed, 'arena', { tier: input.deviceTier === 'low' ? 'phone' : 'desktop' }),
      factory: { container: () => new pixi.Container(), graphics: () => new pixi.Graphics() }, clock: input.clock, width: BATTLE2_FRAME.width, height: BATTLE2_FRAME.height, reducedMotion: input.reducedMotion });
    const style = { fontFamily: 'system-ui', fontSize: 34, fontWeight: '700', fill: '#fff2c8', stroke: { color: '#2a1a0a', width: 4 } };
    const factory: BattleStageFactory = { container: () => new pixi.Container(), sprite: (t) => new pixi.Sprite(t), text: (t) => new pixi.Text({ text: t, style, anchor: 0.5 }), graphics: () => new pixi.Graphics() };
    cueSink = input.audio ? createTurnCueSink({ runtime: input.audio, seed: recipe.seed ^ fnv1a32(input.settlement.battleId), phone: input.deviceTier === 'low' }) : null;
    const built = new BattleStage({ factory, clock: input.clock, layout, plates: { far: texture(far), mid: texture(mid), near: texture(near) }, rigs: { left: left.rig, right: right.rig }, masses: { left: left.mass, right: right.mass },
      worldLife, reducedMotion: input.reducedMotion, cues: cueSink ? { sink: cueSink, phone: input.deviceTier === 'low' } : null, effects: input.reducedMotion ? null : { host: createPixiEffectHost({ Sprite: pixi.Sprite, Particle: pixi.Particle, ParticleContainer: pixi.ParticleContainer } as unknown as Parameters<typeof createPixiEffectHost>[0]),
        particleTexture: texture(raster(dot, PARTICLE_DISC_SIZE, PARTICLE_DISC_SIZE)), seed: recipe.seed,
        phaseTextures: (a) => a.phases.map((p) => { if (isProceduralImage(p.keyedImage)) return null; const t = resolvedPhaseTextures.get(p.keyedImage); if (!t) throw new Error(`battle2 phase image ${p.keyedImage} was not loaded`); return t; }),
        emittersForTheme: (t) => themes.emittersFor(t), tintForTheme: (t) => themes.tintFor(t) } });
    const themeA = genomeTheme(championGenome), themeB = genomeTheme(input.settlement.encounter.defender.battleGenome);
    effectLabels.left = `${themeA}: ${themes.resolve(themeA).label}`; effectLabels.right = `${themeB}: ${themes.resolve(themeB).label}`;
    const ctx: TurnOutcomeContext = {
      A: { side: 'A', name: input.chronicle.championName, mass: left.mass, card: left.card, theme: themeA, seed: left.seed },
      B: { side: 'B', name: input.chronicle.defenderName, mass: right.mass, card: right.card, theme: themeB, seed: right.seed },
      arena: { groundLineY: layout.groundLineY, stands: layout.stands }, seed: fnv1a32(input.settlement.battleId) ^ recipe.seed, anchorsForTheme: (t) => themes.anchorsFor(t), readyMs: 900, commandMs: 400, reducedMotion: input.reducedMotion,
    };
    for (const row of input.settlement.transcript.log) { const t = turnPlanInputFromTranscriptEvent(row, ctx); if (t.kind === 'turn') turns.push(t.input); else skipped.push(t.reason); }
    if (turns.length === 0) { built.dispose(); throw new Error('battle2: the transcript has no stageable turn'); }
    const application = new pixi.Application();
    await application.init({ width: BATTLE2_FRAME.width, height: BATTLE2_FRAME.height, resolution: input.deviceTier === 'high' ? 2 : 1, autoDensity: false, background: '#141d22', antialias: true, autoStart: false, sharedTicker: false });
    if (disposed) { built.dispose(); application.destroy(true, { children: true }); throw new Error('disposed while initialising the renderer'); }
    application.canvas.style.cssText = 'display:block;width:100%;height:100%'; section.append(application.canvas);
    application.stage.addChild(built.root); app = application; stage = built; label = built.label; section.dataset.battle2Label = built.label;
    setPhase('playing'); startTicking(); tick();
    return status();
  };
  const ready = build().catch((error: unknown) => { if (!disposed) setPhase('failed', error instanceof Error ? error.message : String(error)); return status(); });
  const handle: Battle2StudyHandle = { ready, status, dispose };
  current = handle; return handle;
}
