# PLAN — driving the catalogue to a clean pass

> **Historical planning note.** The user now requires a literal all-fresh
> strict-PASS certification rather than this document's former zero-FAIL
> recommendation. The live contract is
> [GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md](GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md);
> preserve this plan for its prior reasoning and do not use its stale counts as
> current evidence.

Written 2026-08-03 at the end of the waves 35–47 session, at Nick's request: *"let's try to get
the 100% pass."* This is the map and the route. It is deliberately honest about what "100%"
can and cannot mean, because the number that gets quoted back matters.

---

## 0. ⚠ READ THIS BEFORE QUOTING ANY NUMBER

**The 473/590/187 baseline is STALE.** It was measured by the gold pass before waves 38–47.
Those waves changed the ear painter, the horn painter, the pose axis, six occluded faces, the
snake/lizard/turtle painters, three procedural family painters and the truffle. **Nobody has
re-rendered the catalogue since.** The true current count is unknown and is almost certainly
better than 473.

★ So **step 1 is a re-measure, not a fix.** Any plan that starts by fixing is fixing against a
photograph of a build that no longer exists — the exact mistake that made `visualaudit.json`,
`mammalaudit.json` and the 962-row queue dead files.

---

## 1. What "100% pass" can mean

Three different targets get called this. Only two are reachable.

| target | current | reachable? |
|---|---|---|
| **Every gate green, no drift, no hard look-alikes** | Earth ✓ · procedural 3 hard pairs | **yes — close now** |
| **Zero FAIL band** (every asset at least POLISH) | ~473 stale, unknown live | **yes, but it is an arc of sessions** |
| **Zero POLISH — every asset PASS** | 187 PASS of 1,250 | no, and it is not a real goal — POLISH is the band for "correct and improvable" |

★ **Recommend targeting the middle row: zero FAIL.** A FAIL means the asset does not read as its
species — a defect. POLISH means it reads correctly and could be prettier, which is an infinite
budget with no defect behind it.

---

## 2. The measured shape of the work (from `goldpass-results.json`)

**By set** — where the FAILs live:

| set | FAIL | of | rate |
|---|---|---|---|
| earth-fauna | 277 | 631 | 44% |
| earth-flora | 153 | 332 | 46% |
| procedural | 26 | 240 | 11% |
| earth-fungi | 14 | 27 | 52% |
| earth-microbe | 3 | 20 | 15% |

**By painter class** — who has to be edited, which is what actually predicts cost:

| class | FAIL | of |
|---|---|---|
| flora | 147 | 314 |
| fauna | 132 | 298 |
| quadruped | 78 | 142 |
| invert | 35 | 79 |
| procedural | 26 | 240 |
| bird | 25 | 75 |
| species | 17 | 87 |
| ~~verbatim-*~~ | ~~13~~ | ~~15~~ | **← was a lie; see §4** |

**By theme** (keyword buckets over `verifyWhy`; rows can carry several):

```
309  missing feature          188  shape / silhouette
137  flat / no material        98  duplication / look-alike
 78  colour / palette          59  occlusion / z-order
 46  proportion / scale        28  pose / stance
 34  (unthemed)
```

★ `missing feature` being the largest bucket by a wide margin is the useful signal. That is the
D-ART-100/D-ART-137 family — **a field that is set, documented, and never read, or read and then
occluded.** Those clear in bulk: one painter fix clears every species that sets the field.
Chase those before anything cosmetic.

---

## 3. The route

**Stage 1 — RE-MEASURE (do this first, always).**
Re-render all 1,250 and re-judge. Slices in `goldpass-slices.json`.
⚠ Fix the harness first: the code pass's verification never ran because its hunt→verdict join
keyed on a free-text `claim` the verifier rephrased. **Join on an identifier, never on
model-authored prose.** The gold pass joined on `species` and worked.

**Stage 2 — THE BULK CLEARS, in this order** (cheapest defect-per-edit first):
1. `missing feature` cluster — grep each named field for a reader, then render. Every instance
   found so far was one of: never read, read but overdrawn, or read but occluded.
2. `duplication / look-alike` — 98 rows. The procedural half is diagnosed (§5).
3. `shape / silhouette` — 188 rows, but many resolve as a side effect of 1 and 2.
4. `colour / palette` — 78 rows. Black Truffle (wave 47) was one: **routed bare, with no
   `speciesHue`, so it inherited a generic palette.** Grep for other bare routes; that is a
   one-line fix per species and it is mechanical.

**Stage 3 — THE SINGLES.** Whatever survives is per-species work. Budget it last, and expect
the count to be far below the stale 473.

