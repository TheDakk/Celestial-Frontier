# Celestial Frontier — Rarity & Grades System

> **⚠ LIVE-BUILD REFERENCE (v1.6.4) — SUPERSEDED IN v1.7 SOURCE.** This doc describes
> the **LIVE v1.6.4 15-grade ladder**. The v1.7 SOURCE has moved to the canonical
> **10-tier ladder** in `RARITY_UNIVERSAL.md` (`RARITY_V17`/`displayRarity` —
> Common..Transcendent, no glyphs, raw tiers 10+ clamp to Transcendent). Until v1.7
> ships to players, this doc remains the live-build reference; on the v1.7 deploy it is
> **deleted** per the ROADMAP rule.

**STATUS:** matches code as of 2026-07-23 (LIVE v1.6.4 build; v1.7 source uses RARITY_UNIVERSAL.md).
**Purpose:** the authoritative 15-grade rarity ladder — how a seed rolls a tier, how tiers become named grades with colors, the forced Apex/Paragon grades, guardian spawns, and how rarity drives finish/aura/complexity.
**Source of truth:** this doc is the DESIGN spec; main.js implements it. **The live rarity ladder is authoritative — the project rule is never to override it.** A mismatch means observable behavior changed.

## 1. Overview

Every object in the game — living or celestial — wears a **color-graded designation**: a tier (0–14) plus a named grade, a shade prefix, a hex color, and star glyphs. The ladder is one shared spine (`GRADE_TIERS`, main.js ~1400) with two dialects:

- **Living things** (flora / fauna / fungi / microbes) earn **rarity grades** in the Compendium via `colorGrade(kindHue, seed, opts)` → the grade name (Common … Omnipotent) with stars.
- **Celestial objects** (worlds, stars, galaxies) wear the same tier as a **SPECTRAL** color word via `spectral(domain, seed, opts)` (e.g. "Teal-Gold Ocean World", "Prismatic Black" core).

Both dialects read the identical tier from **`rarityRoll(seed, salt)`** — a long-tailed distribution from mostly-Common to a one-in-33-million summit. The roll is deterministic; the same seed always grades the same.

The whole system lives in the **`@module SpeciesTraits [domain]`** block (main.js ~1379–1609). Species-facing wrapping (`speciesGrade`) and guardians (`guardianFor`) live in the **`@module Genome [domain]`** block.

## 2. Rules & mechanics

### 2.1 The roll — `rarityRoll(seed, salt)` → integer tier 0–14
`r = mulberry32(hashInt(seed>>>0, salt|0, 0x9a))()`, then thresholded (see §3.1). It is **long-tailed**: ~40% Common, thinning to a ~1/33,000,000 Omnipotent summit. The deep-spectrum bands (8–11) were *carved out of the top of the old Unique band* in v1.3, and the summit bands (12–14) sit above that — so any pre-existing roll either held its tier or rose. **Determinism never downgrades.**

### 2.2 Living-thing grade — `colorGrade(kindHue, seed, opts)`
Rolls `rarityRoll(seed, opts.salt||1)`, optionally `+opts.boost` (clamped to `TIER_MAX`), or hard-set by `opts.force`. Returns `{tier, name, label, hex, hue, star, glow}` where `glow = tier>=2`. The label fuses the tier's prefix with the domain's hue word, with special fusions at tier 5 (`hue-Gold`), 6 (`hue-Black`), 7 (`Prismatic hue`).

### 2.3 Species grade — `speciesGrade(g)` (the Compendium wrapper)
Picks the domain hue key from kingdom (`fauna`→life, `flora`→forest, `fungi`→fungal, `microbe`→life), fixed salt `0x10F`, then:
- **Apex guardian** (`g.apex`): `force = clamp(max(12, g.apex), 0, TIER_MAX)` — wears its summit grade outright, never rolled.
- **Paragon** (`g.par`): `force = clamp(g.par, 8, 11)` — forced deep-spectrum.
- **Otherwise**: rolled `rarityRoll` **plus a merit boost** — `+1` each for size≥4, size≥5, `lumin`, gen≥2, gen≥5, and `wild`. So a titanic glowing gen-5 wild hybrid can climb up to +6 tiers past its base roll (a way to earn the deep spectrum by breeding/evolving, not just luck).

### 2.4 The ring-distance grade cap — `ringGrade(g, grade, where)` / `gradeCapAt(where)`
A world's location clamps how high a caught creature can grade (the "budgets stay honest" rule). `gradeCapAt(where)` returns a tier cap from the ring spectrum by galactic distance (home galaxy inner/outer, then regions 0–3). **Named legends bypass it** — if `g.apex||g.par`, the grade is returned unclamped. **The Cradle Law:** Earth beasts carry `_cradle=1`, which clamps their cap at `min(2, gradeCapAt)` (Uncommon) wherever they travel — they're starters by law. Bred/imported/unplaced genomes (`!where.gal`) are never capped (`TIER_MAX`).

