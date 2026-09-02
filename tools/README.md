# Celestial Frontier — verification toolkit

The v1.0 assertion suites were lost with the original working environment
(HANDOFF §4). This toolkit replaces them with something stronger: a behavioral
equivalence harness that boots the whole game headlessly and fingerprints its
deterministic core.

Requires Node ^20.19, ^22.13, or ≥24 and `npm install` at the repo root
(acorn + jsdom + ws).

## GitHub Actions budget gate

GitHub-hosted CI is manual, finite release evidence—not the development loop. The repository is
public and standard runners are free while it remains public; 3,000 is the fail-closed private/
ambiguous cap and current mode is tracked in `GITHUB_ACTIONS_BUDGET.md`. Before any GitHub
write, run the browser-free workflow-policy controls locally:

```bash
npm run actionsbudget:selftest
```

`npm run actionsbudget` inventories every workflow and rejects automatic spend, missing job guards,
run-by-default inputs, duplicate-run concurrency, an unparked publisher, a second battery runner,
and unknown workflow files. Its selftest mutates every owned direction and must reject each one.
`node tools/validate.js` invokes the real policy check before any heavier validation. While the mode
is `FROZEN`, do not push, label, dispatch, rerun, merge, sync, or publish; build and test locally.

> ## ⚠ `npm install` IS NOT ENOUGH — two suites need a real browser
>
> **Run `npm run preflight` on any new machine before trusting the battery.**
>
> `package.json` declares **acorn**, **jsdom**, and the raw-CDP **ws** transport. But `uilayout.js` and
> `bootperf.js` drive a **real browser** — a system binary runs headless and is
> controlled over CDP. There is no Playwright, no Puppeteer, no npm browser driver
> anywhere in `tools/`. So a clean clone that runs `npm install` gets **seven of the
> nine suites**, and the two that need a browser cannot run — or, worse,
> simply never get run and the battery looks complete.
>
> This went undeclared until **2026-07-31**, when port Phase 0's Gate A deliverable
> *"reproduce all executable dependencies in a clean CI environment"* surfaced it
> (ROADMAP 9h).
>
> **Browser ownership:** `uilayout.js` consumes the shared
> `port/v2/tools/browserpath.mjs` resolver and `browsercdp.mjs` launcher. An exact
> `$CF_BROWSER` is authoritative; CI requires it in the effective owning step or job environment.
> A step pin may intentionally override a serialized job's different browser, but a previous step,
> duplicate mapping, or inline command override is not authority. The launcher uses
> browser-assigned port 0 plus `DevToolsActivePort`, records the canonical executable
> and complete `Browser.getVersion` provenance, retains bounded startup stderr, detects
> early exit, and owns bounded shutdown/profile cleanup. Root preflight and
> `uilayout` consume one monotonic, absolute spawn → endpoint → socket-open startup deadline;
> WebSocket opening also has a validated phase cap that defaults to the startup budget
> and is clipped to the startup time still remaining; only post-open CDP work consumes
> the command ceiling. Each post-open command owns one absolute monotonic deadline, not one
> best-effort timer: if its timeout callback wakes before the boundary, it re-arms only for the
> remaining interval under the same deadline; only the clock at or beyond that boundary may reject,
> while a response received at/after it remains late. Expiry during initial timer arming rejects
> without transmitting the command. No fresh clock, cap extension, or retry is
> allowed. Portable controls prove just-before command result/protocol receipt, reject exact/late
> result and protocol-error receipts, and separately prove delayed-open success, explicit-cap and
> remaining-startup rejection, fail-closed pre-construction expiry, constructor-overrun
> rejection with guarded CONNECTING cleanup, just-late-open rejection, invalid-cap pre-launch
> rejection, and failure cleanup. Endpoint discovery also requires two consecutive identical,
> fully valid `DevToolsActivePort` snapshots: parser-invalid regular-file content is treated as
> potentially incomplete inside
> the same one-process startup deadline, while wrong file types/links fail immediately and
> persistent malformed content fails at that deadline before any socket. Portable controls stage
> a valid-looking prefix, a port-only file with its endpoint line missing, invalid endpoint syntax,
> plus persistent malformed content and integrated unsafe-file rejection,
> final-endpoint socket identity, one child, and cleanup. Real-browser legs assert profile cleanup in `finally`
> on either rejection or success. `bootperf.js` invokes that same
> executable resolver, so it cannot validate or select
> a different browser; bootperf still owns its older CDP lifecycle and is not covered by
> the launcher's lifecycle claims.
>
> On POSIX the launcher does not treat a released numeric PGID as ownership. A detached Node
> sentinel remains the group leader, launches Chromium non-detached in that group, reports exact
> browser lifecycle, and performs the final TERM/acknowledged-SIGKILL barrier while its own
> identity is still live. An acknowledgement-loss watchdog owns the same terminal group kill.
> Parent success requires exact final group identity plus sentinel SIGKILL exit/close. The parent
> performs no negative-PGID probe or signal at any point; only the still-live sentinel addresses
> its own group. Lifecycle acceptance is phase-specific: before owned Close, every exit/error is
> red; after a `Browser.close` request, only `{ code: 0, signal: null }` is clean; during POSIX
> owned shutdown, clean exit or exact SIGTERM/SIGKILL is accepted, while a crash signal, browser
> error or nonzero exit stays red. Only afterward does the parent remove and stability-check the
> profile. Stderr-forwarding failure and sentinel-protocol drift also fail closed. Windows retains
> bounded `taskkill /T` then `/T /F`: an external integer/null-signal exit is accepted only after
> the exact tree request succeeds, and an exit observed while that request is pending is deferred
> and checked against its latched result after cleanup. Executable controls include an abnormal
> post-`Browser.close` SIGABRT process-group fixture and an integrated fake-Windows
> `openChromiumCdpWithLauncher` run where code 17 arrives before taskkill resolves; the latter
> proves no `Browser.close`, one successful tree request, and socket/profile cleanup.
> On macOS, Chromium cannot register with LaunchServices from inside the Codex
> Seatbelt profile. The resolver/launcher therefore rejects
> `CODEX_SANDBOX=seatbelt` before browser spawn and directs the command through
> approved elevated execution. This prevents an environment refusal from creating
> a misleading Edge crash report before CDP or a page exists. The two historical
> `port/spike` screenshot launchers also resolve through this guard; current macOS-
> capable repository browser tools therefore fail before spawn inside Seatbelt.
>
> **PR #32 timer/Planetside evidence (2026-08-20):** GitHub Actions run `32350971816`, job
> `96369841133`, attempt 1, tested synthetic merge
> `25200b616bbd509f50eaa18f0a8b27ad20dc83e0` for pushed head `1187de0…`. Its final
> `Runtime.evaluate` timeout fired at `1999.758726` ms against 2,000 ms, even though the target was
> still timely and its recorded completion preceded the deadline by `0.241274` ms; the independent
> root heartbeat fulfilled in `7.410808` ms. The valid terminal report therefore classified
> `instrument-fail`, blocked all 78 outcomes, and made no product verdict. Frozen launcher SHA-256
> `36a832bc8cc32ba56373d1fa6d7339903a37a07b337fbf2748bbf95e489061d0` moves the Compendium
> measurement authority from historical `bb03a3af…` to
> `f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409`. Paired baseline5 and
> independent candidate8/9/10 historically activated budget/test `8ffd0d8e…` / `121ab8cd…` for
> producer `1c8200d7…`; their raw evidence remains truthful only for those bytes.
>
> Exact `c095500…` then passed Compendium and one-attempt Smoke before its first full Glass run
> preserved one no-retry product finding: Chrome 152, 12/12 rows, 58/58 controls, zero instrument
> failures, and a 12.5px compact-phone Survey/Planetside overlap. The bounded 44px Survey / 8px gap /
> 72px scrollable Planetside repair changes producer authority to `e59685b1…`; measurement was
> `f9710bdf…` before the later cold-start transition. Clean committed source
> `2a105d51397eef97542d856ed3b1bb23edf2b028` collected paired
> baseline6 against legacy `3844701…` plus independent candidate11/12/13 under exact Edge .86. All
> four were one-attempt/no-retry; candidates replay 78/78. Their historical budget/test SHA-256 values are
> `ebe5b5c38f4796652ebbe6110c19a5ad31c310d63ca3adbf5fd4575e3724527d` /
> `ec956b8a7d3bad96736deab42e0ac79e59e6cf9010559723d2dac2249e463a83`; all 40 ceilings exceed their
> maxima and the four-fault baseline breaches 14 phone / 13 desktop fields. Focused 11/11,
> Compendium selftest 222/222, and semantic validation proved that ruler only. Exact pushed head
> `f9ae372f13d9a420e302f05e277b4445efb790c0` subsequently passed the complete local battery once,
> including Compendium 78/78, Smoke with zero findings, Glass 12/12 and 58/58, nine automated
> personas, root layout 787/787, and verified nonpublishable preview packaging/smoke.
>
> GitHub Actions run `32367902426`, Compendium job `96421452463`, attempt 1, then tested synthetic
> merge `e449e84984400d0b0f4474496264d474424c81d7` (base `3844701…`, head `f9ae372…`) and stopped
> before `Browser.getVersion` or product measurement. Edge published its endpoint at
> `23657.701415` ms, leaving `6342.262417` ms of the 30-second absolute startup deadline for the
> declared 15-second socket phase. No Compendium run/report/outcome or retry exists.
>
> The bounded repair gives only the selftest's one real cold launch 45,000 ms startup, retaining
> 15,000 ms socket, 1,500 ms command, and 2,000 ms shutdown caps. Portable controls pass at
> 38,657 ms and fail at the exact/late 38,658/38,659 ms boundaries with one child and full cleanup.
> There is no warmup, relaunch, retry, fallback, or workflow change; generic and candidate startup
> remain 15 seconds and product observation remains 2 seconds. Launcher SHA-256
> `6892dea6df1d222f53093faf62f0b0e38a2d18c600b7191aa29befc9960632e9` establishes measurement
> authority `6ba58522fc961e145df4f065f913d99d8b18355a20d664b9bcdc90741057638a`; producer then remained
> `e59685b1…`. Clean source `374049536e…` collected baseline7 plus independent candidate14/15/16
> once without retry; each candidate replayed 78/78. The then-active browser-free budget/test
> `bb4da2bf0b…` (79,599 bytes) / `d242705ad9…` (20,766 bytes) retain all four baseline faults,
> 14 phone / 13 desktop breaches, and all 40 strict ceilings above the three-run maxima. This is
> activation, not certification. The 45-second CI cold-start allowance is accepted environment,
> not a game optimization target. Exact pushed head `139ce2f…` subsequently passed one complete
> local battery. Corresponding run `32383320206`, attempt 1, matched exact Edge .86 and every
> then-active authority before preserving a valid no-retry Planetside `product-unanswerable` red:
> target `Runtime.evaluate` took `2001.132592` ms against the unchanged 2,000 ms deadline while root
> `Browser.getVersion` answered in `10.401960` ms. The report contains zero outcomes, 78 blocked,
> and no review PNG; it is product evidence, not an instrument/transport or timing-policy result.
>
> The bounded product repair computes fitted globe demand from CSS diameter, scene scale, and DPR.
> Standard phone/desktop boot is 609/420px and selects 512. An exact generation/world owner re-reads
> the asynchronous bake, rejects stale completion and duplicate-tier work, and upgrades through 768
> to 1024 only when real zoom/DPR requires it; maximum tested demand is 1,248/1,280px. Producer is
> now `d3223177…` (index `dee9af3a…`, owner `assets/main-Da536xWA.js` / `28382873…`;
> worker/painter unchanged), under historical measurement `6ba58522…`. Then-active budget/test
> `74e88c2b…` / `485be9da…` (79,614 / 20,782 bytes) came from clean source `75a996af…`'s
> one-attempt/no-retry baseline8 plus independent candidate17/18/19 under exact Edge .86. Every
> candidate replayed 78/78; baseline8 retained all four faults and 14 phone / 13 desktop breaches;
> all 40 reused ceilings remain strictly above the three-run maxima. Report/sample pairs are
> baseline8 `0a8b831e…` / `a52bccec…`, c17 `6b86ca9d…` / `0818c86e…`, c18 `a9b28d79…` /
> `c368ba86…`, and c19 `440cb788…` / `abddfa84…`. The browser-free activation became exact head
> `96464d5e4ca59074c0d8d59719a90a5dedc2dd2d`, which completed its full same-head local battery.
> Corresponding GitHub Actions run `32394244417`, Compendium job `96507263338`, attempt 1, tested
> synthetic merge `63665b6…` and preserved a pre-product environment/instrument red. Its
> `ubuntu24/20260816.277` runner already had exact Edge 151.0.4129.86 newest, so plain apt install
> was a no-op. Browser-path and portable preflight selftests passed, but the live one-launch
> preflight saw no CDP endpoint inside the unchanged 45-second startup bound. The collector never
> ran; no Compendium report, outcome, review PNG, or retry exists. The verifier and artifact-upload
> reds are cascades from those absent outputs. Root/static and Chrome Smoke/Glass jobs passed.
>
> Across the retained PR #32 exact-Edge jobs, `ubuntu24/20260810.271` began with bundled .78,
> upgraded to the exact .86 package, and launched 4/4 times. `ubuntu24/20260816.277` already carried
> .86, made plain apt a no-op, and launched 0/3. This supports one bounded hypothesis only:
> SHA-verify the exact `.deb` and install those same bytes once with `--reinstall` to normalize the
> hosted runner. It did not prove the fix. The historical preflight selftest statically required both
> workflows' exact ordered URL/SHA/download/hash/reinstall/version/executable/following-preflight
> chain and rejected per-workflow removal plus outside-step decoys; that browser-free control was green
> but cannot prove live launch. This workflow-only normalization changes no timing, retry, fallback,
> live repository-tool behavior, product, browser package/version, measurement, producer, budget, or
> authority. Current Compendium workflows supersede that package-manager hypothesis: they
> SHA-verify `.101`, validate embedded package/version metadata, extract it under a fresh
> `RUNNER_TEMP` owner, and directly pin that executable in preflight, certification and named
> verification. The structural control now rejects apt use and every missing/wrong extraction or
> owner-path binding. Exact `731b2e2…` passed locally; hosted run `32420327368` was consumed at its
> 40-minute lifecycle-pending ceiling with no product verdict. PR #32 remains blocked, no rerun is
> authorized, and HUMAN review plus Arc 1B remain open.
>
> Exact local head `89bfa05…`, run `20260820-pr32-89bfa05-compendiummem`, later completed 78/78
> outcomes with zero findings and six PNGs, then exited 2 during owned browser shutdown. Terminal
> log `b0bb8abc…` is authoritative; pre-cleanup PASS report `66ba1366…` and verifier `98664dca…`
> are false-green. This is a one-attempt/no-retry post-measurement instrument red, not product
> certification or calibration.
>
> Clean lifecycle-repair source `c49e525…` then ran
> `20260820-arc1a-terminal-lifecycle-candidate20` once. It completed 78/78 product outcomes, zero
> findings, six PNGs, and complete lifecycle, but the reused `.86`-named app had self-updated to
> Edge `.93` / revision `@4a822b1b…`. Quarantine report/sample/log `175fac5e…` / `916dd12a…` /
> `7462144b…` as instrument evidence—not calibration, certification, product failure, or a reusable
> ruler.
>
> Candidate21/22/23 and paired baseline9 subsequently completed once each without retry under exact
> Edge `.86` and complete lifecycle. Every candidate replayed 78/78 with zero findings; baseline9
> retained all four faults. They are individually clean diagnostic history, but cannot activate:
> the old shared-sample identity compared fresh host-local executable paths and user agents. Both
> remain mandatory raw per-run provenance; shared browser authority is exact product/revision/
> JavaScript/protocol.
>
> Clean exact source `fb321f2…` then collected candidate24/25/26 plus paired baseline10, each once
> with zero retries and a distinct fresh `.86` path. All candidates completed 78/78 with zero
> findings, complete lifecycle, and six PNGs; baseline10 retained four faults. The formerly active budget/schema/
> contract/collector/selftest/test `70145575…` / `695d2529…` / `e7dfea1d…` / `07131f5e…` /
> `f86db74a…` / `0fa2e89d…` bind measurement `2318f57b…`, unchanged producer `d3223177…`, 3/3
> samples per profile, measured 1/1 baseline, and strict ceilings with 14 phone / 13 desktop
> baseline breaches. The focused control's initial 12/13 was its phone-only synthetic active state;
> adding matching desktop identities made it 13/13 without changing or rerunning browser evidence.
> No deadline, launch argument, workflow, product byte, producer, browser-CDP, or retry policy changed.
>
> Exact implementation `aecf386…` then bounded the owned static server at one immutable monotonic
> 2,000 ms close deadline. Just-before succeeds; exact/late/missing/error callbacks force-close all
> connections exactly once and reject, with reentrant/stale settlement controls. Cleanup red still
> suppresses PASS/sample. Collector/selftest/measurement/budget/focused-test are `0c7ec3ba…` /
> `0bbb3541…` / `23aacc2c…`; producer stays `d3223177…`. Clean `6736ef4…` then collected
> c27/baseline11/c28/c29 once each, zero retry, fresh exact `.86`: candidates were 78/78 with complete
> lifecycle and 18 PNG bindings; baseline11 retained four faults and 14 phone / 13 desktop breaches.
> Activation `b3957e1…` makes budget/test `546d3a81…` / `ef06252a…` active with all prior numeric
> ceilings still strict. Exact-head battery and HUMAN review remain open.
>
> **Browser point version is provenance, not root-gate identity.** `uilayout` seals the
> exact 787 `viewport/surface/name` outcomes across 10 viewports and requires complete
> browser provenance, but it does not compare browser-specific numeric samples. A compatible
> Chromium-family update therefore never triggers a rebaseline or threshold change. Root
> authority is canonical Chromium-family product + CDP `1.3` + the source-derived CDP method
> contract + complete executable/product/version/revision/UA/JS/protocol provenance. The exact
> Edge 150 build remains only in `port/baseline-v1.8.9/` as historical capture evidence.

