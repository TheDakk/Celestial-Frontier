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
- Current pushed PR head:
  `8b8a740286a56591cac9dc5734a2fba4c088939b`. Its exact local battery passed
  and it closes the product/instrument findings from test-battery #199. Matching
  test-battery #200, run `31577395120` / job `94052496287`, passed every root,
  product, v2, one-run smoke, complete 12-viewport glass, automated-persona and
  preview-package gate; only the final preview browser check failed before a page
  existed because its new workflow step lost the Chrome environment and selected
  Linux Edge. Local commit `4d14a75e934536dc5f204e40c74f666cc9514df4`
  pins browser provenance at job scope but is one unpushed commit ahead of that
  remote head. The follow-on root-layout launcher/report repair remains a mutable
  working batch and requires a new clean commit, exact-head battery, push and
  matching CI. Draft PR #11 is open at
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

The hosting choice is still pending. A preview must use a genuinely separate web origin:
either the recommended separate `dev-celestialfrontier` GitHub owner with its owner-site repo,
or an approved dedicated custom hostname. Do not create a project path under
`celestialfrontier.github.io`; it would share production browser storage. No preview host,
publication, release, live deployment, `main` update, or version bump is part of this batch.

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

Local commit `4d14a75e934536dc5f204e40c74f666cc9514df4` binds the exact Chrome
path at job scope in both CI workflows and resolves it fail-closed before the long battery, so
every browser-owning process has the same explicit provenance. It is not pushed. Environment is
per step/process; a prior green browser step does not pin the next one. Do not rerun the unchanged
red head, add a retry, lengthen the startup bound, or clear D-Bus merely to turn #200 green.

The current mutable follow-on removes the root layout gate's remaining second launcher. It now
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
The original sandboxed Edge diagnostic ended in SIGABRT and remains red evidence. A separately
permitted mutable-tree diagnostic completed 787/787 checks across 10 viewports; it is diagnostic,
not a post-change browser certification. This repair still needs a new clean commit, exact
sequential battery, clean review, push and matching GitHub CI. `overridecontrol` remains exclusive
and must not overlap any build/browser/evidence producer. Because the new manual preview workflow
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
6. Own/destroy Pixi canvas textures and add a travel-memory plateau gate.
7. Attach the generated HD planet texture to the live sprite.
8. Persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy.
9. Close the remaining literal Gate-B DOM/type boundaries and split-store/CAS persistence.
10. Advance Phase 5 living organism rigs/animation and Phase 6's 43 biome/ecology scenes.

The static flora/fauna/procedural portrait set remains covered by the sealed package-level
Platinum **PASS with optional polish only / APPROVE** review. Do not blanket-repaint it merely
to create activity. The higher-value visual ceiling is living rigs and biome scenes; actual
human play remains the judge of motion, readability, comfort and perceived quality.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac` — pushed head
`8b8a740286a56591cac9dc5734a2fba4c088939b` is product-, smoke-, full-glass-,
persona- and package-green locally and through GitHub test-battery #200. The only red
gate is the pre-page preview CDP startup caused by step-scoped browser provenance. Local
`4d14a75e934536dc5f204e40c74f666cc9514df4` contains the job-scoped Chrome repair but
is unpushed; root-layout launcher/report hardening is still uncommitted. Draft PR #11 exists,
but its remote head contains neither follow-on.

**GitHub step:** keep PR #11 draft. Freeze the root-layout repair in a new clean commit, run the
final sequential local battery on that exact commit, then push the local commits and require
matching CI; do not rerun or timeout-mask #200. Update the PR body with that exact head and results,
build the approved separate-origin preview, complete and record the human playtest, and
resolve/retest findings.
Only then may Nick click **Ready for review**, review the final diff/checks, and normally merge
into `develop`. Never auto-merge, squash/rebase, retarget `main`, or add this work to merged
PR #10.

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
  > vertically scrollable Planetside. The responsive gate observes import settlement and replacement
  > boot as separate 20-second phases and requires both loader and document token to change, with no
  > retry. Adds provenance-bound
  > smoke, glass and automated-persona reports plus commit-bound development-preview packaging;
  > pins the CI browser at job scope so a later preview process cannot silently switch from Chrome
  > to Linux Edge when a preceding step's environment expires. Moves the root 10-viewport layout
  > gate onto the same owned port-0 CDP launcher and adds ignored atomic pass/fail/instrument-fail
  > evidence, stale-PASS/exit-73 selftest, exact-run freshness and a separate required CI upload;
  > automated personas are explicitly not a human playtest. The preview requires a separately
  > approved origin, which has not been chosen or published. Final verification is publication-
  > contingent: freeze the final head in a commit, run the sequential local battery, then push
  > and require matching GitHub CI,
  > then complete and record a multi-lens human playtest against that exact preview before marking
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
