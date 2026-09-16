# Motion-02 bounded visual inspection

2026-09-16. This is an independent inspection of decoded pixels from the retained Civet and Fox films. It is not Nick's acceptance, a complete motion review, or a performance pass.

## Evidence inspected

- [Civet film](civet-10s.webm) and [Fox film](fox-10s.webm): 16 decoded frames each, at media offsets 0.50, 1.43, 1.53, 1.80, 1.95, 2.08, 2.16, 2.25, 2.84, 3.18, 4.97, 5.07, 7.18, 7.35, 7.48 and 7.72 seconds. These sample idle, approach/contact transitions, attack, return, role switch and recoil.
- [Civet detail sheet](visual-inspection/civet-detail-sheet.png) and [Fox detail sheet](visual-inspection/fox-detail-sheet.png), read left-to-right then top-to-bottom. Each tile is an unscaled 620×310 crop from x=80, y=210 of a decoded 1536×740 video frame.
- Native-size individual crops: [Civet 2.25 s](visual-inspection/civet-07-2.25.png), [Civet 7.35 s](visual-inspection/civet-13-7.35.png), [Fox 2.16 s](visual-inspection/fox-06-2.16.png), [Fox 7.35 s](visual-inspection/fox-13-7.35.png).
- Existing `fox-sequence.png`, `civet-strike.png` and `civet-hit.png` were also viewed. The latter two are retained direct screenshots rather than decoded video frames.

The [extraction manifest](visual-inspection/manifest.json) binds both films and retained inspection artifacts. Times above are requested media seek positions; recorder startup and frame selection mean they are not exact compiler-millisecond assertions. No new artwork was generated or modified.

## Observations

No unambiguous reopened chest/neck cut, detached ear, narrow belly spike or severed limb was visible in this sample. The Civet's head, ruff, torso, leg roots and tail remain connected in the inspected attack and recoil crops. The Fox likewise keeps a connected chest, shoulders, head, legs and tail. Neither animal loses its recognizable source markings in these views.

The action samples show a forward foreleg extension and body displacement, followed by a return. The recoil samples show head/body lean and ear/tail displacement. These observations establish visible changes between frames; they do not establish continuous playback quality or professionally finished motion.

The inspected neighboring release/return/role-switch frames do not show an obvious large silhouette separation. Their spacing is insufficient to independently prove epsilon continuity; the source-bound transition checks remain the evidence for that claim.

## Limits and remaining review

The white hit flash washes out important portions of the fastest attack poses. Wild effect strokes overlap the lower forelegs, and the damage number overlaps parts of the head during recoil. These frames cannot independently clear every obscured contour. Video compression also limits one-pixel seam judgments. Absence of a visible defect in 32 selected frames is not evidence that every film frame is defect-free.

Both creatures retain the authored head view. The sampled images do not demonstrate looking toward the opponent, a change to a different head view, or a clearly readable biting/jaw action. Hidden-view artwork and broader turning capability remain separate work in the universal animation plan; this inspection does not close that coverage.

Continuous full-speed playback, perceived fluidity, timing, audio and Nick's aesthetic judgment were not evaluated by this still-frame inspection. No procedural film exists in `motion-02`, so there is no procedural motion-film verdict here.

## Admission status

`report.json` is **FAIL** because the Fox's inclusive creature-update p95 is exactly 2.0 ms and the limit is strictly below 2 ms. Civet measured about 1.7 ms. Both retained traces measured about 60.0 fps; that does not override the failed Fox budget. The films remain diagnostic evidence, with no claim of final C2 qualification or Nick acceptance.
