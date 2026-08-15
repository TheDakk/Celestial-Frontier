/* THE SLICE (Phases 3–4) — a Pixi renderer over @cf/scene speaking the
   Renderer's visual language (main.js recipes number-for-number), wearing
   the game's chrome at the GOLDEN SCREENS' geometry. Everything that can be
   wrong lives in the tested packages; this file draws, moves a camera, and
   forwards input into the tested state machines.

   Live today: the full descent ladder with zoom-driven transitions ·
   survey-first input (tap = describePick card, explicit card action = dive) · the
   charter/Ascent gates (toasting the build that opens the ring) · wormhole
   travel (reach-clamped) · comets/visitor/supernovae/moon terminators/cloud
   deck · THE REAL SAVE LOOP (importSaveV2 ⇄ exportSaveV2 over IndexedDB,
   with CF-RR-002 recovery wired) · panels (one-panel law/focus restoration)
   · Settings/Compendium/Records · search (code-paste travel) · the shipped
   audio stings · COSMIC_EPOCH on play time.

   Still ahead (recorded in ROADMAP's NEXT): the remaining 15 lessons of the complete 21-step training port,
   full Atlas chart/favorites presentation, rarity stings, ring↔planet mutual shadows, PROTO star disk,
   biome vista surfaces (Phase 6). Static deterministic Canvas species portraits
   are live; retained Pixi actors, meshes, and portrait animation remain Phase 5. */
import { Application, Container, Graphics, Sprite, Texture, Text, extensions, CullerPlugin } from 'pixi.js';
import {
  galSpriteFor, decoSprite, getPlanetSprite, starSprite,
  _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr,
  _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr, _cloudSpr,
  _wormSpr, snSiteSprite, _bhDiscSpr, _protoSpr,
  _quasarSpr, _visitorSpr, _comaSpr, _vtrailSpr,
} from '@cf/art';
import { initAudio, playWhoosh, playSurveyPing, applySfxGain } from '@cf/audio';
import { registerPanel, fillPanel, togglePanel, openPanel, closePanels, openPanelId } from './panels.js';
import { initTraining, gameEvent, trainingActive, trainingStepId } from './training.js';
import {
  getGuideCatalogue, getGuideTopic, searchGuide,
  type GuideCategoryId, type GuideTopicId, type GuideTopicView,
} from './guide-content.js';
import {
  getCurrentV2Release, getReleaseHistory, hasUnseenV2Release, V2_DEVELOPMENT_VERSION,
  type ReleaseNoteView, type V2ShippedRelease,
} from './release-content.js';
import {
  NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, viewToNav, resolveCF1WorldAddress,
  universeGalaxies, galaxyCell, galaxyCellWindow, systemScene,
  ascStageOf, ascAllowsStar, reachRadiusOf, withinReachOf, currentRegionOf, ascHintFor, primeReachHint,
  bankLandfall, reconcileV2Chapters, currentV2Objective, projectV2Charter,
  GR, GCELL, type NavState, type GalaxyNode, type PlanetNode,
} from '@cf/scene';
import { galaxyProfile, galaxyHaze, systemFor, fineStarsInCell, FCELL, galaxyWormhole, supernovaSites, galaxiesInCell, UNOISE } from '@cf/domain-worldgen';
import { planetSpecies } from '@cf/domain-ecology';
import { climateBand } from '@cf/domain-surveyphrases';
import { SYS_R, UCELL, OBS_R, HOME_GAL_SEED, HOME_POS, SOL_SEED, SOL_POS } from '@cf/domain-worldconfig';
import { galaxyName, starName, properName } from '@cf/domain-naming';
import { createEpochClock, type EpochClock } from '@cf/domain-progression';
import { mulberry32, hashInt, TAU } from '@cf/domain-rand';
import { installCaptureHooks, planetDescriptor, describePick, SOL_MOONS, galaxyStats, fmtBig, type Descriptor } from '@cf/domain-descriptors';
import { cleanName, encodeWhere, decodeWhere, _sanitizeView } from '@cf/domain-strays';
import { describeSpecies } from '@cf/domain-genome';
import { battleStats, STAT_NAMES, STAT_HUES } from '@cf/domain-combatcore';
import {
  createSaveRepository, createIndexedDBBackend,
  importSaveV2, isPlausibleSaveEnvelope, exportSaveV2, readSaveWithRecovery,
  type SaveStateV2, type ContentRegistry, type StoredPayloadStatus,
} from '@cf/persistence';
import REGISTRY_JSON from '../../../../baseline-v1.8.9/content-registry.json';

document.title = `Celestial Frontier v${V2_DEVELOPMENT_VERSION} — Development`;
installCaptureHooks();   /* GAL_SPRITES etc. until GalaxyArt fully replaces the hooks */
/* THE PORTRAIT ENGINE IS A LAZY CHUNK: ~352KB gzip of species art stays off the boot
   path; the first Compendium/planetside view kicks the load and refills
   itself when the painters arrive (idle-prefetched after boot). */
type SArt = { speciesPortrait: (g: Record<string, unknown>) => string; speciesThumb: (g: Record<string, unknown>) => string };
let SA: SArt | null = null;
let saPromise: Promise<SArt> | null = null;
const saSubscribers = new Map<string, () => void>();
function ensureSA(key: 'codex' | 'planetside' | 'prefetch', onReady: () => void): boolean {
  if (SA) return true;
  /* One latest invalidation per view. A raw Promise `.then` per call can
     retain 1,500 Compendium-row callbacks and replay the whole list 1,500
     times when the chunk resolves. Distinct views still all hear readiness. */
  saSubscribers.set(key, onReady);
  /* Every interested view subscribes to the same import. The old boolean
     retained only the callback that STARTED the load; if the 3s prefetch
     won the race, a Compendium/Planetside callback arriving in-flight was
     discarded and the view stayed empty until reopened. */
  saPromise ??= import('@cf/art/species')
    .then((mod) => {
      SA = mod as unknown as SArt;
      const callbacks = [...saSubscribers.values()];
      saSubscribers.clear();
      for (const callback of callbacks) try { callback(); } catch { /* another subscribed view still refills */ }
      return SA;
    })
    .catch((error) => { saPromise = null; throw error; });
  void saPromise.catch(() => { /* a later request retries; latest subscribers stay queued */ });
  return false;
}
/* app-state seams the VERBATIM descriptor code reads as globals (D-ST in
   DEVIATIONS — describePick reads `st`/`customNames` inside a [domain]
   module; the port passes state explicitly when Phase 4 rebuilds the card
   layer). The slice keeps them true: stSeam tracks nav below. */
const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
const gSeam = globalThis as Record<string, unknown>;
const stSeam: { gal: unknown; star: unknown } = { gal: null, star: null };
const customNames = new Map<string, string>();
gSeam.st ??= stSeam;
gSeam.customNames = customNames;   /* one app-owned map shared with descriptor seams */

extensions.add(CullerPlugin);   /* offscreen sprites skip render — thousands of stars, one flag */

const app = new Application();
const DOCUMENT_TOKEN = crypto.randomUUID();
type ReloadCanvasRelease = {
  beforeWidth: number;
  beforeHeight: number;
  afterWidth: number;
  afterHeight: number;
};
type ReplacementReloadReason = 'training-restart' | 'save-import' | 'storage-retry';
type ImportPhaseStage =
  | 'invoked' | 'validation-rejected' | 'claim-rejected' | 'claimed'
  | 'waiting-active-persist' | 'no-active-persist' | 'active-persist-settled'
  | 'primary-write-started' | 'primary-write-complete' | 'primary-write-rejected'
  | 'release-started' | 'release-complete';
type ImportPhaseWitness = {
  schema: 'cf-v2-import-phase/v1';
  phaseId: string;
  reason: 'save-import';
  documentToken: string;
  stage: ImportPhaseStage;
  sequence: number;
  tickerStarted: boolean;
  performanceNow: number;
  error: string | null;
};
type ReloadReleaseWitness = {
  schema: 'cf-v2-reload-release/v1';
  status: 'released' | 'release-failed';
  error: string | null;
  reason: ReplacementReloadReason;
  documentToken: string;
  rendererReleased: boolean;
  stageReleased: boolean;
  viewDetached: boolean;
  appCanvas: ReloadCanvasRelease;
  backdropCanvas: ReloadCanvasRelease;
};
type BootPhaseStage =
  | 'app-init-start' | 'app-init-complete' | 'backdrop-complete'
  | 'save-load-start' | 'save-load-complete' | 'scene-rendered'
  | 'slice-published' | 'wiring-complete' | 'ticker-started'
  | 'first-tick' | 'ready-scheduled' | 'ready-emitted';
type BootPhaseWitness = {
  schema: 'cf-v2-boot-phase/v1';
  documentToken: string;
  sequence: number;
  stage: BootPhaseStage;
  tickerStarted: boolean;
  performanceNow: number;
  error: null;
};
let bootPhaseSequence = 0;
function emitBootPhase(stage: BootPhaseStage): void {
  const witness: BootPhaseWitness = {
    schema: 'cf-v2-boot-phase/v1', documentToken: DOCUMENT_TOKEN,
    sequence: ++bootPhaseSequence, stage,
    tickerStarted: app.ticker?.started === true,
    performanceNow: performance.now(), error: null,
  };
  try {
    const binding = (window as unknown as Record<string, unknown>).__cfBootPhaseWitness;
    if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
  } catch { /* optional diagnostics must never strand ordinary boot */ }
}
const unreleasedCanvas = (): ReloadCanvasRelease => ({
  beforeWidth: 0, beforeHeight: 0, afterWidth: 0, afterHeight: 0,
});
let releaseRendererForReload = (reason: ReplacementReloadReason): ReloadReleaseWitness => ({
  schema: 'cf-v2-reload-release/v1', status: 'release-failed',
  error: 'renderer release hook was not initialized', reason,
  documentToken: DOCUMENT_TOKEN,
  rendererReleased: false, stageReleased: false, viewDetached: false,
  appCanvas: unreleasedCanvas(), backdropCanvas: unreleasedCanvas(),
});
let replacementReloadScheduled = false;
let replacementReloadPending = false;
type ReplacementTransaction = Readonly<{
  reason: ReplacementReloadReason;
  token: symbol;
  tickerWasStarted: boolean;
}>;
let replacementTransaction: ReplacementTransaction | null = null;
function claimReplacementTransaction(reason: ReplacementReloadReason): ReplacementTransaction | null {
  /* A reason string is not ownership: two rapid imports have the same reason
     but are distinct writes. One opaque claim per operation prevents either
     flow from releasing/reloading while another same-kind write is pending. */
  if (replacementTransaction) return null;
  /* Stop the outgoing renderer before the first persistence await. At an 8K
     software-rendered viewport, allowing another 16.7M-pixel frame to start
     can starve the IndexedDB completion task for the whole import budget.
     A failed replacement restarts only a ticker that this claim stopped; a
     successful replacement destroys it while quiescent. */
  const tickerWasStarted = app.ticker?.started === true;
  if (tickerWasStarted) app.stop();
  const claim = Object.freeze({ reason, token: Symbol(reason), tickerWasStarted });
  replacementTransaction = claim;
  clearTimeout(_persistT); _persistT = 0;
  return claim;
}
function releaseReplacementTransaction(claim: ReplacementTransaction): void {
  if (!replacementReloadScheduled && replacementTransaction === claim) {
    replacementTransaction = null;
    if (claim.tickerWasStarted && app.ticker && !app.ticker.started) app.start();
  }
}
function scheduleReplacementReload(
  claim: ReplacementTransaction,
  afterRelease?: (witness: ReloadReleaseWitness) => void,
): void {
  /* These are the app's three intentional, durable-write reloads. Release
     the old 8K renderer/backdrop before asking the browser to construct the
     replacement document; otherwise two capped backing stores can overlap
     during navigation. This is deliberately not a pagehide teardown: a
     BFCache restore must never revive an Application that we destroyed. */
  if (replacementReloadScheduled || replacementTransaction !== claim) return;
  const { reason } = claim;
  replacementReloadScheduled = true;
  replacementReloadPending = true;
  let witness: ReloadReleaseWitness;
  try { witness = releaseRendererForReload(reason); }
  catch (error) {
    witness = {
      schema: 'cf-v2-reload-release/v1', status: 'release-failed',
      error: error instanceof Error ? error.message : String(error), reason,
      documentToken: DOCUMENT_TOKEN,
      rendererReleased: false, stageReleased: false, viewDetached: false,
      appCanvas: unreleasedCanvas(), backdropCanvas: unreleasedCanvas(),
    };
  }
  /* Runtime.addBinding installs this optional diagnostics seam before the
     page boots. Ordinary play has no such property. CDP receives the release
     evidence outside the dying execution context, so a vanished global can
     never masquerade as a replacement page becoming ready. */
  try {
    const binding = (window as unknown as Record<string, unknown>).__cfReloadReleaseWitness;
    if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
  } catch { /* evidence harness fails closed when its binding is absent/broken */ }
  try { afterRelease?.(witness); }
  catch { /* optional evidence must never strand a completed durable write */ }
  /* One task boundary lets WebGL context loss/canvas resize settle and lets
     importBlob resolve, without retrying or hiding a failed navigation. */
  setTimeout(() => location.reload(), 0);
}
/* ---- THE PHASE 4 CHROME (UI_PRESENTATION contracts): the unified topbar
   (trail · player chip · objective chip) publishing --topbar-h, the hint
   pill, the Georgia-italic caption line, and the 44px dock. Static DOM in
   index.html; this file only FILLS it. ---- */
const trailEl = document.getElementById('trail')!;
const playerChipEl = document.getElementById('playerchip')!;
const primeChipEl = document.getElementById('primechip')!;
const hpFillEl = document.querySelector('#hpbar .fill') as HTMLElement;
const hpTxtEl = document.querySelector('#hpbar .txt') as HTMLElement;
const objChipEl = document.getElementById('objchip')!;
const ctxEl = document.getElementById('ctxbar')!;
const hintEl = document.getElementById('hintpill')!;
const topbarEl = document.getElementById('topbar')!;
const dockEl = document.getElementById('dock')!;
const surfaceTopChromeEls = ['topbar', 'searchbox', 'objchip']
  .map((id) => document.getElementById(id)!) as HTMLElement[];
let lastSurfaceTrailBottom = 0;
const esc = (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
type DevelopmentPreviewIdentity = Readonly<{
  sourceCommit: string;
  shortCommit: string;
  sourceState: string;
  expectedOrigin: string;
  publishable: boolean;
  developmentVersion: string;
}>;
const previewIdentity = (globalThis as typeof globalThis & {
  __CF_DEV_PREVIEW__?: DevelopmentPreviewIdentity;
}).__CF_DEV_PREVIEW__;
function guideBuildIdentity(): string {
  const source = previewIdentity?.sourceCommit;
  const build = source && /^[0-9a-f]{40}$/.test(source)
    ? `<span data-sel="guide-build-commit">Build ${esc(source)}</span>`
    : '<span data-sel="guide-build-commit">Local development source</span>';
  return `<div class="guide-build" data-sel="guide-build"><b>Celestial Frontier v${esc(V2_DEVELOPMENT_VERSION)} development</b>${build}</div>`;
}
function syncTopbarH(): void {
  /* the game's height-sync law: MEASURED, never guessed (main.js 119) */
  document.documentElement.style.setProperty('--topbar-h', topbarEl.offsetHeight + 'px');
}
function syncDockH(): void {
  /* Phone owns two rows while desktop owns one. All lower chrome reads the
     measured result, so a media-query or safe-area change cannot bury it. */
  document.documentElement.style.setProperty('--dock-h', dockEl.offsetHeight + 'px');
  syncSurfaceChromeBottom();
}
function syncCtxH(): void {
  /* The contextual line can wrap on a phone. Planetside anchors above its
     rendered height rather than assuming one line and covering the copy. */
  document.documentElement.style.setProperty('--ctx-h', ctxEl.offsetHeight + 'px');
  syncSurfaceChromeBottom();
}
function syncHintH(): void {
  /* A++ can enlarge the hint. The caption reads its rendered height rather
     than retaining the default-font offset and overlapping it. */
  document.documentElement.style.setProperty('--hint-h', hintEl.offsetHeight + 'px');
}
function syncSurfaceChromeBottom(): void {
  /* Portrait Planetside is bottom-anchored above measured lower chrome. Its
     upper bound must be measured too: at 320px/A++ the trail is lower than the
     HP bar, and a natural-height roster otherwise rises through that trail.
     If fewer than 72 useful pixels remain, the noninteractive trail yields;
     retaining its last visible edge prevents that choice oscillating. */
  const renderedBottom = (el: HTMLElement): number | null => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
      && rect.width > 0 && rect.height > 0 ? rect.bottom : null;
  };
  const trailBottom = renderedBottom(trailEl);
  if (trailBottom !== null) lastSurfaceTrailBottom = trailBottom;
  let fixedBottom = 0;
  for (const el of surfaceTopChromeEls) {
    const bottom = renderedBottom(el);
    if (bottom !== null) fixedBottom = Math.max(fixedBottom, bottom);
  }
  const withTrailBottom = Math.max(fixedBottom, lastSurfaceTrailBottom);
  const side = document.getElementById('planetside');
  const sideRect = side?.getBoundingClientRect();
  const sideStyle = side ? getComputedStyle(side) : null;
  const sideVisible = !!sideRect && !!sideStyle && sideStyle.display !== 'none'
    && sideStyle.visibility !== 'hidden' && sideRect.width > 0 && sideRect.height > 0;
  const portraitPhone = matchMedia('(max-width: 900px) and (orientation: portrait)').matches;
  const overlaysYieldChrome = document.body.classList.contains('card-open')
    || document.body.classList.contains('panel-open');
  const yieldTrail = document.body.classList.contains('surface-mode') && portraitPhone
    && !overlaysYieldChrome && sideVisible && sideRect!.bottom - withTrailBottom - 6 < 72;
  document.body.classList.toggle('surface-trail-yield', yieldTrail);
  const visibleBottom = Math.max(fixedBottom, trailBottom ?? (portraitPhone ? lastSurfaceTrailBottom : 0));
  document.documentElement.style.setProperty('--surface-chrome-bottom',
    (yieldTrail ? fixedBottom : visibleBottom).toFixed(2) + 'px');
}
new ResizeObserver(syncTopbarH).observe(topbarEl);
new ResizeObserver(syncDockH).observe(dockEl);
new ResizeObserver(syncCtxH).observe(ctxEl);
new ResizeObserver(syncHintH).observe(hintEl);
for (const el of surfaceTopChromeEls) new ResizeObserver(syncSurfaceChromeBottom).observe(el);
new MutationObserver(syncSurfaceChromeBottom).observe(document.body, { attributes: true, attributeFilter: ['class'] });
addEventListener('resize', () => {
  syncTopbarH();
  syncDockH();
  syncCtxH();
  syncHintH();
  syncSurfaceChromeBottom();
  /* rotation moves minWH while the ascend floors read gz0/sz0 live (audit
     #8) — recompute for the mode you are IN so the thresholds agree */
  if (nav.mode === 'galaxy') gz0 = 0.42 * minWH() / GR;
  else if (nav.mode === 'system') sz0 = 0.40 * minWH() / SYS_R;
});
let _ctxTxt = '', _hintTxt = '';
function setCtx(t: string): void { if (t !== _ctxTxt) { _ctxTxt = t; ctxEl.textContent = t; } }
function setHint(t: string): void {
  if (t === _hintTxt) return;
  _hintTxt = t;
  /* verbs light up blue — the golden's scanability (static strings only) */
  hintEl.innerHTML = t.replace(/\b(tap|drag|zoom|press|Enter|Land|Leave|right-click|Escape|wheel|pinch)\b/gi, '<b class="kw">$1</b>');
}
function setTrail(segs: string[]): void {
  trailEl.innerHTML = segs.map((s, i) =>
    `<span class="seg${i === segs.length - 1 ? ' cur' : ''}">${esc(s)}</span>`).join('<span class="sep">›</span>');
}
const repo = createSaveRepository(createIndexedDBBackend('cf-v2-slice'));
/* THE REAL SAVE LOOP: the slice persists a genuine cfcc_save_v2 blob through
   importSaveV2/exportSaveV2 (the proven round-trip fixed point) — the nav
   view rides in `view`, landings ride in `land`. An older slice store that
   held only {nav,view} JSON migrates for free: importSaveV2 reads its `view`
   and defaults everything else. */
let save: SaveStateV2;
/* COSMIC_EPOCH, for real: base from the save, advanced by PLAY seconds only
   (the harvestclock invariant by construction — no wall clock anywhere).
   Ecology reads the global (typeof-guarded in the verbatim), so biospheres
   age in the browser exactly as they do in the game. */
let epochClock: EpochClock = createEpochClock(0, () => 0);
let playT0 = 0;
const playSeconds = (): number => (performance.now() - playT0) / 1000;
const TOUCH_DPR = navigator.maxTouchPoints > 0
  || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
/* The app and its full-viewport 2D backdrop coexist. Treat one 4096² store
   as their aggregate pixel budget, not as permission for two 4096² stores.
   CSS viewports larger than one half-budget are an ultra-density stress case:
   preserve native backing through UHD 3840×2160, then cap each simultaneous
   store at 2,073,600 pixels (1,920×1,080) so a slow software renderer retains
   sustained answerability after publishing readiness and across resize. */
const MAX_FULL_VIEWPORT_BACKING_PIXELS = 16_777_216;
const FULL_VIEWPORT_CANVAS_COUNT = 2;
const MAX_BACKING_PIXELS_PER_CANVAS = MAX_FULL_VIEWPORT_BACKING_PIXELS / FULL_VIEWPORT_CANVAS_COUNT;
const MAX_ULTRA_VIEWPORT_BACKING_PIXELS_PER_CANVAS = 2_073_600;
const roundedBackingPixels = (width: number, height: number, resolution: number): number =>
  Math.max(1, Math.round(width * resolution)) * Math.max(1, Math.round(height * resolution));
const fitResolutionToPixelCap = (
  requested: number, width: number, height: number, pixelCap: number,
): number => {
  const dimensionFloor = Math.min(1 / width, 1 / height);
  let low = dimensionFloor;
  let high = Math.max(dimensionFloor, requested);
  if (roundedBackingPixels(width, height, high) <= pixelCap) return high;
  /* The square-root memory bound is continuous, while both Canvas and Pixi
     round backing dimensions independently. Find the greatest representable
     resolution whose actual rounded width×height still fits the selected cap. */
  for (let i = 0; i < 64; i++) {
    const mid = low + (high - low) / 2;
    if (mid === low || mid === high) break;
    if (roundedBackingPixels(width, height, mid) <= pixelCap) low = mid;
    else high = mid;
  }
  return low;
};
type RendererDensityPlan = Readonly<{
  dpr: number;
  backingPixelCapPerCanvas: number;
  viewportWidth: number;
  viewportHeight: number;
}>;
const effectiveDensityPlan = (): RendererDensityPlan => {
  const viewportWidth = Math.max(1, innerWidth);
  const viewportHeight = Math.max(1, innerHeight);
  const viewportPixels = viewportWidth * viewportHeight;
  const backingPixelCapPerCanvas = viewportPixels > MAX_BACKING_PIXELS_PER_CANVAS
    ? MAX_ULTRA_VIEWPORT_BACKING_PIXELS_PER_CANVAS
    : MAX_BACKING_PIXELS_PER_CANVAS;
  const device = Number.isFinite(devicePixelRatio) ? Math.max(1, devicePixelRatio) : 1;
  const heatCap = TOUCH_DPR ? 2 : 3;
  const memoryCap = Math.sqrt(backingPixelCapPerCanvas / viewportPixels);
  /* A CSS viewport can exceed one canvas's standard half-budget beyond UHD.
     Pixi supports sub-1 resolution while autoDensity preserves the CSS box,
     so keep the selected twin-canvas ceiling instead of silently exceeding
     it at the old DPR-1 floor. */
  const dimensionFloor = Math.min(1 / viewportWidth, 1 / viewportHeight);
  const requested = Math.max(dimensionFloor, Math.min(device, heatCap, memoryCap));
  return {
    dpr: fitResolutionToPixelCap(
      requested, viewportWidth, viewportHeight, backingPixelCapPerCanvas,
    ),
    backingPixelCapPerCanvas,
    viewportWidth,
    viewportHeight,
  };
};
let densityPlan = effectiveDensityPlan();
let DPR = densityPlan.dpr;
const minWH = (): number => Math.max(80, Math.min(innerWidth, innerHeight));   /* floor: a zero-sized window must not mint z=0 → NaN cameras (audit #8) */

let nav: NavState = NAV_HOME;
const cam = { x: 0, y: 0, z: 1 };
const camT = { x: 0, y: 0, z: 1 };   /* eased target — the goTo feel */
const world = new Container();
/* the game's entry zooms, recomputed at each descent (main.js 3396/3462) */
let gz0 = 0.42 * minWH() / GR;
let sz0 = 0.40 * minWH() / SYS_R;

/* ---- the survey card: HTML over TYPED SELECTORS (Gate D contract).
   Position/layout is CSS's (index.html #survey: below --topbar-h, clear of
   the dock — the CF1806-02 burial class prevented structurally). esc covers
   quotes: keys/classes land in ATTRIBUTES (2026-08-01 exploit pass). ---- */
