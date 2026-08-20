# Celestial Frontier — Codebase Reference (legacy v1 + current v2 reset overlay)

> A complete technical reference for the game, written so any future session can pick up
> full context without re-reading the source. When in doubt, source wins. The long-form
> sections below mirror the legacy v1 architecture; dated overlays record current port/v2
> boundaries until the port replaces those sections completely.
> **Current port/v2 source overlay matches code as of 2026-08-20.**
> **2026-08-20 Arc 1A Compendium/art/resource overlay (current source;
> active timer-authority ruler; exact-head certification and final HUMAN review remain open):**
> `apps/game/src/compendium.ts` owns a variable-height virtual list over the
> deterministic 1,500-row fixture/import ceiling. It mounts the visible window,
> bounded overscan, and any focus-pinned row; measured logical anchor-plus-offset
> and the selected row survive filter, detail/Back reconstruction, and height-map
> replacement. `apps/game/src/species-art-loader.ts` is the sole DOM adapter around
> `SpeciesArtBroker` and binds both Compendium and Planetside images to `leaseThumb`
> ownership. Filter, rebind, close, ascent, and final document teardown release their
> exact owners; a persisted bfcache `pagehide` retains the live document's leases
> while suspending worker execution.
>
> `packages/art/src/speciesidentity.ts`, `speciescanvas.ts`, `speciespainter.ts`, and
> `speciesbroker.ts` separate deterministic identity, portable canvas allocation,
> painting, and main-thread ownership. After full app wiring, the app loader's default scheduler
> crosses one rendering opportunity and then one later task (`requestAnimationFrame` →
> `setTimeout(0)`) before every broker pump. At most one serial dedicated module worker at a time dynamically imports the painter, paints a
> 440px scratch canvas, downsamples and encodes a true 132px thumbnail, and returns
> only validated identity-bound results. The renderer never synchronously falls back
> to that heavy path; the worker runs one job at a time and terminates after active work settles and
> its queue is empty, keeping the measured page heap honest. A later new producer burst owns a fresh
> instance/import. Broker pump-generation invalidation rejects a callback armed before bfcache
> suspension or final disposal; resume schedules a fresh serviced turn. Once-per-worker capability,
> import, protocol, and worker failures terminate the instance and settle active plus
> queued owners exactly once, while content-specific paint/encode errors remain
> per-job. Phone/desktop cache, decoded-pixel, byte, queue, lease, portrait, worker
> lifecycle, and phase evidence are explicit. The last pre-timer resource ruler was active under
> measurement authority `bb03a3af…`; exact-788 and exact-ef6 certification remain truthful for that
> authority. The frozen shared-timer repair moves measurement authority to `f9710bdf…`; exact
> baseline5 plus independent candidate8/9/10 now activate its successor ruler. Activation is not a
> browser certification or current-head PASS.
> Specimen detail requests an
> asynchronous 440px result through the same owner; Back/Close cancels that request
> and clears the DOM source. `speciesart.ts`/`speciescompat.ts` remain Window-only
> synchronous audit compatibility and are rejected from the live entry-to-worker
> build graph. Producer failure remains a stable owned error tile and the same key
> recovers under a fresh lease.
>
> `apps/game/src/species-art-protocol.ts`, `species-art-worker-core.ts`, and
> `species-art.worker.ts` own the validated realm protocol, worker state machine, and direct Vite
> module-worker entry. `apps/game/tsconfig.worker.json` compiles that graph with WebWorker globals
> without widening the Window program. `tools/speciesart-build.mjs` proves one exact index owner →
> module worker → worker-local dynamic painter graph and rejects orphan/duplicate/static/preloaded
> worker or painter edges plus any renderer-reachable legacy synchronous facade. The loader owns a
> live `(max-width: 700px)` subscription that immediately trims to phone caps and removes the
> listener on final disposal.
>
> `tools/compendiummem.mjs`, its pure contract, and
> `budgets/compendium-memory-v1.json` own a fail-closed calibration and active-ruler seam. Exact committed
> repair `dea03913014bc58134ebb06ca5b36892210a7571` passes the complete 12-row Glass
> matrix. Its following exact Compendium run
> `20260817150005919-93781-b6643ba7a6` truthfully reports 75/76, solely red at
> `desktop/warm-plateau`; it proves neither a product leak nor a clean plateau because
> the old sequence destructively trimmed the desktop cache before the warm observation
> and measured refill, while its heap summary omitted embedder/backing ownership. The
> repaired collector observes the full native warm cache before cap control; records
> used, embedder, backing-store, and aggregate heap; proves stable unique keys plus
> unchanged job/disposal/worker counters over the last three cycles of one retained window;
> retains a post-cap restored snapshot; embeds compact replayable baseline/candidate capsules; and
> binds the complete fixture/generator/schema/contract/collector/browser/lock/package/
> baseline-save/art-build/outcome input set plus the exact built index-owner → module-worker
> → worker-local-painter graph. Da0's historical budget embeds paired run
> `20260820-arc1a-baseline3-21af3fa`, collected by `21af3fa2…` against legacy product `3844701…`,
> plus independent one-attempt candidate2/3/4 runs from clean committed `21af3fa2…`
> collector/product source that bind historical producer `291b794e…`. All share measurement
> authority `bb03a3af…` and exact Edge 151.0.4129.86. Strict ceilings exceeded all three-run maxima;
> the baseline retained all four sealed faults and breached 14 phone / 13 desktop fields. Commit
> `da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` locally certified that exact ruler; its no-retry Chrome
> Smoke, full Glass, persona, root-layout, and nonpublishable-preview gates also passed.
>
> PR run `32334254714`, attempt 1, preserved the later terminal product red. Its clean detached
> test-merge `88b9c7b0aa90b860a5474bd099cfab48b125a3f5` matched exact Edge .86, the active budget bytes, and
> producer `291b794e…`. Phone completed 29 stages through veteran-Earth boot readiness; Planetside
> thumb settlement then missed the unchanged 2,000 ms target command bound at 2,001.723 ms while
> root-session `Browser.getVersion` answered in 0.872 ms. The report is correctly
> `product-unanswerable`, not instrument/transport, and desktop did not run. Its partial evidence did
> not retain producer phase at the timeout, so it cannot distinguish worker import, paint, encode,
> result publication, or absence there. Source inspection shows the heavy painter is off-thread and
> that zero-delay main-thread successor pumps could repeatedly win over rendering and inspector work.
>
> The serviced-turn/bfcache repair changes exact built producer authority to
> `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`: index
> `f528797d1b3339291dedd5db4b768add9485e8006b1158690323ff2f5ff2769e`, owner
> `assets/main-BAg-DH_f.js` at
> `b12503d154d83a44c4606c31306bf756d6a35e1459877a30e6a89d423c49261f`, with worker and painter
> unchanged.
> Commit `f47cd381699fb1934f30bfca82fc9bf971714e6d` collected exact-Edge-.86 baseline4 against legacy
> product `3844701…`; that baseline carries no candidate producer field. Independent one-attempt
> candidate5/6/7 use `f47cd381…` as clean collector/product source and bind producer `1c8200d7…`.
> All four share measurement authority `bb03a3af…`; every candidate run completed 78/78 outcomes
> with zero retries. That historical pre-timer budget replays those raw capsules and puts all 40 profile ceilings strictly
> above their three-run maxima; baseline4 retains all four sealed faults and breaches 14 phone / 13
> desktop fields. The desktop warm aggregate maximum is 436,412 bytes under a 524,288-byte ceiling.
> Baseline3 and candidate2/3/4 remain truthful inputs to the old `bb03a3af…` ruler; only the
> candidate runs carry old producer `291b794e…`. They are not current certification. Commit
> `78813cd25c67f4255282f418ea6f635a45e0fc29` passed exact-head
> Arc-local Edge run `20260820-arc1a-serviced-turn-active-cert-78813cd`: 78/78 outcomes, zero
> findings/retries, independent named-run verification, report SHA-256 `0d4a7f80…`.
>
> The first following Chrome Smoke run `20260820063539761-70885-f80e1a2198fc` is preserved as a
> one-attempt/zero-retry instrument red (report/log `d2919f0e…` / `4b5de237…`). Its held-painter
> phase created a second target and then observed the first owner without re-establishing or proving
> its foreground authority, while repaired successor pumps intentionally wait for rAF→later-task service. The generic
> `last null` carrier retained neither foreground authority nor the exact terminal image/worker
> phase, so it is not a visible-page product finding. `tools/slicesmoke.mjs` now binds each
> attach-derived target/session plus exact document token, explicitly activates/focuses/brings that
> owner forward, proves continuous visible/focused arm→rAF→later-task service under a fresh token,
> releases once under one immutable 30-second deadline, and retains image/decode, queue, worker
> phase/result/error, broker, and foreground diagnostics. The closed owner gets its own foreground
> proof before settlement. `tools/slicesmoke-contract.mjs` and the report selftest reject wrong or
> stale identity, hidden/unfocused phases, reversed service order, and intervening visibility/focus
> changes; receipt at or after either absolute deadline is late even when the CDP timeout callback
> has not run first. Commit `ef6c2c2cd31363cf47899a89c16c0d9f5f90d7a7` freezes that
> foreground instrument. Exact Edge run `20260820-arc1a-serviced-turn-active-cert-ef6c2c2` and its
> named verifier pass 78/78 with zero findings/blocked/partial/retries; report SHA-256 is
> `406edea11fec5f5a3cf11e6f9fc6dfea00cbdd2ce54fefed780bd1c9dafc9282`.
>
> The immediately following clean-ef6 Chrome Smoke run
> `20260820071826194-75001-c2a22330fd09` stopped the browser battery with only two D-TRAIN import-
> owner findings: the busy-refusal witness was absent and the Skip action was missing
> (`button:false`, `witness:null`). It used Chrome for Testing 152.0.7977.54, one attempt, zero
> retries, 150,963 ms, ten screenshots, and no detected source change. Report/log SHA-256 values are
> `65ca06c8f6d26ef3a9a3da19bb4bc09bb005d754f2291f55f389ac1ecf14aa46` /
> `87b1c8b6308d3a1969fb45ea4c2ccb70d1f46c2a8311751984b3c1ab0acdd7d9`.
> This is a Smoke setup-race finding, not a product transaction finding: the direct D-TRAIN fixture
> put followed real Atlas/Land activity without joining its ordinary persistence owner, and the old
> helper proved only changed document identity before accepting whatever primary remained. The
> report did not retain the winning bytes, so their exact value and the product busy-refusal outcome
> are unobserved. The bounded instrument follow-up drains the prior writer, reproduces stale overwrite
> as a negative control, requires exact primary/document/classified Training route/render/card/
> runnable Skip/idle status/ticker preconditions, and then waits semantically for one
> `claim-rejected/busy` witness with no pre-release write.
>
> Pushed head `1187de0d052761e4463524cde8438ea8810d7149` then reached GitHub Actions run
> `32350971816`, job `96369841133`, workflow attempt 1, on synthetic merge
> `25200b616bbd509f50eaa18f0a8b27ad20dc83e0` (parents `38447019517147319bd08c598202d097ee866874`
> and `1187de0d052761e4463524cde8438ea8810d7149`). Valid report
> `gha-32350971816-1-compendiummem` retained 29 completed phone stages and one final target timeout
> after `1999.758726` ms against its 2,000 ms command deadline. The target remained `timely:true`,
> the ledger put completion `0.241274` ms before the deadline, and the independent root heartbeat
> fulfilled in `7.410808` ms. The terminal contract correctly emitted one instrument finding, zero
> outcomes, and 78 blocked outcomes: this is `instrument-fail`, not a product verdict. Artifact,
> report, and job-log SHA-256 values are `4932fb229c1de1d3820d2322e8273ce9ed609716c8f9f4d9e82b2fa2a3e408c7`,
> `1718faa4403f4f569899d9d328f08c3b7decafae23829d5fabe37660c36da43b`, and
> `7eda5facdac45d192c5b6071ac91394678d2fdb69b7992b218e0d3b0cb9c4ca9`.
>
> `browsercdp.send()` now computes one absolute monotonic deadline. An early timer callback re-arms
> only the remaining interval under that deadline; it rejects only when the clock proves the
> boundary reached/passed, while response receipt at/after the same boundary remains late. Expiry
> during initial timer arming rejects without transmitting the command. Frozen browser-CDP SHA-256
> `36a832bc8cc32ba56373d1fa6d7339903a37a07b337fbf2748bbf95e489061d0`
> changes measurement authority from historical `bb03a3af…` to
> `f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409`. Frozen budget
> `a41ff08b8a58e776c789f09e7294c1cb2c0f44da8406f81c55f0754076337c30` first enforced the
> `calibration-required` boundary; active budget/test SHA-256 values are now
> `8ffd0d8edb6a17df68da95a5a90089cbbed90a5b32effff8ce2ff23566733b47` /
> `121ab8cd78e48f6c17d674a4ba9c08c2f21a32916cde02096b0557ed79fd1b5a`.
> Paired `20260820-arc1a-absolute-deadline-baseline5` used clean collector
> `cbe786816cafd196a4b1649b0d1b72966036b7cc` against detached broken source `3844701…`;
> candidate8/9/10 used that clean source, exact Edge .86, producer `1c8200d7…`, one attempt, and no
> retries. Each candidate replays 78/78. All 40 ceilings exceed the three-run maxima: phone
> page/embedder/backing/aggregate/encoded/warm maxima → ceilings are
> `7,771,656/3,151,408/3,099,159/12,406,038/2,477,068/6,196` →
> `8,388,608/4,194,304/4,194,304/14,680,064/2,621,440/65,536` bytes; desktop values are
> `10,550,176/3,216,400/4,914,765/16,017,176/6,592,468/306,704` →
> `12,582,912/4,194,304/6,291,456/18,874,368/6,815,744/524,288`. Baseline5 preserves all four
> faults, observes warm ranges 1,037,780 / 1,222,370 bytes, and breaches 14 phone / 13 desktop
> fields. Focused replay is 11/11 and the independent instrument controls are 222/222. These are
> browser-free activation facts; no old capsule or PASS, and no calibration run itself, certifies
> the later activation head.
> The authority remains Arc-local Edge 151 and does not change the global Gate-A Edge 150
> pin. Da0's six images are stale for the repaired producer; a fresh phone/desktop list,
> focus-pinned, and detail set still awaits HUMAN review.
> Arc 1B scene-resource ownership/disposal and live HD planet replacement remain open.
> **2026-08-16 D-TRAIN-1 source overlay (current working tree; local browser
> evidence recorded below; exact-head CI, integration, real-save Gate C, and
> human authority remain open):** `@cf/persistence` now classifies the real
> v1.8.9 Field Training checkpoint by its exact eleven outer keys
> `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` and returns a detached,
> recursively frozen bounded clone. Those keys own selected statistics, player
> statistics, achievements, Stardust, Compendium, cargo, exceptional cargo
> counts, items, equipment, equipment affixes, and the captured Earth
> Atlas/home row—never the whole save. Ingress kinds are `none`, current-view,
> `legacy-v1`, and bounded `legacy-or-unknown`. An exact legacy checkpoint with
> `tut:1` rescues the mature completion-before-restore bug by normalizing
> Training incomplete; the synthetic `{codex,essence,marker}` fixture remains
> unknown/refusal-only. Completed-plus-pending cannot export, and oversized
> unsafe evidence is not promoted.
>
> `apps/game/src/training-restore.ts` starts with the surrounding imported v4
> state, restores only those owned surfaces through the normal sanitizers, and
> keeps every other outer-save field. The checkpoint's `e.where` is ignored as
> route authority; canonical Earth is regenerated and source-proven. The
> legacy checkpoint contains no `view`: Skip from Welcome keeps/persists Sol,
> while full completion after Land keeps/persists Earth. Only the current-v2
> exact one-key `{view}` snapshot restores the pre-Training route. Earth
> history is preserved only after sanitization, no land/conquest/achievement is
> invented, HP is down-clamped but never healed, Earth reserves one slot inside
> the 120-row Atlas cap, `surveys` derives from `surveyedSet`, and `arrivals`
> derives from `sysSeen`. Cumulative checkpoint records use the optional
> compatible outer-v4 extension
> `ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}`. Outer `v` remains 4:
> this is an additive envelope extension with an independent nested version,
> not “no schema change,” v5, or a game/release bump. Absent carrier preserves
> historical derivation; carrier floors cannot lower derived facts; `sysSeen`
> remains arrival authority; numeric `ever.v > 1` rejects the whole save as
> `future-version`; malformed v1 members are contained.
>
> Training completion is an async atomic replacement transaction. The UI first
> sets `aria-busy`, disables Finish/Skip, retains the lesson/focus lock, claims
> exclusive ownership, stops the ticker, cancels pending persistence, and drains
> an active write. It builds/proves a detached candidate and performs exactly
> one direct primary write before publishing live state or releasing the old
> renderer. Pre-durable refusal rolls back the claim and leaves the checkpoint
> and lesson retryable; post-durable publication failure never writes again and
> reloads from the committed primary. Source-error may write an incomplete
> candidate with the exact checkpoint only when Sol is freshly proven and
> authorized, then reload safely. If Sol also cannot be proven, it forges no
> fallback/write/clear/completion and leaves the checkpoint plus lesson retryable.
>
> Loaded pending checkpoints are write-held. Loaded `tut:0` without a checkpoint
> is also held and seated at proven Sol in runtime only until the one atomic
> completion write; fresh empty onboarding remains ordinary. Unknown checkpoint
> or unavailable-route recovery turns `#importsheet` into a persistent
> nonclosable `aria-modal`: background inert/hidden, focus trapped, Escape
> consumed, release bulletin suppressed, trusted complete import plus reload
> still reachable, and synchronous reopen on every boot while the protected
> source remains. Replacement reasons are now `training-restart`,
> `training-complete`, `training-recovery`, `save-import`, and `storage-retry`.
> Guide capability inventory and release structure remain unchanged (five
> categories /44 bullets, draft only, current release null); the remaining
> fifteen D-TRAIN-2 lessons, real-save Gate C, and any version/release remain open.
>
> The ignored Slice Smoke report is terminal PASS for run
> `20260816195736683-4852-27b5c876410a` on Edge `151.0.4129.86`: 154,788 ms,
> 0 findings, 0 automatic retries, 10 screenshots, and no detected source
> change. Its raw log names genuine Training Skip + full Finish,
> rescue/quarantine/retry/races, and canonical Earth. The ignored Glass report
> is independently `full-certifying` / terminal PASS on the same Edge in 57,476
> ms, with 12/12 viewport rows, 12/12 reload-evidence rows, all 57/57 planned
> negative controls run, none blocked/omitted, 0 findings, 0 instrument failures,
> and 0 retries. Both name commit
> `b091f010011fa16bec457599b41274b7f92bb5e6`, branch `openai/mac`, and
> dirty-diagnostic source state, but they bind distinct working-tree hashes:
> Slice Smoke `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`;
> Glass `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
> Their common Git-status digest is
> `c195873a910c3bce42db222560c9bc70b8763df330d0454036388e4e398faa6d`.
> Slice report SHA-256 is
> `33953319124590ced0cebc16888cfb2b8cbe2879cbcb3c225e061d0d7a817027`;
> its 4,163-byte raw-log SHA-256 is
> `b060af3aaa8454a5d9813b2e5f8e6eba0ec2b7f5d3090e991154c1664a132670`.
> Glass report SHA-256 is
> `fe32fe802460a61ec4337c373276de8601196ead530ae8184c36970247545254`.
> This is local outcome evidence for those exact report inputs—not the later
> documentation tree, exact-head CI, integration, Gate C, human play, rubric
> closure, or release authority.
>
> **2026-08-15 F2 canonical-ingress overlay (historical F2 working tree; complete
> local browser outcome green, exact-head integration pending):**
> `port/v2/packages/scene/src/address.ts` now owns
> production galaxy/star/planet candidates, resolvers, deeply frozen proven
> nodes, runtime-private registries and branded canonical keys. Star and planet
> parent guards compare those private canonical parent keys, so an independent
> proof of the same parent is valid while structural clones and cross-hierarchy
> children fail. `cf1-code.ts` parses strict bounded all-tier public input;
> diagnostic source overrides deliberately return untrusted frozen data.
> `zoommode.ts` replaces nullable alias-prone navigation with a frozen,
> registered discriminated `NavState`, validated transitions, canonical-address
> conversion and strict `resolveViewToNav()`. `system.ts` records planet source
> ordinal before its orbit sort; runtime action identity and the world key use
> `{seed,ordinal}`.
>
> `apps/game/src/main.ts` routes generated galaxy/star/planet actions, all CF1
> Search tiers, saved boot/import, Atlas and the exact current one-key Field
> Training `{view}` snapshot through that seam. The app authorizes a proven
> destination against saved Prime/Charter reach before committing destination
> navigation, an accepted name, a route-focused planet card, Land, progression
> or persistence. Planet routes focus the proven
> system survey and never land. `@cf/persistence` keeps bounded raw saved-route,
> Atlas-row and current-snapshot evidence in `ImportRouteIngressV2`, outside
> `SaveStateV2`; the app holds proven Atlas navigation in a private `WeakMap`.
> Deterministically invalid or unauthorized saved navigation repairs only
> `view` to Cosmos. A generator `source-error` holds that route field, and the
> current Training restore keeps its pending snapshot and incomplete state;
> when Sol can be newly proven and authorized, it commits that safe system
> before persistence so reload can reopen Welcome for retry. Atlas rows
> without runtime proof remain visible and disabled. `navToView()` preserves
> the compatibility route shape while excluding brands, keys, parent cells,
> star layer and planet ordinal.
>
> The first F2 real-browser attempt was red after real accepted galaxy
> navigation: `hudText()` passed frozen `ProvenGalaxy` to lifted
> `galaxyStats()`, whose legacy memoizer assigns `_stats` to its input. The
> caller-side repair neither unfreezes provenance nor edits the lifted helper;
> `statsForProvenGalaxy()` passes a disposable mutable spread and caches only
> frozen `{stars,planets}` in an app `WeakMap`. `scene/universe.ts` separately
> copies and freezes nested collision `bridge` data while composing scene
> nodes, with a focused mutation control that proves later composition cannot
> inherit a poisoned memoized value; the intentionally identity-preserving
> `systemScene.P` remains presentation-only and never mints route authority.
> `slicesmoke.mjs` contains all-ingress outcome controls plus a draw-tail
> receipt that joins rendered scene mode/keys to canonical navigation. Final
> audit added held-route Training Restart transfer/rollback and non-null
> per-mode provenance-key controls. A CI-format rendered-copy run then failed
> closed because its bare expected title did not include the real icon-prefixed
> Guide heading, despite complete required copy and no contradiction. After the
> contained-title identity correction, `smoke:ci` passed with zero findings or
> retries in 138,305 ms; the 12-viewport Glass Matrix passed in 55,065 ms with
> zero findings/instrument failures. Both reports bind Edge `151.0.4129.86` and
> dirty-tree digest
> `7dfa649eb7de017424b7ba1ba0b11ba1fd00dc02a5b99b6848e0f3c347acba9e`.
> The static suite is 27 files / 340 passed / 1 skipped; both TypeScript programs,
> `artunused`, art routing/coverage/spec controls, diff hygiene and the 790-module
> app build are green. This remains dirty-working-tree evidence, not exact-head
> CI, integration or rubric-Gate completion.
>
> This historical overlay superseded the scope limits in the dated 2026-08-13 CF1 and
> 2026-08-11 integration notes below, but not their history. F2 changes no
> generator output, share-code/save schema, reach balance, Guide capability,
> Training lessons, local ownership ledgers, ownership/reward/receipt writer,
> version or release. At that boundary D-TRAIN-1 remained open for richer legacy snapshots; F3
> still owns revisions/CAS/split stores/receipt journal, and F4 owns clock,
> visibility, active-play and SessionRNG policy.
> **2026-08-15 F1b WorldGen contract overlay:** The byte-verbatim WorldGen body,
> generated values, cache keys and call order are unchanged. Its typed surface
> now exposes required own `GalaxyCellGalaxies.web` metadata and the exact
> `SupernovaSite`/birth/remnant shape, with `supernovaSites`'s second parameter
> documented as an epoch key rather than a requested count. The app consumes
> those results without local casts. The facade also states the transitional
> `GAL_SPRITES` precondition for a first uncached ordinary generated-galaxy
> branch; `installCaptureHooks()` remains the current boot seam. This is
> contract truth, not removal of the free-global dependency, D-HAZE, CF1/F2,
> `_sanitizeSavedGenome` mutation, or F4 clock work.
> **2026-08-15 F1b audio package overlay:** The v2 package remains stings-only, but its public
> rarity/survey/navigation stings and `applySfxGain()` now no-op before `initAudio()` installs the
> save-backed seam. Initialization creates no context. After it, Sound-off prevents construction;
> the first enabled sting lazily prefers standard `AudioContext`, falls back to
> `webkitAudioContext` only when standard is absent, and reuses the context. Bounded package tests
> cover pre-init safety, post-init dispatch, live mute state, constructor failure/fallback and
> suspended resume rejection. During the awaited save-load, the app assigns the save and then calls
> `initAudio()` synchronously before later playable scene/input publication; no ordinary current
> pre-init action route to the former package exception was reproduced. This does not implement or
> close Arc 7/8 or Gate G lifecycle, content, ownership, budget, rights, device or listening work, and it
> changes no Guide/Training/release-copy capability or version identity.
> **2026-08-15 F1b epoch persistence overlay:** `EpochClock.base()` is the
> immutable sanitized construction origin; ordinary persistence must snapshot
> the advancing `current()` value. The browser app already followed that recipe:
> it constructs once from imported `SaveStateV2.EPOCH_BASE` and a fresh
> monotonic page-residence segment, refreshes the compatibility-named carrier
> from `current()` before export, and constructs a new clock from the serialized
> snapshot after reload. The package comments and tests now state that saving
> never rebases the live clock and carrying an old elapsed segment into a new
> base would double-count it. Real-browser smoke advances one exact epoch, reads
> the raw IndexedDB primary, and reloads the snapshot. Automatic edge saves,
> hidden-time policy, live global-read timing, and SessionRNG remain F4. F3 owns
> the CAS/revision/tab-lease substrate; F4 owns the persisted `activePlayMs`
> clock/accrual policy. This is not a current-player data-loss finding.
> **2026-08-13 exploration/ship/loot/companion/audio review (historical review
> boundary; Arc 1A resource status is refreshed above):** The executable v2
> boundary remained the Phase-4 travel/survey slice. `apps/game/src/main.ts` rendered the
> read-only Compendium through `@cf/art/species`, consumed `@cf/domain-combatcore`
> battle stats for specimen detail, and used only the lifted whoosh/survey stings from
> `@cf/audio`. `@cf/persistence` round-trips legacy cargo/items/equipment/affix/tech/
> creature fields, but Inventory, Shipyard, mining/crafting, item-instance loot,
> breeding/care, live combat/Guardians and companion missions have no v2 command owner.
> The current Guide correctly keeps those capabilities unavailable.
>
> The approved ownership graph is specified in
> `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`: catalogue species split from living
> `CreatureInstance`; stackable definitions/materials split from `GearInstance`;
> `ShipVisualState` is a pure projection of the same normalized reach state used by
> travel; companion mission loot is an immutable dispatch-time receipt claimed once
> through revisioned persistence; audio resolves a versioned profile/cue plan without
> consuming simulation RNG. These are planned module boundaries, not current exports.
> That review required the 1,500-entry Compendium to be virtualized, mounted rows
> moved to true 132px thumbnails, and decoded pixels/jobs/resources bounded before
> adding content scale; Arc 1A now implements and measures that bounded DOM/Canvas path.
> Pixi scene ownership remains Arc 1B. The present one-blob, last-writer-wins repository is
> insufficient for two-tab exact-once claims and must gain compare-and-swap or one
> authoritative serialized coordinator.
>
> **2026-08-14 F1a save-integrity overlay:** `@cf/persistence` now treats both
> recovery copies as untrusted input. `readSaveWithRecovery` supplies the coherent,
> supported-envelope predicate to `SaveRepository.recover`; the repository classifies
> the exact backup before it may replace an invalid primary. Corrupt or future backup
> bytes leave the original invalid primary untouched, and a future primary still never
> invokes recovery. The direct exporter contract proves all supported fixture families
> satisfy the boot envelope, while repository reset clears the canonical complete
> `STORES` list so future stores cannot escape a wipe. This implements the bounded F1a
> pre-classification overwrite/reset-coverage repairs only. The current one-blob store,
> cross-tab last-writer-wins behavior, split schema, CAS, receipt journal and migration
> authority remain F3 work; Gate C still requires real veteran/device evidence.
>
> **2026-08-14 Charter current-truth overlay:** `@cf/scene/charter.ts` still owns the
> verbatim `ASC_CHAPTERS_DATA`, `bankLandfall`, canonical completion test and system-derived
> reach stage. The Phase-4 app must not render that legacy data directly. Its `fillCharters`
> and top chip use `projectV2Charter` / `currentV2Objective` with the actual `ascStage()`:
> only a reach-valid `landfall` goal is visible, the fresh Sol path stops at a development-slice
> boundary, and no visible completion grants a drive, reward, canonical chapter or new reach.
> `bankLandfall` rejects non-integer, non-finite, negative, terminal and out-of-range chapter
> positions without touching `ascProg`. The canonical array, chapters, goal arrays and goal
> objects are deeply frozen, so the UI's projected goal aliases cannot rewrite process-wide
> truth. `reconcileV2Chapters` evaluates one stable saved reach stage and advances every
> consecutive complete projection. `doLand()` banks only a genuine first landing but reconciles
> after every successful Land action, so a saturated imported record can recover without a
> duplicate landing or progress write while incomplete and unpowered records remain still. Unit
> controls cover malformed indexes, recursive ownership and 0→3/stop cases; a real-browser
> emulated-phone Mercury touch re-land proves the exact ledger in memory, IndexedDB and reload for
> powered, matched unpowered and powered-incomplete fixtures. The one-shot aggregate completion
> replaces adjacent ambient feedback in the same polite status region, and an already-open Charters
> panel refills from the advanced ledger. Mining, fabrication, bioscan, conquest, breeding, rewards,
> accepted chains and weeklies remain unported v2 work.
>
> **2026-08-13 canonical CF1-address overlay:** `@cf/scene/address.ts` introduces the
> pure `resolveCF1WorldAddress` boundary. It accepts only exact uint32 seeds and finite
> public coordinates, normalizes legacy two-decimal CF1 coordinates, probes neighboring
> generator cells, and re-derives galaxy → coarse/fine star → planet ordinal from the
> deterministic sources. It returns only source-derived hierarchy fields and fails closed
> for malformed, missing, ambiguous or throwing source data. `jumpToView` now applies that
> resolver to externally searched `type:'planet'` CF1 routes before reach, survey card,
> custom name, persisted view or navigation can see the supplied parents; a valid route
> still focuses system survey and only explicit Land enters the surface. The real-browser
> control rejects a same-reach forged galaxy parent while preserving query, focus, nav,
> Atlas, landings and names, and the pure suite covers Sol/Earth, a fine-layer world,
> coordinate-boundary rounding, malformed/forged children and ambiguous generation.
> This is deliberately **not** a universal ingress claim: boot-saved views, Atlas rows,
> galaxy/star-only CF1 routes, generated descents and all future ownership/receipt writers
> still need their own canonical boundary integration.
>
> **2026-08-13 branch publication overlay (battery structure updated 2026-08-14):**
> `.github/workflows/test.yml` runs the exact battery for push events on both `main` and
> `develop`, and since 2026-08-14 as **five parallel jobs plus one summary gate**:
> `root-gates`, `v2-static`, `v2-smoke` and `v2-glass` in parallel, then
> `v2-persona-preview` joining their evidence, then a summary job named **`battery`**
> that needs all five and fails unless every one succeeded. The summary job exists
> because the develop/main branch rulesets require one status context named `battery`
> (the old serial job); it keeps repository settings decoupled from internal job names
> and can never satisfy the ruleset by being skipped (`if: always()` + explicit result
> check). The split
> exists because the two real-browser evidence commands owned 78% of the old 33-minute
> serial wall (glassmatrix ~17 min, smoke:ci ~9 min on the 2-core software-rendering
> runner). Every serial-battery command still runs exactly once with unchanged
> one-attempt/no-retry semantics; the persona join and the `v2-development-preview`
> artifact still require ALL other jobs green; each browser-owning job pins `CF_BROWSER`
> at job scope and re-proves provenance with its own selftests. Artifacts: root evidence
> moved from the old combined bundle into `root-reports` + `root-layout-evidence`;
> `v2-smoke-evidence`/`v2-glass-evidence` upload per-job (retained on red) and are
> re-joined into `battery-reports` by the final job. The glass report now carries
> per-viewport `viewportTimings` (validated: a certifying PASS must time all 12 rows;
> partial timings stay legal on red), so future runner/shard decisions are measured, not
> guessed. Only a successful **workflow** conclusion — all five jobs — can
> trigger `.github/workflows/publish-branch-sites.yml`, which checks out that event's full SHA
> and invokes `tools/publish-branch-site.js`. A separate
> `.github/workflows/sync-agent-branches.yml` runs on every `develop` push and
> fast-forwards each agent branch that is strictly behind `develop`; diverged branches
> (unmerged agent work) are skipped with a report line and follow the manual protocol
> merge. It never force-pushes and never touches `main`. `main` targets only
> `CelestialFrontier/celestialfrontier.github.io`; `develop` targets only
> `Dev-CelestialFrontier/dev-celestialfrontier.github.io`. Separate write-only deploy keys and
> repository secrets prevent cross-target access; PR/manual/failed runs have none. Development
> publication accepts the already-tested exact `port/v2` package, while production preserves
> the root v1.8.9 HTML. The development package is v2.0, noindexed and `robots.txt`-blocked;
> runtime and manifest bind the full source commit, exact archive inputs, expected origin,
> shared version and generated site `version.json`. Visible identity is inside the Guide only,
> never a corner badge. The public development site is not human-play or release authority.
>
> **2026-08-11 v2 integration/hardening overlay:** PR #10 merged the Platinum
> repair into `develop` at `61cc058`. The current bounded port candidate makes the app
> TypeScript configuration and v2 browser gates part of CI; narrows the DOM
> compatibility waiver; hardens SessionRNG; protects sparse/corrupt/future saves
> and IndexedDB retries; bounds cosmic epoch; preserves complete Atlas star
> coordinates; contains malformed Compendium rows; prevents repeat landfall,
> stale-card and direct-code landing outcomes; round-trips accepted custom planet
> names; repairs lazy species-art subscription; and gives phone lower chrome a
> measured 4×2 non-overlap contract. At that 2026-08-11 boundary the slice still stored one exported save
> blob, `NavState` was not yet a discriminated union, complete CF1 hierarchy and
> legacy checkpoint restoration remained open, and CFB still lost hybrid
> parents. Runtime priorities at that boundary were Compendium virtualization,
> scene texture ownership/memory proof, live HD planet replacement, clock/visibility policy,
> then living organism rigs and biome scenes. Platinum-approved static portraits
> remain frozen; optional polish is not a mandate to repaint them.
>
> **2026-08-12 root browser-harness overlay; 2026-08-15 selftest update:** legacy `tools/uilayout.js` now
> consumes the v2-owned browser resolver and raw-CDP launcher instead of owning a
> second candidate list, guessed port, WebSocket loop and cleanup path. The shared
> lifecycle uses browser-assigned port 0 plus `DevToolsActivePort`, records exact
> executable/`Browser.getVersion` provenance, retains bounded startup stderr,
> detects early exit, and performs bounded TERM→KILL shutdown with validated
> profile removal. Layout evidence is an ignored atomic schema-v2 report that
> transitions from `running` to terminal `pass`, `fail`, or `instrument-fail`
> while retaining the legacy `results` array. Full PASS additionally matches all
> 787 `viewport/surface/name` keys from the sealed v1.8.9 layout report; targeted
> runs remain scoped. `--selftest` replaces a seeded stale PASS with an exit-73 red
> record, proves freshness/cleanup, then removes one sealed outcome with consistent
> counts and requires rejection;
> `--verify-run=ID` rejects the wrong attempt. CI runs both before separately
> uploading the required report. Root and v2 manifests/locks both declare the
> pinned `ws` transport and Node `^20.19.0 || ^22.13.0 || >=24.0.0`. Root preflight
> launches the selected executable through `browsercdp`; its selftest rejects
> executable non-browsers and excluded Node lines. `bootperf` shares the executable
> resolver and `ws` transport but retains its legacy CDP lifecycle. Two evidence
> callers continue to deviate from the 15-second CDP-start default with a fixed
> bounded 30-second allowance: the final development-preview package check (after
> exact packaging) and the root layout gate `tools/uilayout.js` — the battery job's first
> real browser launch, where the identical diagnosed Linux cold-start phase
> recurred at its prior 24-second bound (run `31758515194` attempt 1). The
> browsercdp selftest's first real provenance launch also owns a fixed 30-second
> absolute spawn → endpoint → socket-open allowance. The selftest isolates its
> earlier injected WebSocket timeout behind a private launcher seam: the seam writes
> one valid owned endpoint and starts one portable Node child to prove the 200-millisecond socket
> timeout, exactly one fixture launch, socket close, child shutdown, and profile
> cleanup without launching Chrome. Run `31870103561` then proved that a valid endpoint does not
> itself prove an open socket: the cold live leg reused its 1,500-millisecond command ceiling for
> the handshake and failed before `Browser.getVersion`. `webSocketOpenTimeoutMs` now owns that phase,
> defaults to the startup budget, and is clipped to the absolute startup time still remaining on a
> monotonic clock. It begins before WebSocket construction, and `onopen` rechecks the deadline. A
> delayed portable socket must outlive a 100-millisecond command ceiling, open inside its default
> 1-second socket/startup budget, and answer fake provenance. Separate controls reject after an
> explicit short socket cap, clip a longer socket cap to a shorter startup remainder, reject an
> exhausted deadline before socket construction, reject a constructor that consumes the remaining
> phase budget while requiring a provisional error handler before CONNECTING-socket cleanup, and
> reject a just-late open before its overdue
> timer runs; nonpositive/fractional caps reject before launch.
> The cold live leg declares a 15-second socket cap inside its 30-second startup budget; its later
> warm leg keeps 10 seconds for both. Both retain 1,500-millisecond command and 2-second shutdown
> bounds. Post-open `send()` uses one absolute monotonic deadline per command: a callback that wakes
> early re-arms only the remaining interval and cannot reject before the boundary; the response path
> independently rejects at/after that same boundary. This is the bounded repair for run
> `32350971816`'s `1999.758726`-millisecond early timeout, not a cap increase or retry. The live legs
> assert profile cleanup in `finally` on either rejection or success, and never retry. Every platform captures the exact options
> passed by the preview caller and completes a real browser outcome. On POSIX the
> preview selftest starts Chrome immediately but withholds its
> ready CDP endpoint for 16 seconds: the generic path times out while the exact preview
> caller retains its full 30-second startup window, answers `Browser.getVersion`, and closes.
> On macOS the shared launcher and the resolver's launch-facing `--print`
> command also reject the Codex Seatbelt environment before spawn. Three supplied
> Edge crash reports share a main-thread `TransformProcessType` /
> `_RegisterApplication` SIGABRT within 100 ms; the system log confirms denied
> LaunchServices and WindowServer lookups. Approved out-of-sandbox execution removes
> the Seatbelt marker and remains the supported real-browser path. The historical
> `port/spike` renderers resolve through the same launch-facing guard rather than
> invoking a macOS browser directly.
>
> PR #27 run `31887203990` exposed the earlier endpoint-publication boundary during the
> ninth fresh browser of the full Glass matrix: the final `DevToolsActivePort` path existed,
> but the reader observed parser-invalid content and failed after 364 milliseconds;
> all eight earlier and three later rows passed under the same pinned Chrome. The shared
> launcher now requires two consecutive identical, fully valid raw snapshots before socket
> construction. Parser-invalid regular-file content is treated as potentially incomplete only
> within the existing one-process monotonic startup deadline. Wrong file types, symbolic links and
> unexpected
> filesystem errors fail immediately; persistent malformed content reaches the unchanged
> deadline with its last parse diagnosis and no socket. Portable controls stage a
> valid-looking endpoint prefix, a port-only file with its endpoint line missing, and invalid
> endpoint syntax before their final values, and separately prove persistent-malformed rejection,
> immediate unsafe-file cleanup, one launch, final-endpoint identity,
> socket/child closure and profile cleanup. No retry, relaunch, per-viewport sleep, browser
> reuse, fallback change or timeout expansion follows.
>
> The live v2 interaction surface uses Pixi `autoDensity` so its CSS canvas and
> hit coordinates stay viewport-sized at DPR > 1. `effectiveDensityPlan()`
> follows the touch-2 / desktop-3 heat caps and retains native backing through
> UHD 3,840×2,160. Ordinary viewports may use 8,388,608 backing pixels per
> full-screen canvas /16,777,216 aggregate; a viewport strictly above 8,388,608
> CSS pixels selects the ultra tier of 2,073,600 per canvas /4,147,200 aggregate.
> `fitResolutionToPixelCap()` searches against the actual rounded width and
> height, so desktop-8k and 5,120×2,880 each own two 1,920×1,080 stores
> (4,147,200 pixels combined), at DPR 0.25 and 0.375 respectively, without
> rounding above cap. Density transitions release and collapse the prior
> backdrop before resizing/allocating the replacement, record exact peak and
> budget ownership, then update Pixi screen/texture/event geometry even when a
> same-aspect logical resize retains the same integer backing dimensions. Both
> downshift and restore require a strict exact-target/`Browser.getVersion` pair,
> an advancing later post-render ticker turn, and stopped/stale-ticker negative
> controls. The transition still uses the existing full scene rerender; this is an
> allocation tier, not a newly implemented scene-art quality tier. Survey
> cards expose minimum-44px **Enter galaxy / Enter system** actions, and touch
> Planetside has a minimum-44px **Leave world** action. The eighth dock slot opens
> the canonical **Guide to the Universe**: `guide-content.ts` carries a
> source-addressed v1.8.9 snapshot of all 9 categories /43 authored stable ids /41
> legacy-live topics, category browsing, search and `data-gt` cross-links. A
> capability table supplies current copy for partial systems and explicit
> unavailable copy for unported mechanics; dormant `beacon` / `events` remain
> retained but hidden. `release-content.ts` similarly preserves all 56 legacy
> releases /398 bullets and keeps **A New Foundation**, the cumulative categorized
> v2.0 development bulletin, separate. Its implemented-outcome outline is explicitly
> `draft` / `Unreleased`; structural and rendered controls require canonical section
> order, unique nonempty bullets, scroll-reachable tail copy, and unchanged `rnSeen` /
> `releasePending` across open and reload. `V2_CURRENT_RELEASE_VERSION` is `null`,
> so that playtest identity cannot trigger an update or imply a production release. The Guide also renders the full source
> commit supplied by the guarded development package. First Guide open persists
> `seenGuide`. Import moved to **Settings →
> Bring expedition** through the same guarded loader and a named, focus-trapped
> top-layer modal. The live primary is parsed from the whitespace-trimmed JSON
> candidate, while the best-effort `cf_v2_import_original` keepsake retains the
> exact submitted text; a selected file is browser-decoded to text, so the
> moderator-held external file remains the byte-for-byte authority. Planet cards bind the captured galaxy+star `{seed,x,y}` context
> before Land/Atlas/Share, rejecting equal-seed coordinate substitution.
> Guide and Settings render above an open survey card; other panel stacking
> remains unchanged for Training. Field Training is six live
> chart/travel/landing lessons plus an honest graduation. Tooltip deep-links,
> Advanced Briefings and the full 21-step curriculum remain OPEN. The newer
> D-TRAIN-1 overlay above records exact legacy-checkpoint restoration. Lazy species art uses
> exact broker leases plus a serial close-at-idle dedicated worker, not a shared renderer import
> callback; Compendium and Planetside bind exact 132px owners, release stale work, and virtualize
> the 1,500-row list without retaining list-scale callbacks, portraits, or main-thread painter work.
> Survey presentation filters the legacy `Spectral class` descriptor row. Planet
> rarity is absent before landing and shown afterward as the plain display-grade
> name. Internal `.designation`/`spectral()` data remains deterministic for art and
> parity, and real stellar G/K/M/remnant classification remains ordinary identity.
> Each panel and Survey card owns exactly one top-right 44px Close action. On desktop,
> notifications plus Settings and Records share the bottom-right utility edge; balanced
> padding, separators and borders use the same glass geometry.
> `panels.ts` retains element-identity ownership for registered panel roots/openers and reads
> `data-panel-boundary` for non-dismiss chrome. The top bar, dock, Survey and both desktop rails
> declare that metadata; Search intentionally does not. Real-CDP smoke hits the exact 8px gap in
> each rail, requires the current panel/ARIA state to survive, removes each marker independently
> to recreate dismissal, and proves the opposite direction on a hit-tested canvas point. Both
> delegated document handlers reject non-`Element` targets before `closest`, restoring the legacy
> event-boundary guard without changing modal, Training, Search or Escape policy.
> Short-landscape panel-open uses a nonmodal split safe workspace: Compendium occupies the left
> safe-height column with a scroller recomputed from the safe viewport; Search, dock, and Survey
> when open remain visible, named, focusable, hit-testable, and operable at right. Panel-open
> status already yields trail/objective, while the short-landscape rule additionally yields only
> noninteractive top/context/hint chrome. Glass drives real hostile A++ first/middle/last and
> focus-pinned rows plus clipped-ancestor controls. This is a bounded geometry repair, not a broad
> presentation-polish claim.
>
> V2 now applies imported Text size / tone / font preferences, a contrast-safe
> 0.82..0.98 glass floor, safe-area and measured dock/context/hint offsets,
> minimum-44px panel/touch controls, focus-visible and forced-colors treatments,
> named sliders/import controls and opener focus restoration. Motion Auto tracks
> the OS live; Reduced removes CSS transitions/animation and freezes Pixi ambient
> clocks while snapping camera/fade state. The canvas is a named keyboard region:
> arrows cycle the actual rendered galaxies/stars/planets, Enter/Space invokes the
> same survey path, +/- zooms at the target and Escape releases it, with a visible
> ring and polite live announcement. Clipboard denial selects the exact CF1 code
> in Search and says Copy is unavailable; it never reports a false success.
> Portrait Planetside now derives its usable band from visible fixed top chrome,
> the last visible trail edge, and measured safe/dock/context lower chrome. It
> retains the trail only when a 72px useful roster plus 6px clearance fits;
> otherwise `syncSurfaceChromeBottom()` applies `surface-trail-yield` to hide the
> noninteractive trail while preserving a minimum-72px vertically scrollable
> roster. `syncDockH()` and `syncCtxH()` reclassify after asynchronous chrome
> measurement, and space restoration restores the trail. Glass-matrix controls
> `planetside-portrait-band-viability` and
> `planetside-portrait-trail-fallback` prove both directions.
>
> The matrix import fixture is witnessed as event-owned phases rather than a
> blind reload delay. One `cf-v2-import-phase/v1` stream binds the exact phase id,
> old document token, target session/default top execution context, and top-frame
> loader. A successful no-pending-save path is `invoked` (ticker running) →
> `claimed` → `no-active-persist` → `primary-write-started` →
> `primary-write-complete` → `release-started` → `release-complete`, with the
> ticker stopped after `invoked`; the alternate path inserts
> `waiting-active-persist` / `active-persist-settled`. Its absolute 20-second
> clock begins before one bounded `Runtime.evaluate({awaitPromise:false})` arm
> command, which receives no fresh deadline and is recorded with the evidence.
> Sticky CDP receipts then require exactly one valid
> `cf-v2-reload-release/v1` witness within that same import bound; allow 5 seconds from that receipt for a
> top-frame commit with a changed loader; and only then start the replacement
> document's independent 20-second boot budget. `replacementNavigationOutcome()`,
> `importReleaseOutcome()`, `importReleaseSequenceOutcome()` and
> `replacementReadyOutcome()` validate receipt time,
> exact target session, default top-frame context identity/generation/origin,
> expected URL, changed loader and changed document token. Old-context/global loss
> alone is not navigation or boot evidence. Pixi initializes with
> `autoStart:false`; the replacement emits the exact event-owned
> `cf-v2-boot-phase/v1` sequence `app-init-start`, `app-init-complete`,
> `backdrop-complete`, `save-load-start`, `save-load-complete`, `scene-rendered`,
> `slice-published`, `wiring-complete`, `ticker-started`, `first-tick`,
> `ready-scheduled`, `ready-emitted`. Each stage binds the target session,
> default top context, generation, origin, changed loader and document token.
> Ticker state must remain false through `wiring-complete` and true thereafter;
> only after the real tick/render, animation frame and later task does the
> replacement emit the optional `cf-v2-slice-ready/v1` tail binding. Two strict,
> no-retry, at-most-2-second target cycles then confirm that exact ready context.
> Each `Runtime.evaluate` is sent concurrently with root-session
> `Browser.getVersion`; cycle 1 samples immediately and cycle 2 awaits a one-shot
> Pixi ticker callback scheduled after the render listener, with a strictly
> advancing tick count. A timely browser heartbeat plus a timed-out/lost exact
> context is `product-unanswerable-after-ready`; an unhealthy heartbeat or
> malformed protocol outcome is instrument/transport failure. The live command
> ledger contains exactly five bound rows: import arm, cycle-1 target/heartbeat,
> and cycle-2 target/heartbeat. `browsercdp.send()` permits a shorter per-command
> timeout but never one above its connection-wide ceiling; one absolute deadline owns that timeout,
> and any early timer wake re-arms only the remaining interval before it may reject. Its browser-native
> `performanceNow` must also be strictly below 20 seconds; an exact-boundary
> control fails, preventing Node observer descheduling from laundering a late
> product boot. Ready is publication evidence; the two confirmations additionally
> prove an immediate target turn and a later post-render ticker turn, while later
> driven controls remain the broader answerability outcomes.
> `replacement-document-loader-token-phase`,
> `reload-resource-release`, and `replacement-boot-phase-sequence` negative-control
> same-loader token mutation, lost/rejected phases, wrong/duplicate/malformed
> session-context-loader-token events, stalled or just-late transitions, missing/
> reordered/identity-mismatched boot stages, early/running tickers, retained
> canvases, unreleased renderer and over-budget aggregate backing pixels.
> `ready-confirmation-heartbeat`, `ready-confirmation-ticker-progress`,
> `ultra-viewport-render-budget`, and `ultra-same-backing-resize` bring the plan
> to 57. Reports distinguish executed, product-blocked, and omitted controls so a
> product failure is not overwritten by a generic instrument omission. Sticky
> fatal Page/Runtime/Inspector/Network events
> remain authoritative even when the bounded diagnostic ring rolls over; the
> command never retries a red run. `import-phase-sequence` and
> `replacement-ticker-quiescence` additionally reject missing/reordered/wrong-
> operation receipts, a stopped ticker before `invoked`, a running ticker after
> claim, and exact-boundary-late arm or phase evidence. No timeout increase or
> `Promise.race` is placed around IndexedDB durability.
> The import-phase and generic release binding handler assigns a monotonic ordinal
> only across those two binding kinds for one armed capture. A successful terminal is
> exactly `release-started` N → release N+1 → `release-complete` N+2. Only that
> release-first intermediate remains pending under the unchanged import deadline;
> phase-complete-first, premature, nonadjacent, missing, late, duplicate, malformed,
> wrong-provenance, early boot/ready, and overlong phase evidence fail closed.
>
> `scheduleReplacementReload()` is the product half of that contract. All five
> intentional replacement transitions—Training restart after `persistView()`,
> atomic Training completion, persistent Training recovery, accepted
> `importBlob()` after `repo.write()`, and the storage retry after real
> bytes reappear—first claim one mutually exclusive replacement transaction, then
> stop a running outgoing Pixi ticker synchronously before any persistence await,
> stop ordinary persistence and call the boot-installed
> `releaseRendererForReload()`, and cross one task boundary before
> `location.reload()`. The release hook removes renderer-density listeners,
> destroys Pixi with global/child texture resources, detaches `app.canvas`, and
> collapses both it and `activeBackdropCanvas` to at most 1×1. It optionally emits
> the release witness through a CDP `Runtime.addBinding` seam before the execution
> context dies. This path is deliberately not registered on generic `pagehide`:
> a browser-cache restoration must not revive a destroyed Pixi application. A
> failed or rolled-back flow restarts only a ticker that its exact claim stopped;
> a successful replacement destroys the already-quiescent app. Invalid import
> bytes reject before claim and leave the live ticker unchanged.
>
> Test-battery #199, run `31571459050` / job `94034164092`, exposed the former
> old-token 10-second timeout at desktop-8k and a small-phone Planetside/trail
> overlap on pushed `33ea341`. Pushed repair
> `8b8a740286a56591cac9dc5734a2fba4c088939b` passed its exact sequential local
> battery. Matching test-battery #200 passed every root/product/v2 gate, one-run
> smoke, full 12-viewport matrix, personas and preview packaging; only final preview
> CDP startup failed before a page existed after that process lost the previous
> step's Chrome environment and selected Linux Edge. Pushed
> `4d14a75e934536dc5f204e40c74f666cc9514df4` moves the browser pin to job scope,
> and `08379d8c072c7eb22e2a029d666972c86d496326` carries the shared root-layout
> launcher/report.
>
> Matching test-battery #201, run
> [`31586917924`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924) /
> job [`94082765087`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31586917924/job/94082765087),
> completed once without retry and is **RED**. Every preceding gate, including
> `smoke:ci`, passed. Only desktop-8k preference import instrument-failed after
> the former 20-second replacement wait while the old loader remained and its
> slice token/import phase were absent. That is not a save-classifier rejection
> or reported repository-write error.
>
> Matching test-battery #202, run
> [`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
> job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
> completed once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
> and is **RED**. Every earlier root/product/v2 gate and `smoke:ci` passed. Only
> desktop-8k glass import/replacement instrument-failed after its first observer
> result arrived at 61.163 seconds. The former probe serially awaited three CDP
> commands that each owned a 30-second ceiling, so this is ambiguous instrument
> latency—not evidence of a 61-second product boot, save rejection or product
> failure—and remains preserved without retry.
>
> Prior immutable executable source `20896ad410b48ae0c407a9f3d6885d30ec6657b1`
> remains preserved clean evidence for the post-write release/ready contract before
> the ticker-quiescence repair. Prior #201 and #202 remain preserved red without retry.
>
> Test-battery #203, run
> [`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
> job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
> completed once without retry at exact pushed head
> `38e4f362533e272f56f708229f7a037f38ae8951` and remains **RED**. Every
> preceding root/product/v2 gate and `smoke:ci` passed. Eleven glass viewport rows
> passed; only desktop-8k import reached 20,015 ms before any release, ready,
> navigation, fatal, command, or event evidence. The outgoing 5,461×3,072 Pixi
> ticker remained active across the durable-write await and teardown under CI
> software rendering. This is a pre-release renderer-pressure cliff, not save
> corruption or a reported repository-write rejection. Preserve #203 without
> retry, timeout increase, or an IndexedDB timeout race.
>
> Before clean certification, one smoke attempt correctly refused mixed-source evidence
> because tracked documentation changed during its run (`source identity changed during
> slice smoke`). That single execution had no automatic retry and remains coordination/
> instrument evidence, not a product failure.
>
> Immutable executable source `7d9980e37e60f0cec8cb840e75098872b9cc90d0`
> then passed the complete exact sequential battery: root preflight selftest and
> owned-CDP preflight (only Edge 151 versus pinned Edge 150 drift), validate/fingerprint,
> root smoke, root layout selftest, `exact-7d9980e-root-layout` 787/787 across 10/10
> viewports plus exact-run verification, rarity 60M/0, dead-code 3 tooling references,
> v2 24 files / 273 tests / 1 skip, and every type/art/override/coverage/spec/instrument
> selftest. One-attempt `smoke:ci` passed 0 findings / 10 screenshots. Exact-source
> certifying glass at working-tree digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
> passed 12/12 viewports, 52/52 controls, `omitted=[]`, 0 findings/instrument failures/
> retries, and all 12 exact import-phase/release/ready paths in 194–239 ms. Desktop-8k
> recorded a 3 ms arm, 21 ms phase span with ticker true only at `invoked`, 0 ms write,
> 19 ms release, both 5,461×3,072 canvases →1×1, `performanceNow` 199.5 ms, 1 ms
> confirmation and 239 ms total. Nine automated personas passed. The initial malformed
> `npm run perf -- --runs=4` command was rejected before browser startup; the correct
> single terminal diagnostic recorded 646/726/74/157 ms (painted/answerable/press→panel/
> rebuild) and was not a retry of an evidence failure. Exact 37-file / 10,170,996-byte
> preview `dev-preview-exact-7d9980e` verified and browser-smoked PASS under Edge 151 at
> 320×568 for expected origin `https://dev-celestialfrontier.github.io`, distinct from
> production, content SHA-256
> `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`, exact
> `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, `publishable:false`.
> `7d9980e` remains immutable prior exact evidence. The later prior repair
> evidence is bound to clean executable source `46fb627` below. The
> artifact is origin-bound but not authorized for hosting or
> publication; human playtest, Ready and merge authority remain open.
> Development preview origin/package requirements live in
> `port/DEVELOPMENT_PREVIEW.md`; they do not constitute a release or deployment.
>
> Matching test-battery #204, run
> [`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
> job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
> completed once without retry at exact pushed head
> `4cee7d807b8f9258e370aad31c30756269f95a96` and remains **RED**. All earlier
> gates plus `smoke:ci` passed. Desktop-8k import/write/release/navigation/load/FCP
> were healthy: the arm command queued for 9,504 ms, release completed in 35 ms,
> the changed loader arrived at 45 ms, load at 231 ms and FCP at 268 ms. The new
> document then produced no ready witness within 20 seconds and no fatal event.
> Root cause was the combination of two independent full 16,777,216-pixel
> full-viewport allocations and Pixi `autoStart` before asynchronous boot wiring;
> this is not an import, repository-write, release, navigation, load or FCP
> failure. Preserve the single red execution without retry or deadline growth.
>
> Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
> passed the exact local battery. One malformed `--verify-run` operator invocation
> caused local SIGABRT/report overwrite; one correct rerun plus verification passed
> `exact-46fb627-root-layout`, 787/787 across 10/10. V2 passed 273/1 plus every
> gate/selftest; one-attempt smoke passed 0/10. Full certifying glass at source-snapshot digest
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
> passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
> failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
> release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms,
> 1 ms confirmation, both outgoing 3,862×2,172 canvases →1×1 and the replacement
> pair at 16,776,528 pixels combined. Nine automated personas passed; terminal-
> only performance was 595/676/76/168 ms. Manifest
> `dev-preview-exact-46fb627` records 37 files /10,176,376 bytes, content SHA-256
> `4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`,
> exact tree `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected origin
> `https://dev-celestialfrontier.github.io`, production distinct and
> `publishable:false`. `46fb627` remains prior immutable exact evidence. No preview
> host, human play, Ready, merge, release,
> deployment or version authority follows from local automation.
>
> Matching test-battery #205, run
> [`31621227550`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550) /
> job [`94196289291`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550/job/94196289291),
> completed once without retry at exact pushed
> `c57305fbf30af2bc8158ff46af1ec49ec4455d95` and remains **RED**. Every
> preceding gate and `smoke:ci` passed. Desktop-8k completed import/write/release,
> changed-loader navigation, all 12 boot stages, and ready at browser-native
> `performanceNow` about 3,733 ms; only the next exact-context command timed out
> at two seconds. With no concurrent browser heartbeat, #205 is strong evidence
> of post-ready target starvation but not retrospective proof of healthy browser/
> CDP transport. Preserve it without retry.
>
> Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass
> captures based on `c57305f` remain non-authoritative; their sandbox `EPERM` and
> corrected `7680.000000000001` assertion did not retry a product failure.
> Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
> passed the complete exact sequential battery from clean source-status SHA-256
> `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
> and source-snapshot
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
> passed outside sandbox without product retry. Root validate, legacy smoke,
> rarity and dead-code passed. Root layout
> `exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
> under Edge 151 in 75,532 ms (report SHA-256
> `7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`).
> V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt
> slice smoke passed 0 findings /10 screenshots /0 retries in 105,379 ms (report
> `c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`).
> Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
> zero findings/instrument failures/retries in 52,254 ms (report
> `1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`),
> with 176–185 ms reloads. Exact 8K was 185 ms total /2 ms arm /12 ms
> invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
> `performanceNow`; target confirmations were 1/9 ms and heartbeats 1/1 ms.
> Outgoing/replacement stores were 2,730×1,536 each; outgoing stores collapsed
> to 1×1 and replacement stayed 8,386,560 combined pixels. Nine automated
> personas passed—not human play—with JSON/Markdown SHA-256
> `c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
> `43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`;
> terminal-only performance was 578/659/76/170 ms. Preview
> `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
> Edge 151; manifest
> `0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
> 37 files /10,186,230 bytes, content
> `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
> tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
> production distinct and `publishable:false`. Live Git/status/PR checks determine
> the docs-only tip; matching CI and host/human/Ready/merge/release/deploy/version
> authority remain open.
>
> Test-battery #206, run
> [`31635297321`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321) /
> job [`94243979205`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321/job/94243979205),
> completed attempt 1 without retry at exact pushed
> `558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
> All earlier steps and `smoke:ci` passed. The 8K reload passed in 8,749 ms;
> ready `performanceNow` was 2,578.6 ms, and target cycles were 1,905/1,910 ms
> with 3/1 ms heartbeats. The later 5,120×2,880 transition's exact-context
> `Runtime.evaluate` timed out at 2,003 ms versus the strict 2,000 ms bound while
> `Browser.getVersion` answered in 2 ms; `last:null`. The sole
> `ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` is a product answerability finding: all 12
> viewports ran, with 1 product finding, 0 instrument failures, 56 executed plus
> 1 product-blocked control =57, `omitted=[]`, 0 retries, and no persona/preview
> output. Preserve #206 red without retry.
>
> Test-battery #207, run
> [`31642880191`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191) /
> job [`94269466117`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191/job/94269466117),
> completed attempt 1 without retry at exact pushed
> `ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
> `8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. All prior gates,
> `smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed
> because a healthy valid release witness arrived between `release-started` and
> `release-complete` and the observer rejected that intermediate. Release itself
> was healthy. The report records 0 product findings, 1 instrument failure, 57
> planned/listed controls, empty blocked/omitted ledgers, 0 retries, and no persona/
> preview output. Preserve #207 red without retry.
>
> The dirty #207 diagnostic (report
> `805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
> chronology only. Immutable executable source
> `6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete exact clean battery
> at clean status/snapshot `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` /
> `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
> The first sandboxed preflight Edge launch SIGABRTed before CDP; the same invocation passed
> when permitted with only Edge 151/pin-150 drift—an environment refusal, not a product retry.
> Root gates and exact layout 787/787 across 10/10 passed (report
> `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`); v2 passed 273/1 plus all gates;
> one-attempt smoke passed 0 findings/10 screenshots in 105,430 ms (report
> `139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844`; log
> `76a40b9bd8f88dd5f5ebdc09271c0ed289478795d6cd011338df349438ef62b8`).
> Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact 6/7/8 tails on every
> row, empty blocked/omitted ledgers, and zero findings/instrument failures/retries (report
> `a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`). Tablet-
> portrait was 196 ms with commands 2/1/1/7/0 and ready `performanceNow` 166.3 ms;
> exact 8K was 197 ms with commands 1/1/0/7/0, release→commit 34 ms, commit→ready
> 131 ms, ready `performanceNow` 163.6 ms, outgoing 2,365×1,330 twins →1×1, and
> replacement 6,290,900 pixels combined. Nine automated-only personas and terminal-only
> 635/717/77/151 ms performance passed. Preview
> `dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151 over loopback,
> bound to the expected separate development origin, with `publishable:false` and content SHA-256
> `04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`.
> That immutable source remains prior #207 executable evidence; live Git/PR state determines
> the current tip, upstream, and checks, and the selected pushed tip requires matching CI.
> No host/human/Ready/merge/release/deploy/version authority follows.
>
> Test-battery #208, run
> [`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
> job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
> completed attempt 1 without retry at exact pushed head
> `ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
> and branch-flow run `31649175614` / job `94289512873` passed. Steps 1–15 and
> `smoke:ci` passed. Desktop-8k alone then reported
> `REPLACEMENT_UNANSWERABLE_AFTER_READY`: valid 2,365×1,330 replacement stores
> scheduled ready at browser performance 584.3 ms but emitted at 3,143.8 ms, a
> 2,559.5 ms gap; exact target cycle 1 timed out at 2,003 ms against the strict
> 2,000 ms bound while the concurrent heartbeat answered in 1 ms, with no fatal.
> The complete 12-row report records 1 product finding, 0 instrument failures,
> 57 planned controls with `ultra-same-backing-resize` product-blocked,
> `omitted=[]`, 0 retries, and no persona/preview output. Preserve #208 red.
>
> The current fixed tier above 8,388,608 CSS pixels is 2,073,600 pixels per
> simultaneous canvas /4,147,200 aggregate, producing exact 1,920×1,080 stores at
> 8K DPR 0.25 and 5K DPR 0.375 while leaving native UHD unchanged. The unchanged
> two-second/heartbeat/ready/retry contracts and literal old/new-shape negative
> controls make this a sustained deterministic product repair rather than a pause.
> The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
> dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
> `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed committed-clean root layout
> 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`),
> v2 273/1 plus all gates, one-attempt smoke 0/10 in 105,339 ms
> (`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
> `fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`), and glass
> 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 release tails,
> five-command ledgers, empty blocked/omitted ledgers and zero findings/instrument failures/
> retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`). Exact
> 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms, 33/129 ms
> release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels at DPR 0.25;
> terminal-only performance was 606/685/74/171 ms. Automated persona JSON/Markdown hashes
> are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
> `fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`.
> Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
> under Edge 151 over loopback, bound to expected separate origin
> `https://dev-celestialfrontier.github.io`, with `publishable:false`; manifest/content/tree
> hashes are `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
> `5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
> `5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR is authority for current
> tip/upstream/checks; the selected pushed tip requires matching CI.
>
> Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
> remains prior exact #206 executable evidence (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
> snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
> Root preflight warned Edge 151 vs pin 150; validate/smoke, layout 787/787 across 10/10,
> v2 273/1 plus all gates and one-attempt slice smoke 0/10 passed. Certifying glass passed
> 12/12, 57/57, empty blocked/omitted, zero findings/instrument failures/retries in
> 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`).
> Exact 8K was 203 ms / `performanceNow` 158.2 ms, targets 1/10 ms, heartbeats 0/0 ms;
> outgoing 2,365×1,330 stores →1×1 and replacement stayed 6,290,900 pixels combined.
> Nine automated-only personas and terminal-only 581/659/73/152 ms performance passed.
> Preview `dev-preview-exact-df1c28b-20260812T211642Z` was browser-smoked under Edge 151
> over loopback, bound to the expected separate dev origin, with `publishable:false`, manifest
> `758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`,
> content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`, tree
> `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. That source remains prior #206 evidence;
> both it and clean `6554b2b` remain prior evidence; clean `307b8aaf` is current local
> #208 executable evidence. No host/human/Ready/
> merge/release/deploy/version authority follows.
>
> **v1.6 additions not yet folded into the sections below** (see ART_DIRECTION / PROCEDURAL_CHARACTERISTICS /
> UI_PRESENTATION / SPECIES_AND_GENOME for detail): the Earth-bestiary rig system (`_rig*` per class) +
> `hdGenesFor` procedural phenotype resolver + `hdBeastBare` structural-skin/limb/tail/habitat-preserve
> passes; landing sub-surface scenes **`_hdReefScene`** (coral) and `_hdAbyssScene` (deep), routed from
> `showVistaBox`; `_hdBiomeDress` biome cases. New verification tools: `tools/render-audit.js`,
> `tools/rig-audit.js` (193 sentinels), **`tools/biome-audit.js`** (biome-layer integrity), and proof
> sheets `tools/sheets/biome-coverage.js` (MODE=earth|proc, EMPTY=1), `proc-skins.js`, `proc-aqua.js`,
> `b15-butterfly.js`.

