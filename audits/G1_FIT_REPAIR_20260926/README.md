# G1 author/fit repair — bounded candidate rejected

2026-09-26. **All six original author/fit failures remain open.** One generic contact-mesh refinement removes Grouse's initial compiler collision but does not produce a passing animated fit. It is retained as a rejected diagnostic; production authoring, compiler defaults, intake, static gate, solver, motion presets, numeric limits and source paint are unchanged. No hand landmark/polygon edits, alternate-reference shopping or admission claims.

The completed code repair is the G1 runner's reporting omission: `staticFails` previously enumerated only isolated action failures. Mongoose had **19 passing action rows plus a failing blended presentation**, so the old summary showed RED with an empty failure list. `summarizeStaticOutcome` now retains `presentation` and each first refusal, while passing the original overall gate verdict through unchanged. Two focused tests pass, including the real saved Mongoose failure and both positive/negative reporting controls.

## Exact retained failures

`baseline.json` records original paths, master hashes, source-pixel checks, complete semantic-presence declarations and first refusals. The old evidence remains untouched.

| Subject | Original failure | Contact-refinement candidate |
|---|---|---|
| Grouse | Observed surface split: contact conflicts with fixed owner | Split compiles; 8 isolated actions fold, plus presentation RED |
| Eagle | Cast and victory ARAP folds; presentation folds | 5 isolated actions fold, plus presentation RED |
| Sparrow | Faint `legNearFoot` joint limit at 403.4667ms, 45.1900°; presentation same limit | Same joint-limit failure; no repair |
| Sandpiper | Cast and victory ARAP folds; presentation folds | Cast passes, victory still folds; presentation RED |
| Mongoose | All 19 isolated actions pass; presentation `foreFarAnkle` gallop limit −108.5299° | 2 new isolated fold failures; presentation remains RED |
| Tapir | Tail attack exceeds contact scale-compression bound; faint folds | All 19 isolated actions fold; presentation RED |

For Grouse, a diagnostic of the unchanged splitter identifies vertex144 at source `(744,880)`: it supports `far-foot`, `far-shin`, `far-thigh` and fixed-root `body`, while the contact wants `legFarAnkle`. Releasing the fixed root or contact pin would change the contract. The candidate instead refines sampling around every contact endpoint, identically for every family: a112×112-pixel region, 4-pixel boundary and8-pixel interior steps, clipped to the canvas. Existing global24/56 sampling and splitter policies remain unchanged. Source joins and all per-part RGBA pixels stay unchanged.

This shows that local sampling can remove one contradictory coarse support. It does **not** establish correct semantic ownership or limb landmarks. More vertices also shorten the splitter's three-mesh-ring flexible collar in source space; folds worsen for several subjects. The hypothesis is therefore rejected as a general repair. Increasing solver budgets, releasing pins, relaxing contact limits, excluding failed actions, or selecting a more convenient reference would conceal the remaining author/geometry problem. The unresolved next repair requires automatic source-evidenced ownership/landmark inference, followed by the same complete static and native gates.

All six candidates retain exact rest and **zero changed visible RGBA channels**; all static source manifests report unchanged inputs. `candidate-summary.json` records binding hashes, vertex counts and first failures; full reports, logs and source manifests are retained beside it. No candidate is wired or admitted. Native/quality acceptance was not attempted after these reds.

## Presence-source inconsistency

Claude mailbox C43 says RESOLVED is only the six fish and every quadruped/bird is UNRESOLVED. The committed v8 provenance disagrees: **Sparrow, Sandpiper, Mongoose and Tapir explicitly say RESOLVED** with empty `mergedChains`; Grouse and Eagle say UNRESOLVED with `legFar+legNear`. This audit preserves the exact recorded statuses and does not reinterpret them. Neither RESOLVED nor ADMIT means static/native/visual acceptance. D24 remains open; D25 shopping stays off.

## Reproduction and retained harness failures

Generate the original fit from the unchanged packet with `intake-authored.mjs`, then run:

```sh
node audits/G1_FIT_REPAIR_20260926/refine-contact-fit.mjs SOURCE_FIT NEW_AUDIT_FIT
node audits/G1_AUTO_AUTHOR_20260926/harness/static-runner.mjs NEW_AUDIT_FIT NEW_AUDIT_REPORT_JSON
node --test port/v2/tools/anatomy-verify/static-outcome.test.mjs
```

Use fresh paths. The static owner requires fit/report paths under this worktree's `audits/`. Rebuilt fit directories are ignored to avoid committing duplicate originals/atlases; receipts and exact binding identities remain in this packet. Source hashes are in `source-hashes.json`.

Two harness mistakes were caught before measurement and retained: the first diagnostic looked up an absent record `id` instead of the parts manifest's `creatureId`; the first static invocation used `/private/tmp`, which the unchanged audit-path guard refused. Both were corrected in the harness/path only; each candidate's full measured static gate ran once, with no unchanged retry.


## Batch-end C44/C45 reconciliation

Claude C45 corrects the C43 prose inconsistency described above; the exact statuses retained here remain valid. C44 supplies additional source evidence: Eagle's transferred tail leaves27% of its painted tail assigned to body, and only the hand-tail diagnostic turns that static control green; Sparrow's mixed control still fails the faint foot landmark limit. These are diagnoses, not permission for hand fixes. No further automatic geometry candidate was adopted here. Six ignored diagnostic fit copies were removed after retaining reports, hashes and regeneration commands; originals remain untouched.
