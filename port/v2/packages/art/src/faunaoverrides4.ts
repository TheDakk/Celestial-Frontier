/* faunaoverrides4.ts — WAVE 19: the Platinum-audit fauna blockers.
   Five species the shared systems route plausibly but draw generically,
   where the audit is right that the SIGNATURE is the identity: a kiwi has
   no visible wings, a mudskipper props itself up on its pectorals, a
   pyrosome is a hollow colonial tube, a salp is a chain of glass barrels,
   and a tripod fish stands on three fin rays. */
import { mulberry32, TAU } from '@cf/domain-rand';
import type { ArtContext2D } from './speciescanvas.js';

type Ctx = ArtContext2D;
type G = Record<string, unknown>;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

function seeded(g: G, salt: number): () => number { return mulberry32((((g.seed as number) ^ salt) >>> 0)); }
/* blend the genome tint toward an anchor the real organism is DEFINED by
   (D-ART-60's macroalgae rule, generalised): a kiwi that renders lime green
   stops being a kiwi, so brown is admitted as identity and the genome tint
   survives as the variation on top of it */
function anchor(p: Pal, ar: number, ag: number, ab: number, k: number): Pal {
  const j = 1 - k;
  const cr = (ar * k + p.cr * j) | 0, cg = (ag * k + p.cg * j) | 0, cb = (ab * k + p.cb * j) | 0;
  return {
    base: `rgb(${cr},${cg},${cb})`, cr, cg, cb,
    lit: `rgb(${Math.min(255, cr * 1.34 | 0)},${Math.min(255, cg * 1.34 | 0)},${Math.min(255, cb * 1.34 | 0)})`,
    dark: `rgb(${cr * 0.44 | 0},${cg * 0.44 | 0},${cb * 0.44 | 0})`,
  };
}
function shadow(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(cx, cy, rx, S * 0.026, 0, 0, TAU); c.fill();
}
function lit(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.4, 2, x, y, r * 1.2);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function eye(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#0d1016'; c.beginPath(); c.arc(x, y, r * 0.6, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.34, r * 0.24, 0, TAU); c.fill();
}

/* ── KIWI: a low round flightless body, NO visible wing, a long thin bill
   and hair-like plumage breaking the whole outline ── */
