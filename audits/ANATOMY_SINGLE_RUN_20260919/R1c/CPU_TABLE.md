# R1c CPU attribution — controlled measurement, not acceptance

Node26.9.0, signed producer416b020e; 69 fresh-page trials on one isolated browser.
Three current-configuration repeats per subject; no variance-floor IQR spans0.7–1.9ms.
All three subjects therefore completed the planned20 factorial trials. No retry.

| Subject / action | Rows-first declared | Presentation-first declared | Rows-first legacy | Presentation-first legacy |
| --- | --- | --- | --- | --- |
| persimmon-04 / sway | 2.30 [2.20, 2.30] | 2.20 [2.20, 2.20] | 2.20 [2.20, 2.20] | 2.10 [2.10, 2.10] |
| persimmon-04 / disturb | 3.10 [3.10, 3.10] | 2.50 [2.40, 2.50] | 3.00 [2.90, 3.00] | 2.40 [2.40, 2.50] |
| persimmon-04 / harvest | 4.90 [4.80, 4.90] | 4.60 [4.60, 4.60] | 2.20 [2.20, 2.20] | 2.20 [2.20, 2.20] |
| persimmon-04 / grow | 2.30 [2.30, 2.30] | 2.30 [2.30, 2.30] | 2.20 [2.20, 2.20] | 2.20 [2.20, 2.20] |
| cranberry-07 / sway | 2.00 [1.90, 2.00] | 1.80 [1.80, 1.80] | 0.90 [0.80, 0.90] | 0.70 [0.70, 0.70] |
| cranberry-07 / disturb | 3.20 [3.20, 3.20] | 3.10 [3.10, 3.10] | 1.90 [1.90, 1.90] | 1.90 [1.90, 1.90] |
| cranberry-07 / harvest | 1.90 [1.90, 1.90] | 1.80 [1.80, 1.90] | 1.80 [1.70, 1.80] | 1.80 [1.80, 1.80] |
| cranberry-07 / grow | 1.80 [1.80, 1.80] | 1.80 [1.80, 1.80] | 0.80 [0.80, 0.80] | 0.80 [0.70, 0.80] |
| devils-club-06 / sway | 2.50 [2.50, 2.50] | 2.10 [2.10, 2.10] | 2.40 [2.30, 2.50] | 2.10 [2.10, 2.10] |
| devils-club-06 / disturb | 4.20 [4.20, 4.20] | 4.20 [4.10, 4.20] | 3.50 [3.50, 3.50] | 3.40 [3.40, 3.50] |
| devils-club-06 / harvest | 2.20 [2.20, 2.20] | 2.20 [2.20, 2.20] | 2.20 [2.20, 2.20] | 2.20 [2.10, 2.20] |
| devils-club-06 / grow | 2.10 [2.10, 2.10] | 2.10 [2.10, 2.10] | 2.10 [2.10, 2.10] | 2.10 [2.10, 2.10] |

Cells show median per-row p95 in ms [Q1,Q3], five repeats. Successful sampled updates
have normalPasses median/Q1/Q3 all4 in every cell; the scale change does not add iterations.
The p95 of an interrupted row is a prefix measurement, never a completed-clip PASS.

Declared vs legacy scale has a1.1ms sway effect and1.3ms disturb effect for cold Cranberry;
both exceed within-cell IQR. Warm-up order reduces its declared sway by0.2ms; scale carries
most of the observed sway difference in this experiment. Persimmon harvest differs by2.7ms
cold /2.4ms warm across scales; disturbance warm-up changes0.6ms. Devil’s Club disturb
differs by0.7–0.8ms across scales. Smaller effects at or below IQR remain unattributed.
These contrasts describe this experiment, not a reconstruction of every historical machine state.

Leaf reds remain: Persimmon folds; declared disturb CPU exceeds2ms for all three plants;
other rows and cells have their exact statuses in the raw trial files. No production setting changed.

Every contrast with its IQR discriminator: [contrasts.json](contrasts.json).
All trials, browser provenance and source hashes: [CPU report](cpu-01/report.json).
