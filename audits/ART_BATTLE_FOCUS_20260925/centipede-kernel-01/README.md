# C15 / C12 — exact skin-kernel optimizations and corrected profiling

Two execution optimizations are implemented, with unchanged numerical constraints, motion, accepted bindings, source pixels, iteration counts and budgets. This completes the bounded kernel/profiler repair; **C15 art coverage, new quadruped motion, picker integration and continuous real-device smoothness remain open**.

- Active orientation: skip only a shared incident triangle's repeated ordered no-op after all moved positions are final. Keep every update after an unordered priority; no deduplication across projections, no changed priority, queue order or exit budget. Prior scalar WASM and all helpers are retained under before/.
- Main ARAP pass: ordered X/Y neighbor additions execute in two independent non-relaxed SIMD lanes. No horizontal reduction or reassociation; local rotation/RHS stays scalar. Existing guarded JS fallback remains available if WASM/SIMD is unsupported. No source anatomy or acceptance gate was changed.

## What the corrected profiler found

The original breakdown combined separate Wasm modules named wasm-function[0] and associated sample[i] with delta[i+1]. It could not establish that the main cost was ONE active-orientation function. The new diagnostic keeps raw cpu-profile.json, full node mappings, module URLs and nearest mapped JS callers, and uses delta[i]. The initial bridge mapping and its correction are retained; reprocess-profile.mjs reanalyses the SAME native02 capture, without another browser run.

Native02:1621.884 ms sampled under the ARAP caller,293.748 ms under the orientation-projector caller,170.352 ms under the active wrapper, across599 frames. Module IDs separate the normal, forward and active leaves. These are sampled inclusive-capture totals attributed by immediate source caller, not isolated per-creature costs. Historical collapsed totals remain historical and are not relabelled as active-kernel measurements.

## Exact comparisons and checks

- Actual Centipede active calls: **117**, exact Float64 position/full queue/counters/return; comparator negative controls reject changed bits, signed zero and counters. Paired host totals 133.135→124.007 ms; p95 4.098→3.588 ms. This is a Node diagnostic, not native phone evidence.
- Actual Centipede normal skin passes: **8992**, exact position/target/rotation/RHS bytes, return and counters. Paired host totals 1191.803→1147.588 ms; p95 0.143→0.137 ms. No warmup exclusion or best-run selection.
- Final Centipede static:12/12 actions×121 samples plus822 presentation samples PASS; exact-rest geometry and source pixels PASS (0 changed channels).
- Six S2 subjects and13,286 support samples **byte-identical**, both after the active-only change and after the SIMD change. Fresh source per sweep; unchanged instruments and inputs. Final: s2-simd-checks/s2/identity.json.
- Kernel/unit/integration/mutant/fallback tests PASS (kernel-tests-01.log, diagnostic-tests-02.log, simd-tests-01.log). Profiler tests PASS, including first/last delta, same-name modules and native trampolines (profile-tests-03.log).
- Full final develop profile:479 passed files/1 failed/1 skipped;5,082 passed tests/1 failed/2 expected fail/2 skipped. Sole failure is historical current-producer-authorities Compendium build mismatch. Full stderr retained in develop-simd-profile.log. No v1 budget/sample rebind and no C8 attempt. Root validation PASS.

## Final-source native captures

Ten distinct pairings cover all17 currently shipped archetypes, not all136 possible unordered pairings and not the unadmitted new paintings. Each is a real10-second Edge4×CPU film with source hashes, per-turn approach/impact/reaction/return stills, raw CPU profile and zero rig refusals. One pass per pairing, sequential under shared toolchain lock. All reported CPU p95 values are below the16.666…ms work budget; recorded frame cadence is reported separately, not rounded into an uninterrupted60fps claim.

