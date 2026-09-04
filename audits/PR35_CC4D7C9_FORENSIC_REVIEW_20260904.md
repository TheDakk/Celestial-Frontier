# PR #35 forensic review — head cc4d7c9 (read-only, Anthropic/Claude side)

**Reviewed:** `cc4d7c920083c3c630a9c8c8e6fc5a6e40f5e0d4` on `origin/openai/mac` (= `refs/pull/35/head`) against develop base `7a9f4c1`; implementation commit `f348b249`, evidence commit `1b8467f5`, both confirmed as ancestors. Authority taken from the branch's ROADMAP.md, GITHUB_ACTIONS_BUDGET.md, PROCESS_LAWS.md and `audits/PR35_A922_FORENSIC_PREVENTION_REPAIR_20260903.md`, not from the stale PR description.
**Method:** full diff a922c4b..cc4d7c9 read (workflow, policy selftest, `main.ts`, `glassmatrix.mjs`, evidence contract, Slice, Arc 4 contract); seven focused audits (full-run v2 PASS writer/verifier consistency, tightened keyboard preconditions at the three narrowest viewports, Slice change, product heartbeat change, workflow/jq/timing, evidence-gap map, stale-identity regression sweep), then two-lens adversarial verification of every P0–P2 candidate. Local checks on this Windows PC at cc4d7c9: Actions policy selftest 66/66, Glass report selftest PASS, all three TypeScript programs, focused tests 94/95 (the one failure is `spawnSync jq ENOENT`, a missing binary on Windows). Nothing was edited, committed, pushed, labelled, dispatched, merged, released or deployed.

## Verdict

**No P0 or P1 defect found.** cc4d7c9 closes the three material risks from the a922c4b review and I found no new mechanism that would red the next attempt. What remains are evidence gaps in expensive positions and a few single points. The next attempt is materially different from run 15 and, if the two local gap-closers below are run first, has good odds.

Closed at this head (verified in the checkout):
- **Caps.** Battery job 120 min (`.github/workflows/test.yml:58`), Compendium step 55 min (`:644`), both sealed by `tools/actions-budget-policy.js` (`JOB_TIMEOUTS`, `assertNamedStepTimeout`; 66 controls pass). Projected green run ≈ 94–98 min, margin 22–26 min; Compendium 39m14s vs 55, margin ≈ 15.8 min.
- **Canary reach.** The changed-input preflight (`test.yml:177-536`) now runs small-phone and then large-phone before Compendium, with the forced native-Tab heartbeat and the forced Shipyard `mining` heartbeat verified by jq at minute ~2–5 instead of minute ~76. Every exact-shape clause in the jq matches the writer's output (schema v2, 7-key descriptor, 9-key inventory row, `cycleReceipt.refresh.capture == "completed"`, exact check-key sets).
- **Shipyard stale identity.** Closed in both instruments: Glass setup re-queries by selector and the keydown listener re-queries the live node at event time (`glassmatrix.mjs:1161-1252`); the forced heartbeat quiesces, rebaselines `originalTarget`, resumes, then runs one cycle (`:1287-1308`); Slice mirrors the same pattern (`slicesmoke-contract.mjs:36-95`). The product side already restored focus by focus key after every `replaceChildren` (`engineering-panel.ts:955-1022`), which corrects my earlier claim that it did not.
- **Product change is receipt-only.** `runF4HeartbeatCycle` returns a typed cycle receipt; ordering of heartbeat, revision check, checkpoint and the three refreshes is unchanged, every early-return predicate is the same in the same order, and no caller depends on the resolved value except Glass/Arc 4 (`main.ts:1109-1252`; callers at `:1261-1268`, `:1280`, `:1325`, `:8507`). The Compendium budget change moves only build hashes (index, owner bundle, service worker); the ruler, ceilings and 78 outcomes are unchanged (`budgets/compendium-memory-v1.json:45-68`).

Corrections to my a922c4b review, for the record: full Glass started at ~74m09s, not 77; the Engineering panel already had passive focus restoration; the Compendium slowdown coincides with commit `cf2d176` but that is not proven causal.

## Ranked findings

