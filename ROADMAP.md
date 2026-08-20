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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 CDP DEADLINE REPAIR + RECALIBRATION ◀◀◀

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

- D-TRAIN-1 is integrated through PR #31 at exact develop merge
  `38447019517147319bd08c598202d097ee866874`, the branch's current base and Arc 1A broken-baseline
  authority. The completed pre-serviced-turn PR #32 chronology now lives byte-verbatim at the top of
  `ROADMAP_ARCHIVE.md`; it remains evidence for its named source and was not deleted or rewritten.
- PR #32's live boundary is the repaired dedicated-worker product, serviced-turn scheduler, active
  measured ruler, committed multi-target Smoke ownership repair, and the current D-TRAIN fixture-
  ownership instrument follow-up. Historical product, Glass, ruler, and first-red detail remains in
  the archive and `audits/PR32_FAILURE_REPAIR_REVIEW_2026-08-17.md`.
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
  ceilings. Commit `78813cd25c67f4255282f418ea6f635a45e0fc29` activates that ruler. Its one-attempt
  Arc-local Edge run `20260820-arc1a-serviced-turn-active-cert-78813cd` passed all 78 outcomes with
  zero findings/retries and independently verified at report SHA-256 `0d4a7f80…`; the same head's
  root Chrome layout gate passed 787/787 across 10/10 viewports.
- The first following exact-head Chrome Smoke run
  `20260820063539761-70885-f80e1a2198fc` is preserved at report/log SHA-256
  `d2919f0e…` / `4b5de237…`, with one attempt and zero retries. Its only finding was the 30-second
  held-painter Compendium refill wait returning `last null`. Source/order audit found that the
  harness created a second target but never re-established or proved foreground authority for the
  live owner before releasing the painter and waiting for successor pumps that intentionally require
  `requestAnimationFrame` → later-task service. The report retained neither foreground authority nor
  the terminal image/worker phase, so it is instrument evidence rather than a visible-page product
  finding and cannot identify the exact stalled substate. This batch repairs that ownership boundary:
  it binds attach-derived target plus document identity, explicitly activates/focuses/brings forward
  each owner, proves a continuously visible/focused rAF→later-task turn before observation, keeps one
  immutable 30-second refill deadline/no retry, and retains rich image/worker/broker diagnostics.
  Commit `ef6c2c2cd31363cf47899a89c16c0d9f5f90d7a7` freezes that instrument repair.
- Exact ef6 Arc-local Edge run `20260820-arc1a-serviced-turn-active-cert-ef6c2c2` then passed all
  78 Compendium outcomes with zero findings, blocked outcomes, partial failure, or retries. Its
  report SHA-256 is `406edea11fec5f5a3cf11e6f9fc6dfea00cbdd2ce54fefed780bd1c9dafc9282`,
  and named-run verification passed. This certifies ef6's unchanged producer/ruler bytes, not any
  later Smoke-instrument head or PR CI.
- The immediately following one-attempt Chrome Smoke run
  `20260820071826194-75001-c2a22330fd09` is preserved at report/log SHA-256
  `65ca06c8f6d26ef3a9a3da19bb4bc09bb005d754f2291f55f389ac1ecf14aa46` /
  `87b1c8b6308d3a1969fb45ea4c2ccb70d1f46c2a8311751984b3c1ab0acdd7d9`. It bound clean committed
  ef6, Chrome for Testing 152.0.7977.54, 150,963 ms, ten screenshots, zero retries, and no source
  change. Its only two findings were the missing D-TRAIN import-owner busy-refusal witness and the
  same phase's absent Skip action (`button:false`, `witness:null`). The foreground Compendium phase
  and every other reported Smoke outcome stayed clean.
