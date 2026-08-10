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
import { speciesHue } from './surface.js';
import { ellipseTube } from './torso.js';
import { coatMaterial } from './skin.js';
import { insectBody } from './invertoverrides.js';

/* the cost dial for bird plumage, matching MAT_DETAIL in quadrupedoverrides.
   Portraits are generated at runtime under an art-hold law and a standing
   "phone runs hot" mandate, so the density has to be turnable from one place.
   0 reproduces the pre-wave-21 flat body exactly. */
const BIRD_MAT_DETAIL = 1;

/** THE PATTERN LAW (D-ART-16): every mark falls off to zero alpha, so it
    melts into the surface instead of sitting on it as a sticker. */
function softMark(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgb: string, a: number, rot = 0): void {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, ry / rx);
  const gg = c.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
  gg.addColorStop(0, `rgba(${rgb},${a})`);
  gg.addColorStop(0.55, `rgba(${rgb},${a * 0.8})`);
  gg.addColorStop(0.82, `rgba(${rgb},${a * 0.32})`);
  gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}

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
export function faunaWingedInsect(c: Ctx, g: G, pIn: Pal, opts: { open: boolean; slim: boolean; body?: number; hue?: string;
    /* ★ WAVE 64 — the two identity features gp3 failed this painter's species
       for: the caddisfly's thread antennae (longer than its own body, held
       FORWARD) and the male dobsonfly's huge crossed sickle mandibles. */
    threadAntennae?: boolean; sickleJaws?: boolean;
    beak?: boolean; scorpionTail?: boolean; wingBlotches?: boolean }): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  const r = mulberry32(((g.seed as number) ^ 0x2C4E) >>> 0);
  const cx = S * 0.5, cy = S * 0.5;
  ground(c, cx, S * 0.82, S * 0.18);
  /* ★ WAVE 22 — proportioncheck measured Mayfly, Damselfly, Caddisfly, Stonefly,
     Dobsonfly and Scorpionfly at the SAME 197px width to the pixel: two boolean
     flags cannot express six body plans. `body` scales the abdomen, and it
     defaults to 1 so the dragonfly — the painter Nick called near-perfect — is
     byte-unchanged (D-ART-14). */
  const bodyK = opts.body ?? 1;
  const abLen = S * (opts.slim ? 0.30 : 0.26) * bodyK, abW = S * (opts.slim ? 0.022 : 0.034) / Math.sqrt(bodyK);
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
    if (opts.wingBlotches) {
      /* The spots must survive the translucent wing at card scale. */
      c.fillStyle = 'rgba(30,22,15,0.88)';
      for (const u of [0.28, 0.56, 0.80]) { c.beginPath(); c.ellipse(len * u, -len * 0.040, len * 0.102, len * 0.072, 0, 0, TAU); c.fill(); }
    }
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
  if (opts.scorpionTail) {
    /* The male scorpionfly's abdomen ends in a lifted bulb, not a straight fly tail. */
    const tx = cx + abLen * 0.94, ty = cy + abW * 0.18;
    c.strokeStyle = p.dark; c.lineWidth = Math.max(3, abW * 1.25); c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx - abLen * 0.18, ty); c.quadraticCurveTo(tx + abLen * 0.04, ty - abLen * 0.18, tx - abLen * 0.02, ty - abLen * 0.34); c.stroke();
    c.fillStyle = p.dark; c.beginPath(); c.arc(tx - abLen * 0.02, ty - abLen * 0.34, Math.max(5, abW * 2.1), 0, TAU); c.fill();
    c.fillStyle = 'rgba(235,196,104,0.42)'; c.beginPath(); c.arc(tx - abLen * 0.055, ty - abLen * 0.39, Math.max(1.7, abW * 0.44), 0, TAU); c.fill();
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
  if (opts.beak) {
    /* A downward rostrum must break the face silhouette, not resemble an antenna. */
    const bx = hx - S * 0.020, by = cy + S * 0.004;
    c.fillStyle = '#2d1c11';
    c.beginPath();
    c.moveTo(bx, by - S * 0.015);
    c.quadraticCurveTo(hx - S * 0.090, cy + S * 0.028, hx - S * 0.198, cy + S * 0.098);
    c.lineTo(hx - S * 0.218, cy + S * 0.124);
    c.lineTo(hx - S * 0.182, cy + S * 0.108);
    c.quadraticCurveTo(hx - S * 0.082, cy + S * 0.060, bx, by + S * 0.017);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(238,200,128,0.46)'; c.lineWidth = 1.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx - S * 0.010, by + S * 0.005); c.lineTo(hx - S * 0.188, cy + S * 0.108); c.stroke();
  }
  if (opts.threadAntennae) {
    /* the caddisfly's thread antennae: longer than the body, swept FORWARD */
    c.strokeStyle = p.dark; c.lineWidth = 1.6; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(hx - 8, cy - 6 + s * 5);
      c.quadraticCurveTo(hx - S * 0.16, cy - S * 0.05 + s * S * 0.03, hx - S * 0.30, cy - S * 0.10 + s * S * 0.055);
      c.stroke();
    }
  }
  if (opts.sickleJaws) {
    /* the male dobsonfly's huge CROSSED sickle mandibles */
    c.strokeStyle = '#4a3520'; c.lineWidth = 4.5; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(hx - 10, cy - 2 + s * 6);
      c.quadraticCurveTo(hx - S * 0.10, cy + s * S * 0.015, hx - S * 0.135, cy - s * S * 0.028);
      c.stroke();
    }
  }
  /* ⚠ NO TEXTURE PASS HERE, DELIBERATELY. A speckle pass was added to this
     painter and immediately degraded it: the venated wings — the reason the
     reviews and Nick both singled this species out — turned into grey
     smudges. THE OVERRIDE LAW APPLIES TO OUR OWN IMPROVEMENTS: never
     override what already excels, including when the thing doing the
     overriding is a later idea of ours.
     @rng-unused: texturing this painter demonstrably made it worse. */
  void r;
}
/** a BEETLE: domed elytra shell, short legs (Ladybug/Firefly/Diving Beetle) */
export function faunaBeetle(c: Ctx, g: G, pIn: Pal, opts: { spots?: boolean; glow?: boolean; paddle?: boolean; hue?: string }): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
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
  /* ★ WAVE 21 — the elytra get the shell material. Note the axis: a beetle is
     drawn from ABOVE, so the body runs head-to-tail down the screen and the
     tube has to be rotated a quarter turn. Built with the screen axis instead
     (the obvious way) the segment seams run the length of the beetle rather
     than across it, which reads as a crack rather than as segmentation. */
  {
    c.save();
    c.beginPath(); c.ellipse(cx, cy, rw, rh, 0, 0, TAU); c.clip();
    coatMaterial(c, ellipseTube(cx, cy, rh, rw, Math.PI / 2), r, p, 'chitin',
      { detail: BIRD_MAT_DETAIL, seams: false });
    c.restore();
  }
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

/* ---------------- full-reset r1: named small-invertebrate whole forms ----------------
   These painters are deliberately opt-in from FAUNA_NAME. The accepted Beetle,
   Damselfly, Dragonfly, Squid and Giant Squid controls stay on their existing
   byte-identical helpers, while each reset target owns one connected silhouette
   and returns before the older generic body can double-paint it. */
type ResetWingedKind = 'caddisfly' | 'dobsonfly' | 'mayfly' | 'stonefly' | 'scorpionfly';

function resetWingedHue(kind: ResetWingedKind): string {
  switch (kind) {
    case 'caddisfly': return '#755034';
    case 'dobsonfly': return '#746e63';
    case 'mayfly': return '#c5b783';
    case 'stonefly': return '#3b4644';
    case 'scorpionfly': return '#956c32';
  }
}

function resetInsectLegs(c: Ctx, p: Pal, thoraxX: number, cy: number, spread = 1): void {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 3; i++) for (const side of [-1, 1] as const) {
    const x = thoraxX - 12 + i * 12, y = cy + side * (9 + i * 2);
    const kneeX = x - 8 + i * 8, kneeY = cy + side * (28 + i * 4) * spread;
    const footX = x + (i - 1) * 18, footY = cy + side * (43 + i * 3) * spread;
    c.strokeStyle = 'rgba(18,22,24,0.90)'; c.lineWidth = 5.2;
    c.beginPath(); c.moveTo(x, y); c.lineTo(kneeX, kneeY); c.lineTo(footX, footY); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x, y); c.lineTo(kneeX, kneeY); c.stroke();
    c.fillStyle = p.dark; c.beginPath(); c.arc(kneeX, kneeY, 3.2, 0, TAU); c.fill();
  }
}

function resetThreadAntennae(c: Ctx, hx: number, cy: number, length: number): void {
  for (const side of [-1, 1] as const) {
    const y = cy + side * 7;
    c.strokeStyle = 'rgba(15,18,21,0.96)'; c.lineWidth = 4.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx - 4, y);
    c.bezierCurveTo(hx - length * 0.34, y + side * 5, hx - length * 0.72, y + side * 18, hx - length, y + side * 13); c.stroke();
    c.strokeStyle = 'rgba(210,184,128,0.76)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(hx - 4, y);
    c.bezierCurveTo(hx - length * 0.34, y + side * 5, hx - length * 0.72, y + side * 18, hx - length, y + side * 13); c.stroke();
  }
}

function resetNetWing(c: Ctx, x0: number, y0: number, x1: number, half: number,
    tint: string, blotches = false, hairy = false): void {
  const len = x1 - x0;
  const wing = c.createLinearGradient(x0, y0, x1, y0);
  wing.addColorStop(0, tint); wing.addColorStop(0.72, 'rgba(185,204,214,0.32)'); wing.addColorStop(1, 'rgba(168,190,204,0.18)');
  c.fillStyle = wing; c.beginPath(); c.moveTo(x0, y0);
  c.bezierCurveTo(x0 + len * 0.26, y0 - half * 1.35, x0 + len * 0.72, y0 - half * 1.15, x1, y0 - half * 0.12);
  c.bezierCurveTo(x0 + len * 0.70, y0 + half * 0.82, x0 + len * 0.24, y0 + half * 0.92, x0, y0); c.closePath(); c.fill();
  c.strokeStyle = hairy ? 'rgba(96,68,40,0.92)' : 'rgba(218,230,236,0.72)'; c.lineWidth = hairy ? 3.8 : 2.2; c.stroke();
  c.save(); c.beginPath(); c.moveTo(x0, y0);
  c.bezierCurveTo(x0 + len * 0.26, y0 - half * 1.35, x0 + len * 0.72, y0 - half * 1.15, x1, y0 - half * 0.12);
  c.bezierCurveTo(x0 + len * 0.70, y0 + half * 0.82, x0 + len * 0.24, y0 + half * 0.92, x0, y0); c.closePath(); c.clip();
  c.strokeStyle = hairy ? 'rgba(224,191,137,0.32)' : 'rgba(224,238,242,0.38)'; c.lineWidth = 1.4;
  for (let i = 1; i <= 6; i++) {
    const u = i / 7;
    c.beginPath(); c.moveTo(x0 + len * 0.05, y0); c.lineTo(x0 + len * u, y0 - half * (0.78 - u * 0.30)); c.stroke();
    c.beginPath(); c.moveTo(x0 + len * u, y0 - half * (0.78 - u * 0.30)); c.lineTo(x0 + len * Math.min(0.98, u + 0.13), y0 + half * 0.34); c.stroke();
  }
  if (blotches) {
    c.fillStyle = 'rgba(24,18,14,0.88)';
    for (const u of [0.32, 0.58, 0.82]) { c.beginPath(); c.ellipse(x0 + len * u, y0 - half * (0.30 + (u % 0.2)), len * 0.075, half * 0.26, -0.12, 0, TAU); c.fill(); }
  }
  if (hairy) {
    c.strokeStyle = 'rgba(238,213,166,0.42)'; c.lineWidth = 1.1;
    for (let i = 0; i < 28; i++) { const u = i / 27; c.beginPath(); c.moveTo(x0 + len * u, y0 + half * (0.45 + Math.sin(u * Math.PI) * 0.20)); c.lineTo(x0 + len * u, y0 + half * (0.57 + Math.sin(u * Math.PI) * 0.20)); c.stroke(); }
  }
  c.restore();
}

function resetInsectTorso(c: Ctx, p: Pal, hx: number, thoraxX: number, cy: number,
    tailX: number, slim: number): void {
  const headR = 18, thoraxW = 30, thoraxH = 24;
  c.fillStyle = bodyGrad(c, p, hx, cy, headR); c.beginPath(); c.ellipse(hx, cy, headR, headR * 0.86, 0, 0, TAU); c.fill();
  c.fillStyle = bodyGrad(c, p, thoraxX, cy, thoraxW); c.beginPath(); c.ellipse(thoraxX, cy, thoraxW, thoraxH, 0, 0, TAU); c.fill();
  const abdomen = c.createLinearGradient(thoraxX, cy - slim, tailX, cy + slim);
  abdomen.addColorStop(0, p.lit); abdomen.addColorStop(0.48, p.base); abdomen.addColorStop(1, p.dark);
  c.fillStyle = abdomen; c.beginPath(); c.moveTo(thoraxX + 18, cy - slim);
  c.bezierCurveTo(thoraxX + 54, cy - slim * 1.20, tailX - 28, cy - slim * 0.74, tailX, cy);
  c.bezierCurveTo(tailX - 28, cy + slim * 0.74, thoraxX + 54, cy + slim * 1.20, thoraxX + 18, cy + slim); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(18,20,22,0.30)'; c.lineWidth = 2;
  const span = tailX - (thoraxX + 22);
  for (let i = 1; i <= 6; i++) { const x = thoraxX + 22 + span * i / 7; c.beginPath(); c.moveTo(x, cy - slim * 0.78); c.lineTo(x, cy + slim * 0.78); c.stroke(); }
  eye(c, hx - 8, cy - 6, 5.2);
}

function faunaResetWingedInsect(c: Ctx, g: G, pIn: Pal, kind: ResetWingedKind): void {
  const p = speciesHue(pIn, resetWingedHue(kind));
  const cy = S * 0.51;
  ground(c, S * 0.52, S * 0.79, S * 0.30);

  if (kind === 'mayfly') {
    /* Side view: a continuous up-curved abdomen, sail-like upright wings, and
       three long caudal filaments. The large forewing owns the silhouette. */
    const hx = 128, tx = 166, tailX = 326;
    resetInsectLegs(c, p, tx, cy + 8, 0.76);
    c.fillStyle = bodyGrad(c, p, tx, cy, 28); c.beginPath(); c.ellipse(tx, cy, 29, 22, -0.08, 0, TAU); c.fill();
    const abdomen = c.createLinearGradient(tx, cy, tailX, cy - 34); abdomen.addColorStop(0, p.lit); abdomen.addColorStop(0.52, p.base); abdomen.addColorStop(1, p.dark);
    c.fillStyle = abdomen; c.beginPath(); c.moveTo(tx + 19, cy - 10);
    c.bezierCurveTo(230, cy - 12, 288, cy - 28, tailX, cy - 42);
    c.bezierCurveTo(286, cy - 28, 228, cy + 7, tx + 19, cy + 10); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(58,51,36,0.40)'; c.lineWidth = 2;
    for (let i = 1; i <= 7; i++) { const u = i / 8, x = tx + 22 + (tailX - tx - 26) * u, y = cy - 36 * u; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 2, y + 8); c.stroke(); }
    /* Two forewings stand together above the thorax; their filled triangular
       membranes remain a sail at thumbnail size. */
    for (const off of [-7, 7]) {
      const wg = c.createLinearGradient(tx, cy, tx + off, cy - 150); wg.addColorStop(0, 'rgba(210,222,205,0.52)'); wg.addColorStop(1, 'rgba(236,242,226,0.82)');
      c.fillStyle = wg; c.beginPath(); c.moveTo(tx - 12, cy - 8); c.lineTo(tx + off - 8, cy - 152); c.quadraticCurveTo(tx + off + 68, cy - 102, tx + 24, cy - 4); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(235,240,220,0.70)'; c.lineWidth = 2.2; c.stroke();
      c.strokeStyle = 'rgba(107,104,77,0.34)'; c.lineWidth = 1.2;
      for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(tx + off - 7, cy - 144); c.lineTo(tx + 10 + i * 10, cy - 16 - i * 7); c.stroke(); }
    }
    c.fillStyle = bodyGrad(c, p, hx, cy, 18); c.beginPath(); c.ellipse(hx, cy, 19, 16, 0, 0, TAU); c.fill(); eye(c, hx - 7, cy - 5, 4.8);
    c.strokeStyle = p.dark; c.lineWidth = 2.2; for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(hx - 8, cy + side * 5); c.lineTo(hx - 40, cy + side * 13); c.stroke(); }
    for (const side of [-1, 0, 1]) {
      c.strokeStyle = side === 0 ? p.lit : p.base; c.lineWidth = side === 0 ? 2.8 : 3.6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(tailX - 12, cy - 41 + side * 3); c.bezierCurveTo(356, cy - 48 + side * 13, 384, cy - 28 + side * 18, 414, cy - 45 + side * 24); c.stroke();
    }
    return;
  }

  if (kind === 'caddisfly') {
    const hx = 130, tx = 170, tailX = 318;
    resetInsectLegs(c, p, tx, cy + 9, 0.78);
    resetInsectTorso(c, p, hx, tx, cy, tailX, 16);
    /* Both wing pairs form one closed, hairy roof over the abdomen. The dorsal
       ridge belongs to the filled silhouette, so no open-V gap can turn the
       resting adult into a wasp with lateral blades. */
    const roofTip = 356;
    const wg = c.createLinearGradient(tx, cy - 44, tx, cy + 44);
    wg.addColorStop(0, '#a47b50'); wg.addColorStop(0.48, '#85603e'); wg.addColorStop(0.52, '#755035'); wg.addColorStop(1, '#493429');
    c.fillStyle = wg; c.beginPath(); c.moveTo(tx - 7, cy);
    c.bezierCurveTo(218, cy - 46, 310, cy - 42, roofTip, cy - 11);
    c.quadraticCurveTo(364, cy, roofTip, cy + 11);
    c.bezierCurveTo(310, cy + 42, 218, cy + 46, tx - 7, cy); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(226,195,145,0.64)'; c.lineWidth = 2.8; c.stroke();
    /* Sparse ribs describe the sloping tent surface; the stronger centre line
       is the roof peak, not a transparent split between separate panels. */
    c.strokeStyle = 'rgba(226,198,151,0.30)'; c.lineWidth = 1.25;
    for (let i = 2; i <= 10; i++) {
      const u = i / 12, x = tx + (roofTip - tx) * u, half = 10 + 34 * Math.sin(u * Math.PI);
      for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(x - 13, cy + side * 2); c.lineTo(x + 4, cy + side * half * 0.78); c.stroke(); }
    }
    c.strokeStyle = 'rgba(244,218,174,0.62)'; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx - 5, cy); c.bezierCurveTo(230, cy - 3, 312, cy - 2, roofTip, cy); c.stroke();
    /* A short, evenly rooted fringe follows both eaves instead of fanning out
       from a detached wing tip. */
    c.strokeStyle = 'rgba(235,211,171,0.48)'; c.lineWidth = 1.2;
    for (let i = 1; i < 24; i++) {
      const u = i / 24, x = tx + (roofTip - tx) * u, half = 8 + 36 * Math.sin(u * Math.PI);
      for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(x, cy + side * half); c.lineTo(x + 1.5, cy + side * (half + 6)); c.stroke(); }
    }
    /* Repaint head/thorax over the wing roots so every membrane grows from the
       same thoracic volume. */
    c.fillStyle = bodyGrad(c, p, tx, cy, 30); c.beginPath(); c.ellipse(tx, cy, 31, 25, 0, 0, TAU); c.fill();
    c.fillStyle = bodyGrad(c, p, hx, cy, 18); c.beginPath(); c.ellipse(hx, cy, 19, 16, 0, 0, TAU); c.fill(); eye(c, hx - 7, cy - 5, 4.5);
    resetThreadAntennae(c, hx, cy, 142);
    return;
  }

  if (kind === 'dobsonfly') {
    const hx = 116, tx = 162, tailX = 338;
    resetInsectLegs(c, p, tx, cy + 8, 0.82);
    resetInsectTorso(c, p, hx, tx, cy, tailX, 18);
    /* Long smoky, densely net-veined wings overlap along the back and extend
       beyond the continuous soft abdomen. */
    resetNetWing(c, tx - 3, cy - 5, 386, 45, 'rgba(126,125,118,0.70)');
    resetNetWing(c, tx + 4, cy + 7, 394, 38, 'rgba(158,158,150,0.48)');
    c.fillStyle = bodyGrad(c, p, tx, cy, 30); c.beginPath(); c.ellipse(tx, cy, 31, 25, 0, 0, TAU); c.fill();
    c.fillStyle = bodyGrad(c, p, hx, cy, 22); c.beginPath(); c.ellipse(hx, cy, 23, 20, 0, 0, TAU); c.fill(); eye(c, hx - 8, cy - 6, 5.5);
    /* Male mandibles are broad filled sickles, rooted at the head and crossing
       in front; strokes alone collapsed to antennae at 132px. */
    for (const side of [-1, 1] as const) {
      c.strokeStyle = '#5a351e'; c.lineWidth = 11; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 15, cy + side * 8); c.quadraticCurveTo(72, cy + side * 34, 40, cy - side * 9); c.stroke();
      c.strokeStyle = '#b27a45'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(hx - 15, cy + side * 7); c.quadraticCurveTo(72, cy + side * 31, 42, cy - side * 8); c.stroke();
    }
    resetThreadAntennae(c, hx, cy - 4, 98);
    return;
  }

  if (kind === 'stonefly') {
    const hx = 126, tx = 169, tailX = 343;
    resetInsectLegs(c, p, tx, cy + 8, 0.90);
    resetInsectTorso(c, p, hx, tx, cy, tailX, 17);
    /* Flat overlapping wings lie along the back, not upright or laterally
       spread; the second wing peeks out as a coherent lower layer. */
    resetNetWing(c, tx - 2, cy - 7, 367, 31, 'rgba(91,108,108,0.72)');
    resetNetWing(c, tx + 4, cy + 8, 360, 26, 'rgba(73,88,88,0.58)');
    c.fillStyle = bodyGrad(c, p, tx, cy, 29); c.beginPath(); c.ellipse(tx, cy, 30, 24, 0, 0, TAU); c.fill();
    /* The head is visibly flat and squared off. */
    c.fillStyle = bodyGrad(c, p, hx, cy, 22); c.beginPath(); c.roundRect(hx - 23, cy - 18, 44, 36, 8); c.fill(); eye(c, hx - 9, cy - 6, 4.8);
    resetThreadAntennae(c, hx, cy, 118);
    c.strokeStyle = p.dark; c.lineWidth = 6; c.lineCap = 'round';
    for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(tailX - 3, cy + side * 6); c.lineTo(tailX + 34, cy + side * 17); c.stroke(); }
    return;
  }

  /* Scorpionfly: the beak, blotched wings, and harmless male genital bulb are
     integrated into one continuous thorax/abdomen rather than bead ornaments. */
  {
    const hx = 125, tx = 169, tailX = 326;
    resetInsectLegs(c, p, tx, cy + 8, 0.84);
    resetInsectTorso(c, p, hx, tx, cy, tailX, 15);
    resetNetWing(c, tx - 1, cy - 9, 336, 34, 'rgba(197,174,119,0.60)', true);
    resetNetWing(c, tx + 7, cy + 8, 328, 28, 'rgba(181,151,92,0.46)', true);
    c.fillStyle = bodyGrad(c, p, tx, cy, 29); c.beginPath(); c.ellipse(tx, cy, 30, 24, 0, 0, TAU); c.fill();
    c.fillStyle = bodyGrad(c, p, hx, cy, 20); c.beginPath(); c.ellipse(hx, cy, 21, 18, 0, 0, TAU); c.fill(); eye(c, hx - 8, cy - 6, 4.7);
    /* Down-curved rostrum with jaws at its terminal tip. */
    c.fillStyle = '#5a371d'; c.beginPath(); c.moveTo(hx - 17, cy - 7);
    c.bezierCurveTo(96, cy + 3, 75, cy + 25, 55, cy + 48); c.lineTo(68, cy + 52);
    c.bezierCurveTo(87, cy + 30, 108, cy + 16, hx - 13, cy + 7); c.closePath(); c.fill();
    c.strokeStyle = '#d4aa60'; c.lineWidth = 3; c.beginPath(); c.moveTo(54, cy + 48); c.lineTo(44, cy + 42); c.moveTo(55, cy + 49); c.lineTo(45, cy + 57); c.stroke();
    /* Tapered abdomen curves into the terminal male bulb. */
    c.strokeStyle = p.dark; c.lineWidth = 15; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tailX - 28, cy); c.bezierCurveTo(346, cy - 9, 365, cy - 42, 354, cy - 78); c.stroke();
    c.fillStyle = p.dark; c.beginPath(); c.ellipse(354, cy - 87, 18, 22, -0.22, 0, TAU); c.fill();
    c.fillStyle = p.lit; c.beginPath(); c.arc(348, cy - 94, 5, 0, TAU); c.fill();
    resetThreadAntennae(c, hx, cy - 5, 78);
  }
}

type ResetBeetleKind = 'carrion' | 'diving' | 'dung' | 'firefly' | 'ladybug' | 'water';

function resetBeetleHue(kind: ResetBeetleKind): string {
  switch (kind) {
    case 'carrion': return '#252226';
    case 'diving': return '#27352d';
    case 'dung': return '#111417';
    case 'firefly': return '#3a2b21';
    case 'ladybug': return '#c92d2a';
    case 'water': return '#5a422b';
  }
}

function resetBeetleLeg(c: Ctx, p: Pal, x: number, y: number, side: -1 | 1,
    row: number, rake = false): void {
  const kneeX = x + side * (43 + row * 5), kneeY = y + 11 + row * 27;
  const footX = x + side * 70, footY = kneeY + 20;
  c.strokeStyle = '#15191e'; c.lineWidth = rake ? 10 : 6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x + side * 12, y); c.lineTo(kneeX, kneeY); c.lineTo(footX, footY); c.stroke();
  c.strokeStyle = p.lit; c.lineWidth = rake ? 2.6 : 1.5;
  c.beginPath(); c.moveTo(x + side * 14, y); c.lineTo(kneeX, kneeY); c.stroke();
  c.fillStyle = '#15191e'; c.beginPath(); c.arc(kneeX, kneeY, 4, 0, TAU); c.fill();
  if (rake) {
    c.strokeStyle = '#15191e'; c.lineWidth = 4;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(footX - side * 3, footY + i * 4); c.lineTo(footX + side * 17, footY + i * 7); c.stroke(); }
  }
}

function resetSwimmingBeetleHindLeg(c: Ctx, p: Pal, x: number, y: number,
    side: -1 | 1): void {
  /* Femur, tibia and broad tarsus are one tapered ribbon whose buried root is
     occluded by the shell. Hair grows along the full trailing edge, not as a
     paintbrush fan attached to a stick leg. */
  const rootX = x + side * 11, rootY = y - 7;
  const blade = c.createLinearGradient(rootX, rootY, x + side * 124, y + 43);
  blade.addColorStop(0, p.lit); blade.addColorStop(0.42, p.base); blade.addColorStop(1, p.dark);
  c.fillStyle = blade; c.beginPath(); c.moveTo(rootX, rootY);
  c.bezierCurveTo(x + side * 34, y - 4, x + side * 53, y + 8, x + side * 67, y + 17);
  c.bezierCurveTo(x + side * 87, y + 18, x + side * 114, y + 27, x + side * 126, y + 38);
  c.quadraticCurveTo(x + side * 116, y + 52, x + side * 88, y + 49);
  c.bezierCurveTo(x + side * 61, y + 44, x + side * 34, y + 27, x + side * 10, y + 10);
  c.closePath(); c.fill();
  c.strokeStyle = '#15191e'; c.lineWidth = 3.4; c.lineJoin = 'round'; c.stroke();
  c.strokeStyle = 'rgba(231,238,221,0.42)'; c.lineWidth = 1.7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + side * 17, y + 2); c.bezierCurveTo(x + side * 48, y + 14, x + side * 91, y + 31, x + side * 119, y + 38); c.stroke();
  c.strokeStyle = 'rgba(225,235,218,0.76)'; c.lineWidth = 1.45;
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, bx = x + side * (68 + u * 54), by = y + 40 + u * 7;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + side * (2 + u * 2), by + 7); c.stroke();
  }
}

function resetBeetleAntennae(c: Ctx, cx: number, y: number,
    opts: { long?: boolean; clubbed?: boolean } = {}): void {
  const long = opts.long === true;
  for (const side of [-1, 1] as const) {
    const len = long ? 76 : 52;
    c.strokeStyle = long ? '#986b35' : '#745535'; c.lineWidth = long ? 3.2 : 4.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + side * 10, y); c.quadraticCurveTo(cx + side * (len * 0.62), y - 26, cx + side * len, y - 18); c.stroke();
    if (opts.clubbed !== false) {
      c.fillStyle = '#684727'; c.beginPath(); c.ellipse(cx + side * len, y - 18, 9, 5.5, side * 0.24, 0, TAU); c.fill();
    }
  }
}

