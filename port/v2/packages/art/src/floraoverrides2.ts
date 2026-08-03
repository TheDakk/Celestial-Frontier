/* floraoverrides2.ts — THE MORPHOLOGY PASS, wave 11: THE PLANT SYSTEM.
   The coverage instrument, once fixed, said the largest uncovered block in
   the game was never the animals — it was the PLANTS: 288 of 334 flora
   still running the verbatim engine's generic leaf ladder, which is why
   Nick's audit found that every flower is the same daisy.

   Built like the quadruped and fish systems: ONE plant whose HABIT, LEAF,
   FLOWER and FRUIT are the species. A plant is legible from its habit
   before anything else — a tree is a trunk holding a canopy, a shrub is
   many stems from the ground, a grass is blades from a crown, a vine
   hangs, a succulent stores water in its own body, a fern unrolls fronds.

   Laws carried in from the animal waves:
   · proportion before decoration (wave 4)
   · every mark BLENDS (wave 5)
   · the painter may overflow; the fit pass frames it (wave 6)
   · vary a RATIO, never a scale — the fit pass erases size (D-ART-34)
   · derive each variation axis through an AVALANCHE (D-ART-35)
   · never override what already excels (D-ART-14) — wave 2's Rafflesia,
     Pineapple, Joshua Tree, Cotton, Dragon Fruit and the anti-duplicate
     ladder species are ABSENT here, and the shadow check enforces it. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { leafSurface } from './surface.js';
import { speciesHue } from './surface.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type PainterF = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

function nseedF(name: string): number {
  let h = 0x63A1;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return h >>> 0;
}
/** the avalanche (D-ART-35) — without it every "axis" is the same number */
function mixF(h: number, salt: number): number {
  let x = (h ^ Math.imul(salt | 1, 0x9E3779B1)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7FEB352D) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846CA68B) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x >>> 0;
}
const nvf = (name: string, salt: number, amt: number): number =>
  1 + (mixF(nseedF(name), salt) / 4294967296 - 0.5) * 2 * amt;
const rngF = (g: G, name: string, salt: number): (() => number) =>
  mulberry32((((g.seed as number) ^ mixF(nseedF(name), salt)) >>> 0));

function leafGrad(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.32, y - r * 0.36, 1, x, y, r * 1.2);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.56, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function softMark(c: Ctx, x: number, y: number, rx: number, ry: number, rgb: string, a: number, rot = 0): void {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, ry / rx);
  const gg = c.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
  gg.addColorStop(0, `rgba(${rgb},${a})`); gg.addColorStop(0.55, `rgba(${rgb},${a * 0.8})`);
  gg.addColorStop(0.82, `rgba(${rgb},${a * 0.32})`); gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
function ground(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.42)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.024, 0, 0, TAU); c.fill();
}

function nrng(g: G, name: string, salt: number): () => number {
  let h = salt >>> 0;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return mulberry32((((g.seed as number) ^ h) >>> 0));
}

export interface PlantSpec {
  habit: 'tree' | 'shrub' | 'herb' | 'grass' | 'vine' | 'succulent' | 'fern' | 'aquatic' | 'rosette' | 'palm' | 'cane';
  leaf: 'broad' | 'lance' | 'needle' | 'pinnate' | 'palmate' | 'blade' | 'frond' | 'scale' | 'heart' | 'pad';
  flower?: 'none' | 'head' | 'spike' | 'umbel' | 'bell' | 'star' | 'catkin';
  fruit?: 'none' | 'berry' | 'drupe' | 'pome' | 'citrus' | 'pod' | 'nut' | 'cone' | 'grain' | 'melon' | 'fig' | 'cluster';
  fhue?: string;      /** flower/fruit colour where colour IS the identity */
  hue?: string;       /** FOLIAGE colour — the body of the plant, not its fruit */
  /* ★ D-ART-125 — BARK. `hue` colours the foliage and the trunk took it too,
     so Cinnamon — a tree whose bark IS the spice — rendered a grass-green
     trunk. Trees default to a woody brown; a row can override. */
  bark?: string;
  pendulous?: boolean;  /** a vine whose fruit hangs as a spike, not a clump */
  thorns?: boolean;
  tall?: boolean;
  /* ★ WAVE 37 — THE HERB HAD NO AXES AT ALL. `habit:'herb'` has no branch in
     this painter; it falls through to the final `else`, which draws ONE thing:
     an upright stem, paired leaves at every node, one terminal flower. 64
     species carry that habit, so 64 plants are the same picture at different
     hues — and 46 of the gold pass's 153 flora FAILs name exactly that.
     It is the flora twin of the mammals' shared-skull problem, and it was
     filed as "the flora painter has no axis for a bare branching stem", which
     understates it: it had no axis for anything.
     All three default to the previous behaviour, so the other 60 herbs are
     byte-unchanged until someone gives them a value on purpose (D-ART-14). */
  /** how the stem carries itself: a leafy upright, stiff near-naked branching
      wands (chicory, most composites), or a low creeping mat (thyme) */
  stem?: 'leafy' | 'bare' | 'mat';
  /** leaves in opposite pairs (mint), singly up the stem (echinacea), or in a
      basal rosette with a naked flowering stem above (chicory, dandelion) */
  leafArr?: 'opposite' | 'alternate' | 'basal';
  /** how many flowers, and therefore whether they are terminal or borne along
      the stem. 1 = the old terminal single. */
  flowerN?: number;
}

/** one leaf, drawn along a direction — the shape IS the family */
/** the cost dial for leaf venation — see MAT_DETAIL. 0 restores the flat leaf. */
const LEAF_DETAIL = 1;

