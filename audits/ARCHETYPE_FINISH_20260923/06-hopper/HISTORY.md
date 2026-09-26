# Tree Frog completion history — through fit03

This is retained history for the reopened September23 work under [AUTHORITY.md](../AUTHORITY.md), after signed Beetle predecessor `1dfeec2a88ac6e7be01b525e12421c3b1b181a7c`. Earlier September22 Frog results remain in [the original sprint packet](../../ARCHETYPE_SPRINT_20260922/06-hopper/README.md) and [the repair packet](../../ARCHETYPE_REPAIRS_20260922/06-hopper/README.md). No result below rebinds old art or measurements to a new fit. Native film and desktop CPU remain unmeasured at this history boundary.

## Retained paintings and observed authoring

All three delivered masters below are1254×1254 RGBA. Prompts and image-generation receipts are retained exactly; a targeted edit request does not establish that unrelated pixels stayed identical.

| Generation / actual paint run | Authority and decision |
| --- | --- |
| `20260923-tree-frog-paint-03` | Rejected before intake: repeated high folded hind Z and occluded far upper chain. Four feet were visible, but the requested open bends were not delivered. The approximate visual chain is not an admitted landmark set. Master SHA-256 `bf0956ef30a7072f0ad5cbdf484d6c7291ddc22eb596a7e736f87d2e20549185`; prompt SHA-256 `fbe06bb30e90911c2a44aa46e5a5696ad9be3eb62e52109ee43f3ceb70d52d82`. [Request](candidate-03/request.json), [prompt](candidate-03/prompt.txt), [master](candidate-03/master.png), [receipt](candidate-03/generation-receipt.json). |
| `20260923-tree-frog-paint-04` | Generation4 half-extended hop launch, four visible legs/pad-bearing extremities; far elbow and partly occluded proximal attachments explicitly estimated. Requested8% margin was not delivered; the painting is not an all-feet coplanar stance. Used for fit01. Master SHA-256 `1bf61af1e833d5741fdf97b93f560bf518580d7f4cfd47488338b7a236233517`; prompt SHA-256 `5f5b4e09f63b19ceb730dc866d79a0c7e2f6782dfebf19f5cf666480fc432659`. [Request](request.json), [prompt](prompt.txt), [master](master.png), [receipt](generation-receipt.json). |
| `20260923-tree-frog-paint-05` | Generation5 edit requested a visibly bent far forearm after measured near-straight-chain failures. Its census records a clear elbow bend, four legs/four pad-bearing extremities, and an estimated occluded far shoulder. Requested8% margin still not delivered. Used for fit02 and unchanged as the master for fit03. Master SHA-256 `4166f8f158b34c76d4c62d925ceef5224862bec1fbefe28afbc406321737f8d0`; prompt SHA-256 `30031f564ddcaa2b68ece129a3958471e4064d2c50709f34b01dc5b8e6f9f448`. [Request](candidate-05/request.json), [prompt](candidate-05/prompt.txt), [master](candidate-05/master.png), [receipt](candidate-05/generation-receipt.json). |

Generation3's [rejection](candidate-03/visual-review.json), generation4's [census](visual-census.json), and generation5's [census](candidate-05/visual-census.json) are distinct observations. Parent explicitly declared tail/external ears absent, hidden empty and folded empty for the admitted paintings; no absence was inferred from solver behavior.

Candidate06 is **not another image generation**. Its [source authority](candidate-06/source-authority.json) retains generation5 pixels and moves only the manually estimated, occluded far hip from `(535,572)` to `(575,515)`, toward the observed pelvic attachment. The exact hidden joint center remains unobservable. It does not claim measured anatomical ground truth. Masks and other landmarks remain as stated in that authority; fit03 independently records the resulting binding.

