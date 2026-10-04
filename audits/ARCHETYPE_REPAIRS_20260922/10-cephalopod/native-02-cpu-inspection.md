# Octopus native-02: retained CPU timing inspection

Read-only analysis of run `20260922-octopus-native-02`; no replay, test, browser, or new CPU measurement. The report, immutable binding, and phase-classification owners are hashed in `native-02-cpu-inspection.json`; binding and owner hashes match the native receipt.

The film recorded 598 live samples and 601 encoded frames, with zero left/right refusals. Whole-stage p95 was 6.299999952316284 ms; per-rig upper bounds were left 2 ms and right 5.100000023841858 ms against the unchanged 3.5 ms limit.

**The sustained right-rig cost belongs to the final faint hold.** Of 72 right samples exceeding 3.5 ms, 71 occur from 8783 through 10016.2 ms, after the faint clip ends at global 8656 ms. The preceding active faint samples have p95 2.200000047683716 ms and maximum 2.4000000953674316 ms. The hold still includes the underlying idle pose; from stage time 9376 ms onward the complete stage pose is clamped while capture continues.

The exact overall right p95 rank selects capture time 9749.5 ms: right performance/contact/publication owner 5 ms plus shared `sampleTurn` 0.10000002384185791 ms. Across the film, shared sampling p95 is 0.19999992847442627 ms, maximum 0.30000007152557373 ms. Shared sampling is not the main measured cost.

There is one isolated right dodge spike at 4633.1 ms, reaction elapsed 101.7666666666671 ms: 60.799999952316284 ms. It is not the sustained p95 driver. These aggregate owner timings do not distinguish ARAP, other publication work, allocation, collection, or scheduling; they cannot identify an expensive arm or prove a solver cause.

The immutable original binding contains 5,157 field vertices, 8,360 field triangles, and 3,075 pins (1,791 pure root). Thirty rendered parts contain 6,330 part vertices and 9,585 rendered triangles. Its solver settings remain four iterations, four global iterations, target weight 0.35.

A changed authored mesh-density candidate must retain its own admission and native evidence; this inspection predicts neither shape parity nor a CPU pass. The original binding and failed film remain intact.