function drawLeaf(c: Ctx, p: Pal, x: number, y: number, ang: number, len: number, kind: PlantSpec['leaf']): void {
  c.save(); c.translate(x, y); c.rotate(ang);
  const w = len * (kind === 'lance' ? 0.16 : kind === 'blade' ? 0.09 : kind === 'heart' ? 0.52 : 0.34);
  c.fillStyle = leafGrad(c, p, len * 0.45, 0, len * 0.5);
  if (kind === 'needle' || kind === 'scale') {
    c.strokeStyle = p.base; c.lineWidth = Math.max(2, len * 0.07); c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
    c.restore(); return;
  }
  if (kind === 'pinnate') {   /* a compound leaf: leaflets in pairs up a rachis */
    c.strokeStyle = p.dark; c.lineWidth = Math.max(1.6, len * 0.045);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len, 0); c.stroke();
    for (let i = 1; i <= 6; i++) {
      const u = i / 6.5, lx = len * u, ll = len * 0.26 * (1 - u * 0.35);
      for (const s of [-1, 1] as const) {
        c.fillStyle = leafGrad(c, p, lx, s * ll * 0.5, ll);
        c.beginPath(); c.ellipse(lx + ll * 0.25, s * ll * 0.55, ll * 0.42, ll * 0.20, s * 0.5, 0, TAU); c.fill();
      }
    }
    c.restore(); return;
  }
  if (kind === 'palmate') {   /* fingers from one point — maple, castor, cassava */
    for (let i = -2; i <= 2; i++) {
      c.save(); c.rotate(i * 0.42);
      c.fillStyle = leafGrad(c, p, len * 0.5, 0, len * 0.42);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(len * 0.5, -len * 0.20, len * (0.94 - Math.abs(i) * 0.10), 0);
      c.quadraticCurveTo(len * 0.5, len * 0.20, 0, 0);
      c.closePath(); c.fill();
      leafSurface(c, len * (0.94 - Math.abs(i) * 0.10), len * 0.20,
        { veins: 4, detail: LEAF_DETAIL });
      c.restore();
    }
    c.restore(); return;
  }
  if (kind === 'frond') {   /* an arching, feathered fern/palm frond */
    /* the rachis */
    c.strokeStyle = p.dark; c.lineWidth = Math.max(2.5, len * 0.045); c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.5, -len * 0.18, len, len * 0.10); c.stroke();
    /* pinnae as overlapping tapered blades at a SHALLOW angle, so they merge
       into a feather rather than sticking out as spikes */
    for (let i = 1; i <= 16; i++) {
      const u = i / 17;
      const px = len * u, py = -len * 0.18 * Math.sin(u * Math.PI) + len * 0.10 * u * u;
      const ll = (len * 0.30 * Math.sin(Math.PI * u) + len * 0.05);
      for (const s of [-1, 1] as const) {
        c.save(); c.translate(px, py); c.rotate(s * 0.42 - 0.15);
        c.fillStyle = leafGrad(c, p, ll * 0.5, 0, ll * 0.6);
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(ll * 0.5, -ll * 0.14, ll, 0);
        c.quadraticCurveTo(ll * 0.5, ll * 0.10, 0, 0);
        c.closePath(); c.fill();
        c.restore();
      }
    }
    c.restore(); return;
  }
  if (kind === 'pad') {   /* a succulent's thick water-storing pad */
    c.fillStyle = leafGrad(c, p, len * 0.5, 0, len * 0.5);
    c.beginPath(); c.ellipse(len * 0.5, 0, len * 0.5, len * 0.30, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(240,250,240,0.30)'; c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(len * 0.5, 0, len * 0.5, len * 0.30, 0, -2.6, 0.4); c.stroke();
    leafSurface(c, len * 0.92, len * 0.26, { veins: 3, detail: LEAF_DETAIL * 0.6 });
    c.restore(); return;
  }
  /* broad · lance · blade · heart — one blade with a midrib */
  c.beginPath();
  c.moveTo(0, 0);
  if (kind === 'heart') {
    c.bezierCurveTo(len * 0.30, -w * 1.5, len * 1.12, -w * 0.9, len, 0);
    c.bezierCurveTo(len * 1.12, w * 0.9, len * 0.30, w * 1.5, 0, 0);
  } else {
    c.quadraticCurveTo(len * 0.42, -w, len, 0);
    c.quadraticCurveTo(len * 0.42, w, 0, 0);
  }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(20,32,18,0.34)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(len * 0.94, 0); c.stroke();
  /* ★ D-ART-116 — VENATION. The midrib alone says "leaf-shaped"; the laterals
     are what say "leaf". A blade grass is a monocot and gets parallel veins
     rather than a branching net, which is a real botanical difference and
     also what keeps a grass from reading as a small broadleaf. */
  leafSurface(c, len, w, { veins: kind === 'heart' ? 5 : kind === 'blade' ? 7 : 6,
    detail: LEAF_DETAIL, parallel: kind === 'blade' });
  c.restore();
}

function drawFruit(c: Ctx, p: Pal, x: number, y: number, R: number, kind: NonNullable<PlantSpec['fruit']>, hue: string | undefined, r: () => number): void {
  const col = hue ?? '#c2452f';
  const shade = (xx: number, yy: number, rr: number): CanvasGradient => {
    const gg = c.createRadialGradient(xx - rr * 0.35, yy - rr * 0.4, 1, xx, yy, rr * 1.15);
    gg.addColorStop(0, 'rgba(255,255,255,0.55)'); gg.addColorStop(0.42, col); gg.addColorStop(1, 'rgba(0,0,0,0.45)');
    return gg;
  };
  if (kind === 'berry' || kind === 'cluster') {
    const n = kind === 'cluster' ? 11 : 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, d = R * (kind === 'cluster' ? 0.9 : 0.6) * (0.4 + r() * 0.6);
      const bx = x + Math.cos(a) * d, by = y + Math.sin(a) * d * 0.8;
      c.fillStyle = shade(bx, by, R * 0.34);
      c.beginPath(); c.arc(bx, by, R * 0.34, 0, TAU); c.fill();
    }
  } else if (kind === 'pome' || kind === 'drupe' || kind === 'citrus' || kind === 'melon' || kind === 'fig') {
    const rr = R * (kind === 'melon' ? 1.25 : kind === 'fig' ? 0.85 : 0.95);
    c.fillStyle = shade(x, y, rr);
    c.beginPath(); c.ellipse(x, y, rr, rr * (kind === 'fig' ? 1.15 : kind === 'citrus' ? 0.95 : 1.02), 0, 0, TAU); c.fill();
    if (kind === 'melon') { c.strokeStyle = 'rgba(20,40,20,0.35)'; c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(x, y, rr * (0.35 + i * 0.28), rr, 0, 0, TAU); c.stroke(); } }
    if (kind === 'citrus') softMark(c, x - rr * 0.3, y - rr * 0.35, rr * 0.4, rr * 0.3, '255,255,220', 0.35);
    c.strokeStyle = '#4a3a22'; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - rr * 0.95); c.lineTo(x + rr * 0.16, y - rr * 1.45); c.stroke();
  } else if (kind === 'pod') {
    c.fillStyle = shade(x, y, R * 0.8);
    c.save(); c.translate(x, y); c.rotate(0.5);
    c.beginPath(); c.ellipse(0, 0, R * 1.1, R * 0.26, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(30,26,12,0.35)'; c.lineWidth = 1.6;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * R * 0.4, 0, R * 0.16, 0, TAU); c.stroke(); }
    c.restore();
  } else if (kind === 'nut') {
    c.fillStyle = shade(x, y, R * 0.7);
    c.beginPath(); c.ellipse(x, y, R * 0.62, R * 0.72, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(40,30,16,0.5)';
    c.beginPath(); c.ellipse(x, y + R * 0.42, R * 0.5, R * 0.26, 0, 0, TAU); c.fill();
  } else if (kind === 'cone') {
    c.fillStyle = '#6b4b2a';
    for (let i = 0; i < 6; i++) {
      const yy = y - R * 0.7 + i * R * 0.28;
      c.beginPath(); c.ellipse(x, yy, R * (0.50 - i * 0.05), R * 0.17, 0, 0, TAU); c.fill();
    }
  } else if (kind === 'grain') {
    c.fillStyle = col;
    for (let i = 0; i < 12; i++) {
      const yy = y - R * 1.2 + i * R * 0.22;
      for (const s of [-1, 1] as const) {
        c.beginPath(); c.ellipse(x + s * R * 0.20, yy, R * 0.16, R * 0.09, s * 0.5, 0, TAU); c.fill();
      }
    }
    c.strokeStyle = col; c.lineWidth = 1.6;   /* the awns */
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(x, y - R * 1.2); c.lineTo(x + (i - 3) * R * 0.16, y - R * 2.1); c.stroke(); }
  }
}

