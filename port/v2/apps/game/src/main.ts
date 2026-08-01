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
  NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView,
  homeUniverse, galaxyCell, galaxyCellWindow, systemScene,
  GR, GCELL, type NavState, type GalaxyNode, type PlanetNode,
} from '@cf/scene';
import { galaxyProfile, galaxyHaze, systemFor } from '@cf/domain-worldgen';
import { decoSprite, getPlanetSprite, starSprite } from '@cf/art';
import { installCaptureHooks, planetDescriptor, type Descriptor } from '@cf/domain-descriptors';
import { createSaveRepository, createIndexedDBBackend } from '@cf/persistence';

installCaptureHooks();   /* GAL_SPRITES etc. until GalaxyArt ports */

const app = new Application();
const hud = document.getElementById('hud')!;
const repo = createSaveRepository(createIndexedDBBackend('cf-v2-slice'));
const VIEW_KEY_NOTE = 'slice stores ONLY the nav view — real saves stay with importSaveV2';

let nav: NavState = NAV_HOME;
const cam = { x: 0, y: 0, z: 1 };
const camT = { x: 0, y: 0, z: 1 };   /* eased target — the goTo feel */
const world = new Container();

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
      } else if (dc.k === 'open' && Array.isArray(dc.pts)) {
        /* open clusters: loose knots of young stars — starSprite points at
           the Renderer's recipe (baseR fixed at its floor for the slice) */
        const tex = Texture.from(starSprite('#cfe4ff', false));
        for (const pt of dc.pts as Array<[number, number, number]>) {
          const d2 = pt[2] * 0.7 * 6;
          const s2 = new Sprite(tex);
          s2.anchor.set(0.5);
          s2.position.set((dc.x as number) + pt[0], (dc.y as number) + pt[1]);
          s2.width = d2; s2.height = d2;
          world.addChild(s2);
        }
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
    spr.eventMode = 'static';
    spr.cursor = 'pointer';
    spr.on('pointertap', () => surveyAndLand(p, starSeed));
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
  else if (nav.mode === 'surface' && nav.star && nav.planet) {
    const p = systemScene(nav.star.seed).planets.find((q) => q.seed === nav.planet!.seed);
    if (p) drawSurface(p); else { nav = NAV_HOME; drawUniverse(); }   /* a stale seed never bricks boot */
  }
  hudText();
  void persistView();
}
/* descents EASE in: cam jumps wide, camT is the destination (the goTo feel) */
function descendGalaxy(g: GalaxyNode): void {
  const r = enterGalaxy(nav, g);
  if (r.ok) { nav = r.state; cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = 0.4; cam.z = 0.12; rerender(); }
}
function descendSystem(star: { seed: number; x: number; y: number }): void {
  const r = enterSystem(nav, star);
  if (r.ok) { nav = r.state; cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = 1.2; cam.z = 0.4; rerender(); }
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
  world.removeChildren();
  const spr = new Sprite(Texture.from(getPlanetSprite(p.P, 1024)));
  spr.anchor.set(0.5);
  spr.width = 420; spr.height = 420;
  world.addChild(spr);
  camT.x = 0; camT.y = 0; camT.z = 1;
}
function goUp(): void {
  hideSurvey();
  const r = ascend(nav);
  if (r.ok) { nav = r.state; cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = nav.mode === 'universe' ? 1 : nav.mode === 'galaxy' ? 0.4 : 1.2; cam.z = camT.z * 0.8; rerender(); }
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
  (window as unknown as Record<string, unknown>).__CF_SLICE__ = {
    app, world,
    /* test API for tools/slicesmoke.mjs — drives the SAME functions the
       pointer handlers call; no parallel logic to drift */
    api: {
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
    /* pan writes BOTH cam and target — immediate hand-feel; only zoom eases */
    cam.x -= (e.clientX - lx) / cam.z; cam.y -= (e.clientY - ly) / cam.z;
    camT.x = cam.x; camT.y = cam.y;
    lx = e.clientX; ly = e.clientY;
  });
  addEventListener('pointerup', () => { dragging = false; });
  app.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camT.z = Math.min(8, Math.max(0.05, camT.z * (e.deltaY > 0 ? 0.88 : 1.14)));
  }, { passive: false });
  app.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); goUp(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') goUp(); });
})();
