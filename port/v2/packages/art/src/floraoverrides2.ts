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
  leaf: 'broad' | 'lance' | 'needle' | 'pinnate' | 'palmate' | 'blade' | 'frond' | 'scale' | 'heart' | 'pad' | 'trefoil' | 'arrow' | 'crinkle'
    /* ★ WAVE 66 — the miner's-lettuce PERFOLIATE saucer: a round disc the stem
       pierces through the middle */
    | 'perfoliate';
  flower?: 'none' | 'head' | 'spike' | 'umbel' | 'bell' | 'star' | 'catkin' | 'cross' | 'cone'
    /* ★ WAVE 66 — the monarda FIREWORK (ragged crown of narrow tubes) and the
       brugmansia TRUMPET (huge pendulous flared horns) */
    | 'firework' | 'trumpet' | 'cup';
  fruit?: 'none' | 'berry' | 'drupe' | 'pome' | 'citrus' | 'pod' | 'nut' | 'cone' | 'grain' | 'melon' | 'fig' | 'cluster'
    /* ★ WAVE 58 — species fruit SHAPES. The tree body was fine; every fruit was
       the same small round sphere, so Pear read as Apple and Mango as Orange
       (the judge's words). These are the shapes that name the species. */
    | 'pear' | 'spiky' | 'star' | 'crown' | 'hairy'
    /* ★ WAVE 61 — cereal head TYPES. One awned ear made every grain look alike
       (gp5). 'grain' = the dense awned ear (wheat/barley/rye); 'panicle' = a
       loose nodding open spray (oats/rice); 'club' = a dense bristly cylinder
       (millet/sorghum). */
    | 'panicle' | 'club'
    /* ★ GOLD AUDIT — the devil's claw pod: a woody capsule with two long
       recurved grappling hooks, the single thing that names the plant */
    | 'clawpod';
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
  stem?: 'leafy' | 'bare' | 'mat'
    /* ★ WAVE 66 — ONE ARCHING CANE (Solomon's Seal): leaves in a flat row along
       the top, flowers dangling in a row BENEATH the curve */
    | 'arch';
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
  /** ★ GOLD AUDIT — the peanut: pods half-buried at the soil line */
  groundFruit?: boolean;
  /** drooping catkin-like flower strings hanging from the upper leaf axils —
      the nettle's inconspicuous green tassels */
  tassel?: boolean;
  /** ★ WAVE 67 — a TIGHT LOW CUSHION: a dome mound of dense tiny foliage with
      STEMLESS flowers sitting directly on it (purple saxifrage, bitterroot) */
  cushion?: boolean;
  /** a vine that TRAILS horizontally along the ground/water (water spinach) */
  trail?: boolean;
  /** ★ GOLD AUDIT — aquatic pad plant renders as a MAT of tiny floating
      fronds (duckweed) instead of three lily pads */
  mat?: boolean;
  /** a vine whose stem is a thick succulent ROPE with aerial roots (vanilla) */
  rope?: boolean;
  /** a woody shrub that trails as a LOW CREEPING MAT, wider than tall — the
      groundcover berries (bearberry, crowberry, cranberry, lingonberry) that
      the judge failed for being drawn as tall upright cane-vases */
  creep?: boolean;
  /** GP7: the seven boreal berry plants were still one shared crescent of
      runners with a leaf/fruit recolour. This opt-in selects each named
      architecture and has no shared fallback. */
  berryHabit?: 'huckleberry' | 'lingonberry' | 'crowberry' | 'cranberry'
    | 'bearberry' | 'arctic-blueberry' | 'mountain-cranberry';
  /** a woody shrub as a DENSE ROUNDED twiggy bush with a filled leafy crown —
      tea, tea tree, tamarisk, bay laurel (failed as "five open bare stalks") */
  dense?: boolean;
  /** a palm-habit plant with a smooth GREEN false trunk and huge paddle leaves
      instead of a woody trunk and fronds — banana, plantain */
  pseudostem?: boolean;
  /** ★ POLISH — an orchard tree: LOW wide crooked crown on a SHORT trunk */
  squat?: boolean;
  /** ★ POLISH — a maple tapped for sap: spile + hanging bucket on the trunk */
  tap?: boolean;
  /** a mature open pine cone with its pale edible kernels exposed. This is a
      harvest-item cue, so only the named Pine Nuts roster entry opts in. */
  pineSeedHarvest?: boolean;
  /** a low, forked pinyon with an open crown and compact cones, deliberately
      distinct from the tall tiered cedar control. */
  pinyonPine?: boolean;
  /** the harvested underground organ, shown pulled up at the base: a long ropey
      taproot (licorice), a forked root (ginseng), or a knobbly rhizome
      (ginger, turmeric, valerian). The judge failed several for its absence. */
  root?: 'taproot' | 'forked' | 'rhizome';
  /**
   * The 2026-08-09 strict recheck found a bounded set of named plants whose
   * packet-defining morphology cannot be conveyed by the broad family body
   * alone (for example, a cattail's two-part cigar or a poppy's tissue-paper
   * flower).  This is deliberately opt-in: only the named roster entries in
   * florarost.ts receive a focus, so a new family cue can never repaint an
   * already accepted neighbour by accident.
   */
  recheck?: RecheckFocus;
  /** A second opt-in guard for GP7.1 repair cues.  Recheck focus selects a
      broad body family; this flag keeps new signature overlays restricted to
      the exact fresh-ledger names that asked for them. */
  strictSignature?: boolean;
}

export type RecheckFocus =
  | 'wildflower' | 'succulent' | 'wetland' | 'crop' | 'tree' | 'palm'
  | 'shrub' | 'herb' | 'root' | 'vine' | 'algae' | 'fern' | 'berry';

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
  if (kind === 'perfoliate') {   /* ★ WAVE 66 — a round saucer the stem passes
       THROUGH: drawn as a disc centred on the leaf point, slightly cupped. */
    const R2 = len * 0.62;
    c.fillStyle = leafGrad(c, p, 0, 0, R2);
    c.beginPath(); c.ellipse(0, 0, R2, R2 * 0.7, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.20)'; c.lineWidth = 1.6;   /* the cupped rim */
    c.beginPath(); c.ellipse(0, 0, R2 * 0.94, R2 * 0.64, 0, -2.8, 0.3); c.stroke();
    c.strokeStyle = 'rgba(20,36,18,0.35)'; c.lineWidth = 1.3;      /* radial veins from the pierce */
    for (let k = 0; k < 7; k++) { const a2 = (k / 7) * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a2) * R2 * 0.9, Math.sin(a2) * R2 * 0.62); c.stroke(); }
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
  } else if (kind === 'clawpod') {
    /* the woody body, then TWO long recurved hooks arcing up and back */
    c.fillStyle = shade(x, y, R * 0.7);
    c.save(); c.translate(x, y); c.rotate(0.25);
    c.beginPath(); c.ellipse(0, 0, R * 0.85, R * 0.34, 0, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = '#4a3a26'; c.lineWidth = Math.max(1.6, R * 0.14); c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(x + R * 0.7, y - R * 0.1);
      c.bezierCurveTo(x + R * (1.6 + s * 0.15), y - R * (0.9 + s * 0.25),
        x + R * (1.2 + s * 0.5), y - R * (1.9 + s * 0.2), x + R * (0.3 + s * 0.55), y - R * (1.55 + s * 0.30));
      c.stroke();
    }
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
  } else if (kind === 'cup') {
    /* ★ GOLD AUDIT — the tulip: ONE upright cup of overlapping petals with a
       rounded base and slightly flared rim, nothing else. */
    const gg = c.createLinearGradient(x, y - R * 1.1, x, y + R * 0.6);
    gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(70,22,30,0.92)');
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(x - R * 0.74, y - R * 0.95);
    c.quadraticCurveTo(x - R * 0.92, y + R * 0.28, x, y + R * 0.52);
    c.quadraticCurveTo(x + R * 0.92, y + R * 0.28, x + R * 0.74, y - R * 0.95);
    c.quadraticCurveTo(x + R * 0.28, y - R * 0.55, x, y - R * 0.88);
    c.quadraticCurveTo(x - R * 0.28, y - R * 0.55, x - R * 0.74, y - R * 0.95);
    c.closePath(); c.fill();
    c.fillStyle = col;   /* the front petal */
    c.beginPath();
    c.moveTo(x - R * 0.46, y - R * 0.75);
    c.quadraticCurveTo(x - R * 0.58, y + R * 0.22, x, y + R * 0.48);
    c.quadraticCurveTo(x + R * 0.58, y + R * 0.22, x + R * 0.46, y - R * 0.75);
    c.quadraticCurveTo(x, y - R * 0.38, x - R * 0.46, y - R * 0.75);
    c.closePath(); c.fill();
  } else if (kind === 'firework') {
    /* ★ WAVE 66 — the monarda head: a ragged crown of narrow TUBULAR florets
       shooting up and out at every angle from a central boss, over leafy bracts. */
    c.fillStyle = `rgba(${p.cr * 0.55 | 0},${p.cg * 0.6 | 0},${p.cb * 0.5 | 0},0.9)`;   /* bracts */
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.save(); c.translate(x, y + R * 0.28); c.rotate(a);
      c.beginPath(); c.ellipse(R * 0.32, 0, R * 0.34, R * 0.12, 0, 0, TAU); c.fill(); c.restore(); }
    c.strokeStyle = col; c.lineWidth = Math.max(2, R * 0.075); c.lineCap = 'round';
    for (let i = 0; i < 17; i++) {
      const a = -Math.PI * 0.92 + (i / 16) * Math.PI * 0.84 + (r() - 0.5) * 0.24;   /* up + out, ragged */
      const len = R * (0.75 + r() * 0.55);
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.55 - R * 0.08, ex, ey); c.stroke();
      /* each tube ends in a tiny flared lip */
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(a - 0.5) * R * 0.1, ey + Math.sin(a - 0.5) * R * 0.1); c.stroke();
    }
    c.fillStyle = `rgba(90,50,40,0.9)`; c.beginPath(); c.arc(x, y, R * 0.16, 0, TAU); c.fill();   /* the boss */
  } else if (kind === 'trumpet') {
    /* ★ WAVE 66 — brugmansia: huge pendulous flared trumpets HANGING DOWN */
    for (const [dx, k] of [[-0.7, 0.85], [0.15, 1], [0.85, 0.8]] as const) {
      const tx = x + dx * R * 1.1, ty = y + R * 0.1, tl = R * 1.5 * k, tw = R * 0.42 * k;
      const gg = c.createLinearGradient(tx, ty, tx, ty + tl);
      gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(255,250,235,0.95)');
      c.fillStyle = gg;
      c.beginPath(); c.moveTo(tx - tw * 0.28, ty);
      c.quadraticCurveTo(tx - tw * 0.5, ty + tl * 0.62, tx - tw, ty + tl);        /* flaring left wall */
      c.lineTo(tx - tw * 0.3, ty + tl * 0.92);                                    /* the recurved lip points */
      c.lineTo(tx, ty + tl * 1.04); c.lineTo(tx + tw * 0.3, ty + tl * 0.92);
      c.lineTo(tx + tw, ty + tl);
      c.quadraticCurveTo(tx + tw * 0.5, ty + tl * 0.62, tx + tw * 0.28, ty);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,90,50,0.35)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(tx - tw * 0.1, ty + tl * 0.1); c.lineTo(tx - tw * 0.5, ty + tl * 0.9); c.stroke();
    }
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
    c.fillStyle = cg; c.beginPath(); c.ellipse(x, y - R * 0.06, R * 0.50, R * 0.48, 0, 0, TAU); c.fill();
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
  c.strokeStyle = hue ?? p.base; c.lineWidth = Math.max(3, S * 0.009); c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const u = 0.45 + (i / 7) * 0.42, s = i % 2 ? 1 : -1;
    const sx = cx + (tipX - cx) * u, sy = base - (base - tipY) * u;
    const ang = -0.5 * s - 0.7, L = S * 0.055;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(ang) * L, sy + Math.sin(ang) * L); c.stroke();
  }
}

/** THE PLANT. One body; the spec is the species. */
type BerryLeaf = 'oval' | 'spoon' | 'notched' | 'tiny' | 'needle';

function berryLeaf(c: Ctx, p: Pal, x: number, y: number, ang: number, len: number, kind: BerryLeaf): void {
  c.save(); c.translate(x, y); c.rotate(ang);
  if (kind === 'needle') {
    c.strokeStyle = p.base; c.lineWidth = Math.max(2.2, len * 0.17); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-len * 0.12, 0); c.lineTo(len, 0); c.stroke();
    c.strokeStyle = 'rgba(205,225,198,0.22)'; c.lineWidth = Math.max(1, len * 0.045);
    c.beginPath(); c.moveTo(len * 0.15, -0.5); c.lineTo(len * 0.82, -0.5); c.stroke();
    c.restore(); return;
  }
  const w = len * (kind === 'tiny' ? 0.24 : kind === 'oval' ? 0.31 : 0.38);
  c.fillStyle = leafGrad(c, p, len * 0.55, 0, len * 0.58);
  c.beginPath(); c.moveTo(0, 0);
  if (kind === 'spoon') {
    c.bezierCurveTo(len * 0.16, -w * 0.32, len * 0.48, -w, len * 0.82, -w * 0.82);
    c.quadraticCurveTo(len * 1.10, 0, len * 0.82, w * 0.82);
    c.bezierCurveTo(len * 0.48, w, len * 0.16, w * 0.32, 0, 0);
  } else if (kind === 'notched') {
    c.bezierCurveTo(len * 0.26, -w * 0.72, len * 0.70, -w, len, -w * 0.22);
    c.lineTo(len * 0.82, 0); c.lineTo(len, w * 0.22);
    c.bezierCurveTo(len * 0.70, w, len * 0.26, w * 0.72, 0, 0);
  } else {
    c.bezierCurveTo(len * 0.28, -w, len * 0.78, -w * 0.96, len, 0);
    c.bezierCurveTo(len * 0.78, w * 0.96, len * 0.28, w, 0, 0);
  }
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(18,38,22,0.38)'; c.lineWidth = Math.max(1.1, len * 0.055);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(len * (kind === 'notched' ? 0.76 : 0.90), 0); c.stroke();
  if (kind === 'notched') {
    c.strokeStyle = 'rgba(8,18,12,0.78)'; c.lineWidth = Math.max(1.5, len * 0.075);
    c.beginPath(); c.moveTo(len * 0.80, 0); c.lineTo(len * 0.96, -w * 0.18);
    c.moveTo(len * 0.80, 0); c.lineTo(len * 0.96, w * 0.18); c.stroke();
  }
  if (kind === 'spoon') {
    c.strokeStyle = 'rgba(238,248,230,0.22)'; c.lineWidth = Math.max(1, len * 0.035);
    c.beginPath(); c.arc(len * 0.67, 0, w * 0.62, -2.4, -0.65); c.stroke();
  }
  c.restore();
}

type BerryFinish = 'bloom' | 'gloss' | 'dull' | 'plain';

function groundBerry(c: Ctx, x: number, y: number, rad: number, hue: string, finish: BerryFinish): void {
  const gg = c.createRadialGradient(x - rad * 0.28, y - rad * 0.32, 0.5, x, y, rad * 1.12);
  gg.addColorStop(0, finish === 'dull' ? hue : 'rgba(245,248,240,0.45)');
  gg.addColorStop(finish === 'dull' ? 0.20 : 0.28, hue);
  gg.addColorStop(1, finish === 'gloss' ? '#050709' : 'rgba(18,12,18,0.62)');
  c.fillStyle = gg; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
  if (finish === 'bloom') {
    c.strokeStyle = 'rgba(205,218,232,0.62)'; c.lineWidth = Math.max(1.5, rad * 0.25);
    c.beginPath(); c.arc(x, y, rad * 0.70, 0, TAU); c.stroke();
  } else if (finish === 'gloss') {
    c.fillStyle = 'rgba(255,255,248,0.72)'; c.beginPath(); c.arc(x - rad * 0.32, y - rad * 0.34, rad * 0.18, 0, TAU); c.fill();
  }
  c.fillStyle = finish === 'bloom' ? '#8393a5' : '#26311f';
  c.beginPath(); c.arc(x, y - rad * 0.58, Math.max(1.1, rad * 0.14), 0, TAU); c.fill();
}

function berryUrn(c: Ctx, x: number, y: number, scale: number, pink = '#efb8c5'): void {
  c.strokeStyle = '#52663f'; c.lineWidth = Math.max(1.2, scale * 0.12); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y - scale * 0.65); c.quadraticCurveTo(x + scale * 0.38, y - scale * 0.42, x + scale * 0.16, y); c.stroke();
  const fx = x + scale * 0.16;
  c.fillStyle = pink; c.beginPath(); c.moveTo(fx, y - scale * 0.12);
  c.bezierCurveTo(fx - scale * 0.48, y + scale * 0.02, fx - scale * 0.42, y + scale * 0.58, fx, y + scale * 0.70);
  c.bezierCurveTo(fx + scale * 0.42, y + scale * 0.58, fx + scale * 0.48, y + scale * 0.02, fx, y - scale * 0.12);
  c.fill();
  c.strokeStyle = '#fff0ed'; c.lineWidth = Math.max(1.1, scale * 0.11);
  c.beginPath(); c.moveTo(fx - scale * 0.28, y + scale * 0.62); c.lineTo(fx, y + scale * 0.76); c.lineTo(fx + scale * 0.28, y + scale * 0.62); c.stroke();
}

function craneFlower(c: Ctx, x: number, y: number, scale: number): void {
  c.strokeStyle = '#5e7943'; c.lineWidth = Math.max(1.2, scale * 0.09); c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y + scale * 0.75); c.lineTo(x, y); c.stroke();
  c.strokeStyle = '#efa4bd'; c.lineWidth = Math.max(2, scale * 0.20);
  for (const a of [-2.75, -2.25, 2.25, 2.75]) {
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a) * scale * 0.52, y + Math.sin(a) * scale * 0.52,
      x + Math.cos(a) * scale, y + Math.sin(a) * scale); c.stroke();
  }
  c.strokeStyle = '#f1d68b'; c.lineWidth = Math.max(1.8, scale * 0.16);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + scale * 0.95, y + scale * 0.12); c.stroke();
  c.fillStyle = '#f5d979'; c.beginPath(); c.arc(x + scale * 0.98, y + scale * 0.12, scale * 0.12, 0, TAU); c.fill();
}

/* Seven explicit silhouettes. Artlock showed that the former common curve plus
   recoloured tokens still produced fourteen HARD pairs, so these intentionally
   do not share a runner loop or a default route. */
function berryBody(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string,
  cx: number, base: number, barkCol: string): void {
  const r = rngF(g, name, 0xB377);
  const fruit = spec.fhue ?? '#a52c32';
  const poly = (pts: [number, number][], col: string, width: number): void => {
    c.strokeStyle = col; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i]![0], pts[i]![1]);
    c.stroke();
  };

  if (spec.berryHabit === 'huckleberry') {
    const nodes: [number, number][][] = [];
    for (let k = 0; k < 5; k++) {
      const side = k - 2, pts: [number, number][] = [[cx + side * S * 0.021, base]];
      for (let j = 1; j <= 4; j++) pts.push([
        cx + side * S * (0.035 + j * 0.018) + (j % 2 ? -1 : 1) * S * (0.020 + Math.abs(side) * 0.004),
        base - j * S * 0.091 - r() * S * 0.015,
      ]);
      nodes.push(pts); poly(pts, '#477048', S * 0.009);
    }
    for (let k = 0; k < nodes.length; k++) for (let j = 1; j < nodes[k]!.length; j++) {
      const [x, y] = nodes[k]![j]!; const side = (j + k) % 2 ? -1 : 1;
      berryLeaf(c, p, x, y, side < 0 ? -2.65 : -0.48, S * 0.053, 'oval');
      if ((j + k) % 3 === 0) {
        const bx = x + side * S * 0.022, by = y + S * 0.011;
        c.strokeStyle = '#557047'; c.lineWidth = S * 0.004; c.beginPath(); c.moveTo(x, y); c.lineTo(bx, by); c.stroke();
        groundBerry(c, bx, by, S * 0.014, fruit, 'gloss');
      } else if ((j * 2 + k) % 5 === 0) berryUrn(c, x + side * S * 0.018, y + S * 0.004, S * 0.025);
    }
    return;
  }

  if (spec.berryHabit === 'arctic-blueberry') {
    const boughs: [number, number][][] = [
      [[cx - S * 0.025, base], [cx - S * 0.12, base - S * 0.075], [cx - S * 0.27, base - S * 0.12]],
      [[cx, base], [cx + S * 0.025, base - S * 0.12], [cx + S * 0.13, base - S * 0.20]],
      [[cx + S * 0.025, base], [cx + S * 0.14, base - S * 0.070], [cx + S * 0.29, base - S * 0.11]],
    ];
    for (const pts of boughs) {
      poly(pts, '#52654d', S * 0.010);
      for (let seg = 0; seg < 2; seg++) for (let i = 1; i <= 4; i++) {
        const u = i / 5, x = pts[seg]![0] + (pts[seg + 1]![0] - pts[seg]![0]) * u;
        const y = pts[seg]![1] + (pts[seg + 1]![1] - pts[seg]![1]) * u;
        const a = Math.atan2(pts[seg + 1]![1] - pts[seg]![1], pts[seg + 1]![0] - pts[seg]![0]);
        berryLeaf(c, p, x, y, a + (i % 2 ? -0.92 : 0.92), S * 0.050, 'oval');
        if ((i + seg) % 3 === 0) groundBerry(c, x, y - S * 0.018, S * 0.016, fruit, 'bloom');
      }
    }
    return;
  }

  if (spec.berryHabit === 'bearberry') {
    const runners = [-1, -0.58, 0, 0.58, 1];
    for (let k = 0; k < runners.length; k++) {
      const side = runners[k]!, ex = cx + side * S * 0.32;
      c.strokeStyle = '#8a4a3b'; c.lineWidth = S * 0.012; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx + side * S * 0.025, base);
      c.quadraticCurveTo(cx + side * S * 0.18, base - S * (0.015 + k % 2 * 0.025), ex, base - S * (0.055 + (k % 3) * 0.025)); c.stroke();
      c.strokeStyle = 'rgba(223,154,120,0.50)'; c.lineWidth = S * 0.003;
      c.beginPath(); c.moveTo(cx + side * S * 0.10, base - S * 0.010); c.lineTo(cx + side * S * 0.22, base - S * 0.038); c.stroke();
      for (let i = 1; i <= 9; i++) {
        const u = i / 10, x = cx + (ex - cx) * u, y = base - S * (0.012 + u * (0.045 + (k % 3) * 0.022));
        const a = side < 0 ? Math.PI : 0;
        berryLeaf(c, p, x, y, a + (i % 2 ? -0.82 : 0.82), S * 0.047, 'spoon');
        if ((i + k * 2) % 7 === 0) groundBerry(c, x, y - S * 0.010, S * 0.015, fruit, 'dull');
      }
      if (k === 0 || k === 2 || k === 4) berryUrn(c, ex, base - S * (0.09 + (k % 2) * 0.02), S * 0.030, '#f3d6dc');
    }
    return;
  }

  if (spec.berryHabit === 'crowberry') {
    softMark(c, cx, base - S * 0.060, S * 0.31, S * 0.095, '31,69,42', 0.72);
    for (let k = 0; k < 11; k++) {
      const s = (k - 5) / 5, ex = cx + s * S * 0.31, ey = base - S * (0.035 + (1 - Math.abs(s)) * 0.070);
      c.strokeStyle = '#354f37'; c.lineWidth = S * 0.006; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx + s * S * 0.03, base - S * 0.015); c.quadraticCurveTo(cx + s * S * 0.17, base - S * 0.09, ex, ey); c.stroke();
      for (let i = 1; i <= 13; i++) {
        const u = i / 14, x = cx + (ex - cx) * u, y = base - S * 0.015 + (ey - base + S * 0.015) * u;
        const a = Math.atan2(ey - base, ex - cx || 1);
        berryLeaf(c, p, x, y, a + (i % 2 ? -1.12 : 1.12), S * 0.026, 'needle');
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = cx + (i / 9 - 0.5) * S * 0.48 + (r() - 0.5) * S * 0.035;
      const y = base - S * (0.050 + r() * 0.075);
      groundBerry(c, x, y, S * 0.015, '#10131a', 'gloss');
    }
    return;
  }

  if (spec.berryHabit === 'cranberry') {
    for (let i = 0; i < 34; i++) {
      const x = cx + (r() - 0.5) * S * 0.64, y = base - S * (0.006 + r() * 0.050);
      softMark(c, x, y, S * (0.025 + r() * 0.015), S * 0.018, i % 2 ? '77,99,43' : '105,111,54', 0.62);
    }
    for (let k = 0; k < 5; k++) {
      const s = (k - 2) / 2, ex = cx + s * S * 0.34, ey = base - S * (0.035 + (k % 2) * 0.035);
      c.strokeStyle = '#6f483c'; c.lineWidth = S * 0.004; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base - S * 0.012); c.quadraticCurveTo(cx + s * S * 0.18, base - S * 0.08, ex, ey); c.stroke();
      for (let i = 1; i <= 11; i++) {
        const u = i / 12, x = cx + (ex - cx) * u, y = base - S * 0.012 + (ey - base + S * 0.012) * u;
        berryLeaf(c, p, x, y, i % 2 ? -2.6 : -0.55, S * 0.027, 'tiny');
      }
    }
    for (let i = 0; i < 6; i++) {
      const x = cx + [-0.29, -0.18, -0.06, 0.09, 0.20, 0.31][i]! * S;
      const y0 = base - S * (0.035 + (i % 3) * 0.012), y = y0 - S * (0.050 + (i % 2) * 0.018);
      c.strokeStyle = '#5d7643'; c.lineWidth = S * 0.0035; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y); c.stroke();
      groundBerry(c, x, y, S * 0.016, fruit, 'plain');
    }
    craneFlower(c, cx - S * 0.23, base - S * 0.12, S * 0.030);
    craneFlower(c, cx + S * 0.02, base - S * 0.15, S * 0.032);
    craneFlower(c, cx + S * 0.25, base - S * 0.11, S * 0.030);
    return;
  }

  if (spec.berryHabit === 'lingonberry') {
    c.strokeStyle = '#765044'; c.lineWidth = S * 0.009; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - S * 0.30, base - S * 0.018); c.quadraticCurveTo(cx, base + S * 0.015, cx + S * 0.30, base - S * 0.020); c.stroke();
    const anchors = [-0.49, -0.31, -0.11, 0.09, 0.30, 0.48];
    for (let k = 0; k < anchors.length; k++) {
      const t = anchors[k]! + (r() - 0.5) * 0.035, sx = cx + t * S * 0.52, sy = base - S * (0.018 + r() * 0.010);
      const tx = sx + t * S * 0.070 + (r() - 0.5) * S * 0.025, ty = base - S * (0.12 + r() * 0.085);
      c.strokeStyle = '#815342'; c.lineWidth = S * 0.007;
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx - t * S * 0.035 + (r() - 0.5) * S * 0.018, base - S * 0.08, tx, ty); c.stroke();
      for (let i = 1; i <= 4; i++) {
        const u = i / 5, x = sx + (tx - sx) * u, y = sy + (ty - sy) * u;
        berryLeaf(c, p, x, y, (i % 2 ? -2.75 : -0.38) + (r() - 0.5) * 0.25, S * (0.042 + r() * 0.008), 'oval');
      }
      c.strokeStyle = '#536a3d'; c.lineWidth = S * 0.0035; c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx, ty + S * 0.034); c.stroke();
      for (const q of [-1, 0, 1]) groundBerry(c, tx + q * S * 0.013, ty + S * (0.040 + Math.abs(q) * 0.008), S * 0.013, fruit, 'gloss');
    }
    return;
  }

  const paths: [number, number][][] = [
    [[cx, base], [cx - S * 0.11, base - S * 0.055], [cx - S * 0.27, base - S * 0.035]],
    [[cx - S * 0.03, base], [cx + S * 0.08, base - S * 0.095], [cx + S * 0.28, base - S * 0.055]],
    [[cx + S * 0.02, base], [cx + S * 0.02, base - S * 0.14], [cx - S * 0.10, base - S * 0.19]],
  ];
  for (const pts of paths) {
    poly(pts, barkCol, S * 0.008);
    for (let seg = 0; seg < 2; seg++) for (let i = 1; i <= 4; i++) {
      const u = i / 5, x = pts[seg]![0] + (pts[seg + 1]![0] - pts[seg]![0]) * u;
      const y = pts[seg]![1] + (pts[seg + 1]![1] - pts[seg]![1]) * u;
      const a = Math.atan2(pts[seg + 1]![1] - pts[seg]![1], pts[seg + 1]![0] - pts[seg]![0]);
      berryLeaf(c, p, x, y, a + (i % 2 ? -1.0 : 1.0), S * 0.052, 'notched');
    }
    const [tx, ty] = pts[2]!;
    c.strokeStyle = '#586d43'; c.lineWidth = S * 0.0035; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + S * 0.008, ty + S * 0.022, tx, ty + S * 0.038); c.stroke();
    groundBerry(c, tx - S * 0.011, ty + S * 0.043, S * 0.014, fruit, 'gloss');
    groundBerry(c, tx + S * 0.011, ty + S * 0.048, S * 0.014, fruit, 'gloss');
  }
}

/* -------------------------------------------------------------------------
   STRICT-RECHECK SIGNATURES

   These painters intentionally sit beside (not inside) the broad family
   branches below.  The generic plant system remains the right answer for the
   hundreds of ordinary roster members; the strict packet calls below demand a
   structural clue that a family setting cannot honestly promise.  Every call
   is gated by `PlantSpec.recheck`, which is assigned only by a named roster
   entry in florarost.ts.  Keep additions opt-in and keep a characteristic
   visible at card size rather than hiding it in texture.
   ------------------------------------------------------------------------- */
function hasName(name: string, ...names: readonly string[]): boolean { return names.includes(name); }

function recheckStem(c: Ctx, x: number, y0: number, y1: number, w: number, col: string): void {
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + w * 0.7, (y0 + y1) * 0.5, x, y1); c.stroke();
}

function recheckWater(c: Ctx, y = S * 0.77): void {
  const g2 = c.createLinearGradient(0, y, 0, S * 0.92);
  g2.addColorStop(0, 'rgba(64,133,151,0.62)'); g2.addColorStop(1, 'rgba(17,55,72,0.16)');
  c.fillStyle = g2; c.fillRect(S * 0.10, y, S * 0.80, S * 0.15);
  c.strokeStyle = 'rgba(174,231,235,0.34)'; c.lineWidth = 1.6;
  for (let k = 0; k < 5; k++) { const yy = y + 11 + k * 10; c.beginPath(); c.moveTo(S * 0.16 + (k % 2) * 12, yy); c.quadraticCurveTo(S * 0.50, yy - 5, S * 0.84, yy); c.stroke(); }
}

function recheckLeaf(c: Ctx, p: Pal, x: number, y: number, a: number, len: number, kind: PlantSpec['leaf'], tooth = false): void {
  drawLeaf(c, p, x, y, a, len, kind, tooth);
}

function recheckPetal(c: Ctx, x: number, y: number, a: number, len: number, wide: number, col: string): void {
  c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = col;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * 0.55, -wide, len, 0); c.quadraticCurveTo(len * 0.55, wide, 0, 0); c.fill(); c.restore();
}

function recheckFlower(c: Ctx, x: number, y: number, petals: number, rad: number, col: string, centre: string, cup = false): void {
  for (let i = 0; i < petals; i++) recheckPetal(c, x, y, (i / petals) * TAU, rad, rad * (cup ? 0.31 : 0.42), col);
  const gg = c.createRadialGradient(x - rad * 0.15, y - rad * 0.18, 1, x, y, rad * 0.42);
  gg.addColorStop(0, '#fff7c8'); gg.addColorStop(0.45, centre); gg.addColorStop(1, 'rgba(0,0,0,0.42)');
  c.fillStyle = gg; c.beginPath(); c.arc(x, y, rad * 0.38, 0, TAU); c.fill();
}

function recheckCone(c: Ctx, x: number, y: number, w: number, h: number, col: string): void {
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y - h * 0.5); c.quadraticCurveTo(x + w, y - h * 0.1, x + w * 0.65, y + h * 0.48); c.quadraticCurveTo(x, y + h * 0.68, x - w * 0.65, y + h * 0.48); c.quadraticCurveTo(x - w, y - h * 0.1, x, y - h * 0.5); c.fill();
}

