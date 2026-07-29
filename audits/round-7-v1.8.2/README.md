# Celestial Frontier v1.8.2 "Steady Hands" — round 7 test bundle

Audited build `a9a13c7`. Previous audit: v1.7.20 "The Proof".
Four reviews as requested — player experience, bugs/exploits, audio, technical.
Audio is the first measurement this project has had of it.

## Start here

**`v1.8.2-fix-list.md`** — the report. 25 items, ranked, each with line numbers, the measurement
behind it, and a recommended fix.

## The lead item

**CF1802-01** — a training wall on every phone-class viewport, from one CSS rule:

    body.training:not(.vista) #panel{z-index:58}      (line 1841)

`#codexbtn` measures **0% reachable** on iPhone SE / iPhone 14 Pro / Galaxy S8 at training steps
3-6 — 63 of 63 sample points blocked by `#panel`. `#logbtn` 54-83%. `#log` once open 14-22%.
Desktop is 100% at every step, which is why neither harness saw it.

Reported by Nick from his own phone mid-round; reproduced, measured and root-caused here.

- `evidence/dock_iphone-14-pro.png` — step 5 with the dock outlined and reachability labelled
- `evidence/dock_desktop-1440.png` — the same step on desktop, the control
- `data/training-reachability.txt` — the full per-step, per-viewport table
- `data/tutreach.json` — the raw surface-level measurements

## What's in the bundle

    v1.8.2-fix-list.md            the report

    evidence/
      dock_*.png                  step 5, dock buttons outlined + reachability labelled
      tr_*_step7/8/9.png          the training walk at the steps that break
      burial_*.png                step 7 across four viewports

    data/
      training-reachability.txt   CF1802-01: the full measurement + mechanism + fleet corroboration
      audio-lifecycle.txt         CF1802-19: the ambience bed vs. close / hidden tab / sound-off
      voice-model-200k.txt        the 200,000-genome run of the extracted voice model
      boot-ab.txt                 paired cold boot vs v1.7.20, idle host, 8 reps + payload
      fleet-summary.json          1,000 sessions rolled up
      fleet-1000-sessions.jsonl.gz  the raw session records
      fleet-plan.json             the seeded plan (re-runnable)
      tutreach.json               per-step surface reachability, 6 viewports

    harness/                      the instruments, with a README — everything here is re-runnable

    prior-rounds/                 the v1.7.15, v1.7.18, v1.7.19 and v1.7.20 fix lists

## The one thing that needs you

**CF1802-09** is source-confirmed but I could not observe it live — my open-play landing driver
never reached a living world in the time available. Twenty seconds settles it:

> Land on a living world → **Discover Life** → unfold the Life-forms roster → tap a row for a
> species you have **not** caught.

If it appears in your Compendium, it is real — and it is the supply line for three more exploits
(CF1802-10, -11, -12).

## Three things I checked and cleared

Listed because the negative results cost real time and are worth having:

1. **"A creature only speaks once per session."** Measured 1 of 6 specimens producing audio.
   The other five clicks were landing at (0,0) — zero-size rects inside a collapsed shelf.
   My probe, not the game. Retracted before publication.
2. **`tutorialCompleted: 0/498`.** 0.0% in all six rounds, including builds your CI passed
   100/100. Harness limit, not a regression.
3. **Voice pitch vs. `size % 6`.** Looked like a wrap bug; every consumer uses the same
   modulus. Correct as written.
