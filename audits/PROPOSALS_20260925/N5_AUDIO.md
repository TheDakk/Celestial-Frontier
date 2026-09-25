# N5 — Audio sourcing and the listening test (proposal, Claude, 2026-09-25)

Program refs: completion ledger N5 and H3 (`audits/OPERATING_MODEL_20260925/COMPLETION_LEDGER.md:31,39`),
V2 roadmap Arc 8 (`port/V2_PROGRAM_ROADMAP.md:2830`) and the premium audio track (`:3094`), master plan
§15 and Phase 7 (`port/PORT_MASTER_PLAN_v4.0.md:1580,2833`). Owner: Claude (audio). This is a proposal
only. Nothing here changes code, the Sound Kit text or any earlier decision.

## 1. What exists today

**Approved direction (not in question).**
- Decision 12, "full local HD identity, with honest biological coverage": curated family palettes,
  synthesis and a few licensed signature recordings. No scraping. Flora, fungi and microbes get
  environmental sonification, never animal calls (`port/DECISIONS.md:248`). Decisions 14–15 cover
  distant biosphere calls and expression inside one stable voice (`:272,:283`). Ambience restarts
  on tab return (`:74`). `legacy` is a fallback only (`:86`).
- Sound Kit v1 is approved (`AUDIO.md:51`). It sets the sound model: a **finite set of recorded
  source masters**, and every creature voice, arena bed and impact is a deterministic, seed-driven
  transform of them (`SOUND_KIT.md:0–31`). Frozen tone: "No synthesizer bleeps, no chiptune, no stock
  cartoon library" and "Creature voices are throat, breath and body, never electronic"
  (`SOUND_KIT.md:40,51`). Music is "sparse, melodic… always ducks" (`:58`). Output: Opus at 96 kb/s
  stereo for music and beds, 64 kb/s mono for cues. A cue is under 30 KB, a bed under 400 KB and a
  music piece under 1.2 MB (`:150–157`). §8 already names the first sources and the Civet/fox/procedural
  side-by-side listen (`:184–194`).
- Rights: original work, CC0/public domain, or explicit commercial + derivative + redistribution
  permission. Attribution is allowed only when the product can show it (`AUDIO_LICENSES.md:32–45`).
  On 2026-09-15 Nick answered "Allow CC BY with attribution" for the free-audio acquisition. NC, ND
  and SA are excluded (`AUDIO_LICENSES.md:14–22`). The kit sentence "original or commissioned only"
  (`SOUND_KIT.md:41`) keeps its wording. AUDIO.md records that the September 15 permission supersedes
  it *for that task* (`AUDIO.md:5–9,82–85`). Whether that permission also covers **shipped** bytes
  has never been asked. It is decision 2 below.

**Runtime (v2 code).**
- `@cf/audio` has five buses: music, ambience, creature, combat-gameplay and ui
  (`port/v2/packages/audio/src/runtime.ts:10`). It also has combat ducking and lifecycle cleanup
  (`AUDIO.md` §0.3). Master Sound, Volume and Creature voices are in Settings (`AUDIO.md:303`).
- Player-live creature sound is synthesized by oscillator from resolver-v1's `AudioSignature`
  (`AUDIO.md` §0.2). This covers Tame greeting, Feed acknowledgement and Compendium audition. The
  combat Chronicle cues and one generic biosphere pulse are also synthesized.
- The painted battle (battle2) uses the Sound Kit engine instead. The voice card compiler
  (`port/v2/apps/game/src/soundkit/voice-card.ts:10–15`) has **13 archetypes**: the 12 kit families
  plus `brachyuran`, added 2026-09-24. Deterministic derivation runs from an injected source library
  (`soundkit/creature-voices.ts`). Today that library is `synthesizePlaceholderLibrary()`
  (`soundkit/placeholder-archetype.ts:62–153`), and every set carries the label
  `shippable: false / placeholder-synthesized-not-a-recording`. All 33 ability cues and 16 battle cues
  are placeholder synth too (`soundkit/battle-synth.ts:1–15`).
- **Two voice paths.** The soundkit files never read `AudioSignature`. That means a creature tamed in
  the Compendium and the same creature in battle are voiced by two different systems.
- Music states already exist as code: `menu, calm, wonder, tension, battle, major-battle,
  victory-discovery` (`port/v2/apps/game/src/audio-production-plan.ts:148`). A candidate biome-bed
  table maps 43 biomes onto 32 distinct base beds (`:98`).