## preflight.js — can this machine run the battery at all?

```
npm run preflight            # fail-closed compatibility/capability/provenance check
npm run preflight:ci         # the same fail-closed compatibility policy in CI
node tools/preflight.js --selftest  # bidirectional Node + browser-authority controls
node tools/browser-capability-probe.mjs --selftest  # portable method/sentinel/cleanup controls
node tools/preflight.js --json
```

Checks Node against the declared supported release lines, confirms the npm packages
resolve, derives the exact CDP method inventory from `uilayout.js` + `bootperf.js`, then
launches the shared canonical browser owner through `browser-capability-probe.mjs`. The probe
exercises every declared method with small response sentinels and publishes evidence only after
target/process cleanup. Wrong family, malformed product, CDP mismatch, incomplete provenance,
missing capability, cleanup failure, or an executable that is not a working browser is blocking.
Point-version differences are accepted and retained in provenance. `bootperf.js` uses the same
executable resolver and pinned `ws` transport, but retains its legacy fixed-port/startup/cleanup
lifecycle.
Exit 0 = everything required is present; exit 1 = a suite cannot run.

> **Negative-controlled in both directions before it shipped, and it caught itself.**
> The first version trusted `$CF_BROWSER` without checking the path existed, so
> `CF_BROWSER=/nope` reported **PASS, exit 0** — while the layout gate rejected the
> same value. A green-but-wrong state *inside the check written to prevent green-
> but-wrong states*. Fixed so preflight and the shared resolver both reject it. Required
> controls now include: supported Node lines accepted · 20.18/21/22.12/23 rejected · older,
> current and synthetic-future canonical Edge plus Chrome/Chromium accepted · non-Chromium,
> malformed product, wrong CDP, missing provenance, missing capability and weakened declared-method
> inventory rejected · command failure, empty screenshot/profile, false target-close and browser-
> cleanup mutants rejected · an executable non-browser rejected by a real CDP launch · normal compatible
> browser run → exit 0 · bogus `CF_BROWSER` → exit 1. There is no point-version assertion mode.

