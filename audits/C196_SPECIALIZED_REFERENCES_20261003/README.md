# C196 specialized references — 2026-10-03

Workspace: `~/Projects/celestial-frontier-openai-mac`. Audit-only authoring under the C246 offline reservation; no product, runtime, registry, pool, gate or native changes. All C243 inputs and failed candidates remain immutable. Disk free at start and end: 132 GiB.

| Subject | Selected fit | Result and remaining boundary |
| --- | --- | --- |
| Prawn | `01-prawn-contours/fit01` | **Improved diagnostic candidate.** Source-attributed free leg-tip and antenna-end flecks are removed in the reviewed cast comparison. Pink abdominal swimmeret fringe, fine endpoints and native motion remain review concerns. |
| Shrimp | `04-shrimp-distal-only/fit01` | **HELD_VISUAL.** Distal flecks improve, but clear rear underside leg/body separation remains. The rejected `02-shrimp-contours` widened the proximal regions and increased the notch; it is preserved. Selected `04` restores the exact original proximal/body polygons. |
| Mussel | `03-mussel-islands/d28/fit` | **HELD_VISUAL.** Current D28 relocates 153 pixels and removes the isolated siphon fleck. Broad valve/mantle and foot/valve openings remain. Not a qualified bivalve film. |
| Leech | `05-leech-reference/fit01` | **New independent manual reference candidate.** Twelve observed coarse controls cover the full continuous body and both actual terminal suckers. Reviewed cast/faint paint is continuous. Glossy hand, broad posterior disc and lifted raw cast still require style/native-grounding review. |
| Snail | unchanged C243 `10-snail-contours/d28/fit` | Previous cleaned cast remains a diagnostic candidate for Claude's scoring. No new defect justifies another blind contour edit; glossy eye/mouth styling and native/full-film review remain pending. |
| Earthworm | unchanged accepted C186 direct fit | C195 acceptance is preserved. The single new Leech-to-Earthworm automatic-transfer diagnostic still refuses; no classifier bypass or reference shopping follows. |

Parent independently inspected Prawn, both Shrimp candidates, Mussel and Leech at full size and concurs with these scoped outcomes. Parent's separate review is under `audits/C196_PROGRAM_20261003`. None of this is gallery or native acceptance.

## Why the contour changes are concrete

`attribution.json` traces positive-alpha source pixels through the actual published triangles at the exact retained cast/swim fractions. It distinguishes already disconnected keyed-source fragments from continuous source paint separated by posed ownership. For example:

- Prawn source `[516,456]` belonged to `abdomen1` despite being leg-tip paint; the successor assigns it to `leg4FarFoot`. Antenna source `[1082,499]` moves from `head` to `antennaFarTip`.
- Shrimp source `[427,473]`, `[510,444]` and `[594,827]` move from three abdominal stripe owners to their observed leg-foot owners.

The original flat-ended corridors missed those source contours. Expanded distal/end corridors capture the actual painted edges without adding, deleting or altering source RGBA. Prawn has 4,054 changed owned pixels; the selected Shrimp has 1,871. Full transfer matrices are in `controls.json`. Body polygons remaining byte-identical does **not** mean every body's previous pixel label stays unchanged: the explicitly counted misassigned leg paint is intentionally reclaimed. Every joint, material, genome, presence declaration and ground line remains unchanged for these existing-source corrections. The 31-owner budget is retained.

The first Shrimp correction changed 5,069 owner pixels and made the proximal notch worse. Its static green did not override the visual failure. The additive distal-only successor retains that negative and restores the original proximal polygons; the pre-existing root separation is still held. No wider repair loop, invented hidden root or limit change was used.

## Mussel: island repair does not supply missing moving coverage

The original C243 interpretation of an external anterior dorsal junction remains explicitly provisional. D28 changes only remainder islands, conserving all other prior owners and exact keyed RGBA; independent replay matches the delivered fit. The large posed splits are a separate source/clip integration issue: D31 deliberately opens the two valves while the soft mantle/foot follow their own chain.

`mussel-boundaries.json` measures adjacent positive-alpha source-pixel centres across the published surfaces at cast50. These are **posed 1254-square source-coordinate pixel distances**, not native screen measurements or a new admission threshold:

| Boundary | Original maximum | D28 maximum |
| --- | ---: | ---: |
| mantle / near valve | 117.887 | 117.887 |
| foot / near valve | 92.633 | 92.633 |
| mantle / far valve | 24.692 | 24.692 |
| mantle / siphon | 1.089 | 1.089 |

The source hinge boundaries remain near one pixel; the large openings are elsewhere. The membrane/shell paint does not provide coverage for the independent motion at those boundaries. No shell weld, rigid soft-tissue reassignment, fabricated interior paint, source-pixel deletion or D31 runtime change was made to hide that limitation. Review `03-mussel-islands/motion-d28-cast-50-{left,right}.png` against the C243 original. Fine byssal threads also retain their separate keying/sampling limitation.

## Independent annelid reference and the retained refusal

Leech's exact new source comes from supply slot24 (`audits/C196_CREATURE_SUPPLY_20261003/24-leech`), master SHA `5890c3418b39794dab2437345f73ca059f7271060a0afe91f0145870c0507061`. It is not another image generated by this reference task. Its landmarks and ownership were independently observed. No tiny artificial root paint patch is cut from the body. Twelve controls do not mean twelve biological segments; no feet, eyes or hidden anatomy were invented. Three one-pixel remainder islands are measured but unmodified; reviewed cast/faint remain continuous at full size.

`earthworm-transfer-plan.json` fixes one new Leech reference and the canonical G1 non-annelid corpus controls before the single attempt. Target identity remains Earthworm/annelid; same-species reuse, reference shopping and fallback are absent. The unchanged comparator returns **REFUSE**: Leech contour cost 0.05023, mirrored cost 0.04176 and serpent comparator 0.01339; the 28.6% rear extension, segment7 coverage mismatch and 21.9% unexplained paint remain. `earthworm-transfer-result.json` retains every reason and the rejected automatic authoring. The auto-author's inherited phrase “registered reference” describes its generic input structure: this local candidate was **not** globally registered. No pool changed.

The accepted directly observed Earthworm fit is a different path. Its source, recipe and previous diagnosis hashes are rechecked unchanged in `controls.json`. A contour-classifier refusal does not relabel its taxonomy or revoke C195's direct-fit acceptance. No additional transfer attempt follows this red.

## Verification and limits

The four selected fits pass **43 actions ×121 = 5,203 samples**, with 24 actual-rig software publication comparisons and 48 diagnostic facings. Including the retained rejected Shrimp candidate, the packet contains 54 action rows / 6,534 samples and 60 software images. Every mechanical report remains qualified: these are canonical source-coordinate diagnostics, not stage films, 60-fps performance, full-stage travel or iPhone evidence.

The original independent ownership replay and source-RGBA/pixel-deletion/owner-theft controls pass for the new manual fits. The extra controls pin exact changed owner counts, unchanged landmarks/materials/presence/ground, trace-attributed corrected pixels and independent Mussel D28 replay. D28's current 0.5 default remains; an explicit stricter 0.05 caller still refuses its negative control. No animation limit or boundary gate changed.

`visual-review.json` lists the actual inspected full-size images. `delivery.json` binds every file in this frozen packet. The only helper-preparation error was an over-strict assertion that a portable helper must contain an audit-directory literal; it stopped before copying and was corrected, with the refusal recorded. No failed fit or static run was automatically retried. Start/end mailbox reads end at Claude C196; CPU work is terminal. No absolute symlinks are present.
