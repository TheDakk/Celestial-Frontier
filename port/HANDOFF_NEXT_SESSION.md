# ★ COLD-START HANDOFF — read this first, then port/PROPORTION_ARC.md

## ★★ WAVE 35 (2026-08-03) — read this block before the rest of the file

**The live queue is `port/v2/reference/mammal-species-fixes.md`, then `reaudit-worklist.md`.**
Wave 35 closed that file's entire top section — the wrong-family chassis (Cheetah, Panda, the
three hyenas via a new `hyaenid` family, Sloth, both tapirs) and **all six** of its listed
cross-species painter bugs (banded tail, tuft tail, horn/tusk anchors, limb-exit occlusion,
shaggy rim, `nosePad`). New axes: `skull?: MammalFamily`, `back:'roached'`, `trunk: number`,
`tailTip` on plain tails — which leaves **Hippopotamus, Walrus, Raccoon and Aardvark as
one-line table edits.**

- ⚠ **D-ART-137 — `if (earShape === 'hidden') return;` returned from the WHOLE painter.** The
  eye, face marks, horns, trunk and tail were skipped for Sloth, Mole, Seal, Fur Seal, Sea
  Lion and Walrus. Six eyeless animals and a tuskless walrus, with every gate green — artlock
  had blessed the broken render as its own baseline. **A fix can be right about the thing it
  names and wrong about where it stops**, and only a render tells you which.
- ⚠ **D-ART-138 — `npm run artbattery` invoked artlock with no arguments**, so stage 6 read
  "declared: (nothing)" and failed on every legitimate change. It forwards args now:
  **`npm run artbattery -- --touching=quadruped`**.
- ★ **The worklist prescriptions are agent-written and are not always right.** Two of wave
  35's rendered wrong (the Panda's prescribed band leaves a white chest). Render first.
## ★ WAVE 36 (2026-08-03) — the ear system, on Nick's catch

He spotted the donkey's ears on the wave-35 proof sheet. The ear was broken three ways:
the size ladder was **inverted at the top** (Donkey/Wild Ass at `'huge' × earScale 1.70` =
1.96·headR, LARGER than the Fennec Fox at 1.50); the **root separation scaled with the
ear's own size**, so a long pair pushed itself apart until the two merged into one mass;
and the ear was **filled at 0.52 of the coat, which is a hole, not an ear** — the back of a
real ear is coat-coloured and the dark part is the concha inside it. That last one is why
53 `'large'`-eared species all wore the same dark cap.
Also fixed: `tail:'bushy'` was a straw broom (110 straight fixed-width strokes reaching 90%
of the tail's width out of it — the same three faults wave 35 fixed in the shaggy rim, in a
second place), and the elephant's ear fan, whose comment claims it is drawn behind the head
and never was.

⚠ **The lesson worth carrying: `earScale` was being used to force a read that the ear's
TONE was preventing.** The 1.70 was a workaround for a fill bug two layers down. When a
per-species multiplier has to go far past its ladder, suspect the thing it is compensating
for.

**Still open:** the hyena bodies are half-fixed, because fore and hind limbs are always the
same length (a listed structural limit), so a falling topline can only ever be faked.

---

**Written 2026-08-02 at the end of waves 4–21.**
The live work is **THE PROPORTION ARC** — making every organism in the Earth catalogue look
like the real thing, on Nick's instruction. Waves 4–21 have landed. ★ EARTH COVERAGE IS 1010/1010 — Bucket A is closed.

### What waves 20–21 changed that the rest of this document predates

- **The roster is DEDUPED: 1,014 records → 1,010 organisms** (D-CAT-1, Nick's explicit call).
  Four organisms were filed in two kingdoms each. The fix lives in the OWNED wrapper
  `packages/domain/descriptors/src/apphooks.ts`, never in `apphooks.verbatim.js`, which is
  byte-locked and auto-lifted — an edit there breaks the parity contract and the next lift
  silently reverts it. **Earth names shifted for every flora and microbe** as an accepted
  cost; fauna and fungi did not move. `baseline.json` was NOT regenerated — the one probe
  that cannot be byte-equal is compared through a narrow mask with six negative controls.
  Painted assets are now **1,250**.
- **`npm run artbattery` is now SIX stages, and artlock is one of them.** It never was
  before, despite this document calling it the gate (D-ART-109).
- **The material layer reaches past the mammals** — birds have feathers, fish have scales
  that actually show, arthropods have shell. No painter was rewritten: `ellipseTube` and
  `profileTube` in `torso.ts` give an ellipse- or profile-bodied painter the same surface
  coordinates the mammals earned in wave 4.
- ⚠ **artlock CANNOT see a material change** (D-ART-110). Its fingerprint is 16×16 RGB at
  eps 0.9, which is right for catching a global palette pass and structurally blind to fine
  texture — feathering 105 birds moved 11 assets. **Review material work by eye with
  `node tools/speciesstrip.mjs "Crow,Beetle,Salmon" out.png` and Read the PNG.** An artlock
  green means the palette held, not that the material is right.

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

`node tools/artlock.mjs --touching=<class>` fingerprints all 1,250 rendered assets and answers
the two questions no other gate here could. **It is stage 6 of `npm run artbattery` as of
wave 21** — for waves 4–20 it was documented as part of the gate and was not actually in it,
so it only ever ran when someone remembered to type it (D-ART-109).

⚠ **Its blind spot, know it before you trust it:** the fingerprint is a 16×16 RGB grid at
eps 0.9, so it sees a palette or proportion pass and CANNOT see surface texture at all
(D-ART-110). Material work needs an eyeball pass, not a green tick.

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
  (234/240 vs 58/1010). That gap is the whole story: a generator is good at coherent variety and
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
5. ✔ **The unrouted — DONE.** 1010/1010. Every Earth organism has a real
   painter and nothing falls to the verbatim engine. The arc opened at 930.

**BUCKET A IS CLOSED.** All five structural items are done. What remains before
the material decision: the 72 mammal heads that are still generic (TABLE work —
inverted or missing family traits, itemised per animal), the ONE hard look-alike
pair (Water Mint ≈ Chicory, needs a bare-branching-stem axis), and the
non-mammal audit backlog.

**Then the material pass** — see the strategic note above. The gate for it is
 in reference/mammalaudit.json: 0 → 1 of 144 so far, so anatomy is
still binding. When it climbs, pivot.

---

## OPEN, IN PRIORITY ORDER

1. **★ HEADS: 72 of 144 unique** — measured three times now: **20/141 → 52/144
   → 72/144**. Half the mammals have a head that could not be swapped. The
   72 that could are itemised with a reason each in `reference/mammalaudit.json`;
   the recurring ones are inverted or missing family traits (an arctic fox with
   pointed ears and a long muzzle, an aardvark with no rabbit ears) rather than
   a shared token — i.e. TABLE work now, not painter work.
   ⚠ **surfaceOnly is 1 of 144.** Anatomy is still the binding constraint and
   the material pivot is NOT due. **That is the number that decides it.**
   ⚠ artlock reports ZERO drift for feature-scale work (D-ART-103) — verify ears,
   eyes and muzzles by opening a native-size PNG, and run `--expect` whenever you
   edit spec rows (D-ART-104).
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
