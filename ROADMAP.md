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
- Pushed branch baseline at this handoff's start:
  `fc10ed67fcf31ffeece09d8fd4239a07a0815108`. The current batch has intentional
  scoped working-copy changes and is not publication evidence until it is frozen in one
  clean pushed commit. Draft PR #11 is open at
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
portrait retains the trail, while short landscape also yields the trail and begins Planetside
below measured top chrome. Dock icons use the 42px client line inside their 44px target, and
A++ retains a larger toast-title tier. Training keeps its intentional layer choreography and locks keyboard
focus to the live lesson; ordinary panels remain above survey cards outside Training. Field
Training still implements the six current chart/travel/landing lessons plus an honest
graduation. The rest of the legacy 21-step arc, tooltip deep-links, and Advanced Briefings
remain open until their systems are live.

Evidence is now structured and provenance-bound:

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

Earlier incremental runs reached 24 Vitest files / 271 pass / 1 skip, both TypeScript
configs, the static art/route gates and targeted browser/performance checks. Source and test
edits continued afterward, so those runs are **not the final PR-head verdict**. Do not report
the batch green from this paragraph. On the post-policy dirty snapshot bound by working-tree
SHA-256 `88d1996909134596302a2f8558cef553220816ab48ee356f970132a5309f6293`, `smoke:ci`
passed with 0 findings and 10 screenshots; the full isolated `glassmatrix` passed all 12 viewports
including 8K with 0 findings, 0 instrument failures, 0 omitted planned controls and 0 retries;
and `persona:report` passed all 9 bounded automated personas. The 390×844 DPR-3 four-run
performance diagnostic passed at painted 658ms, answerable 734ms, press→panel 70ms and galaxy
rebuild 178ms. The exact-keepsake repair and documentation sync followed that snapshot. These are
pre-freeze diagnostics—not exact-commit evidence, matching CI, an
approved performance budget, or a human playtest. Before PR #11 can leave draft, the frozen
pushed head must receive one final sequential battery, clean diff/status review, and matching
GitHub CI evidence.
`overridecontrol` is exclusive and must not overlap any build/browser/evidence producer.

The exact-head order is: freeze the source in a commit; run the full local battery against that
commit; if it stays green, push it and require matching CI. A repair creates a new commit and
restarts that order. Do not cite a pre-commit working-tree run as final evidence. Because the new
manual preview workflow is not dispatchable until it exists on the default branch, PR #11's
pre-merge candidate must use the equivalent explicitly approved local packaging command recorded
in `port/DEVELOPMENT_PREVIEW.md`; the workflow becomes the normal path after the infrastructure
lands on `develop`.

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

**Current side:** OpenAI/Codex on macOS, branch `openai/mac` — this batch remains
uncommitted/unpushed at the handoff point recorded above. Draft PR #11 exists, but its current
remote head does not yet contain the complete working batch.

**GitHub step:** keep PR #11 draft. Freeze the scoped batch in a commit, run the final sequential
local battery on that exact commit, then push it and require matching CI. Update the PR body with
that exact head and results, build the approved
separate-origin preview, complete and record the human playtest, and resolve/retest findings.
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
  > the objective yields to Planetside; portrait retains the trail while short landscape yields it
  > and starts Planetside below measured top chrome. Adds provenance-bound
  > smoke, glass and automated-persona reports plus commit-bound development-preview packaging;
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