> **2026-08-10 port/v2 full-catalogue reset overlay (historical; superseded for live delivery by
> the 2026-08-17 broker/worker overlay above):** PixiJS owns the live
> galaxy/world scene in `port/v2/apps/game/src/main.ts`; deterministic organism
> anatomy was generated by Canvas2D painters through
> `packages/art/src/speciesart.ts` and displayed as DOM `<img>` portraits in the
> Compendium/planetside UI. The genetics facade records the selected Earth
> lineage's exact `_earthBlendKingdom`; `speciesoverrides.ts` sends fauna to the
> lineage-aware HD fallback except for the exact reviewed set Fruit Bat, Eagle,
> Wolf, Elephant, Chameleon, Dragonfly and Octopus, whose marked hybrids use the
> lineage-owned modern painter. Sea Turtle and Great White Shark remain protected
> on the reviewed legacy route; flora/fungi/microbe use the exact kingdom+name
> owner before generic procedural mapping. Portrait and thumb caches canonicalize
> the complete deterministic genome because `A×B` and `B×A` can share a seed while
> inheriting different traits. The schema-v4 hybrid contract guards 13 exact
> five-stage lineages /251 assets spanning every kingdom, including Amoeba as the
> principal microbe row, plus route/cache/mixed-owner negative controls. The exact
> source-`03ea297` package review returned **PASS with optional polish only**; the
> sealed preparation status remains immutable and final all-bloodline certification remains open.
>
> `gp71rejudge.mjs` guards set-aware references; `gp71compare.mjs` exact-joins
> old/current 1,250-image roots; `fullresetlayout.mjs` derives the official 181
> families / 233 packets; and `fullresetreview.mjs` binds each verdict to clean
> 40-hex provenance, native 440px, unlabeled 300px, actual unlabeled 132px,
> labelled old/current and exact `mustRead`/procedural-plan hashes. Clean reset
> commit `bc26e8` produced the first complete official baseline: **516 PASS / 14
> POLISH / 720 FAIL** across all 1,250 rows. It is fully fresh but not
> certification-eligible.
>
> Wave 1 owns exactly **177 r1 non-PASS targets**: root 38 (2 fungi + 8 microbes +
> 28 procedural), fish 59, trees 48, and fauna2 32. Independent 440/300/132
> rejudging closed all four groups **177/177 scoped PASS**. Source ownership is
> bounded to `alientraits.ts`, `invertoverrides.ts`, `proceduralfamilies.ts`,
> `proceduraloverrides.ts`, `speciesoverrides.ts`, `faunaoverrides3.ts`,
> `florarost.ts`, `floraoverrides2.ts`, and `faunaoverrides2.ts`. These scoped
> verdicts are not a replacement full-catalogue score. Wave 1 is committed and
> pushed as `d005090f`.
>
> Apple's focused continuity repair remains independently accepted under its
> historical ruler. Vanilla Orchid r6 was
> independently PASS at `floraoverrides2.ts` SHA-256
> `5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`:
> the pure portrait remained byte-exact, five stages were unique and progressively
> farther from pure, defining organs survived, and joins remained continuous. The
> sealed schema-v3 evidence validated 234/234 assets and both browser orders; it is
> superseded for the broader 2026-08-11 Platinum ruler by the 13-lineage /251-asset
> schema-v4 contract. The earlier
> `FAIL_BYTE_IDENTICAL_STAGES` state is closed diagnosis, not current status.
> Whole-form routes return
> before legacy generic painters; features behind that return are inert, while a
> second same-target overlay risks double-painted seams. The pixel-neutral flora
> cleanup made the strict/reset tree flags mutually exclusive for 39 overlapping
> names and removed dead orchard/citrus alternatives with 0/174 tree-surface and
> 0/332 Earth-flora native drift.
>
> Wave 2a is committed/pushed as `00e499c`. Mammal A
> is 4/4 independently PASS (Colugo, Sugar Glider, Fur Seal, Sea Lion); INVERT
> worms+sessile is 13/13 PASS; and S1–S3 is 15/15 PASS after bounded R2 closed
> Caddisfly, Diving Beetle, Firefly and Water Beetle at 440/300/132. Its 156
> current/repeat PNGs are exact and all 22 protected rows remain byte-identical.
> The combined 32-target scope is 32/32 PASS. This is not a new catalogue tally.
> Wave 2b is independently **51/51 scoped PASS**: Mammal B 25/25, Bird B1
> 21/21 and Invert I 5/5. Each lane failed closed and reran only its bounded
> blockers: six Mammal R3 rows (Brown Bear, Grizzly Bear, Bobcat, Lynx, Serval,
> Sand Cat), four Bird R2 rows (Secretary Bird, Rhea, Seriema, Hummingbird), and
> Banana Slug's 132px tentacle/eye read. Final source SHA-256 values are
> `quadrupedoverrides.ts` `288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE`,
> `mammaloverrides.ts` `2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA`,
> `faunaoverrides.ts` `783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10`,
> `birdoverrides.ts` `B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF`,
> and `invertoverrides.ts` `9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D`.
> Their current/repeat and protected-control evidence is sealed. The final
> integrated gates are green with all five source SHAs unchanged: typecheck and
> artunused pass; speccheck is 417/0/0; overridecheck is 1,014/1,014 catalogue
> and 1,010/1,010 Earth routes; speciesaudit is 1,250/1,250 with zero failures,
> duplicates or clipping; targeted/full diff checks pass. Wave 2b is committed/
> pushed as `9c148f0`, but this scoped closure does not change r1's 516/14/720 or close
> full recertification, ZIP, reset PR or release.
>
> Wave 2b is committed/pushed as `9c148f0`. Wave 2c is independently **56/56
> scoped PASS**: Mammal C 13/13, Bird B2 28/28 and Invert II 15/15. Mammal C
> progressed from 0/13 candidate-ready through 8/13 and 11/13 previews before
> Red Panda's continuous leg/body join and Tasmanian Devil's integrated chest
> band closed. Bird B2's first independent judgment returned 25 PASS /3 FAIL
> (Eider Duck, Rail, Avocet); Invert II's returned 13 PASS /2 FAIL (Krill,
> Tadpole Shrimp). The final exact-five repair was independently accepted.
>
> Final Wave-2c sources are `quadrupedoverrides.ts`
> `45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59`,
> `mammaloverrides.ts` `50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2`,
> `faunaoverrides.ts` `D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5`,
> `birdoverrides.ts` `C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21`
> and `invertoverrides.ts` `6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0`.
> The shared final-R2 root is
> `port/v2/apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10`; manifest
> SHA-256 is `BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`.
> It binds 249 rows, 747 surfaces per run, exact A/B, 579 baseline-exact protected
> surfaces, 168 changed target surfaces, three drift-free 139-file input
> snapshots and three rejected negative controls.
>
> Integrated Wave-2c gates are green with all five hashes unchanged: typecheck,
> artunused, 23-file Vitest (238 passed /1 skipped), speccheck 418/0/0,
> overridecheck 1,014/1,014 live +1,010/1,010 Earth, speciesaudit 1,250/1,250
> with zero failure/duplicate/clipping, hybridcheck with 11/11 injected failures
> rejected, hybridmatrix/speciesstrip/fullresetlayout/fullresetreview selftests,
> coveragegap 1,010/1,010 with zero remaining and `git diff --check`. Wave 2c is
> committed/pushed as `dc015cf`, but full recertification, ZIP, reset PR, merge
> and release remain OPEN.
>
> Wave 2d is independently **50/50
> scoped PASS**: Mammal D 16/16, Bird B3 27/27, and Invert III 7/7. Mammal D
> failed closed on six preview blockers, then on Civet's still-round muzzle;
> Civet-only R4 supplied the continuous pointed muzzle. Bird B3 progressed from
> 11/27 candidate-ready through an exact-16 R2 and exact-three tail/streamer R3.
> Invert III progressed from 5/7 through an exact-two Camel Spider/Tarantula R2.
> Every final verdict is author-separated at 440/300/132.
>
> The final root is
> `port/v2/apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10`; manifest
> SHA-256 is `DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`
> and pre-edit seal is
> `7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F`.
> It binds 304 rows =50 targets +254 protected controls and exact 912/912 A/B
> surfaces; all 762 protected surfaces match baseline, all 150 target surfaces
> changed, Civet-only R4 changed 3/3, and the other 909 surfaces stayed exact.
> Three 139-file input snapshots have zero drift and four negative controls were
> rejected.
>
> Final Wave-2d source SHA-256 values are `faunaoverrides.ts`
> `63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2`,
> `birdoverrides.ts` `48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7`,
> `quadrupedoverrides.ts` `544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1`,
> `mammaloverrides.ts` `776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E`,
> and `invertoverrides.ts` `2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677`.
> The prior `marsupial-c1`, Skua-colour, and shadowed Invert-II-option P2 items
> are now proven pixel-neutral against all 254 protected rows.
>
> Integrated Wave-2d gates are green with those five hashes and the 139-input
> aggregate unchanged: typecheck/artunused, 238-pass/1-skip Vitest, speccheck
> 419/0/0, coveragegap 1,010/1,010, artaudit 23/0, tokencheck selftest 16/16,
> overridecheck 1,014/1,014 routes +1,010/1,010 species, speciesaudit 1,250/1,250
> with zero failure/duplicate/clipping, hybridcheck and its 11 negatives,
> hybridmatrix/speciesstrip/fullresetlayout/fullresetreview selftests, and
> `git diff --check`. Wave 2d was committed/pushed as `2ed0f28`. The frozen r1 ledger stays
> 516/14/720; full recertification, ZIP, reset PR, merge, release, and deployment
> remain OPEN.
>
> Wave 2e is the exact static 47-target scope Mammal E 13 + Fauna E 21 + Invert
> IV 13. Checkpoint `5db9039` reached `develop` through merged PR #8 at
> `bb1a980`; its four frozen art-source hashes remain exact. No Wave-2e visual
> verdict exists. The documented 288-row/864-PNG pre-edit root stayed under
> ignored `port/v2/apps/game/smoke/` on Windows and is absent from the Mac clone
> and every Git ref, so its recorded seal `BC424C8F…AA37`, index
> `2AE4FDB1…26E3`, protected roster, and one-off controls cannot be independently
> verified here. Recover that exact root and producer, or explicitly authorize a
> deterministic `2ed0f28` reconstruction that reproduces both hashes, before
> post-edit A/B promotion. The browser review tools also hard-code Windows Edge,
> so their historical passes are not fresh Mac results.
>
> The independent Mac-side repair is tooling-only: `overridecheck` now delegates
> each complete TypeScript art source to pinned Rolldown 1.2.1/Oxc and counts only
> literal string property/array AST nodes. Every such key is validated regardless
> of length or alphabet, and malformed CANON keys cannot disappear. Exact controls prove inline/ternary
> values are not keys, later duplicates survive template/regex,
> control-head/member-call, Unicode-identifier and ASI grammar traps. Full-source
> declaration traversal covers parenthesized, annotated, comment-separated and
> later `const` declarators; post-declaration writes/aliases and malformed
> route-table source exit 2. Painter values must be statically callable (and
> quadruped specs objects) through immutable, unwritten exact local/import bindings;
> supported factories must return a direct callable expression. Neither `null!`,
> mutable aliases, nor truthy objects count as painters. The denominator is one exact
> four-kingdom `_EARTH_NAMES` AST with its read-only consumer pinned.
> Wiring is measured only from supported route-selection
> initializer AST shapes, exact precedence and executable guard/call/fallback/furniture chains, and
> the `ink.c` → `fitInk(ink.cv,c,…)` → returned-`cv` path inside parsed
> `resolveOverride`; disconnected consumers, always-false predicates,
> discarded/inert syntax, and later count-summary mentions cannot mask a disconnected
> table. Computed route members/methods outside exact audited consumer nodes fail closed.
> Recursive `.ts`/`.mts`/`.cts`/`.tsx` discovery rejects untracked executable imports/re-exports;
> normalized full-path plus actual-export ownership prevents nested same-basename/export
> impersonation. Shadow direction follows resolver precedence, and helper binding/implementation
> drift, direct trusted-global escape, and incomplete kingdom-qualified route coverage fail.
> The sentinel assumes standard unmodified platform intrinsics and approved dependency implementations;
> it is not a visual verdict. It reports
> 1,014/1,014 live routes and 1,010/1,010 Earth
> species without changing a painter.
>
> The v2 renderer caps DPR at 2 for touch/coarse pointers and 3 for desktop. An
> accidental unreferenced 26,400×19,800 PNG at `packages/art/src/5` (2,029,643
> bytes), twelve superseded local painters and definite no-op locals were removed
> with consumer/pixel proof. The live acceptance contract is
> `port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`; no GP7/GP7.1 band is
> a current PASS, and no final all-PASS ZIP or reset PR exists.

