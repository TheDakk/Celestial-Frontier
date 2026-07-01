# Celestial Frontier — Playtest Feedback

**From:** Emerson
**Date:** June 12, 2026
**Build tested:** v1.0 "The Frontier Opens" at celestialfrontier.github.io, fresh profile (no saved state), desktop Chrome

Nick — congrats on shipping this. The procedural depth is genuinely impressive: deterministic universe from seeds, survey cards for everything, the feed/breed/duel bloodline system with real stakes (permadeath, consumed parents), share codes, cosmic events on real timescales. That's a lot of game. The feedback below is organized so you can hand it straight to Claude as a work list — roughly in priority order.

---

## 1. The first 60 seconds — lead with the fun, not the reading

**What a brand-new player hits today, in order:**

1. A three-paragraph lore card (Pathfinders, Signatures, the Codex) + name entry
2. A full "What's New in This Release" patch-notes modal (several screens of scrolling)
3. An 18-step field training sequence, where each step is itself a dense paragraph
4. Steps 1–7 are mostly UI chrome: open the Atlas, open the Compendium, read this card...

Note: if you tested it yourself and the game jumped straight to field training, that's your saved localStorage — new players still get the full text stack. (Verified on a clean profile.)

**The principle:** Bungie's Jaime Griesemer's famous "30 seconds of fun" — Halo 1 was "30 seconds of fun that happened over and over... if you can get 30 seconds of fun, you can pretty much stretch that out to be an entire game." Their design was a 3-second loop inside a 30-second loop inside a 3-minute loop. The takeaway for Celestial Frontier: identify your 30-second loop (probably *spot world → survey → land → discover a creature → catalogue it*) and put the player inside it **before** any reading.

**Concrete suggestion — an opening fly-in instead of text:**
- ~10 seconds, automatic, skippable. Not cinematic-fancy, just the camera doing what the player will soon do: start at the **galaxy** level, zoom down through a star system, down to a planet surface, land on a creature, and have it do *something* (a sound, a little action).
- Start at the galaxy, **not** the whole universe. If you open at the top scale, the player only ever zooms *down*. Starting in the middle means there's somewhere to go in both directions — it makes the world feel bigger, not smaller.
- Lore can come later, fed in one line at a time during play. The Pathfinders backstory would land better *after* I've surveyed my first world and wonder who else charted these.
- Patch notes should never be in the new-player path. Show "What's New" only to returning players who have a save.

## 2. Desktop controls — the micro requirement is real

The two core verbs are currently **hover** (survey) and **scroll-wheel over a planet** (land). Problems observed:

- **Planets are tiny moving targets.** Earth at the default system view is roughly an 8–10 px dot, and orbits advance fast enough that a planet visibly relocates in the second between seeing it and clicking it. The tutorial's very first task ("tap Earth") took me three attempts.
- **No hover assist.** There's no slowdown, snap, or magnetism when the cursor is near a body. The orbit keeps moving under your cursor.

Suggestions (any one of these would help a lot; they stack):
- **Slow or pause orbital motion while the cursor is near/over a body** — the "bullet time on hover" effect. Cheap to implement, huge feel improvement, and it reads as polish.
- **Generous hit areas** — make the clickable/hoverable radius 3–4× the visual sprite, with nearest-body wins.
- **Click-to-focus**: clicking a planet centers and tracks it, then a button or second click lands. Removes the "scroll precisely over a moving 8px dot" requirement entirely.
- Scroll-to-land also seemed to silently not respond at times (possibly tutorial gating, possibly the open side panel eating scroll events). If interactions are intentionally locked during training steps, show *why* (dim + tooltip), because right now it just feels broken.

## 3. Mobile — the current verbs don't exist on touch

The hint bar literally says "**Hover** a planet to survey it · **scroll in** to land." Neither hover nor scroll-wheel exists on a phone. Mobile needs its own first-class interaction mapping, not an adaptation:

