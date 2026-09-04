# PR #35 — cc4d7c9 local proof and bounded robustness (2026-09-04 UTC)

## Authority and source boundary

Nick authorized Part A once/in order, stop on any product/instrument red; then four
coverage-neutral robustness items, existing verification, documentation, signed commit and normal
`openai/mac` push. No label, dispatch, PR metadata change, merge, release or deploy is authorized.

Verified ownership: **OpenAI/Codex on macOS**, physical root
`/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
**origin/openai/mac**. Startup and Part A were clean at
**cc4d7c920083c3c630a9c8c8e6fc5a6e40f5e0d4**, tree
`976027042d01f87ace54d57eafe0363cd685e415`. Fresh remote fetch confirmed this head and
base **7a9f4c1370dd84292388d718c38ff34214f6203b**. Source working-tree content hash in
every Part A report is `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.

SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`; last authenticated account
**TheDakk**; fresh fetch/repository read PASS. GitHub visibility PUBLIC; budget UNFROZEN,
private fallback cap 3,000, no hosted authority. PR #35 Ready/open/mergeable, labels empty.
Its current metadata is not changed by this branch-only authorization.

Exact external input is retained as [the review](PR35_CC4D7C9_FORENSIC_REVIEW_20260904.md):
16,017 bytes, SHA-256
`706563f4ddb78b2ed23eb744d1e28e837c5349b79b9f7b4d9f73e32e0dfb1ae0`.
The review is evidence, not independent permission to expand the batch.

## Part A — performed before any source or documentation edits

All browser executions completed once with zero product findings and zero instrument failures.
No product/instrument red occurred and no such result was retried. Slice contains its own named
evidence validation. Full Glass's writer/terminal verifier, explicit named verifier and diagnostic
projection all accepted the real v2 PASS carrier.

| Execution | Immutable run ID | Duration ms | Report SHA-256 |
|---|---|---:|---|
| develop Slice | `20260904025322131-97983-4d9021b5767b` | 369040 | `896837e71e130edcd556f2ffac0e88fb646690ed5b5696b2859088cfed237730` |
| full 12-row Glass | `20260904030025751-98655-51d159101e76` | 116676 | `b84b2956b37cf2b57eea28edb14e6b3c78ece7c22017dbae49a6424892fc319c` |
| targeted small-phone | `20260904-pr35-cc4d7c9-small-phone` | 16377 | `459cffe647ab40ca23788c47a18d33d960b7d61f0119a52a35c99f4e5f181dcf` |
| targeted compact-phone | `20260904-pr35-cc4d7c9-compact-phone` | 12710 | `65adc60ed3ff36218b9e093b154a90382294e88dee1d11f5023756fe7df50c1d` |
| targeted primary-phone | `20260904-pr35-cc4d7c9-primary-phone` | 17184 | `407ea8ab03484218014709713ce7a4367460252bb64e652c607d976c38bb473e` |
| targeted large-phone for real Chrome jq | `20260904-pr35-cc4d7c9-large-phone` | 13013 | `75dcd00fb6127e8fbfe0b56b695a1e95079a6576e0f39d7d0e15bcceedef7818` |

The full matrix's row durations, in its sealed order, are 10988, 9108, 13340, 9458, 9632, 9456,
9512, 8392, 9227, 8360, 8277 and 8615 ms. Chrome targeted viewport-only durations are 14153,
10450, 14877 and 10829 ms respectively; total report durations above also include setup.

### Named verification and projection

- `node tools/glassmatrix.mjs --verify-run=20260904030025751-98655-51d159101e76 --slice-run=20260904025322131-97983-4d9021b5767b --profile=develop`:
  **PASS**, 1.65 s wall time; report and exact predecessor hashes are the table above.
- `GITHUB_STEP_SUMMARY=<fresh mktemp> node tools/glassmatrix-diagnostic.mjs --glass-run=20260904030025751-98655-51d159101e76 --slice-run=20260904025322131-97983-4d9021b5767b --profile=develop`:
  **PASS**, 1.49 s. Raw report **1,052,897 bytes**, deterministic gzip **95,047 bytes**,
  base64 **126,732 / 700,000 bytes (18.10%)**; remaining carrier margin **573,268 bytes**.
  Full summary **129,124 / 900,000 bytes**. Summary SHA-256
  `8f4cdea520e3684d178e4c9ccb33447f355b675ae4ee5fbca9af25656841a2f2`;
  raw report gzip SHA-256
  `f305c373b16c3abc1fcaa569e9d71e0ad207ba6c19006de3a1f6988b92868811`.

### Exact workflow jq replay and browser provenance

The extraction is the existing `glassPreflightJqFilter` algorithm from
`tests/scenemem-workflow.test.ts`: unique named step, exact opening/closing delimiter lines,
strip ten spaces. Expected viewport/control scalars come from that same workflow step.
Each real report is passed unchanged with the same six `--arg` / `--argjson` values as the
existing test and `jq -e`. No alternative verifier or adjusted product/provenance fixture exists.

- Replay identifier: `20260904-pr35-cc4d7c9-jq-replay`.
- Original workflow SHA-256:
  `d95bf9dfcc29c0c97a715a994d22c3cea2d426f46fdf20d0b184048aff6a21d3`.
- Filter SHA-256:
  `f437b8c75a49de302c0fc9fcfd8882f074909697a8448ef2aa9ef7550324aeac`.
  The Part B diff does not modify the filter.
- Small/large actual jq verdicts: **true / exit 0**, **12 ms / 10 ms**.
  Replay log SHA-256:
  `37710c0e1ec1fa0d62daa52cacdc8104dcfc8fc8db8d5684df44ba34f6cca0eb`.
- Slice/full Glass: installed Edge **152.0.4191.62**, CDP **1.3**, executable
  `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`. Glass revision
  `@98614824c284c7a332f949435bc56c0107ee732f`, JS `15.2.23.8`.
- Targeted rows: official isolated **Chrome for Testing 152.0.7977.82**, CDP **1.3**,
  canonical executable
  `/private/tmp/pr35-cc4-chrome.ld4vbi/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`.
  Complete UA/revision/JS are retained in each report.
- No installed Chrome/Chromium was available. The earlier large-phone report truthfully says
  `Edg/152.0.4191.53` and cannot satisfy the workflow's Chrome-only product clause.
  Therefore one additional genuine Chrome large row was necessary; the old report was not altered.
  Official manifest selected
  `https://storage.googleapis.com/chrome-for-testing-public/152.0.7977.82/mac-arm64/chrome-mac-arm64.zip`;
  archive SHA-256 `6a12c6e76fcd0dc44accc8d28e93caa44ead57b71b8e0cac891bc3152a709790`.
  This temporary test runtime is not a repository pin, rebaseline or system installation.

