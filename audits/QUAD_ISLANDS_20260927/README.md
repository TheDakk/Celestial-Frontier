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

## C114 / C118 (same rule, same cap)
| subject | moved px | static | native | full-size late idle (before → after) |
|---|---|---|---|---|
| Polar Bear (C114) | 4,006 | PASS | PASS | specks gone; one faint neck line remains: **accepted with a note** |
| Sun Bear (C114) | 2,223 | PASS | PASS | floating speck gone: **accepted** |
| Arctic Hare (C114) | 6,999 | PASS | PASS | floating black ear-tip fragments gone: **accepted** |
| Wombat (C118) | 1,997 | PASS | PASS | speck gone: **accepted** |
| Koala (C118) | 3,819 | PASS | PASS | speck gone: **accepted** |
| Horse (C114) | refused (island 7.5%) | — | — | held |
| Hummingbird (C118 painting) | refused (crown island 14.8%) | — | — | held; the same crown case as C101 |

Across C107, C114 and C118, 8 of 8 in-cap repairs removed the defect they targeted, and 5 subjects were over the cap. That makes the cap the next question for Dakk: raise it for the head-down late idle, or keep holding.
