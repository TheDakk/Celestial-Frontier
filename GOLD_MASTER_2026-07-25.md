# Celestial Frontier v1.7 — Materials, Gear, and Art Gold Master Specification

**Release:** V1.7  
**Status:** Compiled implementation and release-readiness document  
**Audience:** Simulation, procedural generation, economy, crafting, combat, UI, Codex, art, and QA teams  

---

## Master Contents

1. **Part I — Materials, Ingredients, Crafting & Gear**
2. **Part II — Folders 1–4 and 6 Detailed Gold Assessment**

This master file combines the reviewed Materials & Gear implementation proposal with the detailed visual Gold-readiness assessment. The two source sections are preserved as authoritative working specifications.

---

# Part I — Materials, Ingredients, Crafting & Gear

**Release:** V1.7 “Forge”  
**Status:** Reviewed implementation proposal  
**Audience:** Simulation, procedural generation, economy, crafting, combat, UI, and Codex teams  
**Related:** `RARITY_UNIVERSAL.md`, `FORGE_AND_DISCOVERY.md`, `ECONOMY_LOOT_CRAFTING.md`

---

## 1. Review Decision

The original materials-and-gear proposal has the correct foundation and should **not** be replaced.

Retain:

- The universal 10-tier rarity vocabulary
- The existing elemental and mineral roster
- World-type resource identities
- The survival-to-discovery progression loop
- Combat and prospecting gear as mutually reinforcing paths
- Dedicated deterministic generation streams
- Cosmic materials as rewards for high-tier exploration

Revise:

1. A world’s rarity should influence resource **eligibility, richness, and probability**, but should not blindly assign every material’s rarity.
2. Landing performance must not reroll the world or cause rare deposits to appear after generation.
3. A finished item must not inherit rarity from the single rarest ingredient.
4. Rarity, item level, craftsmanship quality, affixes, upgrades, and Unique status must remain separate.
5. High tiers require explicit semantic qualifications; they cannot be reached by stacking ordinary bonuses.
6. Stars should reveal or unlock stellar-material extraction opportunities rather than awarding large physical materials from a simple scan.

---

## 2. Universal Rarity System

All materials, ingredients, recipes, components, consumables, gear, upgrades, planets, stars, flora, and fauna use the same player-facing ladder and colors.

| Tier | Rarity | Color | Universal Meaning |
|---:|---|---|---|
| 0 | **Common** | `#B8BDC7` | Ordinary, widespread, and easily replaced |
| 1 | **Uncommon** | `#4FD16B` | Less frequent or modestly specialized |
| 2 | **Notable** | `#35C9B5` | Distinctive enough to matter mechanically |
| 3 | **Rare** | `#3D8BFF` | Scarce, specialized, or difficult to produce |
| 4 | **Exotic** | `#9A5CFF` | Unusual composition, behavior, construction, or origin |
| 5 | **Legendary** | `#F4A62A` | Exceptional, renowned, or build-defining |
| 6 | **Mythic** | `#E54B8D` | Beyond conventional biological or technological limits |
| 7 | **Celestial** | `#54D8FF` | Requires or channels stellar and cosmic forces |
| 8 | **Primordial** | `#D85B3F` | Uses foundational matter, first-era knowledge, or ancient origin |
| 9 | **Transcendent** | `#F7F1FF` | Breaks normal physical, temporal, spatial, or crafting rules |

**Unique remains a separate one-of-one designation and is never an eleventh rarity tier.**

---

## 3. Separate Item Dimensions

Do not collapse all progression into rarity.

Every item may carry independent values:

| Dimension | Meaning |
|---|---|
| **Rarity** | Scarcity, significance, mechanical distinctiveness, and origin |
| **Item Level** | Numerical power appropriate to character or world progression |
| **Quality** | Purity, condition, precision, and craftsmanship |
| **Affixes** | Generated or selected gameplay effects |
| **Upgrade Level** | Player-applied enhancement after acquisition |
| **Designation** | Unique, Anomalous, Named, Quest, Signature, or similar status |

A high-level Common weapon may deal more baseline damage than an early Legendary weapon. The Legendary weapon remains Legendary because it possesses a more exceptional mechanical identity.

Recommended quality vocabulary:

```text
Crude → Standard → Refined → Masterwork → Perfect
```

Quality may modify stat rolls, durability, efficiency, weight, energy consumption, or affix ranges. It does not automatically change rarity.

---

## 4. Existing Elemental and Material Foundation

Build on the current roster rather than replacing it.

### Rock, industrial, and base materials

- Iron
- Silicon
- Magnesium
- Aluminium
- Calcium
- Sodium
- Nickel
- Titanium
- Copper
- Zinc
- Tin
- Manganese
- Chromium
- Lead
- Tungsten

### Nonmetals, gases, and volatiles

- Hydrogen
- Helium
- Carbon
- Nitrogen
- Oxygen
- Sulfur
- Phosphorus
- Chlorine
- Water Ice
- Methane Ice
- Ammonia Ice
- Dry Ice
- Helium-3

### Precious, radioactive, and technology materials

- Silver
- Gold
- Platinum
- Iridium
- Uranium
- Thorium
- Lithium
- Cobalt
- Neodymium
- Promethium

### Existing exotics

- Voidglass
- Prismatium

### Proposed cosmic materials

| Tier Family | Materials | Primary Function |
|---|---|---|
| Celestial | Stellar Plasma, Coronium | Stellar power, containment, shields, high-energy weapons |
| Primordial | Protomatter, Primordial Ice | Foundational construction, genesis systems, ancient restoration |
| Transcendent | Void Essence, Chronal Shard, Dark Matter | Phase, spatial, temporal, and reality-breaking crafting |