function recheckWildflower(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.83, r = rngF(g, name, 0x7f31);
  ground(c, cx, base + 4, S * 0.22);
  const stem = 'rgb(58,105,48)';
  if (name === 'Bromeliad') {
    for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + (i - 5.5) * 0.30; recheckLeaf(c, p, cx, base - S * 0.08, a, S * 0.29, 'blade'); }
    c.fillStyle = 'rgba(18,55,66,0.85)'; c.beginPath(); c.ellipse(cx, base - S * 0.09, S * 0.07, S * 0.026, 0, 0, TAU); c.fill();
    for (let i = 0; i < 4; i++) { recheckCone(c, cx + (i - 1.5) * S * 0.032, base - S * 0.38 - Math.abs(i - 1.5) * 8, S * 0.046, S * 0.14, i % 2 ? '#bc3146' : '#e04b52'); }
    return;
  }
  if (name === 'Dandelion') {
    for (let i = 0; i < 9; i++) recheckLeaf(c, p, cx, base - S * 0.03, -2.8 + i * 0.70, S * 0.20, 'lance', true);
    recheckStem(c, cx, base - S * 0.05, base - S * 0.44, 4, stem);
    c.strokeStyle = 'rgba(245,245,238,0.70)'; c.lineWidth = 1.2;
    for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; c.beginPath(); c.moveTo(cx, base - S * 0.44); c.lineTo(cx + Math.cos(a) * S * 0.105, base - S * 0.44 + Math.sin(a) * S * 0.105); c.stroke(); }
    c.fillStyle = '#d4b448'; c.beginPath(); c.arc(cx, base - S * 0.44, S * 0.024, 0, TAU); c.fill(); return;
  }
  if (name === 'Poppy') {
    for (let i = 0; i < 5; i++) recheckLeaf(c, p, cx, base - 8, -2.8 + i * 1.25, S * 0.16, 'pinnate');
    recheckStem(c, cx, base, base - S * 0.35, 4, '#607a43');
    recheckFlower(c, cx, base - S * 0.42, 4, S * 0.105, '#d5463d', '#272a1d');
    c.fillStyle = '#77824d'; c.beginPath(); c.arc(cx + S * 0.10, base - S * 0.22, S * 0.030, 0, TAU); c.fill();
    c.strokeStyle = '#8a9c68'; c.lineWidth = 2; c.beginPath(); c.arc(cx + S * 0.10, base - S * 0.22, S * 0.044, -2.2, 0.1); c.stroke(); return;
  }
  if (name === 'Sunflower') {
    recheckStem(c, cx, base, base - S * 0.52, 10, '#4d6c31');
    recheckLeaf(c, p, cx - 4, base - S * 0.25, 2.65, S * 0.24, 'heart'); recheckLeaf(c, p, cx + 4, base - S * 0.38, 0.30, S * 0.21, 'heart');
    recheckFlower(c, cx, base - S * 0.59, 20, S * 0.15, '#e9b82a', '#443018');
    c.fillStyle = '#382718'; c.beginPath(); c.arc(cx, base - S * 0.59, S * 0.075, 0, TAU); c.fill();
    c.fillStyle = 'rgba(232,206,116,0.55)'; for (let i = 0; i < 42; i++) { const a = i * 2.39996, d = Math.sqrt(i / 42) * S * 0.060; c.beginPath(); c.arc(cx + Math.cos(a) * d, base - S * 0.59 + Math.sin(a) * d, 1.3, 0, TAU); c.fill(); } return;
  }
  if (name === 'Foxglove') {
    recheckStem(c, cx, base, base - S * 0.60, 6, stem);
    for (let i = 0; i < 7; i++) { const y = base - S * (0.20 + i * 0.055), side = i % 2 ? 1 : -1; recheckLeaf(c, p, cx, y + 10, side > 0 ? 0.35 : 2.78, S * 0.16, 'lance'); c.save(); c.translate(cx + side * S * 0.045, y); c.rotate(side * 0.70); recheckCone(c, 0, 0, S * 0.034, S * 0.080, '#c75a9d'); c.fillStyle = '#4d1d45'; c.beginPath(); c.arc(side * S * 0.012, S * 0.018, S * 0.009, 0, TAU); c.fill(); c.restore(); }
    return;
  }
  if (name === 'Goldenrod') {
    recheckStem(c, cx - S * 0.05, base, base - S * 0.55, 5, stem);
    for (let b = 0; b < 9; b++) { const u = b / 8, x = cx - S * 0.05 + u * S * 0.15, y = base - S * (0.28 + u * 0.34); c.strokeStyle = stem; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx - S * 0.05, base - S * (0.22 + u * 0.28)); c.quadraticCurveTo(x, y, x + 4, y - 4); c.stroke(); for (let h = 0; h < 3; h++) recheckFlower(c, x + h * 5, y - h * 4, 8, S * 0.020, '#e5bd28', '#674a18'); }
    return;
  }
  if (name === 'Violet') {
    for (let i = 0; i < 8; i++) recheckLeaf(c, p, cx, base - 10, i / 8 * TAU, S * 0.17, 'heart');
    recheckStem(c, cx, base - 8, base - S * 0.30, 3, stem); recheckFlower(c, cx, base - S * 0.32, 5, S * 0.064, '#7353bc', '#edcf4d');
    c.fillStyle = '#61419e'; c.beginPath(); c.moveTo(cx - 3, base - S * 0.30); c.lineTo(cx - S * 0.075, base - S * 0.29); c.lineTo(cx - S * 0.025, base - S * 0.25); c.closePath(); c.fill(); return;
  }
  if (name === 'Clover') {
    for (let s = -1; s <= 1; s++) { const x = cx + s * S * 0.09; recheckStem(c, x, base, base - S * 0.25, 3, stem); for (const a of [-2.2, -1.57, -0.95]) { recheckLeaf(c, p, x, base - S * 0.24, a, S * 0.09, 'trefoil'); } }
    recheckFlower(c, cx, base - S * 0.38, 20, S * 0.064, '#cf78a6', '#eee0c3'); return;
  }
  if (name === 'Buttercup') {
    for (let i = 0; i < 7; i++) recheckLeaf(c, p, cx, base - 8, i / 7 * TAU, S * 0.14, 'palmate');
    for (const x of [cx - S * 0.08, cx + S * 0.08]) { recheckStem(c, x, base - 8, base - S * 0.34, 3.5, stem); recheckFlower(c, x, base - S * 0.37, 5, S * 0.060, '#f0c62c', '#b7801d', true); }
    return;
  }
  if (name === 'Daisy') {
    for (let i = 0; i < 10; i++) recheckLeaf(c, p, cx, base - 9, i / 10 * TAU, S * 0.11, 'broad');
    recheckStem(c, cx, base - 6, base - S * 0.38, 3.5, stem); recheckFlower(c, cx, base - S * 0.42, 20, S * 0.078, '#f7f4df', '#deb52d'); return;
  }
  if (name === 'Black-Eyed Susan' || name === 'Echinacea') {
    recheckStem(c, cx, base, base - S * 0.48, 5, '#5e6d38');
    recheckLeaf(c, p, cx, base - S * 0.18, 2.8, S * 0.18, 'lance', true); recheckLeaf(c, p, cx, base - S * 0.30, 0.25, S * 0.17, 'lance', true);
    recheckFlower(c, cx, base - S * 0.55, 14, S * 0.100, name === 'Echinacea' ? '#b67ac1' : '#e2ad27', '#462e1b');
    recheckCone(c, cx, base - S * 0.55, S * 0.038, S * 0.080, '#5a3620'); return;
  }
  if (name === 'Arnica') {
    for (let i = 0; i < 7; i++) recheckLeaf(c, p, cx, base - 8, -2.8 + i * 0.72, S * 0.13, 'broad');
    recheckStem(c, cx, base - 7, base - S * 0.40, 4, stem);
    /* one loose, slightly down-turned ray head — never the generic three-flower ladder */
    for (let i = 0; i < 13; i++) recheckPetal(c, cx, base - S * 0.43, i / 13 * TAU + 0.12, S * 0.074, S * 0.023, '#e3b42d');
    c.fillStyle = '#6d4b1d'; c.beginPath(); c.arc(cx, base - S * 0.43, S * 0.027, 0, TAU); c.fill(); return;
  }
  if (name === 'Bitterroot') {
    c.fillStyle = 'rgba(163,138,107,0.52)'; for (let i = 0; i < 18; i++) { const a = i * 2.4, d = Math.sqrt(i / 18) * S * 0.22; c.beginPath(); c.arc(cx + Math.cos(a) * d, base + Math.sin(a) * d * 0.28, 2.2, 0, TAU); c.fill(); }
    for (let i = 0; i < 9; i++) recheckLeaf(c, p, cx, base - 3, i / 9 * TAU, S * 0.095, 'lance');
    recheckFlower(c, cx, base - S * 0.10, 18, S * 0.115, '#e586a2', '#f4d35f'); return;
  }
  if (name === 'Chicory') {
    for (let b = -1; b <= 1; b++) { const x = cx + b * S * 0.070; recheckStem(c, x, base, base - S * (0.44 - Math.abs(b) * 0.08), 2.7, '#657043'); for (let j = 0; j < 2; j++) { const y = base - S * (0.23 + j * 0.13) - Math.abs(b) * 8; recheckFlower(c, x + b * 7, y, 18, S * 0.050, '#6b86d2', '#e5bd42'); } }
    return;
  }
  if (name === 'Cliff Rose') {
    for (let b = 0; b < 12; b++) { const a = -2.9 + b * 0.23, len = S * (0.18 + (b % 3) * 0.025); c.strokeStyle = '#86644b'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + Math.cos(a) * len, base + Math.sin(a) * len * 0.52); c.stroke(); }
    for (let i = 0; i < 5; i++) recheckFlower(c, cx + (i - 2) * S * 0.065, base - S * (0.17 + (i % 2) * 0.07), 5, S * 0.050, '#f2ecdb', '#d7b542');
    c.strokeStyle = 'rgba(238,236,220,0.76)'; c.lineWidth = 1.2; for (let i = 0; i < 18; i++) { const x = cx + (r() - 0.5) * S * 0.30, y = base - S * (0.12 + r() * 0.22); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 8, y - 8); c.stroke(); } return;
  }
  if (name === 'Edelweiss') {
    for (let i = 0; i < 10; i++) recheckPetal(c, cx, base - S * 0.19, i / 10 * TAU, S * 0.120, S * 0.040, '#e8e8df');
    c.fillStyle = '#ded8a2'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.beginPath(); c.arc(cx + Math.cos(a) * 10, base - S * 0.19 + Math.sin(a) * 10, S * 0.018, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.30)'; for (let i = 0; i < 42; i++) { const a = r() * TAU, d = r() * S * 0.11; c.beginPath(); c.arc(cx + Math.cos(a) * d, base - S * 0.19 + Math.sin(a) * d, 1.4, 0, TAU); c.fill(); } return;
  }
  if (name === 'Gentian') {
    for (const x of [cx - S * 0.06, cx + S * 0.06]) recheckLeaf(c, p, x, base - S * 0.10, x < cx ? -2.5 : -0.64, S * 0.16, 'lance');
    recheckStem(c, cx, base, base - S * 0.30, 4, '#49633c');
    c.fillStyle = '#28499c'; c.beginPath(); c.moveTo(cx - S * 0.070, base - S * 0.31); c.quadraticCurveTo(cx - S * 0.10, base - S * 0.46, cx, base - S * 0.52); c.quadraticCurveTo(cx + S * 0.10, base - S * 0.46, cx + S * 0.070, base - S * 0.31); c.closePath(); c.fill();
    for (let i = 0; i < 5; i++) recheckPetal(c, cx, base - S * 0.48, -Math.PI / 2 + i * TAU / 5, S * 0.052, S * 0.020, '#4166c5'); return;
  }
  if (name === 'Rabbitbrush') {
    for (let b = 0; b < 13; b++) { const a = -2.85 + b * 0.22, len = S * (0.24 + (b % 4) * 0.020); c.strokeStyle = '#c7c8b6'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + Math.cos(a) * len, base + Math.sin(a) * len * 0.75); c.stroke(); for (let k = 0; k < 3; k++) recheckLeaf(c, p, cx + Math.cos(a) * len * (0.38 + k * 0.18), base + Math.sin(a) * len * (0.38 + k * 0.18), a + (k % 2 ? 0.75 : -0.75), S * 0.060, 'needle'); }
    for (let i = 0; i < 15; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.26, base - S * (0.26 + r() * 0.18), 10, S * 0.025, '#dcba27', '#6b4a1e'); return;
  }
  /* Steppe tulip: a single low cup on two broad, grey-green basal blades. */
  recheckLeaf(c, p, cx, base - 8, -2.58, S * 0.22, 'broad'); recheckLeaf(c, p, cx, base - 8, -0.56, S * 0.22, 'broad');
  recheckStem(c, cx, base - 6, base - S * 0.28, 4, stem);
  c.fillStyle = '#d65055'; c.beginPath(); c.moveTo(cx - S * 0.075, base - S * 0.29); c.quadraticCurveTo(cx - S * 0.080, base - S * 0.43, cx, base - S * 0.48); c.quadraticCurveTo(cx + S * 0.080, base - S * 0.43, cx + S * 0.075, base - S * 0.29); c.closePath(); c.fill();
}

function recheckSucculent(c: Ctx, g: G, p: Pal, _spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.83;
  ground(c, cx, base + 4, S * 0.22);
  if (name === 'Prickly Pear') {
    const pads = [[0, 0.20, 0.13], [-0.13, 0.37, 0.10], [0.15, 0.42, 0.09]] as const;
    for (const [ox, oy, sc] of pads) { const x = cx + S * ox, y = base - S * oy; c.fillStyle = '#759a58'; c.beginPath(); c.ellipse(x, y, S * sc * 0.62, S * sc, 0, 0, TAU); c.fill(); c.strokeStyle = '#d9d5b0'; c.lineWidth = 1.6; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * S * sc * 0.34, y + Math.sin(a) * S * sc * 0.55); c.lineTo(x + Math.cos(a) * S * sc * 0.50, y + Math.sin(a) * S * sc * 0.82); c.stroke(); } }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.fillStyle = '#d64666'; c.beginPath(); c.ellipse(cx + Math.cos(a) * S * 0.16, base - S * 0.39 + Math.sin(a) * S * 0.08, S * 0.020, S * 0.034, a, 0, TAU); c.fill(); } return;
  }
  if (name === 'Barrel Cactus Fruit') {
    c.fillStyle = '#668d45'; c.beginPath(); c.ellipse(cx, base - S * 0.25, S * 0.16, S * 0.24, 0, 0, TAU); c.fill();
    c.strokeStyle = '#3d6534'; c.lineWidth = 4; for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(cx + i * S * 0.038, base - S * 0.25, S * 0.025, S * 0.23, 0, -1.4, 1.4); c.stroke(); }
    c.strokeStyle = '#8d4a2a'; c.lineWidth = 2.4; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; const x = cx + Math.cos(a) * S * 0.13, y = base - S * 0.25 + Math.sin(a) * S * 0.20; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y - 4, x + 11, y - 2); c.stroke(); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.fillStyle = '#e0ad2c'; c.beginPath(); c.arc(cx + Math.cos(a) * S * 0.10, base - S * 0.49 + Math.sin(a) * S * 0.035, S * 0.024, 0, TAU); c.fill(); } return;
  }
  const air = name === 'Air Plant'; const aloe = name === 'Aloe'; const yucca = name === 'Yucca';
  for (let i = 0; i < (air ? 12 : 16); i++) { const a = -Math.PI / 2 + (i - (air ? 5.5 : 7.5)) * (air ? 0.36 : 0.27); recheckLeaf(c, p, cx, base - S * 0.08, a, S * (air ? 0.25 : 0.31), yucca ? 'blade' : 'lance'); if (name === 'Agave' || yucca) { c.strokeStyle = '#342c28'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * S * 0.28, base - S * 0.08 + Math.sin(a) * S * 0.28); c.lineTo(cx + Math.cos(a) * S * 0.34, base - S * 0.08 + Math.sin(a) * S * 0.34); c.stroke(); } }
  if (air) { recheckCone(c, cx, base - S * 0.23, S * 0.10, S * 0.16, '#ed7187'); recheckFlower(c, cx, base - S * 0.33, 5, S * 0.040, '#8663c2', '#efcf38'); return; }
  recheckStem(c, cx, base - S * 0.08, base - S * 0.52, 5, '#6f823d');
  for (let i = 0; i < (aloe ? 7 : 9); i++) { const y = base - S * (0.28 + i * 0.034), side = i % 2 ? 1 : -1; if (aloe || yucca) { c.save(); c.translate(cx + side * S * 0.034, y); c.rotate(side * 0.72); recheckCone(c, 0, 0, S * 0.025, S * 0.065, aloe ? '#e66b3b' : '#f2eee0'); c.restore(); } }
}

function recheckWetland(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.80, r = rngF(g, name, 0x7f33);
  recheckWater(c, base - 4);
  if (name === 'Duckweed') {
    for (let i = 0; i < 14; i++) { const x = cx + (r() - 0.5) * S * 0.48, y = base + (r() - 0.5) * S * 0.12; c.fillStyle = i % 3 ? '#81b64c' : '#9cca54'; c.beginPath(); c.ellipse(x, y, S * 0.036, S * 0.025, r() * TAU, 0, TAU); c.fill(); c.strokeStyle = 'rgba(230,246,174,0.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y + S * 0.020); c.quadraticCurveTo(x + 3, y + S * 0.07, x - 2, y + S * 0.10); c.stroke(); } return;
  }
  if (name === 'Papyrus') {
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.055; recheckStem(c, x, base, base - S * 0.54 - Math.abs(i) * 6, 4.5, '#5e8e57'); const top = base - S * 0.54 - Math.abs(i) * 6; c.strokeStyle = '#96aa6a'; c.lineWidth = 1.5; for (let j = 0; j < 22; j++) { const a = j / 22 * TAU; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + Math.cos(a) * S * 0.05, top + Math.sin(a) * S * 0.02, x + Math.cos(a) * S * 0.12, top + Math.sin(a) * S * 0.11); c.stroke(); } } return;
  }
  if (name === 'Cattail') {
    for (let i = -1; i <= 1; i++) { const x = cx + i * S * 0.07; recheckStem(c, x, base, base - S * 0.60, 4, '#638854'); c.fillStyle = '#694425'; c.fillRect(x - S * 0.022, base - S * 0.56, S * 0.044, S * 0.17); c.fillStyle = '#b8a56b'; c.fillRect(x - S * 0.012, base - S * 0.66, S * 0.024, S * 0.075); recheckLeaf(c, p, x, base, i ? -1.05 + i * 0.25 : -1.72, S * 0.30, 'blade'); } return;
  }
  if (name === 'Seagrass' || name === 'Wild Rice') {
    for (let i = 0; i < 16; i++) { const x = cx + (i - 7.5) * S * 0.022; const a = -1.55 + (r() - 0.5) * 0.55; recheckLeaf(c, p, x, base, a, S * (0.27 + r() * 0.11), 'blade'); }
    c.strokeStyle = '#876143'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - S * 0.24, base + 8); c.quadraticCurveTo(cx, base - 6, cx + S * 0.23, base + 10); c.stroke();
    if (name === 'Wild Rice') for (let i = 0; i < 14; i++) { const x = cx + (r() - 0.5) * S * 0.20, y = base - S * (0.35 + r() * 0.28); c.strokeStyle = '#61522c'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(cx, base - S * 0.30); c.lineTo(x, y); c.stroke(); c.fillStyle = '#4d3b2b'; c.beginPath(); c.ellipse(x, y, S * 0.010, S * 0.028, 0.6, 0, TAU); c.fill(); } return;
  }
  if (name === 'Arrowhead' || name === 'Pickerelweed') {
    for (let i = 0; i < 7; i++) { const a = -2.7 + i * 0.9; recheckStem(c, cx + Math.cos(a) * 12, base, base - S * 0.24 + Math.sin(a) * 10, 3.5, '#5f8c4d'); recheckLeaf(c, p, cx + Math.cos(a) * 12, base - S * 0.22 + Math.sin(a) * 10, a - Math.PI / 2, S * 0.19, name === 'Arrowhead' ? 'arrow' : 'heart'); }
    recheckStem(c, cx, base - 6, base - S * 0.50, 3.5, '#577a48'); for (let i = 0; i < 4; i++) recheckFlower(c, cx + (i % 2 ? 12 : -12), base - S * (0.34 + (i / 4) * 0.18), name === 'Arrowhead' ? 3 : 6, S * 0.035, name === 'Arrowhead' ? '#fbfaf0' : '#6951b6', '#e2c44c'); return;
  }
  if (spec.strictSignature && name === 'Lotus Root') {
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.080; c.fillStyle = '#768e4b'; c.beginPath(); c.ellipse(x, base - S * 0.08, S * 0.105, S * 0.060, 0, 0, TAU); c.fill(); }
    recheckStem(c, cx, base - S * 0.05, base - S * 0.48, 4.5, '#5e8148'); recheckFlower(c, cx, base - S * 0.53, 12, S * 0.080, '#e7a5bb', '#e3bd58');
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.052, y = base + S * 0.070 + Math.abs(i) * 4; c.fillStyle = '#d5c08a'; c.beginPath(); c.ellipse(x, y, S * 0.050, S * 0.072, i * 0.15, 0, TAU); c.fill(); c.fillStyle = '#765e3d'; for (let h = 0; h < 5; h++) { const a = h / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * S * 0.022, y + Math.sin(a) * S * 0.022, S * 0.008, 0, TAU); c.fill(); } }
    return;
  }
  /* low, rooting emergent mat: Brooklime, Watercress and Water Spinach */
  c.strokeStyle = '#4d8a5d'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.27, base - 6); c.quadraticCurveTo(cx, base - S * 0.13, cx + S * 0.28, base - S * 0.05); c.stroke();
  for (let i = 0; i < 9; i++) { const x = cx - S * 0.23 + i * S * 0.055, y = base - S * (0.06 + (i % 2) * 0.06); recheckLeaf(c, p, x, y, i % 2 ? -0.9 : -2.2, S * 0.105, name === 'Water Spinach' ? 'arrow' : 'broad'); c.strokeStyle = 'rgba(235,240,220,0.75)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x + (i % 2 ? 4 : -4), base + S * 0.06); c.stroke(); }
  for (let i = 0; i < 4; i++) recheckFlower(c, cx - S * 0.13 + i * S * 0.09, base - S * 0.22 - (i % 2) * 10, name === 'Water Spinach' ? 5 : 4, S * 0.030, name === 'Water Spinach' ? '#eee4e8' : '#f5f4e9', '#d6be46');
}

function recheckCrop(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.83, r = rngF(g, name, 0x7f34);
  ground(c, cx, base + 4, S * 0.23);
  if (spec.strictSignature && name === 'Sweet Flag') {
    recheckWater(c, base - S * 0.02);
    for (let i = -5; i <= 5; i++) { const a = -Math.PI / 2 + i * 0.105; c.strokeStyle = '#7b9a4e'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + Math.cos(a) * S * 0.06, base - S * 0.20, cx + Math.cos(a) * S * 0.17, base + Math.sin(a) * S * 0.32); c.stroke(); }
    c.strokeStyle = '#637d3e'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - S * 0.045, base); c.lineTo(cx - S * 0.075, base - S * 0.43); c.stroke(); c.fillStyle = '#9a9549'; c.beginPath(); c.ellipse(cx - S * 0.095, base - S * 0.30, S * 0.030, S * 0.095, 0.45, 0, TAU); c.fill();
    return;
  }
  if (spec.strictSignature && name === 'Meadow Grass') {
    /* An airy Poa pyramid has separated branch levels and a loose tuft; it is
       deliberately not the umbrella of grains that failed the fresh strip. */
    for (let s = -4; s <= 4; s++) { const x = cx + s * S * 0.028; recheckStem(c, x, base, base - S * (0.24 + Math.abs(s) * 0.012), 2.3, '#61824b'); recheckLeaf(c, p, x, base - S * 0.06, -1.6 + s * 0.12, S * 0.18, 'blade'); }
    for (let level = 0; level < 4; level++) { const y = base - S * (0.32 + level * 0.09), span = S * (0.20 - level * 0.030); for (let b = -2; b <= 2; b++) { const ex = cx + b * span * 0.55, ey = y - S * (0.035 + Math.abs(b) * 0.018); c.strokeStyle = '#a79656'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, y + S * 0.07); c.quadraticCurveTo(cx + b * span * 0.20, y, ex, ey); c.stroke(); c.fillStyle = '#c6ae62'; c.beginPath(); c.ellipse(ex, ey, S * 0.008, S * 0.021, b * 0.20, 0, TAU); c.fill(); } }
    return;
  }
  if (spec.strictSignature && hasName(name, 'Bamboo Shoots', 'Pampas Herb', 'Rush Shoots', 'Saltgrass', 'Tussock Grass')) {
    if (name === 'Bamboo Shoots') {
      for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.060; c.strokeStyle = '#5c8c4c'; c.lineWidth = 9; c.beginPath(); c.moveTo(x, base); c.lineTo(x + i * 2, base - S * (0.42 + (i % 2) * 0.08)); c.stroke(); c.strokeStyle = '#d1b16b'; c.lineWidth = 2.6; for (let j = 1; j < 6; j++) { const y = base - S * j * 0.075; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.stroke(); } for (let l = 0; l < 3; l++) recheckLeaf(c, p, x + i * 2, base - S * (0.24 + l * 0.07), l % 2 ? -2.6 : -0.55, S * 0.13, 'lance'); }
      c.fillStyle = '#9a6c3b'; c.beginPath(); c.ellipse(cx, base - S * 0.03, S * 0.09, S * 0.075, 0, 0, TAU); c.fill(); return;
    }
    if (name === 'Pampas Herb') {
      for (let i = -8; i <= 8; i++) recheckLeaf(c, p, cx, base, -Math.PI / 2 + i * 0.10, S * 0.30, 'blade');
      recheckStem(c, cx, base, base - S * 0.62, 4, '#7a8649'); c.strokeStyle = 'rgba(232,225,197,0.85)'; c.lineWidth = 3; for (let i = -9; i <= 9; i++) { c.beginPath(); c.moveTo(cx, base - S * 0.60); c.quadraticCurveTo(cx + i * 3, base - S * 0.70, cx + i * 4, base - S * 0.76); c.stroke(); } return;
    }
    if (name === 'Rush Shoots') {
      /* Juncus-like shoots are round, leafless stems with a side-set cluster;
         the former radiating blade fan read as an unrelated grass rosette. */
      for (let i = -3; i <= 3; i++) { const x = cx + i * S * 0.045, top = base - S * (0.35 + (i & 1) * 0.09); c.strokeStyle = '#607f50'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + i * 1.5, base - S * 0.16, x + i * 0.7, top); c.stroke(); if (i === -1 || i === 1) { const bx = x + S * 0.034, by = top + S * 0.10; c.strokeStyle = '#7d6943'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, by); c.lineTo(bx, by); c.stroke(); for (let q = 0; q < 5; q++) { c.fillStyle = '#826240'; c.beginPath(); c.arc(bx + (q - 2) * S * 0.012, by + (q & 1) * S * 0.015, S * 0.012, 0, TAU); c.fill(); } } }
      return;
    }
    if (name === 'Saltgrass') {
      c.strokeStyle = '#8d744d'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.29, base); c.quadraticCurveTo(cx, base - S * 0.07, cx + S * 0.29, base - S * 0.02); c.stroke();
      for (let i = -7; i <= 7; i++) { const x = cx + i * S * 0.035, y = base - S * (0.015 + (i & 1) * 0.020); recheckLeaf(c, p, x, y, -Math.PI / 2 + i * 0.035, S * (0.17 + Math.abs(i) * 0.008), 'blade'); }
      return;
    }
    if (name === 'Tussock Grass') {
      c.fillStyle = '#8d774f'; c.beginPath(); c.ellipse(cx, base, S * 0.19, S * 0.075, 0, 0, TAU); c.fill();
      for (let i = -8; i <= 8; i++) recheckLeaf(c, p, cx, base, -Math.PI / 2 + i * 0.095, S * 0.27, 'blade');
      for (let s = -3; s <= 3; s++) { const x = cx + s * S * 0.040, top = base - S * (0.46 + (s & 1) * 0.05); c.strokeStyle = '#7d8650'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx, base - S * 0.03); c.lineTo(x, top); c.stroke(); for (let b = -1; b <= 1; b++) { const ex = x + b * S * 0.055, ey = top + S * 0.065; c.strokeStyle = '#a8995e'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, top + S * 0.02); c.lineTo(ex, ey); c.stroke(); c.fillStyle = '#c3ad67'; c.beginPath(); c.ellipse(ex, ey, S * 0.009, S * 0.022, b * 0.25, 0, TAU); c.fill(); } }
      return;
    }
    for (let i = -7; i <= 7; i++) recheckLeaf(c, p, cx, base, -Math.PI / 2 + i * 0.13, S * (name === 'Tussock Grass' ? 0.28 : 0.23), 'blade');
    if (name === 'Tussock Grass') { c.fillStyle = '#8c774d'; c.beginPath(); c.ellipse(cx, base + S * 0.005, S * 0.16, S * 0.070, 0, 0, TAU); c.fill(); }
    if (name === 'Rush Shoots') { recheckStem(c, cx, base, base - S * 0.48, 4, '#668552'); c.fillStyle = '#74533b'; c.beginPath(); c.ellipse(cx + S * 0.035, base - S * 0.30, S * 0.045, S * 0.020, 0, 0, TAU); c.fill(); }
    if (name === 'Saltgrass') { c.fillStyle = '#b89e58'; c.beginPath(); c.ellipse(cx, base - S * 0.36, S * 0.10, S * 0.028, 0, 0, TAU); c.fill(); }
    return;
  }
  if (spec.strictSignature && name === 'Buckwheat') {
    /* Red-jointed angular stems, arrow leaves, and visibly three-sided seed
       grains distinguish buckwheat from the neighbouring cereal plume. */
    for (let s = -1; s <= 1; s++) { const x = cx + s * S * 0.060, top = base - S * (0.47 + (s & 1) * 0.05); c.strokeStyle = '#a5504b'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, base); c.lineTo(x, top); c.stroke(); for (let n = 0; n < 3; n++) { const y = base - S * (0.15 + n * 0.095); c.fillStyle = '#b54f4c'; c.beginPath(); c.arc(x, y, S * 0.014, 0, TAU); c.fill(); recheckLeaf(c, p, x, y, n & 1 ? -2.58 : -0.55, S * 0.13, 'arrow'); }
      for (let q = 0; q < 6; q++) { const px = x + (q - 2.5) * S * 0.022, py = top + S * (0.025 + (q & 1) * 0.025); c.fillStyle = '#72523e'; c.beginPath(); c.moveTo(px, py - S * 0.018); c.lineTo(px + S * 0.018, py + S * 0.012); c.lineTo(px - S * 0.018, py + S * 0.012); c.closePath(); c.fill(); }
    }
    return;
  }
  const cereal = hasName(name, 'Barley', 'Millet', 'Oats', 'Quinoa', 'Rice', 'Rye', 'Sorghum', 'Wheat', 'Wild Rice', 'Meadow Grass');
  if (cereal) {
    const flooded = name === 'Rice'; if (flooded) recheckWater(c, base - 5);
    const stems = name === 'Rice' ? 7 : 4;
    for (let s = 0; s < stems; s++) { const x = cx + (s - (stems - 1) / 2) * S * 0.045; recheckStem(c, x, base, base - S * (0.46 + r() * 0.12), 3.5 + (name === 'Sorghum' ? 2 : 0), '#7c8946'); for (let l = 0; l < 4; l++) recheckLeaf(c, p, x, base - S * (0.15 + l * 0.07), l % 2 ? -2.5 : -0.65, S * 0.15, 'blade'); }
    const top = base - S * 0.58;
    if (name === 'Oats' || name === 'Rice' || name === 'Meadow Grass') { for (let i = 0; i < 16; i++) { const a = -2.8 + i * 0.22, len = S * (0.09 + r() * 0.10); c.strokeStyle = '#aa9a57'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, top); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.5, top + Math.sin(a) * len * 0.5, cx + Math.cos(a) * len, top + Math.sin(a) * len); c.stroke(); c.fillStyle = '#c7b66a'; c.beginPath(); c.ellipse(cx + Math.cos(a) * len, top + Math.sin(a) * len, 4, 9, a, 0, TAU); c.fill(); } }
    else { const longAwn = name === 'Barley' || name === 'Rye' || name === 'Wheat'; for (let i = 0; i < 18; i++) { const y = top + i * S * 0.014, side = i % 2 ? 1 : -1; c.fillStyle = name === 'Quinoa' ? '#bc6454' : '#c6aa58'; c.beginPath(); c.ellipse(cx + side * S * 0.018, y, S * 0.017, S * 0.010, 0, 0, TAU); c.fill(); if (longAwn) { c.strokeStyle = '#d8c26a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(cx + side * S * 0.025, y); c.lineTo(cx + side * S * 0.105, y - S * 0.028); c.stroke(); } } }
    return;
  }
  if (name === 'Potato' || name === 'Sweet Potato' || name === 'Cassava' || name === 'Arrowroot' || name === 'Taro') {
    for (let i = 0; i < 8; i++) recheckLeaf(c, p, cx, base - S * 0.16, -2.8 + i * 0.70, S * 0.19, name === 'Cassava' ? 'palmate' : name === 'Taro' ? 'arrow' : name === 'Sweet Potato' ? 'heart' : 'broad');
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.065; c.strokeStyle = '#a47a46'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, base - 10); c.quadraticCurveTo(x, base + S * 0.04, x, base + S * 0.11); c.stroke(); c.fillStyle = name === 'Potato' ? '#c6a86c' : name === 'Taro' ? '#80542f' : '#dec48a'; c.beginPath(); c.ellipse(x, base + S * 0.10, S * (name === 'Cassava' ? 0.035 : 0.048), S * (name === 'Cassava' ? 0.12 : 0.065), 0.15 * i, 0, TAU); c.fill(); }
    if (spec.strictSignature && name === 'Potato') for (let i = 0; i < 4; i++) recheckFlower(c, cx + (i - 1.5) * S * 0.07, base - S * 0.33, 5, S * 0.030, '#e4d9ec', '#e2bd48');
    if (spec.strictSignature && name === 'Arrowroot') { for (let i = 0; i < 4; i++) recheckFlower(c, cx + (i - 1.5) * S * 0.07, base - S * 0.36, 3, S * 0.026, '#f5f3e4', '#e1bd46'); c.strokeStyle = '#a77947'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(cx + i * 11, base + S * 0.09, S * 0.025, 0, TAU); c.stroke(); } }
    if (spec.strictSignature && name === 'Taro') { c.strokeStyle = 'rgba(230,232,188,0.48)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(cx, base - S * 0.16); c.lineTo(cx + Math.cos(a) * S * 0.14, base - S * 0.16 + Math.sin(a) * S * 0.14); c.stroke(); } }
    if (spec.strictSignature && name === 'Cassava') { c.strokeStyle = '#aa5148'; c.lineWidth = 5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx, base - S * 0.15); c.lineTo(cx + i * S * 0.09, base - S * 0.45); c.stroke(); } }
    return;
  }
  /* Amaranth / Buckwheat: a conspicuous seed plume plus broad/three-angled cues. */
  recheckStem(c, cx, base, base - S * 0.54, 6, '#7b4d46'); for (let i = 0; i < 7; i++) recheckLeaf(c, p, cx, base - S * (0.16 + i * 0.05), i % 2 ? -2.65 : -0.48, S * 0.16, name === 'Buckwheat' && spec.strictSignature ? 'arrow' : name === 'Buckwheat' ? 'heart' : 'broad');
  for (let i = 0; i < 34; i++) { const y = base - S * (0.38 + i * 0.007), x = cx + (r() - 0.5) * S * (name === 'Amaranth' ? 0.11 : 0.17); c.fillStyle = name === 'Amaranth' ? '#a43f52' : '#7f5a42'; c.beginPath(); c.arc(x, y, name === 'Amaranth' ? 4 : 3.5, 0, TAU); c.fill(); }
}

/* The fresh review found that small fruit accents could not rescue the same
   round canopy for every named tree.  These are deliberately whole-form,
   named exceptions: visible branching/negative space comes first, then the
   harvest cue is placed on the bough or trunk that owns it. */