| Fit | Record recipe / binding authority | Intake evidence |
| --- | --- | --- |
| fit01 | Record `8952129f96a3ff22e92b4f409843ce24e55fd3cdf4d3431f2d26a5d8e80dbbba`; binding `aff5f77d4822ec0b8f1eddf2a9835792b1f4dc3709137ebd0552ede5c7efeb41`. | [Receipt](fit-01/receipt.json), [intake log](intake-01.log). 17 owners; rest/atlas reconstruction changed channels `0` / `0`. Intake is not native acceptance. |
| fit02 | Record `8499e6b0c1acbeceb970910cedd46202fce2498a3d672d8d8b2c77221d97d628`; binding `0235383a8bbb78c214ee8fef0640f301d9de6880d21db9bd8a07ff5769e0e73c`. | [Receipt](fit-02/receipt.json), [intake log](intake-02.log). 17 owners; rest/atlas reconstruction changed channels `0` / `0`. Intake is not native acceptance. |
| fit03 | Record `a5110a56f4ed6757bb0c9f9c3fd194fd5ec4c8b82d5787d14c018c9d7d23ba27`; binding `2fba5ff7a18a3153c08225212d47ab0d378494aa633e26b614d95279a1d91453`. | [Receipt](fit-03/receipt.json), [intake log](intake-03.log). 17 owners; rest/atlas reconstruction changed channels `0` / `0`. Intake is not native acceptance. |

## Static01 and static02: original failures remain

Each report contains12 standalone actions plus a presentation row. Static01 uses generation4/fit01 and the initial Hopper stance declaration. Static02 uses generation5/fit02 and the declaration that also enables source-step travel for hit/tame. Both report exact rest and zero changed visible RGBA channels in their independent atlas-part reconstruction; neither is a GPU result. These are separate changed-input/source attempts.

| Report | Standalone rows | Presentation |
| --- | --- | --- |
| [static01](static-01.json), [log](static-01.log), [sources](static-01.json.sources.json) | 8 PASS / 4 RED; every passing standalone row has121 samples. | RED; 287 successful samples before first refusal. |
| [static02](static-02.json), [log](static-02.log), [sources](static-02.json.sources.json) | 9 PASS / 3 RED; every passing standalone row has121 samples. | RED; 530 successful samples before first refusal. |

Every first refusal, verbatim first error line:

| Report / row | First sample time (ms) | Refusal |
| --- | --- | --- |
| static01 / alert | `62.333333333333336` | `Error: Contact: alert@62.333333333333336 exceeds scale compression bound` |
| static01 / hit | `221.25` | `Error: Contact: hit@221.25 exceeds scale compression bound` |
| static01 / faint | `121.33333333333333` | `Error: Contact: joint limit foreFarAnkle faint@121.33333333333333: -60.976671525776624` |
| static01 / tame | `80` | `Error: Contact: tame@80 hindFar outside accommodatable reach` |
| static01 / presentation | `4783.333333333333` | `Error: Contact: alert@73.7735287596779 exceeds scale compression bound` |
| static02 / hit | `348.75` | `Error: Contact: hit@348.75 hindFar outside accommodatable reach` |
| static02 / faint | `273` | `Error: Contact: joint limit foreNearPaw faint@273: 45.119477462522184` |
| static02 / tame | `133.33333333333334` | `Error: Contact: tame@133.33333333333334 hindFar outside accommodatable reach` |
| static02 / presentation | `8833.333333333334` | `Error: Contact: hit@360.44019542634487 hindFar outside accommodatable reach` |

Presentation sample time is overall schedule time; its error string contains the local alert/hit elapsed time. Contact refusal can occur before a pose reaches paint: `firstRefusal.pose` may therefore be the prior published pose. No later action or fit is certified by a stale stored pose or by a missing ARAP failure.

## Bounded contact diagnoses

[contact-diagnosis-01-findings.md](contact-diagnosis-01-findings.md), [full result](contact-diagnosis-01.json), [source receipt](contact-diagnosis-01.sources.json), and [log](contact-diagnosis-01.log) retain one execution on generation4/fit01. It captured the actual attempted GSAP/performance pose and reproduced all five static01 error first lines exactly. Observational hooks left solver branches and numerical bounds unchanged;43 bundled sources and9 inputs remained stable, with42 source hashes also equal to static01.

