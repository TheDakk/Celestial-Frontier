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
- ✔ **D-ART-79 — A REGEX THAT STOPS AT THE FIRST  CANNOT SEE A FUNCTION TYPE (2026-08-02).**
  coveragegap discovered route tables with , which stops at the  inside
  . The wave-18 CANON map is typed , so the ENTIRE map
  was invisible — ~30 routes by wave 21 (Bear, Koala, Dugong, Manatee, Cuttlefish, Lamprey, Sea
  Squirt, eight iconic flora, Enoki, Cyanobacteria) reported as UNROUTED, and the proportion
  arc's plan was about to be drawn from that number. Third time this tool has nearly mis-planned
  a wave off its own blind spot. ⚠ I first blamed the table-NAME filter and fixed that
  instead; the discovery guard is what proved the diagnosis wrong, because CANON still did not
  appear. **A fix that does not make the guard go green is not the fix.** The tool now asserts
  CANON is discovered and prints every uppercase const it skipped.
- ✔ **D-ART-80 — THE MAMMALS HAD NO WHITES IN THEIR EYES (arc stage 2).** Every other painter
  family draws sclera + pupil + catchlight; the quadruped system — the largest family in the
  catalogue — drew a single dark dot. ~200 mammals had no readable face and four green gates
  never saw it. Fixed with a three-layer eye, a soft socket, a lid line, and radius 0.16 ->
  0.21 x headR: an eye a player cannot locate at thumbnail size is not an eye.
- ✔ **D-ART-81 — A CONTROL ON THE DECISION LAYER SAYS NOTHING ABOUT THE SENSOR (arc stage 2).**
  conformance's self-test held 7/7 while the eye detector feeding it was 40% accurate, because
  the test drove the JUDGEMENT with synthetic numbers and never the MEASUREMENT. The detector
  was wrong four consecutive times (tusks counted as eyes; a fixed enclosure ring that samples
  back into the sclera on small eyes and made it WORSE; a cluster floor that rejected the one
  surviving pixel of a real catchlight). Every sensor now needs GROUND TRUTH a human has
  looked at, scored every run.
- ✔ **D-ART-82 — A CHECK THAT CANNOT ANSWER MUST DECLINE, NOT GUESS (arc stage 2).** Bbox
  aspect carries no information about a coiled body, and comparing our correctly-coiled snakes
  and worms to a straight-line reference produced ~38 findings that were purely the tool's
  fault. Below a trust floor, a finding class is SUPPRESSED and says so — false findings send
  the next session chasing ghosts, which is the same failure as a vacuous pass, reversed.
- ✔ **D-ART-83 — A BAND IS NOT A REFERENCE (arc stage 3).** Clamping 127 quadruped torsos into a
  1.5–2.0 ratio band snapped almost all of them to the SAME boundary value, and Nick saw it
  instantly: "every animal on four legs has kind of the same body type… the elephant has adopted
  the wolf body." A shared wrong shape is worse than varied wrong shapes. Every species now
  derives its ratio from its own reference row: 21 distinct ratios, 1.05–2.75, one still at 2.00.
- ✔ **D-ART-84 — A CLOSED PATH MAKES A CUSP WHERE IT REOPENS (arc stage 3).** The torso closed at
  the rump and restarted toward the back line from the same point, so the tangents met at an
  angle — a sharp corner on the roundest part of every mammal in the catalogue. The rear is one
  continuous bezier now, with no closing seam for a corner to form in.
- ✔ **D-ART-85 — A LIMB IS PROPORTIONED AGAINST THE WHOLE ANIMAL (arc stage 3).** Leg thickness
  was a fraction of body DEPTH alone, so elephant, hippo and rhino grew tree trunks. Capped
  against body length; slimmer animals are unchanged because their depth term still wins.
- ✔ **D-ART-86 — AN EAR CATEGORY IS A SHAPE, NOT A SIZE (arc stage 3).** Routed as 'huge', an
  elephant got two upright rabbit ears on its crown. 'fan' hangs a broad veined ear down the
  side of the head. Same class as D-ART-78: a feature belongs to the right body part, drawn the
  way that animal actually wears it.
- ✔ **D-ART-87 — moveTo INSIDE A PATH ORPHANS EVERYTHING BEFORE IT (arc stage 3 wave 2).**
  `smoothTop` opened with moveTo, so wave 1's continuous rear bezier ended up in its own
  subpath and canvas closed it with a STRAIGHT CHORD across the haunch — the jagged rear hump
  Nick reported twice. The fix I shipped in wave 1 was correct geometry attached to nothing.
  Sub-path builders must join to the current point when continuing an open path.
- ✔ **D-ART-88 — A DRAWING FIX IS NOT DONE UNTIL YOU LOOK AT THE PIXELS (arc stage 3 wave 2).**
  Wave 1's rear fix was reported as landed because the code read correctly. It never drew.
  The strip is the instrument; the source is not. Drawing-side twin of D-ART-81.
- ✔ **D-ART-89 — I CAN SEE THE ART. THE WHOLE ARC WAS RUN BLIND FOR NOTHING (wave 4).**
  Four sessions of this arc were built on the belief that no instrument could look at a
  render, so everything was inferred from measurements and from a text "reference" written
  from the same model knowledge that drew the art. **The exported portraits are PNG files on
  disk and the Read tool renders them.** One call to `Read` on `Cheetah.png` showed, in
  seconds, four defects that four waves of geometry reasoning had not found. Subagents can
  see them too, so the catalogue can be audited by looking at it.
  **Look at the picture. It is available, it is free, and it outranks every number here.**

- ✔ **D-ART-90 — A FLAT SHAPE HAS NO INSIDE, SO NOTHING CAN BELONG TO IT (wave 4).**
  Nick: *"there's a line between their body, almost like it looks like the legs are hooked
  in"* and *"think of it like a skin, not like you're painting on top of the animal."* Two
  complaints, one cause: the torso was an OUTLINE — a back line, a belly line, a bezier. An
  outline has no depth, so a limb can only ever be **butted against** it and a mark can only
  ever **float on** it. No amount of blending fixes either; the information needed (how deep
  is the body here, which way is the surface facing) does not exist in the drawing.
  The torso is a **solid** now (`torso.ts`): a spine with a radius profile. Silhouette,
  shoulder mass, haunch mass, foreshortening and per-point lighting all fall out of that one
  structure — and three waves' worth of cusp/seam/tangent bugs (D-ART-84, 87) became
  unreachable, because a swept circle has no seam to cusp.
  **When a fix keeps not sticking, ask whether the representation can express it at all.**

- ✔ **D-ART-91 — A TONE COMPUTED PER PATCH MUST AGREE WITH ITS NEIGHBOUR (wave 4).**
  The first countershading painted one gradient per slice of the body and every animal came
  out ribbed: adjacent slices computed slightly different gradients and each boundary showed
  as a line. The patching became the texture. Bands now run along the body and are filled
  with a gradient *across* themselves, so neighbours meet at a colour they already share.

- ✔ **D-ART-92 — "WEARS THE LIGHT" DOES NOT MEAN THE LIGHT MAY DELETE THE FEATURE (wave 4).**
  Obeying D-ART-69 too literally, marks were bleached toward white in proportion to how lit
  they were. This engine lights from the upper LEFT and every animal faces right, so the
  tiger's stripes were erased from its entire hindquarters. A black stripe in sunlight is a
  black stripe with a sheen on it. Light adds a highlight; it subtracts almost nothing.

- ✔ **D-ART-93 — A MARKING IS SPACED AGAINST ITS NEIGHBOURS, NOT AGAINST THE BODY (wave 4).**
  Stripe width was a fraction of body radius, so on a deep short animal nineteen bars were
  each as wide as the gap between them and the flank merged into one smear. Pattern pitch is
  a property of the pattern: derive the width from the spacing. D-ART-85 for markings.

- ✔ **D-ART-94 — YOU CANNOT BLEND A JOIN BY REPAINTING IT (wave 4).**
  The first attempt at the limb join repainted each near leg's root in "roughly flank
  colour". It could not match — the flank is countershaded and coated — so every animal got
  a pale oval on its shoulder and haunch, a worse artefact than the seam. The join needed no
  blending at all: on a real animal seen from the side the near thigh is INSIDE the body
  outline. All four legs now draw behind the torso and the body's own mass covers the roots.
  **Before inventing a blend, check whether the real thing has the join you are hiding.**

- ✔ **D-ART-95 — THE ART LOCK: MAKE CATALOGUE-WIDE CHANGE COUNTABLE (wave 4).**
  Nick: *"we want to prevent global passes from affecting this. Let's put a safety net in
  there so that, as we're iterating, it's not messing up what we did before."* Every gate
  this project owned asked about ONE asset in isolation, so all of them stayed green while
  three global passes flattened 127 animals and regressed the elephant. `tools/artlock.mjs`
  fingerprints all 1,254 rendered assets and reports **[DRIFT]** (how many moved since the
  blessed baseline — change is allowed, being *unaware* of it is not) and **[SAME]** (the
  nearest-neighbour separation between species — a global clamp does not merely move
  everything, it moves everything *together*). Run it in the battery; re-bless only after
  looking, and **never to turn a red report green**.

- ✔ **D-ART-96 — A FAMILY MAY SET THE KIND, NEVER THE FACE (arc stage 3 wave 6).**
  Nick, on the wave-5 export: *"the heads of the animals all look the same to me. They didn't
  look unique."* True — every mammal wore one head: an ellipse, a smaller ellipse for a muzzle,
  a dot, one big eye. Wave 6 gave each family a real skull profile (length, the "stop" between
  forehead and muzzle, jaw depth, and **where the eye sits** — forward and central on a
  predator, high and far back on a grazer, which is most of the prey/hunter read).
  **Then the safety net immediately failed my own commit**: giving every felid one skull pushed
  the look-alike count from 4,322 to 4,354. It was right to. A family plan is a licence to
  share a *kind* of anatomy, never a licence to issue the same face — so the species' own name
  varies every skull dimension (D-ART-20), and the reference row's measured `headFrac` should
  drive it next. The rule generalises to every family system this arc adds.

