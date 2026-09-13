# A4 — Sound derivation engine (draft entry, fold into LOG.md on acceptance)

Date 2026-09-13. Branch anthropic/mac. Uncommitted at time of writing (Nick commits after review). No git write, no edits outside the A4 paths, no runtime/`main.ts`/`package.json` edits.

## Built

`port/v2/apps/game/src/soundkit/` (all TypeScript strict, DSP in pure TS over Float32Array at 48 kHz so Node tests are exact):

| File | Owns |
|---|---|
| `cues.ts` | Section 4 closed vocabulary as typed ids: creature (11), ability (11 themes x launch/travel/impact), battle (16), ambience (structural `ambience:<layer>:<key>` for bed/weather/water/hazard/time/star/distant-call, with water and time closed), space (incl. `star-hum:<kind>`, `engine:<stage>`), economy (incl. `discovery-sting:tier-N`, `loot-pickup:<material>:tier-N`), ui, music (incl. `landfall-theme:<key>`). `parseCueId` / `isCueId` / `assertCueId`; impact-class cues flagged. |
| `voice-card.ts` | `compileVoiceCard(record, genome?, systemCard?, overrides?)` -> `{ok, card}` or `{ok:false, reason}`. Archetype from `template.id` (12 archetypes + aliases; `plant`/`flora`/`fungi` refused `no-voice:plants`; anything else `unknown-archetype:<id>`; missing id `missing-template-id`; non-fauna genome `no-voice:<kingdom>`). Size -> pitch (+9/+5/0/-4/-8/-12), formant (+25/+14/0/-10/-20/-30 %), thud gain (`FA_SIZE_M`). Material from `record.materials.surface` first, else `FA_SKIN`. Temper -> aggression 0..1 (per-FA_TEMPER table). Metab -> breath Hz. `FA_LOCO` -> footfall set (extremophiles: scuttle). Medium from `classifyRealm` (Aquatic/Aerial/Gas Giant) with a system-card override. Luminous from `lumin`. Seed = `hashInt(genomeSeed or identity.seed, archetypeIndex, 0xA4)`. Bounds pitch -12..12, formant +-30, time 70..140: clamp and flag `pitch-clamped` etc.; defaults flagged (`size-defaulted-medium`, `material-defaulted-furred`). |
| `dsp.ts` | `resample` (linear), `timeStretch` (granular OLA, 2048 Hann grains, 512 hop, seeded grain jitter, exact `round(len*factor)` length), `pitchShift` (resample then stretch back, length preserved to the sample), `formantShift` (APPROXIMATE: peaking-biquad bank lifting the scaled 500/1500/2500 Hz centres and cutting the unscaled ones, i.e. an envelope tilt, not an LPC warp), RBJ `biquad` (6 kinds), `onePole`, `mixLayers`, `envelope`, `scale`, `normalizePeak`, `microVariation` (seeded fixed detune up to 15 cents + slow sinusoidal drift up to 8 cents), `sine`. No clock, no Math.random, fixed-order float loops. |
| `derive.ts` | `deriveCue(card, cueId, sources, seed)` -> `{cueId, sampleRate, samples, recipeHash, flags}`. Seeded take selection, pitch, formant, time (attack-vocal shortened by aggression), cue envelopes, footfall-set assembled from 4..6 seeded steps at thud gain, land-thud at thud gain, material texture layer from `texture:<material>` (flag `texture-missing:<m>` when absent), medium filter (aquatic LP+bubble-band boost, aerial high shelf, gas-giant LP+low shelf), luminous hum (110 Hz x pitch ratio on breath-idle/call, harmonic swell on attack-vocal), micro-variation, 2 s cap with flag, peak -1 dBTP. `recipeHash` = SHA-256 (reusing `LocalModelSha256V1`) of `stableJson({card, cueId, seed, sources: {key: sha256}})`. |
| `mix.ts` | Section 5 mapping to the existing `@cf/audio` types (imported, not modified): slots impact(100, combat-gameplay, 1) > effect(80, combat-gameplay, 2) > creature(60, creature, 2) > ui(40) > ambience(20, 3 = bed + 2 layers; phone 2) > music(10, 1). Impact/effect carry the runtime's own 0.75 music/ambience duck intent. `planCues(ids, options)` admits by priority (stable on ties) and drops over-concurrency cues with a named reason, never delays. |
| `browser-adapter.ts` | `toAudioBuffer(context, derived)` and `createDerivedVoiceRequest(intent, derived, meaning?, gain?)` -> full `AudioVoiceRequest` whose graph is buffer source -> gain (nodeCount 2), ready for `runtime.start`. |
| `wav.ts` | `encodeWav16` (48 kHz 16-bit mono PCM) and `readWavHeader`. |
| `placeholder-archetype.ts` | Labelled PLACEHOLDER quadruped source set (`placeholder: true, shippable: false`, label `placeholder-synthesized-not-a-recording`): formant-filtered noise burst + decaying harmonic tone per cue, textures for furred/crystalline/translucent. Stands in for C3 masters. |

