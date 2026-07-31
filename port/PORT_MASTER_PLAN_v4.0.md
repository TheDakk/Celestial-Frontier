# Celestial Frontier — v2 Port Master Plan

## Full Engine, Universe, Creature, Audio, Mobile, Save, Testing, and Future-Unreal Migration Specification

**Document version:** 4.0  
**Review date:** July 30, 2026 (America/New_York)  
**Repository handoff date:** July 31, 2026 UTC  
**Latest runtime reviewed:** Celestial Frontier v1.8.9, “One Measure”  
**Code package reviewed:** `Celestial-Frontier-main(12).zip`  
**Supersedes:** Full Engine, Universe, Creature, Audio, and Code Port Plan v3.1  
**Primary stack:** TypeScript + PixiJS 8 + Spine 2D or equivalent + HTML/CSS component UI + Vite + IndexedDB + Zod/JSON Schema + Web Audio API + Vitest + Playwright  
**Rendering baseline:** WebGL/WebGL2 production path, optional WebGPU enhancement path  
**Primary target:** Desktop, tablet, and mobile browsers, with optional PWA installation  
**Future option:** Engine-independent content and rules retained for a later Unreal native/3D edition

---

# 1. Executive Decision

Celestial Frontier should proceed with the full browser-native engine upgrade previously approved, but the migration plan must now be based on the current **v1.8.9** game rather than the older v1.6.4 code audited by the prior report.

The final direction remains:

> **Rebuild Celestial Frontier as a modular TypeScript game; preserve the deterministic universe, creature identity, gameplay rules, current save behavior, and validated UX; use PixiJS for the living 2D/2.5D universe; use a skeletal/mesh animation pipeline for creatures and flora; retain HTML/CSS for dense accessible interfaces; replace synchronous localStorage persistence with a versioned IndexedDB repository; and expand the current procedural audio identity into a complete adaptive sound and music system.**

This is not a cosmetic renderer swap. It is a controlled migration of a complete game that now includes:

- Infinite deterministic universe navigation
- Galaxies, star systems, planets, moons, rings, comets, belts, anomalies, and planetary descent
- Forty-three live biome profiles
- The complete Earth catalog and procedural biospheres
- Creature genetics, breeding, lineage, feeding, experience, taming, combat, conquest, and sharing
- The universal materials, gear, crafting, mining, ship, and economy systems
- Charters, the Ascent chapter structure, objective tracking, achievements, and Prime Codex endings
- A 21-step sandboxed training flow
- Mobile, tablet, keyboard, focus, reduced-motion, touch-target, safe-area, and accessibility behavior
- Procedural creature voices, combat sound, planetfall sound, biome ambience, and feedback tones
- Hardened saves, a last-known-good backup, share-code compatibility, and play-time-based regeneration
- Extensive deterministic, layout, gameplay-outcome, exploit, performance, and synthetic testing infrastructure

The browser release should become a premium animated 2.5D product in its own right. A future Unreal version should be treated as a later native/3D presentation layer over portable content, specifications, and rules—not as the reason to postpone this port.

---

# 2. Locked Product and Technology Direction

## 2.1 Visual target

The target is not merely to animate the existing proof images. The proofs are the concept and art-direction base for a larger production upgrade:

- Improved anatomy and silhouettes
- More expressive faces and personalities
- Animation-ready layered art
- Reusable rig families and mesh deformation
- Dynamic material response
- Living biome integration
- Better galaxies, stars, planets, moons, rings, weather, descent, ships, materials, and UI presentation
- Pokémon-level readability, attachment, and recognizable behavior without copying Pokémon designs
- Celestial Frontier's own alien, ecological, mature, painterly identity

## 2.2 Platform target

One responsive browser codebase should support:

| Profile | Target behavior |
|---|---|
| Desktop | Full-density interface, keyboard/mouse, high visual and audio settings |
| Tablet | Touch-first sheets, larger vistas, medium density, adaptive effects |
| Phone | Bottom dock, full-screen panels, large controls, aggressive memory and battery safeguards |
| Optional PWA | Home-screen/desktop installation, offline shell, full-screen window, controlled updates |

Users should still be able to visit a URL and play without installing a launcher or plugin.

## 2.3 Stack lock

```text
TypeScript
├── PixiJS 8 — universe, planets, biomes, creatures, effects, cameras
├── Spine 2D or equivalent — skeletal rigs, meshes, animation mixing
├── HTML/CSS component UI — Codex, Atlas, Shipyard, Charters, settings
├── Vite — modules, build, code splitting, development server
├── IndexedDB — saves, migration snapshots, caches, multiple slots
├── Zod / JSON Schema — runtime data and save validation
├── Web Workers — generation, validation, optional portrait preparation
├── Web Audio API — procedural identity, adaptive music, ambience, SFX
├── Vitest — domain and migration tests
└── Playwright — real-browser UI, mobile, performance, audio-lifecycle tests
```

React or Lit may be used for component UI, but neither should own the simulation. The core game must remain framework-independent TypeScript.

## 2.4 Rendering rule

Use WebGL/WebGL2 as the reliable production baseline. WebGPU may enable optional enhanced shaders, compute-assisted effects, or future experiments, but the game must not require it for normal play.

## 2.5 Future Unreal rule

Design the TypeScript version so the following are engine-independent:

- Content catalogs and stable IDs
- Generator specifications and RNG rules
- Creature genomes and phenotype manifests
- Rarity, combat, breeding, economy, ecology, and progression rules
- Save schemas and migration records
- Animation-state and behavior metadata
- Audio-profile metadata
- Original source art, rigs, textures, models, and audio masters
- Golden seeds and expected outputs

Pixi rendering, DOM UI, IndexedDB, browser input, and browser audio playback will still need a later Unreal rewrite. The universe and its rules should not.

---

# 3. Latest Code Audit — v1.8.9

## 3.1 Current source measurements

| Measurement | v1.6.4 reviewed previously | v1.8.9 reviewed now | Change |
|---|---:|---:|---:|
| Main HTML size | 1,717,010 bytes | 1,963,584 bytes | +246,574 bytes |
| Main HTML lines | 23,882 | 27,030 | +3,148 |
| Extracted JavaScript size | 1,460,954 bytes | 1,678,296 bytes | +217,342 bytes |
| Extracted JavaScript lines | 21,808 | 24,569 | +2,761 |
| Named function declarations | 552 | 607 | +55 |
| Arrow-function assignments | 136 | 151 | +15 |
| Static DOM IDs | 153 | 157 | +4 |
| `getElementById` calls | 236 | 255 | +19 |
| Deterministic domain modules | 14 | 14 | unchanged |
| App/service modules | 6 | 6 | unchanged |
| App sections | 45 | 45 | unchanged |

A direct old-to-new source diff reports approximately **3,582 inserted lines and 434 deleted lines** in `celestial-frontier.html`.

The physical deployment is still one large HTML file, but the internal architecture remains explicitly marked and conceptually modular.

## 3.2 Current code distribution

| Layer / hotspot | Approximate current lines | Port treatment |
|---|---:|---|
| Fourteen deterministic domain modules | 2,982 | Highest-value direct TypeScript conversion target |
| `hdart` procedural art/vista section | 5,221 | Rebuild around assets, rigs, scene graphs, and shaders |
| Main `Renderer` module | 1,884 | Replace with Pixi scenes, cameras, containers, culling, LOD |
| Materials registry | 1,433 | Split authoritative content data from UI/icon rendering |
| Fabricator | 1,318 | Extract recipes/economy logic; rebuild component UI |
| Descent/planetfall | 1,006 | Preserve rules; rebuild cinematic/render/audio orchestration |
| Compendium | 896 | Preserve data behavior; rebuild virtualized accessible UI |
| CombatCore domain | 814 | Convert with parity and outcome tests |
| Ascent/chapter engine | 784 | Extract state machine and content manifests |
| SaveSystem | 553 | Keep sanitization/migration meaning; replace storage backend |
| Charters | 504 | Extract weekly/mainline rules and UI separately |
| Conquest | 496 | Preserve outcome/economy; replace DOM and audio hooks |
| Current audio section | 290 | Port deterministic voice profiles; rebuild service and mixer |
| `Fx` module | 224 | Replace DOM particles and embedded synthesis orchestration |

The visual hotspot is now more than **8,000 lines** when the renderer, HD art, thumbnail art, galaxy art, species art, effects, and cinematics are considered together. That remains the largest rewrite area.

## 3.3 What changed since the previous audit

The prior report reviewed v1.6.4. The new code includes two major completed arcs.

### v1.7 — The Forge

- One canonical ten-name display rarity ladder across life, worlds, stars, materials, and gear
- Forty-seven-material economy and exceptional units
- Full crafting, gear, affix, equip, salvage, and cosmic-resource systems
- New bridge/dock layout for desktop, tablet, and phone
- Save Guardian last-known-good backup
- Twenty-one-step training completion flow
- Star Chart, visited worlds, worlds of renown, better Atlas behavior
- Objectives, Charters, chapter presentation, and stronger progression communication
- Painterly gear masters and improved ship presentation
- Significant mobile, accessibility, memory, cold-boot, layout, and input work
- Release deployment gates and expanded audit tooling

### v1.8 — The Connection through One Measure

- Deterministic creature voices with Earth taxonomy, genome variation, and inherited hybrid blending
- Combat impacts, critical/ability sounds, planetfall chords, biome ambience, and explicit audio toggles
- Quest-log expansion and context-sensitive next-action guidance
- Real fight-simulation conquest odds
- Creature experience from care, breeding, survival, and other non-victory events
- Breeding power/rarity preview bands
- More honest blocked-action feedback and navigation
- Outcome-based duel reward tests
- Real-browser cold-boot answerability instrumentation
- DOM-driven synthetic actions that confirm real controls are wired
- Save round-trip guards for bred-genome size
- Play-time-based harvest regeneration using `COSMIC_EPOCH`, eliminating the wall-clock exploit
- One shared `_szOf` interpretation for size across card, combat, habitat, rarity, and classification
- Multiple rounds of mobile training-layer and dock-reachability fixes

These additions are not optional extras. They are now part of the parity contract.

## 3.4 Current architecture units

### Deterministic domain modules

```text
Rand
PlanetGen
Naming
WorldConfig
StarCatalog
WorldGen
SurveyPhrases
SpeciesTraits
Genome
EncUtil
Genetics
Ecology
Descriptors
CombatCore
```

### Current app/service modules

```text
ThumbArt
GalaxyArt
SpeciesArt
Renderer
SaveSystem
Fx
```

### Major app sections

The app sections cover UI/DOM, camera state, input, transitions, HD art, panels, biomes, descent, Atlas, Compendium, navigation, new game, notifications, audio, progression, sharing, search, beacon, duel UI, economy, cinematics, husbandry, pickers, player state, Guide, tooltips, release notes, conquest, mining, materials, fabricator, Prime Codex, naming, tutorial, Charters, Ascent, settings, events, panel management, stats, and bootstrap.

## 3.5 Current content scale

| System | Current confirmed scale |
|---|---:|
| Earth fauna | 631 entries |
| Earth flora | 334 entries |
| Earth fungi | 27 entries |
| Earth microbes | 22 entries |
| Total Earth catalog | 1,014 entries |
| Current Earth-fauna classifier outputs | 18 categories including legacy |
| Curated rig sentinels | 193 |
| Live biome profiles | 43 |
| Life-bearing biomes | 37 |
| Fauna-free whitelisted biomes | 2 |
| Gas/aerial native-life biomes | 4 |
| Materials | 47 |
| Display rarity names | 10 |
| Internal raw grade bands | 15 |

