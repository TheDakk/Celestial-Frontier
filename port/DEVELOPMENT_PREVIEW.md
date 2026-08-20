# Development Preview — Separate-Origin Human Playtesting

**Status:** process reference, matches preview packaging and branch-site publication as of
2026-08-16. This is not a release record.

## Separate-origin requirement; approved branch site

Celestial Frontier should have a continuously usable **development preview**, but it must
not be published as a path under `https://celestialfrontier.github.io/`.

The approved development owner is `Dev-CelestialFrontier`, with organization-site repository
`dev-celestialfrontier.github.io` at `https://dev-celestialfrontier.github.io/`. A successful
push-triggered `test-battery` on `develop` alone may publish the exact tested v2 package there; the publisher
checks the exact event SHA and branch, uses a target-specific deploy key, packages and browser-
smokes the exact `port/v2` v2.0 candidate, writes noindex/robots guards, and cannot target
production. Visible identity—**Celestial Frontier v2.0 development** plus the full commit—lives
inside the Guide only; there is no corner badge. Pull
requests, manual agent runs, and failed batteries cannot publish. This public DEV surface is a
playtest convenience, not human-play, Ready, merge, release, or production authority.

**Standing execution authority (Nick, 2026-08-13):** after a scoped agent PR into `develop`
is clean, mergeable, and terminal-green on its required battery, Codex or Claude Code may perform
that normal merge and monitor the resulting automatic DEV publication without a new prompt.
Do not ask again for a generic proceed after those same preconditions are met.
The authorization is limited to this existing mapped publisher; it does not authorize manual
site writes, a new host/key, `develop` → `main`, a release, or a production deployment.