- ✔ **D-ART-97 — A COUNT OF THRESHOLD CROSSINGS IS NOT A MEASUREMENT (arc stage 3 wave 6).**
  The [SAME] ratchet first gated on "the number of pairs under 2.5 may not rise", and it failed
  wave 6 with 32 new "look-alikes" — which, once the tool was made to NAME them, were
  *Bullfrog ≈ Cat* and *Mosquito ≈ Cat* at 2.4: pairs that had wandered across an arbitrary
  line. My own calibration already said 1% of entirely unrelated pairs sit below 2.62, so that
  band holds no signal and counting crossings of it measures noise. The gate now fires only
  where the metric can discriminate — on a pair the change pushed below 1.5 — while the count
  is still reported as a worklist. **Gate a metric only over the range where you have shown it
  separates the two populations; and make every failing gate print the specific rows it means,
  because "32 more" is not something anyone can action.**

- ✔ **D-ART-98 — REDEFINING A SHARED ENUM VALUE SILENTLY RE-SKINS EVERY EXISTING USER (wave 6).**
  `coat: 'patches'` meant "soft irregular blotches", so an African Wild Dog, a Friesian cow and
  a colugo all used it quite reasonably. Wave 4 redefined it as the GIRAFFE's reticulated
  tiling and changed nobody's spec — and the visual audit came straight back with *"the African
  Wild Dog reads as a young giraffe"*, which it did. Nothing failed; every gate was green; the
  species had simply been re-skinned by a change to a word. **When you sharpen the meaning of a
  shared value, grep its users and give the ones you did not mean a name of their own** — the
  same law as "grep every reader and writer of a field" in the project's CSS/save rules,
  applied to an art vocabulary. `'blotches'` now exists and the giraffe keeps `'patches'`.

- ✔ **D-ART-99 — A SHAPE SYSTEM DOES NOT MAKE A FACE UNIQUE; THE FEATURES ON IT DO (wave 6).**
  Wave 6 gave every family its own skull profile and it plainly worked *between* families. The
  mammal visual audit then measured the thing Nick actually asked about and returned **20 of
  141 heads unique**, with the reason stated plainly: *"same two-tone leaf ear pair, same big
  white-ringed cartoon eye at the same position, same wedge muzzle, same dark nose dot, same
  single mouth line."* The silhouette was per-family; every FEATURE drawn on it was still one
  asset shared by the entire catalogue. **Fixing the underlying form is necessary and is not
  sufficient — check whether the parts you left alone are now the thing carrying the sameness.**

- ✔ **D-ART-100 — A SPEC FIELD THAT IS DECLARED, DOCUMENTED AND INERT (wave 11).**
  `FishSpec.hue` had existed since wave 21 with the comment "only where colour IS the
  identity", and the painter opened with `const p = spec.hue ? { ...pIn } : pIn` — it COPIED
  the palette when a hue was set and never applied it. Every fish in the catalogue took its
  rarity roll, which is why the lock reported Cave Fish ≈ Anchovy and Herring ≈ Bonefish as
  the same picture. Nothing failed; `artaudit` does not look for this, because the field is
  read. **An inert option is worse than a missing one — every row that sets it looks correct,
  and the reviewer stops looking.** When you add a spec axis, render one asset with it set to
  an absurd value and confirm the picture changes.

- ✔ **D-ART-101 — THE PLAUSIBLE INSTRUMENT FIX WAS THE WRONG ONE (wave 11).**
  Small organisms sit on a mostly-dark field, so two of them agree on most pixels merely by
  both being small — a real confound, and masking the comparison to the union of the two
  subjects is the obvious repair. Measured against Nick's 115 hand-identified
  template-sharing pairs it dropped the catch rate from **95/115 to 23/115** at a worse
  false-positive rate. The background is not noise: it encodes SIZE and POSITION, and those
  are most of what separates two species. Reverted, with the finding written into the source
  so nobody re-derives it. **Re-run the calibration on any metric change, including the ones
  that are obviously right.**

- ✔ **D-ART-102 — GATE ON THE NET, NOT ON ONE TAIL (wave 11).**
  The [SAME] gate failed on any pair a change pushed below the confusable line while ignoring
  every pair the same change pushed apart — so a wave that HALVED the identical-looking pairs
  (19 → 9) was blocked by 21 that had drifted the other way. That is not the failure the net
  exists to catch: a global pass collapses the catalogue *net*, and this change improved it
  net (443 → 416 confusable). It now gates on the total, which cannot be gamed — everything
  moving together drives it sharply up — and still prints the newly-created pairs as the
  worklist. **A one-sided criterion on a two-sided quantity blocks the work it should approve.**

- ✔ **D-ART-103 — THE ART LOCK IS BODY-SCALE AND CANNOT SEE A FEATURE (wave 13).**
  Wave 13 changed the EAR SHAPE and the EYE of all 141 quadrupeds and artlock reported
  **zero drift**. Nothing was broken: a head is a small part of a 440px portrait and an ear is
  a small part of a head, so a per-feature change lands well under the 16x16 fingerprint
  threshold that is tuned to catch a catalogue-wide body pass. The guard is doing its job and
  its job is not this. **Never read "0 drift" as "nothing changed" — read it as "nothing
  changed at the scale this instrument resolves", and verify a feature change by looking at a
  native-size render** (D-ART-88). Recorded rather than fixed: raising the sensitivity enough
  to see an ear would make every rng jitter register as drift and destroy the signal.

- ✔ **D-ART-104 — EVERY GATE ASKED ONE HALF OF THE QUESTION (wave 15).**
  Six instruments, all asking "did something move that should not have?" and not one asking
  the inverse: **"did the thing I just edited actually move?"** That gap cost two waves.
  Wave 11: `FishSpec.hue` was inert for two waves and every row that set it looked correct.
  Wave 13: the ear-shape switch was ignored by the branch every large ear took, so setting
  `earShape` on a wild dog, a deer or a fennec changed nothing — and it took a 21-agent visual
  audit to notice. `artlock --expect` now reads `git diff` over the override tables, pulls out
  every species whose spec row changed, and asserts each one actually drifted. Negative-
  controlled by reintroducing the wave-13 half-fix: it named Gazelle in one line.
  **A spec row you edited that renders byte-identical is a fix that did not land.**

- ✔ **D-ART-105 — A THRESHOLD BELONGS TO A QUESTION, NOT TO A METRIC (wave 15).**
  `--expect` was built reusing DRIFT_EPS and immediately failed on a legitimate ear edit.
  The two guards ask opposite questions and need opposite sensitivities: DRIFT asks "did the
  catalogue shift?" and must ignore noise, so its threshold is deliberately body-scale
  (D-ART-103); EXPECT asks "did this ONE asset change at all?" and — because every render here
  is deterministic and seeded — the honest test is byte-identity. Sharing the constant made a
  correct guard report false failures. When you reuse a threshold, re-derive it from the new
  question rather than inheriting it from the old one.

