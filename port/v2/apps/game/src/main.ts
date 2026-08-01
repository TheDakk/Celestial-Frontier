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
import { Application, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import {
  galSpriteFor, decoSprite, getPlanetSprite, starSprite,
  _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr,
  _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr,
} from '@cf/art';
import {
  NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView,
  homeUniverse, galaxyCell, galaxyCellWindow, systemScene,
  GR, GCELL, type NavState, type GalaxyNode, type PlanetNode,
} from '@cf/scene';
import { galaxyProfile, galaxyHaze, systemFor, fineStarsInCell, FCELL } from '@cf/domain-worldgen';
import { SYS_R } from '@cf/domain-worldconfig';
import { mulberry32, hashInt, TAU } from '@cf/domain-rand';
import { installCaptureHooks, planetDescriptor, SOL_MOONS, type Descriptor } from '@cf/domain-descriptors';
import { createSaveRepository, createIndexedDBBackend } from '@cf/persistence';

installCaptureHooks();   /* GAL_SPRITES etc. until GalaxyArt fully replaces the hooks */

const app = new Application();
const hud = document.getElementById('hud')!;
const repo = createSaveRepository(createIndexedDBBackend('cf-v2-slice'));
const VIEW_KEY_NOTE = 'slice stores ONLY the nav view — real saves stay with importSaveV2';
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
  const esc = (s: unknown): string => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
  card.innerHTML =
    `<h2 data-sel="title" style="margin:0 0 2px;font-size:17px;color:#f4f8ff">${esc(d.title)}</h2>` +
    `<div data-sel="sub" style="color:#8fa3c4;margin-bottom:10px">${esc(d.sub)}${d.badge ? ` · <b data-sel="badge">${esc(d.badge)}</b>` : ''}</div>` +
    (d.rows as Array<[string, string, string?]>).map(([k, v, cls]) =>
      `<div data-row="${esc(k)}" data-cls="${esc(cls || '')}" style="margin:4px 0"><span style="color:#8fa3c4">${esc(k)}</span><br>${esc(v)}</div>`).join('');
  card.style.display = 'block';
}
function hideSurvey(): void { card.style.display = 'none'; }

function hudText(): void {
  const path = [nav.mode, nav.gal && 'gal ' + nav.gal.seed, nav.star && 'star ' + nav.star.seed].filter(Boolean).join(' · ');
  hud.innerHTML = `<b>${path}</b><br>drag pan · wheel/pinch zoom — zoom IN to dive, OUT to rise · click descend · right-click ascend<br><i>${VIEW_KEY_NOTE}</i>`;
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
let galStars: StarEntry[] = [];
let galTwinkle: StarEntry[] = [];
let screenScaled: ScreenScaled[] = [];
let solMark: Container | null = null;
let bhDisc: Sprite | null = null;
let fineLayer: Container | null = null;
let fineWin: { fx0: number; fy0: number; fx1: number; fy1: number } | null = null;
let lastZBucket = 0;
const zBucket = (): number => Math.round(Math.log(cam.z) / Math.log(1.15));
interface Orbiter { c: Container; kind: 'planet' | 'moon' | 'rock' | 'dwarf' | 'beam'; orb: number; sp?: number; a0?: number; mul?: number; face?: Sprite[]; }
let orbiters: Orbiter[] = [];
let sysLabels: Array<{ t: Text; getPos: (time: number) => { x: number; y: number } }> = [];
const baseR = (): number => Math.max(0.7 / cam.z, 0.55);   /* Renderer star sizing (main.js 4126) */

function clearWorld(): void {
  world.removeChildren();
  galaxySpins.length = 0;
  galStars = []; galTwinkle = []; screenScaled = [];
  solMark = null; bhDisc = null; fineLayer = null; fineWin = null;
  orbiters = []; sysLabels = [];
}

/* ---- draw passes ---- */
function drawUniverse(): void {
  clearWorld();
  /* THE REAL ART: per-seed painterly sprites (verbatim GalaxyArt painters,
     kind-locked), with the Renderer's exact transform — rotate(g.rot + slow
     cosmic spin), scale(1, g.tilt), draw at ±g.size (main.js ~3741) */
  uniNodes = homeUniverse(3);
  for (const g of uniNodes) {
    const spr = new Sprite(Texture.from(galSpriteFor(g)));
    spr.anchor.set(0.5);
    spr.position.set(g.x, g.y);
    const px = (g.size * 2) / 512;
    spr.scale.set(px, px * g.tilt);
    spr.rotation = g.rot;
    spr.eventMode = 'static';
    spr.cursor = 'pointer';
    spr.on('pointertap', () => descendGalaxy(g));
    world.addChild(spr);
    galaxySpins.push({ spr, base: g.rot });
    if (g.home) {
      const label = new Text({ text: 'Milky Way — you are here', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, fill: 0xffd9a0 } });
      label.anchor.set(0.5, 0);
      label.position.set(g.x, g.y + g.size * 1.15 + 4);
      world.addChild(label);
    }
  }
}

