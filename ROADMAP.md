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
- Top-center tutorial card vs thumb zone.

## Next (v1.2 candidates — "memorable moments" theme, Dakk's stated direction)

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