| Pair/run-directory suffix | stage CPU p95 ms | frame-delta p95 ms | live/encoded frames | refusals L/R |
| --- | ---: | ---: | ---: | --- |
| python-vs-tarantula | 3.50 | 16.70 | 602/606 | 0/0 |
| eagle-vs-beetle | 3.80 | 16.70 | 602/606 | 0/0 |
| chimpanzee-vs-centipede | 10.60 | 16.70 | 596/599 | 0/0 |
| treefrog-vs-fruitbat | 3.70 | 16.70 | 602/606 | 0/0 |
| salmon-vs-octopus | 4.60 | 16.70 | 602/606 | 0/0 |
| eagle-vs-salmon | 4.40 | 16.70 | 602/606 | 0/0 |
| crab-vs-starfish | 6.50 | 16.70 | 602/606 | 0/0 |
| civet-vs-coconut-crab | 5.70 | 16.80 | 602/606 | 0/0 |
| mud-crab-vs-vent-crab | 4.50 | 16.70 | 602/606 | 0/0 |
| freshwater-crab-vs-civet | 5.50 | 16.80 | 602/606 | 0/0 |

Run IDs are the exact directories library-phone4x-03/<pair> and remaining-phone4x-04/<pair>. Each report owns its matching battle-10s.webm and source inventory. All share the final runtime implementation, measured on working source based on signed a42f3332; they are not clean-source certificates. The report/source hashes, not this later documentation commit, identify the measured bytes.

The Centipede's profiled final capture retained596 live/599 encoded frames. A separate **unprofiled** capture native-unprofiled-05 removes the intrusive sampling profiler (changed observation, not an unchanged retry): **10.00 ms** stage CPU p95, **16.80 ms** frame-delta p95, **598/602** live/encoded frames,0/0 refusals. This remains a desktop throttled study, not an iPhone certificate or proof of zero dropped frames. Earlier active-only captures native-phone4x-01/02 stay retained at10.70/10.40 ms and do not certify final SIMD bytes.

## Visual review and open art work

kernel-review-sheet.png shows approach/return for all ten pairings; sheet-inputs.json hashes the exact images. Chimpanzee/Centipede return shows continuous contained paint. Eagle/Beetle has very little top clearance and the top bar crosses the feathers; Tree Frog's approach shows detached orange patches below the raised forefeet, requiring source/skin-owner review. Zero numeric rig refusals do not close those visual findings. Existing crab controls also retain their old flat art; no protected binding is repainted or called a newly proper painted master.

QUADRUPED_HANDOFF.md records the five new candidates' exact retained refusals and the native REST-versus-static observed-contact distinction. Those candidates stay out of the picker. Dragonfly damage-label clipping and Sturgeon ready/return snout overlap remain with Claude's stage repair.

## Hashes and paired next steps

- Final ARAP module SHA-256: 8e59150df463ec99b4c05f614651e21807e5901854bdf24bf0ad8a7ee747d967
- Final active module SHA-256: 9452561039b457a8ef05c20a26ce5a40e9915540a422faf137a6ef4ddbc65756
- Unprofiled film SHA-256: 6fc151bc72d78e591944412dcc4faefd51bda2e2da09c0287ec7249009d85da4
- Sheet SHA-256: 9f4df9a2c42eb1c18acce0fdc869287a7fac1023f4ac342fdfad462c6fbc3b61

manifest.json inventories every packet file including nested source manifests; native reports retain runtime/asset hashes, build receipts retain compiler flags and module identities, and before/ retains both pre-change kernels. No repeated unchanged full battery, no push/merge/hosted action, no threshold rise.

Codex continues the C13 pin review and the art/motion queue; the five quadrupeds and generated/Earth coverage remain unfinished. Claude consumes the signed kernel/profiler repair from shared Git, reviews QUADRUPED_HANDOFF.md and stage/Tree Frog findings, and wires only passed new candidates with picker smoke before publication. Nick reviews the retained sheets and iPhone build; no message relay required. Weekly/economy/C19/C20 and C8 remain parked.
