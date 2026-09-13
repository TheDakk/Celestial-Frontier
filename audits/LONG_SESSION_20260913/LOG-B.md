# Batch 2 (B1–B3) — sound on the beats, every theme animated, every kit §4 template (Claude lane) — 2026-09-13

Status: built and green on the mechanical gates (typecheck 0; 26 suites / 220 tests across battle2, effects, motion, soundkit, worldlife). Nick's eye on the sheets and the capture is open. No GitHub step. No `Math.random`, no clock outside the injected `clock()`.

## B2 — per-ability theme effects

| File | Owns |
|---|---|
| `effects/theme-library.ts` (new) | `EFFECT_THEMES` (the eleven closed kit keys, asserted equal to the stage's `COMBAT_THEMES` and the Sound Kit's `ABILITY_THEMES`), `THEME_MATERIALS` (Art Kit §4K: material **tint** carries the identity, the game hex is an **accent** only), `THEME_EMITTERS` (Motion Kit §7 phase presets per material: embers rise, shards and grit fall, sand scours forward, void inhales then collapses in a ring, psionic ripples; Wild keeps the accepted presets; every config passes `normalizeEmitterConfig` and the three caps stay within the 200 budget), `proceduralAnchorsFor(theme)` (a real `cf.effect-sequence-anchors/v1` record under `procedural/`, so the sequencer and choreography schedule it exactly like a painted one), `EffectThemeLibrary` (painted where a sequence exists, labelled procedural elsewhere; refuses unknown, duplicate, non-kit and procedural-as-painted inputs). |
| `effects/pixi-adapter.ts` | `phaseTextures` accepts `null` per phase (no sprite; `spriteForTrack(i)`), `particleTint`, and `mirrorDirection`: emitter directions flip for a right-to-left sequence so particles fly toward the target from either stand (they did not before). |
| `battle2/stage.ts` | `BattleStageEffects.emittersForTheme` / `tintForTheme` (resolved by `plan.theme`); sprite alpha by track. |
| `battle2-wiring.ts` | `EffectThemeLibrary([wild])`; each combatant's theme from the combat domain (`abilityTheme(genome)`, player placeholder keeps the melee default); a procedural phase never falls back to the far plate (that fallback is gone; a missing painted texture now throws); `status().effects` reports `"<theme>: painted sequence"` or the procedural label per side. |

Tests: `effects-theme-library.test.ts` (6), plus the B2 cases in `battle2-stage.test.ts` and `battle2-wiring.test.ts`. Negative controls: unknown theme, duplicate painted theme, non-kit theme, procedural posing as painted, texture-count mismatch, storm turn adds no sprite.

## B1 — sound cues synced to the turn beats

| File | Owns |
|---|---|
| `battle2/cue-plan.ts` (new) | `buildTurnCuePlan(plan)`: every Sound Kit §4 battle/ability/creature cue placed on a choreography beat (turn-ready 0, cursor at readyEnd, confirm + approach-start at commandEnd, attack-vocal at actionStart, `ability:<theme>:launch/travel/impact` on the effect schedule so the impact cue **is** the hitstop frame, hitstop-thump + flash-sting + shake-rumble at impactAt, damage-tick at impactAt + pop (pitch by amount), hurt or faint + faint-fall at the reaction, victory + victory-sting at returnEnd, dodge-swish / miss-whiff). Admission per beat through `planCues`, so the §5 single impact slot drops the thump under the ability impact **with a reason** rather than delaying it. Reduced motion drops flash-sting, shake-rumble and approach-start (motion that is not shown) and keeps the rest (sound is not motion). `TurnCuePlayer`: fires once each, in order, from the injected turn-relative clock; a backwards clock never re-fires; a cue later than `CUE_LATE_DROP_MS` (90) is dropped, so a hidden tab never replays a turn's sounds in one burst. |
| `soundkit/battle-synth.ts` (new) | PLACEHOLDER synthesis for all 33 ability and 16 battle ids (labelled `placeholder-synthesized-not-a-recording`, `shippable: false`, never a creature cue). Table-driven recipes follow the §4 material words as filter and tone shapes (fire ignition/roar/scorch, frost crackle/hiss/shatter, storm charge/crack/thunder, …); deterministic per (cueId, seed, amount); impacts under 600 ms, everything under 1.4 s, −1 dBTP. |
| `soundkit/turn-audio.ts` (new) | `createTurnCueSink({ runtime, seed })`: each fired cue → mix policy → `createDerivedVoiceRequest` (one buffer source into one gain) → `runtime.playVoice`; the runtime's own admission (cooldown, concurrency, budgets) still rules. Creature cues use the caller's A4 voice hook or are skipped with a reason. Synthesis cached per cue; bounded result log. |
| `soundkit/browser-adapter.ts` | `RenderedCue` (samples + sampleRate) so the request builder accepts derived creature cues and synthesized battle cues alike. |
| `battle2/stage.ts` | `cues?: { sink, phone }` option; `play()` builds the cue plan, `tick()` fires it, `cuePlan` / `cuesFired()`; `StageFrame.cuesFired`. |
| `battle2-wiring.ts` | `audio?: TurnAudioRuntime` port; `status().audio` = `none` or the cue log. **main.ts passes no runtime yet**: the shared `AudioRuntime` is private to the tame-greeting owner (claim-gated by the audio laws), so exposing a decorative voice port is a main-thread audio decision for Nick, not something to slip in under the study flag. |

