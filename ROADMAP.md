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

## ▶▶▶ SESSION HANDOFF — 2026-08-17 · PR #32 BATTERY REPAIR ◀◀◀

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
- PR #32 contains the committed Arc 1A implementation and an exact clean-head Arc-local Compendium
  report through `65b1bace57cfbbfc57acbffe55537764a382c581`; that report was not full PR-battery
  certification. The first Linux battery correctly exposed a
  renderer-answerability defect during cold Planetside species art, plus stale Smoke settlement,
  Glass instrument/short-landscape geometry, and static-art audit defects.
- Commit `39d326fa69512508884cb92f85dbabe765989032` moves heavy species art into the dedicated-worker
  broker and repairs those three gate surfaces. Its full browser-free battery and independent source
  review are green. Browser path/CDP controls passed on that clean head; the one no-retry Smoke run
  then found a later stale Guide bulletin predicate shared with Glass (44/43 bullets and obsolete
  “only detail renders 440px” wording versus the canonical 47/46 and truthful publish/retain plus
  440→132 downsample contract). The cold Planetside path itself passed. Commit
  `6105c6f2b5a6413e45e5c6ed4e73594ae39e98f0` fixes both rendered predicates and independently
  controls all new text/category carriers. Its exact-head Smoke run passes. The first full Glass run
  then correctly withheld product judgment on two instrument-only faults: absent versus empty inline
  style after exact 243px restoration, and inherited text sampled on the transparent dock wrapper
  instead of its painted buttons. A bounded Glass-only repair is static/selftest green and its changed
  phone-landscape diagnostic passes with zero findings; a new commit, full clean-head Glass,
  Compendium certification, push, and exact-head PR CI remain outstanding.
- Nothing in this batch changes main, the production v1.8.9 page, a shipped version, a save schema,
  deterministic generation/share bytes, or either live-site repository.

### Arc 1A executable boundary

- The 1,500-entry Compendium now mounts only a virtual window with spacer-preserved scroll. Native
  filtering, visible and hidden Search entry, clear/reopen, deep Back, Close, selected-row focus,
  pinned focus rings, resize contraction/expansion, and one-generation publication remain bound to
  real DOM outcomes.
- List and Planetside portraits use one complete-genome-keyed `SpeciesArtBroker`. A cold row
  receives a neutral placeholder, cancellable/deduplicated work, a true 132 by 132 thumbnail, and a
  bounded cache; unmounted/closed owners release, queued orphan work cancels, settled subscribers
  clear, and desktop-to-phone cap changes trim immediately. Selected detail owns an asynchronous
  440px request through the same broker.
- Producer failure evidence is fail-closed: one proven-cold invariant row receives the exact
  one-shot error while it remains mounted, the error key stays uncached, and a natural close/reopen
  proves the same logical id/key recovers as a cached decoded 132px row. Ownership, lifetime
  counters, cache arithmetic, answerability, command order, and partial-report milestones are
  retained and verifier-bound.
- After full app wiring and a serviced render turn, at most one serial dedicated module worker at a
  time dynamically
  imports the portable painter, performs 440px scratch paint, 132px downsample and PNG encoding,
  validates document/producer/instance/job identity, and terminates after active work settles and
  its queue is empty. Each later genuinely new producer burst owns a fresh instance/import. The
  renderer has no synchronous painter fallback. Capability/import/protocol/worker failures
  terminate once and settle active plus queued owners without retrying every tile; paint/content
  encode failures stay per-job. Arc 1B still owns ordinary Pixi/canvas scene texture and
  long-session resource plateaus.

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
- Browser-free repair evidence is green: 36 test files, 423 passed and 1 skipped; root, app, and
  worker TypeScript programs; no-unused checks; 184 Compendium instrument controls; 28 focused
  broker/portable-painter/worker tests; every art/specification instrument; production Vite build
  with an exact `main → dedicated worker → worker-local painter` graph; and syntax/diff checks.
  Independent current-source review found no remaining browser-free blocker.
- The earlier exact clean-head report `20260817-arc1a-active-cert-65b1bac` remains truthful only for
  committed `65b1bac`; it cannot certify the repair working tree. A new report must be captured once
  on the clean committed repair head and independently verified against its exact source, inputs,
  active budget, Edge authority, raw profiles, outcomes, and six artifacts.

### PR #32 battery repair boundary

- Smoke now waits semantically for 3–8 decoded 132px Planetside images and drained jobs under one
  immutable monotonic 30-second phase. Every blocking target evaluation is clipped to the same
  remaining deadline; target-only timeout with a healthy browser heartbeat remains actionable
  product evidence, with no renewed clock or retry.
