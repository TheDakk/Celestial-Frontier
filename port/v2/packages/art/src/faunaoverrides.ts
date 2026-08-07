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
export function faunaWingedInsect(c: Ctx, g: G, pIn: Pal, opts: { open: boolean; slim: boolean; body?: number; hue?: string }): void {
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
export function faunaCetacean(c: Ctx, g: G, pIn: Pal, opts: { dorsal: 'tall' | 'small' | 'none'; blunt: boolean; hue?: [number, number, number];
    bulk?: number; long?: number; melon?: number; tusk?: boolean; patch?: boolean }): void {
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
    dark: rgbOf(_cr * 0.42, _cg * 0.44, _cb * 0.48),
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
  rim(c, () => { c.moveTo(head, cy); c.quadraticCurveTo(cx - L * (0.5 + mel * 0.28), cy - H * ((opts.blunt ? 1.5 : 1.15) + mel * 0.85), cx + L * 0.2, cy - H * 0.75); c.quadraticCurveTo(tail - L * 0.16, cy - H * 0.42, tail, cy - ped); }, 2.4);
  /* THE HORIZONTAL FLUKE — never a vertical fish tail. Scaled to the body. */
  const fw = Math.max(L * 0.22, H * 1.2), fh = Math.max(H * 0.9, L * 0.12);
  c.fillStyle = p.dark;
  c.beginPath(); c.moveTo(tail - 2, cy - ped);
  c.quadraticCurveTo(tail + fw * 0.5, cy - fh, tail + fw, cy - fh * 0.62);
  c.quadraticCurveTo(tail + fw * 0.55, cy, tail + fw, cy + fh * 0.62);
  c.quadraticCurveTo(tail + fw * 0.5, cy + fh, tail - 2, cy + ped);
  c.closePath(); c.fill();
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
  c.fillStyle = p.dark;   /* pectoral flipper */
  c.beginPath(); c.ellipse(cx - L * 0.3, cy + H * 0.85, L * 0.20, H * 0.28, 0.5, 0, TAU); c.fill();
  /* ★ D-ART-124 — THE NARWHAL'S TUSK, restored. It was lost when the species
     was rerouted onto the shared cetacean painter, whose options carry no tusk
     — so the animal kept its silhouette and lost the ONE feature anybody
     identifies it by. The audit called it correctly as a regression. */
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
    c.strokeStyle = 'rgba(120,110,88,0.45)'; c.lineWidth = 1.4;
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
  flightless?: boolean;
  /* ── wave 9 additions. All OPTIONAL and defaulted, so the wave-3 birds —
     which the reviews scored well — take exactly the code paths they took
     before (D-ART-14: never override what already excels). ── */
  size?: number;                                   /** body scale; a hummingbird is not an ostrich */
  neck?: 'short' | 'long' | 'swan' | 'none';
  tail?: 'short' | 'fan' | 'long' | 'forked';
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
  cap?: string;                                    /** a contrasting crown (chickadee, jay) */
  mask?: boolean;                                  /** the black face mask (cardinal, weaverbird) */
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
  const by = groundY - legLen - bh;
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
  } else {
    ground(c, bx, groundY + 4, S * 0.16 * sz);
  }

  /* legs — hidden on a swimming bird, which rides its waterline instead */
  if (!opts.swim) {
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
    }
  }

  /* ── the TAIL, behind the body ── */
  c.fillStyle = p.dark;
  const tail = opts.tail ?? 'short';
  if (tail === 'fan' && opts.eyespots) {
    /* ★ WAVE 62 — THE PEACOCK'S TRAIN. The old fan was a handful of body-length
       feathers pointing back-down; gp5's verdict was "the train — the entire
       identity of a peacock — is not there". It is now what it is in life: a
       huge ERECT semicircular fan behind the whole bird, each feather ~2.6×
       the body, tipped with a blue-and-gold ocellus. */
    const rootX = bx + bw * 0.30, rootY = by + bh * 0.10;
    const R = bw * 2.6;
    for (let i = -6; i <= 6; i++) {
      const a = -Math.PI / 2 + i * 0.145;   /* an erect fan, -125°..-55° spread */
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
  /* ★ WAVE 8 — THE MARKS, clipped to the body so they are plumage and not
     stickers. Between them and the bill these are what a birder actually uses
     to tell two brown songbirds apart at twenty metres. */
  if (opts.bib || opts.speckle || opts.streak) {
    c.save();
    c.beginPath(); c.ellipse(bx, by, bw, bh, -0.15, 0, TAU); c.clip();
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
  } else if (opts.upright) {   /* a penguin has a FLIPPER: one stiff blade, no primaries */
    c.fillStyle = p.dark;
    c.save(); c.translate(bx + bw * 0.30, by - bh * 0.10); c.rotate(0.30);
    c.beginPath(); c.ellipse(0, bh * 0.30, bw * 0.30, bh * 0.62, 0, 0, TAU); c.fill();
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
  }
  if (opts.crest && !opts.owl) {
    c.strokeStyle = p.lit; c.lineWidth = 3.4 * sz; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.22; c.beginPath(); c.moveTo(hx + 2 * sz, hy - 16 * sz); c.quadraticCurveTo(hx + (10 + Math.cos(a) * 18) * sz, hy - 34 * sz, hx + (6 + Math.cos(a) * 30) * sz, hy - (40 - i * 3) * sz); c.stroke(); }
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

/** the wave-3 roster: species whose defining anatomy was categorically wrong */
export const FAUNA_NAME: Record<string, FaunaPainter> = {
  /* Blocker 4 — life stage + arthropod body plans */
  'Fly Larvae': (c, g, p) => faunaLarva(c, g, speciesHue(p, '#f0e6c8')),
  'Cave Cricket': (c, g, p) => faunaLarva(c, g, speciesHue(p, '#9c7a54')),
  'Dragonfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#1e7fa8', open: true, slim: false }),
  'Damselfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#4aa8e0', open: false, slim: true, body: 1.05 }),
  'Mayfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#d8c48a', open: false, slim: true, body: 0.82 }),
  /* ★ WAVE 23 — Caddisfly, Stonefly and Dobsonfly went HARD look-alike: three
     drab browns on a length dial, the same defect the ants had. They are not
     alike. A caddisfly is MOTH-like with hairy wings tented over the body. */
  'Caddisfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#7d4f22', open: false, slim: true, body: 0.55 }),
  /* a stonefly holds its wings FLAT along a dark slender body */
  'Stonefly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#38423f', open: false, slim: true, body: 0.86 }),
  /* a dobsonfly is BIG — the largest of these by a wide margin, pale grey,
     with long soft wings held out */
  'Dobsonfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#9d968a', open: true, slim: false, body: 1.45 }),
  'Scorpionfly': (c, g, p) => faunaWingedInsect(c, g, p, { hue: '#e8a81c', open: false, slim: false, body: 0.95 }),
  'Springtail': (c, g, p) => faunaSpringtail(c, g, speciesHue(p, '#5a6470')),
  'Ladybug': (c, g, p) => faunaBeetle(c, g, p, { hue: '#c62828', spots: true }),
  'Firefly': (c, g, p) => faunaBeetle(c, g, p, { hue: '#382c1f', glow: true }),
  'Diving Beetle': (c, g, p) => faunaBeetle(c, g, p, { hue: '#414f1e', paddle: true }),
  'Dung Beetle': (c, g, p) => faunaBeetle(c, g, p, { hue: '#151515', }),
  'Carrion Beetle': (c, g, p) => faunaBeetle(c, g, p, { hue: '#221f22', }),
  'Water Beetle': (c, g, p) => faunaBeetle(c, g, p, { hue: '#55402c', paddle: true }),
  'Beetle': (c, g, p) => faunaBeetle(c, g, p, { hue: '#96551f', }),
  'Fiddler Crab': (c, g, p) => faunaFiddler(c, g, speciesHue(p, '#c9a877')),
  /* Blocker 6 — specialist fish + marine bodies */
  /* a flounder is a small rounded diamond, heavily mottled for camouflage;
     a halibut is a long narrow torpedo-diamond and nearly plain */
  'Flounder': (c, g, p) => faunaFlatfish(c, g, speciesHue(p, '#a98a5f'), { elong: 0.94, blotch: 1.5 }),
  'Halibut': (c, g, p) => faunaFlatfish(c, g, speciesHue(p, '#7d6b4e'), { elong: 1.52, blotch: 0.35 }),
  'Angelfish': (c, g, p) => faunaAngelfish(c, g, speciesHue(p, '#f7a41c')),
  'Lionfish': (c, g, p) => faunaLionfish(c, g, speciesHue(p, '#9b3a26')),
  'Octopus': (c, g, p) => faunaCephalopod(c, g, p, { hue: '#a65f52', squid: false }),
  'Giant Octopus': (c, g, p) => faunaCephalopod(c, g, p, { hue: '#b03a26', squid: false }),
  'Squid': (c, g, p) => faunaCephalopod(c, g, p, { hue: '#d69a92', squid: true }),
  'Giant Squid': (c, g, p) => faunaCephalopod(c, g, p, { hue: '#8c2f3a', squid: true }),
  /* its row: a TINY nub dorsal set far back, and a broad flat U rostrum —
     'Whale' now takes the no-dorsal blunt form so the two are not one animal */
  'Blue Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false, hue: [92, 108, 132], long: 1.30, bulk: 0.80 }),
  'Sperm Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [86, 78, 72], long: 1.10, bulk: 1.05, melon: 0.85 }),
  'Gray Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [142, 146, 140], long: 1.06, bulk: 1.00 }),
  'Right Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [46, 48, 52], long: 0.84, bulk: 1.42, melon: 0.30 }),
  'Beluga': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, hue: [226, 228, 230], long: 0.88, bulk: 1.12, melon: 0.55 }),
  'Orca': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'tall', blunt: false, patch: true, hue: [22, 24, 30], long: 0.98, bulk: 1.08 }),
  'Dolphin': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false, hue: [124, 134, 146], long: 0.86, bulk: 0.82 }),
  'River Dolphin': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: false, hue: [178, 150, 148], long: 0.80, bulk: 0.70 }),
  'Pilot Whale': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'small', blunt: true, hue: [30, 32, 38], long: 0.92, bulk: 1.20, melon: 1.00 }),
  'Narwhal': (c, g, p) => faunaCetacean(c, g, p, { dorsal: 'none', blunt: true, tusk: true, melon: 0.62, hue: [168, 168, 158], long: 0.94, bulk: 0.78 }),
  /* the wing, at last — birds by bill + leg length */
  /* ★ D-ART-121 — the axes existed and the rows never set them. */
  'Eagle': (c, g, p, n) => faunaBird(c, g, p, { hue: '#4a3a28', legs: 0.02, bill: 'hook', wings: 'soaring', tail: 'fan', headMass: 1.5, talons: true, plump: 1.12 }, n),
  'Harpy Eagle': (c, g, p, n) => faunaBird(c, g, p, { hue: '#6b7079', legs: 0.02, bill: 'hook', crest: true, wings: 'soaring', headMass: 1.8, talons: true, size: 1.12 }, n),
  /* ★ WAVE 50 — HAWK, FALCON AND OSPREY WERE ONE BIRD IN THREE HUES. Their
     rows were byte-identical apart from `hue` (Osprey added `size`), so the
     new [SHAPE] tier scores Hawk ≈ Falcon at 0.06 and Hawk ≈ Osprey at 0.25.
     This is D-ART-121 ("the large birds were all one bird") recurring on the
     raptors, and the fix is the same: the axes ALREADY EXIST and the rows
     simply never set them. Table work, not painter work.
     A buteo is broad and heavy on a wide fanned tail; a peregrine is a compact
     sleek dart with a long narrow tail; an osprey is bigger again with the
     long angled wings of a fish-hunter. */
  'Hawk': (c, g, p, n) => faunaBird(c, g, p, { hue: '#96543a', legs: 0.02, bill: 'hook', tail: 'fan', talons: true, plump: 1.16, size: 0.96 }, n),
  'Falcon': (c, g, p, n) => faunaBird(c, g, p, { hue: '#55647a', legs: 0.02, bill: 'hook', talons: true, size: 0.76, plump: 0.88, elong: 1.16 }, n),
  'Vulture': (c, g, p, n) => faunaBird(c, g, p, { hue: '#3a322c', legs: 0.03, bill: 'hook', wings: 'soaring', bald: true, talons: true, size: 1.10, plump: 1.14 }, n),
  'Albatross': (c, g, p, n) => faunaBird(c, g, p, { hue: '#99a0a8', legs: 0.01, bill: 'hook', wings: 'soaring', size: 1.05 }, n),
  'Flamingo': (c, g, p, n) => faunaBird(c, g, p, { hue: '#ef92a6', legs: 0.14, bill: 'stout', neck: 'swan', size: 1.05 }, n),
  'Heron': (c, g, p, n) => faunaBird(c, g, p, { hue: '#7b8fa3', legs: 0.13, bill: 'long', neck: 'swan', size: 0.98 }, n),
  'Crane': (c, g, p, n) => faunaBird(c, g, p, { hue: '#a3a39b', legs: 0.13, bill: 'long', crest: true, neck: 'long' }, n),
  'Stork': (c, g, p, n) => faunaBird(c, g, p, { hue: '#e6e2d8', legs: 0.12, bill: 'huge', neck: 'long' }, n),
  'Spoonbill': (c, g, p, n) => faunaBird(c, g, p, { hue: '#e2607f', legs: 0.11, bill: 'spoon', neck: 'long' }, n),
  'Avocet': (c, g, p, n) => faunaBird(c, g, p, { hue: '#cfd2d4', legs: 0.11, bill: 'upcurve', neck: 'long' }, n),
  'Ibis': (c, g, p, n) => faunaBird(c, g, p, { hue: '#b8352f', legs: 0.10, bill: 'downcurve', neck: 'long', billHue: '#b8352f' }, n),
  'Snipe': (c, g, p, n) => faunaBird(c, g, p, { hue: '#7a6440', legs: 0.06, bill: 'probe' }, n),
  'Godwit': (c, g, p, n) => faunaBird(c, g, p, { hue: '#9c6b3f', legs: 0.08, bill: 'probe', neck: 'long' }, n),
  'Pelican': (c, g, p, n) => faunaBird(c, g, p, { hue: '#a9a89b', legs: 0.03, bill: 'huge' }, n),
  'Toucan': (c, g, p, n) => faunaBird(c, g, p, { hue: '#1b1a1c', legs: 0.02, bill: 'toucan' }, n),
  'Kookaburra': (c, g, p, n) => faunaBird(c, g, p, { hue: '#6e5a45', legs: 0.02, bill: 'huge', headMass: 1.55, neck: 'none', size: 0.92 }, n),
  'Hornbill': (c, g, p, n) => faunaBird(c, g, p, { hue: '#2b2b30', legs: 0.02, bill: 'casque' }, n),
  'Cassowary': (c, g, p, n) => faunaBird(c, g, p, { legs: 0.105, bill: 'stout', crest: true, flightless: true, size: 1.20, neck: 'long', hue: '#1f2733', plump: 1.22 }, n),
  'Ostrich': (c, g, p, n) => faunaBird(c, g, p, { legs: 0.145, bill: 'stout', flightless: true, size: 1.42, neck: 'long', hue: '#3a332e', plump: 1.10, tail: 'fan' }, n),
  'Emu': (c, g, p, n) => faunaBird(c, g, p, { legs: 0.125, bill: 'stout', flightless: true, size: 1.22, neck: 'long', hue: '#6d6154', plump: 1.14 }, n),
  /* a kakapo is a FAT flightless parrot: heavy bill, heavy feet, tiny wing */
  'Kakapo': (c, g, p, n) => faunaBird(c, g, p, { hue: '#6f8a3a', legs: 0.02, bill: 'stout', flightless: true, parrotBill: true, zygo: true, headMass: 1.35, plump: 1.34, size: 0.98 }, n),
  'Secretary Bird': (c, g, p, n) => faunaBird(c, g, p, { hue: '#8e8b84', legs: 0.24, bill: 'hook', crest: true, neck: 'long', tail: 'long', size: 0.95 }, n),
  'Hoatzin': (c, g, p, n) => faunaBird(c, g, p, { hue: '#7d4f2a', legs: 0.04, bill: 'stout', crest: true, crop: true, wingClaw: true, tail: 'long', size: 0.94 }, n),
  'Puffin': (c, g, p, n) => faunaBird(c, g, p, { hue: '#23272b', legs: 0.02, bill: 'toucan', billHue: '#e8622c', bib: '#f0f2f4', plump: 1.3, size: 0.72, legHue: '#e8622c' }, n),
};
