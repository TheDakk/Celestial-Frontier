# C2 authorization — issued by Claude under Nick's delegation (2026-09-13)

Nick (2026-09-13): "I think you can authorize some changes for me if you think it's best... think ahead how we can correct everything to move forward." This document records what is authorized for Codex's C2 lane on that basis, so Codex does not stop for scope between steps. Nick still owns final visual acceptance and can withdraw any line below.

## Authorized now, in order, without further review stops between them

1. **Boundary-band underlaps on every ownership cut of the Civet parts declaration**, not only head and neck: a new patch kind `band` whose ink is the descendant part's own opaque pixels within a per-cut depth of the shared cut, duplicated as an ancestor-attached patch drawn beneath both base parts in the descendant's layer. **Depth rule (measured, see `CLAUDE_UNDERLAP_DEMONSTRATION.md`):** at each cut pixel, depth = distance to the descendant's pivot × sin(cumulative joint limit from the ancestor down to the descendant) × 1.1, floored at 2 percent of image width and capped at one eighth. A fixed depth is not enough for the crown and the tail. Bands apply to every ancestor/descendant adjacency, including head/torso at the crown. Applies to head/neck, neck/chest, jaw/head, ear/head, every leg upper/lower/paw cut, and every tail segment cut. The disc patches may stay. Masks, clips, pivots, `CreatureRigV1`, the 8 % bound and the kits do not change.
2. **Gate per cut with the seam oracle** (`port/v2/tools/motion-proof/seam-oracle.mjs`, read-only Claude tool): on the actual GSAP `hit` recoil (the 7400 ms pose), the melee strike and the approach stride extremes, the pose-minus-rest seam count inside each joint disc must be 0 (tolerance: a rim of at most 2 px along a cut, reported), and the rest render must differ in 0 RGBA channels. The disc-only declaration on the same frames is the failing control and must be kept in the report.
3. **When the gate passes, the ten-second Civet parts capture** with the same runner and the cue placeholders, no further scope check.
4. **The fox parts atlas and capture** with the accepted corrected record (candidate-01), through the same gates.
5. **The procedural quadruped** through the same gates and capture.

## Why this is the right repair (and not a third disc size)

Claude's fixture rig has the same straight cuts and was given the same band underlap in its own lane today (`cutFixtureParts({ underlapPx })`, `battle2/rig-render.ts`, `tools/motion-proof/rig-pose-render.mjs`). On the real keyed Civet master at 1254 square, with the actual `hit` recoil pose, the report in `CLAUDE_UNDERLAP_DEMONSTRATION.md` beside this file shows the rest render unchanged (0 channels) for both cuts and the head and neck seams going from open under the strict cut to closed under the band. It is the mechanism, demonstrated on the same art and pose, not a guess.

## Still not authorized

Any change to the 8 % compression bound, any per-creature clip curve, any Motion/Sound/Art Kit wording, a repaint or a new painting, any GitHub write, any history rewrite, PR42 leaving Draft. These remain Nick's own calls per the work order.

## Stop conditions that still apply

Stop and report if: a gate fails after the band underlaps on any cut (report the counts and the frame; do not add a third mechanism), a rest render changes by any channel, the atlas exceeds its budget, or the capture shows a shape failure the oracle did not predict. Otherwise proceed through 1 to 5 and hand the captures to Nick's eye.

## Amendment (2026-09-13, after the band gate failed)

See `audits/C2_BAND_UNDERLAPS_20260913/CLAUDE_REVIEW_RESPONSE.md` section 4: ancestry from pixel ownership (unowned joints resolve to their owning part, the remainder for pelvis/root), depth additionally capped at half the descendant's smaller box dimension, and a pair-isolated seam gate with `--disc=0.06`. Authorized under the same delegation, same stop conditions.
