# Celestial Frontier — Roadmap & Session Handoff

> The living state of development. **Any session (human or Claude) resumes from
> this file** — update the Now/Next/Awaiting sections at the end of every work
> batch, keep everything committed and pushed. The chat is disposable; this
> file and the repo are not.

## Current state (updated 2026-06-11)

- **Version: v1.1** (in-game `GAME_VERSION`) — bumps only on Dakk's say-so;
  every shipped change gets a bullet in `RELEASES[0]` (see CLAUDE.md rule 7).
- **Live:** https://thedakk.github.io/ — build-stamped; live sessions detect
  new deploys and offer a one-tap refresh.
- Shipped in v1.1 so far: SOLID restructure + test toolkit, Guide to the
  Universe, tooltip system, Field Training tutorial (top-center card, focus
  lockdown, sandboxed), release-notes system (update bulletin + cumulative
  history), update watch.

## Awaiting Dakk's playtest feedback

- Tooltip timing (now 650 ms hover / 600 ms long-press) — eager or sluggish?
- Tutorial pacing & copy on iPhone — any step that drags or confuses?
- Release-notes bulletin readability on phone; bullet length.
- Desktop training card: widened to 440px / nudged down 20px under the topbar
  (2026-06-11) — Dakk had a screenshot showing it could be "more centered up
  top" on PC; screenshot never surfaced on disk, so confirm the new placement
  matches what he meant.
- Update pill: first real-world test = the deploy after build 8fe599c (any
  session left open should show the gold refresh pill).

## Recently fixed (2026-06-11, second batch)

- Training always starts at Sol (reload mid-training used to restore the saved
  camera anywhere in the universe → "find Earth" unwinnable). `startTutorial`
  snaps home; `_savedView` restore now requires `tutDone`.
- Settings (`#setbtn`/`#setpanel`) usable during training lockdown.
- Skip-training unlock covered by regression checks.

## Recently fixed (2026-06-11, v1.0-feedback round)

- Moon orbits now Kepler-ish (outer moons slower; gas giants stately).
- Galaxy rotation slowed ~7x (cosmic-time realism, per Dakk).
- Sound recovery: persistent gesture listeners + visibilitychange re-arm the
  suspended AudioContext (iOS backgrounding bug).
- Hover no longer surveys: credit/achievements/find-Signatures need a tap.
- Breeding/feeding/eating percentages labeled (% success / % poison).
- Specimen cards show battle HP + Healthy condition line.

## Design decisions (made with Dakk, revisit only if it chafes)

- **Discover Life risks the explorer, conquest risks the champion** — kept
  as-is (2026-06-11). The asymmetry is the design: scanning is push-your-luck
  with your own HP; "send the animals instead" already exists as the
  conquer-first-then-scan-safely strategy.

## Next (v1.2 candidates — "memorable moments" theme, Dakk's stated direction)

- Persistent creature injury/condition system? (Dakk asked about health
  states — injured/critical. Today creatures are binary alive/lost; cards now
  display HP + Healthy. A real injury system = gameplay change, needs Dakk's
  call on scope.)

- Rare-find spectacle: make Legendary/Anomalous/Unique discoveries feel like
  events (bigger reveal moments, unique stings/FX, maybe a "first discovery"
  record card worth sharing).
- Crossbreed discovery celebrations — finding new hybrids should be memorable.
- Ultra-rare monster encounters worth telling stories about.
- Cosmic events as shared experiences (they're already deterministic and
  simultaneous for everyone — lean into the "were you there?" feeling).

## Later / ideas parking lot

- Playwright smoke on a real browser engine (jsdom covers logic, not rendering).
- Duplicate Prime Codex backdrop-close listener (harmless; tidy someday).

## Working agreements (summary — full rules in CLAUDE.md)

1. Loop: `extract.js` → edit `main.js` → `validate.js` → `smoke.js` →
   commit/push → `deploy.js` (deploys at Dakk-approved milestones).
2. Never regenerate `tools/baseline.json` to make a failure pass.
3. Version bumps & release notes: CLAUDE.md rule 7. Suggest a bump when the
   unreleased pile feels substantial.
4. Saves are sacred: new fields optional with safe absent-defaults.
