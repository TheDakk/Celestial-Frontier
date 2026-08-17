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

## ▶▶▶ SESSION HANDOFF — 2026-08-17 · ARC 1A BOUNDED COMPENDIUM ◀◀◀

### Cold start

- Verify the repository and branch live. OpenAI/Codex macOS owns
  /Users/nick/Projects/celestial-frontier-openai-mac on openai/mac; other agents use their own
  worktrees and branches under PARALLEL_GIT_PROTOCOL.md.
- Read this handoff, PROCESS_LAWS.md, PARALLEL_GIT_PROTOCOL.md, AGENTS.md or CLAUDE.md,
  ART_DIRECTION.md, UI_PRESENTATION.md, celestial-frontier-codebase-reference.md,
  port/V2_PROGRAM_ROADMAP.md, port/RUBRICS.md, port/v2/README.md, port/v2/DEVIATIONS.md, and
  port/DEVELOPMENT_PREVIEW.md.
- Resolve Git, PR, checks, artifacts, and publication live. Ignored browser reports bind only the
  exact run id, source, inputs, budget bytes, fixture, browser build, and review files they name.
  Never reuse an earlier green report for a newer source or budget.

### Integrated foundation and owned branch

- D-TRAIN-1 merged normally through PR #31 into develop at exact merge
  38447019517147319bd08c598202d097ee866874. That merge is the Arc 1A broken-baseline authority
  and the current origin/develop base for this branch.
- openai/mac contains ten intentional Arc 1A implementation/instrument commits from d1c5fc6 through
  clean committed e4e8d1d. The remaining active-budget, exact-browser CI, verifier, tests, and
  reference refresh are one uncommitted OpenAI-owned integration batch.
- Nothing in this batch changes main, the production v1.8.9 page, a shipped version, a save schema,
  deterministic generation/share bytes, or either live-site repository.

### Arc 1A executable boundary

- The 1,500-entry Compendium now mounts only a virtual window with spacer-preserved scroll. Native
  filtering, visible and hidden Search entry, clear/reopen, deep Back, Close, selected-row focus,
  pinned focus rings, resize contraction/expansion, and one-generation publication remain bound to
  real DOM outcomes.
- List and Planetside portraits use one complete-genome-keyed lease producer. A cold row receives a
  neutral placeholder, cancellable/deduplicated work, a direct 132 by 132 canvas thumbnail, and a
  bounded cache; unmounted/closed owners release, queued orphan work cancels, settled subscribers
  clear, and phone cap selection trims immediately. The selected detail alone owns a 440px portrait.
- Producer failure evidence is fail-closed: one proven-cold invariant row receives the exact
  one-shot error while it remains mounted, the error key stays uncached, and a natural close/reopen
  proves the same logical id/key recovers as a cached decoded 132px row. Ownership, lifetime
  counters, cache arithmetic, answerability, command order, and partial-report milestones are
  retained and verifier-bound.
- The species-art executable remains a separate lazy chunk. App-shell/document lifecycle owns its
  import; list traffic neither renders nor decodes full portraits and does not pollute the portrait
  cache. Arc 1B still owns ordinary Pixi/canvas scene texture and long-session resource plateaus.

### Measured resource authority

- The checked-in Compendium budget embeds one exact paired broken-baseline observation from
  3844701 and three independent one-attempt candidate observations from clean e4e8d1d for each
  phone and desktop profile. Candidate runs are:
  20260817075022672-56100-97d57bcb27,
  20260817075709048-56928-b0435507d2, and
  20260817080124302-57611-3422d7d6b9. The paired baseline run is
  20260817074210620-55255-c8f0e10c47.
- Both baseline profiles reproduce exactly four sealed faults: all 1,500 rows mounted, 440px list
  sources, full-portrait DOM exposure, and eager art import. Both exceed the active candidate ruler
  in exactly eleven resource fields. Every active ceiling is strictly above the three-run measured
  maximum; fractional count and plus-one byte/pixel sentinels remain below the next reachable
  product state while heap/encoded/warm ranges retain documented variance headroom.
- Arc 1A owns a local cross-host browser-build authority:
  Edg/151.0.4129.86, revision @083e754915c9ab93da1d8f7b9c860e4520273900,
  JavaScript 15.1.23.7, protocol 1.3. Executable path and user agent remain recorded provenance.
  This does not change the Gate-A/root layout/legacy boot Edge 150 pin.
- Ordinary and manual Compendium CI install the exact SHA-verified Edge package only for this gate.
  Other smoke, Glass, persona, and preview browser work keeps its established Chrome selection.
  Browser mismatch terminates before profiles as instrument evidence; it can never emit product
  PASS, FAIL, or product-unanswerable.

### Evidence and verifier state

- The paired baseline and all three candidate calibration artifacts received independent read-only
  audits. Each candidate recomputed 76 of 76 exact outcomes, retained three run-bound PNGs/profile,
  proved visible to hidden to ordinary-reopen Search with generation plus one, and proved cold
  producer error containment plus same-key recovery. Calibration is evidence for the ruler, not a
  certification PASS.