function faunaResetBeetle(c: Ctx, g: G, pIn: Pal, kind: ResetBeetleKind): void {
  const p = speciesHue(pIn, resetBeetleHue(kind));
  const r = mulberry32(((g.seed as number) ^ 0xBEE72A) >>> 0);
  const cx = S * 0.5, top = S * 0.25, cy = S * 0.52;
  const long = kind === 'firefly';
  const rw = S * (long ? 0.145 : kind === 'carrion' ? 0.175 : 0.18);
  const rh = S * (long ? 0.235 : kind === 'ladybug' ? 0.18 : 0.205);
  ground(c, cx, cy + rh + 34, S * 0.22);
  /* Legs are painted first, so their coxae disappear under the thorax/shell
     instead of looking glued to the outside of the elytra. */
  for (let row = 0; row < 3; row++) for (const side of [-1, 1] as const) {
    const oar = (kind === 'diving' || kind === 'water') && row === 2;
    const rake = kind === 'dung' && row === 0;
    const y = cy - rh * 0.58 + row * rh * 0.55;
    if (oar) resetSwimmingBeetleHindLeg(c, p, cx, y, side);
    else resetBeetleLeg(c, p, cx, y, side, row, rake);
  }

  if (kind === 'carrion') {
    /* Exposed posterior abdomen is one continuation under deliberately short
       elytra, not a detached tail badge. */
    c.fillStyle = '#17181c'; c.beginPath(); c.roundRect(cx - rw * 0.70, cy + rh * 0.50, rw * 1.40, rh * 0.84, 22); c.fill();
    c.strokeStyle = '#d56d28'; c.lineWidth = 5;
    for (let i = 0; i < 3; i++) { const y = cy + rh * (0.62 + i * 0.20); c.beginPath(); c.moveTo(cx - rw * 0.52, y); c.lineTo(cx + rw * 0.52, y); c.stroke(); }
  }

  const shell = c.createRadialGradient(cx - rw * 0.38, cy - rh * 0.42, 4, cx, cy, rh * 1.22);
  shell.addColorStop(0, p.lit); shell.addColorStop(0.56, p.base); shell.addColorStop(1, p.dark);
  c.fillStyle = shell;
  if (kind === 'dung') {
    c.beginPath(); c.ellipse(cx, cy + 4, rw, rh, 0, 0, TAU); c.fill();
  } else if (kind === 'carrion') {
    c.beginPath(); c.roundRect(cx - rw, cy - rh, rw * 2, rh * 1.72, 34); c.fill();
  } else {
    c.beginPath(); c.ellipse(cx, cy, rw, rh, 0, 0, TAU); c.fill();
  }
  rim(c, () => kind === 'carrion' ? c.roundRect(cx - rw, cy - rh, rw * 2, rh * 1.72, 34) : c.ellipse(cx, cy + (kind === 'dung' ? 4 : 0), rw, rh, 0, -2.8, 0.35), 2.6);

  if (kind === 'diving') {
    c.strokeStyle = '#e0d07b'; c.lineWidth = 8; c.beginPath(); c.ellipse(cx, cy, rw - 4, rh - 4, 0, 0, TAU); c.stroke();
  }
  c.strokeStyle = 'rgba(8,9,11,0.62)'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy - rh * 0.86); c.lineTo(cx, cy + rh * (kind === 'carrion' ? 0.60 : 0.88)); c.stroke();

  if (kind === 'carrion') {
    c.fillStyle = '#d36b2b';
    for (const [sx, sy, rot] of [[-0.48, -0.42, -0.35], [0.46, -0.40, 0.32], [-0.42, 0.18, 0.20], [0.44, 0.20, -0.18]] as const) {
      c.beginPath(); c.ellipse(cx + rw * sx, cy + rh * sy, rw * 0.31, rh * 0.17, rot, 0, TAU); c.fill();
    }
  }
  if (kind === 'ladybug') {
    c.fillStyle = '#11151a';
    for (const [sx, sy, q] of [[-0.45,-0.45,0.13],[0.45,-0.45,0.13],[-0.53,0.08,0.16],[0.53,0.08,0.16],[-0.30,0.48,0.14],[0.30,0.48,0.14]] as const) {
      c.beginPath(); c.arc(cx + rw * sx, cy + rh * sy, rw * q, 0, TAU); c.fill();
    }
  }
  if (kind === 'firefly') {
    /* The lantern is the curved underside of the posterior abdominal segments,
       clipped to and sharing the body's contour—not a badge pasted on top. */
    c.save(); c.globalCompositeOperation = 'lighter';
    const halo = c.createRadialGradient(cx, cy + rh * 0.76, 2, cx, cy + rh * 0.76, 69);
    halo.addColorStop(0, 'rgba(225,255,122,0.80)'); halo.addColorStop(0.45, 'rgba(182,237,76,0.28)'); halo.addColorStop(1, 'rgba(160,220,60,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(cx, cy + rh * 0.76, 69, 0, TAU); c.fill(); c.restore();
    c.save(); c.beginPath(); c.ellipse(cx, cy, rw, rh, 0, 0, TAU); c.clip();
    const lantern = c.createLinearGradient(cx, cy + rh * 0.46, cx, cy + rh);
    lantern.addColorStop(0, '#9fcd47'); lantern.addColorStop(0.38, '#dfff78'); lantern.addColorStop(1, '#bfe94e');
    c.fillStyle = lantern; c.beginPath(); c.moveTo(cx - rw * 0.78, cy + rh * 0.48);
    c.bezierCurveTo(cx - rw * 0.72, cy + rh * 0.77, cx - rw * 0.42, cy + rh * 0.98, cx, cy + rh * 1.02);
    c.bezierCurveTo(cx + rw * 0.42, cy + rh * 0.98, cx + rw * 0.72, cy + rh * 0.77, cx + rw * 0.78, cy + rh * 0.48);
    c.quadraticCurveTo(cx, cy + rh * 0.66, cx - rw * 0.78, cy + rh * 0.48); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(92,122,42,0.82)'; c.lineWidth = 3.2;
    for (const u of [0.62, 0.77, 0.89]) {
      const half = rw * Math.sqrt(Math.max(0, 1 - u * u)) * 0.88;
      c.beginPath(); c.moveTo(cx - half, cy + rh * u); c.quadraticCurveTo(cx, cy + rh * (u + 0.055), cx + half, cy + rh * u); c.stroke();
    }
    c.restore();
  }
  if (kind === 'diving') {
    /* The retained air store follows the posterior underside of both elytra;
       its dark upper seam leaves the silver crescent visibly tucked below the
       wing cases instead of floating as a white badge. */
    const air = c.createLinearGradient(cx, cy + rh * 0.62, cx, cy + rh * 0.96);
    air.addColorStop(0, 'rgba(137,160,161,0.78)'); air.addColorStop(0.58, 'rgba(231,242,239,0.94)'); air.addColorStop(1, 'rgba(174,202,204,0.82)');
    c.fillStyle = air; c.beginPath(); c.moveTo(cx - rw * 0.68, cy + rh * 0.63);
    c.quadraticCurveTo(cx, cy + rh * 0.98, cx + rw * 0.68, cy + rh * 0.63);
    c.quadraticCurveTo(cx, cy + rh * 0.77, cx - rw * 0.68, cy + rh * 0.63); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(13,22,20,0.78)'; c.lineWidth = 4.5; c.beginPath();
    c.moveTo(cx - rw * 0.68, cy + rh * 0.63); c.quadraticCurveTo(cx, cy + rh * 0.77, cx + rw * 0.68, cy + rh * 0.63); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.62)'; c.lineWidth = 1.8; c.beginPath();
    c.moveTo(cx - rw * 0.48, cy + rh * 0.76); c.quadraticCurveTo(cx, cy + rh * 0.91, cx + rw * 0.48, cy + rh * 0.76); c.stroke();
  }

  /* Pronotum/head geometry is named because its occlusion is identity. */
  if (kind === 'dung') {
    c.fillStyle = '#15191c'; c.beginPath(); c.moveTo(cx - rw * 0.73, cy - rh * 0.70); c.lineTo(cx - rw * 0.92, cy - rh * 1.12); c.quadraticCurveTo(cx, cy - rh * 1.38, cx + rw * 0.92, cy - rh * 1.12); c.lineTo(cx + rw * 0.73, cy - rh * 0.70); c.closePath(); c.fill();
    c.strokeStyle = '#242a2e'; c.lineWidth = 4; c.stroke();
  } else {
    c.fillStyle = kind === 'ladybug' || kind === 'firefly' ? '#15171b' : p.dark;
    c.beginPath(); c.ellipse(cx, cy - rh * 0.90, rw * (kind === 'firefly' ? 0.92 : 0.72), rh * 0.29, 0, 0, TAU); c.fill();
    /* Tiny head stays tucked under the anterior shield. */
    c.beginPath(); c.ellipse(cx, cy - rh * 1.14, rw * 0.30, rh * 0.16, 0, 0, TAU); c.fill();
  }

  if (kind === 'firefly') {
    resetBeetleAntennae(c, cx, top + 8, { long: true, clubbed: false });
  } else if (kind === 'carrion' || kind === 'water') {
    resetBeetleAntennae(c, cx, cy - rh * 1.14);
  } else if (kind === 'diving') {
    resetBeetleAntennae(c, cx, cy - rh * 1.14);
  }

  /* Dung beetle head and forelegs are a rake system: broad spade plus teeth. */
  if (kind === 'dung') {
    /* Distal rake tibiae sit outside the dome. The spade is painted last over
       their roots, so they articulate from under the head instead of floating. */
    for (const side of [-1, 1] as const) {
      c.strokeStyle = '#11171a'; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(cx + side * rw * 0.62, cy - rh * 0.73);
      c.lineTo(cx + side * (rw + 34), cy - rh * 1.02); c.lineTo(cx + side * (rw + 62), cy - rh * 1.22); c.stroke();
      c.strokeStyle = '#566269'; c.lineWidth = 2.8;
      c.beginPath(); c.moveTo(cx + side * rw * 0.70, cy - rh * 0.76); c.lineTo(cx + side * (rw + 55), cy - rh * 1.18); c.stroke();
      c.strokeStyle = '#151b1e'; c.lineWidth = 4.5;
      for (let i = -2; i <= 2; i++) {
        const x = cx + side * (rw + 58), y = cy - rh * 1.22 + i * 5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * 19, y - 8 + i * 3); c.stroke();
      }
    }
    c.fillStyle = '#0e1113'; c.beginPath(); c.moveTo(cx - 54, cy - rh * 1.08); c.quadraticCurveTo(cx, cy - rh * 1.55, cx + 54, cy - rh * 1.08); c.lineTo(cx + 42, cy - rh * 0.82); c.lineTo(cx - 42, cy - rh * 0.82); c.closePath(); c.fill();
    c.strokeStyle = '#5d6970'; c.lineWidth = 4; c.stroke();
    c.strokeStyle = 'rgba(132,151,158,0.55)'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(cx, cy + 4, rw - 7, rh - 7, 0, Math.PI * 0.78, Math.PI * 1.72); c.stroke();
    c.fillStyle = 'rgba(170,190,196,0.16)'; c.beginPath(); c.ellipse(cx - rw * 0.32, cy - rh * 0.32, rw * 0.19, rh * 0.43, -0.38, 0, TAU); c.fill();
  }
  /* Fixed seed is consumed only for the named surface, keeping deterministic
     texture without leaking into any accepted shared helper. */
  if (kind === 'dung') {
    for (let i = 0; i < 14; i++) softMark(c, cx + (r() - 0.5) * rw * 1.15, cy + (r() - 0.5) * rh * 1.15, 7, 4, '105,122,128', 0.13);
  }
}

function faunaResetFlyLarva(c: Ctx, g: G, pIn: Pal): void {
  const cx = S * 0.50, cy = S * 0.54, left = S * 0.19, right = S * 0.82, h = S * 0.095;
  ground(c, cx, cy + h + 22, S * 0.27);
  const skin = c.createLinearGradient(left, cy - h, right, cy + h);
  skin.addColorStop(0, '#e8ddbd'); skin.addColorStop(0.42, '#fff6d9'); skin.addColorStop(0.78, '#d9c9a8'); skin.addColorStop(1, '#b5a17f');
  c.fillStyle = skin; c.beginPath();
  /* pointed anterior at left; broad blunt posterior at right */
  c.moveTo(left, cy); c.bezierCurveTo(left + 46, cy - h * 0.78, right - 78, cy - h * 1.08, right - 12, cy - h * 0.60);
  c.quadraticCurveTo(right + 10, cy, right - 12, cy + h * 0.60);
  c.bezierCurveTo(right - 80, cy + h * 1.08, left + 48, cy + h * 0.82, left, cy); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(108,91,65,0.72)'; c.lineWidth = 3; c.stroke();
  /* Segment folds stay inside one continuous skin; no bead caps, legs, or eye. */
  c.strokeStyle = 'rgba(132,110,76,0.34)'; c.lineWidth = 2.2;
  for (let i = 1; i <= 8; i++) { const u = i / 9, x = left + (right - left) * u, q = Math.sin(u * Math.PI); c.beginPath(); c.ellipse(x, cy, 9, h * (0.50 + q * 0.36), 0, -1.24, 1.24); c.stroke(); }
  c.fillStyle = '#5d4730'; c.beginPath(); c.moveTo(left + 5, cy - 4); c.lineTo(left - 6, cy); c.lineTo(left + 5, cy + 4); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.34)'; c.beginPath(); c.ellipse(cx - 22, cy - h * 0.43, 68, 11, -0.04, 0, TAU); c.fill();
  void g; void pIn;
}

function faunaResetSpringtail(c: Ctx, g: G, pIn: Pal): void {
  const p = speciesHue(pIn, '#59636e');
  const cx = S * 0.51, cy = S * 0.54, left = S * 0.28, right = S * 0.73, h = S * 0.082;
  ground(c, cx, cy + h + 28, S * 0.22);
  /* Six legs articulate from the thorax and disappear under a single soft
     segmented body. */
  c.strokeStyle = p.dark; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 0; i < 3; i++) for (const side of [-1, 1] as const) {
    const x = left + 66 + i * 18, y = cy + side * 10;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - 4 + i * 5, cy + side * 42); c.lineTo(x + (i - 1) * 17, cy + side * 58); c.stroke();
  }
  const body = c.createLinearGradient(left, cy - h, right, cy + h); body.addColorStop(0, p.lit); body.addColorStop(0.50, p.base); body.addColorStop(1, p.dark);
  c.fillStyle = body; c.beginPath(); c.moveTo(left + 30, cy - h * 0.76);
  c.bezierCurveTo(left + 82, cy - h * 1.05, right - 45, cy - h * 0.98, right, cy - h * 0.34);
  c.quadraticCurveTo(right + 12, cy, right, cy + h * 0.34);
  c.bezierCurveTo(right - 44, cy + h * 0.94, left + 82, cy + h * 1.04, left + 30, cy + h * 0.76);
  c.quadraticCurveTo(left - 8, cy, left + 30, cy - h * 0.76); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(210,224,232,0.46)'; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = 'rgba(20,26,32,0.32)'; c.lineWidth = 2;
  for (let i = 1; i <= 5; i++) { const x = left + 38 + (right - left - 46) * i / 6; c.beginPath(); c.ellipse(x, cy, 8, h * 0.75, 0, -1.18, 1.18); c.stroke(); }
  c.fillStyle = bodyGrad(c, p, left + 20, cy, 28); c.beginPath(); c.ellipse(left + 20, cy, 29, 25, 0, 0, TAU); c.fill(); eye(c, left + 4, cy - 7, 4.5);
  /* Short four-jointed antennae: each segment is a visible bead, not one long
     smooth rod. */
  for (const side of [-1, 1] as const) {
    let px = left + 1, py = cy + side * 6;
    for (let i = 0; i < 4; i++) {
      const x = left - 13 - i * 11, y = cy + side * (8 + i * 4);
      c.strokeStyle = p.dark; c.lineWidth = 3.5; c.beginPath(); c.moveTo(px, py); c.lineTo(x, y); c.stroke();
      c.fillStyle = i % 2 ? p.base : p.dark; c.beginPath(); c.arc(x, y, 4.3 - i * 0.35, 0, TAU); c.fill(); px = x; py = y;
    }
  }
  /* The forked furcula is folded forward under the posterior abdomen and
     shares a broad rooted base with the fourth abdominal segment. */
  const fx = right - 32, fy = cy + h * 0.48;
  c.strokeStyle = '#d1dbe1'; c.lineWidth = 8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(right + 28, cy + h * 1.35, cx + 36, cy + h * 1.42); c.stroke();
  c.lineWidth = 4.5;
  for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx + 38, cy + h * 1.42); c.lineTo(cx + 2, cy + h * 1.42 + side * 9); c.stroke(); }
  void g;
}

function sampleBezier(a: number, b: number, d: number, e: number, u: number): number {
  const v = 1 - u;
  return v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * d + u * u * u * e;
}

function faunaResetOctopus(c: Ctx, g: G, pIn: Pal, giant: boolean): void {
  const p = speciesHue(pIn, giant ? '#a83f2d' : '#a86456');
  const r = mulberry32(((g.seed as number) ^ (giant ? 0x0C701 : 0x0C702)) >>> 0);
  const cx = S * 0.50, mantleY = S * 0.33, mw = S * (giant ? 0.17 : 0.145), mh = S * (giant ? 0.19 : 0.165);
  const baseY = mantleY + mh * 0.70;
  ground(c, cx, S * 0.88, S * (giant ? 0.34 : 0.29));
  const armTips = [-0.95, -0.70, -0.44, -0.17, 0.17, 0.44, 0.70, 0.95];
  /* Eight filled tapered ribbons, each rooted under the eye shelf. Their
     unequal lengths and alternating bends keep all eight separable at 132px. */
  for (let i = 0; i < 8; i++) {
    const side = armTips[i]!;
    const x0 = cx + side * mw * 0.62, y0 = baseY;
    const len = S * ((giant ? 0.34 : 0.29) + (i % 3) * 0.035 + r() * 0.018);
    const x3 = cx + side * S * (0.30 + Math.abs(side) * 0.10) + (i % 2 ? 16 : -16);
    const y3 = baseY + len * (0.84 + (i % 2) * 0.10);
    const x1 = x0 + side * len * 0.28, y1 = baseY + len * 0.22;
    const x2 = x3 - side * len * (0.12 + (i % 2) * 0.12), y2 = baseY + len * 0.66;
    const leftPts: Array<[number, number]> = [], rightPts: Array<[number, number]> = [];
    for (let k = 0; k <= 24; k++) {
      const u = k / 24;
      const x = sampleBezier(x0, x1, x2, x3, u), y = sampleBezier(y0, y1, y2, y3, u);
      const nx0 = sampleBezier(x0, x1, x2, x3, Math.min(1, u + 0.012));
      const ny0 = sampleBezier(y0, y1, y2, y3, Math.min(1, u + 0.012));
      const mag = Math.hypot(nx0 - x, ny0 - y) || 1, nx = -(ny0 - y) / mag, ny = (nx0 - x) / mag;
      const w = (giant ? 15 : 12.5) * Math.pow(1 - u, 0.72) + 1.6;
      leftPts.push([x + nx * w, y + ny * w]); rightPts.push([x - nx * w, y - ny * w]);
    }
    const arm = c.createLinearGradient(x0, y0, x3, y3); arm.addColorStop(0, i % 2 ? p.lit : p.base); arm.addColorStop(0.62, p.base); arm.addColorStop(1, p.dark);
    c.fillStyle = arm; c.beginPath(); leftPts.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y));
    for (let k = rightPts.length - 1; k >= 0; k--) c.lineTo(rightPts[k]![0], rightPts[k]![1]); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(79,33,30,0.76)'; c.lineWidth = 2.2; c.stroke();
    /* Two alternating sucker rows ride the inner arm surface. */
    c.fillStyle = 'rgba(250,229,203,0.88)'; c.strokeStyle = 'rgba(113,57,49,0.72)'; c.lineWidth = 1.1;
    for (let k = 4; k <= 19; k += 3) {
      const u = k / 24, x = sampleBezier(x0, x1, x2, x3, u), y = sampleBezier(y0, y1, y2, y3, u);
      const dx = sampleBezier(x0, x1, x2, x3, Math.min(1, u + 0.012)) - x;
      const dy = sampleBezier(y0, y1, y2, y3, Math.min(1, u + 0.012)) - y;
      const mag = Math.hypot(dx, dy) || 1, nx = -dy / mag, ny = dx / mag;
      for (const sideRow of [-1, 1] as const) {
        const q = Math.max(2.4, (giant ? 5.0 : 4.2) * (1 - u * 0.62));
        c.beginPath(); c.arc(x + nx * sideRow * q * 0.95, y + ny * sideRow * q * 0.95, q, 0, TAU); c.fill(); c.stroke();
      }
    }
  }
  /* A continuous arm crown bridges every root into the head volume. */
  c.fillStyle = p.dark; c.beginPath(); c.ellipse(cx, baseY + 10, mw * 0.92, mh * 0.42, 0, 0, TAU); c.fill();
  /* Bag-like mantle above the eyes; no lateral fin skirt on octopuses. */
  const mantle = c.createRadialGradient(cx - mw * 0.36, mantleY - mh * 0.40, 4, cx, mantleY, mw * 1.35);
  mantle.addColorStop(0, p.lit); mantle.addColorStop(0.58, p.base); mantle.addColorStop(1, p.dark);
  c.fillStyle = mantle; c.beginPath(); c.moveTo(cx - mw * 0.88, baseY - 5);
  c.bezierCurveTo(cx - mw * 1.06, mantleY - mh * 0.40, cx - mw * 0.55, mantleY - mh * 1.06, cx, mantleY - mh * 1.13);
  c.bezierCurveTo(cx + mw * 0.55, mantleY - mh * 1.06, cx + mw * 1.06, mantleY - mh * 0.40, cx + mw * 0.88, baseY - 5);
  c.quadraticCurveTo(cx, baseY + 22, cx - mw * 0.88, baseY - 5); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(235,214,205,0.48)'; c.lineWidth = 3; c.stroke();
  /* Eye shelf sits below the mantle where the arms attach. */
  c.fillStyle = p.base; c.beginPath(); c.ellipse(cx, baseY - 2, mw * 0.82, mh * 0.32, 0, 0, TAU); c.fill();
  for (const side of [-1, 1] as const) {
    const ex = cx + side * mw * 0.48, ey = baseY - 6;
    c.fillStyle = '#dfc98f'; c.beginPath(); c.ellipse(ex, ey, 16, 12, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(65,39,32,0.86)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#14171b'; c.beginPath(); c.roundRect(ex - 10, ey - 2.8, 20, 5.6, 2.8); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.76)'; c.beginPath(); c.arc(ex - 5, ey - 4, 2.2, 0, TAU); c.fill();
  }
}

/* Named wrappers keep morphology tags outside FAUNA_NAME's route literal.
   overridecheck deliberately treats every top-level string in a route table as
   a candidate species key, so inline string options would be false dead routes. */
function faunaResetCaddisfly(c: Ctx, g: G, p: Pal): void { faunaResetWingedInsect(c, g, p, 'caddisfly'); }
function faunaResetDobsonfly(c: Ctx, g: G, p: Pal): void { faunaResetWingedInsect(c, g, p, 'dobsonfly'); }
function faunaResetMayfly(c: Ctx, g: G, p: Pal): void { faunaResetWingedInsect(c, g, p, 'mayfly'); }
function faunaResetScorpionfly(c: Ctx, g: G, p: Pal): void { faunaResetWingedInsect(c, g, p, 'scorpionfly'); }
function faunaResetStonefly(c: Ctx, g: G, p: Pal): void { faunaResetWingedInsect(c, g, p, 'stonefly'); }
function faunaResetCarrionBeetle(c: Ctx, g: G, p: Pal): void { faunaResetBeetle(c, g, p, 'carrion'); }
function faunaResetDivingBeetle(c: Ctx, g: G, p: Pal): void { faunaResetBeetle(c, g, p, 'diving'); }
function faunaResetDungBeetle(c: Ctx, g: G, p: Pal): void { faunaResetBeetle(c, g, p, 'dung'); }
function faunaResetFirefly(c: Ctx, g: G, p: Pal): void { faunaResetBeetle(c, g, p, 'firefly'); }
function faunaResetLadybug(c: Ctx, g: G, p: Pal): void { faunaResetBeetle(c, g, p, 'ladybug'); }
function faunaResetWaterBeetle(c: Ctx, g: G, p: Pal): void { faunaResetBeetle(c, g, p, 'water'); }
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
/* ★ WAVE 50 — THIS PAINTER TOOK NO SPEC AT ALL. Flounder and Halibut were one
   fixed picture with a palette swap, which is D-ART-143's constant-painter
   defect on EARTH species rather than procedural ones. artlock's new [SHAPE]
   tier scores them at 0.00 — byte-identical silhouettes — and both were FAIL in
   gold pass 2, independently called "a speckled potato" and "a potato or a
   cartoon spore with a face". Nick's engine measured the same pair at
   silhouette similarity 1.0000 without seeing either verdict.
   ⚠ The old fringe was 46 STRAIGHT RADIAL SPOKES sticking out past the outline
   — the "bristles" both judges reported. A flatfish's dorsal and anal fins are
   a continuous MEMBRANE running the whole rim, not a fence. It also had NO
   TAIL, which is most of why it read as a spore rather than a fish.
   ⚠ THIS COMMENT LIVES OUTSIDE THE PARAMETER LIST ON PURPOSE. Inside it, the
   word "named" in the prose made `artaudit`'s /\(([^)]*name[^)]*)\)/ believe
   the painter takes a `name` argument, and the gate failed the build on a
   sentence. D-ART-144 already says it: strip comments before reading a block,
   because a scanner that reads prose will eventually believe it. The scanner
   is fixed too — but keep painter docs above the signature regardless. */
