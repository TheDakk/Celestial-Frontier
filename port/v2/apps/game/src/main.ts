/* Phase 3 vertical-slice shell — a DUMB Pixi renderer over @cf/scene.
   Everything that can be wrong lives in the tested packages; this file only
   draws nodes, moves a camera, and forwards clicks into the nav state
   machine. Placeholder marks (circles) are SCAFFOLDING — the HD engine law
   applies to shipped art, and the painterly pipeline (port/spike) replaces
   these in Phases 4–6.

   Slice status: universe → galaxy → system descent + ascent (Escape/right-
   click), pan/wheel-zoom, save/reload of the nav view through
   @cf/persistence (IndexedDB — its first browser proof). Surface mode,
   survey cards and input parity land in later Phase 3/4 batches. */
import { Application, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import { galSpriteFor } from '@cf/art';
import {
  NAV_HOME, enterGalaxy, enterSystem, ascend, navToView,
  homeUniverse, galaxyCell, galaxyCellWindow, systemScene,
  GR, GCELL, type NavState, type GalaxyNode,
} from '@cf/scene';
import { galaxyProfile, galaxyHaze } from '@cf/domain-worldgen';
import { decoSprite, getPlanetSprite } from '@cf/art';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSaveRepository, createIndexedDBBackend } from '@cf/persistence';

installCaptureHooks();   /* GAL_SPRITES etc. until GalaxyArt ports */

const app = new Application();
const hud = document.getElementById('hud')!;
const repo = createSaveRepository(createIndexedDBBackend('cf-v2-slice'));
const VIEW_KEY_NOTE = 'slice stores ONLY the nav view — real saves stay with importSaveV2';

let nav: NavState = NAV_HOME;
const cam = { x: 0, y: 0, z: 1 };
const world = new Container();

function hudText(): void {
  const path = [nav.mode, nav.gal && 'gal ' + nav.gal.seed, nav.star && 'star ' + nav.star.seed].filter(Boolean).join(' · ');
  hud.innerHTML = `<b>${path}</b><br>drag pan · wheel zoom · click descend · right-click ascend<br><i>${VIEW_KEY_NOTE}</i>`;
}

/* ---- draw passes ---- */
const galaxySpins: Array<{ spr: Sprite; base: number }> = [];
function drawUniverse(): void {
  world.removeChildren();
  galaxySpins.length = 0;
  /* THE REAL ART: per-seed painterly sprites (verbatim GalaxyArt painters,
     kind-locked), with the Renderer's exact transform — rotate(g.rot + slow
     cosmic spin), scale(1, g.tilt), draw at ±g.size (main.js ~3741) */
  for (const g of homeUniverse(3)) {
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
  world.removeChildren();
  const prof = galaxyProfile(galSeed) as Record<string, unknown>;
  /* THE HAZE — unresolved starlight matching the exact star-density math
     (verbatim galaxyHaze; D-HAZE's render-layer ownership starts here) */
  const hazeSpr = new Sprite(Texture.from(galaxyHaze(galSeed, prof) as HTMLCanvasElement));
  hazeSpr.anchor.set(0.5);
  hazeSpr.scale.set((2 * GR) / 2048);
  world.addChild(hazeSpr);
  const w = galaxyCellWindow(-GR * 1.2, -GR * 1.2, GR * 1.2, GR * 1.2);
  /* deco pass UNDER the stars, Renderer sizes (main.js ~4131): nebulae ×2.3
     at −1.15·rr, planetary shells ×2.4 at −1.2·rr. 'open' clusters need the
     starSprite painter (not yet lifted — recorded); skipped this pass. */
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    for (const dc of galaxyCell(galSeed, prof, cx, cy).deco) {
      if (dc.k === 'h2' || dc.k === 'neb' || dc.k === 'mol' || dc.k === 'plan' || dc.k === 'rem') {
        const f = dc.k === 'plan' ? 1.2 : 1.15;
        const spr = new Sprite(Texture.from(decoSprite(dc)));
        spr.anchor.set(0.5);
        const rr = (dc.rr as number) || 8;
        spr.position.set(dc.x, dc.y);
        spr.width = rr * 2 * f; spr.height = rr * 2 * f;
        world.addChild(spr);
      }
    }
  }
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    for (const s of galaxyCell(galSeed, prof, cx, cy).stars) {
      const dot = new Graphics().circle(0, 0, s.s * 1.6).fill(s.c);
      dot.position.set(s.x, s.y);
      dot.eventMode = 'static';
      dot.cursor = 'pointer';
      dot.on('pointertap', () => descendSystem({ seed: s.seed, x: s.x, y: s.y }));
      world.addChild(dot);
    }
  }
}
function drawSystem(starSeed: number): void {
  world.removeChildren();
  const sys = systemScene(starSeed);
  const star = new Graphics().circle(0, 0, Math.max(8, sys.starR / 3)).fill(sys.starCol || 0xffe9c4);
  world.addChild(star);
  for (const p of sys.planets) {
    world.addChild(new Graphics().circle(0, 0, p.orb).stroke({ width: 0.5, color: 0x2a3a55 }));
    /* THE REAL SURFACES: verbatim getPlanetSprite painters (noise-lit,
       type-true), sized by the world's own sizeMul */
    const px = 12 * ((p.P.sizeMul as number) || 1);
    const spr = new Sprite(Texture.from(getPlanetSprite(p.P)));
    spr.anchor.set(0.5);
    spr.width = px; spr.height = px;
    spr.position.set(p.orb, 0);
    world.addChild(spr);
    if (p.ring) {
      const ring = new Graphics().ellipse(0, 0, px * 1.1, px * 0.35).stroke({ width: 1, color: 0xcbb98a, alpha: 0.8 });
      ring.position.set(p.orb, 0);
      world.addChild(ring);
    }
  }
}