## 3.6 Critical rarity clarification

The latest code has **two related rarity layers**, and the port must preserve both intentionally.

### Canonical display ladder — 10 names

```text
Common → Uncommon → Notable → Rare → Exotic
→ Legendary → Mythic → Celestial → Primordial → Transcendent
```

`RARITY_V17` and `displayRarity()` provide the universal player-facing presentation.

### Internal raw grade ladder — 15 bands

`GRADE_TIERS` and `rarityRoll()` retain raw tiers 0–14 for deterministic probability, old deep-spectrum distinctions, merit boosts, Paragons, Apex Guardians, and existing combat/capture/save behavior. Several raw bands collapse into the same player-facing name.

**Port requirement:** do not accidentally replace the internal 15-band roll with a ten-band roll, and do not expose the old fifteen names in player-facing UI. The new TypeScript types should distinguish `RawGradeTier` from `DisplayRarityTier`.

## 3.7 Current save contract

The live save system uses:

- Key: `cfcc_save_v2`
- Current stored schema field: `v: 4`
- Last-known-good backup: `cfcc_save_v2_bak`
- Legacy v1 key read once for the farewell flow, then removed
- Debounced saves plus hidden-tab and unload writes
- Sanitized and clamped external data
- Regenerable thumbnails stripped from saves
- Bounded catalog/log/notification and other collections
- Current v1.8 additions: `vce`, `cbx`, `xpf`, and `conq[].e`
- Persisted `COSMIC_EPOCH` for play-time systems

Two migration rules are especially important:

1. **Do not clamp the stored genome `size` gene.** v1.8.6 did so and corrupted honest bred lineages. Consumers use `_szOf`; the gene itself must round-trip unchanged.
2. **`conq[].e` absent means ready once.** This is the deliberate migration behavior for pre-v1.8.8 conquered worlds.

The IndexedDB port must import the user's current v2/v4 localStorage save before creating any new save state. A failed import must leave the original localStorage keys untouched and offer retry/export diagnostics.

## 3.8 Verification performed in this review

The following were independently run against the uploaded v1.8.9 source:

- JavaScript syntax: pass
- CSS brace balance: pass
- Duplicate static IDs: pass, 157 IDs
- Domain-module `Math.random()` / `Date.now()` exclusion: pass
- Earth class-to-rig audit: pass, all 631 fauna and 193 sentinels
- Biome-profile coverage: pass, all 43 live biomes
- Biome-layer audit: pass
- Color-atlas validity and determinism: pass
- Rarity simulation: pass across 60,000,000 seed/salt checks with zero downgrades
- Dead-code candidate scan: completed; three tooling-referenced candidates reported

The package's jsdom-dependent suites could not be rerun in this sandbox because the required `jsdom` package could not be installed from the available package registry. This affects independent execution of `validate`, `smoke`, `systems-check`, `render-audit`, `balance-sim`, `duelxp-check`, `sizedrift-check`, and `harvestclock-check` here.

The repository itself records the v1.8.9 ship gates as:

```text
validate 9/9
fingerprint 50/50 match
smoke 553/0
uilayout 787 checks across 10 viewports
balance pass
simrun DOM: 0 findings
duel XP: 6/0
size drift: 8/8
harvest clock: 5/5
```

Those stored results are valuable evidence, but the port CI must reproduce them from executable dependencies rather than merely copy the summaries.

---

# 4. Porting Principles That Must Not Change

## 4.1 Parity before redesign

The migration must first prove that the TypeScript core reproduces v1.8.9. Visual upgrades may proceed in parallel behind feature flags, but gameplay, saves, codes, and generated identity should not be changed accidentally while moving files.

## 4.2 No silent fingerprint repins

The current 50-probe baseline still ties behavior back to the pre-refactor v1.0 universe, with documented deliberate exceptions. A baseline may be repinned only when:

- The changed behavior is explicitly approved
- The affected outputs are listed
- Existing live saves and Atlas locations are assessed
- A before/after fixture is retained
- The repin is documented as a product change, not a test fix

TypeScript uses JavaScript number semantics, so most domain extraction should remain byte-for-byte compatible without a repin.

## 4.3 One definition per rule

The v1.8 size defect demonstrated the danger of multiple locally correct interpretations. Shared rules such as size normalization, harvest readiness, rarity display mapping, combat stats, and save sanitization must have one exported implementation and multiple consumers.

## 4.4 Assert outcomes, not implementation paths

A unit test that calls an award function does not prove the UI path grants the award. Port gates must include real action → resulting ledger/state assertions.

## 4.5 Negative-control every new gate

Every important new test must be run against a known broken build or deliberately injected defect and must fail there. A green gate that cannot discriminate the broken state is not a gate.

## 4.6 Painted is not answerable

Cold-boot and transition performance must measure when the interface responds, not only when pixels appear. The v1.8.5 first-run issue proved this distinction.

## 4.7 Preserve validated accessibility and mobile behavior

Accessibility, touch floors, safe areas, keyboard navigation, focus management, reduced motion, panel stacking, and training reachability are part of parity—not late polish.

## 4.8 Do not recreate the monolith

A TypeScript file named `game.ts` containing the same 24,000 lines is not a port success. Module ownership, dependency direction, typed boundaries, and testability are release criteria.

---

# 5. Current Strengths to Preserve

- Deterministic cell-based universe generation
- Stable share-code identity
- Conceptually separated domain modules
- Extensive Earth and procedural content
- Strong catalogs for biomes, materials, gear, abilities, recipes, Charters, and chapters
- Existing responsive UI decisions validated through many rounds
- Hardened save handling and recovery behavior
- Current play-time epoch model
- Current procedural creature-audio identity
- Proof-sheet and visual-review workflow
- Test culture that includes synthetic players, layout, performance, exploits, and negative controls
- Original Canvas art code as a phenotype, composition, and art-direction specification

---

# 6. Current Limits the Port Must Solve

## 6.1 Payload and compilation

The 1.96 MB inline document requires the browser to parse and compile a 1.68 MB script before useful interaction. The existing cold-boot work reduced hidden art generation, but the remaining first-run cost is now substantially a payload/module problem.

The port needs:

- Real ES modules
- Route/feature code splitting
- Lazy loading of heavy art and content manifests
- A payload budget in CI
- Separate first-interaction and full-ready performance budgets

## 6.2 Immediate-mode Canvas rendering

The current renderer manually draws and composites the universe, portraits, planets, vistas, and effects. It has excellent procedural knowledge but lacks the retained scene graph, GPU batching, texture management, skeletal animation, shaders, and asset lifecycle needed for the desired upgrade.

## 6.3 Synchronous localStorage

The current save is impressively hardened but remains one synchronous JSON string. IndexedDB is required for larger lineages, migration journals, multiple slots, cloud-sync preparation, and asynchronous writes.

## 6.4 UI/state reach-through

Many app sections directly read global state, write HTML, query elements, trigger audio, update saves, and call gameplay functions. The port needs commands, selectors, services, and explicit state ownership.

## 6.5 Current audio architecture

The current procedural voices and ambience are valuable, but the single shared SFX graph is not the complete adaptive music/spatial/mixing system described later in this report.

## 6.6 No installed-app/offline update layer

The current game is offline-capable as a single file, but it is not yet a service-worker-managed PWA with safe update and migration behavior.

## 6.7 Production art is generated directly by runtime code

The runtime art logic should become a combination of:

- Typed phenotype data
- Original source masters
- Rig-ready modular assets
- Shader/material profiles
- Runtime assembly rules
- Fixed-seed review fixtures

The code should no longer be the only place the art exists.

---

# 7. Full-Universe Visual Upgrade

The engine upgrade should improve the entire visual chain from universe scale to microscopic life.

---

## 7.1 Observable universe and deep-space background

### Current state

The current universe view is functionally impressive and deterministic, but it still reads primarily as an efficient plotted Canvas scene.

### Upgrade target

Add:

- Multi-layer starfields with parallax
- Dust and faint interstellar clouds
- Large-scale galactic color variation
- Density-aware star clusters
- Animated but restrained cosmic background movement
- Camera exposure changes during zoom
- Smooth scale transitions without visible mode discontinuities
- Better spatial depth and foreground/background separation
- Low-motion and battery-saving alternatives

### Rendering approach

Use separate scene layers:

```text
Distant cosmic background
→ Faint galaxies and dust
→ Generated local galaxies
→ Navigation markers
→ Selection and survey overlays
→ UI
```

The universe should feel immense without becoming visually noisy.

---

## 7.2 Galaxies

### Upgrade goals

- More believable cores
- Dust lanes
- Spiral-arm breakup
- Irregular and dwarf-galaxy identity
- Stellar nurseries
- Parallax within large galaxies
- Subtle internal motion
- Better silhouettes at distance
- Higher-detail render texture when zoomed
- Class-specific galaxy lighting

### Procedural model

A galaxy manifest should define:

```ts
interface GalaxyVisualProfile {
  morphology: string;
  coreIntensity: number;
  armCount: number;
  armTightness: number;
  dustAmount: number;
  colorTemperature: number;
  starClusterDensity: number;
  anomalyFlags: string[];
  visualSeed: number;
}
```

The existing `GalaxyArt`, galaxy profile, and deterministic generation logic can supply much of this data.

---

## 7.3 Stars

Stars should no longer be only colored luminous discs.

### Required upgrades

- Surface granulation
- Rotating plasma pattern
- Corona
- Class-specific flare behavior
- Prominences
- Pulsation where appropriate
- Sunspots
- Magnetic disturbances
- Light color affecting nearby planets and creatures
- Exposure adaptation as the camera approaches
- Distinct treatment for dwarfs, giants, remnants, neutron stars, magnetars, and black holes

### Stellar-class identity

A red dwarf should not be a smaller orange version of a blue star. Its movement, flare cadence, corona, and lighting should be different.

---

## 7.4 Planetary systems

The system view should become a coherent orbital scene rather than a set of attractive isolated sprites.

### Upgrade goals

- Stable orbital-depth layering
- Better planet-size hierarchy
- Animated orbits at readable speed
- Dynamic star lighting
- Planetary shadows and illuminated crescents
- Moon movement
- Ring orientation and occlusion
- Comet paths
- Asteroid belts with proper density falloff
- Smooth selection and landing approach
- System-level ambient particles and dust

The current four-mode navigation model can remain conceptually, but the transitions should use shared cameras and level-of-detail states rather than separate immediate-mode drawing functions.

---

## 7.5 Planets

Planets are already one of the project's stronger visual areas. The upgrade should move them from static generated portraits to layered living worlds.

### Planet layer model

```text
Planet sphere/base surface
→ Terrain/albedo layer
→ Normal/relief layer
→ Ocean/specular layer
→ Cloud layers
→ Weather/storm layer
→ Atmosphere/scattering layer
→ Night emission layer
→ Aurora/lightning layer
→ Rings and shadows
```

### Required upgrades

- Planet rotation
- Independently moving cloud layers
- Storm movement
- Lightning under clouds
- Night-side city or biosphere lights where justified
- Ocean reflections
- Ice reflection and fracture behavior
- Volcanic glow
- Heat shimmer
- Atmospheric scattering
- Auroras
- Moon transit shadows
- Rings correctly passing behind and in front
- Rings receiving planet shadow
- Planet receiving ring shadow
- Smooth detail changes during zoom

### Planet-type specialization

Each planet family should have a different rendering model:

- Gas giant
- Rocky
- Desert
- Ice
- Terran
- Ocean
- Venus-like
- Lava
- Exotic/anomalous