The proposal contains **seven** new cosmic materials, not five.

Before implementation, classify each cosmic resource as one of:

```text
raw_material
energy_medium
catalyst
stable_component
```

Not every top-tier resource should behave like mineable ore.

Examples:

- Stellar Plasma: captured energy medium
- Coronium: stabilized stellar condensate
- Protomatter: foundational raw matter
- Primordial Ice: ancient volatile
- Void Essence: anomaly catalyst
- Chronal Shard: temporal crystal/component
- Dark Matter: contained exotic substrate

---

## 5. Material Identity Model

A material entry should distinguish the **substance definition** from a particular deposit or harvested instance.

```text
Material Substance
+ Physical Form
+ Grade / Purity
+ Provenance
+ Optional Modifier
+ Resolved Rarity
```

Example:

```text
Substance: Iron
Form: Metallic Ore
Grade: Ultra-Pure
Provenance: Supernova-Scarred World
Modifier: Magnetized
Resolved Rarity: Notable
```

This avoids forcing every instance of Iron to remain identical while also preventing ordinary Iron from becoming Celestial merely because it was found on a Celestial world.

### Recommended material fields

```text
material_id
substance_id
material_family
physical_form
base_rarity_tier
purity_grade
provenance_id
property_modifier_ids
natural_abundance
distribution_scope
extraction_difficulty
processing_difficulty
hazard_tier
replaceability
defining_property_tier
origin_significance_tier
resolved_rarity_tier
quality_grade
schema_version
```

---

## 6. Material Rarity Resolution

Raw-material rarity is determined by the material itself, not copied from the world.

### Material rarity inputs

- Natural abundance
- Distribution scope
- Extraction difficulty
- Processing difficulty
- Purity
- Hazard
- Replaceability
- Mechanical properties
- Elemental or biological properties
- Cosmic or ancient origin
- Whether the material violates ordinary physical rules

### Resolver

```text
material_anchor_tier = maximum of:
- base_substance_tier
- scarcity_tier
- defining_property_tier
- origin_significance_tier
- extraction_tier
- processing_tier

resolved_material_rarity =
  material_anchor_tier
  + exceptional_purity_bonus
  + coherent_property_bonus
  - abundance_penalty
  - easy_substitution_penalty
```

Recommended normal adjustments:

```text
exceptional_purity_bonus = 0 to 1
coherent_property_bonus = 0 to 1
abundance_penalty = 0 to 2
easy_substitution_penalty = 0 to 1
```

Do not add points for every ordinary property.

### Semantic requirements

| Tier | Material Requirement |
|---:|---|
| 0–1 | Ordinary industrial, biological, or environmental substance |
| 2–3 | Meaningfully scarce, pure, specialized, or difficult to obtain |
| 4 | Unusual composition or function |
| 5 | Exceptional and difficult to replace; enables defining equipment |
| 6 | Exceeds conventional materials science or biology |
| 7 | Explicit stellar or cosmic origin/function |
| 8 | Explicit foundational or first-era origin |
| 9 | Explicit physical, temporal, spatial, or reality-breaking property |

---

## 7. World-to-Resource Generation

Avoid a circular model in which world rarity determines materials while material value also determines world rarity.

### Recommended generation order

```text
1. Generate star class and star modifiers
2. Generate base planet type and structural modifiers
3. Generate atmosphere, gravity, temperature, liquids, hazards, and biome profile
4. Generate the world’s resource palette from geology, chemistry, biology, and star influence
5. Generate deposits, grades, depths, and exceptional resource candidates
6. Resolve material-instance rarities
7. Resolve world rarity from the completed world, including resource significance where appropriate
8. Apply world-rarity validation and high-tier semantic requirements
9. Place deposits deterministically
10. Reveal portions of the resolved resource profile through survey and landing gameplay
```

### World rarity influence

World rarity should influence:

- Frequency of high-grade deposits
- Deposit richness and depth
- Probability of exceptional variants
- Availability of cosmic or ancient origins
- Number of meaningful resource families
- Hazard-to-reward profile
- Survey complexity

World rarity should **not**:

- Turn every deposit into the world’s rarity
- Upgrade Common substances automatically
- Create new deposits after the player lands
- Guarantee that every high-tier world is uniformly resource-rich

### Compatibility rules

Semantic caps remain valid:

- Celestial materials require a stellar/cosmic source or process.
- Primordial materials require foundational or first-era provenance.
- Transcendent materials require an explicit rule-breaking property.
- Ordinary worlds may contain a rare exceptional deposit when geology supports it.
- High-tier worlds may still contain abundant Common resources.

---

## 8. Landing, Discovery, and Rare Finds

The original survival-to-discovery loop is excellent and should remain central:

> **Survive difficult landings → access dangerous worlds → locate better resources and life → craft stronger survival and prospecting equipment → reach even harsher destinations.**

However, landing performance must affect **access and discovery efficiency**, not rewrite deterministic world generation.

### Landing challenge effects

A difficult world may require:

- Hazard protection
- Heat or cryogenic shielding
- Pressure resistance
- Radiation protection
- Gravitic stabilization
- Atmospheric filtration
- First-contact preparation
- Specialized landing equipment

### Precision-landing rewards

A clean or high-skill landing may grant:

- Better first field samples
- More survey information
- A temporary prospecting bonus
- A nearby minor cache
- Higher initial sample purity
- Faster identification of hidden deposits
- Reduced damage to extraction equipment
- Better placement near a selected resource signal