Setup facts are retained rather than presented as product results: the official testing app is
ad-hoc/linker-signed, with no sealed resource bundle; a supplementary `codesign --verify --deep`
check returned 1, so publisher-signature verification is **not claimed**. Its version and real
browser executions succeeded. The first jq invocation's browser resolver refused Seatbelt
**before jq executed**; the normal approved external invocation then executed each verdict once.
No report was replaced and no browser was rerun. Chrome requested keychain access; the user was
told to Deny/Cancel, no password was requested, no keychain setting was changed, and a process
check confirmed no temporary Chrome process remained.

## Part B — exact coverage-neutral implementation

1. `.github/workflows/test.yml`: existing changed-input Glass timeout **5 → 7**; exactly three
   literal pins in `scenemem-workflow.test.ts` synchronized, including the existing rejected-50
   control.
2. Existing pinned Edge package curl adds `--retry 3 --retry-all-errors --retry-delay 5`.
   Edge **151.0.4129.101**, URL, SHA-256
   `bd7604025424914a61c06293cb6bf269141a29d8c54cf1997110bc96d3365d60`, extraction,
   battery topology/caps and all product/instrument no-retry rules remain unchanged.
   Two existing literal assertions/mutation anchors in `compendiummem-browser-preflight.mjs`
   must match the download command; no new controls were created.
3. Glass exposes the existing debounce count in its Shipyard settlement projection and requires
   both persistence counters to equal zero. `pendingPersistenceWrites` is from
   `state.sceneResources`; `pendingDebounceWrites` is read from the existing
   `__smokeSettingsPersistenceDiagnostics()` getter. The existing green fixture gains only
   that value. An initial wrong-source lookup was found by independent source review and fixed
   before a live successor attempt; product code and exported API are unchanged.
