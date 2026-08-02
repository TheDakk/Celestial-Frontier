# ★ COLD-START HANDOFF — read this first, then port/PROPORTION_ARC.md

**Written 2026-08-02 at the end of batch 49. HEAD = `095e28e`.**
The live work is **THE PROPORTION ARC** — making every organism in the Earth catalogue look
like the real thing, on Nick's instruction. Nothing is half-applied; every batch below is
committed and gate-green. The next session picks up at **STAGE 3, WAVE 4**.

---

## READ IN THIS ORDER (5 minutes)

1. **this file**
2. `port/PROPORTION_ARC.md` — the arc plan, all four stages, what has landed, what is open
3. `port/v2/DEVIATIONS.md` — the laws (D-ART-1..88). Read **D-ART-83 and D-ART-88 first**; they
   are the two that cost the most this session.
4. `ROADMAP.md` — the batch log, newest first
5. `PROCESS_LAWS.md` — the project-wide laws about checks that pass while broken

Do **not** read `port/MORPHOLOGY_PASS.md` end to end; it is a long append-only log. Grep it.

---

## WHERE WE ACTUALLY ARE

**Coverage: 951 / 1,010 Earth species routed (94.2%).** 1,254 assets paint, 0 duplicates,
0 clipped. `hdart.verbatim.js` untouched, as always.

### What is BUILT and working
- `port/v2/reference/{fauna,flora,other}.json` — **1,014 reference rows**, exact one-to-one with
  the catalog, zero UNKNOWNs. Per species: proportion, head fraction, eye prominence, posture,
  growth form, leaf/colour/harvest, and 1–3 `mustRead` features. The `note` column names how
  each organism is **commonly drawn wrong**, and is the most useful field in the table.
- `tools/referencecheck.mjs` — gates that table. Negative-controlled both ways.
- `tools/conformance.mjs` — renders every species, measures it, diffs it against its reference
  row. `--selftest` holds 7/7. **This is the report that drives the work.**
- `tools/proportioncheck.mjs` — aspect + end-lobe measurement across a kingdom.
- The usual battery: `npx vitest run`, `npx tsc --noEmit`, `npm run artbattery`, `npm run smoke`,
  `node tools/overridecheck.mjs`, `node tools/artaudit.mjs`, `node tools/coveragegap.mjs`.

### What Nick has asked for and is NOT DONE — this is the wave-4 list
1. **★ THE LEGS DO NOT BLEND INTO THE BODY.** Nick: *"there's a line between their body, almost
   like it looks like the legs are hooked in."* The legs are bare strokes drawn before the
   torso, so their roots are covered but there is no **shoulder or haunch MASS** wrapping them.
   A real limb emerges from a bulge of muscle continuous with the trunk. **This is the single
   biggest "not a real animal" tell.** One change to the shared quadruped system; every mammal
   inherits it.
2. **★ THE PATTERNS ARE SPRAY-PAINTED, NOT SKINS.** Nick: *"think of it like a skin, not like
   you're painting on top of the animal… a lot of games have skins."* Marks are currently soft
   blobs clipped to the body outline. A skin must: follow the body's contours, **foreshorten as
   it wraps toward the silhouette**, darken where the body turns from the light, and take the
   right SHAPE per species — a tiger's bars are vertical and break over the flank; a zebra's
   bands continue onto the legs and belly; a giraffe's patches are hard-edged with pale seams.
   The reference rows already name the pattern per species. **Build a real skin system.**
3. **The elephant regressed** across three global passes and is worse than the version Nick
   liked. Its good spec is in git — `git show e66dca4:port/v2/packages/art/src/mammaloverrides.ts`
   has the pre-band values. **Recover it rather than re-deriving it.**
4. Cheetah is not cat-like · hippo is blobby · giraffe legs spindly · thin necks at the shoulder
   on the big cats.
5. **26 fauna still unrouted** (drawn by the verbatim engine, so their `mustRead` features
   cannot be expressed at all): crocodilians (Crocodile, Alligator, Caiman, Gharial), bats
   (Bat, Fruit Bat, Vampire Bat), pinnipeds (Seal, Fur Seal, Sea Lion), Kangaroo, Wallaby,
   Platypus, Echidna, Chameleon, Frilled Lizard, Chicken, Rooster, Seahorse, Poison Dart Frog,
   Caecilian, Vampire Squid, Deep-Sea Octopus, Porpoise, Whale.
