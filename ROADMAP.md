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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 FINAL CI-INSTRUMENT REPAIR ◀◀◀

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
  authority. Completed PR #32 chronologies now live byte-verbatim in the newest sections of
  `ROADMAP_ARCHIVE.md`; they remain evidence for their named sources and were not deleted or rewritten.
- PR #32's live boundary is the repaired dedicated-worker product, serviced-turn scheduler, bounded
  Planetside portrait-stack repair, active fail-closed resource ruler, and three final CI-instrument
  repairs described below. Historical product, Glass, ruler, foreground, fixture, timer, and first
  cold-start detail remain byte-verbatim in the archive and in
  `audits/PR32_FAILURE_REPAIR_REVIEW_2026-08-17.md`.
- Exact pushed head `c49af5a72a41eebd79ce3975852f3d7c22ab3ac6` completed its full local battery once:
  Arc-local Edge Compendium 78/78 plus named verifier (report SHA-256
  `6bfa15afe8379b3c3867865156bc12074eccbbb4e10fdad295259e815983f050`), one-attempt Chrome Smoke
  with zero findings (`4351d1bf9240b8fa00dbe5ab1e733408fc10ff93478d87086fbad35812b4fccf`), full Glass 12/12 and
  58/58 (`4215986c7612c0ed5bed63c0e2d8be1f1de7c72ec5a2a59ba16d9a69b447ad`), nine joined personas,
  root layout 787/787, and verified nonpublishable preview packaging/browser smoke. The separate
  six-image HUMAN judgment remains open.
- Corresponding GitHub Actions run `32375329693`, attempt 1, tested synthetic merge
  `8e09cffe20640e82c7b934df29a40fe22c5326e7` (base `38447019517147319bd08c598202d097ee866874`,
  head `c49af5a72a41eebd79ce3975852f3d7c22ab3ac6`) once without retry. `v2-static` and `v2-glass`
  passed. Root job `96445227534` stopped before `DevToolsActivePort` at its 30-second first-launch
  bound; the valid `instrument-fail` report/job-log SHA-256 values are
  `500157712b8988372e015f0645e3fbeb53f67f533266391584227fffa3cd01c7` /
  `b7d7d82336151f829267214381aa23ea84fe54037d7e89a0bf6524a54fc0a123`, with zero viewport
  outcomes. Compendium job `96445227816` installed exact Edge .86 and opened its live selftest
  browser under 45 seconds, then its generic launcher's 1.5-second `Runtime.enable` command expired;
  no candidate, report, product outcome, or retry exists. Job-log SHA-256 is
  `6b26b83bb577d356b61e23353a501b31a945f7b4597820083928cac35c97513e`.
- Smoke job `96445227991` ran one 871,609 ms attempt under Chrome 151.0.7922.137 and retained all
  ten screenshots. Its sole finding was the immediately sampled asynchronous Compendium detail
  portrait carrying `src length 0`; every other reported Smoke outcome remained clean. Run id is
  `20260820133818702-2548-507ff6b30f6d`, and report/log SHA-256 values are
  `3412fcc00fb1b008feccc25fa12befcfb770de358c26be010b4f0632afbc9393` /
  `2800519eee5febae775e3876fd7696bed95c7373aafdf7c97ac65602f92d4d5e`. The driver pressed Enter,
  immediately read `src`, and then navigated Back. That one-shot oracle could have sampled the
  expected pending state and canceled the separately asynchronous 440px owner; because it retained
  no image state or worker phase, it cannot adjudicate final portrait settlement.
- The bounded working-tree repair keeps all product and measurement-authority inputs unchanged.
  Root layout alone owns one 45-second absolute startup envelope with a 15-second socket phase and
  its existing 30-second command / 5-second shutdown bounds; a portable caller-options control proves
  exactly one open and no unowned option. The Edge-only Compendium workflow replaces the generic
  launcher's live selftest with `port/v2/tools/compendiummem-browser-preflight.mjs`: one 45-second
  cold launch, 15-second socket, sealed 5-second candidate command, 2-second shutdown, exact .86
  provenance, fresh target and required domains, then one immutable 5-second evaluate plus same-
  session event phase whose receipts must be strictly before its deadline, and cleanup, with no
  retry or alternate browser. `browsercdp.mjs` stays byte-identical at SHA-256 `6892dea6…`, so
  measurement
  `6ba58522…`, producer `e59685b1…`, budget `bb4da2bf0b…`, and test `d242705ad9…` remain active.
