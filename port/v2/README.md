# Celestial Frontier v2 — the TypeScript port (playable Phase-4 slice)

## Current port status — 2026-08-20

> **Arc 1A Compendium resource implementation (2026-08-20; product and serviced-turn
> scheduler repair and active repaired ruler present; exact-731 local battery green,
> hosted run `32420327368` consumed/incomplete, PR #32 blocked; [HUMAN] review open):** the 1,500-row Compendium is virtualized. List portraits use
> leased, cancellable, deduplicated 132px thumbnails; the visible detail owns an
> asynchronous 440px image; and Planetside acquires/releases through the same lease
> path instead of bypassing resource ownership. After app wiring, every default broker pump waits
> for one rendering opportunity and then one later task (`requestAnimationFrame` followed by
> `setTimeout(0)`) before dispatch. At most one serial dedicated module worker at a time owns the painter import,
> 440px scratch paint, 132px downsample, and PNG encoding. The renderer has no
> synchronous painter fallback; the worker terminates after active work settles and its queue is
> empty, and a later genuinely new producer burst owns a fresh instance/import. Pump-generation
> invalidation rejects a callback armed before bfcache suspension or disposal; resume schedules a
> fresh serviced turn.
> Capability/import/protocol/worker failures terminate once and settle active
> plus queued owners without retrying every tile, while paint/content-encode errors are
> per-job. Exact main-to-worker-to-painter ownership and document/epoch/instance/job/
> phase evidence are build- and report-bound. The last pre-timer budget at
> `budgets/compendium-memory-v1.json` was active under measurement authority `bb03a3af…` and bound repaired
> producer authority `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`
> (`assets/main-BAg-DH_f.js`; worker and painter unchanged). Clean seam commit `f47cd381…` supplied
> paired baseline4 against legacy product `3844701…`; independent one-attempt candidate5/6/7 use
> `f47cd381…` product/collector source and bind producer `1c8200d7…`. All four share exact Edge .86.
> Every candidate
> completed 78/78 outcomes with zero retries. That historical ruler replayed their raw capsules, placed
> every ceiling strictly above the three-run maximum, and retains four baseline faults with 14 phone /
> 13 desktop breaches. Commit `78813cd25c67f4255282f418ea6f635a45e0fc29` then passed one
> exact-head Arc-local Edge certification and independent verification: 78/78 outcomes, zero
> findings/retries, report SHA-256 `0d4a7f80…`. Committed Smoke-instrument head
> `ef6c2c2cd31363cf47899a89c16c0d9f5f90d7a7` also passed its own exact-source Arc-local Edge run
> `20260820-arc1a-serviced-turn-active-cert-ef6c2c2`: 78/78 outcomes, zero findings, blocked
> outcomes, partial failure, or retries, followed by a passing named-run verifier. Report SHA-256 is
> `406edea11fec5f5a3cf11e6f9fc6dfea00cbdd2ce54fefed780bd1c9dafc9282`. Those carriers remain
> truthful only under the old measurement authority; they cannot certify the shared-timer repair.
> `npm run compendiummem` is its standalone one-browser, one-attempt,
> zero-automatic-retry gate, preceded by `npm run compendiummem:selftest` and
> followed by exact-run verification. Its report and, for complete product
> evidence, six phone/desktop list/detail/focus-pinned PNGs live under the
> Git-ignored `apps/game/smoke/`
> evidence root: they are overwritten current-run evidence, not a committed
> PASS or a certification claim carried by tracked source. A fresh certifying run's six images
> still require explicit [HUMAN] visual review.
>
> **Current lifecycle boundary:** exact local head `89bfa05…`, run
> `20260820-pr32-89bfa05-compendiummem`, completed 78/78 product outcomes with zero findings and six
> PNGs, then exited 2 during owned browser shutdown. Terminal log `b0bb8abc…` is the truthful
> carrier; pre-cleanup PASS report `66ba1366…` and verifier `98664dca…` are false-green. Preserve
> this one-attempt/no-retry result as a post-measurement instrument red, not certification,
> calibration, or a product verdict.
>
> Clean lifecycle-repair source `c49e525…` then ran candidate20 once. It completed 78/78 product
> outcomes, zero findings, six PNGs, and complete lifecycle, but the reused `.86`-named app had
> self-updated to `Edg/151.0.4129.93`, revision `@4a822b1b…`. Quarantine report/sample/log
> `175fac5e…` / `916dd12a…` / `7462144b…` as wrong-browser instrument evidence—not calibration,
> certification, product failure, or HUMAN review.
>
> Candidate21/22/23 and paired baseline9 subsequently completed once each without retry under exact
> Edge `.86` and complete lifecycle. Every candidate replayed 78/78 with zero findings; baseline9
> retained all four faults. They are individually clean diagnostic history, but cannot activate:
> the old shared-sample identity incorrectly compared fresh executable paths and host user agents.
> Raw path/UA remain mandatory per-run provenance; shared browser authority is exact product/
> revision/JavaScript/protocol.
>
> Clean exact source `fb321f2…` then collected candidate24/25/26 plus paired baseline10, each once
> with zero retries and a distinct fresh `.86` path. All candidates completed 78/78 with zero
> findings, complete lifecycle, and six PNGs; baseline10 retained four faults. The formerly active budget/schema/
> contract/collector/selftest/test `70145575…` / `695d2529…` / `e7dfea1d…` / `07131f5e…` /
> `f86db74a…` / `0fa2e89d…` bind measurement `2318f57b…`, unchanged producer `d3223177…`, 3/3
> samples per profile, measured 1/1 baseline, and strict ceilings with 14 phone / 13 desktop
> baseline breaches. Focused activation is 13/13 after matching synthetic desktop identities fixed
> its initial phone-only 12/13 control; browser evidence did not change or rerun. Exact head
> `731b2e2…` passed its complete local battery, then GitHub run `32420327368` preserved one hosted
> incomplete-evidence red: root/static/Smoke/Glass passed, but Compendium was canceled at the
> 40-minute job ceiling while its report was still RUNNING/lifecycle-pending with zero terminal
> profiles/outcomes; the account-spending limit separately prevented the summary job from starting.
> No product/ruler verdict or retry exists. The repository is now public, so standard hosted runners
> are free while it remains public; `FROZEN` remains Nick's explicit efficiency/intent gate and
> 3,000 the fail-closed private/ambiguous cap. `GITHUB_ACTIONS_BUDGET.md` forbids push/label/dispatch/merge/publication until explicitly
> lifted; workflow conservation is local pending review and must not be pushed under the old remote
> automatic triggers.
>
> **Actions-budget workflow boundary (2026-08-20):** ordinary push, PR synchronization, merge,
> agent-sync, and post-green publication no longer own hosted runner work in the guarded local
> design. The full battery is one tiny authorization job plus one serial fail-fast job, eligible only
> when the repository owner adds exact PR label `actions-budget-approved`; the dependency preserves
> the sealed Compendium job's no-`if` contract and static checks precede Edge/Chrome. Other workflows are
> manual and false-default, while publication is hard parked. Run
> `node ../../tools/actions-budget-policy.js --selftest` from this directory (or
> `npm run actionsbudget:selftest` at repository root) before any authorized rollout. No timeout,
> launch argument, product byte, producer, browser-CDP, or retry policy changed in the ruler itself.
>
> **Current shutdown/ruler boundary:** exact implementation `aecf386…` bounds the owned
> HTTP server at one immutable monotonic 2,000 ms close deadline. Just-before succeeds;
> exact/late/missing/error callbacks force `closeAllConnections()` once and reject, with
> settle-before-force/reentrant/stale controls. Cleanup red suppresses PASS/sample.
> Collector/selftest/measurement `0c7ec3ba…` / `0bbb3541…` / `23aacc2c…`; producer remains
> `d3223177…`. Clean `6736ef4…` collected c27/baseline11/c28/c29 once each with zero retries and fresh
> exact Edge `.86`. Candidates completed 78/78, complete lifecycle, and 18 PNG bindings; baseline11
> retained four faults and 14 phone / 13 desktop breaches. Activation `b3957e1…` makes budget/test
> `546d3a81…` / `ef06252a…` active and retains every previous numeric ceiling strictly.
>
> **Current preview contract transition:** committed `2721798…` was locally green through persona,
> then stopped without retry at `preview:selftest` because its checker required job-level Chrome
> while the serialized test job intentionally owns Edge and its preview step pins Chrome. The scoped
> working-copy repair accepts only effective exact Chrome from that owning step overriding the job,
> or from one exact job environment; missing/wrong/duplicate/previous-step/command overrides reject.
> Full `preview:selftest` is green. One complete clean exact-head local battery remains.
>
> Exact committed Glass repair `dea03913014bc58134ebb06ca5b36892210a7571`
> passes the full 12-row Glass matrix. Its following exact Compendium run
> `20260817150005919-93781-b6643ba7a6` is preserved as truthful 75/76 evidence,
> solely red at `desktop/warm-plateau`. That run does not prove a product leak or
> a clean plateau: the old sequence destructively trimmed the desktop cache before
> warming and then measured refill, while its heap ruler omitted embedder/backing
> ownership. The committed calibration seam moves cap control after a full
> native warm-cache observation; records used, embedder, backing-store, and aggregate
> heap; proves stable warm keys/reuse and a post-cap restored snapshot; replays compact
> raw calibration capsules; measures repeated warm ownership at one fixed retained window rather
> than traversing beyond the native LRU cap; and binds the complete measurement-input plus built
> owner-to-worker-to-painter authority. Under measurement authority
> `bb03a3af59cdcc9d4d3773c1396e58b350c27facd99943cbd22028f2236d6a1c`, baseline3 was collected by
> `21af3fa2…` against legacy product `3844701…`; independent candidate2/3/4 use clean
> `21af3fa2…` product/collector source and bind historical producer
> `291b794e0dcd93ee21d7ff88cbca383e865a62e8dd162573d475131aca3b911e`. Their ruler set strict ceilings above every three-run maximum, aggregate page + embedder +
> backing-store heap, and a sealed fixed-window last-three-cycle plateau. Baseline3 retained all four
> expected faults and breached 14 phone ceilings and 13 desktop ceilings. Commit
> `da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` activated that ruler; local one-attempt Edge run
> `20260820-arc1a-active-cert-da0de20` passed, as did its no-retry Chrome Smoke, full 12-viewport
> Chrome Glass matrix, matching nine-persona join, root 787/787 layout, and verified nonpublishable
> exact-source preview.
>
> GitHub run `32334254714`, attempt 1, correctly stayed red without retry. Report
> `gha-32334254714-1-compendiummem` bound clean detached PR test-merge
> `88b9c7b0aa90b860a5474bd099cfab48b125a3f5`, exact Edge .86, matching budget bytes, and historical
> producer `291b794e…`. Phone completed 29 stages through veteran-Earth boot readiness; Planetside
> thumb settlement then missed the unchanged 2,000 ms target bound at 2,001.723 ms while the root
> browser heartbeat answered in 0.872 ms. The terminal classification is
> `product-unanswerable`, not instrument/transport. The partial report did not retain an exact
> producer phase; source inspection identified zero-delay successor-pump starvation as the bounded
> repair hypothesis.
> The serviced-turn repair changes the built producer, so the da0 ruler and its six images remain
> truthful history but are stale for current certification. Baseline4 and candidate5/6/7 later activated
> the serviced-turn producer's pre-timer ruler. The first exact-788 Chrome Smoke run
> `20260820063539761-70885-f80e1a2198fc` is preserved as a one-attempt/zero-retry instrument red:
> its held-painter phase created a second target and then waited for rAF-serviced successor pumps
> without re-establishing or proving the live owner's foreground authority. Its `last null` retained neither
> foreground authority nor the terminal image/worker phase, so it cannot identify a product
> substate. The repaired harness binds the attach-derived target/session and document, explicitly
> activates/focuses/brings each observed owner forward, proves continuous visible/focused
> rAF→later-task service before the single release, retains one immutable 30-second deadline, and
> preserves rich image/worker/broker diagnostics. Commit ef6 freezes that repair; its following
> exact-source Chrome Smoke advanced past the foreground control and retained only two D-TRAIN
> import-owner findings. Run `20260820071826194-75001-c2a22330fd09` bound clean ef6, Chrome for
> Testing 152.0.7977.54, 150,963 ms, ten screenshots, zero retries, and no source change; report/log
> SHA-256 values are `65ca06c8f6d26ef3a9a3da19bb4bc09bb005d754f2291f55f389ac1ecf14aa46` /
> `87b1c8b6308d3a1969fb45ea4c2ccb70d1f46c2a8311751984b3c1ab0acdd7d9`.
> The missing busy-refusal witness plus absent Skip (`button:false`, `witness:null`) are a harness
> setup race, not a product verdict: the direct fixture write did not join the preceding Atlas/Land
> persistence owner, and the old helper proved only document-token change. The report did not retain
> the winning primary bytes. The bounded follow-up drains the prior owner, reproduces stale overwrite
> as a negative control, proves exact primary/document/Training route/card/action/status/ticker setup,
> and waits semantically for `claim-rejected/busy`.
>
> Pushed head `1187de0d052761e4463524cde8438ea8810d7149` then reached GitHub Actions run
> `32350971816`, job `96369841133`, workflow attempt 1, on synthetic merge
> `25200b616bbd509f50eaa18f0a8b27ad20dc83e0` (base `38447019517147319bd08c598202d097ee866874`,
> head `1187de0d052761e4463524cde8438ea8810d7149`). Report
> `gha-32350971816-1-compendiummem` is a valid `instrument-fail`: phone completed 29 stages, but the
> final `Runtime.evaluate` timeout fired at `1999.758726` ms against the 2,000 ms command deadline.
> Its target remained `timely:true`, recorded completion was `0.241274` ms before the deadline, and
> the independent root heartbeat fulfilled in `7.410808` ms. The contract therefore produced one
> instrument finding, zero outcomes, and 78 blocked outcomes—no product verdict and no retry.
> Artifact/report/job-log SHA-256 values are
> `4932fb229c1de1d3820d2322e8273ce9ed609716c8f9f4d9e82b2fa2a3e408c7`,
> `1718faa4403f4f569899d9d328f08c3b7decafae23829d5fabe37660c36da43b`, and
> `7eda5facdac45d192c5b6071ac91394678d2fdb69b7992b218e0d3b0cb9c4ca9`.
>
> The repaired shared sender owns one absolute monotonic deadline. Frozen `browsercdp.mjs` SHA-256
> `36a832bc8cc32ba56373d1fa6d7339903a37a07b337fbf2748bbf95e489061d0` establishes measurement
> authority `f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409`. Paired baseline5 and
> independent candidate8/9/10 historically activated budget/test `8ffd0d8e…` / `121ab8cd…` for
> producer `1c8200d7…`; their one-attempt/no-retry capsules, 78/78 candidate replays, strict ceilings,
> and 14 phone / 13 desktop broken-baseline breaches remain truthful only for those exact bytes.
>
> Exact clean commit `c0955003d558d7b3deb0afe9e527f24969d512dc` then passed Compendium run
> `20260820-arc1a-absolute-deadline-active-cert-c095500` (report SHA-256 `55dba448666b6d461ceaa273c3ec85ed08dfbcb605497d2e1539147480e4b9bc`)
> and one-attempt Chrome Smoke `20260820104231234-94067-7f954ca9942e` (report SHA-256
> `6d4f00f841e18e80ecfb5cdcd48fab57f3e1b32f917b141681d49c281ae885dd`). Its first full-certifying
> Glass run stopped without retry and is preserved as `apps/game/smoke/glassmatrix-report-c095500.json`,
> SHA-256 `8e89d855abf33ba45d43d8284e05732ebad93891ff9e024004869811778917f0`: Chrome 152, 12/12 rows,
> 58/58 controls, zero instrument failures/retries, and only `PLANETSIDE_SURFACE_OCCLUDED` at
> compact-phone from a 12.5px Survey/Planetside rectangle overlap. Persona, layout, preview, push,
> and CI did not run.
>
> The bounded product repair derives the portrait Planetside cap from its shared bottom anchor,
> preserving Survey's 44px floor, a 72px scrollable Planetside floor, and the existing 8px gap; the
> existing Planetside development-release bullet names the outcome. Built producer authority is now
> `e59685b1a0d009c321c53fe2d3d8566b3f417d8c2decd89387d7be6d08b9a9fb`: index
> `ca76da4cfd094a7426cfd60b56428ca6abfc9851f472a1e459ad2938ae1e008e`, owner
> `assets/main-Ccq4RHJt.js` / `9260e359c3bebe6bf722ecad5234babbeff0a3e7bb6cb6f0a33242b99668e6c2`, worker and painter
> unchanged. Historical measurement `f9710bdf…` and clean committed collector/candidate source
> `2a105d51397eef97542d856ed3b1bb23edf2b028` collected paired baseline6 against legacy product
> `3844701…` and independent candidate11/12/13 under exact Edge .86. All four were one-attempt/no-retry;
> every candidate replays 78/78. Their historical budget/test SHA-256 values are
> `ebe5b5c38f4796652ebbe6110c19a5ad31c310d63ca3adbf5fd4575e3724527d` /
> `ec956b8a7d3bad96736deab42e0ac79e59e6cf9010559723d2dac2249e463a83`. All 40 ceilings strictly
> exceed their three-run maxima and the four-fault baseline breaches 14 phone / 13 desktop fields.
> Focused replay 11/11, selftest 222/222, and semantic validation were green. Exact pushed head
> `f9ae372f13d9a420e302f05e277b4445efb790c0` then passed its complete one-attempt local battery:
> Compendium 78/78, Smoke with zero findings, Glass 12/12 and 58/58, nine joined automated personas,
> root layout 787/787 across 10 viewports, and verified nonpublishable preview packaging/smoke.
>
> Corresponding GitHub Actions run `32367902426`, Compendium job `96421452463`, attempt 1, tested
> synthetic merge `e449e84984400d0b0f4474496264d474424c81d7` (base `3844701…`, head `f9ae372…`)
> and stopped before product measurement. Edge published a stable endpoint at `23657.701415` ms,
> leaving `6342.262417` ms of the 30-second absolute startup window for a socket with a 15-second
> phase cap; the absolute window expired before `Browser.getVersion`. There is no Compendium run,
> report, product outcome, or retry.
>
> At the `32367902426` transition, the selftest's single real cold launch alone changed its
> caller-local startup/socket/command/shutdown caps to
> 45,000/15,000/1,500/2,000 ms. Portable controls pass at 38,657 ms and reject exact/late
> 38,658/38,659 ms with one child and complete cleanup. That selftest caller change itself added no
> warmup, relaunch, retry, fallback, or workflow change; the generic launcher and candidate startup remain 15 seconds, and product
> observation remains 2 seconds. Browser-CDP SHA-256
> `6892dea6df1d222f53093faf62f0b0e38a2d18c600b7191aa29befc9960632e9` establishes measurement
> authority `6ba58522fc961e145df4f065f913d99d8b18355a20d664b9bcdc90741057638a`; producer then remained
> `e59685b1…`. Clean source `374049536e…` collected baseline7 plus independent
> candidate14/15/16 once without retry; every candidate replayed 78/78. The then-active budget/test
> `bb4da2bf0b…` / `d242705ad9…` own 40 strict ceilings, preserve the four baseline faults and
> 14 phone / 13 desktop breaches, and are browser-free activation rather than certification. The
> 45-second CI cold-start allowance is accepted process environment, not a game optimization target.
>
> Exact pushed head `c49af5a72a41eebd79ce3975852f3d7c22ab3ac6` then passed one complete local battery:
> Compendium 78/78 plus named verifier (`6bfa15af…`), no-finding Smoke (`4351d1bf…`), Glass 12/12
> and 58/58 (`4215986c…`), nine joined personas, root layout 787/787, and verified nonpublishable
> preview packaging/browser smoke. Corresponding test-merge run `32375329693` bound synthetic merge
> `8e09cffe20640e82c7b934df29a40fe22c5326e7` (base `3844701…`, head `c49af5a…`) once without retry.
> Static and Glass passed; three instrument boundaries stayed red. Root job `96445227534` produced
> zero viewport outcomes after its first Chrome launch reached no endpoint inside 30 seconds.
> Compendium job `96445227816` opened exact Edge .86 inside 45 seconds, then the generic selftest's
> 1.5-second `Runtime.enable` command expired before collector/product evidence. Smoke job
> `96445227991` retained ten screenshots and one finding after its immediate one-shot detail read
> saw only `src length 0`; the artifact did not retain image state or worker phase, then Back released
> the asynchronous owner, so it cannot adjudicate final 440px settlement. Smoke report/log are
> `3412fcc0…` / `2800519e…`.
>
> The bounded repair left the hashed launcher, candidate collector, then-active measurement
> `6ba58522…`, producer `e59685b1…`, budget `bb4da2bf0b…`, and test `d242705ad9…` unchanged. Root
> layout alone owns a captured one-call 45-second startup / 15-second socket / existing 30-second
> command / 5-second shutdown contract. Exact-Edge Compendium jobs run
> `tools/compendiummem-browser-preflight.mjs`: one 45/15/5/2-second launch using the sealed candidate
> command ceiling, exact browser/executable authority, a fresh attached target, required-domain plus
> evaluate/same-session-event sentinels under one immutable 5-second phase with strict-before-deadline
> receipts, and fail-closed cleanup. Smoke binds pre-Enter document/generation/logical owner, requires
> the opened detail to retain that document/owner at generation + 1, and polls under one 30-second deadline until connected current `ready`, nontrivial source,
> decoded 440×440 publication; pending/error/stale/contradictory/exact-late states have browser-free
> controls and rich terminal diagnosis. Those instrument repairs changed no product or retry policy.
> Exact pushed head `139ce2f…` then passed one complete local battery. Corresponding run
> `32383320206`, attempt 1, matched exact Edge .86, measurement `6ba58522…`, producer `e59685b1…`,
> and then-active budget `bb4da2bf0b…`. Phone completed 29 stages; Planetside thumb settlement's
> target `Runtime.evaluate` took `2001.132592` ms against the unchanged 2,000 ms deadline while root
> `Browser.getVersion` answered in `10.401960` ms. The valid no-retry terminal result is
> `product-unanswerable`: zero outcomes, 78 blocked, and no review PNG.
>
> The product now computes the fitted globe's displayed backing demand. Standard phone/desktop boot
> is 609/420px and selects the existing 512 tier. One exact surface-generation plus planet seed/
> ordinal owner re-reads the asynchronous bake, swaps only current settled content, rejects stale
> completion, and suppresses duplicate-tier work. Real zoom/DPR demand still upgrades through 768 to
> 1024; maximum tested phone/desktop demand is 1,248/1,280px, so supported sharpness is preserved.
> Product and development-copy bytes changed producer to `d3223177…` (index `dee9af3a…`, owner
> `assets/main-Da536xWA.js` / `28382873…`; worker/painter unchanged), while measurement then remained
> `6ba58522…`. Clean committed source `75a996af…` produced one no-retry baseline8 against legacy
> `3844701…` plus independent no-retry candidate17/18/19 under exact Edge .86; every candidate
> replayed 78/78, and baseline8 retained four faults with 14 phone / 13 desktop breaches. Then-active
> budget/test `74e88c2b…` / `485be9da…` (79,614 / 20,782 bytes) reused all 40 strict ceilings above
> the three-run maxima. Exact activation head `96464d5e4ca59074c0d8d59719a90a5dedc2dd2d`
> then passed its complete local battery. Corresponding run `32394244417`, attempt 1, stopped
> before product in exact-Edge job `96507263338`: runner image `ubuntu24/20260816.277` already
> carried verified .86, apt performed no unpack/setup, and the one unchanged 45-second live
> preflight launch published no CDP endpoint. No candidate, report, outcome, or review PNG exists.
> Both workflows now request same-package `--reinstall`; the preflight selftest statically owns and
> negative-controls the exact ordered package/preflight contract. This is a runner-image
> normalization hypothesis; exact-89 reached product and then exposed the separate owned-shutdown
> false-green described above. Product, timing, browser authority, and one-attempt/zero-retry policy
> remain unchanged. First red stops; work returns to Arc 1B/gameplay after PR #32 closes.
> Fresh six-image HUMAN review remains separately open.
>
> Numeric certification is scoped to the Arc-local browser authority
> `arc1a-compendium-memory-only`: product `Edg/151.0.4129.86`, revision
> `@083e754915c9ab93da1d8f7b9c860e4520273900`, JavaScript version
> `15.1.23.7`, and CDP protocol version `1.3`. Executable path and user agent
> remain recorded provenance but are deliberately not cross-host authority
> fields. Ubuntu CI provisions only the Compendium job/steps from the exact
> Microsoft package `microsoft-edge-stable_151.0.4129.86-1_amd64.deb`
> (SHA-256 `26b02cb1c6465756df94b9ef34191b614f3df627ba21b7b00b641f44cc1d8343`)
> with an explicit same-package `apt-get install --reinstall`, then verifies the installed version
> and `/usr/bin/microsoft-edge-stable`; ordinary smoke, Glass, persona,
> preview, and root browser gates remain on `/usr/bin/google-chrome`. This is
> not a Gate-A/global browser rebaseline: `../../tools/deps.pinned.json`
> remains Edge `150.0.4078.83`. The reinstall is a hosted-runner normalization hypothesis pending
> one changed-head CI, not a timing, authority, or product change. Arc 1B is not claimed.
>
> The PR #32 short-landscape fix is similarly bounded, not a visual redesign. An open
> nonmodal Compendium uses the left safe-height workspace with its variable-row scroller
> recomputed from the safe viewport; Search, dock, and Survey when open remain visible,
> accessible, and operable in the right column.
> Panel-open status already yields trail/objective; short landscape additionally yields only
> noninteractive top/context/hint chrome. Glass screenshots deliberately use
> hostile A++/monospace, focus-pinned, and clipped-ancestor fixtures, so they are evidence
> states rather than a preview of ordinary Dev polish.

> **D-TRAIN-1 working-tree source overlay (2026-08-16; local browser evidence
> recorded below; exact-head CI, integration, real-save Gate C, and human
> authority remain open):** the importer recognizes the exact v1.8.9
> eleven-field checkpoint `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` as a
> bounded, detached, recursively frozen `legacy-v1` record. It is not a whole
> save. The four ingress outcomes are none, current `{view}`, genuine
> `legacy-v1`, and bounded `legacy-or-unknown`; the synthetic
> `{codex,essence,marker}` test object remains unknown/refusal-only. A genuine
> checkpoint paired with legacy `tut:1` is rescued to incomplete. Completed
> saves cannot export pending evidence, and oversized unsafe evidence is never
> normalized into a writable checkpoint.
>
> `training-restore.ts` starts from the surrounding imported v4 expedition and
> replaces only the eleven checkpoint-owned surfaces. `e.where` is ignored as
> route authority and canonical Earth is source-proven. The legacy checkpoint
> has no `view`: Skip from Welcome stays/persists in Sol, full completion after
> Land stays/persists at Earth, and only current-v2 `{view}` restoration returns
> to the pre-Training route. Historical Earth data
> is sanitized, not promised byte-exact. The restore invents no landing,
> conquest, achievement, or route; down-clamps but never heals HP; reserves
> Earth inside the 120-row Atlas cap; and derives surveys/arrivals from
> `surveyedSet`/`sysSeen`. The optional compatible outer-v4 carrier
> `ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}` retains cumulative
> checkpoint records. Outer `v` remains 4, but this is an additive v4 envelope
> extension with an independently versioned nested carrier—not “no schema
> change,” v5, or a game/release bump. Absent carrier preserves historical
> derivation; floors cannot lower derived facts; `sysSeen` remains arrival
> authority; numeric `ever.v > 1` protects the whole save as `future-version`.
>
> Finish/Skip is an async atomic replacement: set `aria-busy`, disable actions,
> keep the lesson/focus lock, claim exclusive ownership before the first await,
> stop the ticker, cancel/drain ordinary persistence, build and source-prove a
> detached candidate, then make exactly one direct primary write. Publish live
> state and release the renderer only after durability. Pre-durable failure
> releases the claim and leaves the checkpoint/lesson retryable; post-durable
> publication failure never writes again and reloads from the committed primary.
> Source-error retains the exact checkpoint and incomplete state; it writes a
> safe-retry Sol candidate only when Sol is freshly proven and authorized. If
> Sol also cannot be proven, no fallback/write/clear/completion is forged and the
> checkpoint plus lesson remain retryable.
>
> Loaded pending checkpoints are write-held. Loaded `tut:0` without a checkpoint
> is also held and seated at proven Sol in runtime only; fresh empty onboarding
> remains ordinary. Unknown checkpoint or unavailable recovery route persistently
> locks `#importsheet` as an inert-background, focus-trapped, nonclosable modal;
> Escape cannot close it, release copy is suppressed, trusted complete import and
> reload remain available, and every boot reopens it while the protected source
> remains. The five replacement reasons are `training-restart`,
> `training-complete`, `training-recovery`, `save-import`, and `storage-retry`.
> This does not add the remaining fifteen D-TRAIN-2 lessons, close real-save Gate
> C, add a Guide capability, alter the five-category/44-bullet draft, set a current
> release, or authorize a version/release.
>
> Ignored local evidence is now terminal PASS on Edge `151.0.4129.86` at
> commit `b091f010011fa16bec457599b41274b7f92bb5e6`, branch `openai/mac`.
> Slice Smoke run `20260816195736683-4852-27b5c876410a` took 154,788 ms with
> 0 findings, 0 automatic retries, 10 screenshots, and no detected source
> change; its raw outcome names genuine Training Skip + full Finish,
> rescue/quarantine/retry/races, and canonical Earth. Full-certifying Glass
> took 57,476 ms across 12/12 viewports and 12/12 reload-evidence rows, ran
> all 57/57 planned negative controls with none blocked/omitted, and recorded
> 0 findings, 0 instrument failures, and 0 retries. Slice Smoke binds dirty
> working-tree SHA-256
> `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`;
> Glass binds `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
> Both bind Git-status digest
> `c195873a910c3bce42db222560c9bc70b8763df330d0454036388e4e398faa6d`.
> Slice report SHA-256 is
> `33953319124590ced0cebc16888cfb2b8cbe2879cbcb3c225e061d0d7a817027`;
> its 4,163-byte raw-log SHA-256 is
> `b060af3aaa8454a5d9813b2e5f8e6eba0ec2b7f5d3090e991154c1664a132670`.
> Glass report SHA-256 is
> `fe32fe802460a61ec4337c373276de8601196ead530ae8184c36970247545254`.
> These reports cover their exact dirty diagnostic inputs, not this later
> documentation tree, exact-head CI, integration, Gate C, human play, mapped
> publication, or release authority.

> **F2 canonical-ingress working-tree overlay (2026-08-15; historical pre-D-TRAIN-1 implementation and
> complete local browser outcome present, exact-head integration pending):** `@cf/scene` now treats every
> current galaxy, star and planet navigation route as a candidate rather than
> authority. The strict CF1 parser supports all three tiers; production resolvers regenerate
> each claimed tier from WorldGen and mint deeply frozen `ProvenGalaxy`,
> `ProvenStar` and `ProvenPlanet` values only after one unambiguous source
> match. Runtime-private registries/keys bind each child to its canonical
> parent. `NavState` is now a frozen discriminated union, and its smart
> transitions reject structural clones, unproven nodes and cross-parent
> composition without changing the current state. Planet identity includes
> the ordinal from `systemFor(star).planets` **before** orbit presentation sort;
> seed-only diagnostics no longer select a planet action.
>
> The common boundary now owns generated descent/actions, galaxy/star/planet
> Search, saved-view boot/import, Atlas rows and the exact current one-key
> Field Training `{view}` snapshot. Proof and Prime/Charter authorization occur
> before destination navigation, an accepted custom name, a route-focused
> planet card, Land, progression or persistence commit. A planet address still
> stops at its system survey. Import keeps bounded pre-repair route evidence
> outside `SaveStateV2`; Atlas actionability is a runtime `WeakMap` sidecar. Deterministically invalid or unauthorized
> saved navigation repairs only `view` to Cosmos, while a `source-error` holds
> that route field rather than treating it as stale. If current one-key
> Training restoration pauses on that failure, the drill remains incomplete,
> retains its exact snapshot, and conditionally returns to a newly proven Sol
> before persistence so reload can reopen Welcome for a safe retry. Atlas history remains
> visible but disabled without runtime proof. `navToView()` emits the unchanged
> compatibility shape and serializes no proof brand, key, parent cell, star
> layer or planet ordinal.
>
> The first F2 real-browser attempt was genuinely **red**: accepted galaxy
> navigation reached `hudText()`, which passed a frozen `ProvenGalaxy` to the
> lifted `galaxyStats()` helper; that helper memoizes by assigning `_stats` to
> its argument. The scoped repair leaves provenance immutable and leaves the
> lifted helper unchanged: the app supplies a disposable mutable caller-side
> copy and stores only frozen `{stars,planets}` output in a
> `WeakMap<ProvenGalaxy,...>` sidecar. Separately, `universeGalaxies()` now
> copies and freezes each nested collision `bridge`, so mutating a composed
> scene node cannot poison WorldGen's memoized source or a later composition.
> The matching source mutation control is focused evidence; the browser smoke
> is not presented as proof of that nested-copy contract.
>
> Final audit added held-route Training Restart transfer/rollback and non-null
> provenance-key controls. A CI-format rendered-copy run then failed closed
> because its bare expected title did not include the real Guide heading's
> category icon, even though every required phrase was present and every
> contradiction guard was false. The contained-title repair keeps the
> cross-topic failure direction. The next diagnosed `npm run smoke:ci` passed
> with zero findings/retries, ten fresh screenshots, Edge `151.0.4129.86`,
> 138,305 ms, and working-tree digest
> `7dfa649eb7de017424b7ba1ba0b11ba1fd00dc02a5b99b6848e0f3c347acba9e`.
> The 12-viewport Glass Matrix binds that same digest/browser and passed in
> 55,065 ms with zero findings or instrument failures. Browser/report
> selftests, 27 files / 340 passed / 1 skipped, both TypeScript programs,
> `artunused`, art routing/coverage/spec controls, diff hygiene and the
> 790-module app build are green. This is local dirty-working-tree evidence,
> not exact-head CI, integration or Gate-completion authority.
>
> F2 itself changed no save schema or generated share-code bytes, reach balance,
> ownership or local ledger migration, reward/receipt writer, Guide capability
> availability, Training lesson inventory, development/production version or
> release, F3 CAS/revisions, or F4 clock/SessionRNG policy. At that boundary D-TRAIN-1's richer legacy
> checkpoint transaction remained open. The dated 2026-08-13 review below is
> retained as the earlier, narrower Search-to-planet boundary it recorded.

> **Next-arc architecture review (2026-08-13):**
> `../../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` is the approved cross-system
> implementation contract. It does not widen the current Guide capabilities. Inventory,
> Shipyard/build actions, item-instance loot, living companion ownership/dispatch, live
> breeding/combat/Guardians and the full audio layer remain unimplemented. The required
> order is ownership first—virtualized portraits and memory plateau, shared ship reach/
> visual state, separate catalogue/creature and base-item/gear-instance identities,
> revisioned exact-once reward receipts—then content scale. The Charter current-truth
> repair is now live: canonical legacy chapter bytes remain import/reach data, while the
> board and objective chip share a stage-aware `projectV2Charter` /
> `currentV2Objective` view that exposes only landfall the slice can actually write. A
> completed visible landfall ends at an honest boundary; it cannot manufacture a chapter,
> drive, reward or reach tier, and a nonterminal bare chapter index cannot substitute for a
> saved drive. The explicit terminal legacy/veteran fallback (`ascCh >= ASC_CHAPTER_COUNT`)
> deliberately remains stage 3 even when drive-item bytes are absent.
> Malformed chapter positions fail closed without changing progress, and the canonical Charter
> array, chapters, goal arrays, goals, and projected aliases are recursively immutable.
> Only a genuine first landing banks new progress. Any successful Land action separately
> reconciles every consecutive canonically complete, reach-backed imported chapter even when
> its landfall counters were saturated; it never re-banks or advances incomplete/unpowered data.
> `@cf/scene/address.ts` also now re-derives a complete galaxy → star → planet hierarchy
> from deterministic sources for external Search-to-planet CF1 routes before navigation or
> persistence; malformed, forged and ambiguous candidates fail closed. That protection is
> intentionally scoped: saved views, Atlas/non-planet routes, generated descents and future
> ownership receipts still require canonical ingress work.
> At that 2026-08-13 boundary, the wall-clock Auto-Extractor exploit, Compendium
> decoded-image exposure, and long-session texture/audio ownership were explicit
> prerequisites. Arc 1A now closes only the Compendium implementation slice described
> above; Auto-Extractor and broader long-session texture/audio ownership remain open.
> Planned systems stay unavailable
> in the Guide until real actions, reload/persistence, reachability and negative-controlled
> outcome gates exist.

This playtest line is **Celestial Frontier v2.0 development**. The identity is
centralized in `version.json` and appears with the full source commit inside the
Guide only—never as a corner badge. It does not authorize a production release:
`V2_CURRENT_RELEASE_VERSION` remains `null`, the legacy v1.8.9 history remains
immutable, and no one-time update bulletin can fire. Automatic branch publication is parked;
any future exact-SHA promotion requires separate owner authorization and target isolation.

The 14 planned deterministic domain facades are present and the port has a
playable Pixi/browser slice, but the old milestone record below is not a claim
that Gates B–D are literally closed. This audit found and repaired concrete
integration gaps: the app's own TypeScript configuration now participates in
`npm run typecheck`; CI installs v2 and runs its core test/type/art/browser-smoke
gates; the DOM waiver is narrowed
to three exact compatibility expressions; sparse/corrupt and future save
payloads cannot overwrite proven data, and an invalid/future recovery backup is
classified before it can replace an invalid primary. A direct contract proves
all nine supported fixture families export a boot-accepted envelope, while reset
clears the canonical complete store list. IndexedDB can recover after a failed
open; hostile epoch input is bounded; Atlas route identity, planet landing,
named CF1 sharing, stale-card actions and repeat landfall outcomes are guarded;
SessionRNG rejects hostile counters/keys; the specifically audited handwritten
domain declarations match their runtime APIs; live species-art work is now broker-owned and
worker-isolated as recorded in the current overlay (the older retained-subscriber boundary below
is historical); and the phone
dock is a measured 4×2 layout with browser-backed non-overlap/hit-target
negative controls. Pixi now keeps its DPR-scaled backing store displayed in a
viewport-sized CSS box, so phone visuals and hit coordinates agree. Native
backing is retained through UHD 3,840×2,160. A viewport strictly larger than
8,388,608 CSS pixels selects an ultra tier of 2,073,600 backing pixels per
canvas /4,147,200 aggregate, fitted against exact rounded dimensions; 8K and
5,120×2,880 each use two 1,920×1,080 stores (4,147,200 pixels combined), at DPR
0.25 and 0.375 respectively. The prior backdrop is
destroyed/collapsed before its replacement allocation, and same-backing logical
resizes still refresh Pixi CSS/screen/texture/event and pointer geometry. Downshift
and restore each require an exact target/browser-heartbeat pair, an advancing later
post-render ticker turn, and stopped/stale-ticker controls. The existing full scene
rerender remains; no scene-rerender optimization or separate scene-art quality tier landed.
Pixi initializes with
`autoStart:false` through save/scene/slice/input wiring, then proves a real tick/
render, animation frame and later task before ready. Browser smoke and
performance tools now use the owned, portable CDP lifecycle; the root legacy
`tools/uilayout.js` gate consumes that same resolver/launcher rather than carrying
an independent fixed-port lifecycle.
This workspace and the repository root both declare/lock the raw-CDP `ws`
transport and support Node `^20.19.0 || ^22.13.0 || >=24.0.0`; install each surface
with its own `npm install` / `npm ci` before running its tools.

The audited declaration statement is intentionally bounded, not a claim that
every lifted surface has been exhaustively certified. WorldGen now declares the
required own `galaxiesInCell(...).web` metadata and the exact supernova
site/birth/remnant result, and names the second supernova parameter as the
deterministic epoch key. The byte-verbatim generator is unchanged. Its facade
also documents the transitional requirement that `GAL_SPRITES` be installed
before a first uncached ordinary generated-galaxy branch; the app already does
so. Empty, special-only, and cached calls may not read that binding. This closes
the missing public warning, not the free-global dependency, CF1/F2, or F4 clock
wiring, and `_sanitizeSavedGenome`'s separate DOM-11 mutation remains open.

The current `@cf/audio` boundary remains stings-only. Its exported rarity,
survey and navigation stings plus `applySfxGain()` safely no-op before
`initAudio()` installs the save-backed seam; initialization does not create an
`AudioContext`. After initialization, Sound-off prevents context creation, the
first enabled sting lazily prefers standard `AudioContext` and uses
`webkitAudioContext` only when the standard constructor is absent, and one
context is reused. The focused package suite covers import/pre-init safety,
post-init dispatch, live mute state, constructor precedence/failure and
suspended resume rejection without claiming audible quality. During the
awaited save-load, the application assigns the save and then calls
`initAudio()` synchronously before later playable scene/input publication; no
ordinary current pre-init action route to the former package exception has
been reproduced. Creature voices, ambience, combat/Guardian cues, music,
mixer/node ownership, visibility/context-loss lifecycle, budgets, rights, listening and
device evidence remain Arc 7/8 and Gate G work. This hardening changes no Guide
capability, Training lesson, development-release bullet or version identity.

The `@cf/domain-progression` epoch contract now distinguishes the immutable
sanitized `EpochClock.base()` construction origin from the advancing
`current()` snapshot ordinary saves must persist. The app was already wired
correctly: it constructs once from imported `EPOCH_BASE` plus a fresh monotonic
page-residence segment, refreshes the compatibility-named field from `current()`
before export, and constructs a new clock after reload. Smoke now advances one
exact epoch, inspects the raw IndexedDB primary, reloads it, and rejects stored-
base or stale-reload substitutions. This does not close F3's CAS/revision/tab-
lease substrate or F4's automatic-edge, hidden-tab, live-global, SessionRNG and
persisted `activePlayMs` clock/accrual work.

The former save-import dock slot now opens the source-addressed **Guide to the
Universe**, not a replacement mini-manual. It retains all 9 mature categories,
43 authored stable IDs and 41 player topics with search, categories, native-keyboard
cross-links and capability-aware v2 copy. Non-dormant unported mechanics remain
discoverable but are explicitly unavailable; intentionally dormant topics remain
source-recorded and player-hidden. No legacy promise is presented as current behavior.
Opening it persists the existing `seenGuide` field. The Guide also carries the full
56-release/398-bullet legacy history beside **A New Foundation**, the cumulative
categorized v2.0 development bulletin. The draft summarizes the implemented playtest
surface rather than the open roadmap; tests require canonical section order, unique
nonempty bullets, the key player-facing outcomes, and a scroll-reachable final item.
That playtest identity cannot trigger the one-time update popup, update `rnSeen`,
create `releasePending`, or create a production release. Save import remains available
under **Settings → Save data → Bring expedition**, where the same complete-envelope and
future/corrupt-byte protections apply. The import surface is an `aria-modal`
top layer with internal Tab wrapping and Escape-only close/focus restoration;
the phone gate rejects its former low-z click-through state. This is deliberately
an honest manual for the current slice, not a claim that tooltip deep-links,
Advanced Briefings, or every late-game system has already been ported.
Field Training is equally explicit about its boundary: the slice runs the six
welcome/find-Earth/survey/chart/Atlas/land lessons and then an honest
"Finish for now" step. Cache, feeding, breeding, duel, hazard, healing, forge,
and the rest of the legacy 21-step curriculum remain open with their systems.
Genuine v1.8.9 checkpoints restore only their eleven owned pre-drill surfaces;
surrounding expedition state stays with the surrounding save. Unknown checkpoint
or unavailable-route recovery reuses the import sheet in a stricter persistent
mode: background inert, focus trapped, no Close/Escape dismissal, release bulletin
suppressed, and only reload/retry or trusted complete import available.
Outside Training, ordinary panels use z24 above an open z23 survey card. During
Training, the intentional lesson choreography remains authoritative and keyboard
focus is locked to the live lesson. The phone gate injects the former lower panel
layer and requires the rendered panel/card intersection to fail.

The current glass correction gives every panel and Survey card exactly one 44px
top-right Close action; panel refill preserves that owner and removes duplicate seats.
Balanced padding, row dividers and inset borders replace the uneven close gutter.
Desktop notifications, Settings and Records share the bottom-right utility edge above
the measured dock. Non-dismiss chrome now self-declares one `data-panel-boundary`
root instead of relying on an asymmetric ID list: a real pointer in either desktop
rail's measured 8px gap preserves the active panel/ARIA state, removing either marker
recreates dismissal, and genuine unmarked canvas space still closes. Search retains
its established outside-dismiss/focus behavior; modal, Training, coexistence and Escape
policy are unchanged. Survey rendering filters the legacy `Spectral class` row without
changing deterministic descriptor data: planet rarity is absent before landing and
plain after landing, while internal seeded spectral colors and real stellar
classification remain intact.

Survey-first descent is phone- and slow-device safe: one tap opens the typed
survey card without teleporting, and its explicit 44px `Enter galaxy` or
`Enter system` action performs the dive. The card may cover the body on a
phone, so navigation does not depend on a second canvas tap or timing window.
The browser gate proves desktop and real 390×844 touch galaxy entry, the exact
base Sol node `{seed:424242,x:560,y:170}`, a real stage-0 fine-star action
rejected by the Charter, and stage-2 entry into the touched fine star's exact
`{seed,x,y}`. It requires `autoDensity` geometry and rejects DPR-sized CSS
canvas and buried-action controls.
Planet cards separately snapshot the complete galaxy+star `{seed,x,y}` context;
a same-seed/different-coordinate browser control proves stale Land, Atlas and
Share actions cannot be rebound to another node.
On touch, Planetside also exposes a minimum-44px **Leave world** action wired to
the same guarded ascent state machine as Escape/right-click, so a phone player
never needs a keyboard or a zoom gesture merely to return to orbit.
On portrait phones, the populated Planetside strip measures visible fixed top
chrome plus the last visible trail edge and the lower safe/dock/context chrome.
`syncDockH` and `syncCtxH` reclassify after asynchronous chrome changes. The trail remains visible when a
useful 72px roster band plus 6px separation fits; when it does not,
`surface-trail-yield` hides only that noninteractive trail. The roster retains a
72px minimum, scrolls vertically when clipped, and restores the trail when the
band grows again. `planetside-portrait-band-viability` removes the cap to
recreate the collision; `planetside-portrait-trail-fallback` forces and then
restores the tight branch while proving the roster remains useful and reachable.

GitHub test-battery #199, run `31571459050` / job `94034164092`, exposed the
former desktop-8k reload ambiguity and small-phone Planetside/trail overlap.
Pushed commit `8b8a740286a56591cac9dc5734a2fba4c088939b` repairs both: import
settlement and replacement boot have separate 20-second bounds, a changed top-
frame loader plus document token is required, and portrait Planetside preserves
a useful 72px scrolling band with a measured trail fallback. The deliberate
failing controls and exact sequential local battery passed.

Matching GitHub test-battery #200, run `31577395120` / job `94052496287`,
passed all root/product/v2 gates, the single `smoke:ci` run, the complete
12-viewport glass matrix including 8K, matching-provenance automated personas,
and `preview:package`. Only final `preview:smoke` failed before a page existed.
The preceding evidence step set `CF_BROWSER=/usr/bin/google-chrome` only for its
own process; the preview step did not inherit it, so the resolver selected Linux
Edge at `/opt/microsoft/msedge/microsoft-edge`, which never wrote
`DevToolsActivePort`. This is a CI browser-provenance failure, not a product,
responsive, package, or preview-page finding. The workflow repair pins Chrome at
job scope in both CI workflows and resolves it fail-closed before the long battery.
That workflow repair is pushed commit
`4d14a75e934536dc5f204e40c74f666cc9514df4`. Follow-on commit
`08379d8c072c7eb22e2a029d666972c86d496326` moves root layout to the owned
launcher and creates ignored atomic schema-v2
run/browser/status evidence with stale-PASS/exit-73 and exact-run freshness controls.
Full layout PASS also binds the exact 787 `viewport/surface/name` inventory to the
sealed v1.8.9 report; targeted viewports remain scoped. Its selftest deletes one
sealed outcome, keeps the summary counts consistent, and still requires rejection.
Its initial sandboxed Edge launch preserved SIGABRT as red; a separately permitted
mutable-tree diagnostic completed 787/787 across 10 viewports, but is not exact-head
certification.

Matching test-battery #201, run `31586917924` / job `94082765087`, completed
once without retry on pushed `4560269b8767dc48bb82e3b1f9d82ca835a84aad` and is **RED**. Every preceding root,
product and v2 gate—including `smoke:ci`—passed. Only the desktop-8k preference-
fixture import leg instrument-failed after its former 20-second replacement wait:
the old loader remained while the old slice token and import phase were absent.
This is a replacement-lifecycle/instrument finding after reload was requested,
not a save-classifier rejection or reported repository-write error. Do not rerun
unchanged #201 or lengthen its timeout to mask it.

Immutable executable evidence source `7d9980e37e60f0cec8cb840e75098872b9cc90d0`
makes the product's Training-restart,
supported-import and storage-retry reloads claim one mutually exclusive replacement
transaction before awaiting. The claim synchronously stops a running outgoing
Pixi ticker before any persistence wait; only the exact owner of a failed or
rolled-back transaction may restart a ticker that it stopped, while invalid
pre-claim import rejection leaves ordinary play unchanged. A successful flow
then explicitly releases the outgoing Pixi
application/global resources, detaches the view, and collapses both application and
backdrop canvases to at most 1×1 before a one-task reload barrier. It is code-owned,
not a generic `pagehide` teardown, so browser-cache restoration cannot revive a
destroyed app. An optional CDP binding emits the release postconditions outside the
dying context. Glass uses sticky receipts to bound a 20-second import/release,
5-second changed-loader navigation commit and independent 20-second new-loader
boot; requires one valid release plus one exact-context ready event and a short
confirmation; and retains sticky Page/Runtime/Inspector/Network failure evidence. The paired
`replacement-document-loader-token-phase` and `reload-resource-release` controls
reject the ambiguous and resource-retention paths, including just-late transitions
at every phase boundary, with zero retries.

Test-battery #202, run
[`31594595288`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288) /
job [`94106996466`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31594595288/job/94106996466),
completed once without retry at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53`
and is **RED**. Every earlier root/product/v2 gate and `smoke:ci` passed. Only
desktop-8k glass import/replacement instrument-failed when the serial observer's
first result arrived at 61.163 seconds. Its former loop awaited two frame-tree
commands around an awaited Runtime evaluation, each with a 30-second command
ceiling, so #202 is instrument ambiguity—not proof of a 61-second application
boot, save rejection or product failure. It remains preserved without retry.

The current repair moves authority to sticky CDP event receipt timestamps. Its
`cf-v2-import-phase/v1` stream requires the exact phase id, prior document/session/
default-context/loader, sequence, and deadline. A no-pending-save success is
`invoked` (ticker running) → `claimed` → `no-active-persist` → write start/
complete → release start/complete, with the ticker stopped after `invoked`; an
active save adds wait/settled stages. The absolute 20-second clock begins before
one bounded, non-awaiting import-arm command and is never renewed. It then
requires one reason/token-bound release from the prior default top context, a
changed top-frame loader commit, and one `cf-v2-slice-ready/v1` tail binding from
the exact new default top context/session/loader/origin before their phase-owned
deadlines. The app emits that optional ready event after load, complete input/
slice wiring, persistence readiness, at least one ticker turn, an animation frame
and a later task. Two strict at-most-2-second confirmation cycles follow: each
pairs an exact-context Runtime probe with an independent browser-process
`Browser.getVersion` heartbeat, and the second waits for a later post-render
ticker turn. Their exact five-row ledger includes the import arm plus both
target/heartbeat pairs. This is complete boot publication plus a serviced
event-loop turn and bounded post-ready commandability, not the separate 50 ms
answerability claim. The payload's browser-native
`performanceNow` must be strictly below 20 seconds, and an exact-boundary control
fails, so observer descheduling cannot make a late product boot look timely.
Missing, duplicate, malformed, wrong-
session/context/generation/origin/loader/token/URL, pre-commit and just-late events
fail closed; sticky fatal events survive bounded diagnostic-ring rollover.
`import-phase-sequence` and `replacement-ticker-quiescence` negative-control the
new boundary, including stopped-before-`invoked`, running-after-claim, and exact-
deadline-late evidence. No timeout increases, retries, or `Promise.race` around
IndexedDB durability are used.

The import-phase and generic release bindings now share one capture-scoped monotonic
receipt ordinal. The only successful terminal is `release-started` N → release N+1 →
`release-complete` N+2. The producer-legal release-first intermediate remains pending
under the same original import deadline; phase-complete-first, premature, nonadjacent,
missing, late, duplicate, malformed, wrong-provenance, early boot/ready, and an overlong
sequence-8 terminal fail closed.

The complete clean `7d9980e` battery passed: root preflight selftest/preflight
(only Edge 151 versus pinned Edge 150 drift), validate/fingerprint and smoke;
root layout selftest plus `exact-7d9980e-root-layout` 787/787 across 10/10
viewports and exact verification; rarity 60M/0;
dead-code 3 known tooling references; v2 24 files /273 tests /1 skip plus every
type/art/override/coverage/spec/instrument gate; and one-attempt smoke 0 findings /
10 screenshots. Exact-source certifying glass passed 12/12 viewports, 52/52 controls,
`omitted=[]`, 0 findings/instrument failures/retries and all 12 exact import-phase/
release/ready paths at digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
Replacement totals were 194–239 ms; desktop-8k recorded a 3 ms arm, 21 ms
import-phase span with ticker true only at `invoked`, 0 ms write, 19 ms release,
5,461×3,072→1×1 for both canvases, `performanceNow` 199.5 ms, 1 ms confirmation
and 239 ms total. Nine personas passed. The malformed initial
`npm run perf -- --runs=4` command was rejected before browser startup; the correct
single terminal diagnostic then recorded 646/726/74/157 ms and was not a retry
of an evidence failure. Exact 37-file / 10,170,996-byte preview
`dev-preview-exact-7d9980e` verified and browser-smoked PASS under Edge 151 at
320×568 for `https://dev-celestialfrontier.github.io`, distinct from production,
content `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`,
exact `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, `publishable:false`.
`7d9980e` remains immutable prior evidence from the preceding docs-only handoff;
the later prior #204 repair evidence is bound to clean source `46fb627` below.
Prior #201 and #202 stay preserved red without retry. `overridecontrol` remains exclusive
and may not overlap any browser, build or evidence producer.

Test-battery #203, run
[`31602984470`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470) /
job [`94134750800`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31602984470/job/94134750800),
completed once without retry at exact pushed head
`38e4f362533e272f56f708229f7a037f38ae8951` and remains **RED**. Every gate
before glass—including `smoke:ci`—passed, and 11 viewport rows passed. Only
desktop-8k import reached 20,015 ms before any release, ready, navigation, fatal,
command, or event evidence. The outgoing 5,461×3,072 Pixi ticker was still live
through the durable-write wait and teardown under CI software rendering. This is
a pre-release renderer-pressure cliff, not save corruption or a reported
repository-write failure. Preserve it without retry or a longer deadline.

Test-battery #204, run
[`31612817092`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092) /
job [`94168172635`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31612817092/job/94168172635),
completed once without retry at exact pushed head
`4cee7d807b8f9258e370aad31c30756269f95a96` and remains **RED**. Every earlier
root/product/v2 gate and `smoke:ci` passed. Desktop-8k's arm command queued for
9,504 ms, then import/write, 35 ms release, navigation, changed loader at 45 ms,
load at 231 ms and FCP at 268 ms were healthy; the new document emitted no ready
witness within 20 seconds and no fatal event. The cause was two independent full
16,777,216-pixel full-viewport allocations plus Pixi auto-starting before async
boot wiring. This is not an import, write, release, navigation, load or FCP
failure. Preserve the single execution without retry or deadline growth.

The repair gives the twin canvases one aggregate budget and adds an exact
event-owned `cf-v2-boot-phase/v1` sequence: `app-init-start`, `app-init-complete`,
`backdrop-complete`, `save-load-start`, `save-load-complete`, `scene-rendered`,
`slice-published`, `wiring-complete`, `ticker-started`, `first-tick`,
`ready-scheduled`, `ready-emitted`. Every stage binds the target session/default
context/generation/origin/loader/token; the ticker is false through wiring and
true thereafter. Per-stage/deadline controls reject missing, reordered, wrong-
identity, early-ticker and late evidence, while smoke asserts fresh-boot and
post-import ticker outcomes.

Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
passed the exact local battery. One malformed `--verify-run` operator invocation
caused local SIGABRT/report overwrite; one correct rerun plus verification then
passed `exact-46fb627-root-layout`, 787/787 across 10/10. V2 passed 273/1 and all
gates/selftests; one-attempt smoke passed 0 findings /10 screenshots. Full
certifying glass at source-snapshot digest
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms,
1 ms confirmation, outgoing 3,862×2,172 canvases →1×1 and the replacement pair
at 16,776,528 pixels combined. Nine automated personas passed; terminal-only
performance was 595/676/76/168 ms. Manifest `dev-preview-exact-46fb627` records
37 files /10,176,376 bytes, content SHA-256
`4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`, exact
tree `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected origin
`https://dev-celestialfrontier.github.io`, production distinct and
`publishable:false`. `46fb627` remains prior immutable exact evidence. Host,
human play, Ready, merge, release,
deployment and version authority remain unchanged.

Test-battery #205, run
[`31621227550`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550) /
job [`94196289291`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31621227550/job/94196289291),
completed once without retry at exact pushed
`c57305fbf30af2bc8158ff46af1ec49ec4455d95` and remains **RED**. Every
preceding gate and `smoke:ci` passed. Desktop-8k completed import/write/release,
changed-loader navigation, all 12 boot stages and ready at browser-native
`performanceNow` about 3,733 ms; only its following exact-context confirmation
timed out at the two-second bound. Because #205 recorded no concurrent browser-
process heartbeat, it is strong pixel-linear evidence of post-ready target
starvation but not retrospective proof of healthy browser/CDP transport.

The follow-on requires two strict, no-retry, at-most-two-second exact-context
cycles, each concurrent with root-session `Browser.getVersion`; cycle 2 resolves
only on a later Pixi ticker callback after the render listener. The exact
five-command ledger, product-vs-instrument classification, 57-control plan, and
separate executed / `blockedNegativeControls` / `omittedNegativeControls`
accounting prevent a target failure from being rewritten as a generic instrument
omission. The ultra-density controls also prove exact rounded cap/backing/peak
ownership plus CSS/Pixi/EventSystem/pointer/backdrop changes when two logical
viewports share the same backing dimensions.

Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass
captures based on `c57305f` remain non-authoritative; their sandbox `EPERM` and
corrected `7680.000000000001` assertion did not retry a product failure.
Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
passed the complete exact sequential battery from clean source-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
and source-snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
passed outside sandbox without product retry. Root validate, legacy smoke,
rarity and dead-code passed. Root layout run
`exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
under Edge 151 in 75,532 ms; report SHA-256
`7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`.
V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt slice
smoke passed 0 findings /10 screenshots /0 retries in 105,379 ms; report SHA-256
`c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`.
Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
zero findings/instrument failures/retries in 52,254 ms; report SHA-256
`1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`;
reloads were 176–185 ms. Exact 8K was 185 ms /2 ms arm /12 ms invoked→release /
32 ms release→commit /122 ms commit→ready /152.2 ms `performanceNow`, with
target confirmations 1/9 ms and heartbeats 1/1 ms. Outgoing/replacement stores
were 2,730×1,536 each; outgoing collapsed to 1×1 and replacement remained
8,386,560 combined pixels. Nine automated personas passed, not human play;
JSON/Markdown SHA-256 are
`c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
`43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`.
Terminal-only performance was 578/659/76/170 ms. Exact preview
`dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
Edge 151; manifest SHA-256
`0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
37 files /10,186,230 bytes, content
`da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
production distinct and `publishable:false`. Live Git/status/PR checks determine
the docs-only tip; matching CI remains required before any separately authorized
preview or human step.

Test-battery #206, run
[`31635297321`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321) /
job [`94243979205`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31635297321/job/94243979205),
completed attempt 1 without retry at exact pushed
`558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
Every preceding step and `smoke:ci` passed. Desktop-8k reload passed in 8,749 ms;
ready `performanceNow` was 2,578.6 ms, and initial target cycles were 1,905/1,910 ms
with 3/1 ms heartbeats. On the later 5,120×2,880 transition, exact-context
`Runtime.evaluate` timed out at 2,003 ms against the strict 2,000 ms bound while
`Browser.getVersion` answered in 2 ms; `last:null`. The sole
`ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` is a product finding, not instrument ambiguity.
The matrix ran 12 viewports with 1 product finding, 0 instrument failures, 56 executed
plus 1 product-blocked control =57, `omitted=[]`, and 0 retries. No persona or preview
evidence was produced. Preserve #206 red without retry.

Test-battery #207, run
[`31642880191`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191) /
job [`94269466117`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31642880191/job/94269466117),
completed attempt 1 without retry at exact pushed
`ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
`8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. Every prior gate,
`smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed because
the valid release witness was observed between ordered `release-started` and
`release-complete`; release itself was healthy. The report retained 0 product findings,
1 instrument failure, 57 planned/listed controls, `blocked=[]`, `omitted=[]`, 0 retries,
and no persona/preview output. Preserve #207 red without retry.

The earlier dirty #207 diagnostic (report
`805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) is retained
for chronology only. Immutable executable source
`6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the sequential exact clean battery
at status/snapshot `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` /
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`. A first
sandboxed Edge launch SIGABRTed before CDP; the same preflight invocation passed when
permitted with only Edge 151/pin-150 drift, an environment launch refusal rather than a
product retry. Root gates and `exact-6554b2b-root-layout` 787/787 across 10/10 passed
in 75,532 ms (report `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`).
V2 passed 273/1 plus all static/art/coverage gates. One-attempt smoke passed 0 findings /
10 screenshots in 105,430 ms (report
`139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844`; log
`76a40b9bd8f88dd5f5ebdc09271c0ed289478795d6cd011338df349438ef62b8`).
Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact ordinal tail 6/7/8 on
every row, `blocked=[]`, `omitted=[]`, and 0 findings/instrument failures/retries (report
`a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`); reloads
were 171–260 ms. Tablet-portrait was 196 ms with commands 2/1/1/7/0 and ready
`performanceNow` 166.3 ms. Exact 8K was 197 ms with commands 1/1/0/7/0,
release→commit 34 ms, commit→ready 131 ms, ready `performanceNow` 163.6 ms,
2,365×1,330 outgoing twins →1×1, and replacement 6,290,900 pixels combined. Nine
automated-only personas passed (JSON
`fc8d6da1e0b18d824b5403121e87b02ee9423d9592f3221d2ff1819d20629e05`; Markdown
`08328ed2c760b722caa9f76259fe22a8dfcf1e36624086d388e19628774eb176`), plus
terminal-only 635/717/77/151 ms performance. Preview
`dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151 over loopback,
bound to the expected separate development origin, with `publishable:false`: manifest
`98a64b750d1def5c7895cbd780a35558863f000c5a3fbcf4c3945dd927d5ce04`, content
`04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`, tree
`986116980e7b7a224f210508b4872b5d7f5621ac`, registry
`8a290b25fc8ff27ca7f23f00367121a78a5e8af0`, and lock
`b81617792187b3e76c7f1586ed311d540f1451acadb85c369ffcd2c4571229cb`.
That immutable source remains prior #207 executable evidence; live Git/PR state determines
the current tip, upstream, and checks, and the selected pushed tip needs matching CI. No host, human,
Ready, merge, release, deploy, or version authority follows.

Test-battery #208, run
[`31649176954`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954) /
job [`94289516851`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31649176954/job/94289516851),
completed attempt 1 without retry at exact pushed head
`ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
and branch-flow run `31649175614` / job `94289512873` passed. Steps 1–15 and
`smoke:ci` passed. Desktop-8k alone then reported
`REPLACEMENT_UNANSWERABLE_AFTER_READY`: the valid 2,365×1,330 replacement pair
scheduled ready at browser performance 584.3 ms but emitted at 3,143.8 ms, a
2,559.5 ms main-thread gap. Exact target cycle 1 timed out at 2,003 ms against the
unchanged strict 2,000 ms bound while `Browser.getVersion` answered in 1 ms; no
fatal event occurred. All 12 rows ran, the first 11 passed, and the report records
1 product finding, 0 instrument failures, 57 planned controls with
`ultra-same-backing-resize` product-blocked, `omitted=[]`, 0 retries, and no
persona/preview output. Preserve #208 red without retry.