The same report retains **two explicitly separate, in-memory policy comparisons** enabling hit/tame source steps. Tame at80ms passes contact with zero compression and0.008501698266605809px painted residual; hit at221.25ms still refuses far foreAnkle at−62.38982480994361° (analytical−62.39019311091054°), outside−60..60°. Neither is a full row. The far foreleg's measured outer rest slack was0.4294199130239451px; the shared compression cap remained27.855283161368142px. This supported the far-forearm repaint request, not moving visible joint centers to fit the solve.

[tame-contact-03.json](tame-contact-03.json), [sources](tame-contact-03.sources.json), and [log](tame-contact-03.log) retain the changed fit03's **121-sample tame contact-only** qualification on the real current GSAP/performance/contact owners:121 passed,0 failed, zero maximum compression, maximum painted residual0.001680358588619999px, maximum normalized segment-length error3.0531133177191805e−16. Timeline hash `4b47e9ec`, duration640ms;40 source hashes and7 inputs remained unchanged. No substitutions, direct-block bypass, ARAP/paint publication, hit replay, other action, presentation, full static, film or CPU qualification occurred. In particular, static02's hit failure remains retained and is not declared repaired by this tame result.

[terminal-support-consideration.md](terminal-support-consideration.md) is a read-only feasibility note on fit03's Paw-rigid vertices. A terminal painted-contact mode and foot-rock policy are **unimplemented**; the tabulated eligible vertices are not approved contact points. No alternative solver, relaxed ankle/Paw limit or replacement support authority was introduced by that note.

## Focused tests and contract isolation

- [hopper-stance-01.log](contract-regression/hopper-stance-01.log): first test execution,5 PASS /1 FAIL. Bite at230ms was supplied as raw standalone travel, producing `Contact: melee:bite@230 hindFar outside accommodatable reach`, with cause `Contact: melee:bite@230 hindFar rigid support outside accommodatable reach`. This is a true standalone refusal but the wrong context for the static producer, which assigns stage travel to melee; it is not a new actual static-chain failure.
- [hopper-bite-context-02.log](contract-regression/hopper-bite-context-02.log): after correcting the test context to `travel:'stage'`, only the changed bite cases ran:2 PASS /5 skipped. The unchanged raw230ms pose remains an explicit expected-reach negative control, including both original and analytical error messages. Cast/victory, dodge/raw-limit, idle/faint-rest inventories and the former-all-leg negative control retain their first-run results. Tests remain bound to fit01; they do not certify later paint/fits.
- [contract-isolation-01.json](contract-regression/contract-isolation-01.json) / [log](contract-regression/contract-isolation-01.log): initial Hopper hind/no-contact stance declaration. [contract-isolation-02.json](contract-regression/contract-isolation-02.json) / [log](contract-regression/contract-isolation-02.log): final declaration additionally enabling hit/tame source steps. Each independently imports the signed Beetle family source under its original module ID, detects an injected resolved-stance difference, and finds all six actual S2 resolved contracts/chains/action stances byte-identical; all12 protected record/binding hashes and84 consumed source/authority hashes are stable. Every previously measured S2 source matches except the explicitly checked Hopper-only declaration. Resolved JSON SHA-256 is `f140b28f99f0d89a2fc20a19890af4316c85c32c877d14eb20e7a5cbd9d3385f` in both proofs. This is contract isolation, **not an S2 replay**. The retained prior [Beetle S2 receipt](../04-insect/contact-regression/s2-execution.json) owns its original six-receipt/13286-sample measurement.
- [app-typescript-01.log](contract-regression/app-typescript-01.log): `npx tsc --noEmit -p apps/game/tsconfig.json`, exit0, once after the current test changes. No other battery is implied.

## Pending next art input

At this history boundary, the parent is preparing candidate07 / generation6 to correct the near forearm's painted bend. It is pending here: no output hash, intake, static result, native film, CPU result or art acceptance is claimed. Codex must qualify the actual next input and sign this item before later item work; Claude consumes signed results, while Nick reviews art. No root handoff or production file was changed by this history entry.

