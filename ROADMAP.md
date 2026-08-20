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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 ANSWERABILITY REPAIR + RECALIBRATION ◀◀◀

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
  calibration seam, repairs that authority, and leaves the budget non-certifying. At that
  checkpoint, fresh calibration, certification, push, and exact-head PR CI remained open.
- The first fresh paired-baseline attempt is preserved as instrument evidence and produced no
  sample. It exposed a host/CDP observer race: one 132px pre-owner completion could land between a
  stable-count read and a separate phase-switch command. The bounded follow-up now drains the exact
  positive Planetside 440px roster, requires one internal 132px completion per visible owner, seals
  that expected count in the real opener's capture phase, and atomically seals the final 1,500 list
  completions with their quiet observation. A late owner completion turns evidence red rather than
  becoming catalogue work. The attempt also confirmed that the installed macOS Edge had
  auto-updated to 151.0.4129.93; it is not calibration authority and will not be used or silently
  re-baselined.
- After that boundary repair, paired run `20260819-arc1a-baseline2-d0508ec` measured cleanly under
  exact Edge 151.0.4129.86 and independently reproduced all four sealed baseline faults on both
  profiles. Candidate run `20260819-arc1a-candidate1-d0508ec` then stopped the sequence with only
  `phone/warm-precondition` and `desktop/warm-precondition` red and produced no candidate sample.
  The caches were full, decoded bytes exact, work drained, subscribers zero, and workers released;
  the instrument instead required an insertion-ordered LRU key list to be lexically sorted and made
  every warm cycle traverse more identities than the phone cache can retain, guaranteeing repaint
  and worker churn. The current bounded follow-up measures one fixed retained window after filling
  the native cache and proves exact unique key identity plus unchanged job/disposal/worker counters
  across the sealed last-three-cycle plateau.
  Because that changes collector/contract authority, the green baseline2 evidence remains preserved
  chronology but must be recaptured before activation. No unchanged candidate rerun occurred.
- The replacement authority was measured and activated for the pre-scheduler product. Paired broken-
  baseline run `20260820-arc1a-baseline3-21af3fa` and independent one-attempt candidate runs
  `20260820-arc1a-candidate2-21af3fa`, `20260820-arc1a-candidate3-21af3fa`, and
  `20260820-arc1a-candidate4-21af3fa` all bind clean committed collector/product source
  `21af3fa2c096f0590b067c0af578d7ea29000378`, measurement authority
  `bb03a3af59cdcc9d4d3773c1396e58b350c27facd99943cbd22028f2236d6a1c`, producer authority
  `291b794e0dcd93ee21d7ff88cbca383e865a62e8dd162573d475131aca3b911e`, and the one isolated
  Edge 151.0.4129.86 build. The then-active budget embeds and replays those raw capsules, applies strict
  ceilings above all three candidate maxima, and adds aggregate page + embedder + backing-store
  heap. Its fixed-window last-three-cycle plateau keeps identity and job/disposal/worker counters
  stable. The paired baseline preserves all four sealed faults and breaches 14 phone ceilings and
  13 desktop ceilings. Commit `da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` activated that ruler.
  Its local one-attempt Arc-local Edge certification
  `20260820-arc1a-active-cert-da0de20` passed and independently verified. The same clean head also
  passed one no-retry Chrome Smoke, the full 12-viewport Chrome Glass matrix, the matching nine-
  persona join, root layout 787/787 across 10/10, and a verified nonpublishable exact-source preview.
- PR battery run `32334254714`, attempt 1, then correctly stayed red without retry. Its Compendium
  report `gha-32334254714-1-compendiummem` bound clean detached PR test-merge
  `88b9c7b0aa90b860a5474bd099cfab48b125a3f5`, exact Edge 151.0.4129.86, the active budget bytes,
  and matching producer `291b794e…`. Phone completed 29 stages through veteran-Earth boot readiness;
  `Planetside thumb settlement` then missed the unchanged 2,000 ms target bound at 2,001.723 ms while
  the independent browser heartbeat answered in 0.872 ms. That is terminal
  `product-unanswerable`, not an instrument, browser, or transport result; desktop never ran.
- The partial report did not retain producer phase, so it cannot attribute the exact timeout.
  Source inspection showed that worker completion could publish several messages, after which the
  broker's zero-delay successor pumps could repeatedly win over rendering, input, and inspector
  work on constrained Linux. The frozen repair makes every default broker pump cross one
  rendering opportunity and then one later task (`requestAnimationFrame` → `setTimeout(0)`). Broker
  pump-generation invalidation makes a callback armed before bfcache suspension or disposal stale;
  resume schedules a fresh serviced turn. This changes the built owner and therefore producer
  authority to `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`
  (`assets/main-BAg-DH_f.js`; worker and painter unchanged).
