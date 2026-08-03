# The procedural material fork — costed for Nick (2026-08-03)

**Short version: the question as it has been written down for two sessions is based on a
factual error, the gap is about half the size it was described as, and it is bounded and
named. I would not decide it today — the gold pass is measuring the premise right now.**

---

## What the handoff says, and what is actually true

`reaudit-worklist.md` states:

> **Procedural FAUNA and FLORA do not [route to owned painters].** They fall through to
> `hdart.verbatim.js` … So the two halves of the catalogue cannot be brought level by
> editing a painter.

That is wrong, and it is wrong in the direction that makes the decision look bigger and
scarier than it is. `proceduraloverrides.ts` (wave 13) is a **router**, and it already
sends most procedural organisms to owned painters — which means they already take the
material layer, countershading, the pattern law and the surface laws.

Measured over the full uniform gene space rather than remembered:

| procedural fauna → | share |
|---|---|
| `quad` (our quadruped painter, with alien traits) | 38.9% |
| `fish` | 11.1% |
| `snake` · `myriapod` · `turtle` | 16.8% |
| `insect` | 5.2% |
| `bird` | 0.3% |
| **owned total** | **72.2%** |
| **verbatim** | **27.8%** |

Procedural flora: **10 of 18 forms owned (55.6%)**, 8 verbatim (44.4%).
Procedural **fungi and microbes are 100% owned** already (13 families each).

So the honest gap is **~28% of procedural fauna and ~44% of procedural flora**, not "all of
it". And the material layer is not absent from the alien half of the catalogue; it is
absent from roughly a third of it.

## And the part that remains is deliberately verbatim

The plans still falling through are exactly, and only, the ones with **no Earth analogue**:

- **fauna:** tentacled · membranous · crystalline-plated · gelatinous · radially symmetric
- **flora:** crystalline growths · spore-towers · balloon-pods · mirror-bark giants, etc.

That is not an oversight. It is **D-ART-14 applied to a rendering path** and the router says
so in its own comment: *"the verbatim engine draws them better than a forced mapping
would."* Routing a radially-symmetric organism through a quadruped painter to win it a fur
shader would be a clear downgrade. **They are also the whole reason the procedural half
looks alien**, which is the half that scores 97.5% under Nick's strict bands.

## So the real options

**A — post-pass overlay.** Let the verbatim engine paint, then lay material over the
finished portrait in an owned pass. Cheap, reversible, parity intact. **I now recommend
against it**: it was the fallback for "we cannot reach any of it", and we can reach 72% of
it. Spending the weakest option on the remaining third buys decoration-on-top — the exact
thing waves 4–7 existed to stop — for the *only* organisms whose strangeness is the point.

**B — build the five missing alien body plans as owned painters.** This is the option the
handoff described as "largest change, retires a chunk of the verbatim engine, a Phase 6
decision". With the routing fact corrected it is much smaller than that: **five new
painters** (tentacled, membranous, crystalline, gelatinous, radial) plus an extension of the
flora router, all built on the `Tube` machinery that already exists. Each one inherits
materials, countershading, the rim light and the surface laws for free, exactly as the Earth
painters did. It does **not** require touching `hdart.verbatim.js`, so parity is untouched
and nothing is "retired" — the verbatim engine simply stops being reached for those plans,
the same way it stopped being reached for the Earth catalogue.
Cost: comparable to one wave per two painters, so roughly three waves.

**C — accept the gap.** Defensible, and cheaper than it looks now that the gap is a third
rather than everything.

## My recommendation: do not decide this week

The premise — *"aliens read flatter than Earth species"* — has never actually been
measured. It was asserted in the same document that got the routing wrong by a factor of
three. The gold pass is judging all **240 procedural assets right now**, with instructions to
score them on internal coherence rather than Earth resemblance.

That gives us the number this decision actually needs: **do the verbatim-drawn procedural
organisms come back materially worse than the router-drawn ones, or do they come back
fine?** If they come back fine, C is correct and free. If the verbatim ones cluster in the
FAIL/POLISH bands while the owned ones pass, that is a direct measurement of what B would
buy, per asset.

**Ask me again when the gold pass lands.** It costs nothing to wait, and it converts a
three-way judgement call into an arithmetic one.

⚠ Whatever is chosen: **never edit `hdart.verbatim.js`.** It is byte-locked, carries a
sha256, and `tools/lift-hdart.mjs` will silently revert any edit on the next lift.
