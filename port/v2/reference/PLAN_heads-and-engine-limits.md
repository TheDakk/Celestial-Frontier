# The mammal heads and the four "engine limits" — checked, costed (2026-08-03)

Written while the gold pass renders. **Two of the four things filed as blocked are not
blocked**, and the headline head number is stale in a way that matters.

---

## 1 ★ THE "72 OF 144 GENERIC HEADS" NUMBER IS STALE, AND PROBABLY BY A LOT

`mammalaudit.json` carries `afterWave: 16`. **We are at wave 36.** Twenty waves later it is
still being quoted as current in every handoff, including mine.

It is not just old — it is old in exactly the wrong place. Of its 72 generic-head rows:

| cited in the `headWhy` text | rows |
|---|---|
| the **ear** | **69 / 72** |
| the eye | 70 / 72 |
| "same / identical to <other species>" | 52 / 72 |
| the muzzle | 42 / 72 |
| **explicitly a dark ear DISC / BLOB / PATCH / "fused ear"** | **36 / 72** |

Its own wording: *"one dark round ear patch"* · *"a dark round ear disc"* · *"same fused
dark ear blob on the crown"* · *"the crown carries one dark …"*.

**That is a verbatim description of the bug wave 36 fixed** — the ear filled at 0.52 of the
coat (a hole, not an ear) and the pair merged because the root separation scaled with the
ear's own size. Half of these 72 verdicts name a defect that no longer exists.

**Do not work this file.** Re-measure heads after the gold pass and see what the real
number is. Working a 20-wave-old list would mean editing table rows to fix things that are
already fixed — and that is how a global pass gets run over signed-off work.

---

## 2 · THE FOUR "ENGINE LIMITS" — two are cheap, one is medium, one is a real arc

`mammal-species-fixes.md` files all four under *"STRUCTURALLY UNREACHABLE — for the
upgrade, not for this engine."* That is true of one of them.

### ✅ CHEAP — "No marking can appear on a leg" is **reachable now**
The claim is that *"the four leg Tubes are filled before the coat clip and never revisited."*
The second half is true; the conclusion does not follow. `drawLeg` **already** does:

```
limb.trace(c, 40); c.fill();
c.save(); limb.trace(c, 40); c.clip();      // ← an open clip, on a real Tube
countershade(c, limb, lp, 0.85);
coatMaterial(c, limb, r, lp, …);
```

Every `coat*` function in `skin.ts` takes a `Tube`. Adding the species' own coat marks
inside that existing clip is the same call shape already on the line below. **~15 lines**,
and it unlocks zebra leg bands, okapi's striped upper legs, panda's black legs, and the
spotting that should run down every felid's limb. This is the highest payoff-to-cost item
left in the mammals. It wants the `coatZone` axis (a u-range + an include-legs flag) so a
species can say *rear legs only* (Okapi) or *all four* (Zebra).

### ✅ CHEAP — camel humps
*"filled flat in `p.base` AFTER the coat and material layers, so they can never carry the
coat and always show a seam. They must be folded into `topY()`."* — correct, and `topY()` is
the right place: it feeds `dorsal()`, which feeds `RAD`, which builds the body `Tube`. Fold
the hump in there and it becomes part of the solid, inheriting the coat, the material, the
countershading and the rim light for free, and the seam becomes unreachable rather than
fixed. Same shape of fix as wave 4's torso. **Medium-low.**

### ◐ MEDIUM — fore and hind limbs are always the same length
*"all terminate at `groundY`"* — true, but that is correct: a standing animal's feet are all
on the ground. What is actually wrong is that both limbs root at `AX(u)` on one axis, so the
hip and the shoulder sit at the same height and a hyena's falling topline can only be faked
by `back:'sloped'`. The fix is a per-pair **root height** offset, not a per-pair foot height
— lower the hip root and let the leg's own taper absorb it. **Medium**, and it finishes the
hyenas, which wave 35 only half-fixed.

### ✗ A REAL ARC — poses
*"`faunaQuadruped` only draws a horizontal quadruped with four feet on `groundY`."* This one
is genuinely structural: the meerkat's sentinel stance, the sloth hanging inverted and the
pinniped haul-out each need a different body-axis construction, not a parameter. Treat it as
its own arc with its own gate, not as an item on a fix list. The pinniped is the cheapest of
the three and is already half-way there (flipper feet, `crouch: 0.04`).

---

## ⚠ THE PATTERN ACROSS ALL OF THIS

Three claims in these worklists have now been checked and three were wrong, all in the same
direction — **pessimistic about what the engine can already do**:

1. *"Procedural fauna and flora do not route to owned painters."* → 72% and 56% of them do.
2. *"72 of 144 mammal heads are generic."* → measured 20 waves ago; half the reasons name a
   bug fixed since.
3. *"No marking can appear on a leg."* → an open clip on a real Tube is already sitting there.

These files were written by agents that **reasoned about the source instead of running it**,
which is the failure mode D-ART-88 exists to name. They are excellent as lists of *things to
look at* and unreliable as statements of *what is true*. **Check the claim before costing
the fix** — every one of these took under five minutes to verify.
