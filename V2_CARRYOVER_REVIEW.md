# Celestial Frontier v2 carry-over review

Written 2026-11-20 for the pixel-art conversion. Four read-only reviews of the
version 1 design documents on this branch, each checked against the game code
as it stood on `anthropic/mac` that day (the same code first copied to
`celestial-frontier-v2` as commit e23329c340, before that branch was emptied).

Purpose: say what must carry over exactly, what the pixel art and animation
have to be able to express, what exists in code versus what was only designed,
and what is painted-era material to leave behind.

How to read it:

- **[V]** means the rule was read in code. It was not exercised by a test run.
- **[D]** means it is in a document only: not checked, or not found in code.
- Code paths are under `port/v2/`. `P` = `packages/domain`, `A` = `apps/game/src`.
- The source documents carry many dated overlays. Where a document and the
  code disagree, the code wins.
- Not every document was read line by line. Each part says what was skimmed.

---

## Part 1. Life and worlds

Documents: SPECIES_AND_GENOME, PROCEDURAL_CHARACTERISTICS, WORLD_GENERATION,
BIOME_ATLAS, DETERMINISM, port/MORPHOLOGY_PASS. Core sections read in full; the
dated painted-era overlays and the MORPHOLOGY_PASS waves were skimmed. Not
opened: BIOME_ATLAS §2–§4 design-pack lists (headings only), the CF1/CFB
codecs, rarity code beyond `GRADE_TIERS`.

### Pillars

- One shared universe that is "math, never stored": galaxy → star → system →
  planet → biome → life is recomputed from integer seeds, identical on every
  device. The save holds only the player's relationship to it.
- Every organism is a genome: a bag of integer indices into fixed trait
  tables. The art is a projection of the genome, never the reverse. The same
  full genome must give the same picture on card, landfall and battle
  ("card = stage").
- Earth is the recognisable cradle: named Earth organisms keep real anatomy,
  growth habit and natural colours. Alien life stays procedural and strange,
  in the same rendering language ("strangeness inside our language").
- "Every Earth label visually earned — bodies, not recolours. Proportion
  carries identity before decoration."
- Whole-form ownership: one winning route draws one coherent body; marks are
  skin, not stickers; no subject clips its frame.
- Breeding is a lineage story: Earth descendants drift visibly toward alien
  over generations, and reverse-parent children are distinct individuals.
- Creatures belong in their biome (contact, scale, light). Biome is ecology
  and scene context, not a body-plan definition.
- A world should give a reason to wonder before landing. Surveys never leak
  exact species, rarity or outcomes.
- Wonders stay wonders: rare biomes and high grades are scarce and must read
  as extraordinary.
- Art timing and scheduling are free; what a seed produces is sacred.

### Must-carry invariants

- RNG primitives `mulberry32`, `hashInt`, `cellRng`, `makeNoise`; no
  `Math.random` or `Date.now` in domain packages. Guard [D]; use of the
  primitives [V] throughout `P/*`.
- Anchors [V] (`P/worldconfig/src/index.ts`): UCELL 400, OBS_R 5200,
  HOME_GAL_SEED 999, HOME_POS {90,-60}, GR 1200, GCELL 42, SOL_SEED 424242,
  SOL_POS {560,170}, SYS_R 320. PLAYER_SEED 0x50A1E5 [V]
  (`combatcore.verbatim.js`). Sol planet seeds 131–138, Earth 133 terran,
  hand-authored [V] (`starcatalog/src/index.ts`). FCELL 14 [D].
- Salts [V]: genome `seed^0x9e3b`, star class `seed^0x9e37`, species name
  `seed^0x5eed5`, descriptor `P.seed^0x1234567`, biome
  `hashInt(P.seed,0xB10E,7)`, fine stars `gseed^0x9d2c`. Law: a new layer
  forks a new salt and never consumes an existing stream.
- Genome draw order is load-bearing [V] (`genome.verbatim.js`): color,
  form (×18 hard-coded), body, loco, trait, size, diet, head, limbs, skin,
  tail, pattern, eyes, behavior, habitat, detail, accent, temper, sense,
  repro, life, metab, lumin (<0.28); then gen 0 and heat (0 cold, 1
  temperate, 2 hot).
- Table lengths [V] (pinned-pool law: never grow or reorder; new branches
  use markers and parallel pools): SP_COLOR 17, FLORA_FORM 18, FUNGI_FORM 9,
  MICROBE_FORM 12, FA_BODY 16, FA_LOCO 18, FA_TRAIT 25, FA_SIZE 6, FA_DIET 6,
  FA_HEAD 10, FA_LIMBS 6 `[2,4,6,8,3,0]`, FA_SKIN 9, FA_TAIL 7, FA_PATTERN 8,
  FA_EYES 6 `[2,4,6,8,1,0]`, FA_BEHAVIOR 12, FA_HABITAT 19, FA_TEMPER 10,
  FA_SENSE 10, FA_REPRO 8, FA_LIFE 6, FA_METAB 6, FLORA_DETAIL 10. Parallel
  pools: EX_HABITAT 9, EX_LOCO 9, AQ_FLORA_FORM 6, AIR_FLORA_FORM 3.
- Markers set outside the RNG stream: `x`, `aq`, `af`, `wild`, `apex`,
  `par`, `ep`, `parents`, `evolved`, `_earthName`, `_cradle`; bred:
  `_earthBlend`, `_earthBlendKingdom`, `_anchorVal`. `_earthBlend` and
  `_anchorVal` [V] (`genetics.verbatim.js`; anchor clamp 0.22–0.9, Earth
  mate ≈0.05 drop, alien mate ≈0.27); the rest [D].
- Genes drift, consumers wrap [V]: `crossGenome` mutates unwrapped (size can
  exceed 5); every reader uses `_szOf` or `% length`. Do not "fix" drift.
  `crossGenome` mutates color, form, body, loco, trait, size (85%) and flips
  lumin 20%; `evolveGenome` mutates 14 fields.
- Four kingdoms (flora, fungi, microbe, fauna), 16 realms, sapience 0–4 [D].
- Earth roster [V] (`P/descriptors/src/apphooks.verbatim.js`): fauna 631,
  flora 334, fungi 27, microbe 22 = 1,014 rows / 1,010 unique organisms
  (Tardigrade, Green Algae, Snow Algae and Reindeer Lichen each sit in two
  kingdoms, so identity = kingdom + name). Name assignment is
  `seed % pool.length`, walking forward to de-duplicate per world.
- Fauna body routing [V] (`A/earth-fauna-profiles.ts`): 88 exact-name
  profiles cover all 631 names onto 24 candidate templates — quadruped,
  hopper, primate, flyer-membrane, fish, biped-bird, serpent, cephalopod,
  radial, sessile-filter, colonial-filter, bivalve, gastropod, annelid,
  brachyuran, crustacean-clawed, crustacean-small, barnacle, xiphosuran,
  arachnid, myriapod, insect, larva, lobopod.