It must not:

- Raise the world’s actual rarity
- Change an existing deposit’s resolved rarity
- Reroll flora or fauna rarity
- Generate a Transcendent material on an incompatible world
- Permanently replace world-resource data

### Prospecting gear

Prospecting stats should improve:

- Detection range
- Signal resolution
- Hidden-deposit discovery
- Sample purity
- Extraction efficiency
- Rich-strike yield
- Deep-reserve access
- Identification speed

Avoid a universal “magic-find” stat that rerolls everything in the game. Separate systems should govern:

```text
resource_detection
sample_quality
extraction_yield
biological_discovery
tame_assistance
salvage_quality
```

---

## 9. Star Rewards

Stars should matter mechanically, but a basic survey should not magically place stellar plasma in cargo.

### Recommended star loop

```text
Star Survey
→ identifies stellar resource opportunities
→ unlocks a probe, skimming, station, or expedition target
→ player performs extraction or recovery
→ captured material enters cargo
```

Possible rewards:

- Stellar-composition data
- Blueprints
- Navigation data
- Coronal-harvest coordinates
- Solar-skimming opportunities
- Ruined collector structures
- Star-specific energy signatures
- Limited captured samples from specialized probes

Star rarity and modifiers influence:

- Extraction danger
- Yield
- Stellar-material eligibility
- Material properties
- Planetary-system resource profiles
- Required technology

---

## 10. Biological Ingredients

Harvested ingredients do not automatically copy the source organism’s rarity.

A Mythic creature may provide:

| Harvested Part | Example Rarity |
|---|---|
| Meat | Uncommon |
| Hide | Rare |
| Armor plate | Exotic |
| Regenerative gland | Legendary |
| Reality-reactive core | Mythic |

### Ingredient rarity inputs

- Source-organism rarity
- Anatomical or botanical importance
- Potency
- Harvest yield
- Harvest difficulty
- Regrowth or reproduction rate
- Whether collection destroys the source
- Perishability and stability
- Crafting versatility
- Special elemental, cosmic, ancient, or reality-breaking properties

### Resolver

```text
ingredient_anchor_tier = maximum of:
- source_part_base_tier
- potency_tier
- property_tier
- origin_tier

resolved_ingredient_rarity =
  ingredient_anchor_tier
  + low_yield_bonus
  + destructive_harvest_bonus
  + specialized_use_bonus
  - high_abundance_penalty
  - instability_penalty
```

The source organism influences eligibility and probability; the harvested part determines final rarity.

---

## 11. Refined Materials

Refined materials include:

- Ingots
- Alloys
- Processed fibers
- Chemical compounds
- Biological extracts
- Energy media
- Crystal lenses
- Synthetic organs
- Stabilized anomaly matter

### Resolver

```text
refined_anchor_tier = maximum of:
- recipe_tier
- defining_input_tier
- created_property_tier
- required_process_tier

resolved_refined_rarity =
  refined_anchor_tier
  + coherent_input_synergy
  + exceptional_process_bonus
  - contamination_penalty
  - mass_production_penalty
```

Rules:

1. Many Common inputs do not automatically produce a high-tier output.
2. A rare decorative ingredient does not raise the result unless it defines the output.
3. The process may create a higher-tier property, but the recipe must explicitly support it.
4. Mass-producible materials should receive an abundance penalty unless their function still justifies the tier.
5. Quality and rarity remain separate.

---

## 12. Recipes and Blueprints

Recipe rarity measures the rarity and sophistication of the **knowledge**, not the physical ingredients.

### Inputs

- Knowledge scarcity
- Civilization or faction origin
- Research complexity
- Number of processing stages
- Station requirements
- Required expertise
- Output mechanic
- Reproducibility
- Lost, ancient, forbidden, or cosmic provenance
- Whether the process breaks ordinary manufacturing rules

### Recipe responsibilities

A recipe should define:

```text
minimum_station_tier
supported_output_tiers
normal_output_cap
required_defining_inputs
supporting_input_slots
allowed_property_families
incompatible_property_families
quality_formula
failure_or_defect_rules
```

A recipe generally sets the output’s **normal cap**, not an automatic floor.

Example:

```text
Recipe rarity: Legendary
Normal output range: Exotic to Legendary
Masterwork exception: Mythic, only with an explicit Mythic process and anchor
```

---

## 13. Crafted Components

Components include:

- Weapon cores
- Armor plates
- Shield emitters
- Power cells
- Scopes and sensors
- Engines
- Circuitry
- Catalysts
- Biological implants
- Ship modules
- Landing modules

Component rarity represents functional sophistication.

### Inputs

- Blueprint tier
- Defining material or ingredient
- Mechanical complexity
- Precision requirement
- Energy capacity
- Effect strength
- Effect uniqueness
- Reliability
- Required station
- Compatible systems
- Drawbacks and instability

A component’s rarity is driven by its defining function, not by the count of materials used.

---

## 14. Gear Families

### Combat and defense

- Suits and armor
- Plating and shields
- Weapons and combat tools
- Medical and repair systems
- Resistance charms and relics
- Biological or synthetic implants
- Combat drones
- Ammunition and charge modules

### Exploration and discovery

- Hazard suits
- Gravitic anchors and landing systems
- Scanners and sensors
- Prospecting rigs
- Survey probes
- Extraction tools
- Environmental samplers
- First-contact and diplomacy equipment
- Salvage equipment
- Navigation and anomaly instruments

### Infrastructure and support

- Crafting stations
- Refinery modules
- Base systems
- Ship modules
- Cargo preservation
- Power generation
- Research equipment
- Automated harvesters

