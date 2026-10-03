# Attack anatomy and physical motion

Matches code as of October 2, 2026 (D31, Dakk): limbless and sessile families with no admitted
melee verb — annelid, sessile-filter, gastropod and bivalve — fight with a CAST attack instead of
throwing `no admitted <family> melee`. `motion/cast-attack.ts` owns the rows below; the battle
plan switches such an attacker's delivery to `cast` whatever its theme (no melee clip is looked
up, no lunge beyond the stage's existing caster approach), plays a small whole-body pulse and
launches the theme effect from the declared emitter landmark, else the painted body centre, at
the launch beat; the effect travels to the target's body. No melee row, weapon, outcome, reward
or RNG changed; every other family's clips and plans are byte-identical. Evidence and negative
controls: audits/CAST_ATTACK_D31_20261002/README.md.

| Family | Cast (D31) | Effect launch | Pulse |
| --- | --- | --- | --- |
| Annelid | Body pulse cast | Painted body centre (no mouth landmark) | Whole chain gathers up (total chain turn ≈ 2× the gather angle), snaps out nearly flat, small root lift |
| Sessile filter | Body pulse cast | Declared `aperture` (osculum), else body centre | Root and base fixed; body/crown lean away, then through rest toward the target |
| Gastropod | Body pulse cast | Declared `mouth`, else body centre | Foot chain gathers up, head lifts; mouth opens on release; rigid shell still |
| Bivalve | Body pulse cast | Declared `siphon` (optional), else body centre | Valves open on the gather and clap on the release; soft mantle/siphon/foot pulse |

Pulse timing is the kit §5 cast row (rise 180, hold 120, release 90, settle 220) scaled by the
mass class; amplitudes follow the body's kit §6 material (slick/warty: gather 12°, stretch,
overshoot .15; translucent: two damped wobbles; plated/chitinous/crystalline: no stretch, dead
stop). Directions come from the record's own landmarks, never from a species name. The
families' other actions are unchanged. A record later admitting a melee verb keeps melee.

Matches code as of September17,2026: observed brachyuran records declare `source-pincers`.
One shared projection computes closure direction/amplitude from palm and opposing painted tips;
unsupported/degenerate gapes refuse. Pinch anticipation opens, strike closes, recovery returns
to rest while the root and allwalking contacts remain fixed. Other stationary specialized
candidate actions no longer reuse locomotion leg waves. Five actual crab source graphs and
mirrored controls prove contact positions and closure; the old fixed25degree swing fails.
Native shape, walking stance, habitat/arena and physical phone qualification remain distinct.
See audits/ANATOMY_COMPLETION_20260917/ANATOMY_STATUS.md. No combat math or reward change.

Matches code as of September 17, 2026: source-declared bark/foliage flora cards have no physical
weapons even when unrelated animal genes are present. All four plant actions retain fixed roots;
branch-count motion covers every declared branch. Native flora captures remain unqualified for
visual shape and phone budgets. See audits/ANATOMY_COMPLETION_20260917/README.md. No combat
math, battle2 integration or attack capability is granted by a new binding artifact.

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

Matches code as of October 2, 2026: 33 melee rows across 13 animal families; the two plant families remain explicitly unsupported for melee.

| Family | Existing physical moves | Required observed parts |
| --- | --- | --- |
| Brachyuran crab | Pincer pinch | Observed near palm, fixed tip, dactyl root and dactyl tip; ground or water, with contact at the dactyl tip |
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
| Annelid, sessile filter, gastropod, bivalve | No melee clip; D31 cast (see the cast table above) | Cast, not a melee row |
| Woody plant | No melee clip in current library | Explicit unsupported result |
| Herbaceous plant | No melee clip in current library | Explicit unsupported result |

All 33 physical melee rows have an explicit action, weapon capability, required joint set,
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

The 33 melee rows across 13 animal families are contract-tested; the two plant families retain explicit unsupported results. The actual bird card produces an airborne
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
