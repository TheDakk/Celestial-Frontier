# Starfish: retained arm identity and motion assumptions

Read-only inspection of the original `audits/ARCHETYPE_SPRINT_20260922/08-radial` master, authoring, declaration, fit report, and current radial owners. No solver, battery, browser, fit writer, or production edit was run.

## Definite identity mismatch

`port/v2/apps/game/src/motion/family-actions.ts:170` explicitly assigns even arms (0/2/4) to the right of the centre and odd arms (1/3/5) to the left. `radialActions` implements this by applying a positive multiplier to every even arm and a negative multiplier to every odd arm. The count-aware path retains the same parity for five arms. The graph and limits in `motion/family-templates.ts` do not infer handedness from the image.

Original manual identity is clockwise from the top: arm0 upper, arm1 upper-right, arm2 lower-right, arm3 lower-left, arm4 upper-left. Thus arm1 is definitely on the wrong side for odd parity, and arm4 is definitely on the wrong side for even parity.

The smallest consistent identity correction is **swap original arm1 and arm4**, across all three landmarks, matching part `joint` names, any semantic part IDs, and the human declaration. Keep each arm's actual coordinates and owned polygons attached to its observed physical arm. Keep arm0, arm2, and arm3 unchanged. The source requires parity, not a unique angular order among same-parity arms; another within-side permutation is not established as necessary.

| Original physical arm | Original ID | Minimal corrected ID |
| --- | --- | --- |
| Upper | arm0 | arm0 |
| Upper-right | arm1 | arm4 |
| Lower-right | arm2 | arm2 |
| Lower-left | arm3 | arm3 |
| Upper-left | arm4 | arm1 |

This fixes a numbering mismatch; it is **not evidence that the corrected fit passes**. The motion source's comment and `tools/creature-animation/test-fixtures/family-records.json` radial fixture assume arms hanging below the centre. The actual master is a face-on five-point star with upper and sideways arms. Renumbering cannot change those observed directions or establish that the existing splay curves suit them. The top arm is nearly aligned with the centre (tip x646 versus centre x636), so treating its slight rightward offset as strong handedness evidence would overstate the observation. No coordinate movement or additional arm is justified by this inspection.

## Retained static first failures

These are read directly from the original `static.json`; no failure was replayed here. Every listed failure is `RecoverablePoseError: ARAP skin: unresolved folded triangles`, after 128 orientation passes.

| Row | First failed ms | Fold count |
| --- | --- | --- |
| approach:pulse | 147.5 | 30 |
| melee:sting-arms | 185.4222222222222 | 9 |
| cast | 187.08333333333334 | 27 |
| dodge | 80.46666666666667 | 19 |
| faint | 255.86666666666667 | 2 |
| victory | 81.4 | 27 |
| presentation, approach:pulse | 5983.333333333333 | 95 |

The retained static report does not include rejected triangle IDs or part ownership. It cannot establish which arm contains the folds, or prove that the parity mismatch caused them. Those claims would require a separately authorized bounded failed-pose diagnostic. Exact source-pixel rest and each row's return-to-rest were already recorded PASS; those findings do not certify the failed poses.

## Observed support and native placement

The radial contract declares `legs: []`. `familyContactChains` derives contacts only from declared legs, so `observedContactSupports(record,binding)` returns an empty map for Starfish. The existing static receipt already records `contacts: []`. Choosing the native harness's `supports: "observed"` is consistent but does not create arm-tip or tube-foot constraints. Do not fabricate leg contacts or reuse a terrestrial contact solver to stabilize the arms.

Keep the five observed arm chains and explicit `appendages: { arms: 5 }`; preserve no hidden/folded/absent claims unless new imagery warrants them. Physical placement should use the existing aquatic habitat owner and the local native harness's full published painted-envelope sizing, with identical scale in placement and rendering. The original native attempt stopped before film because its selected home arena did not support water; that environmental refusal is separate from the static ARAP failures. Source-derived arm masks/landmarks remain the appropriate authoring inputs; presentation sizing does not repair local folds.

Parent owns the new authoring/image decision and any later admission. No contract, curve, solver, gate, threshold, or accepted data is changed by this inspection.