The combat and discovery branches should reinforce each other rather than compete as isolated trees.

---

## 15. Finished-Gear Rarity

Do not use:

```text
gear_rarity = rarest_ingredient
```

A rare input only matters when it defines the finished item.

### Gear rarity inputs

- Base frame
- Blueprint and intended output range
- Defining component
- Primary mechanic
- Affix identity
- Trait synergy
- Source significance
- Required process
- Mechanical uniqueness
- Drawbacks, instability, or defects

### Resolver

```text
gear_anchor_tier = maximum of:
- blueprint_supported_tier
- base_frame_tier
- defining_component_tier
- primary_mechanic_tier
- origin_significance_tier

resolved_gear_rarity =
  gear_anchor_tier
  + coherent_build_synergy
  + exceptional_process_bonus
  + special_significance_bonus
  - defect_penalty
  - conflicting_trait_penalty
  - mass_production_penalty
```

Validation:

```text
resolved_gear_rarity <= recipe_normal_cap
resolved_gear_rarity <= station_cap
resolved_gear_rarity <= technology_cap
```

Explicit exceptions may be created for masterwork crafting, authored discoveries, or protected Unique items.

---

## 16. Gear-Tier Identity

Higher rarity should add qualitative mechanics, not merely more affixes or larger percentages.

| Rarity | Gear Expectation |
|---|---|
| Common | Standard function and ordinary statistics |
| Uncommon | Minor improvement or one modest specialization |
| Notable | Clear mechanical identity or useful trait combination |
| Rare | Strong specialization with meaningful build value |
| Exotic | Unusual construction or mechanic |
| Legendary | Build-defining mechanic or exceptional named design |
| Mythic | Beyond conventional technology or biology |
| Celestial | Powered by stellar matter or cosmic energy |
| Primordial | Built from foundational matter or first-era technology |
| Transcendent | Breaks an ordinary game-system or physical rule |

### Qualification safeguards

- Affix count does not determine rarity.
- Five ordinary percentage bonuses do not create a Legendary item.
- High damage alone should normally cap at Legendary.
- Celestial requires explicit stellar or cosmic function.
- Primordial requires explicit foundational or first-era origin.
- Transcendent requires a true rule-breaking mechanic.
- Drawbacks may balance an effect but do not automatically reduce its conceptual tier.

---

## 17. Affix Model

Affixes may use the universal rarity ladder internally.

```text
affix_id
affix_family
minimum_item_rarity
affix_power_tier
affix_mechanic_tier
compatible_item_types
compatible_material_properties
incompatible_affix_ids
weight
roll_range
schema_version
```

Item rarity should derive from the defining mechanic and coherent total identity—not the number of affixes.

Recommended affix roles:

```text
primary_defining_affix
supporting_affix
utility_affix
drawback_affix
cosmetic_affix
```

Only the primary defining affix or equivalent intrinsic mechanic should normally establish the item’s upper rarity identity.

---

## 18. Crafting Requirements by Output Tier

| Output Tier | Recommended Requirement |
|---:|---|
| Common | Common recipe, ordinary inputs, basic station |
| Uncommon | Modestly specialized recipe or one Uncommon defining input |
| Notable | Notable blueprint, process, or defining component |
| Rare | Rare defining material/component and specialized process |
| Exotic | Exotic mechanic, recipe, or defining component |
| Legendary | Legendary anchor plus coherent Rare/Exotic support |
| Mythic | Mythic anchor and specialized high-tier process |
| Celestial | Explicit Celestial material, energy, and capable forge |
| Primordial | Explicit Primordial material, knowledge, or origin |
| Transcendent | Explicit reality-breaking material, process, and mechanic |

A high-tier craft should normally require:

```text
1 defining anchor
+ supporting structural materials
+ functional components
+ optional catalyst
+ appropriate station
+ appropriate recipe knowledge
```

This keeps the full material roster relevant without allowing piles of low-tier resources to convert directly into top-tier gear.

---

## 19. Deterministic Crafting and Controlled Variation

The crafted item’s base identity and rarity should be deterministic from:

- Recipe
- Selected inputs
- Input grades
- Station
- Crafter capability
- Chosen process
- Craft seed
- Schema version

Recommended pattern:

```javascript
const craftSeed =
  hashInt(recipeId, inputSignature, stationId, crafterId, CRAFT_SCHEMA_VERSION);
```

Acceptable controlled variation:

- Affix values
- Quality result
- Minor cosmetic traits
- Non-defining secondary properties
- Defect chance

The same inputs and seed must reproduce the same result across devices.

The base rarity should not be a hidden uncontrolled roll.

---

## 20. Unique Items and Materials

Unique is separate from rarity.

Examples:

- Unique Legendary Weapon
- Unique Mythic Catalyst
- Unique Primordial Blueprint
- Unique Transcendent Ship Core

Unique requires:

```text
is_unique: true
unique_key
unique_scope
unique_display_name
unique_rule
```

A statistically improbable procedural combination is not automatically Unique.

A Unique material should generally originate from:

- One named entity
- One named location
- One protected universe event
- One irreplaceable object
- One authored quest chain

Unique ingredients may be consumed only when the design explicitly supports permanent loss, recovery, replication, or universe-state consequences.

---

## 21. Material Jobs

Every actively supported crafting material should have at least one clear role.

### Structural spine

Examples:

- Iron
- Titanium
- Tungsten
- Silicon
- Chromium

### Function unlockers

Examples:

- Lithium and Cobalt: energy and medical systems
- Neodymium: sensors and magnetics
- Uranium and Thorium: power generation
- Water Ice and other volatiles: cooling and life support
- Helium-3: fusion systems