### P2-1 · Slice's rewritten Shipyard disclosure probe has never executed in any browser at this head, and Slice is the most expensive uncapped position
- **Where:** `port/v2/tools/slicesmoke.mjs:6281-6289` (toggleEngineeringDisclosure now uses the contract expressions), `port/v2/tools/slicesmoke-contract.mjs:36-71` (setup, document-level capture keydown re-queries the live summary), `:74-95` (outcome), `:101-136` (assessor); `.github/workflows/test.yml:666-685` (Slice step, no step cap; only `:26`, `:58`, `:181`, `:586`, `:644` carry `timeout-minutes`).
- **Why it matters:** the assessor is stricter than the old inline predicate (section count exactly 1 before and after, exact `section:<id>` focus keys on both sides, `after.height >= 44`, connected original/current, live target and active identity at keydown, replacement lineage). By reading, every clause holds for the product (`engineering-panel.ts:845-853` summary is the first child of details with `data-focus-key`; `index.html:511-513` summary min-height 44 px; no product code re-dispatches keydown), and the same mechanism passed at large-phone inside Glass locally. But the Slice path itself, with five sequential toggles across a live 5-second heartbeat window, has run in no browser at cc4d7c9. A red here lands at ~minute 65–74 and consumes the authorization.
- **Why tests miss it:** `tests/slicesmoke-shipyard-disclosure-identity.test.ts:38-95` executes the expression strings in jsdom but stubs geometry, flips `details.open` by hand and forges `isTrusted`.
- **Smallest repair:** no code change. One local develop Slice run before authorization (`npm run smoke:ci -- --profile=develop` in `port/v2`, ~6–7 min); keep its `slice-smoke-<run>.json` as the predecessor for the next item.

### P2-2 · The full-run `cf-v2-glassmatrix/v2` PASS chain has only ever seen hand-built fixtures; its first real execution would be at ~minute 94 of the hosted run
- **Where:** `port/v2/tools/glassmatrix.mjs:5545-5563` (writeReport throws on PASS unless the Shipyard inventory is complete and the deep verifier is clean), `:5628-5636` (prepublication verifier; `requirePass` only when no `--viewport`), `:14717-14723` (end-of-run inventory check), `:14733-14735` (omitted planned negative controls), `:14760-14769` (terminal verification after the PASS write), `:9058-9060` (`--verify-run`); `port/v2/tools/glassmatrix-evidence-contract.mjs:553-645` (PASS path), `:186-333` (deep `exactKeys` verifier); `port/v2/tools/glassmatrix-diagnostic.mjs:26-27` (700,000-byte carrier and 900,000-byte summary caps).
- **Why it matters:** the nine local v2 reports are targeted rows, so `requirePass` never ran on real output. The full-only clauses (12 ordered timings, 36-row Arc 4 inventory, exactly one large-phone Shipyard row across the matrix, Slice binding, no omitted planned controls) and then the same verifier three more times (terminal verify, `--verify-run`, diagnostic projection with the carrier cap) have never processed a writer-produced 12-row v2 report. Cross-deriving every `exactKeys` list against the live builders found no mismatch (setup 23 / receipt 27 / heartbeat 13 / snapshot 9 / cycle receipt 5+3 / quiescence 5 / resume 3 keys), so no defect is asserted; the risk is that the first end-to-end execution sits in the most expensive position. The real 12-row v2 carrier size against 700,000 bytes is unmeasured (v1 full PASS carriers were ~105–110 KB, so ~6× headroom is expected).
- **Why tests miss it:** the selftest and diagnostic fixtures are built from the same contract key lists (`glassmatrix.mjs:981-983`, `glassmatrix-evidence-contract.mjs:340`, `tests/glassmatrix-diagnostic.test.ts:100`), so writer/verifier agreement is asserted by construction.
- **Smallest repair:** evidence only. After the Slice run: `node tools/glassmatrix.mjs --slice-run=<id> --profile=develop`, then `--verify-run`, then `GITHUB_STEP_SUMMARY=$(mktemp) node tools/glassmatrix-diagnostic.mjs --glass-run=<id> --slice-run=<id> --profile=develop` (~3–4 min); record the carrier byte count.