- Pixel identity is the complete plain genome (`speciesVisualKey`), never
  seed or name alone [D].
- Species name: one syllable each from SP_NAME_A (20) + B (20) + C (12) [V].
- Rarity [V]: `GRADE_TIERS` raw 0–14; ten display names (Common, Uncommon,
  Notable, Rare, Exotic, Legendary, Mythic, Celestial, Primordial,
  Transcendent; raw 9–14 all show Transcendent). Earth beasts clamp at
  Uncommon [D].
- Planet types and weights [V] (`planetgen.verbatim.js`): gas .30, rocky .15,
  desert .15, ice .12, terran .10, ocean .08, venus .05, lava .05. Star
  classes (13: BD M K G A B PROTO RG SG WD NS MAG BH) and climate bands
  temperate / hot / cold / frozen [D].
- Biomes [V] (`P/strays/src/strays.verbatim.js`): 43 live keys, 8 rare; Earth
  returns null from `biomeFor`. Profile authority has 14 fauna families and
  11 flora forms [V] (`P/biome-profile/src/index.ts`). `land%` doubles as the
  descent-success base, so it is not cosmetic [D].
- Share and parity [D]: CF1 carries a location, not a roster or art
  snapshot; CFB / CFB2 are domain codecs.
- Fingerprint [D]: 50 probes against the v1.0 baseline. The `speciesPortrait`
  probe pins visual genes, not pixels, so drawing changes are safe; a change
  to visual-gene output or to generation needs a single-key re-pin
  authorised by the owner.

### What the art must be able to express

Fauna:

- body (16): sturdy-limbed, armored, stilt-legged, tentacled, serpentine,
  many-segmented, shelled, membranous, crystalline-plated, gelatinous,
  tusked, horned, spindly, squat heavy-boned, four-winged, radially
  symmetric.
- head (10): blunt-snouted, beaked, eyeless and smooth, crested, mandibled,
  tendril-fringed, horned, domed and bulbous, fanged, frilled.
- eyes: 2 / 4 / 6 / 8 / 1 / 0. Limbs: 2 / 4 / 6 / 8 / 3 / 0 total walking
  limbs.
- skin (9): scaled, furred, chitinous, slick and wet, plated, warty,
  feathered, translucent, crystalline.
- tail (7): none, whip-like, finned, spiked, prehensile, plumed,
  stinger-tipped.
- pattern (8): plain, striped, spotted, banded, mottled, iridescent,
  marbled, eye-spotted.
- size (6): tiny … titanic, scale `[0.28, 0.45, 0.62, 0.82, 1.0, 1.25]`.
- color + accent: 17 names with hex anchors; obsidian-black, bone-white and
  glass-clear are hue-less.
- lumin (28%): glow that spills past the silhouette; iridescent also reads
  emissive.
- loco (18, or the 9-entry extremophile set when `x`): drives medium and leg
  pairs. trait (25): the marquee ones should show — crystal antlers, single
  curved horn, armored crest-plates, humped back, whip tails, translucent
  flesh, feathered, sensory whiskers, retractable claws, electric charge,
  mirrored eyes, glow.
- Markers: `x` extremophile, `apex` / `par` guardian and paragon, `_titan`,
  `gen` / `wild` hybrid, `_anchorVal` lineage drift (0.22–1.0).

Flora, fungi, microbes:

- FLORA_FORM 18 (fern-analogues … glass-needle thickets), aquatic 6, aerial
  3, FUNGI_FORM 9, MICROBE_FORM 12; plus color and organ-localised glow.
- Earth plants: habit (tree, shrub, herb, grass, cane, vine, succulent,
  fern, aquatic, rosette, palm) × leaf (10) × flower (6) × fruit (11).
- Procedural fungi and microbes: 13 structural families each.

Planets and biomes:

- 8 planet types; hue, sea hue, land hue, ice amount, rings, moons (≤16),
  gas bands and spot; star-class colour; climate band.
- 43 biomes, each with a signature hex, hazard and weather. Five are
  fauna-free (acidhaze, abyssgreen, magmasea, hotglow; sulfurdeck is insect
  only) and must stay so.
- Rarer biomes are more saturated or luminous. Ten grade colours.

### Outdated or superseded

- The whole painted pipeline: 17 morph archetypes, `morphParamsV1`,
  hue-rotate / tint remap, hand-painted marking masks, `card/master-512`,
  fits, rigs, contact solver, creature-finish, AI landfall and its model
  store, the Civet / Wolf / Blender studies. Mechanism retired; keep the
  principles (identity rule, accent ≤33%, card = stage, pure function of
  genome).
- Morph quirks not to copy: head scale uses length 8 against 10 heads (7–9
  collapse); proportion affects only head, tail, ears, antennae.
- v1-only: "both parents consumed", `main.js` line numbers, `cfcc_save_v2`
  and HARVEST_CD, "49 probes", "flora ~300", "fauna ~600".
- PROCEDURAL_CHARACTERISTICS §2–§5 "text-only today" are early snapshots;
  heads, eyes, tails and limbs were later drawn. "FA_LIMBS = pairs" is
  wrong; they are totals.
- BIOME_ATLAS §2–§4 (93 Earth + 315 non-Earth + additional biomes) are
  design-pack candidates, not runtime keys. §5 `BIOME_COLOR` is a plan.
- Old review tallies, band names, missing-body rosters: process history.
- "Never override what excels" protected specific painted painters; as a
  list it is moot, as a principle it stands.

### Open questions and risks

- Known descriptor-versus-drawing conflicts, inventoried and not fixed: the
  modern planner ignores `limbs`, `eyes`, `trait`, `habitat` and `x`; leg
  pairs come from loco / body; loco 4 / 13 forces fish before body; raw loco
  mod 18 versus the extremophile set mod 9 (acid-cloud floaters can draw as
  fish); no four-wing option on the bird route. Pixel art must choose:
  honour the text or keep the routing.
- The biome → fauna filter is dead code in v1 (a jungle can show glacier
  fauna). Whether v2 filters by biome profile was not confirmed.
- Hybrids: mixed-kingdom children, `_earthBlendKingdom` ownership, five-stage
  lineage drift, reverse-parent crosses sharing a seed. A sprite generator
  needs a blend rule between two body families, plus drifted indices (wrap
  everywhere).
- Five plans with no Earth analogue (tentacled, membranous,
  crystalline-plated, gelatinous, radial) and alien flora (crystal,
  spore-towers, balloon-pods, glass-needles, mirror-bark) need native pixel
  designs.
- 631 fauna across 24 templates, but 53 profiles were candidate-routed only;
  template fit is unproven for them.