function strictTreeSignature(c: Ctx, g: G, p: Pal, name: string): boolean {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f79);
  const twig = (x: number, y: number, tx: number, ty: number, col = '#6c4d36', w = 4): void => {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
    c.moveTo(x, y); c.quadraticCurveTo((x + tx) * 0.5 + (r() - 0.5) * S * 0.035, (y + ty) * 0.5, tx, ty); c.stroke();
  };
  const leaf = (x: number, y: number, a: number, len: number, kind: PlantSpec['leaf'] = 'broad', serr = false): void => recheckLeaf(c, p, x, y, a, len, kind, serr);
  const dot = (x: number, y: number, rad: number, col: string): void => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); };
  const mapleLeaf = (x: number, y: number, sc: number, rot: number): void => {
    const pts: ReadonlyArray<readonly [number, number]> = [[0, -1], [0.17, -0.36], [0.55, -0.64], [0.35, -0.10], [0.86, 0.04], [0.30, 0.14], [0.38, 0.62], [0, 0.30], [-0.38, 0.62], [-0.30, 0.14], [-0.86, 0.04], [-0.35, -0.10], [-0.55, -0.64], [-0.17, -0.36]];
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = '#78a94f'; c.beginPath();
    for (const [px, py] of pts) { const qx = px * sc, qy = py * sc; if (px === 0 && py === -1) c.moveTo(qx, qy); else c.lineTo(qx, qy); }
    c.closePath(); c.fill(); c.strokeStyle = 'rgba(232,237,178,0.58)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, sc * 0.25); c.lineTo(0, -sc * 0.78); c.stroke(); c.restore();
  };

  if (name === 'Birch Sap' || name === 'Maple Sap') {
    const birch = name === 'Birch Sap';
    const bark = birch ? '#eee6cf' : '#8c6443';
    for (const [ox, h] of [[-0.045, 0.57], [0.018, 0.65], [0.070, 0.50]] as const) {
      const x = cx + S * ox; twig(x, base, x + S * ox * 0.40, base - S * h, bark, birch ? 8 : 7);
      if (birch) {
        c.fillStyle = '#40382e';
        for (let q = 0; q < 4; q++) { const y = base - S * (0.13 + q * 0.105); c.beginPath(); c.moveTo(x, y - S * 0.018); c.lineTo(x + S * 0.017, y); c.lineTo(x, y + S * 0.018); c.lineTo(x - S * 0.017, y); c.closePath(); c.fill(); }
      }
    }
    for (const side of [-1, 1] as const) {
      const sx = cx + S * side * 0.010, sy = base - S * 0.44, ex = cx + S * side * 0.25, ey = base - S * 0.50;
      twig(sx, sy, ex, ey, bark, 3); twig(ex, ey, ex + S * side * 0.055, ey + S * 0.11, bark, 2);
      for (let n = 0; n < 4; n++) { const x = cx + S * side * (0.08 + n * 0.045), y = base - S * (0.46 - n * 0.018); if (birch) leaf(x, y, side < 0 ? -2.68 : -0.48, S * 0.090, 'broad', true); else mapleLeaf(x, y, S * 0.070, side * (0.45 + n * 0.10)); }
    }
    if (!birch) {
      c.strokeStyle = '#6a5b4a'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + S * 0.015, base - S * 0.24); c.lineTo(cx + S * 0.12, base - S * 0.23); c.stroke();
      c.fillStyle = '#9aa6a7'; c.beginPath(); c.ellipse(cx + S * 0.145, base - S * 0.18, S * 0.040, S * 0.050, 0, 0, TAU); c.fill();
    }
    return true;
  }

  if (name === 'Bay Laurel') {
    twig(cx, base, cx, base - S * 0.54, '#634b36', 10);
    /* Layered, irregular evergreen boughs retain a conical crown without
       reverting to the round disc that failed the fresh packet. */
    for (let row = 0; row < 6; row++) { const y = base - S * (0.18 + row * 0.070), span = S * (0.24 - row * 0.027); for (const side of [-1, 1] as const) { const ex = cx + side * span, ey = y - S * 0.035; twig(cx, y + S * 0.055, ex, ey, '#634b36', 2.8); for (let n = 0; n < 4; n++) { const x = cx + side * span * (0.30 + n * 0.18), ly = y - S * ((n & 1) * 0.030); leaf(x, ly, side < 0 ? -2.68 : -0.48, S * 0.095, 'lance'); if (row > 2 && n === 1) recheckFlower(c, x, ly + S * 0.035, 5, S * 0.014, '#f1ead8', '#e0c25d'); } } }
    for (let q = 0; q < 6; q++) dot(cx + (r() - 0.5) * S * 0.20, base - S * (0.26 + r() * 0.22), S * 0.014, '#2b2930');
    return true;
  }

  if (name === 'Breadnut') {
    twig(cx, base, cx - S * 0.025, base - S * 0.46, '#76523a', 12);
    for (let i = 0; i < 7; i++) { const a = -2.85 + i * 0.62, x = cx + Math.cos(a) * S * 0.14, y = base - S * 0.48 + Math.sin(a) * S * 0.11; twig(cx, base - S * 0.42, x, y, '#76523a', 3); leaf(x, y, a, S * 0.19, 'palmate'); }
    for (const [x, y] of [[-0.10, 0.31], [0.11, 0.40], [0.05, 0.24]] as const) { const fx = cx + S * x, fy = base - S * y; c.fillStyle = '#8a7b42'; c.beginPath(); c.arc(fx, fy, S * 0.048, 0, TAU); c.fill(); c.strokeStyle = '#d8c16c'; c.lineWidth = 1.3; for (let q = 0; q < 12; q++) { const a = q / 12 * TAU; c.beginPath(); c.moveTo(fx + Math.cos(a) * S * 0.035, fy + Math.sin(a) * S * 0.035); c.lineTo(fx + Math.cos(a) * S * 0.055, fy + Math.sin(a) * S * 0.055); c.stroke(); } }
    return true;
  }

  if (name === 'Camphor Tree' || name === 'Cinnamon') {
    const cinnamon = name === 'Cinnamon';
    twig(cx, base, cx - S * 0.035, base - S * 0.56, cinnamon ? '#9b613d' : '#6f6754', 12);
    for (let q = 0; q < 7; q++) { const y = base - S * (0.08 + q * 0.066); c.strokeStyle = cinnamon ? '#e4b277' : '#47433b'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - S * 0.038, y); c.lineTo(cx + S * 0.038, y - S * 0.012); c.stroke(); }
    for (const side of [-1, 1] as const) {
      twig(cx, base - S * 0.33, cx + side * S * 0.24, base - S * 0.45, '#72533b', 4);
      for (let n = 0; n < 6; n++) { const x = cx + side * S * (0.07 + n * 0.033), y = base - S * (0.36 + (n & 1) * 0.060); leaf(x, y, side < 0 ? -2.63 : -0.52, S * 0.12, 'lance'); c.strokeStyle = 'rgba(215,232,169,0.62)'; c.lineWidth = 1.2; for (const off of [-0.018, 0, 0.018]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.055, y + off * S * 0.80); c.stroke(); } if (cinnamon && n % 3 === 0) leaf(x + side * S * 0.028, y - S * 0.035, side < 0 ? -2.63 : -0.52, S * 0.075, 'lance'); }
    }
    if (!cinnamon) {
      for (let row = 0; row < 3; row++) for (const side of [-1, 1] as const) { const x = cx + side * S * (0.08 + row * 0.040), y = base - S * (0.52 + row * 0.048); leaf(x, y, side < 0 ? -2.55 : -0.59, S * 0.13, 'lance'); c.strokeStyle = 'rgba(215,232,169,0.62)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.058, y - S * 0.018); c.stroke(); }
      for (const [ox, oy] of [[-0.14, 0.43], [0.13, 0.43], [-0.08, 0.55], [0.08, 0.55], [0, 0.61]] as const) { const x = cx + S * ox, y = base - S * oy; for (let q = 0; q < 4; q++) { const a = -2.75 + q * 0.70; leaf(x, y, a, S * 0.095, 'lance'); } }
    }
    return true;
  }

  if (name === 'Neem') {
    twig(cx, base, cx, base - S * 0.55, '#76543d', 10);
    for (const side of [-1, 1] as const) for (let row = 0; row < 4; row++) {
      const sx = cx + S * side * 0.012, sy = base - S * (0.26 + row * 0.08), ex = cx + S * side * (0.13 + (row & 1) * 0.06), ey = sy - S * (0.10 - row * 0.008);
      twig(sx, sy, ex, ey, '#76543d', 3.2);
      for (let n = 0; n < 5; n++) { const x = sx + (ex - sx) * (n / 5), y = sy + (ey - sy) * (n / 5); leaf(x, y, side < 0 ? -2.58 : -0.56, S * 0.065, 'pinnate', true); if (n > 2 && row % 2 === 0) recheckFlower(c, x + side * S * 0.018, y + S * 0.024, 5, S * 0.014, '#f3eee0', '#e2c35c'); }
    }
    return true;
  }

  if (name === 'Star Anise') {
    twig(cx, base, cx, base - S * 0.47, '#604838', 9);
    for (const side of [-1, 1] as const) {
      twig(cx, base - S * 0.28, cx + side * S * 0.23, base - S * 0.41, '#604838', 3.6);
      for (let n = 0; n < 5; n++) { const x = cx + side * S * (0.065 + n * 0.038), y = base - S * (0.31 + (n & 1) * 0.058); leaf(x, y, side < 0 ? -2.65 : -0.50, S * 0.105, 'lance'); if (n & 1) { c.fillStyle = '#77513a'; c.beginPath(); for (let q = 0; q < 8; q++) { const a = -Math.PI / 2 + q * TAU / 8, px = x + Math.cos(a) * S * 0.040, py = y + S * 0.055 + Math.sin(a) * S * 0.040; q ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); } }
    }
    for (let q = 0; q < 6; q++) { const a = -2.75 + q * 0.53; leaf(cx + Math.cos(a) * S * 0.12, base - S * 0.46 + Math.sin(a) * S * 0.07, a, S * 0.10, 'lance'); }
    for (const [ox, oy] of [[-0.13, 0.32], [0.12, 0.36], [-0.05, 0.49], [0.20, 0.43]] as const) { const x = cx + S * ox, y = base - S * oy; c.fillStyle = '#785039'; c.beginPath(); for (let q = 0; q < 16; q++) { const a = -Math.PI / 2 + q * TAU / 16, rr = S * (q & 1 ? 0.022 : 0.053), px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; q ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); }
    return true;
  }

  if (name === 'Tree Tomato') {
    twig(cx, base, cx, base - S * 0.39, '#76503a', 9);
    for (const side of [-1, 1] as const) { const ex = cx + side * S * 0.20, ey = base - S * 0.54; twig(cx, base - S * 0.33, ex, ey, '#76503a', 4.5); for (let n = 0; n < 4; n++) { const x = cx + side * S * (0.06 + n * 0.045), y = base - S * (0.38 + (n & 1) * 0.070); leaf(x, y, side < 0 ? -2.64 : -0.50, S * 0.15, 'heart'); c.strokeStyle = '#8c6a45'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x, y + S * 0.06, x + side * S * 0.015, y + S * 0.105); c.stroke(); c.fillStyle = '#c84a36'; c.beginPath(); c.ellipse(x + side * S * 0.015, y + S * 0.115, S * 0.029, S * 0.052, side * 0.16, 0, TAU); c.fill(); } }
    return true;
  }

  if (name === 'Wild Fig') {
    twig(cx, base, cx, base - S * 0.55, '#a18767', 16);
    for (const side of [-1, 1] as const) { twig(cx, base - S * 0.34, cx + side * S * 0.23, base - S * 0.42, '#a18767', 5); c.strokeStyle = '#a18767'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + side * S * 0.12, base - S * 0.38); c.quadraticCurveTo(cx + side * S * 0.18, base - S * 0.20, cx + side * S * 0.18, base); c.stroke(); for (let n = 0; n < 4; n++) { const x = cx + side * S * (0.055 + n * 0.050), y = base - S * (0.36 + (n & 1) * 0.070); leaf(x, y, side < 0 ? -2.64 : -0.50, S * 0.15, 'palmate'); c.fillStyle = '#73506d'; c.beginPath(); c.ellipse(x, y + S * 0.070, S * 0.030, S * 0.042, 0, 0, TAU); c.fill(); } }
    return true;
  }

  if (name === 'Persimmon') {
    twig(cx, base, cx, base - S * 0.52, '#6e4d37', 9);
    for (const side of [-1, 1] as const) { twig(cx, base - S * 0.30, cx + side * S * 0.25, base - S * 0.49, '#6e4d37', 3.6); for (let n = 0; n < 3; n++) { const x = cx + side * S * (0.08 + n * 0.060), y = base - S * (0.33 + (n & 1) * 0.075); dot(x, y, S * 0.045, '#dc8128'); c.fillStyle = '#62673d'; for (let q = 0; q < 4; q++) { const a = -Math.PI / 2 + q * TAU / 4; c.beginPath(); c.ellipse(x + Math.cos(a) * S * 0.024, y + Math.sin(a) * S * 0.024, S * 0.012, S * 0.027, a, 0, TAU); c.fill(); } } }
    return true;
  }

  if (name === 'Pomegranate') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.055, top = base - S * (0.40 + (s & 1) * 0.08); twig(cx, base, x, top, '#765039', 4.6); for (let n = 0; n < 3; n++) { const y = base - S * (0.13 + n * 0.085); leaf(x, y, n & 1 ? -2.66 : -0.49, S * 0.095, 'lance'); c.strokeStyle = '#765039'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (n & 1 ? -1 : 1) * S * 0.050, y - S * 0.025); c.stroke(); }
      if ((s & 1) === 0) { const fy = top + S * 0.090; dot(x, fy, S * 0.038, '#bf3340'); c.strokeStyle = '#ecd06a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - S * 0.020, fy - S * 0.020); c.lineTo(x + S * 0.020, fy - S * 0.020); c.stroke(); recheckFlower(c, x + S * 0.035, top, 5, S * 0.026, '#e8764b', '#dfc04c'); }
    }
    return true;
  }

  if (name === 'Peach') {
    twig(cx, base, cx, base - S * 0.43, '#794e39', 9);
    for (const side of [-1, 1] as const) { const ex = cx + side * S * 0.23, ey = base - S * 0.55; twig(cx, base - S * 0.30, ex, ey, '#794e39', 4); for (let n = 0; n < 5; n++) { const x = cx + side * S * (0.045 + n * 0.042), y = base - S * (0.33 + (n & 1) * 0.075); leaf(x, y, side < 0 ? -2.62 : -0.52, S * 0.12, 'lance'); if (n === 2 || n === 4) { c.fillStyle = '#e19a70'; c.beginPath(); c.arc(x + side * S * 0.016, y + S * 0.065, S * 0.042, 0, TAU); c.fill(); c.strokeStyle = 'rgba(166,91,69,0.75)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + side * S * 0.016, y + S * 0.030); c.lineTo(x + side * S * 0.016, y + S * 0.098); c.stroke(); } } }
    return true;
  }

  if (name === 'Mesquite') {
    twig(cx, base, cx - S * 0.07, base - S * 0.35, '#75523a', 11);
    for (const side of [-1, 1] as const) { const ex = cx + side * S * 0.29, ey = base - S * 0.42; twig(cx - S * 0.04, base - S * 0.28, ex, ey, '#75523a', 4.6); for (let n = 0; n < 6; n++) { const x = cx + side * S * (0.07 + n * 0.040), y = base - S * (0.32 + (n & 1) * 0.055); leaf(x, y, side < 0 ? -2.64 : -0.50, S * 0.075, 'pinnate'); c.strokeStyle = '#4d3929'; c.lineWidth = 2; for (const thorn of [-1, 1] as const) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.045, y + thorn * S * 0.025); c.stroke(); } if (n > 2) { c.fillStyle = '#8a6f44'; c.beginPath(); c.ellipse(x, y + S * 0.055, S * 0.060, S * 0.014, side * 0.20, 0, TAU); c.fill(); } }
    }
    return true;
  }

  if (hasName(name, 'Marula', 'Wild Mango', 'Guava', 'Durian', 'Jujube', 'Chestnut', 'Apple', 'Cherry', 'Apricot', 'Mulberry', 'Pear', 'Plum', 'Olive', 'Orange', 'Lemon', 'Lime', 'Walnut', 'Date Plum', 'Clove', 'Nutmeg')) {
    const tall = hasName(name, 'Wild Mango', 'Durian', 'Pear', 'Clove', 'Nutmeg');
    const airy = hasName(name, 'Olive', 'Walnut', 'Jujube', 'Mulberry');
    const narrow = hasName(name, 'Pear', 'Date Plum', 'Clove', 'Nutmeg');
    const leafKind: PlantSpec['leaf'] = hasName(name, 'Olive', 'Clove', 'Nutmeg') ? 'lance' : name === 'Walnut' ? 'pinnate' : 'broad';
    const wide = !narrow && !tall && !airy;
    const branches = wide ? 9 : 7;
    twig(cx, base, cx + (airy ? -S * 0.035 : 0), base - S * (tall ? 0.62 : 0.50), name === 'Marula' ? '#9d7958' : '#6b4c37', tall ? 11 : 10);
    for (let b = 0; b < branches; b++) { const side = b & 1 ? 1 : -1, u = b / (branches - 1), sx = cx + (airy ? side * S * 0.015 : 0), sy = base - S * (0.19 + u * (tall ? 0.32 : 0.29)), ex = cx + side * S * (narrow ? 0.10 + (b % 2) * 0.05 : wide ? 0.18 + (b % 3) * 0.055 : 0.15 + (b % 2) * 0.075), ey = sy - S * (0.065 + (b % 3) * 0.035); twig(sx, sy, ex, ey, '#6b4c37', 3.6);
      if (wide && b % 2 === 0) twig(ex - side * S * 0.025, ey + S * 0.018, ex + side * S * 0.050, ey - S * 0.040, '#6b4c37', 2.2);
      const leafN = airy ? 4 : wide ? 6 : 5;
      for (let n = 0; n < leafN; n++) { const x = sx + (ex - sx) * (0.16 + n * 0.13), y = sy + (ey - sy) * (0.16 + n * 0.13); leaf(x, y, side < 0 ? -2.65 : -0.49, S * (narrow ? 0.085 : wide ? 0.115 : 0.105), leafKind, name === 'Chestnut'); if (name === 'Marula' && n % 2 === 0) { c.fillStyle = '#d8b34d'; c.beginPath(); c.arc(x, y + S * 0.060, S * 0.030, 0, TAU); c.fill(); } }
      const fx = ex + side * S * 0.018, fy = ey + S * 0.055;
      if (hasName(name, 'Apple', 'Cherry', 'Apricot', 'Plum', 'Jujube', 'Date Plum')) { dot(fx, fy, S * (name === 'Cherry' ? 0.026 : 0.036), name === 'Cherry' ? '#be3340' : name === 'Plum' ? '#68406e' : name === 'Jujube' ? '#9d4938' : '#d8893d'); if (name === 'Cherry') { c.strokeStyle = '#826342'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx, fy - S * 0.025); c.lineTo(fx, fy - S * 0.075); c.stroke(); } }
      if (hasName(name, 'Orange', 'Lemon', 'Lime')) { dot(fx, fy, S * 0.038, name === 'Orange' ? '#df8125' : name === 'Lemon' ? '#ddc52e' : '#52a441'); if (name === 'Lemon') { c.fillStyle = '#ddc52e'; c.beginPath(); c.ellipse(fx + side * S * 0.032, fy, S * 0.012, S * 0.018, 0, 0, TAU); c.fill(); } c.strokeStyle = '#5f4832'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + side * S * 0.045, fy - S * 0.030); c.stroke(); }
      if (name === 'Durian' && b === 2) { c.fillStyle = '#8d8740'; c.beginPath(); c.ellipse(fx, fy, S * 0.060, S * 0.075, 0.22, 0, TAU); c.fill(); c.strokeStyle = '#ded36c'; c.lineWidth = 1.4; for (let q = 0; q < 9; q++) { const a = q / 9 * TAU; c.beginPath(); c.moveTo(fx + Math.cos(a) * S * 0.040, fy + Math.sin(a) * S * 0.050); c.lineTo(fx + Math.cos(a) * S * 0.068, fy + Math.sin(a) * S * 0.086); c.stroke(); } }
      if (name === 'Chestnut' && b % 2 === 0) { c.fillStyle = '#8d813b'; c.beginPath(); c.arc(fx, fy, S * 0.045, 0, TAU); c.fill(); c.strokeStyle = '#ded273'; c.lineWidth = 1.2; for (let q = 0; q < 10; q++) { const a = q / 10 * TAU; c.beginPath(); c.moveTo(fx + Math.cos(a) * S * 0.028, fy + Math.sin(a) * S * 0.028); c.lineTo(fx + Math.cos(a) * S * 0.052, fy + Math.sin(a) * S * 0.052); c.stroke(); } }
    }
    /* A handful of overlapping leaf fans turns the branch ladder into a
       living crown while keeping silhouette gaps between named boughs. */
    const crown: ReadonlyArray<readonly [number, number]> = wide
      ? [[-0.18, 0.36], [0.16, 0.37], [-0.09, 0.50], [0.10, 0.51], [0, 0.58]]
      : narrow ? [[-0.07, 0.42], [0.07, 0.48], [0, 0.57]]
        : [[-0.13, 0.39], [0.13, 0.42], [0, 0.55]];
    for (const [ox, oy] of crown) {
      const x = cx + S * ox, y = base - S * oy;
      for (let q = 0; q < (airy ? 2 : 4); q++) { const a = -2.75 + q * 0.70; leaf(x, y, a, S * (wide ? 0.105 : 0.092), leafKind, name === 'Chestnut'); }
    }
    if (name === 'Marula') { for (let i = -2; i <= 2; i++) { c.strokeStyle = '#6b4b35'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + i * S * 0.020, base); c.lineTo(cx + i * S * 0.028, base - S * 0.42); c.stroke(); } }
    if (name === 'Olive') for (let i = 0; i < 8; i++) dot(cx + (r() - 0.5) * S * 0.26, base - S * (0.25 + r() * 0.25), S * 0.018, '#4a5533');
    if (name === 'Walnut') for (let i = 0; i < 4; i++) { const x = cx + (r() - 0.5) * S * 0.24, y = base - S * (0.22 + r() * 0.25); dot(x, y, S * 0.033, '#6b5039'); c.strokeStyle = '#a99365'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, S * 0.022, 0, TAU); c.stroke(); }
    if (name === 'Clove') for (let i = 0; i < 10; i++) { const x = cx + (r() - 0.5) * S * 0.22, y = base - S * (0.38 + r() * 0.17); c.fillStyle = '#8c4d39'; c.beginPath(); c.ellipse(x, y, S * 0.013, S * 0.029, 0, 0, TAU); c.fill(); }
    if (name === 'Nutmeg') { const x = cx + S * 0.09, y = base - S * 0.34; dot(x, y, S * 0.056, '#ddbc45'); c.strokeStyle = '#b94b3f'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * S * 0.065, y + Math.sin(a) * S * 0.065); c.stroke(); } }
    return true;
  }
  return false;
}

function recheckTree(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f35);
  ground(c, cx, base + 4, S * 0.23);
  if (spec.strictSignature && strictTreeSignature(c, g, p, name)) return;
  const conifer = hasName(name, 'Cedar', 'Pine Nuts', 'Pinyon Pine', 'Redwood', 'Spruce Tips', 'Yew');
  if (conifer) {
    const wide = name === 'Cedar' || name === 'Pine Nuts' || name === 'Pinyon Pine'; const redwood = name === 'Redwood';
    if (spec.pinyonPine) {
      /* Pinyon is a dry-country pine: short, forked and open-crowned, with
         small rounded cones on visible bough tips. It must not inherit the
         cedar's regular single-trunk Christmas-tree silhouette. */
      for (const [dx, lift] of [[-0.045, 0.41], [0.00, 0.51], [0.055, 0.38]] as const) {
        c.strokeStyle = '#765438'; c.lineWidth = S * 0.028; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx + S * dx * 0.34, base); c.quadraticCurveTo(cx + S * dx * 0.56, base - S * lift * 0.48, cx + S * dx, base - S * lift); c.stroke();
      }
      for (const [ox, oy, rx, ry, col] of [[-0.14, 0.30, 0.18, 0.080, '#405b38'], [0.10, 0.32, 0.17, 0.078, '#4e6c43'], [0.00, 0.45, 0.16, 0.086, '#3b5939'], [-0.08, 0.52, 0.11, 0.060, '#55734a'], [0.10, 0.53, 0.10, 0.056, '#4a6942']] as const) {
        c.fillStyle = col; c.beginPath(); c.ellipse(cx + S * ox, base - S * oy, S * rx, S * ry, ox * 0.35, 0, TAU); c.fill();
      }
      for (const [x, y, a] of [[-0.20, 0.31, -2.55], [-0.02, 0.48, -1.82], [0.17, 0.35, -0.48], [0.04, 0.56, -1.12]] as const) {
        recheckLeaf(c, p, cx + S * x, base - S * y, a, S * 0.11, 'needle');
        recheckLeaf(c, p, cx + S * x, base - S * y, a + 0.34, S * 0.095, 'needle');
      }
      for (const [x, y] of [[-0.15, 0.31], [0.15, 0.35], [0.03, 0.47]] as const) {
        const px = cx + S * x, py = base - S * y; recheckCone(c, px, py, S * 0.030, S * 0.060, '#936637');
        c.strokeStyle = '#c59a58'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px - S * 0.018, py); c.quadraticCurveTo(px, py - S * 0.012, px + S * 0.018, py); c.stroke();
      }
      return;
    }
    c.strokeStyle = redwood ? '#87442d' : '#68482e'; c.lineWidth = redwood ? S * 0.070 : S * 0.045; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - S * (redwood ? 0.63 : 0.48)); c.stroke();
    if (redwood) { c.strokeStyle = 'rgba(45,25,18,0.6)'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 6, base); c.quadraticCurveTo(cx + i * 11, base - S * 0.32, cx + i * 5, base - S * 0.64); c.stroke(); } }
    const tiers = redwood ? 8 : 6; for (let t = 0; t < tiers; t++) { const u = t / (tiers - 1), y = base - S * (0.25 + u * (redwood ? 0.52 : 0.36)); const hw = S * ((wide ? 0.25 : 0.16) * (1 - u * 0.66)); c.fillStyle = t % 2 ? '#365b3d' : '#294b34'; c.beginPath(); c.moveTo(cx, y - S * 0.10); c.quadraticCurveTo(cx - hw * 0.7, y - S * 0.04, cx - hw, y + S * 0.035); c.quadraticCurveTo(cx, y + S * 0.015, cx + hw, y + S * 0.035); c.quadraticCurveTo(cx + hw * 0.7, y - S * 0.04, cx, y - S * 0.10); c.fill(); }
    if (spec.pineSeedHarvest) {
      /* Pine Nuts is the harvested kernel, not just another green conifer.
         Keep the tree as the source plant, then make a mature split cone and
         pale winged seeds large enough to read at card size. */
      const bx = cx + S * 0.15, by = base - S * 0.31;
      c.strokeStyle = '#705035'; c.lineWidth = S * 0.018; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx + S * 0.01, by + S * 0.10); c.quadraticCurveTo(cx + S * 0.08, by + S * 0.06, bx, by); c.stroke();
      c.fillStyle = '#7c5630'; c.beginPath(); c.ellipse(bx, by, S * 0.068, S * 0.100, 0.44, 0, TAU); c.fill();
      c.strokeStyle = '#b68a4c'; c.lineWidth = S * 0.010;
      for (let i = -2; i <= 2; i++) { const sy = by + i * S * 0.030; c.beginPath(); c.moveTo(bx - S * 0.052, sy); c.quadraticCurveTo(bx, sy - S * 0.023, bx + S * 0.052, sy); c.stroke(); }
      c.fillStyle = '#ead6a1';
      for (const [dx, dy, a] of [[0.06, 0.12, -0.55], [0.14, 0.10, 0.30], [0.19, 0.15, -0.18]] as const) {
        c.save(); c.translate(cx + S * dx, by + S * dy); c.rotate(a); c.beginPath(); c.ellipse(0, 0, S * 0.018, S * 0.041, 0, 0, TAU); c.fill(); c.strokeStyle = '#9c7643'; c.lineWidth = 1.5; c.stroke(); c.restore();
      }
    }
    if (name === 'Yew') for (let i = 0; i < 12; i++) { c.fillStyle = '#bf3b37'; c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.24, base - S * (0.30 + r() * 0.34), S * 0.013, 0, TAU); c.fill(); }
    if (name === 'Spruce Tips') {
      /* Each tier ends in a few pale spring tips and a hanging cone; without
         them this reads as an interchangeable Christmas-tree silhouette. */
      for (let t = 0; t < 6; t++) { const y = base - S * (0.27 + t * 0.065), span = S * (0.18 - t * 0.020); for (const side of [-1, 1] as const) { c.strokeStyle = '#a8c95b'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + side * span * 0.75, y); c.lineTo(cx + side * span, y - S * 0.018); c.stroke(); } if (t === 1 || t === 3) recheckCone(c, cx + (t & 1 ? -1 : 1) * span * 0.45, y + S * 0.035, S * 0.023, S * 0.050, '#85603a'); }
    }
    return;
  }
  if (spec.strictSignature && name === 'Brazil Nut') {
    /* An emergent Brazil-nut tree is all bole with a high crown — preserve
       that clean vertical negative space and the cannonball capsules. */
    c.strokeStyle = '#8b6b4d'; c.lineWidth = S * 0.095; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - S * 0.67); c.stroke();
    for (let i = 0; i < 7; i++) { const a = -2.9 + i * 0.95; recheckLeaf(c, p, cx + Math.cos(a) * S * 0.13, base - S * 0.68 + Math.sin(a) * S * 0.08, a, S * 0.20, 'broad'); }
    for (let i = 0; i < 4; i++) { const x = cx + (i - 1.5) * S * 0.075, y = base - S * (0.47 + (i & 1) * 0.11); c.fillStyle = '#765b3c'; c.beginPath(); c.arc(x, y, S * 0.045, 0, TAU); c.fill(); c.strokeStyle = '#bd9860'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, S * 0.032, 0, TAU); c.stroke(); }
    return;
  }
  if (spec.strictSignature && name === 'Acorn') {
    c.strokeStyle = '#67503a'; c.lineWidth = S * 0.065; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx - S * 0.07, base - S * 0.30, cx + S * 0.05, base - S * 0.45, cx, base - S * 0.60); c.stroke();
    for (const side of [-1, 1] as const) { c.strokeStyle = '#67503a'; c.lineWidth = S * 0.030; c.beginPath(); c.moveTo(cx, base - S * 0.31); c.quadraticCurveTo(cx + side * S * 0.13, base - S * 0.46, cx + side * S * 0.25, base - S * 0.41); c.stroke(); for (let i = 0; i < 4; i++) { const x = cx + side * S * (0.08 + i * 0.045), y = base - S * (0.35 + (i & 1) * 0.075); for (let q = 0; q < 5; q++) recheckLeaf(c, p, x, y, q / 5 * TAU, S * 0.090, 'crinkle'); c.fillStyle = '#9a6a36'; c.beginPath(); c.ellipse(x, y + S * 0.055, S * 0.025, S * 0.038, 0, 0, TAU); c.fill(); c.strokeStyle = '#6d4d30'; c.lineWidth = 2; c.beginPath(); c.arc(x, y + S * 0.032, S * 0.025, Math.PI, TAU); c.stroke(); } }
    return;
  }
  if (spec.strictSignature && name === 'Walnut') {
    c.strokeStyle = '#66503b'; c.lineWidth = S * 0.072; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx - S * 0.06, base - S * 0.28, cx, base - S * 0.48); c.stroke();
    for (const side of [-1, 1] as const) { c.strokeStyle = '#66503b'; c.lineWidth = S * 0.028; c.beginPath(); c.moveTo(cx, base - S * 0.33); c.quadraticCurveTo(cx + side * S * 0.18, base - S * 0.46, cx + side * S * 0.30, base - S * 0.40); c.stroke(); for (let n = 0; n < 4; n++) { const x = cx + side * S * (0.09 + n * 0.05), y = base - S * (0.34 + n * 0.035); for (const a of [-2.55, -0.60]) recheckLeaf(c, p, x, y, a, S * 0.075, 'pinnate'); if (n & 1) { c.fillStyle = '#77934d'; c.beginPath(); c.arc(x, y + S * 0.06, S * 0.034, 0, TAU); c.fill(); c.fillStyle = '#6d5139'; c.beginPath(); c.arc(x, y + S * 0.06, S * 0.019, 0, TAU); c.fill(); } } }
    return;
  }
  if (spec.strictSignature && hasName(name, 'Carob', 'Camphor Tree')) {
    const carob = name === 'Carob';
    c.strokeStyle = carob ? '#5d4636' : '#726b56'; c.lineWidth = S * 0.060; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx - S * 0.05, base - S * 0.32, cx, base - S * 0.53); c.stroke();
    for (const side of [-1, 1] as const) { c.strokeStyle = '#604a36'; c.lineWidth = S * 0.022; c.beginPath(); c.moveTo(cx, base - S * 0.36); c.lineTo(cx + side * S * 0.24, base - S * 0.44); c.stroke(); for (let n = 0; n < 5; n++) { const x = cx + side * S * (0.06 + n * 0.04), y = base - S * (0.38 + (n & 1) * 0.05); if (carob) { for (const a of [-2.55, -0.60]) recheckLeaf(c, p, x, y, a, S * 0.055, 'broad'); if (n > 1) { c.fillStyle = '#7d5333'; c.beginPath(); c.roundRect(x - S * 0.014, y + S * 0.030, S * 0.028, S * 0.10, S * 0.012); c.fill(); } } else { for (let q = 0; q < 3; q++) recheckLeaf(c, p, x, y, -2.65 + q * 0.55, S * 0.070, 'lance'); } } }
    if (!carob) { c.strokeStyle = 'rgba(62,55,46,0.64)'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 5, base); c.lineTo(cx + i * 4, base - S * 0.52); c.stroke(); } }
    return;
  }
  if (spec.strictSignature && name === 'Cacao') {
    c.strokeStyle = '#6e4a35'; c.lineWidth = S * 0.060; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx - S * 0.04, base - S * 0.30, cx, base - S * 0.55); c.stroke();
    for (const side of [-1, 1] as const) { c.strokeStyle = '#6e4a35'; c.lineWidth = S * 0.025; c.beginPath(); c.moveTo(cx, base - S * 0.26); c.quadraticCurveTo(cx + side * S * 0.14, base - S * 0.39, cx + side * S * 0.24, base - S * 0.34); c.stroke(); for (let i = 0; i < 3; i++) recheckLeaf(c, p, cx + side * S * (0.08 + i * 0.05), base - S * (0.32 + (i & 1) * 0.08), side < 0 ? -2.60 : -0.52, S * 0.15, 'lance'); }
    for (let i = 0; i < 5; i++) { const x = cx + (i - 2) * S * 0.035, y = base - S * (0.18 + (i & 1) * 0.10); c.fillStyle = '#a66a32'; c.beginPath(); c.ellipse(x, y, S * 0.035, S * 0.065, 0.18, 0, TAU); c.fill(); c.strokeStyle = 'rgba(241,194,104,0.60)'; c.lineWidth = 1.4; for (let q = -1; q <= 1; q++) { c.beginPath(); c.moveTo(x + q * S * 0.013, y - S * 0.05); c.lineTo(x + q * S * 0.013, y + S * 0.05); c.stroke(); } }
    return;
  }
  /* a compact trunk/crown painter with strong whole-form differences and
     named harvest accents. */
  const umbrella = name === 'Acacia'; const clump = name === 'Acai'; const dense = hasName(name, 'Apple', 'Bay Laurel', 'Crabapple', 'Mango', 'Pear', 'Rambutan');
  if (clump) { for (let i = -1; i <= 1; i++) { const x = cx + i * S * 0.075; recheckStem(c, x, base, base - S * 0.45 - Math.abs(i) * 8, 10, '#8a8d7a'); for (let j = 0; j < 7; j++) recheckLeaf(c, p, x, base - S * 0.46, -2.8 + j * 0.42, S * 0.18, 'frond'); for (let b = 0; b < 3; b++) { c.fillStyle = '#342544'; c.beginPath(); c.ellipse(x + (b - 1) * 7, base - S * 0.36, 5, 11, 0, 0, TAU); c.fill(); } } return; }
  c.strokeStyle = spec.bark ?? '#725035'; c.lineWidth = S * 0.050; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx - 5, base - S * 0.35, cx + (umbrella ? S * 0.05 : 0), base - S * 0.56); c.stroke();
  const cy = base - S * (umbrella ? 0.60 : 0.49), cw = S * (umbrella ? 0.30 : dense ? 0.25 : 0.20), ch = S * (umbrella ? 0.075 : 0.18);
  c.fillStyle = name === 'Bay Laurel' ? '#294529' : '#3d713c'; c.beginPath(); c.ellipse(cx, cy, cw, ch, 0, 0, TAU); c.fill();
  for (let i = 0; i < (dense ? 30 : 18); i++) { const a = r() * TAU, d = Math.sqrt(r()); recheckLeaf(c, p, cx + Math.cos(a) * cw * d, cy + Math.sin(a) * ch * d, a, S * 0.075, name === 'Bay Laurel' ? 'lance' : spec.leaf); }
  if (name === 'Apple' || name === 'Pear' || name === 'Crabapple') for (let i = 0; i < 7; i++) recheckFlower(c, cx + (r() - 0.5) * cw * 1.55, cy + (r() - 0.5) * ch * 1.5, 5, S * 0.028, '#f1d6dd', '#e8b44e');
  if (name === 'Cashew') { c.fillStyle = '#e2a43d'; c.beginPath(); c.ellipse(cx + S * 0.09, cy + S * 0.12, 12, 18, 0, 0, TAU); c.fill(); c.strokeStyle = '#9c9a92'; c.lineWidth = 5; c.beginPath(); c.arc(cx + S * 0.10, cy + S * 0.18, 12, -0.2, 2.4); c.stroke(); }
  if (name === 'Hazelnut') { for (let i = 0; i < 5; i++) { const x = cx + (i - 2) * S * 0.06; c.strokeStyle = '#745238'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - S * 0.36); c.stroke(); recheckCone(c, x, base - S * 0.32, S * 0.035, S * 0.060, '#9d7a40'); } }
  if (name === 'Date Plum') { c.strokeStyle = '#4a3429'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 7, base); c.lineTo(cx + i * 5, base - S * 0.50); c.stroke(); } for (let i = 0; i < 6; i++) { c.fillStyle = '#d6822c'; c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.19, cy + (r() - 0.5) * S * 0.12, 7, 0, TAU); c.fill(); } }
  if (!spec.strictSignature) return;

  /* GP7.1 fruit/harvest signatures.  The body above remains the compact
     tree painter; only current ledger names receive these card-scale organs. */
  const fruit = spec.fruit;
  if (fruit && fruit !== 'none') {
    const count = fruit === 'cluster' || fruit === 'berry' ? 5 : 4;
    const radius = S * (fruit === 'spiky' || fruit === 'hairy' ? 0.048 : 0.042);
    for (let i = 0; i < count; i++) {
      const a = r() * TAU, d = 0.24 + r() * 0.66;
      drawFruit(c, p, cx + Math.cos(a) * cw * d, cy + Math.sin(a) * ch * d * 0.92, radius, fruit, spec.fhue, r);
    }
  }
  if (hasName(name, 'Apple', 'Apricot', 'Cherry', 'Peach', 'Plum', 'Crabapple', 'Wild Cherry')) {
    /* low, crooked orchard limbs make a fruit tree read as a tree, not a
       lollipop; the blossom sits directly beside the visible fruit. */
    c.strokeStyle = spec.bark ?? '#6b4930'; c.lineWidth = S * 0.020; c.lineCap = 'round';
    for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx, base - S * 0.34); c.quadraticCurveTo(cx + side * S * 0.12, base - S * 0.48, cx + side * S * 0.23, base - S * 0.43); c.stroke(); }
    for (let i = 0; i < 6; i++) recheckFlower(c, cx + (r() - 0.5) * cw * 1.55, cy + (r() - 0.5) * ch * 1.45, 5, S * 0.025, '#f3d7df', '#e5af4b');
  }
  if (hasName(name, 'Cacao', 'Jackfruit', 'Fig', 'Wild Fig')) {
    /* cauliflory: the large fruit erupts from bark/trunk, never floats as a
       dot in the canopy. */
    const trunkFruit: NonNullable<PlantSpec['fruit']> = name === 'Jackfruit' ? 'spiky' : name === 'Cacao' ? 'pod' : 'fig';
    for (let i = 0; i < 3; i++) drawFruit(c, p, cx + (i - 1) * S * 0.042, base - S * (0.20 + i * 0.10), S * (name === 'Jackfruit' ? 0.064 : 0.042), trunkFruit, spec.fhue, r);
  }
  if (name === 'Acorn') {
    for (const [x, y] of [[-0.13, 0.47], [0.14, 0.42], [0.02, 0.33]] as const) {
      const ax = cx + S * x, ay = base - S * y; drawFruit(c, p, ax, ay, S * 0.038, 'nut', '#9b6a36', r);
      c.strokeStyle = '#7c5a35'; c.lineWidth = 2.5; c.beginPath(); c.arc(ax, ay - S * 0.010, S * 0.027, Math.PI, TAU); c.stroke();
    }
  }
  if (hasName(name, 'Birch Sap', 'Maple Sap')) {
    c.strokeStyle = name === 'Birch Sap' ? 'rgba(244,239,217,0.86)' : '#b58b53'; c.lineWidth = S * 0.016;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 7, base - S * 0.05); c.lineTo(cx + i * 5, base - S * 0.54); c.stroke(); }
    if (name === 'Maple Sap') { c.strokeStyle = '#77706a'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx + 4, base - S * 0.27); c.lineTo(cx + S * 0.10, base - S * 0.26); c.stroke(); c.fillStyle = '#8c9aa0'; c.beginPath(); c.ellipse(cx + S * 0.13, base - S * 0.20, S * 0.035, S * 0.047, 0, 0, TAU); c.fill(); }
  }
  if (name === 'Mangrove Leaves') {
    c.strokeStyle = '#6a4934'; c.lineWidth = 7; for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx, base - S * 0.12); c.quadraticCurveTo(cx + side * S * 0.12, base - S * 0.02, cx + side * S * 0.19, base + S * 0.03); c.stroke(); }
    for (let i = -1; i <= 1; i++) { c.fillStyle = '#809a44'; c.beginPath(); c.ellipse(cx + i * S * 0.07, base - S * 0.30, S * 0.018, S * 0.075, i * 0.15, 0, TAU); c.fill(); }
  }
  if (name === 'Olive') {
    c.strokeStyle = '#5b4939'; c.lineWidth = S * 0.030; c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx - S * 0.08, base - S * 0.24, cx + S * 0.08, base - S * 0.42, cx - S * 0.02, base - S * 0.58); c.stroke();
    for (let i = 0; i < 18; i++) recheckLeaf(c, p, cx + (r() - 0.5) * S * 0.32, cy + (r() - 0.5) * S * 0.17, r() * TAU, S * 0.075, 'lance');
  }
  if (name === 'Cinnamon') { c.strokeStyle = 'rgba(239,199,139,0.76)'; c.lineWidth = 3; for (let i = 0; i < 7; i++) { const y = base - S * (0.08 + i * 0.065); c.beginPath(); c.moveTo(cx - S * 0.026, y); c.lineTo(cx + S * 0.026, y - 4); c.stroke(); } }
  if (name === 'Clove') for (let i = 0; i < 7; i++) { const x = cx + (r() - 0.5) * S * 0.28, y = cy + (r() - 0.5) * S * 0.14; c.fillStyle = '#8b4b36'; c.beginPath(); c.ellipse(x, y, S * 0.012, S * 0.029, 0, 0, TAU); c.fill(); }
  if (name === 'Nutmeg') { c.fillStyle = '#e1bc41'; c.beginPath(); c.ellipse(cx + S * 0.09, cy + S * 0.04, S * 0.052, S * 0.060, 0, 0, TAU); c.fill(); c.strokeStyle = '#b54436'; c.lineWidth = 2.6; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(cx + S * 0.09, cy + S * 0.04); c.lineTo(cx + S * 0.09 + Math.cos(a) * S * 0.058, cy + S * 0.04 + Math.sin(a) * S * 0.068); c.stroke(); } }
  if (name === 'Star Anise') {
    for (let i = 0; i < 4; i++) { const x = cx + (r() - 0.5) * S * 0.26, y = cy + (r() - 0.5) * S * 0.14; c.fillStyle = '#6f4a31'; c.beginPath(); for (let q = 0; q < 8; q++) { const a = -Math.PI / 2 + q * TAU / 8, px = x + Math.cos(a) * S * 0.052, py = y + Math.sin(a) * S * 0.052; q ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); }
  }
  if (name === 'Cinnamon') for (let i = 0; i < 11; i++) { const x = cx + (r() - 0.5) * S * 0.30, y = cy + (r() - 0.5) * S * 0.15; for (const a of [-2.62, -Math.PI / 2, -0.52]) recheckLeaf(c, p, x, y, a, S * 0.075, 'lance'); }
  if (name === 'Clove') { c.strokeStyle = '#5f4b38'; c.lineWidth = S * 0.025; c.beginPath(); c.moveTo(cx, base - S * 0.40); c.lineTo(cx, base - S * 0.64); c.stroke(); for (let i = 0; i < 8; i++) recheckLeaf(c, p, cx, base - S * 0.60, -2.6 + i * 0.35, S * 0.14, 'lance'); }
  if (hasName(name, 'Fig', 'Wild Fig')) { for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; recheckLeaf(c, p, cx + Math.cos(a) * S * 0.10, cy + Math.sin(a) * S * 0.10, a, S * 0.14, 'palmate'); } }
  if (hasName(name, 'Date Plum', 'Persimmon')) {
    for (let i = 0; i < 5; i++) { const x = cx + (r() - 0.5) * S * 0.25, y = cy + (r() - 0.5) * S * 0.15; c.fillStyle = '#6e5b37'; for (let q = 0; q < 4; q++) { const a = q / 4 * TAU; c.beginPath(); c.ellipse(x + Math.cos(a) * S * 0.026, y + Math.sin(a) * S * 0.026, S * 0.014, S * 0.026, a, 0, TAU); c.fill(); } }
  }
  if (name === 'Wild Cherry') { c.strokeStyle = '#7b4939'; c.lineWidth = S * 0.018; for (let i = 0; i < 6; i++) { const y = base - S * (0.10 + i * 0.070); c.beginPath(); c.moveTo(cx - S * 0.028, y); c.lineTo(cx + S * 0.028, y); c.stroke(); } for (let i = 0; i < 7; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.25, cy + (r() - 0.5) * S * 0.15, 5, S * 0.020, '#f5e6e2', '#e1ba57'); }
  if (name === 'Jujube') { c.strokeStyle = '#684c36'; c.lineWidth = 2.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx, cy + i * S * 0.035); c.lineTo(cx + (i & 1 ? -1 : 1) * S * 0.18, cy + (i + 1) * S * 0.045); c.stroke(); c.beginPath(); c.moveTo(cx + (i & 1 ? -1 : 1) * S * 0.12, cy + (i + 0.5) * S * 0.04); c.lineTo(cx + (i & 1 ? -1 : 1) * S * 0.16, cy + (i + 0.3) * S * 0.04); c.stroke(); } }
  if (hasName(name, 'Lemon', 'Lime')) { c.strokeStyle = '#7a6040'; c.lineWidth = 2.2; for (let i = 0; i < 8; i++) { const x = cx + (r() - 0.5) * S * 0.30, y = cy + (r() - 0.5) * S * 0.16; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * S * 0.055, y - S * 0.045); c.stroke(); } }
  if (name === 'Orange') for (let i = 0; i < 7; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.25, cy + (r() - 0.5) * S * 0.14, 5, S * 0.020, '#f5f1df', '#e0bc53');
  if (name === 'Guava') { c.strokeStyle = '#a86c4d'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * 5, base); c.lineTo(cx + i * 4, base - S * 0.48); c.stroke(); } }
  if (name === 'Chestnut') for (let i = 0; i < 8; i++) { const x = cx + (r() - 0.5) * S * 0.28, y = cy + (r() - 0.5) * S * 0.15; recheckLeaf(c, p, x, y, r() * TAU, S * 0.11, 'lance', true); c.fillStyle = '#e8d9a5'; c.beginPath(); c.ellipse(x, y - S * 0.08, S * 0.011, S * 0.042, 0, 0, TAU); c.fill(); }
}

