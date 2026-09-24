# The painted library in the battle arena (2026-09-24)

Nick: *"Is there any coding you can do to help that's on the roadmap — I really want to get this going."* The card had
all 17 painted archetypes; the arena still knew only the 5 crabs and the Civet. Now every archetype can **fight**.

## What changed (Claude's modules: battle2 / E1, the card path)
- **One list** (`port/v2/tools/morph/build-card-masters.mjs`) generates the card registry, the card asset map AND the
  arena's fit list (`apps/game/src/battle2-archetypes.ts`); `build-shipped-battle2.mjs` ships every archetype's runtime
  files from it (132 files, 93 MB — byte-identical to files already in the repo, so git stores them once; the service
  worker never precaches them: the arena fetches them only under `?battle2=1`).
- **One source-path resolver** (`tools/creature-animation/record-source.mjs`): the sprint records' absolute
  `source` paths into the OpenAI worktree resolve repo-relative in the card builder, the arena wiring, the fixtures and
  the film runner.
- **Tree Frog:** a record that declares adhesive pads defaults to its observed painted supports (`parts-rig.ts`) — it
  was the one archetype that could not load.
- **Sized to its place** (`battle2/stage.ts` `combatantPresentation`, `arena.ts` `COMBATANT_WIDTH_FRACTION_MAX` 0.42,
  `habitat-arena.ts` `fitToBand` / `BAND_FILL` 0.9): the mass rule gives every body 1/3–1/2 of the frame height, which
  made a long body enormous (the Python ran off the frame, films `-01`) and made every real flyer/swimmer too tall for its
  band (the air band is 0.38, the water band 0.29 — the Eagle and the Fruit Bat were REFUSED, `-00-refused-for-size`).
  Now a body is capped to 0.42 of the frame width (guardians keep their decided fill), and an air/water body is scaled to
  fit its band — the habitat and the stage take the same scale; scaled, never clipped. 0.36 (films `-02`) made the Python
  a thin worm; 0.42 (films `-03`) reads.
- **Salmon masks** load from their own packet on the stage (`markingsDir`).

## Evidence
- `library-arena.test.ts` (vitest, the real stage at 30 Hz): all 17 fight as ATTACKER with their own compiled anatomy
  attack in their own medium and as TARGET — **0 rig refusals** (crab pinch, Civet claw, Salmon bite, Eagle peck,
  Beetle/Centipede mandible, Python strike, Tree Frog bite, Chimpanzee bite, Starfish body, Tarantula bite, Octopus lash,
  Fruit Bat bite); and every archetype is SIZED to its place (widths ≤ 0.42; flyers fit the air band at 0.88; the Salmon,
  Starfish and Octopus are refused on the dry arena with the reason and fit the water band on a lake world at 0.87/0.67/0.67).
- `battle2-archetypes.test.ts`: every file the wiring fetches exists at its served path for every archetype; the Salmon's
  masks ship where they are bound (negative control: removing one mask fails with the exact path).
- Native films in Edge (`<pair>-03/`, 10 s webm + stills + report; sheet `library-battles-sheet-03.png`):
  Python vs Tarantula (constrict / bite), Eagle vs Beetle (morphed; the Eagle in the air band), Chimpanzee vs Centipede
  (punch / mandible), Tree Frog vs Fruit Bat (kick / the Bat in the air band) — all DIAGNOSTIC_PASS, 0/0 refusals, CPU p95
  inside the 3.5 ms painted tier.

## Findings for others
- **Codex:** the Centipede's ARAP skin refused once ("unresolved folded triangles: 1") at the `-02` presentation scale
  (`chimpanzee-vs-centipede-02/report.json`) — a latent fold the stage's scale-dependent cadence can sample; clean at
  `-01` and `-03`. The same film shows it; the motion-anatomy run should cover it.
- **Nick (a look, not blocking):** relative size between species follows the mass classes — the Tarantula is as tall as
  the Chimpanzee and the width-capped Python reads small beside it. A per-species "arena size" is a balance decision.
- **Next (Claude):** a WET arena — the app's plates are the dry Earth-temperate set, so the swimmers can only fight on a
  world with water, where they are placed correctly but drawn over the forest floor. Codex's archetype harness already
  overlays procedural water; the stage needs its own.

## The WET arena (same day, next batch)

The swimmers could only fight on a world with water, where the habitat placed them correctly but the stage drew them over
the dry forest floor. `BattleStage` now takes `water: { surfaceY }`: a procedural, depth-banded body of water
(`WATER_BANDS`, no texture, deterministic) from the habitat's surface to the frame bottom, BEHIND the combatants and above
the mid plate, moving with the mid plate's parallax, three frames wide; the dry near plate is hidden. The app wiring and the
film harness pass it whenever either side fights in water (`selectHabitatArena` now returns the compiler's `surfaceY`); the
film harness takes an optional `script.world` (a lake) so swimmers can be filmed.

- Outcome test (`library-arena.test.ts`, "the WET arena"): one extra layer at index 2 (far, mid, water, …) behind the
  swimmer; near plate hidden only when wet; the water tracks the mid plate through a real run-up; destroyed on dispose;
  out-of-frame `surfaceY` refused. Negative control: detaching the water from the mid plate fails with the exact offset.
- Films on a lake world (`<pair>-01/`, sheet `library-battles-sheet-water-01.png`): **Salmon vs Octopus** (both in water;
  bite / bite), **Eagle vs Salmon** (air over water — talons / bite, surface-ranged), **Crab vs Starfish** (both in water;
  pinch / body) — all DIAGNOSTIC_PASS, **0/0 refusals**, CPU p95 2.7 / 2.5 / 3.4 ms (inside the 3.5 ms painted tier).
- Look note: the crab paintings carry a painted ground shadow (label 0) that floats under a submerged crab — a
  painting-side / presentation item, not blocking.

## Phone-tier CPU study (2026-09-24, take `phone4x`)

`CF_CPU_THROTTLE=4 node ../../audits/BATTLE2_LIBRARY_20260924/film-all.mjs all phone4x` (from `port/v2`) films the seven library pairs with Chrome's
CPU slowed 4× (`Emulation.setCPUThrottlingRate`, a phone-class approximation, not a device). Stage CPU per frame, p95:

| pair | desktop | 4× CPU | frame p95 at 4× | refusals |
|---|---|---|---|---|
| Python vs Tarantula | 1.90 ms | 3.50 ms | 16.7 ms | 0 / 0 |
| Eagle vs Beetle | 2.10 ms | 3.90 ms | 16.7 ms | 0 / 0 |
| Chimpanzee vs Centipede | 4.30 ms | **10.70 ms** | 16.8 ms | 0 / 0 |
| Tree Frog vs Fruit Bat | 2.10 ms | 3.70 ms | 16.8 ms | 0 / 0 |
| Salmon vs Octopus (lake) | 2.70 ms | 4.70 ms | 16.8 ms | 0 / 0 |
| Eagle vs Salmon (lake) | 2.50 ms | 4.30 ms | 16.8 ms | 0 / 0 |
| Crab vs Starfish (lake) | 3.40 ms | 6.50 ms | 16.7 ms | 0 / 0 |

Every pair holds 60 fps at 4× CPU. The outlier is the Centipede: its ARAP skin costs about two-thirds of a 60 fps frame at 4× (the Chimpanzee alone
is under 4 ms). For the phone tier (D1) this is the one to budget or simplify first (Codex's skin). The real iPhone probe remains the gate.
