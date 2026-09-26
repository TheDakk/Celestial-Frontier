# battle2 — battle scene v2 (A3)

Matches code as of 2026-09-19 (E1.1–E1.4 coded; see the E1 section), except the parts updated 2026-09-24, which match code as of 2026-09-24: the `arena.ts`, `stage.ts`, `habitat-arena.ts` and `placement.ts` rows of the table, the flag-gated wiring paragraph, the "Superseded 2026-09-24" note in the D2 G6 section, and the whole "Painted library in the arena" section (presentation rule, wet arena, matchup picker). Consumes the A1 motion compiler, the A2 effects sequencer and the A5 world-life adapter; implements MOTION_KIT §5 timing and §7 ARENA staging. Everything but `stage.ts` is pure and clock-free; the stage takes an injected clock.

| File | Owns |
|---|---|
| `arena.ts` | D2 G6 (2026-09-21): `combatantScale(..., { frameFill })` — a frame-fill target in [1/2, 1] for apex guardians (kit GUARDIAN RULE); absent, byte-identical to the mass-class rule (`arena-frame-fill.test.ts`: fill within 2 % on 720/1080, identity, bounds). Wired to the guardian record since D2 G6 (below). |
| `arena.ts` (existing) | `composeArena` (plates at .10/.50/1.20 with overscan, stands at x = 1/3 and 2/3 on the ground line), `parallaxOffset` (pure function of the run-up displacement), `combatantScale` (creature height 1/3..1/2 of frame by mass class), `fitCombatantWidth` (2026-09-24: caps a painted width at `COMBATANT_WIDTH_FRACTION_MAX` 0.42 of the frame width; never raises a scale), `selectArena` (home-versus-visitor rule, seeded pick with mulberry32; returns a recipe id only). |
| `fixture-rig.ts` | `CreatureRigV1` (CONTRACTS §2) + `BattleRigV1` (adds cut-out size, foot anchor, label). `cutFixtureParts` partitions the keyed alpha by nearest bone segment into 19 parts (head group, neck, torso, 4 × leg upper/lower/paw, tail0..3), each pivoting at its parent joint, layered far/near; with `underlapPx` / `underlapByLimit` every ancestor also carries its descendants' cut bands beneath them (parents drawn first, `FIXTURE_DRAW_ORDER`) so joints do not open wedges when they rotate (batch 4). `rig-render.ts` renders a cut in a pose without a browser for gates. `solvePose` is forward kinematics over the motion template GRAPH. `createFixtureRig` binds parts to sprites through a structural factory. Label: `fixture rig (landmark-derived parts)`. |
| `fallback.ts` | Whole-portrait rig (one sprite, foot pivot) and root-offset clips taken from the action library's own root tracks, so a portrait's beats land on the same milliseconds as a rigged combatant. Label: `whole-portrait fallback (no landmark record; hit pose approximated by root offsets)`. |
| `choreography.ts` | `buildTurnPlan` → absolute ms for ready, command, approach (≤ 500, mass-scaled), action, impact (= effect `impactAt`), hitstop (70 × attacker mass, cap 140), flash (2 frames + 120), shake (6 px × mass over 180), damage number (90 / 420 / 160), reaction (hit / dodge / faint), return (≤ 500), idle. `sampleTurn(plan, ms)` → stage state. Idle runs additively under every one-shot with its clock frozen through hitstop. Melee themes hold the sweep across both stands and reveal by alpha; cast themes slide origin → contact. Reduced motion: ready-state pose, no shake, no flash, no effect; the number is shown static. |
| `stage.ts` | `BattleStage` (structural Pixi 8: plates, world life, two rig holders, effects container, near plate, flash, timing bar, cursor, damage number) and `turnPlanInputFromTranscriptEvent`, the combat outcome adapter from a `SettledDuelTranscriptV1.log` entry (`{side, an, dn, dmg, crit, hpA, hpB}` / `{dodge:true, an, dn}` / `{stun:true}` / `{tick:true}`) to a `TurnPlanInput`. Champion A stands left, defender B right. Since 2026-09-24 also `combatantPresentation` (the one sizing rule), `standCentreShift`, the optional wet arena (`water`, `WATER_BANDS`) and `bodies()`; see "Painted library in the arena". |
| `parts-rig.ts` | (E1.1) `createPartsRig` — `BattleRigV1` kind `'parts'` around Codex's source paint-skin `CreatureRigV1`: every stage pose goes through Codex's performance owner and the contact solver (family solver; quadruped bindings keep the compatibility solver until the Civet sentinel passes on the family path), refusals are counted and leave the last valid pose (R4/Q3 interim), `jointPosition(joint)` reads the resolved skeleton for the outcome tests. Imported by path, never through `index.ts` (pixi.js typing note in the file). |
| `habitat-arena.ts` | (E1.3) `selectHabitatArena` — Codex's `compileHabitatBattle`/`containHabitatBody` decide each side's medium and band on the home/visitor world (or the labelled dry Earth-temperate default); READY gives the stands' y (ground line, or the body contained in its band), UNSUPPORTED returns the reason and both habitats, never a clipped sprite. Since 2026-09-24: `fitToBand` (`BAND_FILL` 0.9), `surfaceY` in the READY result, and `lakeArenaWorld`; see "Painted library in the arena". |
| `placement.ts` | (2026-09-24) `placeCombatants` — the one placement pipeline the app wiring, the film harness (`tools/battle2-proof/native-entry.mjs`) and the matchup tests share: size (`combatantPresentation`) → habitat with band fit → drawn scale → each painted box centred on its stand → the wet arena. Returns the staged layout, `presentationScales` only when a side was capped or fitted, and `water` when a side is in water; UNSUPPORTED carries the habitat's reason. |
| `cue-plan.ts` | (B1) `buildTurnCuePlan` places the Sound Kit §4 cues on the turn beats (the ability impact cue is the hitstop frame) and admits them per beat through the §5 mix; `TurnCuePlayer` fires them once each from the injected clock and drops anything later than 90 ms. |

