/* faunaoverrides.ts — THE MORPHOLOGY PASS, wave 3 (fauna specialists).
   Nick's audit Blocker 4 (life-stage errors) + Blocker 6 (specialist body
   plans), and the agents' #1 systemic: NO bird in 631 fauna showed a wing.

   Scope discipline: this wave corrects species whose DEFINING ANATOMY is
   categorically wrong or missing — a larva drawn as a winged adult, a
   flatfish drawn side-on, a bird with a plank where a wing belongs. The
   quadruped mega-template polish (Rhino vs Hippo proportions, cheetah
   spots) is wave 4; those read as the right ANIMAL FAMILY today, just
   under-differentiated. Everything unlisted still falls through to the
   byte-verbatim engine.

   Style law preserved: rim-lit painterly figurine, grounding shadow,
   palette from the genome. Bodies, not recolors. */
import { mulberry32, TAU } from '@cf/domain-rand';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type FaunaPainter = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

function ground(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.035, 0, 0, TAU); c.fill();
}
function bodyGrad(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r * 1.2);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.65, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function rim(c: Ctx, path: () => void, w = 2, hue = 'rgba(214,226,244,0.45)'): void {
  c.save(); c.strokeStyle = hue; c.lineWidth = w; c.beginPath(); path(); c.stroke(); c.restore();
}
function eye(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#0d1016'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.34, 0, TAU); c.fill();
}