## Initial packet README — verbatim retained snapshot

The following initial handoff predates the later static/diagnostic results above; its “running” state is historical.

# Tree Frog completion — in progress

Beetle predecessor1dfeec2a88ac6e7be01b525e12421c3b1b181a7c is signed G. Nick reopened this item under ../AUTHORITY.md. Gen3 repeated the high folded hind Z; exact prompt/master/receipt and independent visual finding remain in candidate-03. Gen4 paints a half-extended hop launch with four visible limbs and four pad-bearing extremities. Requested8%margin was again not delivered; far fore elbow and proximal far attachments remain explicitly approximate observations. Parent declares tail/external ears absent, hidden empty, folded empty. This is not an invented missing-limb declaration.

Master1bf61af1e833d5741fdf97b93f560bf518580d7f4cfd47488338b7a236233517; paint20260923-tree-frog-paint-04. Fit01 record8952129f96a3ff22e92b4f409843ce24e55fd3cdf4d3431f2d26a5d8e80dbbba; bindingaff5f77d4822ec0b8f1eddf2a9835792b1f4dc3709137ebd0552ede5c7efeb41. Manual masks, landmarks and presence use actual delivered pixels; existing40/80mesh options and17owners. Review-sheet-fit-01 separates missing film from the compiled fit.

Source-supported hopper policy selects hind support for bite/cast/victory and no support during aerial dodge; faint and ordinary stance remain all-four. These clips explicitly lift the forelegs or jump. No numerical limit, accepted binding or S2 input changed. Contact solver bytes remain the signed Beetle version. Static01 is running; native/CPU are unmeasured.

Codex completes and signs this item before Chimpanzee. Claude holds for signed results; Nick reviews art later and need not open Claude now. No new PR, hosted attempt, merge, release or deploy.

## Completion addendum — generation6, fit05 and native01

This addendum supersedes the pending state above without rewriting its historical claims. In particular, the old terminal-support feasibility note remains an **unimplemented proposal at its original boundary**. The separately designed and now implemented opt-in below has its own new source, record, binding, tests and measurements. Nothing below certifies a prior failed fit or rebinds old samples.

### Generation6 and the final endpoint-only refusal

Candidate07 delivered generation6, run `20260923-tree-frog-paint-06`, as an edit of generation5 to correct the visible near-forearm bend. Its [request](candidate-07/request.json), [exact prompt](candidate-07/prompt.txt), [generation receipt](candidate-07/generation-receipt.json), [visual census](candidate-07/visual-census.json) and [independent review](candidate-07/visual-review.md) are retained. Master SHA-256 is `aa1ad50d8ac1e354d0f0ba5beeb211a22519461ac36802ca621022f2418c65eb`; prompt SHA-256 is `b37000d75f1c8668e78d07ed685bc8270ca91a504fb22102ed232e8603902632`. It is1254×1254 RGBA, with four visible connected limb chains and four pad-bearing extremities; proximal far attachments remain explicitly estimated and the requested margins remain short. This does not claim human art acceptance or coplanar feet.

[Fit04](fit-04/receipt.json) admits17 owners with zero rest/atlas changed channels: record recipe `2eaab899c797ac1c4623335afb899f2032affcb14b2dd43675366c7e7c048de6`, binding `0c6c9c7a33aa8573d6c54e88af381c40676319455f060797c9043216a03dff07`. [Static03](static-03.json) / [log](static-03.log) passes11 of12 standalone rows, with exact rest, but retains these first refusals under the previous anatomical-end support model:

| Row | First sample time (ms) | Exact first error line |
| --- | --- | --- |
| faint | `307.6666666666667` | `Error: Contact: joint limit foreNearPaw faint@307.6666666666667: 45.12553663093271` |
| presentation | `10116.666666666666` | `Error: Contact: joint limit foreNearPaw faint@313.773528759677: 46.51494897053732` |

