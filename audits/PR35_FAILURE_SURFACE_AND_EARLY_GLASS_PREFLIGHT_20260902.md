# PR #35 failure-surface audit and early Glass preflight

Date: **2026-09-02**
Status: **local workflow successor under exact-input verification; no GitHub write or hosted attempt authorized**

## Executive finding

PR #35 did not expose thirteen unrelated game failures. The immutable record classifies the
thirteen consumed hosted stops as **9 instrument/infrastructure, 3 product/runtime, and 1 mixed**.
Every known cause from attempts 1–12 has a permanent source, workflow, ownership, or negative-
control guard and its successor code later crossed the same stage locally or in a later hosted
run. Attempt 13's bounded Glass action-evidence repair has a complete clean local Edge/CDP
certificate, but its changed live Glass path has never executed on hosted Ubuntu/Chrome.

The remaining asymmetry was ordering: the next hosted run would not exercise that changed Glass
path until after roughly **70m46s** of earlier work. A repeated Linux/Chrome-only failure could
therefore consume almost the entire run again before being discovered. The local successor adds
one conditional, noncertifying, five-minute small-phone Glass canary immediately after the shared
Chrome launcher selftest and before Layout, Compendium, and Slice. It cannot replace or satisfy the
unchanged final Slice-bound 12-viewport Glass certificate.

## Complete hosted-stop classification

| Attempt | Hosted run | Class | First terminal cause and permanent disposition |
|---:|---:|---|---|
| 1 | `33273328362` | Instrument/infrastructure | Ignored `main.js` made local tests non-hermetic and two child selftests had unsafe Linux bounds. Tests now consume tracked HTML, own hard child deadlines, and rehearse an exported tracked-only tree. |
| 2 | `33278630671` | Product/runtime | Landing crossed persistence barriers; worker build pins and BFCache fixture ownership were incomplete. The route/checkpoint and worker-client owners were repaired. |
| 3 | `33437596315` | Instrument | Compendium Back compared stale pre-helper geometry instead of the action-time witness. The helper now supplies the trusted action-time anchor. |
| 4 | `33453239307` | Instrument/infrastructure | The shared launcher did not own descendant-tree/profile cleanup. Exact process/profile lifecycle ownership and controls were added. |
| 5 | `33466661094` | Instrument sequencing | Slice issued dependent Enter before Survey reached its durable F4 fixed point; cascades followed. Dependent actions now await one exact predecessor fixed point and causal-stop on red. |
| 6 | `33522000552` | Product/runtime | Automatic travel consumed its one-shot arrival latch before the action owner accepted the attempt. Latch claims now occur behind synchronous coordinator ownership. |
| 7 | `33542791572` | Instrument | Eleven Settings flows shared one 30-second CDP command. Each action/read now has a named command, receipt, and bounded settlement. |
| 8 | `33560546382` | Instrument | Final-only audio traversal lost a valid temporal route and phone Land reused stale pre-Guide authority. The evidence path retains the live route and reacquires the exact writable fixed point. |
| 9 | `33572309149` | Mixed | Guide used fixed wheel counts, D-TRAIN sampled before convergence, and ceremony ordering had a real presentation defect. Outcome-driven scrolling, convergence ownership, and product ordering were repaired separately. |
| 10 | `33584052508` | Wrong-tier instrument | Mutable SceneMemory allocator phase remained a `develop` blocker. Native-heap certification is now production-only/quarantined while deterministic mutations stay universal. |
| 11 | `33628648136` | Instrument/infrastructure | An injected abnormal post-`Browser.close` exit could be accepted under Linux lifecycle timing. Deterministic lifecycle receipts and terminal ownership barriers now precede all browser consumers. |
| 12 | `33657402955` | Product/runtime | Inventory modal isolation covered only roots present at open. The modal now owns late roots and attribute rewrites for its whole lifetime and exactly restores them. |
| 13 | `33674116068` | Instrument | Glass overwrote its composite action verdict and reduced nonconverged settlement to `null`. Verdict composition and always-structured action/refusal/revision/binding/authority evidence were repaired. |

Result: **9 instrument/infrastructure, 3 product/runtime, 1 mixed**. The large assertion count is
not thirteen jobs: the browser-free `develop` owner runs once and most assertions finish in well
under a minute locally. The dominant wall time is the serialized real-browser chain.

## Exact late-failure exposure

