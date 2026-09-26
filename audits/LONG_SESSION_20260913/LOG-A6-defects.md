# LOG — A6 part 1: defect register items (Claude, anthropic/mac, 2026-09-13)

Scope: FULL_REVIEW.md Part K1 items 19–22, 24, 25, 27–31 (files no other lane edits).
Items 1–11, 17, 33–35 were already closed by Codex; each item below was verified present
in the current tree before it was touched. No git write command was run; nothing under
motion/, effects/, worldlife/, soundkit/, battle2/, local-ai-*, kit-*, landfall-*,
tools/local-image-generation, tools/creature-animation or ART_KIT.md was edited.

**main.ts hunks (announced):** exactly one, for K20 — three lines after
`const productActionCoordinator = createProductActionCoordinator();` at ~10160:
`productActionCoordinator.bindSettleHook(() => notificationHistory.flushPending());`
The literal creation line is unchanged so `tests/engineering-action-coordinator.test.ts`'s
one-shared-coordinator source contract still holds.

## Per item

### K19 — inert desktop panel-anchor CSS — FIXED
- `port/v2/apps/game/src/ui-shell-style.ts`: the `@media(min-width:901px)` block now carries only
  `#toast{right:…}`; the `#setpanel,#recpanel,#shipyardpanel,#inventorypanel,#combatpanel` right/bottom
  declarations (overridden by equal-specificity UI_SHEET_CSS rules later in the same element) are deleted.
- `port/v2/apps/game/src/notification-history.ts`: `#notificationpanel` `top` and `max-height` deleted
  (owned by the UI_SHEET_CSS `:is(SHEETS)` rule on every breakpoint and the desktop block).
- Test: `port/v2/tests/ui-shell-cascade.test.ts` (new). jsdom 29's real cascade judges the concatenated
  index.html inline sheets + UI_PRESENTATION + SHELL + HISTORY + SHEET in document order. jsdom evaluates only
  `screen`/`all` media, so a test-side projector rewrites each `@media` prelude for a chosen viewport.
  - Projector negative control: desktop `#dock` is `flex`, phone/landscape is `grid`; unknown features throw.
  - Cascade owner: mutating the surviving UI_SHEET_CSS declarations moves `getComputedStyle().bottom`
    (`123px`), `max-height` (`456px`), `#toast.right` (`42px`) and `#notificationpanel.top` (`321px`).
  - Control: re-adding the deleted shell block and the deleted history declarations changes no computed
    anchor on desktop, phone portrait or phone landscape, with and without `panel-open`; an appended live
    rule in the same harness does move the anchor.
- Observation (not fixed, outside the register row): `NOTIFICATION_HISTORY_CSS` line 145
  (`body.panel-open #notificationpanel` landscape rule) is byte-identical to and fully shadowed by the
  UI_SHEET_CSS landscape `body.panel-open :is(SHEETS)` rule.

### K20 — pending notices never drain after a product action — FIXED
- `product-action-coordinator.ts`: `bindSettleHook(hook)` (single binding, refuses a second). The hook runs
  synchronously inside `settle()` after the latch is released and the barrier resolved. Every main.ts
  settle site already sets `productActionInFlight = false` before `settle()`, so `deferRecord()` is
  false when the drain runs. main.ts binds `notificationHistory.flushPending` (hunk above).
- Tests (`tests/notification-history.test.ts`, describe "K20"): notice recorded while deferred → row
  `data-notification-pending` with no Mark read → claim settles with the bound hook → recorded, Mark read
  enabled, `persist` never called (no checkpoint/navigation), badge 1. Negative control: settling without
  the hook leaves the row pending. Refusal-safety: a hook firing while `mayRecord()` is false leaves the
  notice pending; a later flush records it. Double-bind is refused.

### K21 — Charters opener hidden under any open surface — FIXED
- `ui-shell-style.ts`: the hide rule now covers `#trail` only. In the phone-landscape `panel-open` compact
  topbar, `#objchip` takes a third grid row (`grid-template-rows:auto auto auto`) so it has a slot instead
  of an implicit column. **Visual note for Nick:** the objective chip is now visible while a card/panel is
  open on every breakpoint; Glass captures for panel-open states will change accordingly.