export function faunaFlatfish(c: Ctx, g: G, p: Pal, opts: {
  elong?: number;    /* 1 = the flounder's rounded diamond, 1.5 = halibut */
  blotch?: number;   /* mottling density: a flounder is camouflaged, a halibut plain */
} = {}): void {
  const r = mulberry32(((g.seed as number) ^ 0xF1A7) >>> 0);
  const el = opts.elong ?? 1;
  const cx = S * 0.5, cy = S * 0.54, w = S * 0.25 * el, h = S * 0.175 / Math.sqrt(el);
  ground(c, cx, cy + h + 10, S * 0.26);
  /* the fin MEMBRANE first, behind the body: one soft lobe following the rim */
  c.fillStyle = `rgba(${p.cr * 0.86 | 0},${p.cg * 0.86 | 0},${p.cb * 0.90 | 0},0.62)`;
  c.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * TAU;
    /* the fin is deepest along the top and bottom and pinches at the ends,
       which is what makes the outline read as a fish and not as a disc */
    const swell = 1 + 0.19 * Math.abs(Math.sin(a)) - 0.06 * Math.abs(Math.cos(a));
    const x = cx + Math.cos(a) * w * swell, y = cy + Math.sin(a) * h * swell;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath(); c.fill();
  /* the fin RAYS as internal lines on that membrane — never past its edge */
  c.strokeStyle = 'rgba(226,236,252,0.24)'; c.lineWidth = 1.3;
  for (let i = 0; i < 54; i++) {
    const a = (i / 54) * TAU, s2 = Math.abs(Math.sin(a));
    if (s2 < 0.35) continue;                       /* no rays on the head/tail ends */
    const swell = 1 + 0.19 * s2 - 0.06 * Math.abs(Math.cos(a));
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * w * 0.97, cy + Math.sin(a) * h * 0.97);
    c.lineTo(cx + Math.cos(a) * w * swell * 0.97, cy + Math.sin(a) * h * swell * 0.97);
    c.stroke();
  }
  /* the caudal fin — the old painter had NO TAIL, which is most of why it read
     as a spore rather than as a fish */
  c.fillStyle = `rgba(${p.cr * 0.80 | 0},${p.cg * 0.80 | 0},${p.cb * 0.84 | 0},0.80)`;
  c.beginPath();
  c.moveTo(cx + w * 0.92, cy - h * 0.16);
  c.quadraticCurveTo(cx + w * 1.30, cy - h * 0.52, cx + w * 1.38, cy - h * 0.30);
  c.quadraticCurveTo(cx + w * 1.30, cy, cx + w * 1.38, cy + h * 0.30);
  c.quadraticCurveTo(cx + w * 1.30, cy + h * 0.52, cx + w * 0.92, cy + h * 0.16);
  c.closePath(); c.fill();
  c.fillStyle = bodyGrad(c, p, cx, cy, w);
  c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, w, h, 0, 0, TAU), 2);
  c.fillStyle = 'rgba(0,0,0,0.16)';
  const nb = Math.round(26 * (opts.blotch ?? 1));
  for (let i = 0; i < nb; i++) { const a = r() * TAU, d = Math.pow(r(), 0.5); c.beginPath(); c.arc(cx + Math.cos(a) * w * d * 0.9, cy + Math.sin(a) * h * d * 0.9, 3 + r() * 5, 0, TAU); c.fill(); }
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
  /* ★ WAVE 62 — the rays fan where a lionfish's fins ARE: a dorsal crown over
     the back and a pectoral fan sweeping down-and-back. gp5 failed it for
     quills "radiating in every direction — forward, back" over the face. */
  const ray = (a: number, len: number, i: number): void => {
    c.strokeStyle = i % 2 ? 'rgba(240,226,214,0.75)' : `rgba(${p.cr},${p.cg},${p.cb},0.8)`;
    c.lineWidth = 3.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.6 - 6, cx + Math.cos(a) * len, cy + Math.sin(a) * len); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * len * 0.35, cy + Math.sin(a) * len * 0.35); c.lineTo(cx + Math.cos(a) * len * 0.85, cy + Math.sin(a) * len * 0.85); c.stroke();
  };
  for (let i = 0; i < 11; i++) ray(-2.45 + (i / 10) * 1.9, S * (0.17 + r() * 0.10), i);   /* the dorsal crown */
  for (let i = 0; i < 6; i++) ray(0.55 + (i / 5) * 1.45, S * (0.15 + r() * 0.08), i);     /* the pectoral fan */
  c.fillStyle = bodyGrad(c, p, cx, cy, w);
  c.beginPath(); c.ellipse(cx, cy, w, h, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, w, h, 0, -2.8, 0.4), 2);
  c.fillStyle = 'rgba(28,18,14,0.6)';   /* the bold bands */
  for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(cx - w * 0.7 + i * w * 0.36, cy, w * 0.07, h * 0.95, 0, 0, TAU); c.fill(); }
  eye(c, cx - w * 0.66, cy - h * 0.25, 5.5);
}
/** CEPHALOPOD: mantle + fin skirt + eight arms (+2 feeding tentacles) */
export function faunaCephalopod(c: Ctx, g: G, pIn: Pal, opts: { squid: boolean; hue?: string }): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  const r = mulberry32(((g.seed as number) ^ 0xCEFA) >>> 0);
  const cx = S * 0.5, my = opts.squid ? S * 0.34 : S * 0.36;
  const mw = S * (opts.squid ? 0.11 : 0.15), mh = S * (opts.squid ? 0.20 : 0.16);
  ground(c, cx, S * 0.84, S * 0.2);
  /* ★ ARMS THAT TAPER AND CURL. They were single bezier strokes of constant
     width, so an octopus read as a STOOL — eight rigid legs under a dome.
     A cephalopod arm is thick where it leaves the mantle, tapers the whole
     way, and CURLS at the tip; drawn as a walk of short segments with a
     shrinking width, that reads as boneless muscle instead of furniture. */
  const arms = 8;
  for (let i = 0; i < arms; i++) {
    const t2 = i / (arms - 1);
    const ax = cx + (t2 - 0.5) * mw * 1.9;
    const outward = (t2 - 0.5) * 2;                       /* -1 … 1 */
    const len = S * (0.28 + r() * 0.14);   /* arms out-reach the mantle */
    const curl = (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.9);
    const w0 = 10 - Math.abs(outward) * 3;
    c.lineCap = 'round';
    let px = ax, py = my + mh * 0.62;
    const N = 16;
    for (let k = 1; k <= N; k++) {
      const u = k / N;
      /* spread out, then hook — the tip curls back on itself */
      const nx = ax + outward * len * 0.95 * u + Math.sin(u * 2.6) * curl * len * 0.26;
      const ny = my + mh * 0.62 + len * u * (1.05 - 0.25 * u * u);
      c.strokeStyle = i % 2 ? p.base : p.dark;
      c.lineWidth = Math.max(1.4, w0 * (1 - u * 0.88));   /* the taper */
      c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
      if (k % 3 === 0 && u < 0.8) {                        /* the sucker row */
        c.fillStyle = 'rgba(255,250,240,0.30)';
        c.beginPath(); c.arc(nx, ny, Math.max(1, w0 * (1 - u) * 0.20), 0, TAU); c.fill();
      }
      px = nx; py = ny;
    }
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
  /* mantle — ★ POLISH: a squid's is a TORPEDO tapering to a point, not an egg */
  c.fillStyle = bodyGrad(c, p, cx, my, mw * 1.4);
  if (opts.squid) {
    c.beginPath();
    c.moveTo(cx - mw, my + mh * 0.55);
    c.quadraticCurveTo(cx - mw * 0.9, my - mh * 0.5, cx, my - mh * 1.25);   /* the pointed tip */
    c.quadraticCurveTo(cx + mw * 0.9, my - mh * 0.5, cx + mw, my + mh * 0.55);
    c.quadraticCurveTo(cx, my + mh * 1.02, cx - mw, my + mh * 0.55);
    c.closePath(); c.fill();
  } else {
    c.beginPath(); c.ellipse(cx, my, mw, mh, 0, 0, TAU); c.fill();
  }
  rim(c, () => c.ellipse(cx, my, mw, mh, 0, -2.8, 0.35), 2.2);
  /* the lateral fin skirt */
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.45)`;
  for (const s of [-1, 1] as const) {
    c.beginPath();
    if (opts.squid) { c.moveTo(cx + s * mw * 0.7, my - mh * 0.72); c.quadraticCurveTo(cx + s * mw * 2.3, my - mh * 0.5, cx + s * mw * 0.75, my - mh * 0.05); }
    else { c.moveTo(cx + s * mw * 0.85, my - mh * 0.55); c.quadraticCurveTo(cx + s * mw * 1.7, my, cx + s * mw * 0.85, my + mh * 0.62); }
    c.closePath(); c.fill();
  }
  /* ★ POLISH — the eyes sit in raised BUMPS on the mantle's lower sides (an
     octopus's eyes protrude; drawn floating inside the bulb they read as spots) */
  for (const s of [-1, 1] as const) {
    c.fillStyle = bodyGrad(c, p, cx + s * mw * 0.55, my + mh * 0.55, 12);
    c.beginPath(); c.arc(cx + s * mw * 0.55, my + mh * 0.58, 11, 0, TAU); c.fill();
  }
  eye(c, cx - mw * 0.55, my + mh * 0.58, 8); eye(c, cx + mw * 0.55, my + mh * 0.58, 8);
}
/** CETACEAN: long body, horizontal FLUKE, blowhole, species dorsal */
export function faunaCetacean(c: Ctx, g: G, pIn: Pal, opts: { dorsal: 'tall' | 'small' | 'none'; blunt: boolean; hue?: [number, number, number];
    bulk?: number; long?: number; melon?: number; tusk?: boolean; patch?: boolean;
    beak?: boolean; throatGrooves?: boolean; knuckles?: boolean; callosities?: boolean;
    archedJaw?: boolean; squareHead?: boolean; frontBlowhole?: boolean; throatPatch?: boolean; forwardDorsal?: boolean;
    /** A card-scale, flattened paired tail for dolphins, never a fish caudal fin. */
    horizontalFlukes?: boolean;
    pale?: boolean /* ★ POLISH — beluga: the body stays WHITE to the tail */ }): void {
  /* NO CETACEAN IS PURPLE. Every whale, dolphin and porpoise alive is some
     grey, blue-grey or black, and a lavender blue whale is not rarity
     variation — it is the animal being unrecognisable. Anchored toward slate,
     with enough of the roll surviving to keep the family apart. */
  const _cn = ((g.seed as number) >>> 3) & 255;
  const _ck = opts.patch ? 0.97 : 0.78;   /* ★ D-ART-129 — see the note below */
  const _hue = opts.hue ?? [82 + (_cn % 28), 90 + (_cn % 24), 104 + (_cn % 32)];
  /* ★ D-ART-129 — an orca is BLACK AND WHITE and that is the entire animal.
     Its row asked for [26,28,34] and it rendered mid-TEAL, because the shared
     mix keeps 22% of the rarity roll — fine for a grey whale, wrong for the one
     cetacean whose colour is its name. `patch` says colour IS identity here. */
  const _ar = _hue[0], _ag = _hue[1], _ab = _hue[2];
  const _cr = pIn.cr + (_ar - pIn.cr) * _ck;
  const _cg = pIn.cg + (_ag - pIn.cg) * _ck;
  const _cb = pIn.cb + (_ab - pIn.cb) * _ck;
  const rgbOf = (a: number, b: number, d: number): string =>
    'rgb(' + (a | 0) + ',' + (b | 0) + ',' + (d | 0) + ')';
  const p: Pal = {
    cr: _cr, cg: _cg, cb: _cb,
    base: rgbOf(_cr, _cg, _cb),
    lit: rgbOf(Math.min(255, _cr * 1.32), Math.min(255, _cg * 1.30), Math.min(255, _cb * 1.26)),
    dark: opts.pale ? rgbOf(_cr * 0.82, _cg * 0.83, _cb * 0.85) : rgbOf(_cr * 0.42, _cg * 0.44, _cb * 0.48),
  };
  /* bulk = how deep the body is, long = how far it runs, melon = how much the
     forehead swells over the rostrum. Between them these are the difference
     between a right whale, a blue whale and a pilot whale. */
  const cx = S * 0.5, cy = S * 0.5;
  const L = S * 0.34 * (opts.long ?? 1), H = S * 0.10 * (opts.bulk ?? 1);
  const mel = opts.melon ?? 0;
  const head = cx - L, tail = cx + L;
  /* ★ WAVE 62 — THE BODY ENDS IN A PEDUNCLE, NOT A POINT. The old path ran to
     (tail, cy) — a zero-height vertex — so the rear half tapered to a hairline
     and "simply stopped" (gp5 called the Orca a broken render). The body now
     narrows to a REAL caudal peduncle at ~22% of body depth, and the flukes
     grow from it, scaled to the animal instead of fixed pixels. */
  const ped = H * 0.22;
  c.fillStyle = bodyGrad(c, p, cx - L * 0.3, cy, L * 0.7);
  c.beginPath();
  c.moveTo(head, cy + (opts.blunt ? H * 0.3 : 0));
  c.quadraticCurveTo(cx - L * (0.5 + mel * 0.28), cy - H * ((opts.blunt ? 1.5 : 1.15) + mel * 0.85), cx + L * 0.2, cy - H * 0.75);
  c.quadraticCurveTo(tail - L * 0.16, cy - H * 0.42, tail, cy - ped);
  c.lineTo(tail, cy + ped);
  c.quadraticCurveTo(tail - L * 0.16, cy + H * 0.48, cx + L * 0.2, cy + H * 0.85);
  c.quadraticCurveTo(cx - L * 0.5, cy + H * 1.05, head, cy + (opts.blunt ? H * 0.3 : 0));
  c.closePath(); c.fill();
  if (opts.squareHead) {
    /* The sperm-whale head is a block with a low underslung jaw, not a fish nose. */
    c.fillStyle = p.base;
    c.beginPath();
    c.moveTo(head - L * 0.24, cy - H * 0.78); c.lineTo(head + L * 0.34, cy - H * 0.94);
    c.lineTo(head + L * 0.42, cy + H * 0.24); c.lineTo(head - L * 0.16, cy + H * 0.36);
    c.closePath(); c.fill();
    c.fillStyle = p.dark;
    c.beginPath(); c.moveTo(head - L * 0.14, cy + H * 0.36); c.lineTo(head + L * 0.42, cy + H * 0.24);
    c.lineTo(head + L * 0.28, cy + H * 0.62); c.lineTo(head - L * 0.04, cy + H * 0.58); c.closePath(); c.fill();
  }
  if (opts.beak) {
    /* A dolphin's short rostrum must break the front silhouette. */
    c.fillStyle = p.base;
    c.beginPath(); c.moveTo(head + L * 0.20, cy - H * 0.30);
    c.lineTo(head - L * 0.52, cy - H * 0.10); c.lineTo(head - L * 0.52, cy + H * 0.08);
    c.lineTo(head + L * 0.18, cy + H * 0.22); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(22,30,36,0.46)'; c.lineWidth = Math.max(1.6, H * 0.10);
    c.beginPath(); c.moveTo(head - L * 0.48, cy + H * 0.08); c.quadraticCurveTo(head - L * 0.10, cy + H * 0.22, head + L * 0.20, cy + H * 0.20); c.stroke();
  }
  rim(c, () => { c.moveTo(head, cy); c.quadraticCurveTo(cx - L * (0.5 + mel * 0.28), cy - H * ((opts.blunt ? 1.5 : 1.15) + mel * 0.85), cx + L * 0.2, cy - H * 0.75); c.quadraticCurveTo(tail - L * 0.16, cy - H * 0.42, tail, cy - ped); }, 2.4);
  /* THE HORIZONTAL FLUKE — never a vertical fish tail. Scaled to the body. */
  /* Preserve the existing shared fluke for controls. Dolphin gets a shallow,
     visibly split horizontal paddle instead of the old tall fish-tail diamond. */
  if (opts.horizontalFlukes) {
    const fw = Math.max(L * 0.66, H * 4.0), fh = Math.max(H * 0.42, L * 0.060);
    /* Two shallow leaves have much more lateral than vertical reach.  They
       remain visibly separate at native size, so the tail cannot read as a
       fish's tall caudal fin. */
    for (const s of [-1, 1] as const) {
      c.fillStyle = p.dark;
      c.beginPath(); c.moveTo(tail - L * 0.025, cy + s * ped * 0.18);
      c.quadraticCurveTo(tail + fw * 0.18, cy + s * fh * 1.02, tail + fw * 0.64, cy + s * fh * 0.76);
      c.quadraticCurveTo(tail + fw * 1.04, cy + s * fh * 0.44, tail + fw * 1.10, cy + s * fh * 0.08);
      c.quadraticCurveTo(tail + fw * 0.58, cy + s * fh * 0.05, tail - L * 0.025, cy + s * ped * 0.18);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(205,216,220,0.54)'; c.lineWidth = Math.max(1.4, fh * 0.18); c.lineCap = 'round';
      c.beginPath(); c.moveTo(tail + fw * 0.10, cy + s * fh * 0.38); c.quadraticCurveTo(tail + fw * 0.56, cy + s * fh * 0.82, tail + fw * 0.99, cy + s * fh * 0.14); c.stroke();
    }
  } else {
    const fw = Math.max(L * 0.22, H * 1.2), fh = Math.max(H * 0.9, L * 0.12);
    c.fillStyle = p.dark;
    c.beginPath(); c.moveTo(tail - 2, cy - ped);
    c.quadraticCurveTo(tail + fw * 0.5, cy - fh, tail + fw, cy - fh * 0.62);
    c.quadraticCurveTo(tail + fw * 0.55, cy, tail + fw, cy + fh * 0.62);
    c.quadraticCurveTo(tail + fw * 0.5, cy + fh, tail - 2, cy + ped);
    c.closePath(); c.fill();
  }
  if (opts.dorsal !== 'none') {
    c.fillStyle = p.dark;
    if (opts.dorsal === 'tall') {
      /* ★ the orca's TALL TRIANGULAR blade — nearly erect, its own height class */
      c.beginPath(); c.moveTo(cx + L * 0.02, cy - H * 0.78);
      c.lineTo(cx + L * 0.14, cy - H * 0.8 - H * 2.3);
      c.quadraticCurveTo(cx + L * 0.2, cy - H * 1.4, cx + L * 0.34, cy - H * 0.70);
      c.closePath(); c.fill();
    } else {
      /* the sickle: swept back with a concave trailing edge (dolphin/pilot) */
      c.beginPath(); c.moveTo(cx + L * 0.04, cy - H * 0.78);
      c.quadraticCurveTo(cx + L * 0.12, cy - H * 0.8 - H * 1.15, cx + L * 0.30, cy - H * 0.9);
      c.quadraticCurveTo(cx + L * 0.2, cy - H * 0.95, cx + L * 0.34, cy - H * 0.70);
      c.closePath(); c.fill();
    }
  }
  if (opts.forwardDorsal) {
    c.fillStyle = p.dark;
    c.beginPath(); c.moveTo(cx - L * 0.18, cy - H * 0.72);
    c.quadraticCurveTo(cx - L * 0.06, cy - H * 2.05, cx + L * 0.08, cy - H * 0.78);
    c.closePath(); c.fill();
  }
  c.fillStyle = p.dark;   /* pectoral flipper */
  c.beginPath(); c.ellipse(cx - L * 0.3, cy + H * 0.85, L * 0.20, H * 0.28, 0.5, 0, TAU); c.fill();
  /* ★ D-ART-124 — THE NARWHAL'S TUSK, restored. It was lost when the species
     was rerouted onto the shared cetacean painter, whose options carry no tusk
     — so the animal kept its silhouette and lost the ONE feature anybody
     identifies it by. The audit called it correctly as a regression. */
  if (opts.throatGrooves) {
    c.strokeStyle = 'rgba(38,48,60,0.52)'; c.lineWidth = Math.max(1.5, H * 0.09); c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const x = head + L * (0.20 + i * 0.095);
      c.beginPath(); c.moveTo(x, cy + H * 0.36); c.quadraticCurveTo(x - L * 0.03, cy + H * 0.72, x + L * 0.03, cy + H * 0.96); c.stroke();
    }
  }
  if (opts.knuckles) {
    c.fillStyle = 'rgba(178,170,154,0.88)';
    for (let i = 0; i < 5; i++) {
      const x = head + L * (0.34 + i * 0.17), y = cy - H * (0.98 - (i % 2) * 0.15);
      c.beginPath(); c.ellipse(x, y, H * 0.20, H * 0.15, -0.22, 0, TAU); c.fill();
    }
  }
  if (opts.callosities) {
    c.fillStyle = 'rgba(235,225,194,0.92)';
    for (const [u, v, sc] of [[0.08, -0.28, 0.28], [0.22, -0.72, 0.22], [0.36, -0.88, 0.18], [0.18, 0.36, 0.16]] as const) {
      c.beginPath(); c.ellipse(head + L * u, cy + H * v, H * sc * 1.25, H * sc, -0.18, 0, TAU); c.fill();
    }
  }
  if (opts.archedJaw) {
    c.strokeStyle = 'rgba(224,218,202,0.92)'; c.lineWidth = Math.max(2.4, H * 0.18); c.lineCap = 'round';
    c.beginPath(); c.moveTo(head - L * 0.04, cy + H * 0.38);
    c.quadraticCurveTo(head + L * 0.28, cy + H * 1.15, head + L * 0.76, cy + H * 0.70); c.stroke();
  }
  if (opts.throatPatch) {
    c.fillStyle = 'rgba(220,224,214,0.92)';
    c.beginPath(); c.moveTo(head + L * 0.18, cy + H * 0.30);
    c.lineTo(head + L * 0.48, cy + H * 0.88); c.lineTo(head + L * 0.72, cy + H * 0.54);
    c.lineTo(head + L * 0.42, cy + H * 0.18); c.closePath(); c.fill();
  }
  if (opts.tusk) {
    const tl = L * 0.92, ty = cy - H * 0.34;
    const tg = c.createLinearGradient(head, ty, head - tl, ty);
    tg.addColorStop(0, '#efeadb'); tg.addColorStop(1, '#cfc6ad');
    c.fillStyle = tg;
    c.beginPath();
    c.moveTo(head - 2, ty - H * 0.13);
    c.lineTo(head - tl, ty - H * 0.012);
    c.lineTo(head - tl, ty + H * 0.012);
    c.lineTo(head - 2, ty + H * 0.13);
    c.closePath(); c.fill();
    /* the spiral: shallow diagonals down its length, the reason it reads as a
       narwhal's tusk and not as a swordfish's bill */
    c.strokeStyle = 'rgba(96,84,58,0.75)'; c.lineWidth = 2.2;
    for (let i = 1; i <= 7; i++) {
      const u = i / 8, x = head - tl * u, hh = H * (0.13 - 0.118 * u);
      c.beginPath(); c.moveTo(x + tl * 0.05, ty - hh); c.lineTo(x - tl * 0.02, ty + hh); c.stroke();
    }
  }
  if (opts.patch) {
    /* the eye patch, the ventral field and the saddle — without these an orca
       is just a dark dolphin */
    c.fillStyle = 'rgba(248,250,252,0.95)';
    c.beginPath(); c.ellipse(head + L * 0.30, cy - H * 0.30, L * 0.11, H * 0.20, -0.22, 0, TAU); c.fill();
    c.beginPath();
    c.moveTo(head + L * 0.16, cy + H * 0.42);
    c.quadraticCurveTo(cx, cy + H * 1.06, cx + L * 0.62, cy + H * 0.52);
    c.quadraticCurveTo(cx, cy + H * 0.60, head + L * 0.16, cy + H * 0.42);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(150,162,172,0.45)';   /* the grey saddle behind the fin */
    c.beginPath(); c.ellipse(cx + L * 0.18, cy - H * 0.44, L * 0.20, H * 0.24, 0.1, 0, TAU); c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.5)';   /* blowhole */
  c.beginPath(); c.ellipse(cx - L * 0.62, cy - H * 0.92, 5, 3, 0, 0, TAU); c.fill();
  if (opts.frontBlowhole) {
    c.fillStyle = 'rgba(230,230,220,0.84)';
    c.beginPath(); c.ellipse(head + L * 0.08, cy - H * 0.92, Math.max(3, H * 0.16), Math.max(2, H * 0.09), -0.25, 0, TAU); c.fill();
  }
  eye(c, head + L * 0.22, cy + H * 0.1, 5);
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 2;   /* the jawline */
  c.beginPath(); c.moveTo(head + 4, cy + H * 0.35); c.quadraticCurveTo(cx - L * 0.55, cy + H * 0.6, cx - L * 0.28, cy + H * 0.62); c.stroke();
}

/* ---------------- the wing that the whole catalog lacked ---------------- */
/** BIRD with a real folded wing, species bill and leg length */
export interface BirdSpec {
  legs: number;
  bill: 'hook' | 'long' | 'spoon' | 'stout' | 'huge' | 'short' | 'chisel' | 'needle' | 'duck' | 'cone' | 'fine'
    /* wave 38 G6 — the two bills that were sharing one asset */
    | 'toucan' | 'casque'
    /* ★ WAVE 59 — the WADER bills: a very long straight probe (snipe, godwit,
       stork), a long downcurve (curlew, ibis) and a long upcurve (avocet). */
    | 'probe' | 'downcurve' | 'upcurve';
  crest?: boolean;
  /** split crown fans, rather than the single narrow crest used by cranes and hoatzin */
  doubleCrest?: boolean;
  flightless?: boolean;
  /* ★ POLISH — the emu's double-shafted HAIR-LIKE coat: loose strands that
     droop off the body and hang past the belly line, so the bird reads
     shaggy rather than sleek. Off by default (D-ART-14). */
  shaggy?: boolean;
  /* ── wave 9 additions. All OPTIONAL and defaulted, so the wave-3 birds —
     which the reviews scored well — take exactly the code paths they took
     before (D-ART-14: never override what already excels). ── */
  size?: number;                                   /** body scale; a hummingbird is not an ostrich */
  neck?: 'short' | 'long' | 'swan' | 'none';
  tail?: 'short' | 'fan' | 'long' | 'forked' | 'square' | 'wedge' | 'shortFan' | 'sickle' | 'train';
  eyespots?: boolean;                              /** the peacock train */
  pearled?: boolean;                               /** wave 39 — guineafowl pearl spotting */
  cling?: boolean;                                 /** wave 40 — vertical trunk cling (woodpecker) */
  /* ★ WAVE 41, G6 — BILL AND LEG COLOUR. Both were hard-coded constants —
     '#e0b13c' in three bill branches and '#c9a24f' in two leg strokes — so
     EVERY bird in the catalogue wore the same yellow beak and yellow legs.
     The gold pass caught it as a class failure, not a species one: it breaks
     the Crow's 'all-black glossy plumage', the Chough's 'bright red legs and
     bill', and the Guillemot's 'dark bill', which are those birds' mustReads.
     A colour that is the identity has to come off the species row. */
  billHue?: string;
  legHue?: string;                               /** wave 39 — the guineafowl's white pearl spotting */
  owl?: boolean;                                   /** round head, facial disc, forward eyes */
  swim?: boolean;                                  /** rides a waterline; legs hidden */
  upright?: boolean;                               /** penguin/auk stance, flipper not wing */
  /** Stationary flight: no perch or legs, with fast blade-like wing strokes. */
  hover?: boolean;
  /* ── wave 21: the Platinum audit's bird findings, each "add <the one thing>" ── */
  wings?: 'soaring';                              /** wings so long they ARE the bird (albatross) */
  headMass?: number;                               /** an oversized head (kingfisher, kookaburra) */
  /* ── ★ D-ART-121 (wave 28) — THE LARGE BIRDS WERE ALL ONE BIRD.
     Eagle, Harpy Eagle, Vulture, Hoatzin, Macaw and Kakapo came back from the
     re-audit as the same plump ovoid with the same folded-wing panel and the
     same pointed tail wedge, separated by bill and colour alone. Two of these
     axes (`wings`, `headMass`) already existed and almost none of the rows set
     them; the rest are the features that actually tell these birds apart. */
  talons?: boolean;      /** curved claws + a heavy tarsus — a raptor grips */
  bald?: boolean;        /** bare head/neck skin and a ruff — a vulture */
  crop?: boolean;        /** the hoatzin's fermenting crop bulge at the neck base */
  wingClaw?: boolean;    /** the hoatzin's wing claw, the reason it is famous */
  parrotBill?: boolean;  /** deep, culmen curving well past the jawline, with a cere */
  zygo?: boolean;        /** two toes forward two back — a parrot grips a perch */
  /* ── ★ WAVE 8: THE FIELD MARKS. Seven songbirds — Sparrow, Finch, Robin,
     Tanager, Weaverbird, Starling, Lark — were separated by NOTHING but a
     size number differing by four percent, and the lock duly reported them
     as the same picture. That is D-ART-83 living in the bird table: a band
     instead of a species. What actually tells small birds apart in the field
     is colour first, then bill shape, then a mark on the face or breast —
     never body size. Each of these comes from the species reference row. ── */
  hue?: string;                                    /** species-true plumage; the first field mark */
  bib?: string;                                    /** a contrasting breast/throat patch (robin) */
  belly?: string;                                  /** a broad lower-body plumage field */
  breastBand?: string;                             /** a hard contrasting band above the belly */
  cap?: string;                                    /** a contrasting crown (chickadee, jay) */
  mask?: boolean;                                  /** the black face mask (cardinal, weaverbird) */
  nest?: boolean;                                  /** ★ WAVE 68 — the weaverbird's woven ball nest */
  tubeNostrils?: boolean;                          /** paired tube nostrils on procellariiform seabird bills */
  comb?: boolean;                                  /** ★ POLISH — the fleshy red serrated chicken comb */
  browComb?: boolean;                              /** ★ POLISH — the grouse/ptarmigan red wattle ABOVE the eye */
  brow?: boolean;                                  /** ★ GOLD AUDIT — the raptor's supraorbital ridge: the fierce hooded glare */
  featherFeet?: boolean;                           /** ★ POLISH — snowshoe-feathered toes: white fluff to the ground */
  speckle?: boolean;                               /** pale flecks over dark (starling) */
  streak?: boolean;                                /** streaky ground-bird camouflage (lark, pipit) */
  plump?: number;                                  /** roundness: a robin is a ball, a swift is a cigar */
  elong?: number;                                  /** body length against depth, from the reference aspect */
}
/** THE AVALANCHE. XOR-ing a small salt into a hash and dividing by 2^32
    perturbs only the lowest bits, so every "independent" variation axis
    collapsed to the same number and near-neighbour names produced
    near-identical animals. Mix the salt in with a large odd multiplier and
    scramble, so one bit of change rewrites the whole value. */
function mixSaltB(h: number, salt: number): number {
  let x = (h ^ Math.imul(salt | 1, 0x9E3779B1)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7FEB352D) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846CA68B) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x >>> 0;
}
export function faunaBird(c: Ctx, g: G, p: Pal, opts: BirdSpec, name = ''): void {
  /* NAME-SEEDED (D-ART-20): Hawk and Falcon carry identical options, and
     wave 7 proved that two labels sharing a spec eventually collide. */
  let h = 0xB12D;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  const r = mulberry32((((g.seed as number) ^ h) >>> 0));
  const nv = (salt: number, amt: number): number => 1 + (mixSaltB(h, salt) / 4294967296 - 0.5) * 2 * amt;

  /* ★ WAVE 8 — SPECIES-TRUE PLUMAGE. Colour is the FIRST field mark on a small
     bird and the engine had no way to say it, so a cardinal, a robin and a
     lark were the same grey shape at three sizes. Where the real bird's colour
     IS its identity the row names it; everything else keeps its rarity roll. */
  if (opts.hue) {
    const n0 = parseInt(opts.hue.slice(1), 16);
    const hr0 = (n0 >> 16) & 255, hg0 = (n0 >> 8) & 255, hb0 = n0 & 255;
    p = { base: opts.hue, cr: hr0, cg: hg0, cb: hb0,
      lit: `rgb(${Math.min(255, hr0 * 1.30) | 0},${Math.min(255, hg0 * 1.30) | 0},${Math.min(255, hb0 * 1.30) | 0})`,
      dark: `rgb(${(hr0 * 0.44) | 0},${(hg0 * 0.44) | 0},${(hb0 * 0.44) | 0})` };
  }
  /* ★ WAVE 8 — THE SMALL BIRDS WERE DRAWN AT THEIR REAL RELATIVE SIZE, which
     sounds right and is wrong for a PORTRAIT: a sparrow filled a seventh of
     its 440px frame and threw away the other six-sevenths, so the field marks
     that separate it from a finch were four pixels across. Relative scale is
     invisible anyway when each species is framed alone. The range is
     COMPRESSED, not flattened — an ostrich still out-sizes a hummingbird,
     but the hummingbird is now legible. */
  const sz = (0.55 + (opts.size ?? 1) * 0.62) * nv(0x11, 0.07);
  /* the body rides legLen ABOVE a fixed ground line, so a wader towers and a
     raptor squats — leg length is the species read (Flamingo vs Eagle) */
  const bx = S * 0.5, legLen = S * opts.legs, groundY = S * 0.80;
  /* a robin is a ball on legs and a swift is a cigar; the reference row's
     aspect says which, and nothing in this painter could express it before */
  const plump = opts.plump ?? 1, elong = opts.elong ?? 1;
  const bw = S * 0.15 * sz * (opts.upright ? 0.78 : 1) * elong * (opts.flightless ? 0.86 : 1);
  const bh = S * 0.12 * sz * (opts.upright ? 1.45 : 1) * plump * (opts.flightless ? 1.30 : 1);
  const by = groundY - legLen - bh - (opts.hover ? S * 0.13 : 0);
  /* ★ WAVE 40 — CLINGING. `faunaBird` draws one posture: a bird perched level
     on a ground line. A woodpecker is never in it — the row asks for a bird
     gripping a VERTICAL TRUNK, head up, braced back on a stiff tail — and the
     gold pass failed it on exactly that.
     The whole bird is rotated about its own body centre rather than each part
     being re-authored, which is the same move the quadruped pose uses: turn the
     frame, and every feature drawn inside it comes along. The trunk is drawn
     first, unrotated, so the bird grips something that is genuinely upright. */
  if (opts.cling) {
    const tw = S * 0.115;
    const tg = c.createLinearGradient(bx + S * 0.03 - tw, 0, bx + S * 0.03 + tw, 0);
    tg.addColorStop(0, '#2f251a'); tg.addColorStop(0.42, '#5b4632'); tg.addColorStop(1, '#241c14');
    c.fillStyle = tg;
    c.fillRect(bx + S * 0.03 - tw, 0, tw * 2, S);
    c.strokeStyle = 'rgba(20,15,10,0.34)'; c.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) {
      const xx = bx + S * 0.03 - tw + (i + 0.5) * (tw * 2 / 6);
      c.beginPath(); c.moveTo(xx, 0);
      c.bezierCurveTo(xx + 5, S * 0.34, xx - 5, S * 0.66, xx + 2, S); c.stroke();
    }
    c.save();
    /* ⚠ SIGN MATTERS HERE and I got it backwards first: this painter draws
       the bird facing LEFT, so a NEGATIVE rotation swings the head DOWN the
       trunk. Positive brings the head up and swings the tail down behind it,
       which is also exactly where a woodpecker's stiff tail braces. */
    c.translate(bx, by); c.rotate(1.16); c.translate(-bx, -by);
  } else if (opts.wings !== 'soaring' && !opts.hover) {
    /* ★ WAVE 67 — a SOARING bird is AIRBORNE: no ground shadow, no legs. gp3/5
       failed Albatross, Skua, Petrel and Snow Petrel for standing on yellow
       legs over a cast shadow while their rows specify the flying posture. */
    ground(c, bx, groundY + 4, S * 0.16 * sz);
  }

  /* legs — hidden on a swimming bird (waterline) and an airborne one */
  if (!opts.swim && !opts.hover && (opts.wings !== 'soaring' || opts.talons)) {
    /* THE BACKWARD ANKLE. A bird's visible joint is the ankle, not a knee,
       and it folds the opposite way to ours — on a flamingo, a heron or an
       ostrich that reversed bend IS the silhouette. Two straight strokes
       (which is what these were) throw the whole read away. The bird faces
       LEFT here, so "back" is +x. */
    const thighY = by + bh * 0.72;
    const ankleY = thighY + (groundY - thighY) * 0.52;
    for (const s of [-1, 1] as const) {
      const hipX = bx + s * 8 * sz;
      const ankX = hipX + (7 + legLen * 0.10) * sz;    /* the ankle kicks BACK */
      const toeX = hipX - 2 * sz;                       /* the foot lands under the bird */
      c.strokeStyle = opts.legHue ?? '#c9a24f'; c.lineCap = 'round';
      /* ★ D-ART-121 — a raptor's leg is HEAVY. The audit's words on the Harpy:
         "two thin yellow twigs ending in flat splayed toes with no claw tips
         at all" — on the bird whose grip is its defining feature. */
      const GRIP = opts.talons ? 2.6 : 1;
      c.lineWidth = (legLen > S * 0.10 ? 6.5 : 8) * Math.min(1.4, sz) * GRIP;   /* the drumstick */
      c.beginPath(); c.moveTo(hipX, thighY); c.quadraticCurveTo(hipX + (ankX - hipX) * 0.5, thighY + (ankleY - thighY) * 0.62, ankX, ankleY); c.stroke();
      c.lineWidth = (legLen > S * 0.10 ? 4 : 5.5) * Math.min(1.4, sz) * GRIP;   /* the shank is THIN */
      c.beginPath(); c.moveTo(ankX, ankleY); c.quadraticCurveTo(ankX + (toeX - ankX) * 0.55, ankleY + (groundY - ankleY) * 0.55, toeX, groundY); c.stroke();
      c.lineWidth = 3.4 * Math.min(1.4, sz) * GRIP;
      /* ZYGODACTYL: a parrot puts TWO toes back, not one, and that is most of
         why a macaw's foot does not look like an eagle's. */
      const fwd = opts.zygo ? [-1, 1] : [-1, 0, 1];
      for (const d of fwd) {
        c.beginPath(); c.moveTo(toeX, groundY);
        c.lineTo(toeX - (13 + d * 3) * sz, groundY + 4 + d * 2.4); c.stroke();
      }
      for (const d of (opts.zygo ? [-1, 1] : [0])) {
        c.beginPath(); c.moveTo(toeX, groundY);
        c.lineTo(toeX + (8 + Math.abs(d) * 3) * sz, groundY + 3 + d * 3); c.stroke();
      }
      if (opts.talons) {   /* the hooks — a curved dark claw off every toe */
        c.strokeStyle = '#2a2118'; c.lineWidth = 3.2 * Math.min(1.4, sz);
        for (const d of fwd) {
          const tipX = toeX - (13 + d * 3) * sz, tipY = groundY + 4 + d * 2.4;
          c.beginPath(); c.moveTo(tipX, tipY);
          c.quadraticCurveTo(tipX - 5 * sz, tipY + 2, tipX - 6 * sz, tipY + 7 * sz); c.stroke();
        }
        c.strokeStyle = opts.legHue ?? '#c9a24f';
      }
      if (opts.featherFeet) {
        /* ★ POLISH — the ptarmigan's snowshoe feet: the bare rod is buried
           under white fluff from thigh to toe-tip, drawn OVER the leg. */
        c.strokeStyle = 'rgba(240,238,230,0.92)'; c.lineCap = 'round';
        c.lineWidth = 9 * Math.min(1.4, sz);
        c.beginPath(); c.moveTo(hipX, thighY); c.quadraticCurveTo(hipX + (ankX - hipX) * 0.5, thighY + (ankleY - thighY) * 0.62, ankX, ankleY); c.stroke();
        c.lineWidth = 7 * Math.min(1.4, sz);
        c.beginPath(); c.moveTo(ankX, ankleY); c.quadraticCurveTo(ankX + (toeX - ankX) * 0.55, ankleY + (groundY - ankleY) * 0.55, toeX, groundY); c.stroke();
        c.lineWidth = 5.5 * Math.min(1.4, sz);
        for (const d of [-1, 0, 1]) {   /* the broad feathered toes */
          c.beginPath(); c.moveTo(toeX, groundY);
          c.lineTo(toeX - (14 + d * 3) * sz, groundY + 4 + d * 2.4); c.stroke();
        }
        c.strokeStyle = 'rgba(214,210,198,0.7)'; c.lineWidth = 1.3;   /* fluff wisps */
        for (let w = 0; w < 8; w++) {
          const u = w / 7, wx = hipX + (toeX - hipX) * u, wy = thighY + (groundY - thighY) * u;
          c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + 4 + (w % 3) * 2, wy + 5); c.stroke();
        }
      }
    }
  }

  /* ── the TAIL, behind the body ── */
  c.fillStyle = p.dark;
  const tail = opts.tail ?? 'short';
  if ((tail === 'fan' || tail === 'train') && opts.eyespots) {
    /* ★ WAVE 62 — THE PEACOCK'S TRAIN. The old fan was a handful of body-length
       feathers pointing back-down; gp5's verdict was "the train — the entire
       identity of a peacock — is not there". It is now what it is in life: a
       huge ERECT semicircular fan behind the whole bird, each feather ~2.6×
       the body, tipped with a blue-and-gold ocellus. */
    const train = tail === 'train';
    const rootX = bx + bw * 0.30, rootY = by + bh * 0.10;
    const R = bw * (train ? 3.3 : 2.6);
    for (let i = -6; i <= 6; i++) {
      const a = train ? 0.36 + i * 0.055 : -Math.PI / 2 + i * 0.145;
      c.save(); c.translate(rootX, rootY); c.rotate(a);
      const fg2 = c.createLinearGradient(0, 0, R, 0);
      fg2.addColorStop(0, 'rgba(20,70,60,0.9)'); fg2.addColorStop(1, 'rgba(40,120,90,0.85)');
      c.fillStyle = fg2;
      c.beginPath(); c.ellipse(R * 0.52, 0, R * 0.52, bh * 0.16, 0, 0, TAU); c.fill();
      /* the ocellus at the tip */
      c.fillStyle = '#123a4a'; c.beginPath(); c.arc(R * 0.88, 0, bh * 0.16, 0, TAU); c.fill();
      c.fillStyle = '#2b7f96'; c.beginPath(); c.arc(R * 0.88, 0, bh * 0.11, 0, TAU); c.fill();
      c.fillStyle = '#d8b43c'; c.beginPath(); c.arc(R * 0.88, 0, bh * 0.055, 0, TAU); c.fill();
      c.restore();
    }
  } else if (tail === 'shortFan') {
    /* A chicken's upright fan is short, layered, and visibly separate from a long gamebird tail. */
    for (let i = -2; i <= 2; i++) {
      c.save(); c.translate(bx + bw * 0.62, by + bh * 0.20); c.rotate(-0.72 + i * 0.24);
      c.fillStyle = i % 2 ? p.dark : p.base;
      c.beginPath(); c.ellipse(bw * 0.48, 0, bw * 0.50, bh * 0.13, 0, 0, TAU); c.fill(); c.restore();
    }
  } else if (tail === 'sickle') {
    /* Rooster sickles arch in a long pair instead of forming a straight blade. */
    c.strokeStyle = p.dark; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.lineWidth = bh * (0.15 - i * 0.025); c.beginPath();
      c.moveTo(bx + bw * (0.52 + i * 0.08), by + bh * (0.12 + i * 0.08));
      c.bezierCurveTo(bx + bw * 1.18, by - bh * (0.42 + i * 0.10), bx + bw * 1.82, by + bh * (0.18 + i * 0.10), bx + bw * 1.34, by + bh * (0.72 + i * 0.08)); c.stroke();
    }
  } else if (tail === 'square') {
    c.beginPath(); c.moveTo(bx + bw * 0.62, by + bh * 0.08); c.lineTo(bx + bw * 1.48, by + bh * 0.28);
    c.lineTo(bx + bw * 1.46, by + bh * 0.72); c.lineTo(bx + bw * 0.64, by + bh * 0.58); c.closePath(); c.fill();
  } else if (tail === 'wedge') {
    c.beginPath(); c.moveTo(bx + bw * 0.58, by + bh * 0.08); c.lineTo(bx + bw * 1.78, by + bh * 0.45);
    c.lineTo(bx + bw * 0.58, by + bh * 0.66); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(230,235,240,0.20)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(bx + bw * 0.72, by + bh * 0.17); c.lineTo(bx + bw * 1.60, by + bh * 0.45); c.stroke();
  } else if (tail === 'fan') {
    for (let i = -4; i <= 4; i++) {
      c.save(); c.translate(bx + bw * 0.66, by + bh * 0.24); c.rotate(i * 0.13 + 0.30);
      c.fillStyle = i % 2 ? p.dark : p.base;
      c.beginPath(); c.ellipse(bw * 0.85, 0, bw * 0.85, bh * 0.17, 0, 0, TAU); c.fill();
      c.restore();
    }
  } else if (tail === 'long') {
    /* ★ WAVE 38, G4 — THREE SEPARATE RODS WITH DAYLIGHT BETWEEN THEM. Reported
       verbatim as "a brown round bird with three sticks behind it" (Pheasant,
       whose verifier confirmed "three separate straight rods with visible gaps,
       not one long barred tapering tail"), and the same token carries Macaw,
       Parrot, Roadrunner, Magpie, Quetzal, Tropicbird and Rooster.
       A long tail is ONE overlapping layered surface. Drawn as a solid tapering
       blade with the feather splits and the cross-barring as INTERNAL lines, so
       there is no background showing between the feathers. */
    const rx = bx + bw * 0.62, ry = by + bh * 0.20;
    const tx = bx + bw * 2.85, ty = by + bh * 1.02;
    const blade = (spread: number, col: string, lenK: number): void => {
      const ex = rx + (tx - rx) * lenK, ey = ry + (ty - ry) * lenK;
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(rx, ry - bh * 0.15);
      c.quadraticCurveTo(bx + bw * 1.85 * lenK, by + bh * (0.34 - spread * 0.10), ex, ey - bh * spread);
      c.quadraticCurveTo(ex + bw * 0.05, ey + bh * 0.06, ex - bw * 0.10, ey + bh * (spread * 0.55));
      c.quadraticCurveTo(bx + bw * 1.85 * lenK, by + bh * (0.60 + spread * 0.16), rx, ry + bh * 0.20);
      c.closePath(); c.fill();
    };
    /* ⚠ two blades of equal length end in one blunt cut and read as a PLANK.
       A long tail is GRADUATED — the outer feathers are shorter — so the far
       blade stops short and the silhouette steps at the tip. */
    blade(0.56, p.dark, 0.74);
    blade(0.24, p.base, 1.0);
    /* the vanes, as splits in one surface rather than gaps between three */
    c.strokeStyle = 'rgba(28,22,16,0.30)'; c.lineWidth = Math.max(1, bh * 0.035); c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const k = i / 3;
      c.beginPath(); c.moveTo(rx + bw * 0.10, ry + bh * (0.02 + k * 0.06));
      c.quadraticCurveTo(bx + bw * 1.85, by + bh * (0.40 + k * 0.10), tx - bw * (0.06 + k * 0.04), ty - bh * (0.20 - k * 0.16));
      c.stroke();
    }
    /* the cross-barring most long-tailed birds carry */
    c.strokeStyle = 'rgba(24,18,14,0.26)'; c.lineWidth = Math.max(1, bh * 0.05);
    for (let i = 1; i <= 5; i++) {
      const k = i / 6;
      const px = rx + (tx - rx) * k, py = ry + (ty - ry) * k;
      c.beginPath(); c.moveTo(px - bw * 0.02, py - bh * 0.16 * (1 - k * 0.4));
      c.lineTo(px + bw * 0.03, py + bh * 0.20 * (1 - k * 0.3)); c.stroke();
    }
  } else if (tail === 'forked') {
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(bx + bw * 0.68, by + bh * 0.14);
      c.lineTo(bx + bw * 1.85, by + bh * (0.40 + s * 0.42));
      c.lineTo(bx + bw * 0.74, by + bh * 0.50); c.closePath(); c.fill();
    }
  } else if (!opts.flightless) {
    c.beginPath(); c.moveTo(bx + bw * 0.7, by + bh * 0.1);
    c.lineTo(bx + bw * 1.75, by + bh * 0.55);
    c.lineTo(bx + bw * 0.75, by + bh * 0.62); c.closePath(); c.fill();
  } else {
    /* a ratite's rump is a soft drooping plume mass, not a pointed streamer */
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? p.dark : p.base;
      c.beginPath();
      c.ellipse(bx + bw * (0.72 + i * 0.07), by + bh * (0.30 + i * 0.12),
        bw * 0.34, bh * 0.20, 0.5 + i * 0.06, 0, TAU);
      c.fill();
    }
  }

  c.fillStyle = bodyGrad(c, p, bx, by, bw);
  c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.fill();

  /* ★ WAVE 21 — THE PLUMAGE. The body was a gradient-filled ellipse, which is
     the flattest surface in the catalogue and sat next to 144 mammals that
     had gained real fur — so every bird read as the unfinished one. The
     ellipse is handed to ellipseTube (an ellipse IS a swept circle) and the
     material layer tiles contour feathers onto it in the body's own
     coordinates, carrying the −0.15 rad tilt so the tracts follow the bird
     rather than the screen.

     Clipped to the same ellipse: the material deliberately overshoots the
     silhouette so feathers reach the edge instead of stopping short of it,
     and the clip is what keeps that from becoming a fringe. */
  {
    const bodyTube = ellipseTube(bx, by, bw, bh, -0.15);
    c.save();
    c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.clip();
    coatMaterial(c, bodyTube, r, p, 'feather', { detail: BIRD_MAT_DETAIL });
    c.restore();
  }
  if (opts.shaggy) {
    /* drooping strands NOT clipped to the body — the shag is the part that
       hangs off the silhouette */
    c.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const t = r();
      const sx = bx - bw * 0.85 + t * bw * 1.7;                 /* root along the back/flank */
      const sy = by - bh * (0.55 - t * 0.2) + r() * bh * 0.9;
      const len = bh * (0.55 + r() * 0.55);
      const drift = (r() - 0.35) * bw * 0.30;
      c.strokeStyle = i % 3 ? `rgba(52,44,36,${0.30 + r() * 0.30})` : `rgba(126,112,94,${0.28 + r() * 0.25})`;
      c.lineWidth = 1.1 + r() * 1.2;
      c.beginPath(); c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + drift * 0.4, sy + len * 0.55, sx + drift, sy + len);
      c.stroke();
    }
  }
  /* ★ WAVE 8 — THE MARKS, clipped to the body so they are plumage and not
     stickers. Between them and the bill these are what a birder actually uses
     to tell two brown songbirds apart at twenty metres. */
  if (opts.bib || opts.belly || opts.breastBand || opts.speckle || opts.streak) {
    c.save();
    c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.clip();
    if (opts.belly) {
      c.fillStyle = opts.belly;
      c.beginPath();
      c.ellipse(bx - bw * 0.08, by + bh * 0.48, bw * 0.94, bh * 0.72, -0.10, 0, TAU);
      c.fill();
    }
    if (opts.breastBand) {
      c.strokeStyle = opts.breastBand; c.lineWidth = bh * 0.30; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(bx - bw * 0.92, by - bh * 0.02);
      c.quadraticCurveTo(bx - bw * 0.42, by + bh * 0.18, bx + bw * 0.16, by + bh * 0.26);
      c.stroke();
    }
    if (opts.bib) {
      /* the breast patch sits FORWARD and LOW — the bird faces left */
      const bg2 = c.createRadialGradient(bx - bw * 0.42, by + bh * 0.18, bw * 0.05, bx - bw * 0.42, by + bh * 0.18, bw * 0.95);
      bg2.addColorStop(0, opts.bib);
      bg2.addColorStop(0.62, opts.bib);
      bg2.addColorStop(1, `rgba(0,0,0,0)`);
      c.fillStyle = bg2;
      c.beginPath(); c.ellipse(bx - bw * 0.42, by + bh * 0.18, bw * 0.78, bh * 0.86, 0, 0, TAU); c.fill();
    }
    if (opts.speckle) {
      /* a starling is black flecked with pale arrowheads, densest on the flank */
      for (let i = 0; i < 90; i++) {
        const ux = bx - bw + r() * bw * 2, uy = by - bh + r() * bh * 2;
        c.fillStyle = `rgba(238,232,214,${0.30 + r() * 0.45})`;
        c.beginPath(); c.ellipse(ux, uy, 1.4 + r() * 1.6, 0.9 + r() * 1.1, r() * 3, 0, TAU); c.fill();
      }
    }
    if (opts.streak) {
      /* a lark is streaked ALONG the body, which is what makes it vanish in grass */
      c.lineCap = 'round';
      for (let i = 0; i < 42; i++) {
        const ux = bx - bw + r() * bw * 2, uy = by - bh + r() * bh * 2;
        const L = bw * (0.10 + r() * 0.20);
        c.strokeStyle = r() < 0.55
          ? `rgba(58,42,26,${0.30 + r() * 0.35})`
          : `rgba(226,214,188,${0.22 + r() * 0.28})`;
        c.lineWidth = 1 + r() * 1.4;
        c.beginPath(); c.moveTo(ux, uy); c.lineTo(ux + L, uy + (r() - 0.5) * 3); c.stroke();
      }
    }
    c.restore();
  }
  /* ★ WAVE 39 — THE PEARL SPOTTING, and it is the bird the trait is named for.
     Guineafowl's verifier: "mustRead 2's defining half — the dense white pearl
     spotting — is entirely absent; the body is plain slate grey with a few
     concentric arcs, and that spotting is the trait the bird is known by."
     An even field of small white dots over body and wing, clipped to the body
     so none of it strays into the background, and spaced on a jittered lattice
     rather than randomly — a real guineafowl's pearling is strikingly REGULAR,
     and a random scatter reads as damage rather than plumage. */
  if (opts.pearled) {
    c.save();
    c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.clip();
    for (let ry = -4; ry <= 4; ry++) {
      for (let rx2 = -6; rx2 <= 6; rx2++) {
        const jx = (r() - 0.5) * bw * 0.055, jy = (r() - 0.5) * bh * 0.10;
        const px = bx + rx2 * bw * 0.165 + (ry % 2 ? bw * 0.082 : 0) + jx;
        const py = by + ry * bh * 0.21 + jy;
        c.fillStyle = `rgba(238,238,232,${0.62 + r() * 0.26})`;
        c.beginPath(); c.arc(px, py, Math.max(1.1, bh * 0.030), 0, TAU); c.fill();
      }
    }
    c.restore();
  }
  rim(c, () => c.ellipse(bx, by, bw, bh, -0.15, -2.8, 0.3), 2.2);

  /* ★ THE FOLDED WING — layered coverts + primaries, the missing feature */
  if (opts.wings === 'soaring') {
    /* ★ WAVE 21 — AN ALBATROSS IS ITS WINGSPAN. Folded like every other bird it
       read as "a compact waterbird" (the audit's words); held out, the span is
       the recognition. Two wings, the far one behind and dimmer, so the bird
       has depth instead of one flat cutout. */
    const spanW = bw * 3.5, spanH = bh * 0.46;
    const feather = (sx: number, sy: number, ang: number, k: number, dim: number): void => {
      c.save(); c.translate(sx, sy); c.rotate(ang);
      const wg = c.createLinearGradient(0, 0, spanW * k, 0);
      wg.addColorStop(0, p.base); wg.addColorStop(0.55, p.dark);
      wg.addColorStop(1, `rgb(${p.cr * 0.24 | 0},${p.cg * 0.24 | 0},${p.cb * 0.26 | 0})`);
      c.globalAlpha = dim;
      c.fillStyle = wg;
      /* THE TAPER IS THE WING. A constant-chord blade with a squared-off end is
         a plank; an albatross's wing narrows the whole way out and finishes on
         a point, and that outline alone says "seabird". */
      c.beginPath();
      c.moveTo(0, -spanH * 0.60);
      c.bezierCurveTo(spanW * k * 0.40, -spanH * 0.98, spanW * k * 0.78, -spanH * 0.72, spanW * k, -spanH * 0.10);
      c.bezierCurveTo(spanW * k * 0.72, spanH * 0.34, spanW * k * 0.34, spanH * 0.60, 0, spanH * 0.62);
      c.closePath(); c.fill();
      /* the primaries as separated fingers, splitting OFF the tapered tip */
      c.strokeStyle = `rgba(${p.cr * 0.22 | 0},${p.cg * 0.22 | 0},${p.cb * 0.24 | 0},0.9)`;
      c.lineCap = 'round';
      /* ★ WAVE 38, G5 — THE PRIMARIES WERE DRAWN PAST THE WING'S OWN TIP. The
         blade ends at spanW*k; these ran to 1.02·spanW*k, so five strokes
         projected into empty space beyond it and, on a bird whose proportions
         are not the albatross's, separated into "five separate feather lozenges
         floating clear of the body with visible gaps, reading as pasted
         leaves" — the Eagle, confirmed at 5× as the worst artifact in the pass.
         A primary is a SPLIT IN the wing, not a finger beyond it: they start
         deeper in the blade and stop inside its edge, so they can only ever
         read as notches in one surface. */
      for (let i = 0; i < 5; i++) {
        const u = i / 4;
        c.lineWidth = 3.4 - u * 1.6;
        c.beginPath(); c.moveTo(spanW * k * 0.54, -spanH * 0.46 + u * spanH * 0.86);
        c.quadraticCurveTo(spanW * k * (0.78 + u * 0.03), -spanH * 0.40 + u * spanH * 0.88,
          spanW * k * (0.96 - u * 0.10), -spanH * (0.24 - u * 0.40));
        c.stroke();
      }
      /* the covert row where the wing meets the shoulder — it belongs to a body */
      c.fillStyle = `rgba(${Math.min(255, p.cr * 1.3 | 0)},${Math.min(255, p.cg * 1.3 | 0)},${Math.min(255, p.cb * 1.3 | 0)},0.5)`;
      c.beginPath(); c.ellipse(spanW * k * 0.14, 0, spanW * k * 0.17, spanH * 0.52, 0, 0, TAU); c.fill();
      c.globalAlpha = 1;
      c.restore();
    };
    /* one wing sweeping back on each side. The far one is shorter and dimmer
       because it is going away from us — two identical wings read as a cutout. */
    /* ★ WAVE 38, G5 — AND BOTH WINGS ROOTED NEAR THE BODY'S CENTRE, so the far
       one read as "a straight dark wing blade crossing the left of the body
       with no shoulder join". A wing leaves the SHOULDER — up and forward of
       centre — and its root must sit INSIDE the body outline so the body
       covers the join, which is the same answer wave 4 gave the mammal limbs
       and wave 6 the neck: there is nothing to blend if the join is buried. */
    feather(bx + bw * 0.16, by - bh * 0.40, Math.PI - 0.30, 0.72, 0.55);   /* far, going away */
    feather(bx + bw * 0.22, by - bh * 0.16, 0.14, 1, 1);                   /* near, toward us */
  } else if (opts.hover) {
    /* A hovering hummingbird reads from the paired translucent wing blurs, not
       from a grounded folded-wing silhouette. */
    for (const side of [-1, 1] as const) {
      const sx = bx + side * bw * 0.10, sy = by - bh * 0.20;
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.34)`;
      c.lineWidth = Math.max(2.4, bh * 0.24); c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + side * bw * 0.86, sy - bh * 1.25, sx + side * bw * 1.28, sy - bh * 0.48); c.stroke();
      c.strokeStyle = `rgba(${Math.min(255, p.cr + 95)},${Math.min(255, p.cg + 105)},${Math.min(255, p.cb + 110)},0.46)`;
      c.lineWidth = Math.max(1.2, bh * 0.075);
      for (let blur = -1; blur <= 1; blur++) {
        c.beginPath(); c.moveTo(sx, sy + blur * bh * 0.13);
        c.quadraticCurveTo(sx + side * bw * 0.82, sy - bh * (1.18 - blur * 0.06), sx + side * bw * 1.24, sy - bh * (0.42 - blur * 0.08)); c.stroke();
      }
    }
  } else if (opts.upright) {   /* a penguin has a FLIPPER: one stiff blade, no primaries */
    /* ★ POLISH — the flipper is a STIFF NARROW BLADE held out from the body,
       tapering to a rounded tip, not a soft oval wing lying on the flank. */
    c.fillStyle = p.dark;
    c.save(); c.translate(bx + bw * 0.42, by - bh * 0.28); c.rotate(0.62);
    c.beginPath();
    c.moveTo(0, -bh * 0.06);
    c.quadraticCurveTo(bw * 0.24, bh * 0.10, bw * 0.16, bh * 0.72);   /* the blade, tapering */
    c.quadraticCurveTo(bw * 0.06, bh * 0.86, -bw * 0.04, bh * 0.72);
    c.quadraticCurveTo(-bw * 0.10, bh * 0.20, 0, -bh * 0.06);
    c.closePath(); c.fill();
    c.restore();
    c.fillStyle = 'rgba(244,240,228,0.90)';   /* the pale front */
    c.beginPath(); c.ellipse(bx - bw * 0.26, by + bh * 0.14, bw * 0.52, bh * 0.70, -0.12, 0, TAU); c.fill();
  } else {
    /* ★ D-ART-118 — WHAT `flightless` ACTUALLY HAS TO MEAN.
       It changed exactly one tail vertex, so Ostrich, Emu, Rhea and Cassowary
       kept the full folded flight wing with its concentric covert arcs and a
       pointed flight-tail streamer — i.e. they were songbird bodies on long
       legs, and the audit said so four separate times. A ratite's wing is a
       vestigial stub buried in body plumage, and it has no flight tail at all. */
    const WING = opts.flightless ? 0.34 : 1;
    c.save(); c.translate(bx + bw * 0.12 * WING, by + bh * 0.05); c.rotate(0.22);
    for (let layer = 0; layer < 3; layer++) {
      const lw = bw * (0.95 - layer * 0.16) * WING, lh = bh * (0.62 - layer * 0.10) * WING;
      c.fillStyle = layer === 0 ? p.dark : (layer === 1 ? p.base : p.lit);
      c.beginPath(); c.ellipse(0, layer * 3, lw, lh, 0, 0, TAU); c.fill();
    }
    /* ★ WAVE 21 — THE WING IS WHERE THE PLUMAGE HAS TO GO.
       Feathers were added to the body ellipse first, and the drift guard
       measured no change at all across 105 birds. The render said why: the
       FOLDED WING covers most of the torso, so a coat painted on the body is
       almost entirely occluded by the time the wing lands on top of it. The
       wing is the largest surface a viewer actually sees on a perched bird,
       and it is the one made of the biggest, most legible feathers. */
    {
      /* the outermost covert layer, matching the last iteration of the loop
         above (layer 2) — clip and tube must agree or the coat fringes */
      const wx = 0, wy = 2 * 3, wrx = bw * 0.63 * WING, wry = bh * 0.42 * WING;
      c.save();
      c.beginPath(); c.ellipse(wx, wy, wrx, wry, 0, 0, TAU); c.clip();
      coatMaterial(c, ellipseTube(wx, wy, wrx, wry, 0), r, p, 'feather',
        { detail: BIRD_MAT_DETAIL * 0.85 });
      c.restore();
    }
    if (opts.wingClaw) {
      /* ★ D-ART-135 — THE HOATZIN'S WING CLAW, and the reason speccheck exists.
         Wave 28 declared this axis, set it on the row, wrote the comment, and
         never wrote the drawing — the gate caught it before a human did. The
         claw sits at the leading BEND of the folded wing, which on a hoatzin
         chick is the hand it climbs with. */
      c.fillStyle = '#efe6d4';
      c.beginPath();
      c.moveTo(-bw * 0.30, -bh * 0.34);
      c.quadraticCurveTo(-bw * 0.52, -bh * 0.52, -bw * 0.58, -bh * 0.24);
      c.quadraticCurveTo(-bw * 0.44, -bh * 0.30, -bw * 0.30, -bh * 0.20);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(60,48,34,0.5)'; c.lineWidth = 1;
      c.stroke();
    }
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.4;
    for (let i = 0; opts.flightless ? false : i < 6; i++) {   /* primaries fanning to the tail */
      c.beginPath(); c.moveTo(-bw * 0.1 + i * 4, 0);
      c.quadraticCurveTo(bw * 0.6, bh * 0.2 + i * 2, bw * 1.15 - i * 3, bh * 0.35 + i * 4); c.stroke();
    }
    c.restore();
  }

  /* ── neck + head ── */
  const neck = opts.neck ?? 'short';
  const hr = 20 * sz * (opts.owl ? 1.55 : 1) * (opts.headMass ?? 1);
  let hx = bx - bw * 0.72, hy = by - bh * 0.95;
  if (neck === 'none') { hx = bx - bw * 0.55; hy = by - bh * 0.80; }
  else if (neck === 'long') { hx = bx - bw * 0.86; hy = by - bh * 1.70; }
  else if (neck === 'swan') { hx = bx - bw * 1.05; hy = by - bh * 2.05; }
  if (neck !== 'none') {
    c.strokeStyle = p.base; c.lineWidth = 15 * sz * (neck === 'swan' ? 0.62 : neck === 'long' ? 0.76 : 1);
    c.beginPath(); c.moveTo(bx - bw * 0.35, by - bh * 0.35);
    if (neck === 'swan') {   /* the S-curve is the whole bird */
      c.bezierCurveTo(bx - bw * 1.30, by - bh * 0.60, bx - bw * 0.35, by - bh * 1.85, hx, hy);
    } else {
      c.quadraticCurveTo(hx - 4 * sz, by - bh * 0.6, hx, hy);
    }
    c.stroke();
  }
  /* ★ D-ART-121 — THE CROP. A hoatzin ferments its food in an enormous crop at
     the base of the neck; it is the reason the bird exists as an oddity, and
     the render had a smooth breast. Drawn before the head so the neck sits on
     top of it. */
  if (opts.crop) {
    c.fillStyle = bodyGrad(c, p, bx - bw * 0.55, by - bh * 0.30, bw * 0.5);
    c.beginPath(); c.ellipse(bx - bw * 0.52, by - bh * 0.28, bw * 0.42, bh * 0.52, -0.3, 0, TAU); c.fill();
  }
  /* ★ D-ART-121 — BARE SKIN. A vulture's head and neck carry no feathers, and
     that break in tone is the single strongest thing about it at a glance. */
  if (opts.bald) {
    c.strokeStyle = '#c99a92';
    c.lineWidth = 15 * sz * 0.86;
    c.beginPath(); c.moveTo(bx - bw * 0.35, by - bh * 0.35);
    c.quadraticCurveTo(hx - 4 * sz, by - bh * 0.6, hx, hy); c.stroke();
    c.fillStyle = 'rgba(238,232,220,0.92)';   /* the pale ruff where skin meets plumage */
    c.beginPath(); c.ellipse(bx - bw * 0.34, by - bh * 0.30, bw * 0.40, bh * 0.30, -0.25, 0, TAU); c.fill();
  }
  c.fillStyle = opts.bald ? '#c99a92' : bodyGrad(c, p, hx, hy, hr * 1.1);
  c.beginPath(); c.arc(hx, hy, hr, 0, TAU); c.fill();
  rim(c, () => c.arc(hx, hy, hr, -2.7, 0.3), 1.8);
  if (opts.mask) {
    /* the black face mask of a cardinal or a weaverbird — a small dark field
       around the bill base, and on a brightly-coloured bird it is the mark */
    c.fillStyle = 'rgba(16,13,15,0.86)';
    c.beginPath(); c.ellipse(hx - hr * 0.40, hy + hr * 0.14, hr * 0.64, hr * 0.48, -0.18, 0, TAU); c.fill();
  }
  if (opts.nest) {
    /* ★ WAVE 68 — the WOVEN BALL NEST hanging from a branch beside the bird:
       the thing a weaverbird is named for and the strongest possible field
       mark. A straw sphere with a woven texture and the entry hole low. */
    const nx = bx + bw * 2.0, ny = by - bh * 1.1, nr = bh * 1.35;
    c.strokeStyle = '#6a4e2c'; c.lineWidth = 4; c.lineCap = 'round';   /* the branch */
    c.beginPath(); c.moveTo(nx - nr * 1.4, ny - nr * 1.5); c.lineTo(nx + nr * 1.2, ny - nr * 1.1); c.stroke();
    c.strokeStyle = '#8a6a34'; c.lineWidth = 3;                        /* the hanging strap */
    c.beginPath(); c.moveTo(nx, ny - nr * 1.3); c.lineTo(nx, ny - nr * 0.8); c.stroke();
    const ng2 = c.createRadialGradient(nx - nr * 0.3, ny - nr * 0.35, 2, nx, ny, nr * 1.1);
    ng2.addColorStop(0, '#d8bc72'); ng2.addColorStop(0.6, '#b0904a'); ng2.addColorStop(1, '#7a6030');
    c.fillStyle = ng2;
    c.beginPath(); c.ellipse(nx, ny, nr * 0.92, nr, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,66,30,0.55)'; c.lineWidth = 1.6;          /* the weave */
    for (let i = -3; i <= 3; i++) {
      c.beginPath(); c.ellipse(nx, ny, nr * 0.9, nr * 0.95, i * 0.42, -1.2, 1.6); c.stroke();
    }
    c.fillStyle = 'rgba(26,20,12,0.9)';                                /* the low entry hole */
    c.beginPath(); c.ellipse(nx - nr * 0.25, ny + nr * 0.62, nr * 0.30, nr * 0.24, 0, 0, TAU); c.fill();
  }
  if (opts.comb) {
    /* the fleshy serrated red comb standing on the crown + the throat wattle */
    c.fillStyle = '#d8302a';
    c.beginPath(); c.moveTo(hx - hr * 0.75, hy - hr * 0.55);
    for (let k = 0; k < 4; k++) {
      const u = k / 3;
      c.quadraticCurveTo(hx - hr * (0.65 - u * 0.85), hy - hr * (1.4 + Math.sin(u * Math.PI) * 0.35),
        hx - hr * (0.45 - u * 0.85), hy - hr * (0.75 + Math.sin((u + 0.12) * Math.PI) * 0.16));
    }
    c.quadraticCurveTo(hx + hr * 0.6, hy - hr * 0.6, hx + hr * 0.3, hy - hr * 0.4);
    c.closePath(); c.fill();
    c.beginPath(); c.ellipse(hx - hr * 0.35, hy + hr * 0.85, hr * 0.22, hr * 0.34, 0.1, 0, TAU); c.fill();   /* the wattle */
  }
  if (opts.brow) {
    /* the supraorbital ridge: a heavy dark shelf jutting over the eye, which
       is most of why an eagle's face looks fierce and a pigeon's does not */
    c.strokeStyle = `rgba(${p.cr * 0.34 | 0},${p.cg * 0.34 | 0},${p.cb * 0.32 | 0},0.95)`;
    c.lineWidth = hr * 0.20; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx - hr * 0.78, hy - hr * 0.28);
    c.quadraticCurveTo(hx - hr * 0.30, hy - hr * 0.52, hx + hr * 0.22, hy - hr * 0.38); c.stroke();
  }
  if (opts.browComb) {
    /* the red eyebrow wattle of the grouse family — a bright crescent riding
       just above the eye, the only red pigment on a winter ptarmigan */
    c.fillStyle = '#d8302a';
    c.beginPath(); c.ellipse(hx - hr * 0.34, hy - hr * 0.42, hr * 0.42, hr * 0.16, -0.18, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,120,104,0.55)';
    c.beginPath(); c.ellipse(hx - hr * 0.40, hy - hr * 0.46, hr * 0.20, hr * 0.07, -0.18, 0, TAU); c.fill();
  }
  if (opts.cap) {
    c.fillStyle = opts.cap;
    c.beginPath(); c.ellipse(hx - hr * 0.10, hy - hr * 0.44, hr * 0.86, hr * 0.52, -0.12, 0, TAU); c.fill();
  }
  if (opts.owl) {
    /* THE FACIAL DISC + forward-facing eyes — an owl's entire identity, and
       the one head in the catalog that does not read in profile */
    c.fillStyle = `rgba(${Math.min(255, p.cr * 0.55 + 96 | 0)},${Math.min(255, p.cg * 0.55 + 88 | 0)},${Math.min(255, p.cb * 0.55 + 76 | 0)},0.55)`;
    c.beginPath(); c.ellipse(hx - hr * 0.16, hy + hr * 0.06, hr * 0.86, hr * 0.90, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(30,24,18,0.30)'; c.lineWidth = 2;
    c.beginPath(); c.arc(hx - hr * 0.42, hy + hr * 0.02, hr * 0.40, 0, TAU); c.stroke();
    c.beginPath(); c.arc(hx + hr * 0.16, hy + hr * 0.02, hr * 0.40, 0, TAU); c.stroke();
    eye(c, hx - hr * 0.42, hy + hr * 0.02, hr * 0.24);
    eye(c, hx + hr * 0.16, hy + hr * 0.02, hr * 0.24);
    c.fillStyle = opts.billHue ?? '#e0b13c';
    c.beginPath(); c.moveTo(hx - hr * 0.14, hy + hr * 0.24); c.lineTo(hx - hr * 0.30, hy + hr * 0.66); c.lineTo(hx + hr * 0.02, hy + hr * 0.34); c.closePath(); c.fill();
    if (opts.crest) {   /* ear tufts */
      c.fillStyle = p.dark;
      for (const s of [-1, 1] as const) {
        c.beginPath(); c.moveTo(hx + s * hr * 0.52, hy - hr * 0.62);
        c.lineTo(hx + s * hr * 0.80, hy - hr * 1.34); c.lineTo(hx + s * hr * 0.18, hy - hr * 0.86);
        c.closePath(); c.fill();
      }
    }
  } else {
    eye(c, hx - 5 * sz, hy - 4 * sz, 4.5 * sz);
  }

  /* the species bill */
  if (!opts.owl) {
    /* A BILL DOES NOT SCALE WITH THE BIRD. Scaled linearly, a hummingbird's
       needle — which is as long as its body in life — shrank to a dot, and
       every songbird lost the cone that identifies it. Bills keep most of
       their length at small sizes; at sz = 1 this is exactly 1, so the
       wave-3 birds are untouched. */
    const B = 0.55 + 0.45 * sz;
    c.fillStyle = opts.billHue ?? '#e0b13c';
    if (opts.parrotBill) {
      /* ★ D-ART-121 — a macaw does not wear a raptor's hook. A parrot bill is
         DEEP: the upper mandible curves down past the lower jawline entirely,
         and there is a bare cere at its base. The audit found this had
         REGRESSED to the shared eagle hook. */
      c.beginPath();
      c.moveTo(hx - 6 * B, hy - 13 * B);
      c.quadraticCurveTo(hx - 40 * B, hy - 12 * B, hx - 33 * B, hy + 17 * B);
      c.quadraticCurveTo(hx - 24 * B, hy + 4 * B, hx - 6 * B, hy + 8 * B);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(40,34,30,0.55)';   /* the lower mandible in shadow */
      c.beginPath();
      c.moveTo(hx - 10 * B, hy + 6 * B);
      c.quadraticCurveTo(hx - 26 * B, hy + 12 * B, hx - 8 * B, hy + 14 * B);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(238,232,220,0.85)';   /* the cere */
      c.beginPath(); c.ellipse(hx - 6 * B, hy - 9 * B, 7 * B, 5 * B, -0.2, 0, TAU); c.fill();
      c.fillStyle = opts.billHue ?? '#e0b13c';
    } else if (opts.bill === 'hook') { c.beginPath(); c.moveTo(hx - 16 * B, hy - 6 * B); c.quadraticCurveTo(hx - 40 * B, hy - 4 * B, hx - 34 * B, hy + 12 * B); c.quadraticCurveTo(hx - 26 * B, hy + 4 * B, hx - 14 * B, hy + 6 * B); c.closePath(); c.fill(); }
    else if (opts.bill === 'long') { c.beginPath(); c.moveTo(hx - 14 * B, hy - 4 * B); c.lineTo(hx - 78 * B, hy + 2 * B); c.lineTo(hx - 14 * B, hy + 7 * B); c.closePath(); c.fill(); }
    else if (opts.bill === 'spoon') {
      /* ★ wave 21 — the spatula has to DOMINATE the head: a long shaft that
         flares into a broad flat disc, with the two mandibles' seam across it */
      c.beginPath(); c.moveTo(hx - 12 * B, hy - 5 * B); c.lineTo(hx - 62 * B, hy - 2 * B);
      c.lineTo(hx - 62 * B, hy + 6 * B); c.lineTo(hx - 12 * B, hy + 8 * B); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(hx - 74 * B, hy + 2 * B, 22 * B, 13 * B, 0.06, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(hx - 14 * B, hy + 1 * B); c.lineTo(hx - 92 * B, hy + 3 * B); c.stroke();
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.beginPath(); c.ellipse(hx - 74 * B, hy + 7 * B, 20 * B, 6 * B, 0.06, 0, Math.PI); c.fill();
    }
    else if (opts.bill === 'huge') { c.beginPath(); c.moveTo(hx - 14 * B, hy - 12 * B); c.quadraticCurveTo(hx - 66 * B, hy - 10 * B, hx - 72 * B, hy + 6 * B); c.quadraticCurveTo(hx - 40 * B, hy + 16 * B, hx - 12 * B, hy + 10 * B); c.closePath(); c.fill(); }
    else if (opts.bill === 'toucan' || opts.bill === 'casque') {
      /* ★ WAVE 38, G6 — TOUCAN AND HORNBILL SHARED ONE BILL ASSET, and they are
         the two most distinctive bills in birds. Both were `bill:'huge'`: a
         short straight flat cone. The verifiers measured it — Toucan's bill is
         "roughly 40–45% of body length, not a fifth… still a straight flat
         yellow cone with no downcurve and no colour banding, well short of
         'nearly as long as the body'"; Hornbill "the same body and the same
         small straight yellow bill as the Toucan tile", with both halves of its
         mustRead — the huge downcurved bill AND its hollow casque — absent, its
         crest reading as "a punk hair fringe".
         Two bills now. Both are LONG and DOWNCURVED; the hornbill carries the
         casque ridge along the culmen that is the whole point of the animal. */
      const casque = opts.bill === 'casque';
      const L = (casque ? 92 : 104) * B, D = (casque ? 26 : 28) * B;
      c.beginPath();
      c.moveTo(hx - 12 * B, hy - D * 0.66);
      /* the culmen: deep at the face, curving DOWN to a fine tip */
      c.quadraticCurveTo(hx - L * 0.60, hy - D * 0.56, hx - L, hy + D * 0.30);
      c.quadraticCurveTo(hx - L * 0.52, hy + D * 0.78, hx - 12 * B, hy + D * 0.62);
      c.closePath(); c.fill();
      /* the cutting edge where the two mandibles meet — without it a bill of
         this size reads as one solid horn */
      c.strokeStyle = 'rgba(46,32,20,0.55)'; c.lineWidth = Math.max(1.2, 2.2 * B); c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 12 * B, hy + D * 0.06);
      c.quadraticCurveTo(hx - L * 0.56, hy + D * 0.22, hx - L * 0.96, hy + D * 0.26);
      c.stroke();
      if (casque) {
        /* the hollow helmet riding the base of the upper mandible */
        c.beginPath();
        c.moveTo(hx - 14 * B, hy - D * 0.62);
        c.quadraticCurveTo(hx - L * 0.34, hy - D * 1.42, hx - L * 0.62, hy - D * 0.52);
        c.quadraticCurveTo(hx - L * 0.34, hy - D * 0.66, hx - 14 * B, hy - D * 0.62);
        c.closePath(); c.fill();
      } else {
        /* the toucan's colour banding and dark tip */
        c.fillStyle = 'rgba(196,58,34,0.60)';
        c.beginPath();
        c.moveTo(hx - L * 0.46, hy - D * 0.42); c.lineTo(hx - L * 0.62, hy - D * 0.30);
        c.lineTo(hx - L * 0.58, hy + D * 0.52); c.lineTo(hx - L * 0.42, hy + D * 0.48);
        c.closePath(); c.fill();
        c.fillStyle = 'rgba(28,22,18,0.78)';
        c.beginPath(); c.ellipse(hx - L * 0.95, hy + D * 0.26, L * 0.06, D * 0.16, -0.4, 0, TAU); c.fill();
      }
    }
    else if (opts.bill === 'cone') {
      /* ★ WAVE 8 — THE SEED-CRACKER. A finch, a sparrow and a weaverbird all
         carry a short DEEP triangle you could crack a husk with, and it is the
         second thing after colour that separates them from the thin-billed
         insect eaters they otherwise resemble. 'short' was doing both jobs. */
      c.beginPath(); c.moveTo(hx - 4 * B, hy - 11 * B); c.lineTo(hx - 26 * B, hy + 2 * B);
      c.lineTo(hx - 4 * B, hy + 12 * B); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(30,22,14,0.45)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(hx - 4 * B, hy + 1 * B); c.lineTo(hx - 25 * B, hy + 2 * B); c.stroke();
    } else if (opts.bill === 'fine') {
      /* the thin pointed probe of a thrush or a starling — an insect eater */
      c.beginPath(); c.moveTo(hx - 6 * B, hy - 4 * B); c.lineTo(hx - 34 * B, hy + 3 * B);
      c.lineTo(hx - 6 * B, hy + 6 * B); c.closePath(); c.fill();
    }
    else if (opts.bill === 'short') {   /* the seed-cracking cone of a finch */
      c.beginPath(); c.moveTo(hx - 13 * B, hy - 6 * B); c.lineTo(hx - 30 * B, hy + 2 * B); c.lineTo(hx - 13 * B, hy + 9 * B); c.closePath(); c.fill();
    } else if (opts.bill === 'chisel') {   /* a woodpecker drives a straight spike */
      c.beginPath(); c.moveTo(hx - 13 * B, hy - 5 * B); c.lineTo(hx - 52 * B, hy - 1 * B); c.lineTo(hx - 52 * B, hy + 3 * B); c.lineTo(hx - 13 * B, hy + 6 * B); c.closePath(); c.fill();
    } else if (opts.bill === 'needle') {   /* a hummingbird's whole face */
      c.strokeStyle = '#2b2118'; c.lineWidth = 3.4 * B; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 12 * B, hy + 1 * B); c.lineTo(hx - 96 * B, hy + 5 * B); c.stroke();
    } else if (opts.bill === 'probe') {   /* ★ a wader's long straight dagger (snipe, godwit) */
      c.strokeStyle = opts.billHue ?? '#3a2f22'; c.lineWidth = 5 * B; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 10 * B, hy); c.lineTo(hx - 104 * B, hy + 3 * B); c.stroke();
    } else if (opts.bill === 'downcurve') {   /* ★ a curlew/ibis long smooth downcurve */
      c.strokeStyle = opts.billHue ?? '#2b2118'; c.lineWidth = 5 * B; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 10 * B, hy - 1 * B); c.quadraticCurveTo(hx - 66 * B, hy + 2 * B, hx - 92 * B, hy + 34 * B); c.stroke();
    } else if (opts.bill === 'upcurve') {   /* ★ an avocet's fine upward sweep */
      c.strokeStyle = opts.billHue ?? '#2b2118'; c.lineWidth = 3.4 * B; c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 10 * B, hy + 1 * B); c.quadraticCurveTo(hx - 60 * B, hy - 6 * B, hx - 88 * B, hy - 30 * B); c.stroke();
    } else if (opts.bill === 'duck') {   /* spatulate: broad, flat, rounded off */
      c.beginPath(); c.moveTo(hx - 12 * B, hy - 6 * B);
      c.quadraticCurveTo(hx - 48 * B, hy - 8 * B, hx - 54 * B, hy + 1 * B);
      c.quadraticCurveTo(hx - 48 * B, hy + 10 * B, hx - 12 * B, hy + 8 * B);
      c.closePath(); c.fill();
    } else if (opts.bill === 'stout') {
      /* ★ THE CORVID/GAMEBIRD BILL. `'stout'` was in the BillKind union and on
         TWENTY-ONE rows — Crow, Raven, Magpie, Jay, Gull, Penguin, Auk, the
         gamebirds, the ratites — and NO branch ever compared it, so all
         twenty-one fell to the generic `else` below and wore one thin spike.
         The type accepted it, `speccheck` was green (the FIELD is read), and
         only the picture knew. Four of these rows name the bill as a mustRead:
         "stout straight pointed bill" (Crow), "heavy straight crow bill"
         (Magpie), "stout crow-like bill" (Jay), "massive curved bill" (Raven).
         D-ART-100, one level down: a dead VALUE hides exactly as well as a
         dead field. */
      const L = 40 * B, D = 10 * B;
      c.beginPath();
      c.moveTo(hx - 10 * B, hy - D);                                  /* deep base at the forehead */
      c.quadraticCurveTo(hx - L * 0.62, hy - D * 0.86, hx - L, hy + D * 0.16);   /* culmen, faintly convex */
      c.quadraticCurveTo(hx - L * 0.54, hy + D * 0.72, hx - 10 * B, hy + D * 1.05);
      c.closePath(); c.fill();
      /* the gape line — without it a bill this deep reads as one solid horn,
         the lesson the toucan branch above already paid for */
      c.strokeStyle = 'rgba(46,32,20,0.50)'; c.lineWidth = Math.max(1, 1.6 * B); c.lineCap = 'round';
      c.beginPath(); c.moveTo(hx - 10 * B, hy + D * 0.10);
      c.quadraticCurveTo(hx - L * 0.58, hy + D * 0.20, hx - L * 0.96, hy + D * 0.14);
      c.stroke();
    } else { c.beginPath(); c.moveTo(hx - 14 * B, hy - 5 * B); c.lineTo(hx - 36 * B, hy + 1 * B); c.lineTo(hx - 14 * B, hy + 8 * B); c.closePath(); c.fill(); }
    if (opts.tubeNostrils) {
      /* Procellariiforms carry paired tubes on the bill's top, a small but decisive seabird tell. */
      c.strokeStyle = 'rgba(24,28,32,0.86)'; c.lineWidth = Math.max(1.5, 3 * B); c.lineCap = 'round';
      for (const y of [-1, 3]) { c.beginPath(); c.moveTo(hx - 15 * B, hy + y * B); c.lineTo(hx - 31 * B, hy + (y - 1) * B); c.stroke(); }
    }
  }
  if (opts.crest && !opts.owl) {
    if (opts.doubleCrest) {
      /* Harpy eagles carry two broad, separated fans. A single five-stroke
         fringe reads as a generic punk crest, even when the row says harpy. */
      for (const layer of [-1, 1] as const) {
        for (let i = 0; i < 4; i++) {
          const rootX = hx + layer * hr * 0.06, rootY = hy - hr * (0.58 + layer * 0.04);
          const angle = (layer < 0 ? -2.15 : -1.05) + i * 0.16;
          const length = hr * (1.26 + i * 0.08 + layer * 0.05);
          const dx = Math.cos(angle) * length, dy = Math.sin(angle) * length;
          const nx = -Math.sin(angle), ny = Math.cos(angle);
          const width = hr * (0.19 - i * 0.018);
          c.fillStyle = layer < 0 ? p.dark : p.lit;
          c.beginPath(); c.moveTo(rootX, rootY);
          c.quadraticCurveTo(rootX + dx * 0.54 + nx * width, rootY + dy * 0.54 + ny * width,
            rootX + dx, rootY + dy);
          c.quadraticCurveTo(rootX + dx * 0.48 - nx * width, rootY + dy * 0.48 - ny * width,
            rootX, rootY);
          c.closePath(); c.fill();
        }
      }
    } else {
      c.strokeStyle = p.lit; c.lineWidth = 3.4 * sz; c.lineCap = 'round';
      for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.22; c.beginPath(); c.moveTo(hx + 2 * sz, hy - 16 * sz); c.quadraticCurveTo(hx + (10 + Math.cos(a) * 18) * sz, hy - 34 * sz, hx + (6 + Math.cos(a) * 30) * sz, hy - (40 - i * 3) * sz); c.stroke(); }
    }
  }
  /* THE WATERLINE — a swimming bird is cut by the surface, which is why a
     duck reads as a duck and not as a bird standing in a hole */
  if (opts.swim) {
    const wl = by + bh * 0.30;
    c.fillStyle = 'rgba(28,52,78,0.72)';
    c.beginPath(); c.ellipse(bx, wl + bh * 0.55, bw * 1.55, bh * 0.46, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(150,200,240,0.34)'; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(bx, wl + bh * 0.10, bw * 1.42, bh * 0.20, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(bx, wl + bh * 0.10, bw * 1.95, bh * 0.28, 0, 0, TAU); c.stroke();
  }
  /* PLUMAGE TEXTURE — feather groups, not a painted egg. Soft, low-alpha
     and clipped to the body, so the bird still reads at thumbnail size. */
  c.save();
  c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.clip();
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = r() ** 0.7;
    softMark(c, bx + Math.cos(a) * bw * d, by + Math.sin(a) * bh * d,
      bw * (0.10 + r() * 0.10), bh * (0.05 + r() * 0.06),
      i % 3 ? '235,236,230' : '30,26,20', 0.035 + r() * 0.045, a * 0.3);
  }
  c.restore();
  /* ★ WAVE 40 — close the cling transform opened before the body */
  if (opts.cling) c.restore();
}

