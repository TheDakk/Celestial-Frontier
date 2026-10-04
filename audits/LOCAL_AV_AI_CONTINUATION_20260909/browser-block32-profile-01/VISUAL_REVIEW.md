# Independent visual review — block-32 derivative

Date: 2026-09-09. AI visual review of the two native 768 × 432 PNGs below, with the approved full landfall and selected Civet identity references. Both outputs are unretouched. This review ran no generation, tests, or numerical image-difference analysis and records no human acceptance.

**Verdict: no obvious gross visual regression in this one comparison; the art acceptance bar remains open.** The derivative preserves the original profiled scene’s composition, recognizable animals, lighting, and environmental contact at native inspection. It does not visibly repair the remaining identity and detail limitations. `qualityAccepted: false` remains appropriate.

## Side-by-side findings

| Area | Derivative compared with original profiled output | Remaining limitation |
| --- | --- | --- |
| Composition and count | Nearly identical riverbank layout: one visible Civet body on the right bank, one Platypus at the left water edge, and one Frog on the foreground rock. No newly doubled torso or second Civet tail is apparent. | The Civet’s tail remains crowded against the right edge. This is one scene, not proof that required counts survive other seeds or resolutions. |
| Civet identity and anatomy | The pale pointed muzzle, dark lateral mask, amber eye, tawny spotted coat, short legs, and single ringed tail remain readable. No obvious new limb deformation is visible. | Exact spot arrangement, fur structure, and body proportions are not established as matches to the selected canonical Civet. The animal still appears relatively bright, smooth, and dry against the wet gray-green surroundings. |
| Platypus and Frog | Their positions, broad silhouettes, and visible bill/folded hind legs remain comparable. | The Platypus remains very rounded and simplified, with its rear paddle and webbed feet insufficiently clear. The small Frog’s toes, limb anatomy, and skin pattern cannot be confidently qualified at this size. |
| Flora | The orange-fruited tree, berry groundcover, and palmate-leaf plants with upright red clusters remain visually consistent between outputs. | Persimmon calyx details are unresolved. Cranberry foliage reads as generic glossy berry groundcover rather than clearly diagnostic small runner foliage. Devil’s Club spines and fine leaf/cluster structure remain unresolved. Botanical acceptance is still pending. |
| Grounding and atmosphere | Mossy contact, foreground overlap, cool diffuse light, mist, rain, reflective water, and forest depth stay coherent. The Civet’s feet appear to meet the bank rather than float in the water. | The subject/material contrast above still limits the impression of a completely unified wet painting. No new painted rectangle, conspicuous alpha fringe, large palette shift, or obvious block artifact was seen at native size. |
| Detail | Native inspection shows comparable readable texture and scene density. | Different output hashes mean these are not byte-identical PNGs. Visual inspection alone establishes neither pixel equivalence nor identical numerical inference. |

The approved full landfall remains the composition and painting-quality reference. Its own Civet differs from the separately selected identity master; approval of that scene does not replace the identity master or establish exact species correctness in either local output.

## Evidence and limits

| Artifact | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `browser-block32-profile-01/raw-output.png` | 768 × 432 | 886,736 | `446d0a21aadf253df781c4d3a21a14a5800abaf598cbf7052f2677dc460d633a` |
| `browser-native-profile-02/raw-output.png` | 768 × 432 | 887,249 | `84c2aa9fd18841d6b3fdfe0a412a260136cbcc1738824a648d77347f92103d68` |
| `audits/MIDGAME_ART_DIRECTION_20260908/03-earth-full-landfall.png` | 1672 × 941 | 3,156,154 | `93c1b9cd6a57dc087cd4896ce05cb6025fbe5877dcba3a52f7b0ab6268289eec` |
| `audits/CREATURE_SCENE_COHESION_20260908/civet-selected-v1.webp` | 768 × 512 | 179,816 | `186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365` |

Both recorded recipes use seed 133, four steps, the same two reference hashes, and prompt SHA-256 `3a67a434794a7f417a08af97892d234617b960f6884f6ea1bbbe62856b955bfc`. The derivative uses `q8-block32-repacked-v1` from parent model revision `3bffc0efef1d9f84727036cdbc44df3b6ab51131`; its conversion and pin review is retained in [repack-conversion-01/REVIEW.md](../repack-conversion-01/REVIEW.md).

The run records report approximately 69.0 seconds for the derivative and 238.8 seconds for the original profiled output. That paired observation supports further evaluation of this optimization; it is not a general hardware benchmark, mobile qualification, quality acceptance, or permission to ship the model. Browser inference completion also does not establish game integration, complete-genome fidelity, Compendium extraction, animation assets, or all-world consistency.

The original profiled PNG has the same hash as the earlier identity-reference output, whose [visual review](../browser-identity-reference/VISUAL_REVIEW.md) remains applicable. The rejected [1024 experiment](../browser-1024-quality-01/VISUAL_REVIEW.md), including its doubled/fused Civet and shoreline-contact defects, remains preserved unchanged. This successful 768 comparison is not a repair or a rerun of that experiment. No further tuning or generation was performed for this review.
