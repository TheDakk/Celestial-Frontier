# PR #32 Failure and Repair Review

**Date:** 2026-08-17
**Repository:** `TheDakk/Celestial-Frontier`
**Pull request:** [#32 — Arc 1A measured Compendium resource gate](https://github.com/TheDakk/Celestial-Frontier/pull/32)
**Source / base:** `openai/mac` → `develop`
**Committed repair base:** `65b1bace57cfbbfc57acbffe55537764a382c581`
**First failing Actions run:** [32015873242](https://github.com/TheDakk/Celestial-Frontier/actions/runs/32015873242)
**Status:** Product/instrument repairs are implemented and browser-free green in the working tree;
the clean committed browser battery, push, and exact-head CI are still pending, so PR #32 is **not
yet ready for approval**.

## 1. Executive state

PR #32 contains a substantial, independently audited Arc 1A implementation and an exact-current
local certification PASS. Its first Linux PR battery nevertheless found four real approval blockers:

| CI area | Classification | Current disposition |
| --- | --- | --- |
| `v2-static` | Instrument false positive | Fixed; current audit reports 28 sources / 0 findings |
| `v2-compendium-memory` | Valid product-unanswerable finding | Heavy import/paint/PNG work moved to a serial close-at-idle dedicated-worker producer; evidence and controls implemented |
| `v2-smoke` | Obsolete fixed-wait instrument check over the same cold-art path | Replaced by one monotonic semantic settlement phase with exact decode/work outcomes |
| `v2-glass` | One instrument defect plus two product finding records from one short-landscape geometry defect | Guide predicate, clipping diagnostics, hostile fixture, and nonmodal landscape workspace repaired |

The first-red evidence is preserved. No timeout was raised, no failed command was retried, and no
red was reclassified as green. The implementation now passes the full browser-free battery and an
independent source review; clean-head browser execution remains the next authority boundary.

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

The active budget was derived from:

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

### 2.3 Evidence hardening completed before CI

The browser-free selftest reached 117 independent controls. The terminal verifier now:

- binds both budget hash carriers to the exact current budget bytes;
- binds the full ordered input-hash map;
- binds source begin/end to the exact current committed source identity;
- binds the exact fixture and broken projection;
- recomputes browser-authority match instead of trusting a copied boolean;
- re-evaluates both raw complete profiles against the exact active budget;
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
and it is not the separate HUMAN six-image judgment.

### 2.5 Documentation and CI provisioning completed before CI

The committed batch also:

- activated the measured budget and product diagnostic status;
- provisioned exact SHA-verified Edge 151 only for the Compendium CI lane;
- retained Chrome for ordinary smoke, Glass, persona, and preview gates;
- preserved the global Edge 150 pin;
- updated the roadmap, rubrics, deviations, preview guide, UI/art references, and codebase reference;
- kept Arc 1B scene/Pixi/GPU ownership, the six-image HUMAN review, physical-device heat/battery,
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

## 6. Current working-tree state at this checkpoint

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

Current follow-up state:

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

## 7. Remaining work

- finish the live handoff/reference refresh without claiming visual polish, a release, or browser
  authority;
- perform final frozen-diff review, fetch/reconcile current remote state, and commit intentionally on
  `openai/mac`;
- run the required clean-head browser path/CDP controls and exactly one no-retry Smoke, Glass, and
  Arc-local Edge Compendium battery;
- preserve and diagnose the first browser red if any rather than rerunning unchanged;
- push the exact repair head to PR #32 and require CI on that exact SHA;
- keep the separate six-image HUMAN visual judgment and Claude's later visual-polish review open.

## 8. Required verification before saying “ready”

### Browser-free — complete on the current working tree

- full Vitest: 36 files, 423 passed, 1 skipped;
- focused broker/portable/worker tests: 28 passed;
- root, app, and worker TypeScript programs: PASS;
- root validate, smoke, Training checkpoint, rarity, and dead-code checks: PASS;
- artunused, artaudit (28/0), overridecheck (1,014/1,014 routes), overridecontrol with byte-exact
  restoration, coveragegap (1,010/1,010), and speccheck (454/0/0): PASS;
- Smoke report and 12-viewport Glass selftests: PASS;
- Compendium selftest: 184 independent controls PASS;
- production Vite build: 798 modules; exact owner/worker/painter graph PASS;
- syntax and full diff checks: PASS;
- independent current-source worker/product review: CLEAN.

### Browser-owning, one attempt and no retry

After a clean commit and with the correct process-owned browser selection:

1. shared browser path/CDP selftests;
2. exact Arc-local Edge Compendium run plus independent `--verify-run`;
3. Chrome `smoke:ci`;
4. full Chrome 12-viewport Glass matrix;
5. any additional boot/art-scheduler gate required by the final diff;
6. six run-bound Compendium review PNG integrity checks.

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

- the six-image phone/desktop Compendium visual/focus judgment;
- physical iPhone compatibility, heat, battery, and sustained-jank review;
- Arc 1B scene/Pixi/GPU resource ownership and plateau;
- the combined travel → Compendium → future Shipyard plateau;
- production release, `main`, version bump, or production deployment.

## 10. Approval recommendation at this checkpoint

**Do not approve or merge PR #32 yet.** The Linux findings now have implemented, independently
reviewed, browser-free-green repairs. The remaining approval boundary is empirical: commit these
exact bytes, run the one-attempt/no-retry browser battery, push that exact head, and require exact-head
CI. A green result can make the automated repair ready for review; it still does not substitute for
the six-image HUMAN judgment or Claude's later presentation-polish pass.
