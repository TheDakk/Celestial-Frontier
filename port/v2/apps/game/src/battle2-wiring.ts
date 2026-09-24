/// <reference types="vite/client" />
/** @module battle2-wiring [app] — the flag-gated adapter that binds the A3 battle stage v2 to the
 * live game (WORK_ORDER: one adapter file per module, one guarded call in main.ts). Nothing here runs
 * unless `?battle2=1` is in the URL: main.ts only imports this file dynamically inside that gate, so the
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
 * instead of shipping 15 MB of proof plates. The keyer is Codex's `kit-contact-math.mjs`, imported
 * statically (Arc 4 law: no computed dynamic imports in production source; the runtime-route load it
 * replaced was one). Everything pixi/DOM/asset-shaped is injectable so the tests drive the module with fakes.
 *
 * The stage never changes HP or rewards; the Chronicle log stays the accessible owner of the outcome.
 * Batch 2: each combatant stages its own ability theme (Wild painted, the other ten as the labelled
 * procedural emitter in the theme's material colour) and the turn cues ride the beats when an `audio`
 * runtime port is supplied (main.ts passes the accessible audio owner's `decorativeVoicePort()`, which
 * admits decorative requests only while the owner is live, visible and answerable). E1 (2026-09-19): registered source
 * paint-skin fits (Civet + five crabs) stage as parts rigs through Codex's owner and contact solver; the habitat picks each
 * side's medium/band on the battle's worlds (labelled dry Earth-temperate default without world context; UNSUPPORTED keeps
 * the Chronicle path with the reason); each staged attack is Codex's `compileAnatomyAttack` when admitted, else the family
 * delivery clip, labelled. Not yet done here: synchronising turns to the Chronicle cue cadence (the study plays the
 * transcript through at its own pace); a crab cannot attack until R3 admits pinch (labelled per side in `status().attacks`). */
import { keyAndDespill } from '../../../../../tools/local-image-generation/kit-contact-math.mjs';
/** The shipped battle2 assets (`apps/game/public/battle2/…`, mirrored by `tools/morph/build-shipped-battle2.mjs`) keep the
 * proof folders' relative layout, so every path below resolves against this recipe URL unchanged. */
const arenaRecipeUrl = '/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json';
import { speciesVisualKey } from '@cf/art/species-identity';
import { BattleStage, GUARDIAN_FRAME_FILL, combatantPresentation, combatantScale, composeArena, createFixtureRig, createPortraitRig, cutFixtureParts, selectHabitatArena, turnPlanInputFromTranscriptEvent,
  type BattleRigV1, type BattleStageFactory, type FixturePartCut, type RigContainerLike, type RigSpriteLike,
  type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnAttack, type TurnOutcomeContext, type TurnPlanInput } from './battle2/index.js';
