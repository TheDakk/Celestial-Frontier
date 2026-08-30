# GitHub Actions Budget Protocol

**Current mode: `UNFROZEN`**

**Hosted attempt state: none authorized.** Draft PR #35 has two consumed terminal-red
`test-battery` attempts against base `7a9f4c1370dd84292388d718c38ff34214f6203b`, each guarded by
`actions-budget-approved`, a 92-minute maximum and the one-attempt/no-retry rule. Run
`33273328362` tested head `390e8708086d413fc7d636441ec0523cf9d4b9ea` and stopped in the
browser-free suite on untracked-input and bounded-child defects. Run `33278630671` tested repaired
head `017fa6decbc41809188768ccdb98ab86ef1b9ebc`; every predecessor through SceneMemory controls
passed, then the one-attempt phone SceneMemory product stage stopped at `Earth planetfall was
rejected`. Both labels are absent, PR #35 remains Draft/unmerged, and no retry or replacement
attempt is authorized. Current repairs remain local/unpushed until their complete local evidence,
references, source-authority records, and signed commit are finished. PR #34 runs
`32665404776` and `32677088518` are
consumed terminal-red; their Compendium interaction-ruler evidence is retained and both approval
labels were removed. Its repaired third authorized changed-head attempt, run `32681394532`, passed
terminal-green in one attempt/no retry (50m10s), had its label removed, and merged normally as
`7a9f4c1370dd84292388d718c38ff34214f6203b`. No replacement attempt is authorized. PR #33's fifth and
final authorized changed-head attempt,
run `32646110946`, passed terminal-green (one attempt, no retry; battery 50m29s), its label was
removed, and it merged normally into `develop` as `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e`.
Runs `32609389977`, `32611053651`, `32614177932`, and `32618995487` remain consumed terminal-red
historical evidence; their labels were removed. Details are below.

**Repository billing state: public as of 2026-08-20.** Standard GitHub-hosted runners are free while
the repository remains public; larger runners and storage are separate billable surfaces. Nick
initially set this mode after exhausting the private-repository monthly allowance of **3,000**.
Treat 3,000 as the hard cap whenever the repository is private or billing status is ambiguous.
Nick lifted `FROZEN` on 2026-08-20 for the bounded PR #32 integration preparation. Hosted work is
still batched and owner-authorized rather than fired on every edit; lifting the freeze does not by
itself authorize a hosted attempt. Only Nick may change this mode, visibility assumption,
private-repository cap, or authorize one exact hosted run.

## What `FROZEN` means

- Do not dispatch, rerun, cancel-and-restart, or otherwise cause a GitHub Actions workflow to run.
- Do not push to an open pull-request branch, merge to `develop` or `main`, apply the battery label,
  publish a preview/site, or make an empty “CI kick” commit. Those operations may create hosted work.
- Continue implementation, review, tests, exact-head browser evidence, and commits locally. Batch
  finished work into one frozen head instead of publishing every intermediate commit.
- Missing hosted checks remain blockers. Exhausted budget is never permission to bypass branch
  protection, reuse stale evidence, merge a red/unfinished PR, or call local evidence “CI.”
- A monthly reset is never inferred from the calendar. The mode remains `FROZEN` until Nick says
  otherwise in the current task; Nick lifted it on 2026-08-20. Every hosted attempt still requires
  its own exact authorization.
- A locally activated ruler or terminal-green exact-head local battery does not change `FROZEN` or
  authorize a push, label, hosted run, merge, publication, or deployment.

Git fetches and read-only GitHub metadata do not consume runner minutes, but agents should not poll
GitHub repeatedly while frozen. No GitHub write is allowed merely because it is cheap.

## Agent token conservation

This efficiency rule applies equally to OpenAI/Codex and Anthropic/Claude Code:

- use the shortest update that preserves decisions, evidence, blockers, and the exact next action;
- read only the live handoff and references needed for the scoped change; do not replay archived
  history or repeat unchanged audits/status;
