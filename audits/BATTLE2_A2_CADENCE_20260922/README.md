# E1 on the A2 cadence stage — 2026-09-22 (Nick: decision A2; built at `df1c987e`, sign fix `6c37f8a8`)

The battle stage now walks an attacker's approach in whole gait cycles (≤ 900 ms) with stance feet planted in the
arena (the stage passes the forward body-length displacement per tick to Codex's solver, d8787235), and the attack's
own lunge covers the remaining run-up by impact. Native films (Edge over CDP, `tools/battle2-proof/native-runner.mjs`):

| Film | Attacker | Approach | Attacks | Refusals | CPU p95 | Verdict |
|---|---|---|---|---|---|---|
| `civet-vs-crab-01` | Civet (compat solver, no cadence — legacy eased run-up) | 357 ms | bite (jaw) ×2, claw dodge | 0 / 0 | 3.90 ms | DIAGNOSTIC_PASS |
| `crab-attacks-civet-01` | Crab from the right (cadence, 2 cycles) | 840 ms | pinch ×3 | **0 / 7** | 3.90 ms | FAIL — retained: the displacement was world-signed; the solver recedes in body space (forward = +x for either facing) |
| `crab-attacks-civet-02` | Crab from the right (cadence, 2 cycles, forward body lengths) | 840 ms | pinch (clawNearDactylTip) ×3 | **0 / 0** | 3.40 ms | **DIAGNOSTIC_PASS** |

What the passing crab film shows for the eye: two whole scuttle cycles with the near feet fixed on the ground while
the body advances (`a2-cadence.test.ts` asserts < 0.5 px per stance window on the real stage from both sides),
then the pinch lunge arriving at impact. The measured stance reach of this rig set the per-cycle travel (crab-fits-03
crab 0.264 body lengths per stance; Codex's delivered crab fit measures its own at load). The Civet keeps the
legacy run-up until its rig moves to the family solver (Codex's R3 quadruped path). Impact stills are bleached by
the hit flash by design.