---

## 1. What the game is

**Celestial Frontier** (subtitle *Cosmic Codex*) is a single-file, offline-capable
HTML/Canvas game about exploring a deterministic, procedurally generated, effectively
infinite universe. The player is an **explorer** running an **expedition**: they zoom
from the open universe → into a galaxy → into a star system → down onto a planet
surface, surveying worlds, cataloguing alien life, breeding hybrids, conquering planets,
and assembling the **Prime Codex** (9 legendary "Signatures") to win.

- **Genre:** procedural exploration / creature-collection / light tactical combat.
- **Tone:** awe-driven, "pure dopamine," endless exploration; you *cannot* truly finish it.
- **Platform:** runs as a single `.html` file in any modern browser, desktop or mobile.
  Designed mobile-first (the player tests on iPhone).
- **Persistence:** browser `localStorage` only (per-device, per-browser). No server.

### Win / end condition
Complete the **Prime Codex** by claiming all **9 Signatures**, then choose an **ending**
(there are multiple ending paths, e.g. a Prismatic ending requiring conquest + a sapient
find + a deep Compendium). The universe remains open and playable after winning.

---

## 2. Files & build/test workflow

| File | Purpose |
|---|---|
| `main.js` | **The source of truth** (~24,300 lines). **Gitignored** — recoverable from the committed html, see below. |
| `celestial-frontier.html` | **The build artifact, and the entire shipped game.** ~26,750 lines, ~1.93 MB. **TWO** `<style>` elements (append new CSS to the **LAST**), then markup, then one `<script>` from ~line 2,420. **All CSS lives here — there is none in `main.js`.** |
| `original/celestial-frontier-v1.0.html` | Pristine pre-refactor v1.0 build (source of the determinism baseline). |
| `tools/` | Verification toolkit (`npm install` once; see `tools/README.md`). |
| `celestial-frontier-codebase-reference.md` | **This file.** |

