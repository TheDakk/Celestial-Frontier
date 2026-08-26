# Celestial Frontier — Species & Genome System

**STATUS:** legacy mechanics below match `main.js` as of 2026-07-31; the current v2 reset,
ownership, one-time bred-child feeding, rarity-presentation and narrow Tame-audio overlays match the
local `port/v2` candidate as of 2026-08-26. ⚠ v1.8.9: every reader of the
`size` gene now goes through `_szOf` (`% FA_SIZE.length`) — see the inline note
in §2.4.
**Purpose:** how a numeric seed becomes a fully-described living species — the four kingdoms, the trait genes, the FA_* trait tables, the color language, the descriptors/naming/classifier layers, and the named-Earth overlay.
**Source of truth:** this doc is the DESIGN spec; `main.js` implements the legacy
runtime and `port/v2/packages/domain/speciestraits` owns the dated port contract.

> **2026-08-26 current-candidate species boundary:** the internal-only Arc 5 bred-successor seam
> initializes a newly admitted child with
> `fed = 0.5 * min(clamp(parentA.fed, 0..200), clamp(parentB.fed, 0..200))` exactly once. Reversing
> the parents yields the same value, absent input becomes zero, encode/decode preserves it, and a
> later care change is not overwritten. No public/player breed action invokes this seam: breeding
> odds, parent Recovery duration and locks, care/timing/capacity, confirmation, UI and copy remain
> Arc 5B product-open.
>
> Raw deterministic grade remains mechanics/internal-art data. Player surfaces use only the strict
> ten-name rarity projector: integer tiers `0..8` map directly, raw `9..14` present as
> Transcendent, invalid/missing values are omitted rather than coerced to Common, and neither the
> internal art label nor raw tier number is shown. Planet rarity stays hidden before landing; a
> legitimate scientific stellar class is not a creature rarity label.
>
> The app now has one deliberately narrow creature-audio path. A trusted native Tame gesture may arm
> one silent audio context only while the current surface is visible and answerable and Sound plus
> Creature Voices are enabled. Playback occurs only after the exact durable successful fauna result,
> no convergence, and a matching current ownership revision/species/live-wild-creature identity; it
> emits one deterministic greeting with a visible live-region counterpart and no retry/replay.
> Disabling sound/voices, losing visibility/answerability or replacing the result stops it. This is
> current-system Tame feedback only: Compendium audition, ambience, broader companion actions,
> music and combat audio remain absent. Ordinary Arc 4 Slice evidence still says
> `recoveryClaimed:false`; its dedicated uninterrupted 20-minute recovery certificate remains open.

