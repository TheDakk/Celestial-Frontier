/* invertoverrides.ts — THE MORPHOLOGY PASS, wave 10b: THE INVERTEBRATES.
   The last large uncovered block: ~67 arthropods and ~22 soft-bodied and
   radial animals. Wave 3 gave beetles, dragonflies, the springtail, the
   fiddler crab and the horseshoe crab real bodies and they scored well, so
   they are deliberately ABSENT here (D-ART-14).

   Body plans, not decorations — an arthropod is legible almost entirely
   from its TAGMATA (how many body sections) and its LEG COUNT:
     · insect     3 sections · 6 legs · antennae
     · arachnid   2 sections · 8 legs · NO antennae
     · myriapod   many segments, a leg pair on each
     · crab       one wide carapace, claws forward, 8 walking legs
     · shrimp     a curled abdomen ending in a tail fan
   and the soft-bodied ones from how they hold water: a worm's segments, a
   slug's foot and cerata, a jelly's bell and trailing tentacles, a coral's
   branching, a sponge's tube.

   Every key was read out of the catalog (the wave-7 lesson) and is checked
   by tools/overridecheck.mjs; the shadow check keeps it from re-covering
   what waves 3 and 7 already own. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { speciesHue } from './surface.js';
import { ellipseTube } from './torso.js';
import { coatMaterial } from './skin.js';

/** the cost dial for arthropod shell — see BIRD_MAT_DETAIL / FISH_MAT_DETAIL.
    Lower than the others on purpose: chitin is SMOOTH, so its material is a
    handful of seams and one tight specular rather than a thousand hairs. */
const CHITIN_DETAIL = 1;

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type PainterI = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

function nseed(name: string): number {
  let h = 0x1B7F;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return h >>> 0;
}
const nrng = (g: G, name: string, salt: number): (() => number) => mulberry32((((g.seed as number) ^ nseed(name) ^ salt) >>> 0));
/* THE BUCKET BUG: this helper quantised the name hash to 1,000 buckets, so
   at 650 species two names sharing a spec collided by birthday — the audit's
   duplicate sentinel caught Copepod = Tadpole Shrimp. It uses the full 32-bit
   hash now, and the same one-line fix was applied to every wave that copied
   it (7, 8, 9, 10a, 10b). */
/** THE AVALANCHE. XOR-ing a small salt into a hash and dividing by 2^32
    perturbs only the lowest bits, so every "independent" variation axis
    collapsed to the same number and near-neighbour names produced
    near-identical animals. Mix the salt in with a large odd multiplier and
    scramble, so one bit of change rewrites the whole value. */
function mixSalt(h: number, salt: number): number {
  let x = (h ^ Math.imul(salt | 1, 0x9E3779B1)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7FEB352D) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846CA68B) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x >>> 0;
}
const nv = (name: string, salt: number, amt: number): number =>
  1 + (mixSalt(nseed(name), salt) / 4294967296 - 0.5) * 2 * amt;

/** ★ WAVE 12 — SPECIES-TRUE COLOUR. None of the invertebrate families could
    say what colour the animal is, so every one of them took its rarity roll and
    the only thing separating two identical specs was a name hash. Colour is the
    cheapest strong separator there is, and for a krill or a water flea —
    translucent things with visible innards — it is most of the identity. */
/* ★ WAVE 42, CODE PASS — THE SPECIES-HUE FIX EXISTED TWICE, DRIFTED. This local
   copy used 1.32/1.30/1.28 and 0.42/0.44/0.48 while surface.ts's speciesHue —
   the one the rest of the catalogue uses — used 1.30/1.29/1.27 and
   0.43/0.45/0.48, and this file's ten painters were split five-and-five between
   them. Two implementations of one idea drift silently; the v1.8.6 size clamp
   is the incident this project already paid for that lesson with.
   `hued` now DELEGATES rather than being deleted outright, so the five call
   sites keep their local name and there is exactly one implementation. The
   coefficient change is sub-1% and artlock is the check on it. */
function hued(pIn: Pal, hue?: string): Pal {
  return speciesHue(pIn, hue);
}

function shadow(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.42)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.026, 0, 0, TAU); c.fill();
}
function shell(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.40, 2, x, y, r * 1.18);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.58, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function rim(c: Ctx, path: () => void, w = 2): void {
  c.save(); c.strokeStyle = 'rgba(212,226,246,0.38)'; c.lineWidth = w;
  c.beginPath(); path(); c.stroke(); c.restore();
}
function softMark(c: Ctx, x: number, y: number, rx: number, ry: number, rgb: string, a: number, rot = 0): void {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, ry / rx);
  const gg = c.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
  gg.addColorStop(0, `rgba(${rgb},${a})`); gg.addColorStop(0.55, `rgba(${rgb},${a * 0.8})`);
  gg.addColorStop(0.82, `rgba(${rgb},${a * 0.32})`); gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
function eyeDot(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#0d1017'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.32, r * 0.30, 0, TAU); c.fill();
}
/** a jointed limb — D-ART-31, which is even more of the read on a spider */
function limb(c: Ctx, x0: number, y0: number, x1: number, y1: number, kx: number, ky: number, w: number, col: string): void {
  c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = w * 0.62;
  c.beginPath(); c.moveTo(kx, ky); c.lineTo(x1, y1); c.stroke();
}

/* ═══════════════ INSECTS: three tagmata, six legs, antennae ═══════════════ */
export interface InsectSpec {
  /** the species' own colour, where the real insect's colour is its identity */
  hue?: string;
  wings?: 'none' | 'folded' | 'open' | 'lace'
    /* ★ wave 39 — held TENT-LIKE over the back at rest, which is a cicada's
       mustRead and was failing against an explicit instruction in its row. */
    | 'tent';
  /* ★ wave 21 — the audit on the wasp: "lacks clearly readable wings". A folded
     wing scaled off the abdomen is invisible on a species whose wings extend
     well past it. */
  wingScale?: number;
  waist?: boolean;            /** the wasp/ant petiole */
  abdomen: number;            /** abdomen length multiplier */
  antennae?: 'short' | 'long' | 'feather' | 'none'
    /* ★ wave 41 G7 — the ant's geniculate ELBOW (one of its three mustReads)
       and the butterfly's CLUBBED tip, which is what tells it from a moth. */
    | 'elbow' | 'club';
  sting?: boolean;
  raptor?: boolean;           /** mantis forelegs */
  jumper?: boolean;           /** the huge hind femur of a grasshopper */
  stick?: boolean;            /** absurdly elongated everything */
  /** ★ wave 12 — THE LEGS ALONE ARE THE ANIMAL. A water strider's middle and
      hind legs are several times its body and splayed flat on the surface film;
      it shared a picture with a MITE until it could say so. `stick` elongates
      the whole insect, which is a different creature entirely. */
  legSpan?: number;
  fuzzy?: boolean;            /** the bee/bumblebee pile */
  /* ★ WAVE 22 — THE THREE AXES THE INSECTS WERE MISSING.
     Ant, Leafcutter Ant, Cockroach, Cricket, Cicada, Black Fly and
     Cold-Adapted Insect all went HARD look-alike the moment they were given
     honest colours, and the specs show exactly why: every one was the same
     body plan with a different `abdomen` length. The family had a LENGTH dial
     and nothing else — no width, no head size, no thorax shield — so seven
     genuinely unalike animals were one silhouette at seven sizes, and colour
     was being asked to carry a distinction it cannot carry. */
  broad?: number;             /** body WIDTH — a cockroach is a flat oval, an ant is not */
  eyes?: number;              /** head and eye size — a fly is mostly eye */
  shield?: boolean;           /** the pronotal shield a cockroach pulls over its head */
  /* ★ D-ART-126 — WHAT WAVE 23 SHOULD HAVE ADDED. `broad` scales segment
     HEIGHT, so it made the three beads TALLER and left the family reading as
     one plan at different lengths — the hard-pair ratchet went green while the
     defect stood. A cockroach, a water bug and a beetle are not a chain of
     beads at all: thorax and abdomen are ONE flattened shield. */
  carapace?: boolean;         /** fuse thorax + abdomen into a single flat oval */
  face?: 'slant' | 'triangle';/** an orthopteran's tilted wedge; a mantis's triangle */
  proboscis?: boolean;        /** the mosquito's needle */
  pattern?: 'bands' | 'spots';
  /** A thrips' wing is a narrow strap fringed with setae, not a fly membrane. */
  fringedWings?: boolean;
  /** The asymmetrical rasping cone at a thrips' face. */
  raspingMouth?: boolean;
}
export function insectBody(c: Ctx, g: G, pIn: Pal, spec: InsectSpec, name = ''): void {
  /* ★ D-ART-114 — the species hue axis. 26 insects took the rarity roll purely
     because this painter had no field for a colour; `hued` was already here. */
  const p = hued(pIn, spec.hue);
  const r = nrng(g, name, 0x15EC);
  const cx = S * 0.50, cy = S * 0.52;
  const sc = (spec.stick ? 1.35 : 1) * nv(name, 0x11, 0.10);
  const BR = spec.broad ?? 1;                 /* ★ wave 22 — body WIDTH */
  const folded: Array<() => void> = [];       /* ★ D-ART-122 — wings drawn after the body */
  const th = S * 0.052 * sc * (spec.stick ? 0.42 : 1);          /* thorax half-height */
  /* the abdomen-to-thorax RATIO, which survives the fit pass where a shared
     overall scale would not */
  const abL = S * 0.105 * spec.abdomen * sc * nv(name, 0x12, 0.18);
  shadow(c, cx, cy + th * 2.6, S * 0.15);

  /* ── six legs: three a side, jointed, the middle pair splayed widest ── */
  const legCol = p.dark;
  /* ★ D-ART-119 — THE JUMPING FEMUR WAS INVISIBLE. It was drawn here, in the
     leg pass, in BODY COLOUR at th*0.95 x th*0.42 centred barely a third of a
     thorax-height off the midline — and this whole pass runs BEFORE the body,
     deliberately, so the roots hide under the flank. The torso then painted
     straight over it. A grasshopper's hind femur IS its silhouette, and it has
     never once been on screen. Collected here and drawn after the body. */
  const femurs: Array<[number, number]> = [];
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const bx = cx - th * 0.8 + i * th * 0.9;
      const spread = (0.9 + i * 0.32) * th * (spec.stick ? 3.2 : 1.9) * (spec.legSpan ?? 1);
      const drop = th * (1.5 + i * 0.30) * (spec.legSpan ? 0.55 : 1);
      const jump = spec.jumper && i === 2;
      if (jump) {   /* THE JUMPING FEMUR — a grasshopper's whole silhouette */
        femurs.push([bx + s * th * 0.95, s]);
        limb(c, bx + s * th * 0.9, cy + th * 0.5, bx + s * spread * 0.7, cy + drop * 1.5,
          bx + s * spread * 1.25, cy + th * 0.1, 4.2, legCol);
      } else {
        limb(c, bx, cy + th * 0.5, bx + s * spread * 0.72, cy + drop,
          bx + s * spread, cy + th * (spec.stick ? -0.6 : 0.1), spec.stick ? 3 : 4, legCol);
      }
    }
  }
  if (spec.raptor) {   /* THE MANTIS STRIKE — folded, spined, held up front */
    for (const s of [-1, 1] as const) {
      const ox = cx - th * 1.5, oy = cy - th * 0.2;
      /* ★ WAVE 39 — THE STRIKE ARM WAS A BARE LINE. Its verifier: "a thin bent
         Z-shaped foreleg IS drawn, so 'no raptorial forelegs' overstates — but
         it is a bare line with no spines and no thickness, and it does not read
         as an arm folded in prayer." A mantis's femur is the thickest part of
         the animal; drawn at the same 6px weight as its walking legs it cannot
         be the feature it is. Laid down as a heavy femur first, with the thin
         jointed limb over it. */
      const fem = (x1: number, y1: number, x2: number, y2: number, w: number): void => {
        c.strokeStyle = `rgb(${(p.cr * 0.86) | 0},${(p.cg * 0.90) | 0},${(p.cb * 0.72) | 0})`;
        c.lineWidth = w; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      };
      fem(ox, oy, ox - th * 2.3, oy - th * 0.4, th * 0.62);          /* coxa -> femur */
      fem(ox - th * 2.3, oy - th * 0.4, ox - th * 1.1, oy + th * 1.5, th * 0.44);  /* tibia, folded back */
      limb(c, ox, oy, ox - th * 2.3, oy - th * 0.4, ox - th * 1.1, oy + th * 1.5, 6, p.base);
      c.strokeStyle = 'rgba(30,24,16,0.5)'; c.lineWidth = 1.6;
      for (let k = 0; k < 5; k++) {
        const u = k / 5;
        c.beginPath();
        c.moveTo(ox - th * (1.1 + u * 1.2), oy + th * (1.5 - u * 1.9));
        c.lineTo(ox - th * (1.1 + u * 1.2) - 5, oy + th * (1.5 - u * 1.9) + 6); c.stroke();
      }
      void s; break;   /* one visible foreleg reads better than two overlapping */
    }
  }

  /* ── wings, behind the body ── */
  if (spec.wings && spec.wings !== 'none') {
    const open = spec.wings === 'open';
    const tent = spec.wings === 'tent';
    /* an OPEN wing is a display surface, not a flap: scale it off the THORAX
       and give it a real span. Sized off the abdomen it came out smaller
       than the body it hangs from. */
    const ws = spec.wingScale ?? 1;
    /* ★ D-ART-122 — A FOLDED WING THAT NEVER CLEARED THE BODY. At abL*1.25
       anchored back near the thorax, the tip fell SHORT of the abdomen tip,
       and the whole wing block is drawn BEFORE the abdomen — so the body then
       painted over it. Every bee, bumblebee, orchid bee and black fly came
       back from the audit as "a small pale membrane wrapped over the abdomen,
       mostly occluded, nothing projecting past the body outline". A wing that
       does not break the silhouette is not a wing. */
    const wl = (open ? th * 5.2 : abL * 1.95) * ws;
    const wh = (open ? th * 2.9 : th * 0.85) * (ws > 1 ? 1.25 : 1);
    for (const s of [-1, 1] as const) {
      /* ★ WAVE 39 — a TENT wing pitches steeply and sits high, so the pair
         meets over the spine and forms a roof down the abdomen; 'folded' lies
         nearly flat (0.16 rad) and reads as wings spread out sideways. */
      c.save(); c.translate(cx + th * (open ? -0.1 : 0.4), cy - th * (open ? 0.5 : tent ? 0.92 : 0.35));
      c.rotate(open ? s * 0.30 : tent ? s * 0.52 : s * 0.16);
      const wing = (L: number, H: number, tilt: number, alpha: number): void => {
        c.save(); c.rotate(tilt);
        c.fillStyle = spec.wings === 'lace' ? `rgba(226,238,255,${alpha * 0.62})` : `rgba(${p.cr},${p.cg},${p.cb},${alpha})`;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(L * 0.30, -H * 1.05, L * 0.86, -H * 0.62);
        c.quadraticCurveTo(L * 1.12, -H * 0.05, L * 0.72, H * 0.52);
        c.quadraticCurveTo(L * 0.30, H * 0.62, 0, 0);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(240,246,255,0.34)'; c.lineWidth = 1.3;   /* the venation */
        for (let k = -1; k <= 2; k++) {
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, k * H * 0.28, L * 0.90, k * H * 0.34); c.stroke();
        }
        c.restore();
      };
      if (open) {
        wing(wl * 0.78, wh * 0.72, 0.62, 0.62);          /* the HINDWING, behind */
        wing(wl, wh, -0.10, 0.78);                        /* the FOREWING, larger */
        if (spec.pattern === 'spots') {                   /* eyespots ride the wing */
          for (const k of [0.42, 0.68]) softMark(c, wl * k, -wh * 0.30, wh * 0.28, wh * 0.28, '28,22,16', 0.42);
        }
      } else {
        /* deferred — a folded wing lies ON TOP of the abdomen, so it cannot be
           painted before it. Captured here and run after the body below. */
        const sx = s;
        folded.push(() => {
          c.save(); c.translate(cx + th * 0.4, cy - th * 0.35); c.rotate(sx * 0.16);
          wing(wl, wh, 0, 0.62);
          /* the HINDWING, shorter and offset, so a bee reads as four-winged */
          wing(wl * 0.60, wh * 0.72, 0.26, 0.42);
          c.restore();
        });
      }
      c.restore();
    }
  }

  /* ── abdomen ── */
  /* ★ WAVE 38, G7 — THE PETIOLE WAS DRAWN AND THEN COVERED UP. `waist` is set
     on Ant, Leafcutter Ant and Wasp, the stroke below runs, and the abdomen
     ellipse then lands on top of it: at `th*1.1 + abL*0.45` its rear edge sits
     within a few pixels of the thorax, so there was no daylight for a "thread
     you can see daylight through" to show in. The Leafcutter Ant's verifier:
     "no pinched petiole waist — the three beads abut directly".
     A new D-ART-100 shape, and the nastiest yet: the field is set, the branch
     IS taken, the geometry IS drawn, and it is occluded by a later shape. No
     gate here can see that; only a render can.
     Setting the gaster back opens the gap the petiole needs, and it is what a
     wasp actually looks like. Only the three waisted species move. */
  const ax = cx + th * (spec.waist ? 1.95 : 1.1) + abL * 0.45;
  if (spec.waist) {   /* the petiole: a thread you can see daylight through */
    c.strokeStyle = p.dark; c.lineWidth = th * 0.28; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + th * 0.85, cy + th * 0.1); c.lineTo(ax - abL * 0.42, cy + th * 0.16); c.stroke();
  }
  /* ★ D-ART-126 — ONE SHIELD, not two beads plus a waist. */
  if (spec.carapace) {
    const CL = (abL * 0.52 + th * 1.15) * 1.06, CH = th * 0.86 * BR;
    const ccx = (ax + cx) / 2 + th * 0.10;
    c.fillStyle = shell(c, p, ccx, cy + th * 0.10, CL);
    c.beginPath(); c.ellipse(ccx, cy + th * 0.10, CL, CH, 0.02, 0, TAU); c.fill();
    rim(c, () => c.ellipse(ccx, cy + th * 0.10, CL, CH, 0.02, -2.8, 0.3));
    if (!spec.fuzzy) {
      c.save();
      c.beginPath(); c.ellipse(ccx, cy + th * 0.10, CL, CH, 0.02, 0, TAU); c.clip();
      coatMaterial(c, ellipseTube(ccx, cy + th * 0.10, CL, CH, 0.02), r, p, 'chitin',
        { detail: CHITIN_DETAIL, seams: false });
      c.restore();
    }
    /* the wing-case seam down the midline — the elytra join */
    c.strokeStyle = 'rgba(0,0,0,0.34)'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(ccx - CL * 0.55, cy + th * 0.06); c.lineTo(ccx + CL * 0.86, cy + th * 0.14); c.stroke();
  }
  c.fillStyle = shell(c, p, ax, cy + th * 0.1, abL * 0.5);
  if (!spec.carapace) { c.beginPath(); c.ellipse(ax, cy + th * 0.12, abL * 0.52, th * (spec.stick ? 0.6 : 0.92) * BR, 0.06, 0, TAU); c.fill(); }
  /* ⚠ and the rim arc RAN UNDER THE THORAX. -2.8 starts on the upper-left of
     the abdomen, exactly where the thorax overlaps it, so the light outline
     surfaced as the "pale seam arc" the audit named. Started clear of the
     overlap it still lights the free edge and can no longer draw a seam. */
  rim(c, () => c.ellipse(ax, cy + th * 0.12, abL * 0.52, th * (spec.stick ? 0.6 : 0.92) * BR, 0.06, -1.9, 0.3));
  /* ★ WAVE 21 — SHELL. The abdomen is the largest flat area on an insect and
     it carried a plain gradient. Chitin's read is segment seams plus a tight
     specular, NOT texture — an insect's cuticle is smooth, so the fur-style
     treatment that suits a mammal would be actively wrong here. Skipped on a
     fuzzy body: a bumblebee's pile is drawn just below and shell seams under
     fur is a contradiction. */
  if (!spec.fuzzy) {
    const abTube = ellipseTube(ax, cy + th * 0.12, abL * 0.52, th * (spec.stick ? 0.6 : 0.92) * BR, 0.06);
    c.save();
    c.beginPath(); c.ellipse(ax, cy + th * 0.12, abL * 0.52, th * (spec.stick ? 0.6 : 0.92) * BR, 0.06, 0, TAU); c.clip();
    coatMaterial(c, abTube, r, p, 'chitin', { detail: CHITIN_DETAIL });
    c.restore();
  }
  if (spec.pattern === 'bands') {
    for (let i = 0; i < 4; i++) softMark(c, ax - abL * 0.34 + i * abL * 0.26, cy + th * 0.12, abL * 0.11, th * 0.85, '24,20,12', 0.55);
  } else if (spec.pattern === 'spots') {
    for (let i = 0; i < 9; i++) softMark(c, ax - abL * 0.4 + r() * abL * 0.85, cy + th * 0.12 + (r() - 0.5) * th, 5 + r() * 4, 4 + r() * 3, '26,20,12', 0.42);
  }
  if (spec.fuzzy) {   /* the pile — a bee is FURRY, and that is most of a bee */
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.6 + 90 | 0)},${Math.min(255, p.cg * 0.6 + 80 | 0)},${Math.min(255, p.cb * 0.5 + 40 | 0)},0.7)`;
    c.lineWidth = 2;
    for (let i = 0; i < 46; i++) {
      const a = r() * TAU, d = 0.75 + r() * 0.35;
      const hx = cx + Math.cos(a) * th * 1.05 * d, hy = cy + Math.sin(a) * th * 1.05 * d;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8); c.stroke();
    }
  }
  if (spec.sting) {
    c.fillStyle = '#2b2119';
    c.beginPath(); c.moveTo(ax + abL * 0.5, cy + th * 0.12);
    c.lineTo(ax + abL * 0.5 + th * 0.9, cy + th * 0.3); c.lineTo(ax + abL * 0.48, cy + th * 0.42); c.closePath(); c.fill();
  }

  /* ── thorax + head ── */
  const TW = th * 1.15, TH2 = th * 0.95 * BR;
  c.fillStyle = shell(c, p, cx, cy, TW);
  c.beginPath(); c.ellipse(cx, cy, TW, TH2, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, TW, TH2, 0, -2.8, 0.3));
  /* ★ WAVE 22 — the head scales with `eyes`, and a shielded species tucks it
     UNDER the pronotum. On a cockroach the head is barely visible from above,
     which is most of why a cockroach does not read as an ant. */
  const EY = spec.eyes ?? 1;
  const hx = cx - th * (spec.shield ? 1.42 : 1.75), hy = cy - th * 0.12;
  c.fillStyle = shell(c, p, hx, hy, th * 0.78 * EY);
  /* ★ D-ART-126 — THE FACE. A glossy sphere is a fly's head and nothing else's.
     A grasshopper's is a long backward-slanting wedge; a mantis's is a wide
     triangle with the eyes at its upper corners. Both were reported as "the
     same round glossy sphere used on the Locust and the Mosquito". */
  if (spec.face === 'slant') {
    const HW = th * 0.72 * EY, HH = th * 1.02 * EY;
    c.beginPath();
    c.moveTo(hx - HW * 0.9, hy - HH * 0.55);
    c.quadraticCurveTo(hx + HW * 0.7, hy - HH * 0.75, hx + HW * 0.85, hy + HH * 0.25);
    c.quadraticCurveTo(hx + HW * 0.2, hy + HH * 0.72, hx - HW * 0.75, hy + HH * 0.35);
    c.closePath(); c.fill();
  } else if (spec.face === 'triangle') {
    const HW = th * 1.02 * EY, HH = th * 0.86 * EY;
    c.beginPath();
    c.moveTo(hx - HW * 0.85, hy - HH * 0.62);
    c.lineTo(hx + HW * 0.85, hy - HH * 0.52);
    c.lineTo(hx + HW * 0.05, hy + HH * 0.88);
    c.closePath(); c.fill();
  } else {
    c.beginPath(); c.ellipse(hx, hy, th * 0.78 * EY, th * 0.70 * EY, 0, 0, TAU); c.fill();
  }
  eyeDot(c, hx - th * 0.30 * EY, hy - th * 0.22 * EY, th * 0.24 * EY);
  if (spec.shield) {
    c.fillStyle = shell(c, p, cx - th * 0.55, cy - th * 0.1, TW * 0.8);
    c.beginPath(); c.ellipse(cx - th * 0.62, cy - th * 0.06, TW * 0.82, TH2 * 0.92, 0, 0, TAU); c.fill();
    rim(c, () => c.ellipse(cx - th * 0.62, cy - th * 0.06, TW * 0.82, TH2 * 0.92, 0, -2.8, 0.3));
  }
  /* ★ D-ART-122 — the folded wings, now over the abdomen and past its tip. */
  for (const w of folded) w();
  /* ★ D-ART-119 — the jumping femur, now ON TOP of the body and big enough to
     be the silhouette it is meant to be: a pear of muscle rising ABOVE the
     back line, in a darker tone so it separates from the flank behind it. */
  for (const [fx, fs2] of femurs) {
    c.save();
    c.translate(fx, cy - th * 0.10);
    c.rotate(fs2 * 0.62);
    const fg = c.createLinearGradient(0, -th * 1.1, 0, th * 0.9);
    fg.addColorStop(0, p.base);
    fg.addColorStop(1, p.dark);
    c.fillStyle = fg;
    c.beginPath(); c.ellipse(0, 0, th * 1.55, th * 0.72, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.34)'; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(0, 0, th * 1.55, th * 0.72, 0, 0, TAU); c.stroke();
    /* the herringbone ridging on a real orthopteran femur */
    c.strokeStyle = 'rgba(0,0,0,0.20)'; c.lineWidth = 1;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.moveTo(k * th * 0.42, -th * 0.5);
      c.lineTo(k * th * 0.42 + th * 0.22, th * 0.5);
      c.stroke();
    }
    c.restore();
  }
  if (spec.proboscis) {
    /* ★ D-ART-126 — nothing projected forward of a mosquito's face at all. */
    c.strokeStyle = p.dark; c.lineWidth = Math.max(2, th * 0.14); c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx - th * 0.5, hy + th * 0.20);
    c.lineTo(hx - th * 2.1, hy + th * 0.62); c.stroke();
  }
  if (spec.raspingMouth) {
    /* Thrips feed with one-sided rasping/sucking cones.  It must break the
       head silhouette; a symmetric generic mouth reads as an aphid. */
    c.fillStyle = 'rgba(48,38,24,0.92)';
    c.beginPath();
    c.moveTo(hx - th * 0.52, hy - th * 0.16);
    c.lineTo(hx - th * 1.46, hy + th * 0.14);
    c.lineTo(hx - th * 0.48, hy + th * 0.38);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(238,226,188,0.42)'; c.lineWidth = Math.max(1, th * 0.08);
    c.beginPath(); c.moveTo(hx - th * 0.52, hy + th * 0.10); c.lineTo(hx - th * 1.32, hy + th * 0.15); c.stroke();
  }
  if (spec.fringedWings) {
    /* The normal lace-wing path is a broad fly sail.  Thrips carry two very
       narrow straps whose long marginal hairs are visible at card size. */
    c.strokeStyle = 'rgba(226,230,214,0.72)'; c.lineWidth = Math.max(2.0, th * 0.20); c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      const x0 = cx + th * 0.32, y0 = cy + s * th * 0.34;
      const x1 = ax + abL * 0.72, y1 = cy + s * th * 0.66;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) * 0.5, y0 - s * th * 0.25, x1, y1); c.stroke();
      c.strokeStyle = 'rgba(236,238,220,0.64)'; c.lineWidth = Math.max(1, th * 0.055);
      for (let i = 1; i < 10; i++) {
        const u = i / 10, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + th * 0.20, y + s * th * 0.42); c.stroke();
      }
      c.strokeStyle = 'rgba(226,230,214,0.72)'; c.lineWidth = Math.max(2.0, th * 0.20);
    }
  }
  const ant = spec.antennae ?? 'short';
  if (ant !== 'none') {
    c.strokeStyle = p.dark; c.lineWidth = ant === 'feather' ? 3 : 2.4; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      const L = th * (ant === 'long' ? 3.4 : ant === 'club' ? 3.0 : ant === 'elbow' ? 2.5 : ant === 'feather' ? 2.0 : 1.5);
      const ex = hx - L, ey = hy - th * 0.6 + s * th * 0.34 - L * 0.28;
      c.beginPath(); c.moveTo(hx - th * 0.5, hy - th * 0.35);
      c.quadraticCurveTo(hx - L * 0.6, hy - th * 0.9 + s * th * 0.2, ex, ey); c.stroke();
      if (ant === 'feather') {   /* the moth's plumed antenna */
        c.lineWidth = 1.4;
        for (let k = 1; k <= 6; k++) {
          const u = k / 7, px = hx - th * 0.5 + (ex - (hx - th * 0.5)) * u, py = hy - th * 0.35 + (ey - (hy - th * 0.35)) * u;
          c.beginPath(); c.moveTo(px, py); c.lineTo(px + 6, py - 7); c.stroke();
          c.beginPath(); c.moveTo(px, py); c.lineTo(px - 3, py - 8); c.stroke();
        }
        c.lineWidth = 3;
      }
      /* ★ WAVE 41, G7 — TWO ANTENNAE THAT ARE NOT BARE STICKS. The gold pass:
         the ant's are "two straight bare sticks with no ELBOW" (a hymenopteran
         antenna is geniculate — a long first segment then a sharp bend, and it
         is one of the ant's three mustReads), and the butterfly's want a CLUB
         at the tip, which is what separates a butterfly from a moth at a
         glance. Both were drawn as one plain curve for every insect. */
      if (ant === 'elbow') {
        /* the scape runs out straight, then the funicle bends down and forward */
        c.beginPath();
        c.moveTo(ex, ey);
        c.quadraticCurveTo(ex - L * 0.30, ey + th * 0.30, ex - L * 0.16, ey + th * 0.92);
        c.stroke();
      } else if (ant === 'club') {
        c.fillStyle = p.dark;
        c.beginPath(); c.ellipse(ex, ey, th * 0.24, th * 0.17, -0.5, 0, TAU); c.fill();
      }
    }
  }
}

/* ═══════════════ ARACHNIDS: two tagmata, eight legs, NO antennae ═══════════════ */
export function arachnid(c: Ctx, g: G, pIn: Pal, opts: { big?: boolean; hairy?: boolean; sting?: boolean;
  longleg?: boolean; claws?: boolean; hue?: string; scale?: number;
  /** species-gated reach multiplier for animals whose leg span is the identity */
  legReach?: number;
  /* ★ WAVE 65 — ONE FUSED BODY. A mite and a harvestman are a single rounded
     blob (no two spheres, no pinched waist); both were failing as "the spider
     chassis recoloured". */
  fused?: boolean;
  /** two lateral eyes raised on the dorsal ocular tubercle of a harvestman */
  ocularTurret?: boolean;
  /** Ground-up non-spider chassis for the two acariform target species. */
  anatomy?: 'tick' | 'mite' | 'solifuge';
  /** Long, leg-like sensory pedipalps (tarantula and solifuge). */
  pedipalps?: boolean;
  /** Down-facing cheliceral fangs rather than a visible spider eye cluster. */
  fangs?: boolean }, name = ''): void {
  const p = hued(pIn, opts.hue);
  const r = nrng(g, name, 0xA8AC);
  const cx = S * 0.50, cy = S * 0.52;
  const b = S * 0.050 * (opts.big ? 1.25 : 1) * 1.30 * (opts.scale ?? 1) * nv(name, 0x21, 0.12);
  const squat = nv(name, 0x22, 0.22);         /* abdomen aspect — a RATIO, so the fit pass keeps it */
  const splay = nv(name, 0x23, 0.20);         /* how far the legs reach relative to the body */
  if (opts.anatomy === 'tick' || opts.anatomy === 'mite') {
    /* A tick/mite is not a compressed spider. Both need one continuous low
       acarine body with every leg rooted in its anterior third. */
    const tick = opts.anatomy === 'tick';
    const L = b * (tick ? 4.55 : 3.25), H = b * (tick ? 1.05 : 1.30);
    const front = cx - L * 0.60, rear = cx + L * 0.56;
    shadow(c, cx, cy + H * 2.0, L * 0.72);
    c.strokeStyle = p.dark; c.lineCap = 'round';
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < 4; i++) {
        const u = 0.11 + i * 0.105;
        const ox = front + L * u, oy = cy + side * H * (0.18 + i * 0.08);
        const kx = ox - L * (0.14 + i * 0.020), ky = cy + side * H * (1.10 + i * 0.24);
        const ex = ox - L * (0.34 - i * 0.025), ey = cy + side * H * (1.58 + i * 0.20);
        limb(c, ox, oy, ex, ey, kx, ky, tick ? 3.8 : 4.4, p.dark);
      }
    }
    c.fillStyle = shell(c, p, cx, cy, L * 0.6);
    c.beginPath();
    c.moveTo(front, cy);
    c.quadraticCurveTo(front + L * 0.12, cy - H * 0.92, front + L * 0.55, cy - H);
    c.quadraticCurveTo(rear + L * 0.10, cy - H * 0.72, rear, cy);
    c.quadraticCurveTo(rear + L * 0.10, cy + H * 0.72, front + L * 0.55, cy + H);
    c.quadraticCurveTo(front + L * 0.12, cy + H * 0.92, front, cy);
    c.closePath(); c.fill();
    rim(c, () => { c.moveTo(front, cy); c.quadraticCurveTo(front + L * 0.12, cy - H * 0.92, front + L * 0.55, cy - H); c.quadraticCurveTo(rear + L * 0.10, cy - H * 0.72, rear, cy); }, 2);
    if (tick) {
      c.fillStyle = `rgba(${p.cr * 0.44 | 0},${p.cg * 0.42 | 0},${p.cb * 0.40 | 0},0.72)`;
      c.beginPath(); c.ellipse(front + L * 0.46, cy - H * 0.34, L * 0.18, H * 0.42, -0.12, 0, TAU); c.fill();
      /* Capitulum, palps and the barbed hypostome project ahead of the wedge. */
      c.strokeStyle = '#2a2018'; c.lineWidth = Math.max(2.2, H * 0.30);
      c.beginPath(); c.moveTo(front + L * 0.05, cy); c.lineTo(front - L * 0.34, cy); c.stroke();
      c.strokeStyle = 'rgba(210,184,138,0.86)'; c.lineWidth = Math.max(1.2, H * 0.12);
      for (const side of [-1, 1] as const) {
        c.beginPath(); c.moveTo(front + L * 0.07, cy + side * H * 0.22); c.lineTo(front - L * 0.17, cy + side * H * 0.36); c.stroke();
      }
      c.strokeStyle = '#2a2018'; c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const x = front - L * (0.15 + i * 0.07);
        c.beginPath(); c.moveTo(x, cy); c.lineTo(x + L * 0.06, cy - H * 0.22); c.stroke();
        c.beginPath(); c.moveTo(x, cy); c.lineTo(x + L * 0.06, cy + H * 0.22); c.stroke();
      }
    } else {
      /* A mite's tiny mouth cone is enough; no eyes or waist are permitted. */
      c.fillStyle = p.dark; c.beginPath(); c.moveTo(front + L * 0.05, cy - H * 0.20); c.lineTo(front - L * 0.20, cy); c.lineTo(front + L * 0.05, cy + H * 0.20); c.closePath(); c.fill();
    }
    return;
  }
  shadow(c, cx, cy + b * 2.4, S * 0.16);
  const reach = b * (opts.legReach ?? (opts.longleg ? 8.2 : 2.9)) * splay;   /* the span IS the animal */
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {                 /* EIGHT legs — the count is the read */
      const a = -0.75 + i * 0.52;
      const ox = cx - b * 0.4 + i * b * 0.34;
      const kx = ox + s * Math.cos(a) * reach * 0.62, ky = cy - b * 0.55 - Math.sin(a) * reach * 0.30;
      /* ★ GOLD AUDIT — cos() is symmetric, so legs 1&4 and 2&3 landed at the
         SAME horizontal reach and eight legs read as four. The plain spider's
         feet now fan RADIALLY (front pair up-forward, rear pair down-back);
         hairy/longleg/fused keep their judged-good geometry (D-ART-14). */
      const fan = !opts.hairy && !opts.longleg && !opts.fused;
      /* round 3 — "make all eight countable": wider fan, alternating reach so
         no two feet land together, thicker strokes */
      const rch = fan ? reach * (1.0 + (i % 2) * 0.22) : reach;
      const ex = ox + s * Math.cos(a) * rch;
      const ey = fan ? cy + b * 1.0 + Math.sin(a) * rch * 0.72 : cy + b * 1.4 + i * b * 0.18;
      /* ★ WAVE 62 — a tarantula's legs are THICK AND FURRED; lineWidth 6 with
         five hair ticks read as "identical thin bare spider legs" (gp5). */
      limb(c, ox, cy, ex, ey, kx, ky, opts.hairy ? 11 : (opts.longleg ? 2.6 : 5), p.dark);
      if (opts.hairy) {
        c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.85)`; c.lineWidth = 1.6;
        for (let k = 0; k < 14; k++) {   /* fur on BOTH leg segments, both sides */
          const u = k / 14;
          const seg1 = u < 0.5;
          const t = seg1 ? u * 2 : (u - 0.5) * 2;
          const px = seg1 ? ox + (kx - ox) * t : kx + (ex - kx) * t;
          const py = seg1 ? cy + (ky - cy) * t : ky + (ey - ky) * t;
          c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * 7, py - 6); c.stroke();
          c.beginPath(); c.moveTo(px, py); c.lineTo(px - s * 5, py + 6); c.stroke();
        }
      }
    }
  }
  if (opts.claws) {   /* the scorpion/pseudoscorpion pedipalps */
    for (const s of [-1, 1] as const) {
      const px = cx - b * 1.9, py = cy + s * b * 0.85;
      c.strokeStyle = p.dark; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - b * 0.7, cy + s * b * 0.3); c.lineTo(px, py); c.stroke();
      c.fillStyle = shell(c, p, px, py, b * 0.7);
      c.beginPath(); c.ellipse(px - b * 0.35, py, b * 0.62, b * 0.34, s * 0.3, 0, TAU); c.fill();
      c.strokeStyle = p.dark; c.lineWidth = 4;
      c.beginPath(); c.moveTo(px - b * 0.8, py - b * 0.16); c.lineTo(px - b * 1.5, py - b * 0.34); c.stroke();
      c.beginPath(); c.moveTo(px - b * 0.8, py + b * 0.10); c.lineTo(px - b * 1.45, py + b * 0.02); c.stroke();
    }
  }
  /* the abdomen — bulbous on a spider, a segmented TAIL on a scorpion */
  if (opts.sting) {
    let tx = cx + b * 1.0, ty = cy + b * 0.1;
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      tx += b * 0.42; ty -= b * (0.10 + u * 0.62);
      c.fillStyle = shell(c, p, tx, ty, b * 0.34);
      c.beginPath(); c.ellipse(tx, ty, b * (0.36 - u * 0.10), b * (0.32 - u * 0.09), -0.5 - u, 0, TAU); c.fill();
    }
    c.fillStyle = '#2a2018';   /* the telson */
    c.beginPath(); c.moveTo(tx + b * 0.2, ty - b * 0.1);
    c.quadraticCurveTo(tx + b * 0.9, ty - b * 0.5, tx + b * 0.35, ty - b * 1.05);
    c.quadraticCurveTo(tx + b * 0.2, ty - b * 0.4, tx - b * 0.1, ty - b * 0.2); c.closePath(); c.fill();
  } else if (opts.fused) {
    /* ★ WAVE 65 — one single rounded body, no waist: the mite/harvestman read */
    const bodyRy = b * 1.25 / squat;
    c.fillStyle = shell(c, p, cx, cy, b * 1.4);
    c.beginPath(); c.ellipse(cx + b * 0.2, cy, b * 1.55 * squat, bodyRy, 0.05, 0, TAU); c.fill();
    rim(c, () => c.ellipse(cx + b * 0.2, cy, b * 1.55 * squat, bodyRy, 0.05, -2.8, 0.3));
    for (let i = 0; i < 8; i++) softMark(c, cx - b + r() * b * 2.4, cy + (r() - 0.5) * b * 1.8, 5 + r() * 4, 4 + r() * 3, '24,18,12', 0.3);
    if (opts.ocularTurret) {
      /* A harvestman's two eyes do not make a face: they sit on one raised
         dorsal mound. Keep this opt-in so the mite's judged-good fused body is
         byte-identical. */
      const tx = cx - b * 0.05, ty = cy - bodyRy * 0.86;
      c.fillStyle = shell(c, p, tx, ty, b * 0.34);
      c.beginPath(); c.ellipse(tx, ty, b * 0.36, b * 0.29, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(244,246,242,0.28)'; c.lineWidth = Math.max(1, b * 0.07);
      c.beginPath(); c.ellipse(tx, ty, b * 0.36, b * 0.29, 0, -2.75, -0.38); c.stroke();
      for (const side of [-1, 1] as const) {
        const ex = tx + side * b * 0.27, ey = ty - b * 0.015;
        c.fillStyle = '#141619'; c.beginPath(); c.arc(ex, ey, b * 0.105, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.82)';
        c.beginPath(); c.arc(ex - b * 0.032, ey - b * 0.036, b * 0.031, 0, TAU); c.fill();
      }
    } else {
      eyeDot(c, cx - b * 0.9, cy - b * 0.4, b * 0.12);
      eyeDot(c, cx - b * 0.9, cy - b * 0.12, b * 0.12);
    }
  } else {
    const ax = cx + b * 1.15;
    c.fillStyle = shell(c, p, ax, cy + b * 0.12, b * 1.1);
    c.beginPath(); c.ellipse(ax, cy + b * 0.12, b * 1.15 * squat, b * 0.98 / squat, 0.05, 0, TAU); c.fill();
    rim(c, () => c.ellipse(ax, cy + b * 0.12, b * 1.15 * squat, b * 0.98 / squat, 0.05, -2.8, 0.3));
    for (let i = 0; i < 10; i++) softMark(c, ax - b + r() * b * 2, cy + b * 0.12 + (r() - 0.5) * b * 1.6, 6 + r() * 5, 5 + r() * 4, '24,18,12', 0.36);
  }
  if (!opts.fused) {
  /* the cephalothorax and the EIGHT eyes */
  c.fillStyle = shell(c, p, cx - b * 0.5, cy - b * 0.1, b);
  c.beginPath(); c.ellipse(cx - b * 0.45, cy, b * 1.0, b * 0.86, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx - b * 0.45, cy, b * 1.0, b * 0.86, 0, -2.9, 0.25));
  for (let i = 0; i < 4; i++) {
    eyeDot(c, cx - b * 1.15 + (i % 2) * b * 0.26, cy - b * 0.34 + Math.floor(i / 2) * b * 0.26, b * 0.11);
  }
  }
  if (opts.pedipalps) {
    /* Distinct from the eight walking legs: these leave the facial plate and
       lead forward as extra feeler-limbs. */
    for (const side of [-1, 1] as const) {
      const ox = cx - b * 1.02, oy = cy + side * b * 0.34;
      limb(c, ox, oy, cx - b * 3.00, cy + side * b * 1.35,
        cx - b * 2.12, cy + side * b * 0.54, opts.hairy ? 5.2 : 4.0, p.dark);
    }
  }
  if (opts.fangs) {
    /* Fangs hang below the front plate, not out of a generic mouth line. */
    c.fillStyle = '#19120f';
    for (const side of [-1, 1] as const) {
      c.beginPath(); c.moveTo(cx - b * 1.20, cy + side * b * 0.20);
      c.lineTo(cx - b * 1.58, cy + side * b * 0.70);
      c.lineTo(cx - b * 1.02, cy + side * b * 0.44); c.closePath(); c.fill();
    }
  }
  if (opts.anatomy === 'solifuge') {
    /* Solifuge chelicerae are huge opposing jaws in front of the face. */
    c.fillStyle = shell(c, p, cx - b * 1.36, cy, b * 0.82);
    for (const side of [-1, 1] as const) {
      c.beginPath(); c.moveTo(cx - b * 1.08, cy + side * b * 0.12);
      c.quadraticCurveTo(cx - b * 2.05, cy + side * b * 0.18, cx - b * 2.28, cy + side * b * 0.66);
      c.lineTo(cx - b * 1.32, cy + side * b * 0.46); c.closePath(); c.fill();
    }
  }
}

