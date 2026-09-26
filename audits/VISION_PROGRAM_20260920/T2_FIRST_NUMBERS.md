# Track T2 — first numbers (2026-09-20, five painted masters, human-read)

Not the battery; the first five rows of it, read by Nick's and Claude's eyes with Codex's mask authoring as the
independent count. Tool: `image_gen.imagegen` (model/seed not exposed), one generation per species, exact compiled
prompt, anatomy guide attached.

| Species | Prompt asked | Painted (visible) | Verdict class | Note |
|---|---|---|---|---|
| Coconut Crab | 8 walking legs (template law, wrong) | 6 walking legs, 2 claws, 2 eyes | **correct for the species**, prompt law error | fourth pair hidden as in life |
| Crab | 8 visible | 7 visible + 1 occluded behind a claw | correct anatomy, occlusion | hidden declaration |
| Freshwater Crab | 8 visible | 7 visible + 1 occluded | correct anatomy, occlusion | hidden declaration |
| Mud Crab | 8 visible, 2 eyes | 7 visible + 1 occluded; 2 stalked eyes + 2 dark facial orbs | correct anatomy, occlusion; **one extra feature** | orbs are plausible crab anatomy (antennules), but the line said exactly two eyes |
| Vent Crab | 8 visible | 8 visible, 2 claws, 2 eyes | **exact** | legs thicker than the guide |

Reading: 5 of 5 anatomically valid crabs; 0 of 5 with a wrong limb count; 3 of 5 occlude a leg behind a claw
(natural pose, handled by the hidden law); 1 of 5 adds a plausible feature the line did not ask for; 5 of 5 ignore
the 8 % margin request and the 1024 px size (delivered 1254 px); 4 of 5 change the guide's claw pose. Art: 5 of 5
accepted by Nick. These are the numbers the trust threshold will be set against once the battery has hundreds of
rows and the verifier's miss rate is measured; they are not the threshold.