- Rights machinery works: rights pin `arm1-d835…` (`packages/audio/src/rights.ts:601`) with eight
  original pilot cues (9,752,032 bytes of WAV, opt-in only) (`AUDIO_LICENSES.md:3–10`). The
  byte-checking validator has negative controls. The loop renderer and Opus exporter exist
  (`AUDIO.md:65–80`).

**Candidate library (dev only, $0).** There are 1,617 validated WAV/Opus candidate pairs, 102 loops and
49 instrument stems, plus a MIDI sketch covering all seven music states. None has been listened to or
promoted (`audio-production/AUDIO-COVERAGE.md:7–16`). Real recordings exist as references for 203 of
631 Earth fauna (`AUDIO.md:28`). There is a dev audition page at `?audioReview=1` (`main.ts:5439`).

**Budget facts.**
- The offline pack cap is 128 MiB, enforced at build (`AUDIO.md:172`). The shell (~47 MiB) plus the
  gzipped painted arena (48.1 MiB) is about 95 MiB (`ROADMAP.md:152`). That leaves **about 33 MiB for
  all remaining art and audio**, and the painting standing order (A7) and planet/biome paintings (A8)
  will both need some of it.
- The painted stand-ins alone once held 20 MiB of decoded images in memory. They are now an LRU of 2
  (`ROADMAP.md:89`). Decoded audio needs the same kind of limit: 100 s of stereo 48 kHz decoded to
  float is about 38 MB.
- The listening test protocol has Stage A, the v1.8.9 synthesized baseline, and Stage B, the v2 HD
  identity test with 12–24 players and blinded matching (`port/LISTENING_TEST.md:1–88`). Neither has
  been run (`port/DECISIONS.md:153`).

## 2. Decisions only Nick makes

1. **Source model.** Choose one: runtime synthesis, the kit's "recorded sources + deterministic
   derivation", or commissioned/authored content.
2. **Shipping rights rule.** Does the September 15 "CC0 / public domain / CC BY with attribution"
   permission extend to bytes that ship to players? And do paid "royalty-free" packs and
   AI-generated audio stay out?
3. **Spend.** Keep the current $0 in-house production, or budget for a composer or sound designer.
4. **Size.** How many MiB of the remaining ~33 MiB audio may take.
5. **Music amount and behaviour.** How many minutes, which states, and continuous or sparse.
6. **The listening test.** What Nick personally listens to, when, and whether the old Stage A still runs.

## 3. Options

| | A. Fully synthesized | B. Licensed libraries | C. Commissioned / authored | D. Hybrid, the kit model (in-house) |
|---|---|---|---|---|
| What it is | Grow today's placeholder DSP into the product. Music is generated too. | Assemble shipped sound from free CC0/PD/CC BY libraries and paid royalty-free packs, lightly edited. | Hire a composer and sound designer for music, voice archetypes and beds. | Claude builds a **finite** set of source masters in REAPER/Surge from original performance and foley plus CC0/PD/CC BY field material. Each creature's voice is derived from them deterministically. Music is composed in-house from the existing MIDI sketch. |
| Player experience | Consistent, but it sounds electronic. The frozen kit rules it out ("never electronic", "no synthesizer bleeps"). | Real textures, but uneven quality and style, with library sounds players recognise. Hard to keep "one sound hand". | Best music and the most personal voice design. | Real throat, breath and material sounds, with one coherent hand. Quality depends on the listening loop, and music is the weakest part. |
| Cost | $0 | $0 for free sources. Paid packs run roughly tens to hundreds of dollars each. | Order of magnitude $1k–$10k+ for ~7 min of music plus voice sets (not quoted). | $0. Agent time and Nick's listening time. |
| Size | ~0 MiB, but it costs CPU and battery at runtime. | 10–30 MiB unless curated hard. | Whatever we cap it at. | Designed to a 12 MiB cap (below). Derivation runs once per creature and is cached. |
| Rights risk | None. | **High for paid packs.** The repo has been public since 2026-08-20. Most marketplace licences forbid redistributing the raw files, and a public repo plus an offline cache is redistribution. Free CC0/PD is low risk. CC BY is fine only with exact credits. | Low if the contract grants redistribution of compressed files in a public repo and a PWA. Masters stay private. | Low. Every shipped file is one row in `rights.ts` plus the ledger, the validator fails closed, and CC BY needs an in-game Credits line. |
| Fit to decisions | Contradicts Sound Kit §1–2. | Partly contradicts "no stock… library". | Fits. | Exactly the approved kit model and decision 12. |

