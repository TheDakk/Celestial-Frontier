# Celestial Frontier — Materials, Ingredients, Crafting & Gear (v1.7 "The Forge")

**Status:** CANONICAL design of record for v1.7 "The Forge". FULL adoption — no lean MVP.
**Matches code as of:** design only, 2026-07-22. **Build phase:** the vocabulary rides Phase A; the
generation + crafting economy is Phase B (post-v1.6, full re-pin).
**Related:** `RARITY_UNIVERSAL.md`, `FORGE_AND_DISCOVERY.md`, `ECONOMY_LOOT_CRAFTING.md`.

## 0. Locked decisions (Nick, 2026-07-22)
- **STEAM is the destination.** The game is being built toward a Steam release, so depth is the product —
  we adopt EVERY idea in full, not a lean subset. Build the cathedral. (Packaging the HTML/canvas build for
  Steam — wrapper/desktop shell — is a separate later track; noted for the roadmap.)
- **Full adoption of the reviewed spec below** — it corrects three real flaws in the first draft:
  (1) finished-gear rarity is anchored by a DEFINING component/mechanic, not the rarest ingredient;
  (2) world rarity influences resource eligibility/richness/probability, it does NOT copy its rarity onto
  every material; (3) landing performance affects ACCESS/discovery/sampling, never rewrites deterministic
  world generation. Plus the separate-dimensions model (rarity vs level vs quality vs affix vs upgrade vs
  designation) that stops "rarity = power" collapse.
- **All 47 materials are craft-critical** (not a 20–25 subset) — every material earns a job (§21).
- **Quality is a real dimension, presented FOLDABLE** — it uses the game's expand/close card grammar so the
  detail (Crude→Standard→Refined→Masterwork→Perfect) tucks away and doesn't crowd the mobile card.
- **Cosmic materials = SEVEN** (Stellar Plasma, Coronium, Protomatter, Primordial Ice, Void Essence,
  Chronal Shard, Dark Matter), classified as raw/energy/catalyst/component (not all mineable ore).
- **Determinism preserved** — crafting deterministic from `hashInt(recipeId, inputSignature, station,
  crafter, SCHEMA_VERSION)`; material generation in worlds is the fingerprinted piece → the v1.7 materials
  re-pin. Landing never rewrites generation.

---

## 1. Universal rarity (shared with `RARITY_UNIVERSAL.md`)

All materials, ingredients, recipes, components, consumables, gear, upgrades, planets, stars, flora, and
fauna use the same 10-tier ladder + colors: Common `#B8BDC7` · Uncommon `#4FD16B` · Notable `#35C9B5` ·
Rare `#3D8BFF` · Exotic `#9A5CFF` · Legendary `#F4A62A` · Mythic `#E54B8D` · Celestial `#54D8FF` ·
Primordial `#D85B3F` · Transcendent `#F7F1FF`. **Unique** stays a one-of-one designation, never a tier.

## 2. Separate item dimensions (do not collapse into rarity)

| Dimension | Meaning |
|---|---|
| Rarity | Scarcity, significance, mechanical distinctiveness, origin |
| Item Level | Numerical power vs. character/world progression |
| Quality | Purity, condition, precision, craftsmanship (Crude→Standard→Refined→Masterwork→Perfect) — **foldable** |
| Affixes | Generated/selected gameplay effects (v1.6 loot core) |
| Upgrade Level | Player-applied enhancement after acquisition |
| Designation | Unique, Anomalous, Named, Quest, Signature |

A high-level Common weapon may out-damage an early Legendary; the Legendary stays Legendary for its
exceptional *mechanical identity*. Quality modifies stat rolls/durability/efficiency/affix ranges — it does
NOT change rarity.

## 3. Elemental & material foundation (build on the ~40 existing + 7 cosmic)

**Rock/industrial/base:** Iron, Silicon, Magnesium, Aluminium, Calcium, Sodium, Nickel, Titanium, Copper,
Zinc, Tin, Manganese, Chromium, Lead, Tungsten.
**Nonmetals/gases/volatiles:** Hydrogen, Helium, Carbon, Nitrogen, Oxygen, Sulfur, Phosphorus, Chlorine,
Water Ice, Methane Ice, Ammonia Ice, Dry Ice, Helium-3.
**Precious/radioactive/tech:** Silver, Gold, Platinum, Iridium, Uranium, Thorium, Lithium, Cobalt,
Neodymium, Promethium.
**Existing exotics:** Voidglass, Prismatium.
**Proposed cosmic (7):**

