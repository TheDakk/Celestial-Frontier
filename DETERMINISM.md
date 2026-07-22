# Celestial Frontier — Determinism Discipline

**STATUS:** matches code as of 2026-07-20 (verified against main.js + tools/).
**Purpose:** the single law that governs the whole game — every world, genome, descriptor, portrait, duel and share code is a pure function of seeds, so the same address regenerates byte-for-byte on every device, forever, with no server.
**Source of truth:** this doc is the DESIGN spec; main.js + tools/ implement it.

## 1. Overview
There is one shared universe and it is never stored — it is *math*. A galaxy, star,
planet, its life, and a creature's stats are all recomputed on demand from integer
seeds. Two players who hold the same CF1 share code see the identical world because
both machines run the same seeded functions with no hidden entropy. This is the top
"Hard rule" in CLAUDE.md (rule 1) and the reason the fingerprint battery exists.

Determinism is enforced at three levels:
1. **Coding discipline** — no `Math.random()` / `Date.now()` in any generation path.
2. **A static guard** — `tools/checks.js` greps the domain modules for those calls.
3. **A behavioral fingerprint** — 50 probes over the deterministic core, compared
   byte-for-byte against a baseline captured from the pristine v1.0 file.

## 2. Rules & mechanics

### The seeded-RNG primitives (module `Rand [domain]`, main.js 136–178)
- **`mulberry32(a)`** (line 143) — a 32-bit PRNG; returns a closure that yields the
  next float in `[0,1)`. `a|=0` folds any seed to int32. This is the ONLY randomness
  source in the domain layer.
- **`hashInt(seed,x,y)`** (144–150) — integer avalanche hash (`Math.imul` mixing of
  374761393 / 668265263 / 2246822519), returns a `>>>0` uint32. Turns a
  (seed, cell-x, cell-y) triple into a well-distributed seed.
- **`cellRng(seed,x,y)`** (151) — `mulberry32(hashInt(seed,x,y))`: the canonical way
  to get a per-cell stream. Cell-based, on-demand generation (`WorldGen`) is built on
  this — no global state, so any cell can be generated in isolation and match.
- **`makeNoise(seed)`** (154–174) — value-noise fBm built on a `mulberry32(seed)`
  Fisher–Yates shuffle of a 256 permutation table; used for surfaces/backdrops.
- `Rand` also exports `clamp`, `mix`, `TAU`. `Deps: none` — it is the root module.

### The hard rule: NO `Math.random` / `Date.now` in domain modules
The script is split into `@module <name> [domain]` blocks (pure/deterministic) and
`@module <name> [app]` blocks (art/service/UI, allowed wall-clock + platform state).
The domain chain is **Rand → PlanetGen → Naming → WorldConfig → StarCatalog →
WorldGen → SurveyPhrases → SpeciesTraits → Genome → EncUtil → Genetics → Ecology →
Descriptors → CombatCore**. None of these may call `Math.random()` or `Date.now()`;
doing so would make generation observer-dependent and break share-code / cross-device
parity. `tools/checks.js` (§4 of it) walks lines between a `@module … [domain]` banner
and the next `@end`, and fails on any `Math.random(`/`Date.now(` inside. App modules
(ThumbArt, GalaxyArt, SpeciesArt, Fx, SaveSystem, Renderer, all UI sections) may use
wall-clock freely because their output never feeds generation.

### The FINGERPRINT (50 probes; originally 49)
`tools/probe.js` runs as a classic script inside the game's realm and calls the real
domain functions, JSON-serializing each result into `window.__FINGERPRINT__`. Every
probe is exception-wrapped so identical *failures* also compare equal. Coverage: PRNG
core, naming, planet/world-gen, descriptors, genome/species, combat, codecs,
progression tables, and the constants block. The suite grew from **49 to 50** probes
over the project's life (the current `speciesPortrait` probe was re-aimed at the
`hdGenesFor` visual-gene contract when HD-always-on made the old dataURL probe vacuous
under jsdom's `toDataURL` stub). Most re-pin notes still say "all 49 other probes
byte-identical" — that phrasing counts the *other* probes beside the one being changed.

Pipeline:
- **`tools/probe-names.json`** — 187 names the probe needs visible at IIFE top scope.
- **`tools/make-probe-build.js`** — injects `window.__PROBE_HOOK__` (live getters,
  not a snapshot, so post-boot `let`s like `sfxVol` read current) right before the
  game IIFE's closing `\n})();\n</script>`, producing `tools/probe-build.html`.
