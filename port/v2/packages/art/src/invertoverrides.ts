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
  /* ★ WAVE 65 — ONE FUSED BODY. A mite and a harvestman are a single rounded
     blob (no two spheres, no pinched waist); both were failing as "the spider
     chassis recoloured". */
  fused?: boolean }, name = ''): void {
  const p = hued(pIn, opts.hue);
  const r = nrng(g, name, 0xA8AC);
  const cx = S * 0.50, cy = S * 0.52;
  const b = S * 0.050 * (opts.big ? 1.25 : 1) * 1.30 * (opts.scale ?? 1) * nv(name, 0x21, 0.12);
  const squat = nv(name, 0x22, 0.22);         /* abdomen aspect — a RATIO, so the fit pass keeps it */
  const splay = nv(name, 0x23, 0.20);         /* how far the legs reach relative to the body */
  shadow(c, cx, cy + b * 2.4, S * 0.16);
  const reach = b * (opts.longleg ? 8.2 : 2.9) * splay;   /* the span IS the animal */
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {                 /* EIGHT legs — the count is the read */
      const a = -0.75 + i * 0.52;
      const ox = cx - b * 0.4 + i * b * 0.34;
      const kx = ox + s * Math.cos(a) * reach * 0.62, ky = cy - b * 0.55 - Math.sin(a) * reach * 0.30;
      const ex = ox + s * Math.cos(a) * reach, ey = cy + b * 1.4 + i * b * 0.18;
      /* ★ WAVE 62 — a tarantula's legs are THICK AND FURRED; lineWidth 6 with
         five hair ticks read as "identical thin bare spider legs" (gp5). */
      limb(c, ox, cy, ex, ey, kx, ky, opts.hairy ? 11 : (opts.longleg ? 2.6 : 4), p.dark);
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
    c.fillStyle = shell(c, p, cx, cy, b * 1.4);
    c.beginPath(); c.ellipse(cx + b * 0.2, cy, b * 1.55 * squat, b * 1.25 / squat, 0.05, 0, TAU); c.fill();
    rim(c, () => c.ellipse(cx + b * 0.2, cy, b * 1.55 * squat, b * 1.25 / squat, 0.05, -2.8, 0.3));
    for (let i = 0; i < 8; i++) softMark(c, cx - b + r() * b * 2.4, cy + (r() - 0.5) * b * 1.8, 5 + r() * 4, 4 + r() * 3, '24,18,12', 0.3);
    eyeDot(c, cx - b * 0.9, cy - b * 0.4, b * 0.12);
    eyeDot(c, cx - b * 0.9, cy - b * 0.12, b * 0.12);
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
}

/* ═══════════════ MYRIAPODS: many segments, a leg pair on each ═══════════════ */
export function myriapod(c: Ctx, g: G, pIn: Pal, opts: { flat?: boolean; coil?: boolean;
  hue?: string; segs?: number; scale?: number }, name = ''): void {
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
    const legLen = segR * (opts.flat ? 2.6 : 1.5);
    c.strokeStyle = p.dark; c.lineWidth = opts.flat ? 3 : 2.2; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + s * legLen * 0.5, y + legLen * 0.7, x + s * legLen * (opts.flat ? 1.0 : 0.72), y + legLen * (opts.flat ? 0.7 : 1.0));
      c.stroke();
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
export function crabBody(c: Ctx, g: G, pIn: Pal, opts: { wide?: boolean; hermit?: boolean; big?: boolean; hue?: string }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  const r = nrng(g, name, 0xC2AB);
  const cx = S * 0.50, cy = S * 0.50;
  const cw = S * (opts.wide ? 0.155 : 0.125) * (opts.big ? 1.2 : 1) * nv(name, 0x41, 0.12);
  const ch = cw * (opts.wide ? 0.62 : 0.74) * nv(name, 0x42, 0.18);   /* carapace ASPECT */
  shadow(c, cx, cy + ch * 1.9, cw * 1.3);
  c.strokeStyle = p.dark; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {                /* four walking legs a side */
      const a = -0.30 + i * 0.42;
      const ox = cx + s * cw * 0.62, oy = cy + ch * (-0.1 + i * 0.16);
      const kx = ox + s * cw * (0.62 + i * 0.10), ky = oy - ch * (0.42 - i * 0.22);
      const ex = ox + s * cw * (1.05 + i * 0.07), ey = oy + ch * (0.85 + i * 0.24);
      limb(c, ox, oy, ex, ey, kx, ky, 5.5 - i * 0.5, p.dark);
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
    c.moveTo(cx - cw, cy);
    c.quadraticCurveTo(cx - cw * 0.86, cy - ch * 1.15, cx, cy - ch * 1.05);
    c.quadraticCurveTo(cx + cw * 0.86, cy - ch * 1.15, cx + cw, cy);
    c.quadraticCurveTo(cx + cw * 0.72, cy + ch * 1.02, cx, cy + ch * 0.98);
    c.quadraticCurveTo(cx - cw * 0.72, cy + ch * 1.02, cx - cw, cy);
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
    const px = cx + s * cw * 1.02, py = cy - ch * 0.86;
    limb(c, cx + s * cw * 0.52, cy - ch * 0.3, px, py, cx + s * cw * 1.06, cy - ch * 0.14, 7.5, p.dark);
    c.save(); c.translate(px, py); c.rotate(s * -0.62);
    c.fillStyle = shell(c, p, 0, 0, cw * 0.34);
    c.beginPath(); c.ellipse(0, 0, cw * 0.34, cw * 0.19, 0, 0, TAU); c.fill();
    c.strokeStyle = p.dark; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cw * 0.20, -cw * 0.09); c.quadraticCurveTo(cw * 0.52, -cw * 0.22, cw * 0.64, -cw * 0.10); c.stroke();
    c.lineWidth = 5;
    c.beginPath(); c.moveTo(cw * 0.20, cw * 0.06); c.quadraticCurveTo(cw * 0.50, cw * 0.10, cw * 0.62, -cw * 0.02); c.stroke();
    c.restore();
  }
  c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';   /* eyestalks */
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + s * cw * 0.24, cy - ch * 0.78); c.lineTo(cx + s * cw * 0.30, cy - ch * 1.30); c.stroke();
    eyeDot(c, cx + s * cw * 0.30, cy - ch * 1.36, cw * 0.075);
  }
}