/* ═══════════════ MYRIAPODS: many segments, a leg pair on each ═══════════════ */
export function myriapod(c: Ctx, g: G, pIn: Pal, opts: { flat?: boolean; coil?: boolean;
  hue?: string; segs?: number; scale?: number; legScale?: number; legContrast?: boolean }, name = ''): void {
  const p = hued(pIn, opts.hue);
  const r = nrng(g, name, 0x33DD);
  const cx = S * 0.48, cy = S * 0.52;
  /* the SEGMENT COUNT is a ratio the fit pass cannot flatten */
  /* the SEGMENT COUNT is a ratio the fit pass cannot flatten — and a giant
     centipede has visibly MORE of them than a common one, which is the only
     honest way to draw "giant" on a subject that gets fitted to the frame */
  const N = (opts.segs ?? (opts.flat ? 17 : 24)) + Math.round((nv(name, 0x32, 1) - 1) * 5);
  const segR = S * (opts.flat ? 0.028 : 0.024) * (opts.scale ?? 1) * nv(name, 0x31, 0.12);
  shadow(c, cx, cy + segR * 3.4, S * 0.20);
  const path = (i: number): [number, number] => {
    const u = i / (N - 1);
    const a = -0.5 + u * (opts.coil ? 5.2 : 1.5);
    const rad = S * (opts.coil ? 0.10 + 0.055 * u : 0.30);
    return opts.coil
      ? [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62]
      : [cx - S * 0.20 + u * S * 0.40, cy - Math.sin(u * Math.PI * 1.6) * S * 0.035];
  };
  for (let i = N - 1; i >= 0; i--) {
    const [x, y] = path(i);
    const legLen = segR * (opts.flat ? 2.6 : 1.5) * Math.min(1.35, opts.legScale ?? 1);
    c.strokeStyle = p.dark; c.lineWidth = (opts.flat ? 3 : 2.2) * (opts.legScale ?? 1); c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + s * legLen * 0.5, y + legLen * 0.7, x + s * legLen * (opts.flat ? 1.0 : 0.72), y + legLen * (opts.flat ? 0.7 : 1.0));
      c.stroke();
      if (opts.legContrast) { c.strokeStyle = p.lit; c.lineWidth = (opts.flat ? 3 : 2.2) * (opts.legScale ?? 1) * 0.54; c.stroke(); c.strokeStyle = p.dark; c.lineWidth = (opts.flat ? 3 : 2.2) * (opts.legScale ?? 1); }
    }
    c.fillStyle = shell(c, p, x, y, segR);
    c.beginPath(); c.ellipse(x, y, segR * 1.05, segR * (opts.flat ? 0.78 : 0.95), 0, 0, TAU); c.fill();
    if (i % 2 === 0) softMark(c, x, y + segR * 0.3, segR * 0.7, segR * 0.4, '22,18,12', 0.3);
  }
  const [hx, hy] = path(0);
  c.fillStyle = shell(c, p, hx, hy, segR * 1.2);
  c.beginPath(); c.ellipse(hx - segR * 0.6, hy, segR * 1.15, segR * 1.0, 0, 0, TAU); c.fill();
  eyeDot(c, hx - segR * 1.0, hy - segR * 0.28, segR * 0.20);
  c.strokeStyle = p.dark; c.lineWidth = 2.6; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(hx - segR * 1.2, hy + s * segR * 0.2);
    c.quadraticCurveTo(hx - segR * 3.0, hy + s * segR * 0.8, hx - segR * 4.0, hy + s * segR * 0.3); c.stroke();
  }
  /* SEGMENT TINT — a myriapod's plates alternate subtly along the body,
     which is what makes the segmentation read at a glance */
  for (let i = 0; i < N; i += 1) {
    if (r() < 0.45) continue;
    const [sx2, sy2] = path(i);
    softMark(c, sx2, sy2 - segR * 0.15, segR * (0.35 + r() * 0.25), segR * (0.25 + r() * 0.2),
      r() < 0.5 ? '22,16,10' : '248,240,220', 0.10 + r() * 0.12);
  }
  if (opts.flat) {   /* the centipede's venom claws */
    c.strokeStyle = '#d8a24a'; c.lineWidth = 3.4;
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(hx - segR * 1.4, hy + s * segR * 0.3);
      c.quadraticCurveTo(hx - segR * 2.4, hy + s * segR * 1.1, hx - segR * 1.9, hy + s * segR * 1.5); c.stroke();
    }
  }
}

/* ═══════════════ CRUSTACEANS ═══════════════ */
type InvertPt = readonly [number, number];
type ResetCrabIISignature = 'freshwaterCrab' | 'mudCrab' | 'ventCrab' | 'hermitCrab';

const RESET_CRAB_II: Readonly<Record<string, ResetCrabIISignature>> = Object.freeze({
  'Freshwater Crab': 'freshwaterCrab',
  'Mud Crab': 'mudCrab',
  'Vent Crab': 'ventCrab',
  'Hermit Crab': 'hermitCrab',
});

