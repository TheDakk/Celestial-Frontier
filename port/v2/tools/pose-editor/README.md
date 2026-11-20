# Pose editor (dev only) — A7

Hand-tune a **template** action's key poses by eye without leaving the pipeline. The editor edits the
action library's pose tables (joint rotations in degrees, root offsets in body lengths) for one
template + action, previews them through the compiler's own timeline sampler (`sampleTimeline`), and
exports the edited table as an overlay JSON. It never edits a creature (MOTION_KIT §9: one interpreter);
the record and cut-out are only the body the template is previewed on.

Nothing here is imported by the game. `motion/overlay.ts` lives in the app tree so it is typechecked and
tested, but `motion/index.ts` does not re-export it — the production bundle is unchanged.

## Run

```sh
cd port/v2
node tools/pose-editor/serve.mjs                 # prints http://127.0.0.1:<port>/ ; Ctrl-C stops
node tools/pose-editor/serve.mjs --port=8765 --record=<landmarks.json> --master=<keyable master.png>
```

The server bundles `entry.mjs` with rolldown into a temp directory (removed on exit), listens on
127.0.0.1 only, and serves two read-only assets: by default the Civet record
`audits/CIVET_2D_PROOF_20260912/civet.landmarks.json` and master
`audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png`. The page keys the master in the browser
(`keyAndDespill`), cuts it with `battle2/fixture-rig.ts#cutFixtureParts` and draws the fixture rig with a
canvas 2D renderer. If the master cannot be keyed the painted pane says so and the skeleton pane still works.

Evidence capture (browser-owning, run **outside** the macOS sandbox like the other proof tools):

```sh
node tools/pose-editor/capture.mjs <newDir> --action=melee:bite --pose=2 --set=head:-30
```

## What it edits

- Pick template and action. The pose list is the table's key poses (`t`, ease, joints, root).
- Sliders per joint use the template's `limitsDeg`; `t` is bounded by its neighbours; the last pose is
  pinned at `t=1`. Add copies the selected pose into the gap after it; remove refuses the terminal pose;
  ↑/↓ swap a pose with its neighbour's time slot. A joint at 0° is dropped from the export (rest).
- The status line shows the action hash, overlay hash and timeline hash and whether the table is edited.
- Play tweens on the real clock; scrub is manual. Both use `buildActionTimeline` (held hash-for-hash to
  `buildTimeline` on every shipped action by `tests/motion-overlay.test.ts`) so the preview is the recipe.
- Export downloads `<template>.<action>.overlay.json`; Import validates a file with
  `validateActionOverlay` and refuses (with the reason) before touching the page state.

## Overlay format (`cf.motion.action-overlay/v1`)

```json
{ "schema": "cf.motion.action-overlay/v1", "templateId": "quadruped", "actionId": "hit",
  "poses": [{ "t": 0.244, "ease": "ease-out", "joints": { "head": -20 }, "root": { "dx": -0.08, "dy": 0.02 } }],
  "easing": "ease-out" }
```

`applyActionOverlay(table, overlay)` refuses an unknown template, action or joint, an out-of-limit
degree, a root offset beyond ±1 body length, non-finite numbers, a non-increasing `t`, a `t` outside
(0, 1], a last pose not at `t=1`, an empty or >16-pose list and an unknown ease; it returns a new table,
the rebuilt action and its hash. Ease precedence: pose `ease` → overlay `easing` → the base pose at the
same index → `ease-out`.

## Adoption (not implemented here)

An exported overlay is reviewed like any table change and, once accepted, becomes a file under
`apps/game/src/motion/overlays/` that the compiler adopts via `applyActionOverlay` at table-build time.
Until that lands, the accepted numbers are copied into `actions.ts` by hand under review. Never
overwrite an accepted template: retire it under its date and reason (MOTION_KIT §9).