function drawFlower(c: Ctx, p: Pal, x: number, y: number, R: number, kind: NonNullable<PlantSpec['flower']>, hue: string | undefined, r: () => number): void {
  const col = hue ?? '#e6d98f';
  if (kind === 'head') {          /* a composite: ray florets round a disc */
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      c.fillStyle = col;
      c.save(); c.translate(x, y); c.rotate(a);
      c.beginPath(); c.ellipse(R * 0.62, 0, R * 0.46, R * 0.17, 0, 0, TAU); c.fill();
      c.restore();
    }
    c.fillStyle = '#6b5320'; c.beginPath(); c.arc(x, y, R * 0.34, 0, TAU); c.fill();
    softMark(c, x, y, R * 0.30, R * 0.30, '40,30,10', 0.4);
  } else if (kind === 'spike' || kind === 'catkin') {
    for (let i = 0; i < 9; i++) {
      const yy = y - R * 1.4 + i * R * 0.32;
      c.fillStyle = col;
      c.beginPath(); c.ellipse(x + (r() - 0.5) * R * 0.2, yy, R * (kind === 'catkin' ? 0.22 : 0.26), R * 0.17, 0, 0, TAU); c.fill();
    }
  } else if (kind === 'umbel') {
    c.strokeStyle = p.dark; c.lineWidth = 1.6;
    for (let i = 0; i < 11; i++) {
      const a = -2.6 + (i / 10) * 2.0, ex = x + Math.cos(a) * R * 0.95, ey = y + Math.sin(a) * R * 0.72;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(ex, ey, R * 0.18, 0, TAU); c.fill();
    }
  } else if (kind === 'bell') {
    for (let i = 0; i < 4; i++) {
      const yy = y - R * 0.8 + i * R * 0.55, xx = x + (i % 2 ? R * 0.28 : -R * 0.28);
      c.fillStyle = col;
      c.beginPath(); c.moveTo(xx - R * 0.24, yy);
      c.quadraticCurveTo(xx - R * 0.30, yy + R * 0.62, xx, yy + R * 0.68);
      c.quadraticCurveTo(xx + R * 0.30, yy + R * 0.62, xx + R * 0.24, yy);
      c.closePath(); c.fill();
    }
  } else if (kind === 'star') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      c.fillStyle = col;
      c.save(); c.translate(x, y); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(R * 0.45, -R * 0.34, R, 0);
      c.quadraticCurveTo(R * 0.45, R * 0.34, 0, 0);
      c.closePath(); c.fill(); c.restore();
    }
    c.fillStyle = '#f3e6a8'; c.beginPath(); c.arc(x, y, R * 0.20, 0, TAU); c.fill();
  }
}