---

## 7.6 Moons

Moons should have actual geological identity rather than mostly colored spheres with crater marks.

### Upgrade goals

- Height- or normal-driven crater lighting
- Ejecta rays
- Basins
- Ridges
- Fractures
- Icy stress lines
- Volcanic vents
- Metallic seams
- Captured-asteroid irregularity
- Tidal effects where relevant
- Terminator lighting that reveals relief
- Level-of-detail detail emergence during approach

---

## 7.7 Rings

Ring systems should receive a dedicated rendering component.

### Required behavior

- Correct rear/front occlusion
- Band density variation
- Gaps and divisions
- Fine particulate sparkle
- Planet shadow over rings
- Ring shadow over atmosphere
- Color based on ice, rock, dust, or exotic composition
- Moon wakes or disturbances when appropriate
- Camera-angle response

This is one of the most visually rewarding upgrades because ring errors are immediately noticeable and correct ring integration makes a planet feel three-dimensional.

---

## 7.8 Black holes, wormholes, quasars, nebulae, and anomalies

### Black holes

- Accretion-disk movement
- Gravitational-lensing effect
- Background distortion
- Brightness asymmetry
- Matter streams
- Controlled camera/exposure response

### Wormholes

- Animated throat
- Rim distortion
- Parallax into destination color or space
- Particle stretching
- Stability variation
- Travel transition integrated into the effect

### Quasars

- Energetic core
- Long directional jets
- Animated accretion
- Exposure bloom with accessibility-safe alternatives
- Large-scale environmental effect

### Nebulae

- Layered transparent volumes or sprites
- Local color gradients
- Star formation pockets
- Depth parallax
- Reduced-opacity navigation mode to preserve readability

---

## 7.9 Descent and landing

Planetfall should become one of the game's signature sequences.

### Suggested sequence

1. System camera closes on the selected planet.
2. Atmosphere and cloud layers expand.
3. Surface details resolve.
4. Weather becomes visible.
5. The target biome appears below.
6. Landing craft or camera enters the vista.
7. Ambient audio transitions from space to environment.
8. Flora and fauna motion appears.
9. Survey controls become available.

### Variants

- Clear descent
- Cloud entry
- Storm entry
- Dust atmosphere
- Ice particles
- Gas-deck entry
- Volcanic ash
- Ocean approach
- Night landing

The existing descent ladder and landing-assist logic provide a strong gameplay blueprint but should be reimplemented as a state-driven cinematic system.

---

# 8. Biome and Vista Upgrade

The current vista proofs have coherent palettes and multiple environment types, but they generally rely on layered static silhouettes, repeated cloud forms, and limited environmental motion.

The new biome system should feel inhabited.

## 8.1 Layered biome scene graph

Each biome scene should be assembled from:

```text
Sky and celestial bodies
→ Distant terrain
→ Atmospheric depth
→ Midground terrain
→ Water or ground surface
→ Flora layers
→ Creature layers
→ Foreground occluders
→ Weather and particles
→ Lighting and post effects
```

## 8.2 Dynamic environment systems

- Wind
- Fog
- Rain
- Snow
- Ash
- Sand
- Pollen
- Spores
- Water movement
- Tides
- Lightning
- Heat shimmer
- Day/night states
- Seasonal or epoch variation

## 8.3 Parallax and camera life

Use restrained movement:

- Foreground plants respond most strongly
- Midground elements move less
- Distant terrain remains stable
- Fog crosses depth layers
- Creatures can move behind and in front of vegetation
- Camera drift is optional and disabled in reduced-motion mode

## 8.4 Biome identity

Every biome profile should define:

```ts
interface BiomeProfile {
  id: string;
  climate: string;
  terrainFamilies: string[];
  skyProfile: string;
  weatherProfile: string;
  floraFamilies: string[];
  faunaNiches: string[];
  waterProfile?: string;
  gravityProfile: string;
  ambientAudioProfile: string;
  lightProfile: string;
  hazardProfile: string;
  visualSeed: number;
}
```

The existing 43 live profiles and the much broader biome atlas should become external typed content, not large embedded branches in the renderer.

## 8.5 Example upgrades

### Jungle

- Multiple canopy depths
- Moving vines and broad leaves
- Fog between trunks
- Rain interaction
- Sun shafts
- Insect swarms
- Hidden creature occlusion
- Water droplets and leaf runoff

### Crystal steppe

- Refractive structures
- Long dynamic shadows
- Luminous dust
- Color response to the local star
- Resonance pulses
- Mining fracture effects

### Glass desert

- Heat distortion
- Wind-driven surface particles
- Reflective shards
- Long sunset shadows
- Sand accumulation around objects
- Mirages

### Volcanic world

- Lava emission
- Ash
- Smoke
- Heat shimmer
- Ember particles
- Ground cracking
- Underside lighting on organisms

### Ice biome

- Snow depth
- Wind streaks
- Ice reflection
- Frost on organisms
- Aurora
- Ice cracking or drifting
- Condensed breath

### Open sea

- Multiple wave scales
- Sun and moon reflection
- Foam
- Reef silhouettes
- Distant islands
- Weather fronts
- Breaching life
- Underwater shadows

### Gas-deck biome

- Layered cloud depth
- Vertical turbulence
- Lightning
- Floating flora/fauna
- Buoyancy movement
- Distant atmospheric structures

---

# 9. Complete Earth Catalog Upgrade

The Earth catalog is one of the game's most valuable differentiators. It should receive its own production pipeline rather than being treated as a naming layer over general procedural forms.

The current catalog contains:

- 631 fauna
- 334 flora
- 27 fungi
- 22 microbes

A custom animation per catalog entry would be unrealistic. The solution is **shared rigs plus species-specific identity overrides**.

---

## 9.1 Earth fauna

### Current strength

The code already classifies all 631 fauna into 18 rendering categories and contains extensive species-name-specific anatomy logic.

The large `_earthArt` resolver is not throwaway work. It is a prototype taxonomy and visual-override database.

### Recommended upgrade

Convert `_earthArt` from a large code resolver into a typed content registry:

```ts
interface EarthSpeciesVisual {
  speciesId: string;
  commonName: string;
  rigFamily: string;
  subRig?: string;
  proportions: Record<string, number>;
  signatureFeatures: string[];
  paletteProfile: string;
  markingProfile?: string;
  locomotionProfile: string;
  behaviorProfile: string;
  habitatProfiles: string[];
}
```

### Rig target

Expand the current 18 categories into approximately **24–32 polished animation families**.

Examples:

- Heavy ungulate
- Light ungulate
- Equine
- Elephantine
- Heavy bear
- Canid
- Feline
- Mustelid
- Rodent
- Rabbit
- Primate
- Marsupial
- Bat
- Turtle
- Crocodilian
- Lizard
- Serpent
- Frog/amphibian
- Fish body families
- Shark/ray
- Cetacean
- Pinniped
- Bird ground
- Bird flight
- Insect
- Arachnid
- Crustacean
- Cephalopod
- Mollusk/gastropod
- Jelly/radial
- Sessile marine

Not every species receives a unique rig. Each receives signature overrides for features such as:

- Panda markings
- Tiger stripes
- Giraffe proportions
- Bison shoulder mass
- Elephant trunk
- Walrus tusks
- Pangolin plating
- Beaver tail
- Bird beak and wing family
- Fish fin and body profile

## 9.2 Earth flora

The 334 plants should be mapped to approximately **20–30 growth-form rigs**:

- Tree
- Palm
- Conifer
- Shrub
- Herb
- Grass
- Reed
- Vine
- Fern
- Succulent
- Column cactus
- Rosette
- Aquatic floating
- Aquatic submerged
- Kelp
- Root crop
- Flowering stalk
- Broadleaf crop
- Moss/lichen-like
- Carnivorous trap plant
- Fungal-like botanical form where appropriate

Each species receives distinctive:

- Leaf shape
- Flower or fruit organ
- Branching pattern
- Color
- seasonal state
- harvest part
- wind response
- habitat response

## 9.3 Fungi

The 27 fungi can use a smaller set of high-quality rigs:

- Cap and stem
- Cluster
- Shelf/bracket
- Puffball
- Coral fungus
- Jelly fungus
- Stinkhorn
- Cordyceps/parasitic
- Lichen/mat
- Mold/microscopic colony

Fungi should animate through:

- Spore release
- Moisture response
- Bioluminescence
- Growth pulse
- Opening or expansion
- Environmental spread

## 9.4 Microbes

The 22 microbes should become animated microscopic scenes rather than static icons.

Families can include:

- Amoeboid
- Ciliated
- Flagellated
- Diatom
- Dinoflagellate
- Radiolarian
- Bacterial colony
- Extremophile mat
- Planktonic glow
- Tardigrade-like microfauna

Animation can include:

- Cilia
- Flagella
- Cell division
- Pulsing membranes
- Colony movement
- Fluid particles
- Internal organelle motion

---

# 10. Procedural Creature Upgrade

The current generated creatures are sophisticated assembled Canvas illustrations. The new system should rebuild them as animation-ready entities.

## 10.1 Separate identity, phenotype, rig, material, and behavior

The current genome should remain the source of biological identity.

The renderer should derive separate outputs:

```text
Genome
  → Biological phenotype
  → Compatible rig family
  → Proportions and attachment sockets
  → Surface/material profile
  → Animation profile
  → Temperament and behavior profile
  → Runtime entity
```

This separation prevents visual-system changes from altering gameplay generation.

## 10.2 Modular creature construction

```text
Creature root
│
├── Torso mesh
├── Pelvis
├── Neck
├── Head
│   ├── Jaw
│   ├── Eyes
│   ├── Eyelids
│   ├── Ears/antennae
│   └── Crest/horns
├── Front limbs
├── Rear limbs
├── Additional limbs
├── Wings/fins
├── Tail/tendrils
├── Armor or crystals
├── Elemental organs
├── Pattern and material masks
└── Contact shadow
```

Every attachment must use compatibility rules. Wings cannot simply appear on any body without a shoulder or thoracic socket. Extra limbs require a gait that supports them.

## 10.3 Procedural animation families

Recommended major rig families:

1. Small quadruped
2. Light quadruped
3. Heavy quadruped
4. Biped
5. Avian
6. Winged quadruped
7. Insectoid
8. Arachnid
9. Crustacean
10. Serpentine
11. Aquatic fish-like
12. Aquatic ray-like
13. Cetacean-like
14. Cephalopod
15. Jelly/radial
16. Gastropod
17. Amphibious
18. Floating
19. Sessile
20. Multi-limbed alien
21. Plant-animal hybrid
22. Amorphous or void entity

The final production library may use approximately 24–32 rigs after prototypes identify missing anatomy families.

## 10.4 Core animation library

Every compatible creature should support:

- Breathing
- Blinking
- Look left/right
- Head tracking
- Weight shift
- Turn
- Walk or base locomotion
- Fast locomotion
- Alert
- Attack
- Damage reaction
- Defeat
- Sleep
- Wake
- Feed/graze
- Tame success
- Tame failure
- Player interaction

Specialized sets include:

- Takeoff
- Flight
- Glide
- Hover
- Landing
- Swimming
- Diving
- Surfacing
- Burrowing
- Slithering
- Coiling
- Climbing
- Jet propulsion
- Radial crawling
- Trap deployment
- Armor raising
- Tentacle extension

## 10.5 Face and personality

Creature faces should receive a full redesign pass.

Even alien creatures need a readable emotional center through:

- Eyes or sensory organs
- Eyelids
- Pupils where appropriate
- Jaw or mouth movement
- Ear, crest, antenna, or horn reaction
- Posture
- Timing

