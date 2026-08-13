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
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · PR #15 MERGED; A NEW FOUNDATION LIVE ON DEVELOPMENT ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`; never commit directly to `develop` or
  `main`. Resolve HEAD, upstream, worktree and PR/check state live before any Git action.
- Integration baseline: PR #15 merged normally into `develop` at
  `c4a0258c981bba557be0d5df135b7006071bc065`; its tree is
  `f0af4fec833dfc5567ae845c39d9c9031193e4f9`, equal to the exact PR head and
  tested synthetic merge trees. The mapped development publication completed. This
  documentation-only terminal record begins from PR head
  `6fad35d0eeb023baec23e27efaf357f86cd06e9b`; resolve all later state live.
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

### Current development publication

The branch sites intentionally publish different products:

| Branch | Product | Destination |
| --- | --- | --- |
| `main` | immutable root v1.8.9 HTML | `https://celestialfrontier.github.io/` |
| `develop` | tested exact `port/v2` v2.0 development package | `https://dev-celestialfrontier.github.io/` |

Only a successful push-triggered battery may unlock its mapped publisher. PR, manual-agent
and failed-battery runs have no site-write authority. The development job builds from the
exact commit archive, browser-smokes the candidate, and verifies its source inputs, byte
inventory, origin refusal, noindex policy and shared version record before publication.

At the verified PR #15 terminal observation, **A New Foundation is live on the development
origin.** It is the cumulative v2.0 draft bulletin: five canonical categories and 43
unique, nonempty implemented-outcome bullets,
including honest current-slice limits and no empty Balancing category. Static, slice-smoke
and responsive-browser controls guard its order, inventory, key rendered outcomes,
scroll-reachable tail, and unchanged release state under deliberate failures.

**Celestial Frontier v2.0 development** remains the Guide/site build identity; **A New
Foundation** is the bulletin title. `V2_CURRENT_RELEASE_VERSION` remains `null`, the
shipped-v2 list remains empty, and the draft cannot open the one-time update popup, create
`releasePending`, or mutate `rnSeen`. The 56-release/398-bullet v1 archive stays immutable.
This is a development publication, not a production version or release.

The bulletin includes the current presentation outcomes: no player-facing **Spectral
class** row while internal seeded designation/color and real stellar G/K/M/remnant identity
remain; no planet rarity before landing and a plain grade afterward; bottom-right desktop
notifications, Settings and Records; and exactly one top-right Close action per panel or
Survey card. Automated evidence still does not substitute for human play.

### Terminal outcome — PR #15 and mapped publication

- PR #15, `Publish the cumulative v2.0 development bulletin`, used exact head
  `6fad35d0eeb023baec23e27efaf357f86cd06e9b` with tree
  `f0af4fec833dfc5567ae845c39d9c9031193e4f9`.
- PR branch-flow run `31677782054` / job `94376069038` and battery run
  `31677784412` / job `94376076373` completed attempt 1 green. The battery executed
  synthetic merge `2694c2adebe88c12e5319af77f44f02ae633fd0c`; its tree was equal to
  the exact PR-head tree.
- PR #15 merged normally into `develop` at
  `c4a0258c981bba557be0d5df135b7006071bc065`; the merge tree remains the same
  `f0af4fec833dfc5567ae845c39d9c9031193e4f9`.
- The resulting `develop` push battery `31680134777` / job `94383477984`
  completed attempt 1 with all **24/24** required steps green. Its artifacts are:
  - `9173984513` battery reports — SHA-256
    `b96cded6985bc82c0b246cb512f4ffd533a62ddaa93d3b68fc9fd19e527591f3`;
  - `9173985179` root layout evidence — SHA-256
    `02bcdabcde7e546cb389f52947b8c74199238e28616e52dfe7834e7e0dc9fb24`;
  - `9173986273` v2 browser evidence — SHA-256
    `3b61fefe843d775b0a9c3633db34dd7b334e85b7bbb4ea8ac5f637094c088987`;
  - `9173987355` v2 development preview — SHA-256
    `f6ecb26b696a8cb4af2bb0503ac9e5cd9b520dc6738bab417579425003ccd801`.
- Branch-site publisher `31682429406` completed successfully: development job
  `94390695366` published the mapped package and production job `94390696143` skipped.
- Approved-candidate content SHA-256 is
  `e56843be4051beb8304d0d066e2b71ac0b0b8b239b1236e0169307e6e9e0a16a`.
  Development destination commit is `d1095996bfddb2d8670ffc78a517b92cb83a2df8`,
  tree `5bd811aa5f9feca4e9cf6efbbc1b306fa9d23f58`.