> **2026-08-25 Arc 4/5A ownership overlay — recorded boundary; Arc 4 player-live, Arc 5A infrastructure-only:** the port has a strict
> identity split between immutable catalogue/discovery facts, stable owned fauna instances and
> nonliving specimen lots. Ownership-v1 binds canonical genome identity, exact CF1 provenance,
> biosphere progress and bounded legacy evidence. Ownership-v2 adds receipt-bound acquisitions,
> deterministic fauna-only bred-child successors, ordered parent/lineage evidence and tombstones;
> its active compact representation is one source-bound version-2 manifest plus exactly four fixed
> generic delta shards. The app reconstructs V2 from exact Arc 4 source + canonical changed/V2-only
> rows and verifies source/delta/target/shard fixed points without duplicating unchanged ownership.
> Arc 4's native Survey Tame/Scavenge/Sample controls now consume the canonical full roster through
> the durable writer. A first successful verb creates the one catalogue/discovery fact; Tame may
> add a stable-ID living fauna instance, while Scavenge/Sample add nonliving specimen lots. Eligible
> repeats can add another individual/lot without duplicating the first-only page or Stardust grant.
> Hit/miss, reload, storage refusal, stale convergence, publication convergence and 12-viewport
> presentation/geometry are locally browser-proven. Arc 5A boot now creates or loads those five
> carriers in the shared receipt-free CAS; an aligned legacy-v1 certificate upgrades once and an
> aligned current-v2 fixed point writes nothing. Genuine legacy Training couples one Arc 2, 18 Arc 4
> and five Arc 5 writes; every capture hit or miss advances 18+5 replacements and postcommit-publishes Arc 4/V2
> together. No public or Arc 5-only breed/care/companion writer, Recovery, assignment, Chronicle or
> mission UI exists. The internal V2-only successor produces the same exact five-carrier tuple and
> now applies the one-time child-`fed` rule above, but is not exported publicly. Source-only growth
> preserves all four canonical empty-shard bytes, keeping
> unchanged-state growth O(1). The real
> 20-minute Arc 4 recovery edge and HUMAN ownership/first-journey review remain open.
> Retained Arc 4 browser evidence predates compact Arc 5 V2. The later exact-input evidence for this
> recorded 2026-08-25 boundary is Slice run
> `20260825213041239-98104-c96d3b2d0652` on Edge `151.0.4129.101` (363,053 ms, zero
> findings/retries/source change; report/log SHA-256
> `b19ba6f749cb12e5c8fe23bdc1e779fce8fb04ebbb47653e65313ef2f47784ad` /
> `5a5be42cea5a67401472fe214f663ce8ca1bed7b3c6dbccd29b83fd8d1ea9225`) and Glass on the same Edge
> (71,449 ms, 12/12 viewport plus reload rows, 95/95 controls, 36/36 Arc 4 outcomes, zero
> blocked/omitted/findings/instrument failures/retries; report SHA-256
> `c46b81fbac123c1df22b03949e64589bf1d8d52898613efe01c809b840df177e`). Both bind source commit
> `48ce0b1662a59b21070667be339a1e59503e1f19`, status
> `729e139b14a978c39457ed9ab24990b7e1fd3f3bb63fef3efeeca24b45e4fb9f` and working tree
> `a375f64327e00f9aeaa4e7f46b8f5b4af271aad5230ba301484114520ec8e361`; audits are CLEAR.

> **2026-08-11 v2 executable-contract correction:** No genome, descriptor or
> portrait output changed. The SpeciesTraits declaration now matches its tables:
> `SP_COLOR` is a string list, `SP_HEX` is a string-to-hex record, and `FA_EYES`
> is numeric. `colorGrade`/`spectral` options are genuinely optional, and the
> grade option includes the runtime-supported suffix. Parity tests exercise the
> shapes so later consumers cannot compile against a fictional table contract.

> **2026-08-10 v2 full-catalogue reset:** `_earthName` identifies a fixed Earth
> organism; bred descendants carry `_earthBlend`, `_earthBlendKingdom`, and
> `_anchorVal`. The selected lineage's exact catalogue owner is stored at breeding
> because a mixed-kingdom child's own kingdom may come from the other parent and
> four Earth names occur in two sets. Fauna descendants reach the lineage-aware HD
> scaffold before generic procedural mapping; non-fauna descendants reach the exact
> kingdom+name owner with the child genome unchanged. Portrait and thumbnail caches
> use the complete plain genome as pixel identity, not seed/name alone, because
> reverse-parent crosses may share a seed while inheriting different traits.
> Earth review identity is also `catalogue set + species`: 1,010 Earth identities
> own 1,014 route rows because four names occur in two sets. The live review ruler
> is `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`; no prior band is
> a current PASS.

> **2026-08-11 route/freshness correction:** the Platinum review of the clean
> `79ce144` current-generation archive proved that lineage metadata could be exact
> while a fauna child still switched from its modern pure whole form to the retained
> HD compatibility renderer at the first bred stage. Genetics and anchor generation
> remain unchanged. Rendering now set-qualifies an exact seven-name reviewed-fauna
> migration (Fruit Bat, Eagle, Wolf, Elephant, Chameleon, Dragonfly, Octopus) to
> modern owners; Sea Turtle and Great White Shark remain protected on compatibility
> routing. Pure named paths stay separate. The same candidate adds anchor-aware bred
> treatment for Apple, Vanilla Orchid, Oyster Mushroom and Amoeba. Evidence schema v4
> binds 13×5 stages /251 assets. The exact source-`03ea297` package review returned
> **PASS with optional polish only**; the sealed archive's generated UNREVIEWED status
> remains its preparation state, and final all-bloodline certification remains open.

