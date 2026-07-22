# Celestial Frontier — Species & Genome System

**STATUS:** matches code as of 2026-07-21 (v1.6 Batch 15.5, verified against main.js).
**Purpose:** how a numeric seed becomes a fully-described living species — the four kingdoms, the trait genes, the FA_* trait tables, the color language, the descriptors/naming/classifier layers, and the named-Earth overlay.
**Source of truth:** this doc is the DESIGN spec; main.js implements it.

> **B15.4 classifier + naming (render/text-only, fp 50/50):** `FA_BODY[0]` renamed `"six-limbed"` →
> `"sturdy-limbed"` (Plan 0 is now a "land grazer" whose limb count is set by the limb gene, not the
> body-plan name; fp-safe — no probe genome lands on body 0). The `_earthArt` name→rig classifier gained
> a **Lepidoptera branch** placed AFTER the fish rule but BEFORE the raptor/bird/mammal words, so
> butterfly/moth (and explicit common names, and collisions like "Hawk Moth"/"Peacock Butterfly"/
> "Elephant Hawk Moth"/"Tiger Moth") resolve to the insect rig, while bare Hawk/Peacock→bird,
> Tiger/Leopard→mammal, Butterflyfish→fish. `tools/rig-audit.js` gained 23 Lepidoptera+collision
> sentinels (expected class = biological truth, independent of the classifier).

## 1. Overview

Every organism in the game is a **genome**: a small bag of integer indices into shared trait tables, plus a few flags. A genome is synthesized deterministically from a single 32-bit `seed` by `makeGenome(seed, kingdom, biomeHeat)`. The `kingdom` decides which tables the descriptors read; the same seed always yields the same creature on every device.

Two module blocks own this system:

- **`@module SpeciesTraits [domain]`** (main.js ~1379–1609) — the raw data registries: color words + hex anchors, all the `FA_*` fauna tables, the flora/fungi/microbe form pools, the extremophile/sea/air parallel pools, the rarity ladder (`GRADE_TIERS`), and the naming syllables. Deps: `Rand`.
- **`@module Genome [domain]`** (main.js ~1610–1838) — synthesis (`makeGenome`), the codex taxonomy (`classifyRealm`, `ecologyRole`, `realmBiome`, `realmModifiers`, `sapienceTier`), the human-readable descriptors (`describeSpecies`, `faunaDesc`), the grade wrapper (`speciesGrade`), and Apex Guardians (`guardianFor`, `GUARDIAN_EPITHETS`). Deps: `Rand`, `SpeciesTraits`.
- **`@module Genetics [domain]`** (main.js ~1911–1971) — `evolveGenome` (age a genome through epochs) and `crossGenome` (breed two into a hybrid).

A separate app-layer overlay (`_earthArt`, `_earthFlora`, `_EARTH_NAMES`) paints *named Earth organisms* on top of ordinary genomes without touching the determinism domain. Art details live in **ART_DIRECTION.md** — this doc covers only the classification/naming side.

## 2. Rules & mechanics

### 2.1 Genome synthesis — `makeGenome(seed, kingdom, biomeHeat)`
One `mulberry32((seed^0x9e3b)>>>0)` stream draws every gene, **in a fixed order** (see §3). Rules that matter:

- Each gene is `(r()*LEN)|0` where `LEN` is that table's length — **except `form`, which is hard-coded `(r()*18)|0`**. That `18` is baked into every existing genome's roll; the flora/fungi/microbe form pools are read with `% length` at describe-time so `form` can index any of them. The pinned pools must never change length (see §2.6).
- `lumin` is a boolean: `r()<0.28` (≈28% bioluminescent).
- `gen` starts at 0; `heat` stores the world's `biomeHeat` (0 cold / 1 temperate / 2 hot).
- The genome also carries later-added markers set *outside* `makeGenome` (never re-rolled through the rng): `x` extremophile fauna, `aq` sea flora, `af` air flora, `wild` wild-crossbreed, `apex`/`par` guardian & paragon grade, `ep` epithet index, `parents` breed lineage, `evolved`, and the app-only `_earthName`/`_cradle`.

