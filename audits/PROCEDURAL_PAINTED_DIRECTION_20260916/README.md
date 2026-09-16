# Procedural painted direction — September16

Nick rejected the raw canvas procedural examples as visually poor and asked for Earth-quality
painting plus fluid whole-animal motion across generated anatomy. Those examples remain useful
mechanical controls; they are not approved procedural art. The Earth masters were authored with
the kit, while the new generated-rig diagnostic bypassed that pipeline. The production local AI
adapter still covers the bounded Earth recipe; universal painted procedural output is not wired.

Nick approved candidate02’s **visual direction across the whole game** after this review;
see [his acceptance](NICK_DIRECTION_ACCEPTANCE.md). Remaining intake and animation work stays
explicit: directionAccepted=true, masterIntakeAccepted=false, animationReady=false.

## This batch

`compileProceduralQuadrupedProofV43` in landfall-conditioning.ts reuses the existing kit
interpreter's reference/style/layout/technical/negative blocks, compiles the comparison system
card from the canonical snapshot, and substitutes actual procedural identity, proportions,
palette and observed material. The canonical Earth light is a labelled comparison fixture,
not a fabricated home-world claim or an added Earth resident. Inputs come from planFor,
speciesGenomePalette and hash-bound painter observations. No kit wording or frozen block changed.

The adapter is deliberately bounded to the observed four-leg/banded-tail/normal-eye quadrupeds;
it refuses named Earth identity, mismatched identity/material, unsupported anatomy, invalid
palette and pink-purple pigment conflicting with the magenta key. It retains the genome rather
than silently recolouring it. Seed10052 exposes the pigment conflict. Final compiled-02 records
that refusal; compiled-01 is retained as the actual earlier source used for painting seed10271.
Neither compilation grants animationReady or qualityAccepted. It is authoring code, not a
local model run or ordinary-game integration.

## Painted evidence

The built-in image tool painted seed10271 from the approved Discovery Atlas and its exact canvas
anatomy guide. Original master hashes are unchanged; both full sent prompts are retained. The
first attempt changed proportions too much, emitted transparency and missed margins. One
correction reduced leg length and supplied an opaque magenta field. The second candidate has
painted fur, rosette markings, banded tail and four visible paws, but is still a direction review:
its magenta is nonuniform and horizontal safe margins miss the kit target. The overall painted direction is now approved by Nick; exact source-proportion fidelity
still needs verification. It is not an accepted master and is not rigged.

Candidate01: procedural-10271-candidate-01.png (preserved failure).
Candidate02: procedural-10271-candidate-02.png (direction candidate).
Prompt provenance: candidate-01-sent-prompt.txt, candidate-02-sent-prompt.txt, compiled-01.
Read-only intake: image-intake.json, image-intake-refined.json. The first strict-RGB instrument
counted nonuniform key pixels as subject; the second hue-based framing check records that
instrument problem without editing the image. No claim of automatic anatomy/quality acceptance.
Comparison: http://127.0.0.1:49816/painted-procedural/ .

Tests:23 focused tests in tests-final.txt, including named-identity, material, extra-leg/tail,
key-conflict and corrupt-palette negative controls; game typecheck and root validation pass.
No main.ts, motion curve, approved asset, kit, sibling worktree or GitHub change.

## Complete anatomy production plan

Source inventory: anatomy-contract-inventory.json. Contract existence is not production coverage.
Every family needs the same pipeline: deterministic game anatomy/material/realm → kit-compiled
painted master → hash-bound observed painted parts/landmarks → family locomotion and attack
curves → contact/seam/silhouette/extreme-pose gates → biome-appropriate stage → physical device
budget and Nick's visual acceptance. A generated paint must never inherit the old canvas's
pixel masks or hashes. Hidden surfaces and head views need authored support; a single picture
cannot reveal paint that was never there. Turnarounds follow approval of the token, per unchanged4E.

| Family | Required movement and attack emphasis |
| --- | --- |
| quadruped | weight transfer, planted paws, turns, bite/claw/body-driven lunge |
| hopper | compressed crouch, coherent push-off, arc and supported landing |
| biped-bird | coordinated wings, body, legs, tail and beak; ground/air distinction |
| fish | body wave, tail propulsion, fin steering; stay in compatible water |
| insect | phase-coordinated legs, body segments, mandibles and actual wing inventory |
| serpent | continuous body wave/coiling, head aim and supported strike |
| arachnid | actual leg inventory, alternate support groups, abdomen and jaws |
| radial | count-aware arms, radial support and attack direction |
| plant-woody | anchored root, trunk/branch bend and source-owned attack structures |
| plant-herb | anchored base, stem/leaves and source-owned plant motion |
| myriapod | count-aware segment wave, leg phasing and head-led attack |
| cephalopod | mantle motion, fin/arm coordination and actual arm/tentacle counts |
| flyer-membrane | continuous membranes, shoulder/wrist/finger motion, stable wing joins |
| primate | torso/shoulder/arm/hand articulation, supported feet and readable strikes |

Progression: approve painted procedural visual direction; fit and qualify that painted proof;
complete additional painter topology/material exports, then paint/review library sheets in the
approved batches and qualify real variations in every family. Keep existing source-driven named
Earth anatomy. Variation is bounded by its family and physical habitat; refuse unsupported forms
rather than silently applying a quadruped or counting synthetic fixtures as coverage. Phone local
finisher selection remains separate; the hosted authoring tool does not establish on-phone AI.

OpenAI/Codex continues locally on openai/mac. Claude need not open or sync now. One consolidated
review prompt accompanies this package. No GitHub step; PR42 parked. No history rewrite.