- Selector uniformity: raw `form % n` clumps; hash first and keep every step
  unsigned.
- Tiny sprites versus traits: eye counts, skins, 8 patterns and size
  ×0.28–1.25 must stay legible and distinct. Duplicate detection (no two
  differently named species byte-identical) should carry over.
- Earth colour authority versus the genome colour gene: named species keep
  natural colour only where colour is identity. A palette rule is needed.
- Requested but never built: day/night, seasons, exact-view sharing, a
  landing roll per landing.

---

## Part 2. Capture, breeding, rarity and combat

Documents (all read in full): CAPTURE_AND_BIOSPHERE, BREEDING_AND_SHARING,
LINEAGE_AND_BREEDING, RARITY_AND_GRADES, RARITY_UNIVERSAL,
COMBAT_AND_CONQUEST, ATTACK_ANATOMY, `A/battle2/README.md`.

### Pillars

- One deterministic universe: the same seed or genome gives the same
  creature, stats and fight on every device. Share codes are addresses into
  that maths, not snapshots.
- Survey reveals, capture earns: a roster row is a sighting. Only Tame /
  Scavenge / Sample puts a species in the Compendium, and each world's life
  is a finite resource that recovers by epoch.
- Rarity is the payoff, not a spoiler: hidden until the discovery moment,
  one ten-name ladder for everything, with a reveal that escalates by tier.
- "Never make the player choose between a beloved Earth creature and alien
  progression": breeding is non-lethal, and Earth lineages keep their
  recognisable body while drifting alien over generations.
- Losing is never deletion: defeat and breeding cost bounded active-play
  Recovery, and Swap is never necessary. No wall-clock timers, streaks or
  decay.
- Combat is an honest read → prepare → commit → learn loop: the forecast
  comes from the real resolver. The Chronicle owns the outcome; the stage
  only presents it.
- Attacks come from the creature's actual anatomy: "do not invent weapons".
  A missing jaw, claw or tail never silently falls back to another move.
- Power comes through wins, care and bloodline (levels add hooks, not raw
  stats); bond unlocks sidegrades only.
- Mobile-first, reduced motion and readable-without-colour are requirements.

### Must-carry invariants

Capture and biosphere:

- Verbs by kingdom: fauna → Tame, flora + fungi → Scavenge, microbe →
  Sample. Tame creates a living creature; Scavenge and Sample create
  specimen lots. [D for the split; planner at
  `P/acquisition/src/capture-planner.ts`]
- Base odds per raw tier [V]: .60 .45 .36 .27 .19 .13 .09 .06 .04 .025 .015
  .010 .006 .004 .0025.
- Modifiers [D]: Scavenge ×1.6 (cap .95), Sample ×1.5 (cap .90), depth
  ×0.9^ring (ring 0–5), gear up to +25 points, final clamp .02–.95.
- The target is a uniform random pick from the eligible roster, not a chosen
  species. A hit or miss spends exactly one attempt; empty or Worked Out
  spends nothing. v2 uses two persisted session draws, never `Math.random`.
  [D]
- Biosphere pool = clamp(3 + round(species × 1.2) ± 2 seeded, 3, 16). Seed
  [V], formula [D]. Full reset on a new ecology epoch (20 minutes of active
  play; closed or hidden time adds nothing). [D]
- First-only facts [D]: catalogue entry, reward and rare-find Stardust
  (tier − 3, with a cinematic at tier 5+) only for a genuinely new species.
- Cradle law [D]: Earth starters cap at Uncommon. Ring caps 5 / 8 / 9 / 10 /
  11 / 14.

Breeding, care and lineage:

- Two distinct live owned fauna. Refused before any draw: exhibit, not
  owned, on a mission, in Recovery, hurt ≥ 0.3, or held by an open Command
  fight. [V `P/acquisition/src/breed.ts`]
- Chance = clamp(0.95 − (tierA + tierB) × 0.06 + stardustBonus, 0.08, 0.97);
  bonus 0.01 per 50 lifetime Stardust, capped at 0.15. [V]
- Both parents always survive. Recovery is 8 minutes on success, 2 on
  failure, on the active-play clock. It blocks breed, combat and dispatch
  [V]; it does not block Feed [D].
- Child = `crossGenome` successor. fed = 0.5 × min(parent fed, each clamped
  0–200); +2 XP; +5 once per unordered species pair. [V]
- Lineage: `_earthBlend`, `_earthBlendKingdom`, `_anchorVal` = clamp(dom −
  (0.05 + (1 − mate) × 0.22), 0.22, 0.9). Earth × Earth ≈ 0.90, Earth ×
  alien ≈ 0.73, floor 0.22. A keyed inheritance coin drives the Lineage
  panel (10 trait categories, parent percentages). Guardian-hood never
  inherits. [fields V, formula D]
- Feed [V]: flora always consumed; Loved +2 fed (+3 at flora tier ≥ 4) and
  mends 0.25; Neutral +1 and 0.10; Disliked 0. No companion poison. fed cap
  200.
- Tastes: two liked and one disliked flavour, hidden until tasted. Bond
  levels 0–5 at 0 / 3 / 8 / 15 / 25 / 40 memories. Rest: 2 active minutes
  per 0.1 hurt, max 20. Missions: 10 / 25 / 60 minutes, two field slots,
  never fatal. [D; owners exist in `P/acquisition/src`]
- Species identity is the hash of the complete immutable genome (excluding
  xp, hurt, fed, brood, assignment, bond). Portrait cache keys use the full
  genome plus ordered lineage, because A×B and B×A can share a seed but look
  different. [D]

Share codes:

- `CF1-`: world address (galaxy and star coordinates and seeds, optional
  planet seed and name). A pointer, re-verified on arrival; never bypasses
  Land. [D]
- `CFB-`: {g, n, x?}. `normGenome` strips parents, hurt, xp and private
  fields. The Champion variant carries xp clamped 0–486 and is exhibit-only.
  [V `combatcore.verbatim.js`]
- `CFB2-`: preserves one ordered parent pair. [V
  `P/combatcore/src/lineage-codec.ts`]
- No code carries a visual recipe. A pixel recipe must be derivable from
  genome plus lineage alone, or cross-device parity breaks.

Rarity:

- Raw tier 0–14 is rolled, persisted and sorted on. Display names and
  colours [V `A/rarity-presentation.ts`]: Common #B8BDC7, Uncommon #4FD16B,
  Notable #35C9B5, Rare #3D8BFF, Exotic #9A5CFF, Legendary #F4A62A, Mythic
  #E54B8D, Celestial #54D8FF, Primordial #D85B3F, Transcendent #F7F1FF.
  Invalid input shows nothing, never Common.
