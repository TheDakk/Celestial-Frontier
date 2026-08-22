# Arc 1 full review — Anthropic/Claude Code, 2026-08-22

Read-only adversarial review of the complete Arc 1 implementation, performed from a clean
`anthropic/mac` worktree against remote refs only. No checkout of the reviewed branch, no edit to
the OpenAI worktree, no file copying, no GitHub write, no label, no workflow dispatch, no PR state
change. This record exists so the findings survive the session that produced them; the claim limits
at the end are controlling.

## Exact review authority

| Field | Value |
| --- | --- |
| Repository | `TheDakk/Celestial-Frontier` |
| Pull request | [#33](https://github.com/TheDakk/Celestial-Frontier/pull/33) — draft, open, `MERGEABLE`, `BLOCKED`, no labels, no review decision |
| Base branch / SHA | `develop` / `d4ab7e671959ab80198bed22bb600a26fc3524cc` |
| Reviewed head | `origin/openai/mac` / `8b2c423bc9b1a17295d5ce9f23908e67c18a11f9` |
| Full Arc 1 range | `38447019517147319bd08c598202d097ee866874...8b2c423b` (59 commits) |
| PR-specific delta | `d4ab7e67...8b2c423b` (12 commits · 66 files · +10,426 / −673) |
| Reviewer environment | Anthropic/Claude Code on macOS, `/Users/nick/Projects/celestial-frontier-anthropic-mac`, branch `anthropic/mac` |
| Merge-base check | `git merge-base origin/develop origin/openai/mac` = `d4ab7e67…` — head is a clean descendant, fast-forwardable |

Arc 1A's 47 develop-side commits merged at `d4ab7e67…` through terminal-green hosted run
`32462323775`. This review examined Arc 1A's integration seams with the new work — teardown
ordering, the panel law, lease settlement, broker/registry ownership separation, art-lease-zero
settle predicates — rather than re-line-reviewing an already-certified range.

## Verdict

**No BLOCKER and no HIGH findings.** One MEDIUM instrument-hardening gap, three LOW
documentation/policy items. The committed evidence chain verifies under independent recomputation.
Every finding below has a bounded correction; three of the four cost nothing beyond the edit.

## Independently verified during this review

Each item was recomputed here, not read from a summary.

1. **Committed evidence hashes match.** `ARC1C_SCENEMEM_LOCAL_CERTIFICATION.json.gz` gzip
   `0d83e6ce339205beb0b5387008ca74ca9b1f95cb22bf61444c439da36405f2a6` / raw
   `e24ceef86d17fb4a47bbb10e58f81d442cac6e3def28923672448f6c47eac3a5`;
   `ARC1C_SCENEMEM_CALIBRATION_CANDIDATE1.json.gz` gzip `ada50b3c…` / raw `045b43a2…`;
   `budgets/scene-memory-v2.json` = `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`.
2. **All 21 producer-authority inputs at the reviewed head hash byte-identical to the budget's
   producer tuple.** The tracked budget therefore binds cleanly at `8b2c423b`; the later
   documentation commits (`ebede04`, `8b2c423`) changed no producer byte. `fixtureSpec` resolves
   through `COMPENDIUM_FIXTURE_SPEC_PATH` to `port/v2/tools/fixtures/compendium-1500-v1.json`
   (`c5792c2c…`), not a literal `compendiummem-fixture-spec.json`.
3. **The certification report is internally honest.** Its raw `measured[]` snapshots agree
   field-for-field with the derived `cycles[]` (0 mismatches across both profiles on
   `documentToken`, `sceneGeneration`, `managedTextureCount`, `managedTexturePixels`,
   `localCanvasCacheEntries`, `ringCacheEntries`, `peakRingGeometryEntries`,
   `shipyardPreviewActiveCount`, `heap.usedSize`, `dom.nodes`); 42/42 outcomes pass; 4 cycles per
   profile. The replay this review performed is exactly the one the verifier omits — see MEDIUM-1.
4. **The 42-outcome contract is not vacuous.** Positive-peak witnesses
   (`peakLocalCanvasCacheEntries === 0` fails, `peakRingGeometryEntries > 0` required),
   populated-scene floors per route, `pending === 0` across every point, per-field just-below
   negative controls for every budget field, zero-field point mutations, and strict headroom over
   the three-candidate maxima.
5. **The browser gates drive real input.** `glassmatrix.mjs` and `slicesmoke.mjs` open and close
   the Shipyard with dispatched mouse/touch events plus a capture-phase pointer receipt binding the
   exact button id and pointer type; `scenemem.mjs` uses `clickVisible` against
   `#dockshipyard,#railshipyard` and `#shipyardpanel [data-pnx="shipyard"]`. Tamper controls
   (duplicate preview, tampered `data-state-key`, injected hardpoint/system rows, hidden opener,
   undersized Close, retained-after-close clone) each assert both the red **and** the restoration.
6. **Workflow delta is fail-closed.** `test.yml` remains `pull_request: types: [labeled]` with an
   owner-gated authorize job; the Arc 1C additions are serial steps inside the one battery job with
   a SHA-pinned Edge `.101` package, `timeout-minutes: 10`, one attempt, always-verify, and no
   `continue-on-error` / `--calibrate` / `--allow-dirty` in the owned span.
   `scenemem-workflow.test.ts` negative-controls every ordered token and every zero-default
   authorization token. All four other workflows are `workflow_dispatch` with `DO_NOT_RUN`
   defaults.
7. **Determinism and save compatibility are intact.** No `Math.random` / `Date.now` in any new
   product file. No root-game bytes, no `port/v2/packages/persistence` bytes, and no save-schema
   change in the PR delta. `ShipVisualState` is a pure projection with no persisted field;
   `shipVisualStateOf` and travel's `ascStageOf` agree on the sanitized item domain (import clamps
   counts to `[0,999]` at `import-v2.ts:558`, so no `count > 0` divergence is reachable).