GitHub Pages provides at most one user/organization site per account. Its default URL is
`https://<owner>.github.io/`; additional project sites use
`https://<owner>.github.io/<repository>/`. See GitHub's current
[Pages site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#types-of-github-pages-sites).
Consequently, a repository such as `CelestialFrontier/dev-celestialfrontier.github.io`
would normally publish under a **path on the production host**, not at a new host. A path
does not change the web origin, so it would share IndexedDB and localStorage with the live
game.

The chosen and implemented setup is the first of these genuinely separate-origin patterns:

1. **Recommended GitHub-only option:** create a separate GitHub account or organization
   named `dev-celestialfrontier`, then create its required organization-site repository
   `dev-celestialfrontier.github.io`. That produces
   `https://dev-celestialfrontier.github.io/`, a different origin.
2. **Custom-hostname option:** give a dedicated preview repository its own hostname such as
   `dev.<owned-domain>`. GitHub Pages supports
   [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).

Do not confuse `dev-celestialfrontier.github.io` with a repository name inside the current
`CelestialFrontier` organization. The hostname form works only when the owning GitHub
account/organization itself is named `dev-celestialfrontier` (or when a separate custom
hostname is configured).

GitHub Pages is static hosting, and a noindex directive is not access control. Treat a
published preview as visible to anyone who receives or discovers its URL. Never put secrets,
private tester information, tokens, or production-only data into the package. GitHub also
notes that Pages sites may be publicly available even when their source repository is
private; verify the selected organization's Pages/access-control plan before publishing.

## Storage and runtime contract

The v2 app currently owns:

- IndexedDB database `cf-v2-slice`;
- localStorage keepsake `cf_v2_import_original` when a legacy expedition is imported.

Those names remain stable. Isolation is supplied by the browser's **exact origin boundary**,
not by silently changing save keys in a test build. `tools/devpreview.mjs` therefore:

- rejects `https://celestialfrontier.github.io` and every path-based origin input;
- requires a root HTTPS origin;
- replaces each built module entry with a runtime origin guard;
- permits the guarded build to run only on that exact origin or loopback for local review;
- rejects either historical floating DEV-badge id/style and leaves visible version/build
  identity to the in-game Guide;
- injects `noindex,nofollow,noarchive,nosnippet` and writes a disallowing `robots.txt`;
- binds every packaged byte to `preview.json` with SHA-256, the full source commit, source
  branch/state, exact `port/v2` Git tree, dependency-lock hash, build runtime, expected
  origin, storage contract, and CI run identity;
- builds every clean review artifact and approved candidate inside an isolated `git archive`
  snapshot of exact HEAD. The archive includes the `port/v2` tree and the one external build
  input, `port/baseline-v1.8.9/content-registry.json`, by exact Git object ID. Its temporary
  dependency view reuses installed third-party packages but rewires every `@cf/*` workspace
  link to the archived source; the pinned lockfile hash is recorded. It never reads application
  source from the mutable working tree. This prevents a temporary edit that is restored between
  status checks from contaminating evidence;
- refuses dirty publication builds. `--allow-dirty` stamps `publishable:false` and
  `DIRTY · LOCAL ONLY` for local diagnosis only; this is the sole mode that builds the
  working tree;
- reads the shared `port/v2/version.json`, binds v2.0 plus
  `develop-<short-commit>` to the full commit, and writes the same identity to
  `preview.json`, the guarded runtime global, and packaged `version.json`;
- emits `publishable:false` by default, and its runtime refuses every remote origin. The
  reviewed candidate workflow and the mapped post-green `develop` publisher pass
  `--approved-publication-candidate`. The flag binds `publishable:true`; only the mapped
  branch publisher has destination write authority;
- writes only to the ignored `port/v2/apps/game/smoke/dev-preview-*` evidence root and
  never touches the production site repository.

The Guide identity, runtime binding and manifest are one safety boundary. Open the Guide and
confirm v2.0 plus the manifest's full commit before testing. A floating
`cf-dev-preview-banner` or `cf-development-site-banner` is itself a defect; stop and report it.

## Build and verify locally

From `port/v2`:

```sh
npm run preview:selftest
npm run preview:package -- --origin=https://dev-celestialfrontier.github.io
npm run preview:verify -- --verify=/path/to/extracted/dev-preview-package
npm run preview:smoke -- --root=/path/to/extracted/dev-preview-package
```

The default command produces a review artifact that runs on loopback but refuses remote
execution. Publication-candidate packaging requires a clean committed repository source. For an uncommitted local visual diagnosis
only, add `--allow-dirty`; that output is deliberately ineligible for publication.
The producer always runs a fresh Vite build and never trusts an old `dist/`. Clean and
approved builds come from the exact committed snapshot; dirty local builds are visibly
nonpublishable. The producer and browser check also use the shared workspace lock, so they
fail closed rather than overlap `overridecontrol` or another source-mutating/build gate.
`preview:smoke` then serves those exact packaged bytes over loopback and boots them in the
owned real Chromium harness at 320×568. It requires the app, canvas, manifest binding, and
Guide identity to be live; it rejects either historical corner badge id/style and requires the
Guide to show v2.0 plus the full manifest commit.
Every CI/publication workflow that packages a preview runs this outcome check before
upload or publication.

Phase-owned first launches declare their caller envelopes explicitly. The package browser check
keeps its fixed 30-second CDP startup allowance. Root layout (`tools/uilayout.js`) is the battery's
first browser launch; after the same pre-endpoint Linux phase recurred at 24 seconds in run
`31758515194` and at 30 seconds in run `32375329693`, it owns one captured 45-second startup /
15-second socket / existing 30-second command / 5-second shutdown call. `browsercdp --selftest`'s
first real provenance launch also owns 45 seconds, but exact-Edge Compendium workflows no longer
use that generic live leg as their authority proof: `port/v2/tools/compendiummem-browser-preflight.mjs`
owns one 45/15/sealed-5/2-second exact-browser, fresh-target, required-domain, evaluate/event and
cleanup proof without changing the hashed launcher/ruler. Its evaluate return and same-session event
share one immutable 5-second phase and must both arrive strictly before its deadline. The shared
launcher keeps its 15-second default for other evidence tools, and the browsercdp selftest's later
warm event-failure launch keeps its 10-second bound. The browsercdp selftest's earlier injected
WebSocket-timeout phase launches no real browser: a private seam starts a portable Node child after
writing one valid owned `DevToolsActivePort`, then requires the 200-millisecond socket timeout,
socket close, bounded child shutdown, and profile cleanup. A missing endpoint therefore rejects in
the wrong phase and fails the control instead of consuming a cold-browser allowance.
This split follows the immutable diagnosis from run `31815658572`: the named WebSocket case had
failed on its earlier 10-second Chrome-start phase. It adds no retry, fallback, workflow timeout,
or command/shutdown expansion.

Run `31870103561` exposed the complementary live-browser boundary: the first provenance leg found
its valid `DevToolsActivePort` within 30 seconds, but WebSocket opening reused the 1,500-millisecond
command ceiling and expired before `Browser.getVersion`. The launcher now treats startup as one
monotonic, absolute spawn → endpoint → socket-open deadline and accepts a separately validated socket-open cap
that can only consume the startup time still remaining. The socket cap defaults to the startup
budget rather than the post-open command budget;
the selftest's cold and warm real-browser legs explicitly own 15- and 10-second socket caps inside
their declared 45- and 10-second startup budgets, while commands remain 1,500 milliseconds and
shutdown remains 2 seconds. A delayed portable socket opens after a shorter command ceiling and
answers fake provenance. Separate portable controls prove the explicit short socket cap, clipping
to a shorter remaining startup budget, fail-closed exhaustion before socket construction,
constructor-overrun rejection with a provisional CONNECTING-socket error guard, rejection of a
just-late `onopen` before its overdue timer runs, one launch, socket/child closure, and profile
cleanup. Nonpositive/fractional caps reject before launch.
The real-browser legs assert profile cleanup in `finally` on either rejection or success; the
portable rejection cases prove failure cleanup. This changes no retry, fallback, workflow timeout,
browser selection, or product evidence rule.

Run `31887203990` exposed the preceding endpoint-publication boundary in the ninth fresh browser of
the full Glass matrix: the final `DevToolsActivePort` pathname was observable before the reader saw
two complete valid lines, so the old launcher rejected `invalid port` after 364 milliseconds even
though all eight earlier and three later rows passed under the same pinned Chrome. The shared reader
now requires two consecutive identical, fully valid raw snapshots before it constructs a socket.
Parser-invalid regular-file content is treated as potentially incomplete only inside the existing
single-process
monotonic startup deadline; a wrong file type, symbolic link, or unexpected filesystem error still
fails immediately, and persistent malformed content fails at that unchanged deadline with its last
parse diagnosis and zero socket constructions. Portable controls stage a valid-looking endpoint
prefix, a port-only file with its endpoint line missing, and invalid endpoint syntax before their
final forms, and separately prove persistent malformed rejection, immediate unsafe-file cleanup,
one child, final-endpoint socket identity, shutdown, and profile cleanup. This
adds no relaunch, retry, sleep, browser reuse, fallback change, or timeout expansion.

`preview:selftest` captures the exact preview-caller options on every platform and completes a
real-browser outcome. On POSIX it starts Chrome immediately while withholding the ready CDP
endpoint for 16 seconds, proving the generic allowance rejects without stealing
startup time from the exact preview caller. This is a bounded repair for browser
startup variance, not a retry or a workflow/job timeout increase.

Browser provenance is owned by each process. A `CF_BROWSER` value attached to one GitHub
Actions step does not carry into the next step merely because both belong to the same job.
The ordinary smoke, Glass, persona, preview, and root browser gates therefore pin and resolve
`/usr/bin/google-chrome` fail-closed; the manual workflow also restores that exact Chrome path
for its later smoke, matrix, persona, package, and preview-smoke steps. Do not depend on fallback
ordering when a runner has several Chromium-family browsers installed.

Arc 1A is the deliberate narrow exception. The current 1,500-row Compendium is virtualized;
list art uses leased, cancellable, deduplicated 132px thumbnails, detail uses a separately
owned 440px image, and Planetside uses the same lease path. Its standalone `compendiummem` gate
retains the Arc-local four-field browser authority
`arc1a-compendium-memory-only`: product `Edg/151.0.4129.86`, revision
`@083e754915c9ab93da1d8f7b9c860e4520273900`, JavaScript version `15.1.23.7`, and
CDP protocol version `1.3`. Executable path and user agent remain recorded provenance, not
cross-host match fields.

Ubuntu provisions `/usr/bin/microsoft-edge-stable` only for the ordinary Compendium job and
the manual Compendium selftest/run/verify steps. The package is the exact Microsoft
`microsoft-edge-stable_151.0.4129.86-1_amd64.deb` from
`https://packages.microsoft.com/repos/edge/pool/main/m/microsoft-edge-stable/microsoft-edge-stable_151.0.4129.86-1_amd64.deb`,
with SHA-256 `26b02cb1c6465756df94b9ef34191b614f3df627ba21b7b00b641f44cc1d8343`;
both workflows check those bytes, request
`sudo apt-get install --reinstall --yes "$edge_package"`, then verify the installed package version
and executable before use. The preflight selftest statically requires that unique owned install
step's exact ordered URL/SHA/download/hash/reinstall/version/executable chain followed by preflight,
and negative-controls removal from either workflow plus outside-step decoys. This reinstall is a
preserved hosted-runner normalization transition: activation head `96464d5…` passed its complete
local battery, but run `32394244417`, attempt 1,
stopped before product when image `ubuntu24/20260816.277`'s already-resident verified .86 made the
prior plain apt install a no-op and the unchanged one-launch preflight published no CDP endpoint.
There is no candidate report, outcome, review PNG, or product verdict from that job. Exact local
`89bfa05…`, run `20260820-pr32-89bfa05-compendiummem`, later completed 78/78 with zero findings and
six PNGs, then exited 2 during owned browser shutdown. Terminal log `b0bb8abc…` is authoritative;
pre-cleanup PASS report/verifier `66ba1366…` / `98664dca…` are false-green. This is a one-attempt/
no-retry post-measurement instrument red, not certification or calibration.

Clean lifecycle-repair source `c49e525…` then ran candidate20 once. It completed 78/78 product
outcomes, zero findings, six PNGs, and complete lifecycle, but the reused `.86`-named app reported
Edge `.93` / revision `@4a822b1b…`. Quarantine report/sample/log `175fac5e…` / `916dd12a…` /
`7462144b…` as wrong-browser instrument evidence—not calibration, certification, product failure,
preview authority, or HUMAN review.

Candidate21/22/23 and paired baseline9 then completed once each without retry under exact `.86` and
complete lifecycle. Every candidate replayed 78/78 with zero findings; baseline9 retained all four
faults. They are individually clean diagnostic history only because the old shared-sample identity
incorrectly compared fresh executable paths and host user agents. Raw path/UA remain mandatory
per-run provenance; shared browser authority is exact product/revision/JavaScript/protocol.

Corrected budget/schema/contract/collector/selftest/test `ac2c084a…` / `695d2529…` /
`e7dfea1d…` / `07131f5e…` / `f86db74a…` / `5d00e59f…` establish measurement `2318f57b…`, while
producer `d3223177…` and browser CDP `6da9e2ef…` remain unchanged. The ruler is fail-closed with
empty candidate samples and null ceilings; its measurement-required baseline has a null collector
commit and empty profiles. Materialize exact
`.86` afresh for baseline10 and candidate24/25/26, once each with zero retries. No launch argument,
timeout, workflow, product byte, producer, or retry policy changed; terminal-green PR #32 returns
immediately to Arc 1B.
This does not re-pin Gate A or the global browser authority: `../tools/deps.pinned.json` remains
Edge `150.0.4078.83`. It also does not change the Chrome authority of the other browser gates, any
timing, product bytes, or the one-attempt/zero-retry policy.

`preview:verify` proves package integrity and the safety metadata. It does not assert that a
commit is still the newest development commit. The full 40-character commit and
exact `source.buildInput.tree` plus `contentSha256` in `preview.json` are the authority;
filenames and a mutable “latest” link
are conveniences only. These hashes detect drift under the repository's trusted producer;
they are not a cryptographic signature against a malicious party that rewrites the package,
manifest, and hashes together. Download publication candidates from the named trusted Actions
run and retain that run URL with the playtest report.

## Current CI and publication flow

The production and development channels intentionally publish different products:

- a successful `main` push battery lets the production job package the root v1.8.9 HTML;
- a successful `develop` push battery lets the development job install the exact v2
  workspace, resolve each phase-owned browser selection (Arc-local Edge only for Compendium;
  Chrome for the other browser gates), run preview selftests, build an approved candidate
  from that exact commit, browser-smoke those bytes, and give only that package to the
  development publisher;
- the publisher verifies source branch/SHA/clean state, preview schema v3, full-commit
  archive inputs, v2.0/build identity, origin refusal, `publishable:true`, byte inventory,
  noindex/robots, and packaged `version.json`, then mirrors the package so stale legacy files
  cannot survive;
- the development deploy key can write only
  `Dev-CelestialFrontier/dev-celestialfrontier.github.io`; the production key can write only
  `CelestialFrontier/celestialfrontier.github.io`.

Pull requests, manual agent runs, and red/unfinished push batteries cannot publish. The mapped
post-green job is automatic under Nick's standing proceed authorization; agents monitor it
without asking repeatedly, but stop for any failed check, branch/SHA mismatch, conflict, new
destination/key, `develop` → `main`, release decision, or production action. A published v2.0
site is still only a play surface. Human findings must bind the URL, full commit,
`preview.json` content hash, device/browser lens, starting save, outcome and retest. Resolve the
current branch tip, checks and hosted commit live; this reference does not freeze a “latest” run.

## Historical PR #11 bootstrap and evidence record

The following section records why the isolated package, browser pin and publication boundary
exist. Its one-time bootstrap state is preserved as history and does not override the current
automatic flow above.

### PR #11 evidence state at that time

The browser-provenance defect below remains preserved history. Test-battery #205,
run `31621227550` / job
`94196289291`, completed once without retry at exact pushed
`c57305fbf30af2bc8158ff46af1ec49ec4455d95` and is **RED** after every preceding
gate and `smoke:ci` passed. Desktop-8k completed import, release, changed-loader
navigation, all 12 boot stages and ready; its next exact-context command timed out
at two seconds. No concurrent browser-process heartbeat was recorded, so the run
is strong evidence of post-ready target starvation but cannot retrospectively
prove the browser/CDP transport was healthy. It is preserved without retry.

Prior diagnostic only: the earlier `dirty-diagnostic` targeted/smoke/glass captures
based on `c57305f` remain non-authoritative; their sandbox `EPERM` and corrected
floating-width assertion did not retry a product failure.

Immutable executable source `135a635d066d1c67e3096dc134de9247267898d5`
passed the complete exact sequential battery from clean source-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
and source-snapshot
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.
A sandbox-only Edge SIGABRT interrupted preflight/CDP selftest; the same checks
passed outside sandbox without product retry. Root validate, legacy smoke, rarity,
and dead-code passed. Root layout
`exact-135a635d066d-20260812T192848Z-root-layout` passed 787/787 across 10/10
under Edge 151 in 75,532 ms; report SHA-256
`7e2689c31e1095885ee8139bb395b40e799972461649efd100b631a4e6e9f85f`.
V2 passed 273/1 plus all type/art/override/coverage/spec gates. One-attempt slice smoke passed 0 findings /
10 screenshots /0 retries in 105,379 ms (report
`c838f3e7dfdf161b7bfa6111c6979215a2ba439fdd44a4cb8e00a8cdf7c3d1a5`).
Full certifying glass passed 12/12, 57/57 unique, `blocked=[]`, `omitted=[]`,
zero findings/instrument failures/retries in 52,254 ms (report
`1f14906d178528613fdf52db53ee4e1f84b6a48ceb21ad3a41bd9d0c5348b23b`).
Reloads were 176–185 ms. Exact 8K was 185 ms total /2 ms arm /12 ms
invoked→release /32 ms release→commit /122 ms commit→ready /152.2 ms
`performanceNow`, with target confirmations 1/9 ms and heartbeats 1/1 ms;
outgoing/replacement stores were 2,730×1,536 each, outgoing collapsed to 1×1,
and replacement remained 8,386,560 combined pixels.
Nine automated personas passed, still not human play; their JSON/Markdown SHA-256 are
`c17c44fcb3d534707dc6186bbd4fbcae4d1cfea511bdec8a263ec48be4927a58` /
`43d5d52e44d7d19aec597a3df5b2599c0da143bb7170d16c17ed141bd390d6b4`.
Terminal-only performance was 578/659/76/170 ms.

Exact preview `dev-preview-exact-135a635d066d-20260812T192848Z` browser-smoked
PASS under Edge 151. Its `preview.json` SHA-256 is
`0233984ca2bad28c189e979d4a30082d6137a06e8eac086c3b2525989813dd4e`;
it records 37 files /10,186,230 bytes, content SHA-256
`da4e066b447db073383f59dd592cd2a19a186d32ce13a2edd05fbc07e66aa10f`,
exact `port/v2` tree `d1ab1d79fba4ba2939c3e1ec0661fb60498afb23`, expected origin
`https://dev-celestialfrontier.github.io`, production distinct and
`publishable:false`. It is a prior verified local review artifact, not a publication
candidate and not evidence for the #206 repair.

Test-battery #206, run `31635297321` attempt 1 / job `94243979205`, completed
without retry at exact pushed `558e0565d368a0b81d86d99fd380ebc50d30bc02`;
merge `e160577` is tree-identical. Every preceding step and `smoke:ci` passed, but
desktop-8k reload first passed in 8,749 ms, ready published at `performanceNow`
2,578.6 ms, and its target cycles took 1,905/1,910 ms with 3/1 ms heartbeats.
The later 5,120×2,880 resize target timed out at 2,003 ms against a strict 2,000 ms
bound while `Browser.getVersion` answered in 2 ms; `last:null`. The report retained the sole
`ULTRA_VIEWPORT_RESIZE_UNANSWERABLE` product finding, 0 instrument failures,
56 executed +1 product-blocked =57, `omitted=[]`, and 0 retries. No persona or
preview evidence was produced; preserve #206 red without retry.

Test-battery #207, run `31642880191` attempt 1 / job `94269466117`, completed
without retry at exact pushed `ff9bebb22aaac0e95cd406e1e15737898452911a`;
merge `8dfe018590edf8a5d15291730c873869b96caae2` is tree-identical. Every prior
gate, `smoke:ci`, and 11 glass rows passed. Tablet-portrait alone instrument-failed
when the valid healthy release witness was observed between ordered
`release-started` and `release-complete`. The report retains 0 product findings,
1 instrument failure, 57 planned/listed controls, `blocked=[]`, `omitted=[]`, 0 retries,
and no persona/preview output. Preserve #207 red without retry; it produced no review
candidate.

The prior dirty #207 diagnostic (report
`805b50cb9341dfa49df6136565f050609b65d78387975e3c90c54ca937f4713b`) remains
chronology only. Immutable executable source
`6554b2be652c083bc9ff7ed11c2f928e90b74660` passed the complete sequential exact clean
battery. Root gates and exact layout 787/787 across 10/10 passed (report
`58dc4ef4456fac012b2e8f0aa801917b5579cffe435fd4576827ff29bcbb4b78`); v2 passed 273/1 plus
all gates; one-attempt smoke passed 0 findings/10 screenshots; certifying glass passed
12/12 and 57/57 with exact 6/7/8 tails on every row, empty blocked/omitted ledgers, and
zero findings/instrument failures/retries; all nine automated-only personas and terminal-only
performance passed. Smoke/glass reports are
`139b10ea16d17c109d5b624fa75daf73291d98f5ad8fe7df569501829ab5f844` /
`a05ba65e28ac94b146b051164c1b22195bfaa7509bd47d9631561fc394920b6c`.
Exact preview `dev-preview-exact-6554b2b-20260812T184000Z` was browser-smoked under Edge 151
over loopback, bound to the expected separate development origin, with `publishable:false`.
Its manifest SHA-256 is
`98a64b750d1def5c7895cbd780a35558863f000c5a3fbcf4c3945dd927d5ce04`, covering
37 files /10,186,537 bytes, content
`04bb2c095468a61834992c970a8ac7c364efb37df9ac4397966fd3a4bc43e69d`, exact tree
`986116980e7b7a224f210508b4872b5d7f5621ac`, registry
`8a290b25fc8ff27ca7f23f00367121a78a5e8af0`, lock
`b81617792187b3e76c7f1586ed311d540f1451acadb85c369ffcd2c4571229cb`, and separate
development/production origins. This clean artifact is still not publication authority and its
immutable source remains prior #207 executable evidence. Live Git/PR state determines the current
tip, upstream, and checks; its selected pushed tip requires
matching CI before any separately approved candidate command. No host/publication/human/Ready/
merge/release/deploy/version authority follows.

