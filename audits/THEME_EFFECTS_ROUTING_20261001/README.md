# Theme effects routing — painted sequence per ability theme (2026-10-01)

Claude lane, branch `anthropic/overnight-theme-effects`. Goal (Dakk's vision): every attack shows a painted effect
for its ability theme, all 11 themes. Today only Wild is painted; the other 10 play the labelled procedural emitter.
Codex paints the remaining 10. This package is the Claude-side plumbing: **a delivered theme drops in with one
manifest row and no code change.**

## What was built

| Piece | File (under `port/v2/`) | What it does |
|---|---|---|
| Manifest | `apps/game/src/effects/painted-themes.json` | One row per painted theme (`cf.painted-theme-manifest/v1`). Today: Wild only. |
| Registry | `apps/game/src/effects/painted-theme-registry.ts` | Parses the manifest, fetches and admits each row's anchors, loads its phase images, and gives every one of the 11 themes either its painted sequence or the procedural emitter **with an explicit reason**. |
| Library reasons | `apps/game/src/effects/theme-library.ts` | `ThemeEffect.reason` (null when painted); `EffectThemeLibrary(painted, fallbackReasons)`. |
| Delivery validator | `apps/game/src/effects/theme-delivery.ts` | Pure check of one delivered sequence: anchors, phases, size, alpha, hash, bounds, registration, key fringe, material, budget. |
| Wiring | `apps/game/src/battle2-wiring.ts` | Loads every manifest row instead of the one hard-coded Wild anchors. It loads each painted theme's phase textures by sequence, and the status labels name a refused row's reason. |
| Shipping | `tools/morph/build-shipped-battle2.mjs` | Ships every manifest row's anchors and keyed phase images. With only the Wild row the shipped file set is identical; this was checked, and the tool was not re-run. |
| Tests | `tests/effects-painted-theme-registry.test.ts`, `tests/effects-theme-delivery.test.ts`, one new case in `apps/game/src/battle2-wiring.test.ts` | Registry outcomes, Wild unchanged, fallback reasons, drop-in, per-attacker theme, validator accept and reject. |

**Theme keys are the game's own.** The keys are `fire, frost, storm, tide, stone, venom, void, sand, chem, psionic, wild`,
the keys of CombatCore's `ABILITY_THEMES`. A test asserts that equality, and also that each material accent equals CombatCore's
`col`, so no theme hex has changed. A combatant's theme is `abilityTheme(genome)`, the combat domain's own roll.

**The stage uses the theme of the actual attack.** `turnPlanInputFromTranscriptEvent` stages each transcript row with
the ATTACKER's theme: `ctx[attacker].theme` gives `anchorsForTheme(theme)` and `deliveryForTheme(theme)`. That routing already
existed. New tests prove that two combatants of different themes play different sequences: painted Fire against
procedural Storm, painted Wild against painted Fire. They also prove that a dodge row stages the dodger's attacker theme. The wiring now loads
painted textures for every admitted theme. Before this change it loaded only Wild's, so a second painted theme would have thrown
`phase image … was not loaded`.

**Wild is unchanged.** The Wild row is `wild-anchors.json` in the arena proof directory with
`contract: "v4.2-grandfathered", required: true`. It produces the same anchors object, the same three requests
(`keyed/wild-launch.png`, `keyed/wild-travel.png`, `keyed/wild-impact.png`), the same library entry and a turn plan
whose JSON is byte-identical to the pre-registry load (tested). As before, a Wild anchors failure fails the study with the
same message (`battle2 anchors refused: <parser reason>`, or the fetch error unchanged).

Note for Dakk: the game still ships the **v4.2 Wild set** (1254 square, `audits/ARENA_EFFECTS_V42_PROOF_20260912/`).
The accepted **v4.3 Wild set** (1024 square, `audits/WILD_V43_PROOF_20260913/wild-anchors.json`) is the reference the
validator was derived from, and it passes every check. Switching Wild to it changes what is on screen, so it was not done. It is a one-row change
if you want it:
`{ "theme": "wild", "anchors": "../WILD_V43_PROOF_20260913/wild-anchors.json", "contract": "v4.3", "required": true }`.
The v4.2 set fails the v4.3 contract (size, per-phase registration, and `imageSha256` is the unkeyed master's). Only Wild may
be grandfathered; the manifest parser refuses `v4.2-grandfathered` on any other theme.

## Fallback reasons (what a theme that is not painted says)

| Situation | `reason` |
|---|---|
| No manifest row | `no painted sequence registered (no painted-themes.json row)` |
| Anchors JSON missing | `anchors <path> unavailable (<error>)` |
| Anchors refused by the parser | `anchors <path> refused: <parser reason>` |
| Anchors for another theme | `anchors <path> are for theme "x", not "y"` |
| A procedural record | `anchors <path> are a procedural record, not a painted sequence` |
| Not exactly 3 phases (v4.3) | `anchors <path>: a v4.3 delivery has exactly 3 phases … got N` |
| Canvas not 1024 (v4.3) | `anchors <path>: canvas WxH, a v4.3 delivery is 1024 square` |
| Duplicate sequenceId | `anchors <path>: sequenceId … is already registered by another theme` |
| Phase image missing | `phase image <path> unavailable (<error>)` |
| Phase image wrong size (v4.3) | `phase image <path> is WxH, its anchors say 1024x1024` |

The battle2 status shows a refused registered row as `storm: procedural emitter effect (…) (<reason>)`, and the reason is also
added to `skipped` as `storm effect: <reason>; procedural emitter`. A theme without a row keeps the plain procedural label.

## Delivery contract for Codex (one theme)

**Folder.** Use one audit folder per theme, for example `audits/THEME_EFFECTS_FIRE_<YYYYMMDD>/`. The paths below are relative to it.

**Images**, one per phase. Art Kit 4K/5 apply as written: one isolated phase per generation, painted on flat #FF00FF, then keyed.

| File | Spec |
|---|---|
| `<theme>-launch.png`, `<theme>-travel.png`, `<theme>-impact.png` | Original masters (optional for the runtime; recorded as `image`). |
| `keyed/<theme>-launch.png`, `keyed/<theme>-travel.png`, `keyed/<theme>-impact.png` | **The runtime inputs.** 1024 x 1024, 8-bit RGBA PNG (colour type 6), non-interlaced, no palette. Straight alpha. The 1-pixel frame border is fully transparent. |

**Anchors**: `<theme>-anchors.json` follows the accepted Wild v4.3 schema and is parsed by `effects/anchors.ts`.

```json
{
 "schema": "cf.effect-sequence-anchors/v1",
 "sequenceId": "fire-<ability>-v1",
 "theme": "fire",
 "abilityId": "magma",
 "phaseOrder": ["launch", "travel", "impact"],
 "canvasSize": { "width": 1024, "height": 1024 },
 "originAnchor": [0.2, 0.55],
 "contactAnchor": [0.8, 0.55],
 "phases": [
  { "phase": "launch", "image": "fire-launch.png", "keyedImage": "keyed/fire-launch.png",
    "imageSha256": "<sha256 of the keyed file bytes>", "canvasSize": { "width": 1024, "height": 1024 },
    "originAnchor": [0.2, 0.55], "contactAnchor": [0.8, 0.55],
    "alphaBoundsPixels": { "x": 0, "y": 0, "width": 0, "height": 0 } },
  { "phase": "travel", "...": "same fields" },
  { "phase": "impact", "...": "same fields" }
 ]
}
```

Field rules:

- `sequenceId` must be unique across themes, must not start with `procedural-`, and must match `[A-Za-z0-9][A-Za-z0-9._/-]*`.
- `theme` is exactly the game key.
- `originAnchor` and `contactAnchor` are normalized from the top-left and must differ. Paint left to right; the runtime mirrors for the right side.
- Each phase's anchors must be within **0.02** of the sequence anchors (shared registration).
- `alphaBoundsPixels` is the measured alpha box of the keyed image, within **±2 px**.
- `imageSha256` is the SHA-256 of the **keyed** file. This is the v4.3 convention; the v4.2 file hashed the master.
- `image` and `keyedImage` names are relative to the anchors JSON's directory and are distinct per phase.
- Extra fields such as `abilityName`, `direction` and `qualityAccepted` are allowed and ignored.

**Mechanical acceptance**: `theme-delivery.ts` checks the following.

| Check | Rule |
|---|---|
| size | Sequence canvas, every phase canvas and every decoded keyed image are 1024 square. |
| alpha | Real alpha channel; at least one transparent pixel; the frame border is fully transparent; the image is not empty. |
| fringe | Key-tinted edge pixels are no more than **0.375 %** of edge pixels. An edge pixel has alpha > 0 and either alpha < 255 or a transparent 4-neighbour. A pixel is key-tinted when min(r,b) ≥ 96, g ≤ 0.6·min(r,b) and \|r−b\| ≤ 0.4·max(r,b). |
| material | Pixels with alpha ≥ 128 within RGB distance 40 of the theme hex make up no more than **25 %** of the painted area (the hex is an accent, never the body). There are **zero** opaque interior pixels within distance 64 of #FF00FF. |
| budget | At most **3** phase textures. The theme's emitters (`THEME_EMITTERS`, already set for all 11) total **≤ 200** particles. |

How the thresholds were derived, all measured on 2026-10-01:

- **Fringe.** The accepted Wild v4.3 set measures launch 23/9289 (0.248 %), travel 53/28907 (0.183 %) and impact 23/11791 (0.195 %). The threshold, 0.375 %, is about 1.5 times the worst accepted phase. The same metric on the Wild registered copies that the review *refused* (before the second despill) reads travel 0.595 % and impact 0.630 %. Both fail, and that is the real negative control in the tests.
- **Accent.** The Wild accent share is 0 % for launch and travel and 0.025 % for impact. The 25 % ceiling only catches a hex painted as the body, so it is deliberately loose. Whether a material reads as the theme is Dakk's visual call.
- **Key inside the shape.** Wild has 0 such pixels.

**Validate a candidate before registering it** (from `port/v2`):

```sh
THEME_DELIVERY=audits/THEME_EFFECTS_FIRE_<YYYYMMDD>/fire-anchors.json THEME=fire npx vitest run tests/effects-theme-delivery.test.ts
```

The run fails with every finding as `{check, phase, reason}`.

**Register it**: add **one row** to `port/v2/apps/game/src/effects/painted-themes.json`. The path is relative to the arena directory
`audits/ARENA_EFFECTS_V42_PROOF_20260912/`, the same convention as `BATTLE2_PARTS_FITS`:

```json
{ "theme": "fire", "anchors": "../THEME_EFFECTS_FIRE_<YYYYMMDD>/fire-anchors.json", "contract": "v4.3" }
```

Every `v4.3` row is then validated from its files by `tests/effects-theme-delivery.test.ts` on every test run. A broken
row still cannot break a battle at runtime: it falls back to procedural with its reason.

**Ship it**: re-run `node tools/morph/build-shipped-battle2.mjs` from `port/v2`. That step is data only. It copies the anchors and keyed images
into `apps/game/public/battle2/` and refreshes the PWA pins. Watch the shipped-pack cap: at most 128 MiB, about 48 MiB used on 2026-09-24.

**Runtime timing to paint for.** Melee themes (`wild`, `stone`, `sand`) hold the travel image as a short sweep across both
stands. Cast themes (all the others) slide travel from origin to contact. The impact is placed at the target's contact on the ground
line (y = 0.78), holds 240 ms after the hitstop and fades over 120 ms (Motion Kit §5).

## The 10 themes still to paint (Art Kit v4.3 §4K theme material table, verbatim rows)

| Theme key | Material and shape vocabulary | Accent (game hex) | Runtime delivery | Abilities (CombatCore) |
|---|---|---|---|---|
| fire | flame tongues, embers, char, heat shimmer as shape | #ff7a4a | cast | Magma Strike, Ember Coat, Cinderburn, Wildfire, Pyroclasm |
| frost | ice shards, rime, frozen mist, crystal shatter | #8fd6ff | cast | Frostbite, Glacial Hide, Rime Mend, Cold Snap, Shatterfrost |
| storm | forked arcs, charged dust, cloud rupture | #ffe06a | cast | Chain Lightning, Static Field, Thunderclap, Stormrider, Voltaic Surge |
| tide | water sheets, spray, foam crest | #5fd0c8 | cast | Riptide, Pressure Crush, Tidal Renewal, Slipstream, Undertow |
| stone | rock shards, grit, cracked ground | #caa06a | melee | Stone Hide, Tremor, Bedrock Stance, Boulder Charge, Burrower's Guard |
| venom | droplets, spatter, corroding film | #9fe06a | cast | Venom Strike, Toxin Bloom, Ambush, Camouflage, Iron Gut |
| void | torn dark, inhaled debris, collapse ring | #b58cff | cast | Umbral Step, Soul Drain, Eclipse Strike, Night Terror, Voidtouched |
| sand | grain streams, scour, dune spill | #e8c878 | melee | Sandblast, Mirage, Sunsear, Dust Cloak, Scorching Pace |
| chem | fizzing foam, reactive spray, etched surface | #c0ff5a | cast | Acid Spray, Caustic Hide, Corrosive Gut, Noxious Cloud, Volatile Blood |
| psionic | concentric ripples, warped air, snap ring | #ff9fe0 | cast | Mind Spike, Phase Shift, Psychic Drain, Foresight, Resonance |

Wild is already painted: claw rake, fur tufts, torn leaves, kicked earth and wind streaks in warm ochre and earth tones, with #9fb6d6 as a sheen only.
There is one sequence per theme. The runtime picks it by theme, not by ability, so the sequence should read for the whole theme;
`abilityId` only records which ability the painting depicts. Psionic's accent is pink: the fringe classifier does not
count #ff9fe0 as key-tinted (a test covers it), but the Art Kit rule against magenta or pink inside the effect still applies to the body.

## Verification (this run)

Run from `port/v2` with the vitest files. No browser, native or develop-profile run was made.

- `npx vitest run tests/effects-painted-theme-registry.test.ts tests/effects-theme-delivery.test.ts apps/game/src/battle2-wiring.test.ts`: 38 passed, 1 skipped (the candidate case, which runs only with `THEME_DELIVERY`).
- Effects, battle2, soundkit and art-library neighbours (38 files): 280 passed, 2 expected-fail, 1 skipped.
- Full `npx vitest run`: 572 files passed, 5738 tests passed. One file failed: `tests/current-producer-authorities.test.ts`, at import time with ENOENT on `apps/game/dist/index.html`. That is the build-owned authority test; this fresh worktree has no built `dist`, and it is not touched by this change.
- `npm run typecheck` (root, app and worker programs): clean. `tsc --noUnusedLocals` reports nothing in the new files.
- **Negative controls: 21 mutations, all caught, all restored green.** Each check was broken in the source and the targeted test failed:
  - Validator: fringe disabled; fringe loosened to 0.7 %; image size; sequence canvas; missing image; registration; bounds; hash; alpha channel; border; accent; key-in-shape; particle budget; texture budget.
  - Registry: theme mismatch admitted; v4.3 size not enforced at load; grandfathered for any theme; required row not failing; path resolution ignoring the anchors directory.
  - Library: reasons dropped.
  - Wiring: only the first manifest row loaded.