> ## ⚠ NEVER run `tools/extract.js` after editing `main.js`
>
> `extract.js` regenerates `main.js` **from the html**. `main.js` is the source of
> truth and is gitignored, so running it after an edit **silently discards every
> change you have made since the last build.** It exists only to bootstrap
> `main.js` on a fresh clone, once.
>
> The everyday command is `node tools/build.js` (main.js → html). If in doubt,
> use `validate.js`, which builds for you.

## goldenseeds.js — the 10,000-case parity corpus for the port

```
npm run goldenseeds              # re-run and compare (a GATE)
npm run goldenseeds:capture      # rewrite the fixture — see the warning below
node tools/goldenseeds.js --capture --count=500 --heavy=100   # quick pass
```

**Why this exists alongside `baseline.json`.** The 50-probe fingerprint proves *this
build still behaves like v1.0*. It does **not** give a TypeScript re-implementation
enough to check itself against: 50 hand-picked cases is a smoke test, and when it fails
it cannot tell you *which input* diverged. `golden-seeds.json` is the parity corpus —
**10,000 seeds × 25 generators = 178,000 cases**, with a hash per seed, so a failing
port is pinpointed to one seed instead of one function.

Lives at `port/baseline-v1.8.9/golden-seeds.json` (~4.3 MB). Captures in ~7s.

