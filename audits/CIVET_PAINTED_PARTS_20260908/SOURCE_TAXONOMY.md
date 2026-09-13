# Source taxonomy for shared creature animation

Read-only source inventory recorded during the September 8, 2026 Eastern session.
This packet describes the existing V2 drawing routes; it implements no anatomy,
rig, locomotion, asset replacement, ecology or species change. Code hashes below
are the exact read boundary, including any working-tree source not represented by HEAD.

- Recorded UTC: 2026-09-09T01:29:01.539097+00:00
- Observed HEAD: `afee1924aac880bed4360deae2a26d081ca18d45`
- Ownership: OpenAI/Codex / macOS / `/Users/nick/Projects/celestial-frontier-openai-mac` / `openai/mac`.
- Verification scope: source reading and SHA-256/byte recording only. No tests,
  rendering, browser runs, installs or hosted actions. No runtime source edits.

## Design references and reading boundary

The requested generated-trait design map is
[PROCEDURAL_CHARACTERISTICS.md](../../PROCEDURAL_CHARACTERISTICS.md), alongside
[SPECIES_AND_GENOME.md](../../SPECIES_AND_GENOME.md),
[ART_DIRECTION.md](../../ART_DIRECTION.md),
[BIOME_ATLAS.md](../../BIOME_ATLAS.md) and the
[codebase reference](../../celestial-frontier-codebase-reference.md).
PROCEDURAL_CHARACTERISTICS explicitly marks its B15 body/head/tail/limb descriptions
as historical legacy observations. The modern V2 override route wins whenever it
returns a canvas; later compatibility anatomy is then unreachable. Current reference
refreshes made alongside this packet must not turn legacy descriptions into claims
about all current V2 pixels.

The shared rig should consume the **final presentation owner and its resolved
anatomy**, retaining the complete immutable genome. Raw `body`, `loco` or `limbs`
alone cannot reliably describe what V2 currently draws.

## Winning presentation route