- batch independent reads and checks, delegate only concrete bounded work, and avoid parallel agents
  when coordination would cost more than the task;
- stop when the stated acceptance checks pass; do not open another diagnostic, rewrite, or polish
  loop without a new finding;
- ask Nick before a broad exploratory or rework loop whose token cost is materially larger than the
  scoped implementation.

## Hosted workflows are fail-closed

The guarded design reached `develop` in PR #32 merge commit
`d4ab7e671959ab80198bed22bb600a26fc3524cc`. Ordinary pushes, PR synchronization events, branch
merges, and successful batteries now start **zero hosted runners by default**:

- `.github/workflows/test.yml` has one tiny, two-minute owner/branch authorization job followed by
  one fail-fast serial battery. The battery is eligible only when the repository owner adds exact
  label `actions-budget-approved` to a PR and the branch/fork authorization succeeds. Only that
  successful dependency may emit the required `battery` check name; rejected/skipped events use
  `budget-not-authorized`. Static/root checks run before Edge/Chrome work, each dependency tree
  installs once, and the first red stops later work. The shorter 10-minute SceneMemory ruler now
  owns the first version-tolerant isolated Edge extraction and runs before the 40-minute Compendium
  chain. Compendium separately SHA-verifies its sealed `.101` package, validates package/version
  metadata, and extracts it under `RUNNER_TEMP`; its preflight, certificate and named verifier each
  pin that extracted executable directly, so neither ruler installs, downgrades or inherits the
  runner's system Edge. The separate authorization job preserves the
  Compendium owner's no-`if` contract; SceneMemory's direct order and no-soft-fail behavior are
  independently controlled.
- `branch-flow-guard.yml`, `sync-agent-branches.yml`, and `dev-preview-package.yml` are manual-only
  and default to `DO_NOT_RUN`. Their runner-owning authorization also requires the repository owner;
  preview uses the same tiny authorize→sealed-owner dependency as the main battery. Its browser
  artifact leg must extract and named-verify the exact immutable Slice ID, pass that ID to Glass,
  named-verify the resulting Glass/Slice pair and retain all immutable carriers before persona and
  packaging work. A bare `npm run glassmatrix` is structurally rejected. This artifact-only workflow
  does not run or claim the separate uninterrupted 20-minute Recovery certificate.
- The active `develop` ruleset requires only the terminal-green `battery` context, normal merge
  commits, resolved threads, and an up-to-date head. It has no required review count, no extra
  unattributed-change approval, and no required `Approved branch flow` context. The latter remains
  an optional manual diagnostic and must not be dispatched merely to unblock a green PR.
- `publish-branch-sites.yml` is manual-only and additionally hard parked. Neither production nor
  development publication can run until a later reviewed exact-SHA promotion contract removes its
  explicit false guard.
- Every workflow partitions concurrency by authorization and actor. An unrelated/default/non-owner
  event cannot cancel an owner-authorized run. A genuine duplicate authorization cancels the older
  run instead of allowing two hosted batteries to continue; protocol still treats that cancellation
  as a consumed attempt and forbids replacement without a changed head and fresh authorization.

The local gate is:

```text
node tools/actions-budget-policy.js --selftest
```

It inventories every workflow, parses direct YAML ownership by indentation, rejects unknown/quoted
workflow keys and automatic triggers, requires false-default owner-only manual authorization, binds
the authorize result to the required battery name, seals standard runners/time ceilings/no-matrix
execution, proves publication remains parked, and mutation-tests every job guard. `node
tools/validate.js` also runs the real policy check before the normal validation battery.

## Authorized PR #32 attempts after the freeze

Nick lifted `FROZEN` on 2026-08-20. He authorized one `test-battery` attempt for PR #32 head
`6e33b3d01b25889f3f5894aa221c28a0f44bc239` against base
`38447019517147319bd08c598202d097ee866874`, using `actions-budget-approved`, with a 92 runner-minute
ceiling and no retry. Run `32440536261` attempt 1 failed during root validation before browser work:
the mode declaration had been changed to prose the policy parser could not accept. The label was
removed immediately. That attempt is consumed.

