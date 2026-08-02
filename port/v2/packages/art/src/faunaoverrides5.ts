/* faunaoverrides5.ts — WAVE 21: the named-species NEEDS_FIX fauna.
   Nine animals the shared systems route but cannot say. The bear came out of
   the quadruped system as a spiky yellow sausage, the sirenians never had a
   route at all and fell through to the verbatim engine as spheres, and the
   cuttlefish borrowed the octopus. Each of these is a case where the SIGNATURE
   is the whole identity and no parameter on a shared spec reaches it. */
import { mulberry32, TAU } from '@cf/domain-rand';

type Ctx = CanvasRenderingContext2D;
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
  c.fillStyle = tg; c.fillRect(cx - S * 0.085, S * 0.04, S * 0.17, S * 0.92);
  c.strokeStyle = 'rgba(24,18,12,0.45)'; c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = cx - S * 0.07 + r() * S * 0.14;
    c.beginPath(); c.moveTo(x, S * 0.06); c.lineTo(x + (r() - 0.5) * 10, S * 0.94); c.stroke();
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
  c.beginPath();
  c.moveTo(cx - w * 0.42, cy + w * 0.30);
  c.bezierCurveTo(cx - w * 1.02, cy + w * 0.22, cx - w * 1.06, cy - w * 0.66, cx, cy - w * 0.72);
  c.bezierCurveTo(cx + w * 1.06, cy - w * 0.66, cx + w * 1.02, cy + w * 0.22, cx + w * 0.42, cy + w * 0.30);
  c.lineTo(cx + w * 0.36, cy + w * 0.14);
  c.bezierCurveTo(cx + w * 0.80, cy + w * 0.06, cx + w * 0.72, cy - w * 0.48, cx, cy - w * 0.54);
  c.bezierCurveTo(cx - w * 0.72, cy - w * 0.48, cx - w * 0.80, cy + w * 0.06, cx - w * 0.36, cy + w * 0.14);
  c.closePath();
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