Test-battery #208, run `31649176954` attempt 1 / job `94289516851`, completed
without retry at exact pushed head `ee8bc281c424b5a8f998dc7327372e5f5a18067d`;
merge `8fc6b4fc` is tree-identical and branch-flow run `31649175614` / job
`94289512873` passed. Steps 1–15 and `smoke:ci` passed, but desktop-8k alone
reported `REPLACEMENT_UNANSWERABLE_AFTER_READY`: ready scheduling at browser
performance 584.3 ms was followed by emission at 3,143.8 ms, a 2,559.5 ms gap,
then exact target cycle 1 timed out at 2,003 ms while the concurrent heartbeat
answered in 1 ms. The complete 12-row glass report retained 1 product finding,
0 instrument failures, 57 planned controls with the runtime same-backing control
product-blocked, `omitted=[]`, and 0 retries. Preserve #208 red without retry. It
produced no persona or preview artifact and grants no playtest/candidate authority.

The current fixed repair preserves native UHD and makes exact desktop-8k DPR 0.25
and 5K DPR 0.375 use two 1,920×1,080 stores /4,147,200 pixels combined. The
`d8684c415a729222dd1a290e166a2a71ea79f72f2457d2ad144f434a82c30a8b`
dirty-worktree PASS is prior diagnostic chronology only. Immutable clean executable source
`307b8aaf90f31ef5cac585f3ab32c7e2c0d127af` passed root layout 787/787 across
10/10, v2 273/1 plus all gates, one-attempt smoke 0/10, and glass 12/12 unique rows /
57/57 controls with exact 6/7/8 tails, empty blocked/omitted ledgers and zero findings,
instrument failures, or retries. Glass/smoke/root-layout hashes are
`42d8637977cdca41659761626ea4edcee752ff57e0c9b76001ca6537d31d6e8f` /
`90af5806271ef30860da9b15bf96c1f76fd656289d1945e073f8290216278723` /
`c42a50873ad01a91dd439860f41f1d695a7d2bf5c41521ed8b7eb768b7ee4975`.
Exact 8K was 171 ms / browser performance 161.9 ms, commands 1/1/1/3/0 ms,
33/129 ms release→commit/commit→ready, and two 1,920×1,080 stores /4,147,200
pixels; terminal-only performance was 606/685/74/171 ms. Exact preview
`dev-preview-exact-307b8aaf90f3-20260813T000806Z-59950` was verified and browser-
smoked under Edge 151 over loopback, bound to expected separate origin
`https://dev-celestialfrontier.github.io`, with `publishable:false`: manifest
`1a4f62bd5f351f62ed69c5d4670de43408ee41466e14dc0632ead3e5a95c148d`,
content `5db7790977071235ed164fb8f382bd67421c9fd5e834a504cdb4e1a1e8f47589`,
tree `5b8e1f649b1259f96f5de6d7e8aca0377bc2cf10`, 37 files /10,186,644 bytes.
This remains local evidence, not host/publication/human/Ready/merge/release/deploy/version
authority. Live Git/PR determines current tip/upstream/checks; the selected final pushed
tip requires matching CI, explicit candidate approval, and human play. The configured branch
site does not itself approve a v2 publication candidate.

Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
remains prior exact #206 executable evidence (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
snapshot `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`).
Its exact sequential battery passed root validate/smoke and layout 787/787, v2 273/1
plus all gates, one-attempt slice smoke 0 findings/10 screenshots, certifying glass
12/12 and 57/57 with empty blocked/omitted ledgers and zero findings/instrument
failures/retries, nine automated-only personas, and terminal-only performance.
Root layout report was `d0d9a9b3c58f996e5fb7b10f21aa98c974272531f10ccdb945cd026942429252`;
slice smoke report/log were `b835f79764f4e22a2179ab74f9412491ee4d81730e775889372461d64ddd0474` /
`538f4a36919cd947e7631f4eb786acbcd3a6e356ce55719843c8080004295087`;
glass report was `7fe33219e70361140ebc931f0d77fca0976a46fe51eecc42815f41eba110980c`.
Exact 8K was 203 ms / `performanceNow` 158.2 ms, targets 1/10 ms and heartbeats
0/0 ms; persona JSON/Markdown reports were
`c10c9e33542ed57b4c51683c0ddf3f1bbc468696a025e88ef2d1e500209581bc` /
`1c9961515028a716ba064ca32ea9dd3ef2d41118cfde4c76b24c16520daa2d14`.
Exact preview `dev-preview-exact-df1c28b-20260812T211642Z` was browser-smoked under
Edge 151 over loopback, bound to the expected separate dev origin, with `publishable:false`:
manifest
`758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`, 37 files /
10,186,537 bytes, content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`,
tree `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. That artifact remains prior #206
evidence; clean `6554b2b` also remains prior evidence, while clean `307b8aaf` is the
current local #208 executable and preview evidence. After matching
green CI, Nick may explicitly approve the one-time PR #11 candidate command below. No host/publication/human/Ready/merge/
release/deployment/version authority follows.

