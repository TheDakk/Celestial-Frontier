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
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · PR #14 BASELINE PUBLISHED; A NEW FOUNDATION DRAFT IN PROGRESS ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`; never commit directly to `develop` or
  `main`. Resolve HEAD, upstream, worktree and PR/check state live before any Git action.
- Integration baseline: PR #14 merged normally into `develop` at
  `7aa8d000c597957a9b5683ad3959a90c1170b352`; `openai/mac` was then
  fast-forwarded to that merge before the current scoped work began. The immutable
  PR/develop/publication evidence is recorded below. Resolve any later local or remote
  state live before acting.
- Standing proceed authority (Nick, 2026-08-13): once a scoped agent PR is clean,
  mergeable and terminal-green on its required battery, Codex or Claude Code may merge that
  exact head normally into `develop` and monitor the resulting push battery and mapped
  development publication without asking again. Stop for a changed head, red/unfinished
  check, conflict, force action, new destination/key, manual Pages write, `develop` →
  `main`, production version, release, or deployment decision.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `README.md` ·
  `tools/README.md` · `UI_PRESENTATION.md` · `RARITY_UNIVERSAL.md` ·
  `RARITY_AND_GRADES.md` · `FORGE_AND_DISCOVERY.md` ·
  `celestial-frontier-codebase-reference.md` · `port/DEVELOPMENT_PREVIEW.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` ·
  `port/HANDOFF_NEXT_SESSION.md`.

### Current batch contract

The two branch sites intentionally publish different products:

| Branch | Product | Destination |
| --- | --- | --- |
| `main` | immutable root v1.8.9 HTML | `https://celestialfrontier.github.io/` |
| `develop` | tested exact `port/v2` v2.0 development package | `https://dev-celestialfrontier.github.io/` |

Only a successful push-triggered battery may unlock its mapped publisher. The development
job builds from the exact commit archive, browser-smokes the candidate, and verifies the
full commit/tree/external input/lockfile/byte inventory, expected origin, runtime refusal,
noindex/robots policy, shared version record and packaged `version.json` before mirroring
it to the isolated development repository. Stale legacy destination bytes must be removed.
PR, manual-agent and failed-battery runs have no site-write authority.

The current work replaces the short generic v2 draft notes with **A New Foundation**, a
cumulative, categorized v2.0 development bulletin. It is an outcome map of the complete
implemented playtest slice, not a commit log or roadmap: mature category order, unique
nonempty bullets and honest current-slice limits are required, while an inapplicable empty
Balancing category and open mechanics are omitted. Static and real-browser controls must
prove the key rendered outcomes, a scroll-reachable final item, and unchanged shipped-
release state across open and reload.

**The bulletin is not live yet.** The development origin currently corresponds to PR #14
at `7aa8d000c597957a9b5683ad3959a90c1170b352`, whose source still carries the prior
`Celestial Frontier development` draft title. **Celestial Frontier v2.0 development**
remains the Guide/site build identity; **A New Foundation** is the bulletin title. The new
title and cumulative copy gain publication authority only after this separate batch merges,
its resulting `develop` push battery passes, and the mapped publisher succeeds.

The 56-release/398-bullet v1 archive stays immutable. `V2_CURRENT_RELEASE_VERSION` remains
`null`, the shipped-v2 list remains empty, and the draft cannot open the one-time update
popup, create `releasePending`, or mutate `rnSeen`. No production version is authorized.

The already-merged presentation outcomes remain part of the cumulative bulletin: player-
facing **Spectral class** rows are absent while internal seeded designation/color and real
stellar G/K/M/remnant identity remain; planets disclose no rarity before landing and a
plain grade afterward; desktop notifications, Settings and Records share the bottom-right
utility edge; and every panel or Survey card owns exactly one top-right Close action.

Player-facing copy, current system references, the codebase map, process laws, test controls,
ROADMAP and both-agent handoff must agree in this batch. Historical v1.8.9 facts, prior
runs and superseded handoffs remain history rather than being rewritten as live state.

### Terminal baseline — PR #14

- PR #14, `Record the successful v2.0 development publication`, used source head
  `0fd0d95465c51c684489db236777e19075cc3d9e` and merged normally into `develop`
  at `7aa8d000c597957a9b5683ad3959a90c1170b352`.
- Exact-head PR runs `31670346748` / job `94353480474` (branch flow) and
  `31670347810` / job `94353483495` (battery) completed green.
- The resulting `develop` push battery `31672208188` / job `94359033458`
  completed all **24/24** required steps green. Retained artifact IDs are
  `9170581190` (battery reports), `9170581559` (root layout), `9170582194`
  (v2 browser evidence), and `9170582819` (v2 development preview).
