# Celestial Frontier — verification toolkit

The v1.0 assertion suites were lost with the original working environment
(HANDOFF §4). This toolkit replaces them with something stronger: a behavioral
equivalence harness that boots the whole game headlessly and fingerprints its
deterministic core.

Requires Node ≥ 18 and `npm install` at the repo root (acorn + jsdom).

> ## ⚠ NEVER run `tools/extract.js` after editing `main.js`
>
> `extract.js` regenerates `main.js` **from the html**. `main.js` is the source of
> truth and is gitignored, so running it after an edit **silently discards every
> change you have made since the last build.** It exists only to bootstrap
> `main.js` on a fresh clone, once.
>
> The everyday command is `node tools/build.js` (main.js → html). If in doubt,
> use `validate.js`, which builds for you.

## The loop (run after every batch of edits)

```
# ...edit main.js (it is the SOURCE OF TRUTH; the html is a build artifact)...
node tools/build.js            # main.js -> html
node tools/validate.js         # builds, then ALL checks below + the fingerprint
node tools/smoke.js            # jsdom interaction suite (incl. full tutorial)
node tools/uilayout.js         # REAL headless browser: computed boxes + hit-tests
                               #   across 10 viewports (add --shots for screenshots,
                               #   --vp=iphone,desktop to narrow, --url=FILE to
                               #   replay the gate against another build)
node tools/balance-sim.js      # archetype win-rate band + ability-theme art band
node tools/bootperf.js         # COLD BOOT: decomposes first-interactive in a real
                               #   browser over gzipped HTTP. Not "how fast is boot"
                               #   but "is the first screen ANSWERABLE" — a gate can
                               #   be painted and still refuse a tap. Run the art-hold
                               #   assertion with:
                               #     --save=none --cpu=4 --cpuprofile --assert
                               #   Other flags: --reps=N --profile=fresh|warm
                               #   --gate=SEL --settle=MS --url=FILE --verbose
node tools/deploy.js --release X.Y.Z   # runs the whole battery, then ships
node tools/deploy.js           # ship to https://celestialfrontier.github.io/ — stamps
                               #   BUILD_ID with the git sha and publishes
                               #   version.json so live sessions detect updates
```

`validate.js` fails loudly if any step fails:

1. **build.js** — splices `main.js` back between the html's `<script>` tags.
2. **checks.js** — `node --check` on the script, CSS brace balance, duplicate
   element ids, and a grep proving no `Math.random()`/`Date.now()` appears
   inside any `@module … [domain]` block (determinism guard, CLAUDE.md rule 1).
3. **make-probe-build.js** — injects `window.__PROBE_HOOK__` (the names in
   `probe-names.json`) inside the game IIFE so the probe can reach them.
4. **harness.js** — boots the probe build in jsdom (fake 2D canvas context,
   `pretendToBeVisual`), requires **zero boot errors**, then runs
   `probe.js` in-page: 49 probes over the deterministic core (PRNG, naming,
   world-gen, descriptors, genomes, breeding, duels, share codes, constants).
5. Compares every probe against `baseline.json` — captured from the original
   v1.0 file — and fails on any mismatch. **Do not regenerate the baseline to
   make a failure pass**; a mismatch means observable behavior changed.
   (If a change is *intentionally* behavior-altering, regenerate with
   `node tools/make-probe-build.js celestial-frontier.html tools/probe-build.html
   && node tools/harness.js tools/probe-build.html tools/baseline.json`
   and say so in the commit.)

## bootperf.js — what its numbers mean

A gate can be **painted** and still refuse a tap. Timing "first interactive" with one number
cannot tell a slow network from a blocked main thread, and that ambiguity is what produced the
"maybe it's cache warming on the larger file" hypothesis for the round-7 cold-boot outlier. It
was not cache: in the slow reps their own `load`/`DCL` were indistinguishable from the fast ones,
so the file was fully downloaded, parsed *and executed* at ~400ms every time.

So this tool decomposes instead of timing:

| column | means |
|---|---|
| `resp_end` / `transfer` | the network is done; bytes actually crossed the wire |
| `DCL` | the inline script has run — `askExplorerName` is synchronous, so the gate exists |
| `painted` | first rAF frame where the gate has a real laid-out box |
| `TTI` | first frame **within 50ms of its predecessor** at/after the paint — the thread is free |
| `blocked pre-gate` | longtask time standing between the player and their first tap |
| `blocked post-gate` | jank *after* the gate is up — a real but different defect |

`--profile=warm` serves the file from cache (`0 B over the wire`) with no TTI benefit, which is
the direct falsification of the cache story. `--cpu=4` matters more than any of it: the iPhone is
the primary device, and a desktop-speed number is the best case, not the case.

Two traps, both of which bit this tool before it worked:

- **Do not stop observing at TTI.** The first cut did, so a 1500ms block injected at 600ms
  reported `0ms` and passed. `--settle=MS` (default 2500) keeps the window open past `load`.
- **A `setTimeout` block cannot preempt the parser.** It runs *after* the gate legitimately
  paints, so it proves nothing. Only a **synchronous** block placed before the game `<script>`
  manufactures a painted-but-unanswerable gate.

Both controls found bugs in the instrument rather than the build — worth repeating before trusting
any change to it.

## One-time refactor tooling (kept for the record)

`refactor/` holds the scripts that performed the 2026-06 SOLID restructure:
`structure.js` (declaration map), `analyze.js` (cross-reference / TDZ-hazard /
shared-state analysis driven by `modules.json`), `wrap-modules.js` (wrapped
line ranges into revealing-module IIFEs without touching statement bytes),
`banner-sections.js` (app-layer section banners + architecture TOC). They are
not needed for day-to-day work.