6. **The 17 flora NEEDS_FIX rows** from the Platinum audit (task #24) — never started.
7. **The eye sensor in `conformance.mjs` is NOT TRUSTWORTHY** (8/20 against ground truth) and
   its `[A]` finding class is deliberately SUPPRESSED. It needs a fifth rebuild before it gates.

---

## ⚠ THE FOUR MISTAKES THIS SESSION MADE — do not repeat them

1. **A BAND IS NOT A REFERENCE (D-ART-83).** I clamped 127 quadruped torsos into a 1.5–2.0
   ratio band. Almost every spec was outside it, so almost every spec snapped to the **same
   boundary value**, and Nick immediately saw that *"every animal on four legs has kind of the
   same body type… the elephant has adopted the wolf body."* **Derive every spec from that
   species' own reference row. Never from a band, a family default, or a neighbour.**
2. **A DRAWING FIX IS NOT DONE UNTIL YOU LOOK AT THE PIXELS (D-ART-88).** I reported the rear
   cusp as fixed because the code read correctly. `smoothTop()` opens with `moveTo`, which
   starts a new subpath, so the "fix" was orphaned geometry that never drew — and canvas closed
   it with a straight chord. **Render a strip and look at it before claiming anything.**
3. **A CONTROL ON THE DECISION LAYER SAYS NOTHING ABOUT THE SENSOR (D-ART-81).** conformance's
   self-test held 7/7 while the eye detector feeding it was 40% accurate.
4. **STOP RUNNING GLOBAL PASSES.** Three successive arithmetic sweeps turned a good elephant
   bad and made 127 animals identical. Go **per animal, verified against a render**.

---

## ⚠ ON REFERENCES — TELL NICK THE TRUTH

**I cannot see images.** Not from the internet, not from search. The "reference" table is text
generated from model knowledge — a second opinion from the same kind of source that draws the
art. Nick asked repeatedly for real photos; that ask has **not** been satisfied and he should
not be left believing otherwise.

**The single biggest upgrade to this loop: ask Nick to drop reference images into the repo.**
Those *can* be read directly. Short of that, fetch descriptive sources per animal rather than
recalling from memory — and do it one animal at a time.

Every real catch this session came from Nick looking at a strip, not from any instrument.

---

## THE EXPORT NICK IS REVIEWING

`port/v2/apps/game/smoke/species-fullsize/` — five zips + unzipped folders, 1,254 portraits at
native 440×440, current as of `095e28e`. Fauna (95 MB), flora (56.5), fungi (5.1), microbe
(4.2), procedural (43.7). Three exceed the 30 MiB chat upload limit; they are local files.
Regenerate any time with `node tools/speciesexport.mjs`.

In that export: every mammal has changed; fish, birds, insects, reptiles, flora, fungi and
microbes were untouched by this arc and are the useful control.

---

## COMMANDS

```bash
cd C:/Projects/Celestial-Frontier/port/v2

# see the work list — THIS DRIVES WAVE 4
node tools/conformance.mjs fauna --json conf.json
node tools/conformance.mjs flora --json conf-flora.json

# look at specific animals (the only instrument that has actually worked)
node tools/speciesstrip.mjs "Wolf,Lion,Cheetah,Hippopotamus,Elephant" check.png

# what still has no route
node tools/coveragegap.mjs

# the gate battery — run ALL of these before any commit
npx vitest run
npx tsc --noEmit           # from apps/game
npm run artbattery         # 5 stages incl. speciesaudit 1254/1254
npm run smoke
node tools/overridecheck.mjs && node tools/overridecheck.control.mjs
node tools/artaudit.mjs
node tools/referencecheck.mjs

# hand Nick a fresh set of prints
node tools/speciesexport.mjs
```

---

## WHAT TO SAY TO START THE NEXT SESSION

> Continue the Celestial Frontier proportion arc. Read port/HANDOFF_NEXT_SESSION.md first.
> Start with wave 4: the limb-to-body blend and the skin system.