### Defining rarity anchors

Examples:

- Voidglass
- Promethium
- Prismatium
- Stellar Plasma
- Protomatter
- Chronal Shard

### Elemental or thematic affinity

Examples:

- Sulfur: chemical and combustion systems
- Voidglass: Void systems
- Prismatium: Prism systems
- Coronium: stellar and thermal systems
- Primordial Ice: preservation and genesis systems

### Economy or support roles

Materials not used directly in major gear recipes may still support:

- Trade
- Research
- Repairs
- Ammunition
- Construction
- Fuel
- Consumables
- Faction contracts
- Terraforming
- Codex completion

Avoid materials that exist only as names with no gameplay purpose.

---

## 22. Recommended Category Profiles

Use one top-level rarity framework with category-specific profiles:

```text
raw_material
energy_medium
biological_ingredient
refined_material
crafted_component
recipe
consumable
gear
upgrade_material
station
ship_module
quest_item
```

Each profile returns the same Tier 0–9 rarity output but evaluates different inputs.

### Shared philosophy

> **Materials earn rarity through scarcity, properties, and origin. Ingredients earn rarity through potency and harvest constraints. Recipes earn rarity through knowledge and complexity. Components earn rarity through function and precision. Gear earns rarity through its completed mechanical identity.**

---

## 23. V1.7 Data Schema

### Shared item fields

```text
item_id
item_category
base_definition_id
item_level
quality_grade
rarity_score
rarity_tier
rarity_id
rarity_display_name
rarity_color_hex
affix_ids
upgrade_level
designation_ids
is_unique
unique_key
schema_version
```

### Crafting fields

```text
recipe_id
recipe_rarity_tier
normal_output_min_tier
normal_output_max_tier
required_defining_inputs
supporting_input_slots
optional_catalyst_slots
minimum_station_tier
technology_requirement
quality_formula
rarity_resolver_profile
craft_seed
```

### Resource-deposit fields

```text
deposit_id
substance_id
world_id
biome_id
depth_band
deposit_size
richness
purity_grade
hazard_tier
property_modifier_ids
resolved_rarity_tier
discovery_state
extraction_state
schema_version
```

---

## 24. Final V1.7 Rules

1. All item categories use the universal 10-tier names and colors.
2. Rarity remains separate from level, quality, affixes, upgrades, and Unique status.
3. A world influences resource probability and origin but does not assign every resource’s rarity.
4. Materials and ingredients resolve their own rarity.
5. A finished item does not inherit the rarest ingredient’s tier automatically.
6. Recipes define supported output ranges and normal caps.
7. A defining component or mechanic anchors finished-gear rarity.
8. High tiers require explicit Celestial, Primordial, or Transcendent qualifications.
9. Landing performance affects access, information, sampling, and extraction—not deterministic world contents.
10. Prospecting improves detection and yield rather than universally rerolling rarity.
11. Stars reveal and unlock stellar-resource opportunities; extraction remains a gameplay action.
12. Unique remains a protected one-of-one designation.
13. Every active material must have at least one gameplay role.
14. Crafting outcomes must remain deterministic under the same inputs, seed, and schema version.
15. Internal raw scores may exceed 9, but player-facing rarity remains clamped to Transcendent.

---

## 25. Implementation Recommendation

The original proposal is approximately **80% ready in concept**. Its progression loop, material roster, and gear-family structure are strong.

The revised system should be used for implementation because it:

- Preserves the action-RPG reward loop
- Prevents rarity inflation
- Avoids circular world/resource calculations
- Keeps Common resources useful on high-tier worlds
- Gives ingredients, recipes, components, and gear distinct rarity logic
- Protects deterministic simulation
- Makes Celestial, Primordial, and Transcendent items feel meaningfully different
- Leaves room for masterwork crafting without turning quality into rarity

---

# Part II — Folders 1–4 and 6 Detailed Gold Assessment

**Package reviewed:** `CF-v17-COMPLETE-REVIEW.zip`  
**Review scope:** Creatures, flora, planets, stars/moons/deep-space, live celestial composition, vistas, and biome/landing visuals  
**Package contents:** 52 PNG proof sheets plus `README.txt`  
**Release decision:** **Near-Gold — Hold for one focused correction pass**

---

## 1. Executive Decision

The full proof package is the strongest Celestial Frontier art set to date, but **Folders 1–4 and 6 should not yet be called Gold as a complete visual package**.

The procedural-creature renderer has crossed the most important threshold:

- bodies generally read as unified organisms;
- adjacent masses are blended;
- aquatic conversion is cohesive;
- skins and finishes are distinct;
- the generator no longer broadly resembles exposed circles assembled side-by-side.

However, the total package still contains visible procedural construction artifacts and a few clear presentation defects.

### Gold blockers

1. Flora canopy circles and lobes remain visible in icons and vistas.
2. Earth flora still reuse too many generic silhouettes.
3. `liveview.png` has incorrect ring/planet layering and a horizontal seam.
4. `deepspace.png` has overlapping Black Hole and Wormhole headings.

### High-priority non-blocking issues

5. Selected Earth-fauna families remain too generic.
6. Some procedural traits still appear spiky, rigid, or mechanically attached.
7. Distant moons lose surface detail and some crater shapes resemble blotches or embossed circles.
8. Open-sea and some vista compositions need more seed-to-seed variation.
9. Wormhole depth and molecular-cloud visibility need improvement.
10. Planet coast halos and cloud fields remain too uniform in places.

---

## 2. Package Integrity