The fixed deterministic repair preserves native UHD and caps each simultaneous
full-viewport canvas above 8,388,608 CSS pixels at 2,073,600 pixels /4,147,200
aggregate. Exact 8K DPR 0.25 and 5K DPR 0.375 therefore both produce
1,920×1,080 stores. The two-second target, heartbeat, ready, ticker, resize,
pointer, and zero-retry contracts stay unchanged. Literal new-shape positives and
former 2,365×1,330 plus existing 2,730×1,536 ready/release negatives prevent an
old policy from passing.

The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
`307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed from committed clean bytes
(status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`). Root layout
passed 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`);
v2 passed 273/1 plus all gates; one-attempt smoke passed 0/10 in 105,339 ms
(`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
`fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`).
Glass passed 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 tails,
five-command ledgers, `blocked=[]`, `omitted=[]`, and zero findings/instrument failures/
retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`).
Exact 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms,
33/129 ms release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels
at DPR 0.25; terminal-only performance was 606/685/74/171 ms. Automated persona
JSON/Markdown hashes are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
`fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`.
Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
under Edge 151 over loopback, bound to expected separate origin
`https://dev-celestialfrontier.github.io`, with `publishable:false`; manifest/content/tree
hashes are `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
`5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
`5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR state determines current
tip/upstream/checks; the selected pushed tip requires matching CI. No host, human, Ready,
merge, release, deploy, or version authority follows.

Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
remains prior exact #206 executable evidence (clean status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`; snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`). Root
preflight warned Edge 151 vs pin 150; validate/smoke and exact layout 787/787 across
10/10 passed (`d0d9a9b3c58f996e5fb7b10f21aa98c974272531f10ccdb945cd026942429252`),
as did v2 273/1 plus all gates. One-attempt slice smoke passed 0 findings/10
screenshots in 105,217 ms (`b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474`;
log `538f4a36919cd947e7631f4eb786acbcd3a6e356ce55719843c8080004295087`).
Certifying glass passed 12/12, 57/57, `blocked=[]`, `omitted=[]`, zero findings/
instrument failures/retries in 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`),
reload range 175–203 ms. Exact 8K was 203 ms / `performanceNow` 158.2 ms, phases
2/11/33/127 ms, targets 1/10 ms, heartbeats 0/0 ms; 2,365×1,330 outgoing stores
collapsed to 1×1 and replacement remained 6,290,900 pixels combined. Nine
automated-only personas passed (JSON `c10c9e33542ed57b4c51683c0ddf3f1bbc468696a025e88ef2d1e500209581bc`;
Markdown `1c9961515028a716ba064ca32ea9dd3ef2d41118cfde4c76b24c16520daa2d14`),
plus terminal-only 581/659/73/152 ms performance. Exact preview
`dev-preview-exact-df1c28b-20260812T211642Z` was browser-smoked under Edge 151 over
loopback, bound to the expected separate dev origin, with `publishable:false`: manifest
`758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`,
37 files /10,186,537 bytes, content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`,
tree `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. That source remains prior #206
evidence; both it and clean `6554b2b` remain prior evidence, while clean `307b8aaf`
is the current local #208 executable evidence. No
host/human/Ready/merge/release/deploy/version authority follows.

