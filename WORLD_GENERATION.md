# Celestial Frontier — World & Universe Generation

**STATUS:** matches code as of 2026-07-23 (verified against main.js).
**Purpose:** the design contract for how Celestial Frontier grows an entire universe — galaxies, star systems, stars, planets, orbits, and the biome/climate layer — from nothing but seeds, on demand, identically for every player.
**Source of truth:** this doc is the DESIGN spec; main.js implements it. Content catalogs live in BIOME_ATLAS.md; art rules in ART_DIRECTION.md.

## 1. Overview

The universe is **procedural, infinite, and cell-based**. Nothing is stored — every galaxy, star, planet and biome is *recomputed from a seed* the instant it scrolls into view, then FIFO-cached. Two players on two devices who fly to the same coordinates see the byte-identical world, because every roll flows through the same three seeded primitives (`mulberry32`, `hashInt`, `cellRng`) and never through `Math.random()` / `Date.now()`.

The world is built in nested layers, each addressed by an integer grid cell and seeded so a cell can be generated in isolation:

- **Intergalactic space** — `UCELL`-sized (400 u) cells hold galaxies, placed on a cosmic-web density field.
- **A galaxy** — a spiral profile (arms, wind, hue) with its own `GCELL`-sized (42 u) star cells and a finer `FCELL` (14 u) layer that resolves as you zoom.
- **A star system** — generated on entry from the star's seed: a stellar class, 0–N planets on widening orbits, plus belts, comets, dwarfs, moons, a habitable zone.
- **A planet** — an archetype (`planetParams`) that fixes type, size, moons, rings, hue.
- **The survey layer** — `climateBand` + `biomeFor` read the planet against its orbit/star to attach a climate band and a biome, driving the card text, the wildlife roster, and the landing vista.

One region is hand-anchored: the **home galaxy** (Milky Way, seed `999`) always contains **Sol** (seed `424242`), a hand-authored 8-planet system with **Earth** (seed `133`) as the settled cradle.

## 2. Generation hierarchy & rules (galaxy → system → planet → biome/climate)

### 2.1 Galaxies — `galaxiesInCell(cx,cy)` (~928)
- Cell RNG: `cellRng(1, cx, cy)`. Density comes from a shared cosmic-web noise field `UNOISE = makeNoise(8181)`: `web = clamp((UNOISE(cx·0.11, cy·0.11, 4) − 0.34)/0.42, 0, 1)`. Galaxies cluster on filaments; voids stay dark.
- Population: `n=1` if `r() < 0.05 + web·0.85`; +1 more if `r()<web·0.45`; +1 more if `r()<web·0.18` (0–3 primaries per cell).
- Each galaxy gets a random position inside the cell, `size 26–96`, a sprite index, tilt, rotation, and `seed = hashInt(2, cx·7+i, cy·13−i)`.
- Extras (all seeded rolls): interacting merger pairs (`r()<0.045`), satellite dwarfs for big galaxies (`size>62 && r()<0.7`), rare quasars/blazars (`~0.012·web`), radio galaxies (`~0.010·web`).
- **Home injection:** the cell containing `HOME_POS {x:90,y:-60}` always appends the fixed home galaxy `{size:78, seed:999, home:true}` — this is deterministic placement, not a roll.

### 2.2 Inside a galaxy — profile, stars, deep-sky — `galaxyProfile` / `starsInCell` / `fineStarsInCell` (~992, ~1148, ~1118)
- `galaxyProfile(seed)`: `arms = 2 or 3` (`r()<0.35` ⇒ 3), `wind = 0.22–0.29`, `hue` picked from `[215,195,45,355,265]`.
- `starsInCell(gseed, prof, cx, cy)` (GCELL=42): a logarithmic-spiral density model. For a cell at radius `rad` from the galactic center it computes an arm-phase, an `armBoost` gaussian, and `dens = e^(−rad/130)·3.2 + 0.22 + armBoost·1.25·e^(−rad/850)`, then places `floor(dens · r() · 4.1)` stars. Each star's `seed = hashInt(gseed^0xabc, cx·31+i, cy·17+i·3)` and its color/size come from `starClass(seed)`.
- **Core void:** a supermassive black hole clears the center — stars with `cd<34` are dropped, and `cd<85` thins probabilistically. Same math in the fine layer (`fineStarsInCell`, FCELL=14, `gseed^0x9d2c`), so zooming in resolves haze into the *same* stars.
- Deep-sky deco (nebulae along arms, globular clusters in the `GR<rad<GR·1.7` halo, rogue planets, remnants) are seeded rolls off the same cell RNG. `GR = 1200` is the galactic disk radius.
- **Sol injection:** the home galaxy's cell containing `SOL_POS {x:560,y:170}` always appends the Sol star (`seed 424242`, `sol:true`).
- Two epoch-anchored systems layer on top: `galaxyWormhole(seed)` (a wormhole hides in ~6% of galaxies) and `supernovaSites(gseed, epoch)` (1–3 fresh remnants + newborn protostars per cosmic epoch — deterministic per epoch, so the galaxy *ages* identically for everyone).