- The terminal verifier now binds the exact current committed source, every named input digest,
  both budget-hash carriers, current budget status, deterministic fixture, Arc-local browser
  authority, six PNG artifact hashes, and the raw phone/desktop profiles. Complete active outcomes
  are replayed from those raw profiles against the exact budget and must match byte-for-byte.
  Stale raw resource evidence, duplicated summary carriers, forged authority booleans, old source,
  wrong inputs, retry ledgers, and truthful product FAILs are independently controlled.
- Browser-free activation evidence is green: 33 test files, 395 passed and 1 skipped; both
  TypeScript programs; no-unused checks; 117 Compendium instrument controls; 20 focused
  budget/species tests; production Vite build with a separate speciesart chunk; YAML parsing; and
  syntax/diff checks. Independent frozen-byte audits found no remaining activation blocker.
- A fresh certifying browser run is deliberately not hard-coded into tracked source. The sole local
  executable authority is the ignored current compendiummem-report.json whose exact run id must
  verify against the current committed HEAD and active budget. PR CI repeats one attempt and always
  uploads/verifies that exact current report even when red.

### Human and scope boundary

- Arc 1A automatable implementation/evidence is ready for exact committed certification, but its
  rubric remains open until a person reviews the six same-run phone/desktop list, focus-pinned, and
  detail PNGs for 132px list quality, 440px detail quality, hierarchy, clipping, and visible focus.
  Automated hashing, dimensions, and model inspection do not satisfy this HUMAN row.
- Arc 1A does not add Cargo, Shipyard, ownership inventory, creature instances, rewards, combat,
  missions, companions, crafting, research, live HD scene textures, or an Arc 1B GPU/scene-memory
  plateau. It does not close Gate C, Gate D, the full 21-step Training curriculum, human play,
  performance/heat on physical devices, a production release, or deployment.

### Next actions

1. Commit the complete activation/reference batch on openai/mac only after final diff review.
2. Run exactly one fresh Compendium certification on that clean committed HEAD with the Arc-local
   Edge authority; preserve the first terminal result and run exact-current verification.
3. Present the six same-run PNGs to Nick for the remaining HUMAN Arc 1A judgment. Do not translate
   automated/model visual inspection into human approval.
4. Push openai/mac, open/update a draft PR into develop, require exact-head CI, and merge only the
   reviewed or explicitly waived terminal-green head under the standing proceed authority.
5. Monitor the develop push battery and mapped development publication. Keep main, production
   versioning, and production deployment untouched.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS in
/Users/nick/Projects/celestial-frontier-openai-mac on openai/mac. HEAD is clean committed e4e8d1d
plus the current uncommitted activation/reference batch; origin/develop and origin/openai/mac are
3844701, so the branch is ten commits ahead before the activation commit. Static and calibration
evidence is recorded above. Terminal automated authority belongs only to the verified ignored
report for the clean committed activation head; the six-image HUMAN judgment remains separate.

**GitHub step:** None for Nick yet. OpenAI/Codex owns the intentional commit, the one-attempt
exact-head report and verification, push, draft PR, checks, and normal integration monitoring.
Do not touch main.

**PR details:** base develop; source openai/mac; copy-ready title
**Arc 1A — Bound Compendium portraits and measured resources**. Copy-ready description:

> Virtualizes the maximum 1,500-row Compendium, preserves native filter/focus/detail/close
> outcomes, and moves list plus Planetside art to complete-genome-keyed cancellable 132px leases
> while reserving 440px portraits for detail. Adds cold error/recovery, ownership, answerability,
> partial-evidence, and exact raw-outcome controls. Activates a measured phone/desktop resource
> ruler from one exact 3844701 paired baseline and three independent candidate runs. Binds
> certification to an Arc-local exact Edge 151 build without changing the Gate-A Edge 150 pin,
> and provisions that exact build only for Compendium CI.
>
> Browser-free local evidence: 33 files / 395 passed / 1 skipped; both TypeScript programs;
> no-unused checks; 117 Compendium controls; 20 focused budget/art tests; Vite, YAML, syntax and
> diff checks; independent immutable-byte audits clean. Exact-head Compendium certification exists
> only in the named verified ignored report; six-image HUMAN review, PR CI, integration,
> development publication, Arc 1B, release and production deployment remain separate authorities.

**Other side:** Anthropic/Claude Code does not need to be opened now. It may review the pushed
draft later from a clean synchronized anthropic/mac, but must not edit or copy this worktree. At its
next coding batch it must fetch and verify its own branch against current origin/develop.

**Release status:** D-TRAIN-1 is integrated at 3844701. Arc 1A is an OpenAI branch candidate only.
No develop to main merge, production release, version bump, manual deployment, or production-site
write was performed or authorized.