### 2.2 The four kingdoms
`SP_KINGDOM = ['flora','fungi','microbe','fauna']`. The kingdom selects the descriptor path in `describeSpecies`:
- **flora** → producer; `desc = color + floraFormOf(g)`; `floraFormOf` reads `AQ_FLORA_FORM` if `aq`, `AIR_FLORA_FORM` if `af`, else `FLORA_FORM`.
- **fungi** → decomposer; `desc = color + FUNGI_FORM[form]`.
- **microbe** → base of the web; `desc = color + MICROBE_FORM[form]`.
- **fauna** → routed to `faunaDesc(g)`, which assembles anatomy from ~a dozen genes.

Only **fauna** uses body/head/limbs/skin/tail/pattern/eyes/loco/diet/behavior/temper/sense/repro/life/metab; flora uses `detail`, all kingdoms use `color`/`form`/`lumin`.

### 2.3 Fauna description — `faunaDesc(g)`
Builds two strings:
- **desc** (one-line silhouette): `size, color body loco trait` + `, glowing` if `lumin` and the trait doesn't already mention glow.
- **detail** (paragraph): diet + habitat + behavior, then anatomy (`head, skin-skinned, with <eyeTxt>` + optional tail), then temper / sense / repro, then metab + lifespan. Eye text special-cases 0 → "no eyes", 1 → "a single great eye", else "N eyes".

`habOf(g)` / `locoOf(g)` swap in the extremophile pools when `g.x` is set; otherwise read `FA_HABITAT` / `FA_LOCO`.

### 2.4 Codex taxonomy (the realm layer, on top of the four kingdoms)
`classifyRealm(g)` maps a genome to one of 16 **realms** (`REALM_ORDER`) deterministically from its genes:
- flora→Flora, fungi→Fungi; microbe→`Colonial Life` if its form matches `swarm|colony|bloom|mat|film`, else `Microbial Life`.
- fauna: `sapienceTier>=3` → Intelligent Natural Life; `size>=5` → Megafauna; extremophiles (`g.x`) claim Gas Giant / Subterranean / Extreme-World by habitat; hot-world vent/lava → Exotic Biochemistry; then habitat/locomotion keywords resolve Subterranean, Gas Giant, Extreme-World, Amphibious, Aerial, Aquatic, else Land Fauna.

`ecologyRole(g)` gives the food-web role (Producer / Decomposer / Predator / Grazer / Filter feeder / Scavenger / Chemosynthetic / Omnivore). `realmBiome(g)` gives the habitat/form phrase. `realmModifiers(g)` collects tags: Bioluminescent, Megafauna, Symbiotic, Extremophile, Magnetic navigator, Echolocator, Pressure-adapted, Heat-/Cold-adapted, Wild crossbreed, "Gen N (hybrid)".

### 2.5 Sapience — `sapienceTier(g)` (0–4)
Fauna-only. Scores cognition markers from behavior/sense/trait/size genes (`c`), then gates the top two tiers behind a rare deterministic roll (`mulberry32(hashInt(seed,0x5A91,3))`): `c>=4 && roll<0.06` → 4 Sapient; `c>=3 && roll<0.18` → 3 Semi-sapient; `c>=2` → 2 Tool-curious; `c>=1` → 1 Social; else 0 Instinctive. Tier ≥3 promotes the creature to the **Intelligent Natural Life** realm.

### 2.6 The pinned-pool law
The comment at ~1524 is a hard invariant: the original `FLORA_FORM`/`FUNGI_FORM`/`MICROBE_FORM`/`FA_*` pools **must never grow** — their lengths are baked into every genome's index rolls, so extending one re-rolls the whole universe. New species branches instead carry markers (`x`/`aq`/`af`) and read *parallel* pools (`EX_HABITAT`, `EX_LOCO`, `AQ_FLORA_FORM`, `AIR_FLORA_FORM`) through the `habOf`/`locoOf`/`floraFormOf` helpers.

### 2.7 Naming — `speciesName(seed)`
`mulberry32((seed^0x5eed5))` picks one syllable each from `SP_NAME_A` (20) + `SP_NAME_B` (20) + `SP_NAME_C` (12, includes ''). Guardians & paragons append ` <GUARDIAN_EPITHETS[ep]>`.