*(Counts corrected 2026-07-30. This table read "~8,000 lines, ~462 KB … one `<style>` … `<script>` starts ~line 948" — off by more than 3× and wrong about the number of `<style>` elements, which matters because appending CSS to the first one silently does nothing.)*

### Working method (important for future edits)
Edit `main.js`, never the html in place, and validate before shipping:

1. Edit `main.js` via exact, unique string matches (a bad match must never
   silently corrupt the file). **CSS is the exception — it lives only in the html**;
   append to the **LAST** `<style>` element. `build.js` preserves it.
2. `node tools/build.js` — assembles `main.js` (+ the html's own CSS/markup) into
   `celestial-frontier.html`.
3. `node tools/validate.js` — rebuilds, then runs `node --check`, CSS brace balance,
   duplicate-id check, version consistency, class→rig binding, colour atlas, biome
   profiles, render audit, the no-`Math.random`/`Date.now`-in-domain-modules grep, a
   headless **jsdom boot** (zero errors required), and a **50-probe determinism
   fingerprint** that must match the v1.0 baseline (`tools/baseline.json`) byte for byte.
4. Ship the updated `celestial-frontier.html` only when everything passes (§12 lists
   the full nine-suite battery and which four gate every batch).

> ⚠ **`node tools/extract.js` is NOT part of this loop.** This section used to open with
> it as step 1, which is the most dangerous stale instruction this file has ever carried:
> `extract.js` regenerates `main.js` **from the html** and silently discards every edit
> made since the last build. It is a **one-time bootstrap for a fresh clone**, and the
> reason `main.js` can be gitignored safely (`node tools/extract.js celestial-frontier.html <out.js>`
> recovers it — always pass an explicit output path). The everyday command is `build.js`.
> CLAUDE.md rule 4 has carried this warning for some time while this file still
> recommended the opposite — a reminder that a correction must be applied everywhere the
> old claim lives, not just where it was noticed.

**Encoding caution:** the source mixes encodings — some unicode is stored as literal
backslash-u escape *text* in JS strings (renders at runtime), some as real UTF-8 chars
(—, ·, ❤, emoji). In Python here-docs, a single `\uXXXX` decodes to a real char; double
`\\uXXXX` stays literal. Prefer HTML entities (`&middot;`, `&mdash;`) in static markup to
avoid escape-text rendering bugs. Use `cat -A` to see true bytes before matching.

---

## 3. Core architecture

### Module structure (SOLID restructure, June 2026)
The script is one strict-mode IIFE organized into three strata (full map in the
`ARCHITECTURE` comment at the top of the script):

1. **Domain modules** — banner `@module <Name> [domain]` — pure, deterministic,
   no DOM/clock/`Math.random()`. Each is a revealing-module IIFE that returns a
   frozen API object, destructured back into script scope so call sites keep
   their original names (`const {mulberry32,…}=Rand;`). In dependency order:
   `Rand` (PRNG/hash/noise) → `PlanetGen`, `Naming`, `WorldConfig` (anchors),
   `StarCatalog` → `WorldGen` (cell-based generation) → `SurveyPhrases`,
   `SpeciesTraits` → `Genome` → `EncUtil` (b64/SVG-URI) → `Genetics`
   (evolve/cross) → `Ecology` (biospheres/civs) → `Descriptors` →
   `CombatCore` (battle stats, abilities, duels, CFB-codes).
2. **Art & service modules** — `@module <Name> [app]` — deterministic canvas/SVG
   art and self-contained services: `ThumbArt`, `GalaxyArt`, `SpeciesArt`,
   `Fx` (bursts/shake/fanfares), `SaveSystem` (save/load/reset/wipe),
   `Renderer` (the four `draw*` passes).
3. **App sections** — `@section <name>` — UI panels, input, progression wiring
   and shared mutable state. Cross-section mutable bindings (e.g. `essence`,
   `hp`, `pstats`, settings flags) deliberately live in plain script scope: a
   destructured module export would not propagate reassignment, so a module may
   only own a `let` that no other section reassigns.

**`_hdLater(fn, ms)`** (2026-07-29) sits at game-IIFE top level, immediately after
`@end PlanetGen`, and is the one scheduler both art modules use for their
"instant lo → async hi" upgrade. While `_introUp()` is true it re-polls at 250ms
instead of rendering, because HD synthesis behind the first-run naming screen is
invisible *and* blocks the only control on screen (measured: 6440ms → 1905ms to an
answerable gate on a 4×-throttled phone profile). It lives at top level on purpose —
its callers are in two *different* nested module IIFEs (`ThumbArt.getPlanetSprite`,
`GalaxyArt.getGalaxySprite`), and a helper belongs in the scope of its **callers**.
See UI_PRESENTATION.md § "THE ART-HOLD LAW" and `tools/bootperf.js`.

**`_szOf(g)`** (v1.8.9) is exported from `Genome` and is the single definition of "what size
means": `size % FA_SIZE.length`, the value the card prints. `crossGenome` mutates `size` without
wrapping, so bred genomes drift past 5 (~12% by generation 5); six readers used to take it raw and
classified a "tiny" creature as Megafauna with the full rarity boost (vit 68 vs 52, measured). It is
exported rather than duplicated **because a second inline copy is exactly the bug it fixes** —
v1.8.6 computed the same truth about `size` in two places and they disagreed. Guarded by
`tools/sizedrift-check.js`.

⚠ It was first written as a module-private helper and called from `@section descent`, which threw on
the landing path. `validate`'s jsdom boot passed, because nothing throws until you actually land on a
world — **`smoke` caught it** (553 → 551). Exporting one more name means all three places: the banner
`API:` line, the `Object.freeze({…})` return, and the destructuring line beneath it.

Names not in a module's `API:` list are module-private (interface segregation).
To export another name, extend all three: the banner `API:` line, the
`Object.freeze({...})` return, and the destructuring line after the IIFE.
Extension points are data registries (open/closed): trait tables,
`ABILITY_THEMES`, `GRADE_TIERS`, `REGIONS`, `SIGS`, `ACH`, `EVENT_DEFS`,
`MODE_PAINTERS` (mode → draw pass).

### Rendering
- **Canvas2D** full-screen (`#cosmos`), redrawn every frame via `requestAnimationFrame`
  (`frame` → `frameInner`). `DPR = Math.min(devicePixelRatio||1, 3)` caps mobile GPU cost.
- Four zoom **modes** held in `st.mode`: `'universe'` → `'galaxy'` → `'system'` → `'surface'`.
  Each has its own draw function: `drawUniverse`, `drawGalaxy`, `drawSystem`, `drawSurface`
  (plus `drawBackdrop`), dispatched per frame via the frozen `MODE_PAINTERS` registry.
  `checkTransitions` handles zoom-driven mode changes; pinch/scroll
  zoom via `zoomAt` / `zoomLimits`. **Landing assist** (Tier 2): a zoom-IN
  gesture blocked at the system-mode ceiling (`zoomAt` with `f>1` clamping to
  `zmax`) arms `_assistArm` for 450 ms — the one unmistakable "let me land"
  signal. While armed, `checkTransitions` glides the camera toward the largest
  planet past landing size (`apparent>0.40*minWH`, within `d<1.6*minWH`,
  `lerp 0.14/frame`; an instant step instead when `!motionOK()`), never while
  `dragging`/`pinching`, until planetfall fires. Un-armed proximity — surveying
  moons, framing rings, parking — is never hijacked. Canvas tap targets: every
  pick's **minimum** radius scales by `PICK_F` (×1.4 on `TOUCH` devices, ×1 on
  desktop); true-apparent-size components are untouched, so nothing can start
  stealing taps from a bigger neighbor (the moon lesson).