- **Tap = survey** (replaces hover), **pinch = zoom**, **double-tap or a big LAND button = land**.
- Big touch targets everywhere — thumb-sized (Apple's guideline is 44 pt minimum), and the planet hit-area multiplier matters even more on touch since fingers are ~2× less precise than cursors.
- Desktop and mobile both have to be great, and that constraint should shape the design early — it's much more expensive to retrofit.

## 4. Accessibility — good start, keep going

Genuinely pleased to find Display settings with **text size (A/A+/A++), text tone, and font choices** already in v1.0 — most indie games never ship that. Worth adding to the same panel:

- **Reduced motion** toggle (orbits, parallax starfield) — also doubles as the hover-precision fix for some players.
- Check small-text contrast (the muted purple-on-dark labels on survey cards are borderline).
- Keyboard navigation / focus states for the panels, and larger buttons generally. Don't tune for your own eyesight and setup — they're better than most players'.

## 5. Player rename — currently impossible

Creatures get a **Rename** button on their specimen cards, but the player doesn't. If you typo your explorer name at the start, the only path I could find is **Reset Game**, which erases the entire expedition. A rename field on the character sheet (or in Settings) is a small, high-goodwill fix. The 1-step version: reuse the creature rename flow.

## 6. Onboarding UI noise

Mid-tutorial, I had five things on screen at once: the training card, the still-open survey card, a tooltip, a "Rank up" toast, and a "Training cache" toast, plus a notification badge counting up. During training, consider suppressing/queueing toasts so there's exactly one "look here" at a time.

## 7. Audio — big opportunity

Settings currently has a single Sound on/off. Sound effects and mood-setting music matter disproportionately for ambient discovery games like this. Two-tier suggestion:

- **Near-term:** distinct, satisfying effects for the core loop verbs (survey ping, landing whoosh, discovery chime, rare-find fanfare) and separate Music / SFX sliders.
- **Bigger swing — live generative music.** Since the universe is procedural, the soundtrack can be too: a Web Audio synth engine that composes ambient music in real time, seeded per-system just like the worlds (calm progressions in the Solar Reach, stranger scales in the Outer Dark). [Tone.js](https://tonejs.github.io/) is the standard open-source framework for exactly this, and [Generative.fm](https://medium.com/@alexbainter/making-generative-music-in-the-browser-bfb552a26b0b) proved endless browser-generated ambient works beautifully. Claude is good at writing Tone.js — "procedural ambient engine seeded by the current star system" is a very tractable prompt. Unique-per-player music would be a real differentiator.

## 8. Future: 3D / WebGL and procedural creature variation

When you're ready to push presentation:

- Claude writes solid WebGL/three.js. Free, license-safe 3D model sources: [Poly Haven](https://polyhaven.com) (CC0), [Kenney](https://kenney.nl) (40k+ CC0 game assets, GLTF/FBX/OBJ), Quaternius (CC0), [Sketchfab](https://sketchfab.com/tags/cc0) (filter to CC0/CC-BY), [OpenGameArt](https://opengameart.org). CC0 = no credit required, no restrictions.
- Procedural variation on top of imported models — per-seed tweaks to color, size, scale/skew, plus shader effects — would make every player's creatures visually unique, which matches the "every explorer's collection evolves on its own" fantasy the game already sells.

---

## Quick wins (smallest effort → impact)

1. Hover slowdown / bigger hit areas on planets
2. Player rename
3. Don't show patch notes to first-time players
4. Suppress toasts during tutorial
5. Core-loop sound effects

## Verified references

- ["Half-Minute Halo: An Interview with Jaime Griesemer"](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html) — the "30 seconds of fun" source
- [Tone.js](https://tonejs.github.io/) — Web Audio framework for interactive/generative music
- [Making Generative Music in the Browser](https://medium.com/@alexbainter/making-generative-music-in-the-browser-bfb552a26b0b) (Generative.fm)
- CC0 asset sources: [Poly Haven](https://polyhaven.com) · [Kenney](https://kenney.nl) · [Sketchfab CC0](https://sketchfab.com/tags/cc0) · [OpenGameArt](https://opengameart.org) · [awesome-cc0 list](https://github.com/madjin/awesome-cc0)

*Testing notes: played a fresh profile through tutorial steps 1–10 (survey, atlas, compendium, feeding). Couldn't audibly verify sound in my test setup, and scroll-to-land didn't respond during the tutorial — flagged above rather than assumed.*
