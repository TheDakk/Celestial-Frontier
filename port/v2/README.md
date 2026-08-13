# Celestial Frontier v2 — the TypeScript port (playable Phase-4 slice)

## Current port status — 2026-08-13

> **Next-arc architecture review (2026-08-13):**
> `../../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` is the approved cross-system
> implementation contract. It does not widen the current Guide capabilities. Inventory,
> Shipyard/build actions, item-instance loot, living companion ownership/dispatch, live
> breeding/combat/Guardians and the full audio layer remain unimplemented. The required
> order is ownership first—virtualized portraits and memory plateau, shared ship reach/
> visual state, separate catalogue/creature and base-item/gear-instance identities,
> revisioned exact-once reward receipts—then content scale. The current audit also makes
> capability-aware Charter projection/copy, the wall-clock Auto-Extractor exploit,
> Compendium decoded-image exposure and long-session texture/audio ownership explicit
> prerequisites. Planned systems stay unavailable in the Guide until real actions,
> reload/persistence, reachability and negative-controlled outcome gates exist.

This playtest line is **Celestial Frontier v2.0 development**. The identity is
centralized in `version.json` and appears with the full source commit inside the
Guide only—never as a corner badge. It does not authorize a production release:
`V2_CURRENT_RELEASE_VERSION` remains `null`, the legacy v1.8.9 history remains
immutable, and no one-time update bulletin can fire. A successful `develop` push
battery publishes the tested exact v2 package to the separate development origin;
`main` continues to publish the root v1.8.9 production HTML.

The 14 planned deterministic domain facades are present and the port has a
playable Pixi/browser slice, but the old milestone record below is not a claim
that Gates B–D are literally closed. This audit found and repaired concrete
integration gaps: the app's own TypeScript configuration now participates in
`npm run typecheck`; CI installs v2 and runs its core test/type/art/browser-smoke
gates; the DOM waiver is narrowed
to three exact compatibility expressions; sparse/corrupt and future save
payloads cannot overwrite proven data; IndexedDB can recover after a failed
open; hostile epoch input is bounded; Atlas route identity, planet landing,
named CF1 sharing, stale-card actions and repeat landfall outcomes are guarded;
SessionRNG rejects hostile counters/keys; handwritten domain declarations match
their runtime APIs; lazy species-art subscribers are retained; and the phone
dock is a measured 4×2 layout with browser-backed non-overlap/hit-target
negative controls. Pixi now keeps its DPR-scaled backing store displayed in a
viewport-sized CSS box, so phone visuals and hit coordinates agree. Native
backing is retained through UHD 3,840×2,160. A viewport strictly larger than
8,388,608 CSS pixels selects an ultra tier of 2,073,600 backing pixels per
canvas /4,147,200 aggregate, fitted against exact rounded dimensions; 8K and
5,120×2,880 each use two 1,920×1,080 stores (4,147,200 pixels combined), at DPR
0.25 and 0.375 respectively. The prior backdrop is
destroyed/collapsed before its replacement allocation, and same-backing logical
resizes still refresh Pixi CSS/screen/texture/event and pointer geometry. Downshift
and restore each require an exact target/browser-heartbeat pair, an advancing later
post-render ticker turn, and stopped/stale-ticker controls. The existing full scene
rerender remains; no scene-rerender optimization or separate scene-art quality tier landed.
Pixi initializes with
`autoStart:false` through save/scene/slice/input wiring, then proves a real tick/
render, animation frame and later task before ready. Browser smoke and
performance tools now use the owned, portable CDP lifecycle; the root legacy
`tools/uilayout.js` gate consumes that same resolver/launcher rather than carrying
an independent fixed-port lifecycle.
This workspace and the repository root both declare/lock the raw-CDP `ws`
transport and support Node `^20.19.0 || ^22.13.0 || >=24.0.0`; install each surface
with its own `npm install` / `npm ci` before running its tools.

The former save-import dock slot now opens the source-addressed **Guide to the
Universe**, not a replacement mini-manual. It retains all 9 mature categories,
43 authored stable IDs and 41 player topics with search, categories, native-keyboard
cross-links and capability-aware v2 copy. Non-dormant unported mechanics remain
discoverable but are explicitly unavailable; intentionally dormant topics remain
source-recorded and player-hidden. No legacy promise is presented as current behavior.
Opening it persists the existing `seenGuide` field. The Guide also carries the full
56-release/398-bullet legacy history beside **A New Foundation**, the cumulative
categorized v2.0 development bulletin. The draft summarizes the implemented playtest
surface rather than the open roadmap; tests require canonical section order, unique
nonempty bullets, the key player-facing outcomes, and a scroll-reachable final item.
That playtest identity cannot trigger the one-time update popup, update `rnSeen`,
create `releasePending`, or create a production release. Save import remains available
under **Settings → Save data → Bring expedition**, where the same complete-envelope and
future/corrupt-byte protections apply. The import surface is an `aria-modal`
top layer with internal Tab wrapping and Escape-only close/focus restoration;
the phone gate rejects its former low-z click-through state. This is deliberately
an honest manual for the current slice, not a claim that tooltip deep-links,
Advanced Briefings, or every late-game system has already been ported.
Field Training is equally explicit about its boundary: the slice runs the six
welcome/find-Earth/survey/chart/Atlas/land lessons and then an honest
"Finish for now" step. Cache, feeding, breeding, duel, hazard, healing, forge,
and the rest of the legacy 21-step curriculum remain open with their systems.
Outside Training, ordinary panels use z24 above an open z23 survey card. During
Training, the intentional lesson choreography remains authoritative and keyboard
focus is locked to the live lesson. The phone gate injects the former lower panel
layer and requires the rendered panel/card intersection to fail.

The current glass correction gives every panel and Survey card exactly one 44px
top-right Close action; panel refill preserves that owner and removes duplicate seats.
Balanced padding, row dividers and inset borders replace the uneven close gutter.
Desktop notifications, Settings and Records share the bottom-right utility edge above
the measured dock. Survey rendering filters the legacy `Spectral class` row without
changing deterministic descriptor data: planet rarity is absent before landing and
plain after landing, while internal seeded spectral colors and real stellar
classification remain intact.

Survey-first descent is phone- and slow-device safe: one tap opens the typed
survey card without teleporting, and its explicit 44px `Enter galaxy` or
`Enter system` action performs the dive. The card may cover the body on a
phone, so navigation does not depend on a second canvas tap or timing window.
The browser gate proves desktop and real 390×844 touch galaxy entry, the exact
base Sol node `{seed:424242,x:560,y:170}`, a real stage-0 fine-star action
rejected by the Charter, and stage-2 entry into the touched fine star's exact
`{seed,x,y}`. It requires `autoDensity` geometry and rejects DPR-sized CSS
canvas and buried-action controls.
Planet cards separately snapshot the complete galaxy+star `{seed,x,y}` context;
a same-seed/different-coordinate browser control proves stale Land, Atlas and
Share actions cannot be rebound to another node.
On touch, Planetside also exposes a minimum-44px **Leave world** action wired to
the same guarded ascent state machine as Escape/right-click, so a phone player
never needs a keyboard or a zoom gesture merely to return to orbit.
On portrait phones, the populated Planetside strip measures visible fixed top
chrome plus the last visible trail edge and the lower safe/dock/context chrome.
`syncDockH` and `syncCtxH` reclassify after asynchronous chrome changes. The trail remains visible when a
useful 72px roster band plus 6px separation fits; when it does not,
`surface-trail-yield` hides only that noninteractive trail. The roster retains a
72px minimum, scrolls vertically when clipped, and restores the trail when the
band grows again. `planetside-portrait-band-viability` removes the cap to
recreate the collision; `planetside-portrait-trail-fallback` forces and then
restores the tight branch while proving the roster remains useful and reachable.

GitHub test-battery #199, run `31571459050` / job `94034164092`, exposed the
former desktop-8k reload ambiguity and small-phone Planetside/trail overlap.
Pushed commit `8b8a740286a56591cac9dc5734a2fba4c088939b` repairs both: import
settlement and replacement boot have separate 20-second bounds, a changed top-
frame loader plus document token is required, and portrait Planetside preserves
a useful 72px scrolling band with a measured trail fallback. The deliberate
failing controls and exact sequential local battery passed.

Matching GitHub test-battery #200, run `31577395120` / job `94052496287`,
passed all root/product/v2 gates, the single `smoke:ci` run, the complete
12-viewport glass matrix including 8K, matching-provenance automated personas,
and `preview:package`. Only final `preview:smoke` failed before a page existed.
The preceding evidence step set `CF_BROWSER=/usr/bin/google-chrome` only for its
own process; the preview step did not inherit it, so the resolver selected Linux
Edge at `/opt/microsoft/msedge/microsoft-edge`, which never wrote
`DevToolsActivePort`. This is a CI browser-provenance failure, not a product,
responsive, package, or preview-page finding. The workflow repair pins Chrome at
job scope in both CI workflows and resolves it fail-closed before the long battery.
That workflow repair is pushed commit
`4d14a75e934536dc5f204e40c74f666cc9514df4`. Follow-on commit
`08379d8c072c7eb22e2a029d666972c86d496326` moves root layout to the owned
launcher and creates ignored atomic schema-v2
run/browser/status evidence with stale-PASS/exit-73 and exact-run freshness controls.
Full layout PASS also binds the exact 787 `viewport/surface/name` inventory to the
sealed v1.8.9 report; targeted viewports remain scoped. Its selftest deletes one
sealed outcome, keeps the summary counts consistent, and still requires rejection.
Its initial sandboxed Edge launch preserved SIGABRT as red; a separately permitted
mutable-tree diagnostic completed 787/787 across 10 viewports, but is not exact-head
certification.

