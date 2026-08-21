/* faunaoverrides5.ts — WAVE 21: the named-species NEEDS_FIX fauna.
   Nine animals the shared systems route but cannot say. The bear came out of
   the quadruped system as a spiky yellow sausage, the sirenians never had a
   route at all and fell through to the verbatim engine as spheres, and the
   cuttlefish borrowed the octopus. Each of these is a case where the SIGNATURE
   is the whole identity and no parameter on a shared spec reaches it. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { Tube, pathThrough } from './torso.js';
import { countershade } from './skin.js';
import type { ArtContext2D } from './speciescanvas.js';

type Ctx = ArtContext2D;
type G = Record<string, unknown>;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

function nrng(g: G, name: string, salt: number): () => number {
  let h = salt >>> 0;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return mulberry32((((g.seed as number) ^ h) >>> 0));
}
function shadow(c: Ctx, cx: number, cy: number, rx: number, a = 0.42): void {
  c.fillStyle = `rgba(0,0,0,${a})`; c.beginPath(); c.ellipse(cx, cy, rx, S * 0.026, 0, 0, TAU); c.fill();
}
function volume(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.42, 2, x, y, r * 1.15);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function shade(p: Pal, m: number): string {
  return `rgb(${Math.min(255, p.cr * m | 0)},${Math.min(255, p.cg * m | 0)},${Math.min(255, p.cb * m | 0)})`;
}
function eye(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#0d1016'; c.beginPath(); c.arc(x, y, r * 0.62, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.34, r * 0.24, 0, TAU); c.fill();
}
/** anchor the genome tint toward a colour the animal IS (D-ART-61) */
function anchor(p: Pal, ar: number, ag: number, ab: number, k: number): Pal {
  const j = 1 - k;
  const cr = (ar * k + p.cr * j) | 0, cg = (ag * k + p.cg * j) | 0, cb = (ab * k + p.cb * j) | 0;
  return {
    base: `rgb(${cr},${cg},${cb})`, cr, cg, cb,
    lit: `rgb(${Math.min(255, cr * 1.34 | 0)},${Math.min(255, cg * 1.34 | 0)},${Math.min(255, cb * 1.34 | 0)})`,
    dark: `rgb(${cr * 0.44 | 0},${cg * 0.44 | 0},${cb * 0.44 | 0})`,
  };
}
/** fur that BREAKS THE SILHOUETTE and lies on the body (THE SURFACE LAWS) */
function pelt(c: Ctx, p: Pal, r: () => number, at: (a: number) => [number, number, number], n: number, L: number): void {
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * TAU;
    const [x, y, nrm] = at(a);
    const nx = Math.cos(nrm), ny = Math.sin(nrm);
    const l = L * (0.5 + r() * 0.9);
    const key = (-nx * 0.5 - ny * 0.86) * 0.5 + 0.5;
    c.strokeStyle = shade(p, 0.60 + key * 0.62);
    c.globalAlpha = 0.24 + r() * 0.40; c.lineWidth = 0.9 + r() * 1.1;
    c.beginPath(); c.moveTo(x - nx * l * 0.5, y - ny * l * 0.5);
    c.quadraticCurveTo(x + nx * l * 0.4, y + ny * l * 0.4 + l * 0.2, x + nx * l * 0.75, y + ny * l * 0.8 + l * 0.35);
    c.stroke();
  }
  c.globalAlpha = 1;
}

/* ── BEAR: the audit called it "unusually spiky and weakly bear-like". A bear
   is MASS — a shoulder hump higher than the rump, a heavy low head, and four
   thick pillars ending in plantigrade paws. ── */
export function faunaBear(c: Ctx, g: G, pIn: Pal): void {
  const p = anchor(pIn, 96, 72, 52, 0.62);
  const r = nrng(g, 'Bear', 0xBEA7);
  const cx = S * 0.50, cy = S * 0.50, L = S * 0.215, H = S * 0.125;
  const floorY = cy + H + S * 0.115;
  shadow(c, cx, floorY + 3, L * 0.94);
  /* the four legs — a bear's are COLUMNS, not sticks; the far pair first */
  const leg = (lx: number, w: number, dim: boolean): void => {
    c.fillStyle = dim ? shade(p, 0.44) : shade(p, 0.72);
    c.beginPath();
    c.moveTo(lx - w, cy + H * 0.30);
    c.quadraticCurveTo(lx - w * 1.1, floorY - S * 0.02, lx - w * 0.95, floorY);
    c.lineTo(lx + w * 0.95, floorY);
    c.quadraticCurveTo(lx + w * 1.1, floorY - S * 0.02, lx + w, cy + H * 0.30);
    c.closePath(); c.fill();
    /* the PLANTIGRADE PAW — a bear walks on its whole sole, and that flat
       broad foot is half of why a bear looks like a bear */
    c.fillStyle = dim ? shade(p, 0.36) : shade(p, 0.55);
    c.beginPath(); c.ellipse(lx + w * 0.25, floorY - S * 0.006, w * 1.5, S * 0.017, 0, 0, TAU); c.fill();
    if (!dim) {
      c.fillStyle = 'rgba(240,236,224,0.75)';
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.ellipse(lx + w * 0.9 + i * w * 0.22, floorY - S * 0.014, 2.2, 3.4, -0.3, 0, TAU); c.fill();
      }
    }
  };
  leg(cx - L * 0.52, S * 0.030, true); leg(cx + L * 0.46, S * 0.030, true);
  /* THE BODY — the back line rises to a shoulder hump ahead of centre and
     falls away to a low rump. A flat back is a dog. */
  c.fillStyle = volume(c, p, cx, cy, L);
  c.beginPath();
  c.moveTo(cx - L * 0.98, cy + H * 0.20);
  c.bezierCurveTo(cx - L * 1.06, cy - H * 0.60, cx - L * 0.30, cy - H * 0.86, cx + L * 0.28, cy - H * 1.16);
  c.bezierCurveTo(cx + L * 0.62, cy - H * 1.30, cx + L * 0.92, cy - H * 0.86, cx + L * 1.00, cy - H * 0.20);
  c.bezierCurveTo(cx + L * 1.06, cy + H * 0.62, cx + L * 0.5, cy + H * 0.96, cx, cy + H * 0.96);
  c.bezierCurveTo(cx - L * 0.5, cy + H * 0.96, cx - L * 0.94, cy + H * 0.74, cx - L * 0.98, cy + H * 0.20);
  c.closePath(); c.fill();
  /* the hump's own mass, read as a soft lit lobe over the shoulder */
  const hg = c.createRadialGradient(cx + L * 0.34, cy - H * 0.86, 4, cx + L * 0.34, cy - H * 0.6, L * 0.5);
  hg.addColorStop(0, `rgba(255,255,255,0.16)`); hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hg; c.beginPath(); c.ellipse(cx + L * 0.34, cy - H * 0.70, L * 0.42, H * 0.5, 0, 0, TAU); c.fill();
  leg(cx - L * 0.30, S * 0.034, false); leg(cx + L * 0.62, S * 0.034, false);
  /* THE HEAD — carried LOW, ahead of and below the shoulder hump */
  const hx = cx + L * 1.12, hy = cy - H * 0.36, hr = H * 0.60;
  c.fillStyle = shade(p, 0.78);
  c.beginPath(); c.moveTo(cx + L * 0.72, cy - H * 0.92);
  c.quadraticCurveTo(hx - hr * 0.6, hy - hr * 0.9, hx, hy - hr * 0.5);
  c.lineTo(hx, hy + hr * 0.7); c.quadraticCurveTo(cx + L * 0.85, cy + H * 0.10, cx + L * 0.72, cy - H * 0.2);
  c.closePath(); c.fill();
  for (const s of [-1, 1] as const) {   /* the small round ears, set wide and low */
    c.fillStyle = shade(p, s < 0 ? 0.52 : 0.86);
    c.beginPath(); c.arc(hx - hr * 0.42 + s * hr * 0.10, hy - hr * 0.86 + s * hr * 0.08, hr * 0.30, 0, TAU); c.fill();
    c.fillStyle = shade(p, 0.36);
    c.beginPath(); c.arc(hx - hr * 0.42 + s * hr * 0.10, hy - hr * 0.84 + s * hr * 0.08, hr * 0.17, 0, TAU); c.fill();
  }
  c.fillStyle = volume(c, p, hx, hy, hr);
  c.beginPath(); c.ellipse(hx, hy, hr * 1.02, hr * 0.90, 0.06, 0, TAU); c.fill();
  /* the long straight MUZZLE and the black nose pad */
  c.fillStyle = shade(p, 1.12);
  c.beginPath();
  c.moveTo(hx + hr * 0.30, hy - hr * 0.44);
  c.quadraticCurveTo(hx + hr * 1.42, hy - hr * 0.34, hx + hr * 1.52, hy + hr * 0.06);
  c.quadraticCurveTo(hx + hr * 1.42, hy + hr * 0.60, hx + hr * 0.30, hy + hr * 0.62);
  c.closePath(); c.fill();
  c.fillStyle = '#1a1512';
  c.beginPath(); c.ellipse(hx + hr * 1.44, hy + hr * 0.02, hr * 0.20, hr * 0.16, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(16,12,10,0.42)'; c.lineWidth = 2.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx + hr * 1.36, hy + hr * 0.24);
  c.quadraticCurveTo(hx + hr * 0.9, hy + hr * 0.50, hx + hr * 0.44, hy + hr * 0.38); c.stroke();
  eye(c, hx + hr * 0.34, hy - hr * 0.22, hr * 0.13);
  /* THE SHAGGY COAT, last, breaking the whole outline */
  pelt(c, p, r, (a) => {
    const s0 = 0.80 + r() * 0.22;
    return [cx + Math.cos(a) * L * s0, cy + Math.sin(a) * H * s0 - H * 0.1, a];
  }, 300, S * 0.030);
}

/* ── KOALA: the audit said it reads rabbit-like. A koala is a HEAD — huge
   round fluffy ears, a big leathery nose, no tail, hugging a trunk. ── */
export function faunaKoala(c: Ctx, g: G, pIn: Pal): void {
  const p = anchor(pIn, 150, 152, 156, 0.66);
  const r = nrng(g, 'Koala', 0xC0A1);
  const cx = S * 0.50, cy = S * 0.56;
  /* the trunk it is clamped to — a koala is almost never on the ground */
  const tg = c.createLinearGradient(cx - S * 0.10, 0, cx + S * 0.10, 0);
  tg.addColorStop(0, '#3a2b20'); tg.addColorStop(0.45, '#5b4634'); tg.addColorStop(1, '#2b2018');
  /* ★ wave 22 — the trunk ran the full frame, so the fit pass measured the TREE
     and shrank the koala to nothing (proportioncheck: aspect 0.44, the worst in
     631). A prop must never out-measure its subject. */
  c.fillStyle = tg; c.fillRect(cx - S * 0.085, S * 0.20, S * 0.17, S * 0.62);
  c.strokeStyle = 'rgba(24,18,12,0.45)'; c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = cx - S * 0.07 + r() * S * 0.14;
    c.beginPath(); c.moveTo(x, S * 0.21); c.lineTo(x + (r() - 0.5) * 10, S * 0.81); c.stroke();
  }
  /* the compact body, squatting against the bark */
  const bw = S * 0.135, bh = S * 0.155;
  c.fillStyle = volume(c, p, cx, cy + bh * 0.2, bw);
  c.beginPath(); c.ellipse(cx, cy + bh * 0.22, bw, bh, 0, 0, TAU); c.fill();
  /* THE GRASPING LIMBS — a koala's hands wrap the trunk, thumbs opposed */
  for (const [ax, ay, ang] of [[-1, -0.15, 2.5], [1, -0.10, 0.7], [-1, 0.62, 2.1], [1, 0.66, 1.1]] as const) {
    const lx = cx + ax * bw * 0.82, ly = cy + bh * ay;
    c.strokeStyle = shade(p, 0.62); c.lineWidth = S * 0.036; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + ax * bw * 0.35, cy + bh * (ay + 0.18));
    c.quadraticCurveTo(lx, ly + bh * 0.1, lx + ax * bw * 0.22, ly - bh * 0.12); c.stroke();
    c.strokeStyle = shade(p, 0.42); c.lineWidth = 3.4;
    for (let i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(lx + ax * bw * 0.22, ly - bh * 0.12);
      c.lineTo(lx + ax * bw * 0.34, ly - bh * 0.12 + i * 8 + Math.cos(ang) * 2); c.stroke();
    }
  }
  /* THE EARS, drawn before the head so the head overlaps their roots. They are
     enormous, round, and fringed — the single loudest koala cue. */
  const hx = cx, hy = cy - S * 0.105, hr = S * 0.098;
  for (const s of [-1, 1] as const) {
    const ex = hx + s * hr * 1.02, ey = hy + hr * 0.04;
    c.fillStyle = shade(p, s < 0 ? 0.70 : 0.92);
    c.beginPath(); c.arc(ex, ey, hr * 0.72, 0, TAU); c.fill();
    c.fillStyle = shade(p, 0.44);
    c.beginPath(); c.arc(ex + s * hr * 0.08, ey, hr * 0.44, 0, TAU); c.fill();
    /* the white fringe that makes the ear read as FLUFF, not a disc */
    c.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const a = r() * TAU, L = 7 + r() * 11;
      c.strokeStyle = `rgba(238,240,244,${0.24 + r() * 0.42})`; c.lineWidth = 1.2;
      const x0 = ex + Math.cos(a) * hr * 0.66, y0 = ey + Math.sin(a) * hr * 0.66;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); c.stroke();
    }
  }
  c.fillStyle = volume(c, p, hx, hy, hr);
  c.beginPath(); c.ellipse(hx, hy, hr, hr * 0.96, 0, 0, TAU); c.fill();
  /* THE NOSE — big, black, leathery, spanning a third of the face */
  c.fillStyle = '#181518';
  c.beginPath();
  c.moveTo(hx, hy + hr * 0.02);
  c.bezierCurveTo(hx + hr * 0.40, hy + hr * 0.10, hx + hr * 0.34, hy + hr * 0.72, hx, hy + hr * 0.74);
  c.bezierCurveTo(hx - hr * 0.34, hy + hr * 0.72, hx - hr * 0.40, hy + hr * 0.10, hx, hy + hr * 0.02);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.20)';
  c.beginPath(); c.ellipse(hx - hr * 0.14, hy + hr * 0.22, hr * 0.12, hr * 0.07, -0.4, 0, TAU); c.fill();
  eye(c, hx - hr * 0.40, hy - hr * 0.14, hr * 0.115);
  eye(c, hx + hr * 0.40, hy - hr * 0.14, hr * 0.115);
  pelt(c, p, r, (a) => [hx + Math.cos(a) * hr * (0.86 + r() * 0.2), hy + Math.sin(a) * hr * (0.86 + r() * 0.2), a], 120, S * 0.020);
  pelt(c, p, r, (a) => [cx + Math.cos(a) * bw * (0.84 + r() * 0.2), cy + bh * 0.22 + Math.sin(a) * bh * (0.84 + r() * 0.2), a], 160, S * 0.022);
}

/* ── SIRENIAN (Dugong + Manatee): both fell through to the verbatim engine as
   SPHERES. A sirenian is a long fusiform barrel with paddle flippers, a
   downturned bristled muzzle, and no dorsal fin at all. ── */
export function faunaSirenian(c: Ctx, g: G, pIn: Pal, name = 'Manatee'): void {
  const fluked = name === 'Dugong';        /* a dugong has a whale's fluke; a manatee a paddle */
  const p = anchor(pIn, 132, 128, 118, 0.58);
  const r = nrng(g, name, 0x51E4);
  const cx = S * 0.48, cy = S * 0.50, L = S * 0.255, H = S * 0.100;
  shadow(c, cx, cy + H * 2.4, L * 0.8, 0.30);
  /* THE TAIL, behind the body */
  c.fillStyle = shade(p, 0.62);
  if (fluked) {
    c.beginPath();
    c.moveTo(cx - L * 0.80, cy);
    c.quadraticCurveTo(cx - L * 1.16, cy - H * 0.30, cx - L * 1.40, cy - H * 0.86);
    c.quadraticCurveTo(cx - L * 1.06, cy - H * 0.18, cx - L * 1.06, cy + H * 0.10);
    c.quadraticCurveTo(cx - L * 1.06, cy + H * 0.32, cx - L * 1.40, cy + H * 0.96);
    c.quadraticCurveTo(cx - L * 1.16, cy + H * 0.36, cx - L * 0.80, cy + H * 0.08);
    c.closePath(); c.fill();
  } else {
    c.beginPath(); c.ellipse(cx - L * 1.10, cy + H * 0.10, L * 0.34, H * 1.02, -0.12, 0, TAU); c.fill();
    c.strokeStyle = shade(p, 0.44); c.lineWidth = 1.8;
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(cx - L * 0.86, cy + H * 0.10);
      c.lineTo(cx - L * 1.40, cy + H * 0.10 + i * H * 0.34); c.stroke();
    }
  }
  /* the far flipper */
  c.fillStyle = shade(p, 0.50);
  c.save(); c.translate(cx + L * 0.28, cy + H * 0.42); c.rotate(0.5);
  c.beginPath(); c.ellipse(0, 0, L * 0.24, H * 0.30, 0, 0, TAU); c.fill(); c.restore();
  /* THE BODY — a long barrel, deepest just behind the shoulder, tapering both
     ways. No dorsal fin: its absence is as diagnostic as any feature here. */
  const bg = c.createLinearGradient(0, cy - H * 1.5, 0, cy + H * 1.5);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.42, p.base); bg.addColorStop(1, p.dark);
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(cx - L * 0.84, cy - H * 0.20);
  c.bezierCurveTo(cx - L * 0.30, cy - H * 1.06, cx + L * 0.40, cy - H * 1.10, cx + L * 0.88, cy - H * 0.60);
  c.bezierCurveTo(cx + L * 1.16, cy - H * 0.22, cx + L * 1.12, cy + H * 0.42, cx + L * 0.80, cy + H * 0.78);
  c.bezierCurveTo(cx + L * 0.30, cy + H * 1.14, cx - L * 0.36, cy + H * 1.02, cx - L * 0.84, cy + H * 0.24);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(224,232,244,0.24)'; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - L * 0.84, cy - H * 0.20);
  c.bezierCurveTo(cx - L * 0.30, cy - H * 1.06, cx + L * 0.40, cy - H * 1.10, cx + L * 0.88, cy - H * 0.60);
  c.stroke();
  /* the wrinkled hide sirenians carry — soft folds that WRAP the barrel */
  c.strokeStyle = `rgba(${p.cr * 0.42 | 0},${p.cg * 0.42 | 0},${p.cb * 0.42 | 0},0.26)`;
  c.lineWidth = 2.4;
  for (let i = 0; i < 7; i++) {
    const u = 0.10 + i * 0.11;
    const x = cx - L * 0.8 + u * L * 1.7;
    c.beginPath(); c.moveTo(x, cy - H * (1.02 - Math.abs(u - 0.5) * 0.5));
    c.quadraticCurveTo(x - H * 0.24, cy, x, cy + H * (0.96 - Math.abs(u - 0.5) * 0.4)); c.stroke();
  }
  /* the near flipper, with the manatee's fingernails */
  c.fillStyle = shade(p, 0.80);
  c.save(); c.translate(cx + L * 0.44, cy + H * 0.66); c.rotate(0.62);
  c.beginPath(); c.ellipse(0, 0, L * 0.28, H * 0.34, 0, 0, TAU); c.fill();
  if (!fluked) {
    c.fillStyle = 'rgba(240,236,226,0.65)';
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(-L * 0.20, i * H * 0.16, 3, 4.4, 0, 0, TAU); c.fill(); }
  }
  c.restore();
  /* THE MUZZLE — turned sharply DOWN, blunt, and covered in stiff bristles */
  const mx = cx + L * 0.92, my = cy - H * 0.10;
  c.fillStyle = shade(p, 0.92);
  c.beginPath();
  c.moveTo(mx - H * 0.5, my - H * 0.55);
  c.quadraticCurveTo(mx + H * 0.62, my - H * 0.42, mx + H * 0.58, my + H * 0.30);
  c.quadraticCurveTo(mx + H * 0.44, my + H * 0.86, mx - H * 0.30, my + H * 0.80);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(24,22,20,0.55)';
  c.beginPath(); c.ellipse(mx + H * 0.30, my + H * 0.56, H * 0.20, H * 0.13, 0.2, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(30,26,22,0.42)'; c.lineWidth = 1.3; c.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const a = -0.4 + r() * 1.9, d = H * (0.30 + r() * 0.28);
    c.beginPath(); c.moveTo(mx + H * 0.18, my + H * 0.40);
    c.lineTo(mx + H * 0.18 + Math.cos(a) * d, my + H * 0.40 + Math.sin(a) * d); c.stroke();
  }
  c.fillStyle = 'rgba(20,18,16,0.5)';   /* the nostril, high on the snout */
  c.beginPath(); c.ellipse(mx + H * 0.10, my - H * 0.30, H * 0.10, H * 0.07, 0, 0, TAU); c.fill();
  eye(c, cx + L * 0.66, cy - H * 0.42, Math.max(3.4, H * 0.085));
}

