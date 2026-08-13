# Celestial Frontier — Rarity & Grades System

**STATUS:** legacy values match code as of **2026-07-31 (v1.8.9)**; the v2
type and presentation overlays below match `port/v2` as of 2026-08-13. Every value,
threshold and line anchor below was re-extracted from `main.js` during port
Phase 0 and verified, not carried forward.

**Purpose:** the authoritative description of how rarity works — the raw roll, the **two ladders**,
how one collapses into the other, the merit boosts, ring caps, guardians and paragons.

**Source of truth:** `main.js` implements the legacy runtime and
`port/v2/packages/domain/speciestraits` owns the dated port contract; where
source and this doc disagree, **source wins and this doc gets fixed**. The ladder
feeds the 50-probe determinism fingerprint — a mismatch means observable behavior changed.

> **2026-08-11 v2 executable-contract correction:** Runtime rarity values are
> byte-unchanged. The port declaration now records that `colorGrade` and
> `spectral` accept omitted/null options, and that `colorGrade` may receive the
> runtime-supported suffix. It also types the shared color word/hex tables as
> their real string-list and keyed-record shapes. Tests exercise the actual
> calls; this is type parity, not a rarity rebalance or fingerprint re-pin.

> **2026-08-13 v2 presentation boundary:** `spectral()` and `SPECTRA` remain
> deterministic internal contracts because descriptor parity, art hue, epithets, and
> seeded fixtures may depend on them. Their presence does **not** make **Spectral class**
> a v2 player class. The app filters that legacy row at render time. Planet cards disclose
> no rarity before landing and use the plain display-grade name afterward. Real stellar
> G/K/M/remnant classification remains ordinary astronomical identity. The descriptor
> parity tests continue to assert internal `.designation`; browser/smoke outcomes assert
> that the legacy row never reaches the player.

> **2026-08-13 loot/companion review:** Future item-instance loot follows the universal
> vocabulary without conflating independent axes. Creature/world rarity, item rarity,
> item level, quality, affix tier, upgrade level and visual designation remain separately
> named and persisted. Companion bond is not rarity and cannot rewrite a genome's grade.
> These are planned contracts in `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`; no current
> v2 rarity outcome changed.

> ### ⚠ WHAT CHANGED IN THIS REFRESH (2026-07-31), and why the old version was dangerous
>
> The previous version of this file described a **15-name** ladder (Common … Anomalous, Unique,
> Mythic, Celestial, Primordial, Transcendent, Empyrean, Eternal, Omnipotent) with star glyphs and a
> full hex palette. **None of that is true of v1.8.9 source.** Specifically:
>
> - **Every name from tier 6 upward was wrong.** Source tier 6 is `Mythic`, not `Anomalous`.
> - **All 15 hexes were wrong.** The doc listed `#9fb6d6`…`#ff7ae8`; source is `#B8BDC7`…`#F7F1FF`.
> - **The star column was wrong.** Glyphs (★/✦/✧/❖) were retired; `star` is `''` on every tier.
> - **Every line anchor was stale**, by 350 to 4,000 lines.
>
> It also carried an instruction to **delete this file on the v1.7 deploy**. That deploy shipped
> three minors ago. **Deleting it would have been the wrong call** — see §1: the raw 0–14 ladder is
> still live, still rolled, still persisted, and still used for sorting and achievements. This file
> is the only detailed record of it. Port plan §16.3 requires `RawGradeTier` and `DisplayRarityTier`
> be kept explicitly separate, which is exactly what deleting this would have made impossible.
>
> **What survived verification unchanged:** all 14 roll thresholds, the six merit-boost conditions,
> the guardian spawn split and epithets, the paragon numbers, `TAME_ODDS`, and the load-time
> `apex`/`par` validation bounds.

---

## 1. Overview — there are two ladders, and only one of them has names

Rarity is **one roll** feeding **two representations**:

| | **Raw grade tier** (`RawGradeTier`) | **Display rarity** (`DisplayRarityTier`) |
|---|---|---|
| Range | **0–14** (15 bands) | **0–9** (10 names) |
| Where | `GRADE_TIERS` — main.js **1752** | `RARITY_V17` — main.js **1732** |
| Produced by | `rarityRoll()` **1782**, plus boosts/forces | `displayRarity()` **1744** |
| Still live? | **Yes** — rolled, persisted, sorted on | Yes — the player-facing vocabulary |

**The crucial fact: `GRADE_TIERS` is no longer a 15-*name* ladder.** It kept its 15-row *shape* — the
roll still returns 0–14 and apex/paragon forces still target 8–14 — but every row's `name` and `hex`
were collapsed onto the 10-tier set. Rows 9 through 14 all read `Transcendent` / `#F7F1FF`.

