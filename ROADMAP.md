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
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · PR #13 MERGED; V2.0 DEVELOPMENT SITE LIVE ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`; never commit directly to `develop` or
  `main`. Resolve HEAD, upstream, worktree and PR/check state live before any Git action.
- Integration baseline: PR #13 merged normally into `develop` at
  `9f4b12dbfb0cb8ba38003a0b79391a954372df24`; `openai/mac` was then
  fast-forwarded clean to that merge. The immutable terminal evidence is recorded below.
  Resolve any later HEAD, upstream, PR and check state live before acting.
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

### Terminal outcome — PR #13

- PR #13's exact-head CI runs `31666746749` and `31666748103` completed green.
- The resulting `develop` push battery, run `31668275811` / job `94347481886`,
  completed all **24/24** required steps green. Its retained artifact IDs are
  `9169233822`, `9169234205`, `9169234724`, and `9169235308`.
- Branch-site publisher run `31669727316` completed successfully: development job
  `94351673977` published the mapped v2 package and the production job was skipped.
- The development destination commit is
  `4d0fc348661aebc39660407a946a4c3dfa1a8e03`; the approved-candidate content
  SHA-256 is `fab179e701a03b9659ab336bace0e91400ce496d374114c978dcc775448ebe32`.
  The publisher emits no artifact by design; its run/job record is the publication evidence.
- The live development Guide reports **v2.0 development** and the full source commit
  `9f4b12dbfb0cb8ba38003a0b79391a954372df24`; neither historical corner badge is present.
- Production remains the unchanged root v1.8.9 build. No `develop` → `main` merge,
  production release or manual deployment occurred.

These immutable run facts certify PR #13 only. Resolve subsequent Git, CI and hosted-build
state live rather than treating this block as a permanent “latest” claim. The development
site is a public play surface and still does not prove human play, release readiness or
production authority. Human findings bind URL, full commit, manifest content hash,
device/browser lens, starting save, outcome and retest.

### Next implementation order

1. Run and record multi-lens human play against the matching development package; resolve
   or explicitly disposition findings and retest affected gates.
2. Canonicalize the complete CF1 galaxy → star → planet hierarchy.
3. Restore imported legacy full-expedition `tsnap` before clearing it.
4. Decide and preserve CFB parent identity.
5. Complete live Field Training, tooltip deep-links and Advanced Briefings.
6. Virtualize the 1,500-row Compendium and bound/cancel thumbnail work.
7. Finish general Pixi canvas-texture ownership and add a travel-memory plateau gate.
8. Attach generated HD planet textures to the live sprite.
9. Persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy.
10. Close remaining Gate-B DOM/type boundaries and split-store/CAS persistence.
11. Advance Phase 5 living organism rigs/animation and Phase 6 biome/ecology scenes.

The sealed static portrait review remains accepted. Do not repaint it merely to create
activity; living rigs, biome scenes and actual human play are the higher-value visual work.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`. PR #13 merged
normally into `develop` at `9f4b12dbfb0cb8ba38003a0b79391a954372df24`;
the agent branch was then fast-forwarded clean to that merge. PR CI runs
`31666746749` and `31666748103`, the 24-step `develop` battery
`31668275811` / job `94347481886`, and development publisher
`31669727316` / job `94351673977` all completed successfully. Resolve
any state after this terminal record live.

**GitHub step:** none for PR #13; it is already merged. The mapped development
publication also completed. Any later scoped change—including a separately committed
terminal-doc refresh—still follows its own agent-branch → reviewed PR → `develop`
path and the standing green-head proceed rule; do not reuse PR #13 or infer a later
head's checks from these runs.

**PR details:** PR #13 is complete.

- Base branch: `develop`
- Source branch: `openai/mac`
- Title: `Publish the v2.0 development build and correct presentation regressions`
- Result: merged normally at `9f4b12dbfb0cb8ba38003a0b79391a954372df24`;
  no title or description update is pending.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`,
does not need to be opened now. Because PR #13 is in `develop`, it may synchronize
at its next coding batch from a clean worktree with `git fetch origin` followed by
`git merge origin/develop`. If dirty, finish or commit its own work first; do not
copy files manually.

**Release status:** `develop` and the isolated development site were updated by
the verified automatic path. Destination commit is
`4d0fc348661aebc39660407a946a4c3dfa1a8e03`; approved-candidate content
SHA-256 is `fab179e701a03b9659ab336bace0e91400ce496d374114c978dcc775448ebe32`.
The live Guide shows v2.0 plus full source commit
`9f4b12dbfb0cb8ba38003a0b79391a954372df24` with no corner badge.
`main` and the production site remain unchanged at v1.8.9. This was not a
production release or manual deployment.
