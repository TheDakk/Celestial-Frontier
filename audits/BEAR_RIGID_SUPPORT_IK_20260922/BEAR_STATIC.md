# Observed-support bear static result

Signed solver producer `58f81e545cf7d40798bddbb0592506681c124073`; unchanged fit producer `1ff30009d9b8cda3a92d72a2ef07a36c8506d91b`. One full action-library and presentation sweep. **No painted-support iteration refusals remain.** Eighteen of twenty action rows plus presentation complete; exact rest PASS. Maximum published planted-support drift 0.249576512750 px against unchanged 0.25 px; source-join maximum 0.000070899049 px.

The two remaining refusals are independent compression limits: gallop at 180.266667 ms and tail at 247.866667 ms. Gallop is the retained original failure; tail is exposed after the repaired support iteration lets that row advance. REST mode already refused tail at that same sample. No limit, clip, threshold, raw source or binding changed. The overall full-library report correctly remains RED.

| Action | Samples | Published planted drift px | Result |
|---|---:|---:|---|
| idle | 121 | 0.247437403 | PASS |
| approach | 121 | 0.248253163 | PASS |
| melee:bite | 121 | 0.242000358 | PASS |
| alert | 121 | 0.000069906 | PASS |
| approach:walk | 121 | 0.248253163 | PASS |
| approach:trot | 121 | 0.195393367 | PASS |
| approach:gallop | 32 | 0.230651276 | Contact: approach:gallop@180.26666666666668 exceeds scale compression bound |
| approach:hop | 121 | 0.000000000 | PASS |
| melee:claw | 121 | 0.242000358 | PASS |
| melee:gore | 121 | 0.242000358 | PASS |
| melee:tail | 39 | 0.198819592 | Contact: melee:tail@247.86666666666667 exceeds scale compression bound |
| melee:headbutt | 121 | 0.242000358 | PASS |
| cast | 121 | 0.238047266 | PASS |
| hit | 121 | 0.244228740 | PASS |
| dodge | 121 | 0.000000000 | PASS |
| faint | 121 | 0.054695590 | PASS |
| victory | 121 | 0.249395237 | PASS |
| tame | 121 | 0.188795000 | PASS |
| feed | 121 | 0.062766138 | PASS |
| melee:kick | 121 | 0.000000000 | PASS |
| presentation | 601 | 0.249576513 | PASS |

Machine evidence: [bear-observed-static.json](bear-observed-static.json), [source hashes](bear-observed-static.sources.json), [log](bear-observed-static.log). No native film or CPU-tier acceptance is inferred. Claude should re-film the stage’s selected bear turn using observed supports and measure the 5 ms guardian gate on this producer.