Nick then authorized one new changed-head `test-battery` attempt for head
`e9b04d5d515ce09363971f912603720f820de7f1` against the same base, with the same label, 92-minute
ceiling, and no retry. Run `32441023665` attempt 1 completed in 33m43s. Root validation, Smoke,
legacy Field Training capture, 10-viewport layout, v2 parity/type/art/coverage, exact Edge install,
and browser/instrument selftests passed. Compendium produced a complete 78-outcome report: 75 passed;
phone warm aggregate range was 97,320 B against 65,536 B, and Linux encoded the one retained portrait
at 220,530 B against 196,608 B on phone and desktop. Every other resource/lifecycle/heap/DOM/
answerability field passed. Report SHA-256 is
`a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36`; exact diagnosis and the
committed compressed raw report are preserved under `audits/`. The label was removed immediately. The run is
terminal red, consumed, and must not be rerun; PR #32 was not merged.

Nick then authorized one new changed-head attempt for head
`c68aee241220dcb720cadb7fc55f7fbf99bde6fb` against the same base and bounds. Run `32462323775`,
attempt 1, completed terminal-green: authorization passed in 2s and the battery passed in 40m39s.
Root validation, Smoke, Field Training capture, 10-viewport layout, v2 parity/type/art/coverage,
exact Edge authority, Compendium certification and evidence verification, Chrome selftests,
real-browser Smoke, 12-viewport Glass, persona synthesis, preview packaging, and every artifact
upload passed. The label was removed, the PR was re-read as clean/mergeable at the exact head/base,
and PR #32 merged normally as `d4ab7e671959ab80198bed22bb600a26fc3524cc`. The push also completed
the base branch's then-automatic branch-flow guard in 3s; the merged guard is now manual-only. No
retry or additional `test-battery` ran. No further hosted attempt is authorized.

## Authorized PR #33 attempts

Nick authorized one changed-head `test-battery` attempt for PR #33 head
`5ce92fc458d0d6acc9e389f94a2f2e5ffcbfa1fd` against base
`d4ab7e671959ab80198bed22bb600a26fc3524cc`, using `actions-budget-approved`, with a 92 runner-minute
ceiling and no retry. Run `32609389977`, attempt 1, authorized in 3s and completed terminal-red in
3m39s. Root validation, Smoke, Field Training capture, 10-viewport layout, evidence freshness,
rarity sanity, dead-code scan, and v2 install passed. All 571 v2 tests and all typechecks also passed
inside the failing step, but `artaudit` then emitted D-ART-36 against `tools/scenemem.mjs`: its static
ruler recognized only the legacy `execSync('npx vite build')` spelling and missed SceneMemory's real,
unconditional `execFileSync(npm, ['run', 'build'])`. Later Edge/Chrome/browser gates were correctly
skipped. The approval label was removed immediately; the run is consumed. At that point PR #33 was
still draft and unmerged; no retry was authorized.

Nick then authorized the push of changed head
`27b965870c8e831d8b42a0346cf86c112998c15e` and one new attempt against the same base, label,
92-minute ceiling, and no-retry rule. Run `32611053651`, attempt 1, authorized in 4s and completed
terminal-red in 6m11s. The repaired D-ART ruler and all preceding root/v2 gates passed. The
Compendium instrument failed closed before measurement because the active pre-Arc-1 budget expected
producer `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`, while the current
Arc-1 index/owner built producer
`5a316197d9aca27967f4e930f43089d2bbe2b9e4a66a40c207ea59c809405d94`. Worker and painter bytes
were unchanged; the owner/index change is still producer authority and cannot reuse or rebind old
ceilings. Later browser gates were skipped. The label was removed immediately; this attempt is
consumed. At that point PR #33 remained draft and unmerged, and no future hosted attempt was
authorized.