function crustTone(p: Pal, k: number, alpha = 1): string {
  const ch = (v: number): number => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgba(${ch(p.cr)},${ch(p.cg)},${ch(p.cb)},${alpha})`;
}

function crustGradient(c: Ctx, p: Pal, x: number, y: number, radius: number, alpha = 1): CanvasGradient {
  const gg = c.createRadialGradient(x - radius * 0.34, y - radius * 0.38, 2, x, y, radius * 1.22);
  gg.addColorStop(0, crustTone(p, 1.36, alpha));
  gg.addColorStop(0.56, crustTone(p, 0.94, alpha));
  gg.addColorStop(1, crustTone(p, 0.42, alpha));
  return gg;
}

/** A rooted, filled-width crustacean leg. The body is painted after the root,
    so the appendage grows from beneath the carapace rather than touching it. */
function resetCrustLeg(c: Ctx, p: Pal, root: InvertPt, knee: InvertPt, tip: InvertPt,
  width: number, paddle = 0): void {
  const legPath = (): void => {
    c.moveTo(root[0], root[1]);
    c.lineTo(knee[0], knee[1]);
    c.lineTo(tip[0], tip[1]);
  };
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = crustTone(p, 0.38, 0.98); c.lineWidth = width;
  c.beginPath(); legPath(); c.stroke();
  c.strokeStyle = crustTone(p, 0.83, 0.92); c.lineWidth = Math.max(1.6, width * 0.42);
  c.beginPath(); legPath(); c.stroke();
  c.fillStyle = crustTone(p, 0.72, 1);
  c.beginPath(); c.arc(knee[0], knee[1], Math.max(2.5, width * 0.57), 0, TAU); c.fill();
  if (paddle > 0) {
    const a = Math.atan2(tip[1] - knee[1], tip[0] - knee[0]);
    c.save(); c.translate(tip[0], tip[1]); c.rotate(a);
    c.fillStyle = crustGradient(c, p, 0, 0, width * 2.4);
    c.beginPath(); c.ellipse(width * 1.05, 0, width * (1.45 + paddle), width * (0.72 + paddle * 0.35), 0, 0, TAU); c.fill();
    c.strokeStyle = crustTone(p, 0.35, 0.78); c.lineWidth = 1.8;
    c.beginPath(); c.ellipse(width * 1.05, 0, width * (1.45 + paddle), width * (0.72 + paddle * 0.35), 0, 0, TAU); c.stroke();
    c.restore();
  }
}

function resetCrabChela(c: Ctx, p: Pal, root: InvertPt, elbow: InvertPt, palm: InvertPt,
  size: number, angle: number): void {
  resetCrustLeg(c, p, root, elbow, palm, Math.max(7, size * 0.24));
  c.save(); c.translate(palm[0], palm[1]); c.rotate(angle);
  c.fillStyle = crustGradient(c, p, -size * 0.08, 0, size);
  c.beginPath(); c.ellipse(-size * 0.08, 0, size * 0.72, size * 0.48, 0, 0, TAU); c.fill();
  c.strokeStyle = crustTone(p, 0.34, 0.82); c.lineWidth = Math.max(1.8, size * 0.055);
  c.beginPath(); c.ellipse(-size * 0.08, 0, size * 0.72, size * 0.48, 0, 0, TAU); c.stroke();
  /* Fixed finger and dactyl are filled wedges with a real gape. */
  c.fillStyle = crustTone(p, 0.82, 1);
  c.beginPath(); c.moveTo(size * 0.34, -size * 0.34);
  c.quadraticCurveTo(size * 1.15, -size * 0.62, size * 1.48, -size * 0.24);
  c.quadraticCurveTo(size * 1.03, -size * 0.27, size * 0.34, -size * 0.06); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(size * 0.34, size * 0.31);
  c.quadraticCurveTo(size * 1.13, size * 0.50, size * 1.42, size * 0.11);
  c.quadraticCurveTo(size * 0.98, size * 0.10, size * 0.34, size * 0.03); c.closePath(); c.fill();
  c.strokeStyle = crustTone(p, 0.34, 0.72); c.lineWidth = Math.max(1.5, size * 0.045);
  c.beginPath(); c.moveTo(size * 0.36, -size * 0.27); c.quadraticCurveTo(size * 0.23, 0, size * 0.36, size * 0.25); c.stroke();
  c.restore();
}

/** Compact filled chela for shrimp feeding appendages. Thin forked strokes
    disappeared at 132px; these overlapping palm/finger shapes keep the claw
    visibly joined to its rooted limb without turning it into a lobster chela. */
function resetSmallChela(c: Ctx, p: Pal, palm: InvertPt, size: number, angle: number,
  alpha = 0.92): void {
  c.save(); c.translate(palm[0], palm[1]); c.rotate(angle);
  c.fillStyle = crustGradient(c, p, -size * 0.10, 0, size, alpha);
  c.beginPath(); c.ellipse(-size * 0.08, 0, size * 0.58, size * 0.38, 0, 0, TAU); c.fill();
  c.strokeStyle = crustTone(p, 0.34, alpha); c.lineWidth = Math.max(2.2, size * 0.12);
  c.beginPath(); c.ellipse(-size * 0.08, 0, size * 0.58, size * 0.38, 0, 0, TAU); c.stroke();
  c.fillStyle = crustTone(p, 0.82, alpha);
  c.beginPath(); c.moveTo(size * 0.20, -size * 0.28);
  c.quadraticCurveTo(size * 0.86, -size * 0.50, size * 1.08, -size * 0.18);
  c.quadraticCurveTo(size * 0.74, -size * 0.18, size * 0.20, -size * 0.04); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(size * 0.20, size * 0.27);
  c.quadraticCurveTo(size * 0.82, size * 0.42, size * 1.04, size * 0.12);
  c.quadraticCurveTo(size * 0.70, size * 0.10, size * 0.20, size * 0.03); c.closePath(); c.fill();
  c.restore();
}

function resetCrabCarapace(c: Ctx, g: G, p: Pal, name: string, sig: ResetCrabIISignature,
  cx: number, cy: number, w: number, h: number): void {
  const r = nrng(g, name, 0x2C2C);
  const path = (): void => {
    if (sig === 'mudCrab') {
      c.moveTo(cx - w, cy + h * 0.04);
      c.quadraticCurveTo(cx - w * 0.93, cy - h * 0.68, cx - w * 0.53, cy - h * 0.88);
      c.quadraticCurveTo(cx, cy - h * 1.02, cx + w * 0.53, cy - h * 0.88);
      c.quadraticCurveTo(cx + w * 0.93, cy - h * 0.68, cx + w, cy + h * 0.04);
      c.quadraticCurveTo(cx + w * 0.62, cy + h * 0.77, cx, cy + h * 0.84);
      c.quadraticCurveTo(cx - w * 0.62, cy + h * 0.77, cx - w, cy + h * 0.04);
    } else if (sig === 'freshwaterCrab') {
      c.moveTo(cx - w * 0.86, cy - h * 0.72);
      c.quadraticCurveTo(cx - w, cy - h * 0.30, cx - w * 0.91, cy + h * 0.58);
      c.quadraticCurveTo(cx - w * 0.52, cy + h * 0.88, cx, cy + h * 0.90);
      c.quadraticCurveTo(cx + w * 0.52, cy + h * 0.88, cx + w * 0.91, cy + h * 0.58);
      c.quadraticCurveTo(cx + w, cy - h * 0.30, cx + w * 0.86, cy - h * 0.72);
      c.quadraticCurveTo(cx, cy - h * 0.91, cx - w * 0.86, cy - h * 0.72);
    } else {
      c.moveTo(cx - w, cy + h * 0.10);
      c.quadraticCurveTo(cx - w * 0.86, cy - h * 0.86, cx, cy - h);
      c.quadraticCurveTo(cx + w * 0.86, cy - h * 0.86, cx + w, cy + h * 0.10);
      c.quadraticCurveTo(cx + w * 0.58, cy + h * 0.82, cx, cy + h * 0.88);
      c.quadraticCurveTo(cx - w * 0.58, cy + h * 0.82, cx - w, cy + h * 0.10);
    }
    c.closePath();
  };
  c.fillStyle = crustGradient(c, p, cx - w * 0.10, cy - h * 0.18, w * 1.08);
  c.beginPath(); path(); c.fill();
  c.save(); c.beginPath(); path(); c.clip();
  const shine = c.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
  shine.addColorStop(0, 'rgba(255,255,255,0.24)'); shine.addColorStop(0.42, 'rgba(255,255,255,0.03)'); shine.addColorStop(1, 'rgba(0,0,0,0.18)');
  c.fillStyle = shine; c.fillRect(cx - w, cy - h, w * 2, h * 2);
  for (let i = 0; i < 12; i++) {
    softMark(c, cx - w * 0.68 + r() * w * 1.36, cy - h * 0.56 + r() * h * 1.12,
      5 + r() * 7, 3 + r() * 4, sig === 'ventCrab' ? '150,156,164' : '24,18,12', sig === 'ventCrab' ? 0.11 : 0.16);
  }
  c.restore();
  c.strokeStyle = sig === 'ventCrab' ? 'rgba(210,220,228,0.72)' : crustTone(p, 0.33, 0.82);
  c.lineWidth = 3; c.beginPath(); path(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(cx - w * 0.62, cy - h * 0.62); c.quadraticCurveTo(cx, cy - h * 0.88, cx + w * 0.62, cy - h * 0.62); c.stroke();
}

function resetHermitCrab(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0x4E12);
  const sx = S * 0.635, sy = S * 0.515, rx = S * 0.245, ry = S * 0.220;
  shadow(c, S * 0.52, S * 0.79, S * 0.34);
  /* Borrowed shell first: every living appendage subsequently grows from its mouth. */
  const sg = c.createRadialGradient(sx - rx * 0.36, sy - ry * 0.42, 3, sx, sy, rx * 1.12);
  sg.addColorStop(0, '#ead7ae'); sg.addColorStop(0.48, '#bd8d52'); sg.addColorStop(1, '#5b422c');
  c.fillStyle = sg; c.beginPath(); c.ellipse(sx, sy, rx, ry, -0.08, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(67,43,28,0.88)'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(sx, sy, rx, ry, -0.08, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(83,53,31,0.58)'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 110; i++) {
    const u = i / 110, a = u * TAU * 2.35, rad = (1 - u) * rx * 0.72;
    const x = sx + Math.cos(a) * rad, y = sy + Math.sin(a) * rad * 0.82;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.stroke();
  for (let i = 0; i < 11; i++) softMark(c, sx - rx * 0.62 + r() * rx * 1.20, sy - ry * 0.58 + r() * ry * 1.15, 8 + r() * 9, 5 + r() * 7, '78,50,28', 0.14);
  const mouthX = sx - rx * 0.76, mouthY = sy + ry * 0.12;
  c.fillStyle = 'rgba(42,29,22,0.92)'; c.beginPath(); c.ellipse(mouthX, mouthY, rx * 0.28, ry * 0.42, -0.18, 0, TAU); c.fill();

  /* Three visible walking legs emerge from inside the shell aperture. */
  const roots: InvertPt[] = [[mouthX + 8, mouthY + 10], [mouthX + 2, mouthY + 20], [mouthX + 12, mouthY + 30]];
  for (let i = 0; i < roots.length; i++) {
    resetCrustLeg(c, p, roots[i]!, [S * (0.42 - i * 0.045), S * (0.62 + i * 0.045)],
      [S * (0.30 - i * 0.040), S * (0.70 + i * 0.050)], 8 - i * 0.6);
  }
  const bx = S * 0.405, by = S * 0.505;
  c.fillStyle = crustGradient(c, p, bx, by, S * 0.105);
  c.beginPath(); c.ellipse(bx, by, S * 0.115, S * 0.090, -0.18, 0, TAU); c.fill();
  c.strokeStyle = crustTone(p, 0.36, 0.82); c.lineWidth = 2.4; c.stroke();

  /* The enlarged left chela overlaps and visibly plugs the shell mouth. */
  resetCrabChela(c, p, [bx + 20, by + 5], [mouthX - 5, mouthY - 8], [mouthX - 19, mouthY - 5], S * 0.080, Math.PI - 0.10);
  resetCrabChela(c, p, [bx - 10, by + 5], [S * 0.31, S * 0.53], [S * 0.245, S * 0.55], S * 0.048, Math.PI + 0.18);

  const hx = S * 0.355, hy = S * 0.435;
  c.fillStyle = crustGradient(c, p, hx, hy, S * 0.072);
  c.beginPath(); c.ellipse(hx, hy, S * 0.075, S * 0.060, -0.10, 0, TAU); c.fill();
  /* Stalked eyes plus two distinct antenna pairs. */
  for (const s of [-1, 1] as const) {
    const ex = hx - S * 0.030, ey = hy + s * S * 0.050;
    c.strokeStyle = crustTone(p, 0.46, 1); c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx, hy + s * S * 0.026); c.lineTo(ex - S * 0.052, ey + s * S * 0.010); c.stroke();
    eyeDot(c, ex - S * 0.058, ey + s * S * 0.010, S * 0.014);
    c.strokeStyle = crustTone(p, 0.55, 0.92); c.lineWidth = 2.8;
    c.beginPath(); c.moveTo(hx - S * 0.020, hy + s * S * 0.030);
    c.quadraticCurveTo(S * 0.22, S * (0.34 + (s > 0 ? 0.12 : -0.02)), S * 0.095, S * (0.36 + (s > 0 ? 0.18 : -0.08))); c.stroke();
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(hx - S * 0.030, hy + s * S * 0.015);
    c.quadraticCurveTo(S * 0.24, S * (0.40 + s * 0.06), S * 0.145, S * (0.43 + s * 0.09)); c.stroke();
  }
}

function resetCrabII(c: Ctx, g: G, p: Pal, name: string, sig: ResetCrabIISignature): void {
  if (sig === 'hermitCrab') { resetHermitCrab(c, g, p, name); return; }
  const cx = S * 0.50, cy = S * 0.505;
  const w = sig === 'mudCrab' ? S * 0.205 : sig === 'ventCrab' ? S * 0.145 : S * 0.175;
  const h = sig === 'mudCrab' ? S * 0.120 : sig === 'ventCrab' ? S * 0.105 : S * 0.135;
  shadow(c, cx, S * 0.79, sig === 'ventCrab' ? S * 0.25 : S * 0.31);
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {
      const root: InvertPt = [cx + side * w * (0.70 - i * 0.025), cy - h * 0.40 + i * h * 0.29];
      const span = sig === 'ventCrab' ? 1.34 : 1;
      const knee: InvertPt = [cx + side * (w + S * (0.050 + i * 0.019)) * span,
        cy - h * 0.72 + i * S * 0.052];
      const tip: InvertPt = [cx + side * (w + S * (0.155 + i * 0.016)) * span,
        cy - h * 0.40 + i * S * 0.092];
      resetCrustLeg(c, p, root, knee, tip, sig === 'ventCrab' ? 5.6 - i * 0.30 : 8.6 - i * 0.55,
        sig === 'mudCrab' && i === 3 ? 0.88 : 0);
    }
  }
  /* Arms are rooted behind the carapace; only their filled chelae remain in front. */
  const leftSize = sig === 'mudCrab' ? S * 0.082 : sig === 'ventCrab' ? S * 0.044 : S * 0.063;
  const rightSize = sig === 'mudCrab' ? S * 0.058 : sig === 'ventCrab' ? S * 0.042 : S * 0.063;
  resetCrabChela(c, p, [cx - w * 0.52, cy - h * 0.36], [cx - w * 0.92, cy - h * 0.93],
    [cx - w * 1.20, cy - h * 1.10], leftSize, Math.PI - 0.25);
  resetCrabChela(c, p, [cx + w * 0.52, cy - h * 0.36], [cx + w * 0.92, cy - h * 0.93],
    [cx + w * 1.20, cy - h * 1.10], rightSize, 0.25);
  resetCrabCarapace(c, g, p, name, sig, cx, cy, w, h);

  /* Eyes live on the front edge. Vent eyes are reduced pale knobs, not beads. */
  for (const side of [-1, 1] as const) {
    const bx = cx + side * w * 0.30, by = cy - h * 0.77;
    c.strokeStyle = sig === 'ventCrab' ? 'rgba(176,182,188,0.72)' : crustTone(p, 0.38, 1);
    c.lineWidth = sig === 'ventCrab' ? 3 : 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + side * w * 0.035, by - h * (sig === 'ventCrab' ? 0.20 : 0.35)); c.stroke();
    if (sig === 'ventCrab') {
      c.fillStyle = 'rgba(126,130,136,0.72)'; c.beginPath(); c.arc(bx + side * w * 0.035, by - h * 0.22, 3.2, 0, TAU); c.fill();
    } else eyeDot(c, bx + side * w * 0.035, by - h * 0.38, S * 0.014);
  }
}

export function crabBody(c: Ctx, g: G, pIn: Pal, opts: { wide?: boolean; hermit?: boolean; big?: boolean; hue?: string;
  /** Coconut-crab land stance: long heavy walking legs, never swimmer paddles. */
  terrestrial?: boolean;
  /** One oversized crusher chela beside a smaller cutter. */
  crusher?: boolean }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  const resetSignature = RESET_CRAB_II[name];
  if (resetSignature) { resetCrabII(c, g, p, name, resetSignature); return; }
  const r = nrng(g, name, 0xC2AB);
  const cx = S * 0.50, cy = S * 0.50;
  const cw = S * (opts.wide ? 0.155 : 0.125) * (opts.big ? 1.2 : 1) * nv(name, 0x41, 0.12);
  const ch = cw * (opts.wide ? 0.62 : 0.74) * nv(name, 0x42, 0.18);   /* carapace ASPECT */
  shadow(c, cx, cy + ch * 1.9, cw * 1.3);
  c.strokeStyle = p.dark; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {                /* four walking legs a side */
      const ox = cx + s * cw * 0.62, oy = cy + ch * (-0.1 + i * 0.16);
      const span = opts.terrestrial ? 1.62 : 1;
      const kx = ox + s * cw * (0.62 + i * 0.10) * span, ky = oy - ch * (0.42 - i * 0.22);
      const ex = ox + s * cw * (1.05 + i * 0.07) * span, ey = oy + ch * (0.85 + i * 0.24) * (opts.terrestrial ? 1.12 : 1);
      limb(c, ox, oy, ex, ey, kx, ky, (opts.terrestrial ? 8.2 : 5.5) - i * 0.5, p.dark);
    }
  }
  if (opts.hermit) {   /* the borrowed shell — the hermit crab's whole story */
    const sx = cx + cw * 0.95, sy = cy + ch * 0.3, R = cw * 0.95;
    for (let i = 90; i >= 0; i--) {
      const u = i / 90, a = u * TAU * 2.6, rad = R * u;
      const wx = sx + Math.cos(a) * rad * 0.9, wy = sy + Math.sin(a) * rad * 0.78, wr = R * 0.30 * (0.34 + u * 0.8);
      const gg = c.createRadialGradient(wx - wr * 0.4, wy - wr * 0.45, 1, wx, wy, wr * 1.15);
      gg.addColorStop(0, '#e6d7b8'); gg.addColorStop(0.55, '#c3a878'); gg.addColorStop(1, '#7d6842');
      c.fillStyle = gg; c.beginPath(); c.arc(wx, wy, wr, 0, TAU); c.fill();
    }
  }
  /* the carapace */
  const carap = (): void => {
    /* ★ POLISH — a crab carapace is a SHIELD, not a balloon: widest at the
       shoulders, FLAT across the front edge, tucking in below. */
    c.moveTo(cx - cw, cy + ch * 0.10);
    c.quadraticCurveTo(cx - cw * 0.98, cy - ch * 0.70, cx - cw * 0.55, cy - ch * 0.90);
    c.quadraticCurveTo(cx, cy - ch * 1.02, cx + cw * 0.55, cy - ch * 0.90);
    c.quadraticCurveTo(cx + cw * 0.98, cy - ch * 0.70, cx + cw, cy + ch * 0.10);
    c.quadraticCurveTo(cx + cw * 0.60, cy + ch * 0.96, cx, cy + ch * 0.92);
    c.quadraticCurveTo(cx - cw * 0.60, cy + ch * 0.96, cx - cw, cy + ch * 0.10);
  };
  c.fillStyle = shell(c, p, cx, cy, cw);
  c.beginPath(); carap(); c.closePath(); c.fill();
  rim(c, () => { carap(); c.closePath(); }, 2.4);
  /* ★ WAVE 21 — the carapace is the crab, so it gets the shell treatment. The
     tube is fitted to the carapace's own box rather than reusing a body
     ellipse: the outline is a four-arc curve, not an ellipse, and the clip
     below is what reconciles the two. */
  {
    const carapTube = ellipseTube(cx, cy - ch * 0.03, cw, ch * 1.02, 0);
    c.save();
    c.beginPath(); carap(); c.closePath(); c.clip();
    coatMaterial(c, carapTube, r, p, 'chitin', { detail: CHITIN_DETAIL });
    c.restore();
  }
  for (let i = 0; i < 12; i++) softMark(c, cx - cw * 0.8 + r() * cw * 1.6, cy - ch * 0.6 + r() * ch * 1.3, 7 + r() * 6, 5 + r() * 4, '26,20,14', 0.24);
  /* THE CLAWS, IN FRONT of the carapace — a crab holds its chelae forward,
     and drawn before the shell they were buried underneath it */
  for (const s of [-1, 1] as const) {
    const clawK = opts.crusher && s < 0 ? 1.78 : 1;
    const px = cx + s * cw * 1.02, py = cy - ch * 0.86;
    limb(c, cx + s * cw * 0.52, cy - ch * 0.3, px, py, cx + s * cw * 1.06, cy - ch * 0.14, 7.5 * clawK, p.dark);
    c.save(); c.translate(px, py); c.rotate(s * -0.62);
    c.fillStyle = shell(c, p, 0, 0, cw * 0.34 * clawK);
    c.beginPath(); c.ellipse(0, 0, cw * 0.34 * clawK, cw * 0.19 * clawK, 0, 0, TAU); c.fill();
    c.strokeStyle = p.dark; c.lineWidth = 6 * clawK; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cw * 0.20 * clawK, -cw * 0.09 * clawK); c.quadraticCurveTo(cw * 0.52 * clawK, -cw * 0.22 * clawK, cw * 0.64 * clawK, -cw * 0.10 * clawK); c.stroke();
    c.lineWidth = 5 * clawK;
    c.beginPath(); c.moveTo(cw * 0.20 * clawK, cw * 0.06 * clawK); c.quadraticCurveTo(cw * 0.50 * clawK, cw * 0.10 * clawK, cw * 0.62 * clawK, -cw * 0.02 * clawK); c.stroke();
    c.restore();
  }
  c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';   /* eyestalks */
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + s * cw * 0.24, cy - ch * 0.78); c.lineTo(cx + s * cw * 0.30, cy - ch * 1.30); c.stroke();
    eyeDot(c, cx + s * cw * 0.30, cy - ch * 1.36, cw * 0.075);
  }
}

type ResetShrimpIISignature = 'shrimp' | 'prawn' | 'freshwaterShrimp' | 'brineShrimp'
  | 'fairyShrimp' | 'tadpoleShrimp' | 'ventShrimp' | 'krill' | 'copepod'
  | 'amphipod' | 'lobster';

const RESET_SHRIMP_II: Readonly<Record<string, ResetShrimpIISignature>> = Object.freeze({
  'Shrimp': 'shrimp',
  'Prawn': 'prawn',
  'Freshwater Shrimp': 'freshwaterShrimp',
  'Brine Shrimp': 'brineShrimp',
  'Fairy Shrimp': 'fairyShrimp',
  'Tadpole Shrimp': 'tadpoleShrimp',
  'Vent Shrimp': 'ventShrimp',
  'Krill': 'krill',
  'Copepod': 'copepod',
  'Amphipod': 'amphipod',
  'Lobster': 'lobster',
});

type PleonSeg = readonly [number, number, number, number, number];

function resetWhip(c: Ctx, p: Pal, start: InvertPt, control: InvertPt, end: InvertPt,
  width = 2.8, alpha = 0.92): void {
  c.strokeStyle = crustTone(p, 0.48, alpha); c.lineWidth = width; c.lineCap = 'round';
  c.beginPath(); c.moveTo(start[0], start[1]); c.quadraticCurveTo(control[0], control[1], end[0], end[1]); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = Math.max(0.8, width * 0.34);
  c.beginPath(); c.moveTo(start[0], start[1] - 1); c.quadraticCurveTo(control[0], control[1] - 1, end[0], end[1]); c.stroke();
}

function resetTailFan(c: Ctx, p: Pal, x: number, y: number, size: number, angle: number,
  alpha = 0.90, lobes = 5): void {
  c.save(); c.translate(x, y); c.rotate(angle);
  for (let i = 0; i < lobes; i++) {
    const off = i - (lobes - 1) / 2, a = off * 0.25;
    c.save(); c.rotate(a);
    c.fillStyle = crustGradient(c, p, size * 0.56, 0, size * 0.62, alpha);
    c.beginPath(); c.moveTo(-size * 0.08, 0);
    c.quadraticCurveTo(size * 0.62, -size * 0.30, size * 1.22, 0);
    c.quadraticCurveTo(size * 0.62, size * 0.30, -size * 0.08, 0); c.closePath(); c.fill();
    c.strokeStyle = crustTone(p, 0.38, alpha * 0.82); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(size * 1.08, 0); c.stroke();
    c.restore();
  }
  c.restore();
}

function resetPleon(c: Ctx, p: Pal, segs: readonly PleonSeg[], alpha: number): void {
  for (let i = segs.length - 1; i >= 0; i--) {
    const [x, y, rx, ry, angle] = segs[i]!;
    c.fillStyle = crustGradient(c, p, x - rx * 0.18, y - ry * 0.28, Math.max(rx, ry), alpha);
    c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, TAU); c.fill();
    c.strokeStyle = crustTone(p, 0.34, Math.min(0.86, alpha)); c.lineWidth = 2;
    c.beginPath(); c.ellipse(x, y, rx, ry, angle, -2.55, 0.58); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.20)'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(x - rx * 0.12, y - ry * 0.16, rx * 0.62, ry * 0.54, angle, -2.55, -0.35); c.stroke();
  }
}

function resetRostrum(c: Ctx, p: Pal, baseX: number, baseY: number, tipX: number,
  serrations: number, scale = 1): void {
  c.fillStyle = crustTone(p, 0.70, 0.98);
  c.beginPath(); c.moveTo(baseX, baseY - 7 * scale); c.lineTo(tipX, baseY - 2 * scale);
  c.lineTo(baseX, baseY + 6 * scale); c.closePath(); c.fill();
  c.strokeStyle = crustTone(p, 0.34, 0.92); c.lineWidth = Math.max(1.4, 2.2 * scale);
  c.beginPath(); c.moveTo(tipX, baseY - 2 * scale); c.lineTo(baseX, baseY - 7 * scale); c.stroke();
  const span = baseX - tipX;
  c.fillStyle = crustTone(p, 0.46, 0.96);
  for (let i = 1; i <= serrations; i++) {
    const x = tipX + span * (i / (serrations + 1)), tooth = (4.2 + (i % 2) * 1.6) * scale;
    c.beginPath(); c.moveTo(x - 3 * scale, baseY - 5 * scale); c.lineTo(x, baseY - 5 * scale - tooth);
    c.lineTo(x + 3 * scale, baseY - 5 * scale); c.closePath(); c.fill();
  }
}

function resetSideEyes(c: Ctx, p: Pal, rootX: number, rootY: number, spread: number, radius: number): void {
  for (const side of [-1, 1] as const) {
    const ex = rootX - radius * 1.5, ey = rootY + side * spread;
    c.strokeStyle = crustTone(p, 0.42, 1); c.lineWidth = Math.max(3, radius * 0.82); c.lineCap = 'round';
    c.beginPath(); c.moveTo(rootX, rootY + side * spread * 0.36); c.lineTo(ex, ey); c.stroke();
    eyeDot(c, ex, ey, radius);
  }
}

function resetCaridean(c: Ctx, g: G, p: Pal, name: string,
  sig: 'shrimp' | 'prawn' | 'freshwaterShrimp'): void {
  const r = nrng(g, name, 0xCA21D);
  const prawn = sig === 'prawn', fresh = sig === 'freshwaterShrimp';
  const hx = prawn ? S * 0.355 : S * 0.365, hy = prawn ? S * 0.445 : S * 0.440;
  const segs: PleonSeg[] = prawn ? [
    [S * 0.485, S * 0.475, S * 0.090, S * 0.070, 0.05],
    [S * 0.575, S * 0.490, S * 0.080, S * 0.063, 0.18],
    [S * 0.655, S * 0.525, S * 0.070, S * 0.055, 0.34],
    [S * 0.720, S * 0.575, S * 0.059, S * 0.047, 0.54],
    [S * 0.770, S * 0.630, S * 0.049, S * 0.039, 0.72],
  ] : [
    [S * 0.490, S * 0.472, S * 0.092, S * 0.076, 0.02],
    [S * 0.580, S * 0.497, S * 0.082, S * 0.068, 0.24],
    [S * 0.650, S * 0.550, S * 0.071, S * 0.058, 0.49],
    [S * 0.698, S * 0.620, S * 0.060, S * 0.049, 0.82],
    [S * 0.714, S * 0.690, S * 0.048, S * 0.039, 1.12],
  ];
  shadow(c, S * 0.54, S * 0.805, S * 0.31);
  /* Walking legs and swimmerets are laid beneath their carapace/pleon roots. */
  for (let i = 0; i < 5; i++) {
    const x = hx - S * 0.018 + i * S * 0.035;
    const long = prawn ? S * (0.165 + i * 0.012) : S * (0.125 + i * 0.010);
    c.strokeStyle = crustTone(p, 0.40, 0.88); c.lineWidth = fresh && i < 2 ? 4.4 : 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, hy + S * 0.036);
    c.quadraticCurveTo(x - S * 0.020, hy + long * 0.56, x - S * 0.055 + i * S * 0.010, hy + long); c.stroke();
    if (fresh && i < 2) {
      const px = x - S * 0.055 + i * S * 0.010, py = hy + long;
      resetSmallChela(c, p, [px, py], S * 0.031, 0.42 + i * 0.10, 0.88);
    }
  }
  for (let i = 0; i < segs.length - 1; i++) {
    const [x, y, rx, ry] = segs[i]!;
    c.fillStyle = crustTone(p, 0.76, 0.72);
    c.save(); c.translate(x, y + ry * 0.62); c.rotate(0.22 + i * 0.15);
    c.beginPath(); c.ellipse(0, ry * 0.64, rx * 0.48, ry * 0.30, 0, 0, TAU); c.fill(); c.restore();
  }
  resetPleon(c, p, segs, fresh ? 0.82 : 0.92);
  const tail = segs[segs.length - 1]!;
  resetTailFan(c, p, tail[0] + tail[2] * 0.58, tail[1] + tail[3] * 0.52,
    prawn ? S * 0.055 : S * 0.060, prawn ? 0.70 : 1.02, fresh ? 0.82 : 0.94);

  /* One continuous cephalothorax overlaps the first pleon plate. */
  const headRx = prawn ? S * 0.125 : S * 0.132, headRy = prawn ? S * 0.088 : S * 0.100;
  c.fillStyle = crustGradient(c, p, hx - headRx * 0.22, hy - headRy * 0.30, headRx, fresh ? 0.84 : 0.94);
  c.beginPath(); c.ellipse(hx, hy, headRx, headRy, 0.04, 0, TAU); c.fill();
  c.strokeStyle = crustTone(p, 0.35, 0.82); c.lineWidth = 2.4; c.stroke();
  c.save(); c.beginPath(); c.ellipse(hx, hy, headRx, headRy, 0.04, 0, TAU); c.clip();
  for (let i = 0; i < 12; i++) softMark(c, hx - headRx * 0.65 + r() * headRx * 1.3,
    hy - headRy * 0.55 + r() * headRy * 1.1, 4 + r() * 5, 3 + r() * 4, '42,27,20', 0.12);
  c.restore();

  const baseX = hx - headRx * 0.78, baseY = hy - headRy * 0.18;
  resetRostrum(c, p, baseX, baseY, prawn ? S * 0.095 : fresh ? S * 0.125 : S * 0.145,
    prawn ? 8 : fresh ? 7 : 6, prawn ? 1.15 : 1);
  resetSideEyes(c, p, hx - headRx * 0.56, hy - headRy * 0.18, headRy * 0.34, S * 0.015);
  /* Two whips are deliberately thick enough to survive the actual 132px tile. */
  resetWhip(c, p, [baseX + 8, baseY + 5], [S * 0.235, S * 0.245], [S * 0.035, S * 0.245], 3.4);
  resetWhip(c, p, [baseX + 9, baseY + 13], [S * 0.225, S * 0.610], [S * 0.030, S * 0.685], 3.2);
}

function resetAnostracan(c: Ctx, g: G, p: Pal, name: string, brine: boolean): void {
  const r = nrng(g, name, brine ? 0xB21E : 0xFA12);
  const y0 = S * 0.545, headX = S * 0.205, tailX = S * 0.805;
  shadow(c, S * 0.51, S * 0.76, S * 0.31);
  /* Eleven paired phyllopods beat above the back: the unmistakable upside-down
     anostracan pose. Far-side leaves are translucent; near-side leaves sit over them. */
  for (const far of [true, false]) {
    for (let i = 0; i < 11; i++) {
      const u = i / 10, x = S * (0.300 + u * 0.405), rootY = y0 + Math.sin(u * Math.PI) * S * 0.025;
      const wave = Math.sin(u * Math.PI * 2.2 + (brine ? 0.5 : 0));
      const tipY = S * (far ? 0.350 : 0.315) + wave * S * 0.030;
      const tipX = x + (far ? -1 : 1) * S * 0.012;
      c.strokeStyle = crustTone(p, far ? 0.62 : 0.78, far ? 0.35 : 0.78);
      c.lineWidth = far ? 2.4 : 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, rootY); c.quadraticCurveTo(x - S * 0.008, (rootY + tipY) * 0.5, tipX, tipY); c.stroke();
      c.save(); c.translate(tipX, tipY); c.rotate(-0.10 + wave * 0.12);
      c.fillStyle = crustTone(p, brine ? 1.02 : 1.18, far ? 0.22 : 0.56);
      c.beginPath(); c.ellipse(0, -S * 0.010, S * (far ? 0.018 : 0.024), S * (far ? 0.043 : 0.054), 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  /* Bare translucent tube: no prawn carapace. */
  const trunk = (): void => {
    c.moveTo(headX + S * 0.040, y0 - S * 0.045);
    c.bezierCurveTo(S * 0.42, y0 - S * 0.052, S * 0.64, y0 - S * 0.032, tailX, y0 + S * 0.004);
    c.bezierCurveTo(S * 0.65, y0 + S * 0.050, S * 0.42, y0 + S * 0.052, headX + S * 0.040, y0 + S * 0.040);
    c.closePath();
  };
  const tg = c.createLinearGradient(0, y0 - S * 0.06, 0, y0 + S * 0.06);
  tg.addColorStop(0, crustTone(p, 1.30, 0.72)); tg.addColorStop(0.45, crustTone(p, 0.92, 0.42)); tg.addColorStop(1, crustTone(p, 0.52, 0.62));
  c.fillStyle = tg; c.beginPath(); trunk(); c.fill();
  c.strokeStyle = crustTone(p, 0.40, 0.72); c.lineWidth = 2.5; c.beginPath(); trunk(); c.stroke();
  c.strokeStyle = brine ? 'rgba(96,42,28,0.58)' : 'rgba(80,48,35,0.30)';
  c.lineWidth = brine ? 4.2 : 1.8;
  for (let i = 1; i < 12; i++) {
    const x = S * (0.285 + i * 0.042);
    c.beginPath(); c.moveTo(x, y0 - S * 0.040); c.lineTo(x + S * 0.006, y0 + S * 0.045); c.stroke();
  }
  c.strokeStyle = brine ? 'rgba(128,50,34,0.54)' : 'rgba(105,83,67,0.42)'; c.lineWidth = S * 0.013;
  c.beginPath(); c.moveTo(headX + S * 0.055, y0); c.bezierCurveTo(S * 0.44, y0 + r() * 2, S * 0.63, y0 + S * 0.010, tailX - S * 0.018, y0 + S * 0.012); c.stroke();

  c.fillStyle = crustGradient(c, p, headX, y0, S * 0.070, 0.78);
  c.beginPath(); c.ellipse(headX, y0, S * 0.071, S * 0.060, 0, 0, TAU); c.fill();
  resetSideEyes(c, p, headX - S * 0.030, y0 - S * 0.006, S * 0.046, S * 0.016);
  resetWhip(c, p, [headX - S * 0.050, y0 - S * 0.018], [S * 0.115, S * 0.420], [S * 0.055, S * 0.385], 2.6, 0.80);
  resetWhip(c, p, [headX - S * 0.050, y0 + S * 0.018], [S * 0.115, S * 0.620], [S * 0.055, S * 0.665], 2.4, 0.80);
  /* Brine shrimp need broad paired caudal rami that still read as a forked
     tail fan at 132px. Fairy shrimp retain their slimmer cercopods. */
  if (brine) {
    for (const side of [-1, 1] as const) {
      const tipX = S * 0.925, tipY = y0 + side * S * 0.062;
      c.fillStyle = crustTone(p, 0.92, 0.62);
      c.beginPath(); c.moveTo(tailX - S * 0.010, y0 + side * S * 0.006);
      c.bezierCurveTo(S * 0.850, y0 + side * S * 0.010, S * 0.890, y0 + side * S * 0.036, tipX, tipY);
      c.quadraticCurveTo(S * 0.875, y0 + side * S * 0.084, tailX, y0 + side * S * 0.026); c.closePath(); c.fill();
      c.strokeStyle = crustTone(p, 0.42, 0.86); c.lineWidth = 2.8;
      c.beginPath(); c.moveTo(tailX, y0 + side * S * 0.016); c.quadraticCurveTo(S * 0.875, y0 + side * S * 0.035, tipX, tipY); c.stroke();
      c.lineWidth = 2.2;
      for (let k = -1; k <= 1; k++) {
        c.beginPath(); c.moveTo(tipX, tipY);
        c.lineTo(S * 0.965, tipY + side * k * S * 0.016); c.stroke();
      }
    }
  } else {
    for (const side of [-1, 1] as const) {
      c.strokeStyle = crustTone(p, 0.56, 0.88); c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(tailX - S * 0.010, y0 + S * 0.008);
      c.quadraticCurveTo(S * 0.875, y0 + side * S * 0.030, S * 0.930, y0 + side * S * 0.073); c.stroke();
    }
  }
}

function resetTadpoleShrimp(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0x7AD0);
  const cx = S * 0.455, cy = S * 0.485, w = S * 0.230, h = S * 0.175;
  shadow(c, S * 0.52, S * 0.79, S * 0.33);
  /* Fifty-two flattened leaf limbs form two softly offset layers. Each limb is
     a curved filled ribbon with its own phase/length, never a crossing stick
     pair, so the underside reads as organic wriggling phyllopods at 440/132. */
  for (const far of [true, false]) {
    const count = 26;
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1), rootX = S * (0.286 + u * 0.520);
      const rootY = cy + h * (0.43 + u * 0.30) + (far ? -S * 0.004 : S * 0.004);
      const phase = i * 1.47 + (far ? 0.83 : 0);
      const len = S * (0.058 + (i % 6) * 0.0045 + Math.sin(phase * 0.61) * 0.006);
      const drift = S * (Math.sin(phase) * 0.018 + Math.cos(phase * 0.47) * 0.006 + (far ? -0.004 : 0.006));
      const controlX = rootX + drift * 0.42, tipX = rootX + drift, tipY = rootY + len;
      const leafW = S * (far ? 0.0075 : 0.0105);
      c.fillStyle = crustTone(p, far ? 0.98 : 0.80, far ? 0.30 : 0.66);
      c.beginPath(); c.moveTo(rootX - leafW * 0.28, rootY);
      c.bezierCurveTo(controlX - leafW * 0.74, rootY + len * 0.34,
        tipX - leafW * 1.34, tipY - len * 0.22, tipX, tipY);
      c.bezierCurveTo(tipX + leafW * 1.34, tipY - len * 0.22,
        controlX + leafW * 0.74, rootY + len * 0.34, rootX + leafW * 0.28, rootY);
      c.closePath(); c.fill();
      c.strokeStyle = crustTone(p, far ? 0.54 : 0.38, far ? 0.28 : 0.66);
      c.lineWidth = far ? 1.0 : 1.5; c.stroke();
    }
  }
  /* Exposed annulated rear trunk. */
  for (let i = 6; i >= 0; i--) {
    const x = cx + w * 0.58 + i * S * 0.042, rr = S * (0.048 - i * 0.003);
    c.fillStyle = crustGradient(c, p, x, cy + h * 0.20, rr, 0.90);
    c.beginPath(); c.ellipse(x, cy + h * 0.20 + i * S * 0.006, rr, rr * 0.74, 0.10, 0, TAU); c.fill();
    c.strokeStyle = crustTone(p, 0.36, 0.66); c.lineWidth = 1.6; c.stroke();
  }
  const tailX = S * 0.810, tailY = cy + h * 0.28;
  for (const side of [-1, 1] as const) {
    c.strokeStyle = crustTone(p, 0.43, 0.92); c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tailX, tailY); c.quadraticCurveTo(S * 0.90, tailY + side * S * 0.030, S * 0.965, tailY + side * S * 0.075); c.stroke();
  }
  /* The broad dorsal shield dominates the form and covers the front half. */
  const shield = (): void => {
    c.moveTo(cx - w, cy + h * 0.08);
    c.quadraticCurveTo(cx - w * 0.88, cy - h * 0.90, cx, cy - h);
    c.quadraticCurveTo(cx + w * 0.90, cy - h * 0.84, cx + w, cy + h * 0.10);
    c.quadraticCurveTo(cx + w * 0.55, cy + h * 0.72, cx, cy + h * 0.78);
    c.quadraticCurveTo(cx - w * 0.55, cy + h * 0.72, cx - w, cy + h * 0.08); c.closePath();
  };
  c.fillStyle = crustGradient(c, p, cx - w * 0.20, cy - h * 0.30, w * 1.05, 0.94);
  c.beginPath(); shield(); c.fill();
  c.save(); c.beginPath(); shield(); c.clip();
  for (let i = 0; i < 18; i++) softMark(c, cx - w * 0.72 + r() * w * 1.44, cy - h * 0.62 + r() * h * 1.20,
    5 + r() * 7, 3 + r() * 5, '50,38,22', 0.12);
  c.restore();
  c.strokeStyle = crustTone(p, 0.34, 0.82); c.lineWidth = 3; c.beginPath(); shield(); c.stroke();
  /* Paired compound eyes and the smaller median ocellus sit close atop the helmet. */
  eyeDot(c, cx - S * 0.030, cy - h * 0.50, S * 0.016);
  eyeDot(c, cx + S * 0.030, cy - h * 0.50, S * 0.016);
  c.fillStyle = '#29241c'; c.beginPath(); c.arc(cx, cy - h * 0.64, S * 0.008, 0, TAU); c.fill();
}

function resetAmphipod(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0xA4F1);
  shadow(c, S * 0.45, S * 0.81, S * 0.26);

  /* Differentiated appendages are rooted beneath one continuous lateral body:
     two grasping gnathopods, five walking legs, then four abdominal paddles. */
  const legs: ReadonlyArray<readonly [InvertPt, InvertPt, InvertPt, number, boolean]> = [
    [[S * 0.285, S * 0.390], [S * 0.315, S * 0.485], [S * 0.265, S * 0.565], 7.2, true],
    [[S * 0.330, S * 0.415], [S * 0.365, S * 0.520], [S * 0.325, S * 0.610], 6.8, true],
    [[S * 0.370, S * 0.445], [S * 0.425, S * 0.535], [S * 0.455, S * 0.675], 5.6, false],
    [[S * 0.405, S * 0.480], [S * 0.470, S * 0.555], [S * 0.520, S * 0.690], 5.4, false],
    [[S * 0.430, S * 0.520], [S * 0.495, S * 0.585], [S * 0.555, S * 0.700], 5.2, false],
    [[S * 0.440, S * 0.565], [S * 0.475, S * 0.635], [S * 0.505, S * 0.740], 5.0, false],
    [[S * 0.425, S * 0.605], [S * 0.420, S * 0.675], [S * 0.425, S * 0.765], 4.8, false],
  ];
  for (const [root, knee, tip, width, claw] of legs) {
    resetCrustLeg(c, p, root, knee, tip, width);
    if (claw) resetSmallChela(c, p, tip, S * 0.027, 2.15, 0.92);
  }
  for (let i = 0; i < 4; i++) {
    const rootX = S * (0.415 + i * 0.020), rootY = S * (0.520 + i * 0.040);
    const tipX = rootX - S * (0.040 + i * 0.006), tipY = rootY + S * 0.095;
    c.strokeStyle = crustTone(p, 0.45, 0.64); c.lineWidth = 3.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(rootX, rootY); c.quadraticCurveTo(rootX - S * 0.012, tipY - S * 0.030, tipX, tipY); c.stroke();
    c.fillStyle = crustTone(p, 0.86, 0.58);
    c.beginPath(); c.ellipse(tipX, tipY, S * 0.022, S * 0.010, -0.55, 0, TAU); c.fill();
  }

  /* A single crescent path replaces the bead chain while preserving plate
     segmentation as surface bands inside the shared silhouette. */
  const body = (): void => {
    c.moveTo(S * 0.235, S * 0.315);
    c.bezierCurveTo(S * 0.315, S * 0.255, S * 0.445, S * 0.285, S * 0.525, S * 0.395);
    c.bezierCurveTo(S * 0.600, S * 0.500, S * 0.565, S * 0.625, S * 0.455, S * 0.695);
    c.quadraticCurveTo(S * 0.405, S * 0.725, S * 0.355, S * 0.685);
    c.bezierCurveTo(S * 0.390, S * 0.625, S * 0.435, S * 0.570, S * 0.430, S * 0.505);
    c.bezierCurveTo(S * 0.425, S * 0.440, S * 0.355, S * 0.395, S * 0.280, S * 0.395);
    c.quadraticCurveTo(S * 0.225, S * 0.380, S * 0.235, S * 0.315); c.closePath();
  };
  c.fillStyle = crustGradient(c, p, S * 0.330, S * 0.350, S * 0.245, 0.94);
  c.beginPath(); body(); c.fill();
  c.strokeStyle = crustTone(p, 0.32, 0.88); c.lineWidth = 3.2; c.beginPath(); body(); c.stroke();
  c.save(); c.beginPath(); body(); c.clip();
  const bands: ReadonlyArray<readonly [InvertPt, InvertPt, InvertPt]> = [
    [[S * 0.325, S * 0.285], [S * 0.310, S * 0.350], [S * 0.300, S * 0.405]],
    [[S * 0.390, S * 0.295], [S * 0.370, S * 0.370], [S * 0.350, S * 0.430]],
    [[S * 0.450, S * 0.325], [S * 0.425, S * 0.410], [S * 0.395, S * 0.470]],
    [[S * 0.500, S * 0.370], [S * 0.470, S * 0.460], [S * 0.425, S * 0.525]],
    [[S * 0.535, S * 0.430], [S * 0.500, S * 0.525], [S * 0.425, S * 0.590]],
    [[S * 0.545, S * 0.500], [S * 0.505, S * 0.600], [S * 0.400, S * 0.660]],
    [[S * 0.515, S * 0.590], [S * 0.470, S * 0.665], [S * 0.365, S * 0.700]],
  ];
  c.strokeStyle = crustTone(p, 0.36, 0.52); c.lineWidth = 2.8;
  for (const [start, control, end] of bands) {
    c.beginPath(); c.moveTo(start[0], start[1]); c.quadraticCurveTo(control[0], control[1], end[0], end[1]); c.stroke();
  }
  c.fillStyle = crustTone(p, 0.45, 0.22);
  for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(S * (0.29 + r() * 0.22), S * (0.32 + r() * 0.26), 2 + r() * 2.5, 0, TAU); c.fill(); }
  c.restore();

  eyeDot(c, S * 0.255, S * 0.335, S * 0.016);
  /* Four independently visible whips encode two antenna pairs at delivery size. */
  resetWhip(c, p, [S * 0.245, S * 0.322], [S * 0.135, S * 0.205], [S * 0.035, S * 0.150], 2.8, 0.52);
  resetWhip(c, p, [S * 0.235, S * 0.310], [S * 0.135, S * 0.125], [S * 0.035, S * 0.070], 4.0, 0.90);
  resetWhip(c, p, [S * 0.245, S * 0.355], [S * 0.145, S * 0.380], [S * 0.055, S * 0.430], 2.8, 0.56);
  resetWhip(c, p, [S * 0.250, S * 0.372], [S * 0.145, S * 0.440], [S * 0.065, S * 0.505], 3.8, 0.88);
  for (const [dx, dy, width] of [[-0.090, 0.045, 4.6], [-0.055, 0.095, 4.0], [-0.110, 0.078, 2.8]] as const) {
    c.strokeStyle = crustTone(p, 0.40, width < 3 ? 0.56 : 0.90); c.lineWidth = width; c.lineCap = 'round';
    c.beginPath(); c.moveTo(S * 0.390, S * 0.675); c.lineTo(S * (0.390 + dx), S * (0.675 + dy)); c.stroke();
  }
}

function resetCopepod(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0xC0E0);
  const cx = S * 0.50;
  shadow(c, cx, S * 0.84, S * 0.22);
  /* Long calanoid antennules span approximately the animal's full body length. */
  resetWhip(c, p, [cx - S * 0.035, S * 0.285], [S * 0.245, S * 0.130], [S * 0.050, S * 0.105], 3.2, 0.86);
  resetWhip(c, p, [cx + S * 0.035, S * 0.285], [S * 0.755, S * 0.130], [S * 0.950, S * 0.105], 3.2, 0.86);
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 5; i++) {
      const y = S * (0.430 + i * 0.043), rootX = cx + side * S * (0.060 - i * 0.004);
      c.strokeStyle = crustTone(p, 0.42, 0.76); c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(rootX, y); c.quadraticCurveTo(cx + side * S * 0.145, y + S * 0.018, cx + side * S * (0.190 - i * 0.012), y + S * 0.048); c.stroke();
    }
  }
  const body = (): void => {
    c.moveTo(cx, S * 0.245);
    c.bezierCurveTo(cx - S * 0.145, S * 0.260, cx - S * 0.175, S * 0.430, cx - S * 0.095, S * 0.555);
    c.quadraticCurveTo(cx, S * 0.615, cx + S * 0.095, S * 0.555);
    c.bezierCurveTo(cx + S * 0.175, S * 0.430, cx + S * 0.145, S * 0.260, cx, S * 0.245); c.closePath();
  };
  const bg = c.createLinearGradient(cx - S * 0.16, S * 0.28, cx + S * 0.14, S * 0.57);
  bg.addColorStop(0, crustTone(p, 1.30, 0.82)); bg.addColorStop(0.52, crustTone(p, 0.92, 0.62)); bg.addColorStop(1, crustTone(p, 0.48, 0.74));
  c.fillStyle = bg; c.beginPath(); body(); c.fill();
  c.strokeStyle = crustTone(p, 0.34, 0.80); c.lineWidth = 3; c.beginPath(); body(); c.stroke();
  /* Straight gut remains visible through the transparent prosome. */
  c.strokeStyle = crustTone(p, 0.36, 0.38); c.lineWidth = S * 0.018; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, S * 0.340); c.lineTo(cx, S * 0.555); c.stroke();
  c.fillStyle = '#171315'; c.beginPath(); c.arc(cx, S * 0.330, S * 0.022, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.70)'; c.beginPath(); c.arc(cx - S * 0.006, S * 0.322, S * 0.006, 0, TAU); c.fill();
  /* Narrow urosome visibly tapers into two bristled caudal rami. */
  for (let i = 0; i < 4; i++) {
    const y = S * (0.585 + i * 0.055), rx = S * (0.056 - i * 0.009), ry = S * 0.043;
    c.fillStyle = crustGradient(c, p, cx, y, rx, 0.78); c.beginPath(); c.ellipse(cx, y, rx, ry, 0, 0, TAU); c.fill();
    c.strokeStyle = crustTone(p, 0.36, 0.62); c.lineWidth = 1.6; c.stroke();
  }
  for (const side of [-1, 1] as const) {
    const ex = cx + side * S * 0.050, ey = S * 0.835;
    c.strokeStyle = crustTone(p, 0.38, 0.92); c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + side * S * 0.018, S * 0.770); c.lineTo(ex, ey); c.stroke();
    c.lineWidth = 1.8;
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + side * S * (0.055 + r() * 0.010), ey + i * S * 0.020); c.stroke();
    }
  }
}

function resetVentShrimp(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0x7E17);
  shadow(c, S * 0.53, S * 0.79, S * 0.30);
  const segs: PleonSeg[] = [
    [S * 0.485, S * 0.405, S * 0.100, S * 0.073, 0.12],
    [S * 0.585, S * 0.435, S * 0.084, S * 0.064, 0.30],
    [S * 0.655, S * 0.495, S * 0.070, S * 0.055, 0.62],
    [S * 0.695, S * 0.565, S * 0.058, S * 0.047, 0.96],
    [S * 0.708, S * 0.635, S * 0.046, S * 0.038, 1.22],
  ];
  for (let i = 0; i < 5; i++) {
    const x = S * (0.315 + i * 0.045);
    c.strokeStyle = crustTone(p, 0.43, 0.70); c.lineWidth = 3;
    c.beginPath(); c.moveTo(x, S * 0.455); c.quadraticCurveTo(x - S * 0.010, S * 0.555, x - S * (0.040 - i * 0.004), S * 0.615); c.stroke();
    if (i < 2) {
      const px = x - S * (0.040 - i * 0.004), py = S * 0.615;
      resetSmallChela(c, p, [px, py], S * 0.030, 2.55 - i * 0.12, 0.72);
    }
  }
  resetPleon(c, p, segs, 0.68);
  const tail = segs[segs.length - 1]!;
  resetTailFan(c, p, tail[0] + S * 0.022, tail[1] + S * 0.022, S * 0.055, 1.10, 0.68);
  const hx = S * 0.355, hy = S * 0.390, rx = S * 0.145, ry = S * 0.112;
  const carapace = (): void => {
    c.moveTo(hx - rx, hy + ry * 0.40);
    c.bezierCurveTo(hx - rx * 0.88, hy - ry * 0.88, hx - rx * 0.18, hy - ry * 1.20, hx + rx * 0.55, hy - ry * 0.60);
    c.quadraticCurveTo(hx + rx, hy + ry * 0.05, hx + rx * 0.68, hy + ry * 0.64);
    c.quadraticCurveTo(hx - rx * 0.12, hy + ry, hx - rx, hy + ry * 0.40); c.closePath();
  };
  const cg = c.createLinearGradient(0, hy - ry, 0, hy + ry);
  cg.addColorStop(0, 'rgba(250,244,238,0.76)'); cg.addColorStop(0.46, crustTone(p, 1.10, 0.44)); cg.addColorStop(1, crustTone(p, 0.52, 0.62));
  c.fillStyle = cg; c.beginPath(); carapace(); c.fill();
  c.strokeStyle = 'rgba(220,214,214,0.68)'; c.lineWidth = 2.5; c.beginPath(); carapace(); c.stroke();
  /* Lensless dorsal light-sensing patch; there are deliberately no eyestalks. */
  const patch = c.createRadialGradient(hx - S * 0.005, hy - ry * 0.68, 2, hx, hy - ry * 0.60, S * 0.080);
  patch.addColorStop(0, 'rgba(255,255,246,0.98)'); patch.addColorStop(0.62, 'rgba(236,231,212,0.78)'); patch.addColorStop(1, 'rgba(210,204,195,0.08)');
  c.fillStyle = patch; c.beginPath(); c.ellipse(hx, hy - ry * 0.62, S * 0.078, S * 0.035, -0.06, 0, TAU); c.fill();
  resetWhip(c, p, [hx - rx * 0.72, hy + S * 0.005], [S * 0.185, S * 0.215], [S * 0.030, S * 0.220], 3, 0.72);
  resetWhip(c, p, [hx - rx * 0.70, hy + S * 0.030], [S * 0.160, S * 0.545], [S * 0.035, S * 0.620], 2.8, 0.72);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(hx - rx * 0.40 + r() * rx * 0.95, hy - ry * 0.30 + r() * ry * 0.75, 2 + r() * 3, 0, TAU); c.fill(); }
}

function resetKrill(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0x6B11);
  shadow(c, S * 0.53, S * 0.77, S * 0.31);
  const segs: PleonSeg[] = [
    [S * 0.465, S * 0.475, S * 0.083, S * 0.057, 0.03],
    [S * 0.545, S * 0.482, S * 0.073, S * 0.052, 0.12],
    [S * 0.615, S * 0.505, S * 0.065, S * 0.047, 0.26],
    [S * 0.675, S * 0.540, S * 0.056, S * 0.041, 0.42],
    [S * 0.725, S * 0.578, S * 0.047, S * 0.035, 0.56],
  ];
  /* Swimming-leg fan and external gill trees are structural, under the shell. */
  for (let i = 0; i < 7; i++) {
    const x = S * (0.330 + i * 0.054), rootY = S * (0.500 + i * 0.004);
    c.strokeStyle = crustTone(p, 0.38, 0.78); c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, rootY); c.quadraticCurveTo(x - S * 0.005, S * 0.615, x + S * (0.010 + i * 0.005), S * 0.685); c.stroke();
    c.strokeStyle = 'rgba(235,242,244,0.70)'; c.lineWidth = 2.2;
    const gx = x + S * 0.008, gy = rootY + S * 0.030;
    c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx, gy + S * 0.085); c.stroke();
    for (let k = 1; k <= 4; k++) {
      const yy = gy + k * S * 0.016;
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(gx, yy); c.lineTo(gx - S * 0.026, yy + S * 0.013); c.stroke();
      c.beginPath(); c.moveTo(gx, yy); c.lineTo(gx + S * 0.026, yy + S * 0.013); c.stroke();
    }
  }
  resetPleon(c, p, segs, 0.70);
  const tail = segs[segs.length - 1]!;
  resetTailFan(c, p, tail[0] + S * 0.020, tail[1] + S * 0.012, S * 0.050, 0.52, 0.72);
  const hx = S * 0.330, hy = S * 0.455, rx = S * 0.115, ry = S * 0.082;
  c.fillStyle = crustGradient(c, p, hx - rx * 0.20, hy - ry * 0.28, rx, 0.72);
  c.beginPath(); c.ellipse(hx, hy, rx, ry, -0.04, 0, TAU); c.fill();
  c.strokeStyle = crustTone(p, 0.34, 0.74); c.lineWidth = 2.2; c.stroke();
  /* Krill carry conspicuous black compound-eye masses on real stalks. The
     filled ellipses are intentionally oversized enough to survive 132px. */
  for (const side of [-1, 1] as const) {
    const rootX = hx - rx * 0.58, rootY = hy + side * ry * 0.18;
    const eyeX = hx - rx * 1.10, eyeY = hy + side * ry * 0.54;
    c.strokeStyle = 'rgba(40,24,24,0.96)'; c.lineWidth = S * 0.012; c.lineCap = 'round';
    c.beginPath(); c.moveTo(rootX, rootY); c.lineTo(eyeX, eyeY); c.stroke();
    c.fillStyle = '#06070a';
    c.beginPath(); c.ellipse(eyeX, eyeY, S * 0.029, S * 0.025, side * -0.10, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(238,215,208,0.62)'; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.82)';
    c.beginPath(); c.arc(eyeX - S * 0.008, eyeY - S * 0.008, S * 0.006, 0, TAU); c.fill();
  }
  resetWhip(c, p, [hx - rx * 0.72, hy - S * 0.010], [S * 0.185, S * 0.245], [S * 0.035, S * 0.220], 3.1, 0.82);
  resetWhip(c, p, [hx - rx * 0.70, hy + S * 0.015], [S * 0.175, S * 0.570], [S * 0.035, S * 0.635], 2.8, 0.82);
  /* A visible gut reinforces translucency without obscuring the external gills. */
  c.strokeStyle = 'rgba(72,84,48,0.42)'; c.lineWidth = S * 0.012; c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx - S * 0.010, hy); c.quadraticCurveTo(S * 0.54, S * 0.49, S * 0.70, S * 0.56); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.20)';
  for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(hx - rx * 0.50 + r() * rx, hy - ry * 0.45 + r() * ry * 0.90, 2 + r() * 2.5, 0, TAU); c.fill(); }
}

function resetLobster(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0x10B5);
  const hx = S * 0.405, hy = S * 0.475, rx = S * 0.125, ry = S * 0.095;
  shadow(c, S * 0.54, S * 0.79, S * 0.35);
  /* Four walking legs and both cheliped arms originate beneath the carapace. */
  for (let i = 0; i < 4; i++) {
    const root: InvertPt = [hx + S * (0.015 + i * 0.035), hy + ry * 0.40];
    resetCrustLeg(c, p, root, [hx + S * (0.02 + i * 0.055), S * (0.59 + i * 0.018)],
      [hx - S * (0.02 - i * 0.040), S * (0.69 + i * 0.020)], 6.8 - i * 0.4);
  }
  resetCrabChela(c, p, [hx - rx * 0.45, hy + S * 0.010], [S * 0.285, S * 0.435], [S * 0.165, S * 0.390], S * 0.090, Math.PI - 0.12);
  resetCrabChela(c, p, [hx - rx * 0.40, hy + S * 0.040], [S * 0.300, S * 0.555], [S * 0.190, S * 0.595], S * 0.067, Math.PI + 0.14);
  const segs: PleonSeg[] = [
    [S * 0.535, S * 0.482, S * 0.075, S * 0.078, 0.02],
    [S * 0.605, S * 0.495, S * 0.068, S * 0.071, 0.08],
    [S * 0.668, S * 0.515, S * 0.060, S * 0.064, 0.16],
    [S * 0.722, S * 0.545, S * 0.052, S * 0.056, 0.25],
    [S * 0.765, S * 0.580, S * 0.044, S * 0.048, 0.36],
  ];
  resetPleon(c, p, segs, 0.96);
  const tail = segs[segs.length - 1]!;
  resetTailFan(c, p, tail[0] + S * 0.025, tail[1] + S * 0.020, S * 0.065, 0.34, 0.96);
  c.fillStyle = crustGradient(c, p, hx - rx * 0.20, hy - ry * 0.30, rx, 1);
  c.beginPath(); c.ellipse(hx, hy, rx, ry, 0.02, 0, TAU); c.fill();
  c.strokeStyle = crustTone(p, 0.32, 0.90); c.lineWidth = 3; c.stroke();
  c.save(); c.beginPath(); c.ellipse(hx, hy, rx, ry, 0.02, 0, TAU); c.clip();
  for (let i = 0; i < 18; i++) softMark(c, hx - rx * 0.70 + r() * rx * 1.40, hy - ry * 0.56 + r() * ry * 1.12,
    4 + r() * 6, 3 + r() * 4, '220,230,242', 0.11);
  c.restore();
  resetSideEyes(c, p, hx - rx * 0.65, hy - ry * 0.15, ry * 0.34, S * 0.017);
  resetWhip(c, p, [hx - rx * 0.72, hy - S * 0.020], [S * 0.230, S * 0.165], [S * 0.030, S * 0.105], 4, 0.90);
  resetWhip(c, p, [hx - rx * 0.70, hy + S * 0.005], [S * 0.220, S * 0.690], [S * 0.035, S * 0.760], 3.6, 0.90);
  resetRostrum(c, p, hx - rx * 0.75, hy - ry * 0.18, S * 0.245, 3, 0.78);
}

function resetShrimpII(c: Ctx, g: G, p: Pal, name: string, sig: ResetShrimpIISignature): void {
  switch (sig) {
    case 'shrimp': case 'prawn': case 'freshwaterShrimp': resetCaridean(c, g, p, name, sig); return;
    case 'brineShrimp': resetAnostracan(c, g, p, name, true); return;
    case 'fairyShrimp': resetAnostracan(c, g, p, name, false); return;
    case 'tadpoleShrimp': resetTadpoleShrimp(c, g, p, name); return;
    case 'ventShrimp': resetVentShrimp(c, g, p, name); return;
    case 'krill': resetKrill(c, g, p, name); return;
    case 'copepod': resetCopepod(c, g, p, name); return;
    case 'amphipod': resetAmphipod(c, g, p, name); return;
    case 'lobster': resetLobster(c, g, p, name); return;
  }
}

export function shrimpBody(c: Ctx, g: G, pIn: Pal, opts: { claws?: boolean; stout?: boolean; tiny?: boolean;
  hue?: string; shield?: boolean; stalks?: boolean; gills?: boolean; scale?: number;
  /* ★ WAVE 65 — the copepod's identity kit: one long pair of antennae held
     out sideways + the two egg sacs trailing behind the tail */
  eggSacs?: boolean;
  /** Copepod's clean split caudal rami, each ending in bristles. */
  forkedTail?: boolean;
  /** Stocky crayfish abdomen with a broad, plated tail fan. */
  crayfish?: boolean;
  /** Lobster signature: one crusher claw dominates the paired chelae. */
  unequalClaws?: boolean }, name = ''): void {
  const p = hued(pIn, opts.hue);
  const resetSignature = RESET_SHRIMP_II[name];
  if (resetSignature) { resetShrimpII(c, g, p, name, resetSignature); return; }
  const r = nrng(g, name, 0x5E1D);
  const cx = S * 0.50, cy = S * 0.50;
  /* ⚠ the same defect the small birds had: a krill was drawn at its true size
     RELATIVE to a lobster, so it used a tenth of its 440px frame and every
     feature that identifies it was three pixels across. The fit pass only ever
     shrinks (D-ART-15), so nothing rescued it. Relative scale is invisible when
     each species is framed alone; the range is compressed, not flattened. */
  const L = S * 0.145 * (opts.tiny ? 1.22 : 1) * (opts.scale ?? 1) * nv(name, 0x51, 0.12);
  const sigShrimp = (): void => {
    /* the three signatures that tell the small crustaceans apart, each straight
       off its own reference row */
    if (opts.shield) {
      /* a tadpole shrimp is half-covered by a broad flat SHIELD CARAPACE */
      c.fillStyle = 'rgba(' + (p.cr * 0.86 | 0) + ',' + (p.cg * 0.86 | 0) + ',' + (p.cb * 0.84 | 0) + ',0.94)';
      c.beginPath(); c.ellipse(cx - L * 0.30, cy - L * 0.06, L * 0.72, L * 0.46, -0.06, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(240,246,252,0.30)'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx - L * 0.30, cy - L * 0.06, L * 0.72, L * 0.46, -0.06, -2.7, 0.3); c.stroke();
    }
    if (opts.gills) {
      /* a krill wears its gills OUTSIDE the shell — the one thing everybody
         who has seen one remembers */
      c.strokeStyle = 'rgba(232,238,244,0.52)'; c.lineWidth = 1.2; c.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const t = i / 6, bx = cx - L * 0.5 + t * L * 0.9, by = cy + L * 0.30;
        for (let k = -1; k <= 1; k++) {
          c.beginPath(); c.moveTo(bx, by);
          c.quadraticCurveTo(bx + k * L * 0.06, by + L * 0.14, bx + k * L * 0.11, by + L * 0.24);
          c.stroke();
        }
      }
    }
    if (opts.stalks) {
      /* ★ WAVE 66 — eyes on STALKS, held clear of the HEAD. They were drawn at
         +0.78·L, which is the TAIL end — gp3's krill verdict was "a second pair
         of stalked eyes sits on the ABDOMEN, so the tail end has a face". The
         head (antennae, rostrum) is the NEGATIVE end of this body. */
      for (const sgn of [-1, 1]) {
        const ex = cx - L * 0.78, ey = cy - L * 0.10 + sgn * L * 0.12;
        c.strokeStyle = p.dark; c.lineWidth = Math.max(1.4, L * 0.045); c.lineCap = 'round';
        c.beginPath(); c.moveTo(cx - L * 0.58, cy - L * 0.02); c.lineTo(ex, ey); c.stroke();
        c.fillStyle = '#14161c';
        c.beginPath(); c.arc(ex, ey, Math.max(2, L * 0.075), 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.72)';
        c.beginPath(); c.arc(ex - L * 0.02, ey - L * 0.025, Math.max(1, L * 0.026), 0, TAU); c.fill();
      }
    }
  };
  /* RATIO, not scale — the fit pass would erase a size-only difference */
  const h = L * (opts.stout ? 0.42 : 0.30) * nv(name, 0x52, 0.20);
  const curl = nv(name, 0x53, 0.24);          /* how tightly the abdomen comma-curls */
  shadow(c, cx, cy + h * 2.6, L * 0.9);
  /* the abdomen CURLS — a shrimp at rest is a comma, never a rod */
  const seg = 7;
  for (let i = seg - 1; i >= 0; i--) {
    const u = i / (seg - 1);
    const a = 0.35 + u * 1.15 * curl;
    const x = cx + Math.cos(a) * L * (0.55 + u * 0.75);
    const y = cy - h * 0.3 + Math.sin(a) * L * (0.30 + u * 0.62);
    const rr = h * (1.0 - u * 0.45);
    c.fillStyle = shell(c, p, x, y, rr);
    c.beginPath(); c.ellipse(x, y, rr * 1.15, rr, a - 1.4, 0, TAU); c.fill();
    rim(c, () => c.ellipse(x, y, rr * 1.15, rr, a - 1.4, -2.8, 0.3), 1.6);
    c.strokeStyle = p.dark; c.lineWidth = 2;   /* the swimmerets */
    c.beginPath(); c.moveTo(x, y + rr * 0.6); c.lineTo(x + rr * 0.4, y + rr * 1.5); c.stroke();
  }
  if (opts.crayfish) {
    /* Crayfish show hard abdominal plates, not a generic smooth shrimp curl. */
    c.strokeStyle = 'rgba(34,28,18,0.58)'; c.lineWidth = Math.max(1.4, h * 0.12);
    for (let i = 1; i < seg; i++) {
      const u = i / (seg - 1), a = 0.35 + u * 1.15 * curl;
      const x = cx + Math.cos(a) * L * (0.55 + u * 0.75);
      const y = cy - h * 0.3 + Math.sin(a) * L * (0.30 + u * 0.62);
      c.save(); c.translate(x, y); c.rotate(a - 1.4);
      c.beginPath(); c.moveTo(-h * 0.52, 0); c.lineTo(h * 0.52, 0); c.stroke(); c.restore();
    }
  }
  const u1 = 1, a1 = 0.35 + u1 * 1.15 * curl;
  const tx = cx + Math.cos(a1) * L * 1.30, ty = cy - h * 0.3 + Math.sin(a1) * L * 0.92;
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.78)`;   /* THE TAIL FAN */
  if (opts.crayfish) {
    /* Five short, broad telson plates read as a crayfish fan rather than fins. */
    for (let k = -2; k <= 2; k++) {
      c.save(); c.translate(tx, ty); c.rotate(a1 - 1.4 + k * 0.24);
      c.beginPath();
      c.moveTo(h * 0.05, 0);
      c.quadraticCurveTo(h * 1.15, -h * 0.38, h * 1.72, 0);
      c.quadraticCurveTo(h * 1.15, h * 0.38, h * 0.05, 0);
      c.closePath(); c.fill(); c.restore();
    }
  } else if (opts.forkedTail) {
    /* Two caudal rami read more cleanly than the generic five-lobed fan. */
    c.strokeStyle = p.dark; c.lineCap = 'round';
    for (const side of [-1, 1] as const) {
      c.lineWidth = Math.max(2, h * 0.24);
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + h * 1.45, ty + side * h * 0.72, tx + h * 2.30, ty + side * h * 0.94); c.stroke();
      c.lineWidth = Math.max(1, h * 0.07);
      for (let k = -1; k <= 1; k++) {
        c.beginPath(); c.moveTo(tx + h * 1.78, ty + side * h * 0.77); c.lineTo(tx + h * 2.34, ty + side * h * (0.94 + k * 0.20)); c.stroke();
      }
    }
  } else {
    for (let k = -2; k <= 2; k++) {
      c.save(); c.translate(tx, ty); c.rotate(a1 - 1.4 + k * 0.26);
      c.beginPath(); c.ellipse(h * 0.9, 0, h * 0.95, h * 0.22, 0, 0, TAU); c.fill(); c.restore();
    }
  }
  /* the carapace and rostrum */
  c.fillStyle = shell(c, p, cx - L * 0.15, cy - h * 0.2, h * 1.5);
  c.beginPath(); c.ellipse(cx - L * 0.18, cy - h * 0.18, h * 1.55, h * 1.15, -0.16, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx - L * 0.18, cy - h * 0.18, h * 1.55, h * 1.15, -0.16, -2.9, 0.25), 2);
  c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx - L * 0.5, cy - h * 0.7); c.lineTo(cx - L * 1.05, cy - h * 1.5); c.stroke();
  for (const s of [-1, 1] as const) {   /* the long sweeping antennae */
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - L * 0.55, cy - h * 0.3 + s * h * 0.2);
    c.quadraticCurveTo(cx - L * 1.5, cy + s * h * 1.4, cx - L * 2.0, cy + s * h * (2.4 + s * 0.6)); c.stroke();
  }
  if (opts.eggSacs) {
    /* ★ WAVE 65 — the copepod's paired egg sacs, trailing behind like twin
       grape clusters; with the antennae they are the whole diagnostic. */
    c.fillStyle = 'rgba(220,150,80,0.9)';
    for (const s of [-1, 1] as const) {
      const ex = cx + L * 0.85, ey = cy + h * 0.4 + s * h * 0.55;
      c.beginPath(); c.ellipse(ex, ey, L * 0.32, h * 0.38, s * 0.25, 0, TAU); c.fill();
      c.fillStyle = 'rgba(180,110,50,0.6)';
      for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(ex - L * 0.2 + (k % 3) * L * 0.18, ey - h * 0.15 + Math.floor(k / 3) * h * 0.3, h * 0.11, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(220,150,80,0.9)';
    }
  }
  if (opts.claws) {   /* ★ WAVE 62 — the lobster's chelae are its identity, and
       gp5 called the old ones "flat unshaded paddles floating in front of the
       head". Each is now a fat shaded PALM continuing into two filled tapering
       PINCER fingers with a visible gape between them, joined by a real arm. */
    for (const s of [-1, 1] as const) {
      const px = cx - L * 0.95, py = cy + h * (0.3 + s * 0.75);
      limb(c, cx - L * 0.45, cy + h * 0.3, px, py, cx - L * 0.75, cy + h * (0.2 + s * 0.5), 8, p.dark);
      c.save(); c.translate(px, py); c.rotate(s * 0.35);
      if (opts.unequalClaws && s > 0) c.scale(1.42, 1.42);
      c.fillStyle = shell(c, p, 0, 0, h * 0.9);
      c.beginPath(); c.ellipse(-h * 0.3, 0, h * 0.95, h * 0.52, 0, 0, TAU); c.fill();   /* the palm */
      /* the fixed finger and the movable dactyl — filled wedges with a gape */
      c.beginPath();
      c.moveTo(-h * 1.0, -h * 0.30);
      c.quadraticCurveTo(-h * 1.9, -h * 0.55, -h * 2.25, -h * 0.30);   /* upper finger out */
      c.quadraticCurveTo(-h * 1.8, -h * 0.28, -h * 1.05, -h * 0.02);   /* back along its underside */
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(-h * 1.0, h * 0.28);
      c.quadraticCurveTo(-h * 1.8, h * 0.42, -h * 2.1, h * 0.16);      /* lower finger */
      c.quadraticCurveTo(-h * 1.7, h * 0.12, -h * 1.02, h * 0.02);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.30)'; c.lineWidth = 1.6;           /* the knuckle seam */
      c.beginPath(); c.moveTo(-h * 1.05, -h * 0.2); c.quadraticCurveTo(-h * 1.2, 0, -h * 1.05, h * 0.18); c.stroke();
      c.restore();
    }
  }
  for (let i = 0; i < 4; i++) {   /* walking legs under the carapace */
    c.strokeStyle = p.dark; c.lineWidth = 2.4;
    const ox = cx - L * 0.5 + i * h * 0.5;
    c.beginPath(); c.moveTo(ox, cy + h * 0.7); c.lineTo(ox - h * 0.3, cy + h * 1.9); c.stroke();
  }
  eyeDot(c, cx - L * 0.62, cy - h * 0.5, h * 0.24);
  /* CARAPACE SPECKLE — CLIPPED to the carapace it decorates, so no mark
     can drift off the body (Nick's artifact report) */
  c.save();
  c.beginPath(); c.ellipse(cx - L * 0.18, cy - h * 0.18, h * 1.55, h * 1.15, -0.16, 0, TAU); c.clip();
  for (let i = 0; i < 20; i++) {
    const a = r() * TAU, d = r() ** 0.7;
    softMark(c, cx - L * 0.18 + Math.cos(a) * h * 1.3 * d, cy - h * 0.18 + Math.sin(a) * h * 0.9 * d,
      h * (0.14 + r() * 0.16), h * (0.10 + r() * 0.12),
      r() < 0.55 ? '26,18,12' : '250,240,220', 0.10 + r() * 0.14);
  }
  c.restore();
  sigShrimp();
}

