# THE PLATINUM AUDIT — CORRECTION PLAN (2026-08-02)

Nick's second full audit ("Platinum Species Audit Engine Package") came back. The technical
pipeline is **clean**: all 1,254 PNGs open, every image is 440×440 RGBA, **no edge-clipping, no
byte-for-byte duplicates, the procedural matrix is complete, no files added or removed.** The
audit's own instruction: *"Do not perform another universal style change. Run ONE focused
correction cycle."* This plan follows its recommended sequence exactly.

## ★ THE COUNT DELTA IS SOLVED (closes the investigation half of task #14)
The audit's `cross_library_canonical_conflicts.csv` names FOUR organisms that each appear in
TWO kingdom lists: **Tardigrade** (fauna+microbe), **Green Algae** (flora+microbe), **Snow
Algae** (flora+microbe), **Reindeer Lichen** (flora+fungi). **1,014 catalog rows − 4 duplicated
organisms = 1,010 unique organisms.** That is the 4-name delta, explained. The fix is not to
delete rows (the catalog is verbatim `main.js`) but to render each kingdom's copy correctly for
its ROLE.

## Scoreboard from the audit
| category | NEEDS_FIX | PASS_WITH_POLISH | PLATINUM | RELEASE_BLOCKER |
|---|--:|--:|--:|--:|
| fauna | 25 | 595 | 5 | 6 |
| flora | 17 | 298 | 7 | 12 |
| fungi | 2 | 10 | 9 | 6 |
| microbe | 1 | 14 | 3 | 4 |
| procedural | 120 | 60 | 60 | 0 |

Note: the audit ran on the export BEFORE wave 17 (procedural fungi/microbe routing). Wave 17
already addressed part of the 120 procedural NEEDS_FIX; the remainder is "add more families".

## THE 28 RELEASE BLOCKERS, in four buckets

### Bucket A — canonical ownership (4 organisms, 8 rows) — closes task #14
- **Tardigrade** (canonical = ANIMAL): both fauna and microbe copies render as an 8-legged
  water bear with **visible legs + claws**. The microbe copy currently has near-invisible legs.
- **Green Algae**: flora = MACROalgae (a sheet/mat/filament); microbe = a single MICROalgal
  cell with a chloroplast. Two distinct, role-correct renders.
- **Snow Algae**: flora = a surface bloom/field; microbe = a single cell / small colony.
- **Reindeer Lichen**: flora AND fungi both render a **pale branching lichen mat** (the fungi
  copy is currently a wrong shelf-on-wood). Unify.

### Bucket B — fungi bespoke (6)
- **Fly Agaric** — red cap with white warts (currently plain caps).
- **Lion's Mane** — a white hanging pom-pom of tooth-like spines (currently coral branches).
- **Maitake** — a dense rosette of overlapping fronds (currently cap-and-stem).
- **Stinkhorn** — an upright stalk with a dark gleba cap (currently a cap cluster).
- **Cordyceps** — clustered club fruiting bodies on a host (currently a white tree).
- **Reindeer Lichen** — see Bucket A.

### Bucket C — flora iconic (10)
- **Cabbage** — a compact layered leafy head. **Carrot** — a root + feathery leaves.
- **Corn** — a tall stalk with leaves, a tassel and a visible ear. **Hemp** — palmate leaves,
  branched herb. **Tobacco** — broad leaves + a tall flower stem. **Watermelon** — a creeping
  vine with fruit. **Wild Strawberry** — trifoliate leaves, runners, flowers, fruit. **Kiwi
  Fruit** — a vine with fuzzy fruit. **Sea Lettuce** — a green sheet. **Green Algae** — Bucket A.

### Bucket D — fauna + microbe (6)
- **Kiwi** (bird) — a low round flightless body, long thin bill, no visible wings.
- **Mudskipper** — raised eyes, strong pectoral props, amphibious posture.
- **Pyrosome** — a hollow colonial tube (currently a jelly).
- **Salp** — a translucent barrel / chain of barrels (currently a jelly).
- **Tripod Fish** — elongated fin rays supporting a tripod stance.
- **Foraminiferan** — a chambered shell/test with radiating pseudopodia (currently a plain cell).

## THE 165 NEEDS_FIX (non-blocking polish, do after blockers)
Clusters: **specialist deep-sea fish** (Barreleye tube-eyes, Fangtooth, Viperfish, Blobfish,
Flying Fish, Flying Gurnard), **seabirds/waders** (Albatross long wings, Secretary Bird,
Spoonbill, Kookaburra), **marine mammals** (Humpback, Beaked Whale, Dugong, Manatee — elongate
bodies), **iconic flora** (Cotton, Dragon Fruit, Cinnamon, Cardamom, Black Pepper, Peanut,
Mustard, Buckwheat, Acai, Ivy, Sargassum, Bladderwrack, Ice Algae, Angel's Trumpet, Beach
Morning Glory, Cucumber, Tea Tree), plus Bear, Koala, Fennec Fox, Cuttlefish, Horseshoe Crab,
Lamprey, Sea Squirt, Paddlefish, Wasp; Earthstar, Enoki, Cyanobacteria.

## PROCEDURAL (post-wave-17)
Fungi: expand from 6 families → shelf · coral · puffball · earthstar · **tooth** · **jelly** ·
truffle · mold · **lichen** · **parasitic club**. Microbes: expand from 4 → **rods** ·
**spirals** · **filaments** · **chains** · shells · **flagellates** · ciliate · **plates** ·
**mats/biofilms** · micro-animals.

## EXECUTION SEQUENCE (matches the audit's recommendation)
- **Wave 18** — Bucket A (canonical, closes task #14) + Bucket B (fungi bespoke).
- **Wave 19** — Bucket C (flora iconic).
- **Wave 20** — Bucket D (fauna + microbe blockers).
- **Wave 21** — the NEEDS_FIX polish sweep.
- **Wave 22** — procedural family expansion.
- Then re-export all zips and hand back for a re-run of this exact audit.

Every wave: strip-verify each fixed species · `npm run artbattery` (5/5) · never touch what
already excels (D-ART-14) · record in MORPHOLOGY_PASS / DEVIATIONS / ROADMAP · commit + push.


---
## STATUS 2026-08-02 — BUCKETS A/B/C/D COMPLETE
All 28 RELEASE_BLOCKERS cleared across waves 18 (A: canonical 4 organisms x kingdoms; B: 6
bespoke fungi) and 19 (C: 8 iconic flora; D: 5 fauna signatures + Foraminiferan).
Remaining on the path to Platinum:
  · wave 20 — the 165 NEEDS_FIX rows (fauna 25, flora 17, fungi 2, microbe 1, procedural 120)
  · wave 21 — procedural FUNGI families (shelf/coral/puffball/earthstar/tooth/jelly/truffle/
    mold/lichen/parasitic club) and procedural MICROBE families (rods/spirals/filaments/chains/
    shells/flagellates/ciliates/plates/mats/biofilms/micro-animals) — both still mono-template
  · then re-export all five zips and re-run this exact audit
