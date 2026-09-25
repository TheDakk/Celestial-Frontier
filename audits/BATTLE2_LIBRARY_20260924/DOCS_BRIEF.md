# Facts brief for the reference-doc refresh (2026-09-24) — every claim here is in the code; cite files, not this brief

## Painted library + morph system on the CARD (port/v2/apps/game/src/morph/, tools/morph/build-card-masters.mjs)
- 17 painted archetypes (5 crabs, Civet, and Codex's sprint: Salmon, Eagle, Beetle, Python (open-pose fit), Tree Frog, Chimpanzee,
  Starfish, Tarantula, Octopus, Fruit Bat, Centipede). One list in build-card-masters.mjs GENERATES morph/card-archetypes.ts,
  painted-cards.assets.ts (explicit ?url imports incl. markings) and battle2-archetypes.ts. Drift test: battle2-archetypes.test.ts.
- The Compendium card shows the painted INDIVIDUAL on every device (Nick 2026-09-22 option 3): PaintedCardSource renders from a sealed
  ≤512² card master (morph-card.ts renderCardIndividualV1), one render per host task (yieldToHost).
- Genome → MorphParamsV1 (morph-params.ts): colour/accent genes → palette (17-colour table, luminance preserved); a gene equal to the
  archetype's own gene is identity (the painting is its own genome); head/tail genes → proportion (head 0.85–1.2, tail 0.7–1.35);
  pattern → painted marking masks where painted (Crab, Civet, Salmon: striped/spotted/banded/mottled/marbled/eye-spotted);
  lumin / iridescent → emissive lift (on the accent set, or the base coat when a plan has no accent — emissiveRoleV1).
- Palette roles (morph-palette.ts): ACCENT_GROUPS per BODY PLAN (brachyuran claws; quadruped ears+tail; fish fins; biped-bird head+tail;
  insect wings+antennae; serpent/hopper/cephalopod/myriapod head; radial centre disc (body); arachnid abdomen (tail); flyer-membrane
  ears+head; primate none = one coat). Everything else is base coat; a part on joint `root` is base unless it is the shadow
  (paletteRoleOfPart). Near-grey roles (mean saturation < 0.18: Salmon, Vent Crab, Chimpanzee) are TINTED (saturation floor 0.3).
- Long bodies (alpha-box aspect < 0.42: Python, Centipede, Salmon) turn 45° onto the card's diagonal, head end up (exact √½).
- Card = stage: role map (cardRolesV1), grey/tint decision, and proportion (cardProportionV1: nested scaled parts compose; fixed sockets
  from the family contract baked into the card receipt) are the same transforms the stage uses — pinned in morph-library.test.ts.

## Battle stage v2 (port/v2/apps/game/src/battle2/, battle2-wiring.ts, battle2-matchup.ts)
- All 17 archetypes fight on the real stage (battle2-wiring.ts BATTLE2_ASSETS.partsFits = BATTLE2_PARTS_FITS); files shipped in
  apps/game/public/battle2/ by tools/morph/build-shipped-battle2.mjs; fetched only under ?battle2=1 (never precached).
- Record sources: tools/creature-animation/record-source.mjs repoRelativeSource (sprint records carry absolute worktree paths).
- A record that declares adhesive contact pads (Tree Frog) defaults to observed painted supports (parts-rig.ts).
- ONE presentation rule, stage.ts combatantPresentation (also the stage's own default): mass rule (1/3–1/2 of frame height; guardians use
  GUARDIAN_FRAME_FILL on the tallest pose) → width cap COMBATANT_WIDTH_FRACTION_MAX 0.42 (not guardians) → given its stand line, the
  TALLEST pose (rig extent.up + measured rise) stays COMBATANT_TOP_MARGIN (0.02) inside the frame. The Brown Bear guardian is now 0.551
  of the frame at rest (was 0.70) because its victory rear-up used to leave the top.
- habitat-arena.ts selectHabitatArena `fitToBand`: an air/water body taller than BAND_FILL (0.9) of its band is scaled to fit (stand.fit);
  returns surfaceY; lakeArenaWorld(groundLineY).
- Each painted box is CENTRED on its stand (standCentreShift, rig extent left/right) — the stage stands the foot; a lopsided body hung off.
- Wet arena: BattleStage `water: { surfaceY, side? }` draws depth bands (WATER_BANDS) behind the combatants; full lake hides the dry near
  plate; a swimmer facing a GROUND fighter gets only its own half and the near plate stays.
- The stage reports each fighter's painted body (bodies()); a flyer/swimmer target takes the impact and damage number at its body; the
  target cursor stays on screen.
- Matchup picker: `?battle2=1&vs=Left,Right[&world=lake|land][&seed=N]` (battle2-matchup.ts) — full-screen arena with two lists of the 17,
  World auto/land/lake (auto = lake when a side can only swim), a seed for morphed individuals, Play, Close; mounts the real study with a
  scripted five-turn bout; loaded behind the same study gate. All 17×17 pairs are playable under Auto (test).
- Known: the Centipede's ARAP skin folds one triangle at 0.85× presentation scale (Codex's; pinned in library-arena.test.ts SCALE SWEEP).
- Known (Codex's): the service worker (pwa-build.ts) answers 503 for /battle2/* on a worker-controlled page — reloading the playtest
  breaks the arena until the study files get a network pass-through; workaround: a private window / unregister the worker.

## Tests that exist for these (cite): morph-library.test.ts, painted-cards.test.ts, painted-card-source.test.ts, library-arena.test.ts,
   battle2-archetypes.test.ts, battle2-matchup.test.ts, d2-guardian-fill.test.ts, e1-outcomes.test.ts.