Tests: `battle2-cues.test.ts` (6), `soundkit-battle-synth.test.ts` (5). Negative controls: unknown theme refuses, backwards clock, late drop, disposed player, stage without a sink, creature cue in the synth, runtime rejection and throw both recorded, vocabulary refusal in the sink.

## B3 — the four remaining kit §4 templates

All fourteen kit §4 names now resolve to a motion library; nothing in §4 falls to the whole-portrait fallback (non-kit names such as `gastropod`, `monotreme`, `plasma` still do, labelled).

| Template | clipSetId | Joints (count incl. root) | Verbs |
|---|---|---|---|
| myriapod | myriapod-v1 | (29) head mandible · seg0..seg7 (from root, running tail-ward; seg6..7 lag) · leg{A,B,C,D}{Far,Near}{Knee,Foot} (from seg0/2/4/6) · antennaFar antennaNear | `approach:crawl` (alternating tetrapod + segment wave), `melee:mandible` (forcipule bite −38°), `melee:sting` (rear segments curl 55°) |
| cephalopod | cephalopod-v1 | (32) mantle head eyeFar eyeNear siphon finFar finNear · arm{0..7}Seg{0,1,2} (from head; 0..3 hang left, 4..7 right, `csplay(+)` opens the crown) | `approach:jet` (mantle contracts, siphon fires, arms trail), `approach:crawl`, `melee:lash` (front pair whips −80° at the tip), `melee:bite` |
| flyer-membrane | flyer-membrane-v1 | (22) pelvis spine chest neck head jaw · wing{Far,Near}{Root,Elbow,Wrist,Tip} (from chest; + lifts) · leg{Far,Near}{Knee,Foot} · ear{Far,Near}Tip · tail0 | `approach:flight` (+70°/−50° flap), `approach:crawl` (folded-wing scramble), `melee:bite` (jaw −35°), `melee:claw` |
| primate | primate-v1 | (22) pelvis spine chest neck head jaw · arm{Far,Near}{Shoulder,Elbow,Hand} (from chest) · leg{Far,Near}{Hip,Knee,Foot} (from pelvis) · tail0..2 | `approach:walk` (knuckle-walk, arms and legs alternate), `approach:climb`, `melee:punch` (near shoulder −75° at 0.36 BL), `melee:bite` |

Routing (`TEMPLATE_BY_FAMILY`): myriapod / centipede / millipede → myriapod; ceph / cephalopod → cephalopod; bat → flyer-membrane; primate → primate. Weapons: myriapod [bite, sting], cephalopod [constrict, bite], flyer-membrane [bite, claw], primate [claw, bite]. Aliases: myriapod bite→mandible, cephalopod constrict/tail→lash, primate claw→punch. Gait fallbacks: myriapod walk/cling-crawl/trot→crawl; cephalopod swim/drift→jet, walk/cling-crawl→crawl; flyer fly/glide→flight, walk/cling-crawl→crawl; primate cling-crawl→climb, crawl/trot/gallop→walk. New §6 chain kinds: `membrane` (lag 40 ms per bone, overshoot 0.05, no feather flutter) and `tentacle` (lag 70 ms, overshoot 0.20). Part groups: `arm{Far,Near}*` → arms, `eye*` → head, `mantle`/`siphon` → body, `fin*` → fins.

Synthetic fixtures (hand-placed, labelled, not painter output) for the four in `tools/motion-proof/fixtures/`; the tests assert disk equals generator. Evidence: `audits/LONG_SESSION_20260913/b3-family-sheets/` (four SVG + PNG sheets, body cards, timelines; byte-identical on re-run).

Tests: `motion-families.test.ts` now covers thirteen templates (registry gap assertion flipped to "no gap"; routing; verb sets; strong poses; chain kinds), `motion-body-card.test.ts` controls retargeted from myriapod/primate to gastropod/monotreme.

## Not done in this batch

- main.ts audio port for the study (see B1); the proof-page capture with audible cues.
- Real painted sequences for the ten procedural themes (Codex, Art Kit §4K) and recorded sources for the battle set (C3): the procedural emitter and the placeholder synth are labelled stand-ins.
- Codex's observer must emit the four new joint inventories above for real records; the fixtures are synthetic.
