# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-06 · U1 IMPLEMENTED / VERIFICATION STOPPED / REVIEW HANDOFF

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
openai/mac, upstream origin/openai/mac. SSH origin git@github.com:TheDakk/Celestial-Frontier.git;
TheDakk authentication/read/fetch passed in this uninterrupted session. Develop c1791e2 is an
ancestor. Signed source `08cd97d79b67cab4b8d19bfd493293e997dec528`; product last changed at `7bff7967fef6b6d6f6b99480098a92c8501da994`.
The signed records successor carries this handoff for an authorized normal branch push; exact
pushed SHA is reported separately. Root main.js absent; ambient .DS_Store untracked/untouched.
No other worktree edited. Develop/main/live unchanged by this revision.

### Result and exact blocker

Fresh checkout: typecheck/artunused PASS; Vitest 311 files / 3,319 passed / 1 skipped; Glass
selftest and normal build PASS. Normal UI review RED before the first phone Notifications press:
Training Skip at 785ms, native Escape ascent to Cosmos at 1313ms, then spontaneous Milky Way at 3930ms
without an intervening recorded pointer event. The press was never dispatched. The earlier
6a88f85 navigation observation has recurred; cause is not repaired. Slice and both phone rows
were NOT RUN after that red. The new Settings browser probe was not reached. No unchanged retry.

Exact manifest `audits/UI_U1_PRODUCTION_LAYOUT_08cd97d_20260906/manifest.json`;
SHA256 `70beb0cd37953e2c5b4e6f53069843caa5800406564d5ca72bbdc7dd09285129`. All retained carrier hashes verified.
Report: audits/UI_U1_PRODUCTION_LAYOUT_20260906.md. This is not a complete U1 PASS, certification,
physical-device result or human acceptance. Claude should inspect this source and trace first.
Earlier nine-image 9c869c3 review is labelled previous-source visual evidence, not current proof.
The current phone capture may span the scene transition. All failed sources remain retained.

### Current implementation and remaining program

Production CSS is verified against live v1.8.9. Phone icon-only boards retain Prime N/9; wide
screens have native side controls, Prime top-center, right Search/Objective/Atlas/Shipyard and
bottom-right utilities. Name-only Inventory wraps, Health keeps red heart/caption/ratio, top
chrome is rounded, hint plain text and canonical trail hidden. Targets/gaps, native action/focus,
original pinch and 72px roster protections remain. The body-class observer corrects final header
height after same-task Settings changes; real-MutationObserver/disposal tests pass. Three visible
rail button types are explicit. No main.ts/navigation/save/domain or art/audio changes in this
screenshot revision. Existing saved-notification state was implemented earlier in U1.

Current references: UI_PRESENTATION.md, celestial-frontier-codebase-reference.md,
port/UI_PARITY_PROGRAM_U1_U4.md and port/V2_PROGRAM_ROADMAP.md. U1 visual acceptance remains with
Nick; U2–U4 and Phase 2 remain unstarted. U2 must reconcile Settings-above-Training with the pasted
opposite ordering before implementation. U3 refines panel presentation and provides an emoji/SVG
study within the approved layout; no icon swap until approved. Wide pill widths and the earlier
2px phone sheet-edge exposure remain visual review items.

Batches B–D already have audiovisual candidates; do not restart Batch A. Latest refinement
source preservation CLOSED, integrated pilot UNAPPROVED, all eight anatomical animations
INCOMPLETE with protected static fallbacks. Matched listening, physical iPhone/Safari/PWA proof
and 256 MiB retained-update enforcement remain open; the 128 MiB single-pack admission exists.
Read audits/AAA_PILOT_REFINEMENT_20260905.md, AAA_GAP_AUDIT.md, AAA_COVERAGE_LEDGER.md and
port/AAA_ASSET_POLICY.md when resuming that lane. No new backup/device/art acceptance here.

Producer `891dd62c0bd5bf4aa30cd9d1d2ddce4a7076ee20dfb04cc1eb8ce4eb22026fcf`;
measurement `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`, ruler/ceilings/history unchanged.
Draft 81 bullets, authority 073e0c972fb6e544b30cd3cc1c8fb1daebcb9216788c763681f380c1723195cb.

### Paired next steps and boundaries

- Codex: sign/push the records checkpoint through the normal openai/mac branch path, then
  resume from audits/UI_U1_NEW_CODEX_SESSION_20260906.md with Claude's review and Nick's feedback.
  No automatic broad navigation rework or U2 start; diagnose the exact recorded blocker first.
- Claude: Nick can open Claude now and paste audits/UI_U1_CLAUDE_REVIEW_PROMPT_20260906.md.
  Read-only review from its own anthropic checkout, preserve its local work, fetch/read the
  openai/mac checkpoint without merging/copying. No duplicate full battery by default.
- Nick: obtain Claude's findings, then paste them alongside the resume prompt in a new Codex
  session. No PR or GitHub action now. Future integration needs a scoped agent PR into develop
  and exact hosted authorization; no main/release approval is implied.

Budget UNFROZEN, PUBLIC per last verification, private fallback 3000. Zero hosted attempts,
labels, PRs, merges, purchases, releases or deployments authorized. Normal openai/mac branch
push triggers nothing (0 hosted minutes). Workflows/Actions policy, packages, sealed measurement,
artlock/protected portraits and legacy import boundary unchanged. Preserve anthropic/mac and
its unmerged 173c806. Terminal-only privacy and isolated owned headless browser rule persist.
Maintenance receipt reused during this uninterrupted session; a fresh coding session checks
approved tooling anew under UI_TOOLCHAIN.md and nick-game-toolchain skill before code/build work.
Artlock CI lane, ITP save protection and DECISIONS row 19 wording stay open.