- ✔ **D-ART-106 — THE THIRD SHARED HEAD TOKEN WAS THE MUZZLE (wave 16).**
  The re-measure named exactly three reasons a head reads as generic — the ear (83 of 92), the
  eye (83) and the MUZZLE (81) — and was specific: *"a thin plank muzzle with a dot nose and a
  straight mouth seam"*, *"a rectangle stuck to the face … no lower jaw, so the skull has no
  cheek"*. Three things were missing from every mammal: a NOSE PAD with a family size (a dog's
  takes a quarter of its snout end, a cat's is a stud, a bear's is enormous) with real nostril
  slits; a LIP that starts at the corner under the cheek and ends in a shape the family owns
  (a cat's upcurl, a horse's droop, a camel's cleft); and a CHEEK and CHIN, without which a
  muzzle leaves the skull as a plank. **A feature shared by every member of a catalogue is
  invisible to any per-asset check and is exactly what makes a catalogue look samey.**

- ✔ **D-ART-107 — 100% EARTH COVERAGE, AND FOUR SCANNERS THAT COULD NOT SEE A KEY (wave 18).**
  All 1,014 Earth organisms are routed. Getting the last 38 there broke FOUR tools in the same
  way — each assumed one surface form for a species key:
  · `coveragegap` stored CANON keys as `fauna|Whale` and never stripped the kingdom prefix, so
    every CANON-routed species counted as unrouted. It also printed counts and no NAMES.
  · `artclass` had the same prefix bug (fixed earlier), then turned out to match only
    SINGLE-quoted keys — and four plants have an apostrophe in their name, so their rows must
    be double-quoted. They were classed `verbatim-flora` and the lock correctly failed the
    commit for undeclared drift.
  · `overridecheck` treats every depth-1 string in a route table as a species key, and
    parentheses are not brace depth — so an inline `tint(p, '#e0409a')` put a COLOUR through
    as a key and it reported eight hex codes as "not in this kingdom".
  **When a key can be written more than one way — prefixed, quoted either way, or embedded in
  a value — every scanner that reads it must read all of them.** Three of the four were found
  by USING the tools, not by reading them; the fourth was found by the art lock refusing a
  commit. That is the guards working, and it is why they exist.

- ✔ **D-ART-108 — THE RARITY ROLL WAS DOING THE WORK OF SEPARATING SPECIES (wave 20).**
  Nick ratified the rule that an Earth species should render in a plausible Earth colour and
  only procedural aliens should take the rarity roll. Three formulaic implementations were
  built and all three REVERTED, each rejected by the sameness guard: pulling every saturated
  roll toward its own grey (watch 3,393 → 5,433, identical 1 → 12); folding the cool half of
  the wheel into the warm band (1 → 5); rotating only the impossible violets (1 → 3).
  Colour is the strongest signal in these portraits, so **any squeeze of the gamut trades neon
  animals for animals that look alike — and the second defect is worse than the first.** The
  rule is right and can only be delivered by SPECIES-TRUE COLOUR PER ORGANISM, which separates
  BETTER than a random roll because real species genuinely differ. ~100 have one; the rest is
  a data job, not a formula. The finding is written into the source so nobody re-derives a clamp.

- ✅ **D-ART-116 — THE MATERIAL LAYER REACHES THE PLANTS AND THE FUNGI (wave 25).** Flora were
  the last flat gradients in the catalogue — ~330 of them — and that is the worse half of the
  partial-material problem: a flat leaf beside a furred wolf reads as *unfinished*, not as
  different.
  - **A leaf's material is VENATION, not texture.** A midrib alone says "leaf-shaped"; the
    laterals branching off it and dying before the margin are what say "leaf" (a vein drawn
    all the way to the edge reads as a crack). `leafSurface()` adds those plus the gloss along
    the lit side of the midrib. Blade grasses get PARALLEL veins rather than a branching net —
    a real monocot/dicot difference that also stops a grass reading as a small broadleaf.
  - It lives in `surface.ts`, not `skin.ts`, and deliberately takes plain local geometry
    rather than a `Tube`: a leaf is a flat blade drawn in its own rotated frame, so the
    swept-circle machinery the animals use does not apply.
  - **Fungi needed far less** — gills, pores and fibrils were already modelled in waves 14–18.
    The one thing missing was that a cap is genuinely slightly WET, which a flat radial
    gradient cannot say. `capSheen()` is a tight off-centre highlight that falls off fast.
  - Also fixed: **Rhubarb was rendering entirely scarlet.** `hue` is the FOLIAGE axis and
    rhubarb leaves are green — only the stalks are red, which the row already said via
    `petiole`.
  - ⚠ **The drift guard reported 6 changed assets for a pass that touched ~330 plants.** That
    is D-ART-110 behaving exactly as documented — a 16×16 fingerprint cannot resolve venation
    — so this wave was verified BY EYE, which is the recorded procedure for material work.
    Do not read a small drift number here as "it did not land".

- ✅ **D-ART-115 — THE COLOUR TAIL, CLOSED AT THE CALL SITE (wave 24).** 992 of 1,010
  organisms now carry a real colour (973 explicit, 19 species-true by construction).
  - **Why not forty more painter edits.** The remainder was a long tail: ~50 painters, most
    covering ONE species. Forty signature changes to colour forty organisms is the wrong
    trade and forty chances to declare a field nothing reads. `speciesHue(p, '#rrggbb')` at
    the call site does the same job in one line per species — the trick 11 microbes have used
    since wave 18 — and `tools/applytints.mjs` either produces a call with the tint in it or
    refuses. It refuses a painter that takes no `Pal` at all rather than guessing.
  - Three bugs in that tooling, all found by LOOKING rather than by a gate: it matched per
    LINE when these tables pack several species per row; it wrapped a hard-coded `p` when the
    CANON table names its palette `pp` (that alone refused 14 tintable species, including
    every bat); and — the real one — **the dart frog rendered RED when the row said blue.**
    `faunaDartFrog` anchors 88% toward its own aposematic colour, so the tint was inert.
    Eleven species sit behind painters that anchor a hardcoded colour, which IS species-true
    work from an earlier wave; their tints are reverted rather than left looking meaningful.
  - ★ **`huegap` has now been wrong SIX times about what counts as "already coloured"** —
    `fhue:`, the RGB-array `hue:`, `tint()`, painters that take no palette, `speciesHue()`,
    and anchored palettes. Every spelling is listed in the comment there with what it cost.
    **The list is the deliverable: extend it, do not re-derive it.** Twice the error
    overstated the work (270 flora, 11 microbes) and twice it caused a bad write.

- ✅ **D-ART-114 — THE COLOUR AXIS SIX PAINTERS NEVER HAD, and the shape fixes that paid for
  it (wave 22).** Nick, on being shown the accuracy-vs-legibility trade-off: *"is there any
  way we can slightly fix it? They are not exactly the same in real life, so there's got to
  be some kind of compromise."* He was right, and the compromise is the rule below.
  - **575 organisms were on the random rarity roll purely because of which painter drew
    them.** `plantBody`, `smallRodent`, `insectBody`, `reptSnake`, `reptLizard` and `primate`
    had no hue field at all — `plantBody` alone accounted for 314. Adding one moved the
    reachable count from 4 to 429, and **the catalogue went from 268 to 845 of 1,010
    organisms carrying a real colour.** Every reachable species is now done; 150 remain
    behind painters still lacking an axis and 15 are unrouted.
  - The axis was **proven end-to-end before any colour was written** — one loud probe hue per
    painter, rendered and looked at, then removed. That also caught that `plantBody`'s new
    `hue` must colour the FOLIAGE while `fhue` keeps the flower and fruit; conflating those
    two is what made the original audit report 270 flora as done while their bodies were
    still random.
  - ★ **THE COMPROMISE, and it is the rule to carry forward: WHEN TWO SPECIES WILL NOT
    SEPARATE BY COLOUR, IT IS BECAUSE THEY ARE DRAWN THE SAME SHAPE.** Honest colours took
    hard look-alike pairs 1 → 9, and seven of the nine were insects: Ant, Leafcutter Ant,
    Cockroach, Cricket, Cicada, Black Fly, Cold-Adapted Insect. The specs said why — every
    one was the same body plan with a different `abdomen` length. **The insect family had a
    LENGTH dial and nothing else**: no width, no head size, no thorax shield, so seven
    genuinely unalike animals were one silhouette at seven sizes. `broad`, `eyes` and
    `shield` fixed it (a cockroach is a flat oval whose pronotum hides its head; a leafcutter
    is a huge-headed major worker; a fly is mostly eye) and took hard pairs **9 → 2**. Wild
    Thyme became the low woody sub-shrub it actually is rather than an erect herb, and the
    Mite became the round red arachnid it actually is. **Final: 0 hard pairs — better than
    the baseline of 1 this arc has carried since wave 12.**
  - ⚠ **A COUNTER-INTUITIVE ONE WORTH REMEMBERING: shrinking a species makes it MORE
    confusable, not less.** The Mite was first drawn smaller, which is truer to life, and its
    distance to Ant got *worse* (0.60 → 0.51) — a small subject leaves mostly empty canvas
    and two mostly-empty cards look alike to the fingerprint. Drawn larger it separates
    cleanly. Portrait scale is invisible anyway when each species is framed alone, which the
    bird painter had already learned in wave 8.
  - **Confusable settled at 1,202 (from 478) and is re-baselined.** Colouring 429 more
    organisms honestly means ~300 plants that really are green now measure as similar. The
    hard ratchet is the load-bearing guarantee and it is at zero; the confusable tier is a
    watch-list, and the shape rule above is how to work it down when a pair matters.

- ✅ **D-ART-113 — SPECIES-TRUE COLOUR, first 148 organisms (wave 21).** Nick ratified the rule
  ("I agree with the species colors"); D-ART-108 had already established that no FORMULA can
  deliver it, so this is the per-species route: a hue read off the real animal, one organism
  at a time, fanned out to agents and applied through `tools/applyhues.mjs`.
  - **The measurement was wrong before it was right.** The first count said 521 organisms
    already carried a species hue. It was matching `fhue:` — the FRUIT colour on 270 flora —
    with a regex that never anchored the word start. The honest figure was **268**. Fixing it
    moved the gap from 489 to **742**, i.e. the problem was half again as large as reported.
  - **Capability is checked per PAINTER, not per table** (`tools/huegap.mjs`). Two cheaper
    heuristics were tried and rejected: "does a sibling in this table have a hue?" (wrong —
    `FAUNA_NAME` holds both `faunaBird`, which reads a hue, and `faunaBeetle`, which has no
    colour axis; it would have written ~250 INERT hues, D-ART-100 at scale) and "does the
    exported painter mention `.hue`?" (wrong — `faunaQuadruped` applies its hue through a
    non-exported helper, so the whole mammal system read as incapable).
  - **An RGB-array hue is still a hue.** `faunaCetacean` takes `hue: [226, 228, 230]`, so all
    13 cetaceans were reported colourless and the first run wrote a SECOND `hue` key onto
    each line — a duplicate property whose later value wins, leaving the new hex inert.
    TypeScript rejected it (TS1117), which is the only reason it was cheap to find.
  - ⚠ **THE TRADE-OFF, AND IT IS A REAL ONE — NICK SHOULD SEE THIS.** Realistic colour makes
    genuinely-similar animals genuinely similar. `[SAME]` went **hard 1 → 10** and
    **confusable 328 → 519** on first application. Four rounds of separation brought hard
    pairs back to **1** (the pre-existing Water Mint / Chicory, which no colour can fix — the
    flora painter has no axis for a bare branching stem), but **confusable settled at 478 and
    has been re-baselined, not defeated.** Reef Shark ~ Hammerhead Shark and Gar ~ Eel are
    now "confusable" because in life they look alike. The hard ratchet — "effectively the
    same picture" — is the load-bearing guarantee and it is intact; the confusable tier is
    the accepted cost of the rule Nick ratified. **If he would rather keep the catalogue
    legible than accurate, this is the number to revisit.**
  - **One fix was anatomical, not chromatic, and that is the lesson.** Eel, Electric Eel and
    Lungfish shared a profile, length, depth, tail, snout and dorsal — three identical
    silhouettes — so hue was carrying the entire distinction and could not: every brown that
    pulled Lungfish clear of Eel pushed it into Electric Eel, and back, for four rounds. A
    lungfish is a heavy-bodied fish, so it is now drawn as one. **When colour cannot separate
    two species, check whether they are actually the same shape.**
  - Remaining: **594 still on the rarity roll**, of which only 4 are reachable today. **575
    are blocked behind painters with no hue axis** — `plantBody` (314), `smallRodent` (29),
    `insectBody` (26), `reptSnake` (21), `reptLizard` (18), `primate` (17) are the big ones.
    Giving those six painters a hue axis is the highest-value next move by a wide margin.
    `node tools/huegap.mjs` regenerates the worklist.

