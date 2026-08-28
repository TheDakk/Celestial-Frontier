# Development Preview — Separate-Origin Human Playtesting

**Status:** process reference, matches preview packaging and the Actions-budget publication guard
as of 2026-08-28. This is not a release record.

**Current campaign boundary (2026-08-28):** the playable implementation extends through the local
Arc 4.5 Survey → Gather → Build → Tame → ship improvement → farther reach → Return slice, but it is
still a review candidate rather than a preview candidate. Signed clean Final10 source
`4405fb2b4ba7ef6898eb334330d7ef4300b5266c` passed Layout 787/787, source-bound SceneMemory 42/42,
source-bound Compendium 78/78 with six PNG bindings, Slice with zero findings/scopes and ten PNGs,
and full 12-viewport Glass with zero findings or instrument failures. Every green stage ran once and
passed named verification.

Recovery then ran once with zero retry. Fixture, the complete 16-attempt burn-down, exhausted
disabled-suppression, close/checkpoint and closed/offline proof passed before `offline-reopened`
stopped terminal `instrument-fail`. The reopened document truthfully used the read-only/ineligible
`unavailable` vocabulary while the old phase-blind oracle required active-authority
`empty`/`depleted`. Active observation, boundary crossing and recovered-state judgment did not run;
Final10 therefore makes no offline durable-parity, Recovery product or recovery claim. Final8 and
Final9 remain immutable historical exact-source evidence for their own recorded stages.

The local phase-specific status-oracle repair requires schema-bound full Pertar receipts at the
original active-exhausted, offline-reopened and reactivated active-exhausted phases. Terminal
finalization and named verification independently replay and cross-bind their phase, document,
cycle, facts, SessionRNG, state/UI and first-active-sample evidence; missing, swapped, coherently
retokened, reversed-chronology or coherently recomputed route/card/runtime/pending receipts are red.
Before observation, `active-observation:running` is persisted and must survive any later failure.
Each Pertar wait receipts the strict remaining share of one absolute 20-second deadline; clipping or
exceeding it is red. The exhausted raw/live-state chain and reactivated→first-service binding require
at most 20 seconds, the same cycle/RNG and revision delta at most one. Internally assessment-green
retiming, +2-revision and next-cycle mutants remain terminal-red.
Its exact six-region SHA-256/UTF-8-byte inventory is: full collector
source `c1b4798eb21bad961d1dd984b515ca1cc884101ce28405c09613c1e361118f84` (217,578 B); production
boundary `a96138cc33ace145c77e64de584f4062d0860d4e418c8d3c19d06a1293db56be` (91,758 B); dedicated
helper→assessment→wait span `f568a7bb95a49d7dfb9839d2d11cc68743f87cf3af6eb52776f5551dba0e6045`
(10,442 B); phase assessment `c5a76e70c096a33df9bc12ba9a044c7d7bfddc1dc082d61e8365f5d7c99b35f5`
(6,184 B); offline-reopened→reactivated phase span
`b661d676f1679e9fc92590bf7849ee319ea0b8c78f444a91f46b06eccff29b6e` (7,125 B); and disabled-
suppression preparation/collector
`22e8704122103323d0dd0079ce0d2821d69f249a860f31e4062f51b9f8e68771` (13,190 B). The production
seal rejects dead-wrapping/comment-shadowing the sole operative span; the full seal rejects late
helper rebinding, while swapped calls/predicates, missing reactivation and dead copies stay red.
Browser-free current-byte checks at locally signed implementation/evidence commit
`3fbfcd5eba3d39e46a3e3e954e6eb5134a5f698e` (verified embedded SSH signature; parent Final10
`4405fb2…`) are 138 Vitest files / 1,494 passed / one skip, typecheck, `artunused`, focused Recovery
5/5, Recovery selftest, root validate at 1,010 renders / 50 probes and independent review CLEAR.
This documentation changes source identity; its signed clean docs-only descendant is the fresh
campaign source. No successor browser certificate exists. That descendant must restart
Layout → SceneMemory → Compendium → Slice → Glass → recovery with fresh IDs. Nothing in this
campaign has been packaged, published, pushed, hosted-tested, merged, versioned or released. Until
one clean exact final head passes every required local gate and receives separate exact-SHA
publication authority, no development-preview candidate exists. `--allow-dirty` remains local
diagnosis only and can never become a promotion artifact. Edge `151.0.4129.107` / CDP `1.3` is
Final10 provenance only; a compatible point update never triggers rebaselining or threshold changes.