/* ═══════════════ SOFT BODIES ═══════════════ */
type ResetWormSignature = 'earthworm' | 'flatworm' | 'iceWorm' | 'lancelet'
  | 'marineWorm' | 'polychaete' | 'scaleWorm';

type WormAxis = (u: number) => [number, number];

function wormFrame(at: WormAxis, u: number): { x: number; y: number; nx: number; ny: number; angle: number } {
  const q = Math.max(0, Math.min(1, u));
  const [x, y] = at(q);
  const [ax, ay] = at(Math.max(0, q - 0.004));
  const [bx, by] = at(Math.min(1, q + 0.004));
  const dx = bx - ax, dy = by - ay;
  const d = Math.max(0.001, Math.hypot(dx, dy));
  return { x, y, nx: -dy / d, ny: dx / d, angle: Math.atan2(dy, dx) };
}

/** One closed skin around a centreline. Limbs, scales and rings key off the
    same frames, so every cue grows from the body instead of floating beside it. */
function wormRibbonPath(c: Ctx, at: WormAxis, half: (u: number) => number, steps = 52): void {
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, f = wormFrame(at, u), w = half(u);
    const x = f.x + f.nx * w, y = f.y + f.ny * w;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i--) {
    const u = i / steps, f = wormFrame(at, u), w = half(u);
    c.lineTo(f.x - f.nx * w, f.y - f.ny * w);
  }
  c.closePath();
}