export function faunaKiwi(c: Ctx, g: G, pIn: Pal): void {
  const p = anchor(pIn, 118, 88, 58, 0.72);
  const r = seeded(g, 0x11E1);
  const cx = S * 0.52, cy = S * 0.52, bw = S * 0.19, bh = S * 0.16;
  shadow(c, cx, cy + bh + S * 0.06, S * 0.17);
  /* the short sturdy legs — a kiwi stands LOW, feet well under the body */
  c.strokeStyle = '#b08a4e'; c.lineCap = 'round'; c.lineWidth = 8;
  for (const s of [-1, 1] as const) {
    const lx = cx + s * bw * 0.24;
    c.beginPath(); c.moveTo(lx, cy + bh * 0.7); c.lineTo(lx + s * 4, cy + bh + S * 0.055); c.stroke();
    c.lineWidth = 4;
    for (const d of [-1, 0, 1]) { c.beginPath(); c.moveTo(lx + s * 4, cy + bh + S * 0.055); c.lineTo(lx + s * 4 - 12 + d * 8, cy + bh + S * 0.075); c.stroke(); }
    c.lineWidth = 8;
  }
  /* the pear-shaped body — wide at the rear, NO wing drawn at all */
  c.fillStyle = lit(c, p, cx, cy, bw);
  c.beginPath();
  c.moveTo(cx - bw, cy + bh * 0.1);
  c.bezierCurveTo(cx - bw * 1.05, cy - bh * 0.9, cx + bw * 0.4, cy - bh * 1.05, cx + bw * 0.86, cy - bh * 0.35);
  c.bezierCurveTo(cx + bw * 1.1, cy + bh * 0.35, cx + bw * 0.3, cy + bh * 1.0, cx - bw * 0.2, cy + bh * 0.95);
  c.bezierCurveTo(cx - bw * 0.8, cy + bh * 0.9, cx - bw * 1.02, cy + bh * 0.6, cx - bw, cy + bh * 0.1);
  c.closePath(); c.fill();
  /* HAIR-LIKE plumage: a kiwi's feathers look like coarse fur and break the
     silhouette completely — that shaggy outline is most of the recognition */
  c.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const a = r() * TAU;
    /* seat the shaft INSIDE the body and let it emerge — a feather that
       starts on the outline is a spike stuck to a ball (THE SURFACE LAWS) */
    const s0 = 0.52 + r() * 0.46;
    const sx = cx + Math.cos(a) * bw * s0, sy = cy + Math.sin(a) * bh * s0;
    const nx = Math.cos(a), ny = Math.sin(a);
    /* the DRAPE: kiwi plumage hangs — every shaft sweeps back and down, so
       the coat lies on the animal instead of radiating out of it */
    const dx = nx * 0.34 - 0.62, dy = ny * 0.30 + 0.72;
    const dl = Math.hypot(dx, dy) || 1;
    const L = S * (0.020 + r() * 0.055) * (0.55 + s0 * 0.6);
    const ux = dx / dl, uy = dy / dl;
    /* light: shafts on the lit shoulder are pale, those in the shade are not */
    const key = (-nx * 0.5 - ny * 0.86) * 0.5 + 0.5;
    const m = 0.62 + key * 0.55;
    c.strokeStyle = `rgb(${Math.min(255, p.cr * m | 0)},${Math.min(255, p.cg * m | 0)},${Math.min(255, p.cb * m | 0)})`;
    c.globalAlpha = 0.22 + r() * 0.4; c.lineWidth = 0.9 + r() * 1.0;
    c.beginPath(); c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + ux * L * 0.5 + nx * L * 0.22, sy + uy * L * 0.5 + ny * L * 0.22,
      sx + ux * L + nx * L * 0.16, sy + uy * L + ny * L * 0.16);
    c.stroke();
  }
  c.globalAlpha = 1;
  /* the small head on a short neck, and THE BILL — long, thin, downcurved,
     with the kiwi's nostrils at the very tip */
  const hx = cx + bw * 0.92, hy = cy - bh * 0.52;
  c.fillStyle = lit(c, p, hx, hy, bh * 0.34);
  c.beginPath(); c.arc(hx, hy, bh * 0.34, 0, TAU); c.fill();
  c.strokeStyle = '#c8a06a'; c.lineWidth = 6; c.lineCap = 'round';
  const bex = hx + S * 0.20, bey = hy + S * 0.055;
  c.beginPath(); c.moveTo(hx + bh * 0.2, hy);
  c.quadraticCurveTo(hx + S * 0.11, hy + S * 0.005, bex, bey); c.stroke();
  c.strokeStyle = '#8a6a40'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(hx + bh * 0.2, hy + 2); c.quadraticCurveTo(hx + S * 0.11, hy + S * 0.008, bex, bey); c.stroke();
  c.fillStyle = '#3a2c1c'; c.beginPath(); c.arc(bex - 3, bey - 1, 2.2, 0, TAU); c.fill();   /* the nostril AT the tip */
  eye(c, hx - bh * 0.06, hy - bh * 0.1, 4);
  /* the coarse whiskers around the bill base */
  c.strokeStyle = 'rgba(40,30,20,0.6)'; c.lineWidth = 1.4;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(hx + bh * 0.16, hy + 2); c.lineTo(hx + bh * 0.16 + 22, hy + 2 + i * 7); c.stroke(); }
}

/* ── MUDSKIPPER: eyes ON TOP, propped up on muscular pectoral fins, out of
   the water on a mud bank ── */
