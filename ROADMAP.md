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
## roadmap stays a one-screen read. History is one file away, git-diffable. (Split first done 2026-07-21
## when this crossed ~285KB / 4,272 lines and stopped reading in one pass.)

## ▶▶▶ SESSION HANDOFF — 2026-08-11 · DRAFT PR #11: V2 HARDENING + PLAYER-GUIDE/DOC PARITY ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: /Users/nick/Projects/celestial-frontier-openai-mac
## Owner/branch: OpenAI/Codex on `openai/mac`. PR #10 merged normally into `develop`; the clean
## integration baseline is `61cc058abca0b37dcd5f44ff11012bf8b8dea4c9`. The exact Platinum
## repair archive/review remains sealed at source `03ea297e4f8ec61461310b0312a7363027ce90e3`:
## 2,163 PNGs, ZIP SHA-256 `ef7a6e9bb720ab6e6e1497569ade194b471ed7ab63449ee94ea5c94c57372f4b`,
## and external **PASS with optional polish only / APPROVE** review SHA-256
## `1c6c49e74270e9c69800de5b10b031aacf73a7a30937350086e97bc712823b3f`. Its embedded
## `CURRENT_ONLY / UNREVIEWED / NOT_CERTIFIED` fields are immutable preparation metadata; the human
## PASS is a separate package-level judgment, not formal 1,250-row certification. Do not blanket-
## repaint the flora/fauna/procedural portrait set covered by that package-level PASS merely to
## create activity. The optional watchlist is
## equid stiffness, Colugo geometry, Eagle sharpness and conservative low-anchor plant/fungus drift.
## The higher-value graphics work is Phase 5 living rigs/animation and Phase 6's 43 biome scenes.
##
## The current `openai/mac` batch audits and hardens the already-ported v2 slice. It repairs sparse/
## future-save overwrite paths and IndexedDB retry; bounds hostile cosmic epochs; validates Atlas
## identities; prevents repeated landfall credit, composite-identity stale-card actions and external-code landing
## bypass; restores named-world CF1 round trips; fixes lazy-art subscriber races and port-authored
## declaration drift; strengthens SessionRNG; makes the phone dock a measured 4×2 geometry contract;
## enables Pixi `autoDensity` and fixes the DPR backing-canvas/CSS-size mismatch that halved phone hit coordinates;
## makes survey-first descent use an explicit mobile-safe card action instead of a covered body or timing window;
## makes browser smoke/perf portable and fail closed; adds core v2 test/type/art/browser-smoke gates
## to CI; and makes the app's own TypeScript config part of `npm run typecheck`. Current
## browser proof covers desktop pointer and real 390×844 touch entry into the exact Milky Way node,
## the actual Sol sprite, a real stage-0 non-Sol Charter rejection, and stage-2 entry into a
## deterministic visible fine star; seed+x+y identity, the former DPR-sized CSS canvas, and buried
## travel actions are all outcome-checked.
##
## The same PR now closes the live-slice player-copy gap instead of leaving the new controls only in
## developer Markdown. The eighth phone-dock slot opens a bounded seven-topic v2 field manual; save
## import moves to Settings → Save data → Bring expedition, preserving the measured 4×2 dock.
## The manual covers survey/Enter actions, guarded Land and explicit minimum-44px Leave, Atlas/CF1,
## Charter reach, Compendium/Records, Field Training restart, and protected saves. Training copy is
## label-neutral for fresh `+ Add` versus veteran `★ Confirm`, returns planet entry to the real system
## survey, and teaches Land rather than a nonexistent planet-zoom step. Browser smoke proves every
## guide topic, immediate IndexedDB+reload persistence of `seenGuide`, a focus-trapped top-layer
## import modal, exact copy/action alignment, an 8px Guide/dock clearance, and real 390×844 touch
## Earth Land→Leave→system plus one-Escape lift-off. Missing-topic, stale-copy, old-max-height
## Guide/dock-overlap, Guide-behind-card, low-z modal, and missing/buried-Leave controls all fail closed; a same-seed/
## different-coordinate system cannot reuse the old planet card for Land, Atlas or Share.
## This is honest CURRENT-SLICE guidance, not full legacy parity: the searchable legacy Guide
## (43 authored topics, 41 currently live),
## tooltip deep-links/advanced briefings, the full 21-step Training arc (v2 currently has six real
## lessons plus an honest graduation), and release/update-modal/version machinery remain Phase 4 work.
## verification: Vitest 23 files / 257 pass / 1 skip; both TypeScript configs; artunused;
## artaudit 23/0; coveragegap 1,010/1,010; speccheck
## 454/0/0; overridecheck 1,014/1,014 routes +1,010/1,010 species and controls through CV;
## hybrid browser guard with 14 injected regressions; hybridmatrix/currentreviewpackage/browser
## selftests; real browser slice smoke; and the portable phone performance profile are green.
##
## NEXT after this batch: keep the bounded field manual, contextual hints and Training copy synchronized
## in every player-facing batch; port the full Guide/tooltips/briefings/21-step Training/release surface
## as their live systems arrive, never by advertising dormant v1 mechanics. Technical order: (1)
## canonicalize the complete CF1 galaxy→star→planet hierarchy; (2) restore imported legacy full-
## expedition `tsnap` before clearing it; (3) decide/fix CFB parent preservation because parent loss
## changes hybrid combat identity; (4) virtualize the 1,500-row Compendium and make thumbnail work
## bounded/cancellable; (5) own/destroy Pixi canvas textures and add a travel-memory plateau gate;
## (6) attach the generated HD planet texture to the live sprite; (7) persist/invalidate on epoch
## edges and settle hidden-tab/reduced-motion policy; (8) close the remaining literal Gate-B DOM/type
## boundaries and split-store/CAS persistence; then advance living organism rigs and biome/ecology
## presentation. Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md · README.md · port/v2/README.md ·
## port/v2/DEVIATIONS.md · SAVE_SYSTEM.md · UI_PRESENTATION.md · QUESTS_AND_CHAPTERS.md ·
## BREEDING_AND_SHARING.md · LINEAGE_AND_BREEDING.md · ART_DIRECTION.md · PROGRESSION.md ·
## port/HANDOFF_NEXT_SESSION.md.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex on macOS, branch `openai/mac`. PR #10 merged normally into `develop`
## at `61cc058abca0b37dcd5f44ff11012bf8b8dea4c9`; draft PR #11 is already open at
## https://github.com/TheDakk/Celestial-Frontier/pull/11. This batch's Git authority is the latest
## pushed `openai/mac` commit carrying the files described here; the working copy may be ahead only
## while publication is in progress.
## GitHub step: draft PR #11 (https://github.com/TheDakk/Celestial-Frontier/pull/11) is the separate
## integration vehicle. After each pushed follow-up, OpenAI/Codex keeps its body synchronized with the
## copy-ready description below. Nick then reviews its checks and diff, clicks **Ready for review**, and
## uses the normal merge into `develop` only when satisfied. Never add this batch to merged PR #10,
## auto-merge it, squash/rebase it, or target `main`.
## PR details: base `develop`; source `openai/mac`; title `Harden v2 persistence, navigation, mobile UI, and CI`;
## description `Audits and hardens the already-ported v2 slice. Protects sparse/corrupt and newer saves;
## restores IndexedDB retries; bounds hostile epoch input; validates Atlas routes; prevents duplicate
## landfall credit, composite-identity stale-card actions, external-code landing bypass and named-world share loss; fixes
## lazy species-art races and TypeScript declaration drift; hardens SessionRNG; and makes the phone dock
## a measured 4x2 non-overlap contract. Enables Pixi autoDensity so the DPR-scaled backing store retains
## a viewport-sized CSS box and logical pointer coordinates agree. Replaces timing-sensitive second-tap
## descent with minimum-44px Enter galaxy / Enter system survey-card actions. Adds a dock-accessible
## seven-topic v2 field manual for the current live-slice flow; moves save import to Settings > Save data >
## Bring expedition so the dock stays 4x2; aligns Training copy with fresh/veteran Atlas labels and the
## real system-survey > Land flow; and adds a visible minimum-44px Leave world action. Real-browser smoke
## proves desktop galaxy navigation and exact base-Sol identity {seed:424242,x:560,y:170}, real 390×844
## touch galaxy navigation, Land > Leave > system plus one-Escape lift-off, all required Guide topics
## plus immediate IndexedDB+reload persisted seen state and 8px dock clearance, a focus-trapped top-layer
## Settings import, same-seed/different-coordinate stale planet actions rejected, a real stage-0 fine-star
## action rejected by the Charter gate, stage-2 success
## preserving the touched target's exact {seed,x,y}, and visible byte-preserving protected-save notices;
## injected stale-document, fixed-wait, DPR-sized-canvas, hidden-notice, missing-topic, stale-copy,
## Guide/dock-overlap, Guide/card layering, low-z modal, same-seed card, click-through and missing/buried-action regressions fail. Ports the browser
## smoke/perf harnesses and adds core v2
## test/type/art/browser-smoke gates to CI. Refreshes the project landing page, current system references,
## Guide/Training contract, test counts and operational commands; the full searchable legacy Guide,
## tooltip deep-links/advanced briefings, full 21-step Training and release/update machinery remain open.
## The static flora/fauna/procedural pixel set covered by the package-level Platinum PASS remains unchanged
## except for a type-only art correction with identical runtime value. Verification includes 23-file
## Vitest (257 pass /1 skip), both TypeScript configs, artunused/artaudit/coverage/speccheck/override
## controls, hybrid/current-review/browser selftests, real-browser smoke/perf, and diff-check. Remaining
## canonical CF1 hierarchy, legacy full-expedition tutorial snapshot restore, CFB parent preservation,
## Compendium virtualization, Pixi texture lifecycle, HD planet replacement, epoch-edge/visibility policy,
## living rigs and biome scenes are explicitly deferred. After merge, Anthropic/Claude Code synchronizes
## only from a clean anthropic/windows worktree with git fetch origin then git merge origin/develop. No
## release, deployment, certification, main change, live-site change, or version bump is included.`
## Other side: Anthropic/Claude Code on Windows, branch anthropic/windows, need not be opened now.
## It does not have this batch until that draft PR merges. At its next coding batch after the merge,
## and only from a clean worktree, run `git fetch origin` then `git merge origin/develop`; if dirty,
## do not pull/switch/merge first, and never copy files manually between worktrees.
## Release status: PR #11 is open, draft, unmerged. `develop` remains at merged PR #10 (`61cc058`)
## and receives this batch only through a reviewed normal merge of PR #11. `main` and the live site
## are unchanged. No release, deployment, certification, or version bump is included.
