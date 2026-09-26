# C15 batch 1 — Wall Lizard painting, rig, masks and motion findings

**Not admitted to the picker.** One new right-facing plain-coated master follows the ranked Wall Lizard brief (painting-plan-entry.json): wedge head, reptile scales, long tapered tail, four splayed legs/visible feet, no ear flaps. Presence was explicitly authored, not inferred by a collector. Six independent generated masks conserve keyed alpha exactly; no scaling, translation or registration repair. Plain and iridescent have no masks.

Current authored candidate: **fit-06**. Exact rest/source-pixel reconstruction PASS, **16 of 19 static rows PASS**. Three preserved contact refusals: hit at57.75ms and tame at128ms exceed the scale compression bound; faint at231ms requires foreFarPaw rotation96.99603536736818 degrees, beyond the existing limit. Remaining skin folds in fit-04 were traced to two triangles pinned to torso residue beside the near front ankle; fit-05 corrected polygon ownership. Manual far hip/shoulder placement was corrected in fit-06 from exposed limb boundaries to body attachment locations. No limits or solver settings changed.

Native battle2 run **native-phone4x-01 FAIL**. At4×CPU: 583 frames, whole-stage CPU p95 4.299999952316284 ms, frame delta p95 16.799999999999272 ms. Rig refusals: left2, right5, with unresolved folded triangles during actual battle playback. Film and stills retained; no unchanged retry. The native result is not green despite the 16 passing static rows. Neither desktop-per-rig nor real-iPhone performance is claimed.

Retained authoring failures: fit-01 (camel-case part IDs invalid); fit-02/03 (foreFarAnkle contact conflicted with fixed root ownership); fit-04 (fixed root triangles beside foreNearAnkle fold); fit-05 (four contact rows red); fit-06 (three contact rows red). authoring-rejected-01..05.json, intake logs and per-fit provenance preserve the exact input hashes. Contact diagnosis only added error detail in an audit-local copy; production source unchanged.

Hashes:
- master: `7490cbe04da1e945b33dd2fcb693454e2e0c07a0347df31e2ddcede20d8eedff`
- final recipe: `93fc9289e302fe56f31250f2b9163d7aa84737a900e1748f85d1609bf43a1606`
- final binding: `8618744544d42ed3da5c1bfbddf51a0389de26481222ba6194f85aeb9b1a3369`
- primary masks manifest: `c6f353c4c5b5d0850a83a046507c65b80606156578afe84636cc4614e609482f`
- film: `80e4e5cdf28984877b2c4ba0424c6977f560f4ab6cd88595f789e45dd122837b`

Evidence: static-06.json, native-phone4x-01/report.json and battle-10s.webm; review-sheet.png shows master/labels/fit/native still; six-mask-sheet.png shows the marking variants; markings.json retains exact sent mask prompt bytes/hashes; mask-generation-receipts.json retains tool outputs. No accepted bindings, S2 sentinels, solver, family, gate or numerical allowance was changed.

Paired next steps: Claude keeps this out of the arena and addresses the three low-body contact/motion refusals plus native blend folds with Codex; no threshold increase. Codex continues Cougar, then Impala/Marmot/Bass/Cattle/Tang and the rest of the ordered batch, retaining Wall Lizard as unfinished motion work. Nick reviews art on the ten-item sheet; this packet grants no coverage credit or final art acceptance.
