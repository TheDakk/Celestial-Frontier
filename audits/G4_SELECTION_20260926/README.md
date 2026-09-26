# G4: selection — which painting draws a creature (2026-09-26)

This is Stage G4 of the Generated Creature Pipeline (`audits/GENERATION_PIPELINE_20260926/PROGRAM.md`; Nick D22/D23). Owner: Claude.

## What it does

`port/v2/apps/game/src/morph/painted-variants.ts` → `paintedArtV2(genome, painted)`. It is ONE pure, deterministic resolver. The Compendium card (`PaintedCardSource.standInFor`, and its G3 core fallback) and the battle stage (`matchRecord`, `coreStandInRecord`) all call it, so CARD = STAGE holds by construction.

Resolution order:

1. **`painted`:** the creature's exact Earth species painting.
2. **`earth-variant`:** an Earth species without its own painting takes a painted member of its SAME Earth fauna profile group, the first painted name in the group's list. Examples: Lion → Cougar (felid), Red Fox → Wolf (canid), Komodo Dragon → Wall Lizard (lizard), Great White Shark → Reef Shark (predatory-shark), Anaconda → Python.
   - **Why the profile and not the genes:** Earth genomes are seeded, not species-true. `_earthNamePass` assigns the name by seed modulo, so a "Lion" can carry feathered-skin genes. Earth selection therefore reads the species' profile and never its genes.
3. **`procedural-variant`:** a procedural creature takes the nearest painting by the visual genes the morph cannot redraw: skin (same = 0, same group = 1, else 2), size (half a step per class) and tail type (0.5). The choice is made only among the paintings that draw the SAME anatomy the procedural painter draws (`VARIANT_SETS`, keyed by `proceduralFamilyV1`):
   - `land:4` → Civet, Wolf, Cougar, Impala, Ibex, Marmot, Rat, River Otter, Wall Lizard, Salamander;
   - `fish:fusiform` → Salmon, Bass, Pike, Tang;
   - `fish:sturgeon` → Sturgeon **(new: v1 drew these procedurally)**;
   - `fish:shark` → Reef Shark **(new)**;
   - snakes → Python, Racer;
   - crabs → all five crabs.

   Palette, accent, pattern and head/tail proportion still morph on top, as before.
4. **Otherwise the v1 stand-in** (`paintedStandInV1`: the body plan's one painting), else null (the procedural art).

**Offline / core only:** the resolver only returns names in the `painted` set it is given. Over the CORE set it therefore draws only core paintings. It paints everything v1 paints, and differs from v1 only by a same-group Earth relative. Today that is the cnidarians (Man-of-War, anemone, corals), which take the core Jellyfish instead of the core Starfish.

## Traits table (authored, reviewable)

`PAINTED_TRAITS` records what each painting visibly shows, in the genome's own vocabularies (FA_SKIN, FA_SIZE, FA_TAIL; a test pins them). One row exists per painting that shares an anatomy set with another. Please correct any row by looking at the painting. The table only reorders variants within one anatomy, so an error there can never change a creature's anatomy.

## Tests: `painted-variants.test.ts` (7), each with a control

- The trait vocabularies equal speciestraits'.
- Every variant set draws ONE anatomy: its members' own `record.json` templates agree, every member is painted and can fight, and multi-member sets carry traits.
- The visible-anatomy law holds over 3,000 procedural genomes. Control: a resolver that lets Beetle into `land:4` produces more than 50 violations.
- Spread and coverage: strictly more procedural creatures are painted than under v1, and named variants (Wolf, Cougar, Wall Lizard, Bass, Pike, Racer, Sturgeon, Reef Shark, Coconut Crab) each draw some creatures. The nearest-by-genes examples are exact.
- Earth routes, including every Earth name: an earth-variant stays inside its own profile group and its body plan. More than 80 names take a relative today.
- The offline properties above. Control: online, the Lion differs from v1.
- CARD = STAGE: the card source and `matchRecord` agree on every Earth name plus 1,500 procedural genomes. Negative control, run this session: pointing the stage back at `paintedStandInV1` fails the test.
- Existing suites stay green: the morph folder, battle2-wiring, battle2-matchup and art-library (128 tests).

## Not done here

- **The G2 library at scale** (Codex): every new painted Earth species becomes route 1 for itself and route 2 for its group, with no code change. Exception: a new painting whose anatomy should join a `VARIANT_SETS` row is added there, and the one-template test guards it.
- **A variant within an Earth group is the group's first painted name,** not a gene-nearest one (Earth genes are not species-true). A finer choice needs species-level visual data, which G2's per-species prompts could supply later.
- **A real-browser smoke of the card path over the library:** see `audits/G3_ART_DELIVERY_20260926/card-smoke/`.
