# DEVIATIONS.md — the port's improvement ledger

**The rule (plan §20 Gate A): the port is BUG-FOR-BUG parity until a deviation is
approved here.** Every entry below is a place the original does something imperfect
that the port can do better — found while porting, each verified against the source
or caught by a parity instrument. Status: ☐ proposed (parity preserved today) ·
✔ approved by Nick · ★ already structurally better in the port without breaking parity.

Companion to `port/DECISIONS.md` (Nick's §23 design calls). Update IN THE SAME BATCH
as any change that touches an entry.

## Current-state decision — Arc 1A maximum Compendium (2026-08-20)

**Status: ★ product implementation, serviced-turn scheduler, compact-phone Planetside stack repair,
and active `f9710bdf…` / `e59685b1…` measured ruler present. Exact-source automation and fresh
six-image `[HUMAN]` review are open.**
This criterion remains `[EXEC-TODO]` unless the selected head's ignored exact-source artifacts and
its corresponding PR test-merge CI are terminal green; the live outcome is not cached here.
This block records the current disposition of the historical
`D-COMPENDIUM-MEM` proposal below without rewriting that dated discovery record.

- The maximum 1,500-row Compendium now uses spacer-preserved virtual rows, pinned keyboard focus,
  native filter/clear, detail/Back and Close cleanup. Real 132px leases own one bounded producer,
  queued cancellation, dedupe, disposal, cold-error publication/recovery, and Planetside
  hide/release/reacquire; list work does not route through the renderer's 440px compatibility
  facade. After complete app wiring, every default broker pump waits for a rendering opportunity
  and then a later task before dispatch. At most one serial dedicated module worker at a time owns
  painter import, 440px scratch paint, 132px downsample, and PNG encoding. It has no synchronous
  renderer fallback and terminates after active work settles and its queue is empty; a later
  genuinely new producer burst owns a fresh instance/import. Exact document/producer/instance/job/
  phase evidence is retained. Capability/import/protocol/worker fatal paths settle active plus
  queued owners once without automatic retry; paint and content-specific encode failures remain
  per-job. Detail owns an asynchronous 440px request through the same broker. A generation token
  invalidates an armed pump across bfcache suspension or final disposal; resume owns a fresh serviced
  turn.
- The prior exact-3844701/e4e8d1d observations remain historical calibration evidence, not active
  current authority. Exact committed repair `dea03913014bc58134ebb06ca5b36892210a7571`
  passed all 12 Glass rows; its following exact Compendium run
  `20260817150005919-93781-b6643ba7a6` truthfully reports 75/76, solely red at
  `desktop/warm-plateau`. That red proves neither a leak nor a clean product plateau: the old
  sequence destructively trimmed the desktop cache before warming and then measured refill, while
  its heap ruler omitted embedder/backing ownership.
- The da0 ruler embedded exact paired run
  `20260820-arc1a-baseline3-21af3fa`, collected by `21af3fa2…` against legacy product `3844701…`,
  plus independent one-attempt candidate2/3/4 runs from clean committed `21af3fa2…`
  collector/product source that bind producer `291b794e…`. All share measurement authority
  `bb03a3af…` and isolated Edge 151.0.4129.86. The repaired seam moves cap control after
  full native warm-cache observation; records used, embedder, backing-store, and aggregate heap;
  proves stable unique keys plus unchanged job/disposal/worker counters across the last three cycles
  of one retained window; embeds replayable raw capsules; and binds the complete measurement inputs
  plus exact built owner-to-worker-to-painter graph. Strict ceilings exceed all three candidate
  maxima; the paired baseline preserves four sealed faults and breaches 14 phone / 13 desktop
  fields. Commit `da0de20bcd78271d6bd4a2ff2f5ca2ca5a6c55e3` locally certified that exact ruler
  once under Edge .86 and also passed its no-retry Chrome Smoke, 12-viewport Glass, persona, root
  layout, and nonpublishable preview gates.
- PR run `32334254714`, attempt 1, preserved a terminal product red without retry. Its clean detached
  test-merge `88b9c7b0aa90b860a5474bd099cfab48b125a3f5` matched Edge .86, budget bytes, and producer
  `291b794e…`; phone Planetside thumb settlement missed the unchanged 2,000 ms target bound at
  2,001.723 ms while the root heartbeat answered in 0.872 ms. The partial report did not retain an
  exact producer phase; source inspection identified zero-delay successor-pump starvation as the
  bounded repair hypothesis.
- The serviced-turn repair changes built producer authority to
  `1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2`. Clean seam commit
  `f47cd381…` collected paired baseline4 against legacy product `3844701…`; independent one-attempt
  candidate5/6/7 use `f47cd381…` product/collector source and bind producer `1c8200d7…`. All four
  share measurement `bb03a3af…` and exact Edge .86. All candidates completed 78/78 outcomes with zero retries. That
  historical `bb03a3af…` ruler replayed those raw capsules, kept all 40 ceilings strictly above the
  three-run maxima, and retained four baseline faults with 14 phone / 13 desktop breaches. The
  frozen shared-timer repair moves measurement authority to `f9710bdf…`. Paired baseline5 plus
  independent candidate8/9/10 historically activated budget/test `8ffd0d8e…` / `121ab8cd…` for
  producer `1c8200d7…`; all were one-attempt/no-retry, each candidate replayed 78/78, all 40 ceilings
  exceeded their maxima, and the four-fault baseline breached 14 phone / 13 desktop fields. Those
  raw capsules remain truthful only for that exact producer.
- Exact clean `c095500…` passed Compendium run
  `20260820-arc1a-absolute-deadline-active-cert-c095500` (report `55dba448…`) and one-attempt Smoke
  `20260820104231234-94067-7f954ca9942e` (report `6d4f00f8…`). Its first full Glass run then stopped
  without retry: Chrome 152, 12/12 rows, 58/58 controls, zero instrument failures, and one product
  `PLANETSIDE_SURFACE_OCCLUDED` finding from a 12.5px compact-phone Survey/Planetside overlap.
  Persona, layout, preview, push, and CI did not run.
- The bounded product repair derives the portrait Planetside cap from its shared bottom anchor,
  preserving a 44px Survey floor, 72px scrollable Planetside floor, and existing 8px gap. It does not
  change Glass predicates, stacking order, or ownership. The existing development-release bullet
  names the outcome. Built producer becomes `e59685b1…` (index `ca76da4c…`, owner
  `assets/main-Ccq4RHJt.js` / `9260e359…`, worker/painter unchanged), while measurement remains
  `f9710bdf…`. Clean committed source `2a105d51397eef97542d856ed3b1bb23edf2b028` collected paired
  baseline6 against legacy `3844701…` and independent candidate11/12/13 under exact Edge .86. All
  four were one-attempt/no-retry and candidates replay 78/78. Active budget/test `ebe5b5c3…` /
  `ec956b8a…` place all 40 ceilings strictly above the three-run maxima; the four-fault baseline
  breaches 14 phone / 13 desktop fields. Focused 11/11, selftest 222/222, and semantic validation
  pass. The targeted compact-phone Glass PASS (`13efb5fa…`) is diagnostic only; the complete exact-head
  battery and corresponding PR test-merge remain required for `[EXEC]`.
- This Arc-local Edge 151.0.4129.86 authority does not repin the global Gate-A Edge 150 browser.
- This is an implementation/current-instrument decision, not a terminal certification for mutable bytes,
  a human art approval, or Gate/release closure. The six phone/desktop list/detail/focus-pinned
  images from da0 are stale for the repaired producer; a fresh certifying set still requires human
  review. Arc 1B remains open for scene/Pixi textures, render targets,
  GPU proxies, and the combined travel → Compendium → Shipyard resource plateau.
- PR #32's layout deviations remain bounded. In portrait, shared bottom-anchor math preserves the
  44px Survey / 8px gap / 72px scrollable Planetside stack. In short landscape, Compendium uses the left
  safe-height workspace and recomputes its scroller from the safe viewport, while Search, dock, and
  Survey when open remain operable at right. Panel-open status already yields trail/objective; the
  short-landscape rule additionally yields only noninteractive top/context/hint chrome. Its hostile
  A++/focus/clipping Glass fixtures are instrument evidence, not a broad visual-polish or
  v1.0-parity claim.

## Species art — THE MORPHOLOGY PASS (approved by Nick 2026-08-01)

The species-art surface is the one place the verbatim-parity boundary is OPEN, under Nick's
approval after the full-catalog review (`port/ART_REVIEW_SPECIES_2026-08-01.md` +
`audits/species-audit-2026-08-01/`). Named and procedural corrections now live across the bounded
owners under `packages/art/src/` atop the verbatim engine; unmatched species stay parity-exact.
Plan + historical waves: `port/MORPHOLOGY_PASS.md`. Current reset gates are `npm run speciesaudit`
(1,250/1,250) plus `npm run overridecheck` (1,014/1,014 Earth routes, including four cross-set
duplicates).

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

- ★ **D-9i — string `maxGen` poisoning (fixed in the v2 importer, 2026-08-11).** `_sanitizeSavedGenome` clamps
  brood/fed/xp/hurt but not `gen`; `onSpeciesStored` assigns `entry.gen` raw after a
  coercing comparison, so a hostile save's `gen:'2'` lands in `stats.maxGen` and
  persists into every future save. Found by the importer parity test (the frozen
  v1.8.9 fixture still pins the string). The v2 importer now validates a finite,
  nonnegative safe integer, stores the normalized number in both the genome and
  `stats.maxGen`, and negative-controls strings, fractions, negatives, non-numbers,
  and unsafe integers. Honest numeric generations remain byte-for-byte unchanged.
- ✔ **D-SAVE-1 — a syntactically valid truncation is not a save (2026-08-11).** The lifted
  importer deliberately hardens sparse objects into defaults, which is useful for creating a new
  in-memory expedition and unsafe as proof that stored bytes may replace the last-known-good copy.
  Explicit import and boot recovery now share a plain-object, supported-version, coherent-envelope
  classifier. `{}`, `{view:null}`, primitives and arrays cannot overwrite progress; a proven backup
  wins over a corrupt primary; an unsupported future version remains byte-protected with an update
  message; and a transient IndexedDB failure releases its write hold only after a successful retry.
  The repository also clears a rejected/blocked open Promise so one startup failure cannot poison the
  whole session. Replacement import cancels/drains ordinary persistence before the proven primary
  write. Its classification and primary use trimmed JSON, but the optional local recovery keepsake
  retains the exact submitted text, including legal surrounding whitespace. File selection is
  browser-decoded to text, so the external moderator file remains the byte-for-byte authority. This is intentional exploit/data-loss hardening over
  permissive v1 behavior.
- ✔ **D-SAVE-4 — recovery proves the backup before replacing the primary; reset coverage grows
  with the store registry (2026-08-14).** The recovery copy is untrusted storage input too.
  `SaveRepository.recover` now receives the supported-envelope predicate and classifies the exact
  backup before any write. A corrupt or unsupported-future backup cannot destroy the invalid
  primary whose bytes are being protected; a supported backup still performs the one recovery,
  and a future primary never invokes it. The direct exporter contract covers all nine supported
  fixture families against the next-boot envelope predicate. Reset clears the canonical complete
  `STORES` list, and its growth control seeds and proves every current store empty.

  Test-first restoration of the old write-before-classify and partial-reset behavior failed 2/36
  focused tests; omitting one required export key failed 9/22 direct round-trip tests. The real-
  browser control independently restored the old overwrite and produced named failures for both a
  future and corrupt backup because the persisted primary no longer produced the protected boot
  outcome. With the repair restored, clean exact head `f7cf75f` passed 296 tests /1 skipped, both
  TypeScript configurations, the unused-code type gate, and full slice smoke. This closes F1a only:
  one-blob storage, revisions/CAS, multi-tab coordination, split stores, receipt transactions, real
  migration proof, and the Gate-C veteran/device human criterion remain open for F3 and the human
  gate.
- ✔ **D-SAVE-2 — intentional replacement reloads own pre-await ticker quiescence and outgoing
  renderer release (closed in exact clean executable evidence `7d9980e`, 2026-08-12).** Training restart after its reversible view
  commit, supported expedition import after its replacement-envelope commit, and the storage-
  health retry after rediscovering real bytes now share one code-owned transition. It blocks new
  ordinary persistence and synchronously stops a running outgoing ticker when the exclusive claim
  is acquired, before any persistence await. Only the exact failed/rolled-back owner may restart a
  ticker its claim stopped; invalid import bytes reject before claim without disturbing play. A
  successful transition cancels the preference debounce, removes renderer-resize listeners,
  destroys Pixi with global and child texture resources, detaches its view, and collapses both the
  application and backdrop canvases to at most 1×1 before one task boundary and `location.reload()`.
  The optional CDP binding exports those postconditions, the replacement reason and outgoing
  document token outside the dying execution context. The replacement's separate optional
  `cf-v2-slice-ready/v1` tail binding is emitted only after load, persistence, complete input/slice
  wiring, a first ticker turn, an animation frame and a later task. It is
  intentionally not a `pagehide` listener: browser-cache restoration must not revive a destroyed
  application. The diagnostic `cf-v2-import-phase/v1` stream binds the exact operation and old
  document/session/default context/loader; requires `invoked` with a running ticker and ordered
  claim/persistence/write/release stages with it stopped; and shares one absolute 20-second deadline
  that begins before the bounded non-awaiting arm. IndexedDB durability is not raced against a
  timeout. This addresses 8K renderer pressure without claiming CI
  #201 proved GPU exhaustion; that run proved only the replacement-lifecycle ambiguity described
  under D-UI-3.
  Test-battery #203 (`31602984470` / `94134750800`) later preserved a distinct
  pre-release pressure failure at exact pushed `38e4f362`: all preceding gates and
  `smoke:ci` passed, but desktop-8k reached 20,015 ms before any release/navigation/
  ready/fatal/command/event receipt; 11 other rows passed. The outgoing 5,461×3,072
  ticker was still rendering across the durable-write wait and teardown under CI
  software rendering. This is not save corruption or a reported write rejection,
  and the run is not retried or hidden by a longer deadline.
  Before the final stable battery, one smoke attempt correctly refused mixed-source evidence
  because tracked docs changed during its run (`source identity changed during slice smoke`).
  That single execution had no automatic retry and is coordination/instrument evidence, not a
  product failure. Clean exact commit `7d9980e37e60f0cec8cb840e75098872b9cc90d0`
  then passed the complete battery. Exact-source glass passed 12/12 with 52/52 controls,
  `omitted=[]`, 0 findings/instrument failures/retries and all 12 exact phase/release/ready paths
  at digest `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
  Replacement totals were 194–239 ms; desktop-8k recorded a 3 ms arm, ticker true only at
  `invoked`, 21 ms phase span, 0 ms write, 19 ms release, both 5,461×3,072 canvases →1×1,
  `performanceNow` 199.5 ms, 1 ms confirmation and 239 ms total. One-attempt smoke passed
  0 findings / 10 screenshots and all nine automated personas passed. `7d9980e` remains immutable
  prior evidence for D-SAVE-2; the later prior D-SAVE-3 evidence is `46fb627` below. The exact
  clean executable outcome closes this implementation item; human play and release authority remain
  separate.

  **2026-08-16 source extension:** the shared replacement-reason union now has five
  members: `training-restart`, `training-complete`, `training-recovery`, `save-import`,
  and `storage-retry`. Atomic Training completion and persistent Training recovery use
  the same exclusive pre-await claim/release boundary. The earlier exact clean evidence
  above remains valid for its original three paths and is not retroactive evidence for
  the two additions. D-TRAIN-1's later ignored local Slice Smoke and full Glass reports
  now cover the extended Training outcomes on dirty diagnostic inputs; exact-head and
  integration evidence remain pending.
- ✔ **D-SAVE-3 — simultaneous full-viewport resources share one budget and boot wiring owns
  ticker start (first closed in exact clean executable evidence `46fb627`, 2026-08-12).** Test-battery #204
  (`31612817092` / `94168172635`) completed once without retry at exact pushed
  `4cee7d807b8f9258e370aad31c30756269f95a96` and remains red. All earlier gates and
  `smoke:ci` passed. Desktop-8k's arm queued for 9,504 ms; import/write, 35 ms release,
  navigation, changed loader at 45 ms, load at 231 ms and FCP at 268 ms were healthy,
  then the replacement emitted no ready witness inside 20 seconds and no fatal event.
  Root cause was two independent full 16,777,216-pixel canvas allocations plus Pixi
  `autoStart` before async save/scene/slice/input wiring—not save corruption or an
  import/write/release/navigation/load/FCP failure.

  The repair gives the application and backdrop canvases one aggregate 4,096² budget,
  half each: native through 4K and 3,862×2,172 each at 8K (16,776,528 combined). Pixi
  stays stopped through wiring, then performs a real tick/render, animation frame and
  later task. Exact `cf-v2-boot-phase/v1` stages `app-init-start`, `app-init-complete`,
  `backdrop-complete`, `save-load-start`, `save-load-complete`, `scene-rendered`,
  `slice-published`, `wiring-complete`, `ticker-started`, `first-tick`,
  `ready-scheduled`, `ready-emitted` bind session/context/generation/origin/loader/token;
  ticker false-through-wiring/true-after and per-stage/deadline controls fail closed.

  Immutable executable source `46fb627640e42ea0f43e2e144529884a959d1e72`
  passed the exact local battery. One malformed `--verify-run` operator invocation
  caused local SIGABRT/report overwrite; one correct rerun plus verification passed
  `exact-46fb627-root-layout`, 787/787 across 10/10. V2 passed 273/1 and all
  gates/selftests; one-attempt smoke passed 0/10. Full certifying glass at source-snapshot digest
  `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
  passed 12/12, planned/executed 53/53, `omitted=[]`, zero findings/instrument
  failures/retries in 170–197 ms. Exact 8K was 190 ms total: 2 ms arm, 35 ms
  release→changed-loader commit, 137 ms commit→ready, `performanceNow` 170.5 ms,
  1 ms confirmation, outgoing 3,862×2,172 canvases →1×1 and the replacement pair
  at 16,776,528 combined pixels. Nine automated personas passed; terminal-only
  performance was 595/676/76/168 ms. Exact manifest `dev-preview-exact-46fb627`
  records 37 files /10,176,376 bytes, content SHA-256
  `4d7638e92c4d02cffb953c9588bb1fff2e4c38153c3ff4ad752687e4a0263b58`, tree
  `0d47d77a303244fd8ce325a5d2ec975dac0c86ca`, expected separate origin and
  `publishable:false`. `46fb627` remains prior immutable exact evidence. Human
  play, Ready, merge, release, deployment and version
  authority remain open.
- ★ **D-UI-4 — ready publication is not post-render answerability; ultra backing is a
  separate density tier (narrow #205 repair closed in prior exact clean evidence;
  broader resize answerability superseded by D-UI-5 below, 2026-08-12).**
  Test-battery #205 (`31621227550` / `94196289291`) completed once without retry
  at exact pushed `c57305fbf30af2bc8158ff46af1ec49ec4455d95` and remains red.
  Every preceding gate and `smoke:ci` passed. Desktop-8k completed import, primary
  write, renderer release, changed-loader navigation, all 12 boot stages, and
  `cf-v2-slice-ready/v1` at browser-native `performanceNow` about 3,733 ms. Its
  following exact-context confirmation alone timed out at the unchanged two-second
  bound. Because #205 had no concurrent browser-process heartbeat, it is strong
  pixel-linear evidence of post-ready target starvation but cannot retrospectively
  prove browser/CDP transport stayed healthy. Preserve it without retry.

  The #205 follow-on retained native backing through UHD 3,840×2,160. A viewport strictly
  larger than 8,388,608 CSS pixels selects an ultra tier of 4,194,304 backing
  pixels per canvas /8,388,608 aggregate. `fitResolutionToPixelCap` compares the
  actual independently rounded backing dimensions, making 8K exactly 2,730×1,536
  each /8,386,560 combined. Density transitions destroy/collapse the prior backdrop
  before resizing or allocating its replacement and publish exact transition peak/
  budget evidence. Same-backing logical resizes still update canvas CSS size, Pixi
  screen/texture metadata, EventSystem resolution and real pointer mapping, backdrop
  logical size and generation; backing-width change is not used as a proxy.

  The harness follows timely ready with two independent, strict, no-retry,
  at-most-two-second exact-context cycles. Each target command is sent concurrently
  with root-session `Browser.getVersion`; cycle 2 is awaited from a one-shot Pixi
  ticker callback at priority -50 after the render listener and must advance the
  ready tick count. A timed-out/lost target with a timely heartbeat is a product
  answerability finding; a bad/late heartbeat is instrument/transport failure. An
  exact five-row ledger binds import arm plus both target/heartbeat pairs to role,
  cycle, session/context, await mode, priority and deadline. The 57-control plan
  separately records executed, `blockedNegativeControls`, and
  `omittedNegativeControls`, so an answerability product finding cannot be replaced
  by an omission instrument error. Controls `ready-confirmation-heartbeat`,
  `ready-confirmation-ticker-progress`, `ultra-viewport-render-budget`, and
  `ultra-same-backing-resize` carry deliberate failure cases in both directions.

  Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass
  captures based on `c57305f` remain non-authoritative; their sandbox `EPERM`
  and corrected `7680.000000000001` assertion did not retry a product failure.
  Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
  passed the complete exact sequential battery from clean source-status SHA-256
  `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
  and source-snapshot
  `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
  A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
  passed outside sandbox without product retry. Root validate, legacy smoke,
  rarity and dead-code passed. Root layout
  `exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
  under Edge 151 in 75,532 ms; report
  `7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`.
  V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt
  slice smoke passed 0 findings /10 screenshots /0 retries in 105,379 ms; report
  `c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`.
  Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
  zero findings/instrument failures/retries in 52,254 ms; report
  `1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`,
  with reloads at 176–185 ms. Exact 8K was 185 ms /2 ms arm /12 ms
  invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
  `performanceNow`; target confirmations were 1/9 ms and heartbeats 1/1 ms.
  Outgoing/replacement stores were 2,730×1,536 each; outgoing collapsed to 1×1
  and replacement remained 8,386,560 combined pixels. Nine automated personas
  passed—not human play—with JSON/Markdown SHA-256
  `c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
  `43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`;
  terminal-only performance was 578/659/76/170 ms. Exact preview
  `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked PASS under
  Edge 151; manifest
  `0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`,
  37 files /10,186,230 bytes, content
  `da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
  tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected separate origin,
  production distinct and `publishable:false`. Live Git/status/PR checks determine
  the docs-only tip; matching CI and separate host/human/Ready/merge/release/
  deploy/version authority remain open.
- ★ **D-UI-5 — geometry-correct very-large resize must remain answerable (repair frozen;
  exact clean executable evidence, 2026-08-12).** Test-battery #206, run `31635297321` attempt 1 /
  job `94243979205`, completed once without retry at exact pushed
  `558e0565d368a0b81d86d99fd380ebc50d30bc02`; merge `e160577` is tree-identical.
  Every preceding step and `smoke:ci` passed. Desktop-8k replacement reload passed in
  8,749 ms, ready published at browser-native `performanceNow` 2,578.6 ms, and its two
  ready target cycles completed in 1,905/1,910 ms with 3/1 ms browser heartbeats.
  The later 8K→5,120×2,880 same-backing transition then produced the sole product
  finding, `ULTRA_VIEWPORT_RESIZE_UNANSWERABLE`: exact-context `Runtime.evaluate`
  timed out at 2,003 ms against the strict 2,000 ms bound while concurrent
  `Browser.getVersion` answered in 2 ms; `last:null`. The matrix traversed all 12
  viewports with 1 product finding, 0 instrument failures, 56 executed plus
  1 product-blocked control =57, `omitted=[]`, and 0 retries. No persona or preview
  evidence was produced. Preserve #206 red without retry or a deadline increase.

  The frozen repair keeps UHD 3,840×2,160 native. Strictly above the existing
  8,388,608-CSS-pixel threshold, each simultaneous full-viewport canvas is capped at
  3,145,728 pixels /6,291,456 aggregate. Exact rounding makes both 8K and
  5,120×2,880 use 2,365×1,330 stores (3,145,450 each /6,290,900 combined).
  Backdrop destruction still precedes replacement allocation, and logical resize still
  refreshes canvas CSS, Pixi screen/texture/EventSystem state, pointer mapping, backdrop
  dimensions/generation, and exact transition peak/budget. Downshift and restore each
  require a strict target probe paired concurrently with `Browser.getVersion`, followed
  by an advancing later post-render ticker turn. Deliberately stopped and stale tickers
  fail alongside the established geometry/pointer/ownership controls. The product still
  runs its existing full scene rerender; no scene-rerender optimization or separate
  scene-art quality tier landed.

  Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
  remains prior exact #206 executable evidence (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
  snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
  Edge 151/pin-150 preflight warned; root validate/smoke and layout 787/787 across
  10/10 passed; v2 passed 273/1 plus all gates. One-attempt slice smoke passed 0/10
  in 105,217 ms (`b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474`).
  Certifying glass passed 12/12, 57/57, empty blocked/omitted and zero findings/
  instrument failures/retries in 52,557 ms (`7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`).
  Exact 8K was 203 ms / `performanceNow` 158.2 ms, phases 2/11/33/127 ms, targets
  1/10 ms and heartbeats 0/0 ms; outgoing 2,365×1,330 stores →1×1 and replacement
  stayed 6,290,900 pixels combined. Nine automated-only personas and terminal-only
  581/659/73/152 ms performance passed. Preview `dev-preview-exact-df1c28b-20260812T211642Z`
  was browser-smoked under Edge 151 over loopback, bound to the expected separate development
  origin, with `publishable:false`. That source and clean `6554b2b` below remain
  prior evidence; clean `307b8aaf` is current local #208 executable evidence. No host/human/Ready/
  merge/release/deploy/version authority follows.
- ★ **D-UI-6 — adjacent import/release bindings share one ordinal ruler (exact clean local
  evidence; selected pushed tip requires matching CI, 2026-08-12).** Test-battery #207, run
  `31642880191` attempt 1 / job `94269466117`, completed without retry at exact pushed
  `ff9bebb22aaac0e95cd406e1e15737898452911a`; merge
  `8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. Every prior gate,
  `smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed when
  a valid healthy release witness was received between ordered `release-started` and
  `release-complete`, but the harness treated that producer-legal intermediate as terminal.
  The report records 0 product findings, 1 instrument failure, 57 planned/listed controls,
  `blocked=[]`, `omitted=[]`, 0 retries, and no persona/preview output. Preserve #207 red.

  The repair gives only the import-phase and generic release bindings one monotonic ordinal
  within an armed capture. The successful tail is exactly `release-started` N → release N+1 →
  `release-complete` N+2. The valid release-first intermediate stays pending under the unchanged
  original 20-second import deadline; the release receipt may anchor navigation without renewing
  import. Phase-complete-first, premature, nonadjacent, missing, late, duplicate, malformed,
  wrong-provenance, early boot/ready, and overlong phase streams including a duplicate sequence-8
  terminal fail closed.

  The prior dirty diagnostic (report
  `805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
  chronology only. Immutable executable source
  `6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete exact clean battery.
  Its first sandboxed preflight Edge launch SIGABRTed before CDP; the same invocation passed
  when permitted with only Edge 151/pin-150 drift, an environment launch refusal and not a
  product retry. Root gates and exact layout 787/787 across 10/10 passed (report
  `58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`); v2 passed 273/1
  and every static/art/coverage gate; one-attempt smoke passed 0 findings/10 screenshots.
  Certifying glass passed 12/12 and 57/57 in 54,877 ms with exact 6/7/8 tails on every
  row, empty blocked/omitted ledgers, and zero findings/instrument failures/retries. Tablet-
  portrait was 196 ms with 2/1/1/7/0 ms commands; exact 8K was 197 ms with
  1/1/0/7/0 ms commands, release→commit 34 ms, commit→ready 131 ms, outgoing
  2,365×1,330 twins →1×1, and replacement 6,290,900 pixels combined. Smoke/glass report
  hashes are `139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844` /
  `a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`.
  Nine automated-only personas and terminal-only 635/717/77/151 ms performance passed.
  Preview `dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151
  over loopback, bound to the expected separate development origin, with `publishable:false`
  and content
  `04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`.
  That immutable source remains prior #207 executable evidence; live Git/PR state determines
  the current tip, upstream, and checks, and the selected pushed tip still requires matching CI.
  No human, host, Ready, merge, release, deployment, or version authority follows.
- ★ **D-UI-7 — fixed ultra backing tier restores sustained answerability (immutable clean
  exact local evidence; selected pushed tip requires matching CI, 2026-08-12).** Test-battery #208, run
  `31649176954` attempt 1 / job `94289516851`, completed without retry at exact pushed
  head `ee8bc281c424b5a8f998dc7327372e5f5a18067d`; merge `8fc6b4fc` is tree-identical,
  and branch-flow `31649175614` / job `94289512873` passed. Steps 1–15 and `smoke:ci`
  passed. The first 11 glass rows passed; desktop-8k alone reported
  `REPLACEMENT_UNANSWERABLE_AFTER_READY`. Its valid 2,365×1,330 pair /6,290,900 pixels
  scheduled ready at browser performance 584.3 ms but emitted at 3,143.8 ms, a
  2,559.5 ms main-thread gap. Exact target cycle 1 timed out at 2,003 ms against the
  unchanged strict 2,000 ms bound while the concurrent browser heartbeat answered in
  1 ms; no fatal occurred. The complete report records 12 rows, 1 product finding,
  0 instrument failures, 57 planned controls with `ultra-same-backing-resize`
  product-blocked, `omitted=[]`, 0 retries, and no persona/preview output. Preserve
  #208 red without retry.

  The repair stays deterministic: native backing remains through UHD; strictly above
  8,388,608 CSS pixels, each simultaneous full-viewport canvas is capped at 2,073,600
  pixels /4,147,200 aggregate. Exact desktop-8k and 5,120×2,880 both resolve to
  1,920×1,080, at DPR 0.25 and 0.375 respectively. The unchanged two-second target,
  concurrent heartbeat, ready, ticker, runtime-resize, pointer, and no-retry contracts
  guard sustained responsiveness rather than a one-shot pause. Literal positives assert
  the new dimensions and budget; former 2,365×1,330 ready/release shapes, existing
  2,730×1,536 shapes, threshold/UHD, pointer, resize, and stopped/stale ticker cases are
  negative controls.

  The `d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
  dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
  `307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed from committed clean bytes
  (status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, snapshot
  `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`). Root
  layout passed 787/787 across 10/10 (`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`);
  v2 passed 273/1 plus all gates; one-attempt smoke passed 0/10 in 105,339 ms
  (`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723`; log
  `fe8c5d42eec2a09641f3f551486046559cd4c5956591b5a7d71a25b48d926af1`).
  Glass passed 12/12 unique rows and 57/57 controls in 53,083 ms with exact 6/7/8 tails,
  five-command ledgers, `blocked=[]`, `omitted=[]`, and zero findings/instrument failures/
  retries (`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f`).
  Exact 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms,
  33/129 ms release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200 pixels
  at DPR 0.25; terminal-only performance was 606/685/74/171 ms. Automated persona
  JSON/Markdown hashes are `61d73fc9e11f55bc99f153aa6483661d1dc143104dab4d0cb728a48b68b485c5` /
  `fdd7ce423cee68ef2584190bb056afd4b32a41c4158957da0e3a571b02f8c495`.
  Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
  under Edge 151 over loopback, bound to expected separate origin
  `https://dev-celestialfrontier.github.io`, with `publishable:false`; manifest/content/tree
  hashes are `1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d` /
  `5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589` /
  `5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`. Live Git/PR state determines current
  tip/upstream/checks; the selected pushed tip requires matching CI. No host, human,
  Ready, merge, release, deployment, or version authority follows.
- ✔ **D-EPOCH-1 — imported cosmic time has an algorithmic ceiling (updated 2026-08-15).** Ecology's retained
  evolution walks once per epoch. A crafted `epoch=1e12` could therefore hang the app effectively
  forever, and a fractional epoch performed an accidental extra evolution. The port accepts only a
  nonnegative safe integer and caps it at 10,000; the live clock uses the same ceiling. Honest frozen
  epochs remain unchanged. The current app source is monotonic page-residence elapsed time, not yet a
  foreground-only active-play policy. Automatic epoch-edge persistence/invalidation and hidden-time
  semantics remain open under F4.
- ★ **D-EPOCH-PERSIST — the construction base is not the save snapshot (2026-08-15).** DOM-1 was a
  developer-contract defect, not a reproduced current-player save failure: `EpochClock.base()` is
  immutable, but its JSDoc told callers to persist it. The app already constructed once from imported
  `EPOCH_BASE`, refreshed that compatibility-named carrier from advancing `current()` before export,
  and rebuilt from the serialized snapshot only on the next boot. The package contract and focused
  two-session test now distinguish those roles. Real-browser smoke advances one exact epoch, drives
  `current()` through `persistView()` and raw IndexedDB, reloads it, and rejects stored-base and stale-
  reload substitutions. This does not claim automatic edge durability, foreground-only accrual,
  F3 CAS/revision/tab-lease completion, or F4 `activePlayMs`/SessionRNG completion.
- ✔ **D-ROUTE-1 — a shared planet address focuses; only Land lands (2026-08-13).** The slice used to
  turn a pasted/Atlas planet directly into `surface`, bypassing the only command that records landing,
  progression and contact outcomes. It now opens a valid external searched planet in live system survey
  and reserves surface entry for guarded Land. Before reach, survey card, accepted custom name,
  persisted view or navigation can see a Search-to-planet CF1 route, `jumpToView` runs the new source-
  derived hierarchy resolver. Repeat landings do not repay landfall progress; stale cards cannot
  land/chart/share another system; and a valid named CF1 route round-trips only after validation.
- ◐ **D-CF1-2 — complete hierarchy proof is live for external planet-share ingress;
  other ingress remains open (2026-08-13).** `resolveCF1WorldAddress` demands exact uint32 seeds and
  finite coordinates, normalizes legacy two-decimal CF1 positions, re-derives the claimed galaxy from
  nearby `UCELL` sources, resolves coarse/fine star provenance from its generator cells, and proves the
  planet's unique `systemFor` ordinal. It fails closed on malformed, missing, ambiguous or source-error
  candidates; `jumpToView` discards input parents and navigates only with the canonical result. Pure
  controls cover Sol/Earth, a fine star, rounding across parent-cell edges, forged parent/star/planet,
  malformed bytes and duplicate source ambiguity; browser smoke proves a same-reach forged parent cannot
  change navigation, landing, Atlas, custom names, query or focus. This does **not** close saved-view
  boot, Atlas-row, galaxy/star-only CF1, generated-descent or future ownership/receipt ingress. Wire and
  outcome-test those callers before marking the wider identity/receipt boundary complete.
- ◐ **D-CF1-3 — F2 wires canonical proof to every current navigation ingress;
  local all-ingress browser outcome is green and exact-head integration remains pending
  (2026-08-15).** `address.ts` now exposes exact
  galaxy/star/planet resolvers whose successful production values are deeply frozen and
  registered as runtime-proven. Branded canonical keys and parent-key guards accept an
  independently re-resolved equivalent parent but reject a structural clone or a real child
  from another hierarchy. `zoommode.ts` owns an immutable discriminated `NavState`, registered
  canonical-address composition, fail-closed transitions and strict persisted-view resolution.
  Planet identity is `{seed,ordinal}`, where ordinal is captured from the unsorted
  `systemFor(star).planets` source before `systemScene` sorts by orbit.

  The app now re-proves generated descent/actions, all three CF1 Search tiers, saved boot/import,
  Atlas rows and the exact current one-key Training `{view}` snapshot. Source proof and saved
  Prime/Charter authorization precede destination navigation, an accepted custom name, a
  route-focused planet card, Land, progression and save commit. Importer route projections and
  Atlas row association remain bounded runtime sidecars, not save fields; only a proven Atlas
  `NavState` in the app's private `WeakMap` enables travel.
  A deterministic saved-route or authorization failure repairs only `view` to Cosmos. A
  `source-error` holds that field. If current one-key Training restoration encounters that failure,
  the drill stays incomplete and preserves its exact snapshot; when Sol can be newly proven and
  authorized, it returns there before persistence so reload can reopen Welcome for retry rather
  than clearing the route as stale. Provenance keys, source cells,
  star layer and planet ordinal never enter the compatibility save/share projection.

  The first real-browser F2 attempt correctly went red on an integration defect the pure seam
  could not expose: galaxy rendering handed frozen `ProvenGalaxy` to lifted `galaxyStats`, whose
  legacy memoizer writes `_stats` onto its argument. The repair is caller-local: pass a disposable
  mutable spread to that presentation helper and retain frozen `{stars,planets}` in a
  `WeakMap<ProvenGalaxy,...>` sidecar. It does not unfreeze provenance or change the lifted helper.
  `universeGalaxies()` also copies/freezes each nested collision `bridge`; the focused mutation
  control proves one composed node cannot poison memoized WorldGen or later composition.
  Final audit added held-route Training Restart transfer/rollback and non-null per-mode provenance-
  key controls. A CI-format rendered-copy run then failed closed because its bare expected title did
  not include the real icon-prefixed Guide heading, despite complete required copy and no
  contradiction; the contained-title repair retains the cross-topic rejection. The diagnosed next
  `npm run smoke:ci` passed with zero findings/retries in 138,305 ms, and the 12-viewport Glass
  Matrix passed in 55,065 ms with zero findings/instrument failures. Both reports bind Edge
  `151.0.4129.86` and dirty-tree digest
  `7dfa649eb7de017424b7ba1ba0b11ba1fd00dc02a5b99b6848e0f3c347acba9e`.
  The static suite is 27 files / 340 passed / 1 skipped, with both TypeScript programs,
  `artunused`, art routing/coverage/spec controls, diff hygiene and the app build green. This entry
  remains ◐ because that is dirty-working-tree evidence, not exact-head CI, integration or Gate
  authority.

  This was navigation identity only. At the F2 boundary D-TRAIN-1's richer legacy checkpoint transaction, F3
  revisions/CAS/split stores/receipt journal, F4 clock/visibility/SessionRNG, local ownership-ledger
  migration, every ownership/reward/receipt writer, save schema/version and production release all
  remain open. D-CF1-2 above remains dated history of the narrower boundary F2 supersedes.
- ◐ **D-TRAIN-1 — exact legacy Training checkpoint restore is implemented and local
  browser/Glass outcomes are terminal green; exact-head/integration and real-save Gate-C
  proof remain pending (2026-08-16).** The
  mature v1.8.9 `tsnap` is not a full save: it has exactly eleven outer fields
  `{st, ps, ac, es, c, ca, cx, it, eq, ea, e}` owning selected statistics, player
  statistics, achievements, Stardust, Compendium, cargo, exceptional counts, items,
  equipment, affixes, and Earth Atlas/home history. The sealed fixture is action-derived
  from `veteran_rich` through the real legacy Settings → Restart Training controls; its
  2,074-byte snapshot SHA-256 is
  `2e2f7c566a27e79398ea18650de9ac6acf236e92235fc293e4815b8bfefa22e3`.
  The old synthetic `{codex,essence,marker}` fixture remains unknown/refusal-only.

  The importer recognizes the exact key set as a bounded frozen `legacy-v1` checkpoint,
  rescues genuine `tut:1` to incomplete, preserves bounded unknown evidence, and rejects
  completed-plus-pending export. Restore replaces only those eleven surfaces inside the
  surrounding v4 save. It ignores `e.where` as route authority, proves canonical Earth,
  sanitizes historical Earth fields, invents no land/conquest/achievement, never heals HP,
  reserves Earth under the 120-row Atlas cap, and derives survey/arrival counts from identity
  ledgers. The legacy checkpoint contains no `view`: Skip from Welcome retains/persists
  Sol, full completion after Land retains/persists Earth, and only the current-v2
  one-key `{view}` checkpoint restores the exact pre-Training route. Optional compatible
  `ever:{v:1,hybrids,best,maxGen,scanhits[,arrivals]}` carries cumulative facts that cannot
  always be re-derived. Outer `v` stays 4, but this is an additive v4-envelope extension
  with an independent nested version—not “no schema change,” v5, or a release bump. A
  numeric future `ever.v` protects the whole save.

  Finish/Skip claims exclusive replacement ownership before awaiting, marks the lesson
  busy, retains its focus lock, stops/cancels/drains ordinary persistence, builds a detached
  source-proven candidate, and makes exactly one direct primary write before live publish
  and teardown. Pre-durable failure leaves the lesson/checkpoint retryable; post-durable
  publish failure never writes twice. Loaded pending checkpoints and loaded `tut:0` without
  one are write-held; the no-checkpoint case gets only a runtime Sol seat. Unknown checkpoint
  or route-unavailable state persists as an inert-background, focus-trapped, nonclosable
  recovery modal with reload/retry and trusted complete import.

  Ignored Slice Smoke run `20260816195736683-4852-27b5c876410a` is terminal PASS
  on Edge `151.0.4129.86` in 154,788 ms with 0 findings, 0 automatic retries,
  10 screenshots and no detected source change; its raw outcome names genuine Training
  Skip + full Finish, rescue/quarantine/retry/races and canonical Earth. The separate
  full-certifying Glass report is terminal PASS in 57,476 ms across 12/12 viewports
  and 12/12 reload-evidence rows, with all 57/57 planned negative controls run, none
  blocked/omitted, with 0 findings, 0 instrument failures and 0 automatic retries. Both report commit
  `b091f010011fa16bec457599b41274b7f92bb5e6`, branch `openai/mac`, dirty-diagnostic
  state; Slice Smoke binds working-tree hash
  `465adef3606b0b06dd285eb049662e5b5ee659bb6dc0b53430568a3df9cf9104`, while
  Glass binds `4f266568aacdb98c7a6e9cfc8571fc60e0bfc140762540dd844a2714fc0836f5`.
  The final-copy rerun chronology remains explicit: Slice first went instrument-red because its
  legacy Skip contradiction regexp crossed the valid comma into Finish's Earth clause; the repair
  makes comma/semicolon a hard clause boundary. Glass then went instrument-red because injected
  capitalized `Completing … Sol` did not match a lower-case forbidden literal; forbidden rendered
  copy is now compared case-insensitively while required copy remains exact. Neither instrument-only
  red was retried away; each was diagnosed and followed by a fresh one-attempt run.
  Those local input-bound reports do not certify this later documentation tree,
  exact-head CI, integration, Gate C, human play, or release. No new Guide capability,
  lesson, outer version, current release, or production release is claimed.
- ☐ **D-CFB-1 — preserve the deterministic parent tuple or ratify its loss.** The retained creature
  codec drops `parents`, while combat class/ability reads them. Honest hybrids can therefore change
  combat identity after a CFB round trip. A normalized two-uint32 tuple is the bounded candidate, but
  because this corrects inherited behavior it needs an explicit compatibility decision and matchup
  controls. Hybrid audio is a second consumer: the ordered tuple can preserve lineage salt but cannot
  reconstruct both parents' full audible traits. A premium parent-voice blend additionally needs a
  versioned bounded parent-audio projection; representation, compatibility, malformed input and
  reverse-order evidence remain open before either combat or audio may depend on it.
- ☐ **D-IMPORT-1 — reconstruct Map/Set and genome semantics, not merely array shapes.** The current
  importer contains a descriptor-crashing Compendium row, but malformed trait indices can still
  produce NaN combat values, and duplicate conquest/bio/wave/tech/binder/charter rows do not yet
  collapse with the original Maps/Sets' first/last-write semantics. Normalize numeric genes without
  rewriting honest unwrapped `size`, contain irreparable rows, and rebuild keyed collections through
  their actual abstractions.
- ★ **D-CONTRACT-1 — handwritten declarations are executable contracts, not comments (updated
  2026-08-15).** The specifically audited SurveyPhrases, PlanetGen, SpeciesTraits, CombatCore and
  WorldGen surfaces match runtime. WorldGen now exposes the required own
  `galaxiesInCell(...).web` metadata and exact `SupernovaSite`/birth/remnant types, and names
  `supernovaSites`'s second argument as the deterministic epoch key rather than a desired count.
  Its facade documents that a first uncached ordinary generated-galaxy branch still requires
  `GAL_SPRITES` installation. That warning closes DOM-3's missing-contract finding; it does not
  remove the free-global seam or make the package standalone. This closes only WorldGen's `.web`
  half of DOM-11: `_sanitizeSavedGenome` mutation semantics remain open under D-STRAYS/D-IMPORT,
  and other declaration corners remain separately listed. Contract tests exercise the real APIs,
  and `npm run typecheck` includes the app configuration that first exposed the drift.
- ★ **D-AUDIO-INIT — the exported sting seam is inert until its owner initializes it
  (2026-08-15).** The lifted sting bodies read the application-owned `ac` binding before their own
  synthesis `try` blocks, so a direct pre-init package call formerly escaped as `ReferenceError`.
  The facade now makes every exported sting and `applySfxGain()` a pre-init no-op without creating
  a context or editing the byte-verbatim bodies. Once initialized with the live save-backed
  getters, Sound-off still prevents construction; an enabled call lazily prefers standard
  `AudioContext`, falls back to `webkitAudioContext` only when the standard constructor is absent,
  and reuses the context. Bounded package tests cover import and all four non-initializer public
  operations, post-init dispatch, live mute state, constructor precedence/absence/failure and
  suspended resume rejection. During the awaited save-load, the app assigns the save and then calls `initAudio()`
  synchronously before later playable scene/input publication; no ordinary current pre-init action
  route was reproduced. This closes DOM-12 as a package contract defect rather than claiming a
  current-player crash.
  Creature voices, ambience, combat/Guardian cues, music, buses/mixing, node ownership,
  visibility/context-loss recovery, budgets, rights, device listening and all other Arc 7/8 /
  Gate G acceptance remain open. No Guide/Training/release-copy or version change is implied.
- ★ **D-UI-1 — lower mobile chrome is measured as a group (2026-08-12).** The phone dock wrapped
  3/3/2 while context/hint/Planetside used fixed offsets, so green smoke evidence visibly covered
  copy and controls. The port owns a 206×98 4×2 phone dock, publishes measured `--dock-h`/`--ctx-h`,
  and derives every lower anchor from them. Browser smoke asserts pairwise clearance, row geometry,
  button hit targets and CSS-variable equality, with an injected old-style overlap that must fail.
  Each dock button remains a 44px target while its icon uses the 42px client line inside the 1px
  border, eliminating the hidden two-pixel overflow without shrinking the action.
- ★ **D-UI-2 — DPR-scaled pixels and player input share one coordinate space (2026-08-11).**
  Pixi now uses `autoDensity`, keeping a DPR-scaled backing store inside a viewport-sized CSS
  canvas instead of doubling the displayed box and halving pointer coordinates on DPR-2 phones.
  Galaxy and star survey cards expose explicit minimum-44px Enter actions, so a card covering its
  selected body cannot make navigation depend on a second canvas tap. Touch Planetside likewise
  exposes a minimum-44px **Leave world** action through the same ascent path as Escape/right-click.
  Planet-card actions also bind the captured galaxy+star `{seed,x,y}` composite, not seed alone.
  Browser smoke drives the real touch and desktop outcomes and rejects injected density, buried-
  action and same-seed/different-coordinate stale-card regressions.
- ★ **D-GUIDE-1 — the port continues the mature Guide; it does not fork a second manual
  (2026-08-11).** The temporary seven-topic literal is gone. `guide-content.ts` carries an exact,
  SHA-256-bound v1.8.9 Guide snapshot: 9 categories, 43 authored stable topic ids and 41 legacy-live
  topics (`beacon` / `events` retained as dormant), with category drill-down, keyword/body search and
  live `data-gt` cross-links. A typed capability table substitutes v2-current copy for partially
  ported systems and an explicit **Not yet in v2** explanation for unported systems, so stable ids
  remain linkable without advertising dead mechanics. Its test fails on source-hash drift, missing or
  duplicate ids, a broken cross-link, capability overclaim and a capability underclaim. First open
  persists `seenGuide`. Import remains at **Settings → Bring expedition** through the one guarded
  loader and its named, top-layer `aria-modal` dialog with internal Tab wrapping and Escape/focus
  restoration. Guide uses z24 above the z23 survey card. Tooltip deep-links and Advanced Briefings
  remain OPEN; the Guide model existing does not claim those interaction layers are ported.
- ★ **D-RELEASE-1 — legacy history, v2 development identity and a shipped version are three different states
  (updated 2026-08-13).** `release-content.ts` carries an exact source-addressed legacy archive: 56 releases,
  398 bullets, v1.8.9 first and v1.0 last. **A New Foundation** is the separate cumulative v2.0
  development bulletin: a categorized, implemented-outcome technical outline whose explicit
  `draft`, `version:"2.0"` and `Unreleased` state does not turn open roadmap work into a promise.
  `V2_CURRENT_RELEASE_VERSION` is `null` and the shipped-v2 list is empty. Therefore draft copy
  can appear in the cumulative Guide history but can never fire the mature one-time update rule,
  create `releasePending`, or mutate `rnSeen`, including after persistence/reload. Structure,
  key-outcome, rendered-tail and negative-control tests guard this boundary without freezing the
  mutable draft behind a content hash. Hash/parity tests separately protect the legacy archive and
  patch-line selector. No v1.8.9 mutation, production version, release or deployment is implied.
- ★ **D-PRESENT-1 — Spectral remains deterministic data, not a v2 player class
  (2026-08-13).** The auto-lifted descriptors retain `.designation`, `spectral()` and seeded color
  words for parity and art. The application presentation filters every legacy `Spectral class` row.
  A planet card contains no rarity before a successful landing; afterward it adds only the plain
  ten-tier display name. Real G/K/M and stellar-remnant classifications remain star identity. Tests
  must prove both the player outcome and the unchanged internal designation rather than editing the
  verbatim descriptor fixture to make the text disappear.
- ★ **D-DEV-ID-1 — v2.0/full-commit identity is Guide-only
  (2026-08-13).** Preview schema v3 binds the shared v2 version, `develop-<short-commit>` build,
  full source commit, exact archive inputs, byte inventory, expected origin and generated site
  `version.json`. The visible identity is rendered inside the Guide. Both historical corner-badge
  ids/styles are forbidden; origin refusal, noindex/robots and manifest verification remain the
  safety boundary. `main` continues the root v1.8.9 production package, while a green `develop`
  push publishes the already-smoked exact v2 package. The final preview browser check and the
  root layout gate (`tools/uilayout.js` — the battery's first real browser launch; the same
  diagnosed Linux cold-start phase recurred there at its prior 24-second bound in run
  `31758515194` attempt 1) each own a fixed bounded 30-second CDP-start allowance; generic
  evidence tools retain their 15-second default.
  Every platform captures the exact caller options and runs a real browser outcome. On POSIX the
  preview selftest starts Chrome immediately but withholds its ready CDP endpoint for 16 seconds,
  so the old generic path must reject while the exact preview caller keeps its full startup window
  and proves `Browser.getVersion` plus cleanup.
- ★ **D-BROWSER-ENV — a macOS Codex Seatbelt abort is not a game crash
  (2026-08-13).** Three supplied Edge reports have the same Node-parented main-thread
  `TransformProcessType` / `_RegisterApplication` SIGABRT within 100 ms, before CDP, a page,
  GPU allocation or game code; macOS logs confirm denied LaunchServices and WindowServer
  lookups. The shared resolver/launcher now refuses the Codex Seatbelt environment before
  spawning Chromium, with a marker-executable control proving no spawn/profile side effect;
  the two historical spike renderers also resolve through that guarded boundary.
  Actual browser evidence runs once through approved out-of-sandbox execution. This does not
  change the browser pin, profiles, product resource budgets, or the separate CI preview
  startup allowance above.
- ★ **D-UI-3 — glass accessibility is an outcome contract, not a translucent stylesheet
  (2026-08-12).** The v2 shell consumes all four safe-area insets and measured dock/context/hint
  heights; exercises 320px portrait, phone landscape, tablet, desktop and ultrawide shapes; enforces
  a contrast-safe 0.82..0.98 glass floor with no-blur and forced-colors fallbacks; and makes touch/
  panel controls at least 44px. Text size/tone/font save fields now change the rendered DOM and
  trigger remeasurement without flattening hierarchy: under A++ a toast title remains 19px above
  its 16px body. Panels and Survey each own exactly one 44px top-right Close target; refill removes
  duplicate seating and balanced header/row padding plus separators keep the glass geometry symmetric. Focus-
  visible, labelled sliders/import inputs, panel opener restoration and modal Tab containment are
  explicit; if Survey reopening hides a desktop rail opener, closing falls back to Survey and then
  the canvas rather than stranding focus on the hidden panel control. Motion Auto follows the OS
  live; Reduced freezes Pixi ambient time, snaps camera/fade state, gates organism animation and
  removes CSS animation/transitions.
  PR #32 extends that outcome contract to the real 844×390/A++ short-landscape failure: a nonmodal
  Compendium takes the left safe-height workspace with its scroller recomputed from the safe
  viewport, while Search, dock, and Survey when open remain usable at right. Panel-open status
  already yields trail/objective; only noninteractive top/context/hint chrome additionally yields
  in short landscape. Glass exercises first/middle/last and focus-pinned hostile rows, exact
  clipping ancestors, Guide exact-one-carrier mutation, restoration, hit ownership, and focus.
  The canvas is a named focusable region whose arrows cycle the actual rendered body inventory,
  Enter/Space calls its survey path, +/- zooms at the selected target and Escape releases it; a
  visible focus ring and polite live region expose the state. Clipboard refusal selects the exact CF1
  in Search and announces **Copy unavailable** instead of lying. `effectiveDpr()` retains the touch-2
  / desktop-3 heat caps, gives the application canvas plus backdrop one aggregate
  16,777,216-pixel backing-store budget split equally, and resynchronizes Pixi plus
  backdrop density on viewport changes while destroying the replaced backdrop texture. On every
  ≤900px landed layout, populated Planetside owns the objective's limited reading band until ascent;
  short landscape yields the trail and begins Planetside below measured top chrome. Portrait derives
  its top bound from visible fixed chrome plus the last visible trail edge and its lower bound from
  measured safe/dock/context chrome. It keeps the trail only when a useful 72px roster plus 6px
  separation fits; otherwise `surface-trail-yield` hides only the noninteractive trail and exposes a
  vertically scrollable Planetside with the same 72px floor, restoring the trail when space returns.
  `syncDockH` and `syncCtxH` rerun that classification after asynchronous measured changes. The
  post-close `planetside-portrait-band-viability` control proves the 72px/header/specimen/scroll/
  clearance outcome and reproduces the exact collision by removing the cap and adding tall content;
  `planetside-portrait-trail-fallback` tightens the lower safe rectangle enough to force the fallback,
  proves its useful strip and fixed-chrome clearance, then proves exact restoration.
  On desktop, notifications, Settings and Records share the bottom-right utility edge above the
  measured dock; none may fall back over the upper-left navigation rail.

  Pushed commit `33ea34191c817a8e78eea598c31981f8208e939b` passed its exact local battery,
  but GitHub test-battery #199, run `31571459050` / job `94034164092`, failed in the v2
  real-browser/responsive/persona step. `smoke:ci` passed once; the following glass run saw the old
  ready document token through the former 10-second desktop-8k import/reload wait and also recorded
  the small-phone Planetside/trail overlap. Pushed `8b8a740` gave import settlement and replacement
  boot separate 20-second bounds, paired loader/token readiness, and the responsive portrait repair.
  Its exact local battery and matching test-battery #200 glass leg passed.

  Matching test-battery #201, run `31586917924` / job `94082765087`, completed once without retry on
  pushed evidence head `4560269b8767dc48bb82e3b1f9d82ca835a84aad` and is **RED**. Every preceding
  root/product/v2 gate, including `smoke:ci`, passed. Only the desktop-8k preference import leg
  instrument-failed: the former replacement clock expired after 20 seconds while the old top-frame
  loader remained and its slice token/import phase were absent. There was no `import-rejected`,
  `import-threw`, classifier rejection, or reported repository-write failure; the red is a post-
  request replacement-lifecycle/instrument finding and must not be retried away.

  Clean executable commit `7d9980e37e60f0cec8cb840e75098872b9cc90d0` gives Training restart/import/storage recovery one mutually
  exclusive replacement transaction, synchronously stops its outgoing ticker before any await,
  requires the D-SAVE-2 event-owned import-phase and resource-release witnesses, then separates a
  20-second import transaction, 5-second observed navigation commit, and 20-second new-loader boot.
  Old-context loss cannot start boot by itself. A stable changed loader starts that clock, and only
  its ready changed document token may pass. Bounded Page/Runtime/Inspector/Network evidence names
  crash, unreachable navigation, replacement exception and fatal document load. The existing
  `import-phase-sequence`, `replacement-ticker-quiescence`,
  `replacement-document-loader-token-phase` and `reload-resource-release` controls cover
  stuck and just-late phase transitions, same-loader mutation, premature context loss, duplicate/invalid witnesses,
  retained canvases, a stopped-before-invocation or running-after-claim ticker, unreleased renderer
  and over-budget pixels. Its complete clean battery passed:
  root preflight selftest/preflight (only Edge 151 versus pinned Edge 150 drift), fingerprint/smoke,
  root layout selftest plus final `exact-7d9980e-root-layout` 787/787 across 10/10 viewports, rarity 60M/0,
  dead-code 3 tooling references, v2 273/1 and every gate/selftest, and one-attempt smoke 0 findings /
  10 screenshots. Exact-source certifying glass passed 12/12 viewports and 52/52 controls with
  `omitted=[]`, 0 findings/instrument failures/retries, digest
  `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
  All 12 exact phase/release/ready paths passed in 194–239 ms. Desktop-8k recorded a 3 ms arm,
  21 ms import-phase span with ticker true only at `invoked`, 0 ms write, 19 ms release, both
  5,461×3,072 canvases →1×1, `performanceNow` 199.5 ms, 1 ms confirmation and 239 ms total.
  All nine personas passed. The malformed initial `npm run perf -- --runs=4` was rejected before
  browser startup; the correct single terminal diagnostic was 646/726/74/157 ms and was not a
  retry of an evidence failure. Exact 37-file / 10,170,996-byte preview
  `dev-preview-exact-7d9980e` verified and browser-smoked under Edge 151 at 320×568 for content
  `a4a3d0f6300df1bf14a21149b53c0a4591283ae2e4ab3ab5b4034cdd130409a7`, exact
  `port/v2` tree `5e90265993304c5b03e49a7baef2479ae2c37184`, expected separate origin,
  production distinct and `publishable:false`. Prior #201
  remains red without retry. `7d9980e` is immutable prior evidence; D-SAVE-3's later prior clean
  evidence is `46fb627`. Live Git/PR checks decide exact tip/upstream/check state; whichever final
  pushed docs tip is selected requires matching CI. The separate-origin human playtest remains open.

  Matching test-battery #202, run `31594595288` / job `94106996466`, completed once without retry
  at pushed `93f75a93ab80a3b199e55b5b49d9488e8fc57f53` and is **RED**. Every earlier root/
  product/v2 gate and `smoke:ci` passed. Only desktop-8k glass import/replacement instrument-failed
  when the former serial observer first returned at 61.163 seconds. Its two frame-tree reads around
  one awaited Runtime evaluation each inherited a 30-second command ceiling, so #202 proves
  observer ambiguity, not a 61-second application boot, save rejection or product failure. It is
  preserved without retry or a timeout increase.

  The current instrument repair uses sticky receipt timestamps and pure
  `replacementNavigationOutcome`, `importReleaseOutcome` and `replacementReadyOutcome` decisions.
  It requires the prior release reason/token/context/session, a changed top-frame loader, and one
  valid ready tail event from the exact new default context/generation/origin/session/loader/token/
  URL before the phase-owned deadlines. Two strict at-most-2-second exact-context cycles follow.
  Each sends its target Runtime command concurrently with root-session `Browser.getVersion`; cycle
  2 waits for a later post-render Pixi ticker turn. The exact five-row ledger records the import arm
  plus both target/heartbeat pairs. A lost or late target with a timely heartbeat is a product
  answerability finding; a bad or late heartbeat is an instrument/transport failure. The payload's
  browser-native `performanceNow` must be strictly below 20 seconds, and an exact-boundary control
  fails, so observer descheduling cannot compress a genuinely late boot. Fatal events remain sticky
  outside the bounded diagnostic ring. Missing, duplicate, malformed, wrong-context and just-late
  events fail closed. The ready event proves complete boot publication plus a serviced event-loop
  turn; both confirmation cycles prove bounded post-ready commandability, not the separate 50 ms
  answerability metric.

  The exact `7d9980e` battery above remains immutable evidence for that repair; later prior D-SAVE-3
  evidence is bound to clean executable source `46fb627` above. Live Git/PR checks decide exact
  tip/upstream/check state; whichever pushed tip contains the #207 repair requires matching CI.
  Separate-origin human playtest, human certification, Ready, merge, version, preview publication
  and deployment remain separate authority boundaries.
  Earlier test-battery #203 (`31602984470` / `94134750800`) failed once without retry only
  in desktop-8k import before the release boundary: the old 5,461×3,072 Pixi ticker
  remained live while the durable write and teardown awaited service. The follow-on
  product repair quiesces it synchronously at the exclusive claim and restores it only
  on exact-owner rollback. Glass now retains the exact event-owned import sequence
  (`invoked` running; claim/write/release stopped) and starts the unchanged 20-second
  import clock before its bounded non-awaiting arm command. The new
  `import-phase-sequence` and `replacement-ticker-quiescence` controls reject both
  ticker directions, missing/reordered/wrong-context receipts, and just-late evidence;
  no timeout increase, retry, or IndexedDB timeout race is introduced. Before the exact clean
  evidence above, one mixed-source smoke execution correctly refused when tracked docs changed
  during its run; it had no automatic retry and was an instrument/coordination refusal, not a
  product failure. That exact clean commit closes D-SAVE-2; later prior clean source `46fb627`
  closes the local implementation/evidence side of D-SAVE-3. Live Git/PR checks decide exact
  tip/upstream/check state, and whichever final pushed tip is selected requires matching CI.
- ★ **D-UI-8 — declared chrome, not selector exceptions, owns outside dismissal
  (2026-08-15).** The ported panel manager protected left-rail spacing through a literal
  `#raillft` exception but omitted the structurally identical `#railrgt`; a real pointer in the
  latter's 8px flex gap therefore closed an unrelated active panel and restored focus unexpectedly.
  Stable non-dismiss roots now self-declare `data-panel-boundary`, while registered panels/openers
  retain element-identity ownership and Search deliberately retains its parity outside-dismiss
  behavior. Real-CDP smoke opens opposite-side panels with browser-mouse input, hit-tests the
  exact root-owned gap in both rails, preserves panel/ARIA state, removes each marker independently
  to recreate dismissal, and proves that temporarily owning then unowning the same canvas point
  distinguishes chrome from genuine empty sky. Synthetic document-target `pointerdown` and `click`
  also remain quiet because both delegated handlers now runtime-guard `Element` before `closest`.
  This closes UI-P1 dismissal classification only; UI-P2/P3/P4, layered coexistence, Training
  allow-scope, modal lifecycle and Escape ownership remain open.
- ★ **D-TRAIN-2 — a bounded tutorial must graduate honestly (2026-08-11).** The current slice runs
  six live lesson cards (welcome through Land) and then says **Finish for now**. Lessons advance from
  the real survey/Atlas/landfall events; an explicit replay landing on Earth may satisfy the lesson
  without paying duplicate landfall progress. Cache, feed, breed, duel, hazard, healing, forge and
  the rest of the legacy 21-step curriculum remain OPEN. D-TRAIN-1 separately guards exact legacy
  checkpoint compatibility and is implemented in source with its terminal evidence boundary still pending.
- ★ **D-ART-LOAD — lazy art readiness is shared but invalidation is bounded per view (2026-08-11).**
  One in-flight import Promise now accepts the latest callback for each of Compendium, Planetside
  and prefetch. An idle prefetch can no longer swallow a later view subscription, while a 1,500-row
  Compendium registers once outside its row map instead of retaining 1,500 callbacks and launching
  1,500 full-list rerenders when the chunk resolves. Import failure clears the Promise for a later
  retry; Compendium virtualization and texture-memory proof remain OPEN.
  **Superseded current disposition (2026-08-17):** Arc 1A no longer uses this Window import-Promise
  path for live art. Exact broker leases own Compendium/Planetside/detail requests; at most one
  serial dedicated worker exists at a time, each producer burst owns a fresh instance and lazy
  painter import, and the instance terminates after active work settles and its queue is empty.
  Capability/import/protocol/worker fatal paths
  settle the failed active and queued jobs once with no automatic retry; a later genuinely new
  request may create a fresh producer. Virtualization and worker ownership are implemented as
  recorded in the current-state block above; measured resource acceptance remains `[EXEC-TODO]`
  unless the selected head's ignored exact-source artifacts and its corresponding PR test-merge CI
  are terminal green. This reference caches neither live outcome, and the HUMAN review remains open.
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
- ☐ **D-NAV — legal transitions are guarded; illegal state shapes remain representable.** The old
  build defended `st.star.x` against null per frame after a crash shipped. `@cf/scene` now rejects
  illegal transitions and clears deeper context on ascent, but its current single nullable
  `NavState` interface still permits a contextless `surface` value and retains caller object
  references. Finish this with a discriminated union plus normalized copies; until then this is a
  partial hardening, not a closed type theorem.
- ★ **D-CLOCK — no wall-clock in the domain.** COSMIC_EPOCH's port takes an injected
  monotonic elapsed-segment source; the harvestclock invariant holds by construction. The current
  app counts page residence, while F4 still owns visibility/answerability policy and exact edge
  behavior. F3 supplies the CAS/revision/tab-lease substrate; F4 owns the separate persisted
  `activePlayMs` clock/accrual policy for future mission/Recovery/Auto-Extractor readiness. The
  no-DOM lint enforces `Math.random`/`Date.now`
  absence across every domain package — the original could only enforce this by grep + discipline.

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
- ☐ **D-STORE — repository/recovery seam exists; §19.3 split stores do not yet.** The typed
  repository owns IndexedDB open/retry, primary/backup promotion and recovery, but currently stores
  the exported save as one blob in `meta`. Multi-tab last-writer-wins and incremental domain-store
  transactions remain open; do not describe them as shipped until revisions/CAS or equivalent
  transactional records land.
- ☐ **D-IDENTITY-LOOT — catalogue, creature and gear ownership must split before the
  companion/loot arc (2026-08-13).** Legacy Codex rows conflate a discovered species with
  one living specimen, while `items`/`equipAff` conflate a base definition with a rolled
  equipped copy. That cannot support duplicate companions, stable attachment, away-state,
  provenance or multiple affixed copies. The approved delta in
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` introduces `CatalogSpecies`,
  `CreatureInstance` and `GearInstance` with explicit migration; imported fields remaining
  round-trippable is not proof the live systems exist.
- ☐ **D-CAPTURE-OWNER — survey is not an acquisition writer (2026-08-13).** Current v2
  can reveal life and display imported Compendium rows but has no live Tame, Scavenge, Sample or
  Biosphere Yield action. Before collection/breeding/dispatch can be advertised, port finite
  receipt-backed acquisition: every successful verb creates/updates `CatalogSpecies`; fauna Tame
  may create a stable `CreatureInstance`; Scavenge/Sample create specimens/resources, never living
  companions. Miss/Worked Out, reload and stale-tab controls must prove no free page, duplicate
  creature, reroll or double spend.
- ☐ **D-RECEIPT — companion/Guardian loot requires revisioned exact-once persistence
  (2026-08-13).** Roll and commit a save-lifetime RNG ordinal plus immutable receipt at
  dispatch/encounter settlement, not at reveal/claim. A dedicated persisted visible-and-answerable
  active-play millisecond clock owns readiness; it is not the capped ecology epoch. One leased tab
  advances it and stale deltas fail. Revision checks cover every reward/destructive mutation,
  including capture, craft/salvage, feed/breed/recovery, dispatch/recall, combat settlement and
  deletion—not mission claim alone. Same-parent/same-world stale-writer controls are required;
  wall-clock advance, reload, double-click and a stale second tab must not reroll or duplicate
  rewards. Current one-blob last-writer-wins persistence is insufficient; CAS or one
  authoritative serialized coordinator is prerequisite work.
- ★ **D-CHARTER-CAP — current Charter presentation stops at the live frontier
  (2026-08-13).** `ASC_CHAPTERS_DATA` remains verbatim canonical/import data, including
  its unported mining, fabrication, bioscan, conquest and breeding goals. The player-facing
  `projectV2Charter` / `currentV2Objective` path now filters to reachable landfall only,
  drives both the board and chip from one stage-aware projection, and turns completed visible
  landfall work into a development-slice boundary—not a synthetic chapter, drive, reward or
  reach unlock. A nonterminal `ascCh` cannot expose non-Sol work without the corresponding
  saved reach stage; the explicit terminal legacy/veteran fallback
  (`ascCh >= ASC_CHAPTER_COUNT`) deliberately remains stage 3 even when drive-item bytes are
  absent. Blocked star/drive travel says the next Charter system is unavailable; a galaxy beyond
  the saved Prime Signature radius says its expansion is unavailable. Neither boundary directs
  players to an absent Shipyard/build path or promises that Signatures can be collected or
  written in this slice. F1b Charter hardening now rejects invalid `ascCh` landfall input without
  mutating progress, recursively freezes the canonical array/chapters/goal arrays/goals and their
  projected aliases, and runs `reconcileV2Chapters` after any successful Land action independently
  of first-landfall banking. One stable saved reach stage may acknowledge every consecutive
  already-complete imported chapter; the first incomplete/incompatible chapter stops the loop and
  no progress, drive, reward or reach is invented. Focused unit/Guide controls and real-browser
  emulated-phone Mercury touch re-land evidence cover the 0→3 saturated veteran outcome, exact unchanged
  land/progress/reward/reach bytes, IndexedDB/reload persistence, and matched unpowered plus
  powered-incomplete no-advance cases. A one-shot aggregate completion replaces adjacent ambient
  feedback politely, and an already-open desktop Charters panel refills from the advanced ledger.
  Full legacy Charter writers, rewards, accepted chains and weeklies, the other F1b slices and F2
  remain open; this closes only D-CHARTER-CAP presentation plus SCN-1/SCN-2/SCN-6 hardening.
- ☐ **D-COMPENDIUM-MEM — eager full-source thumbnails are not a bounded catalogue
  (2026-08-13).** Up to 1,500 rows can synchronously paint/mount 440px data URLs before the
  asynchronous 132px cache result exists, so entry-count caches do not bound decoded DOM
  images. Window rows/jobs, swap to actual thumbnails, budget decoded pixels/bytes and prove
  a warm plateau with an unbounded/no-disposal negative control before the inventory arc.
- ☐ **D-AUTOEXTRACT-CLOCK — legacy Auto-Extractor accrual still trusts `Date.now()`
  (2026-08-13).** Clock-forward plus reload/visit can mint another bounded batch. Port it to
  persisted active-play progress with an absent-field migration and a clock-wind outcome test;
  never reuse the wall-clock pattern for companion missions.

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
  moonDescriptor, empty-cell galaxiesInCell — which hid a `GAL_SPRITES` failure on
  an uncached ordinary generated-galaxy branch). The WorldGen control now proves
  special-only success without the hook, exact ordinary-path failure without it,
  then deterministic success after the official hook installs.
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

- ★★★ **D-ART-169 — A DISPLAY NAME IS NOT AN IDENTITY WHEN THE CATALOGUE OWNS THE SAME NAME IN
  TWO SETS.** (2026-08-09, full-catalogue reset foundation.) GP7.1's reference loader keyed
  `fauna.json`, `flora.json`, and `other.json` rows by bare `name`; because `other` loaded last,
  it silently replaced the Earth-flora contracts for Green Algae, Reindeer Lichen and Snow Algae,
  and the Earth-fauna contract for Tardigrade, with their other-kingdom rows. Every packet still
  had a name, reference and valid hash, so completeness/provenance checks stayed green while the
  judge was shown the wrong required anatomy. The live loader now derives the catalogue set and
  keys `set + species`, rejects duplicate exact identities, and its self-test pins all four pairs;
  a bare-name negative control must reproduce and expose the collapse. **Every review, merge,
  comparison and package join uses the exact set/species identity. Human-readable names are labels,
  never primary keys.**

- ★★★ **D-ART-170 — A BRED SEED IS NOT A COMPLETE PORTRAIT IDENTITY, AND GENERIC PROCEDURAL
  ROUTING MUST NOT PREEMPT EARTH LINEAGE.** (2026-08-09, full-catalogue reset foundation.)
  `crossGenome` correctly wrote `_earthBlend` and `_anchorVal`, and the HD renderer correctly knew
  how to preserve the inherited Earth scaffold, but `resolveOverride` claimed every genome without
  `_earthName` first. Mapped children therefore became generic procedural bodies before lineage
  rendering could run. Independently, the portrait/thumb caches keyed a small seed/name tuple;
  reverse-parent crosses can share a derived seed while inheriting different traits, and two
  lineages/anchors could reuse whichever texture painted first. The live route now returns
  `_earthBlend` genomes to the lineage-aware renderer before procedural mapping, and both caches
  canonicalize the complete plain genome through one shared key. `hybridblendcheck` drives final
  browser pixels across actual Earth×Earth, Earth×alien, multi-generation, fauna/flora, lineage,
  anchor, repeat and cache-order outcomes, then rejects an injected bypass. **Test the rendered
  outcome and the full pixel input, not the presence of inheritance fields or a convenient seed.**

- ★★★ **D-ART-171 — A HASH-STABLE PORTRAIT CAN BE STABLY WRONG; HASHES PROVE WHICH PIXELS WERE
  REVIEWED, NOT WHETHER THE ORGANISM IS CORRECT.** (2026-08-09, Fruit Bat reset trigger.) Fruit
  Bat has the identical SHA-256
  `877AB8C2028350AF672E4B1E48979834FBCEEC1CE31651A360AD2796AF4B6C72` in GP7.1 r1, r2 and r3,
  yet direct review found a toy/rodent-like head, rigid paper-like membrane read, missing joined
  thumb/foot anatomy and intended species eyes overpainted by a later generic eye pass. Earlier
  PASS/POLISH language and green route/render gates therefore preserved a false acceptance across
  three perfectly traceable captures. The full catalogue is reopened: old hashes/bands are frozen
  evidence only, and a current PASS requires unlabeled identity plus every set-specific anatomical
  must-read, connected attachment/occlusion/material construction, family comparison and injected
  removal controls at gameplay and native scale. **Hash equality authorizes carry of pixels, never
  carry of judgement after the ruler or biological contract is shown to be wrong.**

- ★★★ **D-ART-172 — A MIXED-KINGDOM CHILD'S GAMEPLAY KINGDOM IS NOT THE OWNER OF ITS EARTH
  ANATOMY.** (2026-08-10, full-reset lineage repair.) The lifted breeding body selected an
  Earth lineage by name, but the renderer later inferred its catalogue from the child's own
  `kingdom`. That is ambiguous for Green Algae, Reindeer Lichen, Snow Algae and Tardigrade and
  wrong whenever the child inherited its kingdom from one parent and its Earth scaffold from
  the other. The typed genetics facade now carries the selected lineage's exact kingdom through
  the unchanged RNG/name pick as `_earthBlendKingdom`; art resolves that set-qualified owner.
  Fauna keeps the lineage-aware verbatim scaffold, while flora/fungi/microbe call the exact named
  owner with the child's complete genome unchanged. Old saves without the marker infer only from
  live route ownership under a stable fail-closed order. **A lineage name is not enough; store the
  catalogue that owns it at the moment deterministic inheritance chooses it.**

- ★★★ **D-ART-173 — A FAUNA-GREEN HYBRID GUARD CAN HIDE THREE BROKEN KINGDOMS.** (2026-08-10,
  mixed-kingdom outcome controls.) The first repaired route correctly returned fauna blends to
  the HD lineage scaffold and its browser checks went green, while flora, fungi and microbe
  `_earthBlend` children still had no equivalent lineage fallback and could be treated as generic
  procedural art. `hybridblendcheck` now drives final production pixels for every kingdom,
  set-qualified duplicates, both parent orders, lineage stripping, cache order and injected
  route failures. **When a field crosses a union of kingdoms, a representative from one member
  does not test the union. Enumerate every owner and assert the rendered outcome.**

- ★★★ **D-ART-174 — A HASHED DIRTY-WORKTREE CAPTURE IS REPRODUCIBLE DIAGNOSIS, NOT FETCHABLE
  CERTIFICATION.** (2026-08-10, hybrid/reset evidence foundation.) The first two hybrid matrices
  honestly recorded `HEAD 3528bfb` plus a complete source-file snapshot, and they reproduced the
  same pixel projection; they also honestly recorded that the art/app source was uncommitted.
  That is enough to preserve a finding and not enough for another machine to check out the exact
  state. Official reset layout/review tools therefore require the complete 40-hex current HEAD,
  reject dirty scoped source for preparation, bind every output to source and evidence hashes,
  and refuse an existing destination. **Freeze a clean commit before the official render; a hash
  manifest does not turn an uncommitted workspace into shared provenance.**

- ★★★ **D-ART-175 — CERTIFICATION BINDS THE RULER'S INPUTS, NOT JUST ITS FINAL PORTRAIT.**
  (2026-08-10, full-reset review contract.) A correct 440px hash can coexist with a signature
  that disappears at gameplay size, the wrong set's `mustRead`, or a historical comparison the
  reviewer never saw. The official 1,250-row workflow now binds each exact set/species verdict to
  native 440px pixels, an unlabeled 300px gameplay render, the actual unlabeled 132px thumbnail,
  the labelled old/current comparison, the hashed set-specific `mustRead` or procedural-plan
  payload, review date, source commit, and fixed attestation. The official layout is derived as
  181 families / 233 packets at a maximum of 10 rows; collection rejects partial, stale or
  mismatched inputs, and certification writes only for 1,250 fresh PASS.
  **If resolution, comparison, contract, ruler or source is not bound, the verdict is a comment,
  not certification evidence.**

- ★★★ **D-ART-176 — A COMPLETE FRESH BASELINE IS A REPAIR AUTHORITY, NOT AN AUTOMATIC
  CERTIFICATE.** (2026-08-10, full-reset r1.) The clean `bc26e8` capture bound all 1,250 exact
  identities to the full ruler and collected every row as **516 PASS / 14 POLISH / 720 FAIL**.
  `all_rows_fresh` and `all_required_evidence_reviewed` are true while
  `all_rows_literal_pass` and `literal_certification_eligible` are false. That distinction is
  intentional: a complete honest failure inventory is progress and cannot be relabelled as 100%.
  The result is frozen at `apps/game/smoke/full-reset-results-2026-08-10-r1/results.json`; later
  scoped PASS rows do not mutate it. **Freshness proves the baseline is usable; only every row
  passing authorizes certification.**

- ★★★ **D-ART-177 — A WHOLE-FORM EARLY RETURN DEFINES OWNERSHIP; DETAILS BEHIND IT ARE DEAD,
  AND A SECOND BODY AFTER IT IS A SEAM.** (2026-08-10, Wave-1 trees.) The first tree repair put
  later orchard, citrus, blossom and bark cues behind a broader whole-form branch that already
  returned. The source contained the requested code and the winning pixels could never reach it.
  Adding still more overlays would have produced double-painted attachments rather than one tree.
  The corrected shape gives each exact named reset tree one winning whole-form painter, returns
  before legacy bodies, and keeps accepted rows on their frozen route. Before fixing a named row,
  prove which branch wins; before removing an apparent duplicate, prove it owns no target/control
  pixels. **Route ownership is part of morphology: unreachable anatomy is absent anatomy.**

- ★★★ **D-ART-178 — PIXEL-NEUTRAL CLEANUP NEEDS CATALOGUE-SCALE PROOF, AND A SCOPED PASS IS
  NOT A NEW CATALOGUE TALLY.** (2026-08-10, Wave 1.) The cleanup made `strictSignature` and
  `resetTreeSignature` mutually exclusive for 39 overlapping names and removed impossible
  Apricot/Plum and post-return citrus alternatives. It was accepted only after **0/174 drift**
  across 58 tree target/control surfaces at 440/300/132 and **0/332 drift** across Earth-flora
  native portraits, with no unread/inert spec fields. Independently, the exact Wave-1 scope—root
  38 + fish 59 + trees 48 + fauna2 32—closed **177/177 scoped PASS**. Those changed rows cannot
  simply be added to r1's 516 because no post-wave 1,250-row collector exists. The integrated
  guard also found Apple's distinct lineage inputs rendered byte-identical stages. The bounded
  repair at source SHA-256
  `D3801E5A234D0D58DF6BAD1515D7583D53ED96C1939EABBE8B02376204503624` is independently
  judged PASS: 58/58 tree rows remain exact at 440/300/132 (174/174 hashes), all five stages are unique,
  and pure-distance strictly increases as the anchor falls. **Freeze and report the scope you
  actually judged; rerun the whole collector before making a whole-catalogue claim.**

- ★★★ **D-ART-179 — A RETAINED COMPATIBILITY ROUTE IS NOT A CURRENT CATALOGUE MEMBER.**
  (2026-08-10, hybrid-matrix schema v3.) D-CAT-1 makes flora Green Algae the one current roster
  identity while intentionally retaining the set-qualified microbe painter for old saves. The
  first live schema-v2 matrix had a real harness contract bug—not transient provenance: it falsely
  required both route owners to be current members and stopped before evidence capture. Schema v3
  repairs the provenance model by distinguishing current catalogue ownership from retained
  legacy-route ownership, exercises both production routes, and negative-controls relabelling the
  legacy microbe route as current membership. Its sentinels, selftest and TypeScript check are
  green; both stable browser orders validated 234/234 assets. That first v3 run still reported
  `FAIL_BYTE_IDENTICAL_STAGES` for pre-existing Vanilla Orchid; the later bounded r6 repair closes
  that focused defect under D-ART-180. **An audit must test compatibility surfaces without silently
  rewriting the roster it claims to measure.**

- ★★★ **D-ART-180 — A LINEAGE-DISTINCTNESS GATE MUST INCLUDE THE LINEAGE THAT ACTUALLY
  COLLAPSED, AND ITS NEGATIVE CONTROL MUST RECREATE THAT COLLAPSE.** (2026-08-10, Vanilla r6.)
  The first hybrid guard proved routing, owner selection, cache separation and several distinct
  lineages while Vanilla Orchid still rendered the same portrait at anchors 1.0, 0.90, 0.73, 0.46
  and 0.22. The bounded repair is independently PASS at `floraoverrides2.ts` SHA-256
  `5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E`: the pure portrait stays
  byte-exact, all five stages preserve defining Vanilla organs with continuous joins, and pixel
  distance from pure increases as the anchor falls. The r6 matrix validates 234/234 assets in both
  browser orders. This repair introduced a guard with five exact ID+kingdom+name focused lineages spanning all four kingdoms and
  eleven injected failures; the current guard has since grown to **fourteen**, including focused-species substitution, a simulated Vanilla stage collapse and protected-route controls. **A representative
  lineage test cannot protect an omitted lineage; put the reported failure itself in the positive
  set and reproduce it in the negative set.**

- ★★★ **D-ART-181 — A BOUNDED CHECKPOINT IS OPEN UNTIL ITS LAST CHANGED PIXEL HAS AN
  AUTHOR-SEPARATED PASS.** (2026-08-10, Wave 2a.) Mammal A closed 4/4 and INVERT worms+sessile
  closed 13/13 under independent 440/300/132 review, exact repeats and protected controls. The
  S1–S3 first pass returned 11 PASS / 4 FAIL—Caddisfly, Diving Beetle, Firefly and Water Beetle.
  Bounded R2 changed exactly those four; its independent judge returned 4 PASS / 0 FAIL, all 156
  current/repeat PNGs are complete and exact, and all 22 protected rows remain byte-identical at
  every scale. The combined checkpoint therefore closes 32/32 scoped PASS. Neither that closure nor
  its component counts may be added to the frozen 516/14/720 ledger; only a new complete collector
  can make a catalogue claim. **Source completion and green author gates are evidence inputs; the
  last changed pixel still requires author-separated review before a checkpoint can close.**

- ★★★ **D-ART-182 — NATIVE DETAIL DOES NOT RESCUE A REQUIRED CUE THAT DISAPPEARS AT CARD SIZE;
  FAIL CLOSED, REOPEN ONLY THE NAMED BLOCKER, AND FREEZE EVERYTHING ALREADY ACCEPTED.** (2026-08-10,
  Wave 2b.) The first independent Mammal B round returned 19 PASS / 6 FAIL, and the first Bird B1
  round returned 17 PASS / 4 FAIL, even though all assigned source branches and changed pixels were
  present. Bounded follow-ups repaired only Brown Bear, Grizzly Bear, Bobcat, Lynx, Serval and Sand
  Cat in Mammal R3, and only Secretary Bird, Rhea, Seriema and Hummingbird in Bird R2; second judges
  closed both groups 25/25 and 21/21 while retained targets and controls stayed exact. Invert I's own
  first candidate likewise stopped on Banana Slug because four tentacles and their tip eyes did not
  survive 132px; a Banana-only refinement changed 3/3 surfaces while the other four targets plus 20
  controls remained 72/72 exact, then an independent judge closed the lane 5/5. Wave 2b therefore
  reaches **51/51 scoped PASS**, with final source SHA-256 values `288E5479…E7DAE` (quadruped),
  `2BB35419…CEAA` (mammal), `783DCCE7…BF10` (fauna), `B5DEBDCA…94DF` (bird), and
  `9173B817…B1D` (invert). The final integrated gates passed with those sources unchanged, making the
  bounded checkpoint ready to commit/push. This does not update the frozen 516/14/720 ledger or close
  the reset PR, full recertification, ZIP, or release. **Judge the real delivery surface;
  a cue that exists only at 440px is absent from the game surface that needed it.**

- ★★★ **D-ART-183 — A CURRENT-ONLY PREVIEW CAN AUTHORIZE THE NEXT CAPTURE, NEVER THE FINAL
  VERDICT; THE ADMISSIBLE CLOSE IS SOURCE-BOUND A/B WITH EVERY ACCEPTED NEIGHBOUR FROZEN.**
  (2026-08-10, Wave 2c.) Mammal C needed five author preview rounds before its first shared
  independent close: 0/13 candidate-ready, then 8/13, then 11/13 twice while Red Panda's hidden
  leg roots and Tasmanian Devil's body-clipped chest band remained open. Bird B2's first independent
  shared judgment returned 25 PASS /3 FAIL on Eider Duck, Rail and Avocet. Their current-only bounded
  preview made the corrections visible but was explicitly provisional until a final A/B reproduced
  all nine changed surfaces and kept the other 25 targets plus 72 controls exact. Invert II likewise
  went from a 10/15 author preview to a 15/15 candidate, then correctly reopened after its first
  independent shared judgment returned 13 PASS /2 FAIL on Krill and Tadpole Shrimp. The final shared
  R2 changed only those five Bird/Invert identities, preserved the other 244 rows /732 surfaces, and
  closed all three lanes at **56/56 scoped PASS**.

  The admissible manifest is
  `apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10/evidence-manifest.json`, SHA-256
  `BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330`: 249 rows =56 targets
  +193 protected controls, 747/747 current/repeat surfaces exact, 579/579 protected surfaces exact
  to baseline, 168/168 target surfaces changed, three drift-free 139-file input snapshots and three
  rejected negative controls. Integrated gates passed with all five source hashes unchanged. **A
  preview answers “is this worth sealing?”; only the final frozen A/B plus independent judgment
  answers “did this row pass?”** This does not alter the frozen 516/14/720 catalogue ledger or close
  recertification, ZIP, reset PR, merge, release or deployment.

- ★★★ **D-ART-184 — A PIXEL-NEUTRAL ROUTE CLEANUP AND A VISUAL REPAIR CAN SHARE A BATCH ONLY
  WHEN THE SAME PRE-EDIT UNION PROVES WHICH ROWS DID NOT MOVE.** (2026-08-10, Wave 2d, begun from
  committed/pushed Wave-2c checkpoint `dc015cf`.) Three
  code-quality items had been correctly deferred at the Wave-2c evidence boundary: Mammal C's
  implicit `marsupial-c1` dispatcher arm, Skua's unreachable Snow-Petrel colour alternative, and
  exact Invert-II legacy non-hue options shadowed by named early returns. Wave 2d made the dispatch
  explicit and removed the dead alternatives only after one shared pre-edit baseline bound every
  new target and every prior accepted route. The final R4 manifest proves all 254 protected rows /
  762 surfaces are byte-identical while all 50 intended targets /150 surfaces changed. “The branch
  is unreachable by inspection” was not accepted as pixel proof.

  The same union preserved fail-closed visual review. Mammal D reopened six author-screen rows,
  then independently reopened Civet alone for a still-round muzzle; Civet-only R4 changed 3/3
  surfaces and retained the other 303 rows /909 surfaces. Bird B3 moved 11/27 →24/27 →27/27 by
  changing exact blocker sets, and Invert III moved 5/7 →7/7 by changing only Camel Spider and
  Tarantula. Final author-separated verdicts are **50/50 PASS**. The admissible manifest is
  `apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10/evidence-manifest.json`, SHA-256
  `DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE`: 304 rows =50 targets
  +254 protected controls, exact 912/912 A/B surfaces, 150/150 changed target surfaces, four
  rejected negative controls, and three drift-free 139-file input snapshots. Integrated gates
  passed with all five source hashes unchanged; the bounded checkpoint was then committed/pushed as
  `2ed0f28`.
  **A dead-source proof is necessary to propose cleanup; a frozen before/after pixel union is what
  permits it to ship beside morphology work.** This does not update r1's 516/14/720 ledger; full
  certification, the image-inclusive ZIP, reset PR, merge, release, and deployment remain OPEN.

- ★★★ **D-ART-185 — A QUOTED VALUE IS NOT AN OBJECT KEY; A SOURCE SCANNER MUST CLASSIFY
  GRAMMAR POSITION, NOT TOKEN SHAPE.** (2026-08-10, Wave 2e Mac resume.) `overridecheck` treated
  every depth-1 string in an override table as a route key. The 21 exact-name
  `faunaESquamata(..., 'Name')` plan arguments therefore appeared to duplicate their real
  `FAUNA2_NAME` properties even though the live object contained each key exactly once. The repair
  delegates each complete TypeScript art source to pinned Rolldown 1.2.1/Oxc and counts only literal
  string property/array AST nodes. Every such key is validated regardless of length or alphabet,
  and malformed CANON keys cannot disappear. It separately guards call arguments and ternary values,
  then proves later duplicates survive template/regex, control-head/member-call,
  Unicode-identifier and restricted-production ASI traps. Full-source declaration traversal covers
  parenthesized, annotated, comment-separated and later `const` declarators; post-declaration
  writes/aliases and malformed route-table source exit 2. Genuine duplicate/dead/shadowed/unwired mutations must exit exactly 1
  with their own diagnostic; parser damage cannot satisfy a finding control. **A hand lexer that
  finds the right words can still make the wrong
  syntax tree; bind findings to parser-owned grammatical nodes instead of reimplementing the language.**
  The denominator now follows the same rule: parse the one exact four-kingdom `_EARTH_NAMES`
  literal and pin its read-only consumer, so quote style and post-initializer mutation cannot
  silently change what “complete” means. Recursive `.ts`/`.mts`/`.cts`/`.tsx` discovery rejects
  untracked executable imports/re-exports, and imports resolve through the actual exported binding.

- ★★★ **D-ART-186 — AN IGNORED EVIDENCE ROOT IS A ONE-MACHINE CLAIM UNLESS ITS BYTES OR
  RECONSTRUCTION RECIPE CROSS THE HANDOFF.** (2026-08-10, Wave 2e Mac resume.) The Windows handoff
  recorded a 288-row/864-surface pre-edit seal and index, then committed only the hashes because
  `apps/game/smoke/` is ignored. Develop carried the 47-target source checkpoint but neither the
  protected roster/PNGs nor the one-off scoped capture and negative-control implementation. On Mac,
  the source hashes were verifiable and the advertised baseline was not. Review stopped before the
  first post-edit render. **A hash proves supplied bytes; it cannot recover missing bytes, scope, or
  procedure. Cross-machine evidence must be published with an immutable manifest and reproducible
  tracked producer, or continuation fails closed until the exact root is recovered.**

- ★★★ **D-ART-187 — A NAME ANYWHERE AFTER THE CONSUMER IS NOT WIRING PROOF.** (2026-08-10,
  Wave 2e Mac resume.) `overridecheck` sliced from `resolveOverride` to end-of-file, then searched
  that suffix for each table name. The later `OVERRIDE_COUNT` summary named nearly every table, so
  disconnecting one from the actual resolver still looked wired; the old control happened to use
  `FLORA2_SPEC`, the one table absent from that summary. The repair parses exactly the
  `resolveOverride` function body and counts only lookups in the actual `canon`/`iconic`/`dupe`/
  `fp`/`quad`/`painter` selection initializers **after validating their exact precedence and executable
  guard/call/fallback/furniture chains into the returned canvas**. One control removes `FAUNA2_NAME` from
  `fp` while its later summary mention remains and must report the exact unwired table; another
  leaves an inert exact lookup/property label outside the audited chain and must exit 2. Further
  controls preserve an intact initializer but disconnect its downstream renderer, make the
  duplicate/quadruped predicates unreachable, or sever `fitInk` from the returned canvas; all must
  fail closed. Computed members and methods are accepted only at the exact audited `[name]`,
  kingdom-qualified CANON, and `FLORA_DUPES.includes(name)` consumer nodes; spelling an unrelated
  binding `name` is not provenance. A provenance control replaces the imported table with an empty
  same-named local; recursive source discovery plus normalized full-path and actual-export ownership
  also reject nested same-basename/export impersonators. Shadow diagnostics follow the audited resolver priority, not
  alphabetic file traversal, and a conflict-direction control proves that ordering. Painter values
  must resolve to statically callable immutable/unwritten local/import bindings (quadruped specs to
  objects), and factories must return direct callables; `null!`, mutable aliases, parameter returns,
  and truthy objects cannot masquerade as live painters. Exact resolver parameters, stable/unwritten
  canvas-helper bindings/implementations, and audited direct trusted-global contexts prevent helper/global shadowing. Global
  single-owner/import-owner checks reject that impersonation; ownerless imports and table alias/
  callback escapes are parser damage; and incomplete
  kingdom-qualified route coverage also fails. **Bind a wiring claim to the consumer node that performs the lookup, its
  declaration/import provenance, and negative-control both non-reference syntax inside that
  consumer and a repeated symbol outside it. This sentinel assumes standard unmodified platform
  intrinsics and approved dependency implementations; arbitrary hostile monkey-patching, dependency
  poisoning, and visual correctness remain outside its static claim.**

- ★★★ **D-ART-188 — CORRECT LINEAGE METADATA DOES NOT PROVE CONTINUOUS LINEAGE PIXELS; BIND
  THE PURE AND BRED STAGES TO ONE REVIEWED WHOLE-FORM OWNER.** (2026-08-11, Platinum
  current-generation review.) The clean `79ce144` package carried correct deterministic
  `_earthBlend`, `_earthBlendKingdom`, `_anchorVal`, cache identity, and fresh/repeat hashes, yet
  Fruit Bat, Eagle, Wolf, Dragonfly and Octopus visibly replaced their pure modern scaffold at the
  first bred stage. The router admitted `_earthBlend` directly only for flora/fungi/microbe; fauna
  therefore fell through to a retained HD compatibility painter while `_earthName` pure rows used
  newer exact-name whole forms. Distinct hashes proved change, not continuity. The governing review
  is preserved at
  `reference/Celestial_Frontier_Current_Full_Generations_Platinum_Review_2026-08-10.md`, SHA-256
  `5af3a33f0648f96115a421ea64cc70f97846f62e89dc8631deeb310103c708c2`.

  The repair is deliberately not a catalogue-wide fauna migration. Only the seven reviewed rows
  (Fruit Bat, Eagle, Wolf, Elephant, Chameleon, Dragonfly, Octopus) move through their modern
  set-qualified owner and a deterministic anchor-bounded trait adapter; Sea Turtle and Great White
  Shark remain frozen on the compatibility route that the same reviewer passed. Pure named pixels
  are protected. Apple, Vanilla Orchid and Oyster Mushroom receive stronger bred-only progressive
  drift, and Amoeba becomes the principal microbe row. Schema v4 therefore binds 13×5 principal
  stages and 251 hybrid assets and negative-controls both a reviewed-fauna fallback and a protected-
  fauna migration. **A route/seed/hash gate can establish provenance and determinism; continuity
  requires the exact pure-to-bred whole-form sequence under a versioned human ruler. Preserve old
  verdicts as historical evidence, mark them stale for the broader scope, and write a new immutable
  package instead of overwriting either one.**