The complete-package audit found:

- all 52 PNG files decoded successfully;
- no corrupt proof sheets;
- no complete-sheet duplicates;
- no obvious missing-image placeholders;
- all expected directories and the README present.

This means the hold is based on visual readiness, not missing or broken files.

---

# 3. Folder 1 — Earth Creatures

## Status: **Near-Gold**

The Earth-fauna system is stable and visually cohesive. It does not need a broad redesign.

### Strong results

- Elephant silhouettes, trunks, and tusks are readable.
- Gorilla and orangutan are more distinct.
- Walrus tusks are visible.
- Tiger, okapi, skunk, raccoon, badger, panda, and spectacled-bear markings are stronger.
- Pangolins, crocodilians, snakes, giraffes, rays, sharks, nautilus, jellyfish, and many invertebrates have strong signature silhouettes.
- The full catalog retains one coherent art language.

### Remaining identity pass

The weakest approximately 10–15% should receive a selective pass.

#### Frogs

Tree Frog, Poison Dart Frog, Bullfrog, and Glass Frog remain too close.

Required distinctions:

- Poison Dart Frog: strong warning-color patches.
- Glass Frog: transparency or visible internal anatomy.
- Tree Frog: toe pads and climbing posture.
- Bullfrog: heavier body and broader head.

#### Birds

Too many birds share the same upright base.

Add or strengthen sub-rigs:

- raptor;
- parrot;
- waterfowl;
- wader;
- perching bird;
- seabird;
- flightless bird;
- hummingbird.

Specific priorities:

- Eagle and hawk: stronger hooked bill, chest, and talons.
- Puffin: oversized multicolor bill.
- Auk, Puffin, Guillemot, and Penguin: stronger separation.
- Macaw and Parrot: distinct tail and bill structures.
- Swan: long curved neck.

#### Hoofed mammals

Add mandatory silhouette anchors:

- Kudu: large spiral horns.
- Impala: lyre-shaped horns.
- Gerenuk: elongated neck and browsing posture.
- Pronghorn: pronged horns and face pattern.
- Warthog: low head, mane, and tusks.
- Wild Boar: longer snout and heavy shoulder.
- Peccary: compact body.

#### Small mammals

- Pika should not resemble a small ungulate.
- Meerkat needs an upright alert posture.
- Sloth needs hanging anatomy or longer forelimbs.
- Red Panda needs the face mask, ringed tail, and correct proportions.

#### Turtles and tortoises

Some feet still resemble wheels.

Fix by using:

- splayed legs;
- feet rooted under the shell edge;
- noncircular foot silhouettes.

### Gold conclusion

Earth creatures can ship after a selective identity pass. No full rerendering architecture change is required.

---

# 4. Folder 2 — Earth Flora

## Status: **Not Gold**

This remains the largest unresolved visual area.

### What is working

Several plants now have strong identity organs:

- Rafflesia;
- coffee;
- cacao;
- durian;
- jackfruit;
- mango;
- guava;
- avocado;
- papaya;
- coconut;
- date palm;
- baobab;
- acacia;
- aloe;
- agave;
- pineapple;
- several grasses, ferns, and crops.

### Main problem: repeated templates

Many entries still share:

- a straight central stem with alternating leaves;
- a generic vine with dots;
- a round circle-cluster shrub;
- a generic fruit tree;
- a repeated crop stalk;
- the same kelp blade;
- the same root-crop top.

Several plants are identifiable only by label or fruit color.

### Blending failure

Earth flora still exposes construction primitives:

- canopy circles;
- overlapping oval clusters;
- round shrub lobes;
- visibly repeated crown modules.

These artifacts carry into jungle, savanna, and other vistas.

### Required systemic fix

Every named plant must receive at least one readable identity organ:

- fruit;
- flower;
- pod;
- seed head;
- leaf shape;
- crown shape;
- bark/trunk;
- root/rhizome;
- thorn;
- growth habit;
- aquatic structure.

### Canopy rendering fix

Continue using circles internally, but do not render them directly.

Recommended pipeline:

```text
control lobes
→ monochrome offscreen mask
→ overlap union
→ blur or expand
→ threshold to continuous silhouette
→ low-frequency seeded edge distortion
→ unified gradient fill
→ internal shadow pockets and branch gaps
→ species crown rule
```

Acceptance criterion:

> At 100% and 200% display scale, the original circles used to construct a canopy must not be individually visible.

### Gold conclusion

Folder 2 blocks Gold until the canopy-union pass and identity-organ coverage are completed.

---

# 5. Folder 3 — Procedural Creatures and Flora

## Procedural creatures status: **Gold-ready with limited polish**

The procedural-creature soft-mass goal is achieved.

### Blending result

- Adjacent body masses share a unified outer contour.
- Shading flows through the torso.
- Segmentation reads as intentional anatomy rather than disconnected beads.
- Aquatic creatures preserve shell, horn, tusk, crystalline, and benthic identities.
- Scaled, furred, chitinous, slick, plated, warty, feathered, translucent, and crystalline skins are distinguishable.
- Body-plan variety is healthy.
- Land, aquatic, and aerial creatures share one visual language.

### About the “spikiness”

There are two different cases.

#### Intentional spines

Spikes are appropriate when driven by:

- crystalline skin;
- plated armor;
- dorsal defense;
- horns;
- frills;
- quills;
- an explicit procedural trait.

These should remain.

#### Procedural-looking spikiness

The problem occurs when spikes appear as a repeated edge treatment rather than anatomy.

Examples:

