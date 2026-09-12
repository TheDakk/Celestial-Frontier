# What the game generates, and what the art kit must cover

Date: 2026-09-12. Source-derived inventory of the openai/mac working tree (read-only). Every row cites the generating code; the docs were used only to find it. Paths are under `port/v2/`: D = `packages/domain/*/src`, A = `packages/art/src`, G = `apps/game/src`.

Purpose: Art Kit version 4 must be a closed vocabulary over the game's real data, not an invented one. This document is that vocabulary, split into what is finite (paintable as a library) and what is infinite (painted on demand from data through the painter-and-finisher pipeline).

## 1. Stars and cosmic objects (finite; kit classes 4A, 4B)

| Item | Vocabulary | Owner |
|---|---|---|
| Star kinds, 13 | BD brown dwarf, M red dwarf, K orange, G yellow-white (Sol pinned), A white, B blue giant, PROTO protostar with disk, RG red giant, SG red supergiant, WD white dwarf, NS neutron star, MAG magnetar, BH black hole; each with a colour hex and radius | D/starcatalog/index.ts:11-28, prose :30-42 |
| Companions | binary in 24% of M/K/G/A/B systems, trinary in 22% of those | D/worldgen:258-261 |
| Supernova sites | 1 to 3 per galaxy per epoch: neutron star, gas shell or black hole remnant plus newborn protostars | D/worldgen:111-134 |
| Galaxy-cell objects, 9 | H-II region, nebula, molecular cloud, open cluster, planetary nebula, remnant, rogue planet, free brown dwarf, globular | D/worldgen:195-222 |
| Galaxies | 5 morphologies, merging pairs with bridge, satellite dwarfs, quasar and blazar, radio galaxy, wormhole in 6% | A/galaxyart:15-25; D/worldgen:36-103 |
| System objects | belt, comets, kuiper, dwarf planets, interstellar visitor; Sol has Ceres, Pluto, belt, kuiper, comet | D/worldgen:245-307 |

**Kit consequence.** The star table is replaced by these thirteen rows, keyed by `starClass.kind`, with binary and trinary as modifiers of the Light line ("two shadows of two colours"). Pigment and light words derive from the class colour hex and the KIND_DESC prose. The kit's six-row table covered only five of the thirteen.

## 2. Planets (8 finite types over an infinite instance space; kit class 4C)

Types and odds: gas 30, rocky 15, desert 15, ice 12, terran 10, ocean 8, venus 5, lava 5 (D/planetgen:12-21). Rings 16% (gas 35%), moons up to 16. Hue, size, sea and land hue, ice amount are continuous genes (:23-36), so each planet instance is unique. Climate bands hot, temperate, cold, frozen (D/surveyphrases:59-71). Landfall vista: day 62% / twilight 20% / night 18%; weather rain, snow, dust, ash, haze or none; water liquid, frozen or none; eleven vista palettes; scenes generic, gas, abyss, reef; nine weather events (G/biome-vista-surface.ts:95-228; A/biomevista-full.worker:52). Sol's eight planets are pinned (D/starcatalog:45-54).

**Kit consequence.** Orbital cut-outs are on demand per instance (the type gives the template, the genes give the colours). The system card's Mineral palette line derives from planet type plus hue genes; Atmosphere from the vista palette and weather; the day/twilight/night flag is an input, never a wall-clock read.

## 3. Biomes (43 finite live profiles; kit class 4C biome plates)

Keys, families, hazards and weathers: D/biome-profile/index.ts:8-18, :59-79, :144-186. Selection by planet type and climate band with rarity: D/strays:49-121. Earth seed 133 is never relabelled.

| Planet type | Live biomes |
|---|---|
| terran, 11 | temperate, savanna, jungle, marsh, swamp, mangrove, tundra, karst, saltflat, fungal (rare), crystalsteppe (rare) |
| ocean, 7 | opensea, archipelago, coral, stormsea, volcisle, abyssal, milksea (rare) |
| ice, 4 | glacier, packice, cryogeyser, blueice (rare) |
| desert, 5 | dunesea, canyon, saltpan, oxide, glass (rare) |
| rocky, 5 | cratered, boulder, graben, geode (rare), carbon (rare) |
| venus, 3 | sulfurdeck, acidhaze, abyssgreen |
| lava, 4 | ashwaste, emberfield, obsidian, magmasea |
| gas, 4 | banded, ammonia, stormeye, hotglow (rare) |

