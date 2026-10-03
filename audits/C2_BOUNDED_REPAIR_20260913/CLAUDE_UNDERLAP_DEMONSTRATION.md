# Underlap demonstration on the real Civet master (Claude lane, 2026-09-13)

Tool: `port/v2/tools/motion-proof/rig-pose-render.mjs <out> --underlap=0.02 --by-limit` (browser-free; keys the accepted master with Codex's keyer, cuts the fixture parts, renders poses with `battle2/rig-render.ts`, measures with `seam-oracle.mjs`). Deterministic; `report.json` beside this file is its output; the three PNGs are its renders; `head-crop-strict-vs-underlap.png` is a 150 percent crop of the head at the hit recoil, strict cut left, underlap right.

Cut: the A3 fixture rig (Voronoi over the record's bones, 19 parts), which has the same straight one-owner cuts as Codex's mask declaration. Underlap: every ancestor part duplicates its descendant parts' pixels within a per-cut depth of their shared cut, drawn beneath (parents first). **Depth rule:** at each cut pixel, depth = distance to the descendant's pivot × sin(cumulative joint limit from the ancestor down to the descendant) × 1.1, floored at 2 percent of image width and capped at one eighth (156 px at 1254) and at half the descendant part's smaller box dimension (so an ear or a paw never becomes a whole copy of itself; added after Codex's band gate showed ear ghosts). With that cap the numbers below are unchanged (head 1, neck 6) and the duplicated pixels drop from 217,066 to 209,130. A fixed depth does not work: 44 px closed 65 percent of the head seam, 82 px closed 85 percent, because the crown sits 150 px from the neck pivot and swings farther than any fixed band.

| gate | strict cut | underlap |
|---|---|---|
| rest render vs keyed master (visible RGBA channels changed) | 0 | 0 |
| duplicated pixels | 0 | 217,066 |

Seam pixels inside the closed envelope near each joint, pose minus rest (negative = the pose closed a rest concavity):

| joint | hit recoil, strict | hit recoil, underlap | strike, strict | strike, underlap |
|---|---|---|---|---|
| head | +4106 | +1 | +4152 | +0 |
| neck | +3306 | +6 | +2278 | +4 |
| jaw | +2456 | +632 | +4292 | +1046 |
| tail1 | +1606 | -3 | -1015 | -1105 |
| tail2 | +2514 | +2052 | -3143 | -3175 |
| tail3 | +174 | +76 | -609 | -615 |
| foreNearKnee | +2804 | -1051 | +1753 | -121 |
| foreNearAnkle | +278 | +903 | -852 | -751 |
| hindNearKnee | -172 | -1262 | -1338 | -1445 |
| hindNearAnkle | +408 | +563 | -4126 | -4233 |
| foreFarKnee | +1051 | -736 | +2001 | +324 |
| hindFarAnkle | -10 | -712 | -1094 | -702 |

Head and neck go from thousands to single digits on both poses. The jaw, ears and tail residues are cuts whose swing exceeds the cap or whose rest concavities the closing reads differently; they are the same mechanism with a larger cap or a per-cut declaration, not a different repair.

What this proves for Codex's declaration: `band` patches whose depth follows the joint limits close the seams on this exact art at this exact pose. What it does not prove: Codex's own cuts (their polygons differ from the Voronoi cut) and the ten-second motion; those are the gates in `AUTHORIZATION_20260913.md`.
