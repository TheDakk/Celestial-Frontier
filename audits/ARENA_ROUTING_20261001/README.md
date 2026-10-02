# Arena routing: every creature on its home ground (Claude, 2026-10-01)

Matches code as of 2026-10-01 (branch `anthropic/overnight-arena-routing`). This is Claude's side of C132 program item 1. Codex
paints FAR/MID/NEAR plate sets per biome family. Each accepted set is registered with one line, and battles route to it with no code change.

## What was built

| Piece | File | What it does |
|---|---|---|
| Biome vocabulary | `port/v2/apps/game/src/battle2/arena-registry.ts` `ARENA_BIOME_WORLD_TYPE` | Maps the 43 live biomes to the 8 world types (terran, ocean, ice, desert, rocky, venus, lava, gas). The map is read from the generator's own `BIOME_SETS` (`@cf/domain-strays`) and checked at load against `BIOME_PROFILE_KEYS_V1`. No biome is invented. |
| Routing | same file, `selectArena(context, sets?)` | Battle context `{kind, contextId, seed, round, worlds}` gives the fight world, its biome, then a plate set, plus `owner`, `match` and a `reason`. Pure: no clock, no `Math.random`. |
| Delivery check | `battle2/arena-delivery.ts` `validateArenaDelivery` | Checks a plate set mechanically and returns every failure, each with its own diagnosis. |
| Registration | `port/v2/tools/morph/arena-deliveries.json` → `tools/morph/arena-sets.mjs` → `battle2/arena-sets.generated.json` | One line per accepted delivery manifest. The generator checks paths and runtime hashes and writes the routed rows. `build-shipped-battle2.mjs` runs it and ships each set's runtime files. |
| Wiring | `apps/game/src/battle2-wiring.ts` | `selectArena` runs before the plates load. The study then fetches the routed set's recipe and plates and passes the routed world as both habitat worlds, so the medium agrees with the painting. `status().arenaRoute` carries the reason. New optional input: `arenaContext {kind, round, seed}`. |
| Temperate delivery manifest | `earth-temperate-v1.delivery.json` (this folder) | The accepted Earth temperate template v1, written from `ARENA_V1_ACCEPTANCE_20260912/acceptance.json`. |
| Painting order | `rank.mjs` → `rank.json` (this folder) | Reproducible ranking, explained below. |

### Routing rules
- **Fight world (home-versus-visitor).** Wild fights use the wild creature's world (`worlds.home`). Guardian fights use its lair
  (`worlds.home`). In a duel, host (`home`) and visitor alternate by round, and the first host is seeded from `contextId:seed`. This is
  exactly the rule in `compileHabitatBattle`. `fightWorld` repeats it, and a test checks 1,080 contexts against the compiler, so the
  game has one rule, not two. The old stub (`duelIndex`, "host first") is gone.
- **Plate set**, tried in order:
  1. A set painted for the world's own biome (`match: 'biome'`).
  2. A set painted for another biome of the same world type (`'kin'`). For example, one painted ocean set covers all 7 ocean biomes
     until each gets its own.
  3. The accepted Earth temperate set (`'fallback'`). On a world with liquid, the reason also notes that the stage's procedural wet
     arena draws the water for a side in water (unchanged).
  4. With no world context the result is `'default'`. This is every battle today, because `main.ts` passes no `worlds` yet.
- When a biome has several sets, the choice is seeded by the **world** (`key#seed`). A world always shows the same home ground, battle
  after battle.
- With only the temperate set registered, the 43 biomes resolve to 1 `biome`, 10 `kin` (terran) and 32 `fallback`.

### Current battles
Routing, placement, habitat, layout and seeds are byte-identical. With no world context, the same recipe, FAR and NEAR are fetched at
the same paths. **One intended pixel change:** at Codex's request (mailbox C132), the MID plate is now the delivery manifest's runtime
MID. That is the approved despilled copy `audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png`: alpha is identical and 190 RGB
edge pixels change, which the test proves.

The shipped mirror changed by exactly one file swap:
- `keyed/arena-mid.png` was removed.
- `ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png` was added.
- `MANIFEST.json` and `battle2-assets.json` were re-pinned by the builder.

To revert the MID change, set `plates.mid.runtime` in the temperate delivery manifest back to the keyed MID.

## Delivery contract for Codex (what makes a set registrable)

Deliver, under `audits/<YOUR_FOLDER>/`:

1. **Three painted masters**, each 2560 × 1440, painted separately (never one image sliced). The accepted temperate v1 at 1672 × 941 is
   the only exemption, and it is bound to its three master SHA-256 values.
   - **FAR**: full-bleed opaque scene. Every alpha is 255, and at most 0.5 % of pixels are key magenta.
   - **MID** and **NEAR**: key-painted terrain on flat #FF00FF.
2. **Keyed runtime copies of MID and NEAR** (alpha 0 in the key field), from intake like `ARENA_EFFECTS_V42_PROOF_20260912/intake.mjs`,
   plus any approved intake correction such as a despill copy.
3. **`arena-recipe.json`** in the accepted shape (`cf.arena.authoring-proof/v1`):
   - `battleContext.biomeFamily`: one of the 43 live biome keys (for example `archipelago`, `packice`, `canyon`).
   - `seed`: uint32.
   - `groundLineNormalized`: 0.78.
   - `horizonBandNormalized`: inside (0, 0.78).
   - `standsNormalizedX`: [1/3, 2/3].
   - `systemCard`: non-empty.
   - `layers`: `{far: "opaque scene", mid: "magenta-keyed terrain", near: "magenta-keyed terrain"}`.
   - `extractedMasks`: false.
   - `canvasSize`.
   - `plates`: `[arena-far.png/scene, arena-mid.png/key-painted terrain, arena-near.png/key-painted terrain]`, each with its
     **master** `sha256` and `groundLineNormalized` 0.78.
4. **Pixel rules the check measures.** Thresholds come from the accepted set and live in `ARENA_PLATE_LIMITS`.
   - MID and NEAR are at least 10 % key, and their top row is at least 95 % key (no painted sky).
   - The 0.99 row is at least 90 % terrain.
   - MID terrain covers at least 98 % of the fighting path (x 0.2–0.8) on y = 0.78, and starts above 0.78 at both stands.
   - NEAR content starts no higher than y = 0.76 at either stand, so the stands and paws stay clear.
5. **`acceptance.json`** (`cf.arena-template-acceptance/v1`, written after Dakk accepts it):
   - `qualityAccepted`: true.
   - `acceptanceAuthority`.
   - `groundLineNormalized`: 0.78.
   - `plates[]` named `arena-far` / `arena-mid` / `arena-near`, each with `qualityAccepted` true and `masterSha256` equal to the recipe's.
6. **The delivery manifest `<id>.delivery.json`** (`cf.arena-delivery/v1`). Copy `earth-temperate-v1.delivery.json`:
   ```json
   { "schema": "cf.arena-delivery/v1", "id": "archipelago-v1", "biome": "archipelago",
     "recipe": "audits/<F>/arena-recipe.json", "acceptance": "audits/<F>/acceptance.json",
     "plates": { "far":  { "master": "audits/<F>/arena-far.png",  "runtime": "audits/<F>/arena-far.png",        "runtimeSha256": "…" },
                 "mid":  { "master": "audits/<F>/arena-mid.png",  "runtime": "audits/<F>/keyed/arena-mid.png",  "runtimeSha256": "…" },
                 "near": { "master": "audits/<F>/arena-near.png", "runtime": "audits/<F>/keyed/arena-near.png", "runtimeSha256": "…" } } }
   ```
   Every path is repo-relative under `audits/`. The `runtime` entries are the files the stage draws (an approved despilled MID goes
   here). `runtimeSha256` must equal their bytes.

### How a manifest row is consumed
1. Add the manifest's path as **one line** in `port/v2/tools/morph/arena-deliveries.json`.
2. Run `node tools/morph/build-shipped-battle2.mjs` from `port/v2`. Running `node tools/morph/arena-sets.mjs` alone regenerates only
   the rows, not the shipped files.
   - `arena-sets.mjs` reads the manifest, refuses bad paths, missing files or a wrong `runtimeSha256` by name, and writes
     `apps/game/src/battle2/arena-sets.generated.json` (id, biome, runtime recipe/far/mid/near, masters, acceptance).
   - The builder copies the runtime recipe and plates into `apps/game/public/battle2/audits/…` and re-pins `battle2-assets.json`.
3. `npx vitest run apps/game/src/battle2/arena-registry.test.ts`. The drift gate fails if the generated rows differ from the manifests.
   For every row it then checks:
   - the runtime set and the painted masters pass `validateArenaDelivery`;
   - the recipe's master hashes equal the master bytes;
   - `recipe.battleContext.biomeFamily` equals the row's biome;
   - the shipped mirror is byte-identical.