/** THE PLANT. One body; the spec is the species. */
export function plantBody(c: Ctx, g: G, pIn: Pal, spec: PlantSpec, name = ''): void {
  /* ★ D-ART-114 — the species hue axis, and the biggest single unlock: 314
     plants took the rarity roll. Note this is the FOLIAGE colour and is a
     different axis from `fhue`, which colours the flower or fruit — a plant
     can have scarlet berries on grey-green leaves, and conflating the two is
     what made the colour audit read 270 flora as already done when their
     bodies were still random. */
  const p = speciesHue(pIn, spec.hue);
  const r = rngF(g, name, 0x9101);
  const cx = S * 0.50, base = S * 0.84;
  /* RATIOS, never scales — the fit pass erases a size-only difference */
  const H = S * (spec.tall ? 0.62 : 0.52) * nvf(name, 0x11, 0.14);
  const spread = nvf(name, 0x22, 0.20);
  const leafN = Math.max(5, Math.round((spec.habit === 'grass' ? 13 : 9) * nvf(name, 0x33, 0.30)));
  const lean = (nvf(name, 0x44, 1) - 1) * 0.20;
  ground(c, cx, base + 4, S * 0.17 * spread);

  const stemCol = `rgb(${Math.max(30, p.cr * 0.5 | 0)},${Math.max(34, p.cg * 0.42 + 24 | 0)},${Math.max(24, p.cb * 0.35 | 0)})`;
  /* ★ D-ART-125 — a TREE's trunk is wood, not leaf. Herbs and vines keep the
     green stem they should have; only a woody habit takes bark. */
  const woody = spec.habit === 'tree' || spec.habit === 'shrub';
  const barkCol = spec.bark ?? (woody ? '#6b4a2e' : stemCol);
  const topY = base - H;

  if (spec.habit === 'tree' || spec.habit === 'palm') {
    /* A TREE IS A TRUNK HOLDING A CANOPY — and the trunk TAPERS and forks,
       which is what stops it reading as a lollipop on a stick. */
    const tw = S * 0.030 * nvf(name, 0x55, 0.24);
    /* ★ D-ART-125 — the trunk is WOOD. It was stroked in stemCol, which derives
       from the FOLIAGE hue, so Cinnamon's trunk came out grass-green. */
    c.strokeStyle = barkCol; c.lineCap = 'round';
    c.lineWidth = tw * 2;
    c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + lean * S * 0.05, base - H * 0.5, cx + lean * S * 0.10, topY + H * 0.22); c.stroke();
    c.lineWidth = tw * 1.15;
    for (const s of [-1, 1] as const) {   /* two boughs into the canopy */
      c.beginPath(); c.moveTo(cx + lean * S * 0.06, base - H * 0.45);
      c.quadraticCurveTo(cx + s * S * 0.05, base - H * 0.72, cx + s * S * 0.085 * spread, topY + H * 0.20); c.stroke();
    }
    if (spec.habit === 'palm') {   /* a palm has NO canopy: a crown of fronds */
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i - 3.5) * 0.42;
        drawLeaf(c, p, cx + lean * S * 0.10, topY + H * 0.18, a, H * 0.46 * spread, 'frond');
      }
      if (spec.fruit && spec.fruit !== 'none') drawFruit(c, p, cx + lean * S * 0.10, topY + H * 0.24, S * 0.032, spec.fruit, spec.fhue, r);
    } else {
      /* the canopy: overlapping soft masses, then leaves on the rim, so the
         crown has depth instead of being one flat blob */
      const cw = S * 0.21 * spread, chh = S * 0.16 * nvf(name, 0x66, 0.22);
      const ccx = cx + lean * S * 0.10, ccy = topY + H * 0.14;
      /* foliage TONES with their own value structure, independent of how pale
         the species hue is — the fix for pale-palette "mop" crowns (task 21).
         A leaf canopy is never lighter than mid-value even when its flowers
         are white, so the hue is scaled toward fixed dark/mid/light values
         and biased slightly green, which is what makes a canopy read. */
      /* a foliage GREEN, tinted 40% by the species hue — always reads as
         leaves, keeps some palette variety (a 'blue' tree goes teal, a 'red'
         tree olive) */
      const gA = [52, 104, 44];
      const fmix = (ch: number, anchor: number): number => anchor * 0.6 + ch * 0.4;
      const fBase = [fmix(p.cr, gA[0]!), fmix(p.cg, gA[1]!), fmix(p.cb, gA[2]!)];
      const fol = (v: number): string => `${Math.min(255, fBase[0]! * v | 0)},${Math.min(255, fBase[1]! * v | 0)},${Math.min(255, fBase[2]! * v | 0)}`;
      const folDark = fol(0.5), folMid = fol(0.95), folLit = fol(1.6);
      /* pass 1 — the deep mass that gives the crown a body */
      for (let i = 0; i < 34; i++) {
        const a = r() * TAU, d = r() ** 0.6;
        softMark(c, ccx + Math.cos(a) * cw * d, ccy + Math.sin(a) * chh * d, cw * 0.50, chh * 0.50, folDark, 0.70);
      }
      /* pass 2 — the lit upper surface, offset toward the light */
      for (let i = 0; i < 22; i++) {
        const a = r() * TAU, d = r() ** 0.7;
        softMark(c, ccx + Math.cos(a) * cw * 0.78 * d - cw * 0.10, ccy + Math.sin(a) * chh * 0.72 * d - chh * 0.22, cw * 0.36, chh * 0.36, folMid, 0.55);
      }
      /* pass 2b — a compact lit highlight cluster, upper-left, so the canopy
         has a clear light source instead of an even wash */
      for (let i = 0; i < 10; i++) {
        const a = r() * TAU, d = r() ** 0.8;
        softMark(c, ccx + Math.cos(a) * cw * 0.5 * d - cw * 0.16, ccy + Math.sin(a) * chh * 0.5 * d - chh * 0.30, cw * 0.24, chh * 0.24, folLit, 0.40);
      }
      /* pass 3 — leaves ON THE RIM, which is where a crown's silhouette is */
      const leafL = S * 0.078 * nvf(name, 0x77, 0.2);
      const folP: Pal = { base: `rgb(${folMid})`, cr: p.cr, cg: p.cg, cb: p.cb, lit: `rgb(${folLit})`, dark: `rgb(${folDark})` };
      for (let i = 0; i < leafN * 3 + 16; i++) {
        /* fill the WHOLE crown, not just its fringe — leaves only on the
           rim left the middle as bare soft-mask haze */
        const a = r() * TAU, d = 0.30 + r() ** 0.55 * 0.78;
        const lx = ccx + Math.cos(a) * cw * d, ly = ccy + Math.sin(a) * chh * d;
        drawLeaf(c, folP, lx, ly, a + (r() - 0.5) * 0.8, leafL * (0.7 + r() * 0.5), spec.leaf);
      }
      if (spec.flower && spec.flower !== 'none') {
        for (let i = 0; i < 5; i++) {
          const a = r() * TAU, d = 0.4 + r() * 0.6;
          drawFlower(c, p, cx + Math.cos(a) * cw * d + lean * S * 0.10, topY + H * 0.14 + Math.sin(a) * chh * d, S * 0.030, spec.flower, spec.fhue, r);
        }
      }
      if (spec.fruit && spec.fruit !== 'none') {
        for (let i = 0; i < 4; i++) {
          const a = r() * TAU, d = 0.45 + r() * 0.55;
          drawFruit(c, p, cx + Math.cos(a) * cw * d + lean * S * 0.10, topY + H * 0.16 + Math.sin(a) * chh * d, S * 0.034, spec.fruit, spec.fhue, r);
        }
      }
    }
  } else if (spec.habit === 'shrub') {
    /* MANY STEMS FROM THE GROUND — that is the whole difference from a tree */
    const stems = 5;
    for (let k = 0; k < stems; k++) {
      const s = (k - (stems - 1) / 2) / stems;
      const tipX = cx + s * S * 0.16 * spread * 2, tipY = base - H * (0.72 + r() * 0.28);
      c.strokeStyle = stemCol; c.lineWidth = S * 0.010; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx + s * S * 0.02, base); c.quadraticCurveTo(cx + s * S * 0.10, base - H * 0.5, tipX, tipY); c.stroke();
      for (let i = 0; i < leafN; i++) {
        const u = 0.25 + (i / leafN) * 0.75;
        const lx = cx + s * S * 0.02 + (tipX - cx - s * S * 0.02) * u;
        const ly = base + (tipY - base) * u;
        drawLeaf(c, p, lx, ly, (i % 2 ? -0.7 : -2.4) + s, S * 0.062 * nvf(name, 0x77, 0.2), spec.leaf);
      }
      if (spec.fruit && spec.fruit !== 'none') drawFruit(c, p, tipX, tipY + S * 0.012, S * 0.030, spec.fruit, spec.fhue, r);
      if (spec.flower && spec.flower !== 'none') drawFlower(c, p, tipX, tipY - S * 0.010, S * 0.028, spec.flower, spec.fhue, r);
    }
  } else if (spec.habit === 'grass' || spec.habit === 'cane') {
    /* BLADES FROM A CROWN, arcing outward and drooping at the tip */
    const cane = spec.habit === 'cane';
    for (let i = 0; i < leafN + 4; i++) {
      const u = (i / (leafN + 3)) - 0.5;
      const a = -Math.PI / 2 + u * 1.5 * spread;
      const L = H * (0.72 + r() * 0.4);
      const tipX = cx + Math.cos(a) * L * 1.1, tipY = base - L * (0.72 - Math.abs(u) * 0.5);
      const midX = cx + Math.cos(a) * L * 0.5, midY = base - L * 0.72;
      if (cane) {
        c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = S * 0.014; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(midX, midY, tipX, tipY); c.stroke();
      } else {
        /* a filled blade: wide at the crown, tapering to a drooping point */
        const wBase = S * 0.016 * (0.7 + Math.abs(u) * 0.3);
        c.fillStyle = leafGrad(c, p, midX, midY, L * 0.5);
        c.beginPath();
        c.moveTo(cx - wBase, base);
        c.quadraticCurveTo(midX - wBase * 0.4, midY, tipX, tipY);
        c.quadraticCurveTo(midX + wBase * 0.6, midY + wBase * 0.6, cx + wBase, base);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(20,32,18,0.24)'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(midX, midY, tipX, tipY); c.stroke();
      }
      if (cane) {   /* the nodes of a bamboo/reed culm */
        c.strokeStyle = p.lit; c.lineWidth = S * 0.004;
        for (let k = 1; k <= 4; k++) {
          const v = k / 5;
          c.beginPath();
          c.moveTo(cx + Math.cos(a) * L * 0.55 * v - 5, base - L * 0.72 * v);
          c.lineTo(cx + Math.cos(a) * L * 0.55 * v + 5, base - L * 0.72 * v); c.stroke();
        }
      }
    }
    /* the head rides the tallest blade, JOINED to the crown by its own stalk
       — it used to float disconnected above the grass (Nick's review) */
    if ((spec.fruit === 'grain') || (spec.flower && spec.flower !== 'none')) {
      const headY = base - H * 0.80;
      c.strokeStyle = stemCol; c.lineWidth = S * 0.007; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + lean * S * 0.03, base - H * 0.5, cx + S * 0.01, headY + S * 0.03); c.stroke();
      if (spec.fruit === 'grain') drawFruit(c, p, cx + S * 0.01, headY, S * 0.034, 'grain', spec.fhue, r);
      else drawFlower(c, p, cx + S * 0.01, headY, S * 0.030, spec.flower!, spec.fhue, r);
    }
  } else if (spec.habit === 'vine') {
    /* A VINE HANGS AND CLINGS — a sinuous stem with tendrils, not a stalk */
    c.strokeStyle = stemCol; c.lineWidth = S * 0.011; c.lineCap = 'round';
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      pts.push([cx + Math.sin(u * 6.0 + lean) * S * 0.11 * spread, base - u * H]);
    }
    c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]![0], pts[i]![1]);
    c.stroke();
    for (let i = 2; i < pts.length; i += 3) {
      const [x, y] = pts[i]!;
      drawLeaf(c, p, x, y, (i % 2 ? 0.3 : Math.PI - 0.3), S * 0.105 * nvf(name, 0x77, 0.2), spec.leaf);
      c.strokeStyle = p.dark; c.lineWidth = 2;   /* the tendril */
      c.beginPath();
      for (let k = 0; k < 12; k++) {
        const a = k * 0.9, rr = 5 + k * 0.6;
        c.lineTo(x + (i % 2 ? -1 : 1) * (14 + Math.cos(a) * rr), y + Math.sin(a) * rr * 0.5);
      }
      c.stroke();
      c.strokeStyle = stemCol; c.lineWidth = S * 0.011;
    }
    /* ★ D-ART-125 — THE VINE BRANCH NEVER DREW A FLOWER. It handled leaves,
       tendrils and fruit and silently ignored `spec.flower`, so Beach Morning
       Glory — a plant whose entire identity is its funnel bloom — set
       flower:'bell' and rendered a bare creeper. The audit called it a
       regression; it was really a branch that had never supported the field. */
    if (spec.flower && spec.flower !== 'none') {
      for (const i of [7, 13, 19]) {
        const [fx, fy] = pts[i]!;
        drawFlower(c, p, fx + (i % 2 ? -1 : 1) * S * 0.045, fy - S * 0.012,
          S * 0.040, spec.flower, spec.fhue, r);
      }
    }
    if (spec.fruit && spec.fruit !== 'none') {
      /* ★ a vine's fruit HANGS. Black Pepper's pendulous spike is what tells
         it from every other heart-leaved climber — and it was drawing one
         round clump at mid-stem, geometrically identical to Beach Morning
         Glory once you ignore colour. */
      if (spec.pendulous) {
        for (const i of [9, 17]) {
          const [sx, sy] = pts[i]!;
          const L = S * 0.13;
          c.strokeStyle = p.dark; c.lineWidth = 2.6; c.lineCap = 'round';
          c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + S * 0.012, sy + L * 0.5, sx + S * 0.006, sy + L); c.stroke();
          for (let k = 1; k <= 12; k++) {
            const u = k / 13, dy = sy + L * u, dx = sx + S * 0.012 * Math.sin(u * 3.1);
            drawFruit(c, p, dx, dy, S * 0.011, 'berry', spec.fhue, r);
          }
        }
      } else {
        drawFruit(c, p, pts[16]![0] + S * 0.03, pts[16]![1], S * 0.034, spec.fruit, spec.fhue, r);
      }
    }
  } else if (spec.habit === 'succulent') {
    /* THE PLANT IS ITS OWN WATER TANK: thick pads or a ribbed column */
    if (spec.leaf === 'pad') {
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + (i - 1.5) * 0.55;
        drawLeaf(c, p, cx, base - H * 0.12, a, H * 0.55 * spread, 'pad');
      }
    } else {
      const w = S * 0.055 * spread;
      const gg = c.createLinearGradient(cx - w, 0, cx + w, 0);
      gg.addColorStop(0, p.dark); gg.addColorStop(0.42, p.base); gg.addColorStop(1, p.dark);
      c.fillStyle = gg;
      c.beginPath();
      c.moveTo(cx - w, base);
      c.quadraticCurveTo(cx - w * 1.1, base - H * 0.6, cx, base - H);
      c.quadraticCurveTo(cx + w * 1.1, base - H * 0.6, cx + w, base);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,40,20,0.30)'; c.lineWidth = 2;
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.moveTo(cx + i * w * 0.36, base);
        c.quadraticCurveTo(cx + i * w * 0.30, base - H * 0.6, cx + i * w * 0.10, base - H * 0.95); c.stroke();
      }
      if (spec.thorns) {
        c.strokeStyle = '#e8dcbe'; c.lineWidth = 1.8;
        for (let i = 0; i < 26; i++) {
          const u = r(), yy = base - u * H, s = r() < 0.5 ? -1 : 1;
          const xx = cx + s * w * (1 - u * 0.35);
          c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + s * 9, yy - 4); c.stroke();
        }
      }
    }
    if (spec.flower && spec.flower !== 'none') drawFlower(c, p, cx, base - H * 1.02, S * 0.032, spec.flower, spec.fhue, r);
    if (spec.fruit && spec.fruit !== 'none') drawFruit(c, p, cx + S * 0.03, base - H * 0.9, S * 0.030, spec.fruit, spec.fhue, r);
  } else if (spec.habit === 'fern') {
    /* a rosette of clearly ARCHING fronds — spread wide and drawn from a
       low crown so they read as a fern, not a spiny ball (Nick's review) */
    const nf = 6;
    for (let i = 0; i < nf; i++) {
      const a = -Math.PI / 2 + ((i / (nf - 1)) - 0.5) * 2.1 * spread;
      drawLeaf(c, p, cx, base - S * 0.01, a, H * 0.86, 'frond');
    }
    /* one small fiddlehead tucked low at the crown, not floating over them */
    c.strokeStyle = p.lit; c.lineWidth = S * 0.008; c.lineCap = 'round';
    c.beginPath();
    for (let k = 0; k < 14; k++) {
      const a = k * 0.6, rr = S * 0.020 * (1 - k / 18);
      c.lineTo(cx + S * 0.02 + Math.cos(a) * rr, base - S * 0.10 + Math.sin(a) * rr);
    }
    c.stroke();
  } else if (spec.habit === 'aquatic') {
    if (spec.leaf === 'pad') {
      /* FLOATING PADS on a waterline — the lily/lotus/duckweed body */
      const wl = base - S * 0.06;
      c.fillStyle = 'rgba(28,52,78,0.55)';
      c.beginPath(); c.ellipse(cx, wl + S * 0.03, S * 0.30 * spread, S * 0.035, 0, 0, TAU); c.fill();
      for (let i = 0; i < 3; i++) {
        const px = cx + (i - 1) * S * 0.13 * spread + (r() - 0.5) * S * 0.02;
        const py = wl + (i % 2 ? S * 0.012 : -S * 0.008);
        const pr = S * (0.085 + r() * 0.03) * spread;
        c.fillStyle = leafGrad(c, p, px, py, pr);
        c.beginPath(); c.ellipse(px, py, pr, pr * 0.42, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(20,32,18,0.32)'; c.lineWidth = 2;   /* the notch */
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + pr * 0.9, py + pr * 0.16); c.stroke();
      }
      c.strokeStyle = 'rgba(160,205,240,0.30)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, wl + S * 0.012, S * 0.34 * spread, S * 0.030, 0, 0, TAU); c.stroke();
      if (spec.flower && spec.flower !== 'none') {
        drawFlower(c, p, cx + S * 0.05, wl - S * 0.045, S * 0.040, spec.flower, spec.fhue, r);
      }
    } else {
    /* held up by water, not by wood: straps rising from a holdfast */
    for (let i = 0; i < leafN; i++) {
      const u = (i / (leafN - 1)) - 0.5;
      c.strokeStyle = i % 2 ? p.base : p.dark;
      c.lineWidth = S * (spec.leaf === 'blade' ? 0.030 : 0.018);   /* a STRAP has width */
      c.lineCap = 'round'; c.lineJoin = 'round';
      const sway = u * S * 0.17 * spread;
      c.beginPath(); c.moveTo(cx + u * S * 0.02, base);
      c.bezierCurveTo(cx + sway * 0.5, base - H * 0.40,
        cx + sway * 1.25, base - H * 0.74, cx + sway * 0.85, base - H * (0.92 + r() * 0.12));
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = S * 0.008;   /* the wet sheen */
      c.beginPath(); c.moveTo(cx + u * S * 0.02, base);
      c.bezierCurveTo(cx + sway * 0.5, base - H * 0.40,
        cx + sway * 1.25, base - H * 0.74, cx + sway * 0.85, base - H * (0.92 + r() * 0.12));
      c.stroke();
      if (spec.leaf === 'blade') {   /* the gas bladders of a kelp */
        for (let k = 1; k <= 3; k++) {
          const v = k / 4;
          c.fillStyle = p.lit;
          c.beginPath(); c.ellipse(cx + u * S * 0.12 * spread * v, base - H * v, S * 0.011, S * 0.017, 0, 0, TAU); c.fill();
        }
      }
    }
    }
  } else if (spec.habit === 'rosette') {
    /* leaves radiating from a crown at ground level — dandelion, aloe, cabbage */
    for (let i = 0; i < leafN + 3; i++) {
      const a = -Math.PI / 2 + ((i / (leafN + 2)) - 0.5) * 2.6 * spread;
      drawLeaf(c, p, cx, base - S * 0.015, a, H * (0.52 + r() * 0.22), spec.leaf);
    }
    if (spec.flower && spec.flower !== 'none') {
      c.strokeStyle = stemCol; c.lineWidth = S * 0.008;
      c.beginPath(); c.moveTo(cx, base - S * 0.02); c.lineTo(cx + lean * S * 0.04, base - H * 0.95); c.stroke();
      drawFlower(c, p, cx + lean * S * 0.04, base - H * 1.0, S * 0.036, spec.flower, spec.fhue, r);
    }
    if (spec.fruit && spec.fruit !== 'none') drawFruit(c, p, cx + S * 0.035, base - H * 0.35, S * 0.032, spec.fruit, spec.fhue, r);
  } else {
    /* ★ WAVE 37 — THE HERB. See PlantSpec.stem/leafArr/flowerN: this branch used
       to draw exactly one plant for all 64 herbs. It now draws the three things
       a herb can actually be, and puts its flowers where its architecture puts
       them. Defaults reproduce the old drawing exactly. */
    const arch = spec.stem ?? 'leafy';
    const arr = spec.leafArr ?? 'opposite';
    const nF = Math.max(1, spec.flowerN ?? 1);
    const mat = arch === 'mat';
    /* a creeping mat is wide and low; a wand is tall and thin.
       ⚠ WAVE 37 — the first cut made the mat 0.42·H tall over a 0.20·S spread,
       and artlock came straight back with THIRTY newly-confusable pairs, every
       one of them Mountain Thyme against some other small dark subject (Chiton,
       Mudminnow, Harvestman, Leafcutter Ant…). The documented trap: a small
       subject leaves mostly empty canvas, and two mostly-empty cards look alike
       to the fingerprint whatever is drawn on them. A creeping mat is LOW, not
       SMALL — it has to sprawl across the frame it is given. */
    const HH = mat ? H * 0.58 : H;
    const stemW = S * (arch === 'bare' ? 0.006 : 0.009);
    /* THE STEMS. One upright for a leafy herb; several stiff diverging wands
       for a bare-stemmed composite; a spray of low arcs for a mat. */
    const wands: Array<{ tipX: number; tipY: number; ang: number }> = [];
    const nW = arch === 'bare' ? 3 : mat ? 5 : 1;
    c.strokeStyle = stemCol; c.lineWidth = stemW; c.lineCap = 'round';
    for (let w = 0; w < nW; w++) {
      const t = nW === 1 ? 0 : (w / (nW - 1)) - 0.5;
      /* a bare stem leans away from its neighbours; a mat sprawls sideways */
      const spreadX = mat ? t * S * 0.46 : t * S * 0.13 * (arch === 'bare' ? 1 : 0);
      const topY = base - HH * (mat ? 0.55 + Math.abs(t) * -0.28 : 1 - Math.abs(t) * 0.16);
      const tipX = cx + lean * S * 0.06 + spreadX;
      c.beginPath(); c.moveTo(cx, base);
      c.quadraticCurveTo(cx + lean * S * 0.04 + spreadX * 0.35, base - (base - topY) * 0.5, tipX, topY);
      c.stroke();
      wands.push({ tipX, tipY: topY, ang: Math.atan2(topY - base, tipX - cx) });
    }
    /* THE LEAVES, where this architecture actually carries them. */
    const lw = S * (mat ? 0.068 : 0.098) * spread * nvf(name, 0x77, 0.2);
    if (arr === 'basal') {
      /* a naked flowering stem over a ground rosette — chicory, dandelion */
      for (let i = 0; i < leafN + 2; i++) {
        const a = -Math.PI / 2 + ((i / (leafN + 1)) - 0.5) * 2.9 * spread;
        drawLeaf(c, p, cx, base - S * 0.012, a, lw * 1.15, spec.leaf);
      }
    } else {
      const nL = mat ? leafN + 4 : leafN;
      for (let i = 0; i < nL; i++) {
        const u = 0.15 + (i / nL) * 0.78;
        const wd = wands[i % wands.length]!;
        const sx = cx + (wd.tipX - cx) * u, sy = base - (base - wd.tipY) * u;
        /* opposite = a pair at every node; alternate = one side, then the other */
        const sides: readonly number[] = arr === 'alternate' ? [i % 2 ? 1 : -1] : [-1, 1];
        for (const s of sides) {
          drawLeaf(c, p, sx, sy, s < 0 ? Math.PI + 0.45 : -0.45, lw, spec.leaf);
        }
      }
    }
    /* THE FLOWERS. One is terminal; several are borne at the wand tips and
       spaced down the upper stem, which is what makes a chicory read as a
       chicory rather than as a daisy on a stick. */
    if (spec.flower && spec.flower !== 'none') {
      const fR = S * (mat ? 0.030 : nF > 1 ? 0.028 : 0.036);
      for (let i = 0; i < nF; i++) {
        const wd = wands[i % wands.length]!;
        /* the first flower on each wand sits at its tip; later ones step down */
        const step = Math.floor(i / wands.length);
        const k = 1 - step * 0.22;
        const fx = cx + (wd.tipX - cx) * k + (step ? lean * S * 0.02 * (i % 2 ? 1 : -1) : 0);
        const fy = base - (base - wd.tipY) * k - (step ? 0 : S * 0.006);
        drawFlower(c, p, fx, fy, fR, spec.flower, spec.fhue, r);
      }
    }
    if (spec.fruit && spec.fruit !== 'none') {
      const wd = wands[0]!;
      drawFruit(c, p, wd.tipX, base - (base - wd.tipY) * 0.92, S * 0.032, spec.fruit, spec.fhue, r);
    }
  }
}


