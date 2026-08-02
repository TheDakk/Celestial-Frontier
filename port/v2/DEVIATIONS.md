# DEVIATIONS.md — the port's improvement ledger

**The rule (plan §20 Gate A): the port is BUG-FOR-BUG parity until a deviation is
approved here.** Every entry below is a place the original does something imperfect
that the port can do better — found while porting, each verified against the source
or caught by a parity instrument. Status: ☐ proposed (parity preserved today) ·
✔ approved by Nick · ★ already structurally better in the port without breaking parity.

Companion to `port/DECISIONS.md` (Nick's §23 design calls). Update IN THE SAME BATCH
as any change that touches an entry.

## Species art — THE MORPHOLOGY PASS (approved by Nick 2026-08-01)

The species-art surface is the one place the verbatim-parity boundary is OPEN, under Nick's
approval after the full-catalog review (`port/ART_REVIEW_SPECIES_2026-08-01.md` +
`audits/species-audit-2026-08-01/`). Corrections live in `packages/art/src/speciesoverrides.ts`
ATOP the verbatim engine (unmatched species stay parity-exact). Plan + waves:
`port/MORPHOLOGY_PASS.md`. Gate: `npm run speciesaudit` (1,254/1,254 every batch).

- ✔ **D-ART-6 — fungi structural families (wave 1).** The 27 Earth fungi were one mushroom
  recolored (release blocker). Now: bracket/shelf · puffball · coral · morel · mold · earthstar
  families, routed by name; true gilled mushrooms fall through verbatim.
- ✔ **D-ART-7 — microbe morphologies (wave 1).** The 22 microbes were one bubble cluster.
  Now: tardigrade (with a contrast guarantee) · diatom · radiolarian · ciliate · amoeba.
- ✔ **D-ART-8 — flora name-seeded anti-duplicate (wave 2).** ROOT CAUSE: the generic leaf
  ladder is deterministic per form and never sees the species name, so 16 groups (38 files)
  rendered byte-identical. Now every named species varies from a hash of its own name.
  16 → 0 duplicate groups; a permanent sentinel in speciesaudit fails on any regression.
- ✔ **D-ART-9 — iconic flora bodies (wave 2).** Rafflesia · Pineapple · Joshua Tree · Cotton ·
  Dragon Fruit · Rhubarb · Tobacco · Cabbage now have real growth forms.
- ✔ **D-ART-10 — insect life stages + arthropod body plans (wave 3).** Fly Larvae/Maggot/
  Caterpillar were WINGED ADULTS; Dragonfly/Damselfly had no wings at all; Springtail was a
  winged insect; Fiddler Crab had symmetric claws. All corrected by body plan.
- ✔ **D-ART-11 — specialist fish/marine bodies (wave 3).** Flatfish (both eyes upper side),
  Angelfish, Lionfish, cephalopods (8 arms + fin skirt + squid tentacles), cetaceans (a
  HORIZONTAL fluke and per-species dorsals — Blue Whale no longer equals Dolphin).
- ✔ **D-ART-12 — the bird wing (wave 3).** NO bird among 631 fauna showed a wing silhouette.
  faunaBird now draws layered coverts + primaries, with bill shape and leg length as species
  parameters (raptor/wader/spoonbill/huge-bill/flightless).
- ✔ **D-ART-13 — the quadruped system (wave 4).** One parameterized mammal painter (leg/depth/
  neck/back-profile/muzzle/jaw/ears/tail/coat/signature-organ) over 40 species. Rhino ≠ Hippo at
  last; Camel has humps and a neck; Giraffe patches its neck; the bears differentiate.
- ✔ **D-ART-14 — THE OVERRIDE LAW: never override what already excels.** The generic quadruped
  made the verbatim Elephant (4.5/5) WORSE — Elephant variants, Zebra, Tiger, Lion, Red Panda and
  Raccoon were removed from the table and keep the bespoke painter. Governs every future wave.
  Also: the back line was smoothed (was faceted) and the spine rim feathered (was a hard edge).
- ✔ **D-ART-15 — THE FIT PASS (wave 5, Nick's law).** Every override subject is painted to a
  transparent layer, measured, and scaled+centred into the frame at a 0.90 margin (shrink
  only). The verbatim engine's _fitPlant convention generalised to every painter — a clipped
  subject (Hippo's muzzle, Giraffe's head) can no longer happen in any kingdom.
- ✔ **D-ART-16 — THE PATTERN LAW (wave 5, Nick's law).** A coat mark must BLEND into the skin
  at its edges, never a hard polygon stamped on top. softMark() = radial gradient falling to
  zero alpha; organic patches are clusters of overlapping soft lobes. Giraffe patches (the
  "octagons") rebuilt at 84 marks over the full torso and neck; spots, rosettes and stripes
  all rewritten the same way. Applies to every patterned creature, this wave and after.
- ✔ **D-ART-17 — the PRE-CLIP fix + the CLIP SENTINEL (wave 6).** Wave 5's fit pass measured
  ink on a 440 layer, but a painter reaching past 440 was cut by the canvas edge BEFORE the
  measurement — it centred an already-severed muzzle. The ink layer is now 2S with the origin
  offset by S/2, and fitInk records any subject still touching the layer edge; speciesaudit
  exits 1 naming them. Current: 0 clipped across 1,254.
- ✔ **D-ART-18 — the barrel snout (wave 6).** jaw:'barrel' (Hippo) draws a blunt rounded block
  with a domed end and nostril pads, not a tapered ellipse.
- ✔ **D-ART-19 — THE DEAD-ROUTE SENTINEL (wave 7).** 24 painters across waves 3, 4 and 7 were
  keyed to species the catalog does not contain (King Cobra, Sea Snake, Bonobo, Tarsier,
  Chinchilla, Loris, Periwinkle, Coral Snake, Boa Constrictor, Cane Toad, Giant Tortoise,
  Electric Ray, Ring-Tailed Lemur, Caterpillar, Grub, Maggot, Lacewing, Sole, Stag Beetle,
  Bighorn Sheep, Dromedary, White Rhino, Bracken, Water Bear) — written, listed, unreachable,
  and structurally invisible to a species audit that can only render names the catalog asks
  for. `tools/overridecheck.mjs` now exits 1 on any unresolvable key (with the nearest real
  name) and on any duplicate key. Its own first cut reported 38 phantom dead routes (painter
  OPTIONS are strings too — the scan is brace-depth aware now) and skipped both non-exported
  tables. Negative-controlled both directions. All 24 re-keyed to real species; 310/310 resolve.
- ✔ **D-ART-20 — NAME-SEEDED FAUNA (wave 7).** Wave 6's duplicate sentinel caught Howler =
  Spider Monkey and Macaque = Baboon on the first wave-7 audit: the new painters keyed on
  OPTIONS only, and 'lesser' was an alias for 'monkey'. Same shape as the flora ladder bug
  (D-ART-8). Every wave-7 painter is now seeded by the species NAME, which drives real
  proportion (coil tightness, girth, dome, ear, arm reach, whorl), not just noise.
- ✔ **D-ART-21 — THE CONTINUOUS BODY (wave 7).** A snake stamped as 46 discs along a spiral
  read as a caterpillar; the gaps were the defect. Bodies that flow are drawn as dense
  round-capped ribbons shaded across their girth, with the dorsal light broken into scale rows
  so the surface is not a garden hose.
- ✔ **D-ART-22 — LIMBS IN FRONT (wave 7).** Primate legs drawn behind the torso vanished under
  it and every ape read as a robe with a face; frog hind legs drawn as one thin curve read as
  a spider. A limb that defines a silhouette is drawn in FRONT and carries its real masses.
- ✔ **D-ART-23 — THE EYEBALL INSTRUMENT (wave 7).** `tools/speciesstrip.mjs` renders any named
  species list big and labelled through the audit's own genome. The audit proves 1,254 paint;
  the strip is how a human judges a handful, and it is what exposed D-ART-19/21/22.
- ✔ **D-ART-24 — THE FISH SYSTEM (wave 8).** 106 of the catalog's 631 fauna were fish and nothing
  reached them: the largest uncovered group in the game, larger than the birds. One traced body
  (`fishBody`) whose profile/len/depth/tail/snout/dorsal/pattern are the species — 105 routes,
  no per-species painters — plus shark anatomy (heterocercal tail, five gill slits, swept
  pectorals), the anglerfish lure, photophore rows, countershading, lateral line and operculum.
- ✔ **D-ART-25 — A FIN IS SIZED BY WHAT IT GROWS FROM (wave 8).** Three sizing bugs with one
  root: fins scaled from the body's MAXIMUM depth. An eel got a tuna's tail (the Gar wore a
  green dinner plate), a deep-bodied tang's tail was taller than the tang, and `round`/`fan`
  was a free-standing ellipse touching the fish nowhere. Fins are now measured at the peduncle,
  clamped to the body's own height, and traced from the body's edge.
- ✔ **D-ART-26 — THE SENTINEL'S HARDCODED FILE LIST (wave 8).** `overridecheck` read a fixed
  list of override files, so wave 8's new `faunaoverrides3.ts` was invisible and it reported
  "no change" while 105 new routes went unchecked — the tool's own blindness, of exactly the
  class it exists to catch. It reads the directory now, and `tools/overridecheck.control.mjs`
  (`npm run overridecontrol`) is a committed control set whose control C is precisely this bug.
- ✔ **D-ART-27 — THE BIRD SPEC EXTENDED (wave 9).** 73 new routes by adding optional axes to
  wave 3's faunaBird rather than replacing it: size (a hummingbird is not an ostrich — body
  scale said so nowhere), neck incl. the swan S-curve, tail incl. peacock ocelli, the OWL
  facial disc with forward-facing eyes, the swimmer's WATERLINE, the penguin's upright flipper,
  and four new bills. All defaulted, so the 28 wave-3 birds are byte-unchanged; wave-3 birds
  are also name-seeded now (Hawk and Falcon shared a spec).
- ✔ **D-ART-28 — SHADOWED ROUTES, THE THIRD KIND OF DEAD ROUTE (wave 9).** Wave 9's
  swan-necked Swan would never have run: wave 3 already keyed 'Swan' in a table resolveOverride
  consults first. Both keys resolve to a real species, so the dead-route check was blind by
  construction and the audit stayed at 1,254/1,254. overridecheck reports shadowed routes now
  (kingdom-aware — see D-ART-29), and the wave-3 Swan was retired.
- ✔ **D-ART-29 — THE SENTINEL'S FOURTH SELF-INFLICTED BUG (wave 9).** The new shadow check's
  first run flagged 'Green Algae [FLORA_DUPES shadows MICROBE_NAME]' — not a shadow: that name
  is in BOTH catalogs and resolveOverride branches on kingdom first. The check is kingdom-aware
  now, which also made 'dead' catch mis-kingdomed keys and made coverage count per kingdom.
  Four self-inflicted bugs from one tool before it found anything real. Controls: six, all
  firing, incl. E — a table the tool cannot classify is REPORTED, never skipped silently.
- ✔ **D-ART-30 — THE MAMMAL REMAINDER + THE BOVID HORN (wave 10a).** 82 new routes as pure
  table work against wave 4's quadruped system. One painter change: the bovid horn —
  straight (oryx rapiers, annulated), spiral (kudu corkscrew), lyre (impala/gazelle), prong
  (pronghorn), shorthorn — because drawn as one generic spike every antelope is the same goat.
  The wave-9 shadow sentinel caught five of my own mistakes first: Red Fox, Arctic Fox, Horse
  and Tapir were already in QUAD_SPEC (written, listed, never drawn), plus one invented name.
- ✔ **D-ART-31 — A LEG HAS A JOINT (wave 10a, sweeping pass).** Four straight strokes of even
  thickness read as a table, and at 130 species that is one table repainted 130 times. Limbs
  now carry a thick upper segment, a THIN cannon bone, and a foot — with front and hind bending
  in OPPOSITE directions (hock back, knee forward). Applied in the shared painter, so every
  quadruped improved at once.
- ✔ **D-ART-32 — A TORSO IS NOT A SLAB (wave 10a, sweeping pass).** The body underline ran
  nearly straight from brisket to groin. It now has a deep chest at the shoulder, a tucked
  waist behind the ribs and a rounded rump — the silhouette that makes a wolf read as a wolf
  before any marking is drawn. Also: humps are seated on the back line at their own x rather
  than floating above it (a Bactrian's rear hump hovered over a spine it never touched).
  Verified no regression against Giraffe, Hippo, Rhino, Camel, Moose, Wolf, Leopard, Cheetah.
- ✔ **D-ART-33 — THE INVERTEBRATE BODY PLANS (wave 10b).** 83 routes from five painters keyed
  on tagmata and leg count: insect (6 legs, petiole, pile, raptorial strike, jumping femur,
  four wings), arachnid (8 legs, no antennae, scorpion telson), myriapod, crab (claws FORWARD),
  shrimp (the abdomen curls into a comma), plus worms, slugs with cerata, jellies with trailing
  tentacles, coral, sponge.
- ✔ **D-ART-34 — SCALE IS INVISIBLE; VARY A RATIO (wave 10b).** Name-seeded variation of
  OVERALL SIZE does nothing: the fit pass rescales every subject to fill the frame, erasing it.
  Anti-duplicate variation must change an aspect, an angle or a count. Every invertebrate
  painter now varies a ratio.
- ✔ **D-ART-35 — THE DEGENERATE SALT (wave 10b, retroactive to waves 7-10a).** The variation
  helper XOR-ed a small salt into the name hash then divided by 2^32, so the salt only moved
  the lowest byte (~1e-7 of the result). Six "independent" axes were one axis six times, in
  every wave since 7; near-neighbour hashes also produced near-identical animals. Replaced with
  a murmur3-finalizer avalanche in all five copies.
- ✔ **D-ART-36 — ★ THE AUDIT READ A STALE BUNDLE ALL SESSION (wave 10b).** speciesaudit built
  only if audit.html was missing, so once dist/ existed it never rebuilt: every run measured
  the bundle, not the repo. It reported a duplicate the source had already fixed, and would
  have reported PASS for code that no longer existed. Both audit and export now ALWAYS build,
  with a freshness guard that exits 2 if dist is older than any art source. A check that reads
  a build artefact must prove the artefact is current.
- ✔ **D-ART-37 — THE PLANT SYSTEM (wave 11).** 280 routes from one plant whose habit, leaf,
  flower and fruit are the species: tree (three-pass crown), shrub (many stems from the
  ground), herb, grass (filled tapering blades), cane, vine (tendrils), succulent, fern
  (filled pinnae + fiddlehead), aquatic (straps + gas bladders), rosette, palm. Ten leaf
  shapes, eleven fruit types, six flower architectures — the answer to "every flower is the
  same daisy".
- ✔ **D-ART-38 — THE COVERAGE TOOL WAS STEERING THE PLAN WITH STALE DATA (wave 11).** The
  scratch gap script carried the same hardcoded file list overridecheck shipped with, so after
  four new override files it reported ~250 covered species as uncovered. Promoted to
  tools/coveragegap.mjs, reading the directory. Corrected, it showed the largest uncovered
  block was the PLANTS (288 of 334), not the animals.
- ✔ **D-ART-39 — ★ THE UNWIRED TABLE (wave 11).** FLORA2_SPEC was imported into
  speciesoverrides.ts and never consulted by resolveOverride: every key resolved, overridecheck
  reported 927/927 and 0 dead, and all 280 routes were unreachable. Only the duplicate sentinel
  noticed, via a 15-pair regression. overridecheck now reports unwired tables; control F proves
  it fires. Also widened file discovery from a NAME PATTERN to every art source — the third
  time the discovery rule itself was the bug.
- ✔ **D-ART-40 — THE RETROSPECTIVE INSTRUMENT (tools/artaudit.mjs).** Every defect class this
  pass has shipped, encoded as an executable check and run across all eleven waves: dead
  painters · discarded rngs · unused name params · degenerate salts · size-only variation ·
  pattern-globbed file discovery · stale-bundle readers. It found seven painters discarding
  their rng and a second tool (sliceperf) reading a stale bundle. `npm run artbattery` runs it
  with the four routing/coverage instruments as one five-stage command.
- ✔ **D-ART-41 — THE OVERRIDE LAW APPLIES TO OUR OWN IMPROVEMENTS.** Spending the seven
  discarded rngs on surface texture fixed six painters and immediately DEGRADED the seventh:
  the dragonfly's venated wings — the species Nick and both reviews singled out — became grey
  smudges. Reverted. A later idea of ours is still an override; "never override what already
  excels" governs us, not just the verbatim engine. The deliberate discard is tagged
  `@rng-unused: <reason>`, which artaudit accepts and which keeps the decision visible.
- ✔ **D-ART-42 — THE AUDIT'S OWN HOLE, FOUND BY USING IT.** Check G exempted any filename
  pattern merely CONTAINING an extension test, so /overrides\d*\.ts$/ passed — and coveragegap
  had kept that glob one wave too long, under-reporting coverage by 302 species while the check
  reported clean. Tightened to a bare-extension exemption and negative-controlled. Corrected
  coverage: 930/1014. Also: sliceperf now always rebuilds (D-ART-36's second offender).
- ✔ **D-ART-43 — MARKS WRAP THE FORM (wave 12).** formMark() foreshortens a mark across the
  radius and turns its long axis along the surface, using how much the point FACES the viewer.
  A spot near the rim is seen edge-on; drawn as the same circle everywhere it announces that
  the body is flat. Applied to spots, rosettes, stripes and patches across ~130 quadrupeds.
- ✔ **D-ART-44 — MARKS OBEY THE LIGHT (wave 12).** The engine lights from the upper left, but
  markings kept one opacity across a lit shoulder and a shadowed belly, which is what a decal
  does. Dark marks now fade in light, light marks fade in shadow.
- ✔ **D-ART-45 — FUR BREAKS THE SILHOUETTE; SPINES ARE ROOTED (wave 12).** Fur strokes inside a
  smooth outline are wallpaper in a cutout, and the silhouette is the first thing the eye
  reads. furRim() pushes tufts THROUGH the outline, each starting inside the body. rootedSpine()
  gives every quill a dark socket where it leaves the skin, a two-segment taper, and depth
  sorting. Every change was rendered against a known-good species first (D-ART-41).
- ✔ **D-ART-46 — THE PROCEDURAL PATH (wave 13).** A genome with no _earthName used to fall
  straight through to the verbatim engine, so twelve waves of work stopped at the edge of the
  Earth catalogue — 240 of the audit's portraits AND every creature a player breeds.
  resolveProcedural() now picks a body plan from the genome's own genes (body · loco · size ·
  head · tail · skin · pattern · form) and draws it with our quadruped / fish / insect / bird /
  snake / myriapod / turtle / plant systems, inheriting the fit pass, the pattern law and the
  surface laws. Pure and deterministic — no Math.random, no Date — because share codes and
  cross-device parity depend on it.
- ✔ **D-ART-47 — FIVE PLANS DELIBERATELY LEFT VERBATIM (wave 13).** Tentacled, membranous,
  crystalline-plated, gelatinous and radially symmetric have no Earth analogue, and the alien
  flora habits (crystalline growths, spore-towers, balloon-pods, mirror-bark giants) are the
  reason procedural life reads as alien at all. The verbatim engine draws them better than a
  forced mapping would. D-ART-14 applied to a whole rendering path, not one species.
- ✔ **D-ART-48 — ALIEN TRAITS ADD, THEY DO NOT REPLACE (wave 14).** Nick chose option (b) from
  wave 13: keep our rendering language AND the strangeness. packages/art/src/alientraits.ts
  adds limb pairs (2/3/4), stalked and clustered and blind eyes, tendrils, plated/chitinous/
  crystalline/translucent/warty skins, a membranous dorsal sail and segmented armour — each
  driven by a gene the genome already carried. The rule: an alien trait is an ADDITION to a
  body our systems draw well, never a replacement, so a six-legged creature still gets jointed
  limbs, a deep chest and a tucked waist. Every skin finish obeys the surface laws.
- ✔ **D-ART-49 — THE LUMIN FLAG WAS NEVER DRAWN (wave 14).** Every genome since v1.0 has
  carried a `lumin` boolean and no painter had ever rendered it. Bioluminescent spots now
  render OUTSIDE the body clip so the glow spills past the silhouette — the point of a glow.
  The Earth catalogue is untouched: `alien` is undefined for every named species, verified by
  strip against ten wave-4 quadrupeds and by 0 duplicate pairs across 1,254.
- ✔ **D-ART-50 — UNCLIPPED TEXTURE PASSES DRIFT OFF THE BODY (wave 15).** Nick's #1 review
  concern. Three retrospective texture passes (snake mottle, myriapod tint, shrimp speckle) were
  unclipped and could spill past the silhouette. Snake/myriapod marks pulled to the body core
  and sized to its girth; shrimp speckle clipped to the carapace. The other texture passes were
  clipped from the start and were clean.
- ✔ **D-ART-51 — THE TURTLE SHELL IS GROOVES, NOT A DRAWN NET (wave 15).** Nick by name. Scute
  boundaries were a hard stroke; now each is a groove — wide soft shadow, thin dark centre, lit
  lip, weakest at the lit crown — with each scute's centre raised so the shell reads as plates.
- ✔ **D-ART-52 — REVIEW FIXES: EEL FIN · TREE CANOPY · GRASS HEAD · FRONDS (wave 15).** The
  eel median fin doubled the body (a translucent ghost eel) → a hugging pale membrane. Tree
  canopies were a pale mop on light palettes (task 21) → a foliage green tinted 40% by the hue
  with real value structure. Grass/grain heads floated free → seated on a stalk joined to the
  crown. Ferns/palms were spiky/grey → the frond is now a feathered arching blade.
- ✔ **D-ART-53 — A HAUNCH IS A MASS, NOT A DARK OVAL (wave 16).** ~30 rodents carried one flat
  p.dark ellipse on the flank for a haunch and no hind foot: it read as a HOLE in the animal and
  the rodent floated. Now lit like the body, proud of the flank, with a soft thigh crease, a
  hind leg folding onto a long foot, and a forefoot tucked under the chest.
- ✔ **D-ART-54 — LIMBS THAT TAPER AND CURL (wave 16).** Cephalopod arms were constant-width
  bezier strokes, so an octopus read as a stool. Arms are now a walk of short segments with a
  shrinking width, a curled tip and a sucker row. Same class as D-ART-31 (a leg has a joint):
  a limb drawn at one width is furniture.
- ✔ **D-ART-55 — SECOND-PASS FIXES + A REVIEW-BLIND SPOT (wave 16).** Coral → a dense colony;
  sea cucumber → a soft sausage with blended papillae; comb jelly tentacles trail; anemone tips
  stay tinted; aquatic+pad → floating lily PADS on a waterline (they were drawing as kelp
  straps); herb/vine leaves enlarged to read; Aloe → a spiky lance rosette. AND: 'Lion's Mane'
  rendered as an empty box in the strip because the catalog stores a curly apostrophe and the
  lookup compared raw strings — a species we could not review was invisible to review. Both
  sides normalised.
- ✔ **D-ART-56 — PROCEDURAL FUNGI + MICROBES REACH THEIR FAMILIES (wave 17).** Nick's audit
  §12/§13 mono-templates were fixed for NAMED species in wave 1 but never for the procedural
  spread: ten procedural fungi rendered as the same three mushrooms and ten microbes as the same
  bubble cluster, differing only in colour. The families existed and were simply unreachable
  without a name; a procedural genome now selects one from its own `form` gene, and the lumin
  flag lights it. The win came from making an existing system reachable, not from new art.
- ✔ **D-ART-57 — THE MOULD HAD NO SUBSTRATE (wave 17).** fungiMold was pure haze at 0.10 alpha.
  Over a named species' vignette it read fine; on a procedural genome the fit pass scaled a cloud
  of dust to fill the frame and the colony vanished. It now grows on a ragged spreading crust —
  which improved the named Mold, Mildew and Yeast too, the tell that the vignette had been
  carrying a thin painter all along.
- ✔ **D-ART-58 — THE CANONICAL MAP + COUNT DELTA (wave 18).** The Platinum audit named 4
  organisms each in 2 kingdom lists (Tardigrade, Green Algae, Snow Algae, Reindeer Lichen):
  1,014 rows - 4 dupes = 1,010 unique, closing the task-14 count-delta investigation. A CANON
  map in resolveOverride, keyed by kingdom+name, renders each copy for its role.
- ✔ **D-ART-59 — SIX BESPOKE FUNGI (wave 18).** Fly Agaric (red cap + white warts), Lion's Mane
  (a white pom-pom of tooth-spines), Maitake (a frond rosette), Stinkhorn (upright stalk + dark
  gleba), Cordyceps (clubs on a host), Reindeer Lichen (a branching mat).
- ✔ **D-ART-60 — MACROALGAE ARE GREEN (wave 18).** Sea Lettuce and flora Green Algae render as
  green sheets: the palette is blended 62% toward a sea-green anchor because green is the
  organism's real-world identity.
- ✔ **D-ART-61 — THE IDENTITY ANCHOR (wave 19).** `anchor(p, r,g,b, k)` blends the genome tint
  toward a colour the organism is DEFINED by, generalising D-ART-60's macroalgae rule. Kiwi 72%
  brown (it rendered lime green and stopped being a kiwi); foram tests 55% calcite; foliage green
  0.82 (Hemp and Tobacco had pink and brown leaves). Use only where colour IS identity.
- ✔ **D-ART-62 — A MARK CANNOT BE THE SURFACE (wave 19).** The salp was drawn as hoops over an
  almost-empty fill, so the hoops were the whole animal and it read as a coiled spring. Fill the
  volume first, then lay bands on it as foreshortened arcs. Same class as the kiwi's plumage
  radiating out of its outline instead of draping on its body.
- ✔ **D-ART-63 — BUCKETS C + D: ALL 28 RELEASE BLOCKERS CLEARED (wave 19).** 8 iconic flora
  (floraoverrides3.ts) + 5 fauna signatures and the foraminiferan (faunaoverrides4.ts). With
  wave 18 that is fauna 6 / flora 12 / fungi 6 / microbe 4 = the audit's full blocker list.
- ✔ **D-ART-64 — TWELVE PROCEDURAL FAMILIES (wave 20).** proceduralfamilies.ts: fungi tooth,
  jelly, truffle, cup, club; microbe rods, spirals, filament, chain, flagellate, plates, mat.
  Both kingdom tables now run 13 deep, answering the audit's "all 60 outputs are one template".
- ✔ **D-ART-65 — UNSIGN EVERY STEP OF A MIXING HASH (wave 20).** `h ^= h >>> 16` is an int32
  XOR and returns NEGATIVE when the high bit is set; `-3 % 13` is -3, which indexes to
  `undefined`. 22 of 60 procedural fungi painted an EMPTY FRAME while every gate stayed green.
  Guarded by packages/art/test/familyspread.test.ts, which calls the renderer's own selector
  (not a copy), carries a control reproducing the bug, and was verified to fail when the real
  selector is broken. Same family as the degenerate-salt bug: a hash you did not check is a
  constant you did not notice.
- ✔ **D-ART-66 — A CELL IS MARKED BY WALLS, NEVER BY GAPS (wave 20).** microbeFilament drawn as
  separate beads was indistinguishable from microbeChain, a different family in the same table.
  A filament is one continuous tube with cross-walls laid on it. Related: substrate rectangles
  (microbeMat, fungiTooth) are the loudest "painted on" tell in the library — substrates are
  ragged organic fields and rounded boughs now, never boxes.
- ✔ **D-ART-67 — TEACH THE SYSTEM BEFORE YOU FORK IT (wave 21).** Every one of the audit's fish
  findings was "generic silhouette; add <one thing>", so FishSpec gained wings/dome/droop/gape/
  bighead/paddle/eyespot rather than nine bespoke painters — a Flying Fish and a Flying Gurnard
  stay recognisably siblings. Same for BirdSpec (wings:'soaring', headMass), QuadSpec (earScale,
  tailScale) and InsectSpec (wingScale). Fork only where no parameter reaches the signature.
- ✔ **D-ART-68 — SCALE IS THE SIGNATURE (wave 21).** The first cut of the gliding pectorals used
  len*1.35 at 0.20 alpha behind the body and they vanished — the audit's complaint restated, not
  fixed. A feature the animal IS gets drawn at the size it is (1.85x, lit, over the body).
- ✔ **D-ART-69 — A SIGNATURE MUST WEAR THE BODY'S LIGHT (wave 21).** The deep-sea skull shaded
  on its own radial ramp read as a grey box bolted to an orange fish; the paddle rostrum as a
  plank taped to a nose. Carry the body's countershading and taper INTO it. An aperture is a
  TUNNEL — dark at the throat, catching light at the rim — never a wedge (the basking shark's
  gape read as a broom until it was).
- ✔ **D-ART-70 — THE BRUSH TAIL (wave 21).** One constant-width round-capped stroke gave every
  fox, snow leopard and fennec in the catalogue an orange PIPE. A plume tapers from a narrow
  root, swells, and ends in loose hair — and those hairs leave SIDEWAYS off the local tangent,
  because sprayed at random angles they make a starburst (D-ART-61's kiwi failure, verbatim).
- ✔ **D-ART-71 — SIRENIANS HAD NO ROUTE (wave 21).** Dugong and Manatee fell through to the
  verbatim engine as spheres. A missing route is invisible to the dead-route sentinel, which
  only proves that keys we DID write reach real species — it cannot know what we never wrote.
- ✔ **D-ART-72 — THE PROPORTION INSTRUMENT (wave 22a, Nick's catch).** Every check we had
  answers a yes/no about ONE asset, so a shape wrong across a whole FAMILY was invisible:
  each animal looks fine until its aspect ratio is lined up against its relatives.
  tools/proportioncheck.mjs measures ink bbox aspect across a kingdom. First run: 37 of 631
  fauna outside the land-vertebrate envelope, and CLUSTERED — ten lizards inside 40px of one
  360x110 box, six winged insects at the same 197px width to the pixel. Now 8, all legitimate.
  It measures against the frame's CORNER COLOUR, because alpha cannot find a subject painted
  over a vignette, and it PRINTS its exclusion count so narrowing scope cannot read as "clean".
- ✔ **D-ART-73 — TWO BOOLEANS ARE NOT A BODY PLAN (wave 22a).** reptLizard had `long` or not
  and a fixed tail, so the squattest lizard alive rendered the same shape as a whip-tailed one;
  faunaWingedInsect had `open`/`slim`, so six species came out identical to the pixel. Both
  gained a continuous proportion parameter, defaulted so the painters that already excel are
  byte-unchanged (D-ART-14).
- ✔ **D-ART-74 — A PROP MUST NEVER OUT-MEASURE ITS SUBJECT (wave 22a).** The koala's trunk ran
  the full frame, so the fit pass measured the TREE and shrank the koala — aspect 0.44, the
  worst of 631. Substrate is context; it is never the thing being framed.
- ✔ **D-ART-75 — A BOUNDING BOX CANNOT SEE A PART (wave 22b, Nick's catch).** proportioncheck
  measured the ink bbox, and a head twice the size it should be does not move the bbox at all —
  so it reported "clean" on the exact animal Nick was looking at. The tool now walks a column
  height profile and compares END LOBES against the TRUNK. When an instrument passes, ask what
  it is structurally incapable of seeing.
- ✔ **D-ART-76 — A HEAD BELONGS TO LENGTH, NOT DEPTH (wave 22b).** Sizing a skull off body
  depth meant wave-22a's own `stout` parameter doubled the horned lizard's head, and long
  shallow mammals got a pea on a tube. headR = max(depth-term, bodyW * 0.20).
- ✔ **D-ART-77 — A MANE FRAMES A FACE, IT NEVER FILLS IT (wave 22b).** Lion had NO route and
  fell through to the verbatim engine. A mane is drawn BEHIND the head and OFFSET BACK from it;
  centred on the skull it covers the muzzle and eyes and the animal loses the only part anyone
  reads. Same law as D-ART-74: context must never out-measure its subject.
- ✔ **D-ART-78 — ONE SPIKY OPTION IS NOT A SPINE SYSTEM (wave 22b).** The lizard crest was nine
  identical triangles that ignored the back line, the animal's size, and where along the body
  they sat — and a HORNED LIZARD wore it only because `crest` was the sole spiky option. Spines
  are rooted in the surface they grow from, graded along it, and belong to the right body part.
- ☐ **D-ART-1 defining-feature guarantees · D-ART-2 pattern/color legibility · D-ART-3
  contrast floor · D-ART-4 flower-head + remaining fungi/microbe families · D-ART-5 procedural
  depth** — the remaining waves (P1 integrity/dupes/manifest → P2 fauna specialists + iconic
  flora → P3 fauna family polish → P4 procedural). Tracked in MORPHOLOGY_PASS.md.

## Correctness

- ☐ **D-9i — string `maxGen` poisoning.** `_sanitizeSavedGenome` clamps
  brood/fed/xp/hurt but not `gen`; `onSpeciesStored` assigns `entry.gen` raw after a
  coercing comparison, so a hostile save's `gen:'2'` lands in `stats.maxGen` and
  persists into every future save. Found by the importer parity test (fixture pins
  the string). *Port fix:* coerce at the comparison. One line; invisible to honest
  saves.
- ☐ **D-9e — dead biome→fauna filter.** `main.js:11112` reads `wbRoll.fauna` off a
  `BIOME_SETS` entry that has no `fauna` field — a jungle landing can show glacier
  fauna. *Port fix:* wire the filter through the biome profile when Phase 4+ builds
  landing rosters. Gameplay-affecting — needs Nick's call on WHEN (it changes which
  creatures appear).
- ☐ **D-LOC — locale-dependent civilization text.** `civilization()` uses
  `year.toLocaleString()`; two devices in different locales render different
  descriptor text, and fixture parity would break on a non-en-US CI machine.
  *Port fix:* fixed-locale formatting (`toLocaleString('en-US')`) as an approved
  deviation, or a pure formatter. Cosmetic to players, structural for CI.
- ★ **D-NAV — illegal navigation states unrepresentable.** The old build defended
  `st.star.x` against null per frame after a crash shipped; `@cf/scene`'s state
  machine rejects illegal transitions and clears deeper context on ascent, so the
  class cannot exist. No parity cost — same legal states.
- ★ **D-CLOCK — no wall-clock in the domain.** COSMIC_EPOCH's port takes an injected
  play-seconds source; the harvestclock invariant holds by construction. The no-DOM
  lint enforces `Math.random`/`Date.now` absence across every domain package —
  the original could only enforce this by grep + discipline.

## Architecture / layering

- ☐ **D-HAZE — `galaxyHaze` lives inside WorldGen [domain]** and draws a 2048px
  canvas (the source violates its own architecture comment; it is the no-DOM lint's
  documented exception). *Port fix:* render-layer ownership in Phase 3/4 scenes.
  Also a candidate one-move cleanup upstream in main.js.
- ☐ **D-ST — `describePick` reads app globals inside a [domain] module.**
  The card router (Descriptors, main.js ~3035) reads `st` (nav state) and
  `customNames` (rename map) as FREE identifiers — exported by the lift but
  throwing on first call until the slice installed a seam (2026-07-31; same
  green-while-broken shape as worldgen's GAL_SPRITES). The slice keeps the
  seam true from its nav state; *port fix:* pass state as parameters when
  Phase 4 rebuilds the card layer. ⚠ Same find surfaced a STALE-LIFT hazard:
  re-lifting Descriptors after the strays registry row grew `regionAt` added
  a previously-missing import (the old lift left `regionAt` free — guarded by
  `typeof st`, so capture-green). Re-lift after any registry change.
- ☐ **D-STRAYS — domain-pure functions scattered through app sections**
  (biomeFor, hdGenesFor, where-codecs, winEstimate, floraStat, cleanName,
  `_sanitizeSavedGenome`, the ring-grade chain). The port already homes them in
  `@cf/domain-strays`; the *upstream* cleanup (moving them into [domain] modules in
  main.js) is optional and cosmetic.
- ★ **D-STORE — one localStorage blob → §19.3 split stores.** The repository
  separates meta/player/creatures/catalog/inventory/settings/journal/assetcache with
  atomic transactions and typed recovery — the single-blob format survives via
  import/export for compatibility, but new-format persistence can be incremental
  and partial-failure-safe.

## Determinism / replayability

- ☐ **D-RNG — the 11 bare `Math.random()` outcome rolls** (tryCapture, openPicker,
  _descRoll, attemptContact, hazardFlavor, _tutGrant, _tutDuel…) become
  `@cf/domain-sessionrng` calls in Phase 4+ wiring — outcomes replayable per
  (seed, domain, n), state in the save + diagnostics export. Reviewer §2.1;
  package built, wiring pending. Player-visible behavior: none (still unpredictable).
- ☐ **D-NOTIF-T — notification fallback stamps.** `pushNotif`/load fall back to
  `Date.now()` for invalid stamps. *Port fix:* the injected clock everywhere
  (already true in importSaveV2's signature).

## Coverage the original never had (already landed — no approval needed)

- ★ Golden corpus extensions: `makeNoise` ×10k and `crossGenome_uncorrelated` ×10k
  (the consecutive-seed recipe never executed the size-mutation branch once in 10k
  cases — input correlation zeroed a branch's coverage).
- ★ Real-input tests behind the vacuous probes (planetSpecies `[]`, galaxyDescriptor,
  moonDescriptor, empty-cell galaxiesInCell — which hid a would-be crash on every
  populated cell).
- ★ The save-fixture harness (10 real-boot fixtures incl. recovery and the
  arrays-as-objects gate quirk) + content-registry gate + round-trip fixed point.
- ★ The 9g rarity-collapse guard, data-level and end-to-end through speciesGrade.

## Phase 7 pre-commitments (from Phase 0 measurements, so they aren't rediscovered)

- ☐ **D-AUDIO-CAP — no audio concurrency bound exists anywhere** (10 AudioNodes per
  utterance, unbounded in-flight). §15 requires mobile budgets; the port's mixer
  must ship one. Measured during Phase 0; do not let the port inherit the absence.
- ☐ **D-LEGACY-VOICE / D-F0** — already decided in `port/DECISIONS.md` (fallback-only;
  soft saturation tuned after the listening test). Listed here only for completeness.
