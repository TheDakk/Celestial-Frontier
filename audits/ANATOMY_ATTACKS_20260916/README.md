# Anatomy-selected attacks in the painted clearing

Live: http://127.0.0.1:49816/anatomy-battle/

Final evidence: native-04. The original rosette and broad-bodied painted quadrupeds now use
foreclaw rake; the crystal animal uses bite. Shared family curves are unchanged. Existing
masters/records/kits/genomes remain immutable; new weapon-declarations.json binds observed
capabilities to each exact record hash. Read ATTACK_ANATOMY.md at the repository root for
the 14-family contract matrix and current scope.

## What changed

- All24 existing melee motions have explicit weapon, required-joint, physical-medium and
  contact-joint rows. Unknown Earth species need a declaration; plants remain unsupported
  for melee because their current library has no attack clips. Procedural family defaults
  cannot establish claws or stingers: a hash-bound painter observation is required.
- Select from admitted attacks by stable species identity and attack ordinal. Same anatomy
  inherits family motion plus compiled mass, proportions and material response. No custom
  creature curves or rewritten combat rules. Actual abilityOf data is recorded separately:
  these actors have Fire Reckoning I / Sand Thorns I, not the old hard-coded Savage Maw.
- Exact authored contact phase replaces the42%-of-total-duration approximation. Claw contact
  occurs at the extended strike pose; bite occurs at the contact/smear pose. Position the
  lunge from that fixed published weapon endpoint and let the limb retract independently.
- Quiet deterministic ground rain ripples and effect scale relative to the smaller combatant
  improve readability. Existing Wild artwork is explicitly labelled as a study effect;
  this does not paint or pretend to supply Fire/Sand production effects.

## Defects found and retained

native-01 used generic card weapons and incorrectly admitted crystal claws. Native-02 used
explicit weapons, but followed the claw throughout retraction, dragging the body through its
target despite a zero-contact-gap PASS. Native-03 corrects phase and endpoint. Native-04
adds the actual old follow-through as a negative control: it crosses the opponent-facing
order by230.927px and refuses. The current18-second motion stays within the face-order bound.
An earlier test-fixture run failed because synthetic fixture records omitted hashes and one
fixture was named Civet. Fixtures now explicitly identify their synthetic authority; actual
records are tested separately. The failed log is retained, not reclassified.

## Evidence

native-04/report.json: DIAGNOSTIC_PASS. 3,243 actual creature-frame samples; source seam gap
at most0.000130px, no out-of-scene body or face-order crossing, all three hitstop freezes,
exact repeat recipe, three zero contact errors and the old-follow-through failing control.
18.117593seconds /1,087 encoded frames at1600×900. Live60.003fps; producer+rig p95
0.8/1.0/0.9ms; whole frame3.2ms p95. Full sources are hash-checked unchanged at completion.
17 focused Vitest tests,8 Node tests, full typecheck and root validate pass; baseline's50
probes remain identical. Test logs and validation receipts are in this folder.

impact-1/2/3.png show the actual contact instants; compare native-02 and native-03 stills.
Review the film for attack weight and remaining foot slide. No numeric check grants visual
acceptance. Actual Pheasant and fish admission/motion tracks are tested, but new painted
bird talon contact is not visually qualified by the three quadrupeds.

## Remaining scope

This silent study has scripted HP/damage. Normal-game combat events, per-theme effects,
sounds, universal source-painter weapon/mask/landmark emission, complete Earth declarations,
hidden views and physical-phone performance remain open. The existing small Earth table
is not complete species coverage. No new painting, model run, kit edit, main.ts hunk or
Claude-reserved module edit. Next steps and one review prompt are in ROADMAP and this audit.

## Reproduction

`node tools/with-toolchain-lock.mjs --label anatomy-attack-native -- node port/v2/tools/biome-encounter/native-runner.mjs <new-output-directory>`

Serve native-04/preview on loopback, or copy it into the existing review root as anatomy-battle/.
The saved prior biome-battle and painted-motion previews remain available.
