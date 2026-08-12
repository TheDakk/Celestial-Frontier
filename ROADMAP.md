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
  `20896ad410b48ae0c407a9f3d6885d30ec6657b1`; its complete clean sequential
  battery passed. It underlies a docs-only handoff tip. Exact tip/upstream/
  CI state is live authority from `git rev-parse HEAD`,
  `git status --short --branch`, and PR #11 checks. Prior
  test-battery #201, run
  [`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
  job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
  remains preserved red without retry on the superseded `4560269` source. Test-battery #202,
  run [`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
  job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
  likewise remains preserved red without retry at pushed `93f75a93`; its only failure is the
  ambiguous desktop-8k serial readiness observer described below. Draft PR #11 is open at
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
Exactly one prior-context release, a changed top-frame-loader commit and one optional
`cf-v2-slice-ready/v1` event from the new default top context/session/generation/origin/loader/
token/URL must arrive inside the independent import/navigation/boot deadlines. The app emits that
tail event after load, persistence and complete slice/input wiring, at least one ticker turn, an
animation frame and a later task; its browser-native timestamp must itself be strictly below 20
seconds. One at-most-2-second command confirms the exact context. This means complete boot
publication plus a serviced turn, not the separate 50 ms answerability outcome.

The exact local review artifact is bound to the recommended separate origin
`https://dev-celestialfrontier.github.io`, but no preview host or publication is authorized or
present. Do not create a project path under `celestialfrontier.github.io`; it would share
production browser storage. No release, live deployment, `main` update, or version bump is part
of this batch.

### Evidence status and stop condition

GitHub test-battery #199, run `31571459050` / job `94034164092`, first exposed
the former desktop-8k reload ambiguity and small-phone Planetside/trail overlap.
Pushed commit `8b8a740286a56591cac9dc5734a2fba4c088939b` repairs both: import
settlement and replacement boot have separate observable 20-second phases and require a changed
top-frame loader plus document token; portrait Planetside retains a 72px useful/scrollable band
with 6px clearance and yields only the noninteractive trail when required. Their deliberate
failing controls and the exact sequential local battery passed.

Matching GitHub test-battery #200, run `31577395120` / job `94052496287`, then
passed every root, product and v2 gate, the single `smoke:ci` attempt, the complete
12-viewport matrix including 8K, the matching-provenance automated-persona synthesis,
and `preview:package`. Only the final `preview:smoke` browser startup failed. The
preceding evidence step pinned `/usr/bin/google-chrome` only in its own environment;
the next step/process did not inherit it, so the resolver selected Linux Edge at
`/opt/microsoft/msedge/microsoft-edge`. Edge never produced `DevToolsActivePort`, and
the check failed before it created a target or evaluated any packaged page. The trailing
D-Bus diagnostic is Edge/runner startup evidence, not a product or package finding.

Pushed commit `4d14a75e934536dc5f204e40c74f666cc9514df4` binds the exact Chrome
path at job scope in both CI workflows and resolves it fail-closed before the long battery, so
every browser-owning process has the same explicit provenance. Environment is per step/process; a
prior green browser step does not pin the next one. Retries, a longer startup bound, or clearing
D-Bus would not repair the #200 provenance defect.

Completed code/tool commit `08379d8c072c7eb22e2a029d666972c86d496326` removes the root layout
gate's remaining second launcher. It now
consumes `port/v2/tools/browserpath.mjs` plus `browsercdp.mjs`: browser-assigned port 0 through
`DevToolsActivePort`, exact executable/version provenance, early-exit and bounded stderr
diagnosis, bounded TERM→KILL cleanup, and validated profile removal. Its ignored report is
atomically replaced from `running` to terminal `pass`, `fail`, or `instrument-fail`; legacy
`results` remain. A full PASS must match the sealed v1.8.9 report's exact 787
`viewport/surface/name` inventory; targeted viewport runs remain scoped diagnostics. `--selftest`
seeds a stale PASS, forces exit 73 with a marker, proves current red replacement/wrong-run
rejection/cleanup, then removes one sealed outcome with internally consistent counts and requires
that plausible incomplete PASS to fail. CI assigns an exact id, runs selftest + gate +
`--verify-run=ID`, then uploads the report separately with missing evidence treated as an error.
Both root and v2 install surfaces now declare/lock the `ws` transport and supported Node lines
`^20.19.0 || ^22.13.0 || >=24.0.0`. Root preflight launches the selected executable through the
owned CDP probe; its selftest rejects executable non-browsers and excluded Node lines. `bootperf`
shares the executable resolver and `ws`, but explicitly retains its legacy CDP lifecycle.
The targeted lock refresh also moves root `undici` 7.27.2→7.29.0 and v2 `nanoid`
3.3.16→3.3.18 within existing ranges; clean `npm ci` on both install surfaces reports zero
vulnerabilities. These are tooling/dependency-evidence changes, not shipped runtime changes.
The original sandboxed Edge diagnostic ended in SIGABRT and remains red evidence; the separately
permitted mutable-tree 787/787 run remains only the diagnostic that preceded the clean commit.
Prior test-battery #201, run
[`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
remains preserved **RED** on pushed `4560269`, without retry. Every preceding root/product/v2 gate,
including `smoke:ci`, passed; only desktop-8k preference import instrument-failed after its former
20-second replacement wait while the old loader remained and its slice token/import phase were
absent. It was not a save rejection or reported repository-write failure.

Matching test-battery #202, run
[`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
completed once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
and is **RED**. Every preceding root/product/v2 gate and `smoke:ci` passed. Only
desktop-8k glass import/replacement instrument-failed when its first observer result arrived at
61.163 seconds. That loop serially awaited two frame-tree calls around an awaited Runtime call,
each with a 30-second command ceiling; #202 therefore proves observer ambiguity, not a 61-second
product boot, save rejection or product failure. Preserve it without retry or a timeout increase.

Immutable executable/evidence source `20896ad410b48ae0c407a9f3d6885d30ec6657b1`
contains and validates the completed two-sided repair:

- Product: Training restart, supported expedition import and the storage-health retry synchronously
  claim one mutually exclusive replacement transaction, then share one explicit code-owned reload
  path. It blocks ordinary persistence, removes renderer-density
  listeners, destroys Pixi with global/child texture resources, detaches its view, shrinks both
  application and backdrop canvases to at most 1×1, emits an optional CDP release witness, then
  crosses one task boundary before `location.reload()`. It is deliberately not a generic
  `pagehide` teardown, so browser-cache restoration cannot revive a destroyed application.
- Harness: sticky event receipts independently bound a 20-second import/release, 5-second changed-
  loader navigation commit and 20-second boot. Exactly one valid release witness must precede a
  ready event from the exact new default top context/session/loader/token/URL; its browser-native
  `performanceNow` must itself be below 20 seconds, and one at-most-2-second command confirms that
  context. Old-context loss alone is not navigation, and tail readiness is not the separate 50 ms
  answerability outcome. Bounded sticky Page/Runtime/Inspector/Network evidence diagnoses crash,
  unreachable navigation, replacement exception and fatal document load. Controls
  `replacement-document-loader-token-phase` and `reload-resource-release` reject stalled phases,
  just-late boundary transitions, same-loader mutation, premature context loss, duplicate/invalid release, retained canvases,
  unreleased renderer and over-budget backing pixels, with zero retries.

Its exact clean sequential battery passed:

- root preflight selftest and owned-CDP preflight passed, with only the expected Edge 151 versus
  pinned Edge 150 drift warning; validate passed with the baseline fingerprint and root smoke passed;
- certifying layout run `exact-20896ad-root-layout` passed all sealed 787/787 outcomes across 10/10
  viewports and exact-run verification passed;
- rarity completed 60M trials with 0 downgrades, and dead-code review found 3 tooling references;
- v2 passed 24 test files / 273 tests with 1 skip and every type, art, override, coverage, spec and
  instrument-selftest gate;
- one-attempt `smoke:ci` passed with 0 findings / 10 screenshots; smoke, glass and persona evidence
  share working-tree digest
  `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`;
- committed/certifying full glass passed 12/12 viewports and 50/50 controls with `omitted=[]`,
  0 findings, 0 instrument failures and 0 retries. All 12 reload
  witnesses passed; desktop-8k recorded both 5,461×3,072 canvases collapsing to 1×1, renderer/stage
  released, view detached, release→commit in 31 ms, commit→ready in 148 ms,
  `performanceNow` 177 ms, confirmation in 1 ms and 212 ms total. Across all viewports replacement
  totaled 170–212 ms and the maximum browser-native timestamp was 177 ms;
- all 9 bounded automated personas passed, still explicitly not a human playtest;
- the terminal-only 4× performance diagnostic recorded 586 ms painted / 666 ms answerable /
  77 ms press→panel / 151 ms rebuild; and
- exact 37-file preview `dev-preview-exact-20896ad` verified and browser-smoked PASS at 320×568
  for expected origin
  `https://dev-celestialfrontier.github.io`, content SHA-256
  `3a2e5285184cf392a10916270f5d3d449d72d78bb6afb0b6bd29d45d6b1a6b50`, with
  `publishable: false`.

`20896ad` underlies a docs-only handoff tip. Live Git/PR state decides its exact current
tip/upstream/check status; the final pushed tip requires matching green CI before preview/human
play may begin.

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
`20896ad410b48ae0c407a9f3d6885d30ec6657b1` is the immutable source for the complete clean
sequential battery recorded above and underlies a docs-only handoff tip. Resolve exact current
tip/upstream/check state live; prior #201 and #202 remain preserved red without retry.

**GitHub step:** keep PR #11 draft and preserve red #201 (`31586917924` / `94082765087`)
and #202 (`31594595288` / `94106996466`) without retry. Read `git rev-parse HEAD`,
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
  > context confirmation; no serial poll or retry owns the verdict. Adds provenance-bound
  > smoke, glass and automated-persona reports plus commit-bound development-preview packaging;
  > pins the CI browser at job scope so a later preview process cannot silently switch from Chrome
  > to Linux Edge when a preceding step's environment expires. Moves the root 10-viewport layout
  > gate onto the same owned port-0 CDP launcher and adds ignored atomic pass/fail/instrument-fail
  > evidence, stale-PASS/exit-73 selftest, exact-run freshness and a separate required CI upload;
  > automated personas are explicitly not a human playtest. Clean executable evidence is bound to
  > local commit `20896ad410b48ae0c407a9f3d6885d30ec6657b1`: root fingerprint/smoke/preflight
  > and sealed layout 787/787, v2 273 pass / 1 skip plus every gate/selftest, one-attempt smoke,
  > committed glass 12/12 with 50/50 controls, 12 valid replacement witnesses and 170–212 ms
  > replacement totals, nine automated personas, and exact 37-file preview verify/browser PASS.
  > Prior #201 (`31586917924` / `94082765087`) and #202
  > (`31594595288` / `94106996466`) remain preserved red without retry; #202 exposed serial CDP
  > observer latency rather than a proven product failure. Exact tip/upstream/check status is read
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
