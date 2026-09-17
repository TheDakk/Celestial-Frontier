# Attack anatomy and physical motion

[Painted-fit and missing-structure continuation](audits/PAINTED_FITS_AND_58_20260916/README.md),
matches code as of September 16, 2026: accepted Skink and Beetle masters now have hash-bound
parts/skin and native full-action diagnostics (60 fps; 1.2/1.6 ms rig-update p95; exact rest).
Twelve specialized structure/curve candidates share intake and motion contracts. A 44-joint
compact-crab record compiles the actual painter's eight legs, pincers and eyestalks without
inventing a lobster abdomen. Root/Knee/Foot leg slack is measured rather than silently skipped.
The 58 missing names remain unqualified pending observations, painted masks/fit, full motion,
contact and visual acceptance; candidate code is not completed species coverage. Current ledger:
audits/PAINTED_FITS_AND_58_20260916/coverage-compact-crab.json. Original masters are unchanged.

Matches code as of September 16, 2026. `port/v2/apps/game/src/anatomy-attacks.ts` connects
admitted anatomy to the existing Motion Kit action library. This is a presentation owner;
CombatCore still owns abilities, combat outcomes, damage and all eleven theme identities.
No kit wording changed. `abilityOf` is recorded separately; a passive ability name such as
Sand Thorns does not turn a creature's physical strike into a thorn-shaped body movement.

## Anatomy table

| Family | Existing physical moves | Required observed parts |
| --- | --- | --- |
| Quadruped | Bite, foreclaw rake, horn thrust, headbutt, tail lash, hoof kick | Jaw, forepaw chain, head/neck, or complete tail chain as appropriate |
| Hopper | Hind-leg kick, leaping bite | Hind-leg chain or jaw |
| Bird | Beak strike, talon strike, grounded foot kick | Beak/neck, wing/foot chain, or grounded leg/foot |
| Fish | Swimming bite, body strike, caudal sweep | Jaw, body/spine or caudal chain; water only |
| Insect | Mandible snap, thorax shove | Actual mandible/head or thorax/body |
| Serpent | Coiled strike, body coil | Jaw/neck segments or segment chain |
| Arachnid | Chelicera bite, stinger arc, body shove | Chelicerae, actual sting/abdomen or body |
| Radial | Radial arm strike, bell pulse | Bell and/or arm chain; water only |
| Myriapod | Mandible snap, rear sting, segment shove | Mandible, declared terminal stinging chain or body segments |
| Cephalopod | Arm/feeding-tentacle lash, beak lunge | Striking chain or head/mantle; water only |
| Membrane flyer | Flying bite, foot rake | Jaw or feet, supported by wing joints |
| Primate | Arm strike, bite | Arm/hand chain or jaw |
| Woody plant | No melee clip in current library | Explicit unsupported result |
| Herbaceous plant | No melee clip in current library | Explicit unsupported result |

All32 physical melee rows have an explicit action, weapon capability, required joint set,
contact joint and compatible physical medium. Required parts must exist in the admitted
body card. Missing claws, wings, jaws or tails cannot silently fall back to a different move.
Current family skeleton templates are not evidence that every Earth/procedural species has
all of their nominal appendages or weapons.

For counted cephalopod records, lash contact binds to a declared feeding tentacle when
present, otherwise the central striking arm. The previous arm0 contact was stationary
while the default clip moved arm3/arm4; that mismatch is retained as a failing control.
No contact is inferred from the creature name or from a missing landmark. See the
[counted anatomy review](audits/COUNTED_ANATOMY_20260916/README.md).

## Capability authority and inheritance

A procedural painter must emit an observed weapon declaration: `{recordHash, source, weapons}`.
The hash must match the already-admitted anatomy record; the declaration describes actual
painted anatomy, not generic family defaults. This is necessary because the current body-card
quadruped defaults include claws even for a hypothetical hoofed animal. Authored masters use
an equivalent per-master observation. The three review declarations are retained in
`audits/ANATOMY_ATTACKS_20260916/weapon-declarations.json`. The crystalline master admits bite
only: visible horn-like paint has no authored horn contact landmark yet. No invented gore.