/* ---------------- Wave 2b B1: anatomy-first named bird portraits ----------------
   These whole forms are deliberately opt-in. The shared bird painter above has many
   accepted catalog users, so changing its silhouette would trade one set of birds
   for another. Each route below closes a frozen literal contract while leaving every
   generic and procedural caller on the byte-identical legacy path. */
export type BirdB1Kind =
  | 'Eagle' | 'Falcon' | 'Hawk' | 'Harpy Eagle' | 'Secretary Bird' | 'Vulture'
  | 'Osprey' | 'Kestrel' | 'Condor'
  | 'Owl' | 'Desert Owl' | 'Snowy Owl'
  | 'Cassowary' | 'Kakapo' | 'Rhea' | 'Bustard' | 'Seriema' | 'Screamer'
  | 'Woodpecker' | 'Hoatzin' | 'Hummingbird';

function birdB1Gradient(c: Ctx, x: number, y: number, r: number, light: string, base: string, dark: string): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.38, y - r * 0.42, 2, x, y, r * 1.25);
  gg.addColorStop(0, light); gg.addColorStop(0.58, base); gg.addColorStop(1, dark);
  return gg;
}

function birdB1Eye(c: Ctx, x: number, y: number, r: number, iris = '#d3a325'): void {
  c.fillStyle = iris; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#111318'; c.beginPath(); c.arc(x, y, r * 0.53, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.88)'; c.beginPath(); c.arc(x - r * 0.24, y - r * 0.28, Math.max(1.2, r * 0.18), 0, TAU); c.fill();
}