Matching test-battery #201, run `31586917924` / job `94082765087`, completed
once without retry on pushed `4560269b8767dc48bb82e3b1f9d82ca835a84aad` and is **RED**. Every preceding root,
product and v2 gate—including `smoke:ci`—passed. Only the desktop-8k preference-
fixture import leg instrument-failed after its former 20-second replacement wait:
the old loader remained while the old slice token and import phase were absent.
This is a replacement-lifecycle/instrument finding after reload was requested,
not a save-classifier rejection or reported repository-write error. Do not rerun
unchanged #201 or lengthen its timeout to mask it.

Immutable executable evidence source `7d9980e37e60f0cec8cb840e75098872b9cc90d0`
makes the product's Training-restart,
supported-import and storage-retry reloads claim one mutually exclusive replacement
transaction before awaiting. The claim synchronously stops a running outgoing
Pixi ticker before any persistence wait; only the exact owner of a failed or
rolled-back transaction may restart a ticker that it stopped, while invalid
pre-claim import rejection leaves ordinary play unchanged. A successful flow
then explicitly releases the outgoing Pixi
application/global resources, detaches the view, and collapses both application and
backdrop canvases to at most 1×1 before a one-task reload barrier. It is code-owned,
not a generic `pagehide` teardown, so browser-cache restoration cannot revive a
destroyed app. An optional CDP binding emits the release postconditions outside the
dying context. Glass uses sticky receipts to bound a 20-second import/release,
5-second changed-loader navigation commit and independent 20-second new-loader
boot; requires one valid release plus one exact-context ready event and a short
confirmation; and retains sticky Page/Runtime/Inspector/Network failure evidence. The paired
`replacement-document-loader-token-phase` and `reload-resource-release` controls
reject the ambiguous and resource-retention paths, including just-late transitions
at every phase boundary, with zero retries.