Per-ability effects (B2): `effects/theme-library.ts` resolves every kit theme; Wild plays its painted sequence, the other ten play a labelled procedural emitter in the theme's material colour until their sequences are painted. The stage resolves emitters and tint by `plan.theme`.

## Flag-gated wiring (A6 part 2)

`apps/game/src/battle2-wiring.ts` mounts the stage over the Chronicle mount under `?battle2=1` (one guarded dynamic import in `main.ts`): pixi classes passed in, asset fetch by audit path relative to the shipped arena recipe (`/battle2/…`, see "Painted library in the arena"; the fetcher keeps its old name `devAssetSource`), Codex's keyer (`kit-contact-math.mjs`, static import) from the kit runtime route, `createPartsRig` for a combatant with a registered painted fit (E1), else `createFixtureRig` for a landmark record with a registered keyed master (today only the Civet's) and `createPortraitRig` otherwise, each combatant's theme from the combat domain (`abilityTheme`), the transcript log fed through `turnPlanInputFromTranscriptEvent` → `stage.play` → `stage.tick` on the app ticker with `performance.now` injected. `status()` reports rigs, effects (painted / procedural per side), voices (batch 3: one derived voice per side from its record or genome) and audio (the cue log; main.ts passes the accessible audio owner's `decorativeVoicePort()`, so the runtime's own admission still rules every cue). The Chronicle log stays the accessible owner of the outcome; the stage never changes HP or rewards.

Open A3 defaults recorded for Nick: melee themes = `wild, stone, sand` (others cast); run-up = 55 % of the stand distance; damage number rises 7 % of frame height from 30 % above the ground line; cursor blink 250 ms; idle tail 600 ms after the last beat.

## E1 — battle2 integration (Track B), coded 2026-09-19 against Codex's signed producer `6a58e40e` (local merge)