### P3-1 · Two sequential Glass rows now share the unchanged 5-minute preflight cap with ~30% headroom
- **Where:** `test.yml:181` (`timeout-minutes: 5`), `:531` and `:534` (the two rows), `:188-193`/`:201-522` (two jq passes); `glassmatrix.mjs:9132` (vite build per invocation), `:9245-9252` (fresh browser per row). The cap is pinned only in `tests/scenemem-workflow.test.ts:200`, `:362`, `:992-1001`; the policy selftest does not seal it.
- **Arithmetic:** hosted small-phone row 87,172 ms (report 92,595 ms) in run 14; local large-phone/small-phone ratio 1.15–1.22 → hosted large-phone ≈ 106–113 s; step ≈ 202–209 s of 300 s. A breach needs ≥ 1.44× on both rows; the observed same-row swing between runs 13 and 14 was 1.36×. A breach reds the run at minute ~7 (cheap) but consumes the authorization.
- **Smallest repair:** accept the headroom, or raise `test.yml:181` to 7 and update the three pins in the same commit.

### P3-2 · The forced Shipyard heartbeat inherits the pre-existing persist race; a concurrent writer turns the cycle into `skipped/persist-in-flight` and the row into a one-attempt instrument red
- **Where:** `glassmatrix.mjs:5197-5236` (Shipyard settlement checks only `pendingPersistenceWrites === 0`), `:11184-11208` (settlement expression), `:1287-1308` (quiesce → rebaseline → resume → forced cycle), `:1455-1462` (`shipyardRefreshCompleted` required), `:9446-9456`; `main.ts:1161` (`activePersist` → `persist-in-flight`), `:14031-14042` (400 ms `persistSoon` debounce), `:8654-8660` (ticker-driven ecology checkpoint). The same class already exists for the Capture forced heartbeat (introduced at 7cfb42d, hosted-passed twice) and passed locally once here.
- **Smallest repair:** tighten the wait, not the assertion: expose `pendingDebounceWrites` in the settlement expression and require it to be 0 in `persistenceQuiescent` (`:5222-5224`). Single attempt unchanged.

### P3-3 · compact-phone and primary-phone have not run the rewritten keyboard helper anywhere; small-phone is covered by the canary
- **Where:** `glassmatrix.mjs:1161-1252` (setup: exactly one match, `visibility === 'visible'`, opacity and cumulative filter opacity > 0, rect ≥ 44×44, focused), call sites `:10961`, `:10964`, `:10989`, `:10993` (`#docksurvey`, `[data-survey-close]`) and `:11315-11319` (five Shipyard summaries).
- **Assessment:** by CSS reading every target is viewport-independent 44 px geometry (`index.html:350` dock buttons 44×44, `:369-370` phone dock grid, `:404-405` `.surface-close` 44×44, `:511-513` summary min-height 44) with no opacity/visibility/filter ancestors at 320/360/390 px; the only `opacity: 0` transition is `#toast` (`:363`). No failure expected; the residual is first execution at ~minute 76–79. Note the `target-floor` control (`glassmatrix.mjs:8176-8185`) does not cover the Shipyard summaries, so their width rests on layout, not on a Glass control.
- **Smallest repair:** run `--viewport=compact-phone` and `--viewport=primary-phone` locally (~15 s each).

### P3-4 · Pinned Edge 151.0.4129.101 download has a single upstream URL and no transport retry
- **Where:** `test.yml:618-635` (`curl --fail --location --silent --show-error`, SHA-256 check). Pre-existing; a transient packages.microsoft.com failure reds the run at ~minute 10. If transport-level retries are acceptable under the process rules, add `--retry 3 --retry-all-errors --retry-delay 5`; the SHA pin and one-attempt rule are unaffected.

### P3-5 · `jq` is a runtime dependency of four battery steps and of the hosted static gate with no presence guard
- **Where:** `test.yml:195-201`, `:681`, `:701`; `tests/scenemem-workflow.test.ts:744`. ubuntu-latest preinstalls jq; this is why the one local test fails on Windows. Optional fail-fast: `command -v jq >/dev/null` at the top of the preflight step.

