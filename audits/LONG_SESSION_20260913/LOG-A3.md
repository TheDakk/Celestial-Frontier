# A3 — Battle scene v2 (Claude lane) — 2026-09-13

Status: built and green on the mechanical gates; capture delivered for Nick's review. Not committed (Nick commits after review). No git write, no GitHub step, no `main.ts` / `combat-battle-scene.ts` / `package.json` / motion / effects / worldlife edit. Fixture rig until Codex's C2 lands.

## What was built — `port/v2/apps/game/src/battle2/` (739 lines incl. README)

| File | Owns |
|---|---|
| `arena.ts` | `composeArena` (plates cover the frame plus the overscan their parallax rate needs, ground lines aligned; stands at x = 1/3, 2/3 on the ground line), `parallaxOffset` (pure: −displacement × .10/.50/1.20), `combatantScale` (creature height 1/3 tiny → 1/2 titanic of frame height from rig bounds), `selectArena` (home-versus-visitor rule; wild → wild world, guardian → lair, duel → host first then alternating; seeded pick with `mulberry32`; returns a recipe id only). |
| `fixture-rig.ts` | `CreatureRigV1` (CONTRACTS §2 verbatim) + `BattleRigV1` (adds `kind`, `label`, `cutout`, `foot`, `bodyLength`). `cutFixtureParts(alpha, w, h, record)` is pure: nearest-bone-segment (Voronoi) assignment of every painted pixel, grouped into 19 parts (head group incl. jaw+ears, neck, torso incl. shoulder/hip bones, 4 × leg upper/lower/paw, tail0..3) each with a box + mask, pivot = parent joint landmark, layer far/near from the record's depth layers. `solvePose` = forward kinematics in GRAPH order. `createFixtureRig` binds parts to sprites through a structural factory (the page builds one masked canvas per part). Label: `fixture rig (landmark-derived parts)`. |
| `fallback.ts` | `createPortraitRig` (one sprite, foot pivot) and `portraitClip` — root dx/dy/rotation taken from the action library's own root tracks with the §5 phase durations, so a portrait's beats land on the same ms as a rigged combatant. Label: `whole-portrait fallback (no landmark record; hit pose approximated by root offsets)`. |
| `choreography.ts` | `buildTurnPlan` → absolute ms for ready (bar, ease-out on last 10 %), command (cursor blink 250, confirm at `commandEnd`), approach (min(500, 420 × mass), ease-out run-up), action, impact (= effect `impactAt` = anticipation+strike or rise+hold+release), hitstop (70 × attacker mass, cap 140; both frozen), flash (2 frames white + 120 fade), shake (6 px × mass, (1−u)² decay over 180), damage number (pop 90 back-out, rise 420, fade last 160), reaction (hit after hitstop / dodge leading the impact by 120 × mass / faint held), return (min(500, 380 × mass)), idle tail. `sampleTurn(plan, ms)` → poses, displacement, effect sample, camera, numbers, parallax. Idle runs additively under every one-shot clip with its clock frozen through hitstop, so every boundary is continuous. Melee themes hold the sweep across both stands and reveal by alpha; cast themes slide origin → contact. Run-up stops at contact when the arena carries the combatants' half-widths (15 %..55 % of the stand distance). A rigged combatant's mass is its body card's (A1 timelines scale by it). Reduced motion: ready pose, no shake/flash/effect, static number. |
| `stage.ts` | `BattleStage`: structural Pixi 8 (far, mid, world life, two rig holders, effects container, near, flash, timing bar, cursor, number); injected clock; effect player armed to fire exactly at `plan.effect.startMs`; `dispose()` total. `turnPlanInputFromTranscriptEvent`: `SettledDuelTranscriptV1.log` entry → `TurnPlanInput` (damage/dodge → turn; stun/tick → skip with reason; A left, B right; theme → delivery; faint from the target's hp). |
| `index.ts`, `README.md` | Exports; the flag-gated `main.ts` wiring NOT done here (one adapter file + one import, A6/Codex) and the A3 defaults for Nick (melee themes wild/stone/sand; run-up 55 %; number lift/rise; cursor blink; idle tail). |

## Tests — `port/v2/tests/battle2-*.test.ts` (4 files, 25 tests, 381 lines, all green)

- `battle2-arena.test.ts` (5): stands, plate overscan and ground alignment, parallax rates/sign, combatant scale 1/3..1/2 at mass 0.7/1.0/1.6 and refusals, home-versus-visitor deterministic and alternating for duels, clock/Math.random negative control (spies throw; the control is proven to bite).
- `battle2-rig.test.ts` (5): 19 parts cover every GRAPH bone exactly once; a synthetic alpha painted along the civet's bones is covered by the part masks exactly once (per-pixel coverage count) with every pivot equal to its parent joint landmark; FK order equals GRAPH order and a spine rotation carries chest/neck/head/forelegs but not pelvis/hind legs/tail; sprite binding (pivot px, anchor, far-then-near order, hierarchy through `applyPose`, dispose refuses use); clock negative control on cut + pose.
- `battle2-choreography.test.ts` (10): beat ordering and absolute times for mass 0.7/1.0/1.6 (hitstop 49/70/112); impact = effect `impactAt` = `hitstopAt`; rigged attacker takes the card's mass and its impact equals the timeline's own anticipation+strike; cast/dodge/miss/faint/victory; contact-aware run-up; determinism + clock negative control on plan and sample; timing bar ease-out and cursor window; run-up/freeze/flash/shake/number/effect reveal/held sweep; continuity at every boundary and every ms (< 0.15 rad/ms) with a negative control (a clip not starting at rest exceeds 2× the bound); reduced motion returns the ready pose, no shake, no flash, no effect.
- `battle2-stage.test.ts` (4): fallback used and labelled when the template has no library / no record; outcome adapter over real transcript row shapes; stage end to end through fake structural nodes with an injected clock (holder positions, facing, scale rule, half-widths, parallax offsets, effect sprites, flash alpha, number, return, `Date.now`/`performance.now` never called, dispose destroys everything); reduced motion path.

## Gates

- `cd port/v2 && npm run typecheck` — 0 errors at the end (three errors in `packages/audio/test/combat-cues.test.ts` appeared mid-session from another lane's concurrent edits in this worktree and were gone by the final run; not my file).
- `npx vitest run tests/battle2-` — 4 files, 25 tests pass.
- Root `node tools/validate.js` — PASS (render audit 1010 clean, boot errors 0, FINGERPRINT MATCH 50/50).

## Evidence — `audits/LONG_SESSION_20260913/a3-battle/`

- `proof-run-01/civet-vs-platypus-10s.mp4` (4.58 MB, sha256 `2f7ac2a2…adc93043`, 602 frames / 10.10 s, update p95 0.3 ms, max 0.9 ms) — Civet melee:wild → Platypus, then Platypus melee back; real clock injected; Edge 153 headless over CDP (provenance in `report.json`). Captured with `node tools/battle2-proof/runner.mjs <newDir>` run outside the macOS sandbox.
- `proof-run-01/frame-{ready,command,approach,strike,hitstop,flash-fade,number,return,turn2-strike}.png` — beat frames; the strike frame is at the white-flash peak by design (flash 1.0 for two frames). Eight of nine frame hashes were byte-identical across two separate browser sessions (only `turn2-strike` changed after its sample time was moved 0.5 ms inside the hitstop window).
- `proof-run-01/report.json` — plans (both turns: impact 1852.5 ms after turn start, hitstop 59.5 ms at civet mass 0.85, turn 2 starting exactly at 3582.17 ms), phase log, cut time (35 ms for 516,758 alpha pixels into 19 parts), canvas rect, worktree status; `build-manifest.json` — sha256 of every bundled source and served file. The `build/` bundle (21 MB) and the webm were deleted after the mp4 was verified; run the runner to regenerate.
- `state-sheet/battle2-state-sheet.{svg,png,json}` — 12 sampled stage states (skeleton overlay via FK, portrait box, effect track bounds, flash/shake/number/parallax values); byte-identical SHA on re-run (`3030ee63…`). Widths in the sheet are estimates; the stage measures the keyed alpha.
- Evidence size 13 MB (frames ~1.2 MB each); Nick's LFS decision applies as for the other bulky evidence.

## Tools — `port/v2/tools/battle2-proof/` (223 lines)

`index.html` + `entry.mjs` (page: keyed masters via Codex's `keyAndDespill`, fixture cut, per-part canvases, portrait platypus, Wild effects, world life at arena density, two turns, MediaRecorder capture), `build.mjs` (rolldown, Vite-free, sha256 manifest), `runner.mjs` (serve on 127.0.0.1, CDP drive, ten-second webm → mp4 via `/opt/homebrew/bin/ffmpeg`, beat frames from the measured canvas rect), `state-sheet.mjs` (Node SVG fallback).

## Findings while building (fixed)

- A1 timelines scale by the body card's mass class, so a rigged combatant's plan must take mass from the card or beats and poses disagree (fixed: card wins; `mass` is read for portraits only).
- The return phase reused the approach gait clip truncated to the return window and cut it mid-stride at `returnEnd`; the gait clip is now time-scaled to the capped approach/return windows so it completes on the boundary.
- A fixed 55 % run-up put the civet inside the platypus at the strike; the run-up now stops at contact from the rigs' half-widths (stage fills them in), capped at 55 % and floored at 15 % of the stand distance.

## Not done / decisions for Nick

- No `main.ts` wiring or flag (A6/Codex per the work order; recipe in `battle2/README.md`). The Chronicle remains the accessible owner of the outcome.
- Melee/cast per theme (`wild, stone, sand` melee) is an A3 default, a kit wording decision.
- The Platypus has no landmark record and no `monotreme` library: it is staged as the labelled whole-portrait fallback (root offsets only). The fixture cut has no joint patches, so seams show at extreme poses; C2's parts rig owns that.
- `LOG.md` row for A3 was not edited (outside my allowed paths); Nick/Codex fold this entry in.
- The kit's near-plate rate 1.20 moves the foreground more than the runner; implemented literally, worth a look on the capture.
- The `phone` tier (30 fps budget) is not measured here; update p95 0.3 ms on desktop.