Design: `audits/ANATOMY_REVIEW_20260917/E1_BATTLE2_INTEGRATION_DESIGN.md`. Delivered here: E1.1 parts-rig adapter (`parts-rig.ts`),
E1.2 attack-driven turn plan (`TurnPlanInput.attack`, `TurnAttack`; the action clip is the anatomy timeline and `impactAt − actionStart =
contactMs`; `effects/sequencer.ts` takes `impactAtMs` so the effect schedule lands its impact on the same instant, still a hard error if it
cannot), E1.3 habitat arena selection (`habitat-arena.ts`, wired before staging), E1.6 reduced motion (one rest pose per turn in `play()`,
no per-tick rig update), and the `RigPoseContext` every stage pose now carries (`CombatantSample.context`: clip id, elapsed, duration, blend
weight, stance, travel owner). Outcome tests (`e1-outcomes.test.ts`, `parts-rig.test.ts`, beside the app): the Civet bite pays (contact
instant = effect impact = ability cue placement = damage number, jaw arrives at the target); no refusal in play for the Civet (attacker and
target) and for the five crabs as targets; habitat refusal is visible; reduced motion holds the rig at rest.

Interim, labelled, pinned by `it.fails` so the pins flip green when Codex's R3 lands: (1) `ContactPhase.travel:'stage'` — today the solver
still adds its own stride dx during the run-up and stance feet plant to the body, not the arena; (2) a crab cannot attack — the current
producer admits no brachyuran melee for `weapons []` (S4), so crabs stage as targets and `status().attacks` names the reason; (3) `pinch`
is not an admitted anatomy attack for the Crab. Quadruped bindings use Codex's preserved compatibility solver until the Civet sentinel
passes on the family path (R1c-b).

### E1.5 — native proof (2026-09-19)
`tools/battle2-proof/native-runner.mjs` films two real fits on the real stage in Edge (`audits/BATTLE2_E1_PROOF_20260919/`:
five Civet-vs-crab runs, zero refusals, CPU p95 ≈ 2.2 ms at 60 fps, review sheet). The film caught two defects the
numeric gates could not: the parts rig's display units are normalized (it was drawn 0.3 px tall — `cutout` is now 1×1
with `sourceSize` for pixels), and the quadruped victory rear-up cannot be a planted stance (`plantedFor` frees it).
Observations for Nick: the contact gap stops at a crab's leg tips (silhouette box), and the fainted crab stands back up.

### A2 — planted cadence (2026-09-22, matches code as of 2026-09-22)
The approach walks whole gait cycles (≤ `APPROACH_CADENCE_CAP_MS` 900) with stance feet fixed in the arena — the stage
passes the forward body-length displacement per tick to the family solver — and the attack's lunge covers the rest
by impact. Each parts rig measures its `stanceReach` at load (both half-cycles × 0.9). `a2-cadence.test.ts` asserts
< 0.5 px per stance window from both sides on the five crabs, the Civet and the bear.