Pushed head `8b8a740286a56591cac9dc5734a2fba4c088939b` passed its exact local
battery. Matching test-battery #200, run `31577395120` / job `94052496287`,
passed every root/product/v2 gate, one-attempt slice smoke, the complete
12-viewport glass matrix including 8K, matching automated-persona synthesis, and
the commit-bound preview package/verification. Only the final preview browser
check failed. Its preceding workflow step had pinned `/usr/bin/google-chrome`
inside that step only; the new preview step started without the pin and the
resolver selected Linux Edge at `/opt/microsoft/msedge/microsoft-edge`. Edge did
not create `DevToolsActivePort`, so the check stopped before creating a browser
target or evaluating any packaged page. The trailing D-Bus message is runner/
Edge startup evidence, not a game, package, origin-guard, banner, or 320×568
layout finding.
Because the artifact upload is success-gated, that verified package was not retained as
`v2-development-preview`; it is not a playtest candidate.

The repair moves the exact Chrome pin to job scope in both the ordinary and
manual preview workflows and performs an early fail-closed resolution. It must
be frozen in a new head and pass the sequential exact-head local battery plus
matching GitHub CI; #200 remains red evidence and must not be rerun, retried, or
made green by lengthening startup or clearing D-Bus. This infrastructure repair
does not authorize publication. The separate-origin hosting choice and genuine
human playtest remain required before PR #11 may leave draft or merge.