Temperament profiles should include:

- Curious
- Aggressive
- Timid
- Playful
- Protective
- Territorial
- Social
- Solitary
- Patient ambusher
- Skittish grazer

## 10.6 Material system

Elemental identity must affect form, light, motion, and behavior—not only hue.

### Crystal

- Refractive highlights
- Internal glow
- Spectral flashes
- Crystal dust
- Damage fractures
- Resonance pulses

### Fire

- Molten cracks
- Embers
- Smoke
- Heat distortion
- Heated footsteps
- Brightness rising with aggression

### Electric

- Static buildup
- Hair/feather response
- Electrical arcs
- Charge trails
- Discharge on attack

### Poison

- Vapor
- Droplets
- Inflating toxin sacs
- Corrosive footprints
- Warning displays

### Ice

- Frost
- Cold mist
- Ice particles
- Condensed breath
- Crystalline cracking

### Void

- Distorted edges
- Light absorption
- Shadow particles
- Delayed afterimage
- Unnatural animation timing

### Prism

- Angle-dependent color
- Spectral separation
- Colored afterimages
- Light-splitting attacks

### Celestial

- Orbiting motes
- Internal radiance
- Star-like markings
- Cosmic trails
- Controlled majestic motion

## 10.7 Environmental interaction

Creatures should affect and respond to the world:

- Footprints
- Dust
- Snow compression
- Water splashes
- Grass displacement
- Mud
- Ash
- Sand
- Reflected lava light
- Rain wetness
- Wind in fur or feathers
- Fog occlusion
- Lightning illumination
- Bioluminescence at night

## 10.8 Discovery presentation

A new-species reveal should be a major event:

1. Movement or environmental clues appear.
2. The creature is partially revealed.
3. It enters with a species-specific animation.
4. The camera reframes.
5. The creature evaluates the player.
6. Name, classification, rarity, and habitat appear.
7. Its unique sound plays.
8. The Codex records it.
9. The player chooses observe, tame, fight, scavenge, or retreat.

## 10.9 Taming and bonding

Tamed creatures should remain living entities rather than inventory cards.

They should:

- Recognize the player
- Greet the player
- Relax over time
- React to feeding
- Become excited after success
- Rest after difficult activity
- Interact with other creatures
- Display lineage traits
- Have favored idle behaviors

This is the system that turns procedural generation into emotional ownership.

---

# 11. Procedural Flora, Fungi, and Microbe Upgrade

## 11.1 Flora generation

The current flora pipeline contains strong ideas but has historically been vulnerable to repeated templates and default-form fallback.

The new system should use explicit growth-form manifests and typed trait compatibility.

A generated plant should define:

```ts
interface PlantPhenotype {
  growthForm: string;
  branching: string;
  leafProfile: string;
  flowerProfile?: string;
  fruitProfile?: string;
  rootProfile: string;
  surfaceMaterial: string;
  motionProfile: string;
  harvestOrgans: string[];
  defenseProfile?: string;
  luminescence?: string;
}
```

## 11.2 Flora animation

- Wind response
- Underwater current response
- Low-gravity drift
- Bloom/open/close
- Trap activation
- Spore or pollen release
- Harvest reaction
- Damage/wilt
- Seasonal variation
- Bioluminescent pulse

## 11.3 Ecological placement

Plants should not be scattered uniformly.

Use:

- Moisture bands
- Light bands
- Elevation
- Soil/geology compatibility
- Water proximity
- Clustering
- Competition
- Disturbance and regrowth

## 11.4 Fungi and microbial ecosystems

Fungi and microbes should participate in:

- Decay
- Soil health
- Symbiosis
- Toxic zones
- Extreme environments
- Bioluminescent ecosystems
- Resource production
- Disease or hazard systems where appropriate

---

# 12. Living Ecology Upgrade

The current `Ecology` module already provides deterministic biospheres and species rosters. The next step is runtime behavior.

## 12.1 Ecological roles

Assign roles such as:

- Producer
- Grazer
- Browser
- Filter feeder
- Scavenger
- Predator
- Apex predator
- Parasite
- Symbiont
- Decomposer
- Pollinator
- Seed disperser

## 12.2 Runtime behavior

Biome scenes should simulate only what is visible or immediately relevant.

Examples:

- Grazers feed
- Predators stalk
- Herds react to danger
- Flyers land and take off
- Aquatic schools turn together
- Nocturnal species emerge at night
- Protective adults guard young
- Pollinators visit plants
- Scavengers follow recent conflict

## 12.3 Performance rule

Do not run an entire planet as a continuous agent simulation.

Use deterministic scene reconstruction:

- World state stores important outcomes.
- Local scenes generate plausible behavior from seed, time band, ecology, and player history.
- Distant/offscreen organisms use summary simulation.
- Only nearby actors run full animation and behavior.

---

# 13. Materials, Gear, Ships, and Player Presentation

The upgrade should include every non-organic system.

## 13.1 Materials

The 47-material registry should become data-driven and support:

- Surface material profile
- Reflectivity
- Roughness
- Emission
- Transparency
- Particle response
- Rarity animation
- Mining fracture behavior
- Refining presentation

Material icons should gain more depth and consistency while remaining readable at small size.

## 13.2 Gear

Gear should have:

- Better silhouettes
- Material-specific finishes
- Tier-specific construction complexity
- Animated energy or mechanical parts where appropriate
- Clear equipment-slot identity
- Strong small-size icons
- Full-size inspect views

## 13.3 Character and paper doll

The current paper doll is functional but highly simplified.

The upgraded version should add:

- More refined explorer silhouette
- Better armor layering
- Proper item attachment
- Suit material response
- Idle animation
- Helmet and visor effects
- Ship/companion presentation
- Optional identity customization

The dense stat sheet should remain browser-native UI for accessibility and responsiveness.

## 13.4 Ships

Ships should gain:

- Tier-specific silhouettes
- Animated engines
- Thruster particles
- Equipment hardpoints
- Damage and upgrade states
- Landing presentation
- System-travel animation
- Interior or command-screen flavor if later desired

---

# 14. UI, Codex, and Discovery Upgrade

The UI should retain its celestial dark identity while becoming clearer, smoother, and more alive.

## 14.1 Keep HTML/CSS for dense information

Use browser-native components for:

- Codex
- Inventory
- Crafting
- Breeding
- Lineage
- Character sheet
- Shipyard
- Settings
- Search
- Guide
- Accessibility

This preserves:

- Text selection
- Screen-reader semantics
- Responsive layout
- Form behavior
- Searchability
- Easier localization

## 14.2 Use PixiJS for live previews

Embed GPU-rendered previews for:

- Rotating planets
- Animated creatures
- Animated flora
- Material inspection
- Biome thumbnails
- Ship previews
- Discovery reveals

## 14.3 Mobile layouts

Build three presentation profiles:

| Profile | Target |
|---|---|
| Desktop | Full multi-panel view, mouse/keyboard, high effects |
| Tablet | Touch-first, moderate information density |
| Phone | Bottom navigation, full-screen panels, simplified scene composition |

The same codebase can serve all three, but each layout should be designed intentionally.

## 14.4 Accessibility

- Full keyboard navigation
- Screen-reader alternatives for canvas navigation
- Color-plus-symbol rarity coding
- Reduced motion
- Reduced effects
- Text scaling
- High contrast
- Non-hover interaction equivalents
- Audio captions or visual event cues
- Browser zoom support

---

# 15. Complete Audio and Music System

Audio should be treated as a core world-generation and emotional-design system, not as a final polish pass.

The complete audiovisual target is:

> **Every galaxy, stellar environment, planet, biome, creature, material, ship, discovery, and player action should have a coherent sonic identity generated from the same world data that drives its visuals and gameplay.**

The system should combine authored high-quality source material with deterministic procedural selection and mixing. Pure stock-sound assignment would become repetitive, while fully synthetic audio for everything would often sound artificial. A hybrid approach provides the best quality.

## 15.1 Current v1.8.9 audio implementation and migration recommendation

The current runtime audio layer is no longer limited to a few UI tones. v1.8 added a meaningful, deterministic procedural-audio foundation that must be treated as a ported game system rather than discarded prototype code.

The current implementation includes:

- A lazily created `AudioContext` with repeated pointer, touch, click, and keyboard resume attempts for iOS and other browsers that suspend audio
- A shared perceptual SFX gain bus and persistent volume setting
- Independent master, creature-voice, and battle-sound toggles (`snd`, `vce`, and `cbx` in the save)
- Deterministic creature voices generated by `voiceOf(g)` from rig family, size, temperament, trait, body, locomotion, diet, sense, Earth ancestry, and alien ancestry
- Eighteen current voice archetypes: mammal, primate, bird, bat, reptile, serpent, amphibian, turtle, fish, marine, cephalopod, insect, arachnid, crustacean, gastropod, jelly, sessile, and legacy
- Voice inheritance and blending for Earth/alien hybrids
- Procedural combat impacts, critical-hit accents, and ability-proc sounds
- Planetfall arrival chords
- Looping biome ambience profiles for ice, tundra, desert, glass, ocean, coral, lava, magma sea, swamp, jungle, gas, carbon, and a default profile
- Rarity stings, survey pings, travel whooshes, fanfares, failure tones, confirmation tones, denial tones, and impact thuds
- Explicit stopping of ambience on vista close, mute, hidden tabs, and replacement by another ambience bed

Important current limitations and decisions:

- Everything is synthesized at runtime; there is no authored music or recorded sample library yet.
- Most sound still exits through one shared SFX bus rather than a full music/ambience/creature/gameplay/UI mix graph.
- The ambience bed stops when the tab is hidden and does not automatically restart when the tab becomes visible; this remains a design decision.
- A focused family audit found that the bat voice family can still hit the 6 kHz clamp too often. The port should use soft saturation or a revised family range rather than copying the hard-clamp behavior blindly.
- The `legacy` voice profile currently behaves as a possible procedural family, not merely a fallback. Decide whether it should remain an intentional eighteenth family before locking the new manifest.
- Automated tests can validate lifecycle, determinism, parameter range, toggles, and node cleanup, but they cannot judge whether the result sounds appealing. A human listening test remains required before committing to the full production scale in this section.

The migration should therefore preserve the deterministic **audio identity model** while rebuilding its runtime architecture:

1. Port `voiceOf(g)` and its inheritance rules as typed, engine-independent audio-profile generation.
2. Preserve current creature-code audio identity through golden genome/audio-profile fixtures.
3. Split the single SFX bus into master, music, ambience, creature, combat/gameplay, and UI buses.
4. Retain synthesized layers where they are distinctive and payload-efficient.
5. Add authored samples, adaptive music, spatial emitters, streaming, concurrency groups, and accessibility only after the current audio identity has parity tests.
6. Keep audio activation, suspension recovery, mute lifecycle, and hidden-tab cleanup as release-blocking browser requirements.

## 15.2 Audio design principles

The audio direction should follow these rules:

1. **Readable before realistic.** Important actions and threats must be understandable even in a dense soundscape.
2. **Biological logic.** Creature sounds should follow body size, anatomy, breathing system, habitat, and communication behavior.
3. **Environmental logic.** Atmosphere, water, pressure, weather, terrain, and distance should alter sound.
4. **Procedural identity without noise.** Generated variation must remain curated, stable, and musically coherent.
5. **Silence has value.** Space, caves, deep ocean, and rare encounters should use controlled negative space rather than constant sound.
6. **No essential audio-only information.** Important cues must have captions, symbols, animation, or haptic equivalents where available.
7. **Mobile-first limits.** The system must sound complete with fewer simultaneous voices and smaller assets.
8. **Signature motifs.** Surveying, rare discovery, taming, lineage, planetfall, and frontier progression should have instantly recognizable sounds.

