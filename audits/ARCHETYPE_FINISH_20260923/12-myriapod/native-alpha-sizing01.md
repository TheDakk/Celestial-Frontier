# Native01 rest-sizing correction

Native01 run `20260923-centipede-native-01` failed viewport containment at ms 0 before gates/capture completed. Its left published bounds reached y=592.99060022039 in a 576-pixel frame. No native CPU measurement or film was produced.

The source painting was preserved. Its 1254×1254 keyed PNG has 178,726 pixels with alpha >0, bounded by (39,50)..(1227,1197), inclusive: 1189×1148. The native harness's old alpha >8 rest-sizing inventory contained 140,406 pixels at (41,413)..(1225,872): 1185×460. It excluded 38,320 retained nonzero-alpha pixels. The subsequent ground fit deliberately preserved that mass-derived scale; full published geometry then correctly failed the independent viewport gate.

Only the native rest-sizing inventory changed. The former inline alpha box was replaced by the pure `positiveAlphaBox` helper, which observes every positive alpha byte. Ground registration, the mass-class formula, published geometry, scale wiring, medium/viewport containment and CPU gates remain unchanged. No ground viewport cap or application battle2 source change was made.

Four synthetic helper controls passed in the first focused run: alpha 1/8 inclusion and alpha 0 exclusion, opaque legacy parity, single-corner/empty behavior, and malformed input refusal. The first real-image test failed in its own negative-control copy: decoded PNG data is a Node Buffer, whose `slice()` aliases storage. That test's simulated old threshold therefore changed its in-memory original. The failure log and exact test bytes are retained; the source PNG and helper were unchanged. The test now copies via `Uint8Array.from`, captures its original digest before calling the helper, and passed once. The four already-passing controls were not repeated.

Commands and source/input identities are in `native-alpha-tests01.sources.json` and `native-alpha-tests02.sources.json`. `native-alpha-real-01.json` retains measured counts and bounds. `native-alpha-before-01/` contains exact previous native entry/reference bytes; `native-alpha-final-source01.json` identifies the frozen entry/helper/test/reference files. The first test refusal is explained in `native-alpha-test-repair02.json`.

This establishes sizing-input correctness only. The parent owns the next native run against the changed harness; no static, S2, TypeScript or browser run was performed for this correction.
