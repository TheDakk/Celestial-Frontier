# Exact forward orientation optimization — 2026-09-25

Completed execution optimization, **not phone-tier completion**. Original ordered arithmetic, limits, iteration budget, hard pins, refusal behavior and JS fallback stay unchanged. No accepted binding or source painting changed.

## Change

The memory-only forward WASM leaf skips a triangle only if its previous constraint evaluation passed and no vertex changed since. Private incidence flags are dirtied for every actually changed Float64 coordinate, including signed zero; all flags reset each call. Violated, degenerate and unordered constraints keep original visits. A triangle affected by a later update is reevaluated in the same ordered sweep or the following sweep exactly as before. No previous frame's geometry is reused.

The artifact verifier now admits the explicit ten-i32 signature for private incidence/scratch arguments, still one memory import, no imported functions, relocations, globals, tables or data. C source, compiler flags, WASM and embedded-byte hashes are in `orientation-forward-build.json` in the implementation directory. Prior source/artifacts are retained in `before/`.

## Exact controls and cost

-15 forward unit/integration controls PASS, including pinned/degenerate/contradictory, overflow/underflow, signed zero, repeated seeks, caller mutation, unavailable/trapping runtime and binary arithmetic mutants.
- `mutation-controls.json`: removing invalidation or per-call reset is rejected during actual-topology conformance before any caller mutation. Mutant source, binaries and compiler receipts retained.
- Cattle3,614 and Centipede2,248 real static leaf calls match prior position bytes, pass counts and stalled flags exactly. Both complete static/presentation runs pass. Host paired timings alternate old/new order and exclude audit cloning/comparison: Cattle total731.6273640000107→407.3547940000103ms; Centipede317.2849720000262→175.8174900000102ms. These are Node diagnostic totals, not frame or phone measurements.
- Measured forward private linear memory: Cattle196608→262144bytes (+65536), Centipede327680→458752 (+131072). These exclude unchanged owner/other kernels and temporary construction arrays. Memory increase is explicitly retained for future C8 accounting; no budget rebind.
- S2 six subjects/13286samples and receipts byte-identical. Original sentinel logic/inputs untouched; output routing only.
- Full develop profile5100passed/1failed/2expected failures/2skipped,482passed files/1failed/1skipped. Sole historical I5 current-producer red; later profile stages did not run. Root validate PASS. No whole-profile PASS or push eligibility.

## Full native 4× CPU films

Exact Edge153.0.4234.48. No heavy host work ran concurrently with the sequential native measurements. `native-summary.json` holds exact media/report hashes, timing distributions, counts and source scope; each film is `<run>/battle-full.webm`.

| Run | Stage CPU p95 ms | Max CPU ms | CPU frames >1000/60ms | Live/encoded | Duration ms | Refusals |
|---|---:|---:|---:|---:|---:|---|
| native-cattle-01 |14|44.800000071525574|33|911/913|15532.7|0/0|
| native-centipede-01 |8.600000023841858|56.299999952316284|5|787/790|13132.8|0/0|

Cattle uses the existing proposed layered-reach + faint-settle stage transforms from quadruped-repair04; it is NOT an unmodified-HEAD certificate. Keep that packet's passing Cattle fit02, never the rejected interior-root-repair05 Cattle. Cattle's prior changed-cache run had15ms p95/34overbudget frames; current14ms/33 shows a modest whole-stage improvement, **still not60fps**. Remaining slow frames are action4,hitstop6,impact11,idle12;19intervals≥25ms,max50ms.

Centipede versus Chimpanzee uses ordinary current source with no stage transform. Its full film now includes final faint, unlike the old10s cost study. Five over-budget frames are all approach; one49.9ms interval remains. No uninterrupted60fps or causal comparison against the shorter historical10ms-p95 film. Centipede's final faint raises its legs; no visible detached paint in the reviewed still. The25ms interval bin is a diagnostic, not an allowance. Every-pair/picker/iPhone/coverage acceptance remains open.

## Paired next steps

Codex continues motion/skin repairs and ranked art; Cattle's active-projection cost and the Centipede approach spikes remain measured performance defects. Claude consumes this exact execution optimization, retains memory deltas, reconciles proposed stage patches, verifies full travel/picker on integrated source and keeps failed candidates out. Nick reviews films/sheets and the eventual iPhone build; no relay through him. C8/I5, weekly/economy/C19/C20 remain parked. No new certificate, old-sample rebind, GitHub write, merge, release or deploy.