Faint has71 successful samples before attempted sample72; presentation has607 before attempted sample608. The original45° terminal limit is preserved. The painting alone did not repair this contact-model refusal, and no native run is claimed for fit04.

### Candidate08: explicitly authored adhesive points, same paint

[Candidate08 authority](candidate-08/source-authority.json) retains generation6's exact master bytes and limb contours; this is **not another image generation**. Candidate07 and08 presence files also match, SHA-256 `8c9cd234ecc9032420ec0d08f03ff60fe7777c361d20a919926df2577fa186c4`. Parent-authored contact-pad points in master pixels are hindFar `(85.5,789.5)`, foreFar `(1175.5,709.5)`, hindNear `(95.5,999.5)`, and foreNear `(1002.5,756.5)`. The new normalized record declaration is `geometry.contactPads`, schema `cf.terminal-pad-support/v1`, kind `adhesive`, keyed by the four anatomical Ankle contact IDs. A pad lies on its Paw-owned painted surface; the contact ID does not turn the selected point back into an ankle vertex.

The near-forepad triangle in the previous mesh was not terminal-rigid/pinned, so it was not admitted by pretending eligibility. The new authored local refinement is the source box `(970,700,70,70)` with boundary/interior steps12/24. [Fit05](fit-05/receipt.json) retains17 owners, original nonzero-alpha paint and source coordinates, and zero rest/atlas changed channels. It has1377 field triangles and1117 vertices after observed surface splitting. Record recipe is `5357c3e397fbd0d70587424b527de754e7d7fc15988324ba93d85e5e3d692b97`; binding is `7e3ac04a6e9ddbb3087ebe6df37bfb98e5e47241c4f08a89044341b3a0a85fa2`.

The implemented design is documented in [terminal-support-design.md](terminal-support-design.md), with consumer findings in [terminal-observer-review.md](terminal-observer-review.md). It uses an independently declared painted adhesive point and bounded analytic terminal-joint candidates, retaining original anatomy, link lengths, local limits, compression and0.25px contact bounds. Candidates are the preferred zero world-foot rotation and the two terminal-angle boundaries; this is not a complete three-link search or a promise of global continuity. Faint still retains all four contacts. Eligibility requires the selected actual rendered triangle's contributing field vertices to be pure-terminal and pinned. Actual ARAP/Float32 rendered interpolation is checked against the solved painted target before any mesh publishes; failure holds the last-good publication. Legacy records without the declaration retain their old path. The two older ankle-only review tools explicitly refuse this new mode.

These are **adhesive point anchors only**. Different source perspective depths are retained. There is no new global floor, per-foot horizontal plane, whole-sole collision model or terrain-clearance claim; transparent mesh-padding extrema were not substituted for painted pad points.

### Focused implementation evidence and retained instrument failures