| Tier family | Materials | Function | Class |
|---|---|---|---|
| Celestial | Stellar Plasma / Coronium | stellar power, containment, shields, high-energy weapons | energy medium / stabilized condensate |
| Primordial | Protomatter / Primordial Ice | foundational construction, genesis systems, ancient restoration | raw matter / ancient volatile |
| Transcendent | Void Essence / Chronal Shard / Dark Matter | phase, spatial, temporal, reality-breaking crafting | catalyst / temporal component / contained substrate |

Classify each cosmic resource as `raw_material` / `energy_medium` / `catalyst` / `stable_component` — not
every top-tier resource behaves like mineable ore.

## 4. Material identity model — substance vs instance

Distinguish the substance definition from a deposit/harvested instance:
`Material Substance + Physical Form + Grade/Purity + Provenance + Optional Modifier → Resolved Rarity`.
So ordinary Iron stays ordinary even on a Celestial world, but an ultra-pure magnetized iron from a
supernova-scarred world can resolve Notable. Fields: `material_id, substance_id, material_family,
physical_form, base_rarity_tier, purity_grade, provenance_id, property_modifier_ids, natural_abundance,
distribution_scope, extraction_difficulty, processing_difficulty, hazard_tier, replaceability,
defining_property_tier, origin_significance_tier, resolved_rarity_tier, quality_grade, schema_version`.

## 5. Material rarity resolution (material earns its own rarity, not copied from the world)

```
material_anchor_tier = max(base_substance_tier, scarcity_tier, defining_property_tier,
                           origin_significance_tier, extraction_tier, processing_tier)
resolved_material_rarity = material_anchor_tier + exceptional_purity_bonus(0..1) + coherent_property_bonus(0..1)
                           - abundance_penalty(0..2) - easy_substitution_penalty(0..1)
```
Semantic caps: 0–1 ordinary · 2–3 scarce/pure/specialized · 4 unusual composition · 5 exceptional & hard to
replace · 6 exceeds materials science · 7 explicit stellar/cosmic · 8 explicit foundational/first-era · 9
explicit reality-breaking. Don't add points for ordinary properties.

## 6. World-to-resource generation (break the circular model)

Order: star class+modifiers → planet type+structural modifiers → atmosphere/gravity/temp/liquids/hazards/
biome → **resource palette from geology/chemistry/biology/star influence** → deposits (grade/depth/richness/
exceptional candidates) → resolve material-instance rarities → resolve WORLD rarity from the completed world
(resource significance an input where appropriate) → world-rarity validation + high-tier semantics → place
deposits deterministically → reveal via survey/landing.

World rarity **influences**: high-grade deposit frequency, richness/depth, exceptional-variant probability,
cosmic/ancient availability, number of resource families, hazard-to-reward, survey complexity. World rarity
**must NOT**: turn every deposit into the world's rarity, auto-upgrade Common substances, create deposits
after landing, or guarantee uniform richness. Semantic caps hold (Celestial needs stellar source, etc.);
ordinary worlds may hold a rare exceptional deposit; high-tier worlds still hold abundant Commons.

## 7. Landing, discovery & rare finds (access/efficiency — NEVER a world rewrite)

The survival→discovery loop stays central:
> Survive difficult landings → access dangerous worlds → find better resources & life → craft stronger
> survival & prospecting gear → reach even harsher destinations.

**Landing challenge** may require hazard/heat/cryo/pressure/radiation/gravitic/atmospheric/first-contact/
landing gear. **Precision landing** may grant: better first samples, more survey info, a temporary
prospecting bonus, a nearby minor cache, higher sample purity, faster hidden-deposit ID, less extraction
damage, better placement near a chosen signal. It must NOT raise world rarity, change a deposit's resolved
rarity, reroll flora/fauna rarity, generate incompatible-tier materials, or replace world data.