const card = document.createElement('aside');
card.id = 'survey';
card.className = 'glass';
card.dataset.panelBoundary = '';
card.setAttribute('role', 'region');
card.setAttribute('aria-label', 'Survey card');
card.setAttribute('aria-hidden', 'true');
document.body.appendChild(card);
const surveyDockEl = document.getElementById('docksurvey')!;
const chartsDockEl = document.getElementById('dockcharts')!;
let surveyFocusReturn: HTMLElement | null = null;
let lastCard: Descriptor | null = null;
let cardCtx: {
  p: PlanetNode;
  gal: NonNullable<NavState['gal']>;
  star: NonNullable<NavState['star']>;
} | null = null;
interface CardTravelAction { label: 'Enter galaxy' | 'Enter system'; run: () => void; }
let cardTravelAction: CardTravelAction | null = null;
function showSurvey(d: Descriptor, actionsHtml?: string, travelAction: CardTravelAction | null = null): void {
  if (document.activeElement === app.canvas) surveyFocusReturn = app.canvas;
  cardTravelAction = travelAction;
  if (actionsHtml === undefined) cardCtx = null;
  lastCard = d;
  const travelHtml = travelAction
    ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px">' +
      `<button data-act="travel" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">${esc(travelAction.label)}</button>` +
      '</div>'
    : '';
  const rows = (d.rows as Array<[string, string, string?]>).filter(([key]) => key !== 'Spectral class');
  const isPlanet = typeof d.planetSeed === 'number';
  const landedPlanet = isPlanet && !!save?.landed.includes(d.planetSeed as number);
  const rarityName = d.designation?.name;
  const rarityVisible = typeof rarityName === 'string' && (!isPlanet || landedPlanet);
  const rarity = rarityVisible
    ? `<div data-row="Rarity" class="survey-row"><span>Rarity</span><br>${esc(rarityName)}</div>`
    : '';
  card.innerHTML =
    '<div class="survey-head">' +
    `<div><h2 data-sel="title">${esc(d.title)}</h2>` +
    `<div data-sel="sub">${esc(d.sub)}${d.badge ? ` · <b data-sel="badge">${esc(d.badge)}</b>` : ''}</div></div>` +
    '<button type="button" class="surface-close" data-survey-close aria-label="Close Survey card">✕</button></div>' +
    travelHtml +
    (actionsHtml || '') +   /* the card's ACTION ROW (Land · +Atlas · share) — buttons are trusted markup, never save text */
    rarity + rows.map(([k, v, cls]) =>
      `<div data-row="${esc(k)}" data-cls="${esc(cls || '')}" class="survey-row"><span>${esc(k)}</span><br>${esc(v)}</div>`).join('');
  card.style.display = 'block';
  card.setAttribute('aria-hidden', 'false');
  document.body.classList.add('card-open');
  syncSurfaceChromeBottom();
  surveyDockEl.classList.add('on');
  surveyDockEl.setAttribute('aria-expanded', 'true');
}
function hideSurvey(restoreFocus = false): void {
  card.style.display = 'none';
  card.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('card-open');
  syncSurfaceChromeBottom();
  surveyDockEl.classList.remove('on');
  surveyDockEl.setAttribute('aria-expanded', 'false');
  if (restoreFocus && surveyFocusReturn?.isConnected) {
    const target = surveyFocusReturn;
    surveyFocusReturn = null;
    queueMicrotask(() => target.focus());
  }
}
function invalidateSurveyTravel(): void {
  cardTravelAction = null;
  surveyFocusReturn = null;
  card.querySelector('[data-act="travel"]')?.remove();
}

/* ---- the save-import sheet (Phase 4's second UI component; GATE C's front
   door): paste or pick your cfcc_save_v2 blob — VALIDATED through the real
   importSaveV2 first and stored as primary. The player's external backup
   remains the authoritative exact copy; the app only ATTEMPTS an additional
   untouched local keepsake because browser storage may refuse it. ---- */
const sheet = document.createElement('div');
sheet.id = 'importsheet';
sheet.setAttribute('role', 'dialog');
sheet.setAttribute('aria-modal', 'true');
sheet.setAttribute('aria-label', 'Bring your expedition');
sheet.style.cssText = 'position:fixed;inset:0;padding:calc(var(--safe-top,0px) + 16px) calc(var(--safe-right,0px) + 16px) calc(var(--safe-bottom,0px) + 16px) calc(var(--safe-left,0px) + 16px);' +
  'box-sizing:border-box;align-items:center;justify-content:center;overflow:hidden;background:rgba(4,6,12,0.7);display:none;z-index:40';
sheet.innerHTML =
  '<div style="position:relative;width:min(520px,100%);box-sizing:border-box;max-height:100%;overflow:auto;' +
  'background:rgba(10,16,30,0.97);border:1px solid #2a3c5e;border-radius:12px;padding:18px;color:#cfe0f4;font:13px/1.5 system-ui,sans-serif">' +
  '<h2 style="font-size:15px;margin:0 0 4px">Bring your expedition</h2>' +
  '<span data-sel="import-safety" style="color:var(--dim)">Paste or pick a moderator-provided copied expedition save. Keep that external moderator backup as the authoritative exact copy. The app checks the save before storing it and attempts an additional exact local keepsake after import, but browser storage can refuse that keepsake.</span>' +
  '<textarea id="importtext" aria-label="Paste expedition save data" style="width:100%;height:120px;margin:10px 0;background:#0b1220;color:#cfe0f4;border:1px solid #22304a;border-radius:8px;padding:8px;box-sizing:border-box;font:12px monospace"></textarea>' +
  '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
  '<button id="importgo" style="background:#1d3a5e;color:#eaf2ff;border:1px solid #3a5c8e;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">Import & reload</button>' +
  '<button id="importpick" type="button" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">Pick file</button>' +
  '<input id="importfile" aria-label="Choose an expedition save file" type="file" accept=".json,.txt" tabindex="-1" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' +
  '<button id="importclose" style="background:transparent;color:var(--dim);border:1px solid #22304a;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">close</button>' +
  '</div><div id="importmsg" role="alert" aria-live="assertive" aria-atomic="true" style="margin-top:8px;color:#e8a0a0"></div></div>';
document.body.appendChild(sheet);
const importBackgroundState: Array<{ el: HTMLElement; inert: boolean; ariaHidden: string | null }> = [];
/* ---- THE DOCK: eight live controls, every press proven by an EFFECT (the
   simrun-dom law — a dead button never ships). charts/sound flip the REAL
   save fields and persist through exportSaveV2. ---- */
function openImportSheet(): void {
  closePanels();
  importBackgroundState.length = 0;
  for (const child of [...document.body.children]) {
    if (!(child instanceof HTMLElement) || child === sheet) continue;
    importBackgroundState.push({ el: child, inert: child.inert, ariaHidden: child.getAttribute('aria-hidden') });
    child.inert = true;
    child.setAttribute('aria-hidden', 'true');
  }
  sheet.style.display = 'flex';
  (sheet.querySelector('#importtext') as HTMLTextAreaElement | null)?.focus();
}
function closeImportSheet(): void {
  sheet.style.display = 'none';
  for (const { el, inert, ariaHidden } of importBackgroundState.splice(0)) {
    el.inert = inert;
    if (ariaHidden === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', ariaHidden);
  }
  document.getElementById('docksets')?.focus();
}
document.addEventListener('focusin', (event) => {
  if (sheet.style.display === 'none' || sheet.contains(event.target as Node)) return;
  (sheet.querySelector<HTMLElement>('#importtext') || sheet.querySelector<HTMLElement>('button'))?.focus();
}, true);
surveyDockEl.addEventListener('click', () => {
  /* re-show the LAST card (no rebuild — the fold law's no-rebuild spirit) */
  if (cardCtx && !activeCardPlanetWhere()) {
    cardCtx = null;
    card.innerHTML = '';
    hideSurvey();
    return;
  }
  if (card.style.display === 'none' && card.innerHTML) {
    surveyFocusReturn = surveyDockEl;
    card.style.display = 'block';
    card.setAttribute('aria-hidden', 'false');
    document.body.classList.add('card-open');
    surveyDockEl.classList.add('on');
    surveyDockEl.setAttribute('aria-expanded', 'true');
  } else hideSurvey();
});
chartsDockEl.addEventListener('click', () => {
  if (!save) return;   /* pre-boot click (audit #3) */
  save.chartsOn = !save.chartsOn;
  chartsDockEl.classList.toggle('on', save.chartsOn);
  chartsDockEl.setAttribute('aria-pressed', String(save.chartsOn));
  if (chartLayer) chartLayer.visible = save.chartsOn;
  fillSettings();   /* the panel mirrors the dock (and vice versa) */
  void persistView();
});

/* ---- SETTINGS (the first rail panel): every control drives a REAL save
   field and persists through exportSaveV2 — sound, volume (the squared-
   taper bus), charts, motion (Auto follows the OS), the glass tint ---- */
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function motionOK(): boolean {
  /* main.js motionOK: Auto (-1) follows the OS preference LIVE */
  return save.motionMode === -1 ? !reducedMotionQuery.matches : save.motionMode === 0;
}
function applyGlass(): void {
  /* Bright space art sits directly behind every panel. The old 0.40 floor
     can reduce secondary copy to roughly 1–2.5:1, so v2 enforces the first
     contrast-safe glass tier while retaining the player's more-solid choice. */
  const a = Math.min(Math.max(save.glassTint, 0.82), 0.98);
  document.documentElement.style.setProperty('--glass-a', String(a));
}
function applyDisplayPreferences(): void {
  const body = document.body;
  body.classList.remove('fs-lg', 'fs-xl', 'tone-bright', 'tone-max', 'font-sys', 'font-mono');
  if (save.fsMode) body.classList.add(save.fsMode);
  if (save.toneMode) body.classList.add(save.toneMode);
  if (save.fontMode) body.classList.add(save.fontMode);
  body.classList.toggle('motion-reduced', !motionOK());
  applyGlass();
  syncTopbarH(); syncDockH(); syncCtxH(); syncHintH(); syncSurfaceChromeBottom();
}
reducedMotionQuery.addEventListener('change', () => {
  if (save?.motionMode === -1) applyDisplayPreferences();
});
function fillSettings(): void {
  if (!save) return;   /* a click before boot finishes must not throw */
  fillPanel('set',
    '<h3>Settings</h3>' +
    `<div class="row"><label>Sound</label><button id="setsnd" aria-label="Sound" aria-pressed="${save.sndOn}" class="${save.sndOn ? 'on' : ''}" data-sel="set-sound">${save.sndOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Volume</label><input id="setvol" data-sel="set-vol" aria-label="Sound volume" type="range" min="0" max="100" value="${Math.round(save.sfxVol * 100)}"></div>` +
    `<div class="row"><label>Text size</label><span class="seg" role="group" aria-label="Text size">` +
    [['', 'A'], ['fs-lg', 'A+'], ['fs-xl', 'A++']].map(([v, t]) =>
      `<button data-pref="size" data-value="${v}" aria-pressed="${save.fsMode === v}" class="${save.fsMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Text tone</label><span class="seg" role="group" aria-label="Text tone">` +
    [['', 'Soft'], ['tone-bright', 'Bright'], ['tone-max', 'Max']].map(([v, t]) =>
      `<button data-pref="tone" data-value="${v}" aria-pressed="${save.toneMode === v}" class="${save.toneMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Font</label><span class="seg" role="group" aria-label="Font">` +
    [['', 'Rounded'], ['font-sys', 'System'], ['font-mono', 'Mono']].map(([v, t]) =>
      `<button data-pref="font" data-value="${v}" aria-pressed="${save.fontMode === v}" class="${save.fontMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Star charts</label><button id="setcharts" aria-label="Star charts" aria-pressed="${save.chartsOn}" class="${save.chartsOn ? 'on' : ''}">${save.chartsOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Motion</label><span class="seg" role="group" aria-label="Motion">` +
    [[-1, 'Auto'], [0, 'Full'], [1, 'Reduced']].map(([v, t]) =>
      `<button data-motion="${v}" aria-pressed="${save.motionMode === v}" class="${save.motionMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Panel tint</label><input id="setglass" aria-label="Panel tint" type="range" min="82" max="98" value="${Math.round(Math.max(save.glassTint, 0.82) * 100)}"></div>` +
    `<div class="row"><label>Field Training</label><button id="setrestart" data-sel="set-restart">Restart</button></div>` +
    `<div class="row"><label>Save data</label><button id="setimport" data-sel="set-import">Bring expedition</button></div>`);
  const el = document.getElementById('setpanel')!;
  const refillAndFocus = (selector: string): void => {
    fillSettings();
    el.querySelector<HTMLElement>(selector)?.focus();
  };
  el.querySelector('#setsnd')!.addEventListener('click', () => {
    save.sndOn = !save.sndOn; refillAndFocus('#setsnd'); void persistView();
  });
  el.querySelector('#setvol')!.addEventListener('input', (e) => {
    save.sfxVol = (+(e.target as HTMLInputElement).value) / 100;
    applySfxGain();   /* the shared bus retapers live */
    persistSoon();
  });
  for (const b of el.querySelectorAll<HTMLElement>('[data-pref]')) b.addEventListener('click', () => {
    const value = b.dataset.value || '';
    if (b.dataset.pref === 'size') save.fsMode = value;
    else if (b.dataset.pref === 'tone') save.toneMode = value;
    else if (b.dataset.pref === 'font') save.fontMode = value;
    const selector = `[data-pref="${b.dataset.pref}"][data-value="${CSS.escape(value)}"]`;
    applyDisplayPreferences(); refillAndFocus(selector); void persistView();
  });
  el.querySelector('#setcharts')!.addEventListener('click', () => {
    save.chartsOn = !save.chartsOn;
    chartsDockEl.classList.toggle('on', save.chartsOn);
    chartsDockEl.setAttribute('aria-pressed', String(save.chartsOn));
    if (chartLayer) chartLayer.visible = save.chartsOn;
    refillAndFocus('#setcharts'); void persistView();
  });
  for (const b of el.querySelectorAll('[data-motion]')) b.addEventListener('click', () => {
    save.motionMode = +(b as HTMLElement).dataset.motion!;
    applyDisplayPreferences(); refillAndFocus(`[data-motion="${save.motionMode}"]`); void persistView();
  });
  el.querySelector('#setrestart')!.addEventListener('click', async (event) => {
    /* Veteran restart is a reversible drill: begin in Sol where the lesson
       is winnable, then restore the exact pre-drill view on skip/finish. */
    const button = event.currentTarget as HTMLButtonElement;
    const replacement = claimReplacementTransaction('training-restart');
    if (!replacement) {
      toast('Save replacement underway', 'Finish the current expedition replacement before restarting Field Training.');
      return;
    }
    const prior = save.tutDone;
    const priorSnapshot = save.tutSnapPending;
    const priorNav = nav;
    button.disabled = true;
    save.tutSnapPending = { view: navToView(nav) };
    save.tutDone = false;
    nav = {
      mode: 'system',
      gal: { seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y, size: 78, sp: 0, tilt: 0.62, rot: 0.5, home: true },
      star: { seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y },
      planet: null,
    };
    if (await persistView(replacement)) scheduleReplacementReload(replacement);
    else {
      releaseReplacementTransaction(replacement);
      save.tutDone = prior;
      save.tutSnapPending = priorSnapshot;
      nav = priorNav;
      save.savedView = navToView(priorNav);
      button.disabled = false;
      toast('Save unavailable', 'Field Training was not restarted; your current expedition is unchanged.');
    }
  });
  el.querySelector('#setimport')!.addEventListener('click', openImportSheet);
  el.querySelector('#setglass')!.addEventListener('input', (e) => {
    save.glassTint = (+(e.target as HTMLInputElement).value) / 100;
    applyGlass(); persistSoon();
  });
}

/* ---- GUIDE + RELEASE HISTORY — one source-addressed continuation of the
   mature v1 manual, not a second seven-topic manual. All 43 authored IDs and
   the 56-release archive remain synchronized to v1.8.9; current capability
   copy replaces any legacy promise whose mechanic is not yet live in v2. ---- */
const GUIDE_CATALOGUE = getGuideCatalogue();
let guideCategory: GuideCategoryId | null = null;
let guideTopic: GuideTopicId | null = null;
function guideBodyEl(): HTMLElement | null {
  return document.querySelector('#guidepanel [data-sel="guide-body"]');
}
function guideCategoryOf(id: GuideTopicId): (typeof GUIDE_CATALOGUE)[number] | undefined {
  return GUIDE_CATALOGUE.find((category) => category.topics.some((topic) => topic.id === id));
}
function guideTopicRow(topic: GuideTopicView, icon = '•'): string {
  const status = topic.availability === 'unavailable' ? 'Not yet in v2'
    : topic.availability === 'partial' ? 'Partly live' : 'Live';
  return `<button class="guide-item" data-sel="guide-topic" data-guide-topic="${topic.id}" data-guide-availability="${topic.availability}">` +
    `<span class="guide-icon">${icon}</span><span><b>${esc(topic.title)}</b><small>${esc(status)}</small></span><span aria-hidden="true">›</span></button>`;
}
function interactiveGuideBody(source: string): string {
  /* Legacy Guide cross-links are trusted source-addressed HTML spans. V2
     upgrades them to native buttons so the same links work by touch,
     pointer, keyboard, and assistive technology. */
  const template = document.createElement('template');
  template.innerHTML = source;
  for (const span of template.content.querySelectorAll<HTMLElement>('span[data-gt]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'guide-inline-link';
    button.dataset.gt = span.dataset.gt;
    button.innerHTML = span.innerHTML;
    span.replaceWith(button);
  }
  return template.innerHTML;
}
function focusGuide(selector: string): void {
  guideBodyEl()?.querySelector<HTMLElement>(selector)?.focus();
}
function renderGuideMenu(focusResult = false): void {
  guideCategory = null; guideTopic = null;
  const body = guideBodyEl(); if (!body) return;
  body.innerHTML = GUIDE_CATALOGUE.map((category) =>
    `<button class="guide-item guide-category" data-guide-category="${category.id}"><span class="guide-icon">${category.icon}</span>` +
    `<span><b>${esc(category.title)}</b><small>${esc(category.blurb)} · ${category.topics.length} topics</small></span><span aria-hidden="true">›</span></button>`).join('');
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-category]');
}
function renderGuideCategory(id: GuideCategoryId, focusResult = false): void {
  const category = GUIDE_CATALOGUE.find((candidate) => candidate.id === id);
  const body = guideBodyEl(); if (!category || !body) return;
  guideCategory = id; guideTopic = null;
  body.innerHTML = `<button class="guide-back" data-guide-home>‹ All topics</button>` +
    category.topics.map((topic) => guideTopicRow(topic, category.icon)).join('');
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-home]');
}
function renderGuideTopic(id: GuideTopicId, focusResult = false): void {
  const topic = getGuideTopic(id);
  const category = guideCategoryOf(id);
  const body = guideBodyEl(); if (!topic || !category || !body) return;
  guideCategory = category.id; guideTopic = id;
  const status = topic.availability === 'unavailable' ? 'Not yet available in v2'
    : topic.availability === 'partial' ? 'Partly available in this development build'
      : 'Available in this development build';
  const siblings = category.topics.filter((candidate) => candidate.id !== id).slice(0, 4);
  body.innerHTML = `<button class="guide-back" data-guide-category="${category.id}">‹ ${esc(category.title)}</button>` +
    `<article class="guide-topic"><h4 tabindex="-1" data-guide-heading>${category.icon} ${esc(topic.title)}</h4>` +
    `<div class="guide-status" data-guide-status="${topic.availability}">${esc(status)}</div>${interactiveGuideBody(topic.body)}` +
    (siblings.length ? `<div class="guide-related"><b>Also in ${esc(category.title)}</b>` +
      siblings.map((candidate) => `<button data-guide-topic="${candidate.id}">${esc(candidate.title)}</button>`).join('') + '</div>' : '') +
    '</article>';
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-category]');
}
function renderGuideSearch(query: string): void {
  const body = guideBodyEl(); if (!body) return;
  const hits = searchGuide(query);
  if (query.trim().length < 2) { renderGuideMenu(); return; }
  body.innerHTML = hits.length
    ? hits.map((topic) => guideTopicRow(topic, guideCategoryOf(topic.id)?.icon || '•')).join('')
    : `<div class="empty">Nothing matches “${esc(query.trim())}”. Try “landing”, “save”, “breeding”, or “stardust”.</div>`;
  body.scrollTop = 0;
}
function renderReleaseHistory(focusResult = false): void {
  const body = guideBodyEl(); if (!body) return;
  const releases = getReleaseHistory({ includeDraft: true });
  body.innerHTML = '<button class="guide-back" data-guide-home>‹ Guide</button>' +
    '<div class="guide-release-intro"><b>Expedition bulletins</b><br>' +
    `v${esc(V2_DEVELOPMENT_VERSION)} names this development playtest but cannot trigger a production update popup. The complete v1 history below remains immutable.</div>` +
    releases.map((release, index) => `<button class="guide-item" data-release-index="${index}">` +
      `<span class="guide-icon">${release.status === 'draft' ? '🧪' : '✦'}</span><span><b>${release.version ? 'v' + esc(release.version) + ' · ' : ''}${esc(release.title)}</b>` +
      `<small>${release.status === 'draft' ? 'UNRELEASED DEVELOPMENT' : esc(release.date) + (release.status === 'shipped' ? ' · v2 release' : ' · legacy release')}</small></span><span aria-hidden="true">›</span></button>`).join('');
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-home]');
}
function renderRelease(index: number, focusResult = false, releases = getReleaseHistory({ includeDraft: true })): void {
  const release = releases[index];
  const body = guideBodyEl(); if (!release || !body) return;
  body.innerHTML = '<button class="guide-back" data-guide-releases>‹ All bulletins</button>' +
    `<article class="guide-topic"><h4 tabindex="-1" data-guide-heading>${release.version ? 'v' + esc(release.version) + ' · ' : ''}${esc(release.title)}</h4>` +
    `<div class="guide-status" data-guide-status="${release.status}">${release.status === 'draft' ? `v${esc(V2_DEVELOPMENT_VERSION)} DEVELOPMENT · not a production release` : esc(release.date) + (release.status === 'shipped' ? ' · v2 release' : ' · legacy v1 history')}</div>` +
    release.sections.map((section) => `<h5>${section.heading}</h5><ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`).join('') + '</article>';
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-releases]');
}
let pendingReleaseBulletin: V2ShippedRelease | null = null;
function showV2ReleaseBulletin(
  current: V2ShippedRelease,
  history: readonly ReleaseNoteView[] = getReleaseHistory(),
): boolean {
  if (!hasUnseenV2Release(save.rnSeen, current)) return false;
  /* A first expedition owns one blocking onboarding surface at a time. Queue
     a shipped bulletin until Training is finished/skipped instead of opening
     the Guide underneath its lesson card and marking unseen copy as read. */
  if (trainingActive()) { pendingReleaseBulletin = current; return false; }
  const index = history.findIndex((release) => release.status === 'shipped' && release.version === current.version);
  if (index < 0) return false;
  openPanel('guide', null);
  renderRelease(index, true, history);
  save.rnSeen = current.version;
  pendingReleaseBulletin = null;
  void persistView();
  return true;
}
function showUnseenV2Release(): boolean {
  /* The mature one-time bulletin rule is ready before the first production
     v2 release, but the v2.0 development identity can never trigger it. */
  const current = getCurrentV2Release();
  if (!current) return false;
  const history = getReleaseHistory({ includeDraft: true });
  return showV2ReleaseBulletin(current, history);
}
function flushPendingReleaseBulletin(): void {
  const current = pendingReleaseBulletin;
  if (!current || trainingActive()) return;
  const history = getReleaseHistory({ includeDraft: true, shippedReleases: [current] });
  showV2ReleaseBulletin(current, history);
}
function fillGuide(): void {
  if (!save) return;
  fillPanel('guide',
    '<h3>Guide to the Universe</h3>' +
    guideBuildIdentity() +
    '<div class="guide-tools"><input id="guidesearch" type="search" autocomplete="off" aria-label="Search the Guide" placeholder="Search 41 Guide topics">' +
    '<button data-guide-releases>Release history</button></div>' +
    '<div class="sub guide-scope">The mature manual, adapted to what is actually live in this v2 development build. Unported active systems stay visible and honestly marked; intentionally dormant topics remain recorded but hidden.</div>' +
    '<div class="guide-body" data-sel="guide-body"></div>');
  renderGuideMenu();
  if (!save.seenGuide) {
    save.seenGuide = true;
    void persistView();
  }
}
document.getElementById('guidepanel')!.addEventListener('input', (event) => {
  if ((event.target as HTMLElement).id === 'guidesearch') renderGuideSearch((event.target as HTMLInputElement).value);
});
document.getElementById('guidepanel')!.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const topicEl = target.closest<HTMLElement>('[data-guide-topic],[data-gt]');
  const topic = (topicEl?.dataset.guideTopic || topicEl?.dataset.gt) as GuideTopicId | undefined;
  const category = target.closest<HTMLElement>('[data-guide-category]')?.dataset.guideCategory as GuideCategoryId | undefined;
  const releaseIndex = target.closest<HTMLElement>('[data-release-index]')?.dataset.releaseIndex;
  if (topic) renderGuideTopic(topic, true);
  else if (category) renderGuideCategory(category, true);
  else if (releaseIndex !== undefined) renderRelease(+releaseIndex, true);
  else if (target.closest('[data-guide-releases]')) renderReleaseHistory(true);
  else if (target.closest('[data-guide-home]')) renderGuideMenu(true);
});

/* ---- COMPENDIUM (read-only over the save's codex — the real catalog).
   Large catalogs get virtualization later (plan bullet); the list caps at
   the save's own 1500-entry bound today. ---- */