// parts-rig (and Codex's pixi-backed creature-rig behind it) is imported by path, not through battle2/index: the root
// test program must stay free of pixi.js types (see apps/game/tsconfig.json _skipLibCheckReason).
import { createPartsRig } from './battle2/parts-rig.js';
import { compileAnatomyAttack } from './anatomy-attacks.js';
import type { ArenaWorld } from './battle-habitat.js';
import { individualFromGenomeV1 } from './morph/morph-individual.js';
import { morphAtlasCache, morphAtlasKey, type MorphAtlasLease } from './morph/morph-atlas-cache.js';
import { markingNameV1, maskAlphaOf, type AlphaMask } from './morph/morph-markings.js';
import { archetypeGenomeV1, morphParamsV1 } from './morph/morph-params.js';
import { decodePng } from './morph/png-decode.js';
import { decodeMorphedAtlas, loadCreatureRigV1, type CreaturePartsBindingV1, type CreatureRigRecordV1, type CreatureRigV1 } from './creature-rig.js';
import { abilityTheme } from '@cf/domain-combatcore';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from './effects/anchors.js';
import { EffectThemeLibrary, isEffectTheme, isProceduralImage } from './effects/theme-library.js';
import { PARTICLE_DISC_SIZE, particleDiscRgba } from './effects/particle-texture.js';
import { createPixiEffectHost, type EffectParticleLike, type EffectSpriteLike, type EffectTextureLike } from './effects/pixi-adapter.js';
import { compileBodyCard, MotionCompileError, type BodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from './motion/body-card.js';
import { createTurnCueSink, type TurnAudioRuntime, type TurnCueSink } from './soundkit/turn-audio.js';
import { createCreatureVoiceHook, type CreatureVoiceHook } from './soundkit/creature-voices.js';
import { synthesizePlaceholderQuadruped } from './soundkit/placeholder-archetype.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { repoRelativeSource } from '../../../tools/creature-animation/record-source.mjs';
import { MASS_BY_SIZE_INDEX, MASS_CLASS } from './motion/timing.js';
import type { SpeciesArtLoader } from './species-art-loader.js';
import { loaderPortrait } from './species-portrait.js';
import { compileWorldLife, WorldLifePixiAdapter, type WorldLifeGraphicsLike } from './worldlife/index.js';

export const BATTLE2_FLAG = 'battle2' as const;
export const BATTLE2_FRAME = Object.freeze({ width: 1024, height: 576 });
/** Audit paths (relative to the arena proof directory) of the accepted plates, anchors, the landmark records and the
 * source paint-skin fits (E1 §1.1): every painted archetype (`battle2-archetypes.ts`, generated). Each fit
 * directory holds `record.json`, `binding.json`, `parts/keyed.png`, `parts/manifest.json` and `parts/atlas/<id>.png`;
 * the painter master is `record.source` (repo-relative). */
export const BATTLE2_ASSETS = Object.freeze({
  recipe: 'arena-recipe.json', anchors: 'wild-anchors.json',
  far: 'arena-far.png', mid: 'keyed/arena-mid.png', near: 'keyed/arena-near.png',
  civetRecord: '../CIVET_2D_PROOF_20260912/civet.landmarks.json', civetMaster: '../ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',
  // every painted archetype (GENERATED from the card builder's list — one source for the card, the arena and the shipped assets)
  partsFits: BATTLE2_PARTS_FITS,
});
/** A repo-relative `record.source` (e.g. `audits/X/master.png`) as an asset path relative to the arena proof directory. */
export const auditAssetPath = (repoRelative: string): string => { if (!repoRelative.startsWith('audits/')) throw new Error(`battle2: record source ${repoRelative} is not under audits/`); return '../' + repoRelative.slice('audits/'.length); };
export const PLAYER_PLACEHOLDER_LABEL = 'player champion placeholder (nameplate; no creature art)' as const;

/** The gate main.ts tests in source text; kept here so the wiring and its test agree on the spelling. */
export function battle2Enabled(search: string): boolean { return new URLSearchParams(search).get(BATTLE2_FLAG) === '1'; }

/* ---------- structural inputs (pixi.js is never imported here; main.ts passes its classes) ---------- */
export interface Battle2Image { readonly width: number; readonly height: number; readonly source: unknown; pixels(): Uint8ClampedArray; }
export interface Battle2AssetSource { json(path: string): Promise<unknown>; image(path: string): Promise<Battle2Image>; /** Raw bytes (PNG masters/atlases for the paint-skin rig); absent = no parts rigs, fixture/portrait only. */ bytes?(path: string): Promise<Uint8Array>; }
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
  /** Audio runtime port for the turn cues (B1). Absent = the study stages silently and reports `audio: none`; main.ts passes the audio owner's decorative port. */
  readonly audio?: TurnAudioRuntime | null;
  /** The battle's home and visitor worlds for habitat arena selection (E1 §1.4). Absent = the accepted Earth-temperate plates, labelled as the default. */
  readonly worlds?: Readonly<{ home: ArenaWorld; visitor: ArenaWorld }> | null;
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
  /** Per-side creature voice (B5): archetype, material and pitch, or why the side is silent. */
  readonly voices: Readonly<{ left: string | null; right: string | null }>;
  /** E1: the habitat arena selection (world, medium per side, source), or null before it ran / when it refused. */
  readonly arena: string | null;
  /** E1: per side, the anatomy attack in play (`verb (contactJoint)`) or why the family delivery clip is used. */
  readonly attacks: Readonly<{ left: string | null; right: string | null }>;
  /** E1: per side, poses the parts rig refused so far (null for fixture/portrait rigs, which never refuse). */
  readonly refusals: Readonly<{ left: number | null; right: number | null }>;
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
/** The individual's PAINTED marking mask in MASTER space, or null: the archetype's optional `markings.json` names one
 * mask file per pattern the kit hand painted; a pattern without one renders plain (the law). Never throws. */
export async function loadMarkingMask(assets: Battle2AssetSource, fitDir: string, record: { recipeHash: string; genome?: Record<string, unknown> | null; identity?: { speciesVisualKey?: string }; geometry: { width: number; height: number } }, genome: Readonly<Record<string, unknown>> | null | undefined): Promise<AlphaMask | null> {
  if (!assets.bytes) return null;
  try { const name = markingNameV1(morphParamsV1(genome, record.recipeHash, archetypeGenomeV1(record))); if (!name) return null;
    const mj = await assets.json(fitDir + 'markings.json') as { patterns?: Record<string, { file?: string }> }; const file = mj?.patterns?.[name]?.file; if (typeof file !== 'string') return null;
    const png = await decodePng(await assets.bytes(fitDir + file)); if (png.width !== record.geometry.width || png.height !== record.geometry.height) return null; return maskAlphaOf(png.rgba, png.width, png.height); }
  catch { return null; }
}
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
    bytes: async (path) => new Uint8Array(await (await get(path)).arrayBuffer()),
    image: async (path) => {
      const bitmap = await createImageBitmap(await (await get(path)).blob());
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0); bitmap.close();
      return { width: canvas.width, height: canvas.height, source: canvas, pixels: () => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data };
    },
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
  const attackLabels = { left: null as string | null, right: null as string | null }; let arenaLabel: string | null = null; let refusalsOf: () => Readonly<{ left: number | null; right: number | null }> = () => Object.freeze({ left: null, right: null });
  let app: Battle2AppLike | null = null, stage: BattleStage | null = null, ticking = false, disposed = false, cueSink: TurnCueSink | null = null;
  const audioSummary = (): string => (cueSink ? `${cueSink.log.length} cues: ${cueSink.log.map((e) => `${e.cueId}=${e.result}`).join(', ')}` : 'none');
  let voices: CreatureVoiceHook | null = null;
  const status = (): Battle2Status => Object.freeze({ phase, reason, label, turns: turns.length, turnIndex, skipped: Object.freeze([...skipped]), rigs: Object.freeze({ ...rigLabels }), ticks, effects: Object.freeze({ ...effectLabels }), arena: arenaLabel, attacks: Object.freeze({ ...attackLabels }), refusals: refusalsOf(), audio: audioSummary(), voices: Object.freeze({ left: voices?.status.left ?? null, right: voices?.status.right ?? null }) });
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
  const atlasLeases: MorphAtlasLease[] = [];
  const dispose = (why = 'disposed'): void => {
    if (disposed) return; disposed = true; stopTicking();
    win.removeEventListener('pagehide', onPageHide); win.removeEventListener('pageshow', onPageShow); observer?.disconnect();
    try { stage?.dispose(); } catch { /* total teardown continues */ }
    for (const lease of atlasLeases.splice(0)) { try { lease.release(); } catch { /* teardown continues */ } }
    try { app?.destroy(true, { children: true }); } catch { /* the second renderer is gone either way */ }
    stage = null; app = null; section.remove(); setPhase('disposed', why); if (current === handle) current = null;
  };
  const build = async (): Promise<Battle2Status> => {
    const assets = input.assets ?? devAssetSource();
    const keyer: Battle2Keyer = input.keyer ?? ((rgba, w, h) => keyAndDespill(rgba, w, h));
    const [recipeRaw, anchorsRaw, far, mid, near] = await Promise.all([assets.json(BATTLE2_ASSETS.recipe), assets.json(BATTLE2_ASSETS.anchors), assets.image(BATTLE2_ASSETS.far), assets.image(BATTLE2_ASSETS.mid), assets.image(BATTLE2_ASSETS.near)]);
    const recipe = recipeRaw as { groundLineNormalized: number; seed: number; systemCard: string; battleContext?: { worldKey?: string } };
    if (typeof recipe.groundLineNormalized !== 'number' || typeof recipe.seed !== 'number' || typeof recipe.systemCard !== 'string') throw new Error('battle2 arena recipe lacks groundLineNormalized/seed/systemCard');
    const parsed = parseEffectSequenceAnchors(anchorsRaw); if (!parsed.ok) throw new Error(`battle2 anchors refused: ${parsed.reason}`);
    const anchors: EffectSequenceAnchors = parsed.anchors;
    // One painted sequence (Wild) today; every other theme plays the labelled procedural emitter with its §4K material colour.
    const themes = new EffectThemeLibrary([anchors]);
    // Default records: the Civet landmark record (as before) plus every registered source paint-skin fit's record; a missing
    // fit is skipped with its reason, and one body is never listed twice (the Civet fit carries the same record bytes).
    const loadRecords = async (): Promise<ResolvedAnatomyRecord[]> => {
      const out: ResolvedAnatomyRecord[] = [], seen = new Set<string>();
      const admit = (r: ResolvedAnatomyRecord): void => { const key = r.recipeHash ?? r.identity.speciesVisualKey; if (!seen.has(key)) { seen.add(key); out.push(r); } };
      try { admit(await assets.json(BATTLE2_ASSETS.civetRecord) as ResolvedAnatomyRecord); } catch (error) { skipped.push(`Civet: landmark record unavailable (${error instanceof Error ? error.message : String(error)})`); }
      for (const fit of BATTLE2_ASSETS.partsFits) { try { admit(await assets.json(fit.dir + 'record.json') as ResolvedAnatomyRecord); } catch (error) { skipped.push(`${fit.earthName}: fit record unavailable (${error instanceof Error ? error.message : String(error)})`); } }
      return out;
    };
    const records = input.records ?? await loadRecords();
    if (disposed) throw new Error('disposed while loading');
    const texture = (img: Battle2Image): EffectTextureLike => pixi.Texture.from(img.source);
    const champion = input.settlement.champion, championGenome = champion.kind === 'owned-fauna' && champion.genome ? champion.genome : null;
    const rigContainer = (): RigContainerLike => new pixi.Container();
    const buildRig = async (side: 'left' | 'right', name: string, genome: Readonly<Record<string, unknown>> | null): Promise<{ rig: BattleRigV1; card: BodyCard | null; mass: number; seed: number }> => {
      const seed = genomeSeed(genome, `${input.settlement.battleId}:${side}:${name}`);
      const record = matchRecord(records, genome);
      if (record) {
        // E1 §1.1: the source paint-skin rig when this record has a registered fit; fixture, then portrait, otherwise.
        const fit = BATTLE2_ASSETS.partsFits.find((f) => f.earthName === record.identity.earthName);
        if (fit && assets.bytes) {
          try {
            const card = compileBodyCard(record, (genome ?? undefined) as MotionGenomeFields | undefined);
            const [binding, keyed, manifest] = await Promise.all([assets.json(fit.dir + 'binding.json') as Promise<CreaturePartsBindingV1>, assets.image(fit.dir + 'parts/keyed.png'), assets.json(fit.dir + 'parts/manifest.json') as Promise<{ creatureId?: string }>]);
            if (typeof manifest.creatureId !== 'string') throw new Error('parts manifest lacks creatureId');
            const source = (record as { source?: unknown }).source;
            if (typeof source !== 'string') throw new Error('record has no painter master source');
            const [master, atlas] = await Promise.all([assets.bytes(auditAssetPath(repoRelativeSource(source))), assets.bytes(fit.dir + 'parts/atlas/' + manifest.creatureId + '.png')]);
            const pixels = keyed.pixels(), alpha = new Uint8Array(keyed.width * keyed.height); for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3] ?? 0;
            if (keyed.width !== record.geometry.width || keyed.height !== record.geometry.height) throw new Error('keyed cut-out size disagrees with the record geometry');
            // the morph system: this genome's individual on the accepted archetype (identity genome → the archetype's own path)
            const markingMask = await loadMarkingMask(assets, fit.markingsDir ?? fit.dir, record as unknown as { recipeHash: string; genome?: Record<string, unknown> | null; identity?: { speciesVisualKey?: string }; geometry: { width: number; height: number } }, genome);
            const morph = individualFromGenomeV1({ record: record as unknown as { recipeHash: string; genome?: Record<string, unknown> | null; identity?: { speciesVisualKey?: string }; geometry: { width: number; height: number } }, binding, card, genome, markingMask });
            // a morphed individual's texture comes from the app's cache (one decode + remap per individual, shared and borrowed;
            // released when this study is disposed); the archetype itself takes the loader's own guarded decode as before
            let paintRig: CreatureRigV1;
            if (morph.atlasPixels) { const lease = await morphAtlasCache.acquire(morphAtlasKey(record.recipeHash ?? record.identity.speciesVisualKey, speciesVisualKey(genome as Record<string, unknown>), morph.marking), async () => (await decodeMorphedAtlas(atlas, record as unknown as CreatureRigRecordV1, binding, morph.atlasPixels!)).texture); atlasLeases.push(lease);
              paintRig = await loadCreatureRigV1(record as unknown as CreatureRigRecordV1, binding, master, alpha, atlas, async () => lease.texture, { borrowedAtlas: true, ...(morph.jointScale ? { jointScale: morph.jointScale } : {}) }); }
            else paintRig = await loadCreatureRigV1(record as unknown as CreatureRigRecordV1, binding, master, alpha, atlas, undefined, morph.jointScale ? { jointScale: morph.jointScale } : {});
            const rig = createPartsRig({ record: record as unknown as CreatureRigRecordV1, rig: paintRig, card, alphaBox: alphaBox(pixels, keyed.width, keyed.height), binding, ...(morph.jointScale ? { jointScale: morph.jointScale } : {}) });
            return { rig, card, mass: card.massClass.multiplier, seed };
          } catch (error) { skipped.push(`${name}: parts rig unavailable (${error instanceof Error ? error.message : String(error)}); fixture fallback`); }
        } else if (fit) skipped.push(`${name}: parts rig needs raw asset bytes; fixture fallback`);
        try {
          const card = compileBodyCard(record, (genome ?? undefined) as MotionGenomeFields | undefined);
          const masterPath = record.identity.earthName === 'Civet' ? BATTLE2_ASSETS.civetMaster : null;
          if (!masterPath) throw new MotionCompileError('missing-record', `no keyed master path is registered for ${record.identity.earthName ?? record.identity.speciesVisualKey.slice(0, 24)}`);
          const master = await assets.image(masterPath), keyed = keyer(master.pixels(), master.width, master.height);
          // Boundary-band underlap (C2 review, 2026-09-13): ancestors carry their descendants' cut bands at a limit-driven depth, so joints do not open.
          const cut = cutFixtureParts(keyed.alpha, master.width, master.height, record, { underlapPx: Math.round(master.width * 0.02), underlapByLimit: { limitsDeg: card.bounds.limitsDeg, capPx: Math.floor(Math.min(master.width, master.height) / 8) } });
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
    const left = await buildRig('left', input.chronicle.championName, championGenome);
    const right = await buildRig('right', input.chronicle.defenderName, input.settlement.encounter.defender.battleGenome);
    // D2 G6: a guardian rig moves the stands (GUARDIAN_STANDS) — composed after the rigs so the layout knows the guardian side
    const guardianSide = left.rig.guardian ? 'left' : right.rig.guardian ? 'right' : undefined;
    const layout = composeArena({ id: recipe.battleContext?.worldKey ?? 'arena', groundLineNormalized: recipe.groundLineNormalized, plates: { far, mid, near } }, BATTLE2_FRAME, guardianSide ? { guardianSide } : {});
    if (disposed) { left.rig.dispose(); right.rig.dispose(); throw new Error('disposed while rigging'); }
    rigLabels.left = left.rig.label; rigLabels.right = right.rig.label;
    refusalsOf = () => Object.freeze({ left: left.rig.refusals?.() ?? null, right: right.rig.refusals?.() ?? null });
    // E1 §1.4: the habitat decides each side's medium and band on the selected world; UNSUPPORTED keeps the Chronicle path with its reason.
    // sized by the mass rule, then capped to the arena WIDTH (a long body) — guardians keep their decided fill — then fitted to
    // its medium band by the habitat below; the stage takes the resulting scale whenever it differs from its own mass rule
    const painted = (r: { rig: BattleRigV1; mass: number }) => combatantPresentation(r.rig, r.mass, BATTLE2_FRAME);
    const paintedLeft = painted(left), paintedRight = painted(right);
    const habitat = selectHabitatArena({ contextId: input.settlement.battleId, seed: recipe.seed, round: 0, kind: 'wild', worlds: input.worlds ?? null, groundLineY: layout.groundLineY, fitToBand: true,
      left: { record: matchRecord(records, championGenome), genome: championGenome, label: input.chronicle.championName, painted: paintedLeft },
      right: { record: matchRecord(records, input.settlement.encounter.defender.battleGenome), genome: input.settlement.encounter.defender.battleGenome, label: input.chronicle.defenderName, painted: paintedRight } });
    arenaLabel = habitat.label;
    if (habitat.status === 'UNSUPPORTED') { left.rig.dispose(); right.rig.dispose(); throw new Error(`battle2 habitat: ${habitat.reason}`); }
    // The kit's stand x (§7, the accepted three-plate composition) is kept; the habitat supplies the medium and the vertical band.
    // a flyer or swimmer too tall for its band is scaled to fit it (habitat `fit`); the stage takes that exact scale, so the
    // habitat's containment and the drawn size agree. Nothing fitted → the stage's own mass rule, byte-identical to before.
    const wet = habitat.stands.left.medium === 'water' || habitat.stands.right.medium === 'water'; // the wet arena: water behind the swimmers, no dry foreground
    const fitted = paintedLeft.capped || paintedRight.capped || habitat.stands.left.fit < 1 || habitat.stands.right.fit < 1;
    const presentationScales = { left: paintedLeft.scale * habitat.stands.left.fit, right: paintedRight.scale * habitat.stands.right.fit };
    const stagedLayout = { ...layout, stands: Object.freeze({ left: Object.freeze({ x: layout.stands.left.x, y: habitat.stands.left.y }), right: Object.freeze({ x: layout.stands.right.x, y: habitat.stands.right.y }) }) };
    const mediums = { A: habitat.stands.left.medium, B: habitat.stands.right.medium } as const;
    // E1 §1.2: one anatomy attack per staged attack, chosen deterministically by Codex's compiler; a refusal leaves the family delivery clip and is labelled once.
    const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => {
      const card = side === 'A' ? left.card : right.card, key = side === 'A' ? 'left' : 'right'; if (!card) return null;
      try { const r = compileAnatomyAttack(card, mediums[side], ordinal); attackLabels[key] = `${r.attack.verb} (${r.attack.contactJoint})`; return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; }
      catch (error) { attackLabels[key] ??= `family delivery clip (no admitted anatomy move: ${error instanceof Error ? error.message : String(error)})`; return null; }
    };
    const phaseTextures = new Map<string, Promise<EffectTextureLike>>();
    for (const p of anchors.phases) phaseTextures.set(p.keyedImage, assets.image(p.keyedImage).then(texture));
    const resolvedPhaseTextures = new Map<string, EffectTextureLike>();
    for (const [k, v] of phaseTextures) resolvedPhaseTextures.set(k, await v);
    const dot = particleDiscRgba(PARTICLE_DISC_SIZE);
    const worldLife = new WorldLifePixiAdapter({ spec: compileWorldLife(recipe.systemCard, recipe.seed, 'arena', { tier: input.deviceTier === 'low' ? 'phone' : 'desktop' }),
      factory: { container: () => new pixi.Container(), graphics: () => new pixi.Graphics() }, clock: input.clock, width: BATTLE2_FRAME.width, height: BATTLE2_FRAME.height, reducedMotion: input.reducedMotion });
    const style = { fontFamily: 'system-ui', fontSize: 34, fontWeight: '700', fill: '#fff2c8', stroke: { color: '#2a1a0a', width: 4 } };
    const factory: BattleStageFactory = { container: () => new pixi.Container(), sprite: (t) => new pixi.Sprite(t), text: (t) => new pixi.Text({ text: t, style, anchor: 0.5 }), graphics: () => new pixi.Graphics() };
    // B5: one voice per side from its record (or genome), derived through the A4 engine from the labelled placeholder archetype until C3 lands.
    voices = createCreatureVoiceHook({ sources: synthesizePlaceholderQuadruped().sources, seed: recipe.seed ^ fnv1a32(input.settlement.battleId),
      sides: { left: { record: matchRecord(records, championGenome), genome: championGenome, seed: left.seed, label: input.chronicle.championName },
        right: { record: matchRecord(records, input.settlement.encounter.defender.battleGenome), genome: input.settlement.encounter.defender.battleGenome, seed: right.seed, label: input.chronicle.defenderName } } });
    cueSink = input.audio ? createTurnCueSink({ runtime: input.audio, seed: recipe.seed ^ fnv1a32(input.settlement.battleId), phone: input.deviceTier === 'low', creatureVoice: voices }) : null;
    const built = new BattleStage({ factory, clock: input.clock, layout: stagedLayout, plates: { far: texture(far), mid: texture(mid), near: texture(near) }, rigs: { left: left.rig, right: right.rig }, masses: { left: left.mass, right: right.mass }, ...(fitted ? { presentationScales } : {}), ...(wet ? { water: { surfaceY: habitat.surfaceY } } : {}),
      worldLife, reducedMotion: input.reducedMotion, cues: cueSink ? { sink: cueSink, phone: input.deviceTier === 'low' } : null, effects: input.reducedMotion ? null : { host: createPixiEffectHost({ Sprite: pixi.Sprite, Particle: pixi.Particle, ParticleContainer: pixi.ParticleContainer } as unknown as Parameters<typeof createPixiEffectHost>[0]),
        particleTexture: texture(raster(dot, PARTICLE_DISC_SIZE, PARTICLE_DISC_SIZE)), seed: recipe.seed,
        phaseTextures: (a) => a.phases.map((p) => { if (isProceduralImage(p.keyedImage)) return null; const t = resolvedPhaseTextures.get(p.keyedImage); if (!t) throw new Error(`battle2 phase image ${p.keyedImage} was not loaded`); return t; }),
        emittersForTheme: (t) => themes.emittersFor(t, input.deviceTier === 'low' ? 'phone' : 'desktop'), tintForTheme: (t) => themes.tintFor(t) } });
    const themeA = genomeTheme(championGenome), themeB = genomeTheme(input.settlement.encounter.defender.battleGenome);
    effectLabels.left = `${themeA}: ${themes.resolve(themeA).label}`; effectLabels.right = `${themeB}: ${themes.resolve(themeB).label}`;
    const ctx: TurnOutcomeContext = {
      A: { side: 'A', name: input.chronicle.championName, mass: left.mass, card: left.card, theme: themeA, seed: left.seed },
      B: { side: 'B', name: input.chronicle.defenderName, mass: right.mass, card: right.card, theme: themeB, seed: right.seed },
      arena: { groundLineY: layout.groundLineY, stands: stagedLayout.stands }, seed: fnv1a32(input.settlement.battleId) ^ recipe.seed, anchorsForTheme: (t) => themes.anchorsFor(t), readyMs: 900, commandMs: 400, reducedMotion: input.reducedMotion, attackFor,
    };
    const ordinals = { A: 0, B: 0 };
    for (const row of input.settlement.transcript.log) { const side = row.side === 'B' || (row.dodge === true && row.an === input.chronicle.defenderName) ? 'B' : 'A'; const t = turnPlanInputFromTranscriptEvent(row, ctx, ordinals[side]); if (t.kind === 'turn') { turns.push(t.input); ordinals[side] += 1; } else skipped.push(t.reason); }
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