- Roll thresholds unchanged (40% Common down to about 1 in 33 million).
  Merit boosts +1 each for size ≥ 4, size ≥ 5, lumin, gen ≥ 2, gen ≥ 5,
  wild. Apex forces 12–14, paragon 8–11. [D]
- Rarity colour is badge, label, frame and glow only; it never recolours the
  creature. No glyphs, no all-caps. Hidden before landing or catch.
- Shown on Survey after landing, Compendium list and detail, and Binder
  slots, on an opaque #05070d backing.

Combat and conquest:

- Stats: Vitality, Ferocity, Resilience, Agility, Instinct. budget = 170 +
  tier × 38 + floor(r × 30), seeded by seed ^ 0x57A7. HP = vit × 3. Crit
  chance min(.95, ins/420 + critB), ×1.7. Damage = fer × (1 + ramp) × (0.8 +
  r × 0.5) − res × 0.45. 26 rounds. Higher agility strikes first. Duel RNG
  is hashInt(seedA, seedB, 0xD0E1). [V]
- Level = min(9, floor(sqrt(xp/6))). [V] 17 archetypes, class innates, 11
  ability themes.
- Transcript events the stage consumes: hit {side, dmg, crit, hpA, hpB},
  dodge, stun-skip, tick (burn / regen). [D]
- Defender priority: Titan, then Guardian (about 2.5% of fauna worlds; raw
  tier 12 / 13 / 14 at 70 / 25 / 5; size 5; lumin; 16 epithets), then the
  strongest wild fauna. A conquered world cannot be re-won. [V for
  "already-conquered"; guardian numbers D]
- Party of up to 3 for Guardian / Titan fights only; wild conquest is one
  fighter in Auto. [V]
- Stances [V, marked placeholder tuning]: balanced; press (dealt 1.15 /
  taken 1.10); guard (.90 / .85, opener ×0.5); evade (.90, +.08 dodge).
- Auto / Command: Command pauses at Breaks (a fighter's first drop to 1/3
  HP, a fall, or the Guardian phase) for Hold / Swap / Withdraw. Rewards are
  identical to Auto. [low-HP fraction V; rest D]
- Guardian phase at ½ HP: dealt ×1.2, taken ×0.9, announced before it
  applies. [V]
- Defeat → Recovery for 10 active minutes with no added wound; the companion
  is never removed, captured Guardians included. [V]
- Rewards: Stardust 8 + tier × 5 (+40 for a Guardian) [V]; XP 20 or 60 +
  tier; friendly duel +8 / 2 / 3 with 30-second active-play windows [D].

### What the art and animation must express

Per-creature action set and base timings [V] (`A/motion/family-actions.ts`,
`A/motion/timing.ts`):

| Action | Phases, ms at mass 1.00 |
| --- | --- |
| idle | loop, seeded 2600–3400, additive under everything |
| alert | 220 |
| approach:<gait> | 420 per stride |
| melee:<verb> | anticipation 140, strike 90, smear 1 frame, recovery 260 |
| cast | rise 180, hold 120, release 90, settle 220 |
| hit | recoil 110, stagger 160, settle 180 |
| dodge | out 120, back 160 |
| faint | fall 520 |
| victory | rear 210, toss 150, settle 240 |
| return | 380 |
| tame | 260 / 200 / 180 |
| feed | 160 / 120 / 120 / 180 (two chews) |
| plants | sway; disturb 120 / 260; harvest 180 / 90 / 220; grow 320 / 120 / 160 |

Durations scale by mass class: tiny .70, small .85, medium 1.0, large 1.2,
huge 1.4, titanic 1.6. Frame rate 60 desktop / 30 phone.

Turn beats [V] (`A/battle2/choreography.ts`): ready → command (cursor blink
250) → approach (≤ 500, or whole gait cycles ≤ 900) → action → hitstop at the
contact instant (70 × mass, cap 140) → flash (2 white frames + 120 fade),
shake (6 px, 180 ms), damage number (pop 90, rise 420, fade 160) → reaction
(hit after hitstop; dodge leads impact by 120 ms; faint) → return (≤ 500) →
idle tail 600.

- Contact law: contact instant = effect impact = sound cue = damage number.
  Contact is the end of the strike phase for claws and the smear pose for
  other moves; never a percentage of clip length.
- Reduced motion: rest pose, no shake, flash or effect; static number.

Attack table by family [V] (`A/anatomy-attacks.ts`; verb, then contact
joint). Code has 37 rows; ATTACK_ANATOMY says 34.

| Family | Attacks |
| --- | --- |
| quadruped | bite (jaw), foreclaw rake (fore paw), horn thrust / gore (head), headbutt (head), tail lash (tail tip), forehoof kick (fore paw, ground only) |
| hopper | hind-leg kick, leaping bite |
| biped-bird | beak peck, talon strike (airborne), grounded foot kick |
| fish (water) | swimming bite, body strike, caudal sweep, axial barb lash |
| insect | mandible snap, thorax shove |
| serpent | coiled strike (bite), body coil (constrict) |
| arachnid | chelicera bite, stinger arc, body shove |
| radial (water) | arm strike (sting), bell pulse |
| myriapod | mandible snap, rear sting, segment shove |
| cephalopod (water) | arm lash, beak lunge |
| flyer-membrane | flying bite, foot rake |
| primate | arm strike (punch), bite |
| brachyuran crab | pincer pinch (open on anticipation, close on strike) |
| crustacean-clawed | chela pinch |
| crustacean-small (water) | foreleg tip strike |
| larva | soft body press |
| annelid, sessile-filter, gastropod, bivalve | no melee; cast with a whole-body pulse, effect launched from aperture / mouth / siphon or body centre; bivalve valves open then clap; no run-up when anchored |
| woody and herbaceous plants | no attack |

Weapons must be observed on the individual: paw or claw gives claw, hoof
gives kick, pad or flipper gives neither; a jaw does not imply teeth; horn
only with a horn landmark.

Effects [V]: 11 themes (fire, frost, storm, tide, stone, venom, void, sand,
chem, psionic, wild), each with launch / travel / impact phases. Melee
delivery for wild, stone and sand; all others cast. The effect launches at
the attacker's contact joint and lands on the target's body centre.

Stage: three parallax plates (.10 / .50 / 1.20); stands at x = 1/3 and 2/3;
ground line y ≈ 0.78; creature height 1/3–1/2 of frame by mass; width ≤ 0.42
of frame. Fighters are placed in ground, air or water bands by habitat. The
arena is picked by the world's biome (43 biomes → 8 world types).

Guardian: fills 0.96 of the frame on its tallest pose. Opt-in set pieces
(default off [V]): entrance with rise, roar and name card; a ½-HP phase
beat; heavy strikes; a fall or triumph finale. Rarity aura on raw tier ≥ 4:
apex molten gold, paragon silver-teal.

