# D15 audio Stage 0: plumbing (Claude, 2026-09-25)

Nick decided D15: the in-house plan with $0 spend (`audits/PROPOSALS_20260925/N5_AUDIO.md`). This batch lands Stage 0 plumbing only. No new sound source ships; the labelled placeholder archetype sources stay.

## What landed
1. **The measured loudness gate** (`port/v2/apps/game/src/soundkit/loudness.ts`).
   - ITU-R BS.1770 K-weighting. It uses libebur128's bilinear design, and the test pins it to the standard's published 48 kHz shelf coefficients.
   - It measures momentary (400 ms), short-term (3 s) and gated integrated loudness, plus 4× oversampled true peak.
   - The kit's targets are one table, `LOUDNESS_TARGETS_V1`: creature and combat cues −14 LUFS short-term, music −18 integrated, ambience −22, UI −20. Every class is capped at −1 dBTP.
   - `admitLoudnessV1` returns a named refusal. For cues, the "too quiet" floor is judged on the loudest 400 ms block, because short thuds read low over 3 s by nature.
   - Creature-cue derivation now ends in an attenuate-only loudness stage. Before, only sample peak was enforced, and the 0.891 sample peak overshot −1 dBTP between samples; the negative control shows exactly that.
2. **One voice per creature** (`port/v2/apps/game/src/soundkit/voice-identity.ts`).
   - The voice card's seed comes from the creature's resolver-v1 `AudioSignature`: the owned individual's exact projection, or the new `projectGenomeAudioSignatureV1` for a non-owned combatant. The two agree for an unbred genome.
   - Its template comes from the genome: the Earth profile, or the procedural painter's body family. It never depends on which painting draws the creature.
   - The painted battle voices an owned champion through its ownership projection, and every cue derives from the card's own seed. Before, the battle seed re-voiced a creature every fight.
   - The Compendium audition rows carry the same card.
   - A combatant with only a partial genome keeps the old record-based voice rather than falling silent.
3. **The pack's audio section and its 12 MiB cap** (`pwa-build.ts`).
   - It is computed at `writeBundle` over the exact shipped inventory, beside the 128 MiB pack gate.
   - Exactly 12 MiB passes, and one byte over fails the build. Today the pack ships 0 audio bytes.

## Tests (all outcome-first, each negative-controlled)
- `tests/soundkit-loudness.test.ts` (10 tests):
  - Calibration: a 997 Hz full-scale sine reads −3.01 LUFS.
  - The shelf coefficients, K-weighting, gating and an inter-sample-peak case.
  - The gate in both directions.
  - Every derivable creature cue: 13 archetypes × 11 cues × tiny and titanic sizes.
  - Control: without the derivation stage the cues fail on true peak.
- `battle2-wiring.test.ts`, "one voice per creature":
  - Through the real study and the real Compendium read model, the stage card equals the Compendium card byte for byte, in two battles.
  - Controls: with the identity card switched off it fails; another genome gets a different voice; the legacy card seeds differently.
- `tests/pwa-audio-section.test.ts` (5 tests): the one-byte-over control, audio-only counting, invalid counts, and the call site (negative-controlled by deleting it).

## Still to do (outside this batch's directive)
The rest of N5's Stage 0 row:
- ~~the Opus/AAC decode check on the H1 iPhone probe page~~ **done** (`device-probe.ts`, `?deviceProbe=1`). No H1 page existed yet, so this is its first section; the performance, heat and memory sections join the same page later. Nick runs it on the iPhone and pastes **Copy results**; the recommendation decides the one codec we ship;
- the Listening page built from `?audioReview=1`.

## Nick's listening review for Stage 1 (about 15 minutes, L1)
Stage 1 brings in the first real sources (kit §8b–d). Each is derived three ways and heard in the arena turn: approach, strike, hitstop, impact, hurt, damage ticks and victory. Rights rows land in the same batch.
- Open the dev URL's Listening page on the iPhone.
- Each sound plays on the **iPhone speaker first, then on headphones**.
- For each one, tap **Keep**, **Redo** or **Cut**, with one optional note.
- Press **Copy results** and paste the text into chat. Claude commits it to `audits/listening-<date>/` with the commit, the pack digest and the device.
- Nothing reaches players without Keep. The loudness gate above is measured; only listening accepts.

## For Codex
- Please confirm your pinned admission inventory counts the audio section. It is computed from the same inventory as the 128 MiB pack gate.
- The derived creature cues' recipe hashes changed: the recipe now records `loudness: 'bs1770-v1'`, and battle cues now derive from the identity seed. No shipped bytes or pins change.