The source comment at **1745–1751** states the intent directly: the shape is kept *"but every entry's
NAME + HEX now COLLAPSES to the 10-tier ladder above (10–14 all read Transcendent)"*, and **1729–1731**
names the principle — **"collapse, don't remap"** — so the universe, power curve and old share codes
stay untouched. A score-6 creature is the same creature, now labelled Mythic.

**Consequence to internalise:** raw tier and display name are *not* interchangeable, and the old names
(Anomalous, Unique, Empyrean, Eternal, Omnipotent) are **not** rarity names any more. They survive only
in the `pre` column, which feeds **art/spectral labels** like "Empyrean Black". An external reviewer
conflated these two ladders across rounds 7–9 for exactly this reason — read any historical "tier 12" or
"tier ≥ 8 Mythic" claim as `RawGradeTier`.

## 2. The raw ladder — `GRADE_TIERS` (main.js 1752–1772). `TIER_MAX = 14` (1773)

| t | name (displayed) | `pre` (art word) | hex | star |
|---|---|---|---|---|
| 0 | Common | Pale | `#B8BDC7` | `''` |
| 1 | Uncommon | *(empty)* | `#4FD16B` | `''` |
| 2 | Notable | Bright | `#35C9B5` | `''` |
| 3 | Rare | Deep | `#3D8BFF` | `''` |
| 4 | Exotic | Neon | `#9A5CFF` | `''` |
| 5 | Legendary | Gold | `#F4A62A` | `''` |
| 6 | Mythic | Blackened | `#E54B8D` | `''` |
| 7 | Celestial | Prismatic | `#54D8FF` | `''` |
| 8 | Primordial | Iridescent | `#D85B3F` | `''` |
| 9 | Transcendent | Radiant | `#F7F1FF` | `''` |
| 10 | **Transcendent** | Primordial | `#F7F1FF` | `''` |
| 11 | **Transcendent** | Transcendent | `#F7F1FF` | `''` |
| 12 | **Transcendent** | Empyrean | `#F7F1FF` | `''` |
| 13 | **Transcendent** | Eternal | `#F7F1FF` | `''` |
| 14 | **Transcendent** | Omnipotent | `#F7F1FF` | `''` |

`TIER_MAX` is derived (`GRADE_TIERS.length-1`), so it tracks the table automatically.

## 3. The display ladder — `RARITY_V17` (1732–1743)

Ten entries, fields `{t, id, name, hex}` — no `pre`, no `star`. Names and hexes are byte-identical to
`GRADE_TIERS[0..9]`.

`common #B8BDC7` · `uncommon #4FD16B` · `notable #35C9B5` · `rare #3D8BFF` · `exotic #9A5CFF` ·
`legendary #F4A62A` · `mythic #E54B8D` · `celestial #54D8FF` · `primordial #D85B3F` ·
`transcendent #F7F1FF`

## 4. The conversion — ⚠ two paths, and the creature path is the one that matters

```js
function displayRarity(rawScore){ return RARITY_V17[Math.max(0, Math.min(9, rawScore|0))]; }   // 1744
```

**Path A — `displayRarity`.** A pure clamp to 9. No remap table.

**Path B — the `GRADE_TIERS` table itself.** `colorGrade` (**1810**, `const T=GRADE_TIERS[tier]`) and
`spectral` (**1857/1860**) read the name straight out of `GRADE_TIERS`, with **no clamp call at all**.

**Creature rarity flows through Path B, not Path A.** Every string a player sees on a specimen card or
Compendium entry comes from `GRADE_TIERS[tier].name` via `colorGrade`. The two paths agree only because
rows 10–14 were *pre-collapsed in the data*.

> ⚠ **This is a load-bearing invariant with no test guarding it.** If anyone ever "restores" the old
> names to `GRADE_TIERS` rows 10–14, `displayRarity` keeps clamping correctly and every creature
> surface silently starts printing Empyrean/Eternal/Omnipotent again. The clamp is not what protects
> the display — the table data is. Port note: implement this as an explicit `RawGradeTier →
> DisplayRarityTier` conversion (§16.3) rather than carrying the collapse in the table.

**Derived mapping (identical under both paths):** raw 0–9 → the ten names in order; raw **10, 11, 12,
13, 14 → all Transcendent**, `#F7F1FF`.

Consumers holding a *raw* tier must re-clamp by hand — Compendium filter **12774**, `tiersOwned`
**13878**, Binder "The Spectrum" **13020**, Records ladder **24112**. And `_courtProg()` (**12959–12965**)
deliberately works *around* the collapse, naming raw 12/13/14 as CROWNS I/II/III because "Transcendent"
made the three summit seats indistinguishable — evidence the collapse is **not** lossless.