let codexFilter = '';
function fillCodex(filter?: string, focusIndex?: number): void {
  if (!save) return;
  codexFilter = filter ?? codexFilter;
  const f = codexFilter.toLowerCase();
  /* Subscribe the VIEW once, not once per creature. With the shared import
     Promise, putting this inside `rows.map` retained up to 1,500 callbacks;
     resolving the chunk then launched 1,500 eager full-list rerenders. */
  if (!SA) ensureSA('codex', () => {
    if (openPanelId() !== 'codex') return;
    /* The lazy art chunk may resolve after keyboard focus has entered the
       list. Repainting thumbnails replaces the panel subtree, so carry the
       logical close/row target across that async refill instead of dropping
       focus to body on slower devices. */
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const rowIndex = active?.closest<HTMLElement>('[data-ci]')?.dataset.ci;
    const closeFocused = !!active?.closest('#codexpanel [data-pnx]');
    fillCodex(codexFilter, rowIndex === undefined ? undefined : +rowIndex);
    if (closeFocused) document.querySelector<HTMLElement>('#codexpanel [data-pnx]')?.focus();
  });
  const rows = save.codex
    .map(([, e], i) => ({ e, i }))
    .filter(({ e }) => !f || (e.name + ' ' + e.kind + ' ' + e.realm).toLowerCase().includes(f));
  fillPanel('codex',
    `<h3>Compendium <span style="color:#7ec8f0" data-sel="codex-count">${rows.length}</span>${f ? ` <span class="sub" style="color:var(--dim);font-size:12px">· “${esc(codexFilter)}”</span>` : ''}</h3>` +
    (rows.length === 0
      ? `<div class="empty">${f ? 'Nothing matches — the search also takes CF1 share codes.' : 'No species yet — imported discoveries appear here. Live catalogue writing arrives with the discovery path.'}</div>`
      : rows.map(({ e, i }) => {
        let th = '';
        if (SA) { try { th = SA.speciesThumb(e.g as never); } catch { /* text row still reads */ } }
        return `<button type="button" class="centry" data-sel="codex-entry" data-ci="${i}" style="display:flex;gap:10px;align-items:center">` +
          (th ? `<img src="${th}" alt="" style="width:44px;height:44px;border-radius:8px;border:1px solid #22304a;background:#0b1220;flex:0 0 44px">` : '') +
          `<span style="min-width:0"><b>${esc(e.name)}</b> <span class="sub">· ${esc(e.kind)}${e.tier != null ? ' · tier ' + e.tier : ''}${e.hybrid ? ' · hybrid' : ''}</span><span class="sub" style="display:block">${esc(e.realm)}${e.from ? ' — ' + esc(e.from) : ''}</span></span></button>`;
      }).join('')));
  if (focusIndex !== undefined) document.querySelector<HTMLElement>(`#codexpanel [data-ci="${focusIndex}"]`)?.focus();
}
/* the Compendium DETAIL CARD: the whole domain stack speaking for one
   creature — describeSpecies (fixture-pinned sentences + fauna enrichments),
   battleStats (the five stats as bars in their own hues), the grade badge.
   The static Canvas portrait is live. Pixi living actors and animation remain
   a separate Phase 5 pipeline. */
function fillCodexDetail(idx: number): void {
  if (!save) return;
  const row = save.codex[idx];
  if (!row) { fillCodex(); return; }
  const e = row[1];
  let body = '';
  try {
    const d = describeSpecies(e.g as never) as { grade?: { label?: string; hex?: string }; desc?: string; detail?: string; diet?: string; anatomy?: string; temper?: string; sense?: string; repro?: string; life?: string; metab?: string; habitat?: string; behavior?: string };
    const st = battleStats(e.g as never) as Record<string, number>;
    const KEYS = ['vit', 'fer', 'res', 'agi', 'ins'];   /* STAT_KEYS order — names/hues are position-indexed */
    const mx = Math.max(1, ...KEYS.map((k) => st[k] || 0));
    const names = STAT_NAMES as readonly string[], hues = STAT_HUES as readonly string[];
    let portrait = '';
    const idx0 = idx;
    if (ensureSA('codex', () => { if (openPanelId() === 'codex') fillCodexDetail(idx0); })) {
      try { portrait = SA!.speciesPortrait(e.g as never); } catch { /* a genome the painter cannot dress — the card still reads */ }
    }
    body =
      (portrait ? `<img data-sel="detail-portrait" src="${portrait}" alt="" style="width:100%;border-radius:10px;border:1px solid #22304a;margin:2px 0 8px;background:#0b1220">` : '') +
      `<div style="margin:4px 0 8px"><b style="font-size:16px;color:#f4f8ff">${esc(e.name)}</b>` +
      (d.grade ? ` <span data-sel="detail-grade" style="border:1px solid ${esc(d.grade.hex || '#888')};color:${esc(d.grade.hex || '#ccc')};border-radius:999px;padding:1px 9px;font-size:11px">${esc(d.grade.label || '')}</span>` : '') +
      `<div class="sub">${esc(e.kind)} · ${esc(e.realm)}${e.hybrid ? ' · hybrid' : ''}${e.from ? ' · ' + esc(e.from) : ''}</div></div>` +
      `<div style="color:#b7c8e4;margin-bottom:8px" data-sel="detail-desc">${esc(d.desc || '')} ${esc(d.detail || '')}</div>` +
      KEYS.map((k, i) => {
        const v = st[k] || 0;
        return `<div class="row" style="min-height:24px" data-sel="detail-stat"><label style="flex:0 0 84px">${esc(names[i] || k)}</label>` +
          `<span style="flex:1;height:9px;border-radius:999px;background:#16202f;overflow:hidden"><span style="display:block;height:100%;width:${Math.round((v / mx) * 100)}%;background:${esc(hues[i] || '#7ec8f0')}"></span></span>` +
          `<span style="flex:0 0 40px;text-align:right;color:var(--dim)">${Math.round(v)}</span></div>`;
      }).join('') +
      (['diet', 'anatomy', 'temper', 'sense', 'repro', 'life', 'metab', 'habitat', 'behavior'] as const)
        .filter((k) => (d as Record<string, unknown>)[k])
        .map((k) => `<div class="centry"><span class="sub">${k}</span><br>${esc((d as Record<string, string>)[k])}</div>`).join('');
  } catch {
    body = '<div class="empty">This record did not decode — the genome may predate the Compendium.</div>';
  }
  fillPanel('codex', `<h3><button id="codexback" style="background:none;border:0;color:#9fdcff;cursor:pointer;font:13px var(--ui);padding:8px;min-height:44px">‹ Compendium</button></h3><div data-sel="codex-detail">${body}</div>`);
  const back = document.getElementById('codexback')!;
  back.addEventListener('click', () => fillCodex(codexFilter, idx));
  back.focus();
}
function fillRecords(): void {
  if (!save) return;
  const st = save.stats || {};
  const counts: Array<[string, number]> = [
    ['galaxies seen', save.galSeen.length], ['systems charted', save.sysSeen.length],
    ['worlds landed', save.landed.length], ['world types met', save.ptypesSeen.length],
    ['star kinds met', save.starKindsSeen.length], ['species catalogued', save.codex.length],
    ['surveys', save.surveyedSet.length],
  ];
  const jr = save.journal.slice(-40).reverse();
  fillPanel('rec',
    '<h3>Records</h3>' +
    counts.map(([k, v]) => `<div class="row" style="min-height:26px"><label>${esc(k)}</label><span style="color:#7ec8f0">${v}</span></div>`).join('') +
    (st.essenceEarned ? `<div class="row" style="min-height:26px"><label>stardust earned</label><span style="color:#ffd9a0">✦ ${st.essenceEarned}</span></div>` : '') +
    '<h3 style="margin-top:14px">Journal</h3>' +
    (jr.length === 0
      ? '<div class="empty" data-sel="journal-empty">No imported Journal entries yet — live Journal writing is not connected in this development slice.</div>'
      : jr.map((j) => `<div class="centry" data-sel="journal-entry"><b>${esc(j.n)}</b><div class="sub">${esc(j.w)}</div></div>`).join('')));
}
/* THE STAR ATLAS ('log' in the game): every charted place, tap to TRAVEL
   (jumpToView — the same charter gates as everything else) */
function fillAtlas(): void {
  if (!save) return;
  const rows = save.logMap;
  fillPanel('atlas',
    `<h3>Star Atlas <span style="color:#7ec8f0" data-sel="atlas-count">${rows.length}</span></h3>` +
    (rows.length === 0
      ? '<div class="empty" data-sel="atlas-empty">Nothing charted yet — tap “+ Add to Star Atlas” on any survey card.</div>'
      : rows.map(([id, e]) => {
        const travelable = !!e.where;
        const unavailable = travelable ? '' : ' · route unavailable in this build';
        return `<button type="button" class="centry" data-sel="atlas-entry" data-aid="${esc(id)}"${travelable ? '' : ' disabled aria-disabled="true"'}><b>${esc(String(e.title || id))}</b>${e.badge ? ` <span class="sub">· ${esc(String(e.badge))}</span>` : ''}<span class="sub" style="display:block">${esc(String(e.sub || ''))}${unavailable}</span></button>`;
      }).join('')));
}
document.getElementById('atlaspanel')!.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest('[data-aid]');
  if (!row || !save) return;
  const hit = save.logMap.find(([id]) => id === (row as HTMLElement).dataset.aid);
  if (hit && hit[1].where) {
    const keyboard = document.activeElement === row;
    closePanels();
    const moved = jumpToView(hit[1].where as Record<string, unknown>);
    if (keyboard && moved) app.canvas.focus();
  }
});
/* CHARTERS — current-slice projection over canonical saved chapter data.
   The pure projection keeps legacy progress/reach intact while presenting
   only real v2 actions; never render the unported canonical copy directly. */
function fillCharters(): void {
  if (!save) return;
  const projection = projectV2Charter(save.ascCh, save.ascProg, ascStage());
  const chapter = !projection
    ? '<div class="centry" data-sel="charter-ch" data-chstate="complete">' +
        '<b>Charter record</b><div class="sub" style="margin:2px 0 6px">' +
        'This expedition’s established Charter progress and reach are preserved.</div></div>'
    : (() => {
      const goals = projection.goals.map((goal) => {
        const have = Math.min(save.ascProg[goal.id] || 0, goal.n);
        const pct = Math.round((have / goal.n) * 100);
        return `<div class="row" style="min-height:24px" data-sel="charter-goal"><label style="font-size:12px">${esc(goal.t)}</label>` +
          `<span style="flex:0 0 90px;display:flex;align-items:center;gap:6px"><span style="flex:1;height:7px;border-radius:999px;background:#16202f;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:${have >= goal.n ? '#caa24f' : '#7ec8f0'}"></span></span><span style="color:var(--dim);font-size:11px">${have}/${goal.n}</span></span></div>`;
      }).join('');
      const note = projection.state === 'actionable' ? ''
        : `<div class="sub" data-sel="charter-boundary" style="margin-top:8px">${esc(projection.note)}</div>`;
      return `<div class="centry" data-sel="charter-ch" data-chstate="${projection.state}">` +
        `<b style="${projection.state === 'actionable' ? 'color:#ffd9a0' : ''}">${projection.state === 'complete' ? '✓ ' : ''}${esc(projection.name)}</b>` +
        `<div class="sub" style="margin:2px 0 6px">${esc(projection.intro)}</div>` + goals + note + '</div>';
    })();
  fillPanel('ch', '<h3>Charters — Current Expedition</h3>' + chapter);
}
registerPanel({ id: 'ch', el: document.getElementById('chpanel')!, btns: [document.getElementById('dockcharters'), document.getElementById('railcharters')], onOpen: fillCharters });
document.getElementById('dockcharters')!.addEventListener('click', () => togglePanel('ch'));
document.getElementById('railcharters')!.addEventListener('click', () => togglePanel('ch'));
registerPanel({ id: 'atlas', el: document.getElementById('atlaspanel')!, btns: [document.getElementById('dockatlas'), document.getElementById('railatlas')], onOpen: () => { fillAtlas(); gameEvent('atlas-open', { open: true }); } });
document.getElementById('dockatlas')!.addEventListener('click', () => togglePanel('atlas'));
document.getElementById('railatlas')!.addEventListener('click', () => togglePanel('atlas'));
registerPanel({ id: 'set', el: document.getElementById('setpanel')!, btns: [document.getElementById('docksets')], onOpen: fillSettings });
registerPanel({ id: 'guide', el: document.getElementById('guidepanel')!, btns: [document.getElementById('dockguide')], onOpen: fillGuide });
registerPanel({ id: 'codex', el: document.getElementById('codexpanel')!, btns: [document.getElementById('dockcodex'), document.getElementById('railcodex')], onOpen: () => {
  /* An ordinary Compendium open is a fresh catalogue view. Search may apply
     a query immediately after opening, while detail → Back deliberately
     keeps the active query. Without this reset, closing a search result and
     reopening from the dock silently retained a hidden filter. */
  codexFilter = '';
  fillCodex('');
} });
registerPanel({ id: 'rec', el: document.getElementById('recpanel')!, btns: [document.getElementById('dockrecords'), document.getElementById('railrecords')], onOpen: fillRecords });
document.getElementById('docksets')!.addEventListener('click', () => togglePanel('set'));
document.getElementById('dockguide')!.addEventListener('click', () => togglePanel('guide'));
document.getElementById('dockcodex')!.addEventListener('click', () => togglePanel('codex'));
document.getElementById('railcodex')!.addEventListener('click', () => togglePanel('codex'));
document.getElementById('dockrecords')!.addEventListener('click', () => togglePanel('rec'));
document.getElementById('railrecords')!.addEventListener('click', () => togglePanel('rec'));
/* codex list rows open the detail card (delegated — rows refill often) */
document.getElementById('codexpanel')!.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest('[data-ci]');
  if (row) fillCodexDetail(+(row as HTMLElement).dataset.ci!);
});

/* ---- THE SEARCH BAR (the goldens' top-right slot): paste a CF1 where-code
   and TRAVEL there (decodeWhere → the sanitized view → the same charter
   gates as every other descent), or type a name to filter the Compendium. */
const searchEl = document.getElementById('searchbox') as HTMLInputElement;
const CF1_PUBLIC_SEED_MAX = 0xffff_ffff;
const CF1_SEARCH_MAX_LENGTH = 8192;
type StrictCF1PlanetCandidate = {
  galaxy: { seed: number; x: number; y: number };
  star: { seed: number; x: number; y: number };
  planet: { seed: number };
};
type StrictCF1PlanetPayload =
  | { kind: 'not-planet' }
  | { kind: 'invalid' }
  | { kind: 'valid'; candidate: StrictCF1PlanetCandidate };

/* `decodeWhere` deliberately repairs old/general CF1 routes so a bad number
   cannot crash the camera. That tolerance is not identity proof: a public
   planet share must provide its own exact raw hierarchy before the repair
   layer can coerce 999.9/"999" into Earth. Galaxy/star routes intentionally
   retain their legacy decoder semantics until their own ingress work. */
function strictCF1PlanetCandidateFromSearchCode(code: string): StrictCF1PlanetPayload {
  const marker = code.indexOf('CF1-');
  if (marker < 0) return { kind: 'not-planet' };
  /* Match decodeWhere's bound before any base64 or JSON allocation. Unlike
     its generic decoder, Search must keep an oversized CF1 as a correction
     outcome rather than falling through to a Compendium text filter. */
  if (code.length > CF1_SEARCH_MAX_LENGTH) return { kind: 'invalid' };
  let raw: unknown;
  try {
    let b64 = code.slice(marker + 4).trim().replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { kind: 'not-planet' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { kind: 'not-planet' };
  const payload = raw as Record<string, unknown>;
  if (payload.t !== 'p') return { kind: 'not-planet' };
  const galaxy = payload.g, star = payload.s;
  if (!Array.isArray(galaxy) || galaxy.length < 8 || !Array.isArray(star) || star.length < 3) return { kind: 'invalid' };
  const exactSeed = (value: unknown): value is number => typeof value === 'number'
    && Number.isInteger(value) && value >= 0 && value <= CF1_PUBLIC_SEED_MAX;
  const exactCoordinate = (value: unknown): value is number => typeof value === 'number'
    && Number.isFinite(value) && Math.abs(value) <= 1e7 && Math.round(value * 100) / 100 === value;
  if (!exactCoordinate(galaxy[0]) || !exactCoordinate(galaxy[1]) || !exactSeed(galaxy[6])
    || !exactCoordinate(star[0]) || !exactCoordinate(star[1]) || !exactSeed(star[2])
    || !exactSeed(payload.p)) return { kind: 'invalid' };
  return {
    kind: 'valid',
    candidate: {
      galaxy: { x: galaxy[0], y: galaxy[1], seed: galaxy[6] },
      star: { x: star[0], y: star[1], seed: star[2] },
      planet: { seed: payload.p },
    },
  };
}
function encodeHere(): string | null {
  const v = navToView(nav);
  if (!v) return null;
  const name = v.type === 'planet' && v.pseed != null ? customNames.get('p' + v.pseed) : null;
  return encodeWhere(v as never, name || undefined) as string;
}
function jumpToView(
  view: Record<string, unknown>,
  incomingName: string | null = null,
  externalPlanetCandidate: StrictCF1PlanetCandidate | null = null,
): boolean {
  if (!save) return false;   /* pre-boot paste (audit #3) */
  const v = _sanitizeView(view);
  if (!v) return false;
  let n2 = viewToNav(v);
  /* External planet destinations focus the real world in system view; only
     the explicit Land command may enter surface mode and bank outcomes. A
     public CF1 payload may claim any parent coordinates, so prove its full
     galaxy → star → planet hierarchy before the reach gate, card, custom
     name, save, or navigation state sees it. Search passes exact raw public
     identity here before the tolerant legacy sanitizer; the resolver returns
     the only route fields we retain, including source display metadata. */
  if (n2.mode === 'surface' && n2.gal && n2.star && n2.planet) {
    const canonical = resolveCF1WorldAddress(externalPlanetCandidate ?? {
      galaxy: { seed: n2.gal.seed, x: n2.gal.x, y: n2.gal.y },
      star: { seed: n2.star.seed, x: n2.star.x, y: n2.star.y },
      planet: { seed: n2.planet.seed },
    });
    if (!canonical.ok) return false;
    n2 = {
      mode: 'surface',
      gal: {
        seed: canonical.address.galaxy.seed,
        x: canonical.address.galaxy.x,
        y: canonical.address.galaxy.y,
        size: canonical.address.galaxy.size,
        sp: canonical.address.galaxy.sp,
        tilt: canonical.address.galaxy.tilt,
        rot: canonical.address.galaxy.rot,
        home: canonical.address.galaxy.home,
        quasar: canonical.address.galaxy.quasar,
        dwarf: canonical.address.galaxy.dwarf,
      },
      star: {
        seed: canonical.address.star.seed,
        x: canonical.address.star.x,
        y: canonical.address.star.y,
      },
      planet: { seed: canonical.address.planet.seed },
    };
  }
  /* A malformed planet surface view degrades in the verbatim sanitizer; do
     not let that fallback masquerade as an accepted planet share route. */
  if (v.type === 'planet' && n2.mode !== 'surface') return false;
  /* Also reject a pseed that is not a member of the canonical system. */
  const focusPlanet = n2.mode === 'surface' && n2.star && n2.planet
    ? systemScene(n2.star.seed).planets.find((planet) => planet.seed === n2.planet!.seed) || null
    : null;
  if (n2.mode === 'surface' && !focusPlanet) return false;
  if (n2.mode !== 'universe' && n2.gal) {
    if (!withinReachOf(primeCount(), n2.gal.x, n2.gal.y)) {
      toastPrimeReachBoundary();
      return false;
    }
    if (n2.star && !ascAllowsStar(ascStage(), n2.gal.seed, n2.star)) {
      toastCharterBoundary(ascHintFor(ascStage()));
      return false;
    }
  }
  let acceptedName = false;
  if (focusPlanet && incomingName) {
    const name = cleanName(incomingName);
    if (name) {
      customNames.set('p' + focusPlanet.seed, name);
      save.customNames = [...customNames.entries()];
      acceptedName = true;
    }
  }
  nav = focusPlanet
    ? { mode: 'system', gal: n2.gal, star: n2.star, planet: null }
    : n2;
  if (nav.mode === 'galaxy') { gz0 = 0.42 * minWH() / GR; camT.z = gz0 * 1.05; }
  else if (nav.mode === 'system') { sz0 = 0.40 * minWH() / SYS_R; camT.z = sz0 * 1.05; }
  else camT.z = 1;
  cam.z = camT.z * 0.7; cam.x = camT.x = 0; cam.y = camT.y = 0;
  playWhoosh();
  rerender();
  if (focusPlanet && nav.star) surveyPlanet(focusPlanet, nav.star.seed);
  if (acceptedName) void persistView();
  return true;
}
searchEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  /* Search owns Enter. Prevent the browser's type=search default action from
     dispatching a secondary implicit activation after this handler has
     opened/focused a panel or navigated the canvas. */
  e.preventDefault();
  e.stopPropagation();
  const q = searchEl.value.trim();
  if (!q) return;
  const strictPlanet = strictCF1PlanetCandidateFromSearchCode(q);
  if (strictPlanet.kind === 'invalid') {
    /* A malformed planet code is a correction outcome, not a Compendium
       query. Keep its exact text/focus so the explorer can repair it. */
    searchEl.focus();
    return;
  }
  const dec = decodeWhere(q) as { where: Record<string, unknown>; name: string | null } | null;
  if (dec && dec.where) {
    if (jumpToView(dec.where, dec.name, strictPlanet.kind === 'valid' ? strictPlanet.candidate : null)) {
      searchEl.value = '';
      /* Route rendering replaces scene/card DOM synchronously. Continue the
         keyboard journey at the live action when a planet card opened, or
         at the exploration canvas for galaxy/star destinations. A rejected
         code deliberately keeps its query and focus for correction. */
      queueMicrotask(() => {
        const action = card.querySelector<HTMLElement>('[data-act="landcta"],[data-act="travel"]');
        (action || app.canvas).focus();
      });
    } else searchEl.focus();
    return;
  }
  if (strictPlanet.kind === 'valid') {
    searchEl.focus();
    return;
  }
  /* not a code — a Compendium name filter */
  openPanel('codex', searchEl);
  fillCodex(q);
  (document.querySelector<HTMLElement>('#codexpanel [data-ci]')
    || document.querySelector<HTMLElement>('#codexpanel [data-pnx]'))?.focus();
});
sheet.querySelector('#importclose')!.addEventListener('click', closeImportSheet);
sheet.querySelector('#importpick')!.addEventListener('click', () => (sheet.querySelector('#importfile') as HTMLInputElement).click());
sheet.querySelector('#importfile')!.addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  void f.text().then((txt) => { (sheet.querySelector('#importtext') as HTMLTextAreaElement).value = txt; });
});
async function importBlob(raw: string, diagnosticPhaseId?: string): Promise<string | null> {
  /* returns an error message, or null on success (then we reload) */
  let phaseSequence = 0;
  const phase = (stage: ImportPhaseStage, error: string | null = null): void => {
    if (typeof diagnosticPhaseId !== 'string' || !diagnosticPhaseId) return;
    const witness: ImportPhaseWitness = {
      schema: 'cf-v2-import-phase/v1', phaseId: diagnosticPhaseId,
      reason: 'save-import', documentToken: DOCUMENT_TOKEN,
      stage, sequence: ++phaseSequence,
      tickerStarted: app.ticker?.started === true,
      performanceNow: performance.now(), error,
    };
    try {
      const binding = (window as unknown as Record<string, unknown>).__cfImportPhaseWitness;
      if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
    } catch { /* optional evidence is fail-closed in the harness */ }
  };
  phase('invoked');
  /* JSON permits surrounding whitespace. Keep the exact submitted text
     for the recovery keepsake, while retaining the importer's historical
     trimmed candidate for classification and the live primary. */
  const checkedRaw = raw.trim();
  const imp = importSaveV2(checkedRaw, REGISTRY, Date.now());
  if (!imp.ok && imp.reason === 'future-version') {
    phase('validation-rejected', 'future-version');
    return 'This save is from a newer Celestial Frontier build. Update first; nothing was stored.';
  }
  if (!imp.ok) {
    phase('validation-rejected', 'invalid save payload');
    return 'That does not load as a Celestial Frontier save — nothing was stored.';
  }
  /* the real loader hardens ANY object into a fresh save — fine at boot,
     dangerous in an import sheet (an accidental "{}" would wipe the stored
     expedition). Require a face we recognize before we overwrite. */
  try {
    const o = JSON.parse(checkedRaw) as unknown;
    if (!isPlausibleSaveEnvelope(o)) {
      phase('validation-rejected', 'incomplete save envelope');
      return 'That parses, but is not a complete save envelope — nothing was stored.';
    }
  } catch {
    phase('validation-rejected', 'invalid JSON');
    return 'That does not load as a Celestial Frontier save — nothing was stored.';
  }
  const replacement = claimReplacementTransaction('save-import');
  if (!replacement) {
    phase('claim-rejected', 'another replacement transaction already owns the app');
    return 'Another expedition replacement is finishing. Wait for its reload, then try again.';
  }
  phase('claimed');
  /* Import is a replacement transaction, not another autosave. Cancel a
     pending slider debounce, stop new exports, and let an export already in
     flight settle before the validated bytes become primary. Otherwise an
     older settings snapshot can win the race after the import write. */
  clearTimeout(_persistT); _persistT = 0;
  importWriteInFlight = true;
  const priorPersist = activePersist;
  phase(priorPersist ? 'waiting-active-persist' : 'no-active-persist');
  if (priorPersist) {
    await priorPersist.catch(() => false);
    phase('active-persist-settled');
  }
  phase('primary-write-started');
  try {
    await repo.write(checkedRaw);
    phase('primary-write-complete');
  }
  catch {
    phase('primary-write-rejected', 'storage refused the primary write');
    importWriteInFlight = false;
    releaseReplacementTransaction(replacement);
    return 'Storage refused the write (private mode?).';
  }
  /* Best-effort extra keepsake only: the external moderator backup remains
     authoritative. The live primary evolves through exportSaveV2 from the
     first frame, so retain the exact input locally when browser storage
     permits it, without blocking an otherwise valid import when it does not. */
  try { localStorage.setItem('cf_v2_import_original', raw); } catch { /* keepsake only */ }
  phase('release-started');
  scheduleReplacementReload(replacement, (witness) => {
    phase('release-complete', witness.error);
  });
  return null;
}
sheet.querySelector('#importgo')!.addEventListener('click', () => {
  const raw = (sheet.querySelector('#importtext') as HTMLTextAreaElement).value;
  void importBlob(raw).then((err) => { if (err) (sheet.querySelector('#importmsg') as HTMLElement).textContent = err; });
});