4. At runtime, `selectArena` matches the row by `biome`, so every battle on a world of that biome uses it, and its world type's other
   biomes use it as kin. `arenaSetAssets(row)` turns the repo paths into paths relative to the arena proof directory, which is what the
   wiring's asset source fetches. No code changes.

## Painting order (ranked by accepted creatures, then roster species)

How to read the ranking:
- Earth's roster (`earth-fauna-profiles.ts`, 631 species) carries no per-species biome. Each biome's live profile lists the fauna
  families it hosts (`BIOME_PROFILES_V1.fauna`), and that list is the join.
- The only authored step is the profile-group → fauna-family table in `rank.mjs`. Annelids and the tardigrade map to no profile family.
- The accepted set is the 179 species in `GENERATED_GALLERY_20260927/coverage.json`.
- Ties break by the generator's biome weight.
- Full data: `rank.json`.

| Rank | Biome (world type) | Accepted | Roster | Notes |
|---:|---|---:|---:|---|
| 1 | archipelago (ocean) | 124 | 294 | birds, crabs, fish, reptiles. **Covers all 7 ocean biomes as kin** |
| 2 | mangrove (terran) | 124 | 294 | wetland: crabs, fish, birds, reptiles |
| 3 | marsh (terran) | 114 | 279 | wetland: birds, amphibians, insects, fish |
| 4 | volcisle (ocean) | 108 | 242 | |
| 5 | packice (ice) | 108 | 238 | marine mammals, birds, fish. **Covers all 4 ice biomes as kin** |
| 6 | stormsea (ocean) | 108 | 238 | |
| 7 | canyon (desert) | 101 | 331 | reptiles, birds, mammals. **Covers all 5 desert biomes as kin** |
| 8 | swamp (terran) | 94 | 229 | |
| 9 | temperate (terran) | 91 | 340 | **painted (accepted v1)** |
| 10 | savanna (terran) | 91 | 324 | grassland |
| 11 | glacier (ice) | 85 | 299 | |
| 12 | tundra (terran) | 85 | 279 | |
| 13–18 | coral, opensea, abyssal (ocean); cryogeyser, blueice (ice); milksea (ocean) | 72 each | 131–176 | |
| 19 | dunesea (desert) | 71 | 283 | |
| 20 | boulder (rocky) | 65 | 238 | **covers rocky as kin** |
| 21–23 | jungle (58), karst (55), crystalsteppe (55) (terran) | | | forest, cave |
| 24–35 | saltflat, saltpan, oxide, graben, fungal, cratered, ashwaste, geode, carbon, glass, emberfield, sulfurdeck | 6–42 | | |
| 36–43 | banded, stormeye, obsidian, ammonia, acidhaze, abyssgreen, magmasea, hotglow | 0 | 0–15 | no accepted creature lives there yet |

By world type (distinct species living in any of its biomes):

| World type | Biomes | Accepted | Roster |
|---|---:|---:|---:|
| terran | 11 | 179 | 570 |
| ice | 4 | 157 | 439 |
| ocean | 7 | 124 | 357 |
| desert | 5 | 107 | 385 |
| rocky | 5 | 71 | 283 |
| lava | 4 | 6 | 54 |
| venus | 3 | 6 | 45 |
| gas | 4 | 0 | 15 |

**Recommended order.** The ranking plus the kin rule means one set per world type first lifts the most fallbacks:

| Step | Set | Why |
|---:|---|---|
| 1 | **archipelago** | ocean: 7 biomes off fallback |
| 2 | **mangrove** | terran wetland |
| 3 | **packice** | ice: 4 biomes |
| 4 | **canyon** | desert: 5 biomes |
| 5 | **marsh** | |
| 6 | **savanna** | grassland |
| 7 | **tundra** | |
| 8 | **boulder** | rocky: 5 biomes |
| 9 | **coral** / **opensea** | reef and deep water get their own look |
| 10 | **jungle**, **karst** | forest, cave |
| 11 | the rest by rank | |

This matches the C132 program's order (water first, then desert, snow, forest, grassland, wetland, cave), translated to live biome keys.

## Tests and controls (numbers)
- `apps/game/src/battle2/arena-registry.test.ts`: **25/25 PASS**. It covers:
  - the vocabulary;
  - the drift gate;
  - each registered set validated from its real files;
  - wiring path equality;
  - the despill delta;
  - delivery-manifest refusals;
  - routing for wild, guardian and duel;
  - agreement with `compileHabitatBattle` (1,080 contexts);
  - determinism with `Date.now`/`Math.random` trapped (also with several sets per biome);
  - fallback reasons for all 43 biomes;
  - per-world pick;
  - mutants: wrong size, opaque MID, missing plate, wrong ground line (recipe, plate, painted), an unexempt look-alike, FAR
    transparency, NEAR over the stands, sky in the key, an unaccepted or mismatched acceptance record, and a synthetic 2560 × 1440
    delivery that passes.