Test-battery #202, run
[`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
completed once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
and is **RED**. Every earlier root/product/v2 gate and `smoke:ci` passed. Only
desktop-8k glass import/replacement instrument-failed when the serial observer's
first result arrived at 61.163 seconds. Its former loop awaited two frame-tree
commands around an awaited Runtime evaluation, each with a 30-second command
ceiling, so #202 is instrument ambiguity—not proof of a 61-second application
boot, save rejection or product failure. It remains preserved without retry.

The current repair moves authority to sticky CDP event receipt timestamps. Its
`cf-v2-import-phase/v1` stream requires the exact phase id, prior document/session/
default-context/loader, sequence, and deadline. A no-pending-save success is
`invoked` (ticker running) → `claimed` → `no-active-persist` → write start/
complete → release start/complete, with the ticker stopped after `invoked`; an
active save adds wait/settled stages. The absolute 20-second clock begins before
one bounded, non-awaiting import-arm command and is never renewed. It then
requires one reason/token-bound release from the prior default top context, a
changed top-frame loader commit, and one `cf-v2-slice-ready/v1` tail binding from
the exact new default top context/session/loader/origin before their phase-owned
deadlines. The app emits that optional ready event after load, complete input/
slice wiring, persistence readiness, at least one ticker turn, an animation frame
and a later task. Two strict at-most-2-second confirmation cycles follow: each
pairs an exact-context Runtime probe with an independent browser-process
`Browser.getVersion` heartbeat, and the second waits for a later post-render
ticker turn. Their exact five-row ledger includes the import arm plus both
target/heartbeat pairs. This is complete boot publication plus a serviced
event-loop turn and bounded post-ready commandability, not the separate 50 ms
answerability claim. The payload's browser-native
`performanceNow` must be strictly below 20 seconds, and an exact-boundary control
fails, so observer descheduling cannot make a late product boot look timely.
Missing, duplicate, malformed, wrong-
session/context/generation/origin/loader/token/URL, pre-commit and just-late events
fail closed; sticky fatal events survive bounded diagnostic-ring rollover.
`import-phase-sequence` and `replacement-ticker-quiescence` negative-control the
new boundary, including stopped-before-`invoked`, running-after-claim, and exact-
deadline-late evidence. No timeout increases, retries, or `Promise.race` around
IndexedDB durability are used.

The import-phase and generic release bindings now share one capture-scoped monotonic
receipt ordinal. The only successful terminal is `release-started` N → release N+1 →
`release-complete` N+2. The producer-legal release-first intermediate remains pending
under the same original import deadline; phase-complete-first, premature, nonadjacent,
missing, late, duplicate, malformed, wrong-provenance, early boot/ready, and an overlong
sequence-8 terminal fail closed.

The complete clean `7d9980e` battery passed: root preflight selftest/preflight
(only Edge 151 versus pinned Edge 150 drift), validate/fingerprint and smoke;
root layout selftest plus `exact-7d9980e-root-layout` 787/787 across 10/10
viewports and exact verification; rarity 60M/0;
dead-code 3 known tooling references; v2 24 files /273 tests /1 skip plus every
type/art/override/coverage/spec/instrument gate; and one-attempt smoke 0 findings /
10 screenshots. Exact-source certifying glass passed 12/12 viewports, 52/52 controls,
`omitted=[]`, 0 findings/instrument failures/retries and all 12 exact import-phase/
release/ready paths at digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
Replacement totals were 194–239 ms; desktop-8k recorded a 3 ms arm, 21 ms
import-phase span with ticker true only at `invoked`, 0 ms write, 19 ms release,
5,461×3,072→1×1 for both canvases, `performanceNow` 199.5 ms, 1 ms confirmation
and 239 ms total. Nine personas passed. The malformed initial
`npm run perf -- --runs=4` command was rejected before browser startup; the correct
single terminal diagnostic then recorded 646/726/74/157 ms and was not a retry
of an evidence failure. Exact 37-file / 10,170,996-byte preview
`dev-preview-exact-7d9980e` verified and browser-smoked PASS under Edge 151 at
320×568 for `https://dev-celestialfrontier.github.io`, distinct from production,
content `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`,
exact `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, `publishable:false`.
`7d9980e` remains immutable prior evidence from the preceding docs-only handoff;
the later prior #204 repair evidence is bound to clean source `46fb627` below.
Prior #201 and #202 stay preserved red without retry. `overridecontrol` remains exclusive
and may not overlap any browser, build or evidence producer.

Test-battery #203, run
[`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
completed once without retry at exact pushed head
`38e4f362533e272f56f708229f7a037f38ae8951` and remains **RED**. Every gate
before glass—including `smoke:ci`—passed, and 11 viewport rows passed. Only
desktop-8k import reached 20,015 ms before any release, ready, navigation, fatal,
command, or event evidence. The outgoing 5,461×3,072 Pixi ticker was still live
through the durable-write wait and teardown under CI software rendering. This is
a pre-release renderer-pressure cliff, not save corruption or a reported
repository-write failure. Preserve it without retry or a longer deadline.

Test-battery #204, run
[`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
completed once without retry at exact pushed head
`4cee7d807b8f9258e370aad31c30756269f95a96` and remains **RED**. Every earlier
root/product/v2 gate and `smoke:ci` passed. Desktop-8k's arm command queued for
9,504 ms, then import/write, 35 ms release, navigation, changed loader at 45 ms,
load at 231 ms and FCP at 268 ms were healthy; the new document emitted no ready
witness within 20 seconds and no fatal event. The cause was two independent full
16,777,216-pixel full-viewport allocations plus Pixi auto-starting before async
boot wiring. This is not an import, write, release, navigation, load or FCP
failure. Preserve the single execution without retry or deadline growth.

The repair gives the twin canvases one aggregate budget and adds an exact
event-owned `cf-v2-boot-phase/v1` sequence: `app-init-start`, `app-init-complete`,
`backdrop-complete`, `save-load-start`, `save-load-complete`, `scene-rendered`,
`slice-published`, `wiring-complete`, `ticker-started`, `first-tick`,
`ready-scheduled`, `ready-emitted`. Every stage binds the target session/default
context/generation/origin/loader/token; the ticker is false through wiring and
true thereafter. Per-stage/deadline controls reject missing, reordered, wrong-
identity, early-ticker and late evidence, while smoke asserts fresh-boot and
post-import ticker outcomes.

Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
passed the exact local battery. One malformed `--verify-run` operator invocation
caused local SIGABRT/report overwrite; one correct rerun plus verification then
passed `exact-46fb627-root-layout`, 787/787 across 10/10. V2 passed 273/1 and all
gates/selftests; one-attempt smoke passed 0 findings /10 screenshots. Full
certifying glass at source-snapshot digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms,
1 ms confirmation, outgoing 3,862×2,172 canvases →1×1 and the replacement pair
at 16,776,528 pixels combined. Nine automated personas passed; terminal-only
performance was 595/676/76/168 ms. Manifest `dev-preview-exact-46fb627` records
37 files /10,176,376 bytes, content SHA-256
`4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`, exact
tree `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected origin
`https://dev-celestialfrontier.github.io`, production distinct and
`publishable:false`. `46fb627` remains prior immutable exact evidence. Host,
human play, Ready, merge, release,
deployment and version authority remain unchanged.

Test-battery #205, run
[`31621227550`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550) /
job [`94196289291`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550/job/94196289291),
completed once without retry at exact pushed
`c57305fbf30af2bc8158ff46af1ec49ec4455d95` and remains **RED**. Every
preceding gate and `smoke:ci` passed. Desktop-8k completed import/write/release,
changed-loader navigation, all 12 boot stages and ready at browser-native
`performanceNow` about 3,733 ms; only its following exact-context confirmation
timed out at the two-second bound. Because #205 recorded no concurrent browser-
process heartbeat, it is strong pixel-linear evidence of post-ready target
starvation but not retrospective proof of healthy browser/CDP transport.

The follow-on requires two strict, no-retry, at-most-two-second exact-context
cycles, each concurrent with root-session `Browser.getVersion`; cycle 2 resolves
only on a later Pixi ticker callback after the render listener. The exact
five-command ledger, product-vs-instrument classification, 57-control plan, and
separate executed / `blockedNegativeControls` / `omittedNegativeControls`
accounting prevent a target failure from being rewritten as a generic instrument
omission. The ultra-density controls also prove exact rounded cap/backing/peak
ownership plus CSS/Pixi/EventSystem/pointer/backdrop changes when two logical
viewports share the same backing dimensions.

Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass
captures based on `c57305f` remain non-authoritative; their sandbox `EPERM` and
corrected `7680.000000000001` assertion did not retry a product failure.
Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
passed the complete exact sequential battery from clean source-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
and source-snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
passed outside sandbox without product retry. Root validate, legacy smoke,
rarity and dead-code passed. Root layout run
`exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
under Edge 151 in 75,532 ms; report SHA-256
`7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`.
V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt slice
smoke passed 0 findings /10 screenshots /0 retries in 105,379 ms; report SHA-256
`c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`.
Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
zero findings/instrument failures/retries in 52,254 ms; report SHA-256
`1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`;
reloads were 176–185 ms. Exact 8K was 185 ms /2 ms arm /12 ms invoked→release /
32 ms release→commit /122 ms commit→ready /152.2 ms `performanceNow`, with
target confirmations 1/9 ms and heartbeats 1/1 ms. Outgoing/replacement stores
were 2,730×1,536 each; outgoing collapsed to 1×1 and replacement remained
8,386,560 combined pixels. Nine automated personas passed, not human play;
JSON/Markdown SHA-256 are
`c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
`43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`.
Terminal-only performance was 578/659/76/170 ms. Exact preview
`dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
Edge 151; manifest SHA-256
`0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
37 files /10,186,230 bytes, content
`da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
production distinct and `publishable:false`. Live Git/status/PR checks determine
the docs-only tip; matching CI remains required before any separately authorized
preview or human step.

Test-battery #206, run
[`31635297321`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321) /
job [`94243979205`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321/job/94243979205),
completed attempt 1 without retry at exact pushed
`558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
Every preceding step and `smoke:ci` passed. Desktop-8k reload passed in 8,749 ms;
ready `performanceNow` was 2,578.6 ms, and initial target cycles were 1,905/1,910 ms
with 3/1 ms heartbeats. On the later 5,120×2,880 transition, exact-context
`Runtime.evaluate` timed out at 2,003 ms against the strict 2,000 ms bound while
`Browser.getVersion` answered in 2 ms; `last:null`. The sole
`ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` is a product finding, not instrument ambiguity.
The matrix ran 12 viewports with 1 product finding, 0 instrument failures, 56 executed
plus 1 product-blocked control =57, `omitted=[]`, and 0 retries. No persona or preview
evidence was produced. Preserve #206 red without retry.

Test-battery #207, run
[`31642880191`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191) /
job [`94269466117`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191/job/94269466117),
completed attempt 1 without retry at exact pushed
`ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
`8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. Every prior gate,
`smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed because
the valid release witness was observed between ordered `release-started` and
`release-complete`; release itself was healthy. The report retained 0 product findings,
1 instrument failure, 57 planned/listed controls, `blocked=[]`, `omitted=[]`, 0 retries,
and no persona/preview output. Preserve #207 red without retry.

The earlier dirty #207 diagnostic (report
`805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) is retained
for chronology only. Immutable executable source
`6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the sequential exact clean battery
at status/snapshot `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` /
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`. A first
sandboxed Edge launch SIGABRTed before CDP; the same preflight invocation passed when
permitted with only Edge 151/pin-150 drift, an environment launch refusal rather than a
product retry. Root gates and `exact-6554b2b-root-layout` 787/787 across 10/10 passed
in 75,532 ms (report `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`).
V2 passed 273/1 plus all static/art/coverage gates. One-attempt smoke passed 0 findings /
10 screenshots in 105,430 ms (report
`139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844`; log
`76a40b9bd8f88dd5f5ebdc09271c0ed289478795d6cd011338df349438ef62b8`).
Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact ordinal tail 6/7/8 on
every row, `blocked=[]`, `omitted=[]`, and 0 findings/instrument failures/retries (report
`a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`); reloads
were 171–260 ms. Tablet-portrait was 196 ms with commands 2/1/1/7/0 and ready
`performanceNow` 166.3 ms. Exact 8K was 197 ms with commands 1/1/0/7/0,
release→commit 34 ms, commit→ready 131 ms, ready `performanceNow` 163.6 ms,
2,365×1,330 outgoing twins →1×1, and replacement 6,290,900 pixels combined. Nine
automated-only personas passed (JSON
`fc8d6da1e0b18d824b5403121e87b02ee9423d9592f3221d2ff1819d20629e05`; Markdown
`08328ed2c760b722caa9f76259fe22a8dfcf1e36624086d388e19628774eb176`), plus
terminal-only 635/717/77/151 ms performance. Preview
`dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151 over loopback,
bound to the expected separate development origin, with `publishable:false`: manifest
`98a64b750d1def5c7895cbd780a35558863f000c5a3fbcf4c3945dd927d5ce04`, content
`04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`, tree
`986116980e7b7a224f210508b4872b5d7f5621ac`, registry
`8a290b25fc8ff27ca7f23f00367121a78a5e8af0`, and lock
`b81617792187b3e76c7f1586ed311d540f1451acadb85c369ffcd2c4571229cb`.
That immutable source remains prior #207 executable evidence; live Git/PR state determines
the current tip, upstream, and checks, and the selected pushed tip needs matching CI. No host, human,
Ready, merge, release, deploy, or version authority follows.

Test-battery #208, run
[`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
completed attempt 1 without retry at exact pushed head
`ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
and branch-flow run `31649175614` / job `94289512873` passed. Steps 1–15 and
`smoke:ci` passed. Desktop-8k alone then reported
`REPLACEMENT_UNANSWERABLE_AFTER_READY`: the valid 2,365×1,330 replacement pair
scheduled ready at browser performance 584.3 ms but emitted at 3,143.8 ms, a
2,559.5 ms main-thread gap. Exact target cycle 1 timed out at 2,003 ms against the
unchanged strict 2,000 ms bound while `Browser.getVersion` answered in 1 ms; no
fatal event occurred. All 12 rows ran, the first 11 passed, and the report records
1 product finding, 0 instrument failures, 57 planned controls with
`ultra-same-backing-resize` product-blocked, `omitted=[]`, 0 retries, and no
persona/preview output. Preserve #208 red without retry.

The fixed deterministic repair preserves native UHD and caps each simultaneous
full-viewport canvas above 8,388,608 CSS pixels at 2,073,600 pixels /4,147,200
aggregate. Exact 8K DPR 0.25 and 5K DPR 0.375 therefore both produce
1,920×1,080 stores. The two-second target, heartbeat, ready, ticker, resize,
pointer, and zero-retry contracts stay unchanged. Literal new-shape positives and
former 2,365×1,330 plus existing 2,730×1,536 ready/release negatives prevent an
old policy from passing.

The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
`307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed from committed clean bytes
(status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`). Root layout
passed 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`);
v2 passed 273/1 plus all gates; one-attempt smoke passed 0/10 in 105,339 ms
(`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
`fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`).
Glass passed 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 tails,
five-command ledgers, `blocked=[]`, `omitted=[]`, and zero findings/instrument failures/
retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`).
Exact 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms,
33/129 ms release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels
at DPR 0.25; terminal-only performance was 606/685/74/171 ms. Automated persona
JSON/Markdown hashes are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
`fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`.
Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
under Edge 151 over loopback, bound to expected separate origin
`https://dev-celestialfrontier.github.io`, with `publishable:false`; manifest/content/tree
hashes are `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
`5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
`5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR state determines current
tip/upstream/checks; the selected pushed tip requires matching CI. No host, human, Ready,
merge, release, deploy, or version authority follows.

Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
remains prior exact #206 executable evidence (clean status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`). Root
preflight warned Edge 151 vs pin 150; validate/smoke and exact layout 787/787 across
10/10 passed (`d0d9a9b3c58f996e5fb7b10f21aa98c974272531f10ccdb945cd026942429252`),
as did v2 273/1 plus all gates. One-attempt slice smoke passed 0 findings/10
screenshots in 105,217 ms (`b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474`;
log `538f4a36919cd947e7631f4eb786acbcd3a6e356ce55719843c8080004295087`).
Certifying glass passed 12/12, 57/57, `blocked=[]`, `omitted=[]`, zero findings/
instrument failures/retries in 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`),
reload range 175–203 ms. Exact 8K was 203 ms / `performanceNow` 158.2 ms, phases
2/11/33/127 ms, targets 1/10 ms, heartbeats 0/0 ms; 2,365×1,330 outgoing stores
collapsed to 1×1 and replacement remained 6,290,900 pixels combined. Nine
automated-only personas passed (JSON `c10c9e33542ed57b4c51683c0ddf3f1bbc468696a025e88ef2d1e500209581bc`;
Markdown `1c9961515028a716ba064ca32ea9dd3ef2d41118cfde4c76b24c16520daa2d14`),
plus terminal-only 581/659/73/152 ms performance. Exact preview
`dev-preview-exact-df1c28b-20260812T211642Z` was browser-smoked under Edge 151 over
loopback, bound to the expected separate dev origin, with `publishable:false`: manifest
`758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`,
37 files /10,186,537 bytes, content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`,
tree `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. That source remains prior #206
evidence; both it and clean `6554b2b` remain prior evidence, while clean `307b8aaf`
is the current local #208 executable evidence. No
host/human/Ready/merge/release/deploy/version authority follows.

Human development playtests use the exact commit-bound package published at
`https://dev-celestialfrontier.github.io/` after a successful `develop` push battery.
`npm run preview:package -- --origin=https://dev-celestialfrontier.github.io`
builds from an isolated `git archive` snapshot of exact HEAD and binds the shared
v2.0 identity, `develop-<short-commit>` build, full commit, source tree, dependency
lock, external content-registry blob, expected origin, storage contract, and byte
inventory in `preview.json` plus `version.json`. Runtime origin refusal,
`noindex` and a disallowing `robots.txt` remain mandatory. The visible identity
appears inside the Guide as v2.0 development plus the full source commit; preview
verification and browser smoke reject either historical corner-badge id/style.