## Separate-origin requirement; approved branch site

Celestial Frontier should have a continuously usable **development preview**, but it must
not be published as a path under `https://celestialfrontier.github.io/`.

The approved development owner is `Dev-CelestialFrontier`, with organization-site repository
`dev-celestialfrontier.github.io` at `https://dev-celestialfrontier.github.io/`. Automatic
post-battery publication is currently parked by `GITHUB_ACTIONS_BUDGET.md`; no push or green check
publishes anything. A future reviewed promotion must bind one exact tested SHA and branch, use the
target-specific deploy key, browser-smoke the exact `port/v2` v2.0 candidate, write noindex/robots
guards, and remain unable to target production. Visible identity—**Celestial Frontier v2.0
development** plus the full commit—lives inside the Guide only; there is no corner badge. This
public DEV surface is a playtest convenience, not human-play, Ready, merge, release, or production
authority.

**Standing execution authority (Nick, 2026-08-13), budget-limited 2026-08-20:** the normal green-PR
merge authority is not Actions-spend or publication authority. While the budget mode is `FROZEN`,
Codex and Claude Code do not push, merge, dispatch, or publish. After Nick explicitly lifts `FROZEN`, each
hosted attempt and exact-SHA promotion still needs the authorization recorded by the budget protocol.
No authority includes manual site writes, a new host/key, `develop` → `main`, a release, or a
production deployment.

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
- emits `publishable:false` by default, and its runtime refuses every remote origin. The current
  publisher is manual-only and hard parked. A future separately reviewed exact-SHA promotion may
  pass `--approved-publication-candidate`; the flag alone grants no destination write authority;
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
The preview contract therefore requires effective exact `/usr/bin/google-chrome` on the step that
owns `preview:smoke`: one exact step mapping may override a different job browser, or one exact job
mapping may supply Chrome when the step has none. Missing, wrong, duplicate, previous-step-only, and
inline-command overrides reject. The serialized test job may own Edge while its preview step owns
Chrome; the manual workflow may own Chrome at job scope and override only its Edge steps. Do not
depend on fallback ordering when a runner has several Chromium-family browsers installed.

Exact committed `9d5247f0d6e7c36015d465cef0961a460d1a27d3` includes the effective-owner
checker repair and passed the complete local battery: root/v2 static, layout 787/787, exact-Edge
preflight plus active Compendium 78/78/six PNGs, Chrome controls including full preview selftest,
Smoke, Glass 12/12 and 58/58, nine personas, and exact-commit nonpublishable preview package,
verification, and smoke. Its 99-entry manifest is
`apps/game/smoke/final-battery-sha256-9d5247f.txt`, SHA-256
`adcc16cf83d526c2fcacbcf7675051c907e1957c1572cdf5caa2e4e8a5b4558c`. One invalid
self-including manifest remains a generation-failed tooling diagnostic, not evidence. Descendant
docs-only changes do not alter code/tool/workflow/product authority; hosted and HUMAN proof remain
separate.

Arc 1A is the deliberate narrow exception. The current 1,500-row Compendium is virtualized;
list art uses leased, cancellable, deduplicated 132px thumbnails, detail uses a separately
owned 440px image, and Planetside uses the same lease path. Its standalone `compendiummem` gate
retains the Arc-local four-field browser authority
`arc1a-compendium-memory-only`: product `Edg/151.0.4129.101`, revision
`@cc1d9f4080fd9140611a9600b8d1615db310105d`, JavaScript version `15.1.23.9`, and CDP protocol
version `1.3`. PR #34 runs `32665404776` and `32677088518` are retained terminal-red interaction
evidence, not memory verdicts. The second run proves the first activation succeeded, then a
Close/reopen row point moved across the deferred ResizeObserver/render boundary; its passive wait
ended after 112 observations on a clipped 51 ms command with a timely heartbeat. Exact report
raw/gzip hashes are `544015e9…` / `cc5ed778…`. Collector `6d681d19…` now uses native-scroll
repositioning and requires the same owned point before/after a double-render plus thumbnail-settle
boundary before its one press/release and immediate receipt. Measurement is `6a961df8…`; former
budget `208af955…` and its evidence are historical. Clean repair `a95889d…` produced three 78/78
candidates and the paired legacy baseline; activation `d21ba26…` selects active budget `faa160b3…`
with unchanged numeric ceilings and the retained 14-phone/13-desktop breach inventory. Exact-budget
run `20260823-pr34-render-stable-row-certification` passed 78/78 plus named verification on clean
`d21ba26…` (raw/gzip `42753d5e…` / `a2ff5b00…`). The repaired exact head then passed hosted
no-retry run `32681394532` and merged normally in PR #34 as `7a9f4c1…`. This remains integration
evidence only, not release authority.
Executable path and user agent remain recorded provenance, not cross-host match fields.