`earth-fauna-profiles.ts` now covers all631 current `_EARTH_NAMES.fauna` identities exactly
once through83 explicit profiles. Profiles describe gameplay intent, candidate templates,
physical media and fitting constraints; they do not certify anatomy or complete animation.
Unknown names, wrong templates and incompatible media refuse. Named genes cannot overwrite
the table. Conditional gore/sting needs a matching record-bound weapon observation.
The body-card compiler no longer assigns generic claws to hoofed named animals or default
walk to every uncalibrated Earth swimmer; unknown masses remain explicitly marked medium.
A new catalogue identity, stale entry or duplicate fails the live-catalogue audit.

`tools/species-attacks/audit.mjs NEW_DIRECTORY` produces the source-hashed full report and
searchable review board.573 names have at least one matching motion candidate;
58 need new topology. No identity with a candidate template lacks every motion, but this
does not mean every intended action or every body configuration is implemented. Even candidate
names still need species-correct fitted masters, absence declarations and visual proof.
Some intended repertoires and variable appendage inventories remain incomplete.
These counts neither measure full repertoire completion nor physical-device qualification.

The quadruped painter now observes its resolved foot branch. Paw/plantigrade/claw ink can
emit claw at foreNearPaw; hoof/cloven emit kick instead; pad/flipper cannot claim claws.
Jaw contact does not imply teeth.
The observer is included in the sealed anatomy record and checked against the mask replay.
The native procedural capture exports a matching weapons.json; three unchanged-ink seed
controls are retained under FULL_SPECIES_ATTACKS_20260916/painter-01. Other painter owners
still need equivalent weapon observations; the new emission is not universal generation.

`attackRepertoire(card, medium, declaration)` returns admitted rows and explicit rejection
reasons. `compileAnatomyAttack(card, medium, ordinal, requestedVerb?, declaration?)` selects
only those rows, deterministically by species identity plus attack ordinal or explicit move.
It returns the existing mass/material/body-proportion-aware timeline, contact joint and
contact time. Shared templates supply motion; no per-creature curve edits. Same species and
context reproduce the same attack. Distinct species can share a physical move while their
proportions, mass, material response and signature repertoire give it individual character.

## Contact and motion continuity

Claw contact uses the extended launch pose at the end of the strike phase. Other current
moves use the authored contact/smear pose. Do not estimate impact as a percentage of total
clip duration: secondary settling changes that duration. The preview fixes its lunge endpoint
from the published weapon mesh at that exact pose. Retraction then moves the limb freely;
tracking the paw through follow-through pulled the whole animal through its opponent.
All creatures share hitstop, blended transitions and the same return flow. A screen-facing
order gate rejects the reproduced old follow-through. This is not full collision/foot physics.

## Qualification and next work

The14-family/32-row matrix is contract-tested. The actual bird card produces an airborne
wing/foot strike, and the fish card admits swimming bite and refuses air. Those tests do not
qualify new painted aerial contact visually. The live `/anatomy-battle/` proof measures only
three existing painted quadrupeds, using foreclaw/bite/foreclaw. Effects remain the labelled
existing Wild artwork. HP is scripted; the proof is silent and separate from normal gameplay.
The supported painting/anatomy/weapon records are distinct from complete procedural coverage.

Next qualification: remaining painter weapon emission; species-correct fits for the full register; precise
horn/talon/beak/appendage surface anchors; projected views suitable for each attack; physical
habitat paths and cross-medium ranged choreography; actual event/theme/sound integration;
painted proofs for every supported anatomy family, then physical iPhone timing/visual review.
Ranged/cast actions already exist in the motion library but are not new melee capability rows.
Do not invent weapons or relabel an unqualified move to fill a coverage count.