- Branch-site publisher `31673490816` completed successfully: development job
  `94362919537` published the mapped package and production job `94362919808` skipped.
- Development destination commit is
  `488e36fabd693b4fdef404ce0fe2d334ae093bce`; approved-candidate content
  SHA-256 is `90234b793f18e76040cecbfcba3185dbdfa30d2d4bff8c307182ce0251f05d11`.
  The publisher emits no artifact by design; its run/job and destination commit are
  the publication evidence.
- Published `version.json` identifies source commit
  `7aa8d000c597957a9b5683ad3959a90c1170b352` and build
  `develop-7aa8d000c597`. Production remains the unchanged root v1.8.9 build;
  no `develop` → `main` merge, production release or manual deployment occurred.

These immutable facts certify PR #14 only. They do not certify the current bulletin diff
or a future head. The development site is a public play surface and still does not prove
human play, release readiness or production authority. Human findings bind URL, full
commit, manifest content hash, device/browser lens, starting save, outcome and retest.

### Next implementation order

1. Finish the scoped **A New Foundation** source, semantic/static/browser controls and
   current-reference refresh; run the proportionate battery and diff-check.
2. Commit and push the exact `openai/mac` head, open its own PR to `develop`, and use the
   standing proceed rule only after that unchanged head is clean, mergeable and terminal-green.
3. Monitor the resulting `develop` battery and mapped development publication; record their
   exact source, run/job/artifact, destination and content evidence before calling it live.
4. Run and record multi-lens human play against that matching development package; resolve
   or explicitly disposition findings and retest affected gates.
5. Canonicalize the complete CF1 galaxy → star → planet hierarchy.
6. Restore imported legacy full-expedition `tsnap` before clearing it.
7. Decide and preserve CFB parent identity.
8. Complete live Field Training, tooltip deep-links and Advanced Briefings.
9. Virtualize the 1,500-row Compendium and bound/cancel thumbnail work.
10. Finish general Pixi canvas-texture ownership and add a travel-memory plateau gate.
11. Attach generated HD planet textures to the live sprite.
12. Persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy.
13. Close remaining Gate-B DOM/type boundaries and split-store/CAS persistence.
14. Advance Phase 5 living organism rigs/animation and Phase 6 biome/ecology scenes.

The sealed static portrait review remains accepted. Do not repaint it merely to create
activity; living rigs, biome scenes and actual human play are the higher-value visual work.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`. The integration and
last-published development baseline is merged PR #14 at
`7aa8d000c597957a9b5683ad3959a90c1170b352`. The **A New Foundation** batch is
scoped work on the agent branch and has no merge or publication authority yet. Resolve the
exact worktree, pushed head, PR and checks live before acting.

**GitHub step:** after the scoped gates and diff-check pass, commit and push the exact
`openai/mac` head and open a new PR to `develop`; do not append to or reuse PR #14.
If that unchanged PR head is clean, mergeable and terminal-green, standing authority covers
its normal merge and monitoring of the resulting push battery and mapped development
publication. A changed head requires its own terminal checks.

**PR details:** planned for this batch; replace with live PR metadata once opened.

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `Publish the cumulative v2.0 development bulletin`
- Copy-ready description:

  > Replaces the generic v2 draft notes with **A New Foundation**, a cumulative categorized
  > outcome map of the implemented playtest slice. Adds semantic and browser controls for
  > canonical sections, unique content, required player-visible outcomes, a reachable final
  > item, and unchanged `rnSeen` / `releasePending` state across open and reload. Refreshes
  > current references while preserving the immutable 56-release/398-bullet v1 archive,
  > `V2_CURRENT_RELEASE_VERSION === null`, the v2.0 development-only identity, and the
  > unchanged v1.8.9 production site.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not
need to be opened now. It must not copy or consume this unmerged work. At its next coding
batch, from a clean worktree, resolve `origin/develop`; after this batch merges it may use
`git fetch origin` followed by `git merge origin/develop`. If dirty, finish or commit its
own work first.

**Release status:** `develop` and the isolated development site remain published from
PR #14 source `7aa8d000c597957a9b5683ad3959a90c1170b352`, destination
`488e36fabd693b4fdef404ce0fe2d334ae093bce`, with content SHA-256
`90234b793f18e76040cecbfcba3185dbdfa30d2d4bff8c307182ce0251f05d11`.
**A New Foundation is not present there yet.** `main` and production remain unchanged at
v1.8.9. No production version, release, `develop` → `main` merge or manual deployment
is authorized by this batch.