## 5. The roll — `rarityRoll(seed, salt)` (1782–1802)

`r = mulberry32(hashInt(seed>>>0, salt|0, 0x9a))()`, then thresholded. Long-tailed: ~40% Common to a
one-in-33-million summit. All 14 thresholds verified unchanged.

| `r >` | raw tier | band probability | odds | **displays as** |
|---|---|---|---|---|
| 0.99999997 | 14 | 3.0e-8 | 1 in 33.3 M | Transcendent |
| 0.99999991 | 13 | 6.0e-8 | 1 in 16.7 M | Transcendent |
| 0.9999997 | 12 | 2.1e-7 | 1 in 4.76 M | Transcendent |
| 0.999999 | 11 | 7.0e-7 | 1 in 1.43 M | Transcendent |
| 0.999996 | 10 | 3.0e-6 | 1 in 333 k | Transcendent |
| 0.999985 | 9 | 1.1e-5 | 1 in 90.9 k | Transcendent |
| 0.99994 | 8 | 4.5e-5 | 1 in 22.2 k | Primordial |
| 0.99976 | 7 | 1.8e-4 | 1 in 5.56 k | Celestial |
| 0.992 | 6 | 7.76e-3 | 0.78 % | Mythic |
| 0.972 | 5 | 2.0e-2 | 2.0 % | Legendary |
| 0.93 | 4 | 4.2e-2 | 4.2 % | Exotic |
| 0.84 | 3 | 9.0e-2 | 9.0 % | Rare |
| 0.66 | 2 | 1.8e-1 | 18 % | Notable |
| 0.40 | 1 | 2.6e-1 | 26 % | Uncommon |
| *(else)* | 0 | 4.0e-1 | 40 % | Common |

Cumulative P(displays as Transcendent, i.e. raw ≥ 9) ≈ **1 in 66,700** before boosts.

> ⚠ **The inline comments inside `rarityRoll` are the OLD ladder and now lie.** Line 1793 labels tier 8
> `mythic` (displays **Primordial**); 1792 labels tier 9 `celestial` (displays **Transcendent**); 1795
> labels tier 6 `anomalous` (displays **Mythic**). Comment-only drift — but it sits inside the function
> everyone reads first, and it is a primary cause of the raw/display conflation.

## 6. Species grade — `speciesGrade(g)` (2133–2150)

`dom` from kingdom (`fauna→life`, `flora→forest`, `fungi→fungal`, else `life`), fixed salt `0x10F`.

- **Apex guardian** (`g.apex`): `force = min(TIER_MAX, max(12, g.apex))` — worn outright, never rolled.
- **Paragon** (`g.par`): `force = min(11, max(8, g.par))` — forced deep spectrum.
- **Otherwise:** rolled, plus **+1 each** for `_szOf(g)>=4`, `_szOf(g)>=5`, `lumin`, `gen>=2`, `gen>=5`,
  `wild`. Max **+6**, clamped to `TIER_MAX` inside `colorGrade`.

> ⚠ **CORRECTED 2026-07-31: the size reads go through `_szOf(g)`, not raw `g.size`.** `_szOf` (**2025**)
> wraps size modulo `FA_SIZE.length`, and was introduced in v1.8.9 because `crossGenome` mutates `size`
> without wrapping — 12.4% of lineages carry size > 5 by generation 5. Before the fix a bred size-6
> creature printed "tiny" while these readers saw 6 and granted the full MEGAFAUNA boost (vitality 68
> vs 52, measured). Other `_szOf` callers: `sapienceTier` **2036**, `classifyRealm` **2062**,
> `realmModifiers` **2096**.

## 7. Grade objects, label fusion, and finish

**`colorGrade(kindHue, seed, opts)` (1805–1821)** returns
`{tier, name, label, hex, hue, star, glow}`, `glow = tier>=2`. Label fusion (1814–1818): tier 7 →
`Prismatic <hue>`; tier 5 → `<hue>-Gold`; tier 6 → `<hue>-Black`; else `<pre> <hue>`, or bare `<hue>`
when `pre` is empty (tier 1 only). `HUE_FAMILY` at **1775**. ⚠ `opts.force` is **not** clamped (1809);
callers are responsible for bounds.

**`spectral(domain, seed, opts)` (1851–1861)** with `SPECTRA` (18 domains × 8 rungs) at **1831**. Below
tier 8 the label/hex come from the domain spectrum while `name` comes from the collapsed ladder — a
world's *color word* and its *rarity word* are deliberately different vocabularies. At tier ≥ 8 the
tier's `pre` takes over, which is where "Empyrean Black" survives as an **internal art label**.
The legacy v1 descriptor can still emit that text for parity; current v2 presentation does not render
it as a Spectral-class survey row.