**Cross-language by construction:**

- **Seeds are listed explicitly.** A port must not have to reimplement a PRNG just to
  obtain test inputs — that would be a second source of divergence.
- **Canonical form** before hashing: numbers → `Math.round(v*1e9)/1e9` (non-finite →
  `String(v)`), object keys sorted, `undefined` → `null`. This is the **same 1e-9
  rounding `probe.js` uses**, reused deliberately so both fixtures agree on "equal".
- **FNV-1a 32-bit run twice** (bases `0x811c9dc5`, `0x9e3779b9`), concatenated to 16 hex
  chars — ~10 lines in any language, no crypto import.
- **Rollup** per generator for the cheap check; **perSeed** to localise a failure.

> ⚠ **Never re-capture to make a failing `--check` pass.** Exactly the `baseline.json`
> rule: a mismatch means observable generator behavior changed. Re-capture only when the
> change is intended and recorded.

> **Negative-controlled both ways.** Corrupting one stored hash (and recomputing its
> rollup, so only the per-seed value is wrong) makes `--check` fail *and name the exact
> seed*. It also caught a bug in itself: the first version took the corpus size from CLI
> defaults in `--check` too, so checking a 50-case fixture re-ran 10,000 and reported
> "26 generators diverged" — a **false alarm**, and a check that cries wolf gets ignored.
> `--check` now takes its counts from the fixture unless `--count` is passed explicitly.