- **Negative controls: 17/17 caught.** Each new check was disabled on purpose, the suite was confirmed to fail, and the check was
  restored. The checks controlled:
  - MID key share;
  - recipe ground line;
  - MID path pixels;
  - kit canvas;
  - plate size;
  - missing plate;
  - FAR opacity;
  - NEAR stands;
  - exemption hash binding;
  - acceptance hashes;
  - duel rule flipped;
  - unseeded first host;
  - kin tier removed;
  - per-battle clock pick;
  - wet reason dropped;
  - generated-rows drift;
  - delivery hash check.

  The first run **missed** the clock-in-pick control: with one set per biome, the seeded pick short-circuits. The determinism test now
  also runs with several sets per biome, and the control is caught.
- `apps/game/src/battle2-wiring.test.ts`: one new outcome test (22/22 in the file). It covers the default route label, a guardian lair
  on an unpainted canyon world (route reason plus habitat placed on the lair), and a two-round duel where the plates' world equals the
  habitat world every round. Control: passing `input.worlds` to placement instead of the routed world fails it (caught).
- Targeted run: 21 files, 220 passed, 2 expected-fail (`it.fails` R3 pins, unchanged). Covers `battle2/`, wiring, matchup, archetypes,
  master pins, battle-habitat, art-library, `tests/battle2-arena`, `pwa-battle2-assets`, `pwa-art-library`, `pwa-offline` and
  `tracked-input-preflight`.
- `npm run typecheck` (all three configs): clean.
- `tests/battle2-arena.test.ts`: the old stub's two `selectArena` cases moved to the new suite. They asserted "host first", which
  contradicted the habitat compiler's seeded rule. The composition, parallax, scale and no-clock cases stay (4/4).

## Live worlds (2026-10-02, branch `anthropic/overnight-live-worlds`)
`main.ts` now passes the encounter's world to the stage: `...m.liveArenaInput(settlement)` in the one gated call.
- **Builder.** The builder is `apps/game/src/battle2-live-worlds.ts`. It is pure and deterministic, and the arena seed is
  fnv1a32(battle id).
- **Where the world comes from.**
  - The settled encounter's own CF1 address (`encounter.identity.world`).
  - That address is resolved by replaying the generator (`resolveCF1WorldAddress`) and projected with `projectWorldOpportunity`.
  - The biome is the generator's own `biomeFor` result.
  - Open water uses the biome vista's rule (`biome-vista-surface.ts` `surfaceWater`, now exported): liquid gives water with a
    surface; frozen or none gives no liquid.
- **Encounter kind.**
  - A `fauna` defender is a wild fight on its world.
  - A Guardian or Titan fights in its lair, which is the encounter's world.
  - Duels take host and visitor worlds plus a round (`liveBattleArena`). No live duel reaches the stage yet.
- **Earth.** Earth stays on the accepted temperate set with `worlds` null, so placement is byte for byte as before. It uses the
  `earth` preset: a side that lives in water is staged on the lake world instead of being refused. The route reason names Earth.
- **What a battle shows today.** With only the temperate set registered, every live battle draws the same plates and the same scene.
  Only `status().arenaRoute` and the habitat label's world name change.
  - `battle2-wiring.test.ts` proves it frame by frame over 12 s of play, for Earth, a deep-galaxy world and every other Sol planet, as
    wild and as guardian fights.
  - `battle2-live-worlds.test.ts` proves that a synthetic second registered set (canyon) is chosen for canyon worlds and as kin for
    desert worlds.
- **Physical facts not applied (decision for Dakk).** Every generated world is given solid ground and air. The stage always paints
  both. Applying "a gas giant has no ground" or "an airless rock has no air" would refuse fights that play today.

The native film harnesses now take their plates from `arena-sets.generated.json` (`tools/battle2-proof/arena-plates.mjs`). See
`audits/GUARDIAN_CHOREOGRAPHY_20261001/FILM.md`.

## Not done / open
- A painted ocean set will show water in its plates while the stage still draws its procedural `WATER_BANDS` over a swimmer's side. A
  per-set "paints its own water" flag is a decision for Dakk and Codex once the first wet set exists. It is not added here.
