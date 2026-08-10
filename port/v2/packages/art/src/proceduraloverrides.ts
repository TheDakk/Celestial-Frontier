/* proceduraloverrides.ts — THE MORPHOLOGY PASS, wave 13: THE PROCEDURAL
   CREATURES, and with them every creature a player ever breeds.

   ★ THE FINDING THAT SHAPED THIS WAVE.
   Twelve waves were judged entirely on the Earth catalogue, because no
   instrument had ever rendered a procedural genome. Adding a `proc:` form to
   the strip tool showed something better and more awkward than expected: the
   procedural art is NOT bad. The verbatim engine reads `body`, `head`,
   `pattern` and `size` and draws sixteen genuinely alien body plans well.
   What it does not share is the VISUAL LANGUAGE — coloured habitat glows
   instead of our vignette, flat shading instead of form shading with rim
   light, and none of the surface laws. Side by side in one compendium that
   reads as two games.

   ★ SO THIS IS A ROUTER, NOT A REPLACEMENT.
   Body plans that MAP onto a system we already have are drawn by it, and
   inherit the fit pass, the pattern law and the surface laws for free.
   Plans with no Earth analogue — tentacled, membranous, crystalline-plated,
   gelatinous, radially symmetric — keep falling through to the verbatim
   engine, which draws them better than a forced mapping would. That is
   D-ART-14 applied to a whole rendering path rather than one species.

   ★ DETERMINISM IS LOAD-BEARING HERE. Every decision below reads only fields
   already on the genome. Same genome ⇒ same portrait, on every device — or
   share codes and cross-device parity break (hard rule 1). */
import type { QuadSpec } from './quadrupedoverrides.js';
import type { FishSpec } from './faunaoverrides3.js';
import type { InsectSpec } from './invertoverrides.js';
import type { BirdSpec } from './faunaoverrides.js';
import type { PlantSpec } from './floraoverrides2.js';
import type { AlienTraits } from './alientraits.js';

type G = Record<string, unknown>;
const idx = (g: G, k: string, n: number): number => (((g[k] as number) || 0) % n + n) % n;

/* A lumin trait belongs on a readable surface, not on top of dense armour or
   a fully patterned hide.  This keeps the genome's rare bioluminescence while
   preserving the silhouette and segmentation the portrait is meant to show. */
function surfaceLumin(g: G, body: number, skin: number, pattern: number): boolean {
  return Boolean(g.lumin) && skin === 7 && body !== 1 && pattern < 5;
}

/* GP7.1 r2 left ten otherwise legible procedural trees in one leaf-ring crown
   topology.  These exact non-named genome seeds get different existing plant
   architectures; the opt-in table deliberately leaves their accepted neighbours
   byte-stable instead of repainting every tree.  Each choice still reads only
   the genome and is therefore deterministic across devices. */
const STRICT_CANOPY_TOPOLOGY: Readonly<Record<number, PlantSpec>> = {
  904461308: { habit: 'palm', leaf: 'frond', tall: true },
  2998025995: { habit: 'tree', leaf: 'needle', tall: true },
  603515686: { habit: 'shrub', leaf: 'pinnate', flower: 'star' },
  493531175: { habit: 'vine', leaf: 'heart', rope: true },
  2185598654: { habit: 'palm', leaf: 'broad', tall: true, pseudostem: true, fruit: 'cluster' },
  2361243398: { habit: 'tree', leaf: 'needle', tall: true, fruit: 'cone' },
  517692488: { habit: 'cane', leaf: 'blade', tall: true },
  2856104661: { habit: 'aquatic', leaf: 'pad', flower: 'star' },
  557971251: { habit: 'tree', leaf: 'needle', tall: false, fruit: 'cone' },
  674770691: { habit: 'herb', leaf: 'lance', stem: 'bare', leafArr: 'alternate', flower: 'umbel', flowerN: 3 },
};

/* FA_BODY, in order — the vocabulary the genome already speaks:
   0 sturdy-limbed · 1 armored · 2 stilt-legged · 3 tentacled · 4 serpentine
   5 many-segmented · 6 shelled · 7 membranous · 8 crystalline-plated
   9 gelatinous · 10 tusked · 11 horned · 12 spindly · 13 squat heavy-boned
   14 four-winged · 15 radially symmetric
   FA_LOCO adds the refinement: 4 swimmers · 3 gliders · 12 runners · 7 climbers … */

