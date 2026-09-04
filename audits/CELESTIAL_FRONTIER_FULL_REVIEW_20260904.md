# Celestial Frontier — full project review (develop 7bf3e84, 2026-09-04)

**Scope.** develop at `7bf3e84` (the PR #35 merge), read from the Anthropic worktree `anthropic/windows` fast-forwarded to that tip (local only, nothing pushed). Ten read-only reviewers covered: roadmap vs code, the app runtime, the domain/persistence/art/audio packages, the verification tooling and CI, the test suite, the Glass, Slice and Compendium instruments, portability, and the 107 Markdown files. Every claim below carries a file reference; nothing in any repository was edited, committed, pushed, labelled, dispatched, merged or deployed by this review.

**Volume.** App 59K lines (main.ts 16,622); packages 129K (37K is art painter code); tools 127K; tests 96K; Markdown 104K lines. TypeScript is strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), 3 `any` casts, 0 TODOs, no linter/formatter. Last build: main chunk 1.6 MB + species art 1.27 MB + art worker 1.31 MB uncompressed.

## 1. Where the project actually stands

- **What players have:** v1.8.9, deployed 2026-07-30. `main` last moved 2026-08-02; `develop` is now 736 commits ahead of it. No v2 code has ever run the release gate or reached a player.
- **What v2 is:** a genuinely playable exploration/survey slice with real, persisted writers for Inventory (Arc 2), Engineering (Arc 3), Capture (Arc 4), four companion actions (Arc 5), one landed combat (Arc 6), an audio platform (Arc 7) and part of progression (Arc 9A). The foundations (F1a, F1b, F2, Arc 0 kernels, Arc 1A/1B/1C, F3, F4) are done in code.
- **Status vs roadmap (code-grounded):**

| Item | Verdict | What is missing |
|---|---|---|
| F1a/F1b/F2/F3/F4, Arc 1A–1C | done (automated) | HUMAN rows only (Gate C real save, 1A six images, 1C silhouette) |
| Arc 0 | partial | `training.ts` has 11 lesson ids vs the 21-step curriculum; bioscan and weekly Charters protected |
| Arc 2 items/economy | partial | no loot tables/rolls, no upgrades/sockets, ledger hard-codes `sourceModelStatus: 'arc3-deferred'` (`domain/loot/src/economy-ledger.ts:53,213`) |
| Arc 3 engineering | partial | only Deep Scanners purchasable; Reinforced Hull, Xenobotany Lab, Fusion Drive, Antimatter Drive, Warp Fold are `'unavailable'` (`domain/opportunity/src/planner.ts:777`); no economy simulation tool exists. This is the "Build → reach farther" beat and it is not connected |
| Arc 4 capture | done (automated) | HUMAN ownership review |
| Arc 4.5 first journey [HUMAN] | missing | no human sessions; personas are automated |
| Arc 5 companions | partial | missions exist as a type only (`acquisition/src/model.ts:117`, zero dispatch/return code); `bond` always `null` (`breed.ts:487`); no care/heal; no Chronicle read model; no living previews |
| Arc 5.5 combat model [HUMAN] | missing | Arc 6 was built ahead of this gate |
| Arc 6 combat/Guardians | partial | conquest throws (`persistence/src/combat-settlement.ts:868`), imbue refuses (`arc6-combat-action.ts:413-419`), Guardian reward `'unsupported-open'` (`main.ts:13456`); no party/retreat/tactics |
| Arc 7 audio platform | partial | all six callers use the neutral mix; no visibility-restart policy; accessibility controls partial |
| Arc 8 HD audio content | stub | zero audio assets in the repo; `rights.ts:587 EMPTY_RIGHTS_BUNDLE` |
| Arc 9 progression | 9A partial, 9B missing | five achievements blocked, Paragons protected; no museum/history/share cards/projects |
| Arc 10 integration beta | partial | PWA automation only; no localization |
| Living-species visual pipeline (Gate E) | missing | Pixi is imported only in `main.ts` and `scene-text.ts`; no rig/animation system |

- **Gates:** every HUMAN row in RUBRICS.md is open (C, D, E, F, G, H, I). Gate C is blocked on a real iPhone save export, which nobody can automate.
- **Doc/code contradictions to fix:** ROADMAP still says PR #35 is unmerged; `main.ts:16-19` header still promises "15 remaining lessons" and lists Atlas favorites as future work while `arc9-atlas-favorite-action.ts` (800 lines) is live; `CLAUDE.md` names the retired `HARVEST_CD` anchor, a "both breed parents consumed" invariant that v2 no longer follows, "14 domain facades" (there are 22), and stale line counts; the shipped Guide contains both breeding rules (`guide-content.ts:73` vs `:356`); the Slice tool defines small-phone as 360×640 while the Glass contract says 320×568 (`slicesmoke.mjs:25751` vs `glassmatrix-evidence-contract.mjs:13`); the Compendium tool's store list is missing the `receipts` store (`compendiummem.mjs:111-113` vs `persistence/src/repository.ts:10-19`).