/** ★ WAVE 18 — THE CARNIVORES. Three plants whose whole identity is a trap.
    None is expressible as habit + leaf + flower at any setting, which is why
    all three have rendered as generic rosettes for as long as the catalogue
    has existed. */
export function floraFlytrap(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0x71A9);
  const cx = S * 0.50, base = S * 0.76;
  ground(c, cx, base + 4, S * 0.16);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.20 + (i / 4) * 0.60) + (r() - 0.5) * 0.14;
    const L = S * (0.15 + r() * 0.07);
    const ex = cx + Math.cos(a) * L, ey = base + Math.sin(a) * L;
    c.strokeStyle = leafGrad(c, p, cx, base, L);
    c.lineWidth = S * 0.016; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, base);
    c.quadraticCurveTo((cx + ex) / 2, (base + ey) / 2 + S * 0.02, ex, ey); c.stroke();
    /* THE TRAP: two hinged lobes held open, red glandular inside, with
       interlocking spiky teeth along the rim — the reason anyone knows it */
    const tw = S * 0.052, open = 0.44 + r() * 0.26;
    c.save(); c.translate(ex, ey); c.rotate(a + Math.PI / 2);
    for (const s of [-1, 1] as const) {
      c.save(); c.rotate(s * open);
      const lg = c.createLinearGradient(0, 0, 0, -tw * 1.5);
      lg.addColorStop(0, '#b8332e');
      lg.addColorStop(0.55, '#8e2a30');
      lg.addColorStop(1, 'rgb(' + ((p.cr * 0.72) | 0) + ',' + ((p.cg * 0.92) | 0) + ',' + ((p.cb * 0.55) | 0) + ')');
      c.fillStyle = lg;
      c.beginPath(); c.ellipse(0, -tw * 0.72, tw * 0.66, tw * 0.86, 0, 0, TAU); c.fill();
      c.strokeStyle = '#d8e0b4'; c.lineWidth = 1.6; c.lineCap = 'round';
      for (let k = 0; k < 8; k++) {
        const t = k / 7, ta = Math.PI * (0.10 + t * 0.80);
        const bx = Math.cos(ta) * tw * 0.62, by = -tw * 0.72 - Math.sin(ta) * tw * 0.82;
        c.beginPath(); c.moveTo(bx, by);
        c.lineTo(bx + Math.cos(ta) * tw * 0.30, by - Math.sin(ta) * tw * 0.34);
        c.stroke();
      }
      c.restore();
    }
    c.restore();
  }
}

