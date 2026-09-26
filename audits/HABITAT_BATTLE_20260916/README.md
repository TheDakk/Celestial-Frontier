# Water / air habitat battle and Frog repair

September 16 local diagnostic. Review at http://127.0.0.1:49816/habitats/.
[Combined review prompt](REVIEW_PROMPT.md). No kit edits, accepted-master replacement,
ordinary-game promotion, GitHub write, branch creation or sibling worktree edit.

## Delivered

- Deterministic physical-habitat compiler: explicit ground/air/water capabilities, chemical
  compatibility, seeded home/visitor arena selection and full painted-bounds containment.
  Flightless/amphibious species are distinguished from generic bird/mammal labels. Unknown
  named Earth habitats and non-fauna gene layouts refuse instead of guessing.
- Local motion snapshot with provenance. Adult Frog's explicit absence removes only eight
  nonexistent tail/ear joints; mandatory limbs still refuse if missing. Smooth skin maps to
  slick. Authored fish uses aquatic/swim rather than land/walk. No fake anatomy or Earth gene
  override. Frontal bird wings convert the canonical rotation basis from source geometry;
  shared curves, joint names, seed and root-only dx/dy interface remain unchanged.
- Shared orientation solver gets up to 64 corrective iterations instead of 24. Same positive
  triangle refusal and .12 target; no asset tuning exception, no reduced motion. Early failures
  remain in this folder. Four global shape passes × four sweeps and .35 target are unchanged.
- Hash-bound actual Frog atlas/rig, new open-wing bird candidate, corrected wing depth order,
  deterministic action blending and a recorded fish-versus-bird encounter across a water surface.
  Original accepted fish/Frog/arena FAR bytes are retained. The first bird candidate was
  rejected for transparency/cropping; the second has complete silhouettes but insufficient
  outer safe margin. Its padded front-view derivative is a prototype, not an accepted master.

## Evidence

Final mixed scene: `native-battle-04/habitat-battle-10s.webm` and `report.json`.
1,200 creature-pose samples pass source joins and full-body medium containment. Encoded film:
606 frames, 10.101600 seconds; animation loop about60fps. Per-creature update p95 fish1.1ms,
bird0.6ms; complete frame CPU p951.9ms. The first oversized layout failed; it was fitted to the
medium without clipping or weakening the containment check. Native scene sources are hashed.

Frog: `frog-05`, `native-frog-02/family-10s.webm`. Native exact rest/final rest zero changed
channels, four actions/484 samples pass, separated-mesh negative refuses. 607 encoded frames,
10.117296 seconds, about60fps; rig update p951.6ms, complete frame p951.7ms.
Final bird depth ordering: `airbird-05`; earlier native proof `native-airbird-02` passes exact
rest/final rest and 484 poses. Final ordering passes exact rest/final rest0 and484 poses in `native-airbird-03`;
606frames/10.102140s, rig update p950.5ms.

Focused application tests: `tests-final-03.txt` (25). Tool tests: `tool-tests-final.txt` (32).
Typecheck: `typecheck-final.txt`. Root validation: `root-validation.txt` (1,010 Earth renders,
43 biome profiles, unchanged50-probe fingerprint). Initial material-test typo and other
intermediate failures are retained; only named final receipts support current claims.
These are dirty-tree diagnostics on signed parent `1a6dd61d`, not release certification.

## Review status and real remaining defects

Mechanical gates pass on these inputs; visual acceptance is pending. Bird frontal projection
still faces the viewer rather than its opponent, and its flap/leg coordination needs art review.
The Frog's provisional partly hidden hind leg and hop/ground contact remain unqualified.
The water cross-section and ranged streaks are code-native presentation studies, not accepted
new arena or Wild masters. No sound is claimed for this scene. Existing biome FAR is reused.

This does not close universal animation: the ordinary-game world/encounter adapter, complete
painter-emitted masks and habitat records, variable-count radial/myriapod/cephalopod inventories,
independent fish accessory fins, other real families/biomes and iPhone performance remain.
All43 biome keys passed routing tests with declared capabilities, not rendered art qualification.

Codex next: integrate accepted habitat/source records through the real encounter boundary,
qualify opposing views and contacts, and extend actual procedural topology before claiming
universal coverage. Claude need not open or sync now; use the one combined prompt when Nick
requests review. PR42 stays parked; no remote action is requested.

[Signed checkpoint status](CHECKPOINT_STATUS.md): signing refused; work staged.
