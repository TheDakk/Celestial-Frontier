# Celestial Frontier — Universal Rarity (v1.7)

**Status:** Phase A **SHIPPED** (in v1.7; live since well before v1.8.9). Phase B still design.
**Matches code as of:** re-verified **2026-07-31 (v1.8.9)** during port Phase 0 — see the ⚠ block below for
two places where the shipped implementation differs from the §3 plan, and one instruction that is retracted.
*(Previously: "awaiting Nick's deploy call", matched-as-of 2026-07-22 — both stale.)*

> **2026-08-31 strict v2 display overlay — current local candidate:** the app now owns an explicit,
> immutable `RawGradeTier` → `DisplayRarityTier` presentation boundary. It accepts only primitive
> integer raw values 0–14: raw 0–9 uses the matching canonical ten-name row, and raw 10–14 collapses
> to display tier 9, **Transcendent** / `#F7F1FF`. Missing, malformed, coercible, fractional or
> out-of-range input produces no rarity callout; it never defaults to Common.
>
> The foreground vocabulary and palette remain canonical. Compendium list/detail plus
> owned/non-missing Records Binder rarity slots present each written rarity token on a shared opaque
> `#05070d` reading surface; Exotic therefore remains `#9A5CFF` while the evaluated
> foreground/background pair stays at or above 4.5:1 across supported glass. Missing Binder slots
> retain their separate missing-state surface. This is a presentation backdrop, not a ladder, roll,
> persistence or art-color change.
>
> Survey and Compendium list/detail use that strict app projector. Owned Binder slots instead use
> the domain's canonical `displayRarity` / `RARITY_V17` ladder and color, then apply the same opaque
> reading surface in CSS. Planet rarity remains absent before
> landing; Compendium presentation reads the stored raw tier rather than an art/designation label.
> This is the explicit port mechanism the older re-verification note below required. It changes no
> `rarityRoll` threshold or draw, raw tier, save field, sort/balance authority, deterministic
> descriptor, seeded art hue/designation, legacy fingerprint or loot policy. Focused automated
> source/unit gates cover the boundary; final real-browser evidence for the current combined
> candidate remains pending.

> **2026-08-13 v2 display overlay — historical foundation; current where the 2026-08-26 overlay
> does not supersede it:** The universal ten-name
> ladder remains player vocabulary, but **Spectral class** is retired as a visible
> survey field. V2 filters that legacy descriptor row without changing deterministic
> descriptor output. Planet rarity is completely absent before landing—there is no
> “land to reveal” Spectral row—and appears after landing as a plain grade/callout.
> Internal spectral color words remain seeded art data only. Real stellar spectral
> classifications remain astronomical identity; any separately presented celestial rarity
> must use plain ten-tier language, never a Spectral-class row. This overlay changes presentation, not raw tiers, seeded hues,
> fixture parity, or the immutable v1.8.9 release history.

> **2026-08-13 cross-system review:** The ten-name ladder remains the shared display
> vocabulary for future loot and Guardian rewards, not a shortcut that makes every value
> one scale. Item level, quality, affix tier, upgrade and companion bond stay independent.
> Drop pools disclose their source/ranges and reload cannot reroll a receipt. See
> `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`; this direction is not yet a live v2 faucet.