### 2.3 Star class — `starClass(seed)` (~866)
A single roll `r()` off `mulberry32(seed ^ 0x9e37)` maps to a stellar type (Sol is forced to class G). Governs color, drawn radius `r`, planet count, and habitable-zone distance:

| roll < | kind | meaning | drawn r |
|---|---|---|---|
| 0.08 | BD | brown dwarf | 9 |
| 0.50 | M | red dwarf (most common) | 16 |
| 0.63 | K | orange dwarf | 22 |
| 0.76 | G | sun-like yellow | 26 |
| 0.84 | A | white | 34 |
| 0.875 | B | blue giant | 46 |
| 0.90 | PROTO | protostar (disk, no planets) | 18 |
| 0.935 | RG | red giant | 62 |
| 0.95 | SG | red supergiant | 80 |
| 0.968 | WD | white dwarf | 7 |
| 0.982 | NS | neutron star / pulsar | 5 |
| 0.989 | MAG | magnetar | 5 |
| else | BH | stellar-mass black hole | 10 |

### 2.4 Star system — `systemFor(starSeed)` → `_systemFor` (~1216)
Cached (`_sysCache`, cap 240). Sol short-circuits to the hand-authored system. Otherwise, from `r = mulberry32(starSeed)`:
- **Companions:** main-sequence stars (`MKGAB`) are binary with `r()<0.24`, and those trinary with a further `r()<0.22`.
- **Planet count & first orbit** depend on class: compact remnants (BH/NS/MAG) get `floor(r()·2)`, WD `floor(r()·3)`, PROTO `0` (disk), BD `floor(r()·3)`, giants (RG/SG) `1+floor(r()·4)`, ordinary stars `floor(r()·7) + (M?0:1)`.
- **Orbits widen outward:** each planet adds `26 + r()·32` to `orb`; generation stops at `orb > SYS_R−14` (`SYS_R = 320`). Each planet: `name = properName(seed,2)`, `seed = hashInt(starSeed, i·101+7, i·53+3)`, `P = planetParams(seed)`.
- **System furniture** (seeded rolls, in order — order matters for determinism): asteroid belt between two orbits (`r()<0.4`), comets on stretched ellipses (`r()<0.55`), a Kuiper ring (`r()<0.5`), dwarf planets (`r()<0.45`), a rare 'Oumuamua-style interstellar visitor (`r()<0.16`).
- **Habitable zone:** `HZB` table keyed by class `{BD:24,M:42,K:72,G:108,A:158,B:225,RG:235,SG:255}`; if it fits, `sys.hz = [HZB·0.82, min(HZB·1.32, SYS_R−6)]`. This is what `climateBand` reads.

### 2.5 Planet archetype — `planetParams(seed)` (~187)
From `r = mulberry32(seed)`, one roll picks the **type** by fixed weights:

| roll < | type | share |
|---|---|---|
| 0.30 | gas | 30% |
| 0.45 | rocky | 15% |
| 0.60 | desert | 15% |
| 0.72 | ice | 12% |
| 0.82 | terran | 10% |
| 0.90 | ocean | 8% |
| 0.95 | venus | 5% |
| else | lava | 5% |

Then rings (`r()<0.16`, re-rolled for gas to `r()<0.35`), moons, and per-family color params. Gas giants get a banded `hue` family, an optional Great-Red-Spot (`spot`), `sizeMul 1.7–2.5`. Solid worlds get `hue 0–360`, `sizeMul 0.7–1.3`, `seaHue`, `landHue`, `iceAmt`. **Moon count is re-derived** from size (see §6). `surfaceColor` (~238) later synthesizes the actual pixel surface from `type`, `hue`, fBm noise, and the card facts.