## codefixtures.js — the codec and load-path hardening corpus

```
npm run codefixtures            # re-run and compare (a GATE)
npm run codefixtures:capture
```

Pins `encodeCreature`/`decodeCreature` (share **and** champion codes — same function,
`champ` is the 2nd arg and carries xp), `encodeWhere`/`decodeWhere`, `normGenome`
(untrusted import hardening) and `_sanitizeSavedGenome` (load-path hardening).
108 curated cases at `port/baseline-v1.8.9/code-fixtures.json`.

**Curated, not random — deliberately.** `golden-seeds.json` covers volume. A codec and
a hardener need the opposite: named adversarial edges with stated expectations. A random
corpus will never contain `size: 1e6`, a `__proto__` key, or a 400-character name.

**⚠ The `size_*` cases are the point.** `crossGenome` mutates `size` without wrapping, so
honestly-bred genomes carry `size > 5`. v1.8.6 added a load-path clamp that permanently
rewrote ~12% of bred creatures into titanic ones; v1.8.7 reverted it. The fixture asserts
**six `sizePreserved` invariants outright** — `_sanitizeSavedGenome` leaves `size`
unchanged for 0, 5, 6, 12, −3 and 1e6. A port that "tidies" `size` here re-creates the
save-corruption bug. `normGenome` *does* coerce (`Math.abs((+v)|0)`, so −3 → 3) — the two
hardeners differ on purpose, and both behaviours are recorded.

> **⚠ Scope, stated honestly.** `buildSave`/`loadSave` are app-layer and not reachable
> from the probe realm, so this does **not** capture a full save round-trip. Gate C's
> *"a real veteran save imports successfully"* stays **open** — a synthetic save generated
> by the same code that reads it proves very little.

> **A shared-`WeakSet` bug was found here and fixed in both probes.** `san()`'s cycle
> guard was module-level, so the *second* canonicalisation of any object returned
> `«cycle»` — silently dropping fields. It corrupted this fixture (a recorded `size: -3`
> vanished) and was latent in `goldenseeds`; re-capturing there produced 25 of 25
> identical rollups, confirming it never bit that corpus. `seen` is now per-call in both.

## training-restart-fixture.js — genuine v1.8.9 Training checkpoint provenance

```sh
npm run trainingcheckpoint          # re-run the action-derived capture and verify the seal
npm run trainingcheckpoint:capture  # print a candidate only; never writes the baseline
```

This gate boots the real legacy `veteran_rich` save through `_probeboot.js`, clicks
`#setbtn`, clicks `#retrainopt` twice (the real Restart Training confirmation path),
and reads `JSON.parse(localStorage.cfcc_save_v2).tsnap`. The tracked result is
`port/baseline-v1.8.9/training-restart-fixture.json`, capture schema
`cf-v1.8.9-training-restart-capture/v1`.

The genuine checkpoint is exactly eleven outer fields:
`{st, ps, ac, es, c, ca, cx, it, eq, ea, e}`. It owns selected statistics,
player statistics, achievements, Stardust, Compendium, cargo, exceptional cargo
counts, items, equipment, equipment affixes, and Earth Atlas/home history. It is
not a whole save or whole expedition. The sealed snapshot is 2,074 JSON bytes,
SHA-256 `2e2f7c566a27e79398ea18650de9ac6acf236e92235fc293e4815b8bfefa22e3`.
The driver SHA-256 is
`c3f710d90782f7ba812a2082288ce860e5f41ce16cec2c28b3eaba1fb9ec454a`;
the source `veteran_rich` fixture-JSON SHA-256 is
`26da9dc04940132a2dd4627391ef4a1be57d6a758bf3b6efb4dc6b217c273a16`.
`view` is absent by construction: this evidence cannot justify a legacy
pre-Training route restore. Legacy Skip from Welcome retains Sol and full
completion after Land retains Earth; current-v2 `{view}` is the separate route
checkpoint.