- Test (`ui-shell-cascade.test.ts`): index.html's `#objchip` is a native `type="button"` with
  `aria-controls="chpanel"` and no hidden/disabled/tabindex=-1; computed `display` is `block` under
  `card-open`, `panel-open` and both, on desktop/portrait/landscape; landscape `grid-row` is `3`.
  Negative control: appending the pre-fix rule makes the same harness report `none`.

### K22 — checkpoint refuses the whole checkpoint on one malformed notification row — FIXED (part 1); import `t:0` alignment — NOT CHANGED (part 2, see why)
- `checkpoint-state.ts`: a malformed live `notifications` value (bounded-array, clone or row validation
  failure) no longer refuses. The overlay is dropped, the durable parent's rows are kept, `appliedFields`
  excludes `notifications`, and the projection carries
  `droppedFields: [{ field: 'notifications', detail: 'live-field:notifications:invalid' }]`. Other live
  fields still refuse the whole checkpoint (control kept). main.ts only checks `kind`, so no hunk was
  needed; it does not yet surface `droppedFields` in diagnostics (follow-up, outside my main.ts allowance).
- `tests/checkpoint-state.test.ts`: the 26-form malformed matrix is retained verbatim; each form now
  asserts degrade (reason recorded, durable rows retained and detached, explorerName/sndOn/epoch still
  projected, durable unchanged, getters never called, repaired history restores with an empty reason list)
  plus a control that a malformed `sndOn` is still a refusal. The test title was updated to the new
  contract; no assertion was weakened — the register row is the authority for the contract change.
- Part 2: I first changed `import-v2.ts` so a finite numeric `t` clamps like `appendNotification` (0 stays 0).
  That broke `packages/persistence/test/import-v2.test.ts:235` and `migration-v5.test.ts:239`, which
  fixture-anchor the v1.8.9 loader's `t || now` repair (verbatim port + "never change a test's intent").
  I restored `import-v2.ts` byte-for-byte. Instead `tests/notification-history.test.ts` (describe "K22")
  pins the actual agreement: every positive finite clock round-trips unchanged through append →
  checkpoint → export → import, and the one deliberate asymmetry (0/negative/absent/non-numeric `t` reads
  back as the import clock) is named with a direction control. Changing that legacy repair is a decision
  for Nick, not a defect fix.

### K24 — `--ui` FOUC — FIXED
- `port/v2/apps/game/index.html`: `--ui: Inter,system-ui,-apple-system,sans-serif;` restored on the inline
  `:root`. Test `tests/ui-root-font-token.test.ts` (new) extracts the single `--ui` from the inline `:root`
  and from `UI_PRESENTATION_CSS` and asserts equality; negative controls: a removed token throws, a
  drifted value mismatches.

### K25 — Frontier Resolve admitted by description-text matching — FIXED
- New `packages/domain/combatcore/src/player-ability.ts` exports `FRONTIER_RESOLVE_ABILITY_V1` and
  `PLAYER_COMBAT_HEX_V1` (added to the combatcore index and to the Gate B domain inventory in
  `tests/nodom.test.ts`, now 89 files). `packages/persistence/src/combat-settlement.ts` builds the player
  stats from them. `packages/audio/src/combat-cues.ts` `abilityFact(value, champion)` admits Frontier
  Resolve only for `champion.kind === 'player'` whose color is the source hex and whose fields equal the
  source ability field-by-field; no description text, numbers or `'#ffcf8a'` remain in combat-cues.ts.
- `packages/audio/test/combat-cues.test.ts`: the compiled-helper harness injects the two source constants;
  all existing mutants and missing-field cases still throw. New control: compiling the helper against an
  edited source (renamed label, rewritten description, regen 0.05) admits the matching transcript and
  refuses the old one; a different source hex is honoured; the source file contains neither the
  description string nor the hex literal.

### K27 — timer-only 12 s deadlines admit late results — FIXED
- `earth-layered-load.ts`: `expiresAt = performance.now() + EARTH_LAYERED_DEADLINE_MS`; `current()` fails at
  or after the boundary (residents arrival, background commit and pair publication all pass through it);
  `fail()` uses the ownership-only `authorized()` to avoid recursion, mirroring PaintedVistaLoadV1.