Run `33674116068` began its battery job at approximately `19:34:38Z` and reached Glass at
approximately `20:45:24Z`, about **70m46s** later. Glass then failed after **68,102 ms** on its
first 320x568@2 small-phone row. Compendium consumed approximately **37m55s** of its 40-minute step
cap and Slice approximately **24m06s**. After develop Glass, the only remaining workflow operation
is always-run evidence upload; Recovery and preview are `main`-only. There is no hidden later
`develop` product stage.

The current local action-evidence successor passed a complete unchanged-source chain on Edge
`152.0.4191.53` / CDP `1.3`: Compendium **78/78**, zero-finding Slice, and exact-Slice-bound Glass
**12/12 viewports/reloads with 104/104 controls**. That proves the source and instrument on the
local browser, but it cannot by itself prove Ubuntu/Chrome parity.

## Early hosted Glass preflight contract

The `test-battery` workflow now conditionally runs `glassmatrix.mjs --viewport=small-phone` when
the exact PR diff changes a Glass tool, its runtime/build/fixture graph, application runtime source,
or package runtime source. Test-only files, declarations, documentation, `.gitignore`, package
`test/` trees, and the worker-only typecheck config do not trigger it. The scope is fail-closed for
the workflow and classifier themselves.

The preflight:

- runs on the hosted `/usr/bin/google-chrome` configuration but binds the report to the resolver's
  exact canonical real path, avoiding symlink-alias false reds;
- has a distinct immutable run ID ending in `-glass-preflight`, a five-minute step cap, no soft
  failure, and no retry;
- requires one exact `small-phone` inventory row at **320x568, DPR 2, mobile true, zero safe-area
  override**, with Google Chrome, CDP `1.3`, consistent provenance, committed unchanged source,
  terminal noncertifying PASS, exit zero, and strictly typed empty finding/failure/blocked arrays;
- requires the exact controls that own the two latest hosted classes:
  `inventory-modal-focus`, `inventory-modal-retention`, `inventory-protected-action`,
  `inventory-action-publication`, and `inventory-convergence-retry`;
- archives its unique report even when a later step fails; and
- cannot consume Slice evidence, claim certification, or alter the unconditional final
  Compendium → Slice → full Glass chain.

The prior hosted small-phone row took about 64 seconds. A recurrence of attempts 12 or 13 should
therefore stop near the front of the job, bounded at five minutes, instead of after roughly 71
minutes. A green canary adds roughly one small-phone row to the run; it is intentionally scoped to
the repeated late failure class rather than duplicating all 12 viewports.

## Negative controls and review

The workflow contract rejects a missing/reordered step, a widened timeout, changed condition,
soft-fail behavior, Slice/profile misuse, missing canonical-browser binding, any weakened verdict
clause, missing control, or missing immutable artifact. The classifier has positive cases for each
direct runtime/build/fixture input and negative cases for colocated tests, package tests,
declarations, `.gitignore`, and the worker-only typecheck configuration. A report-level jq fixture
accepts the exact canonical Chrome/320x568@2 PASS and rejects null/object evidence arrays, wrong
geometry, Edge masquerading as Chrome, wrong CDP, missing modal-focus control, source drift, and
nonzero exit.

Three independent read-only reviews found and closed four pre-run defects: omitted fixture/version
inputs, an unnecessary worker-typecheck trigger, nullable-array false greens, and the configured-
path versus canonical-browser mismatch. The final workflow/order review is **CLEAR**. Focused
workflow/scope/evidence tests pass **28/28** and the Actions budget policy selftest passes all **64**
fail-closed controls. The consolidated working-source `develop` profile passes **264/264 files,
2,739 passed / 1 skipped**, all three TypeScript programs, 34 art sources, 1,014/1,014 routes and
454 declared fields. Exact committed browser evidence is recorded only after the source is signed
and unchanged.

## Residual risk and authority

No local process can guarantee that a remote Ubuntu runner, GitHub service, or network will be
green. The remaining material hosted-only facts are: the repaired live Glass path on Ubuntu/Chrome
and normal runner/service availability. Compendium's observed ~37m55s runtime also leaves a thin
margin below its unchanged 40-minute cap. The canary converts the known late Glass uncertainty
into an early, actionable stop; it does not conceal or waive that uncertainty.

This batch changes workflow ordering, scope classification, and evidence verdicts only. It changes
no game, UI, creature, plant, biome, Guardian, world generation, loot, graphics, audio, save data,
browser-family/point-version policy, product timeout, retry count, release identity, or deployment
state. **No push, label, hosted run, PR mutation, merge, release, version bump, publication, or
deployment is authorized by this audit.**