The separate v2 Vitest
`port/v2/packages/persistence/test/training-checkpoint.test.ts` exercises the
classifier contract: exact key set in any order, detached recursive freeze,
`tut:0` pending round-trip, historical `tut:1` rescue,
missing/extra/wrong-container/over-cap refusal, and completed-save rejection of a
pending checkpoint. In that test the older synthetic
`save-fixtures.json:tut_midtraining.tsnap` value
`{codex:[], essence:10, marker:'pre-training-expedition'}` stays an
unknown/refusal negative control; it is not a legacy checkpoint and must not be
deleted or taught to pass.

This is deterministic jsdom/action-derived legacy evidence. It is not a real
browser capture, Nick's real veteran save, or Gate-C completion. The capture
command is deliberately non-writing so a candidate cannot silently re-baseline
the tracked evidence.

## audioprofiles.js — voice fixtures, and the vocabulary measurement

```
npm run audioprofiles           # a GATE — 200 voiceOf profiles must not move
npm run audioprofiles:capture   # fixture + the full 200,000-genome measurement
```

`voiceOf(g)` → `{kind, f0, rich, nz, vib, vibD, dur, sweep}` — deterministic per genome,
no audio synthesised. Fixture at `port/baseline-v1.8.9/audio-profiles.json`.

**Two jobs, and only one of them is asserted.** The 200-profile fixture is a parity
corpus and `--check` enforces it. The population measurement is *reported for the
record*, because a statistic drifting slightly is not the same event as a generator
changing behaviour — conflating those would make the gate cry wolf.

**Re-measured, not transcribed.** The claim that the human listening test is unblocked
rested on an external reviewer's v1.8.6 figures. Re-derived over 200,000 genomes against
v1.8.9, **the claim holds**: 199,709 distinct voices of 200,000 (99.855%), 0.874% pinned
at the 6 kHz ceiling.

**It also produces evidence for two open §23 decisions:**

- **`legacy` is a first-class 18th voice family at 5.543%** of procedural fauna.
  `_VOICE_KEYS` is `Object.keys(_VOICE)` and `_VOICE` *includes* `legacy`, so 1-in-18 is
  structural, not accidental.
- **`f0` is clamped to [60, 6000] and both bounds pin** — 0.874% at the ceiling and
  **0.612% at the floor**. The floor had never been reported.

> The family list is **read from `main.js`**, never hand-typed — a hand-typed vocabulary
> drifting out of step with its array is the CF1805-03 defect, and it was found in
> `voiceOf` itself. If the extraction fails, family shares are skipped rather than
> computed against a wrong list.
>
> ⚠ Note `voiceOf` still reads `(+g.size||0)%6`, a hand-typed modulus, correct today only
> because `FA_SIZE.length` is 6.

## The loop (run after every batch of edits)

```
# ...edit main.js (it is the SOURCE OF TRUTH; the html is a build artifact)...
node tools/build.js            # main.js -> html
node tools/validate.js         # builds, then ALL checks below + the fingerprint
node tools/smoke.js            # jsdom interaction suite (incl. full tutorial)
npm run trainingcheckpoint     # sealed action-derived legacy restart checkpoint
npm run layout:selftest        # fail-closed launcher/report/freshness negative control
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
node tools/duelxp-check.js     # REWARD OUTCOMES: plays a real duel, reads the ledger
node tools/sizedrift-check.js  # guards the size clamp regression (see below)
node tools/harvestclock-check.js # proves the harvest clock cannot be wound
node tools/publish-branch-site.js --selftest
                               # validates the parked branch publisher implementation,
                               # including its channel/package/identity reject paths.
# Automatic GitHub Actions publication is parked by GITHUB_ACTIONS_BUDGET.md.
# Any future promotion needs one separately authorized exact tested SHA and target.
```

Production and development deliberately use different package paths. Production replaces
the root HTML's build placeholder and otherwise preserves the v1.8.9 game. Development
requires `--package-root` and accepts only a verified `cf-dev-preview/v3` publication
candidate whose full source commit, `develop` branch, clean exact-archive inputs, expected
origin, shared v2.0 version, generated `version.json`, and byte inventory all agree. It
mirrors that package into the development site so stale legacy files cannot survive. The
package keeps its runtime origin refusal, `noindex` meta, disallowing `robots.txt`, and
manifest; visible version/build identity appears only inside the Guide, never as a floating
corner badge. The selftest must reject an unapproved artifact, a cross-channel branch, a
missing production build placeholder, and stale destination bytes.

`validate.js` fails loudly if any step fails:

1. **build.js** — splices `main.js` back between the html's `<script>` tags.
2. **checks.js** — `node --check` on the script, CSS brace balance, duplicate
   element ids, and a grep proving no `Math.random()`/`Date.now()` appears
   inside any `@module … [domain]` block (determinism guard, CLAUDE.md rule 1).
3. **make-probe-build.js** — injects `window.__PROBE_HOOK__` (the names in
   `probe-names.json`) inside the game IIFE so the probe can reach them.