The ordinary battery (parallel-job structure since 2026-08-14) emits these artifacts
(per-job report/log evidence is still uploaded when that job is red):

- `root-reports` + `root-layout-evidence`: the root fingerprint/current report and the
  atomic uilayout evidence, from the `root-gates` job;
- `v2-smoke-evidence` / `v2-glass-evidence`: `slice-smoke-report.json` + log and
  `glassmatrix-report.json` (now including per-viewport `viewportTimings`), uploaded by
  their own jobs so red runs retain evidence;
- `v2-compendium-memory-evidence`: the exact-run `compendiummem-report.json` and every
  same-run phone/desktop list, detail, and focus-pinned review artifact produced. A terminal
  product PASS/FAIL must bind the complete six-image packet; an earlier instrument failure may
  diagnose why none exists. A success remains RUNNING/lifecycle-pending until owned browser/server
  cleanup and workspace-lock release complete; only then may its sample and terminal report
  publish, and named verification requires that lifecycle. The independent job runs the browser-
  free instrument selftest before one ordinary active-budget certification, then always verifies the named run id and uploads
  current evidence even when the gate is red. The local report/PNGs are Git-ignored,
  overwritten current-run evidence—not a committed PASS; certification exists only when the
  exact-current report verifies. They do not supply the still-open [HUMAN] six-image visual
  judgment. Arc 1B is not claimed;