function fillWormRibbon(c: Ctx, at: WormAxis, half: (u: number) => number,
  fill: string | CanvasGradient, edge: string, edgeWidth = 2): void {
  c.beginPath(); wormRibbonPath(c, at, half); c.fillStyle = fill; c.fill();
  c.strokeStyle = edge; c.lineWidth = edgeWidth; c.lineJoin = 'round'; c.stroke();
}

function wormCrossline(c: Ctx, at: WormAxis, half: (u: number) => number, u: number, inset = 0.88): void {
  const f = wormFrame(at, u), w = half(u) * inset;
  c.beginPath();
  c.moveTo(f.x + f.nx * w, f.y + f.ny * w);
  c.quadraticCurveTo(f.x + Math.cos(f.angle) * 1.5, f.y + Math.sin(f.angle) * 1.5,
    f.x - f.nx * w, f.y - f.ny * w);
  c.stroke();
}

function resetWormBody(c: Ctx, p: Pal, signature: ResetWormSignature): void {
  const cx = S * 0.50, cy = S * 0.545;
  const wet = c.createLinearGradient(0, cy - S * 0.11, 0, cy + S * 0.10);
  wet.addColorStop(0, p.lit); wet.addColorStop(0.44, p.base); wet.addColorStop(1, p.dark);

  if (signature === 'flatworm') {
    /* A planarian is a paper-flat gliding ribbon. The two lateral head lobes
       are part of the silhouette, not ears pasted onto an earthworm tube. */
    shadow(c, cx + S * 0.01, cy + S * 0.115, S * 0.255);
    const flat = c.createLinearGradient(0, cy - 54, 0, cy + 54);
    flat.addColorStop(0, p.lit); flat.addColorStop(0.36, p.base); flat.addColorStop(1, p.dark);
    c.fillStyle = flat; c.beginPath();
    c.moveTo(S * 0.835, cy);
    c.quadraticCurveTo(S * 0.67, cy - 27, S * 0.30, cy - 31);
    c.quadraticCurveTo(S * 0.245, cy - 32, S * 0.205, cy - 51);
    c.quadraticCurveTo(S * 0.158, cy - 61, S * 0.138, cy - 42);
    c.lineTo(S * 0.185, cy - 17);
    c.lineTo(S * 0.112, cy);
    c.lineTo(S * 0.185, cy + 17);
    c.lineTo(S * 0.138, cy + 42);
    c.quadraticCurveTo(S * 0.158, cy + 61, S * 0.205, cy + 51);
    c.quadraticCurveTo(S * 0.245, cy + 32, S * 0.30, cy + 31);
    c.quadraticCurveTo(S * 0.67, cy + 27, S * 0.835, cy);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(208,222,228,0.48)'; c.lineWidth = 2.4; c.stroke();
    for (const sy of [-1, 1] as const) {
      c.fillStyle = '#0b1014'; c.beginPath(); c.arc(S * 0.215, cy + sy * 13, 7.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(236,244,245,0.88)'; c.beginPath(); c.arc(S * 0.218, cy + sy * 11.5, 2.4, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(220,232,234,0.16)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(S * 0.28, cy); c.quadraticCurveTo(S * 0.55, cy - 6, S * 0.78, cy); c.stroke();
    return;
  }

  if (signature === 'lancelet') {
    /* A translucent blade, pointed at both ends: its visible V-myomeres and
       oral cirri are chordate anatomy, not annelid rings and a cartoon eye. */
    const at: WormAxis = (u) => [S * (0.18 + u * 0.65), cy + Math.sin(u * Math.PI) * 2];
    const half = (u: number): number => S * 0.088 * Math.sin(Math.PI * u) ** 0.62;
    shadow(c, cx, cy + S * 0.105, S * 0.275);
    const translucent = c.createLinearGradient(0, cy - 42, 0, cy + 42);
    translucent.addColorStop(0, 'rgba(248,239,199,0.82)');
    translucent.addColorStop(0.52, 'rgba(226,210,161,0.62)');
    translucent.addColorStop(1, 'rgba(126,111,78,0.72)');
    fillWormRibbon(c, at, half, translucent, 'rgba(238,230,190,0.66)', 2.2);
    c.strokeStyle = 'rgba(94,80,52,0.62)'; c.lineWidth = 2.2; c.lineJoin = 'round';
    for (let i = 0; i < 15; i++) {
      const u = 0.11 + i * 0.052, f = wormFrame(at, u), w = half(u) * 0.72;
      const tx = Math.cos(f.angle), ty = Math.sin(f.angle);
      c.beginPath();
      c.moveTo(f.x + f.nx * w - tx * 8, f.y + f.ny * w - ty * 8);
      c.lineTo(f.x + tx * 5, f.y + ty * 5);
      c.lineTo(f.x - f.nx * w - tx * 8, f.y - f.ny * w - ty * 8);
      c.stroke();
    }
    c.strokeStyle = 'rgba(114,94,55,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(S * 0.19, cy); c.lineTo(S * 0.82, cy + 1); c.stroke();
    const mouth = wormFrame(at, 0.055);
    c.strokeStyle = 'rgba(225,209,163,0.90)'; c.lineWidth = 2.4; c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const t = i / 8 - 0.5, ex = mouth.x - S * (0.040 + Math.abs(t) * 0.018);
      const ey = mouth.y + t * S * 0.115;
      c.beginPath(); c.moveTo(mouth.x + 3, mouth.y + t * 15);
      c.quadraticCurveTo(mouth.x - 5, mouth.y + t * 26, ex, ey); c.stroke();
    }
    return;
  }

  if (signature === 'scaleWorm') {
    const at: WormAxis = (u) => [S * (0.18 + u * 0.64), cy + Math.sin((u - 0.08) * Math.PI * 1.35) * 8];
    const half = (u: number): number => S * (0.045 + 0.055 * Math.sin(Math.PI * u) ** 0.45);
    shadow(c, cx, cy + S * 0.135, S * 0.275);
    c.strokeStyle = 'rgba(185,126,88,0.90)'; c.lineCap = 'round';
    for (let i = 1; i <= 11; i++) {
      const u = 0.07 + i * 0.072, f = wormFrame(at, u), w = half(u);
      for (const side of [-1, 1] as const) for (let k = -1; k <= 1; k++) {
        c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(f.x + f.nx * side * w * 0.72, f.y + f.ny * side * w * 0.72);
        c.lineTo(f.x + f.nx * side * (w + 12) + Math.cos(f.angle) * k * 5,
          f.y + f.ny * side * (w + 12) + Math.sin(f.angle) * k * 5); c.stroke();
      }
    }
    fillWormRibbon(c, at, half, wet, p.dark, 2.5);
    for (let i = 10; i >= 0; i--) {
      const u = 0.10 + i * 0.073, f = wormFrame(at, u);
      for (const side of [-1, 1] as const) {
        c.save(); c.translate(f.x, f.y); c.rotate(f.angle);
        c.fillStyle = side < 0 ? 'rgba(151,142,121,0.98)' : 'rgba(111,105,91,0.98)';
        c.strokeStyle = 'rgba(224,216,192,0.48)'; c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-20, side * 2); c.quadraticCurveTo(-5, side * 28, 22, side * 18);
        c.quadraticCurveTo(26, side * 6, 12, side * 1); c.closePath(); c.fill(); c.stroke();
        c.restore();
      }
    }
    return;
  }

  const ice = signature === 'iceWorm';
  const marine = signature === 'marineWorm' || signature === 'polychaete';
  const poly = signature === 'polychaete';
  const at: WormAxis = ice
    ? (u) => [S * (0.16 + u * 0.69), cy + Math.sin(u * Math.PI * 3.1) * 8]
    : marine
      ? (u) => [S * (0.18 + u * 0.64), cy + Math.sin((u + 0.08) * Math.PI * 2.2) * (poly ? 10 : 17)]
      : (u) => [S * (0.17 + u * 0.67), cy + Math.sin((u + 0.10) * Math.PI * 2.1) * 28];
  const half = (u: number): number => {
    const middle = Math.sin(Math.PI * u) ** 0.48;
    if (ice) return 5.5 + middle * 2.6;
    if (marine) return 10 + middle * (poly ? 13 : 10);
    return 9 + middle * 15;
  };
  shadow(c, cx, cy + S * 0.12, S * (ice ? 0.27 : 0.285));

  if (marine) {
    for (let i = 1; i <= 16; i++) {
      const u = 0.055 + i * 0.0525, f = wormFrame(at, u), w = half(u);
      for (const side of [-1, 1] as const) {
        c.strokeStyle = p.dark; c.lineWidth = poly ? 8 : 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(f.x + f.nx * side * w * 0.68, f.y + f.ny * side * w * 0.68);
        c.lineTo(f.x + f.nx * side * (w + (poly ? 11 : 8)), f.y + f.ny * side * (w + (poly ? 11 : 8))); c.stroke();
        c.strokeStyle = poly ? 'rgba(238,185,104,0.95)' : 'rgba(210,176,147,0.88)'; c.lineWidth = 1.5;
        for (let k = -1; k <= 1; k++) {
          c.beginPath();
          c.moveTo(f.x + f.nx * side * (w + 5), f.y + f.ny * side * (w + 5));
          c.lineTo(f.x + f.nx * side * (w + (poly ? 23 : 17)) + Math.cos(f.angle) * k * 4,
            f.y + f.ny * side * (w + (poly ? 23 : 17)) + Math.sin(f.angle) * k * 4); c.stroke();
        }
      }
    }
  }

  fillWormRibbon(c, at, half, wet, p.dark, ice ? 1.8 : 2.4);
  c.strokeStyle = ice ? 'rgba(142,170,190,0.52)' : 'rgba(48,30,24,0.48)';
  c.lineWidth = ice ? 1 : 1.5;
  const rings = ice ? 33 : marine ? 22 : 26;
  for (let i = 1; i < rings; i++) wormCrossline(c, at, half, i / rings, ice ? 0.78 : 0.86);

  if (signature === 'earthworm') {
    const u0 = 0.15, span = 0.21;
    const saddleAt: WormAxis = (v) => at(u0 + v * span);
    const saddleHalf = (v: number): number => half(u0 + v * span) + 7 * Math.sin(Math.PI * v) ** 0.35;
    const saddle = c.createLinearGradient(0, cy - 35, 0, cy + 35);
    saddle.addColorStop(0, '#e2ad9a'); saddle.addColorStop(0.55, '#c98a78'); saddle.addColorStop(1, '#7c4d43');
    fillWormRibbon(c, saddleAt, saddleHalf, saddle, 'rgba(89,54,46,0.58)', 1.8);
    c.strokeStyle = 'rgba(94,57,48,0.44)'; c.lineWidth = 1.4;
    for (const v of [0.08, 0.50, 0.92]) wormCrossline(c, saddleAt, saddleHalf, v, 0.84);
    return;
  }

  if (ice) return;

  const head = wormFrame(at, 0.015), hw = half(0.015);
  c.strokeStyle = poly ? 'rgba(227,126,54,0.96)' : 'rgba(222,180,156,0.92)';
  c.lineCap = 'round'; c.lineWidth = poly ? 3.2 : 2.7;
  for (let i = 0; i < 4; i++) {
    const side = i < 2 ? -1 : 1, spread = i % 2 ? 1.0 : 0.55;
    c.beginPath(); c.moveTo(head.x + head.nx * side * hw * 0.35, head.y + head.ny * side * hw * 0.35);
    c.quadraticCurveTo(head.x - 16, head.y + side * (12 + spread * 8),
      head.x - (poly ? 42 : 34), head.y + side * (15 + spread * 15)); c.stroke();
  }
  if (poly) {
    c.strokeStyle = p.dark; c.lineWidth = 24; c.beginPath(); c.moveTo(head.x + 5, head.y); c.lineTo(head.x - 28, head.y); c.stroke();
    c.strokeStyle = p.base; c.lineWidth = 19; c.beginPath(); c.moveTo(head.x + 5, head.y); c.lineTo(head.x - 30, head.y); c.stroke();
    c.fillStyle = '#d9a147';
    for (const side of [-1, 1] as const) {
      c.beginPath(); c.moveTo(head.x - 31, head.y + side * 2);
      c.lineTo(head.x - 45, head.y + side * 9); c.lineTo(head.x - 38, head.y); c.closePath(); c.fill();
    }
  } else {
    c.save(); c.beginPath(); wormRibbonPath(c, at, half); c.clip();
    c.strokeStyle = 'rgba(88,228,214,0.32)'; c.lineWidth = 7;
    c.beginPath(); for (let i = 0; i <= 30; i++) { const q = i / 30, f = wormFrame(at, q); if (i) c.lineTo(f.x, f.y - 5); else c.moveTo(f.x, f.y - 5); } c.stroke();
    c.strokeStyle = 'rgba(184,112,234,0.24)'; c.lineWidth = 4;
    c.beginPath(); for (let i = 0; i <= 30; i++) { const q = i / 30, f = wormFrame(at, q); if (i) c.lineTo(f.x, f.y + 6); else c.moveTo(f.x, f.y + 6); } c.stroke();
    c.restore();
  }
}

