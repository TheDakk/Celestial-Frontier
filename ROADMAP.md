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
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · ARC 0 CHARTER TRUTH + CANONICAL PLANET-SHARE SEARCH FROZEN; INTEGRATION OPEN ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`. Never commit directly to `develop` or `main`.
- Integration base for this Arc 0 batch: `f780d15349bc20bc222e920a020c72e3b96cabdd`. Resolve current
  HEAD, upstream, worktree, PR, CI and publication state live before any Git action.
- The shared working tree contains the frozen Arc 0 source, focused tests and current-reference
  documentation. It is not yet a committed, pushed, reviewed or integrated change. No PR, required
  branch battery, `develop` push battery, publication, `develop` → `main` merge, production version or
  deployment is claimed by this handoff.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` ·
  `QUESTS_AND_CHAPTERS.md` · `PROGRESSION.md` · `UI_PRESENTATION.md` ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `celestial-frontier-codebase-reference.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/HANDOFF_NEXT_SESSION.md`.

### Arc 0 frozen implementation truth

#### Charter: canonical data preserved; current presentation is stage-aware and landfall-only

- `ASC_CHAPTERS_DATA` remains the verbatim canonical legacy chapter data. Imported `ascCh`,
  `ascProg` and `bankLandfall` semantics stay compatible; that data is not rewritten merely
  because its later writers are not yet ported.
- The current player-facing projection is pure: `projectV2Charter` and
  `currentV2Objective` receive saved chapter/progress plus the derived drive stage. They surface
  only landfall milestones that this Phase-4 slice can actually write.
- A fresh stage-0 expedition is shown the two Sol landfalls. A non-Sol landfall is visible only
  when the real saved drive stage reaches the Neighborhood. A nonterminal chapter number alone
  never grants non-Sol reach.
- Completing every visible landfall is a **boundary**, not a synthetic chapter completion,
  fabricated drive, invented reach tier, mining/fabrication/bioscan/conquest/breeding action or
  Shipyard promise. A chapter can advance only after a new real landfall banks progress and the
  canonical chapter is complete with its compatible saved reach stage.
- The terminal veteran fallback is explicit: `ascCh >= ASC_CHAPTER_COUNT` produces no phantom
  chapter or objective chip. Charters instead render the generic **Charter record** message that
  existing Charter progress and reach are preserved.
- The Guide/current release copy describes this as a development-slice boundary. It does not
  advertise the unported Charter systems as playable.

#### Canonical CF1 address foundation and strict raw external planet Search

- `resolveCF1WorldAddress` is a pure source-derived CF1 resolver. From semantic galaxy, star and
  planet identity it re-generates and proves the whole galaxy → star → planet hierarchy, including
  parent cells, star layer, planet ordinal and source-derived galaxy presentation metadata.
  Callers must use the returned address, not a public payload’s presentation tuple.
- In particular, size, `sp`, tilt, rotation and galaxy flags are re-derived from source. The
  focused Earth proof returns the source size **78**, not an attacker-supplied galaxy size such as
  3999.
- `jumpToView` invokes the resolver for sanitized planet-surface navigation, including planet
  Atlas rows. That supplies post-sanitize generator membership and canonical display output; it
  does **not** prove the original saved/Atlas bytes were strict before an earlier repair/coercion.
- The strict raw ingress wired today is **only raw external CF1 `t:'p'` planet-share Search**. Before
  the tolerant legacy decode/sanitize path, Search requires exact number values for
  `g[0]`, `g[1]`, `g[6]`, `s[0]`, `s[1]`, `s[2]` and `p`: finite two-decimal coordinates and
  exact uint32 seeds. It also rejects an oversized CF1 paste above the 8,192-character raw
  input cap before base64/JSON allocation. Numeric strings and fractional identity values are
  correction outcomes, not destinations.
- On a valid external planet share, Search passes the raw identity to the resolver before
  reach/nav/card/name/save effects. Navigation and re-share then use the resolver’s generated
  parents and presentation values. A forged same-reach parent and malformed raw numeric identity
  reject with the query/focus/navigation/card/Atlas/landed/custom-name/saved-view snapshot
  unchanged in the focused browser proof.

### Deliberate remaining boundary — D-CF1-2 is partial, not closed

The pure resolver is a foundation and the planet-share Search route is a real raw-ingress proof;
neither is a blanket certification for every way world data can enter the game. Still open:

1. saved-view boot and persisted Atlas rows: their later surface navigation is canonicalized after
   sanitization, but the persisted/raw data may already have been repaired/coerced first;
2. galaxy-only and star-only CF1 Search/Atlas paths;
3. generated descent paths; and
4. every future ownership, reward or receipt writer.

No ownership/receipt system may treat a public world payload as canonical until its own ingress
boundary proves and retains the source-derived address. Do not close all of D-CF1-2 or call the
whole CF1/address surface hardened from this Arc 0 result.

### Frozen proof recorded — not a PR or publication battery

Only the following outcomes are confirmed for the frozen implementation:

- Node syntax check — PASS.
- `npm run typecheck` — PASS.
- Full v2 test suite — **25 files, 283 passing, 1 skipped**.
- Focused canonical-address controls — **8/8 PASS**.
- Real-browser smoke — **PASS**.
- Structured real-browser smoke evidence — **PASS, 0 findings** (local dirty diagnostic only).
- Full 12-viewport Glass Matrix — **PASS, 57/57 controls, 0 findings/instrument failures/retries**
  (local dirty diagnostic only).
- Automated persona evidence — **PASS, 9 bounded personas**; human comprehension, accessibility and
  physical-device play remain required.
- Scoped `git diff --check` — PASS.

These are local/frozen-source proof only. They do not replace a required PR battery, human play,
CI, a `develop` push battery or a mapped site publication.

### Next order

1. Keep the exact Arc 0 head frozen through a scoped review and the required PR battery; create
   no success claim for a PR, integration or publisher before its live evidence exists.
2. Extend source-derived identity proof to saved-view boot, persisted Atlas rows, galaxy/star
   routes and generated descents before attaching a world-bound ownership or receipt writer.
3. Continue the planned Arc 1 foundation: Compendium virtualization/resource ownership and the
   pure reach-shared ShipVisualState. Do not expand Charter copy beyond real actions.
4. Preserve the broader mastery-loop work as planned: item-instance inventory/economy, engineering,
   capture/ownership, companions, combat decision rules, audio, legacy and human play gates remain
   open behind their own outcome proof.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`, with Arc 0 based on
`f780d15349bc20bc222e920a020c72e3b96cabdd`. The shared worktree contains the frozen
implementation, tests and documentation, but no Arc 0 commit, push, PR or integration is recorded
here.

**GitHub step:** none has occurred. After the exact whole-scope head is reviewed, committed and
pushed, open the scoped PR below into `develop`. Standing authority applies only after that exact PR
is clean, mergeable and terminal-green on its required battery; do not claim a merge, `develop` push
battery or publisher result in advance.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `Make Charter goals actionable and canonicalize planet-share Search`
- Copy-ready description:

  > Implements the Arc 0 truth repair for the v2 slice: a stage-aware,
  > landfall-only Charter projection that preserves canonical legacy data and veteran progress
  > without promising unported systems; a pure source-derived CF1 galaxy → star → planet resolver;
  > and strict raw external planet-share Search ingress that rejects forged or malformed public
  > identity before navigation or persistence and uses generated metadata for accepted routes.
  > Planet Atlas rows are canonicalized after sanitization, while raw saved/Atlas ingress remains
  > open; galaxy/star routes, generated descents and future ownership/receipt writers also remain
  > open. Verification: Node syntax check, typecheck, v2 tests 25 files/283 pass/1 skipped,
  > focused address controls 8/8, real-browser smoke plus structured smoke evidence PASS,
  > full 12-viewport Glass Matrix (57/57 controls) PASS, 9-persona automated evidence PASS,
  > and scoped diff check. This PR includes
  > no release, `develop` → `main` merge, deployment or publication. After merge, Anthropic/Claude
  > Code may safely merge the then-current `origin/develop` into a clean agent branch.

**Other side:** Anthropic/Claude Code on Windows, branch `anthropic/windows`, does not need to be
opened now and does not have this unmerged Arc 0 work. After its PR merges, begin the next Anthropic
batch only from a clean worktree: fetch, inspect and merge the then-current `origin/develop` into
`anthropic/windows`. Do not copy files manually.

**Release status:** no Arc 0 PR, integration, required push battery, site publication, production
version, `develop` → `main` merge, release or deployment is recorded. Treat `develop`, `main` and
both branch sites as requiring live verification.
