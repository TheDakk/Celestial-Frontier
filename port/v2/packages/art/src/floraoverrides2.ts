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
  leaf: 'broad' | 'lance' | 'needle' | 'pinnate' | 'palmate' | 'blade' | 'frond' | 'scale' | 'heart' | 'pad' | 'trefoil' | 'arrow' | 'crinkle';
  flower?: 'none' | 'head' | 'spike' | 'umbel' | 'bell' | 'star' | 'catkin' | 'cross' | 'cone';
  fruit?: 'none' | 'berry' | 'drupe' | 'pome' | 'citrus' | 'pod' | 'nut' | 'cone' | 'grain' | 'melon' | 'fig' | 'cluster'
    /* ★ WAVE 58 — species fruit SHAPES. The tree body was fine; every fruit was
       the same small round sphere, so Pear read as Apple and Mango as Orange
       (the judge's words). These are the shapes that name the species. */
    | 'pear' | 'spiky' | 'star' | 'crown' | 'hairy'
    /* ★ WAVE 61 — cereal head TYPES. One awned ear made every grain look alike
       (gp5). 'grain' = the dense awned ear (wheat/barley/rye); 'panicle' = a
       loose nodding open spray (oats/rice); 'club' = a dense bristly cylinder
       (millet/sorghum). */
    | 'panicle' | 'club';
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
  /* ★ WAVE 58 — BOTANICAL-FAMILY CUES. Gold pass 4 failed nine mints as one
     body because none of the Lamiaceae read-cues existed: toothed opposite
     leaves, a square reddish stem, and flowers borne in WHORLS up the stem
     (verticillasters) rather than one terminal spike. All three default off, so
     every plant that does not set them is byte-unchanged (D-ART-14). */
  /** serrated leaf margin — mints, nettles, brassicas (the judge failed "smooth
      rounded blobs with no teeth" across a dozen species) */
  toothed?: boolean;
  /** a squared, faintly reddish/ridged stem — the mint-family giveaway */
  square?: boolean;
  /** flowers borne in rings at the upper leaf axils, not just at the tip */
  whorl?: boolean;
  /** slender beaked seed pods (siliques) up-and-out along the upper stem — the
      other half of a brassica's read alongside the four-petal cross flower */
  pods?: boolean;
  /** drooping catkin-like flower strings hanging from the upper leaf axils —
      the nettle's inconspicuous green tassels */
  tassel?: boolean;
  /** a woody shrub that trails as a LOW CREEPING MAT, wider than tall — the
      groundcover berries (bearberry, crowberry, cranberry, lingonberry) that
      the judge failed for being drawn as tall upright cane-vases */
  creep?: boolean;
  /** a woody shrub as a DENSE ROUNDED twiggy bush with a filled leafy crown —
      tea, tea tree, tamarisk, bay laurel (failed as "five open bare stalks") */
  dense?: boolean;
  /** a palm-habit plant with a smooth GREEN false trunk and huge paddle leaves
      instead of a woody trunk and fronds — banana, plantain */
  pseudostem?: boolean;
  /** the harvested underground organ, shown pulled up at the base: a long ropey
      taproot (licorice), a forked root (ginseng), or a knobbly rhizome
      (ginger, turmeric, valerian). The judge failed several for its absence. */
  root?: 'taproot' | 'forked' | 'rhizome';
}

/** one leaf, drawn along a direction — the shape IS the family */
/** the cost dial for leaf venation — see MAT_DETAIL. 0 restores the flat leaf. */
const LEAF_DETAIL = 1;