export function floraPitcher(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0x9177);
  const cx = S * 0.50, base = S * 0.78;
  const rgb = (a: number, b: number, d: number): string => 'rgb(' + (a | 0) + ',' + (b | 0) + ',' + (d | 0) + ')';
  ground(c, cx, base + 4, S * 0.17);
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const px = cx + (t - 0.5) * S * 0.20 + (r() - 0.5) * S * 0.02;
    const H = S * (0.30 + r() * 0.14) * (0.72 + Math.sin(t * Math.PI) * 0.5);
    const w = S * (0.030 + r() * 0.012);
    /* the TRUMPET: narrow at the foot, FLARING at the mouth */
    const pg = c.createLinearGradient(px - w * 1.6, 0, px + w * 1.6, 0);
    pg.addColorStop(0, rgb(p.cr * 0.62, p.cg * 0.86, p.cb * 0.48));
    pg.addColorStop(0.45, rgb(Math.min(255, p.cr * 1.05), Math.min(255, p.cg * 1.02), p.cb * 0.60));
    pg.addColorStop(1, rgb(p.cr * 0.40, p.cg * 0.52, p.cb * 0.30));
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(px - w * 0.52, base);
    c.quadraticCurveTo(px - w * 0.90, base - H * 0.55, px - w * 1.55, base - H);
    c.lineTo(px + w * 1.55, base - H);
    c.quadraticCurveTo(px + w * 0.90, base - H * 0.55, px + w * 0.52, base);
    c.closePath(); c.fill();
    /* the red veining that walks an insect down the tube */
    c.strokeStyle = 'rgba(150,40,44,0.42)'; c.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(px + k * w * 0.30, base - H * 0.08);
      c.lineTo(px + k * w * 0.66, base - H * 0.94);
      c.stroke();
    }
    c.fillStyle = '#3c2a22';
    c.beginPath(); c.ellipse(px, base - H, w * 1.55, w * 0.50, 0, 0, TAU); c.fill();
    c.strokeStyle = '#c8404a'; c.lineWidth = 2.4;
    c.beginPath(); c.ellipse(px, base - H, w * 1.55, w * 0.50, 0, 0, TAU); c.stroke();
    /* THE HOOD arching over the mouth — the feature that names the plant */
    c.fillStyle = rgb(Math.min(255, p.cr * 1.12), Math.min(255, p.cg * 1.02), p.cb * 0.56);
    c.beginPath();
    c.moveTo(px - w * 1.45, base - H - w * 0.10);
    c.quadraticCurveTo(px - w * 0.5, base - H - w * 2.30, px + w * 1.30, base - H - w * 0.80);
    c.quadraticCurveTo(px + w * 0.4, base - H - w * 0.90, px - w * 1.45, base - H - w * 0.10);
    c.closePath(); c.fill();
  }
}

