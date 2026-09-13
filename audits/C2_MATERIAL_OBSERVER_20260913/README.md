# C2 prerequisite — painted material observer and Pack 2 compatibility

Pack2 imported verbatim in6030e636: CONTRACTS.md§§2/5/6, LOG-A1/A2 and incoming log preserved
as LOG-CLAUDE-PACK2.md. Receipt: ../LONG_SESSION_20260913/pack2-receipt.json. Claude engines
reported by Nick: motion5d0abd01, effectsc03aad82, world-life50a7fbd2, sound5f22581b. These
commits/modules are not in this checkout; their test claims have not been locally rerun.

The observer previously emitted spec.mat/family coat even when the actual torso, head, neck
and limb painter selected spec.alien.skin. It now reports spec.alien.skin first, then the
actual coat selection. No raw-genome override for named species and no painting change.
Named material values remain unchanged. Old captured records remain immutable historical
evidence; regenerate the procedural record through the observer during the parts-rig proof.

Two tests call the real faunaQuadruped painter with a recording Canvas context and spy on
the actual alienSkin calls. Five skin routes (chitinous, plated, warty, translucent,
crystalline) match the emitted record. Draw-command digests match with observation enabled
and disabled. A fake fur record fails the same expectation. Named Deer ignores raw alien
skin genes; procedural fur follows the actual coat. Pre-fix failure retained. Tests, full
TypeScript and root validation pass. These are command-stream controls, not a native pixel
capture or a claim that C2's visual proof is complete.

Pack2 A2 parser requires alpha bounds: added alphaBoundsPixels to each registered Wild phase
in ../WILD_V43_PROOF_20260913/wild-anchors.json, measured from that PNG's alpha. Hashes match,
images unchanged. effects-bounds.json retains the measurements; intake.mjs now emits them.
No new image, despill pass or fallback-anchor alteration.

C2 rig contract remains CreatureRigV1; applyPose joint radians and dx/dy in body-length units
must target record joint names and Claude's setJoint PoseTarget. No parts rig implementation,
atlas, turn, capture, source sound, kit edit, main.ts edit, Claude-module edit, merge, GitHub
write or history rewrite in this prerequisite batch. C1 Wild image review still precedes staging.