- Smoke now binds the pre-Enter document, generation and logical detail owner, requires the opened
  surface to retain that document/owner at exactly generation + 1, and polls it under one immutable
  30-second monotonic deadline.
  A PASS requires the connected current image to publish `ready`, a nontrivial source, completed
  decode, and exact 440×440 natural dimensions; placeholder/decode remain pending, while error,
  stale/disconnected owner, contradictory ready state, wrong dimensions, and exact/late receipts
  fail with the last rich panel/image/worker/broker diagnosis. This changes no game timeout,
  portrait producer, retry policy, release identity, save, deterministic bytes, or live site.

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
- The frozen absolute-deadline repair established measurement authority
  `f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409`. Paired baseline5 plus
  independent candidate8/9/10 then activated historical budget/test `8ffd0d8e…` / `121ab8cd…` for
  producer `1c8200d7…`; all four runs were one-attempt/no-retry, each candidate replayed 78/78, every
  one of 40 ceilings exceeded its maximum, and the four-fault baseline breached 14 phone / 13 desktop
  fields. Their report/sample hashes and ceilings remain preserved authority only for those exact
  source, measurement, producer, fixture, and Edge .86 carriers.
- The bounded compact-portrait repair and revised v2.0 development bullet produce `e59685b1…`: index
  `ca76da4c…`, owner `assets/main-Ccq4RHJt.js` / `9260e359…`, worker/painter unchanged. Clean committed
  collector/candidate source `2a105d51397eef97542d856ed3b1bb23edf2b028` collected paired baseline6
  against legacy `3844701…` plus independent candidate11/12/13 under exact Edge .86, measurement
  `f9710bdf…`, and producer `e59685b1…`. All four were one-attempt/no-retry; candidates replay 78/78.
- Historical budget/test SHA-256 values are `ebe5b5c38f4796652ebbe6110c19a5ad31c310d63ca3adbf5fd4575e3724527d` /
  `ec956b8a7d3bad96736deab42e0ac79e59e6cf9010559723d2dac2249e463a83`. Baseline6 report/sample are
  `4cea5b1192dd90de3a951a8a4ad1a9b5b9e4006503bd85b29c580629ead4376d` /
  `0d4caa89664cae0b831d5ba92a4f2387d0f4df048fcb5c294cb4df6d553d257f`; candidate11/12/13 pairs are
  `3b8eb50e…` / `7c343af0…`, `7eeb6dbd…` / `a3cce84a…`, and `cab70164…` / `8f65909a…`.
- All 40 ceilings strictly exceed their three-run maxima. Phone page/embedder/backing/aggregate/
  encoded/warm maxima are `7,778,708/3,177,000/3,086,488/12,458,207/2,473,856/6,492`; desktop are
  `10,686,028/3,143,608/4,824,582/16,032,517/6,591,340/390,020`. Ceilings remain
  `8,388,608/4,194,304/4,194,304/14,680,064/2,621,440/65,536` and
  `12,582,912/4,194,304/6,291,456/18,874,368/6,815,744/524,288`. The four-fault baseline breaches
  14 phone / 13 desktop fields; desktop page heap 11,858,524 deliberately stays below 12 MiB.
- The new launcher input changes measurement authority to
  `6ba58522fc961e145df4f065f913d99d8b18355a20d664b9bcdc90741057638a`; producer authority remains
  `e59685b1a0d009c321c53fe2d3d8566b3f417d8c2decd89387d7be6d08b9a9fb`. Clean source `374049536e…`
  collected baseline7 against legacy `3844701951…` plus independent candidate14/15/16, once each
  without retry; every candidate replayed 78/78. Active budget/test are `bb4da2bf0b…` (79,599 bytes) /
  `d242705ad9…` (20,766 bytes). All 40 ceilings strictly exceed the three-run maxima; the four-fault
  baseline breaches 14 phone / 13 desktop fields. Phone heap/embedder/backing/aggregate/encoded/warm
  maxima are `7777356/3194840/2964133/12478835/2472768/5548`; desktop are
  `10811304/3132296/4852023/16046253/6599264/75992`. This activation is browser-free and non-certifying.
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
- The terminal contract replays raw capsules and binds complete measurement inputs plus the exact
  owner→worker→painter graph. Baseline6 uses collector `2a105d51…` against legacy `3844701…`;
  candidate11/12/13 bind clean source `2a105d51…` and producer `e59685b1…`. Older baseline/candidate
  sets remain truthful only for their named historical measurement and producer authorities.
