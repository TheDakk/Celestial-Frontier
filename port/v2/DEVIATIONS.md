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