function recheckPalm(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f36);
  ground(c, cx, base + 4, S * 0.23);
  const nipa = name === 'Nipa Palm Fruit'; const pandanus = name === 'Pandanus Fruit';
  if (nipa) { recheckWater(c, base - 8); c.fillStyle = 'rgba(83,66,42,0.50)'; c.beginPath(); c.ellipse(cx, base + 3, S * 0.24, S * 0.055, 0, 0, TAU); c.fill(); for (let i = -4; i <= 4; i++) recheckLeaf(c, p, cx, base - 7, -Math.PI / 2 + i * 0.26, S * 0.34, 'frond'); for (let i = 0; i < 28; i++) { const a = r() * TAU, d = Math.sqrt(r()) * S * 0.095; c.fillStyle = i % 3 ? '#8a5c32' : '#a57438'; c.beginPath(); c.arc(cx + Math.cos(a) * d, base - S * 0.11 + Math.sin(a) * d * 0.72, S * 0.024, 0, TAU); c.fill(); } return; }
  if (pandanus) { c.strokeStyle = '#7a5836'; c.lineWidth = 10; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx, base - S * 0.12); c.lineTo(cx + i * S * 0.10, base); c.stroke(); } recheckStem(c, cx, base - S * 0.10, base - S * 0.52, 18, '#775638'); for (let i = 0; i < 18; i++) recheckLeaf(c, p, cx, base - S * 0.52, -Math.PI / 2 + (i - 8.5) * 0.22, S * 0.29, 'blade'); for (let i = 0; i < 30; i++) { const a = r() * TAU, d = Math.sqrt(r()) * S * 0.095; c.fillStyle = i % 2 ? '#d18a2f' : '#e0a23a'; c.beginPath(); c.arc(cx + Math.cos(a) * d, base - S * 0.36 + Math.sin(a) * d, S * 0.027, 0, TAU); c.fill(); } return; }
  if (spec.strictSignature && name === 'Mountain Papaya') {
    /* A mountain papaya is a narrow scarred trunk with small angular fruit
       pressed against it; the broad banana-like bunch was the wrong cue. */
    recheckStem(c, cx, base, base - S * 0.63, S * 0.034, '#7c5a3b');
    c.strokeStyle = 'rgba(233,210,161,0.54)'; c.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = base - S * (0.09 + i * 0.064); c.beginPath(); c.moveTo(cx - S * 0.024, y); c.lineTo(cx + S * 0.024, y - S * 0.010); c.stroke(); }
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.52; recheckLeaf(c, p, cx, base - S * 0.61, a, S * 0.19, 'palmate'); }
    for (const [ox, oy] of [[-0.038, 0.31], [0.040, 0.35], [-0.034, 0.40], [0.038, 0.45], [0, 0.49]] as const) { const x = cx + S * ox, y = base - S * oy; c.fillStyle = '#d5ad3a'; c.beginPath(); for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + q * TAU / 5, px = x + Math.cos(a) * S * 0.032, py = y + Math.sin(a) * S * 0.032; q ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); }
    return;
  }
  const banana = name === 'Banana' || name === 'Plantain'; const papaya = name === 'Papaya' || name === 'Mountain Papaya';
  recheckStem(c, cx, base, base - S * 0.54, banana ? S * 0.055 : S * 0.040, banana ? '#5f963d' : '#795234');
  for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.43; recheckLeaf(c, p, cx, base - S * 0.52, a, S * (banana ? 0.28 : 0.23), papaya ? 'palmate' : banana ? 'broad' : 'frond'); if (banana) { c.strokeStyle = 'rgba(42,83,37,0.55)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, base - S * 0.52); c.lineTo(cx + Math.cos(a) * S * 0.29, base - S * 0.52 + Math.sin(a) * S * 0.29); c.stroke(); } }
  if (name === 'Coconut') { for (let i = 0; i < 4; i++) { c.fillStyle = '#8a653c'; c.beginPath(); c.arc(cx + (i - 1.5) * S * 0.035, base - S * 0.42 + (i % 2) * 8, S * 0.040, 0, TAU); c.fill(); } }
  if (name === 'Date Palm' || name === 'Date') { for (let i = 0; i < 24; i++) { const x = cx + S * 0.06 + (r() - 0.5) * S * 0.10, y = base - S * (0.34 + r() * 0.12); c.fillStyle = '#8a4a26'; c.beginPath(); c.ellipse(x, y, 4, 8, 0.4, 0, TAU); c.fill(); } }
  if (banana) { const green = name === 'Plantain' ? '#7ca13c' : '#d8c03c'; for (let row = 0; row < 3; row++) for (let i = -2; i <= 2; i++) { c.fillStyle = green; c.beginPath(); c.ellipse(cx + S * 0.07 + i * S * 0.020, base - S * (0.38 + row * 0.045), S * 0.010, S * 0.035, 0.4, 0, TAU); c.fill(); } c.fillStyle = '#7b3154'; c.beginPath(); c.moveTo(cx + S * 0.06, base - S * 0.54); c.lineTo(cx + S * 0.09, base - S * 0.46); c.lineTo(cx + S * 0.035, base - S * 0.46); c.closePath(); c.fill(); }
  if (!spec.strictSignature) return;
  if (name === 'Acai') {
    /* Acai is a thin clump, with the identity in its hanging broom-like
       purple fruit sprays rather than a single large berry. */
    for (const ox of [-0.09, 0, 0.09]) { recheckStem(c, cx + S * ox, base, base - S * (0.43 + Math.abs(ox) * 0.35), S * 0.025, '#8e8d74'); }
    for (let i = 0; i < 40; i++) { const x = cx + S * (0.04 + (r() - 0.5) * 0.19), y = base - S * (0.30 + r() * 0.18); c.fillStyle = '#30213f'; c.beginPath(); c.arc(x, y, S * 0.010, 0, TAU); c.fill(); }
  }
  if (name === 'Date Palm') {
    c.strokeStyle = 'rgba(91,59,34,0.68)'; c.lineWidth = 2.6;
    for (let i = 0; i < 8; i++) { const y = base - S * (0.07 + i * 0.055); c.beginPath(); c.moveTo(cx - S * 0.026, y); c.lineTo(cx, y - S * 0.020); c.lineTo(cx + S * 0.026, y); c.stroke(); }
  }
  if (name === 'Papaya' || name === 'Mountain Papaya') {
    for (let i = 0; i < 7; i++) { const y = base - S * (0.20 + i * 0.045); c.strokeStyle = 'rgba(238,218,170,0.44)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - S * 0.024, y); c.lineTo(cx + S * 0.024, y); c.stroke(); }
    for (let i = 0; i < 9; i++) { const x = cx + (i % 2 ? S * 0.045 : -S * 0.040), y = base - S * (0.24 + (i / 9) * 0.24); c.fillStyle = name === 'Mountain Papaya' ? '#d5ad3a' : '#769d3e'; c.beginPath(); c.ellipse(x, y, S * 0.027, S * 0.046, 0.15, 0, TAU); c.fill(); }
  }
}

/* These named shrubs need their own habit at card scale.  A berry or flower
   added to the prior generic vase was not enough for the strict packet reads. */
function strictShrubSignature(c: Ctx, g: G, p: Pal, name: string): boolean {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f77);
  const dot = (x: number, y: number, rad: number, col: string): void => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); };
  const twig = (x: number, y: number, tx: number, ty: number, col = '#6e5039', w = 3): void => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + tx) * 0.5 + (r() - 0.5) * S * 0.04, (y + ty) * 0.5, tx, ty); c.stroke(); };
  const leaf = (x: number, y: number, a: number, len: number, kind: PlantSpec['leaf'] = 'broad', tooth = false): void => recheckLeaf(c, p, x, y, a, len, kind, tooth);

  if (name === 'Arctic Willow') {
    /* Prostrate willow: runners lie on the ground, then carry short, fuzzy
       catkins — intentionally no upright trunk/crown. */
    for (let i = -3; i <= 3; i++) { const x = cx + i * S * 0.075; twig(cx, base, x, base - S * (0.035 + Math.abs(i) * 0.010), '#795a42', 4); leaf(x, base - S * 0.055, i < 0 ? -2.65 : -0.48, S * 0.10, 'lance'); c.fillStyle = '#c8b65e'; c.beginPath(); c.ellipse(x + S * 0.030, base - S * 0.075, S * 0.018, S * 0.050, 0.32, 0, TAU); c.fill(); }
    return true;
  }

  if (name === 'Blackberry' || name === 'Raspberry') {
    const berry = name === 'Blackberry' ? '#392141' : '#cc4d4b';
    for (const side of [-1, 1] as const) { c.strokeStyle = '#70483a'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx + side * S * 0.03, base - S * 0.42, cx + side * S * 0.29, base - S * 0.39, cx + side * S * 0.23, base - S * 0.13); c.stroke(); for (let n = 1; n < 5; n++) { const u = n / 5, x = cx + side * S * (0.03 + u * 0.24), y = base - S * (0.20 + Math.sin(u * Math.PI) * 0.23); c.strokeStyle = '#b49783'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.030, y + S * 0.030); c.stroke(); leaf(x, y, side < 0 ? -2.55 : -0.58, S * 0.10, 'broad', true); if (n > 1) for (let q = 0; q < 7; q++) { const a = q / 7 * TAU; dot(x + Math.cos(a) * S * 0.028, y + S * 0.045 + Math.sin(a) * S * 0.025, S * 0.012, berry); } }
    }
    return true;
  }

  if (hasName(name, 'Blueberry', 'Huckleberry', 'Wild Blueberry')) {
    const low = name === 'Wild Blueberry'; const berry = name === 'Huckleberry' ? '#5b3a6c' : '#4568a7';
    for (let s = -3; s <= 3; s++) { const x = cx + s * S * 0.055, top = base - S * (low ? 0.16 + (s & 1) * 0.035 : 0.30 + (s & 1) * 0.045); twig(cx + s * S * 0.030, base, x, top, '#704b3b', 2.8); for (let n = 0; n < 3; n++) { const y = base - S * (0.08 + n * (low ? 0.045 : 0.075)); leaf(x, y, n & 1 ? -2.68 : -0.48, S * 0.085, 'broad'); if ((n + s) % 2 === 0) { dot(x + S * 0.035, y - S * 0.010, S * 0.025, berry); c.strokeStyle = '#d6d6c8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + S * 0.035, y - S * 0.030); c.lineTo(x + S * 0.035, y + S * 0.006); c.stroke(); } }
      if (!low) { c.fillStyle = '#dbc2d3'; c.beginPath(); c.ellipse(x - S * 0.030, top + S * 0.045, S * 0.027, S * 0.037, 0, 0, TAU); c.fill(); }
    }
    return true;
  }

  if (name === 'Cranberry') {
    c.strokeStyle = '#8b5945'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.28, base); c.bezierCurveTo(cx - S * 0.12, base - S * 0.13, cx + S * 0.10, base - S * 0.10, cx + S * 0.28, base - S * 0.02); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.10, y = base - S * (0.08 + (i & 1) * 0.035); leaf(x, y, i < 0 ? -2.7 : -0.45, S * 0.090, 'broad'); dot(x, y - S * 0.045, S * 0.026, '#b13d4b'); c.strokeStyle = '#d9a5bf'; c.lineWidth = 2.3; for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(x, y - S * 0.10); c.quadraticCurveTo(x + side * S * 0.035, y - S * 0.045, x + side * S * 0.048, y - S * 0.018); c.stroke(); } }
    return true;
  }

  if (name === 'Gooseberry') {
    for (const side of [-1, 1] as const) {
      const ex = cx + side * S * 0.19, ey = base - S * 0.37;
      twig(cx, base, ex, ey, '#72503b', 4);
      for (let n = 0; n < 4; n++) { const x = cx + side * S * (0.05 + n * 0.042), y = base - S * (0.12 + n * 0.065); leaf(x, y, side < 0 ? -2.63 : -0.50, S * 0.10, 'crinkle'); c.strokeStyle = '#d3c4a2'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.060, y - S * 0.022); c.stroke(); }
      const fx = ex - side * S * 0.010, fy = ey + S * 0.12; c.strokeStyle = '#826247'; c.lineWidth = 2; c.beginPath(); c.moveTo(ex, ey + S * 0.03); c.quadraticCurveTo(ex, fy - S * 0.04, fx, fy); c.stroke(); dot(fx, fy, S * 0.042, '#94a84c'); c.strokeStyle = 'rgba(239,232,176,0.78)'; c.lineWidth = 1.4; for (let q = -1; q <= 1; q++) { c.beginPath(); c.moveTo(fx + q * S * 0.022, fy - S * 0.033); c.lineTo(fx + q * S * 0.022, fy + S * 0.033); c.stroke(); }
    }
    return true;
  }

  if (name === 'Currant') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.070, top = base - S * (0.35 + (s & 1) * 0.04); twig(cx, base, x, top, '#72503b', 3.6); for (let n = 0; n < 3; n++) leaf(x, base - S * (0.10 + n * 0.08), n & 1 ? -2.65 : -0.50, S * 0.11, 'crinkle'); }
    for (let q = 0; q < 16; q++) { const x = cx + (r() - 0.5) * S * 0.28, y = base - S * (0.20 + r() * 0.26); dot(x, y, S * 0.020, '#b94448'); c.strokeStyle = '#8e6d4a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - S * 0.045); c.stroke(); }
    return true;
  }

  if (name === 'Elderberry') {
    for (const side of [-1, 1] as const) { twig(cx, base, cx + side * S * 0.17, base - S * 0.44, '#874e4d', 4.5); for (let n = 0; n < 3; n++) leaf(cx + side * S * (0.06 + n * 0.040), base - S * (0.18 + n * 0.08), side < 0 ? -2.65 : -0.50, S * 0.12, 'broad'); }
    for (const side of [-1, 1] as const) { const x = cx + side * S * 0.13, y = base - S * 0.43; for (let i = 0; i < 16; i++) recheckFlower(c, x + (r() - 0.5) * S * 0.13, y + (r() - 0.5) * S * 0.055, 5, S * 0.016, '#f3ead4', '#deb64d'); for (let i = 0; i < 13; i++) dot(x + (r() - 0.5) * S * 0.12, y + S * (0.12 + r() * 0.08), S * 0.014, '#36213d'); }
    return true;
  }

  if (name === 'Beach Plum' || name === 'Serviceberry') {
    const plum = name === 'Beach Plum';
    for (let s = -3; s <= 3; s++) { const x = cx + s * S * 0.055, top = base - S * (0.26 + (s & 1) * 0.04); twig(cx, base, x, top, '#6a4d3a', 3); leaf(x, top + S * 0.08, s & 1 ? -2.6 : -0.54, S * 0.10, 'broad'); for (let q = 0; q < 3; q++) recheckFlower(c, x + (r() - 0.5) * S * 0.050, top + S * 0.02 + q * S * 0.018, plum ? 5 : 5, S * 0.018, '#f4ebdc', '#e0b852'); dot(x + S * 0.026, top + S * 0.11, S * 0.023, plum ? '#57406f' : '#68456e'); if (!plum) { c.strokeStyle = '#e9dfb6'; c.lineWidth = 1.4; c.beginPath(); c.arc(x + S * 0.026, top + S * 0.11, S * 0.018, 0, TAU); c.stroke(); } }
    return true;
  }

  if (name === 'Bog Myrtle' || name === 'Bog Rosemary' || name === 'Labrador Tea') {
    const pink = name === 'Bog Rosemary'; const tea = name === 'Labrador Tea';
    for (let s = -3; s <= 3; s++) { const x = cx + s * S * 0.050, top = base - S * (0.27 + (s & 1) * 0.035); twig(cx, base, x, top, '#895442', 2.8); for (let n = 0; n < 3; n++) { const y = base - S * (0.09 + n * 0.060); leaf(x, y, n & 1 ? -2.65 : -0.48, S * 0.085, 'broad'); if (tea) { c.strokeStyle = '#9b5e45'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - S * 0.03, y + S * 0.025); c.lineTo(x + S * 0.03, y + S * 0.025); c.stroke(); } }
      if (name === 'Bog Myrtle') { c.fillStyle = '#cf9448'; c.beginPath(); c.ellipse(x, top, S * 0.017, S * 0.045, 0.1, 0, TAU); c.fill(); }
      else { for (let q = 0; q < (tea ? 7 : 3); q++) recheckFlower(c, x + (r() - 0.5) * S * 0.07, top + (r() - 0.5) * S * 0.045, tea ? 5 : 5, S * (tea ? 0.020 : 0.026), pink ? '#d5a0b8' : '#f4efe1', '#e8c968'); }
    }
    return true;
  }

  if (name === 'Mormon Tea') {
    for (let s = -5; s <= 5; s++) { const x = cx + s * S * 0.040, top = base - S * (0.31 - Math.abs(s) * 0.014); twig(cx, base, x, top, '#728642', 4); for (let j = 1; j < 4; j++) { const y = base - S * (0.07 + j * 0.065); dot(x, y, S * 0.014, '#8e9f52'); c.strokeStyle = '#e3d2a3'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - S * 0.022, y); c.lineTo(x + S * 0.022, y); c.stroke(); } }
    return true;
  }

  if (name === 'Sea Buckthorn') {
    for (const side of [-1, 1] as const) { twig(cx, base, cx + side * S * 0.20, base - S * 0.37, '#664838', 4); for (let n = 0; n < 5; n++) { const x = cx + side * S * (0.045 + n * 0.034), y = base - S * (0.12 + n * 0.052); leaf(x, y, side < 0 ? -2.68 : -0.48, S * 0.070, 'lance'); c.strokeStyle = '#d3d0aa'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.055, y - S * 0.020); c.stroke(); dot(x + side * S * 0.025, y + S * 0.020, S * 0.022, '#df7b24'); } }
    return true;
  }

  if (name === 'Tamarisk') {
    /* Tamarisk is a wide, feathery pink salt-bush, not a second upright
       sea-kale rosette.  The long arching sprays deliberately occupy a broad
       crown at card scale; opaque flower clusters keep the cue legible. */
    c.strokeStyle = '#8a624d'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - S * 0.22); c.stroke();
    for (let s = -4; s <= 4; s++) {
      const endX = cx + s * S * 0.070, top = base - S * (0.31 + (4 - Math.abs(s)) * 0.030);
      c.strokeStyle = '#8f674d'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(cx, base - S * 0.13); c.quadraticCurveTo(cx + s * S * 0.035, base - S * 0.35, endX, top); c.stroke();
      for (let n = 0; n < 5; n++) {
        const t = n / 4, x = cx + (endX - cx) * t, y = (base - S * 0.13) + (top - (base - S * 0.13)) * t;
        for (const side of [-1, 1] as const) {
          c.strokeStyle = '#718b67'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.052, y - S * 0.026); c.stroke();
        }
      }
    }
    for (let q = 0; q < 86; q++) {
      const x = cx + (r() - 0.5) * S * 0.58, y = base - S * (0.29 + r() * 0.26);
      c.fillStyle = q % 4 ? '#e994b2' : '#fac9d8'; c.beginPath(); c.ellipse(x, y, S * 0.020, S * 0.013, r() * TAU, 0, TAU); c.fill();
    }
    return true;
  }

  if (name === 'Castor Bean') {
    for (let s = -1; s <= 1; s++) { const x = cx + s * S * 0.075; twig(cx, base, x, base - S * (0.44 + (s & 1) * 0.04), '#ad554c', 5); for (let n = 0; n < 3; n++) { const y = base - S * (0.14 + n * 0.10); for (let q = 0; q < 8; q++) leaf(x, y, q / 8 * TAU, S * 0.16, 'palmate'); } }
    c.strokeStyle = '#a43e43'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, base - S * 0.26); c.lineTo(cx, base - S * 0.56); c.stroke(); for (let q = 0; q < 10; q++) { const y = base - S * (0.34 + q * 0.023); dot(cx + (r() - 0.5) * S * 0.05, y, S * 0.020, '#bd4a4c'); }
    return true;
  }

  if (name === 'Roselle') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.055, top = base - S * (0.43 + (s & 1) * 0.04); twig(cx, base, x, top, '#b54b46', 5); for (let n = 0; n < 3; n++) { const y = base - S * (0.14 + n * 0.09); for (let q = 0; q < 5; q++) leaf(x, y, q / 5 * TAU, S * 0.11, 'palmate'); c.fillStyle = '#bd3946'; c.beginPath(); c.ellipse(x + S * 0.035, y - S * 0.018, S * 0.030, S * 0.052, 0.2, 0, TAU); c.fill(); } }
    return true;
  }

  if (name === 'Pigeon Pea') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.055, top = base - S * (0.38 + (s & 1) * 0.04); twig(cx, base, x, top, '#715542', 3.5); for (let n = 0; n < 3; n++) { const y = base - S * (0.12 + n * 0.085); for (const a of [-2.55, -Math.PI / 2, -0.58]) leaf(x, y, a, S * 0.070, 'trefoil'); } recheckFlower(c, x, top, 5, S * 0.030, '#e1c13e', '#b54948'); c.strokeStyle = '#7c8643'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, top + S * 0.05); c.quadraticCurveTo(x + S * 0.05, top + S * 0.08, x + S * 0.08, top + S * 0.11); c.stroke(); }
    return true;
  }

  if (name === 'Calotropis') {
    for (const side of [-1, 1] as const) { twig(cx, base, cx + side * S * 0.14, base - S * 0.37, '#78845e', 4); for (let n = 0; n < 3; n++) { const x = cx + side * S * (0.05 + n * 0.035), y = base - S * (0.14 + n * 0.075); leaf(x, y, side < 0 ? -2.62 : -0.52, S * 0.15, 'broad'); } }
    for (let i = 0; i < 10; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.20, base - S * (0.39 + r() * 0.08), 5, S * 0.026, '#f0e9dc', '#83578d'); c.fillStyle = '#a7bc88'; c.beginPath(); c.ellipse(cx + S * 0.14, base - S * 0.23, S * 0.055, S * 0.12, 0.42, 0, TAU); c.fill();
    return true;
  }

  if (name === 'Chokecherry') {
    twig(cx, base, cx - S * 0.18, base - S * 0.42, '#6e4c3c', 4); twig(cx, base, cx + S * 0.16, base - S * 0.36, '#6e4c3c', 4);
    for (const side of [-1, 1] as const) {
      const x = cx + side * S * 0.15, y = base - S * (side < 0 ? 0.39 : 0.33);
      leaf(x, y, side < 0 ? -2.65 : -0.52, S * 0.12, 'lance');
      /* A long pale bottlebrush hangs below its bough.  The prior dark upright
         spikes were visually closer to cattails than chokecherry blossom. */
      c.strokeStyle = '#806051'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + side * S * 0.03, y + S * 0.11, x + side * S * 0.045, y + S * 0.25); c.stroke();
      for (let q = 0; q < 10; q++) { const py = y + S * (0.055 + q * 0.018), px = x + side * S * (0.020 + (q & 1) * 0.010); recheckFlower(c, px, py, 5, S * 0.013, '#f3eee2', '#e0c35d'); if (q > 6) dot(px + side * S * 0.022, py + S * 0.040, S * 0.014, '#4b2434'); }
    }
    return true;
  }

  if (name === 'Cliff Rose') {
    for (let s = -4; s <= 4; s++) { const x = cx + s * S * 0.042, top = base - S * (0.21 + (s & 1) * 0.04); twig(cx, base, x, top, '#88735b', 2.5); for (let n = 0; n < 3; n++) { const y = base - S * (0.07 + n * 0.045); for (let q = -1; q <= 1; q++) leaf(x, y, q * 0.42 - Math.PI / 2, S * 0.055, 'crinkle'); } if ((s & 1) === 0) recheckFlower(c, x, top, 5, S * 0.034, '#f5ecd9', '#deb74e'); for (let q = 0; q < 4; q++) { c.strokeStyle = 'rgba(225,224,204,0.78)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, top + S * 0.06); c.lineTo(x + (q - 1.5) * S * 0.027, top + S * 0.13); c.stroke(); } }
    return true;
  }

  if (name === 'Cloudberry') {
    /* One short cane with a single amber aggregate berry; a dense green mound
       hides the cloudberry's very sparse, bog-running habit at card scale. */
    twig(cx, base, cx, base - S * 0.31, '#6c4a39', 3.5);
    for (const side of [-1, 1] as const) { const x = cx + side * S * 0.075, y = base - S * 0.14; twig(cx, base - S * 0.18, x, y, '#6c4a39', 2); for (let q = 0; q < 5; q++) leaf(x, y, side < 0 ? -2.62 + q * 0.11 : -0.52 - q * 0.11, S * 0.080, 'crinkle'); }
    recheckFlower(c, cx, base - S * 0.34, 5, S * 0.036, '#f6f2df', '#e1c45d');
    for (let q = 0; q < 12; q++) { const a = q / 12 * TAU; dot(cx + Math.cos(a) * S * 0.035, base - S * 0.25 + Math.sin(a) * S * 0.031, S * 0.016, '#e3a43d'); }
    return true;
  }

  if (name === 'Coastal Sage') {
    /* Dusty, low and puckered: a soft grey mound with separated lavender rings,
       not a level stack of generic shrub leaves. */
    c.fillStyle = '#9eaa94'; c.beginPath(); c.ellipse(cx, base - S * 0.035, S * 0.26, S * 0.105, 0, 0, TAU); c.fill();
    for (let i = 0; i < 30; i++) { const x = cx + (r() - 0.5) * S * 0.42, y = base - S * (0.045 + r() * 0.15); c.fillStyle = i % 3 ? '#aab49d' : '#c2c8b3'; c.beginPath(); c.ellipse(x, y, S * 0.032, S * 0.018, r() * TAU, 0, TAU); c.fill(); c.strokeStyle = 'rgba(87,109,80,0.56)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x - S * 0.020, y); c.lineTo(x + S * 0.020, y); c.stroke(); }
    for (const x of [cx - S * 0.11, cx, cx + S * 0.11]) for (let q = 0; q < 6; q++) { const a = q / 6 * TAU; dot(x + Math.cos(a) * S * 0.030, base - S * 0.23 + Math.sin(a) * S * 0.030, S * 0.012, '#b487c4'); }
    return true;
  }

  if (name === 'Sagebrush') {
    twig(cx, base, cx - S * 0.035, base - S * 0.34, '#705945', 7);
    for (const side of [-1, 1] as const) for (let row = 0; row < 4; row++) { const sx = cx + side * S * 0.010, sy = base - S * (0.12 + row * 0.060), ex = cx + side * S * (0.10 + (row & 1) * 0.075), ey = sy - S * 0.045; twig(sx, sy, ex, ey, '#705945', 2.8); for (let n = 0; n < 3; n++) { const x = sx + (ex - sx) * (0.32 + n * 0.20), y = sy + (ey - sy) * (0.32 + n * 0.20); c.fillStyle = '#b8bcaa'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.065, y - S * 0.020); c.lineTo(x + side * S * 0.040, y + S * 0.030); c.closePath(); c.fill(); } }
    return true;
  }

  if (name === 'Oleander') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.060, top = base - S * (0.42 + (s & 1) * 0.05); twig(x, base, x, top, '#69513b', 4); for (let n = 0; n < 3; n++) { const y = base - S * (0.16 + n * 0.085); for (let q = 0; q < 3; q++) leaf(x, y, -Math.PI / 2 + (q - 1) * 1.05, S * 0.12, 'lance'); } for (let f = 0; f < 2; f++) recheckFlower(c, x + (f ? S * 0.026 : -S * 0.026), top + f * S * 0.040, 5, S * 0.034, '#dc7aa0', '#eac55e'); }
    return true;
  }

  if (hasName(name, 'Coastal Sage', 'Desert Sage', 'Sagebrush', 'Saltbush', 'Lavender', 'Rosemary', 'Sage', 'Heather', 'Oleander')) {
    const sagebrush = name === 'Sagebrush'; const lavender = name === 'Lavender'; const oleander = name === 'Oleander'; const rosemary = name === 'Rosemary'; const heather = name === 'Heather';
    for (let s = -4; s <= 4; s++) { const x = cx + s * S * 0.043, top = base - S * (0.18 + (s & 1) * 0.07); twig(cx, base, x, top, sagebrush ? '#74604b' : '#6e513d', rosemary ? 2.6 : 3.3); for (let n = 0; n < 4; n++) { const y = base - S * (0.06 + n * 0.045); leaf(x, y, n & 1 ? -2.60 : -0.53, S * (oleander ? 0.13 : 0.075), rosemary || heather || sagebrush ? 'needle' : 'broad', name === 'Sage'); }
      if (lavender) for (let q = 0; q < 6; q++) dot(x, top + q * S * 0.018, S * 0.011, '#a36abd');
      else if (name === 'Desert Sage') for (let q = 0; q < 4; q++) recheckFlower(c, x + (r() - 0.5) * S * 0.04, top + q * S * 0.023, 5, S * 0.018, '#7f70c0', '#e3c76b');
      else if (heather) for (let q = 0; q < 4; q++) { c.fillStyle = '#ad70bb'; c.beginPath(); c.ellipse(x, top + q * S * 0.026, S * 0.013, S * 0.024, 0, 0, TAU); c.fill(); }
      else if (oleander) recheckFlower(c, x, top, 5, S * 0.032, '#dc7aa0', '#eac55e');
      else if (name === 'Saltbush') { c.fillStyle = '#d7d0aa'; c.beginPath(); c.moveTo(x, top + S * 0.03); c.lineTo(x + S * 0.050, top + S * 0.07); c.lineTo(x, top + S * 0.10); c.closePath(); c.fill(); }
    }
    return true;
  }

  if (name === 'Coffee') {
    for (const side of [-1, 1] as const) { twig(cx, base, cx + side * S * 0.18, base - S * 0.43, '#654a39', 4); for (let n = 0; n < 4; n++) { const x = cx + side * S * (0.04 + n * 0.04), y = base - S * (0.15 + n * 0.07); leaf(x, y, side < 0 ? -2.62 : -0.52, S * 0.13, 'broad'); c.strokeStyle = '#b2c889'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - S * 0.045, y); c.lineTo(x + S * 0.045, y); c.stroke(); dot(x + side * S * 0.026, y - S * 0.025, S * 0.021, '#bc3e35'); } }
    return true;
  }

  if (name === 'Creosote Bush') {
    for (let s = -4; s <= 4; s++) { const x = cx + s * S * 0.045, top = base - S * (0.25 + (s & 1) * 0.035); twig(cx, base, x, top, '#76523e', 2.6); for (let n = 0; n < 3; n++) { const y = base - S * (0.08 + n * 0.06); leaf(x, y, -2.40, S * 0.055, 'broad'); leaf(x, y, -0.74, S * 0.055, 'broad'); } if ((s & 1) === 0) { dot(x, top, S * 0.025, '#e6e3cf'); c.strokeStyle = 'rgba(255,255,248,0.80)'; c.lineWidth = 1.2; for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; c.beginPath(); c.moveTo(x, top); c.lineTo(x + Math.cos(a) * S * 0.040, top + Math.sin(a) * S * 0.040); c.stroke(); } } }
    return true;
  }

  if (name === 'Tea' || name === 'Wild Guava' || name === 'Yerba Mate') {
    const guava = name === 'Wild Guava'; const mate = name === 'Yerba Mate';
    for (let s = -3; s <= 3; s++) { const x = cx + s * S * 0.052, top = base - S * (0.32 + (s & 1) * 0.035); twig(cx, base, x, top, guava ? '#9b6b51' : '#6c4b38', 3.4); for (let n = 0; n < 4; n++) { const y = base - S * (0.10 + n * 0.060); leaf(x, y, n & 1 ? -2.65 : -0.48, S * 0.095, 'broad', true); if (guava) { c.strokeStyle = 'rgba(212,220,163,0.75)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - S * 0.04, y); c.lineTo(x + S * 0.04, y); c.stroke(); } }
      if (name === 'Tea') { recheckFlower(c, x, top, 5, S * 0.018, '#f4f0df', '#e3bc55'); leaf(x, top - S * 0.02, -1.2, S * 0.075, 'broad', true); leaf(x, top - S * 0.02, -1.9, S * 0.075, 'broad', true); }
      else if (mate) {
        /* Yerba mate's soft-toothed holly leaves carry pale flower clusters;
           a red berry dot alone made it read as a generic stacked shrub. */
        for (let q = 0; q < 5; q++) recheckFlower(c, x + (q - 2) * S * 0.014, top + S * 0.042, 5, S * 0.012, '#f0eee2', '#d9c55d');
        if (s & 1) dot(x + S * 0.025, top + S * 0.092, S * 0.018, '#bf3d43');
      } else {
        const fx = x + S * 0.025, fy = top + S * 0.055; dot(fx, fy, S * 0.028, '#a9b052');
        c.strokeStyle = '#ded281'; c.lineWidth = 1.2; for (let q = 0; q < 4; q++) { const a = -Math.PI / 2 + q * TAU / 4; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(a) * S * 0.024, fy + Math.sin(a) * S * 0.024); c.stroke(); }
      }
    }
    return true;
  }

  if (name === 'Tea Tree') {
    for (let s = -4; s <= 4; s++) { const x = cx + s * S * 0.040, top = base - S * (0.34 - Math.abs(s) * 0.012); twig(cx, base, x, top, '#e6d9bd', 3); for (let n = 0; n < 4; n++) { const y = base - S * (0.09 + n * 0.060); leaf(x, y, n & 1 ? -2.65 : -0.48, S * 0.065, 'needle'); } for (let q = 0; q < 10; q++) { const a = q / 10 * TAU; c.strokeStyle = '#f5f0df'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, top); c.lineTo(x + Math.cos(a) * S * 0.048, top + Math.sin(a) * S * 0.048); c.stroke(); } }
    return true;
  }

  if (name === 'Chili Pepper') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.065, top = base - S * (0.33 + (s & 1) * 0.035); twig(cx, base, x, top, '#557b43', 3.6); for (let n = 0; n < 3; n++) leaf(x, base - S * (0.11 + n * 0.07), n & 1 ? -2.65 : -0.50, S * 0.11, 'lance'); const py = top + S * 0.10; c.fillStyle = '#cf3a2d'; c.beginPath(); c.moveTo(x, py); c.quadraticCurveTo(x + S * 0.042, py + S * 0.045, x, py + S * 0.105); c.quadraticCurveTo(x - S * 0.018, py + S * 0.045, x, py); c.fill(); recheckFlower(c, x + S * 0.040, top, 5, S * 0.018, '#f4f2df', '#3f3541'); }
    return true;
  }

  if (name === 'Bay Laurel') {
    for (let row = 0; row < 5; row++) { const y = base - S * (0.16 + row * 0.080), half = S * (0.20 - row * 0.025); c.strokeStyle = '#5c4b36'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, base - S * 0.06); c.lineTo(cx, y); c.stroke(); for (const side of [-1, 1] as const) { const x = cx + side * half; leaf(x, y, side < 0 ? -2.68 : -0.48, S * 0.12, 'lance'); if (row > 1) for (let q = 0; q < 2; q++) recheckFlower(c, x + side * q * S * 0.025, y + S * 0.025, 5, S * 0.013, '#f2ead8', '#dfc25a'); } }
    for (let q = 0; q < 5; q++) dot(cx + (r() - 0.5) * S * 0.22, base - S * (0.22 + r() * 0.23), S * 0.016, '#2d2933');
    return true;
  }

  if (name === 'Hazelnut') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.060, top = base - S * (0.36 + (s & 1) * 0.04); twig(cx, base, x, top, '#6f5037', 4); for (let n = 0; n < 3; n++) leaf(x, base - S * (0.12 + n * 0.080), n & 1 ? -2.65 : -0.50, S * 0.12, 'heart'); c.fillStyle = '#bca04e'; c.beginPath(); c.ellipse(x - S * 0.020, top + S * 0.050, S * 0.014, S * 0.075, 0.1, 0, TAU); c.fill(); c.fillStyle = '#88a34b'; c.beginPath(); c.moveTo(x + S * 0.025, top + S * 0.11); c.lineTo(x + S * 0.070, top + S * 0.075); c.lineTo(x + S * 0.085, top + S * 0.13); c.lineTo(x + S * 0.035, top + S * 0.16); c.closePath(); c.fill(); dot(x + S * 0.052, top + S * 0.12, S * 0.022, '#8a6337'); }
    return true;
  }
  if (name === 'Samphire') {
    for (let i = -5; i <= 5; i++) { const x = cx + i * S * 0.035, top = base - S * (0.18 - Math.abs(i) * 0.008); c.strokeStyle = '#6fa47a'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(x, base - S * 0.08, x, top); c.stroke(); for (let n = 1; n < 3; n++) { c.strokeStyle = '#95bf88'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - S * 0.018, base - S * n * 0.058); c.lineTo(x + S * 0.018, base - S * n * 0.058); c.stroke(); } }
    return true;
  }
  if (name === 'Sea Purslane') {
    c.strokeStyle = '#a25c54'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.28, base); c.bezierCurveTo(cx - S * 0.10, base - S * 0.10, cx + S * 0.06, base - S * 0.08, cx + S * 0.28, base - S * 0.03); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.10, y = base - S * (0.055 + (i & 1) * 0.035); c.fillStyle = '#83ab91'; c.beginPath(); c.ellipse(x - S * 0.030, y, S * 0.055, S * 0.035, -0.24, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + S * 0.030, y, S * 0.055, S * 0.035, 0.24, 0, TAU); c.fill(); recheckFlower(c, x, y - S * 0.065, 5, S * 0.022, '#d893b6', '#ebcd78'); }
    return true;
  }
  return false;
}