Human development playtests use an exact commit-bound package at the separately isolated
`https://dev-celestialfrontier.github.io/` origin only after a distinct authorized promotion.
`npm run preview:package -- --origin=https://dev-celestialfrontier.github.io`
builds from an isolated `git archive` snapshot of exact HEAD and binds the shared
v2.0 identity, `develop-<short-commit>` build, full commit, source tree, dependency
lock, external content-registry blob, expected origin, storage contract, and byte
inventory in `preview.json` plus `version.json`. Runtime origin refusal,
`noindex` and a disallowing `robots.txt` remain mandatory. The visible identity
appears inside the Guide as v2.0 development plus the full source commit; preview
verification and browser smoke reject either historical corner-badge id/style.

The default artifact remains `publishable:false` and loopback-only. Automatic post-green
publication is parked by the Actions budget gate. Any future publisher must verify and
browser-smoke one approved exact-commit candidate, then mirror only that package to the separate
development repository; it never rebuilds or wraps the legacy root HTML. Production paths and same-origin project
paths are rejected because they would share browser storage. Package verification and
publication do not replace human play: record URL, full commit, manifest content hash,
device/browser lens, starting save, findings, and retest using
[`../DEVELOPMENT_PREVIEW.md`](../DEVELOPMENT_PREVIEW.md) and
[`../playtests/PLAYTEST_TEMPLATE.md`](../playtests/PLAYTEST_TEMPLATE.md).
Automated personas are evidence, not a human playtest. Resolve current Git, PR, and
check state live; this reference intentionally carries no “latest tip is green” claim.

