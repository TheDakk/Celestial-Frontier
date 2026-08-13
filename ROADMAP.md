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
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · V2.0 DEVELOPMENT SITE + PRESENTATION CORRECTIONS ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`; never commit directly to `develop` or
  `main`. Resolve HEAD, upstream, worktree and PR/check state live before any Git action.
- Integration baseline: PR #11 is merged into `develop`. Historical CI, exact commits and
  preview hashes from that arc are preserved newest-first in `ROADMAP_ARCHIVE.md` and the
  historical sections of the port references; they are not current-tip authority.
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

**v2.0 is development identity only.** The Guide shows **Celestial Frontier v2.0
development** plus the full source commit. There is no floating upper-right or lower-right
DEV badge. The 56-release/398-bullet v1 archive stays immutable;
`V2_CURRENT_RELEASE_VERSION` remains `null`, the shipped-v2 list remains empty, and the
v2.0 bulletin cannot open the production update popup or mutate `rnSeen`.

The player-facing **Spectral class** survey row is retired. The deterministic lifted
descriptor remains unchanged internally: `spectral()`, `.designation`, seeded color
words and art hues still serve parity and presentation data, and real stellar G/K/M/
remnant classification remains astronomical identity. A planet reveals no rarity before a
successful landing; afterward its card uses only the plain ten-tier grade name. Tests must
prove both directions—no visible legacy/pre-land leak and unchanged internal designation.

The UI correction shares one glass geometry:

- desktop notifications rise from the bottom-right utility edge above the measured dock;
- Settings and Records open at that same bottom-right anchor;
- every panel and Survey card owns exactly one 44px top-right Close action;
- refill cannot duplicate a Close action, and no Close action may detach to the upper-left;
- balanced padding, row dividers, corner radii, inset borders and symmetric spacing apply
  across the affected surfaces.

Player-facing Guide and v2 draft-release copy, current system references, publisher/preview
process references, codebase map, and both agent handoffs must agree with those outcomes in
the same batch. Historical v1.8.9 facts, old red runs and old preview artifacts remain
history; current references do not repeat them as live state.

### Evidence and stop condition

Do not infer a green batch from the presence of edits or from prior PR #11 evidence. Resolve
the exact final head and run the checks owned by the changed source/tests. At minimum the
completed implementation needs:

1. publisher and preview selftests, including rejection of legacy/unapproved packages,
   cross-channel identity, stale destination bytes, and both historical corner badges;
2. v2 unit tests and both TypeScript programs, with release tests proving v2.0 development
   identity while `V2_CURRENT_RELEASE_VERSION === null`;
3. one-run real-browser slice smoke proving Guide version/full-commit identity, no corner
   badge, no visible Spectral row, pre-/post-land rarity behavior, bottom-right utilities
   and exactly one correctly placed Close action;
4. the responsive glass matrix at its required viewport inventory, including deliberate
   failures for left-side toast/settings placement and duplicate/detached Close controls,
   plus positive balanced-spacing/border and pre-/post-land rarity outcomes;
5. the exact branch push battery and mapped development publication, monitored without
   retrying a red result.

The documentation lane does not run browsers or certify source/tests. Final check counts,
commit, CI and hosted-build identity belong in the PR/check records derived from the exact
final head, not as self-staling “latest” claims here. A published development site is a
public play surface and still does not prove human play, release readiness or production
authority. Human findings bind URL, full commit, manifest content hash, device/browser
lens, starting save, outcome and retest.

### Next implementation order

1. Complete and freeze this publisher/version/Spectral/UI correction with exact tests,
   negative controls, terminal-green CI and verified development-site identity.
2. Run and record multi-lens human play against the matching development package; resolve
   or explicitly disposition findings and retest affected gates.
3. Canonicalize the complete CF1 galaxy → star → planet hierarchy.
4. Restore imported legacy full-expedition `tsnap` before clearing it.
5. Decide and preserve CFB parent identity.
6. Complete live Field Training, tooltip deep-links and Advanced Briefings.
7. Virtualize the 1,500-row Compendium and bound/cancel thumbnail work.
8. Finish general Pixi canvas-texture ownership and add a travel-memory plateau gate.
9. Attach generated HD planet textures to the live sprite.
10. Persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy.
11. Close remaining Gate-B DOM/type boundaries and split-store/CAS persistence.
12. Advance Phase 5 living organism rigs/animation and Phase 6 biome/ecology scenes.

The sealed static portrait review remains accepted. Do not repaint it merely to create
activity; living rigs, biome scenes and actual human play are the higher-value visual work.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`. Resolve the exact HEAD,
worktree/upstream relation, scoped diff and completed checks live. The current batch covers
the v2.0 exact-package publisher, Guide-only build identity, Spectral presentation boundary,
bottom-right utilities, single-close ownership, tests and synchronized references.

**GitHub step:** after the exact final head is committed and pushed and its required battery
is terminal-green, create or update the reviewed PR into `develop`. Under Nick's standing
authorization, merge that same clean/mergeable green head normally and monitor the resulting
`develop` push battery and development publication; no repeat proceed prompt is needed.
Never bypass a changed/red head or expand into `main`/production authority.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Title: `Publish the v2.0 development build and correct presentation regressions`
- Copy-ready description:

  > Publishes the tested exact `port/v2` package from successful `develop` push batteries
  > while preserving the root v1.8.9 HTML on `main`. Centralizes the v2.0 development
  > identity, shows v2.0 plus the full commit inside the Guide only, removes both corner
  > DEV-badge paths, and retains the exact-origin, noindex/robots, archive-input, manifest,
  > byte-inventory and site `version.json` guards. Keeps
  > `V2_CURRENT_RELEASE_VERSION` null, the shipped-v2 list empty, and legacy v1.8.9
  > history immutable, so the development bulletin cannot trigger the production update
  > popup. Removes the player-facing Spectral-class survey row without changing
  > deterministic spectral art data or real stellar classification; planet rarity stays
  > hidden until landing and then uses the plain display grade. Moves desktop
  > notifications, Settings and Records to the bottom-right utility edge, gives every
  > panel and Survey card exactly one top-right Close action, and regularizes spacing,
  > dividers and borders. Updates current process, preview, UI, rarity, codebase and
  > handoff references while preserving historical evidence. Verification must be filled
  > from the exact final head and include publisher/preview selftests, unit/type checks,
  > one-run browser smoke and the responsive matrix with deliberate negative controls.
  > After merge, the other agent synchronizes only from `origin/develop` in a clean
  > worktree. No `main` merge, production release or manual deployment is included.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not
need to be opened now and does not have this batch before merge. It may continue unrelated
work but must not copy files manually. After the PR merges, at its next coding batch and
from a clean worktree, run `git fetch origin` then `git merge origin/develop`; if dirty,
finish or commit its own work before pulling or merging.

**Release status:** resolve PR, `develop`, CI and hosted-build state live before reporting
them. v2.0 remains a development identity; `main`, the production site and any production
release remain unchanged unless separately authorized and verified.