/* ── HUMPBACK WHALE: the audit wants the long pectorals and the knobbly head.
   Those flippers are a THIRD of the animal — the longest in the ocean. ── */
export function faunaHumpback(c: Ctx, g: G, pIn: Pal): void {
  const p = anchor(pIn, 62, 74, 88, 0.50);
  const r = nrng(g, 'Humpback Whale', 0x4B0B);
  const cx = S * 0.46, cy = S * 0.48, L = S * 0.285, H = S * 0.085;
  shadow(c, cx, cy + H * 3.0, L * 0.7, 0.26);
  /* the far flipper, sweeping up behind */
  const flipper = (ang: number, k: number, dim: number): void => {
    c.save(); c.translate(cx + L * 0.16, cy + H * 0.42); c.rotate(ang);
    c.globalAlpha = dim;
    const fg = c.createLinearGradient(0, 0, L * 0.98 * k, 0);
    fg.addColorStop(0, p.dark); fg.addColorStop(0.5, p.base);
    fg.addColorStop(1, 'rgba(238,242,248,0.92)');   /* the white underside of the wing */
    c.fillStyle = fg;
    c.beginPath();
    c.moveTo(0, -H * 0.34);
    c.bezierCurveTo(L * 0.42 * k, -H * 0.72, L * 0.86 * k, -H * 0.58, L * 1.00 * k, -H * 0.02);
    c.quadraticCurveTo(L * 0.94 * k, H * 0.28, L * 0.80 * k, H * 0.22);
    c.bezierCurveTo(L * 0.44 * k, H * 0.44, L * 0.16 * k, H * 0.50, 0, H * 0.40);
    c.closePath(); c.fill();
    /* THE SCALLOPED LEADING EDGE — a humpback's flipper is knobbed, and that
       bumpy edge is the one detail that separates it from every other whale */
    c.strokeStyle = 'rgba(232,238,246,0.42)'; c.lineWidth = 2;
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const x = u * L * k, y = -H * (0.34 + Math.sin(u * Math.PI) * 0.38) + Math.sin(u * 26) * 2.4;
      if (!i) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    c.globalAlpha = 1; c.restore();
  };
  flipper(-0.95, 0.72, 0.55);
  /* the fluke */
  c.fillStyle = p.dark;
  c.beginPath();
  c.moveTo(cx - L * 0.86, cy);
  c.quadraticCurveTo(cx - L * 1.16, cy - H * 0.36, cx - L * 1.42, cy - H * 1.10);
  c.quadraticCurveTo(cx - L * 1.06, cy - H * 0.22, cx - L * 1.04, cy + H * 0.06);
  c.quadraticCurveTo(cx - L * 1.06, cy + H * 0.34, cx - L * 1.42, cy + H * 1.16);
  c.quadraticCurveTo(cx - L * 1.16, cy + H * 0.44, cx - L * 0.86, cy + H * 0.10);
  c.closePath(); c.fill();
  /* THE BODY */
  const bg = c.createLinearGradient(0, cy - H * 1.6, 0, cy + H * 1.6);
  bg.addColorStop(0, p.dark); bg.addColorStop(0.5, p.base);
  bg.addColorStop(0.72, p.lit); bg.addColorStop(1, 'rgb(226,232,240)');   /* the pale pleated throat */
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(cx - L * 0.88, cy - H * 0.16);
  c.bezierCurveTo(cx - L * 0.30, cy - H * 1.14, cx + L * 0.44, cy - H * 1.02, cx + L * 1.02, cy - H * 0.46);
  c.bezierCurveTo(cx + L * 1.22, cy - H * 0.14, cx + L * 1.14, cy + H * 0.52, cx + L * 0.86, cy + H * 0.86);
  c.bezierCurveTo(cx + L * 0.30, cy + H * 1.26, cx - L * 0.34, cy + H * 1.00, cx - L * 0.88, cy + H * 0.22);
  c.closePath(); c.fill();
  /* the small stubby dorsal, sat on a hump two-thirds back */
  c.fillStyle = p.dark;
  c.beginPath(); c.moveTo(cx - L * 0.30, cy - H * 0.98);
  c.quadraticCurveTo(cx - L * 0.14, cy - H * 1.64, cx + L * 0.04, cy - H * 1.02);
  c.closePath(); c.fill();
  /* THE VENTRAL PLEATS — the grooves down the throat */
  c.strokeStyle = 'rgba(70,84,100,0.34)'; c.lineWidth = 1.8;
  for (let i = 0; i < 11; i++) {
    const u = i / 10;
    c.beginPath(); c.moveTo(cx + L * (0.98 - u * 0.14), cy + H * (0.30 + u * 0.16));
    c.quadraticCurveTo(cx + L * 0.30, cy + H * (1.10 + u * 0.04), cx - L * 0.28, cy + H * (0.70 - u * 0.30));
    c.stroke();
  }
  /* THE TUBERCLES — the knobbly head. Each is a hair follicle in a bump, and
     they run the rostrum and the jawline in two rows. */
  for (const row of [[-0.62, 12], [-0.18, 10], [0.44, 9]] as const) {
    const [off, n] = row;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const x = cx + L * (0.42 + u * 0.62);
      const y = cy + H * off * (1 - u * 0.30) + Math.sin(u * 3) * 2 + (r() - 0.5) * 5;
      const q = (3.4 - u * 1.0) * (0.72 + r() * 0.6);
      const kg = c.createRadialGradient(x - q * 0.3, y - q * 0.4, 0.5, x, y, q);
      kg.addColorStop(0, shade(p, 1.55)); kg.addColorStop(1, shade(p, 0.65));
      c.fillStyle = kg; c.beginPath(); c.arc(x, y, q, 0, TAU); c.fill();
    }
  }
  flipper(0.58, 1, 1);   /* the near flipper, over the body — the one that reads */
  eye(c, cx + L * 0.80, cy - H * 0.02, Math.max(3.2, H * 0.10));
}

/* ── BEAKED WHALE: a long slim body drawn out into an actual BEAK, with the
   two tusks a male carries at the tip of the lower jaw. ── */
export function faunaBeakedWhale(c: Ctx, g: G, pIn: Pal): void {
  const p = anchor(pIn, 84, 88, 96, 0.52);
  const r = nrng(g, 'Beaked Whale', 0xBEA4);
  const cx = S * 0.44, cy = S * 0.50, L = S * 0.250, H = S * 0.070;
  shadow(c, cx, cy + H * 3.2, L * 0.66, 0.26);
  c.fillStyle = p.dark;   /* the fluke */
  c.beginPath();
  c.moveTo(cx - L * 0.90, cy);
  c.quadraticCurveTo(cx - L * 1.18, cy - H * 0.40, cx - L * 1.38, cy - H * 1.05);
  c.quadraticCurveTo(cx - L * 1.10, cy - H * 0.20, cx - L * 1.08, cy + H * 0.06);
  c.quadraticCurveTo(cx - L * 1.10, cy + H * 0.36, cx - L * 1.38, cy + H * 1.12);
  c.quadraticCurveTo(cx - L * 1.18, cy + H * 0.48, cx - L * 0.90, cy + H * 0.10);
  c.closePath(); c.fill();
  const bg = c.createLinearGradient(0, cy - H * 1.6, 0, cy + H * 1.6);
  bg.addColorStop(0, p.dark); bg.addColorStop(0.48, p.base); bg.addColorStop(1, p.lit);
  c.fillStyle = bg;
  /* the body runs SMOOTHLY into the beak — a rostrum bolted on at the nose is
     the failure this whole wave is about */
  c.beginPath();
  c.moveTo(cx - L * 0.92, cy - H * 0.12);
  c.bezierCurveTo(cx - L * 0.34, cy - H * 1.10, cx + L * 0.30, cy - H * 1.05, cx + L * 0.78, cy - H * 0.66);
  c.bezierCurveTo(cx + L * 1.02, cy - H * 0.50, cx + L * 1.24, cy - H * 0.30, cx + L * 1.46, cy - H * 0.22);
  c.quadraticCurveTo(cx + L * 1.54, cy - H * 0.06, cx + L * 1.46, cy + H * 0.10);
  c.bezierCurveTo(cx + L * 1.20, cy + H * 0.20, cx + L * 1.00, cy + H * 0.44, cx + L * 0.76, cy + H * 0.78);
  c.bezierCurveTo(cx + L * 0.28, cy + H * 1.18, cx - L * 0.36, cy + H * 1.00, cx - L * 0.92, cy + H * 0.18);
  c.closePath(); c.fill();
  /* the MELON — the bulging forehead that sits right behind the beak */
  const mg = c.createRadialGradient(cx + L * 0.62, cy - H * 0.72, 3, cx + L * 0.66, cy - H * 0.40, H * 1.5);
  mg.addColorStop(0, 'rgba(255,255,255,0.24)'); mg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = mg;
  c.beginPath(); c.ellipse(cx + L * 0.64, cy - H * 0.42, L * 0.24, H * 0.86, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(226,234,246,0.26)'; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx + L * 0.20, cy - H * 1.00);
  c.bezierCurveTo(cx + L * 0.52, cy - H * 1.02, cx + L * 1.10, cy - H * 0.42, cx + L * 1.44, cy - H * 0.20);
  c.stroke();
  c.fillStyle = p.dark;   /* the small far-back dorsal */
  c.beginPath(); c.moveTo(cx - L * 0.42, cy - H * 0.94);
  c.quadraticCurveTo(cx - L * 0.30, cy - H * 1.86, cx - L * 0.06, cy - H * 0.98);
  c.closePath(); c.fill();
  for (const s of [-1, 1] as const) {   /* the flippers, small and tucked */
    c.fillStyle = shade(p, s < 0 ? 0.52 : 0.80);
    c.save(); c.translate(cx + L * 0.34, cy + H * (0.60 + s * 0.14)); c.rotate(0.5 + s * 0.16);
    c.beginPath(); c.ellipse(0, 0, L * 0.20, H * 0.24, 0, 0, TAU); c.fill(); c.restore();
  }
  /* THE TUSKS — two teeth erupting from the LOWER jaw, near its tip */
  c.fillStyle = '#efe9d8';
  for (const dx of [1.16, 1.30] as const) {
    c.beginPath();
    c.moveTo(cx + L * dx, cy + H * 0.16);
    c.lineTo(cx + L * (dx + 0.02), cy - H * 0.30);
    c.lineTo(cx + L * (dx + 0.07), cy + H * 0.18);
    c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(18,24,32,0.42)'; c.lineWidth = 2.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx + L * 1.42, cy + H * 0.06);
  c.quadraticCurveTo(cx + L * 1.00, cy + H * 0.34, cx + L * 0.70, cy + H * 0.42); c.stroke();
  /* the scarring older males wear — long pale rake marks that WRAP the flank */
  c.strokeStyle = 'rgba(238,242,248,0.26)'; c.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) {
    const x0 = cx - L * (0.5 + r() * 0.9), y0 = cy + (r() - 0.5) * H * 1.5;
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo(x0 + L * 0.14, y0 + H * 0.18, x0 + L * 0.30, y0 + H * 0.10); c.stroke();
  }
  c.fillStyle = 'rgba(18,22,28,0.5)';   /* the crescent blowhole */
  c.beginPath(); c.ellipse(cx + L * 0.42, cy - H * 1.02, H * 0.18, H * 0.08, -0.2, 0, TAU); c.fill();
  eye(c, cx + L * 0.86, cy - H * 0.06, Math.max(3, H * 0.11));
}

/* ── CUTTLEFISH: the audit says it is too octopus-like. A cuttlefish is a broad
   flat MANTLE with a continuous fin skirt running its whole length, eight short
   arms, two long tentacles, and a W-shaped pupil. ── */
export function faunaCuttlefish(c: Ctx, g: G, p: Pal): void {
  const r = nrng(g, 'Cuttlefish', 0xC77F);
  const cx = S * 0.50, cy = S * 0.44, mw = S * 0.175, mh = S * 0.185;
  shadow(c, cx, S * 0.88, mw * 1.1, 0.28);
  /* THE FIN SKIRT — a continuous undulating membrane down BOTH sides, the
     single feature that separates a cuttlefish from an octopus at a glance */
  for (const s of [-1, 1] as const) {
    c.fillStyle = `rgba(${Math.min(255, p.cr + 76)},${Math.min(255, p.cg + 84)},${Math.min(255, p.cb + 104)},0.50)`;
    c.beginPath();
    /* the inner edge FOLLOWS THE MANTLE ELLIPSE. Held at a constant width it
       stood off the body at the ends and read as two grey slabs floating
       either side of the animal — a fin is attached along its whole root. */
    const rootAt = (u: number): [number, number] => {
      const v = (u - 0.5) * 2;                         /* -1 .. 1 down the mantle */
      const y = cy + v * mh * 0.88;
      const x = cx + s * mw * 0.86 * Math.sqrt(Math.max(0, 1 - v * v * 0.97));
      return [x, y];
    };
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      const [rx, ry] = rootAt(u);
      const flare = mw * (0.14 + Math.sin(u * Math.PI) * 0.46) + Math.sin(u * 11) * mw * 0.04;
      if (!i) c.moveTo(rx, ry); else c.lineTo(rx + s * flare, ry);
    }
    for (let i = 30; i >= 0; i--) { const [rx, ry] = rootAt(i / 30); c.lineTo(rx, ry); }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(236,244,255,0.26)'; c.lineWidth = 1.4; c.stroke();
    /* the fin rays rippling down it */
    c.strokeStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.30)`; c.lineWidth = 1.2;
    for (let i = 2; i < 28; i += 2) {
      const u = i / 30; const [rx, ry] = rootAt(u);
      const flare = mw * (0.14 + Math.sin(u * Math.PI) * 0.46);
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + s * flare * 0.92, ry); c.stroke();
    }
  }
  /* THE ARMS — eight SHORT ones in a tight crown, not long trailing octopus
     limbs, plus the two long feeding tentacles */
  for (let i = 0; i < 8; i++) {
    const u = (i / 7) * 2 - 1;
    const ax = cx + u * mw * 0.52, ay = cy + mh * 0.74;
    c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = 11 - Math.abs(u) * 3.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax, ay);
    c.quadraticCurveTo(ax + u * mw * 0.30, ay + mh * 0.30, ax + u * mw * 0.52, ay + mh * 0.46);
    c.stroke();
  }
  for (const s of [-1, 1] as const) {
    c.strokeStyle = p.dark; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + s * mw * 0.18, cy + mh * 0.76);
    c.quadraticCurveTo(cx + s * mw * 0.70, cy + mh * 1.10, cx + s * mw * 0.44, cy + mh * 1.44);
    c.stroke();
    c.fillStyle = p.base;
    c.beginPath(); c.ellipse(cx + s * mw * 0.44, cy + mh * 1.46, 5, 9, s * 0.3, 0, TAU); c.fill();
  }
  /* THE MANTLE — a broad flattened oval, widest across the middle */
  const bg = c.createLinearGradient(cx - mw, 0, cx + mw, 0);
  bg.addColorStop(0, p.dark); bg.addColorStop(0.38, p.lit); bg.addColorStop(1, p.dark);
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(cx, cy, mw * 0.86, mh * 0.90, 0, 0, TAU); c.fill();
  /* THE ZEBRA BANDS a cuttlefish flashes — wrapped, so they lie ON the mantle */
  const bandPhase = r() * TAU;
  for (let i = 0; i < 6; i++) {
    const u = (i / 5) * 2 - 1;
    const x = cx + u * mw * 0.78;
    const fore = Math.sqrt(Math.max(0.05, 1 - u * u));
    c.strokeStyle = `rgba(28,32,40,${0.06 + fore * 0.17 * (0.6 + 0.6 * Math.abs(Math.sin(bandPhase + i)))})`;
    c.lineWidth = 5 * fore;
    c.beginPath(); c.ellipse(x, cy, mw * 0.10 * fore, mh * 0.84 * fore, 0, -1.5, 1.5); c.stroke();
  }
  c.strokeStyle = 'rgba(232,242,255,0.32)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, mw * 0.86, mh * 0.90, 0, 0, TAU); c.stroke();
  /* THE W PUPIL — a cuttlefish's eye is unmistakable and nothing else has it */
  for (const s of [-1, 1] as const) {
    const ex = cx + s * mw * 0.50, ey = cy + mh * 0.50;
    c.fillStyle = 'rgba(232,226,196,0.95)';
    c.beginPath(); c.ellipse(ex, ey, mw * 0.20, mh * 0.13, 0, 0, TAU); c.fill();
    c.strokeStyle = '#0b0e13'; c.lineWidth = 4.4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(ex - mw * 0.15, ey - mh * 0.02);
    c.lineTo(ex - mw * 0.05, ey + mh * 0.05);
    c.lineTo(ex + mw * 0.03, ey - mh * 0.02);
    c.lineTo(ex + mw * 0.14, ey + mh * 0.04);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.arc(ex - mw * 0.08, ey - mh * 0.06, 2.4, 0, TAU); c.fill();
  }
}

/* ── HORSESHOE CRAB: seen FROM ABOVE, because the horseshoe outline and the
   long rigid telson only exist in that view. ── */
export function faunaHorseshoeCrab(c: Ctx, g: G, pIn: Pal): void {
  const p = anchor(pIn, 118, 86, 56, 0.50);
  const r = nrng(g, 'Horseshoe Crab', 0x405E);
  const cx = S * 0.50, cy = S * 0.44, w = S * 0.200;
  shadow(c, cx, S * 0.88, w * 0.9, 0.30);
  /* THE TELSON — a long rigid spike, a third of the animal, drawn first */
  const tg = c.createLinearGradient(cx - 6, cy, cx + 6, cy);
  tg.addColorStop(0, p.dark); tg.addColorStop(0.4, p.base); tg.addColorStop(1, p.dark);
  c.fillStyle = tg;
  c.beginPath();
  c.moveTo(cx - w * 0.075, cy + w * 0.50);
  c.lineTo(cx + w * 0.075, cy + w * 0.50);
  c.lineTo(cx + w * 0.012, cy + w * 1.86);
  c.lineTo(cx - w * 0.012, cy + w * 1.86);
  c.closePath(); c.fill();
  /* the abdomen (opisthosoma): a hexagonal plate with movable lateral spines */
  c.fillStyle = p.dark;
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      c.beginPath();
      c.moveTo(cx + s * w * (0.34 - u * 0.10), cy + w * (0.10 + u * 0.30));
      c.lineTo(cx + s * w * (0.62 - u * 0.22), cy + w * (0.24 + u * 0.34));
      c.lineTo(cx + s * w * (0.32 - u * 0.10), cy + w * (0.20 + u * 0.30));
      c.closePath(); c.fill();
    }
  }
  const ag = c.createRadialGradient(cx - w * 0.2, cy + w * 0.15, 4, cx, cy + w * 0.30, w * 0.7);
  ag.addColorStop(0, p.lit); ag.addColorStop(0.6, p.base); ag.addColorStop(1, p.dark);
  c.fillStyle = ag;
  c.beginPath();
  c.moveTo(cx - w * 0.40, cy + w * 0.02);
  c.lineTo(cx + w * 0.40, cy + w * 0.02);
  c.lineTo(cx + w * 0.30, cy + w * 0.46);
  c.lineTo(cx + w * 0.10, cy + w * 0.56);
  c.lineTo(cx - w * 0.10, cy + w * 0.56);
  c.lineTo(cx - w * 0.30, cy + w * 0.46);
  c.closePath(); c.fill();
  /* THE HORSESHOE — a broad domed shield with the two trailing points that
     give the animal its name. A plain dome (the audit's complaint) is a helmet. */
  const cg = c.createRadialGradient(cx - w * 0.30, cy - w * 0.34, 6, cx, cy - w * 0.10, w * 1.1);
  cg.addColorStop(0, p.lit); cg.addColorStop(0.55, p.base); cg.addColorStop(1, p.dark);
  c.fillStyle = cg;
  /* ⚠ WAVE 42/43, CODE PASS — A PATH BUILT AND THROWN AWAY, NOW REVIVED. Eight
     lines here described the shield as a proper ANNULUS: an outer sweep, then
     an inner return edge giving the carapace a raised rim with depth. It was
     never filled — the next statement opened a fresh path — so what shipped was
     the plain dome below. Silent, and invisible to every gate: the code ran,
     allocated, computed, and painted nothing.
     Wave 42 deleted it as dead weight; wave 43 restores it on Nick's call and
     FILLS it, so the marginal rim the author intended is actually drawn. The
     dome still underlies it, so the ridges, spines and tail placement tuned
     against that silhouette for twenty waves keep their ground; the annulus
     rides on top as the raised margin a horseshoe crab's carapace really has. */
  c.beginPath();
  c.moveTo(cx - w * 0.42, cy + w * 0.30);
  c.bezierCurveTo(cx - w * 1.02, cy + w * 0.22, cx - w * 1.06, cy - w * 0.66, cx, cy - w * 0.72);
  c.bezierCurveTo(cx + w * 1.06, cy - w * 0.66, cx + w * 1.02, cy + w * 0.22, cx + w * 0.42, cy + w * 0.30);
  c.lineTo(cx + w * 0.36, cy + w * 0.14);
  c.bezierCurveTo(cx + w * 0.80, cy + w * 0.06, cx + w * 0.72, cy - w * 0.48, cx, cy - w * 0.54);
  c.bezierCurveTo(cx - w * 0.72, cy - w * 0.48, cx - w * 0.80, cy + w * 0.06, cx - w * 0.36, cy + w * 0.14);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(cx - w * 0.44, cy + w * 0.34);
  c.bezierCurveTo(cx - w * 1.04, cy + w * 0.20, cx - w * 1.06, cy - w * 0.68, cx, cy - w * 0.74);
  c.bezierCurveTo(cx + w * 1.06, cy - w * 0.68, cx + w * 1.04, cy + w * 0.20, cx + w * 0.44, cy + w * 0.34);
  c.quadraticCurveTo(cx, cy + w * 0.16, cx - w * 0.44, cy + w * 0.34);
  c.closePath(); c.fill();
  /* the cardiac ridge and the two flanking ridges that vault the shield */
  c.strokeStyle = `rgba(${p.cr * 0.44 | 0},${p.cg * 0.44 | 0},${p.cb * 0.44 | 0},0.42)`;
  c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx, cy - w * 0.62); c.lineTo(cx, cy + w * 0.22); c.stroke();
  c.lineWidth = 2.2;
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + s * w * 0.22, cy - w * 0.52);
    c.quadraticCurveTo(cx + s * w * 0.34, cy - w * 0.10, cx + s * w * 0.30, cy + w * 0.20); c.stroke();
  }
  c.strokeStyle = 'rgba(240,232,214,0.34)'; c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(cx - w * 0.90, cy - w * 0.10);
  c.bezierCurveTo(cx - w * 0.86, cy - w * 0.60, cx + w * 0.86, cy - w * 0.60, cx + w * 0.90, cy - w * 0.10);
  c.stroke();
  /* the two compound eyes, set wide on the ridges */
  for (const s of [-1, 1] as const) {
    const ex = cx + s * w * 0.50, ey = cy - w * 0.30;
    c.fillStyle = 'rgba(26,20,14,0.8)';
    c.beginPath(); c.ellipse(ex, ey, w * 0.075, w * 0.045, s * 0.5, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,244,220,0.45)';
    c.beginPath(); c.ellipse(ex - s * w * 0.02, ey - w * 0.012, w * 0.03, w * 0.016, s * 0.5, 0, TAU); c.fill();
  }
  /* the pitted chitin */
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const x = cx + Math.cos(a) * w * 0.92 * d, y = cy - w * 0.16 + Math.sin(a) * w * 0.50 * d;
    c.fillStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.22)`;
    c.beginPath(); c.arc(x, y, 1.6 + r() * 1.6, 0, TAU); c.fill();
  }
}