Highest-priority active v2 work is one exact-head local battery for the activated Compendium ruler,
without widening D-TRAIN-1's eleven-field boundary.
Exact-89 remains a shutdown instrument red.
Candidate20 reached 78/78 and clean lifecycle on `c49e525…`, but its reused `.86`-named app reported
Edge `.93`; quarantine `175fac5e…` / `916dd12a…` / `7462144b…`. Candidate21/22/23 plus paired
baseline9 are individually clean exact-.86 diagnostic history but cannot cross the corrected
contract because fresh path/UA provenance legitimately differs. Corrected contract `e7dfea1d…`
establishes measurement `2318f57b…`; producer `d3223177…` and browser CDP `6da9e2ef…` remain
unchanged. Clean exact `fb321f2…` candidate24/25/26 plus paired baseline10 historically activated budget/test
`70145575…` / `0fa2e89d…` with 3/3 samples per profile, measured 1/1 baseline, strict ceilings, and
14 phone / 13 desktop breaches. Focused activation is 13/13 after matching synthetic desktop
identities fixed its initial phone-only control without changing browser evidence. Exact head
`731b2e2…` passed locally; corresponding run `32420327368` stopped at the hosted 40-minute
Compendium job ceiling with RUNNING/lifecycle-pending evidence and no product verdict, while GitHub
also reported the account spending limit. Do not rerun, push, label, dispatch, merge, or publish
while `GITHUB_ACTIONS_BUDGET.md` is `FROZEN`. Diagnose locally, preserve first red, and return to
Arc 1B/gameplay only after fresh activation, exact-head proof, and one later explicitly
budget-authorized exact head are terminal-green.
After that, decide and preserve hybrid parent identity in CFB codes;
finish the remaining legacy Field Training arc and keep the canonical Guide's
current-safe topic bodies synchronized as systems land; add tooltip deep-links and
the Advanced Briefing surface; preserve da0's exact historical local PASS and no-retry CI red,
carry the repaired Arc 1A producer's historical ruler and ef6 certification through the D-TRAIN Smoke
setup-instrument follow-up, and complete a fresh six-image [HUMAN] review without
claiming Arc 1B; extend explicit
ownership/destruction to the remaining Pixi canvas textures and long-session
texture/audio paths; extend the current surface globe's owned tier swap into the
broader Arc 1B/1C HD texture attachment/disposal package;
persist/invalidate epoch edges and settle hidden-tab/reduced-motion policy;
then close remaining literal Gate-B boundaries and split-store/CAS persistence. PR test-merge runs
`32350971816`, `32367902426`, and `32375329693` remain the preserved timer, first Edge cold-start,
and three-instrument reds; c095's 12.5px compact-phone Glass overlap and run `32383320206`'s
Planetside answerability result are preserved product reds. Baseline5/candidate8/9/10 remain historical authority only for
producer `1c8200d7…`; baseline6/candidate11/12/13 are historical for producer `e59685b1…` and cannot
cross into measurement `6ba58522…`.
Da0's local PASS, its product CI red, 788/ef6 certifications, both repaired-producer Smoke instrument
reds, and the timer instrument red remain preserved.
Static Platinum-reviewed portraits are deliberately frozen. The next major art
ceiling is Phase 5 living rigs/animation and Phase 6's 43 biome scenes, not a
blanket repaint of the 1,250 portraits covered by the package-level PASS.