Party swap [V]: one captioned relay beat per earlier fighter, 1.1 s (0.7 s
reduced). Earlier fighters are caption-only today.

Other presentation: Tame greeting; `tame` and `feed` clips; the specimen
Reveal modal for a first catch or bred hybrid; tier-scaled reveal with a
per-tier frame; Lineage panel; condition states Healthy / Bruised / Injured /
Critical; Recovery, Away and Ready badges; two HP meters. There is no
dedicated hatch animation anywhere in these documents.

### Outdated or superseded

- v1 "both breed parents consumed", live `Math.random` rolls, a child
  starting at fed 0, and feed poison or death for companions.
- The Mercy Law and the "captured Guardian defeat = permanent tombstone"
  overlays: superseded by Recovery (code and Guide agree).
- "Decided, not yet implemented" for parties and Command: implemented.
  "No live duel / conquest", "CFB not exposed in v2 UI": later shipped.
- The 200 ms whole-portrait lunge presentation is only the fallback now.
- "Separate Discover Life control unavailable" is contradicted by the Guide
  text in code, where it is a live bioscan.
- The 15-name rarity ladder, star glyphs and the "Spectral class" survey row
  are retired.
- Painted-rig-only material: parts / fixture / portrait rigs, skin solver,
  master pins, keyed alpha, marking masks, morph atlas, weapon-declaration
  hashes, plate packs, the archetype lists and pending counts.
- All run ids and line anchors are evidence history, not design.
- Stance and phase numbers, the 10-minute Recovery and mission rates are
  labelled placeholders.

### Open questions and risks

- Hybrids: the design needs a dominant Earth scaffold, the child's palette,
  and alien grafts (crest, tendrils, frill, spikes, ocelli) proportional to
  1 − anchor, continuous over five or more generations, with A×B different
  from B×A and two or three protected species markers. Sprite sheets cannot
  interpolate. Choose between layered or paletted part sprites and discrete
  anchor stages. Only 13 lineages were ever proven.
- Animation count: about 9 battle actions plus tame and feed, 1–6 melee
  verbs per family, and gaits, across 631 Earth fauna and unbounded
  procedural aliens. Decide per-family templates with palette or part swaps
  versus per-species sheets.
- Contact needs a per-frame contact point and a marked contact frame per
  attack. The crab pinch must visibly close.
- Mass-scaled timings and 60 / 30 fps against fixed frame counts: fix a
  frame-step policy; the smear is a single frame.
- Size readability: tiny creatures at 1/3 frame height versus Guardians at
  0.96 on a phone; no pixel-scale rule exists.
- Ground / air / water bands, the half-lake and parallax plates need pixel
  equivalents for 43 biomes.
- The Transcendent "prismatic, never plain white" treatment, per-tier frames
  readable without colour, and the apex / paragon auras need pixel forms.
- Flora, fungi and microbes have battle stats but only sway / disturb /
  harvest / grow. How a non-fauna combatant is shown is unresolved.
- Earlier party fighters are not staged; faint has no get-up or stay-down
  rule; Guardian set pieces await the owner's choices.
- Not verified in code: capture verb multipliers and the depth formula,
  rare-find Stardust gating, the guardian spawn split, the `_anchorVal`
  formula, bond thresholds, mission numbers.

---

## Part 3. Progression, economy and saves

Documents: README, ECONOMY_LOOT_CRAFTING and MATERIALS_AND_GEAR read
directly; PROGRESSION, QUESTS_AND_CHAPTERS,
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS, FORGE_AND_DISCOVERY and SAVE_SYSTEM
digested at second hand.

### The game

"Master the infinite": a deterministic, seeded, effectively infinite
universe. The README's own summary: survey worlds, catalogue alien life,
breed hybrids, conquer planets, complete the Prime Codex. The loop is
Discover, Learn, Gather, Build, Raise, Risk, Return, Reach farther. Three
Chapters open travel rings (Sol, Neighborhood, home galaxy, universe), each
capped by a ship system. Nine Prime Signatures are then won from Elemental
Titans. The ninth opens a one-time choice of five Frontier legacies. A
parallel engineer's track turns mined elements and Stardust into ship
capability and gear.

Pillars:

- Determinism: everything derives from seeds.
- Honest odds: chance and HP risk shown before the action; one receipt per
  outcome; no reload reroll.
- Play time, not wall clock: "the empire pays you for playing, not for
  waiting"; no streaks, expiry, upkeep or idle income.
- Rarity is not power: power comes from level, quality, affixes and
  upgrades.
- Capability ladder: ship stage and reach derive from built systems; art
  never grants reach.
- Rarity is revealed on landing, never from orbit.
- Nonlethal by design: breeding keeps parents, hazards leave the explorer at
  1 HP, defeat means Recovery.
- Mobile-first; actions are explicit buttons, never gestures.
- "Build the cathedral": full depth, bespoke art for every material, gear
  piece and ship tier.
- Saves are protected: a future, corrupt or unknown save is never
  overwritten.

### System status in code

| System | Status | Where |
| --- | --- | --- |
| Creature XP and levels | Implemented | `P/combatcore`, `A/compendium-creature-progression.ts` |
| Explorer ranks, score, nameplates | Implemented | `P/progression/src/rank.ts` |
| Achievements (96 on 13 shelves) and ceremonies | Implemented | `P/progression/src/achievements.ts` |
| Chapters | Implemented | `packages/scene/src/charter.ts` |
| Starter Charters (10, two chains, cap 3) | Implemented | `starter-charters.ts` |
| Weekly Charters (5 rows, 4 hours of active play per cycle) | Implemented, changed from v1 | `persistence/src/weekly-charters.ts` |
| Prime Codex and five endings | Implemented | `prime-codex-panel.ts` |
| Records, Binder, Fifty Paragons, Chronicle and Museum | Implemented | `binder-sets.ts`, `paragon-finder.ts` |
| Guide | Partial (9 categories; about 37 partial and 6 unavailable topics) | `guide-content.ts` |
| Field Training | Partial (16 steps; v1 had 21; no feed / breed / duel / heal lessons) | `training.ts` |
| Stardust and harvest | Implemented | `world-harvest.ts` |
| Materials, mining, star skim | Implemented | `arc3-engineering-actions.ts` |
| Research (6 rows) and Fabricator (62 fixed recipes, ×5 batch, recipe pin) | Implemented | `economy-ledger.ts`, `engineering-panel.ts` |
| Gear and Inventory (equip, salvage, Pureforged) | Implemented | `P/loot/src/gear.ts` |
| Shipyard, 4 chassis stages, 3 hardpoints | Implemented as a projection plus code-drawn SVG | `packages/scene/src/ship-visual-state.ts` |
| Travel, Survey, Landing, wave-offs, Bioscan hazard, Star Atlas | Implemented | `arc0-landing-action.ts` and neighbours |
| Capture, Feed, Breed, Rename, Scout, Rest, care / bond, friendly duels | Implemented | `P/acquisition/src/*` |
| Companion missions and Outposts | Implemented with placeholder numbers | `arc5-missions.ts`, `outposts.ts` |
| Auto-Extractor | Domain present; UI wiring not checked | `P/progression/src/auto-extractor.ts` |
| Random drops, prefix / suffix pools, drawbacks, upgrades, sockets, quality grades, Uniques, vendors, biological ingredients | Designed only | — |
| Conquest affix imbue and Guardian authored loot | Designed only | — |
| Item and material icons, ornamental frames, paper-doll sheet, living ship preview | Designed only | — |
| First 30–60 minute journey gate | Designed only | — |
| First Arrival +2 Stardust, "new innate art awakens" toast | Not found in v2 | — |