Ubuntu provisions `/usr/bin/microsoft-edge-stable` only for the ordinary Compendium job and
the manual Compendium selftest/run/verify steps. The package is the exact Microsoft
`microsoft-edge-stable_151.0.4129.101-1_amd64.deb` from
`https://packages.microsoft.com/repos/edge/pool/main/m/microsoft-edge-stable/microsoft-edge-stable_151.0.4129.101-1_amd64.deb`,
with SHA-256 `bd7604025424914a61c06293cb6bf269141a29d8c54cf1997110bc96d3365d60`;
both workflows check those bytes, request
`sudo apt-get install --reinstall --yes "$edge_package"`, then verify the installed package version
and executable before use. The preflight selftest statically requires that unique owned install
step's exact ordered URL/SHA/download/hash/reinstall/version/executable chain followed by preflight,
and negative-controls removal from either workflow plus outside-step decoys. This reinstall is a
preserved hosted-runner normalization transition.

Historical `.86` normalization history: activation head `96464d5…` passed its complete
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

Clean exact `fb321f2…` candidate24/25/26 plus paired baseline10 ran once each with zero retries and
distinct fresh `.86` paths. Their historical budget/schema/contract/collector/selftest/test `70145575…` /
`695d2529…` / `e7dfea1d…` / `07131f5e…` / `f86db74a…` / `0fa2e89d…` bind measurement
`2318f57b…`, unchanged producer `d3223177…`, 3/3 samples per profile, measured 1/1 baseline, and
strict ceilings with 14 phone / 13 desktop breaches. Focused activation is 13/13 after matching
synthetic desktop identities fixed its initial phone-only control without changing browser evidence.
Exact head `731b2e2…` passed the full local battery. Hosted run `32420327368` was then consumed at
the 40-minute Compendium job ceiling with lifecycle-pending evidence and no product verdict; it is
not rerun authority. At that historical checkpoint PR #32 remained blocked under the then-frozen
efficiency gate; changed-head run `32462323775` later passed and PR #32 merged at `d4ab7e6…`. No launch argument,
product byte, producer, browser-CDP, or retry policy changed.
Exact `aecf386…` later bounds static-server close at one immutable monotonic 2,000 ms; exact/late/
missing/error callbacks force one connection close and reject, while cleanup red suppresses PASS/
sample. Clean `6736ef4…` c27/baseline11/c28/c29 evidence ran serially once each with zero retries
under fresh exact `.86`; candidates completed 78/78 with complete lifecycle, baseline11 retained
four faults and 14 phone / 13 desktop breaches. Activation `b3957e1…` makes budget/test
`546d3a81…` / `ef06252a…` active under collector/selftest/measurement `0c7ec3ba…` / `0bbb3541…` /
`23aacc2c…` and unchanged producer `d3223177…`; prior ceilings remain strict. The manual preview
workflow still cannot certify the ruler, and publication remains separately authorized.
This historical Compendium activation did not redefine root Gate A. Root preflight now owns a
version-tolerant Chromium-family + CDP `1.3` + source-derived capability/provenance authority; exact
point version is run evidence only and a compatible update triggers no rebaseline. The exact
Compendium package remains isolated workflow provisioning, not global browser identity. No timing,
product bytes, numeric budget, or one-attempt/zero-retry policy changed.

## Arc 1 scene-memory boundary (2026-08-23)

Arc 1B's standalone scene-memory-v1 gate remains the exact historical authority for the existing
rendered scenes before Shipyard. Product/ruler `79c605f9c7ab8b63ad082d852c38d66ad6bb11af`
and activation `e244c9e2342c6abd79ca4efcd3d26eb46d3d8910` produced one local no-retry 40/40
certificate under Edge `.93`, complete lifecycle/cleanup and named verification. Its
`shipyardStatus: future-arc-1c` field was truthful at that source; it is not proof of Arc 1C.

