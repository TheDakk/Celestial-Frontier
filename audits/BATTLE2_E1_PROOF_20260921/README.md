# E1 re-film on the family solver — 2026-09-21, after the R3-S → §8 re-merge (`9ee651d2`)

Two native films (Edge over CDP, `tools/battle2-proof/native-runner.mjs`, this lane's `apps/game/src`), both
DIAGNOSTIC_PASS with zero rig refusals; each folder holds `report.json`, per-turn stills and `battle-10s.webm`.

| Film | Rigs | Attacks | Refusals | CPU p95 | Frames |
|---|---|---|---|---|---|
| `civet-vs-crab-01` | Civet (candidate-10, quadruped-compat) vs Codex's delivered crab fit-01 (family solver, travel: stage) | Civet bite (jaw) ×2, claw (foreNearPaw) dodge | 0 / 0 | 3.30 ms | 602 |
| `crab-attacks-civet-01` (`crab-attacks.script.json`) | same | **Crab pinch (clawNearDactylTip) ×3** — a crab ATTACKS through the stage (E1 outcome 2, R3 landed) | 0 / 0 | 3.40 ms | 602 |

What changed since `BATTLE2_E1_PROOF_20260919`: the crab fit is Codex's accepted delivery (not `crab-fits-03`), the
parts rig forwards `travel: 'stage'` to R3's family solver and no longer labels it interim, and the crab has an
admitted pinch (brachyuran row + crustacean profile). Observed skin-weighted supports are available but OFF
(finding: joint drift up to 5.3 px under hit loading — for Codex). The third pin (stance feet planted in ARENA space
during the run-up) is still `it.fails`: under `travel: 'stage'` the solver's stance targets still advance by the
stride (the double count), so the film's run-up feet march with the body — visible in the approach stills, recorded
for Codex. Impact stills are bleached by the hit flash by design (the flash beat).
