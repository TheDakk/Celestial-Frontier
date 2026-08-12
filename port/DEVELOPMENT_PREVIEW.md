# Development Preview — Separate-Origin Human Playtesting

**Status:** process reference, matches preview packaging and CI as of 2026-08-12.
This is not a release record and does not authorize deployment.

## Separate-origin requirement; host choice pending

Celestial Frontier should have a continuously usable **development preview**, but it must
not be published as a path under `https://celestialfrontier.github.io/`.

No preview owner, repository, hostname, or deployment has been created or approved yet.
Choosing between the two valid options below is still a human hosting decision; the current
source batch only prepares fail-closed packaging and evidence.

GitHub Pages provides at most one user/organization site per account. Its default URL is
`https://<owner>.github.io/`; additional project sites use
`https://<owner>.github.io/<repository>/`. See GitHub's current
[Pages site types](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#types-of-github-pages-sites).
Consequently, a repository such as `CelestialFrontier/dev-celestialfrontier.github.io`
would normally publish under a **path on the production host**, not at a new host. A path
does not change the web origin, so it would share IndexedDB and localStorage with the live
game.

Use one of these genuinely separate origins:

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
- injects a compact visible `DEV · <short-commit>` banner on every built HTML entry (the
  full commit and source state remain available in its accessible label/title);
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
- emits `publishable:false` by default, and its runtime refuses every remote origin. The
  default-branch manual approval workflow normally passes
  `--approved-publication-candidate`; after matching green CI, Nick may explicitly approve
  PR #11's one-time local bootstrap from its clean pushed head. The flag binds
  `publishable:true`, but neither path deploys anything;
- writes only to the ignored `port/v2/apps/game/smoke/dev-preview-*` evidence root and
  never touches the production site repository.

The visible banner is part of the safety boundary. If it is absent, stop testing and report
the URL; do not assume the page is the development build.

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
compact DEV banner to be live; the banner must be pointer-transparent and clear of the dock.
Both CI packaging workflows run this outcome check before uploading the artifact.

Browser provenance is owned by each process. A `CF_BROWSER` value attached to one GitHub
Actions step does not carry into the next step merely because both belong to the same job.
Both preview-producing jobs therefore pin the exact CI browser at job scope and resolve it
fail-closed before the long battery; every later smoke, matrix, and preview process inherits
the same selection. Do not depend on fallback ordering when a runner has several Chromium-
family browsers installed.

`preview:verify` proves package integrity and the safety metadata. It does not assert that a
commit is still the newest development commit. The full 40-character commit and
exact `source.buildInput.tree` plus `contentSha256` in `preview.json` are the authority;
filenames and a mutable “latest” link
are conveniences only. These hashes detect drift under the repository's trusted producer;
they are not a cryptographic signature against a malicious party that rewrites the package,
manifest, and hashes together. Download publication candidates from the named trusted Actions
run and retain that run URL with the playtest report.

## CI and publication flow

### Current PR #11 evidence state

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

Immutable clean executable source `df1c28b31d15cd554d36f9b4ca65d8765366a5df`
underlies the current/forthcoming documentation-only tip (clean status `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;
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
Exact preview `dev-preview-exact-df1c28b-20260812T211642Z` passed Edge 151 at the
separate dev origin with `publishable:false`: manifest
`758a67e0fedda16392c5f1e0230c57dd0bc32c38aaab612abb816484afcaad02`, 37 files /
10,186,537 bytes, content `98f1a6dcfb98be7e64269ed53323539ba185035571078eff2289accf43f9e2c0`,
tree `435c363e3e049f353e74ce71ed2a5fb4e3514c69`. Exact docs tip/upstream/CI is live;
its final pushed tip needs matching CI. After green CI, Nick may explicitly approve
the one-time PR #11 candidate command below. No host/publication/human/Ready/merge/
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

On green v2 browser and glass-matrix gates, the ordinary PR battery emits three distinct
artifacts (available report/log evidence is still uploaded when a gate is red):

- `battery-reports`: root reports, `slice-smoke-report.json`,
  `glassmatrix-report.json`, and the JSON/Markdown automated-persona synthesis;
- `v2-browser-evidence`: the real-browser screenshots;
- `v2-development-preview`: a loopback-playable, commit-bound review artifact, produced
  only after the v2 browser smoke passes; `publishable:false` prevents remote execution.

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
5. passes the explicit `--approved-publication-candidate` producer flag and uploads
   evidence plus that candidate for 14 days;
6. has only `contents: read` permission—no Pages token, deployment token, repository write,
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
7. open the HTTPS URL and confirm the DEV banner shows the same short commit;
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
