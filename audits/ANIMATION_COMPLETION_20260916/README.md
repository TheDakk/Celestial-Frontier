# Animation library and shared deformation review

This batch continues C2; it does not declare every creature finished. Nick's requirement is
anatomy-driven shared motion across Earth and procedural life. See CREATURE_ANIMATION.md's
universal architecture/variation gates and the consolidated REVIEW_PROMPT.md here.

## Changes

- 169 actions over14 current templates, with32 physical capability rows. Added quadruped
  hoof kick, bird ground kick, fish body strike/tail sweep, insect/arachnid/myriapod body
  strikes and radial bell pulse. These are family curves, not per-creature edits.
- Apply anatomical joint limits after easing/secondary overshoot, including projected signs.
  Nine original actions exceeded their bounds. Close secondary keys now use the same exact
  sampling in GSAP and pure playback; root displacement remains root-only.
- Empty weapon sets no longer receive the family's first melee action. Explicit absent jaws,
  wings, tails, ears, mandibles, fins, antennae and stings compile consistently with rig intake.
  Hoof ink emits kick; broad marine/crust/sessile labels no longer assume the wrong graph.
- The shared skin solver keeps the old projection when it succeeds. A bounded active-set
  repair closes remaining folds without altering bones, motion keys, painted masters or pins.
  Both stages are limited; the repair targets the existing positive area margin and stops
  with a safety margin for Float32 output. Impossible pinned folds still refuse atomically.

## Evidence and negative controls

| Evidence | Meaning |
| --- | --- |
| before.json |161 actions/38,801 samples; nine actions exceed limits; two secondary parity defects |
| expanded-actions.json |169 actions/40,729 samples; limits, seek replay, parity and settled returns pass |
| catalogue-03/report.json |631 names/83 profiles;573 candidate moves,58 missing topology,0 names wholly missing motion within candidate templates |
| fish-native-02/report.json |Retained failure: cast, dodge and victory fold the original fitted fish |
| orientation-projector.test.mjs + fixture |Old64-sweep algorithm still fails the exact target; shared repair passes; pins/impossible-input control retained |
| fish-native-04/, frog-native-04/, broad-native-01/ |Latest source-bound ten-second films, exact rest checks, whole-library geometry/seam checks and per-action stills/timings |
| bird-native-02/ |Earlier repaired bird film/full-library checks; exact sources retained, before final solver fast path |
| *-skin-*.json |Pure geometry checks on fish, bird, frog and two painted procedural quadrupeds; not native pixel/visual acceptance |
| solver-*.log, motion-suite*.log, typecheck-*.log, validate.log |All attempts retained, including failed implementations/instrument checks; checks.json identifies final owners |

DIAGNOSTIC_PASS means numerical/native study checks passed, not final C2 acceptance.
Per-action timing and captured-frame timing are separate. The final frog film runs60fps;
its victory sample p95 is2.2ms against the2ms goal. Broad procedural film update p95 is2.2ms
while its accelerated per-clip p95 maximum is1.5ms. Neither number qualifies an iPhone.
No finisher, repaint, kit change, main.ts hunk, GitHub write or PR42 operation occurred.

## Why the solver changed

Forward sweeps can repeatedly undo a neighbour's correction. Reversing sweep direction
helped but left another fold. Active-set repair closed the folds; applying it universally
chased a soft target and made some frog clips slow. Stopping at zero margin then exposed a
Float32 clipped-part fold that pure geometry missed. Single-vertex projection failed the
retained control and was removed. The final implementation preserves the old fast result
when valid and repairs only unresolved folds, retaining a positive precision margin.
Failed reports/logs are history, not current acceptance.

## Review boundary

The169 entries include locomotion, alert, attack, cast, hit, dodge, faint, victory, tame/feed
and plant actions. They are not169 newly accepted animations. Only selected fitted paintings
have native evidence. Hidden views, variable topologies, all repertoires, full combat/audio
wiring, physical phone timing and art acceptance remain open. C3 status is unchanged.

All work is local on openai/mac; signing/checkpoint status is recorded separately. Do not
consume hosted CI, sync Claude's worktree or advance PR42 from this package.