function drawLeaf(c: Ctx, p: Pal, x: number, y: number, ang: number, len: number, kind: PlantSpec['leaf'], toothed = false): void {
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
  if (kind === 'crinkle') {   /* a huge PUCKERED cabbage/rhubarb blade — a broad
       rounded leaf with a wavy scalloped margin and a heavy branching midrib. */
    const wl = len * 0.82, lobes = 9;
    c.fillStyle = leafGrad(c, p, len * 0.55, 0, len * 0.6);
    c.beginPath(); c.moveTo(0, 0);
    for (let i = 0; i <= lobes; i++) { const u = i / lobes; const env = Math.sin(u * Math.PI);
      c.lineTo(len * u, -wl * env * (0.82 + (i % 2) * 0.28)); }
    for (let i = lobes; i >= 0; i--) { const u = i / lobes; const env = Math.sin(u * Math.PI);
      c.lineTo(len * u, wl * env * (0.82 + (i % 2) * 0.28)); }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,40,20,0.30)'; c.lineWidth = Math.max(1.6, len * 0.02);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len * 0.9, 0);
    for (let k = 1; k <= 4; k++) { const lx = len * k / 5; c.moveTo(lx, 0); c.lineTo(lx + len * 0.14, -wl * 0.5 * Math.sin(Math.PI * k / 5)); c.moveTo(lx, 0); c.lineTo(lx + len * 0.14, wl * 0.5 * Math.sin(Math.PI * k / 5)); }
    c.stroke();
    c.restore(); return;
  }
  if (kind === 'arrow') {   /* a SAGITTATE blade — arrowhead, taro, wild yam: a
       broad heart-to-arrow leaf with two backward-pointing basal lobes. */
    const wl = len * 0.62;
    c.fillStyle = leafGrad(c, p, len * 0.5, 0, len * 0.5);
    c.beginPath();
    c.moveTo(0, 0);                                   /* petiole join */
    c.lineTo(-len * 0.10, -wl * 0.62);                /* left rear barb */
    c.quadraticCurveTo(len * 0.16, -wl * 0.5, len * 0.34, -wl * 0.42);
    c.quadraticCurveTo(len * 0.82, -wl * 0.2, len, 0);   /* tip */
    c.quadraticCurveTo(len * 0.82, wl * 0.2, len * 0.34, wl * 0.42);
    c.quadraticCurveTo(len * 0.16, wl * 0.5, -len * 0.10, wl * 0.62);   /* right rear barb */
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,32,18,0.34)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(len * 0.92, 0); c.stroke();   /* midrib */
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-len * 0.08, -wl * 0.5); c.moveTo(0, 0); c.lineTo(-len * 0.08, wl * 0.5); c.stroke();
    c.restore(); return;
  }
  if (kind === 'trefoil') {   /* ★ WAVE 61 — THREE ROUND CLOVER LEAFLETS from one
       point. The old obovate leaflets were too narrow and read as plain ovals
       (gp5). Now wide obcordate (heart) leaflets with a notched tip, splayed
       wider, so even small it reads as a shamrock. */
    for (const i of [-1, 0, 1]) {
      c.save(); c.rotate(i * 0.85);
      const ll = len * (i === 0 ? 0.92 : 0.80), lw = ll * 0.62;
      c.fillStyle = leafGrad(c, p, ll * 0.55, 0, ll * 0.55);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(ll * 0.30, -lw, ll * 0.82, -lw * 0.9);   /* out to the wide shoulder */
      c.quadraticCurveTo(ll * 1.12, -lw * 0.5, ll * 0.9, 0);      /* round over toward the notch */
      c.quadraticCurveTo(ll * 1.12, lw * 0.5, ll * 0.82, lw * 0.9);
      c.quadraticCurveTo(ll * 0.30, lw, 0, 0);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,40,20,0.28)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(ll * 0.85, 0); c.stroke();   /* midrib */
      c.restore();
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
  if (toothed) {
    /* ★ WAVE 58 — a FINELY SERRATED margin. A smooth oval reads as "a leaf-
       shaped blob"; small teeth are what say mint / nettle / brassica. The
       outline follows the blade envelope (so the leaf still tapers to a point)
       with a shallow ±sawtooth on top — a serration, not the holly spikes the
       first cut drew. A heart leaf keeps its base-heavy, wide-shouldered
       envelope (nettle) while gaining the teeth. */
    const heart = kind === 'heart';
    const env = (u: number): number => heart
      ? Math.sin(Math.min(1, u * 1.35) * Math.PI * 0.92) ** 0.5 * 1.5   /* wide, shouldered near the base */
      : Math.sin(u * Math.PI) ** 0.7;
    const teeth = 11;
    for (let i = 0; i <= teeth; i++) { const u = i / teeth; c.lineTo(len * u, -w * env(u) * (1 - (i % 2) * 0.32)); }
    for (let i = teeth; i >= 0; i--) { const u = i / teeth; c.lineTo(len * u, w * env(u) * (1 - (i % 2) * 0.32)); }
  } else if (kind === 'heart') {
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
  } else if (kind === 'pear') {
    /* a teardrop: narrow neck at the stem, swelling to a round base. Pear,
       avocado, mango, cashew apple — the shape the judge said was "absent, so
       this is an apple". */
    const rr = R * 1.15;
    c.fillStyle = shade(x, y + rr * 0.2, rr);
    c.beginPath();
    c.moveTo(x, y - rr * 0.95);
    c.bezierCurveTo(x - rr * 0.42, y - rr * 0.7, x - rr * 0.78, y + rr * 0.2, x - rr * 0.5, y + rr * 0.72);
    c.bezierCurveTo(x - rr * 0.2, y + rr * 1.08, x + rr * 0.2, y + rr * 1.08, x + rr * 0.5, y + rr * 0.72);
    c.bezierCurveTo(x + rr * 0.78, y + rr * 0.2, x + rr * 0.42, y - rr * 0.7, x, y - rr * 0.95);
    c.closePath(); c.fill();
    c.strokeStyle = '#4a3a22'; c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - rr * 0.9); c.lineTo(x + rr * 0.12, y - rr * 1.3); c.stroke();
  } else if (kind === 'spiky') {
    /* a spined burr — chestnut husk, durian. The spikes ARE the identity. */
    const rr = R * 1.05;
    c.fillStyle = shade(x, y, rr);
    c.beginPath(); c.arc(x, y, rr * 0.8, 0, TAU); c.fill();
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1.4, rr * 0.05);
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU, r0 = rr * 0.72, r1 = rr * (1.05 + (i % 2) * 0.12);
      c.beginPath();
      c.moveTo(x + Math.cos(a - 0.09) * r0, y + Math.sin(a - 0.09) * r0);
      c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
      c.lineTo(x + Math.cos(a + 0.09) * r0, y + Math.sin(a + 0.09) * r0);
      c.closePath(); c.fill(); }
  } else if (kind === 'star') {
    /* carambola — five sharp longitudinal wings, seen end-on as a star. */
    const rr = R * 1.15; c.fillStyle = shade(x, y, rr);
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rad = i % 2 ? rr * 0.32 : rr * 1.1;
      const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; i === 0 ? c.moveTo(px, py) : c.lineTo(px, py); }
    c.closePath(); c.fill();
  } else if (kind === 'crown') {
    /* pomegranate/persimmon — a round fruit topped by a calyx crown of points. */
    const rr = R * 1.05; c.fillStyle = shade(x, y, rr);
    c.beginPath(); c.ellipse(x, y, rr, rr * 1.02, 0, 0, TAU); c.fill();
    c.fillStyle = col;
    for (let i = -2; i <= 2; i++) { c.save(); c.translate(x, y - rr * 0.9); c.rotate(i * 0.4);
      c.beginPath(); c.moveTo(-rr * 0.1, 0); c.lineTo(0, -rr * 0.42); c.lineTo(rr * 0.1, 0); c.closePath(); c.fill(); c.restore(); }
  } else if (kind === 'hairy') {
    /* rambutan/lychee — a round fruit under a coat of soft spines. */
    const rr = R * 0.95; c.fillStyle = shade(x, y, rr);
    c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = Math.max(1.2, rr * 0.06); c.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU;
      c.beginPath(); c.moveTo(x + Math.cos(a) * rr * 0.9, y + Math.sin(a) * rr * 0.9);
      c.lineTo(x + Math.cos(a + 0.3) * rr * 1.35, y + Math.sin(a + 0.3) * rr * 1.35); c.stroke(); }
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
  } else if (kind === 'panicle') {
    /* ★ WAVE 61 — a LOOSE NODDING PANICLE (oats, rice): open branches arching
       out and down, each hung with a few teardrop spikelets. The opposite of a
       compact ear. */
    c.strokeStyle = p.dark; c.lineWidth = Math.max(1.4, R * 0.05); c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const u = i / 8, sy = y - R * 1.5 + u * R * 1.9, s = i % 2 ? 1 : -1;
      const ex = x + s * R * (0.3 + u * 0.7), ey = sy + R * 0.5;
      c.beginPath(); c.moveTo(x + (u - 0.5) * R * 0.2, sy); c.quadraticCurveTo(x + s * R * 0.4, sy + R * 0.1, ex, ey); c.stroke();
      const gg = c.createLinearGradient(ex, ey, ex, ey + R * 0.3);
      gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(80,60,20,0.5)');
      c.fillStyle = gg; c.beginPath(); c.ellipse(ex, ey + R * 0.14, R * 0.09, R * 0.18, s * 0.3, 0, TAU); c.fill();
    }
  } else if (kind === 'club') {
    /* ★ WAVE 61 — a dense bristly CYLINDER/CLUB (millet, sorghum, foxtail): a
       fat packed spike with a fuzz of short bristles, not a fanned awn crown. */
    const top = y - R * 1.6, bot = y + R * 0.3;
    for (let i = 0; i < 60; i++) {
      const u = i / 59, yy = bot + (top - bot) * u;
      const halfW = R * 0.34 * Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.92) + R * 0.05;
      const fx = x + (r() - 0.5) * halfW * 1.9;
      const gg = c.createRadialGradient(fx - R * 0.04, yy - R * 0.04, 1, fx, yy, R * 0.16);
      gg.addColorStop(0, 'rgba(255,250,220,0.7)'); gg.addColorStop(0.5, col); gg.addColorStop(1, 'rgba(70,50,16,0.5)');
      c.fillStyle = gg; c.beginPath(); c.arc(fx, yy, R * 0.10, 0, TAU); c.fill();
    }
    c.strokeStyle = col; c.lineWidth = 1; c.globalAlpha = 0.5;   /* the bristle fuzz */
    for (let i = 0; i < 30; i++) { const u = r(), yy = bot + (top - bot) * u, s = r() < 0.5 ? -1 : 1;
      c.beginPath(); c.moveTo(x + s * R * 0.3, yy); c.lineTo(x + s * R * 0.55, yy - R * 0.1); c.stroke(); }
    c.globalAlpha = 1;
  } else if (kind === 'grain') {
    /* ★ WAVE 58 — a bristling AWNED ear (wheat, barley, rye). The single
       must-read the judge failed all of them for is "long stiff awns fanning
       up, longer than the head itself" — the old ear had 7 short stubs. Now a
       plump two-rank ear of grains under a wide fan of long awns. */
    const rows = 7;
    /* the awns first, behind the grains: a wide upward fan, each awn longer
       than the ear */
    c.strokeStyle = col; c.lineWidth = Math.max(1.4, R * 0.05); c.lineCap = 'round';
    for (let i = 0; i < 15; i++) {
      const t = (i / 14 - 0.5);
      c.beginPath(); c.moveTo(x + t * R * 0.5, y - R * 1.3);
      c.lineTo(x + t * R * 2.6, y - R * 3.1); c.stroke();
    }
    for (let i = 0; i < rows; i++) {
      const yy = y - R * 1.15 + i * R * 0.34;
      for (const s of [-1, 1] as const) {
        /* each spikelet a plump lit bead */
        const bx = x + s * R * 0.24, gg = c.createRadialGradient(bx - R * 0.06, yy - R * 0.08, 1, bx, yy, R * 0.28);
        gg.addColorStop(0, 'rgba(255,250,220,0.7)'); gg.addColorStop(0.5, col); gg.addColorStop(1, 'rgba(60,44,16,0.5)');
        c.fillStyle = gg;
        c.beginPath(); c.ellipse(bx, yy, R * 0.22, R * 0.13, s * 0.5, 0, TAU); c.fill();
      }
    }
  }
}