### 2.5 Celestial spectral — `spectral(domain, seed, opts)`
Same roll/boost/force machinery, but reads a per-domain 8-entry color ladder from `SPECTRA` (ocean, teal, verdant, desert, ice, lava, gas, venus, rocky, star, redstar, bluestar, remnant, neutron, blackhole, galaxy, dwarfgal, anomaly). For deep-spectrum tiers (≥8, past the 8-entry ladder) the tier's own finish word takes over the domain's prismatic hue ("Radiant Fire", "Primordial Black"). `_clampSpectral(desig, cap)` + `_specDomOf` re-derive the domain from a label to clamp worlds/stars by ring distance the same way (worlds wear color, not stars).

### 2.6 Apex Guardians — `guardianFor(pseed)`
~1 fauna world in 40 (`r()>=0.025 → null`) is ruled by a named one-of-a-kind apex. A second roll sets the summit tier: **Empyrean (12) 70% · Eternal (13) 25% · Omnipotent (14) 5%**. The guardian genome is a titanic (`size=5`), glowing (`lumin`), `wild` fauna with `apex=tier` and an epithet index `ep`. Deterministic from the world seed — every explorer meets the same guardian. Defeating it in conquest adds it to the Compendium (the fighter's road to summit grades). Guardian-hood never inherits — `crossGenome` builds an explicit field set, so a guardian's children are ordinary bloodlines.

### 2.7 The Fifty Paragons — `paragonGenome(i)`
50 fixed legendary fauna (`PARAGON_N=50`), seeded `paragonSeed(i)=hashInt(0x9A7A60,i,61)`. Each is `size 4–5`, `lumin`, `wild`, with a forced **deep-spectrum `par` grade 8–11** and an epithet. They render with the silver-teal Paragon aura regardless of tier.

### 2.8 Rarity → finish / aura / complexity — `_rankAura(c2, S2, tier, apex, par, seed)`
The portrait's rarity "foil" (main.js ~5671):
- **Nothing below tier 4** (`!apex && !par && tier<4` returns early).
- Intensity `k`: apex/par `0.30`; tier≥12 `0.26`; tier≥8 `0.20`; else `0.10 + (tier-4)*0.02`.
- **Color:** apex burns molten gold (`255,196,90`), paragon silver-teal (`80,232,205`), otherwise the grade's own hex.
- **tier≥12** (non-apex/par) adds a drifting three-hue **prism foil**; deep spectrum (8–11) adds foil glints; mid tiers get a soft grade-colored glow. `colorGrade().glow` also flips true at tier≥2, and `star` glyphs escalate through the ladder.

## 3. Key tables & numbers (REAL values from code)

### 3.1 `rarityRoll` thresholds (main.js ~1434) — authoritative
| `r >` | tier | grade | approx odds |
|---|---|---|---|
| 0.99999997 | 14 | Omnipotent | ~1/33M (the summit) |
| 0.99999991 | 13 | Eternal | ~1/11M |
| 0.9999997 | 12 | Empyrean | ~1/3.3M |
| 0.999999 | 11 | Transcendent | one in a million |
| 0.999996 | 10 | Primordial | ~1/333,000 |
| 0.999985 | 9 | Celestial | ~1/91,000 |
| 0.99994 | 8 | Mythic | ~1/22,000 |
| 0.99976 | 7 | Unique | |
| 0.992 | 6 | Anomalous | |
| 0.972 | 5 | Legendary | |
| 0.93 | 4 | Exotic | |
| 0.84 | 3 | Rare | |
| 0.66 | 2 | Notable | |
| 0.40 | 1 | Uncommon | |
| (else) | 0 | Common | ~40% |

### 3.2 `GRADE_TIERS` (main.js ~1400) — the ladder spine. `TIER_MAX = 14`.
| t | name | prefix | hex | stars |
|---|---|---|---|---|
| 0 | Common | Pale | `#9fb6d6` | — |
| 1 | Uncommon | — | `#bcd6e6` | — |
| 2 | Notable | Bright | `#7fd0ff` | ★ |
| 3 | Rare | Deep | `#5b8cf0` | ★★ |
| 4 | Exotic | Neon | `#b06cff` | ★★★ |
| 5 | Legendary | Gold | `#e7b94a` | ★★★★ |
| 6 | Anomalous | Blackened | `#c0494a` | ★★★★ |
| 7 | Unique | Prismatic | `#d65bb8` | ✦ ONE-OF-ONE |
| 8 | Mythic | Iridescent | `#3fe8c8` | ✦✦ |
| 9 | Celestial | Radiant | `#a8c8ff` | ✦✦✦ |
| 10 | Primordial | Primordial | `#ff8a4a` | ✦✦✦✦ |
| 11 | Transcendent | Transcendent | `#f4f8ff` | ✧ ONE IN A MILLION |
| 12 | Empyrean | Empyrean | `#ffc24f` | ✧✧ |
| 13 | Eternal | Eternal | `#9a8aff` | ✧✧✧ |
| 14 | Omnipotent | Omnipotent | `#ff7ae8` | ❖ OMNIPOTENT |

Tiers 0–7 are the "natural" ladder; 8–11 the **deep spectrum** (carved from the old Unique band); 12–14 the **summit**, which renders with a `.irid` foil shimmer in the UI (the hex is the static fallback).

### 3.3 Label fusion rules (`colorGrade`, ~1464)
- tier 7 → `Prismatic <hue>`; tier 5 → `<hue>-Gold`; tier 6 → `<hue>-Black`; else `<prefix> <hue>` (or bare `<hue>` when prefix empty). `HUE_FAMILY` maps domain keys → base color words (life/forest→Green, fungal→Violet, etc.).

### 3.4 `speciesGrade` merit boosts (~1781)
`+1` each: `size>=4`, `size>=5`, `lumin`, `gen>=2`, `gen>=5`, `wild`. Max +6.

### 3.5 Guardian spawn split (`guardianFor`, ~1828)
spawn chance ~2.5% per fauna world; tier: `<0.70`→12, `<0.95`→13, else→14. `GUARDIAN_EPITHETS` (16): the Undying, the Worldheart, the Stormcrowned, the Pale Sovereign, the First Hunger, the Hundred-Eyed, the Last of Its Line, the Skyrender, the Deep Warden, the Ash Emperor, the Silent Tide, the Star-Eater, the Crownless, the Dawn Stalker, the Hollow Saint, the Gravemind.

### 3.6 Paragons (~9144)
`PARAGON_N=50`; `par` grade `8 + (r()*4|0)` → 8–11; `size = 4 + (r()*2|0)`; `lumin=true`, `wild=1`.

### 3.7 Related capture-side table (context, not the ladder)
`TAME_ODDS` (15 entries, one per tier, ~8669): base tame odds falling from `0.60` (Common) to `0.0025` (Omnipotent). App-layer capture rolls; the grade ladder itself is unaffected.

## 4. Data / save fields
The rolled grade is stored per Compendium entry as `entry.grade = {tier, name, label, hex, hue, star, glow}` (already ring-clamped via `ringGrade` at store time). Genome markers that force grades — `apex` (validated 12–TIER_MAX at load, else dropped, ~11288), `par`, `ep` — persist on `entry.genome`. Conquered-world and placed-champion records clamp `tier` to `[0, TIER_MAX]` on load (~10124, ~10263). Stat blocks store `best` highest-grade-ever reached, rendered with the `.irid` class at tier≥12.

## 5. Determinism
- `rarityRoll` is pure `mulberry32(hashInt(seed, salt, 0x9a))` — no `Math.random`/`Date.now`. The same seed + salt always grades identically across devices; species use fixed salt `0x10F`, celestial defaults to salt `1`.
- The ladder feeds the **50-probe determinism fingerprint** (`tools/baseline.json`); tiers, thresholds, hexes, and label fusion are baked in. Never regenerate the baseline to pass — a mismatch means the rarity behavior changed.
- **Rarity is deterministic AND authoritative** — the ladder is the project's grading law and must never be silently overridden. Boosts and ring caps *modify* the outcome deterministically (from genome state and location) but never introduce randomness beyond the single seeded roll.
- Forced grades (apex/par) and ring clamps are pure functions of persisted state, so they replay identically.

## 6. Code anchors
- `@module SpeciesTraits [domain]` — main.js ~1379–1609. `GRADE_TIERS` ~1400; `TIER_MAX` ~1425; `HUE_FAMILY` ~1427; `rarityRoll` ~1434; `colorGrade` ~1457; `SPECTRA` ~1483; `spectral` ~1503.
- `@module Genome [domain]` — `speciesGrade` ~1772; `GUARDIAN_EPITHETS` ~1821; `guardianFor` ~1825.
- Ring caps — `gradeCapAt` ~8554; `ringGrade` (incl. Cradle Law) ~8565; `_specDomOf` ~8580; `_clampSpectral` ~8591; `ringDesignation` ~8602.
- Paragons — `paragonSeed` ~9145; `paragonGenome` ~9146.
- Rarity finish/aura — `_rankAura` ~5671 (called from every HD portrait renderer).
- Capture odds (context) — `TAME_ODDS` ~8669.

## 7. Open questions / pending
- `colorGrade` returns `star` from `GRADE_TIERS`, but the summit's `.irid` foil is applied in the UI layer by tier≥12 checks, not carried on the grade object — two sources for "is this a summit grade".
- The ring spectrum caps come from `RING_SPECTRUM[*].cap`; this doc names the mechanism but the exact cap values live in that table (galaxy/region layer) rather than the grade module.
- CLAUDE.md's "49-probe" wording lags the live "50-probe" blurb (main.js ~12880); the ladder is fingerprinted either way.
