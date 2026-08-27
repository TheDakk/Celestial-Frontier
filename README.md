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

**Current local v2 candidate (2026-08-27; repair calibration complete, activation and current Slice evidence still open):** the current
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
v5 overflow authority. F4 authority loss latches one replacement before fallible repaint; if full
Shipyard is already open, it immediately becomes one read-only preview with zero Engineering
actions and exact app/DOM/diagnostic identity, while repaint failure is retained without cancelling
reload.

Current world history no longer treats a planet's leaf seed as global identity. A strict v5
manifest plus four byte-balanced shards bind landings and custom names to the complete
source-reproved CF1 galaxy/star/planet address, while v4 `land`/`names` remain compatibility
mirrors. Ambiguous imported seed facts retain their aggregate count without labeling either
collision world and are consumed by the first exact encounter without awarding a duplicate first
landing. Every name, Land, and Atlas mutation preflights the real combined extension limits and
refuses atomically before navigation, progression, or presentation changes.

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
status counterpart all agree. The result retains the global F3 transaction `revision` separately
from its Arc 4/5 `ownershipRevision`; the audio owner fences current ownership only against the
latter after the Arc 4 and Arc 5 ownership successors have been proven coherent. Sound or Creature
Voices off, hidden/unanswerable play, a miss, refusal, stale/reload convergence, route/counterpart
loss, or replay stays silent and releases its audio/runtime owner. Other creature actions,
ambience, music, combat/Guardian audio, recorded assets, full audio accessibility, device plateaus,
and HUMAN listening remain open.

The dedicated no-forged-time Arc 4 recovery collector and its mutation-sensitive selftest are
ready, but the collector is not standalone: it may run only after the same unchanged clean commit
has produced a terminal-green Slice report that passes named verification and a full Glass report
bound to that exact Slice ID that also passes named verification. Recovery receives both exact
predecessor IDs and its own exact report must pass named verification; stop after any failure and
never retry automatically. The uninterrupted real 20-minute certificate has not run. The former Compendium ruler
and exact-budget certificate `20260826-phase4-certification` remain truthful historical evidence for producer
`587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73`; they are not rebound to the
current product. Historical current-product calibration from signed source
`8ffd2e2b4a8ba070cb93d3df6a8f4a91a245f527` selected independent candidates
`20260826-slice-repair-candidate1`, `20260826-slice-repair-candidate2` and
`20260826-slice-repair-candidate3` plus paired legacy baseline
`20260826-slice-repair-baseline1`, each in one attempt with zero retries. That historical ruler bound
measurement `cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d`, former producer
`f7c87f2263bdac4014e5f56be5efc5ceeca7fbd2e32e25549a6b9e0260354224`, and budget-file SHA-256
`6284a394664c1039c9aca3f3c6d6dc5caf55295a58f4ac1e361974d3b519de52`. It retains all four sealed
baseline faults and the exact 14-phone/13-desktop breach inventory; only the phone warm ceiling
changed, to `524288`, while every other numeric ceiling remains unchanged. Clean signed activation
source `91f4e04410b893c43ee5d261ebfc1fa3be127c29` then supplied one historical exact-budget, no-retry run,
`20260826-slice-repair-certification`: terminal PASS, 78/78 outcomes, complete lifecycle and named
verifier PASS in 44,847 ms (`2026-08-26T23:42:19.150Z`–`23:43:03.997Z`). Its raw/gzip report
SHA-256 values are `81c27ed5caa12e0c114a788041dfc5d109742bb9d86a256b548a8e9443d46108` /
`6f3deb0ff3d748c7477c98c094684a3f1a04eb2ac3ffc89a055ec1c372710571`. The version-tolerant v2 browser authority remains Microsoft
Edge family + CDP `1.3` + sealed capability
contract `cf-v2-compendium-cdp-capabilities/v1` (SHA-256
`6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476`). Exact product version,
revision, JavaScript version, executable path and user agent remain mandatory per-run provenance;
phone and desktop samples with one run ID must bind that exact tuple. An Edge auto-update neither
forces calibration nor changes a numeric ceiling, while a real observed budget breach remains red.
Those `f7c87f22…` / `91f4e044…` bytes remain historical evidence for their exact producer. Compendium
and SceneMemory now own separate sealed Edge-family + CDP `1.3` capability/profile authorities;
the version-tolerance change itself altered no numeric budget in either ruler. SceneMemory's clean
three-run repair calibration is complete, while its selected heap-only activation, signed exact
certificate and the Compendium certificate remain pending. Root Gate-A remains a separate contract.

