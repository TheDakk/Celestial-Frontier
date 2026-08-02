# ★ COLD-START HANDOFF — read this first, then port/PROPORTION_ARC.md

**Written 2026-08-02 at the end of waves 4–12.**
The live work is **THE PROPORTION ARC** — making every organism in the Earth catalogue look
like the real thing, on Nick's instruction. Waves 4–12 have landed. The structural queue below is four-fifths done.

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
2. `port/v2/DEVIATIONS.md` — the laws. Start at **D-ART-89 … D-ART-99**; they are this
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
- **[SAME], Earth only.** `WATCH 2.5` orders the worklist; `HARD 0.6` is the same picture with
  two labels. Today: **~4,350 watch pairs, 33 hard.** What is GATED is narrower than what is
  printed, and deliberately so — see **D-ART-97**. The watch count is reported but only a pair
  the change pushed below the **confusable line 1.5** fails, because 1% of entirely unrelated
  pairs already sit under 2.6 and counting crossings of that band measures noise. The first
  version of this ratchet failed wave 6 over *Bullfrog ≈ Cat at 2.4*.

Calibrated against ground truth, not guessed: Nick's audit engine independently listed 22
template-sharing clusters (115 pairs); at WATCH=2.5 this catches 95 of them while flagging
0.9% of all other pairs. `--selftest` holds 9/9 on the decision layer. ⚠ D-ART-81: that says
nothing about the fingerprint sensor — the sensor's control is that a bless-then-rerun reports
zero drift, which it does.

**It has already earned its keep twice**: it caught wave 6 making every felid share a face
(D-ART-96), and then its own first threshold turned out to be measuring noise (D-ART-97). A
failing gate must print the exact rows it means, or it just gets argued with.

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
- **Skull families (wave 6).** Per-family face length, forehead "stop", jaw depth and — the one
  that matters most — EYE PLACEMENT: forward and central on a predator, high and far back on a
  grazer. The neck also moved BEHIND the torso, removing the last visible seam on the animal.
- **`reference/visualaudit.json`** — 1,111 rows, one per non-quadruped organism, each judged by
  an agent that opened the picture: severity, what it *reads as* to a stranger, the defect, and
  a concrete fix. ⚠ Its severity scale is HARSHER than Nick's (agents were told to be demanding
  art directors, and any missing must-read counts as a blocker) — 964 "blockers" is not
  comparable to his 115 FAILs. The per-row text is the value, not the label.
- **`reference/nick-audit-recheck.json`** — a verdict on every non-mammal row of Nick's own
  audit against the current render: **16 fixed · 54 partly · 23 not fixed.**

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

## ★ THE STRATEGIC QUESTION, ASKED AND ANSWERED (2026-08-02)

Nick asked whether this is the Pixi engine and whether it is the best we can do. Two facts to
carry forward, because they should shape what the next session even attempts:

- **The species art is NOT Pixi.** Pixi renders the galaxy/world scene (`apps/game/src/main.ts`).
  Every organism portrait is plain `CanvasRenderingContext2D` — procedural 2D drawing rasterised
  to a data URL and cached. Swapping in Pixi/WebGL would change nothing about how these look;
  the ceiling is the DRAWING APPROACH, not the renderer.
- **The same engine scores 97.5% on procedural and 5.7% on Earth** under Nick's strict bands
  (234/240 vs 58/1014). That gap is the whole story: a generator is good at coherent variety and
  bad at hitting a specific named target. We are asking one system to do both.
  **The obvious split — authored assets for the 1,014 fixed Earth species, the runtime generator
  for the aliens — is the highest-leverage decision available and has not been made.** It also
  maps exactly onto the protect-Earth / iterate-procedural split Nick already asked the safety
  net to enforce.

---

## THE STRUCTURAL QUEUE — WHERE IT STANDS

Nick set this order on 2026-08-02: fix the structural findings (the ones a
future material/texture pass provably cannot fix), and defer the surface ones.

1. ✔ **Wrong-class routing and ownership blockers** (wave 8). The bats were
   rendering as bees; the tardigrade's eight legs read as four. Both fixed.
   ⚠ NOT done, and deliberately: Green Algae / Snow Algae / Reindeer Lichen /
   Tardigrade still exist as TWO CATALOG RECORDS each. The painters are right
   per kingdom; collapsing the records is a data change touching species counts
   and saves. **Nick's call.**
2. ✔ **Birds** (wave 8). The songbird blob is gone — see below.
3. ✔ **The unmodelled families** (wave 9): marsupial, procyonid, xenarthran,
   pinniped, burrower, plus 'claw' and 'flipper' feet. 21 species off 'generic'.
4. ✔ **The named regressions** (wave 9): the rectangular tail base, the
   elephant's Asian topline and knee-height trunk, the walrus's legs.
5. ▶ **The unrouted** (wave 10, PARTIAL). 951 → 968 of 1,014. Crocodilians,
   pinnipeds, poultry and the missing cetaceans are done. **46 remain** —
   `node tools/coveragegap.mjs` (46 left). The biggest fauna clusters left:
   Kangaroo/Wallaby (a bipedal hopper — needs a new pose, not a new spec),
   Platypus/Echidna, Vampire Squid/Deep-Sea Octopus, and the singletons
   (Chameleon, Frilled Lizard, Seahorse, Poison Dart Frog, Caecilian).
   Plus flora 13, fungi 7, microbe 12.

**Then, and only then, the material pass** — see the strategic note above.

---

## OPEN, IN PRIORITY ORDER

1. **★ THE HEADS ARE STILL NOT UNIQUE — 20 of 141** (measured before waves 7–10,
   so re-measure). Skull SHAPE differs between families and is no longer the
   bottleneck; every FEATURE on it — one ear asset, one white-ringed eye, one
   nose dot — is still shared catalogue-wide (D-ART-99). Wave 13 is ears and
   eyes per species. **This is the biggest open art item.**
2. **ONE hard look-alike pair left: Water Mint ≈ Chicory** (was 33 at the start
   of 2026-08-02, then 19 after the birds, 9 after the fish, 1 after the
   invertebrates). Their reference rows are far apart — a square stem with a
   single round lilac pompom versus stiff wiry NEAR-NAKED branching stems with
   sky-blue ray flowers sitting almost directly on them — but the flora painter
   has **no axis for a bare branching stem**, so both still draw the same leaf
   ladder. That is a painter job, not a table job, and it was left rather than
   bodged. The next tier under it: Crow ≈ Frigatebird, Grasshopper ≈ Thrips,
   Loon ≈ Cormorant, Electric Eel ≈ Lungfish.
   **The recipe is proven four times now** — read the mustReads, add the missing
   spec axes, re-derive each row from its own reference — and
   `node tools/speccheck.mjs` now guards the step that kept going wrong.