function drawGalaxy(galSeed: number): void {
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
     planets · failed brown dwarfs. Deco is non-interactive in the slice
     (the game surveys deco via picks — recorded gap). */
  const decoLayer = new Container(); decoLayer.eventMode = 'none';
  world.addChild(decoLayer);
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    for (const dc of galaxyCell(galSeed, prof, cx, cy).deco) {
      if (dc.k === 'h2' || dc.k === 'neb' || dc.k === 'mol' || dc.k === 'plan' || dc.k === 'rem') {
        const f = dc.k === 'rem' ? 1.3 : dc.k === 'plan' ? 1.2 : 1.15;
        const spr = new Sprite(Texture.from(decoSprite(dc)));
        spr.anchor.set(0.5);
        const rr = (dc.rr as number) || 8;
        spr.position.set(dc.x, dc.y);
        spr.width = rr * 2 * f; spr.height = rr * 2 * f;
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
          decoLayer.addChild(s2);
        }
      } else if (dc.k === 'rogue') {
        const s2 = new Sprite(Texture.from(_rogueSpr()));
        s2.anchor.set(0.5); s2.position.set(dc.x, dc.y);
        s2.width = 2.1; s2.height = 2.1;
        decoLayer.addChild(s2);
      } else if (dc.k === 'fbd') {
        const s2 = new Sprite(Texture.from(fbdSpr()));
        s2.anchor.set(0.5); s2.position.set(dc.x, dc.y);
        s2.width = 3.2; s2.height = 3.2;
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
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', () => descendSystem({ seed: s.seed, x: s.x, y: s.y }));
      world.addChild(spr);
      const entry = { spr, s: s.s, seed: s.seed };
      galStars.push(entry);
      if (s.s > 1.3) galTwinkle.push(entry);
      if ((s as { sol?: boolean }).sol) buildSolMark(s.x, s.y);
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
  fineLayer.eventMode = 'none';
  const prof = galaxyProfile(nav.gal.seed) as Record<string, unknown>;
  const bR = baseR();
  for (let fx = win.fx0; fx <= win.fx1; fx++) for (let fy = win.fy0; fy <= win.fy1; fy++) {
    for (const s of fineStarsInCell(nav.gal.seed, prof, fx, fy) as Array<{ x: number; y: number; c: string; s: number }>) {
      const spr = new Sprite(Texture.from(starSprite(s.c, false)));
      spr.anchor.set(0.5);
      spr.blendMode = 'add';
      const D = s.s * bR * 6.5;
      spr.width = D; spr.height = D;
      spr.position.set(s.x, s.y);
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
  if (nav.mode === 'galaxy') {
    const bR = baseR();
    for (const st of galStars) { const D = st.s * bR * 8; st.spr.width = D; st.spr.height = D; }
    updateFineLayer(true);   /* fine sizes track baseR via the rebuild */
    if (solMark) solMark.visible = cam.z > minWH() / 900;
    if (bhDisc) bhDisc.visible = cam.z > minWH() / 700;
  }
  if (nav.mode === 'system') rebuildSystemHD();
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
      const ms = new Sprite(Texture.from(_moonSpr(mt | 0, mrad * 2.18 * camT.z * DPR > 34)));
      ms.anchor.set(0.5);
      ms.width = mrad * 2.18; ms.height = mrad * 2.18;
      ms.eventMode = 'none';
      holder.addChild(ms);
      orbiters.push({ c: ms, kind: 'moon', orb: 1.7 + m * 0.48, sp: 0.55, a0: m * 2.4, mul: pr });
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
    o.face[0]!.texture = Texture.from(getPlanetSprite(p.P, Math.max(64, pr * 2 * camT.z * DPR)));
  }
}

/* ---- navigation (every transition through the tested state machine) ---- */
function rerender(): void {
  hideSurvey();
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
  const r = enterGalaxy(nav, g);
  if (r.ok) {
    nav = r.state;
    gz0 = 0.42 * minWH() / GR;
    cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
    camT.z = gz0 * 1.05; cam.z = gz0 * 0.35;
    rerender();
  }
}
function descendSystem(star: { seed: number; x: number; y: number }): void {
  const r = enterSystem(nav, star);
  if (r.ok) {
    nav = r.state;
    sz0 = 0.40 * minWH() / SYS_R;
    cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
    camT.z = sz0 * 1.05; cam.z = sz0 * 0.35;
    rerender();
  }
}
function surveyAndLand(p: PlanetNode, starSeed: number): void {
  /* the survey card first (the real game's flow: survey, then land) —
     planetDescriptor drives Ecology/SurveyPhrases/Genome underneath, so
     this one call is the whole domain stack speaking */
  const sys = systemFor(starSeed);
  showSurvey(planetDescriptor(p.P, sys, { name: p.name, orb: p.orb } as never) as Descriptor);
  const r = land(nav, { seed: p.seed });
  if (r.ok) { nav = r.state; drawSurface(p); hudText(); void persistView(); }
}
function drawSurface(p: PlanetNode): void {
  /* surface mode, slice edition: the world fills the view as its painterly
     surface (full biome scenes are Phase 6); the survey card carries the
     roster — every species row is real Ecology output */
  clearWorld();
  const spr = new Sprite(Texture.from(getPlanetSprite(p.P, 1024)));
  spr.anchor.set(0.5);
  spr.width = 420; spr.height = 420;
  world.addChild(spr);
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = 1; cam.z = 0.8;
}
function goUp(): void {
  const wasGal = nav.gal, wasStar = nav.star;
  const r = ascend(nav);
  if (!r.ok) return;
  nav = r.state;
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

/* ---- the save/reload leg (IndexedDB's first browser proof) ---- */
async function persistView(): Promise<void> {
  try { await repo.write(JSON.stringify({ nav, view: navToView(nav) })); } catch { /* private mode: session continues unsaved */ }
}
function navValid(n: NavState): boolean {
  /* a mode without its context (hand-edited/corrupt store) must fall back
     to home, not render an empty stage */
  const num = (v: unknown): boolean => Number.isFinite((v as { seed?: number } | null)?.seed);
  if (n.mode === 'universe') return true;
  if (n.mode === 'galaxy') return num(n.gal);
  if (n.mode === 'system') return num(n.gal) && num(n.star);
  if (n.mode === 'surface') return num(n.gal) && num(n.star) && num(n.planet);
  return false;
}
async function restoreView(): Promise<void> {
  try {
    const raw = await repo.readPrimary();
    if (!raw) return;
    const data = JSON.parse(raw) as { nav?: NavState };
    if (data.nav && navValid(data.nav)) nav = data.nav;
  } catch { /* corrupt slice view: start at home, never crash boot */ }
  /* camera matches the restored mode's entry zoom */
  if (nav.mode === 'galaxy') { camT.z = gz0 * 1.05; cam.z = camT.z; }
  else if (nav.mode === 'system') { camT.z = sz0 * 1.05; cam.z = camT.z; }
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
      state: () => ({ mode: nav.mode, fine: !!fineLayer, solVisible: !!(solMark && solMark.visible) }),
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
  await restoreView();
  rerender();

  app.ticker.add((tk) => {
    /* eased camera — exponential approach to the target, framerate-aware */
    const k = 1 - Math.pow(0.0025, tk.deltaMS / 1000);
    cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k; cam.z += (camT.z - cam.z) * k;
    world.position.set(app.renderer.width / (2 * app.renderer.resolution) - cam.x * cam.z, app.renderer.height / (2 * app.renderer.resolution) - cam.y * cam.z);
    world.scale.set(cam.z);
    if (world.alpha < 1) world.alpha = Math.min(1, world.alpha + tk.deltaMS / 400);
    const t = performance.now() * 0.001;
    /* galaxies turn on cosmic time — barely perceptible (main.js ~3742) */
    for (const gs of galaxySpins) gs.spr.rotation = gs.base + t * 0.0012;
    checkTransitions();
    updateZoomDependent();
    if (nav.mode === 'galaxy') {
      updateFineLayer(false);
      /* the bright stars breathe (main.js 4165) */
      for (const st of galTwinkle) st.spr.alpha = 0.82 + 0.18 * Math.sin(t * 2.4 + (st.seed % 97));
      if (bhDisc) { bhDisc.rotation = t * 0.3; bhDisc.scale.y = bhDisc.scale.x * 0.55; }
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