function drawFlower(c: Ctx, p: Pal, x: number, y: number, R: number, kind: NonNullable<PlantSpec['flower']>, hue: string | undefined, r: () => number): void {
  const col = hue ?? '#e6d98f';
  /* ★ WAVE 58 — THE INFLORESCENCE IS A STRUCTURE WITH SIZE, NOT AN ORNAMENT.
     Gold pass 4's flora prose named this on 39% of all flora: "a thin white
     crescent 20px wide", "a single thin yellow arc", "a 5px-wide stub". The
     defect was two things at once — the R passed in was a speck (fixed at the
     call sites), and these shapes DEGRADED at small R into a crescent (umbel)
     and a dotted stub (spike). Rebuilt so each reads as a bloom head even
     before the size bump: a domed compound umbel, a dense tapering spike, a
     fuller composite. Colour-only difference across neighbours is what the
     judge failed them for, so the FORM now carries identity too. */
  const litFloret = (fx: number, fy: number, rr: number): void => {
    const gg = c.createRadialGradient(fx - rr * 0.3, fy - rr * 0.35, 1, fx, fy, rr * 1.1);
    gg.addColorStop(0, 'rgba(255,255,255,0.55)'); gg.addColorStop(0.5, col); gg.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = gg; c.beginPath(); c.arc(fx, fy, rr, 0, TAU); c.fill();
  };
  if (kind === 'head') {          /* a composite: two ranks of ray florets round a domed disc */
    for (const [rank, rad, wide] of [[16, 0.92, 0.24], [13, 0.66, 0.20]] as const) {
      for (let i = 0; i < rank; i++) {
        const a = (i / rank) * TAU + rank * 0.11;
        c.fillStyle = col;
        c.save(); c.translate(x, y); c.rotate(a);
        c.beginPath(); c.ellipse(R * rad * 0.5, 0, R * rad * 0.42, R * wide, 0, 0, TAU); c.fill();
        c.restore();
      }
    }
    const dg = c.createRadialGradient(x - R * 0.12, y - R * 0.12, 1, x, y, R * 0.42);
    dg.addColorStop(0, '#8a6d28'); dg.addColorStop(1, '#5a4318');
    c.fillStyle = dg; c.beginPath(); c.arc(x, y, R * 0.40, 0, TAU); c.fill();
    for (let i = 0; i < 20; i++) { const a = r() * TAU, d = r() ** 0.5 * R * 0.34; softMark(c, x + Math.cos(a) * d, y + Math.sin(a) * d, R * 0.06, R * 0.06, '30,22,8', 0.5); }
  } else if (kind === 'spike' || kind === 'catkin') {
    /* a DENSE column of florets, widest below the middle and tapering to a
       point — a real raceme/spike, not a line of beads. Built bottom-up over
       ~1.9R of height so it is unmistakably a structure. */
    const nf = kind === 'catkin' ? 34 : 46, top = y - R * 1.55, bot = y + R * 0.42;
    for (let i = 0; i < nf; i++) {
      const u = i / (nf - 1);                     /* 0 = bottom (oldest/open) → 1 = tip */
      const yy = bot + (top - bot) * u;
      const halfW = R * (kind === 'catkin' ? 0.30 : 0.42) * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.9) * (1 - u * 0.25);
      const fx = x + (r() - 0.5) * Math.max(2, halfW * 1.5);
      litFloret(fx, yy, R * (0.13 + (1 - u) * 0.06));
    }
  } else if (kind === 'umbel') {
    /* a DOMED compound umbel: pedicels radiating up-and-out to a rounded head,
       each carrying a little cluster. The old crescent only swept the top-left
       2 radians and vanished into an arc at small R. */
    c.strokeStyle = p.dark; c.lineWidth = Math.max(1.4, R * 0.03);
    const hub = y + R * 0.16;
    /* two ranks of pedicels — an outer rim AND a shorter inner ring — so the
       head reads as a domed mass with body, not an empty arc of dots on a rim */
    for (const [rays, reach, rise] of [[13, 0.98, 0.86], [9, 0.58, 0.60]] as const) {
      for (let i = 0; i < rays; i++) {
        const a = -Math.PI + (i / (rays - 1)) * Math.PI;   /* full 180° dome, left to right */
        const ex = x + Math.cos(a) * R * reach, ey = hub - Math.abs(Math.sin(a)) * R * rise - R * 0.12;
        c.beginPath(); c.moveTo(x, hub); c.quadraticCurveTo(x + Math.cos(a) * R * reach * 0.4, hub - R * 0.3, ex, ey); c.stroke();
        for (let k = 0; k < 4; k++) { const aa = a + (k - 1.5) * 0.16; litFloret(ex + Math.cos(aa) * R * 0.13, ey + Math.sin(aa) * R * 0.11, R * 0.085); }
      }
    }
  } else if (kind === 'bell') {
    /* ★ WAVE 58 — a tall one-sided RACEME of tubular bells with a FLARED,
       lobed mouth (foxglove, gentian, bellflower). The judge failed these for
       "no flared 5-lobed mouth" and "minuscule bells". Bigger, and each bell
       now opens to a scalloped rim. */
    const nb = 6;
    for (let i = 0; i < nb; i++) {
      const u = i / (nb - 1);
      const yy = y - R * 1.35 + u * R * 1.9;          /* down the raceme */
      const xx = x + (i % 2 ? 1 : -1) * R * 0.34 * (0.5 + u);
      const bw = R * (0.30 + u * 0.16), bl = R * (0.5 + u * 0.3);
      const gg = c.createLinearGradient(xx, yy, xx, yy + bl);
      gg.addColorStop(0, 'rgba(255,255,255,0.4)'); gg.addColorStop(0.5, col); gg.addColorStop(1, 'rgba(0,0,0,0.25)');
      c.fillStyle = gg;
      c.beginPath(); c.moveTo(xx - bw * 0.5, yy);
      c.quadraticCurveTo(xx - bw * 0.72, yy + bl * 0.85, xx, yy + bl);        /* left wall */
      c.quadraticCurveTo(xx + bw * 0.72, yy + bl * 0.85, xx + bw * 0.5, yy);  /* right wall */
      c.closePath(); c.fill();
      /* the flared, lobed mouth */
      c.fillStyle = col;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(xx + k * bw * 0.24, yy + bl, bw * 0.16, 0, TAU); c.fill(); }
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
  } else if (kind === 'cone') {
    /* ★ WAVE 58 — A CONEFLOWER: backswept drooping rays under a RAISED bristly
       central cone. Echinacea, Rudbeckia, Chamomile. The plain 'head' drew a
       flat disc with flat spokes; the judge failed those species for exactly
       the missing raised cone and the folded-back rays. */
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      c.fillStyle = col;
      c.save(); c.translate(x, y); c.rotate(a);
      /* a ray that sweeps out then droops down at the tip */
      c.beginPath(); c.moveTo(R * 0.34, 0);
      c.quadraticCurveTo(R * 0.8, -R * 0.12, R * 1.02, R * 0.16);
      c.quadraticCurveTo(R * 0.8, R * 0.14, R * 0.34, 0);
      c.closePath(); c.fill(); c.restore();
    }
    /* the raised cone: a domed disc with a bristly stipple, lit from upper-left */
    const cg = c.createRadialGradient(x - R * 0.14, y - R * 0.16, 1, x, y, R * 0.46);
    cg.addColorStop(0, '#b07a2e'); cg.addColorStop(1, '#5c3d12');
    c.fillStyle = cg; c.beginPath(); c.ellipse(x, y, R * 0.42, R * 0.40, 0, 0, TAU); c.fill();
    for (let i = 0; i < 40; i++) { const a = r() * TAU, d = r() ** 0.5 * R * 0.36; softMark(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, R * 0.05, R * 0.05, '90,58,20', 0.6); }
  } else if (kind === 'cross') {
    /* ★ WAVE 58 — THE BRASSICA HEAD: a corymb of tiny FOUR-petal cross flowers
       (the Brassicaceae signature) with a knot of unopened buds at the very top.
       Gold pass 4 failed mustard/canola/rocket for "no four-petalled crosses,
       just a yellow smear". Each floret is a true cruciform. */
    const florets = 9;
    for (let i = 0; i < florets; i++) {
      const a = (i / florets) * TAU + i * 0.7, d = R * (0.28 + (i % 3) * 0.26);
      const fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.85 - R * 0.15;
      for (let pmt = 0; pmt < 4; pmt++) {
        c.fillStyle = col; c.save(); c.translate(fx, fy); c.rotate(pmt * Math.PI / 2 + 0.4);
        c.beginPath(); c.ellipse(R * 0.16, 0, R * 0.15, R * 0.11, 0, 0, TAU); c.fill(); c.restore();
      }
      c.fillStyle = '#e8c848'; c.beginPath(); c.arc(fx, fy, R * 0.055, 0, TAU); c.fill();
    }
    /* the bud knot crowning the raceme */
    c.fillStyle = p.dark;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * R * 0.12, y - R * 0.9 + Math.sin(a) * R * 0.1, R * 0.07, 0, TAU); c.fill(); }
  }
}