export function faunaMudskipper(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x3D5C);
  const cx = S * 0.48, cy = S * 0.54, L = S * 0.22, h = S * 0.062;
  /* the mud bank it is sitting ON — an amphibious fish needs land */
  const mg = c.createLinearGradient(0, cy + h * 1.2, 0, cy + h * 3.4);
  mg.addColorStop(0, 'rgba(70,56,40,0.85)'); mg.addColorStop(1, 'rgba(40,32,22,0)');
  c.fillStyle = mg;
  c.beginPath(); c.ellipse(cx, cy + h * 1.8, L * 1.5, h * 1.5, 0, 0, TAU); c.fill();
  /* the tail, curved on the mud */
  c.fillStyle = p.dark;
  c.beginPath(); c.moveTo(cx - L * 0.85, cy);
  c.quadraticCurveTo(cx - L * 1.5, cy - h * 0.6, cx - L * 1.42, cy + h * 1.0);
  c.quadraticCurveTo(cx - L * 1.1, cy + h * 0.6, cx - L * 0.85, cy + h * 0.6);
  c.closePath(); c.fill();
  /* the body — a stout cylinder, head raised */
  c.fillStyle = lit(c, p, cx, cy, L * 0.7);
  c.beginPath();
  c.moveTo(cx - L * 0.9, cy - h * 0.5);
  c.quadraticCurveTo(cx, cy - h * 1.25, cx + L * 0.82, cy - h * 1.15);
  c.quadraticCurveTo(cx + L * 1.05, cy - h * 0.2, cx + L * 0.8, cy + h * 0.8);
  c.quadraticCurveTo(cx, cy + h * 1.15, cx - L * 0.9, cy + h * 0.6);
  c.closePath(); c.fill();
  /* THE PECTORAL PROPS — muscular arm-like fins holding the front up */
  for (const s of [-1, 0.35] as const) {
    const px = cx + L * 0.34, py = cy + h * 0.5;
    c.fillStyle = p.dark;
    c.save(); c.translate(px + s * 8, py); c.rotate(0.7 + s * 0.25);
    c.beginPath(); c.ellipse(0, h * 0.5, h * 0.34, h * 0.85, 0, 0, TAU); c.fill();   /* the muscular base */
    c.beginPath(); c.ellipse(0, h * 1.25, h * 0.55, h * 0.34, 0, 0, TAU); c.fill();  /* the splayed blade */
    c.strokeStyle = 'rgba(30,24,16,0.4)'; c.lineWidth = 1.4;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(0, h * 0.9); c.lineTo(k * 6, h * 1.55); c.stroke(); }
    c.restore();
  }
  /* the twin dorsal fins, held up like sails */
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.75)`;
  for (const [dx, dw] of [[-0.35, 0.28], [0.22, 0.26]] as const) {
    c.beginPath(); c.moveTo(cx + L * dx, cy - h * 1.05);
    c.quadraticCurveTo(cx + L * (dx + dw * 0.5), cy - h * 2.3, cx + L * (dx + dw), cy - h * 1.0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(240,246,255,0.35)'; c.lineWidth = 1.4;
    for (let k = 0; k <= 3; k++) { const u = k / 3; c.beginPath(); c.moveTo(cx + L * (dx + dw * u), cy - h * 1.02); c.lineTo(cx + L * (dx + dw * u * 0.9), cy - h * (1.6 + Math.sin(u * Math.PI) * 0.55)); c.stroke(); }
  }
  for (let i = 0; i < 24; i++) {   /* the mottled skin */
    const x = cx - L * 0.85 + r() * L * 1.6, y = cy - h * 0.9 + r() * h * 1.8;
    c.fillStyle = `rgba(30,26,18,${0.10 + r() * 0.14})`;
    c.beginPath(); c.ellipse(x, y, 4 + r() * 5, 3 + r() * 3, 0, 0, TAU); c.fill();
  }
  /* THE EYES — bulging, ON TOP OF THE HEAD, side by side */
  const hx = cx + L * 0.86;
  for (const s of [-1, 1] as const) {
    const ex2 = hx - 4 + s * 7, ey2 = cy - h * 1.5;
    c.fillStyle = lit(c, p, ex2, ey2, h * 0.34);
    c.beginPath(); c.arc(ex2, ey2, h * 0.34, 0, TAU); c.fill();
    eye(c, ex2, ey2 - h * 0.06, h * 0.2);
  }
  c.strokeStyle = 'rgba(16,20,26,0.42)'; c.lineWidth = 2.4;   /* the wide frog-like mouth */
  c.beginPath(); c.moveTo(hx + L * 0.12, cy - h * 0.15); c.quadraticCurveTo(hx - L * 0.05, cy + h * 0.4, hx - L * 0.3, cy + h * 0.2); c.stroke();
}

/* ── PYROSOME: a hollow colonial TUBE of fused zooids, open at one end ── */
export function faunaPyrosome(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x9750);
  const cx = S * 0.5, top = S * 0.16, bot = S * 0.84, w = S * 0.115;
  /* the translucent tube wall */
  const wall = c.createLinearGradient(cx - w, 0, cx + w, 0);
  wall.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},0.62)`);
  wall.addColorStop(0.45, `rgba(${Math.min(255, p.cr + 70)},${Math.min(255, p.cg + 70)},${Math.min(255, p.cb + 70)},0.30)`);
  wall.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.62)`);
  c.fillStyle = wall;
  c.beginPath();
  c.moveTo(cx - w * 0.72, top);
  c.quadraticCurveTo(cx - w * 1.16, (top + bot) / 2, cx - w, bot);
  c.quadraticCurveTo(cx, bot + S * 0.045, cx + w, bot);
  c.quadraticCurveTo(cx + w * 1.16, (top + bot) / 2, cx + w * 0.72, top);
  c.quadraticCurveTo(cx, top - S * 0.03, cx - w * 0.72, top);
  c.closePath(); c.fill();
  /* THE HOLLOW — the open mouth of the tube, the defining feature */
  c.fillStyle = 'rgba(6,10,16,0.78)';
  c.beginPath(); c.ellipse(cx, top + S * 0.005, w * 0.70, S * 0.028, 0, 0, TAU); c.fill();
  c.strokeStyle = `rgba(${Math.min(255, p.cr + 90)},${Math.min(255, p.cg + 90)},255,0.55)`; c.lineWidth = 3;
  c.beginPath(); c.ellipse(cx, top + S * 0.005, w * 0.70, S * 0.028, 0, 0, TAU); c.stroke();
  /* the ZOOIDS — hundreds of tiny individuals studding the tube wall */
  for (let i = 0; i < 190; i++) {
    const u = r(), v = r();
    const y = top + (bot - top) * u;
    const halfW = w * (0.72 + 0.28 * Math.sin(u * Math.PI));
    const x = cx - halfW + v * halfW * 2;
    const edge = Math.abs(v - 0.5) * 2;
    c.fillStyle = `rgba(${Math.min(255, p.cr + 60)},${Math.min(255, p.cg + 70)},${Math.min(255, p.cb + 80)},${0.22 + edge * 0.42})`;
    c.beginPath(); c.ellipse(x, y, 3.4, 2.2, 0.4, 0, TAU); c.fill();
  }
  /* the bioluminescence pyrosomes are named for */
  const gl = c.createRadialGradient(cx, (top + bot) / 2, 4, cx, (top + bot) / 2, w * 2.4);
  gl.addColorStop(0, 'rgba(150,220,255,0.16)'); gl.addColorStop(1, 'rgba(150,220,255,0)');
  c.fillStyle = gl; c.fillRect(cx - w * 2.6, top - 30, w * 5.2, bot - top + 60);
}

/* ── SALP: a translucent glass BARREL, or a chain of them ── */
export function faunaSalp(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x5A19);
  const n = 4;
  /* a chain of barrels running diagonally, each a hooped transparent drum */
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const cx = S * (0.26 + t * 0.48) + Math.sin(t * 3) * S * 0.03;
    const cy = S * (0.72 - t * 0.44);
    const bw = S * 0.095 * (1 - t * 0.12), bh = S * 0.070 * (1 - t * 0.12);
    c.save(); c.translate(cx, cy); c.rotate(-0.5 + t * 0.4);
    /* THE BODY FIRST — a salp is a solid drum of clear jelly. Drawn as line
       work alone it read as a coiled spring, so the volume is filled and the
       hoops are laid ON it as surface marks (THE SURFACE LAWS). */
    const gg = c.createLinearGradient(0, -bh, 0, bh);
    gg.addColorStop(0, `rgba(${Math.min(255, p.cr + 80)},${Math.min(255, p.cg + 86)},255,0.42)`);
    gg.addColorStop(0.42, `rgba(${Math.min(255, p.cr + 30)},${Math.min(255, p.cg + 36)},${Math.min(255, p.cb + 60)},0.30)`);
    gg.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.20)`);
    c.fillStyle = gg;
    c.beginPath(); c.ellipse(0, 0, bw, bh, 0, 0, TAU); c.fill();
    /* the open ends — a salp is a tube that pumps water through itself */
    for (const e of [-1, 1] as const) {
      c.fillStyle = 'rgba(10,18,28,0.34)';
      c.beginPath(); c.ellipse(e * bw * 0.84, 0, bw * 0.15, bh * 0.60, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(226,242,255,0.42)'; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(e * bw * 0.84, 0, bw * 0.15, bh * 0.60, 0, 0, TAU); c.stroke();
    }
    /* THE MUSCLE BANDS — three hoops, drawn as ARCS that wrap the near face
       and foreshorten toward the rim, so they sit on the drum */
    for (let k = -1; k <= 1; k++) {
      const u = k * 0.34;
      const fore = Math.sqrt(Math.max(0.06, 1 - u * u));
      c.strokeStyle = `rgba(232,244,255,${0.22 + fore * 0.24})`;
      c.lineWidth = 2.6 * fore;
      c.beginPath(); c.ellipse(u * bw, 0, bw * 0.12 * (1 - Math.abs(u) * 0.5), bh * 0.90, 0, -1.5, 1.5);
      c.stroke();
    }
    /* the specular rim along the top of the glass */
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, bw * 0.97, bh * 0.95, 0, -2.5, -0.5); c.stroke();
    /* the gut — the one opaque speck inside the glass */
    c.fillStyle = `rgba(${p.cr * 0.7 | 0},${p.cg * 0.8 | 0},${p.cb * 0.6 | 0},0.75)`;
    c.beginPath(); c.ellipse(bw * 0.22, bh * 0.3, bw * 0.16, bh * 0.24, 0.3, 0, TAU); c.fill();
    c.restore();
  }
  void r;
}