export function wormBody(c: Ctx, g: G, pIn: Pal, opts: { bristles?: boolean; flat?: boolean; sucker?: boolean; hue?: string;
  /** Planarian head with auricles + cross-eyed ocelli; suppresses worm rings. */
  flatworm?: boolean;
  /** Two overlapping roof rows on a flattened scale worm. */
  scalePlates?: boolean;
  /** A leech has a sucker at both the leading and trailing end. */
  dualSuckers?: boolean;
  /** Exact reset-owned whole form; absent preserves the accepted Leech path. */
  resetSignature?: ResetWormSignature }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  const r = nrng(g, name, 0x0202);
  const cx = S * 0.48, cy = S * 0.54;
  if (opts.resetSignature) {
    resetWormBody(c, p, opts.resetSignature);
    return;
  }
  if (opts.flatworm) {
    /* The planarian must be one smooth ribbon, not thirty visible earthworm
       rings. Its arrowhead and auricles carry the whole species read. */
    const L = S * 0.245 * nv(name, 0x61, 0.10), H = S * 0.055 * nv(name, 0x62, 0.10);
    shadow(c, cx, cy + H * 1.9, L * 0.86);
    c.fillStyle = shell(c, p, cx, cy, L * 0.7);
    c.beginPath();
    c.moveTo(cx - L, cy);
    c.lineTo(cx - L * 0.72, cy - H * 1.25);   /* left auricle */
    c.lineTo(cx - L * 0.20, cy - H * 0.78);
    c.quadraticCurveTo(cx + L * 0.50, cy - H * 0.64, cx + L, cy);
    c.quadraticCurveTo(cx + L * 0.50, cy + H * 0.64, cx - L * 0.20, cy + H * 0.78);
    c.lineTo(cx - L * 0.72, cy + H * 1.25);   /* right auricle */
    c.closePath(); c.fill();
    rim(c, () => { c.moveTo(cx - L, cy); c.lineTo(cx - L * 0.72, cy - H * 1.25); c.lineTo(cx - L * 0.20, cy - H * 0.78); c.quadraticCurveTo(cx + L * 0.50, cy - H * 0.64, cx + L, cy); }, 2);
    c.fillStyle = '#101418';
    c.beginPath(); c.arc(cx - L * 0.58, cy - H * 0.27, H * 0.18, 0, TAU); c.fill();
    c.beginPath(); c.arc(cx - L * 0.58, cy + H * 0.27, H * 0.18, 0, TAU); c.fill();
    c.strokeStyle = `rgba(${p.cr * 0.55 | 0},${p.cg * 0.55 | 0},${p.cb * 0.55 | 0},0.38)`; c.lineWidth = 1.5;
    for (let i = 1; i < 5; i++) { const x = cx - L * 0.10 + i * L * 0.20; c.beginPath(); c.moveTo(x, cy - H * 0.43); c.quadraticCurveTo(x + L * 0.05, cy, x, cy + H * 0.43); c.stroke(); }
    return;
  }
  const N = 30, th = S * (opts.flat ? 0.078 : 0.030) * nv(name, 0x61, 0.16);
  /* ★ WAVE 59 — a flatworm is a BROAD FLAT LEAF-RIBBON, not the earthworm tube
     recoloured; a leech ARCHES like an inchworm. Both were failing as identical
     to Earthworm. flat = much wider + straight (a ribbon lies flat); sucker
     (leech) = a tall humped arch. */
  const wave = opts.flat ? nv(name, 0x62, 0.10) * 0.4 : nv(name, 0x62, 0.30);
  shadow(c, cx, cy + th * 2.4, S * 0.20);
  const arch = opts.sucker ? 1 : 0;   /* the leech's inchworm hump */
  const at = (i: number): [number, number] => {
    const u = i / (N - 1);
    return [cx - S * 0.21 + u * S * 0.42,
      cy + Math.sin(u * Math.PI * 2.1 * wave) * S * 0.052 * wave - arch * Math.sin(u * Math.PI) * S * 0.10];
  };
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = N - 1; i > 0; i--) {
    const [x0, y0] = at(i), [x1, y1] = at(i - 1);
    const u = i / (N - 1);
    const w = th * (opts.flat ? 1.0 : (0.55 + 0.55 * Math.sin(Math.PI * u ** 0.8)));
    if (opts.bristles) {   /* the polychaete's parapodia — a bristle worm bristles */
      c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.7 + 60 | 0)},${p.cg * 0.7 | 0},${p.cb * 0.7 | 0},0.85)`;
      c.lineWidth = 2;
      for (const s of [-1, 1] as const) {
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (r() - 0.5) * 6, y0 + s * w * 2.3); c.stroke();
      }
    }
    c.strokeStyle = p.dark; c.lineWidth = w * 2.1;
    c.beginPath(); c.moveTo(x0, y0 + w * 0.14); c.lineTo(x1, y1 + w * 0.14); c.stroke();
    c.strokeStyle = p.base; c.lineWidth = w * 1.9;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = w * 0.5; c.globalAlpha = (i % 3) ? 0.45 : 0.2;   /* the wet segments */
    c.beginPath(); c.moveTo(x0, y0 - w * 0.45); c.lineTo(x1, y1 - w * 0.45); c.stroke();
    c.globalAlpha = 1;
  }
  const [hx, hy] = at(0);
  c.fillStyle = shell(c, p, hx, hy, th * 1.2);
  c.beginPath(); c.ellipse(hx - th * 0.3, hy, th * 1.15, th * 0.95, 0, 0, TAU); c.fill();
  if (opts.sucker) { c.fillStyle = 'rgba(20,14,12,0.6)'; c.beginPath(); c.ellipse(hx - th * 1.1, hy, th * 0.5, th * 0.62, 0, 0, TAU); c.fill(); }
  else { eyeDot(c, hx - th * 0.7, hy - th * 0.3, th * 0.16); }
  if (opts.dualSuckers) {
    const [tx, ty] = at(N - 1);
    c.fillStyle = 'rgba(20,14,12,0.72)';
    c.beginPath(); c.ellipse(hx - th * 1.1, hy, th * 0.58, th * 0.70, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(tx + th * 0.82, ty, th * 0.62, th * 0.74, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(238,224,200,0.28)'; c.lineWidth = Math.max(1, th * 0.08);
    c.beginPath(); c.ellipse(hx - th * 1.1, hy, th * 0.45, th * 0.54, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(tx + th * 0.82, ty, th * 0.48, th * 0.58, 0, 0, TAU); c.stroke();
  }
  if (opts.scalePlates) {
    /* Paired overlapping scales roof the back, leaving the bristle tufts to
       break out BETWEEN plates instead of making fence posts. */
    for (const side of [-1, 1] as const) {
      for (let i = 1; i < N - 2; i += 2) {
        const [x, y] = at(i);
        c.fillStyle = `rgba(${p.cr * 0.70 | 0},${p.cg * 0.72 | 0},${p.cb * 0.74 | 0},0.94)`;
        c.beginPath(); c.ellipse(x, y + side * th * 0.18, th * 0.92, th * 0.70, 0.08, side < 0 ? Math.PI : 0, side < 0 ? TAU : Math.PI); c.fill();
        c.strokeStyle = 'rgba(226,230,220,0.26)'; c.lineWidth = 1.2;
        c.beginPath(); c.ellipse(x, y + side * th * 0.18, th * 0.92, th * 0.70, 0.08, side < 0 ? Math.PI : 0, side < 0 ? TAU : Math.PI); c.stroke();
      }
    }
  }
}

function resetBananaSlug(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0xBA6A);
  const cy = S * 0.615;
  shadow(c, S * 0.49, cy + S * 0.075, S * 0.285);

  const feeler = (near: boolean, upper: boolean): void => {
    const x0 = S * (near ? 0.716 : 0.690);
    const y0 = S * (upper ? (near ? 0.570 : 0.582) : (near ? 0.610 : 0.616));
    const x1 = S * (upper ? (near ? 0.875 : 0.785) : (near ? 0.858 : 0.820));
    const y1 = S * (upper ? (near ? 0.320 : 0.420) : (near ? 0.515 : 0.625));
    const kx = S * (upper ? (near ? 0.815 : 0.752) : (near ? 0.814 : 0.770));
    const ky = S * (upper ? (near ? 0.405 : 0.485) : (near ? 0.545 : 0.620));
    c.save();
    c.globalAlpha = near ? 1 : 0.88;
    c.strokeStyle = p.dark; c.lineWidth = upper ? 9 : 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo(kx, ky, x1, y1); c.stroke();
    c.strokeStyle = p.lit; c.globalAlpha *= 0.42; c.lineWidth = upper ? 3.2 : 2.4;
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo(kx, ky, x1, y1); c.stroke();
    c.restore();
    if (upper) {
      c.save(); c.globalAlpha = near ? 1 : 0.95;
      eyeDot(c, x1, y1, near ? 6.4 : 5.8); c.restore();
    } else {
      c.fillStyle = near ? p.dark : 'rgba(68,58,20,0.62)';
      c.beginPath(); c.arc(x1, y1, near ? 4.0 : 3.6, 0, TAU); c.fill();
    }
  };

  /* Far tentacles first; the single continuous body hides their roots. */
  feeler(false, true);
  feeler(false, false);

  const body = (): void => {
    c.moveTo(S * 0.205, cy + S * 0.030);
    c.bezierCurveTo(S * 0.220, cy - S * 0.045, S * 0.310, cy - S * 0.090, S * 0.405, cy - S * 0.083);
    c.bezierCurveTo(S * 0.510, cy - S * 0.080, S * 0.603, cy - S * 0.097, S * 0.675, cy - S * 0.063);
    c.bezierCurveTo(S * 0.736, cy - S * 0.035, S * 0.758, cy + S * 0.018, S * 0.730, cy + S * 0.052);
    c.bezierCurveTo(S * 0.678, cy + S * 0.085, S * 0.550, cy + S * 0.090, S * 0.390, cy + S * 0.088);
    c.lineTo(S * 0.258, cy + S * 0.085);
    c.bezierCurveTo(S * 0.218, cy + S * 0.083, S * 0.198, cy + S * 0.062, S * 0.205, cy + S * 0.030);
    c.closePath();
  };
  const bg = c.createLinearGradient(0, cy - S * 0.095, 0, cy + S * 0.095);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.48, p.base); bg.addColorStop(1, p.dark);
  c.fillStyle = bg; c.beginPath(); body(); c.fill();
  rim(c, body, 2.4);

  /* Mantle saddle is part of the body surface; the pneumostome opens through it. */
  c.fillStyle = 'rgba(86,69,18,0.20)';
  c.beginPath();
  c.moveTo(S * 0.500, cy - S * 0.078);
  c.bezierCurveTo(S * 0.548, cy - S * 0.102, S * 0.625, cy - S * 0.092, S * 0.668, cy - S * 0.055);
  c.bezierCurveTo(S * 0.640, cy - S * 0.015, S * 0.555, cy - S * 0.012, S * 0.500, cy - S * 0.034);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,244,148,0.32)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(S * 0.500, cy - S * 0.077);
  c.bezierCurveTo(S * 0.555, cy - S * 0.100, S * 0.626, cy - S * 0.086, S * 0.668, cy - S * 0.055); c.stroke();
  c.fillStyle = 'rgba(42,33,13,0.88)';
  c.beginPath(); c.ellipse(S * 0.615, cy - S * 0.041, 8.5, 5.8, -0.18, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,238,124,0.55)'; c.lineWidth = 1.4;
  c.beginPath(); c.ellipse(S * 0.615, cy - S * 0.041, 10.3, 7.3, -0.18, 0, TAU); c.stroke();

  /* The muscular foot is a continuous lower margin, not a separate pasted sole. */
  c.strokeStyle = 'rgba(64,48,12,0.52)'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.245, cy + S * 0.074);
  c.bezierCurveTo(S * 0.390, cy + S * 0.085, S * 0.595, cy + S * 0.085, S * 0.706, cy + S * 0.050); c.stroke();
  c.strokeStyle = 'rgba(255,249,174,0.48)'; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(S * 0.275, cy - S * 0.054);
  c.bezierCurveTo(S * 0.405, cy - S * 0.083, S * 0.540, cy - S * 0.075, S * 0.640, cy - S * 0.063); c.stroke();
  for (let i = 0; i < 10; i++) {
    softMark(c, S * (0.275 + r() * 0.39), cy - S * (0.005 + r() * 0.045), 7 + r() * 5, 3 + r() * 3,
      '72,58,14', 0.20);
  }

  feeler(true, false);
  feeler(true, true);
}

function resetChiton(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0xC417);
  const cx = S * 0.50, cy = S * 0.56;
  const rx = S * 0.295, ry = S * 0.145;
  shadow(c, cx, cy + ry * 0.72, rx * 0.90);
  const girdle = (): void => {
    c.moveTo(cx - rx, cy);
    c.bezierCurveTo(cx - rx * 0.95, cy - ry * 0.70, cx - rx * 0.58, cy - ry, cx, cy - ry);
    c.bezierCurveTo(cx + rx * 0.58, cy - ry, cx + rx * 0.96, cy - ry * 0.70, cx + rx, cy);
    c.bezierCurveTo(cx + rx * 0.95, cy + ry * 0.72, cx + rx * 0.56, cy + ry, cx, cy + ry);
    c.bezierCurveTo(cx - rx * 0.58, cy + ry, cx - rx * 0.95, cy + ry * 0.70, cx - rx, cy);
    c.closePath();
  };
  c.fillStyle = shell(c, p, cx, cy, rx * 0.88);
  c.beginPath(); girdle(); c.fill();
  rim(c, girdle, 2.5);

  /* Thick leathery girdle remains visibly continuous around all eight plates. */
  c.fillStyle = 'rgba(28,34,28,0.34)';
  c.beginPath(); c.ellipse(cx, cy, rx * 0.78, ry * 0.70, 0, 0, TAU); c.fill();
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU;
    const rr = 0.80 + r() * 0.13;
    softMark(c, cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr,
      5 + r() * 4, 3 + r() * 3, '210,205,176', 0.16, a);
  }

  const plateXs = Array.from({ length: 8 }, (_, i) => cx - rx * 0.57 + i * rx * 0.163);
  for (let i = 7; i >= 0; i--) {
    const x = plateXs[i]!;
    const arch = Math.sin(((i + 0.5) / 8) * Math.PI);
    const ph = ry * (0.48 + arch * 0.14);
    const pw = rx * 0.112;
    const pg = c.createLinearGradient(x - pw, cy - ph, x + pw, cy + ph);
    pg.addColorStop(0, p.lit); pg.addColorStop(0.50, p.base); pg.addColorStop(1, p.dark);
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(x - pw, cy - ph * 0.82);
    c.quadraticCurveTo(x, cy - ph * 1.08, x + pw, cy - ph * 0.78);
    c.quadraticCurveTo(x + pw * 1.18, cy, x + pw, cy + ph * 0.78);
    c.quadraticCurveTo(x, cy + ph * 1.08, x - pw, cy + ph * 0.82);
    c.quadraticCurveTo(x - pw * 0.55, cy, x - pw, cy - ph * 0.82);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(19,25,22,0.70)'; c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = 'rgba(238,238,214,0.30)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x - pw * 0.74, cy - ph * 0.63);
    c.quadraticCurveTo(x, cy - ph * 0.86, x + pw * 0.72, cy - ph * 0.58); c.stroke();
  }
  c.strokeStyle = 'rgba(240,232,198,0.30)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, rx * 0.79, ry * 0.72, 0, 0, TAU); c.stroke();
}

export function slugBody(c: Ctx, g: G, pIn: Pal, opts: { cerata?: boolean; plated?: boolean; hue?: string }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  if (name === 'Banana Slug') { resetBananaSlug(c, g, p, name); return; }
  if (name === 'Chiton') { resetChiton(c, g, p, name); return; }
  const r = nrng(g, name, 0x51A6);
  const cx = S * 0.48, cy = S * 0.56;
  const L = S * 0.185 * nv(name, 0x71, 0.14), h = S * 0.048 * nv(name, 0x72, 0.16);
  shadow(c, cx, cy + h * 1.6, L * 0.9);
  if (opts.cerata) {   /* the nudibranch's plumes — the most flamboyant animal here */
    for (let i = 0; i < 16; i++) {
      const u = i / 15, x = cx - L * 0.72 + u * L * 1.44;
      const len = h * (1.5 + Math.sin(u * Math.PI) * 1.4);
      const col = `rgba(${Math.min(255, p.cr * 0.5 + 120 | 0)},${Math.min(255, p.cg * 0.6 + 40 | 0)},${Math.min(255, p.cb * 0.5 + 110 | 0)},0.9)`;
      c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, cy - h * 0.3);
      c.quadraticCurveTo(x + 6, cy - h * 0.3 - len * 0.7, x + (r() - 0.5) * 10, cy - h * 0.3 - len); c.stroke();
    }
  }
  c.fillStyle = shell(c, p, cx, cy, L * 0.6);   /* the muscular foot */
  c.beginPath();
  c.moveTo(cx - L * 0.92, cy + h * 0.5);
  c.quadraticCurveTo(cx - L * 0.98, cy - h * 0.85, cx - L * 0.35, cy - h * 0.92);
  c.quadraticCurveTo(cx + L * 0.55, cy - h * 1.0, cx + L * 0.92, cy - h * 0.30);
  c.quadraticCurveTo(cx + L * 1.02, cy + h * 0.42, cx + L * 0.60, cy + h * 0.56);
  c.closePath(); c.fill();
  rim(c, () => { c.moveTo(cx - L * 0.92, cy + h * 0.5); c.quadraticCurveTo(cx - L * 0.98, cy - h * 0.85, cx - L * 0.35, cy - h * 0.92); c.quadraticCurveTo(cx + L * 0.55, cy - h * 1.0, cx + L * 0.92, cy - h * 0.30); }, 2);
  if (opts.plated) {   /* the chiton's eight overlapping plates */
    c.fillStyle = `rgba(${p.cr * 0.6 | 0},${p.cg * 0.6 | 0},${p.cb * 0.6 | 0},0.85)`;
    for (let i = 0; i < 8; i++) {
      const x = cx - L * 0.7 + i * L * 0.20;
      c.beginPath(); c.ellipse(x, cy - h * 0.42, L * 0.13, h * 0.46, 0, Math.PI, TAU); c.fill();
    }
  } else {
    for (let i = 0; i < 14; i++) softMark(c, cx - L * 0.8 + r() * L * 1.6, cy - h * 0.4 + (r() - 0.5) * h, 8 + r() * 7, 5 + r() * 5, '30,24,16', 0.22);
  }
  c.strokeStyle = p.base; c.lineWidth = h * 0.30; c.lineCap = 'round';   /* the eyestalks */
  for (const [dx, dy] of [[0.10, -0.95], [0.20, -0.72]] as const) {
    c.beginPath(); c.moveTo(cx + L * 0.86, cy - h * 0.55);
    c.quadraticCurveTo(cx + L * (0.86 + dx * 0.4), cy - h * 1.0, cx + L * (0.86 + dx), cy + h * dy);
    c.stroke();
    eyeDot(c, cx + L * (0.86 + dx), cy + h * dy, h * 0.16);
  }
}

function resetCombJelly(c: Ctx, p: Pal): void {
  const cx = S * 0.50, cy = S * 0.495;
  const rx = S * 0.180, ry = S * 0.285;
  const membrane = c.createRadialGradient(cx - rx * 0.34, cy - ry * 0.38, 4, cx, cy, ry * 1.05);
  membrane.addColorStop(0, 'rgba(255,255,255,0.66)');
  membrane.addColorStop(0.42, `rgba(${p.cr},${p.cg},${p.cb},0.32)`);
  membrane.addColorStop(0.78, `rgba(${p.cr},${p.cg},${p.cb},0.18)`);
  membrane.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.07)`);
  c.fillStyle = membrane;
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(226,246,255,0.54)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.stroke();

  c.save();
  c.beginPath(); c.ellipse(cx, cy, rx * 0.965, ry * 0.965, 0, 0, TAU); c.clip();
  const rows = [-0.79, -0.57, -0.34, -0.11, 0.11, 0.34, 0.57, 0.79];
  for (let i = 0; i < rows.length; i++) {
    const off = rows[i]!;
    const span = ry * Math.sqrt(1 - off * off) * 0.88;
    c.strokeStyle = `hsla(${i * 43 + 8},92%,72%,0.18)`; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx + off * rx * 0.92, cy - span);
    c.quadraticCurveTo(cx + off * rx * 1.08, cy, cx + off * rx * 0.92, cy + span); c.stroke();
    for (let k = 0; k < 9; k++) {
      const u = k / 8;
      const y = cy - span + u * span * 2;
      const bulge = 1 + Math.sin(u * Math.PI) * 0.13;
      const x = cx + off * rx * 0.92 * bulge;
      c.save(); c.translate(x, y); c.rotate(off * 0.22);
      c.fillStyle = `hsla(${(i * 43 + k * 9) % 360},96%,76%,0.92)`;
      c.beginPath(); c.ellipse(0, 0, 5.8, 2.5, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  c.strokeStyle = 'rgba(210,236,244,0.26)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx, cy - ry * 0.82);
  c.bezierCurveTo(cx - rx * 0.16, cy - ry * 0.22, cx + rx * 0.16, cy + ry * 0.22, cx, cy + ry * 0.78); c.stroke();
  c.restore();
  c.fillStyle = 'rgba(230,249,255,0.42)';
  c.beginPath(); c.ellipse(cx, cy + ry * 0.68, rx * 0.10, ry * 0.055, 0, 0, TAU); c.fill();
}

function resetManOfWar(c: Ctx, g: G, p: Pal, name: string): void {
  const r = nrng(g, name, 0xF10A7);
  const floatY = S * 0.390;
  /* The feeding colony hangs from a compact patch beneath the pneumatophore,
     not evenly around the rim of a jellyfish bell. */
  for (let i = 0; i < 12; i++) {
    const u = i / 11;
    const x = S * (0.405 + u * 0.205);
    const len = S * (0.32 + r() * 0.25);
    const sway = S * ((r() - 0.5) * 0.16);
    c.strokeStyle = `rgba(${Math.min(255, p.cr + 35)},${Math.min(255, p.cg + 22)},${Math.min(255, p.cb + 48)},${0.44 + (i % 3) * 0.10})`;
    c.lineWidth = i % 3 === 0 ? 5.4 : 2.8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, floatY + S * 0.012);
    c.bezierCurveTo(x + sway, floatY + len * 0.30, x - sway * 0.72, floatY + len * 0.68,
      x + sway * 1.12, floatY + len); c.stroke();
    if (i % 3 === 0) {
      for (let k = 1; k <= 3; k++) {
        const y = floatY + len * (0.15 + k * 0.14);
        c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.58)`;
        c.beginPath(); c.ellipse(x + sway * (k % 2 ? 0.24 : -0.18), y, 5.2, 9, 0.25, 0, TAU); c.fill();
      }
    }
  }

  const floatPath = (): void => {
    c.moveTo(S * 0.180, floatY);
    c.bezierCurveTo(S * 0.220, floatY - S * 0.046, S * 0.355, floatY - S * 0.066, S * 0.500, floatY - S * 0.055);
    c.bezierCurveTo(S * 0.650, floatY - S * 0.070, S * 0.790, floatY - S * 0.036, S * 0.820, floatY);
    c.bezierCurveTo(S * 0.775, floatY + S * 0.034, S * 0.635, floatY + S * 0.043, S * 0.505, floatY + S * 0.034);
    c.bezierCurveTo(S * 0.350, floatY + S * 0.046, S * 0.215, floatY + S * 0.030, S * 0.180, floatY);
    c.closePath();
  };
  const fg = c.createLinearGradient(0, floatY - S * 0.075, 0, floatY + S * 0.048);
  fg.addColorStop(0, 'rgba(224,198,255,0.92)');
  fg.addColorStop(0.42, `rgba(${p.cr},${p.cg},${p.cb},0.90)`);
  fg.addColorStop(1, 'rgba(42,43,132,0.88)');
  c.fillStyle = fg; c.beginPath(); floatPath(); c.fill();
  c.strokeStyle = 'rgba(222,230,255,0.64)'; c.lineWidth = 2.6; c.beginPath(); floatPath(); c.stroke();

  /* The crimped sail rises from, and shares its base with, the gas float. */
  const sail = (): void => {
    c.moveTo(S * 0.285, floatY - S * 0.018);
    c.bezierCurveTo(S * 0.315, floatY - S * 0.105, S * 0.355, floatY - S * 0.158, S * 0.395, floatY - S * 0.132);
    c.bezierCurveTo(S * 0.430, floatY - S * 0.194, S * 0.475, floatY - S * 0.226, S * 0.510, floatY - S * 0.165);
    c.bezierCurveTo(S * 0.548, floatY - S * 0.232, S * 0.598, floatY - S * 0.188, S * 0.620, floatY - S * 0.132);
    c.bezierCurveTo(S * 0.655, floatY - S * 0.172, S * 0.698, floatY - S * 0.095, S * 0.720, floatY - S * 0.020);
    c.bezierCurveTo(S * 0.605, floatY - S * 0.052, S * 0.405, floatY - S * 0.055, S * 0.285, floatY - S * 0.018);
    c.closePath();
  };
  const sg = c.createLinearGradient(0, floatY - S * 0.235, 0, floatY - S * 0.018);
  sg.addColorStop(0, 'rgba(222,190,255,0.78)');
  sg.addColorStop(0.55, `rgba(${Math.min(255, p.cr + 45)},${Math.min(255, p.cg + 32)},255,0.60)`);
  sg.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.82)`);
  c.fillStyle = sg; c.beginPath(); sail(); c.fill();
  c.strokeStyle = 'rgba(232,221,255,0.72)'; c.lineWidth = 2.8; c.beginPath(); sail(); c.stroke();
  c.strokeStyle = 'rgba(77,69,180,0.34)'; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const u = i / 4;
    const x = S * (0.345 + u * 0.310);
    c.beginPath(); c.moveTo(x, floatY - S * 0.038);
    c.quadraticCurveTo(x - S * 0.015, floatY - S * (0.115 + Math.sin(u * Math.PI) * 0.058),
      x, floatY - S * (0.105 + Math.sin(u * Math.PI) * 0.082)); c.stroke();
  }
  c.strokeStyle = 'rgba(235,224,255,0.42)'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(S * 0.245, floatY - S * 0.020);
  c.bezierCurveTo(S * 0.410, floatY - S * 0.052, S * 0.650, floatY - S * 0.060, S * 0.770, floatY - S * 0.018); c.stroke();
}