- `battery-reports`: the joined smoke/glass/persona bundle assembled by the final
  `v2-persona-preview` job;
- `v2-browser-evidence`: the real-browser screenshots;
- `v2-development-preview`: a loopback-playable, commit-bound review artifact, produced
  by the final job only when **all** battery jobs are green; `publishable:false` prevents
  remote execution.

The separate `development-preview-package` workflow is manual (`workflow_dispatch`). GitHub
exposes a manually dispatched workflow only after that workflow file exists on the repository's
default branch. Therefore a PR that introduces this workflow cannot use it as its own pre-merge
gate. For draft PR #11, the equivalent approved candidate is built locally from the exact clean,
already-pushed PR head *after* its sequential local battery passes:

```sh
npm run preview:package -- --origin=https://<approved-separate-host> --approved-publication-candidate --output=apps/game/smoke/dev-preview-pr11-candidate
npm run preview:verify -- --verify=apps/game/smoke/dev-preview-pr11-candidate
npm run preview:smoke -- --root=apps/game/smoke/dev-preview-pr11-candidate
```

Nick must explicitly approve that candidate command and the destination origin. It still only
creates files; it does not publish or deploy them. Retain its `preview.json` and verification
output with the human-playtest record. After this workflow reaches `develop`, subsequent branch
candidates should use the reviewed manual workflow instead of recreating that local bootstrap.