### D2 G6 — the guardian on the stage (2026-09-22, matches code as of 2026-09-22)
A record with a `guardian` block (D2: desktop-only, 5 ms CPU tier, 60 px comparison bound) reaches the stage as
`BattleRigV1.guardian`; the stage scales it with `combatantScale(..., { frameFill: GUARDIAN_FRAME_FILL, tallestHeight })`
— an option of the existing scale, never a species branch. The parts rig measures `tallestHeight` at load through its
public path (largest upward landmark rise across approach / the anatomy attacks / hit / dodge / faint / victory; crab
×1.00, Civet ×1.26, bear ×1.38 of rest) so the fill sizes the TALLEST pose (0.96 of the frame → the bear stood at 0.70).
Superseded 2026-09-24 by the one presentation rule below: at 0.70 the bear's victory rear-up left the top of the frame
(this section's test played only the attack), so the top cap now holds it at 0.551 of the frame at rest.
`composeArena(recipe, frame, { guardianSide })` moves the stands to
`GUARDIAN_STANDS` (0.30 guardian / 0.82 opponent, mirrored on the right); the game wiring and the native entry compose
the arena after the rigs so they know the side. Without a guardian block every number is byte-identical to before
(`arena-frame-fill.test.ts`, `d2-guardian-fill.test.ts` 9/9, `e1-outcomes` guardian case, `a2-cadence` 14/14). Films:
`audits/BATTLE2_D2_GUARDIAN_FILM_20260922/` (bear-vs-crab -01 rest fill / -02 tallest-pose fill; crab-attacks-bear);
review sheet `audits/VISION_D2_GUARDIAN_20260921/G7_SHEET/`. The bear's static RED under OBSERVED painted supports is
Codex's (hindFarAnkle residual plateau); the stage plays REST supports (`G6_CLAUDE_REVIEW.md`).

## Painted library in the arena (2026-09-24, matches code as of 2026-09-24)

Every painted archetype fights on the real stage. The card side of the same library (morph params, palette roles, card
masters) lives in `apps/game/src/morph/` and is not restated here; anatomy, motion, contact and painting internals are
Codex's (`creature-rig*.ts`, `anatomy-attacks.ts`, `battle-habitat.ts`).

### One list, three generated files
`tools/morph/build-card-masters.mjs` `CARD_ARCHETYPES` is the only list of painted archetypes: 17 today (Crab, Coconut
Crab, Freshwater Crab, Mud Crab, Vent Crab, Civet, and one per body plan from Codex's archetype sprint: Salmon, Eagle,
Beetle, Python, Tree Frog, Chimpanzee, Starfish, Tarantula, Octopus, Fruit Bat, Centipede). Its `generatedSources` generates the text of, and the builder's run writes,
`apps/game/src/morph/card-archetypes.ts` (the card registry), `apps/game/src/painted-cards.assets.ts` (explicit `?url`
imports, painted masks included) and `apps/game/src/battle2-archetypes.ts` (`BATTLE2_PARTS_FITS`: each fit directory
relative to the arena proof directory, plus `markingsDir` when the masks live outside the fit, as the Salmon's do), so a
creature on the card can always fight. `battle2-wiring.ts` `BATTLE2_ASSETS.partsFits` is that generated list. The drift
gate is `apps/game/src/battle2-archetypes.test.ts`: the three files equal the generator's output (a hand edit is caught),
the arena list equals the card list in the same order, every shipped mirror's `SOURCE.json` names its fit and seals the
fit's `recipeHash`, and every per-archetype file the wiring fetches (record, binding, keyed cut-out, manifest, atlas,
painter master, painted masks) exists at its served path.

### Shipped files and record sources
`tools/morph/build-shipped-battle2.mjs` (run from `port/v2`) copies, deterministically, into
`apps/game/public/battle2/audits/…`: the arena proof (recipe, Wild anchors, the three plates, the keyed phase images), the
Civet landmark record and master, and for every archetype its `record.json`, `binding.json`, `parts/keyed.png`,
`parts/manifest.json`, atlas, painter master (`record.source`) and painted masks. It keeps the proof folders' relative
layout and writes `MANIFEST.json` (path, bytes and sha256 per file). The wiring resolves every path against
`/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-recipe.json`, and `main.ts` imports the wiring only under
`?battle2=1`, so the files are fetched only then. They are never precached: the service worker's asset list is the Rollup
bundle (`apps/game/pwa-build.ts` `generateBundle`), which does not include `public/` (see Known limits).
The sprint records carry absolute painter-master paths into the OpenAI worktree.
`tools/creature-animation/record-source.mjs` `repoRelativeSource` rewrites a path under a Celestial Frontier worktree root
to repo-relative and refuses any other absolute path. It is the one copy, shared by the card builder, the shipped-files
builder, the parts-rig fixtures (`parts-rig.fixtures.ts`), the native proof runners (`tools/battle2-proof/native-runner.mjs`,
`archetype-native-runner.mjs`) and the wiring (`auditAssetPath(repoRelativeSource(source))`).

### Morphed fighters and the Tree Frog's pads
A fighter with a painted fit is its genome's individual on that archetype (`battle2-wiring.ts`): `individualFromGenomeV1`,
with the painted marking mask read from `markingsDir ?? dir` (`loadMarkingMask`; a pattern without a painted mask renders
plain) and a morphed atlas borrowed from `morphAtlasCache`; without a morphed atlas the rig loads the archetype's own
atlas as before. In `parts-rig.ts`, a record that declares adhesive contact pads (`geometry.contactPads`; today only the
Tree Frog) defaults to `contactSupports: 'observed'`, so the family solver models its painted supports by their observed
skin weights (`observedContactSupports`). Every other record keeps the `'rest'` default unchanged.

### The one presentation rule
`stage.ts` `combatantPresentation(rig, mass, frame, standY?)` is the one sizing rule for the game's battle stage. The
stage's own default (no `presentationScales`), `placement.ts` `placeCombatants` (which the wiring and the film harness
`tools/battle2-proof/native-entry.mjs` place through) and the library, matchup and guardian tests all call it. (Codex's
local unmorphed archetype study, `tools/battle2-proof/archetype-native-entry.mjs`, keeps its own measured sizing.) In order:
1. the mass rule, `combatantScale` (1/3 to 1/2 of the frame height by mass class); for a guardian, the decided
   `GUARDIAN_FRAME_FILL` 0.96 on its tallest pose (D2 G6);
