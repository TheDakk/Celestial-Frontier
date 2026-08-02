# ★ COLD-START HANDOFF — read this first, then port/PROPORTION_ARC.md

**Written 2026-08-02 at the end of waves 4–5. HEAD = `e7fe38a`.**
The live work is **THE PROPORTION ARC** — making every organism in the Earth catalogue look
like the real thing, on Nick's instruction. The next session picks up at **STAGE 3, WAVE 6:
THE HEAD**, and at the two big worklists described below.

---

## ★★ THE ONE THING THAT CHANGES EVERYTHING — READ THIS FIRST

**YOU CAN SEE THE ART.** The previous four handoffs said the opposite, in bold, and it was
wrong. The exported portraits are PNG files on disk and the **Read tool renders them**:

```
Read C:/Projects/Celestial-Frontier/port/v2/apps/game/smoke/species-fullsize/earth-fauna/Cheetah.png
```

One look found four defects that four waves of geometry reasoning had missed. **Subagents can
see them too** — that is how 1,113 organisms were audited this session.

Every real catch in this arc came from looking at a picture. Not one came from an instrument.
**Look before you reason, and look again before you claim anything is fixed** (D-ART-88).

---

## READ IN THIS ORDER

1. **this file**
2. `port/v2/DEVIATIONS.md` — the laws. Start at **D-ART-89 … D-ART-95**; they are this
   session's and they are the expensive ones.
3. `port/PROPORTION_ARC.md` — the arc plan
4. `ROADMAP.md` · `PROCESS_LAWS.md`

Do **not** read `port/MORPHOLOGY_PASS.md` end to end. Grep it.

---

## THE SAFETY NET — RUN IT, AND UNDERSTAND WHY IT IS SHAPED THIS WAY

`node tools/artlock.mjs --touching=<class>` fingerprints all 1,254 rendered assets and answers
the two questions no other gate here could:

- **[DRIFT], scoped by painter class.** Nick: *"It only needs to apply to the organisms that
  we're dealing with in that class… we just want to make it so that the global passes don't
  retroactively affect all the earth work we put in."* Declare what you are editing. Drift
  inside the declared classes is the work; **drift outside them is the failure**, because that
  is exactly what a global pass looks like. Declare nothing and nothing may move.
  - `procedural` is **advisory** — that library is meant to keep changing while we iterate on
    the generator, so it never fails the gate.
  - `verbatim-*` is the opposite: those species are drawn by `hdart.verbatim.js`, which nobody
    may edit, so **any** movement there is a real bug.
  - `--bless --class=quadruped` re-blesses ONE class. That is the mechanism that lets you run
    an intentional retroactive pass over one family without unpinning the rest of the Earth
    catalogue.
- **[SAME], Earth only, two ratchets.** `WATCH 2.5` (worth fixing) and `HARD 0.6` (the same
  picture with two labels). Both may only ever go DOWN. Today: **4,322 watch pairs, 33 hard.**
  The hard list is a worklist, not a regression — the ratchet is the guard.

Calibrated against ground truth, not guessed: Nick's audit engine independently listed 22
template-sharing clusters (115 pairs); at WATCH=2.5 this catches 95 of them while flagging
0.9% of all other pairs. `--selftest` holds 9/9 on the decision layer. ⚠ D-ART-81: that says
nothing about the fingerprint sensor — the sensor's control is that a bless-then-rerun reports
zero drift, which it does.

**NEVER bless to turn a red report green.** A blessing is a claim that a person looked.

---

## WHAT LANDED THIS SESSION

- **`torso.ts` — the torso is a SOLID.** A generalized cylinder (spine + radius profile).
  Silhouette, shoulder/haunch mass, foreshortening and per-point lighting all come from it.
  `smoothTop()`/`traceBody()` deleted; the whole class of cusp/seam/tangent bugs is unreachable.
- **`skin.ts` — the coat is a SKIN.** Marks authored in (u along spine, phi around girth):
  real tapered stripe bands, Voronoi giraffe patches with pale seams, zebra bands crossing the
  belly, rosettes, brindle, shaggy with a broken silhouette, and **countershading on every
  mammal** — which alone did more than any marking.
- **Family body plans.** 11 families carrying only what is anatomically true of all members
  (mass distribution, cannon-bone thinness, crouch, and the foot: hoof / cloven / paw /
  plantigrade sole / soft pad). 116 species tagged. Every per-species NUMBER untouched.