/* ---- the Charter toast: name the honest current-slice boundary ---- */
const toastEl = document.createElement('div');
toastEl.id = 'toast';
toastEl.setAttribute('role', 'status');
toastEl.setAttribute('aria-live', 'polite');
toastEl.setAttribute('aria-atomic', 'true');
toastEl.className = 'glass';
document.body.appendChild(toastEl);
let _toastT = 0, _toastHide = 0, _toastSerial = 0;
let _boundaryToastKey = '', _boundaryToastT = -Infinity, _boundaryToastSerial = -1;
const TOAST_DEDUP_MS = 1800;
function showToast(title: string, msg: string, assertive: boolean): void {
  toastEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  toastEl.innerHTML = `<b data-sel="toast-title">${esc(title)}</b><br>${esc(msg)}`;   /* every sink escapes (audit #6) */
  _toastSerial++;
  toastEl.style.opacity = '1';
  clearTimeout(_toastHide);
  _toastHide = window.setTimeout(() => { toastEl.style.opacity = '0'; }, 3600);
}
function toast(title: string, msg: string, force = false): void {
  const now = performance.now();
  if (!force && now - _toastT < TOAST_DEDUP_MS) return;   /* the game's re-fire guard (review catch: parking inside a gate) */
  _toastT = now;
  showToast(title, msg, force);
}
/* Chapter reconciliation is a one-shot saved outcome: once ascCh moves, a
   later action cannot replay its notice. Replace an ambient Copy/Charted
   message without escalating the polite status region to assertive. */
function toastCharterCompletion(title: string, msg: string): void {
  _toastT = performance.now();
  showToast(title, msg, false);
}
/* A blocked reach action is a distinct contract, not just another ambient
   toast: it must replace a preceding Charted/Copy message immediately, while
   an unchanged blocker remains quiet during zoom/tap re-fire. */
function toastReachBoundary(title: string, msg: string): boolean {
  const now = performance.now();
  const key = title + '\n' + msg;
  const boundaryStillVisible = toastEl.style.opacity === '1' && _toastSerial === _boundaryToastSerial;
  if (key === _boundaryToastKey && boundaryStillVisible && now - _boundaryToastT < TOAST_DEDUP_MS) return false;
  _boundaryToastKey = key;
  _boundaryToastT = now;
  _toastT = now;
  showToast(title, msg, false);
  _boundaryToastSerial = _toastSerial;
  return true;
}
function toastCharterBoundary(msg: string): boolean {
  return toastReachBoundary('⬆ Beyond Your Charter', msg);
}
function toastPrimeReachBoundary(): boolean {
  return toastReachBoundary('⬆ Beyond Your Saved Reach', primeReachHint());
}
const primeCount = (): number => Object.keys(save.primeFill || {}).length;
const ascStage = (): 0 | 1 | 2 | 3 => ascStageOf(save.items, save.ascCh);

function updateChips(): void {
  playerChipEl.innerHTML = `⚙ ${esc(save.explorerName || 'Explorer')} <span class="dim">— ✦ ${save.essence}<span class="player-worlds"> · ${save.landed.length} worlds</span></span>`;
  hpFillEl.style.width = Math.max(0, Math.min(100, (save.hp / Math.max(1, save.HP_MAX)) * 100)) + '%';
  hpTxtEl.textContent = `${save.hp}/${save.HP_MAX} HP`;
  primeChipEl.textContent = `✦ Prime Codex ${primeCount()} / 9`;
  const stage = ascStage();
  const objective = currentV2Objective(save.ascCh, save.ascProg, stage);
  const projection = projectV2Charter(save.ascCh, save.ascProg, stage);
  objChipEl.innerHTML = objective
    ? `⬆ ${esc(objective.text)} · <span class="prog" data-sel="objprog">${objective.have} / ${objective.need}</span>`
    : projection?.state === 'boundary'
      ? `⬆ ${esc(projection.name)} is recorded — the next Charter action is not available in this development slice`
      : '';
  syncTopbarH();   /* the chip wraps on narrow phones — remeasure, never guess */
}
function hudText(): void {
  /* the chrome per mode: trail (setTrail), hint pill, the caption line
     (setCtxText) — strings carried from the Renderer's own tails */
  updateChips();
  if (nav.mode === 'universe') {
    setTrail(['Cosmos']);
    setHint('tap a galaxy to survey · Enter on its card or zoom in to dive');
    updateUniverseCtx();
  } else if (nav.mode === 'galaxy' && nav.gal) {
    setTrail(['Cosmos', galaxyName(nav.gal.seed)]);
    setHint('tap a star to survey · Enter on its card · zoom out to rise');
    const gs2 = galaxyStats(nav.gal as never) as { stars: number; planets: number };
    setCtx('every dot is one of ~' + fmtBig(gs2.stars) + ' stars sharing ~' + fmtBig(gs2.planets) + ' worlds — zoom deeper and more keep resolving');
  } else if (nav.mode === 'system' && nav.gal && nav.star) {
    setTrail([galaxyName(nav.gal.seed), starName(nav.star.seed)]);
    setHint('tap a world to survey · press Land on its card · zoom out to rise');
    const sys = systemScene(nav.star.seed);
    const raw = systemFor(nav.star.seed) as { binary?: unknown };
    const desc = nav.star.seed === 424242 ? 'Sol — humanity’s own yellow star' : 'this star';
    const extra = raw.binary ? ' · a binary pair — two suns share this sky' : '';
    setCtx(sys.planets.length
      ? sys.planets.length + ' worlds orbit ' + desc + extra
      : 'no planets here — zoom out and try another star');
  } else if (nav.mode === 'surface' && nav.gal && nav.star && nav.planet) {
    const p = systemScene(nav.star.seed).planets.find((q) => q.seed === nav.planet!.seed);
    setTrail([galaxyName(nav.gal.seed), starName(nav.star.seed), p ? p.name : 'Surface']);
    setHint('press Leave world, right-click, or Escape to lift off');
    setCtx('planetfall — the survey card carries the world’s roster');
  }
  syncSurfaceChromeBottom();
}
function updateUniverseCtx(): void {
  /* the Renderer's universe caption ladder (main.js 3788), verbatim text */
  const zc = zCut();
  const dist = Math.hypot(camT.x, camT.y);
  setCtx(camT.z < zc * 0.8
    ? 'each grain of light is an entire galaxy — filaments and voids weave the cosmic web, on and on without end'
    : (dist > OBS_R
      ? 'beyond the observable universe — hypothetical space no telescope can ever see'
      : 'galaxies cluster along the cosmic web, leaving vast dark voids — the orange ring is the edge of the observable universe'));
}

/* ---- slice-local bakes of Renderer inline gradients (verbatim stops) ---- */
let _fbdC: HTMLCanvasElement | null = null;
function fbdSpr(): HTMLCanvasElement {   /* failed brown dwarf (main.js ~4152) */
  if (_fbdC) return _fbdC;
  const S = 32, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const fg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  fg.addColorStop(0, 'rgba(201,138,106,0.9)'); fg.addColorStop(1, 'transparent');
  g.fillStyle = fg; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, TAU); g.fill();
  return (_fbdC = cv);
}
let _bhDiscC: HTMLCanvasElement | null = null;
function bhDiscSpr(): HTMLCanvasElement {   /* the supermassive black hole (main.js ~4200) */
  if (_bhDiscC) return _bhDiscC;
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2, k = C / 30;   /* world r30 → canvas */
  const sh = g.createRadialGradient(C, C, 0, C, C, 30 * k);
  sh.addColorStop(0, 'rgba(0,0,0,1)'); sh.addColorStop(0.6, 'rgba(0,0,0,0.92)'); sh.addColorStop(1, 'transparent');
  g.fillStyle = sh; g.beginPath(); g.arc(C, C, 30 * k, 0, TAU); g.fill();
  const bh = g.createRadialGradient(C, C, 4 * k, C, C, 22 * k);
  bh.addColorStop(0, 'rgba(0,0,0,1)'); bh.addColorStop(0.5, 'rgba(0,0,0,1)');
  bh.addColorStop(0.64, 'rgba(255,170,60,0.9)'); bh.addColorStop(1, 'transparent');
  g.fillStyle = bh; g.beginPath(); g.arc(C, C, 22 * k, 0, TAU); g.fill();
  return (_bhDiscC = cv);
}
const _coronaC = new Map<string, HTMLCanvasElement>();
function coronaSpr(col: string): HTMLCanvasElement {   /* main-sequence glow (main.js ~5121) */
  const hit = _coronaC.get(col); if (hit) return hit;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const sg = g.createRadialGradient(C, C, 0, C, C, C);
  sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.25, col); sg.addColorStop(0.6, col + '66'); sg.addColorStop(1, 'transparent');
  g.fillStyle = sg; g.beginPath(); g.arc(C, C, C, 0, TAU); g.fill();
  _coronaC.set(col, cv); return cv;
}
let _moonTermC: HTMLCanvasElement | null = null;
function moonTermSpr(): HTMLCanvasElement {
  /* the moon terminator (main.js 5313): a dark offset disc clipped to the
     globe — baked with the shadow at +x; the sprite rotates to the planet's
     orbit angle so the dark limb faces away from the star */
  if (_moonTermC) return _moonTermC;
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  g.beginPath(); g.arc(C, C, C, 0, TAU); g.clip();
  g.fillStyle = 'rgba(4,6,18,0.55)';
  g.beginPath(); g.arc(C + C * 0.55, C, C * 0.95, 0, TAU); g.fill();
  return (_moonTermC = cv);
}
let _webC: HTMLCanvasElement | null = null;
function webBlobSpr(): HTMLCanvasElement {   /* WEB_BLOB (main.js 3578), verbatim stops */
  if (_webC) return _webC;
  const T = 256, cv = document.createElement('canvas'); cv.width = cv.height = T;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
  gr.addColorStop(0, 'rgba(196,186,245,0.9)'); gr.addColorStop(0.40, 'rgba(150,132,232,0.42)');
  gr.addColorStop(0.75, 'rgba(132,112,225,0.12)'); gr.addColorStop(1, 'rgba(132,112,225,0)');
  g.fillStyle = gr; g.fillRect(0, 0, T, T);
  return (_webC = cv);
}
let _fogBC: HTMLCanvasElement | null = null;
function fogBlobSpr(): HTMLCanvasElement {   /* FOG_BLOB (main.js 3589), verbatim stops */
  if (_fogBC) return _fogBC;
  const T = 256, cv = document.createElement('canvas'); cv.width = cv.height = T;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
  gr.addColorStop(0, 'rgba(6,8,20,0.6)'); gr.addColorStop(0.45, 'rgba(7,9,22,0.32)');
  gr.addColorStop(0.8, 'rgba(5,7,16,0.08)'); gr.addColorStop(1, 'rgba(5,7,16,0)');
  g.fillStyle = gr; g.fillRect(0, 0, T, T);
  return (_fogBC = cv);
}
let _veilC: HTMLCanvasElement | null = null;
function veilSpr(): HTMLCanvasElement {   /* the beyond-charter veil (main.js 3760), proportional bake */
  if (_veilC) return _veilC;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const gr = g.createRadialGradient(C, C, C * (0.97 / 2.0), C, C, C);
  gr.addColorStop(0, 'rgba(5,7,16,0)'); gr.addColorStop(0.5, 'rgba(5,7,16,0.2)'); gr.addColorStop(1, 'rgba(4,5,12,0.36)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return (_veilC = cv);
}
let _obsC: HTMLCanvasElement | null = null;
function obsRingSpr(): HTMLCanvasElement {   /* the observable-universe edge (main.js 3611), proportional band */
  if (_obsC) return _obsC;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const gr = g.createRadialGradient(C, C, 0, C, C, C);
  gr.addColorStop(0.9417, 'rgba(255,140,50,0)'); gr.addColorStop(0.9709, 'rgba(255,170,70,0.45)'); gr.addColorStop(1, 'rgba(255,140,50,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(C, C, C, 0, TAU); g.fill();
  return (_obsC = cv);
}
let _radioC: HTMLCanvasElement | null = null;
function radioLobesSpr(): HTMLCanvasElement {   /* jet lobes (main.js 3697), verbatim colors; u px = 1 galaxy-size unit */
  if (_radioC) return _radioC;
  const u = 38, W2 = Math.ceil(6.6 * u), H2 = Math.ceil(2.8 * u);
  const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
  const g = cv.getContext('2d')!, cx = W2 / 2, cy = H2 / 2;
  for (const sgn of [-1, 1]) {
    const lg2 = g.createRadialGradient(cx + sgn * 1.9 * u, cy, 0, cx + sgn * 1.9 * u, cy, 1.4 * u);
    lg2.addColorStop(0, 'rgba(255,150,90,0.32)'); lg2.addColorStop(1, 'transparent');
    g.fillStyle = lg2; g.beginPath(); g.arc(cx + sgn * 1.9 * u, cy, 1.4 * u, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,170,110,0.45)'; g.lineWidth = 0.07 * u;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sgn * 1.9 * u, cy); g.stroke();
  }
  return (_radioC = cv);
}
let _tailC: HTMLCanvasElement | null = null;
function cometTailSpr(): HTMLCanvasElement {   /* the tail gradient (main.js 5388), baked as a strip */
  if (_tailC) return _tailC;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
  const g = cv.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, 'rgba(200,230,255,0.8)'); gr.addColorStop(1, 'transparent');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 8);
  return (_tailC = cv);
}
const _termC = new Map<string, HTMLCanvasElement>();
function terminatorSpr(starCol: string): HTMLCanvasElement {
  /* the day/night overlay (main.js ~5264): lit tint at the starward point,
     night at the far limb, clipped to the globe. Baked with the light at a
     fixed local point; the sprite ROTATES to face the star. Canvas C = 1.5pr. */
  const hit = _termC.get(starCol); if (hit) return hit;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2, pr = C / 1.5;
  const n = parseInt((starCol || '#ffe9c4').slice(1), 16);
  const lr = (n >> 16) & 255, lgc = (n >> 8) & 255, lb = n & 255;
  const lit = 'rgba(' + Math.round(lr * 0.55 + 255 * 0.45) + ',' + Math.round(lgc * 0.55 + 250 * 0.45) + ',' + Math.round(lb * 0.55 + 230 * 0.45) + ',0.18)';
  const lg = g.createRadialGradient(C - pr * 0.5, C, 0, C, C, pr * 1.5);
  lg.addColorStop(0, lit); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,12,0.42)');
  g.fillStyle = lg; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'destination-in';
  g.beginPath(); g.arc(C, C, pr, 0, TAU); g.fill();
  _termC.set(starCol, cv); return cv;
}

/* ---- zoom-dependent bookkeeping ---- */
interface StarNodeRef { seed: number; x: number; y: number; c?: string; s: number; }
interface StarEntry { spr: Sprite; star: StarNodeRef; }
interface ScreenScaled { obj: Container; f: number; }   /* scale = f / cam.z */
const galaxySpins: Array<{ spr: Sprite; base: number }> = [];
let uniNodes: GalaxyNode[] = [];   /* cached universe composition — checkTransitions runs per tick */
let uniCell: { ux: number; uy: number } | null = null;   /* the streamed window's anchor cell */
/* SURVEY-FIRST: one tap opens the typed card; its explicit 44px travel
   action performs the dive. The card can cover the body on a phone, so
   navigation must never depend on a second canvas tap or a timing window. */
function surveyCard(d: unknown, travelAction: CardTravelAction | null = null): void {
  if (d) { showSurvey(d as Descriptor, undefined, travelAction); playSurveyPing(); }
}
let galStars: StarEntry[] = [];
let galTwinkle: StarEntry[] = [];
let screenScaled: ScreenScaled[] = [];
let solMark: Container | null = null;
let bhDisc: Sprite | null = null;
interface GalAnim { spr: Container; kind: 'bhdisc' | 'nsbeam' | 'proto' | 'worm'; seed: number; }
let galAnims: GalAnim[] = [];
let wormPos: { x: number; y: number } | null = null;
/* universe furniture: zoom-gated labels, blazar pulses, the charter fx layer */
let uniLabels: Array<{ t: Text; size: number; gate: number }> = [];   /* gate 0 = the far-zoom web captions */
let uniPulse: Array<{ spr: Sprite; seed: number }> = [];
let charterFx: Container | null = null;
let webLayer: Container | null = null;
let fogFx: Array<{ spr: Sprite; wx: number; wy: number; ramp: number }> = [];
let lastGalaxyBuildMs = 0;
interface CometFx { coma: Sprite; tail: Sprite; label: Text; cm: { off: number; period: number; aMaj: number; ecc: number; tilt: number }; }
let sysComets: CometFx[] = [];
let visitorFx: { wrap: Container; body: Sprite; label: Text; v: { speed: number; off: number; ang: number; b: number } } | null = null;
const zCut = (): number => {
  const W = app.screen.width, H = app.screen.height;   /* logical CSS px — renderer.width/resolution DOUBLE-divided on DPR-3 phones (the off-center-scene bug the perf probe caught) */
  return Math.sqrt((W * H) / (UCELL * UCELL * 3600));   /* main.js 3620 */
};
let fineLayer: Container | null = null;
let fineWin: { fx0: number; fy0: number; fx1: number; fy1: number } | null = null;
let fineStarTargets: Array<{ spr: Sprite; star: StarNodeRef }> = [];
let lastZBucket = 0;
const zBucket = (): number => Math.round(Math.log(cam.z) / Math.log(1.15));
interface Orbiter { c: Container; kind: 'planet' | 'moon' | 'rock' | 'dwarf' | 'beam'; orb: number; sp?: number; a0?: number; mul?: number; pOrb?: number; face?: Sprite[]; cloud?: { wrap: Container; a: Sprite; b: Sprite; pr: number }; }
let orbiters: Orbiter[] = [];
let planetTargets: Array<{ holder: Container; planet: PlanetNode }> = [];
let sysLabels: Array<{ t: Text; getPos: (time: number) => { x: number; y: number } }> = [];
let sysStar: { seed: number; col: string; kind: string; starR: number } | null = null;
let chartLayer: Container | null = null;   /* Star charts (chartsOn, OFF by default — v1.3.6, Nick's call) */
let starSurfSpr: Sprite | null = null;
let surfClouds: { a: Sprite; b: Sprite; w: number } | null = null;
const baseR = (): number => Math.max(0.7 / cam.z, 0.55);   /* Renderer star sizing (main.js 4126) */

function clearWorld(): void {
  /* DESTROY, don't just detach (audit #4): Texts own their canvas textures
     and the universe rebuilds on every pan cell-crossing — undisposed
     children climb GPU memory. Shared sprite textures survive (destroy()
     leaves textures alone by default). */
  for (const c of world.removeChildren()) c.destroy({ children: true });
  galaxySpins.length = 0;
  galStars = []; galTwinkle = []; screenScaled = [];
  solMark = null; bhDisc = null; fineLayer = null; fineWin = null;
  fineStarTargets = [];
  orbiters = []; planetTargets = []; sysLabels = []; sysStar = null; starSurfSpr = null; surfClouds = null; chartLayer = null;
  galAnims = []; wormPos = null;
  uniLabels = []; uniPulse = []; charterFx = null; webLayer = null; fogFx = [];
  sysComets = []; visitorFx = null;
}

/* ---- draw passes ---- */
function drawUniverse(): void {
  clearWorld();
  /* THE REAL ART: per-seed painterly sprites (verbatim GalaxyArt painters,
     kind-locked), with the Renderer's exact transform (main.js ~3741).
     STREAMED around the CAMERA. Special populations wear their bespoke
     faces: quasars the feeding-black-hole sprite, radio galaxies their jet
     lobes, colliding pairs their tidal bridge — and the far zoom melts
     into the cosmic web with cluster/void captions (main.js 3658). */
  uniCell = { ux: Math.floor(camT.x / UCELL), uy: Math.floor(camT.y / UCELL) };
  const R = 3;
  /* the cosmic web breath, per cell */
  webLayer = new Container();
  webLayer.eventMode = 'none';
  world.addChild(webLayer);
  for (let cx = uniCell.ux - R; cx <= uniCell.ux + R; cx++) for (let cy = uniCell.uy - R; cy <= uniCell.uy + R; cy++) {
    const gl = galaxiesInCell(cx, cy) as unknown as GalaxyNode[] & { web?: number };
    const web = gl.web ?? 0;
    if (web > 0.5) {
      const b = new Sprite(Texture.from(webBlobSpr()));
      b.anchor.set(0.5);
      b.position.set(cx * UCELL + UCELL / 2, cy * UCELL + UCELL / 2);
      b.width = UCELL * 1.9; b.height = UCELL * 1.9;
      b.alpha = (web - 0.5) * 0.17;
      b.cullable = true;
      webLayer.addChild(b);
    }
    /* far-zoom captions: clusters glow, voids yawn (sparse, seeded picks) */
    const capt = (web > 0.86 && ((cx * 7 + cy * 13) % 29 === 0)) ? ['galaxy cluster', 'rgba(170,150,230,0.34)']
      : (web < 0.05 && ((cx * 5 + cy * 3) % 23 === 0)) ? ['cosmic void', 'rgba(110,118,150,0.4)'] : null;
    if (capt) {
      const t = new Text({ text: capt[0]!, style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, fill: capt[1]! } });
      t.anchor.set(0.5);
      t.position.set(cx * UCELL + UCELL / 2, cy * UCELL + UCELL / 2);
      t.visible = false;
      world.addChild(t);
      screenScaled.push({ obj: t, f: 1 });
      uniLabels.push({ t, size: 0, gate: 0 });
    }
  }
  uniNodes = universeGalaxies(camT.x, camT.y, R);
  for (const g of uniNodes) {
    const sz = g.size;
    const onTap = (): void => {
      surveyCard(
        describePick({ kind: g.quasar ? 'quasar' : (g.radio ? 'radio' : 'galaxy'), data: g } as never),
        { label: 'Enter galaxy', run: () => descendGalaxy(g) },
      );
    };
    let label: [string, string, number] | null = null;   /* text, color, gate */
    if (g.quasar) {
      /* the feeding black hole outshines its galaxy (main.js 3714) */
      const q = new Sprite(Texture.from(_quasarSpr()));
      q.anchor.set(0.5);
      q.position.set(g.x, g.y);
      q.width = sz * 5.6; q.height = sz * 5.6;
      q.rotation = g.rot;
      q.cullable = true;
      q.eventMode = 'static'; q.cursor = 'pointer';
      q.on('pointertap', onTap);
      world.addChild(q);
      if (g.blazar) uniPulse.push({ spr: q, seed: g.seed });
      label = [g.blazar ? 'blazar — a quasar jet aimed straight at you' : 'quasar — a feeding black hole outshining its galaxy', 'rgba(190,215,255,0.85)', 26];
    } else {
      if (g.radio) {
        const lobes = new Sprite(Texture.from(radioLobesSpr()));
        lobes.anchor.set(0.5);
        lobes.position.set(g.x, g.y);
        lobes.width = sz * 6.6; lobes.height = sz * 2.8;
        lobes.rotation = g.rot;
        lobes.eventMode = 'none'; lobes.cullable = true;
        world.addChild(lobes);
        label = ['radio galaxy — jets inflate giant lobes', 'rgba(255,190,150,0.8)', 30];
      }
      if (g.bridge) {
        /* tidal bridge of stars torn between colliding galaxies (main.js 3729) */
        const mx2 = (g.x + g.bridge.x2) / 2, my2 = (g.y + g.bridge.y2) / 2;
        const br = new Graphics();
        br.moveTo(g.x, g.y);
        br.quadraticCurveTo(mx2 + sz * 0.4, my2 - sz * 0.4, g.bridge.x2, g.bridge.y2);
        br.stroke({ width: sz * 0.14, color: 0xd2dcfa, alpha: 0.20 });
        br.eventMode = 'none';
        world.addChild(br);
      }
      const spr = new Sprite(Texture.from(galSpriteFor(g)));
      spr.anchor.set(0.5);
      spr.position.set(g.x, g.y);
      const k = g.radio ? 0.6 : 1;   /* the radio host draws smaller inside its lobes */
      const px = (sz * 2 * k) / 512;
      spr.scale.set(px, px * g.tilt);
      spr.rotation = g.radio ? g.rot + Math.PI / 2 : g.rot;
      spr.cullable = true;
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', onTap);
      world.addChild(spr);
      if (!g.radio) galaxySpins.push({ spr, base: g.rot });
    }
    if (g.home) {
      const t = new Text({ text: 'Milky Way — you are here', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, fill: 0xffd9a0 } });
      t.anchor.set(0.5, 0);
      t.position.set(g.x, g.y + sz * 1.15 + 4);
      world.addChild(t);
    } else if (label) {
      const t = new Text({ text: label[0], style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, fill: label[1] } });
      t.anchor.set(0.5, 0);
      t.position.set(g.x, g.y + sz * (g.quasar ? 2 : 2.4));
      t.visible = false;
      world.addChild(t);
      screenScaled.push({ obj: t, f: 1 });
      uniLabels.push({ t, size: sz, gate: label[2] });
    } else if (!g.dwarf) {
      /* every named galaxy earns its name as you close in (main.js 3746) */
      const t = new Text({ text: galaxyName(g.seed), style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, fill: 'rgba(200,210,240,0.7)' } });
      t.anchor.set(0.5, 0);
      t.position.set(g.x, g.y + sz * 1.15);
      t.visible = false;
      world.addChild(t);
      screenScaled.push({ obj: t, f: 1 });
      uniLabels.push({ t, size: sz, gate: 34 });
    }
  }
  /* the charter: a glowing frontier ring, the veil, drifting fog beyond
     (fog is static per rebuild in the slice — the drift is recorded) */
  const rr = reachRadiusOf(primeCount());
  charterFx = new Container();
  charterFx.eventMode = 'none';
  const veil = new Sprite(Texture.from(veilSpr()));
  veil.anchor.set(0.5);
  veil.position.set(HOME_POS.x, HOME_POS.y);
  veil.width = rr * 4; veil.height = rr * 4;
  charterFx.addChild(veil);
  const FC = UCELL * 1.5;
  for (let fx = uniCell.ux * 2 - R * 2; fx <= uniCell.ux * 2 + R * 2; fx++) for (let fy = uniCell.uy * 2 - R * 2; fy <= uniCell.uy * 2 + R * 2; fy++) {
    const wx = fx * FC + FC * 0.5, wy = fy * FC + FC * 0.5;
    const dd = Math.hypot(wx - HOME_POS.x, wy - HOME_POS.y);
    if (dd < rr * 1.04) continue;
    const ramp = Math.min(Math.max((dd - rr) / (rr * 0.55), 0), 1);
    const n = (UNOISE as (x: number, y: number, o: number) => number)(wx / UCELL * 0.16, wy / UCELL * 0.16, 3);
    const a = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * ramp;
    if (a <= 0.03 && ramp <= 0) continue;
    const f = new Sprite(Texture.from(fogBlobSpr()));
    f.anchor.set(0.5);
    f.position.set(wx, wy);
    f.width = FC * 1.9; f.height = FC * 1.9;
    f.alpha = a;
    f.cullable = true;
    charterFx.addChild(f);
    fogFx.push({ spr: f, wx, wy, ramp });   /* the drift re-samples the noise per tick */
  }
  const ring = new Graphics().circle(HOME_POS.x, HOME_POS.y, rr).stroke({ width: Math.max(rr * 0.0035, 1.2), color: 0x96beff, alpha: 0.5 });
  charterFx.addChild(ring);
  const cLab = new Text({ text: 'your charter — ' + currentRegionOf(primeCount()).name, style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, fill: 'rgba(170,205,255,0.72)' } });
  cLab.anchor.set(0.5, 1);
  cLab.position.set(HOME_POS.x, HOME_POS.y - rr - 4);
  charterFx.addChild(cLab);
  screenScaled.push({ obj: cLab, f: 1 });
  world.addChild(charterFx);
  /* the edge of the observable universe — the orange ring (main.js 3611) */
  const obs = new Sprite(Texture.from(obsRingSpr()));
  obs.anchor.set(0.5);
  obs.width = OBS_R * 2.06; obs.height = OBS_R * 2.06;
  obs.eventMode = 'none';
  world.addChild(obs);
  applyUniverseGates();   /* gates live from the first frame, not the first zoom */
}
function applyUniverseGates(): void {
  const zc = zCut();
  if (webLayer) webLayer.visible = cam.z > zc;   /* showWeb (main.js 3658) */
  if (charterFx) charterFx.visible = cam.z > zc * 0.7;
  for (const L of uniLabels) L.t.visible = L.gate === 0 ? (cam.z > zc && cam.z < 0.5) : (L.size * cam.z > L.gate);
}

