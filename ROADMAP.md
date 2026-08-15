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

## ▶▶▶ SESSION HANDOFF — 2026-08-15 · F1B WORLDGEN TRUTHFUL CONTRACT ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve Git, PR, checks and publication live. Historical run IDs below are evidence, not an
  assertion about a newer tip. Never copy files manually between agent worktrees.

### Integrated foundation

- F1a remains integrated at `a1dabdeb4059292d67d7a89652e92fb317d750c7`; F1b Charter remains
  integrated at `bd49beb0693b45fdd57d4acad746ade79843a91e`.
- UI-P1 PR [#26](https://github.com/TheDakk/Celestial-Frontier/pull/26) reached exact head
  `c1bfc3b7674f5113dd7c9a0c6063fc99737ea1ba` and passed terminal test-battery run
  [`31872279328`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31872279328). It
  merged at `b5e5d0a3b4bb4057fa6d251816454b370e8b2624`. GitHub records no review or PR comments,
  so this handoff does not claim Claude reviewed that integration.
- The exact merge passed every job and final join in `develop` test-battery run
  [`31884952674`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31884952674). Mapped
  publication run [`31885531363`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31885531363)
  passed development and skipped production; the public manifest serves build
  `develop-b5e5d0a3b4bb` with the full merge SHA.
- Remote automation fast-forwarded agent branches. This worktree fetched and normally
  fast-forwarded clean `openai/mac` to the exact merge before this batch; automation never
  substitutes for the required local folder/branch/clean/fetch check.

### Active F1b WorldGen contract

- DOM-2 was an API-description defect, not a reproduced current gameplay bug: the live caller
  already passes `epochClock.current()`, but the handwritten declaration called the argument `n`
  and returned `unknown`. It now declares `supernovaSites(galaxySeed, epoch): SupernovaSite[]`,
  where `epoch` is the deterministic cosmic-time key and the exact remnant/birth result is typed.
  A plain `number` still cannot nominally reject a count; stronger epoch ownership remains F4.
- DOM-3 is closed only as the sweep-approved facade warning. Importing WorldGen is safe, while a
  first uncached ordinary galaxy/merger/dwarf generation path still reads free `GAL_SPRITES`.
  Empty, special-only and cached paths may not read it. The app installs the descriptors capture
  hook before generation. No eager wrapper, dependency cycle, auto-install or standalone-safety
  claim is introduced.
- DOM-11 is split by owner. This batch types the required own numeric
  `galaxiesInCell(...).web` metadata and removes the app's local `.web` cast. The unrelated
  `_sanitizeSavedGenome` in-place mutation remains open under strays/import persistence work.
- The byte-verbatim `worldgen.verbatim.js`, generator salts, generated values, cache keys/order,
  rendering, navigation, saves, balance, CF1/F2 and clock wiring are unchanged. No Guide topic,
  Training lesson, draft release bullet, version identity, production release or deployment changes.

### Test-first evidence

- Before the declaration repair, the focused WorldGen suite failed the exact semantic sentinel:
  `supernovaSites(seed, n): unknown` did not satisfy the epoch-keyed exact-result contract.
- Permanent controls now prove: empty/cached cells retain own finite `[0,1]` `web`; array spread
  drops it and fails; `NaN` fails; a home-only cell succeeds without the hook; exact ordinary cell
  `(-6,4)` fails with `ReferenceError: GAL_SPRITES is not defined`; the official 16-slot hook then
  yields four galaxies with sprite indices `[6,14,9,2]` and the same deterministic web density.
- Supernova controls preserve the exact epoch-3 baseline, prove same-key cache identity, epoch 3 versus 4
  change, epoch 99 still returns only 1–3 sites, exact remnant/birth shapes, and an invalid remnant
  fails the validator.
- Deliberate defect injections are restored: renaming `epoch` to `n` failed the declaration
  sentinel; returning plain `Gal[]` failed the real `.web` consumer typecheck; restoring
  `unknown` failed the supernova consumer typecheck.
- Pre-CI local evidence for implementation commit
  `29601e478e99b2a114720e23b696e8fb7d79d33c`: focused
  WorldGen/Descriptors/Scene/Address suites pass 55 tests /1 skip; the full v2 suite passes
  **299 tests /1 skip**; root and app TypeScript programs, `artunused`, `git diff --check`, and the
  complete one-attempt real-browser slice smoke pass with zero console errors. Three independent
  read-only source, test and documentation audits were clean after their findings were resolved;
  those checks did not replace the complete static battery.
- Draft PR [#27](https://github.com/TheDakk/Celestial-Frontier/pull/27) reached exact head
  `fe37753d66b52d66c08df878cd315cc7168dcb2e`. That head is permanently non-certifying: test-battery
  run [`31886401312`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31886401312)
  completed with the full `v2 parity and complete TypeScript surface` step, `root-gates`, `v2-smoke`
  and `v2-glass` all green. The only red primary job was `v2-static`, which failed closed because
  `packages/domain/descriptors/src/apphooks.ts` no longer matched its audited authority hash;
  `v2-persona-preview` skipped and `battery` failed only as the dependency cascade. Its sole change
  was sharper historical prose. This is a provenance-sentinel failure, not a WorldGen runtime,
  type, generation, art-routing, coverage or browser finding. Do not retry this head and do not
  re-pin the sentinel.
- The bounded repair restores `apphooks.ts` byte-for-byte to audited SHA-256
  `c7544344733ce0efe0c08762b96bfa3d1ca8451e38b7617ef67aa8fde9a1329a`
  and pre-batch Git blob `ba95d19349f3ae911f41a2903080c03816489767`. Precise dependency
  wording remains in the owning WorldGen facade, declaration, tests and refreshed references.
- With those bytes restored, local `overridecheck` reports 1,014/1,014 routes, zero dead and
  1,010/1,010 Earth coverage; every `overridecontrol` leg passes, including the catalog-wrapper
  byte sentinel and restored-clean outcome; `artaudit` reports 23 sources/zero findings;
  `coveragegap` reports 1,010/1,010 with zero remaining; `speccheck` reports 454 declared
  fields/zero unread/zero inert; and all 299 tests /1 skip, both TypeScript programs, `artunused`
  and `git diff --check` pass.
- The byte-restored exact head `1a0839a95e595673409436bae27962e999f256a0` is also permanently
  non-certifying. Test-battery run
  [`31887203990`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31887203990) completed
  with `v2-static`, `root-gates`, and `v2-smoke` green. `v2-glass` first passed its report selftest,
  then correctly published an `instrument-fail` report with zero product findings and zero retries:
  its ninth matrix browser (`desktop`) observed `DevToolsActivePort has an invalid port` after
  364 milliseconds, while all eight earlier and all three later fresh-browser rows passed with the
  same pinned Chrome 151 provenance. `v2-persona-preview` skipped and `battery` failed only as the
  dependency cascade. No gameplay page was created for the failed row; do not retry this head.
- That second red exposed a shared-launcher publication race, not a WorldGen, Glass outcome,
  browser-pin, profile-reuse, or timeout defect. The old reader treated path existence as proof that
  Chromium had finished publishing both endpoint lines and killed the one owned browser on the
  first parser-invalid observation. A test-first port-only file with its endpoint line missing
  reproduced the old `invalid port` failure; a separate syntactically valid-looking prefix proved
  the old reader could construct a socket before publication stabilized. The bounded local repair
  now requires two consecutive identical, fully valid snapshots inside the same absolute startup
  deadline; parser-invalid regular-file content is treated as potentially incomplete, while wrong
  file types, links, and unexpected I/O still fail immediately. A persistent malformed regular file
  reaches the unchanged deadline
  with its last parse diagnosis, constructs no socket, launches no second process, and cleans its
  profile. The strengthened `browsercdp --selftest`, Glass report selftest, full 12-viewport Glass
  matrix, one-attempt v2 smoke, root preflight/selftest, root layout selftest, and sealed 787-outcome
  layout gate all pass locally on this exact working diff. The full v2 suite remains 299 tests /1
  skip; both TypeScript programs, `artunused`, syntax, and diff hygiene pass. Local preflight records
  Edge 151 launch success plus the expected non-blocking revision-drift warning against the Edge 150
  baseline. Three independent final read-only audits of the launcher, permanent controls, shared
  callers, and synchronized references are clean after their findings were resolved. A new
  committed head, fresh CI, and Claude exact-diff review remain required.

### Next actions

1. Commit and push one new PR #27 head; never retry either known-red head.
2. Require fresh exact-head CI, then request Claude's exact-diff review. Resolve only actionable
   findings on the same branch;
   merge only the reviewed terminal-green exact head under Nick's standing authority.
3. Monitor the resulting `develop` battery and mapped DEV publication. Then continue F1b as
   separate audio pre-init and epoch-contract PRs, followed by F2 canonical ingress before any
   world-bound ownership/reward/receipt writer.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`, based on merged `develop` tip
`b5e5d0a3b4bb4057fa6d251816454b370e8b2624`. Draft PR #27's pushed exact head
`1a0839a95e595673409436bae27962e999f256a0` is permanently non-certifying in run
`31887203990`; the earlier head/run `fe37753d…` / `31886401312` remains separate immutable red
history. The working tree contains only the bounded shared-launcher publication repair and its
synchronized current references; no new repaired head has been pushed.

**GitHub step:** existing draft PR [#27](https://github.com/TheDakk/Celestial-Frontier/pull/27)
targets `develop` from `openai/mac`. Do not retry or review-finalize known-red head
`1a0839a95e595673409436bae27962e999f256a0` or its earlier failed predecessor. Push the bounded
launcher repair as a new head, require fresh exact-head CI, then obtain Claude review of that exact
repaired diff.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `F1b: make WorldGen contracts truthful`
- Copy-ready description: `Corrects the bounded WorldGen handwritten contract without changing
  the byte-verbatim generator or any generated value. Types required galaxy-cell web metadata and
  exact epoch-keyed supernova remnant/birth results, removes the two app-local casts, and documents
  the transitional GAL_SPRITES precondition precisely. Focused controls prove empty/special/cached
  behavior, exact missing-hook failure and hooked success, epoch stability/change, bounded result
  shapes, and declaration/type regressions in both directions. Updates current WorldGen, port,
  program, deviation, codebase-reference and handoff documents. Explicitly excludes generator
  logic/cache/order, CF1/F2, epoch persistence, _sanitizeSavedGenome, audio, Guide/Training/release
  copy, balance, versioning, production and deployment. Also restores the descriptor catalog
  wrapper byte-for-byte after the first exact-head CI correctly rejected a prose-only change through
  its audited hash sentinel; the precise warning remains in WorldGen-owned surfaces, and no sentinel
  hash is re-pinned. The next exact head also hardens the shared raw-CDP reader after CI caught a
  transient partial `DevToolsActivePort` publication: it accepts only two identical complete endpoint
  observations inside the existing single-process startup deadline, preserves immediate unsafe-file
  rejection and bounded cleanup, and adds staged-prefix plus persistent-malformed controls without a
  retry, timeout increase, Glass-specific workaround, or product change.`

**Other side:** do not ask Claude to review-finalize either known-red head. After the new repaired
head is pushed and its exact CI is terminal green, Nick should open Anthropic/Claude Code; Claude
fetches and normally fast-forwards clean `anthropic/mac`, then reviews the exact remote diff without
editing this worktree.

**Release status:** no release, manual deployment, production version bump, `develop` → `main`
merge, or direct site write is part of this batch.