function recheckShrub(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f37);
  ground(c, cx, base + 4, S * 0.24);
  if (spec.strictSignature && strictShrubSignature(c, g, p, name)) return;
  const low = hasName(name, 'Heather', 'Sagebrush', 'Thyme', 'Rosemary', 'Coastal Sage', 'Desert Sage', 'Sea Fennel', 'Samphire', 'Sea Purslane', 'Wormwood');
  const h = low ? S * 0.25 : S * 0.42;
  for (let s = 0; s < 12; s++) { const x = cx + (r() - 0.5) * S * (low ? 0.34 : 0.24), y = base - (low ? r() * S * 0.07 : 0); const tx = cx + (r() - 0.5) * S * (low ? 0.32 : 0.22), ty = base - h * (0.68 + r() * 0.35); recheckStem(c, x, y, ty, low ? 3.5 : 4.5, '#72543a'); for (let i = 0; i < 4; i++) recheckLeaf(c, p, x + (tx - x) * (i / 4), y + (ty - y) * (i / 4), i % 2 ? -2.5 : -0.55, S * (low ? 0.10 : 0.13), name === 'Heather' || name === 'Rosemary' || name === 'Sagebrush' ? 'needle' : 'broad', hasName(name, 'Sage', 'Nettle', 'Rainforest Nettle')); }
  if (name === 'Heather' || name === 'Lavender' || name === 'Oleander') for (let i = 0; i < 16; i++) { const x = cx + (r() - 0.5) * S * 0.28, y = base - S * (0.20 + r() * 0.30); recheckFlower(c, x, y, name === 'Oleander' ? 5 : 4, S * 0.027, name === 'Oleander' ? '#dc7aa0' : '#b479c5', '#eac54c'); }
  if (name === 'Sagebrush' || name === 'Creosote Bush' || name === 'Rabbitbrush') for (let i = 0; i < 22; i++) { const x = cx + (r() - 0.5) * S * 0.29, y = base - S * (0.18 + r() * 0.27); recheckFlower(c, x, y, name === 'Rabbitbrush' ? 12 : 5, S * 0.020, name === 'Rabbitbrush' ? '#d5b134' : '#e0c53a', '#754c26'); }
  if (name === 'Calotropis' || name === 'Milkweed') { for (let i = -1; i <= 1; i++) { const x = cx + i * S * 0.08; recheckLeaf(c, p, x, base - S * 0.34, i ? 2.8 : 0.2, S * 0.19, 'broad'); } c.fillStyle = '#9eb687'; c.beginPath(); c.ellipse(cx + S * 0.10, base - S * 0.28, S * 0.075, S * 0.042, 0.45, 0, TAU); c.fill(); }
  if (name === 'Bay Laurel') { /* tree focus handles its crown; keep future calls harmless */ }
  if (!spec.strictSignature) return;

  const fruit = spec.fruit;
  if (fruit && fruit !== 'none') {
    const count = fruit === 'cluster' || fruit === 'berry' ? 5 : 3;
    for (let i = 0; i < count; i++) drawFruit(c, p, cx + (r() - 0.5) * S * 0.28, base - S * (0.16 + r() * 0.34), S * 0.035, fruit, spec.fhue, r);
  }
  if (hasName(name, 'Blackberry', 'Raspberry')) {
    /* Arching prickly canes and visibly aggregate berries, not a leafy vase. */
    c.strokeStyle = '#724a39'; c.lineWidth = 5; c.lineCap = 'round';
    for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx + side * S * 0.04, base - S * 0.40, cx + side * S * 0.28, base - S * 0.34, cx + side * S * 0.20, base - S * 0.18); c.stroke(); }
    for (let i = 0; i < 32; i++) { const x = cx + (r() - 0.5) * S * 0.34, y = base - S * (0.14 + r() * 0.34); c.fillStyle = name === 'Blackberry' ? '#38213c' : '#c84447'; c.beginPath(); c.arc(x, y, S * 0.013, 0, TAU); c.fill(); }
  }
  if (hasName(name, 'Blueberry', 'Cranberry', 'Huckleberry', 'Wild Blueberry', 'Gooseberry', 'Currant')) {
    for (let i = 0; i < 6; i++) { const x = cx + (r() - 0.5) * S * 0.30, y = base - S * (0.18 + r() * 0.30); berryUrn(c, x, y, S * 0.040); groundBerry(c, x + S * 0.018, y + S * 0.065, S * 0.022, spec.fhue ?? '#4569a3', 'bloom'); }
  }
  if (name === 'Elderberry') {
    for (const x of [cx - S * 0.10, cx + S * 0.10]) { for (let i = 0; i < 15; i++) recheckFlower(c, x + (r() - 0.5) * S * 0.10, base - S * (0.38 + r() * 0.12), 5, S * 0.016, '#f2e8cf', '#d9b34c'); }
    for (let i = 0; i < 20; i++) { c.fillStyle = '#34213e'; c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.26, base - S * (0.18 + r() * 0.22), S * 0.012, 0, TAU); c.fill(); }
  }
  if (name === 'Arctic Willow') {
    c.strokeStyle = '#6d523e'; c.lineWidth = 5; for (let i = -3; i <= 3; i++) { const x = cx + i * S * 0.055; c.beginPath(); c.moveTo(cx, base + 2); c.quadraticCurveTo(x, base - S * 0.10, x + S * 0.06, base - S * 0.07); c.stroke(); c.fillStyle = '#bda84e'; c.beginPath(); c.ellipse(x + S * 0.06, base - S * 0.08, S * 0.014, S * 0.038, 0.2, 0, TAU); c.fill(); }
  }
  if (name === 'Sea Buckthorn') {
    c.strokeStyle = '#694b37'; c.lineWidth = 3; for (let i = 0; i < 20; i++) { const x = cx + (r() - 0.5) * S * 0.32, y = base - S * (0.12 + r() * 0.34); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * S * 0.06, y - S * 0.04); c.stroke(); c.fillStyle = '#db7a24'; c.beginPath(); c.arc(x, y, S * 0.017, 0, TAU); c.fill(); }
  }
  if (name === 'Mormon Tea') { c.strokeStyle = '#738a42'; c.lineWidth = 5; for (let i = -4; i <= 4; i++) { const x = cx + i * S * 0.035; c.beginPath(); c.moveTo(cx, base); c.lineTo(x, base - S * (0.28 + Math.abs(i) * 0.025)); c.stroke(); for (let j = 1; j < 4; j++) { const y = base - S * (0.08 + j * 0.07); c.strokeStyle = '#d6c697'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.stroke(); } } }
  if (name === 'Tamarisk') for (let i = 0; i < 32; i++) { const x = cx + (r() - 0.5) * S * 0.32, y = base - S * (0.26 + r() * 0.24); c.fillStyle = 'rgba(231,151,180,0.78)'; c.beginPath(); c.arc(x, y, S * 0.012, 0, TAU); c.fill(); }
  if (name === 'Castor Bean') for (let i = 0; i < 8; i++) recheckLeaf(c, p, cx, base - S * 0.15, i / 8 * TAU, S * 0.20, 'palmate');
  if (name === 'Roselle') { c.strokeStyle = '#aa4941'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - S * 0.55); c.stroke(); for (let i = 0; i < 5; i++) { const y = base - S * (0.18 + i * 0.075); recheckCone(c, cx + (i % 2 ? 1 : -1) * S * 0.050, y, S * 0.025, S * 0.070, '#bd3946'); } }
  if (name === 'Chili Pepper') for (let i = 0; i < 5; i++) { const x = cx + (r() - 0.5) * S * 0.25, y = base - S * (0.20 + r() * 0.28); c.fillStyle = '#cf3a2d'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + S * 0.045, y + S * 0.035, x, y + S * 0.080); c.quadraticCurveTo(x - S * 0.018, y + S * 0.035, x, y); c.fill(); }
}

/* Named GP7.1 herbs get whole-plant silhouettes rather than a generic
   ladder of leaves with a diagnostic dot painted over it.  This is deliberately
   opt-in through strictSignature at the call site: nearby catalogue controls
   keep their prior painter. */
function strictHerbSignature(c: Ctx, g: G, p: Pal, name: string): boolean {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f78);
  const dot = (x: number, y: number, rad: number, col: string): void => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill(); };
  const stem = (x: number, y: number, top: number, col: string, w = 3.5): void => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * S * 0.025, (y + top) * 0.5, x + (r() - 0.5) * S * 0.035, top); c.stroke(); };
  const littleLeaf = (x: number, y: number, a: number, len: number, kind: PlantSpec['leaf'] = 'broad', serr = false): void => recheckLeaf(c, p, x, y, a, len, kind, serr);

  if (name === 'Alfalfa' || name === 'Fenugreek') {
    if (name === 'Fenugreek') {
      /* Fenugreek is taller and airier than clover-like alfalfa: pale pea
         flowers over unmistakable long, beaked sickle pods. */
      for (let s = -1; s <= 1; s++) { const x = cx + s * S * 0.085, top = base - S * (0.43 + (s & 1) * 0.04); stem(x, base, top, '#6f8145', 3.2); for (let n = 0; n < 3; n++) { const y = base - S * (0.14 + n * 0.085); for (const a of [-2.60, -Math.PI / 2, -0.54]) littleLeaf(x, y, a, S * 0.068, 'trefoil'); recheckFlower(c, x + S * 0.020, y - S * 0.045, 5, S * 0.022, '#f0e4c5', '#d4bc5a'); } c.strokeStyle = '#a7a04e'; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, top + S * 0.07); c.bezierCurveTo(x + S * 0.12, top + S * 0.08, x + S * 0.13, top + S * 0.18, x + S * 0.035, top + S * 0.20); c.stroke(); }
      return true;
    }
    /* Low pea-family crowns: recognizable three-leaflets, racemes, and a
       conspicuous curling/sickle pod rather than a stacked foliage tower. */
    for (let s = -2; s <= 2; s++) {
      const x = cx + s * S * 0.068, top = base - S * (0.30 + (s & 1) * 0.07);
      stem(x, base, top, '#5a7540', 3.2);
      for (let n = 0; n < 3; n++) {
        const y = base - S * (0.10 + n * 0.075);
        for (const a of [-2.65, -Math.PI / 2, -0.50]) littleLeaf(x, y, a, S * 0.070, 'trefoil');
      }
      for (let b = 0; b < 3; b++) recheckFlower(c, x + (b - 1) * S * 0.020, top + b * S * 0.036, 5, S * 0.026, name === 'Alfalfa' ? '#9a70b9' : '#f1ead1', '#e1c968');
    }
    c.strokeStyle = '#92783e'; c.lineWidth = 3; c.lineCap = 'round';
    for (const side of [-1, 1] as const) { c.beginPath(); c.arc(cx + side * S * 0.16, base - S * 0.19, S * 0.068, side < 0 ? -0.55 : -2.6, side < 0 ? 2.25 : 0.55); c.stroke(); }
    return true;
  }

  if (name === 'Alpine Mint') {
    /* A close alpine cushion with short square stems.  Its old narrow comb had
       the colour of mint but not the compact wind-pruned habit. */
    c.fillStyle = '#6f8a62'; c.beginPath(); c.ellipse(cx, base - S * 0.035, S * 0.25, S * 0.105, 0, 0, TAU); c.fill();
    for (let i = -4; i <= 4; i++) { const x = cx + i * S * 0.047, top = base - S * (0.16 + (i & 1) * 0.030); c.strokeStyle = '#55734d'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, base - S * 0.03); c.lineTo(x, top); c.stroke(); for (const side of [-1, 1] as const) littleLeaf(x, base - S * 0.10, side < 0 ? -2.65 : -0.50, S * 0.070, 'broad', true); for (let q = 0; q < 5; q++) dot(x + (q - 2) * S * 0.011, top + (q & 1) * S * 0.012, S * 0.010, '#b579c9'); }
    return true;
  }

  if (hasName(name, 'Alpine Mint', 'Desert Mint', 'Mountain Mint', 'Mountain Thyme', 'Water Mint', 'Wild Mint', 'Mint', 'Oregano', 'Thyme')) {
    if (name === 'Mountain Thyme') {
      /* A grey-green, ground-hugging woody mat; do not share alpine mint's
         upright whorled silhouette. */
      c.fillStyle = '#6d7e5c'; c.beginPath(); c.ellipse(cx, base - S * 0.025, S * 0.25, S * 0.095, 0, 0, TAU); c.fill();
      for (let i = 0; i < 30; i++) { const x = cx + (r() - 0.5) * S * 0.42, y = base - S * (0.035 + r() * 0.13); c.strokeStyle = '#715747'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - S * 0.018, y + S * 0.016); c.lineTo(x + S * 0.020, y - S * 0.020); c.stroke(); c.fillStyle = '#91a06f'; c.beginPath(); c.ellipse(x, y, S * 0.017, S * 0.010, 0, 0, TAU); c.fill(); if (i % 3 === 0) dot(x, y - S * 0.026, S * 0.009, '#b678c2'); }
      return true;
    }
    const creeping = hasName(name, 'Alpine Mint', 'Mountain Thyme', 'Thyme');
    const tall = hasName(name, 'Water Mint', 'Wild Mint', 'Mint', 'Oregano');
    const stems = creeping ? 5 : 3;
    for (let s = 0; s < stems; s++) {
      const x = cx + (s - (stems - 1) * 0.5) * S * (creeping ? 0.075 : 0.095);
      const top = base - S * (tall ? 0.48 + (s & 1) * 0.045 : creeping ? 0.22 + (s & 1) * 0.03 : 0.34 + (s & 1) * 0.04);
      stem(x, base, top, hasName(name, 'Oregano', 'Desert Mint') ? '#8b5453' : '#4d7548', 4);
      for (let n = 0; n < (creeping ? 3 : 4); n++) {
        const y = base - S * (0.08 + n * (tall ? 0.080 : 0.064));
        littleLeaf(x, y, -2.72, S * (creeping ? 0.070 : 0.090), 'broad', true);
        littleLeaf(x, y, -0.42, S * (creeping ? 0.070 : 0.090), 'broad', true);
        if (name === 'Wild Mint') for (let q = 0; q < 5; q++) dot(x + (q - 2) * S * 0.014, y - S * 0.021, S * 0.010, '#bf7dce');
      }
      if (name === 'Water Mint' && s === 1) {
        /* one terminal lilac pompom, rather than one hoop per stem */
        for (let q = 0; q < 24; q++) { const a = q / 24 * TAU, d = q < 12 ? S * 0.050 : S * 0.025; dot(cx + Math.cos(a) * d, top + Math.sin(a) * d, S * 0.016, q % 3 ? '#b97acb' : '#d5a6dc'); }
      } else if (name === 'Oregano') {
        for (let q = 0; q < 9; q++) recheckFlower(c, x + (r() - 0.5) * S * 0.13, top + (r() - 0.5) * S * 0.06, 5, S * 0.016, '#d59ab9', '#f0d480');
      } else if (name === 'Mountain Mint') {
        c.fillStyle = '#bec9ad'; c.beginPath(); c.ellipse(x, top + S * 0.035, S * 0.064, S * 0.031, 0, 0, TAU); c.fill();
        for (let q = 0; q < 5; q++) dot(x + (q - 2) * S * 0.016, top, S * 0.009, '#f0eee0');
      } else {
        for (let q = 0; q < (creeping ? 4 : 6); q++) dot(x + (q - 2.5) * S * 0.014, top + q * S * 0.010, S * 0.010, name === 'Desert Mint' ? '#c184cc' : '#b57ac9');
      }
    }
    return true;
  }

  if (name === 'Anise' || name === 'Water Hemlock') {
    const top = base - S * 0.58;
    stem(cx, base, top, name === 'Water Hemlock' ? '#70464d' : '#6b884b', 5);
    if (name === 'Water Hemlock') { c.strokeStyle = '#93606a'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const y = base - S * (0.12 + i * 0.085); c.beginPath(); c.moveTo(cx - S * 0.025, y); c.lineTo(cx + S * 0.025, y + S * 0.015); c.stroke(); } drawRoot(c, cx, base, 'forked'); }
    for (let i = 0; i < 4; i++) {
      const y = base - S * (0.14 + i * 0.075);
      if (name === 'Anise' && i < 2) for (const a of [-2.55, -0.60]) littleLeaf(cx, y, a, S * 0.15, 'heart');
      else for (let f = -2; f <= 2; f++) { c.strokeStyle = '#6a8c52'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx + f * S * 0.040, y - S * 0.060); c.stroke(); }
    }
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, ux = cx + Math.cos(a) * S * 0.16, uy = top + Math.sin(a) * S * 0.10; c.strokeStyle = '#708c58'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, top + S * 0.02); c.lineTo(ux, uy); c.stroke(); dot(ux, uy, S * 0.012, '#f7f3dc'); }
    return true;
  }

  if (hasName(name, 'Nettle', 'Rainforest Nettle', 'Riverbank Nettle')) {
    const rainforest = name === 'Rainforest Nettle';
    const riverbank = name === 'Riverbank Nettle';
    if (rainforest) {
      /* Dendrocnide is a soft wooded understorey shrub, not a scaled-up
         upright nettle.  Keep its handful of giant, pale heart leaves and
         hair haze separated enough for the stinging-tree read at card size. */
      c.strokeStyle = '#697a4c'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx - S * 0.018, base - S * 0.33); c.stroke();
      for (const [dx, y, a] of [[-0.012, 0.34, -2.68], [0.010, 0.43, -0.47], [-0.006, 0.53, -2.34], [0.006, 0.61, -0.82]] as const) {
        littleLeaf(cx + dx * S, base - y * S, a, S * 0.265, 'heart', true);
      }
      c.strokeStyle = 'rgba(207,229,164,0.76)'; c.lineWidth = 1.1;
      for (let h = 0; h < 28; h++) {
        const y = base - S * (0.12 + (h % 7) * 0.075), side = h & 1 ? 1 : -1;
        c.beginPath(); c.moveTo(cx + side * S * (0.018 + (h % 3) * 0.012), y); c.lineTo(cx + side * S * (0.048 + (h % 4) * 0.010), y - S * 0.030); c.stroke();
      }
      for (const [x, y] of [[-0.13, 0.31], [0.15, 0.41], [-0.10, 0.49]] as const) { dot(cx + x * S, base - y * S, S * 0.025, '#d8dfae'); dot(cx + x * S + S * 0.010, base - y * S - S * 0.008, S * 0.012, '#eef0c9'); }
      return true;
    }

    /* Keep the square stem exposed between sparse paired leaves.  The
       riverbank form is a wider two-stem clump with more obvious, longer
       tassels; ordinary nettle remains the single, straight-stem herb. */
    const count = riverbank ? 2 : 1;
    for (let s = 0; s < count; s++) {
      const x = cx + (s - (count - 1) * 0.5) * S * (riverbank ? 0.20 : 0), top = base - S * (riverbank ? 0.55 - s * 0.025 : 0.53);
      c.strokeStyle = '#526d3f'; c.lineWidth = 5; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x, base); c.lineTo(x, top); c.stroke();
      for (let n = 0; n < 3; n++) {
        const y = base - S * (0.15 + n * 0.115), len = S * (riverbank ? 0.130 : 0.160);
        c.strokeStyle = '#91a969'; c.lineWidth = 2.25; c.beginPath(); c.moveTo(x - S * 0.026, y); c.lineTo(x + S * 0.026, y); c.stroke();
        littleLeaf(x, y, -2.68, len, 'heart', true); littleLeaf(x, y, -0.47, len, 'heart', true);
        for (const side of [-1, 1] as const) {
          c.strokeStyle = 'rgba(205,227,148,0.88)'; c.lineWidth = 1.15;
          for (let h = 0; h < 4; h++) { const hy = y - S * (0.008 + h * 0.014); c.beginPath(); c.moveTo(x + side * S * 0.035, hy); c.lineTo(x + side * S * 0.070, hy - S * 0.037); c.stroke(); }
        }
        if (n > 0) {
          const side = riverbank ? (s === 0 ? -1 : 1) : (n & 1 ? 1 : -1), tassel = riverbank ? 0.125 : 0.095;
          c.strokeStyle = '#82a34e'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + side * S * 0.020, y); c.quadraticCurveTo(x + side * S * 0.060, y + S * tassel * 0.48, x + side * S * 0.070, y + S * tassel); c.stroke();
          for (let q = 0; q < 6; q++) dot(x + side * S * (0.028 + q * 0.008), y + S * (0.023 + q * tassel / 7), S * 0.010, '#8eaa53');
        }
      }
    }
    return true;
  }

  if (name === 'Belladonna') {
    for (const side of [-1, 1] as const) { c.strokeStyle = '#4c5b3d'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + side * S * 0.03, base - S * 0.28, cx + side * S * 0.14, base - S * 0.48); c.stroke(); for (let n = 0; n < 3; n++) littleLeaf(cx + side * S * (0.04 + n * 0.035), base - S * (0.20 + n * 0.075), side < 0 ? -2.65 : -0.48, S * 0.12, 'broad'); }
    for (const side of [-1, 1] as const) { const x = cx + side * S * 0.12, y = base - S * 0.30; c.fillStyle = '#4a6338'; c.beginPath(); for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + q * TAU / 5, px = x + Math.cos(a) * S * 0.050, py = y + Math.sin(a) * S * 0.050; q ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); dot(x, y, S * 0.030, '#241d2b'); recheckFlower(c, x - side * S * 0.055, y - S * 0.10, 5, S * 0.032, '#6a4c82', '#d9c55c'); }
    return true;
  }

  if (name === 'Chicory') {
    for (const side of [-1, 1] as const) { c.strokeStyle = '#6f6040'; c.lineWidth = 2.8; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + side * S * 0.025, base - S * 0.26, cx + side * S * 0.16, base - S * 0.54); c.stroke(); const x = cx + side * S * 0.16, y = base - S * 0.54; for (let q = 0; q < 18; q++) { const a = q / 18 * TAU; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#6f8ed7'; c.fillRect(S * 0.020, -S * 0.012, S * 0.060, S * 0.024); c.restore(); } dot(x, y, S * 0.027, '#c8ad45'); }
    return true;
  }

  if (name === 'Flax') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.055, top = base - S * (0.46 + (s & 1) * 0.055); stem(x, base, top, '#7e8752', 2.4); for (let n = 0; n < 4; n++) littleLeaf(x, base - S * (0.13 + n * 0.070), n & 1 ? -2.55 : -0.58, S * 0.075, 'lance'); recheckFlower(c, x + (s & 1 ? -1 : 1) * S * 0.034, top, 5, S * 0.040, '#77a8dd', '#e6d567'); dot(x, top + S * 0.080, S * 0.020, '#9d8252'); }
    return true;
  }

  if (name === 'Licorice Root') {
    for (let s = -1; s <= 1; s++) { const x = cx + s * S * 0.075, top = base - S * (0.42 + (s & 1) * 0.04); stem(x, base, top, '#76583c', 3.2); for (let n = 0; n < 4; n++) { const y = base - S * (0.12 + n * 0.075); for (const a of [-2.65, -0.50]) littleLeaf(x, y, a, S * 0.075, 'pinnate'); } recheckFlower(c, x, top, 5, S * 0.030, '#9e7bbe', '#efd37a'); }
    c.strokeStyle = '#d4ad54'; c.lineWidth = 7; c.lineCap = 'round'; for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx + side * S * 0.04, base + S * 0.03, cx + side * S * 0.10, base + S * 0.08, cx + side * S * 0.14, base + S * 0.14); c.stroke(); }
    return true;
  }

  if (name === 'Milkweed') {
    stem(cx, base, base - S * 0.50, '#5f7446', 5);
    for (let n = 0; n < 4; n++) { const y = base - S * (0.14 + n * 0.085); littleLeaf(cx, y, -2.70, S * 0.15, 'broad'); littleLeaf(cx, y, -0.45, S * 0.15, 'broad'); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; recheckFlower(c, cx + Math.cos(a) * S * 0.10, base - S * 0.43 + Math.sin(a) * S * 0.070, 5, S * 0.020, '#c589a0', '#f1d99b'); }
    c.fillStyle = '#8cac67'; c.beginPath(); c.ellipse(cx + S * 0.13, base - S * 0.25, S * 0.055, S * 0.11, 0.42, 0, TAU); c.fill(); c.strokeStyle = 'rgba(242,243,220,0.86)'; c.lineWidth = 1.5; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(cx + S * 0.15, base - S * 0.21); c.lineTo(cx + S * (0.18 + (r() - 0.5) * 0.10), base - S * (0.17 + r() * 0.10)); c.stroke(); }
    return true;
  }

  if (name === 'Mugwort' || name === 'Wormwood') {
    const grey = name === 'Wormwood' ? '#b8b9a1' : '#a9b7a3';
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.055, top = base - S * (0.43 + (s & 1) * 0.045); stem(x, base, top, '#9b5c51', 3); for (let n = 0; n < 5; n++) { const y = base - S * (0.10 + n * 0.065); for (let q = -2; q <= 2; q++) { c.strokeStyle = grey; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + q * S * 0.035, y - S * 0.045); c.stroke(); } } for (let q = 0; q < 4; q++) dot(x + (r() - 0.5) * S * 0.040, top + q * S * 0.026, S * 0.013, '#aa9d57'); }
    return true;
  }

  if (name === 'Sea Lavender' || name === 'Marsh Rosemary') {
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; littleLeaf(cx + Math.cos(a) * S * 0.06, base - S * 0.035 + Math.sin(a) * S * 0.035, a, S * 0.13, 'broad'); }
    for (let s = -3; s <= 3; s++) { const x = cx + s * S * 0.045, top = base - S * (0.34 + Math.abs(s) * 0.018); stem(x, base - S * 0.02, top, '#9a7659', 2); for (let q = 0; q < 4; q++) recheckFlower(c, x + (r() - 0.5) * S * 0.05, top + q * S * 0.026, 5, S * 0.015, '#9aaadd', '#e9d77e'); }
    return true;
  }

  if (name === 'Sea Rocket') {
    c.strokeStyle = '#ad7657'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.25, base); c.lineTo(cx - S * 0.10, base - S * 0.06); c.lineTo(cx + S * 0.04, base); c.lineTo(cx + S * 0.22, base - S * 0.04); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.080, y = base - S * (0.06 + (i & 1) * 0.055); for (const a of [-2.7, -0.45]) littleLeaf(x, y, a, S * 0.10, 'crinkle'); recheckFlower(c, x, y - S * 0.07, 4, S * 0.027, '#c98ac4', '#e0c758'); c.strokeStyle = '#809348'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + S * 0.06, y + S * 0.025); c.stroke(); }
    return true;
  }

  if (name === 'Sesame' || name === 'Wild Sesame') {
    const wild = name === 'Wild Sesame'; const top = base - S * 0.56;
    stem(cx, base, top, wild ? '#805850' : '#5e8649', 5);
    for (let n = 0; n < 5; n++) { const y = base - S * (0.13 + n * 0.080); littleLeaf(cx, y, -2.70, S * (wild ? 0.15 : 0.12), wild ? 'crinkle' : 'broad'); littleLeaf(cx, y, -0.45, S * (wild ? 0.15 : 0.12), wild ? 'crinkle' : 'broad'); }
    for (let q = 0; q < 5; q++) { const x = cx + (wild ? S * 0.075 : (q & 1 ? S * 0.050 : -S * 0.050)), y = base - S * (0.28 + q * 0.055); recheckFlower(c, x, y, 5, S * 0.026, '#cd8eb9', '#ead283'); c.fillStyle = '#8b7450'; c.beginPath(); c.roundRect(x - S * 0.016, y + S * 0.040, S * 0.032, S * 0.065, S * 0.010); c.fill(); c.strokeStyle = '#d0b67a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y + S * 0.045); c.lineTo(x, y + S * 0.097); c.stroke(); }
    return true;
  }

  if (name === 'Chamomile') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.060, top = base - S * (0.34 + (s & 1) * 0.07); stem(x, base, top, '#69804d', 2.6); for (let n = 0; n < 3; n++) for (let q = -2; q <= 2; q++) { c.strokeStyle = '#6d8b55'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, base - S * (0.10 + n * 0.070)); c.lineTo(x + q * S * 0.030, base - S * (0.14 + n * 0.070)); c.stroke(); } recheckFlower(c, x, top, 18, S * 0.030, '#f3f0d9', '#d0a73e'); }
    return true;
  }

  if (name === 'Echinacea') {
    stem(cx, base, base - S * 0.55, '#527344', 4); for (let n = 0; n < 4; n++) littleLeaf(cx, base - S * (0.11 + n * 0.08), n & 1 ? -2.65 : -0.50, S * 0.11, 'lance');
    const y = base - S * 0.57; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.save(); c.translate(cx, y); c.rotate(a); c.fillStyle = '#b375ba'; c.beginPath(); c.ellipse(S * 0.070, S * 0.010, S * 0.070, S * 0.020, 0, 0, TAU); c.fill(); c.restore(); } dot(cx, y, S * 0.065, '#9d6c2d'); c.strokeStyle = '#d9a33c'; c.lineWidth = 1.4; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; c.beginPath(); c.moveTo(cx + Math.cos(a) * S * 0.015, y + Math.sin(a) * S * 0.015); c.lineTo(cx + Math.cos(a) * S * 0.062, y + Math.sin(a) * S * 0.062); c.stroke(); }
    return true;
  }

  if (name === 'Ginseng') {
    stem(cx, base, base - S * 0.42, '#8c704e', 4); for (let i = 0; i < 5; i++) littleLeaf(cx, base - S * 0.42, i / 5 * TAU - Math.PI / 2, S * 0.16, 'palmate'); for (let i = 0; i < 9; i++) dot(cx + (r() - 0.5) * S * 0.11, base - S * 0.44 + (r() - 0.5) * S * 0.09, S * 0.014, '#c44345'); drawRoot(c, cx, base, 'forked');
    return true;
  }

  if (name === 'Mustard') {
    stem(cx, base, base - S * 0.54, '#70884b', 4); for (let n = 0; n < 4; n++) { const y = base - S * (0.13 + n * 0.085); littleLeaf(cx, y, -2.65, S * 0.15, n < 2 ? 'crinkle' : 'lance'); littleLeaf(cx, y, -0.48, S * 0.12, n < 2 ? 'crinkle' : 'lance'); }
    for (let q = 0; q < 6; q++) { const x = cx + (q & 1 ? S * 0.07 : -S * 0.07), y = base - S * (0.30 + q * 0.044); recheckFlower(c, x, y, 4, S * 0.030, '#e5c432', '#785229'); c.strokeStyle = '#7d8740'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y + S * 0.024); c.lineTo(x + (q & 1 ? S * 0.10 : -S * 0.10), y + S * 0.055); c.stroke(); }
    return true;
  }

  if (name === 'Valerian') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.050, top = base - S * (0.52 + (s & 1) * 0.03); stem(x, base, top, '#6b8750', 3); for (let n = 0; n < 3; n++) littleLeaf(x, base - S * (0.14 + n * 0.090), n & 1 ? -2.62 : -0.52, S * 0.105, 'lance'); }
    for (let q = 0; q < 34; q++) recheckFlower(c, cx + (r() - 0.5) * S * 0.23, base - S * (0.51 + r() * 0.07), 5, S * 0.017, '#e4b6c7', '#efd681');
    return true;
  }

  if (name === 'Cardamom') {
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.045; stem(x, base, base - S * (0.48 + (s & 1) * 0.04), '#577542', 4); for (let n = 0; n < 4; n++) littleLeaf(x, base - S * (0.16 + n * 0.070), n & 1 ? -2.65 : -0.48, S * 0.15, 'lance'); }
    c.strokeStyle = '#8a6443'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + S * 0.09, base - S * 0.04, cx + S * 0.15, base - S * 0.02); c.stroke(); for (let i = 0; i < 6; i++) { const x = cx + S * (0.06 + i * 0.022), y = base - S * (0.02 + (i & 1) * 0.026); c.fillStyle = '#809752'; c.beginPath(); c.ellipse(x, y, S * 0.020, S * 0.035, 0.25, 0, TAU); c.fill(); } recheckFlower(c, cx + S * 0.17, base - S * 0.05, 5, S * 0.028, '#f0e6d5', '#9a6397');
    return true;
  }
  return false;
}