When available on the default branch, the manual workflow:

1. accepts only `develop` or the four approved agent branches;
2. requires the operator's public-artifact acknowledgement;
3. uses the `development-preview-package` GitHub Environment, where required reviewers
   should be configured before the first candidate run (the environment name alone does
   not create reviewer protection);
4. reruns deterministic, type, art, browser, and preview-producer controls;
5. provisions exact Edge 151 with same-package `--reinstall` only for the Compendium browser
   preflight, memory selftest,
   one-attempt/no-retry active-budget run, and exact-run verification; the preflight binds exact
   product/revision/JS/protocol/executable and a fresh target's Runtime/Page/HeapProfiler plus
   evaluate/event outcome under 45/15/5/2-second bounds, with no retry or authority-input change;
   its selftest owns the fail-closed ordered workflow-package control; retains the current report
   plus every same-run review artifact even on failure; then keeps Chrome for the later browser
   gates. The reinstall is preserved runner-image history; current authority instead requires the
   lifecycle-calibrated exact head and its one corresponding CI;
6. passes the explicit `--approved-publication-candidate` producer flag and uploads
   evidence plus that candidate for 14 days;
7. has only `contents: read` permission—no Pages token, deployment token, repository write,
   or production capability.

The automated-persona synthesis joins only passing slice-smoke and 12-viewport glass reports
from the same commit/branch (and, for dirty diagnostics, the same working-tree digest). It is
prominently labeled **AUTOMATED — NOT A HUMAN PLAYTEST**. It cannot answer comprehension,
fun, visual quality, assistive-technology behavior, physical-device battery/heat, or comfort;
use `port/playtests/PLAYTEST_TEMPLATE.md` with real people for those verdicts.