## 15.3 Core audio architecture

Use the Web Audio API as the production foundation.

Recommended routing graph:

```text
AudioContext
│
├── Music Bus
│   ├── Base score
│   ├── Exploration layers
│   ├── Tension layers
│   ├── Combat layers
│   └── Discovery and rarity overlays
│
├── Ambience Bus
│   ├── Celestial environment
│   ├── Weather
│   ├── Terrain and water
│   ├── Distant ecology
│   └── Interior or cave layers
│
├── Creature Bus
│   ├── Vocalizations
│   ├── Breathing
│   ├── Locomotion
│   ├── Wings, fins, shells, armor, and appendages
│   └── Elemental emissions
│
├── Gameplay SFX Bus
│   ├── Combat
│   ├── Taming
│   ├── Harvesting
│   ├── Mining
│   ├── Crafting
│   ├── Equipment
│   └── Ship actions
│
├── UI Bus
│   ├── Navigation
│   ├── Confirmation
│   ├── Error
│   ├── Codex and inventory
│   └── Notifications
│
├── Narrative/Voice Bus
│   ├── Optional guide or narration
│   └── Accessibility speech integration
│
└── Master Bus
    ├── Dynamic-range profile
    ├── Safety limiter
    ├── Global mute
    └── Output device
```

Required settings:

- Master volume
- Music volume
- Ambience volume
- Creature volume
- Gameplay SFX volume
- UI volume
- Voice/narration volume, if used
- Dynamic range: Night, Standard, Wide
- Mono-audio option
- Reduce intense or startling sounds
- Captions for meaningful sound events
- Mute when unfocused option

The first user click, tap, or key press should unlock the audio context. The interface should never imply that audio is active when the browser has blocked or suspended it.

## 15.4 Adaptive music system

The music should react to game state without sounding like short loops repeatedly restarting.

### Music state inputs

- Galaxy family
- Star class
- Planet type
- Biome
- Time of day
- Weather
- Exploration danger
- Creature rarity
- Player condition
- Combat state
- Discovery state
- Taming progress
- Conquest or settlement state
- Story chapter
- Frontier depth

### Layer model

A typical score can be assembled from synchronized layers:

```text
Harmonic foundation
+ Texture or drone
+ Environmental rhythm
+ Exploration melody fragments
+ Creature/ecology motif
+ Tension pulse
+ Combat percussion
+ Rarity or discovery overlay
```

Layers should enter and leave on musically valid boundaries. Combat should intensify the current world identity rather than abruptly replacing it with unrelated music.

### Recommended balance between authored and procedural music

Use authored stems and phrases, then select, sequence, transpose, filter, and mix them deterministically from the current world profile.

This avoids two extremes:

- A fully fixed soundtrack that cannot represent an effectively infinite universe
- Fully synthesized random music that lacks emotional authorship

The seed should select a stable musical identity for a star system or biome, but the moment-to-moment arrangement may vary within controlled rules.

### Musical identity examples

| Environment | Musical direction |
|---|---|
| Earth starter region | Warm, legible, exploratory, lightly organic |
| Crystal world | Glass harmonics, resonant pulses, refracted arpeggios |
| Volcanic world | Low percussion, unstable pulses, metallic pressure |
| Ice world | Sparse high textures, slow harmonic movement, brittle transients |
| Ocean world | Broad suspended harmony, fluid movement, distant low calls |
| Void region | Reduced tonal center, stretched textures, unstable timing |
| Prism region | Interlocking spectral layers and shifting harmonic color |
| Celestial rarity | Expanded range, choir-like or luminous layers, long decay |

## 15.5 Universe-scale sound design

Space scenes should be cinematic but internally consistent.

Celestial Frontier does not need to imitate literal vacuum silence at every moment. The sonic perspective can represent the ship, suit, instruments, gravitational data, electromagnetic activity, and player interface.

### Galaxies and deep space

- Low-level navigational hum
- Sparse long-form musical textures
- Distant data sonification
- Subtle changes by galaxy type
- Reduced density in empty regions
- Increasing harmonic instability near anomalies

### Stars

Stars should not simply emit looping fire noise.

Use class-aware combinations of:

- Low plasma movement
- Magnetic crackle
- Solar-wind texture
- Flare events
- Radiation-monitor sonification
- Ship-hull resonance at close distance

Large and unstable stars should feel more massive and dangerous without relying only on volume.

### Planets and moons

Orbital audio can include:

- Atmospheric monitoring
- Magnetosphere tones
- Storm activity
- Ring and debris telemetry
- Moon-transit cues
- Surface signal previews
- Planet-type musical identity

### Black holes

- Extreme low-frequency pressure represented carefully on consumer devices
- Time-stretched debris texture
- Gravitational-data modulation
- Accretion-disk energy
- Controlled spectral narrowing near the horizon
- Interface instability without painful high-frequency noise

### Wormholes

- Rotating spatial texture
- Directional energy movement
- Destination coloration
- Pitch or spectral folding
- Entry compression and exit expansion
- Distinct stable versus unstable variants

### Quasars and anomalies

- Very large-scale energy beds
- Pulsed emissions
- Long-distance warning signatures
- Dynamic-range control so powerful events remain comfortable

### Descent and landing

The current whoosh should become a layered planetfall sequence:

1. Orbital ambience reduces.
2. Ship systems and hull movement become more prominent.
3. Atmospheric entry adds turbulence and heat.
4. Weather and biome layers fade in.
5. Local wildlife becomes audible at appropriate distance.
6. Landing gear, surface material, and ship class determine touchdown sound.
7. The music resolves into the biome exploration state.

## 15.6 Biome soundscape system

Each of the 43 live biome profiles should receive an `audioProfile` assembled from layers rather than one looping ambience file.

Recommended profile:

```ts
interface BiomeAudioProfile {
  id: string;
  baseBed: string[];
  weatherLayers: string[];
  terrainLoops: string[];
  waterLayers?: string[];
  distantFaunaPools: string[];
  floraMovementPools: string[];
  rareEvents: string[];
  reverbProfile: string;
  occlusionProfile: string;
  musicProfile: string;
  silenceDensity: number;
  eventRate: [number, number];
  audioSeed: number;
}
```

### Biome examples

#### Jungle

- Multi-depth insects and distant birds
- Canopy movement
- Rain above and below leaves
- Water drips and runoff
- Large creatures moving behind foliage
- Stronger occlusion and short reflective spaces

#### Crystal steppe

- Wind through mineral structures
- Resonant impacts
- Sparse crystalline pings
- Distant herd movement
- Subtle pitch relationships tied to the planet's musical identity

#### Glass desert

- Fine wind and shifting particulate texture
- Sharp material ticks
- Long exposed spatial field
- Rare distant calls
- Temperature-driven intensity changes

#### Volcanic world

- Low geological movement
- Gas vents
- Lava rupture
- Falling ash
- Heat stress in equipment
- Creature calls filtered by dense atmosphere

#### Ice biome

- Snow movement
- Ice expansion and fracture
- Distant wind with controlled high frequencies
- Muffled footsteps
- Clear long-distance calls in open areas

#### Ocean and reef

- Surface and underwater states
- Wave layers by weather
- Reef activity
- Directional schools
- Distant large-animal calls
- Pressure and low-pass transitions during dives

#### Cave

- Position-aware reflections
- Drips, debris, air movement, and distant organisms
- Strong occlusion
- Footsteps based on rock, mud, ice, crystal, or organic surfaces
- Silence used to signal depth and isolation

#### Gas-deck biome

- Continuous atmospheric flow
- Pressure movement
- Electrical storms
- Floating-life calls
- Directional altitude and turbulence cues

## 15.7 Earth catalog audio upgrade

The Earth catalog should sound like a curated living encyclopedia, not a collection of unrelated clips.

The 1,014-entry catalog does not require 1,014 entirely unique recording sets. Use a hierarchy:

```text
Biological class
→ Family or movement group
→ Species profile
→ Signature override for iconic species
→ Individual variation
```

### Earth fauna

Map each species to:

- Vocal family
- Call repertoire
- Body-mass range
- Footstep or movement family
- Breathing profile
- Social density
- Activity period
- Habitat filtering
- Aggression and distress variants

Iconic or highly recognizable animals should receive signature overrides rather than generic family calls.

### Earth flora

- Leaf, grass, reed, branch, flower, and seed movement
- Pollination events
- Fruit or pod release
- Traps closing
- Large plant creaks
- Aquatic movement
- Harvest response

### Earth fungi and microbes

These should not be forced into literal vocal sound.

Use:

- Subtle environmental texture
- Growth or spore events
- Microscopic sonification in Codex views
- Research-interface sounds
- Colony or chemical activity represented through restrained designed audio

Any externally sourced wildlife recording must have documented usage rights, source metadata, and processing history.

## 15.8 Procedural alien creature vocalization

Creature audio should derive from anatomy and ecology.

Recommended inputs:

```ts
interface CreatureAudioGenome {
  bodyScale: number;
  bodyFamily: string;
  respiratorySystem: string;
  vocalOrgan: string;
  mouthShape: string;
  resonanceCavity: number;
  shellOrArmor: string;
  appendageFamilies: string[];
  locomotion: string;
  habitat: string;
  atmosphereDensity: number;
  gravity: number;
  communicationStyle: string;
  temperament: string;
  element: string;
  rarityTier: number;
}
```

### Call families

- Breath and exhale
- Chirp
- Click
- Rattle
- Hum
- Drone
- Croak
- Bark
- Roar
- Whistle
- Song phrase
- Infrasound-like pulse represented within safe playback limits
- Electrical or material signaling
- Telepathic or void-design language

### Emotional states

Every compatible species should support variations for:

- Neutral idle
- Curiosity
- Alert
- Warning
- Aggression
- Fear
- Injury
- Defeat
- Feeding
- Social contact
- Courtship or lineage behavior
- Taming acceptance
- Bonded greeting

### Hybrid generation method

Use curated source layers plus controlled transformation:

- Pitch range
- Formant-like filtering
- Playback rate within quality limits
- Granular or wavetable processing for selected alien families
- Layer weighting
- Envelope
- Repetition pattern
- Distortion or saturation by material
- Reverb and environmental filtering

Do not pitch one animal sound across the entire catalog. That creates recognizable repetition and weakens creature identity.

## 15.9 Creature locomotion and body foley

Animation and audio must be authored together.

Required synchronized event markers:

- Foot contact
- Weight transfer
- Wing downstroke
- Wing fold
- Tail strike
- Armor shift
- Shell movement
- Jaw closure
- Charge buildup
- Attack release
- Landing
- Water entry
- Surface breach
- Burrow entry and exit

Foley should respond to both creature and ground:

```text
Creature mass
× limb type
× movement speed
× surface material
× weather state
× gravity
× atmosphere
```

Examples:

- A heavy hoofed creature on crystal should not sound like a clawed creature on wet soil.
- A large wingbeat in dense atmosphere should differ from the same anatomy in thin air.
- A void creature may intentionally break normal timing, but its audio still needs readable attack anticipation.

## 15.10 Flora, fungi, and microbial audio

Procedural life beyond fauna should contribute to biome identity.

### Flora

- Wind response by leaf and stem type
- Low-gravity movement
- Aquatic current movement
- Blooming or closing
- Seed release
- Spore release
- Trap activation
- Harvest and damage
- Bioluminescent or electrical pulses