The default artifact remains `publishable:false` and loopback-only. The mapped
post-green publisher creates and browser-smokes an approved exact-commit candidate,
then mirrors only that verified package to the separate development repository; it
never rebuilds or wraps the legacy root HTML. Production paths and same-origin project
paths are rejected because they would share browser storage. Package verification and
publication do not replace human play: record URL, full commit, manifest content hash,
device/browser lens, starting save, findings, and retest using
[`../DEVELOPMENT_PREVIEW.md`](../DEVELOPMENT_PREVIEW.md) and
[`../playtests/PLAYTEST_TEMPLATE.md`](../playtests/PLAYTEST_TEMPLATE.md).
Automated personas are evidence, not a human playtest. Resolve current Git, PR, and
check state live; this reference intentionally carries no “latest tip is green” claim.

Highest-priority open v2 work is now semantic and runtime-owned: canonicalize
the full CF1 galaxy→star→planet hierarchy; restore imported legacy full-state
tutorial snapshots; decide and preserve hybrid parent identity in CFB codes;
finish the remaining legacy Field Training arc and keep the canonical Guide's
current-safe topic bodies synchronized as systems land; add tooltip deep-links and
the Advanced Briefing surface;
virtualize the 1,500-row Compendium; own/destroy Pixi canvas textures and add a
memory plateau gate beyond the explicit replacement-reload teardown; attach completed HD planet textures to live sprites;
persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy;
then close remaining literal Gate-B boundaries and split-store/CAS persistence.
Static Platinum-reviewed portraits are deliberately frozen. The next major art
ceiling is Phase 5 living rigs/animation and Phase 6's 43 biome scenes, not a
blanket repaint of the 1,250 portraits covered by the package-level PASS.

**Historical reset status (2026-08-10): ★★★ RESET R1 FROZEN · WAVE 2D 50/50 PASS/PUSHED · WAVE 2E STATIC SOURCE MERGED, REVIEW EVIDENCE BLOCKED.**
**Historical port milestone record (2026-08-01):** ★★★ PHASES 1–3 COMPLETE (automatable) · PHASE 4 SHELL RUNNING.
**Phase 4 so far — the slice wears the game's face at the GOLDEN SCREENS' exact geometry**
(floating-pill topbar: player chip + HP bar + Prime pill + trail · objective chip fed by the
Ascent chapters as pure data, landfalls BANK for real · caption + hint bottom-center · round
dock ≤900px / left+right RAILS >900px, per ROADMAP #11) — with the panel system (one-panel
law, sticky ✕, tap-empty-close, focus restoration), SETTINGS (every control a real save
field: sound/volume/charts/motion/glass tint), the COMPENDIUM (list + detail cards:
describeSpecies prose, battleStats bars in STAT_HUES, grade badge), RECORDS (counts +
journal), the SEARCH bar (CF1 code-paste TRAVEL through the charter gates, or a codex
filter), the CMB band-pick, and the Escape-order law. The smoke carries a GEOMETRY CONTRACT
(real bounding boxes vs the goldens, desktop AND phone, self-controlled) plus 15 standing
negative controls. `npm run proofsheet` bakes the art/sound verdict sheet.

## Current species-art reset (2026-08-10)

Nick reopened the entire Earth/procedural catalogue after Fruit Bat exposed a
false visual acceptance. No GP7/GP7.1 band is current certification. The live
authority and fail-closed ruler are in
`reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`.

Reset r1 is now a complete fresh, hash-bound baseline from clean commit
`bc26e800c7adca72805a832e753ace1a8f9837ba`. The official 181-family / 233-packet
collector accepted every required native 440px, unlabeled 300px, actual unlabeled
132px, labelled old/current and exact set+species contract surface as **516 PASS /
14 POLISH / 720 FAIL**. The result lives at
`apps/game/smoke/full-reset-results-2026-08-10-r1/results.json` and is explicitly
not certification-eligible.

Wave 1 is exactly **177 reset non-PASS targets**: root 38 (2 fungi + 8 microbes +
28 procedural), fish 59, trees 48, and fauna2 32. Author-separated current review
closed every owner group PASS at 440/300/132: **177/177 scoped PASS**. The nine
source owners are `alientraits.ts`, `invertoverrides.ts`,
`proceduralfamilies.ts`, `proceduraloverrides.ts`, `speciesoverrides.ts`,
`faunaoverrides3.ts`, `florarost.ts`, `floraoverrides2.ts`, and
`faunaoverrides2.ts`. These scoped results are not a replacement 1,250-row
collector tally; do not add them to 516 and claim a catalogue score.

Wave 1 is `d005090f`; accepted Wave 2a is committed and pushed as `00e499c`.
Mammal A is **4/4 PASS** (Colugo, Sugar Glider, Fur Seal,
Sea Lion); the INVERT worms+sessile batch is **13/13 PASS**; and S1–S3 is
**15/15 PASS** after bounded R2 independently closed Caddisfly, Diving Beetle,
Firefly, and Water Beetle. Its immutable R2 recapture binds the same source hash
before A, between A/B and after B, with zero drift across 139 build inputs; all
26 rows / 156 current+repeat PNGs are hash/dimension/repeat exact. Exactly four targets changed and all
22 protected rows remain byte-identical at all three scales. Across those three
catalogue batches Wave 2a is **32/32 scoped PASS**—not a
new full-catalogue tally.

Vanilla Orchid r6 is independently judged continuity PASS at
`floraoverrides2.ts` SHA-256
`5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`.
The evidence root
`apps/game/smoke/hybrid-continuity-wave2-vanilla-2026-08-10-r6` validates
234/234 assets, exact source/hash/dimension records, and both browser orders.
The pure portrait remains byte-exact to
`3f6834b7f984b35186fa1c441eeb4537d3e5793d446e447b021a1e3687939a25`;
all five stages are unique and progress meaningfully from pure through the 0.22
anchor floor. `hybridcheck` now requires five exact ID+kingdom+name focused lineages spanning all four
kingdoms and rejects fourteen injected negative controls, including focused-species
substitution and Vanilla stage collapse. The prior `FAIL_BYTE_IDENTICAL_STAGES` blocker is closed. Broader
all-bloodline and full-catalogue certification remains OPEN.

Wave 2b is committed/pushed as `9c148f0` with **51/51 independently PASS**
across three non-overlapping source
lanes: Mammal B 25/25, Bird B1 21/21, and Invert I 5/5 (Banana Slug, Chiton,
Comb Jelly, Portuguese Man-of-War, Isopod). The first independent rounds failed
closed on six mammals and four birds; bounded Mammal R3 and Bird R2 closed those
exact rows. Invert's first candidate separately failed Banana Slug at 132px, and
a Banana-only refinement closed the four-tentacle/tip-eye read. Final sources are
`quadrupedoverrides.ts`
`288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE`,
`mammaloverrides.ts`
`2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA`,
`faunaoverrides.ts`
`783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10`,
`birdoverrides.ts`
`B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF`,
and `invertoverrides.ts`
`9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D`.
Current/repeat evidence and protected controls are exact. The final integrated
gates are green with all five source SHAs unchanged: typecheck/artunused pass,
speccheck is 417/0/0, overridecheck is 1,014/1,014 catalogue and 1,010/1,010
Earth routes, speciesaudit is 1,250/1,250 with zero failure/duplicate/clipping,
and targeted/full diff checks pass. The checkpoint is committed/pushed as
`9c148f0`. This scoped closure does not
replace the frozen 516/14/720 ledger.

Wave 2c is now **56/56 independently PASS**: Mammal C 13/13, Bird B2 28/28
and Invert II 15/15. Its fail-closed path was deliberate. Mammal C progressed
from 0/13 candidate-ready through 8/13 and 11/13 previews before Red Panda's
leg/body join and Tasmanian Devil's chest-band integration closed. Bird B2's
first independent shared judgment was 25 PASS /3 FAIL (Eider Duck, Rail,
Avocet), and Invert II's was 13 PASS /2 FAIL (Krill, Tadpole Shrimp). Final R2
changed only those five exact identities and the independent rejudges closed
all five.