function recheckHerb(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f38);
  ground(c, cx, base + 4, S * 0.23);
  if (spec.strictSignature && strictHerbSignature(c, g, p, name)) return;
  const mint = hasName(name, 'Alpine Mint', 'Desert Mint', 'Holy Basil', 'Mountain Mint', 'Water Mint');
  const nettle = hasName(name, 'Nettle', 'Rainforest Nettle', 'Riverbank Nettle');
  const rosette = hasName(name, 'Alpine Sorrel', 'Arctic Sorrel', 'Mountain Sorrel', 'Sorrel', 'Marsh Rosemary', 'Wood Sorrel', 'Wild Ginger');
  if (rosette) { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; recheckStem(c, cx, base - 7, base - S * 0.09 + Math.sin(a) * 11, 2.5, '#a65a46'); recheckLeaf(c, p, cx + Math.cos(a) * 8, base - S * 0.09 + Math.sin(a) * 11, a, S * 0.15, hasName(name, 'Sorrel', 'Arctic Sorrel') ? 'arrow' : name === 'Wood Sorrel' ? 'trefoil' : 'heart'); } recheckStem(c, cx, base - 8, base - S * 0.38, 3.5, '#a14e45'); for (let i = 0; i < 8; i++) { c.fillStyle = '#c45d65'; c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.10, base - S * (0.29 + r() * 0.12), 4, 0, TAU); c.fill(); } if (spec.strictSignature && name === 'Marsh Rosemary') { for (let i = 0; i < 24; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.28, base - S * (0.34 + r() * 0.14), 5, S * 0.018, '#9ab0da', '#e5cf62'); } return; }
  const stems = mint || nettle ? 6 : 4;
  for (let s = 0; s < stems; s++) { const x = cx + (s - (stems - 1) / 2) * S * 0.052; recheckStem(c, x, base, base - S * (0.46 + r() * 0.08), mint ? 5 : 4, mint ? '#805150' : '#557741'); for (let i = 0; i < 5; i++) { const y = base - S * (0.12 + i * 0.065); recheckLeaf(c, p, x, y, i % 2 ? -2.65 : -0.48, S * 0.12, name === 'Angelica' || name === 'Fennel' || name === 'Yarrow' ? 'pinnate' : name === 'Alfalfa' || name === 'Fenugreek' ? 'trefoil' : name === 'Ginseng' ? 'palmate' : 'broad', mint || nettle); if (mint) { c.fillStyle = '#bf87cf'; c.beginPath(); c.arc(x, y - 7, 4, 0, TAU); c.fill(); } } }
  if (name === 'Alfalfa' || name === 'Fenugreek') { c.strokeStyle = '#92783e'; c.lineWidth = 2; c.beginPath(); c.arc(cx + S * 0.12, base - S * 0.22, S * 0.05, -0.6, 5.5); c.stroke(); }
  if (name === 'Angelica' || name === 'Fennel' || name === 'Yarrow' || name === 'Water Hemlock') { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.strokeStyle = '#719350'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, base - S * 0.50); c.lineTo(cx + Math.cos(a) * S * 0.12, base - S * 0.50 + Math.sin(a) * S * 0.08); c.stroke(); c.fillStyle = '#f0edcf'; c.beginPath(); c.arc(cx + Math.cos(a) * S * 0.12, base - S * 0.50 + Math.sin(a) * S * 0.08, 3.3, 0, TAU); c.fill(); } }
  if (name === 'Ginger' || name === 'African Ginger' || name === 'Cardamom' || name === 'Turmeric') { c.fillStyle = name === 'Turmeric' ? '#d78f27' : '#d1b078'; c.beginPath(); c.ellipse(cx, base + S * 0.02, S * 0.12, S * 0.045, 0, 0, TAU); c.fill(); recheckCone(c, cx + S * 0.07, base - S * 0.04, S * 0.055, S * 0.12, name === 'African Ginger' ? '#bd7197' : '#c38c45'); }
  if (name === 'Black Pepper') { c.strokeStyle = '#7d6950'; c.lineWidth = 9; c.beginPath(); c.moveTo(cx - S * 0.18, base); c.quadraticCurveTo(cx + S * 0.05, base - S * 0.36, cx + S * 0.18, base - S * 0.66); c.stroke(); for (let i = 0; i < 7; i++) recheckLeaf(c, p, cx - S * 0.10 + i * S * 0.04, base - S * (0.10 + i * 0.07), i % 2 ? -2.4 : -0.65, S * 0.13, 'heart'); for (let i = 0; i < 12; i++) { c.fillStyle = '#27362a'; c.beginPath(); c.arc(cx + S * 0.12, base - S * (0.34 + i * 0.018), 4, 0, TAU); c.fill(); } }
  if (!spec.strictSignature) return;

  /* The generic herbs above supply a readable body.  These ledger-only marks
     place each diagnostic harvest/inflorescence where a player can see it. */
  if (hasName(name, 'Alfalfa', 'Fenugreek', 'Pigeon Pea')) {
    for (let i = 0; i < 6; i++) { const x = cx + (r() - 0.5) * S * 0.26, y = base - S * (0.24 + r() * 0.30); recheckFlower(c, x, y, 5, S * 0.030, '#9a70b9', '#e7cf77'); drawFruit(c, p, x + S * 0.042, y + S * 0.040, S * 0.026, 'pod', '#8b7135', r); }
  }
  if (hasName(name, 'Anise', 'Fennel', 'Water Hemlock')) {
    const stemCol = name === 'Water Hemlock' ? '#70464d' : '#698049';
    c.strokeStyle = stemCol; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - S * 0.56); c.stroke();
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; const x = cx + Math.cos(a) * S * 0.15, y = base - S * 0.55 + Math.sin(a) * S * 0.10; c.strokeStyle = '#68864e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, base - S * 0.55); c.lineTo(x, y); c.stroke(); c.fillStyle = '#f5f0d8'; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); }
  }
  if (hasName(name, 'Nettle', 'Rainforest Nettle', 'Riverbank Nettle')) {
    c.strokeStyle = 'rgba(157,184,102,0.78)'; c.lineWidth = 2; for (let i = 0; i < 20; i++) { const x = cx + (r() - 0.5) * S * 0.26, y = base - S * (0.22 + r() * 0.31); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * S * 0.035, y + S * 0.075); c.stroke(); }
  }
  if (hasName(name, 'Ginseng', 'Licorice Root')) {
    if (name === 'Ginseng') { for (let i = 0; i < 5; i++) recheckLeaf(c, p, cx, base - S * 0.42, i / 5 * TAU, S * 0.16, 'palmate'); for (let i = 0; i < 8; i++) { c.fillStyle = '#bd4143'; c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.09, base - S * 0.42 + (r() - 0.5) * S * 0.08, S * 0.015, 0, TAU); c.fill(); } drawRoot(c, cx, base, 'forked'); }
    else drawRoot(c, cx, base, 'taproot');
  }
  if (name === 'Cardamom') { for (let i = 0; i < 5; i++) { const x = cx + (i - 2) * S * 0.045; c.fillStyle = '#8a9f4f'; c.beginPath(); c.ellipse(x, base - S * 0.02, S * 0.023, S * 0.040, 0.2, 0, TAU); c.fill(); } }
  if (name === 'Flax') { for (let i = 0; i < 5; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.16, base - S * (0.26 + r() * 0.28), 5, S * 0.035, '#79a5dc', '#e6cf5e'); }
  if (name === 'Mustard') { for (let i = 0; i < 6; i++) { const x = cx + (r() - 0.5) * S * 0.19, y = base - S * (0.26 + r() * 0.26); recheckFlower(c, x, y, 4, S * 0.030, '#e5c432', '#765124'); c.strokeStyle = '#8a8041'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y + 5); c.lineTo(x + S * 0.07, y + S * 0.03); c.stroke(); } }
  if (name === 'Oregano') { for (let i = 0; i < 24; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.30, base - S * (0.38 + r() * 0.15), 5, S * 0.018, '#cb94b3', '#e7cf78'); }
  if (name === 'Chamomile') { for (let i = 0; i < 7; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.25, base - S * (0.28 + r() * 0.24), 16, S * 0.027, '#f5f1dc', '#d7b238'); }
  if (name === 'Valerian') { for (let i = 0; i < 24; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.24, base - S * (0.49 + r() * 0.09), 5, S * 0.021, '#e2b3c6', '#e4cf75'); }
}

function recheckRoot(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.79, r = rngF(g, name, 0x7f39);
  ground(c, cx, base + S * 0.09, S * 0.23);
  if (spec.strictSignature && name === 'Arrowroot') {
    for (let i = -1; i <= 1; i++) { const x = cx + i * S * 0.075; c.strokeStyle = '#6c8547'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, base); c.lineTo(x, base - S * (0.30 + Math.abs(i) * 0.04)); c.stroke(); recheckLeaf(c, p, x, base - S * (0.30 + Math.abs(i) * 0.04), i * 0.24 - Math.PI / 2, S * 0.20, 'broad'); recheckFlower(c, x, base - S * (0.37 + Math.abs(i) * 0.03), 3, S * 0.024, '#f5f3e4', '#e0bd46'); }
    c.fillStyle = '#cda86e'; for (let i = -3; i <= 3; i++) { const x = cx + i * S * 0.052; c.beginPath(); c.ellipse(x, base + S * 0.065, S * 0.055, S * 0.038, 0, 0, TAU); c.fill(); c.strokeStyle = '#9d7643'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, base + S * 0.065, S * 0.024, 0, TAU); c.stroke(); }
    return;
  }
  if (spec.strictSignature && name === 'Taro') {
    for (const side of [-1, 0, 1] as const) { const x = cx + side * S * 0.095, y = base - S * (0.30 + Math.abs(side) * 0.03); c.strokeStyle = '#7c934f'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, base); c.lineTo(x, y + S * 0.035); c.stroke(); c.fillStyle = '#52765e'; c.beginPath(); c.moveTo(x, y + S * 0.13); c.quadraticCurveTo(x - S * 0.14, y + S * 0.02, x, y - S * 0.16); c.quadraticCurveTo(x + S * 0.14, y + S * 0.02, x, y + S * 0.13); c.fill(); c.strokeStyle = 'rgba(211,224,177,0.50)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y + S * 0.035); c.lineTo(x, y - S * 0.12); c.stroke(); }
    c.fillStyle = '#815431'; c.beginPath(); c.ellipse(cx, base + S * 0.075, S * 0.12, S * 0.065, 0, 0, TAU); c.fill(); c.strokeStyle = '#c7985c'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const y = base + S * (0.035 + i * 0.024); c.beginPath(); c.arc(cx, y, S * 0.09, 0, TAU); c.stroke(); }
    return;
  }
  if (spec.strictSignature && name === 'Sea Beet') {
    for (let i = -4; i <= 4; i++) { const a = -Math.PI / 2 + i * 0.26, x = cx + Math.cos(a) * S * 0.12, y = base - S * 0.07 + Math.sin(a) * S * 0.08; c.strokeStyle = '#b54b4c'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx, base); c.lineTo(x, y); c.stroke(); recheckLeaf(c, p, x, y, a, S * 0.16, 'arrow'); }
    for (const side of [-1, 1] as const) { c.strokeStyle = '#9b6f53'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + side * S * 0.04, base - S * 0.03); c.quadraticCurveTo(cx + side * S * 0.14, base - S * 0.12, cx + side * S * 0.23, base - S * 0.10); c.stroke(); }
    return;
  }
  if (spec.strictSignature && name === 'Sea Fennel') {
    for (let i = -4; i <= 4; i++) { const x = cx + i * S * 0.045, y = base - S * (0.05 + Math.abs(i) * 0.010); c.strokeStyle = '#7fa77e'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(x, base - S * 0.12, x, y - S * 0.12); c.stroke(); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, x = cx + Math.cos(a) * S * 0.14, y = base - S * 0.35 + Math.sin(a) * S * 0.07; c.strokeStyle = '#809c62'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx, base - S * 0.29); c.lineTo(x, y); c.stroke(); c.fillStyle = '#d2c95d'; c.beginPath(); c.arc(x, y, S * 0.011, 0, TAU); c.fill(); }
    return;
  }
  if (spec.strictSignature && name === 'Sea Kale') {
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; recheckLeaf(c, p, cx, base - S * 0.04, a, S * 0.19, 'crinkle'); }
    for (let i = 0; i < 30; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.25, base - S * (0.26 + r() * 0.12), 4, S * 0.014, '#f3f0df', '#e4c763');
    return;
  }
  if (spec.strictSignature && name === 'Scurvy Grass') {
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; recheckLeaf(c, p, cx, base - S * 0.03, a, S * 0.12, 'heart'); }
    for (let i = 0; i < 9; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.16, base - S * (0.18 + r() * 0.07), 4, S * 0.024, '#f6f2e3', '#e1c665');
    return;
  }
  for (let i = 0; i < 8; i++) recheckLeaf(c, p, cx, base - S * 0.08, -2.8 + i * 0.70, S * 0.18, hasName(name, 'Beet', 'Wild Rhubarb') ? 'crinkle' : name === 'Peanut' ? 'pinnate' : 'lance');
  if (name === 'Onion' || name === 'Garlic' || name === 'Wild Garlic') { c.fillStyle = name === 'Garlic' ? '#e9e3d0' : '#d5c69b'; c.beginPath(); c.ellipse(cx, base + S * 0.04, S * 0.10, S * 0.075, 0, 0, TAU); c.fill(); c.strokeStyle = '#aa9777'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * S * 0.028, base - S * 0.01); c.lineTo(cx + i * S * 0.022, base + S * 0.09); c.stroke(); } c.strokeStyle = '#eee6cf'; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(cx + (i - 3) * 5, base + S * 0.10); c.lineTo(cx + (i - 3) * 9, base + S * 0.15); c.stroke(); } if (name === 'Garlic') { c.strokeStyle = '#587a43'; c.lineWidth = 4; c.beginPath(); c.arc(cx, base - S * 0.22, S * 0.11, -1.5, 0.7); c.stroke(); } if (spec.strictSignature && name === 'Wild Garlic') { for (let i = 0; i < 7; i++) recheckLeaf(c, p, cx, base - S * 0.08, -2.5 + i * 0.33, S * 0.20, 'lance'); recheckStem(c, cx, base - S * 0.08, base - S * 0.45, 3.5, '#5b854d'); for (let i = 0; i < 11; i++) recheckFlower(c, cx + (r() - 0.5) * S * 0.13, base - S * (0.43 + r() * 0.05), 6, S * 0.018, '#f5f0df', '#e4ca5b'); } return; }
  const col = name === 'Beet' ? '#8c3041' : name === 'Peanut' ? '#b89058' : '#c18a50';
  for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.055; c.fillStyle = col; c.beginPath(); c.ellipse(x, base + S * 0.06, S * 0.040, S * (name === 'Peanut' ? 0.032 : 0.10), i * 0.18, 0, TAU); c.fill(); c.strokeStyle = '#9b7043'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, base); c.lineTo(x, base + S * 0.10); c.stroke(); }
  if (name === 'Peanut') { c.strokeStyle = '#c0a46f'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx + i * S * 0.055, base - S * 0.03); c.lineTo(cx + i * S * 0.055, base + S * 0.04); c.stroke(); } }
  if (!spec.strictSignature) return;
  if (name === 'Sea Beet') { c.strokeStyle = '#b44b4a'; c.lineWidth = 5; for (let i = -4; i <= 4; i++) { const a = -Math.PI / 2 + i * 0.30; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + Math.cos(a) * S * 0.22, base + Math.sin(a) * S * 0.13); c.stroke(); recheckLeaf(c, p, cx + Math.cos(a) * S * 0.18, base + Math.sin(a) * S * 0.11, a, S * 0.17, 'broad'); } }
  if (name === 'Wild Ginger') { for (const side of [-1, 1] as const) recheckLeaf(c, p, cx + side * S * 0.06, base - S * 0.08, side > 0 ? -0.25 : -2.9, S * 0.23, 'heart'); c.fillStyle = '#593631'; c.beginPath(); c.ellipse(cx, base + S * 0.005, S * 0.060, S * 0.035, 0, 0, TAU); c.fill(); }
  if (name === 'Wild Rhubarb') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; recheckLeaf(c, p, cx, base - S * 0.06, a, S * 0.28, 'crinkle'); } c.strokeStyle = '#b2554e'; c.lineWidth = 7; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + i * S * 0.06, base - S * 0.22); c.stroke(); } }
  if (name === 'Turmeric') { c.fillStyle = '#d88922'; c.beginPath(); c.ellipse(cx, base + S * 0.05, S * 0.15, S * 0.055, 0, 0, TAU); c.fill(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.23; recheckLeaf(c, p, cx, base - S * 0.09, a, S * 0.26, 'broad'); } recheckCone(c, cx + S * 0.10, base - S * 0.08, S * 0.052, S * 0.14, '#c9858a'); }
}

function recheckVine(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84, r = rngF(g, name, 0x7f3a);
  ground(c, cx, base + 4, S * 0.25);
  const woody = hasName(name, 'Canopy Vine', 'Black Pepper', 'Vanilla Orchid', 'Orchid Pods');
  if (woody) {
    c.fillStyle = '#4c3828'; c.fillRect(cx + S * 0.13, base - S * 0.64, S * 0.08, S * 0.66);
    c.strokeStyle = '#79634a'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.18, base); c.bezierCurveTo(cx + S * 0.06, base - S * 0.14, cx - S * 0.08, base - S * 0.52, cx + S * 0.18, base - S * 0.62); c.stroke();
    for (let i = 0; i < 8; i++) { const x = cx - S * 0.08 + i * S * 0.035, y = base - S * (0.13 + i * 0.065); recheckLeaf(c, p, x, y, i % 2 ? -2.5 : -0.60, S * 0.15, name === 'Canopy Vine' || name === 'Black Pepper' ? 'heart' : 'lance'); c.strokeStyle = '#d0c5a1'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + S * 0.08, y + S * 0.07); c.stroke(); }
    if (name === 'Orchid Pods') for (let i = 0; i < 5; i++) recheckCone(c, cx + S * (0.00 + i * 0.042), base - S * (0.28 + (i % 2) * 0.045), S * 0.026, S * 0.090, '#73884c');
    if (spec.strictSignature && name === 'Black Pepper') {
      /* Three drooping bead strings and pale clinging roots make pepper read
         as a cultivated climber, distinct from an unfruiting canopy liana. */
      for (const ox of [-0.06, 0.035, 0.13]) { c.strokeStyle = '#8f8055'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + S * (ox - 0.012), base - S * 0.31); c.quadraticCurveTo(cx + S * ox, base - S * 0.43, cx + S * (ox + 0.010), base - S * 0.53); c.stroke(); for (let i = 0; i < 9; i++) { const x = cx + S * (ox + (i & 1 ? 0.008 : -0.005)), y = base - S * (0.34 + i * 0.020); c.fillStyle = '#27362a'; c.beginPath(); c.arc(x, y, S * 0.015, 0, TAU); c.fill(); } }
      c.strokeStyle = 'rgba(223,213,175,0.82)'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const y = base - S * (0.14 + i * 0.070); c.beginPath(); c.moveTo(cx + S * 0.12, y); c.lineTo(cx + S * 0.18, y + S * 0.045); c.stroke(); }
    }
    if (spec.strictSignature && name === 'Vanilla Orchid') { for (let i = 0; i < 4; i++) recheckCone(c, cx + S * 0.02 + i * S * 0.042, base - S * (0.24 + (i % 2) * 0.05), S * 0.025, S * 0.105, '#78944e'); recheckFlower(c, cx - S * 0.03, base - S * 0.49, 6, S * 0.052, '#f2eee0', '#d7b84c'); }
    return;
  }
  if (spec.strictSignature && name === 'Beach Morning Glory') {
    c.strokeStyle = '#8c7350'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.30, base); c.bezierCurveTo(cx - S * 0.12, base - S * 0.12, cx + S * 0.10, base - S * 0.08, cx + S * 0.30, base - S * 0.02); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.10, y = base - S * (0.06 + (i & 1) * 0.04); c.fillStyle = '#4d8548'; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - S * 0.08, y - S * 0.04, x - S * 0.10, y + S * 0.055, x, y + S * 0.09); c.bezierCurveTo(x + S * 0.10, y + S * 0.055, x + S * 0.08, y - S * 0.04, x, y); c.lineTo(x, y + S * 0.032); c.closePath(); c.fill(); recheckFlower(c, x, y - S * 0.06, 5, S * 0.050, '#d27bc5', '#f3d36c'); }
    return;
  }
  if (spec.strictSignature && name === 'Beach Pea') {
    c.strokeStyle = '#78624a'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - S * 0.28, base); c.quadraticCurveTo(cx, base - S * 0.14, cx + S * 0.27, base - S * 0.06); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.09, y = base - S * (0.09 + (i & 1) * 0.045); for (const a of [-2.55, -0.58]) recheckLeaf(c, p, x, y, a, S * 0.075, 'broad'); c.strokeStyle = '#6d8246'; c.lineWidth = 2; c.beginPath(); c.arc(x + S * 0.05, y - S * 0.05, S * 0.035, -0.9, 1.2); c.stroke(); recheckFlower(c, x, y - S * 0.07, 5, S * 0.035, '#725aae', '#edcf72'); c.fillStyle = '#7b8d48'; c.beginPath(); c.ellipse(x + S * 0.035, y + S * 0.025, S * 0.048, S * 0.018, 0.16, 0, TAU); c.fill(); for (let q = 0; q < 3; q++) { c.strokeStyle = '#a6b06e'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + S * (0.010 + q * 0.024), y + S * 0.010); c.lineTo(x + S * (0.010 + q * 0.024), y + S * 0.040); c.stroke(); } }
    return;
  }
  if (spec.strictSignature && name === 'Sweet Potato') {
    c.strokeStyle = '#88604a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.30, base); c.bezierCurveTo(cx - S * 0.10, base - S * 0.13, cx + S * 0.08, base - S * 0.06, cx + S * 0.30, base - S * 0.12); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.10, y = base - S * (0.06 + (i & 1) * 0.055); recheckLeaf(c, p, x, y, i < 0 ? -2.60 : -0.52, S * 0.15, 'heart'); if (i & 1) { c.fillStyle = '#bd8857'; c.beginPath(); c.ellipse(x, base + S * 0.065, S * 0.040, S * 0.090, i * 0.16, 0, TAU); c.fill(); } }
    return;
  }
  if (spec.strictSignature && name === 'Cucumber') {
    c.strokeStyle = '#597b40'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - S * 0.27, base - S * 0.02); c.bezierCurveTo(cx - S * 0.10, base - S * 0.25, cx + S * 0.10, base - S * 0.10, cx + S * 0.28, base - S * 0.30); c.stroke();
    for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.085, y = base - S * (0.12 + (i & 1) * 0.07); for (let q = 0; q < 5; q++) recheckLeaf(c, p, x, y, q / 5 * TAU, S * 0.080, 'crinkle'); c.fillStyle = '#638c4d'; c.beginPath(); c.ellipse(x + S * 0.025, y + S * 0.065, S * 0.030, S * 0.105, 0.52, 0, TAU); c.fill(); c.fillStyle = '#a7c267'; for (let q = 0; q < 4; q++) { c.beginPath(); c.arc(x + S * (0.005 + q * 0.013), y + S * (0.025 + q * 0.035), S * 0.006, 0, TAU); c.fill(); } recheckFlower(c, x - S * 0.030, y - S * 0.045, 5, S * 0.026, '#e7c839', '#6d5420'); }
    return;
  }
  if (spec.strictSignature && name === 'Rattan') {
    c.strokeStyle = '#85763d'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.25, base); c.bezierCurveTo(cx - S * 0.14, base - S * 0.48, cx + S * 0.10, base - S * 0.22, cx + S * 0.22, base - S * 0.62); c.stroke();
    for (let n = 0; n < 7; n++) { const x = cx - S * 0.14 + n * S * 0.052, y = base - S * (0.12 + n * 0.070); c.strokeStyle = '#4d3925'; c.lineWidth = 2.5; for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.050, y - S * 0.038); c.stroke(); } for (const side of [-1, 1] as const) recheckLeaf(c, p, x, y, side < 0 ? -2.7 : -0.45, S * 0.075, 'lance'); }
    c.strokeStyle = '#5c4b29'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + S * 0.16, base - S * 0.50); c.bezierCurveTo(cx + S * 0.28, base - S * 0.61, cx + S * 0.31, base - S * 0.52, cx + S * 0.24, base - S * 0.47); c.stroke();
    return;
  }
  if (spec.strictSignature && name === 'Ivy') {
    /* Ivy reads by attachment: a dark supporting surface, a climbing woody
       stem, obvious aerial roots, and lobed leaves — not three generic flowers
       laid along a ground runner. */
    c.fillStyle = '#4c4235'; c.fillRect(cx + S * 0.12, base - S * 0.62, S * 0.10, S * 0.64);
    c.strokeStyle = '#526d3d'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.16, base); c.bezierCurveTo(cx - S * 0.06, base - S * 0.26, cx + S * 0.04, base - S * 0.38, cx + S * 0.15, base - S * 0.58); c.stroke();
    for (let n = 0; n < 7; n++) { const x = cx - S * 0.10 + n * S * 0.040, y = base - S * (0.12 + n * 0.067); recheckLeaf(c, p, x, y, n & 1 ? -2.62 : -0.50, S * 0.13, 'heart'); c.strokeStyle = 'rgba(219,211,171,0.86)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + S * 0.10, y); c.lineTo(x + S * 0.16, y + S * 0.040); c.stroke(); if (n > 4) { c.fillStyle = '#2d2b39'; c.beginPath(); c.arc(x, y + S * 0.050, S * 0.018, 0, TAU); c.fill(); } }
    return;
  }
  c.strokeStyle = '#557a42'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.28, base - 2); c.bezierCurveTo(cx - S * 0.12, base - S * 0.18, cx + S * 0.10, base - S * 0.10, cx + S * 0.30, base - S * 0.26); c.stroke();
  for (let i = 0; i < 9; i++) { const x = cx - S * 0.24 + i * S * 0.060, y = base - S * (0.04 + (i % 3) * 0.055); recheckLeaf(c, p, x, y, i % 2 ? -2.4 : -0.7, S * 0.13, name === 'Beach Morning Glory' || name === 'Sweet Potato' || name === 'Ivy' ? 'heart' : 'arrow'); }
  for (let i = 0; i < 3; i++) recheckFlower(c, cx - S * 0.10 + i * S * 0.12, base - S * (0.20 + (i % 2) * 0.07), 5, S * 0.060, '#cf75c5', '#56336f');
  if (name === "Devil's Claw") {
    c.strokeStyle = '#7b593a'; c.lineWidth = 8; c.lineCap = 'round';
    for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx, base - S * 0.34); c.bezierCurveTo(cx + side * S * 0.08, base - S * 0.42, cx + side * S * 0.18, base - S * 0.28, cx + side * S * 0.11, base - S * 0.20); c.stroke(); }
  }
  if (!spec.strictSignature) return;
  if (name === 'Beach Pea') { for (let i = 0; i < 4; i++) { const x = cx + (r() - 0.5) * S * 0.34, y = base - S * (0.16 + r() * 0.20); recheckFlower(c, x, y, 5, S * 0.042, '#7459ad', '#e5d075'); drawFruit(c, p, x + S * 0.045, y + S * 0.036, S * 0.030, 'pod', '#71824a', r); } }
  if (name === 'Desert Melon') { for (let i = 0; i < 3; i++) { const x = cx - S * 0.15 + i * S * 0.15, y = base - S * (0.10 + (i % 2) * 0.06); drawFruit(c, p, x, y, S * 0.055, 'melon', spec.fhue ?? '#698a45', r); recheckFlower(c, x + S * 0.055, y - S * 0.055, 5, S * 0.026, '#e5c53d', '#725a24'); } }
  if (name === 'Cucumber') { for (let i = 0; i < 3; i++) { const x = cx - S * 0.12 + i * S * 0.12, y = base - S * (0.12 + (i % 2) * 0.08); c.fillStyle = '#638c4d'; c.beginPath(); c.ellipse(x, y, S * 0.025, S * 0.090, 0.55, 0, TAU); c.fill(); recheckFlower(c, x + S * 0.045, y - S * 0.070, 5, S * 0.027, '#e9c637', '#6f5420'); } }
  if (name === 'Passionflower') { for (let i = 0; i < 44; i++) recheckPetal(c, cx + S * 0.05, base - S * 0.34, i / 44 * TAU, S * 0.090, S * 0.010, i % 2 ? '#a585c9' : '#e8d7ae'); c.fillStyle = '#5d4b81'; c.beginPath(); c.arc(cx + S * 0.05, base - S * 0.34, S * 0.030, 0, TAU); c.fill(); }
  if (name === 'Ivy') { for (let i = 0; i < 16; i++) { const x = cx - S * 0.20 + r() * S * 0.36, y = base - S * (0.08 + r() * 0.40); c.strokeStyle = 'rgba(220,232,190,0.55)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - S * 0.035, y); c.lineTo(x + S * 0.035, y); c.stroke(); if (i % 3 === 0) { c.fillStyle = '#252534'; c.beginPath(); c.arc(x, y + S * 0.045, S * 0.016, 0, TAU); c.fill(); } } }
  if (name === 'Rattan') { c.strokeStyle = '#7f7540'; c.lineWidth = 11; c.beginPath(); c.moveTo(cx - S * 0.24, base); c.bezierCurveTo(cx - S * 0.10, base - S * 0.48, cx + S * 0.08, base - S * 0.28, cx + S * 0.25, base - S * 0.64); c.stroke(); for (let i = 0; i < 12; i++) { const x = cx - S * 0.14 + i * S * 0.030, y = base - S * (0.14 + i * 0.036); c.strokeStyle = '#4a3826'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + S * 0.045, y - S * 0.035); c.stroke(); } }
  if (name === 'Sweet Potato') { for (let i = -2; i <= 2; i++) { const x = cx + i * S * 0.060; c.fillStyle = '#bf8d55'; c.beginPath(); c.ellipse(x, base + S * 0.04, S * 0.038, S * 0.090, i * 0.20, 0, TAU); c.fill(); } }
}