/* ---------------- Blocker 4: insect life stages + body plans ---------------- */
/** a LARVA: legless soft segmented grub — never a winged adult */
export function faunaLarva(c: Ctx, g: G, p: Pal): void {
  const r = mulberry32(((g.seed as number) ^ 0x1A2B) >>> 0);
  ground(c, S * 0.5, S * 0.78, S * 0.22);
  const segs = 9, x0 = S * 0.24, x1 = S * 0.76, y = S * 0.56;
  for (let i = segs - 1; i >= 0; i--) {
    const t = i / (segs - 1), x = x0 + (x1 - x0) * t;
    const rad = S * (0.085 - Math.abs(t - 0.42) * 0.055) + r() * 2;
    c.fillStyle = bodyGrad(c, p, x, y - Math.sin(t * 3) * 6, rad);
    c.beginPath(); c.arc(x, y - Math.sin(t * 3) * 6, rad, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(x, y - Math.sin(t * 3) * 6, rad, -1.3, 1.3); c.stroke();
  }
  rim(c, () => c.arc(x0 + 6, y, S * 0.05, -2.6, 0.4), 2);
  /* the dark head capsule at the fat end */
  c.fillStyle = '#3a2a1e';
  c.beginPath(); c.arc(x1 - 4, y - Math.sin(3) * 6, S * 0.045, 0, TAU); c.fill();
  eye(c, x1 - 2, y - 8, 3);
}
/** an ADULT WINGED INSECT: two wing pairs, long abdomen, compound eyes.
    open = wings held out (dragonfly); folded = along the body (damselfly) */
export function faunaWingedInsect(c: Ctx, g: G, p: Pal, opts: { open: boolean; slim: boolean }): void {
  const r = mulberry32(((g.seed as number) ^ 0x2C4E) >>> 0);
  const cx = S * 0.5, cy = S * 0.5;
  ground(c, cx, S * 0.82, S * 0.18);
  const abLen = S * (opts.slim ? 0.30 : 0.26), abW = S * (opts.slim ? 0.022 : 0.034);
  /* WINGS FIRST, behind the body — the feature the whole catalog lacked */
  const wing = (ax: number, ay: number, len: number, ang: number, s: number): void => {
    c.save(); c.translate(ax, ay); c.rotate(ang * s); c.scale(1, s);
    const wg = c.createLinearGradient(0, 0, len, 0);
    wg.addColorStop(0, 'rgba(226,240,255,0.42)'); wg.addColorStop(0.6, 'rgba(198,222,248,0.22)'); wg.addColorStop(1, 'rgba(180,208,240,0.06)');
    c.fillStyle = wg;
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(len * 0.45, -len * 0.20, len, -len * 0.045);
    c.quadraticCurveTo(len * 0.5, len * 0.075, 0, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(226,240,255,0.5)'; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = 'rgba(226,240,255,0.22)'; c.lineWidth = 0.8;   /* venation */
    for (let v = 1; v <= 4; v++) { c.beginPath(); c.moveTo(len * 0.05, 0); c.quadraticCurveTo(len * 0.5, -len * 0.10 * (v / 4), len * 0.95, -len * 0.04 * (v / 4)); c.stroke(); }
    c.restore();
  };
  const wl = S * (opts.slim ? 0.30 : 0.34);
  for (const s of [-1, 1] as const) {
    if (opts.open) { wing(cx - abLen * 0.18, cy - 4, wl, -0.20, s); wing(cx - abLen * 0.05, cy + 2, wl * 0.9, 0.12, s); }
    else { wing(cx - abLen * 0.10, cy - 2, wl * 0.95, -0.06 + s * 0.05, s > 0 ? 1 : 1); }
  }
  /* thorax + long segmented abdomen */
  c.fillStyle = bodyGrad(c, p, cx - abLen * 0.22, cy, S * 0.05);
  c.beginPath(); c.ellipse(cx - abLen * 0.22, cy, S * 0.055, S * 0.045, 0, 0, TAU); c.fill();
  for (let i = 0; i < 8; i++) {
    const t = i / 7, x = cx - abLen * 0.14 + abLen * t;
    c.fillStyle = i % 2 ? p.base : p.dark;
    c.beginPath(); c.ellipse(x, cy + t * 4, abW * (1 - t * 0.35), abW * (0.9 - t * 0.25), 0, 0, TAU); c.fill();
  }
  rim(c, () => c.ellipse(cx - abLen * 0.22, cy, S * 0.055, S * 0.045, 0, -2.6, 0.3), 1.8);
  /* six thoracic legs */
  c.strokeStyle = p.dark; c.lineWidth = 2.6; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) for (const s of [-1, 1] as const) {
    const lx = cx - abLen * 0.30 + i * 14;
    c.beginPath(); c.moveTo(lx, cy + 6); c.quadraticCurveTo(lx - 10, cy + 22 * s * 0.6 + 14, lx - 20, cy + 30); c.stroke();
  }
  /* the big compound-eyed head */
  const hx = cx - abLen * 0.44;
  c.fillStyle = bodyGrad(c, p, hx, cy - 2, S * 0.045);
  c.beginPath(); c.arc(hx, cy - 2, S * 0.042, 0, TAU); c.fill();
  for (const s of [-1, 1] as const) {
    c.fillStyle = 'rgba(30,40,54,0.92)';
    c.beginPath(); c.ellipse(hx - 6, cy - 8 + s * 9, S * 0.026, S * 0.021, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.arc(hx - 10, cy - 11 + s * 9, 2.6, 0, TAU); c.fill();
  }
  void r;
}
/** a BEETLE: domed elytra shell, short legs (Ladybug/Firefly/Diving Beetle) */
export function faunaBeetle(c: Ctx, g: G, p: Pal, opts: { spots?: boolean; glow?: boolean; paddle?: boolean }): void {
  const r = mulberry32(((g.seed as number) ^ 0xBEE7) >>> 0);
  const cx = S * 0.5, cy = S * 0.52, rw = S * 0.17, rh = S * 0.20;
  ground(c, cx, cy + rh + 12, S * 0.16);
  c.strokeStyle = '#20242c'; c.lineWidth = 5; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) for (const s of [-1, 1] as const) {
    const ly = cy - rh * 0.4 + i * (rh * 0.5);
    c.beginPath(); c.moveTo(cx + s * rw * 0.7, ly);
    if (opts.paddle) { c.quadraticCurveTo(cx + s * (rw + 26), ly + 14, cx + s * (rw + 34), ly + 26); c.lineWidth = 7; }
    else c.quadraticCurveTo(cx + s * (rw + 16), ly + 10, cx + s * (rw + 22), ly + 22);
    c.stroke();
  }
  const shell = c.createRadialGradient(cx - rw * 0.35, cy - rh * 0.45, 3, cx, cy, rh * 1.25);
  shell.addColorStop(0, p.lit); shell.addColorStop(0.6, p.base); shell.addColorStop(1, p.dark);
  c.fillStyle = shell;
  c.beginPath(); c.ellipse(cx, cy, rw, rh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, rw, rh, 0, -2.7, 0.35), 2.2);
  c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 2.2;   /* the elytra seam */
  c.beginPath(); c.moveTo(cx, cy - rh * 0.75); c.lineTo(cx, cy + rh * 0.9); c.stroke();
  if (opts.spots) {
    c.fillStyle = 'rgba(16,16,20,0.9)';
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = Math.pow(r(), 0.5) * rw * 0.66; c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 1.1, 7 + r() * 6, 0, TAU); c.fill(); }
  }
  /* pronotum + head */
  c.fillStyle = p.dark;
  c.beginPath(); c.ellipse(cx, cy - rh * 0.92, rw * 0.6, rh * 0.22, 0, 0, TAU); c.fill();
  c.beginPath(); c.arc(cx, cy - rh * 1.18, rw * 0.32, 0, TAU); c.fill();
  eye(c, cx - 7, cy - rh * 1.22, 3.4); eye(c, cx + 7, cy - rh * 1.22, 3.4);
  if (opts.glow) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const lg = c.createRadialGradient(cx, cy + rh * 0.75, 2, cx, cy + rh * 0.75, S * 0.16);
    lg.addColorStop(0, 'rgba(214,255,140,0.85)'); lg.addColorStop(0.4, 'rgba(180,240,90,0.32)'); lg.addColorStop(1, 'rgba(160,220,60,0)');
    c.fillStyle = lg; c.beginPath(); c.arc(cx, cy + rh * 0.75, S * 0.16, 0, TAU); c.fill(); c.restore();
  }
}
/** WINGLESS tiny arthropod (Springtail): compact body, no wings, furcula */
export function faunaSpringtail(c: Ctx, g: G, p: Pal): void {
  const cx = S * 0.5, cy = S * 0.54, bw = S * 0.15, bh = S * 0.095;
  ground(c, cx, cy + bh + 14, S * 0.14);
  c.fillStyle = bodyGrad(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, bw, bh, 0, -2.7, 0.3), 2);
  c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 1.6;
  for (let i = 1; i < 5; i++) { const x = cx - bw + (i / 5) * bw * 2; c.beginPath(); c.ellipse(x, cy, bh * 0.4, bh * 0.95, 0, -1.2, 1.2); c.stroke(); }
  c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) for (const s of [-1, 1] as const) {
    const lx = cx - bw * 0.5 + i * (bw * 0.5);
    c.beginPath(); c.moveTo(lx, cy + bh * 0.6); c.lineTo(lx + s * 10, cy + bh + 16); c.stroke();
  }
  /* THE FURCULA — the spring, tucked under the abdomen */
  c.strokeStyle = p.lit; c.lineWidth = 4;
  c.beginPath(); c.moveTo(cx + bw * 0.75, cy + bh * 0.35);
  c.quadraticCurveTo(cx + bw * 1.5, cy + bh * 1.1, cx + bw * 0.55, cy + bh * 1.5); c.stroke();
  /* antennae + eye patch */
  c.strokeStyle = p.dark; c.lineWidth = 2.4;
  for (const s of [-1, 1] as const) { c.beginPath(); c.moveTo(cx - bw * 0.85, cy - 4); c.quadraticCurveTo(cx - bw * 1.5, cy - 16 + s * 8, cx - bw * 1.9, cy - 20 + s * 12); c.stroke(); }
  eye(c, cx - bw * 0.72, cy - bh * 0.3, 4);
}
/** ASYMMETRIC CLAW crab (Fiddler): one huge claw, one small */
export function faunaFiddler(c: Ctx, g: G, p: Pal): void {
  const cx = S * 0.5, cy = S * 0.56, bw = S * 0.15, bh = S * 0.105;
  ground(c, cx, cy + bh + 16, S * 0.2);
  c.strokeStyle = p.dark; c.lineWidth = 4; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) for (const s of [-1, 1] as const) {
    const lx = cx + s * bw * 0.6, ly = cy - 4 + i * 12;
    c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + s * 34, ly + 12, lx + s * 44, ly + 30); c.stroke();
  }
  c.fillStyle = bodyGrad(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, bw, bh, 0, -2.8, 0.3), 2.2);
  eye(c, cx - 12, cy - bh * 0.85, 4); eye(c, cx + 12, cy - bh * 0.85, 4);
  c.strokeStyle = p.dark; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx - 12, cy - bh * 0.5); c.lineTo(cx - 12, cy - bh * 1.0); c.stroke();
  c.beginPath(); c.moveTo(cx + 12, cy - bh * 0.5); c.lineTo(cx + 12, cy - bh * 1.0); c.stroke();
  const claw = (x: number, y: number, sc: number, s: number): void => {
    c.fillStyle = bodyGrad(c, p, x, y, 26 * sc);
    c.beginPath(); c.ellipse(x, y, 26 * sc, 18 * sc, s * 0.3, 0, TAU); c.fill();
    c.fillStyle = p.lit;
    c.beginPath(); c.moveTo(x + s * 18 * sc, y - 12 * sc); c.quadraticCurveTo(x + s * 46 * sc, y - 16 * sc, x + s * 52 * sc, y - 2 * sc);
    c.quadraticCurveTo(x + s * 40 * sc, y + 2 * sc, x + s * 18 * sc, y + 2 * sc); c.closePath(); c.fill();
    c.fillStyle = p.base;
    c.beginPath(); c.moveTo(x + s * 18 * sc, y + 4 * sc); c.quadraticCurveTo(x + s * 44 * sc, y + 10 * sc, x + s * 50 * sc, y + 16 * sc);
    c.quadraticCurveTo(x + s * 34 * sc, y + 16 * sc, x + s * 18 * sc, y + 12 * sc); c.closePath(); c.fill();
    rim(c, () => c.ellipse(x, y, 26 * sc, 18 * sc, s * 0.3, -2.6, 0.4), 1.8);
  };
  claw(cx - bw * 1.25, cy + 6, 1.35, -1);   /* THE oversized one */
  claw(cx + bw * 1.05, cy + 12, 0.55, 1);
}
/** HORSESHOE CRAB: broad carapace + rigid tail spine */
export function faunaHorseshoe(c: Ctx, g: G, p: Pal): void {
  const cx = S * 0.5, cy = S * 0.46;
  ground(c, cx, S * 0.80, S * 0.24);
  c.strokeStyle = p.dark; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, cy + S * 0.13); c.lineTo(cx, cy + S * 0.36); c.stroke();
  c.strokeStyle = p.lit; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(cx - 2, cy + S * 0.13); c.lineTo(cx - 2, cy + S * 0.34); c.stroke();
  const cw = S * 0.24, ch = S * 0.17;
  c.fillStyle = bodyGrad(c, p, cx, cy, cw);
  c.beginPath(); c.moveTo(cx - cw, cy + ch * 0.5);
  c.quadraticCurveTo(cx - cw * 1.02, cy - ch, cx, cy - ch * 1.05);
  c.quadraticCurveTo(cx + cw * 1.02, cy - ch, cx + cw, cy + ch * 0.5);
  c.quadraticCurveTo(cx, cy + ch * 0.95, cx - cw, cy + ch * 0.5);
  c.closePath(); c.fill();
  rim(c, () => { c.moveTo(cx - cw, cy + ch * 0.5); c.quadraticCurveTo(cx - cw * 1.02, cy - ch, cx, cy - ch * 1.05); c.quadraticCurveTo(cx + cw * 1.02, cy - ch, cx + cw, cy + ch * 0.5); }, 2.4);
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.beginPath(); c.ellipse(cx, cy + ch * 0.42, cw * 0.62, ch * 0.36, 0, 0, TAU); c.fill();   /* the hinge */
  eye(c, cx - cw * 0.42, cy - ch * 0.35, 4.5); eye(c, cx + cw * 0.42, cy - ch * 0.35, 4.5);
}

