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

## ▶▶▶ SESSION HANDOFF — 2026-08-19 · PR #32 BATTERY REPAIR ◀◀◀

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
  instead of its painted buttons. Commit
  `dea03913014bc58134ebb06ca5b36892210a7571` contains the bounded Glass-only repair, and its exact
  clean-head full Glass matrix passes all 12 rows. Its following exact Compendium run
  `20260817150005919-93781-b6643ba7a6` truthfully reports 75 of 76 outcomes, with only
  `desktop/warm-plateau` red. That red exposed a ruler/sequence defect rather than proving either a
  product leak or a clean plateau: the destructive desktop cap trim ran before the warm observation,
  so the gate measured cache refill, and the old heap ruler excluded embedder/backing ownership.
  Commit `4374d95be6c8b6ec2106ecd8518ac9bb39e32065` contains the fail-closed Compendium
  calibration seam, repairs that authority, and leaves the budget non-certifying; fresh
  calibration, certification, push, and exact-head PR CI remain open.
- The first fresh paired-baseline attempt is preserved as instrument evidence and produced no
  sample. It exposed a host/CDP observer race: one 132px pre-owner completion could land between a
  stable-count read and a separate phase-switch command. The bounded follow-up now drains the exact
  positive Planetside 440px roster, requires one internal 132px completion per visible owner, seals
  that expected count in the real opener's capture phase, and atomically seals the final 1,500 list
  completions with their quiet observation. A late owner completion turns evidence red rather than
  becoming catalogue work. The attempt also confirmed that the installed macOS Edge had
  auto-updated to 151.0.4129.93; it is not calibration authority and will not be used or silently
  re-baselined.
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

- The prior e4e8d1d observations and their paired 3844701 baseline remain historical calibration
  evidence only. They do not authorize an active ruler for the repaired worker-backed product: the
  observation sequence destructively trimmed the desktop cache before the warm plateau, and the heap
  summary counted used page heap without the embedder/backing ownership that can move when work moves
  out of the renderer.
- The checked-in Compendium budget is therefore intentionally `calibration-required`: candidate
  samples are empty, every candidate ceiling is null, and the paired baseline is
  `measurement-required`. This fail-closed state cannot emit a certification PASS. The current
  committed calibration seam moves cap control after a full native warm-cache observation; records
  used, embedder, backing-store, and aggregate heap; proves stable warm keys and reuse; retains a
  post-cap restored snapshot; embeds raw replayable calibration capsules; and binds the complete
  measurement-input and built owner-to-worker-to-painter authority.
- Activating a new ruler requires one fresh paired run from exact broken baseline
  `38447019517147319bd08c598202d097ee866874`, three independent one-attempt current-candidate runs
  for each phone and desktop profile, ceilings derived from those exact raw capsules with written
  rationale/headroom, and a later exact-head certification run. None of those fresh measurements or
  ceilings exists yet.
- Arc 1A owns a local cross-host browser-build authority:
  Edg/151.0.4129.86, revision @083e754915c9ab93da1d8f7b9c860e4520273900,
  JavaScript 15.1.23.7, protocol 1.3. Executable path and user agent remain recorded provenance.
  This does not change the Gate-A/root layout/legacy boot Edge 150 pin.
- The exact notarized universal macOS 151.0.4129.86 package is isolated under `/private/tmp` rather
  than installed over `/Applications`; its one verified executable path must be reused for the
  paired baseline, all three candidate runs, and final Compendium certification. The auto-updated
  151.0.4129.93 application is explicitly outside this authority.
- Ordinary and manual Compendium CI install the exact SHA-verified Edge package only for this gate.
  Other smoke, Glass, persona, and preview browser work keeps its established Chrome selection.
  Browser mismatch terminates before profiles as instrument evidence; it can never emit product
  PASS, FAIL, or product-unanswerable.

### Evidence and verifier state

- The earlier baseline/candidate artifacts received independent read-only audits and remain useful
  chronology, but their summaries and ceilings are superseded for current certification. The exact
  dea039 run `20260817150005919-93781-b6643ba7a6` is preserved as truthful 75/76 evidence; its sole
  desktop warm red must not be retried away or promoted into a product-leak diagnosis the instrument
  did not collect.
- The repaired terminal contract replays compact raw candidate and baseline capsules instead of
  trusting copied metric summaries. It binds the complete fixture/generator/schema/contract/
  collector/browser/lock/package/baseline-save/art-build/outcome input set, the exact built
  owner-module to worker to worker-local painter graph, budget bytes/status, browser authority,
  artifacts, attempt policy, and raw phone/desktop profiles. The budget remains deliberately
  non-certifying until fresh exact measurements populate those carriers and the verifier accepts
  their independently derived ceilings.
- Browser-free evidence for the current fail-closed seam is green: 36 Vitest files / 423 passed /
  1 skipped; root, app, and worker TypeScript programs; artunused, artaudit, and the exact production
  owner→worker→painter build graph; 222 Compendium selftest controls; 10 focused budget tests; and
  Smoke, Glass, and persona selftests. Frozen read-only review is clean. These results validate the
  calibration seam and non-certifying budget state; only fresh browser measurements can authorize
  ceilings or certification.
- The earlier exact clean-head report `20260817-arc1a-active-cert-65b1bac` remains truthful only for
  committed `65b1bac`; it cannot certify the current calibration seam. After fresh calibration activates
  a new budget, a new report must be captured once on the final clean committed head and independently
  verified against its exact source, inputs, budget, Edge authority, raw profiles, outcomes, and six
  artifacts.

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