export function floraSundew(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0x5D14);
  const cx = S * 0.50, cy = S * 0.62;
  const rgb = (a: number, b: number, d: number): string => 'rgb(' + (a | 0) + ',' + (b | 0) + ',' + (d | 0) + ')';
  ground(c, cx, cy + S * 0.06, S * 0.19);
  /* a FLAT GROUND-LEVEL ROSETTE of paddle leaves */
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + r() * 0.2;
    const L = S * (0.11 + r() * 0.05);
    const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * 0.52;
    c.strokeStyle = leafGrad(c, p, cx, cy, L);
    c.lineWidth = S * 0.011; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(ex, ey); c.stroke();
    c.fillStyle = rgb(Math.min(255, p.cr * 1.05), p.cg * 0.80, p.cb * 0.62);
    c.beginPath(); c.ellipse(ex, ey, S * 0.026, S * 0.019, a, 0, TAU); c.fill();
    /* THE TENTACLE HAIRS, each ending in a glistening dew droplet. Without the
       dew this is a small red rosette and nothing more — the drop IS the plant. */
    for (let k = 0; k < 11; k++) {
      const ta = a + (k / 10 - 0.5) * 2.4;
      const hl = S * (0.012 + r() * 0.014);
      const hx = ex + Math.cos(ta) * S * 0.020, hy = ey + Math.sin(ta) * S * 0.014;
      const tx = hx + Math.cos(ta) * hl, ty = hy + Math.sin(ta) * hl - hl * 0.3;
      c.strokeStyle = '#c0392f'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(tx, ty); c.stroke();
      const dg = c.createRadialGradient(tx - 1, ty - 1, 0.4, tx, ty, 2.8);
      dg.addColorStop(0, 'rgba(255,255,255,0.95)');
      dg.addColorStop(0.6, 'rgba(220,240,255,0.70)');
      dg.addColorStop(1, 'rgba(190,220,255,0.10)');
      c.fillStyle = dg;
      c.beginPath(); c.arc(tx, ty, 2.8, 0, TAU); c.fill();
    }
  }
}