- ⚠ **D-ART-109 — ARTLOCK WAS NEVER IN THE ART BATTERY (wave 21).** The safety net built to
  stop a global pass from silently undoing signed-off work was documented as part of "the art
  gate", the handoff called `npm run artbattery` "the 5-stage art gate", and the battery did
  not run it. It fired only when someone typed it by hand — which is the exact failure mode
  it existed to remove, because **the guard you have to remember is not a guard.** Found when
  a wave that repainted 500+ organisms came back `5/5 stages passed` and artlock, run
  manually thirty seconds later, said FAIL. Now stage 6 (last, because it renders the whole
  catalogue twice and cheap static failures should surface first), and negative-controlled:
  deleting one fingerprint from the lock makes the battery report `5/6` and exit non-zero, so
  it is proven to PROPAGATE a failure rather than merely to run one.

- ⚠ **D-ART-137 — A GUARD CLAUSE THAT LEFT THE WHOLE PAINTER (wave 35).** D-ART-134 added
  `earShape: 'hidden'` for the animals with no external ear — a seal, a mole, a sloth — and
  implemented it as `if (earShape === 'hidden') return;`. That `return` exits
  `faunaQuadruped`, not the ear block, so **everything below it was skipped: the face
  markings, THE EYE, the horns, the trunk and the tail.** Sloth, Mole, Seal, Fur Seal, Sea
  Lion and Walrus all rendered with a blank head and no eye at all, and the Walrus lost the
  tusks that ARE the animal. Six species, one keyword, and every gate green — no test
  asserts "this species has an eye", and artlock had blessed the eyeless render as the
  baseline.
  **The lesson sits one level below D-ART-88.** D-ART-88 says look, because reasoning about
  geometry misses defects. This says: a fix can be *correct about the thing it names* and
  wrong about *where it stops*. The commit that shipped it was right that a seal has no
  pinna, described that correctly in its comment, and was never rendered. The comment and
  the code agreed; the code and the animal did not.
  ⚠ **Suppressing a FEATURE is never `return` in a painter that draws more features
  afterwards.** Prefer an empty branch in the existing if/else chain — it cannot outgrow its
  scope when the function grows below it, which is exactly what happened here.

- ⚠ **D-ART-138 — THE BATTERY COULD NOT EXPRESS A DECLARATION (wave 35).** `npm run
  artbattery` invoked `node tools/artlock.mjs` with no arguments. artlock's whole [DRIFT]
  contract is "declare the painter classes you are touching"; with no `--touching` it reads
  *"declared: (nothing — so nothing may move)"* and **fails on every legitimate change.**
  So the battery's own stage 6 was red for any real work, and the only ways to get a green
  battery were to change nothing or to stop believing the battery. That is D-ART-109's
  failure returning through the other door: **a guard that cannot pass when the work is
  correct decays into a guard nobody reads.** It forwards arguments now —
  `npm run artbattery -- --touching=quadruped`.

- ✅ **D-ART-120 — THE SILHOUETTE CHANNEL: the drift guard can finally see a limb (wave 27).**
  Nick's call, on being shown that the guard was blind to exactly the work remaining.
  - **A second channel, not a replacement.** A 64×64 one-bit coverage mask, 512 bytes —
    smaller than the RGB grid it accompanies. Drift now takes `max(colour, shape)`. The
    16×16 RGB grid is deliberately UNCHANGED: its thresholds are calibrated against Nick's
    own judgement of 115 real pairs and 1,236 live pair verdicts depend on them, so raising
    its resolution would have silently recalibrated all of that. The look-alike ratchets keep
    reading the grid they were tuned on; only DRIFT gains the new sensitivity.
  - **Controlled, and the first version failed the control.** It thresholded ink at
    `r+g+b > 96`; these portraits sit on a painted VIGNETTE rather than on black, so the
    whole frame counted as subject, every mask came out identical, and the channel reported
    zero drift for a limb change — the precise failure it existed to fix. Now measured
    against the frame's own corner pixel, the method the proportion pass already used.
  - **Measured end to end:** suppressing one pair of crocodilian legs used to move **0 of
    1,250** assets. It now moves 3 (Caiman 2.93, Alligator 1.74, Crocodile 1.18). Gharial
    still slips under — its limbs are tiny against a very long body — so the channel is an
    improvement, not a cure. Five new selftest controls, both directions, including "a
    one-pixel-wide limb moving IS drift" and "a single flipped pixel is NOT".

- ⚠ **D-ART-117 CORRECTION — HALF THAT DIAGNOSIS WAS WRONG (wave 27).** Wave 26 reported two
  bugs in the crocodilian limbs. The splay sign was real and is fixed. The second claim —
  "both calls pass `far=true`, so the near pair is never drawn" — **was false**: the near
  pair is drawn forty lines further down, after the body, and four legs always reached the
  canvas. What made them read as two was the splay folding each pair onto its partner.
  - **Why it survived a look at the render:** the "fix" added a duplicate near pair, which
    changed nothing visible, so the picture after looked exactly like the picture the real
    fix produced. It was caught only when a negative control removed the duplicate and the
    render stayed at four legs.
  - **The lesson, now in the code:** read EVERY call site of a helper before claiming what it
    never does. A grep that stops at the first hit is a diagnosis with a hole in it.

- ⚠ **D-ART-110b — THE BLIND SPOT IS WIDER THAN "TEXTURE": THE FINGERPRINT IS AREA-WEIGHTED
  (wave 26).** Measured, not assumed. A single wave rebuilt the limbs of four crocodilians
  (two legs crossing in an X became four sprawled legs), put a large jumping femur onto three
  orthopterans, and re-proportioned five ratites. `[DRIFT]` reported **6 changed assets — the
  five ratites and one penguin, and NOT ONE crocodilian or orthopteran.** The ratites moved
  because their whole body proportion changed; legs and femurs are THIN, dark, and cover
  little area, so a 16×16 mean-per-cell comparison cannot see them however wrong they were.
  **So the guard is blind to any thin structure — limbs, tails, bills, antennae, tusks —
  not merely to surface detail.** That is most of what an anatomy audit is about, so for
  anatomy work as for material work the render is the evidence and artlock's silence means
  nothing. Not "fixed": raising the resolution would invalidate the 1,250-asset baseline and
  is a decision, not a slipped-in change.

- ⚠ **D-ART-110 — THE DRIFT FINGERPRINT CANNOT SEE TEXTURE, so it cannot guard the material
  layer (wave 21).** `[DRIFT]` compares a 16×16 RGB grid at `eps 0.9/255` mean absolute
  channel difference. That is right for what it was built for — a global palette or
  proportion pass moving a whole body — and structurally blind to fine surface detail: at
  16×16 over a 440px portrait each cell averages ~27px, so a 5px feather vanishes into the
  mean. Measured, not assumed: feathering **105 birds** and shelling every arthropod moved
  **11 fauna assets**, most under the epsilon, while the renders are obviously different by
  eye. artlock's own selftest already asserts this as intended behaviour ("a big change on 4
  channels of 768 is not drift"). **Consequence: material work must be reviewed by eye
  (`tools/speciesstrip.mjs`) — artlock's green is not evidence that a material change is
  safe, only that the palette did not move.** Not fixed here: a texture-energy channel would
  invalidate the entire 1,250-asset baseline, which is a decision, not a slipped-in change.

- ✅ **D-ART-111 — A TILED MATERIAL PAINTED IN THE BODY'S OWN TONE IS INVISIBLE (wave 21).**
  `feather` and the shipped `scale` both coloured each tile by `0.5x + L·0.9x` — the
  surface's own lambert, which is precisely what the gradient underneath had already
  painted. Every tile came out the colour of the pixel it covered. The prototype hid this
  because fur is a mist of alpha strokes rather than tiles, so it never had to differ from
  its background to read. **A tiled material only reads if neighbouring tiles differ from
  each other**, so both now carry a per-element `vary` factor and that, not the lighting, is
  what does the work. Caught by the drift guard reporting a change of under one unit across
  the birds, then confirmed on a render.

- ✅ **D-ART-112 — PUT THE MATERIAL WHERE THE VIEWER LOOKS, NOT WHERE THE BODY IS (wave 21).**
  Feathers went onto the bird's torso ellipse first, which is the obvious place and the
  wrong one: on a perched bird the FOLDED WING covers most of the torso, so the coat was
  drawn and then almost entirely painted over. Same shape of error for the beetle — the
  edit landed on `insectBody` while `Beetle`/`Ladybug` route through their own
  `faunaBeetle`, so nothing moved at all. Both fixed by rendering the thing and looking at
  it. Two related traps, both found the same way and both now documented in the code:
  · **the tube's axis must match the drawing's axis** — a beetle is drawn from ABOVE, so its
    tube needs a quarter turn or the segment seams run lengthwise and read as a crack;
  · **ask the surface where the light is, don't assume it** — the chitin specular was pinned
    to the dorsal flank (right for a side-on animal), so on the rotated beetle it landed on
    the right while the engine light comes from the upper LEFT. It now searches phi for the
    brightest station. It read as a lighting bug because it was one.
  Also: seams are not universal arthropod kit. An ant's abdomen is a stack of rings and
  bands beautifully; a beetle's elytra are smooth shields with head-to-tail sculpture, and
  transverse rings turned a ladybird into a beach ball — hence `seams: false`.
  **Cost, measured rather than guessed: a full 1,250-portrait render went 36s → 38s (~6%,
  ~1.6ms per portrait), and portraits are cached.** Every family keeps a `*_MAT_DETAIL`
  dial; 0 restores the old flat look exactly.

