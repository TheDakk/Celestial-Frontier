# Centipede: current contact-model and capacity conflict

Executed `node audits/ARCHETYPE_REPAIRS_20260922/12-myriapod/capacity-analysis.mjs` once. This is a fresh probe of two proposed graph representations, not another invocation of the original unsupported `appendageCounts` request. No painted record, admitted presence, landmarks, masks, binding, static battery, or native film was produced. All 16 inspected/executed source hashes remained unchanged.

**The 15-pair scenario is a conservative requested capacity case, not a complete observed pair count.** Parent has at least 15 near-side leg witnesses. Far-side leg count remains unmeasured (`null`), and complete anatomical pair count remains unmeasured (`null`). No far-side counterpart or new presence is inferred. The probe measures the candidate graph inventories only.

## Measured candidates and exact existing-owner refusals

The unchanged myriapod contract contains 29 joints: 13 core joints plus eight legs with two joints each. Its core is root, head, mandible, seg0–seg7, antennaFar, antennaNear.

| Construction | Joint count | Proposed paint-part count | Result |
| --- | --- | --- | --- |
| Preserve 13 core joints and two joints for each of 30 legs | 73 | Not admitted | Existing `createSkeletonPoseProgram` rejects with `Error: Skeleton pose: joint budget`. |
| Preserve 13 core joints and use one joint for each of 30 legs | 43 | 30 leg parts + 2 core parts = 32 | Numeric counts fit, but existing `familyContactChains` rejects with `Error: Contact contract: unsupported leg leg0Far`. |

The two-joint clone yields 30 correctly shaped contact descriptors before the independent skeleton-budget check. With the same 13 core joints, the 64-joint ceiling accommodates at most 12 complete two-joint pairs: 61 joints; 13 pairs require 65. The compact candidate's 32-part value is proposed arithmetic, not an executed painter admission or proof of sufficient part ownership for the actual image.

This establishes the conflict for these constructions under the existing owners. It does **not** prove that every conceivable representation is impossible.

## Why a single joint is not currently a planted-contact representation

`familyContactChains` requires a graph with hip → Knee → Foot (or Ankle plus terminal paw). The compact graph has only body segment → Foot. Supplying observed painted supports does not add a missing knee or degree of freedom.

`createFamilyContactSolver` creates a real two-bone chain for each descriptor, preserves upper/lower lengths, solves the declared endpoint, derives two joint rotations, checks unchanged joint limits, and retains the 8% body-scale compression cap. Its observed-support correction also uses the same two-link mechanism. A rigid one-joint leg has a fixed-radius endpoint; arbitrary planted targets under the existing body wave cannot be handled by simply deleting the second rotation from this owner.

Supporting a compact one-link model would require a new explicitly defined contact model and corresponding motion/paint behavior. That is beyond the bounded repeated-count representation exception. Removing legs from the contact inventory, assigning a false free-movement realm, reusing trunk joints as invented limb knees, or hiding extra joints outside the counted graph would not preserve the present stance contract.

## Exact owners and scope of unresolved work

- `port/v2/tools/creature-animation/repeated-anatomy.mjs:7` / `:11`: count schema currently accepts only radial/cephalopod. A count-preserving myriapod expansion must be explicit, with no new count ceiling replacing 64.
- `port/v2/apps/game/src/motion/family-templates.ts:145`: four fixed leg pairs, two-joint graph, existing limits and ratios.
- `port/v2/apps/game/src/motion/family-actions.ts:192` / `:309`: fixed A–D alternating leg sets and radial/cephalopod-only count dispatch. Additional pairs need actual count-aware motion ownership; adding graph names alone is insufficient.
- `port/v2/tools/creature-animation/anatomy-inventory.mjs:27`: folded declarations validate against the unexpanded leg inventory. Any future count path must preserve truthful validation for its newly declared legs.
- `port/v2/tools/creature-animation/family-contracts.mjs:4270` / `:4276`: exact two-link descriptor shape and compact-candidate refusal.
- `port/v2/apps/game/src/creature-rig-contact.ts:71` / `:86` / `:98` / `:157`: observed supports, two-bone solver construction, and unchanged compression cap. A compact contact model would be separate behavior here, not merely count expansion.
- `port/v2/tools/creature-animation/kinematics.ts:57` / `:71`: existing two-bone lengths and unreachable-target refusal.
- `port/v2/tools/creature-animation/skeleton-pose.mjs:5` / `:9`: unchanged 64-joint inventory admission.
- `port/v2/tools/creature-animation/part-masks.mjs:21` / `:72`: unchanged 32-part admission.
- `port/v2/tools/creature-animation/split-observed-surfaces.mjs:6` and `port/v2/apps/game/src/battle2/parts-rig.ts:98`: painted contact endpoint pins and native default family-contact integration must remain consistent with any future representation.

This is a qualification/representation stop, not an art failure. No repaint or further loop was performed. Parent owns the retained evidence packet and signed item closure; a new contact model requires separate scope.