8. **No preview-leak path through panel switching.** `panels.ts` fires `onClose` on every
   visible→hidden transition — one-panel switch, tap-empty, delegated `✕`, and Escape — and
   `loadSave`'s intentional-replacement teardown calls `closeShipyardSurface()` before
   `app.destroy`.

## Verified defects

### MEDIUM-1 — the verifier never replays the retained raw observations

- **File / line:** `port/v2/tools/scenemem.mjs:1507` (inside
  `verifyReport`, from line 1449); committed-evidence test
  `port/v2/tests/scenemem-budget.test.ts:253`.
- **Observed defect:** `verifyReport` binds `contractInput.profiles` to
  `report.profiles[].{precondition, cycles, bfcache}`. Those are *derived carriers* produced by
  `contractPoint()` during collection. The raw `measured[]` snapshots are retained in the report and
  their count is checked (`scenemem.mjs:1471`), but **no verifier re-derives `cycles[i]` from
  `measured[i]`, or `precondition` from the retained `warmup` snapshot**. `metricSummary`
  recomputation in the budget test also operates on `cycles`, not `measured`. A post-run edit of
  `cycles` + `contractInput` + `outcomes`, kept mutually consistent, passes `--verify-run` and the
  7/7 evidence test while contradicting the raw observations the report itself carries.
- **Law it sits against:** PROCESS_LAWS, *A MEASURED RULER OWNS ITS EXACT AUTHORITY AND MUST REPLAY
  RAW EVIDENCE* — "Never trust a copied PASS boolean, hash, metric summary, or outcome row as a
  substitute for the bytes or observations it summarizes; require every repeated carrier to agree
  and negative-control each one independently."
- **Why existing tests do not catch it:** `scenemem-tool.test.ts` negative-controls outcome-inventory
  duplication, laundered certification, stale browser/producer authority, and build-graph
  substitution — but no control mutates a `cycles` field while leaving `measured` intact, because
  nothing in the suite treats `measured` as authority.
- **Not evidence-invalidating:** this review recomputed the raw↔derived agreement for the committed
  certification and found 0 mismatches. This is instrument hardening, not a retroactive red.

**Two corrections, with materially different cost. Read this before choosing.**