### Must-carry invariants

Save:

- v2 saves live in IndexedDB `cf-v2-slice`, version 2, nine stores. [V]
  Renaming the database, a store or a key orphans every save.
- The product envelope is still v:4; the repository is schema 5, split into
  player / creatures / catalog / inventory / settings. Migration v4 → v5 is
  one compare-and-apply and never deletes the v4 primary. [V]
- `v > 4` returns future-version and the save is protected. Absent carrier
  means empty; malformed or future means protected. [V]
- Every write is one revision-checked transaction with an immutable receipt;
  no retries. [V]
- Load clamps [V]: essence 0..1e9, explorer stats 1..330, cargo 0..1e6,
  exceptional sub-count ≤ cargo, items 0..999, notifications 60. Genome
  `size` is never clamped.
- Absent-field defaults [V]: `tut` absent means done; `tips` and `notif` on;
  `vol` 1.
- The save holds no art ids or image references (one legacy exception).
  Appearance derives from genome indices and seeds. [V]
- v2 has no player import door and never reads the v1 localStorage key. [V]

Clock:

- Harvest pays 6 + 4 × tier Stardust, ready after 2 epochs (about 40 minutes
  of play), one receipt per world and epoch. The device clock grants
  nothing. [V]
- Auto-Extractor: 1 load per 600,000 ms, cap 30, on active-play time. [V in
  domain]

Progression:

- Level = min(9, floor(sqrt(xp/6))); cap 486 XP; innate-art slots at L1 /
  L3 / L6; levels never raise stats. [V]
- XP awards [V]: duel 8 / 3 / 2; conquest 20 + tier; Guardian or Titan 60 +
  tier; loss 3 (up to 5); Scout +2; breed +2, +5 for a first pair; care
  +1 / +2.
- Ranks [V]: thresholds 0 / 30 / 90 / 220 / 460 / 900 / 1700 / 3000 / 5200 /
  8200, then prestige every +3000; best rank is monotonic.
- Conquered worlds cannot be re-won. [V]
- The ending is one-time and needs nine Signatures; the Balance ending also
  needs 3 conquests, the Electric Signature and 40 species. [V]

Economy:

- Catalogue [V]: 47 materials (7 cosmic); 62 items (9 parts, 6 components, 5
  systems, 26 gear, 7 cosmic gear, 9 Signature relics); 9 slots.
- Research costs [V]: scan1 20, hull1 40, lab1 60, drive1 40, drive2 120,
  drive3 300 Stardust; drives give 2× / 4× / 8×.
- Ship stage [V]: igdrive or chapters complete → 3; array → 2; jumpdrive →
  1; else 0. System order jumpdrive, array, igdrive, autoext, cscoop.
- Six affixes with ranges [V]: yield 10–35%, strike 2–6%, scut 8–25%,
  contact 4–12, land 4–12, heal 8–20%.
- Hull factor 0.75 applies before the worn wound reduction, which caps at
  0.7. [V]
- Mining and salvage constants [D].

Naming: "Compendium" is the species catalogue and "Prime Codex" the win
track. Flora is consumed on eat.

### What needs art (approximate counts)

- Materials: 47 icons. The materials document forbids family recolours; each
  needs its own silhouette. None exist today.
- Items: 62 icons. Each has a `family` and a `hue`. None exist today.
- Ship: 4 chassis × 3 hardpoints plus livery, one state graph across
  Shipyard, travel and arrival.
- Rarity: 10 badge and frame treatments, readable without colour.
- Explorer: paper doll with 9 sockets; duel avatar.
- Prime Codex: 9 Signature sigils, 9 Titans, 6 reach rings, 5 ending cards.
- Ranks: 10 badges, 10 nameplate hues, an iridescent foil, a prestige mark,
  a rank-up burst.
- Achievements: 96 icons (emoji today) on 13 shelves. Binder: 6 type pages,
  7–8 Set badges, 50 Paragon portraits and silhouettes.
- Chapters: 3 cards, 13 goal rows, 3 capstone icons. Charters: 10 starter
  and 5 weekly rows.
- Companions: 5 flavour icons, 6 bond levels, 4 wound states, level pips
  1–9, class and innate-art icons.
- Research: 6 rows. Outposts: 3 kinds × 3 stages. Missions: 2 types × 3
  lengths.
- Screens: Survey, Landing, Capture, Engineering and Shipyard, Inventory
  with inspect / compare, Compendium list and detail, Star Atlas, Charter
  board, Mission board, Outposts, Records, Chronicle and Museum, Prime
  Codex, Guide, Training.
- World: galaxy, system and planet views, travel presentation, biome vistas.

### Outdated or superseded

- README: about 350 lines of dated overlays; "single-file HTML", "saves live
  in localStorage" and "21-step Field Training" describe v1.
- SAVE_SYSTEM §1–7 (localStorage, the 900 ms save queue, the v1 farewell,
  "no migration") are v1.
- Hourly wall-clock harvest is replaced by the 2-epoch rule.
- Weekly Charters on a calendar week with 8 rows are replaced by 5 rows on
  active play.
- Statements that missions, care / bond, Rest, friendly duels, outposts and
  weekly Charters are "open": all exist in code.
- "Only Deep Scanners is purchasable" and "Shipyard is inspection only".
- The 9-step world ladder and 15 grade names: replaced by the 10-tier
  ladder.

### Open questions and risks

- Item and material art is net-new, not a conversion: 109 icons under a
  locked "full bespoke, no recolour" mandate written for painterly art. Does
  it carry to pixel art as written?
- Assets are tint-driven (item `hue`, ship livery seed, 10 rarity hexes,
  planet colour). A pixel pipeline needs a palette rule that keeps "rarity
  never recolours art".
- Do not renumber genome trait tables or content id sets; the load sanitizer
  drops anything it does not recognise.
- The painted-art browser stores sit outside the save and nothing clears
  them; they can be gigabytes on a player's device.
- Whether the service worker or battle manifest pins painted assets by hash
  was not verified.