> ### ⚠ RE-VERIFIED 2026-07-31 — legacy mechanism audit; the port action is superseded
>
> **1. Names/colors are NOT routed through `displayRarity`.** §3 item 4 specifies that `speciesGrade`,
> `spectral` and `colorGrade` resolve names/colors via `displayRarity` / `RARITY_V17`. **They do not.**
> All three read `GRADE_TIERS` directly (`colorGrade` main.js **1810**; `spectral` **1857/1860**;
> `speciesGrade` **2133–2150** delegates entirely to `colorGrade`). The collapse was implemented by
> rewriting rows 9–14 of `GRADE_TIERS` to read `Transcendent`/`#F7F1FF` — **in the data, not via a
> conversion function.** The outcome matches the spec; the mechanism does not.
>
> **Why it still matters to legacy v1:** `spectral` has **no clamp call at all**, so its display
> correctness rests entirely on those table rows staying collapsed. Restore the old names to rows
> 10–14 and every creature surface silently reverts, while `displayRarity` keeps clamping correctly
> and every test that exercises it
> keeps passing. At this 2026-07-31 audit boundary, the port recommendation was to implement the
> explicit `RawGradeTier → DisplayRarityTier` conversion from plan §16.3 rather than carry that
> table-dependent mechanism forward. **The current 2026-08-26 candidate has implemented that strict
> app projector**, as recorded in the overlay above; this paragraph is no longer an open port action
> and does not change the legacy table.
>
> **2. The old names were not fully deleted.** §0 calls for deleting Anomalous / Unique / Empyrean /
> Eternal / Omnipotent. They are gone as *rarity names*, but survive as `GRADE_TIERS[*].pre` (**1767–1771**)
> and are still emitted into **art/spectral labels** ("Empyrean Black") by `spectral` **1860** and
> `_clampSpectral` **12270**. That is deliberate — `pre` keeps planet/star art designations
> byte-identical — but the doc should not claim the words are gone.
>
> **3. ⚠ RETRACTED: "delete `RARITY_AND_GRADES.md` on Phase-A deploy".** Phase A shipped; the file was
> not deleted, and on 2026-07-31 it was decided it **must not be**. The raw 0–14 ladder is still rolled,
> still persisted, and still used for sorting, achievements and `_courtProg`'s CROWNS I/II/III — and
> that file is the only detailed record of it. Port plan §16.3 requires `RawGradeTier` and
> `DisplayRarityTier` be documented *separately*, which deleting it would have made impossible. It has
> been refreshed against v1.8.9 instead and remains the raw-ladder reference; **this file remains
> canonical for the 10-name display ladder.**
>
> **4. Star glyphs.** §3 item 6 says drop `entry.grade.star`. `star` is `''` on every tier so the output
> is correct, but **16023** still concatenates the field. Harmless; noted so the doc does not overstate.