/* ---------------- Blocker 6: specialist fish + marine bodies ---------------- */
/** FLATFISH: laterally flattened, lying flat, BOTH eyes on the upper side */
export function faunaFlatfish(c: Ctx, g: G, p: Pal): void {
  const r = mulberry32(((g.seed as number) ^ 0xF1A7) >>> 0);
  const cx = S * 0.5, cy = S * 0.54, w = S * 0.28, h = S * 0.17;
  ground(c, cx, cy + h + 10, S * 0.26);
  c.fillStyle = bodyGrad(c, p, cx, cy, w);
  c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.fill();
  /* the continuous fin fringe all the way round — the flatfish read */
  c.strokeStyle = 'rgba(226,236,252,0.35)'; c.lineWidth = 2;
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * TAU, ex = cx + Math.cos(a) * w, ey = cy + Math.sin(a) * h;
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(cx + Math.cos(a) * (w + 14), cy + Math.sin(a) * (h + 12)); c.stroke();
  }
  rim(c, () => c.ellipse(cx, cy, w, h, 0, 0, TAU), 2);
  c.fillStyle = 'rgba(0,0,0,0.16)';
  for (let i = 0; i < 26; i++) { const a = r() * TAU, d = Math.pow(r(), 0.5); c.beginPath(); c.arc(cx + Math.cos(a) * w * d * 0.9, cy + Math.sin(a) * h * d * 0.9, 3 + r() * 5, 0, TAU); c.fill(); }
  /* BOTH eyes on the same (upper) side, close together — the signature */
  eye(c, cx - w * 0.46, cy - h * 0.34, 7); eye(c, cx - w * 0.20, cy - h * 0.44, 7);
  c.strokeStyle = p.dark; c.lineWidth = 2.4;
  c.beginPath(); c.arc(cx - w * 0.62, cy - h * 0.05, 12, -0.6, 0.9); c.stroke();   /* the twisted mouth */
}
/** DEEP-BODIED, tall-finned reef fish (Angelfish) */
export function faunaAngelfish(c: Ctx, g: G, p: Pal): void {
  const cx = S * 0.5, cy = S * 0.5, w = S * 0.15, h = S * 0.22;
  const fin = (up: boolean): void => {
    const s = up ? -1 : 1;
    c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.55)`;
    c.beginPath(); c.moveTo(cx - w * 0.7, cy + s * h * 0.5);
    c.quadraticCurveTo(cx - w * 0.2, cy + s * h * 2.0, cx + w * 0.35, cy + s * h * 1.5);
    c.quadraticCurveTo(cx + w * 0.2, cy + s * h * 0.7, cx + w * 0.6, cy + s * h * 0.35);
    c.closePath(); c.fill();
    c.strokeStyle = `rgba(${p.cr * 1.4 | 0},${p.cg * 1.4 | 0},${p.cb * 1.4 | 0},0.5)`; c.lineWidth = 1.4;
    for (let i = 1; i <= 5; i++) { c.beginPath(); c.moveTo(cx - w * 0.5 + i * 6, cy + s * h * 0.5); c.lineTo(cx - w * 0.2 + i * 9, cy + s * h * (1.2 + i * 0.12)); c.stroke(); }
  };
  fin(true); fin(false);
  c.fillStyle = bodyGrad(c, p, cx, cy, h);
  c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, w, h, 0, -2.8, 0.4), 2.2);
  c.fillStyle = 'rgba(20,24,34,0.32)';   /* the vertical bars */
  for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(cx - w * 0.5 + i * w * 0.55, cy, w * 0.12, h * 0.92, 0, 0, TAU); c.fill(); }
  /* trailing filaments + tail */
  c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.5)`; c.lineWidth = 2.6; c.lineCap = 'round';
  for (const s of [-1, 1] as const) { c.beginPath(); c.moveTo(cx - w * 0.1, cy + s * h * 0.9); c.quadraticCurveTo(cx - w * 0.4, cy + s * h * 1.9, cx - w * 0.1, cy + s * h * 2.3); c.stroke(); }
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.6)`;
  c.beginPath(); c.moveTo(cx + w * 0.85, cy); c.lineTo(cx + w * 1.7, cy - h * 0.5); c.lineTo(cx + w * 1.7, cy + h * 0.5); c.closePath(); c.fill();
  eye(c, cx - w * 0.55, cy - h * 0.18, 6);
}
/** LIONFISH: fan of venomous spines radiating from a striped body */
export function faunaLionfish(c: Ctx, g: G, p: Pal): void {
  const r = mulberry32(((g.seed as number) ^ 0x110F) >>> 0);
  const cx = S * 0.5, cy = S * 0.52, w = S * 0.17, h = S * 0.10;
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI * 0.95 + (i / 15) * Math.PI * 1.9, len = S * (0.17 + r() * 0.10);
    c.strokeStyle = i % 2 ? 'rgba(240,226,214,0.75)' : `rgba(${p.cr},${p.cg},${p.cb},0.8)`;
    c.lineWidth = 3.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.6 - 6, cx + Math.cos(a) * len, cy + Math.sin(a) * len); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * len * 0.35, cy + Math.sin(a) * len * 0.35); c.lineTo(cx + Math.cos(a) * len * 0.85, cy + Math.sin(a) * len * 0.85); c.stroke();
  }
  c.fillStyle = bodyGrad(c, p, cx, cy, w);
  c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, w, h, 0, -2.8, 0.4), 2);
  c.fillStyle = 'rgba(28,18,14,0.6)';   /* the bold bands */
  for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(cx - w * 0.7 + i * w * 0.36, cy, w * 0.07, h * 0.95, 0, 0, TAU); c.fill(); }
  eye(c, cx - w * 0.66, cy - h * 0.25, 5.5);
}
/** CEPHALOPOD: mantle + fin skirt + eight arms (+2 feeding tentacles) */
export function faunaCephalopod(c: Ctx, g: G, p: Pal, opts: { squid: boolean }): void {
  const r = mulberry32(((g.seed as number) ^ 0xCEFA) >>> 0);
  const cx = S * 0.5, my = opts.squid ? S * 0.34 : S * 0.36;
  const mw = S * (opts.squid ? 0.11 : 0.15), mh = S * (opts.squid ? 0.20 : 0.16);
  ground(c, cx, S * 0.84, S * 0.2);
  /* arms first (behind the head) */
  const arms = 8;
  for (let i = 0; i < arms; i++) {
    const t = i / (arms - 1), ax = cx + (t - 0.5) * mw * 1.7;
    const sway = (r() - 0.5) * 40, len = S * (0.24 + r() * 0.12);
    c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = 9 - Math.abs(t - 0.5) * 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax, my + mh * 0.7);
    c.bezierCurveTo(ax + sway * 0.5, my + mh + len * 0.4, ax + sway, my + mh + len * 0.7, ax + sway * 1.3, my + mh + len);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(ax, my + mh * 0.7); c.bezierCurveTo(ax + sway * 0.5, my + mh + len * 0.4, ax + sway, my + mh + len * 0.7, ax + sway * 1.3, my + mh + len); c.stroke();
  }
  if (opts.squid) {   /* the two long feeding tentacles */
    for (const s of [-1, 1] as const) {
      c.strokeStyle = p.lit; c.lineWidth = 5;
      c.beginPath(); c.moveTo(cx + s * mw * 0.4, my + mh * 0.7);
      c.bezierCurveTo(cx + s * mw * 2.2, my + mh + 90, cx + s * mw * 0.6, my + mh + 150, cx + s * mw * 1.8, my + mh + 190); c.stroke();
      c.fillStyle = p.base;
      c.beginPath(); c.ellipse(cx + s * mw * 1.8, my + mh + 192, 11, 7, s * 0.4, 0, TAU); c.fill();
    }
  }
  /* mantle */
  c.fillStyle = bodyGrad(c, p, cx, my, mw * 1.4);
  c.beginPath(); c.ellipse(cx, my, mw, mh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, my, mw, mh, 0, -2.8, 0.35), 2.2);
  /* the lateral fin skirt */
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.45)`;
  for (const s of [-1, 1] as const) {
    c.beginPath();
    if (opts.squid) { c.moveTo(cx + s * mw * 0.7, my - mh * 0.72); c.quadraticCurveTo(cx + s * mw * 2.3, my - mh * 0.5, cx + s * mw * 0.75, my - mh * 0.05); }
    else { c.moveTo(cx + s * mw * 0.85, my - mh * 0.55); c.quadraticCurveTo(cx + s * mw * 1.7, my, cx + s * mw * 0.85, my + mh * 0.62); }
    c.closePath(); c.fill();
  }
  eye(c, cx - mw * 0.5, my + mh * 0.62, 8); eye(c, cx + mw * 0.5, my + mh * 0.62, 8);
}
/** CETACEAN: long body, horizontal FLUKE, blowhole, species dorsal */
export function faunaCetacean(c: Ctx, g: G, p: Pal, opts: { dorsal: 'tall' | 'small' | 'none'; blunt: boolean }): void {
  const cx = S * 0.5, cy = S * 0.5, L = S * 0.34, H = S * 0.10;
  const head = cx - L, tail = cx + L;
  c.fillStyle = bodyGrad(c, p, cx - L * 0.3, cy, L * 0.7);
  c.beginPath();
  c.moveTo(head, cy + (opts.blunt ? H * 0.3 : 0));
  c.quadraticCurveTo(cx - L * 0.5, cy - H * (opts.blunt ? 1.5 : 1.15), cx + L * 0.2, cy - H * 0.75);
  c.quadraticCurveTo(tail - 20, cy - H * 0.3, tail, cy);
  c.quadraticCurveTo(tail - 20, cy + H * 0.35, cx + L * 0.2, cy + H * 0.85);
  c.quadraticCurveTo(cx - L * 0.5, cy + H * 1.05, head, cy + (opts.blunt ? H * 0.3 : 0));
  c.closePath(); c.fill();
  rim(c, () => { c.moveTo(head, cy); c.quadraticCurveTo(cx - L * 0.5, cy - H * (opts.blunt ? 1.5 : 1.15), cx + L * 0.2, cy - H * 0.75); c.quadraticCurveTo(tail - 20, cy - H * 0.3, tail, cy); }, 2.4);
  /* THE HORIZONTAL FLUKE — never a vertical fish tail */
  c.fillStyle = p.dark;
  c.beginPath(); c.moveTo(tail - 6, cy);
  c.quadraticCurveTo(tail + 30, cy - 26, tail + 62, cy - 16);
  c.quadraticCurveTo(tail + 34, cy, tail + 62, cy + 16);
  c.quadraticCurveTo(tail + 30, cy + 26, tail - 6, cy);
  c.closePath(); c.fill();
  if (opts.dorsal !== 'none') {
    const dh = opts.dorsal === 'tall' ? H * 1.5 : H * 0.55;
    c.fillStyle = p.dark;
    c.beginPath(); c.moveTo(cx + L * 0.05, cy - H * 0.8);
    c.quadraticCurveTo(cx + L * 0.18, cy - H * 0.8 - dh, cx + L * 0.34, cy - H * 0.72);
    c.closePath(); c.fill();
  }
  c.fillStyle = p.dark;   /* pectoral flipper */
  c.beginPath(); c.ellipse(cx - L * 0.3, cy + H * 0.85, L * 0.20, H * 0.28, 0.5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';   /* blowhole */
  c.beginPath(); c.ellipse(cx - L * 0.62, cy - H * 0.92, 5, 3, 0, 0, TAU); c.fill();
  eye(c, head + L * 0.22, cy + H * 0.1, 5);
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 2;   /* the jawline */
  c.beginPath(); c.moveTo(head + 4, cy + H * 0.35); c.quadraticCurveTo(cx - L * 0.55, cy + H * 0.6, cx - L * 0.28, cy + H * 0.62); c.stroke();
}

/* ---------------- the wing that the whole catalog lacked ---------------- */
/** BIRD with a real folded wing, species bill and leg length */
export function faunaBird(c: Ctx, g: G, p: Pal, opts: { legs: number; bill: 'hook' | 'long' | 'spoon' | 'stout' | 'huge'; crest?: boolean; flightless?: boolean }): void {
  const r = mulberry32(((g.seed as number) ^ 0xB12D) >>> 0);
  /* the body rides legLen ABOVE a fixed ground line, so a wader towers and a
     raptor squats — leg length is the species read (Flamingo vs Eagle) */
  const bx = S * 0.5, legLen = S * opts.legs, groundY = S * 0.80;
  const bw = S * 0.15, bh = S * 0.12;
  const by = groundY - legLen - bh;
  ground(c, bx, groundY + 4, S * 0.16);
  c.strokeStyle = '#c9a24f'; c.lineWidth = legLen > S * 0.10 ? 5 : 7; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(bx + s * 8, by + bh * 0.75); c.lineTo(bx + s * 10, groundY); c.stroke();
    c.beginPath(); c.moveTo(bx + s * 10, groundY); c.lineTo(bx + s * 18, groundY + 4); c.stroke();
  }
  c.fillStyle = bodyGrad(c, p, bx, by, bw);
  c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.fill();
  rim(c, () => c.ellipse(bx, by, bw, bh, -0.15, -2.8, 0.3), 2.2);
  /* ★ THE FOLDED WING — layered coverts + primaries, the missing feature */
  c.save(); c.translate(bx + bw * 0.12, by + bh * 0.05); c.rotate(0.22);
  for (let layer = 0; layer < 3; layer++) {
    const lw = bw * (0.95 - layer * 0.16), lh = bh * (0.62 - layer * 0.10);
    c.fillStyle = layer === 0 ? p.dark : (layer === 1 ? p.base : p.lit);
    c.beginPath(); c.ellipse(0, layer * 3, lw, lh, 0, 0, TAU); c.fill();
  }
  c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {   /* primaries fanning to the tail */
    c.beginPath(); c.moveTo(-bw * 0.1 + i * 4, 0);
    c.quadraticCurveTo(bw * 0.6, bh * 0.2 + i * 2, bw * 1.15 - i * 3, bh * 0.35 + i * 4); c.stroke();
  }
  c.restore();
  /* tail */
  c.fillStyle = p.dark;
  c.beginPath(); c.moveTo(bx + bw * 0.7, by + bh * 0.1);
  c.lineTo(bx + bw * 1.75, by + bh * (opts.flightless ? 0.4 : 0.55));
  c.lineTo(bx + bw * 0.75, by + bh * 0.62); c.closePath(); c.fill();
  /* neck + head */
  const hx = bx - bw * 0.72, hy = by - bh * 0.95;
  c.strokeStyle = p.base; c.lineWidth = 15;
  c.beginPath(); c.moveTo(bx - bw * 0.35, by - bh * 0.35); c.quadraticCurveTo(hx - 4, by - bh * 0.6, hx, hy); c.stroke();
  c.fillStyle = bodyGrad(c, p, hx, hy, 22);
  c.beginPath(); c.arc(hx, hy, 20, 0, TAU); c.fill();
  rim(c, () => c.arc(hx, hy, 20, -2.7, 0.3), 1.8);
  eye(c, hx - 5, hy - 4, 4.5);
  /* the species bill */
  c.fillStyle = '#e0b13c';
  if (opts.bill === 'hook') { c.beginPath(); c.moveTo(hx - 16, hy - 6); c.quadraticCurveTo(hx - 40, hy - 4, hx - 34, hy + 12); c.quadraticCurveTo(hx - 26, hy + 4, hx - 14, hy + 6); c.closePath(); c.fill(); }
  else if (opts.bill === 'long') { c.beginPath(); c.moveTo(hx - 14, hy - 4); c.lineTo(hx - 78, hy + 2); c.lineTo(hx - 14, hy + 7); c.closePath(); c.fill(); }
  else if (opts.bill === 'spoon') { c.beginPath(); c.moveTo(hx - 14, hy - 3); c.lineTo(hx - 56, hy + 1); c.lineTo(hx - 14, hy + 6); c.closePath(); c.fill(); c.beginPath(); c.ellipse(hx - 60, hy + 2, 13, 8, 0, 0, TAU); c.fill(); }
  else if (opts.bill === 'huge') { c.beginPath(); c.moveTo(hx - 14, hy - 12); c.quadraticCurveTo(hx - 66, hy - 10, hx - 72, hy + 6); c.quadraticCurveTo(hx - 40, hy + 16, hx - 12, hy + 10); c.closePath(); c.fill(); }
  else { c.beginPath(); c.moveTo(hx - 14, hy - 5); c.lineTo(hx - 36, hy + 1); c.lineTo(hx - 14, hy + 8); c.closePath(); c.fill(); }
  if (opts.crest) {
    c.strokeStyle = p.lit; c.lineWidth = 3.4; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.22; c.beginPath(); c.moveTo(hx + 2, hy - 16); c.quadraticCurveTo(hx + 10 + Math.cos(a) * 18, hy - 34, hx + 6 + Math.cos(a) * 30, hy - 40 + i * 3); c.stroke(); }
  }
  void r;
}