4. `command -v jq >/dev/null` is first in the preflight run block, before `set -euo pipefail`.

Independent final code review: **CLEAR**. No new schema, verifier, test inventory, control,
product/instrument retry, rebaseline, browser pin, gameplay feature or UI/content change.
The optional post-PASS catch rewrite and other hygiene ideas remain deliberately out of scope.
Mandatory upload remains hard-fail; no infrastructure success guarantee is claimed.

### Verification after implementation

Commands have no native run IDs; the labels below identify their retained audit executions.

| Audit execution | Result | Wall seconds | Raw log SHA-256 |
|---|---|---:|---|
| CHECK_PROFILE: `node tools/check-profile.mjs --profile=develop` | 268 files; 2,785 pass / 1 skip; 3 typechecks; art/override/spec PASS | 43.01 | `a14f489e417dc4124c44abababeaf545a161c6b4a6bf686bf08db0055676a6f5` |
| ACTIONS: `node tools/actions-budget-policy.js --selftest` | 66/66 PASS | 0.07 | `98b120d9c7601c52781abe14f5433f25accc88104116ce599ad88ad7ee7e14b9` |
| GLASS: `node tools/glassmatrix.mjs --selftest` | PASS | 1.74 | `65318bfd545a9c1e752669a75faca7802acde4f981eceec4707dcb22650b4db0` |
| EDGE_PREFLIGHT: `node tools/compendiummem-browser-preflight.mjs --selftest` | existing exact-command/decoy owner PASS | 0.07 | `ae65c072e5cf91cc195f126edd532c080c7f1ea958c5e0bb9b7caa4997ec2bb2` |
| VALIDATE: `node tools/validate.js` | 1,010 renders; 50-probe original fingerprint; zero boot errors PASS | 12.21 | `493d8badb6a90d7b4328e94568e97772d8fd4621fa809785433396cc62fab587` |

CHECK_PROFILE completed on the initial patch before the debounce getter correction. All other
listed checks and final source review cover the corrected code. The requested clean tracked-input
rehearsal executes the complete develop profile on the final committed source, not this earlier
working-tree result. It necessarily follows the commit because the tool rejects uncommitted code.
The final Git handoff records its full tested head, wall duration and exact log digest, together
with push verification. No repeat browser battery is authorized or needed for this bounded batch.

### Final changed-code digests (SHA-256)

- `.github/workflows/test.yml`: `b7caae906e1e2e019ecbe5c367345ee8c2a2c6817a3c09849dc2d9e8155c5e0e`
- `port/v2/tools/glassmatrix.mjs`: `1b3d8676ca3b3b055bc72efac1e075bc5a68fb73dca3c0dae77929378e5ef9e9`
- `port/v2/tools/compendiummem-browser-preflight.mjs`: `c16f422364f399d4542dc052e16440fb9cb18e0667d1244b1c734cd8f9946cc8`
- `port/v2/tests/scenemem-workflow.test.ts`: `045463bea0160ba8e822827d2f567b5efd573b7131fb5cbebf8a3906a0c4f8d7`

## Retained artifacts

Individual gzip carriers use level 9 / mtime 0 and restore the original bytes. The screenshot
tarball retains all ten exact Slice PNG paths from its manifest. Keep extraction in a fresh
directory; never overwrite the mutable current pointers or reinterpret old source identity.
The original ignored `port/v2/apps/game/smoke/` artifacts also remain in this local worktree.