function drawGalaxy(galSeed: number): void {
  const _b0 = performance.now();
  clearWorld();
  const prof = galaxyProfile(galSeed) as Record<string, unknown>;
  /* THE HAZE — unresolved starlight matching the exact star-density math
     (verbatim galaxyHaze; D-HAZE's render-layer ownership starts here) */
  const hazeSpr = new Sprite(Texture.from(galaxyHaze(galSeed, prof) as HTMLCanvasElement));
  hazeSpr.anchor.set(0.5);
  hazeSpr.scale.set((2 * GR) / 2048);
  hazeSpr.eventMode = 'none';
  world.addChild(hazeSpr);
  const w = galaxyCellWindow(-GR * 1.2, -GR * 1.2, GR * 1.2, GR * 1.2);
  const bR = baseR();
  /* deco pass UNDER the stars, Renderer sizes (main.js ~4131): nebulae ×2.3 ·
     planetary shells ×2.4 · remnants ×2.6 · open/glob star knots · rogue
     planets · failed brown dwarfs. Deco sprites are PICKABLE — the survey
     card speaks through describePick, the game's own card router. */
  const decoLayer = new Container();
  world.addChild(decoLayer);
  const decoTap = (dc: Record<string, unknown>) => (): void => {
    const d = describePick({ kind: 'deco', data: dc } as never);
    if (d) showSurvey(d as unknown as Descriptor);
  };
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    for (const dc of galaxyCell(galSeed, prof, cx, cy).deco) {
      if (dc.k === 'h2' || dc.k === 'neb' || dc.k === 'mol' || dc.k === 'plan' || dc.k === 'rem') {
        const f = dc.k === 'rem' ? 1.3 : dc.k === 'plan' ? 1.2 : 1.15;
        const spr = new Sprite(Texture.from(decoSprite(dc)));
        spr.anchor.set(0.5);
        const rr = (dc.rr as number) || 8;
        spr.position.set(dc.x, dc.y);
        spr.width = rr * 2 * f; spr.height = rr * 2 * f;
        spr.cullable = true;
        spr.eventMode = 'static';
        spr.cursor = 'pointer';
        spr.on('pointertap', decoTap(dc));
        decoLayer.addChild(spr);
      } else if ((dc.k === 'open' || dc.k === 'glob') && Array.isArray(dc.pts)) {
        /* star knots: loose young clusters / dense ancient globulars —
           starSprite points at the Renderer's sizes, additive like the source */
        const glob = dc.k === 'glob';
        const tex = Texture.from(starSprite(glob ? '#f0dcb0' : '#cfe4ff', false));
        for (const pt of dc.pts as Array<[number, number, number]>) {
          const d2 = pt[2] * bR * (glob ? 5.5 : 6);
          const s2 = new Sprite(tex);
          s2.anchor.set(0.5);
          s2.blendMode = 'add';
          s2.position.set((dc.x as number) + pt[0], (dc.y as number) + pt[1]);
          s2.width = d2; s2.height = d2;
          s2.cullable = true;
          decoLayer.addChild(s2);
        }
      } else if (dc.k === 'rogue') {
        const s2 = new Sprite(Texture.from(_rogueSpr()));
        s2.anchor.set(0.5); s2.position.set(dc.x, dc.y);
        s2.width = 2.1; s2.height = 2.1;
        s2.eventMode = 'static'; s2.cursor = 'pointer';
        s2.on('pointertap', decoTap(dc));
        decoLayer.addChild(s2);
      } else if (dc.k === 'fbd') {
        const s2 = new Sprite(Texture.from(fbdSpr()));
        s2.anchor.set(0.5); s2.position.set(dc.x, dc.y);
        s2.width = 3.2; s2.height = 3.2;
        s2.eventMode = 'static'; s2.cursor = 'pointer';
        s2.on('pointertap', decoTap(dc));
        decoLayer.addChild(s2);
      }
    }
  }
  /* THE STARS — starSprite painters, additive, Renderer sizing D=s·baseR·8,
     spiked halo for the giants (s≥1.5), twinkle list for the bright (s>1.3) */
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    for (const s of galaxyCell(galSeed, prof, cx, cy).stars) {
      const spr = new Sprite(Texture.from(starSprite(s.c, s.s >= 1.5)));
      spr.anchor.set(0.5);
      spr.blendMode = 'add';
      const D = s.s * bR * 8;
      spr.width = D; spr.height = D;
      spr.position.set(s.x, s.y);
      spr.cullable = true;
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', () => {
        const star = { seed: s.seed, x: s.x, y: s.y };
        surveyCard(describePick({ kind: 'star', data: s } as never), {
          label: 'Enter system', run: () => descendSystem(star),
        });
      });
      world.addChild(spr);
      const entry = { spr, star: { seed: s.seed, x: s.x, y: s.y, c: s.c, s: s.s } };
      galStars.push(entry);
      if (s.s > 1.3) galTwinkle.push(entry);
      if ((s as { sol?: boolean }).sol) buildSolMark(s.x, s.y);
    }
  }
  /* the wormhole — one hides in a few galaxies; survey it, or fly in and be
     hurled somewhere unimaginably distant (main.js 3415: the jump is seeded
     from the galaxy, identical for every explorer, reach-clamped toward home) */
  const wh = galaxyWormhole(galSeed) as { x: number; y: number } | null;
  if (wh) {
    const ws = new Sprite(Texture.from(_wormSpr()));
    ws.anchor.set(0.5);
    ws.position.set(wh.x, wh.y);
    ws.width = 30; ws.height = 30;
    ws.eventMode = 'static';
    ws.cursor = 'pointer';
    ws.on('pointertap', () => surveyCard(describePick({ kind: 'worm', data: wh } as never)));
    world.addChild(ws);
    galAnims.push({ spr: ws, kind: 'worm', seed: galSeed });
    wormPos = wh;
  }
  /* supernova aftermath — epoch-anchored: sites shift as COSMIC_EPOCH climbs
     (main.js 4214). Every death is a cloud; remnants keep their cores. */
  for (const site of supernovaSites(galSeed, epochClock.current()) as Array<Record<string, unknown> & { x: number; y: number; seed: number; remnant: string; births: Array<{ x: number; y: number; seed: number }> }>) {
    const ss = new Sprite(Texture.from(snSiteSprite(site.seed)));
    ss.anchor.set(0.5);
    ss.position.set(site.x, site.y);
    ss.width = 48; ss.height = 48;
    ss.eventMode = 'static';
    ss.cursor = 'pointer';
    ss.on('pointertap', () => surveyCard(describePick({ kind: 'snova', data: site } as never)));
    world.addChild(ss);
    if (site.remnant === 'BH') {
      const bd = new Sprite(Texture.from(_bhDiscSpr()));
      bd.anchor.set(0.5); bd.position.set(site.x, site.y);
      bd.width = 14; bd.height = 14; bd.eventMode = 'none';
      world.addChild(bd);
      galAnims.push({ spr: bd, kind: 'bhdisc', seed: site.seed });
    } else if (site.remnant === 'NS') {
      const beams = new Container(); beams.eventMode = 'none';
      beams.position.set(site.x, site.y);
      for (const rot of [0, Math.PI]) {
        const bm = new Sprite(Texture.from(_beamSpr()));
        bm.anchor.set(0, 0.5); bm.position.set(0.9 * Math.cos(rot), 0.9 * Math.sin(rot));
        bm.width = 6.8; bm.height = 1.6; bm.rotation = rot; bm.alpha = 0.8;
        beams.addChild(bm);
      }
      world.addChild(beams);
      galAnims.push({ spr: beams, kind: 'nsbeam', seed: site.seed });
      const core = new Sprite(Texture.from(_nsCoreSpr()));
      core.anchor.set(0.5); core.position.set(site.x, site.y);
      core.width = 3.2; core.height = 3.2; core.eventMode = 'none';
      world.addChild(core);
    }
    for (const b of site.births) {
      const ps = new Sprite(Texture.from(_protoSpr()));
      ps.anchor.set(0.5); ps.position.set(b.x, b.y);
      ps.width = 6.8; ps.height = 6.8;
      ps.eventMode = 'static';
      ps.cursor = 'pointer';
      ps.on('pointertap', () => surveyCard(describePick({ kind: 'protostar', data: b } as never)));
      world.addChild(ps);
      galAnims.push({ spr: ps, kind: 'proto', seed: b.seed });
    }
  }
  /* the supermassive black hole — over every star layer: light stops here */
  bhDisc = new Sprite(Texture.from(bhDiscSpr()));
  bhDisc.anchor.set(0.5);
  bhDisc.width = 60; bhDisc.height = 60;
  bhDisc.eventMode = 'none';
  world.addChild(bhDisc);
  lastZBucket = zBucket();
  updateFineLayer(true);
  lastGalaxyBuildMs = performance.now() - _b0;   /* the rebuild budget, logged by the smoke */
}

function buildSolMark(x: number, y: number): void {
  /* 'Sun — our star' (main.js 4171): ring 9/z + italic label, LOD-gated */
  solMark = new Container();
  solMark.eventMode = 'none';
  solMark.position.set(x, y);
  const ring = new Graphics().circle(0, 0, 9).stroke({ width: 1.2, color: 0xffd9a0, alpha: 0.8 });
  const label = new Text({ text: 'Sun — our star', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, fill: 'rgba(255,217,160,0.95)' } });
  label.anchor.set(0.5, 1);
  label.position.set(0, -14);
  solMark.addChild(ring); solMark.addChild(label);
  world.addChild(solMark);
  screenScaled.push({ obj: solMark, f: 1 });
}

function updateFineLayer(force: boolean): void {
  /* fine star layer (main.js 4182): keep resolving stars the deeper you
     zoom — gate c.z > minWH/260, FCELL cells, viewport-windowed, clamped
     to the disc. Diveable, same as the game's picks. */
  if (nav.mode !== 'galaxy' || !nav.gal) return;
  const on = cam.z > minWH() / 260;
  if (!on) {
    if (fineLayer) { world.removeChild(fineLayer); fineLayer.destroy({ children: true }); fineLayer = null; fineWin = null; }
    fineStarTargets = [];
    return;
  }
  const W = app.screen.width, H = app.screen.height;   /* logical CSS px — renderer.width/resolution DOUBLE-divided on DPR-3 phones (the off-center-scene bug the perf probe caught) */
  const x0 = cam.x - (W / 2) / cam.z, y0 = cam.y - (H / 2) / cam.z;
  const x1 = cam.x + (W / 2) / cam.z, y1 = cam.y + (H / 2) / cam.z;
  const win = {
    fx0: Math.max(Math.floor(x0 / FCELL), Math.floor(-GR / FCELL) - 1),
    fy0: Math.max(Math.floor(y0 / FCELL), Math.floor(-GR / FCELL) - 1),
    fx1: Math.min(Math.floor(x1 / FCELL), Math.floor(GR / FCELL) + 1),
    fy1: Math.min(Math.floor(y1 / FCELL), Math.floor(GR / FCELL) + 1),
  };
  if (!force && fineWin && win.fx0 === fineWin.fx0 && win.fy0 === fineWin.fy0 && win.fx1 === fineWin.fx1 && win.fy1 === fineWin.fy1) return;
  if (fineLayer) { world.removeChild(fineLayer); fineLayer.destroy({ children: true }); }
  fineLayer = new Container();
  fineStarTargets = [];
  const prof = galaxyProfile(nav.gal.seed) as Record<string, unknown>;
  const bR = baseR();
  for (let fx = win.fx0; fx <= win.fx1; fx++) for (let fy = win.fy0; fy <= win.fy1; fy++) {
    for (const s of fineStarsInCell(nav.gal.seed, prof, fx, fy) as Array<{ x: number; y: number; c: string; s: number; seed: number }>) {
      const spr = new Sprite(Texture.from(starSprite(s.c, false)));
      spr.anchor.set(0.5);
      spr.blendMode = 'add';
      const D = s.s * bR * 6.5;
      spr.width = D; spr.height = D;
      spr.position.set(s.x, s.y);
      spr.cullable = true;
      /* Fine stars obey the same survey-first card action as base stars. */
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', () => {
        const star = { seed: s.seed, x: s.x, y: s.y };
        surveyCard(describePick({ kind: 'star', data: s } as never), {
          label: 'Enter system', run: () => descendSystem(star),
        });
      });
      fineLayer.addChild(spr);
      fineStarTargets.push({ spr, star: { seed: s.seed, x: s.x, y: s.y, c: s.c, s: s.s } });
    }
  }
  /* under the black hole disc, over the base stars */
  world.addChildAt(fineLayer, bhDisc ? world.getChildIndex(bhDisc) : world.children.length);
  fineWin = win;
}

function updateZoomDependent(): void {
  /* runs on zoom-bucket change: star sizes track baseR (screen-constant
     until deep zoom, exactly the Renderer's curve), Sol/label gates, BH gate */
  const zb = zBucket();
  if (zb === lastZBucket) return;
  lastZBucket = zb;
  if (nav.mode === 'universe') { applyUniverseGates(); updateUniverseCtx(); }
  if (nav.mode === 'galaxy') {
    const bR = baseR();
    for (const st of galStars) { const D = st.star.s * bR * 8; st.spr.width = D; st.spr.height = D; }
    updateFineLayer(true);   /* fine sizes track baseR via the rebuild */
    if (solMark) solMark.visible = cam.z > minWH() / 900;
    if (bhDisc) bhDisc.visible = cam.z > minWH() / 700;
  }
  if (nav.mode === 'system') { rebuildSystemHD(); updateStarSurf(); }
}
function updateStarSurf(): void {
  /* universe-crispness (main.js 5127): a CLOSE star shows its boiling
     surface inside the corona — far views keep the pure gradient */
  if (!sysStar) return;
  const want = sysStar.starR * 2 * camT.z * DPR > 90;
  if (want && !starSurfSpr) {
    starSurfSpr = new Sprite(Texture.from(_starSurf(sysStar.seed, sysStar.col, sysStar.kind)));
    starSurfSpr.anchor.set(0.5);
    starSurfSpr.width = sysStar.starR * 2; starSurfSpr.height = sysStar.starR * 2;
    starSurfSpr.eventMode = 'none';
    world.addChildAt(starSurfSpr, 1);   /* over the corona, under everything else */
  } else if (!want && starSurfSpr) {
    world.removeChild(starSurfSpr); starSurfSpr.destroy(); starSurfSpr = null;
  }
}

function drawSystem(starSeed: number): void {
  clearWorld();
  const sys = systemScene(starSeed);
  const raw = systemFor(starSeed) as Record<string, unknown> & {
    binary?: { sep: number; r2: number; col2: string } | null;
    dwarfs?: Array<{ name?: string; orb: number; seed?: number }>;
  };
  /* the primary — each kind wearing its Renderer face (main.js ~5085) */
  if (sys.kind === 'BH') {
    const b = new Sprite(Texture.from(_bhSpr()));
    b.anchor.set(0.5); b.width = 110; b.height = 110; b.eventMode = 'none';
    world.addChild(b);
  } else if (sys.kind === 'NS' || sys.kind === 'MAG') {
    /* rotating beams + white-hot core (MAG's field-line ellipses: recorded gap) */
    const beams = new Container(); beams.eventMode = 'none';
    for (const rot of [0, Math.PI]) {
      const bm = new Sprite(Texture.from(_beamSpr()));
      bm.anchor.set(0, 0.5); bm.width = 90; bm.height = 9; bm.rotation = rot;
      beams.addChild(bm);
    }
    world.addChild(beams);
    orbiters.push({ c: beams, kind: 'beam', orb: 0 });
    const core = new Sprite(Texture.from(_nsCoreSpr()));
    core.anchor.set(0.5); core.width = 18; core.height = 18; core.eventMode = 'none';
    world.addChild(core);
  } else {
    /* corona gradient, verbatim stops; PROTO keeps this fallback (recorded) */
    const col = sys.starCol || '#ffe9c4';
    const srad = Math.max(sys.starR, 8);
    const corona = new Sprite(Texture.from(coronaSpr(col)));
    corona.anchor.set(0.5);
    corona.width = srad * 4.8; corona.height = srad * 4.8;   /* r = starR*2.4 */
    corona.eventMode = 'none';
    world.addChild(corona);
    sysStar = { seed: starSeed, col, kind: sys.kind, starR: srad };   /* _starSurf close-up gate */
    if (raw.binary) {
      const b2 = new Sprite(Texture.from(coronaSpr(raw.binary.col2 || col)));
      b2.anchor.set(0.5);
      b2.width = raw.binary.r2 * 4.8; b2.height = raw.binary.r2 * 4.8;
      b2.eventMode = 'none';
      world.addChild(b2);
      orbiters.push({ c: b2, kind: 'rock', orb: raw.binary.sep, sp: 0.25, a0: 0, mul: 1 });
    }
  }
  /* asteroid belt + kuiper ring — real rock lumps (main.js ~5160) */
  for (const [beltKey, kindKey, szMul, spMul] of [['belt', 'rock', 2.6, 1], ['kuiper', 'ice', 2.4, 0.4]] as Array<[string, 'rock' | 'ice', number, number]>) {
    const belt = (sys as unknown as Record<string, unknown>)[beltKey] as { r: number; rocks: Array<{ a: number; rr: number; s: number; sp: number }> } | null;
    if (!belt) continue;
    const set = _rockSet(kindKey);
    for (const b of belt.rocks) {
      const spr = new Sprite(Texture.from(set[((b.a * 997) | 0) & 7]!));
      spr.anchor.set(0.5);
      const sz = b.s * szMul;
      spr.width = sz; spr.height = sz;
      spr.rotation = b.a * 13;
      spr.eventMode = 'none';
      world.addChild(spr);
      orbiters.push({ c: spr, kind: 'rock', orb: b.rr, sp: b.sp * spMul, a0: b.a, mul: 1 });
    }
  }
  /* STAR CHARTS layer (chartsOn-gated, main.js 5072/5106): orbit rings, the
     habitable zone, the belt caption — the game's overlay, one toggle */
  chartLayer = new Container();
  chartLayer.eventMode = 'none';
  chartLayer.visible = save.chartsOn;
  world.addChild(chartLayer);
  const hz = sys.hz as [number, number] | null;
  if (hz) {
    const band = new Graphics().circle(0, 0, hz[1]).fill({ color: 0x50d282, alpha: 0.055 }).circle(0, 0, hz[0]).cut();
    chartLayer.addChild(band);
    const hzl = new Text({ text: 'habitable zone', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 10, fill: 'rgba(140,230,170,0.6)' } });
    hzl.anchor.set(0.5);
    hzl.position.set(0, -(hz[0] + hz[1]) / 2);
    chartLayer.addChild(hzl);
    screenScaled.push({ obj: hzl, f: 1 });
  }
  const beltR = (sys.belt as { r?: number } | null)?.r;
  if (beltR) {
    const bl = new Text({ text: 'asteroid belt', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 9.5, fill: 'rgba(180,172,158,0.7)' } });
    bl.anchor.set(0.5, 1);
    bl.position.set(0, -beltR - 2);
    chartLayer.addChild(bl);
    screenScaled.push({ obj: bl, f: 1 });
  }
  /* orbits & planets — Renderer angles/sizes: ang = orb·0.13 + t·0.05/(orb·0.012),
     pr = 6·sizeMul, sprite rotated so its baked light faces the star */
  for (const p of sys.planets) {
    chartLayer.addChild(new Graphics().circle(0, 0, p.orb).stroke({ width: 0.5, color: 0x2a3a55 }));
    const pr = 6 * ((p.P.sizeMul as number) || 1);
    const holder = new Container();
    const rg = ringGeom(p);
    if (p.ring && rg) {
      const back = ringHalf(p, rg, true);
      if (back) holder.addChild(back);
    }
    const spr = new Sprite(Texture.from(getPlanetSprite(p.P, Math.max(64, pr * 2 * camT.z * DPR))));
    spr.anchor.set(0.5);
    spr.width = pr * 2; spr.height = pr * 2;
    holder.addChild(spr);
    /* day/night terminator, rotated toward the star each tick */
    const term = new Sprite(Texture.from(terminatorSpr(sys.starCol || '#ffe9c4')));
    term.anchor.set(0.5);
    term.width = pr * 3; term.height = pr * 3;
    holder.addChild(term);
    if (p.ring && rg) {
      const front = ringHalf(p, rg, false);
      if (front) holder.addChild(front);
    }
    holder.eventMode = 'static';
    holder.cursor = 'pointer';
    holder.on('pointertap', () => surveyPlanet(p, starSeed));   /* survey; LAND is the card's own act */
    world.addChild(holder);
    const ent: Orbiter = { c: holder, kind: 'planet', orb: p.orb, face: [spr, term] };
    /* the drifting upper cloud deck (main.js 5256): terran/ocean close-ups
       only, motion-gated, twin-sprite wrap so the edge never seams */
    if (p.P.type === 'terran' || p.P.type === 'ocean') {
      const cw = new Container();
      cw.eventMode = 'none';
      const ctex = Texture.from(_cloudSpr(p.P));
      const mkc = (): Sprite => { const s = new Sprite(ctex); s.anchor.set(0, 0.5); s.width = pr * 2; s.height = pr * 2; s.alpha = 0.45; cw.addChild(s); return s; };
      const ca = mkc(), cb = mkc();
      const cm = new Graphics().circle(0, 0, pr).fill(0xffffff);
      cw.addChild(cm); cw.mask = cm;
      cw.visible = false;
      holder.addChildAt(cw, holder.getChildIndex(term));   /* clouds UNDER the terminator (Renderer order — night shades them) */
      ent.cloud = { wrap: cw, a: ca, b: cb, pr };
    }
    orbiters.push(ent);
    planetTargets.push({ holder, planet: p });
    /* moons — typed lit spheres on Kepler-ish drifts (main.js ~5290) */
    const solM = (SOL_MOONS as Record<string, Array<{ t: number }>>)[String(p.P.seed)] || [];
    for (let m = 0; m < p.moons; m++) {
      const mr2 = mulberry32(hashInt(p.P.seed as number, m * 17 + 5, 91));
      const mt = solM[m] ? solM[m]!.t : Math.floor(mr2() * 4);
      const mrad = Math.max(0.5, pr * 0.108);
      const moonC = new Container();
      moonC.eventMode = 'none';
      const ms = new Sprite(Texture.from(_moonSpr(mt | 0, mrad * 2.18 * camT.z * DPR > 34)));
      ms.anchor.set(0.5);
      ms.width = mrad * 2.18; ms.height = mrad * 2.18;
      moonC.addChild(ms);
      /* the moon's dark side turns away from the star (main.js 5313) */
      const mterm = new Sprite(Texture.from(moonTermSpr()));
      mterm.anchor.set(0.5);
      mterm.width = mrad * 2; mterm.height = mrad * 2;
      moonC.addChild(mterm);
      holder.addChild(moonC);
      orbiters.push({ c: moonC, kind: 'moon', orb: 1.7 + m * 0.48, sp: 0.55, a0: m * 2.4, mul: pr, pOrb: p.orb, face: [mterm] });
    }
    const label = new Text({ text: p.name, style: { fontFamily: 'Georgia, serif', fontSize: 11, fill: 'rgba(220,226,255,0.8)' } });
    label.anchor.set(0.5, 0);
    label.eventMode = 'none';
    world.addChild(label);
    screenScaled.push({ obj: label, f: 1 });
    sysLabels.push({ t: label, getPos: (time) => { const a = planetAng(p.orb, time); return { x: Math.cos(a) * p.orb, y: Math.sin(a) * p.orb + pr }; } });
  }
  /* dwarf planets (main.js ~5335) */
  if (raw.dwarfs) for (const dw of raw.dwarfs) {
    const ds = 2.2;
    const spr = new Sprite(Texture.from(_dwarfSpr((dw.orb | 0) % 3)));
    spr.anchor.set(0.5); spr.width = ds * 2.2; spr.height = ds * 2.2; spr.eventMode = 'none';
    world.addChild(spr);
    orbiters.push({ c: spr, kind: 'dwarf', orb: dw.orb });
  }
  /* comets on stretched orbits, tails blown away from the star (main.js 5375) */
  const comets = (raw as { comets?: Array<{ off: number; period: number; aMaj: number; ecc: number; tilt: number }> }).comets;
  if (comets) for (let ci = 0; ci < comets.length; ci++) {
    const cm = comets[ci]!;
    const tail = new Sprite(Texture.from(cometTailSpr()));
    tail.anchor.set(0, 0.5);
    tail.eventMode = 'none';
    world.addChild(tail);
    const coma = new Sprite(Texture.from(_comaSpr()));
    coma.anchor.set(0.5);
    coma.eventMode = 'none';
    world.addChild(coma);
    const label = new Text({ text: 'Comet ' + properName(hashInt(starSeed, 31 + ci, 17), 2), style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 9, fill: 'rgba(205,228,255,0.78)' } });
    label.anchor.set(0.5, 1);
    label.eventMode = 'none';
    world.addChild(label);
    screenScaled.push({ obj: label, f: 1 });
    sysComets.push({ coma, tail, label, cm });
  }
  /* a hyperbolic interstellar visitor streaking through (main.js 5357) */
  const v = (raw as { visitor?: { speed: number; off: number; ang: number; b: number } }).visitor;
  if (v) {
    const wrap = new Container();
    wrap.rotation = v.ang;
    wrap.eventMode = 'none';
    const trail = new Sprite(Texture.from(_vtrailSpr()));
    trail.anchor.set(11 / 15, 0.5);
    trail.width = 15; trail.height = 1.6;
    wrap.addChild(trail);
    const body = new Sprite(Texture.from(_visitorSpr()));
    body.anchor.set(0.5);
    body.width = 10; body.height = 3.8;
    wrap.addChild(body);
    world.addChild(wrap);
    const label = new Text({ text: 'interstellar object', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 9, fill: 'rgba(230,190,160,0.8)' } });
    label.anchor.set(0.5, 1);
    label.eventMode = 'none';
    world.addChild(label);
    screenScaled.push({ obj: label, f: 1 });
    visitorFx = { wrap, body, label, v };
  }
  lastZBucket = zBucket();
}
const planetAng = (orb: number, time: number): number => orb * 0.13 + time * 0.05 / (orb * 0.012);
interface RingGeo { tilt: number; hue: string; }
const _rgCache = new Map<number, RingGeo>();
function ringGeom(p: PlanetNode): RingGeo | null {
  /* seeded tilt + type hue (main.js 5219) — cached in a side map, never on P */
  if (!p.ring) return null;
  const seed = p.P.seed as number;
  let rg = _rgCache.get(seed);
  if (!rg) {
    const rr9 = mulberry32((seed ^ 0x1276) >>> 0);
    rg = {
      tilt: 0.30 + rr9() * 0.34,
      hue: (p.P.type === 'ice' || (p.P.type === 'gas' && rr9() < 0.4)) ? '188,212,232' : '224,206,166',
    };
    _rgCache.set(seed, rg);
  }
  return rg;
}
function ringHalf(p: PlanetNode, rg: RingGeo, back: boolean): Container | null {
  /* the baked banded ring sprite, split back/front around the globe like the
     Renderer's clip rects (main.js 5228/5283); back half dimmed to 0.8 */
  const pr = 6 * ((p.P.sizeMul as number) || 1);
  const wrap = new Container();
  wrap.rotation = 0.45;
  wrap.scale.set(1, rg.tilt);
  const spr = new Sprite(Texture.from(_ringSprite(p.P.seed as number, rg.hue)));
  spr.anchor.set(0.5);
  spr.width = pr * 4.2; spr.height = pr * 4.2;
  if (back) spr.alpha = 0.8;
  const mask = new Graphics().rect(-pr * 2.2, back ? -pr * 2.2 : 0, pr * 4.4, pr * 2.2).fill(0xffffff);
  wrap.addChild(spr); wrap.addChild(mask);
  spr.mask = mask;
  wrap.eventMode = 'none';
  return wrap;
}
function rebuildSystemHD(): void {
  /* the focused world earns the HD master as you close in (main.js 5215) */
  if (nav.mode !== 'system' || !nav.star) return;
  const sys = systemScene(nav.star.seed);
  for (const o of orbiters) {
    if (o.kind !== 'planet' || !o.face) continue;
    const p = sys.planets.find((q) => Math.abs(q.orb - o.orb) < 1e-9);
    if (!p) continue;
    const pr = 6 * ((p.P.sizeMul as number) || 1);
    const next = Texture.from(getPlanetSprite(p.P, Math.max(64, pr * 2 * camT.z * DPR)));
    const prev = o.face[0]!.texture;
    if (next !== prev) {
      o.face[0]!.texture = next;
      prev.destroy();   /* evict the old tier from Pixi's cache — no GPU-texture creep on long zoom sessions */
    }
  }
}