function birdB1HookBill(c: Ctx, x: number, y: number, scale: number, hue = '#d6a42e', faceLeft = true): void {
  const d = faceLeft ? -1 : 1;
  c.save(); c.translate(x, y); c.scale(d, 1);
  c.fillStyle = hue;
  c.beginPath(); c.moveTo(0, -8 * scale);
  c.quadraticCurveTo(22 * scale, -10 * scale, 29 * scale, 2 * scale);
  c.quadraticCurveTo(30 * scale, 15 * scale, 17 * scale, 22 * scale);
  c.quadraticCurveTo(21 * scale, 12 * scale, 10 * scale, 10 * scale);
  c.lineTo(0, 8 * scale); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,220,86,0.62)';
  c.beginPath(); c.ellipse(5 * scale, -2 * scale, 7 * scale, 6 * scale, 0, 0, TAU); c.fill();
  c.fillStyle = '#2b241b'; c.beginPath(); c.arc(7 * scale, -4 * scale, Math.max(1.2, 1.5 * scale), 0, TAU); c.fill();
  c.restore();
}

function birdB1TalonedFoot(c: Ctx, x: number, y: number, scale: number, hue: string, huge = false): void {
  const k = scale * (huge ? 1.35 : 1);
  c.fillStyle = hue;
  c.beginPath(); c.moveTo(x - 6 * k, y - 29 * k); c.quadraticCurveTo(x - 10 * k, y - 8 * k, x - 5 * k, y);
  c.lineTo(x + 7 * k, y); c.quadraticCurveTo(x + 11 * k, y - 12 * k, x + 7 * k, y - 29 * k); c.closePath(); c.fill();
  c.strokeStyle = hue; c.lineWidth = 5.4 * k; c.lineCap = 'round';
  for (const [dx, len, bend] of [[-9, 23, -9], [0, 28, 0], [9, 23, 9]] as const) {
    c.beginPath(); c.moveTo(x + dx * k * 0.45, y - 1);
    c.quadraticCurveTo(x + dx * k, y + 4 * k, x + (dx + bend) * k, y + len * k * 0.42); c.stroke();
  }
  c.strokeStyle = '#28231d'; c.lineWidth = 3.2 * k;
  for (const [dx, len] of [[-18, 14], [0, 17], [18, 14]] as const) {
    c.beginPath(); c.arc(x + dx * k * 0.72, y + len * k * 0.40, 7 * k, 0.05, 1.6); c.stroke();
  }
}

function birdB1FlyingTalons(c: Ctx, x: number, y: number, scale: number): void {
  /* In flight the short tarsus is tucked and curved; only the spread toes and
     barbed hooks hang below the belly. A filled standing-leg block is wrong. */
  c.strokeStyle = '#665c48'; c.lineWidth = 6 * scale; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + 3 * scale, y - 19 * scale); c.quadraticCurveTo(x - 5 * scale, y - 8 * scale, x, y); c.stroke();
  for (const [dx, dy] of [[-18, 8], [-8, 15], [5, 16], [17, 9]] as const) {
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + dx * scale * 0.52, y + dy * scale * 0.20, x + dx * scale, y + dy * scale); c.stroke();
  }
  c.strokeStyle = '#24231f'; c.lineWidth = 2.8 * scale;
  for (const [dx, dy, start] of [[-18,8,0.1],[-8,15,0.15],[5,16,0.1],[17,9,-0.2]] as const) {
    c.beginPath(); c.arc(x + dx * scale, y + dy * scale, 6.5 * scale, start, start + 1.55); c.stroke();
  }
}

function birdB1FoldedWing(c: Ctx, x: number, y: number, w: number, h: number, base: string, dark: string, pointed = false): void {
  c.fillStyle = birdB1Gradient(c, x - w * 0.18, y - h * 0.28, w * 0.72, '#c9c8bd', base, dark);
  c.beginPath(); c.moveTo(x - w * 0.48, y - h * 0.42);
  c.quadraticCurveTo(x + w * 0.16, y - h * 0.62, x + w * 0.48, y - h * 0.05);
  c.quadraticCurveTo(x + w * (pointed ? 0.74 : 0.42), y + h * (pointed ? 0.62 : 0.45), x - w * 0.28, y + h * 0.35);
  c.quadraticCurveTo(x - w * 0.58, y + h * 0.06, x - w * 0.48, y - h * 0.42); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(25,24,24,0.42)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    c.beginPath(); c.moveTo(x - w * (0.30 - t * 0.08), y - h * (0.24 - t * 0.10));
    c.quadraticCurveTo(x + w * (0.05 + t * 0.08), y + h * (0.02 + t * 0.10), x + w * (0.30 + t * (pointed ? 0.35 : 0.10)), y + h * (0.22 + t * 0.15)); c.stroke();
  }
  rim(c, () => {
    c.moveTo(x - w * 0.48, y - h * 0.42);
    c.quadraticCurveTo(x + w * 0.16, y - h * 0.62, x + w * 0.48, y - h * 0.05);
    c.quadraticCurveTo(x + w * (pointed ? 0.74 : 0.42), y + h * (pointed ? 0.62 : 0.45), x - w * 0.28, y + h * 0.35);
  }, 2.2);
}

/** Raptor-only wing topology. The accepted non-B1 birds retain the older folded
    wing above; these layered coverts and tapered flight feathers remove the
    shield outline from the eight named B1 repairs. */
function birdB1RaptorWing(c: Ctx, x: number, y: number, w: number, h: number, base: string, dark: string, pointed = false): void {
  c.fillStyle = birdB1Gradient(c, x - w * 0.18, y - h * 0.27, w * 0.72, '#c8c1b4', base, dark);
  c.beginPath(); c.moveTo(x - w * 0.48, y - h * 0.40);
  c.bezierCurveTo(x - w * 0.12, y - h * 0.64, x + w * 0.27, y - h * 0.46, x + w * 0.48, y - h * 0.08);
  c.quadraticCurveTo(x + w * (pointed ? 0.78 : 0.53), y + h * (pointed ? 0.60 : 0.31), x + w * 0.22, y + h * 0.43);
  c.quadraticCurveTo(x - w * 0.18, y + h * 0.47, x - w * 0.42, y + h * 0.18);
  c.quadraticCurveTo(x - w * 0.57, y - h * 0.08, x - w * 0.48, y - h * 0.40); c.closePath(); c.fill();
  /* Broad shoulder coverts bury the wing root into the torso. */
  c.fillStyle = base;
  for (let i = 0; i < 4; i++) {
    const yy = y - h * 0.25 + i * h * 0.13;
    c.beginPath(); c.ellipse(x - w * 0.28 + i * w * 0.06, yy, w * 0.24, h * 0.12, -0.28, 0, TAU); c.fill();
  }
  /* Individual primaries overlap one another; no bright perimeter line. */
  for (let i = 0; i < 5; i++) {
    const t = i / 4, rootX = x - w * 0.14 + t * w * 0.16, rootY = y - h * 0.02 + t * h * 0.10;
    const tipX = x + w * (0.27 + t * (pointed ? 0.49 : 0.24));
    const tipY = y + h * (0.19 + t * (pointed ? 0.42 : 0.20));
    c.fillStyle = i % 2 ? dark : base;
    c.beginPath(); c.moveTo(rootX, rootY - h * 0.045);
    c.quadraticCurveTo((rootX + tipX) * 0.52, (rootY + tipY) * 0.46 - h * 0.04, tipX, tipY);
    c.quadraticCurveTo((rootX + tipX) * 0.50, (rootY + tipY) * 0.56 + h * 0.04, rootX, rootY + h * 0.045); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(225,222,210,0.30)'; c.lineWidth = 2.2; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(x - w * 0.36, y - h * (0.22 - i * 0.13));
    c.quadraticCurveTo(x - w * 0.02, y - h * (0.18 - i * 0.04), x + w * (0.24 + i * 0.10), y + h * (0.05 + i * 0.12)); c.stroke();
  }
}

function birdB1PerchedRaptor(c: Ctx, kind: 'Eagle' | 'Falcon' | 'Hawk' | 'Harpy Eagle' | 'Kestrel'): void {
  const harpy = kind === 'Harpy Eagle', falcon = kind === 'Falcon' || kind === 'Kestrel';
  const eagle = kind === 'Eagle', kestrel = kind === 'Kestrel';
  const bodyBase = harpy ? '#4e535b' : eagle ? '#5b422b' : kind === 'Hawk' ? '#8e5535' : kestrel ? '#a96734' : '#48586b';
  const bodyDark = harpy ? '#252a31' : eagle ? '#2c241d' : kind === 'Hawk' ? '#4a2c23' : kestrel ? '#4f3427' : '#26313e';
  const bodyLight = harpy ? '#c6c8c9' : eagle ? '#a58a66' : kind === 'Hawk' ? '#c69a74' : kestrel ? '#d6a06e' : '#a6b1bd';
  ground(c, 220, 370, falcon ? 105 : 118);

  /* The tail is rooted under the rump, not pasted behind the finished body. */
  c.fillStyle = bodyDark;
  if (falcon) {
    c.beginPath(); c.moveTo(224, 285); c.quadraticCurveTo(274, 307, kestrel ? 345 : 322, 346);
    c.lineTo(kestrel ? 322 : 300, 366); c.quadraticCurveTo(267, 340, 215, 304); c.closePath(); c.fill();
    if (kestrel) {
      /* Four bars cross the full long tail, perpendicular to its shaft. */
      c.strokeStyle = '#d9b36f'; c.lineWidth = 7; c.lineCap = 'round';
      for (const t of [0.28, 0.46, 0.64, 0.82]) {
        const cx = 239 + 96 * t, cy = 300 + 56 * t;
        c.beginPath(); c.moveTo(cx - 7, cy + 11); c.lineTo(cx + 7, cy - 11); c.stroke();
      }
    }
  } else {
    c.beginPath(); c.moveTo(219, 286); c.quadraticCurveTo(258, 312, 309, 340);
    c.lineTo(277, 357); c.lineTo(244, 345); c.lineTo(213, 302); c.closePath(); c.fill();
  }

  /* Filled tarsi merge into the belly. Feather cuffs make an eagle look booted. */
  for (const x of [190, 238]) {
    c.fillStyle = eagle || harpy ? bodyLight : '#c8a44f';
    c.beginPath(); c.moveTo(x - 13, 289); c.quadraticCurveTo(x - 15, 320, x - 9, 342);
    c.lineTo(x + 9, 342); c.quadraticCurveTo(x + 15, 319, x + 13, 289); c.closePath(); c.fill();
    if (eagle || harpy) {
      c.fillStyle = bodyLight;
      for (const dx of [-10, 0, 10]) { c.beginPath(); c.ellipse(x + dx, 306, 12, 22, dx * 0.01, 0, TAU); c.fill(); }
    }
    const footScale = harpy ? 1.08 : eagle ? 1.02 : falcon ? 0.79 : 0.92;
    birdB1TalonedFoot(c, x, 345, footScale, harpy ? '#7e7569' : '#d0a832', harpy || eagle);
  }

  c.fillStyle = birdB1Gradient(c, 185, 185, 125, bodyLight, bodyBase, bodyDark);
  c.beginPath(); c.moveTo(153, 143); c.quadraticCurveTo(121, 164, 128, 232);
  c.quadraticCurveTo(133, 289, 176, 321); c.quadraticCurveTo(230, 337, 270, 304);
  c.quadraticCurveTo(295, 265, 286, 208); c.quadraticCurveTo(275, 157, 223, 137);
  c.quadraticCurveTo(181, 120, 153, 143); c.closePath(); c.fill();
  if (harpy) {
    c.fillStyle = '#ece8df'; c.beginPath(); c.ellipse(196, 266, 56, 54, -0.08, 0, TAU); c.fill();
    c.fillStyle = '#242931'; c.beginPath(); c.moveTo(139, 205); c.quadraticCurveTo(204, 186, 268, 211); c.lineTo(263, 235); c.quadraticCurveTo(204, 214, 146, 231); c.closePath(); c.fill();
  }
  birdB1RaptorWing(c, 218, 226, falcon ? 128 : 123, falcon ? 150 : 132, bodyBase, bodyDark, falcon);
  if (kestrel) {
    c.fillStyle = '#33291f';
    for (const [x, y] of [[185,190],[211,202],[235,221],[205,235],[244,250]] as const) { c.beginPath(); c.ellipse(x, y, 6, 4, -0.2, 0, TAU); c.fill(); }
  }

  /* Head and throat overlap the shoulder deeply to keep one continuous bird. */
  const hx = 145, hy = falcon ? 139 : 132, hr = harpy ? 52 : eagle ? 49 : 44;
  c.fillStyle = bodyBase; c.beginPath(); c.ellipse(155, 165, 44, 58, -0.15, 0, TAU); c.fill();
  c.fillStyle = harpy ? birdB1Gradient(c, hx, hy, hr, '#f1f0eb', '#c5c6c4', '#777b80') : birdB1Gradient(c, hx, hy, hr, bodyLight, bodyBase, bodyDark);
  c.beginPath(); c.moveTo(hx - hr * 0.82, hy - hr * 0.12);
  c.quadraticCurveTo(hx - hr * 0.57, hy - hr * 0.92, hx + hr * 0.18, hy - hr * 0.94);
  c.quadraticCurveTo(hx + hr * 0.92, hy - hr * 0.66, hx + hr * 0.90, hy + hr * 0.08);
  c.quadraticCurveTo(hx + hr * 0.65, hy + hr * 0.86, hx - hr * 0.08, hy + hr * 0.88);
  c.quadraticCurveTo(hx - hr * 0.76, hy + hr * 0.62, hx - hr * 0.82, hy - hr * 0.12); c.closePath(); c.fill();
  if (harpy) {
    c.fillStyle = '#6e737a';
    for (const s of [-1, 1] as const) {
      for (let i = 0; i < 3; i++) {
        c.beginPath(); c.moveTo(hx + s * (7 + i * 5), hy - 35 + i * 2);
        c.quadraticCurveTo(hx + s * (24 + i * 10), hy - 68 - i * 5, hx + s * (39 + i * 9), hy - 53 + i * 3);
        c.quadraticCurveTo(hx + s * (25 + i * 6), hy - 34, hx + s * (12 + i * 4), hy - 20); c.closePath(); c.fill();
      }
    }
  }
  if (falcon) {
    c.fillStyle = '#202833';
    c.beginPath(); c.moveTo(117, 136); c.quadraticCurveTo(132, 141, 139, 157);
    c.quadraticCurveTo(145, 171, 139, 186); c.quadraticCurveTo(126, 172, 124, 153);
    c.quadraticCurveTo(122, 145, 117, 136); c.closePath(); c.fill();
  }
  birdB1HookBill(c, 112, 140, falcon ? 0.78 : 0.94, harpy ? '#77726b' : '#d3a52d');
  birdB1Eye(c, 127, 126, falcon ? 6.5 : 7.5, '#d9ae35');
  c.strokeStyle = '#27231f'; c.lineWidth = falcon ? 5 : 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(117, 113); c.quadraticCurveTo(129, 107, 143, 116); c.stroke();
}