- ✅ **D-CAT-1 — RESOLVED (wave 21): the roster IS deduped, deliberately, in the owned
  wrapper.** Nick, shown the real risk rather than the assumed one, chose "deliberate v2
  roster change". So the four duplicates are collapsed and the cost is accepted on the
  record — this is a decision, not a side effect, and it must not be quietly reverted.
  - **Where.** `packages/domain/descriptors/src/apphooks.ts` (OWNED), never
    `apphooks.verbatim.js`. The wrapper filters the lifted `_EARTH_NAMES` through a
    `_DEDUPE` table and re-exports a replacement `_earthNamePass` with the *same*
    algorithm. The verbatim body stays byte-identical, its sha256 holds, and
    `node tools/lift-apphooks.mjs` can still be re-run without reverting the work. A test
    asserts the verbatim pools are still `631/334/27/22` precisely so that an edit to the
    locked file is caught rather than discovered months later.
  - **Ownership.** Tardigrade → fauna (it is an animal), Reindeer Lichen → fungi (a lichen
    is a fungal symbiosis), Snow Algae → microbe (the bloom *is* the microbe presentation),
    Green Algae → flora (the macroalga a player can see and harvest; microbe already
    carries Cyanobacteria and Diatom). **1,014 records → 1,010 organisms.**
  - **The accepted cost.** `i = (g.seed >>> 0) % pool.length` means shortening the flora and
    microbe pools reassigns the Earth name of every flora and microbe in every world, and
    old share codes name different organisms. Accepted knowingly for a port that has not
    shipped. Fauna and fungi pools are untouched, so their names did not move at all.
  - **Parity.** `baseline.json` was NOT regenerated (hard rule 5). The one probe that cannot
    be byte-equal — `planetDescriptor`, which renders Earth's cradle roster — is compared
    through `maskDedupe()`, which hides *only* flora/microbe species names and *only* on
    rows carrying an `sp:` tag. Everything else, in every kingdom, stays under full byte
    parity. Six negative controls pin the mask in both directions (fauna names still fail,
    descriptions still fail, static prose rows still fail, and the mask cannot leak across
    a species boundary), plus a live control that perturbs a fauna name and confirms the
    real 1,014-row probe still fails. Without those the mask would be the eighth check on
    this project to pass because it stopped looking.
  - **Counts that moved with it:** coverage 1014 → **1010**, painted assets 1254 → **1250**.
    `tools/coveragegap.mjs` now parses the wrapper's `_DEDUPE` table instead of restating
    it, so the tool and the game cannot drift; it hard-exits if that table stops parsing.

  <details><summary>The original blocker, kept for the reasoning (wave 20)</summary>

- ⛔ **D-CAT-1 — THE DUPLICATE CATALOG RECORDS CANNOT BE COLLAPSED IN DATA (wave 20).**
  Nick approved collapsing Tardigrade / Green Algae / Snow Algae / Reindeer Lichen, on the
  basis that nobody is playing so saves do not matter. **Saves are not the risk.** The roster
  lives in `apphooks.verbatim.js` — auto-lifted byte-verbatim from main.js v1.8.9, carrying a
  sha256 and a DO-NOT-EDIT banner, regenerated by `tools/lift-apphooks.mjs` — and Earth names
  are assigned by `i = (g.seed >>> 0) % pool.length`. **Removing one entry changes
  pool.length, which reassigns the Earth name of every generated species in every world and
  invalidates every share code.** That is hard rule 1 (never break determinism), not a save
  migration. NOT DONE, and it must not be done this way. The art side is already resolved —
  each kingdom renders one canonical organism. If the duplication is still unwanted it is a
  PRESENTATION change (dedupe in the Compendium) or a v2 roster decision made deliberately
  with a re-baselined determinism fixture; it is not an edit to a lifted file.

  *(Wave 21 took the last option — deliberately, with the mask above standing in for a
  full re-baseline so that v1.8.9 truth is preserved instead of overwritten.)*
  </details>

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

- ⚠ **D-ART-139 — THE SHADOW SENTINEL COULD NOT SEE THE TABLE THAT SHADOWS EVERYTHING
  (wave 42).** `overridecheck` has carried a SHADOWED ROUTES check since wave 9. It ran green
  all session while **28 species** shipped keyed in both `CANON` and a lower table — every
  lower row a dead painter, several *disagreeing* with the live one (Reindeer Lichen's dead
  row drew a bracket shelf against CANON's lichen mat). Two independent bugs stacked:
  its table-name filter matched `NAME|ICONIC|DUPES|SPEC` and not `CANON`; and its declaration
  matcher used `[^=]*?` for the type annotation, which **cannot cross the `=>`** in
  `Record<string, (c,g,p) => void>`. **Fixing either alone leaves it green.**
  ★ **A gate that has never seen its highest-priority input has never run.** When a check
  enumerates "all tables", verify the enumeration against the source of truth, not against
  the check's own success.
  Gate armed and negative-controlled: re-introducing a shadowed row exits 1, clean exits 0.
  The proof the deletions were safe is **zero Earth drift across 1,250 assets** — a dead row
  removed changes nothing; a live one would have swapped its species' painter.

- ⚠ **D-ART-140 — SUSPECT A NEW SCAN BEFORE YOU SUSPECT THE CODE (wave 42).** Four times in
  one day an instrument lied before the source did: a discarded-path detector reported nine
  dead paths (it started scanning at `i+1` and missed every single-line
  `beginPath(); …; stroke();` — true count zero); an inert-option scan reported all 32
  declared fields unread (shell escaping had mangled its regex — true count one); and
  widening `overridecheck` introduced two false positives of its own before it found anything
  real. Every genuine finding in wave 42 was confirmed by reading the code.
  ★ **A suspiciously large finding count is a bug report about the instrument.** This project
  has now recorded that lesson six times; it keeps arriving because a new scan is always
  written by someone who has just convinced themselves the defect is widespread.

- ⚠ **D-ART-141 — ON A DARK ANIMAL, THE ONLY LIGHT ELEMENT IS STRUCTURAL (waves 38–41).**
  Three separate fixes were right about the defect and wrong about the remedy, all in the same
  direction, all caught by artlock: deleting the primate torso wash (a fixed cream over an
  arbitrary hue genuinely *is* a stain) took confusable 1007 → 1018 with the Aye-Aye in seven
  of eleven new pairs; giving the corvids their true near-black bills took 1003 → 1016 with
  Raven in six of fifteen. **Removing a light element for accuracy costs more legibility than
  the accuracy buys, unless the contrast is replaced.** A subtraction that improves fidelity
  and deletes the last tonal separation is a regression, and the fingerprint says so before a
  human notices.

- ✅ **D-ART-142 — A POSE IS AN AXIS, NOT A PAINTER (wave 40).** Meerkat's sentinel stance,
  the sloth's hang and the woodpecker's trunk cling were filed twice as needing "a different
  body-axis construction, not a parameter" — their own arc. Correct diagnosis, wrong cost:
  since wave 4 the body is a SOLID built from an axis path, and the Tube, silhouette, coat,
  material, countershading and rim light **all derive from `AX(u)`**. Re-orienting the axis
  re-poses every one of them and none needs to know a pose exists. Verified: exactly **three**
  of 1,250 assets moved.
  ★ **Whether a shape can be re-posed cheaply depends on whether it was built as a SOLID or
  as an OUTLINE.** The same session's elephant ear — a hand-drawn outline — could not be moved
  at all and cost three reverted attempts (see the G9 note in `reference/GOLD_PASS_2026-08-03.md`).
  Wave 4's investment is what paid for wave 40. The remaining hand-drawn outlines (the
  elephant fan, the cobra hood) are where the next posture request will hurt.

- ⚠ **D-ART-143 — A UNIFORM CHOOSER OVER CONSTANT PAINTERS IS STILL A MONO-TEMPLATE (wave 46).**
  The platinum audit said every procedural fungus was "a variation of the same cap-and-stem
  trio." Wave 20 diagnosed the SELECTOR — `form % 6` clumped, so half a sample came back
  puffballs — avalanched the seed, proved the spread flat with a test that calls the real
  selector, and closed it. **Nobody asked whether the families it now picks so evenly can draw
  more than one thing.** Wave 46 counted the rng calls in all 26 family painters: **seven draw
  a fixed or near-fixed picture.** `fungiMorel` made zero. `tardigrade` made one and carried a
  `void r;` at its end — the generator was created, explicitly discarded, and the discard was
  ACKNOWLEDGED in the source.
  ★ Fixing the picker moved the failure without reducing it: the sameness was distributed
  evenly instead of clumped, which is exactly what "fixed" looks like from the selector's side.
  The measurement that would have caught it existed the whole time — artlock's own `dist()`
  over the fingerprints it already stores. Run against the two sheets it gives:
  **procedural 240 assets / 19 pairs under HARD 0.6 (seven at 0.00, byte-identical); Earth
  1,010 assets / 0 pairs.** The gate never said so because `[SAME]` is Earth-only *by design* —
  a deliberate scope limit that quietly became a blind spot once procedural stopped being
  throwaway filler.
  ★ **The general form: when a pipeline is DISTRIBUTION over GENERATORS, a fix to the
  distribution proves nothing about the generators.** Measure the output, not the stage you
  changed — and when a subsystem is exempt from a ratchet, re-ask periodically whether the
  reason still holds.

- ⚠ **D-ART-144 — VERIFY THE SCANNER THAT DRAWS A CATEGORY BOUNDARY, ESPECIALLY WHEN THE
  CATEGORY MEANS "DO NOT TOUCH" (wave 47).** Sizing the gold pass by painter class showed 15
  assets in `verbatim-*` — the class the art lock forbids anyone to move — and 13 of them were
  FAILs. Thirteen defects that could not legally be fixed. **All fifteen were misclassified.**
  Every one routes to a painter we own; `artclass.mjs` simply could not see them, for THREE
  independent reasons, each a different *surface form of the same key*: packed object rows
  (`^ {2}'…':` anchors to a line start, so it read the first key of a multi-entry line and none
  of the rest), a U+2019 apostrophe where the route table writes U+0027, and the array route
  lists — which sat on the line directly below the object-key scan and carried BOTH the same
  faults. That file's header now records **six** surface-form bugs in one scanner.
  ★ **A category that means "exempt" is where defects go to die**, because nobody re-examines
  the membership test — they just skip the members. Audit the boundary itself on a schedule.
  ★★ **AND THE OBVIOUS FIX WAS WORSE THAN THE BUG.** Matching any quoted string before a comma
  swept in 110 non-species strings — rgb triples, comment fragments, template pieces — and
  because the map is first-wins it MOVED EIGHT REAL SPECIES into another painter's class
  (Bear, Koala, Humpback Whale, Cuttlefish…). **A classifier that mislabels is worse than one
  that under-reports**: an under-reporting classifier blocks a fix loudly, a mislabelling one
  green-lights drift under the wrong heading, silently. Scoping to `SCREAMING_CASE: string[]`
  array literals still wasn't enough — `FLORA_DUPES` opens with a comment naming three species
  it had REMOVED, so the scan read them back in and re-routed all three to the painter the
  comment says they left. **Strip comments before reading a block: a scanner that reads prose
  will eventually believe it.**
  ★★★ Only a **both-directions** negative control caught any of this — asserting not just that
  routed species stop classing verbatim, but that a name in NO table still DOES. The one-way
  check passed on the first, broken attempt.