2. the width cap, `fitCombatantWidth` (`arena.ts`): the painted width is at most `COMBATANT_WIDTH_FRACTION_MAX` 0.42 of
   the frame width, which bounds a long body (guardians are exempt);
3. given its stand line (and a rig that reports `extent`), the top cap: the tallest pose (`extent.up` above the foot plus the measured rise
   `tallestHeight − bounds.height`) stays `COMBATANT_TOP_MARGIN` 0.02 of the frame height inside the top edge.

It returns the scale, `capped` (smaller than step 1 alone gives), and the drawn `height` (for a guardian, of its tallest
pose) and `footBelowCentre` in frame fractions, the latter from the rig's real alpha box (`extent.up`) when the rig reports
one, and from the old centred-box assumption only when it does not. The top cap is why
the Brown Bear guardian now stands at 0.551 of the frame at rest instead of 0.70: `d2-guardian-fill.test.ts` now plays the
victory rear-up as well as the attack, asserts the top of the bear's landmark box stays inside the frame through both,
and prints `bearRestFillOfFrame` (0.551 at 1024×576 and 1920×1080, both sides).

### Band fit and centring
`habitat-arena.ts` `selectHabitatArena({ …, fitToBand: true })` (set by `placeCombatants`): an air or water
body whose presented height exceeds `BAND_FILL` (0.9) of its medium band takes `stand.fit` = 0.9 × band height / body
height, and its whole box is contained in the band at that size (scaled, never clipped); a ground body keeps `fit` 1.
Without `fitToBand` the size refusal stands for callers that do not scale. `placeCombatants` multiplies each side's
presentation scale by its `fit` and returns `presentationScales` (which the wiring and the film harness pass to the stage)
only when a side was capped or fitted; otherwise the stage computes the same rule itself.
The stage stands a rig's foot on `stand.x`. `standCentreShift(rig, scale, frameWidth, facing)` is the frame-width shift
that puts the painted box's centre there instead (from `extent.left` / `extent.right` at the drawn scale; zero for a rig
without `extent`). `placeCombatants` adds it to both stands of the staged layout the stage is built on, and the
choreography reads the same shifted stands, so run-up distances agree with what is drawn. The picker's first real-browser run caught
the case: a right-hand Python's tail left the frame.

### The wet arena
`habitat-arena.ts` `lakeArenaWorld(groundLineY)` is the accepted plates as a lake world (liquid water with a surface); the
wiring uses it for both worlds when the input has `worldPreset: 'lake'` and no `worlds`. The READY habitat result carries
`surfaceY`, where the habitat compiler placed the water surface. When either side's medium is water, `placeCombatants`
returns `water: { surfaceY, side? }` and the wiring passes it to `BattleStage`, which draws the ten `WATER_BANDS` (lit teal to deep blue-green) from
`surfaceY` to the frame bottom plus a `WATER_SURFACE` line, above the mid plate and behind the combatants, moving with the
mid plate's parallax; it refuses a `surfaceY` outside (0, 1).
- Full lake (no `side`: two swimmers, or a swimmer facing a flyer): three frames wide, and the dry near plate is hidden.
- A swimmer facing a GROUND fighter: `side` is the swimmer's side, the water covers that half up to the midline, and the
  near plate stays, so the ground fighter keeps its floor.

### Body-aimed impacts and the cursor
`BattleStage.bodies()` reports each fighter's painted box at rest (`topY`, `centreY`, frame-height fractions, from
`extent.up` at the drawn scale; a rig without `extent` is assumed centred), and `play()` fills `TurnArena.bodies` with it
when the turn input brings none. In `choreography.ts` `buildTurnPlan`, a
target that does not stand on the ground line (a flyer or a swimmer) takes the impact at its body centre (clamped to
0.02–0.98) and the damage number just above its painted top; a grounded target keeps the ground line exactly as before.
The target cursor keeps its old place half a frame above the stand unless that is less than 4 px from the top; then it
sits just above the target's painted top, clamped inside the frame.