> **2026-08-24 v2 Arc 7 audio identity — historical package foundation, superseded for current
> playback by the 2026-08-26 boundary above:** Catalogue
> identity and living-creature identity are separate. The Earth catalogue owns 1,010
> identities and 1,014 set-qualified route rows; every art/audio join carries the exact
> catalogue set/kingdom + species rather than a bare display name. `@cf/audio` now pins that
> complete route inventory to a coarse kingdom taxonomy and rejects legacy/mammal fallback in
> ordinary sound witnesses. A living specimen's visual identity continues to use its canonical
> **complete plain genome**. The package audio pipeline instead uses an immutable typed
> `AudioSignature` projection derived only from selected audio-relevant phenotype fields, exact
> Earth owner when present, lineage markers that
> survive persistence and an explicit resolver version. It excludes mutable `xp`, `hurt`,
> `fed`, `brood`, `assignment` and `bond`. They may share a pure body/rig/habitat taxonomy,
> but neither renderer owns the other's runtime. Same seed is insufficient when
> reverse-parent children inherit different audio-relevant phenotype or lineage, while
> changing any excluded mutable field must leave the signature, audio profile and cue plan
> exactly unchanged. The audio product is stable typed data, not byte-identical browser PCM.
> Resolver-v1 and its negative/positive vectors were implemented only over an already-normalized
> `AudioIdentityInput`. At this historical 2026-08-24 boundary, the canonical app creature/save →
> audio-input projector, authored voice graph and player playback were not implemented and the app
> remained stings-only; the narrow current Tame greeting above supersedes that playback boundary.
> This package-foundation paragraph changed no genome, save, portrait, descriptor, Guide capability
> or player mechanic.
>
> The package assigns fauna and each non-fauna kingdom a distinct truthful coarse policy; curated
> biological/foley families and authored ecological or Compendium sonification remain future and
> must never fall through to an animal voice. The promise is a recognizable deterministic specimen
> signature assembled from curated palettes and synthesis, **not** one recorded sample for every
> Earth species.
> Resolver-v1 accepts exact owner/anchor and ordered parent-seed fields and keeps reverse-parent
> signatures distinct, but no app projector claims a complete parent-voice blend. It may not depend
> on unregistered legacy `parents` objects. Ownership-v2 now defines a receipt-bound ordered parent
> projection for future writers; at this historical boundary no audio app projector consumed it. Automated
> identity acceptance includes negative controls for each excluded mutable
> field. See `AUDIO.md` §0 for the typed resolver, rights, listening and resource gates.

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
- fauna: `sapienceTier>=3` → Intelligent Natural Life; `_szOf(g)>=5` → Megafauna; extremophiles (`g.x`) claim Gas Giant / Subterranean / Extreme-World by habitat; hot-world vent/lava → Exotic Biochemistry; then habitat/locomotion keywords resolve Subterranean, Gas Giant, Extreme-World, Amphibious, Aerial, Aquatic, else Land Fauna.

> ⚠ **`_szOf`, not `g.size` (v1.8.9).** Every reader of the size gene goes through
> `_szOf(g) = size % FA_SIZE.length` — the value the card prints. This matters because
> `crossGenome` mutates `size` **without wrapping**, so bred genomes legitimately carry
> `size > 5` (~12% of lineages by generation 5). Until v1.8.9 this line and `sapienceTier`,
> `speciesGrade` and the titan roster check read it **raw**, so a bred size-6 creature printed
> *"tiny"* on its card and was classified **Megafauna** with the full rarity boost — measured at
> vit 68 against 52 for a genuine size-0. `_szOf` is exported from `@module Genome`; see
> COMBAT_AND_CONQUEST.md and SAVE_SYSTEM.md (2026-07-31), and `tools/sizedrift-check.js`.
> **Do not "fix" the drift in `crossGenome`** — genes drift and consumers wrap is this codebase's
> idiom for all fourteen mutable trait indices, and `crossGenome` is a fingerprint probe.

