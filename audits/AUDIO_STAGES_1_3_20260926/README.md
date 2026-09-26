# D15 audio Stages 1–3: original sources, the living bed, the sparse score (Claude, 2026-09-26)

Nick decided D15 (the in-house plan, $0) and asked to "finish everything on your side, don't wait on me, we'll play test after". So this was built without waiting for the L1 listening review. He rates it all during the playtest on `?audioReview=1`.

## What landed
- **Stage 1** (`e9158650`):
  - `soundkit/organic.ts`: ORIGINAL generators to the kit's frozen tone. There are no recordings, downloads or AI audio.
  - The quadruped voice set, plus footfalls and material textures shared by every archetype.
  - The 16-cue battle set and the Wild theme.
  - All of it on the player path: battle2 voices, the turn sink and the Listening page.
- **Stage 2** (`b74db520`):
  - All 13 voice archetypes and all 11 ability themes are original, so the placeholder has left the creature and combat player path.
  - Impacts carry the struck body's material tail: `cue-plan` names the target, and the sink layers that body's material.
- **Stage 3** (this commit):
  - 10 family beds, 4 weather layers and the 43-biome derivation.
  - 11 music pieces covering the 7 states (397 s).
  - The soundscape owner (sparse rule, hidden-tab silence and restart, phone half-layers, 24 MiB decoded ceiling, battle loop and stings).
  - `DecorativeVoicePort.stopVoice`.
  - The main.ts wiring.
  - The Listening page expanded to 217 items.
  - Levels through a generated gain table, so there is no loudness measurement on the phone.
- **Provenance:** `AUDIO_LICENSES.md` lists every original source with its seed and SHA-256, under "original, CC0 by the project", and a drift test checks it.
- **Pack bytes:** 0 audio bytes ship; everything is rendered at runtime. The Stage 0 12 MiB audio gate and the 128 MiB pack gate are unchanged. The codec question (the D15 probe) applies only to future recorded assets.

## Tests (each with a control)
- `tests/soundkit-original-sources.test.ts`:
  - 13 archetypes × 3 sizes × 11 cues pass the gate.
  - Every archetype differs from the placeholder.
  - Determinism and the manifest.
  - All 11 themes are original, and all 49 combat cues pass the gate and their length caps.
  - The turn sink's real path renders the original cue (control: the placeholder renderer differs).
  - Material layering: plate, fur and plain all differ (control: no material gives the plain thump).
  - The ledger drift check (control: a changed hash fails).
- `tests/soundkit-soundscape.test.ts`:
  - The stored gains equal the meter's, and every runtime output passes the gate (beds also at night; control: a wrong gain fails).
  - The runtime jobs use the stored gain.
  - The 43-biome derivation.
  - Seamless loops (control: an arbitrary cut jumps).
  - A bed plus its weather, a phone with the bed only, airless silence, and the bed stopping at once.
  - Hidden-tab silence and RESTART.
  - The sparse rule, with 120–300 s gaps deterministic from the presentation seed (control: another seed gives other gaps).
  - The battle loop, then a sting.
  - The 24 MiB ceiling.
- `tests/tame-greeting-audio.test.ts`: the port stops only its own voices (control: another port's id and an unknown id are refused).
- `tests/listening-review.test.ts`: 217 items; every new row plays exactly the game's bytes (control: another item differs).

## Gate
- The develop profile shows 5,481 passing. The reds are the two already expected on the base: I5, and Codex's `slicesmoke-sixth-red-contract` release SHA (from `7ea28e02`).
- Run by hand, these all exit 0: root `tsc --noUnusedLocals`, the app and worker typechecks, artaudit, overridecheck and speccheck.

## Known limits (for the playtest and the H1 probe)
- **Render cost.** On desktop, a bed takes 40–85 ms of CPU in slices of at most ~32 ms, and a piece takes at most ~250 ms in slices of at most ~37 ms. A phone is roughly four times slower, so a slice can reach ~150 ms. The H1 performance section should measure it. If it janks, the next step is smaller slices inside the long layers (the bowed drone and the long stridulation beds).
- **The Compendium, Tame and Feed** still play their oscillator expressions. Making them articulations of the derived voice is N5 Stage 4, and Codex's Slice oracle pins that oscillator, so it is left alone.
- **Planetside only.** Beds play under a world's surface vista, and space or orbit has only music. Star hums and space cues are N5 Stage 4.
- **Nothing here has been heard.** "Original" is not "accepted": listening accepts (L1 via `?audioReview=1`).

## Proposed release bullets (for Codex's batched re-measure; the sealed inventory was not edited)
- **New Features & Systems:** "🎵 A LIVING SOUNDSCAPE — every world now has its own bed of wind, water, insects and weather, from 43 biomes; music is sparse and melodic — a calm piece, then minutes of only the world — and battles carry their own theme, with stings for victory and defeat."
- **New Features & Systems:** "🦎 EVERY CREATURE HAS ITS OWN VOICE — thirteen body plans voiced from throat, breath and body (croaks, chirps, hisses, clicks, hoots, bubbles), one voice per creature, the same everywhere; every ability theme and impact has its own material sound."
- **Under the Hood:** "🎧 All sound is original and generated on the device — nothing downloaded, no recordings, no AI audio; the hidden Listening page now reviews every sound in the game."

## For Codex
- Your pinned inventories: new app modules (`soundkit/organic.ts`, `original-voices.ts`, `original-combat.ts`, `leveler.ts`, `ambience.ts`, `music.ts`, `soundscape.ts`, `level-gains.generated.ts`) and a lazily loaded soundscape chunk. Please re-measure together with C17.
- `DecorativeVoicePort` gained `stopVoice`, which refuses any id the port did not start.
- A turn cue may carry `target` on `battle:hitstop-thump` (additive).
