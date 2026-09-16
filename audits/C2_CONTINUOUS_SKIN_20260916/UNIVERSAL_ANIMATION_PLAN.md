# Universal creature animation — recorded direction, September 16

Nick's requirement: bring the approved painted artwork to life as fluid,
whole-body creatures in biome arenas. Attacks must convey intent and weight
through anticipation, push-off, strike, impact, recoil and recovery, with
coherent secondary motion. A sliding or wobbling portrait does not meet it.
The system must cover named Earth animals and procedural organisms across land,
air, water and rooted life, including their different shapes, sizes and anatomy.

## Architecture to carry forward

1. **Shared runtime.** Reuse source-bound asset admission, atlas loading, skin
   deformation, pose application, action blending, explicit-time replay,
   attachment/contact checks, effects/audio timing and frame-budget handling.
   Collect all joint targets and publish one atomically validated pose per
   creature per frame through the existing frame target; do not run the full
   deformation separately for each joint callback.
2. **Anatomy-specific templates.** Each family owns its joint graph, valid
   proportion envelope, locomotion, attack vocabulary and material-sensitive
   secondary motion. Quadruped movement is not evidence for wings, fins,
   serpentine bodies, tentacles, many-legged creatures or flexible plants.
3. **Painter-owned resolved anatomy.** The winning painter emits the actual
   rendered limb inventory, joint locations, geometry, part masks, materials,
   depth and attachment/occlusion relationships. Authored masters use hash-bound
   declarations. Named Earth anatomy is retained; unrelated genes cannot
   overwrite it. Seeds choose lawful variation, never the clock.
4. **Real surface topology.** Anatomical attachments share skin; overlapping
   independent limbs remain separate. Each organism's support contacts and
   appendages follow its record, not Civet coordinates or per-creature clips.
   Hidden surfaces and alternate views require real source coverage and their
   own admission. They cannot be invented by stretching a visible portrait.
5. **Family qualification before coverage claims.** Test the authored reference
   and independent procedural reuse controls, including the generated extremes
   of size, proportions, limb count and material. Retain failing mutants and
   actual full-motion evidence. A finite specimen proves its tested envelope;
   registry membership alone does not prove a functioning painter integration.

## Ordered delivery

- Finish C2's Civet, fox and painter-observed procedural quadruped proof with one
  shared template/curve set, unchanged masters and exact rest parity. Inspect
  full ten-second arena actions, not only isolated geometry metrics.
- Carry the proven runtime into the actual game through the agreed
  CreatureRigV1 / PoseTarget contract and the owning battle module. Keep
  ordinary-game integration distinct from the standalone study.
- Connect actual winning painters to the family inventories published in
  LOG-A11.md and LOG-B.md: quadruped, hopper, biped-bird, fish, insect, serpent,
  arachnid, radial, plant-woody, plant-herb, myriapod, cephalopod, flyer-membrane
  and primate. These are existing motion inventories, not a new kit amendment.
  Audit actual game routing for uncovered forms; no quiet default to quadruped.
- Qualify families in Nick's approved rollout order: mammal quadruped, bird,
  fish, insect, reptile, then the remaining forms. Map each actual painter
  anatomy to its suitable template; painter families and template IDs are
  related inventories, not necessarily one-to-one.
- For each family, prove contacts or buoyancy/flight/rooting as appropriate,
  appendage continuity, material motion, readable attack and recovery, source
  identity, deterministic replay and extreme-proportion behavior.
- Add source-bound looking/turning views and hidden-surface coverage where the
  action requires them. In-view aim is separate from turning the whole animal
  or revealing previously unseen anatomy.
- Measure physical iPhone performance separately. Target 60 fps on Mac and
  the approved 30 fps phone budget; preserve identity and attack readability
  when selecting a measured device tier. No universal device claim from a
  desktop proof.

## Current integration boundary

The real C2 inputs are two hash-bound authored masters (Civet and fox) and one
painter-observed four-legged procedural organism with a banded tail, seed
1597751321, owner `resolveProceduralCanvas:quad/faunaQuadruped`. The live
`CreatureRigV1` loader, part-mask intake and planted contact solver currently
admit the quadruped graph. The fourteen published motion inventories are
producer templates; their synthetic fixtures are not real painter/skin coverage.

The current painter capture deliberately refuses reset Earth mammal owners,
pinnipeds/gliders, extra leg pairs, other tail routes and non-quadruped families.
These refusals prevent false qualification and remain until each actual owner's
mask/geometry adapter is implemented. Expanding those routes must also replace
the fixed fore/hind naming that would overwrite joints for additional leg pairs.

