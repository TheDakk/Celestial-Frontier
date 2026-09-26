# Motion-06 procedural visual inspection

2026-09-16. This is a bounded inspection of decoded still frames from the actual procedural ten-second film. It is not Nick’s image acceptance, continuous playback review, or a new mechanical qualification. No artwork, geometry, animation source or model output was changed.

## Evidence

The [procedural film](procedural-10s.webm) contains VP9 video at 1536×740 and an Opus audio stream. The inspection selects 24 decoded frames spanning both turns. [Sheet 1](visual-inspection/procedural-sheet-01.png) contains frames 01–12 and [sheet 2](visual-inspection/procedural-sheet-02.png) contains frames 13–24, each chronological from left to right, then top to bottom. Each tile is an unscaled 620×310 crop from x=80, y=210; the entire procedural creature and its immediate ground are inside this crop in every selected frame.

| Frames | Requested media offsets (seconds) | Intended coverage |
| --- | --- | --- |
| 01–06 | 0.50, 1.43, 1.48, 1.70, 1.94, 2.05 | Idle, contact release, approach and anticipation |
| 07–12 | 2.20, 2.30, 2.42, 2.75, 3.20, 3.52 | Strike, flash, recovery and end of action |
| 13–18 | 3.58, 4.00, 4.08, 4.97, 5.07, 6.96 | Return, settled feet, role transition and incoming approach |
| 19–24 | 7.12, 7.23, 7.42, 7.80, 8.60, 9.42 | Incoming impact, recoil and recovery |

The [manifest](visual-inspection/manifest.json) records the source film, plans and capture-report hashes, every frame/sheet hash, the exact FFmpeg commands, selected frame indices and actual decoded media timestamps. The requested times are media offsets, not exact compiler-time assertions. Recorder startup and capture sampling are separate from the motion compiler. The existing full [procedural strike screenshot](procedural-strike.png) was also inspected for the arena context.

## Visible observations

No unambiguous reopened neck/chest cut, detached ear, severed limb, narrow belly spike or disconnected tail is visible in these selected frames. The procedural body markings remain joined across its torso, shoulder and neck as it extends and recoils. At native crop size, the [1.70 s approach](visual-inspection/procedural-04.png), [2.30 s strike](visual-inspection/procedural-08.png) and [7.42 s recoil](visual-inspection/procedural-21.png) retain connected silhouettes.

The approach sample separates the legs into a stride. The attack samples lower and extend the head and neck, advance the body, and raise/extend the forelimbs; later samples recover the upright stance. Recoil bends the neck and head backward while the legs compress. The tail changes curvature between these phases. These are observable changes in body pose, rather than a claim based solely on a translated portrait.

The exposed idle and settled recovery feet read against the same ground band, with their shadows underneath. Approach and strike samples visibly lift feet. No obvious whole-creature hover or foot detached from its own leg is apparent. These stills cannot independently establish continuous ground contact, exact paw height, or absence of sliding; the recorded source-bound contact gates provide that numerical evidence.

## Limits

The [2.42 s flash sample](visual-inspection/procedural-09.png) washes out important contours. Wild strokes overlap the forward legs during the attack, and the damage number overlaps the neck during recoil. Those pixels cannot independently clear every joint or foot. VP9 compression also limits one-pixel seam judgments; the native PNG/mesh gates are stronger evidence for exact seams and rest fidelity.

The small ears remain attached, but this sample does not isolate a readable ear flick. The mouth remains small and mostly closed; it does not independently demonstrate an expressive open-jaw attack. Head and neck angle changes are visible, but no alternate head view or look-behind is shown. The procedural specimen’s flat orange/spotted source style remains visible; this reuse test is not an acceptance of final painted creature quality.

Continuous full-speed fluidity, between-frame popping, perceived attack timing, sound, and aesthetic acceptance were not assessed by a still-frame inspection. Absence of a visible defect in 24 selected frames is not proof that every video frame is defect-free. This report inspects only the procedural film; it does not substitute for reviewing the current Civet and Fox films.

## Recorded performance, separate from visual judgment

The retained [capture report](report.json) has `DIAGNOSTIC_REVIEW` status with no reported errors. Its procedural trace records approximately 60.002 fps and inclusive creature-update p95 of 0.900 ms (producer sampling, contact solve and rig publication). The corresponding Civet and Fox values are 1.600 and 1.700 ms. These current traces meet the stated sub-2 ms budget; this inspection neither reran nor changed that instrument. Diagnostic status and Nick’s visual acceptance remain distinct.
