# LOG — A7: dev-only pose editor (Claude, anthropic/mac, 2026-09-13)

Scope: work package A7. A tools/ page that edits a TEMPLATE action's key-pose table as an overlay,
previews it through the compiler's own sampler on the Civet record's skeleton and on the landmark-cut
fixture rig over the keyed master, and exports/imports overlay JSON; a pure overlay module with tests;
a 127.0.0.1 dev server; a CDP capture runner. No git write command was run (Nick commits after review).
No production bundle change: `motion/index.ts` does not re-export `overlay.ts`; nothing under
`tools/pose-editor/` is imported by the game.

## Files (all new; 500 lines of code + README + this log)

| File | Owns |
|---|---|
| `port/v2/apps/game/src/motion/overlay.ts` (157) | `ACTION_OVERLAY_SCHEMA = 'cf.motion.action-overlay/v1'`, `validateActionOverlay(input, table)`, `applyActionOverlay(table, input)` → `{ table, action, hash, overlayHash, overlay }` (pure; other actions keep identity), `overlayFromAction(template, action)` (the editor's start state), `buildActionTimeline(card, action, seed)`. Refuses: wrong schema, unknown template (via `resolveTemplate`), unknown action, unknown joint (own-key check, `__proto__` included), out-of-limit degree (template `limitsDeg`, inclusive), root offset beyond ±1 body length, non-finite numbers, non-increasing `t`, `t` outside (0, 1], last pose not at `t=1`, 0 or >16 poses, unknown ease. Ease precedence: pose → overlay `easing` → base pose at that index → `ease-out`. No clock, no `Math.random`. |
| `port/v2/tests/motion-overlay.test.ts` (105) | 11 tests: every shipped action round-trips through validation; negative controls for each refusal above (each asserted on both `validateActionOverlay` and `applyActionOverlay` with the reason text); purity (input table and `QUADRUPED_ACTIONS` byte-identical after apply, frozen output); hash independent of joint key order, moved by a one-degree edit; ease precedence; clock/random spies; **preview = runtime**: `buildActionTimeline` equals `buildTimeline` hash-for-hash and JSON-for-JSON on every quadruped action for Civet and Fox; an applied `head=-30` edit samples to −30° exactly at its key while `spine` is unchanged and nothing is clamped. |
| `port/v2/tools/pose-editor/index.html` (33), `entry.mjs` (118) | Plain ESM, no framework, no pixi. Template/action selects (only templates with an action table), pose list with add (copies the selected pose into the gap after it) / remove (refuses the terminal `t=1` pose and the last remaining pose) / ↑↓ (swap with the neighbour's time slot, so `t` stays monotonic), `t` bounded by neighbours, ease select, root dx/dy sliders (±0.5 BL), one slider per template joint bounded by `limitsDeg`, Play (real clock, non-loop actions hold 400 ms at rest before repeating), scrub, Reset, Export (download `<template>.<action>.overlay.json`), Import (validated first; a refusal leaves the page untouched). Skeleton pane always; painted pane = `keyAndDespill` → `cutFixtureParts` → `createFixtureRig` with a canvas-per-part factory, drawn by canvas 2D in rig depth order with the sampler's squash/stretch about the foot. Status line: action hash, overlay hash, timeline hash, body/total ms, clamps, edited-vs-table. `window.cfPoseEditor` exposes state and the edit API for the capture runner. |
| `port/v2/tools/pose-editor/serve.mjs` (46) | Rolldown bundle into a temp dir (removed on exit), 127.0.0.1 only, serves the page + `assets/record.json` + `assets/master.png` read-only; defaults to the Civet record and master under `audits/`; `--port`, `--record`, `--master`. |
| `port/v2/tools/pose-editor/capture.mjs` (41) | Starts the server, drives Edge/Chromium over the shared `browsercdp.mjs`, waits READY, selects action/pose, screenshots both panes and the page, optionally applies one `--set=joint:deg` edit through the page API and screenshots again; `report.json` carries hashes before/after and the exported overlays. |
| `port/v2/tools/pose-editor/README.md` | Run, what it edits (template tables only), overlay format and refusals, adoption path (`motion/overlays/`, not implemented). |

## Evidence — `a7-pose-editor/capture-01/` (Edge 153 headless over CDP, run outside the sandbox)

- `skeleton.png`, `painted.png`: `melee:bite` key pose 2 (the strike, `t=0.487`, 209.7 ms) straight from the table — action hash `16d955be`, overlay hash `8baab536`, timeline hash `f085187b`, 19 painted parts over 516,758 keyed pixels, `equals table`.
- `skeleton-edited.png`, `painted-edited.png`: after `setJoint('head', -30)` through the page — hashes `c20f06ab` / `bb28ed63` / `04df1da7`, status `EDITED vs table`, exported overlay pose 2 `head: 12 → -30`. The painted civet's head pitches up in the second pair; the edit reaches the sampler and the rig.
- `editor.png`: the whole page; `report.json`: browser provenance, asset sha256s, file sha256s, zero page exceptions.

## Decisions taken (for Nick)

- **`buildActionTimeline` duplicates `buildTimeline`'s construction** because `timeline.ts#buildTimeline` reads the frozen `QUADRUPED_ACTIONS` by id and `timeline.ts` is outside A7's write set. The parity test holds the copy hash-for-hash on every shipped action; fold it into `buildTimeline(card, actionId, seed, action?)` when `timeline.ts` is next touched, then delete the copy.
- **The action table is the caller's.** `validateActionOverlay(input, table)` checks joints against the overlay's template but actions against the table it is given; the editor keys tables by template id. A template↔table binding belongs with whoever gives family templates their tables.
- The overlay is `.mjs`/`.ts`-free on the page side (plain ESM with the rolldown pattern from `battle2-proof`), matching the other proof pages.
- Root offsets are capped at ±1 body length in validation; the slider stops at ±0.5 (the largest shipped value is 0.4).

## Gates (final run on this tree)

- `cd port/v2 && npm run typecheck` — 0 errors (root strict, app, worker).
- `npx vitest run tests/motion-overlay` — 11/11 pass.
- Root `node tools/validate.js` — PASS (render audit 1010 clean, boot errors 0, FINGERPRINT MATCH 50/50).
- Browser capture — `REVIEW`, zero exceptions (above).

## Observed, not mine

`port/v2/apps/game/src/motion/templates.ts` (modified) and `family-templates.ts` (untracked) appeared in this
worktree during the batch from the A11 package: `resolveTemplate` now registers the family templates, so
`tests/motion-body-card.test.ts` currently fails two "unknown template" assertions (they use `serpent`).
A7 did not touch either file; its own negative control uses `no-such-template` so it is registry-proof, and
the editor lists only templates that have an action table.

## Not done

- Adoption: no `motion/overlays/` loader; an accepted overlay is still copied into `actions.ts` by hand under review.
- Only the quadruped table exists to edit; family templates get the editor for free once they have tables.
- Nick's eye: `node tools/pose-editor/serve.mjs`, open the printed URL, pick an action, drag sliders, Play.