**Prospecting gear** improves detection range, signal resolution, hidden-deposit discovery, sample purity,
extraction efficiency, rich-strike yield, deep-reserve access, ID speed. **No universal "magic-find" reroll**
— separate systems: `resource_detection, sample_quality, extraction_yield, biological_discovery,
tame_assistance, salvage_quality`.

## 8. Star rewards (survey UNLOCKS extraction; a scan doesn't drop plasma in cargo)

```
Star survey → identifies stellar resource opportunities → unlocks a probe/skim/station/expedition target
→ player performs extraction/recovery → captured material enters cargo
```
Rewards: stellar-composition data, blueprints, nav data, coronal-harvest coords, solar-skimming ops, ruined
collectors, energy signatures, limited probe-captured samples. Star rarity/modifiers drive extraction
danger, yield, stellar-material eligibility, material properties, system resource profiles, required tech.

## 9. Biological ingredients (parts don't copy the organism's rarity)

A Mythic creature can give Uncommon meat, Rare hide, Exotic armor-plate, Legendary regen-gland, Mythic
reality-core. `ingredient_anchor_tier = max(source_part_base, potency, property, origin)`;
`resolved = anchor + low_yield_bonus + destructive_harvest_bonus + specialized_use_bonus
- high_abundance_penalty - instability_penalty`. Source organism sets eligibility/probability; the harvested
PART determines final rarity.

## 10. Refined materials, recipes, components (each earns rarity differently)

- **Refined** (ingots/alloys/fibers/compounds/extracts/energy-media/lenses/synthetic-organs/stabilized-anomaly):
  `anchor = max(recipe, defining_input, created_property, required_process); resolved = anchor +
  coherent_input_synergy + exceptional_process_bonus - contamination_penalty - mass_production_penalty`.
  Many Commons don't auto-produce high tier; a rare decorative input doesn't raise the result unless it
  DEFINES the output; quality ≠ rarity.
- **Recipes/blueprints** — rarity = rarity/sophistication of the KNOWLEDGE (scarcity, faction/ancient origin,
  research complexity, stages, station, expertise, output mechanic, reproducibility). A recipe sets the
  output's normal CAP, not an automatic floor. Fields: `minimum_station_tier, supported_output_tiers,
  normal_output_cap, required_defining_inputs, supporting_input_slots, allowed/incompatible_property_families,
  quality_formula, failure_or_defect_rules`.
- **Components** (weapon cores/armor plates/shield emitters/power cells/scopes/engines/circuitry/catalysts/
  implants/ship & landing modules) — rarity = functional sophistication, driven by the defining function,
  not material count.

## 11. Gear families (combat & discovery reinforce, never compete)

- **Combat & defense:** suits/armor, plating/shields, weapons/combat tools, medical/repair, resistance
  charms/relics, bio/synthetic implants, combat drones, ammunition/charge modules.
- **Exploration & discovery:** hazard suits, gravitic anchors/landing systems, scanners/sensors, prospecting
  rigs, survey probes, extraction tools, environmental samplers, first-contact/diplomacy, salvage, nav/anomaly
  instruments.
- **Infrastructure & support:** crafting stations, refinery modules, base systems, ship modules, cargo
  preservation, power generation, research equipment, automated harvesters.

## 12. Finished-gear rarity (defining anchor, NOT rarest ingredient)

```
gear_anchor_tier = max(blueprint_supported, base_frame, defining_component, primary_mechanic,
                       origin_significance)
resolved_gear_rarity = anchor + coherent_build_synergy + exceptional_process_bonus + special_significance_bonus
                       - defect_penalty - conflicting_trait_penalty - mass_production_penalty
