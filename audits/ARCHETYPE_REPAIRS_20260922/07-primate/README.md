# Chimpanzee repair — authoring hypothesis remains red; corrected paint rejected

Status: **STOPPED_SECOND_PAINT_FAILURE**. The refusal packet is signed in commit `4f82025c490d39b80b78bfab81ac53232a780a74` and its signature verified. Fit02 measures **14 rows, three failing rows**, with exact return to rest and **0 changed RGBA channels** in the independent source-pixel reconstruction. The rejected corrected painting has no rig/static/native measurements. Native film and CPU are **unmeasured** for this repair.

The original master, masks, explicit presence and other landmarks remain unchanged. `authoring-repair-02.json` retains the one bounded manual hypothesis: near knee (509,737) → (506,748), far knee (295,793) → (315,773). Both internal hinge centers are visually uncertain, particularly the partly occluded far knee. These are plausible authored fitting choices, **not measured anatomical truth**; the changed fit remains a failed candidate. No solver, family contract, numerical limit, gate or accepted input changed.

| Row | Successful samples | First refusal ms | Finding |
| --- | --- | --- | --- |
| idle | 121 | — | PASS |
| alert | 121 | — | PASS |
| approach:walk | 121 | — | PASS |
| approach:climb | 121 | — | PASS |
| melee:punch | 121 | — | PASS |
| melee:bite | 121 | — | PASS |
| cast | 121 | — | PASS |
| hit | 121 | — | PASS |
| dodge | 16 | 37.333333333333336 | RecoverablePoseError: ARAP skin: unresolved folded triangles: 8 |
| faint | 89 | 385.6666666666667 | Error: Contact: faint@385.6666666666667 exceeds scale compression bound |
| victory | 121 | — | PASS |
| tame | 121 | — | PASS |
| feed | 121 | — | PASS |
| presentation | 593 | 9883.333333333334 | Error: Contact: dodge@80.9774124622345 exceeds scale compression bound |

`contact-diagnosis-02.json` and `contact-diagnosis-02-findings.md` reproduce all three exact first refusals through the actual attempted poses. Dodge passes all four contact-support passes without compression, then refuses eight near-leg-upper triangles at source x195–273/y587–646.5 after128 orientation passes; rejected geometry is unpublished. Faint's far leg requires39.08728266646164px total compression, while presentation's near leg requires38.42798277024843px; both exceed the unchanged38.06856971308484px cap. Those two contact refusals precede ARAP. The static report's stored contact-failure pose is the last successful publication; use the diagnosis's attempted pose for those failures.

The original fit01 failures remain separate in ../../ARCHETYPE_SPRINT_20260922/07-primate. `contact-diagnosis-01.json` and its findings retain exact original dodge/presentation foot-angle refusals and the original faint compression refusal. Original and fit02 authorities are never rebound to the corrected painting. `source-check-02.json` verifies all55 static sources and five inputs unchanged; targeted diagnostic receipts retain their own sources and scope. No unchanged full battery was repeated.

The single corrected repaint, candidate03, visibly contains **three hind feet with separate leg chains and two knuckle-bearing hands**. Parent and independent visual review reject this extra hind limb. `candidate-03/visual-review.md` retains the count and uncertainty scope. Do not hide, merge or relabel that extra leg. The second-paint rule ends the item; no third repaint or candidate03 fit was attempted. Both masters, exact original/corrected prompt bytes, generation receipts and authored presence declarations remain retained.

Run **20260922-chimpanzee-repair-02**, source predecessor `2283e5388793a31b7fbc0d68897492adb6beadd1`. Measured fit02 record `49fcaa4a87a2c1210f5c4fa550ede4da2312a9f3d5ebea62d963db86ee20c3d9`; binding `7af573437412e3a82de82f412fb0320506a7e06b66b93afc19fc6411cf87ec43`; original master `27331ceeb3353de388c97e1c4ecc62b11fd75fa6421852ae4e7a22cba971c408`. Rejected corrected master `c10a043d1c0e35c80611eb8ecb8e33de8ef048b21232946f8495880b53709728`. `result.json` preserves native/CPU as null; the packet manifest records retained output hashes.

[Measured-fit sheet](review-sheet-02.png) and [rejected-paint sheet](candidate-03/review-sheet.png) keep the two image authorities and unavailable film evidence separate. Nick owns art acceptance.

Paired next steps: Codex has signed this refusal packet and is now working on Starfish. Claude consumes signed results under Nick's integration direction; Nick reviews art and need not open Claude now. Chimpanzee needs separate further-paint or representation authority to continue. No new hosted attempt, PR, merge, release or deploy.

Signing state: commit `4f82025c490d39b80b78bfab81ac53232a780a74` succeeded and its signature was verified (verification tool receipt `1a997f`). Earlier signing-refusal-01/02/03.json remain unchanged; HISTORY.md preserves the obsolete signing paragraphs verbatim. The prior refusal cause remains unknown; no unsigned fallback was used. Exact retained prompt bytes intentionally include historical trailing whitespace; do not rewrite submitted prompts.
