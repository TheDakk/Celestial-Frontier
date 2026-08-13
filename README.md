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
workspace plus a playable Pixi/browser slice. Its Guide is now a source-addressed
continuation of the mature manual: all 9 categories /43 authored IDs /41 player
topics remain searchable and cross-linked, while capability-aware v2 copy marks
unported mechanics honestly instead of repeating their legacy promises. The exact
56-release/398-bullet legacy history is present beside **A New Foundation**, the
cumulative **v2.0 development** bulletin. Its categorized technical outline summarizes
the complete implemented playtest surface and explicitly stops at the current slice
instead of advertising open port work. `v2.0` identifies the playtest build only: the
bulletin remains `draft` / `Unreleased`, `V2_CURRENT_RELEASE_VERSION` remains `null`,
and reading it cannot trigger an update popup or mutate the seen-release marker. Field Training
currently covers the six chart/travel/landing lessons plus an honest graduation;
tooltip deep-links, Advanced Briefings, and the rest of the 21-step training arc
remain port work. From `port/v2`, run `npm install`, `npm test`, `npm run typecheck`,
and `npm run smoke`; see its README for the full current battery and open gates.
Both root and v2 install surfaces declare the pinned raw-CDP `ws` transport and
support Node `^20.19.0 || ^22.13.0 || >=24.0.0`.

## Develop

```
npm install                # once (acorn + jsdom + ws, dev/test-only)
npm run preflight:selftest # rejects excluded Node lines and executable non-browsers
node tools/build.js        # main.js -> html   (⚠ NEVER extract.js after editing main.js —
                           #   it regenerates main.js FROM the html and discards your edits)
node tools/validate.js     # main.js -> html, then all checks: syntax, CSS braces,
                           #   duplicate ids, version consistency, class->rig,
                           #   colour atlas, biome profiles, render audit,
                           #   determinism grep, headless boot, and the
                           #   50-probe fingerprint vs the v1.0 baseline
node tools/smoke.js        # jsdom interaction suite (~553 checks incl. the
                           #   full 21-step Field Training tutorial)
npm run layout:selftest    # rejects stale layout evidence and launcher/cleanup drift
node tools/uilayout.js     # a REAL headless browser: computed boxes + 44px touch
                           #   floors + elementFromPoint hit-tests across 10
                           #   viewports (787 checks). jsdom has NO layout, so
                           #   this is the only gate that sees a CSS rule which is
                           #   present, correct and completely inert. It uses the
                           #   shared owned CDP launcher and writes an ignored,
                           #   exact-browser/run-bound schema-v2 report. Full PASS
                           #   must match the sealed v1.8.9 787-outcome inventory;
                           #   --vp runs remain scoped diagnostics.
node tools/balance-sim.js  # archetype win-rate band + ability-theme art band
node tools/publish-branch-site.js --selftest
                           # publisher negative controls: branch/build identity,
                           #   exact v2 package, and development origin/noindex/
                           #   manifest isolation. Development identity is Guide-only.
                           # Successful push batteries publish automatically:
                           #   main -> immutable root v1.8.9 production HTML
                           #   develop -> tested v2.0 development package
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

**Development HTML:** successful push batteries publish `develop` to
https://dev-celestialfrontier.github.io/ after all gates pass. It is a separate
origin and must never be recreated as a path under the production origin. The
development publisher mirrors the already-tested, browser-smoked `port/v2` package;
production `main` continues to publish the immutable root v1.8.9 HTML. The development
page identifies itself as **Celestial Frontier v2.0 development** plus the full source
commit inside the Guide only—there is no floating corner badge. Runtime origin refusal,
`noindex`/`robots.txt`, the byte-hashed manifest, exact-commit archive build, shared
version file, and generated `version.json` remain mandatory safeguards.

**Human-test the v2 development build:** follow the commit-bound procedure in
[`port/DEVELOPMENT_PREVIEW.md`](port/DEVELOPMENT_PREVIEW.md) and record the exact URL,
full commit, manifest content hash, device/browser lens, starting save, findings, and
retest. A successful publication is a play surface, not proof of human play, merge,
release, or production readiness. Clean preview evidence is built from an isolated
exact-HEAD snapshot, and the shared workspace lock prevents Vite/browser evidence from
overlapping the source-mutating `overridecontrol` negative control. Structured root
layout, one-run slice smoke, 12-viewport glass matrix, and same-provenance automated
persona reports remain evidence; automated personas are not a human playtest. Resolve
current branch, commit, PR, and check state from live Git/GitHub rather than this README.

`original/celestial-frontier-v1.0.html` is the pristine pre-refactor build the
determinism baseline was captured from. Hard rule: nothing nondeterministic may
feed world/genome/descriptor generation — share codes and cross-device parity
depend on it.
