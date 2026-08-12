# ★ LIVE — draft PR #11: v2 hardening + playtest readiness (2026-08-12)

**Current integration state:** PR #10 merged normally into `develop` at
`61cc058abca0b37dcd5f44ff11012bf8b8dea4c9`. OpenAI/Codex remains on
`openai/mac`. Latest immutable CI evidence is test-battery #207 at exact pushed
`ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
`8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical, and the instrument
run remains red without retry. Immutable executable source
`6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete exact clean local
battery for the #207 repair and underlies the forthcoming/current docs-only tip.
Exact tip/upstream/CI state is live authority from
`git rev-parse HEAD`, `git status --short --branch`, and PR #11 checks. Prior test-battery #201,
run [`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
completed once without retry and remains preserved red on superseded pushed
`4560269`; it is not retried or hidden by the new evidence.
Prior test-battery #202, run
[`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
also completed once without retry and remains preserved red at pushed
`93f75a93ab80a3b199e55b5b49d9488e8fc57f53`; its only failure is the ambiguous
desktop-8k serial readiness observer described below.
Test-battery #203, run
[`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
also completed once without retry and remains preserved red at exact pushed
`38e4f362533e272f56f708229f7a037f38ae8951`; every earlier gate and 11
glass rows passed, then desktop-8k crossed the unchanged import bound before the
first release receipt. Executable source `7d9980e` supplied the later exact clean
ticker-quiescence evidence preserved below.
Test-battery #204, run
[`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
completed once without retry at exact pushed head
`4cee7d807b8f9258e370aad31c30756269f95a96` and remains red. All earlier gates
plus `smoke:ci` passed; the exact failure and later prior clean repair evidence
are recorded below as prior history. Whichever final pushed repair tip is selected
requires matching CI.
Test-battery #205, run
[`31621227550`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550) /
job [`94196289291`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550/job/94196289291),
completed once without retry at exact pushed `c57305fbf30af2bc8158ff46af1ec49ec4455d95`
and remains red. Every preceding gate and `smoke:ci` passed. Desktop-8k reached
ready after the full replacement/boot chain, then its sole two-second exact-context
confirmation timed out. With no concurrent browser-process heartbeat, this is
strong evidence of post-ready target starvation but not retrospective proof of
healthy browser/CDP transport.
Test-battery #206, run
[`31635297321`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321) /
job [`94243979205`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321/job/94243979205),
completed attempt 1 without retry at exact pushed
`558e0565d368a0b81d86d99fd380ebc50d30bc02` and remains red; merge `e160577`
is tree-identical. All preceding steps and `smoke:ci` passed. The exact resize
answerability finding and non-authoritative repair diagnostic are recorded below.
Historical test-battery #200,
run `31577395120` / job `94052496287`, passed every root, product, v2, one-run
smoke, full 12-viewport glass, automated-persona and preview-package gate; only
final preview CDP startup failed before a page existed after that step lost the
preceding step's Chrome environment and selected Linux Edge. Commit
`4d14a75e934536dc5f204e40c74f666cc9514df4` contains the job-scoped browser
provenance repair; `08379d8c072c7eb22e2a029d666972c86d496326` completes the
root-layout launcher/report hardening; `46fb627` remains prior immutable exact evidence.
Draft PR #11 is open at
https://github.com/TheDakk/Celestial-Frontier/pull/11.

The batch audits and hardens the already-ported Phase-4 slice: sparse/corrupt/
newer save protection, IndexedDB retry, bounded hostile epochs, Atlas and
composite-scene identity, single-credit landfall, external-code landing guards,
named-world CF1 round trips, retained lazy-art subscribers, SessionRNG and
declaration parity, measured 4×2 phone chrome, correct Pixi DPR/CSS pointer
geometry, and explicit minimum-44px survey descent actions. Browser flows cover
desktop and phone navigation, Charter rejection/success, protected save import,
Land/Leave and stale-action rejection.

The dock Guide is the source-addressed continuation of the mature in-game Guide,
not a parallel manual: **9 categories, 43 authored stable IDs and 41 player
topics**, with search, native-keyboard cross-links, capability-aware current copy
and honest unavailable states. Save import remains under **Settings → Save data →
Bring expedition**. The same Guide exposes the exact **56-release/398-bullet** legacy
history beside an unversioned `V2_DRAFT_RELEASE`. The draft cannot open the
one-time shipped bulletin, mutate `rnSeen`, or bump a version;
`V2_CURRENT_RELEASE_VERSION` remains unset pending Nick's authorization.

The responsive glass contract now spans **12 viewports including 8K**: safe
areas, minimum targets, contrast, focus continuity, assistive state, display
preferences, reduced motion and bounded DPR. Native backing remains through UHD
3,840×2,160; a viewport strictly above 8,388,608 CSS pixels selects an ultra
tier of 3,145,728 pixels per canvas /6,291,456 aggregate. Exact rounded fitting
makes desktop-8k and 5,120×2,880 two 2,365×1,330 stores /6,290,900 pixels combined. Backdrop
replacement releases before allocation and same-backing logical resizes still
refresh Pixi/EventSystem/pointer geometry. Downshift and restore each require a
strict target/browser-heartbeat pair, an advancing later post-render ticker turn,
and stopped/stale-ticker controls. The existing full scene rerender remains; no
scene-rerender optimization or separate scene-art quality tier landed. Panels reserve a dedicated 44px
sticky-close gutter and restore focus to their opener, or to Survey/canvas when
a desktop rail opener has become hidden. On landed ≤900px layouts the objective
yields to populated Planetside until ascent; short landscape yields the trail.
Portrait measures fixed top chrome, the last visible trail edge and safe/dock/
context lower chrome. It retains the trail when a useful 72px roster plus 6px
clearance fits; otherwise only that noninteractive trail yields while a minimum-
72px vertically scrollable Planetside remains usable and restores the trail when
space returns. Dock icons use the 42px client line inside their 44px target, and A++ retains a larger toast-title tier.
Training retains its intentional layer choreography and keyboard focus lock;
ordinary panels remain above survey cards outside Training. The v2 Training arc
still contains the six current chart/travel/landing lessons plus an honest
graduation. Tooltip deep-links, Advanced Briefings and the rest of the legacy
21-step curriculum remain open.

Structured evidence consists of an ignored atomic schema-v2 root-layout report,
one-run slice-smoke JSON/log/screenshots, a 12-viewport glass-matrix JSON report,
and matching-provenance automated-persona JSON/Markdown labeled **AUTOMATED — NOT
A HUMAN PLAYTEST**. Root layout writes `running` then terminal `pass`, `fail`, or
`instrument-fail`, retains legacy `results`, and binds exact run/browser provenance.
Development-preview
packaging binds exact commit/tree/lockfile/byte hashes, shows a DEV banner and
refuses production/path origins. The exact local artifact is bound to
`https://dev-celestialfrontier.github.io`, but no owner-site repository/host or
publication has been approved or created.

**Evidence status:** GitHub test-battery #199, run `31571459050` / job
`94034164092`, exposed the old desktop-8k reload ambiguity and small-phone
Planetside/trail overlap. Pushed commit
`8b8a740286a56591cac9dc5734a2fba4c088939b` repairs both with separate
import/replacement phases, changed-loader plus changed-token readiness, a useful
72px scrollable portrait roster and trail fallback; their failing controls and
the exact sequential local battery passed.

Matching GitHub test-battery #200, run `31577395120` / job `94052496287`,
passed all root/product/v2 gates, one-attempt `smoke:ci`, the complete 12-viewport
matrix including 8K, automated-persona synthesis and `preview:package`. Only
`preview:smoke` failed: its process did not inherit the previous step's
`CF_BROWSER=/usr/bin/google-chrome`, so the resolver selected Linux Edge at
`/opt/microsoft/msedge/microsoft-edge`. Edge never wrote `DevToolsActivePort`;
the check stopped before a target or packaged page existed. This is CI browser-
provenance failure, not a game, glass, package or human-preview finding.

Pushed commit `4d14a75e934536dc5f204e40c74f666cc9514df4` pins the exact Chrome path
at job scope in both workflows and resolves it fail-closed before the long battery;
browser provenance is per step/process, not workflow memory. Do not add retries,
lengthen startup or clear D-Bus to hide a future recurrence.

The clean follow-on at `08379d8c072c7eb22e2a029d666972c86d496326` moves root
`uilayout.js` onto the same v2-owned resolver/CDP
launcher: browser-assigned port 0 plus `DevToolsActivePort`, exact browser version
provenance, early-exit and bounded stderr diagnosis, bounded TERM→KILL cleanup and
validated profile removal. Its report is ignored and atomically replaces any stale
result. A full PASS must match the sealed v1.8.9 report's exact 787
`viewport/surface/name` inventory; targeted viewport runs are scoped diagnostics.
`--selftest` seeds a stale PASS, forces an exit-73 marker, proves current red
replacement/wrong-run rejection/cleanup, then removes one sealed outcome with
consistent counts and requires rejection. CI assigns an exact run id, runs selftest +
gate + `--verify-run=ID`, and separately uploads the required report. Root and v2
install surfaces both declare/lock `ws` and Node
`^20.19.0 || ^22.13.0 || >=24.0.0`; preflight now launches the selected executable
through `browsercdp` and selftests excluded Node lines plus an executable non-browser.
`bootperf` shares the executable resolver and `ws` but retains its legacy CDP lifecycle.
The bounded lock refresh moves root `undici` 7.27.2→7.29.0 and v2 `nanoid`
3.3.16→3.3.18 within existing ranges; clean `npm ci` on both surfaces reports zero
vulnerabilities. This is tooling evidence, not a shipped runtime or release-note change.
The first sandboxed Edge diagnostic preserved SIGABRT as red. Prior test-battery #201, run
[`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) / job
[`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
remains **RED** on pushed `4560269`, without retry. It passed every earlier gate including `smoke:ci`; only
desktop-8k preference import instrument-failed after a 20-second replacement wait while the old
loader remained and its slice token/import phase were absent. This is not a save rejection or
reported write error and must not be retried away.

Immutable executable source `7d9980e37e60f0cec8cb840e75098872b9cc90d0` makes the
product's three intentional reloads claim one mutually
exclusive replacement transaction and synchronously quiesce a running outgoing ticker before
the first persistence await. Only the exact failed/rolled-back owner can restart a ticker its
claim stopped; invalid pre-claim import rejection leaves play unchanged. Successful flows then
perform one explicit Pixi/global-resource release,
view detachment, application/backdrop 1×1 collapse and one-task barrier;
it avoids generic `pagehide` teardown for browser-cache safety. Glass uses sticky receipt times to
bind release/import at 20 seconds, changed-loader navigation at 5 seconds and new-loader boot at
20 seconds. Exactly one ready event from the exact new default context/session/loader/token/URL,
with browser-native time below the boot limit, precedes one at-most-2-second confirmation. It
retains sticky Page/Runtime/Inspector/Network diagnosis and adds
`reload-resource-release` beside `replacement-document-loader-token-phase`, still with zero retries.
Its event-owned `cf-v2-import-phase/v1` stream and the `import-phase-sequence` /
`replacement-ticker-quiescence` controls bind the exact old operation, require the ticker running
only at `invoked`, require ordered claim/persist/write/release receipts under the absolute import
deadline that begins before one bounded non-awaiting arm command, and reject just-late or wrong-
context evidence. IndexedDB durability is not wrapped in a timeout race.
The exact clean sequential battery passed:

- root preflight selftest/preflight, validate/fingerprint and smoke passed; preflight reported only
  the expected Edge 151 versus pinned Edge 150 drift warning;
- root layout selftest passed; `exact-7d9980e-root-layout` passed the sealed 787/787 inventory
  across 10/10 viewports and exact verification;
- rarity completed 60M trials / 0 downgrades; dead-code review found 3 tooling references;
- v2 passed 24 files / 273 tests / 1 skip plus all type/art/override/coverage/spec and instrument
  gates/selftests;
- one-attempt smoke passed with 0 findings / 10 screenshots; smoke/glass/persona evidence shares
  working-tree digest `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`;
- exact-source certifying full glass passed 12/12 viewports, 52/52 controls, `omitted=[]`, and
  0 findings/instrument failures/retries at the shared digest above. All 12 exact import-phase/
  release/ready paths passed; replacement totals were 194–239 ms. Desktop-8k recorded a 3 ms
  arm, 21 ms import-phase span with the ticker true only at `invoked`, 0 ms write, 19 ms release,
  both 5,461×3,072 canvases →1×1, `performanceNow` 199.5 ms, 1 ms confirmation and 239 ms total;
- all 9 bounded automated personas passed. The initial malformed `npm run perf -- --runs=4`
  command was rejected before a browser launched; the correct single terminal diagnostic then
  recorded 646 ms painted / 726 ms answerable / 74 ms press→panel / 157 ms rebuild, not a retry
  of an evidence failure; and
- exact 37-file / 10,170,996-byte preview `dev-preview-exact-7d9980e` verified and browser-smoked
  PASS under Edge 151 at 320×568 for expected origin
  `https://dev-celestialfrontier.github.io`, distinct from production, content SHA-256
  `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`, exact
  `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, `publishable:false`.

Matching test-battery #202, run `31594595288` / job `94106996466`, completed
once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
and is **RED**. Every earlier root/product/v2 gate and `smoke:ci` passed. Only the
desktop-8k glass import/replacement instrument failed when its first observer
result arrived at 61.163 seconds. The former loop serially awaited
`Page.getFrameTree`, an awaited `Runtime.evaluate`, and a second frame-tree read;
each command inherited a 30-second ceiling. The result is therefore ambiguous
instrument latency, not evidence of a 61-second product boot, save rejection or
product failure. Preserve it without retry or a timeout increase.

The repair moves phase authority to sticky CDP receipts: exactly one
event-owned `cf-v2-import-phase/v1` stream first binds the exact operation and
old document/session/default context/loader. It requires the outgoing ticker
running at `invoked`, stopped from exclusive claim through persistence/write/
release, and one immutable 20-second deadline beginning before its bounded
non-awaiting arm command. Only the exact failed/rolled-back owner may restore a
ticker it stopped; pre-claim invalid input leaves play untouched. IndexedDB
durability is not wrapped in a timeout race. Then exactly one
reason/token-bound release from the prior default top context, one changed
top-frame-loader commit, and exactly one `cf-v2-slice-ready/v1` event from the
new default top context/session/generation/origin/loader/token/URL before the
20-second import, 5-second navigation and 20-second boot deadlines. The app emits
that optional tail event only after load, persistence and complete slice/input
wiring, at least one ticker turn, an animation frame and a later task. Its
browser-native `performanceNow` must be strictly below 20 seconds (the exact
boundary fails), so Node observer descheduling cannot make a late boot look
timely. One phase-owned, at-most-2-second Runtime command confirms the exact
context. Fatal events remain sticky outside bounded diagnostics. This proves
boot publication plus a serviced event-loop turn, not the separate 50 ms
answerability metric; later driven controls remain authoritative.

Matching test-battery #203, run `31602984470` / job `94134750800`, completed
once without retry at exact pushed `38e4f362533e272f56f708229f7a037f38ae8951`
and is **RED**. All earlier root/product/v2 gates and `smoke:ci` passed. Eleven
glass rows passed; desktop-8k reached 20,015 ms before any release, ready,
navigation, fatal, command, or diagnostic event. The outgoing 5,461×3,072 Pixi
ticker was still rendering across the durable-write wait and teardown under CI
software rendering. This is a real pre-release renderer-pressure cliff, not
save corruption or a reported repository-write rejection. Preserve it without
retry, timeout increase, or an IndexedDB timeout race.

Matching test-battery #204, run `31612817092` / job `94168172635`, completed
once without retry at exact pushed head
`4cee7d807b8f9258e370aad31c30756269f95a96` and is **RED**. Every preceding
root/product/v2 gate and `smoke:ci` passed. On desktop-8k the arm command queued
for 9,504 ms, then import, primary write, 35 ms renderer release, navigation,
changed loader at 45 ms, load at 231 ms and FCP at 268 ms were healthy. The new
document emitted no ready witness inside its independent 20-second boot budget
and no fatal event. Two costs combined: the application and backdrop canvases
could each allocate the full 16,777,216-pixel ceiling, and Pixi auto-started
before asynchronous save/scene/slice/input wiring. This is not an import, write,
release, navigation, load or FCP failure. Preserve #204 without retry or a longer
deadline.

The #204 repair gave the two full-viewport canvases one aggregate 4,096²
budget, kept native density through 4K and used 3,862×2,172 each at 8K. Pixi
initializes with `autoStart:false` through save load, scene render, slice
publication and input wiring, then performs a real tick/render, animation frame
and later task before ready. An exact `cf-v2-boot-phase/v1` sequence binds
`app-init-start`, `app-init-complete`, `backdrop-complete`, `save-load-start`,
`save-load-complete`, `scene-rendered`, `slice-published`, `wiring-complete`,
`ticker-started`, `first-tick`, `ready-scheduled`, and `ready-emitted` to the
target session/context/generation/origin/loader/token. The ticker must remain
false through wiring and true thereafter; per-stage and deadline negative
controls fail missing, reordered, wrong-identity, early-ticker and late evidence.
Smoke proves both fresh-boot and post-import ticker outcomes.

Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
passed the exact local battery. One malformed `--verify-run` operator invocation
caused local SIGABRT/report overwrite; one correct rerun plus verification then
passed `exact-46fb627-root-layout`, 787/787 across 10/10. V2 passed 273/1 and
all gates/selftests; one-attempt smoke passed 0 findings /10 screenshots. Full
certifying glass at source-snapshot digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms
and 1 ms confirmation; both outgoing 3,862×2,172 canvases collapsed to 1×1 and
the replacement pair remained 16,776,528 pixels combined. All 9 automated
personas passed, explicitly not a human playtest; terminal-only performance was
595/676/76/168 ms. Manifest `dev-preview-exact-46fb627` records 37 files /
10,176,376 bytes, content SHA-256
`4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`, exact
tree `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected origin
`https://dev-celestialfrontier.github.io`, production distinct and
`publishable:false`.

Before the stable-source battery above, one smoke attempt correctly refused because tracked
documentation changed during its run (`source identity changed during slice smoke`). This one-
execution/no-auto-retry mixed-source refusal is retained as coordination/instrument evidence,
not a product failure. It does not supersede the later exact-source one-attempt PASS.

`7d9980e` remains immutable prior exact evidence; `46fb627` is the exact clean
source for the #204 repair.

Matching test-battery #205, run `31621227550` / job `94196289291`, completed
once without retry at exact pushed `c57305fbf30af2bc8158ff46af1ec49ec4455d95`
and is **RED**. Every preceding gate and `smoke:ci` passed. Desktop-8k completed
import/write/release, changed-loader navigation, all 12 boot stages, and ready at
browser-native `performanceNow` about 3,733 ms; only the following exact-context
confirmation timed out at two seconds. No concurrent browser heartbeat existed,
so #205 is strong pixel-linear evidence of post-ready target starvation but not
retrospective proof of healthy browser/CDP transport. Preserve it without retry.

The follow-on repair retains native backing through UHD 3,840×2,160,
then selects 3,145,728 pixels/canvas /6,291,456 aggregate strictly above
8,388,608 CSS pixels. Exact rounded fitting makes 8K and 5K 2,365×1,330 per store;
old backdrop destruction precedes allocation and an exact transition peak/budget
is published. Same-backing logical resizes refresh CSS, Pixi screen/texture,
EventSystem, pointer and backdrop geometry. Downshift and restore each use a strict
target/`Browser.getVersion` pair and later advancing post-render ticker witness,
with stopped/stale ticker controls. No scene-rerender optimization landed; the
existing full scene rerender remains. After timely ready the harness sends
two strict, no-retry, at-most-two-second exact-context cycles concurrently with
root-session `Browser.getVersion`; cycle 2 is a later post-render ticker turn.
Its exact five-row ledger and 57-control executed/product-blocked/omitted report
separate product answerability from instrument/transport failure.

Prior diagnostic only: the cited results below were captured from a
`dirty-diagnostic`, non-authoritative source state based on pushed `c57305f`:
targeted desktop-8k PASS non-certifying, report SHA-256
`e77e9727cb019740bd756188be18f444ac1d3f5d666e49f727f355c73b7c3c2d`;
one-attempt smoke PASS, 0 findings /10 screenshots /105,207 ms, SHA-256
`fb1800320926532c0df6c782cd630c45e37bcea6906c4bbd953111b7605b43c8`;
full glass PASS 12/12, 57/57, `blocked=[]`, `omitted=[]`, 0 findings/instrument
failures/retries /53,918 ms, SHA-256
`dff0829a3eb8dba67ee0da7c51ae6748fe4ff9bc8652ee1d617657f3133794cb`.
Its 12 reloads were 174–199 ms; 8K was 180 ms /160.6 ms ready /7 ms cycle 2,
with 2,730×1,536→1×1 outgoing canvases. Nine automated personas passed, not
human play; terminal-only performance was 605/686/76/159 ms. One sandboxed
listener preflight failed `EPERM`; one harness-only float check reported
`7680.000000000001`, was corrected once, and did not retry a product failure.

Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
then passed the complete exact sequential battery from clean source-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` and
source-snapshot digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks passed
outside sandbox without a product retry. Root validate, legacy smoke, rarity and
dead-code review passed. Root layout run
`exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10 under
Edge 151 in 75,532 ms; report SHA-256
`7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`.
V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt slice smoke
passed 0 findings /10 screenshots /0 retries in 105,379 ms; report SHA-256
`c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`.
Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`, zero
findings/instrument failures/retries in 52,254 ms; report SHA-256
`1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`.
Reloads were 176–185 ms. Exact 8K was 185 ms total /2 ms arm /12 ms
invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
`performanceNow`, target confirmations 1/9 ms and heartbeats 1/1 ms. Outgoing and
replacement stores were 2,730×1,536 each; outgoing stores collapsed to 1×1 and the
replacement pair remained 8,386,560 combined pixels. Nine automated personas passed,
not human play; JSON/Markdown SHA-256 are
`c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
`43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`.
Terminal-only performance was 578/659/76/170 ms. Exact preview
`dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under Edge 151;
manifest SHA-256
`0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
37 files /10,186,230 bytes, content SHA-256
`da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
production distinct and `publishable:false`.

Matching test-battery #206, run `31635297321` attempt 1 / job `94243979205`,
completed once without retry at exact pushed
`558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
Every preceding step and `smoke:ci` passed. Desktop-8k reload passed in 8,749 ms;
ready published at `performanceNow` 2,578.6 ms, and initial target cycles took
1,905/1,910 ms with 3/1 ms heartbeats. The later 5,120×2,880 transition's
exact-context `Runtime.evaluate` timed out at 2,003 ms against the strict 2,000 ms
bound while `Browser.getVersion` answered in 2 ms; `last:null`. The sole
`ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` is a product finding: 12 viewports,
1 product finding, 0 instrument failures, 56 executed +1 product-blocked =57,
`omitted=[]`, 0 retries. No persona or preview evidence was produced. Preserve
#206 red without retry.

Test-battery #207, run
[`31642880191`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191) /
job [`94269466117`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191/job/94269466117),
completed attempt 1 without retry at exact pushed
`ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
`8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. Every prior gate,
`smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed because
the valid release witness arrived after `release-started` and before `release-complete`,
and the observer rejected that healthy intermediate. Release itself proved released
renderer/stage, detached view, 1×1 canvases, and null error. The report records 0 product
findings, 1 instrument failure, 57 planned/listed controls, `blocked=[]`, `omitted=[]`,
0 retries, and no persona/preview output. Preserve #207 red without retry.

The harness repair assigns a monotonic receipt ordinal only to import-phase and generic
release bindings in one armed capture. A successful tail is exactly `release-started` N →
release N+1 → `release-complete` N+2. Only the producer-legal release-first intermediate
remains pending under the unchanged original 20-second import deadline; phase-complete-first,
premature, nonadjacent, missing, late, duplicate, malformed, wrong-provenance, early boot/
ready, and overlong phase evidence fail closed.

The prior dirty #207 diagnostic (report
`805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
chronology only. Immutable executable source `6554b2be652c083bc9ff7ed11c2f928e90b74660`
passed the sequential exact clean battery at status/snapshot
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` /
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
A first sandboxed preflight Edge launch SIGABRTed before CDP; the same invocation passed
when permitted with only the expected Edge 151/pin-150 warning—an environment refusal,
not a product retry. Root gates and `exact-6554b2b-root-layout` 787/787 across 10/10
passed in 75,532 ms (report
`58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`). V2 passed
273/1 plus all static/art/coverage gates. One-attempt smoke passed 0 findings/10
screenshots in 105,430 ms (report
`139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844`; log
`76a40b9bd8f88dd5f5ebdc09271c0ed289478795d6cd011338df349438ef62b8`).
Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact 6/7/8 tails on every
row, empty blocked/omitted ledgers, and 0 findings/instrument failures/retries (report
`a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`). Tablet-
portrait was 196 ms with tail timestamps 1786574427588/7591/7591 and command durations
2/1/1/7/0; exact 8K was 197 ms with tail timestamps 1786574452829/2832/2832, commands
1/1/0/7/0, 34 ms release→commit, 131 ms commit→ready, outgoing 2,365×1,330 twins
→1×1, and replacement 6,290,900 pixels combined. Nine automated-only personas passed
(JSON `fc8d6da1e0b18d824b5403121e87b02ee9423d9592f3221d2ff1819d20629e05`;
Markdown `08328ed2c760b722caa9f76259fe22a8dfcf1e36624086d388e19628774eb176`), plus
terminal-only 635/717/77/151 ms performance. Exact preview
`dev-preview-exact-6554b2b-20260812T184000Z` passed Edge 151 at the separate dev origin
with `publishable:false`: manifest
`98a64b750d1def5c7895cbd780a35558863f000c5a3fbcf4c3945dd927d5ce04`, 37 files /
10,186,537 bytes, content `04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`,
tree `986116980e7b7a224f210508b4872b5d7f5621ac`, registry
`8a290b25fc8ff27ca7f23f00367121a78a5e8af0`, lock
`b81617792187b3e76c7f1586ed311d540f1451acadb85c369ffcd2c4571229cb`.

Immutable clean executable evidence source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
remains prior exact #206 executable evidence (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
Root preflight warned Edge 151 vs pin 150; validate/smoke and layout 787/787 across
10/10 passed in 75,544 ms (`exact-df1c28b-root-layout`; report
`d0d9a9b3c58f996e5fb7b10f21aa98c974272531f10ccdb945cd026942429252`);
v2 passed 273/1 plus all gates. One-attempt smoke passed 0 findings/10 screenshots
in 105,217 ms (`b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474`;
log `538f4a36919cd947e7631f4eb786acbcd3a6e356ce55719843c8080004295087`).
Certifying glass passed 12/12, 57/57, empty blocked/omitted, zero findings/instrument
failures/retries in 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`).
Reload range was 175–203 ms. Exact 8K was 203 ms / `performanceNow` 158.2 ms,
arm/import→release/release→commit/commit→ready phases 2/11/33/127 ms, targets
1/10 ms, heartbeats 0/0 ms; outgoing 2,365×1,330 stores →1×1 and replacement stayed
6,290,900 pixels combined. Nine automated-only personas passed (JSON
`c10c9e33542ed57b4c51683c0ddf3f1bbc468696a025e88ef2d1e500209581bc`; Markdown
`1c9961515028a716ba064ca32ea9dd3ef2d41118cfde4c76b24c16520daa2d14`), and
terminal-only 581/659/73/152 ms painted/answerable/press→panel/rebuild passed.
Preview `dev-preview-exact-df1c28b-20260812T211642Z`
passed Edge 151 at the separate dev origin with `publishable:false`, manifest
`758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`, 37 files /
10,186,537 bytes, content
`98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`, tree
`435c363e3e049f353e74ce71ed2a5fb4e3514c69`.

Live Git/PR state decides the exact docs tip, upstream and checks; the selected pushed tip
requires matching green CI before human playtest against its commit-bound preview. Record full commit,
`preview.json` content hash, URL, tester/device/browser, save state, findings and
retest in `port/playtests/`. Do not mark PR #11 Ready or merge before every human
finding is resolved or explicitly dispositioned and affected gates are rerun.

**Next technical order:** complete canonical CF1 galaxy→star→planet proof;
restore imported legacy full-expedition `tsnap`; decide CFB parent preservation;
complete live Training/tooltips/Advanced Briefings; virtualize Compendium;
finish general Pixi canvas-texture ownership beyond explicit reload teardown and add a memory plateau gate; attach completed HD
planet tiers; persist/invalidate epoch edges and settle visibility/reduced-motion
policy; finish Gate-B/type/state boundaries and split-store/CAS persistence;
then Phase 5 living actors and Phase 6's 43 biome/ecology scenes. The static
Platinum-reviewed portrait set remains frozen; human play, living rigs and biome
scenes are the higher-value visual work.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac` — test-battery #207 is the latest
immutable pushed CI evidence at `ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
`8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical, and the instrument run remains
red without retry. Immutable executable source `6554b2be652c083bc9ff7ed11c2f928e90b74660`
passed the complete exact clean local battery and underlies the forthcoming/current docs-only tip.
Resolve tip/upstream/check state live; the selected pushed tip requires matching CI, and prior
#201–#207 remain preserved red without retry.

**GitHub step:** keep PR #11 draft and preserve red #201 (`31586917924` / `94082765087`),
#202 (`31594595288` / `94106996466`), #203 (`31602984470` / `94134750800`), and
#204 (`31612817092` / `94168172635`), #205 (`31621227550` / `94196289291`), and
#206 (`31635297321` / `94243979205`), and #207 (`31642880191` / `94269466117`)
without retry. Read `git rev-parse HEAD`,
`git status --short --branch`, and PR #11 checks. Push the current `openai/mac` tip only
if its upstream is behind; live state determines commit/push status, and whichever final
pushed tip is selected requires matching green CI. After green CI, obtain host approval, publish the separate-origin preview,
complete/record human play, resolve/retest findings, and only then let Nick mark Ready and normally
merge into `develop`. Never auto-merge, squash/rebase, retarget `main`, or add work to merged PR #10.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Title: `Harden v2 persistence, navigation, responsive UI, and playtest readiness`
- Copy-ready description:

  > Audits and hardens the already-ported v2 slice. Protects sparse, corrupt and newer saves;
  > restores IndexedDB retries; bounds hostile epoch input; validates Atlas and composite scene
  > identity; prevents duplicate landfall credit, stale-card actions, external-code landing bypass
  > and named-world share loss; retains lazy-art subscribers; aligns TypeScript declarations; and
  > strengthens SessionRNG. Makes the phone dock a measured 4×2 contract, fixes Pixi DPR/CSS
  > pointer geometry, and replaces timing-sensitive descent with explicit minimum-44px survey-card
  > actions. Restores the source-addressed in-game Guide with its canonical 9 categories, 43
  > authored IDs and 41 player topics, searchable capability-aware copy and native keyboard
  > cross-links, and keeps protected import at Settings → Save data → Bring expedition. Preserves
  > the exact 56-release/398-bullet legacy history and keeps current v2 work
  > in an unversioned `V2_DRAFT_RELEASE` that cannot trigger the shipped-update popup or mutate
  > `rnSeen`. Improves safe areas, contrast, focus, assistive state, display preferences, reduced
  > motion and bounded DPR across a 12-viewport glass matrix including 8K. Panels reserve a 44px
  > sticky-close gutter and hidden rail openers fall back to Survey/canvas. On landed touch layouts,
  > the objective yields to Planetside; short landscape yields the trail, while portrait retains it
  > only when a useful 72px roster plus 6px clearance fits and otherwise yields only that trail for a
  > vertically scrollable Planetside. The three intentional replacement reloads explicitly release
  > Pixi/global resources, detach and collapse outgoing application/backdrop canvases, and cross one
  > task boundary before navigation without generic pagehide teardown. The responsive gate requires
  > that release witness, then uses sticky CDP receipt times to independently observe a 20-second
  > import transaction, 5-second navigation commit and 20-second new-loader boot. Exactly one
  > `cf-v2-slice-ready/v1` event from the new default top context/session/loader/token/URL, with a
  > browser-native timestamp strictly below the boot bound, precedes two strict at-most-2-second
  > exact-context cycles, each concurrent with a root browser-process heartbeat; cycle 2 runs on
  > a later post-render Pixi ticker turn. Import/release bindings share a scoped ordinal and accept
  > only release-started N → release N+1 → release-complete N+2; only that intermediate waits under
  > the unchanged import deadline, while impossible/missing/late/wrong-provenance tails fail closed.
  > No serial poll or retry owns the verdict. Replacement ownership now
  > quiesces the outgoing ticker before any durable-write await and restores it only on exact-
  > owner rollback. An exact-operation import-phase stream requires ticker-running invocation,
  > stopped claim/write/release, and one absolute deadline beginning before its bounded arm;
  > no IndexedDB timeout race is used. Retains native backing through UHD, then uses an exact
  > rounded 3,145,728-pixel/canvas ultra tier (2,365×1,330 each at 8K and 5K), releases the old backdrop
  > before replacement allocation, and records exact transition peak/budget. Both resize directions
  > require bounded target/heartbeat evidence and a later advancing ticker turn; stopped/stale ticker
  > controls fail, while the existing scene rerender remains unoptimized. Initializes Pixi
  > with `autoStart:false` through save/scene/slice/input wiring, and requires an exact 12-stage
  > session/context/generation/origin/loader/token boot witness with the ticker false through
  > wiring and true after a real tick/render, animation frame and later task. Adds provenance-bound
  > smoke, glass and automated-persona reports plus commit-bound development-preview packaging;
  > pins the CI browser at job scope so a later preview process cannot silently switch from Chrome
  > to Linux Edge when a preceding step's environment expires. Moves the root 10-viewport layout
  > gate onto the same owned port-0 CDP launcher and adds ignored atomic pass/fail/instrument-fail
  > evidence, stale-PASS/exit-73 selftest, exact-run freshness and a separate required CI upload;
  > automated personas are explicitly not a human playtest. Prior immutable executable source
  > `135a635d066d1c67e3096dc134de9247267898d5` passed root validate/smoke/rarity/
  > dead-code, exact root layout 787/787 across 10/10, v2 273/1 plus every gate, one-attempt
  > smoke 0 findings/10 screenshots/0 retries, and certifying glass 12/12 with 57/57 unique
  > controls, `blocked=[]`, `omitted=[]`, zero findings/instrument failures/retries. Exact 8K
  > was 185 ms total /152.2 ms `performanceNow`, with target confirmations 1/9 ms,
  > heartbeats 1/1 ms, outgoing 2,730×1,536 canvases →1×1 and the replacement pair at
  > 8,386,560 combined pixels. Nine automated personas passed; terminal-only performance was
  > 578/659/76/170 ms. Exact preview
  > `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under Edge 151,
  > records 37 files /10,186,230 bytes and content SHA-256
  > `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`, with the
  > expected separate origin and `publishable:false`.
  > Prior #201 (`31586917924` / `94082765087`), #202
  > (`31594595288` / `94106996466`), and #203 (`31602984470` / `94134750800`)
  > plus #204 (`31612817092` / `94168172635`), #205
  > (`31621227550` / `94196289291`), #206 (`31635297321` / `94243979205`), and #207
  > (`31642880191` / `94269466117`)
  > remain preserved red without retry; #202 exposed
  > serial observer latency, #203 exposed pre-release 8K renderer pressure before the first
  > release witness; #204 isolated post-load readiness pressure after healthy import/write/
  > release/navigation/load/FCP; #205 reached ready then lost its exact-context confirmation without
  > a concurrent browser heartbeat. #206 passed reload/ready and its initial heartbeat-backed
  > confirmations, then the later 5K resize target timed out at 2,003 ms while the browser heartbeat
  > answered in 2 ms: 1 product finding, 0 instrument failures, 56 executed +1 blocked =57,
  > `omitted=[]`, 0 retries, and no persona/preview evidence. #207 passed all prior gates and 11
  > glass rows, then tablet-portrait rejected the valid release-between-phase intermediate: 0 product
  > findings, 1 instrument failure, 57 listed controls, empty blocked/omitted ledgers, 0 retries,
  > and no persona/preview output. Its prior dirty diagnostic remains chronology only. Immutable
  > executable source `6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the exact clean
  > battery: root layout 787/787, v2 273/1 plus all gates, one-attempt smoke 0/10,
  > certifying glass 12/12 and 57/57 with exact 6/7/8 tails, empty blocked/omitted
  > ledgers and zero findings/instrument failures/retries, nine automated-only personas,
  > terminal-only performance, and Edge 151 preview
  > `dev-preview-exact-6554b2b-20260812T184000Z` at the separate dev origin with
  > `publishable:false` and content
  > `04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`.
  > The #206 repair passed the exact
  > clean sequential battery at immutable executable source
  > `df1c28b31d15cd554d36f9b4ca65d8765366a5df`: root layout 787/787, v2 273/1 plus
  > every gate, one-attempt smoke 0/10, certifying glass 12/12 and 57/57 with empty
  > blocked/omitted ledgers and zero findings/instrument failures/retries, nine automated-only
  > personas and terminal-only performance. Exact preview
  > `dev-preview-exact-df1c28b-20260812T211642Z` passed Edge 151 at
  > `https://dev-celestialfrontier.github.io` with `publishable:false`. Exact docs tip/
  > upstream/check state is read live, and the selected pushed tip requires matching CI.
  > No host or publication is authorized. After the
  > matching CI is green, complete and record a multi-lens human playtest against that exact preview before marking
  > this PR Ready or merging. The static Platinum-reviewed portrait set is unchanged; later visual
  > work remains living rigs/animation and biome scenes. After merge, Anthropic/Claude Code may
  > synchronize only from a clean `anthropic/windows` worktree with `git fetch origin` then
  > `git merge origin/develop`. No release, deployment, certification, `main` change, live-site
  > change or version bump is included.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`,
does not need to be opened now and does not have this batch. It may continue
unrelated work but must not expect these changes or copy files manually. Only
after PR #11 merges, at its next coding batch and from a clean worktree, run
`git fetch origin` then `git merge origin/develop`. If dirty, do not pull,
switch or merge until its own work is safely finished/committed.

**Release status:** PR #11 is open, draft and unmerged. `develop` remains at
merged PR #10 (`61cc058`); `main` and https://celestialfrontier.github.io/ are
unchanged. No release, deployment, certification, preview publication or version
bump has occurred.

**Preview bootstrap note:** GitHub cannot manually dispatch a workflow until its
file exists on the default branch. Since PR #11 introduces
`development-preview-package.yml`, any exact pre-merge review candidate must, after matching
green CI and explicit Nick approval, use the local clean/pushed-head command in
`port/DEVELOPMENT_PREVIEW.md`. No #207-repair candidate is authorized or published.
After that workflow reaches `develop`, later candidates use the reviewed manual
workflow. Neither path deploys without a separately approved host action.

# HISTORICAL/SUPERSEDED — Platinum repair human PASS; PR #10 pre-merge handoff

**Current worktree:** `/Users/nick/Projects/celestial-frontier-openai-mac` on
`openai/mac`. Clean full-reset baseline HEAD is
`bc26e800c7adca72805a832e753ace1a8f9837ba`; Wave 1 is `d005090f`, Wave 2a is
`00e499c`, Wave 2b is `9c148f0`, and Wave 2c is committed/pushed as
`dc015cfde4385530686cf8fff7e36e13ce67769c`, and Wave 2d is committed/pushed as
`2ed0f288a95c327aa892e8b3b54ce94f626f1ab7`. Wave 2e's static checkpoint is
`5db90396dd0e33b5463ce40c32f6769c93e559be` and reached `develop` through merged
PR #8 at `bb1a980`. The Mac resume verified the checkpoint and all four frozen art-source hashes,
then failed closed before post-edit rendering because the ignored 288-row pre-edit evidence did not
cross Git. Merged PR #9 integrated the portable scanner/tooling and first current-review-package
repair into `develop` at `989142d`.

The governing feedback is preserved at
`port/v2/reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md`,
SHA-256 `5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2`.
Both supplied reviews remain byte-exact. The first retains hard-break spaces on lines 3–4; the
returned review retains them on lines 3, 4, 99, 108, 117, 129, 138, 147 and 157. Staged whitespace
verification excludes only these two immutable artifacts and pairs that exclusion with exact `cmp`
and SHA-256 checks.
It reviewed the sealed predecessor archive from source
`79ce14460998d653ee753e49e8f8016e754c82e4`, archive SHA-256
`18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5`, and correctly withheld
Platinum. That archive remains valid historical evidence; its narrower continuity conclusions are
superseded for the broader Platinum ruler.

The bounded repair now gives Sugar Glider, Flying Squirrel and Colugo three distinct
whole forms; keeps exactly Fruit Bat, Eagle, Wolf, Elephant, Chameleon, Dragonfly and Octopus on
their modern named lineage routes; protects Sea Turtle and Great White Shark on the reviewed legacy
route; strengthens Apple, Vanilla Orchid and Oyster Mushroom drift; and adds Amoeba as the principal
microbe row. Hybrid schema v4 is 13 lineages ×5 stages /251 assets. Clean source
`03ea297e4f8ec61461310b0312a7363027ce90e3` produced the sealed 2,163-PNG archive
`Celestial_Frontier_Current_Platinum_Repair_Full_Generations_Review_2026-08-11_03ea297.zip`,
470,045,987 bytes at SHA-256 `ef7a6e9bb720ab6e6e1497569ade194b471ed7ab63449ee94ea5c94c57372f4b`.
Its exact external review is preserved at
`port/v2/reference/Celestial_Frontier_Current_Platinum_Repair_All_Pass_Review_2026-08-11.md`,
SHA-256 `1c6c49e74270e9c69800de5b10b031aacf73a7a30937350086e97bc712823b3f`, and returns
**PASS with optional polish only / APPROVE** with no blocker-level issue. The sealed archive's
embedded `CURRENT_ONLY / UNREVIEWED / NOT_CERTIFIED` preparation fields remain immutable; the
human PASS is a separate package-level overlay, not formal full-reset certification.
Once this review-document commit advances HEAD beyond `03ea297`, a live `--freshness`
check correctly reports `STALE_FOR_CURRENT: source commit differs`; that does not
invalidate the sealed package or the review bound to its original source.

Wave 2e remains separately blocked by its missing ignored baseline. Draft PR #10 carries this
Platinum repair from `openai/mac` into `develop`. No merge, new literal 1,250-row verdict tally,
formal certification, release, deployment, or version bump exists.

Read first: `ROADMAP.md`, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`,
`port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`,
`ART_DIRECTION.md`, `PROCEDURAL_CHARACTERISTICS.md`,
`LINEAGE_AND_BREEDING.md`, `port/PROPORTION_ARC.md`, `port/v2/README.md`, and
`port/v2/DEVIATIONS.md`.

## Frozen ledger and scoped checkpoints

The immutable clean `bc26e8` result remains **516 PASS / 14 POLISH / 720 FAIL**
across all 1,250 fresh rows. It is a repair baseline, not a certificate. Never
add scoped PASS results to that ledger:

| checkpoint | exact scope | independent status | repository state |
|---|---:|---|---|
| Wave 1 | 177 | 177 PASS | committed/pushed `d005090f` |
| Wave 2a catalogue | 32 | 32 PASS | committed/pushed `00e499c` |
| Wave 2b catalogue | 51 | 51 PASS | committed/pushed `9c148f0` |
| Wave 2c catalogue | 56 | 56 PASS | committed/pushed `dc015cf` |
| Wave 2d catalogue | 50 | 50 PASS | committed/pushed `2ed0f28` |

Wave 2d is Mammal D 16 + Bird B3 27 + Invert III 7. Vanilla Orchid r6's 234/234
focused continuity result remains sealed history, but that narrower verdict is
**superseded for the broader Platinum continuity ruler**. None of these scoped
closures replaces the 1,250-row ledger or supplies a current hybrid verdict.

## Wave 2d exact closure

### Mammal D — 16/16 PASS

Targets: Badger, Civet, Fisher, Giant Otter, Marten, Mink, Mongoose, Otter,
River Otter, Sea Otter, Wolverine, Capybara, Hyrax, Mara, Marsh Rodent, Mole.
The first shared preview failed closed on six exact blockers: Fisher's tail
silhouette, Marten's ear morphology, Wolverine's claw read, Sea Otter's body
rotation/pose, Hyrax's ear scale, and Mole's snout-versus-forepaw separation.
Bounded R2 changed only those six while the other ten targets were retained.

The first independent final judgment then returned **15 PASS / 1 FAIL** because
Civet still read with a round head/circular muzzle instead of the frozen long,
pointed muzzle contract. Bounded R4 changed Civet alone. Its 3/3 surfaces drift
from the earlier final while the other 303 rows /909 surfaces remain exact. The
independent Civet rejudge returned PASS, closing Mammal D at 16/16.

Final mammal sources:

- `quadrupedoverrides.ts`
  `544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1`
- `mammaloverrides.ts`
  `776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E`

### Bird B3 — 27/27 PASS

Targets: Chough, Crow, Jay, Raven, Guineafowl, Peacock, Pheasant, Rooster,
Turkey, Quetzal, Kookaburra, Sandgrouse, Tropicbird, Weaverbird, Cockatoo,
Macaw, Parrot, Dove, Pigeon, Finch, Lark, Sparrow, Starling, Swift, Tanager,
Hornbill, Toucan.

The initial author screen was **11 candidate-ready / 16 blocked**: Chough,
Crow, Raven, Peacock, Pheasant, Rooster, Quetzal, Sandgrouse, Cockatoo, Macaw,
Parrot, Dove, Pigeon, Finch, Swift, and Hornbill. R2 changed exactly those 16;
13 closed, while Pheasant's tail remained shorter than its body, Quetzal's
streamers remained only about body length, and Macaw's tail remained shorter
than its body. R3 changed exactly those three. The author screen found all 27
candidate-ready, and the independent final judge returned **27 PASS / 0 FAIL**
at 440/300/132 with 100 lane controls exact. Civet-only R4 carried every Bird
surface byte-exact.

Final bird sources:

- `faunaoverrides.ts`
  `63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2`
- `birdoverrides.ts`
  `48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7`

### Invert III — 7/7 PASS

Targets: Sea Spider, Camel Spider, Pseudoscorpion, Scorpion, Spider, Tarantula,
Millipede. The first strict screen kept Camel Spider open because its paired
chelicerae/open gape vanished at 132px and kept Tarantula open because its
contrasting cheliceral bases, down-folding hooked fangs, and short palps were
weak or hidden. Bounded R2 changed exactly those two and retained the other five
targets byte-exact. The independent final judge returned **7 PASS / 0 FAIL** at
all three scales.

Final `invertoverrides.ts` SHA-256:
`2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677`.

## Final shared-R4 evidence

The pre-edit baseline seal is
`7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F`.
The final admissible root is
`port/v2/apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10`.
Manifest SHA-256:
`DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`.

- 304 rows =50 targets +254 protected controls.
- 912 surfaces/run; 1,824 physical PNG hashes and dimensions verified.
- Current/repeat exact on 304/304 rows and 912/912 surfaces.
- Pre-edit protected exact on 254/254 rows and 762/762 surfaces.
- All 50 targets changed on 150/150 surfaces.
- Civet-only R4 changed 3/3 surfaces; the other 303 rows /909 surfaces stayed
  exact to the preceding final.
- Three 139-file source/input snapshots have zero drift; aggregate SHA-256 is
  `58553184F25A8E2D4EDBA4811BEE8087BCAA7E48AC2AD978D96D264FEC793CBC`.
- Current index SHA-256:
  `92CFC48A4DBC401FC69F4C6F824D50834B7451D89E575711CD416981D06CA9EA`.
- Repeat index SHA-256:
  `D62A661FA5396D7B0396B1A13F7211CCA924D3C6126768370FBC40D6812D80B7`.
- Four negative controls were rejected. Source/input/status/manifest records are
  exact, and the evidence remains author-neutral.

## Pixel-neutral P2 cleanup — closed with proof

The three Wave-2c deferred cleanups landed inside their Wave-2d owner lanes:

- the Mammal C `marsupial-c1` dispatcher is explicit and exhaustive;
- Skua's unreachable Snow-Petrel colour alternative is removed;
- exact Invert-II legacy non-hue options shadowed by named early returns are
  removed.

These are route-proven cleanup changes, not visual retcons. The shared
pre-edit/final comparison keeps all 254 protected rows /762 surfaces exact at
440/300/132, including the accepted prior-wave identities.

## Integrated gate status — green

All five final source hashes and the 139-input aggregate
`58553184F25A8E2D4EDBA4811BEE8087BCAA7E48AC2AD978D96D264FEC793CBC`
remained exact. The authoritative integrated report is green:

- `git diff --check`, typecheck, and artunused PASS.
- Vitest: 23 files, 238 pass, 1 skip.
- speccheck: 419 declared /0 unread /0 inert; selftest 5/5.
- coveragegap: 1,010/1,010; artaudit: 23 sources /0.
- tokencheck selftest: 16/16. Its ordinary 445 values /23 dead /14 aliases
  output is diagnostic, not a verdict.
- overridecheck: 1,014/1,014 routes and 1,010/1,010 species.
- speciesaudit: 1,250/1,250, 0 failure, 0 duplicate, 0 clipped.
- hybridcheck PASS with all 11 negative controls rejected.
- hybridmatrix and speciesstrip selftests PASS.
- fullresetlayout PASS; fullresetreview PASS with 10/10 joins, 6 packets, and
  9 changed-fixture checks.
- No nonignored generated output leaked; the renderer drained.

Wave 2d is committed/pushed as `2ed0f28`. This closes only the bounded checkpoint; it
does not authorize the reset PR, merge, full 1,250 recertification,
certification image-inclusive ZIP, release, or deployment.
The full 1,250 recertification, its certification image-inclusive ZIP, reset PR, merge, release,
and deployment all remain **OPEN**.

## Wave 2e static checkpoint and fail-closed Mac resume

1. **Mammal E (13 bovids):** Buffalo, Cow, Eland, Gaur, Gazelle, Hartebeest,
   Impala, Kudu, Musk Ox, Oryx, Water Buffalo, Wildebeest, Yak. Owners:
   `quadrupedoverrides.ts` and `mammaloverrides.ts`.
2. **Fauna E (21 squamates):** Agama, Anole, Gecko, Skink, Wall Lizard,
   Whiptail, Alligator Lizard, Gila Monster, Horned Lizard, Grass Snake, King
   Snake, Rat Snake, Vine Snake, Water Snake, Mountain Viper, Snake, Cobra,
   Cottonmouth, Mamba, Rattlesnake, Viper. Owner: `faunaoverrides2.ts`.
3. **Invert IV (13 insect-body rows):** Bumblebee, Honeybee, Orchid Bee, Bee,
   Butterfly, Fly, Mantis, Moth, Termite, Thrips, Wasp, Black Fly, Mosquito.
   Owner: `invertoverrides.ts`.
4. **Documented Windows pre-edit union:**
   `port/v2/apps/game/smoke/wave2e-shared-preedit-baseline-2026-08-10/baseline`.
   Seal `BC424C8FC8D19DDC7A23F81A946CDE99AF2A7FED759129E132233E23C598AA37`; index
   `2AE4FDB1D443698A092304C22573D8604C07D5B42752E967549D6B038FCD26E3`. It binds
   288 rows =47 targets +241 protected, 864 physical PNG hashes/dimensions, and three exact
   139-file source/input snapshots. This directory is ignored by
   `port/v2/apps/game/.gitignore`, is absent from the Mac worktree and every Git ref, and has no
   tracked scoped-capture/reconstruction script. Therefore its seal, index, protected roster, and
   negative-control implementation cannot yet be independently verified on Mac. Do not substitute
   a new baseline or begin post-edit A/B promotion until the exact root is recovered, or Nick
   explicitly authorizes deterministic reconstruction from pre-edit `2ed0f28` and both frozen hashes
   are reproduced. A bounded portability seam now lets `gp71rejudge` and
   `fullresetlayout`/`fullresetreview` resolve an exact `CF_BROWSER` or checked platform browser,
   which permits a separate current-only Mac export. That does not replace the absent scoped
   baseline or unlock Wave 2e A/B. `speciesstrip`, `speciesaudit`, and `hybridblendcheck` remain
   Windows-bound, and their prior Windows passes are not fresh Mac evidence.
5. **Paused static-green source state; not a visual verdict:**
   `quadrupedoverrides.ts` `AE8E3830EF57233EB43ABE0F594E335A050A1DB3375F08781FF61549B0C6D288`;
   `mammaloverrides.ts` `74BBD77CD8BA8E3C22D503AD42FB667EDB74AF6ED3C73551ED283223B28CF80B`;
   `faunaoverrides2.ts` `30B2E3E2BCDA4865EE81625805384B373423274E0634F8A50F8E4D5A20483378`;
   `invertoverrides.ts` `6785058479456FF35EE3C44D9FC8F8A9A5467B7F61BBF3153854F93B090A5C1C`.
   Integrated pause checks PASS: typecheck, artunused, Vitest 23 files/238 pass/1 skip, speccheck
   455/0 unread/0 inert, and `git diff --check`. No Wave-2e-scoped old/current A/B export,
   440/300/132 comparison review, deterministic A/B repeat, independent judgment, final integrated
   gate closure, reset PR, certification package, merge, release, or deployment has occurred.
6. **Scanner repair closed and independently reviewed:** pinned Rolldown 1.2.1/Oxc parses each
   complete TypeScript art source as an AST; only literal string property/array nodes become
   route keys, every such key is validated regardless of length or alphabet, and malformed CANON
   keys cannot disappear. Inline plan and ternary strings are expected-pass controls. Duplicates after
   template/regex, control-head/member-call, Unicode-identifier and ASI grammar traps remain required
   failures. Full-source declaration traversal covers parenthesized, annotated, comment-separated
   and later `const` declarators; post-declaration writes/aliases and malformed route-table source
   must exit 2. Painter values must be statically callable (and quadruped specs objects) through
   immutable, unwritten exact local/import bindings; supported factories must return a direct
   callable expression. Neither `null!`, mutable aliases, nor truthy objects count as painters. Genuine
   dead, duplicate, shadowed, unclassified, new-file, and unwired-table
   mutations must exit exactly 1 with their own diagnostic. Restoration verifies ownership and
   refuses to overwrite concurrent edits. Wiring is measured only from supported route-selection
   initializer AST shapes, their exact precedence and executable guard/call/fallback/furniture
   consumer chains, and the returned-canvas `fitInk` path inside parsed `resolveOverride`.
   The denominator is one exact four-kingdom `_EARTH_NAMES` AST with its read-only consumer pinned;
   quote style or post-initializer mutation cannot hide roster entries. Disconnected consumers,
   always-false predicates, discarded/inert syntax, and later `OVERRIDE_COUNT` mentions cannot
   mask a disconnected table. Computed route members/methods outside exact audited consumer nodes
   fail closed. Recursive `.ts`/`.mts`/`.cts`/`.tsx` discovery rejects untracked executable
   sources/imports/re-exports; normalized full-path plus actual-export ownership prevents nested
   same-basename and export impersonation. Shadow direction follows resolver precedence, and
   incomplete kingdom-qualified route coverage plus helper parameter/reassignment/implementation
   drift and direct trusted-global escape fail closed. This static sentinel assumes standard
   unmodified platform intrinsics and approved dependency implementations; it does not replace
   rendering or visual review. Final
   output is 1,014/1,014 live routes and 1,010/1,010 Earth species. Independent post-edit provenance
   and resolver/compositor reviews returned PASS. Static gates: typecheck/artunused; Vitest 23 files/238 pass/1 skip; speccheck 455/0/0;
   coveragegap 1,010/1,010; artaudit 23/0; overridecheck/overridecontrol; `git diff --check` PASS.
7. Bird reset FAIL scope is exhausted: B1–B3 exactly cover all 76 frozen-r1
   Bird FAIL rows. Do not reopen the 26 frozen-PASS birds.
8. **Sealed predecessor current-generation archive — historical and superseded for current review:**
   `Celestial_Frontier_Current_Full_Generations_Review_2026-08-10_79ce144.zip`,
   472,304,848 bytes, SHA-256
   `18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5`. It binds
   clean evidence commit `79ce14460998d653ee753e49e8f8016e754c82e4` and deep-reverifies one
   top-level directory with exactly 2,146 PNGs: 1,250 native portraits (631 fauna +332 flora +27
   fungi +20 microbe +240 procedural), 196 catalogue strips, 466 official layout sheets, and 234
   representative hybrid assets. Its manifest says `CURRENT_ONLY / UNREVIEWED / NOT_CERTIFIED`;
   hybrid continuity remains OPEN and the included review template is blank and hash-bound. The
   Platinum feedback reopens its narrower 234-asset continuity scope; do not present this predecessor
   archive as the current repaired package. Its schema-v4 successor is 13×5 /251 hybrid assets and
   2,163 PNGs total. The sealed successor retains `CURRENT_ONLY / UNREVIEWED / NOT_CERTIFIED` as its
   preparation status; the separate hash-bound human review returns PASS with optional polish only.
   The immutable ZIP sidecar and PR verification transcript remain the authority for its clean source
   and original freshness. Formal certification still requires the separate all-fresh collector.

## Parallel Git handoff

Current side: OpenAI/Codex on macOS, branch `openai/mac` — the Platinum repair, clean-commit
evidence, exact external sidecar and byte-preserved human PASS review are complete in draft PR #10.
The review is package-level approval, not formal full-reset certification. Wave 2e remains separately
blocked because its ignored baseline did not cross machines.

GitHub step: review draft PR #10 at <https://github.com/TheDakk/Celestial-Frontier/pull/10> using
the PR evidence transcript, immutable package sidecar and returned review; click **Ready for review**,
then when satisfied choose the normal **Merge pull request** into `develop` (no squash or rebase).
No automatic merge is authorized.

PR details: base `develop`; source `openai/mac`; title `Address Platinum glider and lineage review`;
description `Implements the repairs required by the hash-bound Platinum review: three distinct
whole-form gliders; exact seven-fauna modern lineage routing with Sea Turtle and Great White Shark
protected; stronger Apple, Vanilla Orchid and Oyster Mushroom drift; and Amoeba as the principal
microbe row. Preserves the original feedback and exact returned PASS review at SHA-256
`1c6c49e74270e9c69800de5b10b031aacf73a7a30937350086e97bc712823b3f`; upgrades hybrid evidence to schema v4
(13x5 /251 assets) plus the current-only package to 2,163 PNGs with exact blank-input validation,
six-field browser provenance, non-overwriting sidecar publication and post-hoc freshness checks.
Verification: typecheck, Vitest, artunused, speccheck, coveragegap, artaudit, overridecheck and its
negative controls, hybrid browser audit, hybridmatrix/currentreviewpackage/gliderreview/browser
selftests, clean-commit capture/repeat/package verification, exact ZIP/sidecar recheck, byte-exact
review preservation, and git diff --check. External package-level review returned PASS with optional
polish; the sealed archive remains internally UNREVIEWED / NOT CERTIFIED and the missing Wave 2e
baseline remains blocked. After merge,
Anthropic/Claude Code synchronizes only from a clean anthropic/windows worktree with git fetch
origin then git merge origin/develop. No release, deployment, certification or version bump is
included.`

Other side: Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not have this repair
yet and need not be opened now. Only after PR #10 merges, at its next coding batch and from a clean
worktree, run `git fetch origin` then `git merge origin/develop`; if dirty, do not pull, switch, or
merge first. Do not copy files manually.

Release status: `develop` includes merged PR #9 at `989142d`; Platinum repair draft PR #10 remains
pending. `main` and the live site are unchanged. No merge of PR #10, release, deployment,
certification, or version bump has occurred.

# Historical Wave-2c/Wave-2d-opening handoff — superseded by Wave 2d closure

_Retained below for history. Its schema-v3 /234-asset continuity claims are
superseded for the broader Platinum ruler and are not current verdicts._

# ★ LIVE — Wave 2c pushed; Wave 2d active (2026-08-10)

**Current worktree:** `C:\Projects\celestial-frontier-openai-windows` on
`openai/windows`. Clean full-reset baseline HEAD is
`bc26e800c7adca72805a832e753ace1a8f9837ba`; Wave 1 is `d005090f`, Wave 2a is
`00e499c`, Wave 2b is `9c148f0`, and Wave 2c is committed/pushed as
`dc015cfde4385530686cf8fff7e36e13ce67769c`. Wave 2d is the active bounded
repair batch on `openai/windows`. PR #7 is historical/already merged. No reset PR, new
full-catalogue tally, 1,250-row certification, image-inclusive ZIP, release,
deployment, or version bump exists.

Read first: `ROADMAP.md`, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`,
`port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`,
`ART_DIRECTION.md`, `PROCEDURAL_CHARACTERISTICS.md`,
`LINEAGE_AND_BREEDING.md`, `port/PROPORTION_ARC.md`, `port/v2/README.md`, and
`port/v2/DEVIATIONS.md`.

## Frozen ledger and scoped checkpoints

The immutable clean `bc26e8` result remains **516 PASS / 14 POLISH / 720 FAIL**
across all 1,250 fresh rows. It is a repair baseline, not a certificate. Never
add scoped PASS results to that ledger:

| checkpoint | exact scope | independent status | repository state |
|---|---:|---|---|
| Wave 1 | 177 | 177 PASS | committed/pushed `d005090f` |
| Wave 2a catalogue | 32 | 32 PASS | committed/pushed `00e499c` |
| Wave 2b catalogue | 51 | 51 PASS | committed/pushed `9c148f0` |
| Wave 2c catalogue | 56 | 56 PASS | committed/pushed `dc015cf` |

Wave 2c is Mammal C 13 + Bird B2 28 + Invert II 15. Vanilla Orchid r6 remains
a separate focused continuity PASS with 234/234 assets. None of these scoped
closures is a replacement 1,250-row tally.

## Wave 2c exact closure

### Mammal C — 13/13 PASS

Targets: Red Fox, Wolf, Dingo, Dog, Fox, Pampas Fox, Kinkajou, Raccoon, Red
Panda, Possum, Quoll, Tasmanian Devil, Wombat. The initial whole-form preview
was **0/13 candidate-ready** because modular/tube joins and rigid attachments
required continuous forms. R2 reached **8 PASS / 5 FAIL**: Wolf, Pampas Fox,
Red Panda, Possum and Tasmanian Devil remained. R3 reached **11/13**; both R3
and R4 failed closed on Red Panda's leg/body fill-order join and Tasmanian
Devil's chest-band integration. R5 closed both, and final independent shared
judgment returned **13/13 PASS**.

Final source hashes:

- `quadrupedoverrides.ts`
  `45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59`
- `mammaloverrides.ts`
  `50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2`

Its lane projection is 113 rows =13 targets +100 protected controls. All 39
target surfaces changed and all 300 protected surfaces remain exact to the
shared baseline.

### Bird B2 — 28/28 PASS

The first independent shared judgment returned **25 PASS / 3 FAIL**. Eider
Duck stood above rather than low in water; Rail's cocked tail was detached and
its bill read too straight; Avocet's bill was a straight spike rather than a
recurved needle. A bounded repair changed exactly those three. Current-only
preview judgment was explicitly provisional; the final admissible A/B then
returned **3/3 PASS**, making the lane 28/28. The other 25 targets +72 controls
remain exact on 291/291 surfaces.

Final source hashes:

- `faunaoverrides.ts`
  `D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5`
- `birdoverrides.ts`
  `C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21`

### Invert II — 15/15 PASS

Targets: Freshwater Crab, Mud Crab, Vent Crab, Hermit Crab, Brine Shrimp,
Fairy Shrimp, Freshwater Shrimp, Tadpole Shrimp, Vent Shrimp, Amphipod,
Copepod, Krill, Lobster, Prawn, Shrimp. The first author preview failed closed
at **10/15** on Brine Shrimp, Freshwater Shrimp, Tadpole Shrimp, Vent Shrimp
and Amphipod; bounded R2 made those five candidate-ready while ten retained
targets stayed exact on 30/30 surfaces and 27 controls stayed exact on 81/81.
The first independent shared judgment then returned **13 PASS / 2 FAIL** on
Krill and Tadpole Shrimp. The final repair made the conspicuous compound eyes
and organic leaf-limb field survive card scale; final independent judgment
returned **2/2 PASS**.

Final `invertoverrides.ts` SHA-256:
`6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0`.

## Final shared-R2 evidence

The admissible root is
`port/v2/apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10`.
Manifest SHA-256:
`BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`.

- 249 rows =56 targets +193 protected controls.
- 747 surfaces/run; 1,494 physical PNG hashes and dimensions verified.
- Current/repeat exact on 249/249 rows and 747/747 surfaces.
- Shared-baseline protected exact on 193/193 rows and 579/579 surfaces.
- All 56 targets changed on 168/168 surfaces.
- Final R2 changed only Eider Duck, Rail, Avocet, Krill and Tadpole Shrimp;
  the other 244 rows /732 surfaces stayed exact to the first shared final.
- Three 139-file source/input snapshots share aggregate SHA-256
  `F153BD18B9155A4197C823C7B218B3533FEF426AEB6C7772519DC926A8A132A1`
  with zero drift.
- Current index SHA-256:
  `F7FB4697AD160302B389263332CC21EF240B1FD28596CE499A3124DFCA6F888E`.
- Repeat index SHA-256:
  `66F04AF9EBA638D00DFB4F5F235413A762F4DF368616B8FE65F260A19E2CE43C`.
- Three negative controls were rejected. The manifest says
  `READY_FOR_INDEPENDENT_JUDGMENT` and `self_verdict: false`; independent lane
  verdicts above complete the human judgment layer.

## Integrated gate closure

All five final source hashes remained unchanged. The authoritative integrated
record is green:

- typecheck PASS; artunused PASS.
- Vitest: 23 files, 238 passed, 1 skipped.
- speccheck: 418 declared, 0 unread, 0 inert.
- overridecheck: 1,014/1,014 live and 1,010/1,010 Earth.
- speciesaudit: 1,250/1,250, 0 failure, 0 duplicate pairs, 0 clipped.
- hybridcheck PASS with 11/11 injected failures rejected.
- hybridmatrix and speciesstrip selftests PASS.
- coveragegap: 1,010/1,010 with 0 remaining.
- fullresetlayout and fullresetreview serialized selftests PASS.
- `git diff --check` PASS; no tracked or untracked generated leakage.

This closes bounded checkpoint readiness only. It does not authorize the reset
PR, merge, recertification, ZIP, release, or deployment.

The final code-quality reread found no P0/P1 blocker. Three P2 cleanups are
deliberately deferred because the accepted evidence binds the current sources:

- make the implicit `marsupial-c1` dispatcher fallthrough explicit/exhaustive
  in `quadrupedoverrides.ts:1864-1867`;
- remove Skua's unreachable Snow-Petrel colour arm in
  `faunaoverrides.ts:3171-3172`;
- simplify legacy exact-Invert-II options shadowed by named early returns at
  `invertoverrides.ts:1005-1006`, `1632-1633`, and `2937-2957`.

Do not include these in Wave 2c. A later bounded pixel-neutral cleanup must
produce fresh target/control evidence before accepting them.

## Wave 2d exact active lanes

1. **Mammal D (16):** Badger, Civet, Fisher, Giant Otter, Marten, Mink,
   Mongoose, Otter, River Otter, Sea Otter, Wolverine, Capybara, Hyrax, Mara,
   Marsh Rodent, Mole.
2. **Bird B3 (27):** Chough, Crow, Jay, Raven, Guineafowl, Peacock, Pheasant,
   Rooster, Turkey, Quetzal, Kookaburra, Sandgrouse, Tropicbird, Weaverbird,
   Cockatoo, Macaw, Parrot, Dove, Pigeon, Finch, Lark, Sparrow, Starling, Swift,
   Tanager, Hornbill, Toucan.
3. **Invert III (7):** Sea Spider, Camel Spider, Pseudoscorpion, Scorpion,
   Spider, Tarantula, Millipede.
4. The same owner lanes must recapture pixel-neutral proof for the deferred P2
   cleanup: explicit `marsupial-c1` dispatch, dead Skua snow arm removal, and
   shadowed Invert-II legacy options.
5. A clean full 1,250 collector, final hybrid evidence, literal certification
   and dated image-inclusive ZIP begin only after every remaining row closes.

## Parallel Git handoff

Current side: OpenAI/Codex — Wave 2c commit `dc015cf` is pushed/synchronized;
Wave 2d is active and uncommitted. GitHub step: none at this bounded checkpoint.
PR details: not needed.
Other side: Anthropic/Claude Code does not have Wave 2a, Wave 2b or Wave 2c
through `develop`; Nick does not need to open it now, and files must never be
copied manually. After a future reviewed Codex PR merges into `develop`, Claude
starts from a clean `anthropic/windows`, fetches, and merges `origin/develop`
under `PARALLEL_GIT_PROTOCOL.md`. Release status: `develop`, `main`, and the
live site remain unchanged; no release or deployment occurred.

# Historical Wave-2b/Wave-2c-opening handoff — superseded by Wave 2c closure

_Any schema-v3 /234-asset continuity statement below is sealed historical
evidence, superseded for the broader Platinum ruler._

_Retained verbatim below for history._

# ★ LIVE — Wave 2b pushed; Wave 2c active (2026-08-10)

**Current worktree:** `C:\Projects\celestial-frontier-openai-windows` on
`openai/windows`. Clean full-reset baseline HEAD is
`bc26e800c7adca72805a832e753ace1a8f9837ba`; Wave 1 is `d005090f`, Wave 2a is
`00e499c`, and Wave 2b is committed/pushed as
`9c148f071bb8e4ad8d3e92358c6408fc234f22bd`. Wave 2c is the active bounded
repair batch. PR #7 is historical/already merged. No reset PR, new
full-catalogue tally, 1,250-row certification, final image-inclusive ZIP,
release, deployment, or version bump exists.

Read first: `ROADMAP.md`, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`,
`port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`,
`ART_DIRECTION.md`, `PROCEDURAL_CHARACTERISTICS.md`,
`LINEAGE_AND_BREEDING.md`, `port/PROPORTION_ARC.md`, `port/v2/README.md`, and
`port/v2/DEVIATIONS.md`.

## Frozen ledger and accepted checkpoints

The immutable clean `bc26e8` result remains **516 PASS / 14 POLISH / 720 FAIL**
across all 1,250 fresh rows. It is a repair baseline, not a certificate. Scoped
results never mutate that ledger:

| checkpoint | exact scope | independent status | repository state |
|---|---:|---|---|
| Wave 1 | 177 | 177 PASS | committed/pushed `d005090f` |
| Wave 2a catalogue | 32 | 32 PASS | committed/pushed `00e499c` |
| Wave 2b catalogue | 51 | 51 PASS | committed/pushed `9c148f0` |

Wave 1 is root 38 + fish 59 + trees 48 + fauna2 32. Wave 2a is Mammal A 4 +
worms/sessile 13 + S1–S3 15. Vanilla Orchid r6 is a separate focused continuity
PASS with 234/234 assets, exact pure pixels, five integrated stages, both browser
orders and eleven negative controls. None of these is a new 1,250-row tally.

## Wave 2b exact closure

### Mammal B — 25/25 PASS

The first independent round returned **19 PASS / 6 FAIL**. Bounded R3 repaired
exactly **Brown Bear, Grizzly Bear, Bobcat, Lynx, Serval, Sand Cat**; independent
rejudgment returned **6/6 PASS** at 440/300/132. Frozen sources:

- `quadrupedoverrides.ts`
  `288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE`
- `mammaloverrides.ts`
  `2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA`

Sealed evidence is
`port/v2/apps/game/smoke/wave2-mammal-b-r3-sealed-evidence-2026-08-10`.
Manifest SHA-256 is
`B31B8BD7D84DDA513AF7714E1C0CBEDB6AB056D9FF99965193129160968C1C92`:
600 PNG hash/dimension checks and 300/300 current/repeat surfaces are exact;
exactly six targets changed, while 19 retained PASS rows +75 controls remain
exact on 282/282 surfaces.

### Bird B1 — 21/21 PASS

The first independent round returned **17 PASS / 4 FAIL**. Bounded R2 repaired
exactly **Secretary Bird, Rhea, Seriema, Hummingbird**; independent rejudgment
returned **4/4 PASS** at all three delivery sizes. Frozen sources:

- `faunaoverrides.ts`
  `783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10`
- `birdoverrides.ts`
  `B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF`

Evidence is
`port/v2/apps/game/smoke/wave2b-bird-b1-r2-evidence-2026-08-10`: 432 PNGs,
zero hash/dimension/repeat errors, exactly four changed targets, and all 51
protected rows byte-exact at 440/300/132.

### Invert I — 5/5 PASS

The exact targets are **Banana Slug, Chiton, Comb Jelly, Portuguese Man-of-War,
Isopod**. The first candidate failed closed because Banana Slug's four-tentacle
and tip-eye read did not survive 132px. A Banana-only refinement changed its
3/3 surfaces while the other four targets +20 controls stayed exact on 72/72.
Independent review then returned **5/5 PASS**. Frozen `invertoverrides.ts` SHA-256:
`9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D`.
Evidence is
`C:\Users\Nick\.codex\visualizations\2026\08\09\019fe72d-20c7-73a0-bac7-d2c64d10673d\invert-wave2-isolated-topology-i\{final-current,final-repeat}`:
150/150 PNGs complete/exact and matching aggregate SHA-256
`0BDE0E3C01EF7E5FBEACFCA885D544BB02F73470B7E9B9A8854D9FBAA953671F`.

## Final integrated gate closure

All five frozen Wave-2b source SHAs remained unchanged. `typecheck` and
`artunused` pass; `speccheck` reports 417 declared / 0 unread / 0 unobservable;
`overridecheck` reports 1,014/1,014 catalogue routes and 1,010/1,010 Earth
routes; `speciesaudit` reports 1,250/1,250 portraits with zero failure,
duplicate, or clipping; targeted/full diff checks pass. This makes the bounded
checkpoint ready for its now-pushed commit. It does not authorize a reset PR, merge,
recertification, ZIP, release, or deployment.

## Wave 2c exact active lanes

1. **Mammal C (13):** Red Fox, Wolf, Dingo, Dog, Fox, Pampas Fox, Kinkajou,
   Raccoon, Red Panda, Possum, Quoll, Tasmanian Devil, Wombat.
2. **Bird B2 (28):** Duck, Eider Duck, Goose, Flamingo, Heron, Bittern, Egret,
   Coot, Moorhen, Rail, Pelican, Booby, Cormorant, Frigatebird, Gannet, Puffin,
   Petrel, Seabird, Skua, Snow Petrel, Tern, Avocet, Godwit, Snipe,
   Oystercatcher, Sandpiper, Grebe, Loon.
3. **Invert II (15):** Freshwater Crab, Mud Crab, Vent Crab, Hermit Crab, Brine
   Shrimp, Fairy Shrimp, Freshwater Shrimp, Tadpole Shrimp, Vent Shrimp,
   Amphipod, Copepod, Krill, Lobster, Prawn, Shrimp.
4. Freeze each owner source during capture/judgment and protect accepted named
   and procedural controls. Only after every row closes may a new clean 1,250
   collection, final hybrid evidence, literal certification and dated
   image-inclusive ZIP begin.

## Parallel Git handoff

Current side: OpenAI/Codex — Wave 2b commit `9c148f0` is pushed/synchronized;
Wave 2c is active and uncommitted. No reset PR exists. Other
side: Anthropic/Claude Code does not have Wave 2a/2b through `develop`, and Nick
does not need to open it now. Never copy files manually. After a future reviewed
Codex PR merges into `develop`, Claude starts from a clean `anthropic/windows`,
fetches, and merges `origin/develop` under `PARALLEL_GIT_PROTOCOL.md`; Codex uses
the same clean-start rule after `develop` moves. `develop`, `main`, and the live
site remain unchanged; no release or deployment occurred.

# Historical Wave-1/Wave-2-opening handoff — superseded by Wave 2a record

> The former live block below is preserved verbatim for provenance. Its Vanilla
> blocker and opening Wave-2 next steps are superseded by the live block above.
> Its schema-v3 /234-asset findings are likewise historical and cannot be carried
> into the schema-v4 Platinum judgment.

# ★ LIVE — Wave 1 committed; Wave 2 family repairs underway (2026-08-10)

**Current worktree:** `C:\Projects\celestial-frontier-openai-windows` on
`openai/windows`. Clean full-reset baseline HEAD is
`bc26e800c7adca72805a832e753ace1a8f9837ba`; Wave 1 is committed and pushed as
`d005090f` on `openai/windows`. Independent review and the complete Wave-1 gate
set are finished. Wave 2 is now a bounded, uncommitted family-repair batch on top.
PR #7 is historical/already merged. No
reset PR, 1,250-row certification, final image-inclusive ZIP, release,
deployment, or version bump exists.

Read first: `ROADMAP.md`, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`,
`port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`,
`ART_DIRECTION.md`, `PROCEDURAL_CHARACTERISTICS.md`,
`LINEAGE_AND_BREEDING.md`, `port/PROPORTION_ARC.md`, `port/v2/README.md`, and
`port/v2/DEVIATIONS.md`.

## Frozen r1 truth

All 1,250 rows were freshly reviewed from clean commit `bc26e8` in the official
181-family / 233-packet layout. The hash-bound collector accepted every required
440px, unlabeled 300px, actual unlabeled 132px, labelled old/current, and exact
set+species contract surface as **516 PASS / 14 POLISH / 720 FAIL**. Per set:

| set | PASS | POLISH | FAIL |
|---|---:|---:|---:|
| Earth fauna | 151 | 6 | 474 |
| Earth flora | 125 | 0 | 207 |
| Earth fungi | 16 | 0 | 11 |
| Earth microbes | 12 | 2 | 6 |
| Procedural | 212 | 6 | 22 |
| **total** | **516** | **14** | **720** |

This is the frozen reset baseline, not a certificate:
`port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json` records
`all_rows_literal_pass: false` and `literal_certification_eligible: false`.
GP7/GP7.1 and their r1/r2/r3 rounds remain quarantined history and cannot
replace it.

## Wave 1 exact scope and closure

Wave 1 contains exactly **177 reset non-PASS targets**:

| owner wave | targets | current independent result |
|---|---:|---|
| root-owned fungi/microbes/procedural | 38 | 38 PASS |
| fish (`faunaoverrides3.ts`) | 59 | 59 PASS |
| trees (`florarost.ts` + `floraoverrides2.ts`) | 48 | 48 PASS |
| fauna2 (`faunaoverrides2.ts`) | 32 | 32 PASS |
| **total** | **177** | **177 PASS** |

The root 38 are exactly 2 fungi + 8 microbes + 28 procedural identities. The
root ownership files are `alientraits.ts`, `invertoverrides.ts`,
`proceduralfamilies.ts`, `proceduraloverrides.ts`, and `speciesoverrides.ts`.
Every owner wave was independently judged on fresh 440/300/132 evidence with
its protected controls and deterministic repeats. Do not add 177 to 516 and
claim a new catalogue score: changed scoped pixels need a later complete
post-Wave-1 collector run, and the rest of the catalogue has not been rejudged.

## Historical schema-v3 /234-asset hybrid closure — superseded by Platinum ruler

Apple's continuity repair is independently judged PASS at `floraoverrides2.ts` SHA-256
`D3801E5A234D0D58DF6BAD1515D7583D53ED96C1939EABBE8B02376204503624`.
All 58/58 tree target/control rows are exact at 440/300/132 (174/174 hashes).
All five Apple stages are unique, with pixel distance from pure strictly
increasing as the Earth anchor falls. Schema v3 validates 234/234 assets and both
browser orders are stable. Judge evidence is at
`C:\Users\Nick\.codex\visualizations\2026\08\09\019fe72d-20c7-73a0-bac7-d2c64d10673d\flora-tree-focus\evidence-apple-continuity-judge`.

The matrix still reports `FAIL_BYTE_IDENTICAL_STAGES` solely because the
pre-existing Vanilla Orchid owner renders all five stages identically. Broader
hybrid visual continuity therefore remains OPEN. The earlier Green Algae stop
was a real schema-v2 harness contract bug, not transient provenance: schema v3
separates the current flora catalogue identity from the retained legacy microbe
compatibility route, and its sentinels are green. These hybrid conditions are
separate from the closed 177 catalogue target verdicts. Vanilla Orchid belongs
to a later bounded continuity wave and does not block this checkpoint commit.

## Whole-form and stale-route rule learned in Wave 1

A whole-form named painter owns one winning route and returns before legacy
generic bodies. Features placed behind that return are inert; painting a second
same-target overlay after it creates seams. Prove route ownership before fixing
or deleting code. Narrow dead branches only with target/control pixel proof.
The flora cleanup made `strictSignature` and `resetTreeSignature` mutually
exclusive for 39 overlapping names and constant-folded unreachable orchard and
citrus alternatives. It preserved all 58 tree target/control rows at all three
sizes (0/174 drift) and all 332 Earth-flora native hashes (0 drift).

## Exact next sequence

1. Continue repair waves from the frozen r1 reasons with author-separated
   judgement. Handle Vanilla Orchid in a later bounded continuity wave; do not
   promote the current matrix while `FAIL_BYTE_IDENTICAL_STAGES` remains.
2. Commit and push accepted checkpoints only on `openai/windows`; no reset PR or
   merge to `develop` until the full reset reaches its next integration boundary.
3. A fresh full 1,250 capture/collection, literal certification, and dated
   image-inclusive ZIP happen only after every remaining row closes.

Copy-ready PR title:

`art: complete full-reset Wave 1`

Copy-ready PR description:

```markdown
## Summary
- Repair exactly 177 reset-r1 non-PASS targets across bounded art owners.
- Record independent 177/177 scoped PASS and Apple continuity PASS.
- Repair hybrid-matrix Green Algae current-catalogue vs legacy-route provenance.

## Verification
- Complete Wave-1 gate set is green.
- Apple preserves 58/58 tree rows at 440/300/132 and has five strictly progressive stages.
- Schema v3 validates 234/234 assets with both browser orders stable.

## Boundaries
- Vanilla Orchid continuity remains OPEN for a later bounded wave.
- This is not full 1,250 certification; no final ZIP, release, or deployment.
```

## Parallel Git handoff

Current side: OpenAI/Codex — Wave 1 commit `d005090f` is pushed on
`openai/windows`; Wave 2 is local and uncommitted until its bounded reviews
close. No reset PR is open. Other side: Anthropic/Claude Code does not have this batch and Nick does not need to
open it now; do not copy files manually. After a future Codex PR is reviewed and
merged into `develop`, Claude starts from a clean `anthropic/windows`, fetches,
and merges `origin/develop` under `PARALLEL_GIT_PROTOCOL.md`. No release or
deployment has occurred.

# Historical reset-foundation handoff — superseded by frozen r1 / Wave 1 state

> The former live block below is preserved for provenance. Its clean-foundation
> capture sequence has completed and is superseded by the r1/Wave-1 record above.
> The 12-lineage /217-asset matrix below is also superseded by schema v4's
> 13-lineage /251-asset Platinum scope; retain it only as diagnostic history.

# ★ LIVE — reset foundation ready to commit; fresh 1,250-row judging next (2026-08-10)

**Current worktree:** `C:\Projects\celestial-frontier-openai-windows` on
`openai/windows`. The bounded reset-foundation batch is still uncommitted on
top of local HEAD `3528bfb`. Independent bounded diff review and the integrated
post-review gate pass found no blockers; the foundation is ready to commit.
PR #7 is historical/already merged. There is no reset PR, global
PASS, final ZIP, release, deployment, or version bump.

Read first: `ROADMAP.md`, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`,
`port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`,
`port/v2/reference/BAT_FAMILY_RESET_REVIEW_2026-08-10.md`,
`ART_DIRECTION.md`, `LINEAGE_AND_BREEDING.md`,
`PROCEDURAL_CHARACTERISTICS.md`, `port/PROPORTION_ARC.md`, and
`port/v2/README.md`.

## Current reset truth

GP7/GP7.1/r1/r2/r3 are quarantined history, not current bands. Exact scope is
631 fauna + 332 flora + 27 fungi + 20 microbes + 240 procedural = **1,250**.
Four names occur in two Earth sets, so 1,010 Earth identities own 1,014 route
rows. Every review, lineage, compare, merge and package identity is
`set + species`, never a bare display name.

## Reset foundation accepted — clean commit remains

1. Breeding stores the selected Earth lineage's exact `_earthBlendKingdom`
   without changing the lifted RNG stream. Fauna uses the lineage-aware HD
   scaffold; flora/fungi/microbe use the exact set+name owner.
2. Portrait and thumbnail caches share a canonical key over the complete genome;
   `hybridcheck` exercises all kingdoms, duplicate names, parent orders,
   lineage/cache/repeat cases and injected failures through production pixels.
3. `fullresetlayout` derives **181 families / 233 official packets** at 10 max,
   including 46 production-derived procedural plan families.
4. `fullresetreview` binds every exact row to clean 40-hex provenance, native
   440px, unlabeled 300px, actual unlabeled 132px, labelled old/current, and its
   exact `mustRead` or procedural-plan hash. It writes certification only for
   1,250 fresh PASS.

The independent review found no blocker in `gp71rejudge`, `fullresetlayout` or
`fullresetreview`; their selftests and negative controls passed. Post-review
syntax, TypeScript, unused-code, 238-pass/1-skipped Vitest, reset-tool,
hybrid-matrix and diff checks also passed. That accepts the foundation, not the
art. Do not run the official capture until this batch has a clean 40-hex commit.

## Bat family: frozen refine3 PASS only

Refine2d remained four-for-four FAIL because digit/thumb/foot/rear-membrane
supports did not survive all delivery bands. With the source frozen, independent
refine3 review returned **Bat PASS · Fruit Bat PASS · Insect-Eating Bat PASS ·
Vampire Bat PASS** at 440/300/132px. Repeat hashes match and five nearby controls
are unchanged from refine2d. The exact record is
`port/v2/reference/BAT_FAMILY_RESET_REVIEW_2026-08-10.md`.

This is four frozen rows, not a catalogue score. Any new bat pixel requires a
new hash-bound review.

## Historical 12-lineage /217-asset hybrid boundary — superseded by schema v4

The provisional 12-lineage × 5-stage matrix proves route/cache mechanics and
records 217 assets, but visual continuity is **OPEN**. Fruit Bat changes renderer
generation between pure and bred stages; Vanilla Orchid's five anchors are
byte-identical; Apple and Oyster Mushroom remain unreviewed. The r1/r2 matrix
roots are dirty-worktree diagnostics and must be regenerated from a clean commit.

PixiJS owns the galaxy/world scene. Species are deterministic Canvas2D data URLs
inside DOM images. Sequence the upgrade as anatomy/lineage continuity →
resolution-aware portrait seam → bounded Pixi living-preview proof → later
mesh/skeletal production. Pixi filters do not repair wrong geometry.

## Repository hygiene in this batch

The orphan 26,400×19,800 `packages/art/src/5` PNG is removed after exact consumer
proof. Twelve superseded local painters and definite no-op locals are removed;
isolated evidence keeps all 1,246 non-bat portraits byte-identical. Touch/coarse
pointer DPR caps at 2 and desktop at 3. These are cleanup facts, not art verdicts.

## Exact next sequence (run from `port/v2` after a clean foundation commit)

```powershell
node tools/gp71rejudge.mjs --prepare --out=<NEW_CURRENT_EVIDENCE> --date=2026-08-10
npm.cmd run fullresetlayout -- --prepare --evidence=<CURRENT_EVIDENCE> --out=<NEW_LAYOUT_DIR> --per=10 --packets --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --compare --layout=<LAYOUT_DIR> --old=<OLD_EVIDENCE> --current=<CURRENT_EVIDENCE> --out=<NEW_COMPARISON_DIR> --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --template --comparison=<COMPARISON_DIR> --out=<NEW_VERDICT_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
```

Judges fill the 233 fresh templates. Then run `fullresetreview --collect`; repair
only concrete non-PASS rows, commit, and recapture. Run `--certify` and build the
image-inclusive ZIP only after collection reports 1,250 PASS, zero POLISH/FAIL/
carried rows. Copy-ready collect/certify commands are in `port/v2/README.md`.
Resolve the hybrid visual findings and rerun `hybridcheck` + `hybridmatrix` from
the clean commit before final packaging.

## Parallel Git handoff

OpenAI/Codex keeps the accepted worktree isolated, then commits and pushes only
`openai/windows`. A future draft PR must use base `develop` and source
`openai/windows`; no placeholder PR number/title exists. Claude Code does not
need to open now and must not copy files manually. After Nick reviews and merges
that future PR, Claude starts clean, fetches, and merges `origin/develop` into
`anthropic/windows` under `PARALLEL_GIT_PROTOCOL.md`. Codex performs the same
clean-start synchronization after `develop` moves. No release/deployment here.

# Historical GP7.1 handoff — superseded by the full-catalogue reset; retained below

> The following former live block is provenance only. Its instruction to judge
> r3 next is cancelled by the reset above.

# ★ LIVE — GP7.1 strict-conformity remediation (2026-08-09)

**Current worktree:** `C:\Projects\celestial-frontier-openai-windows` on
`openai/windows`. **PR #7 is merged into `develop` at `52467ba`.** GP7 is
preserved below as a frozen baseline; a new draft PR does not exist yet.

## Current measured truth

Nick's supplied `Celestial_Frontier_GP7_1250_Asset_Spec_Conformity_Recheck_Full_Package.zip`
is SHA-256 `448BF5A465F195673E87DBEB487A3C3ADFDDE258A319050DD2493ECAB84CC6BB`
(7,317,675 bytes). It validates an exact 1,250-row ledger, but has 23 metadata
entries and no raster pixels. It is not a fresh visual certification.

| ruler | rows | FAIL | POLISH | PASS |
|---|---:|---:|---:|---:|
| fresh strict | 503 | 301 | 37 | 165 |
| byte-unchanged carried | 747 | 317 | 378 | 52 |
| mixed inventory — **not a score** | 1,250 | 618 | 415 | 217 |

Immediate work: fix/polish the 338 fresh strict non-PASS rows with named,
evidence-backed routes; strictly re-render and rejudge all 747 carried rows;
then package all current 1,250 portraits and review sheets beside a new dated
fresh ledger. `npm run gp7conformity -- --input <fresh-ledger-dir> --certify`
must stay blocked until every row is freshly strict PASS.

## GP7.1 first all-fresh baseline (captured 2026-08-09)

The remediation source was freshly rendered into 1,250 native 440x440 portraits
and 196 labelled, hash-bound packets. Independent strict packet reviews are
complete and `gp71rejudge --collect` accepted their exact joins:

| current fresh ruler | rows | FAIL | POLISH | PASS |
|---|---:|---:|---:|---:|
| GP7.1 all-current render | 1,250 | 318 | 301 | 631 |

There are zero carried rows in this ledger. It is therefore the first honest
repair baseline, but **not** a literal PASS claim: 318 `FIX_TO_PASS` and 301
`POLISH_TO_PASS` rows remain. The active repair order is named flora/harvest
architecture, procedural contrast/body plans, fruit/nut trees, rodents,
herbs/spices, primates, shrubs, then the smaller per-row fauna routes. Do not
overwrite frozen GP7 records; every source change requires a fresh affected
render and a final all-catalogue rejudge before certification.

## r2 delta evidence and current source state

The first bounded repair pass changed 362 portraits, independently reviewed by
an author-separated r2 delta pass: fauna **46 PASS / 42 POLISH / 10 FAIL**
(98 changed), flora+fungi **56 / 62 / 49** (167), and procedural **76 / 21 /
0** (97). The other 888 portraits are byte-identical to their all-fresh
baseline evidence. These are SHA-bound auxiliary reports only, not a new
collector result or a certificate. A second narrow source pass has completed
the exact r2 failure/polish fixes with type/spec/route/species-audit gates
green; it has not promoted a verdict. A distinct r3 all-1,250 capture is now
ready at `apps/game/smoke/gp71-rejudge-r3`: 1,250 portraits and 196 packets.
It changes 106 portrait hashes from r2 (fauna 13, flora 59, fungi 6,
procedural 28) while 1,144 remain byte-identical. R3 has no verdict ledger,
results, or certificate. Independently inspect the packets and collect only
their hash-bound strict verdicts before any band promotion.

## Next human/agent sequence

1. Independently inspect r3 under the strict ruler and collect only complete,
   hash-bound packet verdicts; do not infer new verdicts from r1/r2.
2. Resolve only confirmed remaining FAIL/POLISH items, repeating evidence and
   gates until all 1,250 rows are fresh PASS.
3. Build a new evidence package containing current portraits, labelled strips,
   manifest, provenance, and fresh verdict ledger; run full certification.
4. Commit, push `openai/windows`, and open a new **draft** PR from
   `openai/windows` to `develop`. Keep it draft until certification; never
   commit directly to `develop` or `main`.

Read next: `ROADMAP.md`, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, and
`port/v2/reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md`.

# Historical GP7 handoff — superseded baseline retained verbatim below

# ★★★★★ FROZEN GP7 BASELINE — 2026-08-09 · PACKAGE/BRANCH RECORD · PR #7 MERGED

⚠ **This worktree is `C:\Projects\celestial-frontier-openai-windows`; run the art tools from
`port/v2`. Art is frozen. Do not start another global body pass.**

## Current measured state

All **1,250** current organisms are covered: 631 fauna, 332 flora, 27 fungi, 20 microbes,
and 240 procedural. GP7 judged the regenerated current strips completely:

| scope | rows / strips | PASS | POLISH | FAIL |
|---|---:|---:|---:|---:|
| changed drift | 503 / 95 | 165 | 37 | 301 |
| unchanged control | 62 / 39 | 11 | 4 | 47 |
| carried full catalogue | 1,250 / — | 217 | 415 | 618 |

The full-catalogue row is a **mixed-ruler inventory, not a catalogue score**. On rows eligible
to fall, drift demotions were **62/160 (38.8%)** versus control **21/32 (65.6%)**, a
**−26.8-point** gap; rescues were **104/343 (30.3%)** versus **4/30 (13.3%)**. The unchanged
control therefore calibrates the stricter GP7 judge and supports targeted progress, not a
sweeping repaint. Procedural corrections finished **57/57 PASS**. Targeted morphology reduced
the hard look-alike count to **0**; the broader confusable watch-list remains intentionally open.

Nick's full-catalogue audit was **381 GOLD / 810 POLISH / 59 FIX**. All 59 FIX rows were
addressed. His patch review was **15 PASS / 25 PASS-WITH-POLISH / 19 STILL-FIX / 1 REGRESSION**;
the remaining 20 rows were then reworked and rejudged. His standing instruction still controls:
preserve the build and regenerate only named targets.

## Historical next human actions — superseded by GP7.1 sequence above

1. Review draft PR #7 at `https://github.com/TheDakk/Celestial-Frontier/pull/7` and merge it
   from `openai/windows` to `develop` only when approved; do not merge it into `main`.
2. Give Nick `port/v2/apps/game/smoke/Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip`
   (305,291,135 bytes; SHA-256 `47B730C0323241F8E171DC3A96D4EFD5C67FA0C3CA12333CA17EBE10540D398F`)
   for final review. Make only named corrections he requests; do not
   release or deploy without his explicit approval.

# Historical GP4–GP7 staging record — retained for provenance, numbers below are superseded

## ★★★★ THE CHEAP RE-CHECK WORKS. ITS HEADLINE WAS THE RULER, AND THE CONTROL PROVED IT.

`reference/GOLD_PASS_4.md` is the full write-up. In one paragraph: the drift-scoped re-check ran
as designed — **148 drifted assets, 32 strips, 1.17M tokens, 6m26s, zero errors** against the
full sweep's ~15M-and-a-dead-session — and reported **FAIL 660 → 694**, with **40 of 44 band
crossings running one way.** That is the D-ART-150 shape, on assets six waves had just improved.
So a control was built and run (`tools/rejudgecontrol.mjs`, 56 untouched family-matched assets,
same judge, 0.72M):

| set | n | FAIL% before | after | shift | demoted, of those with room to fall |
|---|---|---|---|---|---|
| drift (edited) | 148 | 62.2 | 85.1 | **+23.0** | **70%** (39/56) |
| control (untouched) | 56 | 67.9 | 91.1 | **+23.2** | **78%** (14/18) |

★ **Waves 51–56 moved no band. The whole +34 was the ruler** — this harness grades ~23 points
harder than gold pass 3 (one pass not two, side-by-side strip not isolated PNGs, an explicit
"be your own skeptic"). **`694` is not a catalogue score**; `goldpass4-results.json` mixes 148
new-ruler rows with 1,102 old-ruler ones and now says so in its own header. **D-ART-158.**
★ The payoff: the offset is now *measured*, so **gold pass 4 IS a valid baseline for the next
delta** — same harness, apples to apples — **as long as the control is re-run every time.**
`rejudgemerge.mjs` now refuses to present a delta at all without `--control`.

## ★★★ WHAT THE PROSE SAYS — IT SURVIVES A MOVED RULER, AND IT CONTRADICTS US TWICE

**1. THE FELID CHASSIS IS NOT FIXED.** The wave-51 handoff and the live-state memory both record
the chassis as "largely fixed" after D-ART-153/152/154. With all eleven big cats side by side the
judge writes *"Leopard: pixel-for-pixel the Jaguar cell in a paler tan"*, *"Bobcat: identical
chassis to the Lynx cell"*, *"Cougar: indistinguishable from the Caracal cell in a different
tint"*. **30 of 84 re-judged fauna (36%) carry shared-chassis language.** The neck fix landed and
is visible; the body is still one barrel. Three recurring sub-defects, each ONE painter lever:
**the tail is a short hook on every felid** (a cat's tail is a body-length rope), **the muzzle is
a long blunt snout** ("tapir-like", 44% of fauna verdicts name the skull), and **Bobcat/Lynx feet
still read as hooves** despite wave 49. Corroborated from outside the drift set: untouched
Anteater/Pangolin/Otter are "the same barrel-plus-peg-legs chassis".

**2. ★ FLORA IS ONE GROWTH FORM WITH AN ORNAMENT ON TOP — AND IT IS THE BIGGER LEVER.** I opened
`smoke/rejudge/9-herbs-and-spices/strip-01.png` and looked: all nine herbs are one dead-straight
stem, a symmetric leaf ladder, and a tiny flower perched exactly on the apex — on three of them a
literal thin white crescent. Across 64 flora verdicts: **leaf shape wrong 78% · habit wrong
(upright where the species is a mat/sprawl/arch) 50% · the inflorescence is a speck-or-arc at the
tip 39% · same ladder body as its neighbours 34% · the named harvest item absent 19%.**
★ **"The flower is an ornament stuck on the apex, not a structure with size" is one painter
change touching hundreds of assets** (Angelica's umbel = "a thin white crescent 20px wide";
Canola's flower mass = "a single thin yellow arc"; Fireweed's spike = "a 5px stub"). Flora is the
largest bucket and this matches the family sweep's independent "four growth-form templates".

**3.** The one genuine rescue in 148: **Ice Algae FAIL → PASS**, wave 56, visible *through* the
ruler shift.

## ★★ WAVE 58 — FLORA GROWTH-FORM ARC (COMMITTED: `071cfa7`, `6dfc468`, `c469c08`)
Nick's goal: **100% PASS — zero POLISH, zero FAIL — at the SHIPPABLE bar** (not the strict
art-director bar that whipsawed the ruler). Method proven: **cluster by botanical family, add the
missing read-cues, one edit clears the cluster.** All in `floraoverrides2.ts` (painter) +
`florarost.ts` (specs); every new axis defaults OFF so unset plants are byte-unchanged (D-ART-14).
tsc + vitest green on every commit. **~55 flora species converted.** The reusable vocabulary now:

| axis | what it draws | used by |
|---|---|---|
| drawFlower head/spike/umbel/**cross**/**cone**/**bell** rebuilt | inflorescence with real SIZE (was a speck/crescent) | all flowering herbs |
| `toothed` | serrated leaf margin (incl. a toothed heart) | mints, nettles, brassicas |
| `square` | squared reddish mint stem | mints |
| `whorl` | flower rings up the stem (verticillaster) | mints |
| `flower:'cross'` + `pods` | 4-petal corymb + siliques | brassicas |
| `flower:'cone'` | raised bristly disc + backswept rays | Chamomile, Echinacea, Black-Eyed Susan |
| `flower:'bell'` | tall raceme of flared tubular bells | Foxglove, Gentian, Monkshood |
| `leaf:'trefoil'` | three leaflets from one point | Alfalfa, Clover, Fenugreek |
| `tassel` | drooping green axil strings | nettles |
| `root` (taproot/forked/rhizome) | the harvested organ at the base | Licorice, Ginseng, Ginger, Turmeric |
| `leafArr:'basal'` | rosette + bare flowering stem | Sea Lavender |
| fruit **shapes** (pear/spiky/star/crown/hairy) | species fruit, not one sphere | 12 fruit trees (Pear≠Apple) |
| `fruit:'grain'` rebuilt | bristling awned cereal ear | Wheat, Barley, Rye, Oats, Millet, Sorghum, Rice |
| `creep` | low creeping groundcover mat (shrub) | Bearberry, Crowberry, Cranberry, Lingonberry, Bilberry, Huckleberry |
| `leaf:'arrow'` + rosette jitter | sagittate blade on erect stalks; de-mirrored fan | Arrowhead, Taro, Wild Taro, Pickerelweed |
| `leaf:'crinkle'` | huge puckered cabbage/rhubarb blade | Sea Kale, Wild Rhubarb |
| `dense` (shrub) | filled rounded twiggy bush | Tea, Tea Tree, Tamarisk, Bay Laurel |
| `root` applied | taproot/tuber at base | Prairie Turnip, Wild Yam, Cassava |
| seaweed `holdfast` + forms | grip + kelp float / wrack bladders / flat blade | Kelp, Bull/Giant Kelp, Bladderwrack, Dulse, Wakame |
| palm rebuild + `pseudostem` | single trunk + fronds; banana false-trunk | Coconut, Date, Papaya, Pandanus, Banana, Plantain |
| conifer spire | conical tiered evergreen | Spruce Tips, Cedar, Redwood, Hemlock, Pine Nuts, Pinyon Pine |

★★ **FLORA SHARED-CHASSIS PHASE IS ESSENTIALLY DONE — 18 cue-clusters, ~90 species.** What REMAINS
in flora is a **bespoke tail** (~15–20 species, each its own fix, no cluster): Solomon's Seal
(arching stem + hanging bells), Bergamot (monarda firework tubes), Vanilla Orchid & Water Spinach
(trailing succulent vine), Miner's Lettuce (perfoliate saucer), Angel's Trumpet (huge pendulous
trumpet), Fiddlehead Fern & Tree Fern (crozier / fibrous trunk), Wild Chive tubular leaf, the
LOW-CUSHION alpines (Purple Saxifrage, Bitterroot), Coralline Algae (crusty pink), Roselle
(calyces), Dragon Fruit / Barrel Cactus (ribbed succulent). Re-pull prose from
`goldpass3-prechassis.json` (`defect`/`readsAs`).

## ★★★ FAUNA PHASE — UNDERWAY (wave 59, 8 clusters committed)
Same method, in the fauna painters. Landed & committed:
- **Sharks** (`faunaoverrides3.ts` fishBody): big opaque first+second dorsal, SHARP grey/white
  countershade (shark-only), hammerhead cephalofoil seated into the head (was a stranded bar).
- **Snakes** (`faunaoverrides2.ts` reptSnake): new `gauge` (Vine/Whip/Racer/Tree now whip-thin,
  not "the same fat doughnut"); new `collar` (grass snake's neck band).
- **Corvids** (`birdoverrides.ts`): black bills for Crow/Raven (were the default yellow → jackdaw
  read), Magpie's white pied bib.
- **Wetland birds** (`faunaoverrides.ts` inline): Heron/Flamingo/Stork/Ibis/Crane/Spoonbill were
  defined with NO `neck` — added neck:'swan'/'long' (the S-kink was simply absent).
- **Wader bills** (`faunaoverrides.ts` faunaBird): new bill shapes `probe`/`downcurve`/`upcurve`
  → Snipe, Godwit, Curlew, Avocet, Oystercatcher, Ibis.
- **Bivalves** (`faunaoverrides2.ts` marineShell): new `clam`/`mussel` kinds — two valves + hinge
  seam, not the one scallop bowl.
- **Small rodents** (smallRodent): `earShape:'nub'` (existed, zero writers) for Vole/Water Vole/
  Prairie Dog/Ground Squirrel — buried ears not rabbit ears.
- **Clownfish** (fishBody): new pattern:'clown' — three white black-edged bands.
- **Gastropods** (marineShell): new `limpet` (ribbed cone) + `cowrie` (glossy toothed egg) kinds,
  off the shared abalone dome.
- **Echinoderm trio** (marineStar): Sand Dollar → `disc` (flat 5-petal test); Brittle Star arms
  thinned — both off the starfish 5-arm body.
- **Worm trio** (wormBody): Flatworm → broad flat ribbon; Leech → inchworm arch + sucker — off
  the earthworm S-curve.
- **Tube worms** (marineAnemone `worm`): a bundle of ringed tubes with scarlet plumes, off the
  anemone cone.
- **Felid tails** (quadrupedoverrides): Jaguar/Leopard/Cougar `tailScale` 1.7–1.8, Snow Leopard
  plume→long 2.1 — the "short hook" was the top felid defect (tail branch respects tailScale
  since D-ART-136; the specs just never set it).

★★ **~14 fauna clusters landed, all eye-verified, tsc+vitest green, ~32 commits this session.**

## ★★ GOLD PASS 5 MEASURED IT (2026-08-07): FAIL 660 → 589, REAL (control-stable). `reference/GOLD_PASS_5.md`.
Then waves 61–62 (committed): gp5's 14 regressions fixed (conifer-tall gate, Lychee, Bilberry,
Arrowroot, aromatics-dense) · cereal head sub-types (panicle/club) · round clover trefoil ·
**cetacean rebuild** (peduncle + scaled flukes + orca blade — was a broken render) · **pinnipeds
lose the standing legs** (flipper family skips the leg loop; trailing hind fans + fore-paddle) ·
**primate species features** (muzzle/mask/nose/throat/earTufts/armLen/tailLen/tailRinged — all 9)
· **peacock train** (erect ocelli fan) · gull hook + puffin kit · lionfish/surgeonfish/parrotfish
signatures · tarantula fur + lobster chelae · blind/cave fish eyeless · monitor/komodo tongue + heavy limbs
+ tegu blocky skull. ~60 more assets touched since gp5, all committed.
★★★ BUCKETS (a) AND (b) ARE COMPLETE (batches 19–20, committed). Batch 19: penguin STIFF FLIPPER
blade (upright branch — no more soft oval) · moose palms mount HIGH and tilt UP · Caribou/Reindeer
get their own SWEPT-C beams + forward brow shovel inside 'branched' (finally distinct from
Deer/Elk's three-tine fork). Batch 20: crab carapace = flat-topped SHIELD (widest at shoulders,
no more balloon; all crabBody users) · emu `shaggy` axis (drooping hair-strands off the
silhouette, D-ART-14 default-off) · ptarmigan `browComb` (red eye wattle) + `featherFeet`
(snowshoe fluff burying the bare yellow rods) — two new faunaBird axes · land snail LONG upper
eyestalks w/ eye bulbs + short lower feelers + rippling sole scallops ·
**★ THE SNAKE PATTERN POST-PASS (structural)**: every reptSnake dorsal mark was drawn in the coil
loop where the next segment's body stroke (w*1.86 » segment spacing) immediately OVERPAINTED it —
the Garter's stripe and Anaconda's ovals were erased as fast as they were laid. All six pattern
kinds now stamp AFTER the coil finishes (back-to-front so front coils win the overlap). Render-
verified: Anaconda halo'd ovals, Boa red saddles, Python net, Garter full-length yellow stripe
all actually visible for the first time. Bucket (a) = no-edit rows, converts at measure.
Elephant ear fan deliberately SKIPPED (documented 6-revert trap — needs a tint-trick session).
★★★★★ NICK'S FINAL GOLD AUDIT LANDED 2026-08-08 (`port/v2/reference/NICK_GOLD_AUDIT_2026-08-08.md`
— his independent engine, reviewing the exact cf-species-ALL.zip we exported): **381 GOLD /
810 POLISH / 59 FIX** over all 1250. Headline: "strongest complete species build reviewed so
far… Gold Candidate"; fungi/microbes/procedural have ZERO FIX. His explicit instruction:
**"Do not run another global body pass — preserve the build, regenerate only the FIX list."**
★★ 22 OF THE 59 FIX ITEMS WERE CLOSED SAME-DAY (cheap table/axis work, all render-verified,
committed): Deep-Sea Octopus TWO eyes (was cyclopean — one shared cloak-squid eye) · Eagle +
Harpy PERCHED (**'soaring' skips the leg loop, so `talons:true` never drew a talon — found by
reading the table against the audit prose**) · Bison horns (spec had NONE) · Saiga bulbous
drooping proboscis (bespoke, scale 1.45) · Sailfish sail 2.3× bright-cobalt (`sailScale` axis)
· Moray drops the `gape` tunnel (it read "sucker-mouth" — the polish-15 gape experiment
backfired) · Mahi/Monkfish bighead (partial: full steep-forehead/flat-head still open) ·
Spider RADIAL legs (cos() symmetry made 8 legs land as 4 — plain spider only, tarantula
geometry untouched) · conifer gate reworked (**needle leaf ⇒ conifer**: tall = spire, low =
broad 5-tier pyramid; Yew gets red arils — Pinyon/Yew were broadleaf lollipops) · Kelp/Giant
Kelp stipes carry BLADES with gas bladders · Bull Kelp bulb 0.06S + broad streamers ·
Sargassum branching fronds + floats · Papyrus per-cane firework umbels · Steppe Tulip 'cup'
flower kind (new) · Cloudberry creep+berry · Sweet Potato trail+trumpet · Duckweed tiny-frond
mat (`mat` axis) · Prickly Pear JOINTED PAD STACK.
★★★★★ ALL 59 FIX ITEMS ARE NOW ADDRESSED (2026-08-08, second arc, ~8 commits,
every cluster render-verified). What landed beyond the first 22:
· **THE EQUID SCAFFOLD** — new `mane: 'crest'|'crestUp'` axes (hair rooted along the neck's
  top edge, poll→withers, + forelock; crestUp = erect donkey/zebra brush), new `tail: 'flow'`
  (hanging hair sheet to the hocks), equid skull rebuilt as a WEDGE (len 2.95, cranium 0.74,
  muzzle 0.44, cheek 0.58, tilt 0.26, headScale 0.92), deeper barrels. All six equids moved.
· **THE FELINE BASE** — two root causes found by rendering: (1) wave-49's pale-coat paw was
  a SOLID DARK CAP = a hoof at catalogue scale; the paw now reads by SHAPE (coat-toned fan
  wider than the ankle, protruding toe lobes, creases, claw ticks); (2) limb countershade
  pales the BOTTOM of a vertical leg = the ungulate pale-cannon; paw-footed families now
  keep coat tone down the limb (0.45). Wolf/Leopard/Lion regression-checked clean.
  Caracal tufts 1.5 · Ocelot tail 1.4 · Clouded Leopard tail 1.75.
· **THE LOW-BODY DOZEN** — per-species `carry` overrides (the marsupial/procyonid/burrower
  families carry 1.00 = ungulate-high heads; these now sit level), legs shortened / bodies
  lowered+lengthened, Raccoon/Coati/Kinkajou tail scale, Tasmanian Devil `chestBlaze`
  accent (new) + bigger jaws, Warthog crestUp mane.
· **GLIDERS + JERBOA** — quadruped `patagium` axis (Sugar Glider, Colugo) and smallRodent
  `glide` membrane (Flying Squirrel), pale free edge sagging below the belly (⚠ quadratic
  midpoint: a control at 1.75bh only reaches ~1.06bh — it needed 2.6); smallRodent `biped`
  (Jerboa: giant haunch+tarsus, tiny forearms, banner tail).
· **FLORA MEDIUMS** — bespoke floraBaobab (bottle trunk) + floraDesertRose (caudex);
  Acai palm row + Devil's Club row (the FLORA2_SPEC table outranks the dupe ladder, so a
  row is all a dupe needs); Miner's Lettuce stalked-saucer tuft (perfoliate bespoke);
  Peanut `groundFruit` soil pods; Devil's Claw `clawpod` fruit kind (grapnel hooks laid on
  the ground); Orchid Pods hanging pod clusters at vine nodes.
· **THE DARK PHENOTYPE** — found by luminance scan (fauna-h1-s12, near-black purple
  hexapod): procedural palettes now get a VALUE FLOOR (base lum < 56 lifted, hue kept),
  scoped inside resolveProcedural ONLY so Earth's black animals keep their darkness
  (D-ART-141).
STILL OPEN from the audit (minor, post-gp7): Monkfish/Mahi head SHAPES (bighead landed,
flatten/steep-forehead geometry still generic) · Devil's Club spines · fetlock articulation
on equids · the source-organism/harvest-organ metadata split (design decision for Nick).
★★★★★ NICK'S PATCH REVIEW (2026-08-08, `reference/NICK_PATCH_REVIEW_2026-08-08.md`): of the
60-species fix zip — **15 PASS · 25 PASS-WITH-POLISH · 19 STILL-FIX · 1 REGRESSION** (Mahi
fangs). His verdict: "substantial success… Horse no longer the alarming example"; merge plan
= keep the 40, rework the 20, NO global pass. ★★ ROUND 3 SHIPPED SAME-DAY (all 20 worked,
render-verified, committed): **Mahi regression root-caused** — the bighead FANGS drew
UNCONDITIONALLY (D-ART-161's inverse: an UN-gated feature); now gated on `teeth`, and
Viperfish/Fangtooth explicitly keep theirs. Monkfish bighead 2.1 + `wings:'fan'` pectorals ·
Bison front-heavy (carry 0.15, rump 0.32, shorthorn, tail 0.7) · Aardvark hide + paddle tail
· Warthog warts + tusks 0.16/1.35 + deeper · Eagle/Harpy raptor build (`brow` ridge axis,
plump 1.32/1.38, size up) · Spider alternating leg reach + width 5 · **THE 8 CATS**:
`back:'arched'` + high-crouch paw ×1.24 + heavy doubled tear marks + Clouded Leopard
`blotches` (Wolf/Lion/Leopard regression-checked clean) · **Kelp/Giant Kelp = sinuous filled
RIBBON fronds** with pneumatocysts (gated `blade && tall`; Seagrass keeps straps) · Sargassum
6 arching fronds, bladder every node · bespoke floraDevilsClub (spined canes, huge palmate
hand-leaves, red berry cone). Re-worked-20 zip delivered to Nick for re-review.
★★★ GP7 RE-STAGED (round 3): driftdump → **503 drifted**, 62-asset control, **95 drift + 39
control = 134 strips**. Superseded staging below kept for context:
★★★ GP7 RE-STAGED FINAL (all local, zero judge tokens): driftdump → **498 drifted**
(fauna 202 · flora 213 · fungi 13 · microbe 14 · procedural 56; bridge map at
reference/procedural-name-map.json) · fresh 61-asset control · strips re-rendered:
**92 drift + 38 control = 130 images ≈ ~3.5M tokens**. ⚠ Strips gitignored — re-render via
`node tools/rejudgecards.mjs` [+ `--control`] (~2 min) if the tree is fresh. NEXT SESSION
STARTS AT: spawn judges on the strips (gp5 prompt, one agent per strip, schema rows,
VERBATIM species join) → `rejudgemerge --fresh --control`. DO NOT touch art before the
judge run. Full catalog exported + delivered to Nick twice (2026-08-07 all 1250; 2026-08-08
the fixed-species zip for his re-audit).
★★ POLISH 16 (committed): neon tetra lateral stripe (new fish pattern) · chicken/rooster fleshy serrated COMB + wattle (new bird axis). Croc double tail-crest + snail eyestalks verified ALREADY PRESENT in code — expect them to convert at measure without edits. ★★★ NEXT SESSION = THE MEASURE ONLY (Nick): gp7 via artlock --driftdump → rejudgecards + control → judge (gp5 prompt) → rejudgemerge; INCLUDES procedural via reference/procedural-name-map.json. Then certification if budget allows.
★★ POLISH 15 (earlier batch): Coot white bill · Arctic Cod chin barbel · Moray gape.
★★★ THE CARRIED-ROW TRIAGE (read before resuming the sweep): the remaining ~280 carried rows
split three ways — (a) **"reads correctly, minor nit"** rows (a large share; the prose opens
positive — these likely convert on re-judge with NO edit; do not spend on them), (b) **painter-
surgery rows** (each 20–60 lines + render: cervid antler shapes, chicken comb, crab carapaces,
elephant ear/forehead/trunk detail, emu plumage, land-snail eye-stalks, tetra stripe, anaconda
blotch inversion, penguin flippers, platypus feet, crocodile tail crest) — work these the batch
way, and (c) **texture-tier asks** the strict judge may never grant procedurally — leave for
after the next measure shows whether they block PASS. ★ NEXT SESSION: burn bucket (b) in
batches, THEN gp7 (now incl. procedural via the bridge) + certification.
★★★ POLISH 13–14 + PROCEDURAL UNBLOCKED (committed): helmet boss plate+parting (Buffalo/Musk Ox/
Yak) · camel hump 0.62 · goldfish `veil` double tail · Gaur+Eland ox builds · straight-horn
ANNULATIONS (Oryx etc.) · squid torpedo mantle · **tools/procbridge.mjs — the 240-name bijection
VERIFIED both directions (open item #7 CLOSED)**, map at reference/procedural-name-map.json ·
**D-ART-143 CLOSED** — fungiCup/microbePlates/microbeCiliate now vary by seeded ratios (the last
constant family painters). Remaining: ~220 carried-fauna one-cue rows (Bull hump+dewlap, Yak
curtain, Honeybee band contrast, Secretary Bird, cephalopod Cuttlefish fin, and the long tail),
~50 carried flora, fungi/microbe texture polish (~23), procedural per-asset verdicts NOW
JOINABLE via the bridge for the next measure. Then gp7 + certification (budget-gated).
★★ POLISH batches 11–12 committed: **the coat-accent axis** (`accent`: rumpPatch/flankBand/
rumpStripes — Banteng, Impala, Gazelle, Springbok in one lever) · **the bat faces** (Fruit Bat
fox muzzle + forward eyes; Vampire pig-nose pad + M-leaf ridge). Remaining carried-fauna notables:
Buffalo helmet boss, Gaur ridge, Bull neck hump, Eland ox build, Camel hump strength, squid
mantle shape, Goldfish double tail, Antelope ringed horns, Yak curtain length, Secretary Bird,
Honeybee pollen baskets, cephalopod Cuttlefish; then procedural bridge; then the gp7 measure +
final certification (BUDGET-GATED — Nick approves each).
★★ POLISH batches 9–10 committed: Ephedra green rods (bark override) · Date Plum oval crown +
calyx fruit · Canopy Vine rope · **Cow udder axis** (was absent) · octopus eye BUMPS on the
mantle · Llama ears 1.5 · Saiga muzzle 0.66. CARRIED-FAUNA next asks (251 rows): bat faces
(Fruit=fox face, Vampire=nose-leaf pad), bovid accents (Banteng rump patch, Impala rump stripes,
Gazelle flank band, Buffalo helmet boss, Gaur ridge, Bull neck hump, Eland ox build), squid
mantle, Camel hump strength, Goldfish tail, Antelope ringed horns, Secretary Bird refine, Yak
curtain. Most need small new accent axes (rump patch / flank band) — one axis clears several.
★★ POLISH batches 7–8 committed: Pitcher Plant red vein network + throat branches · tree `squat`
axis (Apple/Crabapple low wide orchard crowns) · vine `cluster` = big conical GRAPE bunch ·
Maple Sap spile + hanging bucket (new tree `tap`) · Melon/Desert Melon trail flat. Carried-flora
rows remaining ~55; next notable asks: Coffee tiered branches, Hemp bud cluster (bespoke painter
floraHemp), Kiwi fuzz, Mangosteen calyx, Breadfruit lobed leaves, Joshua rosette density,
Hardy/Cave Fern twice-cut fronds, Date Plum oval crown, Ephedra green rods, Floating Algae
hair-fine filaments, berry-presentation trio (Blueberry/Currant/Mulberry), Canopy Vine woody
stem. Then fauna 290 carried.
★★ POLISH batches 5–6 committed: cetacean `pale` (Beluga white to the tail) · Glasswort red
flush · fern `tall` = upright SHUTTLECOCK (Sword Fern) · Lime true green · Arctic Blueberry mat.
(Parrotfish bighead + Oregano flowerN experiments reverted — render-verify keeps only wins.)
CARRIED-FLORA polish remaining (~64): work from goldpass6-results.json `defect` prose — notable
asks: Pitcher Plant red veins, Sundew placement, Water Lily detail, Apple low crooked crown,
Lemon nipple tip, Lychee pebbled rosettes→hanging clusters, Mulberry longer berries, Olive
gnarled trunk, Plum matte bloom, Peach drooping willow leaves, Acorn oak lobes, cane-vase
residue (Beach Plum). Then fauna 290 carried, then procedural bridge.
★★ POLISH batches 3–4 also committed: Date bunch hangs on orange strand · cereal 7-blade tuft
(ear dominates) · Lion's Mane full drape · Tiger Shark blunt snout · Avocet pied cap · Sand Cat
ears 1.55 · Pampas pale club · walrus bristle moustache (Oregano flowerN experiment reverted —
keep the whorl). REMAINING fresh-prose asks: Wheat contradicts? (done), Oregano airy spray (open,
bespoke), parrotfish forehead bulge, hammer bar seat, Wildcat coat tone, Coralline chalk matte,
Glasswort red strength, Beluga stay-white gradient, porpoise fin contrast, Reindeer-Lichen fringe
→ then the ~470 CARRIED POLISH rows by set (flora 117 → fauna 290 → procedural 133 via the
bridge). Then ONE measure + final certification (budget-gated, Nick approves each).
★★ THE POLISH→PASS SWEEP IS UNDERWAY (committed: batches 1–2, 12 one-cue fixes: Cougar tail
tip, Narwhal spiral, Sand Dollar petals, Brittle Star reach, Mustard pods, Echinacea cone, Mint
stem, Bergamot/mint lavender, Flax wiry, Puffin bill). METHOD: work the 95 fresh-prose POLISH
rows in goldpass6-results.json first (each names its one soft cue — mostly fhue/spec one-liners),
then the ~470 carried rows by set. ⚠ BUDGET DISCIPLINE (Nick): NO intermediate measurements —
fix everything, then ONE measure (~3–3.5M) + ONE strip-based final certification (~5–6M).
Remaining fresh-prose asks logged in gp6 results: Oregano spray, Wheat fountain, walrus bristles,
parrotfish forehead, Date hanging stalks, Pampas plume, Coralline chalk, Glasswort red flush,
Lion's Mane top lobes, hammer bar seat, tiger shark snout, Avocet pied, Wildcat coat, Sand Cat
ear, Reindeer Lichen fringe, microbes minor.
★★★ GP6 IS COMPLETE + COMMITTED (`reference/GOLD_PASS_6.md`): 347 verdicts + 72 control.
Ruler ran +22 harsh (control caught it); net: rescue 29% vs 20% (+9 real), 82 raw rescues, 19
straight PASSes (the bespoke rebuilds convert). GP6 FIX WAVES (committed): Angelica de-twinned
from Anise (palmate toothed + reddish stem) · trumpet size · banana hanging bunch + purple bud ·
barrel cactus truly squat · bladderwrack Y-forks · erect arrow blades spaced + pointing up
(Arrowhead/Taro read) · Daisy basal+bare · Vulture back on the ground hunched · dense-shrub
SPIKES rise above the mound (Lavender/Sagebrush read) · Chicory sessile stars along the stem ·
Creosote plain yellow stars · Milkweed warty pod. NEXT: the POLISH→PASS sweep (563 rows with
fresh prose in goldpass6-results.json — work by set, largest first), remaining spot-checks
(Brooklime, Edelweiss, Crowberry berry visibility, Scurvy Grass, Sea Beet, Wormwood, Hazelnut,
Heather, Oleander, Horned Lizard), procedural bridge.
(superseded) GP6 mid-flight state:
- Drift = 392 assets (waves 58–68) → 64 strips; **56 judged, 8 died on the session limit**
  (resets 5:40pm ET). 337 joinable verdicts SAVED at `reference/goldpass6-rejudge-partial.json`
  (FAIL 226 / POLISH 93 / PASS 18). Only **10 species missing**: Caddisfly, Cichlid, Dobsonfly,
  Thrips, Beet, Black-Eyed Susan, Date Palm, Eucalyptus, Meadow Grass, Watercress
  (`reference/gp6-missing.json`). A workflow RESUME for run wf_db627270-9b9 was launched
  (script `gp6-drift.js` in the session scratchpad) — 56 cached agents replay free, 8 re-run.
  If it also died on the limit, re-launch the resume after 5:40pm, or judge the 8 packets by
  hand (they are in `apps/game/smoke/rejudge/*/packet-*.md`).
- CONTROL is COMPLETE: `reference/goldpass6-control.json` (72 unchanged: FAIL 41/POLISH 29/
  PASS 2 vs gp3 FAIL 25 — **the ruler ran ~+22 points HARSH this round; read the drift net of
  the control** (D-ART-158)).
- PRELIMINARY ruler-corrected (337/347): rescued 79/273 = 29% vs control 20% → **net +9 points
  real rescue**; demotion 48% vs 45% → net +3 (noise). Honest read: the identity features
  landed (79 raw rescues) but this judge is markedly harsher; the catalogue-level number needs
  the merge: `node tools/rejudgemerge.mjs --fresh=reference/goldpass6-rejudge-partial.json
  --control=reference/goldpass6-control.json --out=reference/goldpass6-results.json` (swap in
  the completed rejudge file once the resume lands, then commit everything).
- ⚠ ART IS FROZEN until the 8 strips are judged. Then: POLISH→PASS sweep + procedural bridge.

★★★ WAVE 68 (committed) — **THE TRACTABLE FAIL SWEEP IS COMPLETE.** Lichen → bespoke crustose
rosettes ON A BOULDER · Reindeer Lichen branching starts at the ground (stilts gone) ·
Weaverbird woven ball nest (BirdSpec.nest). Every FAIL with a clear prescription has now been
addressed across ALL SETS. The only unfixed FAILs remaining: Bittern's bill-up freeze pose (a
full pose, deliberately deferred), Shiitake crack strength (minor), and the PROCEDURAL 60
(blocked on the naming bridge — `fauna-h1-s3` ↔ `f0·6#126`; adopt filename as key). ★ NEXT
SESSION: (1) run **gp6** — `node tools/artlock.mjs --driftdump` (regenerates vs the wave-56
lock; expect ~500+ drifted), `node tools/rejudgecontrol.mjs`, `node tools/rejudgecards.mjs` +
`--control`, judge both with the gp5 prompt (one agent per strip, schema rows, VERBATIM species),
`node tools/rejudgemerge.mjs --fresh=... --control=...` — the ruler is calibrated, the delta will
be real. (2) Then the **POLISH→PASS sweep** from goldpass5-results.json prose (579 rows, each
carries its fix). (3) The procedural bridge. ⚠ Art is UNFROZEN now; freeze during the judge run.
★ WAVE 67c (committed): **soaring birds AIRBORNE** (ground+legs suppressed for wings:'soaring';
Skua/Petrel/Snow Petrel gain the wings — closes the flying-posture FAIL set) · sorrel quintet
de-duped (fan/stalked-hearts/cushion/arrow/trefoil) · Arctic Willow creeps. FAILs left: Bittern
freeze-pose (upright bill-up — needs its own pose), Weaverbird nest, Bull Kelp stipe+bulb,
Shiitake crack strength, Reindeer Lichen trunks, procedural bridge + 60 → gp6 + control → POLISH.
★ WAVE 67 (committed): Water Flea → bespoke DAPHNIA (translucent shell, gut, brood eggs, one eye,
oar antennae, tail spine) · cushion alpines (spec.cushion — Purple Saxifrage/Bitterroot low
stemless mounds) · Wild Thyme creep mat · Sea Fennel pad rosette · Glasswort/Samphire jointed
sausage columns w/ candelabra + red tips · Barrel Cactus squat accordion barrel (non-tall column;
topAnchor fix) · Chanterelle warm-gold dish (black hole gone) · vine trail/rope (Water Spinach
horizontal + arrow leaves, Vanilla Orchid thick rope + aerial roots + pendulous pods, Beach
Morning Glory creeps flat). FAIL list now down to: bird pose axis (Bittern/Albatross/Skua/
Petrel/Snow Petrel), Weaverbird nest, Bull Kelp stipe+bulb, sorrel trio de-dupe, Shiitake crack
strength, Reindeer Lichen trunks, Arctic Willow prostrate, procedural bridge + 60 → gp6 measure
+ control → POLISH sweep.
★ WAVE 66b (committed): Krill stalk-eyes FLIPPED to the head (were on the tail — a sign-bug) ·
Barnacle cirri fan · Sugar Kelp ONE ribbon / Dulse red hand (flowerN = blade count in the
flat-seaweed branch). REMAINING FAILs now: bird pose axis (Bittern/Albatross/Skua/Petrel),
Weaverbird nest, Snow Petrel, Water Flea shell, Bull Kelp single stipe+bulb, cushion alpines,
sorrel de-dupe, Wild Thyme mat, Sea Fennel fingers, Vanilla Orchid/Water Spinach trail,
Chanterelle dish, Shiitake cracks, Reindeer Lichen trunks, procedural bridge + 60 → then gp6
re-measure + control → then the POLISH→PASS sweep.
★ WAVE 66 (committed): Bergamot firework head · Angel's Trumpet pendulous horns · Solomon's Seal
stem:'arch' (bells dangle BENEATH the arching cane) · Miner's Lettuce leaf:'perfoliate' saucers ·
Catfish barbels (attached, snout-rooted) · Mite/Harvestman `fused` one-piece bodies · Copepod
eggSacs. STILL OPEN on the FAIL list: Bittern/Albatross/Skua/Petrel FLYING-vs-freeze poses (needs
a bird pose axis — the painter only stands), Weaverbird nest, Snow Petrel, Krill abdomen-eye bug,
Water Flea translucent shell, Barnacle cirri, remaining flora singles (Vanilla Orchid, Water
Spinach trail, cushion alpines Purple Saxifrage/Bitterroot, sorrel trio de-dupe, Wild Thyme mat,
Sea Fennel succulent fingers, kelp singles: Bull Kelp bulb float, Sugar Kelp one-ribbon, Dulse
hand-blade), Chanterelle funnel dish, Shiitake crack visibility, Reindeer Lichen bare trunks,
procedural naming bridge + 60, THEN re-measure (artlock --driftdump → gp6 + control), THEN the
POLISH→PASS sweep from goldpass5-results.json prose.
★★★ THE ROAD FROM HERE (Nick's standing orders: 100% PASS — clear FAILs, then sweep POLISH/PASS):
1. ✔ **THE BARREL BODY — DONE IN WAVE 65** (committed): the RADV machinery was already there;
   the residue was per-species DEPTH. Slender cats slimmed (Leopard .1268→.1080, Cougar .1120,
   Snow Leopard .1140, Cheetah .1050 — Jaguar/Lion keep their mass); lean canids slimmed
   (Coyote .1040, Jackal .1010, AWD .1030, Dingo .1090 — Wolf keeps his); **Capybara/Agouti/Mara
   moved from the smallRodent ball to the QUADRUPED table** with real plans (blunt brick barrel /
   roached slender / long deer legs) — "same picture" dead; Pangolin mat:'scale' not banding.
   All rendered + kept. What remains of the old chassis story is only eye-verification at the
   next measure.
2. **Remaining fauna singles**: Bittern freeze-pose, Albatross/Skua/Petrel flying posture,
   Weaverbird mask+nest, Snow Petrel; Catfish/Pangolin/Giant Anteater/River Otter ("Other or
   uncertain"); Agouti/Capybara/Mara rodent chassis; Conch flared lip; Water Flea/Copepod/Krill/
   Mite/Barnacle/Harvestman singles.
3. **Flora bespoke tail** (~15: Solomon's Seal arch, Bergamot firework, Angel's Trumpet,
   Miner's Lettuce perfoliate, Vanilla Orchid, cushion alpines, sorrel de-dupe, kelp singles).
4. **Procedural 60** — ⚠ BLOCKED on the naming bridge (procedural gp names `fauna-h1-s3` vs
   render names `f0·6#126` — adopt `filename` as the key, old open item #7). The fish fixes
   (peduncle, eyeless, dorsal) already flow to procedural swimmers via the shared fishBody.
5. **RE-MEASURE** with the calibrated harness (artlock --driftdump → rejudge + control), THEN
6. **The POLISH→PASS sweep** (579 POLISH rows carry per-asset prose in goldpass5-results.json).

★ WAVE 64 (committed): **ALL 13 MICROBE FAILS ADDRESSED** — extremophile habitat wrappers
(acid-red water+crust, ice facets+brine, hot-pink crowded brine, methane bubbles, root nodule
with bacteroids, exactly-four tetrad, red-tide bloom field, iron-oxidizer bean+twisted ribbon,
bioluminescent glowing cells in dark water) + bespoke Dinoflagellate (girdle groove + 2 flagella),
Euglena (teardrop + 1 flagellum + eyespot), Radiolarian (glassy 3-D spined sphere). Plus
Cordyceps insect host (curled caterpillar). Shared procedural painters untouched.
★ WAVE 63 (committed): fungi identities — Lion's Mane full icicle cascade · Coral Fungus one
dense clump · Earthstar thick tan opened rays (was routed with NO species hue) · Mildew = powder
ON A LEAF · Yeast = budding cells · Jelly Fungus deep brain folds · Maitake ruffled 3-ring
rosette. STILL OPEN in fungi: Chanterelle funnel+dished centre, Shiitake crack visibility,
Porcini stem girth, Cordyceps insect host, Reindeer Lichen trunks, bracket-check.
★ REMAINING fauna clusters from the gp3/gp5 prose, in rough order: the deep felid/canid BARREL
BODY (the last chassis lever — Tube cross-section per D-ART-152); Insects (Wasp waist renders OK
now — check Caddisfly antennae, Dobsonfly mandibles, Thrips, Water Beetle); Ice/cave inverts
(Fiddler Crab has no crab, Cave Cricket is faunaLarva with no legs, Copepod=Amphipod recolour,
Krill face-on-tail, Mite, Water Flea); remaining birds (Bittern freeze pose, Albatross flying,
Skua flash, Snow Petrel, Weaverbird mask+nest); Cichlid dorsal, Reef Fish bands; procedural (60,
untouched); fungi bespoke (Lion's Mane icicles, Chanterelle, Coral Fungus, Earthstar rays,
jelly/maitake/mildew/mold/yeast blob-chassis, Porcini stem, Shiitake cracks, Cordyceps,
Reindeer Lichen trunks); microbes (13, all bespoke cells/habitats: eyespots/pseudopods/girdle
groove/brine channels/nodule/tetrad packet etc.).

## ★★★ THE HARD CORE THAT REMAINS: THE MAMMAL QUADRUPED CHASSIS (~70 FAIL)
Big cats (bodies ~11), Bears (8), Dogs (8), Rodents-mammal (Agouti/Capybara/Mara), Primates (9),
Marine mammals (10: pinnipeds need FLIPPERS not dog legs, whales need real cetacean bodies —
Orca renders BROKEN). These share the quadruped/mammal chassis in `quadrupedoverrides.ts` +
`mammaloverrides.ts`, the defect the ENTIRE project history is about (the pony; gp4 still says
"Leopard = the Jaguar cell in a paler tan"). ⚠ Bears ALREADY have back:'humped' but read as a
"sheep chassis" — it is a GESTALT problem (small head, stilt legs, short muzzle, hoof-not-paw
feet), NOT one table value. This is the ~50-FAIL hard core; do it with tint-renders, family by family, NOT a sweep (D-ART-83).

★★ **WAVE 60 — the careful mammal-chassis levers (all rendered + kept, byte-safe):**
- **`FAMILY.headScale`** (NEW, optional, default 1 = byte-unchanged): ursid 1.3 — bears got their
  big head and stopped reading as sheep. This axis is the template for any family whose head is
  mis-proportioned (primates, pachyderm if needed).
- **Felid skull shortened**: len 1.95→1.68, muzzle 0.46→0.40, cranium 0.72→0.80 — cats now read
  with a short round face, not a long snout (gp4 sub-defect #2). Closes 2 of 3 felid sub-defects
  with the wave-59 tail. **The deep third — the "one barrel body" — is NOT done** and is the
  single biggest remaining chassis lever (felid waist/chest/rump vs the Tube cross-section).
- **Fox tails** tailScale 1.7 (Red/Arctic Fox) — full brush not a thin pipe.
★ STILL OPEN in the chassis: the "pony/barrel body" shared by canids+felids (the deepest, needs
the Tube cross-section per D-ART-152); **pinnipeds** (Seal/Sea Lion/Fur Seal render as 4-legged
loaves — the flipper foot is fine but the 4-corner LEG LAYOUT must be restructured so the body
rests and the hind flippers trail); **whales** (Orca renders BROKEN, need real cetacean bodies —
a separate painter, not the quadruped); **canid paws** (check D-ART-132 — do dogs still draw
hoof-blocks?); primate features (separate painter: Baboon muzzle, Gibbon/Spider arms, Lemur
ringed tail, Proboscis nose, Howler pouch). Dog/wolf head should be broad+blocky. ⚠ DO NOT parameter-sweep it (D-ART-83); use the
tint-render method (memory: "tint it flat and render") and the established model. The three gp4
one-lever felid sub-defects: tail = body-length rope not short hook; muzzle shorter; paw not hoof.
Remaining tractable non-chassis fauna clusters (do these the flora way): Reef fish (clownfish
bands, lionfish quills, parrotfish beak, surgeonfish scalpel), Seabirds (FLYING posture + gull
hook + puffin bill), Gamebirds (bare facial skin, peacock train, rooster comb), Gastropods
(abalone ear-shell, conch spiral, limpet cone), the Starfish/Earthworm/Anemone recolour trios,
Ice-and-cave insects (12), Primates faces. `reference/LONGTAIL_WORKLIST.md` orders them.
Then fungi (18 FAIL) + microbe (13). ⚠ Still **eye-verified only** — run the full measurement
pass (cheap re-check + control, D-ART-158) after the fixing is broadly done to get the real
PASS-rate.

★ **Remaining flora FAILs, roughly in yield order** — these are increasingly BESPOKE, not cluster
wins: Bergamot (monarda firework tubes), Brooklime (aquatic sprawl), Cloudberry (low + lobed leaf
+ amber berry), Devil's Claw (grappling-hook pod), Miner's Lettuce (perfoliate saucer), Solomon's
Seal (arching stem + hanging bells), Mugwort (silver leaf underside + purple stem), Sesame/Flax
(upright ribbed capsules), Milkweed (warty follicle pod), Steppe Tulip (single upright cup +
basal straps), Water Hemlock (purple-streaked stem). PLUS **~149 flora FAILs OUTSIDE the drift
set** whose fresh prose I have not pulled (they didn't move since the gp3 baseline) — get them
from `goldpass3-prechassis.json` (`readsAs`/`defect`/`fix`).
⚠ **NOT yet re-judged — all eye-verified only.** Measure with the cheap re-check + **control**
(D-ART-158) once the flora arc is broadly done, NOT per-edit (~1.9M tokens/run).
★ Then **mammal chassis**, then the **144-bucket tail** (`reference/LONGTAIL_WORKLIST.md`).
⚠ **Honest scale:** 100% PASS across 1,250 is a MULTI-SESSION arc — ~660 FAIL + every POLISH that
must also climb. The levers are few (~15 cues); the tail under them is real per-family table work.

## OPEN, IN ORDER (revised by the above)

1. **The flora inflorescence + growth form.** Biggest measured lever in the catalogue, now
   diagnosed rather than guessed. Start with "a flower head is a structure with size", then the
   habit axis (mat / sprawl / arch / basal rosette vs the one upright stem).
2. **The felid/mammal body**, which D-ART-152's asymmetric `Tube` was supposed to unlock but has
   not yet delivered — plus the three one-lever sub-defects above (tail, muzzle, paw).
3. The rest of the 2026-08-04 list below (88 both-FAIL assets, broken procedural renders — but
   note **D-ART-155 corrected the "fit-pass clip" diagnosis: it is a painter defect**, the
   `[SHAPE]` backlog, the `familycards` regex).

⚠ **Uncommitted at hand-off:** `tools/rejudgecontrol.mjs` (new), `tools/rejudgecards.mjs`
(--control/--drift/--out), `tools/rejudgemerge.mjs` (control-aware, refuses a bare delta),
`reference/GOLD_PASS_4.md`, `goldpass4-*.json`, `control-sample.json`, `DEVIATIONS.md`
(D-ART-158). Nick had not said ship.

---

# ⚠ HISTORY FROM HERE — END OF 2026-08-04, HEAD `6190bb6`, WAVE 51 LANDED

⚠ **Repo root is `C:\Projects\Celestial-Frontier`, not `C:\Projects`.** Tools run from `port/v2`.
Everything below the 2026-08-03 banner is HISTORY — accurate, superseded on every number.

## ★★★★ THE HEADLINE: THE PONY WAS ONE HARD-CODED LINE, AND IT IS FIXED

Twelve canids and thirteen felids read as one pony. Two audits, 431 per-asset verdicts and a
tint render had all hunted it in the **limb** — the part the body occludes, where every fix is
invisible (D-ART-149). It was never there. It was:

```
headX = shoulderX + neckLen*0.55, headY = shoulderY - neckLen*0.86
```

**a fixed 57° up-and-forward neck for every mammal in the catalogue** — a browsing ungulate's
carriage worn by every cat, dog and bear. Nothing occludes it; it is the first thing anyone
reads. It is now `carry` on the family body plan (plus a per-species override), expressed as a
swing of the same-length vector so `carry: 1` lands on the identical point and **every family
left at 1 is byte-unchanged** (D-ART-14). **68 species moved; all 68 were rendered and looked
at; the bless was verified against the git copy of the lock** — exactly 68 changed in `fp` and
`sil`, none outside, none missed. See **D-ART-153**.

⚠ The first values were too aggressive — the D-ART-141 shape again, right about the defect and
wrong about the remedy. At carry ≈ 0.02 the neck leaves the silhouette entirely and a
long-bodied mammal becomes a featureless tube: artlock returned **7 newly confusable pairs**
(Mole ≈ Mudminnow, Stoat ≈ River Otter, Coati ≈ Civet). Floor raised to 0.22–0.32, and
`procyonid`/`burrower` — never part of the pony complaint — returned to 1. Result: **0 newly
confusable, net 884 → 882.** The gate found this; no amount of looking at cats would have.

## ★★★ WHAT IS STILL BROKEN, AND THE ONE THING THAT BLOCKS IT — D-ART-152

**The bodies are still one barrel.** A haunch and a shoulder lobe were added to `ventral()`,
rendered, and changed almost nothing — then reverted **byte-identically**, which is what makes
this a measurement and not a guess. The reason is structural and is the most useful thing this
wave produced: `ventral`/`dorsal` are **not an outline**. They feed `RAD = (ventral−dorsal)/2`
and an AXIS at their midpoint, and `Tube` sweeps **one scalar radius** — a circular
cross-section. Every unit the belly is pushed down raises the back by half and grows the radius
by half. **An asymmetric mass is inexpressible in this parameterisation.**

★ **So the haunch is a TORSO-ENGINE item, not a table item: `Tube` needs a radius that varies
with phi as well as u. Do NOT retry it by tuning coefficients in `quadrupedoverrides.ts`.**
Same shape as D-ART-149, where the knee was lowered, rendered and reverted because occlusion
and not joint height was binding.

## ★★★ HOW TO RE-CHECK CHEAPLY — DO NOT RE-RUN THE FULL SWEEP (D-ART-157)

⚠ **The full family sweep is a DISCOVERY tool, and it is done.** It cost ~15M tokens / 867
agents and hit the session limit on every run. It was worth it once — to find the shared-chassis
defect (D-ART-147) — but re-running it to MEASURE PROGRESS is what kept blowing the budget.
**For a progress delta, use the drift-scoped re-check instead:**

```
node tools/rejudgecards.mjs        # 1 contact strip per family, ONLY drifted assets (~148, not 1250)
# then the goldpass4-rejudge-cheap workflow: one agent per strip (~32), no verify pass
node tools/rejudgemerge.mjs        # folds fresh verdicts into the carried baseline, prints the delta
```

Why it is cheap, and why it is correct: artlock's fingerprint already names what changed since
the baseline (`reference/drift-since-baseline.json`, from a lock diff, no model), and **an asset
whose pixels are byte-identical cannot have a different verdict** — so the unchanged ~1,100 keep
their band for free and only the ~148 that moved are sent to a model. ~15M tokens → a few
hundred K. The one-time authoritative sweep (`goldpass3`, with its adversarial verify pass) is
kept ONLY for a final certification.

⚠ **FREEZE THE ART DURING A JUDGE RUN.** The gold-pass-3 baseline is smeared because judging and
editing overlapped for hours — early batches saw pre-wave-51 art, late batches saw post-wave-56.
Export once, judge once, touch no painter until it finishes. The cheap re-check makes this easy
(a run is minutes). Baseline archived at `reference/goldpass3-prechassis.json`.

### the old full-sweep chain (certification only, not for deltas)
`tools/familycards.mjs` → 197 batches BY FAMILY → judge each → adversarial verify →
`tools/goldassemble.mjs` → `tools/goldcompare.mjs`. `goldassemble` reports its own join
failures/missing/duplicates rather than defaulting them to a band. The batch list is EMBEDDED in
the workflow script (a resume must NOT re-send `args` — a truncated 5KB array killed a run once).
⚠ Launch it FRESH for a re-judge, never `resumeFromRunId` — cached agents replay the OLD art.

★★ **DO NOT QUOTE A DELTA AGAINST 431 — D-ART-150 FIRED AGAIN, HARDER.** At 1,182 of 1,250
judged the raw count is **616 FAIL / 505 POLISH / 61 PASS**, and it is **not comparable**.
Restricted to the same species judged in both passes, the sets nobody touched all got worse by
about the same amount:

| set | gp2 FAIL% | gp3 FAIL% | delta |
|---|---|---|---|
| flora | 52.2 | 61.1 | **+8.8** |
| fungi | 38.5 | 50.0 | **+11.5** |
| microbe | 55.0 | 65.0 | **+10.0** |
| procedural | 15.4 | 28.9 | **+13.5** |
| fauna | 32.1 | 55.6 | +23.4 |

**The ruler moved ~+10 points.** And fauna's extra ~+13 is *also* not a regression: this pass
batched BY FAMILY precisely to make chassis defects visible, and that effect lands almost
entirely on fauna. **The two passes differ in TWO ways at once — harshness AND batching — so
neither direction can be read as progress or regression.** What IS trustworthy: the per-asset
prose, the chassis verdicts, and the verification.

## ★★★ THE FINDING THE FAMILY BATCHING BOUGHT — IT IS CATALOGUE-WIDE

**137 of 150 judged families reported ONE SHARED CHASSIS**, and most of the 13 that escaped say
the same thing at smaller scale — "five chassis each stamped twice with only the hue changed".
**This is not a mammal problem.** Flora is about *four templates* (a stalkless cabbage
disc-pile, a rigid pinnate ladder on one dead-straight stem, a vase of splayed twigs, a skewer
stack); procedural fungi read as "a shaded ball with things stuck on it"; procedural microbes
as "a placeholder icon sheet of sphere, chain, rod and outline oval". **D-ART-147 was right and
the payoff is much bigger than the canids** — alphabetical batching could not see any of it.

★ **The verification stage is sound, and was itself checked.** 146 verified, only 2 overturned
(Fennec Fox, Rhinoceros — both refuters decoded pixels and measured crops). A 1.4% overturn
rate looked like deference, so per D-ART-140 one upheld FAIL was opened and looked at by hand:
Cattail's brown spike really is a thread, not the fat velvet sausage that IS the species. The
FAILs are real.

## HOW TO RUN THE GATES

```
npx vitest run · npx tsc --noEmit -p apps/game · node tools/speccheck.mjs
node tools/tokencheck.mjs · node tools/overridecheck.mjs
npm run artbattery -- --touching=<classes>      # 6 stages, artlock is stage 6
```

⚠ Declare the classes that **MOVED**, not the file you edited. ⚠ A bless claims **a person
looked** — prefer `--bless="Name,Name"` and **verify what it wrote against the git copy of the
lock, not the tool's own summary** (D-ART-146).
⚠ `speciesstrip.mjs` writes **relative to `apps/game/smoke/`** — pass `chassis/x.png`, never an
absolute path. Naming a species that does not exist draws an empty red box and looks exactly
like a broken render: **"Red Deer" and "Dhole" are NOT catalogue species** (it is "Deer", and
there is no dhole). Check the export directory before reporting a blank tile as a bug.

## OPEN, IN ORDER

1. **The torso engine — a phi-varying radius in `Tube`** (D-ART-152). This is the gate on the
   haunch, the shoulder, and "where the limb leaves the silhouette" for ~140 mammals at once.
   It is the biggest remaining lever in the catalogue and it is now diagnosed, not guessed.
2. **Finish the sweep**, then `goldassemble` → `goldcompare --md=reference/GOLD_PASS_3.md`.
   Report the control table above alongside any headline number, always.
3. **The shared growth-form templates in FLORA.** The family sweep says four templates cover
   most of it — which makes flora's 170+ FAILs **one painter job, not 170 table rows.** Flora
   is the largest bucket and no plan has ever scoped it.
4. **The 88 both-FAIL assets** (`reference/AUDIT_JOIN_2026-08-03.md`) — certain work, no
   adjudication needed.
5. **Broken procedural renders** — `fauna-h1-s3` / `h1-s5` are headless fish torsos,
   `fauna-h0-s15` is cornered with a stranded fragment. **A bug, not a judgement.** Diagnosed
   as the FIT/framing pass, not the painter; it is *not* in `packages/art/src`.
6. **The `[SHAPE]` backlog — 97 pairs under 2.0.** Ice Algae ≈ Snow Algae **0.00**, Sea Lettuce
   ≈ Green Algae **0.12**, Duck ≈ Eider Duck 0.44, Eel ≈ Dragonfish 0.50.
7. `familycards.mjs` leaked one verdict as a family key — its `NOT_A_FAMILY` regex misses
   `POLISH`, so Lion's Mane got its own one-asset "POLISH" family. One word in a regex.

---

# ⚠⚠ EVERYTHING BELOW THIS LINE IS HISTORY (2026-08-03 and earlier)


# ★★★ START HERE — END OF 2026-08-03 (session 2), HEAD `6f72c70`, WAVES 48–50 LANDED

⚠ **Repo root is `C:\Projects\Celestial-Frontier`, not `C:\Projects`.** Every path is relative
to it. Everything below the WAVES 35–47 banner is HISTORY — accurate, but superseded.

## ★★★★ DO THIS FIRST — THE FULL SWEEP, ON NICK'S INSTRUCTION

The catalogue moved in waves 48–50, so **431 is already stale in exactly the way 473 was.**
Nick asked for a fresh session and another full sweep. Run it in this order and change nothing
about the harness until it has run once:

```
cd port/v2
node tools/speciesexport.mjs                 # re-render all 1,250 (rebuilds the bundle first)
node tools/familycards.mjs                   # ★ BY FAMILY, NOT ALPHABETICAL — see below
                                             #   153 families · 197 batches of 14
# then one agent per batch: read every PNG, judge against the reference row AND
# against the others in the batch; adversarially verify every FAIL.
# JOIN ON `species`, VERBATIM, AT EVERY HOP — never on model-authored prose.
node tools/goldcompare.mjs --md=reference/GOLD_PASS_3.md
```

★★ **THE ONE THING THAT MUST BE DIFFERENT THIS TIME: BATCH BY FAMILY (D-ART-147).**
Gold pass 2 batched alphabetically, produced 431 correct per-asset verdicts, and **missed the
largest defect in the catalogue** — twelve canids on one pony chassis — because no family ever
appeared side by side. `tools/familycards.mjs` is written and tested for exactly this; each
packet leads with *"DO THESE SHARE ONE BODY?"*. **Do not fall back to `auditcards.mjs`.**

⚠ Also expect the calibration problem again (**D-ART-150**): quote a delta against 431 **only
after checking a slice nobody edited.** Waves 48–50 touched birds (21 bills, 3 raptors),
carnivore feet, and two flatfish — so **flora, microbes and fungi are the untouched control.**
If they move, the ruler moved.

★ The wave-49 CHASSIS MODEL is already established — **start from it, do not re-derive it.**
See the family-chassis section below; a tint render already proved the body occludes the whole
upper limb, and a trial parameter fix already failed and was reverted.

## ★★★ THE LIVE NUMBER: 431 FAIL / 748 POLISH / 71 PASS of 1,250

`reference/GOLD_PASS_2_2026-08-03.md` · per-asset rows in `goldpass2-results.json`.
The catalogue was re-rendered and re-judged in full (248 agents, 0 errors, 1,250 unique
species). **Do NOT quote "473 → 431" as progress — it is an artefact (D-ART-150).** The sets
nobody touched got WORSE (flora +6.3 pts, procedural +4.6) and only 14 of 99 old PASSes
survived, so the two passes judge to different lines. **431 is the new baseline; compare to it
with this harness.** What survives the correction is real: **fauna 277 → 198.**

## ★★★ THE TOP ITEM, AND NEITHER AUDIT'S FAIL LIST CONTAINS IT

**Twelve canids are ONE ANIMAL in twelve colours, and it is a pony. Twelve felids are that
chassis with spots.** See `reference/nick-onebyone/` (Nick's engine package, committed) and its
`visual_evidence/focused_family_reviews/02_felids.jpg` + `03_canids.jpg`. It is a defect of the
**scaffold**, so no per-asset count captures it — my 431-row pass graded most of them POLISH
(**D-ART-147**: alphabetical batching meant no family ever appeared side by side; **batch by
family next time**).

★ **The model is already established — start from it, do not re-derive it** (D-ART-149).
A tint render (limb flat blue, foot flat red, across felid/canid/equid/ursid; the method from
wave 44) showed: **the body occludes the entire upper limb. Only the lower ~35% of each leg is
visible, and that section is a straight vertical tube in every family.** All `crouch` folding
happens inside the silhouette. It is also inverted — `kneeY = 0.70 − crouch·0.34` puts a cat's
knee at 38% of the way down and a horse's at 63%. Lowering the knee was tried and **changed
almost nothing** (occlusion, not joint height, is binding) and was reverted.
**So the chassis fix must change what is VISIBLE**: body depth / topline / where the limb
leaves the silhouette, and the skull. Wave 49 shipped only the paw — the one part the body does
not occlude. **The feet are fixed; the chassis is not.**
⚠ Do not parameter-sweep 140 mammals (D-ART-83), and note artlock reports **zero** drift for
feature-scale work (D-ART-110), so this is eye-verified only.

## THE SHAPE OF THE REMAINING 431

| class | FAIL | | theme | n |
|---|---|---|---|---|
| **flora** | **170** | | missing feature | 411 |
| **fauna** | **106** | | colour / palette | 345 |
| quadruped | 46 | | flat / no material | 321 |
| procedural | 37 | | shape / silhouette | 238 |
| species | 26 | | pose / stance | 145 |
| invert | 25 | | proportion, occlusion, duplication | 84 / 78 / 73 |
| bird | 21 | | | |

**Waves 48–50 landed against this table** (not yet re-measured — the counts above are the
2026-08-03 pass): `bill:'stout'` wired for 21 birds · the carnivore paw rebuilt (60+ mammals) ·
`faunaFlatfish` given real axes (Flounder/Halibut) · Hawk/Falcon/Osprey separated. **Re-render
and re-judge before quoting 431 again** — and **batch by FAMILY this time** (D-ART-147).

★ **Flora is now the largest bucket (170) and its FAIL rate went UP.** This has been a fauna
arc; `PLAN_100_PERCENT.md` scoped nothing for flora. And `colour` + `flat/no material` have
overtaken `shape` — with anatomy improving, **the SURFACE is now what fails**, which is the
material-pivot condition the mammal audit was waiting for.

## THE TWO AUDITS, JOINED — `reference/AUDIT_JOIN_2026-08-03.md`

Nick's engine (347 PASS / 758 HOLD / 145 FAIL) vs mine (71 / 748 / 431), joined on species,
1,233 of 1,250. **875 (71%) agree "not shippable as PASS"; only 58 assets are clean by both.**
FAIL sets overlap on **88 — start there, no adjudication needed.**
- **His is better at systemic defects** (family chassis, silhouette duplicates) and carries
  `sha256`/`previous_sha256` per asset plus per-part sub-scores (torso/head/eyes/legs/tail) —
  **adopt both**; mine emits one prose field and had to prove "did this move" by stashing a diff.
- **Mine is better at per-asset severity.** 4 of his HOLDs adjudicated by rendering, my FAIL
  upheld 4/4 (Agouti and Capybara are the SAME PICTURE; Bonefish reads as a swordfish; Baboon
  has zero snout projection). He reports 0 procedural FAILs; `fauna-h1-s3` is a **headless fish
  body** — an anterior clip. A broken render is a bug, not a stylistic call.

## NEW INSTRUMENTS THIS SESSION — AND THEIR LIMITS

- **`tools/tokencheck.mjs`** — dead-VALUE gate (D-ART-145). 15 DEAD, 14 alias-suspect today.
  Suspects, not verdicts: an `else` that IS the token's drawing is legitimate. **Render first.**
- **`artlock [SHAPE]`** — colour-blind silhouette pairs (D-ART-148). `shapepairs.json`, 100
  pairs under 2.0. **Reported, NOT gated** — turn it into a ratchet only after the backlog is
  worked down (D-ART-97). Top rows are verified real: Flounder ≈ Halibut **0.00**, Ice Algae ≈
  Snow Algae 0.00, Hawk ≈ Falcon 0.06, Sea Lettuce ≈ Green Algae 0.12.
- **`tools/goldcompare.mjs` / `tools/auditjoin.mjs`** — the two joins, both keyed on species.

## OPEN, IN ORDER
1. **The family chassis** (above) — biggest single lever in the catalogue.
2. **The 88 both-FAIL assets** — certain work.
3. **Flora, 170 FAILs** — unscoped by any plan; needs its own arc.
4. **The `[SHAPE]` backlog** — now 96 pairs under 2.0 (wave 50 cleared 4). The remaining
   near-identical constructions start: Ice Algae ≈ Snow Algae **0.00**, Sea Lettuce ≈ Green
   Algae **0.12**, Eel ≈ Dragonfish 0.50, Small Fish ≈ Lanternfish 0.50, Anaconda ≈ Whip Snake
   0.56, Arowana ≈ Knifefish 0.56. **The wave-50 recipe applies to most of them:** the pair is
   one painter called with only a hue difference, and the axes usually already exist.
5. **Broken procedural renders — 13 of the 37 procedural FAILs, and it is a BUG, not a
   judgement.** `fauna-h1-s3` and `fauna-h1-s5` are headless fish torsos; `fauna-h0-s15` is a
   body shoved into the bottom-right corner with a detached fragment stranded at the left.
   ★ **Diagnosis so far: it is the FIT/framing pass, not the painter.** `snout:'blunt'` and
   `profile:'fusiform'` show up in `tokencheck`'s DEAD tier and are RED HERRINGS — the else
   branch *is* the blunt snout, correctly (Tuna, Sardine, Herring all use it and render fine).
   The verifier's own note says "a clip, not an absent head-blob". The fit pass is **not in
   `packages/art/src`** — find it upstream (it is referenced by comment in five painters as
   "the shared fit pass, wave 6"; D-ART-34 says it erases absolute size). Nick's engine scored
   all 240 procedural assets PASS and never looked for this: **a coherence check does not ask
   whether the picture is intact.**
6. **Chanterelle** — the funnel's dished centre reads as a black hole. (`gills:'ridge'` is a
   dead value but a latent trap only; the ridges draw off `cap:'funnel'`.)
7. **Naming, so passes can join** — 240 procedural assets cannot join between my own two passes
   (`fauna-h0-s0` vs `f0·6#126`), and 17 Earth names need normalising (`Aye Aye`/`Aye-Aye`).
   **Adopt `filename` as the key, as Nick's package does.**
8. Carried from waves 35–47: the elephant ear fan, rodent incisors, G7 butterfly wings,
   `earShape:'nub'`, the mustelid trio, and the 4 remaining constant procedural painters
   (`fungiCup`, `microbePlates`, `fungiEarthstar`, `microbeCiliate` — D-ART-143).

## HOW TO RUN THE GATES
```
npx vitest run · npx tsc --noEmit -p apps/game · node tools/speccheck.mjs
node tools/tokencheck.mjs · node tools/overridecheck.mjs
npm run artbattery -- --touching=<classes>      # 6 stages, artlock is stage 6
```
⚠ Declare the classes that **MOVED**, not the file you edited. ⚠ A bless claims **a person
looked** — prefer `--bless="Name,Name"` over a whole class, and **verify what it wrote against
the git copy of the lock, not against the tool's own summary** (D-ART-146).

---

# ⚠⚠ EVERYTHING BELOW THIS LINE IS HISTORY (waves 35–47 and earlier)

It is accurate about what those waves did and **superseded on every number**. In particular the
**473 / 590 / 187** baseline it quotes is dead — it was re-measured (431 / 748 / 71) *and* the
two passes were shown not to be comparable (D-ART-150). The "step 1 is a re-measure" instruction
below **has been carried out**. Read the live section at the top of this file for current state;
read below only for the *why* behind a past wave.

## ★★★ THE ARC IS NOW "DRIVE THE CATALOGUE TO ZERO FAIL". THE PLAN IS A FILE.

**Read `port/v2/reference/PLAN_100_PERCENT.md` first.** It holds the measured shape of the
work — FAILs by set, by painter class, by theme — the honest scoping of what "100%" can mean,
and the four-stage route. Everything below is the short form.

### ⚠ STEP 1 IS A RE-MEASURE, NOT A FIX
The 473 FAIL / 590 POLISH / 187 PASS baseline is **stale** — measured before waves 38–47, which
changed the ear painter, the horn painter, the pose axis, six occluded faces, the
snake/lizard/turtle painters, four procedural family painters and the truffle. **The catalogue
has not been re-rendered since.** Fixing against it is fixing against a photograph of a build
that no longer exists — exactly what killed `visualaudit.json`, `mammalaudit.json` and the
962-row queue.
⚠ **Fix the harness before re-running:** the code pass's verification never ran because its
hunt→verdict join keyed on a free-text `claim` the verifier rephrased. **Join on an identifier,
never on model-authored prose.** The gold pass joined on `species` and worked.

### Then, cheapest-first (full reasoning in the plan file)
1. **`missing feature` — 309 of 473 rows, the largest bucket by far.** This is the
   D-ART-100/D-ART-137 family: a field set, documented, and never read — or read and then
   OCCLUDED. These clear in bulk; one painter fix clears every species that sets the field.
2. **`duplication` — 98 rows.** The procedural half is diagnosed; see below.
3. **`colour` — 78 rows.** Black Truffle was one and the fix was one line: **it was routed
   bare, with no `speciesHue`, so it inherited a generic palette and painted chalk-white.**
   Grep for other bare routes — mechanical, one line each.
4. **`shape / silhouette` — 188 rows,** many of which resolve as a side effect of 1–2.

## Still open, with measurements

**A — Procedural de-duplication: HARD pairs 19 → 3. Drive to 0.** (D-ART-143)
Earth has **zero** pairs under artlock's 0.6 line; procedural had **nineteen**, seven at
distance 0.00 — byte-identical pictures from different seeds. Nothing watches it because
`[SAME]` is Earth-only *by design*.
★ The cause was not the family picker. Wave 20 made the SELECTOR spread evenly and nobody asked
whether the families it picks can draw more than one thing — **7 of 26 family painters draw one
fixed picture.** Four are fixed (`tardigrade`, `microAlgaeCell`, `fungiMorel`, `fungiTruffle`);
**four remain**, all in `proceduralfamilies.ts`:

| painter | rng calls |
|---|---|
| `fungiCup` | 1 |
| `microbePlates` | 1 |
| `fungiEarthstar` | 2 |
| `microbeCiliate` | 2 |

Method: vary a **RATIO** off `seeded(g, salt)` — never a canvas scale, the fit pass erases
absolute size (D-ART-34). Each also owns an Earth species, so declare `--touching=…,species`
and re-render that species. Measure with the `lock.fp` + `dist()` walk in the wave 46 commit.

**B — The four painters above are also gold-pass FAILs.** `Earthstar` renders as a fuzzy ball
with spikes (seen at the end of wave 47). Fix the variation and the read in the same edit.

**C — Known-open from earlier waves**, all itemised further down this file: the elephant fan
(needs the head-frame model established with the tint trick BEFORE any outline work), rodent
incisors (ship paired with a Water Vole / Freshwater Crab separation), G7 butterfly wings +
abdomen-rooted legs, `earShape:'nub'` rolled out one row at a time, the mustelid trio.

## What wave 47 changed that you should know about
`artclass.mjs` was classing **15 assets as `verbatim-*`** — the class the lock forbids anyone to
move — and **13 of them were FAILs**, i.e. defects nobody could legally fix. **All 15 were
misclassified**; every one routes to a painter we own. Three separate causes, each a different
surface form of the same key (packed object rows, a U+2019 apostrophe, the array route lists).
**Assets classed verbatim: 15 → 0.** All 1,250 now route to painters we own, so nothing in the
catalogue is off-limits any more. See D-ART-144 — including the part where my first fix was
*worse* than the bug and only a both-directions negative control caught it.

## What the day was, in one paragraph
Two full audits were run and then worked to completion. **The gold pass** rendered and judged
all 1,250 assets (`reference/GOLD_PASS_2026-08-03.md`, per-asset verdicts in
`goldpass-results.json`): **473 FAIL / 590 POLISH / 187 PASS**. **The code pass** audited every
line of owned art source (`reference/CODE_PASS_2026-08-03.md`, findings in
`codepass-findings.json`). Waves 35–45 then closed almost all of both. **Three stale audit
files are dead** — `visualaudit.json`, `mammalaudit.json` and the 962-row strict queue — and
say so at the top of the gold pass.

## ★ DO THIS FIRST, BEFORE ANY NEW WORK
**Re-render all 1,250 and re-judge.** Waves 38–45 moved a large fraction of the catalogue and
the last complete look was the gold pass that started it. Re-run the same harness (the script
is preserved; slices are in `reference/goldpass-slices.json`). Expect the counts to have moved
a lot — and treat the new numbers, not the old ones, as truth.
⚠ **When you do, fix the harness bug first:** the code pass's verification never ran because
its hunt→verdict join keyed on a free-text `claim` string that the verifier rephrased. The
gold pass joined on `species` and worked. **Join on an identifier, never on model-authored
prose.** Everything in `codepass-findings.json` is therefore hunt-stage only.

## ★ THE FOUR THINGS THAT ARE ACTUALLY OPEN
Each is recorded with its measurement — none is an open question.
1. **G9, the elephant ear fan.** Six attempts across two waves, all reverted. ★ The next
   attempt must NOT touch the outline first: **establish the head-frame model** (`headY`, the
   `ang` tilt, where the Tube's mass sits) using the **tint trick** — paint the fan a flat
   colour and render it (`smoke/wave44/diag*.png` show how). The last attempt's render
   *contradicted its own arithmetic*, which means the frame is misunderstood, and parameter
   search is proven not to converge here.
2. **The rodent incisors.** The chisel replacement is written and measured: it costs exactly
   ONE pair (Freshwater Crab ≈ Water Vole, 1.45) *regardless of enamel colour*, so the cause
   is the accent's AREA. **Ship it paired with a Water Vole / Freshwater Crab separation** (the
   crab's claws are its signature and are not prominent) and the net is negative.
3. **G7's butterfly wings** (both sweep one side; should be two pairs off the thorax) and
   insect legs that root on the abdomen.
4. **`earShape:'nub'`** — the axis exists with zero writers. Roll it out **one row at a time**,
   each derived from its own reference row. ★ Pika is the sharp case: tall ears make it a
   rabbit, nub ears make it a prairie dog; it needs a THIRD trait (round, tailless,
   blunt-faced), not a different ear.

## ★ THE FIVE LAWS THIS DAY PAID FOR (full text in `port/v2/DEVIATIONS.md`)
- **D-ART-139** — a gate that has never seen its highest-priority input has never run.
  `overridecheck`'s shadow check could not parse `CANON` for TWO stacked reasons; 28 dead
  routes had shipped, incl. the documented Insect-Eating Bat hazard.
- **D-ART-140** — suspect a NEW SCAN before you suspect the code. Four instrument-first lies
  in one day. A suspiciously large finding count is a bug report about the instrument.
- **D-ART-141** — on a dark animal, **the only light element is structural**. Three fixes were
  right about the defect and wrong about the remedy; artlock caught all three.
- **D-ART-142** — a pose is an AXIS, not a painter. Whether a shape can be re-posed cheaply
  depends on whether it was built as a **solid** or an **outline**. Wave 4 paid for wave 40;
  the remaining hand-drawn outlines (elephant fan, cobra hood) are where the next posture
  request will hurt.
- **D-ART-83, re-learned the hard way** — I rolled one new ear token to ELEVEN species because
  it was anatomically right for all of them, and artlock refused it four ways. **A global pass
  wearing an anatomy argument is still a global pass.**

## ★ HOW TO RUN THE GATES
```
npx vitest run · npx tsc --noEmit -p apps/game · node tools/speccheck.mjs
node tools/overridecheck.mjs        # now catches CANON shadows; negative-controlled
npm run artbattery -- --touching=<classes>      # 6 stages, artlock is stage 6
```
⚠ Declare the classes that **MOVED**, not the file you edited — `artclass` labels an asset by
the painter that draws it, so one file can move several classes. artlock will tell you which.
⚠ `--bless --class=X` re-blesses ONE class, and a bless is a claim that **a person looked**.

---

## ★★ WAVE 35 (2026-08-03) — history from here down

**The live queue is `port/v2/reference/mammal-species-fixes.md`, then `reaudit-worklist.md`.**
Wave 35 closed that file's entire top section — the wrong-family chassis (Cheetah, Panda, the
three hyenas via a new `hyaenid` family, Sloth, both tapirs) and **all six** of its listed
cross-species painter bugs (banded tail, tuft tail, horn/tusk anchors, limb-exit occlusion,
shaggy rim, `nosePad`). New axes: `skull?: MammalFamily`, `back:'roached'`, `trunk: number`,
`tailTip` on plain tails — which leaves **Hippopotamus, Walrus, Raccoon and Aardvark as
one-line table edits.**

- ⚠ **D-ART-137 — `if (earShape === 'hidden') return;` returned from the WHOLE painter.** The
  eye, face marks, horns, trunk and tail were skipped for Sloth, Mole, Seal, Fur Seal, Sea
  Lion and Walrus. Six eyeless animals and a tuskless walrus, with every gate green — artlock
  had blessed the broken render as its own baseline. **A fix can be right about the thing it
  names and wrong about where it stops**, and only a render tells you which.
- ⚠ **D-ART-138 — `npm run artbattery` invoked artlock with no arguments**, so stage 6 read
  "declared: (nothing)" and failed on every legitimate change. It forwards args now:
  **`npm run artbattery -- --touching=quadruped`**.
- ★ **The worklist prescriptions are agent-written and are not always right.** Two of wave
  35's rendered wrong (the Panda's prescribed band leaves a white chest). Render first.
## ★ WAVE 36 (2026-08-03) — the ear system, on Nick's catch

He spotted the donkey's ears on the wave-35 proof sheet. The ear was broken three ways:
the size ladder was **inverted at the top** (Donkey/Wild Ass at `'huge' × earScale 1.70` =
1.96·headR, LARGER than the Fennec Fox at 1.50); the **root separation scaled with the
ear's own size**, so a long pair pushed itself apart until the two merged into one mass;
and the ear was **filled at 0.52 of the coat, which is a hole, not an ear** — the back of a
real ear is coat-coloured and the dark part is the concha inside it. That last one is why
53 `'large'`-eared species all wore the same dark cap.
Also fixed: `tail:'bushy'` was a straw broom (110 straight fixed-width strokes reaching 90%
of the tail's width out of it — the same three faults wave 35 fixed in the shaggy rim, in a
second place), and the elephant's ear fan, whose comment claims it is drawn behind the head
and never was.

⚠ **The lesson worth carrying: `earScale` was being used to force a read that the ear's
TONE was preventing.** The 1.70 was a workaround for a fill bug two layers down. When a
per-species multiplier has to go far past its ladder, suspect the thing it is compensating
for.

**Still open:** the hyena bodies are half-fixed, because fore and hind limbs are always the
same length (a listed structural limit), so a falling topline can only ever be faked.

---

**Written 2026-08-02 at the end of waves 4–21.**
The live work is **THE PROPORTION ARC** — making every organism in the Earth catalogue look
like the real thing, on Nick's instruction. Waves 4–21 have landed. ★ EARTH COVERAGE IS 1010/1010 — Bucket A is closed.

### What waves 20–21 changed that the rest of this document predates

- **The roster is DEDUPED: 1,014 records → 1,010 organisms** (D-CAT-1, Nick's explicit call).
  Four organisms were filed in two kingdoms each. The fix lives in the OWNED wrapper
  `packages/domain/descriptors/src/apphooks.ts`, never in `apphooks.verbatim.js`, which is
  byte-locked and auto-lifted — an edit there breaks the parity contract and the next lift
  silently reverts it. **Earth names shifted for every flora and microbe** as an accepted
  cost; fauna and fungi did not move. `baseline.json` was NOT regenerated — the one probe
  that cannot be byte-equal is compared through a narrow mask with six negative controls.
  Painted assets are now **1,250**.
- **`npm run artbattery` is now SIX stages, and artlock is one of them.** It never was
  before, despite this document calling it the gate (D-ART-109).
- **The material layer reaches past the mammals** — birds have feathers, fish have scales
  that actually show, arthropods have shell. No painter was rewritten: `ellipseTube` and
  `profileTube` in `torso.ts` give an ellipse- or profile-bodied painter the same surface
  coordinates the mammals earned in wave 4.
- ⚠ **artlock CANNOT see a material change** (D-ART-110). Its fingerprint is 16×16 RGB at
  eps 0.9, which is right for catching a global palette pass and structurally blind to fine
  texture — feathering 105 birds moved 11 assets. **Review material work by eye with
  `node tools/speciesstrip.mjs "Crow,Beetle,Salmon" out.png` and Read the PNG.** An artlock
  green means the palette held, not that the material is right.

---

## ★★ THE ONE THING THAT CHANGES EVERYTHING — READ THIS FIRST

**YOU CAN SEE THE ART.** The previous four handoffs said the opposite, in bold, and it was
wrong. The exported portraits are PNG files on disk and the **Read tool renders them**:

```
Read C:/Projects/Celestial-Frontier/port/v2/apps/game/smoke/species-fullsize/earth-fauna/Cheetah.png
```

One look found four defects that four waves of geometry reasoning had missed. **Subagents can
see them too** — that is how 1,113 organisms were audited this session.

Every real catch in this arc came from looking at a picture. Not one came from an instrument.
**Look before you reason, and look again before you claim anything is fixed** (D-ART-88).

---

## READ IN THIS ORDER

1. **this file**
2. `port/v2/DEVIATIONS.md` — the laws. Start at **D-ART-89 … D-ART-99**; they are this
   session's and they are the expensive ones.
3. `port/PROPORTION_ARC.md` — the arc plan
4. `ROADMAP.md` · `PROCESS_LAWS.md`

Do **not** read `port/MORPHOLOGY_PASS.md` end to end. Grep it.

---

## THE SAFETY NET — RUN IT, AND UNDERSTAND WHY IT IS SHAPED THIS WAY

`node tools/artlock.mjs --touching=<class>` fingerprints all 1,250 rendered assets and answers
the two questions no other gate here could. **It is stage 6 of `npm run artbattery` as of
wave 21** — for waves 4–20 it was documented as part of the gate and was not actually in it,
so it only ever ran when someone remembered to type it (D-ART-109).

⚠ **Its blind spot, know it before you trust it:** the fingerprint is a 16×16 RGB grid at
eps 0.9, so it sees a palette or proportion pass and CANNOT see surface texture at all
(D-ART-110). Material work needs an eyeball pass, not a green tick.

- **[DRIFT], scoped by painter class.** Nick: *"It only needs to apply to the organisms that
  we're dealing with in that class… we just want to make it so that the global passes don't
  retroactively affect all the earth work we put in."* Declare what you are editing. Drift
  inside the declared classes is the work; **drift outside them is the failure**, because that
  is exactly what a global pass looks like. Declare nothing and nothing may move.
  - `procedural` is **advisory** — that library is meant to keep changing while we iterate on
    the generator, so it never fails the gate.
  - `verbatim-*` is the opposite: those species are drawn by `hdart.verbatim.js`, which nobody
    may edit, so **any** movement there is a real bug.
  - `--bless --class=quadruped` re-blesses ONE class. That is the mechanism that lets you run
    an intentional retroactive pass over one family without unpinning the rest of the Earth
    catalogue.
- **[SAME], Earth only.** `WATCH 2.5` orders the worklist; `HARD 0.6` is the same picture with
  two labels. Today: **~4,350 watch pairs, 33 hard.** What is GATED is narrower than what is
  printed, and deliberately so — see **D-ART-97**. The watch count is reported but only a pair
  the change pushed below the **confusable line 1.5** fails, because 1% of entirely unrelated
  pairs already sit under 2.6 and counting crossings of that band measures noise. The first
  version of this ratchet failed wave 6 over *Bullfrog ≈ Cat at 2.4*.

Calibrated against ground truth, not guessed: Nick's audit engine independently listed 22
template-sharing clusters (115 pairs); at WATCH=2.5 this catches 95 of them while flagging
0.9% of all other pairs. `--selftest` holds 9/9 on the decision layer. ⚠ D-ART-81: that says
nothing about the fingerprint sensor — the sensor's control is that a bless-then-rerun reports
zero drift, which it does.

**It has already earned its keep twice**: it caught wave 6 making every felid share a face
(D-ART-96), and then its own first threshold turned out to be measuring noise (D-ART-97). A
failing gate must print the exact rows it means, or it just gets argued with.

**NEVER bless to turn a red report green.** A blessing is a claim that a person looked.

---

## WHAT LANDED THIS SESSION

- **`torso.ts` — the torso is a SOLID.** A generalized cylinder (spine + radius profile).
  Silhouette, shoulder/haunch mass, foreshortening and per-point lighting all come from it.
  `smoothTop()`/`traceBody()` deleted; the whole class of cusp/seam/tangent bugs is unreachable.
- **`skin.ts` — the coat is a SKIN.** Marks authored in (u along spine, phi around girth):
  real tapered stripe bands, Voronoi giraffe patches with pale seams, zebra bands crossing the
  belly, rosettes, brindle, shaggy with a broken silhouette, and **countershading on every
  mammal** — which alone did more than any marking.
- **Family body plans.** 11 families carrying only what is anatomically true of all members
  (mass distribution, cannon-bone thinness, crouch, and the foot: hoof / cloven / paw /
  plantigrade sole / soft pad). 116 species tagged. Every per-species NUMBER untouched.
- **`tools/artlock.mjs` + `tools/artclass.mjs`** — the safety net above.
- **`tools/auditcards.mjs`** — builds the per-organism work packets for a visual audit.
- **Skull families (wave 6).** Per-family face length, forehead "stop", jaw depth and — the one
  that matters most — EYE PLACEMENT: forward and central on a predator, high and far back on a
  grazer. The neck also moved BEHIND the torso, removing the last visible seam on the animal.
- **`reference/visualaudit.json`** — 1,111 rows, one per non-quadruped organism, each judged by
  an agent that opened the picture: severity, what it *reads as* to a stranger, the defect, and
  a concrete fix. ⚠ Its severity scale is HARSHER than Nick's (agents were told to be demanding
  art directors, and any missing must-read counts as a blocker) — 964 "blockers" is not
  comparable to his 115 FAILs. The per-row text is the value, not the label.
- **`reference/nick-audit-recheck.json`** — a verdict on every non-mammal row of Nick's own
  audit against the current render: **16 fixed · 54 partly · 23 not fixed.**

---

## ⚠ THE TWO WORKLISTS THE NEXT SESSION SHOULD DRIVE FROM

1. **`reference/visualaudit.json`** (mine, above) — non-quadruped organisms only. The 141
   quadruped-routed mammals were deliberately excluded because waves 4–5 were rewriting them;
   **they still need their own visual pass against the new render.**
2. **Nick's anatomy-first audit** — he uploaded
   `Celestial_Frontier_Anatomy_First_Audit_Engine_Package.zip` (xlsx + per-species CSVs +
   contact sheets). It was run against the **pre-wave-4** export, so **some of it is already
   fixed and it has NOT yet been re-checked one-by-one against current art — Nick explicitly
   asked for that comparison and it is the top outstanding request.** Its headline finding
   (global passes gave unrelated species the same scaffold) drove wave 5. Its remaining
   uncorrected items: specialist insects, specialist fish, crocodilians, flightless birds,
   the 19 iconic flora, 10 fungi, 4 microbes, and 4 canonical-ownership duplicates
   (Tardigrade, Reindeer Lichen, Green Algae, Snow Algae).

Both agree on the same top defects, which is the strongest signal available here.

---

## ★ THE STRATEGIC QUESTION, ASKED AND ANSWERED (2026-08-02)

Nick asked whether this is the Pixi engine and whether it is the best we can do. Two facts to
carry forward, because they should shape what the next session even attempts:

- **The species art is NOT Pixi.** Pixi renders the galaxy/world scene (`apps/game/src/main.ts`).
  Every organism portrait is plain `CanvasRenderingContext2D` — procedural 2D drawing rasterised
  to a data URL and cached. Swapping in Pixi/WebGL would change nothing about how these look;
  the ceiling is the DRAWING APPROACH, not the renderer.
- **The same engine scores 97.5% on procedural and 5.7% on Earth** under Nick's strict bands
  (234/240 vs 58/1010). That gap is the whole story: a generator is good at coherent variety and
  bad at hitting a specific named target. We are asking one system to do both.
  **The obvious split — authored assets for the 1,014 fixed Earth species, the runtime generator
  for the aliens — is the highest-leverage decision available and has not been made.** It also
  maps exactly onto the protect-Earth / iterate-procedural split Nick already asked the safety
  net to enforce.

---

## THE STRUCTURAL QUEUE — WHERE IT STANDS

Nick set this order on 2026-08-02: fix the structural findings (the ones a
future material/texture pass provably cannot fix), and defer the surface ones.

1. ✔ **Wrong-class routing and ownership blockers** (wave 8). The bats were
   rendering as bees; the tardigrade's eight legs read as four. Both fixed.
   ⚠ NOT done, and deliberately: Green Algae / Snow Algae / Reindeer Lichen /
   Tardigrade still exist as TWO CATALOG RECORDS each. The painters are right
   per kingdom; collapsing the records is a data change touching species counts
   and saves. **Nick's call.**
2. ✔ **Birds** (wave 8). The songbird blob is gone — see below.
3. ✔ **The unmodelled families** (wave 9): marsupial, procyonid, xenarthran,
   pinniped, burrower, plus 'claw' and 'flipper' feet. 21 species off 'generic'.
4. ✔ **The named regressions** (wave 9): the rectangular tail base, the
   elephant's Asian topline and knee-height trunk, the walrus's legs.
5. ✔ **The unrouted — DONE.** 1010/1010. Every Earth organism has a real
   painter and nothing falls to the verbatim engine. The arc opened at 930.

**BUCKET A IS CLOSED.** All five structural items are done. What remains before
the material decision: the 72 mammal heads that are still generic (TABLE work —
inverted or missing family traits, itemised per animal), the ONE hard look-alike
pair (Water Mint ≈ Chicory, needs a bare-branching-stem axis), and the
non-mammal audit backlog.

**Then the material pass** — see the strategic note above. The gate for it is
 in reference/mammalaudit.json: 0 → 1 of 144 so far, so anatomy is
still binding. When it climbs, pivot.

---

## OPEN, IN PRIORITY ORDER

1. **★ HEADS: 72 of 144 unique** — measured three times now: **20/141 → 52/144
   → 72/144**. Half the mammals have a head that could not be swapped. The
   72 that could are itemised with a reason each in `reference/mammalaudit.json`;
   the recurring ones are inverted or missing family traits (an arctic fox with
   pointed ears and a long muzzle, an aardvark with no rabbit ears) rather than
   a shared token — i.e. TABLE work now, not painter work.
   ⚠ **surfaceOnly is 1 of 144.** Anatomy is still the binding constraint and
   the material pivot is NOT due. **That is the number that decides it.**
   ⚠ artlock reports ZERO drift for feature-scale work (D-ART-103) — verify ears,
   eyes and muzzles by opening a native-size PNG, and run `--expect` whenever you
   edit spec rows (D-ART-104).
2. **ONE hard look-alike pair left: Water Mint ≈ Chicory** (was 33 at the start
   of 2026-08-02, then 19 after the birds, 9 after the fish, 1 after the
   invertebrates). Their reference rows are far apart — a square stem with a
   single round lilac pompom versus stiff wiry NEAR-NAKED branching stems with
   sky-blue ray flowers sitting almost directly on them — but the flora painter
   has **no axis for a bare branching stem**, so both still draw the same leaf
   ladder. That is a painter job, not a table job, and it was left rather than
   bodged. The next tier under it: Crow ≈ Frigatebird, Grasshopper ≈ Thrips,
   Loon ≈ Cormorant, Electric Eel ≈ Lungfish.
   **The recipe is proven four times now** — read the mustReads, add the missing
   spec axes, re-derive each row from its own reference — and
   `node tools/speccheck.mjs` now guards the step that kept going wrong.
