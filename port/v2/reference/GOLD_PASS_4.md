# GOLD PASS 4 — the cheap drift-scoped re-check, and the control that invalidated its headline

**2026-08-06.** Harness: `tools/rejudgecards.mjs` → 32 one-strip family packets → one agent each,
schema-joined on `species`, **no adversarial verify pass** → `tools/rejudgemerge.mjs`.
Cost: **1.17M subagent tokens, 32 agents, 6m26s**, zero errors, zero missing verdicts.
The control run added **0.72M / 22 agents / 3m45s**. Total **~1.9M** against the full sweep's
**~15M**, which died on the session limit every time it was attempted (D-ART-157).

The mechanism worked exactly as designed. **The number it produced is still not a measurement,
and the control is the only reason we know that.**

---

## ★★★ THE HEADLINE: THE ENTIRE DELTA IS THE RULER. AGAIN. (D-ART-158)

The merge printed **660 → 694 FAIL** across the catalogue, +34, with **40 of 44 band crossings
running one way (POLISH → FAIL)**. A one-directional shift on assets we had just spent six waves
improving is not a plausible art regression; it is the D-ART-150 signature, and D-ART-150 had
already fired twice on this project.

Scoping to drift is what makes the re-check cheap — and **scoping to drift deletes the control
group.** Every asset it judges is one we edited, so "the edits made it worse" and "this judge
grades harder than the last one" are the *same number* and nothing inside the run can separate
them. So a control was built: `tools/rejudgecontrol.mjs` samples assets whose pixels did **not**
change, **family-matched to the drift set** (same families, so family difficulty and strip
composition cannot explain a difference), and puts them through the identical judge.

| set | n | baseline FAIL% | now FAIL% | shift |
|---|---|---|---|---|
| **drift** — we edited these | 148 | 62.2 | 85.1 | **+23.0** |
| **control** — untouched pixels | 56 | 67.9 | 91.1 | **+23.2** |

**+23.0 versus +23.2.** The assets we changed and the assets we did not moved by the same amount.

Raw FAIL% is itself biased — an asset already at FAIL cannot fall further, so a group that starts
lower has more room to drop. Corrected for that, by rating only the assets that had somewhere to go:

| set | demoted (had room to fall) | rescued (was FAIL) |
|---|---|---|
| **drift** (edited) | **70%** (39/56) | 5% (5/92) |
| **control** (untouched) | **78%** (14/18) | 3% (1/38) |

Net of the ruler: **−8 points, indistinguishable from zero at this n.**

### What that means, stated plainly
- **Waves 51–56 produced no measurable band-level movement.** Not a regression — a null result.
- **`694` is not a catalogue score.** `goldpass4-results.json` is a **mixed ruler**: 148 rows
  graded by this harness, 1,102 carried from a harness that grades ~23 points softer. The file
  now carries that warning in its own header, and `rejudgemerge` refuses to print the total
  without shouting about it.
- **This harness grades ~23 points of FAIL harder than gold pass 3** — one pass instead of two,
  a side-by-side contact strip instead of 14 isolated PNGs, and an explicit "be your own
  skeptic" instruction. All three push the same way. That is now a *measured* property.
- ★ **Which makes gold pass 4 a usable baseline going forward.** The next drift re-check against
  *this* harness is apples-to-apples — **provided the control is re-run every time**, because the
  only thing that has ever caught a moved ruler is a slice nobody edited.

---

## WHAT IS TRUSTWORTHY: THE PROSE, AND IT IS DAMNING IN TWO PLACES

Band counts moved with the ruler. The per-asset descriptions did not — they name specific things
in specific pictures, and two of them were confirmed by eye on the strips before writing this.

### 1. THE FELID CHASSIS IS NOT FIXED
`celestial-frontier-live-state` and the wave-51 handoff both record the chassis as "largely
fixed" after D-ART-153 (the hard-coded neck) and D-ART-152/154 (the asymmetric `Tube`). **The
judge, looking at all eleven big cats side by side, still writes:**