- `planet-surface-turn-view.ts`: same boundary checked in `accept()` before the worker result is read.
- Tests (stubbed `performance.now`, both directions, mirroring painted-vista-load.test.ts:242): at exactly
  12 000 ms with the timer undelivered the result is refused with the timeout error, bitmap closed, no
  commit/lease, fallback once, no timers; at 11 999 ms it is admitted; a pair that arrived in time but
  publishes after the boundary is refused; after route loss the expired arrival is silent.

### K28 — worker error reason discarded — FIXED
- `planet-surface-turn-view.ts` accepts `cf-earth-turn-error/v1` and reports
  `Earth surface atlas worker error: <message>` (256-char cap, `no reason given` for a non-string).
  Test: message surfaced; non-string and over-long messages handled; a different schema is still the
  generic shape refusal (control).

### K29 — `AbortSignal.throwIfAborted` (Safari 16.4+) — FIXED
- `pilot-sound-player.ts`: `assertPilotReadNotAborted(signal, phase)` explicit `aborted` check with the
  reason in the message; `readPilotBytes` exported for the test. Tests: a legacy signal shape (no
  `throwIfAborted`) reads a full body, reports `cancelled before/after a chunk read: <reason>`, cancels
  the reader, and the error is never a `TypeError`; negative control shows the pre-fix call on that shape
  is the TypeError; a native aborted signal reports through the same path.

### K30/K31 — decoded audio held twice; per-sample `getInt16` — FIXED
- `pilot-pcm.ts`: (K31) one aligned `Int16Array` view over the data chunk (DataView fallback only on a
  big-endian host or odd offset); (K30) a weak per-PilotPcm slot caches the full-channel and mono
  AudioBuffers, reused across plays; once the full buffer exists `pcm.channels` returns the buffer's own
  channel views and the planar copies are released. `pilotPcmBufferDiagnostics(pcm)` reports the slot.
- Tests (`tests/pilot-pcm.test.ts`): decode equals a per-sample DataView reference for mono and stereo on
  4 096-frame LCG data (negative control: byte-swapped input differs); two stereo plays → one
  `createBuffer`, same buffer on both sources, `pcm.channels[i]` is the buffer's view and no longer the
  planar array (values equal, still frozen); mono adds exactly one buffer; a separately parsed cue
  allocates again; a spread copy has no slot.

## Gates
- `cd port/v2 && npm run typecheck`: app and worker projects clean; the root `tsc` reports one error in
  the untracked `tests/battle2-rig.test.ts` (another lane's in-progress file), nothing in my files.
- `npx vitest run` on every touched file plus the named suites: 12 files / 147 tests green; with the
  K22 part-2 revert, nodom + notification-history + import-v2 + migration-v5: 166 green.
- Full `npx vitest run`: 372 files / 4433 tests pass. Residual 24 failures in 7 files are pre-existing
  and unrelated to these edits: `app-chrome-main-wiring` (main.ts `surfaceLayoutRects` contract),
  `painted-earth-mount-ownership` and `evidence-build-runtime` (`cancelAiCrossfade` /
  `startLocalAiPreview` undefined — local-AI lane), `compendium-budget` (sealed hash),
  `exceptional-crafting-evidence-contract`, `guide-release`, `slicesmoke-sixth-red-contract` (release
  copy), plus `current-producer-authorities` (evidence build needs
  `tools/local-image-generation/node_modules/onnxruntime-web`) and three `node:test` `.mjs` files under
  tools/creature-animation and tools/quadruped-proof picked up by vitest.
- Root `node tools/validate.js`: PASS, FINGERPRINT MATCH (50 probes). Root `node tools/smoke.js`: 553 PASS,
  0 FAIL.

## Not done / follow-ups
- Surface `droppedFields` from the checkpoint projection in main.ts diagnostics (needs a main.ts hunk).
- Decide whether the v1.8.9 import repair of `t:0` → now should change (K22 part 2).
- Remove the fully shadowed `NOTIFICATION_HISTORY_CSS` landscape rule (line 145) if wanted.
- Glass re-captures for panel-open states after K21.