/* ---- navigation (every transition through the tested state machine) ---- */
function rerender(options: { preserveSurvey?: boolean } = {}): void {
  /* A density-only rebuild replaces Pixi textures, not the player's selected
     object. Navigation transitions invalidate the card as before; monitor/
     DPR changes preserve its exact DOM, full-identity context, and action. */
  if (!options.preserveSurvey) {
    invalidateSurveyTravel();
    hideSurvey();
  }
  document.body.classList.toggle('surface-mode', nav.mode === 'surface');
  if (nav.mode !== 'surface') {
    sideEl.style.display = 'none';
    document.documentElement.style.removeProperty('--planetside-top');
  }
  stSeam.gal = nav.gal; stSeam.star = nav.star;   /* the describePick seam stays true */
  if (nav.mode === 'universe') drawUniverse();
  else if (nav.mode === 'galaxy' && nav.gal) drawGalaxy(nav.gal.seed);
  else if (nav.mode === 'system' && nav.star) drawSystem(nav.star.seed);
  else if (nav.mode === 'surface' && nav.star && nav.planet) {
    const p = systemScene(nav.star.seed).planets.find((q) => q.seed === nav.planet!.seed);
    if (p) drawSurface(p); else {
      nav = NAV_HOME;
      document.body.classList.remove('surface-mode');
      sideEl.style.display = 'none';
      document.documentElement.style.removeProperty('--planetside-top');
      drawUniverse();
    }   /* a stale seed never bricks boot */
  }
  world.alpha = 0.25;   /* the mode fade (st.fade), eased back in the ticker */
  hudText();
  void persistView();
}
/* descents EASE in: cam jumps wide, camT is the destination (the goTo feel) */
function descendGalaxy(g: GalaxyNode): void {
  /* The saved Prime Signature radius gates intergalactic reach. It is not a
     drive/Charter gate, so preserve that distinction in the visible boundary. */
  if (!withinReachOf(primeCount(), g.x, g.y)) {
    camT.z = Math.min(camT.z, (0.55 * minWH() / Math.max(g.size, 8)) * 0.97);
    toastPrimeReachBoundary();
    return;
  }
  const r = enterGalaxy(nav, g);
  if (r.ok) {
    nav = r.state;
    gz0 = 0.42 * minWH() / GR;
    cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
    camT.z = gz0 * 1.05; cam.z = gz0 * 0.35;
    playWhoosh();   /* travel & planetfall breathe (main.js: the shipped sting) */
    rerender();
  }
}
function descendSystem(star: { seed: number; x: number; y: number }): void {
  /* the Ascent gates star dives (main.js 3450): stage 0 = Sol only,
     1 = the Neighborhood ring, 2 = the whole home galaxy, 3 = everywhere.
     LOOKING stays free — only the dive is charted. */
  if (nav.gal && !ascAllowsStar(ascStage(), nav.gal.seed, star)) {
    const starZ = minWH() / 34;
    camT.z = Math.min(camT.z, starZ * 0.97);   /* park BELOW the dive trigger (the game's *0.97 precedent) */
    cam.z = Math.min(cam.z, starZ * 0.97);
    toastCharterBoundary(ascHintFor(ascStage()));
    return;
  }
  const r = enterSystem(nav, star);
  if (r.ok) {
    nav = r.state;
    sz0 = 0.40 * minWH() / SYS_R;
    cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
    camT.z = sz0 * 1.05; cam.z = sz0 * 0.35;
    playWhoosh();
    rerender();
  }
}
/* the biosphere REPLICA (the game's own endorsed pattern, main.js 4338:
   "same rng stream (seed^0x1234567), same draw order — the values are
   identical"). Body verbatim from main.js 2486-2519; only the level→key
   pair is consumed here. */
function biosphereReplica(P: Record<string, unknown>, sys: Record<string, unknown>, band: string, r: () => number): { key: string } {
  if (P.seed === 133) return { key: 'earth' };
  if (sys && (sys as { sol?: boolean }).sol) return { key: 'none' };
  if (P.seed === 134) return { key: 'microbial' };
  let level: string;
  const type = P.type as string;
  if (type === 'terran' && band === 'temperate') level = r() < 0.82 ? 'complex' : 'flora';
  else if (type === 'terran' && band === 'cold') level = r() < 0.55 ? 'sparse' : (r() < 0.7 ? 'flora' : 'microbial');
  else if (type === 'terran' && band === 'hot') level = r() < 0.4 ? 'sparse' : (r() < 0.7 ? 'microbial' : 'none');
  else if (type === 'ocean' && band === 'temperate') level = r() < 0.78 ? 'aquatic' : 'flora';
  else if (type === 'ocean' && band === 'cold') level = r() < 0.55 ? 'aquatic' : 'subsurface';
  else if (type === 'ocean' && band === 'hot') { const v = r(); level = v < 0.01 ? 'xfauna' : (v < 0.35 ? 'microbial' : 'none'); }
  else if (type === 'desert' && band === 'temperate') { const v = r(); level = v < 0.6 ? 'sparse' : (v < 0.615 ? 'xfauna' : 'microbial'); }
  else if (type === 'desert') { const v = r(); level = v < 0.3 ? 'sparse' : (v < 0.315 ? 'xfauna' : 'microbial'); }
  else if (type === 'ice') { const v = r(); level = v < 0.012 ? 'xfauna' : (v < 0.5 ? 'subsurface' : (r() < 0.7 ? 'microbial' : 'none')); }
  else if (type === 'rocky') { const v = r(); level = v < 0.003 ? 'xfauna' : (v < 0.18 ? 'microbial' : 'none'); }
  else if (type === 'venus') { const v = r(); level = v < 0.001 ? 'xfauna' : (v < 0.12 ? 'aerial' : 'none'); }
  else if (type === 'lava') { const v = r(); level = v < 0.0004 ? 'xfauna' : (v < 0.1 ? 'microbial' : 'none'); }
  else if (type === 'gas') { const v = r(); level = v < 0.0025 ? 'xfauna' : (v < 0.14 ? 'aerial' : 'none'); }
  else level = 'none';
  return { key: level };
}
function worldRoster(p: PlanetNode, starSeed: number): Array<Record<string, unknown>> {
  try {
    const sys = systemFor(starSeed) as Record<string, unknown>;
    const P = p.P;
    const r = mulberry32(((P.seed as number) ^ 0x1234567) >>> 0);
    const band = climateBand(P as never, sys as never, p.orb) as string;
    const bio = biosphereReplica(P, sys, band, r);
    let species: Array<Record<string, unknown>> = [];
    if (P.seed === 133) {
      species = planetSpecies(P as never, sys as never, band, 'complex') as never;
      (globalThis as { _earthNamePass?: (s: unknown) => void })._earthNamePass?.(species);
    } else if (bio.key !== 'none') {
      species = planetSpecies(P as never, sys as never, band, bio.key) as never;
    }
    return species.slice(0, 8);
  } catch { return []; }
}

/* THE GAME'S TRUE TWO-STEP (find-earth/land training steps depend on it):
   a tap SURVEYS — the card opens with its ACTION ROW (Land · + Add to Star
   Atlas · ⧉ share code); pressing LAND is its own act. */
function surveyPlanet(p: PlanetNode, starSeed: number): void {
  if (!nav.gal || !nav.star || nav.star.seed !== starSeed) return;
  const sys = systemFor(starSeed);
  const d = planetDescriptor(p.P, sys, { name: p.name, orb: p.orb } as never) as Descriptor;
  const customName = customNames.get('p' + p.seed);
  if (customName) {
    d.title = customName;
    d.sub = (d.sub ? d.sub + ' · ' : '') + 'custom name';
  }
  cardCtx = {
    p,
    gal: { ...nav.gal },
    star: { ...nav.star },
  };
  showSurvey(d, buildCardActions(p));
  playSurveyPing();   /* the ACT of surveying answers back (main.js) */
  gameEvent('survey', { planetSeed: p.seed });
}
function buildCardActions(p: PlanetNode): string {
  const charted = save && save.logMap.some(([id]) => id === 'p' + p.seed);
  const onThisSurface = nav.mode === 'surface' && nav.planet?.seed === p.seed && nav.star?.seed === cardCtx?.star.seed;
  /* A veteran replay already has Earth charted. Keep the real Add action in
     the drill so the atlas-add step cannot spotlight a missing control;
     addToAtlas is idempotent and still emits the training event. */
  const trainingAdd = p.seed === 133 && trainingActive();
  return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px">' +
    (onThisSurface
      ? '<button data-act="leaveworld" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">⬆ Leave world</button>'
      : '<button data-act="landcta" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">⛳ Land</button>') +
    (charted && !trainingAdd
      ? '<span style="color:var(--dim);align-self:center;font-size:12px">★ charted</span>'
      : '<button data-act="add" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">' +
        (charted ? '★ Confirm in Star Atlas' : '+ Add to Star Atlas') + '</button>') +
    '<button data-act="share" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">⧉ share code</button>' +
    '</div>';
}
function surveyAndLand(p: PlanetNode, starSeed: number): void {
  /* the api's one-call path (smoke compatibility): survey, then land */
  surveyPlanet(p, starSeed);
  doLand();
}
function activeCardPlanetWhere(): Record<string, unknown> | null {
  if (!cardCtx || !nav.gal || !nav.star
    || nav.gal.seed !== cardCtx.gal.seed || nav.gal.x !== cardCtx.gal.x || nav.gal.y !== cardCtx.gal.y
    || nav.star.seed !== cardCtx.star.seed || nav.star.x !== cardCtx.star.x || nav.star.y !== cardCtx.star.y) return null;
  const live = systemScene(nav.star.seed).planets.some((planet) => planet.seed === cardCtx!.p.seed);
  if (!live) return null;
  return {
    type: 'planet', gal: { ...cardCtx.gal },
    star: { ...cardCtx.star },
    pseed: cardCtx.p.seed,
  };
}
function cardShareCode(): string | null {
  const where = activeCardPlanetWhere();
  /* A stale planet card must never silently encode the current system. The
     visible card and copied address are one atomic context. */
  return where ? encodeWhere(where as never, customNames.get('p' + cardCtx!.p.seed)) as string : null;
}
async function copyShareCode(code: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(code);
    toast('⧉ Share code copied', 'Paste it into any explorer’s search bar to guide them here.', true);
    return true;
  } catch {
    /* Never claim a copy that the browser denied. Put the exact code in a
       familiar editable surface and select it so keyboard/touch assistive
       copy remains one honest action away. */
    searchEl.value = code;
    searchEl.focus();
    searchEl.select();
    toast('Copy unavailable', 'The share code is selected in Search. Use your browser’s Copy command.', true);
    return false;
  }
}
function doLand(): void {
  if (!cardCtx || !activeCardPlanetWhere()) return;
  const p = cardCtx.p;
  const r = land(nav, { seed: p.seed });
  if (r.ok) {
    nav = r.state;
    const firstLand = !save.landed.includes(p.seed);
    if (firstLand) {
      save.landed.push(p.seed);   /* the game's `land` set */
      /* Credit banks forward only for a genuinely new landing. */
      bankLandfall(save.ascCh, save.ascProg, p.seed);
    }
    /* Reconcile separately from banking: an imported reach-backed chapter may
       already be complete even when this landing adds no new credit. The pure
       helper advances every consecutive canonical completion without making a
       repeated landfall into another reward. */
    const reconciliation = reconcileV2Chapters(save.ascCh, save.ascProg, ascStage());
    if (reconciliation && reconciliation.nextChapter !== save.ascCh) {
      const completed = reconciliation.completed;
      const first = completed[0];
      const last = completed[completed.length - 1];
      save.ascCh = reconciliation.nextChapter;
      toastCharterCompletion(completed.length === 1
        ? '★ ' + (first?.name || 'Charter chapter') + ' — complete'
        : `★ ${completed.length} Charter chapters — complete`,
        completed.length === 1
          ? (first?.note || 'This expedition’s established reach remains preserved.')
          : `${first?.name || 'The first chapter'} through ${last?.name || 'the final chapter'} are now recorded. This expedition’s established reach remains preserved.`);
    }
    /* Panels and Survey deliberately coexist outside Training. If Charters is
       already open, its rendered record must move with the saved ledger. */
    if (openPanelId() === 'ch') fillCharters();
    stSeam.gal = nav.gal; stSeam.star = nav.star;
    playWhoosh();   /* planetfall */
    drawSurface(p); hudText(); void persistView();
    if (lastCard) showSurvey(lastCard, buildCardActions(p));
    /* A repeated landing is not new progression. The one exception is the
       explicit veteran training replay: its lesson waits for the action,
       but still receives no second landfall credit. */
    if (firstLand || (p.seed === 133 && trainingActive() && trainingStepId() === 'land')) {
      gameEvent('landfall', { planetSeed: p.seed });
    }
  }
}
function addToAtlas(): void {
  const where = activeCardPlanetWhere();
  if (!cardCtx || !save || !where) return;
  const p = cardCtx.p;
  const id = 'p' + p.seed;
  if (!save.logMap.some(([k]) => k === id)) {
    const d = card.querySelector('[data-sel=title]')?.textContent || p.name;
    const sub = card.querySelector('[data-sel=sub]')?.textContent || '';
    save.logMap.push([id, { id, title: d, sub, where, t: Date.now() }]);
    void persistView();
    toast('★ Charted', d + ' joined your Star Atlas.');
  }
  gameEvent('atlas-add', { id });
  if (cardCtx) showSurvey(lastCard!, buildCardActions(p));   /* refresh: the button becomes ★ charted */
}
card.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-survey-close]')) {
    hideSurvey(true);
    return;
  }
  const act = (e.target as HTMLElement).closest('[data-act]');
  if (!act) return;
  const keyboard = document.activeElement === act;
  const a = (act as HTMLElement).dataset.act;
  if (a === 'travel') {
    const action = cardTravelAction;
    if (!action || card.style.display === 'none') return;
    cardTravelAction = null;
    (act as HTMLButtonElement).disabled = true;
    action.run();
    if (keyboard) app.canvas.focus();
  } else if (a === 'landcta') {
    doLand();
    if (keyboard) card.querySelector<HTMLElement>('[data-act="leaveworld"]')?.focus();
  }
  else if (a === 'leaveworld') {
    if (nav.mode !== 'surface' || nav.planet?.seed !== cardCtx?.p.seed || !activeCardPlanetWhere()) return;
    hideSurvey();
    goUp();
    if (keyboard) app.canvas.focus();
  }
  else if (a === 'add') {
    addToAtlas();
    if (keyboard) (card.querySelector<HTMLElement>('[data-act="add"]') || surveyDockEl).focus();
  }
  else if (a === 'share') {
    const code = cardShareCode();
    if (code) void copyShareCode(code);
  }
});
const sideEl = document.createElement('div');
sideEl.id = 'planetside';
sideEl.className = 'glass';
sideEl.style.cssText = 'position:fixed;left:calc(var(--safe-left,0px) + 12px);bottom:calc(var(--safe-bottom,0px) + var(--dock-h) + var(--ctx-h) + 86px);' +
  'max-width:min(560px,calc(100vw - var(--safe-left,0px) - var(--safe-right,0px) - 24px));box-sizing:border-box;display:none;z-index:21;border-radius:12px;padding:8px 10px;' +
  'overflow-x:auto;white-space:nowrap;scrollbar-width:thin';
document.body.appendChild(sideEl);
function syncPlanetsideLayout(): void {
  if (getComputedStyle(sideEl).display === 'none' || nav.mode !== 'surface') {
    document.documentElement.style.removeProperty('--planetside-top');
    syncSurfaceChromeBottom();
    return;
  }
  const r = sideEl.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) document.documentElement.style.setProperty('--planetside-top', r.top.toFixed(2) + 'px');
  syncSurfaceChromeBottom();
}
new ResizeObserver(syncPlanetsideLayout).observe(sideEl);
addEventListener('resize', syncPlanetsideLayout, { passive: true });
function fillPlanetside(p: PlanetNode, starSeed: number): void {
  /* THE LIVING PLANETSIDE: the world's REAL roster (planetSpecies through
     the biosphere replica), each wearing its hdart portrait — the strip is
     Phase 4 chrome; the full walkable vista is Phase 6's. */
  const roster = worldRoster(p, starSeed);
  if (!roster.length) {
    sideEl.style.display = 'none';
    syncPlanetsideLayout();
    return;
  }
  if (!SA && nav.star) {
    const p0 = p, s0 = starSeed;
    ensureSA('planetside', () => {
      if (nav.mode === 'surface' && nav.planet?.seed === p0.seed && nav.star?.seed === s0) fillPlanetside(p0, s0);
    });
  }
  sideEl.innerHTML = '<div style="font-size:10.5px;letter-spacing:0.06em;color:var(--dim);margin:0 0 6px">PLANETSIDE — the ground survey</div>' +
    roster.map((g) => {
      let th = '';
      if (SA) { try { th = SA.speciesThumb(g as never); } catch { /* text chip still reads */ } }
      let nm = String((g as { _earthName?: string })._earthName || '');
      if (!nm) { try { nm = String((describeSpecies(g as never) as { name?: string }).name || ''); } catch { nm = 'specimen'; } }
      return '<span data-sel="planetside-sp" style="display:inline-block;text-align:center;margin-right:8px;vertical-align:top">' +
        (th ? '<img src="' + th + '" alt="" style="width:64px;height:64px;border-radius:10px;border:1px solid #22304a;background:#0b1220">' : '') +
        '<div style="font-size:10px;color:#b7c8e4;max-width:72px;overflow:hidden;text-overflow:ellipsis">' + esc(nm) + '</div></span>';
    }).join('');
  sideEl.style.display = 'block';
  syncPlanetsideLayout();
}
function drawSurface(p: PlanetNode): void {
  /* surface mode, slice edition: the world fills the view as its painterly
     surface (full biome scenes are Phase 6); the survey card carries the
     roster — every species row is real Ecology output.
     FIT the globe to the viewport (phone catch: at z=1 the 420px master
     overfilled a 390px screen as blur; the globe should present itself) */
  document.body.classList.add('surface-mode');
  clearWorld();
  const R = 210;
  const fitZ = Math.min(1, (minWH() * 0.78) / (R * 2));
  const spr = new Sprite(Texture.from(getPlanetSprite(p.P, 1024)));
  spr.anchor.set(0.5);
  spr.width = R * 2; spr.height = R * 2;
  world.addChild(spr);
  if ((p.P.type === 'terran' || p.P.type === 'ocean') && motionOK()) {
    /* the drifting upper cloud deck (main.js 5256) — twin sprites wrap so
       the sliding edge never shows; drift rate scaled to the slice's fixed
       globe (the Renderer's rate is tuned to its 6px world masters) */
    const tex = Texture.from(_cloudSpr(p.P));
    const wrap = new Container();
    wrap.eventMode = 'none';
    const mk = (): Sprite => {
      const s = new Sprite(tex);
      s.anchor.set(0, 0.5);
      s.width = R * 2; s.height = R * 2;
      s.alpha = 0.45;
      wrap.addChild(s);
      return s;
    };
    const a = mk(), b = mk();
    const mask = new Graphics().circle(0, 0, R).fill(0xffffff);
    wrap.addChild(mask);
    wrap.mask = mask;
    world.addChild(wrap);
    surfClouds = { a, b, w: R * 2 };
  }
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = fitZ; cam.z = fitZ * 0.8;
  if (nav.star) fillPlanetside(p, nav.star.seed);
}
function goUp(): void {
  const wasGal = nav.gal, wasStar = nav.star;
  const r = ascend(nav);
  if (!r.ok) return;
  nav = r.state;
  playWhoosh();
  /* ascent camera: the game re-centers the outer view on what you left
     (main.js 3404/3474) — universe at the galaxy, galaxy at the star */
  if (nav.mode === 'universe' && wasGal) {
    cam.x = wasGal.x; cam.y = wasGal.y; camT.x = wasGal.x; camT.y = wasGal.y;
    camT.z = (0.55 * minWH() / (wasGal.size || 40)) * 0.8; cam.z = camT.z * 1.6;
  } else if (nav.mode === 'galaxy' && wasStar) {
    cam.x = wasStar.x; cam.y = wasStar.y; camT.x = wasStar.x; camT.y = wasStar.y;
    camT.z = (minWH() / 34) * 0.8; cam.z = camT.z * 1.4;
  } else if (nav.mode === 'system') {
    cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
    camT.z = sz0 * 1.05; cam.z = camT.z * 0.8;
  }
  rerender();
}

/* the game's ZOOM-DRIVEN transitions (checkTransitions, main.js 3380):
   dive by zooming into a thing, rise by zooming out past the mode floor.
   Wormhole travel + charter/Ascent gating: Phase 4+ (recorded). */