| Evidence | Outcome and scope |
| --- | --- |
| [terminal-contact-test-01.log](terminal-contact-test-01.log) |7/7 pure-math tests PASS: exact rest, active terminal boundary without clamping, local boundary continuity, mirroring, inherited parent rotation, reach/limit/bend refusals, invalid inputs and source snapshots. |
| [terminal-contact-pads-01.log](contract-regression/terminal-contact-pads-01.log) |6/6 declaration tests PASS, receipt `10aad3`: exact inventory, terminal requirement, finite normalized coordinates and exact positive source-alpha sample. Alpha1 is retained; a painted neighbor cannot rescue a transparent declared pixel. Absent declarations return the legacy result. |
| [terminal-support-eligibility-01.log](contract-regression/terminal-support-eligibility-01.log) |Actual unmodified fit05 admits all four terminal rendered triangles, each with three positive barycentric contributors; receipt `7dbc7f`. This is eligibility, not a pose or film measurement. |
| [terminal-support-reader-01.log](contract-regression/terminal-support-reader-01.log) |FAIL before rig creation: fixture loader joined the repository root onto an already absolute `record.source`, yielding `ENOENT` for a duplicated `/Users/nick/Projects/celestial-frontier-openai-mac/Users/nick/Projects/celestial-frontier-openai-mac/.../candidate-08/master.png` path. Receipt `21ea4b`. No publication assertion ran. |
| [terminal-support-reader-02.log](contract-regression/terminal-support-reader-02.log) |Changed loader uses `path.resolve`;1/1 focused test PASS, receipt `b4dee2`. Actual Pixi Float32 triangle interpolation, a contributing-buffer mutation exceeding0.25px, restoration, unpublished/disposed null, invalid-pose hold, wrong-target refusal before publication, unchanged failed evidence and correct-target recovery are exercised. The wrong target also has `stance:false`, proving the guard checks supplied swing contacts. |
| [terminal-integration-test-01.log](terminal-integration-test-01.log) |6/6 fit05 contact-integration tests PASS. Canonical faint includes the former307.6666666666667ms refusal, all four pads, original segment lengths, angle and compression bounds, plus no-observed-support, substituted point, wrong/mixed pivot and impossible external translation refusal controls. This log is contact math; the separate static/native owners prove painted publication. |
| [app-typescript-02-execution.json](contract-regression/app-typescript-02-execution.json) / [log](contract-regression/app-typescript-02.log) |Root `npx tsc --noEmit -p port/v2/apps/game/tsconfig.json` returned no compiler output and was interrupted, exit130, receipt `4cf7ce` (initial `204142`, session29374). No PASS is claimed. The next attempt used the installed locked compiler. |
| [app-typescript-03.log](contract-regression/app-typescript-03.log) |Exit1, receipt `b20c24`: two TS2339 errors at the old stage-support test's line42, where `vertexIndex` was read without narrowing the new vertex-or-triangle surface union. This was a real compile failure, not a runtime/S2 failure. |
| [app-typescript-04.log](contract-regression/app-typescript-04.log), [app-typescript-05.log](contract-regression/app-typescript-05.log) |Changed-source compiler checks after the explicit old-test union narrowing / final integration: both exit0, parent-retained tool receipts `977acf` and `15976d`. Empty logs are successful no-diagnostic output only when paired with those measured exit statuses. |
| [legacy-stage-support-01.log](contract-regression/legacy-stage-support-01.log) |3/3 legacy stage-support tests PASS, parent receipt `7465d3`; narrowing preserves the original single-vertex assertions. |
| [legacy-contact-observer-01.log](contract-regression/legacy-contact-observer-01.log) |4/4 new legacy-tool guard tests PASS, receipt `28015e`; ordinary family records preserve identity/bytes, while explicit, malformed, falsey or future pad declarations cannot silently reach ankle-only observations. Both tool edits and helper hashes are retained in the log. |

The changed shared source also receives a fresh [S2 execution](contact-regression/s2-execution.json), [log](contact-regression/s2-run.log): **PASS_STATIC_IDENTICAL**, six subjects,13286 support samples, all six static receipts and support evidence byte-identical to the retained baseline. Identity SHA-256 remains `7364c70a865ccfd9d229dce53f1cf6378bc306da5cad306f52eba1bc9ef7dbf2`; the12 protected inputs remain unchanged. This is the actual later S2 replay, distinct from the earlier contract-isolation-only proofs. Root validation also completed exit0, parent receipts `bf7336` / `9cc0c4`.

### Final static04 and native01 measurements

[Static04](static-04.json), [log](static-04.log), and [source receipt](static-04.json.sources.json) qualify fit05 with the terminal-aware packet owner: **12 standalone actions ×121 samples PASS**, plus **850 presentation samples PASS** across the14142.893137906989ms schedule. Exact rest is true; independent source-pixel reconstruction changes0 visible RGBA channels. Maximum painted drift across these rows is `0.00006700236199542844px`; maximum measured source-join gap is `0.00007722407383548055px`. The static result claims neither GPU rest nor native CPU. Parent execution completed exit0 (`3c636a`, session52511; completion `1a0c1d`).

