# x64 vs arm64 float results (FINISH 2026-11-04, PR #46 hosted run 2)

Hosted run 41949386812 (ubuntu x64, Node v26.13.0) failed three byte-identity tests that pass on the arm64 Mac with the same Node
(`guardian-choreo` check 3, `creature-rig-contact-support-candidate` iterative results, `small-crustacean-attack` prior-family
timelines) plus one 5 s timeout (`soundkit-creature-voices`).

**Cause, measured:** the same Node v26.13.0 built for darwin-x64, run under Rosetta, returns a different last ulp than arm64 for about
1 % of inputs to Math.sin, cos, tan, atan, atan2, pow, exp, log, log10, asin, acos, sinh, cosh, tanh, expm1, log1p, asinh, acosh, atanh
(probe: 100 000 seeded inputs per function over five ranges). The x64 run reproduces the hosted failures exactly (guardian plan
matrix hash `c028fde5…` on both).

**Not affected:** root `tools/validate.js` under x64 Node: 50-probe FINGERPRINT MATCH, render audit clean — world generation and the
v1 determinism baseline do not depend on the architecture.

**Fix (nothing loosened):** `port/v2/apps/game/src/arch-pin.fixtures.ts`. On arm64, where every original pin was captured, each
original exact assertion runs verbatim. On x64 the output's sha256 must equal an x64 pin recorded (CF_CAPTURE_ARCH_PINS=1, refused on
arm64) from the same tree whose arm64 output equals the original pin; files `*.arch-pins.json` beside each test. A tampered x64 pin fails
naming its key; an architecture with no pin fails loudly; negative controls (`differs`) stay live on x64. Two test budgets that scale
with the library were raised (assertions unchanged): soundkit voices 60 s, art-library shard regeneration 120 s.

**How to run the battery as the hosted runner does (on this Mac):** download node-v26.13.0-darwin-x64, `npm ci` with it under
`arch -x86_64` in a scratch checkout, put the arm64-only `/Library/Developer/CommandLineTools/usr/bin/git` first on PATH (the
universal /usr/bin/git shim has no x86_64 libxcrun), then `arch -x86_64 node tools/check-profile.mjs --profile=develop`.