**Historical reset status (2026-08-10): ★★★ RESET R1 FROZEN · WAVE 2D 50/50 PASS/PUSHED · WAVE 2E STATIC SOURCE MERGED, REVIEW EVIDENCE BLOCKED.**
**Historical port milestone record (2026-08-01):** ★★★ PHASES 1–3 COMPLETE (automatable) · PHASE 4 SHELL RUNNING.
**Phase 4 so far — the slice wears the game's face at the GOLDEN SCREENS' exact geometry**
(floating-pill topbar: player chip + HP bar + Prime pill + trail · objective chip fed by the
Ascent chapters as pure data, landfalls BANK for real · caption + hint bottom-center · round
dock ≤900px / left+right RAILS >900px, per ROADMAP #11) — with the panel system (one-panel
law, sticky ✕, tap-empty-close, focus restoration), SETTINGS (every control a real save
field: sound/volume/charts/motion/glass tint), the COMPENDIUM (list + detail cards:
describeSpecies prose, battleStats bars in STAT_HUES, grade badge), RECORDS (counts +
journal), the SEARCH bar (CF1 code-paste TRAVEL through the charter gates, or a codex
filter), the CMB band-pick, and the Escape-order law. The smoke carries a GEOMETRY CONTRACT
(real bounding boxes vs the goldens, desktop AND phone, self-controlled) plus 15 standing
negative controls. `npm run proofsheet` bakes the art/sound verdict sheet.

## Current species-art reset (2026-08-10)

Nick reopened the entire Earth/procedural catalogue after Fruit Bat exposed a
false visual acceptance. No GP7/GP7.1 band is current certification. The live
authority and fail-closed ruler are in
`reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md`.

Reset r1 is now a complete fresh, hash-bound baseline from clean commit
`bc26e800c7adca72805a832e753ace1a8f9837ba`. The official 181-family / 233-packet
collector accepted every required native 440px, unlabeled 300px, actual unlabeled
132px, labelled old/current and exact set+species contract surface as **516 PASS /
14 POLISH / 720 FAIL**. The result lives at
`apps/game/smoke/full-reset-results-2026-08-10-r1/results.json` and is explicitly
not certification-eligible.

Wave 1 is exactly **177 reset non-PASS targets**: root 38 (2 fungi + 8 microbes +
28 procedural), fish 59, trees 48, and fauna2 32. Author-separated current review
closed every owner group PASS at 440/300/132: **177/177 scoped PASS**. The nine
source owners are `alientraits.ts`, `invertoverrides.ts`,
`proceduralfamilies.ts`, `proceduraloverrides.ts`, `speciesoverrides.ts`,
`faunaoverrides3.ts`, `florarost.ts`, `floraoverrides2.ts`, and
`faunaoverrides2.ts`. These scoped results are not a replacement 1,250-row
collector tally; do not add them to 516 and claim a catalogue score.

Wave 1 is `d005090f`; accepted Wave 2a is committed and pushed as `00e499c`.
Mammal A is **4/4 PASS** (Colugo, Sugar Glider, Fur Seal,
Sea Lion); the INVERT worms+sessile batch is **13/13 PASS**; and S1–S3 is
**15/15 PASS** after bounded R2 independently closed Caddisfly, Diving Beetle,
Firefly, and Water Beetle. Its immutable R2 recapture binds the same source hash
before A, between A/B and after B, with zero drift across 139 build inputs; all
26 rows / 156 current+repeat PNGs are hash/dimension/repeat exact. Exactly four targets changed and all
22 protected rows remain byte-identical at all three scales. Across those three
catalogue batches Wave 2a is **32/32 scoped PASS**—not a
new full-catalogue tally.

Vanilla Orchid r6 is independently judged continuity PASS at
`floraoverrides2.ts` SHA-256
`5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`.
The evidence root
`apps/game/smoke/hybrid-continuity-wave2-vanilla-2026-08-10-r6` validates
234/234 assets, exact source/hash/dimension records, and both browser orders.
The pure portrait remains byte-exact to
`3f6834b7f984b35186fa1c441eeb4537d3e5793d446e447b021a1e3687939a25`;
all five stages are unique and progress meaningfully from pure through the 0.22
anchor floor. `hybridcheck` now requires five exact ID+kingdom+name focused lineages spanning all four
kingdoms and rejects fourteen injected negative controls, including focused-species
substitution and Vanilla stage collapse. The prior `FAIL_BYTE_IDENTICAL_STAGES` blocker is closed. Broader
all-bloodline and full-catalogue certification remains OPEN.

Wave 2b is committed/pushed as `9c148f0` with **51/51 independently PASS**
across three non-overlapping source
lanes: Mammal B 25/25, Bird B1 21/21, and Invert I 5/5 (Banana Slug, Chiton,
Comb Jelly, Portuguese Man-of-War, Isopod). The first independent rounds failed
closed on six mammals and four birds; bounded Mammal R3 and Bird R2 closed those
exact rows. Invert's first candidate separately failed Banana Slug at 132px, and
a Banana-only refinement closed the four-tentacle/tip-eye read. Final sources are
`quadrupedoverrides.ts`
`288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE`,
`mammaloverrides.ts`
`2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA`,
`faunaoverrides.ts`
`783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10`,
`birdoverrides.ts`
`B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF`,
and `invertoverrides.ts`
`9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D`.
Current/repeat evidence and protected controls are exact. The final integrated
gates are green with all five source SHAs unchanged: typecheck/artunused pass,
speccheck is 417/0/0, overridecheck is 1,014/1,014 catalogue and 1,010/1,010
Earth routes, speciesaudit is 1,250/1,250 with zero failure/duplicate/clipping,
and targeted/full diff checks pass. The checkpoint is committed/pushed as
`9c148f0`. This scoped closure does not
replace the frozen 516/14/720 ledger.

Wave 2c is now **56/56 independently PASS**: Mammal C 13/13, Bird B2 28/28
and Invert II 15/15. Its fail-closed path was deliberate. Mammal C progressed
from 0/13 candidate-ready through 8/13 and 11/13 previews before Red Panda's
leg/body join and Tasmanian Devil's chest-band integration closed. Bird B2's
first independent shared judgment was 25 PASS /3 FAIL (Eider Duck, Rail,
Avocet), and Invert II's was 13 PASS /2 FAIL (Krill, Tadpole Shrimp). Final R2
changed only those five exact identities and the independent rejudges closed
all five.

The admissible A/B root is
`apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10`; manifest SHA-256
is `BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`.
It contains 249 rows =56 targets +193 protected controls, 747 PNG surfaces per
run and 1,494 verified physical PNGs. Current/repeat is exact on 747/747
surfaces; 579/579 protected surfaces match the shared baseline; all 168 target
surfaces changed; the final exact-five changed 15 surfaces while the other 244
rows /732 surfaces stayed exact. Three 139-file input snapshots have zero drift
and three negative controls were rejected.

