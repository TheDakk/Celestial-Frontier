# Painted stand-ins: the painted art direction on every card (2026-09-24)

**Nick:** "I want the same art direction on the Compendium cards as we do for the generation — that art style should carry
throughout the game."

**Built** (`apps/game/src/morph/painted-stand-in.ts`, used by `PaintedCardSource`). A creature's card is drawn from a PAINTED
archetype whenever a painting draws its anatomy, morphed by the creature's own genes (colour, accent, pattern, head/tail proportion):
1. **painted:** the 17 painted species themselves.
2. **earth-stand-in:** an Earth species whose presentation profile routes to a body plan that has a painting. Its body plan's
   archetype stands in (Brown Bear, Tiger and Wolf → Civet; Garter Snake → Python; Ladybug → Beetle; Blue Whale → Salmon; Owl → Eagle;
   Orangutan → Chimpanzee). About 560 Earth species.
3. **procedural-stand-in:** a generated creature. It gets the painting of the SAME body family the procedural painter already draws for
   it (hdart `_procFamily` plus the limb gene), so its visible anatomy never changes. The drift test runs hdart's own source against
   the mapping on 4,000 genomes. The land leg-count law is tested: 4 legs → Civet or Tree Frog (leapers), 6 → Beetle, 8 → Tarantula.

**Measured coverage of generated creatures (10,000 genomes): 43% now draw from a painting.** The rest keep the procedural art until
their body is painted. That remainder is the painting list for the game's own creatures, by share of genomes:

| family | share | what to paint |
|---|---|---|
| jelly (gelatinous drifter) | 6.5% | a jellyfish |
| four-winged flier | 6.2% | a dragonfly-type |
| sturgeon-type fish | 5.7% | a sturgeon |
| flat benthic fish | 4.6% | a flatfish / ray |
| land body, 0 / 2 / 3 legs | 13.3% | legless, biped and tripod land bodies (alien, no Earth reference) |
| lobster | 3.3% | a lobster |
| mantis | 2.2% | a mantis |
| squid / cuttlefish | 4.0% | a squid and a cuttlefish |
| shark / angler | 3.9% | a shark and an anglerfish |
| sessile (anemone / urchin / coral / cucumber) | 6.1% | four sessile forms |

`stand-in-sheet-01.png` (+ `.txt` legend): four generated creatures per painted family through the real card path, then Earth
stand-ins. Regenerate with `CF_STANDIN_SHEET=1 npx vitest run apps/game/src/morph/stand-in-sheet.test.ts` (from `port/v2`).

**Found and fixed on the way:** a creature whose genes grow its tail lost the tail tip at the card edge. The composite was drawn on
the painting's own canvas, so a grown sub-tree ran off it before the crop. `padForProportionV1` gives it a transparent border only
when a sub-tree is scaled; identity renders stay byte-exact. The test covers every archetype, with a control showing the unpadded
composite does clip.

**Known limits:** a species' fine features come from the stand-in painting (a tiger is a spotted civet) until its own archetype is
painted (the coverage study's ranked plan). Plants, fungi and microbes have no painted library yet. `standIns: false` on
`PaintedCardSource` restores painted-species-only cards.

## On the battle stage too

`battle2-wiring.ts` `matchRecord` falls back to the same stand-in. A fighter with no painting of its own fights as its stand-in's
painted rig, morphed by its own genes. Its habitat and voice come from the stand-in's anatomy. The picker takes `alien:<seed>` for a
generated creature (`?battle2=1&vs=alien:12,alien:11&duel=1`). Edge, with the worker controlling the page and real duels
(`picker-alien-alien-12-alien-11/`, `picker-alien-alien-5-Octopus/`):
- Alien #12 (four legs) fights as a Civet and Alien #11 (eight legs) as a Tarantula; both are painted rigs.
- Alien #5 (fish) fights as a Salmon against the Octopus, and the picker chose the lake itself.
- Every log is paced by the hits, with zero page errors.
