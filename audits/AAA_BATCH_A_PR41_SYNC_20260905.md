# Batch A — PR #41 sync and durable private source handoff

OpenAI/Codex · macOS · 2026-09-05 · owned `openai/mac` checkout.
This is audiovisual source/tool readiness, separate from the completed gameplay Batch 4.

## Sync and verification

Signed real merge **`bc211bef1f4def92a27933b7c79a090d8913fae4`** joins clean
`84b6f22d2e6ecc948d161b33bb02feda2f11abf9` with verified origin/develop
`c1791e210158de864fdd475323c3091d9ecbae58`. Pushed and synchronized to origin/openai/mac.
Both parent handoffs and differing archive records remain verbatim in ROADMAP_ARCHIVE.md;
README/review-disposition records retain historical scope below the landed Batch 4 state.
No history rewrite. Runtime, tests, tools, producer pins, workflows, Actions policy code and
protected artlock references match develop. No product/UI edit was made during this sync.

Root main.js and unrelated Finder metadata were preserved outside the checkout. The bootstrap
was absent before, throughout and after the checks; no worker or selection override was set.
The exact committed source stayed clean and unchanged. Commands from port/v2 ran once:

| Command | Result | Duration | Log SHA-256 |
| --- | --- | --- | --- |
| `npm run typecheck` | PASS | 2.423 s | `4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e` |
| `npm run artunused` | PASS | 1.330 s | `0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b` |
| `npx vitest run` | PASS; 301 files / 3,100 passed / 1 skipped | 45.079 s | `86d964935e723a1d5328d735a5d169c891450468a060bfafdfdf127724dbb9ec` |

The existing PROCESS_LAWS.md ignored-input law is refreshed with Nick's named
`test-support/tracked-v1-source.ts` owner and required absent-main.js suite verification
before any hosted attempt. No additional browser/profile/policy check was run for this sync.

Nick's supplied Claude handoff records PR #41 RED run 33976307813 (3m29s), then GREEN
33977956355 (8m10s) on 05c1d7f, merged at 16:55:06 UTC into c1791e2. Label removed;
merge triggered nothing. These facts are attributed to that handoff, not independently
replayed hosted logs. V2 starts fresh, no player import door; the draft now has 79 outcomes.

## Batch A source work

Existing source/evidence was consolidated into a durable private local working folder outside
public Git and app-private scratch, logical bundle `cf-batch-a-readiness-sources-20260905`.
No original source was changed or removed. The private index maps old/new locations; the
public evidence contains logical IDs, lengths and hashes only.

| Preserved group | Files | Bytes |
| --- | --- | --- |
| ship-original | 7 | 817,965 |
| ship-terminal | 5 | 811,770 |
| lanternback-source | 8 | 2,801,216 |
| lanternback-outputs | 5 | 4,954,132 |
| audio | 10 | 1,345,968 |

All **35/35 files**, totaling **10,731,051 bytes**, were SHA-256 read-back verified;
**23 prior manifest references** also matched. The two new private metadata files are
additional to those copied bytes: index 8,283 bytes; restore notes 2,681 bytes. Full content
and metadata hashes are in the adjacent JSON. No raw source, master, media or log enters Git.

Restore notes identify the current gaps: ship recipes retain scratch output paths; Lanternback
keeps its relative ecosystem.py dependency but absolute app-private output paths; REAPER/Lua
retain scratch outputs and a historical command expects excluded config/reaper.ini. Audio
preserves embedded MIDI and Surge instrument/effects state, with no external recording input;
its browser verifier imports browsercdp.mjs through the original absolute repository path.
Application/plugin binaries, registration and user configuration are excluded. Resolve these
paths in a separate future working copy before a portable replay; originals stay immutable.

This is local preservation, **not independent backup**. No destination is yet selected or
verified. Nick has been asked to name an existing drive/location; next, copy the whole bundle
there and verify read-back bytes before closing that prerequisite. No app launch, rerender,
browser probe, upload or new instrument was needed. This batch does not claim portable replay,
canonical creature coverage, human listening, Safari/iPhone or integrated-pilot acceptance.

## Scope and paired handoff

128 MiB complete installed-pack / 256 MiB aggregate update-payload policy remains reserved,
with enforcement and device acceptance open. Offline means a complete ready installed PWA
while storage is retained. Later B–D still requires all eight body plans at 132/300/440,
static and animated; unfaithful families keep static portraits and remain incomplete.
Top bar/dock/rails leads Phase 2 only after the integrated pilot approval stop.

Codex has pushed the sync and records this source handoff in a signed docs-only successor.
The final user handoff names its pushed SHA. Independent backup remains the next bounded
Batch A prerequisite. Claude's anthropic/mac c860f57 and unmerged 173c806 negative control
are untouched; Claude owns their later reconciliation. Audiovisual-only records are still
on openai/mac, not develop. No manual copying or new PR is requested; no need to open Claude now.

Nick's artlock CI lane, ITP save protection and confirmation of DECISIONS row 19 wording
remain open. Budget UNFROZEN, PUBLIC per Nick, private fallback 3,000; zero hosted attempts
remain authorized. Branch pushes trigger no workflow. No PR, label, remote merge, purchase,
protected-portrait change, Phase 2, release or deployment was performed.