### Fungi

- Spore clouds
- Cap or stalk movement
- Network activation
- Wet organic interaction
- Colony growth events

### Microbes

Microbial scenes should use designed scientific sonification rather than fake miniature animal noises.

Possible mappings:

- Population density to texture density
- Metabolic rate to pulse rate
- Colony health to harmonic stability
- Mutation to spectral change
- Chemical exchange to spatial motion

## 15.11 Gameplay sound systems

### Survey and discovery

Preserve the current survey ping as a signature sound.

Expand it with:

- Surface or scan-context variation
- Confirmation layers
- Rarity escalation
- New-species discovery motif
- Duplicate or known-species response
- Codex entry completion

### Taming

- Approach tension
- Creature emotional responses
- Attempt feedback
- Success resolution
- Failure without excessively punitive harshness
- Bond-level progression motif

### Combat

- Clear anticipation, release, impact, and recovery
- Material-aware impacts
- Element-specific attack language
- Status effects
- Shield, armor, and health states
- Readable critical and defeat cues
- Music intensity that follows combat without restarting constantly

### Mining and harvesting

- Material-specific strikes and fractures
- Tool tier identity
- Deposit instability
- Completion and yield feedback
- Rare-material reveal
- Flora-specific harvest response

### Crafting and fabrication

- Mechanical and energy layers by station tier
- Material insertion
- Process progress
- Success, exceptional result, and failure
- Gear equip and comparison

### Ship and navigation

- Engine family by ship tier
- Thrust, braking, cruise, damage, and upgrade states
- Interior system hum
- Warning hierarchy
- Jump preparation and release
- Planetfall
- Docking and landing

### UI

UI audio should be restrained and consistent:

- Focus and hover should not produce constant noise
- Tap/click confirmation
- Panel open and close
- Tab change
- Drag, equip, compare, and salvage
- Error and blocked action
- Notification priority
- Settings preview

## 15.12 Spatial audio and camera relationship

Use positional audio selectively.

Recommended approach:

- Stereo panning and distance attenuation for nearby creatures and events
- Low-pass or gain reduction for occluded sources
- Reverb sends by environment
- Listener position tied to the active camera or player viewpoint
- Screen-space stabilization for important UI feedback
- Limit expensive spatial processing to meaningful emitters

Not every ambient insect or star needs a separate 3D audio node. Distant ecology should often be represented by premixed or clustered beds.

## 15.13 Mixing, transitions, and dynamic range

The mix must remain readable when music, weather, creatures, combat, and UI occur together.

Required systems:

- Priority and concurrency groups
- Voice stealing
- Side-chain ducking for major discovery and warning events
- Smooth crossfades
- Snapshot-based mix states
- Distance filtering
- Occlusion
- Reverb sends
- Compression profiles
- Master limiting
- Loudness and true-peak validation during build

Examples:

- A rare discovery briefly ducks ambience and music without muting the world.
- Combat raises relevant creature and impact buses while reducing nonessential distant ecology.
- Opening the Codex lowers environmental distraction but keeps a subtle sense of place.
- Night mode narrows dynamic range without making every sound equally loud.

## 15.14 Browser and mobile implementation

Browser audio has operational constraints that must be designed into the game.

### User activation

Audible playback is commonly blocked until the user interacts with the page. The game should:

- Unlock audio from the first deliberate user gesture
- Show a clear muted/suspended state when necessary
- Resume after returning from the background
- Re-arm on later gestures if a mobile browser suspends the context
- Never fail silently

### Asset strategy

Use:

- Lossless masters during production
- Build-time compressed delivery variants
- Runtime format capability detection
- Decoded `AudioBuffer` assets for short and latency-sensitive effects
- Streamed media for long music and ambience where appropriate
- Audio sprites only for dense sets of very short UI sounds when they produce a measurable benefit
- Lazy loading by region, biome, creature family, and gameplay mode

### Recommended simultaneous-voice budgets

These are starting budgets to validate on real devices:

| Device profile | Active voices |
|---|---:|
| Low/mobile | 20–28 |
| Standard/mobile and tablet | 28–40 |
| Desktop standard | 40–56 |
| Desktop high | 56–72 |

Use concurrency rules so ten nearby insects, repeated footfalls, or particle impacts cannot consume the entire voice budget.

### Battery and heat controls

- Pause or reduce audio processing when backgrounded
- Avoid unnecessary always-running custom DSP
- Use AudioWorklet only for features that genuinely require it
- Reduce spatial emitters and ambience layers on low mode
- Stop inaudible nodes rather than leaving them connected
- Unload biome-specific buffers after safe transitions

## 15.15 Accessibility and comfort

Required options:

- Separate volume categories
- Master mute
- Mono audio
- Dynamic-range presets
- Captions for creature calls, warnings, offscreen threats, and important environmental events
- Direction indicators for important offscreen sounds
- Visual alternatives for rhythm- or timing-dependent cues
- Reduce startling sounds
- Reduce high-frequency intensity
- Disable tinnitus-like ringing effects
- Controller or device vibration alternatives where supported and appropriate
- Test settings without entering gameplay

Caption examples should describe meaning, not merely sound spelling:

- `[Large creature moving through brush — left]`
- `[Electrical storm intensifying]`
- `[Rare creature call in the distance]`
- `[Hull warning: atmospheric stress]`

## 15.16 Audio asset and authoring pipeline

Recommended source workflow:

```text
Field recordings / licensed libraries / synthesis / foley
→ Editing and cleanup
→ Creature or environment family construction
→ Metadata tagging
→ Loudness and peak validation
→ Compression variants
→ Content-manifest generation
→ In-browser audition tool
→ Automated reference checks
```

Asset metadata should include:

- Stable ID
- Category
- Source and rights
- Duration
- Loop points
- Loudness measurement
- Peak measurement
- Tags
- Creature or biome compatibility
- Rarity compatibility
- Emotional state
- Concurrency group
- Priority
- Streaming or buffering mode
- Mobile-quality variant

Build an internal audio-lab page that can:

- Preview every event
- Change biome and atmosphere filters
- Test creature genome variations
- Stress-test voice limits
- Compare mobile and desktop quality
- Verify loops and transitions
- Display active buses and node counts

## 15.17 Deterministic audio identity and versioning

Audio identity should be stable without becoming mechanically repetitive.

Recommended streams:

```text
Stable world seed
├── Music identity stream
├── Biome ambience stream
├── Creature voice-profile stream
├── Creature call-selection stream
├── Foley variation stream
└── Noncritical moment-to-moment presentation stream
```

World and species identity should be deterministic. Tiny timing or one-shot variations may use a presentation stream that does not affect gameplay.

Add audio versions:

```ts
interface AudioGenerationVersions {
  musicResolver: number;
  biomeAudioResolver: number;
  creatureVoiceResolver: number;
  foleyResolver: number;
  mixSchema: number;
}
```

Changing the audio renderer must never change a creature's stats, rarity, genetics, or share code.

## 15.18 Audio testing and quality gates

Automated tests should cover:

- Missing audio IDs
- Broken file references
- Invalid loop points
- Unsupported event-to-bus mappings
- Excessive simultaneous voices
- Deterministic profile generation
- Audio-context resume behavior
- Save and settings migration
- Muted-state correctness
- No sound after disposal
- No leaked nodes after scene transitions
- Mobile background and foreground cycles

Manual QA should cover:

- Ear fatigue
- Repetition over long sessions
- Mix readability
- Headphones, laptop speakers, phones, tablets, and external speakers
- Mono compatibility
- Low-volume play
- Accessibility captions
- Long-session memory behavior
- Browser differences

## 15.19 Production deliverables

A complete production audio package should include:

- Audio direction guide
- Musical identity guide
- Bus and mix specification
- Adaptive-music state map
- Biome audio profiles for all live biomes
- Celestial-object and anomaly sound families
- Earth-catalog audio mapping
- Procedural alien vocalization system
- Creature locomotion and body-foley families
- Combat, taming, mining, crafting, ship, and UI libraries
- Accessibility caption taxonomy
- Mobile-quality assets
- Audio test harness
- Rights and source ledger

## 15.20 Timeline and staffing impact

Audio should begin during the vertical slice, not after feature completion.

Recommended staffing:

- One sound designer/technical audio implementer
- One composer or adaptive-music designer, which may be the same person on a smaller production
- Foley, field recording, or additional composition support as needed

Estimated dedicated audio effort:

| Scope | Effort |
|---|---:|
| Port existing stings and UI feedback | 2–4 weeks |
| Core buses, settings, streaming, and event framework | 4–7 weeks |
| One complete universe/biome/creature audio vertical slice | 4–6 weeks |
| Full biome, creature, gameplay, and celestial production | 12–24 weeks |
| Final mix, mobile optimization, accessibility, and QA | 4–8 weeks |

With a dedicated audio specialist working in parallel, this does not need to add the full amount to the critical path. With a solo developer, it can add approximately two to four months to the complete premium upgrade.

---

# 16. Procedural, Content, and Data Architecture

## 16.1 Separate identity from presentation

Every generated entity should expose at least three versioned identities:

```ts
interface GeneratedIdentity {
  generatorVersion: number;
  identitySeed: number;
  contentId: string;
}

interface RenderIdentity {
  renderProfileVersion: number;
  renderSeed: number;
  rigId?: string;
  materialProfileIds: string[];
}

interface AudioIdentity {
  audioProfileVersion: number;
  profileSeed: number;
  familyId?: string;
}
```

Gameplay identity may remain unchanged while visuals and sound improve. A renderer update must not move a planet, rename a species, alter combat stats, or break a share code.

## 16.2 Formal RNG specification

Document and test:

- Integer coercion behavior
- `hashInt` semantics
- `mulberry32` semantics
- Cell-coordinate quantization
- Salt ownership
- Seed composition
- Ordering assumptions
- Floating-point rounding where serialized

Create at least 10,000 golden-seed cases in a portable JSON/CSV fixture so a future C++/Unreal implementation can reproduce or intentionally version the same universe.

## 16.3 Explicit dual rarity types

```ts
type RawGradeTier = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14;
type DisplayRarityTier = 0|1|2|3|4|5|6|7|8|9;
```

Never use one as the other without an explicit conversion function.

## 16.4 Content manifests

Move authoritative content out of rendering/UI code into versioned manifests for:

- Earth fauna, flora, fungi, and microbes
- Procedural anatomy and phenotype traits
- Biomes and compatibility
- Planets, stars, atmospheres, and celestial phenomena
- Materials, exceptional variants, gear, recipes, and affixes
- Abilities and combat classes
- Charters, chapters, achievements, Prime Codex, and endings
- Rig families, animation profiles, sockets, and attachment rules
- Visual materials and shader profiles
- Audio families, voice parameters, ambience profiles, and music states
- Localization and accessible descriptions

## 16.5 Validation

Build schema and semantic validation for:

- Duplicate or unstable IDs
- Broken references
- Missing rig/animation/audio mappings
- Impossible anatomy combinations
- Missing biome compatibility
- Invalid raw/display rarity conversions
- Invalid recipe or reward references
- Save migration coverage
- Deterministic output drift
- Asset licensing and source-master availability

---

# 17. Latest Code-to-Port Matrix