`ecologyRole(g)` gives the food-web role (Producer / Decomposer / Predator / Grazer / Filter feeder / Scavenger / Chemosynthetic / Omnivore). `realmBiome(g)` gives the habitat/form phrase. `realmModifiers(g)` collects tags: Bioluminescent, Megafauna, Symbiotic, Extremophile, Magnetic navigator, Echolocator, Pressure-adapted, Heat-/Cold-adapted, Wild crossbreed, "Gen N (hybrid)".

### 2.5 Sapience — `sapienceTier(g)` (0–4)
Fauna-only. Scores cognition markers from behavior/sense/trait/size genes (`c`, size read via `_szOf` since v1.8.9), then gates the top two tiers behind a rare deterministic roll (`mulberry32(hashInt(seed,0x5A91,3))`): `c>=4 && roll<0.06` → 4 Sapient; `c>=3 && roll<0.18` → 3 Semi-sapient; `c>=2` → 2 Tool-curious; `c>=1` → 1 Social; else 0 Instinctive. Tier ≥3 promotes the creature to the **Intelligent Natural Life** realm.

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

In the current v2 lineage overlay, bred descendants also persist `_earthBlend`,
`_earthBlendKingdom`, and `_anchorVal`. `_earthBlendKingdom` defaults through a
live-route ownership inference for pre-marker genomes; new crosses always record
it explicitly. It is render ownership metadata, not a new RNG draw.

## 5. Determinism
- Every gene comes from `mulberry32`/`hashInt` seeded by the object seed — **no `Math.random()`/`Date.now()`** in these domain modules (enforced by validate.js's grep). The lone `Math.random` genome calls (Lab preview ~15567/15582) are UI-only and never enter the codex/fingerprint.
- The draw order and the hard-coded `form` length `18` are baked into the **50-probe determinism fingerprint** (`tools/baseline.json`); changing either re-rolls the universe and fails validation.
- Markers `x`/`aq`/`af` are set *after* synthesis and ride WITHOUT touching the rng stream, so adding them didn't move the fingerprint. `crossGenome` inheritance of markers is likewise stream-neutral.
- `_earthName`/`_earthArt`/`_earthFlora` are gated on a name being present, so probed (un-named) creatures are untouched → fingerprint safe.
- **Rarity mechanics are deterministic and authoritative; presentation is narrower.** Player
  surfaces accept only valid integer raw tiers `0..14`, map them through the ten-name ladder
  (`9..14` → Transcendent), and omit invalid/missing values. Internal art-grade labels and raw tier
  numbers do not cross that boundary. See RARITY_AND_GRADES.md.

## 6. Code anchors
- `@module SpeciesTraits [domain]` — main.js ~1379–1609. `SP_COLOR`/`SP_HEX` ~1386; all `FA_*` tables ~1546–1598; `FLORA_FORM`/`FUNGI_FORM`/`MICROBE_FORM` ~1515–1523; `EX_*`/`AQ_*`/`AIR_*` + `habOf`/`locoOf`/`floraFormOf` ~1530–1544; `speciesName` ~1602.
- `@module Genome [domain]` — main.js ~1610–1838. `makeGenome` ~1617; `REALM_ORDER`/`REALM_ICON` ~1654; `sapienceTier` ~1665; `realmBiome` ~1683; `classifyRealm` ~1689; `ecologyRole` ~1719; `realmModifiers` ~1731; `describeSpecies` ~1751; `faunaDesc` ~1790; `speciesGrade` ~1772 (see RARITY doc).
- `@module Genetics [domain]` — `evolveGenome` ~1917, `crossGenome` ~1933.
- Named-Earth overlay (app): `_earthArt` ~4378, `_earthFlora` ~5740, `_EARTH_NAMES` ~8625, `_earthNamePass` ~8631, `_storeSpecies` ~8640, `_cradle` flagging ~2222–2228.

## 7. Open questions / pending
- `FA_LIMBS` and `FA_EYES` are both length-6 arrays that intentionally alias `FA_SIZE`'s length, so a size roll and a limbs/eyes roll share the same modulus — deliberate, but worth remembering if `FA_SIZE` ever changes.
- The named-Earth rosters are app-layer strings with no test coverage tying a specific seed→name; only the "no duplicates per world" invariant is structural.
