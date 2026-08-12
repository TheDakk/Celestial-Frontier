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
  `--approved-publication-candidate`; PR #11's one-time, explicitly Nick-approved local
  bootstrap may pass the same flag from its clean pushed head. The flag binds
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

`preview:verify` proves package integrity and the safety metadata. It does not assert that a
commit is still the newest development commit. The full 40-character commit and
exact `source.buildInput.tree` plus `contentSha256` in `preview.json` are the authority;
filenames and a mutable “latest” link
are conveniences only. These hashes detect drift under the repository's trusted producer;
they are not a cryptographic signature against a malicious party that rewrites the package,
manifest, and hashes together. Download publication candidates from the named trusted Actions
run and retain that run URL with the playtest report.

## CI and publication flow

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