**`_rankAura` (8322)** — the portrait foil. Nothing below tier 4. Intensity: apex/par `0.30`; tier≥12
`0.26`; tier≥8 `0.20`; else `0.10 + (tier-4)*0.02`. Apex burns molten gold `255,196,90`; paragon
silver-teal `80,232,205`. Note these branch on **raw** tier, so the summit still renders distinctly even
though it reads "Transcendent".

## 8. Ring caps and the Cradle Law

**`gradeCapAt(where)` (12227–12237)** — `TIER_MAX` when `!where.gal` (bred/imported/unplaced are never
capped). Home galaxy: inside `ASC_RING_R` of Sol → cap **5**, else **8**. Otherwise by region: `<=0`→9,
`1`→10, `2`→11, else `TIER_MAX`. `RING_SPECTRUM` at **12219** (caps 5/8/9/10/11/14).

**`ringGrade(g, grade, where)` (12238–12246)** — returns unchanged if `g.apex || g.par` (named legends
keep their crowns). **The Cradle Law:** `_cradle` genomes cap at `min(2, gradeCapAt(where))` — Earth
beasts are starters by law wherever they travel. Applied at store time in `_storeSpecies` (**12334**).

## 9. Guardians and Paragons

**`guardianFor(pseed)` (2186–2195)** — ~2.5% of fauna worlds (`r()>=0.025 → null`). Tier split
(**2189**): `<0.70`→12, `<0.95`→13, else 14 — a 70/25/5 spread that **all three display as
Transcendent**. Genome forced `size=5, lumin, wild=1, apex=tier`, plus an epithet from
`GUARDIAN_EPITHETS` (16, **2182**). Deterministic per world seed. Guardian-hood never inherits —
`crossGenome` builds an explicit field set.

**Paragons** — `PARAGON_N = 50` (**12910**), `paragonGenome` (**12912**): `par = 8 + (r()*4|0)` → 8–11,
`size = 4 + (r()*2|0)`, `lumin`, `wild=1`. They render with the silver-teal Paragon aura regardless.

## 10. Persistence

`entry.grade = {tier, name, label, hex, hue, star, glow}`, ring-clamped at store time. `apex` is
validated to 12–`TIER_MAX` on load and `par` to 8–11, else dropped (**14188–14189**). `TAME_ODDS`
(**12354**, 15 entries, one per **raw** tier) falls `0.60` → `0.0025`.

## 11. Determinism

`rarityRoll` is pure `mulberry32(hashInt(...))` — no `Math.random`/`Date.now`. Species use salt `0x10F`;
celestial defaults to `1`. The ladder feeds the 50-probe fingerprint; thresholds, hexes and label fusion
are baked in. **Never regenerate the baseline to make a mismatch pass.** Boosts, forces and ring caps
are pure functions of persisted state, so they replay identically.

## 12. Open items and hazards

1. **The collapse lives in data, not in a function** (§4). No test guards it. Highest-value thing to
   change in the port.
2. **`rarityRoll`'s inline comments are the old ladder** (§5) — actively misleading.
3. **`RARITY_UNIVERSAL.md` describes the wrong mechanism.** It states that `speciesGrade`, `colorGrade`
   and `spectral` resolve names via `displayRarity`. They do not — all three read `GRADE_TIERS`
   directly. Right outcome, wrong mechanism; and since `spectral` has no clamp, correctness rests
   entirely on the table rows staying pre-collapsed.
4. **⚠ A stale premise in the save path.** `main.js:14180` justifies *not* wrapping `size` at load with:
   *"speciesGrade/rarityRoll/sapience read `g.size` RAW (>=3, >=4, >=5)."* **That is false in v1.8.9** —
   `speciesGrade` (2143–44) and `sapienceTier` (2036) both go through `_szOf`, and `rarityRoll` never
   reads `size` at all. The *conclusion* may still be right, but the stated reason no longer supports
   it. This is the field that caused the v1.8.6 save-corruption incident; per CLAUDE.md rule 7, it
   needs a deliberate re-decision rather than a quiet edit. **Open — Nick's call.**
5. **`.irid` foil at tier≥12 is applied in the UI layer**, not carried on the grade object — two sources
   for "is this a summit grade" (**12591**, **12636**).
6. **`_courtProg()` (12959–12965) proves the collapse is lossy** at the top; it re-derives CROWNS I/II/III
   from raw 12/13/14. Any claim that the collapse is display-lossless is contradicted by that code.