- fur reading as uniform bristles;
- feathering reading as triangular fringe;
- wings resembling rigid shell flaps;
- horns and frills appearing pasted onto the silhouette;
- translucent interiors resembling rectangular machinery;
- additive rim-light shards or isolated bright triangles.

Recommended correction:

- vary spacing and length;
- group spikes into anatomically logical regions;
- blend roots into the body;
- curve feather and wing surfaces;
- reserve sharp triangles for genuine hard materials;
- soften fur with irregular mass rather than uniform points;
- use organic channels and organ shapes inside translucent bodies.

These are polish issues, not a broad creature-blending failure.

### Minimum feature size

Gameplay-significant details need a minimum pixel footprint:

- eyes;
- horns;
- fangs;
- mandibles;
- frills;
- tail structures;
- extra limb pairs.

Traits that disappear at inventory or Compendium size are functionally absent.

---

## Procedural flora status: **Not Gold**

The procedural-flora family system is strong, but the canopy blending remains unfinished.

### Strong

- broad growth-family variety;
- aquatic and aerial forms;
- recognizable family taxonomy;
- controlled color and luminescence;
- good basis for biome integration.

### Remaining

- circle-based tree and shrub crowns;
- multiple rows differentiated mostly through color;
- carnivorous traps too thin at gameplay scale;
- some luminescent forms too faint in daylight;
- repeated internal canopy construction.

### Gold conclusion

Procedural creatures are approved. Procedural flora blocks Gold alongside Earth flora.

---

# 6. Folder 4 — Planets, Stars, Moons, Rings, and Deep Space

## Overall status: **Near-Gold, with two blocking files**

---

## 6.1 Planets — Near-Gold

### Strong

- large Earth-like render is impressive;
- atmospheric limb haze creates depth;
- polar transitions are smoothly blended;
- coastlines are less mechanical;
- ocean, Venus-like, cold, rocky, and gas families are distinct;
- gas vortices improve seeded identity.

### Remaining issues

- a yellow-green coastline halo can form a nearly continuous rim;
- clouds are too soft and evenly distributed;
- cold-band worlds can become washed out;
- terrestrial worlds can share too much Earth-like green/blue/tan structure;
- gas planets need stronger bands, storm depth, and cloud-height separation.

### Required polish

- break coast rims into beaches, wetlands, cliffs, shelves, ice edges, and volcanic shores;
- add cloud fronts, broken fields, shadows, and storms;
- let chemistry affect oceans, minerals, haze, clouds, and polar material;
- vary surface, low-cloud, high-cloud, and storm rotation independently.

Planets do not need a redraw.

---

## 6.2 Stars — Near-Gold

### Strong

- class colors read correctly;
- surface granulation is attractive;
- selected flares and prominences are visible;
- stars no longer look like flat circles.

### Remaining

- physical scale differences are not adequately communicated;
- surface textures still resemble one noise family recolored;
- some prominences look like detached glowing circles;
- the white dwarf should look smaller, harder, and denser.

### Required polish

Use class-specific behavior:

- G: mixed granulation and active regions;
- B: smoother high-energy surface;
- M: mottled active zones and compact flares;
- giant: slow large convection cells;
- supergiant: irregular cells and mass loss;
- white dwarf: compact intense center and tight halo.

---

## 6.3 Moons — Near-Gold

Your concern about blotches is valid.

### Strongest families

- rocky;
- captured.

### Icy moon concerns

Large smooth arcs can look drawn on rather than geological.

Add:

- branching fractures;
- interrupted ridges;
- varied line width;
- shallow terrain;
- local displacement around cracks.

### Volcanic moon concerns

The yellow body and evenly bright orange fissures can look toy-like or blotchy.

Add:

- dark basalt fields;
- irregular calderas;
- cooled lava;
- ash zones;
- fewer uniformly luminous cracks;
- localized hot spots.

### Crater concerns

Some craters read as:

- embossed circular stamps;
- flat dark blotches;
- overlapping decals.

Correct through:

- directional light;
- shadowed inner walls;
- asymmetric ejecta;
- broken rims;
- reduced uniform outline;
- scale hierarchy;
- fewer same-sized circles.

### Distant moons

Small moons lose fracture and crater definition during downsampling.

Use dedicated small-size masters rather than repeatedly shrinking the large canvas.

Acceptance criterion:

> At gameplay size, each moon family must retain one readable material feature: crater, fracture, caldera, ridge, or capture scar.

---

## 6.4 Rings and live view — Not Gold

`liveview.png` contains a flat horizontal transition through the ringed planet.

It reads as a clipping seam rather than physical occlusion.

Required rendering order:

```text
rear rings
→ planet
→ front rings
→ ring shadow on planet
→ planet shadow on rear rings
→ atmospheric fade at front-ring limb crossing
```

Acceptance criterion:

- rear rings disappear behind the planet;
- front rings pass in front;
- no horizontal seam;
- shadows establish depth;
- different inclinations remain valid.

This is a Gold blocker.

---

## 6.5 Deep space — Not Gold as a proof file

### Blocking layout defect

The Black Hole and Wormhole headings overlap in `deepspace.png`.

This must be fixed before Gold even though it is a proof-layout defect rather than an asset defect.

### Black hole

Strongest deep-space asset.

Optional polish:

- stronger Doppler asymmetry;
- thinner photon ring;
- softer event-horizon boundary;
- clearer lensed far-side arcs.

### Wormhole

Needs:

- sharper throat;
- stronger depth;
- warped background stars;
- fewer bead-like lights;
- continuous lensing distortion.

### Quasar

Direction is strong.

Improve:

- jet length;
- jet scale at normal view;
- host haze;
- alignment through the core.