Arc 1C product/ruler source `a4de5007ffc9131b8bc952a0a4cb469d9139039e` implements a responsive
read-only Shipyard with one code-native SVG/DOM preview owner, zero second renderer/RenderTexture,
and a named HD-surface texture attachment. Source
`59530da3bf40965adf9c54f169b310e11ccdd0f8`, `budgets/scene-memory-v2.json` SHA-256
`3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`, and local run
`20260822-arc1-local-certification` are retained only as historical Mac-derived 250 ms evidence.
Hosted attempt 4, run `32618995487`, was exact terminal-red 40/42: only phone and desktop
answerability exceeded that old ruler on Linux, at 618–647 ms and 493–507 ms respectively. Every
liveness, memory, ownership, target-health, ticker, route, and cleanup outcome was green; the run is
not hosted-green evidence.

Active cross-host SLA repair source `7d8dc380cd89ef53aac5a11c3850316e19e1aae9` binds
`budgets/scene-memory-v2.json` SHA-256
`5c8a6e7568e02d4e31501e4188dba57d3ac6e6ad183882b98ff9c68170771501` to the existing fixed,
strict `<1000 ms` product answerability contract. Local no-retry run
`20260823-pr33-cross-host-sla-certification` passed 42/42 under Edge `151.0.4129.101`, complete
browser/server/workspace-lock cleanup, zero findings/fatal events and a passing exact named-run
verifier. Report raw/gzip SHA-256 are
`d16d40cd4d07f96683490eab920072fb9f3b42e0d0ee54434ffd4d312223f960` /
`7c4100244abef8d50f93178aab7c8579ae93fa0b6bef76422cc5c0523edac55a`. Product, collector, and
verdict-contract bytes are unchanged.

The current gate uses one browser process for 390×844 phone and 1280×800 desktop profiles, four
unmeasured warmups and four measured cycles through Universe, Galaxy/fine, Sol/System,
Earth/Surface, the 1,500-row Compendium, the real Shipyard, and settled Universe. Forty-two outcomes
include the visible Shipyard opener, exact canonical visual/DOM state, one open preview, owned Close,
and zero retained/pending preview work after Close. The exact veteran input is intentionally Arc 3
protected: the independent current-ship preview remains inspectable while authority-dependent
Engineering details/actions are unavailable. SceneMemory certifies that Arc 1C resource lifecycle;
it does not certify or require loaded Mine, Skim, Research or Fabricator authority.

The guarded ordinary `test-battery` runs version-tolerant Edge-family/CDP SceneMemory first, then
the independently sealed exact-package Compendium ruler before the Chrome smoke/Glass/persona/
preview steps. SceneMemory records the full executable/version/revision/JavaScript/user-agent/CDP
tuple as provenance but does not use the point version as a rebaseline key. It runs the browser-
free instrument controls, performs one no-retry active-budget certification, always verifies the
named terminal report, and uploads whatever that attempt produced as `v2-scene-memory-evidence`.
This is part of the single fail-fast
owner-label-authorized battery, not a new parallel job or automatic retry. Hosted attempt 4 is
consumed and terminal-red. A later authorized PR #33 battery, `32646110946`, passed terminal-green
and merged `8998ffb77ca5b1f3123d7ea776c41db6e23bd24e`; its label was removed. No new hosted attempt
is authorized. Local 42/42 evidence still does not authorize publication, release, or deployment.

The separate manual `development-preview-package` workflow still owns preview packaging and its
current exact `.101` Compendium/Chrome sequence; it does not run or certify the Arc 1
scene-memory-v2 ruler. A future preview artifact may include the current product bytes only after
its own exact-source workflow authorization, but package verification remains distinct from scene-memory,
hosted-battery, HUMAN, merge, and release authority.

`preview:verify` proves package integrity and the safety metadata. It does not assert that a
commit is still the newest development commit. The full 40-character commit and
exact `source.buildInput.tree` plus `contentSha256` in `preview.json` are the authority;
filenames and a mutable “latest” link
are conveniences only. These hashes detect drift under the repository's trusted producer;
they are not a cryptographic signature against a malicious party that rewrites the package,
manifest, and hashes together. Download publication candidates from the named trusted Actions
run and retain that run URL with the playtest report.

## Current guarded package and publication flow