/* ── SEA SQUIRT: an attached SAC with two siphons. The old fan form told the
   viewer nothing about what a tunicate is. ── */
export function faunaSeaSquirt(c: Ctx, g: G, p: Pal): void {
  const r = nrng(g, 'Sea Squirt', 0x5E45);
  /* the rock it is cemented to */
  c.fillStyle = 'rgba(38,44,52,0.9)';
  c.beginPath();
  c.moveTo(S * 0.10, S * 0.96);
  c.quadraticCurveTo(S * 0.24, S * 0.80, S * 0.50, S * 0.82);
  c.quadraticCurveTo(S * 0.78, S * 0.84, S * 0.92, S * 0.96);
  c.closePath(); c.fill();
  const body = (bx: number, by: number, bw: number, bh: number, dim: number): void => {
    c.globalAlpha = dim;
    /* THE TUNIC — a translucent leathery sac, wider at the base where it grips */
    const bgr = c.createLinearGradient(bx - bw, 0, bx + bw, 0);
    bgr.addColorStop(0, p.dark); bgr.addColorStop(0.36, p.lit); bgr.addColorStop(1, p.dark);
    c.fillStyle = bgr;
    c.beginPath();
    c.moveTo(bx - bw * 1.05, by + bh);
    c.bezierCurveTo(bx - bw * 0.92, by - bh * 0.55, bx - bw * 0.62, by - bh * 1.02, bx - bw * 0.30, by - bh);
    c.quadraticCurveTo(bx, by - bh * 1.12, bx + bw * 0.42, by - bh * 0.92);
    c.bezierCurveTo(bx + bw * 0.86, by - bh * 0.50, bx + bw * 0.98, by - bh * 0.10, bx + bw * 1.05, by + bh);
    c.closePath(); c.fill();
    /* THE TWO SIPHONS — one inhalant at the top, one exhalant on the shoulder.
       Each is a raised rim around a dark opening, which is what makes it a
       PORT rather than a spot. */
    const siph = (sx: number, sy: number, sr: number, ang: number): void => {
      c.save(); c.translate(sx, sy); c.rotate(ang);
      c.fillStyle = `rgb(${Math.min(255, p.cr * 1.25 | 0)},${Math.min(255, p.cg * 1.25 | 0)},${Math.min(255, p.cb * 1.25 | 0)})`;
      c.beginPath();
      c.moveTo(-sr * 1.05, sr * 1.5); c.quadraticCurveTo(-sr * 0.86, -sr * 0.3, -sr, -sr * 0.5);
      c.lineTo(sr, -sr * 0.5); c.quadraticCurveTo(sr * 0.86, -sr * 0.3, sr * 1.05, sr * 1.5);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(8,12,18,0.80)';
      c.beginPath(); c.ellipse(0, -sr * 0.5, sr, sr * 0.42, 0, 0, TAU); c.fill();
      c.strokeStyle = `rgba(${Math.min(255, p.cr + 90)},${Math.min(255, p.cg + 90)},${Math.min(255, p.cb + 90)},0.75)`;
      c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, -sr * 0.5, sr, sr * 0.42, 0, 0, TAU); c.stroke();
      /* the lobed lip a tunicate siphon closes with */
      c.strokeStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.55)`; c.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        c.beginPath(); c.moveTo(Math.cos(a) * sr * 0.55, -sr * 0.5 + Math.sin(a) * sr * 0.24);
        c.lineTo(Math.cos(a) * sr * 0.98, -sr * 0.5 + Math.sin(a) * sr * 0.40); c.stroke();
      }
      c.restore();
    };
    siph(bx - bw * 0.30, by - bh * 1.02, bw * 0.34, -0.10);
    siph(bx + bw * 0.46, by - bh * 0.80, bw * 0.28, 0.52);
    /* the translucent tunic showing the branchial basket inside it */
    c.save();
    c.beginPath(); c.ellipse(bx, by, bw * 0.95, bh * 0.95, 0, 0, TAU); c.clip();
    c.strokeStyle = `rgba(${Math.min(255, p.cr + 70)},${Math.min(255, p.cg + 80)},${Math.min(255, p.cb + 90)},0.22)`;
    c.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const y = by - bh * 0.7 + (i / 8) * bh * 1.5;
      c.beginPath(); c.moveTo(bx - bw * 0.8, y); c.lineTo(bx + bw * 0.8, y + 4); c.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const x = bx - bw * 0.7 + (i / 6) * bw * 1.4;
      c.beginPath(); c.moveTo(x, by - bh * 0.8); c.lineTo(x + 3, by + bh * 0.8); c.stroke();
    }
    c.restore();
    /* the bumpy tunic surface */
    for (let i = 0; i < 30; i++) {
      const a = r() * TAU, d = Math.sqrt(r());
      c.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.09})`;
      c.beginPath(); c.ellipse(bx + Math.cos(a) * bw * 0.8 * d, by + Math.sin(a) * bh * 0.8 * d, 4 + r() * 6, 3 + r() * 5, 0, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  };
  body(S * 0.66, S * 0.66, S * 0.085, S * 0.135, 0.72);   /* a smaller one behind */
  body(S * 0.44, S * 0.60, S * 0.125, S * 0.195, 1);
}

/* ── LAMPREY: the audit wants the oral disc and the gill pores. A lamprey with
   an ordinary mouth is just an eel. ── */
export function faunaLamprey(c: Ctx, g: G, p: Pal): void {
  const r = nrng(g, 'Lamprey', 0x1A34);
  const cy = S * 0.52, x0 = S * 0.10, x1 = S * 0.76;
  const wavePh = r() * TAU, waveAmp = S * (0.058 + r() * 0.034);
  const at = (t: number): [number, number] => [x0 + t * (x1 - x0), cy + Math.sin(t * 4.2 + wavePh) * waveAmp * (0.35 + t * 0.65)];
  const halfAt = (t: number): number => S * 0.030 * (0.55 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * 0.65);
  /* the continuous median fin along the back of the rear half */
  c.fillStyle = `rgba(${Math.min(255, p.cr + 50)},${Math.min(255, p.cg + 56)},${Math.min(255, p.cb + 66)},0.34)`;
  c.beginPath();
  for (let i = 0; i <= 30; i++) { const t = i / 30; const [x, y] = at(t); c.lineTo(x, y - halfAt(t) - (t < 0.45 ? 0 : S * 0.030 * Math.sin((t - 0.45) / 0.55 * Math.PI))); }
  for (let i = 30; i >= 0; i--) { const t = i / 30; const [x, y] = at(t); c.lineTo(x, y - halfAt(t)); }
  c.closePath(); c.fill();
  /* THE BODY — one smooth eel tube */
  const bg = c.createLinearGradient(0, cy - S * 0.06, 0, cy + S * 0.06);
  bg.addColorStop(0, p.dark); bg.addColorStop(0.45, p.base); bg.addColorStop(1, p.lit);
  c.fillStyle = bg;
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40; const [x, y] = at(t); if (!i) c.moveTo(x, y - halfAt(t)); else c.lineTo(x, y - halfAt(t)); }
  for (let i = 40; i >= 0; i--) { const t = i / 40; const [x, y] = at(t); c.lineTo(x, y + halfAt(t)); }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(226,236,250,0.22)'; c.lineWidth = 1.8;
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40; const [x, y] = at(t); if (!i) c.moveTo(x, y - halfAt(t) * 0.5); else c.lineTo(x, y - halfAt(t) * 0.5); }
  c.stroke();
  /* THE SEVEN GILL PORES — a row of round holes behind the head, and the one
     detail every lamprey illustration in the world leads with */
  for (let i = 0; i < 7; i++) {
    const t = 0.80 - i * 0.028;
    const [x, y] = at(t);
    c.fillStyle = 'rgba(10,14,20,0.72)';
    c.beginPath(); c.ellipse(x, y + halfAt(t) * 0.06, 3.4, 4.6, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(226,236,250,0.30)'; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(x, y + halfAt(t) * 0.06, 3.4, 4.6, 0, -2.6, -0.4); c.stroke();
  }
  /* THE ORAL DISC — a round jawless sucker ringed with concentric horny teeth,
     turned toward the viewer because in profile it does not exist */
  const [hx, hy] = at(1);
  const dr = S * 0.062;
  c.fillStyle = shade(p, 0.62);
  c.beginPath(); c.ellipse(hx + dr * 0.30, hy, dr * 0.78, dr * 1.02, 0.12, 0, TAU); c.fill();
  const dg = c.createRadialGradient(hx + dr * 0.42, hy, dr * 0.10, hx + dr * 0.42, hy, dr * 0.92);
  dg.addColorStop(0, 'rgba(96,32,34,0.95)');
  dg.addColorStop(0.55, `rgb(${Math.min(255, p.cr * 1.15 | 0)},${p.cg * 0.7 | 0},${p.cb * 0.7 | 0})`);
  dg.addColorStop(1, shade(p, 0.72));
  c.fillStyle = dg;
  c.beginPath(); c.ellipse(hx + dr * 0.42, hy, dr * 0.72, dr * 0.94, 0.12, 0, TAU); c.fill();
  /* the rings of teeth */
  c.fillStyle = '#efe6d2';
  for (let ring = 1; ring <= 3; ring++) {
    const rr = ring / 3.4, n = 6 + ring * 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + ring * 0.4;
      const ex = hx + dr * 0.42 + Math.cos(a) * dr * 0.66 * rr;
      const ey = hy + Math.sin(a) * dr * 0.86 * rr;
      c.beginPath(); c.arc(ex, ey, 2.2 - ring * 0.3, 0, TAU); c.fill();
    }
  }
  c.strokeStyle = 'rgba(238,242,250,0.34)'; c.lineWidth = 2.2;
  c.beginPath(); c.ellipse(hx + dr * 0.42, hy, dr * 0.72, dr * 0.94, 0.12, 0, TAU); c.stroke();
  /* the small round eye behind the disc */
  eye(c, hx - dr * 0.42, hy - dr * 0.36, 4.2);
}

