# Body-plan coverage study (2026-09-24)

**Question.** The vision says each new painted archetype is worth its whole body plan. If every Earth species were drawn as its
body plan's ONE painted archetype, recoloured and re-proportioned by the morph system, which species would a player accept?
**This is decision material for Nick. Nothing is wired.**

## Method
- `dataset.mjs` → `dataset.json`: all 631 Earth fauna (`reference/fauna.json`, with each species' `mustRead` recognition features)
  mapped through the presentation profiles to a body-plan template and its stand-in archetype. 17 are painted themselves; **53 have no
  template with a painted archetype** (snails, worms, shrimp, clams, lobsters…); **561** were judged.
- `coverage-judges.workflow.js`: per chunk of about 24 species, two independent judges, an ANATOMIST (part inventory, silhouette) and a
  PLAYER (would you recognise it at phone size?). Each looked at the stand-in painting and was told exactly what the morph can and cannot
  change: palette; markings only where painted masks exist; head 0.85–1.2 and tail 0.7–1.35; no parts added or removed. A third judge
  settled disagreements, and a synthesis stage clustered the misleading species into proposed new paintings.
  Raw verdicts are in `verdicts.json` and the plan is in `painting-plan.json`.
- These are model judgements, not measurements. Use them to rank work; Nick's eye decides the art.

## Result: 14 good, 93 caveat, 454 misleading (of 561)

| stand-in | species | good | caveat | misleading |
|---|---|---|---|---|
| Civet | 204 | 1 | 18 | 185 |
| Salmon | 131 | 4 | 37 | 90 |
| Eagle | 101 | 1 | 8 | 92 |
| Beetle | 40 | 0 | 8 | 32 |
| Python | 21 | 4 | 10 | 7 |
| Tree Frog | 17 | 1 | 5 | 11 |
| Chimpanzee | 16 | 0 | 3 | 13 |
| Starfish | 11 | 0 | 1 | 10 |
| Tarantula | 8 | 1 | 0 | 7 |
| Octopus | 7 | 1 | 0 | 6 |
| Fruit Bat | 3 | 0 | 3 | 0 |
| Centipede | 2 | 1 | 0 | 1 |

**The multiplier alone does not cover the vision.** With one painting per body plan, the Civet stands in for 204
mammals and reptiles, the Eagle for 101 birds and the Salmon for 131 fish and whales.
The morph system does its own job (the individuals of one silhouette); the library needs more paintings, but far fewer than one per species.

## The painting plan, ranked by species fixed (top 20 of 138; the full list is in `painting-plan.json`)

| # | paint | template | covers | misleading fixed | cumulative fixed |
|---|---|---|---|---|---|
| 1 | Wall Lizard | quadruped | 17 | 17 | 17 |
| 2 | Cougar | quadruped | 17 | 10 | 27 |
| 3 | Impala | quadruped | 14 | 14 | 41 |
| 4 | Marmot | quadruped | 14 | 14 | 55 |
| 5 | Bass | fish | 14 | 7 | 62 |
| 6 | Cattle | quadruped | 12 | 12 | 74 |
| 7 | Capuchin | NEW: primate template + a tail1-3 chain | 12 | 12 | 86 |
| 8 | Tang | fish | 12 | 12 | 98 |
| 9 | Wolf | quadruped | 12 | 11 | 109 |
| 10 | Gull | biped-bird | 11 | 11 | 120 |
| 11 | River Otter | quadruped | 10 | 7 | 127 |
| 12 | Brown Bear | quadruped | 9 | 9 | 136 |
| 13 | Goose | biped-bird | 9 | 9 | 145 |
| 14 | Racer | serpent | 9 | 2 | 147 |
| 15 | Heron | biped-bird | 8 | 8 | 155 |
| 16 | Sparrow | biped-bird | 8 | 8 | 163 |
| 17 | Grouse | biped-bird | 8 | 8 | 171 |
| 18 | Sandpiper | biped-bird | 8 | 8 | 179 |
| 19 | Ibex | quadruped | 8 | 8 | 187 |
| 20 | Reef Shark | fish | 8 | 8 | 195 |

"covers" counts every species the painting would stand in for; "misleading fixed" counts only those judged misleading today.
Breadth beats fidelity: the top 10 fix 120 species, the top 20 fix 195 and the top 35 fix 267. The last 53 each fix one.
Each entry in `painting-plan.json` carries a `mustPaint` list (the features the painting must show) for the painter's brief.

## Four rules the study surfaced
1. **Paint every new archetype on a PLAIN base coat, with its own six-mask set.** The morph keeps luminance, so a painting's own marks
   (the Civet's spots and ringed tail) appear on everything it stands in for. No mask can turn a spotted civet into a striped tiger.
2. **Cheap wins with no new painting.** Mask sets on existing paintings:
   - **Python** → Garter Snake, King Snake, Boa
   - **Beetle** → Carrion Beetle

   Moving Fiddler Crab's profile to brachyuran also lets the painted Crab stand in.
3. **The 53 with no stand-in.** Their profiles need pointing at specialized templates that exist but are unused (crustacean-small,
   annelid, gastropod, bivalve, sessile-filter…). Then these paintings cover most of them:
   - **Shrimp** (9): Shrimp, Prawn, Freshwater Shrimp, Cave Shrimp, Vent Shrimp, Krill, Brine Shrimp, Fairy Shrimp, Amphipod
   - **Earthworm** (8): Earthworm, Ice Worm, Leech, Marine Worm, Polychaete Worm, Scale Worm, Fly Larvae, Caecilian
   - **Snail** (7): Snail, Land Snail, Freshwater Snail, Water Snail, Sea Snail, Conch, Cowrie
   - **Clam** (6): Clam, Mussel, Oyster, Razor Clam, Giant Clam, Scallop
   - **Copepod** (3): Copepod, Water Flea, Tadpole Shrimp
   - **Banana Slug** (3): Banana Slug, Nudibranch, Flatworm
   - **Limpet** (3): Limpet, Abalone, Chiton
   - **Sea Anemone** (3): Sea Anemone, Tube Worm, Giant Tube Worm
   - **Lobster** (2): Lobster, Crayfish
   - **Giant Isopod** (2): Giant Isopod, Isopod
   - **Sponge** (2): Sponge, Sea Squirt
   - **Pyrosome** (2): Pyrosome, Salp
   - **Hermit Crab** (1): Hermit Crab
   - **Fiddler Crab** (1): Fiddler Crab
   - **Barnacle** (1): Barnacle
   - **Horseshoe Crab** (1): Horseshoe Crab
   - **Tardigrade** (1): Tardigrade
4. **Five archetypes need a rig change before painting:** primate + tail (Capuchin, Aye-Aye), hopper + tail (Kangaroo), decapod
   cephalopod (Squid), arachnid + tail (Scorpion) and shelled cephalopod (Nautilus).

In the game an Earth name is ASSIGNED to a procedurally generated genome, so a species' colours and pattern gene are procedural. A mask
shows only when that individual's pattern gene selects it, so check the genes before painting a mask for one species.

## Owners
- **Nick:** which paintings, in what order. The plan is ranked by coverage; the art is his call.
- **Codex (painting and the anatomy chain):** paint and fit the chosen archetypes, make the five rig changes and wire the unused-template profiles.
- **Claude:** each new archetype joins the card and the arena the day it lands (one generated list). A species → stand-in registry waits for
  Nick's word, because it would put a morphed painting on species this study marks caveat or misleading.