Existing family inventories have fixed appendage counts (for example bird wing
root/tip pairs, fish dorsal/caudal/paired pectorals, six insect legs, six radial
arms, eight cephalopod arms and eight myriapod leg chains). Qualification must
compare each to what the winning painter actually draws, emit stable names for
its real inventory, and reject unsupported count variants until their templates
are implemented. A label such as "fish" or "insect" cannot supply missing anatomy.

No ordinary-game caller currently loads this rig/performance system. The
Platypus opponent in the current study remains a labelled portrait; production
battle qualification must exercise two fully animated combatants together.
The aim utility also has no source-bound view declarations on these three
inputs, so looking and turning coverage is future work rather than an existing
capability.
See `CREATURE_ANIMATION.md`, the current rig/part-mask admission, and
`quadrupedoverrides.ts` / `speciesoverrides.ts` for the corresponding source owners.

## Acceptance and scope

Technical acceptance requires intact painted shape through the complete action,
no tearing/spikes, truthful source/rest checks, appropriate planted or airborne
contact, deterministic replay and measured runtime budgets. Visual acceptance
requires Nick to judge that the animal feels alive and the attack feels
forceful. A passing, visually accepted three-creature C2 proof will establish
the first qualified family envelope; it will not establish that every generated
organism is already animated.

This plan records the September 16 user direction. It does not change any kit
wording or approve new image/sound classes. Existing artwork-review stops,
Claude's module ownership, no-new-branch rule and GitHub-step-none remain.

## Shared pose foundation implemented — September 16

The actual rig now delegates joint evaluation to `skeleton-pose.mjs`: a supplied
parent-first graph, exact landmark inventory and body axis replace assumptions
inside the shared evaluator. Quadruped asset admission remains narrow. All 14
motion templates and 161 actions interoperate over 4,644 samples; thirteen inputs
are explicitly synthetic. Native regression keeps all 30 existing pose PNGs
byte-identical and the three films inside their measured budget.

The optional quadruped observer now refuses extra leg pairs rather than silently
overwriting limb records. Actual owner/count adaptation is still required before
those generated creatures can animate. `audits/UNIVERSAL_ANIMATION_20260916/`
records tests, source hashes and per-family readiness. Next is real bird painter
geometry/part observation in the approved order, followed by family admission,
contact/skin qualification and independent painted reuse controls. The coverage
audit must also account for specialist Earth owners, fungi and microbes instead
of defaulting them to quadruped or plant templates.

## All-family consumer implemented — September 16 continuation

The runtime and parts intake now select the exact closed contract for all fourteen families;
old references above to quadruped-only asset admission describe the preceding state. The
quadruped contact solver and legacy seam bridge remain specialized. Real topology observation
for birds/radial/myriapod/cephalopod now exposes appendage counts and visibility, without
pretending these partial observations are finished rig records. Fourteen synthetic calibration
atlases and 910 producer bound comparisons pass. Actual painting and physical phone readiness
remain unqualified. See audits/UNIVERSAL_FAMILIES_20260916/README.md for evidence and the pending
motion-module ownership exception needed to address real count variants without truncation.

## September 16 facing follow-up

Nick's visual review requires opponent-facing mobile heads and both combatants animated.
BATTLE_FACING_20260916 exercises an actual Platypus rig and Civet turnaround profile. The
right-side turn/contact contract is shared. Authored head-view data is source/hash-bound;
procedural heads need equivalent actual painter view coverage. A profile mesh cannot invent
back/front surfaces. Current head/shoulder fitting, independent replacement-head ear/jaw
articulation, view transitions and rendered second-actor qualification remain explicit gates.

## September 16 body-coverage correction

A head view may replace only the head subtree: neck/chest/body paint must remain present.
BATTLE_NECK_REPAIR_20260916 measures the actual native rendered body against a protected
body-only render and reproduces the former neck-hidden defect as a failing control. Source
view supports now carry local ear/jaw articulation, with pose-to-source orientation data and
continuous field integration. Apply this coverage rule to other families; do not infer their
source views or anatomy from the Civet binding.

## September 16 — attachment coverage, including replacement views

Protected body pixels alone missed a gap under the new Civet chin. BATTLE_THROAT_JOIN_20260916
adds a generic published-surface attachment evaluator and actual native throat coverage through
motion. Every family must supply its own source-painted attachment inventory, including view
changes, variable appendages and intentional openings. The Civet fit must never be reused as a
universal geometry offset. All 14 vocabulary controls are synthetic; winning painter records,
count-aware motion and real family extremes remain required. See the package's
UNIVERSAL_COVERAGE_REVIEW.md for the explicit admission/promotion rule and uncovered anatomy.
