# P1 native CPU table

Final producer 670fe8b61e98a3a614c6c50865e8cc3fef69fa24; native02, actual decoded and recorded rig.

| Action | Geometry/contact/seams/limits | Update p95 (ms) | CPU <2 ms |
|---|---|---:|---|
| idle | PASS | 0.90 | PASS |
| approach | PASS | 2.10 | RED |
| melee:pinch | PASS | 0.70 | PASS |
| hit | PASS | 1.90 | PASS |
| alert | PASS | 0.70 | PASS |
| approach:scuttle | PASS | 1.90 | PASS |
| cast | PASS | 1.80 | PASS |
| dodge | PASS | 0.70 | PASS |
| faint | PASS | 1.80 | PASS |
| victory | PASS | 1.60 | PASS |
| tame | PASS | 0.70 | PASS |
| feed | PASS | 0.70 | PASS |

Full-film rig update p95: **3.20 ms — RED**. Whole-frame CPU p95: 3.30 ms.
Native01 was the earlier mask input, retained; native02 follows only the tip ownership correction. No unchanged timing retry or threshold change.