/* ── TRIPOD FISH: standing on three enormously elongated fin rays ── */
export function faunaTripodFish(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x7213);
  const cx = S * 0.5, cy = S * 0.40, L = S * 0.17, h = S * 0.048;
  const floorY = S * 0.86;
  shadow(c, cx, floorY + 4, S * 0.22);
  /* THE TRIPOD — two pelvic rays and one caudal ray, stilting it off the
     seabed. These are the animal; the body is almost incidental. */
  c.lineCap = 'round';
  const feet: Array<[number, number]> = [[cx - L * 0.62, floorY], [cx + L * 0.30, floorY], [cx - L * 1.42, floorY]];
  const hips: Array<[number, number]> = [[cx - L * 0.15, cy + h * 0.7], [cx + L * 0.18, cy + h * 0.7], [cx - L * 0.92, cy + h * 0.2]];
  for (let i = 0; i < 3; i++) {
    const [fx, fy] = feet[i]!, [hx2, hy2] = hips[i]!;
    const bow = (i === 2 ? -14 : 8);
    /* a fin ray is a TAPERED filament, not a strut: walk it in segments and
       thin it toward the seabed, or it reads as three white sticks */
    const SEG = 14;
    for (let k = 0; k < SEG; k++) {
      const t0 = k / SEG, t1 = (k + 1) / SEG;
      const q = (t: number): [number, number] => {
        const m = 1 - t;
        return [m * m * hx2 + 2 * m * t * ((hx2 + fx) / 2 + bow) + t * t * fx,
          m * m * hy2 + 2 * m * t * ((hy2 + fy) / 2) + t * t * fy];
      };
      const [ax, ay] = q(t0), [bx2, by2] = q(t1);
      c.lineWidth = 3.2 * (1 - t0 * 0.62);
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},${0.82 - t0 * 0.24})`;
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx2, by2); c.stroke();
    }
    /* the ray's fine tip splaying where it meets the ooze */
    c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.34)`; c.lineWidth = 1.1;
    for (const d of [-1, 1] as const) { c.beginPath(); c.moveTo(fx, fy - 6); c.lineTo(fx + d * 9, fy + 1); c.stroke(); }
  }
  /* the slender body, held clear of the floor */
  c.fillStyle = lit(c, p, cx, cy, L * 0.7);
  c.beginPath();
  c.moveTo(cx - L, cy);
  c.quadraticCurveTo(cx - L * 0.2, cy - h * 1.5, cx + L * 0.9, cy - h * 0.5);
  c.quadraticCurveTo(cx + L * 1.05, cy, cx + L * 0.9, cy + h * 0.5);
  c.quadraticCurveTo(cx - L * 0.2, cy + h * 1.4, cx - L, cy);
  c.closePath(); c.fill();
  /* the long pectoral feelers it fishes the current with */
  c.strokeStyle = p.base; c.lineWidth = 2.2;
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + L * 0.55, cy + s * h * 0.2);
    c.quadraticCurveTo(cx + L * 1.4, cy + s * h * 1.6, cx + L * 1.9, cy + s * h * 0.6); c.stroke();
  }
  /* the tail rises into the third stilt */
  c.fillStyle = p.dark;
  c.beginPath(); c.moveTo(cx - L * 0.95, cy);
  c.lineTo(cx - L * 1.5, cy - h * 0.9); c.lineTo(cx - L * 1.35, cy + h * 0.7); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(210,226,245,0.30)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(cx - L * 0.9, cy - h * 0.1); c.lineTo(cx + L * 0.8, cy - h * 0.2); c.stroke();
  eye(c, cx + L * 0.72, cy - h * 0.30, 5);
  for (let i = 0; i < 10; i++) { c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.arc(cx - L + r() * L * 1.9, cy - h + r() * h * 2, 2, 0, TAU); c.fill(); }
}