The admissible A/B root is
`apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10`; manifest SHA-256
is `BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`.
It contains 249 rows =56 targets +193 protected controls, 747 PNG surfaces per
run and 1,494 verified physical PNGs. Current/repeat is exact on 747/747
surfaces; 579/579 protected surfaces match the shared baseline; all 168 target
surfaces changed; the final exact-five changed 15 surfaces while the other 244
rows /732 surfaces stayed exact. Three 139-file input snapshots have zero drift
and three negative controls were rejected.

Final Wave-2c source SHA-256 values are `quadrupedoverrides.ts`
`45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59`,
`mammaloverrides.ts`
`50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2`,
`faunaoverrides.ts`
`D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5`,
`birdoverrides.ts`
`C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21`
and `invertoverrides.ts`
`6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0`.
The integrated gates are green with those hashes unchanged: typecheck and
artunused pass; Vitest is 238 passed /1 skipped across 23 files; speccheck is
418/0/0; overridecheck is 1,014/1,014 live and 1,010/1,010 Earth;
speciesaudit is 1,250/1,250 with zero failure, duplicate pair or clipping;
hybridcheck passes and rejects all 11 injected failures; hybridmatrix,
speciesstrip, fullresetlayout and fullresetreview selftests pass; coveragegap is
1,010/1,010 with zero remaining; `git diff --check` passes. Wave 2c was then
committed/pushed as `dc015cf`, without opening or merging the reset PR.

Wave 2d is now **50/50 independently
PASS** across Mammal D 16/16, Bird B3 27/27, and Invert III 7/7. It failed
closed at every unresolved delivery-size cue: Mammal preview R2 reopened Fisher,
Marten, Wolverine, Sea Otter, Hyrax, and Mole; the first independent final then
reopened Civet alone for its missing pointed muzzle, and Civet-only R4 closed it.
Bird B3 progressed from 11/27 candidate-ready through an exact-16 R2 and an
exact-three Pheasant/Quetzal/Macaw R3. Invert III progressed from 5/7 through an
exact-two Camel Spider/Tarantula R2. Final judges returned 16/16, 27/27, and 7/7.

The final admissible root is
`apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10`; manifest SHA-256
is `DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`.
Its pre-edit seal is
`7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F`.
It binds 304 rows =50 targets +254 protected controls, 912 surfaces/run,
1,824 PNG hash/dimension checks, exact 912/912 current/repeat surfaces,
762/762 baseline-exact protected surfaces, and 150/150 changed target surfaces.
Civet-only R4 changed 3/3 surfaces; the other 303 rows /909 surfaces remained
exact. Three 139-file input snapshots have zero drift and four negative controls
were rejected.

Final Wave-2d sources are `faunaoverrides.ts`
`63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2`,
`birdoverrides.ts`
`48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7`,
`quadrupedoverrides.ts`
`544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1`,
`mammaloverrides.ts`
`776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E`,
and `invertoverrides.ts`
`2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677`.
The previously deferred `marsupial-c1`, Skua colour-arm, and shadowed Invert-II
option cleanups are now proven pixel-neutral by the same protected baseline.

The integrated Wave-2d report is green with those five hashes and the 139-input
aggregate unchanged: typecheck/artunused; 23-file Vitest (238 pass /1 skip);
speccheck 419/0/0 plus 5/5 selftest; coveragegap 1,010/1,010; artaudit 23
sources/0; tokencheck selftest 16/16; overridecheck 1,014/1,014 routes and
1,010/1,010 species; speciesaudit 1,250/1,250 with zero failure/duplicate/
clipping; hybridcheck with 11 negatives; hybridmatrix/speciesstrip/
fullresetlayout/fullresetreview selftests; and `git diff --check`. Wave 2d is
committed/pushed as `2ed0f28`, not a reset PR or catalogue recertification.

Wave 2e's exact 47-target static implementation (Mammal E 13 + Fauna E 21 +
Invert IV 13) is checkpoint `5db9039` and reached `develop` through merged PR #8
at `bb1a980`. Its four frozen art sources remain byte-exact. The first Mac
continuation stopped before any post-edit export or visual judgment: the
documented 288-row pre-edit union lives under ignored `apps/game/smoke/`, did
not cross Git, and has no tracked scoped-capture/reconstruction recipe. Its
recorded seal `BC424C8F…AA37` and index `2AE4FDB1…26E3` therefore cannot be
independently verified here. Recover the exact Windows evidence or explicitly
authorize a deterministic reconstruction from pre-edit `2ed0f28` that
reproduces both hashes before A/B promotion. A bounded portability seam now lets
`gp71rejudge --prepare` and `fullresetlayout --packets` resolve an exact
Chromium-family executable through `CF_BROWSER` or checked platform paths, so a
new **current-only, unreviewed** Mac catalogue export can be prepared. The same
resolver reaches `fullresetreview` through its imported packet compositor, but
that does not unlock Wave 2e A/B because the scoped old evidence is still
absent. `speciesstrip`, `speciesaudit`, and `hybridblendcheck` remain separately
Windows-bound. Historical Windows passes are not fresh Mac results.

The separate `overridecheck` blocker is closed: pinned Rolldown 1.2.1/Oxc parses
each complete TypeScript art source as an AST, and only literal string
property/array nodes become route keys. Every such key is validated regardless
of length or alphabet, and malformed CANON keys cannot disappear. It still rejects genuine dead,
duplicate, shadowed, unclassified, new-file, and unwired-table defects with
exact diagnostics. Controls prove inline/ternary values stay out and later
routes survive template/regex, control-head/member-call, Unicode-identifier and
ASI grammar traps. Full-source declaration traversal covers parenthesized,
annotated, comment-separated and later `const` declarators; post-declaration
writes/aliases and malformed route-table source exit 2. Painter values must be
statically callable (and quadruped specs objects) through immutable, unwritten exact
local/import bindings; supported factories must return a direct callable expression.
Neither `null!`, mutable aliases, nor truthy objects count as painters. Its harness refuses
concurrent source overwrite and measures wiring only from supported route-selection
initializer AST shapes, their exact precedence and executable guard/call/fallback/furniture
consumer chains, and the returned-canvas `fitInk` path inside parsed `resolveOverride`;
the catalog denominator is an exact four-kingdom `_EARTH_NAMES` AST plus its pinned read-only
consumer, so quote style or later mutation cannot hide roster entries. Disconnected consumers,
always-false predicates, discarded/inert syntax, and later `OVERRIDE_COUNT` mentions cannot
mask a disconnected table. Computed route members/methods outside exact audited consumer
nodes fail closed. Recursive `.ts`/`.mts`/`.cts`/`.tsx` discovery rejects untracked executable
sources/imports/re-exports, and normalized full-path import plus actual-export ownership prevents
nested same-basename or same-file export impersonation. Shadow direction follows exact resolver
precedence, and helper parameter/reassignment/implementation drift, direct trusted-global escape,
and incomplete kingdom-qualified route coverage fail. The static sentinel assumes standard
unmodified platform intrinsics and approved dependency implementations; it is not a hostile-runtime
sandbox, dependency-integrity proof, or visual verdict.
Independent post-edit provenance and resolver/compositor reviews returned PASS.
Static gates remain green:
1,014/1,014 routes, 1,010/1,010 species, typecheck/artunused, 23-file Vitest
(238 pass /1 skip), speccheck 454/0/0, coveragegap 1,010/1,010, artaudit 23/0,
and `git diff --check`. No Wave 2e art PASS, full tally, certification package,
release, or deployment is claimed.

The first live hybrid-matrix attempt exposed a real schema-v2 harness contract
bug, not transient provenance or an art verdict: it required both Green Algae
route owners to be current catalogue members even though D-CAT-1 keeps only the
flora identity in the live roster and retains `microbe|Green Algae` solely for
old-save compatibility. Schema v3 repairs that provenance model, records current
catalogue ownership separately from the retained legacy route, and
negative-controls relabelling. Its sentinels are green; both stable browser
orders validated all 234/234 assets.

The Wave-1 stale cleanup also established a routing rule: a whole-form named
painter owns one early-return path; required details behind that return are inert,
and a second same-target overlay risks seams. Prove the winning route before
editing or deleting. The flora cleanup made `strictSignature` and
`resetTreeSignature` mutually exclusive for 39 overlapping names and removed
unreachable orchard/citrus alternatives with **0/174** tree-surface drift at
440/300/132 and **0/332** Earth-flora native drift.

Literal completion still means a new clean 1,250-row collection containing only
fresh PASS, with zero carried verdicts, POLISH, or FAIL. No final certification,
certification image-inclusive ZIP, reset PR, release, or deployment exists.

## Historical GP7/GP7.1 evidence (not the reset score)

The current renderer covers all **1,250** catalogue identities (631 fauna, 332 flora,
27 fungi, 20 microbes, 240 procedural). **GP7 is the frozen baseline; GP7.1 was the
subsequent remediation pass before the full reset superseded it.** GP7 measured **503 changed rows / 95 strips**
(165 PASS, 37 POLISH, 301 FAIL) plus **62 unchanged controls / 39 strips** (11 PASS,
4 POLISH, 47 FAIL). The procedural correction subset is **57/57 PASS**. The paired control
shows the new ruler is materially harsher on unchanged art: eligible-row demotions are
38.8% for drift versus 65.6% for control (−26.8 points). Therefore the carried full-catalogue
merge — 217 PASS / 415 POLISH / 618 FAIL — is inventory state across mixed rulers, **not a
catalogue score**. GP7 is frozen as evidence; GP7.1 permitted named fixes only and never a global
body pass. Its historical fresh-PASS contract is recorded in
`reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md`.