- ⚠ **D-ART-145 — A DEAD *VALUE* HIDES EXACTLY AS WELL AS A DEAD FIELD (wave 48).**
  `speccheck` (D-ART-100) asks "is this FIELD ever read?" and the whole catalogue answers yes.
  One level down, `bill:'stout'` was in the `BillKind` union, written by **21 bird rows**, and
  compared by **no branch anywhere** — so Crow, Raven, Magpie, Jay, Gull, Penguin, Auk, Puffin,
  Flamingo, the gamebirds and the ratites all fell through to a generic thin triangle. Four of
  those rows name the bill as a *mustRead*. TypeScript accepted it, the gate was green, and only
  the render knew. **New gate `tools/tokencheck.mjs`**: for every string token a table writes,
  does any painter compare that value? Two tiers — DEAD (compared nowhere) and ALIAS (compared
  only under another field, which family-default merges do legitimately).
  ★★ **The gate was wrong three times before it was right, each time plausibly:** it pooled
  values globally (so fixing `bill:'stout'` also declared the unrelated `stem:'stout'` alive —
  crediting a fix to a field nobody touched, which *retires a suspect no one looked at*); then
  scoped by the identifier left of `===`, which marked every snake pattern, material and pupil
  dead because painters rename (`const pat = opts.pattern`; `spec.mat` arrives in `skin.ts` as
  `kind`); then still tripped because `kind` is itself a table field elsewhere. **A name may
  narrow a comparison only on PROVEN provenance — a `spec.`-qualified read or a recorded local
  alias. Coincidence of naming is not provenance.**

- ⚠ **D-ART-146 — A REPORT THAT CANNOT DISTINGUISH SAFETY FROM DISASTER IS NOT A REPORT (wave 48).**
  `artlock --bless="Crow,…"` over 22 names printed **"BLESSED 1250 assets"**, because it counted
  `lock.fp` *after* the edit instead of the entries it wrote. A tightly-scoped bless and a
  catastrophic whole-catalogue bless printed the **same line** — in the one file in this tree
  where that distinction *is* the safety property. It prints count + scope now, controlled in
  both directions. ★ And the way it was caught is the lesson: the claim was checked **against
  the git copy of the lock** (21 fingerprints actually changed), not against the tool's own
  summary. **Never verify an instrument with the instrument.**

- ⚠⚠ **D-ART-147 — A PER-ASSET HARNESS CANNOT SEE A CROSS-ASSET DEFECT, AND ALPHABETICAL
  BATCHING GUARANTEES IT WON'T (wave 49).** Gold pass 2 judged all 1,250 in packets of 10 and
  returned 431 FAILs — and **missed the largest defect in the catalogue**, which Nick's engine
  found immediately: **twelve canids are one animal in twelve colours, and it is a pony**;
  twelve felids are that chassis with spots (the Tiger is a striped pony, the Lion is that pony
  wearing a mane). My pass graded most of them POLISH; one judge called African Wild Dog "a lean
  blotched dog". **The cause is batching.** I ordered the packets alphabetically, so no family
  ever appeared together, and a judge shown one Tiger against "orange with black stripes, heavy
  build" ticks stripes, ticks orange, and lands on POLISH. `GOLD_PASS_2026-08-03` §2 already
  said systemic clusters *"are only visible because everything was judged in one sitting"* —
  and the re-measure destroyed exactly that signal by construction. **Batch by FAMILY.**
  Corollary: 431 correct per-asset verdicts did not sum to the one finding that mattered most.

- ⚠⚠ **D-ART-148 — A METRIC BLIND TO A DEFECT CLASS PRINTS THE SAME ZERO WHETHER THE CLASS IS
  ABSENT OR INVISIBLE (wave 49).** artlock's `[SAME]` measures a 16×16 **RGB** grid, so hue
  separates two species built from one construction. It printed **"0 pairs under HARD 0.6"**
  while an independent silhouette metric measured **Flounder ≈ Halibut at 1.0000** — verified on
  the render as *the same bristly tan egg with a face*. Also Ice Algae ≈ Snow Algae (0.00),
  Hawk ≈ Falcon (0.06), Sea Lettuce ≈ Green Algae (0.12), Duck ≈ Eider Duck.
  ★ The gold pass **had already written down why the zero was worthless** — *"the ratchet misses
  this because colour separates them; the gate measures pictures, not construction"* — and I
  still quoted the zero twice as a result. **A documented blind spot is not a mitigated one.**
  Fixed by the new `[SHAPE]` tier: colour-blind, reported-not-gated (D-ART-97 — never gate an
  uncalibrated threshold), 100 pairs under 2.0 in `shapepairs.json`.

- ⚠ **D-ART-149 — ESTABLISH THE MODEL WITH A TINT BEFORE YOU TOUCH A PARAMETER (wave 49,
  the method that finally worked).** Facing the pony chassis, the temptation was to adjust
  `crouch`/`cannon`/leg numbers. Instead: **limb tube flat blue, foot flat red, rendered across
  felid / canid / equid / ursid.** It showed in one image what the arithmetic never gave up —
  **the body occludes the entire upper limb; only the lower ~35% of each leg is visible, and
  that section is a straight vertical tube in every family.** Every `crouch` fold happens
  *inside the silhouette*. Worse, it is inverted: `kneeY = 0.70 − crouch·0.34` puts a cat's knee
  at 38% of the way down and a horse's at 63%, so the more crouched the family, the more of its
  fold hides. A trial fix (knee lowered) changed almost nothing and was **reverted rather than
  kept as churn** — occlusion, not joint height, is the binding constraint.
  ★ What shipped instead was the one part the body does *not* occlude: the paw. It had three
  faults, and the third had been inverting the read the whole time D-ART-133 recorded it as
  merely "low contrast" — **the toes were painted LIGHTER than the pad**, so the shape that says
  "toes, not a hoof" read as a highlight on the tip, which is what a fetlock looks like.
  **Scope honestly: the feet are fixed, the chassis is not.** Shipping a speculative
  multi-parameter sweep over 140 mammals is the "global pass wearing an anatomy argument"
  D-ART-83 was paid for.

- ⚠ **D-ART-150 — TWO PASSES ARE NOT COMPARABLE UNTIL AN UNTOUCHED CONTROL SAYS SO (wave 49).**
  Gold pass 2 measured 431 FAIL against a stale 473 and the obvious headline was "−42, we
  improved". **It is an artefact.** The control was already in the data: waves 35–47 touched no
  flora, no microbes, no procedural, and **both untouched sets got worse** (flora +6.3 points of
  FAIL rate, procedural +4.6) — a yardstick that did not move leaves those flat. Confirming it,
  **only 14 of 99 old PASSes survived**: a build that only improved cannot demote 85% of its own
  passes. **Quote a delta only after an untouched slice has certified the ruler.** What survives
  the correction is still real: fauna 277 → 198 where the work actually happened.

- ⚠ **D-ART-151 — A SCANNER THAT READS PROSE WILL EVENTUALLY BELIEVE IT — SECOND FILE, SAME
  BUG (wave 50).** D-ART-144 recorded this for `artclass` (a comment claiming routes had moved
  fooled the classifier). It recurred in `artaudit`: `faunaFlatfish` grew a doc comment **inside
  its parameter list** containing the word *"named"*, so the matcher
  `/export function (\w+)\s*\(([^)]*name[^)]*)\)/` saw `name` among the params and **failed the
  build reporting a painter that ignores an argument it does not have.** The rule is now
  comment-stripped on **both** sides — the params (does it really take `name`?) and the body
  (does it really never use it?) — and negative-controlled in both directions: clean on the real
  tree, still fires on a deliberately injected offender.
  ★ Two habits, not one: **strip comments in every scanner**, and **keep painter docs above the
  signature, never inside the parameter list.** A law recorded once for one file does not
  protect the next file; it has to be applied.

- ★ **D-ART-152 — AN ASYMMETRIC MASS CANNOT BE AUTHORED THROUGH A SYMMETRIC PROFILE (wave 51).**
  The chassis brief said the fix must change what is VISIBLE: body depth, topline, where the
  limb leaves the silhouette, and the skull. A haunch and an upper-arm lobe were added to
  `ventral()` in `quadrupedoverrides.ts` — `+0.20·rumpF` at u 0.19, `+0.11·muscleF` at u 0.83 —
  they typechecked, they rendered, they changed the bytes, and **they changed almost nothing you
  could see.** The reason is structural and worth more than the attempt: `ventral`/`dorsal` are
  not an outline. They feed `RAD = (ventral − dorsal)/2` and an AXIS at their midpoint, and
  `Tube` sweeps **one scalar radius** — a circular cross-section (torso.ts). So every unit the
  belly is pushed down raises the back by half and grows the radius by half; the rear simply got
  rounder. **A thigh is asymmetric and is therefore inexpressible in this parameterisation.**
  ★ So the haunch is a **torso-engine** item, not a table item — `Tube` needs a radius varying
  with phi as well as u. Do not retry it by tuning coefficients. Same shape as D-ART-149: the
  knee was lowered, rendered, reverted, because occlusion and not joint height was binding. The
  revert here was confirmed **byte-identical** to the pre-attempt render, which is what makes it
  a measurement rather than a guess.