### 2.8 The named-Earth overlay (app layer, determinism-safe)
`_EARTH_NAMES` (main.js ~8625) is a per-kingdom roster of real Earth names (Wolf, Oak, Chanterelle, Amoeba, …). `_earthNamePass(list)` assigns one name per genome by `seed % pool.length`, walking forward to avoid duplicates within a world, storing it as `g._earthName`. `_storeSpecies` swaps that name into the Compendium entry. This is **art/label only** — the determinism domain (`describeSpecies`) is untouched, and un-named probed creatures are never affected (fingerprint-safe).

`_earthArt(name)` (~4378) and `_earthFlora(name)` (~5740) are keyword classifiers that map an Earth name to art dials (body plan, rig, botanical growth form) so a snake slithers and a fern isn't drawn as an oak — see **ART_DIRECTION.md**. Earth beasts also get `_cradle=1` (main.js ~2228), which clamps their rarity grade at Uncommon wherever they travel (see RARITY_AND_GRADES.md §2.4).

## 3. Key tables & numbers (REAL values from code)

### Genome field draw order (makeGenome, ~1617) — order is load-bearing
`color, form(×18), body, loco, trait, size, diet, head, limbs, skin, tail, pattern, eyes, behavior, habitat, detail, accent, temper, sense, repro, life, metab, lumin(<0.28)`; then `gen:0, heat:biomeHeat`.

### Color language
- **`SP_COLOR`** (17): emerald, crimson, violet, golden, turquoise, indigo, amber, rust-red, silver-blue, obsidian-black, bone-white, magenta, teal, ochre, jade, bruise-purple, glass-clear.
- **`SP_HEX`** — hex anchor per color word so the portrait matches the description (e.g. emerald `#2fbf6b`, crimson `#d33b46`, obsidian-black `#2b2d3a`). `accent` gene indexes the same 17-color list for a secondary hue.

### Fauna trait tables (lengths — do not reorder or resize; portrait code keys off indices)
| Table | Len | Notes |
|---|---|---|
| `FA_BODY` | 16 | silhouette; portrait keys off index |
| `FA_LOCO` | 18 | locomotion (standard pool) |
| `FA_TRAIT` | 25 | signature quirk phrase |
| `FA_SIZE` | 6 | tiny→titanic |
| `FA_SIZE_M` | 6 | portrait scale per size: `[0.28,0.45,0.62,0.82,1.0,1.25]` |
| `FA_DIET` | 6 | herbivore→omnivore |
| `FA_HEAD` | 10 | head shape |
| `FA_LIMBS` | 6 | leg/limb pairs drawn: `[2,4,6,8,3,0]` |
| `FA_SKIN` | 9 | scaled→crystalline |
| `FA_TAIL` | 7 | none→stinger-tipped |
| `FA_PATTERN` | 8 | plain→eye-spotted |
| `FA_EYES` | 6 | eye count: `[2,4,6,8,1,0]` |
| `FA_BEHAVIOR` | 12 | ecological behavior |
| `FA_HABITAT` | 19 | standard habitats |
| `FA_TEMPER` | 10 | disposition |
| `FA_SENSE` | 10 | primary sense |
| `FA_REPRO` | 8 | reproduction |
| `FA_LIFE` | 6 | lifespan |
| `FA_METAB` | 6 | metabolism |
| `FLORA_DETAIL` | 10 | flora paragraph flavor |

### Plant / fungi / microbe form pools (read with `% length`)
- **`FLORA_FORM`** (18): fern-analogues, fungal forests, lichen mats, reed thickets, bioluminescent groves, crystalline growths, moss carpets, canopy vines, bladder-leafed shrubs, spore-towers, sail-leafed trees, mirror-bark giants, tube-stalk gardens, balloon-pods, razor-grass plains, cushion-scrub, umbrella-canopy titans, glass-needle thickets.
- **`FUNGI_FORM`** (9): mushroom forests, shelf-fungus terraces, puffball fields, lantern-cap groves, mycelial webs, spore-tower colonies, creeping mats, crystal-fungus clusters, mold plains.
- **`MICROBE_FORM`** (12): photosynthetic mats … snow-algae crusts.

### v1.3.5 parallel pools (marker-gated, additive-safe)
- **`EX_HABITAT`** (9) + **`EX_LOCO`** (9) — extremophile fauna (`g.x`).
- **`AQ_FLORA_FORM`** (6) — sea flora (`g.aq`).
- **`AIR_FLORA_FORM`** (3) — air flora (`g.af`).