| Current area | Preserve | Rewrite | Required parity evidence |
|---|---|---|---|
| `Rand` | Algorithms, coercions, salts | Module syntax/types | Golden vectors and 50-probe fingerprint |
| `WorldConfig` | Anchors, scales, Sol/Earth constants | Typed config | Known-location fixtures |
| `PlanetGen` | Archetypes and color synthesis rules | Rendering outputs separated | Planet descriptor fixtures |
| `Naming` | Seeded names | Typed APIs/localization split | Name fixtures |
| `StarCatalog` | Stellar classes and Sol data | Manifest representation | Sol/system fixtures |
| `WorldGen` | Cell generation and object identity | Worker-safe APIs | 10k spatial seed cases |
| `SurveyPhrases` | Deterministic text rules | Localization/message templates | Descriptor snapshots |
| `SpeciesTraits` | Trait arrays, raw rarity roll, display mapping | Strong types/manifests | Trait and rarity tests |
| `Genome` | Synthesis, classification, `_szOf`, guardians | Domain module | Genome/stat/classification parity |
| `Genetics` | Cross/evolve behavior including allowed drift | Typed pure functions | Multi-generation fixtures |
| `Ecology` | Biospheres, rosters, civilizations, epoch use | Worker/domain split | World ecology fixtures |
| `Descriptors` | Survey/species/celestial semantics | Presentation DTOs | Snapshot parity |
| `CombatCore` | Stats, abilities, deterministic duel results | Pure domain service | Outcome and distribution tests |
| `EncUtil` | Share-code formats and sanitization meaning | Use standard typed utilities | Old/new code round trips |
| `ThumbArt` | Composition intent | Pixi render textures / asset previews | Golden thumbnails |
| `GalaxyArt` | Archetypes and palette rules | GPU layers/shaders | Golden galaxy screens |
| `SpeciesArt` / `hdart` | Phenotype resolver, Earth taxonomy, art rubric | Rigged assets, mesh animation, material system | Fixed-seed proof sheets |
| `Renderer` | Camera modes, transitions, object-selection meaning | Pixi scene graph and camera controllers | Navigation parity + performance |
| `SaveSystem` | Sanitization, caps, backups, migration semantics | IndexedDB repository and importer | Real v1.8.9 save fixtures |
| Audio | `voiceOf`, inheritance, lifecycle behavior | Multi-bus mixer, assets, music, spatial audio | Profile parity + human listening |
| `Fx` | Moment/feedback intent | Pixi particles, timelines, audio events | Event-sequence tests |
| UI sections | Validated UX and accessible copy | Components and selectors | Real-browser layout/reachability |
| Fabricator/materials | Data, crafting/equip/salvage rules | Data layer + component UI | Economy and inventory parity |
| Charters/Ascent/Prime | State machines and content | Typed progression services/UI | Save/reward/progress outcomes |

---

# 18. Recommended Repository Structure

```text
celestial-frontier/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── bootstrap/
│       │   ├── rendering/
│       │   │   ├── universe/
│       │   │   ├── systems/
│       │   │   ├── planets/
│       │   │   ├── biomes/
│       │   │   ├── creatures/
│       │   │   ├── flora/
│       │   │   ├── effects/
│       │   │   └── cameras/
│       │   ├── ui/
│       │   ├── input/
│       │   ├── audio/
│       │   ├── persistence/
│       │   └── workers/
│       └── public/
├── packages/
│   ├── domain/
│   │   ├── rand/
│   │   ├── universe/
│   │   ├── species/
│   │   ├── genetics/
│   │   ├── ecology/
│   │   ├── combat/
│   │   ├── progression/
│   │   ├── economy/
│   │   └── sharing/
│   ├── content/
│   │   ├── earth/
│   │   ├── biomes/
│   │   ├── materials/
│   │   ├── gear/
│   │   ├── quests/
│   │   ├── audio/
│   │   └── schemas/
│   ├── persistence/
│   ├── test-fixtures/
│   └── tooling/
├── assets-source/
│   ├── creatures/
│   ├── flora/
│   ├── environments/
│   ├── celestial/
│   ├── UI/
│   └── audio/
├── assets-runtime/
├── docs/
└── tests/
    ├── domain/
    ├── migration/
    ├── visual/
    ├── browser/
    ├── performance/
    └── negative-controls/
```

A monorepo is recommended so the web app, domain rules, content manifests, migration tools, and future native exporters share types and fixtures.

---

# 19. Save and Live-Player Migration Plan

## 19.1 Import order

1. Detect `cfcc_save_v2`.
2. Read but do not mutate the original string.
3. Validate with a faithful v1.8.9 import schema.
4. Apply the existing sanitizer and migration meaning.
5. Write an IndexedDB migration transaction containing the imported save, source hash, importer version, and timestamp.
6. Read the new save back and validate it.
7. Launch the ported game from the verified IndexedDB copy.
8. Retain the original localStorage save until the player explicitly chooses to remove the legacy backup after successful use.

## 19.2 Required migration fixtures

- Fresh save
- Long veteran save
- Current iPhone save export
- Pre-v1.8.8 conquered-world save with no `conq[].e`
- Bred creature with `size > 5` that must round-trip unchanged
- Training snapshot mid-restart
- Large Compendium and Atlas
- Exceptional materials, items, equipment, and affixes
- Corrupt primary with valid `_bak`
- Old share and champion codes

## 19.3 Save architecture

Use separate stores/tables for:

- Save metadata and schema version
- Player/progression state
- Creature/genome records
- Catalog/Atlas/log records
- Inventory/equipment/materials
- Settings/accessibility/audio
- Migration journal and recovery snapshots
- Optional generated-asset cache, explicitly disposable

The authoritative player save must never contain Pixi objects, DOM state, decoded audio buffers, render textures, or generated image bytes.

---

# 20. Port Execution Plan

## Phase 0 — v1.8.9 baseline and decision lock

**Estimated effort:** 2–4 weeks

This replaces the prior report's hard “freeze” language. The current HTML game may continue receiving critical fixes until parity, but the port baseline itself must be immutable and tagged.

Deliverables:

- Tag and archive the exact v1.8.9 baseline
- Reproduce all executable dependencies in a clean CI environment
- Capture the 50 existing fingerprint probes
- Add 10,000 cross-language-ready golden seed cases
- Capture representative saves, share codes, champion codes, and migration fixtures
- Capture fixed-seed visual golden screens and proof sheets
- Capture current audio-profile outputs for representative genomes
- Establish bundle, answerability, memory, GPU, and audio-node budgets
- Elevate `ART_DIRECTION.md`, `AUDIO.md`, `PROCESS_LAWS.md`, and system docs into acceptance rubrics
- Run the previously recommended two-week Canvas/Pixi visual spike: rotating planet, ring occlusion, one creature, one layered biome
- Run the human audio listening test before expanding audio scope
- Decide the open design items: fed inheritance, ambience resume, legacy voice family, bat pitch behavior

**Gate:** The baseline and every approved intentional deviation are documented and reproducible.

## Phase 1 — TypeScript foundation and domain extraction

**Estimated effort:** 5–8 weeks

- Create Vite/TypeScript workspace
- Configure strict TypeScript, linting, formatting, Vitest, Playwright, and CI
- Convert the fourteen domain modules in dependency order
- Define stable DTOs and content schemas
- Build raw/display rarity types
- Build command/event contracts
- Preserve exact JavaScript numeric semantics
- Run parity fixtures after every module

**Gate:** All domain golden tests match v1.8.9 with no renderer or DOM dependency.

## Phase 2 — Persistence, sharing, and parity harness

**Estimated effort:** 4–7 weeks

- Implement v1.8.9 localStorage importer
- Implement IndexedDB repository and transaction recovery
- Port share/champion codes
- Port save sanitization and backup behavior
- Port `COSMIC_EPOCH`, conquest harvest state, and training snapshots
- Rebuild outcome tests around the new domain APIs
- Add broken-build/defect-injection negative controls

**Gate:** Real veteran saves and codes load with preserved creatures, worlds, stats, inventory, progression, audio settings, and lineages.

## Phase 3 — Pixi universe-navigation vertical slice

**Estimated effort:** 6–10 weeks

- Pixi application, renderer selection, resolution policy, asset lifecycle
- Universe, galaxy, system, and surface scene containers
- Camera and zoom-mode transitions
- One galaxy, Sol, Earth, and one procedural system
- Stars, planets, moons, and rings with correct occlusion
- Input parity for pointer, touch, wheel, pinch, keyboard, and assisted picking
- Worker-based pre-generation where useful
- HTML survey card connected through typed selectors

**Gate:** Open game → navigate universe → Sol → Earth → land → leave → save → reload on desktop and phone.

## Phase 4 — Validated UI and gameplay-shell parity

**Estimated effort:** 8–13 weeks

- Bridge/dock, panels, sheets, topbar, safe areas
- Survey cards and action shortfalls
- Compendium, Atlas/Chart, Shipyard, Charters, Records, Guide, Settings, notifications
- Objective chip and quest log
- Twenty-one-step Field Training
- Focus restoration, inert/background behavior, Escape order, screen-reader labels, 44px touch floors
- Current copy and release-note migration as needed
- Component virtualization for large catalogs

**Gate:** Existing real-browser layout and reachability contracts pass across the current ten-viewpoint matrix or an approved expanded matrix.

**Important:** This is the point after which the old HTML version may be feature-frozen. Before this gate, it remains the reference product and emergency fallback.

## Phase 5 — Creature and living-species production pipeline

**Estimated effort:** 10–18 weeks for the pipeline and representative master set; content expansion continues afterward

- Final rig-family list for Earth and procedural life
- Animation-ready redraw standards
- Spine/mesh runtime integration
- Socket, limb, head, tail, wing, fin, antenna, and material attachment rules
- Idle, locomotion, combat, damage, defeat, taming, care, and emotional states
- Facial/eye system and temperament behaviors
- Earth signature overrides
- Procedural animation validation
- Living portrait, encounter, and Compendium previews

**Gate:** At least three radically different procedural archetypes and representative Earth species reach commercial quality on phone and desktop without anatomy failures.

## Phase 6 — Full universe and biome presentation

**Estimated effort:** 16–28 weeks, highly parallelizable

- Galaxies, nebulae, stars, black holes, wormholes, quasars, comets, belts
- Planet types, atmospheres, clouds, weather, oceans, emissions, auroras, rings, moons
- Descent and landing cinematics
- Layered biome scenes for all 43 profiles
- Flora, fungi, microbes, environmental motion, ecology, and ambient actors
- Materials, gear, ships, character/paper-doll, rarity reveals
- Golden-screen and fixed-seed review workflow

**Gate:** Universe, system, planet, landing, and encounter screens meet the approved art-direction rubric and performance budgets.

## Phase 7 — Complete audio and music production

**Estimated effort:** 8–16 weeks, overlapping Phases 5 and 6

- Port deterministic voice identity
- Multi-bus mixer
- Adaptive music states and transitions
- Celestial, planetary, biome, creature, flora, combat, taming, crafting, mining, ship, and UI audio
- Authored and synthesized layer strategy
- Animation event markers and foley
- Spatial/occlusion/reverb behavior
- Mobile concurrency and streaming budgets
- Captions, mono, dynamic range, reduced-intensity options
- Human listening and repetition tests

**Gate:** One complete expedition has coherent music, ambience, voices, combat/taming sound, UI feedback, and clean browser lifecycle.

## Phase 8 — Full gameplay parity

**Estimated effort:** 10–16 weeks, much of it parallel with UI/content work

- Capture and biosphere
- Breeding, feeding, lineage, XP, voice inheritance
- Duel and conquest
- Mining, skimming, materials, exceptional units
- Crafting, affixes, equip, salvage
- Ranks, achievements, Charters, Ascent, Prime Codex, events, endings
- Atlas, sharing, Records, collections, Paragons, Guardians
- Current balance and economy

