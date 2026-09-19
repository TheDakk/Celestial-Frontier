# Paint-part kernel experiment — NOT ADOPTED

The compiled interpolation/orientation kernel was slower than the existing reference in the bounded Node comparison. It was never integrated into `creature-rig.ts`; the two unused development helper files were removed. The production interpolation, orientation checks, solver profile and thresholds are unchanged.

Inputs: candidate-10 bindings and records, plus `current-producer-poses-v2`. Each of the three creatures exercised all 1,201 dense and ten named poses. The candidate preserved all 90,699,056 Float32 output bytes compared against `applyPaintPart` followed by `assertPaintPartShape`. No visual or native performance acceptance follows from this experiment.

The benchmark alternated reference/candidate order, discarded 200 warm-up iterations, then retained 1,400 timings per implementation for each creature. It measured all painted parts together, excluding field generation and ARAP, using Node v26.8.2 on this Mac.

| Creature | Existing p95 ms | Candidate p95 ms |
| --- | ---: | ---: |
| Civet | 0.043542 | 0.047208 |
| Fox | 0.041000 | 0.050750 |
| Procedural | 0.011542 | 0.014375 |

These measurements identify the part kernel as a small portion of the failed native creature-update budget. They do not establish a native/browser speed ratio. No browser comparison was run.

The helper, its declarations, benchmark driver and exact generated bundle are retained as experimental source/evidence only. The driver is the script as executed, with its original temporary/worktree paths; it is not an installed command. `benchmark-report.json` contains the unrounded timings. `inventory.json` binds the retained files.
