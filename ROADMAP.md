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

## ▶▶▶ SESSION HANDOFF — 2026-08-14 · COMPLETE V2 PROGRAM ROADMAP CREATED; CLAUDE/CODEX REVIEW NEXT ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve current Git/PR/check/publication status live. Historical handoff/CI IDs are context, not
  an assertion about the current tip. Never copy files manually between agent worktrees.

### What changed in this planning batch

- Created [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md): the single operational map
  for all approved product Arcs 0–10, F1–F4 foundations, current continuity/deviation work,
  top-tier visual and audio production tracks, Gates A–I, human evidence and no-go rules.
- The plan incorporates the full-sweep findings and the shared Claude/handoff recommendations, but
  corrects two important sweep details: F2 canonical ingress moves ahead of content-scale work, and
  SessionRNG must inventory semantic call sites rather than mechanically grow `DOMAINS` to eleven.
- No product code, build artifact, version, release, deployment, or live-site state changed.

### Program order (planning baseline)

1. **F1a** save integrity; then independently reviewable **F1b** guardrails only where scoped.
2. **F2** canonical CF1 ingress + immutable NavState, then the remaining **Arc 0** continuity/current
   truth work (`tsnap`, CFB/import semantics, honest Guide/Training/tooltip work).
3. **Arc 1A** bounded Compendium thumbnails → **1B** scene texture/resource ownership → **1C**
   ShipVisualState, static Shipyard proof and owned HD planet attachment.
4. **F3** CAS/split stores/receipts/tab lease → **F4** active-play clock + SessionRNG.
5. The approved product ladder: **Arc 2** items/economy → **3** engineering → **4** capture →
   **4.5** first complete journey [HUMAN] → **5** companions → **5.5** combat decision [HUMAN] →
   **6** combat/Guardians → **7** audio foundation → **8** HD audio/content → **9** legacy/projects
   → **10** integration beta.

### Non-negotiable next-work constraints

- No world-bound ownership/reward/receipt writer before F2 canonical provenance.
- No instance/receipt/destructive mutation before F3 revision/CAS transactions.
- No new reward/readiness/extraction/mission loop on wall-clock time or bare `Math.random()` before
  F4; Reduced Motion must not slow progression.
- Do not treat static Platinum portrait delivery work as permission for a blanket repaint. Living
  rigs, 43 biome/universe scenes and full audio are dedicated quality tracks with Gate E/F/G human
  evidence.
- A dev-preview/green automation result never substitutes for current-truth, human review, a
  production release decision or `develop` → `main` approval.

### Next action

1. Have both Codex and Claude independently review `port/V2_PROGRAM_ROADMAP.md`, especially its
   sequencing, open-deviation ownership, visual/audio lane coverage and Gate A–I crosswalk.
2. Resolve any review disagreement in the roadmap document before starting implementation.
3. After the program map is accepted, scope **F1a only** as the first implementation PR. Do not
   begin Arc 1A or any content Arc merely because it now has a place in the program map.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`. The documentation-only complete V2 program
map is pushed for review in draft PR #23; product code is untouched. Verify the exact PR head and
check state live before any merge decision.

**GitHub step:** review draft PR #23 from `openai/mac` into `develop` for the planning-document
change only. Do not treat it as product/release authority; merge normally only after its required
documentation checks and both-agent review are satisfied.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Draft PR: https://github.com/TheDakk/Celestial-Frontier/pull/23
- Copy-ready title: `Add complete v2 program roadmap and refresh live handoff`
- Copy-ready description: `Adds the comprehensive planning-only V2 program map: F1–F4 foundations,
  Arc 0–10 delivery sequence, current continuity/deviation ownership, Gates A–I, and explicit
  premium visual/audio production tracks. It preserves the approved product contract, corrects the
  sweep’s F2 ordering and SessionRNG-domain interpretation, and refreshes the lean handoff. No
  product code, release/version change, deployment, manual Pages write, or develop-to-main merge is
  included. Review focus: all arcs have named dependencies/exit evidence; no content work bypasses
  identity, persistence, or time/RNG foundations; visual/audio quality remains human-gated.`

**Other side:** Anthropic/Claude Code does not have this planning-doc change until it reaches
`develop`. Claude should review the pushed draft PR or exact branch diff; do not copy files manually.
After merge, Claude’s next clean batch fetches `origin` and merges the current `origin/develop` into
its own agent branch. Nick does not need to open the other app until the draft is ready for review.

**Release status:** no release, deployment, version bump, `develop` → `main` merge, or manual site
write is part of this batch.
