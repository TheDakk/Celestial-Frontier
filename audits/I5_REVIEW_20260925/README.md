# Claude's review of I5 run `20260924-i5-integrated-fb82c32cac67` (2026-09-25)

Codex's packet: `openai/mac` `audits/I5_INTEGRATED_20260924/` (signed `993e4c1b`). INSTRUMENT-FAIL before measurement:
*"built index/owner/worker/painter does not match the Compendium calibration authority"* (budget producer `bd8edd1b…`, built `f8f1aab6…`).

## 1. The refusal is correct, and expected

All five producer inputs changed between the budget's calibration and the integrated head (budget vs Codex's `summary.json`):

| input | changed by |
|---|---|
| `index.html` | every bundle hash it references (any app change) |
| owner `tame-greeting-audio-*.js` | Chronicle pacer, battle2 wiring and the voice library reach it |
| worker / painter `species-art.worker-*.js` | the painted card source and stand-ins in the art loader |
| `service-worker.js` | Codex's first-use arena lane (`1e9f5920`) and every asset change |

These are intended product changes. Nothing was rebound, and nothing should be.

## 2. The gate as designed can never pass again after any product change

Certification requires the built producer to EQUAL the budget's. `--calibrate` is refused while the measured budget is `active`. The
index and service worker hash every bundle, so any change to the app moves the producer. The measured budget is therefore
single-use: PR #43, and every later PR, will stop at this step. Retrying cannot help, and hand-editing the budget is forbidden.

## 3. A real regression the certificate would have caught, now fixed (Claude)

The painted stand-ins (`8b8ac188`) made most Compendium rows use a painted archetype. `PaintedCardSource` kept every decoded archetype
resident, each a ≤512² master plus its label map (~2 MiB). Scrolling a large Compendium could hold all 13 at once: measured over 20 MiB
in the test's unbounded control, against a phone aggregate ceiling of 17 MiB. It is now an LRU of `ARCHETYPE_RESIDENT_DEFAULT` = 2
(≤4 MiB); an evicted archetype re-reads to byte-identical cards. `painted-card-source.test.ts` MEMORY test, with the unbounded control.
`residentArchetypes()` reports count and bytes for the instrument.

## 4. Recommendation: one explicit recalibration epoch (Codex's instrument, Nick's authorization)

1. Keep `compendium-memory-v1.json` and all its samples untouched as history.
2. Add `compendium-memory-v2.json`, calibrated once (the instrument's existing calibration discipline: independent samples, no retry)
   on the exact integrated head that carries §3's bound.
3. **Growth guard:** a v2 ceiling may not exceed the v1 ceiling by more than a declared allowance per counter (for example the painted
   card's measured share). A calibration over it is a regression to fix, not a ceiling to absorb.
4. Then certify v2 once on that same head.

Nick authorizes the epoch; Codex changes the instrument (a v2 budget path and the growth guard). Claude supplies the painted-card counters.
