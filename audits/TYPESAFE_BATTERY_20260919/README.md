# TypeSafe (Jev) second-opinion battery — 2026-09-19, anthropic/mac

First live run of the offline second-opinion tooling (`TYPESAFE_START_HERE.md`). Jev is text-only; every
line it printed was a SUSPECT confirmed or dismissed by eye here. Key came from `TYPESAFE_API_KEY` in the
shell only. Reports copied beside this file; answer caches stay gitignored.

## Token spend (from each tool's usage line)
| Tool | Requests | Input tokens | Cost (jev-1.13, output free) |
|---|---:|---:|---:|
| `npm run typesafe:rig` (631 names, batch 30) | 22 | 927,130 | ~$0.0389 |
| `npm run typesafe:reference` (631 rows × posture+eyes, batch 20) | 32 | 803,376 | ~$0.0337 |
| both re-runs after the fixes | 0 | 0 (1,893 answers from cache) | $0 |
| `typesafe:judgetag` | not run — no `port/v2/apps/game/smoke/<run>/judge` on this Mac | | |

## 1. Rig second opinion — 8 disagreements, 3 confirmed regex misses, 5 model misses

| Name | regex | model (conf) | Verdict | Action |
|---|---|---|---|---|
| Whale Shark | marine | fish (1.00) | **regex miss** — `whale` in the marine line fires before the fish line | `whale(?! shark)`; sentinel `['Whale Shark','fish']` |
| Viperfish | serpent | fish (1.00) | **regex miss** — `viper` in the serpent line fires before the fish line | `viper(?!fish)`; sentinel `['Viperfish','fish']` |
| Nudibranch | legacy (worm group) | gastropod (1.00) | **regex miss** — a sea slug was routed with worms (no rig) | moved to the gastropod line, slug form; sentinel `['Nudibranch','gastropod']` |
| Barnacle | sessile | crust (1.00) | model miss — biologically a crustacean, but the painter's *silhouette* rig for a fixed cone is sessile (already a P0 sentinel); the question's `crust.what` text even lists barnacles, so the criteria invited this | none |
| Sea Otter | mammal | marine (0.99) | model miss — the `marine` rig is flippered (whales, seals); an otter is drawn on four legs | none |
| Oarfish | serpent | fish (0.99) | model miss — the serpent rig is the eel-shaped silhouette rig by design (line 7 lists oarfish deliberately) | none |
| Lancelet | fish | other (0.73) | below threshold; fish silhouette is the right rig | none |
| Springtail | insect | other (0.47) | below threshold; six-legged hexapod, insect rig | none |

`node tools/rig-audit.js`: PASS, 631 classified / **196** sentinels. `node tools/validate.js`: PASS end to end
(html rebuilt from `main.js`; diff = the four regex lines; render audit 1010 clean; fingerprint baseline matches).
Re-run of `typesafe:rig` from cache: 8 → 5 disagreements, the three fixes gone.

## 2. Reference second opinion — 272 disagreements (73 strong), 14 corrections, all posture

Corrected in `port/v2/reference/fauna.json` (diff = exactly 14 `posture` lines; `referencecheck.mjs` PASS):

| Row | stored → corrected | Reason (the row's own text or its family convention, not the model's say-so) |
|---|---|---|
| Auk, Guillemot | biped → upright | their `mustRead` says "upright penguin-like stance… stands vertically" / "upright body"; Penguin is `upright` |
| Woodpecker | biped → upright | its note: "normally drawn clinging vertically, so it reads much taller than wide" — the vocabulary's vertical-axis pose |
| Cockatoo | upright → biped | Parrot, Macaw, Kakapo are `biped`; nothing in its row claims a vertical pose |
| Desert Owl | upright → biped | Owl and Snowy Owl are `biped` |
| Kookaburra, Hoatzin, Quetzal, Weaverbird, Starling | flying → biped | the table's `flying` set is airborne-depicted animals (swallows, terns, albatross, hummingbird, insects, bats); these are perching birds — Weaverbird's own text is "clinging… to a woven grass nest", the Hoatzin barely flies |
| Iguana, Land Iguana, Marine Iguana | quadruped → sprawling | every other lizard in the table (Komodo, Monitor, Tegu, Gecko, Agama…) is `sprawling`; Chameleon stays `quadruped` (branch-walker) |
| Spider | crawling → sprawling | Tarantula is `sprawling`; the row's own note says the legs must sprawl; the vocabulary's `crawling.not_for` names spiders |