- Browser-free evidence for the historical fail-closed seam is green: 36 Vitest files / 423 passed /
  1 skipped; root, app, and worker TypeScript programs; artunused, artaudit, and the exact production
  owner→worker→painter build graph; 222 Compendium selftest controls; 10 focused budget tests; and
  Smoke, Glass, and persona selftests. Frozen read-only review is clean. These results validated the
  historical calibration seam. The serviced-turn scheduler, bfcache generation, and fail-closed
  calibration seam then passed their separate browser-free review before commit `f47cd381…`.
- Browser-free transition checks are green: focused replay 11/11, Compendium selftest 222/222, and
  semantic validation. They prove the new fail-closed authority transition, not an active ruler or
  exact-head browser certification.
- The exact clean-head reports `20260817-arc1a-active-cert-65b1bac` and
  `20260820-arc1a-active-cert-da0de20` remain truthful only for their named commits and producers;
  neither certifies the serviced-turn repair. The exact-788 and exact-ef6 reports each certify only
  their named sources. The later exact PR test-merge carrier is the instrument red recorded above;
  its valid terminal report does not certify a product profile. Source identity is not borrowed
  across commits. Commit `c0955003d558d7b3deb0afe9e527f24969d512dc` received exact-source
  Compendium and Smoke PASS carriers, then stopped on its first full Glass product red recorded
  below. One new exact-head browser battery and one corresponding PR test-merge attempt remain open.

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
- Exact clean `c095500…` Compendium run `20260820-arc1a-absolute-deadline-active-cert-c095500` passed under report SHA-256 `55dba448666b6d461ceaa273c3ec85ed08dfbcb605497d2e1539147480e4b9bc`; one-attempt Chrome Smoke run `20260820104231234-94067-7f954ca9942e` passed under report SHA-256 `6d4f00f841e18e80ecfb5cdcd48fab57f3e1b32f917b141681d49c281ae885dd`.
- The first full-certifying Glass run then stopped without retry and is preserved as `glassmatrix-report-c095500.json`, SHA-256 `8e89d855abf33ba45d43d8284e05732ebad93891ff9e024004869811778917f0`: Chrome 152, all 12 rows, 58/58 controls, zero instrument failures/retries, and only `PLANETSIDE_SURFACE_OCCLUDED` at compact-phone from a 12.5px Survey/Planetside rectangle overlap. Persona, layout, preview, push, and CI did not run.
- Source diagnosis classifies that carrier as a bounded product CSS-geometry defect, not an instrument result; it does not claim a more specific dynamic cause than the retained geometry proves. The repair derives Planetside's portrait cap from the same bottom anchor, preserves Survey's 44px floor, preserves a 72px scrollable Planetside floor, and restores the existing 8px gap. The existing Planetside development-release bullet now names that outcome. No Glass predicate, ownership oracle, z-index, timeout, or retry policy changed. Clean `2a105d51…` targeted compact-phone Glass passed at report SHA-256 `13efb5fa4b1ea5e9208b9f468436cdbd15e02d8e07e6c4c6a279219ebb225bad`; it is one-viewport diagnostic evidence, not full-matrix certification.
- Static evidence proves exactly one production owner-module → dedicated-worker → lazy-painter
  graph and rejects renderer-reachable legacy synchronous species art. The Compendium report binds
  worker identity, phase/result/error equations and semantic image decode; it cannot go green merely
  by moving heavy resources into an unmeasured retained worker.

### Human and scope boundary

- Arc 1A's product, serviced-turn repair, historical rulers, and exact-788/ef6/c095/f9/c49 local
  carriers remain preserved. Runs `32350971816`, `32367902426`, and `32375329693` remain distinct
  timer, first Edge cold-start, and final three-instrument reds; c095's full Glass carrier remains
  the preserved product red. The active `6ba58522…` / `e59685b1…` ruler is unchanged. The bounded
  repair head gets one complete local battery and one corresponding PR test-merge CI attempt, then
  work returns to Arc 1B/gameplay rather than expanding timing policy.
  Separately, the rubric remains open until a person reviews six fresh same-run phone/desktop list,
  focus-pinned, and detail
  PNGs for 132px list quality, 440px detail quality, hierarchy, clipping, and visible focus.
  Automated hashing, dimensions, and model inspection do not satisfy this HUMAN row.
- Arc 1A does not add Cargo, Shipyard, ownership inventory, creature instances, rewards, combat,
  missions, companions, crafting, research, live HD scene textures, or an Arc 1B GPU/scene-memory
  plateau. It does not close Gate C, Gate D, the full 21-step Training curriculum, human play,
  performance/heat on physical devices, a production release, or deployment.

