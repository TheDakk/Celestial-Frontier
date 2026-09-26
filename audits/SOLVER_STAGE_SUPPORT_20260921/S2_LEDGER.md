# S2 ledger

Signed producer: `cb1a667d80830d2cecd9f6c0d6b8bec9af365a80`. One run; **PASS_STATIC**. No halt.

| Subject | Max planted drift px (rows) | Exact rest | R2c′ rows |
|---|---:|---|---|
| crab | 0.000062718 | True | bit-identical |
| coconut-crab | 0.000056790 | True | bit-identical |
| freshwater-crab | 0.000031406 | True | bit-identical |
| mud-crab | 0.000381523 | True | bit-identical |
| vent-crab | 0.009359585 | True | bit-identical |
| civet | 0.165256373 | True | sentinel within bound |

Every row has 121 samples; presentation has 601 per subject. All presentation planted supports passed 0.25 px. Covariance, endpoints and seams passed. Raw samples and per-subject receipts are in `s2/`; full aggregate is `s2/static.json`.

Stage-mode gait and actual published-support access are covered by the focused producer tests. This ledger preserves default solver behavior; it is not an arena planting or CPU certification.