Ordinary pushes, PR updates, and batteries do not publish. The development-preview workflow is
owner-only, manual, false-default, and artifact-only. `publish-branch-sites.yml` is manual-only and
both jobs are hard parked. A future separately reviewed promotion must bind one exact tested SHA,
re-prove source/package/origin/manifest integrity, and use only the isolated target credential;
standing proceed authority is not publication or Actions-spend authority.

A published v2.0 site is still only a play surface. Human findings must bind the URL, full commit,
`preview.json` content hash, device/browser lens, starting save, outcome and retest. Resolve the
current branch tip, checks and hosted commit live; this reference does not freeze a “latest” run.

## Historical PR #11 bootstrap and evidence record

The following section records why the isolated package, browser pin and publication boundary
exist. Its one-time bootstrap state is preserved as history and does not override the current
guarded flow above.

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

The ordinary guarded battery's single serialized, fail-fast product job emits these artifacts.
Report/log evidence is still uploaded when its owning step is red:

- `root-reports` + `root-layout-evidence`: the root fingerprint/current report and the
  atomic uilayout evidence, retained by the serial battery job's always-run upload steps;
- `v2-compendium-memory-evidence`: the exact-run `compendiummem-report.json` and every
  same-run phone/desktop list, detail, and focus-pinned review artifact produced. A terminal
  product PASS/FAIL must bind the complete six-image packet; an earlier instrument failure may
  diagnose why none exists. A success remains RUNNING/lifecycle-pending until owned browser/server
  cleanup and workspace-lock release complete; only then may its sample and terminal report
  publish, and named verification requires that lifecycle. The owning serial steps run the browser-
  free instrument selftest before one ordinary active-budget certification, then verify the named run id and upload
  current evidence even when the gate is red. The local report/PNGs are Git-ignored,
  overwritten current-run evidence—not a committed PASS; certification exists only when the
  exact-current report verifies. They do not supply the still-open [HUMAN] six-image visual
  judgment. That artifact alone does not claim Arc 1B;
- `v2-scene-memory-evidence`: the Arc 1 scene-memory-v2 `scenemem-report.json` from the same one
  authorized, serial test-battery attempt. The gate owns four warmups plus four measured cycles,
  42 outcomes including the real Shipyard lifecycle, complete cleanup, and exact named-run
  verification under Edge `.101` and the fixed strict `<1000 ms` product answerability SLA; the
  artifact is retained even when red. Hosted attempt 4, run `32618995487`, is exactly such a retained
  terminal-red 40/42 artifact and must never be described as hosted green. Missing, incomplete,
  nonterminal, wrong-browser, unverified, bypassed-opener/Close, duplicate-preview, or retained-work
  evidence remains red. It supplies no HUMAN or preview-publication authority;
- `battery-reports`: the smoke/glass/persona bundle assembled after those earlier serial steps;
- `v2-browser-evidence`: the real-browser screenshots;
- `v2-development-preview`: a loopback-playable, commit-bound review artifact, produced
  only when **all** preceding battery steps are green; `publishable:false` prevents
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

1. defaults to `DO_NOT_RUN`; a tiny authorization/source job requires Nick's exact one-workflow
   budget token, and the sealed package job depends on it without adding a forbidden job-level `if`;
2. accepts only `develop` or the four approved agent branches and requires the operator's
   public-artifact acknowledgement;
3. uses the `development-preview-package` GitHub Environment, where required reviewers
   should be configured before the first candidate run (the environment name alone does
   not create reviewer protection);
4. reruns deterministic, type, art, browser, and preview-producer controls;
5. provisions exact Edge `151.0.4129.101` with same-package `--reinstall` only for the Compendium browser
   preflight, memory selftest,
   one-attempt/no-retry active-budget run, and exact-run verification; the preflight binds exact
   product/revision/JS/protocol/executable and a fresh target's Runtime/Page/HeapProfiler plus
   evaluate/event outcome under 45/15/5/2-second bounds, with no retry or authority-input change;
   its selftest owns the fail-closed ordered workflow-package control; retains the current report
   plus every same-run review artifact even on failure; then keeps Chrome for the later browser
   gates. The reinstall is preserved runner-image history; current authority instead requires the
   lifecycle-calibrated exact head; exact `731b2e2…` passed locally, while hosted run
   `32420327368` was consumed at the 40-minute lifecycle-pending ceiling and cannot be retried;
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

Artifact creation is not publication. While the Actions mode is `FROZEN`, stop after local package
verification and do not dispatch or publish. After capacity returns, publication remains a distinct,
exact-SHA, manually approved workflow in that host repository:

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
