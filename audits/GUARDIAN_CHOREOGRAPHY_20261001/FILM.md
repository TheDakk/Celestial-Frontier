# Filming the D2 Brown Bear guardian fight with the boss choreography (Claude, 2026-10-02)

Matches code as of 2026-10-02 (branch `anthropic/overnight-live-worlds`). This batch ran no browser. The main lane makes the film.

## The command

Run it from `port/v2`. It owns a browser, so on macOS run it with approved out-of-sandbox execution. It takes the workspace lock and
needs `/opt/homebrew/bin/ffprobe`. The output directory must not exist yet.

```sh
node tools/battle2-proof/native-runner.mjs \
  ../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab \
  ../../audits/VISION_D2_GUARDIAN_20260921/fit-01 \
  ../../audits/GUARDIAN_CHOREOGRAPHY_20261001/film-d2-bear-01 \
  ../../audits/GUARDIAN_CHOREOGRAPHY_20261001/script-d2-bear-guardian.json
```

- **Left fit, the challenger:** the crab, `crab-fits-03`, the same crab as the D2 films.
- **Right fit, the guardian:** the Brown Bear, Codex's signed fit `VISION_D2_GUARDIAN_20260921/fit-01`. It carries the record's
  `guardian` block, so the guardian frame fill and the guardian stands apply. The harness refuses the option unless the guardian is
  the right fit, because in every live Guardian/Titan fight the guardian is the defender (side B, `hpB`).
- **Script:** `script-d2-bear-guardian.json` (this folder).
  - `"guardianChoreo": true` and `"guardian": { "kind": "guardian", "maxB": 40 }`.
  - `"supports": "observed"`, as in `bear-vs-crab-03-observed`.
  - Six rows. The crab hits. The bear hits. A crab critical takes the bear from 28 to 18 HP, which crosses half health, so the phase
    set piece plays after that turn. The bear lands a phase-active critical with the capped heavy strike. The crab dodges the bear.
    A crab critical fells the bear, so the fall finale plays.
  - `guardian-film-script.test.ts` plans this exact program without a browser: entrance, phase after turn 2 (row 2), heavy strikes on
    turns 1 and 3, then the fall.

A reduced-motion variant needs one more field, `"reducedMotion": true`, in a copy of the script. Write the film to a new directory.

## What the film writes

`report.json` contains:
- `gates.guardian`: kind, `maxB`, phase reason and turn, heavy strikes, and every segment with its offset, duration and beats.
- `arena`: the set id and runtime files.

Stills:
- The per-turn stills, as before.
- One still at the middle of every set-piece beat: `segNN-<piece>-<beat>.png`, for example `seg00-guardian-entrance-rise.png`.
- All stills are taken in film order.

`battle-full.webm` covers the whole film: entrance, turns, phase, turns, fall.

The capture check is `requireGuardianFilmTimeline` (`tools/battle2-proof/guardian-script.mjs`). It requires every turn phase and
every set piece observed live, in order, each sample on the segment and beat its time names. A set-piece beat shorter than two 60 Hz
frames is reported, not required.

## What changed in the harness (all three runners)

- **Plates.** `native-runner.mjs`, `archetype-native-runner.mjs` and `build.mjs` take the recipe and plates from
  `apps/game/src/battle2/arena-sets.generated.json` through `tools/battle2-proof/arena-plates.mjs`. These are the delivery-manifest
  runtime files the game draws. The temperate MID is now the approved despilled copy
  `ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png`, not `ARENA_EFFECTS_V42_PROOF_20260912/keyed/arena-mid.png`.
  - This is the same one-file pixel change the game took on 2026-10-01: alpha identical, 190 RGB edge pixels.
  - Films made from now on match the game.
  - Films made before this change used the keyed MID.
- **Guardian option.** It is off unless the script sets it.
  - `native-entry.mjs` plans the game's program (`planGuardianProgramV1`) from the script rows, exactly as `battle2-wiring.ts` plans
    it for a settled fight.
  - It plays the set pieces through the stage's own `playSetPiece` / `tickSetPiece` on one global clock, with the caption.
  - Without the option, the timeline is turns only and the turn plans are unchanged. The capture check is the existing
    `requireBattleCaptureTimeline`.

## Watch for

- The bear has never been filmed **attacking from the right**. The D2 films had it attacking from the left, or being attacked on the
  right. If its claw refuses mirrored, the report's `refusalLog` names the joint and the turn.
- The phase set piece follows the crab's critical (turn 2), and the bear's next hit is the capped heavy strike. Check that the
  140 ms hitstop reads as weight, not as a stall (DESIGN.md §9, item 4).