- **`tools/artlock.mjs` + `tools/artclass.mjs`** — the safety net above.
- **`tools/auditcards.mjs`** — builds the per-organism work packets for a visual audit.
- **`reference/visualaudit.json`** — 1,111 rows, one per non-quadruped organism, each judged by
  an agent that opened the picture: severity, what it *reads as* to a stranger, the defect, and
  a concrete fix. **964 blockers.** This is a worklist for many sessions.

---

## ⚠ THE TWO WORKLISTS THE NEXT SESSION SHOULD DRIVE FROM

1. **`reference/visualaudit.json`** (mine, above) — non-quadruped organisms only. The 141
   quadruped-routed mammals were deliberately excluded because waves 4–5 were rewriting them;
   **they still need their own visual pass against the new render.**
2. **Nick's anatomy-first audit** — he uploaded
   `Celestial_Frontier_Anatomy_First_Audit_Engine_Package.zip` (xlsx + per-species CSVs +
   contact sheets). It was run against the **pre-wave-4** export, so **some of it is already
   fixed and it has NOT yet been re-checked one-by-one against current art — Nick explicitly
   asked for that comparison and it is the top outstanding request.** Its headline finding
   (global passes gave unrelated species the same scaffold) drove wave 5. Its remaining
   uncorrected items: specialist insects, specialist fish, crocodilians, flightless birds,
   the 19 iconic flora, 10 fungi, 4 microbes, and 4 canonical-ownership duplicates
   (Tardigrade, Reindeer Lichen, Green Algae, Snow Algae).

Both agree on the same top defects, which is the strongest signal available here.

---

## OPEN, IN PRIORITY ORDER

1. **★ WAVE 6 — THE HEAD.** Now the weakest thing on every mammal by a wide margin, and the
   next "not a real animal" tell. It is still one ellipse plus a snout ellipse plus blob ears
   for a cat, a bear, a horse and a hippo alike. Needs skull families the way wave 5 gave limb
   families. **The neck/head also still shows a tonal seam where the neck tube crosses the
   shoulder** — the body's countershade and the neck's do not agree (a cousin of D-ART-91).
2. **The 33 HARD look-alike pairs** — mostly one songbird cluster (Lark/Robin/Weaverbird/
   Swift/Starling/Sparrow/Finch), which Nick's audit found independently. Birds need what
   mammals just got.
3. **The Elephant is visibly broken** (a huge grey head disc over a small body). Its good spec
   is in git: `git show e66dca4:port/v2/packages/art/src/mammaloverrides.ts`. **Recover it.**
4. **59 Earth species still unrouted** (`node tools/coveragegap.mjs`) — crocodilians, bats,
   pinnipeds, Kangaroo/Wallaby, Platypus/Echidna, Chameleon, Chicken/Rooster, Seahorse, etc.
5. The 17 flora NEEDS_FIX rows (Platinum task #24), never started.
6. The `[A]` eye sensor in `conformance.mjs` is still suppressed and still untrustworthy
   (8/20). Honestly: **the visual audit has superseded it.** Consider deleting rather than
   rebuilding it a fifth time.

---

## COMMANDS

```bash
cd C:/Projects/Celestial-Frontier/port/v2

# LOOK AT THE ART. this is the instrument.
node tools/speciesstrip.mjs "Wolf,Lion,Cheetah,Hippopotamus,Elephant" check.png
#   then Read apps/game/smoke/check.png

# the safety net — run it on every art change
node tools/artlock.mjs --selftest
node tools/artlock.mjs --touching=quadruped
node tools/artlock.mjs --bless --class=quadruped     # only after you looked

# build visual-audit work packets, then fan agents over them
node tools/auditcards.mjs fauna --per=8

# the gate battery — ALL of these before any commit
npx vitest run && npx tsc --noEmit -p apps/game
npm run artbattery && npm run smoke
node tools/overridecheck.mjs && node tools/overridecheck.control.mjs
node tools/artaudit.mjs && node tools/referencecheck.mjs && node tools/coveragegap.mjs

node tools/speciesexport.mjs      # fresh prints for Nick (1,254 PNGs + 5 zips)
```

⚠ The export in `apps/game/smoke/species-fullsize/` is **pre-wave-4** and therefore stale for
mammals. Re-run `speciesexport.mjs` before auditing them or before handing Nick new prints.

---

## WHAT TO SAY TO START THE NEXT SESSION

> Continue the Celestial Frontier proportion arc. Read port/HANDOFF_NEXT_SESSION.md first —
> especially the part about being able to see the art, and the artlock safety net.
> Start with wave 6: the head, and re-check Nick's anatomy audit against the current render.