### P3-6 · A throw from terminal verification after a PASS artifact is written is rewritten as an empty-ledger instrument-fail over the same immutable artifact
- **Where:** `glassmatrix.mjs:14760-14769` (PASS write then verify), `:14786-14800` (`main().catch` writes instrument-fail with `browser: null`, `findings: []`, `controlsRun: false`), `:679-687` (atomic rename over an existing target). Exit code is 2 either way, so it cannot turn a red green; it degrades the retained diagnosis of the most expensive failure position. Pre-existing. Optional: skip the rewrite when the run artifact already exists.

### P3-7 · Hygiene
- `main.ts:1165-1168` `runtime-heartbeat-in-flight` skip reason is unreachable (`heartbeatF4` serialises on `f4HeartbeatCycleInFlight`, `:1253-1262`).
- `glassmatrix.mjs:11336-11340` `SHIPYARD_KEYBOARD_DISCLOSURE_ACTIVATION` leaves no positive trace in a PASS report and no consumer pins it or the v2 native-Tab diagnostic schemas (the hosted jq pins them for the canary only).
- The deep verifier's `exactKeys` lists are hand-mirrored in three places (`glassmatrix-evidence-contract.mjs:186-333`, the selftest inventory `:340`, the workflow jq) with no builder-to-contract parity test.
- None of the nine v2 targeted reports or the f348b24 Compendium report are committed as carriers (only digests in the audit); earlier heads retained gzip carriers. Retaining the small-phone and large-phone v2 reports would let the hosted jq be dry-run against real writer output.

### Retained by policy (unchanged, still a single point)
- Mandatory artifact upload after a green Glass is hard-fail (`test.yml:742-766`); run 15 proved the service can time out. The step-summary projection now preserves the diagnosis, but the required check would still be red. Codex has deliberately retained this; it is Nick's call.

## Green-run timing under the new caps
Pre-Glass ≈ 74m09s (run 15) + ~1.8 min for the second canary row ≈ 76 min. Full Glass 12 rows × 87–100 s + build ≈ 17.4–20 min. Tail (verify, projection, upload) 0.5–1.5 min. Total ≈ **94–98 min vs the 120-minute cap** (22–26 min margin; survives a ~1.25× uniform slowdown, or a 1.5× Glass-only slowdown). Compendium 39m14s vs 55 (tolerates ~1.40×). Slice ≈ 24.5 min, uncapped. Preflight step ≈ 202–209 s vs 300 s.

## What could still make the next attempt fail, in likelihood order
1. A Slice regression from the unexecuted disclosure path (low by reading; costs ~70 minutes if it happens).
2. A writer/verifier disagreement on the first real full v2 PASS (no mismatch found by cross-derivation; costs ~95 minutes).
3. The 5-minute preflight cap on a degraded runner (~5–15%; costs 7 minutes).
4. The persist race inside a forced heartbeat (rare; costs 5 or ~80 minutes depending on which one).
5. Infrastructure: Edge download, artifact upload, runner variance.

## Recommended sequence before the next authorization (all local on the Mac, ~15 min, no code change)
1. `cd port/v2 && npm run smoke:ci -- --profile=develop` (Slice, ~7 min).
2. `node tools/glassmatrix.mjs --slice-run=<slice id> --profile=develop`, then `node tools/glassmatrix.mjs --verify-run=<glass id> --slice-run=<slice id> --profile=develop`, then `GITHUB_STEP_SUMMARY=$(mktemp) node tools/glassmatrix-diagnostic.mjs --glass-run=<glass id> --slice-run=<slice id> --profile=develop` (~4 min). Record the carrier byte count.
3. `node tools/glassmatrix.mjs --viewport=small-phone`, `--viewport=compact-phone`, `--viewport=primary-phone` (~1 min).
4. Dry-run the workflow's own jq verdict against the retained small-phone and large-phone v2 reports (extract the filter as `tests/scenemem-workflow.test.ts:20-40` does, same `--arg`/`--argjson` set as `:744-757`).
5. Optionally raise the preflight cap to 7 with its three pins; then one hosted attempt.

If step 1 or 2 goes red, author the repair before any authorization; nothing in this list is a rebaseline or a retry.

## Environment notes from this machine
- The v2 browser launcher still does not start on this Windows PC and `jq` is absent, so the browser-free profile fails on Windows-only path-separator assertions and the jq test; Ubuntu is unaffected.
- `gh` on this PC has an invalid token; hosted facts come from the branch's retained audits and report carriers.
