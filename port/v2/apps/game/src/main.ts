/* Phase 3 vertical-slice — a Pixi renderer over @cf/scene, speaking the
   Renderer's own visual language (main.js ~3380-5340 recipes, sizes and LOD
   gates carried number-for-number). Everything that can be wrong lives in the
   tested packages; this file draws nodes, moves a camera, and forwards input
   into the nav state machine.

   Slice status: universe → galaxy → system → surface descent + ascent, with
   the game's ZOOM-DRIVEN transitions (checkTransitions semantics: zoom into
   a galaxy to dive, zoom out past gz0*0.62 to rise), painterly stars/deco/
   planets/rings/moons/belt via the lifted @cf/art painters, pan/wheel/pinch,
   survey card over typed selectors, save/reload of the nav view through
   @cf/persistence (IndexedDB).

   Recorded slice gaps (not parity bugs — Phase 4+ scope): wormhole travel,
   charter/Ascent gating on dives, ring↔planet mutual shadows, drifting cloud
   deck, moon terminator shading, comets/visitor, PROTO star disk (corona
   fallback), supernova sites, deco/fine-star pick targets. */
import { Application, Container, Graphics, Sprite, Texture, Text, extensions, CullerPlugin } from 'pixi.js';
import {
  galSpriteFor, decoSprite, getPlanetSprite, starSprite,
  _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr,
  _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr, _cloudSpr,
  _wormSpr, snSiteSprite, _bhDiscSpr, _protoSpr,
  _quasarSpr, _visitorSpr, _comaSpr, _vtrailSpr,
} from '@cf/art';
import { initAudio, playWhoosh, playSurveyPing } from '@cf/audio';
import {
  NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, viewToNav,
  universeGalaxies, galaxyCell, galaxyCellWindow, systemScene,
  ascStageOf, ascAllowsStar, reachRadiusOf, withinReachOf, currentRegionOf, ascHintFor,
  GR, GCELL, type NavState, type GalaxyNode, type PlanetNode,
} from '@cf/scene';
import { galaxyProfile, galaxyHaze, systemFor, fineStarsInCell, FCELL, galaxyWormhole, supernovaSites, galaxiesInCell, UNOISE } from '@cf/domain-worldgen';
import { SYS_R, UCELL, OBS_R, HOME_POS } from '@cf/domain-worldconfig';
import { galaxyName, properName } from '@cf/domain-naming';
import { createEpochClock, type EpochClock } from '@cf/domain-progression';
import { mulberry32, hashInt, TAU } from '@cf/domain-rand';
import { installCaptureHooks, planetDescriptor, describePick, SOL_MOONS, type Descriptor } from '@cf/domain-descriptors';
import {
  createSaveRepository, createIndexedDBBackend,
  importSaveV2, exportSaveV2, type SaveStateV2, type ContentRegistry,
} from '@cf/persistence';
import REGISTRY_JSON from '../../../../baseline-v1.8.9/content-registry.json';

installCaptureHooks();   /* GAL_SPRITES etc. until GalaxyArt fully replaces the hooks */
/* app-state seams the VERBATIM descriptor code reads as globals (D-ST in
   DEVIATIONS — describePick reads `st`/`customNames` inside a [domain]
   module; the port passes state explicitly when Phase 4 rebuilds the card
   layer). The slice keeps them true: stSeam tracks nav below. */
const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
const gSeam = globalThis as Record<string, unknown>;
const stSeam: { gal: unknown; star: unknown } = { gal: null, star: null };
gSeam.st ??= stSeam;
gSeam.customNames ??= new Map();   /* player renames — Phase 4 wiring */

extensions.add(CullerPlugin);   /* offscreen sprites skip render — thousands of stars, one flag */

const app = new Application();
const hud = document.getElementById('hud')!;
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
const DPR = Math.min(devicePixelRatio, 3);
const minWH = (): number => Math.min(innerWidth, innerHeight);

let nav: NavState = NAV_HOME;
const cam = { x: 0, y: 0, z: 1 };
const camT = { x: 0, y: 0, z: 1 };   /* eased target — the goTo feel */
const world = new Container();
/* the game's entry zooms, recomputed at each descent (main.js 3396/3462) */
let gz0 = 0.42 * minWH() / GR;
let sz0 = 0.40 * minWH() / SYS_R;