- That red is a harness setup race, not evidence that the product's busy-refusal branch failed. The
  fixture helper directly wrote IndexedDB after the preceding Atlas/Land journey without first
  joining its ordinary persistence owner, then proved only a changed document token; an older write
  could replace the fixture before the new page loaded. The report did not retain the winning bytes,
  so it cannot identify their exact value. The bounded follow-up drains the prior writer, deliberately
  reproduces the stale-write race as a negative control, requires exact fixture bytes plus current
  document/Training route/card/runnable Skip/idle status/ticker before judging the product, and waits
  semantically for the busy refusal. Exact pushed head `1187de0d052761e4463524cde8438ea8810d7149`
  contains that bounded follow-up; its local carriers
  remain authority only for their named exact-source runs.
- GitHub Actions run `32350971816`, job `96369841133`, workflow attempt 1, tested synthetic PR merge
  `25200b616bbd509f50eaa18f0a8b27ad20dc83e0` (base `38447019517147319bd08c598202d097ee866874`, head
  `1187de0d052761e4463524cde8438ea8810d7149`) and stayed red without retry. Valid report
  `gha-32350971816-1-compendiummem` is `instrument-fail`, not product evidence: after 29 phone stages,
  final `Runtime.evaluate` timed out at `1999.758726` ms against 2,000 ms while still timely and
  `0.241274` ms before its deadline; root heartbeat fulfilled in `7.410808` ms. The contract emitted
  one instrument finding, zero outcomes, and 78 blocked. Artifact/report/job-log SHA-256 values are
  `4932fb229c1de1d3820d2322e8273ce9ed609716c8f9f4d9e82b2fa2a3e408c7`,
  `1718faa4403f4f569899d9d328f08c3b7decafae23829d5fabe37660c36da43b`, and
  `7eda5facdac45d192c5b6071ac91394678d2fdb69b7992b218e0d3b0cb9c4ca9`.
- The bounded launcher repair keeps one absolute monotonic command deadline; an early callback
  re-arms only the remaining time and rejects only at/after the boundary. No cap, retry, or product
  oracle changes. A command that expires synchronously while arming is never transmitted. Frozen
  `browsercdp.mjs` SHA-256 is `36a832bc8cc32ba56373d1fa6d7339903a37a07b337fbf2748bbf95e489061d0`.
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
- The tracked budget was active for pre-timer measurement authority
  `bb03a3af59cdcc9d4d3773c1396e58b350c27facd99943cbd22028f2236d6a1c` and binds built producer
  `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`. Its paired baseline4 report /
  sample SHA-256 values are `1b10dba0…` / `0c407845…`; candidate5, candidate6, and candidate7 report /
  sample pairs are `fdfb47c5…` / `c529d2a0…`, `4a3197e1…` / `a4077246…`, and `479623b1…` /
  `05b7e346…`. Every one of 40 profile ceiling fields is strictly above its corresponding three-run
  maximum. Product-owned caps use fractional/+1 sentinels; variable heap/DOM/encoded fields use
  written headroom. The desktop warm aggregate range maximum was 436,412 bytes, so its 524,288-byte
  ceiling retains 87,876 bytes of headroom while remaining below the paired baseline's 795,378-byte
  observation. The earlier producer `291b794e…` and ruler remain preserved chronology, not current
  authority. Exact committed ef6 certification and its named-run verification passed. Run
  `32350971816` matched those pre-repair measurement, budget, browser, and producer carriers; its
  early timer is instrument evidence. Because `browsercdp.mjs` is itself a measurement-authority
  input, the frozen repair changes authority to `f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409`.
  Budget SHA-256 `a41ff08b8a58e776c789f09e7294c1cb2c0f44da8406f81c55f0754076337c30` is now fail-closed
  `calibration-required`. Capture a fresh paired broken baseline plus three independent candidates,
  then activate/certify once; old capsules cannot certify this successor authority.
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
  the last pre-timer carriers under exact authority `bb03a3af…` and producer `1c8200d7…`; their strict
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
- The last frozen serviced-turn active-ruler pair is bound to baseline4 and candidate5/6/7.
  Focused budget replay passes 11/11 and all 222 Compendium instrument selftest controls pass.
  The exact tracked budget/test SHA-256 pair is
  `2b51dd23728fb6431c5c71dd464592e75471c9c1919f1d65ceb2e0c6be96e2d5` /
  `71048f473e9575a1cce804c08a2e9ddc975caee2fc6f5d780fe189f3d3926cae`.
  Commit `78813cd25c67f4255282f418ea6f635a45e0fc29` subsequently passed one exact-head
  Compendium certification and independent named-run verification. Committed instrument head ef6
  also passed its own exact-source 78/78 certification and named verifier; neither result is PR CI.
