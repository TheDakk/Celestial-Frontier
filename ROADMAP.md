# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO) are the SOURCE OF TRUTH we pull from for a
## full-system review/edit later. RULE: whenever we change a system, update its doc IN THE
## SAME BATCH (and bump its "matches code as of" marker) — the same way we run validate and
## update this roadmap. A change isn't done until its markdown reflects it. Also keep
## celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable.

## ▶▶▶ SESSION HANDOFF — 2026-08-12 · DRAFT PR #11: V2 HARDENING + PLAYTEST READINESS ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`.
- Integration baseline: PR #10 merged normally into `develop` at
  `61cc058abca0b37dcd5f44ff11012bf8b8dea4c9`.
- Executable/evidence head:
  immutable executable evidence source
  `46fb627640e42ea0f43e2e144529884a959d1e72`; its complete exact local battery
  passed and it underlies a forthcoming/current docs-only handoff tip. Exact tip/upstream/
  CI state is live authority from `git rev-parse HEAD`,
  `git status --short --branch`, and PR #11 checks. Prior
  test-battery #201, run
  [`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
  job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
  remains preserved red without retry on the superseded `4560269` source. Test-battery #202,
  run [`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
  job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
  likewise remains preserved red without retry at pushed `93f75a93`; its only failure is the
  ambiguous desktop-8k serial readiness observer described below. Test-battery #203, run
  [`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
  job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
  remains preserved red without retry at exact pushed `38e4f362`; it passed every preceding
  gate and 11 glass rows, then desktop-8k crossed the unchanged import bound before the first
  release receipt. Test-battery #204, run
  [`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
  job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
  remains preserved red without retry at exact pushed `4cee7d80`; its import/write/release/
  navigation/load/FCP path was healthy, but desktop-8k emitted no application-ready witness
  inside the unchanged boot bound. The twin-backing/boot-order repair is now bound to the exact
  clean local evidence below; matching CI for the final pushed docs tip remains pending.
  Draft PR #11 is open at
  https://github.com/TheDakk/Celestial-Frontier/pull/11.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `README.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `SAVE_SYSTEM.md` ·
  `UI_PRESENTATION.md` · `QUESTS_AND_CHAPTERS.md` ·
  `BREEDING_AND_SHARING.md` · `LINEAGE_AND_BREEDING.md` · `ART_DIRECTION.md` ·
  `PROGRESSION.md` · `port/DEVELOPMENT_PREVIEW.md` ·
  `port/HANDOFF_NEXT_SESSION.md`.

### Current batch

The already-ported Phase-4 slice is being audited and hardened, not replaced. The batch
protects sparse/corrupt/newer save data, restores IndexedDB retry, bounds hostile epochs,
validates Atlas and composite scene identity, prevents repeated landfall credit and external-
code landing bypass, restores named-world CF1 round trips, retains lazy-art subscribers,
strengthens SessionRNG and declaration parity, makes the phone dock a measured 4×2 contract,
corrects Pixi DPR/CSS pointer geometry, and uses explicit minimum-44px survey actions for
descent. Browser flows cover desktop and phone navigation, Charter denial/success, protected
save import, Land/Leave, and stale-action rejection.

The v2 in-game Guide now extends the mature source instead of replacing it with a parallel
manual. Its canonical snapshot has **9 categories, 43 authored stable IDs, and 41 player
topics**; the two dormant legacy entries remain source-addressed rather than being advertised
as live. Search, categories, keyboard-operable cross-links, current-system copy, and honest
unavailable states share that one model. Save import stays under **Settings → Save data →
Bring expedition**, preserving the measured dock.

Release information follows the existing system too: the v2 Guide exposes the exact legacy
history of **56 releases / 398 bullets**, while current v2 work is collected only in
`V2_DRAFT_RELEASE`. The draft is unversioned and cannot open the one-time update bulletin,
mutate `rnSeen`, or imply a ship. `V2_CURRENT_RELEASE_VERSION` stays unset until Nick
authorizes a version. No version bump occurred.

The glass/UI pass is mobile-first and resolution-independent: safe-area handling, minimum
targets, keyboard/focus continuity, screen-reader state, contrast-safe glass, display
preferences, reduced-motion behavior, and bounded DPR are exercised across **12 viewports,
including an 8K stress viewport**. Panels reserve a dedicated 44px sticky-close gutter and
restore focus to their opener, or to Survey/canvas when a desktop rail opener has become
hidden. On landed ≤900px layouts the objective yields to populated Planetside until ascent;
short landscape yields the trail. Portrait measures fixed top chrome, the last
visible trail edge, and safe/dock/context lower chrome: when a 72px useful roster plus 6px
clearance fits, the trail remains; otherwise only that noninteractive trail yields while a
minimum-72px vertically scrollable Planetside remains usable and restores the trail when space
returns. Dock icons use the 42px client line inside their 44px target, and
A++ retains a larger toast-title tier. Training keeps its intentional layer choreography and locks keyboard
focus to the live lesson; ordinary panels remain above survey cards outside Training. Field
Training still implements the six current chart/travel/landing lessons plus an honest
graduation. The rest of the legacy 21-step arc, tooltip deep-links, and Advanced Briefings
remain open until their systems are live.

Evidence is now structured and provenance-bound:

- root `uilayout-report.json` is ignored per-run evidence: atomic schema v2 writes
  `running` before launch, then terminal `pass`, `fail`, or `instrument-fail` with
  exact run/browser provenance while retaining legacy `results`;
- `slice-smoke-report.json` plus its complete log and browser screenshots records one real
  browser run without retrying a failure;
- `glassmatrix-report.json` records the 12-viewport responsive/accessibility run;
- `automated-persona-report.json` and `.md` join only matching passing smoke/glass evidence
  and are labeled **AUTOMATED — NOT A HUMAN PLAYTEST**;
- the development-preview package is bound to a full commit, source tree, lockfile and byte
  hashes, visibly marked DEV, and refused on production/path origins.

Replacement readiness is now event-owned rather than serialized through Page/Runtime polls.
An exact-operation `cf-v2-import-phase/v1` stream begins with the outgoing ticker running,
requires it stopped from the exclusive claim through persistence/write/release, and binds every
receipt to the old document/session/default context/loader plus one immutable 20-second deadline
that starts before the bounded non-awaiting arm command. A failed/rolled-back owner alone restores
a ticker it stopped; invalid pre-claim input leaves play unchanged. IndexedDB durability is not
raced against an unsafe timeout.
Exactly one prior-context release, a changed top-frame-loader commit and one optional
`cf-v2-slice-ready/v1` event from the new default top context/session/generation/origin/loader/
token/URL must arrive inside the independent import/navigation/boot deadlines. The app emits that
tail event after load, persistence and complete slice/input wiring, at least one ticker turn, an
animation frame and a later task; its browser-native timestamp must itself be strictly below 20
seconds. One at-most-2-second command confirms the exact context. This means complete boot
publication plus a serviced turn, not the separate 50 ms answerability outcome.

The current repair treats density as an aggregate full-viewport allocation, not a per-canvas
allowance. The Pixi application and backdrop split one 4,096²-pixel budget equally; each remains
no larger than native 4K, and the 8K fixture now uses 3,862×2,172 per canvas / 16,776,528 pixels
combined. Pixi boots with `autoStart:false` through save load, scene publication, slice publication
and input wiring, then starts explicitly and proves one real tick/render, animation frame and later
task before ready. An exact 12-stage `cf-v2-boot-phase/v1` stream is bound to the replacement
session/context/generation/origin/loader/token; its ticker is false through wiring and true only
from `ticker-started`. Per-stage identity/order/ticker/deadline controls prevent load or FCP from
standing in for application readiness.

The exact local review artifact is bound to the recommended separate origin
`https://dev-celestialfrontier.github.io`, but no preview host or publication is authorized or
present. Do not create a project path under `celestialfrontier.github.io`; it would share
production browser storage. No release, live deployment, `main` update, or version bump is part
of this batch.

### Evidence status and stop condition

The archived evidence ledger retains the exact #199–#202 chronology and launcher/dependency
repairs. In brief: #199 exposed the old 8K reload ambiguity and short-phone Planetside overlap;
#200 passed the product matrix but exposed step-local Chrome provenance loss in preview smoke;
#201 preserved an old-loader replacement-lifecycle red; and #202 proved the serial CDP observer
could outlive its phase clock. None was retried away. Their fixes are in `8b8a740`, `4d14a75`,
`08379d8`, and clean exact evidence source `20896ad`; the full text is newest-first in
`ROADMAP_ARCHIVE.md`.

Matching test-battery #203, run
[`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
completed once without retry at exact pushed head
`38e4f362533e272f56f708229f7a037f38ae8951` and is **RED**. All root/product/v2
gates and `smoke:ci` before glass passed. Eleven glass rows passed; desktop-8k alone
reached 20,015 ms before any release, ready, navigation, fatal, command, or diagnostic
event receipt. The outgoing 5,461×3,072 Pixi ticker was still live across the durable-
write wait and teardown under CI software rendering. This is a real pre-release
renderer-pressure cliff, not evidence of corrupt imported bytes or a reported repository-
write rejection. Preserve #203; do not retry it, increase the deadline, or introduce an
IndexedDB timeout race.

The follow-on repair stops the ticker synchronously when an operation wins the exclusive
replacement claim, before the first await, and restores it only when that exact owner rolls
back after having stopped a running ticker. Its event-owned import phases name claim,
prior-persist wait, primary write, and release under the original absolute deadline.

The mixed-source smoke refusal and immutable `7d9980e` ticker-quiescence battery remain preserved
verbatim in `ROADMAP_ARCHIVE.md`; they are prior evidence, not the current #204 certification.

`7d9980e` remains immutable prior exact evidence for ticker quiescence; current repair evidence is
bound to clean executable source `46fb627640e42ea0f43e2e144529884a959d1e72` below. That source
underlies a forthcoming/current docs-only handoff tip. Live Git/PR state decides its exact final
tip/upstream/check status, and matching pushed-tip CI remains required before preview/human play.

Matching test-battery #204, run
[`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
completed once without retry at exact pushed head
`4cee7d807b8f9258e370aad31c30756269f95a96` and is **RED**. Every earlier root/product/v2
gate and `smoke:ci` passed. Desktop-8k's arm command queued for 9,504 ms; durable write and release
completed, release took 35 ms, the changed loader committed 45 ms later, and replacement load /
first-contentful-paint arrived at 231 / 268 ms. No fatal event occurred, yet no ready witness
arrived inside 20 seconds. This is not a save/import/navigation failure. The replacement document
allocated two full 16,777,216-pixel canvases and Pixi auto-started its ticker before asynchronous
boot wiring, so software rendering could starve the very work required to publish readiness.
Preserve #204 without retry or a longer deadline.

Clean executable source `46fb627640e42ea0f43e2e144529884a959d1e72` passed the exact local
battery. One malformed operator invocation of `--verify-run` caused a local Edge SIGABRT and
overwrote the root-layout report; the chronology is preserved, and one correctly formed rerun
plus verification then passed `exact-46fb627-root-layout`, the sealed 787/787 outcomes across
10/10 viewports. V2 passed 273 tests / 1 skip plus all type, art, override, coverage, spec and
instrument gates/selftests. One-attempt `smoke:ci` passed with 0 findings / 10 screenshots.

Full certifying glass at source-snapshot digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a` passed 12/12
viewports, 53/53 planned/executed controls, `omitted=[]`, 0 findings/instrument failures/retries
and 170–197 ms totals. Desktop-8k recorded 190 ms total, a 2 ms arm, 15 ms
`invoked`→`release-complete`, 1 ms primary write, 35 ms release→changed-loader commit and 137 ms
commit→ready, with all 12 boot stages, `performanceNow` 170.5 ms and 1 ms confirmation. Both
outgoing 3,862×2,172 canvases collapsed
to 1×1; the replacement pair remained 3,862×2,172 each / 16,776,528 pixels combined. All nine
automated personas passed, still not a human playtest; terminal-only performance was
595/676/76/168 ms. Exact preview manifest `dev-preview-exact-46fb627` records 37 files /
10,176,376 bytes, content SHA-256
`4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`, exact `port/v2`
tree `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected origin
`https://dev-celestialfrontier.github.io`, production distinct and `publishable:false`.
Matching CI for the final pushed docs tip remains pending.

`overridecontrol` remains exclusive and must not overlap any build/browser/evidence producer.
Because the new manual preview workflow
is not dispatchable until it exists on the default branch, PR #11's pre-merge candidate must use
the equivalent explicitly approved local packaging command recorded in
`port/DEVELOPMENT_PREVIEW.md`; the workflow becomes the normal path after the infrastructure lands
on `develop`.

Even a green automated battery is not merge authority. A real human playtest against the
commit-bound separate-origin preview is required before **Ready for review** or merge. Record
the full commit, `preview.json` content hash, URL, tester/device/browser lens, starting save,
findings and retest in `port/playtests/`. Human lenses must cover first-time, returning,
strategy, casual, keyboard, touch/mobile, accessibility/assistive technology, visual quality,
and physical-device heat/battery where available. Resolve or explicitly disposition every
finding, rerun affected gates, then update the PR body with exact final evidence.

### Next implementation order after this batch

1. Canonicalize the complete CF1 galaxy → star → planet hierarchy.
2. Restore imported legacy full-expedition `tsnap` before clearing it.
3. Decide and preserve CFB parent identity because parent loss changes hybrid combat identity.
4. Complete the remaining live Field Training lessons, tooltip deep-links and Advanced
   Briefings while keeping the canonical Guide capability-aware.
5. Virtualize the 1,500-row Compendium and bound/cancel thumbnail work.
6. Finish general Pixi canvas-texture ownership beyond the explicit replacement-reload teardown
   and add a travel-memory plateau gate.
7. Attach the generated HD planet texture to the live sprite.
8. Persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy.
9. Close the remaining literal Gate-B DOM/type boundaries and split-store/CAS persistence.
10. Advance Phase 5 living organism rigs/animation and Phase 6's 43 biome/ecology scenes.

The static flora/fauna/procedural portrait set remains covered by the sealed package-level
Platinum **PASS with optional polish only / APPROVE** review. Do not blanket-repaint it merely
to create activity. The higher-value visual ceiling is living rigs and biome scenes; actual
human play remains the judge of motion, readability, comfort and perceived quality.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac` — executable/evidence head
`46fb627640e42ea0f43e2e144529884a959d1e72` is the immutable source for the complete exact
local battery recorded above and underlies a forthcoming/current docs-only handoff tip. Resolve exact current
tip/upstream/check state live; prior #201, #202, #203, and #204 remain preserved red without retry.

**GitHub step:** keep PR #11 draft and preserve red #201 (`31586917924` / `94082765087`),
#202 (`31594595288` / `94106996466`), #203 (`31602984470` / `94134750800`), and
#204 (`31612817092` / `94168172635`) without retry. Read `git rev-parse HEAD`,
`git status --short --branch`, and PR #11 checks; if
`origin/openai/mac` is behind the current tip, push it, then require matching green CI for that
final pushed tip. Only after green CI, obtain host approval, publish the separate-origin preview,
complete/record human play, resolve/retest findings, and let Nick click **Ready for review** before
a normal merge into `develop`. Never auto-merge, squash/rebase, retarget `main`, or add work to
merged PR #10.

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
  > Pixi/global resources, detach and collapse the outgoing application/backdrop canvases, and cross
  > one task boundary before navigation without a generic pagehide teardown. The responsive gate
  > requires that release witness, then uses sticky CDP receipt times to independently observe a
  > 20-second import transaction, 5-second navigation commit and 20-second new-loader boot. Exactly
  > one `cf-v2-slice-ready/v1` event from the new default top context/session/loader/token/URL, with
  > a browser-native timestamp strictly below the boot bound, precedes one at-most-2-second exact-
  > context confirmation; no serial poll or retry owns the verdict. Replacement ownership now
  > quiesces the outgoing ticker before any durable-write await and restores it only on exact-
  > owner rollback. An exact-operation import-phase stream requires the ticker running at
  > invocation, stopped through claim/write/release, and begins its absolute deadline before the
  > bounded arm command; no IndexedDB timeout race is used. The two full-viewport canvases now
  > share one 4,096²-pixel aggregate budget, and Pixi remains stopped until save/scene/slice/input
  > wiring completes. A 12-stage boot witness proves exact replacement identity and that the ticker
  > starts only for a real tick/render/rAF/task before ready; load/FCP alone cannot pass. Adds provenance-bound
  > smoke, glass and automated-persona reports plus commit-bound development-preview packaging;
  > pins the CI browser at job scope so a later preview process cannot silently switch from Chrome
  > to Linux Edge when a preceding step's environment expires. Moves the root 10-viewport layout
  > gate onto the same owned port-0 CDP launcher and adds ignored atomic pass/fail/instrument-fail
  > evidence, stale-PASS/exit-73 selftest, exact-run freshness and a separate required CI upload;
  > automated personas are explicitly not a human playtest. Clean executable evidence is bound to
  > `46fb627640e42ea0f43e2e144529884a959d1e72`: after one transparently recorded malformed
  > `--verify-run` invocation caused local SIGABRT/report overwrite, the single correct root-layout
  > rerun plus verification passed 787/787 across 10/10; v2 passed 273/1 and every gate/selftest;
  > one-attempt smoke passed 0/10; certifying glass passed 12/12 with planned/executed 53/53,
  > `omitted=[]`, zero findings/instrument failures/retries and 170–197 ms totals; and all nine
  > automated personas passed. Exact 8K was 190 ms total /2 ms arm /35 ms release→commit /
  > 137 ms commit→ready /170.5 ms `performanceNow` /1 ms confirmation, with outgoing
  > 3,862×2,172 canvases →1×1 and the replacement pair at 16,776,528 combined pixels. Terminal-only
  > performance was 595/676/76/168 ms. The exact 37-file /10,176,376-byte
  > `dev-preview-exact-46fb627` manifest records content SHA-256
  > `4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`, the expected
  > separate origin and `publishable:false`.
  > Prior #201 (`31586917924` / `94082765087`), #202
  > (`31594595288` / `94106996466`), #203 (`31602984470` / `94134750800`), and #204
  > (`31612817092` / `94168172635`) remain preserved red without retry; #202 exposed serial CDP
  > observer latency, #203 exposed pre-release 8K renderer pressure, and #204 exposed twin full-
  > resolution replacement allocations plus pre-wiring ticker startup. Exact tip/upstream/check status is read
  > live; the final pushed non-executable
  > handoff tip requires matching green CI. The local review artifact is bound to
  > `https://dev-celestialfrontier.github.io`, but no host or publication is authorized. After the
  > matching CI is green, complete and record a multi-lens human playtest against that exact preview before marking
  > this PR Ready or merging. The static Platinum-reviewed portrait set is unchanged; later visual
  > work remains living rigs/animation and biome scenes. After merge, Anthropic/Claude Code may
  > synchronize only from a clean `anthropic/windows` worktree with `git fetch origin` then
  > `git merge origin/develop`. No release, deployment, certification, `main` change, live-site
  > change or version bump is included.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not need
to be opened now and does not have this batch. It may continue unrelated work but must not
expect these changes or copy files manually. Only after PR #11 merges, at its next coding
batch and from a clean worktree, run `git fetch origin` then `git merge origin/develop`. If
dirty, do not pull, switch or merge until its own work is safely finished/committed.

**Release status:** PR #11 is open, draft and unmerged. `develop` remains at merged PR #10
(`61cc058`); `main` and https://celestialfrontier.github.io/ are unchanged. No release,
deployment, certification, preview publication or version bump has occurred.