Each biome names its fauna rig families (from 14) and flora forms (from 11), a hazard (from 25) and a weather (from 29). The BIOME_ATLAS sections 2 and 3 (93 Earth and 315 non-Earth entries) are design packs not yet in the generator; they need no art until they land.

**Kit consequence.** One canonical biome plate per live biome (43) in the library, each painted from a system card of its most common star kind, is the finite scene anchor set. Per-planet variation (hue genes, time of day, weather) is applied on demand through the finisher, not by painting hundreds of plates. The fungal concept image already is the `fungal` biome plate in spirit: insect, gastropod, amphibian; moss and fern.

## 4. Creatures (14 families finite; instances infinite; kit class 4E)

Genes (D/speciestraits:193-219): 16 body plans, 18 locomotions, 10 heads, limb counts 2/4/6/8/3/0, eye counts 2/4/6/8/1/0, 9 skins, 7 tails, 8 patterns, 6 sizes, 17 colours plus accent, 28% luminous; finish ladder matte, sheen, iridescent, prismatic by tier (D/strays:164-168); 16 realms including Land, Aquatic, Aerial, Amphibious, Subterranean, Gas-Giant, Megafauna (D/genome:48-55). About 3 × 10⁸ distinct silhouettes; bred and hybrid genomes are unbounded.

Painter routing (A/proceduraloverrides.ts:85-238): swimmers to the fish painter (aquatic); gliders with membranous bodies to the bird painter (flying); serpentine to snake, many-segmented to myriapod, shelled to turtle, four-winged to insect (flying), radial to radial; the remaining bodies to the quadruped painter with alien traits (leg pairs 2/3/4, eye styles, skins, tendrils, sails, armour, horns, coats). Earth names route through fifteen rig families (mammal with nine sub-builds, bird, reptile, amphibian, insect, arachnid, fish, marine, crust, ceph, jelly, sessile, gastropod, bat, primate; A/hdart:69-140). Apex guardians on 2.5% of fauna worlds, tiers 12 to 14, sixteen epithets (D/genome:225-238). Fifty fixed Paragons (D/acquisition/paragon-internal.ts:7-36).

**Kit consequence.** Creatures are the infinite class. The finite library is one family reference per rig family and realm (about 25 plates: each family in land, flying or aquatic form as the routing dictates) painted in the frozen style, used as the conditioning reference for that family. Every instance is then painter-composed and model-finished. The kit's fauna brief (counts stated twice, materials by colour and sheen, face last) is generated by the compiler from the genes: body plan, limb count, head, skin, tail, pattern, size, colour, finish, realm. The kit's Guardian rule maps to apex tiers 12 to 14; the Morph rule maps to bred colour variants.

## 5. Earth catalogue (finite names, procedural bodies)

`_EARTH_NAMES` (D/descriptors/apphooks:19-23): fauna 631, flora 334, fungi 27, microbe 22, total 1,014 named species. Assignment is seeded without duplicates. Canonical Earth is seed 133 in Sol 424242, galaxy 999; roster fixed at epoch 0 (nineteen genomes, six displayed residents), later epochs add vagrants. Named Earth anatomy is binding (G/landfall-conditioning.ts:96-166). Exact canon art overrides already exist for 74 species (A/speciesoverrides.ts: 37 fauna, 17 flora, 7 fungi, 13 microbe), and per-species painter specs cover several hundred more.

**Kit consequence.** Earth species are named subjects in the kit's own terms; they keep fur, feather and botany. The Compendium plate library for Earth is finite and worth building in priority order: the nineteen epoch-0 residents, then the 74 canon species, then the rest of the 1,014 as the finisher matures. Each named species still carries a procedural genome for size and colour, so its plate is painter-composed and model-finished like everything else, with the name supplying anatomy.

## 6. Alien flora, fungi and microbes (finite forms; kit class 4D)

