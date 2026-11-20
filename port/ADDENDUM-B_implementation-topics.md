# Addendum B — Detailed code upgrade recommendations

**Restores v3.1 §17. Slots into v4.0 as §17.1–§17.11, ahead of the existing code-to-port matrix (which becomes §17.12).**

v4.0's §17 is a 24-row per-module matrix — preserve / rewrite / required parity evidence. It is denser and better organised than v3.1's §17 and it should stay. But it answers *what*, and v3.1's §17 answered *how*. Eleven implementation topics went with it; three have no equivalent anywhere in v4.0, and one of those is security.

Restored below, updated to v1.8.9 where the original referenced v1.6.4.

---

## §17.1 Convert the conceptual modules into actual TypeScript files

The fourteen deterministic domain modules are the first extraction target. Recommended order — dependency-first, so each module compiles against only what precedes it:

```
1. Rand              8.  Genome
2. WorldConfig       9.  Genetics
3. PlanetGen        10.  Ecology
4. Naming           11.  SurveyPhrases
5. StarCatalog      12.  Descriptors
6. WorldGen         13.  CombatCore
7. SpeciesTraits    14.  EncUtil (share codes)
```

Each module must have:

- Explicit input and output types
- **No DOM imports**
- **No UI-state imports**
- **No real-time clock dependency unless passed as an argument**
- Golden-seed tests

The third and fourth bullets are the ones v4.0 Gate B enforces ("zero DOM imports in domain packages, no uncontrolled clock/randomness"). The clock rule is worth restating in the strong form: a domain function that needs the time takes it as a parameter. Rounds 7–9 produced three exploits built on time, and every one of them was a rules function reading a clock it did not own.

## §17.2 Preserve current fingerprints before changing behaviour

A permanent parity fixture covering: galaxy generation · star systems · planet parameters · biospheres · creature genomes · Earth species mapping · descriptors · breeding · combat · rarity · **mining and crafting outcomes** · share-code round trips.

> The first port milestone is not prettier graphics. It is producing the same deterministic results from TypeScript.

v4.0 §16.2 raises the bar to 10,000 golden-seed cases in a portable fixture, which supersedes this. What §17.2 adds is the *list of surfaces* the fixture must cover — mining and crafting outcomes in particular are easy to omit because they feel like economy rather than generation.

## §17.3 Replace the manual renderer with a scene graph

```
UniverseScene        BiomeScene
GalaxyScene          CreatureEncounterScene
SystemScene          MicroscopeScene
DescentScene         CodexPreviewScene
```

Each scene owns its camera, render layers, asset lifecycle, input mapping, level of detail, performance profile, and transition in/out.

**Addition since v3.1:** the fleet measures **fps median 25–29 with p10 at 12–14** on the current build in deep sessions with panels open. The tenth percentile is the number each scene's performance profile should be written against — the median has never been the problem.

## §17.4 Convert current art resolvers into phenotype data

`_earthArt` · `hdGenesFor` · `_procFamily` · `hdBeastBare` · `_earthFlora` · `_floraSpx` · the biome dress and vista functions.

These contain significant design intelligence and should decompose into: taxonomy data · phenotype resolvers · rig selection · proportion values · material selection · marking masks · animation selection · environment placement.

**Addition since v3.1:** the rig taxonomy is now proven in production and shared by two systems — `_VOICE`'s 18 archetypes map onto `_earthArt`'s recipes, and both the renderer and `voiceOf` index the same families. That taxonomy is the correct authoring list for §17.4 and for the Spine rig families, and it should be extracted once and consumed by both.

## §17.5 Add worker-based background generation

Move expensive pure generation off the main thread: nearby universe cells · star-system manifests · biosphere rosters · search indexing · Codex sorting and filtering · optional procedural texture preparation. The main thread focuses on input, UI and rendering.

v4.0 mentions workers in seven places, all one-liners. This is the list of what actually goes in them.

## §17.6 Replace encoded-image caches

**No equivalent in v4.0** — zero mentions of image cache or texture cache.

Do not create large base64 portrait libraries. Use: shared texture atlases · GPU render textures · render-on-demand previews · disposable textures · explicit cache budgets · **LRU with GPU destruction** · lower-resolution mobile assets.

This matters more now than it did at v1.6.4. The current build already carries a bounded thumbnail LRU and strips regenerable thumbnails from the save (v4.0 §3.7), which is the right behaviour for data URLs — but the Pixi port replaces data URLs with GPU textures, and a JavaScript-side LRU that evicts a reference without calling `destroy()` leaks VRAM rather than heap. The eviction path has to release the GPU resource, and the budget has to be expressed in texture memory, not entry count.