### 2.6 Climate band — `climateBand(P, sys, orb)` (~1356)
Attaches one of `temperate | hot | cold | frozen`, in priority order:
1. **Earth (`P.seed===133`) is always `temperate`** (hard anchor).
2. If the star has an HZ: `orb < hz[0]·0.92` ⇒ `hot`; `orb > hz[1]·1.12` ⇒ `cold`; else `temperate`.
3. No HZ + dead/exotic star (BH/NS/WD/MAG/PROTO) ⇒ `frozen`; giant (RG/SG) ⇒ `hot`.
4. Type fallback: lava/venus ⇒ `hot`; ice ⇒ `frozen`; else `cold`.

The band drives every survey phrase (`atmosphereText`, `climateText`, `waterText`, ~1317–1349) and, crucially, filters the biome pool.

### 2.7 Biome — `biomeFor(P, band)` (~7538)
A pure layer *inside* each of the 8 types, seeded from its **own** hash stream so it can never change a world's type or perturb the determinism fingerprint:
- **Earth returns `null`** — home is never re-labeled.
- Candidates = `BIOME_SETS[P.type]` filtered to those whose `bands` include the current band (`frozen` reads as `cold`); if none qualify, the full set is used.
- Weighted pick via `r = mulberry32(hashInt(P.seed, 0xB10E, 7))`. Rare biomes (`rare:1`) carry tiny weights, so wonders stay wonders.
- The chosen biome supplies the card's Biome flavor line, its `land` % (feeds the landing/descent ladder, `descentTierFromPct` ~7550), and the vista's scene key.

### 2.7a The landing roll — `biomeForLanding(P, band, salt)`
Distinct from the anchor biome above, this rolls the **touch-down region** you actually descend into, `%`-weighted by the world's `biomeComposition`, and is now **re-rolled PER LANDING** via a salt of `epoch*997 + stats.landings` (was per-20-min-epoch only, so repeat descents in the same epoch always looked identical).
- **EARTH (seed 133)** was previously special-cased OUT of this roll (always the same vista); it now rolls its OWN real-surface composition `_EARTH_LANDING` (keys resolved from `BIOME_SETS`): **~71% water** (opensea 58 / coral 4 / archipelago 5 / stormsea 3 / volcisle 1) and **~29% land** (temperate 7 / jungle 4.5 / savanna 4.5 / tundra 4 / saltflat 2 / karst 2 / marsh 1.5 / swamp 1.5 / mangrove 1.5). Histogram over 200 rolls verified opensea ~55%, savanna ~7.5%, temperate ~7%, jungle ~5%, tundra ~4%.
- **CRITICAL — presentation only.** This picks the landing *scene/region*; the world's ANCHOR biome (`biomeFor`, which drives veins, deposits, capture odds, and all generation) is untouched, so determinism / fingerprint hold (**fp MATCH 50/50**).
- **Caveat:** training's first Earth landing now also rolls, so it has a ~55% chance of an ocean splash-down rather than the old fixed land vista.
- The vista then picks fauna to match the rolled region (see ART_DIRECTION.md "THE LANDING ROLL (vista side)").

### 2.8 World → vista (reference only; detail in ART_DIRECTION.md)
On planetfall the descriptor's facts (band, biome, water state, life, civ era, star color, moons, rings) are passed to `hdVista(opts)` (~6260) to paint a 960×430 surface scene, or to `_hdDeckScene` (~7120, gas giants) / `_hdAbyssScene` (~6118, ocean/abyssal). The vista re-seeds its own presentation-only streams (`seed^0x9d7`, `^0x1A70`, `^0x0B0E`) so two same-type worlds are different paintings while staying per-seed deterministic. **These are art layers, not world generation** — art rules live in ART_DIRECTION.md.

## 3. Planet types & key tables (real values)

**`TYPE_LABEL`** (~1305) — the 8 frozen types and their card sub-titles:

| type | label |
|---|---|
| rocky | Rocky world |
| terran | Terran (Earth-like) world |
| ocean | Ocean world |
| ice | Ice world |
| desert | Desert world |
| gas | Gas giant |
| venus | Venusian hothouse |
| lava | Molten world |

**`BIOME_SETS`** (~7477) — biome catalog per type (name · weight `w` · `land%` · band gate · `rare`). Full flavor text lives in the source / BIOME_ATLAS.md; the design shape:

- **terran** (11): temperate·24, savanna·12 (temp/hot), jungle·10, marsh·8, swamp·7, mangrove·5, tundra·12 (cold), karst·5, saltflat·8 (hot), **fungal·1.6 rare**, **crystalsteppe·1.4 rare**.
- **ocean** (7): opensea·20, archipelago·14, coral·10 (temp), stormsea·8, volcisle·5, abyssal·7, **milksea·1.4 rare**.
- **ice** (4): glacier·18, packice·12, cryogeyser·8, **blueice·2 rare**.
- **desert** (5): dunesea·18, canyon·10, saltpan·8 (hot), oxide·10, **glass·1.6 rare**.
- **rocky** (5): cratered·18, boulder·10, graben·8, **geode·2.4 rare**, **carbon·1.6 rare**.
- **venus** (3): sulfurdeck·10, acidhaze·12, abyssgreen·4.
- **lava** (4): ashwaste·10, emberfield·10, obsidian·7, magmasea·4.
- **gas** (4): banded·16, ammonia·8, stormeye·4, **hotglow·3 rare**.

**`COMP`** (~1307) gives each type a one-line composition string (e.g. terran = "Iron–nickel core, silicate mantle, liquid-water oceans, continental crust").

## 4. Anchor seeds & constants (real values)

From **`WorldConfig`** (~843) and **`StarCatalog`** (~864):

| constant | value | meaning |
|---|---|---|
| `UCELL` | 400 | intergalactic cell size |
| `OBS_R` | 5200 | observable-universe radius |
| `HOME_GAL_SEED` | **999** | the Milky Way |
| `HOME_POS` | **{x:90, y:-60}** | home-galaxy world position |
| `GR` | 1200 | galactic disk radius |
| `GCELL` | 42 | star cell size (main layer) |
| `FCELL` | 14 | fine star cell size (zoom layer) |
| `SOL_SEED` | **424242** | our Sun |
| `SOL_POS` | **{x:560, y:170}** | Sol's position inside the home galaxy |
| `SYS_R` | 320 | star-system radius (orbit ceiling) |
| `UNOISE` | `makeNoise(8181)` | cosmic-web density field |
| `PLAYER_SEED` | **0x50A1E5** | stable seed for the player's own combatant/avatar (CombatCore ~11187) — not world gen, but a fixed anchor |
| Earth seed | **133** | the settled cradle (`P.seed===133` special-cased in `climateBand`, `biomeFor`, `planetDescriptor`) |

**Hidden salts** (XORed into seeds to fork independent streams): galaxy placement `hashInt(2,…)`, star placement `gseed^0xabc`, fine layer `gseed^0x9d2c` / `gseed^0x77aa`, star class `seed^0x9e37`, name RNG `seed^0x5f3759df`, wormhole `seed^0x7777`, biome `hashInt(P.seed,0xB10E,7)`, descriptor `P.seed^0x1234567`, planet thumb & vista streams `seed^0x9d7 / ^0x1A70 / ^0x0B0E`.

**`SOL_PLANETS`** (~899) — hand-authored, not generated by `planetParams`. Seeds 131–138 = Mercury…Neptune (Earth=133), each with fixed type/orb/size/moons. `_SOL_SEEDS = {131…138}` (~15202) gates the early charter objectives.

**`starClass` HZ table** `{BD:24,M:42,K:72,G:108,A:158,B:225,RG:235,SG:255}` (~1289).

## 5. Data / save fields

**None.** The universe is *never* persisted — it is regenerated from seeds on demand and held only in bounded FIFO caches (`ugCache` 3000, `starCache` 4000, `fineCache` 8000, `_sysCache` 240, `_wormCache` 600, `_snovaCache` 200, `CARD_FACTS` 6000, `hazeCache` 3). What the save *does* hold is the player's relationship to worlds (settled/conquered flags, per-world logs, tutorial/charter progress) keyed by planet/star seed — those live in the SaveSystem spec, not here. Save key: `cfcc_save_v2`.

`CARD_FACTS` (~357) is a side map (`P.seed → {band, lush, civLights}`) written by `planetDescriptor`/vista code and read by the sprite/thumb art. It is deliberately **off** the `P`/`sys`/`pl` objects so it cannot leak into the determinism fingerprint.

## 6. Determinism

**Everything world-facing is seeded** through three primitives in the `Rand` module (~140): `mulberry32(a)` (the PRNG), `hashInt(seed,x,y)` (a 3-input integer hash for coordinate→seed), and `cellRng(seed,x,y) = mulberry32(hashInt(...))` (per-cell streams). No `Math.random()` / `Date.now()` touches generation — Hard Rule #1. The same seed always yields the same galaxy, star, system, planet, biome, and wildlife on every device.