**Stage 4 — RE-MEASURE AGAIN.** Same harness, same join key. The delta is the report.

---

## 4. ★ 13 FAILs were unfixable until wave 47 — check for more of this

15 assets classed `verbatim-*`, the class the lock forbids anyone to move; 13 were FAILs. **All
15 were misclassified** — every one routes to a painter we own. `artclass.mjs` missed them for
three separate reasons (packed object rows, a U+2019 apostrophe, and the array route lists),
each a different *surface form of the same key*. Six such bugs are now recorded in that one
file's header.

★ **The general lesson for this plan: before believing any category boundary, verify the
scanner that draws it.** A defect filed under "cannot fix, protected class" is exactly the kind
that sits untouched forever. Wave 47 also shows the mirror risk — the obvious fix moved 8 real
species into the wrong painter class, which is worse than under-reporting, and only a
both-directions negative control caught it.

---

## 5. Procedural duplication — diagnosed, 3 left (D-ART-143)

```
PROCEDURAL   240 assets · 3 hard pairs (<0.6)   ← was 19, seven at distance 0.00
EARTH      1,010 assets · 0 hard pairs
```

Cause: **7 of 26 family painters draw one fixed picture.** The wave-20 fix made the family
PICKER spread evenly; nobody asked whether the families it picks can draw more than one thing.
Fixed: `tardigrade`, `microAlgaeCell`, `fungiMorel`, `fungiTruffle`.
**Left: `fungiCup`, `microbePlates`, `fungiEarthstar`, `microbeCiliate`.**

Method: vary a **RATIO** off `seeded(g, salt)` — never a canvas scale, the fit pass erases
absolute size (D-ART-34). Each of these also owns an Earth species, so declare
`--touching=…,species` and re-render that species to confirm it still reads.

⚠ `[SAME]` is Earth-only **by design**, so no gate watches procedural duplication. Measure it
with the scratch walk over `lock.fp` + `dist()` recorded in the wave 46 commit.

---

## 6. Standing discipline for this arc

- **Look before reasoning (D-ART-88).** Every real catch in this arc came from a picture. When
  a shape's position is a mystery, tint it flat and render.
- **Fix against `verifyWhy`, never the `defect` line** — 31% of stated causes were wrong while
  the verdict stood.
- **Suspect a new scan before the code (D-ART-140).** Four instrument-first lies this session.
- **Never bless to turn red green.** A bless claims a person looked.
- **Declare the classes that MOVED**, not the file you edited.

---

# ⚠⚠ SUPERSEDED 2026-08-03 (session 2) — READ THIS BEFORE ANYTHING ABOVE

Everything above was written against the **473 / 590 / 187** baseline. That baseline has been
re-measured and the plan it implies has been partly invalidated. Live state:
`reference/GOLD_PASS_2_2026-08-03.md` and `reference/AUDIT_JOIN_2026-08-03.md`.

1. **Stage 1 (RE-MEASURE) is DONE.** 431 FAIL / 748 POLISH / 71 PASS, 1,250 rows, every FAIL
   adversarially verified, joined on `species` at every hop. The harness bug this file warned
   about is fixed structurally (identifier join + per-batch expected-name filter + mop-up).
2. **Do not quote 473 → 431 as progress (D-ART-150).** The untouched sets got worse and 85% of
   old PASSes were demoted; the passes are differently calibrated. 431 is the new baseline.
3. **§2's headline is now wrong.** This file says `earth-fauna` is the worst region and scopes
   the route around fauna. It no longer is: **flora is the largest bucket (170 of 431) and its
   FAIL rate ROSE.** Fauna fell 277 → 198. **The next arc is a flora arc, and nothing here is
   scoped for it.**
4. **§2's theme table is superseded.** `missing feature` is still the largest (411), but
   `colour / palette` (345) and `flat / no material` (321) now outrank `shape / silhouette`
   (238). **With anatomy improving, the surface is what fails** — the material pivot this
   project has been waiting on is now the evidence-backed call, not a guess.
5. **The biggest defect is not in this plan at all.** The family chassis — twelve canids as one
   pony, twelve felids as that pony with spots. It is a *scaffold* defect, invisible to any
   per-asset count (D-ART-147). It outranks every item above. The model for it is already
   established with the tint trick; see the handoff.
6. **§5 (procedural de-duplication) stands** — four constant painters remain. But add: some
   procedural assets are **structurally broken** (anterior clipping — `fauna-h1-s3`,
   `fauna-h1-s5`, `fauna-h0-s15`), which is a bug, not a variety problem.
