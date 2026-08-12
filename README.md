# Celestial-Frontier
Master the infinite

**Celestial Frontier: Cosmic Codex** — a single-file, offline-capable HTML/Canvas
game: a deterministic, procedurally generated, effectively infinite universe.
Survey worlds, catalogue alien life, breed hybrids, conquer planets, complete
the Prime Codex.

## Play

Open `celestial-frontier.html` in any modern browser. No build, no server,
no dependencies. Saves live in `localStorage`.

New expeditions begin with **Field Training** — a 21-step, fully sandboxed
tutorial that teaches every system by playing it (skippable). The **? Guide
to the Universe** is a searchable manual of every mechanic, and short
tooltips (long-press on touch, hover on desktop) link into it everywhere —
toggle them in Settings.

## Code

The whole game is one `<script>` inside the html, organized on SOLID lines into
deterministic **domain modules** (`@module … [domain]`), **art/service modules**
(`@module … [app]`) and **app sections** (`@section …`). Read the
`ARCHITECTURE` comment at the top of the script, then `CLAUDE.md`,
`ROADMAP.md` (current state), and `celestial-frontier-codebase-reference.md`.
(`HANDOFF.md` is a frozen v1.0 handoff, kept for history — not current state.)

Active v2 development lives in [`port/v2`](port/v2/README.md): a TypeScript
workspace plus a playable Pixi/browser slice. Its current Guide is a bounded
field manual for the systems already live in that slice, and its Field Training
currently covers the six chart/travel/landing lessons plus an honest graduation.
The legacy game's full searchable Guide, tooltip deep-links, advanced briefings,
and the rest of its 21-step training arc are still port work—not silently claimed as
complete. From `port/v2`, run `npm install`, `npm test`, `npm run typecheck`, and
`npm run smoke`; see its README for the full current battery and open gates.

## Develop

```
npm install                # once (acorn + jsdom, dev-only)
node tools/build.js        # main.js -> html   (⚠ NEVER extract.js after editing main.js —
                           #   it regenerates main.js FROM the html and discards your edits)
node tools/validate.js     # main.js -> html, then all checks: syntax, CSS braces,
                           #   duplicate ids, version consistency, class->rig,
                           #   colour atlas, biome profiles, render audit,
                           #   determinism grep, headless boot, and the
                           #   50-probe fingerprint vs the v1.0 baseline
node tools/smoke.js        # jsdom interaction suite (~553 checks incl. the
                           #   full 21-step Field Training tutorial)
node tools/uilayout.js     # a REAL headless browser: computed boxes + 44px touch
                           #   floors + elementFromPoint hit-tests across 10
                           #   viewports (787 checks). jsdom has NO layout, so
                           #   this is the only gate that sees a CSS rule which is
                           #   present, correct and completely inert.
node tools/balance-sim.js  # archetype win-rate band + ability-theme art band
node tools/deploy.js --release X.Y.Z
                           # re-runs the whole gate, then copies the build into
                           #   ../celestialfrontier.github.io and pushes -> live.
                           #   The release target must match GAME_VERSION AND
                           #   package.json. ⚠ THEN `git push origin main` — deploy
                           #   ships the SITE repo only, so every release is TWO pushes.
```

Run on demand rather than every batch — each closes a blind spot the four gates above
cannot see by construction:

```
node tools/bootperf.js --save=none --cpu=4 --cpuprofile --assert
                           # COLD BOOT. Separates painted from ANSWERABLE: a gate can
                           #   be drawn and hit-testable while the main thread is too
                           #   busy to reply. Enforces the art-hold law.
node tools/simrun.js dom 24
                           # UI REACHABILITY. Takes actions through the real controls
                           #   and proves the press LANDED, so a button that exists but
                           #   is wired to nothing fails here. The other simrun tiers
                           #   call probe hooks and cannot see that.
node tools/duelxp-check.js # REWARD OUTCOMES. Plays a real duel through the arena UI,
                           #   then reads the ledger to prove the XP ARRIVED. The old
                           #   check called awardXP() directly and so stayed green
                           #   through every build in which the duel paid nothing.
node tools/sizedrift-check.js
                           # SAVE ROUND-TRIP. Proves an honestly-bred genome survives
                           #   load unchanged. A clamp added in one release rewrote
                           #   ~12% of bred creatures into titanic ones on next load;
                           #   this fails on that build and passes on the fix.
node tools/harvestclock-check.js
                           # CLOCK GUARD. Winds the device clock forward a day and
                           #   proves a settled world grants no offline harvest.
```

Each of the above accepts a build to test (`--url=` / `--src=`), so a new check can be
replayed against an older build to prove it catches the bug it was written for. Do that
before believing a pass: multiple checks in this project's history have gone green while the
thing they guarded was broken.

**Play it live:** https://celestialfrontier.github.io/ — this repo is the source of
truth; the user-site repo is just the deploy target.

`original/celestial-frontier-v1.0.html` is the pristine pre-refactor build the
determinism baseline was captured from. Hard rule: nothing nondeterministic may
feed world/genome/descriptor generation — share codes and cross-device parity
depend on it.