**Legacy v1 Phase-A status, kept for context —** Phase A §3 items 1–12 ALL implemented; core relabel surgically re-pinned,
presentation layer is fp-safe/UI-only). §3.10 discovery GATING: a world hides its grade until you LAND — the
survey card's "Spectral class" row shows a "land to reveal" teaser and the card border stays neutral from orbit
(gated on the existing `grounded` flag in `renderPanel`); stars/galaxies still reveal on survey (gate keys on
`d.planetSeed`). §3.11 escalating REVEAL: on the first descent a Legendary+ world fires a tier-scaled `cinematic()`
in `_performLanding` (Common..Exotic land quietly); the existing per-tier `data-frame` bands (low→summit on the
reveal card) provide the readable-without-color a11y frame. §3.12 cross-kind Compendium: a rarity-floor filter
(All/Rare+/Legendary+/Mythic+, `codexRare`) sits under the kingdom tabs, sifting every kingdom by display tier at
once (the list already sorts by tier). NOTE: worlds carry `.designation` not `.grade`, so the Atlas/log/conquest
never leaked rarity — no gating needed there.
**Phase A implementation notes:** `RARITY_V17` (10 canonical rows) + `displayRarity(rawScore)=RARITY_V17[clamp(raw,0,9)]`
added in `main.js`; `GRADE_TIERS` collapsed (names/hex → canonical, all `star:''`, `pre`+SPECTRA kept byte-identical
so planet/star ART labels don't move); `rarityRoll` UNTOUCHED. Surgical re-pin covered exactly 7 probes
(gradeTiers/speciesGrade/colorGrade/describeSpecies/faunaDesc/battleStats/runDuel) — every delta proven to be a
rarity field only (name/hex/star/label), zero generation-text or combat-number change. Sentinels live in `smoke.js`
(10-tier ladder, collapse 6→Mythic/7→Celestial, clamp 10+→Transcendent, no ★/✦/✧/❖, no old names, no ALL-CAPS).
**~~On Phase-A DEPLOY: delete `RARITY_AND_GRADES.md`.~~ RETRACTED 2026-07-31 — see the ⚠ block at the top.**
Phase A shipped in v1.7 and the file was never deleted. On review during port Phase 0 it was decided it
**must not be**: the raw 0–14 ladder is still rolled, still persisted, and still read for sorting,
achievements and `_courtProg`'s CROWNS I/II/III, and that file is the only detailed record of it. Deleting
it would also have made port plan §16.3 — which requires `RawGradeTier` and `DisplayRarityTier` be
documented separately — impossible to satisfy.

**Canonical-doc split (superseding the 2026-07-22 single-doc plan):**
- **`RARITY_UNIVERSAL.md` (this file)** — canonical for the **10-name display ladder** (`RARITY_V17`,
  `displayRarity`) and the Phase A/B design intent.
- **`RARITY_AND_GRADES.md`** — canonical for the **raw 0–14 ladder** (`GRADE_TIERS`, `rarityRoll`,
  merit boosts, ring caps, guardians, paragons). Refreshed against v1.8.9 on 2026-07-31.

Neither supersedes the other; they document the two halves of one system. Cross-references in
`ROADMAP.md`, `CLAUDE.md` and `celestial-frontier-codebase-reference.md` should point to **both**.
**Design basis:** the "V1.7 Universal Rarity, Color, and Modifier Specification" (Nick's uploaded doc) is
the exhaustive design source; this file is the repo-canonical, implementation-facing distillation + the
locked decisions.

---

## 0. Locked decisions (Nick, 2026-07-22)

- **One 10-tier ladder for everything** — flora, fauna, planets, stars (and future celestial entities)
  all use the same names, tier numbers, colors, and meaning.
- **Normal capitalization — NO all-caps.** "Legendary World", "Celestial star discovered" — never
  "LEGENDARY WORLD DISCOVERED".
- **No glyphs** (★/✦/✧) anywhere — the grade *word* carries the rarity.
- **Collapse, don't remap.** Keep `rarityRoll`'s raw 0–14 score UNCHANGED; read the score directly AS the
  tier (0–9), clamp 10–14 → 9 (Transcendent), give scores 0–9 the ten new names, and DELETE the old
  Anomalous / Unique / Empyrean / Eternal / Omnipotent names. No mapping table. → universe + power
  UNCHANGED, old share codes unaffected (same creature, new label) → **surgical re-pin**.
  - Accepted consequence: old score-6 (~2%, was "Anomalous") now reads **Mythic**; score-7 (~0.8%, was
    "Unique") reads **Celestial** — a touch more common than the grand names imply. Roll-tuning to make
    the top rarer is a SEPARATE later pass (a fuller re-pin), not part of Phase A.
- **Unique = one-of-one DESIGNATION overlay** (authored, `unique_key`), NOT a rarity tier. Preserves the
  base rarity color, adds a white-gold frame + "One of a Kind" subtitle.
- **Stars keep a rarity.** The unified clean presentation ("Celestial star" + separate type "red giant")
  fixes the old double-"class" confusion — this reverses the earlier "remove star rarity" idea.
- **Rarity color = badge / label / frame / glow only** — never recolors the entity's art. A Rare ocean
  world stays blue-oceaned; only its badge is Sapphire.
- **Two phases, both after v1.6 ships:** Phase A (vocabulary) first, then Phase B (generation modifiers).

### Approved value-adds (Nick, 2026-07-22 — all IN)

- **Gear/loot is on the same ladder.** Crafted items + gear (and the v1.6 loot affixes) use the same 10
  tiers — a Rare mining rig, a Legendary suit — so the ARPG item cards speak the exact same rarity
  language as creatures, plants, and worlds. Truly ONE system game-wide. (Ties into the Forge/ARPG-item
  work.)
- **Rarity is HIDDEN until the discovery moment — universal rule.** Never shown from orbit/afar; revealed
  only when earned: **worlds** on a *successful* landing (hostile worlds can still wave you off);
  **creatures/plants** on the catch/scavenge (already on the ground); **stars** on survey. In orbit a
  world shows only the teaser (type + life-signature count + one-line environment). On landing, *boom* —
  the rarity + full card + biosphere open up. Rarity is the payoff, not a spoiler. (This is Pillar 1 of
  FORGE_AND_DISCOVERY.md, generalized to every entity.)
- **The reveal is an escalating moment.** Reveal intensity scales with the tier — color wash, glow,
  rising discovery sound, a bit more animation at higher grades — so a Primordial landing *feels* bigger
  than a Common one. Reserve the biggest flourishes for the genuinely-scarce top tiers (anti-inflation:
  the collapse makes Mythic ~2%, so the grand tiers must still feel grand).
- **Cross-kind rarity views.** One ladder unlocks Compendium filter/sort by rarity ACROSS creatures,
  plants, and worlds ("everything Legendary+") — impossible with two separate ladders.
- **Readable without color.** Each tier gets a distinct frame/border treatment (not only a hue), so
  colorblind players read rarity structurally. Concrete form of the spec's accessibility requirement.

---

## 1. The canonical 10-tier ladder

Progression: **Common → Uncommon → Notable → Rare → Exotic → Legendary → Mythic → Celestial → Primordial → Transcendent**

| Tier | id | Name | Color | Hex | Player meaning |
|---:|---|---|---|---|---|
| 0 | `common` | Common | Cool Silver | `#B8BDC7` | Ordinary, widespread |
| 1 | `uncommon` | Uncommon | Emerald Green | `#4FD16B` | Less frequent, minor distinction |
| 2 | `notable` | Notable | Astral Teal | `#35C9B5` | Distinctive; Codex-worthy |
| 3 | `rare` | Rare | Sapphire Blue | `#3D8BFF` | Scarce, meaningfully separated |
| 4 | `exotic` | Exotic | Deep Violet | `#9A5CFF` | Unusual structure/biology/origin |
| 5 | `legendary` | Legendary | Solar Orange | `#F4A62A` | Exceptionally powerful/renowned |
| 6 | `mythic` | Mythic | Cosmic Magenta | `#E54B8D` | Beyond conventional limits |
| 7 | `celestial` | Celestial | Stellar Cyan | `#54D8FF` | Shaped by cosmic/stellar forces |
| 8 | `primordial` | Primordial | Ancient Crimson | `#D85B3F` | Ancient, foundational lineage |
| 9 | `transcendent` | Transcendent | Radiant Prismatic White | `#F7F1FF` | Breaks physical/temporal/cosmic rules |

**Unique overlay colors:** white-gold `#FFE7A3`, highlight `#FFF9E8`, subtitle "One of a Kind".
**Transcendent presentation:** radiant white + pale-lavender glow + prismatic edge (never plain white —
must not read as Common). **Accessibility:** color is never the only signal — always the written label,
a tier border/frame, and (later) a discovery-sound intensity.

---

## 2. Rarity vs Modifier vs Designation (three separate fields)

Store separately: `rarity_tier`, `primary_modifier`, `secondary_conditions[]`, `designations[]`.
- **Rarity** — how scarce/powerful/significant (the 10-tier ladder).
- **Modifier** — what physically/biologically/cosmically shapes it (Hollow, Crystalline, Tidally-Locked…).
- **Designation** — special status outside the ladder (Unique, Anomalous).

**Display order** (normal caps): `[Designation] [Rarity] [Primary Modifier] [Entity Type]`
- "Unique Primordial Hollow World" · "Anomalous Exotic Crystal Flora" · "Legendary Armored Fauna"
- Short form when space-limited: "Primordial World" / "Hollow · Unique".

---

## 3. PHASE A — the rarity vocabulary (ships first, surgical re-pin)

**Goal:** the whole game speaks the 10-tier language, normal caps, no glyphs — with the universe and all
gameplay UNCHANGED. Pure relabel over the existing roll.

**Implementation (concrete):**
1. Add a canonical `RARITY_V17` config in `main.js` (the 10 rows above: tier·id·name·hex).
2. Add `displayRarity(rawScore) = RARITY_V17[clamp(rawScore, 0, 9)]`.
3. Keep `rarityRoll` (raw 0–14) **untouched** — do NOT change thresholds.
4. Route the grade-producing functions to the new names/colors and drop the star glyph:
   - `speciesGrade(g)` → name/color via `displayRarity`; `.star` → removed/blank.
   - `spectral(domain, seed)` → split its two jobs: **rarity label** = `displayRarity(tier).name` (e.g.
     "Rare"); **art hue** = the existing per-domain color (unchanged, drives planet/star ART only).
   - `colorGrade(kindHue, seed)` → tier color from `RARITY_V17`.
   - `guardianFor` / apex forced grades → still force internally; display clamps to Transcendent.
5. Card + Codex + tooltip + discovery-callout rendering → normal capitalization, no glyphs, badge uses
   the tier color (art unchanged).
6. `recordCreature` and any other place printing `entry.grade.name + star` → drop the star.
7. **Surgical re-pin:** this changes only the grade-*naming* probes (`speciesGrade`, `spectral`,
   `colorGrade`, `speciesGrade`-derived). Verify `rarityRoll` and every generation probe are byte-identical
   (0 other probe diffs), then re-pin ONLY those entries in `tools/baseline.json` (the Pass-7 pattern:
   back up baseline, copy the changed probe fingerprints, abort if any other probe differs).
8. Add sentinels/gates: no `★/✦/✧` in rarity output; no ALL-CAPS rarity strings; `displayRarity` clamps 10+.
9. **Gear/loot on the ladder:** route crafted-item + gear + v1.6 loot-affix rarity through the same
   `RARITY_V17` names/colors, so item cards match.
10. **Discovery gating:** rarity is not rendered until the discovery moment — worlds on successful landing,
    creatures/plants on catch/scavenge, stars on survey. Orbit shows only the teaser. (Presentation gate,
    fp-safe.)
11. **Escalating reveal + accessibility:** tier-scaled reveal (color/glow/sound/animation, biggest
    flourishes reserved for the scarce top tiers) + a distinct per-tier frame/border so rarity reads
    without color.
12. **Cross-kind Compendium views:** filter/sort by rarity across creatures/plants/worlds (a follow-on UI
    affordance the single ladder unlocks; can trail the core relabel if needed).

**Reconciliations:** Tier-0 Common lands quietly (no discovery banner — banners only for Legendary+/Unique),
which preserves the "ordinary world = no callout" intent. World rarity is still revealed on LANDING
(the discovery beat), not in orbit — see FORGE_AND_DISCOVERY.md Pillar 1.

---

## 4. PHASE B — the generation-modifier system (larger, universe-affecting, ships after A)

**This is the big one — it changes what worlds and organisms GENERATE, not just their labels.** A modifier
"must alter generation inputs or outputs" (terrain, biome weights, atmosphere, gravity, resources, flora/
fauna pools, sky…). So adding modifiers reshapes the universe → existing seeds/share codes generate
DIFFERENT worlds. That's a deliberate universe evolution + a FULL re-pin, and needs its own design pass.

Scope (see the full design spec for detail):
- **Rarity/Modifier/Designation as separate stored fields** (§2 above).
- **Planet modifier families** — structural (Hollow, Shattered, Tidally-Locked, Crystalline-Mantled, Living,
  Temporal…) + condition families (atmosphere, gravity, climate, energy, cosmic) — each altering ≥3 gen
  outputs.
- **Star modifier families** — system architecture / stellar behavior / composition — propagating to the
  whole system (planet count, radiation, light, biome weights…).
- **Anchor-tier resolver** for organisms: `resolved = max(archetype, trait, power, scarcity, ecological,
  origin tiers) + synergy(0..1) + significance(0..1) − abundance(0..2) − contradiction(0..1)`; ordinary
  upward adjustment ≤ 2 tiers.
- **World rarity envelope** — the world sets the *possible* organism-rarity range + spawn weights; each
  organism resolves its OWN final rarity inside that envelope. `organism_rarity ≠ world_rarity`.
  Earth starter-zone cap stays: flora/fauna ≤ Uncommon.
- **Target-tier generation pass** (resolve envelope → pick target → build traits → resolve actual rarity →
  ±1 tier → validate semantics for Tier 5+ → apply caps/overrides/designations).
- **Semantic requirements by tier** — Celestial needs a real cosmic connection, Primordial a real ancient
  origin, Transcendent a real rule-break; scarcity alone caps at Rare, anatomy alone at Exotic, stats
  alone at Legendary.
- **Unique registry** — authored one-of-ones with stable `unique_key`, protected generation, `unique_scope`,
  `is_unique_individual/species/lineage`. Never selected by ordinary weighted roll.
- **Determinism** — dedicated hash streams `hashInt(seed, SALT, SCHEMA_VERSION)`; NEVER consume extra values
  from existing sequences (that would shift already-generated entities). Versioned schemas.
- Internal rarity score may exceed 9 for sorting/balancing, but display always clamps to 9.

---

## 5. Migration reference

**15-tier → 10-tier (display, via direct score read):** scores 0–5 keep their names (Common…Legendary);
score 6→Mythic, 7→Celestial, 8→Primordial, 9→Transcendent; scores 10–14 all display Transcendent (raw kept
internally). Old names Anomalous/Unique/Empyrean/Eternal/Omnipotent are deleted from the ladder (Anomalous →
optional `anomalous` designation/modifier; auto-"Unique" was never one-of-one → just its rarity now; true
one-of-one Unique → authored designation).

**Discovery presentation (normal caps):**
- "Legendary world discovered — Tidally locked. Life clings to the narrow frontier between day and night."
- "Celestial star discovered — Ancient K-class star."
- "Mythic flora discovered — Phase-bloom."
- "Unique world discovered — The Shattered Crown · One of a kind · Primordial world."

---

*Related: `RARITY_AND_GRADES.md` (current system) · `FORGE_AND_DISCOVERY.md` (v1.7 arc + discovery flow) ·
`SPECIES_AND_GENOME.md` · `WORLD_GENERATION.md` · `DETERMINISM.md`.*