- Commit `f47cd381699fb1934f30bfca82fc9bf971714e6d` freezes the serviced-turn scheduler and its
  fail-closed calibration seam. Fresh paired broken-baseline run
  `20260820-arc1a-serviced-turn-baseline4` and independent candidate runs
  `20260820-arc1a-serviced-turn-candidate5`, `candidate6`, and `candidate7` all used that clean
  collector/product source, measurement authority `bb03a3af…`, producer `1c8200d7…`, and exact
  Edge 151.0.4129.86. Every run was one attempt with zero retries; each candidate produced all
  78 outcomes. The tracked ruler is active again with strict ceilings above the replayed three-run
  maxima. The paired baseline retains all four sealed faults and breaches 14 phone / 13 desktop
  ceilings. Exact-head certification/browser gates, push, and PR CI remain pending.
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
- After full app wiring, every default broker pump waits for one rendering opportunity and then one
  later task before dispatch. At most one serial dedicated module worker at a
  time dynamically
  imports the portable painter, performs 440px scratch paint, 132px downsample and PNG encoding,
  validates document/producer/instance/job identity, and terminates after active work settles and
  its queue is empty. Each later genuinely new producer burst owns a fresh instance/import. The
  renderer has no synchronous painter fallback. Capability/import/protocol/worker failures
  terminate once and settle active plus queued owners without retrying every tile; paint/content
  encode failures stay per-job. Arc 1B still owns ordinary Pixi/canvas scene texture and
  long-session resource plateaus. Bfcache suspension invalidates an already-armed pump generation;
  resume schedules a fresh serviced turn rather than accepting the stale callback.

### Measured resource authority

- The prior e4e8d1d observations and their paired 3844701 baseline remain historical calibration
  evidence only. They do not authorize an active ruler for the repaired worker-backed product: the
  observation sequence destructively trimmed the desktop cache before the warm plateau, and the heap
  summary counted used page heap without the embedder/backing ownership that can move when work moves
  out of the renderer.
- The historical da0 ruler embedded paired run
  `20260820-arc1a-baseline3-21af3fa` from exact broken source
  `38447019517147319bd08c598202d097ee866874` plus candidate2/3/4 from clean committed source
  `21af3fa2c096f0590b067c0af578d7ea29000378`. Every ceiling is strictly above its corresponding
  three-run maximum, with written headroom for variable heap/DOM/encoded-byte ranges and fractional
  or +1 sentinels for product-owned exact caps. Aggregate heap covers page, embedder, and backing
  ownership. The fixed retained-window last-three-cycle plateau requires stable unique keys and
  unchanged job starts, disposals, and worker starts/disposals. The broken baseline retains all four
  sealed faults and crosses 14 phone and 13 desktop ceiling fields. Those facts are not current
  ceilings for the repaired producer.
- The active tracked budget retains measurement authority
  `bb03a3af59cdcc9d4d3773c1396e58b350c27facd99943cbd22028f2236d6a1c` and binds built producer
  `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`. Its paired baseline4 report /
  sample SHA-256 values are `1b10dba0…` / `0c407845…`; candidate5, candidate6, and candidate7 report /
  sample pairs are `fdfb47c5…` / `c529d2a0…`, `4a3197e1…` / `a4077246…`, and `479623b1…` /
  `05b7e346…`. Every one of 40 profile ceiling fields is strictly above its corresponding three-run
  maximum. Product-owned caps use fractional/+1 sentinels; variable heap/DOM/encoded fields use
  written headroom. The desktop warm aggregate range maximum was 436,412 bytes, so its 524,288-byte
  ceiling retains 87,876 bytes of headroom while remaining below the paired baseline's 795,378-byte
  observation. The earlier producer `291b794e…` and ruler remain preserved chronology, not current
  authority. The eventual committed activation head still needs one no-retry certification and
  independent replay before PR push/CI.
- Arc 1A owns a local cross-host browser-build authority:
  Edg/151.0.4129.86, revision @083e754915c9ab93da1d8f7b9c860e4520273900,
  JavaScript 15.1.23.7, protocol 1.3. Executable path and user agent remain recorded provenance.
  This does not change the Gate-A/root layout/legacy boot Edge 150 pin.
- The exact notarized universal macOS 151.0.4129.86 package is isolated under `/private/tmp` rather
  than installed over `/Applications`; its one verified executable path was reused for the fresh
  paired broken baseline and all three fresh candidate runs and must be reused for final Compendium
  certification.
  The auto-updated
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
- The later exact-.86 `baseline2-d0508ec` sample is independently clean and its raw capsules remain
  truthful for authority `829655e2…`, but the fixed-window warm repair changes that authority and
  therefore prevents reuse. Candidate1 is preserved as a two-outcome warm-instrument FAIL with no
  sample; it is not a product-retention diagnosis.