- The exact clean-head reports `20260817-arc1a-active-cert-65b1bac` and
  `20260820-arc1a-active-cert-da0de20` remain truthful only for their named commits and producers;
  neither certifies the serviced-turn repair. The exact-788 and exact-ef6 reports each certify only
  their named sources. The later exact PR test-merge carrier is the instrument red recorded above;
  its valid terminal report does not certify a product profile. Source identity is not borrowed
  across commits, and the repaired timer requires a newly calibrated measurement authority.

### PR #32 battery repair boundary

- Smoke now waits semantically for 3–8 decoded 132px Planetside images and drained jobs under one
  immutable monotonic 30-second phase. Every blocking target evaluation is clipped to the same
  remaining deadline; target-only timeout with a healthy browser heartbeat remains actionable
  product evidence, with no renewed clock or retry.
- A multi-target Smoke phase that observes rendering-opportunity-scheduled work must own the page it
  judges. Creating another target may background the first while `Runtime.evaluate` remains
  answerable. The held-painter lazy-art control therefore binds the attach-derived target and exact
  document, activates/focuses/brings that target forward, proves visibility/focus continuously across
  an rAF→later-task witness, and only then performs its one release. The closed owner is separately
  re-owned before its settlement assertion. Wrong target/document/token, hidden/unfocused service,
  phase reversal, and visibility/focus transitions are browser-free negative controls; timeout
  evidence retains the actual images, queue, worker phases/results/errors, and broker state. Exact-
  boundary and just-late receipts are rejected after the awaited CDP response, not trusted to timer order.
- A direct test-fixture write is not setup authority while an earlier app persistence owner can
  still commit. D-TRAIN setup now joins the prior Atlas/Land write, proves the stale-write race in a
  deliberate control, then requires exact primary bytes, changed document identity, canonical
  Training state/rendered route, live card, runnable Skip, idle status, and running ticker before
  the import-owner transaction begins. Missing setup becomes one harness failure before release;
  the product busy-refusal verdict requires a semantically observed `claim-rejected/busy` witness,
  one real Skip click, unchanged primary bytes, and zero writes before owner release.
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

- Arc 1A's product, serviced-turn repair, historical ruler, and exact-788/ef6 local certifications
  remain preserved. Run `32350971816` stops current push eligibility at fail-closed recalibration;
  approval still requires one complete same-head battery and corresponding terminal-green PR
  test-merge. This handoff records that instrument red without promoting it to product evidence.
  Separately, the rubric remains open until a person reviews six fresh same-run phone/desktop list,
  focus-pinned, and detail
  PNGs for 132px list quality, 440px detail quality, hierarchy, clipping, and visible focus.
  Automated hashing, dimensions, and model inspection do not satisfy this HUMAN row.
- Arc 1A does not add Cargo, Shipyard, ownership inventory, creature instances, rewards, combat,
  missions, companions, crafting, research, live HD scene textures, or an Arc 1B GPU/scene-memory
  plateau. It does not close Gate C, Gate D, the full 21-step Training curriculum, human play,
  performance/heat on physical devices, a production release, or deployment.

### Exact-head transition rule

1. Preserve frozen launcher/budget authority `f9710bdf…` in fail-closed `calibration-required`, then
   capture a fresh paired broken baseline and three independent candidates before activating a
   successor ruler. No prior capsule or PASS may cross that boundary.
2. Resolve the exact head, target bytes, worktree, and upstream before the run. From that one clean
   committed head, run browser path/CDP controls, Arc-local Edge Compendium certification and named
   verifier, one no-retry Chrome Smoke, full Chrome Glass, persona join, root layout plus exact-run
   verification, and a verified nonpublishable preview package plus browser smoke.