clamp: resolved <= recipe_normal_cap, station_cap, technology_cap   (masterwork/authored/Unique = explicit exceptions)
```
Gear-tier identity is QUALITATIVE per tier (Common ordinary → Legendary build-defining mechanic → Celestial
stellar-powered → Primordial first-era → Transcendent breaks a game-system rule). Safeguards: affix COUNT
never sets rarity; five ordinary % bonuses ≠ Legendary; high damage alone caps at Legendary; Celestial/
Primordial/Transcendent need explicit qualifications; drawbacks balance but don't lower conceptual tier.

## 13. Affixes (v1.6 loot core → the ladder)

Affixes may use the ladder internally: `affix_id, affix_family, minimum_item_rarity, affix_power_tier,
affix_mechanic_tier, compatible_item_types, compatible_material_properties, incompatible_affix_ids, weight,
roll_range, schema_version`. Roles: `primary_defining_affix, supporting_affix, utility_affix, drawback_affix,
cosmetic_affix`. Only the primary defining affix (or intrinsic mechanic) sets the item's upper rarity.

## 14. Crafting requirements by output tier

Common: common recipe/inputs/basic station → … → Legendary: Legendary anchor + coherent Rare/Exotic support
→ Mythic: mythic anchor + high-tier process → Celestial/Primordial/Transcendent: explicit cosmic material +
capable forge + rule-breaking process. A high-tier craft = `1 defining anchor + supporting structural +
functional components + optional catalyst + station + recipe knowledge` — so piles of low-tier resources
never convert straight to top-tier gear, and the full 47-material roster stays relevant.

## 15. Deterministic crafting + controlled variation

Base identity + rarity deterministic from recipe/inputs/grades/station/crafter/process/`craft_seed`/schema:
`craftSeed = hashInt(recipeId, inputSignature, stationId, crafterId, CRAFT_SCHEMA_VERSION)`. Controlled
variation (affix values, quality result, minor cosmetics, non-defining secondary props, defect chance) is
allowed; base rarity is NOT a hidden uncontrolled roll. Same inputs+seed → same result on every device.

## 16. Unique items & materials

Separate from rarity (Unique Legendary Weapon, Unique Mythic Catalyst, …). Requires `is_unique, unique_key,
unique_scope, unique_display_name, unique_rule`. Never auto-assigned from a rare procedural combo. Unique
materials originate from one named entity/location/event/object/quest chain; consumed only when design
explicitly supports loss/recovery/replication/universe-state consequences.

## 17. Material jobs (all 47 earn a role — Nick: keep all 47 craftable)

- **Structural spine:** Iron, Titanium, Tungsten, Silicon, Chromium.
- **Function unlockers:** Lithium/Cobalt (energy & medical), Neodymium (sensors/magnetics), Uranium/Thorium
  (power), volatiles/ices (cooling & life support), Helium-3 (fusion).
- **Defining rarity anchors:** Voidglass, Promethium, Prismatium, Stellar Plasma, Protomatter, Chronal Shard.
- **Elemental/thematic affinity:** Sulfur→chem/combustion, Voidglass→Void, Prismatium→Prism, Coronium→stellar/
  thermal, Primordial Ice→preservation/genesis.
- **Economy/support roles:** trade, research, repairs, ammunition, construction, fuel, consumables, faction
  contracts, terraforming, Codex completion. No material exists as a name with no purpose.

## 18. Category profiles (one framework, per-category evaluation)

One top-level rarity framework with profiles per: `raw_material, energy_medium, biological_ingredient,
refined_material, crafted_component, recipe, consumable, gear, upgrade_material, station, ship_module,
quest_item`. Each returns a Tier 0–9 output but evaluates different inputs.
> Materials earn rarity through scarcity/properties/origin. Ingredients through potency/harvest constraints.
> Recipes through knowledge/complexity. Components through function/precision. Gear through its completed
> mechanical identity.

## 19. Data schema (v1.7)

- **Shared item:** `item_id, item_category, base_definition_id, item_level, quality_grade, rarity_score,
  rarity_tier, rarity_id, rarity_display_name, rarity_color_hex, affix_ids, upgrade_level, designation_ids,
  is_unique, unique_key, schema_version`.
- **Crafting:** `recipe_id, recipe_rarity_tier, normal_output_min_tier, normal_output_max_tier,
  required_defining_inputs, supporting_input_slots, optional_catalyst_slots, minimum_station_tier,
  technology_requirement, quality_formula, rarity_resolver_profile, craft_seed`.
- **Resource deposit:** `deposit_id, substance_id, world_id, biome_id, depth_band, deposit_size, richness,
  purity_grade, hazard_tier, property_modifier_ids, resolved_rarity_tier, discovery_state, extraction_state,
  schema_version`.

## 20. Final rules

1. All categories use the 10-tier names/colors. 2. Rarity separate from level/quality/affix/upgrade/Unique.
3. World influences probability/origin, not every resource's rarity. 4. Materials & ingredients resolve their
own rarity. 5. Finished item ≠ rarest ingredient. 6. Recipes define supported ranges + normal caps. 7. A
defining component/mechanic anchors gear rarity. 8. High tiers need explicit Celestial/Primordial/Transcendent
qualifications. 9. Landing affects access/info/sampling/extraction — not deterministic contents. 10.
Prospecting improves detection/yield, not universal rerolls. 11. Stars reveal/unlock; extraction is a
gameplay action. 12. Unique = protected one-of-one. 13. Every active material has ≥1 role. 14. Crafting
deterministic under same inputs/seed/schema. 15. Internal scores may exceed 9; display clamps to Transcendent.

## 21. Inventory & storage architecture (Nick, 2026-07-22)

With 47 materials + a deep crafting tree, storage must be **separated by kind** so nothing chokes the slot
grid. Three buckets, as tabs on the character sheet (extends today's Cargo-hold-vs-bag split — materials
already live as stackable keyed counts in `cargo`):

- **Materials tab** — every raw material / element / ingredient. **Stackable** (one entry per substance with
  a count, not one slot per unit), **auto-collected** (mining/harvesting/sampling flows straight here), and
  **ample capacity** so the player can hold the full roster without slot pressure. Grid of material icons +
  counts, grouped by family/rarity. This is the formalized, expanded Cargo hold.
- **Craftables tab** — crafted NON-gear outputs (consumables, components, refined materials, blueprints,
  ammo, catalysts, station parts). Their own space so they don't crowd equippable gear. Stackable where it
  makes sense (consumables/components).
- **Inventory (gear) — the slot grid / paperdoll** — holds ONLY equippable **gear** and crafted gear items.
  This is the Diablo-style bag under the portrait (pack modules keep growing its rows). Enough slots to hold
  a real gear collection; materials & consumables never eat gear slots.

Rules:
- **Materials & consumables stack**; only unique/instanced gear takes a discrete slot.
- **Auto-routing:** a mined element or harvested ingredient lands in Materials automatically (no manual
  slotting); a crafted consumable lands in Craftables; a crafted/equippable piece lands in the gear bag.
- **Capacity:** gear-bag slots are the only bounded resource (grown by pack modules); Materials/Craftables
  are generous/effectively-unbounded stackable stores so the full 47-material economy is always holdable.
- **UI:** tabs use the game's existing expand/close card grammar; mobile-first — each tab is its own scroll
  view, so the character sheet never overflows on a phone.

## 22. Art direction — FULL BESPOKE (Nick, 2026-07-23, LOCKED)

Every material, every gear piece, and every ship tier is **hand-drawn painterly art at the same HD bar as
the creatures** — this is a hard requirement, not a nice-to-have, and it is baked in now so it can never be
value-engineered down during the build. See also the standing **HD engine law** (`[[celestial-frontier-hd-engine-law]]`).

**Foundation already in place:** materials (`_hdElemIcon`) and gear (`partIcon`) already render through the
same painterly canvas engine as the bestiary — **144px masters**, real technique (faceted gems, translucent
ice spears, glowing flasks, isometric ingots; plating/coils/circuitry/frames for gear). The classic SVG icon
set was deleted as dead code. So consistency is satisfied at the ENGINE level; the Phase-B work is COVERAGE +
DISTINCTIVENESS, not a rebuild.

**The mandate:**
- **All 47 materials get their OWN bespoke 144px master — NO family-recolor shortcuts.** The current
  4-archetype recolor (gem/ice/gas/ingot, tinted per element) is SUPERSEDED. Iron ≠ Titanium ≠ Copper ≠ Gold
  ≠ Silver ≠ Tungsten at a glance: each earns a distinct silhouette (native nugget / cast ingot / raw ore
  chunk / crystal cluster / powder / rolled foil / sealed ampoule / …) **and** material-true detailing —
  gold's warm sheen, iron's rust-flecked matte, titanium's blue heat-tint, copper's verdigris, sulfur's
  crumbly yellow, uranium's cased glow, etc.
- **The 7 cosmic materials get bespoke, otherworldly forms** — a plasma vial that actually glows (Stellar
  Plasma), a stabilized condensate (Coronium), raw first-era matter (Protomatter), an ancient volatile
  (Primordial Ice), a fractured phase-shard (Void Essence), an out-of-phase fragment (Chronal Shard), a
  contained substrate (Dark Matter). These carry the "wow" and must look unlike any ordinary ore.
- **Gear: bespoke painterly masters per family AND tier** — a Legendary rig reads visibly richer than a
  Common one (more ornament, finer materials, a rarity glow), with the **rarity frame on the item card**
  (ties into the 10-tier ladder, `[[rarity_universal]]`).
- **Ship: hull tiers that visibly upgrade** as systems are built (the Shipyard already grows the hull;
  extend it to distinct painterly tier art).
- **Determinism + engine reuse:** build on the existing painterly engine (extend `_hdElemIcon`/`partIcon`
  into a per-material / per-gear master registry), 144px+ masters, deterministic, no `Math.random`/`Date.now`.
- **Proof-sheet EVERYTHING for Nick's sign-off** before it ships — the same review loop as the bestiary
  (a full contact sheet of all 47 materials + every gear family×tier + ship tiers).

**Sequence:** this is P3 of the v1.7 arc and rides on the material roster + economy existing in code, so
Phase B builds the economy first (Materials/Craftables/Gear in `cargo`/`items`, the resolvers, the recipes),
then the bespoke art registry is laid over it and proof-sheeted.

## 23. ARPG item windows — Diablo 2 / Path of Exile feel (Nick, 2026-07-23, LOCKED)

The item tooltip is a first-class feature, modelled on **Diablo 2 and Path of Exile 1 & 2**. Foundation exists:
`#itemcard` / `renderItemCard` already opens a rarity-colored card with an affix line + equip button, and the
loot model (`rollAffix`, `AFFIX_DEFS`, `equipAff`, `_slotAffix`, the 10-tier ladder, tier-as-item-level) is
already ARPG-shaped. P4 upgrades it to the full anatomy.