- The repaired terminal contract replays compact raw candidate and baseline capsules instead of
  trusting copied metric summaries. It binds the complete fixture/generator/schema/contract/
  collector/browser/lock/package/baseline-save/art-build/outcome input set, the exact built
  owner-module to worker to worker-local painter graph, budget bytes/status, browser authority,
  artifacts, attempt policy, and raw phone/desktop profiles. Baseline4 and candidate5/6/7 populate
  the current carriers under exact authority `bb03a3af…` and producer `1c8200d7…`; their strict
  ceilings were independently derived from replayed raw reductions. Baseline3 and candidate2/3/4
  remain historical carriers for old producer `291b794e…`.
- Browser-free evidence for the historical fail-closed seam is green: 36 Vitest files / 423 passed /
  1 skipped; root, app, and worker TypeScript programs; artunused, artaudit, and the exact production
  owner→worker→painter build graph; 222 Compendium selftest controls; 10 focused budget tests; and
  Smoke, Glass, and persona selftests. Frozen read-only review is clean. These results validated the
  historical calibration seam. The serviced-turn scheduler, bfcache generation, and fail-closed
  calibration seam then passed their separate browser-free review before commit `f47cd381…`.
- The successor da0 active-ruler diff was independently clean: 36 Vitest files / 424 passed / 1
  skipped; all three TypeScript programs; 222 Compendium controls; 11 focused budget tests; exact
  sample-object, raw-reducer, authority, ceiling, and broken-baseline replay; art/spec/build gates;
  root validate and smoke; and Smoke, Glass, and persona selftests. Every one of 40 profile ceiling
  fields is strictly above its measured maximum. This is still browser-free activation authority,
  and its exact local Edge certification passed. That local result remains truthful only for da0;
  the preserved Linux CI product-unanswerable red prevents PR authority.
- The current serviced-turn active-ruler pair is frozen against baseline4 and candidate5/6/7.
  Focused budget replay passes 11/11 and all 222 Compendium instrument selftest controls pass.
  The exact tracked budget/test SHA-256 pair is
  `2b51dd23728fb6431c5c71dd464592e75471c9c1919f1d65ceb2e0c6be96e2d5` /
  `71048f473e9575a1cce804c08a2e9ddc975caee2fc6f5d780fe189f3d3926cae`.
  These are browser-free activation checks, not final exact-head Compendium certification or PR CI.
- The exact clean-head reports `20260817-arc1a-active-cert-65b1bac` and
  `20260820-arc1a-active-cert-da0de20` remain truthful only for their named commits and producers;
  neither can certify the serviced-turn repair. A new report must be captured once on the final clean
  committed activation head and independently
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

- Arc 1A's product implementation, serviced-turn repair, and fresh active ruler exist. Automatable
  resource evidence is not terminal until the activation bytes are committed and certified on their
  exact head, then the same SHA passes PR CI. Separately, the rubric remains open until a person
  reviews six fresh same-run phone/desktop list, focus-pinned, and detail
  PNGs for 132px list quality, 440px detail quality, hierarchy, clipping, and visible focus.
  Automated hashing, dimensions, and model inspection do not satisfy this HUMAN row.
- Arc 1A does not add Cargo, Shipyard, ownership inventory, creature instances, rewards, combat,
  missions, companions, crafting, research, live HD scene textures, or an Arc 1B GPU/scene-memory
  plateau. It does not close Gate C, Gate D, the full 21-step Training curriculum, human play,
  performance/heat on physical devices, a production release, or deployment.

### Next actions

1. Finish scoped review of the active budget/test/docs pair and commit those exact activation bytes
   without claiming browser certification.
2. On that final clean activation head, run browser path/CDP controls, one no-retry Chrome Smoke, full
   Chrome Glass matrix, and Arc-local Edge Compendium certification plus independent exact-run
   verification. Preserve the first browser red if any; if terminal green, push the exact head to
   draft PR #32 and require the complete GitHub battery on that same SHA.
3. Leave the separate fresh six-image HUMAN judgment and Claude presentation-polish review open. Do not
   translate hostile Glass evidence screenshots into ordinary Dev appearance or human approval.
4. Merge only a reviewed, terminal-green exact head through the normal `develop` path; then monitor
   the develop push battery and automatic development publication. Keep `main`, production
   versioning, and production deployment untouched.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS in