3. Immediately preserve Smoke's overwrite-prone generic report/log as exact run-ID-named copies.
   Preserve the other ignored report/package carriers before another producer may overwrite them.
4. Browser path/CDP controls and preview browser smoke are terminal-only checks, not tool-written
   reports; capture their contemporaneous output. Root layout has an exact run/browser/outcome
   carrier but no embedded Git source, so require a commit-tagged run ID, unchanged target bytes,
   and matching clean HEAD/status before and after its run and verifier.
5. Any red, ambiguous, blocked, mixed-source, unverifiable carrier, or terminal-only failure stops
   the transition and is preserved without an unchanged retry.
6. If and only if every durable carrier, verifier, terminal-only check, and repository-identity
   proof above is green and agrees on the same unchanged head, push that exact head to draft PR #32
   without another tracked edit.
7. Require CI to evaluate the PR test-merge corresponding to that exact pushed head, and verify the
   head association. Only terminal-green corresponding test-merge CI and the remaining required
   review permit Ready/merge and subsequent `develop` monitoring.
8. Fresh six-image HUMAN judgment and Claude presentation-polish remain separate; neither is
   supplied by the automated evidence.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS owns PR #32's shared-command-timer instrument repair and
measurement recalibration boundary. Pushed head `1187de0…` is stopped by run `32350971816` / job
`96369841133`'s preserved instrument red; it has no product verdict. Recalibrate under frozen
authority `f9710bdf…`, then repeat the exact-head transition without retrying the failed test-merge.
Fresh six-image HUMAN judgment and Claude presentation-polish remain separate.

**GitHub step:** Apply the exact-head transition rule above after the frozen timer-authority recalibration.
Once every same-head durable carrier,
verifier, terminal-only check, and repository-identity proof is green, push that unchanged head to
draft PR #32. Then require PR test-merge CI corresponding to that pushed head and verify the head
association. Nick does not need to manipulate Git or open another app during that work. Do not
touch `main`.

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
> serviced-turn repair changes producer authority to `1c8200d7…`; one-attempt baseline4 and
> candidate5/6/7 historically activated its `bb03a3af…` strict replayed-raw ruler, with four retained baseline faults and
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
> and all 222 instrument controls; exact-788 Compendium certification passed, and its first Chrome
> Smoke preserved a no-retry foreground-ownership instrument red. Commit ef6 binds the exact
> foreground document and keeps rich timeout diagnostics; its exact Edge Compendium certification
> and named verifier pass 78/78. The following no-retry Chrome Smoke preserved only a D-TRAIN
> fixture-ownership setup race, not a product verdict. Its bounded follow-up joins prior persistence,
> proves exact runnable Training setup, and waits semantically for busy refusal. Pushed head
> `1187de0…` then reached PR test-merge run `32350971816` / job `96369841133`; its 2,000 ms command
> timer fired `0.241274` ms early while the root heartbeat answered in `7.410808` ms, so the valid
> report classified `instrument-fail`, blocked all 78 outcomes, and made no product verdict. The
> bounded absolute-deadline re-arm changes measurement authority to frozen `f9710bdf…`; the budget
> is fail-closed `calibration-required`, so collect a fresh paired baseline plus three independent
> candidates before any successor certification. Fresh six-image
> HUMAN review, integration,
> development publication, Arc 1B, release and production deployment remain separate authorities.

**Other side:** Anthropic/Claude Code does not have PR #32 yet and need not be opened during Codex's
battery, push, CI, or integration work. Only after the exact reviewed head merges to `develop` may
Claude receive it: from a separate clean `anthropic/*` worktree, fetch and merge the latest
`origin/develop` under the startup protocol, then perform the requested presentation review/polish.
Never edit or copy this OpenAI worktree.

**Release status:** D-TRAIN-1 is integrated at `3844701`. Arc 1A/PR #32 remains an OpenAI branch
candidate governed by the exact-head transition rule above. No `develop`→`main` merge, production
release, version bump, manual deployment, or production-site write was performed or authorized.