function birdB1AirRaptor(c: Ctx, kind: 'Osprey' | 'Condor'): void {
  const condor = kind === 'Condor';
  ground(c, 220, 358, condor ? 150 : 125);
  const base = condor ? '#292728' : '#f0eee6', dark = condor ? '#151519' : '#3e352d';
  /* Both wing surfaces are one path through the shoulders. Osprey bends at the
     wrist into its crooked M; condor stays plank-broad and ends in fingers. */
  c.fillStyle = birdB1Gradient(c, 220, 185, 190, condor ? '#6f6b69' : '#f5f3ed', base, dark);
  c.beginPath();
  c.moveTo(208, 222);
  if (condor) {
    c.lineTo(150, 176); c.lineTo(51, 140); c.lineTo(26, 150); c.lineTo(70, 168);
    c.lineTo(25, 169); c.lineTo(76, 187); c.lineTo(36, 194); c.lineTo(101, 210);
    c.quadraticCurveTo(155, 230, 205, 246);
  } else {
    c.quadraticCurveTo(169, 189, 129, 175); c.quadraticCurveTo(88, 158, 47, 190);
    c.quadraticCurveTo(98, 180, 144, 214); c.quadraticCurveTo(177, 238, 208, 247);
  }
  c.quadraticCurveTo(220, 254, 232, 247);
  if (condor) {
    c.quadraticCurveTo(285, 230, 339, 210); c.lineTo(404, 194); c.lineTo(364, 187);
    c.lineTo(415, 169); c.lineTo(370, 168); c.lineTo(414, 150); c.lineTo(389, 140);
    c.lineTo(290, 176); c.lineTo(232, 222);
  } else {
    c.quadraticCurveTo(263, 238, 296, 214); c.quadraticCurveTo(342, 180, 393, 190);
    c.quadraticCurveTo(352, 158, 311, 175); c.quadraticCurveTo(271, 189, 232, 222);
  }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(20,22,28,0.42)'; c.lineWidth = 3;
  for (const s of [-1, 1] as const) for (let i = 0; i < 4; i++) {
    c.beginPath(); c.moveTo(220 + s * 14, 226); c.quadraticCurveTo(220 + s * (70 + i * 18), 198 + i * 4, 220 + s * (132 + i * 14), 176 + i * 7); c.stroke();
  }
  if (!condor) {
    c.fillStyle = '#4a4038';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(220 + s * 76, 205); c.quadraticCurveTo(220 + s * 128, 174, 220 + s * 170, 185); c.lineTo(220 + s * 145, 201); c.quadraticCurveTo(220 + s * 108, 199, 220 + s * 76, 225); c.closePath(); c.fill();
    }
  }
  /* Torso bridges the wing roots; tail is rooted under it. */
  c.fillStyle = base; c.beginPath(); c.ellipse(226, 235, 67, 35, 0.08, 0, TAU); c.fill();
  c.fillStyle = dark; c.beginPath(); c.moveTo(176, 249); c.lineTo(129, 278); c.lineTo(193, 269); c.closePath(); c.fill();
  const hx = 292, hy = 224;
  if (condor) {
    c.fillStyle = '#eee7d9'; c.beginPath(); c.ellipse(273, 228, 24, 31, 0.2, 0, TAU); c.fill();
    c.fillStyle = '#a56e60'; c.beginPath(); c.arc(hx, hy, 23, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(76,40,36,0.48)'; c.lineWidth = 2;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(280, 213 + i * 7); c.quadraticCurveTo(294, 208 + i * 7, 306, 216 + i * 7); c.stroke(); }
    birdB1HookBill(c, 313, 226, 0.65, '#77716a', false);
  } else {
    c.fillStyle = '#f5f3ec'; c.beginPath(); c.arc(hx, hy, 28, 0, TAU); c.fill();
    c.fillStyle = '#433a34'; c.beginPath(); c.moveTo(276, 211); c.quadraticCurveTo(296, 207, 313, 220); c.lineTo(304, 228); c.quadraticCurveTo(291, 217, 275, 222); c.closePath(); c.fill();
    birdB1HookBill(c, 314, 225, 0.72, '#2b2a28', false);
    for (const x of [203, 244]) birdB1FlyingTalons(c, x, 279, 1.0);
  }
  birdB1Eye(c, condor ? 303 : 300, hy - 7, 5.2, condor ? '#3c211d' : '#d5a934');
}

function birdB1Vulture(c: Ctx): void {
  ground(c, 221, 370, 122);
  for (const x of [194, 244]) birdB1TalonedFoot(c, x, 344, 0.82, '#8b7a58');
  c.fillStyle = birdB1Gradient(c, 210, 220, 136, '#776c5d', '#3e3832', '#201f20');
  c.beginPath(); c.moveTo(128, 182); c.quadraticCurveTo(126, 103, 201, 101); c.quadraticCurveTo(287, 94, 306, 185);
  c.quadraticCurveTo(326, 269, 267, 324); c.quadraticCurveTo(176, 342, 124, 275); c.quadraticCurveTo(98, 222, 128, 182); c.closePath(); c.fill();
  birdB1RaptorWing(c, 225, 237, 132, 132, '#4a4239', '#201f20');
  /* Thick pale ruff grows from the hunched shoulders; bare neck emerges from it. */
  c.fillStyle = '#d8cfbc'; c.beginPath(); c.ellipse(150, 164, 48, 43, -0.25, 0, TAU); c.fill();
  c.fillStyle = '#9d6a5a'; c.beginPath(); c.moveTo(135, 162); c.quadraticCurveTo(116, 130, 127, 91); c.quadraticCurveTo(147, 70, 169, 91); c.quadraticCurveTo(169, 129, 157, 165); c.closePath(); c.fill();
  c.fillStyle = '#a87563'; c.beginPath(); c.ellipse(140, 84, 31, 28, -0.2, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(85,43,38,0.55)'; c.lineWidth = 2;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(122, 76 + i * 7); c.quadraticCurveTo(141, 68 + i * 8, 158, 78 + i * 7); c.stroke(); }
  birdB1HookBill(c, 112, 88, 1.10, '#605448'); birdB1Eye(c, 129, 76, 5.5, '#2b211d');
}

function birdB1Secretary(c: Ctx): void {
  ground(c, 222, 386, 102);
  for (const x of [201, 250]) {
    c.fillStyle = '#d98346'; c.beginPath(); c.moveTo(x - 7, 231); c.lineTo(x - 5, 367); c.lineTo(x + 8, 367); c.lineTo(x + 9, 231); c.closePath(); c.fill();
    c.strokeStyle = '#2d2c30'; c.lineWidth = 6; c.lineCap = 'round';
    for (const s of [-1, 0, 1]) { c.beginPath(); c.moveTo(x + 2, 367); c.quadraticCurveTo(x + s * 13, 374, x + s * 28, 376); c.stroke(); }
  }
  c.fillStyle = birdB1Gradient(c, 213, 210, 104, '#d8d7d2', '#8a8a87', '#45474c');
  c.beginPath(); c.moveTo(147, 158); c.quadraticCurveTo(190, 130, 258, 150); c.quadraticCurveTo(300, 182, 279, 248);
  c.quadraticCurveTo(225, 283, 158, 246); c.quadraticCurveTo(128, 209, 147, 158); c.closePath(); c.fill();
  birdB1FoldedWing(c, 223, 211, 113, 91, '#76787c', '#35373c', true);
  c.fillStyle = '#d1d0cb'; c.beginPath(); c.moveTo(153, 184); c.quadraticCurveTo(130, 136, 141, 92); c.lineTo(177, 92); c.quadraticCurveTo(188, 144, 180, 185); c.closePath(); c.fill();
  /* Long crown quills leave one buried root but separate into a loose spray.
     Filled, tapered feathers keep the crest from collapsing into one rigid
     ribbon at actual-thumb scale. */
  c.fillStyle = '#22252a';
  for (const [rx, ry, cx, cy, tx, ty, half] of [
    [163, 88, 183, 57, 214, 43, 3.8], [165, 89, 193, 52, 232, 36, 4.1],
    [166, 91, 203, 56, 251, 43, 4.3], [167, 94, 209, 65, 267, 59, 4.5],
    [168, 97, 211, 76, 273, 78, 4.2], [168, 100, 207, 88, 263, 96, 3.9],
    [167, 103, 199, 99, 246, 111, 3.5]
  ] as const) {
    c.beginPath(); c.moveTo(rx, ry - half);
    c.quadraticCurveTo(cx, cy - half * 0.45, tx, ty);
    c.quadraticCurveTo(cx, cy + half * 0.70, rx, ry + half); c.closePath(); c.fill();
  }
  c.fillStyle = '#e07e42'; c.beginPath(); c.ellipse(143, 84, 31, 28, -0.15, 0, TAU); c.fill();
  c.fillStyle = '#d1d0cb'; c.beginPath(); c.arc(157, 72, 23, 0, TAU); c.fill();
  birdB1HookBill(c, 120, 82, 0.72, '#45413c'); birdB1Eye(c, 142, 69, 5.5, '#d5ad37');
}

function birdB1Owl(c: Ctx, kind: 'Owl' | 'Desert Owl' | 'Snowy Owl'): void {
  const snowy = kind === 'Snowy Owl', desert = kind === 'Desert Owl';
  const base = snowy ? '#f0f1ef' : desert ? '#c6a777' : '#76634b';
  const dark = snowy ? '#90979e' : desert ? '#6d5237' : '#3c332b';
  const light = snowy ? '#ffffff' : desert ? '#ead4a7' : '#bca681';
  ground(c, 220, 373, 111);
  /* Barrel and head share the same outline; the face is plumage, not a mask. */
  c.fillStyle = birdB1Gradient(c, 184, 174, 143, light, base, dark);
  c.beginPath(); c.moveTo(145, 105);
  if (!snowy) { c.lineTo(161, 66); c.lineTo(184, 101); }
  c.quadraticCurveTo(220, 73, 256, 101);
  if (!snowy) { c.lineTo(279, 66); c.lineTo(295, 105); }
  c.quadraticCurveTo(323, 172, 303, 282); c.quadraticCurveTo(289, 345, 247, 357);
  c.quadraticCurveTo(220, 369, 193, 357); c.quadraticCurveTo(151, 345, 137, 282);
  c.quadraticCurveTo(117, 172, 145, 105); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(42,34,27,0.36)'; c.lineWidth = 3;
  for (const s of [-1, 1] as const) for (let i = 0; i < 5; i++) {
    c.beginPath(); c.moveTo(220 + s * 18, 205 + i * 17); c.quadraticCurveTo(220 + s * 61, 190 + i * 19, 220 + s * 78, 242 + i * 14); c.stroke();
  }
  c.fillStyle = snowy ? '#fbfcfb' : desert ? '#ecd5aa' : '#c2a986';
  c.beginPath(); c.moveTo(220, 111); c.bezierCurveTo(178, 73, 131, 112, 148, 174);
  c.bezierCurveTo(164, 223, 204, 217, 220, 188); c.bezierCurveTo(236, 217, 276, 223, 292, 174);
  c.bezierCurveTo(309, 112, 262, 73, 220, 111); c.closePath(); c.fill();
  /* Visible concentric feather fans make a flat facial disc at thumbnail size. */
  c.strokeStyle = snowy ? 'rgba(113,122,132,0.38)' : 'rgba(65,47,34,0.48)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(220, 148, 74, 62, 0, 0, TAU); c.stroke();
  for (const x of [188, 252]) birdB1Eye(c, x, 144, 13, snowy ? '#f1c72d' : '#d4a730');
  c.fillStyle = '#34302a'; c.beginPath(); c.moveTo(212, 166); c.quadraticCurveTo(220, 179, 228, 166); c.lineTo(220, 185); c.closePath(); c.fill();
  /* Snowshoe-like feather masses hide nearly all of the feet. */
  for (const x of [188, 252]) {
    c.fillStyle = light; c.beginPath(); c.ellipse(x, 344, 31, 26, 0, 0, TAU); c.fill();
    c.fillStyle = base; for (const dx of [-13, 0, 13]) { c.beginPath(); c.ellipse(x + dx, 359, 12, 7, 0, 0, TAU); c.fill(); }
  }
  if (snowy) {
    c.fillStyle = 'rgba(72,78,86,0.48)';
    for (const [x,y] of [[170,229],[205,244],[251,232],[282,261],[183,291],[239,307],[270,325]] as const) { c.beginPath(); c.ellipse(x,y,8,4,0.2,0,TAU); c.fill(); }
  }
}

function birdB1Cassowary(c: Ctx): void {
  ground(c, 221, 388, 112);
  for (const x of [194, 250]) {
    c.fillStyle = '#77716a'; c.beginPath(); c.moveTo(x - 9, 286); c.lineTo(x - 7, 370); c.lineTo(x + 10, 370); c.lineTo(x + 12, 286); c.closePath(); c.fill();
    c.strokeStyle = '#3c3733'; c.lineWidth = 6; c.lineCap = 'round';
    for (const s of [-1, 0, 1]) { c.beginPath(); c.moveTo(x + 2, 370); c.lineTo(x + s * 26, 380); c.stroke(); }
  }
  c.fillStyle = birdB1Gradient(c, 188, 228, 142, '#52575d', '#20252a', '#0d1014');
  c.beginPath(); c.moveTo(126, 193); c.quadraticCurveTo(171, 138, 266, 165); c.quadraticCurveTo(325, 193, 307, 275);
  c.quadraticCurveTo(283, 337, 194, 330); c.quadraticCurveTo(116, 323, 111, 252); c.quadraticCurveTo(108, 216, 126, 193); c.closePath(); c.fill();
  /* Hair-like plumage breaks the outline continuously instead of dot texture. */
  c.strokeStyle = '#15191e'; c.lineWidth = 6; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const a = -0.1 + i * 0.19; c.beginPath(); c.moveTo(205 + Math.cos(a) * 91, 240 + Math.sin(a) * 75); c.lineTo(205 + Math.cos(a) * 111, 248 + Math.sin(a) * 93); c.stroke(); }
  c.fillStyle = '#2773a4'; c.beginPath(); c.moveTo(247, 202); c.quadraticCurveTo(263, 141, 265, 98); c.lineTo(300, 98); c.quadraticCurveTo(302, 153, 284, 209); c.closePath(); c.fill();
  c.fillStyle = '#257db3'; c.beginPath(); c.ellipse(282, 89, 29, 25, -0.1, 0, TAU); c.fill();
  c.fillStyle = '#c99c47'; c.beginPath(); c.moveTo(259, 72); c.quadraticCurveTo(258, 30, 283, 18); c.quadraticCurveTo(314, 35, 310, 78); c.quadraticCurveTo(284, 66, 259, 72); c.closePath(); c.fill();
  c.fillStyle = '#c43d33';
  for (const x of [270, 289]) { c.beginPath(); c.moveTo(x, 111); c.quadraticCurveTo(x - 9, 151, x + 3, 180); c.quadraticCurveTo(x + 17, 145, x + 11, 112); c.closePath(); c.fill(); }
  c.fillStyle = '#423c34'; c.beginPath(); c.moveTo(304, 87); c.lineTo(337, 98); c.lineTo(304, 103); c.closePath(); c.fill();
  birdB1Eye(c, 291, 80, 4.8, '#51321e');
}

function birdB1Kakapo(c: Ctx): void {
  ground(c, 220, 371, 114);
  c.fillStyle = birdB1Gradient(c, 180, 205, 141, '#b8c77d', '#66823c', '#2f4827');
  c.beginPath(); c.moveTo(154, 111); c.quadraticCurveTo(220, 69, 286, 117); c.quadraticCurveTo(332, 173, 308, 279);
  c.quadraticCurveTo(293, 350, 220, 358); c.quadraticCurveTo(147, 350, 132, 279); c.quadraticCurveTo(108, 175, 154, 111); c.closePath(); c.fill();
  birdB1FoldedWing(c, 239, 237, 116, 105, '#718a43', '#304827');
  c.fillStyle = '#9eaa67';
  c.beginPath(); c.moveTo(220, 104); c.bezierCurveTo(172, 65, 130, 108, 153, 168); c.bezierCurveTo(176, 202, 205, 188, 220, 167);
  c.bezierCurveTo(235, 188, 264, 202, 287, 168); c.bezierCurveTo(310, 108, 268, 65, 220, 104); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(232,224,172,0.72)'; c.lineWidth = 2.4;
  for (const s of [-1, 1] as const) for (let i = 0; i < 7; i++) {
    const y = 125 + i * 7; c.beginPath(); c.moveTo(220 + s * 18, 145); c.quadraticCurveTo(220 + s * (42 + i * 3), y, 220 + s * (49 + i * 2), y + 14); c.stroke();
  }
  birdB1Eye(c, 188, 132, 9, '#72511f'); birdB1Eye(c, 252, 132, 9, '#72511f');
  /* Frontal parrot bill: broad cere, deep hooked culmen and centered tip. */
  c.fillStyle = '#c4b59c'; c.beginPath(); c.ellipse(220, 157, 25, 15, 0, 0, TAU); c.fill();
  c.fillStyle = '#82745f';
  c.beginPath(); c.moveTo(199, 158); c.quadraticCurveTo(220, 145, 241, 158);
  c.quadraticCurveTo(241, 185, 220, 199); c.quadraticCurveTo(226, 178, 199, 172); c.closePath(); c.fill();
  c.fillStyle = '#3c352d'; for (const x of [211, 229]) { c.beginPath(); c.arc(x, 155, 2.2, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(32,49,27,0.74)';
  for (const [x,y] of [[166,213],[196,235],[245,211],[276,251],[181,286],[232,305],[274,318],[145,262]] as const) { c.beginPath(); c.ellipse(x,y,10,6,-0.3,0,TAU); c.fill(); }
  for (const x of [185, 251]) birdB1TalonedFoot(c, x, 347, 0.62, '#82755e');
}

function birdB1TallGround(c: Ctx, kind: 'Rhea' | 'Bustard' | 'Seriema' | 'Screamer'): void {
  const rhea = kind === 'Rhea', bustard = kind === 'Bustard', seriema = kind === 'Seriema', screamer = kind === 'Screamer';
  const base = rhea ? '#8c8172' : bustard ? '#a58d67' : seriema ? '#aa9878' : '#6e675d';
  const dark = rhea ? '#4e4944' : bustard ? '#5a4735' : seriema ? '#5d503c' : '#343432';
  const leg = seriema ? '#c85f4e' : screamer ? '#9b7163' : '#b69b76';
  ground(c, 220, 385, 111);
  const bodyY = screamer ? 246 : 230, legTop = screamer ? 280 : 258;
  for (const x of [202, 250]) {
    c.fillStyle = leg; c.beginPath(); c.moveTo(x - 7, legTop); c.lineTo(x - 6, 369); c.lineTo(x + 7, 369); c.lineTo(x + 9, legTop); c.closePath(); c.fill();
    c.strokeStyle = dark; c.lineWidth = 5; c.lineCap = 'round';
    for (const s of [-1, 0, 1]) { c.beginPath(); c.moveTo(x, 369); c.lineTo(x + s * 22, 378); c.stroke(); }
  }
  if (seriema) {
    c.fillStyle = dark; c.beginPath(); c.moveTo(283, 222); c.quadraticCurveTo(345, 237, 397, 291); c.lineTo(377, 309); c.quadraticCurveTo(326, 274, 272, 256); c.closePath(); c.fill();
  }
  c.fillStyle = birdB1Gradient(c, 184, bodyY - 34, 125, '#d2c3a8', base, dark);
  c.beginPath(); c.moveTo(124, bodyY - 43); c.quadraticCurveTo(174, bodyY - 91, 270, bodyY - 60);
  c.quadraticCurveTo(328, bodyY - 28, 310, bodyY + 40); c.quadraticCurveTo(271, bodyY + 87, 182, bodyY + 66);
  c.quadraticCurveTo(117, bodyY + 49, 110, bodyY - 2); c.quadraticCurveTo(108, bodyY - 24, 124, bodyY - 43); c.closePath(); c.fill();
  if (rhea) {
    /* A rhea's vestigial wing is a shaggy curtain of soft, drooping feathers.
       One curved shoulder mass buries every feather root in the torso; the
       alternating tapered lobes replace the former rectangular comb. */
    c.fillStyle = birdB1Gradient(c, 177, 221, 92, '#777067', dark, '#33312f');
    c.beginPath(); c.moveTo(145, 216); c.bezierCurveTo(176, 187, 240, 190, 282, 221);
    c.quadraticCurveTo(281, 247, 266, 267);
    /* The lower edge is one continuous feathered silhouette: alternating
       buried valleys and softly splayed tips, never a separate skirt. */
    c.quadraticCurveTo(280, 278, 275, 292); c.quadraticCurveTo(264, 283, 256, 272);
    c.quadraticCurveTo(265, 298, 251, 307); c.quadraticCurveTo(240, 289, 233, 276);
    c.quadraticCurveTo(239, 310, 225, 319); c.quadraticCurveTo(213, 294, 207, 279);
    c.quadraticCurveTo(206, 307, 192, 315); c.quadraticCurveTo(182, 292, 179, 274);
    c.quadraticCurveTo(172, 299, 158, 304); c.quadraticCurveTo(154, 280, 157, 263);
    c.quadraticCurveTo(144, 281, 139, 286); c.quadraticCurveTo(137, 251, 145, 216);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(207,198,184,0.38)'; c.lineWidth = 3; c.lineCap = 'round';
    for (const [x1, y1, cx, cy, x2, y2] of [
      [157,221,145,258,140,279], [178,216,164,266,158,296],
      [199,214,190,269,192,306], [220,216,215,274,225,310],
      [241,219,244,266,251,298], [260,225,270,255,275,283]
    ] as const) {
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); c.stroke();
    }
  } else {
    birdB1FoldedWing(c, 220, bodyY, screamer ? 119 : 105, screamer ? 86 : 92, base, dark);
  }
  const neckX = bustard ? 281 : rhea ? 147 : seriema ? 150 : 292;
  const neckTop = rhea ? 78 : bustard ? 84 : seriema ? 125 : 130;
  c.fillStyle = base;
  c.beginPath(); c.moveTo(neckX - 17, bodyY - 28); c.quadraticCurveTo(neckX - 22, 166, neckX - 14, neckTop);
  c.lineTo(neckX + 18, neckTop); c.quadraticCurveTo(neckX + 27, 168, neckX + 20, bodyY - 20); c.closePath(); c.fill();
  c.fillStyle = base; c.beginPath();
  if (bustard) { c.moveTo(neckX - 25, neckTop); c.lineTo(neckX + 22, neckTop - 3); c.lineTo(neckX + 29, neckTop + 20); c.quadraticCurveTo(neckX, neckTop + 35, neckX - 26, neckTop + 20); c.closePath(); }
  else c.ellipse(neckX, neckTop, screamer ? 30 : 25, screamer ? 25 : 21, -0.05, 0, TAU);
  c.fill();
  c.fillStyle = dark;
  if (rhea) { c.beginPath(); c.moveTo(neckX - 22, neckTop - 2); c.lineTo(neckX - 58, neckTop + 8); c.lineTo(neckX - 22, neckTop + 14); c.closePath(); c.fill(); }
  else if (seriema) {
    c.beginPath(); c.moveTo(neckX - 20, neckTop - 3); c.lineTo(neckX - 61, neckTop + 4); c.quadraticCurveTo(neckX - 72, neckTop + 11, neckX - 58, neckTop + 17); c.lineTo(neckX - 18, neckTop + 13); c.closePath(); c.fill();
    /* The crest rises from the bill base as irregular bristles. Its upright
       fan stays on a different axis from the bill, so it cannot read as a
       second rigid beak. */
    c.strokeStyle = '#514431'; c.lineWidth = 4.5; c.lineCap = 'round';
    for (const [rx, ry, cx, cy, tx, ty] of [
      [130,119,122,91,118,71], [133,117,130,83,131,58], [136,116,139,82,145,54],
      [139,116,148,84,158,62], [142,117,157,91,174,74], [145,119,164,99,183,90],
      [147,121,166,108,187,105]
    ] as const) {
      c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo(cx, cy, tx, ty); c.stroke();
    }
  } else {
    c.beginPath(); c.moveTo(neckX - 22, neckTop); c.lineTo(neckX - 48, neckTop + 7); c.lineTo(neckX - 20, neckTop + 16); c.closePath(); c.fill();
  }
  if (screamer) {
    /* Horn and wing spurs break the outer silhouette at different axes. */
    c.strokeStyle = '#d8c59e'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(neckX - 2, neckTop - 17); c.quadraticCurveTo(neckX + 8, neckTop - 55, neckX - 8, neckTop - 70); c.stroke();
    c.fillStyle = '#d7c5a0';
    for (const s of [-1, 1] as const) { c.beginPath(); c.moveTo(220 + s * 47, bodyY - 8); c.lineTo(220 + s * 78, bodyY - 35); c.lineTo(220 + s * 55, bodyY + 1); c.closePath(); c.fill(); }
  }
  birdB1Eye(c, neckX - 8, neckTop - 4, 4.8, '#c7a12b');
}

function birdB1Woodpecker(c: Ctx): void {
  ground(c, 207, 382, 98);
  /* The trunk sits behind every contact point. */
  c.fillStyle = '#60412d'; c.beginPath(); c.moveTo(74, 35); c.lineTo(131, 35); c.lineTo(145, 394); c.lineTo(66, 394); c.closePath(); c.fill();
  c.strokeStyle = '#9a7651'; c.lineWidth = 5;
  for (let y = 56; y < 370; y += 34) { c.beginPath(); c.moveTo(82, y); c.quadraticCurveTo(103, y + 10, 128, y - 3); c.stroke(); }
  /* Stiff tail is rooted in the rump and visibly braces against the trunk. */
  c.fillStyle = '#8a8177';
  for (let i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(176 + i * 8, 272 + i * 6); c.quadraticCurveTo(151 + i * 2, 314, 113, 350 - i * 9);
    c.lineTo(126, 360 - i * 9); c.quadraticCurveTo(160 + i * 3, 326, 195 + i * 4, 314 + i * 4); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(236,230,216,0.58)'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(183, 282); c.lineTo(120, 352); c.stroke();
  c.fillStyle = birdB1Gradient(c, 201, 214, 105, '#8b8276', '#302f32', '#17181d');
  c.beginPath(); c.moveTo(158, 142); c.quadraticCurveTo(219, 115, 263, 168); c.quadraticCurveTo(287, 230, 246, 310);
  c.quadraticCurveTo(195, 334, 153, 282); c.quadraticCurveTo(130, 213, 158, 142); c.closePath(); c.fill();
  birdB1FoldedWing(c, 215, 226, 84, 104, '#4a4849', '#1b1c20');
  c.fillStyle = '#c9342f'; c.beginPath(); c.moveTo(146, 138); c.quadraticCurveTo(147, 91, 187, 82); c.lineTo(200, 130); c.closePath(); c.fill();
  c.fillStyle = '#3a3734'; c.beginPath(); c.arc(167, 137, 40, 0, TAU); c.fill();
  /* Straight chisel meets the bark; it does not point into open air. */
  c.fillStyle = '#d0bea0'; c.beginPath(); c.moveTo(139, 126); c.lineTo(104, 132); c.lineTo(139, 145); c.closePath(); c.fill();
  birdB1Eye(c, 154, 126, 6, '#cab044');
  c.strokeStyle = '#8a7355'; c.lineWidth = 8; c.lineCap = 'round';
  for (const y of [212, 270]) {
    c.beginPath(); c.moveTo(159, y); c.lineTo(126, y - 11); c.stroke();
    c.beginPath(); c.moveTo(159, y); c.lineTo(125, y + 16); c.stroke();
    c.beginPath(); c.moveTo(126, y - 11); c.lineTo(111, y - 22); c.stroke();
    c.beginPath(); c.moveTo(125, y + 16); c.lineTo(109, y + 28); c.stroke();
  }
}

function birdB1Hoatzin(c: Ctx): void {
  ground(c, 225, 372, 120);
  c.fillStyle = '#3d3027'; c.beginPath(); c.moveTo(272, 273); c.quadraticCurveTo(344, 274, 407, 330); c.lineTo(365, 351); c.quadraticCurveTo(316, 324, 257, 313); c.closePath(); c.fill();
  c.fillStyle = birdB1Gradient(c, 195, 225, 130, '#b48655', '#744727', '#342a25');
  c.beginPath(); c.moveTo(135, 180); c.quadraticCurveTo(183, 133, 274, 170); c.quadraticCurveTo(328, 209, 299, 292);
  c.quadraticCurveTo(248, 340, 159, 307); c.quadraticCurveTo(105, 276, 112, 221); c.quadraticCurveTo(116, 198, 135, 180); c.closePath(); c.fill();
  c.fillStyle = '#a75b31'; c.beginPath(); c.moveTo(151, 196); c.quadraticCurveTo(222, 167, 281, 211); c.quadraticCurveTo(267, 279, 190, 292); c.quadraticCurveTo(145, 260, 151, 196); c.closePath(); c.fill();
  c.strokeStyle = '#e0ad6e'; c.lineWidth = 4;
  for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(174, 207 + i * 12); c.quadraticCurveTo(220, 194 + i * 13, 264, 221 + i * 10); c.stroke(); }
  c.fillStyle = '#8b5a37'; c.beginPath(); c.moveTo(142, 201); c.quadraticCurveTo(125, 155, 128, 121); c.lineTo(164, 119); c.quadraticCurveTo(173, 160, 169, 207); c.closePath(); c.fill();
  c.fillStyle = '#3c8ab0'; c.beginPath(); c.ellipse(132, 105, 34, 30, -0.15, 0, TAU); c.fill();
  c.fillStyle = '#9d4828';
  for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(135, 86); c.lineTo(120 + i * 7, 39 - (i % 2) * 12); c.lineTo(145, 89); c.closePath(); c.fill(); }
  c.fillStyle = '#3a2d24'; c.beginPath(); c.moveTo(106, 104); c.lineTo(72, 113); c.lineTo(108, 122); c.closePath(); c.fill();
  birdB1Eye(c, 124, 98, 7, '#d22f25');
}