> Leopard — "**pixel-for-pixel the Jaguar cell in a paler tan**"
> Jaguar — "the same barrel-and-short-posts construction as Leopard and Ocelot with only a warmer yellow hue"
> Bobcat — "**identical chassis to the Lynx cell**" · Lynx — "the same body and spotting as the Bobcat cell"
> Cougar — "**indistinguishable from the Caracal cell in a different tint**"

**30 of 84 re-judged fauna (36%) carry shared-chassis or duplication language.** The neck fix
landed and is visible; the *body* is still one barrel per family. Three sub-defects recur across
nearly every cat and are each one painter lever, not eleven table rows:
- **the tail is a short hook** on every felid (29% of all fauna verdicts mention the tail) — a
  cat's tail is a body-length rope and the Snow Leopard's is "a short white feather-duster";
- **the muzzle is a long blunt snout** — "tapir-like", "a long blunt snout rather than a cat's
  short face" (44% of fauna verdicts name snout/skull/muzzle);
- **the feet still read as hooves** on Bobcat and Lynx, despite wave 49 shipping the paw.

The control corroborates it from outside the drift set: untouched Giant Anteater / Pangolin /
River Otter are called "the same barrel-plus-peg-legs chassis" as each other.

### 2. FLORA IS ONE GROWTH-FORM TEMPLATE WITH AN ORNAMENT ON TOP — AND IT IS THE BIGGER LEVER
`apps/game/smoke/rejudge/9-herbs-and-spices/strip-01.png` was opened and looked at. All nine
herbs are **one dead-straight vertical stem, a symmetric leaf ladder, and a tiny flower
ornament perched exactly on the apex** — and on Oregano, Valerian and Yarrow that ornament is a
literal thin white crescent arc. The judge's language across 64 flora assets:

| theme | share of flora verdicts |
|---|---|
| leaf shape wrong (frond where a leaflet belongs, smooth margin, no teeth) | **78%** |
| habit wrong — drawn upright when the species is a low mat, a sprawl or an arch | **50%** |
| **the inflorescence is a speck / arc / cap at the stem tip** | **39%** |
| the same stem-and-leaf-ladder body as its neighbours, recoloured | 34% |
| the named harvest item (pod, berry, root, capsule) simply absent | 19% |

★ **"The flower is an ornament stuck on the apex, not a structure with size" is one painter
change touching hundreds of assets.** Angelica's domed umbel is "a thin white crescent 20px
wide"; Canola's flat-topped flower mass is "a single thin yellow arc"; Fireweed's tapering spike
is "a 5px-wide stub". This is the flora equivalent of the pony, it is diagnosed rather than
guessed, and **flora is the largest bucket in the catalogue.** It matches the family sweep's
independent finding that ~four growth-form templates cover most of flora.

### 3. THE ONE GENUINE RESCUE
**Ice Algae: FAIL → PASS** — the only PASS in 148, and the only asset that crossed two bands.
Wave 56 gave it its own construction ("no plant structure anywhere", per the judge) and it is the
one place where an edit is visible *through* the ruler shift.

---

## FILES

| file | what it is |
|---|---|
| `reference/goldpass4-rejudge.json` | 148 fresh verdicts, drift-scoped. **Trust the prose.** |
| `reference/goldpass4-control.json` | 56 control verdicts, untouched pixels, same judge |
| `reference/control-sample.json` | the deterministic control sample (re-derivable) |
| `reference/goldpass4-results.json` | the merged 1,250 — **mixed ruler, not a score** |
| `reference/goldpass3-prechassis.json` | the carried baseline (660/530/60) |

## HOW TO RE-RUN IT (the whole thing is ~10 minutes and ~1.9M tokens)

```
node tools/rejudgecontrol.mjs                    # build the control sample first
node tools/rejudgecards.mjs                      # 32 drift strips
node tools/rejudgecards.mjs --control            # 22 control strips
#   judge both with the SAME prompt, one agent per strip, no verify pass
node tools/rejudgemerge.mjs --control=reference/goldpass4-control.json
```

⚠ **Freeze the art for the duration** (D-ART-157). Nothing in `packages/art/src` was touched
during this run; the only edits were to `tools/`.
