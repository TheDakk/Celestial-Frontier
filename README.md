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
56-release/398-bullet legacy history is present beside a separate unversioned v2 development
draft; the draft cannot trigger an update popup or bump a version. Field Training
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

**Human-test the v2 development build:** use the commit-bound package and
separate-origin procedure in [`port/DEVELOPMENT_PREVIEW.md`](port/DEVELOPMENT_PREVIEW.md).
A GitHub Pages project path under `celestialfrontier.github.io` is deliberately
forbidden because it would share production browser storage. CI packaging does
not publish a site; the separate preview owner/hostname has not yet been chosen,
created or deployed. Clean preview evidence is built from an isolated exact-HEAD
snapshot, and the shared workspace lock prevents Vite/browser evidence from
overlapping the source-mutating `overridecontrol` negative control. Structured
root-layout, slice-smoke, 12-viewport glass-matrix (including 8K), and automated-
persona reports retain matching provenance; root layout CI verifies its exact run
id before a separate always-run upload, and the persona synthesis is explicitly not a
human playtest. The glass reload observer orders its operation-phase and generic release
bindings with one scoped receipt ordinal: only release-started N → release N+1 →
release-complete N+2 can pass, while the producer-legal intermediate waits under the
unchanged import deadline. Immutable one-attempt CI #208 remains red: its 8K replacement
published ready, but the exact page target then missed the unchanged two-second response
bound while the browser-process heartbeat stayed healthy. The current repair keeps native
backing through UHD, then caps each full-viewport canvas at 2,073,600 backing pixels above
that tier (the tested 8K/5K 16:9 cases resolve to 1,920×1,080). The `d8684c…` dirty
PASS is prior diagnostic chronology only. Immutable clean executable source
`307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed root layout 787/787, v2
273/1 plus all gates, one-attempt smoke 0/10, and certifying glass 12/12 and 57/57
with exact 6/7/8 release tails, empty blocked/omitted ledgers, and zero findings,
instrument failures, or retries. Exact 8K was 171 ms / browser performance 161.9 ms,
five commands 1/1/1/3/0 ms, 33/129 ms release→commit/commit→ready, and two
1,920×1,080 stores /4,147,200 pixels at DPR 0.25; terminal-only performance was
606/685/74/171 ms. Glass/smoke/root-layout hashes are
`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f` /
`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723` /
`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`.
Preview `dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was browser-smoked
under Edge 151 over loopback, bound to expected separate origin
`https://dev-celestialfrontier.github.io`, with `publishable:false` (manifest
`1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d`).
Live Git/PR state determines current tip/upstream/checks; whichever final pushed tip
is selected requires matching CI. PR #11 stays draft until that matching CI is green and a real
multi-lens human playtest against
the exact preview is recorded, findings are resolved/retested, and final local
plus GitHub checks pass on the frozen pushed head.

`original/celestial-frontier-v1.0.html` is the pristine pre-refactor build the
determinism baseline was captured from. Hard rule: nothing nondeterministic may
feed world/genome/descriptor generation — share codes and cross-device parity
depend on it.