- **`tools/harness.js`** — boots the probe build in jsdom with a fake 2D canvas
  (`tools/fake2d.js`) and `pretendToBeVisual`, requires **zero boot errors**, injects
  `probe.js`, then writes the fingerprint (default out `tools/current.json`).
- **`tools/baseline.json`** — the reference fingerprint, captured from the pristine
  `original/celestial-frontier-v1.0.html`. `tools/validate.js` compares every key of
  `current.json.fingerprint` against `baseline.json.fingerprint`; any mismatch prints
  the diverging slice and exits non-zero. **Never regenerate the baseline to make a
  failure pass** — a mismatch means observable behavior changed.

**v1.6 battery gates added to `validate.js` (2026-07-20):**
- **`tools/rig-audit.js`** — class→rig binding gate: runs `_earthArt` over all 631 fauna, every name must classify, and a curated sentinel table (139) must resolve to the expected rig. FAILS on a wrong-class keyword collision.
- **`tools/coloratlas-check.js`** — the `COLOR_ATLAS` color path must be **pure + deterministic** (no RNG/Date; same physical props → same palette; valid hex).
- **`tools/biomeprofile-check.js`** — every live `BIOME_SETS` biome must have a `BIOME_PROFILES` entry; sigs hex; fauna/flora families reference real rig/form keys.
- **`tools/render-audit.js`** — renders **all 1010 Earth species** (fauna + flora, incl. every new rig/shape) via `speciesPortrait` in jsdom+fake2d; catches throws the fingerprint misses.

> **What the fingerprint actually pins (important for art work):** the `speciesPortrait`
> probe captures **`hdGenesFor(g)`** — the merged *visual-gene contract* — NOT the drawn
> pixels (jsdom's `toDataURL` is a stub, so pixel fingerprints were vacuous; the probe was
> re-aimed at the genes, see re-pin log below). CONSEQUENCE: changing the **drawing** layer
> (`hdBeastBare`, `_hdPlantBare`, the rig fns, vista painters) is **render-only →
> fingerprint-safe**, even for procedural species. A re-pin is required ONLY when a change
> alters `hdGenesFor`'s output (new/changed visual-gene fields) or upstream generation.
> The `P.hue` color audit (render-only, see ART_DIRECTION) is the same principle for planet color.

### The re-pin protocol (single-key only)
When a change *intentionally* alters generated output, the baseline is re-pinned under
strict rules: (a) exactly **one probe key** may change; (b) prove every other probe is
**byte-identical** first (per-probe diff); (c) leave an **inline note** — as a sibling
`note_<probe>_repin_<ver>` key in `baseline.json` AND a code comment; (d) cite **Nick's
authorization**. Wholesale regeneration is banned. Documented re-pins in `baseline.json`
(all Nick-authorized):
- `note_speciesPortrait_repin` / `_v135` — probe re-aimed at `hdGenesFor`; later an
  additive-fields-only HD coherence pass.
- `note_saveKey_repin_v15` — SAVE_KEY `cfcc_save_v1`→`cfcc_save_v2` (the constants
  probe tail only; the universe is untouched).
- `note_planetDescriptor_repin_v152c` / `_v152c_names` — Earth (seed 133) gains a real
  catchable roster + real Earth names (`planetDescriptor` only, Earth only).
- `note_sigs_repin_v152c_elements` — the 9 `SIGS` re-themed to elements (config probe
  only; internal ids unchanged so saves/relic refs survive).
- `note_planetDescriptor_repin_v16_bestiary` — `_EARTH_NAMES` roster expanded; reshuffles
  Earth's descriptor names only.

### GOTCHA — never write `\b` in a `node -e` JS string literal
Inside a `node -e "..."` string, `\b` is interpreted as the **backspace control char
(0x08)**, not a regex word boundary. A grep/regex built that way becomes a dead regex
that silently matches nothing. Build such regexes from a file, or use `\\b`, when
verifying determinism from the shell.

## 3. Key names & numbers (REAL values)
- **Probe count:** 50 (originally 49). `baseline.json.fingerprint` has 50 keys.
- **Hooked names:** `tools/probe-names.json` = **187** names.
- **Domain modules (guarded):** Rand, PlanetGen, Naming, WorldConfig, StarCatalog,
  WorldGen, SurveyPhrases, SpeciesTraits, Genome, EncUtil, Genetics, Ecology,
  Descriptors, CombatCore.