function birdB1Hummingbird(c: Ctx): void {
  ground(c, 220, 379, 77);
  /* Several translucent curved sweeps occupy successive wing-beat positions.
     Their broad, overlapping shoulder roots disappear beneath the torso while
     their separated ghost tips make hovering motion survive actual-thumb scale. */
  for (const s of [-1, 1] as const) {
    c.save(); c.filter = 'blur(3px)';
    for (const [tipOut, tipY, bellyOut, bellyY, alpha] of [
      [139, 70, 55, 229, 0.17], [151, 103, 67, 238, 0.15],
      [154, 139, 78, 247, 0.14], [143, 176, 84, 254, 0.13],
      [119, 213, 76, 260, 0.11]
    ] as const) {
      c.fillStyle = `rgba(156,210,225,${alpha})`;
      c.beginPath(); c.moveTo(220 + s * 15, 198);
      c.bezierCurveTo(220 + s * 49, 158, 220 + s * (tipOut - 22), tipY - 16, 220 + s * tipOut, tipY - 8);
      c.quadraticCurveTo(220 + s * (tipOut + 8), tipY, 220 + s * tipOut, tipY + 9);
      c.bezierCurveTo(220 + s * (tipOut - 20), tipY + 24, 220 + s * bellyOut, bellyY, 220 + s * 22, 218);
      c.quadraticCurveTo(220 + s * 11, 210, 220 + s * 15, 198); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(215,243,248,0.16)'; c.lineWidth = 12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(220 + s * 32, 207); c.bezierCurveTo(220 + s * 92, 170, 220 + s * 146, 111, 220 + s * 138, 76); c.stroke();
    c.restore();
  }
  c.fillStyle = birdB1Gradient(c, 205, 218, 84, '#61c293', '#187d59', '#114238');
  c.beginPath(); c.moveTo(197, 151); c.quadraticCurveTo(241, 137, 262, 193); c.quadraticCurveTo(271, 261, 231, 310);
  c.quadraticCurveTo(187, 283, 178, 217); c.quadraticCurveTo(174, 175, 197, 151); c.closePath(); c.fill();
  c.fillStyle = '#164a3a'; c.beginPath(); c.moveTo(204, 286); c.lineTo(171, 348); c.lineTo(216, 315); c.lineTo(243, 353); c.lineTo(235, 289); c.closePath(); c.fill();
  c.fillStyle = '#248b65'; c.beginPath(); c.arc(192, 145, 38, 0, TAU); c.fill();
  /* Needle bill is comfortably longer than the head and part of its silhouette. */
  c.fillStyle = '#27272a'; c.beginPath(); c.moveTo(161, 139); c.lineTo(45, 150); c.lineTo(161, 151); c.closePath(); c.fill();
  birdB1Eye(c, 180, 135, 6.5, '#29211b');
  c.fillStyle = birdB1Gradient(c, 194, 176, 40, '#e2518a', '#9b1e66', '#35123c');
  c.beginPath(); c.moveTo(166, 161); c.quadraticCurveTo(194, 150, 225, 168); c.quadraticCurveTo(215, 211, 184, 219); c.quadraticCurveTo(163, 194, 166, 161); c.closePath(); c.fill();
  c.strokeStyle = '#5c4430'; c.lineWidth = 3.5; c.lineCap = 'round';
  for (const s of [-1, 1] as const) { c.beginPath(); c.moveTo(208 + s * 7, 295); c.quadraticCurveTo(208 + s * 11, 314, 208 + s * 19, 323); c.stroke(); }
}

/** Named whole-form B1 dispatcher. The species name is the opt-in key; no
    generic or procedural label can enter this path accidentally. */
export function faunaBirdB1(c: Ctx, g: G, p: Pal, kind: BirdB1Kind): void {
  void g; void p;
  switch (kind) {
    case 'Eagle': case 'Falcon': case 'Hawk': case 'Harpy Eagle': case 'Kestrel': birdB1PerchedRaptor(c, kind); return;
    case 'Osprey': case 'Condor': birdB1AirRaptor(c, kind); return;
    case 'Vulture': birdB1Vulture(c); return;
    case 'Secretary Bird': birdB1Secretary(c); return;
    case 'Owl': case 'Desert Owl': case 'Snowy Owl': birdB1Owl(c, kind); return;
    case 'Cassowary': birdB1Cassowary(c); return;
    case 'Kakapo': birdB1Kakapo(c); return;
    case 'Rhea': case 'Bustard': case 'Seriema': case 'Screamer': birdB1TallGround(c, kind); return;
    case 'Woodpecker': birdB1Woodpecker(c); return;
    case 'Hoatzin': birdB1Hoatzin(c); return;
    case 'Hummingbird': birdB1Hummingbird(c); return;
  }
}

/* ---------------- Wave 2c B2: water, marsh, pelagic and shore birds ----------------
   Like B1, this is a literal-name opt-in. These families depend on feet, bill
   sections, neck posture and flight outline that cannot be added safely to the
   accepted shared faunaBird route. Every feature is attached inside a single
   named whole form; procedural labels never enter this dispatcher. */
export type BirdB2Kind =
  | 'Duck' | 'Eider Duck' | 'Goose'
  | 'Flamingo' | 'Heron' | 'Bittern' | 'Egret'
  | 'Coot' | 'Moorhen' | 'Rail'
  | 'Pelican' | 'Booby' | 'Cormorant' | 'Frigatebird' | 'Gannet'
  | 'Puffin' | 'Petrel' | 'Seabird' | 'Skua' | 'Snow Petrel' | 'Tern'
  | 'Avocet' | 'Godwit' | 'Snipe' | 'Oystercatcher' | 'Sandpiper'
  | 'Grebe' | 'Loon';

function birdB2Eye(c: Ctx, x: number, y: number, r: number, iris = '#d6b23e', ring?: string): void {
  if (ring) { c.fillStyle = ring; c.beginPath(); c.arc(x, y, r * 1.55, 0, TAU); c.fill(); }
  c.fillStyle = iris; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#111318'; c.beginPath(); c.arc(x, y, r * 0.56, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x - r * 0.24, y - r * 0.28, Math.max(1.2, r * 0.20), 0, TAU); c.fill();
}

function birdB2Water(c: Ctx, y: number, x0 = 34, x1 = 406): void {
  const gg = c.createLinearGradient(0, y - 24, 0, y + 28);
  gg.addColorStop(0, 'rgba(86,164,191,0.04)'); gg.addColorStop(0.48, 'rgba(73,151,181,0.22)'); gg.addColorStop(1, 'rgba(25,88,122,0.06)');
  c.fillStyle = gg; c.beginPath(); c.moveTo(x0, y);
  c.bezierCurveTo(x0 + 72, y - 8, x0 + 116, y + 8, x0 + 184, y);
  c.bezierCurveTo(x1 - 116, y - 8, x1 - 72, y + 8, x1, y); c.lineTo(x1, y + 30); c.lineTo(x0, y + 30); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(151,220,236,0.52)'; c.lineWidth = 3; c.lineCap = 'round';
  for (const [yy, inset] of [[y, 0], [y + 14, 32], [y + 25, 70]] as const) {
    c.beginPath(); c.moveTo(x0 + inset, yy); c.bezierCurveTo(142, yy - 5, 300, yy + 5, x1 - inset, yy); c.stroke();
  }
}

function birdB2Leg(c: Ctx, x: number, hipY: number, ankleX: number, ankleY: number, footX: number, footY: number, hue: string, width = 8): void {
  c.strokeStyle = hue; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = width; c.beginPath(); c.moveTo(x, hipY); c.quadraticCurveTo(x + (ankleX - x) * 0.42, hipY + (ankleY - hipY) * 0.56, ankleX, ankleY); c.stroke();
  c.lineWidth = width * 0.68; c.beginPath(); c.moveTo(ankleX, ankleY); c.quadraticCurveTo(ankleX + (footX - ankleX) * 0.48, ankleY + (footY - ankleY) * 0.52, footX, footY); c.stroke();
}

function birdB2WebFoot(c: Ctx, x: number, y: number, scale: number, hue: string, flip = false): void {
  const d = flip ? -1 : 1;
  c.save(); c.translate(x, y); c.scale(d * scale, scale);
  const fg = c.createLinearGradient(-24, -5, 26, 16); fg.addColorStop(0, hue); fg.addColorStop(1, '#704331');
  c.fillStyle = fg;
  c.beginPath(); c.moveTo(-5, -8); c.quadraticCurveTo(-13, 2, -27, 15);
  c.quadraticCurveTo(-14, 17, -4, 12); c.quadraticCurveTo(5, 20, 23, 16);
  c.quadraticCurveTo(13, 5, 7, -7); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,236,188,0.42)'; c.lineWidth = 1.8;
  for (const tx of [-18, -2, 16]) { c.beginPath(); c.moveTo(0, -5); c.lineTo(tx, 14); c.stroke(); }
  c.restore();
}

function birdB2LobedFoot(c: Ctx, x: number, y: number, scale: number, hue: string): void {
  c.save(); c.translate(x, y); c.scale(scale, scale); c.lineCap = 'round';
  c.strokeStyle = hue; c.lineWidth = 5.5;
  for (const [tx, ty] of [[-37, 9], [-17, 20], [6, 22], [28, 12]] as const) {
    c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(tx * 0.42, 1, tx, ty); c.stroke();
    c.fillStyle = hue;
    for (let i = 1; i <= 3; i++) {
      const u = i / 3, xx = tx * u, yy = -9 + (ty + 9) * u;
      c.beginPath(); c.ellipse(xx, yy, 7.6, 4.8, Math.atan2(ty + 9, tx), 0, TAU); c.fill();
    }
  }
  c.restore();
}

function birdB2FoldedWing(c: Ctx, x: number, y: number, w: number, h: number, light: string, base: string, dark: string, tip = dark): void {
  c.fillStyle = birdB1Gradient(c, x, y, Math.max(w, h) * 0.72, light, base, dark);
  c.beginPath(); c.moveTo(x - w * 0.48, y - h * 0.38); c.quadraticCurveTo(x + w * 0.14, y - h * 0.68, x + w * 0.48, y - h * 0.08);
  c.quadraticCurveTo(x + w * 0.30, y + h * 0.52, x - w * 0.34, y + h * 0.45); c.quadraticCurveTo(x - w * 0.56, y + h * 0.10, x - w * 0.48, y - h * 0.38); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(239,239,230,0.35)'; c.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const yy = y - h * 0.16 + i * h * 0.13; c.beginPath(); c.moveTo(x - w * 0.28, yy); c.quadraticCurveTo(x + w * 0.08, yy + h * 0.10, x + w * 0.31, yy + h * 0.22); c.stroke(); }
  c.fillStyle = tip; c.beginPath(); c.moveTo(x + w * 0.16, y + h * 0.22); c.lineTo(x + w * 0.50, y + h * 0.48); c.lineTo(x + w * 0.27, y + h * 0.06); c.closePath(); c.fill();
}

function birdB2Waterfowl(c: Ctx, kind: 'Duck' | 'Eider Duck' | 'Goose'): void {
  const goose = kind === 'Goose', eider = kind === 'Eider Duck';
  const footHue = goose ? '#393a36' : '#dc7839';
  if (!eider) {
    ground(c, 246, 371, goose ? 150 : 132);
    for (const [x, flip] of (goose ? [[286, false], [320, true]] : [[270, false], [309, true]]) as [number, boolean][]) {
      birdB2Leg(c, x, goose ? 276 : 274, x + 7, 326, x - 2, 350, footHue, goose ? 9 : 8);
      birdB2WebFoot(c, x - 2, 356, goose ? 1.25 : 1.10, footHue, flip);
    }
  }
  const bodyLight = goose ? '#c3b08f' : eider ? '#f5f3ec' : '#b7b4a5';
  const bodyBase = goose ? '#8d7658' : eider ? '#deded9' : '#817e72';
  const bodyDark = goose ? '#4b4033' : eider ? '#22262d' : '#4a493f';
  c.fillStyle = birdB1Gradient(c, 250, 247, 150, bodyLight, bodyBase, bodyDark);
  c.beginPath(); c.moveTo(goose ? 169 : 126, 224); c.quadraticCurveTo(230, 181, 337, 207); c.quadraticCurveTo(401, 230, 390, 287);
  c.quadraticCurveTo(346, 324, 224, 309); c.quadraticCurveTo(143, 304, goose ? 154 : 114, 264); c.quadraticCurveTo(107, 241, goose ? 169 : 126, 224); c.closePath(); c.fill();
  birdB2FoldedWing(c, 283, 250, eider ? 134 : 143, 99, eider ? '#f5f5ef' : '#b9aa8d', eider ? '#343940' : goose ? '#75624c' : '#66675d', '#343437', eider ? '#181c23' : '#33352f');
  if (eider) {
    /* Bill, forehead and crown share one unbroken wedge silhouette. */
    c.fillStyle = birdB1Gradient(c, 142, 175, 82, '#f3f3ee', '#d9dedc', '#6f7778');
    c.beginPath(); c.moveTo(62, 184); c.lineTo(133, 148); c.quadraticCurveTo(172, 126, 202, 151); c.quadraticCurveTo(222, 179, 200, 215);
    c.quadraticCurveTo(164, 234, 127, 211); c.lineTo(62, 194); c.closePath(); c.fill();
    c.fillStyle = '#b7a459'; c.beginPath(); c.moveTo(62, 184); c.lineTo(135, 150); c.lineTo(127, 211); c.lineTo(62, 194); c.closePath(); c.fill();
    c.fillStyle = '#202329'; c.beginPath(); c.moveTo(132, 148); c.quadraticCurveTo(167, 126, 200, 151); c.lineTo(187, 167); c.quadraticCurveTo(154, 151, 132, 164); c.closePath(); c.fill();
    c.fillStyle = '#9bc1a6'; c.beginPath(); c.ellipse(192, 186, 22, 30, -0.35, 0, TAU); c.fill();
    c.fillStyle = '#20242a'; c.beginPath(); c.ellipse(248, 286, 106, 25, 0, 0, TAU); c.fill();
    birdB2Eye(c, 133, 176, 5.6, '#7d6d48');
  } else if (goose) {
    c.strokeStyle = '#272b2b'; c.lineCap = 'round'; c.lineWidth = 56;
    c.beginPath(); c.moveTo(184, 245); c.bezierCurveTo(178, 207, 163, 161, 151, 126); c.stroke();
    c.fillStyle = '#242829'; c.beginPath(); c.ellipse(143, 105, 45, 39, -0.14, 0, TAU); c.fill();
    c.fillStyle = '#f1eee4'; c.beginPath(); c.moveTo(111, 108); c.quadraticCurveTo(138, 121, 173, 111); c.lineTo(166, 129); c.quadraticCurveTo(135, 136, 113, 120); c.closePath(); c.fill();
    c.fillStyle = '#353a38'; c.beginPath(); c.moveTo(106, 98); c.quadraticCurveTo(78, 91, 60, 104); c.quadraticCurveTo(78, 119, 110, 113); c.closePath(); c.fill();
    birdB2Eye(c, 126, 94, 5.7, '#5b4c2d');
  } else {
    c.fillStyle = '#174f46'; c.beginPath(); c.ellipse(145, 184, 52, 48, -0.15, 0, TAU); c.fill();
    c.fillStyle = '#f2eee1'; c.beginPath(); c.moveTo(159, 222); c.quadraticCurveTo(178, 221, 193, 232); c.lineTo(183, 241); c.quadraticCurveTo(164, 229, 148, 228); c.closePath(); c.fill();
    c.fillStyle = '#a9663f'; c.beginPath(); c.moveTo(175, 223); c.quadraticCurveTo(215, 220, 236, 249); c.quadraticCurveTo(222, 278, 185, 287); c.closePath(); c.fill();
    c.fillStyle = '#d9b448'; c.beginPath(); c.moveTo(106, 174); c.quadraticCurveTo(67, 168, 48, 181); c.quadraticCurveTo(71, 197, 111, 191); c.closePath(); c.fill();
    c.strokeStyle = '#6a5525'; c.lineWidth = 3; c.beginPath(); c.moveTo(52, 183); c.lineTo(108, 183); c.stroke();
    birdB2Eye(c, 126, 170, 5.6, '#564428');
  }
  /* Eiders sit as heavy rafts with the belly submerged; exposed stilt legs
     invert that read.  The two other waterfowl retain their standing rig. */
  birdB2Water(c, eider ? 286 : 332, eider ? 38 : 47, 407);
}

function birdB2Flamingo(c: Ctx): void {
  ground(c, 245, 399, 125);
  for (const [x, d] of [[258, -1], [294, 1]] as const) {
    birdB2Leg(c, x, 229, x + 19, 326, x - 2 + d * 8, 391, '#d96f91', 8.5);
    c.strokeStyle = '#c45878'; c.lineWidth = 4.5; c.beginPath(); c.moveTo(x - 2 + d * 8, 391); c.lineTo(x - 26 + d * 13, 398); c.moveTo(x - 2 + d * 8, 391); c.lineTo(x + 20 + d * 7, 399); c.stroke();
  }
  c.fillStyle = birdB1Gradient(c, 282, 210, 105, '#ffc2d0', '#ec87a0', '#a73565');
  c.beginPath(); c.ellipse(284, 216, 109, 63, -0.08, 0, TAU); c.fill();
  birdB2FoldedWing(c, 306, 208, 116, 78, '#ffb6c7', '#d95b82', '#8c2858');
  c.fillStyle = '#28262d'; c.beginPath(); c.moveTo(355, 207); c.lineTo(398, 230); c.lineTo(346, 241); c.closePath(); c.fill();
  c.strokeStyle = '#8e2e5c'; c.lineWidth = 42; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(220, 210); c.bezierCurveTo(144, 222, 212, 155, 146, 137); c.bezierCurveTo(108, 126, 143, 91, 133, 75); c.stroke();
  c.strokeStyle = '#ef8eaa'; c.lineWidth = 34; c.beginPath(); c.moveTo(220, 210); c.bezierCurveTo(144, 222, 212, 155, 146, 137); c.bezierCurveTo(108, 126, 143, 91, 133, 75); c.stroke();
  c.strokeStyle = 'rgba(255,214,224,0.58)'; c.lineWidth = 6; c.beginPath(); c.moveTo(213, 199); c.bezierCurveTo(158, 205, 211, 157, 151, 130); c.stroke();
  c.fillStyle = '#f2a3b8'; c.beginPath(); c.ellipse(127, 69, 29, 24, -0.18, 0, TAU); c.fill();
  /* The bill bends at a visible mid-joint instead of forming a smooth sickle. */
  c.fillStyle = '#e8c6b5'; c.beginPath(); c.moveTo(104, 61); c.lineTo(65, 65); c.lineTo(43, 91); c.lineTo(66, 112); c.lineTo(87, 89); c.lineTo(110, 79); c.closePath(); c.fill();
  c.fillStyle = '#252329'; c.beginPath(); c.moveTo(65, 65); c.lineTo(43, 91); c.lineTo(66, 112); c.lineTo(79, 94); c.closePath(); c.fill();
  c.strokeStyle = '#795b5d'; c.lineWidth = 3; c.beginPath(); c.moveTo(66, 87); c.lineTo(92, 78); c.stroke();
  birdB2Eye(c, 116, 62, 5.2, '#58422f');
}

function birdB2Heron(c: Ctx, kind: 'Heron' | 'Egret'): void {
  const egret = kind === 'Egret';
  const bodyLight = egret ? '#ffffff' : '#b7c8d4', bodyBase = egret ? '#eceeea' : '#738b9e', bodyDark = egret ? '#aeb7b8' : '#314454';
  ground(c, 266, 395, 119);
  for (const [x, d] of [[267, -1], [301, 1]] as const) {
    birdB2Leg(c, x, 252, x + 15, 332, x - 5, 390, egret ? '#25292c' : '#786b49', 7.5);
    c.strokeStyle = egret ? '#25292c' : '#786b49'; c.lineWidth = 3.6; c.lineCap = 'round';
    for (const spread of [-28, -5, 20]) { c.beginPath(); c.moveTo(x - 5, 390); c.lineTo(x + spread + d * 4, 398); c.stroke(); }
  }
  c.fillStyle = birdB1Gradient(c, 287, 232, 111, bodyLight, bodyBase, bodyDark);
  c.beginPath(); c.moveTo(208, 197); c.quadraticCurveTo(285, 159, 365, 205); c.quadraticCurveTo(390, 240, 354, 284); c.quadraticCurveTo(278, 318, 205, 273); c.quadraticCurveTo(181, 229, 208, 197); c.closePath(); c.fill();
  birdB2FoldedWing(c, 306, 234, 127, 92, bodyLight, egret ? '#dfe3e0' : '#657f95', bodyDark);
  c.fillStyle = bodyDark; c.beginPath(); c.moveTo(351, 232); c.lineTo(408, 270); c.lineTo(350, 281); c.closePath(); c.fill();
  c.strokeStyle = bodyDark; c.lineWidth = 43; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(220, 220); c.bezierCurveTo(158, 214, 227, 163, 171, 146); c.bezierCurveTo(128, 134, 176, 105, 150, 88); c.stroke();
  c.strokeStyle = bodyBase; c.lineWidth = 35; c.beginPath(); c.moveTo(220, 220); c.bezierCurveTo(158, 214, 227, 163, 171, 146); c.bezierCurveTo(128, 134, 176, 105, 150, 88); c.stroke();
  c.strokeStyle = egret ? 'rgba(255,255,255,0.85)' : 'rgba(211,227,236,0.62)'; c.lineWidth = 6;
  c.beginPath(); c.moveTo(214, 211); c.bezierCurveTo(171, 201, 221, 164, 174, 140); c.stroke();
  c.fillStyle = bodyBase; c.beginPath(); c.ellipse(143, 82, 33, 27, -0.16, 0, TAU); c.fill();
  c.fillStyle = egret ? '#d9ad3e' : '#c9983e'; c.beginPath(); c.moveTo(116, 77); c.lineTo(38, 85); c.lineTo(116, 94); c.closePath(); c.fill();
  c.strokeStyle = egret ? '#4f4028' : '#5a4932'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(43, 85); c.lineTo(115, 86); c.stroke();
  if (!egret) {
    c.fillStyle = '#273641'; c.beginPath(); c.moveTo(116, 68); c.quadraticCurveTo(145, 48, 178, 65); c.lineTo(170, 78); c.quadraticCurveTo(140, 64, 116, 78); c.closePath(); c.fill();
    c.strokeStyle = '#263540'; c.lineWidth = 4; c.beginPath(); c.moveTo(163, 63); c.lineTo(202, 49); c.stroke();
  }
  birdB2Eye(c, 131, 75, 5.8, egret ? '#c7b135' : '#d0a130');
}

function birdB2Bittern(c: Ctx): void {
  ground(c, 230, 399, 103);
  c.strokeStyle = 'rgba(132,112,54,0.46)'; c.lineWidth = 8; c.lineCap = 'round';
  for (const [x, top] of [[62,69],[92,32],[338,52],[371,78]] as const) { c.beginPath(); c.moveTo(x, 397); c.quadraticCurveTo(x + 9, 228, x, top); c.stroke(); }
  for (const x of [207, 252]) {
    birdB2Leg(c, x, 292, x + 8, 348, x - 2, 392, '#84704c', 7);
    c.strokeStyle = '#84704c'; c.lineWidth = 3; for (const dx of [-24, 0, 22]) { c.beginPath(); c.moveTo(x - 2, 392); c.lineTo(x + dx, 399); c.stroke(); }
  }
  c.fillStyle = birdB1Gradient(c, 224, 245, 105, '#dec491', '#a67c46', '#4e3927');
  c.beginPath(); c.moveTo(162, 153); c.quadraticCurveTo(205, 114, 272, 151); c.quadraticCurveTo(310, 218, 280, 319); c.quadraticCurveTo(227, 354, 166, 313); c.quadraticCurveTo(135, 223, 162, 153); c.closePath(); c.fill();
  c.strokeStyle = '#4b3525'; c.lineWidth = 8; c.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [[174,169,182,304],[199,142,204,323],[226,137,230,320],[252,152,262,303]] as const) { c.beginPath(); c.moveTo(x0,y0); c.quadraticCurveTo((x0+x1)/2-7,(y0+y1)/2,x1,y1); c.stroke(); }
  c.fillStyle = '#b18a54'; c.beginPath(); c.ellipse(204, 119, 40, 37, 0.02, 0, TAU); c.fill();
  c.strokeStyle = '#ad8553'; c.lineWidth = 34; c.beginPath(); c.moveTo(216, 158); c.quadraticCurveTo(207, 128, 204, 105); c.stroke();
  c.fillStyle = '#c9ab76'; c.beginPath(); c.moveTo(193, 88); c.lineTo(194, 25); c.lineTo(211, 90); c.closePath(); c.fill();
  c.fillStyle = '#51402d'; c.beginPath(); c.moveTo(194, 25); c.lineTo(200, 12); c.lineTo(205, 28); c.closePath(); c.fill();
  c.fillStyle = '#3b2e23'; c.beginPath(); c.moveTo(176, 111); c.quadraticCurveTo(202, 99, 232, 110); c.lineTo(229, 120); c.quadraticCurveTo(202, 111, 179, 121); c.closePath(); c.fill();
  birdB2Eye(c, 192, 101, 5.2, '#d1b043');
}

function birdB2Rail(c: Ctx, kind: 'Coot' | 'Moorhen' | 'Rail'): void {
  const coot = kind === 'Coot', moorhen = kind === 'Moorhen';
  const legHue = coot ? '#8c9b76' : moorhen ? '#c7a43e' : '#9b7250';
  ground(c, 232, 388, 126);
  for (const [x, scale] of [[212, 1], [274, 0.92]] as const) {
    birdB2Leg(c, x, 274, x + 8, 329, x - 3, 373, legHue, coot ? 9 : 7.5);
    if (coot) birdB2LobedFoot(c, x - 3, 377, scale, legHue);
    else {
      c.strokeStyle = legHue; c.lineWidth = 4.5; c.lineCap = 'round';
      for (const [dx,dy] of [[-42,10],[-19,18],[12,18],[35,11]] as const) { c.beginPath(); c.moveTo(x - 3,373); c.quadraticCurveTo(x+dx*0.45,375,x+dx,373+dy); c.stroke(); }
    }
  }
  const light = coot ? '#626a6b' : moorhen ? '#56635d' : '#c29a66';
  const base = coot ? '#303538' : moorhen ? '#303d38' : '#816044';
  const dark = coot ? '#16191c' : moorhen ? '#19221f' : '#3b2b24';
  c.fillStyle = birdB1Gradient(c, 246, 230, 122, light, base, dark);
  if (kind === 'Rail') {
    c.beginPath(); c.moveTo(150, 173); c.quadraticCurveTo(215, 142, 303, 184); c.quadraticCurveTo(337, 224, 302, 286); c.quadraticCurveTo(231, 318, 159, 274); c.quadraticCurveTo(131, 223, 150, 173); c.closePath(); c.fill();
  } else {
    c.beginPath(); c.ellipse(247, 232, coot ? 117 : 109, coot ? 86 : 79, -0.08, 0, TAU); c.fill();
  }
  birdB2FoldedWing(c, 270, 237, 122, 84, light, base, dark);
  c.fillStyle = base; c.beginPath(); c.ellipse(150, 186, coot ? 48 : 42, coot ? 45 : 41, -0.08, 0, TAU); c.fill();
  if (coot) {
    c.fillStyle = '#f0f0e8'; c.beginPath(); c.moveTo(117,176); c.lineTo(70,187); c.lineTo(119,198); c.lineTo(137,190); c.lineTo(140,151); c.lineTo(124,156); c.closePath(); c.fill();
    birdB2Eye(c, 135, 175, 5.7, '#bd2f2c');
  } else if (moorhen) {
    c.fillStyle = '#d33c28'; c.beginPath(); c.moveTo(118,176); c.lineTo(71,184); c.lineTo(116,198); c.lineTo(139,190); c.lineTo(142,151); c.lineTo(125,156); c.closePath(); c.fill();
    c.fillStyle = '#edc43e'; c.beginPath(); c.moveTo(71,184); c.lineTo(91,179); c.lineTo(91,192); c.closePath(); c.fill();
    c.strokeStyle = '#f3f2e9'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(238,260); c.quadraticCurveTo(277,270,312,256); c.stroke();
    c.fillStyle = '#f4f2e9'; c.beginPath(); c.moveTo(332,212); c.lineTo(389,185); c.lineTo(365,235); c.lineTo(390,250); c.lineTo(337,256); c.closePath(); c.fill();
    c.fillStyle = '#26302d'; c.beginPath(); c.moveTo(331,207); c.lineTo(385,176); c.lineTo(356,226); c.closePath(); c.fill();
    birdB2Eye(c, 136, 174, 5.5, '#c99e33');
  } else {
    /* A long narrow probe curves just below the head axis; the old broad
       paddle read as a duck bill and erased the rail silhouette at 132px. */
    c.fillStyle = '#7c5a3d'; c.beginPath(); c.moveTo(120,176); c.bezierCurveTo(87,173,53,184,24,201); c.bezierCurveTo(53,202,88,208,122,197); c.closePath(); c.fill();
    c.strokeStyle = '#e4d6ae'; c.lineWidth = 5;
    for (const y of [213,229,245,261]) { c.beginPath(); c.moveTo(205,y); c.lineTo(265,y+18); c.stroke(); }
    /* The short cocked tail begins deep inside the rump so no background
       seam can open between body and tail at either evidence scale. */
    c.fillStyle = birdB1Gradient(c, 334, 194, 72, base, dark, '#241b18');
    c.beginPath(); c.moveTo(292,190); c.quadraticCurveTo(337,183,382,162);
    c.quadraticCurveTo(365,203,331,228); c.quadraticCurveTo(313,214,292,210); c.closePath(); c.fill();
    birdB2Eye(c, 136, 172, 5.2, '#7d6539');
  }
}