- Conquest imbue and Guardian loot each await an owner decision.
- Mission rates and outpost costs are placeholders; do not bake numbers into
  art.
- Training and Guide are thinner than v1. Decide whether the missing lessons
  must carry over.
- The 132 / 440 px portrait split and the 960 × 430 vista size are
  painterly-era numbers; undecided for pixel art.

---

## Part 4. Presentation, motion, UI, sound, decisions and process

Read in full: PIXEL_ART_DIRECTION, MOTION_KIT §0–10, SOUND_KIT §0–6,
port/DECISIONS. Read by structure and rule sections only: UI_PRESENTATION,
CREATURE_ANIMATION, ART_DIRECTION, ART_KIT, AUDIO, PROCESS_LAWS (law titles
and closing sections; the stories were not read).

### Presentation pillars

- Two-second silhouette test at thumbnail size: biological group readable,
  at least three identity traits, how it moves and feeds, Earth versus
  alien.
- Earth = real anatomy first: never drop limb count, the defining head /
  bill / shell / fin / wing, posture, or sessile-versus-mobile. Anatomy is
  not an effect; one dominant visual idea.
- Rarity changes UI and effects only, never body or planet colour; "rare is
  not rainbow". Palette stack: biome primary > biome secondary > material >
  species accent > anomaly.
- One system: colour, flora, fauna, procedural pools, vistas and map dots
  read one biome record. Procedural life is "surprising but inevitable for
  its world"; generation order planet > biome > chemistry > niche > body
  family > movement > surface > head > accent > anomaly.
- Same identity in every view. The existing genome, lineage and named owner
  are the authority; no rerolls, no silent anatomy substitution.
- The motion reference is already 16-bit turn-based battles: strong key
  poses, anticipation, fast main beat, overshoot, settle, mass decides
  timing, secondary parts lag, honest contact, reads in silhouette. This is
  the best-fitting document for pixel art.
- One interpreter: motion and sound are compiled from game data per family,
  never hand-tuned per creature. A wrong creature is a family defect.
- UI belongs to the world: navy card, cyan selection, brass, ivory text, on
  the accepted control placement with 44 px targets.
- Sound: every sound has a visible cause; cues ride choreography beats;
  refusal must sound unlike success; a tone belongs to a press, never a
  render.
- Presentation never awards rewards, mutates lineage or draws gameplay RNG.
  The playback clock advances animation; it never chooses it.

### Motion design to carry over

Templates [V] (`A/motion/family-templates.ts`, `family-actions.ts`,
`tools/creature-animation/family-contracts.mjs`): 14 = 12 fauna + 2 plant.

| Template | Gaits | Melee verbs seen |
| --- | --- | --- |
| quadruped (mammal, reptile, amphibian, turtle) | walk, trot, gallop, hop | bite, claw, gore, tail, headbutt |
| hopper | hop | kick, bite |
| biped-bird | walk, flight | peck, claw |
| fish | swim | bite |
| insect | crawl, flight | mandible |
| serpent | slither | strike, constrict |
| arachnid | scuttle | sting, bite |
| myriapod | crawl | mandible, sting |
| radial | pulse / drift | sting-arms |
| cephalopod | jet / crawl | lash |
| flyer-membrane | flight, crawl | bite, claw |
| primate | walk, climb | punch, bite |
| plant-woody, plant-herb | — | sway, disturb, harvest, grow |

A further 24 specialised invertebrate inventories exist in
`tools/creature-animation/specialized-templates.mjs` (brachyuran,
crustacean-clawed / small, bivalve, gastropod, annelid, lobopod, xiphosuran,
isopod, barnacle, nautiloid, echinoderm-test, tube-worm, larva,
ctenophore-body, sessile / colonial filter and others). Treat them as the
list of body plans pixel art must cover, not as rigs.

An unlisted family gets a labelled whole-portrait fallback; never guess a
skeleton or invent legs, teeth or wings.

What each action must read as: idle = breathe, weight shift, one secondary
flick; alert = head up, ears or antennae forward, one-beat hold; approach =
run-up with feet planting on the ground line; melee = anticipation, strike
with a one-frame smear, recovery; cast = rear or rise, hold, release toward
the target; hit = head back, compress, one-step stagger, settle; dodge =
sidestep or hop back and return; faint = collapse along the family fall
path, no bounce; victory = rear, hop or head toss, settle; tame = approach,
lower head, settle; feed = head down, two chews, up.

Impact conventions [V]: hitstop 70 ms × attacker mass, cap 140, both
combatants; 2 white frames then a 120 ms fade; shake 6 px for 180 ms; damage
number pop 90, rise 420, fade 160.

Battle beat structure [V]: ready > command > approach > action > hitstop >
impact > reaction > return > idle. Both combatants idle additively
throughout; the idle clock freezes in hitstop. Frame 1024 × 576; combatants
on the left and right thirds on one ground line; no camera moves.

Secondary motion by material and medium [D]: fur lag .08 s, feather .06,
scaled .05, slick squash 6% / stretch 4%, chitin sharp stops, translucent
wobble .12; aquatic damped 25%, aerial 1.4 s bob.

Reduced motion [V]: `motionMode` −1 Auto follows the OS live, 0 full, else
reduced. In battle: rest pose, no effect, shake or flash, only the number.
The cue plan drops approach-start, flash-sting and shake-rumble but keeps
the hitstop thump, damage tick and vocals. Camera shake has its own policy.

Staging outside battle [D]: landfall plate life (rain, mist, water shimmer,
foliage sway, distant fliers) seeded and replayable; Compendium grow + idle;
ships launch, dock and jump; panels open 220 ms / close 160 ms with no
bounce; loot pop 90 ms, flourish by rarity, never a glow ring.

### UI rules to carry over

- iPhone primary. `--topbar-h` and `--row1-h` are measured and published
  [V], re-synced on resize and orientation. Phone breakpoint ≤ 700 px;
  short-landscape exception ≤ 900.
- Touch: 44 px target, 36 px utility face [V]. Phone dock: an upper row of
  five boards (Survey, Compendium, Prime, Shipyard, Atlas) and a lower row
  (Records, Notifications, Guide, Settings).
- DPR heat cap 2 touch / 3 desktop, plus a per-canvas backing-pixel cap [V].
- One panel law: opening one closes the rest; exactly one top-right 44 px
  Close per surface; tap-empty closes; true modals (fights, reveal, prompts)
  never auto-close; Escape closes one overlay per press.
- Surfaces: universe / galaxy / system map, survey card, landing vista,
  Planetside, Compendium, reveal card, capture card, combat card and battle
  scene, Prime Codex, Star Atlas, Charters, Records, Shipyard, Engineering /
  Fabricator, Inventory, Missions, Outposts, Notifications, Guide, Settings,
  Field Training, release notes.
