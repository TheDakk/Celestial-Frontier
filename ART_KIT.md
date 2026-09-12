# Celestial Frontier Art Kit

Art direction and prompt kit, version 4, 2026-09-12. Canonical style statement for Nick's approved Living Worlds, Discovery Atlas, Earth landfall and fungal landfall: one painted hand, the game's thirteen star kinds, source-derived subjects, and the retained class layouts and production rules. **Approved by Nick at 6f5c396e, with the September 12 engine-first order in section 9.**

Each section is plain text inside a fenced block so it can be copied into a prompt tool exactly as written.

## Contents

1. [0. How to use](#0-how-to-use)
2. [1. Reference lock](#1-reference-lock)
3. [2. Frozen style](#2-frozen-style)
4. [3. The one universe](#3-the-one-universe)
5. [4A. Universe (scene)](#4a-universe-scene)
6. [4B. Stars (scene)](#4b-stars-scene)
7. [4C. Planets (orbital cut-out, biome scene)](#4c-planets-orbital-cut-out-biome-scene)
8. [4D. Flora (cut-out)](#4d-flora-cut-out)
9. [4E. Fauna (cut-out)](#4e-fauna-cut-out)
10. [4F. People (cut-out)](#4f-people-cut-out)
11. [4G. Ships (cut-out)](#4g-ships-cut-out)
12. [4H. Landmarks and props (cut-out)](#4h-landmarks-and-props-cut-out)
13. [4I. Items, loot and resources (cut-out)](#4i-items-loot-and-resources-cut-out)
14. [4J. Emblems: upgrades, abilities, status (cut-out)](#4j-emblems-upgrades-abilities-status-cut-out)
15. [5. Technical output](#5-technical-output)
16. [6. Shared negative](#6-shared-negative)
17. [7. Writing a subject line](#7-writing-a-subject-line)
18. [8. Production discipline](#8-production-discipline)
19. [9. Engine proof before library rollout](#9-engine-proof-before-library-rollout)

## 0. How to use

```text
CELESTIAL FRONTIER - ART DIRECTION AND PROMPT KIT
style_id: frontier   |   version 4, 2026-09-12   |   one hand for the whole universe

Every image prompt is built in this order:
    REFERENCE LOCK  ->  FROZEN STYLE  ->  SYSTEM CARD  ->  SUBJECT
    ->  ACCURACY  ->  LAYOUT  ->  TECHNICAL OUTPUT  ->  NEGATIVE

Sections 1, 2 and 6 are identical in every prompt and are never reworded.
Section 3 is filled by the one compiler from game data and shared by prompts
for the same system, planet and vista inputs. Nobody types a system card.
Section 4 picks ONE class and supplies its LAYOUT, its OUTPUT and its
NEGATIVE ADDITIONS. Section 5 supplies the technical block for that class's
kind (cut-out or scene). Only the SUBJECT line and the system card change per
image.

ACCURACY is used by the cut-out classes only (planets-orbital, flora, fauna,
ships, landmarks, items, emblems). Scene classes omit it. People are inactive
until the game has people, as section 4F states.

Two kinds of image, and they take opposite rules:
    CUT-OUT   one isolated subject on the key colour, composited in the game
              (orbital planets, flora, fauna, ships, landmarks, items, emblems)
    SCENE     a full-bleed painting with no isolation
              (universe, stars, planet biomes)
Pasting a cut-out negative into a scene prompt, or the reverse, is the one
copy-paste mistake that quietly ruins a batch.

Nobody improves the wording at send time. One interpreter of these rules is
what makes image 1,200 match image 3.
```

## 1. Reference lock

```text
Paste in every prompt. Attach the ONE reference the class calls for, never both.

For cut-out classes:
  Match the exact visual language of the attached approved Discovery Atlas,
  audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png,
  style_id "frontier". Do not redesign or reinterpret the style. The atlas is
  a reference only: never crop artwork out of it. Its background, lettering
  and divided layout are not the output layout; use this class's own layout.
  SHA-256: c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62

For scene classes:
  Match the exact visual language of the attached approved Living Worlds
  triptych, audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png,
  style_id "frontier". Do not redesign or reinterpret the style. The triptych
  is a reference only: never crop artwork out of it. Its lettering and panel
  divisions are not the output layout; use this class's own layout.
  SHA-256: 68f03f0233ec2ca89ddf39238cfaf1a30b83027a58beaea9fbb1735273720a38

The four approved images in audits/MIDGAME_ART_DIRECTION_20260908 define the
art direction: 01-discovery-atlas.png, 02-inhabited-worlds.png,
03-earth-full-landfall.png and 04-alien-full-landfall.png. The existing atlas
and triptych above are the production reference locks; do not paint new locks.
Verify their original bytes against these SHA-256 values before use.
The local model's current riverbank output is a gap to close, not a reference.
```

## 2. Frozen style

```text
Paste this paragraph verbatim in every prompt. Approved by Nick at 6f5c396e.
Changes to the paragraph require a new kit version; never revise it at send time.

  Rich natural-history fantasy painting, one hand across every subject,
  tactile directional brushwork, believable connected anatomy, weathered rock,
  individual but grouped foliage, deep atmospheric layers, readable silhouettes,
  selective high detail, soft natural light shared by every subject, honest
  ground and water contact, subtle foreground occlusion, premium painted
  science-fiction with discovery and character; Earth species keep real
  anatomy, fur, feather and botany; alien life keeps its data-driven form and
  palette in the same hand; not plastic CGI, not photography, not cartoon,
  not oversharpened, no glowing outlines.

The scene-contact and occlusion language governs composed scenes. A cut-out
retains the same hand and anatomy while obeying its no-ground/no-shadow layout;
contact and shared atmosphere are resolved when composed and finished on a plate.
The companion rule in section 4E is retained for companion-flagged game data;
it does not change counts or the underlying genome.
```

## 3. The one universe

```text
The game data decides the subject and its palette. Star light falls across
that subject in the same painted hand. This table interprets existing data;
it never changes a seed, star kind, colour gene, body plan or biome.

THE STAR TABLE (exactly the thirteen starClass.kind keys)
Source: port/v2/packages/domain/starcatalog/src/index.ts, starClass and KIND_DESC.
Hex colours below are source values, not new generation colours. Pigment/light
words describe their painted rendition; radius and surface behaviour come from
the actual class data. A dark body is not made luminous by a pigment label.

  BD     #c98a6a  brown dwarf. Pigment: muted copper-brown, dusty sienna.
         Light: low warm copper, subdued contrast.
  M      #ff9a6a  red dwarf. Pigment: pale vermilion, warm salmon-orange.
         Light: warm red-orange, dim relative to the brighter star kinds.
  K      #ffd9a0  orange dwarf. Pigment: pale ochre, warm cream-gold.
         Light: soft golden-orange, warm diffuse fill.
  G      #fff4d8  yellow sun-like star; Sol pinned. Pigment: ivory, warm white.
         Light: near-neutral yellow-white, natural diffuse fill.
  A      #e8efff  hot white star. Pigment: pearl white with a faint blue cast.
         Light: cool white, pale blue fill.
  B      #9ab8ff  blue giant. Pigment: pale cobalt-blue, cool white.
         Light: blue-white, cool blue fill.
  PROTO  #ff9a5a  protostar in a dusty disk. Pigment: warm orange, ochre.
         Light: warm orange filtered by the source-described dusty disk.
  RG     #ff8a4a  swollen red giant. Pigment: orange-red, warm vermilion.
         Light: broad warm orange-red source.
  SG     #ff7a50  red supergiant. Pigment: coral-red, orange vermilion.
         Light: broad coral-red source, scale from its larger source radius.
  WD     #eef4ff  white dwarf. Pigment: chalk white with a faint ice-blue cast.
         Light: compact cool-white source.
  NS     #dceaff  neutron star. Pigment: pale ice blue, cool white.
         Light: compact blue-white source; source-described radiation beams
         are painted structure, not glowing outlines on organisms.
  MAG    #cfe0ff  magnetar. Pigment: pale blue, cool pearl white.
         Light: compact cool blue-white source; magnetic structure is painted
         with readable edges, not a second invented sun.
  BH     #9a86c8  stellar-mass black hole. Pigment: muted blue-violet, slate.
         Light: only surrounding source-described accreting matter emits;
         the central body stays dark. Apply the key rule at compile time.

BINARY AND TRINARY ARE LIGHT MODIFIERS, NOT STAR KINDS.
Read sys.binary and sys.trinary from worldgen; preserve the actual primary.
The binary companion colour is #ff9a6a or #ffd9a0, the third is #ff9a6a.
Compile their pigment through the same colour vocabulary, using their stored
radii and geometry for relative scale and light placement. Two sources yield
two shadows of two colours; three sources retain three directions, with
relative intensity carried by the data-derived composition. Never insert a
white dwarf or change the primary to fit a template. Nursery births and
remnants likewise retain the source's exact kinds and counts.

KEY RULE: reserve magenta, hot pink and violet-pink for the cut-out key.
Apply the exclusion only when compiling painted pigment words: map a seeded
hue in the reserved band to the nearest permitted pigment word for rendering.
Star colour hexes, genome values, names and identity remain unchanged. This
rule applies to painted star light, flora pigment, bioluminescence and hull
colour; it does not rewrite the game's palette or rarity colours.

THE SYSTEM CARD (compiler output schema; never a hand-filled example)

  SYSTEM CARD - <source system identity/name>
    Star: <starClass.kind, KIND_DESC and source colour via the table above>
    Light: <star and companion data, vista day/twilight/night, atmosphere;
       composition direction, softness and shadow colour derived from inputs>
    Mineral palette: <planet type plus hue, seaHue, landHue and ice genes>
    Atmosphere: <vista palette, climate and weather data>
    Flora pigment: <biome flora/form routing plus species colour/finish genes>
    Fauna adaptation: <biome fauna family/realm routing and actual genome
       body plan, skin, eyes, pattern and colour; never invented anatomy>
    One signature: <source biome hazard expressed as a visible physical fact>

Star and planet owners: packages/domain/starcatalog, worldgen and planetgen.
Vista owner: apps/game/src/biome-vista-surface.ts. Biome owner:
packages/domain/biome-profile; species/genome/descriptor and art-routing owners
supply organism form and palette. All paths are under port/v2. The day flag
is seeded input, never a wall-clock read. Missing source fields are reported,
not filled with an invented system or an invented class.

For space-only prompts, compile only Light and One signature from the actual
cosmic object's source data; do not invent planet or biome data for it.
The same admitted inputs produce the same card. A changed planet/vista gets
its own derived context while keeping system/star identity. Every subject in
one scene shares this context, so it sits on its own planet's biome plate.

LIVE VOCABULARY: use GAME_VOCABULARY_COVERAGE.md in
audits/CLAUDE_FULL_REVIEW_20260910/ as the source map.
Active planet types are gas, rocky, desert, ice, terran, ocean, venus and lava.
Use the 43 live biome keys, actual creature family/realm routing, flora/fungi/
microbe forms and named Earth species. Design-only biome packs are not rows.
Every queued subject must resolve to a current source key; class layouts and
size allowances below do not create catalogued objects. People are not active.
No new star, organism, ship, item, ability or rarity class is invented here.
```

## 4A. Universe (scene)

```text
WHAT: nebulae, star fields, the galactic band, distant clusters, debris fields,
wrecks adrift: the backdrop a player sees while travelling. Full-bleed scenes,
never cut-outs.

SUBJECT SLOT, in this order:
  the one dominant form (a nebula wall, a dust lane, a shattered moon belt);
  its colour named by pigment, never by glow ("deep alizarin and violet dust,
  cold bone-white core"); the scale cue that makes it read as vast (a
  silhouetted rock, a ship, a moon at the edge, tiny and dark); the depth
  layers, near to far; the single brightest point and where it sits.

LAYOUT (paste):
  A full-bleed painted deep-space vista, no subject isolated and no cut-out.
  Wide cinematic composition with a clear focal point off-centre, three
  readable depth layers from near silhouette to far field, and one light
  source that governs the whole image. Horizon-free. Painted values, with the
  darkest darks still holding detail.

NEGATIVE ADDITIONS:
  No photographic star field, no telescope-photograph look, no HDR bloom, no
  lens flare, no chromatic aberration, no anamorphic streaks, no perfectly
  circular bokeh stars, no Earth constellations, no planet surface, no
  characters, no ships unless named, no text or UI.

OUTPUT: scene block (section 5), 2560 x 1440.
```

## 4B. Stars (scene)

```text
WHAT: a system's sun seen close: in the sky, as a binary pair, as a dying
ember, with an accretion disc. Also the authority for the light in every other
image of that system.

SUBJECT SLOT, in this order:
  the star table row and its pigment words; the surface behaviour
  (granulation, plumes, spots, arcs); the corona painted as structured shape,
  not haze; anything around it (disc, ring, companion, silhouetted planet);
  what the light does to the frame edges.

LAYOUT (paste):
  A full-bleed painted star, centred or thirds-placed, occupying no more than
  half the frame so its scale reads. Structure visible in the surface and the
  corona, both painted as shapes with edges rather than as blur. One
  silhouetted foreground element for scale. No planet surface, no horizon.

NEGATIVE ADDITIONS:
  No lens flare, no starburst spikes, no volumetric god rays, no bloom, no
  photographic solar imagery, no fire-texture overlay, no smooth airbrushed
  gradient, no white-hot blown-out core without structure, no text or UI.

OUTPUT: scene block, 2560 x 1440.
The colour painted here IS the Light line of the system card. Every other image
in the system inherits it.
```

## 4C. Planets (orbital cut-out, biome scene)

```text
WHAT (i) ORBITAL: the world as a body, seen on approach and in the system map.
WHAT (ii) BIOME: the surface, the painted environment a player explores.

ORBITAL - SUBJECT SLOT, in this order:
  body type and size; the surface pattern read from orbit (bands, seas,
  craters, ice caps, dust storms, night-side lights); the mineral colours from
  the system card; cloud behaviour; rings or moons; the terminator, and which
  limb the star lights.

ORBITAL - ACCURACY (paste and fill):
  Anatomy/count constraints: <moons, rings, bands: every count stated twice>.
  Must include: the whole disc; a lit limb and a night limb.
  Must exclude: ground; scenery; text; a ship; a second body unless named.
  Scale relationship: <a body of this class against the frame>.

ORBITAL - LAYOUT (paste):
  One isolated planet, centred, rendered as a sphere with a clearly lit limb
  and a soft terminator inside the disc, lit from <direction> by the system's
  star. The night-side limb is still a crisp opaque edge against the
  background; only the terminator inside the disc is soft. Surface pattern
  readable at small size. No ship, no character, no UI, no orbital furniture
  unless named.

ORBITAL - OUTPUT: cut-out block, 1024 square.

BIOME - SUBJECT SLOT, in this order:
  the landform that defines it; ground material by colour and sheen; this
  system's flora in the mid-ground, named from the card; the atmosphere tint
  and how far it washes out distance; weather in motion; one point of scale
  (a lone figure, a wreck, a stand of growth) small and silhouetted; the sun's
  position and the shadow direction it forces.

BIOME - LAYOUT (paste):
  A full-bleed painted landscape of the planet surface, wide composition,
  three depth layers, a low horizon giving the sky two thirds unless the brief
  says otherwise, and one light source consistent with the system card. Every
  shadow falls the same way. Painted atmospheric perspective, cooling and
  washing out with distance. Leave the lower third quiet enough that cut-out
  flora, landmarks and creatures can be composited onto it.

BIOME - OUTPUT: scene block, 2560 x 1440.
  For a scrolling or parallax scene, paint three separate plates for the same
  biome (far, mid, near), each at the full 2560 x 1440 with its own brief,
  never one plate sliced.

NEGATIVE ADDITIONS (both profiles):
  No Earth continents or recognisable Earth geography unless the source names
  Earth, no blue sky with white cumulus unless named, no photographic satellite
  imagery, no
  visible tiling or repeated texture, no UI, no waypoint markers, no text, no
  characters other than the one scale figure if named.
```

## 4D. Flora (cut-out)

```text
WHAT: source-owned flora, fungi and microbe forms, and named Earth botany:
stalks, canopies, fungal towers, mineral corals, drifting seed forms. Painted
as cut-outs for gameplay and for
compositing onto biome plates.

SUBJECT SLOT, in this order:
  the growth plan stated as a count ("five stalks, three tall and two short");
  scale against a human; the pigment from the system card's flora line, named
  as a paint colour, never as "alien colours"; the surface by colour and sheen
  ("waxy blue-black membrane", "matte chalk-white mineral crust"); how it
  anchors to the ground; what it does when disturbed, if that shows; any
  bioluminescence, painted as a solid crisp-edged shape, never a soft bloom;
  "NOT a <Earth plant>" only for a drift already seen.

ACCURACY (paste and fill):
  Anatomy/count constraints: <stalks, fronds, caps, pods: every count twice>.
  Must include: the complete growth from base to crown; its anchoring base.
  Must exclude: ground; floor plane; cast shadow; soil mound; pot; scenery;
  text; a second specimen; an insect or animal.
  Scale relationship: <against a human>.

LAYOUT (paste):
  One isolated plant or growth, centred, full height, weighty and readable,
  shown in three-quarter view with its anchoring base visible. Entire form in
  frame. No floor plane, no soil mound, no pot, no companion plant.
  Framing target: 78 percent. Safe margin: at least 10 percent on every side.

NEGATIVE ADDITIONS:
  No flower-shop bouquet forms,
  no potted plant, no soil clump, no insect visitors, no second specimen, no
  gardening context, no glow used as an effect rather than painted as shape.

OUTPUT: cut-out block, 1024 square; a canopy-scale growth that fills the
battle screen, 1536 square.
```

## 4E. Fauna (cut-out)

```text
WHAT: every animal, companion, hostile and planetary guardian. The most
error-prone class, so its brief is the strictest.

SUBJECT SLOT, in this order:
  body plan and size against a human; the limb and head counts, each stated
  twice ("six legs, three on the near flank and three on the far"); materials
  by colour and sheen (fur, feather, chitin, membrane, hide, mineral plate),
  with the colour from the system card's fauna line; how it moves and what that does to its
  build; its natural weapons, named as anatomy and matched to what it actually
  does in combat; any gear, harness or growth it carries, or "no armour, no
  harness" outright, because a tough creature is otherwise painted in steel;
  bioluminescence painted as solid crisp-edged shape; and the face last, part
  by part (eye size and number, brow, jaw, mouth) with a named expression,
  because anatomy and gear alone paint a placid face. "NOT a <x>" only for a
  drift already seen.

ACCURACY (paste and fill):
  Anatomy/count constraints: <every count, twice>.
  Must include: the complete creature from head to tail or feet; every limb
  described.
  Must exclude: ground; floor plane; cast shadow; base; scenery; text; a second
  creature; a companion unless described; extra or missing limbs; top-down view.
  Scale relationship: <man-sized / towering over a human / a fraction of human
  height>.

LAYOUT, TOKEN POSE (paste; the gameplay image):
  One isolated standing full-body creature, centred, weighty and readable,
  shown front-to-three-quarter in a clear action-ready pose. Entire anatomy
  and any carried equipment visible. No floor plane.
  Default facing: south/front with slight three-quarter turn.
  Framing target: 80 percent. Safe margin: at least 8 percent on every side.

LAYOUT, TURNAROUND (paste; the animator's image, generated only after the
token pose is approved, from the same brief):
  The same creature three times in one row on the same baseline: front view,
  true side view facing left, back view. Neutral standing pose, limbs
  separated and not overlapping the body, mouth closed, no motion. Identical
  scale in all three. No labels, no arrows, no numbers.
  Output: a 2:1 image, 2048 x 1024, on the key colour.
  Add to the negative: no action pose, no overlapping limbs, no three-quarter
  view, no fourth figure.

THE COMPANION RULE (only for companion-flagged game data):
  A creature flagged as a companion in its data adds one line to its brief:
  "built to be kept: rounder mass, a larger eye, a readable and friendly
  expression, still painted with the same weight and material truth as every
  other creature, never a mascot, never chibi." Hostiles and guardians never
  carry that line. Both come off the same sheet in the same hand.

THE GUARDIAN RULE:
  Applies to source-owned apex guardians (raw grades 12 to 14), not a new
  display rarity; all three display as Transcendent.
  A planetary guardian is painted at 1536 square, fills the battle screen, and
  carries the system's One signature on its body (the black glass, the ring
  shadow, the mineral shards). Its focal detail is more ornate than any other
  creature in the system, and its face is named part by part with a temper
  the player should fear.

THE MORPH RULE (breeding and variants):
  A colour morph is the parent's brief with ONLY the colour and pattern lines
  changed, and this sentence added: "identical to <parent> in body plan,
  counts, pose and gear; only the colouring differs." Never redescribe the
  body. A morph's turnaround is not regenerated; the parent's stands.

NEGATIVE ADDITIONS:
  No default bipedal humanoid stance unless named, no armour plating the brief did
  not ask for, no human eyes, no weapons held in hands unless named, no rider,
  no second creature.
  Do not add a blanket oversized-head ban that would fight a data-owned
  companion brief.

OUTPUT: cut-out block, 1024 square; guardians 1536 square. A big creature
shipped small goes visibly soft on screen.
```

## 4F. People (cut-out)

```text
STATUS: NOT APPLICABLE until the game has people. No people rows may be
queued or painted. The layout below is retained as an inactive template, not
a claim that the current generator produces people.

SUBJECT SLOT, in this order:
  species and build; "one head, two arms, two hands, two legs" or the alien
  counts stated twice; skin or carapace by colour and sheen; the suit or dress
  by material ("scored cream ceramic plates over woven grey fibre, patinated
  green alloy fittings"), with visible field repair; carried tools and what
  hand holds what; the face last, part by part, with a named expression that
  fits the role (a trader's appraising squint, a guardian-priest's serenity).

ACCURACY: as fauna, with "footwear" and "all carried equipment" in Must include.

LAYOUT: the fauna TOKEN POSE, unchanged. A person who needs a portrait for
dialogue is cropped from the approved full-body master, never painted twice.

NEGATIVE ADDITIONS:
  No helmet hiding the face unless named, no glowing visor, no chrome
  spacesuit, no rifle unless named, no modern Earth clothing, no logo, no
  second person, no weapon merged into a hand.

OUTPUT: cut-out block, 1024 square.
```

## 4G. Ships (cut-out)

```text
WHAT: the player's four source-owned ship stages: Scout, Jump, Survey Cruiser,
Frontier (apps/game/src/shipyard-preview.ts). Other size/layout allowances
are inactive unless a matching current source record exists; do not invent
a ship class to exercise a template.

SUBJECT SLOT, in this order:
  hull class and size against a human (a figure is not painted; the scale is
  stated); the silhouette in one sentence; hull material by colour and sheen
  with wear ("sun-scoured cream ceramic, scored, with rust-red patch plates
  and cord-lashed cargo"); the drive, painted as structure and not as flame;
  what makes it this ship and not another (the One signature of its origin
  system if alien); the direction it faces.

ACCURACY:
  Anatomy/count constraints: <engines, wings, pods, hatches: counts twice>.
  Must include: the complete hull; both ends; landing gear or its absence.
  Must exclude: ground; scenery; text; a pilot; a second ship; motion lines;
  exhaust plume; a planet behind it.
  Scale relationship: <stated against a human>.

LAYOUT (paste):
  One isolated vessel, centred, shown in a three-quarter view from slightly
  above, nose to the lower left, entire hull in frame with every functional
  part readable. No background, no floor plane, no exhaust, no motion.
  Framing target: 76 percent. Safe margin: at least 10 percent on every side.

NEGATIVE ADDITIONS:
  No glossy chrome, no clean factory finish, no glowing engine flame, no
  neon light strips, no film-franchise silhouette, no text or insignia
  unless named, no cockpit interior.

OUTPUT: cut-out block, 1024 square; a capital or guardian vessel 1536 square.
```

## 4H. Landmarks and props (cut-out)

```text
WHAT: the things placed on a biome plate: ruins, outposts, resource nodes,
guardian lairs, wrecks on the ground, crystal outcrops, nests. This is how a
procedurally generated world gets its furniture without repainting the plate.

SUBJECT SLOT, in this order:
  the object and its size against a human; its material by colour and sheen
  from the system's mineral palette; its state (intact, half-buried,
  collapsed); what it is for and how a player reads that at a glance; its
  contact with the ground, painted as its own base, never as a floor plane.

ACCURACY: as flora. Must include: the whole object and its ground contact.

LAYOUT (paste):
  One isolated landmark or prop, centred, shown in three-quarter view from
  slightly above so it sits correctly on a painted ground, its own footprint
  visible. Entire object in frame. No surrounding terrain, no sky, no figure.
  Framing target: 78 percent. Safe margin: at least 10 percent on every side.

NEGATIVE ADDITIONS:
  No terrain beyond the object's own footprint, no sky, no horizon, no
  character, no creature, no signage, no UI marker, no second object.

OUTPUT: cut-out block, 1024 square; a landmark that fills the battle screen,
1536 square.
```

## 4I. Items, loot and resources (cut-out)

```text
WHAT: everything a player picks up: raw resources, crafted parts, tools,
weapons, salvage, artefacts, eggs.

SUBJECT SLOT, in this order:
  the object in plain words (name the object, never the idea: "a hand-sized
  hexagonal cell of pale green crystal in a scored copper cage", never
  "energy"); material by colour and sheen; wear and repair; the one feature
  that identifies it at icon size; its rarity by material and ornament (see
  the rarity rule), never by a glow.

ACCURACY:
  Anatomy/count constraints: <parts: counts twice where they matter>.
  Must include: the complete object; both ends of any haft or blade; its
  material.
  Must exclude: ground; floor plane; cast shadow; base; scenery; text; a
  person; hands; a display stand; a duplicate of the object.
  Scale relationship: proportioned as the real object; no exaggerated scale.

LAYOUT (paste):
  One isolated item only, centred on a diagonal or clean profile, fully
  visible with no hand, wearer, display stand, pile or companion item.
  Materials and functional geometry are unambiguous.
  Default facing: diagonal, lower left to upper right.
  Framing target: 74 percent. Safe margin: at least 12 percent on every side.

THE RARITY RULE:
  Source: RARITY_V17 and displayRarity in
  port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js.
  Ten display tiers map in adjacent pairs onto five material treatments:
    0 Common       / 1 Uncommon     plain working material, scuffed, no ornament
    2 Notable      / 3 Rare         one deliberate fitting in a second material
    4 Exotic       / 5 Legendary    worked surface, engraved or inlaid,
                                   one contrasting stone
    6 Mythic       / 7 Celestial    precious material as the body (the system's
                                   crystal, a blue-hued exotic wood, patinated
                                   gold), ornament on every edge
    8 Primordial   / 9 Transcendent a relic: a material that exists nowhere else
                                   in the system, and the system's One
                                   signature worked into it
  These are material treatments, not new rarity tiers. Raw grades 10 to 14
  retain their identity and display as Transcendent via the existing clamp.
  Source rarity hexes belong to the interface, never to a ring painted into
  the object. Organism anatomy and colours remain data-owned.
  No glow, no aura, no coloured rim on the object for rarity. The interface
  does that.

NEGATIVE ADDITIONS:
  No hand, no wearer, no pile, no stand, no glow or aura, no rarity colour
  ring, no floating, no sparkle, no text.

OUTPUT: cut-out block, 512 square.
```

## 4J. Emblems: upgrades, abilities, status (cut-out)

```text
WHAT: non-physical things that need an icon: ship and suit upgrades, creature
abilities, battle moves, status effects, scanner results, achievements.

SUBJECT SLOT, in this order:
  the concept as ONE period-correct object or contained effect ("a coil of
  copper wire around a cracked cell", "a fist of black chitin", "frost as a
  solid crisp-edged shape on a fist-sized stone"), never the abstract word;
  its material by colour and sheen; its single readable silhouette; for a
  status effect, the effect as an object, not on a body.
  Emblems for one family (all fire moves, all shield upgrades) share one
  object family and differ in one named part, so they read as a set.

ACCURACY:
  Must include: one readable emblem that identifies the concept at icon size.
  Must exclude: ground; floor plane; cast shadow; base; scenery; text; a
  person; hands; a scene; lettering or runes that spell real words.

LAYOUT (paste):
  One isolated item-icon-style emblem or contained effect representing the
  named non-physical concept, centred, wordless, painted as a solid object
  with a crisp edge.
  Framing target: 74 percent. Safe margin: at least 12 percent on every side.

NEGATIVE ADDITIONS:
  No lettering, no numerals, no arrows, no flat vector style, no UI glyph
  look, no glow used as the icon, no person, no hands, no scene.

OUTPUT: cut-out block, 512 square; status and condition icons 256 square.
```

## 5. Technical output

```text
ONE SIZE PER CLASS. A browser game scales at draw time, so each asset is one
file at one size, and the game shrinks it for thumbnails and grids. The rule
behind the numbers: ship at twice the largest size the asset is drawn on
screen, so it stays sharp on high-density displays. Generate at this size,
keep that file as the master, ship it as WebP.

  fauna, people, flora, props, ships ........ 1024 square
  guardians, capital ships, screen-filling
     landmarks and canopies ................. 1536 square
  orbital planets ........................... 1024 square
  items, loot, emblems ...................... 512 square
  status and condition icons ................ 256 square
  fauna turnaround (animators only) ......... 2048 x 1024
  universe, stars, biome plates, parallax
     layers ................................. 2560 x 1440

  A transparent creature WebP lands near 150 KB and a biome plate near 600 KB.

WHAT THE MAGENTA IS. It is a keying background, the same idea as a green
screen: the painter puts the subject on a flat magenta field, and a script
removes every magenta pixel to leave transparency. Magenta never appears in a
finished asset, and nothing the player sees is pink. It was chosen because it
is the colour least present in painted natural subjects, and the star table's
key rule keeps it out of this universe's palette entirely, so the keyer never
removes part of a subject by mistake.

THE DECISION: the key stays, even for a generator that claims transparency.
Asked for transparency, generators paint checkerboards into the pixels or
leave soft halos, and neither can be measured. Keyed magenta is deterministic
and the result is checked by reading the file. The token library's keyer and
its gate script are reused as they are. The one exception is an API model that
demonstrably emits a true alpha channel: test ten images, check every file for
a baked checkerboard and for a halo, and switch only if all ten are clean.

CUT-OUT BLOCK (paste for orbital planets, flora, fauna, people, ships,
landmarks, items, emblems; put the class's size in place of 1024 where the
table says 1536, 512 or 256):
  Create a square 1024 x 1024 PNG. Every pixel that is not the subject is one
  flat, uniform, pure magenta fill (#FF00FF): no gradient, vignette, texture,
  noise, checkerboard or transparency pattern, and no ground, base, frame,
  scenery or cast shadow. The subject's outline is crisp and fully opaque
  against the magenta, with no glow, haze, smoke or soft feathering bleeding
  into it, and nothing on the subject is magenta or pink. The magenta is keyed
  out afterwards to produce the transparent asset.

SCENE BLOCK (paste for universe, stars, planet biomes):
  Create a 2560 x 1440 painted image, full-bleed to all four edges, opaque,
  with no transparency, no border, no frame and no margin. Do not repaint or
  crop during export.

Glow is painted as shape in both kinds, or the cut-out eats the creature's
edge and the scene goes muddy.
```

## 6. Shared negative

```text
Paste in every prompt, then add the class's NEGATIVE ADDITIONS.

  No text, letters, numbers, watermark, signature, border, frame, grid, UI
  element, health bar, minimap, waypoint, token ring, base, pedestal,
  photorealism, anime, chibi styling, cel shading, 3D render, plastic toy
  sheen, airbrushed gradients, duplicate subject, unintended companion, extra
  limbs, missing limbs, malformed hands, cropped anatomy, or contact-sheet
  layout. No lens flare, no chromatic aberration, no holographic UI
  projections, no glowing outlines or rim light used as an effect.

  For CUT-OUT classes, add:
  No scenery, no floor plane, no cast shadow, no drop shadow, no white
  background, no checkered background, no baked transparency pattern.
  Background must be one flat uniform magenta fill and nothing else.

  For SCENE classes, do not add those clauses. They will fight the scene.
```

## 7. Writing a subject line

```text
The eight rules, each one bought with a re-roll on the fantasy library.

  1. Name the object, never the idea. "Time" paints a pocket watch. A ban does
     not paint; a named object does.
  2. Name every material by colour and sheen. "No metal" produces grey steel.
     "Matte cream chitin" and "glossy black obsidian" do not.
  3. Say what it is NOT only after you have seen the drift: "NOT a lizard",
     "no eyestalks". Saying it early primes the very thing you banned.
  4. State every count twice: "six legs, three near and three far".
  5. Name the face part by part and give it an expression. Anatomy alone
     paints a placid face.
  6. Name the colour and the body plan. Nothing is left to the painter; the
     anchor's own palette will tint whatever you leave open.
  7. A fallback phrase must fit every body it can reach. "Ears up" gave a
     flying snake ears.
  8. Paint glow as a shape with an edge. Soft bloom does not survive a cut-out
     and muddies a scene.

  And one for this universe: every colour in a brief traces back to the system
  card. If you cannot say which line of the card a colour came from, it does
  not belong in the brief.
```

## 8. Production discipline

```text
What keeps a library of thousands from drifting. Each of these is a rule the
fantasy library learned by losing a day.

  ONE INTERPRETER. Prompts are generated from game data by one tool and sent
  verbatim. Nobody rewords at send time. A brief is fixed in the generator,
  and the changed set of prompts is checked to be exactly the rows intended.
  HASH EVERY PROMPT. Store the SHA-256 of the exact text sent with the image
  it produced. A prompt that cannot be reproduced is not a prompt.
  KEEP EVERY CAPTURE. The untouched generator output, magenta and all, is
  archived before anything is keyed or converted. A better keyer then
  re-applies to the whole library for free.
  NEVER OVERWRITE AN APPROVED IMAGE. Retire it under its date and reason;
  filenames never carry a version number, so the game picks up a revision
  without rewiring.
  FILENAMES ARE THE WIRING. The game resolves art by a path derived from the
  document key (creature.ember-strider -> fauna/ember-strider.webp). Drop a
  file, the entry upgrades. No manifest to maintain.
  REVIEW EVERYTHING, NEVER A SAMPLE. Lay every master out on labelled contact
  sheets in generation order and look at every one. Judge: right subject,
  right counts, one isolated figure, the house hand, no bleed. When one is
  wrong, fix the class it belongs to, not just the row.
  PIXELS ARE THE ARBITER. An image viewer misleads on faint pink and green. An
  automated intake check reads the file: real alpha, no halo, square, right
  size, framed inside the margin, filename matches a row.
  REFUSALS. A refusal at output is random: retry once. A refusal at input is
  deterministic: change the brief. A row refused twice on a corrected brief
  is dropped and noted.
  REVISION. A polish (image-to-image from the approved capture) lands two or
  three targeted asks and drifts elsewhere. Once the brief text itself
  changes, generate fresh.
  SETTINGS NEVER MIX. If the game ever gets a second visual world (a
  different galaxy, a dream realm), it is a second collection with its own
  anchor, references, queue and sessions. Nothing is reused across them.
```

## 9. Engine proof before library rollout

```text
  a. Nick approved v4 at 6f5c396e, subject to this engine-first order. Use the
     existing Discovery Atlas and Living Worlds locks in section 1. No v3
     painting and no replacement style locks. Keep the 4E turnaround unchanged.
  b. Paint only the first engine painting's inputs: the Earth temperate biome
     plate; six Earth cut-outs (Civet, Platypus, Frog, Persimmon, Cranberry,
     Devil's Club); five family references (mammal quadruped, bird, fish,
     insect, reptile). Show Nick the sheets of these twelve individual masters.
  c. On the first cut-out batch, inspect every image for frames or dark plate
     backgrounds inherited from the Discovery Atlas. If any appear, propose
     a one-sentence v4.1 addition to the cut-out block and STOP for Nick's
     approval. Do not apply that addition or repaint before approval.
  d. The one compiler fills every card and subject slot from actual game data.
     No hand-typed card, invented class or design-only biome row. Attach the
     atlas to cut-outs and the triptych to scenes, never both in one session.
     Use complete applicable class blocks and preserve exact prompt hashes,
     untouched captures, layouts, sizes and keying rules. Review every master.
  e. Immediately after the bounded first inputs, build the local AI pipeline:
     one interpreter in landfall-conditioning.ts; offline pre-fit/hash of the
     six Earth cut-outs and biome anchor; unfreeze steps, seed and size;
     per-organism passes composed on the plate and one low-strength finisher
     in stage-worker.mjs. Keep sessions warm across landings and build the VAE
     encoder once. In-worker expansion replaces OPFS variant storage. Show
     the first measured native painting beside the Living Worlds triptych
     with a bounding box and identity finding for every organism. No six-reference scene-generator prompt sweep.
  f. After Nick accepts the first engine painting, complete the Animation and
     battle track in CODEX_HANDOFF.md before the remaining library rollout.
     A v4.1 Effects cut-out class is a proposal requiring Nick's approval
     before painting any effect. No effect class is activated by this section.
  g. Only after engine-painting acceptance and the animation proof, roll out
     remaining families, forms and biome plates twelve images at a time,
     showing every sheet. Exact source keys decide rows, not count estimates.
```
