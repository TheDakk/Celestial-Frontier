# Quadruped remainder islands — C107, 2026-09-27 (Claude)

This is the same mechanism as `audits/BIRD_ISLANDS_20260927`, now on four-legged animals.
- In the head-down late idle (`turn3-hit-idle-90`), slivers that no polygon claims fall to the remainder body as disconnected islands and float beside the lowered head.
- Repair: `audits/G1_AUTO_AUTHOR_20260926/remainder-islands-fit.mjs`, unchanged: exact raster, recomputed labels must equal `ownership.png`, and a 5% cap.

| subject | moved px | static | native | full-size late idle |
|---|---|---|---|---|
| Panda | 2,756 | PASS_STATIC | DIAGNOSTIC_PASS | white slivers gone: **accepted** |
| Gopher | 3,855 | PASS_STATIC | DIAGNOSTIC_PASS | floating ear outline gone: **accepted** |
| Mountain Goat | 6,070 | PASS_STATIC | DIAGNOSTIC_PASS | stray line gone: **accepted** |
| Wild Pony | refused: an island is 5.1% of the remainder | — | — | held (cap kept; not weakened) |
| Wild Ass (fallback-1 fit) | refused: an island is 8.1% | — | — | held |

The cap stays at 5%. Raising it to admit the pony and ass would be a gate change for Dakk's pass, not a routine call.