18 flora forms (fern-analogues, fungal forests, lichen mats, reed thickets, bioluminescent groves, crystalline growths, moss carpets, canopy vines, bladder-leafed shrubs, spore-towers, sail-leafed trees, mirror-bark giants, tube-stalk gardens, balloon-pods, razor-grass plains, cushion-scrub, umbrella-canopy titans, glass-needle thickets), 6 aquatic and 3 aerial forms, 9 fungi forms, 12 microbe forms, 10 detail traits (D/speciestraits:162-184, :245-248). Painter architectures: fern, tree, vine, shrub, grass, aquatic with ten leaf types, plus fungal forest, lichen mat, crystal, spore towers, balloon pods, glass needles, cane, rosette (A/proceduraloverrides:96-132; A/proceduralfamilies:46-65, :786-788). Flora effects are data-owned (D/strays:48; feed and meal owners), never read from the painting.

**Kit consequence.** 48 form references in the library, one per form; instances on demand. The approved atlas already shows this vocabulary: the copper fan is a sail-leafed tree, the amber pods are balloon-pods, the rosette is cushion-scrub, the fern is a fern-analogue.

## 7. Ships, items, abilities, progression (finite; kit classes 4G, 4I, 4J)

Four ship stages: Scout, Jump, Survey Cruiser, Frontier (G/shipyard-preview.ts:14-40). 62 loot entries in 33 icon families, 9 gear slots (D/loot/catalogue.ts). 47 materials, 9 signatures (stone, ocean, flame, sky, life, mind, star, void, prism), 6 research (D/loot/recipe.ts:27-38). 55 abilities in 11 themes with theme colours (D/combatcore:31-34). 10 explorer ranks, 96 achievements in 13 categories, 16 realm icons. **People: none.** The game has no human or NPC art; civilisations are eras rendered as lights. Kit class 4F is not needed now.

**Kit consequence.** Ships 4, items 62, ability emblems 55, rank and realm icons 26: about 150 cut-outs, all finite, all straightforward library rows.

## 8. Rarity (finite ladder)

Ten display tiers Common to Transcendent with hex colours (D/speciestraits:31-42), raw grades 0 to 14 with art prefixes Pale to Omnipotent (:51-71). The kit's five-step material ladder maps onto the ten tiers two-to-one; the interface owns the colour ring, the painting owns material and ornament, as the kit says.

## 9. The magenta rule

The 17 seeded species colours include violet and pink hues. Genome data cannot change. The exclusion is applied at prompt-compile time only: a seeded hue in the reserved band maps to the nearest permitted pigment word for the painted rendition; identity and data are untouched.

## 10. Finite versus infinite, and the library this implies

| Finite library, first pass | Count |
|---|---|
| Star kinds and companions | 13 plus 2 modifiers |
| Galaxy morphologies and cell objects | 14 |
| Planet type templates | 8 |
| Biome plates | 43 |
| Creature family references (family by realm) | about 25 |
| Flora, fungi, microbe form references | 48 |
| Earth priority plates (epoch-0 residents, then canon) | 19, then 74 |
| Ships, items, ability emblems, rank and realm icons | about 150 |
| **Total first library** | **about 400 images** |

| Infinite, on demand from data | Method |
|---|---|
| Every galaxy, star, system and planet instance | template plus genes through the finisher |
| Every procedural creature and bred hybrid | painter composition from genes, family reference, finisher |
| Every landfall painting | biome plate plus composed residents, finisher integration pass |
| The remaining Earth roster over time | named anatomy plus procedural genome, same pipeline |

The four approved images already sit inside this vocabulary: the fox is an Earth mammal canid on a temperate plate; the plateau herbivore is a quadruped alien with a crest under a G-class light; the flier is the bird family; the swimmer is the fish family; the fungal scene is the `fungal` biome with its three families and two flora forms. The kit's job is to make every other cell of the vocabulary come out in that same hand.

## 11. What Codex should change in the kit and the compiler

- Star table: thirteen rows keyed by `starClass.kind`, plus binary and trinary modifiers.
- System card: every line derived from data (star kind, planet type and hue genes, vista palette and weather, biome flora and fauna families, biome hazard as the One signature). The compiler fills it; nobody types it.
- Class 4E fauna brief: generated from genes and family routing; Earth names supply anatomy.
- Class 4D flora brief: generated from the 48 forms and the species colour.
- Class 4F people: mark as not applicable until the game has people.
- Rarity: map the five-step material ladder onto the ten display tiers.
- Reference lock: the Living Worlds triptych as the scene plate, the Discovery Atlas as the sheet; family and form references painted in that hand as the library's first 75 images.