## 4. Recommended default

**Option D, the kit's hybrid, built in-house for $0, with a 12 MiB audio cap.** Commissioning stays a
fallback for music only. Concretely:

**Voices (13 archetype source sets, ≈2.3 MiB).**
- One recorded source set per voice archetype. Each set has the kit's 11 cues: call ×2 takes, alert,
  attack-vocal, hurt, faint, victory, breath-idle, land-thud, tame-settle, feed-chew, plus 4–6
  footfalls. There are 9 shared material texture layers.
- Every creature's voice comes from its voice card. Pitch stays within ±12 semitones, formant within
  ±30% and time between 70% and 140%, with a material layer and a seed (`voice-card.ts:27`).
- **One identity.** The voice card's seed comes from the creature's `AudioSignature`. Tame, Feed,
  Compendium and battle then all use the same voice. The oscillator expressions retire into
  articulations of that one voice.
- Hybrids use the D-CFB-1 deterministic fallback.
- Flora, fungi and microbes have no voice. They get short material or ecological sonification from
  the foley set.

**Earth signatures (≈0.8 MiB).** Up to ~50 iconic Earth species get their own licensed recording. Only
species with an eligible reference recording (203 exist today) that Nick keeps in review qualify.
Every other Earth animal uses its family archetype. There is never a substitute "fake" species call
(decision 12).

**Combat (≈0.5 MiB).** The 16 battle cues, 11 ability themes × 3 phases and 9 material impact tails.

**Ambience (≈3.7 MiB).**
- 10 biome-family beds, each 28 s stereo with seeded crossfade loops: temperate/grass, jungle/wetland,
  coast/ocean, underwater/pressure, desert/salt, ice/glacier, volcanic/thermal, crystal/glass,
  spore/alien-fungal and gas/cloud-wind. Airless worlds are silence.
- 4 mono weather layers: rain, wind, storm and snow/sand.
- All 43 biomes are derived from these by layer and filter tint from the system card. The candidate
  table's 32 bases fold into the 10 families.
- Phones run half the ambience layers (kit §5).

**Music (≈4.5 MiB, about 6.5 minutes).** The seven states already in code:
- menu: 1 piece, 45 s
- calm: 2 pieces × 60 s, chosen deterministically per star system
- wonder, for landfall and a new world: 50 s
- tension: 40 s
- battle: 55 s loop
- major-battle, for Guardian or Titan: 55 s loop
- victory-discovery: 4 stings of about 8 s, including one for defeat

It plays **sparsely, Minecraft-style.** A calm piece plays once, then 2–5 minutes follow with only
ambience. The gap comes from a presentation stream and never touches gameplay RNG. Battle music plays
only in battle and ducks under strikes with the existing 25/90 ms contract. The kit's per-planet
landfall themes (8) and the shipyard theme wait until the art budget is known (+≈2.5 MiB).

**UI, space and economy (≈0.2 MiB).** Keep the existing synthesized compatibility stings, as kit §4
retains existing UI cues. Add a few short recorded wood/metal UI and space cues.

**Size and runtime rules.**
- **Cap: 12 MiB of audio inside the 128 MiB pack.** It is a build gate with a one-byte-over control,
  and it grows only on Nick's word.
- **One codec, never both.** Ship Opus if the iPhone probe (H1) shows Safari decodes it. Otherwise ship
  AAC for everything.
- Short cues are decoded. Only one bed and its layers are decoded at a time. Music streams through a
  media element and is never fully decoded.
- Proposed decoded ceiling: 24 MiB, confirmed on H1.
- Derived voices are cached in a byte-bounded LRU. There is no always-running synthesis.
- A missing file plays silence with its caption. It never falls back to a synth stand-in.

**Licensing rule for shipped bytes.** Allowed:
- original project work, proved by its REAPER/Surge project hash
- CC0 or public domain, with the licence snapshot kept
- CC BY 4.0, with the exact attribution shown in an in-game Credits page and in `RECORDING_CREDITS.md`

Not allowed:
- NC, ND or SA licences
- paid "royalty-free" packs, unless their licence explicitly permits redistributing the files in a
  public repository and an offline cache
- AI-generated audio (training rights are unclear; this can be revisited later)
- voice cloning, scraping or unclear uploads

Every shipped file gets one `rights.ts` row plus a ledger row, and CI fails closed. That is already
the contract. The kit text itself is not edited.