## 2. Findings, prioritized

### P0 — do first (small, unblock everything else)
1. **Split the CI lanes.** Agent→develop PRs get a required check of: policy selftest, `check-profile --profile=develop`, changed-input launcher selftest, the two-row Glass canary (≤ 7 min), upload. About 8–12 hosted minutes. develop→main keeps the full chain (Layout, SceneMemory, Compendium, Slice, 12-row Glass, diagnostic, Recovery, preview). Constants to move together: `tools/actions-budget-policy.js:32` (`JOB_TIMEOUTS`), `:199` (timeout equality must accept an expression), `:295-296` (`assertNamedStepTimeout` must tolerate `if:` gating), mutation anchors `:407-420`; docs `GITHUB_ACTIONS_BUDGET.md:32,46,71,1012`, `PROCESS_LAWS.md:10-13`; pins in `tests/scenemem-workflow.test.ts:322-417`, `tests/evidence-chain-tools.test.ts:470-510`, `tests/tracked-input-preflight.test.ts:477-499`. No product coverage is lost before release.
2. **One guarded infrastructure re-run, no product retries.** Step-level `continue-on-error` on the artifact upload plus a second upload and an `assert evidence archived` step; `--retry` flags on the current-Edge curl at `test.yml:572` (the pinned one already has them); a first battery step that permits `run_attempt > 1` only when the previous attempt's failure was checkout/setup/install/upload or a cancellation. Run IDs already embed `run_attempt`.
3. **Replace the 335-line jq verdict with the Node verifier** (`test.yml:189-523` → `node tools/glassmatrix.mjs --verify-run … --viewport=…`), which deletes the largest hand-mirrored key list and the `jq` dependency.
4. **Persist-queue gate is not re-checked after `await prior`** (`apps/game/src/main.ts:8500-8505` vs `:8519-8527`). Today it is safe only because of microtask ordering. Re-evaluate the same predicate inside `write` after `settleF4Heartbeat()`.
5. **Take the test harness out of the phone bundle.** `main.ts:15700-16276` (`__CF_SLICE__`, 576 lines) and ~397 `smoke*` references ship to players, including fault latches that write IndexedDB (`smokeStageStoredV4`, `:13989`). Move behind a `import.meta.env.DEV`/build-flag dynamic import.
6. **Put the art lock in CI** (`port/v2/tools/artlock.mjs` is invoked by nothing in CI) and **add one verbatim-seal test**: every `*.verbatim.js` header records `body sha256/16` of a v1 line range, and no test recomputes it; the tracked v1 source is in the repo (`test-support/tracked-v1-source.ts`). Nineteen files, one loop.
7. **Fix the two player-visible contradictions**: the double breeding rule in `guide-content.ts:73/356`, and `economy-ledger.ts` reporting `'arc3-deferred'` after Arc 3 landed.