function recheckAlgae(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.80, r = rngF(g, name, 0x7f3b);
  recheckWater(c, base - 3); c.fillStyle = '#453b2a'; c.beginPath(); c.ellipse(cx, base + S * 0.08, S * 0.20, S * 0.055, 0, 0, TAU); c.fill();
  const pink = hasName(name, 'Red Algae', 'Coralline Algae', 'Dulse'); const bead = name === 'Sea Grapes Algae'; const kelp = hasName(name, 'Bladderwrack', 'Bull Kelp', 'Giant Kelp', 'Wakame');
  if (bead) { c.strokeStyle = '#468c4b'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx - S * 0.23, base); c.quadraticCurveTo(cx, base - S * 0.12, cx + S * 0.22, base - S * 0.05); c.stroke(); for (let i = 0; i < 28; i++) { const x = cx - S * 0.20 + r() * S * 0.40, y = base - S * (0.05 + r() * 0.34); c.fillStyle = '#6ec75f'; c.beginPath(); c.arc(x, y, S * 0.018, 0, TAU); c.fill(); } return; }
  if (spec.strictSignature && name === 'Bladderwrack') {
    for (const side of [-1, 1] as const) {
      c.strokeStyle = '#665f2e'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + side * S * 0.11, base - S * 0.22, cx + side * S * 0.22, base - S * 0.47); c.stroke();
      for (let n = 0; n < 3; n++) { const x = cx + side * S * (0.07 + n * 0.050), y = base - S * (0.16 + n * 0.095); c.strokeStyle = '#6f6b32'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * S * 0.075, y - S * 0.055); c.stroke(); c.fillStyle = '#9e9140'; c.beginPath(); c.arc(x + side * S * 0.026, y - S * 0.026, S * 0.024, 0, TAU); c.fill(); }
    }
    return;
  }
  if (spec.strictSignature && name === 'Giant Kelp') {
    holdfast(c, cx, base + S * 0.03, '#5a482c'); c.strokeStyle = '#705d2e'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx - S * 0.05, base - S * 0.30, cx + S * 0.05, base - S * 0.50, cx, base - S * 0.68); c.stroke();
    for (let i = 0; i < 7; i++) { const y = base - S * (0.15 + i * 0.075), side = i & 1 ? -1 : 1; c.fillStyle = '#8d7c36'; c.beginPath(); c.arc(cx + side * S * 0.020, y, S * 0.024, 0, TAU); c.fill(); c.fillStyle = '#7d8938'; c.beginPath(); c.moveTo(cx + side * S * 0.02, y); c.quadraticCurveTo(cx + side * S * 0.17, y - S * 0.08, cx + side * S * 0.26, y - S * 0.20); c.quadraticCurveTo(cx + side * S * 0.11, y - S * 0.08, cx + side * S * 0.02, y + S * 0.02); c.fill(); }
    return;
  }
  if (spec.strictSignature && name === 'Wakame') {
    /* Broad, ruffled wakame blades fan from a pleated holdfast.  Rendering it
       as three narrow Y-prongs loses the winged, undulating silhouette. */
    c.fillStyle = '#a78c53'; for (let i = -6; i <= 6; i++) { c.beginPath(); c.ellipse(cx + i * S * 0.024, base - S * 0.055 + Math.abs(i) * S * 0.006, S * 0.028, S * 0.060, i * 0.16, 0, TAU); c.fill(); }
    for (const [side, lift, reach] of [[-1, 0.22, 0.28], [1, 0.22, 0.28], [-1, 0.39, 0.22], [1, 0.39, 0.22], [0, 0.55, 0.13]] as const) {
      const sx = cx + side * S * 0.018, sy = base - S * 0.080, ex = cx + side * S * reach, ey = base - S * lift;
      c.fillStyle = side === 0 ? '#7c8140' : '#8d8d43'; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + side * S * 0.12, sy - S * 0.11, ex, ey); c.quadraticCurveTo(ex - side * S * 0.075, ey + S * 0.035, ex - side * S * 0.015, ey + S * 0.105); c.quadraticCurveTo(sx + side * S * 0.055, sy + S * 0.040, sx, sy); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(206,190,103,0.64)'; c.lineWidth = 1.5; for (let q = 1; q <= 3; q++) { const u = q / 4, x = sx + (ex - sx) * u, y = sy + (ey - sy) * u; c.beginPath(); c.moveTo(x - S * 0.018, y + S * 0.016); c.quadraticCurveTo(x, y - S * 0.006, x + S * 0.020, y - S * 0.020); c.stroke(); }
    }
    return;
  }
  if (spec.strictSignature && name === 'Dulse') {
    /* Hand-shaped blade: three broad lobes with ear-like marginal flaps,
       rather than one pointed red petal. */
    for (const [ox, lift, wid] of [[-0.10, 0.31, 0.075], [0, 0.47, 0.090], [0.10, 0.33, 0.075]] as const) { const x = cx + S * ox, y = base - S * lift; c.fillStyle = '#9c3f49'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(x - S * wid, y + S * 0.11, x - S * wid * 0.45, y - S * 0.06); c.quadraticCurveTo(x, y - S * 0.11, x + S * wid * 0.45, y - S * 0.06); c.quadraticCurveTo(x + S * wid, y + S * 0.11, cx, base); c.fill(); }
    for (const side of [-1, 1] as const) { c.fillStyle = '#b2525b'; c.beginPath(); c.ellipse(cx + side * S * 0.14, base - S * 0.29, S * 0.060, S * 0.043, side * 0.18, 0, TAU); c.fill(); }
    return;
  }
  if (spec.strictSignature && name === 'Coralline Algae') {
    /* Coralline is a hard pink crust that plates a rock.  The former parallel
       stalks looked like a decorative land plant rather than calcified algae. */
    c.fillStyle = '#62584f'; c.beginPath(); c.moveTo(cx - S * 0.24, base + S * 0.035); c.lineTo(cx - S * 0.16, base - S * 0.08); c.lineTo(cx + S * 0.04, base - S * 0.11); c.lineTo(cx + S * 0.23, base - S * 0.025); c.lineTo(cx + S * 0.18, base + S * 0.075); c.lineTo(cx - S * 0.20, base + S * 0.080); c.closePath(); c.fill();
    for (let i = 0; i < 38; i++) { const x = cx + (r() - 0.5) * S * 0.37, y = base - S * (0.006 + r() * 0.15); c.fillStyle = i % 3 ? '#c98e9b' : '#e5b7ba'; c.beginPath(); c.ellipse(x, y, S * 0.020, S * 0.010, r() * TAU, 0, TAU); c.fill(); c.strokeStyle = 'rgba(248,220,215,0.72)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - S * 0.014, y); c.lineTo(x + S * 0.014, y); c.stroke(); }
    for (let s = -2; s <= 2; s++) { const x = cx + s * S * 0.060, y = base - S * 0.085; c.strokeStyle = '#c98e9b'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + s * S * 0.010, y - S * 0.065); c.stroke(); c.strokeStyle = '#f3d8d5'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - S * 0.018, y - S * 0.032); c.lineTo(x + S * 0.018, y - S * 0.032); c.stroke(); }
    return;
  }
  if (kelp) {
    if (spec.strictSignature && name === 'Giant Kelp') {
      holdfast(c, cx, base + S * 0.03, '#5a482c');
      c.strokeStyle = '#69552d'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx - S * 0.06, base - S * 0.27, cx + S * 0.05, base - S * 0.48, cx, base - S * 0.68); c.stroke();
      for (let i = 0; i < 7; i++) { const y = base - S * (0.18 + i * 0.075); c.fillStyle = '#8b7837'; c.beginPath(); c.arc(cx + (i % 2 ? -1 : 1) * S * 0.022, y, S * 0.023, 0, TAU); c.fill(); recheckLeaf(c, p, cx, y, i % 2 ? -2.75 : -0.42, S * 0.24, 'blade'); }
      return;
    }
    c.strokeStyle = '#615a2d'; c.lineWidth = name === 'Bull Kelp' ? 8 : 6; c.beginPath(); c.moveTo(cx, base); c.bezierCurveTo(cx - S * 0.08, base - S * 0.28, cx + S * 0.08, base - S * 0.45, cx, base - S * 0.60); c.stroke();
    if (name === 'Bull Kelp') { c.fillStyle = '#816a2f'; c.beginPath(); c.arc(cx, base - S * 0.56, S * 0.052, 0, TAU); c.fill(); }
    for (let i = 0; i < 8; i++) recheckLeaf(c, p, cx, base - S * 0.58, -2.7 + i * 0.78, S * (name === 'Wakame' ? 0.23 : 0.18), name === 'Wakame' ? 'frond' : 'blade');
    if (spec.strictSignature && name === 'Bladderwrack') { c.strokeStyle = '#665f2e'; c.lineWidth = 5; for (const side of [-1, 1] as const) { c.beginPath(); c.moveTo(cx, base - S * 0.27); c.quadraticCurveTo(cx + side * S * 0.15, base - S * 0.38, cx + side * S * 0.22, base - S * 0.52); c.stroke(); for (let i = 0; i < 3; i++) { c.fillStyle = '#8d7f36'; c.beginPath(); c.arc(cx + side * S * (0.08 + i * 0.048), base - S * (0.33 + i * 0.056), S * 0.021, 0, TAU); c.fill(); } } }
    if (spec.strictSignature && name === 'Wakame') { c.strokeStyle = 'rgba(201,170,91,0.58)'; c.lineWidth = 3; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * 5, base - S * 0.08); c.quadraticCurveTo(cx + i * 12, base - S * 0.13, cx + i * 9, base - S * 0.19); c.stroke(); } }
    return;
  }
  const col = pink ? (name === 'Coralline Algae' ? '#cf99a7' : name === 'Dulse' ? '#9c3f49' : '#a83b57') : '#48874a';
  if (spec.strictSignature && name === 'Dulse') { for (let i = -3; i <= 3; i++) { const x = cx + i * S * 0.045; c.fillStyle = '#9c3f49'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(x - S * 0.06, base - S * 0.20, x, base - S * (0.31 + Math.abs(i) * 0.02)); c.quadraticCurveTo(x + S * 0.06, base - S * 0.20, cx, base); c.fill(); } return; }
  for (let branch = 0; branch < 9; branch++) { const a = -2.75 + branch * 0.38, len = S * (0.20 + r() * 0.14); c.strokeStyle = col; c.lineWidth = name === 'Coralline Algae' ? 7 : 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.55, base + Math.sin(a) * len * 0.50, cx + Math.cos(a) * len, base + Math.sin(a) * len); c.stroke(); if (name === 'Coralline Algae') { c.strokeStyle = 'rgba(248,230,224,0.48)'; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { const x = cx + Math.cos(a) * len * k / 4, y = base + Math.sin(a) * len * k / 4; c.beginPath(); c.moveTo(x - 3, y - 3); c.lineTo(x + 3, y + 3); c.stroke(); } } }
}

function recheckFern(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84;
  ground(c, cx, base + 4, S * 0.24);
  if (spec.strictSignature && name === 'Cave Fern') {
    c.fillStyle = '#4b4c4a'; c.beginPath(); c.moveTo(cx - S * 0.22, base + 4); c.lineTo(cx - S * 0.11, base - S * 0.40); c.lineTo(cx + S * 0.13, base - S * 0.37); c.lineTo(cx + S * 0.24, base + 4); c.closePath(); c.fill();
    c.fillStyle = '#1b211c'; c.beginPath(); c.moveTo(cx - S * 0.08, base + 2); c.lineTo(cx, base - S * 0.27); c.lineTo(cx + S * 0.09, base + 2); c.closePath(); c.fill();
    for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.27; const len = S * (0.20 + (i % 2) * 0.03); c.strokeStyle = '#5a884d'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, base - S * 0.03); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.4, base - S * 0.16, cx + Math.cos(a) * len, base - S * 0.03 + Math.sin(a) * len); c.stroke(); for (let k = 0; k < 6; k++) { const u = (k + 1) / 7, x = cx + Math.cos(a) * len * u, y = base - S * 0.03 + Math.sin(a) * len * u; recheckLeaf(c, p, x, y, a + (k % 2 ? 0.85 : -0.85), S * 0.045, 'broad'); if (k % 2 === 0) { c.fillStyle = '#945a3f'; c.beginPath(); c.arc(x, y + 4, 1.8, 0, TAU); c.fill(); } } }
    return;
  }
  if (spec.strictSignature && name === 'Licorice Fern') {
    c.fillStyle = '#5a4531'; c.beginPath(); c.ellipse(cx, base + S * 0.025, S * 0.24, S * 0.075, 0, 0, TAU); c.fill();
    c.strokeStyle = '#68a155'; c.lineWidth = 7; c.beginPath(); c.moveTo(cx - S * 0.19, base - S * 0.01); c.bezierCurveTo(cx - S * 0.04, base - S * 0.11, cx + S * 0.07, base - S * 0.06, cx + S * 0.20, base - S * 0.15); c.stroke();
    for (let i = -4; i <= 4; i++) { const a = -Math.PI / 2 + i * 0.22; recheckLeaf(c, p, cx + S * 0.04, base - S * 0.10, a, S * 0.20, 'frond'); }
    return;
  }
  if (spec.strictSignature && name === 'Maidenhair Fern') {
    /* Maidenhair's landmark is the unusually dark, hair-fine rachis with
       small fan leaflets arranged on either side — avoid the solid green
       rosette that makes it read as an ordinary broadleaf fern. */
    for (let f = -3; f <= 3; f++) {
      const a = -Math.PI / 2 + f * 0.20, len = S * (0.31 - Math.abs(f) * 0.012);
      const nx = -Math.sin(a), ny = Math.cos(a);
      c.strokeStyle = '#302b24'; c.lineWidth = 2.8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.38, base - S * (0.12 + Math.abs(f) * 0.006), cx + Math.cos(a) * len, base + Math.sin(a) * len); c.stroke();
      for (let k = 2; k <= 5; k++) {
        const u = k / 6, x = cx + Math.cos(a) * len * u, y = base + Math.sin(a) * len * u - S * 0.045 * u * (1 - u);
        for (const side of [-1, 1] as const) {
          const lx = x + nx * side * S * 0.045, ly = y + ny * side * S * 0.045;
          c.fillStyle = '#669d58'; c.beginPath(); c.moveTo(x, y);
          c.quadraticCurveTo(lx + Math.cos(a) * S * 0.022, ly + Math.sin(a) * S * 0.018, lx + nx * side * S * 0.022, ly + ny * side * S * 0.022);
          c.quadraticCurveTo(lx - Math.cos(a) * S * 0.020, ly - Math.sin(a) * S * 0.016, x, y); c.fill();
        }
      }
    }
    return;
  }
  if (spec.strictSignature && name === 'Sword Fern') {
    /* A sword fern is a compact upright shuttlecock: one plane of stiff
       pinnae with the hooked basal pair, not a loose bundle of green sticks. */
    for (let f = -4; f <= 4; f++) {
      const a = -Math.PI / 2 + f * 0.18, len = S * (0.34 - Math.abs(f) * 0.018);
      c.strokeStyle = '#3e6f43'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.28, base - S * 0.14, cx + Math.cos(a) * len, base + Math.sin(a) * len); c.stroke();
      for (let n = 1; n < 7; n++) { const u = n / 7, x = cx + Math.cos(a) * len * u, y = base + Math.sin(a) * len * u - S * 0.04 * u * (1 - u); for (const side of [-1, 1] as const) { const hook = n === 1 ? side * 0.32 : 0; recheckLeaf(c, p, x, y, a + side * (1.35 + hook), S * 0.060, 'lance'); } }
    }
    return;
  }
  if (name === 'Tree Fern Shoots') {
    c.strokeStyle = '#65452e'; c.lineWidth = S * 0.075; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, base - S * 0.42); c.stroke();
    c.strokeStyle = 'rgba(210,170,110,0.45)'; c.lineWidth = 2; for (let k = 0; k < 8; k++) { const y = base - S * (0.06 + k * 0.045); c.beginPath(); c.moveTo(cx - 12, y); c.lineTo(cx + 12, y); c.stroke(); }
    for (let i = 0; i < 9; i++) recheckLeaf(c, p, cx, base - S * 0.44, -Math.PI / 2 + (i - 4) * 0.38, S * 0.28, 'frond');
    for (let i = -1; i <= 1; i++) { c.strokeStyle = '#a07a48'; c.lineWidth = 5; c.beginPath(); c.arc(cx + i * 14, base - S * 0.12, S * 0.05, -0.3, 4.4); c.stroke(); }
    return;
  }
  /* Sword fern: one flat fan of individually readable pinnae with the
     characteristic hooked basal pair, rather than a saw-edged solid blade. */
  for (let i = 0; i < 11; i++) {
    const a = -2.72 + i * 0.26, len = S * (0.30 + (i % 3) * 0.018);
    c.strokeStyle = '#426d3e'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + Math.cos(a) * len * 0.5, base + Math.sin(a) * len * 0.4, cx + Math.cos(a) * len, base + Math.sin(a) * len); c.stroke();
    for (let k = 1; k <= 9; k++) { const u = k / 10, x = cx + Math.cos(a) * len * u, y = base + Math.sin(a) * len * u; const side = k % 2 ? 1 : -1; recheckLeaf(c, p, x, y, a + side * 0.85, S * 0.055 * (1 - u * 0.35), 'lance'); }
  }
}