[Native report](native-01/report.json), run **`20260923-tree-frog-native-01`**, is **DIAGNOSTIC_PASS** on Edge `153.0.4234.48`, revision `@cf31d6623d8718e7a3c3e181e55e59c1aae57a73`. It uses the actual observed-support battle2 stage,7960ms script,1024 dense side rows, and **zero left/right rig refusals both after dense checks and live capture**. Live capture has602 frames over10016.3ms; encoded [film](native-01/battle-10s.webm) has606 frames,10.100335s,1024×576. Parent execution completed exit0 (`dc312a`, session54348; completion `ea5788`).

Per-rig desktop painted-tier p95 is **left0.6000000238418579ms / right0.8999999761581421ms**, below the unchanged3.5ms ceiling. Whole-stage p95 is1.5ms. Each per-rig bound charges all shared `sampleTurn` time plus that rig's performance/contact/publication time; whole-stage timing additionally includes effects/rendering. Bounds admission cost is excluded, as stated in the report. The final cumulative admitted painted-contact evidence has2250 left /3904 right samples, with maximum actual pending Float32 pad drift `0.00003583657188361569px` / `0.00006808562263478834px`. Those counters are cumulative through capture, not independent live-only sample counts.

The film SHA-256 is `68a8c9d791c0bf6425bbb51c67d91b16313fa3ed9ddf3b98cef0588494b53140`; [review sheet](review-sheet-native-01.png) SHA-256 is `7432294aa2eed26ce68d66721272258089be5cbbef2b6ec0a1bcdd22462a440a`. Parent inspected the sheet; Nick's art acceptance remains separate. [Final source check](final-source-check-01.json) reports846 native source/input files,59 static sources and5 static inputs still matching measured hashes, parent receipt `eb1aed`. Source HEAD fields identify the signed Beetle predecessor plus retained dirty-source hashes; they are not a claim that the then-uncommitted terminal implementation existed in that predecessor.

At this addendum's boundary, Codex seals and signs this completed Frog item before starting the next item. Claude consumes the signed result; Nick reviews the art and need not open Claude now. Final signing/handoff authority belongs to the packet README and root ledger; this history makes no unmeasured later commit or push claim.


## Final admission review and changed-source qualification

A final read-only review found both legacy quadruped early returns in family-record.mjs bypassed the new contactPads admission. Present declarations are now explicitly refused for legacy quadrupeds without anatomy, before both geometry/sealing and source admission. Records without the field retain the old path. Five new outcome controls pass (terminal-legacy-admission-test-01.log), including fresh-hash malformed/present variants and the actual unchanged Civet fixture. This is a real admission fix, not a changed limit or an unchanged retry. A blank-line trailing-space cleanup in creature-rig.ts is the only other final source edit; final admission isolation records that lexical-only difference.

Static05 qualifies the final source:12×121 plus850 presentation samples, exact rest0, same maximum painted drift0.00006700236199542844px. Native20260923-tree-frog-native-02 passes0/0 refusals,602live frames/10016.2ms,605encoded frames/10.083139s over7960ms script; per-rig p950.6000000238418579/0.8999999761581421ms, whole1.5ms. Final cumulative actual pad admission evidence is2250left/3900right samples, max0.00003583657188361569/0.00007112960993631421px. The counts span dense/stills/live. Codex inspected review-sheet-native-02.png. Earlier static04/native01 and result-before-final-admission-01.json remain bound to their original source.

The final source check02 verifies846native,59static sources and5static inputs unchanged. Prior S2six/13286 evidence is preserved through the final source-isolation proof, not described as another S2 execution: sentinels cannot enter the new declaration guard, all12inputhashesmatch, and exact reversed guard spans restore the measured source hash. No larger battery ran. No source, family bound or runtime arithmetic changed after final qualification.

## Signing approval pause

The completed Frog item was staged. Signed commit tool455730 and the single authorized retry8a4ef7 both exited128 with `agent refused operation`. No commit was created, no unsigned fallback or helper/configuration change occurred. Exact errors and current signed predecessor are retained in signing-attempts-01.json. Nick was asked to approve the 1Password request with until quit under his explicit signing rule; one further retry requires that reply. No later item started.
