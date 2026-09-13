# A1 — Motion compiler (Claude lane) — 2026-09-13

Status: built and green on the mechanical gates; awaiting Nick's review. Not committed (Nick commits after review). No GitHub step.

## What was built

`port/v2/apps/game/src/motion/` — pure, deterministic, clock-free compiler for MOTION_KIT.md sections 3–6 and 8 (quadruped template only; other templates label the whole-portrait fallback).

| File | Owns |
|---|---|
| `templates.ts` | Template registry: quadruped joint graph as data (equal to Codex's `quadruped-template.mjs` GRAPH, contract-tested), joint limits in degrees, the proportion envelope (same numbers as `checkGeometry`), `resolveTemplate()` → template or `{kind:'whole-portrait', reason}`. Rotation convention is documented at its top: a pose key is the bone named by its child joint, pivoting at its parent; + is clockwise for a right-facing body; jaw open is negative. |
| `timing.ts` | §5 table (`ACTION_PHASES`, hitstop/flash/shake/damage-number constants), `scaleMs` (mass × base, held to 0.6x–2.0x), `hitstopMs` (attacker mass, cap 140), `idlePeriodMs` (2600–3400 × mass, seeded via `mulberry32`, forced non-integer), `tAt()` so pose times sit on phase boundaries and never move under mass scaling. |
| `secondary.ts` | §6 material rules table, medium rules (aquatic damping, aerial bob), `materialFromSkinName`, `secondaryParams()` → per-joint lag/overshoot/damping/squash/stretch/quiver/wobble/pulse. |
| `actions.ts` | §4 library in ONE degrees/body-length table for Nick to tune: idle, alert, approach walk/trot/gallop/hop, melee bite/claw/gore/tail/headbutt, cast, hit, dodge, faint, victory, tame, feed. Strong poses as specified: anticipation crouch (spine +12, head low), launch (root +0.36 BL, legs extended), strike (jaw 25 open, near foreleg swipe 40), recover; hit = head back 20, spine compress, stagger step −0.14 BL. |
| `body-card.ts` | `compileBodyCard(record, genome?)` → BodyCard; `MotionCompileError` with `.reason` ∈ missing-record / missing-landmarks / unsupported-template / out-of-bounds / unsupported-materials and `.fallback` for templates; `compileBodyCardOrFallback()`. Named Earth table (Civet walk/climbers/small; Red Fox trot/runners/medium; default walk/medium); procedural reads FA_SIZE/FA_LOCO/FA_SKIN/FA_HEAD/FA_TAIL from `@cf/domain-speciestraits` and realm via `classifyRealm` from `@cf/domain-genome`. Bounds within 15% clamp and flag in `card.bounds.clamped`; beyond refuses. |
| `timeline.ts` | `buildTimeline(card, actionId, seed)` → plain-JSON `MotionTimeline` (per-joint keyframes in radians, root dx/dy in body lengths, lagged/overshooting secondary tracks, chain joints without authored keys inherit their predecessor attenuated ×0.6 so tails lash base→tip, FNV hash of every recipe). `sampleTimeline(tl, ms)` → pose with the frozen easing family (numerically identical to gsap `power1.out/in`, `back.out(1.70158)`, `sine.inOut`). |
| `gsap-adapter.ts` | `createGsapPlayer(timeline, PoseTarget, {now})` plays through real gsap (per-joint tweens on a paused timeline) driven only by the injected clock; agrees with the pure sampler to 1e-4 rad. |
| `budget.ts` | §8 guard: parts ≤ 40, bones ≤ 32, atlas 2048/1024, ≤ 3 phase textures, ≤ 200 particles → `{ok}` or `{reduced:true, dropped:[…], card}` (secondary joints dropped tip-first, emitter dropped, note recorded). |
| `index.ts` | exports. |

`port/v2/tools/motion-proof/` — `pose-sheet.mjs` (record → card → idle / melee:bite / hit → sampled key poses → SVG stick figures via forward kinematics over the graph, plus card and timeline JSON), `ts-loader.mjs` (Node resolve hook mapping the game's `./x.js` specifiers to `.ts` so the tool runs on native type stripping, no build), `fixtures.ts` (shared fixture loader for the tests).

Sizes: 1,102 lines total across modules, tests and tools.

## Tests — `port/v2/tests/motion-*.test.ts` — 25 tests, 3 files, all green

`motion-body-card.test.ts` (12): GRAPH + clipSetId equality with the Codex `.mjs`; every FA_LOCO/FA_SKIN/FA_SIZE entry covered; unknown template → fallback; determinism (same JSON); clock negative control (Date.now/performance.now spies THROW; the control is proven to bite before the compile runs under it); Civet, fox, procedural card contents; unsupported template refuses with labelled fallback; missing/malformed landmarks refuse by name; bounds clamp-and-flag at +12.4% and refuse at +45% (and the 0.001 floor both ways); unsupported surface refuses.
`motion-timeline.test.ts` (11): mass bounds 0.6x/2.0x, hitstop cap; seeded non-integer idle periods with non-integer ratio; deterministic build + hash; clock negative control on build+sample; every action builds with the phase table; every authored key inside joint limits + a tightened-limit control that flags; the strong-pose numbers; secondary lag by material (furred 80/160/240/320 ms, plated rigid, slick squash/stretch), tail finishes after the body; sampler passes exactly through keys, continuous, monotonic on non-overshoot segments; idle loops, one-shots clamp; gsap adapter with injected clock agrees with the sampler across the whole clip.
`motion-budget.test.ts` (2): quadruped passes (31 parts / 30 bones); an over-budget card reduces (tail3, tail2, tail1, earFarTip dropped, emitter dropped, phase textures capped, atlas flagged) and the reduced card still builds a timeline.

## Gates

- `cd port/v2 && npm run typecheck` — exit 0.
- `npx vitest run tests/motion-` — 25/25.
- root `node tools/validate.js` — PASS (render audit 1010 clean, boot errors 0, fingerprint match 50/50).

## Evidence

`audits/LONG_SESSION_20260913/a1-pose-sheets/{civet,fox,procedural}.pose-sheet.svg` (+ `.body-card.json`, `.timelines.json`). Byte-identical on re-run (sha256 checked for civet). Recipe hashes: civet d092bfcc…, fox 041b75fe…, procedural e0ab5edd…; timeline hashes are printed in each sheet header. The procedural subject uses Codex's sealed `captures/procedural-resolved-anatomy.json` plus `procedural-genome.json` (no invented anatomy). Render to PNG with `qlmanage -t -s 2400 -o <dir> <svg>` for viewing; the SVG is the evidence.

## Not done / decisions for Nick

- No motion capture yet: a capture needs the parts rig (C2) or the A3 scene's fixture rig; the pose sheets are the A1 visual evidence. The kit's "reviewed as a ten-second capture" acceptance stays open until A3.
- `tame`, `feed` and the `victory` phase split (210/150/240) have no §5 rows; they are A1 defaults marked as such in `timing.ts` — a kit wording decision.
- Procedural materials: the genome skin (`translucent`) is used per the work order, and the disagreement with the painter's record surface (`fur`) is recorded in `card.notes`, never silent. Nick to pick which owner wins.
- Gaits the quadruped library lacks (swim, glide, drift, …) resolve to walk with a note; sting/peck weapons resolve to bite with a note.
- Translucent wobble, chitinous quiver and the luminous pulse are emitted as parameters on the secondary tracks (wobbleMs/quiverMs/pulseMs) for the rig/effects consumers; they are not extra keyframes yet.
- The §8 update-time budget (2 ms / 4 ms) cannot be measured without a clock; the guard is structural (counts) by design.
- `tests/motion-body-card.test.ts` carries one `@ts-expect-error` on the Codex `.mjs` GRAPH import (no declaration file; Codex's path is read-only for this lane).
- One `git mv -n` (dry run, no effect) was invoked while relocating the fixture helper; no git write occurred.