export function jellyBody(c: Ctx, g: G, pIn: Pal, opts: { comb?: boolean; float?: boolean; barrel?: boolean; hue?: string }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  if (name === 'Comb Jelly') { resetCombJelly(c, p); return; }
  if (name === 'Portuguese Man-of-War') { resetManOfWar(c, g, p, name); return; }
  const r = nrng(g, name, 0x1E11);
  const cx = S * 0.50, cy = S * 0.38;
  const bw = S * (opts.barrel ? 0.115 : 0.135) * nv(name, 0x81, 0.14);
  const bh = bw * (opts.comb ? 1.15 : opts.float ? 0.72 : 0.80);
  if (opts.float) {   /* the man-of-war's gas float rides ABOVE the water */
    c.fillStyle = `rgba(${Math.min(255, p.cr * 0.6 + 90 | 0)},${Math.min(255, p.cg * 0.5 + 70 | 0)},${Math.min(255, p.cb * 0.5 + 120 | 0)},0.9)`;
    c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(220,200,255,0.6)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx - bw * 0.7, cy - bh * 0.5);
    c.quadraticCurveTo(cx, cy - bh * 1.7, cx + bw * 0.7, cy - bh * 0.5); c.stroke();   /* the crest */
  } else {
    const bg = c.createRadialGradient(cx - bw * 0.3, cy - bh * 0.4, 3, cx, cy, bw * 1.2);
    bg.addColorStop(0, 'rgba(255,255,255,0.55)');
    bg.addColorStop(0.5, `rgba(${p.cr},${p.cg},${p.cb},0.55)`);
    bg.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.16)`);
    c.fillStyle = bg;
    c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, Math.PI, TAU); c.fill();
    c.beginPath(); c.ellipse(cx, cy, bw, bh * 0.34, 0, 0, Math.PI); c.fill();
    rim(c, () => c.ellipse(cx, cy, bw, bh, 0, Math.PI, TAU), 2.2);
    if (opts.comb) {   /* the ctenophore's eight iridescent comb rows */
      for (let i = -3; i <= 3; i++) {
        c.strokeStyle = `hsla(${(i + 4) * 40},90%,70%,0.55)`; c.lineWidth = 3;
        c.beginPath(); c.moveTo(cx + i * bw * 0.24, cy - bh * 0.9);
        c.quadraticCurveTo(cx + i * bw * 0.30, cy, cx + i * bw * 0.20, cy + bh * 0.3); c.stroke();
      }
    }
  }
  const tips = opts.float ? 26 : opts.comb ? 2 : 18;
  const drift = opts.comb ? 0.55 : 1;   /* a ctenophore's pair TRAILS, it does not stand */
  for (let i = 0; i < tips; i++) {
    const u = i / Math.max(1, tips - 1);
    const x = cx - bw * 0.86 + u * bw * 1.72;
    const len = S * (opts.float ? 0.20 + r() * 0.18 : opts.comb ? 0.20 : 0.13 + r() * 0.10) * drift;
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.7 + 60 | 0)},${Math.min(255, p.cg * 0.7 + 60 | 0)},${Math.min(255, p.cb * 0.7 + 70 | 0)},${opts.float ? 0.7 : 0.55})`;
    c.lineWidth = opts.comb ? 3 : 2.2; c.lineCap = 'round';
    const sway = opts.comb ? (i === 0 ? -1 : 1) * bw * 0.28 : (r() - 0.5) * 34;
    c.beginPath(); c.moveTo(x, cy + bh * (opts.float ? 0.7 : 0.28));
    c.bezierCurveTo(x + sway * 0.7, cy + bh + len * 0.35, x - sway * 0.5, cy + bh + len * 0.72,
      x + sway * 1.15, cy + bh + len);
    c.stroke();
  }
  if (!opts.float && !opts.comb) {   /* the four frilled oral arms */
    for (let i = 0; i < 4; i++) {
      const x = cx - bw * 0.34 + i * bw * 0.23;
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.5)`; c.lineWidth = 7;
      c.beginPath(); c.moveTo(x, cy + bh * 0.2);
      c.quadraticCurveTo(x + (r() - 0.5) * 20, cy + bh * 1.6, x + (r() - 0.5) * 30, cy + bh * 2.5); c.stroke();
    }
  }
}

type ResetSessileSignature = 'barnacle' | 'coral' | 'coldCoral' | 'deepCoral' | 'sponge' | 'seaCucumber';

function resetCoralBody(c: Ctx, g: G, p: Pal,
  signature: 'coral' | 'coldCoral' | 'deepCoral', name: string): void {
  const r = nrng(g, name, 0xC0A1);
  const cx = S * 0.50, base = S * 0.775;
  const cold = signature !== 'coral', deep = signature === 'deepCoral';
  const branch = deep ? '#d9c7b5' : cold ? '#eee5d4' : p.base;
  const branchDark = deep ? '#78645b' : cold ? '#8f887d' : p.dark;
  const branchLight = deep ? '#f0dfca' : cold ? '#fff8e9' : p.lit;
  const cup = deep ? '#c85a3e' : cold ? '#d9b8ac' : '#f4a184';
  const tips: Array<[number, number, number]> = [];
  shadow(c, cx, base + 5, S * 0.245);

  const grow = (x: number, y: number, angle: number, len: number, width: number, depth: number): void => {
    const bend = (r() - 0.5) * 0.16;
    const ex = x + Math.cos(angle + bend) * len;
    const ey = y + Math.sin(angle + bend) * len;
    const mx = x + Math.cos(angle - bend) * len * 0.52;
    const my = y + Math.sin(angle - bend) * len * 0.52;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = branchDark; c.lineWidth = width + 4;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = branch; c.lineWidth = width;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    /* Calcified pitting follows the branch centre and therefore cannot float. */
    c.fillStyle = depth % 2 ? 'rgba(80,58,48,0.34)' : 'rgba(255,248,228,0.34)';
    c.beginPath(); c.arc((x + ex) * 0.5, (y + ey) * 0.5, Math.max(1.5, width * 0.12), 0, TAU); c.fill();
    if (depth >= 3 || len < 18) {
      tips.push([ex, ey, Math.max(5.5, width * 0.64)]);
      return;
    }
    const spread = (deep ? 0.54 : cold ? 0.48 : 0.60) + r() * 0.13;
    grow(ex, ey, angle - spread, len * (0.65 + r() * 0.04), width * 0.70, depth + 1);
    grow(ex, ey, angle + spread, len * (0.65 + r() * 0.04), width * 0.70, depth + 1);
  };

  const trunks = deep ? 5 : cold ? 4 : 5;
  for (let i = 0; i < trunks; i++) {
    const t = i / (trunks - 1) - 0.5;
    const x = cx + t * S * (deep ? 0.20 : 0.17);
    const angle = -Math.PI / 2 + t * (deep ? 0.48 : 0.36);
    const len = S * (cold ? 0.205 : deep ? 0.175 : 0.19) * (0.94 + r() * 0.12);
    grow(x, base, angle, len, cold ? 15 : 17, 0);
  }

  /* Every terminal branch owns a cup-shaped corallite/polyp. The dark well,
     raised rim and tentacles survive as one attached unit at actual-thumb. */
  for (let i = 0; i < tips.length; i++) {
    const [x, y, rad] = tips[i]!;
    c.fillStyle = branchLight; c.beginPath(); c.arc(x, y, rad + 2.5, 0, TAU); c.fill();
    c.fillStyle = 'rgba(26,18,20,0.86)'; c.beginPath(); c.ellipse(x, y, rad, rad * 0.62, 0, 0, TAU); c.fill();
    c.strokeStyle = cup; c.lineWidth = 2.6;
    c.beginPath(); c.ellipse(x, y, rad, rad * 0.62, 0, 0, TAU); c.stroke();
    if (i % 2 === 0) {
      c.strokeStyle = cup; c.lineWidth = 1.3; c.lineCap = 'round';
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU;
        c.beginPath(); c.moveTo(x + Math.cos(a) * rad * 0.5, y + Math.sin(a) * rad * 0.32);
        c.lineTo(x + Math.cos(a) * rad * 1.35, y + Math.sin(a) * rad * 0.86); c.stroke();
      }
    }
  }
}

function resetSessileBody(c: Ctx, g: G, p: Pal, signature: ResetSessileSignature, name: string): void {
  const r = nrng(g, name, 0x5E52);
  const cx = S * 0.50, base = S * 0.775;
  const seaCucumber = signature === 'seaCucumber';
  if (signature === 'coral' || signature === 'coldCoral' || signature === 'deepCoral') {
    resetCoralBody(c, g, p, signature, name);
    return;
  }

  if (signature === 'barnacle') {
    const w = S * 0.205, top = S * 0.405;
    shadow(c, cx, base + 4, w * 1.02);
    const chalk = c.createLinearGradient(cx - w, 0, cx + w, 0);
    chalk.addColorStop(0, '#9d978d'); chalk.addColorStop(0.32, '#eee9dc');
    chalk.addColorStop(0.70, '#c8c2b7'); chalk.addColorStop(1, '#77736d');
    c.fillStyle = chalk; c.beginPath();
    c.moveTo(cx - w, base); c.quadraticCurveTo(cx - w * 0.72, S * 0.53, cx - w * 0.38, top);
    c.quadraticCurveTo(cx, top - 8, cx + w * 0.38, top);
    c.quadraticCurveTo(cx + w * 0.72, S * 0.53, cx + w, base); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(55,49,43,0.55)'; c.lineWidth = 2;
    for (let i = -3; i <= 3; i++) {
      c.beginPath(); c.moveTo(cx + i * w * 0.105, top + Math.abs(i) * 1.5);
      c.quadraticCurveTo(cx + i * w * 0.20, S * 0.58, cx + i * w * 0.31, base); c.stroke();
    }
    /* Dark summit opening first; cirri rise from it and the opercular pair
       overlaps their roots, making the trapdoor anatomy explicit. */
    c.fillStyle = 'rgba(25,22,20,0.92)'; c.beginPath(); c.ellipse(cx, top, w * 0.39, w * 0.13, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(222,194,139,0.95)'; c.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const t = i / 7 - 0.5, ex = cx + t * 92 + 22, ey = top - 72 - Math.cos(t * Math.PI) * 24;
      c.lineWidth = 2.1; c.beginPath(); c.moveTo(cx + t * 24, top); c.quadraticCurveTo(cx + t * 55, top - 40, ex, ey); c.stroke();
      c.lineWidth = 1;
      for (let k = 1; k <= 5; k++) {
        const u = k / 6, px = cx + t * 24 + (ex - (cx + t * 24)) * u, py = top + (ey - top) * u;
        c.beginPath(); c.moveTo(px, py); c.lineTo(px - 8, py - 2 - k); c.stroke();
      }
    }
    for (const side of [-1, 1] as const) {
      c.fillStyle = '#d8d1c4'; c.strokeStyle = 'rgba(45,40,36,0.85)'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(cx + side * 2, top - 4);
      c.lineTo(cx + side * w * 0.37, top - 1); c.lineTo(cx + side * w * 0.25, top + 14);
      c.lineTo(cx + side * 4, top + 7); c.closePath(); c.fill(); c.stroke();
    }
    return;
  }

  if (signature === 'sponge') {
    shadow(c, cx, base + 5, S * 0.255);
    const porous = c.createLinearGradient(S * 0.25, 0, S * 0.76, 0);
    porous.addColorStop(0, p.dark); porous.addColorStop(0.40, p.base);
    porous.addColorStop(0.68, p.lit); porous.addColorStop(1, p.dark);
    const spongePath = (): void => {
      c.moveTo(S * 0.245, base);
      c.quadraticCurveTo(S * 0.235, S * 0.66, S * 0.31, S * 0.59);
      c.quadraticCurveTo(S * 0.33, S * 0.48, S * 0.40, S * 0.47);
      c.quadraticCurveTo(S * 0.47, S * 0.49, S * 0.48, S * 0.40);
      c.quadraticCurveTo(S * 0.50, S * 0.31, S * 0.58, S * 0.34);
      c.quadraticCurveTo(S * 0.65, S * 0.37, S * 0.64, S * 0.49);
      c.quadraticCurveTo(S * 0.70, S * 0.47, S * 0.73, S * 0.55);
      c.quadraticCurveTo(S * 0.79, S * 0.61, S * 0.76, base);
      c.quadraticCurveTo(cx, base + 10, S * 0.245, base); c.closePath();
    };
    c.beginPath(); spongePath(); c.fillStyle = porous; c.fill();
    c.strokeStyle = 'rgba(250,214,155,0.42)'; c.lineWidth = 2.5; c.stroke();
    /* Pores are drawn after the opaque body and clipped into its irregular
       mass; the old order painted them first and hid them under the chimney. */
    c.save(); c.beginPath(); spongePath(); c.clip();
    for (let i = 0; i < 54; i++) {
      const x = S * (0.27 + r() * 0.47), y = S * (0.37 + r() * 0.36);
      const pr = 2.5 + r() * 5.5;
      c.fillStyle = `rgba(43,25,20,${(0.45 + r() * 0.33).toFixed(2)})`;
      c.beginPath(); c.ellipse(x, y, pr, pr * (0.62 + r() * 0.24), r() * 0.8, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,225,174,0.26)'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(x - 1, y - 1, pr, pr * 0.67, 0, Math.PI, TAU); c.stroke();
    }
    c.restore();
    for (const hole of [[S * 0.365, S * 0.472, 21, 8], [S * 0.555, S * 0.345, 28, 10], [S * 0.695, S * 0.535, 19, 7]] as const) {
      c.fillStyle = 'rgba(23,17,18,0.92)'; c.beginPath(); c.ellipse(hole[0], hole[1], hole[2], hole[3], 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,219,160,0.48)'; c.lineWidth = 2.2; c.stroke();
    }
    return;
  }

  /* Sea cucumber: soft sagging body above two attached ventral foot rows. */
  if (!seaCucumber) return;
  const top = S * 0.50, bottom = S * 0.68;
  shadow(c, cx, base + 4, S * 0.285);
  c.lineCap = 'round';
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 12; i++) {
      const x = S * (0.30 + i * 0.035 + row * 0.016), y0 = bottom - row * 7;
      const reach = row ? 22 : 25;
      c.strokeStyle = p.dark; c.lineWidth = row ? 6 : 9;
      c.beginPath(); c.moveTo(x, y0 - 9); c.quadraticCurveTo(x + 2, y0 + 8, x + (i % 2 ? 3 : -3), y0 + reach); c.stroke();
      c.strokeStyle = p.lit; c.lineWidth = row ? 2.4 : 3.5;
      c.beginPath(); c.moveTo(x, y0 - 6); c.lineTo(x + (i % 2 ? 3 : -3), y0 + reach - 2); c.stroke();
    }
  }
  const skin = c.createLinearGradient(0, top - 30, 0, bottom + 20);
  skin.addColorStop(0, p.lit); skin.addColorStop(0.42, p.base); skin.addColorStop(1, p.dark);
  c.fillStyle = skin; c.beginPath();
  c.moveTo(S * 0.19, S * 0.58);
  c.quadraticCurveTo(S * 0.24, top, S * 0.39, top - 15);
  c.quadraticCurveTo(S * 0.64, top - 18, S * 0.80, S * 0.55);
  c.quadraticCurveTo(S * 0.84, S * 0.62, S * 0.75, bottom);
  c.quadraticCurveTo(S * 0.48, bottom + 18, S * 0.25, bottom - 2);
  c.quadraticCurveTo(S * 0.17, S * 0.65, S * 0.19, S * 0.58); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(224,205,174,0.32)'; c.lineWidth = 2.5; c.stroke();
  for (let i = 0; i < 18; i++) {
    const x = S * (0.25 + r() * 0.53), y = S * (0.53 + r() * 0.10);
    softMark(c, x, y, 4 + r() * 4, 3 + r() * 3, i % 2 ? '24,17,14' : '236,216,180', 0.28);
  }
  const mouthX = S * 0.195, mouthY = S * 0.58;
  c.fillStyle = 'rgba(35,20,18,0.70)'; c.beginPath(); c.ellipse(mouthX, mouthY, 12, 20, 0, 0, TAU); c.fill();
  c.strokeStyle = p.lit; c.lineWidth = 4.2; c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = -1.28 + i * 0.425, rootY = mouthY + Math.sin(a) * 12;
    const ex = mouthX - 52 - Math.cos(a) * 13, ey = mouthY + Math.sin(a) * 68;
    const mx = mouthX - 28, my = (rootY + ey) * 0.5;
    c.beginPath(); c.moveTo(mouthX + 2, rootY); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    const dx = ex - mx, dy = ey - my, d = Math.max(1, Math.hypot(dx, dy));
    const tx = dx / d, ty = dy / d, nx = -ty, ny = tx;
    for (const q of [0.58, 0.80]) for (const side of [-1, 1] as const) {
      const bx = mx + dx * q, by = my + dy * q;
      const spread = q < 0.7 ? 7 : 9;
      c.lineWidth = 2.7; c.beginPath(); c.moveTo(bx, by);
      c.quadraticCurveTo(bx + tx * 5 + nx * side * 3, by + ty * 5 + ny * side * 3,
        bx + tx * 11 + nx * side * spread, by + ty * 11 + ny * side * spread); c.stroke();
    }
  }
}

export function sessileBody(c: Ctx, g: G, pIn: Pal, opts: { kind: 'branch' | 'tube' | 'fan' | 'sac' | 'volcano';
  hue?: string; pores?: boolean;
  /** Exact reset-owned whole form; generic kinds remain available to callers. */
  resetSignature?: ResetSessileSignature }, name = ''): void {
  const p = hued(pIn, opts.hue);
  const r = nrng(g, name, 0x5E55);
  const cx = S * 0.50, base = S * 0.76;
  const H = S * 0.30 * nv(name, 0x91, 0.16);
  if (opts.resetSignature) {
    resetSessileBody(c, g, p, opts.resetSignature, name);
    return;
  }
  if (opts.kind === 'volcano') {
    /* ★ A BARNACLE IS NOT A TUBE. Its reference row calls it a "volcano-shaped
       chalky cone of fused plates with trapdoor plates at the summit", and it
       was sharing a spec with the Sponge — an irregular porous vase. They are
       not the same shape, the same colour, or the same height. */
    const w = S * 0.155, h = H * 0.62;
    const gg = c.createLinearGradient(cx - w, 0, cx + w, 0);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.45, p.base); gg.addColorStop(1, p.dark);
    shadow(c, cx, base + 4, w * 1.05);
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(cx - w, base);
    c.quadraticCurveTo(cx - w * 0.72, base - h * 0.72, cx - w * 0.34, base - h);
    c.lineTo(cx + w * 0.34, base - h);
    c.quadraticCurveTo(cx + w * 0.72, base - h * 0.72, cx + w, base);
    c.closePath(); c.fill();
    /* the fused plates: seams radiating from the summit down to the rim */
    c.strokeStyle = 'rgba(58,52,44,0.42)'; c.lineCap = 'round';
    for (let i = -3; i <= 3; i++) {
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(cx + (i / 3) * w * 0.34, base - h);
      c.lineTo(cx + (i / 3) * w, base);
      c.stroke();
    }
    /* the trapdoor at the summit, slightly open */
    c.fillStyle = 'rgba(30,28,24,0.72)';
    c.beginPath(); c.ellipse(cx, base - h, w * 0.34, h * 0.09, 0, 0, TAU); c.fill();
    c.fillStyle = p.lit;
    for (const sgn of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx + sgn * w * 0.05, base - h - h * 0.02);
      c.lineTo(cx + sgn * w * 0.33, base - h + h * 0.03);
      c.lineTo(cx + sgn * w * 0.05, base - h + h * 0.07);
      c.closePath(); c.fill();
    }
    /* ★ WAVE 66 — THE CIRRI: the feathery feeding fan sweeping out of the open
       trapdoor — the one live thing about a barnacle, and what says "animal,
       not rock". A curled comb of fine feathered rays. */
    c.strokeStyle = 'rgba(200,180,140,0.85)'; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const t = i / 6 - 0.5;
      const a = -Math.PI / 2 + t * 1.1 + 0.35;
      const len2 = h * (0.42 + Math.sin((i / 6) * Math.PI) * 0.22);
      const sx2 = cx + t * w * 0.2, sy2 = base - h - h * 0.02;
      const ex2 = sx2 + Math.cos(a) * len2, ey2 = sy2 + Math.sin(a) * len2;
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(sx2, sy2);
      c.quadraticCurveTo(sx2 + Math.cos(a) * len2 * 0.5 - len2 * 0.14, sy2 + Math.sin(a) * len2 * 0.6, ex2, ey2);
      c.stroke();
      c.lineWidth = 1;   /* the feather barbs down each ray */
      for (let k = 1; k <= 4; k++) { const u = k / 5;
        const px2 = sx2 + (ex2 - sx2) * u - len2 * 0.14 * Math.sin(u * Math.PI), py2 = sy2 + (ey2 - sy2) * u;
        c.beginPath(); c.moveTo(px2, py2); c.lineTo(px2 - len2 * 0.12, py2 - len2 * 0.05); c.stroke();
      }
    }
    c.strokeStyle = 'rgba(236,242,250,0.26)'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - w, base);
    c.quadraticCurveTo(cx - w * 0.72, base - h * 0.72, cx - w * 0.34, base - h);
    c.stroke();
    return;
  }
  shadow(c, cx, base + 4, S * 0.16);
  if (opts.kind === 'branch') {   /* a coral colony: recursive, thickening down */
    const draw = (x: number, y: number, a: number, len: number, w: number, d: number): void => {
      if (d > 5 || len < 5) return;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      c.strokeStyle = d < 2 ? p.dark : p.base; c.lineWidth = w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a - 0.2) * len * 0.6, y + Math.sin(a - 0.2) * len * 0.6, ex, ey); c.stroke();
      draw(ex, ey, a - 0.42 - r() * 0.2, len * 0.72, w * 0.68, d + 1);
      draw(ex, ey, a + 0.42 + r() * 0.2, len * 0.72, w * 0.68, d + 1);
    };
    /* several trunks, not one twig — a coral head is a COLONY */
    for (let k = -2; k <= 2; k++) {
      draw(cx + k * S * 0.030, base, -Math.PI / 2 + k * 0.16, H * (0.40 - Math.abs(k) * 0.05), 13 - Math.abs(k) * 2, 0);
    }
    for (let i = 0; i < 90; i++) {   /* the polyps */
      const a = r() * TAU, d = r() * H * 0.55;
      softMark(c, cx + Math.cos(a) * d, base - H * 0.45 + Math.sin(a) * d * 0.7, 5, 5,
        `${Math.min(255, p.cr * 0.5 + 120 | 0)},${Math.min(255, p.cg * 0.6 + 60 | 0)},${Math.min(255, p.cb * 0.5 + 90 | 0)}`, 0.5);
    }
  } else if (opts.kind === 'tube') {   /* a sponge: a thick chimney with an osculum */
    if (opts.pores) {
      /* its reference row: "large OSCULUM HOLES on the surface". A sponge is
         defined by being full of holes, and ours had none. */
      c.save();
      for (let i = 0; i < 26; i++) {
        const u = r(), v = r();
        const px = cx + (u - 0.5) * S * 0.20, py = base - v * H * 0.86;
        const pr = S * (0.006 + r() * 0.011);
        c.fillStyle = "rgba(28,22,18," + (0.26 + r() * 0.30).toFixed(2) + ")";
        c.beginPath(); c.ellipse(px, py, pr, pr * 0.82, 0, 0, TAU); c.fill();
        c.strokeStyle = "rgba(250,244,232,0.16)"; c.lineWidth = 1;
        c.beginPath(); c.ellipse(px, py - pr * 0.22, pr * 0.9, pr * 0.66, 0, Math.PI, TAU); c.stroke();
      }
      c.restore();
    }
    const w = S * 0.095;
    const gg = c.createLinearGradient(cx - w, 0, cx + w, 0);
    gg.addColorStop(0, p.dark); gg.addColorStop(0.42, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(cx - w * 1.15, base);
    c.quadraticCurveTo(cx - w * 0.78, base - H * 0.6, cx - w * 0.86, base - H);
    c.lineTo(cx + w * 0.86, base - H);
    c.quadraticCurveTo(cx + w * 0.78, base - H * 0.6, cx + w * 1.15, base);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(12,14,20,0.72)';
    c.beginPath(); c.ellipse(cx, base - H, w * 0.86, w * 0.30, 0, 0, TAU); c.fill();
    for (let i = 0; i < 44; i++) softMark(c, cx - w + r() * w * 2, base - r() * H, 4 + r() * 4, 4 + r() * 4, '20,16,12', 0.28);
    rim(c, () => c.ellipse(cx, base - H, w * 0.86, w * 0.30, 0, 0, TAU), 2);
  } else if (opts.kind === 'fan') {   /* a sea fan / sea squirt cluster */
    for (let i = 0; i < 40; i++) {
      const u = i / 39, a = -Math.PI / 2 + (u - 0.5) * 1.5;
      c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(cx, base);
      c.quadraticCurveTo(cx + Math.cos(a) * H * 0.35, base - H * 0.55, cx + Math.cos(a) * H * 0.62, base - H * (0.85 + Math.sin(u * Math.PI) * 0.25));
      c.stroke();
    }
  } else if (opts.kind === 'sac') {   /* a sac: sea cucumber / salp / pyrosome, lying along the floor */
    const L = S * 0.185, h = S * 0.058;
    const cy2 = base - h * 1.2;
    c.fillStyle = shell(c, p, cx, cy2, L * 0.6);
    c.beginPath(); c.ellipse(cx, cy2, L, h * 1.25, -0.03, 0, TAU); c.fill();
    rim(c, () => c.ellipse(cx, cy2, L, h, -0.05, -2.8, 0.3), 2);
    c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';   /* the papillae */
    for (let i = 0; i < 14; i++) {
      const x = cx - L * 0.86 + (i / 13) * L * 1.72;
      /* papillae are soft nubs ON the back, not spines sticking off it */
      softMark(c, x, cy2 - h * 0.85, h * 0.30, h * 0.22, r() < 0.5 ? '30,22,16' : '245,235,215', 0.30);
    }
    for (let i = 0; i < 8; i++) {   /* the feeding tentacles at the mouth */
      const a = -1.2 + i * 0.30;
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.85)`; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - L * 0.95, cy2);
      c.quadraticCurveTo(cx - L * 1.2, cy2 + Math.sin(a) * h, cx - L * 1.35, cy2 + Math.sin(a) * h * 2.2); c.stroke();
    }
  }
}