/** a formless floating blanket — no stem, no holdfast, hair-fine filaments */
export function floraFloatingAlgae(c: Ctx, g: G, p: Pal, name = ''): void {
  const r = nrng(g, name, 0xA16E);
  const cy = S * 0.50;
  const wg = c.createLinearGradient(0, cy - S * 0.06, 0, cy + S * 0.16);
  wg.addColorStop(0, 'rgba(40,70,86,0)');
  wg.addColorStop(0.4, 'rgba(38,66,84,0.45)');
  wg.addColorStop(1, 'rgba(24,44,58,0.20)');
  c.fillStyle = wg;
  c.fillRect(0, cy - S * 0.06, S, S * 0.22);
  for (let i = 0; i < 220; i++) {
    const x0 = S * (0.10 + r() * 0.80), y0 = cy + (r() - 0.5) * S * 0.10;
    const L = S * (0.03 + r() * 0.09), a = (r() - 0.5) * 1.5;
    const m = 0.6 + r() * 0.7;
    c.strokeStyle = 'rgba(' + (Math.min(255, p.cr * m) | 0) + ',' + (Math.min(255, p.cg * m) | 0)
      + ',' + (Math.min(255, p.cb * m * 0.8) | 0) + ',' + (0.30 + r() * 0.45).toFixed(2) + ')';
    c.lineWidth = 0.9 + r() * 1.0; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo(x0 + Math.cos(a) * L * 0.6, y0 + Math.sin(a) * L * 0.6 - L * 0.2,
      x0 + Math.cos(a) * L, y0 + Math.sin(a) * L);
    c.stroke();
  }
}