function checkTransitions(): void {
  /* transitions read camT — the INTENT — not the eased cam: a descent's
     ease-in starts below the ascend floor and would bounce straight back */
  const mw = minWH();
  if (nav.mode === 'universe') {
    let best: GalaxyNode | null = null, bd = 1e9;
    for (const g of uniNodes) {
      const d = Math.hypot(g.x - camT.x, g.y - camT.y);
      if (d < bd) { bd = d; best = g; }
    }
    if (best && best.size * camT.z > 0.55 * mw && bd * camT.z < 0.4 * mw) descendGalaxy(best);
  } else if (nav.mode === 'galaxy' && nav.gal) {
    if (camT.z < gz0 * 0.62) { goUp(); return; }
    /* flying into the wormhole hurls you somewhere unimaginably distant —
       destination seeded from the galaxy, identical for every explorer
       (main.js 3415; the charter reach clamp lands with progression) */
    if (wormPos && camT.z > mw / 60 && Math.hypot(wormPos.x - camT.x, wormPos.y - camT.y) * camT.z < 120) {
      const wj = mulberry32((nav.gal.seed ^ 0xC0FFEE) >>> 0);
      const a2 = wj() * TAU, d2 = OBS_R * (2 + wj() * 10);
      const r = ascend(nav);
      if (r.ok) {
        nav = r.state;
        /* the verbatim destination WITH the game's reach clamp (main.js 3424):
           the far mouth is a VIEW of far skies — their stars stay drive-gated */
        let wx = Math.cos(a2) * d2, wy = Math.sin(a2) * d2;
        const rr = reachRadiusOf(primeCount()) * 0.85, dh = Math.hypot(wx - HOME_POS.x, wy - HOME_POS.y);
        if (dh > rr) { wx = HOME_POS.x + (wx - HOME_POS.x) / dh * rr; wy = HOME_POS.y + (wy - HOME_POS.y) / dh * rr; }
        cam.x = camT.x = wx; cam.y = camT.y = wy;
        camT.z = 1.1; cam.z = 0.3;
        playWhoosh();
        rerender();
      }
      return;
    }
    const starZ = mw / 34;
    if (camT.z > starZ) {
      const prof = galaxyProfile(nav.gal.seed) as Record<string, unknown>;
      const ccx = Math.floor(camT.x / GCELL), ccy = Math.floor(camT.y / GCELL);
      let best: { seed: number; x: number; y: number } | null = null, bd = 1e9;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const s of galaxyCell(nav.gal.seed, prof, ccx + dx, ccy + dy).stars) {
          const d = Math.hypot(s.x - camT.x, s.y - camT.y);
          if (d < bd) { bd = d; best = s; }
        }
      }
      const fcx = Math.floor(camT.x / FCELL), fcy = Math.floor(camT.y / FCELL);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const s2 of fineStarsInCell(nav.gal.seed, prof, fcx + dx, fcy + dy) as Array<{ seed: number; x: number; y: number }>) {
          const d2 = Math.hypot(s2.x - camT.x, s2.y - camT.y);
          if (d2 < bd) { bd = d2; best = s2; }
        }
      }
      if (best && bd * camT.z < 130) descendSystem(best);
      else { cam.z = Math.min(cam.z, starZ * 1.6); camT.z = Math.min(camT.z, starZ * 1.6); }
    }
  } else if (nav.mode === 'system') {
    if (camT.z < sz0 * 0.62) goUp();
  }
}
function zoomLimits(): [number, number] {
  /* main.js 3096 — per-mode bounds */
  const mw = minWH();
  if (nav.mode === 'universe') return [0.0024, 40];
  if (nav.mode === 'galaxy') return [gz0 * 0.5, mw / 2.5];
  if (nav.mode === 'system') return [sz0 * 0.5, mw / 3];
  /* the game's 6× cap assumes real ground tiles; the slice surface is a
     420px painterly globe — cap where IT stays crisp (found by the phone
     leg's pinch: at 6× the master smears). Phase 6's vista retunes this. */
  return [0.45, Math.max(0.9, (mw / 420) * 1.6)];
}

/* ---- keyboard exploration — the canvas is a named, focusable region.
   Arrow keys cycle the same rendered bodies that pointer handlers own;
   Enter opens the same survey card/action and +/- zoom around that target. */
