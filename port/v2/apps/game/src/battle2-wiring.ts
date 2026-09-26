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
 * Assets are fetched relative to `/battle2/…/arena-recipe.json`, served from `public/battle2/` (shipped by
 * `tools/morph/build-shipped-battle2.mjs`, listed with SHA-256 in its MANIFEST.json; each keyed cut-out ships as its
 * alpha only). In a built game the service worker refuses these files today (outside its build marker; Codex's lane
 * item), so the arena stages on an uncontrolled page such as the dev server. The keyer is Codex's `kit-contact-math.mjs`, imported
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
 * delivery clip, labelled. C13 (2026-09-25): each parts fit's raw bytes pass the bundled build pin's preflight
 * (`battle2-master-pin-admission.ts`) before any decode, mask fetch, morph-cache lease or master fetch. Not yet done here: synchronising turns to the Chronicle cue cadence (the study plays the
 * transcript through at its own pace); a crab cannot attack until R3 admits pinch (labelled per side in `status().attacks`). */
import { keyAndDespill } from '../../../../../tools/local-image-generation/kit-contact-math.mjs';
/** The shipped battle2 assets (`apps/game/public/battle2/…`, mirrored by `tools/morph/build-shipped-battle2.mjs`) keep the
 * proof folders' relative layout, so every path below resolves against this recipe URL unchanged. */
const arenaRecipeUrl = '/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json';
import { speciesVisualKey } from '@cf/art/species-identity';
import { BattleStage, GUARDIAN_FRAME_FILL, combatantPresentation, standCentreShift, combatantScale, composeArena, createFixtureRig, createPortraitRig, cutFixtureParts, lakeArenaWorld, selectHabitatArena, turnPlanInputFromTranscriptEvent,
  type BattleRigV1, type BattleStageFactory, type FixturePartCut, type RigContainerLike, type RigSpriteLike,
  type StageGraphicsLike, type StageSpriteLike, type StageTextLike, type TurnAttack, type TurnOutcomeContext, type TurnPlanInput } from './battle2/index.js';