/** ★ WAVE 58 — a seaweed HOLDFAST: the root-like grip that anchors an alga,
    so it rises from a claw on the rock instead of a point pinched to the soil. */
function holdfast(c: Ctx, cx: number, base: number, col: string): void {
  c.strokeStyle = col; c.lineWidth = Math.max(2, S * 0.006); c.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx, base - S * 0.01); c.quadraticCurveTo(cx + i * S * 0.02, base + S * 0.01, cx + i * S * 0.035, base + S * 0.03); c.stroke(); }
}

/** ★ WAVE 58 — THE HARVESTED ROOT, pulled up at the base. A root-crop's whole
    identity is the organ you dig up (licorice's rope, ginseng's forked man,
    ginger's rhizome), and the judge failed those species for drawing only
    foliage. */
function drawRoot(c: Ctx, cx: number, base: number, kind: NonNullable<PlantSpec['root']>): void {
  const rg = c.createLinearGradient(cx, base, cx, base + S * 0.16);
  rg.addColorStop(0, '#c8b48a'); rg.addColorStop(1, '#8a6f44');
  c.fillStyle = rg; c.strokeStyle = '#6e5734'; c.lineWidth = Math.max(2, S * 0.006); c.lineCap = 'round';
  if (kind === 'rhizome') {
    /* a knobbly horizontal finger-mass sitting on the soil line */
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.ellipse(cx + i * S * 0.045, base + S * 0.03, S * 0.038, S * 0.022, i * 0.3, 0, TAU); c.fill();
    }
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(cx + i * S * 0.05, base + S * 0.03); c.lineTo(cx + i * S * 0.07, base + S * 0.075); c.stroke(); }
    return;
  }
  const prongs = kind === 'forked' ? [-1, 1] : [0];
  for (const s of prongs) {
    c.beginPath(); c.moveTo(cx - S * 0.02, base);
    c.quadraticCurveTo(cx + s * S * 0.03, base + S * 0.08, cx + s * S * 0.05, base + S * 0.17);
    c.quadraticCurveTo(cx + s * S * 0.01, base + S * 0.09, cx + S * 0.02, base);
    c.closePath(); c.fill();
    /* rootlets */
    for (let k = 0; k < 3; k++) { const ry = base + S * (0.05 + k * 0.04); c.beginPath(); c.moveTo(cx + s * S * 0.03, ry); c.lineTo(cx + s * S * 0.07, ry + S * 0.02); c.stroke(); }
  }
}

/** ★ WAVE 58 — SILIQUES. Slender beaked seed pods held up-and-out along the
    upper stem, the other half of a brassica's read (mustard, canola, rocket). */