### Determinism (the heart of the game)
Everything is generated from seeds, so the universe is identical on every device and
shareable by code. Core PRNG helpers: `mulberry32(seed)`, `hashInt(...ints)`,
`cellRng(cx,cy,salt)`. Spatial generation is **cell-based**: `galaxiesInCell(cx,cy)`,
`starsInCell`, `fineStarsInCell` generate content on demand per grid cell (infinite world,
low memory). Object descriptors (`planetDescriptor`, `starDescriptor`, `galaxyDescriptor`,
etc.) are pure functions of position/seed.

### Key constants (§ verify in source before relying on)
| Const | Value | Meaning |
|---|---|---|
| `UCELL` | 400 | universe grid cell size |
| `OBS_R` | 5200 | observable radius |
| `GR` | 1200 | galaxy radius scale |
| `SYS_R` | 320 | system radius |
| `HOME_GAL_SEED` | 999 | home (Milky Way) galaxy seed |
| `HOME_POS` | {x:90,y:-60} | home galaxy position |
| `SOL_SEED` | 424242 | our solar system seed |
| `PLAYER_SEED` | 0x50A1E5 | stable seed → deterministic duels vs the player |
| `HARVEST_CD` | 3600e3 | legacy 1-hour wall-clock cadence; retired as the harvest gate in v1.8.8, retained only by the legacy load-time display-stamp floor |
| `SAVE_KEY` | `'cfcc_save_v2'` | localStorage key (v1.5 fresh start; v1 read once for the farewell, then removed) |
| Earth | planet seed **133** | home world, conquered from game start |