4. **harness.js** — boots the probe build in jsdom (fake 2D canvas context,
   `pretendToBeVisual`), requires **zero boot errors**, then runs
   `probe.js` in-page: 50 probes over the deterministic core (PRNG, naming,
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

## simrun.js `dom` — the reachability tier

```
node tools/simrun.js dom 24        # → tools/simreport-dom.json
CF_SRC=/path/to/other.html node tools/simrun.js dom 24    # A/B another build
```

Every other expedition tier (`fast`, `deep`, `medium`, `veteran`) takes its actions
by calling a probe hook — `H.craftItem()`, `H.tryCapture()`, `H.equipItem()`. That
proves the **action** works. It cannot prove a **player could reach it**, which is
why 1,000-session tiers were structurally blind to CF1802-07 (a Fabricator button
with no handler at all) and CF1802-09 (a roster row that minted a species). Both had
to be found by an external round.

In `dom` mode a covered action is driven through the real control, and the press must
**land** — proven by a before/after effect snapshot, never by the fact that a click was
dispatched. Three findings, kept apart because they have three different fixes:

| finding | meaning |
|---|---|
| `absent` | no control for an action the API says is possible |
| `disabled` | the control refuses while the API accepts (a gating disagreement) |
| `dead` | the control accepts the press and nothing happens |

**Adjudicating `dead` is the whole design.** "Pressed it and nothing changed" is *also*
what a legitimately-unavailable action looks like, so a naive before/after check cries
wolf on every unaffordable recipe. The tier records `dead` only if the API path then
succeeds from the same state. A harness that cries wolf gets ignored, and an ignored
harness is worse than none.

`uncovered` is reported on purpose. A tier that silently skips what it cannot drive
reads as "all clear" when it really means "did not look". Currently covered: **craft**.
`capture`, `equip`, `feed`, `breed` and `heal` need panel/picker state the expedition
never establishes — they stay API-driven and are counted, not quietly omitted.

Adding an action means adding a `UI_PATHS` entry: `open()` makes the surface reachable
(idempotent), `find()` returns the control a player would press, `effect()` returns a
comparable snapshot the action must change, optional `why()` makes a finding
self-diagnosing.

⚠ **Scope.** jsdom has NO LAYOUT, so this tier proves a *live handler* exists — not that
the control is on screen, unburied or tappable. `tools/uilayout.js` owns that half, in a
real browser with hit-tests. Together they cover reachability; neither does alone.

**Negative-controlled both ways** via `CF_SRC` against deliberately broken builds — the
only reason a `PASS` here means anything:

| build | ok | absent | dead | verdict |
|---|---|---|---|---|
| craft handler neutralised (`const cr=null`) | 0 | 0 | **183** | FAIL |
| `data-craft` attribute renamed away | 0 | **178** | 0 | FAIL |
| real build (24 runs, 1,488 presses) | 99.3% | 0 | 0 | **PASS** |

A caution worth repeating: the first four iterations of this tier reported 141, then
106, then 85 findings, **all of them the harness's own fault** — a stale Shipyard (the
bot mines via API, which never fires the UI's ore-arrival re-render) and the Research
Bench being up instead of the Fabricator (`yardView` renders one bench at a time, and
both use `.bset` rows, so the wrong one looks superficially right — `.fabgrp` is the
tell). Distrust this tier's first findings until the controls above pass.

## duelxp-check.js — asserting that a reward ARRIVED

```
node tools/duelxp-check.js              # the current build
node tools/duelxp-check.js --src=<html> # any build, for negative controls
```

Added 2026-07-30 (round 8, CF1805-02). It boots the game, catalogues a champion,
drives the **real** friendly-duel flow — arena → paste a challenger code → Fight →
Skip — and then reads the catalogue entry's XP.

It exists because of a specific, embarrassing gap. `smoke.js` already had a
duel-XP check; it called `awardXP()` **directly**, so it stayed green through every
build in which the friendly duel paid nothing at all. The +8 "a duel won" award had
never paid in **any** shipped build: the guard derived a correct identity and the
award used a different one that is `undefined` at every reachable call site. A test
that calls the reward function proves the reward function works. It says nothing
about whether the game ever calls it.

| build | result |
|---|---|
| pre-fix (`awardXP(mine.id, 8, …)`) | **FAIL** — `xp 0 -> 0`, while `duelwins` still increments |
| fixed (`awardXP(_mid, 8, …)`) | **PASS** — 6/6 |

The negative control matters more than the pass here: it reproduces the exact
reported shape, where the win counts toward rank and achievements while the
creature that won it gets nothing.

`startDuelWithCode` was added to `probe-names.json` for this (254 names) — the
sanctioned way to reach a binding inside the game IIFE.

**The generalisation, which is still open work:** the external round has asked five
times for this treatment across *all* nine advertised XP awards. Three were dead as
of round 8. Only the duel ones have an outcome test today.

## uilayout.js — owned launcher and current-run evidence

`uilayout.js` now uses the same owned raw-CDP resolver/lifecycle as the v2 browser
gates. Chromium chooses an unused port and publishes it through the owned profile's
`DevToolsActivePort`; the shared launcher then opens its WebSocket inside the same
absolute startup deadline before issuing `Browser.getVersion`. The reader accepts the endpoint
only after two identical complete valid snapshots, so progressive regular-file publication stays
within that one launch/deadline; unsafe file types or links fail immediately and persistent
malformed content fails at the deadline before socket construction. The tool records the
canonical executable plus product,
revision, user agent, JavaScript version and protocol version. Startup and commands
are bounded, an early browser exit retains its exit state and bounded stderr head and
tail, and cleanup owns the sentinel-anchored POSIX terminal group barrier (or Windows taskkill)
plus removal of only its validated profile.

Every ordinary invocation atomically replaces `tools/uilayout-report.json` with
schema `celestial-frontier/uilayout-report@2`: first `running`, then terminal `pass`,
`fail`, or `instrument-fail`. The report is generated and ignored, but preserves the
legacy top-level `results` rows. It also binds a run id, target/viewport scope, exact
browser provenance, counts, timing and a structured failure. A terminal targeted PASS is
valid only for its requested viewport subset. A full 10-viewport PASS additionally binds
the exact 787 `viewport/surface/name` outcome inventory to the sealed
`port/baseline-v1.8.9/uilayout-report.json`; the old baseline remains immutable evidence.

```
npm run layout:selftest
CF_UILAYOUT_RUN_ID=local-review-001 node tools/uilayout.js
node tools/uilayout.js --verify-run=local-review-001
```

The selftest never accepts the prior report by filename: it seeds a stale PASS, runs
an executable that exits 73 with `UILAYOUT_SELFTEST_EARLY_EXIT`, and requires a
current `instrument-fail` report with that diagnosis, a rejected stale run id, and no
owned profile leak. It also removes one sealed outcome, repairs the summary counts so they
remain internally consistent, and requires inventory verification to reject that plausible
but incomplete PASS. `--verify-run=ID` accepts only the exact terminal schema-v2 run;
CI assigns the id, runs selftest + gate + verification, then uploads this report in a
separate always-run artifact step where a missing file is an error.

The first mutable-tree diagnostic through the new launcher preserved a sandboxed Edge
SIGABRT as red startup evidence. A separately permitted diagnostic then completed all
787 checks across 10 viewports. That second run proves reachability only; neither run
is exact-head certification. Exact-head authority for any later source comes only from a named
schema-v2 layout run plus exact-run verification inside the same local battery. Because that report
does not embed Git source, the caller must also retain a commit-tagged run ID, unchanged target blob,
and matching clean HEAD/status before and after the run and verifier. Terminal-green PR test-merge
CI corresponding to that pushed head remains separate; this reference does not cache the current
outcome. For the current sentinel repair, the final seven same-source targeted Glass viewports
passed as bounded diagnostics; the clean unchanged-source certificate remains pending.

## uilayout.js — the training-card reachability pass

Four raisable surfaces (`#log` `#codex` `#chpanel` `#records`) × two lesson-card
positions × 10 viewports = 40 checks, sampling a 63-point grid per element so the
numbers are directly comparable to the external round's.

⚠ **Read this before trusting a green run.** The first version of this pass measured
with the card pinned at the **top**, and came back clean on the very case round 8
reported — a top-pinned card and a bottom-anchored board never share a band on a
tablet. Their card had **dodged to the bottom** (the opposite-half rule), which is
exactly where those boards live under `@media (max-width:900px)`. Adding the dodge
pass reproduced their measurement verbatim: `ipad-mini · Compendium · 0% reachable ·
63/63 blocked by #codex`.

A gate that agrees with a bug report by accident is worth nothing. Reproduce the
**reported geometry**, not a convenient one — and negative-control it by stripping
the fix (`--url=` a patched copy) before believing the pass.

## One-time refactor tooling (kept for the record)

`refactor/` holds the scripts that performed the 2026-06 SOLID restructure:
`structure.js` (declaration map), `analyze.js` (cross-reference / TDZ-hazard /
shared-state analysis driven by `modules.json`), `wrap-modules.js` (wrapped
line ranges into revealing-module IIFEs without touching statement bytes),
`banner-sections.js` (app-layer section banners + architecture TOC). They are
not needed for day-to-day work.

## sizedrift-check.js — the guard against re-adding the `size` load clamp

```
node tools/sizedrift-check.js              # the current build
node tools/sizedrift-check.js --src=<html> # any build, for negative controls
```

Added 2026-07-31 (round 9, CF1806-01). v1.8.6 shipped two fixes for one problem that contradicted
each other — `battleStats` wraps `size`, the load path clamped it — and the clamp permanently
rewrote honestly-bred creatures on their next load.

It asserts the outcome in both directions:

1. an honestly-drifted genome (built by the build's **own** `crossGenome`/`evolveGenome`) survives
   `_sanitizeSavedGenome` **unchanged**, and its vitality does not move;
2. a crafted `size:1e6` still lands inside the legitimate range — i.e. the wrap alone closes the
   exploit the clamp was written for.

| build | result |
|---|---|
| v1.8.6 (clamp present) | **FAIL** — `size 9 -> 5`, `vit 80 -> 88` |
| v1.8.7 (clamp removed) | **PASS** — 4/4 |

Check 3 passes on *both* builds, which is the point: it demonstrates the clamp was redundant as
well as harmful. It also asserts its own premise (that breeding really does drift `size` past 5),
so if `crossGenome` ever changes, the check reports that rather than silently testing nothing.

## uilayout.js — the training DOCK pass

Alongside the training-card pass, `uilayout.js` now asserts that **every dock control is the
topmost element at its own coordinates** while each of the four raisable boards is up, on every
viewport at or below the 900px dock breakpoint. Scoped there deliberately: above it those same ids
are rail buttons with different layout, and a board overlapping them is a different question with a
different answer (laptop/desktop report overlaps on v1.8.5 too — pre-existing, filed separately).

⚠ **It took three corrections before it measured anything real**, and all three are recorded in
PROCESS_LAWS.md: a key collision that clobbered an existing check, **empty** boards that collapse
under `min-height:0` and never reach the dock, and stale `--tut-bot` left over from the dodge pass.
In its first two forms it passed against the shipped build the external round had already proven
broken. Run `--diag` to dump the geometry (viewport, `--tut-bot`/`--tut-cap`, board rect, every dock
button rect) when a result looks too clean.