function drawSiliques(c: Ctx, p: Pal, cx: number, tipX: number, base: number, tipY: number, hue: string | undefined): void {
  c.strokeStyle = hue ?? p.base; c.lineWidth = Math.max(2, S * 0.006); c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const u = 0.45 + (i / 7) * 0.42, s = i % 2 ? 1 : -1;
    const sx = cx + (tipX - cx) * u, sy = base - (base - tipY) * u;
    const ang = -0.5 * s - 0.7, L = S * 0.055;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(ang) * L, sy + Math.sin(ang) * L); c.stroke();
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
  const toothed = spec.toothed ?? false;
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
  /* ★ WAVE 42, CODE PASS H4 — THE D-ART-125 BARK FIX NEVER REACHED THE PALMS.
     `woody` excluded 'palm', so barkCol resolved to stemCol — the FOLIAGE
     green — for Papaya, Coconut, Date Palm, Banana, Plantain and four more,
     nine species stroking a grass-green trunk under the comment that declared
     the problem fixed. A palm's trunk is wood. (Same partial-fix shape as the
     turtle legs and the wave-13 ear: the fix stopped at the boundary of the
     case it was looking at.) */
  const woody = spec.habit === 'tree' || spec.habit === 'shrub' || spec.habit === 'palm';
  const barkCol = spec.bark ?? (woody ? '#6b4a2e' : stemCol);
  const topY = base - H;

  if (spec.habit === 'palm') {
    /* ★ WAVE 58 — A PALM IS ONE UNBRANCHED STEM, NOT A FORKING TREE. The judge
       failed the palms for a "forked woody trunk"; they share the tree code
       whose two boughs are exactly that fork. A palm trunk rises single and
       clean to a crown of fronds; a banana/plantain has a smooth GREEN false
       trunk (pseudostem) and huge paddle leaves, not wood and fronds. */
    const tw = S * 0.030 * nvf(name, 0x55, 0.22);
    const px = cx + lean * S * 0.10, py = topY + H * 0.16;
    if (spec.pseudostem) {
      /* banana: a fat smooth green sheathed false-trunk */
      const pg = c.createLinearGradient(cx - tw * 2, 0, cx + tw * 2, 0);
      pg.addColorStop(0, p.dark); pg.addColorStop(0.5, p.base); pg.addColorStop(1, p.dark);
      c.fillStyle = pg;
      c.beginPath(); c.moveTo(cx - tw * 1.7, base); c.lineTo(cx - tw * 1.1, py); c.lineTo(cx + tw * 1.1, py); c.lineTo(cx + tw * 1.7, base); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,40,20,0.25)'; c.lineWidth = 1.5;
      for (let k = 1; k <= 3; k++) { c.beginPath(); c.moveTo(cx - tw * (1.7 - k * 0.15), base - H * 0.05 * k); c.lineTo(cx + tw * (1.7 - k * 0.15), base - H * 0.05 * k); c.stroke(); }
      /* huge arching paddle leaves */
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5; drawLeaf(c, p, px, py, a, H * 0.5 * spread, 'broad'); }
    } else {
      c.strokeStyle = barkCol; c.lineCap = 'round'; c.lineWidth = tw * 1.5;
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + lean * S * 0.04, base - H * 0.5, px, py); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1.5;   /* trunk rings */
      for (let k = 1; k <= 7; k++) { const ty = base - (base - py) * (k / 8); c.beginPath(); c.moveTo(cx + (px - cx) * (k / 8) - tw, ty); c.lineTo(cx + (px - cx) * (k / 8) + tw, ty); c.stroke(); }
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.42; drawLeaf(c, p, px, py, a, H * 0.5 * spread, 'frond'); }
    }
    if (spec.fruit && spec.fruit !== 'none') { const shaped = ['pear', 'spiky', 'star', 'crown', 'hairy', 'melon', 'cluster'].includes(spec.fruit);
      for (let i = 0; i < (shaped ? 3 : 4); i++) drawFruit(c, p, px + (r() - 0.5) * S * 0.1, py + S * 0.03 + (r() - 0.5) * S * 0.05, S * 0.04, spec.fruit, spec.fhue, r); }
  } else if (spec.habit === 'tree') {
    /* A TREE IS A TRUNK HOLDING A CANOPY — and the trunk TAPERS and forks,
       which is what stops it reading as a lollipop on a stick. */
    const tw = S * 0.030 * nvf(name, 0x55, 0.24);
    /* ★ D-ART-125 — the trunk is WOOD. It was stroked in stemCol, which derives
       from the FOLIAGE hue, so Cinnamon's trunk came out grass-green. */
    c.strokeStyle = barkCol; c.lineCap = 'round';
    c.lineWidth = tw * 2;
    c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + lean * S * 0.05, base - H * 0.5, cx + lean * S * 0.10, topY + H * 0.22); c.stroke();
    c.lineWidth = tw * 1.15;
    /* ★ WAVE 61 — only a TALL conifer is a spire. A pinyon pine is a low rounded
       bushy tree, and gp5 rightly failed it as a Christmas-tree cone; those
       (not tall) fall through to the normal rounded crown they read as before. */
    const conifer = (spec.leaf === 'needle' || spec.leaf === 'scale') && spec.fruit === 'cone' && spec.tall;
    if (conifer) {
      /* ★ WAVE 58 — A CONIFER IS A CONICAL SPIRE OF TIERED BOUGHS, not a round
         deciduous lollipop (the judge failed Spruce/Cedar/Redwood for exactly
         that). Stacked drooping triangular tiers narrowing to a leader. */
      const tiers = 6, cwid = S * 0.19 * spread;
      const gA = [40, 78, 52];
      const fmix = (ch: number, an: number): number => an * 0.66 + ch * 0.34;
      const fB = [fmix(p.cr, gA[0]!), fmix(p.cg, gA[1]!), fmix(p.cb, gA[2]!)];
      for (let t = 0; t < tiers; t++) {
        const v = t / tiers, ty = base - H * (0.28 + v * 0.68), half = cwid * (1 - v * 0.82);
        const val = 0.55 + v * 0.5;
        c.fillStyle = `rgb(${Math.min(255, fB[0]! * val | 0)},${Math.min(255, fB[1]! * val | 0)},${Math.min(255, fB[2]! * val | 0)})`;
        c.beginPath(); c.moveTo(cx + lean * S * 0.08 * v, ty - H * 0.16);
        c.lineTo(cx - half + lean * S * 0.08 * v, ty); c.lineTo(cx + half + lean * S * 0.08 * v, ty); c.closePath(); c.fill();
        /* a few needle sprigs on the tier edge for texture */
        for (let i = 0; i < 5; i++) { const sx = cx + (i / 4 - 0.5) * half * 1.6 + lean * S * 0.08 * v; drawLeaf(c, p, sx, ty - H * 0.02, i % 2 ? 0.4 : Math.PI - 0.4, S * 0.03, 'needle'); }
      }
      if (spec.fruit === 'cone') for (let i = 0; i < 3; i++) drawFruit(c, p, cx + (r() - 0.5) * cwid, base - H * (0.4 + r() * 0.4), S * 0.03, 'cone', spec.fhue, r);
    } else {
    for (const s of [-1, 1] as const) {   /* two boughs into the canopy */
      c.beginPath(); c.moveTo(cx + lean * S * 0.06, base - H * 0.45);
      c.quadraticCurveTo(cx + s * S * 0.05, base - H * 0.72, cx + s * S * 0.085 * spread, topY + H * 0.20); c.stroke();
    }
    {
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
        /* ★ WAVE 58 — fewer, BIGGER fruit so a species shape (pear taper, star,
           spiny burr) actually reads instead of dissolving into the canopy. */
        const shaped = ['pear', 'spiky', 'star', 'crown', 'hairy', 'citrus', 'melon'].includes(spec.fruit);
        const nFr = shaped ? 3 : 4, fRad = shaped ? S * 0.050 : S * 0.034;
        for (let i = 0; i < nFr; i++) {
          const a = r() * TAU, d = 0.45 + r() * 0.55;
          drawFruit(c, p, cx + Math.cos(a) * cw * d + lean * S * 0.10, topY + H * 0.16 + Math.sin(a) * chh * d, fRad, spec.fruit, spec.fhue, r);
        }
      }
    }
    }
  } else if (spec.habit === 'shrub' && spec.creep) {
    /* ★ WAVE 58 — A CREEPING GROUNDCOVER MAT. The judge failed a whole cluster
       of trailing berries (bearberry, crowberry, cranberry, lingonberry) for
       being drawn as tall upright cane-vases when their headline must-read is
       "a flat mat, wider than tall". Woody runners spread sideways low to the
       ground, small leaves crowded along them, berries sitting in the mat. */
    const runners = 6;
    for (let k = 0; k < runners; k++) {
      const s = (k - (runners - 1) / 2) / runners;                 /* -0.5..0.5 */
      const dir = Math.sign(s || 1);
      const ex = cx + s * S * 0.44, ey = base - S * (0.02 + Math.abs(s) * 0.16);
      c.strokeStyle = barkCol; c.lineWidth = S * 0.008; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + s * S * 0.2, base + S * 0.02, ex, ey); c.stroke();
      const nlv = leafN + 2;
      for (let i = 0; i < nlv; i++) {
        const u = 0.12 + (i / nlv) * 0.88;
        const lx = cx + (ex - cx) * u, ly = base + (ey - base) * u;
        drawLeaf(c, p, lx, ly, (i % 2 ? -0.5 : -2.6) + dir * 0.3, S * 0.05 * nvf(name, 0x77, 0.2), spec.leaf, toothed);
        if (spec.fruit && spec.fruit !== 'none' && i > 1 && i % 3 === 0) drawFruit(c, p, lx, ly - S * 0.006, S * 0.022, spec.fruit, spec.fhue, r);
      }
      if (spec.flower && spec.flower !== 'none' && k % 2 === 0) drawFlower(c, p, ex, ey - S * 0.01, S * 0.03, spec.flower, spec.fhue, r);
    }
  } else if (spec.habit === 'shrub' && spec.dense) {
    /* ★ WAVE 58 — A DENSE TWIGGY BUSH. The judge failed Tea, Tea Tree, Tamarisk,
       Bay Laurel for reading as "five open bare stalks, see-through" when the
       must-read is a dense rounded evergreen. A short trunk, a mass of twigs,
       then a FILLED rounded crown of leaves — the shrub form of the tree canopy. */
    const cw = S * 0.22 * (0.85 + spread * 0.35), chh = S * 0.21 * nvf(name, 0x66, 0.16);
    const ccx = cx + lean * S * 0.06, ccy = base - H * 0.58;
    /* short twigs only — they are buried under the crown, not the whole plant */
    c.strokeStyle = barkCol; c.lineWidth = S * 0.009; c.lineCap = 'round';
    for (let k = 0; k < 5; k++) { const s = (k - 2) / 2.4;
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + s * cw * 0.4, base - H * 0.3, ccx + s * cw * 0.55, ccy + chh * 0.55); c.stroke(); }
    /* a FILLED foliage mass first (the fix for the see-through crown): a deep
       green body in soft masks, then leaves on top so it reads dense */
    const gA = [46, 92, 44];
    const fmix = (ch: number, an: number): number => an * 0.62 + ch * 0.38;
    const fB = [fmix(p.cr, gA[0]!), fmix(p.cg, gA[1]!), fmix(p.cb, gA[2]!)];
    const fol = (v: number): string => `${Math.min(255, fB[0]! * v | 0)},${Math.min(255, fB[1]! * v | 0)},${Math.min(255, fB[2]! * v | 0)}`;
    for (let i = 0; i < 30; i++) { const a = r() * TAU, d = r() ** 0.6; softMark(c, ccx + Math.cos(a) * cw * d, ccy + Math.sin(a) * chh * d, cw * 0.5, chh * 0.5, fol(0.55), 0.7); }
    for (let i = 0; i < 18; i++) { const a = r() * TAU, d = r() ** 0.7; softMark(c, ccx + Math.cos(a) * cw * 0.75 * d - cw * 0.1, ccy + Math.sin(a) * chh * 0.7 * d - chh * 0.2, cw * 0.34, chh * 0.34, fol(1.0), 0.5); }
    /* a filled leafy crown on top */
    for (let i = 0; i < leafN * 5 + 40; i++) {
      const a = r() * TAU, d = 0.2 + r() ** 0.5 * 0.85;
      const lx = ccx + Math.cos(a) * cw * d, ly = ccy + Math.sin(a) * chh * d;
      drawLeaf(c, p, lx, ly, a + (r() - 0.5), S * 0.05 * nvf(name, 0x77, 0.2), spec.leaf, toothed);
    }
    if (spec.flower && spec.flower !== 'none') for (let i = 0; i < 4; i++) { const a = r() * TAU, d = 0.4 + r() * 0.6;
      drawFlower(c, p, ccx + Math.cos(a) * cw * d, ccy + Math.sin(a) * chh * d, S * 0.036, spec.flower, spec.fhue, r); }
    if (spec.fruit && spec.fruit !== 'none') for (let i = 0; i < 4; i++) { const a = r() * TAU, d = 0.4 + r() * 0.6;
      drawFruit(c, p, ccx + Math.cos(a) * cw * d, ccy + Math.sin(a) * chh * d, S * 0.03, spec.fruit, spec.fhue, r); }
  } else if (spec.habit === 'shrub') {
    /* MANY STEMS FROM THE GROUND — that is the whole difference from a tree */
    const stems = 5;
    for (let k = 0; k < stems; k++) {
      const s = (k - (stems - 1) / 2) / stems;
      const tipX = cx + s * S * 0.16 * spread * 2, tipY = base - H * (0.72 + r() * 0.28);
      /* ★ WAVE 42 — the shrub's stems stroked stemCol while `woody` computed a
         brown barkCol for them two hundred lines up: the value was built and
         never delivered, so any future `bark:` on a shrub row was silently
         inert (the code pass's M-flora2-304). Delivered. */
      c.strokeStyle = barkCol; c.lineWidth = S * 0.010; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx + s * S * 0.02, base); c.quadraticCurveTo(cx + s * S * 0.10, base - H * 0.5, tipX, tipY); c.stroke();
      for (let i = 0; i < leafN; i++) {
        const u = 0.25 + (i / leafN) * 0.75;
        const lx = cx + s * S * 0.02 + (tipX - cx - s * S * 0.02) * u;
        const ly = base + (tipY - base) * u;
        drawLeaf(c, p, lx, ly, (i % 2 ? -0.7 : -2.4) + s, S * 0.062 * nvf(name, 0x77, 0.2), spec.leaf);
      }
      if (spec.fruit && spec.fruit !== 'none') drawFruit(c, p, tipX, tipY + S * 0.012, S * 0.030, spec.fruit, spec.fhue, r);
      if (spec.flower && spec.flower !== 'none') drawFlower(c, p, tipX, tipY - S * 0.014, S * (spec.flower === 'spike' || spec.flower === 'catkin' || spec.flower === 'umbel' ? 0.060 : 0.046), spec.flower, spec.fhue, r);
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
    const cereal = spec.fruit === 'grain' || spec.fruit === 'panicle' || spec.fruit === 'club';
    if (cereal || (spec.flower && spec.flower !== 'none')) {
      const headY = base - H * 0.80;
      c.strokeStyle = stemCol; c.lineWidth = S * 0.007; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + lean * S * 0.03, base - H * 0.5, cx + S * 0.01, headY + S * 0.03); c.stroke();
      if (cereal) drawFruit(c, p, cx + S * 0.01, headY, S * 0.048, spec.fruit!, spec.fhue, r);
      else drawFlower(c, p, cx + S * 0.01, headY, S * (spec.flower === 'spike' || spec.flower === 'catkin' ? 0.078 : 0.052), spec.flower!, spec.fhue, r);
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
    } else if (spec.leaf === 'broad' || spec.leaf === 'frond') {
      /* ★ WAVE 58 — A FLAT SEAWEED BLADE: dulse, sea lettuce, wakame, kombu.
         The judge failed these as a "bundle of straight strands / wheat sheaf";
         they are a broad ruffled frond rising from a holdfast. */
      holdfast(c, cx, base, barkCol);
      const blades = spec.leaf === 'frond' ? 3 : 2;
      for (let b = 0; b < blades; b++) {
        const t = (b / (blades - 1)) - 0.5;
        const bx = cx + t * S * 0.12, topY = base - H * (0.9 + r() * 0.1);
        const wob = (yy: number): number => Math.sin(yy * 0.09 + b) * S * 0.02;   /* the ruffle */
        c.fillStyle = leafGrad(c, p, cx, base - H * 0.5, H * 0.5);
        c.beginPath(); c.moveTo(bx, base);
        for (let yy = 0; yy <= 20; yy++) { const v = yy / 20, py = base - H * v; c.lineTo(bx - S * 0.06 * Math.sin(v * Math.PI) + wob(py) + t * S * 0.14 * v, py); }
        for (let yy = 20; yy >= 0; yy--) { const v = yy / 20, py = base - H * v; c.lineTo(bx + S * 0.06 * Math.sin(v * Math.PI) + wob(py) + t * S * 0.14 * v, py); }
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = S * 0.006;
        c.beginPath(); c.moveTo(bx, base); c.lineTo(bx + t * S * 0.14, topY); c.stroke();
      }
    } else {
    /* held up by water, not by wood: straps rising from a holdfast (kelp/wrack) */
    holdfast(c, cx, base, barkCol);
    const wrack = spec.leaf === 'scale';   /* bladderwrack: forking + paired bladders */
    for (let i = 0; i < leafN; i++) {
      const u = (i / (leafN - 1)) - 0.5;
      c.strokeStyle = i % 2 ? p.base : p.dark;
      c.lineWidth = S * (spec.leaf === 'blade' ? 0.030 : 0.018);   /* a STRAP has width */
      c.lineCap = 'round'; c.lineJoin = 'round';
      const sway = u * S * 0.17 * spread;
      const topFrac = 0.92 + r() * 0.12;
      const tip: [number, number] = [cx + sway * 0.85, base - H * topFrac];
      c.beginPath(); c.moveTo(cx + u * S * 0.02, base);
      c.bezierCurveTo(cx + sway * 0.5, base - H * 0.40, cx + sway * 1.25, base - H * 0.74, tip[0], tip[1]);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = S * 0.008;   /* the wet sheen */
      c.beginPath(); c.moveTo(cx + u * S * 0.02, base);
      c.bezierCurveTo(cx + sway * 0.5, base - H * 0.40, cx + sway * 1.25, base - H * 0.74, tip[0], tip[1]);
      c.stroke();
      if (wrack) {   /* PAIRED air bladders flanking the midrib, not on the centreline */
        c.fillStyle = p.lit;
        for (let k = 1; k <= 3; k++) { const v = k / 3.5, mx = cx + sway * v, my = base - H * v * topFrac;
          for (const sgn of [-1, 1] as const) { c.beginPath(); c.ellipse(mx + sgn * S * 0.018, my, S * 0.012, S * 0.016, 0, 0, TAU); c.fill(); } }
      } else if (spec.leaf === 'blade') {   /* a single float bulb near the tip (bull kelp) */
        c.fillStyle = p.lit; c.beginPath(); c.ellipse(tip[0], tip[1] + S * 0.02, S * 0.02, S * 0.028, 0, 0, TAU); c.fill();
      }
    }
    }
  } else if (spec.habit === 'rosette') {
    /* leaves radiating from a crown at ground level — dandelion, aloe, cabbage.
       ★ WAVE 58 — the old fan was a HARD MIRROR at even angles (the judge's
       "stiff symmetric radial fan of sword blades"). Jittered per node off the
       name, and an arrow/heart rosette is held on erect STALKS (taro), not
       splayed flat. */
    const erect = spec.leaf === 'arrow' || spec.leaf === 'heart' || spec.leaf === 'crinkle';
    const nL = leafN + 3;
    for (let i = 0; i < nL; i++) {
      const t = (i / (nL - 1)) - 0.5;
      const jit = (nvf(name, 0x90 + i * 7, 0.5) - 1);
      /* erect species stand their blades UP in a tight arc; flat rosettes splay wide */
      const a = -Math.PI / 2 + t * (erect ? 1.4 : 2.7) * spread + jit;
      const L = H * ((erect ? 0.7 : 0.52) + r() * 0.24);
      if (erect) {   /* a visible leaf-stalk carrying the blade up and out */
        const sx = cx + t * S * 0.05, tipX = cx + Math.sin(t * 1.2) * S * 0.18 * spread, tipY = base - L;
        c.strokeStyle = stemCol; c.lineWidth = S * 0.009; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(sx, base - L * 0.5, tipX, tipY); c.stroke();
        drawLeaf(c, p, tipX, tipY, Math.atan2(tipY - base, tipX - cx) + (t < 0 ? 0.2 : -0.2), L * 0.62, spec.leaf, toothed);
      } else {
        drawLeaf(c, p, cx, base - S * 0.015, a, L, spec.leaf, toothed);
      }
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
    /* ★ WAVE 58 — a square mint stem: faintly reddish and drawn as two parallel
       ridges so it reads angular, not a round green hairline (the judge named
       "no square edge and no purple tint" on six mints). */
    const mintStem = `rgb(${Math.min(150, (p.cr * 0.5 + 40) | 0)},${Math.max(40, p.cg * 0.4 | 0)},${Math.max(38, p.cb * 0.4 + 20 | 0)})`;
    c.strokeStyle = spec.square ? mintStem : stemCol; c.lineWidth = spec.square ? stemW * 1.5 : stemW; c.lineCap = 'round';
    for (let w = 0; w < nW; w++) {
      const t = nW === 1 ? 0 : (w / (nW - 1)) - 0.5;
      /* a bare stem leans away from its neighbours; a mat sprawls sideways */
      const spreadX = mat ? t * S * 0.46 : t * S * 0.13 * (arch === 'bare' ? 1 : 0);
      const topY = base - HH * (mat ? 0.55 + Math.abs(t) * -0.28 : 1 - Math.abs(t) * 0.16);
      const tipX = cx + lean * S * 0.06 + spreadX;
      const midX = cx + lean * S * 0.04 + spreadX * 0.35, midY = base - (base - topY) * 0.5;
      const ridge = spec.square ? [-stemW * 0.5, stemW * 0.5] : [0];
      for (const dx of ridge) {
        c.beginPath(); c.moveTo(cx + dx, base);
        c.quadraticCurveTo(midX + dx, midY, tipX + dx, topY);
        c.stroke();
      }
      wands.push({ tipX, tipY: topY, ang: Math.atan2(topY - base, tipX - cx) });
    }
    /* THE LEAVES, where this architecture actually carries them. */
    const lw = S * (mat ? 0.068 : 0.098) * spread * nvf(name, 0x77, 0.2);
    if (arr === 'basal') {
      /* a naked flowering stem over a ground rosette — chicory, dandelion */
      for (let i = 0; i < leafN + 2; i++) {
        const a = -Math.PI / 2 + ((i / (leafN + 1)) - 0.5) * 2.9 * spread;
        drawLeaf(c, p, cx, base - S * 0.012, a, lw * 1.15, spec.leaf, toothed);
      }
    } else {
      const nL = mat ? leafN + 4 : leafN;
      for (let i = 0; i < nL; i++) {
        const u = 0.15 + (i / nL) * 0.78;
        const wd = wands[i % wands.length]!;
        const sx = cx + (wd.tipX - cx) * u, sy = base - (base - wd.tipY) * u;
        /* opposite = a pair at every node; alternate = one side, then the other */
        const sides: readonly number[] = arr === 'alternate' ? [i % 2 ? 1 : -1] : [-1, 1];
        /* ★ WAVE 54 — THE LADDER. Every leaf on every plant was drawn at a
           CONSTANT ±0.45 rad and a CONSTANT length, at every node, on every
           species — so the foliage came out as a rung ladder bolted to a stem,
           and the family sweep named exactly that ("a rigid pinnate fern ladder
           on one dead-straight central stem") on four separate flora batches.
           It is the flora twin of the hard-coded neck angle (D-ART-153): one
           number standing in for an axis nobody had built.
           On a real plant the lower leaves are the OLDEST — biggest, and
           drooping at or below the horizontal — while the young ones near the
           growing tip are smaller and swept up toward the light. That gradient
           is most of what makes a stem read as grown rather than assembled.
           Jittered per NODE off the species name (D-ART-20), so two plants that
           share a habit still cannot draw the same ladder. */
        const lift = -0.10 + u * 0.78;
        const taper = 1.22 - u * 0.46;
        for (const s of sides) {
          /* ⚠ the salt carries the SIDE. Without it both leaves of a pair got
             the identical jitter, so the plant stayed perfectly bilaterally
             symmetric and merely changed from a rung ladder into a Christmas
             tree — regular in a different way. No real stem is a mirror down
             its own axis, and the asymmetry is what stops the taper reading as
             a cone. */
          const salt = i * 7 + (s < 0 ? 0x40 : 0);
          const jA = (nvf(name, 0x90 + salt, 0.34) - 1);
          const jL = nvf(name, 0xB0 + salt, 0.20);
          const a = lift + jA;
          drawLeaf(c, p, sx, sy, s < 0 ? Math.PI + a : -a, lw * taper * jL, spec.leaf, toothed);
        }
      }
    }
    /* THE FLOWERS. One is terminal; several are borne at the wand tips and
       spaced down the upper stem, which is what makes a chicory read as a
       chicory rather than as a daisy on a stick. */
    if (spec.flower && spec.flower !== 'none') {
      /* ★ WAVE 58 — the inflorescence is a major fraction of a flowering herb's
         visual mass, not a 16px bead on a 230px stem. A spike/umbel is the
         whole top third of the plant; a single terminal head is smaller than a
         borne cluster only because it is one bloom, not many. */
      const big = spec.flower === 'spike' || spec.flower === 'catkin' || spec.flower === 'umbel' || spec.flower === 'cross' || spec.flower === 'bell';
      const fR = S * (big ? (mat ? 0.075 : 0.090) : mat ? 0.050 : nF > 1 ? 0.048 : 0.060);
      if (spec.whorl) {
        /* ★ VERTICILLASTERS — a mint bears dense flower rings at the upper leaf
           axils AND a terminal cluster. This is the single strongest mint cue
           and the judge failed nine species for its absence ("rings around the
           stem, not just at the tip"). Rings ride the main wand. */
        const wd = wands[0]!;
        const rings = 4;
        for (let ri = 0; ri < rings; ri++) {
          const k = 0.52 + (ri / (rings - 1)) * 0.46;              /* up the top half of the stem */
          const rx = cx + (wd.tipX - cx) * k, ry = base - (base - wd.tipY) * k;
          const rr = fR * 0.6 * (0.7 + ri / rings);                /* rings swell toward the tip */
          for (const s of [-1, 1] as const) {                      /* a cluster either side of the stem */
            const cxx = rx + s * lw * 0.34;
            for (let d = 0; d < 5; d++) { const a = (d / 5) * TAU;
              const gx = cxx + Math.cos(a) * rr * 0.5, gy = ry + Math.sin(a) * rr * 0.4;
              const gg = c.createRadialGradient(gx - rr * 0.1, gy - rr * 0.12, 1, gx, gy, rr * 0.45);
              gg.addColorStop(0, 'rgba(255,255,255,0.5)'); gg.addColorStop(0.5, spec.fhue ?? '#c0a8e0'); gg.addColorStop(1, 'rgba(0,0,0,0.2)');
              c.fillStyle = gg; c.beginPath(); c.arc(gx, gy, rr * 0.30, 0, TAU); c.fill();
            }
          }
        }
        drawFlower(c, p, wd.tipX, wd.tipY - S * 0.008, fR * 0.8, spec.flower, spec.fhue, r);
      } else for (let i = 0; i < nF; i++) {
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
    if (spec.pods) drawSiliques(c, p, cx, wands[0]!.tipX, base, wands[0]!.tipY, spec.fhue);
    if (spec.tassel) {
      /* ★ WAVE 58 — NETTLE TASSELS: soft green flower strings hanging from the
         upper leaf axils. The judge failed the nettles for "a stiff cream bead
         spike at the tip" where the species has "tassels trailing from the leaf
         axils". Drawn AFTER the leaves so they drape over the joints. */
      const wd = wands[0]!;
      c.strokeStyle = spec.fhue ?? '#9aa870'; c.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const u = 0.5 + (i / 5) * 0.42, s = i % 2 ? 1 : -1;
        const nx = cx + (wd.tipX - cx) * u + s * lw * 0.3, ny = base - (base - wd.tipY) * u;
        c.lineWidth = Math.max(2, S * 0.007);
        c.beginPath(); c.moveTo(nx, ny);
        c.quadraticCurveTo(nx + s * S * 0.02, ny + S * 0.03, nx + s * S * 0.012, ny + S * 0.07);
        c.stroke();
        /* beads along the string */
        c.fillStyle = spec.fhue ?? '#9aa870';
        for (let k = 1; k <= 4; k++) { const t = k / 4; c.beginPath(); c.arc(nx + s * S * 0.015 * t, ny + S * 0.07 * t, S * 0.006, 0, TAU); c.fill(); }
      }
    }
  }
  /* ★ WAVE 42, CODE PASS H3 — THE THORNS WERE INERT FOR 12 OF THEIR 13 SETTERS.
     The only `spec.thorns` read sat inside the succulent NON-pad (ribbed
     column) branch, so Durian, Mesquite, Sea Buckthorn, Acacia, Rattan,
     Blackberry, Raspberry, Gooseberry, Rose Hip, Castor Bean, Agave and
     Prickly Pear all declared thorns and drew none — only Barrel Cactus Fruit
     ever reached the reader. visualaudit.json had asked for Mesquite's spines
     by name. A field read for one of thirteen setters is the nosePad defect at
     larger scale (D-ART-100, read-but-not-for-its-setters).
     This post-pass runs for the STEM architectures, where a node thorn is
     anatomically right: paired spines along the lower trunk/stems, leaning
     out and slightly down, in the pale keratin tone thorns actually have.
     The succulent column keeps its own pass (guarded out here); Agave's
     leaf-margin teeth and Prickly Pear's pad areoles are DIFFERENT anatomy
     and are recorded open rather than faked with stem spines. */
  /* ★ WAVE 58 — the harvested root/rhizome, a GLOBAL post-pass so it reaches
     the rosette gingers as well as the herb-habit licorice. */
  if (spec.root) drawRoot(c, cx, base, spec.root);
  if (spec.thorns && spec.habit !== 'succulent' && spec.habit !== 'rosette') {
    const tr = rngF(g, name, 0x7409);
    c.strokeStyle = '#ded2b2'; c.lineWidth = Math.max(1.4, S * 0.0042); c.lineCap = 'round';
    const nT = spec.habit === 'tree' ? 14 : 20;
    for (let i = 0; i < nT; i++) {
      const u = 0.06 + tr() * (spec.habit === 'tree' ? 0.42 : 0.66);
      const s = tr() < 0.5 ? -1 : 1;
      /* follow the same central-stem drift the habits themselves use */
      const sx = cx + lean * S * 0.05 * u + s * S * (spec.habit === 'shrub' ? 0.010 + tr() * 0.05 : 0.008);
      const sy = base - H * u;
      c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(sx + s * S * 0.020, sy + S * 0.006); c.stroke();
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