The local repair batch reopened and freshly calibrated Compendium under the current Arc-1 producer
and exact Edge `.101`, then updated both guarded hosted workflows and the fail-closed preflight from
the stale `.86` package URL/SHA/version tuple to the budget's exact `.101` tuple. Clean source
`63107f656c4623f1b9c2df922346e6bc08f601b6` passed Compendium 78/78, SceneMemory 42/42, both named
verifiers, the complete root/v2/browser battery, and all workflow/policy selftests. It remains local;
a new exact changed-head authorization is still required. Neither consumed run may be retried.

Nick then authorized exact head `ebfc3bfa5e1cac722788c8ce104f80c0408ff3f9` against the same base,
label, 92-minute ceiling, and no-retry rule. Run `32614177932`, attempt 1, authorized and reached the
fresh `.101` Compendium measurement after every earlier root/v2/static gate passed. Desktop passed.
The phone focus-pinned point sampled `cmem-0740` and `cmem-0743` as 0×0 placeholders with exactly two
live subscribers: the collector had proved the prior window ready, then its own mandatory renderer
turn remounted a fresh normal window before snapshot. Every other byte/pixel/cache/queue/lease/
portrait ceiling passed; the one paint error was the gate's intentional, recovered negative-control
job. The run is terminal-red and consumed, and its label was removed immediately. At that point PR
#33 remained Draft and unmerged; no retry was authorized. The local bounded repair consumes
the deferred virtual-window render turn and re-proves decoded thumbnail settlement before the
unchanged GC/snapshot sequence. Clean collector source `14626a7…` was recalibrated in exactly three
current-product candidates plus one paired legacy baseline, each one attempt with zero retries. The
strict active budget is SHA-256 `28b95867…`; independent source `e8898bf…` then passed 78/78 with
complete lifecycle and named verification. Evidence-bound descendant `d359d8c…` passed the complete
local root/v2/browser battery, including SceneMemory 42/42, Slice Smoke, Glass 12/12, nine personas,
and origin-isolated preview smoke. This local green does not authorize a push, label, hosted run,
Ready transition, or merge.

Nick then authorized exact head `bd3e65bfd99b91e556ff27b5dd028fe92f447227` against base
`d4ab7e671959ab80198bed22bb600a26fc3524cc`, with the same label, 92-minute ceiling, and no-retry
rule. Run `32618995487`, attempt 1, completed Compendium 78/78 and then terminal-red SceneMemory
40/42; only `phone/answerability` and `desktop/answerability` failed. All twelve targets retained the
same document, advanced the Pixi ticker, and completed below the unchanged 2,000 ms transport
deadline, while Linux rendered turns took 493–647 ms against the Mac-selected 250 ms ceiling. The
label was removed; the run is consumed. At that point PR #33 remained Draft/unmerged, and no retry
or future hosted attempt was authorized.

Local repair commit `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` preserves collector and contract
bytes, activates budget SHA-256
`5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501`, and replaces the sampled
ceiling with a fixed strict `< 1,000 ms` product SLA. At that historical checkpoint SceneMemory ran
first and its first-owner Edge install used `--reinstall`. Fresh one-attempt local run
`20260823-pr33-cross-host-sla-certification` passed 42/42 and its named verifier at `7d8dc380…`;
report raw/gzip SHA-256 are
`d16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960` /
`7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a`. The old
`3b71d14c…`/`59530da…` certificate remains historical. Nothing from this repair has been pushed, and
no new hosted attempt is authorized.

Before Nick authorizes another exact changed-head hosted attempt, the handoff must record:

1. current budget mode, repository visibility/billing assumption, and standing private cap;
2. workflow name, PR number/ref, full head SHA, base SHA, and the exact approval label or manual token;
3. configured worst-case runner ceiling and why hosted evidence is still needed after local gates;
4. proof that no run for that exact authorization is queued or in progress;
5. one-attempt/no-retry stopping rule and the owner who will remove the approval label afterward.

The exact candidate must first be committed, clean and pass this tracked-only rehearsal from
`port/v2`:

```text
node tools/tracked-input-preflight.mjs
```

It rechecks HEAD/cleanliness, rejects forgotten source-owned untracked or ignored test files while
excluding dependency-owned `node_modules` tests, exports only the
committed index into an owned isolated tree, runs a fresh install there and executes the exact
hosted browser-free/static sequence through current producer authority. It rechecks the source
candidate again before PASS. Its synthetic fixture proves that an ambient dependency can make the
ordinary workspace pass while the tracked snapshot fails, that tracking the dependency flips the
snapshot green, and that run-generated artifacts remain allowed. This rehearsal is mandatory
preauthorization evidence, not a hosted green or browser certificate.

`test-battery` currently has a two-minute authorization runner plus one battery capped at 90 minutes,
with SceneMemory independently capped at 10 minutes before Compendium's independent 40-minute cap.
The old parallel form
could start seven runners with 175 combined
configured job-minutes on every PR update, then repeat on `develop` and fan out into sync/publication.
That automatic fanout is retired. Parallel wall-clock speed is not worth multiplying finite hosted
minutes or letting unrelated jobs continue after the first deterministic red.

## Consumed PR #34 attempts

PR #34 tested documentation-sync head `4909069ba6f1e2d5dee62286d29b0bc8201186ee` against base
`8998ffb77ca5b1f3123d7ea776c41db6e23bd24e` once in run `32665404776`, under the normal
`actions-budget-approved` label, 92-runner-minute ceiling, and no-retry rule. All earlier gates and
the phone Compendium profile passed. The desktop second 440-detail native click did not activate its
virtual row; the gate then waited for detail art that could not exist and ended on a final clipped
46 ms CDP command. The exact retained report shows healthy transport and no product memory verdict
for that incomplete desktop profile. The label was removed and the attempt is consumed.

The first local repair `bf0ece6…` required full row containment, independent exact hit ownership,
and an immediate exact-detail receipt before any art wait. Three retained candidates plus one paired
legacy baseline preserved all numeric ceilings and four sealed baseline faults under measurement
authority `cfc40f89…`; its now-historical budget SHA-256 was `208af955…`. Clean committed source
`7de42c6…` passed local exact-budget run `20260823-pr34-row-activation-certification` 78/78 with complete
lifecycle and named verification; raw/gzip report SHA-256 are `ea31612f…` / `1c6c12fa…`. This
local work does not authorize a push, label, hosted attempt, Ready transition, or merge.

Nick then authorized head `3dc213cc87c1995a58525fa6b310f79bbfc99fef` against the same base
once, under the same label, 92-runner-minute ceiling, and no-retry rule. Run `32677088518` passed
every earlier gate and reached the second desktop row activation. Its exact report proves the first
activation and immediate receipt succeeded; after Close/reopen, a one-shot pre-render row point
became invalid across the deferred ResizeObserver/render turn. The passive point wait issued 112
observations and ended on a final clipped 51 ms command while the root heartbeat remained timely.
The label was removed; this red attempt remains consumed. The repaired changed head subsequently
passed one authorized no-retry terminal-green battery, run `32681394532`, and PR #34 merged normally
as `7a9f4c1370dd84292388d718c38ff34214f6203b`.

The retained raw/gzip report hashes are `544015e9…` / `cc5ed778…`. Collector `6d681d19…` now
requires native-scroll positioning and the same exact owned point before and after a double-render
settlement before sending its one press/release. This changes measurement authority to `6a961df8…`,
so budget `208af955…`, its samples, baseline, and prior certificate are historical. Clean repair
source `a95889d…` produced three independent 78/78 candidates and a paired legacy baseline; activation
commit `d21ba26…` selects active budget `faa160b3…` without widening numeric ceilings, while retaining
the 14-phone/13-desktop broken-baseline breaches. Exact-budget run
`20260823-pr34-render-stable-row-certification` passed 78/78 plus named verification on clean
`d21ba26…`; raw/gzip hashes are `42753d5e…` / `a2ff5b00…`. The repaired exact head then passed
hosted run `32681394532` and merged normally. That consumed run is integration evidence only and
does not authorize a new changed-head hosted attempt.