/* ── the roster: every key read out of the catalog ── */
/* ★ WAVE 67 — DAPHNIA. The shrimp chassis could not say any of the three
   must-reads: a TRANSLUCENT rounded carapace with the gut showing through, one
   large dark compound eye, and the pointed tail spine. A bespoke water flea. */
function waterFlea(c: Ctx, g: G, _pIn: Pal, name = ''): void {
  const r = nrng(g, name, 0xDAF1);
  const cx = S * 0.5, cy = S * 0.5, R = S * 0.17;
  shadow(c, cx, cy + R * 1.5, R * 1.1);
  /* the translucent carapace: an egg tilted forward, low alpha with a rim */
  const gg = c.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 2, cx, cy, R * 1.2);
  gg.addColorStop(0, 'rgba(230,245,235,0.5)'); gg.addColorStop(0.7, 'rgba(180,210,195,0.35)'); gg.addColorStop(1, 'rgba(120,160,145,0.3)');
  c.fillStyle = gg;
  c.save(); c.translate(cx, cy); c.rotate(0.35);
  c.beginPath(); c.ellipse(0, 0, R * 0.85, R * 1.1, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(190,220,205,0.8)'; c.lineWidth = 2; c.stroke();
  /* the gut visible THROUGH the shell — a dark curved band */
  c.strokeStyle = 'rgba(90,110,80,0.55)'; c.lineWidth = R * 0.16; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-R * 0.1, -R * 0.75); c.quadraticCurveTo(R * 0.25, 0, -R * 0.05, R * 0.8); c.stroke();
  /* eggs in the brood chamber (dorsal side) */
  c.fillStyle = 'rgba(150,170,110,0.7)';
  for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(-R * 0.42 + (r() - 0.5) * R * 0.15, -R * 0.25 + i * R * 0.24, R * 0.10, 0, TAU); c.fill(); }
  /* the pointed TAIL SPINE off the rear of the shell */
  c.strokeStyle = 'rgba(150,180,165,0.9)'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(0, R * 1.05); c.lineTo(R * 0.3, R * 1.65); c.stroke();
  c.restore();
  /* the head beak + ONE large dark compound eye */
  const hx = cx - R * 0.55, hy = cy - R * 0.75;
  c.fillStyle = 'rgba(190,215,200,0.6)';
  c.beginPath(); c.ellipse(hx, hy, R * 0.42, R * 0.38, -0.5, 0, TAU); c.fill();
  c.fillStyle = '#181c1a'; c.beginPath(); c.arc(hx - R * 0.1, hy - R * 0.05, R * 0.16, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(hx - R * 0.15, hy - R * 0.11, R * 0.05, 0, TAU); c.fill();
  /* the branched swimming antennae — the oars */
  c.strokeStyle = 'rgba(140,170,155,0.9)'; c.lineWidth = 2.2; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    const ex = hx - R * 0.55 + s * R * 0.1, ey = hy - R * 0.7 - s * R * 0.25;
    c.beginPath(); c.moveTo(hx, hy - R * 0.1); c.quadraticCurveTo(hx - R * 0.35, hy - R * 0.45, ex, ey); c.stroke();
    for (const k of [0.3, 0.6, 1]) { c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - R * 0.28 * k, ey - s * R * 0.12 + R * 0.18 * k); c.stroke(); }
  }
}
const I = (spec: InsectSpec): PainterI => (c, g, p, n) => insectBody(c, g, p, spec, n);
const A = (o: Parameters<typeof arachnid>[3]): PainterI => (c, g, p, n) => arachnid(c, g, p, o, n);
const M = (o: Parameters<typeof myriapod>[3]): PainterI => (c, g, p, n) => myriapod(c, g, p, o, n);
const C = (o: Parameters<typeof crabBody>[3]): PainterI => (c, g, p, n) => crabBody(c, g, p, o, n);
const P = (o: Parameters<typeof shrimpBody>[3]): PainterI => (c, g, p, n) => shrimpBody(c, g, p, o, n);
const W = (o: Parameters<typeof wormBody>[3]): PainterI => (c, g, p, n) => wormBody(c, g, p, o, n);
const G2 = (o: Parameters<typeof slugBody>[3]): PainterI => (c, g, p, n) => slugBody(c, g, p, o, n);
const J = (o: Parameters<typeof jellyBody>[3]): PainterI => (c, g, p, n) => jellyBody(c, g, p, o, n);
const X = (o: Parameters<typeof sessileBody>[3]): PainterI => (c, g, p, n) => sessileBody(c, g, p, o, n);

export const INVERT_NAME: Record<string, PainterI> = {
  /* ── INSECTS ── */
  /* ★ WAVE 22 — SHAPE, not colour, is what tells these apart. See InsectSpec.
     An ant: tiny, narrow, a pinched waist and a small head. */
  'Ant': I({ hue: '#4a2f22', abdomen: 0.72, broad: 0.72, eyes: 0.8, waist: true, antennae: 'elbow' }),
  /* a leafcutter is a MAJOR worker — famously big-headed, with the huge
     mandibular head that does the cutting. That is its whole read. */
  'Leafcutter Ant': I({ hue: '#8a4a2a', abdomen: 0.80, broad: 0.78, eyes: 1.45, waist: true, antennae: 'elbow' }),
  'Termite': I({ hue: '#d8c9a8', abdomen: 1.15, antennae: 'short' }),
  'Bee': I({ hue: '#d4a017', abdomen: 0.95, wings: 'lace', antennae: 'short', sting: true, fuzzy: true, pattern: 'bands' }),
  'Honeybee': I({ hue: '#b06a20', abdomen: 0.95, wings: 'lace', antennae: 'short', sting: true, fuzzy: true, pattern: 'bands' }),
  'Bumblebee': I({ hue: '#2a2621', abdomen: 1.05, wings: 'lace', antennae: 'short', sting: true, fuzzy: true, pattern: 'bands' }),
  'Orchid Bee': I({ hue: '#1f8f5f', abdomen: 0.9, wings: 'lace', antennae: 'short', fuzzy: true, pattern: 'bands' }),
  'Wasp': I({ hue: '#eec015', abdomen: 1.15, waist: true, wings: 'lace', antennae: 'short', sting: true, pattern: 'bands', wingScale: 1.6 }),
  'Moth': I({ hue: '#7f7566', abdomen: 1.0, wings: 'open', antennae: 'feather', fuzzy: true }),
  'Butterfly': I({ hue: '#d97328', abdomen: 0.9, wings: 'open', antennae: 'club', pattern: 'spots' }),
  /* a cicada is a broad blunt wedge with a very wide head and big wings */
  'Cicada': I({ hue: '#48544e', abdomen: 1.05, broad: 1.5, eyes: 1.5, carapace: true, wings: 'tent', wingScale: 1.45, antennae: 'short' }),
  'Mantis': I({ hue: '#66a03c', abdomen: 1.25, broad: 0.72, face: 'triangle', eyes: 1.25, wings: 'folded', antennae: 'long', raptor: true }),
  'Grasshopper': I({ hue: '#8f8f4a', abdomen: 1.20, broad: 0.92, face: 'slant', wings: 'folded', antennae: 'short', jumper: true }),
  'Locust': I({ hue: '#c2a24a', abdomen: 1.55, broad: 0.70, face: 'slant', wings: 'folded', wingScale: 1.2, antennae: 'short', jumper: true }),
  /* a cricket is humped and cylindrical, not flat, with very long antennae */
  'Cricket': I({ hue: '#3f3226', abdomen: 1.02, broad: 1.12, eyes: 0.9, face: 'slant', wings: 'folded', antennae: 'long', jumper: true }),
  /* a cockroach is a FLAT BROAD OVAL whose pronotal shield hides the head —
     the single most different silhouette in this group, and it had none of it */
  'Cockroach': I({ hue: '#6b3b1e', abdomen: 1.18, broad: 1.85, eyes: 0.7, shield: true, carapace: true, wings: 'folded', antennae: 'long' }),
  'Aphid': I({ hue: '#a8cf72', abdomen: 1.05, antennae: 'short' }),
  'Thrips': I({ hue: '#cdb464', abdomen: 2.3, broad: 0.38, wings: 'none', antennae: 'short', fringedWings: true, raspingMouth: true }),
  'Mosquito': I({ hue: '#5c565a', abdomen: 1.40, broad: 0.62, proboscis: true, wings: 'lace', antennae: 'feather' }),
  /* a fly is mostly EYE, and a black fly is a tiny hunched one */
  'Black Fly': I({ hue: '#33313a', abdomen: 0.68, broad: 1.15, eyes: 1.6, wings: 'lace', antennae: 'short' }),
  'Fly': I({ hue: '#4d5257', abdomen: 0.88, broad: 1.3, eyes: 1.9, wings: 'lace', antennae: 'short' }),
  'Stick Insect': I({ hue: '#8f7d4a', abdomen: 2.4, antennae: 'long', stick: true }),
  /* a2 · extremely long splayed middle and hind legs on a narrow boat body */
  'Water Strider': I({ hue: '#3a352d', abdomen: 0.7, antennae: 'long', legSpan: 3.1 }),
  'Giant Water Bug': I({ hue: '#745e33', abdomen: 1.3, broad: 2.2, carapace: true, shield: true, eyes: 0.8, antennae: 'short', raptor: true }),
  /* a cold-adapted insect is stout and heavily furred — a bumblebee build */
  'Cold-Adapted Insect': I({ hue: '#3c4249', abdomen: 0.95, broad: 1.55, eyes: 0.85, antennae: 'short', fuzzy: true }),
  /* ── ARACHNIDS: eight legs, no antennae ── */
  'Spider': A({ hue: '#7b5a3c', }),
  'Tarantula': A({ hue: '#3b2b25', big: true, hairy: true, pedipalps: true, fangs: true }),
  'Camel Spider': A({ hue: '#c9a468', big: true, hairy: true, longleg: true, anatomy: 'solifuge', pedipalps: true }),
  'Sea Spider': A({ hue: '#b39a86', longleg: true }),
  'Harvestman': A({ hue: '#5d4b40', longleg: true, legReach: 13.2, fused: true, ocularTurret: true, scale: 0.55 }),
  'Scorpion': A({ hue: '#a3762f', big: true, sting: true, claws: true }),
  'Pseudoscorpion': A({ claws: true, scale: 0.92, hue: '#5d4630' }),
  'Deer Tick': A({ hue: '#94402c', anatomy: 'tick' }),
  /* ★ WAVE 22 — a mite read as an ANT. It is not one: it is a tiny round
     unsegmented arachnid, and the common ones are conspicuously red. Redder, and drawn
     LARGER: shrinking it first made things worse, 0.60 to 0.51, because a
     small subject leaves mostly empty canvas and two mostly-empty cards look
     alike. Portrait scale is invisible when each species is framed alone. */
  'Mite': A({ scale: 0.95, hue: '#b0442c', anatomy: 'mite' }),
  /* ── MYRIAPODS ── */
  'Centipede': M({ flat: true, hue: '#b06a2c' }),
  'Giant Centipede': M({ flat: true, scale: 1.34, segs: 22, hue: '#7d2f28' }),
  'Millipede': M({ hue: '#4a3324', coil: true }),
  /* ── CRABS ── */
  'Crab': C({ hue: '#8f5a3b', wide: true }),
  'Mud Crab': C({ hue: '#4e5230', wide: true }),
  'Freshwater Crab': C({ hue: '#7d4c3d', }),
  'Vent Crab': C({ hue: '#fbf8f2', }),
  'Hermit Crab': C({ hue: '#cd8145', hermit: true }),
  'Coconut Crab': C({ hue: '#3f3f6e', big: true, wide: true, terrestrial: true, crusher: true }),
  /* ── SHRIMP, LOBSTER AND KIN ── */
  'Shrimp': P({ hue: '#cfa091', }),
  'Prawn': P({ hue: '#8d94a6', }),
  'Freshwater Shrimp': P({ hue: '#c6b78d', }),
  'Brine Shrimp': P({ tiny: true, stalks: true, scale: 0.90, hue: '#d98a5c' }),
  'Fairy Shrimp': P({ tiny: true, scale: 1.20, hue: '#e8c9a0' }),
  'Tadpole Shrimp': P({ tiny: true, stout: true, shield: true, scale: 1.05, hue: '#8a6f45' }),
  'Cave Shrimp': P({ hue: '#f0dfd8', }),
  'Vent Shrimp': P({ hue: '#e8bcae', }),
  'Krill': P({ tiny: true, gills: true, stalks: true, scale: 1.00, hue: '#e2705a' }),
  'Copepod': P({ hue: '#d18a4e', tiny: true, stout: true, eggSacs: true, forkedTail: true }),
  'Amphipod': P({ tiny: true, stout: true, scale: 0.74, hue: '#b9a274' }),
  'Water Flea': (c, g, p, n) => waterFlea(c, g, p, n),
  'Isopod': (c, g, p, n) => isopodBody(c, g, p, { hue: '#6e6c73' }, n),
  'Giant Isopod': (c, g, p, n) => isopodBody(c, g, p, { giant: true, hue: '#c3b2b8' }, n),
  'Lobster': P({ hue: '#2f3a4e', claws: true, stout: true, unequalClaws: true }),
  'Crayfish': P({ hue: '#6e6135', claws: true, stout: true, crayfish: true }),
  'Barnacle': X({ kind: 'volcano', hue: '#d8d2c4', resetSignature: 'barnacle' }),
  /* ── WORMS ── */
  'Earthworm': W({ hue: '#b0796a', resetSignature: 'earthworm' }),
  'Ice Worm': W({ hue: '#232c34', resetSignature: 'iceWorm' }),
  'Marine Worm': W({ hue: '#c6907c', resetSignature: 'marineWorm' }),
  'Polychaete Worm': W({ hue: '#a8481a', resetSignature: 'polychaete' }),
  'Scale Worm': W({ hue: '#6c6355', resetSignature: 'scaleWorm' }),
  'Flatworm': W({ hue: '#3c4040', resetSignature: 'flatworm' }),
  'Leech': W({ hue: '#473d22', sucker: true, flat: true, dualSuckers: true }),
  /* ── SLUGS AND KIN ── */
  'Banana Slug': G2({ hue: '#e3c22a', }),
  'Nudibranch': G2({ hue: '#c02f8a', cerata: true }),
  'Chiton': G2({ hue: '#5a6a5f', plated: true }),
  /* ── JELLIES ── */
  'Jellyfish': J({ hue: '#c8e0f0', }),
  'Comb Jelly': J({ hue: '#e8f2f6', comb: true }),
  'Portuguese Man-of-War': J({ hue: '#5a6ed0', float: true }),
  /* ── SESSILE AND SAC-BODIED ── */
  'Coral': X({ hue: '#e8735a', kind: 'branch', resetSignature: 'coral' }),
  'Cold-Water Coral': X({ hue: '#efe4cf', kind: 'branch', resetSignature: 'coldCoral' }),
  'Deep-Water Coral': X({ hue: '#9b1f2a', kind: 'branch', resetSignature: 'deepCoral' }),
  'Sponge': X({ kind: 'tube', pores: true, hue: '#c8823f', resetSignature: 'sponge' }),
  'Sea Cucumber': X({ hue: '#55412f', kind: 'sac', resetSignature: 'seaCucumber' }),
  'Lancelet': W({ hue: '#ecdfb5', resetSignature: 'lancelet' }),
};

/** ★ D-ART-131 — ISOPODS ARE NOT SHRIMP.
    Both were routed to `shrimpBody` with `stout: true`, which cannot produce a
    plated animal however it is parameterised — the audit found "a bulbous
    cephalothorax ball, a curled-under abdomen, two whip antennae and a feathery
    uropod fan", i.e. a krill, twice, in two colours. An isopod is the opposite
    shape: DORSOVENTRALLY FLATTENED, a broad low oval crossed by overlapping
    tergite bands, a semicircular head shield at the front and a solid
    triangular pleotelson at the back, with seven stout legs a side and short
    antennae. This is the one case in the arc where a parameter genuinely could
    not reach and a painter was the right answer. */
export function isopodBody(c: Ctx, g: G, pIn: Pal, opts: { giant?: boolean; hue?: string }, name = ''): void {
  const p = speciesHue(pIn, opts.hue);
  const r = nrng(g, name, 0x1509);
  const cx = S * 0.50, cy = S * 0.52;
  const bw = S * (opts.giant ? 0.225 : 0.165) * nv(name, 0x31, 0.10);
  const bh = bw * 0.46;                       /* FLAT — this is the whole read */
  shadow(c, cx, cy + bh * 1.5, bw * 0.92);

  /* seven stout pereopods a side, the far bank first and dimmer */
  for (const far of [true, false]) {
    const m = far ? 0.55 : 1;
    c.strokeStyle = `rgb(${(p.cr * 0.44 * m) | 0},${(p.cg * 0.42 * m) | 0},${(p.cb * 0.38 * m) | 0})`;
    c.lineWidth = bh * 0.15; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const u = -0.72 + (i / 6) * 1.44;
      const lx = cx + bw * u, ly = cy + bh * (far ? 0.30 : 0.68);
      const out = bw * (0.20 + Math.abs(u) * 0.06) * (far ? 0.72 : 1);
      c.beginPath(); c.moveTo(lx, ly);
      c.quadraticCurveTo(lx + out * 0.5, ly + bh * 0.55, lx + out, ly + bh * (far ? 0.75 : 1.05));
      c.stroke();
    }
  }

  if (name === 'Isopod') {
    /* Paired uropod paddles flank the pleotelson. Drawing them before the
       dorsum and terminal plate buries their roots in the continuous shell. */
    for (const side of [-1, 1] as const) {
      const ug = c.createLinearGradient(cx + bw * 0.78, cy, cx + bw * 1.48, cy + side * bh);
      ug.addColorStop(0, p.base); ug.addColorStop(1, p.dark);
      c.fillStyle = ug;
      c.beginPath();
      c.moveTo(cx + bw * 0.76, cy + side * bh * 0.42);
      c.bezierCurveTo(cx + bw * 1.02, cy + side * bh * 0.54, cx + bw * 1.35, cy + side * bh * 0.88,
        cx + bw * 1.53, cy + side * bh * 0.98);
      c.bezierCurveTo(cx + bw * 1.47, cy + side * bh * 0.57, cx + bw * 1.12, cy + side * bh * 0.27,
        cx + bw * 0.76, cy + side * bh * 0.42);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(218,224,222,0.42)'; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx + bw * 0.84, cy + side * bh * 0.44);
      c.quadraticCurveTo(cx + bw * 1.22, cy + side * bh * 0.58, cx + bw * 1.48, cy + side * bh * 0.92); c.stroke();
    }
  }

  /* the dorsum: one broad low oval, then the tergites laid across it */
  const gg = c.createLinearGradient(0, cy - bh, 0, cy + bh);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.45, p.base); gg.addColorStop(1, p.dark);
  c.fillStyle = gg;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  c.save();
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.clip();
  coatMaterial(c, ellipseTube(cx, cy, bw, bh, 0), r, p, 'chitin',
    { detail: CHITIN_DETAIL, seams: false });
  /* SEVEN TERGITES, each overlapping the one behind — the bands are the animal */
  for (let i = 0; i < 7; i++) {
    const u = -0.62 + (i / 6) * 1.24;
    const x = cx + bw * u;
    c.strokeStyle = 'rgba(0,0,0,0.30)'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(x, cy - bh); c.quadraticCurveTo(x + bw * 0.04, cy, x, cy + bh); c.stroke();
    c.strokeStyle = 'rgba(255,252,242,0.16)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x + bw * 0.022, cy - bh); c.quadraticCurveTo(x + bw * 0.062, cy, x + bw * 0.022, cy + bh); c.stroke();
  }
  c.restore();
  rim(c, () => c.ellipse(cx, cy, bw, bh, 0, -2.9, 0.25), 2.2);

  /* the head shield in front, and the solid pleotelson plate behind */
  c.fillStyle = shell(c, p, cx - bw * 0.92, cy, bw * 0.28);
  c.beginPath(); c.ellipse(cx - bw * 0.94, cy, bw * 0.26, bh * 0.86, 0, 0, TAU); c.fill();
  c.fillStyle = shell(c, p, cx + bw * 0.86, cy, bw * 0.30);
  c.beginPath();
  c.moveTo(cx + bw * 0.70, cy - bh * 0.86);
  c.quadraticCurveTo(cx + bw * 1.30, cy, cx + bw * 0.70, cy + bh * 0.86);
  c.closePath(); c.fill();
  rim(c, () => { c.moveTo(cx + bw * 0.70, cy - bh * 0.86); c.quadraticCurveTo(cx + bw * 1.30, cy, cx + bw * 0.70, cy + bh * 0.86); }, 1.8);

  /* SHORT antennae — a whip antenna is what made these read as shrimp */
  c.strokeStyle = p.dark; c.lineWidth = bh * 0.10; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx - bw * 1.05, cy + s * bh * 0.30);
    c.quadraticCurveTo(cx - bw * 1.36, cy + s * bh * 0.62, cx - bw * 1.48, cy + s * bh * 0.30);
    c.stroke();
  }
  eyeDot(c, cx - bw * 1.02, cy - bh * 0.34, bh * 0.14);
  eyeDot(c, cx - bw * 1.02, cy + bh * 0.34, bh * 0.14);
}
