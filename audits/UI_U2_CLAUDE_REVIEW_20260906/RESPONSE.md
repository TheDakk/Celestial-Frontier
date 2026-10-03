I'll unpack the bundle into my scratchpad (read-only from Codex's worktree) and follow `REVIEW.md`.

I've compiled the private list of independent items to review: the U2 record docs, paused draft files, evidence manifests, failure logs, the relevant BASE_SOURCE region, clearance measurements in sheet-layout.ts/app-chrome.ts, draft helper scripts, and the roadmap handoff.

I've compiled my private checklist of independent items to review: the base glassmatrix.mjs failing region, the relevant control function definitions, the persisted log/JSON outputs, the sheet-layout and app-chrome measurement code, and the draft runner's receipt output.

I'm checking five independent threads: whether the frame-settlement helpers the draft calls actually exist in the base files (my grep found none, suggesting a ReferenceError), the code path around the hidden-opener guard and Charters-close call, the negative control for `planetside-top-clearance`, the small-phone log failures and Glass JSON outcomes, and the existing test names across the four Glass/sheet test files to gauge what's missing.

I'll check three independent items: the receipt shape in `ui-review-evaluation.mjs` (lines 60–130) that the draft's `topChromeFrameValid` relies on, the Charters section (13500–13575) to confirm `cardOpen` stays false at ≤900px, and the exact failure line from the small-phone log.

I have everything; no further reads needed. Nothing was edited; the bundle was read from my scratchpad copy only.

# U2 pause-checkpoint review — `3a61352` (product `3f1578e`)

**Verdict: blocker diagnosis CONFIRMED (instrument, zero product findings); draft patch NOT ready — two concrete flaws, one risk, no tests.** Do not apply the snapshot or the `.py` editing script; re-derive from the patch after the fixes below.

## 1. Predecessor and the toggle defect — confirmed

- On every viewport the last ordinary panel is Charters. `glassmatrix.mjs` BASE ≈13543 waits for `panelOpen===null && cardOpen===overSurvey` with `overSurvey` false, and `assessChartersCloseSettlement` (191–215) *requires* `route.cardOpen===false` in all four snapshots. So the section ends with the Survey card **closed**.
- The hidden-opener block (13575–13647) that ends with the card **re-opened** (`reopened = activateRealControl('#docksurvey', …)`) is guarded by `vp.width > 900`.
- 13650–13651 then runs `docksurvey.click()` unconditionally and waits 5 000 ms for `!cardOpen`. On >900 px this closes an open card (passes by accident of the predecessor); on ≤900 px it **opens** a closed card. The log confirms: `small-phone/survey closed for top-chrome clearance: outcome did not arrive within 5000ms (last false)` — `last false` means `cardOpen` was true throughout. Instrument defect, viewport-dependent, no product finding.

## 2. Draft `closeSurveyForTopChrome` (patch hunk @13651)

Correct in intent: strict boolean check of observed `cardOpen`, native activation only when open, refusal/malformed stops, post-settlement re-read. Two notes:
- **Risk (low):** `after = await evalIn(read)` immediately after `activateRealControl` has no bounded wait, unlike every existing post-activation site (e.g. 13583–13584). It is correct only if the Survey close is synchronous inside the click handler; if not, this stops with a false "did not leave the card closed". Either keep the one-shot read and add a unit case proving the receipt/close ordering, or use `waitFor(...)` with a strict `=== false` acceptor — never a bare toggle.
- The stop-then-continue pattern (`stopInstrumentControl(...)` followed by `before.cardOpen`) matches existing usage, so it relies on `stopAtFirstGlassInstrumentFailure` throwing; fine as long as that stays true.

## 3. Clearance measurement — one concrete flaw

- `topChromeFixedRows` mirrors `sheet-layout.ts:91–95` (header excluded only when `pointer-events:none`, painted children counted, opacity>0, blocking wrapper counts its full box). Good. The `waitFor('deferred lower/top chrome…')` still compares `--surface-chrome-bottom` against the full-wrapper set (`topbar, searchbox, objchip, sceneactions`) exactly as `app-chrome.ts:147/161–190` computes it, so AppChrome's distinct meaning is preserved. Good.
- **Flaw:** `#trail` is a direct header child, so `topChromeFixedRows` now includes it. The draft substitutes that set into `portraitBandCheck` (hunk @13743, `fixedRows=${topChromeFixedRows}`), where the fixture has *deliberately made the trail visible and floated it down toward Planetside*. `fixedChromeBottom` therefore moves with the injected fixture during `band`, while the trail is already measured separately as `t`/`gap`. Filter `el.id!=='trail'` for the `portraitBandCheck` use (keep it in the product `topChromeCheck`, which matches sheet-layout's `upperChrome`). 72 px band and 5.5 px checks are otherwise preserved; `fixedClear` now demands both the legacy id list and the painted set — stricter, acceptable.

## 4. Frame boundaries and first-failure retention — one concrete flaw

- `topChromeFrameValid` is sound: `reviewFrameSettlement` assigns `id = invocations.length+1`, so `expectedFrameId = prior+1` holds; `overflow ?? true` fails closed; `assessReviewFrameSettlement(frame, vp)` checks phases and viewport. Cleanup settle failures are pushed to `cleanupErrors` and `error ??= cleanupErrors[0]`, so a restoration fault turns the witness red. Good.
- **Flaw:** the Node-side check `if (labels !== expectedSettlements || settlementChecks.some(!ok)) stopInstrumentControl('portrait fixture settlement evidence failed…')` runs **before** `portraitBandControlOutcome`/`portraitFallbackControlOutcome` and before `portraitControls.band.fixture.error` is examined. If the fixture throws early ("did not establish a usable visible predecessor") the settlements array is short and the stop message names settlements, not the real first failure. Reorder: surface `fixture.error` first, then require the exact seven-label sequence only when `error===null`.

## 5. Missing tests / readiness

The owner is an inline closure over `evalIn`/`activateRealControl`, so it is untestable as written. Smallest correction:
1. Extract `surveyPostCloseSettlement(readState, activate, settleFrames, readFrames)` + pure `assessSurveyPostClose(receipt, viewport)`, exported beside `chartersCloseSettlement` (BASE 148–215), and call it from 13650.
2. New `tests/glass-survey-post-close.test.ts`, source-executing, following `glass-charters-settlement.test.ts`: (a) already-closed → zero activations, one settlement, ok; (b) open → exactly one activation → closed; (c) open → activation refused → red, no second activation; (d) malformed state (`null`, `undefined`, `'false'`) → red; (e) still open after activation → red without a second toggle; (f) settlement label/id/overflow mismatch → red; (g) fixed-rows: pointer-transparent header excluded, its children counted, blocking header counted, opacity 0 excluded, `trail` excluded in the band use; (h) portrait ordering: fixture first-error survives a later cleanup-settle failure.
3. Then `node --check tools/glassmatrix.mjs`, focused Vitest (new file + the four bundled Glass tests + `sheet-layout`), all three TypeScript programs, root validate; commit; one fresh canonical attempt through the archived runner (inspect it first — it hard-codes `/private/tmp/cf-u2-checkpoint-<sha>-20260906`).

Not verified by me: no build, browser, or test was run; large-phone/Slice remain NOT RUN; the two older unknowns (`08cd97d` Milky Way, `c57aaaeb` portrait timeout) stay open; no U2 PASS or Compendium certificate is implied. No hosted authority.