For draft PR #11, the human record is a merge prerequisite rather than optional polish.
Keep the PR draft until testers exercise the exact commit-bound preview across the planned
player/device lenses, every finding is resolved or explicitly dispositioned, affected checks
are rerun, and the retest is recorded. A green automated persona report cannot satisfy this
condition.

Artifact creation is not publication. After the separate preview owner/hostname exists,
publication should be a distinct, manually approved workflow in that host repository:

1. choose a **pushed commit** whose PR checks are green;
2. either dispatch `development-preview-package` on that exact ref and approve its environment,
   or, only for the PR that first introduces the workflow, use the explicitly approved local
   bootstrap above;
3. download and extract `manual-development-preview`, or retain the exact locally built candidate;
4. run `preview:verify` against the extracted root;
5. compare `expectedOrigin`, full commit, and `contentSha256` with the playtest request;
6. let the dedicated host workflow replace its preview contents and record that manifest;
7. open the HTTPS URL and confirm the Guide shows v2.0 plus the manifest's full commit and
   that no floating DEV badge is present;
8. create the playtest record from `port/playtests/PLAYTEST_TEMPLATE.md`.

No source agent directly edits the production site repository or a preview-host worktree.
No preview action merges a PR, changes `develop`/`main`, bumps `GAME_VERSION`, appends a
production release, or deploys the live game.

`overridecontrol` is a deliberately source-mutating negative-control gate. It and every
Vite/browser/evidence producer must be mutually exclusive in a shared worktree through
`port/v2/tools/workspacelock.mjs`; do not launch them in parallel. Evidence wrappers do not
retry a red child. `smokereport` owns one full-lifetime lock and gives `slicesmoke` a
validated one-child inherited lease, retaining ownership through the exact run, screenshot
hashing and report finalization; the child does not acquire an unrelated second lock.

## Freshness and retirement

A preview is current only for the commit and content hash in its own manifest. When a later
preview is approved, keep the earlier manifest with any playtest report; do not rewrite an
old report to point at new bytes. Remove or clearly retire stale hosted builds so a tester
cannot unknowingly report against the wrong commit.

Every human finding must name the preview URL, full commit, content hash, device/browser,
and starting save state. A finding without those bindings is useful conversation, but it is
not reproducible release evidence.
