# Celestial Frontier v1.8.6 — round 9 bundle

Build `0bfc904`. Previous audit v1.8.5 `e20d62c`. **152 changed lines** — a tightly
scoped fix release, reviewed hunk by hunk.

## Start here

**`v1.8.6-review.md`** — §1 what got fixed · §2 what it broke or missed · §3 checked and
clean · §3.5 the fleet, and one correction to my own round-8 reading · §4 the pattern.

## Verdict

**Six of seven round-8 findings fixed, two of them better than I asked for.** CF1805-01's
comment caught a trap I would have missed (min-height beats max-height, so a top-only rule
would have been "present, correct and completely inert"). CF1805-04 was diagnosed better
than I diagnosed it.

**One line should come out before anything else ships.**

    // battleStats — WRAPS                                (17895, new)
    const sz = ((+g.size||0) % FA_SIZE.length + FA_SIZE.length) % FA_SIZE.length;

    // _sanitizeSavedGenome — CLAMPS                      (16596, new)
    if('size' in g) g.size = cl(g.size, 0, FA_SIZE.length-1);

Two fixes for one bug, in one release, that disagree. ~10% of bred lineages legitimately
carry `size > 5` (measured with the build's own `crossGenome` over 500 lineages), and the
clamp permanently rewrites them on the next load: a creature that reads "tiny" with +0
vitality becomes "titanic" with +20. The clamp also buys nothing — the wrap already closes
the exploit its comment cites (`1e6 % 6 = 4` → +16 vit, against a legitimate max of +20).

Round 8's write-up named two remedies for one problem, which is how both ended up in.
Delete 16596, or make it the same wrap.

## The good news

**The audio arc is closed.** 200,000 genomes through the build's own `voiceOf`:

| | v1.8.2 | v1.8.6 |
|---|---|---|
| distinct voices | 533 of 20,000 — a closed set of 540 | **199,707 of 200,000** |
| duplicate in a 50-creature collection | **91.3%** | **0.6%** |
| pinned at the 6 kHz ceiling | 1.98% | 0.83% |

**Rage quits down for the second build running** — deep tier, the only comparable slice:
112.5 → 76.4 → **71.4** per 1000, after four consecutive rises.

**180/180 sessions completed, zero fatals, zero errors, zero storage failures** — seventh
straight clean build.

## What's in here

    v1.8.6-review.md              the review

    evidence/
      v185_card_buried_BEFORE.png the defect CF1805-01 fixed, for comparison

    data/
      training-reachability-v186.txt   6 viewports x 17 surfaces, every training step
      dock-clearance-measurement.txt   CF1806-02 — the dock at 0% on 667/740px phones
      size-drift-simulation.txt        CF1806-01 — 500 lineages through the real crossGenome
      voice-vocabulary-200k.txt        the audio arc, closed
      fleet-rollup.txt                 180 sessions: health, reach, per-archetype
      fleet-180-sessions.jsonl.gz      the raw records
      fleet-plan.json / veteran-save.json

    harness/                      the instruments — see the round-8 bundle's README for
                                  the full guide; these are the v1.8.6-targeted copies

    prior-rounds/                 v1.7.20, v1.8.2 and v1.8.5 reports

## Two things I could not settle

1. **CF1805-05 (harvest) at runtime.** The source is unambiguous — `doHarvest` and `_hvMono`
   are byte-identical to v1.8.5 — and I confirmed the *in-session* monotonic gate genuinely
   holds under a wound-forward clock. But my probe cannot re-lock Earth's card after a
   reload, so the final press never landed. **Thirty seconds settles it:** harvest Earth →
   clock forward one hour → reload → harvest Earth again.
2. **The step-8 training stall.** See the correction in §3.5 — I attributed it to CF1805-01
   last round; the card is now readable and the number did not move, so the attribution was
   wrong and the cause is most likely my own driver.

## And one false positive caught in the writing

My first voice-vocabulary run reported **1 distinct voice out of 200,000** — every creature
identical, which would have been catastrophic. It was my extractor: `_TEMPER_BOLD` is new
since I built the model, so `voiceOf` threw on every call and returned `_VOICE.legacy` from
its own catch. Fourth such catch in two rounds.