/Users/nick/Projects/celestial-frontier-openai-mac on openai/mac. The committed branch contains the
product/Glass repair through `dea03913014bc58134ebb06ca5b36892210a7571` plus da0's historical
ruler activation and the current serviced-turn repair. Exact dea039 Glass passes all 12 rows. The
following exact Compendium run `20260817150005919-93781-b6643ba7a6` is preserved as a truthful
75/76 FAIL solely at `desktop/warm-plateau`; it exposed the pre-warm destructive cap sequence and
incomplete heap ruler, not a proven product leak. Commit `4374d95be6c8b6ec2106ecd8518ac9bb39e32065`
contains the original fail-closed Compendium calibration seam; its full browser-free battery and
frozen review are green.
The first new baseline attempt produced no sample and is preserved as an observer-boundary
instrument failure. Baseline2 then measured cleanly under exact .86, but candidate1 exposed the
sorted-LRU/multi-window warm-instrument defect; its fixed-window repair changes authority. Baseline3
and candidate2/3/4 populated da0's now-stale ruler under exact clean `21af3fa2…`, authority
`bb03a3af…`, producer `291b794e…`, and isolated Edge .86. Da0's local certification and Chrome gates
passed, but PR run `32334254714` retained a one-attempt phone Planetside product-unanswerable red.
The repaired producer is `1c8200d7…`. Baseline4 and candidate5/6/7 now populate its active ruler;
focused replay and the 222-control selftest pass. Exact-head certification, browser gates, push, and
CI are still required. Resolve
  origin state live after the required fetch rather than trusting this prose. The fresh six-image HUMAN
judgment and Claude presentation-polish review remain separate.

**GitHub step:** OpenAI/Codex owns the scheduler-repair and recalibration commits, clean-head one-
attempt certification evidence, push to the existing draft PR #32, exact-head checks,
and normal integration monitoring.
Nick does not need to manipulate Git or open another app during that work. Do not touch `main`.

**PR details:** base develop; source openai/mac; copy-ready title
**Arc 1A — Bound Compendium portraits and measured resources**. Copy-ready description:

> Virtualizes the maximum 1,500-row Compendium, preserves native filter/focus/detail/close
> outcomes, and moves list plus Planetside art to complete-genome-keyed cancellable 132px leases.
> Heavy import, paint, downsample, and encoding run in at most one serial lazy dedicated worker at a
> time; each default broker pump crosses one rendering opportunity and one later task, bfcache
> suspension invalidates stale armed pumps, each producer burst owns a fresh instance/import, and detail is
> asynchronous at 440px, renderer fallback is forbidden, and fatal worker/import/protocol paths
> settle owners exactly once without retry. Adds cold error/recovery, ownership, answerability,
> worker-phase, partial-evidence, and exact raw-outcome controls. Rebuilds the phone/desktop resource
> ruler around full native-cache warm observation, aggregate page/embedder/backing ownership,
> stable-key reuse, post-cap restoration, replayable raw calibration capsules, and complete input
> plus built-producer authority. Da0's historical budget embeds exact baseline3 plus three independent
> candidate runs and applies strict ceilings above their observed maxima; its local certification and
> Chrome gates passed. PR CI then retained a no-retry phone Planetside product-unanswerable red. The
> serviced-turn repair changes producer authority to `1c8200d7…`; fresh one-attempt baseline4 and
> candidate5/6/7 now activate its strict replayed-raw ruler, with four retained baseline faults and
> 14 phone / 13 desktop ceiling breaches. Binds
> certification to an Arc-local exact Edge 151 build without changing the Gate-A Edge 150 pin,
> and provisions that exact build only for Compendium CI. Repairs Smoke's semantic Planetside
> settlement, Glass's Guide/clipping instrument, the short-landscape nonmodal workspace, and the
> static owner-to-worker-to-painter build proof exposed by the first PR battery.
>
> Committed product/Glass evidence includes an exact 12/12 Glass matrix. The first following exact
> Compendium run is preserved as a truthful 75/76 ruler failure, not product-leak proof. The repaired
> calibration seam and historical da0 ruler are browser-free green (36 files / 424 passed / 1 skipped;
> three TypeScript programs; art/build gates; 222 Compendium controls; 11 budget tests;
> Smoke/Glass/persona selftests). The serviced-turn activation pair passes focused 11/11 budget replay
> and all 222 instrument controls. Exact-head browser certification and PR CI remain open. Fresh six-image
> HUMAN review, integration,
> development publication, Arc 1B, release and production deployment remain separate authorities.

**Other side:** Anthropic/Claude Code does not need to be opened while Codex completes the repair
battery and push. After the exact PR head is green, open Claude for the requested presentation
review/polish from a separately fetched, clean `anthropic/*` worktree; it must not edit or copy this
OpenAI worktree.

**Release status:** D-TRAIN-1 is integrated at `3844701`. Arc 1A/PR #32 remains an OpenAI branch
candidate under repair. No `develop`→`main` merge, production release, version bump, manual
deployment, or production-site write was performed or authorized.