| | Cheap fix (recommended now) | Full fix (defer) |
| --- | --- | --- |
| Where | `port/v2/tests/scenemem-tool.test.ts` (**not** producer authority) | `verifyReport` in `scenemem.mjs` (**is** producer authority — `collector`) |
| Covers | The committed calibration/certification evidence, permanently | Every future run at verify time |
| Cost | Free — no hashed producer byte changes | Changes the `collector` hash, breaking `assertBudgetBinding`, the budget's `authority.producer.collector`, and `EXPECTED_PRODUCER_AUTHORITY.collector` — which the three committed calibration reports and the certification also carry, so it forces a **fresh calibration set** |

- **Recommended smallest correction now:** in `scenemem-tool.test.ts`, load each committed
  gzip report, re-derive the contract projection from each `measured[i]` and the retained `warmup`
  snapshot, and require byte-equality with `cycles[i]` / `precondition`.
- **Required negative control:** a fixture whose `cycles[0]` has one edited field (raw `measured`
  untouched, `outcomes` left consistent) must fail; the unedited committed report must still pass.
- **Follow-up, amortized:** fold the `verifyReport` raw-replay in the next time `scenemem.mjs`
  changes for another reason, so one re-calibration pays for both. Do not spend a calibration set on
  this alone.

### LOW-2 — handoff misattributes the HD-backing witness to Slice Smoke

- **File / line:** `ROADMAP.md:86-87` at `8b2c423b` — "Real-browser Slice Smoke:
  terminal `SLICE SMOKE: PASS`, including the real Shipyard open/read/owned-Close leg **and attached
  Earth HD backing witness**".
- **Observed defect:** `slicesmoke.mjs` at head contains no surface-HD or backing assertion — no
  `surfaceCurrentBacking*`, `surfaceCurrentTierPx`, `surfaceTextureOwnerActive`, or tier reference
  anywhere in the file. The attached-backing witness
  (`surfaceCurrentBackingWidth/Height === expectedTierPx`, phone 768 / desktop 1024) exists only in
  `scenemem.mjs`'s surface-settlement wait. Slice Smoke does own the real Shipyard leg; only the HD
  clause is misplaced.
- **Why existing tests do not catch it:** no instrument compares handoff prose to tool contents.
- **Smallest correction:** attribute the backing witness to the scene-memory route in that bullet.
- **Verification:** re-read; no code change.

### LOW-3 — one superseded handoff was never archived

- **File:** `ROADMAP_ARCHIVE.md` at `8b2c423b`; introduced by commit
  `49b872e` ("docs: record PR 32 terminal-green merge", `ROADMAP.md` 53+/53−, archive untouched).
- **Observed defect:** develop's live handoff at the merge base — `▶▶▶ SESSION HANDOFF —
  2026-08-20 · PR #32 ATTEMPT 2 RED · CROSS-HOST RULER REPAIRED LOCALLY ◀◀◀`, present at
  `d4ab7e67…` — was refreshed in place and appears **nowhere** at the reviewed head. Its title has
  zero matches repo-wide; the archive's newest-first chain jumps from `2026-08-21 · PR #32 MERGED`
  (line 136) to `2026-08-20 · PREVIEW BROWSER-CONTRACT REPAIR` (line 235). Ten other same-day
  PR #32 handoffs were archived verbatim; only 30 of its 77 non-blank lines survive, scattered
  inside the later "PR #32 MERGED" block. This is against the pinned ROADMAP HYGIENE rule —
  "superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with nothing deleted" — and the
  standing doc-hygiene law.
- **Why existing tests do not catch it:** doc hygiene has no instrument.
- **Smallest correction:** insert the `d4ab7e67…` ROADMAP handoff block verbatim between those two
  archive blocks. Recover it with
  `git show d4ab7e671959ab80198bed22bb600a26fc3524cc:ROADMAP.md`.
- **Verification:** after the fix, `git grep -c "PR #32 ATTEMPT 2 RED"` returns exactly one match, in
  the archive.

### LOW-4 — `pendingPreviewWork` is a constant with no source-policy backing