GP7.1 completed its **first all-fresh review baseline**: 1,250 then-current
440x440 portraits and 196 hash-bound packets, independently collected as
**318 FAIL / 301 POLISH / 631 PASS**, with zero carried rows. It was an honest
repair baseline, not a completion claim; its 619 non-PASS rows remain historical
diagnostic evidence and are not the reset's carried work queue.

The first post-baseline r2 delta pass independently reviewed all 362 changed
pixels: fauna 46 PASS / 42 POLISH / 10 FAIL (98), flora+fungi 56 / 62 / 49
(167), and procedural 76 / 21 / 0 (97). The remaining 888 portraits retained
their exact baseline bytes. This is progress evidence only, not a replacement
1,250-row ledger. The second narrow repair pass was captured as r3 (1,250
portraits / 196 packets); it differs from r2 in 106 hashes and deliberately
has no verdict ledger. It was awaiting independent review when the full reset
superseded that sequence; it remains historical evidence, not the next live
input or a route to certification.

The GP7/GP7.1 review/export workflow is fail-closed and runs from this directory:

| Tool | Role |
|---|---|
| `npm run preview:selftest` / `npm run preview:package -- --origin=https://<separate-host>` / `npm run preview:verify -- --verify=<root>` / `npm run preview:smoke -- --root=<root>` | Negative-controls production/path/insecure origins, transient working-tree poison, package tampering, version/build drift, and both historical corner badges; then creates, verifies, and real-browser-boots a clean-commit package from an isolated exact-HEAD snapshot. The guarded loader, `robots.txt`, `preview.json` tree/lock/input/byte hashes, shared v2.0 version and site `version.json` must agree. The 320×568 boot opens the Guide and requires v2.0 plus the full source commit with no floating badge. The shared workspace lock prevents overlap with source-mutating controls, and CI pins one exact `CF_BROWSER` at job scope. Default output is remote-blocked; only an approved candidate is eligible for the mapped post-green `develop` publisher, which separately owns deployment authority. |
| `npm run smoke:ci` | Runs the authoritative real-browser `slicesmoke.mjs` exactly once, retains complete stdout/stderr in `slice-smoke.log`, and writes commit/branch/working-tree/browser/screenshot-bound `slice-smoke-report.json`. `smokereport` owns one full-lifetime workspace lock and passes a validated one-child inherited lease to `slicesmoke`, retaining the lock through screenshot hashing and report finalization. A failure prints the first scoped diagnosis plus a related count; it never retries a red run. |
| `npm run glassmatrix:selftest` / `npm run glassmatrix` | Negative-controls the responsive/a11y instrument, then runs fresh Chromium ownership across 12 viewports—including an 8K stress case—and writes `glassmatrix-report.json` on pass, product failure, or instrument failure. It covers populated Training/Guide/cards/settings/import surfaces, safe areas, zoom, keyboard focus, 44px targets, contrast, reduced motion, aggregate twin-canvas DPR and boot order without retrying. Portrait Planetside owns `planetside-portrait-band-viability` and `planetside-portrait-trail-fallback`. Import/reload owns `import-phase-sequence`, `replacement-ticker-quiescence`, `replacement-document-loader-token-phase`, `reload-resource-release`, and `replacement-boot-phase-sequence`: the exact import stream requires ticker-running invocation, a stopped claim/write/release, and one absolute 20-second clock before the bounded arm. A capture-scoped ordinal requires the exact release-started N → release N+1 → release-complete N+2 tail; only the valid release-first intermediate waits under that unchanged clock. Sticky receipts then require a changed-loader commit within 5 seconds, the exact 12-stage `cf-v2-boot-phase/v1` sequence, and one `cf-v2-slice-ready/v1` tail from the new session/context/generation/origin/loader/token within 20 seconds. The ticker stays false through wiring and true thereafter; browser-native `performanceNow` is strictly below the bound. Two strict at-most-2-second post-ready cycles each pair an exact-context target probe with an independent browser-process heartbeat, with cycle two awaiting a later post-render ticker turn; the import arm plus both pairs form the exact five-row command ledger. The same-backing ultra control applies that target/heartbeat discriminator to both downshift and restore, requires a later advancing ticker turn, and rejects stopped/stale ticker states. Bounded sticky failure evidence diagnoses red and separates a target-only product answerability failure from transport/instrument failure. No retry, timeout increase, or IndexedDB timeout race is used. The command owns the shared workspace lock while building/browsing. |
| `npm run persona:selftest` / `npm run persona:report` | Joins only passing slice-smoke and glass-matrix evidence with matching commit/branch and dirty-tree digest into `automated-persona-report.{json,md}`. The nine lenses are explicitly **AUTOMATED — NOT A HUMAN PLAYTEST**; comprehension, fun, physical devices, assistive technology, visual judgment, battery and heat remain human work. |
| `node tools/browserpath.mjs --print` / `--selftest` | Resolves one exact real Chromium-family executable for raw-CDP evidence tools, including root `tools/uilayout.js`; an explicit invalid `CF_BROWSER` fails closed instead of silently selecting another browser. Environment scope is process-local: a green browser in one workflow step does not pin the resolver in the next. CI therefore supplies the exact path at job scope and resolves it before long gates. |
| `node tools/browsercdp.mjs --selftest` | Uses the manifest/lock-declared `ws` transport and owns port-0 `DevToolsActivePort` startup, complete `Browser.getVersion` provenance, early-exit plus bounded stderr head/tail diagnosis, WebSocket and command bounds, pending-command rejection, bounded TERM→KILL shutdown, and validated profile cleanup. A caller may choose a shorter positive per-command timeout for a phase-owned confirmation but cannot exceed the connection-wide ceiling; the selftest rejects both a deliberately stalled short command and attempted ceiling expansion. Root `tools/uilayout.js` consumes this launcher and adds stale-report, exact-run, and sealed-inventory controls. Root preflight launches this same probe; legacy `bootperf` shares the resolver/`ws` transport but not this lifecycle. |
| `node tools/proceduralnames.mjs --selftest` | Proves the exact 240-row bridge among full, drift, and render procedural identities. |
| `node tools/rejudgecards.mjs --drift=<file> --out=<dir> [--control] [--full]` | Builds indexed drift, unchanged-control, or full-catalogue review strips and packets from the current renderer. |
| `node tools/speciesstrip.mjs "<name,...>" [out.png]` | Renders a small named Earth/procedural strip for targeted visual diagnosis; `npm run stripcheck` exercises its positive and rejection controls. |
| `node tools/gp7collect.mjs` | Validates packet completeness, schema, exact names/order, bands, and reasons before writing the canonical GP7 drift/control records. |
| `npm run gp7conformity -- --input <extracted-recheck-dir>` | Validates a 1,250-row ledger/manifest/results/index join and reports direct vs carried remediation work. `--certify` rejects every carried or non-PASS row; it guards ledger provenance and never substitutes for rendering or visual review. |
| `node tools/gp71rejudge.mjs --prepare --out=gp71-rejudge --date=2026-08-09` | Builds the separate GP7.1 all-fresh 1,250-portrait / 196-packet evidence set, with no generated verdicts. `--collect` refuses partial, stale, or misaligned packet verdicts. |
| `node tools/gp71compare.mjs --verify-only --old-root=<old> --current-root=<current> --catalogue=<current-index>` | Exact-joins two complete 1,250-image evidence roots; generation mode writes hash-bound family-organized old/current sheets to a new output directory. |
| `npm run hybridcheck` | Drives the real browser art wrapper and proves set-qualified lineage pixels across five exact ID+kingdom+name focused lineages spanning fauna/flora/fungi/microbe, Earth/alien parent orders, multi-generation cases, duplicate names, swapped-parent cache separation and deterministic repeats; fourteen injected negative controls must all be rejected. |
| `npm run hybridmatrix -- --out=<new-name-under-apps/game/smoke>` | Writes the 13-lineage × 5-stage production hybrid continuity matrix—including principal microbe lineage Amoeba—plus cards, silhouettes, 4× join crops, repeat/reload proof and reversed-parent cache controls to a new 251-asset evidence root. It deliberately reports visual continuity OPEN until independently judged. |
| `npm run fullresetlayout -- --prepare --evidence=<current-root> --out=<new-layout> --per=10 --packets --source-commit=<40-hex>` | From a clean commit-bound 1,250-image root, derives the official 181 families / 233 packets, 46 procedural plan families, exact set/species contracts and labelled/unlabeled packet evidence. `--verify` is the read-only counterpart. |
| `npm run fullresetreview -- --compare …` / `--template` / `--collect` / `--certify` | Binds each row to native 440px, unlabeled 300px, actual unlabeled 132px, labelled old/current and exact contract hashes; creates empty fresh verdicts, collects only complete matching review, and certifies only 1,250 fresh PASS. See the copy-ready sequence below. |
| `node tools/gp71package-2026-08-09.mjs ...` | Creates a separate dated GP7.1 image-inclusive ZIP only after `gp7conformity --certify` accepts the fresh ledger; it rejects legacy/overlapping targets. |
| `node tools/rejudgemerge.mjs --fresh=<file> --base=<file> --control=<file> --out=<file>` | Folds fresh drift verdicts into the carried baseline and reports paired control calibration; it will not claim a delta without control. |
| `npm run speciesexport` | Rebuilds and verifies the 1,250 native 440×440 portraits and per-set ZIPs. |
| `npm run cataloguecards` | Alias for `rejudgecards --full`; generates the family-grouped complete-catalogue contact sheets and packets. |
| `npm run gp7package` | Verifies portrait/contact coverage, records SHA-256 hashes, and assembles the dated complete-review ZIP. |
| `npm run currentreviewpackage -- --catalogue=<capture> --layout=<layout> --hybrid=<matrix> --output=</outside/repository/new.zip>` | Creates a new extracted-and-reverified **UNREVIEWED current-state** package spanning the exact 1,250 catalogue rows, official packet layout, and representative five-stage hybrid evidence. The ZIP must be outside the source repository so publishing it cannot dirty its own freshness proof. It rejects completed-verdict artifacts and completed-status/schema fields under the clean-source producer contract and never replaces the later all-PASS certification ZIP. Producer code, approved reference inputs, and platform intrinsics at the recorded clean commit are trusted; hashes are integrity checks, not authenticity signatures against coordinated malicious rewriting and resealing. |
| `npm run currentreviewpackage -- --freshness=<package.zip-or-extracted-root>` | Deep-reverifies a sealed review package and reports `FRESH_FOR_CURRENT` only while its source commit, clean checkout, package producer, Platinum ruler and exact six-field browser provenance still match the live checkout. The first mismatch reports `STALE_FOR_CURRENT`; it does not invalidate the historical artifact. |
| `npm run gliderreview -- --verify --baseline=<sealed-79ce144-capture> --current=<fresh-capture-a> --repeat=<fresh-capture-b> --source-commit=<40-hex>` | Fail-closed mechanical A/B gate for Sugar Glider, Flying Squirrel and Colugo. It requires three distinct/repeat-exact repaired portraits, exact protected bat/rodent/quadruped hashes, three independent roots, and identical six-field browser provenance; it never supplies the human art verdict. |