/* ---- the survey card: HTML over TYPED SELECTORS (Gate D contract) ---- */
const card = document.createElement('aside');
card.id = 'survey';
card.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:min(340px,86vw);overflow:auto;' +
  'background:rgba(8,12,22,0.92);color:#cfe0f4;font:13px/1.5 system-ui,sans-serif;' +
  'padding:14px;box-sizing:border-box;display:none;border-left:1px solid #22304a';
document.body.appendChild(card);
function showSurvey(d: Descriptor): void {
  /* quotes included: keys/classes land in ATTRIBUTES (data-row="…"), where a
     bare-minimum <>& escape still allows attribute breakout — hardened in the
     2026-08-01 exploit pass before any untrusted text could ever reach here */
  const esc = (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
  card.innerHTML =
    `<h2 data-sel="title" style="margin:0 0 2px;font-size:17px;color:#f4f8ff">${esc(d.title)}</h2>` +
    `<div data-sel="sub" style="color:#8fa3c4;margin-bottom:10px">${esc(d.sub)}${d.badge ? ` · <b data-sel="badge">${esc(d.badge)}</b>` : ''}</div>` +
    (d.rows as Array<[string, string, string?]>).map(([k, v, cls]) =>
      `<div data-row="${esc(k)}" data-cls="${esc(cls || '')}" style="margin:4px 0"><span style="color:#8fa3c4">${esc(k)}</span><br>${esc(v)}</div>`).join('');
  card.style.display = 'block';
}
function hideSurvey(): void { card.style.display = 'none'; }

/* ---- the charter toast (main.js charterBlock/ascBlock: name the BUILD) ---- */
const toastEl = document.createElement('div');
toastEl.id = 'toast';
toastEl.style.cssText = 'position:fixed;left:50%;bottom:9%;transform:translateX(-50%);max-width:min(480px,90vw);' +
  'background:rgba(10,16,30,0.94);color:#cfe0f4;font:13px/1.5 system-ui,sans-serif;padding:10px 16px;' +
  'border:1px solid #2a3c5e;border-radius:10px;opacity:0;transition:opacity 0.35s;pointer-events:none';
document.body.appendChild(toastEl);
let _toastT = 0, _toastHide = 0;
function toast(title: string, msg: string): void {
  const now = performance.now();
  if (now - _toastT < 1800) return;   /* the game's re-fire guard (review catch: parking inside a gate) */
  _toastT = now;
  toastEl.innerHTML = `<b data-sel="toast-title">${title}</b><br>${msg}`;
  toastEl.style.opacity = '1';
  clearTimeout(_toastHide);
  _toastHide = window.setTimeout(() => { toastEl.style.opacity = '0'; }, 3600);
}
const primeCount = (): number => Object.keys(save.primeFill || {}).length;
const ascStage = (): 0 | 1 | 2 | 3 => ascStageOf(save.items, save.ascCh);

function hudText(): void {
  const path = [nav.mode, nav.gal && 'gal ' + nav.gal.seed, nav.star && 'star ' + nav.star.seed].filter(Boolean).join(' · ');
  const who = `${save.explorerName || 'Explorer'} · ✦ ${save.essence} stardust · ${save.landed.length} worlds landed · charter: ${currentRegionOf(primeCount()).name} (stage ${ascStage()})`;
  hud.innerHTML = `<b>${path}</b><br>drag pan · wheel/pinch zoom — zoom IN to dive, OUT to rise · tap to SURVEY, tap twice to travel · right-click ascend<br><i>${who} — the REAL save (importSaveV2 ⇄ exportSaveV2, IndexedDB)</i>`;
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
interface StarEntry { spr: Sprite; s: number; seed: number; }
interface ScreenScaled { obj: Container; f: number; }   /* scale = f / cam.z */
const galaxySpins: Array<{ spr: Sprite; base: number }> = [];
let uniNodes: GalaxyNode[] = [];   /* cached universe composition — checkTransitions runs per tick */
let uniCell: { ux: number; uy: number } | null = null;   /* the streamed window's anchor cell */
/* SURVEY-FIRST (the game's own flow): a tap SURVEYS — the card opens with a
   sonar ping; travel is zooming in (checkTransitions) or a quick second tap
   on the same thing. No silent teleports. */
let lastTap: { key: string; t: number } = { key: '', t: -1e9 };
function tapTwice(key: string): boolean {
  const now = performance.now();
  const twice = lastTap.key === key && now - lastTap.t < 400;
  lastTap = twice ? { key: '', t: -1e9 } : { key, t: now };
  return twice;
}
function surveyCard(d: unknown): void {
  if (d) { showSurvey(d as Descriptor); playSurveyPing(); }
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
let lastGalaxyBuildMs = 0;
interface CometFx { coma: Sprite; tail: Sprite; label: Text; cm: { off: number; period: number; aMaj: number; ecc: number; tilt: number }; }
let sysComets: CometFx[] = [];
let visitorFx: { wrap: Container; body: Sprite; label: Text; v: { speed: number; off: number; ang: number; b: number } } | null = null;
const zCut = (): number => {
  const W = app.renderer.width / app.renderer.resolution, H = app.renderer.height / app.renderer.resolution;
  return Math.sqrt((W * H) / (UCELL * UCELL * 3600));   /* main.js 3620 */
};
let fineLayer: Container | null = null;
let fineWin: { fx0: number; fy0: number; fx1: number; fy1: number } | null = null;
let lastZBucket = 0;
const zBucket = (): number => Math.round(Math.log(cam.z) / Math.log(1.15));
interface Orbiter { c: Container; kind: 'planet' | 'moon' | 'rock' | 'dwarf' | 'beam'; orb: number; sp?: number; a0?: number; mul?: number; pOrb?: number; face?: Sprite[]; }
let orbiters: Orbiter[] = [];
let sysLabels: Array<{ t: Text; getPos: (time: number) => { x: number; y: number } }> = [];
let sysStar: { seed: number; col: string; kind: string; starR: number } | null = null;
let starSurfSpr: Sprite | null = null;
let surfClouds: { a: Sprite; b: Sprite; w: number } | null = null;
const MOTION_OK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const baseR = (): number => Math.max(0.7 / cam.z, 0.55);   /* Renderer star sizing (main.js 4126) */

function clearWorld(): void {
  world.removeChildren();
  galaxySpins.length = 0;
  galStars = []; galTwinkle = []; screenScaled = [];
  solMark = null; bhDisc = null; fineLayer = null; fineWin = null;
  orbiters = []; sysLabels = []; sysStar = null; starSurfSpr = null; surfClouds = null;
  galAnims = []; wormPos = null;
  uniLabels = []; uniPulse = []; charterFx = null; webLayer = null;
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
      if (tapTwice('g' + g.seed)) descendGalaxy(g);
      else surveyCard(describePick({ kind: g.quasar ? 'quasar' : (g.radio ? 'radio' : 'galaxy'), data: g } as never));
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
    const n = (UNOISE as (x: number, y: number, o: number) => number)(wx / UCELL * 0.16, wy / UCELL * 0.16, 3);
    const a = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * Math.min(Math.max((dd - rr) / (rr * 0.55), 0), 1);
    if (a <= 0.03) continue;
    const f = new Sprite(Texture.from(fogBlobSpr()));
    f.anchor.set(0.5);
    f.position.set(wx, wy);
    f.width = FC * 1.9; f.height = FC * 1.9;
    f.alpha = a;
    f.cullable = true;
    charterFx.addChild(f);
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
        if (tapTwice('s' + s.seed)) descendSystem({ seed: s.seed, x: s.x, y: s.y });
        else surveyCard(describePick({ kind: 'star', data: s } as never));
      });
      world.addChild(spr);
      const entry = { spr, s: s.s, seed: s.seed };
      galStars.push(entry);
      if (s.s > 1.3) galTwinkle.push(entry);
      if ((s as { sol?: boolean }).sol) buildSolMark(s.x, s.y);
    }
  }
  /* the wormhole — one hides in a few galaxies; survey it, or fly in and be
     hurled somewhere unimaginably distant (main.js 3415: the jump is seeded
     from the galaxy, identical for every explorer; the charter's reach clamp
     lands with progression wiring — recorded) */
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
     to the disc. Non-interactive in the slice (recorded gap). */
  if (nav.mode !== 'galaxy' || !nav.gal) return;
  const on = cam.z > minWH() / 260;
  if (!on) {
    if (fineLayer) { world.removeChild(fineLayer); fineLayer.destroy({ children: true }); fineLayer = null; fineWin = null; }
    return;
  }
  const W = app.renderer.width / app.renderer.resolution, H = app.renderer.height / app.renderer.resolution;
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
      /* fine stars are DIVEABLE, same as the game's picks (main.js 4193) */
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', () => descendSystem({ seed: s.seed, x: s.x, y: s.y }));
      fineLayer.addChild(spr);
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
  if (nav.mode === 'universe') applyUniverseGates();
  if (nav.mode === 'galaxy') {
    const bR = baseR();
    for (const st of galStars) { const D = st.s * bR * 8; st.spr.width = D; st.spr.height = D; }
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
  /* orbits & planets — Renderer angles/sizes: ang = orb·0.13 + t·0.05/(orb·0.012),
     pr = 6·sizeMul, sprite rotated so its baked light faces the star */
  for (const p of sys.planets) {
    world.addChild(new Graphics().circle(0, 0, p.orb).stroke({ width: 0.5, color: 0x2a3a55 }));
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
    holder.on('pointertap', () => surveyAndLand(p, starSeed));
    world.addChild(holder);
    const ent: Orbiter = { c: holder, kind: 'planet', orb: p.orb, face: [spr, term] };
    orbiters.push(ent);
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
function rerender(): void {
  hideSurvey();
  stSeam.gal = nav.gal; stSeam.star = nav.star;   /* the describePick seam stays true */
  if (nav.mode === 'universe') drawUniverse();
  else if (nav.mode === 'galaxy' && nav.gal) drawGalaxy(nav.gal.seed);
  else if (nav.mode === 'system' && nav.star) drawSystem(nav.star.seed);
  else if (nav.mode === 'surface' && nav.star && nav.planet) {
    const p = systemScene(nav.star.seed).planets.find((q) => q.seed === nav.planet!.seed);
    if (p) drawSurface(p); else { nav = NAV_HOME; drawUniverse(); }   /* a stale seed never bricks boot */
  }
  world.alpha = 0.25;   /* the mode fade (st.fade), eased back in the ticker */
  hudText();
  void persistView();
}
/* descents EASE in: cam jumps wide, camT is the destination (the goTo feel) */
function descendGalaxy(g: GalaxyNode): void {
  /* the charter gates INTERGALACTIC reach (main.js 3391): an unreachable
     galaxy holds you at its threshold and names the build that opens it */
  if (!withinReachOf(primeCount(), g.x, g.y)) {
    camT.z = Math.min(camT.z, (0.55 * minWH() / Math.max(g.size, 8)) * 0.97);
    toast('⬆ Beyond Your Charter', ascStage() < 3 ? ascHintFor(ascStage()) : 'Collect prime signatures to extend your reach — ' + currentRegionOf(primeCount()).name + ' for now.');
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
    toast('⬆ Beyond Your Charter', ascHintFor(ascStage()));
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
function surveyAndLand(p: PlanetNode, starSeed: number): void {
  /* the survey card first (the real game's flow: survey, then land) —
     planetDescriptor drives Ecology/SurveyPhrases/Genome underneath, so
     this one call is the whole domain stack speaking */
  const sys = systemFor(starSeed);
  showSurvey(planetDescriptor(p.P, sys, { name: p.name, orb: p.orb } as never) as Descriptor);
  playSurveyPing();   /* the ACT of surveying answers back (main.js) */
  const r = land(nav, { seed: p.seed });
  if (r.ok) {
    nav = r.state;
    if (!save.landed.includes(p.seed)) save.landed.push(p.seed);   /* the game's `land` set */
    stSeam.gal = nav.gal; stSeam.star = nav.star;
    playWhoosh();   /* planetfall */
    drawSurface(p); hudText(); void persistView();
  }
}
function drawSurface(p: PlanetNode): void {
  /* surface mode, slice edition: the world fills the view as its painterly
     surface (full biome scenes are Phase 6); the survey card carries the
     roster — every species row is real Ecology output */
  clearWorld();
  const R = 210;
  const spr = new Sprite(Texture.from(getPlanetSprite(p.P, 1024)));
  spr.anchor.set(0.5);
  spr.width = R * 2; spr.height = R * 2;
  world.addChild(spr);
  if ((p.P.type === 'terran' || p.P.type === 'ocean') && MOTION_OK) {
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
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = 1; cam.z = 0.8;
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
  return [0.45, 6];
}

/* ---- the save/reload leg — THE REAL PIPELINE ---- */
async function persistView(): Promise<void> {
  try {
    save.savedView = navToView(nav);
    save.EPOCH_BASE = epochClock.current();   /* play time accumulates across sessions (doSave writes COSMIC_EPOCH) */
    await repo.write(exportSaveV2(save, Date.now()));
  } catch { /* private mode: session continues unsaved */ }
}
async function loadSave(): Promise<void> {
  let raw: string | null = null;
  try { raw = (await repo.readPrimary()) ?? null; } catch { raw = null; }
  const imp = importSaveV2(raw, REGISTRY, Date.now());
  save = imp.ok ? imp.state
    : (importSaveV2('{}', REGISTRY, Date.now()) as { ok: true; state: SaveStateV2 }).state;   /* fresh expedition */
  /* the sanitized view → nav; viewToNav degrades toward home, so a
     hand-edited/corrupt view can never render an empty stage */
  nav = viewToNav(save.savedView);
  if (nav.mode === 'galaxy') { camT.z = gz0 * 1.05; cam.z = camT.z; }
  else if (nav.mode === 'system') { camT.z = sz0 * 1.05; cam.z = camT.z; }
  playT0 = performance.now();
  epochClock = createEpochClock(save.EPOCH_BASE, playSeconds);
  (globalThis as Record<string, unknown>).COSMIC_EPOCH = epochClock.current();
  initAudio({ sndOn: () => save.sndOn, sfxVol: () => save.sfxVol });   /* the save's own audio settings */
}

/* ---- boot ---- */
(async () => {
  await app.init({ background: 0x05070d, resizeTo: window, antialias: true, resolution: DPR });
  document.body.appendChild(app.canvas);
  app.stage.addChild(world);
  /* diagnostics handle for tools/slicesmoke.mjs — a WebGL canvas reads BLACK
     through 2D drawImage without preserveDrawingBuffer, so the smoke asks
     Pixi's extract (which re-renders) instead of scraping the canvas */
  (window as unknown as Record<string, unknown>).__CF_SLICE__ = {
    app, world, cam, camT,   /* camT drives the zoom-transition smoke leg */
    /* test API for tools/slicesmoke.mjs — drives the SAME functions the
       pointer handlers call; no parallel logic to drift */
    api: {
      state: () => ({
        mode: nav.mode, fine: !!fineLayer, solVisible: !!(solMark && solMark.visible),
        epoch: epochClock.current(),
        cardOpen: card.style.display !== 'none',
        cardTitle: card.querySelector('[data-sel=title]')?.textContent ?? null,
        stage: ascStage(), reach: reachRadiusOf(primeCount()),
        toastOn: toastEl.style.opacity === '1', toastText: toastEl.textContent || '',
        galaxyBuildMs: lastGalaxyBuildMs,
        save: {
          name: save.explorerName, essence: save.essence,
          landed: save.landed.slice(), viewType: (save.savedView as { type?: string } | null)?.type ?? null,
        },
      }),
      descendGalaxy: (seed: number) => {
        const g = uniNodes.find((n) => n.seed === seed);
        if (!g) return false;
        descendGalaxy(g);
        return true;
      },
      descendSystem,
      landOn: (i: number) => {
        if (nav.mode !== 'system' || !nav.star) return false;
        const p = systemScene(nav.star.seed).planets[i];
        if (!p) return false;
        surveyAndLand(p, nav.star.seed);
        return true;
      },
    },
  };
  await loadSave();
  rerender();

  app.ticker.add((tk) => {
    /* eased camera — exponential approach to the target, framerate-aware */
    const k = 1 - Math.pow(0.0025, tk.deltaMS / 1000);
    cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k; cam.z += (camT.z - cam.z) * k;
    world.position.set(app.renderer.width / (2 * app.renderer.resolution) - cam.x * cam.z, app.renderer.height / (2 * app.renderer.resolution) - cam.y * cam.z);
    world.scale.set(cam.z);
    if (world.alpha < 1) world.alpha = Math.min(1, world.alpha + tk.deltaMS / 400);
    const t = performance.now() * 0.001;
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
    } else if (nav.mode === 'galaxy') {
      updateFineLayer(false);
      /* the bright stars breathe (main.js 4165) */
      for (const st of galTwinkle) st.spr.alpha = 0.82 + 0.18 * Math.sin(t * 2.4 + (st.seed % 97));
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
  });

  /* input: drag pan · wheel zoom (cursor-anchored) · pinch · right-click /
     Escape ascend — plus the zoom-driven dives above */
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchD = 0;
  app.canvas.style.touchAction = 'none';
  app.canvas.addEventListener('pointerdown', (e) => {
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
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideSurvey(); goUp(); } });
})();