/** ★ WAVE 8 — THE BAT. A WRONG-CLASS BLOCKER, and the most embarrassing kind:
    `Insect-Eating Bat` was routed into the INVERTEBRATE painter and rendered
    as a bee — three bead segments, antennae, spindly legs — because the word
    "Insect" appears in its name. It is a mammal. Nick's audit caught it in one
    look; nothing in the engine could, because every gate we own asks "did it
    paint?" and it painted beautifully.

    A bat IS its wing: a membrane stretched between enormously elongated finger
    bones, running from the shoulder out to the wingtip and back down to the
    ankle. Nothing else about the animal carries as much — a furry body with
    big ears is a mouse until that membrane is hanging off it. So the wing is
    built from the actual skeleton: an arm to the WRIST, then four fingers
    fanning out from it, membrane filled between them, and the trailing edge
    scalloped where it sags from strut to strut. */
export function faunaBat(c: Ctx, g: G, pIn: Pal, name: string): void {
  const r = nrng(g, name, 0x8A71);
  const fruit = /fruit|flying fox/i.test(name);
  const vamp = /vampire/i.test(name);
  const insect = /insect[- ]eating/i.test(name);
  /* Species-true fur prevents a bright genome palette from turning a nocturnal
     mammal into a yellow mascot. Variation remains present in the final mix. */
  const p = fruit ? anchor(pIn, 142, 78, 42, 0.54)
    : vamp ? anchor(pIn, 102, 72, 55, 0.60)
      : insect ? anchor(pIn, 74, 66, 58, 0.70)
        : anchor(pIn, 72, 66, 62, 0.60);
  const cx = S * 0.50;
  const bodyCy = S * (fruit ? 0.535 : 0.525);
  /* Flying foxes carry a long, narrow trunk between exceptionally long wings;
     vampire bats are compact but visibly more muscular through the hips. */
  const bodyW = S * (fruit ? 0.062 : vamp ? 0.063 : 0.056);
  const bodyH = S * (fruit ? 0.162 : vamp ? 0.132 : 0.140);
  const span = S * (fruit ? 0.450 : 0.420);
  shadow(c, cx, S * 0.82, S * (fruit ? 0.15 : 0.13), 0.30);
  c.lineCap = 'round'; c.lineJoin = 'round';

  type Pt = [number, number];
  interface Wing {
    side: -1 | 1;
    shoulder: Pt;
    elbow: Pt;
    wrist: Pt;
    digits: [Pt, Pt, Pt, Pt];
    ankle: Pt;
    hip: Pt;
  }
  const wing = (side: -1 | 1): Wing => {
    const shoulder: Pt = [cx + side * bodyW * 0.76, bodyCy - bodyH * 0.48];
    const elbow: Pt = [shoulder[0] + side * span * 0.29, shoulder[1] - bodyH * 0.76];
    const wrist: Pt = [shoulder[0] + side * span * 0.55, shoulder[1] - bodyH * 0.43];
    return {
      side, shoulder, elbow, wrist,
      /* Digits II–V fan from one wrist. Their endpoints, not decorative
         stripes, define the four membrane bays and scalloped trailing edge. */
      digits: [
        [cx + side * span, S * (fruit ? 0.190 : 0.205)],
        [cx + side * span * 0.94, bodyCy - bodyH * (fruit ? 0.95 : 0.88)],
        [cx + side * span * 0.78, bodyCy - bodyH * (fruit ? 0.12 : 0.06)],
        [cx + side * span * 0.53, bodyCy + bodyH * (fruit ? 0.60 : 0.58)],
      ],
      ankle: [cx + side * bodyW * (fruit ? 1.25 : vamp ? 1.44 : 1.40),
        bodyCy + bodyH * (fruit ? 1.02 : vamp ? 1.00 : 0.98)],
      hip: [cx + side * bodyW * 0.50, bodyCy + bodyH * 0.48],
    };
  };
  const wings: [Wing, Wing] = [wing(-1), wing(1)];

  const traceMembrane = (w: Wing): void => {
    const d = w.digits;
    c.beginPath();
    c.moveTo(w.shoulder[0], w.shoulder[1]);
    c.quadraticCurveTo(w.elbow[0], w.elbow[1] - bodyW * 0.10, w.wrist[0], w.wrist[1]);
    c.lineTo(d[0][0], d[0][1]);
    for (let i = 1; i < d.length; i++) {
      const a = d[i - 1]!, b = d[i]!;
      c.quadraticCurveTo((a[0] + b[0]) * 0.5 - w.side * span * 0.018,
        (a[1] + b[1]) * 0.5 + bodyH * 0.20, b[0], b[1]);
    }
    const last = d[3];
    c.quadraticCurveTo((last[0] + w.ankle[0]) * 0.5 - w.side * span * 0.025,
      (last[1] + w.ankle[1]) * 0.5 + bodyH * 0.16, w.ankle[0], w.ankle[1]);
    c.lineTo(w.hip[0], w.hip[1]);
    c.quadraticCurveTo(cx + w.side * bodyW * 0.90, bodyCy - bodyH * 0.05,
      w.shoulder[0], w.shoulder[1]);
    c.closePath();
  };

  const drawWing = (w: Wing, depth: number): void => {
    const outer = w.digits[0];
    const mg = c.createLinearGradient(w.shoulder[0], w.shoulder[1], outer[0], outer[1]);
    mg.addColorStop(0, `rgba(${(p.cr * 0.50 * depth) | 0},${(p.cg * 0.43 * depth) | 0},${(p.cb * 0.44 * depth) | 0},0.98)`);
    mg.addColorStop(0.52, `rgba(${(p.cr * 0.72 * depth) | 0},${(p.cg * 0.50 * depth) | 0},${(p.cb * 0.52 * depth) | 0},0.94)`);
    mg.addColorStop(1, `rgba(${Math.min(255, p.cr * 0.92 * depth) | 0},${(p.cg * 0.61 * depth) | 0},${(p.cb * 0.63 * depth) | 0},0.88)`);
    c.fillStyle = mg; traceMembrane(w); c.fill();
    c.strokeStyle = `rgba(${(p.cr * 0.28 * depth) | 0},${(p.cg * 0.24 * depth) | 0},${(p.cb * 0.25 * depth) | 0},0.90)`;
    c.lineWidth = Math.max(2.2, bodyW * 0.10); traceMembrane(w); c.stroke();

    /* One continuous arm: humerus to elbow, forearm to wrist, then four
       JOINTED and visibly fanned fingers. A dark under-stroke preserves the
       rays at 132px; the narrower living-bone core keeps them under the skin
       instead of turning them into flat panel seams. */
    c.strokeStyle = shade(p, 0.28); c.lineWidth = Math.max(7.2, bodyW * 0.25);
    c.beginPath(); c.moveTo(w.shoulder[0], w.shoulder[1]);
    c.lineTo(w.elbow[0], w.elbow[1]); c.lineTo(w.wrist[0], w.wrist[1]); c.stroke();
    c.strokeStyle = shade(p, 0.68 + depth * 0.18); c.lineWidth = Math.max(4.4, bodyW * 0.15);
    c.beginPath(); c.moveTo(w.shoulder[0], w.shoulder[1]);
    c.lineTo(w.elbow[0], w.elbow[1]); c.lineTo(w.wrist[0], w.wrist[1]); c.stroke();
    const fingerJoints: Pt[] = w.digits.map((tip, i) => {
      const t = 0.36 + i * 0.035;
      return [w.wrist[0] + (tip[0] - w.wrist[0]) * t + w.side * bodyW * (0.035 + i * 0.025),
        w.wrist[1] + (tip[1] - w.wrist[1]) * t + bodyW * (i - 1.5) * 0.035];
    });
    for (let i = 0; i < w.digits.length; i++) {
      const tip = w.digits[i]!, knuckle = fingerJoints[i]!;
      c.strokeStyle = shade(p, 0.30); c.lineWidth = Math.max(5.6, bodyW * 0.18);
      c.beginPath(); c.moveTo(w.wrist[0], w.wrist[1]);
      c.lineTo(knuckle[0], knuckle[1]); c.lineTo(tip[0], tip[1]); c.stroke();
      c.strokeStyle = shade(p, 0.82 + depth * 0.18); c.lineWidth = Math.max(3.25, bodyW * 0.11);
      c.beginPath(); c.moveTo(w.wrist[0], w.wrist[1]);
      c.lineTo(knuckle[0], knuckle[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    }
    c.fillStyle = shade(p, 0.74 + depth * 0.18);
    for (const joint of [w.elbow, w.wrist] as const) {
      c.beginPath(); c.arc(joint[0], joint[1], Math.max(4.4, bodyW * 0.15), 0, TAU); c.fill();
    }
    for (const joint of fingerJoints) {
      c.beginPath(); c.arc(joint[0], joint[1], Math.max(2.8, bodyW * 0.09), 0, TAU); c.fill();
    }

    /* Ordered capillaries follow each finger bay. Their low value and contained
       endpoints make the wing read as living skin, never paper. */
    c.strokeStyle = `rgba(${(p.cr * 0.38 * depth) | 0},${(p.cg * 0.27 * depth) | 0},${(p.cb * 0.30 * depth) | 0},0.30)`;
    c.lineWidth = 1;
    for (let i = 1; i < w.digits.length; i++) {
      const a = w.digits[i - 1]!, b = w.digits[i]!;
      for (let j = 1; j <= 3; j++) {
        const t = j / 4;
        const sx = w.wrist[0] + (a[0] - w.wrist[0]) * t;
        const sy = w.wrist[1] + (a[1] - w.wrist[1]) * t;
        const ex = w.wrist[0] + (b[0] - w.wrist[0]) * (t * 0.88);
        const ey = w.wrist[1] + (b[1] - w.wrist[1]) * (t * 0.88);
        c.beginPath(); c.moveTo(sx, sy);
        c.quadraticCurveTo((sx + ex) * 0.5, (sy + ey) * 0.5 + bodyW * 0.10, ex, ey); c.stroke();
      }
    }

    /* Skin tension originates at skeletal load points. Three restrained folds
       tie shoulder, wrist and ankle into the membrane without subdividing it
       into decorative paper panels. */
    const foldColour = `rgba(${Math.min(255, p.cr * (0.72 + depth * 0.12)) | 0},${Math.min(255, p.cg * (0.64 + depth * 0.10)) | 0},${Math.min(255, p.cb * (0.66 + depth * 0.10)) | 0},0.34)`;
    c.strokeStyle = foldColour; c.lineWidth = 1.55;
    const shoulderFold: Pt = [w.shoulder[0] + (w.digits[2][0] - w.shoulder[0]) * 0.46,
      w.shoulder[1] + (w.digits[2][1] - w.shoulder[1]) * 0.46];
    c.beginPath(); c.moveTo(w.shoulder[0], w.shoulder[1]);
    c.quadraticCurveTo(w.elbow[0], w.elbow[1] + bodyH * 0.26, shoulderFold[0], shoulderFold[1]); c.stroke();
    const wristFold: Pt = [(w.digits[1][0] + w.digits[2][0]) * 0.5,
      (w.digits[1][1] + w.digits[2][1]) * 0.5 + bodyH * 0.08];
    c.beginPath(); c.moveTo(w.wrist[0], w.wrist[1]);
    c.quadraticCurveTo((w.wrist[0] + wristFold[0]) * 0.5,
      (w.wrist[1] + wristFold[1]) * 0.5 + bodyW * 0.14, wristFold[0], wristFold[1]); c.stroke();
    const ankleFold: Pt = [((w.wrist[0] + w.digits[3][0]) * 0.5) * 0.45 + w.ankle[0] * 0.55,
      ((w.wrist[1] + w.digits[3][1]) * 0.5) * 0.45 + w.ankle[1] * 0.55];
    c.beginPath(); c.moveTo(w.ankle[0], w.ankle[1]);
    c.quadraticCurveTo((w.ankle[0] + w.digits[3][0]) * 0.5,
      (w.ankle[1] + w.digits[3][1]) * 0.5, ankleFold[0], ankleFold[1]); c.stroke();
  };
  drawWing(wings[0], 0.72);
  drawWing(wings[1], 1.00);

  /* The interfemoral membrane grows from both ankles and the body. Microbats
     enclose a visible tail; fruit bats have a shallow no-tail web, vampires an
     almost absent one. */
  const left = wings[0], right = wings[1];
  const rearDepth = fruit ? 0.22 : vamp ? 0.18 : insect ? 0.72 : 0.62;
  const tailY = Math.max(left.ankle[1], right.ankle[1]) + bodyH * rearDepth;
  const traceRearEdge = (): void => {
    c.beginPath(); c.moveTo(left.ankle[0], left.ankle[1]);
    if (!fruit && !vamp) {
      /* A broad distal edge makes this an ankle-to-ankle flight membrane, not
         a skinny tail pennant. The tail meets the middle of the flat basket. */
      c.quadraticCurveTo(cx - bodyW * 0.98, tailY - bodyH * 0.18,
        cx - bodyW * 0.34, tailY);
      c.lineTo(cx + bodyW * 0.34, tailY);
      c.quadraticCurveTo(cx + bodyW * 0.98, tailY - bodyH * 0.18,
        right.ankle[0], right.ankle[1]);
    } else {
      c.quadraticCurveTo(cx - bodyW * 0.42, tailY - bodyH * 0.02, cx, tailY);
      c.quadraticCurveTo(cx + bodyW * 0.42, tailY - bodyH * 0.02, right.ankle[0], right.ankle[1]);
    }
  };
  c.fillStyle = `rgba(${(p.cr * 0.58) | 0},${(p.cg * 0.46) | 0},${(p.cb * 0.48) | 0},${fruit || vamp ? 0.78 : 0.96})`;
  traceRearEdge();
  c.lineTo(cx + bodyW * 0.58, bodyCy + bodyH * 0.42);
  c.quadraticCurveTo(cx, bodyCy + bodyH * 0.74, cx - bodyW * 0.58, bodyCy + bodyH * 0.42);
  c.closePath(); c.fill();
  c.strokeStyle = shade(p, 0.66); c.lineWidth = 2.5;
  traceRearEdge(); c.stroke();
  if (!fruit && !vamp) {
    /* The tapered center tail reaches the distal edge as its own volume.
       Calcars stay lateral, leaving negative space between three independent
       supports instead of collapsing into one bright V under the abdomen. */
    const tailBaseY = bodyCy + bodyH * 0.56;
    c.fillStyle = shade(p, 0.96); c.strokeStyle = shade(p, 0.28); c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(cx - bodyW * 0.16, tailBaseY);
    c.quadraticCurveTo(cx - bodyW * 0.08, tailY - bodyH * 0.16, cx, tailY);
    c.quadraticCurveTo(cx + bodyW * 0.08, tailY - bodyH * 0.16,
      cx + bodyW * 0.16, tailBaseY); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = shade(p, 1.08); c.beginPath(); c.arc(cx, tailY - 1, 2.6, 0, TAU); c.fill();
    for (const w of wings) {
      c.strokeStyle = shade(p, 0.28); c.lineWidth = 6.0;
      c.beginPath(); c.moveTo(w.ankle[0], w.ankle[1]);
      c.lineTo(cx + w.side * bodyW * 0.72, tailY - bodyH * 0.10); c.stroke();
      c.strokeStyle = shade(p, 1.04); c.lineWidth = 3.3;
      c.beginPath(); c.moveTo(w.ankle[0], w.ankle[1]);
      c.lineTo(cx + w.side * bodyW * 0.72, tailY - bodyH * 0.10); c.stroke();
      c.fillStyle = shade(p, 1.02); c.beginPath();
      c.arc(w.ankle[0], w.ankle[1], Math.max(4.2, bodyW * 0.15), 0, TAU); c.fill();
    }
  }

  /* Fur-clad hind limbs emerge through the membrane and terminate in hooked,
     grasping toes. Drawing the membrane first keeps every join continuous. */
  for (const w of wings) {
    const knee: Pt = [cx + w.side * bodyW * (vamp ? 1.12 : 0.88), bodyCy + bodyH * 0.70];
    c.strokeStyle = shade(p, w.side < 0 ? 0.48 : 0.64);
    c.lineWidth = Math.max(vamp ? 7.6 : fruit ? 6.7 : 6.0, bodyW * (vamp ? 0.26 : 0.22));
    c.beginPath(); c.moveTo(w.hip[0], w.hip[1]); c.lineTo(knee[0], knee[1]); c.lineTo(w.ankle[0], w.ankle[1]); c.stroke();
    const footY = w.ankle[1] + bodyW * (fruit ? 0.58 : vamp ? 0.52 : 0.46);
    const palmX = w.ankle[0] + w.side * bodyW * (fruit ? 0.24 : vamp ? 0.22 : 0.18);
    c.strokeStyle = shade(p, 0.30); c.lineWidth = Math.max(6.2, bodyW * 0.21);
    c.beginPath(); c.moveTo(w.ankle[0], w.ankle[1]); c.lineTo(palmX, footY); c.stroke();
    c.strokeStyle = shade(p, 0.90); c.lineWidth = Math.max(4.0, bodyW * 0.14);
    c.beginPath(); c.moveTo(w.ankle[0], w.ankle[1]); c.lineTo(palmX, footY); c.stroke();
    c.fillStyle = shade(p, vamp ? 1.08 : 1.00); c.strokeStyle = shade(p, 0.28); c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(palmX, footY, bodyW * (fruit ? 0.34 : vamp ? 0.36 : 0.32),
      bodyW * (fruit ? 0.22 : vamp ? 0.24 : 0.21), w.side * 0.16, 0, TAU); c.fill(); c.stroke();
    for (let toe = -2; toe <= 1; toe++) {
      const x0 = palmX + toe * bodyW * 0.090;
      const toeLen = bodyW * (fruit ? 0.68 : vamp ? 0.64 : 0.62);
      const midX = x0 + w.side * toeLen * 0.78;
      const midY = footY + bodyW * (0.12 + (toe + 2) * 0.028);
      c.strokeStyle = shade(p, 1.06); c.lineWidth = Math.max(3.6, bodyW * 0.12);
      c.beginPath(); c.moveTo(x0, footY);
      c.quadraticCurveTo(x0 + w.side * toeLen * 0.42, footY + bodyW * 0.04, midX, midY); c.stroke();
      c.strokeStyle = 'rgba(184,153,114,0.94)'; c.lineWidth = Math.max(2.4, bodyW * 0.080);
      c.beginPath(); c.moveTo(midX, midY);
      c.quadraticCurveTo(x0 + w.side * toeLen, midY + toeLen * 0.20,
        x0 + w.side * toeLen * 0.62, midY + toeLen * 0.48); c.stroke();
    }
  }

  /* Torso laid over the inner wing and leg roots: one furry shoulder mass,
     with no sticker-like seams where the flight apparatus joins the body. */
  const torsoG = c.createLinearGradient(cx - bodyW, bodyCy, cx + bodyW, bodyCy);
  torsoG.addColorStop(0, p.dark); torsoG.addColorStop(0.34, p.base);
  torsoG.addColorStop(0.64, shade(p, 1.10)); torsoG.addColorStop(1, shade(p, 0.54));
  c.fillStyle = torsoG;
  c.beginPath();
  c.moveTo(cx, bodyCy - bodyH);
  c.bezierCurveTo(cx - bodyW * 1.12, bodyCy - bodyH * 0.90, cx - bodyW * 1.06, bodyCy + bodyH * 0.52, cx, bodyCy + bodyH);
  c.bezierCurveTo(cx + bodyW * 1.06, bodyCy + bodyH * 0.52, cx + bodyW * 1.12, bodyCy - bodyH * 0.90, cx, bodyCy - bodyH);
  c.closePath(); c.fill();
  const chest = c.createRadialGradient(cx - bodyW * 0.20, bodyCy - bodyH * 0.30, 2, cx, bodyCy, bodyH);
  chest.addColorStop(0, 'rgba(255,236,210,0.19)'); chest.addColorStop(0.56, 'rgba(255,236,210,0.04)'); chest.addColorStop(1, 'rgba(255,236,210,0)');
  c.fillStyle = chest; c.beginPath(); c.ellipse(cx, bodyCy, bodyW * 0.74, bodyH * 0.88, 0, 0, TAU); c.fill();
  /* Fine fur follows the body volume inside its silhouette. The former radial
     edge strokes shrank into porcupine spikes and made the mammal look built
     from sticks. */
  c.save(); c.beginPath(); c.ellipse(cx, bodyCy, bodyW * 0.94, bodyH * 0.94, 0, 0, TAU); c.clip();
  for (let i = 0; i < (fruit ? 120 : 92); i++) {
    const yy = bodyCy - bodyH * 0.84 + r() * bodyH * 1.68;
    const half = bodyW * Math.sqrt(Math.max(0, 1 - ((yy - bodyCy) / bodyH) ** 2));
    const xx = cx + (r() * 2 - 1) * half * 0.88;
    const len = S * (0.007 + r() * 0.009);
    c.strokeStyle = `rgba(${(p.cr * 0.46) | 0},${(p.cg * 0.40) | 0},${(p.cb * 0.38) | 0},${0.15 + r() * 0.24})`;
    c.lineWidth = 0.8 + r() * 0.8;
    c.beginPath(); c.moveTo(xx, yy - len * 0.45); c.quadraticCurveTo(xx + 1.5, yy, xx, yy + len * 0.55); c.stroke();
  }
  c.restore();

  /* Digit I sits outside the membrane at the wrist. Vampire bats carry long,
     weight-bearing thumbs; the others show a hooked leading-edge thumb. */
  for (const w of wings) {
    const thumbJoint: Pt = vamp
      ? [w.wrist[0] - w.side * bodyW * 0.10, w.wrist[1] + bodyW * 0.92]
      : [w.wrist[0] + w.side * bodyW * 0.46, w.wrist[1] - bodyW * 0.55];
    const thumbTip: Pt = vamp
      ? [w.wrist[0] - w.side * bodyW * 0.26, w.wrist[1] + bodyW * 1.92]
      : [w.wrist[0] + w.side * bodyW * 1.05, w.wrist[1] - bodyW * 0.64];
    c.strokeStyle = shade(p, 0.28); c.lineWidth = Math.max(vamp ? 8.2 : 7.0, bodyW * (vamp ? 0.28 : 0.23));
    c.beginPath(); c.moveTo(w.wrist[0], w.wrist[1]); c.lineTo(thumbJoint[0], thumbJoint[1]); c.lineTo(thumbTip[0], thumbTip[1]); c.stroke();
    c.strokeStyle = shade(p, vamp ? 1.00 : 0.98); c.lineWidth = Math.max(vamp ? 5.4 : 4.1, bodyW * (vamp ? 0.19 : 0.14));
    c.beginPath(); c.moveTo(w.wrist[0], w.wrist[1]); c.lineTo(thumbJoint[0], thumbJoint[1]); c.lineTo(thumbTip[0], thumbTip[1]); c.stroke();
    c.fillStyle = shade(p, vamp ? 1.06 : 1.02);
    c.beginPath(); c.arc(w.wrist[0], w.wrist[1], Math.max(vamp ? 6.0 : 4.8, bodyW * (vamp ? 0.20 : 0.16)), 0, TAU); c.fill();
    c.beginPath(); c.arc(thumbJoint[0], thumbJoint[1], Math.max(vamp ? 4.3 : 3.6, bodyW * 0.12), 0, TAU); c.fill();
    if (vamp) {
      /* The vampire's first digit is a padded walking support, not a floating
         claw. The tiny hook starts only after the fleshy distal pad. */
      c.fillStyle = shade(p, 1.08); c.beginPath();
      c.ellipse(thumbTip[0], thumbTip[1], bodyW * 0.19, bodyW * 0.27, w.side * 0.16, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(181,150,112,0.94)'; c.lineWidth = Math.max(2.4, bodyW * 0.078);
    c.beginPath(); c.moveTo(thumbTip[0], thumbTip[1]);
    c.quadraticCurveTo(thumbTip[0] + w.side * bodyW * (vamp ? 0.18 : 0.32), thumbTip[1] + bodyW * 0.03,
      thumbTip[0] + w.side * bodyW * 0.08, thumbTip[1] + bodyW * (vamp ? 0.15 : 0.28)); c.stroke();
  }
  if (fruit) {
    /* Pteropodids retain a second-digit claw in addition to the free thumb.
       Put it at the leading fingertip so it survives the 132px card. */
    for (const w of wings) {
      const tip = w.digits[0];
      /* Warm keratin stays visibly rooted in digit II instead of flashing as a
         white ornament pasted onto the wingtip. */
      c.strokeStyle = 'rgba(194,154,108,0.94)'; c.lineWidth = 3.3;
      c.beginPath(); c.moveTo(tip[0], tip[1]);
      c.quadraticCurveTo(tip[0] + w.side * bodyW * 0.48, tip[1] - bodyW * 0.18,
        tip[0] + w.side * bodyW * 0.18, tip[1] + bodyW * 0.34); c.stroke();
    }
  }

  const headY = bodyCy - bodyH * (fruit ? 0.94 : 0.92);
  const headW = S * (fruit ? 0.082 : vamp ? 0.072 : 0.061);
  const headH = S * (fruit ? 0.076 : vamp ? 0.064 : 0.061);
  const earScale = fruit ? 1.20 : insect ? 2.15 : vamp ? 1.82 : 1.92;

  /* Cupped pinnae grow from the skull rather than floating like rabbit ears. Fruit-bat ears stay
     moderate; echolocating microbats carry the enormous acoustic surface. */
  for (const side of [-1, 1] as const) {
    const outerBase: Pt = [cx + side * headW * 0.70, headY - headH * 0.10];
    const innerBase: Pt = [cx + side * headW * 0.12, headY - headH * 0.48];
    const broadEar = !fruit && !vamp;
    const tip: Pt = [cx + side * headW * (fruit ? 1.00 : vamp ? 1.18 : 0.72), headY - headH * earScale];
    c.fillStyle = shade(p, side < 0 ? 0.48 : 0.62);
    c.beginPath(); c.moveTo(outerBase[0], outerBase[1]);
    if (broadEar) {
      c.bezierCurveTo(cx + side * headW * 1.70, headY - headH * 0.48,
        cx + side * headW * 1.38, headY - headH * 1.62, tip[0], tip[1]);
      c.bezierCurveTo(cx + side * headW * 0.36, headY - headH * 1.80,
        cx + side * headW * 0.18, headY - headH * 0.72, innerBase[0], innerBase[1]);
    } else {
      c.quadraticCurveTo(cx + side * headW * (fruit ? 1.22 : 1.30), headY - headH * 0.80, tip[0], tip[1]);
      c.quadraticCurveTo(cx + side * headW * 0.48, headY - headH * 1.02, innerBase[0], innerBase[1]);
    }
    c.quadraticCurveTo(cx + side * headW * 0.46, headY - headH * 0.08, outerBase[0], outerBase[1]);
    c.closePath(); c.fill();
    c.fillStyle = `rgba(${Math.min(255, p.cr * 1.12) | 0},${Math.min(255, p.cg * 0.72) | 0},${Math.min(255, p.cb * 0.74) | 0},0.58)`;
    c.beginPath(); c.moveTo(cx + side * headW * (broadEar ? 0.66 : 0.61), headY - headH * 0.22);
    if (broadEar) {
      c.bezierCurveTo(cx + side * headW * 1.34, headY - headH * 0.70,
        cx + side * headW * 1.08, headY - headH * 1.50, tip[0], tip[1] + headH * 0.18);
      c.bezierCurveTo(cx + side * headW * 0.43, headY - headH * 1.45,
        cx + side * headW * 0.30, headY - headH * 0.68, cx + side * headW * 0.28, headY - headH * 0.46);
    } else {
      c.quadraticCurveTo(cx + side * headW * 0.86, headY - headH * 0.92, tip[0], tip[1] + headH * 0.16);
      c.quadraticCurveTo(cx + side * headW * 0.42, headY - headH * 0.82, cx + side * headW * 0.28, headY - headH * 0.46);
    }
    c.closePath(); c.fill();
  }

  const traceFruitHead = (): void => {
    c.beginPath();
    c.moveTo(cx - headW * 0.22, headY + headH * 0.88);
    c.bezierCurveTo(cx - headW * 0.92, headY + headH * 0.64,
      cx - headW * 1.04, headY - headH * 0.34, cx - headW * 0.34, headY - headH * 0.92);
    c.bezierCurveTo(cx + headW * 0.28, headY - headH * 0.86,
      cx + headW * 0.78, headY - headH * 0.28, cx + headW * 1.48, headY + headH * 0.28);
    c.bezierCurveTo(cx + headW * 1.42, headY + headH * 0.58,
      cx + headW * 0.72, headY + headH * 0.78, cx - headW * 0.22, headY + headH * 0.88);
    c.closePath();
  };
  const headG = c.createRadialGradient(cx - headW * 0.28, headY - headH * 0.34, 2, cx, headY, headW * 1.55);
  headG.addColorStop(0, p.lit); headG.addColorStop(0.54, p.base); headG.addColorStop(1, p.dark);
  c.fillStyle = headG;
  if (fruit) { traceFruitHead(); c.fill(); } else { c.beginPath(); c.ellipse(cx, headY, headW, headH, 0, 0, TAU); c.fill(); }
  if (fruit) {
    c.save(); traceFruitHead(); c.clip();
    for (let i = 0; i < 46; i++) {
      const xx = cx - headW * 0.82 + r() * headW * 2.15;
      const yy = headY - headH * 0.70 + r() * headH * 1.44;
      c.strokeStyle = `rgba(${(p.cr * 0.54) | 0},${(p.cg * 0.46) | 0},${(p.cb * 0.42) | 0},${0.16 + r() * 0.22})`;
      c.lineWidth = 0.9 + r() * 0.7; c.beginPath(); c.moveTo(xx - 2, yy - 1); c.lineTo(xx + 3.5, yy + 1.5); c.stroke();
    }
    c.restore();
  } else {
    pelt(c, p, r, (a) => [cx + Math.cos(a) * headW * (0.90 + r() * 0.06),
      headY + Math.sin(a) * headH * (0.90 + r() * 0.06), a], 18, S * 0.005);
  }

  if (insect) {
    /* Vespertilionid tragus: a separate pointed cartilage blade inside each
       pinna. It is drawn after the skull so its base remains visible at card
       size instead of being silently overpainted by the head. */
    for (const side of [-1, 1] as const) {
      c.fillStyle = `rgba(${Math.min(255, p.cr * 1.42) | 0},${Math.min(255, p.cg * 1.08) | 0},${Math.min(255, p.cb * 1.10) | 0},0.96)`;
      c.beginPath(); c.moveTo(cx + side * headW * 0.34, headY - headH * 0.18);
      c.lineTo(cx + side * headW * 0.70, headY - headH * 1.28);
      c.lineTo(cx + side * headW * 1.00, headY - headH * 0.16);
      c.quadraticCurveTo(cx + side * headW * 0.68, headY + headH * 0.02,
        cx + side * headW * 0.34, headY - headH * 0.18); c.fill();
      c.strokeStyle = shade(p, 0.34); c.lineWidth = 2.1;
      c.beginPath(); c.moveTo(cx + side * headW * 0.34, headY - headH * 0.18);
      c.lineTo(cx + side * headW * 0.70, headY - headH * 1.28);
      c.lineTo(cx + side * headW * 1.00, headY - headH * 0.16); c.stroke();
    }
  }

  const darkEye = (x: number, y: number, rr: number, iris: string): void => {
    c.fillStyle = 'rgba(14,10,10,0.92)'; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    c.fillStyle = iris; c.beginPath(); c.arc(x, y, rr * 0.62, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,244,220,0.88)'; c.beginPath(); c.arc(x - rr * 0.28, y - rr * 0.32, rr * 0.20, 0, TAU); c.fill();
  };

  if (fruit) {
    /* Flying-fox face: the cranial vault, brow, bridge and rostrum were filled
       as ONE profile above. Details follow that volume; no muzzle patch can
       detach into a pasted-on dog snout and no generic eye pass can overpaint. */
    darkEye(cx - headW * 0.22, headY - headH * 0.17, headW * 0.145, '#6d421e');
    darkEye(cx + headW * 0.30, headY - headH * 0.12, headW * 0.210, '#744923');
    c.strokeStyle = 'rgba(54,34,24,0.48)'; c.lineWidth = 2.0;
    c.beginPath(); c.moveTo(cx + headW * 0.28, headY - headH * 0.02);
    c.quadraticCurveTo(cx + headW * 0.78, headY + headH * 0.02,
      cx + headW * 1.22, headY + headH * 0.26); c.stroke();
    c.fillStyle = '#17110f'; c.beginPath();
    c.ellipse(cx + headW * 1.47, headY + headH * 0.31, headW * 0.22, headH * 0.18, 0.10, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.20)'; c.beginPath();
    c.ellipse(cx + headW * 1.40, headY + headH * 0.25, headW * 0.060, headH * 0.045, -0.3, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(28,18,14,0.66)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(cx + headW * 1.36, headY + headH * 0.50);
    c.quadraticCurveTo(cx + headW * 0.96, headY + headH * 0.66,
      cx + headW * 0.54, headY + headH * 0.62); c.stroke();
  } else if (vamp) {
    /* Compact swollen muzzle below a broad, flat nose pad. The nose—not a
       pair of novelty teeth—owns the card-scale face read. */
    const muzzleG = c.createRadialGradient(cx, headY + headH * 0.36, 2,
      cx, headY + headH * 0.48, headW * 0.62);
    muzzleG.addColorStop(0, shade(p, 1.08)); muzzleG.addColorStop(1, shade(p, 0.70));
    c.fillStyle = muzzleG; c.beginPath();
    c.ellipse(cx, headY + headH * 0.48, headW * 0.56, headH * 0.44, 0, 0, TAU); c.fill();
    c.fillStyle = '#75464a'; c.beginPath();
    c.moveTo(cx - headW * 0.48, headY + headH * 0.30);
    c.lineTo(cx + headW * 0.48, headY + headH * 0.30);
    c.quadraticCurveTo(cx + headW * 0.46, headY + headH * 0.68, cx, headY + headH * 0.75);
    c.quadraticCurveTo(cx - headW * 0.46, headY + headH * 0.68,
      cx - headW * 0.48, headY + headH * 0.30); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(54,22,24,0.88)'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(cx - headW * 0.48, headY + headH * 0.30);
    c.lineTo(cx + headW * 0.48, headY + headH * 0.30); c.stroke();
    c.fillStyle = '#181010';
    for (const side of [-1, 1] as const) {
      c.beginPath(); c.ellipse(cx + side * headW * 0.16, headY + headH * 0.52,
        headW * 0.070, headH * 0.060, 0, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(34,18,18,0.74)'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(cx - headW * 0.28, headY + headH * 0.84);
    c.quadraticCurveTo(cx, headY + headH * 0.91, cx + headW * 0.28, headY + headH * 0.84); c.stroke();
    darkEye(cx - headW * 0.36, headY - headH * 0.08, headW * 0.105, '#2a1714');
    darkEye(cx + headW * 0.36, headY - headH * 0.08, headW * 0.105, '#2a1714');
  } else {
    /* Representative microbat: small eyes, leafless wrinkled muzzle. The
       Insect-Eating Bat's identity comes from the pinnae/tragus above. */
    c.fillStyle = shade(p, 0.82);
    c.beginPath(); c.moveTo(cx - headW * 0.32, headY + headH * 0.16);
    c.quadraticCurveTo(cx - headW * 0.22, headY + headH * 0.74, cx, headY + headH * 0.88);
    c.quadraticCurveTo(cx + headW * 0.22, headY + headH * 0.74, cx + headW * 0.32, headY + headH * 0.16);
    c.closePath(); c.fill();
    c.fillStyle = '#231a18'; c.beginPath(); c.ellipse(cx, headY + headH * 0.70, headW * 0.19, headH * 0.12, 0, 0, TAU); c.fill();
    for (const side of [-1, 1] as const) darkEye(cx + side * headW * 0.38, headY - headH * 0.05, headW * 0.09, '#241b18');
    c.strokeStyle = 'rgba(30,20,18,0.52)'; c.lineWidth = 1.2;
    for (const side of [-1, 1] as const) {
      c.beginPath(); c.moveTo(cx + side * headW * 0.08, headY + headH * 0.48);
      c.quadraticCurveTo(cx + side * headW * 0.34, headY + headH * 0.58, cx + side * headW * 0.42, headY + headH * 0.80); c.stroke();
    }
  }
}

/** ★ WAVE 10 — THE CROCODILIANS. All four were unrouted and fell through to the
    verbatim engine, which drew them as narrow arrows: a flat plank with a
    needle point, a comb of identical spikes planted along the top, two bent
    wires for legs, and — worst — the same sharp V snout on every one of them.
    Nick's audit named it four separate times.

    Everything that separates these animals is in the head and the armour:
      · an ALLIGATOR has a broad rounded U snout and its teeth vanish when the
        mouth shuts. The audit note calls this out explicitly, and ours was
        drawing a crocodile.
      · a CROCODILE has a narrow V snout and the enlarged fourth lower tooth
        stays visible with the jaws closed.
      · a GHARIAL is a needle: a snout longer than the rest of its skull, barely
        wider than a wrist, studded with interlocking teeth.
      · a CAIMAN is a blunt alligator with a bony ridge between the eyes.
    And all four carry paired rows of keeled osteoderms that swell out of the
    back and run onto a tail that is laterally flattened into a double crest —
    not a row of triangles standing on a line. */
export interface CrocSpec {
  snout: 'broad' | 'narrow' | 'needle';
  tooth?: boolean;      /** the fourth lower tooth showing on a closed mouth */
  ridge?: boolean;      /** the caiman's bony interorbital bridge */
  knob?: boolean;       /** the gharial's ghara */
  hue?: [number, number, number];   /** species-true hide; olive is not one colour */
  depth?: number;                   /** a caiman is stocky, a gharial is a rail */
  scutes?: number;                  /** how heavily armoured the back reads */
  len?: number;
}
export function faunaCroc(c: Ctx, g: G, pIn: Pal, spec: CrocSpec, name = ''): void {
  const r = nrng(g, name, 0x3C11);
  /* colour IS identity on a crocodilian — a pink alligator is not rarity
     variation, it is the animal being unrecognisable. Anchored toward olive,
     with the roll still moving it enough to keep the four apart. */
  const hu = spec.hue ?? [74, 82, 54];
  const p = anchor(pIn, hu[0], hu[1], hu[2], 0.72);
  const gy = S * 0.66;
  const L = S * (spec.len ?? 0.40);
  const bodyR = S * (spec.depth ?? (spec.snout === 'needle' ? 0.048 : 0.062));
  const headL = L * (spec.snout === 'needle' ? 0.46 : spec.snout === 'narrow' ? 0.34 : 0.30);
  const x0 = S * 0.5 - L * 0.46;
  shadow(c, S * 0.5, gy + bodyR * 1.75, L * 0.44, 0.38);

  /* the trunk and tail as one continuous taper — a crocodilian has no waist,
     it simply thickens from the snout to the hips and then runs out into tail */
  const spine = (u: number): [number, number] => [x0 + L * u, gy - bodyR * (0.10 + 0.16 * Math.sin(u * 3.1))];
  const rad = (u: number): number => {
    if (u < 0.28) return bodyR * (0.52 + u * 0.9);              /* neck into shoulders */
    if (u < 0.58) return bodyR * (0.69 + (u - 0.28) * 1.05);    /* the belly, widest at the hips */
    return Math.max(bodyR * 0.06, bodyR * (1.00 - (u - 0.58) * 2.24));   /* out into the tail */
  };
  const near = (u: number): number => u;

  /* the four SPLAYED legs, drawn before the body so the body covers the roots.
     A crocodilian's limbs stick out sideways and its belly nearly touches the
     ground — the sprawl IS the silhouette, and drawing them under the body
     turns it into a lizard-shaped dog. */
  /* ★ D-ART-117 — THE LEGS USED TO CROSS IN AN X. It hit every crocodilian at
     once: Crocodile, Alligator, Caiman and Gharial all reported "two thick
     bars that cross at the exact midpoint and meet at a single shared foot".

     THE DEFECT was the splay: the foot was thrown a fixed 1.55–1.70 body-radii
     along the SPINE AXIS, hind one way and fore the other. The hind limb sits
     at u≈0.72 and the fore at u≈0.28, so each reached past the body's midpoint
     toward the other and they crossed, folding four legs into what looked like
     two. A sprawled limb goes OUT and DOWN from its own hip, never lengthwise
     toward the far end.

     ⚠ AND A DIAGNOSIS THAT WAS WRONG, kept because it cost real time. Wave 26
     also concluded "both calls pass far=true, so the near pair is never
     drawn" — from reading THIS call site alone. The near pair is drawn, forty
     lines further down, after the body. Four legs always reached the canvas.
     Adding a second near pair here changed nothing visible, so the mistake
     survived a look at the render; it was caught only when a negative control
     removed the duplicate and the picture stayed at four legs.
     READ EVERY CALL SITE OF A HELPER BEFORE CLAIMING WHAT IT NEVER DOES. */
  const leg = (u: number, back: boolean, far: boolean): void => {
    const a = spine(u);
    const m = far ? 0.55 : 1;
    const lw = bodyR * (back ? 0.22 : 0.19);
    /* a modest lateral splay away from the body's own centre, and the near
       pair set slightly forward of the far pair so the two never coincide */
    /* ⚠ SIGN. The animal faces LEFT, so the fore limb sits at the low-u (left)
       end and the hind at the high-u (right) end. A foot must land on the
       OUTBOARD side of its own hip — fore forward/left, hind back/right. The
       original sent each one inboard, which is what made them meet in the
       middle; halving that distance only made a smaller X. */
    const lean = (back ? 1 : -1) * bodyR * 0.38 + (far ? -bodyR * 0.18 : bodyR * 0.14);
    const outX = a[0] + lean;
    c.strokeStyle = `rgb(${(p.cr * 0.72 * m) | 0},${(p.cg * 0.74 * m) | 0},${(p.cb * 0.62 * m) | 0})`;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = lw * 2;
    c.beginPath();
    c.moveTo(a[0], a[1] + rad(u) * 0.3);
    c.quadraticCurveTo(outX, a[1] + rad(u) * 1.15, outX + (back ? bodyR * 0.18 : -bodyR * 0.24), gy + bodyR * 1.35);
    c.stroke();
    /* the splayed toes */
    c.lineWidth = Math.max(1.6, lw * 0.5);
    for (let i = -1; i <= 1; i++) {
      const tx = outX + (back ? bodyR * 0.18 : -bodyR * 0.24);
      c.beginPath(); c.moveTo(tx, gy + bodyR * 1.35);
      c.lineTo(tx + i * bodyR * 0.42 + (back ? bodyR * 0.26 : -bodyR * 0.30), gy + bodyR * 1.62);
      c.stroke();
    }
  };
  /* the FAR pair, before the body so their roots vanish under the flank. The
     near pair is drawn AFTER the body, further down — do not duplicate it
     here. (Wave 26 briefly did, having read only this call site and concluded
     the near pair was missing entirely; the render showed four legs either
     way, which is exactly why the claim survived a look. The actual defect was
     the splay sign below, shared by both pairs.) */
  leg(0.72, true, true); leg(0.28, false, true);

  /* the body */
  const bg = c.createLinearGradient(0, gy - bodyR * 1.6, 0, gy + bodyR * 1.4);
  bg.addColorStop(0, `rgb(${Math.min(255, p.cr * 1.16) | 0},${Math.min(255, p.cg * 1.18) | 0},${(p.cb * 0.92) | 0})`);
  bg.addColorStop(0.42, p.base);
  /* the pale underside every crocodilian has and ours did not */
  bg.addColorStop(0.78, 'rgb(' + Math.min(255, p.cr * 1.30 + 46 | 0) + ',' + Math.min(255, p.cg * 1.28 + 44 | 0) + ',' + Math.min(255, p.cb * 1.22 + 34 | 0) + ')');
  bg.addColorStop(1, shade(p, 0.62));
  c.fillStyle = bg;
  c.beginPath();
  for (let i = 0; i <= 60; i++) { const u = i / 60; const a = spine(u); c.lineTo(a[0], a[1] - rad(u)); }
  for (let i = 60; i >= 0; i--) { const u = i / 60; const a = spine(u); c.lineTo(a[0], a[1] + rad(u)); }
  c.closePath(); c.fill();

  /* THE SCUTES — two paired rows of keeled osteoderms that SWELL OUT of the
     back, converging into a double crest along the tail and finally a single
     one. The old comb of identical triangles was planted on the outline. */
  const nScute = Math.round(34 * (spec.scutes ?? 1));
  for (let i = 2; i < nScute; i++) {
    const u = 0.20 + (i / nScute) * 0.78;
    const a = spine(u), rr = rad(u);
    const tailish = Math.max(0, (u - 0.62) / 0.38);
    const rows: number[] = tailish > 0.55 ? [0] : [-1, 1];
    for (const row of rows) {
      const off = row * rr * 0.42 * (1 - tailish);
      const h = rr * (0.34 + 0.20 * Math.sin(u * 9)) * (0.7 + tailish * 0.8);
      c.fillStyle = `rgba(${(p.cr * 0.60) | 0},${(p.cg * 0.62 + 8) | 0},${(p.cb * 0.48) | 0},0.92)`;
      c.beginPath();
      c.moveTo(a[0] - rr * 0.20, a[1] - rr + off * 0.25);
      c.quadraticCurveTo(a[0], a[1] - rr - h + off * 0.25, a[0] + rr * 0.22, a[1] - rr + off * 0.25);
      c.closePath(); c.fill();
    }
  }
  /* the hide: pebbled scale rows following the body, not painted across it */
  c.strokeStyle = `rgba(${(p.cr * 0.42) | 0},${(p.cg * 0.44) | 0},${(p.cb * 0.34) | 0},0.42)`;
  c.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const u = 0.06 + (i / 26) * 0.9, a = spine(u), rr = rad(u);
    c.beginPath(); c.moveTo(a[0], a[1] - rr * 0.86); c.lineTo(a[0] - rr * 0.12, a[1] + rr * 0.86); c.stroke();
  }
  c.strokeStyle = 'rgba(226,238,246,0.24)'; c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i <= 40; i++) { const u = 0.05 + (i / 40) * 0.55; const a = spine(u); c.lineTo(a[0], a[1] - rad(u)); }
  c.stroke();
  leg(0.72, true, false); leg(0.28, false, false);

  /* ── THE HEAD, which is the whole species ── */
  const hx = x0 + headL * 0.16, hy = gy - bodyR * 0.30;
  const jawW = bodyR * (spec.snout === 'broad' ? 0.92 : spec.snout === 'narrow' ? 0.66 : 0.30);
  const tipW = bodyR * (spec.snout === 'broad' ? 0.62 : spec.snout === 'narrow' ? 0.26 : 0.13);
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(hx + headL * 0.30, hy - jawW);
  /* the top of the snout: a U on an alligator, a V on a crocodile, a rod on a gharial */
  c.quadraticCurveTo(hx - headL * 0.30, hy - jawW * (spec.snout === 'broad' ? 1.02 : 0.82), hx - headL * 0.72, hy - tipW);
  c.quadraticCurveTo(hx - headL * 0.86, hy, hx - headL * 0.72, hy + tipW);
  c.quadraticCurveTo(hx - headL * 0.30, hy + jawW * 0.94, hx + headL * 0.30, hy + jawW * 1.05);
  c.closePath(); c.fill();
  /* the closed mouth line, and the teeth each species actually shows */
  c.strokeStyle = 'rgba(24,28,20,0.55)'; c.lineWidth = Math.max(1.4, bodyR * 0.09);
  c.beginPath();
  c.moveTo(hx + headL * 0.28, hy + jawW * 0.30);
  c.quadraticCurveTo(hx - headL * 0.28, hy + tipW * 0.9, hx - headL * 0.74, hy + tipW * 0.2);
  c.stroke();
  c.fillStyle = '#efe9d8';
  if (spec.snout === 'needle') {
    for (let i = 0; i < 13; i++) {
      const t = i / 12;
      const px = hx + headL * 0.24 - t * headL * 0.96;
      const w = tipW + (jawW - tipW) * (1 - t);
      c.beginPath(); c.moveTo(px, hy + w * 0.25); c.lineTo(px + 1.6, hy + w * 0.25); c.lineTo(px + 0.8, hy + w * 0.72); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(px, hy + w * 0.25); c.lineTo(px + 1.6, hy + w * 0.25); c.lineTo(px + 0.8, hy - w * 0.24); c.closePath(); c.fill();
    }
  } else if (spec.tooth) {
    /* the crocodile's fourth lower tooth, showing on a shut mouth */
    c.beginPath();
    c.moveTo(hx - headL * 0.18, hy + jawW * 0.42);
    c.lineTo(hx - headL * 0.12, hy + jawW * 0.42);
    c.lineTo(hx - headL * 0.15, hy - jawW * 0.05);
    c.closePath(); c.fill();
  }
  if (spec.knob) {   /* the gharial's ghara */
    c.fillStyle = shade(p, 0.9);
    c.beginPath(); c.ellipse(hx - headL * 0.70, hy - tipW * 1.3, tipW * 1.5, tipW * 1.25, 0, 0, TAU); c.fill();
  }
  /* the eyes and nostrils ride HIGH on the skull — a crocodilian floats with
     only these above water, and that is why they sit on raised turrets */
  for (const s of [-1, 1] as const) {
    const ex = hx + headL * 0.10, ey = hy - jawW * (0.92 + (s < 0 ? 0.14 : 0));
    c.fillStyle = shade(p, s < 0 ? 0.68 : 1.0);
    c.beginPath(); c.ellipse(ex + (s < 0 ? -bodyR * 0.18 : 0), ey, bodyR * 0.26, bodyR * 0.21, 0, 0, TAU); c.fill();
  }
  c.fillStyle = '#c9b64a';
  c.beginPath(); c.ellipse(hx + headL * 0.10, hy - jawW * 0.96, bodyR * 0.17, bodyR * 0.14, 0, 0, TAU); c.fill();
  c.fillStyle = '#14160f';
  c.beginPath(); c.ellipse(hx + headL * 0.10, hy - jawW * 0.96, bodyR * 0.05, bodyR * 0.13, 0, 0, TAU); c.fill();
  if (spec.ridge) {
    c.strokeStyle = shade(p, 0.55); c.lineWidth = Math.max(1.4, bodyR * 0.10);
    c.beginPath(); c.moveTo(hx + headL * 0.02, hy - jawW * 0.80); c.lineTo(hx - headL * 0.16, hy - jawW * 0.62); c.stroke();
  }
  c.fillStyle = shade(p, 0.5);
  c.beginPath(); c.ellipse(hx - headL * 0.66, hy - tipW * 0.5, bodyR * 0.12, bodyR * 0.09, 0, 0, TAU); c.fill();
  void r; void near;
}

/** ★ WAVE 14 — THE HOPPER. A kangaroo is the one large mammal in the catalogue
    that does not stand on four legs, and the quadruped system could not say it
    at any setting — so Kangaroo and Wallaby had no route and fell through to
    the verbatim engine. Its reference row is a body plan, not a decoration:
    "massive muscular hind legs and long feet · thick tapering tail used as a
    THIRD LEG · tiny forearms held against the chest". The tail is the giveaway:
    a kangaroo at rest is a tripod, and drawing it as a tail hanging off a
    standing animal loses the whole silhouette. */
export function faunaHopper(c: Ctx, g: G, pIn: Pal, name = ''): void {
  const r = nrng(g, name, 0x4B0F);
  const big = /kangaroo/i.test(name);
  /* a red kangaroo is rust-brown and a wallaby is grey — colour separates the
     two species as much as the ten percent of size between them does */
  const p = big ? anchor(pIn, 156, 96, 62, 0.80) : anchor(pIn, 122, 116, 106, 0.80);
  const gy = S * 0.80;
  const sz = big ? 1 : 0.80;
  /* the seed varies REAL proportion, so two macropods sharing this painter
     cannot render the same animal (D-ART-20) */
  const bodyH = S * 0.150 * sz * (0.94 + r() * 0.12), bodyW = S * 0.082 * sz * (0.94 + r() * 0.12);
  const hipX = S * 0.46, hipY = gy - S * 0.150 * sz;
  shadow(c, hipX + S * 0.02, gy + 4, S * 0.135 * sz, 0.40);

  /* THE TAIL FIRST, and it reaches the ground behind — the third leg of the
     tripod. Thick at the root as the animal's own thigh, tapering to a point. */
  const tailT = new Tube({
    P: pathThrough([
      [hipX + bodyW * 0.30, hipY + bodyH * 0.42],
      [hipX - bodyW * 1.30, hipY + bodyH * 0.86],
      [hipX - bodyW * 2.70, gy - bodyH * 0.10],
      [hipX - bodyW * 4.10, gy - 2],
    ]),
    R: (t) => bodyW * (0.58 - t * 0.44),
  });
  c.fillStyle = p.base;
  c.beginPath(); tailT.trace(c, 34); c.fill();
  c.save(); c.beginPath(); tailT.trace(c, 34); c.clip();
  countershade(c, tailT, p, 0.9);
  c.restore();

  /* THE HIND LEG — the mass of the animal. A deep folded thigh, a long shin,
     and a FOOT longer than the shin, flat on the ground: that outline is the
     single thing that says macropod. */
  const leg = (dx: number, m: number): void => {
    const thigh = new Tube({
      P: pathThrough([
        [hipX + dx, hipY + bodyH * 0.10],
        [hipX + dx - bodyW * 0.30, hipY + bodyH * 0.62],
        [hipX + dx - bodyW * 0.62, hipY + bodyH * 1.02],
      ]),
      R: (t) => bodyW * (0.82 - t * 0.30),
    });
    const shin = new Tube({
      P: pathThrough([
        [hipX + dx - bodyW * 0.62, hipY + bodyH * 1.00],
        [hipX + dx + bodyW * 0.18, gy - bodyH * 0.34],
        [hipX + dx + bodyW * 0.42, gy - bodyH * 0.06],
      ]),
      R: (t) => bodyW * (0.40 - t * 0.16),
    });
    for (const tb of [thigh, shin]) {
      c.fillStyle = `rgb(${(p.cr * m) | 0},${(p.cg * m) | 0},${(p.cb * m) | 0})`;
      c.beginPath(); tb.trace(c, 30); c.fill();
      c.save(); c.beginPath(); tb.trace(c, 30); c.clip();
      countershade(c, tb, { ...p, cr: p.cr * m, cg: p.cg * m, cb: p.cb * m }, 0.85);
      c.restore();
    }
    /* the long flat foot */
    c.fillStyle = `rgb(${(p.cr * 0.62 * m) | 0},${(p.cg * 0.62 * m) | 0},${(p.cb * 0.62 * m) | 0})`;
    c.beginPath();
    c.moveTo(hipX + dx + bodyW * 0.10, gy - bodyW * 0.30);
    c.lineTo(hipX + dx + bodyW * 1.85, gy - bodyW * 0.22);
    c.quadraticCurveTo(hipX + dx + bodyW * 2.05, gy, hipX + dx + bodyW * 1.80, gy);
    c.lineTo(hipX + dx - bodyW * 0.10, gy);
    c.closePath(); c.fill();
  };
  leg(-bodyW * 0.34, 0.62);

  /* the body: a pear leaning back over the hips, narrow chest, heavy rump */
  const trunk = new Tube({
    P: pathThrough([
      [hipX - bodyW * 0.20, hipY + bodyH * 0.30],
      [hipX + bodyW * 0.26, hipY - bodyH * 0.30],
      [hipX + bodyW * 0.62, hipY - bodyH * 0.92],
      [hipX + bodyW * 0.82, hipY - bodyH * 1.34],
    ]),
    R: (t) => bodyW * (1.02 - t * 0.52),
  });
  c.fillStyle = p.base;
  c.beginPath(); trunk.trace(c, 40); c.fill();
  c.save(); c.beginPath(); trunk.trace(c, 40); c.clip();
  countershade(c, trunk, p, 1);
  c.restore();
  leg(bodyW * 0.30, 1);

  /* the TINY forearms, held against the chest — the comic detail everyone
     remembers, and the thing that makes the hind legs read as massive */
  c.strokeStyle = `rgb(${(p.cr * 0.78) | 0},${(p.cg * 0.78) | 0},${(p.cb * 0.78) | 0})`;
  c.lineCap = 'round'; c.lineWidth = bodyW * 0.26;
  for (const d of [0, -bodyW * 0.16]) {
    c.beginPath();
    c.moveTo(hipX + bodyW * 0.66 + d, hipY - bodyH * 0.86);
    c.quadraticCurveTo(hipX + bodyW * 1.10 + d, hipY - bodyH * 0.74, hipX + bodyW * 0.96 + d, hipY - bodyH * 0.52);
    c.stroke();
  }

  /* the head: a long narrow muzzle and tall ears */
  const hx = hipX + bodyW * 0.98, hy = hipY - bodyH * 1.52, hr = bodyW * 0.56;
  for (const s of [-1, 1] as const) {
    const m = s < 0 ? 0.66 : 1;
    c.fillStyle = `rgb(${(p.cr * 0.60 * m) | 0},${(p.cg * 0.60 * m) | 0},${(p.cb * 0.62 * m) | 0})`;
    c.save(); c.translate(hx - hr * (s < 0 ? 0.72 : 0.46), hy - hr * 0.62); c.rotate(s * 0.26 - 0.10);
    c.beginPath(); c.ellipse(0, -hr * 0.66, hr * 0.32, hr * 0.90, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(${Math.min(255, p.cr * 1.05) | 0},${(p.cg * 0.80) | 0},${(p.cb * 0.80) | 0},${0.45 * m})`;
    c.beginPath(); c.ellipse(0, -hr * 0.62, hr * 0.16, hr * 0.62, 0, 0, TAU); c.fill();
    c.restore();
  }
  c.fillStyle = volume(c, p, hx, hy, hr * 1.3);
  c.beginPath(); c.ellipse(hx, hy, hr, hr * 0.90, 0, 0, TAU); c.fill();
  c.fillStyle = p.base;
  c.beginPath(); c.ellipse(hx + hr * 0.74, hy + hr * 0.24, hr * 0.56, hr * 0.34, 0.18, 0, TAU); c.fill();
  c.fillStyle = 'rgba(18,13,13,0.82)';
  c.beginPath(); c.ellipse(hx + hr * 1.20, hy + hr * 0.20, hr * 0.15, hr * 0.12, 0, 0, TAU); c.fill();
  eye(c, hx + hr * 0.16, hy - hr * 0.16, Math.max(3, hr * 0.20));
}

/** ★ WAVE 14 — THE MONOTREMES. A platypus and an echidna are the two mammals
    that lay eggs, and neither has ever had a route: the platypus measured 3.35
    aspect against a real 2.6 on the verbatim engine and the echidna was a
    generic small mammal. Each is defined by one impossible-looking feature —
    a rubbery duck BILL on a furred body, and a dome of two-tone SPINES over a
    tubular beak-snout with no visible mouth. */
export function faunaMonotreme(c: Ctx, g: G, pIn: Pal, name = ''): void {
  const r = nrng(g, name, 0x9E33);
  const echidna = /echidna/i.test(name);
  /* both are dark brown animals; the platypus reads by its BILL and the
     echidna by its spines, and a red one loses both to the colour */
  const p = echidna ? anchor(pIn, 74, 56, 40, 0.84) : anchor(pIn, 122, 96, 78, 0.80);
  const gy = S * 0.72;

  if (echidna) {
    const bw = S * 0.145, bh = S * 0.098;
    const cx = S * 0.50, cy = gy - bh * 0.62;
    shadow(c, cx, gy + 4, bw * 1.02, 0.38);
    /* the stocky splayed digging feet, before the body */
    c.fillStyle = shade(p, 0.46);
    for (const d of [-0.52, 0.30]) {
      c.beginPath(); c.ellipse(cx + bw * d, gy - bh * 0.06, bw * 0.20, bh * 0.20, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(232,226,208,0.85)'; c.lineWidth = 2; c.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(cx + bw * d + i * bw * 0.05, gy - bh * 0.02);
        c.lineTo(cx + bw * d + i * bw * 0.10 - bw * 0.10, gy + bh * 0.10); c.stroke();
      }
    }
    /* the body: a low dome */
    const bg = c.createLinearGradient(0, cy - bh, 0, cy + bh);
    bg.addColorStop(0, p.lit); bg.addColorStop(0.6, p.base); bg.addColorStop(1, shade(p, 0.44));
    c.fillStyle = bg;
    c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
    /* THE SPINES — long, cream with black tips, radiating from the dome. This
       is the animal; a spineless echidna is an anteater. */
    for (let i = 0; i < 150; i++) {
      const a = -Math.PI * (0.06 + r() * 0.88);
      const d0 = 0.42 + r() * 0.58;
      const x0 = cx + Math.cos(a) * bw * d0, y0 = cy + Math.sin(a) * bh * d0;
      const L = bh * (0.52 + r() * 0.72);
      const ex = x0 + Math.cos(a) * L * 1.15, ey = y0 + Math.sin(a) * L;
      c.strokeStyle = '#e6d7a8'; c.lineCap = 'round'; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = '#1d1a16'; c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(x0 + (ex - x0) * 0.62, y0 + (ey - y0) * 0.62);
      c.lineTo(ex, ey); c.stroke();
    }
    /* the short tubular beak-snout with NO visible mouth */
    c.fillStyle = shade(p, 0.72);
    c.save(); c.translate(cx + bw * 0.94, cy + bh * 0.34); c.rotate(0.30);
    c.beginPath(); c.ellipse(0, 0, bw * 0.30, bh * 0.14, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(16,12,12,0.8)';
    c.beginPath(); c.ellipse(bw * 0.26, 0, bh * 0.05, bh * 0.045, 0, 0, TAU); c.fill();
    c.restore();
    eye(c, cx + bw * 0.64, cy + bh * 0.06, 3.4);
    return;
  }

  /* the platypus: a low sleek body, a BILL, and a broad paddle tail */
  const bw = S * 0.175 * (0.95 + r() * 0.10), bh = S * 0.080 * (0.94 + r() * 0.13);
  const cx = S * 0.48, cy = gy - bh * 1.0;
  shadow(c, cx, gy + 4, bw * 1.05, 0.36);
  /* the paddle tail — broad, flat and blunt, held out behind */
  c.fillStyle = shade(p, 0.62);
  c.save(); c.translate(cx - bw * 1.02, cy + bh * 0.30); c.rotate(0.16);
  c.beginPath(); c.ellipse(0, 0, bw * 0.52, bh * 0.72, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(226,236,246,0.22)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(0, 0, bw * 0.50, bh * 0.70, 0, -2.6, -0.3); c.stroke();
  c.restore();
  /* the webbed clawed feet — ★ POLISH: a broad WEB FAN splayed on the ground
     with claw ticks past its edge, not a bare leg triangle (the must-read
     gp3 called absent entirely). */
  c.fillStyle = shade(p, 0.50);
  for (const d of [-0.44, 0.34]) {
    c.beginPath();
    c.moveTo(cx + bw * d, cy + bh * 0.62);
    c.lineTo(cx + bw * d - bw * 0.20, gy);
    c.lineTo(cx + bw * d + bw * 0.16, gy);
    c.closePath(); c.fill();
    /* the splayed web */
    c.fillStyle = 'rgba(58,46,44,0.95)';
    c.beginPath();
    c.moveTo(cx + bw * d - bw * 0.22, gy);
    c.quadraticCurveTo(cx + bw * d - bw * 0.02, gy - bh * 0.10, cx + bw * d + bw * 0.26, gy);
    c.quadraticCurveTo(cx + bw * d + bw * 0.10, gy + bh * 0.085, cx + bw * d - bw * 0.10, gy + bh * 0.075);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(230,224,210,0.85)'; c.lineWidth = 1.8; c.lineCap = 'round';
    for (let k = -1; k <= 1; k++) {   /* the claws past the web's edge */
      c.beginPath(); c.moveTo(cx + bw * d + k * bw * 0.12, gy + bh * 0.05);
      c.lineTo(cx + bw * d + k * bw * 0.15, gy + bh * 0.14); c.stroke();
    }
    c.fillStyle = shade(p, 0.50);
  }
  const bg = c.createLinearGradient(0, cy - bh, 0, cy + bh);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.55, p.base); bg.addColorStop(1, shade(p, 0.42));
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, -0.04, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(226,236,246,0.26)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, -0.04, -2.8, 0.2); c.stroke();
  /* THE BILL: flat, rubbery, wider than the head and a different material from
     the fur — that contrast is most of why the animal looks impossible */
  c.fillStyle = '#3a2e2c';
  c.save(); c.translate(cx + bw * 1.02, cy + bh * 0.18); c.rotate(0.10);
  c.beginPath(); c.ellipse(0, 0, bw * 0.56, bh * 0.56, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.14)';
  c.beginPath(); c.ellipse(-bw * 0.06, -bh * 0.14, bw * 0.26, bh * 0.16, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(14,10,10,0.8)';
  for (const s of [-1, 1] as const) { c.beginPath(); c.ellipse(bw * 0.20, s * bh * 0.13, bh * 0.05, bh * 0.04, 0, 0, TAU); c.fill(); }
  c.restore();
  /* the dense water-repellent pelt, which is why a platypus reads as FUR
     wearing a bill rather than as a duck */
  c.strokeStyle = shade(p, 0.62); c.lineCap = 'round'; c.lineWidth = 1.1;
  for (let i = 0; i < 90; i++) {
    const a = r() * TAU, d = Math.sqrt(r());
    const px = cx + Math.cos(a) * bw * d * 0.94, py = cy + Math.sin(a) * bh * d * 0.90;
    c.globalAlpha = 0.18 + r() * 0.24;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px - bw * 0.035, py + bh * 0.05); c.stroke();
  }
  c.globalAlpha = 1;
  eye(c, cx + bw * 0.56, cy - bh * 0.30, 3.6);
}

/** ★ WAVE 18 — THE LAST SEVEN FAUNA. Each is a body plan no shared system in
    the catalogue can express, which is why all seven were still falling to the
    verbatim engine after seventeen waves. Every value below is off that
    species' own reference row. */

/** a chameleon: a laterally flattened leaf on a branch, a helmet casque, cone
    eye turrets, and a tail wound into a tight spiral */
export function faunaChameleon(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0x0C1A);
  const cx = S * 0.46, cy = S * 0.48;
  const bw = S * 0.115, bh = S * 0.088;
  shadow(c, cx, S * 0.78, S * 0.13, 0.30);
  /* the branch it grips — a chameleon on nothing reads as a lizard */
  c.strokeStyle = '#5a4632'; c.lineWidth = S * 0.020; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.14, S * 0.70); c.quadraticCurveTo(S * 0.5, S * 0.66, S * 0.88, S * 0.72); c.stroke();

  /* THE SPIRAL TAIL, wound tight — drawn first so the body overlaps its root */
  const tcx = cx - bw * 1.28, tcy = cy + bh * 0.52;
  c.strokeStyle = shade(p, 0.82); c.lineCap = 'round';
  for (let i = 40; i >= 0; i--) {
    const t = i / 40;
    const a = -1.2 + t * Math.PI * 2.7;
    const rad = bh * (0.62 - t * 0.50);
    const x = tcx + Math.cos(a) * rad, y = tcy + Math.sin(a) * rad;
    c.lineWidth = bh * (0.30 - t * 0.22);
    if (i === 40) { c.beginPath(); c.moveTo(x, y); } else c.lineTo(x, y);
  }
  c.stroke();

  /* the body: LATERALLY FLATTENED — deep and thin, like a leaf seen edge-on */
  const bg = c.createLinearGradient(0, cy - bh, 0, cy + bh);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.5, p.base); bg.addColorStop(1, shade(p, 0.46));
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(cx - bw, cy + bh * 0.10);
  c.quadraticCurveTo(cx - bw * 0.4, cy - bh * 1.02, cx + bw * 0.62, cy - bh * 0.58);
  c.quadraticCurveTo(cx + bw * 1.02, cy - bh * 0.30, cx + bw * 0.96, cy + bh * 0.10);
  c.quadraticCurveTo(cx + bw * 0.2, cy + bh * 1.00, cx - bw, cy + bh * 0.10);
  c.closePath(); c.fill();
  /* the dorsal crest of small scales along the top edge */
  c.fillStyle = shade(p, 1.15);
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = cx - bw * 0.9 + t * bw * 1.6;
    const y = cy - bh * (0.62 + 0.34 * Math.sin(t * Math.PI));
    c.beginPath(); c.moveTo(x - 2.5, y + 3); c.lineTo(x, y - bh * 0.14); c.lineTo(x + 2.5, y + 3); c.closePath(); c.fill();
  }
  /* the mottled skin, in patches that follow the flank */
  for (let i = 0; i < 34; i++) {
    const px = cx - bw + r() * bw * 1.9, py = cy - bh * 0.8 + r() * bh * 1.6;
    c.fillStyle = `rgba(${Math.min(255, p.cr * (0.6 + r() * 0.9)) | 0},${Math.min(255, p.cg * (0.6 + r() * 0.9)) | 0},${Math.min(255, p.cb * (0.5 + r() * 0.8)) | 0},${0.20 + r() * 0.26})`;
    c.beginPath(); c.ellipse(px, py, bw * (0.06 + r() * 0.10), bh * (0.05 + r() * 0.09), r() * 3, 0, TAU); c.fill();
  }
  /* the zygodactyl feet — two toes opposing two, gripping the branch */
  c.strokeStyle = shade(p, 0.62); c.lineWidth = bh * 0.13; c.lineCap = 'round';
  for (const d of [-0.42, 0.42]) {
    const fx = cx + bw * d;
    c.beginPath(); c.moveTo(fx, cy + bh * 0.55); c.lineTo(fx + bw * 0.10, S * 0.70 - bh * 0.10); c.stroke();
    for (const s2 of [-1, 1] as const) {
      c.beginPath(); c.moveTo(fx + bw * 0.10, S * 0.70 - bh * 0.10);
      c.lineTo(fx + bw * 0.10 + s2 * bw * 0.13, S * 0.70 + bh * 0.10); c.stroke();
    }
  }
  /* the head: a HELMET CASQUE rising off the back of the skull */
  const hx = cx + bw * 0.94, hy = cy - bh * 0.30, hr = bh * 0.48;
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(hx, hy, hr * 1.25, hr * 0.92, -0.12, 0, TAU); c.fill();
  c.fillStyle = shade(p, 1.05);
  c.beginPath();
  c.moveTo(hx - hr * 1.10, hy - hr * 0.20);
  c.quadraticCurveTo(hx - hr * 0.55, hy - hr * 2.10, hx + hr * 0.45, hy - hr * 0.72);
  c.closePath(); c.fill();
  /* THE CONE EYE TURRET — a whole cone of skin with a pinhole pupil */
  const ex = hx + hr * 0.18, ey = hy - hr * 0.14;
  c.fillStyle = shade(p, 0.92);
  c.beginPath(); c.ellipse(ex, ey, hr * 0.52, hr * 0.50, 0, 0, TAU); c.fill();
  c.strokeStyle = shade(p, 0.55); c.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    c.beginPath(); c.moveTo(ex + Math.cos(a) * hr * 0.20, ey + Math.sin(a) * hr * 0.20);
    c.lineTo(ex + Math.cos(a) * hr * 0.50, ey + Math.sin(a) * hr * 0.48); c.stroke();
  }
  c.fillStyle = '#c8a63a';
  c.beginPath(); c.arc(ex + hr * 0.10, ey, hr * 0.17, 0, TAU); c.fill();
  c.fillStyle = '#100e0c';
  c.beginPath(); c.arc(ex + hr * 0.12, ey, hr * 0.07, 0, TAU); c.fill();
  /* the mouth line running back under the turret */
  c.strokeStyle = 'rgba(20,16,12,0.42)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(hx - hr * 0.6, hy + hr * 0.42);
  c.quadraticCurveTo(hx + hr * 0.6, hy + hr * 0.56, hx + hr * 1.20, hy + hr * 0.24); c.stroke();
}

/** a frilled lizard: the frill IS the animal, fanned out behind a gaping mouth */
export function faunaFrilled(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0x0F71);
  const gy = S * 0.74;
  const bw = S * 0.088, bh = S * 0.042;
  const cx = S * 0.42, cy = gy - bh * 1.6;
  shadow(c, cx + S * 0.04, gy + 4, S * 0.16, 0.34);
  /* the whip tail, over half the total length */
  c.strokeStyle = shade(p, 0.78); c.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = cx - bw * 0.9 - t * S * 0.30;
    const y = cy + bh * 0.4 + Math.sin(t * 3.4) * bh * 1.5;
    c.lineWidth = bh * (0.62 - t * 0.56);
    if (!i) { c.beginPath(); c.moveTo(x, y); } else c.lineTo(x, y);
  }
  c.stroke();
  /* the sprawling limbs */
  c.strokeStyle = shade(p, 0.66); c.lineWidth = bh * 0.42;
  for (const [lx, back] of [[-0.5, true], [0.5, false]] as Array<[number, boolean]>) {
    for (const s2 of [-1, 1] as const) {
      c.beginPath();
      c.moveTo(cx + bw * lx, cy + bh * 0.5);
      c.quadraticCurveTo(cx + bw * lx + s2 * bw * (back ? 0.9 : 0.8), cy + bh * 1.6,
        cx + bw * lx + s2 * bw * (back ? 1.1 : 1.0) + (back ? -bw * 0.3 : bw * 0.3), gy);
      c.stroke();
    }
  }
  /* THE FRILL — a huge circular sheet of skin, fanned, with radiating ribs.
     It is drawn BEFORE the head so the skull sits in the middle of it. */
  /* the frill varies per species: the seed drives its real radius, not noise */
  const fx = cx + bw * 1.30, fy = cy - bh * 0.30, fr = S * 0.115 * (0.90 + r() * 0.20);
  const fg = c.createRadialGradient(fx, fy, fr * 0.15, fx, fy, fr);
  fg.addColorStop(0, `rgb(${Math.min(255, p.cr * 1.25) | 0},${(p.cg * 0.78) | 0},${(p.cb * 0.56) | 0})`);
  fg.addColorStop(0.6, `rgb(${Math.min(255, p.cr * 1.05) | 0},${(p.cg * 0.62) | 0},${(p.cb * 0.42) | 0})`);
  fg.addColorStop(1, shade(p, 0.52));
  c.fillStyle = fg;
  c.beginPath();
  for (let i = 0; i <= 26; i++) {
    const a = -Math.PI * 0.86 + (i / 26) * Math.PI * 1.72;
    const wob = 1 + Math.sin(i * 1.7) * 0.055;
    c.lineTo(fx + Math.cos(a) * fr * wob, fy + Math.sin(a) * fr * 1.06 * wob);
  }
  c.closePath(); c.fill();
  c.strokeStyle = `rgba(${(p.cr * 0.42) | 0},${(p.cg * 0.34) | 0},${(p.cb * 0.28) | 0},0.55)`;
  c.lineWidth = 1.4;
  for (let i = 0; i <= 11; i++) {
    const a = -Math.PI * 0.82 + (i / 11) * Math.PI * 1.64;
    c.beginPath(); c.moveTo(fx, fy);
    c.lineTo(fx + Math.cos(a) * fr * 0.96, fy + Math.sin(a) * fr * 1.02); c.stroke();
  }
  /* the body */
  c.fillStyle = volume(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, -0.06, 0, TAU); c.fill();
  /* the head with the GAPING PINK MOUTH at the frill's centre */
  c.fillStyle = shade(p, 1.0);
  c.beginPath(); c.ellipse(fx + fr * 0.10, fy, bh * 1.25, bh * 0.92, 0, 0, TAU); c.fill();
  c.fillStyle = '#c4525c';
  c.beginPath();
  c.moveTo(fx - bh * 0.5, fy + bh * 0.10);
  c.quadraticCurveTo(fx + bh * 1.5, fy - bh * 0.55, fx + bh * 1.9, fy + bh * 0.10);
  c.quadraticCurveTo(fx + bh * 1.4, fy + bh * 0.95, fx - bh * 0.5, fy + bh * 0.10);
  c.closePath(); c.fill();
  c.fillStyle = '#f2ece0';
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    c.beginPath(); c.arc(fx + bh * (0.1 + t * 1.5), fy - bh * (0.26 - t * 0.16), 1.5, 0, TAU); c.fill();
  }
  eye(c, fx + fr * 0.02, fy - bh * 0.42, Math.max(3, bh * 0.34));
}

/** a seahorse: a horse head at RIGHT ANGLES to a ringed upright body, ending
    in a curled prehensile tail with no fin at all */
export function faunaSeahorse(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0x5EA4);
  const cx = S * 0.50, top = S * 0.20;
  const H = S * 0.34 * (0.92 + r() * 0.16), w = S * 0.048 * (0.92 + r() * 0.16);
  shadow(c, cx, S * 0.80, S * 0.09, 0.26);
  /* the body: an S-curve running down into a tight coil */
  const spine = pathThrough([
    [cx + w * 0.3, top + H * 0.10],
    [cx - w * 0.5, top + H * 0.42],
    [cx + w * 0.4, top + H * 0.74],
    [cx + w * 1.5, top + H * 1.02],
    [cx + w * 1.1, top + H * 1.30],
    [cx + w * 0.2, top + H * 1.16],
  ]);
  const tube = new Tube({ P: spine, R: (t) => w * (1.02 - t * 0.86) });
  c.fillStyle = p.base;
  c.beginPath(); tube.trace(c, 44); c.fill();
  c.save(); c.beginPath(); tube.trace(c, 44); c.clip();
  countershade(c, tube, p, 0.95);
  /* THE BONY RINGS — a seahorse is armour plating, not skin */
  c.strokeStyle = `rgba(${(p.cr * 0.42) | 0},${(p.cg * 0.44) | 0},${(p.cb * 0.36) | 0},0.62)`;
  c.lineWidth = 1.6;
  for (let i = 1; i < 20; i++) {
    const u = i / 20, f = tube.frame(u);
    c.beginPath();
    c.moveTo(f.x + f.nx * f.r * 1.1, f.y + f.ny * f.r * 1.1);
    c.lineTo(f.x - f.nx * f.r * 1.1, f.y - f.ny * f.r * 1.1);
    c.stroke();
  }
  c.restore();
  /* the tiny dorsal fin, the only fin it has */
  c.fillStyle = `rgba(${Math.min(255, p.cr * 1.2) | 0},${Math.min(255, p.cg * 1.2) | 0},${Math.min(255, p.cb * 1.1) | 0},0.55)`;
  const df = tube.frame(0.44);
  c.beginPath();
  c.ellipse(df.x - df.nx * w * 1.3, df.y - df.ny * w * 1.3, w * 0.9, w * 0.42, Math.atan2(df.ty, df.tx), 0, TAU);
  c.fill();
  /* THE HEAD, held at a RIGHT ANGLE to the body — the whole recognition */
  const hx = cx + w * 0.5, hy = top + H * 0.04;
  c.fillStyle = p.base;
  c.beginPath(); c.ellipse(hx, hy, w * 0.86, w * 0.70, -0.3, 0, TAU); c.fill();
  /* the long tubular snout, pointing forward and down */
  c.strokeStyle = p.base; c.lineCap = 'round'; c.lineWidth = w * 0.44;
  c.beginPath(); c.moveTo(hx + w * 0.5, hy + w * 0.16);
  c.lineTo(hx + w * 1.75, hy + w * 0.62); c.stroke();
  /* the coronet on the crown */
  c.fillStyle = shade(p, 1.2);
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.moveTo(hx - w * 0.2 + i * w * 0.22, hy - w * 0.6);
    c.lineTo(hx - w * 0.1 + i * w * 0.24, hy - w * 1.15);
    c.lineTo(hx + i * w * 0.26, hy - w * 0.58);
    c.closePath(); c.fill();
  }
  eye(c, hx + w * 0.16, hy - w * 0.10, Math.max(3, w * 0.24));
}

/** a caecilian: a limbless ringed worm with a bullet head and no eyes */
export function faunaCaecilian(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0xCEC1);
  const cy = S * 0.50;
  shadow(c, S * 0.5, S * 0.70, S * 0.26, 0.30);
  /* how many body waves it lies in — a caecilian is never twice the same */
  const waves = 2.2 + r() * 1.0;
  const spine = (u: number): [number, number] =>
    [S * 0.10 + u * S * 0.80, cy + Math.sin(u * Math.PI * waves) * S * 0.075];
  const tube = new Tube({ P: spine, R: (u) => S * 0.026 * (0.55 + Math.sin(Math.min(1, 0.08 + u) * Math.PI) * 0.72) });
  c.fillStyle = p.base;
  c.beginPath(); tube.trace(c, 60); c.fill();
  c.save(); c.beginPath(); tube.trace(c, 60); c.clip();
  countershade(c, tube, p, 1);
  /* THE ANNULAR GROOVES — the rings that make it a caecilian and not an eel */
  c.strokeStyle = `rgba(${(p.cr * 0.38) | 0},${(p.cg * 0.38) | 0},${(p.cb * 0.40) | 0},0.55)`;
  c.lineWidth = 1.5;
  for (let i = 1; i < 46; i++) {
    const u = i / 46, f = tube.frame(u);
    c.beginPath();
    c.moveTo(f.x + f.nx * f.r * 1.15, f.y + f.ny * f.r * 1.15);
    c.lineTo(f.x - f.nx * f.r * 1.15, f.y - f.ny * f.r * 1.15);
    c.stroke();
  }
  c.restore();
  /* the blunt bullet head — NO eyes, one tiny sensory tentacle */
  const h = tube.frame(0.985);
  c.fillStyle = shade(p, 0.92);
  c.beginPath(); c.ellipse(h.x + h.r * 0.5, h.y, h.r * 1.25, h.r * 1.05, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(24,18,18,0.5)';
  c.beginPath(); c.ellipse(h.x + h.r * 1.2, h.y + h.r * 0.22, h.r * 0.26, h.r * 0.16, 0, 0, TAU); c.fill();
  c.fillStyle = shade(p, 1.25);
  c.beginPath(); c.arc(h.x + h.r * 0.9, h.y - h.r * 0.34, h.r * 0.17, 0, TAU); c.fill();
}

/** a poison dart frog: a tiny smooth body in vivid warning colour with bold
    contrasting blotches — the colour IS the animal, so it is forced */
export function faunaDartFrog(c: Ctx, g: G, pIn: Pal, name = ''): void {
  const r = nrng(g, name, 0xDA27);
  /* aposematic colour: the point of the animal is that it SHOUTS */
  const hues: Array<[number, number, number]> = [[218, 44, 40], [232, 176, 26], [26, 132, 214], [40, 190, 96]];
  const hv = hues[Math.floor(r() * hues.length)]!;
  const p = anchor(pIn, hv[0], hv[1], hv[2], 0.88);
  const cx = S * 0.50, gy = S * 0.70;
  const bw = S * 0.115, bh = S * 0.082;
  const cy = gy - bh * 0.86;
  shadow(c, cx, gy + 4, bw * 1.0, 0.34);
  /* the folded hind legs, drawn wide */
  c.fillStyle = shade(p, 0.78);
  for (const s of [-1, 1] as const) {
    c.beginPath();
    c.ellipse(cx + s * bw * 0.72, cy + bh * 0.52, bw * 0.42, bh * 0.34, s * 0.5, 0, TAU);
    c.fill();
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.ellipse(cx + s * bw * (1.10 + Math.abs(i) * 0.10), gy - bh * 0.06 + i * bh * 0.14, bw * 0.16, bh * 0.07, 0, 0, TAU);
      c.fill();
    }
  }
  const bg = c.createRadialGradient(cx - bw * 0.3, cy - bh * 0.5, 2, cx, cy, bw * 1.3);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.6, p.base); bg.addColorStop(1, shade(p, 0.46));
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  /* the bold contrasting blotches its row names */
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 0.82;
    c.fillStyle = `rgba(14,12,16,${0.62 + r() * 0.28})`;
    c.beginPath();
    c.ellipse(cx + Math.cos(a) * bw * d, cy + Math.sin(a) * bh * d,
      bw * (0.10 + r() * 0.13), bh * (0.10 + r() * 0.14), r() * 3, 0, TAU);
    c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,0.30)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, bw * 0.96, bh * 0.94, 0, -2.7, -0.2); c.stroke();
  /* the rounded blunt snout and the jet-black eyes */
  /* ★ WAVE 39 — BOTH EYES WERE IN THE SAME CORNER. They shared one x
     (cx + 0.52·bw) with the far one nudged back by 0.22·bw at almost the same
     height, so the verifier saw "both eyes crammed together into the upper-right
     of a single red blob facing the same way" and a stranger read the tile as a
     ladybird. A frog's eyes are its most diagnostic feature: two separated domes
     that BULGE ABOVE the body outline. Set apart along the skull and raised
     until they break the silhouette — which is also what gives the frog a head,
     the other half of "the head is not separable from the body". */
  for (const s of [-1, 1] as const) {
    const far = s < 0;
    const ex = cx + bw * (far ? 0.14 : 0.58);
    const ey = cy - bh * (far ? 0.88 : 0.76);
    const er = bh * (far ? 0.25 : 0.33);
    c.fillStyle = far ? shade(p, 0.7) : p.base;
    c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.fillStyle = '#0b0a0c';
    c.beginPath(); c.arc(ex, ey, er * 0.70, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(ex - (s < 0 ? bw * 0.22 : 0) - bh * 0.06, ey - bh * 0.08, bh * 0.06, 0, TAU); c.fill();
  }
  c.strokeStyle = 'rgba(12,10,12,0.42)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(cx + bw * 0.20, cy + bh * 0.28);
  c.quadraticCurveTo(cx + bw * 0.74, cy + bh * 0.30, cx + bw * 0.95, cy + bh * 0.02); c.stroke();
}

/** the two deep-sea cephalopods: a WEBBED CLOAK joining all eight arms, and
    ear-like fins flapping off the top of the mantle. Nothing else in the
    catalogue has a cape. */
export function faunaCloakSquid(c: Ctx, g: G, pIn: Pal, name = ''): void {
  const r = nrng(g, name, 0x7C10);
  const vamp = /vampire/i.test(name);
  const p = vamp ? anchor(pIn, 128, 34, 48, 0.72) : anchor(pIn, 152, 122, 142, 0.62);
  const cx = S * 0.50, my = S * 0.34;
  const mw = S * 0.085, mh = S * 0.115;
  shadow(c, cx, S * 0.80, S * 0.14, 0.24);
  /* the EAR FINS on top of the mantle */
  c.fillStyle = `rgba(${Math.min(255, p.cr * 1.1) | 0},${(p.cg * 0.8) | 0},${(p.cb * 0.9) | 0},0.85)`;
  for (const s of [-1, 1] as const) {
    c.save(); c.translate(cx + s * mw * 0.86, my - mh * 0.52); c.rotate(s * 0.55);
    c.beginPath(); c.ellipse(0, 0, mw * 0.66, mh * 0.30, 0, 0, TAU); c.fill();
    c.restore();
  }
  /* the mantle */
  const mg = c.createLinearGradient(cx - mw, 0, cx + mw, 0);
  mg.addColorStop(0, p.lit); mg.addColorStop(0.45, p.base); mg.addColorStop(1, shade(p, 0.44));
  c.fillStyle = mg;
  c.beginPath(); c.ellipse(cx, my, mw, mh, 0, 0, TAU); c.fill();
  /* THE CLOAK — one continuous web joining all eight arms into a cape, which
     is the single thing that makes this animal not an octopus */
  const armTip: Array<[number, number]> = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const a = Math.PI * (0.16 + t * 0.68);
    const L = S * (0.20 + Math.sin(t * Math.PI) * 0.07);
    armTip.push([cx + Math.cos(a) * L * 1.05, my + mh * 0.55 + Math.sin(a) * L]);
  }
  const wg = c.createLinearGradient(0, my + mh * 0.4, 0, S * 0.76);
  wg.addColorStop(0, `rgba(${(p.cr * 0.9) | 0},${(p.cg * 0.55) | 0},${(p.cb * 0.66) | 0},0.90)`);
  wg.addColorStop(1, `rgba(${(p.cr * 0.42) | 0},${(p.cg * 0.24) | 0},${(p.cb * 0.32) | 0},0.72)`);
  c.fillStyle = wg;
  c.beginPath();
  c.moveTo(cx - mw * 0.9, my + mh * 0.55);
  for (let i = 0; i < armTip.length; i++) {
    const [ax, ay] = armTip[i]!;
    const prev: [number, number] = i ? armTip[i - 1]! : [cx - mw * 0.9, my + mh * 0.55];
    c.quadraticCurveTo((prev[0] + ax) / 2, (prev[1] + ay) / 2 + S * 0.045, ax, ay);
  }
  c.lineTo(cx + mw * 0.9, my + mh * 0.55);
  c.closePath(); c.fill();
  /* the arms themselves, as ribs inside the cloak */
  c.strokeStyle = `rgba(${(p.cr * 0.5) | 0},${(p.cg * 0.28) | 0},${(p.cb * 0.36) | 0},0.85)`;
  c.lineCap = 'round';
  for (const [ax, ay] of armTip) {
    c.lineWidth = mw * 0.16;
    c.beginPath(); c.moveTo(cx, my + mh * 0.5);
    c.quadraticCurveTo((cx + ax) / 2, (my + ay) / 2 + S * 0.02, ax, ay);
    c.stroke();
  }
  /* the eyes. A vampire squid reads in profile — one HUGE red eye (largest
     for its size of any animal). ★ POLISH — the dumbo octopus was wearing
     that same single central eye and Nick's gold audit called it "cyclopean
     …skirt/dress-like"; an octopus faces you with TWO eyes, one each side
     of the mantle base. */
  const er = mw * (vamp ? 0.52 : 0.34);
  for (const s of vamp ? [1] : [-1, 1]) {
    const ex = vamp ? cx + mw * 0.34 : cx + s * mw * 0.46;
    const ey = my + mh * (vamp ? 0.10 : 0.34);
    c.fillStyle = vamp ? '#e04a3c' : '#d8d2c4';
    c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.fillStyle = '#100c10';
    c.beginPath(); c.arc(ex, ey, er * 0.52, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.arc(ex - er * 0.30, ey - er * 0.24, er * 0.20, 0, TAU); c.fill();
  }
  if (vamp) {
    /* the photophore sparks a vampire squid fires instead of ink */
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = S * (0.12 + r() * 0.14);
      c.fillStyle = `rgba(150,220,255,${0.20 + r() * 0.4})`;
      c.beginPath(); c.arc(cx + Math.cos(a) * d, my + mh * 0.6 + Math.sin(a) * d * 0.6, 1 + r() * 1.6, 0, TAU); c.fill();
    }
  }
}