Final Wave-2c source SHA-256 values are `quadrupedoverrides.ts`
`45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59`,
`mammaloverrides.ts`
`50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2`,
`faunaoverrides.ts`
`D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5`,
`birdoverrides.ts`
`C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21`
and `invertoverrides.ts`
`6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0`.
The integrated gates are green with those hashes unchanged: typecheck and
artunused pass; Vitest is 238 passed /1 skipped across 23 files; speccheck is
418/0/0; overridecheck is 1,014/1,014 live and 1,010/1,010 Earth;
speciesaudit is 1,250/1,250 with zero failure, duplicate pair or clipping;
hybridcheck passes and rejects all 11 injected failures; hybridmatrix,
speciesstrip, fullresetlayout and fullresetreview selftests pass; coveragegap is
1,010/1,010 with zero remaining; `git diff --check` passes. Wave 2c was then
committed/pushed as `dc015cf`, without opening or merging the reset PR.

Wave 2d is now **50/50 independently
PASS** across Mammal D 16/16, Bird B3 27/27, and Invert III 7/7. It failed
closed at every unresolved delivery-size cue: Mammal preview R2 reopened Fisher,
Marten, Wolverine, Sea Otter, Hyrax, and Mole; the first independent final then
reopened Civet alone for its missing pointed muzzle, and Civet-only R4 closed it.
Bird B3 progressed from 11/27 candidate-ready through an exact-16 R2 and an
exact-three Pheasant/Quetzal/Macaw R3. Invert III progressed from 5/7 through an
exact-two Camel Spider/Tarantula R2. Final judges returned 16/16, 27/27, and 7/7.

The final admissible root is
`apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10`; manifest SHA-256
is `DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`.
Its pre-edit seal is
`7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F`.
It binds 304 rows =50 targets +254 protected controls, 912 surfaces/run,
1,824 PNG hash/dimension checks, exact 912/912 current/repeat surfaces,
762/762 baseline-exact protected surfaces, and 150/150 changed target surfaces.
Civet-only R4 changed 3/3 surfaces; the other 303 rows /909 surfaces remained
exact. Three 139-file input snapshots have zero drift and four negative controls
were rejected.

Final Wave-2d sources are `faunaoverrides.ts`
`63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2`,
`birdoverrides.ts`
`48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7`,
`quadrupedoverrides.ts`
`544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1`,
`mammaloverrides.ts`
`776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E`,
and `invertoverrides.ts`
`2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677`.
The previously deferred `marsupial-c1`, Skua colour-arm, and shadowed Invert-II
option cleanups are now proven pixel-neutral by the same protected baseline.

The integrated Wave-2d report is green with those five hashes and the 139-input
aggregate unchanged: typecheck/artunused; 23-file Vitest (238 pass /1 skip);
speccheck 419/0/0 plus 5/5 selftest; coveragegap 1,010/1,010; artaudit 23
sources/0; tokencheck selftest 16/16; overridecheck 1,014/1,014 routes and
1,010/1,010 species; speciesaudit 1,250/1,250 with zero failure/duplicate/
clipping; hybridcheck with 11 negatives; hybridmatrix/speciesstrip/
fullresetlayout/fullresetreview selftests; and `git diff --check`. Wave 2d is
committed/pushed as `2ed0f28`, not a reset PR or catalogue recertification.

Wave 2e's exact 47-target static implementation (Mammal E 13 + Fauna E 21 +
Invert IV 13) is checkpoint `5db9039` and reached `develop` through merged PR #8
at `bb1a980`. Its four frozen art sources remain byte-exact. The first Mac
continuation stopped before any post-edit export or visual judgment: the
documented 288-row pre-edit union lives under ignored `apps/game/smoke/`, did
not cross Git, and has no tracked scoped-capture/reconstruction recipe. Its
recorded seal `BC424C8F…AA37` and index `2AE4FDB1…26E3` therefore cannot be
independently verified here. Recover the exact Windows evidence or explicitly
authorize a deterministic reconstruction from pre-edit `2ed0f28` that
reproduces both hashes before A/B promotion. A bounded portability seam now lets
`gp71rejudge --prepare` and `fullresetlayout --packets` resolve an exact
Chromium-family executable through `CF_BROWSER` or checked platform paths, so a
new **current-only, unreviewed** Mac catalogue export can be prepared. The same
resolver reaches `fullresetreview` through its imported packet compositor, but
that does not unlock Wave 2e A/B because the scoped old evidence is still
absent. `speciesstrip`, `speciesaudit`, and `hybridblendcheck` remain separately
Windows-bound. Historical Windows passes are not fresh Mac results.

The separate `overridecheck` blocker is closed: pinned Rolldown 1.2.1/Oxc parses
each complete TypeScript art source as an AST, and only literal string
property/array nodes become route keys. Every such key is validated regardless
of length or alphabet, and malformed CANON keys cannot disappear. It still rejects genuine dead,
duplicate, shadowed, unclassified, new-file, and unwired-table defects with
exact diagnostics. Controls prove inline/ternary values stay out and later
routes survive template/regex, control-head/member-call, Unicode-identifier and
ASI grammar traps. Full-source declaration traversal covers parenthesized,
annotated, comment-separated and later `const` declarators; post-declaration
writes/aliases and malformed route-table source exit 2. Painter values must be
statically callable (and quadruped specs objects) through immutable, unwritten exact
local/import bindings; supported factories must return a direct callable expression.
Neither `null!`, mutable aliases, nor truthy objects count as painters. Its harness refuses
concurrent source overwrite and measures wiring only from supported route-selection
initializer AST shapes, their exact precedence and executable guard/call/fallback/furniture
consumer chains, and the returned-canvas `fitInk` path inside parsed `resolveOverride`;
the catalog denominator is an exact four-kingdom `_EARTH_NAMES` AST plus its pinned read-only
consumer, so quote style or later mutation cannot hide roster entries. Disconnected consumers,
always-false predicates, discarded/inert syntax, and later `OVERRIDE_COUNT` mentions cannot
mask a disconnected table. Computed route members/methods outside exact audited consumer
nodes fail closed. Recursive `.ts`/`.mts`/`.cts`/`.tsx` discovery rejects untracked executable
sources/imports/re-exports, and normalized full-path import plus actual-export ownership prevents
nested same-basename or same-file export impersonation. Shadow direction follows exact resolver
precedence, and helper parameter/reassignment/implementation drift, direct trusted-global escape,
and incomplete kingdom-qualified route coverage fail. The static sentinel assumes standard
unmodified platform intrinsics and approved dependency implementations; it is not a hostile-runtime
sandbox, dependency-integrity proof, or visual verdict.
Independent post-edit provenance and resolver/compositor reviews returned PASS.
Static gates remain green:
1,014/1,014 routes, 1,010/1,010 species, typecheck/artunused, 23-file Vitest
(238 pass /1 skip), speccheck 454/0/0, coveragegap 1,010/1,010, artaudit 23/0,
and `git diff --check`. No Wave 2e art PASS, full tally, certification package,
release, or deployment is claimed.

The first live hybrid-matrix attempt exposed a real schema-v2 harness contract
bug, not transient provenance or an art verdict: it required both Green Algae
route owners to be current catalogue members even though D-CAT-1 keeps only the
flora identity in the live roster and retains `microbe|Green Algae` solely for
old-save compatibility. Schema v3 repairs that provenance model, records current
catalogue ownership separately from the retained legacy route, and
negative-controls relabelling. Its sentinels are green; both stable browser
orders validated all 234/234 assets.

The Wave-1 stale cleanup also established a routing rule: a whole-form named
painter owns one early-return path; required details behind that return are inert,
and a second same-target overlay risks seams. Prove the winning route before
editing or deleting. The flora cleanup made `strictSignature` and
`resetTreeSignature` mutually exclusive for 39 overlapping names and removed
unreachable orchard/citrus alternatives with **0/174** tree-surface drift at
440/300/132 and **0/332** Earth-flora native drift.

Literal completion still means a new clean 1,250-row collection containing only
fresh PASS, with zero carried verdicts, POLISH, or FAIL. No final certification,
certification image-inclusive ZIP, reset PR, release, or deployment exists.

## Historical GP7/GP7.1 evidence (not the reset score)

The current renderer covers all **1,250** catalogue identities (631 fauna, 332 flora,
27 fungi, 20 microbes, 240 procedural). **GP7 is the frozen baseline; GP7.1 was the
subsequent remediation pass before the full reset superseded it.** GP7 measured **503 changed rows / 95 strips**
(165 PASS, 37 POLISH, 301 FAIL) plus **62 unchanged controls / 39 strips** (11 PASS,
4 POLISH, 47 FAIL). The procedural correction subset is **57/57 PASS**. The paired control
shows the new ruler is materially harsher on unchanged art: eligible-row demotions are
38.8% for drift versus 65.6% for control (−26.8 points). Therefore the carried full-catalogue
merge — 217 PASS / 415 POLISH / 618 FAIL — is inventory state across mixed rulers, **not a
catalogue score**. GP7 is frozen as evidence; GP7.1 permitted named fixes only and never a global
body pass. Its historical fresh-PASS contract is recorded in
`reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md`.

GP7.1 completed its **first all-fresh review baseline**: 1,250 then-current
440x440 portraits and 196 hash-bound packets, independently collected as
**318 FAIL / 301 POLISH / 631 PASS**, with zero carried rows. It was an honest
repair baseline, not a completion claim; its 619 non-PASS rows remain historical
diagnostic evidence and are not the reset's carried work queue.

The first post-baseline r2 delta pass independently reviewed all 362 changed
pixels: fauna 46 PASS / 42 POLISH / 10 FAIL (98), flora+fungi 56 / 62 / 49
(167), and procedural 76 / 21 / 0 (97). The remaining 888 portraits retained
their exact baseline bytes. This is progress evidence only, not a replacement
1,250-row ledger. The second narrow repair pass was captured as r3 (1,250
portraits / 196 packets); it differs from r2 in 106 hashes and deliberately
has no verdict ledger. It was awaiting independent review when the full reset
superseded that sequence; it remains historical evidence, not the next live
input or a route to certification.

The GP7/GP7.1 review/export workflow is fail-closed and runs from this directory:

Shared CDP command timeouts now own one immutable monotonic deadline: an early timer callback
re-arms only the remaining interval, and only a clock at/after the deadline may reject. This is the
bounded instrument repair for run `32350971816` / job `96369841133`, where a 2,000 ms command timer
fired at `1999.758726` ms while its target was still timely and the root heartbeat completed in
`7.410808` ms. It does not raise a cap or retry. Because the launcher is a Compendium measurement
input, browser-CDP SHA-256 `36a832bc…` moves authority to `f9710bdf…`. Historical budget `a41ff08b…`
first failed closed; exact baseline5 plus candidate8/9/10 historically activated budget `8ffd0d8e…`
for producer `1c8200d7…`. The compact Planetside stack repair changes producer to `e59685b1…`, so
clean baseline6/candidate11/12/13 historically activated budget `ebe5b5c3…` for that exact producer.
Run `32367902426` then stopped the first real Edge selftest launch before `Browser.getVersion`: the
endpoint consumed `23657.701415` ms and only `6342.262417` ms remained of its 30-second startup
deadline. The one-launch repair gives only that cold caller a 45-second startup cap while retaining
15-second socket, 1.5-second command, 2-second shutdown, 15-second generic/candidate startup, and
2-second product-observation bounds. Launcher `6892dea6…` changes measurement to `6ba58522…`, so
then-active browser-free budget/test `bb4da2bf0b…` / `d242705ad9…` bound producer `e59685b1…`.
Exact-c49 corresponding run `32375329693` then preserved three distinct no-retry instrument reds:
root Chrome had no endpoint at its 30-second first-launch bound; exact Edge opened under 45 seconds
but the generic selftest's 1.5-second `Runtime.enable` expired before Compendium; and Smoke's
immediate detail read retained only `src length 0`, not enough state to adjudicate the asynchronous
440px owner before Back released it. The bounded repair gives root layout an explicit 45/15/30/5-
second caller contract, moves the Edge-only live proof to
`tools/compendiummem-browser-preflight.mjs` with 45/15/sealed-5/2-second bounds while leaving the
hashed launcher and ruler unchanged, and makes Smoke await semantic 440px detail publication under
one 30-second deadline. Exact-139's complete local battery then reached run `32383320206`, which
preserved a valid no-retry Planetside `product-unanswerable` result. The bounded product repair starts
the globe at displayed demand and preserves 512/768/1024 sharpness upgrades through an exact
generation/world owner. It changed producer to `d3223177…` under historical measurement `6ba58522…`;
clean source `75a996af…` supplied baseline8 plus independent candidate17/18/19, and then-active
budget/test `74e88c2b…` / `485be9da…` preserved strict discrimination. Activation was browser-free,
not certification. Exact activation head `96464d5…` subsequently passed its complete local battery,
but run `32394244417` stopped before product on image `ubuntu24/20260816.277`: verified resident .86
made apt a no-op and the one live Edge launch produced no CDP endpoint inside 45 seconds. Historical
exact-Edge evidence is 4/4 ready on `20260810.271` when apt unpacked .86 over .78, versus 0/3 ready
on `20260816.277` when .86 was already resident and apt did no package work. Both workflows now
request `--reinstall`; a green static preflight-selftest control owns that exact ordered change.
Exact local `89bfa05…` subsequently reached 78/78 and six PNGs, then owned shutdown exited 2 after
premature PASS/report verification. Clean `c49e525…` candidate20 later reached 78/78 and complete
lifecycle on self-updated Edge `.93`; its report/sample/log remain quarantined. Candidate21/22/23
plus paired baseline9 then completed once each without retry under exact `.86` and complete
lifecycle; candidates replayed 78/78 with zero findings and baseline9 retained all four faults.
Their fresh path/UA provenance exposed the old shared-identity error, so these individually clean
diagnostics cannot cross corrected contract `e7dfea1d…`. Clean exact `fb321f2…` candidate24/25/26
plus paired baseline10 ran once each with zero retries and distinct fresh `.86` paths. Active
budget/test `70145575…` / `0fa2e89d…` embed 3/3 samples per profile, measured 1/1 baseline, strict
ceilings, and 14 phone / 13 desktop breaches under measurement `2318f57b…`, producer `d3223177…`,
and browser CDP `6da9e2ef…`. Focused activation is 13/13 after matching synthetic desktop identities
fixed the initial 12/13 control without changing browser evidence. Exact `731b2e2…` passed locally;
hosted run `32420327368` was consumed at its 40-minute lifecycle-pending ceiling with no product
verdict. PR #32 remains blocked under the frozen efficiency gate. No timing, retry, fallback,
product, launch-argument, or producer drift occurred.

