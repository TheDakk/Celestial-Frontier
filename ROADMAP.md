# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES · EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are
## the SOURCE OF TRUTH we pull from for a full-system review/edit later. RULE: whenever we change a
## system, update its doc IN THE SAME BATCH (and bump its "matches code as of" marker) — the same
## way we run validate and update this roadmap. A change isn't done until its markdown reflects it.
## Also keep celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable.
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · ARC 0 MERGED, GREEN, AND DEV-PUBLISHED; ARC 1 NEXT ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`. Never commit directly to `develop` or `main`.
- Local `openai/mac` and `origin/develop` are both
  `c5aadc8a08424ddfc919bc2e4489b79e0f25b076`; `origin/openai/mac` remains the merged PR head
  `e9bb20f08e14e56f2cabeb36cd4827c107ac906d`. Resolve live branch, worktree, upstream and
  workflow state before a new batch; do not treat this terminal record as authority to alter a branch.
- Arc 0 PR [#18](https://github.com/TheDakk/Celestial-Frontier/pull/18) finished normally into
  `develop`. Its final PR head was `e9bb20f08e14e56f2cabeb36cd4827c107ac906d`; merge
  `c5aadc8a08424ddfc919bc2e4489b79e0f25b076` has parents
  `f780d15349bc20bc222e920a020c72e3b96cabdd` and
  `e9bb20f08e14e56f2cabeb36cd4827c107ac906d`, with tree
  `e3b36e4f6a44ac2e74a95d0e7483c99ed81caea`.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` ·
  `QUESTS_AND_CHAPTERS.md` · `PROGRESSION.md` · `UI_PRESENTATION.md` ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `celestial-frontier-codebase-reference.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/HANDOFF_NEXT_SESSION.md`.

### Terminal Arc 0 integration and mapped publication evidence

| Stage | Exact terminal evidence |
| --- | --- |
| PR branch-flow | Run `31717086739`, job `94504420311` — **success**. |
| PR test battery | Run `31717089096`, job `94504427844` — **success**. |
| `develop` push battery | Run `31720030810`, job `94514394878` — **success**. |
| Mapped publisher | Run `31722287785`: development job `94521949660` — **success**; production job `94521950228` — **skipped**. |

The mapped DEV origin is live at `https://dev-celestialfrontier.github.io/` as **v2.0
development** build `develop-c5aadc8a0842`, sourced from
`c5aadc8a08424ddfc919bc2e4489b79e0f25b076`, with `publishable: true` and content SHA-256
`8bd6c26c86ffac287797fe4112d86052b71437e8155770a72907a6bb06dc91ff`.
This is a noindex development play surface, not a release or production authority. Production
was untouched: the production publisher job skipped; no `develop` → `main` merge, production
version bump, release, manual deploy or direct site write occurred.

### Arc 0 shipped slice truth

- Charter presentation is a pure, stage-aware landfall-only projection over preserved legacy
  Charter data. It exposes only current writable landfalls, maintains compatible saved progress,
  gives terminal veterans an honest Charter record, and never invents a drive, reach tier,
  Shipyard or unported action.
- `resolveCF1WorldAddress` source-derives and proves CF1 galaxy → star → planet identity, including
  generated display metadata. Planet navigation/re-share adopts returned values; injected
  presentation fields cannot become canonical.
- Raw external CF1 `t:'p'` Search is strict before tolerant decoding: exact finite two-decimal
  coordinates, exact uint32 seeds, and the 8,192-character raw cap all reject before navigation
  or persistence. Focused evidence covers forged parent, fractional identity and injected-size
  controls.

### Deliberate remaining boundary

`D-CF1-2` is partial, not closed. Saved-view boot and persisted Atlas bytes may be repaired before
their later canonical surface navigation; galaxy/star CF1 routes, generated descents and every
future ownership/reward/receipt writer still need their own strict, source-derived ingress proof.
No public world payload becomes authoritative merely because Arc 0 passed.

### Next order

1. Begin Arc 1 only from a clean, live-verified agent branch: Compendium virtualization/resource
   ownership and pure reach-shared `ShipVisualState`.
2. Extend the CF1 proof boundary before adding any world-bound ownership or receipt writer.
3. Keep broader item/economy, engineering, capture, companions, combat, audio, legacy and human-play
   work behind their own real-action and outcome proof. Do not expand Charter copy beyond live actions.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS — Arc 0 is merged at
`c5aadc8a08424ddfc919bc2e4489b79e0f25b076`; local `openai/mac` equals `origin/develop`.
This terminal-doc update is not yet committed or pushed.

**GitHub step:** none for Arc 0. Its PR and required `develop` battery are terminal-green and its
mapped DEV publication is terminal-success. A future scoped agent branch still follows the normal
draft PR → `develop` path.

**PR details:** not needed now. Completed PR #18 used base `develop`, source `openai/mac`, title
`Make Charter goals actionable and canonicalize planet-share Search`; it included no release or
production deployment.

**Other side:** Anthropic/Claude Code on Windows does not need to be opened now. Before its next
coding batch, ensure its worktree is clean, fetch `origin`, inspect status, then merge the current
`origin/develop` into `anthropic/windows`; do not copy files manually.

**Release status:** `develop` and its isolated DEV play surface now carry the verified Arc 0 build.
`main` and production are untouched. No production release, deployment or version bump occurred.