| Retained carrier | Compressed bytes | SHA-256 of retained file |
|---|---:|---|
| `PR35_CC4D7C9_20260904_ACTIONS.log.gz` | 100 | `a8bcd4e68b267470d3958efc576686bc4159b51d8f3a4dff113a4aaf5e27b98a` |
| `PR35_CC4D7C9_20260904_CHECK_PROFILE.log.gz` | 2092 | `691d6963c93a287a2c5125fd07773ead6af47aefe1b714d675e8acb208631cfb` |
| `PR35_CC4D7C9_20260904_EDGE_PREFLIGHT.log.gz` | 706 | `d309e2218c30b884c4d28a3ccc5e37c658542fa701247b5816ba628d0031286c` |
| `PR35_CC4D7C9_20260904_GLASS.log.gz` | 580 | `a0a6d542e4f79347b7e83a7410dc54c391b2ccf72f82dfbf2f49f3acbb6b0e43` |
| `PR35_CC4D7C9_20260904_GLASS_COMPACT_PHONE.json.gz` | 11279 | `126583113315f7e4cf02a545b5efae2ec91839382bdcc2963ebc90eb6ec04e05` |
| `PR35_CC4D7C9_20260904_GLASS_FULL.json.gz` | 95047 | `f305c373b16c3abc1fcaa569e9d71e0ad207ba6c19006de3a1f6988b92868811` |
| `PR35_CC4D7C9_20260904_GLASS_LARGE_PHONE.json.gz` | 12572 | `ae42301390bdcd95d0421204ed6d3aed5e0d9102818cf44c8d7dd6e04d3aff32` |
| `PR35_CC4D7C9_20260904_GLASS_PRIMARY_PHONE.json.gz` | 11281 | `371874c9d395290f1468b4485ed98d2484b013def7b0b5f78f33d3839ab00a26` |
| `PR35_CC4D7C9_20260904_GLASS_SMALL_PHONE.json.gz` | 11768 | `3a5d37e1a6c8a4b83aef11602e197640c5bf453b758691ef7947aa4b2b2fb7d8` |
| `PR35_CC4D7C9_20260904_GLASS_SUMMARY.log.gz` | 94884 | `5011514169742ca9a663d445c31932dc91d67d87e54e61ac1ea7c0ee4d2909cd` |
| `PR35_CC4D7C9_20260904_JQ_REPLAY.log.gz` | 429 | `d3f9a5dbf41fbcb5405c28930e76d6f111486a9ed152de560fcadf93cf3722f5` |
| `PR35_CC4D7C9_20260904_SLICE.json.gz` | 1964 | `ceb444905c2dd08574fda49fc818686c69ed4fb94bb2daf8dc94f79c812d3b90` |
| `PR35_CC4D7C9_20260904_SLICE_LOG.log.gz` | 3290 | `43c31b27a9ba6e46add34a8d04cc725520838b4cd5b67a880c987c40b8295de3` |
| `PR35_CC4D7C9_20260904_SLICE_SCREENSHOTS.tar.gz` | 4642473 | `50588a599d057abda2a30bf50b208d7e3a960e7855e06c08c2dc2000365c3cc3` |
| `PR35_CC4D7C9_20260904_VALIDATE.log.gz` | 758 | `54c26149891f284990bc4c41e2f2a677e370ad3fea9bbc8fc9caddb591e28033` |

## Review/handoff boundary

Current source/docs will be signed and the final clean tracked-input rehearsal must pass before
the authorized fast-forward push. The final exact commit hash cannot be embedded in itself;
read the final Git handoff and `git ls-remote origin refs/heads/openai/mac`.
This audit records ancestor browser proof and final changed-code hashes, not an invented
descendant browser certificate. The final rehearsal's log is retained locally at
`port/v2/apps/game/smoke/pr35-cc4-final-tracked-input.log` and its duration/digest are reported
with the final head. No audit-only commit is made afterward merely to chase its own identity.

**OpenAI/Codex:** final rehearsal, branch push, full SHA check; then stop. **Anthropic/Claude
Code:** read-only review of PR #35 / remote `openai/mac` after push; do not edit that branch or
copy changes. After a separately authorized terminal-green PR #35 merge, synchronize a clean
`anthropic/*` branch from `origin/develop` for polish. Nick may open Claude after the verified
push. PR metadata is still pending a future explicitly authorized refresh.

PR #35 base **develop**, source **openai/mac**. Copy-ready title:
`feat(v2): complete roadmap campaign and harden action-time CI evidence`.
Description: “Completes the existing V2 roadmap; preserves the fifteen-stop history and Claude's
cc4d7c9 review; proves real Slice/full Glass and workflow-jq paths locally; adds only canary
margin, pinned-download transport resilience, jq availability and debounce-aware Shipyard
settlement. Static/selftest evidence is retained, with final exact tracked proof in the Git
handoff. Not yet merged into develop; no release or deployment.”

Future authority must name `test-battery`, PR #35, the final full head and base
`7a9f4c1370dd84292388d718c38ff34214f6203b`, `actions-budget-approved`,
**122 total runner-minutes maximum**, **one attempt/no retry**, merge only if terminal green.
No such authorization exists now. `develop`, `main`, and the live site remain unchanged.