interface KeyboardWorldTarget {
  key: string;
  label: string;
  priority: number;
  screen: () => { x: number; y: number };
  world: { x: number; y: number };
  activate: () => void;
}
let keyboardTargetKey: string | null = null;
let keyboardRing: HTMLElement | null = null;
let keyboardLive: HTMLElement | null = null;
let pointerFocusingCanvas = false;
function currentKeyboardTargets(): KeyboardWorldTarget[] {
  const targets: KeyboardWorldTarget[] = [];
  if (nav.mode === 'universe') {
    for (const galaxy of uniNodes) targets.push({
      key: `galaxy:${galaxy.seed}:${galaxy.x}:${galaxy.y}`,
      label: galaxy.home ? 'Milky Way — you are here' : galaxyName(galaxy.seed),
      priority: galaxy.home ? 0 : 1,
      world: { x: galaxy.x, y: galaxy.y },
      screen: () => world.toGlobal({ x: galaxy.x, y: galaxy.y }),
      activate: () => surveyCard(
        describePick({ kind: galaxy.quasar ? 'quasar' : galaxy.radio ? 'radio' : 'galaxy', data: galaxy } as never),
        { label: 'Enter galaxy', run: () => descendGalaxy(galaxy) },
      ),
    });
  } else if (nav.mode === 'galaxy') {
    const seen = new Set<string>();
    for (const [tier, entries] of [[1, galStars], [2, fineStarTargets]] as const) for (const entry of entries) {
      const star = entry.star;
      const key = `star:${star.seed}:${star.x}:${star.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      targets.push({
        key,
        label: star.seed === SOL_SEED ? 'Sun — our star' : starName(star.seed),
        priority: star.seed === SOL_SEED ? 0 : tier,
        world: { x: star.x, y: star.y },
        screen: () => world.toGlobal({ x: star.x, y: star.y }),
        activate: () => surveyCard(describePick({ kind: 'star', data: star } as never), {
          label: 'Enter system', run: () => descendSystem(star),
        }),
      });
    }
  } else if (nav.mode === 'system' && nav.star) {
    for (const target of planetTargets) targets.push({
      key: `planet:${nav.star.seed}:${target.planet.seed}`,
      label: target.planet.name,
      priority: target.planet.seed === 133 ? 0 : 1,
      world: { x: target.holder.position.x, y: target.holder.position.y },
      screen: () => target.holder.getGlobalPosition(),
      activate: () => surveyPlanet(target.planet, nav.star!.seed),
    });
  }
  const visible = targets.filter((target) => {
    const point = target.screen();
    return point.x >= 12 && point.y >= 12 && point.x <= innerWidth - 12 && point.y <= innerHeight - 12;
  });
  return (visible.length ? visible : targets).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ap = a.screen(), bp = b.screen();
    return ap.y - bp.y || ap.x - bp.x || a.key.localeCompare(b.key);
  });
}
function announceKeyboardTarget(target: KeyboardWorldTarget | null): void {
  if (!keyboardLive) return;
  keyboardLive.textContent = target
    ? `${target.label}. Press Enter to survey; plus or minus to zoom.`
    : 'World target released.';
}
function selectKeyboardTarget(step: number): void {
  const targets = currentKeyboardTargets();
  if (!targets.length) { keyboardTargetKey = null; announceKeyboardTarget(null); return; }
  const current = targets.findIndex((target) => target.key === keyboardTargetKey);
  const next = current < 0 ? (step < 0 ? targets.length - 1 : 0) : (current + step + targets.length) % targets.length;
  keyboardTargetKey = targets[next]!.key;
  announceKeyboardTarget(targets[next]!);
  renderKeyboardTarget();
}
function renderKeyboardTarget(): void {
  if (!keyboardRing || document.activeElement !== app.canvas || !keyboardTargetKey) {
    if (keyboardRing) keyboardRing.style.display = 'none';
    return;
  }
  const target = currentKeyboardTargets().find((candidate) => candidate.key === keyboardTargetKey);
  if (!target) { keyboardTargetKey = null; keyboardRing.style.display = 'none'; return; }
  const point = target.screen();
  keyboardRing.style.display = 'block';
  keyboardRing.style.left = point.x + 'px';
  keyboardRing.style.top = point.y + 'px';
  keyboardRing.querySelector('span')!.textContent = target.label;
}
function installKeyboardExploration(): void {
  app.canvas.tabIndex = 0;
  app.canvas.setAttribute('role', 'region');
  app.canvas.setAttribute('aria-label', 'Explore the generated universe');
  app.canvas.setAttribute('aria-describedby', 'cosmoshelp');
  const help = document.createElement('p');
  help.id = 'cosmoshelp'; help.className = 'sr-only';
  help.textContent = 'Arrow keys cycle visible galaxies, stars, or worlds. Enter surveys. Plus and minus zoom. Escape releases the target.';
  keyboardLive = document.createElement('div');
  keyboardLive.id = 'cosmoslive'; keyboardLive.className = 'sr-only';
  keyboardLive.setAttribute('aria-live', 'polite'); keyboardLive.setAttribute('aria-atomic', 'true');
  keyboardRing = document.createElement('div');
  keyboardRing.id = 'cosmosfocus'; keyboardRing.setAttribute('aria-hidden', 'true');
  keyboardRing.innerHTML = '<span></span>';
  document.body.append(help, keyboardLive, keyboardRing);
  app.canvas.addEventListener('pointerdown', () => {
    /* A pointer click focuses a canvas too, but must not secretly arm a
       keyboard target that consumes the player's next Escape. */
    pointerFocusingCanvas = true;
    keyboardTargetKey = null;
    renderKeyboardTarget();
    /* Browser focus is a later default action in the pointer/mouse sequence;
       a microtask can clear this flag before that action runs. */
    setTimeout(() => { pointerFocusingCanvas = false; }, 0);
  }, { capture: true });
  app.canvas.addEventListener('focus', () => {
    if (pointerFocusingCanvas) { pointerFocusingCanvas = false; renderKeyboardTarget(); return; }
    if (!keyboardTargetKey) selectKeyboardTarget(1); else renderKeyboardTarget();
  });
  app.canvas.addEventListener('blur', renderKeyboardTarget);
  app.canvas.addEventListener('keydown', (event) => {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      selectKeyboardTarget(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    const target = currentKeyboardTargets().find((candidate) => candidate.key === keyboardTargetKey);
    if ((event.key === 'Enter' || event.key === ' ') && target) {
      event.preventDefault(); event.stopPropagation(); target.activate(); keyboardTargetKey = null; renderKeyboardTarget();
      /* The keyboard survey outcome lands on the card's primary action, not
         the header Close control. The Close remains the safe fallback for a
         read-only descriptor with no deeper action. */
      (card.querySelector<HTMLElement>('[data-act="travel"]')
        || card.querySelector<HTMLElement>('[data-act="landcta"]')
        || card.querySelector<HTMLElement>('[data-act="leaveworld"]')
        || card.querySelector<HTMLElement>('[data-survey-close]'))?.focus();
      return;
    }
    if ((event.key === '+' || event.key === '=' || event.key === '-' || event.key === '_') && target) {
      event.preventDefault(); event.stopPropagation();
      const [lo, hi] = zoomLimits();
      camT.x = target.world.x; camT.y = target.world.y;
      camT.z = Math.min(hi, Math.max(lo, camT.z * (event.key === '-' || event.key === '_' ? 0.82 : 1.22)));
      return;
    }
    if (event.key === 'Escape' && keyboardTargetKey) {
      event.preventDefault(); event.stopPropagation(); keyboardTargetKey = null; announceKeyboardTarget(null); renderKeyboardTarget();
    }
  });
}

/* ---- the save/reload leg — THE REAL PIPELINE ---- */
async function persistView(replacementOwner: ReplacementTransaction | null = null): Promise<boolean> {
  if (persistHold || importWriteInFlight || replacementReloadPending
    || (replacementTransaction && replacementTransaction !== replacementOwner)) return false;
  const write = async (): Promise<boolean> => { try {
    save.savedView = navToView(nav);
    save.EPOCH_BASE = epochClock.current();   /* play time accumulates across sessions (doSave writes COSMIC_EPOCH) */
    if (smokeRejectNextPersist) {
      /* Browser evidence needs a deterministic storage-rejection outcome;
         this diagnostics-only latch enters the same rollback branch as an
         IndexedDB failure without changing ordinary repository behavior. */
      smokeRejectNextPersist = false;
      throw new Error('slice-smoke injected persistence rejection');
    }
    await repo.write(exportSaveV2(save, Date.now()));
    return true;
  } catch { return false; /* private mode: session continues unsaved */ } };
  const prior = activePersist;
  const run = prior ? prior.catch(() => false).then(write) : write();
  activePersist = run;
  try { return await run; }
  finally { if (activePersist === run) activePersist = null; }
}
let _persistT = 0;
let importWriteInFlight = false;
let activePersist: Promise<boolean> | null = null;
let smokeRejectNextPersist = false;
let smokeImportRaceRelease: (() => void) | null = null;
function smokeArmImportRace(staleRaw: string): boolean {
  /* Diagnostics-only ordering witness. The armed active persist writes its
     stale snapshot only after release. A valid import started before that
     release must await this write, then replace it. Removing importBlob's
     await reverses the two real repository transactions and stale wins. */
  if (activePersist || importWriteInFlight || smokeImportRaceRelease) return false;
  let releaseGate: (() => void) | null = null;
  const gate = new Promise<void>((resolve) => { releaseGate = resolve; });
  const run = gate.then(async () => { await repo.write(staleRaw); return true; });
  activePersist = run;
  smokeImportRaceRelease = () => {
    const release = releaseGate;
    smokeImportRaceRelease = null;
    release?.();
  };
  void run.then(
    () => { if (activePersist === run) activePersist = null; },
    () => { if (activePersist === run) activePersist = null; },
  );
  return true;
}
function smokeReleaseImportRace(): boolean {
  const release = smokeImportRaceRelease;
  if (!release) return false;
  release();
  return true;
}
function persistSoon(): void {
  /* slider-friendly: one export per drag, not one per input event (audit #5) */
  if (replacementReloadPending) return;
  clearTimeout(_persistT);
  _persistT = window.setTimeout(() => { void persistView(); }, 400);
}
let persistHold: false | 'transient-read' | 'protected-payload' = false;
let persistRetrying = false;
function isLegacySliceEnvelope(value: unknown): boolean {
  /* e960e21–the full-save wiring stored this exact two-field envelope in
     cf-v2-slice. Keep that one real compatibility bridge without turning
     sparse objects back into whole-save evidence. Both copies of the route
     must agree, and every identity needed by its mode must be finite. */
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).sort().join('|') !== 'nav|view') return false;
  if (!data.nav || typeof data.nav !== 'object' || Array.isArray(data.nav)) return false;
  const rawNav = data.nav as Record<string, unknown>;
  if (Object.keys(rawNav).sort().join('|') !== 'gal|mode|planet|star') return false;
  const mode = rawNav.mode;
  if (!['universe', 'galaxy', 'system', 'surface'].includes(String(mode))) return false;
  if (mode === 'universe') {
    return data.view === null && rawNav.gal === null && rawNav.star === null && rawNav.planet === null;
  }
  const cleanView = _sanitizeView(data.view);
  if (!cleanView) return false;
  const fromView = viewToNav(cleanView);
  if (fromView.mode !== mode) return false;
  const sameRef = (raw: unknown, clean: { seed: number; x?: number; y?: number } | null, xy: boolean): boolean => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !clean) return false;
    const ref = raw as Record<string, unknown>;
    if (!Number.isFinite(ref.seed) || Number(ref.seed) !== clean.seed) return false;
    return !xy || (Number.isFinite(ref.x) && Number.isFinite(ref.y)
      && Number(ref.x) === clean.x && Number(ref.y) === clean.y);
  };
  if (!sameRef(rawNav.gal, fromView.gal, true)) return false;
  if (mode === 'galaxy') return rawNav.star === null && rawNav.planet === null;
  if (!sameRef(rawNav.star, fromView.star, true)) return false;
  if (mode === 'system') return rawNav.planet === null;
  return sameRef(rawNav.planet, fromView.planet, false);
}
function importStoredPayload(payload: string | null): ReturnType<typeof importSaveV2> {
  const result = importSaveV2(payload, REGISTRY, Date.now());
  if (!result.ok || payload === null) return result;
  try {
    const parsed = JSON.parse(payload) as unknown;
    return (isPlausibleSaveEnvelope(parsed) || isLegacySliceEnvelope(parsed))
      ? result : { ok: false, reason: 'invalid' };
  } catch { return { ok: false, reason: 'invalid' }; }
}
function storedPayloadStatus(payload: string): StoredPayloadStatus {
  const result = importStoredPayload(payload);
  return result.ok ? 'supported' : result.reason;
}
async function loadSave(): Promise<void> {
  /* THE RECOVERY CONTRACT, finally wired (audit finding #1 — the CF-RR-002
     path was built and tested in the repository but never called):
     primary unreadable/corrupt → recover() restores the backup ONCE; a
     payload that PROVES it loads is promoted to last-known-good, exactly
     the v1.8.9 loadSave semantic. A read that THREW (infra, not absence)
     holds all persists until a user action, so the boot's own write can
     never destroy the evidence. */
  /* A sparse but syntactically valid truncation (`{}` / `{view:null}`)
     hardens into defaults inside the legacy importer. That is useful for
     constructing a fresh in-memory state, but it is NOT proof that a stored
     payload is safe to promote over the last-known-good backup. */
  const bootRead = await readSaveWithRecovery(repo, storedPayloadStatus);
  const imp = bootRead.kind === 'loaded'
    ? importStoredPayload(bootRead.raw)
    : { ok: false as const, reason: bootRead.kind === 'protected' ? bootRead.reason : 'invalid' as const };
  if (bootRead.kind === 'loaded') {
    try { await repo.promoteLastKnownGood(bootRead.raw); } catch { /* keepsake only */ }
  }
  /* A future save is valid evidence from a newer build, not corruption. Do
     not replace it with a backup or let this older app write defaults over
     it; the explicit import path remains available after updating. */
  persistHold = bootRead.kind === 'transient-read' ? 'transient-read'
    : bootRead.kind === 'protected' ? 'protected-payload' : false;
  const protectedReason = bootRead.kind === 'protected' ? bootRead.reason : null;
  save = imp.ok ? imp.state
    : (importSaveV2('{}', REGISTRY, Date.now()) as { ok: true; state: SaveStateV2 }).state;   /* fresh expedition */
  customNames.clear();
  for (const [key, name] of save.customNames) customNames.set(key, name);
  /* the sanitized view → nav; viewToNav degrades toward home, so a
     hand-edited/corrupt view can never render an empty stage */
  nav = viewToNav(save.savedView);
  if (nav.mode === 'galaxy') { camT.z = gz0 * 1.05; cam.z = camT.z; }
  else if (nav.mode === 'system') { camT.z = sz0 * 1.05; cam.z = camT.z; }
  /* a truly EMPTY store is a NEW EXPEDITION — training runs, exactly like
     the game's new-run init (the absent-⇒-done default protects HELD saves,
     not fresh ones) */
  if (bootRead.kind === 'fresh') save.tutDone = false;
  playT0 = performance.now();
  epochClock = createEpochClock(save.EPOCH_BASE, playSeconds);
  (globalThis as Record<string, unknown>).COSMIC_EPOCH = epochClock.current();
  initAudio({ sndOn: () => save.sndOn, sfxVol: () => save.sfxVol });   /* the save's own audio settings */
  /* dock + chrome mirror the save from the first frame */
  chartsDockEl.classList.toggle('on', save.chartsOn);
  chartsDockEl.setAttribute('aria-pressed', String(save.chartsOn));
  applyDisplayPreferences();
  syncTopbarH();
  syncDockH();
  syncCtxH();
  const warmSpeciesArt = (): void => {
    if (!document.hidden) ensureSA('prefetch', () => { /* warm before first use */ });
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(warmSpeciesArt, { timeout: 5000 });
  else setTimeout(warmSpeciesArt, 3000);
  if (persistHold === 'protected-payload') {
    setTimeout(() => toast(
      protectedReason === 'future-version' ? 'Update required' : 'Save protected',
      protectedReason === 'future-version'
        ? 'This expedition was written by a newer build. It will not be changed here.'
        : 'The stored expedition is incomplete and no proven backup loaded. It will not be overwritten.',
      true,
    ), 0);
  }
  initTraining({
    explorerName: () => save.explorerName,
    isDone: () => save.tutDone,
    setDone: (v) => {
      save.tutDone = v;
      if (v && save.tutSnapPending && typeof save.tutSnapPending === 'object'
        && 'view' in save.tutSnapPending) {
        const restored = _sanitizeView((save.tutSnapPending as { view: unknown }).view);
        nav = viewToNav(restored);
        save.savedView = restored;
        save.tutSnapPending = null;
        rerender();
      }
      /* Training schedules its own post-finish focus restoration at 0ms.
         Open a queued bulletin on the next turn so the bulletin's Back
         control remains the final, visible keyboard focus target. */
      if (v) setTimeout(flushPendingReleaseBulletin, 20);
    },
    persist: () => { void persistView(); },
    closePanels,
  });
}

/* ---- boot ---- */
(async () => {
  /* autoDensity keeps the DPR-scaled backing store at CSS viewport size.
     Without it a DPR-2 phone displayed a 780px canvas inside 390 CSS px,
     halving Pixi hit coordinates and moving the home galaxy offscreen.
     Hold the ticker until persistence, scene publication, and every input
     listener are wired: at 8K, even one premature full-canvas render can
     starve the async boot work that makes the document answerable. */
  emitBootPhase('app-init-start');
  await app.init({
    background: 0x05070d,
    width: densityPlan.viewportWidth, height: densityPlan.viewportHeight,
    antialias: true,
    resolution: DPR, autoDensity: true, autoStart: false,
  });
  emitBootPhase('app-init-complete');
  document.body.appendChild(app.canvas);
  installKeyboardExploration();
  /* THE BACKDROP (drawBackdrop, main.js 3560 — verbatim recipe): the seeded
     900-star field under a deep radial wash, rebuilt per viewport, screen-
     space behind the world. The flat black is gone at every mode. */
  const bgSpr = new Sprite();
  bgSpr.eventMode = 'none';
  app.stage.addChild(bgSpr);
  const bgStars: Array<{ x: number; y: number; s: number; o: number }> = [];
  { const r = mulberry32(5); for (let i = 0; i < 900; i++) bgStars.push({ x: r(), y: r(), s: r() * 1.1 + 0.2, o: r() * 0.5 + 0.15 }); }
  let _bgKey = '';
  let activeBackdropCanvas: HTMLCanvasElement | null = null;
  let backdropGeneration = 0;
  let backdropTransitionPeakPixels = 0;
  let backdropTransitionBudgetPixels = densityPlan.backingPixelCapPerCanvas * 2;
  const ownedBackdropPixels = (): number => app.canvas.width * app.canvas.height
    + (activeBackdropCanvas?.width ?? 0) * (activeBackdropCanvas?.height ?? 0);
  const releaseBackdrop = (): void => {
    const old = bgSpr.texture;
    const priorCanvas = activeBackdropCanvas;
    bgSpr.texture = Texture.EMPTY;
    activeBackdropCanvas = null;
    if (old && old !== Texture.EMPTY) old.destroy(true);
    if (priorCanvas) {
      priorCanvas.width = 1;
      priorCanvas.height = 1;
    }
  };
  const applyRendererDensity = (plan: RendererDensityPlan): void => {
    /* Own viewport resizing instead of Pixi's ResizePlugin. Two same-aspect
       ultra viewports can resolve to the same integer backing dimensions;
       CanvasSource then (correctly) reports "not resized" and skips its CSS
       and Texture.frame refresh even though the logical viewport changed.
       The backing store may stay put, but CSS, texture metadata and the
       screen/hit-test rectangle must still follow the exact CSS viewport. */
    app.renderer.resize(plan.viewportWidth, plan.viewportHeight, plan.dpr);
    app.renderer.view.texture.update();
    app.canvas.style.width = `${plan.viewportWidth}px`;
    app.canvas.style.height = `${plan.viewportHeight}px`;
    app.screen.width = plan.viewportWidth;
    app.screen.height = plan.viewportHeight;
  };
  const rebuildBackdrop = (): void => {
    const W = app.screen.width, H = app.screen.height;
    const k = W + '|' + H + '|' + DPR.toFixed(4);
    if (k === _bgKey || W < 2) return;
    _bgKey = k;
    /* Release the old full-viewport store before allocating its replacement.
       App + old backdrop + new backdrop would otherwise create a transient
       three-store peak even though the settled twin stores satisfy the
       selected aggregate budget. This all happens in one JS task, so the
       stage cannot render between detaching the old texture and installing
       the new one. */
    releaseBackdrop();
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(W * DPR)); cv.height = Math.max(1, Math.round(H * DPR));
    /* Include any still-owned prior backdrop in the observed allocation
       peak. The expected value is app+new because releaseBackdrop ran first;
       moving allocation above release would make this exact witness red. */
    backdropTransitionPeakPixels = Math.max(
      backdropTransitionPeakPixels,
      ownedBackdropPixels() + cv.width * cv.height,
    );
    const g = cv.getContext('2d')!; g.scale(DPR, DPR);
    const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#0a0a1e'); bg.addColorStop(0.6, '#05050f'); bg.addColorStop(1, '#020208');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#aab4e0';
    for (const s of bgStars) { g.globalAlpha = s.o * 0.5; g.fillRect(s.x * W, s.y * H, s.s, s.s); }
    g.globalAlpha = 1;
    bgSpr.texture = Texture.from(cv);
    activeBackdropCanvas = cv;
    bgSpr.width = W; bgSpr.height = H;
    backdropGeneration++;
  };
  /* app.init is asynchronous. Re-read the viewport before allocating the
     first backing stores so a resize during renderer negotiation cannot
     leave the app on the stale pre-init density plan. */
  densityPlan = effectiveDensityPlan();
  DPR = densityPlan.dpr;
  applyRendererDensity(densityPlan);
  backdropTransitionPeakPixels = app.canvas.width * app.canvas.height;
  backdropTransitionBudgetPixels = densityPlan.backingPixelCapPerCanvas * 2;
  rebuildBackdrop();
  emitBootPhase('backdrop-complete');
  const syncRendererDensity = (): void => {
    const nextDensityPlan = effectiveDensityPlan();
    const next = nextDensityPlan.dpr;
    const densityChanged = next !== DPR
      || nextDensityPlan.backingPixelCapPerCanvas !== densityPlan.backingPixelCapPerCanvas
      || nextDensityPlan.viewportWidth !== densityPlan.viewportWidth
      || nextDensityPlan.viewportHeight !== densityPlan.viewportHeight;
    if (densityChanged) {
      const priorBudget = densityPlan.backingPixelCapPerCanvas * 2;
      backdropTransitionPeakPixels = ownedBackdropPixels();
      backdropTransitionBudgetPixels = Math.max(
        priorBudget, nextDensityPlan.backingPixelCapPerCanvas * 2,
      );
      /* Drop the old full-viewport backdrop before resizing the renderer.
         Across the ordinary/ultra threshold, resizing first would briefly
         combine a new-tier app canvas with the larger old-tier backdrop and
         exceed the newly selected simultaneous-owner budget. */
      releaseBackdrop();
      densityPlan = nextDensityPlan;
      DPR = next;
      applyRendererDensity(densityPlan);
      _bgKey = '';
      /* Texture-backed scene art was baked for the prior scale tier. Rebuild
         the current mode so a monitor/DPR transition upgrades the scene, not
         only the Pixi backing store and backdrop. */
      rerender({ preserveSurvey: true });
      /* Change both simultaneous full-viewport stores in one transaction.
         A deferred backdrop rebuild briefly retained the ordinary-tier
         canvas after the app had already advertised the ultra-tier cap. */
      rebuildBackdrop();
    } else {
      densityPlan = nextDensityPlan;
    }
  };
  addEventListener('resize', syncRendererDensity);
  visualViewport?.addEventListener('resize', syncRendererDensity);
  releaseRendererForReload = (reason): ReloadReleaseWitness => {
    const view = app.canvas;
    const backdrop = activeBackdropCanvas;
    const before = (canvas: HTMLCanvasElement | null): ReloadCanvasRelease => ({
      beforeWidth: canvas?.width ?? 0,
      beforeHeight: canvas?.height ?? 0,
      afterWidth: canvas?.width ?? 0,
      afterHeight: canvas?.height ?? 0,
    });
    const appCanvas = before(view);
    const backdropCanvas = before(backdrop);
    let error: string | null = null;
    removeEventListener('resize', syncRendererDensity);
    visualViewport?.removeEventListener('resize', syncRendererDensity);
    try {
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      );
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
    /* Destroying the renderer/context owns GPU cleanup. Shrinking both
       captured canvases makes the CPU-side backing release an observable
       synchronous postcondition instead of a hope that GC runs before boot. */
    try { view.width = 1; view.height = 1; }
    catch (caught) { error ??= caught instanceof Error ? caught.message : String(caught); }
    if (backdrop) {
      try { backdrop.width = 1; backdrop.height = 1; }
      catch (caught) { error ??= caught instanceof Error ? caught.message : String(caught); }
    }
    appCanvas.afterWidth = view.width;
    appCanvas.afterHeight = view.height;
    backdropCanvas.afterWidth = backdrop?.width ?? 0;
    backdropCanvas.afterHeight = backdrop?.height ?? 0;
    activeBackdropCanvas = null;
    const releasedApp = app as unknown as { renderer: unknown; stage: unknown };
    const rendererReleased = releasedApp.renderer == null;
    const stageReleased = releasedApp.stage == null;
    const viewDetached = !view.isConnected;
    const complete = !error && rendererReleased && stageReleased && viewDetached
      && appCanvas.beforeWidth > 1 && appCanvas.beforeHeight > 1
      && backdropCanvas.beforeWidth > 1 && backdropCanvas.beforeHeight > 1
      && appCanvas.afterWidth <= 1 && appCanvas.afterHeight <= 1
      && backdropCanvas.afterWidth <= 1 && backdropCanvas.afterHeight <= 1;
    if (!complete && !error) error = 'Pixi/canvas release postcondition failed';
    return {
      schema: 'cf-v2-reload-release/v1', status: complete ? 'released' : 'release-failed',
      error, reason, documentToken: DOCUMENT_TOKEN,
      rendererReleased, stageReleased, viewDetached, appCanvas, backdropCanvas,
    };
  };
  app.stage.addChild(world);
  /* Publish the browser-audit surface only after persistence has produced a
     complete SaveStateV2 and the first scene is rendered. Publishing it
     before this await let a slower CI browser call state() while `save` was
     still unassigned, turning a readiness race into a misleading app fault. */
  emitBootPhase('save-load-start');
  await loadSave();
  emitBootPhase('save-load-complete');
  rerender();
  emitBootPhase('scene-rendered');
  showUnseenV2Release();
  /* diagnostics handle for tools/slicesmoke.mjs — a WebGL canvas reads BLACK
     through 2D drawImage without preserveDrawingBuffer, so the smoke asks
     Pixi's extract (which re-renders) instead of scraping the canvas */
  (window as unknown as Record<string, unknown>).__CF_SLICE__ = {
    documentToken: DOCUMENT_TOKEN,   /* reload/import waits must reject the prior document's still-live handle */
    app, world, cam, camT,   /* camT drives the zoom-transition smoke leg */
    /* test API for tools/slicesmoke.mjs — drives the SAME functions the
       pointer handlers call; no parallel logic to drift */
    api: {
      state: () => ({
        mode: nav.mode, gal: nav.gal?.seed ?? null, star: nav.star?.seed ?? null,
        planet: nav.planet?.seed ?? null,
        galX: nav.gal?.x ?? null, galY: nav.gal?.y ?? null, galSize: nav.gal?.size ?? null,
        starX: nav.star?.x ?? null, starY: nav.star?.y ?? null,
        fine: !!fineLayer, solVisible: !!(solMark && solMark.visible),
        epoch: epochClock.current(),
        cardOpen: card.style.display !== 'none',
        cardTitle: card.querySelector('[data-sel=title]')?.textContent ?? null,
        stage: ascStage(), reach: reachRadiusOf(primeCount()),
        toastOn: toastEl.style.opacity === '1', toastText: toastEl.textContent || '', toastSerial: _toastSerial,
        galaxyBuildMs: lastGalaxyBuildMs,
        trail: trailEl.textContent || '', ctx: ctxEl.textContent || '',
        objective: objChipEl.textContent || '',
        chartsOn: save.chartsOn, chartsVisible: !!(chartLayer && chartLayer.visible),
        panelOpen: openPanelId(), codexCount: save.codex.length, seenGuide: save.seenGuide,
        rnSeen: save.rnSeen ?? null, releasePending: pendingReleaseBulletin?.version ?? null,
        tutActive: trainingActive(), tutStep: trainingStepId(), tutDone: save.tutDone,
        tutSnapshotPending: save.tutSnapPending,
        atlasCount: save.logMap.length,
        sfxVol: save.sfxVol, motionMode: save.motionMode,
        fsMode: save.fsMode, toneMode: save.toneMode, fontMode: save.fontMode,
        glassA: getComputedStyle(document.documentElement).getPropertyValue('--glass-a').trim(),
        rendererDpr: app.renderer.resolution,
        eventResolution: app.renderer.events.resolution,
        backingPixelCapPerCanvas: densityPlan.backingPixelCapPerCanvas,
        viewportWidth: densityPlan.viewportWidth, viewportHeight: densityPlan.viewportHeight,
        backingWidth: app.canvas.width, backingHeight: app.canvas.height,
        backdropBackingWidth: activeBackdropCanvas?.width ?? 0,
        backdropBackingHeight: activeBackdropCanvas?.height ?? 0,
        backdropLogicalWidth: bgSpr.width, backdropLogicalHeight: bgSpr.height,
        backdropGeneration,
        backdropTransitionPeakPixels, backdropTransitionBudgetPixels,
        combinedBackingPixels: app.canvas.width * app.canvas.height
          + (activeBackdropCanvas?.width ?? 0) * (activeBackdropCanvas?.height ?? 0),
        keyboardTarget: keyboardTargetKey,
        tickerTicks,
        topbarH: getComputedStyle(document.documentElement).getPropertyValue('--topbar-h'),
        save: {
          name: save.explorerName, essence: save.essence,
          landed: save.landed.slice(), customNames: save.customNames.map(([key, name]) => [key, name]),
          ascCh: save.ascCh, ascProg: { ...save.ascProg },
          items: save.items.map(([id, count]) => [id, count]),
          cargo: save.cargo.map(([id, count]) => [id, count]),
          cgx: save.cgx.map(([id, count]) => [id, count]),
          stats: { ...save.stats }, journal: save.journal.map((entry) => ({ ...entry })),
          claimedSets: save.claimedSets.slice(), techOwned: save.techOwned.slice(),
          unlocked: save.unlocked.slice(),
          primeFill: Object.fromEntries(Object.entries(save.primeFill)
            .map(([key, value]) => [key, { ...value }])),
          frontierUnlocked: save.frontierUnlocked,
          chWeek: save.chWeek, chProg: { ...save.chProg },
          chacc: save.chacc.slice(), chDone: save.chDone.slice(),
          viewType: (save.savedView as { type?: string } | null)?.type ?? null,
          savedView: save.savedView,
        },
      }),
      importBlob,   /* Gate C's front door, drivable by the smoke */
      __smokeArmImportRace: smokeArmImportRace,
      __smokeReleaseImportRace: smokeReleaseImportRace,
      __smokeRejectNextPersist: () => {
        if (smokeRejectNextPersist) return false;
        smokeRejectNextPersist = true;
        return true;
      },
      __smokePersistAfterDebounce: () => { persistSoon(); return true; },
      __smokePersistNow: persistView,
      encodeHere,   /* the share-code round trip, drivable by the smoke */
      cardShareCode,
      showReleaseFixture: (version = '2.0.0-test') => {
        const fixture: V2ShippedRelease = {
          status: 'shipped', version, title: 'Browser fixture bulletin', date: 'Test only',
          sections: [{ category: 'Under the Hood', bullets: ['Positive-path fixture; not a release.'] }],
        };
        const history = getReleaseHistory({ includeDraft: true, shippedReleases: [fixture] });
        return showV2ReleaseBulletin(fixture, history);
      },
      fineStarTarget: () => {
        for (const target of fineStarTargets) {
          const point = world.toGlobal({ x: target.star.x, y: target.star.y });
          if (point.x < 0 || point.y < 0 || point.x > innerWidth || point.y > innerHeight) continue;
          if (document.elementFromPoint(point.x, point.y) !== app.canvas) continue;
          const bounds = target.spr.getBounds();
          return { ...target.star, screenX: point.x, screenY: point.y, width: bounds.width, height: bounds.height };
        }
        return null;
      },
      fineStarProbe: () => {
        let visible = 0;
        let canvasHits = 0;
        const samples: Array<{ x: number; y: number; hit: string }> = [];
        for (const target of fineStarTargets) {
          const point = world.toGlobal({ x: target.star.x, y: target.star.y });
          if (point.x < 0 || point.y < 0 || point.x > innerWidth || point.y > innerHeight) continue;
          visible++;
          const hit = document.elementFromPoint(point.x, point.y);
          if (hit === app.canvas) canvasHits++;
          if (samples.length < 4) samples.push({
            x: point.x, y: point.y,
            hit: hit === app.canvas ? 'canvas' : (hit?.id || hit?.tagName.toLowerCase() || 'none'),
          });
        }
        return { total: fineStarTargets.length, visible, canvasHits, samples };
      },
      descendGalaxy: (seed: number) => {
        const g = uniNodes.find((n) => n.seed === seed);
        if (!g) return false;
        descendGalaxy(g);
        return true;
      },
      descendSystem,
      surveyOn: (i: number) => {
        if (nav.mode !== 'system' || !nav.star) return false;
        const p = systemScene(nav.star.seed).planets[i];
        if (!p) return false;
        surveyPlanet(p, nav.star.seed);
        return true;
      },
      landHere: () => { doLand(); return true; },
      landOn: (i: number) => {
        if (nav.mode !== 'system' || !nav.star) return false;
        const p = systemScene(nav.star.seed).planets[i];
        if (!p) return false;
        surveyAndLand(p, nav.star.seed);
        return true;
      },
    },
  };
  emitBootPhase('slice-published');
  /* the CMB band-pick (main.js ringPick): a tap on EMPTY space near the
     observable-universe ring — and only there — opens the origin card */
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', (e) => {
    if (e.target !== app.stage || nav.mode !== 'universe') return;
    const p = world.toLocal(e.global);
    if (Math.abs(Math.hypot(p.x, p.y) - OBS_R) * cam.z < 30) {
      surveyCard(describePick({ kind: 'cmb', data: {} } as never));
    }
  });

  let tickerTicks = 0;
  let firstTickPublished = false;
  app.ticker.add((tk) => {
    tickerTicks++;
    if (!firstTickPublished) {
      firstTickPublished = true;
      emitBootPhase('first-tick');
    }
    /* Reduced motion is a rendered-state policy, not just a CSS preference:
       navigation snaps, fades finish, and every ambient clock below receives
       t=0. Full/Auto keep the framerate-aware ease and living scene. */
    const animate = motionOK();
    const k = animate ? 1 - Math.pow(0.0025, tk.deltaMS / 1000) : 1;
    cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k; cam.z += (camT.z - cam.z) * k;
    world.position.set(app.screen.width / 2 - cam.x * cam.z, app.screen.height / 2 - cam.y * cam.z);
    world.scale.set(cam.z);
    if (world.alpha < 1) world.alpha = animate ? Math.min(1, world.alpha + tk.deltaMS / 400) : 1;
    const t = animate ? performance.now() * 0.001 : 0;
    /* the biological clock ticks on PLAY time (ecology reads the global) */
    (globalThis as Record<string, unknown>).COSMIC_EPOCH = epochClock.current();
    /* galaxies turn on cosmic time — barely perceptible (main.js ~3742) */
    for (const gs of galaxySpins) gs.spr.rotation = gs.base + t * 0.0012;
    checkTransitions();
    updateZoomDependent();
    if (nav.mode === 'universe') {
      /* STREAM the universe: crossing a cell boundary rebuilds the window
         around the camera — pan far enough (or ride a wormhole) and new
         galaxies keep resolving */
      const ux = Math.floor(camT.x / UCELL), uy = Math.floor(camT.y / UCELL);
      if (!uniCell || ux !== uniCell.ux || uy !== uniCell.uy) drawUniverse();
      /* blazars pulse — a jet aimed straight at you (main.js 3715) */
      for (const up of uniPulse) up.spr.alpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 6 + up.seed % 10));
      /* drifting fog-of-war: the CLOUD PATTERN moves, the puffs stay put
         (main.js 3766 — noise phase drifts at 5/s) */
      if (charterFx && charterFx.visible && fogFx.length && animate) {
        const drift = t * 5;
        for (const F of fogFx) {
          const n = (UNOISE as (x: number, y: number, o: number) => number)((F.wx + drift) / UCELL * 0.16, (F.wy - drift * 0.4) / UCELL * 0.16, 3);
          F.spr.alpha = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * F.ramp;
        }
      }
    } else if (nav.mode === 'galaxy') {
      updateFineLayer(false);
      /* the bright stars breathe (main.js 4165) — stilled under reduced motion */
      for (const st of galTwinkle) st.spr.alpha = 0.82 + 0.18 * Math.sin(t * 2.4 + (st.star.seed % 97));
      if (bhDisc) { bhDisc.rotation = t * 0.3; bhDisc.scale.y = bhDisc.scale.x * 0.55; }
      /* wormhole lensing · remnant cores · newborn protostars (main.js 4109/4218) */
      for (const ga of galAnims) {
        if (ga.kind === 'worm') ga.spr.rotation = t * 1.2;
        else if (ga.kind === 'bhdisc') { ga.spr.rotation = t * 0.3; ga.spr.scale.y = ga.spr.scale.x * 0.5; }
        else if (ga.kind === 'nsbeam') ga.spr.rotation = t * 2.2;
        else if (ga.kind === 'proto') ga.spr.alpha = 0.7 + 0.3 * Math.sin(t * 3 + (ga.seed % 7));
      }
    } else if (nav.mode === 'system') {
      /* live orbits — planets on the Renderer's angle law, moons Kepler-ish,
         belt rocks on their own drifts, beams spinning */
      for (const o of orbiters) {
        if (o.kind === 'planet') {
          const a = planetAng(o.orb, t);
          o.c.position.set(Math.cos(a) * o.orb, Math.sin(a) * o.orb);
          if (o.face) { const aim = a + Math.PI + 2.522; o.face[0]!.rotation = aim; o.face[1]!.rotation = a; }
          if (o.cloud) {
            const vis = o.cloud.pr * cam.z > 22;   /* close-up gate; t=0 freezes the deck under Reduced */
            o.cloud.wrap.visible = vis;
            if (vis) {
              const co = (t * 1.6) % (o.cloud.pr * 2);
              o.cloud.a.position.x = -o.cloud.pr + co;
              o.cloud.b.position.x = -o.cloud.pr + co - o.cloud.pr * 2;
            }
          }
        } else if (o.kind === 'moon') {
          const ma = t * (0.55 / Math.pow(o.orb, 1.5)) + (o.a0 || 0);
          const mdist = (o.mul || 1) * o.orb;
          o.c.position.set(Math.cos(ma) * mdist, Math.sin(ma) * mdist * 0.4);
          if (o.face && o.pOrb) o.face[0]!.rotation = planetAng(o.pOrb, t);   /* dark limb away from the star */
        } else if (o.kind === 'rock') {
          const a = (o.a0 || 0) + t * (o.sp || 0);
          o.c.position.set(Math.cos(a) * o.orb, Math.sin(a) * o.orb);
        } else if (o.kind === 'dwarf') {
          const a = o.orb * 0.13 + t * 0.05 / (o.orb * 0.012);
          o.c.position.set(Math.cos(a) * o.orb, Math.sin(a) * o.orb);
        } else if (o.kind === 'beam') {
          o.c.rotation = t * 3;
        }
      }
      for (const L of sysLabels) { const p = L.getPos(t); L.t.position.set(p.x, p.y); }
      /* comets: eccentric orbits, tail always away from the star, coma and
         tail width zoom-compensated exactly as the Renderer does */
      for (const C of sysComets) {
        const cm = C.cm;
        const M = ((t + cm.off) / cm.period) * TAU;
        const a = cm.aMaj, e = cm.ecc;
        const ox = a * (Math.cos(M) - e), oy = a * Math.sqrt(1 - e * e) * Math.sin(M);
        const x = Math.cos(cm.tilt) * ox - Math.sin(cm.tilt) * oy;
        const y = Math.sin(cm.tilt) * ox + Math.cos(cm.tilt) * oy;
        const dist = Math.hypot(x, y) || 1;
        const tailLen = Math.max(0, (SYS_R * 0.55 - dist)) * 0.5 + 8;
        C.tail.position.set(x, y);
        C.tail.rotation = Math.atan2(y / dist, x / dist);
        C.tail.width = tailLen;
        C.tail.height = 2.2 / Math.max(0.2, cam.z);
        const cs = 6.8 / Math.max(0.2, Math.sqrt(cam.z));
        C.coma.position.set(x, y);
        C.coma.width = cs; C.coma.height = cs;
        C.label.position.set(x, y - 2);
        C.label.visible = cam.z > minWH() / 520;
      }
      if (visitorFx) {
        const v = visitorFx.v, L2 = SYS_R * 2.6;
        const sPos = ((t * v.speed + v.off) % L2) - L2 / 2;
        const dirx = Math.cos(v.ang), diry = Math.sin(v.ang);
        const vx = -diry * v.b + dirx * sPos, vy = dirx * v.b + diry * sPos;
        visitorFx.wrap.position.set(vx, vy);
        visitorFx.body.rotation = t * 0.35;   /* it tumbles */
        visitorFx.label.position.set(vx, vy - 4);
        visitorFx.label.visible = cam.z > minWH() / 650;
      }
    } else if (nav.mode === 'surface' && surfClouds) {
      const co = (t * 9) % surfClouds.w;
      surfClouds.a.position.x = -surfClouds.w / 2 + co;
      surfClouds.b.position.x = -surfClouds.w / 2 + co - surfClouds.w;
    }
    /* screen-constant labels/markers (the Renderer's 1/c.z font trick) */
    for (const ss of screenScaled) ss.obj.scale.set(ss.f / Math.max(cam.z, 1e-6));
    renderKeyboardTarget();
  });

  /* input: drag pan · wheel zoom (cursor-anchored) · pinch · right-click /
     Escape ascend — plus the zoom-driven dives above */
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchD = 0;
  app.canvas.style.touchAction = 'none';
  app.canvas.addEventListener('pointerdown', (e) => {
    /* A transient IDB read failure may clear once a real player is present.
       A stored corrupt/future payload stays protected until explicit import;
       one click must never authorize overwriting that evidence. */
    if (persistHold === 'transient-read' && !persistRetrying) {
      persistRetrying = true;
      void readSaveWithRecovery(repo, storedPayloadStatus).then((retryRead) => {
        if (persistHold !== 'transient-read') return;
        if (retryRead.kind === 'loaded') {
          /* The first read failed before we knew whether storage was empty.
             If retry reveals real bytes, never overwrite them with the
             temporary fresh in-memory state: reload through the full
             classifier/recovery path. */
          const replacement = claimReplacementTransaction('storage-retry');
          if (!replacement) {
            toast('Save replacement underway', 'The current expedition replacement will finish before storage recovery continues.');
            return;
          }
          scheduleReplacementReload(replacement);
          return;
        }
        if (retryRead.kind === 'protected') {
          persistHold = 'protected-payload';
          toast(retryRead.reason === 'future-version' ? 'Update required' : 'Save protected',
            retryRead.reason === 'future-version'
              ? 'This expedition was written by a newer build. It will not be changed here.'
              : 'Stored expedition bytes appeared after retry but did not prove safe. They remain unchanged.', true);
          return;
        }
        if (retryRead.kind === 'transient-read') throw new Error('storage retry still unavailable');
        /* A successful retry that proves the store is genuinely empty may
           finally authorize the new expedition's first write. */
        persistHold = false;
        void persistView();
      }).catch(() => {
        toast('Save unavailable', 'Storage is still unavailable. This expedition remains protected from overwrite.');
      }).finally(() => { persistRetrying = false; });
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchD = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
  });
  addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    if (pointers.size === 1) {
      /* pan writes BOTH cam and target — immediate hand-feel; only zoom eases */
      cam.x -= (e.clientX - prev.x) / cam.z; cam.y -= (e.clientY - prev.y) / cam.z;
      camT.x = cam.x; camT.y = cam.y;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchD > 0) {
        const [lo, hi] = zoomLimits();
        camT.z = Math.min(hi, Math.max(lo, camT.z * (d / pinchD)));
      }
      pinchD = d;
    }
  });
  const lift = (e: PointerEvent): void => { pointers.delete(e.pointerId); pinchD = 0; };
  addEventListener('pointerup', lift);
  addEventListener('pointercancel', lift);
  app.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [lo, hi] = zoomLimits();
    const z2 = Math.min(hi, Math.max(lo, camT.z * (e.deltaY > 0 ? 0.88 : 1.14)));
    /* cursor-anchored: the world point under the cursor stays put */
    const cx = e.clientX - innerWidth / 2, cy = e.clientY - innerHeight / 2;
    const wx = camT.x + cx / camT.z, wy = camT.y + cy / camT.z;
    camT.x = wx - cx / z2; camT.y = wy - cy / z2;
    camT.z = z2;
  }, { passive: false });
  app.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); hideSurvey(); goUp(); });
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (sheet.style.display !== 'none' && e.key === 'Tab') {
      const focusable = [...sheet.querySelectorAll<HTMLElement>('textarea,button,input:not([type="hidden"]),[tabindex]:not([tabindex="-1"])')]
        .filter((el) => !('disabled' in el && (el as HTMLButtonElement).disabled) && el.offsetParent !== null);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (first && last && (e.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    if (e.key !== 'Escape') return;
    /* the Escape ORDER (the game's focus law): a focused search field
       yields first, then panels, then the survey card, then ascent */
    if (sheet.style.display !== 'none') { closeImportSheet(); return; }
    if (document.activeElement === searchEl) { searchEl.blur(); return; }
    if (openPanelId()) { closePanels(); return; }
    if (card.style.display !== 'none') {
      const restoreCanvas = card.contains(document.activeElement);
      hideSurvey(restoreCanvas);
      if (nav.mode === 'surface') goUp();
      return;
    }
    goUp();
  });
  emitBootPhase('wiring-complete');
  app.start();
  emitBootPhase('ticker-started');
  /* Runtime.addBinding installs this optional readiness seam before the
     document starts. Emit only after the complete slice, ticker, pointer,
     keyboard and persistence wiring above exists, allow the first animation
     frame, then cross one task boundary. This narrowly witnesses complete
     boot publication plus a serviced event-loop turn; later matrix actions
     remain the outcome/answerability proof. Ordinary play has no binding. */
  const emitBootReady = (): void => {
    requestAnimationFrame(() => {
      if (tickerTicks < 1) { emitBootReady(); return; }
      emitBootPhase('ready-scheduled');
      setTimeout(() => {
        try {
          const binding = (window as unknown as Record<string, unknown>).__cfSliceReadyWitness;
          if (typeof binding !== 'function') return;
          const backdropBackingWidth = activeBackdropCanvas?.width ?? 0;
          const backdropBackingHeight = activeBackdropCanvas?.height ?? 0;
          const payload = JSON.stringify({
            schema: 'cf-v2-slice-ready/v1', status: 'ready', token: DOCUMENT_TOKEN,
            href: location.href, readyState: document.readyState,
            saveReady: !!save, viewConnected: app.canvas.isConnected,
            rendererReady: !!app.renderer && app.canvas.width > 1 && app.canvas.height > 1,
            stageReady: !!app.stage, tickerTicks,
            rendererDpr: app.renderer.resolution,
            backingPixelCapPerCanvas: densityPlan.backingPixelCapPerCanvas,
            viewportWidth: densityPlan.viewportWidth, viewportHeight: densityPlan.viewportHeight,
            backingWidth: app.canvas.width, backingHeight: app.canvas.height,
            backdropBackingWidth, backdropBackingHeight,
            combinedBackingPixels: app.canvas.width * app.canvas.height
              + backdropBackingWidth * backdropBackingHeight,
            performanceNow: performance.now(),
          });
          emitBootPhase('ready-emitted');
          (binding as (payload: string) => unknown)(payload);
        } catch { /* the evidence harness fails closed if its optional seam is broken */ }
      }, 0);
    });
  };
  if (document.readyState === 'complete') emitBootReady();
  else addEventListener('load', emitBootReady, { once: true });
})();