- Glass now negative-controls its Guide carrier predicate and audits real first/middle/last plus
  focus-pinned A++ rows with clipping-ancestor diagnosis. In short landscape the nonmodal
  Compendium uses the left safe-height workspace and recomputes its scroller from the safe viewport;
  Search, dock, and Survey when open remain visible, focusable, hit-testable, and operable at right.
  Panel-open status already yields trail/objective; the short-landscape rule additionally yields
  only noninteractive top/context/hint chrome. This is a bounded geometry fix, not a broad restyle
  or a v1.0-polish claim.
- Static evidence proves exactly one production owner-module → dedicated-worker → lazy-painter
  graph and rejects renderer-reachable legacy synchronous species art. The Compendium report binds
  worker identity, phase/result/error equations and semantic image decode; it cannot go green merely
  by moving heavy resources into an unmeasured retained worker.

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

1. Finish the reference/handoff refresh, fetch/reconcile current remote state, and commit the exact
   repair on `openai/mac` after frozen-diff review.
2. On that clean head, run browser path/CDP controls and one no-retry Chrome Smoke, full Chrome
   Glass matrix, and Arc-local Edge Compendium run plus independent exact-run verification.
3. Preserve the first browser red if any. If green, push the exact head to draft PR #32 and require
   the complete GitHub battery on that same SHA.
4. Leave the separate six-image HUMAN judgment and Claude presentation-polish review open. Do not
   translate hostile Glass evidence screenshots into ordinary Dev appearance or human approval.
5. Merge only a reviewed, terminal-green exact head through the normal `develop` path; then monitor
   the develop push battery and automatic development publication. Keep `main`, production
   versioning, and production deployment untouched.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS in
/Users/nick/Projects/celestial-frontier-openai-mac on openai/mac. Committed repair HEAD is
`6105c6f2b5a6413e45e5c6ed4e73594ae39e98f0`; only the bounded Glass style-serialization/painted-button
instrument repair and this handoff refresh remain uncommitted. Browser path/CDP controls and the
exact-head Smoke gate passed. The preserved full Glass instrument red was not retried unchanged;
after the repair, one changed dirty diagnostic passes the exact phone-landscape target with zero
findings. The complete browser-free suite and independent review are green. The prior Compendium
cert report is exact only for `65b1bac`; the new head still needs full clean-head Glass, Compendium,
and exact pushed CI. Resolve origin state live after the required fetch rather than trusting this
prose. The six-image HUMAN judgment remains separate.

**GitHub step:** OpenAI/Codex owns the intentional repair commit, clean-head one-attempt browser
evidence, push to the existing draft PR #32, exact-head checks, and normal integration monitoring.
Nick does not need to manipulate Git or open another app during that work. Do not touch `main`.

**PR details:** base develop; source openai/mac; copy-ready title
**Arc 1A — Bound Compendium portraits and measured resources**. Copy-ready description:

> Virtualizes the maximum 1,500-row Compendium, preserves native filter/focus/detail/close
> outcomes, and moves list plus Planetside art to complete-genome-keyed cancellable 132px leases.
> Heavy import, paint, downsample, and encoding run in at most one serial lazy dedicated worker at a
> time; each producer burst owns a fresh instance/import, and detail is
> asynchronous at 440px, renderer fallback is forbidden, and fatal worker/import/protocol paths
> settle owners exactly once without retry. Adds cold error/recovery, ownership, answerability,
> worker-phase, partial-evidence, and exact raw-outcome controls. Activates a measured phone/desktop resource
> ruler from one exact 3844701 paired baseline and three independent candidate runs. Binds
> certification to an Arc-local exact Edge 151 build without changing the Gate-A Edge 150 pin,
> and provisions that exact build only for Compendium CI. Repairs Smoke's semantic Planetside
> settlement, Glass's Guide/clipping instrument, the short-landscape nonmodal workspace, and the
> static owner-to-worker-to-painter build proof exposed by the first PR battery.
>
> Browser-free repair evidence: 36 files / 423 passed / 1 skipped; root/app/worker TypeScript;
> no-unused and all art/specification gates; 184 Compendium controls; 28 focused worker/art tests;
> exact Vite owner/worker/painter graph; syntax and diff checks; independent source audit clean.
> Exact-head repair browser evidence and PR CI remain required; six-image HUMAN review, integration,
> development publication, Arc 1B, release and production deployment remain separate authorities.

**Other side:** Anthropic/Claude Code does not need to be opened while Codex completes the repair
battery and push. After the exact PR head is green, open Claude for the requested presentation
review/polish from a separately fetched, clean `anthropic/*` worktree; it must not edit or copy this
OpenAI worktree.

**Release status:** D-TRAIN-1 is integrated at `3844701`. Arc 1A/PR #32 remains an OpenAI branch
candidate under repair. No `develop`→`main` merge, production release, version bump, manual
deployment, or production-site write was performed or authorized.