Left unchanged, recorded as the table's conventions or as judgment calls the model should not overturn:
- **Snakes** `crawling` vs `coiled` (Sand Boa, King/Grass/Vine/Whip Snake, Mamba, Racer): the table splits thick ambush snakes (coiled) from slim active colubrids (crawling) on purpose.
- **Benthic shrimp** `crawling` (Cave/Vent/Freshwater) vs `swimming` (Shrimp/Prawn/Krill): deliberate; Vent Shrimp is the weakest case (swarms) — for Nick.
- **Fish `eyes: prominent`** (Perch, Cichlid, Clownfish, Sardine, Tetra… ~20 rows) → model says `normal`: a systematic painting convention, not an error.
- Otters `quadruped`, Octopus `crawling`, Blobfish/Tripod Fish `sprawling`, Marmoset `quadruped` (its note says "clinging upright to bark" — suspect for Nick), Chiton, Harvestman, Moorhen, Giant Water Bug, all remaining `eyes` rows (Alligator/Tortoise/Goose/Duck… `normal`↔`small`): judgment calls.
Re-run of `typesafe:reference` from cache: 272 → 258 disagreements (61 strong), the 14 corrected rows gone.

## 3. Artlock — pre-existing stale lock, not this batch
`node port/v2/tools/artlock.mjs` reports `[DRIFT] 1250 of 1250 assets changed since 2026-08-06` and `[SAME] 4 pairs under
HARD 0.6`. The identical result on the HEAD html (before the regex edit) proves the drift predates this batch: the lock was
last blessed 2026-08-06 and the Aug 10–11 art passes landed after it. Re-blessing is Nick's lane decision (P0-6a); nothing
was blessed here. The three re-rigged species (Whale Shark, Viperfish, Nudibranch) will legitimately move when it is.

## 4. Could a second opinion cover everything in the game? (Nick's question, same day)
Jev answers typed questions over **text/JSON** with calibrated probabilities; it cannot see images, count, or do numbers.
So: yes for everything that is a name, a description, a table row or a generated record; no for art, geometry, balance
math and determinism (those stay with the vision judge, the fingerprint gates and the code). Same shape every time —
suspects for a human, a `--dry-run` first, cents per thousand items. In priority order:
1. **Flora + fungi/microbe reference rows** (383 rows: growth form, attachment, harvest part) — the same tool with the
   flora vocabularies; the packets grade against these rows exactly as they do fauna.
2. **Biome atlas** (43 live biomes × fauna/flora family lists, signatures) — "does this family plausibly live here?" per
   pair; catches a mangrove hosting tundra fauna.
3. **Procedural generation** — sample N seeds, feed the generated record (name, descriptor text, genome fields, rig,
   biome) and ask consistency questions: does the description match the body plan, the habitat the biome, the diet the
   jaw; determinism itself stays a code gate.
4. **Universe** — system cards, planet blurbs, world names: plausibility and internal consistency (a "cloud deck" world
   with surface water, a frozen world named for heat).
5. **Player-facing text** — Guide, release notes, tooltips: contradictions with the reference tables.
Not for Jev: PNG verdicts, aspect/headFrac numbers, rarity ladders, balance, the fun index.

## Files
`rig-secondopinion.report.json`, `reference-secondopinion.report.json` (copies of `tools/reports/*.json`).

---

## 5. Second battery — "everything else" (Nick, same day): five new tools, five live passes

| Tool | Items | Requests | Input tokens | Cost |
|---|---:|---:|---:|---:|
| `typesafe:reference2` (flora `form`; fungi/microbe `family`, `scale`) | 383 rows / 405 fields | 20 | 507,372 | ~$0.021 |
| `typesafe:biome` (43 biomes × 25 families, Noul each) | 1,075 pairs | 8 | 91,114 | ~$0.004 |
| `typesafe:text` (43 Guide topics + 398 release bullets) | 441 passages | 37 | 122,354 | ~$0.005 |
| `typesafe:procedural` (120 seeded species, seed 7331) | 120 | 8 | 74,494 | ~$0.003 |
| `typesafe:universe` (12 systems: 12 stars, 31 planets) | 43 bodies | 5 | 26,017 | ~$0.001 |
| **Both batteries, whole day** | | **132** | **≈ 2.55 M** | **≈ $0.107** |

### 5a. Flora / fungi / microbe rows — 61 disagreements (23 strong) → 4 corrections, the rest conventions
Corrected in `flora.json` (diff = exactly 4 `form` lines; `referencecheck.mjs` PASS; re-run 61 → 59):

