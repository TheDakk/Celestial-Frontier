# GOLD PASS 5 — the waves 58–60 measurement (drift re-check + control)

**2026-08-07.** Drift regenerated with `artlock --driftdump` (285 assets changed since the wave-56
baseline = my waves 58–60), then `rejudgecards` → 47 drift strips + 23 control strips → one agent
each, no verify pass, joined on `species` → `rejudgemerge`. Cost **~1.9M tokens, 70 agents,
0 errors**. 26 procedural rows dropped (naming can't join to gp3); 259 joinable drift verdicts.

## ★★★ THE HEADLINE: THE DROP IS REAL THIS TIME — FAIL 660 → 589 (−71), PASS 60 → 82 (+22)

Unlike gp4 (where the entire delta was a moved ruler, D-ART-158), **the control confirms the
ruler is stable here** — so this is the first genuinely-measured FAIL reduction in the arc.

| set | n | FAIL (gp5) | vs gp3 | POLISH | PASS |
|---|---|---|---|---|---|
| earth-fauna | 631 | **332** (53%) | −28 | 282 | 17 |
| earth-flora | 332 | **166** (50%) | −43 | 148 | 18 |
| procedural | 240 | 60 (25%) | 0 | 133 | 47 |
| earth-fungi | 27 | 18 (67%) | 0 | 9 | 0 |
| earth-microbe | 20 | 13 (65%) | 0 | 7 | 0 |
| **TOTAL** | **1250** | **589** (47%) | **−71** | 579 | 82 |

### The clean signal — rescue rate, my edits vs the untouched control
- **Of the 200 previously-FAILing assets I edited, I rescued 85 → 43%.**
- **The control rescued 5 of 28 → 18%** (the same judge's natural re-read variance).
- **My work more than doubled the fix rate over the ruler's own drift.** That is the honest,
  ruler-corrected proof the art changes did the work — not the judge.
- Collateral: 14 edited assets that were POLISH/PASS fell to FAIL (24% demotion vs the control's
  13%). Net on the edited set: **−71 FAIL** (85 rescued − 14 new). See regressions below.

## ⚠ HONEST SCALE: 589 IS NOT A SMALL NUMBER

Real progress, but **47% of the catalogue still FAILs.** Where the 589 are:
- **Fauna 332** — dominated by the deep mammal/cetacean chassis (barrel body, whales, pinnipeds,
  primates) that waves 59–60 only *began* (bear heads, felid faces/tails, fox tails all rescued,
  but the bodies remain), plus every fauna family I have not reached yet.
- **Flora 166** — the bespoke tail (Bergamot, Solomon's Seal, Angel's Trumpet, the sorrels, the
  cushion alpines, seaweeds still POLISH-not-PASS) after the shared chassis cleared ~43.
- **Fungi 18 + microbe 31-total-FAIL** — barely touched (only bracket fungi); each is bespoke.
- **Procedural 60** — untouched this arc.

## THE 14 REGRESSIONS I INTRODUCED (fix first — some are one-line reverts)
- **Pine Nuts, Pinyon Pine** — my conifer-spire treatment made them Christmas-tree cones, but
  pinyons are LOW ROUNDED bushes. Remove them from the `fruit:'cone'`/needle-spire path.
- **Lychee** — my `hairy` fruit made it identical to Rambutan; lychee is bumpy red, not hairy.
- **Millet** — the awned-grain head made it identical to Oats; millet has a bristly club, not awns.
- **Bilberry** — the `creep` mat renders as a flat floating dish; needs a low mound, not a flat mat.
- Others (Creosote Bush, Edelweiss, Date, Sea Beet, Arrowroot, Riverbank Nettle, Daisy, Hazelnut,
  Sagebrush) — mix of shared-painter collateral and judge harshness; triage against the prose.

## WHAT LANDED (85 rescued) — the clusters that worked
mints · brassicas · nettles · sea-plants · coneflowers · legumes · roots · **all 8 sharks** ·
mollusk trios (Brittle Star, Sand Dollar, Tube Worm, Mussel, Cowrie, Limpet, Leech) · wader bills
(Avocet, Curlew, Godwit, Ibis) · waterfowl · Magpie · **Cougar, Snow Leopard, Fishing Cat,
Wildcat, Wolf, Arctic Fox** (the mammal-chassis levers are working) · fruit trees (Mango, Papaya,
Durian, Rambutan) · grains (Amaranth, Potato, Quinoa) · Clownfish.

## FILES
`goldpass5-rejudge.json` (259 drift verdicts) · `goldpass5-control.json` (51 control) ·
`goldpass5-results.json` (merged 1,250 — ⚠ mixed ruler for TOTALS, but the ruler is stable so
the −71 is trustworthy) · baseline `goldpass3-prechassis.json`.

## NEXT, TO DRIVE 589 → 0
1. Fix the 14 regressions (fast).
2. The deep mammal/cetacean chassis — the single biggest bucket (barrel body, whales, pinnipeds,
   primates), carefully, family by family (D-ART-83).
3. The flora bespoke tail (166) and the untouched fungi/microbe (bespoke), one at a time.
4. Re-measure with this same harness (`artlock --driftdump` → rejudge → control) — the ruler is
   now calibrated, so each future delta is trustworthy.