### P1 — this month
- **Focus loss on panel refill**: `fillCharters` (`main.ts:3742`), `fillAtlas` (`:3689`), `fillRecords` (`:3619`) replace `innerHTML` after actions and drop keyboard focus to `body`; Settings already has the right pattern (`refillAndFocus`, `:2568`).
- **Layering inversion**: `@cf/scene` hosts `address.ts` (world provenance, 816 lines) and `charter.ts` (Ascent gates, 499 lines) that `domain/acquisition`, `domain/opportunity` and `persistence` import (`acquisition/src/model.ts:14`, `opportunity/src/planner.ts:47`, `persistence/src/combat-settlement.ts:66`). Move them to `domain-worldidentity` and `domain-progression` with re-exports left in scene.
- **Three `canonicalJson` implementations with different semantics** (`acquisition/src/canonical.ts:134`, `combatcore/src/combat-settlement.ts:313`, `loot/src/internal.ts:36`, the last emitting the literal token `undefined`); `isRecord` ×21 and `exactKeys` ×15 copies. Consolidate behind a fixture test proving loot digests are byte-identical first.
- **Runner-scaled budgets.** Glass has 62 `waitFor` (default 5,000 ms, equal to the product's own heartbeat period) and 24 `sleep`; Slice has 168 `sleep` (28 of them ≥ 1.5 s) and no scaling knob anywhere. Introduce one `CF_TIMEBASE` factor read in `browsercdp.mjs` and applied to every budget; drop the selftest that pins the literals (`glassmatrix.mjs:4402`). Runs 13–15 were this class.
- **Shared evidence helpers**: `sourceSnapshot` ×7, `sourceIdentity` ×6, `git()` ×8, `sha256` ×18, 18 private static servers. One `evidence-source.mjs` and `browsercdp.serveStatic()` remove ~1,600 lines and one class of drift.
- **Import, don't retype, key lists**: negative-control names are canonical in `glassmatrix-evidence-contract.mjs:27-111` but retyped in `glassmatrix.mjs:7314-7332`, `:9226-9236`, `test.yml:530-531`; research ids exist in three places (`engineering-browser-contract.mjs:11-13`, `engineering-panel.ts:13-20`, `opportunity/src/state.ts:33-40`); `COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS` is copied into six tests.
- **Windows portability**: `execFileSync('npm.cmd')` without a shell throws on Node ≥ 20.12 in `arc4recovery.mjs:1277`, `scenemem.mjs:2641`, `print-producer-authorities.mjs:176` (reuse `check-profile.mjs:57-72`); `browserpath.mjs:15-25` knows no Windows Chrome; the documented v2 chain (`port/v2/README.md:3980-4030`) is a POSIX/jq recipe with a macOS default browser path; `preflight.js` checks only the root lane.
- **Audio voice watchdog**: `audio/src/runtime.ts:1185` releases a voice only from `onended`; add an optional `maxDurationMs` enforced from the injected clock.
- **Tests reaching into the app** from a package suite (`persistence/test/combat-settlement.test.ts:79,83`); zero direct tests for `domain/naming`, `worldconfig`, `worldidentity/mint-internal.ts` (a forgery-attempt test is the single most valuable addition).

### P2 — next quarter, as extractions land
- **Phone performance** (all `main.ts`): per-frame rebuild of keyboard targets (`:8341-8418`), per-label point allocation (`:6315`, `:16391`), visual-effect policy resolved every tick (`:2467-2475`), O(stars) transition scan per frame (`:8290-8305`), a full IndexedDB commit on every navigation including zoom descents (`:6510`; use `persistSoon()`), a self-triggering ResizeObserver (`:7717-7728`), and a single eager boot chunk (`vite.config.ts` has no `manualChunks`; 23 arc/compendium/audio modules imported eagerly). Art painters allocate an 880×880 ink canvas per render and scan 774,400 pixels in JS (`speciesoverrides.ts:65-97`); `CLIPPED` (`:75`) grows unbounded.
- **Extract `main.ts`** in this order: save-authority kernel (`:731-1470`, `:1545-1665`, `:8484-8810`, `:14031-14110`; 4–5 days), slice harness (2–3 days), a generic product-action coordinator replacing the 14 near-identical commit functions (`:8821-13900`, ~3,500 lines; 6–8 days), scene renderer (3–4 days), rail panels (2 days). Each extraction turns string-pinning tests into unit tests: 58 test files (31K lines) currently assert substrings of `main.ts`.
- **Instrument diet**: selftests out of the tools into vitest fixtures (Glass is 26% selftest, browsercdp 64%, smokereport 54%, compendiummem-selftest 100%); split `slicesmoke.mjs` by arc; collapse nine `pr35-*-evidence-replay` tests into one manifest replay; delete `personaplaytest.mjs` (not in CI, measures nothing new) and `tokencheck.mjs` (never invoked) or wire the latter in; freeze `compendiummem-selftest.mjs`, the Arc 4 fixture blobs and the carriers. Targets: slicesmoke 28.5K→20K, glassmatrix 14.8K→9K, arc4-browser-contract 12K→8K, browsercdp 3.4K→1.5K, tests 96K→70K. Never remove: the 50-probe determinism fingerprint, golden seeds, save-safety fixtures, artlock, Gate A baselines, the Compendium budget and fixture, workspacelock.
- **Compendium's 39 hosted minutes** are structural: 170 thumbnail-settlement phases, 84 fill scrolls and 14 GC snapshots across two profiles, each a single-attempt probe with a 2 s command cap on a 30×-slower runner. Calibrate its ceilings on Linux, not Mac, and consider one profile on develop.
- **Documentation diet** (nothing deleted, everything moved verbatim): mandatory session-start reading is 5,856 lines of which ~600 are rules; ~12,000 lines are evidence prose pasted across 8–21 files each. Shrink `PROCESS_LAWS.md` to a law index (~300 lines) with the full text archived; turn `GITHUB_ACTIONS_BUDGET.md` and `audits/README.md` into 150-line rule/index tables with archives; strip the prepended overlays from `port/v2/README.md` (first heading at line 1,412), `V2_PROGRAM_ROADMAP.md` (line 1,034), `celestial-frontier-codebase-reference.md` (line 3,617, body describes v1.4); merge `AGENTS.md` into `CLAUDE.md` (103/104 lines identical) and the two START_HERE files; archive `port/HANDOFF_NEXT_SESSION.md` and the July review bundles into `audits/`; give every per-system reference one dated "matches code as of" line (13 of 22 have none) and label v1-only content.

### P3 — hygiene
`runtime-heartbeat-in-flight` unreachable (`main.ts:1165-1168`); alias-churn wrapper `art/src/biome-visual-profile.ts`; undeclared workspace deps in `packages/art/package.json` (`@cf/domain-genome`, `@cf/domain-planetgen`); seven `softMark` copies with two constant sets (`faunaoverrides.ts:30` vs `faunaoverrides2.ts:79`); no `vitest.config` so the 5 s default case timeout remains a trap; keyboard focus ring positioned via `left/top` per frame.

## 3. The roadmap, re-sequenced

The critical path to Gate H (feature-complete beta) and Gate I (release), in the order the dependencies and the human calendar allow:

1. **Get the real iPhone save export** and run the import readback (S). Unblocks Gate C and I; only a human can do it. Start now.
2. **CI lane split + guarded infra re-run + jq removal** (S). Ends the one-shot treadmill for every future PR.
3. **App hardening batch** (S): persist gate, harness out of bundle, panel focus, Guide copy, ledger literal, Slice viewport, artlock in CI, verbatim-seal test.
4. **Arc 3 completion** (L): connect the five research effects to reach/ship state, ship-upgrade writers, and an economy simulation tool. This is the core loop's missing beat and it gates the human first-journey review.
5. **Arc 2 completion** (M): authored loot tables and rates, natural-affix policy, ledger rejoined to Arc 3 sources.
6. **Arc 4.5 human first-journey sessions** (M, calendar-bound): two or three facilitated 30–60 minute sessions.
7. **Arc 5 remainder** (L): missions/dispatch/return, care/bond/heal, Chronicle read model.
8. **Arc 5.5 decision** (S) and the two open Arc 6 decisions (`D-ARC6-AFFIX-1`, `D-ARC6-GUARDIAN-REWARD-1`), then Arc 6 remainder (L).
9. **Training to a complete curriculum** (M).
10. **Arc 9A remainder** (M) and 9B Chronicle/Museum/share cards/projects (L).
11. **Arc 7 close-out** (M) and Arc 8 content (XL: rights-manifested assets, music/ambience, 1,010-route mapping, listening test).
12. **Living-species pipeline for Gate E** (XL) and biome/universe production plus the 1A/1C/inventory human reviews (L).
13. **Gate H closure** (product-play studies, did/saw instrument, P0/P1 triage) and **Gate I** (physical device matrix, accessibility audit, PWA physical install/rollback, monitoring and rollback plan, separate release approval).

Two process rules that follow from the evidence: freeze instrument growth (every new control is new never-hosted code, and instrument code already outweighs product code), and schedule the human gates on a calendar, because they, not automation, are now the long pole.

## 4. Suggested first three batches under the parallel protocol

- **Batch A (Claude, `anthropic/windows`)**: P0 items 1–3 (lane split, guarded re-run, jq → Node verifier), policy constants and docs updated together, plus the Windows portability fixes. Docs-only and workflow changes; the cheap lane proves itself on its own PR.
- **Batch B (Codex, `openai/mac`)**: P0 items 4–7 and the P1 focus fix, with one browser run of Slice and a targeted Glass row locally before pushing.
- **Batch C (either)**: the documentation diet, executed as moves and index tables with nothing deleted.
- Then Arc 3 research effects as the first feature batch.

## 5. What is good, so it is not lost in the list

The persistence design is better than most shipped games: revision CAS with lease heartbeats, receipts, explicit replacement transactions that quiesce the renderer before IndexedDB awaits, honest read-only fallback with player copy, corrupt/future saves treated as protected evidence, and migrations that keep the old bytes. Determinism is real: zero `Math.random` in product code, the 24 legacy sites catalogued and the 14 outcome sites routed through SessionRNG, golden seeds and the 50-probe fingerprint holding. Renderer density is heat- and memory-capped with backdrop budgeting, workers own the heavy painting, and the panels that were extracted (capture-card, engineering-panel, inventory-panel, panels.ts) show exactly the right pattern. The problem is not the quality of thought; it is that most of it lives in one untestable file, guarded by an instrument that grew faster than the product.

## 6. What this review did not do
No browser battery was run on this Windows machine (the v2 launcher does not start here and `jq` is absent); no hosted evidence was consulted beyond the retained audits; the roadmap verdicts are code-grounded but not play-tested. My `anthropic/windows` worktree was fast-forwarded to develop locally and this report was committed there only; nothing was pushed.
