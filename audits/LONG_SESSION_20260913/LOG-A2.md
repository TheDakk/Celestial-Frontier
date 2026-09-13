# A2 — Seeded emitter and effects sequencer on Pixi 8

Claude lane, 2026-09-13, branch `anthropic/mac` (worktree). No git write performed; Nick commits after review.
Consumes `cf.effect-sequence-anchors/v1` (`audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json`).

## What was built

| File | Purpose |
|---|---|
| `port/v2/apps/game/src/effects/anchors.ts` | Parse/validate the anchors contract (schema, sequenceId, theme, phaseOrder = launch, travel+, impact, canvas, per-phase origin/contact anchors in [0,1], alpha bounds inside the canvas, image and keyedImage names, distinct images). Refuses with a named reason, never throws for bad input. `placeEffectSequence` maps phases into arena space: launch at the attacker origin, travel interpolated origin→contact, impact at the target contact on the ground line (0.78 default); scale = stand distance / sequence span, clamped to [0.2, 1.25] and flagged when capped; `flipX` when the attacker stands to the right. |
| `port/v2/apps/game/src/effects/emitter.ts` | Pure seeded particle simulation. `createEmitterState(config, seed)`, `stepEmitter(state, dtMs, origin)` returns a fresh frozen state; input never mutated. All draws come from `mulberry32(hashInt(seed, stepIndex, phaseIndex))` from `@cf/domain-rand`, so the step is a function of its arguments only. Config: maxParticles (clamped to 200), rate, burst, durationMs, life, speed, direction/spread, gravity, drag, size, alpha curve (linear / ease-out / flash). Presets: launch burst (40), travel trail (60), impact scatter (100) — the three caps sum to the Motion Kit §8 budget of 200 so one sequence never exceeds one emitter's worth. |
| `port/v2/apps/game/src/effects/sequencer.ts` | `buildEffectSchedule(anchors, timing, placement)` with Motion Kit §5 numbers: melee anticipation 140 (launch at the attacker) → strike 90 (travel window) → impact; cast rise 180 + hold 120 (launch) → release 90 (travel) → impact. All scaled by the attacker mass class clamped to [0.6, 2.0]; hitstop 70 × mass, cap 140; impact aligned to the hitstop frame; impact holds through hitstop then fades over the 120 ms flash fade. `sampleSchedule(schedule, ms)` → phase, emitter phase, lead transform {x, y, scale, rotation, alpha, flipX} plus every track's transform (launch fades while travel runs). |
| `port/v2/apps/game/src/effects/pixi-adapter.ts` | `EffectSequencePlayer`: one sprite per phase texture (anchor from the placement) and one particle pool in a `ParticleContainer`, driven by an injected clock; steps the emitters at a fixed 60 Hz cadence so the same clock series replays identically. pixi.js 8.19.0 does export `ParticleContainer`, `Particle` and `Sprite` (`lib/scene/index.d.ts` lines 110–112); the adapter types them structurally and `createPixiEffectHost(pixi)` binds the real classes at the wiring site, so the module and its tests never import pixi.js (the root strict tsconfig lacks the app's `skipLibCheck` for pixi's bundled GPU types). |
| `port/v2/apps/game/src/effects/index.ts` | Exports. |
| `port/v2/tools/effects-proof/sequence-sheet.mjs`, `resolve-ts-hook.mjs` | Evidence script: loads the Wild anchors, places at stand distance 0.40 (attacker 0.30, target 0.70 on the ground line), melee at mass 1.00, samples 12 frames, runs the emitters exactly as the adapter does, writes an SVG sheet (keyed phase images linked, alpha-bounds rectangles, origin circle / contact square, particle dots) and the sampled frames JSON. The hook maps the sources' `./x.js` sibling imports to `.ts` for Node's native type stripping. |

## Tests — `port/v2/tests/effects-*.test.ts` (4 files, 21 tests, all green)

- `effects-anchors.test.ts` (6): accepts the committed Wild anchors and an extra travel frame; 15 named refusals (wrong schema, missing phase, bad order, anchor out of range, bounds outside canvas, zero bounds, missing keyedImage, duplicate images, bad canvas, bad theme, non-object); placement maps launch/impact/travel; scale 0.4/0.6 and both caps; flip and custom ground line; refusals for coincident or out-of-range stands.
- `effects-emitter.test.ts` (6): byte-identical replay over 600 steps (JSON and deep-equal) and a differing seed; no input mutation, frozen fresh arrays; negative control — `Date.now`, `performance.now`, `Math.random` spied and never called; 200 cap held under a greedy config and clamped; presets behave as burst / trail / scatter and sum to 200; malformed configs refused.
- `effects-sequencer.test.ts` (6): melee and cast ordering with the §5 numbers; mass scaling, clamp, hitstop cap; foreign placement refused; continuity — launch at the attacker, travel midpoint at 0.5, travel→impact position continuous within 1e-5, impact at the target contact on 0.78, alpha 1 through hitstop then half-faded at +60 ms, per-ms x continuity across the whole duration; clock negative control and identical rebuild.
- `effects-adapter.test.ts` (3): structural binding of Sprite / Particle / ParticleContainer with anchors and pixel positions, clock spies never called; sequence-wide live particles ≤ 200 for the whole run, container drains to zero at `done`, impact particles stay in the arena; byte-identical replay under the same seed and clock series, seed sensitivity, texture-count refusal.

## Gates

- `cd port/v2 && npm run typecheck` — pass (root strict, app, worker).
- `npx vitest run tests/effects-` — 4 files, 21 tests pass.
- `node tools/validate.js` at repo root — PASS, fingerprint match (50 probes identical to the v1.0 baseline).

## Evidence

- `audits/LONG_SESSION_20260913/a2-sequence-sheet/wild-sequence-sheet.svg` — 12-frame sheet (links the keyed masters by relative path; open from disk).
- `audits/LONG_SESSION_20260913/a2-sequence-sheet/wild-sequence-sheet.png` — the same sheet rasterised with Inkscape (1340 px wide) for review without a browser.
- `audits/LONG_SESSION_20260913/a2-sequence-sheet/wild-sequence-frames.json` — placement, schedule and the 12 sampled frames with particle states (seed 5259749 = 0x50A1E5).
- Two consecutive script runs produced identical SHA-256 for the SVG and the JSON (replay evidence outside the test runner).

Reading the sheet: frames 1–4 launch grows at the attacker mark (0.30); 5–7 the travel sweep slides origin→contact with its trail; 8–11 impact lands with its contact anchor on the target mark at the ground line, the scatter arcs and settles under gravity; 12 is `after` with only the decaying scatter. Peak particle count on the sheet is 153 (cap 200).

## Not done / open for review

- Not wired into `main.ts` or the battle scene (A3 owns the adapter file and single import per the work order). No GSAP; none needed.
- Travel interpretation: the travel sprite's origin anchor slides from the attacker to the target over the strike window, so at scale 0.67 its far side leaves the frame mid-travel (frames 6–7). The alternative — hold the sweep spanning both stands and reveal it by alpha — is a one-line change in `placeEffectSequence`; Nick's call on the capture.
- The anchors JSON's own `qualityAccepted: false` and `layoutDeviation` note are carried as-is; the contract parser does not gate on them.
- The three phase caps (40/60/100) are a first balance for the Wild sequence; the kit budget is asserted, the look is not.
- `port/v2/apps/game/src/motion/` was already untracked in this worktree (A1 lane, not touched here).
