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

## ▶▶▶ SESSION HANDOFF — 2026-08-15 · F2 CANONICAL INGRESS AND DISCRIMINATED NAVIGATION ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows
  uses the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · `celestial-frontier-codebase-reference.md` ·
  [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve Git, PR, checks and publication live. Historical run IDs below are evidence, not an
  assertion about a newer tip. Never copy files manually between agent worktrees.

### Integrated through F1b

- Epoch-contract PR [#29](https://github.com/TheDakk/Celestial-Frontier/pull/29) reached exact final
  head `f6d89b01600effd04599326d0e024c7ad2ee3a4d`. Every required job and final join passed in
  test-battery run
  [`31908610283`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31908610283).
- PR #29 merged normally into `develop` at
  `5171abcdc538938fdf5ac82688d1ab868da6ff48`. Every job and final join passed in exact-`develop`
  test-battery run
  [`31919155384`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31919155384).
  Mapped publication run
  [`31919904024`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31919904024) passed
  development and skipped production; the public DEV manifest serves build
  `develop-5171abcdc538` from the full merge SHA.
- Remote automation fast-forwarded `openai/mac`. Before this docs-only transition, the worktree,
  `HEAD`, `origin/openai/mac`, and `origin/develop` were clean and synchronized at that exact merge.
  Automation never replaces the required live ownership/fetch/clean check.

### Active F2 boundary — locally proven working candidate, not yet certified

- F2 closes the current canonical-identity gap before any world-bound ownership, reward, or receipt
  writer begins. The current worktree now contains the pure tiered resolver, runtime provenance,
  discriminated navigation, strict CF1 parser, raw import sidecars, app ingress migration, canonical
  render receipt, source-order planet ordinal, and truthful existing Guide/release-copy candidate.
- The focused ingress controls are green. The complete static suite is green at **27 files / 340
  passed / 1 skipped**; both TypeScript programs, `artunused`, and the production build are green.
- The first complete local `npm run smoke` stayed red and remains part of the evidence. It found one
  real product incompatibility: the lifted `galaxyStats` presentation helper memoizes by assigning
  `_stats` to its argument, but F2 correctly makes `ProvenGalaxy` immutable. The repair gives that
  helper a disposable mutable copy and stores the result in a runtime sidecar keyed by the proven
  galaxy; canonical provenance remains frozen and never leaks into save bytes.
- That same red run also exposed harness expectation/setup drift rather than further product defects:
  the Charter control had selected real Sol instead of a generated non-Sol star, imported explorer
  names were expected before their established 24-character `cleanName` normalization, and saved-
  route, Training, and Records checks ignored the exporter's established first-write union of landed,
  conquered, and mined census worlds. The repaired harness cycles real keyboard input to an actual
  generated non-Sol star before pressing its live action and compares persistence/Records against the
  normalized save stage without weakening the route, ledger, receipt, or raw-IDB controls.
- Final audit then added held-route Training Restart transfer/rollback and non-null per-mode
  provenance-key controls. The first CI-format rendered-copy run correctly stayed red on its own
  title identity: both required-copy lists were empty and both contradiction guards were false, but
  the predicate compared `Settings` to the rendered icon-prefixed `⚙ Settings`. Matching the stable
  topic title by contained identity preserves the cross-topic failure direction without rejecting
  the real heading; the diagnosed next one-attempt run passed.
- Final local `npm run smoke:ci` report `apps/game/smoke/slice-smoke-report.json` is terminal-green:
  zero findings, zero automatic retries, 138,305 ms, ten fresh run-id-bound screenshots, Edge
  `151.0.4129.86`, and working-tree digest
  `7dfa649eb7de017424b7ba1ba0b11ba1fd00dc02a5b99b6848e0f3c347acba9e`.
  `npm run glassmatrix:selftest` and the complete 12-viewport `npm run glassmatrix` are also green;
  the Glass report binds the same digest and browser provenance, with zero findings, zero instrument
  failures, zero retries, and 55,065 ms. Browser-path/CDP/report selftests are green. This remains
  local dirty-tree evidence, not a claim that Gate D or F2 is closed: exact-head pull-request CI,
  merge integration, and mapped publication remain open. F2 therefore remains **[PARTIAL]**.
- Factor the existing source-derived address proof into exact galaxy, star, and planet tiers. Mint
  immutable runtime-proven hierarchy objects only from deterministic generators; bind star to its
  canonical galaxy and planet plus ordinal to its canonical star. A type assertion, object spread,
  sanitized view, caller coordinate, or test-source override is not provenance.
- Replace nullable, alias-prone navigation with an immutable discriminated `NavState` and validating
  smart transitions. Legal adjacency remains universe → galaxy → system → surface and back; every
  transition must reject unproven or cross-parent context without mutating current state.
- Route every current ingress through the same proof boundary: generated galaxy/star/planet
  descents; external planet, star-only and galaxy-only CF1 Search; saved-view boot; Atlas rows;
  tutorial snapshot restore; legacy-slice validation; and any route later proposed for ownership or
  receipt targeting.
- Only resolver output may reach rendering, reach and Charter gates, survey/custom names, Land,
  sharing, saved navigation, or future world registries. Invalid or stale saved navigation degrades
  to neutral universe home; other invalid ingress fails closed without partial-parent fallback.

### Hard exclusions

- F2 does not add ownership, inventory, rewards, receipts, mining, fabrication, breeding, combat,
  missions, companions, or any other Arc 2+ mechanic. F3 still owns CAS/revisions, journal receipts,
  split stores and the tab lease; F4 still owns active-play time, visibility policy and SessionRNG.
- Do not change deterministic generation, share-code bytes, world positions, reach/Charter balance,
  save schema/version, presentation art/audio, Guide capability availability, Training lessons,
  draft-release inventory, development or production version, `main`, production deployment, or
  the live-site repositories. Existing Guide topics and existing draft bullets may become more
  truthful only after their matching live outcomes are proven; F2 adds no new player capability.

### Required evidence plan

- Pure controls must prove all three valid tiers, exact uint32/finite-coordinate rejection,
  normalized `-0`, galaxy-A/star-B and star-A/planet-B rejection, coarse/fine duplication,
  ambiguous/missing/throwing sources, immutable deep copies, rejected structural clones, and valid
  independently resolved copies of the same canonical parent.
- Navigation controls must prove every legal descent/ascent, every wrong-origin rejection, parent
  binding, stale saved-view → home, no lower-tier downgrade, and exact slim save/share serialization
  without provenance metadata leakage. Deliberate old seed-only, nullable-state and coercing-view
  substitutions must turn the focused tests red.
- Real-browser outcome evidence must drive every live ingress and prove invalid routes cannot render
  foreign content, pass reach/Charter, focus or rename a planet, Land, bank progress, persist, share,
  or award. Valid generated, Search, Atlas, boot/reload and tutorial-restore paths must still work.
- Run focused scene/address/navigation tests, the complete v2 suite, both TypeScript programs,
  `artunused`, diff hygiene, and one complete no-retry browser smoke. Any new browser instrument needs
  its own bidirectional controls. Refresh current references and player copy only for outcomes that
  actually become live.

### Next actions

1. Treat only PR #30's live final successor—not the initial implementation-head run—as exact-head
   authority. Require terminal-green branch-flow and battery checks with no further source or scope
   change; preserve the first red smoke diagnosis alongside the restored local green evidence.
2. Require clean review or an exact-head waiver before normal integration, then monitor the exact
   `develop` push battery and mapped development publication.
3. Do not begin F3, F4, or any world-bound product writer while F2 remains incomplete.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, owned folder `/celestial-frontier-openai-mac`, branch
`openai/mac`, based on synchronized `develop` commit
`5171abcdc538938fdf5ac82688d1ab868da6ff48`. Exact implementation commit
`3cc61f9d71b1073cacece8dfeb44c2dd2fd93b3d` is pushed and opened as draft PR #30; this
publication-state correction is its final docs-only successor, whose live pushed SHA/check state
must be resolved rather than inferred from the initial run. Focused and full static checks,
type/art/build checks, final CI-format smoke, and 12-viewport Glass Matrix are green after the
recorded product and harness reds. The smoke and Glass reports bind the same pre-evidence-refresh
working-tree digest; exact-head CI and integration remain pending.

**GitHub step:** None for Nick now; draft PR
[#30](https://github.com/TheDakk/Celestial-Frontier/pull/30) targets `develop` from `openai/mac`.
OpenAI/Codex owns the final docs-only successor, fresh exact-head CI, review/waiver boundary and
normal integration monitoring. Do not reuse PR #29 or touch `main`.

**PR details:** base `develop`; source `openai/mac`; title **F2 — Canonical ingress and immutable
navigation provenance**. Copy-ready description:

> Makes every current galaxy, star and planet navigation ingress source-prove one canonical
> hierarchy before authorization or mutation. Adds runtime-proven immutable hierarchy objects,
> discriminated navigation, strict all-tier CF1 parsing, source-order planet ordinal, bounded
> nonserialized import/Atlas evidence, authorize-before-commit routing, canonical render receipts,
> safe saved/Training route repair and conditional retry, plus truthful Guide/release copy. Closes
> the nested WorldGen `bridge` alias and keeps mutable presentation caches off frozen authority.
> No save schema, generated universe/share bytes, reach balance, ownership/reward/receipt writer,
> capability inventory, Training lesson count, version, release or deployment changes.
>
> Local evidence: 27 test files / 340 passed / 1 skipped; both TypeScript programs; `artunused`;
> art audit/override/coverage/spec controls; browser-path/CDP/report selftests; one final
> zero-finding/zero-retry `smoke:ci`; and a zero-finding/zero-instrument-failure 12-viewport Glass
> Matrix. Exact-head PR CI and review remain integration authority.

**Other side:** Anthropic/Claude Code need not be opened now. Once this plan is committed and pushed,
it may review it later from a clean synchronized `anthropic/mac`, but must not edit or copy files
from the OpenAI worktree. At its next coding batch it must fetch and verify its own branch against
current `origin/develop`.

**Release status:** PR #29 is integrated in `develop` and mapped DEV build
`develop-5171abcdc538` is published. No `develop` → `main` merge, production release, version bump,
manual deployment, or production-site write was performed or authorized.
