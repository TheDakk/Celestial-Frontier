# Celestial Frontier Sound Kit

Sound direction and audio contract, PROPOSED version 1, 2026-09-12. Companion to ART_KIT.md and MOTION_KIT.md. One sound hand for the whole universe, and, like the art, procedurally generated: a finite set of recorded source sounds becomes an infinite set of unique creature voices, arena atmospheres and impacts through deterministic, seed-driven processing compiled by one interpreter.

Each section is plain text inside a fenced block. Sections 1 and 2 are frozen once approved; section 3 is filled by the compiler; section 4 is the closed cue vocabulary.

Matches code as of 2026-09-13 (see Implementation at the end; sections 1, 2, 5 and 6 are Nick's wording and are not touched by that note).

## 0. How to use

```text
CELESTIAL FRONTIER - SOUND KIT
sound_id: frontier-sound   |   proposed v1, 2026-09-12   |   one hand, compiled

Every sound recipe is assembled in this order:
    SOUND LOCK -> FROZEN SOUND -> VOICE CARD -> CUE -> MIX -> OUTPUT

Sections 1, 2 and 5 are identical in every recipe. Section 3 (VOICE CARD) is
emitted by the compiler from the resolved-anatomy record and the system
card; nobody types a voice card. Section 4 picks ONE cue from the closed
vocabulary. Section 6 supplies the delivery format.

Two kinds of sound, with opposite rules:
    SOURCE     a recorded or performed master (a family voice archetype, an
               impact, an ambience bed) made once, reviewed by listening,
               rights recorded
    DERIVED    a deterministic transform of sources chosen by the voice card
               and the recipe seed: pitch, formant, time, layering, filter,
               space. Derived sounds are never hand-tuned per creature.
The playback clock triggers cues; it never chooses what a cue is.
```

## 1. Sound lock

```text
Paste in every recipe. The reference for character is the same natural-
history painting the art follows: real, tactile, sourced. Every sound has a
visible cause in the picture. The reference for battle feel is the sixteen-
bit turn-based era read as timing, not as tone: cues are short, punctual and
layered so a strike lands. No synthesizer bleeps, no chiptune, no stock
cartoon library, no orchestral bombast under ordinary play. Rights: original
or commissioned only, recorded in AUDIO_LICENSES.md and rights.ts as today.
```

## 2. Frozen sound

```text
Paste in every recipe. Never reword once approved.

  Organic, close and tactile: field-recorded texture with a painter's
  restraint. Creature voices are throat, breath and body, never electronic.
  Impacts are layered: a transient, a body thud scaled by mass, and a
  material tail (fur muffles, chitin clicks, plate rings, water slaps).
  Ability effects are elemental materials heard up close, with a launch, a
  travel and an impact that match the painted phases. Arenas and landfalls
  have a living bed: wind, water, insects, distant calls, weather, all
  seeded and never looping audibly. The interface is quiet, wooden and
  crisp. Music is sparse, melodic, painted in the same palette as the world
  it plays under, and always ducks to let a strike be heard.
```

## 3. Voice card

```text
Emitted by the compiler. Sources: the resolved-anatomy record (family,
materials, size, weapons), the genome (temper, lumin, loco, realm), the
system card (star kind, biome, weather, water) and the ability theme.

  VOICE CARD - <speciesVisualKey>
    Archetype: <one recorded voice set per family template: quadruped,
       hopper, biped-bird, fish, insect, arachnid, serpent, myriapod,
       radial, cephalopod, flyer-membrane, primate; plants have no voice>
    Size: <FA_SIZE -> pitch shift and formant: tiny +9 semitones, small +5,
       medium 0, large -4, huge -8, titanic -12; body thud gain by mass>
    Material: <FA_SKIN -> texture layer: furred soft, feathered rustle,
       scaled dry, slick wet, chitinous click, plated ring, crystalline
       chime, translucent wobble, warty damp>
    Temper: <temper gene -> call aggression and attack vocal intensity>
    Breath: <metab gene -> idle breath rate>
    Locomotion: <FA_LOCO -> footfall set: pad, hoof, claw, hop, slither,
       scuttle, splash, wingbeat, jet, roll>
    Medium: <realm -> filter: aquatic low-pass and bubbles, aerial air,
       gas-giant deep>
    Luminous: <adds a faint tonal hum on idle and a swell on strike>
    Seed: <recipe seed; selects among the archetype's source takes and the
       exact micro-variation so no two creatures share a voice>

  Derived processing is bounded so archetypes stay recognizable: pitch
  within -12 to +12 semitones, formant within +-30 percent, time stretch
  within 70 to 140 percent. Out-of-bounds cards clamp and flag.
```

## 4. Cue vocabulary (closed)

```text
CREATURE (per archetype, derived per creature):
  call, alert, attack-vocal, hurt, faint, victory, breath-idle,
  footfall-set (four to six steps), land-thud, tame-settle, feed-chew
ABILITY EFFECTS (one set per theme: Fire, Frost, Storm, Tide, Stone, Venom,
  Void, Sand, Chem, Psionic, Wild; each with launch, travel, impact; melee
  themes have a short travel whoosh):
  fire: ignition, roar, scorch impact     frost: crackle, hiss, shatter
  storm: charge, crack, thunder impact    tide: draw, surge, slap
  stone: grind, tumble, crunch            venom: hiss, spray, sizzle
  void: inhale, tear, collapse            sand: rasp, rush, scour
  chem: fizz, spray, corrode              psionic: hum, ripple, snap
  wild: snarl, rush, rake
BATTLE:
  turn-ready, cursor, confirm, cancel, approach-start, hitstop-thump,
  flash-sting, shake-rumble, damage-tick (pitch by amount), miss-whiff,
  dodge-swish, faint-fall, victory-sting, defeat-sting, battle-start,
  battle-end
ARENA and LANDFALL AMBIENCE (derived per biome family and system card):
  bed per biome family (43 keys), weather layer (29 keys), water state
  (liquid, frozen, none), hazard accent (25 keys), time-of-day shift (day,
  twilight, night), star-kind tint (13 kinds: dim ember hum to hard blue
  hiss), distant call from the biome's own fauna families
SPACE:
  star hum by kind (13), planet approach, orbit-enter, warp-charge, jump,
  arrive, comet pass, belt rattle, ship engines by stage (Scout, Jump,
  Survey Cruiser, Frontier), dock, undock, shipyard-build, upgrade-fit
EXPLORATION and ECONOMY:
  landfall-touchdown, survey-ping (existing), discovery-sting scaled by
  rarity tier (ten tiers: Common a soft note to Transcendent a held chord),
  capture-start, capture-success, breed-hatch, feed, harvest, loot-pickup by
  icon family (33 families grouped into wood, stone, metal, crystal, cloth,
  organic, tech, relic) and rarity, craft-complete, inventory-move, sell
UI: existing cues retained; new ones follow the wooden crisp rule.
MUSIC: exploration bed (existing pilot), landfall theme per planet type (8),
  battle theme, victory fanfare, defeat, shipyard, title.
```

## 5. Mix

```text
Categories and ducking use the existing runtime: music, ambience, creature,
combat, ui; combat ducks music and ambience with the 25 ms attack and 90 ms
recovery contract already verified. Loudness targets: music -18 LUFS
integrated, ambience -22, creature and combat cues -14 short-term peak
limited to -1 dBTP, ui -20. Concurrency: at most 2 creature voices, 2
effects, 1 impact stack, 1 ambience bed with 2 layers, 1 music. Priority:
impact > effect > creature > ui > ambience > music. A cue that would exceed
concurrency is dropped, never delayed into a wrong beat. Phone: identical
mix, half the ambience layers.
```

## 6. Output

```text
Masters: 48 kHz 24-bit WAV, archived, hashed, never shipped. Shipped: Opus
at 96 kb/s stereo for music and beds, 64 kb/s mono for cues; AAC fallback
only where Opus is unavailable. Cue lengths: under 600 ms for impacts and
ui, under 2 s for creature cues, beds 24 to 40 s with seeded crossfade
loops. Filenames are the wiring, derived from the document key
(creature archetype key, theme key, biome key). Sizes: a cue under 30 KB, a
bed under 400 KB, a music piece under 1.2 MB.
```

## 7. Production discipline

```text
  SOURCES ARE FINITE. Twelve archetype voice sets, eleven theme sets, the
  battle set, 43 beds, 29 weather layers, 25 hazard accents, 13 star hums,
  the space and economy sets: a few hundred masters, made with REAPER,
  rights recorded per master.
  DERIVATION IS DETERMINISTIC. Every derived sound is a pure function of
  the voice card and seed; no clock, no random. Identical recipe, identical
  bytes.
  HASH EVERY RECIPE. Store the recipe hash with every render.
  LISTEN, NEVER ONLY MEASURE. Every source and every archetype's derived
  extremes (tiny and titanic) are reviewed on headphones and on the phone
  speaker. Measured checks (silence, clipping, loudness, length) gate; only
  listening accepts.
  NEGATIVE CONTROLS. A cue with no visible cause is refused; a derived
  voice outside bounds is clamped and flagged; a clock read in derivation
  fails.
  NEVER OVERWRITE AN ACCEPTED MASTER. Retire under its date and reason.
```

## 8. Before any volume

```text
  a. Nick approves sections 1, 2, 5 and 6 as written or amended.
  b. First sources: the quadruped archetype voice set, the Wild theme set,
     the battle set, the temperate bed with rain, and impacts for fur.
  c. Derive the Civet, the fox and one procedural quadruped voice from the
     same archetype; listen to all three side by side; they must be
     recognizably the same family and clearly different individuals.
  d. Wire to the arena proof so the staged turn is heard: approach, strike,
     hitstop, impact, hurt, damage ticks, victory. Listening session on
     headphones and the phone speaker.
  e. Then freeze sections 1, 2, 5 and 6; sources grow only by adding a
     named set with its own listening review.
```

## Implementation

Matches code as of 2026-09-13. The kit is implemented in `port/v2/apps/game/src/soundkit/` (voice-card compiler `voice-card.ts`, deterministic derivation `derive.ts` over the pure DSP in `dsp.ts`, the closed cue registry `cues.ts`, mix and ducking integration `mix.ts`, WAV output `wav.ts`, the browser hand-off `browser-adapter.ts`, and the labelled non-shippable `placeholder-archetype.ts`). The voice card reads `record.materials.surface` first and the genome's FA_SKIN only when the record omits it (CONTRACTS §5). Battle and ability cues render through a labelled placeholder synth (`battle-synth.ts`, all 33 ability and 16 battle ids, never shippable) and ride the turn beats through `battle2/cue-plan.ts` and `turn-audio.ts` (one buffer-source request per cue through the mix policy into the runtime's own admission; `main.ts` hands the study the accessible owner's `decorativeVoicePort()`, which passes only decorative requests and only while the owner is live, visible, answerable and the policy is on). Not yet implemented: the recorded source sets of CONTRACTS §1 (C3; every voice so far is derived from the placeholder archetype and is not shippable), derivation for ambience, space, economy, ui and music cue ids (registered and mixed, no recipes yet), a measured LUFS gate (only peak is enforced), and true formant/WSOLA processing (the current filters are documented approximations in `dsp.ts`).
