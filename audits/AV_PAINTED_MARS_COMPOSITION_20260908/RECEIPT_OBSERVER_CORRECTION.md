# Receipt ordinal observer correction — 2026-09-08

The first outcome-aware phone run stopped at its new observer assertion2!==3, before any
second action or painting checks. Its read-only rows now prove an exact Mars wave-off: revision
4→5, receipt ordinal1, SessionRNG ordinal1→2, two separately counted draws, HP100→98, one
learned approach. The previous observer incorrectly incremented the receipt ordinal by the
number of random draws. Domain sessionrng/src/index.ts returns receiptOrdinal+1 per action;
draw totals remain in their own named counters. No product generation defect was observed.

The new native-composition-receipt-runner.mjs changes only this expectation and its own source
identity. It still requires both draws, the exact prior receipt/HP/world/one commit and the100%
CTA before one learned native action. Both earlier runners and their first failed reports remain
immutable; no later mode ran after either failure. Source/build and all216test results unchanged.
