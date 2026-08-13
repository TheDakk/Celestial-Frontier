# The Human Listening Test — protocol (Gate G prerequisite)

> **2026-08-13 review:** Run this protocol in two separately reported stages. Stage A is the
> existing v1.8.9 synthesized-voice baseline below; the current v2 Phase-4 build still has
> navigation/survey stings only and cannot substitute for it. Stage B begins only after the
> v2 mixer, kingdom-qualified creature profiles, combat/Guardian cues and accessibility
> controls exist. It tests recognizable identity and mix quality—not whether rendered PCM is
> byte-identical. See `../AUDIO.md`, `../AUDIO_LICENSES.md`, and
> `../EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`.

**Why this exists:** §15 is 904 lines of audio plan resting on 2 of 24 testers, neither
substantive. The reviewer's measurement unblocked it (533 distinct voices → 199,707 of
200,000 unique; duplicate-in-50 down from 91.3% → 0.6%), and every further ounce of audio
scope — voices, ambience, the mixer — is **gated on this test**. No automated fleet or current
repository harness supplies an audio-capture/perceptual oracle. Only Nick can recruit; this file
makes the session runnable the day players exist.

## Setup

- **Players:** 12–24. Mix of new players and anyone who has played before.
- **Arms:** half play with audio ON (default), half with audio OFF (Settings → sound).
  Swap arms halfway if a player does both sessions.
- **Devices:** every ON-arm player twice if possible — once on **headphones**, once on the
  **phone speaker** (the phone speaker is where synth stings die; that is the point).
- **Build:** the LIVE game (https://celestialfrontier.github.io/), current release. The
  port's slice carries only the shipped stings and is not the test target.
- **Sessions per player:**
  1. **The first 30 minutes** of a fresh expedition (clear save / fresh profile) — naming,
     training, first captures. The window a new player judges the game in.
  2. **One creature-heavy session** (veteran save or continued): Compendium browsing,
     several captures/tames, at least one breeding, one duel. This is where the 533-voice
     vocabulary and temperament genes either register or don't.

## What to collect (per player, per session — keep it to one page)

Score 1–5 unless noted:

1. Did any sound ever feel **repetitive**? (the duplicate-rate claim, tested by ear)
2. Did creature voices feel like they **belonged to the creature** (size/temperament)?
3. Did any sound **annoy** — which one, when? (free text; this names the f0 clamp curve)
4. Bass/rumble on phone speaker: **present or vanished**? (speaker floor check)
5. Did the ambience read as **place** (biome) or as wallpaper?
6. Muted players only: did you ever feel you were **missing information**?
7. Overall: would you play with sound on? (yes / no / headphones-only)
8. Free line: the single best and single worst sound moment.

## What hangs on the results (decided, tuned after — port/DECISIONS.md)

- **f0 soft-saturation curve** (§23 item 4): tune both ends AFTER this data; 0.874% of
  voices pin the ceiling, 0.612% the floor today.
- **`legacy` voice family** (item 3): fallback-only is decided; reverse cheaply if players
  miss it (they will not — it is 5.5% of the wild and 99.855% of voices are unique).
- **Ambience resume on tab return** (item 2): RESTART is decided; confirm nobody reads the
  restart as a bug.
- **§15 sizing:** whether the port's audio phase is 8 weeks or 16 rests on questions 1–2.

## Stage B — v2 HD identity and combat mix (future gate)

When the v2 systems exist, recruit the same 12–24-player minimum and add blinded matching:

1. hear one call, then choose its specimen from four same-scale candidates;
2. hear two related calls and identify parent/offspring or two hybrids sharing one lineage;
3. identify a familiar companion after its name/card is hidden;
4. distinguish dodge, stun, critical, status, injury, victory and Guardian warnings using
   both audio and their matching caption/visual token;
5. compare the same encounter on phone speaker, headphones, mono, late-night/dynamic-range
   mode and reduced-intensity mode;
6. play a 45–60 minute creature/combat/ship session and record fatigue, masking, repetition,
   frightening peaks and any important event that became audio-only.

Include Earth fauna, flora/fungi/microbe sonification, procedural creatures, both parent orders
of at least three hybrids, one named Guardian, two ship stages and three biomes. Do not ask
“does this sound realistic?” alone; ask whether it is recognizable, belongs to the visible
body/place/action, remains pleasant, and communicates no exclusive gameplay information.

Stage B cannot pass until the rights manifest is complete, active-node/decoded-memory/visibility
gates pass, and real iPhone/Android thermal sessions show no runaway heat or battery behavior.
Profile-hash uniqueness, route coverage and automated audio backends are preconditions—not a
human listening verdict.

## Mechanics

- One facilitator note-sheet per player; no discussion between arms until both sessions done.
- Record device model + headphone type. Phone-speaker sessions in a QUIET room.
- Results land in `audits/listening-test-<date>/` (the audits/ committed-bundle rule).
- Stage B results additionally bind exact source commit, audio resolver/content-manifest
  versions, device/browser, output mode, save/encounter seeds and the matching rights-manifest
  digest so later tuning can be compared honestly.
