# Celestial Frontier — Roadmap & Session Handoff

> The living state of development. **Any session (human or Claude) resumes from
> this file** — update the Now/Next/Awaiting sections at the end of every work
> batch, keep everything committed and pushed. The chat is disposable; this
> file and the repo are not.

## Current state (updated 2026-06-11, late evening)

- **Version: v1.2** (in-game `GAME_VERSION`) — live as build `ffdd3e2`
  (incl. the iOS 100vh Continue-button hotfix). Bumps only on Dakk's say-so;
  every shipped change gets a bullet in `RELEASES[0]` (see CLAUDE.md rule 7).
- **STAGED, not deployed: v1.3 "The Deep Spectrum"** — rarity ladder extended
  8 → 12 tiers (see section below). Built, validated, smoke-green; notes
  staged as `RELEASES[0]`. **Awaiting Dakk: bump `GAME_VERSION` to '1.3' +
  deploy.**
- **Live:** https://celestialfrontier.github.io/ (org user site; old
  thedakk.github.io deleted; dev repo TheDakk/Celestial-Frontier is PRIVATE).
- Shipped in v1.1 so far: SOLID restructure + test toolkit, Guide to the
  Universe, tooltip system (text-only, 650/600ms), Field Training (lockdown,
  Sol-start, Settings allowed, dialogs yield below card, desktop high-riding
  card), release-notes system (bulletin-first welcome: name → notes →
  training; once-per-update for returners; cumulative via Guide footer),
  update watch (BUILD_ID + version.json + refresh pill), toast pacing
  (read-length, tap-dismiss, title-screen hold), v1.0-feedback fixes (Kepler
  moons, slow galaxies, sound resume, hover-survey, % labels, HP/condition
  line, no phantom Rank Up).

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

## Recently fixed (2026-06-11, boot-noise + desktop pass)

- Phantom "Rank Up — Cadet" after reset / training cleanup: rank fanfare now
  requires a genuine promotion (floor increase); trackers reset on wipe.
- Desktop training card: 470px, larger type, more breathing room under the
  topbar. Dakk wants a broader "mobile-first that translates to PC" review —
  the desktop topbar spreads to corners while the card floats center; consider
  a fuller desktop HUD alignment pass if it still reads as off.
- ("Survey the Sun" on boot in Dakk's screenshot = the hover-survey bug, fixed
  in f143ed8; screenshots predated that build.)

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

## STAGED for v1.3 "The Deep Spectrum" (2026-06-11, awaiting bump + deploy)

- Rarity ladder extended 8 → 15 tiers. Deep spectrum: **Mythic (~1/22k),
  Celestial (~1/91k), Primordial (~1/333k), Transcendent (1/1M)**; summit:
  **Empyrean (~1/3.3M), Eternal (~1/11M), Omnipotent (~1/33M)** (was "Singular";
  Dakk renamed 2026-06-11 — power-fantasy fits the card-collection direction).
  All bands carved out of the TOP of the old unique band so existing grades
  hold or climb — verified over 60M seeds (0 downgrades; `tools/rarity-sanity.js`).
- **Collection-card pass** (Dakk: "like a card collection game"): specimen cards
  wear a `.gbadge` grade badge; tier 12+ gets the **iridescent foil** treatment
  (shimmer badge + animated prismatic `.iridframe` ring — CSS at the end of the
  style block). High-tier palette repainted to pop: aqua/starlight/ember/
  white-light/dawnfire/twilight/iridescent-magenta.
- **👑 Apex Guardians** (the "ultra-rare encounters" runway item): ~1 in 40
  fauna-bearing worlds is ruled by a named one-of-a-kind titan wearing a summit
  grade (`guardianFor`, deterministic — same ruler for every player). Guarded
  worlds show the ruler on the survey card; conquest becomes a guardian
  challenge; victory stores the guardian in the Compendium, +40 spoils, 👑
  cinematic. Guardian-hood never inherits; `normGenome` clamps imported `apex`.
- Spectral designations past Prismatic fuse tier finish + domain hue
  ("Radiant Fire", "Primordial Black"); `TIER_MAX` replaces hardcoded 7-clamps
  (incl. the loadSave conquered-tier clamp, was 0–9).
- Boosted bloodlines can now breed past Unique (boost cap raised to TIER_MAX);
  summit via breeding needs a natural Anomalous+ under max boost — two roads
  to the top: breeder's and fighter's.
- 8 new achievements (Beyond the Veil ≥Mythic, One in a Million =Transcendent,
  Beyond the Million ≥Empyrean — the FINAL rarity achievement per Dakk: tier
  12+ — plus The Deep Spectrum =12 distinct tiers, Regicide / Throne Breaker
  =1/5 guardians, Realm Ranger / Master of Realms =8/16 realms owned).
  Deliberately NO achievement for the very top: the character sheet instead
  shows **"Highest grade ever reached"** (statistic over achievement, Dakk's
  call) and "Apex Guardians felled". New save field `guardians`
  (absent-default 0). Guide topics (rarity + new Apex Guardians), reference,
  HANDOFF updated; settle25 icon ceded 👑 to guard1.
- `tools/baseline.json` intentionally regenerated twice (deep spectrum, then
  summit+guardians): only `gradeTiers` changed plus the NEW `guardians` probe
  (50 probes now); all rolls/grades/genomes/duels/codes byte-identical.

## SHIPPED in v1.2 "The Living Frontier" (2026-06-11)

- Cinematic celebration system: tier-scaled full-screen spectacles for
  Legendary+ discoveries, newborn bloodlines, conquest wins, first-witnessed
  events (queued, tap-dismiss, fxOn-gated, shake at tier 6+).
- Creature injury system: persistent genome.hurt; conquest scars + bad-meal
  wounds; feeding-as-medicine (loved mends most); conditions on cards/picker;
  battleStats guarded so the v1.0 fingerprint stays byte-identical.
- v1.2 bump (everyone's bulletin re-arms), build number in Guide footer,
  new-URL bullet in notes.

## NEXT BATCH for v1.3, before the bump (carry-over for the next session)

Dakk's direction from the 2026-06-11 late-night session (his words paraphrased):

1. **Story coherence pass (v1.3)** — revisit the narrative (Prime Codex /
   Pathfinders fiction, intro, endings, Guide lore) so it's coherent and
   in line with where the game is going: the deep spectrum, the summit
   grades, named Apex Guardians, and the card-collection identity. Weave
   guardians into the Pathfinders story rather than leaving them mechanical.
   Not started — needs a focused pass over intro text, SIGS hints, ending
   text, and Guide category blurbs.
2. **Release notes discipline** — keep revising RELEASES[0] (v1.3) in place as
   the version grows; same-version revision is explicitly OK per Dakk.
3. After both: offer the v1.3 bump + deploy again.

## Next version (v1.4 runway, per Dakk)

- **More animal and planet abilities, with balance** — expand the 11 biome
  ability families (more variety per theme, possibly guardian-unique
  abilities) and give planets/worlds active abilities too; explicit balance
  pass alongside (duel math lives in runDuel/battleStats; budget formula
  `170+tier*38` now spans tier 0–14, so high-tier power creep needs watching).
- Guardian-specific battle intros / unique guardian abilities (follow-on from
  Apex Guardians).
- "First discovery record card" worth sharing (a shareable keepsake image/code
  for Legendary+ finds) — pairs naturally with the new foil card styling.
- Cosmic events: lean further into "were you there?" — a witness log or
  commemorative entries.

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