- **Anchor constants (the `constants` probe):** `UCELL`, `OBS_R`, `GR=1200` (galaxy
  radius — NOT the art cache), `SYS_R`, `HOME_GAL_SEED 999`, `HOME_POS {x:90,y:-60}`,
  `SOL_SEED 424242`, `PLAYER_SEED 0x50A1E5`, `HARVEST_CD 3600e3`, `SAVE_KEY
  'cfcc_save_v2'`. Earth seed `133`.
- **Save-adjacent caps that are NOT determinism:** DPR 3 desktop / 2 touch,
  notification cap 60, art cache cap 1,200 — see UI_PRESENTATION.md.

## 4. Data / save fields
Determinism owns no persistent save fields — the universe is regenerated, never
stored (see SAVE_SYSTEM.md; the save holds only the player's *progress*, keyed by
seed/id). The `constants` probe pins `SAVE_KEY`'s value, which is why bumping the save
key requires a documented single-key re-pin (`note_saveKey_repin_v15`).

## 5. Determinism (how this system interacts with the fingerprint)
This system IS the fingerprint. Any edit to a domain module must leave every probe
byte-identical, or be an authorized single-key re-pin. Practical guide:
- **Render-only / lookup-only** changes (e.g. a pure color-atlas lookup, portrait
  paint that reads existing genes) are fingerprint-safe → no re-pin.
- **Changes that seed generation** (touch a `mulberry32`/`hashInt`/`cellRng` stream,
  a descriptor's text, a genome dial) shift a probe → re-pin gate. Audit whether a new
  field (e.g. `P.hue`) is consumed by gen or only by render before assuming it's free.
- Additive genome fields gated behind a flag (e.g. `if(g.hurt)`) keep unhurt genomes
  byte-identical — the standard trick for evolving output without a re-pin.

## 6. Code anchors
- `Rand` module & primitives — main.js **136–178** (`mulberry32` 143, `hashInt`
  144–150, `cellRng` 151, `makeNoise` 154–174, `Object.freeze` export 175).
- Domain-module banners — `@module … [domain]` at 136, 181, 818, 839, 860, 914, 1299,
  1380, 1611, 1842, 1912, 1973, 2154, 10609 (each closed by `@end`).
- Constants — `WorldConfig [domain]` 839+ (`GR=1200` at 849); `SAVE_KEY='cfcc_save_v2'`
  at main.js 10012.
- Static guard — `tools/checks.js` (§4, the `[domain]`↔`@end` grep).
- Probe wiring — `tools/make-probe-build.js` (hook injection), `tools/harness.js` (jsdom
  boot), `tools/probe.js` (50 probes), `tools/probe-names.json` (187 names),
  `tools/baseline.json` (reference + `note_*` re-pin log), `tools/validate.js`
  (compare loop, lines 23–37).

### The verification battery
- **`tools/validate.js`** — the one-shot loop: `build.js` (main.js → html) → `checks.js`
  (node --check, CSS brace balance, duplicate ids, domain grep) → `make-probe-build.js`
  → `harness.js` → fingerprint compare vs baseline. Run after every batch of edits.
- **`tools/smoke.js`** — jsdom interaction suite: full Field Training, Guide, tooltips,
  release notes, rename, settings, veteran/skip paths.
- **`tools/systems-check.js`** — 19 end-to-end assertions on classes/levels, breeding
  inheritance, import hardening (`normGenome`), guardians, deterministic duels.
- **`tools/balance-sim.js`** — archetype fairness: every ability's overall win rate vs
  the field must sit in the 42–58% band (head-to-head counters allowed).
- **`tools/uilayout.js`** — the LAYOUT gate: drives real headless Edge over CDP across
  **9 viewports** (see UI_PRESENTATION.md).
- Supporting: `build.js`, `checks.js`, `make-probe-build.js`, `harness.js`, `probe.js`,
  `fake2d.js`, plus `rarity-sanity.js` / `simrun.js` sims.

## 7. Open questions / pending
- `ROADMAP.md` tracks a pending **procedural-art coherence** pass that WILL change the
  fingerprint and needs a Nick-authorized re-pin round (art IS the fingerprint); the
  color-atlas / biome-profile work ahead of it is designed to stay fingerprint-safe.
- The "49 vs 50" phrasing lives on in older `note_*` entries; the live suite is 50.
  No action needed — the notes are historical and count *other* probes.