### The matchup picker
`apps/game/src/battle2-matchup.ts` puts any two painted archetypes on the real stage without playing a battle:

`?battle2=1&vs=Left,Right[&world=auto|land|lake][&seed=N]` (for example `?battle2=1&vs=Python,Eagle`)

- Names are case-insensitive; an unknown or missing left name falls back to the library's first archetype, a right one to
  the first archetype other than the left; an unknown (non-empty) name or a bad seed leaves a note in the status line.
- The full-screen dialog has two lists of the painted library (`MATCHUP_NAMES`, from `BATTLE2_PARTS_FITS`), World
  (auto / land / lake; auto takes the lake when either side can only swim, `swimsOnly`), an individual seed, Play and Close.
- Seed empty: each side is its archetype's own genome, so the painting as painted. Seed a whole number (up to 9 digits):
  two morphed individuals (colour, accent, pattern from the seed, one lane per side, so a mirror match shows two).
- Play mounts the real study (`mountBattle2Study`) with a scripted five-row bout (`matchupTranscript`: left hits, right
  hits back, right dodges, right crits, left wins) and disposes the previous study; Close tears everything down.
- `main.ts` imports it dynamically only when both `battle2=1` and `vs` are present; it reads no clock and no `Math.random`.
- `battle2-matchup.test.ts`: under Auto every pair of the 17 × 17 resolves to a READY habitat with the real rigs sized by
  the app rule, and goes through `placeCombatants` to real turn plans both ways (attack, counter-attack, dodge) on a
  stage without a habitat refusal or a throw; the `main.ts` gate check carries mutation controls.