---

## 4. World generation

**Current v2 typed boundary (2026-08-15):** `galaxiesInCell` returns its
memoized mutable galaxy array with required finite `[0,1]` `web` metadata, even
when the array is empty. `supernovaSites(galaxySeed, epoch)` returns 1–3 typed
sites, each with a typed `NS | shell | BH` remnant and 1–3 births; `epoch` is the
deterministic cache/time key, not a count. A plain `number` cannot nominally
prevent count misuse, so stronger epoch ownership remains F4. Import is safe,
but an uncached ordinary galaxy/merger/dwarf generation path still needs the
legacy-compatible 16-entry `GAL_SPRITES` binding installed first; empty,
special-only, and cached paths may not read it. The app performs that installation
before generation. `slimGal` is owned by Descriptors in v2, not WorldGen.

- **Galaxies:** `galaxiesInCell`, `galaxyProfile`, `galaxyName`, `makeGalaxySprite`,
  `slimGal`. Special objects: quasars, wormholes (`galaxyWormhole`), supernova sites
  (`supernovaSites`), dwarf galaxies, CMB backdrop.
- **Stars:** `starsInCell`, `starName`, and `starClass` own real astronomical
  M/K/G/F/A/B/O and remnant identity (white dwarf, neutron star, magnetar, red giant,
  brown dwarf, black hole). The separate deterministic `spectral()` designation is
  internal rarity/art data; current v2 does not render it as a **Spectral class** row.
  `starDescriptor`, `supernovaDescriptor`, `protostarDescriptor` remain pure.
- **Planets:** `planetParams(seed)` returns a `P` object with `type` (lava/venus/ice/
  ocean/desert/gas/rocky/terran…), `sizeMul`, `hue`, `ring`, `moons`, plus type-specific
  fields. `planetDescriptor` builds deterministic survey data (atmosphere, climate,
  water, gravity, magnetism, seasons, weather, and an internal designation). V2's
  presentation adapter hides the legacy Spectral row and withholds planet rarity until
  successful landing, then displays only the plain ten-tier name.
- **Moons:** count **scales with planet size** — `base = round((sizeMul-0.85)*3.1)`, `+4`
  for gas giants, `+1` for ice/ocean/terran, then a size-scaled random bump, **capped at
  16**. Gas giants get ~8–13 (Jupiter-like). Sol giants are hand-set (Jupiter 8, Saturn 7,
  Uranus 4, Neptune 4). Moons are named with **Roman numerals** via `roman(n)` (e.g.
  "Jupiter VIII"); labels capped to first 10 to reduce clutter.
- **Sol system:** hand-authored via `SOL_MOONS` and explicit planet objects (Earth=133).
  The game opens here (Phase A).

---

## 5. Life: fauna / flora generation

### Kingdoms
Four kingdoms: **Microbe, Flora, Fauna, Fungi**. A world's biosphere is rolled by
`planetSpecies` / `biosphere` / `realmBiome` / `classifyRealm` based on planet type.

### Genome
`makeGenome` builds a genome; `crossGenome(a,b)` breeds two (preserving kingdom via
`pick(a.kingdom,b.kingdom)`); `evolveGenome` mutates. Genome fields include:
`seed, kingdom, color, form, body, loco, trait, size, diet, head, limbs, skin, tail,
pattern, eyes, behavior, habitat, detail, accent, lumin, gen, heat, parents, mutation`.

Trait arrays drive description & art: `FA_HABITAT`, `FA_LOCO`, `FA_BODY`, `FA_SKIN`, etc.
`describeSpecies`, `faunaDesc`, `speciesName`, `sapienceTier` (intelligence),
`ecologyRole`, `realmModifiers`.

### Art
`speciesPortrait(g)` renders per-kingdom painterly **Canvas** art (microbe = cell cluster,
flora = stalk+fronds+bloom, fungi = mushrooms, fauna = assembled anatomy). In current
`port/v2`, `speciesart.ts` and `speciescompat.ts` expose that synchronous Window-only URL path for
audit compatibility; the production entry graph rejects it as a renderer-reachable dependency.
`leaseThumb(g)` is the Compendium and Planetside path: `SpeciesArtBroker` snapshots the complete
genome, deduplicates/cancels keyed asynchronous jobs, and owns a true-132px LRU capped at **96 / 256**
with decoded-pixel, byte, queue, active-job, lease, and worker-lifecycle limits. The app's default
broker scheduler crosses one animation frame and one later task before every pump; bfcache
suspension invalidates an already-armed pump generation and resume schedules a fresh one. At most
one serial lazy module worker at a time imports the portable painter, creates a 440px scratch canvas,
downsamples to 132px, and encodes the result off the renderer. It terminates after active work
settles and its queue is empty; a later genuinely new producer burst owns a fresh instance/import.
Detail uses an asynchronous broker-owned 440px result rather than the compatibility URL. A persisted bfcache
`pagehide` retains the same document's leases while suspending worker execution; final
non-persisted teardown releases jobs, leases, caches, and the worker. Reveal cards show a
**biome-colored glow** behind the portrait (ability-theme color for fauna, nourished-stat color
for flora).

### Rarity grades
The player-facing `RARITY_V17` ladder has ten grades: **Common, Uncommon, Notable,
Rare, Exotic, Legendary, Mythic, Celestial, Primordial, Transcendent**. The internal
`GRADE_TIERS` / `TIER_MAX = 14` shape remains for deterministic raw rolls, sorting,
old saves, art prefixes, and forced Apex/Paragon indices, but raw tiers 10–14 all
display as **Transcendent** with the same `#F7F1FF` presentation. The retired
Empyrean/Eternal/Omnipotent names survive only as internal art-label prefixes; they
are not separate visible rarity grades or collectible slots.
Specimen cards (`showReveal`) wear a `.gbadge` grade badge; the character sheet shows
"Highest grade ever reached" (a statistic, not an achievement — the summit is deliberately
chased, not checklisted) and "Apex Guardians felled".
`rarityRoll` / `speciesGrade` / `colorGrade` retain the raw deterministic score; higher
scores still drive sorting, stings, FX, and Stardust bonuses (§9). `displayRarity(raw)`
is the single player-facing clamp. Spectral art designations may still combine an
internal prefix with a domain hue (for example "Radiant Fire"), but badges, filters,
items, and collection progress use the ten-grade display ladder. `tiersOwned()` clamps
raw 9–14 to display tier 9, and the historical `tiers12` ID now truthfully awards all
ten displayed grades rather than asking for retired slots.

### Apex Guardians (v1.3)
`guardianFor(pseed)` (Genome module): ~1 in 40 worlds passes the gate
(`mulberry32(hashInt(pseed, 0x6A2D, 0x11)) < 0.025`); rulers split Empyrean 70% /
Eternal 25% / Omnipotent 5%. The guardian is a titanic luminous fauna genome with
`apex:<tier>` (forced grade — `speciesGrade` short-circuits on `g.apex`) and
`ep` (epithet index into `GUARDIAN_EPITHETS`; `faunaDesc` appends it to the name,
e.g. "Nyxora the Stormcrowned"). `apexNative` returns the guardian (flag
`guardian:true`) as the conquest defender of any unconquered fauna-bearing guarded
world; victory stores the guardian in the codex (`stats.guardians++`, achievements
`guard1`/`guard5`, +40 stardust spoils, 👑 cinematic). Guardian-hood never inherits:
`crossGenome` builds an explicit field set (no `apex`/`ep`), and `evolveGenome` only
ever runs on world-roster or crossbred genomes. `normGenome` clamps imported `apex`
to genuine summit values (12–`TIER_MAX`) so hand-edited CFB codes can't mint fakes
beyond what determinism already allows. Probe `guardians` pins the first rulers.

---

## 6. Player stats, combat & abilities

### Player battle stats (`pstats`)
Five stats, all start at **50**: **Vitality (vit), Ferocity (fer), Resilience (res),
Agility (agi), Insight (ins)** — see `STAT_META` for names/colors/descriptions. Stats grow
by **eating flora** (`healExplorer`): each plant nourishes one stat (`floraStat(g)` picks
which) by `1 + tier`. Loaded values clamped 1–330.

- `HP_MAX = hpMaxFromVit()` = `max(20, round(vit*2))` (=100 at start). `recomputeHPMax`
  heals by headroom gained when vit rises.
- `STAT_KEYS = ['vit','fer','res','agi','ins']`.

### Duel combat (`runDuel(mine, theirs)`)
Deterministic per matchup. HP pool = `vit*3`. Per round: initiative by **agi**; damage
≈ `fer*(1+ramp)*(0.8+rand*0.5) − res*0.45`; crit chance = `ins/420 + ability.critB`.
Ability hooks read on the combatant: `dmg, taken, dbl, critB, regen, ramp, dodge, first,
gutsy, drink, burn` (burn = damage-over-time). `battleStats(g)` derives a creature's stats
from its genome and honors `g.brood`, `g.fed`, `g._mult`.

### Abilities (`ABILITY_THEMES`)
**11 biome themes** — fire, frost, storm, tide, stone, venom, void, sand, chem, psionic,
wild — each with a label/color and a list of abilities (~15+ total, e.g. Cinderburn=burn,
Frostbite, Rime Mend=regen, Static Field=critB…). `HAB_THEME` maps habitat→theme;
`abilityTheme(g)` applies loco overrides (gliders→storm, swimmers→tide,
floaters/drifters→psionic, burrowers→stone); `abilityOf(g)` returns the resolved ability
+ theme color/label.