function recheckBerry(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): void {
  const cx = S * 0.50, base = S * 0.84;
  const bark = '#654a37';
  /* Keep the established boreal-berry body (it already carries the requested
     low evergreen architecture) and make the remaining strict polish cue
     visible: terminal berry clusters and notched leaf tips. */
  berryBody(c, g, p, spec, name, cx, base, bark);
  const fruit = spec.fhue ?? '#ae2633';
  for (const x of [cx - S * 0.12, cx + S * 0.12]) {
    for (let i = 0; i < 4; i++) { c.fillStyle = fruit; c.beginPath(); c.arc(x + (i % 2 ? 6 : -5), base - S * (0.22 + (i / 4) * 0.09), S * 0.015, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(230,245,212,0.55)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(x - S * 0.07, base - S * 0.18); c.lineTo(x - S * 0.04, base - S * 0.20); c.lineTo(x - S * 0.01, base - S * 0.18); c.stroke();
  }
}

function recheckPlant(c: Ctx, g: G, p: Pal, spec: PlantSpec, name: string): boolean {
  switch (spec.recheck) {
    case 'wildflower': recheckWildflower(c, g, p, spec, name); return true;
    case 'succulent': recheckSucculent(c, g, p, spec, name); return true;
    case 'wetland': recheckWetland(c, g, p, spec, name); return true;
    case 'crop': recheckCrop(c, g, p, spec, name); return true;
    case 'tree': recheckTree(c, g, p, spec, name); return true;
    case 'palm': recheckPalm(c, g, p, spec, name); return true;
    case 'shrub': recheckShrub(c, g, p, spec, name); return true;
    case 'herb': recheckHerb(c, g, p, spec, name); return true;
    case 'root': recheckRoot(c, g, p, spec, name); return true;
    case 'vine': recheckVine(c, g, p, spec, name); return true;
    case 'algae': recheckAlgae(c, g, p, spec, name); return true;
    case 'fern': recheckFern(c, g, p, spec, name); return true;
    case 'berry': recheckBerry(c, g, p, spec, name); return true;
    default: return false;
  }
}

export function plantBody(c: Ctx, g: G, pIn: Pal, spec: PlantSpec, name = ''): void {
  /* ★ D-ART-114 — the species hue axis, and the biggest single unlock: 314
     plants took the rarity roll. Note this is the FOLIAGE colour and is a
     different axis from `fhue`, which colours the flower or fruit — a plant
     can have scarlet berries on grey-green leaves, and conflating the two is
     what made the colour audit read 270 flora as already done when their
     bodies were still random. */
  const p = speciesHue(pIn, spec.hue);
  if (recheckPlant(c, g, p, spec, name)) return;
  const r = rngF(g, name, 0x9101);
  const toothed = spec.toothed ?? false;
  const cx = S * 0.50, base = S * 0.84;
  /* RATIOS, never scales — the fit pass erases a size-only difference */
  const H = S * (spec.tall ? 0.62 : spec.squat ? 0.40 : 0.52) * nvf(name, 0x11, 0.14);
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

  if (spec.habit === 'shrub' && spec.berryHabit) {
    berryBody(c, g, p, spec, name, cx, base, barkCol);
  } else if (spec.habit === 'palm') {
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
    if (spec.pseudostem && spec.fruit && spec.fruit !== 'none') {
      /* ★ GP6 — THE HANGING BUNCH + PURPLE BUD. The banana's fruit sat as balls
         tucked in the crown; it is a stalk DROPPING from the crown carrying
         tiered rows of upcurved fingers, ending in the purple-red teardrop bud. */
      const sx2 = px + S * 0.03, sy2 = py + S * 0.02, drop = S * 0.16;
      c.strokeStyle = '#6a7a3a'; c.lineWidth = S * 0.010; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx2, sy2); c.quadraticCurveTo(sx2 + S * 0.02, sy2 + drop * 0.5, sx2 + S * 0.012, sy2 + drop); c.stroke();
      c.fillStyle = spec.fhue ?? '#d8c440';
      for (let tier = 0; tier < 3; tier++) {   /* tiered rows of fingers, curving UP */
        const ty2 = sy2 + drop * (0.25 + tier * 0.24);
        for (let k = -2; k <= 2; k++) {
          c.save(); c.translate(sx2 + S * 0.012 + k * S * 0.014, ty2); c.rotate(0.5 - Math.abs(k) * 0.12);
          c.beginPath(); c.ellipse(0, 0, S * 0.008, S * 0.022, 0, 0, TAU); c.fill(); c.restore();
        }
      }
      const bg3 = c.createRadialGradient(sx2 + S * 0.012, sy2 + drop + S * 0.02, 1, sx2 + S * 0.012, sy2 + drop + S * 0.03, S * 0.026);
      bg3.addColorStop(0, '#8a3050'); bg3.addColorStop(1, '#4a1830');
      c.fillStyle = bg3;   /* the purple-red terminal bud */
      c.beginPath(); c.moveTo(sx2 + S * 0.012 - S * 0.018, sy2 + drop);
      c.quadraticCurveTo(sx2 + S * 0.012, sy2 + drop + S * 0.06, sx2 + S * 0.012 + S * 0.018, sy2 + drop);
      c.closePath(); c.fill();
    } else if (spec.fruit === 'cluster') {
      /* ★ POLISH — a date palm's bunch HANGS below the crown on orange strands */
      const hx2 = px + S * 0.045, hy2 = py + S * 0.075;
      c.strokeStyle = '#d08a2c'; c.lineWidth = S * 0.006; c.lineCap = 'round';
      c.beginPath(); c.moveTo(px + S * 0.01, py + S * 0.01); c.quadraticCurveTo(hx2, py + S * 0.03, hx2, hy2); c.stroke();
      drawFruit(c, p, hx2, hy2 + S * 0.015, S * 0.05, 'cluster', spec.fhue, r);
    } else if (spec.fruit && spec.fruit !== 'none') { const shaped = ['pear', 'spiky', 'star', 'crown', 'hairy', 'melon'].includes(spec.fruit);
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
    if (spec.tap) {
      /* ★ POLISH — THE HARVEST: a metal spile driven into the trunk at chest
         height with a bucket hanging from it (the thing 'Maple Sap' is named
         for, absent entirely). */
      const tx2 = cx + lean * S * 0.02 + tw * 1.1, ty2 = base - H * 0.34;
      c.strokeStyle = '#b8b8c0'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(tx2 - tw * 0.4, ty2); c.lineTo(tx2 + S * 0.028, ty2 + S * 0.008); c.stroke();
      const bw2 = S * 0.032, bh2 = S * 0.040, bx2 = tx2 + S * 0.028, by2 = ty2 + S * 0.012;
      c.strokeStyle = '#888890'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bx2, by2 + S * 0.012); c.stroke();   /* the hook */
      const bg4 = c.createLinearGradient(bx2 - bw2 / 2, 0, bx2 + bw2 / 2, 0);
      bg4.addColorStop(0, '#9a9aa4'); bg4.addColorStop(0.5, '#d0d0d8'); bg4.addColorStop(1, '#787882');
      c.fillStyle = bg4;
      c.beginPath(); c.moveTo(bx2 - bw2 * 0.5, by2 + S * 0.012);
      c.lineTo(bx2 + bw2 * 0.5, by2 + S * 0.012);
      c.lineTo(bx2 + bw2 * 0.38, by2 + S * 0.012 + bh2);
      c.lineTo(bx2 - bw2 * 0.38, by2 + S * 0.012 + bh2); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,40,48,0.5)'; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(bx2, by2 + S * 0.012, bw2 * 0.5, S * 0.006, 0, 0, TAU); c.stroke();
    }
    c.lineWidth = tw * 1.15;
    /* ★ WAVE 61 → GOLD AUDIT — a needle-leaf tree is ALWAYS a conifer; the
       old gate sent non-tall pines (Pinyon) and the Yew to the broadleaf
       lollipop, which the gold audit failed as "round broadleaf-tree
       silhouette is wrong". Tall = the spire; not tall = a LOW BROAD bushy
       pyramid (wider tiers, less taper) — not a Christmas cone (gp5), not a
       lollipop (gold audit). */
    const conifer = spec.leaf === 'needle' || spec.leaf === 'scale';
    if (conifer) {
      /* ★ WAVE 58 — A CONIFER IS A CONICAL SPIRE OF TIERED BOUGHS, not a round
         deciduous lollipop (the judge failed Spruce/Cedar/Redwood for exactly
         that). Stacked drooping triangular tiers narrowing to a leader. */
      const tallC = !!spec.tall;
      const tiers = tallC ? 6 : 5;
      const cwid = S * (tallC ? 0.19 : 0.27) * spread;
      /* non-tall climbs to ~0.86H so the trunk never pokes out as a stub */
      const climb = tallC ? 0.68 : 0.58, taper = tallC ? 0.82 : 0.74;
      const gA = [40, 78, 52];
      const fmix = (ch: number, an: number): number => an * 0.66 + ch * 0.34;
      const fB = [fmix(p.cr, gA[0]!), fmix(p.cg, gA[1]!), fmix(p.cb, gA[2]!)];
      for (let t = 0; t < tiers; t++) {
        const v = t / tiers, ty = base - H * (0.28 + v * climb), half = cwid * (1 - v * taper);
        const val = 0.55 + v * 0.5;
        c.fillStyle = `rgb(${Math.min(255, fB[0]! * val | 0)},${Math.min(255, fB[1]! * val | 0)},${Math.min(255, fB[2]! * val | 0)})`;
        c.beginPath(); c.moveTo(cx + lean * S * 0.08 * v, ty - H * (tallC ? 0.16 : 0.12));
        c.lineTo(cx - half + lean * S * 0.08 * v, ty); c.lineTo(cx + half + lean * S * 0.08 * v, ty); c.closePath(); c.fill();
        /* a few needle sprigs on the tier edge for texture */
        for (let i = 0; i < 5; i++) { const sx = cx + (i / 4 - 0.5) * half * 1.6 + lean * S * 0.08 * v; drawLeaf(c, p, sx, ty - H * 0.02, i % 2 ? 0.4 : Math.PI - 0.4, S * 0.03, 'needle'); }
      }
      if (spec.fruit === 'cone') for (let i = 0; i < 3; i++) drawFruit(c, p, cx + (r() - 0.5) * cwid, base - H * (0.4 + r() * 0.4), S * 0.03, 'cone', spec.fhue, r);
      else if (spec.fruit === 'berry') {
        /* the yew's red arils, scattered through the dark boughs */
        c.fillStyle = spec.fhue ?? '#c02c2c';
        for (let i = 0; i < 9; i++) {
          c.beginPath(); c.arc(cx + (r() - 0.5) * cwid * 1.5, base - H * (0.30 + r() * (climb * 0.9)), S * 0.011, 0, TAU); c.fill();
        }
      }
    } else {
    for (const s of [-1, 1] as const) {   /* two boughs into the canopy */
      c.beginPath(); c.moveTo(cx + lean * S * 0.06, base - H * 0.45);
      c.quadraticCurveTo(cx + s * S * 0.05, base - H * 0.72, cx + s * S * 0.085 * spread, topY + H * 0.20); c.stroke();
    }
    {
      /* the canopy: overlapping soft masses, then leaves on the rim, so the
         crown has depth instead of being one flat blob */
      const cw = S * (spec.squat ? 0.27 : 0.21) * spread, chh = S * (spec.squat ? 0.14 : 0.16) * nvf(name, 0x66, 0.22);
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
    if (spec.flower === 'spike' || spec.flower === 'catkin') {
      /* ★ GP6 — lavender/sage spikes RISE ABOVE the mound on stalks */
      for (let i = 0; i < 5; i++) { const t2 = (i / 4 - 0.5);
        const fx2 = ccx + t2 * cw * 1.1, fy2 = ccy - chh * (0.8 + Math.cos(t2 * 2) * 0.3);
        c.strokeStyle = stemCol; c.lineWidth = S * 0.005;
        c.beginPath(); c.moveTo(fx2, fy2 + chh * 0.5); c.lineTo(fx2, fy2 - S * 0.04); c.stroke();
        drawFlower(c, p, fx2, fy2 - S * 0.055, S * 0.042, spec.flower, spec.fhue, r); }
    } else if (spec.flower && spec.flower !== 'none') for (let i = 0; i < 4; i++) { const a = r() * TAU, d = 0.4 + r() * 0.6;
      drawFlower(c, p, ccx + Math.cos(a) * cw * d, ccy + Math.sin(a) * chh * d, S * (spec.flower === 'trumpet' ? 0.062 : 0.036), spec.flower, spec.fhue, r); }
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
    const cereal0 = spec.fruit === 'grain' || spec.fruit === 'panicle' || spec.fruit === 'club';
    const nBl = cereal0 ? 7 : leafN + 4;   /* ★ POLISH — a cereal is a tight tuft, not a fountain */
    for (let i = 0; i < nBl; i++) {
      const u = (i / (nBl - 1)) - 0.5;
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
        /* ★ GOLD AUDIT — PAPYRUS: every cane is topped by its own radiating
           umbel (the firework head), not one head on the tallest stem. */
        if (spec.flower === 'firework') drawFlower(c, p, tipX, tipY, S * 0.042, 'firework', spec.fhue, r);
      }
    }
    /* the head rides the tallest blade, JOINED to the crown by its own stalk
       — it used to float disconnected above the grass (Nick's review) */
    const cereal = spec.fruit === 'grain' || spec.fruit === 'panicle' || spec.fruit === 'club';
    if (cereal || (spec.flower && spec.flower !== 'none' && !(cane && spec.flower === 'firework'))) {
      const headY = base - H * 0.80;
      c.strokeStyle = stemCol; c.lineWidth = S * 0.007; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + lean * S * 0.03, base - H * 0.5, cx + S * 0.01, headY + S * 0.03); c.stroke();
      if (cereal) drawFruit(c, p, cx + S * 0.01, headY, S * 0.048, spec.fruit!, spec.fhue, r);
      else drawFlower(c, p, cx + S * 0.01, headY, S * (spec.flower === 'spike' || spec.flower === 'catkin' ? 0.078 : 0.052), spec.flower!, spec.fhue, r);
    }
  } else if (spec.habit === 'vine') {
    /* A VINE HANGS AND CLINGS — a sinuous stem with tendrils, not a stalk.
       ★ WAVE 67 — `trail` lays the runner HORIZONTALLY along the ground/water
       (water spinach, beach morning glory's read); `rope` thickens the stem to
       a succulent cord with short aerial roots at the nodes (vanilla orchid). */
    const rope = spec.rope ?? false;
    c.strokeStyle = stemCol; c.lineWidth = S * (rope ? 0.022 : 0.011); c.lineCap = 'round';
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      if (spec.trail) pts.push([cx - S * 0.34 + u * S * 0.68, base - S * 0.03 - Math.sin(u * 5.2 + lean) * S * 0.035]);
      else pts.push([cx + Math.sin(u * 6.0 + lean) * S * 0.11 * spread, base - u * H]);
    }
    if (rope) {   /* aerial roots hanging at every few nodes */
      c.strokeStyle = 'rgba(150,140,110,0.8)'; c.lineWidth = 2;
      for (let i = 4; i < 24; i += 5) { const [ax2, ay2] = pts[i]!;
        c.beginPath(); c.moveTo(ax2, ay2); c.quadraticCurveTo(ax2 + S * 0.012, ay2 + S * 0.04, ax2 + S * 0.005, ay2 + S * 0.07); c.stroke(); }
      c.strokeStyle = stemCol; c.lineWidth = S * 0.022;
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
    if (spec.fruit === 'cluster') {
      /* ★ POLISH — a GRAPE BUNCH: a big conical cascade of berries hanging on
         its own stalk from mid-vine, wider than a leaf (was a small blob). */
      const [gx, gy] = pts[13]!;
      c.strokeStyle = p.dark; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + S * 0.03, gy + S * 0.03); c.stroke();
      const col2 = spec.fhue ?? '#5a3a7a';
      for (let row = 0; row < 6; row++) {
        const nb = 6 - row, by2 = gy + S * 0.035 + row * S * 0.026;
        for (let k2 = 0; k2 < nb; k2++) {
          const bx2 = gx + S * 0.03 + (k2 - (nb - 1) / 2) * S * 0.024;
          const gg2 = c.createRadialGradient(bx2 - 3, by2 - 3, 1, bx2, by2, S * 0.015);
          gg2.addColorStop(0, 'rgba(255,255,255,0.45)'); gg2.addColorStop(0.5, col2); gg2.addColorStop(1, 'rgba(0,0,0,0.35)');
          c.fillStyle = gg2; c.beginPath(); c.arc(bx2, by2, S * 0.013, 0, TAU); c.fill();
        }
      }
    } else if (spec.fruit === 'pod') {
      /* ★ GOLD AUDIT — ORCHID PODS: clusters of LONG bean-like green pods
         hanging together from the vine nodes, not one hidden blob */
      for (const i of [10, 17]) {
        const [sx, sy] = pts[i]!;
        c.lineCap = 'round';
        for (let k = -1; k <= 1; k++) {
          c.strokeStyle = k ? (spec.fhue ?? '#5a7a3c') : '#4a6a30';
          c.lineWidth = S * 0.011;
          c.beginPath(); c.moveTo(sx, sy);
          c.quadraticCurveTo(sx + k * S * 0.013, sy + S * 0.05, sx + k * S * 0.020, sy + S * 0.088 - Math.abs(k) * S * 0.012);
          c.stroke();
        }
      }
    } else if (spec.fruit && spec.fruit !== 'none') {
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
    let topAnchor = H;   /* ★ WAVE 67 — where the flower/fruit sit; a squat barrel lowers it */
    if (spec.leaf === 'scale') {
      /* ★ WAVE 67 — GLASSWORT/SAMPHIRE: articulated columns of tiny fleshy
         SAUSAGE JOINTS with opposite candelabra branching, red-flushed at the
         older tips — not one sealed spindle (gp3/5, both species). */
      const branch = (bx: number, ang: number, segs: number, sw: number, depth2: number): void => {
        let px2 = bx, py2 = base, a2 = ang;
        for (let k2 = 0; k2 < segs; k2++) {
          const u2 = k2 / segs;
          const sl = H * 0.085 * (1 - u2 * 0.3);
          const nx2 = px2 + Math.cos(a2) * sl, ny2 = py2 + Math.sin(a2) * sl;
          const old = u2 > 0.62;
          const gg2 = c.createLinearGradient(px2 - sw, py2, px2 + sw, py2);
          gg2.addColorStop(0, old ? '#b04a30' : p.dark); gg2.addColorStop(0.5, old ? '#d86844' : p.base); gg2.addColorStop(1, old ? '#8a3424' : p.dark);
          c.fillStyle = gg2;
          /* one sausage joint: a rounded capsule with a visible waist between joints */
          c.beginPath(); c.ellipse((px2 + nx2) / 2, (py2 + ny2) / 2, sw, sl * 0.62, a2 + Math.PI / 2, 0, TAU); c.fill();
          /* candelabra: a side pair at 1/3 and 2/3 up the main stems */
          if (depth2 === 0 && (k2 === Math.floor(segs / 3) || k2 === Math.floor(segs * 2 / 3))) {
            for (const s2 of [-1, 1] as const) branch(nx2, a2 + s2 * 0.55, Math.max(3, segs - k2 - 2), sw * 0.8, 1);
          }
          px2 = nx2; py2 = ny2; a2 += (nvf(name, 0x30 + k2 + depth2 * 16, 0.16) - 1) * 0.5;
        }
      };
      for (const t2 of [-1, 0, 1]) branch(cx + t2 * S * 0.055, -Math.PI / 2 + t2 * 0.22, 8, S * 0.020, t2 === 0 ? 0 : 1);
    } else if (spec.leaf === 'pad') {
      /* ★ GOLD AUDIT — PRICKLY PEAR is a STACK OF JOINTED PADS growing off
         each other's rims, not four pad leaves fanned from the soil. */
      const pr0 = S * 0.105 * spread;
      const pads: Array<[number, number, number, number]> = [
        [cx, base - pr0 * 0.9, pr0, 0],
        [cx - pr0 * 0.95, base - pr0 * 2.15, pr0 * 0.82, -0.38],
        [cx + pr0 * 0.88, base - pr0 * 2.05, pr0 * 0.78, 0.42],
        [cx - pr0 * 0.25, base - pr0 * 3.15, pr0 * 0.62, -0.08],
      ];
      for (const [px2, py2, pr2, pa] of pads) {
        const gg2 = c.createRadialGradient(px2 - pr2 * 0.3, py2 - pr2 * 0.35, pr2 * 0.2, px2, py2, pr2 * 1.3);
        gg2.addColorStop(0, p.lit); gg2.addColorStop(0.6, p.base); gg2.addColorStop(1, p.dark);
        c.fillStyle = gg2;
        c.beginPath(); c.ellipse(px2, py2, pr2 * 0.70, pr2, pa, 0, TAU); c.fill();
        c.fillStyle = 'rgba(238,226,180,0.85)';   /* the glochid dots */
        for (let k2 = 0; k2 < 8; k2++) {
          const aa = (k2 / 8) * TAU + pa + 0.3;
          c.beginPath(); c.arc(px2 + Math.cos(aa) * pr2 * 0.44, py2 + Math.sin(aa) * pr2 * 0.66, 1.7, 0, TAU); c.fill();
        }
        if (spec.thorns) {
          c.strokeStyle = '#e8dcbe'; c.lineWidth = 1.6;
          for (let k2 = 0; k2 < 7; k2++) {
            const aa = -Math.PI * 0.85 + (k2 / 6) * Math.PI * 0.7 + pa;
            const sx2 = px2 + Math.cos(aa) * pr2 * 0.66, sy2 = py2 + Math.sin(aa) * pr2 * 0.94;
            c.beginPath(); c.moveTo(sx2, sy2); c.lineTo(sx2 + Math.cos(aa) * 8, sy2 + Math.sin(aa) * 8); c.stroke();
          }
        }
      }
      topAnchor = pr0 * 3.6;
    } else {
      /* ★ WAVE 67 — a non-tall column is a squat accordion BARREL (barrel
         cactus): far wider, shorter, more ribs. */
      const barrel = !spec.tall;
      const w = S * (barrel ? 0.175 : 0.055) * spread;
      const HB = barrel ? H * 0.48 : H;
      topAnchor = HB;
      const gg = c.createLinearGradient(cx - w, 0, cx + w, 0);
      gg.addColorStop(0, p.dark); gg.addColorStop(0.42, p.base); gg.addColorStop(1, p.dark);
      c.fillStyle = gg;
      c.beginPath();
      c.moveTo(cx - w, base);
      c.quadraticCurveTo(cx - w * 1.15, base - HB * 0.6, cx, base - HB);
      c.quadraticCurveTo(cx + w * 1.15, base - HB * 0.6, cx + w, base);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,40,20,0.30)'; c.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        c.beginPath(); c.moveTo(cx + i * w * 0.28, base);
        c.quadraticCurveTo(cx + i * w * 0.24, base - HB * 0.6, cx + i * w * 0.08, base - HB * 0.95); c.stroke();
      }
      if (spec.thorns) {
        c.strokeStyle = '#e8dcbe'; c.lineWidth = 1.8;
        for (let i = 0; i < 26; i++) {
          const u = r(), yy = base - u * HB, s = r() < 0.5 ? -1 : 1;
          const xx = cx + s * w * (1 - u * 0.35);
          c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + s * 9, yy - 4); c.stroke();
        }
      }
    }
    if (spec.flower && spec.flower !== 'none') drawFlower(c, p, cx, base - topAnchor * 1.02, S * 0.032, spec.flower, spec.fhue, r);
    if (spec.fruit && spec.fruit !== 'none') drawFruit(c, p, cx + S * 0.03, base - topAnchor * 0.9, S * 0.030, spec.fruit, spec.fhue, r);
  } else if (spec.habit === 'fern') {
    /* a rosette of clearly ARCHING fronds — spread wide and drawn from a
       low crown so they read as a fern, not a spiny ball (Nick's review) */
    const shuttle = !!spec.tall;   /* ★ POLISH — sword fern: an upright shuttlecock crown */
    const nf = shuttle ? 9 : 6;
    for (let i = 0; i < nf; i++) {
      const a = -Math.PI / 2 + ((i / (nf - 1)) - 0.5) * (shuttle ? 1.0 : 2.1) * spread;
      drawLeaf(c, p, cx, base - S * 0.01, a, H * (shuttle ? 1.0 : 0.86), 'frond');
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
    if (spec.leaf === 'pad' && spec.mat) {
      /* ★ GOLD AUDIT — DUCKWEED is a dense mat of TINY floating fronds, not
         three lily pads. Dozens of paired dots scattered on the waterline. */
      const wl = base - S * 0.06;
      c.fillStyle = 'rgba(28,52,78,0.55)';
      c.beginPath(); c.ellipse(cx, wl + S * 0.03, S * 0.32 * spread, S * 0.035, 0, 0, TAU); c.fill();
      for (let i = 0; i < 34; i++) {
        const px = cx + (r() - 0.5) * S * 0.56 * spread, py = wl + (r() - 0.5) * S * 0.030;
        const pr = S * (0.010 + r() * 0.008);
        c.fillStyle = i % 3 ? p.base : p.lit;
        /* each frond is a 2-3 lobed cluster of tiny discs */
        for (let k2 = 0; k2 < 2 + (i % 2); k2++) {
          c.beginPath(); c.ellipse(px + k2 * pr * 1.4, py + (k2 % 2) * pr * 0.5, pr, pr * 0.72, 0, 0, TAU); c.fill();
        }
      }
      c.strokeStyle = 'rgba(160,205,240,0.30)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, wl + S * 0.012, S * 0.34 * spread, S * 0.030, 0, 0, TAU); c.stroke();
    } else if (spec.leaf === 'pad') {
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
      /* ★ WAVE 66 — flowerN doubles as BLADE COUNT here: Sugar Kelp's must-read
         is ONE unbranched ribbon "never split into fingers" (flowerN 1), while
         Dulse's hand reads as several lobes. */
      const blades = Math.max(1, spec.flowerN ?? (spec.leaf === 'frond' ? 3 : 2));
      for (let b = 0; b < blades; b++) {
        const t = blades === 1 ? 0 : (b / (blades - 1)) - 0.5;
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
    } else if (spec.flowerN === 1) {
      /* ★ WAVE 67 — BULL KELP: one long whip STIPE to a single round BULB
         float, with a streamer of blades pouring off the bulb. The defining
         onion-bulb was absent from the strap bundle.
         ★ GOLD AUDIT — beefed: the bulb is now LARGE and the streamers are
         broad trailing ribbons, so "stipe → float → blades" reads at a glance. */
      holdfast(c, cx, base, barkCol);
      const topX = cx + S * 0.06, topY2 = base - H * 0.94;
      c.strokeStyle = p.dark; c.lineWidth = S * 0.016; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx, base);
      c.quadraticCurveTo(cx - S * 0.05, base - H * 0.5, topX, topY2); c.stroke();
      const bg2 = c.createRadialGradient(topX - 7, topY2 - 7, 3, topX, topY2, S * 0.065);
      bg2.addColorStop(0, p.lit); bg2.addColorStop(1, p.dark);
      c.fillStyle = bg2; c.beginPath(); c.arc(topX, topY2, S * 0.060, 0, TAU); c.fill();
      for (let i = 0; i < 6; i++) {   /* the blade streamers off the bulb */
        const t2 = (i / 5) - 0.5;
        c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = S * 0.026; c.lineCap = 'round';
        c.beginPath(); c.moveTo(topX + t2 * S * 0.03, topY2 - S * 0.04);
        c.quadraticCurveTo(topX + t2 * S * 0.22, topY2 - S * 0.13, topX + t2 * S * 0.36 + S * 0.06, topY2 + S * 0.01 + Math.abs(t2) * S * 0.06);
        c.stroke();
      }
    } else if (spec.leaf === 'lance') {
      /* ★ GOLD AUDIT round 3 — SARGASSUM densified: "still reads as sparse
         upright twigs". Six ARCHING fronds, a leaflet + bladder at EVERY
         node, so the mass reads as a bushy weed, not twigs. */
      holdfast(c, cx, base, barkCol);
      for (let f = 0; f < 6; f++) {
        const u = (f / 5) - 0.5;
        const sway = u * S * 0.26 * spread;
        const topF = 0.55 + r() * 0.30;
        c.strokeStyle = f % 2 ? p.base : p.dark; c.lineWidth = S * 0.009; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx + u * S * 0.03, base);
        c.bezierCurveTo(cx + sway * 0.4, base - H * 0.35, cx + sway * 1.3, base - H * 0.60, cx + sway * 1.5, base - H * topF);
        c.stroke();
        for (let k2 = 1; k2 <= 9; k2++) {   /* a leaflet AND a bladder at every node */
          const v = k2 / 10, mx = cx + u * S * 0.03 + sway * 1.35 * v, my = base - H * topF * v * (1.02 - v * 0.10);
          const la = (k2 % 2 ? 1 : -1) * 0.9 - Math.PI / 2;
          drawLeaf(c, p, mx + Math.cos(la) * S * 0.016, my + Math.sin(la) * S * 0.012, la, S * 0.038, 'lance');
          c.fillStyle = p.lit;
          c.beginPath(); c.arc(mx - Math.cos(la) * S * 0.012, my, S * 0.010, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(60,48,20,0.5)'; c.lineWidth = 1;
          c.beginPath(); c.arc(mx - Math.cos(la) * S * 0.012, my, S * 0.010, 0, TAU); c.stroke();
          c.strokeStyle = f % 2 ? p.base : p.dark; c.lineWidth = S * 0.009;
        }
      }
    } else if ((name === 'Kelp' || name === 'Giant Kelp') && spec.leaf === 'blade' && spec.tall) {
      /* ★ GP7 — KELP/GIANT KELP are not upright spear-leaves. A long,
         flexible STIPE carries many broad LATERAL blades, each lifted by a
         pneumatocyst at its base. Giant Kelp is deliberately taller, wider,
         and more highly branched than Kelp. This name gate keeps Bull Kelp's
         single terminal float and Seagrass's narrow straps on their own axes. */
      const giant = name === 'Giant Kelp';
      const stipes = giant ? 4 : 3;
      const nodes = giant ? 5 : 4;
      const height0 = H * (giant ? 1.03 : 0.84);
      const spread0 = S * (giant ? 0.25 : 0.18) * spread;

      /* A dark, readable crown and seven gripping haptera make the holdfast
         survive the thumbnail fit instead of collapsing to one pinched point. */
      holdfast(c, cx, base, barkCol);
      c.fillStyle = p.dark;
      c.beginPath(); c.ellipse(cx, base - S * 0.006, S * 0.035, S * 0.020, 0, 0, TAU); c.fill();
      c.strokeStyle = p.dark; c.lineWidth = S * 0.010; c.lineCap = 'round';
      for (let h = -3; h <= 3; h++) {
        c.beginPath(); c.moveTo(cx + h * S * 0.004, base);
        c.quadraticCurveTo(cx + h * S * 0.020, base + S * 0.016, cx + h * S * 0.034, base + S * 0.036);
        c.stroke();
      }

      for (let f = 0; f < stipes; f++) {
        const t = (f / (stipes - 1)) - 0.5;
        const h = height0 * (0.88 + (1 - Math.abs(t)) * 0.12 + r() * 0.04);
        const drift = t * spread0;
        const phase = f * 1.65 + (giant ? 0.35 : 0.8);
        const P = (v: number): [number, number] => [
          cx + t * S * 0.022 + drift * v + Math.sin(v * 4.2 + phase) * S * (giant ? 0.040 : 0.032) * v,
          base - h * v,
        ];

        /* The stipe remains visible between blade nodes: a cord, not a leaf. */
        c.strokeStyle = f % 2 ? p.base : p.dark;
        c.lineWidth = S * (giant ? 0.012 : 0.010); c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath();
        for (let k2 = 0; k2 <= 24; k2++) {
          const [px2, py2] = P(k2 / 24);
          if (k2) c.lineTo(px2, py2); else c.moveTo(px2, py2);
        }
        c.stroke();

        for (let k2 = 0; k2 < nodes; k2++) {
          const v = 0.24 + k2 * ((giant ? 0.70 : 0.64) / (nodes - 1));
          const [sx2, sy2] = P(v);
          const side = (k2 + f) % 2 ? 1 : -1;
          const branchL = S * (giant ? 0.050 : 0.042);
          const bx2 = sx2 + side * branchL;
          const by2 = sy2 - S * (0.006 + 0.008 * (1 - v));

          /* A short side branch ends in the bladder; the blade starts there,
             making the anatomical relationship legible at catalogue scale. */
          c.strokeStyle = f % 2 ? p.base : p.dark;
          c.lineWidth = S * 0.009;
          c.beginPath(); c.moveTo(sx2, sy2);
          c.quadraticCurveTo(sx2 + side * branchL * 0.55, sy2 - S * 0.014, bx2, by2);
          c.stroke();

          const br = S * (giant ? 0.015 : 0.013);
          const bg = c.createRadialGradient(bx2 - br * 0.35, by2 - br * 0.35, 1, bx2, by2, br);
          bg.addColorStop(0, p.lit); bg.addColorStop(1, p.dark);
          c.fillStyle = bg; c.beginPath(); c.arc(bx2, by2, br, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(45,34,12,0.70)'; c.lineWidth = 1;
          c.beginPath(); c.arc(bx2, by2, br, 0, TAU); c.stroke();

          if (giant) {
            /* Frozen GP7 PASS path: keep Giant Kelp pixel-identical while the
               ordinary Kelp blade below gets its own stricter silhouette. */
            const bladeL = S * 0.165 * (0.92 + r() * 0.12);
            const bladeW = S * 0.040;
            const angle = side > 0
              ? -0.52 + (v - 0.5) * 0.18
              : Math.PI + 0.52 + (v - 0.5) * 0.18;
            c.save(); c.translate(bx2, by2); c.rotate(angle);
            c.fillStyle = (k2 + f) % 3 ? p.base : p.lit;
            c.beginPath(); c.moveTo(0, -bladeW * 0.16);
            c.bezierCurveTo(bladeL * 0.28, -bladeW * 0.82, bladeL * 0.70, -bladeW * 0.95, bladeL, 0);
            c.bezierCurveTo(bladeL * 0.72, bladeW * 0.86, bladeL * 0.28, bladeW * 0.66, 0, bladeW * 0.16);
            c.closePath(); c.fill();
            c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = S * 0.005;
            c.beginPath(); c.moveTo(br * 0.5, 0); c.quadraticCurveTo(bladeL * 0.52, -bladeW * 0.08, bladeL * 0.90, 0); c.stroke();
            c.restore();
          } else {
            /* GP7 final Kelp refinement: these are broad, flexible STRAPS,
               not tidy alternating lance leaves. Each ribbon first kicks
               away from its bladder, then the same rightward current bends
               every distal half into an asymmetric two-wave flutter. */
            const bladeL = S * 0.190 * (0.94 + r() * 0.10);
            const bladeW = S * (0.052 + ((k2 + f) % 2) * 0.005);
            const flutter = (((k2 * 2 + f) % 3) - 1) * bladeW * 0.34;
            const neck = side * S * 0.032;
            const tipY = flutter - S * (0.006 + k2 * 0.002);
            c.save(); c.translate(bx2, by2);
            c.rotate(-0.16 + (k2 - 1.5) * 0.045 + (f - 1) * 0.025);
            c.fillStyle = (k2 + f) % 3 ? p.base : p.lit;
            c.beginPath(); c.moveTo(0, -bladeW * 0.18);
            c.bezierCurveTo(neck, -bladeW * 0.64,
              bladeL * 0.27, -bladeW * 1.08,
              bladeL * 0.46, -bladeW * 0.52 + flutter * 0.22);
            c.bezierCurveTo(bladeL * 0.64, -bladeW * 0.06 + flutter,
              bladeL * 0.84, -bladeW * 0.90 + flutter,
              bladeL, tipY);
            c.bezierCurveTo(bladeL * 0.83, bladeW * 0.70 + flutter,
              bladeL * 0.62, bladeW * 0.16 + flutter,
              bladeL * 0.43, bladeW * 0.70 + flutter * 0.22);
            c.bezierCurveTo(bladeL * 0.25, bladeW * 1.04,
              neck * 0.30, bladeW * 0.60,
              0, bladeW * 0.18);
            c.closePath(); c.fill();
            c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = S * 0.005;
            c.beginPath(); c.moveTo(br * 0.50, 0);
            c.bezierCurveTo(bladeL * 0.29, -bladeW * 0.18,
              bladeL * 0.55, bladeW * 0.11 + flutter * 0.42,
              bladeL * 0.91, tipY * 0.82);
            c.stroke();
            c.restore();
          }
        }
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
      if (wrack) {   /* the Y-FORK at 60%: two short diverging tips (gp6) */
        const fy2 = base - H * topFrac * 0.6, fx2 = cx + sway * 0.6;
        c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = S * 0.014; c.lineCap = 'round';
        for (const sgn2 of [-1, 1] as const) {
          c.beginPath(); c.moveTo(fx2, fy2);
          c.quadraticCurveTo(fx2 + sgn2 * S * 0.02, fy2 - H * 0.14, fx2 + sgn2 * S * 0.035 + sway * 0.3, fy2 - H * 0.26); c.stroke();
        }
      }
      if (wrack) {   /* PAIRED air bladders flanking the midrib, not on the centreline */
        c.fillStyle = p.lit;
        for (let k = 1; k <= 3; k++) { const v = k / 3.5, mx = cx + sway * v, my = base - H * v * topFrac;
          for (const sgn of [-1, 1] as const) { c.beginPath(); c.ellipse(mx + sgn * S * 0.018, my, S * 0.012, S * 0.016, 0, 0, TAU); c.fill(); } }
      } else if (spec.leaf === 'blade') {
        /* ★ GOLD AUDIT — GIANT KELP/KELP: each strap is a STIPE carrying
           broad blades, each blade with a gas bladder at its base — "a
           bundle of narrow rods" was the failed read. */
        for (let k2 = 1; k2 <= 3; k2++) {
          const v = 0.30 + (k2 / 3) * 0.62;
          const mx = cx + sway * v * 1.05, my = base - H * topFrac * v;
          const bside = (k2 % 2 ? 1 : -1);
          c.fillStyle = p.lit;   /* the bladder at the blade's base */
          c.beginPath(); c.arc(mx, my, S * 0.013, 0, TAU); c.fill();
          /* the blade: a broad tapering ribbon angling up-and-out */
          const ba = -Math.PI / 2 + bside * (0.55 + v * 0.3);
          const bl = H * 0.16, bw2 = S * 0.020;
          const ex2 = mx + Math.cos(ba) * bl, ey2 = my + Math.sin(ba) * bl;
          c.fillStyle = i % 2 ? p.base : p.dark;
          c.beginPath();
          c.moveTo(mx, my - bw2 * 0.4);
          c.quadraticCurveTo((mx + ex2) / 2 + bside * bw2 * 1.6, (my + ey2) / 2, ex2, ey2);
          c.quadraticCurveTo((mx + ex2) / 2 - bside * bw2 * 0.4, (my + ey2) / 2 + bw2, mx, my + bw2 * 0.6);
          c.closePath(); c.fill();
        }
      }
    }
    }
  } else if (spec.habit === 'rosette' && spec.cushion) {
    /* ★ WAVE 67 — THE CUSHION ALPINES. gp3/5 failed both for the inverted
       habit: "a tight low cushion… with stemless flowers", "the flower sits
       flat on bare ground with NO visible stem". A low dome of dense tiny
       foliage, wider than tall, flowers sitting directly ON the mound. */
    const mw = S * 0.30 * spread, mh = S * 0.10;
    const my = base - mh * 0.4;
    /* the mound body */
    const mg = c.createRadialGradient(cx - mw * 0.2, my - mh * 0.5, 3, cx, my, mw);
    mg.addColorStop(0, p.lit); mg.addColorStop(0.6, p.base); mg.addColorStop(1, p.dark);
    c.fillStyle = mg;
    c.beginPath(); c.ellipse(cx, my, mw, mh, 0, Math.PI, TAU); c.lineTo(cx + mw, base); c.lineTo(cx - mw, base); c.closePath(); c.fill();
    /* dense tiny foliage packing the dome */
    for (let i = 0; i < 90; i++) {
      const a = Math.PI + r() * Math.PI, d = Math.sqrt(r());
      const lx = cx + Math.cos(a) * mw * d * 0.96, ly = my + Math.sin(a) * mh * d * 0.9;
      drawLeaf(c, p, lx, ly, r() * TAU, S * 0.016 + r() * S * 0.008, spec.leaf === 'lance' ? 'needle' : 'scale');
    }
    /* STEMLESS flowers sitting directly on the cushion */
    if (spec.flower && spec.flower !== 'none') {
      const nFl = 5 + (r() * 3 | 0);
      for (let i = 0; i < nFl; i++) {
        const a = Math.PI + (0.15 + (i / nFl) * 0.7) * Math.PI + (r() - 0.5) * 0.2;
        const fx = cx + Math.cos(a) * mw * (0.3 + r() * 0.6), fy = my + Math.sin(a) * mh * 0.8;
        drawFlower(c, p, fx, fy, S * 0.026, spec.flower, spec.fhue, r);
      }
    }
  } else if (spec.habit === 'rosette') {
    /* leaves radiating from a crown at ground level — dandelion, aloe, cabbage.
       ★ WAVE 58 — the old fan was a HARD MIRROR at even angles (the judge's
       "stiff symmetric radial fan of sword blades"). Jittered per node off the
       name, and an arrow/heart rosette is held on erect STALKS (taro), not
       splayed flat. */
    const erect = spec.leaf === 'arrow' || spec.leaf === 'heart' || spec.leaf === 'crinkle';
    const nL = erect ? 5 : leafN + 3;   /* ★ GP6 — five spaced blades, not a bunched mass */
    for (let i = 0; i < nL; i++) {
      const t = (i / (nL - 1)) - 0.5;
      const jit = (nvf(name, 0x90 + i * 7, 0.5) - 1);
      /* erect species stand their blades UP in a tight arc; flat rosettes splay wide */
      const a = -Math.PI / 2 + t * (erect ? 2.0 : 2.7) * spread + jit * (erect ? 0.3 : 1);
      const L = H * ((erect ? 0.7 : 0.52) + r() * 0.24);
      if (erect) {   /* a visible leaf-stalk carrying the blade up and out */
        const sx = cx + t * S * 0.07, tipX = cx + Math.sin(t * 1.6) * S * 0.26 * spread, tipY = base - L * (1 - Math.abs(t) * 0.25);
        c.strokeStyle = stemCol; c.lineWidth = S * 0.009; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(sx, base - L * 0.5, tipX, tipY); c.stroke();
        drawLeaf(c, p, tipX, tipY, -Math.PI / 2 + t * 0.55 + jit * 0.25, L * 0.62, spec.leaf, toothed);
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
    if (spec.groundFruit && spec.fruit) {
      /* ★ GOLD AUDIT — PEANUT: the pods sit half-buried AT THE SOIL LINE,
         drawn first so the stems overlay them */
      for (let i = 0; i < 4; i++) {
        const px = cx + (i - 1.5) * S * 0.055 + (nvf(name, 0x71 + i, 0.5) - 1) * S * 0.02;
        c.fillStyle = i % 2 ? (spec.fhue ?? '#c8a870') : '#b8975c';
        c.beginPath(); c.ellipse(px, base + S * 0.010, S * 0.018, S * 0.010, 0.2, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(120,90,50,0.55)'; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(px, base + S * 0.010, S * 0.018, S * 0.010, 0.2, 0, TAU); c.stroke();
        c.beginPath(); c.moveTo(px, base + S * 0.002); c.lineTo(px, base + S * 0.018); c.stroke();   /* the waist */
      }
    }
    if (spec.leaf === 'perfoliate') {
      /* ★ GOLD AUDIT — MINER'S LETTUCE: each slender stem ends in ONE round
         saucer pierced by the stem, tiny white flowers standing up out of it.
         The generic ladder stacked the saucers up a single stem — "vertical
         stacked-disc form is wrong". */
      for (let w = 0; w < 6; w++) {
        const t = (w / 5) - 0.5;
        const tipX = cx + t * S * 0.26 + lean * S * 0.03;
        const tipY = base - H * (0.50 + (0.5 - Math.abs(t)) * 0.45);
        c.strokeStyle = stemCol; c.lineWidth = S * 0.007; c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx + t * S * 0.03, base);
        c.quadraticCurveTo(cx + t * S * 0.14, base - (base - tipY) * 0.5, tipX, tipY); c.stroke();
        const pr = S * (0.040 + (nvf(name, 0x91 + w, 0.3) - 1) * 0.010);
        c.fillStyle = leafGrad(c, p, tipX, tipY, pr);
        c.beginPath(); c.ellipse(tipX, tipY, pr, pr * 0.55, t * 0.3, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(20,40,20,0.35)'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(tipX, tipY, pr, pr * 0.55, t * 0.3, 0, TAU); c.stroke();
        c.strokeStyle = stemCol; c.lineWidth = S * 0.005;   /* the stem pierces on through */
        c.beginPath(); c.moveTo(tipX, tipY); c.lineTo(tipX + S * 0.004, tipY - S * 0.034); c.stroke();
        c.fillStyle = spec.fhue ?? '#f4f6ef';
        for (let k = 0; k < 3; k++) {
          c.beginPath(); c.arc(tipX + (k - 1) * S * 0.009, tipY - S * 0.036 - (k === 1 ? S * 0.006 : 0), S * 0.006, 0, TAU); c.fill();
        }
      }
      return;
    }
    if (arch === 'arch') {
      /* ★ WAVE 66 — SOLOMON'S SEAL: one cane rising then ARCHING over to the
         side; alternate leaves in one flat plane along its top; the bells
         dangle in a row UNDERNEATH the curve. gp3/5 failed it for being bolt
         upright with the flowers above the foliage. */
      const A = (t: number): [number, number] => [    /* the cane, 0 root → 1 tip */
        cx - S * 0.18 + t * S * 0.46,
        base - Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.52) * H * 0.95 + t * t * H * 0.28];
      c.strokeStyle = stemCol; c.lineWidth = S * 0.009; c.lineCap = 'round';
      c.beginPath(); c.moveTo(...A(0));
      for (let i = 1; i <= 20; i++) c.lineTo(...A(i / 20));
      c.stroke();
      for (let i = 0; i < 8; i++) {                    /* leaves along the TOP */
        const t = 0.22 + (i / 8) * 0.72;
        const [lx2, ly2] = A(t);
        const [nx2, ny2] = A(Math.min(1, t + 0.05));
        const ang2 = Math.atan2(ny2 - ly2, nx2 - lx2);
        drawLeaf(c, p, lx2, ly2, ang2 - 0.55, S * 0.085 * nvf(name, 0x77 + i, 0.15), spec.leaf);
      }
      if (spec.flower && spec.flower !== 'none') {     /* bells dangle BENEATH */
        for (let i = 0; i < 5; i++) {
          const t = 0.34 + (i / 5) * 0.58;
          const [fx2, fy2] = A(t);
          c.strokeStyle = 'rgba(120,140,110,0.8)'; c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(fx2, fy2); c.lineTo(fx2, fy2 + S * 0.035); c.stroke();
          const bw2 = S * 0.014;
          c.fillStyle = spec.fhue ?? '#f2f4ea';
          c.beginPath(); c.moveTo(fx2 - bw2, fy2 + S * 0.035);
          c.quadraticCurveTo(fx2 - bw2 * 1.2, fy2 + S * 0.062, fx2, fy2 + S * 0.068);
          c.quadraticCurveTo(fx2 + bw2 * 1.2, fy2 + S * 0.062, fx2 + bw2, fy2 + S * 0.035);
          c.closePath(); c.fill();
        }
      }
      return;
    }
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
      if (spec.fruit === 'clawpod') {
        /* ★ GOLD AUDIT — the grapnel pods lie ON THE GROUND beside the mat,
           drawn BIG: the hooks are the whole reason the plant has its name */
        drawFruit(c, p, cx + S * 0.20, base - S * 0.020, S * 0.052, 'clawpod', spec.fhue, r);
        drawFruit(c, p, cx - S * 0.25, base - S * 0.016, S * 0.044, 'clawpod', spec.fhue, r);
      } else drawFruit(c, p, wd.tipX, base - (base - wd.tipY) * 0.92, S * 0.032, spec.fruit, spec.fhue, r);
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
    /* ★ POLISH — the red vein NETWORK, dense and branching at the THROAT */
    c.strokeStyle = 'rgba(168,36,42,0.78)'; c.lineWidth = 1.8;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(px + k * w * 0.30, base - H * 0.08);
      c.lineTo(px + k * w * 0.66, base - H * 0.94);
      c.stroke();
      /* throat branches forking off each vein in the upper third */
      for (const bf of [0.72, 0.84]) {
        c.beginPath(); c.moveTo(px + k * w * (0.30 + 0.36 * bf), base - H * bf);
        c.lineTo(px + k * w * 0.66 + (k >= 0 ? 1 : -1) * w * 0.34, base - H * (bf + 0.09)); c.stroke();
      }
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