## §17.7 Use event commands rather than shared mutable reach-through

```
UI action → Command → Domain/application service → State update → Render/UI subscriptions
```

Commands: `TameCreature` · `FightCreature` · `MineWorld` · `BreedCreatures` · `EquipItem` · `LandOnPlanet` · `ClaimDiscovery`.

v4.0 §6.4 identifies the reach-through problem and names the remedy in one line. This is the shape of it. Two properties worth naming as requirements, both earned in testing: a command is the natural place to record the **`SessionRNG` draw** that decided its outcome, which is what makes a session replayable; and a command boundary is where an **outcome assertion** attaches, which is what v4.0 §4.4 asks for.

## §17.8 Do not force a full ECS everywhere

**No equivalent in v4.0** — zero mentions of ECS.

A complete entity-component system is useful inside active biome scenes and unnecessary for every menu and deterministic function. Recommended: **pure modules for generation and rules · state machines for scene flow · lightweight components and entities for active organisms and effects · DOM components for menus.**

v4.0 §4.8 warns against recreating the monolith in TypeScript. This is the counterweight to the opposite failure — dissolving deterministic pure functions into an entity graph, which makes them harder to fingerprint and harder to run in a worker, for no benefit.

## §17.9 Save migration

```ts
interface SaveEnvelope {
  schemaVersion: number;
  gameVersion: string;
  createdAt: number;
  updatedAt: number;
  checksum: string;
  payload: PlayerSave;
}
```

Plus: automatic backup before migration · recovery from the previous snapshot · import of the current `cfcc_save_v2` · corrupt-field isolation · size limits · validation before activation.

v4.0 §19 and Gate C cover this well and supersede it. Two items from the original are not in §19 and should be: the **checksum** field, and **corrupt-field isolation** — Gate C tests that a corrupt primary restores from backup, but a save with one bad field should degrade to one lost field, not to a restore.

## §17.10 Security and DOM safety

**No equivalent anywhere in v4.0** — zero mentions of `innerHTML`, XSS or CSP. The nine "sanitization" references are all about save and share-code *data* validation, which is a different concern.

The original said:

> The current code contains many string-rendered UI paths. The new component system should default to text-safe rendering and avoid concatenating stored content into HTML.

Measured against v1.8.6 `0bfc904`, the current surface is:

| | count |
|---|---:|
| `.innerHTML =` assignments | **95** |
| `insertAdjacentHTML` | 2 |
| `esc()` calls | 32 |
| `cleanName()` calls | 13 |
| `.textContent =` writes | 108 |

The existing defences are real and well built. `esc()` escapes the five HTML metacharacters; `cleanName()` strips `<>&"'` and caps length, and its comment states the intent exactly — *"every name that ever reaches innerHTML funnels through this — including names arriving inside pasted CF1/CFB codes, which are untrusted input."*

The risk is not that the current code is broken. It is that **95 string-rendered paths defended by 32 escape calls is a ratio that depends on every author remembering**, and the port rewrites every one of those paths. Requirements:

1. **Text-safe by default.** In Lit, interpolation escapes automatically and `unsafeHTML` is the explicit opt-out. In React, the same is true of `dangerouslySetInnerHTML`. Choose a framework whose default is safe and make the opt-out greppable — the port's advantage here is that the dangerous path becomes a search term instead of an absence.
2. **One boundary, not thirteen.** Untrusted input enters at exactly three places — pasted share codes (`decodeCreature`, `atob`), player-entered names, and loaded save data. Validate and normalise at those three boundaries (which is where v4.0 §16.5's Zod validation already sits) and treat everything downstream as trusted.
3. **A Content-Security-Policy header.** Not present today and not mentioned in v4.0. A single-file game with inline script cannot have a strict CSP; a Vite build can. `script-src 'self'` plus no `unsafe-inline` converts a whole class of defect into a load error, and it is close to free once the bundle is external.
4. **A test.** A share code containing `<img src=x onerror=...>` in the creature-name field must round-trip as inert text. One Vitest case at the decode boundary and one Playwright case at the render boundary.

## §17.11 Continuous integration

Every production merge runs: type check · unit tests · golden-seed tests · save migration tests · browser smoke tests · desktop and mobile screenshots · visual-regression comparison · performance budgets · **build-size budgets**.

v4.0 references CI 126 times and §22's gates are more thorough than this list, so it is superseded — except for build-size budgets, which §6.1 asks for and no gate enforces. The number to hold is **668 KB gzipped**, the whole current game including procedural audio.
