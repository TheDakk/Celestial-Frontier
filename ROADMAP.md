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
## ▶▶▶ SESSION HANDOFF — 2026-08-12 · MERGED PR #11: BRANCH-SITE PUBLICATION ◀◀◀
### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`.
- Integration baseline: PR #11 merged normally into `develop` at `d2dcd08`; final branch-flow and
  test-battery passed once without retry.
- Standing authority (Nick, 2026-08-13): an agent may merge its scoped clean/mergeable PR into
  `develop` after required battery terminal-green, then monitor exact push publication: `main` → production;
  `develop` → `https://dev-celestialfrontier.github.io/`; DEV is distinct/noindexed/stamped—never `main`,
  red-check bypass, manual Pages/targets/keys, or inferred release/version/production-deploy authority.
- Latest immutable CI evidence: test-battery #208, run
  [`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
  job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
  completed attempt 1 without retry at exact pushed
  `ee8bc281c424b5a8f998dc7327372e5f5a18067d` and remains **RED**. Merge
  `8fc6b4fc` is tree-identical; branch-flow run `31649175614` / job `94289512873`
  passed. Steps 1–15 and `smoke:ci` passed; the sole desktop-8k product-answerability
  finding is described below. Immutable clean executable source
  `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed the exact clean local battery for
  the fixed-cap repair; PR #11 later passed matching CI at its final merged tip.
  Exact tip/upstream/check state is live authority
  from `git rev-parse HEAD`, `git status --short --branch`, and PR #11 checks.
  CI #201–#208 remain preserved red without retry; their exact run/job/head diagnoses and
  repair evidence are newest-first in `ROADMAP_ARCHIVE.md` and the live system references.
  PR #11 is merged; current Git/branch/site status is live authority.
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
seconds. Two strict, no-retry, at-most-two-second target cycles confirm the exact context,
each concurrent with root-session `Browser.getVersion`; the second resolves from a later Pixi
ticker turn after render. The five-command ledger and separate executed/product-blocked/omitted
control accounting distinguish product answerability from instrument/transport failure.

The frozen repair retains native backing through UHD 3,840×2,160. A viewport strictly above
8,388,608 CSS pixels selects a fixed cap of 2,073,600 pixels/canvas /4,147,200 aggregate;
exact rounded fitting makes tested 8K DPR 0.25 and 5,120×2,880 DPR 0.375 use
1,920×1,080 per canvas /4,147,200 combined. The old backdrop is
destroyed and collapsed before replacement allocation, transition peak/budget is explicit, and
same-backing logical resizes still refresh CSS/Pixi/EventSystem/pointer/backdrop geometry. Both
downshift and restore require a strict target probe plus `Browser.getVersion` heartbeat, an
advancing later post-render ticker turn, and stopped/stale-ticker negative controls. The product
still performs its existing scene rerender on resize; no scene-rerender optimization landed.
Pixi boots with `autoStart:false` through save load, scene publication, slice publication
and input wiring, then starts explicitly and proves one real tick/render, animation frame and later
task before ready. An exact 12-stage `cf-v2-boot-phase/v1` stream is bound to the replacement
session/context/generation/origin/loader/token; its ticker is false through wiring and true only
from `ticker-started`. Per-stage identity/order/ticker/deadline controls prevent load or FCP from
standing in for application readiness.

The dev branch site is now configured at the genuinely separate origin
`https://dev-celestialfrontier.github.io`; only a passing `develop` push battery may update it.
The separate v2 review artifact remains `publishable:false` and does not replace the required
commit-bound human playtest. Do not create a project path under `celestialfrontier.github.io`;
it would share production browser storage. No release or version bump is part of this batch.

### Evidence status and stop condition

The mixed-source smoke refusal and immutable `7d9980e` ticker-quiescence battery remain preserved
verbatim in `ROADMAP_ARCHIVE.md`; they are prior evidence, not current repair authority.

The superseded `46fb627` exact battery and #204 chronology moved verbatim to
`ROADMAP_ARCHIVE.md`. #201–#208 remain preserved red without retry.

The prior `c57305f` dirty diagnostic and immutable `135a635` exact clean battery moved
verbatim to `ROADMAP_ARCHIVE.md`; they remain historical evidence, not #206 repair authority.

The #206 red and immutable clean `df1c28b` repair evidence moved verbatim to
`ROADMAP_ARCHIVE.md`; that clean battery remains prior executable evidence.

The #207 red and immutable clean `6554b2b` repair evidence moved verbatim to
`ROADMAP_ARCHIVE.md`; that source remains prior executable evidence.

Test-battery #208, run
[`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
completed attempt 1 without retry at exact pushed head
`ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
while branch-flow run `31649175614` / job `94289512873` passed. Steps 1–15 and
`smoke:ci` passed. The first 11 glass rows passed; desktop-8k alone reported
`REPLACEMENT_UNANSWERABLE_AFTER_READY`. Its valid 2,365×1,330 replacement pair /
6,290,900 pixels remained under the 3,145,728-per-canvas cap. The import arm recorded
2,481 ms; release tail 6/7/8, changed-loader commit, and all boot stages were healthy,
with first tick at browser performance 540.8 ms. Ready scheduled at 584.3 ms but emitted at
3,143.8 ms, a 2,559.5 ms main-thread gap. Exact target cycle 1 then timed out at
2,003 ms against the unchanged strict 2,000 ms bound while the concurrent browser
heartbeat answered in 1 ms; no fatal occurred. The complete 12-row report records
1 product finding, 0 instrument failures, 57 planned controls with
`ultra-same-backing-resize` product-blocked, `omitted=[]`, 0 retries, and no persona/
preview output. Glass artifact SHA-256 is
`3c9fac42025345428da4ea0841db86bb3c30cba95460f871f49488758020e9ac`; smoke
report/log/current digest prefixes are `c211cdd1…`, `fd2bad70…`, and `68fe3432…`;
artifact IDs are `9162555913`, `9162556125`, and `9162556467`. Preserve #208 red.

The deterministic repair keeps native backing through UHD and caps each simultaneous
full-viewport canvas above 8,388,608 CSS pixels at 2,073,600 pixels /4,147,200
aggregate. Exact tested 8K DPR 0.25 and 5K DPR 0.375 resolve to 1,920×1,080 each.
Literal positives cover the new dimensions/budget; former 2,365×1,330 ready/release
shapes and existing 2,730×1,536 shapes fail as negatives, alongside threshold/UHD,
runtime resize, pointer, and ticker controls. The two-second target, heartbeat, ready,
and zero-retry contracts are unchanged.

The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
`307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed the exact battery from committed,
clean bytes (status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`): root layout
787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`),
v2 273/1 plus all gates, and one-attempt smoke 0 findings/10 screenshots in 105,339 ms
(`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`;
log `fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`).
Certifying glass passed 12/12 unique rows and 57/57 controls in 53,083 ms, with exact
6/7/8 release tails, five-command ledgers, empty blocked/omitted ledgers and zero findings/
instrument failures/retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`).
Exact 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms,
33 ms release→commit, 129 ms commit→ready, 1,920×1,080 stores at DPR 0.25 and the
2,073,600-per-canvas /4,147,200-combined cap; outgoing twins collapsed to 1×1.
Automated-only persona JSON/Markdown hashes are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
`fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`; terminal-only
performance was 606/685/74/171 ms. Preview
`dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked under Edge 151
over loopback, bound to expected separate origin `https://dev-celestialfrontier.github.io`,
with `publishable:false`; manifest/content/tree hashes are
`1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
`5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
`5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR state determines current
tip/upstream/checks; the selected final pushed tip requires matching CI. No host, publication,
human-play, Ready, merge, release, deployment, or version authority follows.

`overridecontrol` remains exclusive and must not overlap any build/browser/evidence producer.
Because the new manual preview workflow is not dispatchable until it exists on the default
branch, after matching green CI and explicit Nick approval any PR #11 pre-merge candidate may
use the equivalent local packaging command recorded in `port/DEVELOPMENT_PREVIEW.md`; no such
approval or publication is implied. The workflow becomes normal after the infrastructure lands
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

**Current side:** OpenAI/Codex on macOS, branch `openai/mac` — test-battery #208 is the latest
immutable pushed CI evidence at `ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge
`8fc6b4fc` is tree-identical, and the product-answerability run remains red without retry.
Immutable clean executable source `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed the
exact clean local battery for the 2,073,600-pixel/canvas repair. Resolve tip/upstream/check state live;
the selected pushed tip requires matching CI, and #201–#208 remain preserved red without retry.

**GitHub step:** keep PR #11 draft and preserve red #201 (`31586917924` / `94082765087`),
#202 (`31594595288` / `94106996466`), #203 (`31602984470` / `94134750800`), and
#204 (`31612817092` / `94168172635`), #205 (`31621227550` / `94196289291`), and
#206 (`31635297321` / `94243979205`), #207 (`31642880191` / `94269466117`), and
#208 (`31649176954` / `94289516851`)
without retry. Read `git rev-parse HEAD`,
`git status --short --branch`, and PR #11 checks. Push the current `openai/mac` tip only if
its upstream is behind; live state determines commit/push status, and whichever final pushed
tip is selected requires matching green CI. Only after green CI,
obtain host approval, publish the separate-origin preview,
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
  > a browser-native timestamp strictly below the boot bound, precedes two strict at-most-2-second
  > exact-context cycles, each concurrent with a browser-process heartbeat; the second runs on a
  > later post-render ticker turn. Import/release bindings carry a scoped monotonic receipt ordinal;
  > the only accepted tail is release-started N → release N+1 → release-complete N+2. The valid
  > release-first intermediate waits under the unchanged import deadline, while premature,
  > nonadjacent, missing, late, duplicate, malformed and wrong-provenance tails fail closed. No
  > serial poll or retry owns the verdict. Replacement ownership now
  > quiesces the outgoing ticker before any durable-write await and restores it only on exact-
  > owner rollback. An exact-operation import-phase stream requires the ticker running at
  > invocation, stopped through claim/write/release, and begins its absolute deadline before the
  > bounded arm command; no IndexedDB timeout race is used. Native backing remains through UHD;
  > larger viewports use a fixed 2,073,600-pixel/canvas cap (tested 8K and 5K 16:9 are
  > 1,920×1,080 each), with old-backdrop release before replacement allocation. Downshift and
  > restore require target/heartbeat evidence plus a later advancing ticker turn; this repair does
  > not optimize the existing scene rerender. Pixi remains stopped until save/scene/slice/input
  > wiring completes. A 12-stage boot witness proves exact replacement identity and that the ticker
  > starts only for a real tick/render/rAF/task before ready; load/FCP alone cannot pass. Adds provenance-bound
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
  > 8,386,560 combined pixels. All nine automated personas passed; terminal-only performance
  > was 578/659/76/170 ms. Exact preview
  > `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under Edge 151,
  > records 37 files /10,186,230 bytes and content SHA-256
  > `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`, with the
  > expected separate origin and `publishable:false`.
  > Prior #201 (`31586917924` / `94082765087`), #202
  > (`31594595288` / `94106996466`), #203 (`31602984470` / `94134750800`), and #204
  > (`31612817092` / `94168172635`), #205 (`31621227550` / `94196289291`), and #206
  > (`31635297321` / `94243979205`), #207 (`31642880191` / `94269466117`), and #208
  > (`31649176954` / `94289516851`) remain preserved red
  > without retry; #202 exposed serial CDP
  > observer latency, #203 exposed pre-release 8K renderer pressure, and #204 exposed twin full-
  > resolution replacement allocations plus pre-wiring ticker startup. #205 reached ready and then
  > lost its two-second target confirmation without a concurrent browser heartbeat. #206 passed
  > its 8K reload/ready chain, then its later 5K resize target timed out at 2,003 ms while the
  > browser heartbeat answered in 2 ms: one product finding, 0 instrument failures, 56 executed +
  > 1 product-blocked =57, `omitted=[]`, 0 retries, and no persona/preview output. #207 passed every
  > earlier gate and 11 glass rows, then tablet-portrait exposed a valid release witness between
  > release-started and release-complete that the observer rejected prematurely: 0 product findings,
  > 1 instrument failure, 57 listed controls, empty blocked/omitted ledgers, 0 retries, and no
  > persona/preview output. #208 passed steps 1–15, `smoke:ci`, and 11 glass rows,
  > then exact 8K target cycle 1 timed out at 2,003 ms while the concurrent heartbeat answered
  > in 1 ms after ready scheduling→emission had already stalled 2,559.5 ms: 1 product finding,
  > 0 instrument failures, 57 planned with the runtime same-backing control product-blocked,
  > `omitted=[]`, 0 retries, and no persona/preview output. Preserve every red run without retry.
  > The `d8684c…` dirty fixed-cap PASS is prior diagnostic chronology only. Immutable clean
  > executable source `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed the exact local battery:
  > root layout 787/787 across 10/10, v2 273/1 plus all gates, one-attempt smoke 0/10,
  > certifying glass 12/12 and 57/57 with exact 6/7/8 tails and zero findings/instrument
  > failures/retries, nine automated-only personas, and terminal-only 606/685/74/171 ms.
  > Exact 8K was 171 ms / 161.9 ms, five commands 1/1/1/3/0 ms, 33/129 ms
  > release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels. Exact preview
  > `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked under Edge 151
  > over loopback, bound to the expected separate development origin, with `publishable:false`.
  > Its glass/smoke/preview-manifest hashes are `42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f` /
  > `90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723` /
  > `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d`. The prior
  > 3,145,728-pixel/canvas repair has exact clean executable evidence at immutable
  > `df1c28b31d15cd554d36f9b4ca65d8765366a5df`: root layout 787/787, v2 273/1 plus
  > all gates, one-attempt smoke 0/10, certifying glass 12/12 and 57/57 with empty
  > blocked/omitted ledgers and zero findings/instrument failures/retries, nine automated-only
  > personas, terminal-only performance and an Edge 151-smoked separate-origin preview with
  > `publishable:false`. Exact docs tip/upstream/check state is read live, and the selected pushed
  > tip requires matching green CI.
  > The existing local review artifacts are `publishable:false`; they do not authorize a v2
  > publication candidate. After matching CI is green and Nick explicitly approves a candidate,
  > package and publish that commit-bound candidate from the selected final pushed head at the
  > separate development origin, then complete and record a multi-lens human playtest against
  > it before marking a future PR Ready or merging. The static Platinum-reviewed portrait set is unchanged; later visual
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