| Tool | Role |
|---|---|
| Root `npm run trainingcheckpoint` / `npm run trainingcheckpoint:capture` | Replays the action-derived v1.8.9 Restart Training path and exact-compares the sealed fixture plus its provenance hashes. Capture prints a candidate and never writes the sealed fixture. The separate `packages/persistence/test/training-checkpoint.test.ts` owns the exact eleven-key classifier, rescued `tut:1`, round-trip, refusal, bounds, and synthetic-unknown controls. This is jsdom/action legacy provenance plus focused static semantics, not browser or real-save Gate-C evidence. |
| `npm run preview:selftest` / `npm run preview:package -- --origin=https://<separate-host>` / `npm run preview:verify -- --verify=<root>` / `npm run preview:smoke -- --root=<root>` | Negative-controls production/path/insecure origins, transient working-tree poison, package tampering, version/build drift, and both historical corner badges; then creates, verifies, and real-browser-boots a clean-commit package from an isolated exact-HEAD snapshot. The guarded loader, `robots.txt`, `preview.json` tree/lock/input/byte hashes, shared v2.0 version and site `version.json` must agree. The 320×568 boot opens the Guide and requires v2.0 plus the full source commit with no floating badge. The shared workspace lock prevents overlap with source-mutating controls. Preview smoke requires effective exact Chrome from its owning step, which may override a serialized job's Edge pin, or one exact job environment; missing, wrong, duplicate, previous-step-only, and command overrides reject. The final preview caller keeps its fixed bounded 30-second CDP-start allowance. Root `tools/uilayout.js`, the battery's first real browser launch, separately owns one captured 45-second startup / 15-second socket / existing 30-second command / 5-second shutdown call after run `32375329693` stopped before endpoint at 30 seconds; its selftest proves exactly one open and no unowned option. The generic launcher remains at 15 seconds. Every platform captures the exact caller options and runs a real browser outcome. On POSIX the preview selftest starts Chrome immediately but withholds its ready CDP endpoint for 16 seconds: the generic path must reject while the exact preview caller retains its full 30-second start window, reaches `Browser.getVersion`, and closes. Default output is remote-blocked; publication is currently hard parked and any future promotion requires separate exact-SHA authority. |
| `npm run smoke:ci` | Runs the authoritative real-browser `slicesmoke.mjs` exactly once, retains complete stdout/stderr in `slice-smoke.log`, and writes commit/branch/working-tree/browser/screenshot-bound `slice-smoke-report.json`. It uses browser-mouse input to hit-test both desktop rail gaps, their independent ownership-removal controls, non-Element delegated events, deliberately outside Search, and the bidirectional owned/unowned canvas close outcome. Cold Planetside settlement requires the expected 3–8 ready images with nonempty `src`, `complete`, exact 132×132 natural dimensions, and queued/active jobs zero under one immutable monotonic 30-second phase; every blocking target evaluation is clipped to that same remaining deadline and a labelled target timeout becomes one structured no-retry diagnosis. Compendium detail is a separate asynchronous 440px owner: after real keyboard open, Smoke keeps the exact logical owner mounted and polls under one immutable 30-second deadline until the connected current image is `ready`, has a nontrivial source, completes decode, and reports exact 440×440 natural dimensions. Placeholder/decode are pending; producer error, stale/disconnected owner, contradictory ready state, wrong dimensions, and exact/late receipts are terminal browser-free controls, and the last panel/image/worker/broker state accompanies failure. Its held-painter multi-target control binds each attach-derived target/session and exact document, activates/focuses/brings the judged owner forward, and requires continuous visible/focused rAF→later-task service under a fresh token before the single release or post-close settlement. Wrong target/document/service, hidden/unfocused phases, phase reversal, visibility/focus transitions, and exact/just-late receipts are controlled; post-await receipt time, rather than timer callback order, owns the deadline. A timeout retains non-null image/decode, queue, worker phase/result/error, broker, and foreground diagnostics. D-TRAIN direct-fixture setup first joins prior persistence, reproduces the unjoined stale-write race, and then requires exact primary bytes, current document/route/render/card/runnable-action/status/ticker state before it may judge one semantically observed busy refusal; missing optional-chained UI is a harness failure, not product evidence. It also advances the app-owned monotonic source by one exact epoch, drives the real `current()` → `persistView()` → raw IndexedDB → fresh reload chain, and rejects stored-base/stale-reload substitutions without claiming automatic edge persistence. `smokereport` owns one full-lifetime workspace lock and passes a validated one-child inherited lease to `slicesmoke`, retaining the lock through screenshot hashing and report finalization. A failure prints the first scoped diagnosis plus a related count; it never retries a red run. |
| `npm run glassmatrix:selftest` / `npm run glassmatrix` | Negative-controls the responsive/a11y instrument, then runs fresh Chromium ownership across 12 viewports—including an 8K stress case—and writes `glassmatrix-report.json` on pass, product failure, or instrument failure. It covers populated Training/Guide/cards/settings/import surfaces, safe areas, zoom, keyboard focus, 44px targets, contrast, reduced motion, aggregate twin-canvas DPR and boot order without retrying. The Guide carrier control requires an actual exact-one-carrier removal and rejects zero/multiple/no-op/wrong/still-rendered mutations. Short-landscape Compendium uses the left safe-height workspace while Search, dock, and Survey when open remain operable at right; hostile A++ first/middle/last/focus-pinned rows and exact clipping-ancestor diagnostics make a 48px row regression fail for its real cause. Portrait Planetside owns `planetside-portrait-band-viability` and `planetside-portrait-trail-fallback`; the product derives its lower cap from the shared bottom anchor so a 44px Survey, 72px scrollable Planetside band, and 8px gap coexist at compact-phone height. Import/reload owns `import-phase-sequence`, `replacement-ticker-quiescence`, `replacement-document-loader-token-phase`, `reload-resource-release`, and `replacement-boot-phase-sequence`: the exact import stream requires ticker-running invocation, a stopped claim/write/release, and one absolute 20-second clock before the bounded arm. A capture-scoped ordinal requires the exact release-started N → release N+1 → release-complete N+2 tail; only the valid release-first intermediate waits under that unchanged clock. Sticky receipts then require a changed-loader commit within 5 seconds, the exact 12-stage `cf-v2-boot-phase/v1` sequence, and one `cf-v2-slice-ready/v1` tail from the new session/context/generation/origin/loader/token within 20 seconds. The ticker stays false through wiring and true thereafter; browser-native `performanceNow` is strictly below the bound. Two strict at-most-2-second post-ready cycles each pair an exact-context target probe with an independent browser-process heartbeat, with cycle two awaiting a later post-render ticker turn; the import arm plus both pairs form the exact five-row command ledger. The same-backing ultra control applies that target/heartbeat discriminator to both downshift and restore, requires a later advancing ticker turn, and rejects stopped/stale ticker states. Bounded sticky failure evidence diagnoses red and separates a target-only product answerability failure from transport/instrument failure. No retry, timeout increase, or IndexedDB timeout race is used. The command owns the shared workspace lock while building/browsing. |
| `npm run compendiummem:selftest` / `npm run compendiummem` / `node tools/compendiummem.mjs --verify-run=<run-id>` | Negative-controls the browser-free Compendium instrument, performs one standalone browser run without automatic retry, and independently verifies the named report. Exact `aecf386…` adds an immutable monotonic 2,000 ms static-server close boundary: just-before succeeds; exact/late/missing/error force one connection cleanup and reject; cleanup red suppresses PASS/sample. Clean `6736ef4…` c27/baseline11/c28/c29 evidence activates budget/test `546d3a81…` / `ef06252a…` under measurement `23aacc2c…`; candidates are 78/78 with complete lifecycle, baseline11 retains four faults and 14 phone / 13 desktop breaches, and prior ceilings remain strict. The gate still owns the 1,500-row fixture, authority graph, six review PNGs, and instrument/product distinction; automation never supplies HUMAN judgment. |
| `node tools/compendiummem-browser-preflight.mjs --selftest` / `node tools/compendiummem-browser-preflight.mjs` | Owns the exact-Edge workflow's one cold authority proof without changing any hashed Compendium measurement input. One 45-second startup / 15-second socket / sealed 5-second candidate-command / 2-second shutdown launch must match the budget's product, revision, JS, protocol and selected executable, then create and attach a fresh target and enable Runtime/Page/HeapProfiler. Its evaluate return and exact-marker, same-session console event share one immutable 5-second monotonic phase; both must arrive strictly before the deadline. Portable controls accept just-before evaluate/event receipts, reject exact and just-late receipts, reject missing/wrong-marker/wrong-session events and a backward clock, and prove one open/close with cleanup and no retry. Browser/executable mismatch, command/sentinel failure, and deliberate cleanup leak are also terminal. There is no warmup, retry, fallback, alternate browser, or authority rebaseline. Both PR certification and development-preview packaging workflows run this same preflight before the Compendium selftest/candidate. The selftest also parses each workflow fail-closed: it requires one unique owned Edge-install step with the exact ordered URL, SHA, download, hash check, `apt-get install --reinstall --yes "$edge_package"`, installed-version check, executable check, and following preflight; it rejects either workflow's removal plus outside-step decoys. That browser-free control proves workflow structure, not live hosted-runner launch. Run `32394244417` stopped before product when image `ubuntu24/20260816.277`'s already-resident .86 made the prior plain install a no-op and the unchanged live launch found no endpoint; same-package reinstall remains a normalization hypothesis pending one changed-head CI. |
| `npm run persona:selftest` / `npm run persona:report` | Joins only passing slice-smoke and glass-matrix evidence with matching commit/branch and dirty-tree digest into `automated-persona-report.{json,md}`. The nine lenses are explicitly **AUTOMATED — NOT A HUMAN PLAYTEST**; comprehension, fun, physical devices, assistive technology, visual judgment, battery and heat remain human work. |
| `node tools/browserpath.mjs --print` / `--selftest` | Resolves one exact real Chromium-family executable for raw-CDP evidence tools, including root `tools/uilayout.js`; an explicit invalid `CF_BROWSER` fails closed instead of silently selecting another browser. Environment scope is process-local: a green browser in one workflow step does not pin the resolver in the next. CI therefore supplies the exact effective path in the owning step or job and resolves it before long gates. On macOS the launch boundary rejects the Codex Seatbelt environment before spawn: that sandbox denies Chromium's LaunchServices registration and otherwise produces an Edge SIGABRT before CDP. Approved out-of-sandbox browser execution remains the evidence path. |
| `node tools/browsercdp.mjs --selftest` | Uses the manifest/lock-declared `ws` transport and owns port-0 `DevToolsActivePort` startup, WebSocket opening, complete provenance, command bounds, pending-command rejection, shutdown, and validated profile cleanup. Frozen `6da9e2ef…` distinguishes direct-process `exit` from stdio-backed `close`: TERM→KILL is judged on exit, owned stderr is destroyed only after exit, and close is still required. Portable controls cover inherited-stderr exit without a signal, TERM resistance followed by successful KILL, no exit after KILL, and exit without close. Existing endpoint-stability, socket-cap, command-deadline, CONNECTING cleanup, exact/late, early-exit, one-child, and profile-cleanup controls remain. Cold/warm/generic/candidate startup, socket, command, and 2-second shutdown bounds are unchanged; there is no warmup, relaunch, retry, fallback, workflow, browser, or product-bound change. Root `tools/uilayout.js` and preflight consume this launcher; legacy `bootperf` shares only the resolver/transport. |
| `node tools/proceduralnames.mjs --selftest` | Proves the exact 240-row bridge among full, drift, and render procedural identities. |
| `node tools/rejudgecards.mjs --drift=<file> --out=<dir> [--control] [--full]` | Builds indexed drift, unchanged-control, or full-catalogue review strips and packets from the current renderer. |
| `node tools/speciesstrip.mjs "<name,...>" [out.png]` | Renders a small named Earth/procedural strip for targeted visual diagnosis; `npm run stripcheck` exercises its positive and rejection controls. |
| `node tools/gp7collect.mjs` | Validates packet completeness, schema, exact names/order, bands, and reasons before writing the canonical GP7 drift/control records. |
| `npm run gp7conformity -- --input <extracted-recheck-dir>` | Validates a 1,250-row ledger/manifest/results/index join and reports direct vs carried remediation work. `--certify` rejects every carried or non-PASS row; it guards ledger provenance and never substitutes for rendering or visual review. |
| `node tools/gp71rejudge.mjs --prepare --out=gp71-rejudge --date=2026-08-09` | Builds the separate GP7.1 all-fresh 1,250-portrait / 196-packet evidence set, with no generated verdicts. `--collect` refuses partial, stale, or misaligned packet verdicts. |
| `node tools/gp71compare.mjs --verify-only --old-root=<old> --current-root=<current> --catalogue=<current-index>` | Exact-joins two complete 1,250-image evidence roots; generation mode writes hash-bound family-organized old/current sheets to a new output directory. |
| `npm run hybridcheck` | Drives the real browser art wrapper and proves set-qualified lineage pixels across five exact ID+kingdom+name focused lineages spanning fauna/flora/fungi/microbe, Earth/alien parent orders, multi-generation cases, duplicate names, swapped-parent cache separation and deterministic repeats; fourteen injected negative controls must all be rejected. |
| `npm run hybridmatrix -- --out=<new-name-under-apps/game/smoke>` | Writes the 13-lineage × 5-stage production hybrid continuity matrix—including principal microbe lineage Amoeba—plus cards, silhouettes, 4× join crops, repeat/reload proof and reversed-parent cache controls to a new 251-asset evidence root. It deliberately reports visual continuity OPEN until independently judged. |
| `npm run fullresetlayout -- --prepare --evidence=<current-root> --out=<new-layout> --per=10 --packets --source-commit=<40-hex>` | From a clean commit-bound 1,250-image root, derives the official 181 families / 233 packets, 46 procedural plan families, exact set/species contracts and labelled/unlabeled packet evidence. `--verify` is the read-only counterpart. |
| `npm run fullresetreview -- --compare …` / `--template` / `--collect` / `--certify` | Binds each row to native 440px, unlabeled 300px, actual unlabeled 132px, labelled old/current and exact contract hashes; creates empty fresh verdicts, collects only complete matching review, and certifies only 1,250 fresh PASS. See the copy-ready sequence below. |
| `node tools/gp71package-2026-08-09.mjs ...` | Creates a separate dated GP7.1 image-inclusive ZIP only after `gp7conformity --certify` accepts the fresh ledger; it rejects legacy/overlapping targets. |
| `node tools/rejudgemerge.mjs --fresh=<file> --base=<file> --control=<file> --out=<file>` | Folds fresh drift verdicts into the carried baseline and reports paired control calibration; it will not claim a delta without control. |
| `npm run speciesexport` | Rebuilds and verifies the 1,250 native 440×440 portraits and per-set ZIPs. |
| `npm run cataloguecards` | Alias for `rejudgecards --full`; generates the family-grouped complete-catalogue contact sheets and packets. |
| `npm run gp7package` | Verifies portrait/contact coverage, records SHA-256 hashes, and assembles the dated complete-review ZIP. |
| `npm run currentreviewpackage -- --catalogue=<capture> --layout=<layout> --hybrid=<matrix> --output=</outside/repository/new.zip>` | Creates a new extracted-and-reverified **UNREVIEWED current-state** package spanning the exact 1,250 catalogue rows, official packet layout, and representative five-stage hybrid evidence. The ZIP must be outside the source repository so publishing it cannot dirty its own freshness proof. It rejects completed-verdict artifacts and completed-status/schema fields under the clean-source producer contract and never replaces the later all-PASS certification ZIP. Producer code, approved reference inputs, and platform intrinsics at the recorded clean commit are trusted; hashes are integrity checks, not authenticity signatures against coordinated malicious rewriting and resealing. |
| `npm run currentreviewpackage -- --freshness=<package.zip-or-extracted-root>` | Deep-reverifies a sealed review package and reports `FRESH_FOR_CURRENT` only while its source commit, clean checkout, package producer, Platinum ruler and exact six-field browser provenance still match the live checkout. The first mismatch reports `STALE_FOR_CURRENT`; it does not invalidate the historical artifact. |
| `npm run gliderreview -- --verify --baseline=<sealed-79ce144-capture> --current=<fresh-capture-a> --repeat=<fresh-capture-b> --source-commit=<40-hex>` | Fail-closed mechanical A/B gate for Sugar Glider, Flying Squirrel and Colugo. It requires three distinct/repeat-exact repaired portraits, exact protected bat/rodent/quadruped hashes, three independent roots, and identical six-field browser provenance; it never supplies the human art verdict. |

Nick explicitly requested a full current-generation review archive on 2026-08-10.
It is now produced from clean evidence commit `79ce144` with exactly 2,146 PNGs:
1,250 native portraits, 196 catalogue strips, 466 official layout sheets, and
234 representative hybrid assets. The ZIP is 472,304,848 bytes with SHA-256
`18080276385915e08e12c76a3413f46b5472953a7c8cca161d5be4fd6a699dc5`. Its README
and manifest say **UNREVIEWED / CURRENT-ONLY / NOT CERTIFIED**, preserve every
producer manifest/hash, and state that the missing Wave 2e pre-edit evidence
prevents old/current comparison or promotion. It is not the dated image-inclusive
certification package described below.