**Trigger:** desktop **hover**, mobile **tap** (per §7 / the spec) → a framed tooltip.

**Anatomy (top → bottom), the PoE/D2 tooltip structure:**
1. **Rarity header band** + item name (+ a "One of a Kind" subtitle when Unique-designated).
2. **Item type + item level** line (and slot).
3. divider → **implicit / intrinsic** mods.
4. divider → **explicit affix lines**, each showing its rolled value **and its possible range** (PoE-style
   "+18% (12–20%)"); the primary/defining affix is highlighted; drawback affixes read in a warning tone.
5. **Quality** (foldable, Crude→Standard→Refined→Masterwork→Perfect — §2) and **upgrade level**.
6. **Sockets / links / upgrade** rows where applicable.
7. **Requirements** (station tier, tech) if any.
8. italic **flavor text** at the bottom.

**Frame:** a per-tier ornamental **frame around the whole window** (the ladder's normal/magic/rare/unique-
equivalent borders, `[[rarity_universal]]` §3.11), readable without color (a11y).

**Compare-to-equipped:** hovering/tapping shows the item **beside the worn piece** with green/red stat
**deltas** (the D2/PoE compare pane).

**Aesthetic:** lean toward **PoE 2's cleaner hierarchy** while keeping D2/PoE1 information density; mobile-
first, so the less-critical rows (quality, requirements, flavor) fold via the card grammar on phones. Build on
the existing `#itemcard` + affix model, extended. **P4 of the v1.7 arc; rides on P3 art + the done rarity ladder.**

---

*Design basis: Nick's reviewed "Materials, Ingredients, Crafting & Gear" spec (uploaded 2026-07-22), plus the
2026-07-23 FULL-BESPOKE art decision (§22) — this file is the repo-canonical adoption. FULL fidelity for the
Steam build. Build after v1.6, Phase B.*
