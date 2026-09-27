# Bird remainder islands — 2026-09-27 (Claude)

**Defect.** Three birds were held for the same thing: a fragment floating above the back in the late idle (`turn3-hit-idle-90`). They are Hummingbird and Snow Petrel (C101) and Seabird (C106).

**Diagnosis.** It is not the far wing. A polygon fit gives every painted pixel that no polygon claims to the remainder part (`body`).
- Where two polygons leave a sliver between them, the sliver becomes a body island disconnected from the body. On Seabird and Snow Petrel this is the neck/back join; on the Hummingbird it is the crown above its head polygon.
- The island is skinned to the body. When the head dips, it stays behind and floats.
- `/private` scratch overlays showed the islands in red at exactly those places.

**Repair.** `audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs` moves each disconnected remainder island (8-connected, not the largest) to the neighbour part it shares the longest border with. It works on the exact label raster, then compiles through the unchanged `cf.keyed-part-intake/v1` path.
- Labels are recomputed from the source declaration and must equal the fit's `ownership.png`.
- Only remainder-island pixels move. An island with no painted neighbour stays.
- An island over 5% of the remainder refuses as structural.

**Results.**
| subject | moved px | static |
|---|---|---|
| Seabird (C106) | 856 (261 → far-wing-root, 161+17 → neck-lower, 197 → near-wing-flight, the rest to tail/feet) | PASS_STATIC |
| Snow Petrel (C101) | 1,497 (211 → far-wing-root, 248 → near-wing-root, …) | PASS_STATIC |
| Hummingbird (C101) | refused: the crown island is 3,118 px = 14% of the remainder (> 5%) | — (stays held) |

**Tests.** `remainder-islands.test.mjs` covers:
- a sliver goes to its longest border;
- 3-vs-1 borders;
- no neighbour means the island stays;
- a diagonal touch is connected;
- the over-cap refusal, with a looser-cap control;
- the main body is untouched.

Three mutants each fail one test: shortest border, no cap, 4-connectivity.

**Next.** Run native on both fits once Codex's I5 epoch releases the shared toolchain lock (C108 asked for no simultaneous native runs). Then do the full-size late-idle review, and only after that an opt-in `score-batch --remainder-islands`.