The independent Platinum review of that exact archive is preserved at
`reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md`
(SHA-256 `5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2`).
It correctly keeps the archive below Platinum: Sugar Glider, Flying Squirrel and
Colugo require stronger family separation; several hybrid fauna switch scaffold
too abruptly; Apple, Vanilla Orchid and Oyster Mushroom need stronger low-anchor
drift; and the matrix lacked a principal microbe lineage. The 2,146-PNG ZIP stays
sealed as the reviewed baseline. The repair contract uses hybrid schema v4,
13×5 principal stages including Amoeba, 251 hybrid assets, and an exact reviewed-
fauna route allowlist while Sea Turtle and Great White Shark remain protected.
The successor combined archive is 2,163 PNGs from clean source `03ea297`,
470,045,987 bytes at SHA-256
`ef7a6e9bb720ab6e6e1497569ade194b471ed7ab63449ee94ea5c94c57372f4b`.
Its exact external review is preserved at
`reference/Celestial_Frontier_Current_Platinum_Repair_All_Pass_Review_2026-08-11.md`
(SHA-256 `1c6c49e74270e9c69800de5b10b031aacf73a7a30937350086e97bc712823b3f`)
and returns **PASS with optional polish only / APPROVE**. The archive's generated
`CURRENT_ONLY / UNREVIEWED / NOT_CERTIFIED` fields remain immutable preparation
metadata; the review is a separate human-verdict overlay and is not the formal
1,250-row certification package described below.
Any later documentation/source commit makes `--freshness` report
`STALE_FOR_CURRENT: source commit differs`; that is an honest current-checkout state,
not corruption or retroactive invalidation of the sealed reviewed artifact.

The complete reset recapture sequence, after a bounded repair wave is committed
and the worktree is clean at a full 40-hex HEAD, is:

```powershell
node tools/gp71rejudge.mjs --prepare --out=<NEW_CURRENT_EVIDENCE> --date=2026-08-10
npm.cmd run fullresetlayout -- --prepare --evidence=<CURRENT_EVIDENCE> --out=<NEW_LAYOUT_DIR> --per=10 --packets --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --compare --layout=<LAYOUT_DIR> --old=<OLD_EVIDENCE> --current=<CURRENT_EVIDENCE> --out=<NEW_COMPARISON_DIR> --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --template --comparison=<COMPARISON_DIR> --out=<NEW_VERDICT_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
# Independent judges fill the generated templates.
npm.cmd run fullresetreview -- --collect --comparison=<COMPARISON_DIR> --verdicts=<FILLED_VERDICT_DIR> --out=<NEW_RESULTS_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
npm.cmd run fullresetreview -- --certify --comparison=<COMPARISON_DIR> --verdicts=<FILLED_VERDICT_DIR> --results=<RESULTS_DIR> --out=<NEW_CERTIFICATION_DIR> --review-date=YYYY-MM-DD --source-commit=<40_HEX_HEAD>
```

Every output directory must be new. Do not edit art while verdicts are being
written, and do not run `--certify` until collection reports 1,250 fresh PASS.

The GP7 baseline packaging sequence (`speciesexport` → `cataloguecards` → `gp7package`) completed.
The package gate accepted all review records and emitted
`apps/game/smoke/Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip`
(305,291,135 bytes; SHA-256
`47B730C0323241F8E171DC3A96D4EFD5C67FA0C3CA12333CA17EBE10540D398F`).

The Phase 1–3 record below stands as history:

**Phase 2 was** (2026-07-31): Phase 2 so far: `@cf/domain-progression` (COSMIC_EPOCH clock + harvest readiness — injected monotonic elapsed-session source (not yet a foreground-only active-play policy), so the harvestclock invariant holds by construction; bodies mirror v1.8.9) and `@cf/persistence` (§19.3 stores · repository with the CF-RR-002 recovery semantics · in-memory + IndexedDB backends; IDB's end-to-end proof lands with Phase 3's browser slice). ⚠ The reset-law test was REWRITTEN after its own negative control passed with the defect live — recover() short-circuits on a missing primary, so the vacuous assertion never saw a surviving backup; the test now drives the real resurrection scenario (reset → new corrupt write → recover must find nothing). ★★★ **PHASE 2 AUTOMATABLE SIDE COMPLETE.** importSaveV2 (11/11 parity over the 72-field surface vs real-boot fixtures; found ROADMAP 9i — string maxGen poisoning, reproduced bug-for-bug) · exportSaveV2 (doSave mirror) · **the round-trip fixed point** (stable from round two; round one moves exactly what a live doSave moves) · repository flow end-to-end (corrupt → recover → veteran survives byte-identical). Root gates: `npm run savefixtures` (9 real-boot fixtures) + `contentregistry` (validation surface). Gate C blocked solely on Nick's real save (tools/savefixtures.js takes it verbatim). **★★★ PHASE 3 IS RUNNING: the Pixi vertical slice (apps/game) drives Gate D's core loop in a real browser** — universe → Milky Way → Sol → Earth surface, painterly art via @cf/art (GalaxyArt/ThumbArt/renderer painters lifted verbatim), the game's ZOOM-DRIVEN transitions (checkTransitions semantics, camT-intent based), Renderer LOD gates (fine-star resolve layer, Sun marker at SOL_POS, baseR star sizing), painterly system view (corona/BH/NS primaries, live orbit angles, terminator, banded rings, typed moons, belt/kuiper rocks, dwarfs), pinch + cursor-anchored wheel, SURVEY-FIRST input (one tap = the describePick card + sonar ping; its explicit Enter action dives), a STREAMING universe (camera-windowed cells; the wormhole's seeded jump works, reach-clamped) with the full deep-sky population (cosmic web + captions, quasars/blazars, radio-galaxy lobes, tidal bridges, galaxy names, the charter ring/veil/fog, the OBS_R edge), **the CHARTER/ASCENT GATES live and pure** (@cf/scene/charter.ts — stage 0 Sol-only → 3 everywhere, reach by REGIONS; blocked dives toast the build that opens the ring), comets + the interstellar visitor in system view, COSMIC_EPOCH running from the injected monotonic page-residence segment (@cf/domain-progression's clock; supernova sites render epoch-anchored), the game's shipped stings via **@cf/audio** (whoosh/ping over the save's own sndOn/sfxVol; §15 voice scope stays gated behind the listening test), **and THE REAL SAVE LOOP: the slice boots through importSaveV2 and persists through exportSaveV2 over IndexedDB — nav rides the save's `view` (viewToNav ⇄ navToView through the real _sanitizeView), landings ride `land`, ordinary saves snapshot advancing current() into the compatibility-named EPOCH_BASE carrier.** `npm run smoke` (tools/slicesmoke.mjs, headless Edge/CDP) is the standing gate: the full loop + the zoom ladder with an empty-space negative control + the real-save assertions, zero console errors. See ROADMAP's Phase 3 blocks for the batch history and NEXT.

Phase 1 record:
16 test files · 161 tests · 200,000+ golden cases + the 50-probe fingerprint surface, all green from TypeScript; `npx tsc --noEmit` strict clean.

Gate B deliverables, all landed:
- **`tests/sweep.test.ts`** — the full **27-generator sweep** (was 25; see extensions) from TS in one file, with a completeness assertion that fails if the fixture gains a generator without a TS recipe.
- **`tests/nodom.test.ts`** — the no-DOM / no-nondeterminism lint over every domain source, exceptions explicit and reasoned (2: combatcore's app-coupled avatar painters; worldgen's `galaxyHaze` — ★ a layering violation in the SOURCE, canvas art inside a [domain] module, flagged for upstream relocation).
- **`@cf/domain-sessionrng`** — reviewer §2.1: replayable player outcomes. Counter-per-domain design so UI interleaving never shifts another domain's sequence; state serializes into the save/diagnostics; seed creation is explicitly the app layer's job. Wiring the 11 `Math.random()` call sites happens in Phase 2+.
- **`@cf/domain-strays`** — the domain-pure functions living outside the 14 modules: cleanName, `_r2`+where-codecs, winEstimate, STAT_KEYS+floraStat, BIOME_SETS+biomeFor, hdGenesFor, `_sanitizeSavedGenome`. Closes the remaining code-fixtures buckets (whereCodes, sanitizeSavedGenome incl. the v1.8.7 `sizePreserved` invariant ×23) and the biomeFor/hdGenesFor golden ×1k. (`hdGenesFor`'s Earth-bestiary branch needs `_earthArt` — SpeciesArt, Phase 4; recorded in the d.ts.)
- **Corpus extensions, addition-only and diff-verified** (all 25 pre-existing generators byte-identical, seeds identical): `makeNoise` ×10k (closes the module-1 recorded gap) and `crossGenome_uncorrelated` ×10k (closes the module-11 blind spot — the size-mutation branch is finally value-pinned). Root gate `npm run goldenseeds`: PASS, 27 generators / 198,000 cases. This workspace is the
port itself; everything else under `port/` is plan, evidence, and decisions.

```
npx vitest run        # the parity suite — ~72,000 golden cases + fingerprint probes
npx tsc --noEmit      # strict typecheck (also run in apps/game for the slice)
npm run smoke         # the slice in a REAL browser — Gate D loop, zoom ladder,
                      #   charter gate, Gate-C import rehearsal, the PHONE leg
npm run proofsheet    # the art+sound verdict sheet (golden vs slice, one page)
```

Layout per `PORT_MASTER_PLAN_v4.0.md` §18: `packages/domain/<module>/`. Toolchain pinned
exact: typescript 7.0.2 · vitest 4.1.10 · @types/node. Isolated from the game's dependency
set. Root evidence dependencies are declared in `tools/deps.pinned.json`; the shared
raw-CDP launcher also declares `ws` in both root and v2 install surfaces.

## The port rule (Gate B: "preserve exact JavaScript numeric semantics")

**Function bodies are v1.8.9 source VERBATIM; only types are added.** `|0`, `Math.imul`,
`>>>`, `/4294967296` are the determinism contract. A "cleanup" that passes typecheck can
still shift every world in the universe. When in doubt, don't touch the body — the fixtures,
not the type system, are what pin behaviour.

## Two ways a module gets here

| | When | How |
|---|---|---|
| **Hand-port** | Small modules (≲100 lines) | TS directly in `src/index.ts`, bodies verbatim + annotations |
| **Lift** | Everything else | `node tools/lift.mjs <ModuleName> packages/domain/<name>/src` — byte-verbatim extraction with auto-detected imports, source line range + body sha in the header, **DO NOT EDIT** marker. Typed surface = `index.ts` + hand-written `.verbatim.d.ts` |

⚠ **Register each new package's exports in `lift.mjs`'s `REGISTRY`** — auto-import detection
depends on it, and several rows are still placeholders.

## Parity: two fixture sources, one rule

- **`tests/parity.ts`** — golden-seeds (`port/baseline-v1.8.9/golden-seeds.json`): volume.
  canon + FNV implemented from the fixture's *own documented spec*; if this file and the
  capture probe ever disagree, **the fixture wins**.
- **`tests/baseline.ts`** — the 50-probe fingerprint (`tools/baseline.json`): breadth.
  ⚠ Values are stored as **JSON strings** of the sanitized value — compare
  `canon(ours) === storedString`, never deep-equal.

Test recipes must mirror `tools/probe.js` / `tools/goldenseeds-probe.js` **exactly** — the
call shapes are part of the fixture contract.

**Negative-control every new module once**: perturb a constant → parity must fail *naming
seeds* → revert → green. This caught two lifter bugs and one false "10 passed" (a
syntax-broken test file is silently not collected — **count the test files, not the tests**).

## Module status

| # | Module | Parity | Notes |
|---|---|---|---|
| 1 | rand | 30,000 golden | makeNoise/clamp/mix not fixture-covered (recorded) |
| 2 | worldconfig | constants probe 0–6 | indices 7–9 are app-layer, later |
| 3 | naming | names probe ×7 groups | speciesName slot closed by module 8 |
| 4 | starcatalog | starClass ×10k + probe | |
| 5 | planetgen | planetParams ×10k + probe | surfaceColor pinned transitively via Descriptors |
| 6 | worldgen | systemFor ×1k + 6 probes | ⚠ `systemSol` probe **deferred**: fingerprint value encodes probe-order mutation (`_pal` cached by descriptor probes onto memoized P). Descriptors owes the replay. `slimGal` was carried here temporarily and is now relocated to descriptors (main.js:3014). |
| 7 | surveyphrases | climateBand ×1k | phrase builders pinned via planetDescriptor later |
| 8 | speciestraits | 30k golden + 3 probes + **the 9g invariant guard** | GRADE_TIERS collapse finally has a test |
| 9 | genome | 71k golden (makeGenome ×4 kingdoms, speciesGrade, sapienceTier, classifyRealm, guardianFor, describeSpecies) + 7 probes | **9g part 2**: the collapse now guarded END-TO-END through speciesGrade incl. forced apex tiers 12–14. lift.mjs REGISTRY rows for surveyphrases/speciestraits/genome filled (were placeholders) |
| 10 | encutil | independent-truth (Node Buffer b64 as second implementation + hand-computed shade values) | ⚠ no fixture samples EncUtil directly — recorded in src; b64 pinned transitively when CombatCore's codec probes land |
| 11 | genetics | crossGenome ×10k + crossGenome/evolveGenome probes + outcome invariants | ⚠ **NEW FIXTURE BLIND SPOT FOUND**: the golden recipe's consecutive parent seeds (s, s+1) collapse the mutation draw — the size-mutation branch is NEVER executed across all 10k cases (color 80% · trait 12.5% · size 0). Uniform with uncorrelated parents, so the game is fine; the corpus is not. Remedy queued for Gate B: ADD an uncorrelated-pair generator (never re-capture). Until then the invariant suite covers the branch with hashed-seed pairs |
| 12 | ecology | planetSpecies probe (⚠ VACUOUS BY CAPTURE — probe.js passes level=2 vs string levels, stored value is literally `[]` since v1.0) + outcome invariants | ⚠ salt-perturbation negative control PASSES today (measured — no value pinning until planetDescriptor ×1k lands with module 13). COSMIC_EPOCH reads 0 in the lift (= capture condition); app layer wires the real epoch in Phase 2+. ★ `biomeFor` (golden ×1k) lives at main.js:10824 OUTSIDE the 14 domain modules — slimGal-style relocation, queued for Gate B |
| 13 | descriptors | planetDescriptor + starDescriptor ×1k each (heavy) + 6 probes + **★ the systemSol REPLAY (deferred since module 6, now closed byte-for-byte)** | App hooks: `installCaptureHooks()` installs the capture-environment stand-ins (thumb stubs pinned to jsdom's `data:image/png;base64,`; planetThumb replays the `_pal` gas-palette cache; verbatim carries of `_cardFactsSet`, `_EARTH_NAMES`/`_earthNamePass` (631/334/27/22 roster), GAL_KIND — machine-extracted by `tools/lift-apphooks.mjs`). slimGal RELOCATED here from worldgen (thread closed). ★ FOUND: worldgen's `galaxiesInCell` read free `GAL_SPRITES` — empty fixture cells hid failure on an uncached ordinary generated-galaxy branch; hooked + exact real-input test added. Ecology's salt hole VERIFIED closed (0xB105 perturbation now fails 2 tests here) |
| 14 | combatcore | battleStats ×1k + 6 probes + **code-fixtures**: share/champion codes over the 23-genome adversarial corpus, normGenome hardener, cleanName | `@cf/domain-strays` founded (`tools/lift-strays.mjs`): cleanName carried verbatim (decodeCreature calls it; code-fixtures pins it). App-coupled exports (playerAvatar/statBlockHTML/…) documented as needing hooks. ⚠ whereCodes + sanitizeSavedGenome fixture buckets await the Gate B strays (encodeWhere/_sanitizeSavedGenome) — recorded in the test file |

**Then Gate B close-out:** no-DOM-imports lint · SessionRNG (reviewer §2.1) · extend the
golden corpus with a noise generator (an intended *addition*, never re-capture-to-pass) ·
full 25-generator sweep from TS.

## The port lesson worth carrying

Memoized generators make **call order observable state** — the fingerprint's `systemSol`
proves it. The TS port should either not share cached objects across callers or never
mutate them after creation.