/** What our systems can honestly draw. Everything else stays verbatim. */
export type ProcPlan =
  | { kind: 'quad'; spec: QuadSpec }
  | { kind: 'fish'; spec: FishSpec }
  | { kind: 'insect'; spec: InsectSpec }
  | { kind: 'bird'; spec: BirdSpec }
  | { kind: 'snake'; banded: boolean }
  | { kind: 'myriapod'; flat: boolean }
  | { kind: 'turtle' }
  | { kind: 'plant'; spec: PlantSpec }
  | null;

const COAT: Array<NonNullable<QuadSpec['coat']>> =
  ['plain', 'stripes', 'spots', 'banded', 'plain', 'rosettes', 'patches', 'spots'];
const HORN: Array<NonNullable<QuadSpec['horn']>> =
  ['nose', 'twinnose', 'curl', 'branched', 'straight', 'spiral', 'lyre', 'shorthorn', 'palmate', 'ossicone'];

/** Choose a body plan from the genome. Pure, total, and deterministic. */
export function planFor(g: G): ProcPlan {
  const kingdom = String(g.kingdom || '');
  const body = idx(g, 'body', 16);
  const loco = idx(g, 'loco', 18);
  const size = idx(g, 'size', 6);
  const head = idx(g, 'head', 10);
  const tail = idx(g, 'tail', 7);
  const pattern = idx(g, 'pattern', 8);
  const skin = idx(g, 'skin', 9);

  if (kingdom === 'flora') {
    /* FLORA_FORM is 18 alien habits; the ones with a terrestrial analogue go
       through the plant system, the rest (crystalline growths, spore-towers,
       balloon-pods, mirror-bark giants) stay verbatim — they are the whole
       reason the procedural flora looks alien, and it should. */
    const form = idx(g, 'form', 18);
    const LEAF: Array<PlantSpec['leaf']> = ['frond', 'blade', 'scale', 'lance', 'broad', 'needle', 'heart', 'pad', 'pinnate', 'palmate'];
    const leaf = LEAF[(form + skin) % LEAF.length]!;
    const strictTopology = STRICT_CANOPY_TOPOLOGY[(g.seed as number) >>> 0];
    if (strictTopology) return { kind: 'plant', spec: strictTopology };
    switch (form) {
      case 0: return { kind: 'plant', spec: { habit: 'fern', leaf: 'frond' } };
      case 3: return { kind: 'plant', spec: { habit: 'cane', leaf: 'blade', tall: size > 3 } };
      case 4: return { kind: 'plant', spec: { habit: 'tree', leaf: 'palmate', tall: true } };
      case 6: return { kind: 'plant', spec: { habit: 'rosette', leaf } };
      case 7: return { kind: 'plant', spec: { habit: 'vine', leaf } };
      case 8: return { kind: 'plant', spec: { habit: 'shrub', leaf, fruit: 'berry' } };
      case 10: return { kind: 'plant', spec: { habit: 'tree', leaf, tall: true } };
      case 11: return { kind: 'plant', spec: { habit: 'tree', leaf: 'broad', tall: true } };
      case 14: return { kind: 'plant', spec: { habit: 'grass', leaf: 'blade' } };
      case 15: return { kind: 'plant', spec: { habit: 'shrub', leaf } };
      case 16: return { kind: 'plant', spec: { habit: 'tree', leaf, tall: size > 2 } };
      case 12: return { kind: 'plant', spec: { habit: 'aquatic', leaf: 'blade' } };
      default: return null;   /* stays alien, stays verbatim */
    }
  }
  if (kingdom !== 'fauna') return null;   /* fungi + microbe: wave 1 owns them */

  /* locomotion overrides body plan where it plainly should */
  if (loco === 4 || loco === 13) {        /* swimmers · jet-propelled swimmers */
    return {
      kind: 'fish',
      spec: {
        profile: body === 4 ? 'eel' : body === 13 ? 'globe' : body === 12 ? 'ribbon' : 'fusiform',
        len: 0.20 + size * 0.014,
        depth: 0.048 + size * 0.010,
        tail: (['forked', 'lunate', 'round', 'point', 'fan'] as const)[tail % 5]!,
        snout: (['blunt', 'jaw', 'bill', 'shovel', 'tube', 'hammer'] as const)[head % 6]!,
        dorsal: (['one', 'sail', 'two', 'spiny', 'none'] as const)[skin % 5]!,
        pattern: (['bands', 'stripes', 'spots', 'mottle'] as const)[pattern % 4]!,
        glow: surfaceLumin(g, body, skin, pattern),
        teeth: head === 8,
      },
    };
  }
  if (loco === 3 && body === 14) {        /* gliders with four wings */
    return { kind: 'bird', spec: { legs: 0.02 + (size % 4) * 0.02, bill: (['stout', 'hook', 'long', 'short'] as const)[head % 4]!, size: 0.6 + size * 0.12, crest: head === 3 } };
  }

  switch (body) {
    case 4:  return { kind: 'snake', banded: pattern === 3 || pattern === 1 };
    case 5:  return { kind: 'myriapod', flat: loco % 2 === 0 };
    case 6:  return { kind: 'turtle' };
    case 14: return {
      kind: 'insect',
      spec: {
        ...(pattern === 2 ? { pattern: 'spots' as const } : pattern === 3 ? { pattern: 'bands' as const } : {}),
        abdomen: 0.8 + (size % 4) * 0.22,
        wings: 'open',
        antennae: (['short', 'long', 'feather'] as const)[head % 3]!,
        waist: head === 4,
        jumper: loco === 10,
        raptor: loco === 6,
        fuzzy: skin === 1,
      },
    };
    case 3:
      /* Land-bound tentacled bodies were falling through to a near-black
         generic silhouette.  The existing alien quadruped rig can express
         their tendrils and extra legs; swimmers and true tentacle-walkers
         retain the specialised verbatim body. */
      if (loco !== 0 && loco !== 7) return null;
      /* falls through */
    case 0: case 1: case 2: case 10: case 11: case 12: case 13: {
      /* ★ WAVE 14 (Nick chose option b): the strangeness goes back IN. Each
         trait is driven by a gene the genome has always carried and the art
         has never shown — many-legged locomotion, tendril-fringed and
         domed-and-bulbous heads, chitinous/plated/crystalline/translucent
         skins, and the lumin flag that has been in every genome since v1.0
         and was never once drawn. */
      const alien: AlienTraits = {
        legPairs: (loco === 5 || loco === 11 || loco === 17) ? 4
          : (loco === 1 || loco === 7 || loco === 14 || body === 1) ? 3 : 2,
        eyes: head === 2 ? 'blind' : head === 7 ? 'cluster' : head === 5 ? 'stalked' : 'normal',
        ...(skin === 2 ? { skin: 'chitinous' as const }
          : skin === 4 ? { skin: 'plated' as const }
          : skin === 8 ? { skin: 'crystalline' as const }
          : skin === 7 ? { skin: 'translucent' as const }
          : skin === 5 ? { skin: 'warty' as const } : {}),
        tendrils: body === 3 || head === 5,
        lumin: surfaceLumin(g, body, skin, pattern),
        sail: body === 12 && loco !== 4,
        armor: body === 1,
      };
      /* the limbed plans — our quadruped system, proportioned from the genes */
      const stilt = body === 2, squat = body === 13, spindly = body === 12;
      return {
        kind: 'quad',
        spec: {
          legs: stilt ? 0.17 : squat ? 0.075 : spindly ? 0.145 : 0.10 + (size % 4) * 0.014,
          depth: squat ? 0.145 : spindly ? 0.068 : 0.085 + (size % 5) * 0.010,
          len: 0.22 + (size % 5) * 0.018,
          neck: stilt ? 0.16 : 0.05 + (head % 5) * 0.028,
          back: (['level', 'humped', 'sloped', 'arched'] as const)[loco % 4]!,
          muzzle: 0.28 + (head % 6) * 0.06,
          jaw: body === 13 ? 'barrel' : head === 8 ? 'broad' : 'fine',
          ears: (['tiny', 'small', 'round', 'large', 'huge'] as const)[head % 5]!,
          tail: (['none', 'stub', 'tuft', 'bushy', 'long', 'plume', 'banded'] as const)[tail]!,
          coat: body === 1 ? 'banded' : COAT[pattern]!,
          alien,
          ...(body === 10 ? { horn: (tail % 2 ? 'tuskup' : 'tuskdown') as NonNullable<QuadSpec['horn']> }
            : body === 11 ? { horn: HORN[head % HORN.length]! } : {}),
        },
      };
    }
    default: return null;   /* tentacled · membranous · crystalline · gelatinous
                               · radially symmetric — no Earth analogue, and the
                               verbatim engine draws them better than a forced
                               mapping would (D-ART-14, applied to a path) */
  }
}