**What ships first** is exactly kit §8b–d: the quadruped voice set, the Wild ability theme, the battle
set, the temperate bed with rain, and fur impacts. The Civet, the fox and one procedural quadruped are
derived from that set and wired into the painted arena turn (≈1.2 MiB).

**Commission trigger.** If in-house music fails two of Nick's review rounds, Claude writes a scoped
commission brief. The brief sets out ~6.5 min, the seven states, and a contract that permits
public-repo redistribution. Nick then decides a budget. Nothing is spent without that.

## 5. Staged plan

Claude owns all audio. Codex owns the pack inventory/admission and the device instruments.

| Stage | Work | Owner | Nick's listening |
|---|---|---|---|
| **0 — plumbing (one batch, no decision needed)** | Audio section in the pack manifest plus the 12 MiB gate, with a one-byte control. Voice card seeded from `AudioSignature`, so each creature has one voice across all paths. A measured LUFS gate; only peak is enforced today (`SOUND_KIT.md:198`). An Opus/AAC decode check added to the H1 iPhone probe page. A **Listening page** built from `?audioReview=1`, described below. | Claude. Codex confirms the admission counts audio in its pinned inventory (mailbox). | — |
| **1 — first sources (kit §8b–d)** | The first set listed above, derived three ways and heard in the arena turn: approach, strike, hitstop, impact, hurt, damage ticks, victory. Rights rows land in the same batch. | Claude | **L1 + mini-L2** (~15 min) |
| **2 — all voices and combat** | The other 12 archetypes, in painted order (brachyuran and the D1 standing-order creatures first), 10 more ability themes, and material impacts. Placeholder sets leave the player path one archetype at a time. | Claude | **L1 + L2** per batch of ~4 archetypes |
| **3 — ambience and music** | 10 beds, 4 weather layers, the 43-biome derivation, the seven music states and the sparse-play rule. Kit §5–6 freeze (kit §8e) after this stage passes. | Claude | **L1**, then **L3** |
| **4 — Earth signatures and expression** | Up to ~50 Earth signature voices. Flora/fungi/microbe sonification. Tame, Feed, Compendium and care expressions as articulations of the derived voice. Captions, mono and reduced-intensity close-out (ledger A3). | Claude | **L3 on the iPhone**, alongside H1 heat and battery |
| **5 — Gate G** | Stage B of `port/LISTENING_TEST.md` with 12–24 players, before any release candidate. | Nick recruits; Claude prepares the build and forms | Stage B |

**The listening test Nick runs.** All results stay offline: no network and no telemetry. Each form
ends in **Copy results**, and Nick pastes that text into chat. Claude commits it to
`audits/listening-<date>/` with the commit, pack digest and device, as the protocol requires.

- **L1 — set review (~15 min, per stage).**
  - Where: the dev URL's Listening page.
  - Each sound plays on the **iPhone speaker first, then headphones**.
  - For each sound Nick taps **Keep / Redo / Cut**, with one optional note.
  - Nothing reaches players without Keep.
- **L2 — blind match (~10 min, Nick plus 2–3 people he chooses).**
  - Hear a call and pick the creature from 4 same-size cards.
  - Hear two calls and answer "same family?"
  - Proposed pass line: at least 70% correct on family and at least 50% on individual (chance is 25%).
  - This includes the kit's test that the Civet, the fox and the procedural quadruped sound like one
    family but clearly different individuals.
- **L3 — long session (~45 min of normal play, sound on, iPhone).**
  - Uses the protocol's one-page form (`LISTENING_TEST.md:35–46`): repetition, annoyance, "did it
    belong to the creature", place versus wallpaper, would you keep sound on.
  - Adds whether the phone got warm.
- **Stage A is retired.** It tests v1.8.9 voices that v2 replaces. Its three open questions carry into
  Stage B's form unchanged: the f0 soft-saturation curve, `legacy` as fallback, and ambience restart
  on return. The earlier decisions still get the listening data they were waiting for. It now comes
  from v2.

## 6. The one-line question for Nick

**N5: Accept the hybrid audio default? That means:**
- in-house, $0 sources built from original, CC0/public-domain and CC BY material (credited in game),
  with each creature's voice derived from those sources
- no paid packs and no AI audio
- 13 voice sets, 10 biome beds + 4 weather layers, and ~6.5 min of sparse music
- a 12 MiB cap
- kit §8 ships first
- Stage A retired, with your 15-minute reviews at each stage and the 12–24-player Stage B before release

**Answer "yes", or name what to change.**