function birdB2Pelican(c: Ctx): void {
  ground(c, 266, 386, 140);
  for (const [x, flip] of [[264,false],[310,true]] as const) { birdB2Leg(c,x,286,x+3,330,x-2,362,'#786a55',10); birdB2WebFoot(c,x-2,370,1.18,'#8b785d',flip); }
  c.fillStyle = birdB1Gradient(c, 288, 249, 135, '#d8d4c4', '#9b9588', '#49463f');
  c.beginPath(); c.ellipse(291, 247, 132, 92, -0.08, 0, TAU); c.fill();
  birdB2FoldedWing(c, 315, 244, 148, 102, '#c7c4b8', '#7a756c', '#44413d');
  c.strokeStyle = '#5a5348'; c.lineWidth = 55; c.lineCap = 'round';
  c.beginPath(); c.moveTo(209,232); c.bezierCurveTo(164,225,214,168,174,139); c.bezierCurveTo(145,118,174,91,153,83); c.stroke();
  c.strokeStyle = '#b9ad95'; c.lineWidth = 43; c.beginPath(); c.moveTo(209,232); c.bezierCurveTo(164,225,214,168,174,139); c.bezierCurveTo(145,118,174,91,153,83); c.stroke();
  c.fillStyle = '#c7b896'; c.beginPath(); c.ellipse(143, 80, 36, 30, -0.08, 0, TAU); c.fill();
  c.fillStyle = '#b9ab80'; c.beginPath(); c.moveTo(119,70); c.lineTo(28,76); c.lineTo(119,94); c.closePath(); c.fill();
  /* Pouch and throat share the lower bill edge and disappear under the neck. */
  c.fillStyle = '#b77b5f'; c.beginPath(); c.moveTo(30,77); c.quadraticCurveTo(65,133, 139,135); c.quadraticCurveTo(154,111, 119,93); c.lineTo(30,77); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(247,207,171,0.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(42,87); c.quadraticCurveTo(78,121,132,124); c.stroke();
  birdB2Eye(c, 132, 70, 5.8, '#59452e');
}

function birdB2Cormorant(c: Ctx): void {
  ground(c, 232, 397, 148);
  /* A single stiff wedge tail continues the low horizontal torso. */
  c.fillStyle = '#1a1d21'; c.beginPath(); c.moveTo(286,257); c.lineTo(412,307); c.lineTo(290,321); c.closePath(); c.fill();
  for (const [x,d] of [[208,-1],[252,1]] as const) {
    birdB2Leg(c,x,302,x+d*3,346,x+d*7,378,'#30353a',7);
    c.strokeStyle='#30353a';c.lineWidth=3;c.lineCap='round';for(const dx of [-20,0,18]){c.beginPath();c.moveTo(x+d*7,378);c.lineTo(x+dx+d*4,390);c.stroke();}
  }
  const wing = (side: -1 | 1): void => {
    c.save(); c.translate(220, 239); c.scale(side, 1);
    c.fillStyle = birdB1Gradient(c, 105, -24, 142, '#5b5d5b', '#2a2d2f', '#121417');
    c.beginPath(); c.moveTo(7, -37); c.quadraticCurveTo(54, -101, 173, -122); c.quadraticCurveTo(205, -119, 193, -93); c.quadraticCurveTo(139, -39, 56, 23); c.quadraticCurveTo(28, 31, 7, 9); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(194,198,192,0.35)'; c.lineWidth = 4;
    for (let i=0;i<6;i++){ c.beginPath(); c.moveTo(27,-25+i*8); c.lineTo(181-i*10,-104+i*10); c.stroke(); }
    c.restore();
  };
  wing(-1); wing(1);
  c.fillStyle = birdB1Gradient(c, 227, 267, 112, '#4a4d4b', '#222529', '#101215'); c.beginPath(); c.ellipse(227,267,103,63,0.04,0,TAU); c.fill();
  c.strokeStyle='#25282b'; c.lineWidth=41; c.lineCap='round'; c.beginPath(); c.moveTo(159,251); c.bezierCurveTo(124,219,171,155,153,103); c.stroke();
  c.fillStyle='#292c2e'; c.beginPath(); c.ellipse(145,89,31,28,-0.15,0,TAU); c.fill();
  c.fillStyle='#c8903d'; c.beginPath(); c.moveTo(124,96); c.quadraticCurveTo(101,108,84,96); c.lineTo(124,82); c.closePath(); c.fill();
  c.fillStyle='#262321'; c.beginPath(); c.moveTo(86,96); c.quadraticCurveTo(74,92,78,82); c.quadraticCurveTo(86,90,96,89); c.closePath(); c.fill();
  c.fillStyle='#d7a33d'; c.beginPath(); c.ellipse(127,105,17,10,-0.2,0,TAU); c.fill();
  birdB2Eye(c,136,81,5.4,'#64a0a6');
}

function birdB2Frigate(c: Ctx): void {
  const wing = (side: -1 | 1): void => {
    c.save(); c.translate(220,205); c.scale(side,1);
    c.fillStyle=birdB1Gradient(c,108,132,175,'#4d5154','#22262b','#101216');
    c.beginPath(); c.moveTo(0,-10); c.quadraticCurveTo(65,-91,176,-150); c.quadraticCurveTo(207,-156,190,-119); c.lineTo(133,-54); c.lineTo(201,-73); c.quadraticCurveTo(149,-19,69,34); c.quadraticCurveTo(32,49,0,24); c.closePath(); c.fill();
    c.strokeStyle='rgba(184,190,194,0.30)'; c.lineWidth=3.5;
    for(let i=0;i<5;i++){c.beginPath();c.moveTo(33,0+i*6);c.lineTo(181-i*8,-131+i*16);c.stroke();}
    c.restore();
  };
  wing(-1); wing(1);
  c.fillStyle='#171a1e'; c.beginPath(); c.moveTo(195,291); c.lineTo(155,406); c.lineTo(218,325); c.lineTo(282,406); c.lineTo(246,290); c.closePath(); c.fill();
  c.fillStyle=birdB1Gradient(c,220,230,100,'#3f4447','#1d2126','#0e1013'); c.beginPath(); c.ellipse(220,229,62,101,0,0,TAU); c.fill();
  c.strokeStyle='#1e2226'; c.lineWidth=32; c.lineCap='round'; c.beginPath(); c.moveTo(205,174); c.quadraticCurveTo(180,141,165,111); c.stroke();
  c.fillStyle='#202428'; c.beginPath(); c.ellipse(157,99,29,25,-0.18,0,TAU); c.fill();
  c.fillStyle='#a8252b'; c.beginPath(); c.ellipse(179,146,43,50,-0.12,0,TAU); c.fill();
  c.strokeStyle='rgba(255,114,96,0.45)'; c.lineWidth=3; for(let i=-2;i<=2;i++){c.beginPath();c.arc(179,146,24+i*4,-1.2,1.2);c.stroke();}
  c.fillStyle='#353236'; c.beginPath(); c.moveTo(135,93); c.lineTo(96,102); c.lineTo(135,110); c.quadraticCurveTo(108,118,108,128); c.quadraticCurveTo(128,123,143,106); c.closePath(); c.fill();
  birdB2Eye(c,149,91,5.5,'#686a65');
}

function birdB2GannetBooby(c: Ctx, kind: 'Gannet' | 'Booby'): void {
  const booby=kind==='Booby', footHue=booby?'#2ba9cb':'#555b59';
  ground(c,239,394,124);
  for(const [x,flip] of [[213,false],[270,true]] as const){birdB2Leg(c,x,283,x+3,337,x-2,372,footHue,9);birdB2WebFoot(c,x-2,379,1.25,footHue,flip);}
  c.fillStyle=birdB1Gradient(c,243,238,119,booby?'#f1e5cf':'#ffffff',booby?'#b99a75':'#e8e7df',booby?'#5f4434':'#a7a9a7');
  c.beginPath();c.moveTo(178,151);c.quadraticCurveTo(250,119,330,185);c.quadraticCurveTo(358,241,319,310);c.quadraticCurveTo(247,340,177,291);c.quadraticCurveTo(146,219,178,151);c.closePath();c.fill();
  birdB2FoldedWing(c,269,235,130,121,booby?'#7b5b43':'#f2f2ec',booby?'#4d382d':'#d7d9d7',booby?'#29231f':'#252a30',booby?'#332820':'#11151a');
  if(booby){
    /* Head, forehead and long dagger are one overlapping silhouette. The
       paired forward eyes sit above and below the bill root, so both remain
       legible without turning the side-view head into a detached face badge. */
    c.fillStyle='#d9c4a0';c.beginPath();c.moveTo(199,160);c.quadraticCurveTo(215,133,201,106);c.quadraticCurveTo(184,84,153,91);c.quadraticCurveTo(145,98,141,107);c.lineTo(61,126);c.lineTo(143,145);c.quadraticCurveTo(165,170,199,160);c.closePath();c.fill();
    c.fillStyle='#596664';c.beginPath();c.moveTo(145,106);c.lineTo(61,126);c.lineTo(144,145);c.quadraticCurveTo(158,126,145,106);c.closePath();c.fill();
    c.strokeStyle='rgba(215,226,218,0.62)';c.lineWidth=2.5;c.beginPath();c.moveTo(66,126);c.lineTo(143,126);c.stroke();
    c.fillStyle='rgba(183,199,189,0.78)';c.beginPath();c.ellipse(157,110,11,8,-0.10,0,TAU);c.fill();c.beginPath();c.ellipse(178,121,10,8,0.10,0,TAU);c.fill();
    birdB2Eye(c,157,110,5.2,'#d3b647'); birdB2Eye(c,178,121,4.8,'#d3b647');
  } else {
    c.fillStyle='#e9d49f'; c.beginPath(); c.ellipse(167,128,43,40,-0.1,0,TAU); c.fill();
    c.fillStyle='#242a2d'; c.beginPath(); c.moveTo(137,119); c.lineTo(70,129); c.lineTo(138,143); c.closePath(); c.fill();
    c.fillStyle='rgba(219,185,91,0.72)';c.beginPath();c.ellipse(173,131,48,44,-0.1,0,TAU);c.fill();
    c.fillStyle='#25282b';c.beginPath();c.moveTo(129,108);c.quadraticCurveTo(163,93,199,108);c.lineTo(192,120);c.quadraticCurveTo(161,109,133,120);c.closePath();c.fill();
    birdB2Eye(c,153,111,5.6,'#7891a1');
  }
}

function birdB2Puffin(c: Ctx): void {
  ground(c,224,394,101);
  for(const [x,flip] of [[199,false],[245,true]] as const){birdB2Leg(c,x,303,x+2,345,x,372,'#e87032',9);birdB2WebFoot(c,x,380,1.18,'#e87032',flip);}
  c.fillStyle=birdB1Gradient(c,225,242,118,'#5b5d61','#23262b','#101216');c.beginPath();c.ellipse(227,244,91,125,-0.03,0,TAU);c.fill();
  c.fillStyle='#f2eee3';c.beginPath();c.ellipse(202,250,61,86,-0.12,0,TAU);c.fill();
  c.fillStyle='#24272c';c.beginPath();c.ellipse(181,126,59,56,-0.08,0,TAU);c.fill();
  c.fillStyle='#f3eee1';c.beginPath();c.ellipse(168,135,42,39,-0.12,0,TAU);c.fill();
  /* Tall lateral bill plates overlap at the face instead of hanging from it. */
  c.fillStyle='#ea6a2d';c.beginPath();c.moveTo(137,112);c.lineTo(58,137);c.lineTo(137,164);c.quadraticCurveTo(158,140,137,112);c.closePath();c.fill();
  c.fillStyle='#7394a7';c.beginPath();c.moveTo(117,119);c.lineTo(88,136);c.lineTo(118,155);c.lineTo(130,137);c.closePath();c.fill();
  c.fillStyle='#f0cf57';c.beginPath();c.moveTo(91,127);c.lineTo(69,136);c.lineTo(92,146);c.closePath();c.fill();
  c.strokeStyle='#512f2b';c.lineWidth=4;for(const x of [102,124]){c.beginPath();c.moveTo(x,118);c.lineTo(x-1,156);c.stroke();}
  birdB2Eye(c,163,122,6,'#7d6744');
  birdB2FoldedWing(c,251,248,100,104,'#55585c','#25292e','#101216');
}

function birdB2FlyingSeabird(c: Ctx, kind: 'Petrel' | 'Snow Petrel' | 'Skua' | 'Tern'): void {
  const tern=kind==='Tern', snow=kind==='Snow Petrel', skua=kind==='Skua';
  const light=tern?'#f8f8f3':snow?'#ffffff':skua?'#8a7961':'#746c62';
  const base=tern?'#d7dcdd':snow?'#edf1f0':skua?'#56483a':'#48443f';
  const dark=tern?'#70777b':snow?'#9aa3a5':skua?'#29251f':'#252522';
  const wing=(side:-1|1):void=>{
    c.save();c.translate(220,220);c.scale(side,1);c.fillStyle=birdB1Gradient(c,116,115,172,light,base,dark);
    c.beginPath();c.moveTo(4,-10);
    if(tern)c.bezierCurveTo(74,-70,142,-146,202,-177); else c.bezierCurveTo(65,-72,141,-132,201,-145);
    c.quadraticCurveTo(214, tern ? -173 : -134, 197, tern ? -156 : -118); c.bezierCurveTo(136, -65, 85, 22, 6, 31); c.closePath(); c.fill();
    c.strokeStyle='rgba(240,242,238,0.36)';c.lineWidth=3;for(let i=0;i<4;i++){c.beginPath();c.moveTo(29,i*7);c.lineTo(190-i*11,(tern?-158:-127)+i*17);c.stroke();}
    if(skua){c.fillStyle='#f4f1df';c.beginPath();c.moveTo(112,-88);c.lineTo(161,-124);c.lineTo(142,-80);c.lineTo(101,-45);c.closePath();c.fill();}
    if(snow){c.strokeStyle='#32383b';c.lineWidth=5;c.beginPath();c.moveTo(137,-91);c.lineTo(198,-135);c.stroke();}
    c.restore();
  };
  wing(-1);wing(1);
  c.fillStyle=dark;c.beginPath();
  if(tern){c.moveTo(198,279);c.lineTo(161,388);c.lineTo(220,315);c.lineTo(279,388);c.lineTo(242,279);}else{c.moveTo(198,278);c.lineTo(188,350);c.lineTo(220,316);c.lineTo(252,350);c.lineTo(242,278);}c.closePath();c.fill();
  c.fillStyle=birdB1Gradient(c,220,234,95,light,base,dark);c.beginPath();c.ellipse(220,232,skua?72:tern?46:57,tern?92:102,0,0,TAU);c.fill();
  c.fillStyle=base;c.beginPath();c.ellipse(164,178,tern?26:32,tern?25:29,-0.13,0,TAU);c.fill();
  if(tern){c.fillStyle='#171b20';c.beginPath();c.arc(163,171,28,Math.PI,TAU);c.lineTo(190,178);c.closePath();c.fill();}
  const billHue=tern?'#d94a37':snow?'#202327':skua?'#35302a':'#34302d';
  c.fillStyle=billHue;c.beginPath();
  if(snow){c.moveTo(143,171);c.lineTo(98,180);c.quadraticCurveTo(89,183,93,194);c.quadraticCurveTo(101,191,108,187);c.lineTo(143,193);}else if(!tern&&!skua){c.moveTo(143,170);c.lineTo(72,182);c.lineTo(143,194);}else{c.moveTo(141,174);c.lineTo(tern?58:94,182);c.lineTo(142,191);}c.closePath();c.fill();
  if(skua){c.beginPath();c.moveTo(96,182);c.quadraticCurveTo(84,185,90,198);c.quadraticCurveTo(101,193,108,187);c.closePath();c.fill();}
  if(skua){
    c.fillStyle=snow?'#3a3e42':'#8f8878';c.beginPath();c.roundRect(116,168,24,12,5);c.fill();
    c.fillStyle='#111418';for(const x of [122,133]){c.beginPath();c.ellipse(x,172,3.2,2.5,0,0,TAU);c.fill();}
  }else if(!tern){
    /* The nasal saddle grows from the bill's dorsal contour instead of
       arriving as a rounded rectangle pasted across the face. */
    const saddleX=snow?103:97;
    c.fillStyle=billHue;c.beginPath();c.moveTo(saddleX,181);c.quadraticCurveTo(snow?106:104,164,116,162);c.quadraticCurveTo(129,161,141,175);c.lineTo(141,188);c.quadraticCurveTo(121,182,saddleX,188);c.closePath();c.fill();
    c.fillStyle=snow?'#050709':'#111418';for(const [x,y] of [[113,169],[128,170]] as const){c.beginPath();c.ellipse(x,y,4.1,3.1,-0.08,0,TAU);c.fill();}
  }
  birdB2Eye(c,158,170,tern?5:5.6,tern?'#34302c':snow?'#4a4540':'#8b7445');
}

function birdB2Seabird(c: Ctx): void {
  ground(c,238,391,118);
  for(const [x,flip] of [[215,false],[267,true]] as const){birdB2Leg(c,x,278,x+2,333,x-2,369,'#c89848',8);birdB2WebFoot(c,x-2,377,1.12,'#c89848',flip);}
  c.fillStyle=birdB1Gradient(c,245,230,125,'#eef1f2','#aeb9c0','#4b545c');c.beginPath();c.moveTo(139,194);c.quadraticCurveTo(226,143,348,191);c.quadraticCurveTo(386,232,350,292);c.quadraticCurveTo(269,328,153,284);c.quadraticCurveTo(118,239,139,194);c.closePath();c.fill();
  birdB2FoldedWing(c,280,230,156,108,'#e3e8e9','#788793','#353d45','#252b31');
  c.fillStyle='#d9dee0';c.beginPath();c.ellipse(132,169,43,39,-0.1,0,TAU);c.fill();
  c.fillStyle='#c9a047';c.beginPath();c.moveTo(102,165);c.lineTo(52,177);c.lineTo(104,184);c.quadraticCurveTo(91,193,85,199);c.quadraticCurveTo(105,195,116,180);c.closePath();c.fill();
  birdB2Eye(c,120,159,5.6,'#b59b47');
}

function birdB2Godwit(c: Ctx): void {
  /* Both dark legs stream behind the airborne torso; their roots disappear
     beneath the belly so they cannot read as loose antennae. */
  c.strokeStyle='#4b403b';c.lineWidth=7;c.lineCap='round';
  for(const [x,y,d] of [[276,239,-1],[302,240,1]] as const){c.beginPath();c.moveTo(x,y);c.bezierCurveTo(329,y+10,363,y+24,401,y+43+d*7);c.stroke();c.lineWidth=3;for(const dy of [-8,0,8]){c.beginPath();c.moveTo(400,y+43+d*7);c.lineTo(424,y+43+d*7+dy);c.stroke();}c.lineWidth=7;}
  c.fillStyle=birdB1Gradient(c,275,142,157,'#dfad7d','#9d5b3d','#4d3028');
  c.beginPath();c.moveTo(196,205);c.quadraticCurveTo(258,126,372,76);c.quadraticCurveTo(397,72,381,101);c.quadraticCurveTo(335,160,284,231);c.quadraticCurveTo(231,248,196,224);c.closePath();c.fill();
  c.strokeStyle='rgba(248,205,154,0.50)';c.lineWidth=4;for(let i=0;i<4;i++){c.beginPath();c.moveTo(230+i*8,211);c.lineTo(365-i*8,94+i*13);c.stroke();}
  c.fillStyle=birdB1Gradient(c,244,220,119,'#e2ad7c','#aa623f','#513128');
  c.beginPath();c.moveTo(147,190);c.quadraticCurveTo(224,150,333,187);c.quadraticCurveTo(366,217,333,255);c.quadraticCurveTo(247,281,151,242);c.quadraticCurveTo(126,216,147,190);c.closePath();c.fill();
  c.fillStyle='#684034';c.beginPath();c.moveTo(316,197);c.lineTo(388,222);c.lineTo(323,245);c.closePath();c.fill();
  c.fillStyle='#b96e49';c.beginPath();c.ellipse(142,185,34,31,-0.08,0,TAU);c.fill();
  c.fillStyle='#c49378';c.beginPath();c.moveTo(118,178);c.bezierCurveTo(84,174,48,166,13,160);c.bezierCurveTo(47,171,83,190,120,195);c.closePath();c.fill();
  c.fillStyle='#473833';c.beginPath();c.moveTo(13,160);c.bezierCurveTo(35,166,58,174,79,181);c.lineTo(73,187);c.bezierCurveTo(48,174,29,167,13,166);c.closePath();c.fill();
  c.strokeStyle='#53362c';c.lineWidth=5;c.lineCap='round';
  for(const [x,y] of [[169,207],[178,221],[187,235]] as const){c.beginPath();c.moveTo(x,y);c.lineTo(x+13,y+7);c.lineTo(x+27,y);c.stroke();}
  birdB2Eye(c,153,176,5.5,'#6e5837');
}

function birdB2Snipe(c: Ctx): void {
  ground(c,246,398,116);
  for(const [x,d] of [[246,-1],[292,1]] as const){birdB2Leg(c,x,274,x+d*5,333,x-5,390,'#8f7651',6.5);c.strokeStyle='#8f7651';c.lineWidth=3;for(const dx of [-23,-2,20]){c.beginPath();c.moveTo(x-5,390);c.lineTo(x+dx+d*2,399);c.stroke();}}
  c.fillStyle=birdB1Gradient(c,271,229,116,'#c4a06a','#765535','#342921');
  c.beginPath();c.moveTo(153,200);c.quadraticCurveTo(231,153,354,194);c.quadraticCurveTo(386,229,348,276);c.quadraticCurveTo(266,311,158,278);c.quadraticCurveTo(127,239,153,200);c.closePath();c.fill();
  birdB2FoldedWing(c,288,232,132,84,'#c4a06a','#765535','#342921');
  c.fillStyle='#4a3528';c.beginPath();c.moveTo(338,203);c.lineTo(402,181);c.lineTo(366,231);c.closePath();c.fill();
  c.fillStyle='#765535';c.beginPath();c.ellipse(164,187,33,31,-0.06,0,TAU);c.fill();
  c.fillStyle='#5b4430';c.beginPath();c.moveTo(138,181);c.lineTo(8,187);c.lineTo(138,194);c.closePath();c.fill();
  c.strokeStyle='#e4ca8c';c.lineCap='round';c.lineWidth=6;
  c.beginPath();c.moveTo(143,172);c.quadraticCurveTo(161,157,184,165);c.stroke();
  c.beginPath();c.moveTo(145,181);c.quadraticCurveTo(165,168,185,176);c.stroke();
  c.lineWidth=7;for(const [y0,y1] of [[194,220],[207,236],[220,252]] as const){c.beginPath();c.moveTo(190,y0);c.quadraticCurveTo(257,y0-19,329,y1);c.stroke();}
  birdB2Eye(c,179,176,5.8,'#4b3b29');
}

function birdB2Shorebird(c: Ctx, kind: 'Avocet' | 'Oystercatcher' | 'Sandpiper'): void {
  const avocet=kind==='Avocet',oyster=kind==='Oystercatcher',sand=kind==='Sandpiper';
  const legHue=avocet?'#778e9a':oyster?'#cf8a8d':'#9a8052';
  const hipY=sand?270:248,groundY=sand?354:389,ankleY=sand?318:326;
  ground(c,238,sand?366:397,117);
  for(const [x,d] of [[222,-1],[268,1]] as const){birdB2Leg(c,x,hipY,x+(sand?17:8),ankleY,x-4,groundY,legHue,avocet?7.5:6.5);c.strokeStyle=legHue;c.lineWidth=3;c.lineCap='round';for(const dx of [-24,-2,20]){c.beginPath();c.moveTo(x-4,groundY);c.lineTo(x+dx+d*2,groundY+9);c.stroke();}}
  const light=avocet?'#ffffff':oyster?'#4c4a48':'#baa47d';
  const base=avocet?'#e4e6e4':oyster?'#202429':'#89714e';
  const dark=avocet?'#1a2027':oyster?'#111418':'#42372b';
  c.fillStyle=birdB1Gradient(c,250,231,111,light,base,dark);
  c.beginPath();c.moveTo(132,193);c.quadraticCurveTo(222,151,336,195);c.quadraticCurveTo(369,232,337,278);c.quadraticCurveTo(260,313,150,279);c.quadraticCurveTo(119,239,132,193);c.closePath();c.fill();
  birdB2FoldedWing(c,273,232,128,82,light,base,dark);
  c.fillStyle=base;c.beginPath();c.ellipse(136,180,35,32,-0.08,0,TAU);c.fill();
  if(avocet){
    /* A narrow continuous recurved bill: nearly level at the face, then a
       decisive rising sweep to the fine tip instead of a straight spike. */
    c.fillStyle='#1b2026';c.beginPath();c.moveTo(141,174);
    c.bezierCurveTo(111,177,82,164,57,138);c.quadraticCurveTo(38,118,25,92);
    c.quadraticCurveTo(43,115,64,145);c.bezierCurveTo(90,173,116,190,143,188);c.closePath();c.fill();
    c.fillStyle='#1b2026';c.beginPath();c.moveTo(171,167);c.quadraticCurveTo(227,155,297,185);c.lineTo(270,214);c.quadraticCurveTo(220,187,177,194);c.closePath();c.fill();
    birdB2Eye(c,127,170,5.2,'#6e5c3a');
  }else if(oyster){
    c.fillStyle='#f3f1e9';c.beginPath();c.moveTo(175,228);c.quadraticCurveTo(257,200,334,227);c.lineTo(326,279);c.quadraticCurveTo(246,307,179,279);c.closePath();c.fill();
    c.fillStyle='#e75d31';c.beginPath();c.moveTo(108,174);c.lineTo(31,181);c.lineTo(110,191);c.closePath();c.fill();
    birdB2Eye(c,128,168,6.2,'#f1cf42','#c83a35');
  }else{
    c.fillStyle='#68543a';c.beginPath();c.moveTo(109,176);c.lineTo(39,185);c.lineTo(110,191);c.closePath();c.fill();
    c.fillStyle='#f1eee3';for(let i=0;i<8;i++){c.beginPath();c.arc(188+(i%4)*27,238+((i/4)|0)*22,5,0,TAU);c.fill();}
    birdB2Eye(c,127,170,5.2,'#655035');
  }
}

function birdB2Diver(c: Ctx, kind: 'Grebe' | 'Loon'): void {
  const loon=kind==='Loon';
  const y=281;
  c.fillStyle=birdB1Gradient(c,250,236,145,loon?'#4a4e53':'#a98963',loon?'#20252b':'#65513d',loon?'#0c1014':'#30271f');
  c.beginPath();c.moveTo(107,221);c.quadraticCurveTo(207,174,374,219);c.quadraticCurveTo(410,250,383,286);c.quadraticCurveTo(291,311,149,289);c.quadraticCurveTo(103,273,107,221);c.closePath();c.fill();
  if(loon){
    c.fillStyle='#f0f1ee';for(let row=0;row<4;row++){for(let col=0;col<6;col++){const x=230+col*23+(row%2)*10,y0=205+row*17;c.fillRect(x,y0,11,9);}}
    c.strokeStyle='#f0f1ee';c.lineWidth=5;for(const yy of [172,184,196]){c.beginPath();c.moveTo(130,yy);c.lineTo(182,yy+7);c.stroke();}
    c.fillStyle='#171b20';c.beginPath();c.ellipse(121,170,42,38,-0.05,0,TAU);c.fill();
    c.fillStyle='#606970';c.beginPath();c.moveTo(89,164);c.lineTo(20,173);c.lineTo(88,183);c.closePath();c.fill();
    c.strokeStyle='rgba(198,207,209,0.72)';c.lineWidth=2.4;c.beginPath();c.moveTo(86,165);c.lineTo(25,173);c.stroke();
    birdB2Eye(c,110,160,5.6,'#c33c31');
  }else{
    c.fillStyle='#6b5541';c.beginPath();c.ellipse(123,185,37,34,-0.08,0,TAU);c.fill();
    c.fillStyle='#40352d';c.beginPath();c.moveTo(96,179);c.lineTo(42,188);c.lineTo(98,194);c.closePath();c.fill();
    c.fillStyle='#d0a36d';c.beginPath();c.moveTo(121,151);c.lineTo(103,125);c.lineTo(132,144);c.lineTo(151,123);c.lineTo(145,157);c.closePath();c.fill();
    birdB2Eye(c,113,176,5.1,'#9e7d3d');
    /* Rear-set lobed foot is lifted clear of the water and remains visible. */
    birdB2Leg(c,335,260,355,292,361,315,'#71826c',6.5);birdB2LobedFoot(c,360,319,0.82,'#7f9278');
  }
  birdB2Water(c,y,34,408);
}

/** Named whole-form B2 dispatcher. */
export function faunaBirdB2(c: Ctx, g: G, p: Pal, kind: BirdB2Kind): void {
  void g; void p;
  switch(kind){
    case 'Duck': case 'Eider Duck': case 'Goose': birdB2Waterfowl(c,kind); return;
    case 'Flamingo': birdB2Flamingo(c); return;
    case 'Heron': case 'Egret': birdB2Heron(c,kind); return;
    case 'Bittern': birdB2Bittern(c); return;
    case 'Coot': case 'Moorhen': case 'Rail': birdB2Rail(c,kind); return;
    case 'Pelican': birdB2Pelican(c); return;
    case 'Cormorant': birdB2Cormorant(c); return;
    case 'Frigatebird': birdB2Frigate(c); return;
    case 'Gannet': case 'Booby': birdB2GannetBooby(c,kind); return;
    case 'Puffin': birdB2Puffin(c); return;
    case 'Petrel': case 'Snow Petrel': case 'Skua': case 'Tern': birdB2FlyingSeabird(c,kind); return;
    case 'Seabird': birdB2Seabird(c); return;
    case 'Godwit': birdB2Godwit(c); return;
    case 'Snipe': birdB2Snipe(c); return;
    case 'Avocet': case 'Oystercatcher': case 'Sandpiper': birdB2Shorebird(c,kind); return;
    case 'Grebe': case 'Loon': birdB2Diver(c,kind); return;
  }
}

const birdB1Eagle: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Eagle');
const birdB1Falcon: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Falcon');
const birdB1Hawk: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Hawk');
const birdB1HarpyEagle: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Harpy Eagle');
const birdB1SecretaryBird: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Secretary Bird');
const birdB1VulturePainter: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Vulture');
const birdB1CassowaryPainter: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Cassowary');
const birdB1KakapoPainter: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Kakapo');
const birdB1HoatzinPainter: FaunaPainter = (c, g, p) => faunaBirdB1(c, g, p, 'Hoatzin');

/** the wave-3 roster: species whose defining anatomy was categorically wrong */
export const FAUNA_NAME: Record<string, FaunaPainter> = {
  /* Blocker 4 — life stage + arthropod body plans */
  'Fly Larvae': (c, g, p) => faunaResetFlyLarva(c, g, p),
  'Cave Cricket': (c, g, p, n) => insectBody(c, g, speciesHue(p, '#9c7a54'), { abdomen: 1.1, broad: 0.84, eyes: 0.8, face: 'slant', antennae: 'long', wings: 'none', jumper: true, legSpan: 2.25 }, n),
  'Dragonfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#1e7fa8', open: true, slim: false }),
  'Damselfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#4aa8e0', open: false, slim: true, body: 1.05 }),
  'Mayfly': faunaResetMayfly,
  /* ★ WAVE 23 — Caddisfly, Stonefly and Dobsonfly went HARD look-alike: three
     drab browns on a length dial, the same defect the ants had. They are not
     alike. A caddisfly is MOTH-like with hairy wings tented over the body. */
  'Caddisfly': faunaResetCaddisfly,
  /* a stonefly holds its wings FLAT along a dark slender body */
  'Stonefly': faunaResetStonefly,
  /* a dobsonfly is BIG — the largest of these by a wide margin, pale grey,
     with long smoky wings overlapping along the back past the abdomen */
  'Dobsonfly': faunaResetDobsonfly,
  'Scorpionfly': faunaResetScorpionfly,
  'Springtail': (c, g, p) => faunaResetSpringtail(c, g, p),
  'Ladybug': faunaResetLadybug,
  'Firefly': faunaResetFirefly,
  'Diving Beetle': faunaResetDivingBeetle,
  'Dung Beetle': faunaResetDungBeetle,
  'Carrion Beetle': faunaResetCarrionBeetle,
  'Water Beetle': faunaResetWaterBeetle,
  'Beetle': (c, g, p) => faunaBeetle(c, g, p, { hue: '#96551f', }),
  'Fiddler Crab': (c, g, p) => faunaFiddler(c, g, speciesHue(p, '#c9a877')),
  /* Blocker 6 — specialist fish + marine bodies */
  /* a flounder is a small rounded diamond, heavily mottled for camouflage;
     a halibut is a long narrow torpedo-diamond and nearly plain */
  'Flounder': (c, g, p) => faunaFlatfish(c, g, speciesHue(p, '#a98a5f'), { elong: 0.94, blotch: 1.5 }),
  'Halibut': (c, g, p) => faunaFlatfish(c, g, speciesHue(p, '#7d6b4e'), { elong: 1.52, blotch: 0.35 }),
  'Angelfish': (c, g, p) => faunaAngelfish(c, g, speciesHue(p, '#f7a41c')),
  'Lionfish': (c, g, p) => faunaLionfish(c, g, speciesHue(p, '#9b3a26')),
  'Octopus': (c, g, p) => faunaResetOctopus(c, g, p, false),
  'Giant Octopus': (c, g, p) => faunaResetOctopus(c, g, p, true),
  'Squid': (c, g, p) => faunaCephalopod(c, g, p, { hue: '#d69a92', squid: true }),
  'Giant Squid': (c, g, p) => faunaCephalopod(c, g, p, { hue: '#8c2f3a', squid: true }),
  /* its row: a TINY nub dorsal set far back, and a broad flat U rostrum —
     'Whale' now takes the no-dorsal blunt form so the two are not one animal */
  'Blue Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false, hue: [92, 108, 132], long: 1.30, bulk: 0.80, throatGrooves: true }),
  'Sperm Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [86, 78, 72], long: 1.10, bulk: 1.05, melon: 0.85, squareHead: true, knuckles: true, frontBlowhole: true }),
  'Gray Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [142, 146, 140], long: 1.06, bulk: 1.00, knuckles: true, callosities: true }),
  'Right Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [46, 48, 52], long: 0.84, bulk: 1.42, melon: 0.30, archedJaw: true, callosities: true }),
  'Beluga': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [226, 228, 230], long: 0.88, bulk: 1.12, melon: 0.55, pale: true }),
  'Orca': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'tall', blunt: false, patch: true, hue: [22, 24, 30], long: 0.98, bulk: 1.08 }),
  'Dolphin': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false, hue: [124, 134, 146], long: 0.86, bulk: 0.82, beak: true, horizontalFlukes: true }),
  'River Dolphin': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false, hue: [178, 150, 148], long: 0.80, bulk: 0.70 }),
  'Pilot Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: true, hue: [30, 32, 38], long: 0.92, bulk: 1.20, melon: 1.00, throatPatch: true, forwardDorsal: true }),
  'Narwhal': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, tusk: true, melon: 0.62, hue: [168, 168, 158], long: 0.94, bulk: 0.78 }),
  /* the wing, at last — birds by bill + leg length */
  /* ★ D-ART-121 — the axes existed and the rows never set them. */
  /* ★ GOLD AUDIT — 'soaring' skips the leg loop entirely, so `talons: true`
     never drew a single talon on either eagle. Perch them: the heavy GRIP
     legs + hooks are the raptor read. */
  'Eagle': birdB1Eagle,
  'Harpy Eagle': birdB1HarpyEagle,
  /* ★ WAVE 50 — HAWK, FALCON AND OSPREY WERE ONE BIRD IN THREE HUES. Their
     rows were byte-identical apart from `hue` (Osprey added `size`), so the
     new [SHAPE] tier scores Hawk ≈ Falcon at 0.06 and Hawk ≈ Osprey at 0.25.
     This is D-ART-121 ("the large birds were all one bird") recurring on the
     raptors, and the fix is the same: the axes ALREADY EXIST and the rows
     simply never set them. Table work, not painter work.
     A buteo is broad and heavy on a wide fanned tail; a peregrine is a compact
     sleek dart with a long narrow tail; an osprey is bigger again with the
     long angled wings of a fish-hunter. */
  'Hawk': birdB1Hawk,
  'Falcon': birdB1Falcon,
  'Vulture': birdB1VulturePainter,
  'Albatross': (c, g, p, n) => faunaBird(c, g, p, { hue: '#99a0a8', legs: 0.01, bill: 'hook', wings: 'soaring', size: 1.05, tubeNostrils: true }, n),
  'Crane': (c, g, p, n) => faunaBird(c, g, p, { hue: '#a3a39b', legs: 0.13, bill: 'long', crest: true, neck: 'long', cap: '#b62d2b', tail: 'shortFan' }, n),
  'Stork': (c, g, p, n) => faunaBird(c, g, p, { hue: '#e6e2d8', legs: 0.15, bill: 'huge', neck: 'long', billHue: '#bd4035', legHue: '#bd4035' }, n),
  'Spoonbill': (c, g, p, n) => faunaBird(c, g, p, { hue: '#e2607f', legs: 0.14, bill: 'spoon', neck: 'long', legHue: '#ba6379' }, n),
  'Ibis': (c, g, p, n) => faunaBird(c, g, p, { hue: '#b8352f', legs: 0.10, bill: 'downcurve', neck: 'long', billHue: '#b8352f' }, n),
  'Toucan': (c, g, p, n) => faunaBird(c, g, p, { hue: '#1b1a1c', legs: 0.02, bill: 'toucan' }, n),
  'Kookaburra': (c, g, p, n) => faunaBird(c, g, p, { hue: '#6e5a45', legs: 0.02, bill: 'huge', headMass: 1.55, neck: 'none', size: 0.92 }, n),
  'Hornbill': (c, g, p, n) => faunaBird(c, g, p, { hue: '#2b2b30', legs: 0.02, bill: 'casque' }, n),
  'Cassowary': birdB1CassowaryPainter,
  'Ostrich': (c, g, p, n) => faunaBird(c, g, p, { legs: 0.145, bill: 'stout', flightless: true, size: 1.42, neck: 'long', hue: '#3a332e', plump: 1.10, tail: 'fan' }, n),
  'Emu': (c, g, p, n) => faunaBird(c, g, p, { legs: 0.125, bill: 'stout', flightless: true, size: 1.22, neck: 'long', hue: '#6d6154', plump: 1.14, shaggy: true }, n),
  /* a kakapo is a FAT flightless parrot: heavy bill, heavy feet, tiny wing */
  'Kakapo': birdB1KakapoPainter,
  'Secretary Bird': birdB1SecretaryBird,
  'Hoatzin': birdB1HoatzinPainter,
};