### Exact-head transition rule

1. Preserve c095's exact Compendium/Smoke PASS plus first full Glass red, f9/c49's full local-green
   batteries, and run `32375329693`'s three first-red carriers without retry. Keep historical rulers
   frozen; none certifies a later repair source.
2. Resolve the committed repair head, target bytes, worktree, and upstream. From that one clean
   committed head, run browser path/CDP and new Compendium preflight controls, Arc-local Edge
   Compendium certification and named
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
   proof above is green and agrees on the same unchanged head, push that exact head to existing
   PR #32 without another tracked edit. The PR is already open; do not create or re-draft it.
7. Require CI to evaluate the PR test-merge corresponding to that exact pushed head, and verify the
   head association. Only terminal-green corresponding test-merge CI and the remaining required
   review permit Ready/merge and subsequent `develop` monitoring.
8. Fresh six-image HUMAN judgment and Claude presentation-polish remain separate; neither is
   supplied by the automated evidence.
9. This is the final bounded infrastructure cycle for PR #32: the repair head gets one
   exact-head battery and one corresponding CI attempt. Do not add timing optimization or broader harness work
   here; after closure, return to the gameplay program roadmap. A new red is preserved and brought
   back as its exact blocker rather than starting another open-ended repair loop.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS owns PR #32's final bounded CI-instrument repair. Preserve
c49's full local-green battery and run `32375329693`'s root/Compendium/Smoke first-red carriers.
Measurement `6ba58522…` / producer `e59685b1…` remain active and byte-identical. One repair-head
battery and one corresponding PR test-merge attempt remain; then resume Arc 1B/gameplay. Fresh
six-image HUMAN judgment and Claude presentation-polish remain separate.

**GitHub step:** Apply the exact-head transition rule above from the bounded three-instrument repair.
Once every same-head durable carrier,
verifier, terminal-only check, and repository-identity proof is green, push that unchanged head to
existing PR #32. Then require PR test-merge CI corresponding to that pushed head and verify the head
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
> bounded absolute-deadline re-arm changes measurement authority to frozen `f9710bdf…`. Exact
> baseline5 plus independent candidate8/9/10 activated historical producer `1c8200d7…`. Exact c095
> Compendium and Smoke then passed, but the first full Glass run preserved one 12.5px compact-phone
> Survey/Planetside overlap with all 12 rows and 58/58 controls otherwise executed. The bounded CSS
> repair restores an 8px stack while retaining 44px Survey and 72px scrollable Planetside floors;
> baseline6/candidate11/12/13 historically activated strict budget `ebe5b5c3…` for producer
> `e59685b1…`. Exact f9 then passed the full local battery, while corresponding CI run `32367902426`
> stopped before browser provenance or product measurement on its first real Edge cold launch. Clean
> source `374049536e…` collected baseline7 plus candidate14/15/16 once each; all candidates replay
> 78/78. Browser-free budget/test `bb4da2bf0b…` / `d242705ad9…` activate all 40 strict ceilings for
> measurement `6ba58522…` and producer `e59685b1…`; this is not certification. Exact c49 then passed
> the complete local battery, while corresponding run `32375329693` preserved three no-retry
> instrument reds: root Chrome before endpoint at 30 seconds, Edge selftest `Runtime.enable` at its
> generic 1.5-second command bound, and Smoke's immediate read of the asynchronous 440px detail owner.
> The bounded repair gives root layout one explicit 45-second caller envelope, moves the Edge-only
> live proof into a fresh-target 45/15/5/2-second preflight without changing hashed measurement
> inputs, and requires semantic detail publication/decode under one 30-second Smoke phase. One
> repair-head battery and one corresponding CI attempt remain, then work returns to Arc 1B/gameplay.
> Fresh six-image HUMAN review, integration,
> development publication, Arc 1B, release and production deployment remain separate authorities.

**Other side:** Anthropic/Claude Code does not have PR #32 yet and need not be opened during Codex's
battery, push, CI, or integration work. Only after the exact reviewed head merges to `develop` may
Claude receive it: from a separate clean `anthropic/*` worktree, fetch and merge the latest
`origin/develop` under the startup protocol, then perform the requested presentation review/polish.
Never edit or copy this OpenAI worktree.

**Release status:** D-TRAIN-1 is integrated at `3844701`. Arc 1A/PR #32 remains an OpenAI branch
candidate governed by the exact-head transition rule above. No `develop`→`main` merge, production
release, version bump, manual deployment, or production-site write was performed or authorized.