// parts-rig (and Codex's pixi-backed creature-rig behind it) is imported by path, not through battle2/index: the root
// test program must stay free of pixi.js types (see apps/game/tsconfig.json _skipLibCheckReason).
import { createPartsRig } from './battle2/parts-rig.js';
import { attackRepertoire, compileAnatomyAttack, type WeaponDeclaration } from './anatomy-attacks.js';
import type { ArenaWorld } from './battle-habitat.js';
import { individualFromGenomeV1 } from './morph/morph-individual.js';
import { morphAtlasCache, morphAtlasKey, type MorphAtlasLease } from './morph/morph-atlas-cache.js';
import { markingNameV1, maskAlphaOf, type AlphaMask } from './morph/morph-markings.js';
import { archetypeGenomeV1, morphParamsV1 } from './morph/morph-params.js';
import { decodePng } from './morph/png-decode.js';
import { paintedStandInV1 } from './morph/painted-stand-in.js';
import type { CombatChroniclePacerGateV1 } from './combat-chronicle.js';
import { decodeMorphedAtlas, loadPinnedCreatureRigV1, type CreaturePartsBindingV1, type CreatureRigRecordV1, type CreatureRigV1 } from './creature-rig.js';
import { abilityTheme } from '@cf/domain-combatcore';
import { parseEffectSequenceAnchors, type EffectSequenceAnchors } from './effects/anchors.js';
import { EffectThemeLibrary, isEffectTheme, isProceduralImage } from './effects/theme-library.js';
import { PARTICLE_DISC_SIZE, particleDiscRgba } from './effects/particle-texture.js';
import { createPixiEffectHost, type EffectParticleLike, type EffectSpriteLike, type EffectTextureLike } from './effects/pixi-adapter.js';
import { compileBodyCard, MotionCompileError, type BodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from './motion/body-card.js';
import { createTurnCueSink, type TurnAudioRuntime, type TurnCueSink } from './soundkit/turn-audio.js';
import { createCreatureVoiceHook, type CreatureVoiceHook } from './soundkit/creature-voices.js';
import { creatureVoiceCardV1, ownedCreatureVoiceCardV1 } from './soundkit/voice-identity.js';
import type { VoiceCard } from './soundkit/voice-card.js';
import type { CreatureInstanceId, OwnershipStateV2 } from '@cf/domain-acquisition';
import { synthesizePlaceholderLibrary } from './soundkit/placeholder-archetype.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { BATTLE2_SWAP_BEAT_MS_V1, BATTLE2_SWAP_BEAT_REDUCED_MS_V1, battle2SwapBeatsV1, type Battle2SwapBeatV1 } from './battle2/swap-beats.js';
import type { CombatSettlementPlanV1 } from '@cf/domain-combatcore';
import { getBattle2MasterPin } from './battle2-master-pins.generated.js';
import { Battle2PinRefusal, gunzipTransportBytes, preflightBattle2PinnedBytesV1 } from './battle2-master-pin-admission.js';
import { placeCombatants } from './battle2/placement.js';
import { MASS_BY_SIZE_INDEX, MASS_CLASS } from './motion/timing.js';
import type { SpeciesArtLoader } from './species-art-loader.js';
import { loaderPortrait } from './species-portrait.js';
import { compileWorldLife, WorldLifePixiAdapter, type WorldLifeGraphicsLike } from './worldlife/index.js';

export const BATTLE2_FLAG = 'battle2' as const;
export const BATTLE2_FRAME = Object.freeze({ width: 1024, height: 576 });
/** Audit paths (relative to the arena proof directory) of the accepted plates, anchors, the landmark records and the
 * source paint-skin fits (E1 §1.1): every painted archetype (`battle2-archetypes.ts`, generated). Each fit
 * directory holds `record.json`, `binding.json.gz` (gzip of the fit's binding.json), `parts/alpha.png` (the keyed cut-out's alpha only, shipped by
 * build-shipped-battle2.mjs), `parts/manifest.json` and `parts/atlas/<id>.png`;
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
/** The inverse (C13 pin paths): an arena-relative `../X` asset path as its repo-relative `audits/X`; anything else is returned
 * unchanged and therefore fails the pin's canonical-path equality (fail closed, never resolved). */
export const repoPathOfAsset = (assetPath: string): string => (assetPath.startsWith('../') ? 'audits/' + assetPath.slice(3) : assetPath);
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
  readonly encounter: { readonly defender: { readonly battleGenome: Readonly<Record<string, unknown>>; readonly kind?: string } };
  readonly transcript: { readonly log: readonly Readonly<Record<string, unknown>>[] };
  /** §20 Guardian party: the settled plan's party block; the stage plays one relay beat per earlier fighter first. */
  readonly party?: CombatSettlementPlanV1['party'];
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
  /** Nick 2026-09-24: the stage paces the Chronicle log — each transcript row is released at its turn's impact (every row on
   * finish, failure or dispose). main.ts passes a gate only when motion is on; absent = the log keeps its own cadence. */
  readonly pacer?: CombatChroniclePacerGateV1 | null;
  /** D15 Stage 0: the live ownership state, so an owned champion speaks with the voice its own AudioSignature gives it everywhere else. */
  readonly ownership?: OwnershipStateV2 | null;
  readonly records?: readonly ResolvedAnatomyRecord[];
  /** Portrait art for combatants without a landmark record (default: the species art loader's 132 px thumb). */
  readonly portrait?: (genome: Readonly<Record<string, unknown>>) => Promise<Battle2Image>;
  readonly win?: Pick<Window, 'addEventListener' | 'removeEventListener'> & { readonly MutationObserver?: typeof MutationObserver };
  /** Audio runtime port for the turn cues (B1). Absent = the study stages silently and reports `audio: none`; main.ts passes the audio owner's decorative port. */
  readonly audio?: TurnAudioRuntime | null;
  /** The battle's home and visitor worlds for habitat arena selection (E1 §1.4). Absent = the accepted Earth-temperate plates, labelled as the default. */
  readonly worlds?: Readonly<{ home: ArenaWorld; visitor: ArenaWorld }> | null;
  /** A named world built on the study's own ground line (the matchup picker): `lake` = liquid water with a surface. Ignored when `worlds` is given. */
  readonly worldPreset?: 'lake';
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
  /** D15 Stage 0 diagnostics: each side's ONE voice card as the stage voices it (null = no voice). */
  readonly voiceCards: Readonly<{ left: VoiceCard | null; right: VoiceCard | null }>;
  /** §20: relay beats before the decisive leg (one per earlier fighter) and the one showing (-1 before, = beats when done). */
  readonly beats?: Readonly<{ count: number; index: number; text: string | null }>;
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
  const exact = records.find((r) => (key !== null && r.identity.speciesVisualKey === key) || (earth !== null && r.identity.earthName === earth));
  if (exact) return exact;
  // Nick 2026-09-24 ("that art style should carry throughout the game"): no painting of its own → the painted STAND-IN for its body
  // (painted-stand-in.ts: its body plan's archetype, or the body family the procedural painter draws), morphed by its own genes
  const painted = new Set(BATTLE2_ASSETS.partsFits.map((f) => f.earthName)), stand = paintedStandInV1(genome, painted);
  return stand ? records.find((r) => r.identity.earthName === stand.earthName) ?? null : null;
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
/** Fetches each arena file relative to arena-recipe.json (`/battle2/…`, served from `public/`). A built game's service worker
 * refuses these today (they are outside the build marker, pwa-build.ts), so the arena stages only on an uncontrolled page. */
export function devAssetSource(recipeUrl: string = arenaRecipeUrl, base: string = location.href): Battle2AssetSource {
  if (/^data:/.test(recipeUrl)) throw new Error('battle2 assets unavailable: this build inlined arena-recipe.json; the proof plates are a dev-only fetch');
  const dir = new URL('.', new URL(recipeUrl, base));
  const get = async (path: string): Promise<Response> => { const r = await fetch(new URL(path, dir).href); if (!r.ok) throw new Error(`battle2 asset ${path}: HTTP ${r.status}`); return r; };
  return {
    // a `.gz` file (the shipped part bindings) is gunzipped here; the bytes are sniffed, so a server that already decoded it still works
    json: async (path) => { const r = await get(path); if (!path.endsWith('.gz')) return r.json(); const b = new Uint8Array(await r.arrayBuffer());
      if (b[0] !== 0x1f || b[1] !== 0x8b) return JSON.parse(new TextDecoder().decode(b));
      return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).json(); },
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
  const skipped: string[] = []; let turns: TurnPlanInput[] = []; const turnRows: number[] = []; let turnStart = 0, impactAt = Infinity, releasedTurn = -1;
  const releaseThrough = (turn: number): void => { if (turn <= releasedTurn) return; releasedTurn = turn; input.pacer?.release(turnRows[turn]!); }; const rigLabels = { left: null as string | null, right: null as string | null }, effectLabels = { left: null as string | null, right: null as string | null };
  const attackLabels = { left: null as string | null, right: null as string | null }; let arenaLabel: string | null = null; let refusalsOf: () => Readonly<{ left: number | null; right: number | null }> = () => Object.freeze({ left: null, right: null });
  let app: Battle2AppLike | null = null, stage: BattleStage | null = null, ticking = false, disposed = false, cueSink: TurnCueSink | null = null;
  const audioSummary = (): string => (cueSink ? `${cueSink.log.length} cues: ${cueSink.log.map((e) => `${e.cueId}=${e.result}`).join(', ')}` : 'none');
  let voices: CreatureVoiceHook | null = null;
  let beats: readonly Battle2SwapBeatV1[] = [], beatIndex = -1, beatStart = 0, beatCaption: StageTextLike | null = null;
  const beatMs = input.reducedMotion ? BATTLE2_SWAP_BEAT_REDUCED_MS_V1 : BATTLE2_SWAP_BEAT_MS_V1;
  const status = (): Battle2Status => Object.freeze({ beats: Object.freeze({ count: beats.length, index: beatIndex, text: beatIndex >= 0 && beatIndex < beats.length ? beats[beatIndex]!.text : null }), phase, reason, label, turns: turns.length, turnIndex, skipped: Object.freeze([...skipped]), rigs: Object.freeze({ ...rigLabels }), ticks, effects: Object.freeze({ ...effectLabels }), arena: arenaLabel, attacks: Object.freeze({ ...attackLabels }), refusals: refusalsOf(), audio: audioSummary(), voices: Object.freeze({ left: voices?.status.left ?? null, right: voices?.status.right ?? null }), voiceCards: Object.freeze({ left: voices?.cards.left ?? null, right: voices?.cards.right ?? null }) });
  const setPhase = (next: Battle2Phase, why: string | null = null): void => { phase = next; reason = why; section.dataset.battle2Status = next; if (why) section.dataset.battle2Reason = why; };
  const tickUnguarded = (): void => {
    if (disposed || !stage || !app) return;
    if (!input.mount.isConnected || section.parentElement !== input.mount) { dispose('mount left the document'); return; }
    ticks++;
    const play = (i: number): void => { turnStart = input.clock(); impactAt = stage!.play(turns[i]!).beats.impactAt; section.dataset.battle2Turn = String(i); };
    // §20 relay beats: each earlier party fighter's exit holds a captioned beat before the decisive leg's first turn
    if (turnIndex < 0 && beatIndex < beats.length) {
      if (beatIndex < 0 || input.clock() - beatStart >= beatMs) {
        beatIndex++; beatStart = input.clock();
        if (beatIndex < beats.length && beatCaption) { beatCaption.text = beats[beatIndex]!.text; section.dataset.battle2Beat = String(beatIndex); }
      }
      if (beatIndex < beats.length) { stage.tick(); app.renderer.render(app.stage); return; }
      if (beatCaption) beatCaption.visible = false;
    }
    if (turnIndex < 0) { turnIndex = 0; play(0); }
    const frame = stage.tick();
    if (ticks % 30 === 0) section.dataset.battle2Ticks = String(ticks); // smoke diagnostics (cheap)
    if (input.clock() - turnStart >= impactAt) releaseThrough(turnIndex); // this turn's Chronicle row appears at its impact
    if (frame?.done) {
      releaseThrough(turnIndex);
      if (turnIndex + 1 < turns.length) { turnIndex++; play(turnIndex); }
      else if (phase === 'playing') { setPhase('finished'); stopTicking(); input.pacer?.releaseAll(); }
    }
    app.renderer.render(app.stage);
  };
  // the flagged study must never throw into the game's SHARED ticker: a throw inside a ticker callback stops Pixi's ticker and the
  // whole game freezes (2026-09-24, a Python's missing voice source set in a real browser). A failed tick fails the study, labelled.
  const tick = (): void => { try { tickUnguarded(); } catch (error) { const why = `stage tick failed: ${error instanceof Error ? error.message : String(error)}`; dispose(why); setPhase('failed', why); } };
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
    if (disposed) return; disposed = true; stopTicking(); input.pacer?.releaseAll();
    win.removeEventListener('pagehide', onPageHide); win.removeEventListener('pageshow', onPageShow); observer?.disconnect();
    try { stage?.dispose(); } catch { /* total teardown continues */ }
    for (const lease of atlasLeases.splice(0)) { try { lease.release(); } catch { /* teardown continues */ } }
    // The main game renderer still owns shared Pixi resources. Boolean true
    // would release its live pooled batches when this secondary renderer closes.
    try { app?.destroy({ removeView: true, releaseGlobalResources: false }, { children: true }); } catch { /* the second renderer is gone either way */ }
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
      // all registered fits' records in parallel (17 archetypes: one round trip, not seventeen), admitted in registry order
      const fetched = await Promise.allSettled(BATTLE2_ASSETS.partsFits.map((fit) => assets.json(fit.dir + 'record.json') as Promise<ResolvedAnatomyRecord>));
      fetched.forEach((r, i) => { const fit = BATTLE2_ASSETS.partsFits[i]!; if (r.status === 'fulfilled') admit(r.value); else skipped.push(`${fit.earthName}: fit record unavailable (${r.reason instanceof Error ? r.reason.message : String(r.reason)})`); });
      return out;
    };
    const records = input.records ?? await loadRecords();
    if (disposed) throw new Error('disposed while loading');
    const texture = (img: Battle2Image): EffectTextureLike => pixi.Texture.from(img.source);
    const champion = input.settlement.champion, championGenome = champion.kind === 'owned-fauna' && champion.genome ? champion.genome : null;
    const rigContainer = (): RigContainerLike => new pixi.Container();
    const buildRig = async (side: 'left' | 'right', name: string, genome: Readonly<Record<string, unknown>> | null): Promise<{ rig: BattleRigV1; card: BodyCard | null; mass: number; seed: number; declaration?: WeaponDeclaration }> => {
      const seed = genomeSeed(genome, `${input.settlement.battleId}:${side}:${name}`);
      const record = matchRecord(records, genome);
      if (record) {
        // E1 §1.1: the source paint-skin rig when this record has a registered fit; fixture, then portrait, otherwise.
        const fit = BATTLE2_ASSETS.partsFits.find((f) => f.earthName === record.identity.earthName);
        if (fit && assets.bytes) {
          try {
            const card = compileBodyCard(record, (genome ?? undefined) as MotionGenomeFields | undefined);
            const manifest = await assets.json(fit.dir + 'parts/manifest.json') as { creatureId?: string };
            if (typeof manifest.creatureId !== 'string') throw new Error('parts manifest lacks creatureId');
            const pin = getBattle2MasterPin(manifest.creatureId);
            if (!pin) throw new Battle2PinRefusal('missing-pin', `no bundled build pin for ${manifest.creatureId}`);
            const alphaAsset = fit.dir + 'parts/alpha.png', atlasAsset = fit.dir + 'parts/atlas/' + manifest.creatureId + '.png';
            const [alphaBytes, bindingTransport, atlas] = await Promise.all([assets.bytes(alphaAsset), assets.bytes(fit.dir + 'binding.json.gz'), assets.bytes(atlasAsset)]);
            const pinnedInput = { pin, creatureId: manifest.creatureId, record, alphaPath: repoPathOfAsset(alphaAsset), alpha: alphaBytes,
              bindingBytes: await gunzipTransportBytes(bindingTransport), atlasPath: repoPathOfAsset(atlasAsset), atlas };
            const admitted = await preflightBattle2PinnedBytesV1(pinnedInput);
            const binding = admitted.binding as CreaturePartsBindingV1;
            const keyed = await decodePng(alphaBytes);
            const pixels = new Uint8ClampedArray(keyed.rgba.buffer, keyed.rgba.byteOffset, keyed.rgba.length);
            if (keyed.width !== record.geometry.width || keyed.height !== record.geometry.height) throw new Error('alpha cut-out size disagrees with the record geometry');
            // the morph system: this genome's individual on the accepted archetype (identity genome → the archetype's own path)
            const markingMask = await loadMarkingMask(assets, fit.markingsDir ?? fit.dir, record as unknown as { recipeHash: string; genome?: Record<string, unknown> | null; identity?: { speciesVisualKey?: string }; geometry: { width: number; height: number } }, genome);
            const morph = individualFromGenomeV1({ record: record as unknown as { recipeHash: string; genome?: Record<string, unknown> | null; identity?: { speciesVisualKey?: string }; geometry: { width: number; height: number } }, binding, card, genome, markingMask });
            // a morphed individual's texture comes from the app's cache (one decode + remap per individual, shared and borrowed;
            // released when this study is disposed); the archetype itself takes the loader's own guarded decode as before
            let paintRig: CreatureRigV1;
            if (morph.atlasPixels) { const lease = await morphAtlasCache.acquire(morphAtlasKey(record.recipeHash ?? record.identity.speciesVisualKey, speciesVisualKey(genome as Record<string, unknown>), morph.marking), async () => (await decodeMorphedAtlas(atlas, record as unknown as CreatureRigRecordV1, binding, morph.atlasPixels!)).texture); atlasLeases.push(lease);
              paintRig = await loadPinnedCreatureRigV1(pinnedInput, async () => lease.texture, { borrowedAtlas: true, ...(morph.jointScale ? { jointScale: morph.jointScale } : {}) }); }
            else paintRig = await loadPinnedCreatureRigV1(pinnedInput, undefined, morph.jointScale ? { jointScale: morph.jointScale } : {});
            const rig = createPartsRig({ record: record as unknown as CreatureRigRecordV1, rig: paintRig, card, alphaBox: alphaBox(pixels, keyed.width, keyed.height), binding, ...(fit.contactSupports ? { contactSupports: fit.contactSupports } : {}), ...(morph.jointScale ? { jointScale: morph.jointScale } : {}) });
            // C15: a painter weapon declaration (hash-bound to this record) rides with its fit into compileAnatomyAttack
            const declaration = fit.weaponDeclaration ? await assets.json(fit.weaponDeclaration) as WeaponDeclaration : undefined;
            return { rig, card, mass: card.massClass.multiplier, seed, ...(declaration ? { declaration } : {}) };
          } catch (error) { throw new Error(`${name}: pinned parts rig unavailable (${error instanceof Error ? error.message : String(error)})`); }
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
    // E1 §1.4 + 2026-09-24: ONE placement pipeline (battle2/placement.ts — the film harness and the tests use the same): size, habitat, band
    // fit, drawn scale, each painted box centred on its stand, the wet arena. UNSUPPORTED keeps the Chronicle path with its reason.
    const placed = placeCombatants({ contextId: input.settlement.battleId, seed: recipe.seed, layout, worlds: input.worlds ?? (input.worldPreset === 'lake' ? { home: lakeArenaWorld(layout.groundLineY), visitor: lakeArenaWorld(layout.groundLineY) } : null),
      left: { rig: left.rig, mass: left.mass, record: matchRecord(records, championGenome), genome: championGenome, label: input.chronicle.championName },
      right: { rig: right.rig, mass: right.mass, record: matchRecord(records, input.settlement.encounter.defender.battleGenome), genome: input.settlement.encounter.defender.battleGenome, label: input.chronicle.defenderName } });
    const habitat = placed.habitat; arenaLabel = habitat.label;
    if (placed.status === 'UNSUPPORTED') { left.rig.dispose(); right.rig.dispose(); throw new Error(`battle2 habitat: ${placed.habitat.reason}`); }
    const stagedLayout = placed.layout;
    const mediums = { A: placed.habitat.stands.left.medium, B: placed.habitat.stands.right.medium } as const;
    // E1 §1.2: one anatomy attack per staged attack, chosen deterministically by Codex's compiler; a refusal leaves the family delivery clip and is labelled once.
    // A DECLARED weapon fails closed (Codex's native harness law): the declared repertoire is proven here, before play, so a refusal
    // keeps the Chronicle path with its reason instead of silently staging the generic family clip (and never throws inside the ticker).
    for (const [s, built] of [['A', left], ['B', right]] as const) if (built.declaration && built.card) {
      const rep = attackRepertoire(built.card, mediums[s], built.declaration);
      if (rep.status !== 'READY') { left.rig.dispose(); right.rig.dispose(); throw new Error(`battle2: declared weapons refused for ${built.card.identity.earthName ?? 'a painted record'} (${rep.rejected.map((r) => `${r.verb}: ${r.reason}`).join(', ')})`); }
    }
    const attackFor = (side: 'A' | 'B', ordinal: number): TurnAttack | null => {
      const card = side === 'A' ? left.card : right.card, key = side === 'A' ? 'left' : 'right'; if (!card) return null;
      try { const r = compileAnatomyAttack(card, mediums[side], ordinal, undefined, (side === 'A' ? left : right).declaration); attackLabels[key] = `${r.attack.verb} (${r.attack.contactJoint})`; return { verb: r.attack.verb, timeline: r.timeline, contactMs: r.contactMs, contactJoint: r.attack.contactJoint }; }
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
    // D15 Stage 0: each side's ONE voice card (voice-identity.ts) — an owned champion through its exact ownership projection (the
    // AudioSignature Tame, Feed and the Compendium resolve), anyone else from its genome-only signature; a player has no creature voice
    const championId = (champion as { creatureId?: unknown }).creatureId;
    const championVoice = champion.kind === 'owned-fauna' && typeof championId === 'string' && input.ownership
      ? ownedCreatureVoiceCardV1(input.ownership, championId as CreatureInstanceId) : championGenome ? creatureVoiceCardV1(championGenome) : undefined;
    // a combatant with no resolvable AudioSignature (a partial genome) keeps the record-based voice rather than falling silent
    const defenderVoice = creatureVoiceCardV1(input.settlement.encounter.defender.battleGenome);
    voices = createCreatureVoiceHook({ sources: synthesizePlaceholderLibrary().sources, seed: recipe.seed ^ fnv1a32(input.settlement.battleId),
      sides: { left: { record: matchRecord(records, championGenome), genome: championGenome, seed: left.seed, label: input.chronicle.championName, ...(championVoice?.ok ? { card: championVoice } : {}) },
        right: { record: matchRecord(records, input.settlement.encounter.defender.battleGenome), genome: input.settlement.encounter.defender.battleGenome, seed: right.seed, label: input.chronicle.defenderName, ...(defenderVoice.ok ? { card: defenderVoice } : {}) } } });
    cueSink = input.audio ? createTurnCueSink({ runtime: input.audio, seed: recipe.seed ^ fnv1a32(input.settlement.battleId), phone: input.deviceTier === 'low', creatureVoice: voices }) : null;
    const built = new BattleStage({ factory, clock: input.clock, layout: stagedLayout, plates: { far: texture(far), mid: texture(mid), near: texture(near) }, rigs: { left: left.rig, right: right.rig }, masses: { left: left.mass, right: right.mass }, ...(placed.presentationScales ? { presentationScales: placed.presentationScales } : {}), ...(placed.water ? { water: placed.water } : {}),
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
    for (const [rowIndex, row] of input.settlement.transcript.log.entries()) { const side = row.side === 'B' || (row.dodge === true && row.an === input.chronicle.defenderName) ? 'B' : 'A'; const t = turnPlanInputFromTranscriptEvent(row, ctx, ordinals[side]); if (t.kind === 'turn') { turnRows.push(rowIndex); turns.push(t.input); ordinals[side] += 1; } else skipped.push(t.reason); }
    if (turns.length === 0) { built.dispose(); throw new Error('battle2: the transcript has no stageable turn'); }
    const application = new pixi.Application();
    await application.init({ width: BATTLE2_FRAME.width, height: BATTLE2_FRAME.height, resolution: input.deviceTier === 'high' ? 2 : 1, autoDensity: false, background: '#141d22', antialias: true, autoStart: false, sharedTicker: false });
    if (disposed) { built.dispose(); application.destroy({ removeView: true, releaseGlobalResources: false }, { children: true }); throw new Error('disposed while initialising the renderer'); }
    application.canvas.style.cssText = 'display:block;width:100%;height:100%'; section.append(application.canvas);
    application.stage.addChild(built.root); app = application; stage = built; label = built.label; section.dataset.battle2Label = built.label;
    beats = battle2SwapBeatsV1(input.settlement.party, { name: input.chronicle.defenderName, battleGenome: input.settlement.encounter.defender.battleGenome, kind: input.settlement.encounter.defender.kind });
    if (beats.length > 0) {
      beatCaption = new pixi.Text({ text: '', style: { ...style, fontSize: 28 }, anchor: 0.5 });
      beatCaption.x = BATTLE2_FRAME.width / 2; beatCaption.y = 56; application.stage.addChild(beatCaption as unknown as object);
    }
    setPhase('playing'); startTicking(); tick();
    return status();
  };
  const ready = build().catch((error: unknown) => { input.pacer?.releaseAll(); if (!disposed) setPhase('failed', error instanceof Error ? error.message : String(error)); return status(); });
  const handle: Battle2StudyHandle = { ready, status, dispose };
  current = handle; return handle;
}
