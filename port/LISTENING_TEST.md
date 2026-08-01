# The Human Listening Test — protocol (Gate G prerequisite)

**Why this exists:** §15 is 904 lines of audio plan resting on 2 of 24 testers, neither
substantive. The reviewer's measurement unblocked it (533 distinct voices → 199,707 of
200,000 unique; duplicate-in-50 down from 91.3% → 0.6%), and every further ounce of audio
scope — voices, ambience, the mixer — is **gated on this test**. No automated fleet can run
it: Playwright ships `--mute-audio`. Only Nick can recruit; this file makes the session
runnable the day players exist.

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

## Mechanics

- One facilitator note-sheet per player; no discussion between arms until both sessions done.
- Record device model + headphone type. Phone-speaker sessions in a QUIET room.
- Results land in `audits/listening-test-<date>/` (the audits/ committed-bundle rule).