- Naming: "Compendium" for the catalogue; "Prime Codex" keeps "Codex";
  "Pureforged" for fully exceptional crafts.
- Settings: motion (Auto / Full / Reduced), sound, volume, creature voices
  and battle sound independently, charts, shake, effects, tone / font / text
  size, notifications.
- Field Training advances on real game events. Emitters verified: survey,
  atlas-add, atlas-open, landfall, bioscan, conquest, panel-open. The Guide
  describes only executable outcomes.

### Owner decisions (port/DECISIONS.md)

Still binding:

- #1 a child inherits 50% of the lower parent's `fed`. #5 the load path does
  not wrap `size`.
- #7 capability-building exploration loop. #8 deterministic earned item
  instances; no rerolls or hidden odds. #9 a catalogue species is not a
  living companion; individuals carry nickname, lineage and XP. #10 missions
  are active-play, exact-once and nonlethal.
- #11 ship silhouette and mechanics share one state: four readable chassis
  stages plus hardpoints; three views may not disagree. A direct pixel-art
  requirement.
- #12 full local audio identity per catalogue row; flora and fungi get
  ecological sonification, not animal calls. #13 no dark patterns. #14
  distant calls are presentation-only and need an equal visual hint. #15
  companion expression variants need a text or visual counterpart; no idle
  polling or absence triggers.
- #16 nonlethal breeding with Recovery and a published chance formula. #17
  rename policy. #18 Pureforged. #19 all five research consequences ship;
  presentation must not manufacture waiting.
- #20 Guardian / Titan party of up to 3 as a relay, Auto or Command, Breaks
  at 1/3 HP and phase change, nothing timed, identical rewards, defeat is
  Recovery, forecast shows both.
- No legacy save import (2026-09-05).

Moot or needing a new decision:

- The 2026-09-04 audiovisual pilot's tool plan is painted-era. Its pack
  budget, no-LFS and "optimized outputs only in public Git" rules probably
  still apply; ask the owner.
- #6 beast placement pass. Tool-role and browser-authority resolutions are
  process, not art.

### Process laws worth keeping

1. Assert the outcome, not the code path; never assert a selector's spelling.
2. Negative-control every new check in both directions.
3. When an instrument fires or passes, suspect the instrument first.
4. A check only sees the axis it measures; a check on an empty surface is
   vacuous.
5. An automated gate cannot answer "does it look right"; review stills at
   real size; a verdict is bound to the view the reviewer judged.
6. Five clean stills do not clear a known worst pose; reproduce the reported
   geometry.
7. A thing you cannot render is a thing you cannot review.
8. Grep every reader and writer of a field before changing it; two correct
   fixes can disagree.
9. CSS: min-height beats max-height; an equal-specificity rule earlier in
   the sheet loses; one ID beats any number of classes.
10. jsdom has no layout; a rule can be present and inert, so use a real
    browser.
11. Painted is not answerable; nothing expensive runs behind a blocking
    full-screen surface.
12. Canvas pixels do not prove visibility through DOM overlays.
13. Stacked floating surfaces share one geometry equation; sticky headers
    need capacity and scroll clearance.
14. One surface, one close owner; a closed surface owns state, not DOM or
    listeners.
15. Absent, blank, empty and closed are four different UI facts.
16. Render-target demand derives from displayed backing pixels.
17. Rarity data and rarity presentation are different contracts; a display
    name is a label, not an identity; a leaf seed does not identify a world.
18. A cache key built from expensive values cannot short-circuit the work
    that makes them.
19. "The data is valid" is not "the code runs it"; a routing table written
    from memory drifts.
20. A check that reads a build artefact must prove it is current.
21. Restore the state your previous pass mutated; namespace probe output.
22. Semantic convergence, not a sleep, owns async success; stop at the
    causal boundary; no automatic retry.
23. Doc / code disagreement is a finding either way; a doc certifying a doc
    manufactures confidence.
24. An arc is not done until its docs and handoff agree; hosted CI is a
    finite release resource.
25. Deep play must respect the player; a checkpoint restores only what it
    owned.
26. Never override what already excels, including with your own
    improvements.

### Leave behind

- Mesh rig and skin: the deform kernel, compiled skin fields, cut seams,
  seam bridges, weld pairs, hinge edges, ownership islands, pose projection,
  joint limits, the joint / part / atlas caps (most of
  `tools/creature-animation/*`; `battle2/parts-rig`, `rig-render`,
  `fixture-rig`; `creature-finish-*`).
- Fits and intake: fitted records, landmark fitting, keyed magenta,
  turnaround sheets, large masters, the prompt compiler and its negatives.
- Finisher and local AI: finished textures, the creature-finish class, AI
  landfall and presentation.
- Evidence machinery: film gates, ten-second captures, native epochs, memory
  epochs, numbered batches, registry and certification rows, master pins,
  arena sets, painted themes, painted cards and the morph system.
- Keep from these: the body-plan table, the list of "existing conflicts that
  must not be silently repaired" (descriptor versus drawing), and the rule
  that scene or medium never rewrites the organism.

### Risks

- Integer scaling versus fluid layout: the shell is CSS-measured, the battle
  frame is a fixed 1024 × 576 scaled to fit, DPR is capped with sub-1
  resolution allowed and antialiasing on. Non-integer scaling will shimmer.
- MOTION_KIT §2 says "never stepped" and specifies eased interpolation at
  60 fps with sub-pixel squash, a one-frame smear and 6 px shake.
  Frame-based sprites conflict with that wording; it needs an explicit
  owner decision and a new kit version, not a quiet rewrite.
- Compiled per-family motion assumed joints. Pixel art needs per-family pose
  sets across 14 templates + 24 specialised plans × about 11 actions, and
  procedural bodies with variable limb counts need part assembly that still
  plants feet and hits the contact joint.
- Readability at 132 px cards and 50 px tiles; combatants are 1/3–1/2 of a
  576 px frame shrunk to a 390 px phone; 1,010 identities must stay
  distinct.
- Fonts and icons: a smooth variable typeface and colour emoji are the
  accepted UI. A pixel font must respect text-size preferences, contrast and
  44 px targets; emoji will clash with pixel art.
- Heat and memory: the phone 30 fps budget, DPR cap, art-cache caps and the
  art-hold law still apply; sprite sheets × species can exceed the old pack
  budget.
- Determinism: procedural (unnamed) art is in the v1 fingerprint; versioned
  palettes and part sets must reproduce from the existing identity with no
  new RNG draws and no change to save contracts.
- The sound kit forbids chiptune and bleeps; pixel visuals should not pull
  audio that way without a decision.
- Effects are specified as three painted phases with at most 200 particles
  and "painted shape, never bloom"; they need a pixel equivalent anchored
  the same way.