### Shipping, the service worker, the guardian and pacing (matches code as of 2026-09-24, day)
- **Shipped files.** `tools/morph/build-shipped-battle2.mjs` writes `apps/game/public/battle2/`. Each keyed cut-out ships as `parts/alpha.png`
  (the stage reads only its alpha), and each part binding as `binding.json.gz` (the asset source gunzips `.gz` and sniffs the bytes; the
  loader's binding hash is over the parsed JSON). `MANIFEST.json` records `derivedFrom` for both. The shipped arena is 48.1 MiB.
- **Pins.** The same builder writes `apps/game/battle2-assets.json` (`cf-battle2-assets/v1`, Codex's contract): every regular file under
  `public/battle2`, final bytes and SHA-256. The PWA build makes them first-use marker assets, and the worker verifies and caches each on
  first use. The 128 MiB pack cap counts them.
- **Guardian.** A guardian on the ground stands at `GUARDIAN_STANDS.groundY` (0.95, in the foreground); `placeCombatants` keeps every ground
  fighter on its composed stand line. The Bear rests at 0.673 of the frame.
- **Pacing.** With `input.pacer` (a `CombatChroniclePacerGateV1`; `main.ts` passes one under `?battle2=1` with motion on), the study
  releases each staged turn's Chronicle row at the turn's impact, and everything on finish, failure or dispose.

### Build-generated master pins, C13 (matches code as of 2026-09-25)
- **Generator.** `tools/morph/battle2-master-pins.mjs` (run by `build-shipped-battle2.mjs`, or alone) runs the EXISTING full byte admission of
  every archetype's retained original master (`admitFamilyRecord` against the keyed alpha, plus binding hash, record linkage and atlas hash),
  and only then emits a pin. It writes the checked-in `apps/game/src/battle2-master-pins.generated.ts`. A failed admission, a duplicate id, a
  malformed hash/dimension or a non-canonical path fails the build. Re-run it whenever the archetype list or a fit changes (the drift test
  regenerates the module byte for byte).
- **Authority is identity.** The generated module exports only `getBattle2MasterPin(creatureId)` and `isBattle2MasterPin(value)`, backed by a
  private `WeakSet` of its own frozen entries. Clones, JSON copies and look-alikes are not pins. The hash definitions are the one shared
  contract `tools/morph/battle2-pin-contract.mjs` (record = stableJSON UTF-8; binding = exact decompressed bytes; alpha/atlas/master = exact
  PNG bytes; paths canonical repo-relative POSIX, never resolved or decoded).
- **Preflight order in the wiring.** For a parts fit the study now fetches the manifest, looks up the pin (a missing pin is the named refusal
  `missing-pin`, never a master fallback), fetches the alpha/binding/atlas as raw BYTES and runs `preflightBattle2PinnedBytesV1`
  (`battle2-master-pin-admission.ts`) BEFORE any image decode, marking-mask fetch, morph-cache lease, master fetch or Pixi allocation. The
  binding is parsed from the hashed bytes, and the alpha is decoded exactly (`decodePng`) after admission. A refusal falls back to the fixture or
  portrait rig with its reason in `status().skipped`.
- **Masters stay shipped.** The loader's unchanged byte admission (`loadCreatureRigV1`) still hashes the master. Dropping masters from the
  package waits for Codex's narrow pin overload and its controls, then Claude's cold/worker/offline/picker checks (C4 §5).

### The real-duel picker and the ticker guard (matches code as of 2026-09-24, late)
- `?battle2=1&vs=A,B&duel=1` (or the "Real duel + Chronicle" checkbox): `matchupDuel` builds full genomes carrying each painting's visual genes
  and runs a real duel through the combat domain, the settlement, the cue plan and the Combat Chronicle. The picker mounts the Chronicle and the
  stage in `main.ts`'s order (pacer, start, stage), so the log is paced exactly as in the game.
- The study's tick is guarded: a throw fails the study (labelled) and never reaches the game's shared Pixi ticker. A body plan without a
  voice source set has no creature voice (labelled). `data-battle2-turn` and `data-battle2-ticks` on the section are smoke diagnostics.

### C15 wiring: READY spacing, full travel, declared weapons (matches code as of 2026-09-25)
- **`placement.readySpacing`**: the two painted boxes at rest keep `READY_GAP` (0.10 of the frame) between them and stay `EDGE_MARGIN` (0.02) from the sides. The stands spread first; the non-guardian bodies scale down only when the frame cannot hold both.
- **Run-up**: `stage.centresX()` feeds `arena.centresX`, so the run-up is measured box to box and travels to `CONTACT_GAP`. The old root-distance rule (capped at 0.55 of the stand distance) applies only when the centres are absent.
- **Reach**: `parts-rig` measures Codex's layered idle+approach reach (`creature-layered-stance-reach.ts`) and caches it by complete input (`layeredReachKey`).
- **Damage number**: a flyer's number starts at `NUMBER_TOP_MIN + NUMBER_RISE` or lower, so its whole pop and rise stay inside the frame.
- **Per-archetype fields**: `BATTLE2_PARTS_FITS` entries may carry `weaponDeclaration` (hash-bound, proven before play) and `contactSupports: 'observed'`.
- **Held rows**: `tools/morph/budget-held-archetypes.json`. Evidence: `audits/C15_WIRING_20260925/`.

### Known limits
- The Centipede's ARAP skin folds a triangle at 0.85× its default presentation scale (Codex's anatomy chain). The
  `SCALE SWEEP` in `library-arena.test.ts` pins it by its reason (`Centipede ×0.85` → `ARAP skin: unresolved folded
  triangles`), so the pin goes red the day the skin is fixed.
- The PWA service worker (`apps/game/pwa-build.ts`, not a battle2 file) answers 503 for any same-origin path that is not
  in the selected build's asset list, and `public/battle2/` is never in that list. On a page the worker controls (in
  practice, a reload of the playtest) every `/battle2/…` fetch fails and the arena cannot load until the study files get
  a network pass-through. Workaround: a private window, or unregister the worker.

### Tests and films
`library-arena.test.ts` (every archetype fights as attacker and as target with zero refusals; sizing to its place; band
containment from the real alpha box; wet-arena layering and drawing; centring on both sides; flyer impact and cursor; the
scale sweep), `battle2-archetypes.test.ts`, `battle2-matchup.test.ts`, `d2-guardian-fill.test.ts`. Films and the picker's
real-browser smoke runs: `audits/BATTLE2_LIBRARY_20260924/` (`film-all.mjs`, `picker-smoke.mjs`).
