# Creature anatomy → Blender mapping, 2026-09-07

Read-only bounded inventory for Codex. No code, protected portrait, source master, render, test, build or GUI was changed/run. Root owns the active landing work. The campaign is now 24 hours, ending 2026-09-09T03:11:15Z; Claude review remains Thursday. Local candidate authoring is authorized; artistic acceptance is not claimed.

## Main finding

The game already has substantial deterministic morphology and reviewed whole-form anatomy. Blender should consume that work, not replace it with eight generic models or a random part assembler. Three distinct authorities must remain distinct: the **16 immutable fauna body-gene values**, the renderer's **compatible morphology families**, and the **eight pilot review buckets**. The last are coverage labels, not the universe's generation rules.

## Existing authority map

Repository root for every relative path below: `/Users/nick/Projects/celestial-frontier-openai-mac`.

| Concern | Current exact owners | Consequence for Blender |
|---|---|---|
| Immutable organism identity | `SPECIES_AND_GENOME.md` §§2.1/2.6/3; `port/v2/packages/domain/genome/src/genome.verbatim.js`; `port/v2/packages/domain/genetics/src/index.ts` | Export the existing complete genome; never reroll genes, change draw order/table lengths, normalize inherited drift differently, or generate a new genome from model parameters. |
| Procedural fauna morphology | `port/v2/packages/art/src/proceduraloverrides.ts`: `planFor`, `ProcPlan`; `alientraits.ts`: `AlienTraits` | Consume the actual renderer's plan/spec. Body/loco choose compatible structure; size/head/tail/skin/pattern determine proportions and surface traits. `null` remains a meaningful specialized fallback. |
| Gene vocabulary | `proceduraloverrides.ts` FA_BODY comment and `planFor` | 0 sturdy-limbed, 1 armored, 2 stilt-legged, 3 tentacled, 4 serpentine, 5 many-segmented, 6 shelled, 7 membranous, 8 crystalline-plated, 9 gelatinous, 10 tusked, 11 horned, 12 spindly, 13 squat, 14 four-winged, 15 radial. Locomotion can legitimately override to a swimming form. |
| Coherent alien variation | `alientraits.ts`; `planFor` quad branch | Two/three/four leg pairs, sensory forms, tendrils, dorsal sail, armor and material remain gene-derived. Extra limbs need shoulder/middle/pelvic attachment anatomy, not repeated independent limb objects. |
| Named Earth anatomy | `speciesoverrides.ts`: exact named routing; `quadrupedoverrides.ts`: `QuadSpec`, `MammalFamily`, skull/family profiles, `faunaResetCanidC`, exact Wolf row | Preserve biological class and species-specific proportion. Earth Wolf is not the procedural plan produced by its unrelated raw body gene. Use the final named owner. |
| Bred lineage | `speciesoverrides.ts`: `REVIEWED_FAUNA_LINEAGES`, `isReviewedFaunaLineage`, `lineageRenderKingdom`, Wolf branch in lineage treatment; genetics facade | Preserve `_earthBlend`, `_earthBlendKingdom`, `_anchorVal`, complete child genome and both parent orders. Seven reviewed fauna lineages retain modern whole-form owners; Sea Turtle/Great White Shark remain on protected compatibility routes. |
| Non-fauna breadth | `proceduralfamilies.ts`: `procFamilyIndex`, `FAMILY_COUNT`; `proceduraloverrides.ts` flora architectures | Fungi and microbes each already have 13 structural families. Do not funnel them into animal skeletons or collapse them to one recolored model. |
| Runtime identity/delivery | `speciesidentity.ts`: `snapshotSpeciesGenome`, `speciesVisualKey`; `speciespainter.ts`; app `species-art-loader.ts`, `species-art-worker-core.ts`, `species-art-protocol.ts` | Seed/name alone is insufficient. Keep complete-genome identity and immutable queued inputs, native 440/132 output, lazy scheduling, cancellation, disposal and protected fallback. Existing loader is a static painter owner; it does not already supply a Blender atlas/rig runtime. |

## Preserve the hard-won iteration

`ART_DIRECTION.md` around 1270–1354 specifies silhouette/proportion → connected skeleton/growth → continuous tissue → shared lighting. Horns, wings, tails and hybrid traits must grow from the organism. `port/v2/reference/nick-anatomy-audit.md` records the historic failure: unrelated species shared the same scaffold (canids on deer-like legs, etc.). This is a historical diagnosis, not a current verdict.

The later governing repair is `port/v2/reference/Celestial_Frontier_Current_Platinum_Repair_All_Pass_Review_2026-08-11.md`: Wolf's bounded lineage is PASS for canine silhouette, consistent head/torso/legs and gradual alien drift. Preserve that success. This review does not certify every possible bloodline or all 1,250 rows. `FULL_CATALOG_RESET_AUDIT_2026-08-09.md`, the earlier Platinum review and `BAT_FAMILY_RESET_REVIEW_2026-08-10.md` preserve distinct scopes and controls.

## Existing Blender pipeline: reusable tooling, missing creature armature