/** the wave-3 roster: species whose defining anatomy was categorically wrong */
export const FAUNA_NAME: Record<string, FaunaPainter> = {
  /* Blocker 4 — life stage + arthropod body plans */
  'Fly Larvae': (c, g, p) => faunaLarva(c, g, p),
  'Maggot': (c, g, p) => faunaLarva(c, g, p),
  'Caterpillar': (c, g, p) => faunaLarva(c, g, p),
  'Grub': (c, g, p) => faunaLarva(c, g, p),
  'Dragonfly': (c, g, p) => faunaWingedInsect(c, g, p, { open: true, slim: false }),
  'Damselfly': (c, g, p) => faunaWingedInsect(c, g, p, { open: false, slim: true }),
  'Mayfly': (c, g, p) => faunaWingedInsect(c, g, p, { open: false, slim: true }),
  'Lacewing': (c, g, p) => faunaWingedInsect(c, g, p, { open: true, slim: true }),
  'Scorpionfly': (c, g, p) => faunaWingedInsect(c, g, p, { open: false, slim: false }),
  'Springtail': (c, g, p) => faunaSpringtail(c, g, p),
  'Ladybug': (c, g, p) => faunaBeetle(c, g, p, { spots: true }),
  'Firefly': (c, g, p) => faunaBeetle(c, g, p, { glow: true }),
  'Diving Beetle': (c, g, p) => faunaBeetle(c, g, p, { paddle: true }),
  'Dung Beetle': (c, g, p) => faunaBeetle(c, g, p, {}),
  'Stag Beetle': (c, g, p) => faunaBeetle(c, g, p, {}),
  'Fiddler Crab': (c, g, p) => faunaFiddler(c, g, p),
  'Horseshoe Crab': (c, g, p) => faunaHorseshoe(c, g, p),
  /* Blocker 6 — specialist fish + marine bodies */
  'Flounder': (c, g, p) => faunaFlatfish(c, g, p),
  'Halibut': (c, g, p) => faunaFlatfish(c, g, p),
  'Sole': (c, g, p) => faunaFlatfish(c, g, p),
  'Angelfish': (c, g, p) => faunaAngelfish(c, g, p),
  'Lionfish': (c, g, p) => faunaLionfish(c, g, p),
  'Octopus': (c, g, p) => faunaCephalopod(c, g, p, { squid: false }),
  'Giant Octopus': (c, g, p) => faunaCephalopod(c, g, p, { squid: false }),
  'Cuttlefish': (c, g, p) => faunaCephalopod(c, g, p, { squid: false }),
  'Squid': (c, g, p) => faunaCephalopod(c, g, p, { squid: true }),
  'Giant Squid': (c, g, p) => faunaCephalopod(c, g, p, { squid: true }),
  'Blue Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false }),
  'Humpback Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false }),
  'Sperm Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true }),
  'Gray Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: false }),
  'Right Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true }),
  'Beluga': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true }),
  'Orca': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'tall', blunt: false }),
  'Dolphin': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false }),
  'River Dolphin': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false }),
  'Pilot Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: true }),
  'Narwhal': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true }),
  /* the wing, at last — birds by bill + leg length */
  'Eagle': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'hook' }),
  'Harpy Eagle': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'hook', crest: true }),
  'Hawk': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'hook' }),
  'Falcon': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'hook' }),
  'Vulture': (c, g, p) => faunaBird(c, g, p, { legs: 0.03, bill: 'hook' }),
  'Albatross': (c, g, p) => faunaBird(c, g, p, { legs: 0.01, bill: 'long' }),
  'Flamingo': (c, g, p) => faunaBird(c, g, p, { legs: 0.14, bill: 'stout' }),
  'Heron': (c, g, p) => faunaBird(c, g, p, { legs: 0.13, bill: 'long' }),
  'Crane': (c, g, p) => faunaBird(c, g, p, { legs: 0.13, bill: 'long', crest: true }),
  'Stork': (c, g, p) => faunaBird(c, g, p, { legs: 0.12, bill: 'long' }),
  'Spoonbill': (c, g, p) => faunaBird(c, g, p, { legs: 0.11, bill: 'spoon' }),
  'Avocet': (c, g, p) => faunaBird(c, g, p, { legs: 0.11, bill: 'long' }),
  'Ibis': (c, g, p) => faunaBird(c, g, p, { legs: 0.10, bill: 'long' }),
  'Snipe': (c, g, p) => faunaBird(c, g, p, { legs: 0.06, bill: 'long' }),
  'Godwit': (c, g, p) => faunaBird(c, g, p, { legs: 0.08, bill: 'long' }),
  'Pelican': (c, g, p) => faunaBird(c, g, p, { legs: 0.03, bill: 'huge' }),
  'Toucan': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'huge' }),
  'Kookaburra': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'huge' }),
  'Hornbill': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'huge', crest: true }),
  'Kiwi': (c, g, p) => faunaBird(c, g, p, { legs: 0.01, bill: 'long', flightless: true }),
  'Cassowary': (c, g, p) => faunaBird(c, g, p, { legs: 0.10, bill: 'stout', crest: true, flightless: true }),
  'Ostrich': (c, g, p) => faunaBird(c, g, p, { legs: 0.14, bill: 'stout', flightless: true }),
  'Emu': (c, g, p) => faunaBird(c, g, p, { legs: 0.13, bill: 'stout', flightless: true }),
  'Kakapo': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'stout', flightless: true }),
  'Secretary Bird': (c, g, p) => faunaBird(c, g, p, { legs: 0.13, bill: 'hook', crest: true }),
  'Hoatzin': (c, g, p) => faunaBird(c, g, p, { legs: 0.04, bill: 'stout', crest: true }),
  'Swan': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'stout' }),
  'Puffin': (c, g, p) => faunaBird(c, g, p, { legs: 0.02, bill: 'stout' }),
};
