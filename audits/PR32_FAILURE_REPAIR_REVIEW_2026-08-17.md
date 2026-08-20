# PR #32 Failure and Repair Review

**Date:** 2026-08-17
**Repository:** `TheDakk/Celestial-Frontier`
**Pull request:** [#32 — Arc 1A measured Compendium resource gate](https://github.com/TheDakk/Celestial-Frontier/pull/32)
**Source / base:** `openai/mac` → `develop`
**Initial committed Arc 1A base:** `65b1bace57cfbbfc57acbffe55537764a382c581`
**Named product/Glass repair checkpoint:** `dea03913014bc58134ebb06ca5b36892210a7571`
**First failing Actions run:** [32015873242](https://github.com/TheDakk/Celestial-Frontier/actions/runs/32015873242)
**Status (updated 2026-08-20):** Product and Glass repairs are committed; exact dea039 Glass is 12/12. Its following exact
Compendium run `20260817150005919-93781-b6643ba7a6` truthfully failed 75/76 solely at
`desktop/warm-plateau` and exposed a pre-warm destructive-cap/incomplete-heap ruler. The fail-closed
calibration seam is committed at `4374d95be6c8b6ec2106ecd8518ac9bb39e32065`, browser-free green,
and clean under frozen read-only review. Exact baseline3 and candidate2/3/4 evidence activated da0's
replacement ruler; da0's local certification and Chrome gates passed. PR run `32334254714` then
retained a valid no-retry phone Planetside `product-unanswerable` red. The serviced-turn/bfcache
scheduler repair changes producer authority to `1c8200d7…`; the budget is now
`calibration-required` pending fresh baseline plus three-candidate calibration, activation,
certification, push, and CI. PR #32 is **not yet ready for approval**.

## 1. Executive state

PR #32 contains a substantial, independently audited Arc 1A implementation and a historical
exact-65b1bac local certification PASS. Its first Linux PR battery nevertheless found four real
approval blockers:

| CI area | Classification | Current disposition |
| --- | --- | --- |
| `v2-static` | Instrument false positive | Fixed; current audit reports 28 sources / 0 findings |
| `v2-compendium-memory` | Valid product-unanswerable findings, followed by a ruler defect and a scheduler defect | Heavy import/paint/PNG work moved to a serial close-at-idle dedicated-worker producer. Exact dea039 exposed the old invalid plateau; baseline3 plus candidate2/3/4 activated da0's strict aggregate-heap/fixed-window ruler and its local cert passed. PR run `32334254714` then proved phone Planetside target unanswerability while the browser heartbeat remained timely; source inspection identified zero-delay successor-pump starvation as the bounded repair hypothesis, not a retrospectively observed worker phase. Every repaired default pump now crosses a rendering opportunity plus later task; bfcache invalidates stale pump generations. The changed producer requires fresh calibration and certification |
| `v2-smoke` | Obsolete fixed-wait instrument check over the same cold-art path | Replaced by one monotonic semantic settlement phase with exact decode/work outcomes |
| `v2-glass` | One instrument defect plus two product finding records from one short-landscape geometry defect | Guide predicate, clipping diagnostics, hostile fixture, and nonmodal landscape workspace repaired |

The first-red evidence is preserved. No timeout was raised, no failed command was retried, and no
red was reclassified as green. The later 75/76 Compendium red is preserved too: it is evidence that
the ruler cannot adjudicate the product, not proof of either a leak or a clean plateau. The repaired
calibration seam and da0 ruler remain preserved chronology. The serviced-turn producer, fresh
calibration, and its eventual exact activation head are the next authority boundary.

## 2. What was completed before the PR battery

### 2.1 Maximum-size Compendium implementation

The committed Arc 1A source at `65b1bac` implements:

- a deterministic 1,500-row Compendium fixture;
- spacer-preserved, variable-height row virtualization;
- bounded overscan and focus-pinned row ownership;
- native visible, hidden, and ordinary-reopen filter journeys;
- exact `+1` list-generation population for each filter transition;
- identity-safe 132×132 thumbnail leases shared by Compendium and Planetside;
- cancellation of obsolete queued work on rebind, filter replacement, close, and teardown;
- deduplication, bounded caches, resource counters, and device-class caps;
- a separately owned 440×440 detail portrait removed on Back/Close;
- contained producer-error publication and exact-key recovery;
- phone and desktop raw heap, DOM, cache, lease, job, decoded-byte, encoded-byte, and warm-range evidence;
- exact source, worktree, input, fixture, budget, browser, artifact, and raw-outcome replay at verification.

### 2.2 Measured resource ruler

The then-active historical budget was derived from:

- one paired broken baseline at exact detached source
  `38447019517147319bd08c598202d097ee866874`;
- three independent, one-attempt candidate calibration runs;
- one shared Arc-local browser authority:
  - product `Edg/151.0.4129.86`;
  - revision `@083e754915c9ab93da1d8f7b9c860e4520273900`;
  - JavaScript version `15.1.23.7`;
  - CDP protocol `1.3`.

The Arc-local Edge 151 authority does not repin the repository's Gate-A Edge 150 authority. Every
phone/desktop ceiling is strictly above its three-run maximum with written headroom. The paired
broken baseline breaches the sealed eleven fields on both profiles: mounted rows, heap, DOM nodes,
live cache entries, decoded pixels, decoded bytes, encoded bytes, portrait cache entries, portrait
encoded bytes, warm heap range, and warm encoded-byte range.

**Historical correction:** this paragraph records how the earlier ruler was derived; it is no longer
active authority. Exact dea039 run `20260817150005919-93781-b6643ba7a6` showed that the destructive
desktop cap trim occurred before warm observation, so the reported plateau included refill, and the
old heap field excluded embedder/backing ownership. Those older samples and ceilings are historical
calibration only. The budget was then deliberately moved to `calibration-required`; section 6.4
records the later exact evidence that supersedes that temporary fail-closed state and activates the
replacement ruler.

### 2.3 Evidence hardening completed before CI

The browser-free selftest reached 117 independent controls. The terminal verifier now:

- binds both budget hash carriers to the exact current budget bytes;
- binds the full ordered input-hash map;
- binds source begin/end to the exact current committed source identity;
- binds the exact fixture and broken projection;
- recomputes browser-authority match instead of trusting a copied boolean;
- re-evaluated both raw complete profiles against the exact then-active budget;
- rejects stale PASS outcomes after raw heap/status/filter/producer mutations;
- accepts a truthful recomputed product FAIL;
- binds partial stage prefixes, command ledgers, timeouts, and no-retry semantics;
- distinguishes target-only unanswerability from shared transport/browser heartbeat failure.

### 2.4 Exact local certification completed before CI

The ignored local certification report
`20260817-arc1a-active-cert-65b1bac` passed at exact clean HEAD `65b1bac`:

- report SHA-256: `320a92eaf4bceee274439a07d806e9127048f4db21e2af5d1475d7587638a1e5`;
- one browser launch, one attempt, zero automatic retries;
- 76 of 76 replayed outcomes PASS;
- zero findings, zero blocked outcomes, no partial failure;
- exact Arc-local Edge authority match;
- six run-bound PNGs with verified dimensions, sizes, signatures, and hashes;
- producer error containment/recovery and all three filter journeys valid on phone and desktop.

That report remains valid evidence for its exact macOS run. It cannot override a later Linux CI red,
and it is not the separate HUMAN six-image judgment. It also cannot activate the repaired ruler,
whose chronology and heap ownership differ from the collector that produced this historical PASS.

### 2.5 Documentation and CI provisioning completed before CI

The committed batch also:

- activated the measured budget and product diagnostic status;
- provisioned exact SHA-verified Edge 151 only for the Compendium CI lane;
- retained Chrome for ordinary smoke, Glass, persona, and preview gates;
- preserved the global Edge 150 pin;
- updated the roadmap, rubrics, deviations, preview guide, UI/art references, and codebase reference;
- kept Arc 1B scene/Pixi/GPU ownership, the fresh six-image HUMAN review, physical-device heat/battery,
  Shipyard, Gate closure, and release authority explicitly open.

## 3. What the first PR battery proved

### 3.1 Checks that passed

- branch-flow policy;
- root gates.

Those successes establish that the PR branch/base relationship and legacy/root surface remained
sound. They do not excuse any of the four v2 failures.

### 3.2 `v2-static`: stale-bundle audit false positive

`npm run artaudit` reported:

> `tools/compendiummem.mjs reads the built bundle without unconditionally rebuilding it`

The collector already rebuilt both the candidate and baseline before reading/serving them. The
auditor's rule H recognizes only a literal line-starting `execSync('npx vite build'`, while the
candidate used the equivalent unconditional `execFileSync(npm, ['exec', 'vite', 'build'])` form.

**Repair:** candidate build invocation uses the repository's established literal
`execSync('npx vite build', { cwd: appDir, stdio: 'inherit' })` form. This adds no build, browser
launch, attempt, or retry. `artaudit` now passes with 28 sources and zero findings.

### 3.3 `v2-compendium-memory`: valid renderer answerability failure

Preserved report:

- file: `/private/tmp/arc1a-ci.ggozhY/compendiummem-report.json`;
- SHA-256: `0671318e05dd0b4dd4753c2d5308c32a2550f028de685b73cb9554e088eac647`;
- profile: phone;
- last completed stage: veteran Earth boot readiness;
- failing stage: Planetside thumbnail settlement.

The first Planetside settlement target evaluation missed the sealed 2,000 ms command bound at
2,002.797 ms. The concurrent root `Browser.getVersion` heartbeat completed in 5.815 ms and the
30-second phase still had roughly 28 seconds remaining. This is therefore a valid target/renderer
unanswerability finding, not a CDP transport failure, phase timeout, page exception, or retry issue.

The failure occurs before the 1,500-row fixture is installed. The saved Earth surface mounts at most
eight Planetside thumbnail leases. The failing `65b1bac` pre-repair cold path then performed all of
the following on the renderer main thread:

1. dynamically imports/parses/evaluates the heavy species-painter graph;
2. paints each deterministic 440×440 portrait synchronously;
3. some named paths allocate an 880×880 ink canvas and synchronously scan 774,400 alpha pixels;
4. downsamples to 132×132;
5. synchronously encodes PNG via `toDataURL`;
6. yields only between complete jobs through `setTimeout(0)`.

The artifact honestly narrows the cause to that cold renderer work, but cannot distinguish import
cost, one indivisible portrait, PNG encoding, or aggregate zero-delay scheduling. Raising the
timeout or merely changing timer priority would not be a robust repair.

### 3.4 `v2-smoke`: obsolete 300 ms snapshot

Smoke failed with:

> `planetside portraits did not paint: {"on":true,"n":8,"imgs":0}`

The test sleeps exactly 300 ms, then counts images only when `src.length > 2000`. It does not wait
for the actual lease outcome, validate `data-thumb-state`, validate decoded 132×132 dimensions, or
require the producer queue to drain. This is stale instrument logic over the same cold Planetside
path—not evidence of a distinct product defect.

The implemented replacement uses a bounded semantic wait: all expected Planetside images ready, exact
132×132 decode, queued/active jobs zero, immediate failure on a contained error, and preserved
renderer answerability. The test does not invent a 300 ms product SLO.

### 3.5 `v2-glass`: one control bug and two real geometry findings

#### Guide negative-control bug

The rendered Guide control removes a substring such as `up to 1,500 logical entries`, but the
Guide checker reports the full enclosing required carrier. The instrument incorrectly asks whether
the missing-carrier array includes the substring literally. The content mutation is real; the
instrument rejects its own valid negative control.

The implemented fix requires:

- the mutation actually changed rendered content;
- the needle maps to exactly one required carrier;
- the semantic Guide check fails;
- the needle is absent from rendered text;
- the exact enclosing carrier appears in the missing set;
- zero-match, multiple-match, no-op, wrong-carrier, and still-present controls all fail closed.

#### Phone-landscape Compendium geometry

At the real CI row `844×390`, DPR 2, bottom safe area 21 px, and A++ text:

- measured topbar height: 97 px;
- measured dock height: 98 px;
- pre-repair Compendium scroller: `390 - 97 - 98 - 21 - 126 = 48 px`;
- a normal A++ row needs 61 px before hostile wrapping;
- two distinct mounted rows were clipped; this was not a duplicate-node report.

The implemented repair gives an open short-landscape panel the safe viewport while
visually/hit-test hiding nonessential fixed chrome without collapsing its measured variables. It
preserves full text, variable row heights, Survey separation, safe areas, Close behavior, and
opener focus restoration. The Glass gate now carries hostile bounded content plus
first/middle/last/focus-pinned and limiting-ancestor controls so a 48 px regression fails for the
right reason.

## 4. Durable product repair implemented for the cold-art failure

The repair uses at most one serial lazy dedicated module worker at a time, not a longer deadline and
not a cosmetic scheduling delay. Each genuinely new producer burst may own a fresh instance/import.

### 4.1 Ownership split

The implemented split is:

- a lightweight main-thread broker owns leases, dedupe, queues, device limits, caches, cancellation,
  ownership, and DOM publication;
- a worker-safe painter graph owns deterministic paint/downsample/PNG/base64 work;
- one worker job is in flight at a time and the worker terminates after active work settles and its
  queue is empty;
- no synchronous renderer fallback exists;
- unsupported worker/canvas capability produces an explicit contained tile error while the UI
  remains answerable;
- existing Window-only synchronous painter APIs remain available only to audit/compatibility tools.

### 4.2 Worker protocol

Producer/job messages bind the fields applicable to their kind:

- document token;
- producer epoch;
- worker instance identity;
- monotonically increasing job id, kind (`thumb132` or `portrait440`), exact canonical visual key,
  and detached genome snapshot on render requests;
- echoed job id/kind/key plus validated dimensions, URL basis, and byte count on results;
- ordered import-start/import-complete/job-start/render-complete/encode-start/encode-complete phase
  events followed by the result, while init/ready messages bind the document/producer/worker
  instance rather than inventing a genome payload.

The worker recomputes the key before painting. The main thread validates every applicable echoed
identity, dimensions, URL basis, byte count, phase order, and active owner before accepting a
result. A once-per-worker capability preflight runs before readiness or painter import. Capability,
job-bound import, protocol, and worker failures terminate once and settle the failed active plus
queued jobs without automatic retry; content-specific paint/PNG failures remain per-job and settle
only that job. A later genuinely new request may create a fresh producer instance.

### 4.3 Boot and lifecycle law

Saved-Earth Planetside requests may queue while the broker is dormant. Activation occurs only
after the first Pixi tick, an animation frame, and the readiness witness turn. Activation with no
owners creates no worker.

- persisted `pagehide`: retain cache/leases/DOM, terminate worker, invalidate instance, and requeue
  an owner-backed active job;
- persisted `pageshow`: resume with a fresh worker only if work remains;
- replacement/non-persisted teardown: terminate, release, clear, and prevent departing-DOM writes.

### 4.4 Toolchain and ownership proof

Read-only probes established:

- TypeScript 7.0.2 exposes OffscreenCanvas and `convertToBlob` in the worker library;
- `FileReaderSync` is worker-only;
- adding `WebWorker` globals to the DOM app program causes nine source errors and is rejected;
- the worker needs a separate `tsconfig.worker.json`;
- Vite 8.2 requires direct literal `new Worker(new URL('./species-art.worker.ts', import.meta.url),
  { type: 'module', name: 'cf-species-art' })` syntax;
- Vite worker output must explicitly use ES format;
- the current full generated HD module is not worker-safe because it contains DOM/vista freight;
- a fail-closed portrait-only lifter now emits the worker graph while the existing full generated
  module stays byte-identical;
- the production build exposes exactly one reachable Window owner, exactly one dedicated module
  Worker edge, and exactly one worker-local dynamic painter import;
- index/Window imports or preloads of the worker/painter, orphan workers, duplicate edges, static
  worker imports, and a renderer-reachable legacy synchronous species-art facade all fail controls.

## 5. Repair work completed since the red

Completed in this repair batch:

1. preserved and independently classified all four first-red artifacts without retries or deadline
   changes;
2. split complete-genome identity, portable canvas allocation, deterministic painting, and the
   Window compatibility facade into explicit package owners;
3. generated the worker-safe portrait-only HD module without rewriting the full compatibility
   generator output;
4. added the serial broker, exact worker protocol/core/adapter, module-worker entry, separate worker
   TypeScript program, and ES worker build;
5. moved thumbnail and detail paint/downsample/PNG encoding off the renderer with no synchronous
   fallback;
6. retained dedupe, cancellation, device-class limits, an owned MediaQueryList change subscription
   with immediate trimming/disposal, cache ownership, bfcache suspension/resume, replacement
   teardown, stale-generation rejection, and exact-key error recovery;
7. added once-per-worker capability preflight and fatal capability/import/protocol semantics that
   settle active and queued owners exactly once;
8. bound document/epoch/instance/job/phase/result/error evidence and exact owner/worker/painter build
   identities into the Compendium raw report and terminal evaluator;
9. replaced Smoke's fixed 300 ms/src-length snapshot with exact ready/src/complete/132px/queue/active
   settlement under one immutable monotonic 30-second phase whose CDP calls are clipped to the same
   deadline;
10. repaired the Guide negative-control predicate and the short-landscape nonmodal workspace while
    preserving Search, Survey, dock, Close focus, safe areas, variable row height, and accessibility;
11. added hostile first/middle/last/focus-pinned geometry controls plus clipping-ancestor diagnosis;
12. repaired the static build audit and added exact build-graph rejection controls;
13. expanded the Compendium selftest from 117 to 184 independent controls, including worker dormant,
    identity, phase, result, fatal, decode, and renderer-legacy-path axes;
14. passed the complete browser-free battery listed in section 8.
15. preserved exact dea039 Glass 12/12 and the following exact Compendium 75/76 red without an
    unchanged retry;
16. moved destructive cap control after a full native warm-cache observation and added stable-key,
    reuse, and post-cap-restoration evidence;
17. expanded heap ownership from used page heap to used/embedder/backing-store/aggregate fields and
    reduced compact raw baseline/candidate capsules at verification;
18. changed the tracked budget to fail-closed `calibration-required` and bound the complete
    measurement inputs plus exact built owner-to-worker-to-painter authority.

## 6. Repair chronology and current ruler-calibration batch

The first repair commit is `39d326fa69512508884cb92f85dbabe765989032`. On that exact clean head,
`browserpath --selftest` and the live `browsercdp --selftest` passed under the Arc-local Edge 151
executable. The single no-retry Smoke run preserved a later instrument red after the repaired cold
Planetside path had passed:

- the canonical development bulletin now contains 47 bullets, while Smoke and Glass still expected
  44 (and their removal controls expected 43 rather than 46);
- the truthful worker copy says only detail **publishes and retains** the 440px result because a
  thumbnail job paints 440px scratch art before downsampling, while both instruments still required
  the obsolete and false “only detail renders 440px” sentence;
- both instruments omitted the required 440→132 worker-boundary clause.

The preserved Smoke report is therefore an instrument finding, not a product-copy regression. No
unchanged rerun occurred. The bounded follow-up aligns both Smoke and Glass to 47/46 and the exact
publish/retain plus downsample semantics, with independent changed/red/restored controls for each
new clause.

That follow-up is committed as `6105c6f2b5a6413e45e5c6ed4e73594ae39e98f0`. On its exact clean
head, the single Smoke run passed with zero findings (report SHA-256
`70e52e62d8ab8891462f87f6743b249e35174266ae7ac4323aac34b36628aa3a`). The first full Glass run
then retained one instrument failure and withheld one apparent product finding (report SHA-256
`f5d83a6000919a9c3275ddf16585899745443d8f1b6143fdfab325171eec154a`):

- the real Compendium control proved `243 → 48 → 243px`, but compared raw `style` serialization as
  `null` versus `""`; both carry zero declarations and no product geometry leaked;
- contrast sampled the transparent `#dock` layout wrapper using aggregate descendant text and an
  inherited white color against the worst-case white canvas. The visible glyphs are painted by dark
  child buttons; every button-level sample was clean, so that color/background pair never renders.

No unchanged full-matrix rerun occurred. The bounded instrument repair admits only absent↔empty
inline style while rejecting any nonempty leak, samples `#dock button`, and injects/restores all eight
named buttons as white-on-white to prove the full contrast selection still fires. The changed phone-landscape diagnostic
passes with zero findings/instrument failures (SHA-256
`ea97a86f7321f16b6430e8f9158f9e825038edb9bcbc0c1d217dc556bb36e6da`).

Historical follow-up checkpoint before dea039:

- branch: `openai/mac`;
- committed repair HEAD: `6105c6f2b5a6413e45e5c6ed4e73594ae39e98f0`;
- only the bounded Glass style-serialization/painted-button instrument repair and this evidence
  refresh remain uncommitted;
- the current production Vite build transforms 798 modules and passes the exact
  `index owner → dedicated worker → worker-local painter` graph audit;
- the repair commit has not been pushed;
- exact-head Smoke passed; the first full Glass retained the instrument red above; changed targeted
  phone-landscape Glass passed; full clean-head Glass and Compendium remain outstanding;
- PR #32 remains draft/not approvable.

### 6.1 Superseded checkpoint after exact dea039 browser evidence

This subsection is preserved as the then-current fail-closed checkpoint; sections 6.4 and 6.5
continue the chronology, and section 6.5 is current.

- branch: `openai/mac`;
- committed repair HEAD: `dea03913014bc58134ebb06ca5b36892210a7571`;
- exact full Glass passes all 12 rows;
- exact Compendium run `20260817150005919-93781-b6643ba7a6` is preserved as truthful 75/76 FAIL,
  solely `desktop/warm-plateau`;
- that result is not a product-leak diagnosis: the old collector trimmed the desktop cache before
  warm observation and measured refill, and its used-heap-only ruler excluded embedder/backing
  ownership;
- the current committed Compendium seam moves cap control after the full native warm cache; records
  used, embedder, backing-store, and aggregate heap; proves stable warm keys/reuse and a post-cap
  restored snapshot; replays compact raw baseline/candidate capsules; and binds complete
  measurement-input plus built-producer authority;
- `budgets/compendium-memory-v1.json` is intentionally `calibration-required`: candidate samples
  are empty, candidate ceilings are null, and the paired baseline is `measurement-required`;
- frozen read-only review and the full browser-free battery are green: 36 Vitest files / 423 passed /
  1 skipped; root, app, and worker TypeScript; artunused, artaudit, and exact production build graph;
  222 Compendium controls; 10 focused budget tests; Smoke, Glass, and persona selftests;
- one fresh paired run from exact broken source
  `38447019517147319bd08c598202d097ee866874`, three independent one-attempt current-candidate runs
  per profile, newly derived ceilings/rationale, later exact-head certification, push, and CI remain
  open;
- PR #32 remains draft/not approvable. The six-image HUMAN review and Claude presentation-polish
  pass remain separate and open.

### 6.2 First fresh paired-baseline attempt and observer boundary

The first post-seam paired-baseline attempt is preserved and was not retried unchanged. It produced
no baseline sample: one exact 132px pre-owner completion landed between the host's stable-count
`Runtime.evaluate` and the later document phase-switch command, so the collector correctly ended as
instrument failure. This was an observer-boundary defect, not baseline product evidence.

The bounded repair removes both split-command races. Before the list opener can be armed, the
document must expose a positive, at-most-eight Planetside image roster whose sources are fully
decoded at exact 440×440 and whose exact-132 scratch completion count equals that visible owner
count for one quiet second. The real opener's capture-phase listener then seals the expected
pre-owner count before the application click handler can enqueue list work. The final 1,500 list
count and quiet interval are read and sealed atomically in one document turn. Independent controls
reject N−1 owner readiness, early quiet, unrelated clicks, re-arm/re-seal, and a completion that
lands after the arm and would otherwise be laundered into list evidence.

That first attempt also ran before discovery that `/Applications/Microsoft Edge.app` had
auto-updated from the Arc-local 151.0.4129.86 build to 151.0.4129.93. No .93 sample or authority was
accepted. The exact notarized universal 151.0.4129.86 package is instead extracted into one isolated
`/private/tmp` path, without modifying `/Applications`; that same executable path is required for
the next baseline, all three candidates, and final certification. The global Gate-A Edge 150 pin
remains unchanged.

### 6.3 Exact-.86 baseline2 and first candidate warm-instrument red

Paired run `20260819-arc1a-baseline2-d0508ec` measured successfully from clean committed collector
`d0508ecc9a8f5351e893615bf2d1ec87ac011e66` and exact detached baseline `384470195…`, using the
isolated Edge 151.0.4129.86 executable. Two independent read-only audits reproduced every input,
raw metric, observer equation, cache/portrait carrier, and exactly four sealed faults per profile.
Report SHA-256 is `02cd03b5c1ed57dd67ddd0bbd3d98b93675623040fa7bd5078ee17ce73f51211`;
sample SHA-256 is `9c93692379993177f24fe16739fd06a22648d5ac8e9909d3bc2552b981233715`.

The first candidate attempt, `20260819-arc1a-candidate1-d0508ec`, was not retried unchanged. It
failed only `phone/warm-precondition` and `desktop/warm-precondition` and wrote no sample. Raw
evidence showed both native caches full, decoded pixels/bytes exactly at their product limits,
encoded bytes below limits, queues/active jobs/subscribers zero, and every worker released. The red
instead exposed two measurement assumptions:

- `keys.cached` is a truthful LRU insertion-order carrier, not a lexically sorted list;
- each warm cycle visited several disjoint catalogue windows whose combined identity set exceeds
  the phone cache cap, so repaint, disposal, and worker-instance churn were required behavior.

The bounded repair removes only the lexical-order assumption while retaining nonempty, exact-count,
unique-key and cross-cycle identity checks. After filling the full native cache, it ends on one
deterministic retained window and repeats only that window; any repaint, disposal, worker restart,
key substitution, or resource growth in the sealed last-three-cycle plateau still turns the gate
red. The first cycle remains the documented convergence point. This collector/contract change
creates a new measurement authority, so the clean baseline2 sample is preserved chronology rather
than reused. A new baseline and three candidate attempts are required; no ceiling was widened and
no product-leak/clean conclusion was taken from candidate1.

### 6.4 Exact-.86 baseline3, candidate2/3/4, and da0 replacement ruler

The replacement authority was captured without an unchanged retry. Paired run
`20260820-arc1a-baseline3-21af3fa` uses exact detached broken source
`38447019517147319bd08c598202d097ee866874`; independent one-attempt runs
`20260820-arc1a-candidate2-21af3fa`, `20260820-arc1a-candidate3-21af3fa`, and
`20260820-arc1a-candidate4-21af3fa` use clean committed collector/product source
`21af3fa2c096f0590b067c0af578d7ea29000378`. Every capsule binds measurement authority
`bb03a3af59cdcc9d4d3773c1396e58b350c27facd99943cbd22028f2236d6a1c`, producer authority
`291b794e0dcd93ee21d7ff88cbca383e865a62e8dd162573d475131aca3b911e`, and the isolated
Edg/151.0.4129.86 build. This remains Arc-local authority and does not repin Gate A's global Edge
150 browser.

The active budget embeds and replays all eight raw profile capsules. Every phone and desktop
ceiling is strictly above the corresponding three-candidate maximum, with written headroom for
variable page/embedder/backing/aggregate heap, DOM, encoded bytes, and warm range, plus fractional
or +1 sentinels for product-owned exact caps. Aggregate heap is the sum of page, embedder, and
backing-store ownership. After the native cache is filled, the fixed itinerary repeats one retained
window; the sealed last three cycles require stable unique keys and unchanged job starts,
disposals, worker starts/disposals, decoded ownership, and encoded-byte range. The paired baseline
retains all four expected faults and breaches 14 phone ceiling fields and 13 desktop fields.

This completed calibration and activated the da0 ruler. Commit
`da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` then passed local one-attempt Compendium certification
`20260820-arc1a-active-cert-da0de20` plus one no-retry Chrome Smoke, full 12-viewport Chrome Glass,
matching nine-persona synthesis, root layout 787/787 across 10/10, and a verified nonpublishable
exact-source preview. Those results remain truthful for da0 and producer `291b794e…`; the following
CI red and producer repair make them historical rather than current certification.

### 6.5 Exact da0 PR red, serviced-turn repair, and recalibration boundary

GitHub run `32334254714`, attempt 1, did not retry its red Compendium job. Report
`gha-32334254714-1-compendiummem` (preserved artifact SHA-256
`dc341790584ff370f0648113bbb81f6098ddaf0c54ba8df4de7140f8fcb68398`) binds clean detached PR
test-merge `88b9c7b0aa90b860a5474bd099cfab48b125a3f5`, exact Edg/151.0.4129.86, matching active-budget
bytes, and matching producer `291b794e…`. Phone completed 29 stages through veteran-Earth boot
readiness. At `Planetside thumb settlement`, target `Runtime.evaluate` exceeded the unchanged
2,000 ms command deadline at 2,001.723 ms while independent root-session `Browser.getVersion`
answered in 0.872 ms. The report correctly terminates `product-unanswerable`, with partial non-
certifying phone evidence and no desktop profile. It is not a browser, transport, or instrument red.

Moving paint into a worker removed the indivisible main-thread painter, but each worker completion
could publish multiple messages and let the broker's zero-delay successor pump repeatedly win over
rendering, input, and inspector work on constrained Linux. The fix keeps the deadline, serial worker,
close-at-idle lifecycle, and no-retry policy. The app's default scheduler crosses one rendering
opportunity and then one later task (`requestAnimationFrame` → `setTimeout(0)`) before every broker
pump. A monotonically invalidated pump generation rejects callbacks armed before bfcache suspension
or final disposal; resume schedules a fresh serviced turn. Focused tests cover initial and successor
pumps in both directions and the suspend/resume stale-generation edge.

That owner change produces exact built authority
`1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`: index
`f528797d1b3339291dedd5db4b768add9485e8006b1158690323ff2f5ff2769e`, owner
`assets/main-BAg-DH_f.js` at
`b12503d154d83a44c4606c31306bf756d6a35e1459877a30e6a89d423c49261f`, and unchanged
worker/painter bytes. The tracked budget is
now fail-closed `calibration-required`, with empty phone and desktop candidate arrays. Historical
baseline3/candidate2/3/4, four baseline faults, 14 phone / 13 desktop breaches, and old strict
ceilings remain valid for producer `291b794e…`; they cannot certify this repaired producer. Fresh
paired broken-baseline evidence, three independent one-attempt candidate runs, replay-derived strict
ceilings, activation, exact-head certification, push, CI, and a fresh six-image HUMAN review are
pending.

## 7. Remaining work

- finish scoped review and browser-free verification, then commit the serviced-turn scheduler,
  bfcache pump-generation repair, exact producer authority, and fail-closed budget;
- capture one fresh paired broken baseline and three independent one-attempt candidates under the
  same exact repaired producer/measurement/browser inputs; replay raw capsules, derive strict
  ceilings, activate the ruler, and commit those exact bytes;
- run the required final-clean-head browser path/CDP controls and exactly one no-retry Smoke, Glass,
  and Arc-local Edge Compendium certification battery;
- preserve and diagnose the first browser red if any rather than rerunning unchanged;
- push the exact repair head to PR #32 and require CI on that exact SHA;
- keep the separate fresh six-image HUMAN visual judgment and Claude's later visual-polish review open.

## 8. Required verification before saying “ready”

### Browser-free — historical seam/da0 activation plus current scheduler repair

- full Vitest: 36 files, 423 passed, 1 skipped;
- focused broker/portable/worker tests: 28 passed;
- root, app, and worker TypeScript programs: PASS;
- root validate, smoke, Training checkpoint, rarity, and dead-code checks: PASS;
- artunused, artaudit (28/0), overridecheck (1,014/1,014 routes), overridecontrol with byte-exact
  restoration, coveragegap (1,010/1,010), and speccheck (454/0/0): PASS;
- Smoke, 12-viewport Glass, and persona selftests: PASS;
- Compendium selftest: 222 independent controls PASS;
- focused Compendium budget tests: 10 passed;
- production Vite build: 798 modules; exact owner/worker/painter graph PASS;
- syntax and full diff checks: PASS;
- independent current-source worker/product review: CLEAN.

The frozen seam extended that repair evidence and was green under 36 Vitest files / 423 passed /
1 skipped; root, app, and worker TypeScript programs; artunused, artaudit, and the exact production
owner/worker/painter build graph; 222 Compendium selftest controls; 10 focused budget tests; and
Smoke, Glass, and persona selftests. This remains historical browser-free authority for the
fail-closed seam; da0 later received its own scoped review, commit, local certification, and Chrome
gates. Neither state certifies the current serviced-turn producer.

The da0 active-budget/documentation diff was browser-free green under 36 Vitest files /
424 passed / 1 skipped; all three TypeScript programs; 222 Compendium controls; 11 focused budget
tests; exact sample-object and raw-capsule replay; all 40 strict-headroom checks; current
measurement/producer authority; art/spec/build gates; root validate and smoke; and Smoke, Glass,
and persona selftests. Two independent read-only audits found no ceiling, schema, source-identity,
or baseline-discrimination blocker. At that checkpoint this was pre-commit activation evidence, not
the required one-attempt exact-head browser certification. Da0 subsequently received its local certification and
Chrome gates, but run `32334254714` retained the product red described above. The current scheduler
repair has focused tests for initial/successor servicing and bfcache generation invalidation; its
fresh calibration and complete exact-head browser battery remain pending.

### Browser-owning, one attempt and no retry

From the eventual committed activation head and with the correct process-owned browser selection:

1. shared browser path/CDP selftests;
2. capture and replay one fresh paired baseline plus three independent candidate raw-capsule sets;
3. derive strict ceilings, activate them, and bind the exact serviced-turn producer/budget bytes;
4. on the committed exact ruler head, run Arc-local Edge Compendium certification plus independent
   `--verify-run`;
5. Chrome `smoke:ci`;
6. full Chrome 12-viewport Glass matrix;
7. the serviced-turn and bfcache scheduler controls required by the final diff;
8. six fresh run-bound Compendium review PNG integrity checks.

If a browser gate fails, its first red is preserved and diagnosed. The batch does not gain authority
to raise deadlines, retry, regenerate a budget, or weaken a control merely to obtain green.

### GitHub handoff

Only after local terminal evidence is clean:

- update the live ROADMAP and affected references;
- commit intentionally on `openai/mac`;
- push the exact head to PR #32;
- verify CI is evaluating that exact pushed commit;
- monitor the full battery;
- retain draft status through any red/ambiguous check;
- use the normal PR-to-`develop` path only after exact-head green and the remaining required review.

## 9. Still-open HUMAN and later-arc work

Even a repaired green PR does not close:

- the fresh six-image phone/desktop Compendium visual/focus judgment;
- physical iPhone compatibility, heat, battery, and sustained-jank review;
- Arc 1B scene/Pixi/GPU resource ownership and plateau;
- the combined travel → Compendium → future Shipyard plateau;
- production release, `main`, version bump, or production deployment.

## 10. Approval recommendation at this checkpoint

**Do not approve or merge PR #32 yet.** The product and Glass repairs are committed, and da0's
replacement ruler/local certification remain truthful history. Its PR battery exposed a valid
product-answerability defect; the serviced-turn repair changes producer authority and returns the
budget to `calibration-required`. Fresh calibration, an activation commit, one exact-head
certification, push, and exact-head CI are required. A green result can make the automated repair ready for review; it still does
not substitute for the fresh six-image HUMAN judgment or Claude's later presentation-polish pass.