`port/v2/tools/soundkit-proof/` — `entry.mjs` + `render-voices.mjs` (bundles the TS with rolldown into a temp dir, derives call/attack-vocal/hurt for Civet, fox, procedural, writes nine WAVs + `manifest.json` with recipe hashes and WAV SHA-256s).

## Tests (19, all green): `port/v2/tests/soundkit-{derive,card,mix}.test.ts`

Byte-identical replay (Buffer compare); different seeds differ (bytes and hash); recipe hash tracks source bytes; clock negative control (`Date.now` and `performance.now` spied across six cues, never called); non-creature cue and missing archetype refused; pitch shift moves a 220 Hz sine's zero-crossing count up/down and keeps length; time stretch within 1 sample at 0.7/1.0/1.4; 2 s cap + -1 dBTP peak + texture-missing flag; stableJson + SHA-256 known vector; voice card fields for the procedural genome; surface-over-skin and size default flag; clamp + flag in both directions; four refusal reasons; medium from realm and system-card override; cue registry accepts 11 valid / rejects 9 invalid shapes; priority order; concurrency drop order and reasons; runtime-shaped request builds a 2-node graph on a fake context; WAV header round trip and PCM encoding of clipped samples.

## Gates

`npm run typecheck` PASS; `npx vitest run tests/soundkit-` 19/19 PASS; root `node tools/validate.js` PASS (fingerprint match, 0 boot errors). Total new lines 1156 (modules + tests + tool).

## Evidence

`audits/LONG_SESSION_20260913/a4-voices/` — nine `placeholder-quadruped.<subject>.<cue>.wav` and `manifest.json` (archetype marked placeholder, not shippable). Rendered twice; manifests and WAVs byte-identical. Cards: Civet massive -8 st / -20 % / furred / aggression 0.35 / luminous; fox dog-sized 0 / 0 / furred (size defaulted, flagged, no genome in the record); procedural massive -8 / -20 / translucent / aggression 0.45 / luminous. Civet and procedural share size but differ in seed, material texture and time; the fox sits an octave-ish above. Listening acceptance is Nick's.

## Approximate or not done

- Formant shift is a biquad envelope tilt, not a true formant (LPC/PSOLA) warp; adequate for +-30 % at the archetype scale, documented in `dsp.ts`.
- Time stretch is granular OLA, not WSOLA; transients can smear slightly at 140 %.
- Loudness targets (LUFS) are not measured; only peak (-1 dBTP) is enforced. A LUFS meter is a later measured gate.
- Offline `OfflineAudioContext` rendering was not used: the pure-TS path is what makes Node tests exact; the browser adapter hands finished samples to an `AudioBuffer`.
- Only creature cues are derived. Ability, battle, ambience, space, economy, ui and music ids are registered and mixed but have no derivation (they wait on C3 sources and their own recipes).
- No `main.ts` wiring; no adapter import added (per the contract, one import lands when the battle scene consumes it).
- The archetype is a placeholder; nothing here is shippable audio.