- ★ **D-ART-153 — THE PONY WAS A HARD-CODED NECK ANGLE, AND NOTHING OCCLUDED IT (wave 51).**
  Twelve canids and thirteen felids read as one pony. Two audits, 431 per-asset verdicts and a
  tint render had all gone looking for it in the LIMB — the part the body occludes, where every
  fix so far has been invisible. It was one line:
  `headX = shoulderX + neckLen*0.55, headY = shoulderY − neckLen*0.86` — **a fixed 57° up-and-
  forward neck for every mammal in the catalogue**, i.e. a browsing ungulate's carriage worn by
  every cat, dog and bear. It is the first thing anyone reads and nothing covers it.
  Now `carry` on the family plan, expressed as a swing of the same-length vector so `carry: 1`
  reproduces the old point exactly and every family left at 1 is byte-unchanged (D-ART-14).
  ⚠ **And the first values were too aggressive, exactly the D-ART-141 shape:** right about the
  defect, wrong about the remedy. At carry ≈ 0.02–0.05 the neck leaves the silhouette entirely
  and a long-bodied mammal becomes a featureless tube — artlock returned **7 newly confusable
  pairs (Mole ≈ Mudminnow, Stoat ≈ River Otter, Coati ≈ Civet)**. Raising the floor to 0.22–0.32
  and returning `procyonid`/`burrower` (never part of the pony complaint) to 1 gave **0 newly
  confusable and a net 884 → 882.** The gate found this; no amount of looking at cats would have.

- ★ **D-ART-154 — THE FIX FOR D-ART-152 WAS AN ENGINE CHANGE, AND IT COST NOTHING TO PROVE
  (wave 52).** D-ART-152 recorded that a haunch is inexpressible in `ventral()` because `Tube`
  sweeps ONE SCALAR RADIUS — a circular cross-section — so every unit the belly is pushed down
  raises the back by half. The fix is `TubeSpec.Rv`, an optional **ventral** half-thickness;
  the cross-section becomes two profiles blended around the girth, and `envelope` rides the
  profile *and taper* belonging to its own side.
  ★ **What makes this safe is the reduction.** Every generalised expression collapses to the
  old one when `Rv` is omitted: `r = (rd+rv)/2` is `(x+x)/2`, which IEEE754 returns as exactly
  `x`; the blend weight `w` multiplies `(rd−rv) = 0`; `kd = kv = k`. The taper expression was
  deliberately left un-simplified so the float rounds identically, and `kk*kk` replaced `kk**2`
  because exponentiation is not guaranteed to round like a multiply. **So the refactor was
  landed and rendered with nothing supplying `Rv`, and artlock reported ZERO drift on all
  1,245 stable assets.** A geometry change to the solid every organism is built from, proven
  inert before it was given a single thing to do. That is the negative control this project
  keeps paying for the absence of — build the capability, prove it changes nothing, *then*
  use it.
  ⚠ And the payoff immediately tripped the other gate honestly: the haunch put **Wildcat ≈ Cat
  at 1.41**. The answer was NOT a smaller haunch. Their reference rows already said how they
  differ — "sturdy build heavier than a house cat", "broad head", "thick blunt-ended tail with
  dark rings and **a black tip**" — and the spec row carried no `tailTip`, no `jaw`, and a
  leg/depth ratio (1.09) barely distinct from Cat's (1.07). Deriving each from its own row
  (D-ART-83) put it back to **0 newly confusable**. A gate that fires on a good change is
  usually naming the NEXT piece of work, not rejecting the change.
  ★ `artlock --which` now names the drifted assets inside a DECLARED class too. It only ever
  printed them for undeclared ones, so the only way to know what to look at before blessing was
  to guess from the spec tables — and a bless is a claim that a person looked (D-ART-146).

- ★ **D-ART-155 — TWO PLACES BUILT THE SAME NAME FROM DIFFERENT RULES, SO EVERY HUMAN-FACING
  LOOK AT A PROCEDURAL ASSET SHOWED THE WRONG CREATURE (wave 55).** `audit.ts` derives the
  procedural genome twice. The EXPORT that writes `procedural/fauna-h1-s3.png` uses
  `hashInt(0xF00D, ki*100 + heat*25 + s, 7)`. The `proc:<kingdom>:h<heat>:s<seed>` form — the
  one `speciesstrip` accepts, i.e. **the only way a person can point an eyeball at a procedural
  asset** — used `hashInt(0xF00D, s, 7)`, dropping kingdom and heat from the hash entirely.
  The two agree **only when ki = 0 AND heat = 0** (fauna/h0) and disagree for the other ~230.
  So `proc:fauna:h1:s3` rendered a red many-legged creature while the file everyone was judging
  was a headless fish. Every procedural diagnosis made by looking is suspect, including this
  handoff's own "it is the FIT/framing pass, not the painter".
  ★ It is the join family again (D-ART-147): **two sites computing one identifier by different
  rules, silently, both looking correct.** The rule generalises — *if a name is built in more
  than one place, one of them is wrong; derive it once.*
  ⚠ And the fix appeared to do nothing, twice, because **`speciesstrip` reused a stale `dist`**:
  its build lock let a cached bundle serve a changed source. `rm -rf apps/game/dist` before
  believing a render that contradicts a source change.
  ★ What the corrected render actually shows: `fauna-h1-s3` is **centred and fills the frame**,
  so it is NOT a clip and NOT a framing failure. The fit pass did its job. The head is simply
  absent from the drawing. The remaining defect is in the painter and is still open.

- ★ **D-ART-156 — A MINIMUM EXPRESSED IN PIXELS IS ERASED BY THE FIT PASS (wave 55).**
  `fishBody`'s eye radius was `Math.max(4, depth * 0.18)`. Everything is drawn on the oversized
  INK layer and then scaled down by `fitInk`, so a floor in raw px is a floor **on the wrong
  canvas**: a long shallow fish clamps to exactly 4, then shrinks with everything else until the
  eye is a pixel and the head reads blank. D-ART-34 already said the fit pass erases absolute
  size and every painter follows it for dimensions — but a `Math.max` FLOOR is an absolute size
  too, and nobody had read it that way. Now a ratio of `len`.
  ★ The blast radius proves the diagnosis: **zero Earth fish moved** and only 16 procedural
  assets did, because the floor only ever bound on the shallow procedural bodies.

- ★ **D-ART-157 — A DISCOVERY INSTRUMENT IS NOT A MEASUREMENT INSTRUMENT; SCOPE A RE-CHECK TO
  DRIFT (wave 57).** The full family sweep — 197 family batches judged, then a ~670-agent
  adversarial verify pass — cost **~15M subagent tokens and 867 agents**, and it hit the session
  or weekly limit on EVERY run (three deaths this session, one that errored all 196 launched
  agents at once). It was the right instrument exactly ONCE: to find the shared-chassis defect
  that alphabetical batching hid (D-ART-147). Re-running it to answer "did the last edits move
  the needle" is paying a discovery price for a measurement, and it is why we kept running out
  of budget.
  ★ **The measurement is cheap because most of the catalogue did not move.** artlock's
  fingerprint already says exactly which assets changed since the last judged baseline — for
  free, no model — and **an asset whose pixels are byte-identical cannot have a different
  verdict.** After waves 51–56, only **148 of 1,250** had moved, so 1,102 verdicts carry
  forward untouched. Three levers, none of which spend a model token to decide scope:
    1. **Scope to drift** (`reference/drift-since-baseline.json`, computed by diffing the lock).
    2. **One contact sheet per family, not 14 image reads** (`tools/rejudgecards.mjs` → 32
       strips). Images dominate the bill; a judge now reads 32 images, not ~2,758.
    3. **Drop the standalone adversarial verify pass** for a progress delta — it doubled the
       cost to overturn ~1.5% of verdicts. The judge self-checks in one pass. Keep the full
       adversarial pass ONLY for a final certification.
  `tools/rejudgemerge.mjs` folds the ~148 fresh verdicts into the carried baseline and prints
  the delta. Net: **~15M tokens → a few hundred K, ~30–50x**, inside the limits.
  ⚠ **And a process rule the expensive runs paid for: FREEZE THE ART DURING A JUDGE RUN.** The
  gold-pass-3 baseline was smeared because judging and editing overlapped for hours — early
  batches judged pre-wave-51 art, late batches judged post-wave-56 art, so no single asset's
  verdict could be trusted as "before" or "after". A judge run must see one frozen render:
  export once, judge once, do not touch a painter until it finishes. The cheap re-check makes
  this trivial because a run is minutes, not hours.