- **File / line:** `port/v2/apps/game/src/main.ts:1522` —
  `pendingPreviewWork: 0` inside `shipyardDiagnostics()`.
- **Observed defect:** the contract asserts `openPendingPreviewWork === 0` and
  `closedPendingPreviewWork === 0` (`scenemem-contract.mjs`, `shipyardWitnessReasons`), and
  `diagnosticResourceReasons` asserts it at every settled point — all vacuously, because the
  diagnostic is a literal. It is truthful today: the SVG preview is fully synchronous. But unlike
  its sibling constant `productRenderTargets: 0` (`main.ts:3672`), which is backed by the
  source-policy assertions in `scene-texture-owner.test.ts` banning `RenderTexture`,
  `generateTexture`, and stray `Texture.from`, **nothing prevents `shipyard-preview.ts` from
  acquiring asynchronous work.** A future timer, decode, or fetch would keep "zero pending preview
  work" green while pending work exists — the round-10 *a check only sees the axis it measures*
  trap, pre-staged.
- **Why existing tests do not catch it:** every Shipyard control tampers with DOM nodes; none
  tampers with pending work, which cannot currently exist.
- **Smallest correction:** add one source-policy assertion to
  `port/v2/tests/ship-visual-integration.test.ts`
  (**not** producer authority, so free): `shipyard-preview.ts` contains no `setTimeout`,
  `requestAnimationFrame`, `Promise`, `async`, `await`, `fetch`, or `new Image` token — making the
  constant an asserted inventory the way `productRenderTargets` already is.
- **Required negative control:** inject one such token into a copied source string and confirm the
  assertion fires.

## Questions and optional observations

No action required; recorded so they are not rediscovered as findings.

1. `exactMode` in `scenemem.mjs` compares `value.mode` and `value.sceneMode`, but
   `routeStateExpression()` sources both from `nav.mode` (`s.mode` and `r.mode`) — a near-vacuous
   double-read. Harmless: every other field in the settle predicates is independently sourced.
2. `sceneResourceDiagnostics().pendingPersistenceWrites` counts `activePersist` but not
   `importWriteInFlight`. Unreachable on the driven route.
3. The handoff's local counts (49 test files / 567 passed / 1 skipped, typechecks, Slice Smoke and
   Glass PASS) are plausible — 49 `*.test.ts` files confirmed at head — but are not re-executable
   read-only from another worktree. The required exact-head hosted battery re-proves them, which is
   already the plan.

## Claim limits

This review claims no hosted CI, no HUMAN visual judgment, no Gate closure, no release readiness,
and no deployment authority. Arc 1A's six-image Compendium review and Arc 1C's phone/desktop
silhouette and caption readability review both remain open HUMAN work. PR #33 remains draft and
unlabeled; a fresh exact-head `test-battery` attempt still requires Nick's separate authorization
naming workflow, PR, full head and base SHA, runner ceiling, and the one-attempt/no-retry stopping
rule.

## Handoff to OpenAI/Codex

Read this file from the pushed Anthropic ref without checking it out or copying it:

```bash
git fetch origin && git show origin/anthropic/mac:audits/ARC1_CLAUDE_REVIEW_2026-08-22.md
```

Suggested resolution order on `openai/mac`, all four bounded:

1. **LOW-3** — restore the missing handoff block verbatim into `ROADMAP_ARCHIVE.md` (docs only).
2. **LOW-2** — correct the Slice Smoke / scene-memory attribution in the `ROADMAP.md` handoff.
3. **LOW-4** — add the `shipyard-preview.ts` async source-policy assertion plus its injected
   negative control (test only; no producer hash changes).
4. **MEDIUM-1** — add the raw↔derived replay to `scenemem-tool.test.ts` over the committed evidence
   plus a tampered-`cycles` fixture (test only; no producer hash changes). **Do not** put it in
   `verifyReport` in this batch unless a re-calibration is being run for another reason.

None of the four changes a hashed producer input, so the active
`budgets/scene-memory-v2.json` authority and the three committed calibration reports remain valid
and no re-calibration is required. Re-run the proportionate checks for what each touches, then
request the one exact changed-head hosted authorization.
