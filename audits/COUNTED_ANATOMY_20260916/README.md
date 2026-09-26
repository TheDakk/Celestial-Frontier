# Count-preserving anatomy — September 16

The radial painter drew ten arms while its motion library expected six. The squid painter
emitted eight arms plus two feeding tentacles that the fixed eight-arm rig could not admit.
The new `cf.anatomy-presence/v2` declaration preserves those counts across the compiler and
rig intake. Existing v1 declarations and absent declarations retain their original defaults.

## What changed

- `repeated-anatomy.mjs` is the shared expansion owner. Radial declarations specify `arms`;
  cephalopods specify `arms` and `feedingTentacles`. Counts must be integers: arms2–20,
  feeding tentacles0–4, subject to the unchanged64-joint budget. Each appendage has three
  parent-first joints (`armNSeg0..2`, `tentacleNSeg0..2`), family bounds and secondary motion.
- The same family curve factories cover admitted counts. Timing, easing, seeded behavior,
  root-only displacement and default six/eight-arm action objects are unchanged.
- Cephalopod lash contact follows the animated central arm or a feeding tentacle. The old
  selector named stationary arm0 while the clip moved arm3/arm4.
- Painter observations publish the counts of actual features and refuse missing/renamed
  features. Squid tentacles use canonical tentacle0/1 observation ids. Drawing commands
  are exactly unchanged with observation on/off. Both smooth painted owners publish
  `smooth skin`, which the material compiler recognizes; no genome surface is substituted.
- Bodies still need full hash-bound landmarks, source masks and fitted skins. Nothing in
  this batch turns observations into invented geometry or declares an animated master done.

## Evidence and controls

`tests-final.log`:30 tests in5files PASS. Counted tests cover6representative inventories,
all action samples, inherited transforms, pure/GSAP parity, replay, missing joints, stale
recipe/cut-out hashes, foreign schema fields, unsupported family, excessive counts, optional
absence, exact default action parity and correct strike contact. A stale fixed-count
producer leaves added arms inert and fails the activity control. Painter tests prove exact
command parity and reject dropped observed arms/tentacles. `rig-tests.log`:21 existing
rig/admission controls PASS. `typecheck-04.log`:all three TypeScript targets PASS.
`validate.log`:root validation PASS,1,010legacy renders and50baseline fingerprints identical.

`count-matrix-final.json`:94count combinations,1,222compiled actions,147,862samples PASS;
20budget refusals, maximum pure/GSAP difference0.0000010383radians. Every declared appendage
moves somewhere in the library. Source hashes include the compiler, contract, intake and
instrument. These use synthetic landmarks and establish no rendered-skin, visual, contact,
atlas or physical-phone performance result. The 40-part/2048px atlas budget is unchanged.

Earlier failing runs are retained: tests-01 used an alleged out-of-bounds point that was
actually within the envelope and incorrectly expected arm0 to stay still in a two-arm body;
the controls were corrected without relaxing production bounds. Its typecheck also caught
an invalid test-only part-group name. Later TypeScript correctly required the stale-producer
control to omit the optional anatomy field rather than explicitly setting it undefined;
that test was corrected and rechecked in optional-field-control.log and typecheck-04.log. The first matrix predates the final instrument hash
inventory; use count-matrix-final.json as current evidence.

## Remaining gaps

The named roster remains631profiles/573candidate names/58requiring new body structures;
these numbers are not painted-species acceptance. Crustaceans, shells, gastropods, annelids,
other specialized bodies and high-count myriapods are not relabelled as supported. Their
actual painter observations and count-preserving topologies are next. The present myriapod
painter draws17–24base segments with a leg pair on each, above this rig's64-joint budget;
never truncate them to the old eight segments/four pairs. Budget changes need measured rig,
atlas and phone evidence. All new fits must then pass source-alpha/rest/seam/extreme-pose,
habitat/contact, full moving visual and performance gates.

No painting/inference, kit edit, main.ts hunk, reserved sibling-module change, new branch,
GitHub write, hosted test, merge, release, deployment or history rewrite. PR42 remains parked.
The original animation-library preview is unchanged; this is a compiler/admission package.