/* ---- navigation (every transition through the tested state machine) ---- */
function rerender(): void {
  if (nav.mode === 'universe') drawUniverse();
  else if (nav.mode === 'galaxy' && nav.gal) drawGalaxy(nav.gal.seed);
  else if (nav.mode === 'system' && nav.star) drawSystem(nav.star.seed);
  hudText();
  void persistView();
}
function descendGalaxy(g: GalaxyNode): void {
  const r = enterGalaxy(nav, g);
  if (r.ok) { nav = r.state; cam.x = 0; cam.y = 0; cam.z = 0.4; rerender(); }
}
function descendSystem(star: { seed: number; x: number; y: number }): void {
  const r = enterSystem(nav, star);
  if (r.ok) { nav = r.state; cam.x = 0; cam.y = 0; cam.z = 1.2; rerender(); }
}
function goUp(): void {
  const r = ascend(nav);
  if (r.ok) { nav = r.state; cam.x = 0; cam.y = 0; cam.z = nav.mode === 'universe' ? 1 : 0.4; rerender(); }
}

/* ---- the save/reload leg (IndexedDB's first browser proof) ---- */
async function persistView(): Promise<void> {
  try { await repo.write(JSON.stringify({ nav, view: navToView(nav) })); } catch { /* private mode: session continues unsaved */ }
}
async function restoreView(): Promise<void> {
  try {
    const raw = await repo.readPrimary();
    if (!raw) return;
    const data = JSON.parse(raw) as { nav?: NavState };
    if (data.nav && ['universe', 'galaxy', 'system', 'surface'].includes(data.nav.mode)) nav = data.nav;
  } catch { /* corrupt slice view: start at home, never crash boot */ }
}

/* ---- boot ---- */
(async () => {
  await app.init({ background: 0x05070d, resizeTo: window, antialias: true, resolution: Math.min(devicePixelRatio, 3) });
  document.body.appendChild(app.canvas);
  app.stage.addChild(world);
  /* diagnostics handle for tools/slicesmoke.mjs — a WebGL canvas reads BLACK
     through 2D drawImage without preserveDrawingBuffer, so the smoke asks
     Pixi's extract (which re-renders) instead of scraping the canvas */
  (window as unknown as Record<string, unknown>).__CF_SLICE__ = { app, world };
  await restoreView();
  rerender();

  app.ticker.add(() => {
    world.position.set(app.renderer.width / (2 * app.renderer.resolution) - cam.x * cam.z, app.renderer.height / (2 * app.renderer.resolution) - cam.y * cam.z);
    world.scale.set(cam.z);
    /* galaxies turn on cosmic time — barely perceptible (main.js ~3742) */
    const t = performance.now() * 0.001;
    for (const gs of galaxySpins) gs.spr.rotation = gs.base + t * 0.0012;
  });

  /* input: drag pan · wheel zoom · right-click / Escape ascend */
  let dragging = false, lx = 0, ly = 0, moved = 0;
  app.canvas.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
    cam.x -= (e.clientX - lx) / cam.z; cam.y -= (e.clientY - ly) / cam.z;
    lx = e.clientX; ly = e.clientY;
  });
  addEventListener('pointerup', () => { dragging = false; });
  app.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cam.z = Math.min(8, Math.max(0.05, cam.z * (e.deltaY > 0 ? 0.88 : 1.14)));
  }, { passive: false });
  app.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); goUp(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') goUp(); });
})();