## Consumed PR #35 attempts

Nick authorized exactly one `test-battery` attempt for draft PR #35 head
`390e8708086d413fc7d636441ec0523cf9d4b9ea` against base
`7a9f4c1370dd84292388d718c38ff34214f6203b`, using `actions-budget-approved`, with a
92-minute maximum and no retry. Run `33273328362` reached the v2 browser-free suite and stopped
terminal-red before later browser work. Five suites depended on ignored root `main.js`, which was
present in the developer workspace but absent from both Git trees. Two synchronous evidence
selftests also exceeded Vitest's inherited five-second case limit under Linux contention while
their child processes had no hard termination bound. The label was removed; the run is consumed,
PR #35 remains Draft/unmerged, and it must never be rerun or relabelled.

The changed-head repair makes tracked `celestial-frontier.html` the sole byte-exact legacy
test carrier, gives evidence children an explicit 15-second hard timeout below a 20-second outer
case, and adds the clean committed tracked-only rehearsal described above. Its controls also found
and repaired four `artunused` findings that the stopped run never reached. SceneMemory build
provenance changed only because one source map changed by 20 bytes: all 29 runtime files and the PWA
build ID are byte-identical, and no numeric memory ceiling, browser contract or runtime asset moved.
Exact signed repair commit `9192b1aa66c38508cd19f5db0e4825b0a31d5516` and its
documentation-closed signed HEAD pass the exact tracked-only isolated rehearsal: 233/233 files,
2,333 tests passed + one skipped, all TypeScript/unused/art/override/coverage/spec gates and 3/3
current-producer tests. That repair branch and refreshed draft-PR metadata were synchronized, but
this first consumed run never became hosted green.

A second guarded attempt then tested exact PR head
`017fa6decbc41809188768ccdb98ab86ef1b9ebc` against the same base. Run `33278630671` began at
2026-08-29T22:27:19Z and completed terminal-red at 22:35:18Z. Its authorization job passed. Root
validation/smoke/checkpoint/layout/rarity/dead-code, tracked-input controls, the complete v2
browser-free/type/art/coverage battery, current producer binding, current Edge installation, and
SceneMemory instrument/calibration controls all passed. The one-attempt SceneMemory certification
then stopped on the phone profile with `Earth planetfall was rejected`; the always-run verifier's
incomplete-report errors were downstream fallout. Compendium, Slice, Glass, personas, preview, and
all later browser stages were correctly skipped.

The second run exposed a real route-lifecycle coverage gap, not an Edge-version or numeric-ruler
failure. The bounded local repair drains both the predecessor route checkpoint and Survey's
replacement checkpoint before one Landing call, uses the transaction owner's exact checked-clock
canonicalizer for expected successors, propagates exact PWA build pins to worker/shared-worker
clients before their lazy imports, and makes SceneMemory preserve actionable worker and BFCache
diagnostics. Numeric memory ceilings, browser-family authority, and version-tolerant no-rebaseline
policy remain unchanged. The detailed same-day account is in
`audits/PR35_SCENEMEM_FAILURE_DIAGNOSIS_2026-08-29.md`.

Both PR #35 attempts are consumed and their labels are absent. No new hosted attempt, Ready
transition, merge, release, version bump, preview, publication or deployment is authorized.

## Safe rollout of this guard

These protections are present on `develop` as of PR #32 merge commit `d4ab7e6…`. Because the
repository is public, standard hosted-runner minutes are free;
repository-wide Actions disablement is not needed merely to protect the private 3,000-minute
allowance. Every changed-head push and label still requires its own exact authorization; verify the
remote workflow bytes without dispatching, and leave the approval label absent after the one run.
If the repository becomes private again, stop and re-evaluate the remaining private allowance first.
Disabling Actions remains a broad persistent setting change and still requires explicit approval of
that exact consequence.