### Molecular dark cloud

Too faint at gameplay scale.

Improve with:

- stronger star occlusion;
- clearer silhouette;
- subtle rim illumination;
- embedded protostar hints.

---

# 7. Folder 6 — Vistas, Biomes, and Landing Scenes

## Overall status: **Mixed — not Gold as a folder**

| File | Status |
|---|---|
| `coherence.png` | Near-Gold |
| `earthlandings.png` | Near-Gold |
| `floravista.png` | Not Gold |
| `gasdeck.png` | Gold-ready |

---

## 7.1 Coherence vistas — Near-Gold

### Strong

- creatures generally inherit environmental palettes;
- land, sky, organisms, and atmosphere belong to one art system;
- major compositions have good depth;
- creatures are less pasted-on than in earlier versions.

### Remaining

- canopy circles remain visible;
- repeated tree structures reveal procedural construction;
- some creatures need stronger grounding shadows;
- distant organisms can merge into the environment;
- scene families reuse similar composition logic.

Rerender canopy-heavy coherence scenes after the flora soft-mass fix.

---

## 7.2 Earth landings — Near-Gold

### Strong

- biome identity is improved;
- major landing categories are readable;
- population and terrain generally align.

### Remaining

- open-sea seeds produce too-similar compositions;
- some scenes need stronger foreground/midground/background variation;
- creature contact and shadow need consistent review;
- flora construction issues carry into scene silhouettes.

### Required open-sea variation

Vary:

- horizon height;
- wave pattern;
- island or no-island presence;
- cloud coverage;
- fauna depth;
- floating flora;
- reef or open-water cues;
- lighting direction;
- weather.

---

## 7.3 Flora vista — Not Gold

`floravista.png` is the clearest vista-level expression of the unfinished flora renderer.

Problems:

- visible circle canopies;
- repeated crown modules;
- generic plant identities;
- shrubs and trees that look assembled;
- insufficient blending between plant layers.

This file should be rerendered only after the canopy renderer is corrected.

---

## 7.4 Gas-deck vistas — Gold-ready

The gas-deck scenes are cohesive and visually specific.

Strong:

- aerial organisms belong to the environment;
- depth and atmospheric layering work;
- life does not appear placed on terrestrial ground;
- the scene family has a distinct identity.

No blocking art correction is required.

---

# 8. Is the Artwork Blended Together?

## Creatures

**Yes, broadly.**

Procedural creature bodies are now blended well enough for Gold. Remaining spikes and hard appendages are local polish issues.

## Flora

**No, not completely.**

The original canopy primitives remain visible in multiple files. This is the largest unresolved blending issue.

## Planets

**Mostly.**

Surface, atmosphere, coast, and clouds generally blend, but continuous coast halos and uniform cloud fields reveal procedural layering.

## Moons

**Partially.**

Families are recognizable, but some craters, fractures, and lava fields resemble stamps, blotches, or overlays.

## Vistas

**Mostly, except flora-heavy scenes.**

Creatures and environments are much more integrated, but canopy construction and some repeated composition patterns remain visible.

## Live celestial view

**No, not fully.**

The ring seam is a clear compositing defect.

---

# 9. Final Correction Order

## Gold blockers

1. Complete the flora-canopy union and soft-mass renderer.
2. Add identity organs to repeated Earth flora.
3. Fix ring front/back occlusion and shadows in `liveview.png`.
4. Fix overlapping headings in `deepspace.png`.

## High priority

5. Selective Earth-fauna identity pass.
6. Correct procedural edge spikiness where it is not trait-driven.
7. Improve moon crater depth, icy fractures, volcanic geology, and small-size masters.
8. Increase wormhole depth and molecular-cloud visibility.
9. Add open-sea landing composition variation.
10. Rerender `floravista.png` and canopy-heavy vistas.

## Polish

11. Break up coastline halos and uniform cloud fields.
12. Strengthen class-specific star surfaces and scale.
13. Improve four-wing versus two-wing silhouettes.
14. Make translucent anatomy more organic.
15. Verify long labels and headings at final review resolution.

---

# 10. Gold Retest Checklist

The package can be called Gold when:

- [ ] No visible canopy-construction circles remain.
- [ ] Earth plants show a readable identity organ or growth habit.
- [ ] Procedural spines are anatomically justified and blended at their roots.
- [ ] Fur and feathers do not read as uniform triangular fringe.
- [ ] Distant moons retain crater, fracture, or caldera detail.
- [ ] Moon craters do not resemble stamped circles or flat blotches.
- [ ] Ringed planets have correct rear/front occlusion and shadows.
- [ ] No proof headings overlap.
- [ ] Frog, bird, turtle, ungulate, and small-mammal priorities are differentiated.
- [ ] Open-sea seeds produce visibly different compositions.
- [ ] Wormhole throat and molecular cloud remain readable at gameplay size.
- [ ] `floravista.png` is rerendered after the flora fix.
- [ ] All proof sheets pass at 100%, 200%, and actual gameplay size.
- [ ] No clipped labels, missing cells, or broken renders remain.

---

# 11. Final Recommendation

Do **not** reopen the overall art direction.

The following can be treated as approved:

- procedural creature architecture;
- creature soft-mass blending;
- creature materials and finishes;
- aquatic conversion;
- procedural body plans;
- large-planet direction;
- black-hole and quasar direction;
- gas-deck vistas.

The package should remain **Release Candidate / Near-Gold**, not Gold, until the focused blockers are corrected.

After those corrections, one final full regression proof should be sufficient. Another broad redesign is not necessary.