Signed clean source `862a75b316142348636abea442dab15e87393642` passed named Layout
`20260827-phase4-successor-layout` at 787/787 across all ten viewports, then ran named SceneMemory
`20260827-phase4-successor-scenemem` exactly once with zero automatic retries on Edge
`151.0.4129.107`. It completed cleanup and honestly stopped the serial campaign at 40/42: only the
phone and desktop heap/DOM budget outcomes were red. Compendium, Slice, Glass and recovery did not
run. The exact report is preserved under
`audits/ARC1C_SCENEMEM_CURRENT_INPUT_FAILURE_20260827_163818607.json.gz`.

The avoidable shell ownership is repaired. Production Inventory retains
its logical data, filters and page while closed, but no hidden item-row tree or six dormant event
subscriptions; registered panel openers now share one delegated focus-capture owner instead of one
closure per opener. A deliberately non-certifying dirty diagnostic reduced phone/desktop maxima to
676/673 nodes and 71/70 listeners, below the unchanged 704/80 ceilings. Warm ranges, slopes and
every other resource outcome remained green. Only the fixed absolute V8 and aggregate heap bands
remain above their historical ceilings, consistent with the materially larger synchronously loaded
Arc 2–5/F4 product graph rather than a lifecycle leak. Signed clean calibration source
`6c9ad85577bd90d6af883dd7b3f13556d24eb3ad` (tree
`a389646081f9fb5246825d1ac187eeb06504a8e4`) supplied exactly
`20260827-phase4-repair-candidate1`, `20260827-phase4-repair-candidate2` and
`20260827-phase4-repair-candidate3`. Each ran once with zero retries and complete cleanup on Edge
`.107` / CDP `1.3`. Their maxima were 11,566,152 / 11,630,936 V8 bytes and 17,681,258 /
17,636,682 aggregate bytes for phone/desktop, with unchanged 676/71 and 673/70 nodes/listeners.
The reviewed worktree activation changes only V8 to 12 MiB (`12,582,912`) and aggregate heap to
18 MiB (`18,874,368`), leaving exact phone/desktop headroom of 1,016,760 / 951,976 V8 bytes and
1,193,110 / 1,237,686 aggregate bytes. Every other ceiling remains unchanged, and the preserved
`862a75b…` paired red remains red on nodes/listeners. A signed activation source, fresh exact-budget
certificate and the restarted serial chain remain pending. Edge `.107`
is provenance only: a compatible point update never triggers recalibration, rebaselining, repinning
or a threshold change.

Current-input Slice retains six one-attempt/zero-retry reds. Signed-clean source
`1e0141be418ca20a37dd82f1115c00b1a005e090` supplied sixth run
`20260827085237038-27561-1f8e3c1771b7` on Edge `151.0.4129.107`. It failed after
397,101 ms with 23 findings across 16 scopes and no Arc 4 success evidence: required was false,
`ok`/ledger were null, and no success marker or ledger line exists. Glass and recovery correctly
did not run. Its first five independent roots—55-bullet Guide/Glass contract, paired ecology diagnostic
clocks, contextless blocked audio state, committed-only epoch timing and Survey/Training DOM
ownership—are locally repaired with negative controls. Exact Edge version is provenance only;
Slice and Glass judge fresh behavior/geometry rather than a version pin, so a browser update alone
does not trigger calibration, rebaselining, repinning or a ceiling change. Compendium and
SceneMemory own separate sealed Edge-family + CDP `1.3` capability/profile authorities. No current-input Slice PASS, Glass
result, recovery certificate, hosted/HUMAN whole-Gate or release authority exists.

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
`npm install`, `npm test`, and `npm run typecheck`; browser evidence then follows the README's
copy-ready immutable Slice → Glass → recovery chain, beginning with `npm run smoke:ci` and named
verification of the exact Slice run rather than a bare smoke command. Every successor receives the
exact predecessor ID(s), all stages use the same unchanged clean commit, and any failure stops the
chain without retry. See the v2 README for the full current battery and open gates.
Both root and v2 install surfaces declare the pinned raw-CDP `ws` transport and
support Node `^20.19.0 || ^22.13.0 || >=24.0.0`.

The current 2026-08-27 draft adds the bounded Tame revision fix note and therefore contains 55
bullets. It remains development-only and changes no production version, update popup or `rnSeen`.

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