### Codex realms
`REALM_ORDER` (16): Microbial Life, Colonial Life, Flora, Fungi, Land Fauna, Aquatic Fauna, Aerial Fauna, Amphibious Life, Subterranean Life, Extreme-World Life, Gas Giant Life, Megafauna, Intelligent Natural Life, Collective / Hive Life, Exotic Biochemistry, Anomalous Life. Each has an emoji in `REALM_ICON`. `SAP_LABEL` (5): Instinctive, Social, Tool-curious, Semi-sapient, Sapient.

### Naming syllables
`SP_NAME_A` (20), `SP_NAME_B` (20), `SP_NAME_C` (12, first entry '').

### Named-Earth rosters (`_EARTH_NAMES`, app layer)
fauna ~600 names, flora ~300, fungi 27, microbe 22. Assigned by `seed % pool.length`, de-duplicated per world.

## 4. Data / save fields
The genome object itself is persisted inside each Compendium entry (`entry.genome`) and inside placed champions. Persisted genome fields: all the index genes above, `lumin`, `gen`, `heat`, and any set markers (`x`, `aq`, `af`, `wild`, `parents`, `apex`, `par`, `ep`, `evolved`). Load-time hardening coerces/clamps `apex` (must be 12–TIER_MAX or dropped, ~11288). `_earthName`/`_cradle` are app-side conveniences re-derived on the world, not part of the determinism domain. New fields must default safely when absent.

## 5. Determinism
- Every gene comes from `mulberry32`/`hashInt` seeded by the object seed — **no `Math.random()`/`Date.now()`** in these domain modules (enforced by validate.js's grep). The lone `Math.random` genome calls (Lab preview ~15567/15582) are UI-only and never enter the codex/fingerprint.
- The draw order and the hard-coded `form` length `18` are baked into the **50-probe determinism fingerprint** (`tools/baseline.json`); changing either re-rolls the universe and fails validation.
- Markers `x`/`aq`/`af` are set *after* synthesis and ride WITHOUT touching the rng stream, so adding them didn't move the fingerprint. `crossGenome` inheritance of markers is likewise stream-neutral.
- `_earthName`/`_earthArt`/`_earthFlora` are gated on a name being present, so probed (un-named) creatures are untouched → fingerprint safe.
- **Rarity is deterministic and authoritative** — see RARITY_AND_GRADES.md.

## 6. Code anchors
- `@module SpeciesTraits [domain]` — main.js ~1379–1609. `SP_COLOR`/`SP_HEX` ~1386; all `FA_*` tables ~1546–1598; `FLORA_FORM`/`FUNGI_FORM`/`MICROBE_FORM` ~1515–1523; `EX_*`/`AQ_*`/`AIR_*` + `habOf`/`locoOf`/`floraFormOf` ~1530–1544; `speciesName` ~1602.
- `@module Genome [domain]` — main.js ~1610–1838. `makeGenome` ~1617; `REALM_ORDER`/`REALM_ICON` ~1654; `sapienceTier` ~1665; `realmBiome` ~1683; `classifyRealm` ~1689; `ecologyRole` ~1719; `realmModifiers` ~1731; `describeSpecies` ~1751; `faunaDesc` ~1790; `speciesGrade` ~1772 (see RARITY doc).
- `@module Genetics [domain]` — `evolveGenome` ~1917, `crossGenome` ~1933.
- Named-Earth overlay (app): `_earthArt` ~4378, `_earthFlora` ~5740, `_EARTH_NAMES` ~8625, `_earthNamePass` ~8631, `_storeSpecies` ~8640, `_cradle` flagging ~2222–2228.

## 7. Open questions / pending
- `FA_LIMBS` and `FA_EYES` are both length-6 arrays that intentionally alias `FA_SIZE`'s length, so a size roll and a limbs/eyes roll share the same modulus — deliberate, but worth remembering if `FA_SIZE` ever changes.
- CLAUDE.md still calls the fingerprint "49-probe" in one place while the live in-game blurb (main.js ~12880) says "50-probe". Treat 50 as current; the docs lag.
- The named-Earth rosters are app-layer strings with no test coverage tying a specific seed→name; only the "no duplicates per world" invariant is structural.