- Arc 1A's product implementation exists, but automatable resource evidence is not ready for exact
  committed certification until the new ruler is calibrated and activated. Separately, the rubric
  remains open until a person reviews the six same-run phone/desktop list, focus-pinned, and detail
  PNGs for 132px list quality, 440px detail quality, hierarchy, clipping, and visible focus.
  Automated hashing, dimensions, and model inspection do not satisfy this HUMAN row.
- Arc 1A does not add Cargo, Shipyard, ownership inventory, creature instances, rewards, combat,
  missions, companions, crafting, research, live HD scene textures, or an Arc 1B GPU/scene-memory
  plateau. It does not close Gate C, Gate D, the full 21-step Training curriculum, human play,
  performance/heat on physical devices, a production release, or deployment.

### Next actions

1. Commit the observer-boundary follow-up with its refreshed exact measurement authority. Under the
   one isolated Edge 151.0.4129.86 executable, capture one new paired exact-3844701 baseline and
   three independent one-attempt current-candidate runs per profile. Derive and document new
   ceilings from their raw capsules, activate the budget, review the diff, and commit the ruler.
2. On that final clean head, run browser path/CDP controls, one no-retry Chrome Smoke, full Chrome
   Glass matrix, and Arc-local Edge Compendium certification plus independent exact-run verification.
   Preserve the first browser red if any; if terminal green, push the exact head to draft PR #32 and
   require the complete GitHub battery on that same SHA.
3. Leave the separate six-image HUMAN judgment and Claude presentation-polish review open. Do not
   translate hostile Glass evidence screenshots into ordinary Dev appearance or human approval.
4. Merge only a reviewed, terminal-green exact head through the normal `develop` path; then monitor
   the develop push battery and automatic development publication. Keep `main`, production
   versioning, and production deployment untouched.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS in
/Users/nick/Projects/celestial-frontier-openai-mac on openai/mac. The committed branch contains the
product/Glass repair through `dea03913014bc58134ebb06ca5b36892210a7571` plus the current
fail-closed ruler-calibration batch. Exact dea039 Glass passes all 12 rows. The
following exact Compendium run `20260817150005919-93781-b6643ba7a6` is preserved as a truthful
75/76 FAIL solely at `desktop/warm-plateau`; it exposed the pre-warm destructive cap sequence and
incomplete heap ruler, not a proven product leak. Commit `4374d95be6c8b6ec2106ecd8518ac9bb39e32065`
contains the Compendium calibration seam and leaves
the budget `calibration-required`; its full browser-free battery and frozen review are green.
The first new baseline attempt produced no sample and is preserved as an observer-boundary
instrument failure; the capture-phase/count-bound follow-up is current. Fresh exact-3844701
baseline evidence, three current-candidate runs per
profile, an activated ruler, exact-head certification, push, and CI are still required. Resolve
origin state live after the required fetch rather than trusting this prose. The six-image HUMAN
judgment and Claude presentation-polish review remain separate.

**GitHub step:** OpenAI/Codex owns the fresh baseline/candidate calibration, ruler activation,
clean-head one-attempt certification evidence, push to the existing draft PR #32, exact-head checks,
and normal integration monitoring.
Nick does not need to manipulate Git or open another app during that work. Do not touch `main`.

**PR details:** base develop; source openai/mac; copy-ready title
**Arc 1A — Bound Compendium portraits and measured resources**. Copy-ready description:

> Virtualizes the maximum 1,500-row Compendium, preserves native filter/focus/detail/close
> outcomes, and moves list plus Planetside art to complete-genome-keyed cancellable 132px leases.
> Heavy import, paint, downsample, and encoding run in at most one serial lazy dedicated worker at a
> time; each producer burst owns a fresh instance/import, and detail is
> asynchronous at 440px, renderer fallback is forbidden, and fatal worker/import/protocol paths
> settle owners exactly once without retry. Adds cold error/recovery, ownership, answerability,
> worker-phase, partial-evidence, and exact raw-outcome controls. Rebuilds the phone/desktop resource
> ruler around full native-cache warm observation, aggregate page/embedder/backing ownership,
> stable-key reuse, post-cap restoration, replayable raw calibration capsules, and complete input
> plus built-producer authority. The budget remains fail-closed until a fresh exact 3844701 paired
> baseline and three independent current-candidate runs per profile authorize new ceilings. Binds
> certification to an Arc-local exact Edge 151 build without changing the Gate-A Edge 150 pin,
> and provisions that exact build only for Compendium CI. Repairs Smoke's semantic Planetside
> settlement, Glass's Guide/clipping instrument, the short-landscape nonmodal workspace, and the
> static owner-to-worker-to-painter build proof exposed by the first PR battery.
>
> Committed product/Glass evidence includes an exact 12/12 Glass matrix. The first following exact
> Compendium run is preserved as a truthful 75/76 ruler failure, not product-leak proof. The repaired
> calibration seam is browser-free green (36 files / 423 passed / 1 skipped; three TypeScript
> programs; art/build gates; 222 Compendium controls; 10 budget tests; Smoke/Glass/persona
> selftests) and still requires fresh paired baseline plus three-run candidate calibration,
> activated ceilings, exact-head browser certification and PR CI. Six-image
> HUMAN review, integration,
> development publication, Arc 1B, release and production deployment remain separate authorities.

**Other side:** Anthropic/Claude Code does not need to be opened while Codex completes the repair
battery and push. After the exact PR head is green, open Claude for the requested presentation
review/polish from a separately fetched, clean `anthropic/*` worktree; it must not edit or copy this
OpenAI worktree.

**Release status:** D-TRAIN-1 is integrated at `3844701`. Arc 1A/PR #32 remains an OpenAI branch
candidate under repair. No `develop`→`main` merge, production release, version bump, manual
deployment, or production-site write was performed or authorized.