- The PR #15 published development package reports v2.0, build `develop-c4a0258c981b`, source
  `c4a0258c981bba557be0d5df135b7006071bc065`, and **A New Foundation** with
  five categories /43 bullets. Production remains v1.8.9 at destination commit
  `0a5ee134d8e9724fdae909d75b3a5e3811e54166`; no `develop` → `main` merge,
  production release or manual deployment occurred.

These immutable facts certify PR #15 and its mapped `c4a0258c` development publication
only. Later source or destination commits require their own evidence. The development site
is a public play surface, not proof of human play or production readiness. Human findings
bind URL, full source commit, manifest content hash, device/browser lens, starting save,
outcome and retest.

### Next implementation order

1. Commit and push this documentation-only terminal record, then open its own PR from
   `openai/mac` to `develop`; do not reuse PR #15.
2. If that unchanged docs-only head is clean, mergeable and terminal-green, use standing
   authority for its normal merge and monitor the resulting `develop` battery and mapped
   development publication. Resolve that later state live; do not rewrite PR #15 evidence.
3. Run and record multi-lens human play against the exact matching development package;
   resolve or explicitly disposition findings and retest affected gates.
4. Canonicalize the complete CF1 galaxy → star → planet hierarchy.
5. Restore imported legacy full-expedition `tsnap` before clearing it.
6. Decide and preserve CFB parent identity.
7. Complete live Field Training, tooltip deep-links and Advanced Briefings.
8. Virtualize the 1,500-row Compendium and bound/cancel thumbnail work.
9. Finish general Pixi canvas-texture ownership and add a travel-memory plateau gate.
10. Attach generated HD planet textures to the live sprite.
11. Persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy.
12. Close remaining Gate-B DOM/type boundaries and split-store/CAS persistence.
13. Advance Phase 5 living organism rigs/animation and Phase 6 biome/ecology scenes.

The sealed static portrait review remains accepted. Living rigs, biome scenes and actual
human play are the higher-value visual work.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`. PR #15 is merged into
`develop` at `c4a0258c981bba557be0d5df135b7006071bc065`, and its mapped
development publication is complete. This branch now carries only the scoped terminal-doc
record relative to that integration; resolve its exact local/pushed head before Git action.

**GitHub step:** after the documentation diff-check, commit and push the exact
`openai/mac` head and open a new docs-only PR to `develop`. Do not amend or reuse PR #15.
Standing authority applies only after the unchanged new head is clean, mergeable and
terminal-green; then monitor its resulting push battery and mapped development publication.

**PR details:** planned for the documentation-only record; replace with live metadata once opened.

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `Record the published A New Foundation development bulletin`
- Copy-ready description:

  > Records the immutable terminal evidence for merged PR #15 and its successful mapped
  > development publication: exact PR/synthetic/develop tree identity, attempt-one checks,
  > the 24-step push battery, artifact IDs and digests, publisher jobs, destination commit/
  > tree, manifest content hash, and live v2.0 / **A New Foundation** identity. Changes only
  > `ROADMAP.md` and `port/HANDOFF_NEXT_SESSION.md`; source and tests are unchanged.
  > Verification: `git diff --check` passes, and the HANDOFF historical tail remains
  > byte-identical to the pre-batch source. After
  > this docs-only PR merges, Anthropic/Claude Code may synchronize from `origin/develop`.
  > No production version, `develop` → `main` merge, manual release or deployment is included.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not need
to be opened now. PR #15 is available in `origin/develop`, but this terminal-doc refresh is
not there until its own PR merges. At the next coding batch, from a clean worktree, fetch and
merge the then-current `origin/develop`; if dirty, finish or commit its work first. Never copy
files manually.

**Release status:** PR #15's verified isolated development publication used source
`c4a0258c981bba557be0d5df135b7006071bc065`, destination
`d1095996bfddb2d8670ffc78a517b92cb83a2df8`, content SHA-256
`e56843be4051beb8304d0d066e2b71ac0b0b8b239b1236e0169307e6e9e0a16a`, with
v2.0 / build `develop-c4a0258c981b` / **A New Foundation**. Resolve any later automatic
development publication live; it does not alter these immutable PR #15 facts. At this
observation, production remained the unchanged v1.8.9 destination at
`0a5ee134d8e9724fdae909d75b3a5e3811e54166`. This docs-only record does not
authorize production versioning, release or deployment.