**Gate:** All meaningful v1.8.9 player actions have real UI-path outcome tests.

## Phase 9 — Performance, accessibility, PWA, beta, and release

**Estimated effort:** 8–12 weeks

- Phone/tablet/desktop profiling
- Texture, render-target, actor, audio, and memory budgets
- Low/medium/high and 30/60 FPS presets
- Hidden-tab suspension and cleanup
- Cold-boot painted/answerable budgets
- Accessibility audit
- Save migration stress tests
- Offline shell, PWA manifest, service worker, update rollback
- Cross-browser and physical-device beta
- Release candidate and old-version fallback plan

**Gate:** Commercial release criteria in Section 22 are met.

---

# 21. Timeline and Staffing

The current code is larger than the v1.6.4 build used for the prior estimate, but it is also better specified, better tested, and more conceptually modular. The gameplay port is therefore moderately larger, while uncertainty is lower.

## 21.1 Engine and gameplay parity with current/modestly improved art

| Team | Planning range |
|---|---:|
| One experienced full-time developer | 10–14 months |
| Two experienced full-time developers | 6–9 months |
| Three experienced engineers | 4.5–7 months |

## 21.2 Complete premium audiovisual upgrade in this document

| Team | Planning range |
|---|---:|
| Solo developer/artist | 20–36 months |
| Two-person core team | 15–26 months |
| Five-to-seven-person focused team | 10–16 months |
| Eight-plus experienced specialists | 8–12 months |

## 21.3 Recommended planning number

For the complete browser release described here:

> **Plan by milestone gates, with a working budget of 10–16 months for a focused five-to-seven-person team.**

For a smaller AI-assisted core team, do not simply divide the schedule. The high-leverage model is to build generators, rigs, manifests, validation, and proof workflows that produce many assets consistently. The pace should be reforecast after the Phase 3 engine proof and Phase 5 creature-quality proof.

## 21.4 Suggested core roles

- Lead architecture/gameplay engineer
- Rendering/technical-art engineer
- UI/frontend/accessibility engineer
- Creature/environment production artist
- Rigger/animator or technical animator
- Sound designer/technical audio implementer
- Composer/adaptive-music designer, possibly combined on a smaller team
- QA/automation support, increasing near beta

---

# 22. Release and Milestone Gates

## Gate A — Baseline integrity

- Exact v1.8.9 archive
- Executable CI dependencies
- 50/50 legacy fingerprint
- 10,000 golden seeds
- Save/code/audio/visual fixtures
- Negative controls prove tests discriminate

## Gate B — Domain parity

- Zero DOM imports in domain packages
- No uncontrolled clock/randomness
- Raw/display rarity separation
- Multi-generation genome parity
- Combat and economy parity

## Gate C — Save safety

- Real current save imports successfully
- Original localStorage remains recoverable
- `size` round-trips unchanged
- `conq[].e` migration correct
- Corrupt primary restores from valid backup

## Gate D — Engine proof

- Universe → system → Earth → landing → return
- Phone and desktop input
- Correct rings and planet composition
- First interaction within approved budget
- No leaks across repeated travel

## Gate E — Creature-quality proof

- Stronger artwork than current proofs
- Breathing, blinking, locomotion, personality, environment response
- Correct anatomy across procedural combinations
- Earth and alien creatures both convincing
- Mobile performance acceptable

## Gate F — Universe-quality proof

- Galaxy, star, planet, moon, ring, biome, weather, and descent quality approved
- Fixed-seed screens pass art rubric
- LOD transitions do not reveal blotches, seams, or procedural repetition

## Gate G — Audio-quality proof

- Current voice identity preserved
- Human listening confirms appeal and distinction
- Music/ambience transitions work
- Background/mute/resume lifecycle works
- Phone speaker, headphones, and desktop mixes are acceptable

## Gate H — Feature-complete beta

- v1.8.9 feature parity
- 21-step training reachable
- Real action outcomes tested
- All save migrations tested
- No P0/P1 defects

## Gate I — Release

- Physical iOS/iPadOS/Android/desktop matrix
- Accessibility audit
- Performance and heat budgets
- PWA offline/update rollback
- Save export/recovery path
- Production monitoring and rollback plan

---

# 23. Known Decisions and Open Items to Resolve Before Production Lock

| Item | Current state | Required decision |
|---|---|---|
| Bred child inherits `fed` | Does not inherit; preview/card now honest | Keep or change as explicit balance decision |
| Ambience after tab return | Stops on hide and stays silent | Restart automatically or remain intentionally quiet |
| `legacy` voice family | Possible procedural family | Keep as distinct alien family or fallback only |
| Bat voice hard ceiling | Family can still clamp too often | Lower range or use soft saturation |
| Raw/display rarity | Dual 15-band internal / 10-name display | Preserve explicit conversion |
| Fingerprint repin permission | Available, unused for v1.8.9 | Spend only on approved generator change |
| Old HTML feature freeze | Prior hard freeze rejected | Freeze after Phase 4 UI parity, not before |
| Full 3D | Not the current target | Treat as future Unreal/native edition |
| Desktop training rail overlap | Known pre-existing layout backlog | Decide behavior before UI parity gate |
| Remaining old backlog | Several smaller combat/UI/render items documented in ROADMAP | Triage into fix-before-port vs inherit-and-fix |

---

# 24. Risks and Controls

## Risk 1 — Recreating the monolith in TypeScript
**Control:** Package boundaries, dependency rules, code-ownership checks, and bundle analysis.

## Risk 2 — Breaking the deterministic universe or share codes
**Control:** Existing 50 probes, 10k portable golden seeds, fixture retention, no silent repins.

## Risk 3 — Save migration damages the user's live expedition
**Control:** Read-only source import, transactional IndexedDB copy, verification before launch, preserved legacy key, export diagnostics.

## Risk 4 — Dual rarity layers are collapsed incorrectly
**Control:** Distinct types, explicit conversion, raw probability and display snapshot tests.

## Risk 5 — Gene drift is “sanitized” and honest bloodlines are rewritten
**Control:** Round-trip exact genome fixtures; never clamp `size`; sanitize unsafe shape, not legitimate evolved values.

## Risk 6 — Visual production begins before the rig/generator pipeline is proven
**Control:** Three creature masters and one complete biome before broad catalog production.

## Risk 7 — Procedural animation produces impossible anatomy
**Control:** Rig families, sockets, compatibility matrices, gait validation, fixed-seed failure galleries.

## Risk 8 — Earth catalog remains repetitive
**Control:** More rig families, signature overrides, small-thumbnail review, taxonomy-specific heads/limbs/behavior.

## Risk 9 — Mobile memory, battery, and heat
**Control:** Texture/actor/audio budgets, explicit destruction, quality tiers, resolution scaling, 30 FPS mode, real devices.

## Risk 10 — UI accessibility regresses during component rewrite
**Control:** Accessibility behavior is Phase 4 parity, not final polish; real-browser and assistive-tech checks.

## Risk 11 — A test passes for the wrong reason
**Control:** Mandatory broken-build or injected-defect negative control for each new high-value gate.

## Risk 12 — A screen paints but cannot respond
**Control:** Measure answerability and real pressed-action outcomes, not visibility alone.

## Risk 13 — Audio identity is discarded or the expansion is overbuilt before validation
**Control:** Port `voiceOf` first, run human listening, then size the authored/adaptive layer.

## Risk 14 — WebGPU becomes a requirement accidentally
**Control:** WebGL/WebGL2 acceptance gate; WebGPU is enhancement only.

## Risk 15 — The project pivots to 3D midway through the browser port
**Control:** Approve 2.5D release target; handle full 3D as a separately funded Unreal edition.

---

# 25. Future Unreal Migration Path

The PixiJS port does not prevent a later Unreal version.

## 25.1 Reusable in an Unreal edition

- Game design and system rules
- Stable IDs and catalogs
- World/genome/ecology specifications
- Rarity, combat, breeding, crafting, economy, and progression formulas
- Save DTOs and migration history
- Golden seeds and expected outputs
- Original high-resolution artwork and audio masters
- Creature concepts, rigs as references, animation-state definitions, behavior profiles
- Localization and accessibility copy

## 25.2 Rewritten for Unreal

- TypeScript source code into C++/Blueprint implementations
- Pixi rendering into Unreal scenes/materials
- HTML/CSS UI into Unreal UI
- IndexedDB into native/cloud save systems
- Browser input and PWA behavior
- Browser Web Audio playback/mixing
- 2D Spine creatures into new 3D models/rigs if the Unreal version becomes fully 3D

## 25.3 Portability safeguards now

- Maintain authoritative JSON/CSV/schema sources
- Preserve original layered art and uncompressed audio
- Export DataTable/DataRegistry-friendly content
- Keep save data free of renderer objects
- Maintain cross-language golden seed tests
- Version generator, render, and audio profiles separately
- Document every deliberate divergence from v1.8.9

The recommended product path is:

```text
Current v1.8.9 HTML game
        ↓
TypeScript + PixiJS premium browser edition
        ↓
Validated universe, audience, content, and gameplay
        ↓
Optional Unreal native/3D edition or sequel
```

---

# 26. Final Recommendation

Proceed with **Phase 0 immediately after the desired final external review/device checks**, using v1.8.9 as the formal migration baseline.

The most important updated conclusions are:

1. The stack remains correct: TypeScript + PixiJS 8 + skeletal animation + HTML/CSS UI + IndexedDB + Web Audio.
2. The current game is substantially larger and more complete than the code used for v3.1 of this report.
3. v1.7 and v1.8 systems—Forge, gear, Charters, Ascent, training, mobile/accessibility behavior, procedural voices, outcome testing, play-time harvests, and save rules—must be ported, not postponed.
4. The internal raw 15-band rarity model and universal 10-name display model must remain distinct.
5. The v1.8.9 save, current iPhone expedition, share codes, lineages, `COSMIC_EPOCH`, and size semantics are critical migration contracts.
6. Do not hard-freeze the old game before the port can reproduce the validated UI shell; freeze after Phase 4 parity.
7. Build by milestone gates. The creature and universe quality proofs should decide production scale before the full catalog is rebuilt.
8. Preserve current deterministic audio identity, but validate it with human listeners before funding the complete audio vision.
9. Keep all content and rules engine-independent so Unreal remains a viable future native/3D path.

The desired result remains:

> **A premium living universe that launches instantly in a browser: galaxies and planets that feel continuous and alive, biomes that behave like ecosystems, Earth and alien species that look dramatically better and animate with memorable personality, and a complete audiovisual progression experience that preserves the deterministic world players already own.**

This document is the current master specification for that port.

---

# 27. Source Basis for This Revision

This revision was grounded in the uploaded v1.8.9 repository, including:

- `celestial-frontier.html`
- `README.md`
- `ROADMAP.md`
- `PROCESS_LAWS.md`
- `AUDIO.md`
- `SAVE_SYSTEM.md`
- `DETERMINISM.md`
- `SPECIES_AND_GENOME.md`
- `ART_DIRECTION.md`
- `UI_PRESENTATION.md`
- `MATERIALS_AND_GEAR.md`
- `ECONOMY_LOOT_CRAFTING.md`
- `QUESTS_AND_CHAPTERS.md`
- `BREEDING_AND_SHARING.md`
- `COMBAT_AND_CONQUEST.md`
- `celestial-frontier-codebase-reference.md`
- The repository's current verification tools, audit bundles, proof sheets, screenshots, and release notes

The previous full visual, creature, universe, biome, mobile, and audio-production vision is retained in Sections 7–15 and updated where the current code has already advanced beyond the prior audit.
