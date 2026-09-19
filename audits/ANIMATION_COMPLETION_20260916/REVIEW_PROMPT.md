# Consolidated review prompt for Claude

Latest continuation: [count-preserving anatomy](../COUNTED_ANATOMY_20260916/REVIEW_PROMPT.md).
The previous signing failure was resolved by signed checkpoint1e383e1c; the historical
checkpoint.json below retains the failed attempt, not the current signing state.

Review the local Celestial Frontier C2 continuation on openai/mac. Do not edit another lane,
change kits, generate art, rewrite history, run inference or write to GitHub. PR42 is parked.
Start with ROADMAP.md, CREATURE_ANIMATION.md, ATTACK_ANATOMY.md and this folder's README/checks.
The work is saved locally; checkpoint.json identifies whether signing completed. Use current
files/source hashes rather than assuming the last commit contains the full candidate.

Nick's central requirement: fluid, whole-body animated creatures driven by actual anatomy,
across Earth species and procedural combinations. Reject species-name/seed/hash exceptions
in shared motion or deformation. Authored landmark/mask observations may be master-specific;
the procedural painter must emit its true geometry, material and capabilities. Do not confuse
631 routed names or169 curve entries with complete painted-species support.

Review the accumulated work in this order (paths under audits):

1. C2_CONTINUOUS_SKIN_20260916: source paint conservation, connected deformation, exact rest,
   impossible-pose refusal, compiled/Wasm solve and prior Civet/fox/procedural evidence.
2. BATTLE_FACING, BATTLE_NECK_REPAIR, BATTLE_THROAT_JOIN and BATTLE_IMPACT_POLISH_20260916:
   head facing, lower-body/throat restoration and transitions. Preserve accepted source art.
3. FAMILY_REAL_CREATURE_REVIEW, HABITAT_BATTLE and UNIVERSAL_ANIMATION_20260916:
   actual frog/bird/fish fits versus synthetic topology contracts; water/air/ground rules.
4. PROCEDURAL_PAINTED_DIRECTION, PAINTED_VARIATION_MOTION and PAINTED_BIOME_ENCOUNTER_20260916:
   painted procedural direction, multiple proportions, deterministic biome and multi-creature
   fight. Distinguish fitted authored art from automatic anatomy extraction.
5. ANATOMY_ATTACKS and FULL_SPECIES_ATTACKS_20260916: observed weapons/contact phases, full
   Earth catalogue, habitat and explicit unsupported structures. Retain failed follow-through
   and generic-weapon controls. Historical counts in those logs remain historical.
6. ANIMATION_COMPLETION_20260916 (current): eight added motions, post-easing limits, exact
   secondary sampling, explicit absence, broad-family refusals and shared fold repair.

For the current code examine motion/{timeline,gsap-adapter,overlay,additional-actions,
family-actions,family-templates,body-card}.ts; anatomy-attacks.ts; earth-fauna-profiles.ts;
packages/art/src/quadruped-anatomy.ts; tools/creature-animation/{anatomy-inventory,family-record,
arap-skin,orientation-projector}.mjs; and tools/animation-completion/. All paths are under
port/v2. The producer SHA has changed to600e413b90587a5d3b2f40ace148a95e6e692fb82f3b4d2eba2f17b12f0a8660;
historical runners pinned to6a206acd are not certification of this producer.

Verify especially:

- Bounds apply to actual published rotations after all easing/secondary motion and projected
  signs. Root offsets remain root-only. Empty capabilities cannot select an invented bite.
- Absence is explicit/hash-bound; missing required observations still fail. Wrong broad-family
  mappings do not create a fish-shaped whale, a crab with spider joints or a sessile jelly.
- The orientation repair has no species branches, does not move hard pins or alter clips,
  preserves normal fast-path results and retains atomic refusal. Inspect the fixed-source
  failed cast control and Float32 failure; pure geometry alone is insufficient.
- Gate every current family action, not only idle/one attack/hit. Inspect the named per-action
  frames and films; cast/victory are where the broader check found failures. DIAGNOSTIC_PASS
  is not final visual or performance acceptance. Some timings exceed2ms; report them.
- Judge animal-like intent, head/neck continuity, feet/fins/wings, effect/contact placement,
  silhouettes at extremes and smooth returns. Report visually bad poses even when all numerical
  checks pass. No generic placeholders may count as completed species or source recordings.

Return concrete defects with file/line or frame/action/time, severity, expected/actual result,
a negative control and a bounded shared repair. Separate regressions from remaining topology,
art, integration and device qualification. Nick owns final visual acceptance.

C3 is separately reviewable via audio-production/REVIEW_PROMPT.md and audio-production/REVIEW_PACKS.md;
its delivered sources/renders do not imply authentic coverage of all631 fauna. C1 mechanical
intake is complete, final Wild acceptance remains Nick's. C4 sheets still stop12 at a time.
C5 and the smaller phone finisher/weather decisions retain the ROADMAP gates. No promotion
or kit change is authorized by this review request.