| Row | stored → corrected | Reason (the table's own rows, not the model) |
|---|---|---|
| Grape | vine → climber | Red/White/Black Grape are `climber`; identical tendril + woody-stem text — one plant on both sides of the split |
| Passionfruit | vine → climber | Passionflower (same species) is `climber` |
| Brooklime | herb → aquatic | its `mustRead`: "sprawling in shallow water with rooting stems"; peer Watercress is `aquatic` |
| Vanilla Orchid | vine → epiphyte | Orchid Pods is the same vanilla plant stored `epiphyte`; its own text: "aerial roots gripping bark" |

Left unchanged — three **convention questions for Nick** the model cannot settle:
- **`tuber`: habit or harvest?** The table's four `tuber` rows (Potato, Sweet Potato, Carrot, Beet) are root crops drawn with the root; Cassava (`shrub`), Taro/Wild Taro, Ginger, Turmeric, Arrowroot (`herb`) harvest corms/rhizomes but are stored by habit. Either rule is fine; the table currently uses both.
- **`rosette`**: only five rows (Pineapple, Dandelion, Plantain Herb, Daisy, Cabbage); Alpine Sorrel, Edelweiss, Sea Beet, Sea Kale, Miner's Lettuce, Bitterroot all say "rosette" in their own leaf text but are stored `herb`/`succulent`.
- Ice Algae `moss` (the table files crusts and films under moss), Sea Fennel/Samphire `herb` vs `succulent`, Oyster Mushroom `shelf` (tiered on wood, off-centre stem): defensible drawing conventions; no change.

### 5b. Biome atlas — 100 suspects, **no change** (the atlas is generation data; editing it changes every seeded world)
13 *listed-but-implausible* are all the alien/extreme biomes hosting insects, arachnids, moss and gas-giant jellies/cephalopods (cratered, banded, stormeye, emberfield, sulfurdeck, obsidian, saltpan/saltflat herb) — by-design extremophile life, worth one look. 87 *unlisted-but-plausible* say the Earth-like biomes list subsets: temperate lacks herb/moss/vine/arachnid/gastropod/fish, jungle lacks mammal/shrub/herb/moss/grass, swamp lacks bird, mangrove lacks insect… If the lists are spawn weights that is intended; if they are "what can live here", they are thin. Full list in `biome-secondopinion.json`.

### 5c. Player text — 0 contradictions, 6 misread flags, **no change**
All six are v1.0–v1.8.4 release bullets about breeding ("both parents are consumed") — true for v1, superseded by v2's nonlethal breeding (`port/DECISIONS.md`), and historical notes stay as written. The Guide (43 topics) raised nothing.

### 5d. Procedural species — three generator-level findings, **no change without Nick**
1. **Grammar (confirmed bug):** 9/120 cards begin "A omnivore …" — `main.js:2165` builds `'A '+diet+' of '+habitat` with no vowel rule. One-line fix (`(/^[aeiou]/i.test(diet)?'An ':'A ')+diet`), but `describeSpecies` output is inside the 50-probe determinism fingerprint, so applying it requires **Nick's decision to re-baseline** (`tools/baseline.json`); not applied.
2. **Medium vs habitat (design gap):** 12/60 fauna are "swimmers / drifters / filter-feeders / floaters" placed in desert dunes, rocky ridges, tundra, ash fields or a forest canopy — `loco` and `habitat` are rolled independently. One in five procedural animals cannot live where its card says it lives; the art, rig and battle medium all read the same fields.
3. **Sapience label vs text:** "Intelligent Natural Life" on a card whose text shows no intelligence (Sibemnora) — `classifyRealm` reads the genome's sapience tier, `describeSpecies` never mentions it.

### 5e. Universe — 43 bodies, 0 row conflicts, 0 text-vs-parameter conflicts, **4 climate-band mismatches**
Kari and Kaion ("Venusian hothouse"), Satar ("Molten world"), Ionae ("Desert world") read `hot` from their own rows while `climateBand(orbit)` computed `temperate`/`cold`. The band is orbit-only and the planet type is independent, and the band feeds `planetSpecies` — a molten world in the cold band seeds cold-band life. Design decision for Nick; the survey cards themselves are internally consistent.

### Files
`reference2-secondopinion.json`, `biome-secondopinion.json`, `text-secondopinion.json`, `procedural-secondopinion.json`, `universe-secondopinion.json`.