The inspected B source inventory contains Scout, wooded-basin and atmosphere `.blend` masters. No creature master or anatomical armature appears in that inspected inventory or its Python recipes. `UI_TOOLCHAIN.md` broadly says Blender produced “creature” art; that wording does **not** establish an existing reusable creature rig. All eight pilot rows still explicitly report `anatomicalAnimation: 'incomplete'` in `pilot-specimens.ts`. Resolve that status wording during the implementation documentation batch instead of assuming a rig exists.

Verified existing private source-bundle recipes (task-relative names below; private absolute storage locations remain outside public Git):

- `B source bundle/source/build_pilot_v2.py`, `render_pilot.py`, `export_variants.py`; inventory `PRIVATE_SOURCE_MANIFEST.json`.
- `refinement ship/source/build_scout.py`, `render_scout.py`, `export_scout.py`, `audit_scout.py`; preserved prior recipe under `ship/reference/source/`.
- `refinement ecosystem/source/build_ecosystem.py`, `render_ecosystem.py`, `export_ecosystem.py`.

Reuse task-relative `CF_AV_BUNDLE_ROOT`, fresh-master refusal, named collections, fixed camera/light/color settings, transparent outputs, source/render/version receipts and derivative exports. Those old recipes use Cycles CPU/four threads; `UI_TOOLCHAIN.md` now directs **working copies** to the enumerated M4 Pro Metal device with actual backend/device/render evidence. Do not rewrite preserved recipes. Backup ownership is recorded in `audits/AAA_PILOT_BCD_BACKUP_20260905.json` and refinement evidence; `port/AAA_ASSET_POLICY.md` requires editable masters outside public Git, relative dependencies and independently verified backup.

## Recommended first implementation: one coherent canid family

1. Start with the exact existing pilot Wolf: fauna catalogue index **105**, seed **792844710**, heat **1**, from `pilot-specimens.ts`. Use its current whole-form portrait as the anatomy reference and protected fallback. Its exact `QuadSpec` is `legs .155`, `depth .1377`, `len .2033`, `neck .08`, `muzzle .46`, broad jaw, large ears, bushy tail, `family:'canid'`, `mammalCPlan:'canid-c1'`. `faunaResetCanidC` further defines Wolf-specific chest/head/leg/brush-tail proportions; do not flatten those into the generic spec alone.
2. Add an **offline export bridge**, not a new game taxonomy: detached genome + exact catalogue/lineage owner + complete visual key + source hashes + final morphology/proportion record → JSON consumed by a fresh Blender recipe. This bridge is missing today and is the concrete code needed before model generation. No random draws in Blender for identity traits.
3. Build one connected organism: central spine/ribcage/pelvis, neck/skull/jaw, four digitigrade joint chains and paw contacts, tail chain, ears attached to skull; continuous skinned torso/neck/limb roots. Use anatomical attachment landmarks and skin weights so head, body and limbs move together. Separate eyeballs/claws can remain separate meshes, but not disconnected limb/torso silhouettes.
4. Prove a short grounded idle (breathing/weight transfer, restrained head/ear response) plus one existing interaction pose, with an intentionally finished static pose. Candidate frames belong beside the static portrait in a bounded living-preview comparison; never overwrite the protected 132/440 painter output. Review at actual 132, 300 and 440, checking foot contact, joint direction, shoulders/hips, silhouette and seam continuity before material polish.
5. Demonstrate **variation on the same coherent anatomy**: one actual Wolf lineage using `crossGenome` and the existing hybrid-matrix recipe, plus one compatible procedural quad selected by the unchanged `planFor` from the existing audit fan. Export their actual returned records; do not hand-edit body genes to fit the model or misread `procedural-name-map.json` display indices as generator seeds. Existing audit fan: `hashInt(0xF00D, kingdomIndex*100 + heat*25 + s, 7) >>> 0`, as in `familyspread.test.ts`. Wolf hybrid dorsal sensory ridge/coat channels already have rooted locations in `speciesoverrides.ts`; preserve gradual anchor-dependent change.
6. Keep unsupported extra-leg, membranous, aquatic or mixed-owner specimens on their correct static fallback until their own compatible anatomy is implemented. A Wolf rig proves one canid family, not all eight pilot buckets. Later families extend this same genome→compatible structure→connected tissue workflow, preserving emergent seed/genome breadth.

Start delivery with a bounded prerendered frame comparison because the existing browser has no qualified Blender skeletal importer. Campaign §14.2 explicitly calls for comparing frame delivery versus compatible 2D mesh/skeletal delivery before choosing a runtime; no new engine or paid skeletal dependency is required. Measure decoded pixels/pages/upload/active animation cost before choosing counts. The existing static fallback remains usable with Effects Off, reduced motion, failed assets or unsupported morphology.

Future verification owners, not run here: domain parity and complete-genome identity controls; `port/v2/packages/art/test/familyspread.test.ts`; `tools/hybridblendcheck.mjs`, `hybridmatrix.mjs`/`hybridreviewcontract.mjs`, `artlock.mjs`; current species worker/lifecycle tests. Add only focused bridge/rig attachment/late-asset controls and source-bound native proof sheets. Visual anatomy and creative acceptance require the actual rendered comparisons; green tests alone cannot award them.
