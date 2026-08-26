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
workspace plus a playable Pixi/browser slice.

**Current local v2 candidate (2026-08-26; uncommitted and not browser-certified):** the current
working tree completes the bounded source lanes that followed the retained Arc 5A checkpoint.
Gate B now recursively seals the exact 62-file domain-source inventory against DOM, storage,
`navigator`, network, wall/monotonic clock, and uncontrolled-random access; its only two waivers are
exact `document.createElement('')` expressions for CombatCore's legacy `playerAvatar` and
`paperdollAvatar` canvas painters. `galaxyHaze` and its cache moved byte-for-byte from WorldGen to
the app-layer `GalaxyArt` owner. Focused `search-travel.ts` and `app-chrome.ts` controllers now own
Search/CF1 travel and topbar/dock/context/hint/viewport lifecycle respectively, leaving `main.ts`
as their renderer/persistence adapter. F4 owns the active-play ecology-epoch edge and committed-only
projection refresh; persistence now fixed-points injected-clock notification stamps and
`conq[].e`, and preserves more than 4,000 legacy XP-first keys through a paired v4 binding plus
v5 overflow authority.

Deep Scanners now add one honest **Mineral veins** row to orbital Survey for an exact proven
lifeless non-Earth world, without exposing cosmic/exceptional veins, grade, reserves, progress, or
the grounded Mine action. One strict rarity projector maps raw deterministic tiers 0–14 to the
plain player-facing 0–9 vocabulary and discloses nothing for malformed input. Arc 5's compact
ownership model also fixes the approved bred-child care invariant: a new child receives exactly
half the lower registered parent's bounded `fed` value, symmetrically and once; the public
breed/care writer remains future work.

Audio is no longer package-only, but remains deliberately narrow. The app projects one exact live
owned creature into the deterministic signature/profile/call-plan pipeline, owns a fail-closed
five-bus runtime lifecycle, persists **Creature Voices**, and may synthesize one bounded fauna
greeting only after a native Tame gesture, an exact durable wild-fauna result, and its accessible
status counterpart all agree. Sound or Creature Voices off, hidden/unanswerable play, a miss,
refusal, stale/reload convergence, route/counterpart loss, or replay stays silent and releases its
audio/runtime owner. Other creature actions, ambience, music, combat/Guardian audio, recorded
assets, full audio accessibility, device plateaus, and HUMAN listening remain open.

The dedicated no-forged-time Arc 4 recovery collector and its mutation-sensitive selftest are
ready, but the uninterrupted real 20-minute certificate has not run. The current Compendium ruler
is correctly `calibration-required`: measurement authority
`cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d`, producer authority
`587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73`, empty phone/desktop
samples, a measurement-required paired baseline with null collector commit, and `ceilings:null`.
Its version-tolerant v2 browser authority is Microsoft Edge family + CDP `1.3` + sealed capability
contract `cf-v2-compendium-cdp-capabilities/v1` (SHA-256
`6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476`). Exact product version,
revision, JavaScript version, executable path and user agent remain mandatory per-run provenance;
phone and desktop samples with one run ID must bind that exact tuple. An Edge auto-update neither
forces calibration nor changes a numeric ceiling, while a real observed budget breach remains red.
This change is Compendium-only: SceneMemory and the root Gate-A browser contract are unchanged.

Browser-free verification of these local bytes is green: 121 test files / 1,354 passed / one
intentional skip / zero failures; root, app, worker, and `noUnused` TypeScript; an 884-module Vite
build; root validation with the unchanged 50-probe fingerprint; legacy jsdom smoke; and the
applicable contract/reporter/Glass/recovery/Compendium selftests. These are local working-tree
results only. No current-input Slice, Glass, Compendium calibration, recovery certificate, hosted
run, HUMAN review, whole-Gate closure, release, version bump, preview/publication, or deployment is
claimed.

The retained Arc 4/5A checkpoint remains useful historical foundation. Its source-addressed Guide
kept all 9 categories /43 authored IDs /41 player topics searchable and cross-linked; 24 topics
were partial and 17 unavailable. Native Survey-card Tame/Scavenge/Sample used a source-bound random
eligible pool with full-roster counts/odds, one shared hit-or-miss Biosphere Yield, committed-only
durable Compendium/creature/specimen and eligible first-only Stardust outcomes, plus storage/stale/
reload convergence; it did not offer targeted species selection or a Charter bioscan. The exact
56-release/398-bullet legacy history appeared beside **A New Foundation**, then at 54 draft
bullets. The bulletin stayed `draft` / `Unreleased`, `V2_CURRENT_RELEASE_VERSION` stayed `null`, and
reading it could not trigger an update popup or mutate the seen-release marker. Field Training had
six chart/travel/landing lessons plus an honest graduation and no Capture lesson; tooltip links,
Advanced Briefings and the rest of the 21-step arc remained open. From `port/v2`, run
`npm install`, `npm test`, `npm run typecheck`,
and `npm run smoke`; see its README for the full current battery and open gates.
Both root and v2 install surfaces declare the pinned raw-CDP `ws` transport and
support Node `^20.19.0 || ^22.13.0 || >=24.0.0`.

The approved next-stage product contract is
[`EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`](EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md).
It connects the planned Inventory/character portrait, visibly upgrading Shipyard,
item-instance loot, creature/companion ownership, active-play return missions, combat/
Guardian receipts and full HD audio into one deterministic capability ladder. It also
records the current implementation boundary and unfinished-system inventory: these are
design and acceptance contracts, not claims that every planned Phase-4 capability is live.
The player-respect rule is explicit—mastery, attachment and discovery without streak decay,
FOMO, paid random rewards, expiring missions or punishment for taking a break.
Any future recorded/source audio also follows the empty-until-proven rights contract in
[`AUDIO_LICENSES.md`](AUDIO_LICENSES.md); no scraping, unclear redistribution right,
remote voice service, microphone capture, or voice cloning is part of the plan.

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
                           # parked-publisher negative controls: branch/build identity,
                           #   exact v2 package, and development origin/noindex/
                           #   manifest isolation. Development identity is Guide-only.
                           # Automatic publication is disabled. Any future promotion
                           #   requires separate exact-SHA owner authorization.
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

**Development HTML:** automatic branch publication is parked by
[`GITHUB_ACTIONS_BUDGET.md`](GITHUB_ACTIONS_BUDGET.md). A future separately authorized
exact-SHA promotion may publish the tested `develop` package to
https://dev-celestialfrontier.github.io/. It is a separate origin and must never be
recreated as a path under production. Production `main` continues to preserve the
immutable root v1.8.9 HTML. The development
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
