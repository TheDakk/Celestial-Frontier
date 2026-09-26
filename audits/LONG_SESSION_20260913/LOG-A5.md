# LOG-A5 — world-life layer for landfalls and arenas

Package A5 per WORK_ORDER.md. Built 2026-09-13 on `anthropic/mac` (uncommitted at time of writing; Nick commits after review). No git write, no `main.ts` or `package.json` change.

## What was built

MOTION_KIT §7 "LANDFALL world life" / "ARENA plate life at reduced density", seeded from the recipe so a landing replays identically.

- `port/v2/apps/game/src/worldlife/spec.ts` — `compileWorldLife(card | WorldLifeCardV1, seed, 'landfall' | 'arena', { tier })` → `WorldLifeSpecV1` (`cf.worldlife.spec/v1`). `parseWorldLifeCard` reads the compiled system card's two-space `Light:` / `Atmosphere:` lines (same anchors as Codex's `kit-weather-math.mjs`, so the deeper-indented star `Light:` line is ignored). Layers: precipitation (kind from vista weather rain/snow/dust/ash; haze/null → none; base densities .0018/.0013/.0015/.0011 per px² shared with the kit compositor, × strength factor still .5 / mild 1 / wind 1.35 / storm 1.8, × arena 0.6, × streak scale .35, capped 400 desktop / 200 phone with `overBudget` recorded); mist/dust drift (count by atmosphere, side speed by strength, dust/ash colour); water shimmer (liquid only; ripple .35/.55/.9/1.3 Hz by strength); foliage sway (amplitude .2/.5/1.0/1.4 by strength, three bands seeded inside the strength's frequency band, only when the biome has flora); fliers (0..3 seeded; bird for bird families, swimmer for marine/fish families with liquid water); luminous flicker (fungal/milksea/geode or a `luminous` flag; 6 lights landfall, 4 arena). Weather strength derives from the biome profile weather word (`@cf/domain-biome-profile`) with a floor from the vista weather (dust ≥ wind, rain/snow/ash ≥ mild); an unmapped word refuses. Named refusals: `card-ambiguous`, `weather-unknown`, `water-unknown`, `time-of-day-unknown`, `biome-unknown`, `profile-weather-unmapped`, `strength-unknown`, `seed-invalid`, `surface-unknown`, `tier-unknown`.
- `worldlife/sampler.ts` — `sampleWorldLife(spec, ms, { reducedMotion })`: pure function of (spec, ms); wrapping streak field, drift offsets, shimmer phases, sway angle per band (≤ .06 rad × amplitude), flier positions on seeded paths, flicker intensity. Reduced motion samples at t=0. Refuses non-finite/negative time (`time-invalid`).
- `worldlife/pixi-adapter.ts` — `WorldLifePixiAdapter` with an injected clock and a structural Pixi 8 factory (`container()`, `graphics()`, optional `sprite(kind)`), so the module has no `pixi.js` import and typechecks under the root config. Streaks on one Graphics, drift as translated alpha nodes, shimmer polylines, flier dots, flicker fills, sway as rotation added to attached foliage's base rotation. `setReducedMotion(true)` freezes at t=0 with the same layers and counts; `dispose()` restores foliage rotations, removes and destroys every node, and refuses further use.
- `worldlife/index.ts` — exports.
- `port/v2/tools/worldlife-proof/life-sheet.mjs` — Node script (native type stripping plus a scoped `.js`→`.ts` resolve hook) that compiles the Earth temperate rain card at the arena-recipe seed 593405465 and writes an 8-frame SVG sheet (frames every 400 ms, 1024×576, ground line .78) plus a JSON receipt with per-frame and replay digests.

## Tests (29, all green)

- `port/v2/tests/worldlife-spec.test.ts` (12): Earth card parse; refusals by name (card, weather, water, biome, time of day, seed, surface); weather mapping table rain/snow/dust/ash/haze/null → kinds and densities; arena reduction .6 for precipitation and drift; sway amplitude .2/.5/1.0/1.4 and storm frequency band; water none/frozen → no shimmer, no swimmers; fliers only for bird/marine/fish biomes, count 0..3 varies with seed; flicker biomes and flag; streak cap 400/200 with `overBudget` recorded; same-seed byte-identical, different seed differs.
- `port/v2/tests/worldlife-sampler.test.ts` (8): byte-identical replay across 300 samples; different seeds differ; clock negative control (spies on `Date.now` and `performance.now` see zero calls, then a real call proves the spy is live); `time-invalid` refusal; streak field bounds and motion; sway bound per band across 20 s; water none → null shimmer, empty fliers, flicker in [.55, 1]; reduced motion equals the t=0 state for any ms with a no-flag negative control.
- `port/v2/tests/worldlife-adapter.test.ts` (5): every layer drawn from the injected clock and redrawn as it advances; reduced motion freezes at the exact t=0 drawing and resumes when cleared; foliage sway by band with base restored on detach/dispose; sprites used when the factory offers them; dispose destroys all nodes and refuses use.

## Gates

`cd port/v2 && npm run typecheck` clean (all three projects). `npx vitest run tests/worldlife-` 3 files / 29 tests passed. Root `node tools/validate.js`: PASS, fingerprint match (50 probes identical to v1.0 baseline). Total new lines 795 (modules 361, tests 302, tool 92).

## Evidence

- `audits/LONG_SESSION_20260913/a5-life-sheet/life-sheet-landfall.svg` (+ `.png` render) and `life-sheet-landfall.json` — replay digest `2c1562a15259b8a6…`; 372 streaks (under cap), 8 drift blobs, 3 sway bands, 1 bird, 3 shimmer bands. A second run reproduced the same digest.
- `audits/LONG_SESSION_20260913/a5-life-sheet/life-sheet-arena.svg` / `.json` — arena at 0.6 density: 223 streaks, 5 drift blobs; digest `b119493da9048a58…`.

## Not done

- No `main.ts` wiring or live capture on the accepted landfall painting; the acceptance capture waits for the shared-contract wiring step (an adapter file plus one import, announced in the commit message). The sheet is synthetic evidence over the ground line, not the accepted plate.
- Drift blobs and fliers draw as Graphics circles unless the wiring supplies textured sprites through `factory.sprite`.
- Resident-life family templates (breathe, weight shift, flick, head turn) are A1 territory, not this layer.
- The `phone` tier is a compile flag; nothing detects the device here.
- MOTION_KIT.md "matches code as of" marker is A6.