Nick explicitly requested a full current-generation review archive on 2026-08-10.
It is now produced from clean evidence commit `79ce144` with exactly 2,146 PNGs:
1,250 native portraits, 196 catalogue strips, 466 official layout sheets, and
234 representative hybrid assets. The ZIP is 472,304,848 bytes with SHA-256
`18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5`. Its README
and manifest say **UNREVIEWED / CURRENT-ONLY / NOT CERTIFIED**, preserve every
producer manifest/hash, and state that the missing Wave 2e pre-edit evidence
prevents old/current comparison or promotion. It is not the dated image-inclusive
certification package described below.

The independent Platinum review of that exact archive is preserved at
`reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md`
(SHA-256 `5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2`).
It correctly keeps the archive below Platinum: Sugar Glider, Flying Squirrel and
Colugo require stronger family separation; several hybrid fauna switch scaffold
too abruptly; Apple, Vanilla Orchid and Oyster Mushroom need stronger low-anchor
drift; and the matrix lacked a principal microbe lineage. The 2,146-PNG ZIP stays
sealed as the reviewed baseline. The repair contract uses hybrid schema v4,
13×5 principal stages including Amoeba, 251 hybrid assets, and an exact reviewed-
fauna route allowlist while Sea Turtle and Great White Shark remain protected.
The successor combined archive is 2,163 PNGs from clean source `03ea297`,
470,045,987 bytes at SHA-256
`ef7a6e9bb720ab6e6e1497569ade194b471ed7ab63449ee94ea5c94c57372f4b`.
Its exact external review is preserved at
`reference/Celestial_Frontier_Current_Platinum_Repair_All_Pass_Review_2026-08-11.md`
(SHA-256 `1c6c49e74270e9c69800de5b10b031aacf73a7a30937350086e97bc712823b3f`)
and returns **PASS with optional polish only / APPROVE**. The archive's generated
`CURRENT_ONLY / UNREVIEWED / NOT_CERTIFIED` fields remain immutable preparation
metadata; the review is a separate human-verdict overlay and is not the formal
1,250-row certification package described below.
Any later documentation/source commit makes `--freshness` report
`STALE_FOR_CURRENT: source commit differs`; that is an honest current-checkout state,
not corruption or retroactive invalidation of the sealed reviewed artifact.

The complete reset recapture sequence, after a bounded repair wave is committed
and the worktree is clean at a full 40-hex HEAD, is:

```powershell
node tools/gp71rejudge.mjs --prepare --out=<NEW_CURRENT_EVIDENCE> --date=2026-08-10
npm.cmd run fullresetlayout -- --prepare --evidence=<CURRENT_EVIDENCE> --out=<NEW_LAYOUT_DIR> --per=10 --packets --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --compare --layout=<LAYOUT_DIR> --old=<OLD_EVIDENCE> --current=<CURRENT_EVIDENCE> --out=<NEW_COMPARISON_DIR> --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --template --comparison=<COMPARISON_DIR> --out=<NEW_VERDICT_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
# Independent judges fill the generated templates.
npm.cmd run fullresetreview -- --collect --comparison=<COMPARISON_DIR> --verdicts=<FILLED_VERDICT_DIR> --out=<NEW_RESULTS_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --certify --comparison=<COMPARISON_DIR> --verdicts=<FILLED_VERDICT_DIR> --results=<RESULTS_DIR> --out=<NEW_CERTIFICATION_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
```

Every output directory must be new. Do not edit art while verdicts are being
written, and do not run `--certify` until collection reports 1,250 fresh PASS.

The GP7 baseline packaging sequence (`speciesexport` → `cataloguecards` → `gp7package`) completed.
The package gate accepted all review records and emitted
`apps/game/smoke/Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip`
(305,291,135 bytes; SHA-256
`47B730C0323241F8E171DC3A96D4EFD5C67FA0C3CA12333CA17EBE10540D398F`).

The Phase 1–3 record below stands as history:

**Phase 2 was** (2026-07-31): Phase 2 so far: `@cf/domain-progression` (COSMIC_EPOCH clock + harvest readiness — injected play-time source, so the harvestclock invariant holds by construction; bodies mirror v1.8.9) and `@cf/persistence` (§19.3 stores · repository with the CF-RR-002 recovery semantics · in-memory + IndexedDB backends; IDB's end-to-end proof lands with Phase 3's browser slice). ⚠ The reset-law test was REWRITTEN after its own negative control passed with the defect live — recover() short-circuits on a missing primary, so the vacuous assertion never saw a surviving backup; the test now drives the real resurrection scenario (reset → new corrupt write → recover must find nothing). ★★★ **PHASE 2 AUTOMATABLE SIDE COMPLETE.** importSaveV2 (11/11 parity over the 72-field surface vs real-boot fixtures; found ROADMAP 9i — string maxGen poisoning, reproduced bug-for-bug) · exportSaveV2 (doSave mirror) · **the round-trip fixed point** (stable from round two; round one moves exactly what a live doSave moves) · repository flow end-to-end (corrupt → recover → veteran survives byte-identical). Root gates: `npm run savefixtures` (9 real-boot fixtures) + `contentregistry` (validation surface). Gate C blocked solely on Nick's real save (tools/savefixtures.js takes it verbatim). **★★★ PHASE 3 IS RUNNING: the Pixi vertical slice (apps/game) drives Gate D's core loop in a real browser** — universe → Milky Way → Sol → Earth surface, painterly art via @cf/art (GalaxyArt/ThumbArt/renderer painters lifted verbatim), the game's ZOOM-DRIVEN transitions (checkTransitions semantics, camT-intent based), Renderer LOD gates (fine-star resolve layer, Sun marker at SOL_POS, baseR star sizing), painterly system view (corona/BH/NS primaries, live orbit angles, terminator, banded rings, typed moons, belt/kuiper rocks, dwarfs), pinch + cursor-anchored wheel, SURVEY-FIRST input (one tap = the describePick card + sonar ping; its explicit Enter action dives), a STREAMING universe (camera-windowed cells; the wormhole's seeded jump works, reach-clamped) with the full deep-sky population (cosmic web + captions, quasars/blazars, radio-galaxy lobes, tidal bridges, galaxy names, the charter ring/veil/fog, the OBS_R edge), **the CHARTER/ASCENT GATES live and pure** (@cf/scene/charter.ts — stage 0 Sol-only → 3 everywhere, reach by REGIONS; blocked dives toast the build that opens the ring), comets + the interstellar visitor in system view, COSMIC_EPOCH running on play time (@cf/domain-progression's clock; supernova sites render epoch-anchored), the game's shipped stings via **@cf/audio** (whoosh/ping over the save's own sndOn/sfxVol; §15 voice scope stays gated behind the listening test), **and THE REAL SAVE LOOP: the slice boots through importSaveV2 and persists through exportSaveV2 over IndexedDB — nav rides the save's `view` (viewToNav ⇄ navToView through the real _sanitizeView), landings ride `land`, EPOCH_BASE accumulates.** `npm run smoke` (tools/slicesmoke.mjs, headless Edge/CDP) is the standing gate: the full loop + the zoom ladder with an empty-space negative control + the real-save assertions, zero console errors. See ROADMAP's Phase 3 blocks for the batch history and NEXT.

Phase 1 record:
16 test files · 161 tests · 200,000+ golden cases + the 50-probe fingerprint surface, all green from TypeScript; `npx tsc --noEmit` strict clean.

Gate B deliverables, all landed:
- **`tests/sweep.test.ts`** — the full **27-generator sweep** (was 25; see extensions) from TS in one file, with a completeness assertion that fails if the fixture gains a generator without a TS recipe.
- **`tests/nodom.test.ts`** — the no-DOM / no-nondeterminism lint over every domain source, exceptions explicit and reasoned (2: combatcore's app-coupled avatar painters; worldgen's `galaxyHaze` — ★ a layering violation in the SOURCE, canvas art inside a [domain] module, flagged for upstream relocation).
- **`@cf/domain-sessionrng`** — reviewer §2.1: replayable player outcomes. Counter-per-domain design so UI interleaving never shifts another domain's sequence; state serializes into the save/diagnostics; seed creation is explicitly the app layer's job. Wiring the 11 `Math.random()` call sites happens in Phase 2+.
- **`@cf/domain-strays`** — the domain-pure functions living outside the 14 modules: cleanName, `_r2`+where-codecs, winEstimate, STAT_KEYS+floraStat, BIOME_SETS+biomeFor, hdGenesFor, `_sanitizeSavedGenome`. Closes the remaining code-fixtures buckets (whereCodes, sanitizeSavedGenome incl. the v1.8.7 `sizePreserved` invariant ×23) and the biomeFor/hdGenesFor golden ×1k. (`hdGenesFor`'s Earth-bestiary branch needs `_earthArt` — SpeciesArt, Phase 4; recorded in the d.ts.)
- **Corpus extensions, addition-only and diff-verified** (all 25 pre-existing generators byte-identical, seeds identical): `makeNoise` ×10k (closes the module-1 recorded gap) and `crossGenome_uncorrelated` ×10k (closes the module-11 blind spot — the size-mutation branch is finally value-pinned). Root gate `npm run goldenseeds`: PASS, 27 generators / 198,000 cases. This workspace is the
port itself; everything else under `port/` is plan, evidence, and decisions.

```
npx vitest run        # the parity suite — ~72,000 golden cases + fingerprint probes
npx tsc --noEmit      # strict typecheck (also run in apps/game for the slice)
npm run smoke         # the slice in a REAL browser — Gate D loop, zoom ladder,
                      #   charter gate, Gate-C import rehearsal, the PHONE leg
npm run proofsheet    # the art+sound verdict sheet (golden vs slice, one page)
```

Layout per `PORT_MASTER_PLAN_v4.0.md` §18: `packages/domain/<module>/`. Toolchain pinned
exact: typescript 7.0.2 · vitest 4.1.10 · @types/node. Isolated from the game's dependency
set. Root evidence dependencies are declared in `tools/deps.pinned.json`; the shared
raw-CDP launcher also declares `ws` in both root and v2 install surfaces.

## The port rule (Gate B: "preserve exact JavaScript numeric semantics")

**Function bodies are v1.8.9 source VERBATIM; only types are added.** `|0`, `Math.imul`,
`>>>`, `/4294967296` are the determinism contract. A "cleanup" that passes typecheck can
still shift every world in the universe. When in doubt, don't touch the body — the fixtures,
not the type system, are what pin behaviour.

## Two ways a module gets here

| | When | How |
|---|---|---|
| **Hand-port** | Small modules (≲100 lines) | TS directly in `src/index.ts`, bodies verbatim + annotations |
| **Lift** | Everything else | `node tools/lift.mjs <ModuleName> packages/domain/<name>/src` — byte-verbatim extraction with auto-detected imports, source line range + body sha in the header, **DO NOT EDIT** marker. Typed surface = `index.ts` + hand-written `.verbatim.d.ts` |

⚠ **Register each new package's exports in `lift.mjs`'s `REGISTRY`** — auto-import detection
depends on it, and several rows are still placeholders.

## Parity: two fixture sources, one rule

- **`tests/parity.ts`** — golden-seeds (`port/baseline-v1.8.9/golden-seeds.json`): volume.
  canon + FNV implemented from the fixture's *own documented spec*; if this file and the
  capture probe ever disagree, **the fixture wins**.
- **`tests/baseline.ts`** — the 50-probe fingerprint (`tools/baseline.json`): breadth.
  ⚠ Values are stored as **JSON strings** of the sanitized value — compare
  `canon(ours) === storedString`, never deep-equal.

Test recipes must mirror `tools/probe.js` / `tools/goldenseeds-probe.js` **exactly** — the
call shapes are part of the fixture contract.

**Negative-control every new module once**: perturb a constant → parity must fail *naming
seeds* → revert → green. This caught two lifter bugs and one false "10 passed" (a
syntax-broken test file is silently not collected — **count the test files, not the tests**).

## Module status

| # | Module | Parity | Notes |
|---|---|---|---|
| 1 | rand | 30,000 golden | makeNoise/clamp/mix not fixture-covered (recorded) |
| 2 | worldconfig | constants probe 0–6 | indices 7–9 are app-layer, later |
| 3 | naming | names probe ×7 groups | speciesName slot closed by module 8 |
| 4 | starcatalog | starClass ×10k + probe | |
| 5 | planetgen | planetParams ×10k + probe | surfaceColor pinned transitively via Descriptors |
| 6 | worldgen | systemFor ×1k + 6 probes | ⚠ `systemSol` probe **deferred**: fingerprint value encodes probe-order mutation (`_pal` cached by descriptor probes onto memoized P). Descriptors owes the replay. `slimGal` carried here temporarily (main.js:3014). |
| 7 | surveyphrases | climateBand ×1k | phrase builders pinned via planetDescriptor later |
| 8 | speciestraits | 30k golden + 3 probes + **the 9g invariant guard** | GRADE_TIERS collapse finally has a test |
| 9 | genome | 71k golden (makeGenome ×4 kingdoms, speciesGrade, sapienceTier, classifyRealm, guardianFor, describeSpecies) + 7 probes | **9g part 2**: the collapse now guarded END-TO-END through speciesGrade incl. forced apex tiers 12–14. lift.mjs REGISTRY rows for surveyphrases/speciestraits/genome filled (were placeholders) |
| 10 | encutil | independent-truth (Node Buffer b64 as second implementation + hand-computed shade values) | ⚠ no fixture samples EncUtil directly — recorded in src; b64 pinned transitively when CombatCore's codec probes land |
| 11 | genetics | crossGenome ×10k + crossGenome/evolveGenome probes + outcome invariants | ⚠ **NEW FIXTURE BLIND SPOT FOUND**: the golden recipe's consecutive parent seeds (s, s+1) collapse the mutation draw — the size-mutation branch is NEVER executed across all 10k cases (color 80% · trait 12.5% · size 0). Uniform with uncorrelated parents, so the game is fine; the corpus is not. Remedy queued for Gate B: ADD an uncorrelated-pair generator (never re-capture). Until then the invariant suite covers the branch with hashed-seed pairs |
| 12 | ecology | planetSpecies probe (⚠ VACUOUS BY CAPTURE — probe.js passes level=2 vs string levels, stored value is literally `[]` since v1.0) + outcome invariants | ⚠ salt-perturbation negative control PASSES today (measured — no value pinning until planetDescriptor ×1k lands with module 13). COSMIC_EPOCH reads 0 in the lift (= capture condition); app layer wires the real epoch in Phase 2+. ★ `biomeFor` (golden ×1k) lives at main.js:10824 OUTSIDE the 14 domain modules — slimGal-style relocation, queued for Gate B |
| 13 | descriptors | planetDescriptor + starDescriptor ×1k each (heavy) + 6 probes + **★ the systemSol REPLAY (deferred since module 6, now closed byte-for-byte)** | App hooks: `installCaptureHooks()` installs the capture-environment stand-ins (thumb stubs pinned to jsdom's `data:image/png;base64,`; planetThumb replays the `_pal` gas-palette cache; verbatim carries of `_cardFactsSet`, `_EARTH_NAMES`/`_earthNamePass` (631/334/27/22 roster), GAL_KIND — machine-extracted by `tools/lift-apphooks.mjs`). slimGal RELOCATED here from worldgen (thread closed). ★ FOUND: worldgen's `galaxiesInCell` read free `GAL_SPRITES` — no fixture cell is populated, so it was green while every REAL cell threw; hooked + real-input test added. Ecology's salt hole VERIFIED closed (0xB105 perturbation now fails 2 tests here) |
| 14 | combatcore | battleStats ×1k + 6 probes + **code-fixtures**: share/champion codes over the 23-genome adversarial corpus, normGenome hardener, cleanName | `@cf/domain-strays` founded (`tools/lift-strays.mjs`): cleanName carried verbatim (decodeCreature calls it; code-fixtures pins it). App-coupled exports (playerAvatar/statBlockHTML/…) documented as needing hooks. ⚠ whereCodes + sanitizeSavedGenome fixture buckets await the Gate B strays (encodeWhere/_sanitizeSavedGenome) — recorded in the test file |

**Then Gate B close-out:** no-DOM-imports lint · SessionRNG (reviewer §2.1) · extend the
golden corpus with a noise generator (an intended *addition*, never re-capture-to-pass) ·
full 25-generator sweep from TS.

## The port lesson worth carrying

Memoized generators make **call order observable state** — the fingerprint's `systemSol`
proves it. The TS port should either not share cached objects across callers or never
mutate them after creation.