export function shrimpBody(c: Ctx, g: G, pIn: Pal, opts: { claws?: boolean; stout?: boolean; tiny?: boolean;
  hue?: string; shield?: boolean; stalks?: boolean; gills?: boolean; scale?: number;
  /* ★ WAVE 65 — the copepod's identity kit: one long pair of antennae held
     out sideways + the two egg sacs trailing behind the tail */
  eggSacs?: boolean }, name = ''): void {
  const p = hued(pIn, opts.hue);
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
  const u1 = 1, a1 = 0.35 + u1 * 1.15 * curl;
  const tx = cx + Math.cos(a1) * L * 1.30, ty = cy - h * 0.3 + Math.sin(a1) * L * 0.92;
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.78)`;   /* THE TAIL FAN */
  for (let k = -2; k <= 2; k++) {
    c.save(); c.translate(tx, ty); c.rotate(a1 - 1.4 + k * 0.26);
    c.beginPath(); c.ellipse(h * 0.9, 0, h * 0.95, h * 0.22, 0, 0, TAU); c.fill(); c.restore();
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
export function wormBody(c: Ctx, g: G, pIn: Pal, opts: { bristles?: boolean; flat?: boolean; sucker?: boolean; hue?: string }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
  const r = nrng(g, name, 0x0202);
  const cx = S * 0.48, cy = S * 0.54;
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
}

export function slugBody(c: Ctx, g: G, pIn: Pal, opts: { cerata?: boolean; plated?: boolean; hue?: string }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
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

export function jellyBody(c: Ctx, g: G, pIn: Pal, opts: { comb?: boolean; float?: boolean; barrel?: boolean; hue?: string }, name = ''): void {
  /* ★ D-ART-115 — the species hue axis. */
  const p = speciesHue(pIn, opts.hue);
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

export function sessileBody(c: Ctx, g: G, pIn: Pal, opts: { kind: 'branch' | 'tube' | 'fan' | 'sac' | 'volcano';
  hue?: string; pores?: boolean }, name = ''): void {
  const p = hued(pIn, opts.hue);
  const r = nrng(g, name, 0x5E55);
  const cx = S * 0.50, base = S * 0.76;
  const H = S * 0.30 * nv(name, 0x91, 0.16);
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
  } else {   /* a sac: sea cucumber / salp / pyrosome, lying along the floor */
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
function waterFlea(c: Ctx, g: G, pIn: Pal, name = ''): void {
  const p = hued(pIn, '#bcd6c4');
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
  'Thrips': I({ hue: '#cdb464', abdomen: 2.3, broad: 0.38, wings: 'lace', wingScale: 0.7, antennae: 'short' }),
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
  'Tarantula': A({ hue: '#3b2b25', big: true, hairy: true }),
  'Camel Spider': A({ hue: '#c9a468', big: true, hairy: true, longleg: true }),
  'Sea Spider': A({ hue: '#b39a86', longleg: true }),
  'Harvestman': A({ hue: '#5d4b40', longleg: true, fused: true, scale: 0.55 }),
  'Scorpion': A({ hue: '#a3762f', big: true, sting: true, claws: true }),
  'Pseudoscorpion': A({ claws: true, scale: 0.92, hue: '#5d4630' }),
  'Deer Tick': A({ hue: '#94402c', big: true }),
  /* ★ WAVE 22 — a mite read as an ANT. It is not one: it is a tiny round
     unsegmented arachnid, and the common ones are conspicuously red. Redder, and drawn
     LARGER: shrinking it first made things worse, 0.60 to 0.51, because a
     small subject leaves mostly empty canvas and two mostly-empty cards look
     alike. Portrait scale is invisible when each species is framed alone. */
  'Mite': A({ scale: 0.95, hue: '#b0442c', fused: true }),
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
  'Coconut Crab': C({ hue: '#3f3f6e', big: true, wide: true }),
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
  'Copepod': P({ hue: '#d18a4e', tiny: true, stout: true, eggSacs: true }),
  'Amphipod': P({ tiny: true, stout: true, scale: 0.74, hue: '#b9a274' }),
  'Water Flea': (c, g, p, n) => waterFlea(c, g, p, n),
  'Isopod': (c, g, p, n) => isopodBody(c, g, p, { hue: '#6e6c73' }, n),
  'Giant Isopod': (c, g, p, n) => isopodBody(c, g, p, { giant: true, hue: '#c3b2b8' }, n),
  'Lobster': P({ hue: '#2f3a4e', claws: true }),
  'Crayfish': P({ hue: '#6e6135', claws: true }),
  'Barnacle': X({ kind: 'volcano', hue: '#d8d2c4' }),
  /* ── WORMS ── */
  'Earthworm': W({ hue: '#b0796a', }),
  'Ice Worm': W({ hue: '#232c34', }),
  'Marine Worm': W({ hue: '#c6907c', bristles: true }),
  'Polychaete Worm': W({ hue: '#a8481a', bristles: true }),
  'Scale Worm': W({ hue: '#6c6355', bristles: true, flat: true }),
  'Flatworm': W({ hue: '#3c4040', flat: true }),
  'Leech': W({ hue: '#473d22', sucker: true }),
  /* ── SLUGS AND KIN ── */
  'Banana Slug': G2({ hue: '#e3c22a', }),
  'Nudibranch': G2({ hue: '#c02f8a', cerata: true }),
  'Chiton': G2({ hue: '#5a6a5f', plated: true }),
  /* ── JELLIES ── */
  'Jellyfish': J({ hue: '#c8e0f0', }),
  'Comb Jelly': J({ hue: '#e8f2f6', comb: true }),
  'Portuguese Man-of-War': J({ hue: '#5a6ed0', float: true }),
  /* ── SESSILE AND SAC-BODIED ── */
  'Coral': X({ hue: '#e8735a', kind: 'branch' }),
  'Cold-Water Coral': X({ hue: '#efe4cf', kind: 'branch' }),
  'Deep-Water Coral': X({ hue: '#9b1f2a', kind: 'branch' }),
  'Sponge': X({ kind: 'tube', pores: true, hue: '#c8823f' }),
  'Sea Cucumber': X({ hue: '#55412f', kind: 'sac' }),
  'Lancelet': W({ hue: '#ecdfb5', }),
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
