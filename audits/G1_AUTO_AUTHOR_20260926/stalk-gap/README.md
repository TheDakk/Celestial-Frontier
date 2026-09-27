# The fish tail knot: diagnosis and a partial author-side fix (2026-09-26)

**Dakk:** "the tail just looks like it's all crunchy and missing."

**Is it the rig or the author?** Codex's hand-built Bass (already in the game) flexes its tail cleanly with a full-width stalk. So the shared rig and motion can do tails, and the fault is in what the automatic author produces.
- **Perch:** its slim stalk matches the proportions of its own painting (the stalk is about a fifth of body height in both), welded or not. Mostly true anatomy, not a rig fault.
- **Cod (the broken one):** `cod-vs-bass-authoring.png` (hand Bass left, automatic Cod right). The spline transfer skewed `body-5` and left a GAP between it and `caudal`, right on the tail stalk. The stalk paint in that gap belongs to the root `body` part, whose pivot is far forward. When the tail swings, that strip stays behind and crushes into the knot.

**Probe (`fill-gap.mjs`, placement only, no pixels or landmarks change):** remainder-owned paint within 40 px (through paint) of BOTH the tail part and the stalk segment goes to the stalk segment.
- The Cod gains 2,673 stalk pixels on `body-5`; PASS_STATIC; native DIAGNOSTIC_PASS.
- `cod-before-after.png`, rows: the old packet; gap fill unwelded; gap fill plus a re-run greedy weld (5 pairs, PASS_STATIC, native PASS).
- **The crushed knot is gone:** the stalk now runs continuous into the tail.
- **But thin tears remain at the stalk.** `body-5`↔`caudal` now touch there, and that contact is not an observed excluded adjacency the split can weld; the extra welds also kink the back.

**Status:** the knot's cause is found and fixed author-side for the Cod. The residual stalk tear needs the split to weld the new `body-5`↔`caudal` contact (Codex's "sibling bridge" contract), handed over in C55. Not adopted into the author yet; it becomes a general rule only once it works on a held-out fish without regressing the others.