- ★★ **D-ART-158 — SCOPING A RE-CHECK TO DRIFT DELETES THE CONTROL GROUP. THE SAVING IS REAL;
  THE NUMBER IS NOT, UNTIL A SLICE NOBODY EDITED HAS BEEN JUDGED BY THE SAME JUDGE.**
  The wave-57 cheap re-check ran exactly as designed — 148 drifted assets, 32 strips, 1.17M
  tokens against the full sweep's ~15M — and reported **FAIL 660 → 694**, with **40 of its 44
  band crossings running one way** (POLISH → FAIL) on assets six waves had just been spent
  improving. That one-directional shape is the D-ART-150 signature, and D-ART-150 had already
  fired twice. The trap is structural and it is *caused by the optimisation*: **drift-scoping
  means every asset judged is one we edited, so a harsher judge and a real regression produce
  the identical number, and nothing inside the run can tell them apart.** D-ART-150 was caught
  both previous times by looking at a set nobody had touched — precisely the set a drift scope
  removes.
  ★ **The control, and it cost 0.72M:** `tools/rejudgecontrol.mjs` samples assets whose pixels
  did NOT change, **family-matched to the drift set** (same families, so family difficulty and
  strip composition cannot explain a difference), deterministically (evenly spaced over a sorted
  pool — no rng, so the sample is re-derivable), and puts them through the identical judge.
  Result: **drift +23.0 points of FAIL, control +23.2.** Corrected for the ceiling (an asset
  already at FAIL cannot fall further, so rate only the ones with somewhere to go): **demoted
  70% of the edited versus 78% of the untouched.** Net **−8 points, i.e. zero.**
  **Waves 51–56 moved no band. The entire +34 was the ruler.**
  ★ Three harness changes all push the same way and together are worth ~23 points: one pass
  instead of two, a side-by-side contact strip instead of 14 isolated PNGs, and an explicit
  "be your own skeptic, there is no verify pass" instruction. None was wrong; measuring across
  them was.
  ⚠ **And the merged file is a MIXED RULER** — 148 rows on the new harness, 1,102 carried from
  the old. Its total is a chimera, so `rejudgemerge` now writes that warning into the JSON
  itself, prints the control-corrected demotion rates instead of a headline, and **refuses to
  present a delta at all when no `--control` is supplied.** A tool that can print an
  uninterpretable number will eventually have it quoted (this is the D-ART-139 shape: a check
  nobody can act on is not a check).
  ★ The payoff: with the offset now *measured*, gold pass 4 is a legitimate baseline for the
  NEXT delta — same harness, apples to apples — **provided the control is re-run every time.**
  ★ What survives a moved ruler is what has always survived one: **the per-asset prose.** It
  named two catalogue-wide defects this run, both then confirmed by opening the strip and
  looking (D-ART-88): the felid chassis is *not* fixed ("pixel-for-pixel the Jaguar cell in a
  paler tan"), and every flora inflorescence is an ornament stuck on the stem apex rather than a
  structure with size. See `reference/GOLD_PASS_4.md`.

- ★★ **D-ART-159 — A MARK DRAWN INSIDE A SURFACE-CONSTRUCTION LOOP IS ERASED BY THE SURFACE
  ITSELF when the surface's stroke width exceeds the loop's sample spacing.** (2026-08-08,
  the snake pattern post-pass.) Every reptSnake dorsal mark was stamped per-segment inside
  the coil loop; the NEXT segment's body stroke (w·1.86, far wider than the spacing) painted
  over it immediately. The Garter Snake's stripe — recorded as FIXED in wave 38 — had shipped
  invisible for thirty waves; the Anaconda's ovals likewise. Nothing in review catches this:
  the code that draws the mark is present, correct, and runs. **Only a render is a witness.**
  Fix shape: draw identity marks in a POST-PASS after the surface completes (back-to-front so
  near geometry wins the overlap). Corollary for every painter with a densely-stroked body:
  if a mark matters, it goes after the body, not inside it.
- ★★ **D-ART-160 — AT CATALOGUE SCALE A VALUE-BASED SIGNATURE COLLAPSES INTO THE NEIGHBOURING
  FAMILY'S READ; ONLY SHAPE SURVIVES THE SHRINK.** (2026-08-08, the feline base.) Wave 49's
  paw was correct in close-up — dark pad, darker toes, creases — but at card size the values
  fuse into one dark cap, and a dark cap on the end of a pale leg IS a hoof. Nick's gold audit
  filed nine small cats as "hoof-like feet" with that paw live. Second half, same law: limb
  countershading pales the BOTTOM of a vertical leg, which is the ungulate pale-cannon cue
  painted onto every paw family. The fix reads by SHAPE (a fan WIDER than the ankle, toe lobes
  breaking the front silhouette, claw ticks) with value shifts kept mild, and paw families keep
  coat tone down the limb. **Design a signature at the size it ships, not the size you draw it.**
- ★★ **D-ART-161 — AN AXIS CAN BE TRUE IN THE TABLE AND NEVER DRAW, GATED OFF BY A SIBLING
  AXIS.** (2026-08-08, the eagles.) `talons: true` sat on Eagle and Harpy Eagle for waves —
  and `wings: 'soaring'` skips the entire leg loop, so not one talon was ever painted. This is
  the D-ART-100/145 family's third shape: not a field never read, not a value no branch
  compares — a feature whose draw site is UNREACHABLE for exactly the rows that set it,
  because a pose gate runs first. speccheck/tokencheck are structurally blind to it (the field
  IS read, on other rows). When an axis gates a whole draw path, list what it suppresses in
  the axis's own doc comment, and when a judge says a set feature is absent, CHECK THE GATE
  before checking the drawing.

- ★★★ **D-ART-162 — ONE PROCEDURAL CREATURE HAD THREE VALID NAMES, AND PASSING THE WRONG ONE
  PRODUCED A SUCCESSFUL SCREENSHOT OF NO ART.** (2026-08-09, GP7.) The baseline called one
  creature `fauna-h0-s1`, artlock called it `f0·1#1`, and the renderer accepted only
  `proc:fauna:h0:s1`. `rejudgecards` passed the drift spelling directly to the renderer; strips
  11–15 completed with labels and red frames but **57 cells never painted**, yielding a bogus
  57/57 FAIL. This is D-ART-155 one layer later: even after the genome formula is unified, the
  systems around it can still disagree on identity. `proceduralnames.mjs` is now the single
  checked 240-row bridge among full, drift and render namespaces, proves the mapping is a
  bijection, and rejects an unmapped identity. The strip instrument proves both directions: a
  known Earth/procedural pair MUST paint and an intentional unknown MUST fail. Re-rendered current
  pixels were **57/57 PASS**. **A process exit and a labelled frame do not prove the requested
  subject rendered; the instrument must assert the painted result.**

- ★★★ **D-ART-163 — A PARTIAL MERGE CAN SILENTLY DROP EVERY FRESH ROW AND STILL RETURN THE
  EXPECTED TOTAL.** (2026-08-09, the same procedural incident.) The old merger iterated the
  1,250-row baseline and used the old row whenever no fresh `species` string joined. Because the
  57 procedural verdicts arrived in another namespace, they disappeared into carry; the output
  still contained exactly 1,250 rows and therefore looked complete. Row count checked the OUTPUT,
  not the promised INPUT. The drift manifest is now the authority: canonicalize first, require one
  fresh verdict for every drift identity, reject unknown/duplicate fresh identities, and fail if
  even one changed asset would remain stale. **In an incremental merge, “not supplied” and
  “unchanged” are different states; only the producer of the scope may authorize carry.**

- ★★ **D-ART-164 — BUILD FRESHNESS MUST INCLUDE THE APP CONSUMER, NOT JUST THE PACKAGE THAT
  DRAWS.** (2026-08-09, strip negative control.) `speciesstrip` watched `packages/` while the
  query parser and result contract it exercised lived in `apps/game/src/audit.ts`. An `audit.ts`
  change could therefore run against a fresh-looking but stale `dist/audit.html`; the new invalid-
  identity negative control then passed for exactly the wrong reason, testing yesterday's bundle
  rather than today's rejection path. Freshness now takes the newest timestamp across both the app
  source and packages under the existing build lock. **The dependency boundary belongs to the
  built artifact, not to the file the caller happened to edit.** A negative control is not evidence
  until the harness also proves it loaded the intended build.

- ★★ **D-ART-165 — CALIBRATED CONTROLS SAY WHETHER THE RULER MOVED; MUST-READ MORPHOLOGY SAYS
  WHAT TO DRAW.** (2026-08-09, GP7 final measure.) The strict judge demoted **39%** of edited
  rows that had room to fall, but **66%** of family-matched byte-unchanged controls: **−27 points
  net of the ruler**. Therefore GP7's 301/37/165 fresh tally is a demanding defect inventory, and
  the mixed 618/415/217 ledger is explicitly NOT a catalogue score (D-ART-158). What remains
  actionable after calibration is the row's visible must-read: broad ribbon blades/stipes/holdfast
  moved Kelp to PASS; the four final felids gained their requested tails, ruffs, paws, stripes and
  rosettes but correctly remain POLISH for named finish defects. **Do not chase a band total. Use
  matched controls to interpret the judge, then change only the morphology described by evidence.**

- ★★ **D-ART-166 — A TARGETED MORPHOLOGY FIX ON A SHADOWED ROUTE IS NO FIX AT ALL.**
  (2026-08-09, GP7 flora cleanup.) Six late flora routes were dead or shadowed by an earlier
  winning table. Leaving them in place made the source appear to contain species-specific work
  that dispatch could never reach—the exact D-ART-28/139 failure shape. They were removed;
  `overridecheck` now reports **1,014/1,014 live routes and 0 dead**, with its shadow controls
  green. Before accepting a named fix, prove which route wins, render that exact target, and inspect
  its artlock blast radius. Before deleting a suspected dead route, use the same render/lock proof
  to show that it owns no pixels. **Dead corrective code is worse than absent code because it can
  close a review item without changing the image.**

- ★★★ **D-ART-167 — A COMPLETE LEDGER PROVES PROVENANCE, NOT PIXELS.** (2026-08-09,
  GP7.1 strict-conformity recheck.) A manifest, 1,250 rows, hashes, and exact joins can prove
  that a review record is internally coherent while carrying **zero rendered portraits or review
  strips**. It cannot prove current morphology, and a byte-unchanged carried verdict cannot be
  promoted to a fresh visual PASS. Literal certification now requires the current 1,250 rendered
  images, the review strips, a dated fresh strict ledger, and the provenance manifest together;
  the guard must fail closed when any row is carried or non-PASS. See
  `reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md`.

- ★★★ **D-ART-168 — A VERDICT WITHOUT THE PORTRAIT AND STRIP HASHES IS A COMMENT,
  NOT REVIEW EVIDENCE.** (2026-08-09, GP7.1 first all-fresh pass.) The first complete fresh
  render made it possible to change a painter between the time a packet was opened and a tally
  was quoted. Names, packet numbers, and even a dated result file would still join perfectly while
  describing previous pixels. `gp71rejudge` therefore records each native portrait SHA-256 and
  packet strip SHA-256 in the preparation/index, requires both exact values in every verdict, and
  refuses collection if any one changes. A repair must create new evidence and a new review; it
  may never inherit a PASS merely because the species name is unchanged.