### Where combat happens
- **Duels:** `fightNow`, `startDuelWithCode`, `duelSideCard`, `encodeCreature`/
  `decodeCreature` (CFB- codes to fight a friend's creature).
- **Conquest:** `conquerPlanet` → `runConquestBattle` vs the world's `apexNative`. Win →
  the world is added to `conquered` (Map keyed by planet seed → `{t, tier}`).

---

## 7. Progression systems

### Compendium (species catalogue — formerly "Codex")
The `codex` Map stores discovered species. `discoverSpecies`, `autoScanWorld`,
`_storeSpecies`, `renderCodex`, `removeFromCodex`. **Renamed to "Compendium"** in UI
(button, headers, prose). NOTE: "Prime Codex" (win track) and "Cosmic Codex" (app title)
are intentionally **kept** as "Codex."

The current v2 read-only Compendium projects as many as 1,500 deterministic species through
`CompendiumVirtualList`, mounting only its measured window, bounded overscan, and any
focus-pinned row. Rows acquire 132px art leases; detail alone retains a 440px portrait. Logical
anchor-plus-offset, selected-row focus, and exact release/recovery ownership survive filter,
detail/Back, resize, and close.

### Star Atlas (bookmarks)
The `logMap` Map. `addToLog`, `renderLog`. Every survey card (galaxy/star/planet/moon/etc.)
has a uniform **bookmark row**: **+ Add to Star Atlas**, **☆ favorite**, **⌂ home** — the
icons auto-add to the Atlas on tap. Entries can be favorited/home-set from the Atlas list
too. (Favoriting unlocks the **Curator** achievement.)

### Breeding & feeding
- `breedPair` — cross two same-kingdom specimens; **consumes both parents** on success
  and failure. Odds via `breedOdds` (boosted by stardust). Works on **all kingdoms**.
- `feedPair` — feed flora to a fauna specimen; `faunaTastes(g)` gives liked/disliked
  stats; preference affects outcome (loved/neutral/disliked events, poison risk).
  Feed is **fauna-only**.

### Stardust economy (`essence`)
The soft currency that boosts breeding odds (`stardustBonus`, `breedOdds`). Faucets:
- **Harvesting** conquered worlds (`doHarvest`, readiness via `HARVEST_EPOCHS` against
  `COSMIC_EPOCH`; `HARVEST_CD` is only the retired legacy display-stamp floor).
- **Spoils of Conquest** — winning a world grants `8 + tier*5` stardust.
- **Rare Find Bonus** — discovering Legendary+ (tier ≥ 5) species grants `tier−3`.
Loaded value clamped 0–1e9.

### Ranks (`RANKS`, `rankInfo`)
By expedition score: **Cadet(0) → Scout(30) → Pathfinder(90) → Voyager(220) →
Pioneer(460) → Star Cartographer(900) → Mythic Wayfarer(1700) → Void Sovereign(3000) →
Cosmic Luminary(5200) → Eternal Frontier(8200)**. Rank-up plays a sting + gold FX burst.

### Frontier expansion (`REGIONS`)
The reachable universe expands as you claim Signatures. Tiers: **the Solar Reach → the
Local Cluster → the Near Field → the Deep Field → the Outer Dark → the Frontier**.
`currentRegion`, `reachRadius`, `withinReach`, `charterBlock` (gates travel beyond reach).

### The Prime Codex (win track) — `SIGS`
**9 Signatures**, each with a `verb` shown on locked slots:
| id | Signature | How | Verb |
|---|---|---|---|
| stone | Stone | conquer a rare rocky/metal/mineral world | Conquer |
| ocean | Ocean | conquer a living ocean world | Conquer |
| flame | Flame | conquer an extreme volcanic world | Conquer |
| sky | Sky | conquer an aerial/gas-giant ecosystem | Conquer |
| life | Life | conquer a complex land biosphere | Conquer |
| mind | Mind | conquer a world with a sapient native | Conquer |
| prism | Prism | conquer a unique prismatic lifeform's world | Conquer |
| star | Star | **find** an extreme star / stellar remnant | Find |
| void | Void | **find** a black hole / void / galactic anomaly | Find |

Logic: `worldSignature`, `speciesSignatures`, `primeCheckWorld`, `primeCheckSpecies`
(species signatures require the world to be **conquered**), `claimSignature`, `primeCount`,
`renderPrime`, `checkFrontier`, `chooseEnding`/`renderEnding`/`openFrontier`.

**v1.5 — THE PATHFINDERS' TRAIL:** the Codex is presented as the endgame arc
(begins where the Ascent ends). Each `SIGS` entry carries `lore` (its lost
beacon's story beat) and `reach` (how far its trail leads); claiming a
Signature unlocks its **relic blueprint** — nine `cat:'relic'` items in
`ITEMS` (one per equipment socket, `sig` field names the gating Signature;
`_canCraft` refuses while `primeFill[sig]` is empty). Claim mechanics,
region gating and endings are unchanged. The "Prime Codex" NAME is law.

### Achievements
`unlock(id)`, `checkAch`, `ACH` list (categories: Cataloguing, Breeding, Rarity, Worlds,
Stellar, Exploration…). Shown in the stats panel as collapsible category groups.

---

## 8. UI layout & panels

### Topbar (unified across desktop & mobile)
Brand hidden; breadcrumb hidden. Layout (flexbox, `--topbar-h` and `--row1-h` measured
live by `syncTopbarH` + ResizeObserver):
- **Row 1:** nameplate (rank pill, opens the character screen) … search box (grows to fill) + 🔔 bell.
- **Row 2:** HP bar (heart + bar + "X/Y HP").
- **Right rail** (anchored to bottom of row 1, `--row1-h`): **Charters** (the v1.5
  prime slot — gold pill) → **Compendium** → **Star Atlas** → **Cargo** (shortcut
  into the character screen's inventory).
- **Left rail** (anchored below full topbar): **Prime Codex** (endgame — moved here
  in the v1.5 swap). Traveler's Beacon + Cosmic Events are HIDDEN for rework
  (`EVENTS_DORMANT`; buttons `display:none`, engines refuse clicks).

### Key panels / modals (and their elements)
| Element id | What |
|---|---|
| `#panel` | Survey card (scrollable; bookmark row; conquer/share buttons; "locked" pin hint at top-left). |
| `#sheet` / `#sheetcard` | **v1.5 THE CHARACTER SCREEN** — centered overlay (z 24) holding three regions: `#sheetstats` (contains `#stats`), `#doll` (full-body `paperdollAvatar()` + 9 sockets absolutely positioned via `DOLL_ANCHORS` + picker + effect readout), `#sheetcargo` (contains `#cargo`). `openSheet(view)`/`closeSheet()`; `statsOpen`/`cargoOpen` mirror `sheetOpen` for legacy callers. One PANELS entry (`id:'sheet'`, btns `#rank,#cargobtn`); ✕ seated on open. Mobile stacks doll → stats → cargo. The separate legacy ship portrait renders in Shipyard `#yardship`, not on the paper doll. |
| `#stats` | Expedition stats REGION inside the sheet (rank/score, **clickable** battle-stat rows, collapsible **Statistics** + **Achievements**, nameplate picker, rarity ladder). No longer position:fixed. |
| `#codex` / `#codexbtn` | **Compendium** (species). |
| `#log` / `#logbtn` | **Star Atlas** (bookmarks). |
| `#primebox` / `#pcdxbtn` | **Prime Codex** modal (× and backdrop close). |
| `#events` / `#eventsbtn` | **Cosmic Events**. |
| `#daily*` / `#dailybtn` | **Traveler's Beacon** (random destination every 5 min). |
| `#tray` / `#bell` | **Notifications** tray (z-index 40, above rail; 66vh tall). |
| `#searchin` / `#searchres` | Search ("Search discoveries or paste code"); results z-index 40. |
| `#setpanel` / `#setbtn` | **Settings** (see below). |
| `#guidebox` / `#helpbtn` | **Guide to the Universe** — searchable, browsable manual of every system (see "Guide, tooltips & Field Training" below) + credit footer "Celestial Frontier · v<GAME_VERSION> (build <sha>) · Developed by Dakk". |
| `#tipbubble` (JS-created) | Tooltip bubble for `[data-tip]` elements. |
| `#tutbox` / `#tutspot` (JS-created) | Field Training instruction card + spotlight ring. |
| `#namebox` | **Intro / name prompt** ("Celestial Frontier" title, ringed-planet icon, **BEGIN THE EXPEDITION**). Doubles as the **rename dialog** (explorer via Settings → Display → Explorer name or the character sheet's ✎ link; species via card Rename) — rename modes show a **Cancel** button and dismiss on Escape; only the initial naming is mandatory. |
| `#duelbox`, `#pickbox`, `#sharebox`, `#reveal`, `#endingbox` | Duel loader, breed/feed picker, share-code, reveal card queue, ending screen. |

### Settings toggles (persisted; Display / Graphics / Audio tabs)
Display: **Text size** (`fsMode`), **Text tone** (`toneMode`), **Font** (`fontMode`),
**Explorer name** (`#renameopt` → `askExplorerName(false)` — rename anytime, purely
cosmetic: the name feeds no seed, hash or code payload), **Tooltips** (`tipsOn`).
Graphics: **Visual effects** (`fxOn` — particle bursts/cinematics/travel tunnel),
**Screen shake** (`shakeOn`), **Motion** (`motionMode`: −1 Auto / 0 Full /
1 Reduced, resolved by `motionOK()`. **Auto follows the OS
`prefers-reduced-motion` preference LIVE** (`_sysReduced` + a matchMedia
change listener), and because Auto is itself a persisted value, saving never
freezes the OS preference into the save. Reduced skips the travel tunnel,
screen shake and confetti in JS and stamps `body.rmotion`, which stills the
decorative CSS loops: update-pill pulse, cinema rays, events dot, iridescent
shimmer). Audio: **Sound** (`sndOn`),
**Volume** (`#volslider` → `sfxVol` 0..1 — every synth exits through one shared
gain bus `sfxOut(a)`, gain = `sfxVol²`; the survey ping answers on release at
the chosen level), **Notifications** (`notifOn` — silences toast *popups* but
still logs to the bell tray). Plus **Reset Game → Erase Everything**.
All the pill toggles and panel items carry `role="button" tabindex="0"`, so the
global Enter/Space shim (`@section input`) drives them from the keyboard;
`[role="button"]:focus-visible` paints a gold focus ring.

### FX system (`fxBurst`, `fxShake`)
DOM-particle confetti bursts (gold/green/purple/red palettes, capped & self-cleaning) and a
CSS screen-shake. Gated by `fxOn`/`shakeOn` and by `motionOK()` (Motion: Reduced stills both).
Hooked into conquest wins, signature claims, rank-ups, breeding, feeding, eating flora,
harvests, rare discoveries (tinted), damage, and death.

### Escape / dismiss
Global **Escape** first cancels an open rename dialog (`#namebox`, only when
`!_nameInitial` — the first naming stays mandatory), then closes the topmost
dismissible overlay (reveal → pickbox → duelbox → sharebox → primebox → guidebox →
setpanel). All modals also close on backdrop click. Outside-tap closes
Compendium / Star Atlas / Cosmic Events / Settings.

### Guide, tooltips & Field Training (v1.1)
- **Guide to the Universe** (`?` button, `@section guide`): a data-driven manual —
  `GUIDE` holds 43 authored topic records `{id, t, k, body}` across 9 categories;
  41 are live and `beacon` / `events` are retained but dormant. It provides live search
  (title/keyword/body), category drill-down, topic cross-links via
  `<span data-gt="id">`, and a deep-link API `openGuideTopic(id)`.
- **Tooltips** (`@section tooltips`): any `[data-tip]` element shows a one-line
  text-only bubble (`pointer-events:none`) — hover (650 ms) / focus on desktop,
  **long-press (600 ms) on touch**; the long-press suppresses the following tap
  action. Gated by `tipsOn` (Settings toggle, saved as `tips`) and **suppressed
  during Field Training** (the guidance card keeps a single voice). `data-guide`
  attributes remain in the DOM but are currently unused (the in-bubble Guide
  link was removed — not tappable on touch).
- **Release notes** (`@section release-notes`): `GAME_VERSION` + `RELEASES`
  (newest first; categorized sections). Returning saves whose `rn` field ≠
  `GAME_VERSION` get a one-time "latest" popup (`#relbox`, styled like the
  intro card) ~900 ms after boot; dismissing marks it seen. Fresh expeditions
  read the same bulletin between naming and Field Training. The "latest" view
  is **pinned to the entry matching `GAME_VERSION`** (not `RELEASES[0]`), so
  unshipped v-next bullets piling up on top never reach players early. The
  Guide footer credit (`#gcredit`) is the permanent link to the **cumulative**
  history. **House rule: `GAME_VERSION` bumps only when Dakk says so** — but
  every player-visible change is appended to the v-next entry as it is built.
- **Current v2 counterpart** (`port/v2/apps/game/src/guide-content.ts`,
  `release-content.ts`, wired by `main.ts`): `LEGACY_GUIDE_CATEGORIES` and
  `LEGACY_RELEASES` are exact source-addressed snapshots, guarded by
  `tests/guide-release.test.ts`. `getGuideCatalogue` defaults to 41 player topics
  (dormant hidden, unavailable retained with honest copy); `getGuideTopic` and
  `searchGuide` keep stable ids, search and live cross-links. `fillGuide` /
  `renderGuideMenu` / `renderGuideCategory` / `renderGuideTopic` /
  `renderGuideSearch` own the panel. `getReleaseHistory({includeDraft:true})`
  supplies **A New Foundation**, the cumulative v2.0 development entry, followed
  by the 56 legacy releases. Its exact five-section /44-bullet implemented-outcome
  inventory is checked structurally and in the rendered Guide, including real-scroll
  tail reach and unchanged shipped-release state. That version is development identity
  only. `getCurrentV2Release()` returns nothing while
  `V2_CURRENT_RELEASE_VERSION === null`; `showUnseenV2Release()` therefore
  cannot mutate `rnSeen` or open an update until an authorized shipped v2 entry
  exists. The existing Settings and Saving topics and existing Field Training
  bullet describe the exact current-view success path, partial ownership of genuine
  legacy checkpoints (including their lack of a saved route: Welcome Skip stays
  in Sol and post-Land completion stays at Earth), and the persistent unknown-checkpoint recovery lock without
  adding a topic, capability, category, bullet, release, or version. This ports the data model, browsing and cumulative-history door; v2
  tooltip deep-link triggers and Advanced Briefings are still open.
- **Update watch** (same section): `tools/deploy.js` stamps `BUILD_ID` with the
  git sha and publishes `version.json` beside the game. Live sessions poll it
  every 10 min and on `visibilitychange` (iOS Safari resurrects stale tabs);
  a newer build shows a gold **⬆ refresh pill** (`#updatepill`) + toast —
  deferred while Field Training is active. Refresh is safe (`beforeunload`
  saves). Inert for `dev` builds, `file://`, or offline — the game stays
  fully offline-capable. The Guide footer shows `v<GAME_VERSION> (build <sha>)`.

### v1.2 systems (June 2026)
- **Cinematics** (`@section cinematics`): `cinematic({kicker,title,sub,hex,tier})`
  — full-screen tier-scaled celebration overlay (`#cinema`: rotating rays,
  gradient title), queued so shows never stack, tap-to-dismiss, gated by `fxOn`,
  `fxShake` + double burst at tier ≥ 6. Fired from: tier ≥ 5 discoveries
  (`autoScanWorld` + `discoverSpecies`), bred newborns (picker), conquest wins
  (`runConquestBattle`), and first-time event witnessing (events click).
- **Creature injuries**: `genome.hurt` (0–0.85) persists via the codex save
  (rides inside the serialized genome — no schema change). Sources: winning a
  conquest below 55% HP (`hurt += (0.55-frac)*0.7`), a disliked meal whose
  event has `fed<0` (`hurt += 0.12+tier*0.05`). Healing: feeding — loved mends
  `0.22+tier*0.05`, neutral `0.1`; wounds never heal on their own. Effects:
  `battleStats` scales all five stats by `1-min(0.85,hurt)*0.55` — **guarded
  behind `if(g.hurt)` so unhurt genomes stay byte-identical to the v1.0
  fingerprint**. `creatureCondition(g)` → Healthy/Bruised/Injured/Critical,
  shown on specimen cards, Compendium rows and the conquest picker.
  `normGenome` deletes `hurt` (injuries don't travel in CFB codes); hybrids
  are born unhurt (crossGenome never copies it). Friendly duels stay harmless.
- **Field Training** (`@section tutorial`): a 21-step, event-gated tutorial for
  brand-new expeditions only (`tut` save field; absent = veteran, never shown;
  reset → training again; reload mid-training restarts it). Game systems report
  through one funnel — `gameEvent(type, detail)` (no-op unless training is
  active) — emitted from: survey render, `addToLog`, Atlas/Compendium/tray/
  character-sheet toggles, `showReveal`, feed/breed/heal picker outcomes,
  `fightNow` resolution, and `runSearch`. Each step's `when(type, detail)`
  matcher gates advancement, so the player really performs each action:
  find & survey Earth → chart it (this is how Earth enters the Atlas now —
  `startNewGame` pre-charts it only for veterans) → open Atlas → receive a
  **training cache** (3 random fauna + 3 random flora, `from:'Training Cache'`)
  → open Compendium → specimen card → feed → breed → training duel → scripted
  hazard nip → heal → tray → search → character sheet → horizons → finale.
  **The whole thing is a sandbox**: key rolls are rigged for smoothness
  (`_tutRig`: guaranteed breed/heal success, safe feed), and the finale
  restores the exact eleven-field snapshot
  `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` (selected statistics, player
  statistics, achievements, Stardust, Compendium, cargo, exceptional cargo,
  items, equipment, equipment affixes, and Earth Atlas/home history). It then
  sanitizes that owned state, including the legacy behavior that removes every
  species catalogued only during training, refills HP in the mature game, and
  guarantees Earth charted + home (`_tutEnsureEarth`). The v2 compatibility
  restore is deliberately narrower about HP: it never heals current lower HP.
  Skippable with confirm; `tutAbort()` on
  game reset. **Training is toast-quiet** (v1.1 post-launch): while
  `body.training` is set, `toast()` logs to the bell tray only (the tray step's
  payoff), the rank-up fanfare is suppressed (its sandbox promotion is revoked
  at cleanup anyway), tooltips hold, and the focus-lockdown gate replays its
  card **nudge** for blocked wheel events (throttled 500 ms) — blocked scrolls
  used to fail silently.

---

## 9. Audio

> **See `AUDIO.md` for the full system** (creature voices, combat, ambience, the
> feedback grammar, the toggles, and the traps). This section is the code map only.

The current v2 package is deliberately narrower than production v1: its exact public surface is
`initAudio`, the lifted rarity/survey/navigation stings, and the shared-gain updater. The three
sting calls and gain updater are inert before `initAudio()` installs live Sound/Volume getters;
initialization itself allocates nothing.
Thereafter Sound-off remains mute-before-create, while an enabled call lazily selects standard
`AudioContext` before the `webkitAudioContext` compatibility fallback and reuses the context.
Focused package controls cover the pre-init/public surface in both directions and the constructor,
mute and suspended-resume boundaries. During the awaited save-load, the application assigns the
save and calls `initAudio()` synchronously before later playable scene/input publication; no
ordinary current pre-init action route was reproduced. The repaired exception is therefore a
package contract finding rather than a proved player route. Full engine lifecycle, voices,
ambience, combat/Guardian cues, music, assets/rights, mixing, node/buffer ownership, budgets,
device listening and quality acceptance
remain open under Arc 7/8 and Gate G; no player-facing capability or version follows from this guard.

**v1.8 "The Connection" added the largest part of this layer** and it is not
described below: `voiceOf`/`playVoice` (deterministic per-genome creature voices
over 18 rig archetypes, blending across a bloodline's Earth anchor),
`playHit` (per-blow combat sound scaled to damage, with crits and ability procs),
`playArrival` + `ambienceStart`/`ambienceStop` (planetfall and bounded biome beds),
and `playBlip`/`playDeny`/`playConfirm` with the `_denyPress`/`_okPress`
press-level wrappers. Two independent toggles — `voiceOn` (`vce`) and
`combatSfxOn` (`cbx`) — ride the master `sndOn`; absent ⇒ on.

⚠ `_denyPress`/`_okPress` live at **true top level, after the `Fx` destructure** —
not inside the Fx IIFE. Putting them beside `playDeny` threw `ReferenceError` at
every app-layer caller. A helper belongs in the scope of its **callers**.

The v1.0/v1.1 originals, still present:
Web Audio oscillators — hand-rolled, asset-free. `ac()` resumes the context
(persistent gesture + visibilitychange re-arm for iOS backgrounding).
`playRaritySting(tier)` (discoveries & celebrations; pitch/steps/harmonics/
drone climb with tier), `playFailTone()`, `playFanfare()`, `playThud()`, plus
the v1.1 core-loop pair: `playSurveyPing()` (one soft sonar blip on every
canvas tap-lock — the *act* of surveying) and `playWhoosh()` (filtered-noise
sweep on `travelTo` and the system→surface landing transition). All gated by
`sndOn`. `Math.random` in the whoosh's noise buffer is fine — audio is
presentation, the determinism ban covers domain modules only.

---

## 10. Save format (`localStorage['cfcc_save_v2']`)

**Current v2 Training compatibility fields (2026-08-16):** the outer envelope
remains `v:4`. While Training is incomplete, optional `tsnap` carries either the
exact current one-key `{view}` snapshot, the exact genuine legacy eleven-field
checkpoint, or bounded unknown evidence held for refusal/recovery. A completed
export omits it. Optional
`ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}` preserves cumulative
checkpoint records that cannot always be reconstructed from surviving identities.
It is an additive compatible v4 extension with independent nested versioning;
numeric future `ever.v` values protect the entire save as `future-version`.
Absence retains historical derivation, malformed v1 members are contained,
floor fields only raise derived facts, and `sysSeen` remains arrival-count
authority. Neither field is a v5 migration, whole-save checkpoint, reward
receipt, game-version bump, or production release.

**Current v2 epoch carrier (2026-08-15):** the IndexedDB slice still exports one
v4 JSON blob whose `epoch` field comes from `SaveStateV2.EPOCH_BASE`. That name is
compatibility layering, not the `EpochClock.base()` method contract. The ordinary
app refreshes it from `epochClock.current()` immediately before export; the next
boot imports and sanitizes it, constructs one new clock with a fresh zero-origin
elapsed segment, and does not rebase again after each save. The focused package
test proves base/current/rebase semantics; real-browser smoke separately proves
the actual current() → `persistView()` → raw IndexedDB → import/reload path across
one exact epoch. Neither proves automatic epoch-edge saves or F3/F4 clock policy.

**v1.5 FRESH START:** the key bumped `cfcc_save_v1` → `cfcc_save_v2` with **no
migration** — the bump IS the wipe. `readLegacySave()` reads the old key once
at boot to build the farewell card (rarest find honored), then removes it.
All grandfather paths listed below (asc-absent ⇒ complete, land/cont absent
⇒ back-filled, `rsw`/`rc` markers, veteran starter-charter auto-completes)
are GONE — absent fields now take their plain post-law defaults. `cx` clamps
0–7 (bit 4 = specimen field-notes fold). The historical notes below describe
the v1 loader for the record.

Written by `doSave` (debounced via `queueSave`, 900 ms). Fields (v1):

```
v, epoch, view, hp, pstats, fs, snd, fx, shake, notif, tips, notifs, me, essence,
conq, breeds, breedwins, feeds, feedfails, harvests, essenceEarned, names,
shares, jumps, anomalies, anomKey, events, duels, duelwins, surveyed, gals,
surf, starK, ptypes, evts, evann, ach, home, prime, frontier, ending, guide,
tut, codex (array of {g:genome, f:from, w:where})
```

v1.1 additions are **optional & backward compatible**: `tips` (tooltips toggle;
absent = on), `tut` (Field Training complete; **absent = treated as done**, so
pre-tutorial saves never see training), `rn` (last release-notes version
seen; **absent = '1.0'**, so updated saves get the bulletin exactly once),
`vol` (SFX volume 0–100; **absent = 100**, clamped on load) and `rm` (Motion
setting; −1 = Auto, 0 = Full, 1 = Reduced; **absent or −1 = Auto**, which
keeps following the OS reduced-motion preference live — only an explicit
player choice of Full/Reduced ever overrides it).

v1.1.2 addition: `cx` (survey-card expand bitmask — bit 1 Environment fold
open, bit 2 Civilization census open; **absent = 0 = collapsed**, clamped
0–3).

v1.2 addition: `land` (array of planet seeds the player has stood on,
newest-capped at 2000; drives the discovery arc's ground-survey tier —
census + mining unlock). **Absent (pre-1.2 save) ⇒ grandfathered**: every
planet in the Atlas (`p…` log ids) plus all `conquered` and `mined` keys
counts as landed, so a veteran's known universe is never re-hidden. Earth
(seed 133) is always treated as grounded without occupying a slot.
`noteLanding(seed)` (ui-panel section) adds a world at the planetfall
transition or when a save restores directly onto a surface.

Further v1.2 additions: `scout` (Compendium id of the Field Scout fauna
that absorbs hostile-bioscan wounds; validated against the loaded codex —
a stale id stands down silently) and `landings` (count of first-footfall
field-sample grants; the samples themselves ride `_pendingSample` →
`grantFieldSamples(d)` on the next survey-card render, using the same
deterministic `depositsFor` recipe as mining).

`loadSave` restores all of the above. **Hardened against tampering/corruption** (v1):
names re-sanitized via `cleanName`, every counter coerced to a finite number, `essence`
clamped 0–1e9, `conquered` timestamps clamped to "now" (prevents frozen harvest
cooldowns), HP/pstats clamped, notifications capped at 60. `resetMemoryState` clears all
live state; `wipeSaveAndReload` does a robust **in-place reset** (works even where iframe
navigation is blocked) — clears save, rebuilds the opening Sol/Earth expedition, re-prompts
for a name.

---

## 11. Security & robustness (audited at v1.0)

- **No untrusted HTML injection:** all user/code-supplied names pass through
  `cleanName` (strips `< > & " '`, 24-char cap). Share codes (`CF1-`, `decodeWhere`) and
  duel codes (`CFB-`, `decodeCreature`) sanitize embedded names on decode.
- **Save hardening:** see §10 (coercion + clamps + sanitize).
- **No economy exploits found:** flora consumed on eat; both breed parents consumed;
  feed multiplier normalized & capped; rare-find stardust only on genuinely new species;
  conquered worlds can't be re-won; duel codes touch only cosmetic counters.
- **Performance:** full portrait cache device-capped (96 phone /256 otherwise), thumbnail cache
  capped (600); DPR capped (3); notifications capped (60);
  survey panel rebuilds only on content change; frame loop has error recovery; FX
  particles & event timers are cleaned up.

---

## 12. Test suites (all must pass)

The original v1.0 assertion suites (`phaseAtest` … `finaltest`, `esc_check`) were lost
with the previous working environment. They are superseded by `tools/validate.js`
(see §2 and `tools/README.md`): syntax check, CSS brace balance, duplicate-id check,
version consistency, class→rig binding, colour atlas, biome profiles, render audit,
domain-determinism grep, headless jsdom boot with zero errors, and a **50-probe**
fingerprint over the deterministic core (world-gen, descriptors, genomes, duels,
share codes) that must match the v1.0 baseline byte for byte.

**The primary battery is now NINE suites, not one** (four gate every batch and
`deploy.js` enforces them; the last five are run on demand):

The root parity battery also includes `npm run trainingcheckpoint`. It replays
the action-derived v1.8.9 restart capture and exact-compares the sealed fixture
plus its source/driver/snapshot provenance; the paired
`trainingcheckpoint:capture` command prints a candidate and never overwrites the
sealed baseline. The separate v2
`packages/persistence/test/training-checkpoint.test.ts` suite owns the exact
eleven-key classifier, `tut:0` and rescued-`tut:1` round trips,
missing/extra/oversized refusal, and synthetic-unknown negative control. This is
deterministic jsdom/action provenance plus focused static semantics, not a
browser outcome or real veteran-save Gate-C evidence.

| Suite | What it can see | Gate? |
|---|---|---|
| `validate.js` | build + 9 static gates + the 50-probe fingerprint | every batch |
| `smoke.js` | jsdom: real flows, the full 21-step training, ~553 checks | every batch |
| `uilayout.js` | **a real headless browser through the shared owned CDP launcher**: computed boxes, 44px touch floors, and `elementFromPoint` hit-tests across 10 viewports (787 checks, incl. a 63-point reachability grid on the training card against each raisable surface in **both** card positions); ignored atomic schema-v2 evidence binds exact browser/run/status, full PASS binds the sealed v1.8.9 report's exact 787-key inventory, targeted runs remain scoped, and `--selftest` / `--verify-run=ID` enforce completeness/freshness | every batch |
| `balance-sim.js` | 17 archetype win-rate band + 55 ability-theme art band | every batch |
| `bootperf.js` | **cold boot in a real browser over gzipped HTTP**: decomposes first-interactive into network / in-DOM / painted / **answerable**, plus a longtask census split at the gate. `--assert` enforces the art-hold law | on demand |
| `simrun.js dom` | **UI reachability**: takes actions through the real controls and proves the press *landed*; reports `absent` / `disabled` / `dead` / `uncovered` | on demand |
| `duelxp-check.js` | **reward outcomes**: drives the real friendly-duel arena and reads the ledger afterwards — proves the XP *arrived*, not that `awardXP` works | on demand |
| `sizedrift-check.js` | **save round-trip outcome**: proves an honestly bred genome survives save/load unchanged and rejects the removed clamp that rewrote ordinary high `size` genes | on demand |
| `harvestclock-check.js` | **clock exploit outcome**: advances the device wall clock and proves a settled world grants no offline harvest | on demand |

`uilayout.js` exists because jsdom has no layout: a rule can be present, correct
and **completely inert**, and only a real browser can tell you. It accepts
`--url=FILE`, so a new gate can be replayed against an older build to prove it
catches the bug it was written for. It records `running` before launch and atomically
replaces that with terminal `pass`, `fail`, or `instrument-fail`; CI verifies the
exact assigned run id before uploading the ignored report in its own always-run step.

`bootperf.js` and `simrun.js dom` close two UI blind spots that were *structural*, not
oversights. **Painted ≠ answerable**: a gate can be drawn and hit-testable while the
main thread is too busy to respond, and `waitForSelector(visible)` cannot tell the
difference — that ambiguity misdiagnosed the cold-boot outlier for three builds.
**API ≠ reachable**: the high-volume expedition tiers call ~28 probe hooks directly,
so a bot calling `craftItem()` could never notice a dead Craft button (CF1802-07).
Neither jsdom nor the fingerprint can see either problem by construction. The
other three on-demand suites guard real reward, save-round-trip and clock outcomes
whose helper-level checks had previously allowed player-visible regressions through.

⚠ Both were **negative-controlled in both directions** before being believed, and both
found bugs in *themselves* first. Do not trust a green run from either until you have
re-broken a build on purpose — `tools/README.md` records the two traps that made
`bootperf` pass vacuously (an observation window that closed at TTI, and a `setTimeout`
block that cannot preempt the parser).

When an edit intentionally changes behavior a probe captures, regenerate the baseline
**deliberately and say so** (don't weaken the intent of a check).

⚠ **A stale claim removed here twice — do not let it return.** This section used to end
"a browser smoke test (Playwright) exercising every panel … remains the highest-value
addition if sustained work resumes". `uilayout.js` has driven a real browser for weeks,
and `bootperf.js` now drives one too. The v1.8.4 sweep believed it had deleted that
sentence and had not; it survived to 2026-07-30. The highest-value *remaining* addition
is **widening `simrun dom` coverage past `craft`** — `capture` first (CF1802-09's own
surface), since panel/picker actions are the ones no harness here drives yet.

---

## 13. Development history (feedback rounds, condensed)

- **Foundations:** Prime Codex win condition; reset/save robustness; mobile pinch/tap.
- **Phase A/B/C:** Sol/Earth opening; stepped REGIONS frontier expansion; difficulty curve;
  fog-of-war.
- **Rounds 1–9:** achievements tray; conquest-gated signatures; reset confirm; mobile
  header overlap fixes (`--topbar-h`); Primer rewrite; survey-panel scroll; hazard flavor;
  explicit flora-grown player stats; biome-themed D&D-style abilities; feeding preferences;
  breed-all-kingdoms; mobile topbar cleanup; outside-tap close; Title-Case actions.
- **Round 10:** clickable stat descriptions; collapsible "Statistics"; reworded/added stats.
- **Round 11:** mobile topbar reflow (`display:contents`); Codex → **Compendium** rename;
  Prime Codex moved to the right rail.
- **Round 12:** in-place reset fix; layout parity; HP/search tuning.
- **Round 13:** unified layout on all platforms; **FX system** (bursts + shake); stardust
  faucets (spoils + rare bonus); portrait biome glow; Title-Case toasts.
- **Round 14:** intro title "Celestial Frontier"; signature verbs (Conquer/Find); Effects
  toggle; help credit; Primer em-dashes.
- **Round 15:** uniform **☆/⌂ bookmark icons** on all survey cards; Curator achievement.
- **Round 16:** search/tray z-index; "Search discoveries or paste code"; split Effects &
  Screen-shake toggles; **size-scaled moons** + Roman numerals; locked-pin hint to top-left.
- **Round 17:** search box grows to fit text.
- **Round 18:** tray above rail + taller; stats panel over the HP bar; **Notifications**
  toggle (silences popups, keeps tray); intro modal redesign (icon, background, gradient
  title, de-italicized lore).
- **v1.0 hardening (round 19):** save-restore sanitization/coercion/clamps; Prime Codex
  backdrop close; global **Escape** closes overlays; full security/perf audit.
- **Final:** intro button → **BEGIN THE EXPEDITION** ("Survey" kept as the game's verb).
- **SOLID restructure (June 2026):** script reorganized into domain/app modules with
  a verification toolkit (`tools/`) — behavior identical, fingerprint pinned (49 probes at the
  time; the baseline has since grown to **50** — see §12).
- **v1.1 (June 2026):** **Guide to the Universe** (the full searchable manual replaces
  the Primer); **tooltip system** (`data-tip`/`data-guide`, Settings toggle, long-press
  on touch); **Field Training** — a 21-step, event-gated, fully sandboxed new-player
  tutorial (Earth charting, training cache, feed/breed/duel/heal practice, scripted
  hazard, cleanup that restores the record). New optional save fields `tips`, `tut`.
  jsdom smoke suite drives the entire tutorial end-to-end.
- **v1.1 continued:** **Release Notes system** (one-time update bulletin via save
  field `rn`; cumulative history behind the Guide footer version line; content in
  `RELEASES`, version bumps only on Dakk's call); tutorial card moved top-center
  with **focus lockdown** (per-step `allow` lists; capture-phase gate on
  pointerdown/click/touchstart/wheel; open dialogs always usable); tooltips made
  text-only with longer delays (650 ms hover / 600 ms long-press). Smoke suite:
  72 checks.
- **v1.1 post-launch, Emerson playtest round (July 2026):** desktop hint copy
  corrected (hover *previews*, click surveys); planet pick floor 14→16 px and
  **moon picks gated to `c.z > minWH/420`** (the moon-label zoom) so sub-pixel
  moons stop stealing nearest-wins taps aimed at their planet; **training
  quiet pass** (toasts tray-only + no rank-up fanfare + tooltips held during
  training; wheel-block nudge feedback); **player rename surfaced** (Settings →
  Display row, Guide mention, larger ✎ link, Cancel/Escape on the rename
  dialog); survey-card `.k`/`.tag` labels moved to a brighter `--label` color
  (8:1 on the glass panel; tone-aware) and the stale `.krow` fs-lg/fs-xl
  selectors fixed so those labels finally scale with A+/A++; new
  `playSurveyPing`/`playWhoosh` core-loop SFX; release-notes "latest" view
  pinned to the `GAME_VERSION` entry; `RELEASES` gains the working v1.1
  "Field Reports" entry. An adversarial review round then hardened the batch:
  the locked-Guide message stays a visible pop-up during training (the one
  exception to the quiet pass), rename-cancel flushes queued toasts (and
  `flushToasts` re-checks the training gate at fire time), moon picks use
  true-apparent-size targets below the label zoom instead of vanishing (a
  visible desktop gas-giant moon stays clickable), travel-skip taps are
  disarmed so they can't survey-lock (and ping) the arrival scene, and
  `#namebox` joined the `body.training` yield rules. Smoke suite: 91 checks
  (training-quiet, pinned bulletin, rename flow, locked-Guide feedback).
- **2026-07-15 — Emerson-playtest Tier 2 (accessibility & feel):** SFX **volume
  bus** (`sfxOut(a)` shared gain, `sfxVol²` taper computed only in
  `applySfxGain`, Settings → Audio slider, save `vol`); **Motion
  Auto/Full/Reduced** (`motionMode`/`motionOK()`, save `rm` −1/0/1; Auto tracks
  the OS preference live via a matchMedia listener; gates
  tunnel/shake/confetti in JS + `body.rmotion` stills the decorative CSS
  loops); **landing assist** in `checkTransitions`, armed only by a blocked
  zoom-in at the system ceiling (450 ms window; instant step under reduced
  motion); **touch pick-floor scaling** (`PICK_F` ×1.4 on TOUCH) + invisible
  hit-padding on Atlas row actions (delete × deliberately excluded) and
  Settings pills (`@media (pointer:coarse)` `::after` insets); **keyboard
  operability** — `role="button" tabindex="0"` on Settings pills/tabs,
  Compendium tabs/groups/cards, Binder paragon slots, Atlas items, Guide
  categories/topics/back/cross-links, riding the existing Enter/Space shim,
  with a `:focus-visible` gold ring and a `refocus()` helper that restores
  focus after innerHTML re-renders. An adversarial review workflow (17
  verified findings) drove the arming design, the delete-× exclusion, the rm
  tri-state (never freeze the OS preference into the save), live probe-hook
  getters (`make-probe-build` now emits `get name(){}`), and one shared
  `tools/fake2d.js` replacing four drifted fake-canvas copies. Smoke suite:
  102 checks.

---

## 14. Glossary of in-game terms

| Term | Meaning |
|---|---|
| **Expedition** | a playthrough (the player's run). |
| **Survey** | examining/cataloguing a world (the core action verb). |
| **Compendium** | the catalogue of discovered species (was "Codex"). |
| **Star Atlas** | the player's saved bookmarks of places. |
| **Prime Codex** | the 9-Signature win track. |
| **Cosmic Codex** | the app's title/subtitle. |
| **Signature** | one of 9 legendary milestones that complete the Prime Codex. |
| **Stardust** (`essence`) | soft currency; boosts breeding odds. |
| **Traveler's Beacon** | a fresh random destination every 5 minutes. |
| **Pathfinder** | the in-lore order of explorers; also a rank; "Pathfinder's Primer" = help. |

---

## 15. v1.4 "The Ascent" addendum (2026-07-18)

Three new app-layer systems (all in `main.js`; nothing touches the domain modules —
fingerprint stayed byte-identical):

- **Mining rework** (`@section mining`): `mineWorld` is instant per click ("pull");
  yields seeded by extraction index (`hashInt(seed,0xE1F,n)`), so pull *n* is identical
  for every explorer. `reserveFor(seed,tier)` fixes each world's FINITE total pulls
  (~420–800 × (1+tier·0.35)); `mineX` (save `mx`, absent ⇒ veterans full) tracks pulls
  taken; rich strikes add `RARE_VEIN` pockets; `minePending` accrues auto-extractor
  loads (1/10 min, cap 30) anchored on `mined` timestamps.
- **Fabricator + equipment** (`@section fabricator`): `ITEMS` recipe catalog
  (T1 parts → T2 components → T3 ship systems + gear; costs audited against Sol's
  actual seeded veins so Chapter 1 is craftable at home), `craftItem`/`equipItem`,
  nine `EQ_SLOTS` on the character sheet, `partIcon()` painterly icons.
  `_equipBonus(key)` is the single gear socket read by: `descentFor`/`descentBonus(P)`
  (land, per-family `landfam`, `land100`), `_descRoll` (struts scrape cut), `routeHit`
  (`scut` wound cut), `attemptContact` (contact %), `healExplorer` (heal %),
  `driveMult` (speed), `mineWorld` (yield, strike, auto). Save fields `items`, `eq`.
- **Ascent chapter engine** (`@section ascent`): `ASC_CHAPTERS` (3 chapters on the
  charter/gameEvent machinery, pinned atop the Charters panel), save `asc`/`ascp`
  (**`asc` absent ⇒ complete — veterans never re-lock**). `ascStage()` 0–3 keys off
  the built drives; `ascAllows(where)` gates star entry (checkTransitions), wormholes,
  `travelTo`, `travelToCode`; `reachRadius()` returns `UCELL*0.35` below stage 3.
  Rings: Sol → Neighborhood (`ASC_RING_R = GR*0.25` around `SOL_POS`) → home galaxy →
  the pre-existing REGIONS/prime-signature ladder. Reset restarts the Ascent.

v1.3.11-grade fixes shipped in the same build: card offset-anchoring
(`_frozenPick`/`_livePick`), Compendium display shelves (`_SHELF_OF`), training roll
rigs on every step (feed rig is a HIGH roll — `feedPair` poisons on `roll<pois`),
duel `#duelskip`, vista `.vcard` windowed pop-up, `_rockSet` asteroid sprites,
helppop outside-tap closer. `resetMemoryState` now clears the engineer's track
(mined/mineX/cargo/tech/items/equip/asc — previously leaked through soft resets).

---

*Generated for continuity. If the source and this document disagree, trust the source —
then update this file.*