[speciespainter.ts](../../port/v2/packages/art/src/speciespainter.ts#L23) calls
`resolveOverrideCanvas` before the lineage-selected HD fallback. Its result is
polished and, for thumbs, downsampled; it does not expose an articulated body.

[speciesoverrides.ts](../../port/v2/packages/art/src/speciesoverrides.ts#L1496)
resolves ownership as follows:

1. Pure `_earthName` uses the current exact kingdom/name owner. Curly apostrophes
   normalize for lookup; the original complete genome remains identity data.
2. Without a name, `_earthBlend` uses `lineageRenderKingdom`: a valid recorded
   `_earthBlendKingdom` with a real route wins; otherwise infer actual catalogue
   ownership, preferring a matching child kingdom before stable order
   fauna/flora/fungi/microbe.
3. Seven explicitly marked fauna lineages with a finite numeric anchor use modern
   named owners plus bounded lineage drift: Fruit Bat, Eagle, Wolf, Elephant,
   Chameleon, Dragonfly and Octopus. Other fauna lineages preserve HD compatibility.
   Sea Turtle and Great White Shark are expressly protected on that reviewed route.
4. Flora/fungi/microbe lineages use their exact kingdom/name owner, passing the
   child genome through. A mixed-kingdom child therefore need not draw its raw kingdom.
5. Unnamed, unblended organisms enter procedural selection; a null plan retains HD fallback.

Named dispatch precedence is `CANON[kingdom|name]`, then fauna tables
`FAUNA_NAME -> FAUNA2_NAME -> FAUNA3_NAME -> BIRD_NAME -> INVERT_NAME`, then
`QUAD_SPEC -> QUAD2_SPEC`. Flora has its own iconic/spec/ladder path. A bare name
is not sufficient to choose a kingdom or family.

Within [faunaQuadruped](../../port/v2/packages/art/src/quadrupedoverrides.ts#L2804),
whole-form precedence is `mammalEPlan -> mammalDPlan -> mammalCPlan -> mammalBPlan ->
pinnipedPose -> gliderPlan -> generic quadruped`. Each earlier selection returns.
A generic `quad` label cannot reconstruct the final Civet, Wolf, otter or glider.
Modern named painters typically consume a resolved spec and seeded/name-derived
variation, rather than allowing arbitrary raw anatomy genes to replace named anatomy.

## Pinned gene vocabulary

Actual tables are in
[speciestraits.verbatim.js](../../port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js#L193).
Their lengths and genome synthesis chronology must remain unchanged.

| Field | Indexed values, in order |
|---|---|
| `body % 16` | sturdy-limbed; armored; stilt-legged; tentacled; serpentine; many-segmented; shelled; membranous; crystalline-plated; gelatinous; tusked; horned; spindly; squat heavy-boned; four-winged; radially symmetric |
| `loco % 18` | grazers; burrowers; pack hunters; gliders; swimmers; floaters; ambush predators; climbers; herd-beasts; filter-feeders; leapers; drifters; runners; jet-propelled swimmers; tentacle-walkers; rollers; wall-clingers; current-drifters |
| `head % 10` | blunt-snouted; beaked; eyeless and smooth; crested; mandibled; tendril-fringed; horned; domed and bulbous; fanged; frilled |
| `limbs % 6` | **total walking limbs:** 2; 4; 6; 8; 3; 0 |
| `tail % 7` | none; whip-like; finned; spiked; prehensile; plumed; stinger-tipped |
| `eyes % 6` | 2; 4; 6; 8; 1; 0 |
| `skin % 9` | scaled; furred; chitinous; slick and wet; plated; warty; feathered; translucent; crystalline |
| `size % 6` | tiny; small; dog-sized; large; massive; titanic |
| `pattern % 8` | plain; striped; spotted; banded; mottled; iridescent; marbled; eye-spotted |

`FA_LIMBS` is a total count, not pairs. The previous SPECIES table wording called
these pairs; the parent batch owns the current-reference correction.

`g.x` switches descriptor helpers to nine EX_LOCO values: vent-clingers,
magma-swimmers, under-ice drifters, pressure-walkers, acid-cloud floaters,
storm-riders, winged hunters, thermal-soarers, brine-crawlers. `habOf` similarly
uses EX_HABITAT. These marker-specific descriptor meanings are not honored by
all modern morphology routes below.

## Actual modern procedural fauna map

[planFor](../../port/v2/packages/art/src/proceduraloverrides.ts#L88) normalizes its
selected indices and applies these cases in order:

| Condition | Modern owner |
|---|---|
| Any fauna, `loco` 4 or 13 | Fish, overriding every body index |
| `body` 14 and `loco` 3 | Bird |
| `body` 4 | Snake |
| `body` 5 | Myriapod |
| `body` 6 | Turtle |
| Remaining `body` 14 | Open-wing insect |
| `body` 15 | Radial fauna |
| `body` 3 with `loco` 0 or 7 | Alien quadruped with tendrils |
| `body` 0, 1, 2, 10, 11, 12, 13 | Alien quadruped |
| Remaining body 3, or 7, 8, 9 | Null: HD fallback |

The router's actual `ProcPlan` union is quad/fish/insect/bird/snake/myriapod/
turtle/plant/alienPlant/radial/null. It is a drawing-owner selector, not a complete
locomotion classification.

### Fields that determine the modern resolved anatomy

- **Quadruped:** leg pairs come from locomotion/body, not `g.limbs`: four pairs for
  loco 5/11/17; otherwise three for loco 1/7/14 or armored body; otherwise two.
  Head controls neck, muzzle, jaw, ears and alien eye style. Body/size control
  leg length, body length/depth, back and proportions. Body 10 adds tusks;
  body 11 selects horns. Body/head select tendrils, armor and sail.
  The generic painter actually uses `spec.alien.legPairs` to place pairs along
  the torso [at line 3445](../../port/v2/packages/art/src/quadrupedoverrides.ts#L3445).
- **Tail on modern quads:** raw tail indices become
  none/stub/tuft/bushy/long/plume/banded. This differs from FA_TAIL's descriptors.
- **Fish:** body 4 selects eel profile, 13 globe, 12 ribbon, otherwise fusiform.
  Size sets length/depth; head selects snout and teeth; skin selects dorsal fin;
  tail selects forked/lunate/round/point/fan. Pattern is mapped modulo four.
- **Insect:** six jointed legs and four visible open wings; size/head/loco/skin
  control abdomen, antennae, waist, jumping/raptorial forelimbs and fuzz.
- **Radial:** the modern owner draws ten arms, independent of the walking-limb gene.
- **Surface:** color/accent/seed and named palette overrides remain owned by
  current painters. `surfaceLumin` admits light only for translucent skin, a
  non-armored body and pattern below five. A genome's lumin flag is not permission
  to invent a new emissive organ or use a universal glow overlay.

Exact spec definitions:
[QuadSpec](../../port/v2/packages/art/src/quadrupedoverrides.ts#L57),
[AlienTraits](../../port/v2/packages/art/src/alientraits.ts#L24),
[FishSpec](../../port/v2/packages/art/src/faunaoverrides3.ts#L71),
[InsectSpec](../../port/v2/packages/art/src/invertoverrides.ts#L116),
[BirdSpec](../../port/v2/packages/art/src/faunaoverrides.ts#L1301).

QuadSpec includes independent family/skull, foot, muzzle, jaw, ear, tail, horn,
trunk, hump, back, chest/rump/waist, coat, natural hue and whole-form selectors.
Its MammalFamily values are felid/canid/ursid/bovid/cervid/equid/camelid/suid/
mustelid/rodent/pachyderm/generic/marsupial/procyonid/xenarthran/pinniped/burrower/
hyaenid. A family shares anatomical rules; per-species specs still determine proportions.

## Flight, water and compatibility anatomy

BirdSpec distinguishes flightless, swimming, upright/flipper, hovering and soaring
presentations. Bat wings have a separate mammalian owner. Gliding mammals retain
patagia; Flying Fish uses enlarged pectorals, while Flying Gurnard has display fins.
These must not receive an unconditional common wing-flap capability. Relevant
named examples are [Penguin](../../port/v2/packages/art/src/birdoverrides.ts#L122),
[Flying Fish](../../port/v2/packages/art/src/faunaoverrides3.ts#L2265),
[Flying Gurnard](../../port/v2/packages/art/src/faunaoverrides3.ts#L2348),
[Fruit Bat](../../port/v2/packages/art/src/speciesoverrides.ts#L1476), and
[Colugo](../../port/v2/packages/art/src/quadrupedoverrides.ts#L605).

Aquatic named anatomy includes fish, cetaceans/sirenians, pinnipeds, cephalopods,
jelly, gastropods, sessile organisms, amphibians and water-associated reptiles.
Aquatic does not imply tail swimming, flight, loss of walking limbs or that an
animal is currently submerged. Civet standing in shallow water remains a planted
mammal with scene contact; it is not a fish morphology.

[hdGenesFor](../../port/v2/packages/art/src/hdportrait.worker.verbatim.js#L535)
resolves `aqua/airb` through `locoOf/habOf`. Named recipes override both, preventing
random locomotion genes from giving a Wolf wings. Named recipes also own natural
palette/pelt. Compatibility lineage keeps Earth structure while restoring child
palette and applying stored-anchor drift.

The compatibility dispatcher supports bird/fish/marine/insect/arachnid/crust/
sessile/primate/jelly/mammal/reptile/serpent/amphibian/turtle/gastropod/ceph/bat.
These are static silhouette painters with anchor outputs, not implemented
locomotion controllers. See the
[dispatcher](../../port/v2/packages/art/src/hdportrait.worker.verbatim.js#L2016).

[_procFamily](../../port/v2/packages/art/src/hdportrait.worker.verbatim.js#L1942)
selects serpent, jelly, sessile, ceph, insect or crust from body first, then
other aquatic forms as fish while preserving selected shell/crystal/tusk/horn
features. Winged fallback body 7 has one wing pair; body 14 has two. Its airborne
winged stance can reduce visible walking legs to two; other compatible land
branches can use FA_LIMBS and FA_EYES. These rules do not execute after a modern
owner has returned.

## Existing semantic conflicts and gaps

These are existing presentation discrepancies, not authorization to rewrite
species, genomes, lineage, roster or biome selection during animation work.

1. `planFor` does not read `limbs`, `eyes`, `trait`, `habitat` or `x`. Its modern
   quad eye style comes from head (blind/cluster/stalked/normal), and its limb
   count comes from loco/body; it does not implement the descriptor counts.
2. It uses raw loco modulo 18 even when `x` descriptors use EX_LOCO modulo 9.
   An `x` acid-cloud floater at loco 4 can select fish; an `x` winged hunter
   at loco 6 can select a grounded quad. Habitat-dependent fallback behavior
   cannot repair an already-returned modern owner.
3. Body 14 plus glider selects an ordinary folded-wing bird spec with no
   four-wing option. Other body-14 modern routes produce the six-legged insect.
4. Modern swimmer routing precedes all body preservation. The legacy
   shell/crystal/tusk/horn preservation claims therefore do not apply universally.
5. Modern tail/eye/limb mappings differ from the raw descriptor vocabulary.
   Silently restoring all raw traits would change current drawn identities.
6. A generic `quad` owner label misses exact whole-form early returns and named
   anatomical exceptions. Rebuilding only the generic painter's proportions
   is insufficient for modern named fauna and qualified descendants.
7. Existing painters flatten drawing into raster art. They do not expose a
   universal connected skeleton, overlapped parts, hidden limb surfaces or
   articulated material attachments. The Wolf export and one-view Civet mesh
   studies do not establish general locomotion, turning or jaw animation.
8. Source routing and enum reading establish implementation facts only. This
   inventory includes no fresh pixels, art acceptance or animation-outcome proof.

## Suggested shared rig boundary

Use a versioned resolved record containing complete genome identity, exact
named/lineage/procedural owner, final spec, source bindings and normalized rest
geometry. Add orthogonal capability data: appendage roles/counts, joint chains,
attachment roots, limits, contact patches, support mode and propulsion mode.
Walking legs, manipulators, feathered or membranous wings, fins, flukes,
tentacles and axial chains remain distinct roles. These are proposed contract
concepts, not new runtime enums or a claim that all families are implemented.

A common solver can operate on declared chains; each owner must declare which
motions its actual anatomy supports. Keep material/markings and lineage drift
outside pose generation. Preserve exact static presentation where an owner lacks
a qualified adapter. Whole-form parts should share identity and coherent
attachments rather than selecting organs independently from raw trait text.

[speciesVisualKey](../../port/v2/packages/art/src/speciesidentity.ts#L40) preserves
complete genome values because seed/name alone can collide across descendants.
The [genetics facade](../../port/v2/packages/domain/genetics/src/index.ts#L69)
records selected kingdom/name lineage without altering the existing RNG draw
sequence. Ordered parent data, `_earthBlendKingdom`, `_anchorVal` and full immutable
genomes remain intact. Never coerce these to a single universal seed/name key.
The bounded [Wolf bridge](../../port/v2/tools/creature-blender-export.mjs#L134)
already distinguishes final route, morphology and explicit static fallback;
it is a useful ownership precedent, not a universal exporter.

Biome profile authority is a separate presentation/ecology constraint. Its fourteen
fauna families are mammal/bird/insect/amphibian/primate/reptile/fish/crust/
arachnid/gastropod/marine/jelly/ceph/sessile; this is not a complete skeleton
classification. See [biome-profile](../../port/v2/packages/domain/biome-profile/src/index.ts#L20).
Preserve its exact profile identity and accepted anchors. **Global D-9e remains
open**: biome selection/generation is outside this package, and the documented
legacy filter reads fauna from the wrong table. This inventory does not fix it
or claim all encountered organisms are geographically matched.

The prior full-admission, physical-device, native-heap, human-art and retained
first-red blockers remain binding. The richer Earth fauna and flora direction,
seeded alien architectures/palettes, natural named identity and accepted UI
placement remain unchanged.

## Exact source binding

The hashes below bind this read inventory, not a browser certificate or a clean
committed aggregate. Links are repository-relative; `#L` anchors identify useful
source positions for hosted/code viewers.

| Source | Bytes | SHA-256 |
|---|---:|---|
| [port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js](../../port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js#L193) | 20728 | `f455d20cbb1194849aef0dab0c5ea8fa16a88084c67e3386b57450937039a00d` |
| [port/v2/packages/domain/genetics/src/genetics.verbatim.js](../../port/v2/packages/domain/genetics/src/genetics.verbatim.js#L25) | 4570 | `4ef5f904d87358ecd49fd146b6bc5715a189913ef7948afa3c15c9d6c7045d12` |
| [port/v2/packages/domain/genetics/src/index.ts](../../port/v2/packages/domain/genetics/src/index.ts#L69) | 3281 | `eee2058546ab009b6b33376bad1005d6a597bd2b336506851d9be562d8cbef61` |
| [port/v2/packages/domain/biome-profile/src/index.ts](../../port/v2/packages/domain/biome-profile/src/index.ts#L20) | 14498 | `cdffacfbf0a19609df2bae648de95bf88b13e516cc0dfdb91904a78aae850874` |
| [port/v2/packages/art/src/speciesidentity.ts](../../port/v2/packages/art/src/speciesidentity.ts#L40) | 3190 | `f219d6aee5acd20235f6c7a020eac35aa7ebb7d2acb168be2f73a3fefc3c1ba0` |
| [port/v2/packages/art/src/speciespainter.ts](../../port/v2/packages/art/src/speciespainter.ts#L23) | 1878 | `de8834067acd5c046069af10e9cf91b0a4a2e95d3f6370c0b65da089126c2e1f` |
| [port/v2/packages/art/src/speciesoverrides.ts](../../port/v2/packages/art/src/speciesoverrides.ts#L1496) | 126067 | `9c212624234a64d78a75a362e48625bec16a36f4831fd29ba86f09f236f9441b` |
| [port/v2/packages/art/src/proceduraloverrides.ts](../../port/v2/packages/art/src/proceduraloverrides.ts#L88) | 13174 | `155de5f3969514ad55270c797efffb507eeb0bec19909830025a46728799a8be` |
| [port/v2/packages/art/src/quadrupedoverrides.ts](../../port/v2/packages/art/src/quadrupedoverrides.ts#L2804) | 358210 | `baa8df44c485c0febaf1c8d05579d846a4c3b2114454c7e42d1c4177a4703e55` |
| [port/v2/packages/art/src/alientraits.ts](../../port/v2/packages/art/src/alientraits.ts#L24) | 9106 | `9c54b1abb2e94854750d7c62c282dbccce4ae37cb21f6961e52edbdd114ca3f7` |
| [port/v2/packages/art/src/faunaoverrides3.ts](../../port/v2/packages/art/src/faunaoverrides3.ts#L71) | 153673 | `f0eb76d48f04773415ceebe6cfb797e1900fc2eb223632d174e06fbe1ac36dec` |
| [port/v2/packages/art/src/invertoverrides.ts](../../port/v2/packages/art/src/invertoverrides.ts#L116) | 231622 | `c0a76508b48d6f97793f37d9962e6140242ef9229a168ef6f538508d4ecaf746` |
| [port/v2/packages/art/src/faunaoverrides.ts](../../port/v2/packages/art/src/faunaoverrides.ts#L1301) | 253580 | `9e109fea1bda4d312eb733f8aa56aacba67ab0ceb79a6a8d9228bec6bc118694` |
| [port/v2/packages/art/src/birdoverrides.ts](../../port/v2/packages/art/src/birdoverrides.ts#L122) | 9167 | `48ffa589f2273f0f29fd85df1f05fd070477ade70f1cdeb7698f5321e5702dc7` |
| [port/v2/packages/art/src/proceduralfamilies.ts](../../port/v2/packages/art/src/proceduralfamilies.ts#L1) | 57723 | `140bc992c7553ab7afbf4bf8bbe1afc038db972f26da0152324d5f4a468988f6` |
| [port/v2/packages/art/src/hdportrait.worker.verbatim.js](../../port/v2/packages/art/src/hdportrait.worker.verbatim.js#L535) | 294932 | `e219d4a0aa8c69fe540ebbe6ebc9beb13abc060ada2c5d3b6cf8c76aa1ad05d1` |
| [port/v2/tools/creature-blender-export.mjs](../../port/v2/tools/creature-blender-export.mjs#L134) | 18851 | `22e85235cb3d974030ec3fad40cb3223720841e118da6fe59218352948da21ba` |