**The 50-probe fingerprint:** `node tools/validate.js` reassembles the build and runs a determinism fingerprint that must match the v1.0 baseline byte-for-byte (release notes call it a "50-probe fingerprint"; the CLAUDE.md build note still says 49 — the release-notes number is current). The fingerprint **serializes the `P`/`sys`/`pl` objects**, which is *why* presentation facts are quarantined in `CARD_FACTS` and why the biome layer runs on its own `^0xB10E` hash stream: adding fields to those objects, or changing an existing roll's order, would shift the baseline and fail the build. New procedural layers must fork a fresh salt rather than consume from an existing stream.

**Re-pin history — there is one, inside `planetParams` (~187):** two properties are rolled and then *overwritten* while intentionally preserving the RNG advance so older worlds don't shift:
- `ring` is first set at `r()<0.16` (line ~199); for gas giants it is **re-pinned** to `r()<0.35` (~206).
- `moons` is first set to `Math.floor(r()*3)` (~199), then **re-pinned entirely** by the size-scaled block (~214–221): `base = max(0, round((sizeMul−0.85)·3.1))`, `+4` for gas, `+1` for ice/ocean/terran, plus `floor(r()·max(1, round(sizeMul·2.2)))`, capped at 16.

The first `moons`/`ring` rolls are discarded values but their RNG consumption is deliberately kept, so the re-pin is determinism-safe. Similarly `systemFor`'s binary/trinary separations are clamped **after** generation "post-adjustment — no RNG consumed" (~1255) so the universe layout is unchanged. `planetDescriptor` (~2192) runs on its own stream `mulberry32(P.seed^0x1234567)`, keeping biosphere/civilization rolls independent of the archetype and orbit streams.

## 7. Code anchors (functions + ~line numbers)

- **`@module Rand`** (~140): `mulberry32` (143), `hashInt` (144), `cellRng` (151), `makeNoise` (154), `mix`/`clamp`.
- **`@module PlanetGen`** (~185): `planetParams` (187), `surfaceColor` (238), `gasPalette` (230).
- **`@module Naming`** (~822): `properName` (825), `starName` (832), `galaxyName` (831).
- **`@module WorldConfig`** (~843): all anchor constants (845–853).
- **`@module StarCatalog`** (~864): `starClass` (866), `KIND_DESC` (884), `SOL_PLANETS` (899).
- **`@module WorldGen`** (~918): `galaxiesInCell` (928), `galaxyProfile` (992), `galaxyWormhole` (998), `supernovaSites` (1017), `galaxyHaze` (1047), `fineStarsInCell` (1118), `starsInCell` (1148), `systemFor`/`_systemFor` (1216/1224), `genRocks` (919).
- **`@module SurveyPhrases`** (~1303): `TYPE_LABEL` (1305), `COMP` (1307), `atmosphereText` (1317), `climateText` (1331), `waterText` (1343), `gravityText` (1350), `climateBand` (1356).
- **`planetDescriptor`** (2192) and `starDescriptor` (2297) — assemble the survey cards; `CARD_FACTS`/`_cardFactsSet` (357–363).
- **`@section biomes`** (~7464): `BIOME_SETS` (7477), `biomeFor` (7538), `descentTierFromPct` (7550).
- **Vista (art, reference only):** `@section` around 4328; `_hdAbyssScene` (6118), `hdVista` (6260), `_hdDeckScene` (7120); `planetThumb` (472).

## 8. Open questions / pending

- **v1.6 Phase 4 biome→color is planned** — biome will drive the planet's surface/thumb palette (not just the vista scene). See ART_DIRECTION.md. Today `biomeFor` feeds card text, the descent ladder, and the vista scene key, but `surfaceColor` still keys mainly off `type` + `hue` + `CARD_FACTS.band`.
- **Eyeball World deferred** — the tidally-locked red-dwarf terran biome is noted in the source but held back; an honest tidal lock needs a Seasons-row domain change (a Nick decision) that would touch the survey card, so it is intentionally absent from `BIOME_SETS.terran`.
- **Probe-count wording drift:** release notes say "50-probe fingerprint"; the CLAUDE.md build note still reads "49-probe". Same test, stale number in the build note — worth reconciling.
